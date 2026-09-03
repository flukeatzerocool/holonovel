#!/usr/bin/env npx tsx
/**
 * retention-prune.ts — report and optionally prune runtime data per the disk
 * retention policy. [informational]
 *
 * Enforces three bounded-retention rules over a `.holonovel-state` data dir,
 * never touching live Novels, their `.bak` siblings, or the `archive/` dir:
 *
 *   1. `.trash/` — delete entries older than `--trash-days` (default 90).
 *   2. `<slug>.corrupt*.bak` crash snapshots — keep the newest per Novel,
 *      delete older ones only once past `--corrupt-days` (default 14).
 *   3. `rulesets-backup-*` directories — keep the newest `--backups-keep`
 *      (default 2), delete the rest.
 *
 * Dry-run by default: reports what would be deleted and total reclaimed
 * bytes. Pass `--prune` to delete. Exit codes: 0 = completed, 1 = invalid
 * arguments, 2 = fatal I/O error.
 *
 * Usage:
 *   retention-prune.ts --data-dir <path> [--prune] [--trash-days <n>] [--corrupt-days <n>] [--backups-keep <n>] [--help]
 */
import { existsSync, readdirSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";
import { handleHelp, parseValueFlag } from "../../scripts/lib/args.js";

interface Deletable {
  path: string;
  bytes: number;
  reason: string;
}

function usage(): string {
  return [
    "Usage: retention-prune.ts --data-dir <path> [--prune] [--trash-days <n>] [--corrupt-days <n>] [--backups-keep <n>]",
    "",
    "  --data-dir <path>   .holonovel-state dir to inspect.",
    "  --prune            Delete matched entries (default: dry-run report only).",
    "  --trash-days <n>   .trash/ retention in days (default 90).",
    "  --corrupt-days <n> Crash-snapshot age gate in days (default 14).",
    "  --backups-keep <n> rulesets-backup-* generations to keep (default 2).",
    "  -h, --help         Show this help and exit 0.",
    "",
  ].join("\n");
}

function defaultDataDir(): string {
  if (process.env.TTRPG_DATA_DIR) return process.env.TTRPG_DATA_DIR;
  return join(import.meta.dirname, "..", ".holonovel-state");
}

function intFlag(argv: string[], name: string, fallback: number): number {
  const raw = parseValueFlag(argv, name);
  if (raw === null) return fallback;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 0) {
    console.error(`Invalid value for ${name}: ${raw} (expected a non-negative integer)`);
    process.exit(1);
  }
  return n;
}

function dirSize(p: string): number {
  let total = 0;
  for (const e of readdirSync(p)) {
    const full = join(p, e);
    try {
      const st = statSync(full);
      if (st.isDirectory()) total += dirSize(full);
      else total += st.size;
    } catch {
      // vanished during scan — count as zero
    }
  }
  return total;
}

function collectTrash(dataDir: string, days: number): Deletable[] {
  const trashDir = join(dataDir, ".trash");
  if (!existsSync(trashDir)) return [];
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const out: Deletable[] = [];
  for (const e of readdirSync(trashDir)) {
    const p = join(trashDir, e);
    try {
      const st = statSync(p);
      if (st.mtimeMs < cutoff) out.push({ path: p, bytes: dirSize(p), reason: `.trash older than ${days} days` });
    } catch {
      // unreadable entry — skip rather than delete blind
    }
  }
  return out;
}

function collectCorrupt(dataDir: string, days: number): Deletable[] {
  const novelsDir = join(dataDir, "novels");
  if (!existsSync(novelsDir)) return [];
  const groups = new Map<string, { path: string; mtime: number; bytes: number }[]>();
  for (const e of readdirSync(novelsDir)) {
    const m = e.match(/^(.+?)\.corrupt.*\.bak$/);
    if (!m) continue;
    const p = join(novelsDir, e);
    let st;
    try {
      st = statSync(p);
    } catch {
      continue;
    }
    const arr = groups.get(m[1]) ?? [];
    arr.push({ path: p, mtime: st.mtimeMs, bytes: st.size });
    groups.set(m[1], arr);
  }
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const out: Deletable[] = [];
  for (const snapshots of groups.values()) {
    snapshots.sort((a, b) => b.mtime - a.mtime);
    for (let i = 1; i < snapshots.length; i++) {
      if (snapshots[i].mtime < cutoff) {
        out.push({ path: snapshots[i].path, bytes: snapshots[i].bytes, reason: `crash snapshot older than ${days} days (kept newest)` });
      }
    }
  }
  return out;
}

function collectRulesetBackups(dataDir: string, keep: number): Deletable[] {
  const entries = readdirSync(dataDir).filter((e) => e.startsWith("rulesets-backup-"));
  if (entries.length <= keep) return [];
  const withMtime = entries.map((e) => {
    const p = join(dataDir, e);
    const st = statSync(p);
    return { path: p, mtime: st.mtimeMs, bytes: dirSize(p) };
  });
  withMtime.sort((a, b) => b.mtime - a.mtime);
  return withMtime.slice(keep).map((d) => ({ path: d.path, bytes: d.bytes, reason: `rulesets-backup beyond newest ${keep}` }));
}

function main(): void {
  const argv = process.argv.slice(2);
  handleHelp(argv, usage());

  const dataDir = parseValueFlag(argv, "--data-dir") ?? defaultDataDir();
  const doPrune = argv.includes("--prune");
  const trashDays = intFlag(argv, "--trash-days", 90);
  const corruptDays = intFlag(argv, "--corrupt-days", 14);
  const backupsKeep = intFlag(argv, "--backups-keep", 2);

  const known = new Set(["--data-dir", dataDir, "--prune", "--trash-days", String(trashDays), "--corrupt-days", String(corruptDays), "--backups-keep", String(backupsKeep), "--help", "-h"]);
  const unknown = argv.filter((a) => a.startsWith("--") && !known.has(a));
  if (unknown.length > 0) {
    console.error(`Unknown flag(s): ${unknown.join(", ")}`);
    console.error(usage());
    process.exit(1);
  }

  if (!existsSync(dataDir)) {
    console.error(`FATAL: data dir not found: ${dataDir}`);
    process.exit(2);
  }

  const all: Deletable[] = [
    ...collectTrash(dataDir, trashDays),
    ...collectCorrupt(dataDir, corruptDays),
    ...collectRulesetBackups(dataDir, backupsKeep),
  ];

  if (all.length === 0) {
    console.log("Nothing to prune under the current retention policy.");
    return;
  }

  let total = 0;
  for (const d of all) {
    total += d.bytes;
    console.log(`${doPrune ? "prune" : "candidate"}  ${d.path}  (${(d.bytes / 1024).toFixed(1)} KiB)  — ${d.reason}`);
  }

  console.log(doPrune
    ? `\nPruned ${all.length} entr${all.length === 1 ? "y" : "ies"}, reclaimed ${(total / 1024 / 1024).toFixed(2)} MiB.`
    : `\n${all.length} entr${all.length === 1 ? "y" : "ies"} eligible, ${(total / 1024 / 1024).toFixed(2)} MiB reclaimable. Re-run with --prune to delete.`);

  if (doPrune) {
    for (const d of all) {
      try {
        rmSync(d.path, { recursive: true, force: true });
      } catch (err) {
        console.error(`FATAL: prune failed for ${d.path}: ${(err as Error).message}`);
        process.exit(2);
      }
    }
  }
}

main();
