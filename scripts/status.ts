#!/usr/bin/env npx tsx
/**
 * status.ts — report the release state a session needs before it closes.
 * [informational]
 *
 * Purpose: keep the loop visible outside the terminal scrollback — how much
 * work is unpushed, how old the oldest unpushed commit is, when the publish
 * pipeline last ran, and whether the roadmap still holds scheduled work.
 *
 * Role: informational (reports; always exits 0).
 * Exit codes: 0 = report printed, including when a source is unavailable;
 * 1 = unknown flag; 2 = fatal.
 *
 * Usage: npx tsx scripts/status.ts [--help]
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { handleHelp, rejectUnknown } from "./lib/args.js";

const USAGE = `Usage: npx tsx scripts/status.ts

Prints upstream, unpushed commits and their oldest age, the last publish run,
the package version against the latest tag, and the open roadmap items.

  --help   Show this message.
`;

const ROOT = join(import.meta.dirname, "..");

function git(args: string[]): string {
  return execFileSync("git", args, {
    cwd: ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();
}

function safe(label: string, fn: () => string): string {
  try {
    return fn();
  } catch {
    // Informational only: a missing remote or unreadable file must not turn
    // the status report into a failing gate.
    return `unavailable (${label})`;
  }
}

function humanAge(epochSeconds: number): string {
  const hours = (Date.now() / 1000 - epochSeconds) / 3600;
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 48) return `${hours.toFixed(1)}h`;
  return `${(hours / 24).toFixed(1)}d`;
}

function main(): void {
  const argv = process.argv.slice(2);
  handleHelp(argv, USAGE);
  rejectUnknown(argv, new Set(["--help", "-h"]), USAGE);

  const upstream = safe("upstream", () => git(["rev-parse", "--abbrev-ref", "@{u}"]));
  const unpushed = safe("unpushed", () => git(["rev-list", "--count", "@{u}..HEAD"]));
  const oldest = safe("oldest unpushed", () => {
    const line = git(["log", "--reverse", "--format=%ct", "@{u}..HEAD"]).split("\n")[0];
    return line ? humanAge(Number(line)) : "none";
  });
  const lastPublish = safe("last publish", () => {
    const path = join(ROOT, ".holonovel-state", "publish-run.json");
    if (!existsSync(path)) return "never recorded";
    const record = JSON.parse(readFileSync(path, "utf8")) as { started?: string };
    return record.started ?? "never recorded";
  });
  const version = safe("package version", () => {
    const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")) as {
      version: string;
    };
    return pkg.version;
  });
  const latestTag = safe("latest tag", () => git(["describe", "--tags", "--abbrev=0"]));
  const roadmapItems = safe("roadmap", () => {
    const path = join(ROOT, "ROADMAP.md");
    if (!existsSync(path)) return "0";
    const body = readFileSync(path, "utf8");
    const sections = body.match(/^## .+$/gm) ?? [];
    return String(sections.filter((line) => line !== "## Non-goals").length);
  });

  console.log("Release status");
  console.log(`  upstream:          ${upstream}`);
  console.log(`  unpushed commits:  ${unpushed}`);
  console.log(`  oldest unpushed:   ${oldest}`);
  console.log(`  last publish:      ${lastPublish}`);
  console.log(`  version:           ${version} (latest tag ${latestTag})`);
  console.log(`  open roadmap:      ${roadmapItems} item(s)`);

  if (unpushed !== "unavailable (unpushed)" && Number(unpushed) > 0) {
    console.log("");
    console.log("  Close the session with `npm run session:close` (if the tree is dirty),");
    console.log("  then publish with `./scripts/push-pipeline.sh`.");
  }
}

try {
  main();
} catch (error) {
  console.error(`status: fatal: ${(error as Error).message}`);
  process.exit(2);
}
