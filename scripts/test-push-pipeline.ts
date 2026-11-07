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
