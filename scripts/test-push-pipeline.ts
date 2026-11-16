#!/usr/bin/env npx tsx
/**
 * test-push-pipeline.ts — hermetic harness for the publication pipeline. [gate]
 *
 * Purpose: the pipeline used to be tested only against production, so every
 * defect was discovered by a failed publish. This harness builds a disposable
 * repository with a bare remote and a deploy clone, stubs the project toolchain
 * (HOLONOVEL_PIPELINE_STUB=1), and exercises the control flow: happy path,
 * local-only commit, push, deploy, resume after a failed step, and preflight
 * rejection. No network, no npm publish, no real deploy.
 *
 * Usage: npx tsx scripts/test-push-pipeline.ts
 * Exit codes: 0 = every case passed, 1 = a case failed, 2 = fatal.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { handleHelp, rejectUnknown } from "./lib/args.js";
import { readServers } from "./lib/servers.js";
import { deniedPaths, leftovers, scanAddedLines } from "./lib/publish-guards.js";
import { describePublishRun } from "./lib/publish-state.js";

const ROOT = join(import.meta.dirname, "..");
const TSX = join(ROOT, "node_modules", ".bin", "tsx");
const DRIVER = join(ROOT, "scripts", "publish", "run.ts");
const BASE = "/tmp/opencode";

const USAGE = `Usage: npx tsx scripts/test-push-pipeline.ts [--keep]

  --keep  Keep the scratch directory for debugging.
  --help  Show this message.
`;

let failures = 0;
const results: string[] = [];

function check(name: string, condition: boolean, detail = ""): void {
  if (condition) {
    results.push(`PASS ${name}`);
    console.log(`PASS ${name}`);
  } else {
    failures++;
    results.push(`FAIL ${name}${detail ? ` — ${detail}` : ""}`);
    console.error(`FAIL ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

function git(cwd: string, args: string[]): string {
  return execFileSync("git", args, { cwd, encoding: "utf-8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function tryGit(cwd: string, args: string[]): string | null {
  try {
    return git(cwd, args);
  } catch {
    return null;
  }
}

interface RunResult {
  status: number;
  output: string;
}

function runPipeline(work: string, args: string[], deploy: string, extraEnv: NodeJS.ProcessEnv = {}): RunResult {
  const result = spawnSync(TSX, [DRIVER, ...args], {
    cwd: work,
    encoding: "utf-8",
    env: {
      ...process.env,
      HOLONOVEL_PIPELINE_ROOT: work,
      HOLONOVEL_PIPELINE_STUB: "1",
      HOLONOVEL_DEPLOY_DIR: deploy,
      ...extraEnv,
    },
  });
  return { status: result.status ?? 1, output: `${result.stdout ?? ""}${result.stderr ?? ""}` };
}

function buildFixture(base: string): { remote: string; work: string; deploy: string } {
  const remote = join(base, "remote.git");
  const work = join(base, "work");
  const deploy = join(base, "deploy");

  git(base, ["init", "--bare", "-q", "--initial-branch=main", remote]);
  git(base, ["clone", "-q", remote, work]);
  git(work, ["checkout", "-q", "-B", "main"]);
  writeFileSync(join(work, "package.json"), `${JSON.stringify({ name: "fixture", version: "2026.11.7" }, null, 2)}\n`);
  writeFileSync(
    join(work, "CHANGELOG.md"),
    "## 2026-11-07 — Harness fixture\n\n- A disposable increment used by the pipeline harness.\n",
  );
  mkdirSync(join(work, "scripts", "lib"), { recursive: true });
  writeFileSync(join(work, "scripts", "lib", "servers.json"), `${JSON.stringify(readServers())}\n`);
  // REQ-428 — preflight validates the registry manifest, so the fixture carries
  // the committed manifest and schema.
  mkdirSync(join(work, "holonovel", "schemas"), { recursive: true });
  writeFileSync(join(work, "holonovel", "server.json"), readFileSync(join(ROOT, "holonovel", "server.json")));
  writeFileSync(
    join(work, "holonovel", "schemas", "mcp-server.schema.json"),
    readFileSync(join(ROOT, "holonovel", "schemas", "mcp-server.schema.json")),
  );
  writeFileSync(join(work, "README.md"), "# fixture\n");
  writeFileSync(join(work, ".gitignore"), ".holonovel-state/\nholonovel/holonovel.md\n");
  // The embedded spec copy is generated, not tracked: the deploy step restores
  // it after a spec-only pull, so the fixture carries the source spec and the
  // emitter the step invokes.
  writeFileSync(join(work, "holonovel.md"), "# fixture spec\n");
  mkdirSync(join(work, "holonovel", "scripts"), { recursive: true });
  writeFileSync(
    join(work, "holonovel", "scripts", "embed-spec.mjs"),
    readFileSync(join(ROOT, "holonovel", "scripts", "embed-spec.mjs")),
  );
  git(work, ["config", "user.name", "Harness"]);
  git(work, ["config", "user.email", "harness@example.invalid"]);
  git(work, ["add", "-A"]);
  git(work, ["commit", "-q", "-m", "2026-11-07 — Harness fixture"]);
  git(work, ["push", "-q", "-u", "origin", "main"]);

  git(base, ["clone", "-q", remote, deploy]);
  return { remote, work, deploy };
}

function main(): void {
  const argv = process.argv.slice(2);
  handleHelp(argv, USAGE);
  rejectUnknown(argv, new Set(["--keep", "--help", "-h"]), USAGE);
  const keep = argv.includes("--keep");

  if (!existsSync(TSX)) {
    console.error(`test-push-pipeline: tsx not found at ${TSX}`);
    process.exit(2);
  }
  mkdirSync(BASE, { recursive: true });
  const base = mkdtempSync(join(BASE, "pipeline-"));
  const { work, deploy } = buildFixture(base);

  try {
    // Case 1 — local-only commit, then re-run is a no-op.
    writeFileSync(join(work, "NEW.md"), "change\n");
    const first = runPipeline(work, ["--yes", "--no-push", "--allow-untracked"], deploy);
    check("no-push run exits 0", first.status === 0, first.output.split("\n").slice(-3).join(" | "));
    const subject = tryGit(work, ["log", "-1", "--format=%s"]) ?? "";
    check("commit subject is derived from the CHANGELOG heading", subject === "2026-11-07 — Harness fixture", subject);
    check("run record written", existsSync(join(work, ".holonovel-state", "publish-run.json")));

    const second = runPipeline(work, ["--yes", "--no-push", "--allow-untracked"], deploy);
    check("re-run on an unchanged tree is idempotent", second.status === 0 && second.output.includes("nothing new to commit"));

    // Case 2 — full path: tag, push to the bare remote, deploy.
    const full = runPipeline(work, ["--yes", "--allow-untracked"], deploy);
    check("full run exits 0", full.status === 0, full.output.split("\n").slice(-3).join(" | "));
    check("push reached the bare remote", (tryGit(base, ["--git-dir", join(base, "remote.git"), "rev-parse", "main"]) ?? "") === git(work, ["rev-parse", "HEAD"]));
    check("T467/REQ-398: deploy clone landed on the published head", git(deploy, ["rev-parse", "HEAD"]) === git(work, ["rev-parse", "HEAD"]));
    // T491/REQ-418 — this run is stubbed, so verification did not run and the
    // summary must not claim a completed deploy (F-P6b-13).
    check("a stubbed verification does not report a completed deploy", full.output.includes("deploy=false"), full.output.split("\n").slice(-2).join(" | "));

    // Case 2c — T18/REQ-394: a dry run prompts for nothing on a non-interactive
    // stdin, stops before staging, and leaves the repository state untouched.
    const dryHead = git(work, ["rev-parse", "HEAD"]);
    const dry = runPipeline(work, ["--dry-run", "--allow-untracked"], deploy);
    check("a dry run needs no --yes on a non-interactive stdin", dry.status === 0, dry.output.split("\n").slice(-3).join(" | "));
    check("a dry run stops before staging", dry.output.includes("stopping before staging"), dry.output.split("\n").slice(-3).join(" | "));
    check(
      "T18/REQ-394: a dry run leaves HEAD and the working tree unchanged",
      git(work, ["rev-parse", "HEAD"]) === dryHead && git(work, ["status", "--porcelain"]) === "",
    );

    // Case 2b — T465/REQ-396: ignored state is preserved, untracked state is refused.
    const ignoredState = join(deploy, "holonovel", ".holonovel-state");
    mkdirSync(ignoredState, { recursive: true });
    writeFileSync(join(ignoredState, "novel.json"), "{}\n");
    const ignoredRun = runPipeline(work, ["--yes", "--only", "deploy"], deploy, { TTRPG_DATA_DIR: ignoredState });
    check(
      "T465/REQ-396: ignored in-tree state does not block the deploy",
      ignoredRun.status === 0 && ignoredRun.output.includes("gitignored — preserved"),
      ignoredRun.output.split("\n").slice(-3).join(" | "),
    );

    const untrackedState = join(deploy, "holonovel", "state");
    mkdirSync(untrackedState, { recursive: true });
    writeFileSync(join(untrackedState, "novel.json"), "{}\n");
    const refusedRun = runPipeline(work, ["--yes", "--only", "deploy"], deploy, { TTRPG_DATA_DIR: untrackedState });
    check(
      "T465/REQ-396: untracked in-tree state is refused before any removal",
      refusedRun.status === 1 &&
        refusedRun.output.includes("deploy-refused") &&
        refusedRun.output.includes(untrackedState),
      refusedRun.output.split("\n").slice(-3).join(" | "),
    );
    check("T465/REQ-396: the refused state file is still present", existsSync(join(untrackedState, "novel.json")));
    rmSync(join(deploy, "holonovel"), { recursive: true, force: true });

    // Case 3 — preflight rejects staged work before any write.
    writeFileSync(join(work, "staged.md"), "staged\n");
    git(work, ["add", "staged.md"]);
    const blocked = runPipeline(work, ["--yes"], deploy);
    check("preflight rejects staged changes", blocked.status === 1 && blocked.output.includes("preflight"), blocked.output.split("\n").slice(-3).join(" | "));
    git(work, ["reset", "-q", "HEAD", "staged.md"]);
    rmSync(join(work, "staged.md"), { force: true });

    // Case 4 — failure at push, then resume without repeating earlier steps.
    // Create a new commit so there is something to push.
    writeFileSync(join(work, "LATER.md"), "later\n");
    git(work, ["add", "LATER.md"]);
    git(work, ["commit", "-q", "-m", "2026-11-07 — Harness fixture later"]);
    const badRemote = join(base, "gone.git");
    git(work, ["remote", "set-url", "origin", badRemote]);
    const failed = runPipeline(work, ["--yes", "--only", "push_repo"], deploy);
    check("push failure is reported", failed.status === 1);
    git(work, ["remote", "set-url", "origin", join(base, "remote.git")]);
    const resumed = runPipeline(work, ["--yes", "--only", "push_repo"], deploy);
    check("resume after a failed push succeeds", resumed.status === 0, resumed.output.split("\n").slice(-3).join(" | "));
    // Case 5 — staging guards: secret, deny-list, identity.
    check(
      "deny-list matches a private key path",
      deniedPaths(["secrets/id_rsa", "src/a.ts"]).length === 1,
    );
    check("leftover check reports the untracked path", leftovers("M  a.ts\n?? b.ts\n").length === 1);
    const secretLine = `token = sk-${"A".repeat(24)}`;
    const secretFindings = scanAddedLines(`+++ b/leak.txt\n@@ -0,0 +1 @@\n+${secretLine}\n`);
    check(
      "secret scan reports the added line",
      secretFindings.length === 1 && secretFindings[0]!.line === 1,
    );

    writeFileSync(join(work, "leak.txt"), `${secretLine}\n`);
    const secretRun = runPipeline(work, ["--only", "stage"], deploy);
    check(
      "a staged secret blocks the stage step",
      secretRun.status === 1 &&
        secretRun.output.includes("secret-pattern match") &&
        !secretRun.output.includes("A".repeat(24)),
      secretRun.output.split("\n").slice(-3).join(" | "),
    );
    git(work, ["reset", "-q"]);
    rmSync(join(work, "leak.txt"), { force: true });

    mkdirSync(join(work, "secrets"), { recursive: true });
    writeFileSync(join(work, "secrets", "id_rsa"), "not a real key\n");
    const deniedRun = runPipeline(work, ["--only", "stage"], deploy);
    check(
      "a deny-listed path blocks the stage step",
      deniedRun.status === 1 && deniedRun.output.includes("deny-listed"),
      deniedRun.output.split("\n").slice(-3).join(" | "),
    );
    git(work, ["reset", "-q"]);
    rmSync(join(work, "secrets"), { recursive: true, force: true });

    git(work, ["config", "user.name", ""]);
    git(work, ["config", "user.email", ""]);
    const noIdentity = runPipeline(work, ["--only", "preflight", "--no-push"], deploy);
    check(
      "preflight refuses a missing git identity",
      noIdentity.status === 1 && noIdentity.output.includes("user.name"),
      noIdentity.output.split("\n").slice(-3).join(" | "),
    );
    git(work, ["config", "user.name", "Harness"]);
    git(work, ["config", "user.email", "harness@example.invalid"]);

    writeFileSync(join(work, "staged.md"), "staged\n");
    git(work, ["add", "staged.md"]);
    const stagedPreflight = runPipeline(work, ["--only", "preflight", "--no-push"], deploy);
    check(
      "preflight rejects a staged change in a bounded run",
      stagedPreflight.status === 1 && stagedPreflight.output.includes("staged changes"),
      stagedPreflight.output.split("\n").slice(-3).join(" | "),
    );
    git(work, ["reset", "-q"]);
    rmSync(join(work, "staged.md"), { force: true });

    // Case 6 — partial ranges: repo stage commits without pushing, `--from
    // stage` resumes at stage, and `--stage deploy` lands without a new commit.
    const pushedBefore = git(work, ["rev-parse", "origin/main"]);
    writeFileSync(join(work, "RANGE.md"), "range\n");
    const repoStage = runPipeline(work, ["--yes", "--allow-untracked", "--stage", "repo", "--no-push"], deploy);
    check(
      "--stage repo commits without a push",
      repoStage.status === 0 && git(work, ["rev-parse", "origin/main"]) === pushedBefore,
      repoStage.output.split("\n").slice(-3).join(" | "),
    );

    writeFileSync(join(work, "FROM.md"), "from\n");
    const fromStage = runPipeline(work, ["--yes", "--allow-untracked", "--from", "stage", "--no-push"], deploy);
    check(
      "--from stage resumes at the stage step",
      fromStage.status === 0 && fromStage.output.includes("=== stage"),
      fromStage.output.split("\n").slice(-3).join(" | "),
    );

    const deployOnly = runPipeline(work, ["--yes", "--stage", "deploy"], deploy);
    check(
      "--stage deploy lands the published head without a commit",
      deployOnly.status === 0 &&
        git(deploy, ["rev-parse", "HEAD"]) === git(work, ["rev-parse", "origin/main"]) &&
        deployOnly.output.includes("deploy=false"),
      deployOnly.output.split("\n").slice(-3).join(" | "),
    );

    const stubVerify = runPipeline(work, ["--yes", "--only", "verify_deploy"], deploy);
    check(
      "T491/REQ-418: a stub verification reports deploy=false",
      stubVerify.status === 0 && stubVerify.output.includes("deploy=false"),
      stubVerify.output.split("\n").slice(-3).join(" | "),
    );

    // A spec-only pull changes neither the lockfile nor the source, so neither
    // `npm ci` (whose `prepare` hook emits the copy) nor the build runs. The
    // deploy step must still restore the generated embedded spec (REQ-105).
    writeFileSync(join(work, "holonovel.md"), "# fixture spec v2\n");
    const specDeploy = runPipeline(work, ["--yes"], deploy);
    const deployedCopy = join(deploy, "holonovel", "holonovel.md");
    check(
      "a spec-only deploy restores the embedded spec copy byte-identically",
      specDeploy.status === 0 &&
        existsSync(deployedCopy) &&
        readFileSync(deployedCopy, "utf-8") === "# fixture spec v2\n",
      specDeploy.output.split("\n").slice(-3).join(" | "),
    );

    const cleanCommit = runPipeline(work, ["--only", "commit"], deploy);
    check(
      "--only commit on a clean index is a no-op",
      cleanCommit.status === 0 && cleanCommit.output.includes("nothing new to commit"),
      cleanCommit.output.split("\n").slice(-3).join(" | "),
    );

    // Case 7 — T491/REQ-418: a genuinely divergent deploy clone fails the
    // fast-forward and the notice names the server.
    writeFileSync(join(work, "DIVERGE.md"), "remote\n");
    git(work, ["add", "DIVERGE.md"]);
    git(work, ["commit", "-q", "-m", "2026-11-07 — Harness fixture divergence"]);
    git(work, ["push", "-q", "origin", "main"]);
    git(deploy, ["config", "user.name", "Harness"]);
    git(deploy, ["config", "user.email", "harness@example.invalid"]);
    writeFileSync(join(deploy, "LOCAL.md"), "local\n");
    git(deploy, ["add", "LOCAL.md"]);
    git(deploy, ["commit", "-q", "-m", "local deploy commit"]);
    const diverged = runPipeline(work, ["--yes", "--only", "deploy"], deploy);
    check(
      "T467/T491/REQ-398/REQ-418: a non-fast-forward pull names the server and fails",
      diverged.status === 1 &&
        diverged.output.includes("deploy-failed") &&
        diverged.output.includes("holonovel"),
      diverged.output.split("\n").slice(-3).join(" | "),
    );
  } finally {
    if (keep) {
      console.log(`\nscratch kept at ${base}`);
    } else {
      try {
        rmSync(base, { recursive: true, force: true });
      } catch {
        // Scratch cleanup is best-effort; a leftover under /tmp/opencode is
        // harmless and must not turn a passing harness into a failure.
      }
    }
  }

  checkPublishStateRendering();
  console.log(`\n${results.length - failures} passed, ${failures} failed`);
  process.exit(failures > 0 ? 1 : 0);
}

// REQ-418 — the status line must never present a dry run as a publish. These
// are pure-function checks, so they do not need the scratch repository.
function checkPublishStateRendering(): void {
  const dry = describePublishRun({ dry_run: true, stopped_at: "record", started: "2026-11-16T00:00:00Z" });
  check("status renders a dry run as a dry run", dry.startsWith("dry run, stopped at record"), dry);
  const live = describePublishRun({ dry_run: false, stopped_at: "deploy" });
  check("status calls a live run a pipeline run", live.startsWith("pipeline run, stopped at deploy"), live);
  check("status never calls a record a publish", !`${dry}${live}`.includes("publish"));
  check("status reports an absent record as absent", describePublishRun(null) === "never recorded");
  check("status falls back to the last recorded step", describePublishRun({ steps: [{ id: "gates" }] }) === "pipeline run, stopped at gates");
}

try {
  main();
} catch (error) {
  console.error(`test-push-pipeline: fatal: ${(error as Error).message}`);
  process.exit(2);
}
