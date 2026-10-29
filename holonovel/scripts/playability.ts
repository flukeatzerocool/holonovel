#!/usr/bin/env node
/**
 * playability.ts — headless content playability gate (E4). [gate]
 *
 * Drives every shipped Novel plus the playability fixtures through
 * `createEngine()` in an isolated child process, derives a seeded action
 * script from each Novel's world graph, and asserts goal reachability,
 * soft-lock absence, countdown target validity, encounter survivability, and
 * economy viability. Each fixture declares the violation classes it must
 * produce, so one run proves the gate discriminates: the clean control and the
 * shipped Novel pass with no findings, the broken twin fails with exactly its
 * declared classes.
 *
 * Usage:
 *   tsx scripts/playability.ts [--all] [--fixture <id>] [--seed <n>]
 *                              [--self-test] [--json] [--help]
 *
 * Exit codes: 0 = every Novel matched its expectation, 1 = a mismatch or run
 * failure, 2 = fatal setup error.
 *
 * REQ citations: REQ-565 (starter Novel), REQ-200 (world-model reachability),
 * REQ-073c2 / REQ-329a (countdown direction and trigger deltas), REQ-090 /
 * REQ-091 (adventure/encounter content).
 */
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join, basename } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { installHarnessGuard, harnessComplete } from "./lib/harness-guard.js";
import { buildWorldModel, deriveScript, findWinningPath, staticFindings, loadNovel } from "./lib/playability-model.js";
import type { Finding, FindingClass, ManifestEntry } from "./lib/playability-model.js";
import { handleHelp, parseFlag, parseValueFlag, rejectUnknown } from "../../scripts/lib/args.js";

installHarnessGuard();

const HOME = import.meta.dirname;
const SERVER_DIR = join(HOME, "..");
const CONTENT_DIR = join(SERVER_DIR, "content");
const MANIFEST_PATH = join(HOME, "fixtures", "playability", "manifest.json");
const CHILD = join(HOME, "lib", "playability-run.ts");

const USAGE = `Usage: tsx scripts/playability.ts [--all] [--fixture <id>] [--seed <n>] [--self-test] [--json] [--help]

  --all          Run every shipped Novel and fixture (default).
  --fixture <id> Run one manifest fixture (id or path).
  --seed <n>     Deterministic seed for tie-breaking (default 1).
  --self-test    Re-run the fixtures and assert identical violation classes.
  --json         Emit a machine-readable report to stdout.
  --help, -h     Show this help.

Exit codes: 0 = all expectations matched, 1 = mismatch/failure, 2 = fatal.`;

interface Target {
  path: string;
  expect: FindingClass[];
  entry?: ManifestEntry;
}

interface RunResult {
  novel: string;
  path: string;
  expected: FindingClass[];
  actual: FindingClass[];
  pass: boolean;
  reached: boolean;
  finalRoom: string | null;
  findings: Finding[];
}

function shippedNovels(): Target[] {
  return readdirSync(CONTENT_DIR)
    .filter((name) => name.endsWith(".json") && !name.endsWith(".source.json"))
    .sort()
    .map((name) => ({ path: join(CONTENT_DIR, name), expect: [] as FindingClass[] }));
}

function loadManifest(): ManifestEntry[] {
  try {
    const parsed = JSON.parse(readFileSync(MANIFEST_PATH, "utf-8")) as { novels?: ManifestEntry[] };
    return parsed.novels ?? [];
  } catch {
    return [];
  }
}

function fixtureTargets(manifest: ManifestEntry[], only: string | null): Target[] {
  const targets = manifest.map((entry) => ({
    path: join(HOME, "fixtures", "playability", entry.path),
    expect: [...entry.expect].sort(),
    entry,
  }));
  if (!only) return targets;
  return targets.filter((target) => basename(target.path, ".json") === only || target.path === only || target.entry?.path === only);
}

function dedupeFindings(findings: Finding[]): Finding[] {
  const seen = new Set<string>();
  const out: Finding[] = [];
  for (const finding of findings) {
    const key = `${finding.class}\u0000${finding.detail}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(finding);
  }
  return out;
}

function classesOf(findings: Finding[]): FindingClass[] {
  return [...new Set(findings.map((finding) => finding.class))].sort();
}

function runChild(novelPath: string, scriptPath: string, seed: number): { reached: boolean; finalRoom: string | null; remaining: string[]; findings: Finding[]; novel: string } {
  const run = spawnSync("npx", ["tsx", CHILD, "--novel", novelPath, "--script", scriptPath, "--seed", String(seed)], {
    cwd: SERVER_DIR,
    encoding: "utf8",
    timeout: 180_000,
  });
  const line = (run.stdout ?? "").trim().split("\n").reverse().find((candidate) => candidate.startsWith("{"));
  if (!line) {
    return {
      reached: false,
      finalRoom: null,
      remaining: [],
      novel: basename(novelPath),
      findings: [{ class: "goal_unreached_dynamic", novel: basename(novelPath), pointer: "/", detail: `child produced no verdict (status ${run.status}): ${(run.stderr ?? "").slice(0, 200)}`, anchor: "holonovel/scripts/playability.ts:112" }],
    };
  }
  const verdict = JSON.parse(line) as {
    novel: string;
    reached: boolean;
    finalRoom: string | null;
    findings: { class: string; detail: string }[];
    observations: { countdowns_remaining?: string[] };
  };
  const findings: Finding[] = verdict.findings.map((finding) => ({
    class: finding.class as FindingClass,
    novel: verdict.novel,
    pointer: "/",
    detail: finding.detail,
    anchor: "holonovel/scripts/lib/playability-run.ts:132",
  }));
  return {
    reached: verdict.reached,
    finalRoom: verdict.finalRoom,
    remaining: verdict.observations?.countdowns_remaining ?? [],
    findings,
    novel: verdict.novel,
  };
}

function evaluate(target: Target, seed: number, workDir: string): RunResult {
  const novel = loadNovel(JSON.parse(readFileSync(target.path, "utf-8")));
  const model = buildWorldModel(novel, target.entry?.goal);
  const path = findWinningPath(model);
  const findings: Finding[] = [...staticFindings(model, path, target.entry?.encounters ?? [])];
  let reached = false;
  let finalRoom: string | null = null;

  if (path) {
    const script = deriveScript(model, path, target.entry?.encounters ?? [], seed);
    const scriptPath = join(workDir, `${basename(target.path, ".json")}-${seed}.script.json`);
    writeFileSync(scriptPath, JSON.stringify(script), "utf-8");
    const child = runChild(target.path, scriptPath, seed);
    finalRoom = child.finalRoom;
    reached = child.reached;
    findings.push(...child.findings);
    for (const advance of script.countdownAdvances) {
      if (child.remaining.includes(advance.name)) {
        findings.push({
          class: "countdown_target_invalid",
          novel: String(novel.slug ?? novel.name ?? "unknown"),
          pointer: `/countdowns/${advance.name}`,
          detail: `countdown '${advance.name}' did not fire after ${advance.advances} advance(s)`,
          anchor: "holonovel/scripts/playability.ts:151",
        });
      }
    }
    const explainsMiss = findings.some(
      (finding) => finding.class === "unreachable_goal" || finding.class === "soft_lock" || finding.class === "economy_collapse",
    );
    if (!reached && !explainsMiss) {
      findings.push({
        class: "goal_unreached_dynamic",
        novel: String(novel.slug ?? novel.name ?? "unknown"),
        pointer: "/world/rooms",
        detail: `engine run ended at '${finalRoom ?? "(unknown)"}', not a goal room`,
        anchor: "holonovel/scripts/playability.ts:151",
      });
    }
  }

  const deduped = dedupeFindings(findings);
  const actual = classesOf(deduped);
  const expected = [...target.expect].sort();
  const pass = actual.length === expected.length && actual.every((value, index) => value === expected[index]);
  return {
    novel: String(novel.slug ?? novel.name ?? basename(target.path)),
    path: target.path,
    expected,
    actual,
    pass,
    reached,
    finalRoom,
    findings: deduped,
  };
}

function run(only: string | null, seed: number): RunResult[] {
  const manifest = loadManifest();
  const targets = only ? fixtureTargets(manifest, only) : [...shippedNovels(), ...fixtureTargets(manifest, null)];
  if (only && targets.length === 0) {
    process.stderr.write(`playability: no fixture matches '${only}'\n`);
    process.exit(1);
  }
  if (!only && targets.length === 0) {
    process.stderr.write("playability: no Novels to evaluate\n");
    process.exit(1);
  }
  const workDir = mkdtempSync(join(tmpdir(), "holonovel-playability-scripts-"));
  try {
    return targets.map((target) => evaluate(target, seed, workDir));
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
}

function summarize(results: RunResult[], selfTest: { stable: boolean } | null): boolean {
  const pass = results.every((result) => result.pass) && (selfTest?.stable ?? true);
  for (const result of results) {
    const status = result.pass ? "PASS" : "FAIL";
    const detail = result.pass
      ? `[${result.actual.join(", ") || "clean"}]`
      : `expected [${result.expected.join(", ") || "clean"}] got [${result.actual.join(", ") || "clean"}]`;
    console.error(`${status} ${result.novel} — ${detail}`);
    for (const finding of result.findings) console.error(`  - ${finding.class}: ${finding.detail}`);
  }
  if (selfTest && !selfTest.stable) console.error("FAIL self-test — violation classes changed between runs");
  console.error(`\n${pass ? "playability: PASS" : "playability: FAIL"} (${results.length} Novel(s))`);
  return pass;
}

function main(): void {
  const argv = process.argv.slice(2);
  handleHelp(argv, USAGE);
  rejectUnknown(argv, new Set(["--all", "--fixture", "--seed", "--self-test", "--json", "--help", "-h"]), USAGE);

  const only = parseValueFlag(argv, "--fixture");
  const seed = Number(parseValueFlag(argv, "--seed") ?? "1");
  const selfTest = parseFlag(argv, "--self-test");
  const json = parseFlag(argv, "--json");
  if (!Number.isFinite(seed) || seed <= 0) {
    process.stderr.write("playability: --seed must be a positive integer\n");
    process.exit(2);
  }

  const first = run(only, seed);
  let stability: { stable: boolean } | null = null;
  if (selfTest) {
    const fixtures = fixtureTargets(loadManifest(), only);
    const second = fixtures.map((target) => {
      const workDir = mkdtempSync(join(tmpdir(), "holonovel-playability-selftest-"));
      try {
        return evaluate(target, seed, workDir);
      } finally {
        rmSync(workDir, { recursive: true, force: true });
      }
    });
    const byPath = new Map(second.map((result) => [result.path, result.actual]));
    stability = { stable: fixtures.every((target) => {
      const expected = byPath.get(target.path);
      const actual = first.find((result) => result.path === target.path)?.actual;
      return JSON.stringify(expected) === JSON.stringify(actual);
    }) };
  }

  const pass = summarize(first, stability);
  if (json) {
    process.stdout.write(`${JSON.stringify({ pass, results: first, self_test: stability }, null, 2)}\n`);
  }
  harnessComplete();
  process.exit(pass ? 0 : 1);
}

main();
