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

function runPipeline(work: string, args: string[], deploy: string): RunResult {
  const result = spawnSync(TSX, [DRIVER, ...args], {
    cwd: work,
    encoding: "utf-8",
    env: {
      ...process.env,
      HOLONOVEL_PIPELINE_ROOT: work,
      HOLONOVEL_PIPELINE_STUB: "1",
      HOLONOVEL_DEPLOY_DIR: deploy,
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
  writeFileSync(join(work, "README.md"), "# fixture\n");
  writeFileSync(join(work, ".gitignore"), ".holonovel-state/\n");
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
    check("deploy clone landed on the published head", git(deploy, ["rev-parse", "HEAD"]) === git(work, ["rev-parse", "HEAD"]));
    check("run summary reports deploy", full.output.includes("deploy=true"));

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
      "--stage deploy lands the deploy clone without a commit",
      deployOnly.status === 0 && deployOnly.output.includes("deploy=true"),
      deployOnly.output.split("\n").slice(-3).join(" | "),
    );

    const cleanCommit = runPipeline(work, ["--only", "commit"], deploy);
    check(
      "--only commit on a clean index is a no-op",
      cleanCommit.status === 0 && cleanCommit.output.includes("nothing new to commit"),
      cleanCommit.output.split("\n").slice(-3).join(" | "),
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

  console.log(`\n${results.length - failures} passed, ${failures} failed`);
  process.exit(failures > 0 ? 1 : 0);
}

try {
  main();
} catch (error) {
  console.error(`test-push-pipeline: fatal: ${(error as Error).message}`);
  process.exit(2);
}
