/**
 * build-ruleset.ts — Ruleset-build entry point (REQ-395a).
 *
 * Accepts one or more `slug=path` pairs (the B1 intake form), validates each
 * slug (§7.1a) and its source path, and prints the Build workflow invocation
 * (§6.1, §6.2) that a human or CI must run. Invoked with no arguments, it
 * prints its usage and the install directory (REQ-395a).
 *
 * LIMITATION: This script prints an `opencode run` command but does NOT
 * invoke it. Opencode cannot recursively invoke itself — `opencode run`
 * from within an opencode session would deadlock. A human or CI with
 * opencode access must run the printed command manually.
 */

import { readdirSync, existsSync, statSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const dataDir = process.env.TTRPG_DATA_DIR ?? join(root, "holonovel", ".holonovel-state");
const installDir = process.env.TTRPG_RULESET_DIRS ?? join(dataDir, "rulesets");
const decisionsFile = join(dataDir, "build-intake.md");

const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,63}$/;

interface Intake {
  slug: string;
  path: string;
}

function printUsage(): void {
  console.log("build-ruleset — Ruleset-build entry point (REQ-395a)");
  console.log("");
  console.log("Usage: npx tsx scripts/build-ruleset.ts <slug>=<path> [<slug>=<path> ...]");
  console.log("");
  console.log("  <slug>  A valid ruleset slug (§7.1a): lowercase-hyphenated, e.g. dnd5e");
  console.log("  <path>  Absolute or relative path to a directory of Markdown sources");
  console.log("");
  console.log(`Install directory: ${installDir}`);
  console.log("No valid arguments given — nothing built. See Appendix V (Workflow Runbooks).");
}

function parseArgs(argv: string[]): Intake[] {
  return argv
    .filter((a) => !a.startsWith("-"))
    .map((arg) => {
      const eq = arg.indexOf("=");
      if (eq <= 0) return { slug: "", path: "" };
      return { slug: arg.slice(0, eq), path: arg.slice(eq + 1) };
    })
    .filter((i) => i.slug !== "" && i.path !== "");
}

function hasMarkdown(dirPath: string): boolean {
  try {
    const entries = statSync(dirPath);
    if (!entries.isDirectory()) return false;
    // A shallow directory listing is sufficient for intake validation; the
    // Discovery step (§6.3) performs the deep, chunked read.
    return readdirSync(dirPath).some((f: string) => f.endsWith(".md"));
  } catch {
    return false;
  }
}

function recordIntake(intakes: Intake[]): void {
  const stamp = new Date().toISOString();
  const pairs = intakes.map((i) => `${i.slug}=${i.path}`).join(" ");
  const entry = `\n## B1 intake (build-ruleset) — ${stamp}\n\n- B1: ${pairs}\n`;
  mkdirSync(dataDir, { recursive: true });
  if (existsSync(decisionsFile)) {
    writeFileSync(decisionsFile, entry, { flag: "a" });
  } else {
    writeFileSync(decisionsFile, entry);
  }
}

const intakes = parseArgs(process.argv.slice(2));

if (intakes.length === 0) {
  printUsage();
  process.exit(0);
}

const failures: string[] = [];
for (const intake of intakes) {
  if (!SLUG_RE.test(intake.slug)) {
    failures.push(`${intake.slug}: invalid slug (§7.1a: lowercase-hyphenated)`);
    continue;
  }
  if (!existsSync(intake.path) || !hasMarkdown(intake.path)) {
    failures.push(`${intake.slug}: path '${intake.path}' is not a directory containing Markdown`);
  }
}

if (failures.length > 0) {
  console.error("build-ruleset: intake rejected");
  for (const f of failures) console.error(`  - ${f}`);
  console.error(`Install directory: ${installDir}`);
  process.exit(1);
}

console.log("build-ruleset — intake accepted");
console.log(`Install directory: ${installDir}`);
for (const intake of intakes) {
  console.log(`  ${intake.slug}=${intake.path}`);
}

recordIntake(intakes);

console.log("");
console.log("Build workflow (§6.1, §6.2) must now be run by an opencode agent.");
console.log(`Invoking: opencode run --agent build "Perform Build workflow on ${intakes.map((i) => i.slug).join(", ")}. B1 intake: ${intakes.map((i) => `${i.slug}=${i.path}`).join(" ")}. Follow Appendix V (Workflow Runbooks) V.1 happy path."`);

// The AI maintainer (opencode run) cannot be invoked from within opencode
// (recursive invocation would deadlock). Intake is recorded in
// .holonovel-state/build-intake.md (server-side decision log, not the repo);
// a human or CI with opencode access must run the printed command.
process.exit(0);
