#!/usr/bin/env npx tsx
/**
 * check-script-quality.ts — enforce script quality standards. [gate]
 *
 * Covers the standards AGENTS.md §Script discipline defines but
 * `check-script-discipline.ts` does not:
 *   C1 reachability   — every script is wired into an npm script, imported, or
 *                       referenced by a hook/CI/pipeline; else allowlisted.
 *   C2 duplicate-helper — same top-level helper with a near-identical body in
 *                       more than one script.
 *   C3 repeated-parse — the same spec/file read or tree walk at multiple call
 *                       sites in one script.
 *   C4 shared-parser-bypass — a REQ-header-shape regex (`\*\*REQ-… —`) outside
 *                       scripts/lib.
 *
 * All four are hard checks (exit 1). A finding is suppressed only by a
 * disposition in `spec/audit/script-quality-baseline.json` naming that
 * check+path; C1 reaching an allowlist entry, C2–C4 a reviewed exception.
 *
 * The pure detectors live in `scripts/lib/script-quality.ts`, where
 * `test-script-tooling.ts` asserts them. Exit codes: 0 = pass, 1 = hard
 * violation(s), 2 = fatal error.
 */
import { readFileSync, existsSync } from "node:fs";
import { join, relative } from "node:path";
import { walkFiles } from "./lib/walk.js";
import { topLevelHelpers, duplicateHelperPairs, isReqHeaderRegex, type HelperDef } from "./lib/script-quality.js";
import { parseFlag, handleHelp } from "./lib/args.js";

const ROOT = join(import.meta.dirname, "..");
const SCRIPT_DIRS = [join(ROOT, "scripts"), join(ROOT, "holonovel", "scripts")];
const LIB_DIRS = [join(ROOT, "scripts", "lib"), join(ROOT, "holonovel", "scripts", "lib")];
const BASELINE_PATH = join(ROOT, "spec", "audit", "script-quality-baseline.json");

const json = parseFlag(process.argv, "--json");
const report = parseFlag(process.argv, "--report");

handleHelp(process.argv, `Usage: check-script-quality [--json] [--report]

  --json     emit the findings payload as JSON on stdout
  --report   report-only: never exit 1 (used to measure false positives)

Exit codes: 0 = pass, 1 = hard violation, 2 = fatal.
`);

interface Finding {
  check: string;
  severity: "hard" | "report";
  path: string;
  detail: string;
}

interface BaselineEntry {
  check: string;
  path: string;
  disposition: string;
  justification: string;
}

function loadBaseline(): BaselineEntry[] {
  try {
    const parsed = JSON.parse(readFileSync(BASELINE_PATH, "utf-8")) as { allowlist?: BaselineEntry[] };
    return parsed.allowlist ?? [];
  } catch {
    // Missing or malformed baseline — treat as empty (no dispositions).
    return [];
  }
}

const baseline = loadBaseline();
const findings: Finding[] = [];

function isLib(path: string): boolean {
  return LIB_DIRS.some((d) => path.startsWith(d));
}

// A reviewed exception in the baseline suppresses a finding for that check+path.
function isBaselined(check: string, path: string): boolean {
  return baseline.some((b) => b.check === check && b.path === path);
}

function collectScripts(): string[] {
  const out: string[] = [];
  for (const dir of SCRIPT_DIRS) {
    if (!existsSync(dir)) continue;
    out.push(...walkFiles(dir, ".ts"), ...walkFiles(dir, ".mjs"));
  }
  return out.filter((p) => !isLib(p) && !p.endsWith(".d.ts"));
}

function readText(p: string): string {
  try {
    return readFileSync(p, "utf-8");
  } catch {
    // Unreadable file — the caller skips it.
    return "";
  }
}

// ─── Reachability (C1) ─────────────────────────────────────────────────────

function packageText(): string {
  let text = "";
  for (const pkg of [join(ROOT, "package.json"), join(ROOT, "holonovel", "package.json")]) {
    if (existsSync(pkg)) text += readText(pkg);
  }
  return text;
}

function referenceText(): string {
  let text = "";
  const hooks = [join(ROOT, ".githooks", "pre-commit"), join(ROOT, ".githooks", "pre-push")];
  for (const h of hooks) if (existsSync(h)) text += readText(h);
  const wfDir = join(ROOT, ".github", "workflows");
  if (existsSync(wfDir)) for (const f of walkFiles(wfDir, ".yml")) text += readText(f);
  const pipeline = join(ROOT, "scripts", "push-pipeline.sh");
  if (existsSync(pipeline)) text += readText(pipeline);
  return text;
}

function importSpecifiers(scripts: string[]): string[] {
  const specs: string[] = [];
  for (const p of scripts) {
    for (const m of readText(p).matchAll(/(?:from|import)\s*\(?\s*["']([^"']+)["']/g)) {
      specs.push(m[1]);
    }
  }
  return specs;
}

function basenameNoExt(p: string): string {
  return p.replace(/^.*[/\\]/, "").replace(/\.[a-z0-9]+$/i, "");
}

function checkReachability(scripts: string[]): void {
  const pkg = packageText();
  const refs = referenceText();
  const specNames = new Set(importSpecifiers(scripts).map(basenameNoExt));
  const dirNames = SCRIPT_DIRS.map((d) => relative(ROOT, d));

  for (const p of scripts) {
    const relPath = relative(ROOT, p);
    const file = p.replace(/^.*[/\\]/, "");
    const base = basenameNoExt(file);
    const inDir = dirNames.some((d) => relPath.startsWith(d + "/") || relPath.startsWith(d + "\\"));
    const reachable =
      pkg.includes(file) ||
      refs.includes(file) ||
      (inDir && (pkg.includes(base) || refs.includes(base) || specNames.has(base)));
    if (!reachable && !isBaselined("reachability", relPath)) {
      findings.push({
        check: "reachability",
        severity: "hard",
        path: relPath,
        detail: "not referenced by package.json, an import, a hook, CI, or the pipeline; add a caller or a disposition in script-quality-baseline.json",
      });
    }
  }
}

// ─── Per-file scanning (C3, C4) ────────────────────────────────────────────

function checkPerFile(relPath: string, text: string): void {
  const calls = new Map<string, number>();
  for (const m of text.matchAll(/\b(readSpec|walkTsFiles|walkFiles)\s*\(\s*([^)]*)\)/g)) {
    const key = `${m[1]}:${m[2].trim()}`;
    calls.set(key, (calls.get(key) ?? 0) + 1);
  }
  for (const m of text.matchAll(/\breadFileSync\s*\(\s*["'`]([^"'`]+)["'`]/g)) {
    const key = `readFileSync:${m[1]}`;
    calls.set(key, (calls.get(key) ?? 0) + 1);
  }
  for (const [key, n] of calls) {
    if (n > 1 && !isBaselined("repeated-parse", relPath)) {
      findings.push({
        check: "repeated-parse",
        severity: "hard",
        path: relPath,
        detail: `${key} called ${n} times — read once and reuse`,
      });
    }
  }

  const lineOf = (idx: number): number => text.slice(0, idx).split("\n").length;
  const regexLitRe = /\/(?:\\.|\[[^\]]*\]|[^/\\\n])+\/[gimsuy]*/g;
  for (const m of text.matchAll(regexLitRe)) {
    // Header-shape only: a REQ definition matcher (`\*\*REQ-… —`). Bare
    // citation scans and table-row detectors are not parser bypasses.
    if (isReqHeaderRegex(m[0]) && !isBaselined("shared-parser-bypass", relPath)) {
      findings.push({
        check: "shared-parser-bypass",
        severity: "hard",
        path: relPath,
        detail: `REQ-header regex at line ${lineOf(m.index)}; use scripts/lib/parse-spec.ts`,
      });
    }
  }
}

// ─── Duplicate helpers (C2) ────────────────────────────────────────────────

function checkDuplicates(scripts: string[]): void {
  const defs: HelperDef[] = [];
  for (const p of scripts) {
    const text = readText(p);
    if (text) defs.push(...topLevelHelpers(text, relative(ROOT, p)));
  }
  for (const { name, a, b, sim } of duplicateHelperPairs(defs)) {
    if (isBaselined("duplicate-helper", a.file)) continue;
    findings.push({
      check: "duplicate-helper",
      severity: "hard",
      path: a.file,
      detail: `\`${name}\` also defined in ${b.file} (body similarity ${sim.toFixed(2)}); extract to scripts/lib`,
    });
  }
}

// ─── Run ───────────────────────────────────────────────────────────────────

let scripts: string[];
try {
  scripts = collectScripts();
} catch (err) {
  console.error(`FATAL: failed to collect scripts: ${(err as Error).message}`);
  process.exit(2);
}

checkReachability(scripts);
for (const p of scripts) checkPerFile(relative(ROOT, p), readText(p));
checkDuplicates(scripts);

const hard = findings.filter((f) => f.severity === "hard");
const reportFindings = findings.filter((f) => f.severity === "report");

if (json) {
  process.stdout.write(JSON.stringify({ scripts: scripts.length, hard, report: reportFindings }, null, 2) + "\n");
} else {
  for (const f of hard) console.error(`FAIL: [${f.check}] ${f.path} — ${f.detail}`);
  for (const f of reportFindings) console.log(`WARNING: [${f.check}] ${f.path} — ${f.detail}`);
  const counts = `${scripts.length} scripts, ${hard.length} hard, ${reportFindings.length} report-only`;
  if (hard.length > 0 && !report) {
    console.error(`\n${counts}`);
    process.exit(1);
  }
  console.log(`PASS: script quality — ${counts}`);
}

process.exit(hard.length > 0 && !report ? 1 : 0);
