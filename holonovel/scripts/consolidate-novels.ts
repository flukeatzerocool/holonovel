#!/usr/bin/env npx tsx
/**
 * consolidate-novels.ts — report and optionally import Novels from legacy
 * data directories into the canonical Novel registry. [informational]
 *
 * Scans one or more legacy `novels/` directories and lists every `<slug>.json`
 * save file that is absent from the canonical data dir's `novels/` directory.
 * With `--import`, missing Novels (and their backup chain — `.bak` and
 * `.bak.N`) are copied into the canonical dir; existing slugs are never
 * overwritten. This supports the
 * retire-by-migrate-or-trash convention: when a server generation is retired,
 * its Novels are consolidated before the legacy state dir is deleted.
 *
 * Exit codes: 0 = report/import completed, 1 = invalid arguments, 2 = fatal
 * I/O error.
 *
 * Usage:
 *   consolidate-novels.ts --data-dir <path> --scan-dir <path> [--scan-dir <path> ...] [--import] [--help]
 */
import { existsSync, mkdirSync, readdirSync, statSync, copyFileSync } from "node:fs";
import { join } from "node:path";
import { handleHelp, parseValueFlag } from "../../scripts/lib/args.js";

interface Candidate {
  sourceDir: string;
  slug: string;
  fileName: string;
  bakNames: string[];
  bytes: number;
}

function usage(): string {
  return [
    "Usage: consolidate-novels.ts --data-dir <path> --scan-dir <path> [--scan-dir <path> ...] [--import]",
    "",
    "  --data-dir <path>   Canonical .holonovel-state dir to consolidate into.",
    "  --scan-dir <path>   Legacy novels/ directory to scan. Repeatable.",
    "  --import            Copy missing Novels into --data-dir (default: report only).",
    "  -h, --help          Show this help and exit 0.",
    "",
  ].join("\n");
}

function defaultDataDir(): string {
  if (process.env.TTRPG_DATA_DIR) return process.env.TTRPG_DATA_DIR;
  return join(import.meta.dirname, "..", ".holonovel-state");
}

function parseScanDirs(argv: string[]): string[] {
  const dirs: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--scan-dir" && i + 1 < argv.length && !argv[i + 1].startsWith("--")) {
      dirs.push(argv[i + 1]);
      i++;
    }
  }
  return dirs;
}

function main(): void {
  handleHelp(process.argv.slice(2), usage());

  const dataDir = parseValueFlag(process.argv.slice(2), "--data-dir") ?? defaultDataDir();
  const scanDirs = parseScanDirs(process.argv.slice(2));
  const doImport = process.argv.includes("--import");

  const known = new Set(["--data-dir", dataDir, "--scan-dir", ...scanDirs, "--import", "--help", "-h"]);
  const unknown = process.argv.slice(2).filter((a) => a.startsWith("--") && !known.has(a));
  if (unknown.length > 0) {
    console.error(`Unknown flag(s): ${unknown.join(", ")}`);
    console.error(usage());
    process.exit(1);
  }

  if (scanDirs.length === 0) {
    console.error("No --scan-dir provided. Supply at least one legacy novels/ directory.");
    console.error(usage());
    process.exit(1);
  }

  const targetDir = join(dataDir, "novels");
  let existing: Set<string>;
  try {
    existing = new Set(readdirSync(targetDir).filter((f) => f.endsWith(".json")));
  } catch {
    existing = new Set();
  }

  const candidates: Candidate[] = [];
  for (const scanDir of scanDirs) {
    if (!existsSync(scanDir)) {
      console.error(`WARN: scan dir not found, skipped: ${scanDir}`);
      continue;
    }
    let files: string[];
    try {
      files = readdirSync(scanDir);
    } catch (err) {
      console.error(`FATAL: cannot read scan dir ${scanDir}: ${(err as Error).message}`);
      process.exit(2);
    }
    for (const file of files) {
      if (!file.endsWith(".json")) continue;
      const slug = file.slice(0, -".json".length);
      if (existing.has(file)) continue;
      // Copy the whole backup chain (`.bak` and `.bak.N`) alongside the primary.
      const bakNames = files.filter((f) => f === `${file}.bak` || f.startsWith(`${file}.bak.`));
      candidates.push({
        sourceDir: scanDir,
        slug,
        fileName: file,
        bakNames,
        bytes: statSync(join(scanDir, file)).size,
      });
    }
  }

  if (candidates.length === 0) {
    console.log("No unconsolidated Novels found. Canonical dir already contains everything.");
    return;
  }

  for (const c of candidates) {
    const action = doImport ? "imported" : "missing ";
    console.log(`${action}  ${c.slug}  (${(c.bytes / 1024).toFixed(1)} KiB)  ← ${c.sourceDir}`);
    if (doImport) {
      try {
        mkdirSync(targetDir, { recursive: true });
        copyFileSync(join(c.sourceDir, c.fileName), join(targetDir, c.fileName));
        for (const bak of c.bakNames) {
          copyFileSync(join(c.sourceDir, bak), join(targetDir, bak));
        }
      } catch (err) {
        console.error(`FATAL: import failed for ${c.slug}: ${(err as Error).message}`);
        process.exit(2);
      }
    }
  }

  console.log(doImport
    ? `\n${candidates.length} Novel(s) imported into ${targetDir}.`
    : `\n${candidates.length} Novel(s) not present in ${targetDir}. Re-run with --import to copy them.`);
}

main();
