#!/usr/bin/env npx tsx
/**
 * run.ts — publication pipeline driver. [entry point]
 *
 * Runs the ordered step registry in scripts/publish/steps.ts, recording each
 * outcome to .holonovel-state/publish-run.json so a failed run can be resumed
 * instead of repeated from the top. Implements the publication contracts
 * REQ-394 (pending-update gate) and REQ-418 (deployment verification); the
 * shell entry point scripts/push-pipeline.sh keeps the operator-facing CLI.
 *
 * Usage: npx tsx scripts/publish/run.ts [flags]
 * Exit codes: 0 = every non-optional step passed; 1 = a required step failed;
 * 2 = fatal (bad flags, unreadable state).
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { handleHelp, parseFlag, parseValueFlag, rejectUnknown } from "../lib/args.js";
import { STEPS, type Ctx, type Flags, type Stage, type Status } from "./steps.js";

// HOLONOVEL_PIPELINE_ROOT lets the hermetic harness point the driver at a
// disposable repository. Unset in normal use.
const ROOT = process.env.HOLONOVEL_PIPELINE_ROOT ?? join(import.meta.dirname, "..", "..");
const RUN_PATH = join(ROOT, ".holonovel-state", "publish-run.json");

const USAGE = `Usage: npx tsx scripts/publish/run.ts [flags]

  --dry-run               Run every check, change nothing.
  --yes, -y               Skip the confirmation prompt.
  --no-push               Commit locally, then stop before tag/push/deploy.
  --allow-pending         Permit a pending update (REQ-394 escape hatch).
  --allow-untracked       Stage untracked non-ignored files.
  --allow-missing-deploy  Skip deploy verification when the clone is absent.
  --allow-stale-base      Classify the delta against a possibly stale origin.
  --full-tests            Always run the server harness suite.
  --auto-update           Execute the §6.7 update command.
  --from <step>           Start at a step (inclusive).
  --only <step>           Run exactly one step.
  --stage <stage>         Run one stage: repo|tag|release|docs|deploy.
  --resume                Skip steps already recorded as passed on this tree.
  --help                  Show this message.
`;

type Recorded = { id: string; status: Status; at: string; head: string };
interface RunRecord {
  schema_version: 1;
  started: string;
  head: string;
  steps: Recorded[];
}

function gitHead(): string {
  try {
    return execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: ROOT,
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    // No commits yet: resume never matches, which reruns rather than skips.
    return "";
  }
}

function readRun(): RunRecord | null {
  if (!existsSync(RUN_PATH)) return null;
  try {
    return JSON.parse(readFileSync(RUN_PATH, "utf-8")) as RunRecord;
  } catch {
    return null;
  }
}

function writeRun(record: RunRecord): void {
  mkdirSync(join(ROOT, ".holonovel-state"), { recursive: true });
  writeFileSync(RUN_PATH, `${JSON.stringify(record, null, 2)}\n`);
}

function resolveServers(): string[] {
  const path = join(ROOT, "scripts", "lib", "servers.json");
  return JSON.parse(readFileSync(path, "utf-8")) as string[];
}

function main(): void {
  const argv = process.argv.slice(2).flatMap((arg) => {
    const equals = arg.match(/^(--[a-z-]+)=(.+)$/i);
    return equals ? [equals[1], equals[2]] : [arg];
  });
  handleHelp(argv, USAGE);
  rejectUnknown(
    argv,
    new Set([
      "--dry-run", "--yes", "-y", "--no-push", "--allow-pending", "--allow-untracked",
      "--allow-missing-deploy", "--allow-stale-base", "--full-tests", "--auto-update",
      "--from", "--only", "--stage", "--resume", "--help", "-h",
    ]),
    USAGE,
  );

  const flags: Flags = {
    dryRun: parseFlag(argv, "--dry-run"),
    yes: parseFlag(argv, "--yes") || parseFlag(argv, "-y"),
    noPush: parseFlag(argv, "--no-push"),
    allowPending: parseFlag(argv, "--allow-pending"),
    allowUntracked: parseFlag(argv, "--allow-untracked"),
    allowMissingDeploy: parseFlag(argv, "--allow-missing-deploy"),
    allowStaleBase: parseFlag(argv, "--allow-stale-base"),
    fullTests: parseFlag(argv, "--full-tests"),
    autoUpdate: parseFlag(argv, "--auto-update"),
  };

  const from = parseValueFlag(argv, "--from");
  const only = parseValueFlag(argv, "--only");
  const stage = parseValueFlag(argv, "--stage") as Stage | null;
  const resume = parseFlag(argv, "--resume");
  if (stage && !["repo", "tag", "release", "docs", "deploy"].includes(stage)) {
    console.error(`run: unknown --stage value: ${stage}`);
    process.exit(1);
  }
  if (only && !STEPS.some((step) => step.id === only)) {
    console.error(`run: no step named ${only}`);
    process.exit(1);
  }
  if (from && !STEPS.some((step) => step.id === from)) {
    console.error(`run: no step named ${from}`);
    process.exit(1);
  }

  const head = gitHead();
  const previous = resume ? readRun() : null;
  const record: RunRecord = {
    schema_version: 1,
    started: new Date().toISOString(),
    head,
    steps: previous?.head === head ? previous.steps : [],
  };

  const ctx: Ctx = {
    root: ROOT,
    stub: process.env.HOLONOVEL_PIPELINE_STUB === "1",
    servers: resolveServers(),
    flags,
    deployDir: process.env.HOLONOVEL_DEPLOY_DIR ?? join(homedir(), "Holonovel-deployed"),
    state: {
      delta: {},
      base: "origin/main",
      checkRan: false,
      contractChanged: false,
      needTests: false,
      suite: "fast",
      verification: "",
      didCommit: false,
      didTag: false,
      didPush: false,
      didMirror: false,
      didWiki: false,
      didWikiMirror: false,
      didDeploy: false,
    },
    log: (message: string) => console.log(message),
  };

  const startIndex = from ? STEPS.findIndex((step) => step.id === from) : 0;
  let failed = 0;

  for (let index = 0; index < STEPS.length; index++) {
    const step = STEPS[index];
    if (index < startIndex) continue;
    if (only && step.id !== only) continue;
    if (stage && step.stage !== stage) continue;
    if (flags.dryRun && step.id === "stage") {
      ctx.log("[dry run] checks passed; stopping before staging");
      break;
    }
    if (flags.noPush && step.stage !== "repo") {
      ctx.log("[no-push] local work complete; skipping tag/release/docs/deploy");
      break;
    }

    const already = record.steps.find((entry) => entry.id === step.id && entry.status === "pass");
    if (resume && already) {
      ctx.log(`=== ${step.id}: already passed on this tree — skipped (--resume)`);
      continue;
    }

    ctx.log(`\n=== ${step.id} (${step.stage}) ===`);
    let status: Status;
    try {
      status = step.run(ctx);
    } catch (error) {
      status = "fail";
      ctx.log(`  ${(error as Error).message}`);
    }

    record.steps = record.steps.filter((entry) => entry.id !== step.id);
    record.steps.push({ id: step.id, status, at: new Date().toISOString(), head });
    writeRun(record);

    if (status === "fail") {
      if (step.optional) {
        ctx.log(`  ${step.id} failed (optional) — continuing`);
        continue;
      }
      failed++;
      ctx.log(`\nrun: FAILED at ${step.id}`);
      process.exit(1);
    }
  }

  ctx.log(
    `\nDone. commit=${ctx.state.didCommit} tag=${ctx.state.didTag} push=${ctx.state.didPush} ` +
      `mirror=${ctx.state.didMirror} wiki=${ctx.state.didWiki} wiki_mirror=${ctx.state.didWikiMirror} ` +
      `deploy=${ctx.state.didDeploy}`,
  );
  process.exit(failed > 0 ? 1 : 0);
}

try {
  main();
} catch (error) {
  console.error(`run: fatal: ${(error as Error).message}`);
  process.exit(2);
}
