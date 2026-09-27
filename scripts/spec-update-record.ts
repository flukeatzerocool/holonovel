#!/usr/bin/env npx tsx
/**
 * spec-update-record.ts — draft the DECISIONS.md Spec Update record. [build tool]
 *
 * Inserts a scaffolded `### Holonovel Spec Update — <date>` entry into each
 * server's DECISIONS.md for an unpublished spec delta, prefilling the delta
 * class (REQ-314) and the changed-surface summary from the CHANGELOG, so the
 * narrative record Appendix V.4 requires is present before publication. The
 * operator fills the verification line.
 *
 * `--check` exits non-zero when the stored spec hash differs from the assembled
 * spec but no dated entry exists for today — the backstop for a hand-edited
 * hash line. Idempotent: a re-run with an unchanged spec hash is a no-op.
 *
 * Exit codes: 0 = entry present / written / already recorded; 1 = missing entry
 * under --check, or a required input was absent.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { handleHelp, parseFlag } from "./lib/args.js";
import { SERVERS } from "./lib/servers.js";

const root = join(import.meta.dirname, "..");
const SPEC_PATH = join(root, "holonovel.md");

const USAGE = `Usage: npx tsx scripts/spec-update-record.ts [--check] [--dry-run]

  --check      Exit 1 when an unpublished spec delta has no dated Spec Update
               entry for today; no files are written.
  --dry-run    Print the entry that would be inserted; write nothing.
  --help, -h   Show this message.

Exit codes: 0 = present / written / already recorded, 1 = missing under --check
or a required input was absent.
`;

function localDate(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function sha256(filePath: string): string {
  return createHash("sha256").update(readFileSync(filePath)).digest("hex");
}

function deltaReport(server: string): { classification: string; inSync: boolean } {
  try {
    const out = execFileSync(
      "npx",
      ["tsx", "scripts/spec-delta.ts", "--server", server, "--report-only"],
      { cwd: root, encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"], timeout: 120000 }
    );
    const start = out.indexOf("{");
    if (start === -1) return { classification: "minor", inSync: false };
    const report = JSON.parse(out.slice(start)) as { classification?: string; in_sync?: boolean };
    return {
      classification: report.classification && report.classification !== "none" ? report.classification : "minor",
      inSync: report.in_sync === true,
    };
  } catch {
    // spec-delta is advisory for the scaffold; a failure falls back to the
    // safest class so the operator still gets a prefilled record to correct.
    return { classification: "minor", inSync: false };
  }
}

interface ChangelogEntry {
  date: string;
  title: string;
}

function parseChangelog(): ChangelogEntry[] {
  const changelogPath = join(root, "CHANGELOG.md");
  if (!existsSync(changelogPath)) return [];
  const entries: ChangelogEntry[] = [];
  for (const m of readFileSync(changelogPath, "utf-8").matchAll(/^##\s+(\d{4}-\d{2}-\d{2})\s+—\s+(.+)$/gm)) {
    entries.push({ date: m[1], title: m[2].trim() });
  }
  return entries;
}

function priorBaselineDate(decisions: string): string | null {
  const dates = [...decisions.matchAll(/^### Holonovel Spec Update — (\d{4}-\d{2}-\d{2})/gm)].map((m) => m[1]);
  return dates.length > 0 ? dates.sort().pop()! : null;
}

function renderEntry(decisions: string, specHash: string, classification: string): string {
  const today = localDate();
  const baseline = priorBaselineDate(decisions);
  // CHANGELOG is newest-first, so the most recent entries are at the head.
  const entries = parseChangelog().filter((e) => !baseline || e.date >= baseline);
  const recent = entries.slice(0, 5);
  // Strip parentheses from the title so the heading's own (...) wrapper reads
  // cleanly for a title that already carries a parenthetical.
  const summary = (recent[0]?.title ?? "spec update").replace(/[()]/g, "").replace(/\s+/g, " ").slice(0, 80);
  const changed = recent.length > 0
    ? recent.map((e) => e.title).join("; ")
    : "spec changed (see CHANGELOG)";
  return [
    `### Holonovel Spec Update — ${today} (${summary})`,
    "",
    `- **Delta class:** ${classification}. Changed surfaces: ${changed}.`,
    `- **Verification:** _fill after running the gates (assemble, check, test:all, fingerprint advance) per Appendix V.4._`,
    "",
    `<!-- @spec-update:${specHash} -->`,
    "",
  ].join("\n");
}

function insertEntry(decisions: string, entry: string): string {
  const heading = /^### Holonovel Spec Update — /m;
  const match = heading.exec(decisions);
  if (match && match.index !== undefined) {
    return decisions.slice(0, match.index) + entry + "\n" + decisions.slice(match.index);
  }
  const firstSection = decisions.search(/^## /m);
  if (firstSection !== -1) {
    return decisions.slice(0, firstSection) + entry + decisions.slice(firstSection);
  }
  return decisions.trimEnd() + "\n\n" + entry;
}

const checkMode = parseFlag(process.argv, "--check");
const dryRun = parseFlag(process.argv, "--dry-run");
handleHelp(process.argv, USAGE);

if (!existsSync(SPEC_PATH)) {
  console.error(`FAIL: assembled spec not found at ${SPEC_PATH} — run npm run assemble first.`);
  process.exit(1);
}

const specHash = sha256(SPEC_PATH);
const today = localDate();
let failed = false;

for (const server of SERVERS) {
  const decisionsPath = join(root, server, "DECISIONS.md");
  if (!existsSync(decisionsPath)) continue;
  const decisions = readFileSync(decisionsPath, "utf-8");
  const report = deltaReport(server);
  const hasTodayEntry = new RegExp(`^### Holonovel Spec Update — ${today}\\b`, "m").test(decisions);

  if (checkMode) {
    if (!report.inSync && !hasTodayEntry) {
      console.error(`ERROR: ${server}: unpublished spec delta with no '### Holonovel Spec Update — ${today}' entry.`);
      failed = true;
    } else {
      console.log(`  OK   ${server}: Spec Update record ${hasTodayEntry ? "present" : "not required (no unpublished delta)"}`);
    }
    continue;
  }

  if (decisions.includes(`@spec-update:${specHash}`)) {
    console.log(`  OK   ${server}: entry for spec hash ${specHash.slice(0, 8)}… already recorded`);
    continue;
  }

  const entry = renderEntry(decisions, specHash, report.classification);
  if (dryRun) {
    console.log(`  --- ${server}/DECISIONS.md (dry run) ---`);
    process.stdout.write(entry + "\n");
    continue;
  }
  writeFileSync(decisionsPath, insertEntry(decisions, entry));
  console.log(`  OK   ${server}: Spec Update entry inserted (delta ${report.classification}, hash ${specHash.slice(0, 8)}…)`);
  console.log(`       Fill the Verification line before publication (Appendix V.4).`);
}

if (checkMode && failed) process.exit(1);
process.exit(0);
