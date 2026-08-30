#!/usr/bin/env node
// §5.18 fingerprint/entry-point conformance harness (REQ-420 through REQ-424).
// Exercises T498–T504: package-format fingerprint (REQ-420), source registry
// (REQ-421), update entry point (REQ-422), data-format fingerprint (REQ-423),
// migration entry point (REQ-424), legacy-artifact transition (REQ-420/423),
// and migration-failure preservation (REQ-424). Each test name carries the
// T-ID(s) it exercises so the coverage register can promote the REQ to C.
//
// The server-side fingerprint tests boot a real server against a temp data dir;
// the entry-point tests (T499/T500/T502/T504) invoke the root build-tooling
// scripts (`scripts/build-ruleset.ts`, `update-rulesets.ts`, `migrate-user-data.ts`)
// against the same temp dir, since those REQs are builder/verifier-side.

import { spawn, spawnSync, ChildProcess } from "node:child_process";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createHash } from "node:crypto";

import { PACKAGE_FORMAT, DATA_FORMAT } from "../src/generated/contract-fingerprints.js";

const ROOT = join(import.meta.dirname!, "..", "..");
const SERVER_SCRIPT = join(import.meta.dirname!, "..", "src", "index.ts");
const FIXTURE_DIR = join(import.meta.dirname!, "..", "testdata", "rulesets", "fixture");
const STATE_FIXTURE_DIR = join(import.meta.dirname!, "..", "testdata", "state");
const DATA_DIR = mkdtempSync(join(tmpdir(), "holonovel-fingerprint-"));

// A deliberately-prior fingerprint value, distinct from the live constants.
const PRIOR_PKG = "1111111111111111111111111111111111111111111111111111111111111111";
const PRIOR_DATA = "0000000000000000000000000000000000000000000000000000000000000000";

let passed = 0;
let failed = 0;
async function test(name: string, fn: () => void | Promise<void>): Promise<void> {
  try { await fn(); passed++; console.log(`  PASS ${name}`); }
  catch (e: any) { failed++; console.error(`  FAIL ${name}: ${e.message}`); }
}
function assertContains(hay: string, needle: string): void {
  if (!hay.toLowerCase().includes(needle.toLowerCase())) throw new Error(`expected to contain "${needle}", got: ${hay.substring(0, 300)}`);
}
function assertNotContains(hay: string, needle: string): void {
  if (hay.toLowerCase().includes(needle.toLowerCase())) throw new Error(`expected NOT to contain "${needle}"`);
}

// ── MCP client (server-side tests) ──────────────────────────────────

let msgId = 0;
const pending = new Map<number, (msg: any) => void>();
let buffer = "";
function send(proc: ChildProcess, msg: any): Promise<any> {
  return new Promise((resolve) => {
    const id = ++msgId;
    pending.set(id, resolve);
    proc.stdin!.write(JSON.stringify({ ...msg, id, jsonrpc: "2.0" }) + "\n");
  });
}
function attach(proc: ChildProcess): void {
  buffer = "";
  proc.stdout!.on("data", (data: Buffer) => {
    buffer += data.toString();
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const m = JSON.parse(line);
        if (m.id !== undefined && pending.has(m.id)) { pending.get(m.id)!(m); pending.delete(m.id); }
      } catch { /* non-JSON */ }
    }
  });
}
async function boot(env: Record<string, string> = {}): Promise<ChildProcess> {
  const proc = spawn("npx", ["tsx", SERVER_SCRIPT], {
    env: { ...process.env, TTRPG_DATA_DIR: DATA_DIR, ...env },
    stdio: ["pipe", "pipe", "pipe"],
  });
  attach(proc);
  await send(proc, { method: "initialize", params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "fingerprint", version: "1.0.0" } } });
  proc.stdin!.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n");
  await sleep(300);
  return proc;
}
async function call(proc: ChildProcess, name: string, args: Record<string, unknown> = {}): Promise<string> {
  const resp = await send(proc, { method: "tools/call", params: { name, arguments: args } });
  if (resp.error) throw new Error(`RPC error: ${JSON.stringify(resp.error)}`);
  const content = resp.result?.content ?? [];
  return content.map((c: any) => (c?.text ?? "")).join("\n");
}
function kill(proc: ChildProcess): Promise<void> {
  return new Promise((resolve) => {
    if (proc.exitCode !== null || proc.signalCode !== null) { resolve(); return; }
    let done = false;
    const finish = () => { if (!done) { done = true; resolve(); } };
    proc.on("exit", finish);
    proc.on("error", finish);
    try { proc.kill(); } catch { finish(); }
    setTimeout(finish, 5000);
  });
}
function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

// ── Ruleset package seeding ─────────────────────────────────────────

function contentHash(index: any, model: any, tools: any, resources: any, prompts: any): string {
  const canonical = (obj: any) => JSON.stringify(JSON.parse(JSON.stringify(obj)));
  const h = createHash("sha256");
  for (const obj of [index, model, tools, resources, prompts]) h.update(canonical(obj));
  return h.digest("hex");
}

// Copy the committed fixture's five content files into `dir`, write a manifest,
// and return the content hash. `packageFormat` may be the live constant, a prior
// value, or `undefined` (legacy — no package_format field).
function seedPackage(dir: string, slug: string, packageFormat: string | undefined): string {
  mkdirSync(dir, { recursive: true });
  const index = JSON.parse(readFileSync(join(FIXTURE_DIR, "index.json"), "utf-8"));
  const model = JSON.parse(readFileSync(join(FIXTURE_DIR, "model.json"), "utf-8"));
  const tools = JSON.parse(readFileSync(join(FIXTURE_DIR, "tools.json"), "utf-8"));
  const resources = JSON.parse(readFileSync(join(FIXTURE_DIR, "resources.json"), "utf-8"));
  const prompts = JSON.parse(readFileSync(join(FIXTURE_DIR, "prompts.json"), "utf-8"));
  const hash = contentHash(index, model, tools, resources, prompts);
  const manifest: Record<string, any> = {
    slug, name: `${slug} ruleset`, host_version: "2026.08.30",
    content_hash: hash, built_at: "2026-08-30T00:00:00Z",
    counts: { index: index.length, model: Object.keys(model).length, tools: tools.length },
  };
  if (packageFormat !== undefined) manifest.package_format = packageFormat;
  writeFileSync(join(dir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
  writeFileSync(join(dir, "index.json"), JSON.stringify(index, null, 2) + "\n");
  writeFileSync(join(dir, "model.json"), JSON.stringify(model, null, 2) + "\n");
  writeFileSync(join(dir, "tools.json"), JSON.stringify(tools, null, 2) + "\n");
  writeFileSync(join(dir, "resources.json"), JSON.stringify(resources, null, 2) + "\n");
  writeFileSync(join(dir, "prompts.json"), JSON.stringify(prompts, null, 2) + "\n");
  return hash;
}

function seedInstallDir(installDir: string): void {
  mkdirSync(installDir, { recursive: true });
  seedPackage(join(installDir, "current"), "current", PACKAGE_FORMAT);
  seedPackage(join(installDir, "stale"), "stale", PRIOR_PKG);
  seedPackage(join(installDir, "legacy"), "legacy", undefined);
}

// ── State fixture seeding (prior data-format fingerprint) ───────────

function seedStateFixtures(dataDir: string): void {
  mkdirSync(join(dataDir, "novels"), { recursive: true });
  // Novel under a prior data-format fingerprint, no checksum (prior artifacts
  // predate checksumming) so it loads directly.
  const novel = JSON.parse(readFileSync(join(STATE_FIXTURE_DIR, "novel-prior.json"), "utf-8"));
  writeFileSync(join(dataDir, "novels", `${novel.slug}.json`), JSON.stringify(novel, null, 2) + "\n");
  for (const f of ["roster", "codex", "server-notes"]) {
    const data = JSON.parse(readFileSync(join(STATE_FIXTURE_DIR, `${f}-prior.json`), "utf-8"));
    writeFileSync(join(dataDir, `${f}.json`), JSON.stringify(data, null, 2) + "\n");
  }
}

// ── Root build-tooling script runner (T499/T500/T502/T504) ──────────

function runRootScript(scriptName: string, args: string[] = []): { stdout: string; stderr: string; status: number } {
  const r = spawnSync("npx", ["tsx", join(ROOT, "scripts", scriptName), ...args], {
    env: { ...process.env, TTRPG_DATA_DIR: DATA_DIR, TTRPG_RULESET_DIRS: join(DATA_DIR, "rulesets") },
    encoding: "utf-8",
    timeout: 30000,
  });
  return { stdout: r.stdout ?? "", stderr: r.stderr ?? "", status: r.status ?? -1 };
}

async function main() {
  console.log("=== §5.18 Fingerprints & Entry Points (REQ-420–424) ===\n");
  mkdirSync(DATA_DIR, { recursive: true });

  // ── T498 + T503 (package side) — server-runtime fingerprint gate ──
  {
    seedInstallDir(join(DATA_DIR, "rulesets"));
    const proc = await boot();
    await call(proc, "create_novel", { name: "fp-novel" });
    await call(proc, "set_badge", { badge: "game_master" });

    await test("T498/REQ-420: package-format fingerprint flags prior-fingerprint package, keeps current", async () => {
      const health = JSON.parse(await call(proc, "spec_health", {}));
      const alerts: { slug: string; reason: string }[] = health.ruleset_package_alerts ?? [];
      const stale = alerts.find((a) => a.slug === "stale");
      if (!stale) throw new Error(`no stale alert; alerts=${JSON.stringify(alerts)}`);
      assertContains(stale.reason, "[package-incompatible]".toLowerCase());
      // Both fingerprints named.
      if (!stale.reason.includes(PRIOR_PKG)) throw new Error(`reason missing prior fingerprint: ${stale.reason}`);
      if (!stale.reason.includes(PACKAGE_FORMAT)) throw new Error(`reason missing current fingerprint: ${stale.reason}`);
      // Current package is installed (not flagged) — stays loaded.
      if (alerts.some((a) => a.slug === "current")) throw new Error("current package wrongly flagged");
      if (health.rulesets_installed < 1) throw new Error("current package not installed");
      // Stale package held inactive — not installable/usable.
      const bind = await call(proc, "create_novel", { name: "fp-bind", ruleset: "stale" });
      assertContains(bind, "not installed");
    });

    await test("T503/REQ-420+REQ-423: legacy package without package_format flagged, not hard-blocked", async () => {
      const health = JSON.parse(await call(proc, "spec_health", {}));
      const alerts: { slug: string; reason: string }[] = health.ruleset_package_alerts ?? [];
      const legacy = alerts.find((a) => a.slug === "legacy");
      if (!legacy) throw new Error(`no legacy alert; alerts=${JSON.stringify(alerts)}`);
      assertContains(legacy.reason, "missing package-format fingerprint");
      // Not hard-blocked: server still serves other calls.
      const list = await call(proc, "list_rulesets", {});
      assertContains(list, "current");
    });

    await kill(proc);
  }

  // ── T501 + T503 (data side) — data-format fingerprint gate ────────
  {
    seedStateFixtures(DATA_DIR);
    const proc = await boot();
    await call(proc, "set_badge", { badge: "game_master" });

    await test("T501/REQ-423: prior data-format fingerprint flags Novel/roster/codex/notes, still loads", async () => {
      const res = await call(proc, "resume_novel", { slug: "prior-novel" });
      assertContains(res, "prior-novel");
      const health = JSON.parse(await call(proc, "spec_health", {}));
      const stale: Record<string, string> = health.data_health?.stale ?? {};
      if (!stale["novel:prior-novel"]) throw new Error(`novel not flagged stale; stale=${JSON.stringify(stale)}`);
      for (const k of ["roster", "codex", "server-notes"]) {
        if (!stale[k]) throw new Error(`${k} not flagged stale; stale=${JSON.stringify(stale)}`);
      }
      if (health.data_health?.data_format !== DATA_FORMAT) throw new Error("current data_format not surfaced");
    });

    await test("T503/REQ-423: Novel lacking a data_format stamp flagged [data-stale] and loads", async () => {
      // Write a legacy novel (no data_format key) and resume it.
      const legacy = JSON.parse(readFileSync(join(STATE_FIXTURE_DIR, "novel-prior.json"), "utf-8"));
      delete legacy.data_format;
      legacy.slug = "legacy-novel";
      legacy.name = "legacy-novel";
      writeFileSync(join(DATA_DIR, "novels", "legacy-novel.json"), JSON.stringify(legacy, null, 2) + "\n");
      const res = await call(proc, "resume_novel", { slug: "legacy-novel" });
      assertContains(res, "legacy-novel");
      const health = JSON.parse(await call(proc, "spec_health", {}));
      const stale: Record<string, string> = health.data_health?.stale ?? {};
      if (!stale["novel:legacy-novel"]) throw new Error(`legacy novel not flagged; stale=${JSON.stringify(stale)}`);
      assertContains(stale["novel:legacy-novel"], "missing data-format fingerprint");
    });

    await kill(proc);
  }

  // ── T499 (REQ-421) — source registry ─────────────────────────────
  {
    const srcDir = join(DATA_DIR, "src");
    mkdirSync(srcDir, { recursive: true });
    writeFileSync(join(srcDir, "rules.md"), "# Rules\n");
    await test("T499/REQ-421: build-ruleset records slug→source registry; bare slug defaults to recorded path", async () => {
      const r1 = runRootScript("build-ruleset.ts", [`demo=${srcDir}`]);
      if (r1.status !== 0) throw new Error(`build-ruleset failed: ${r1.stdout} ${r1.stderr}`);
      const registry = JSON.parse(readFileSync(join(DATA_DIR, "ruleset-registry.json"), "utf-8"));
      const entry = registry["demo"];
      if (!entry) throw new Error(`no registry entry; ${JSON.stringify(registry)}`);
      if (entry.source !== srcDir) throw new Error(`source mismatch: ${entry.source}`);
      if (entry.package_format !== PACKAGE_FORMAT) throw new Error(`package_format mismatch: ${entry.package_format}`);
      if (!entry.built_at) throw new Error("missing built_at");
      // Bare slug defaults to the recorded path.
      const r2 = runRootScript("build-ruleset.ts", ["demo"]);
      assertContains(r2.stdout, `recorded source ${srcDir}`);
    });
  }

  // ── T500 (REQ-422) — update entry point ──────────────────────────
  {
    const registry = { stale: { source: join(DATA_DIR, "src"), package_format: PACKAGE_FORMAT, built_at: "2026-08-30T00:00:00Z" } };
    writeFileSync(join(DATA_DIR, "ruleset-registry.json"), JSON.stringify(registry, null, 2) + "\n");
    await test("T500/REQ-422: update-rulesets reports stale slug with source + Build invocation, omits current", async () => {
      const r = runRootScript("update-rulesets.ts");
      if (r.status !== 0) throw new Error(`update-rulesets failed: ${r.stdout} ${r.stderr}`);
      assertContains(r.stdout, "stale");
      assertContains(r.stdout, "source:");
      assertContains(r.stdout, "Build workflow");
      assertContains(r.stdout, "Install directory");
      // The current package must not appear in the stale rebuild list
      // (which prints "<slug> — source: ..."), even though it appears in the
      // per-package summary as "current: current".
      assertNotContains(r.stdout, "current — source:");
    });
  }

  // ── T502 + T504 (REQ-424) — migration entry point ────────────────
  {
    await test("T502/REQ-424: migrate-user-data default is dry-run; --apply re-stamps", async () => {
      // Resume in T501 re-stamped the prior novel to the current fingerprint;
      // re-seed it under the prior fingerprint so migrate has something stale.
      const prior = JSON.parse(readFileSync(join(STATE_FIXTURE_DIR, "novel-prior.json"), "utf-8"));
      writeFileSync(join(DATA_DIR, "novels", "prior-novel.json"), JSON.stringify(prior, null, 2) + "\n");
      const dry = runRootScript("migrate-user-data.ts");
      if (dry.status !== 0) throw new Error(`dry run failed: ${dry.stdout} ${dry.stderr}`);
      assertContains(dry.stdout, "dry run");
      assertContains(dry.stdout, "prior-novel");
      // Dry run changed nothing.
      const before = readFileSync(join(DATA_DIR, "novels", "prior-novel.json"), "utf-8");
      if (before.includes(DATA_FORMAT)) throw new Error("dry run unexpectedly re-stamped the novel");
      // Apply re-stamps.
      const apply = runRootScript("migrate-user-data.ts", ["--apply"]);
      if (apply.status !== 0) throw new Error(`apply failed: ${apply.stdout} ${apply.stderr}`);
      const after = JSON.parse(readFileSync(join(DATA_DIR, "novels", "prior-novel.json"), "utf-8"));
      if (after.data_format !== DATA_FORMAT) throw new Error(`not re-stamped: ${after.data_format}`);
    });

    await test("T504/REQ-424: corrupt stale artifact aborts migration without replacing, names it", async () => {
      // Re-introduce a stale artifact, then corrupt it so the round-trip fails.
      const legacy = JSON.parse(readFileSync(join(STATE_FIXTURE_DIR, "novel-prior.json"), "utf-8"));
      writeFileSync(join(DATA_DIR, "novels", "corrupt.json"), JSON.stringify(legacy, null, 2) + "\n");
      writeFileSync(join(DATA_DIR, "novels", "corrupt.json"), "{ not valid json ");
      const before = readFileSync(join(DATA_DIR, "novels", "corrupt.json"), "utf-8");
      const r = runRootScript("migrate-user-data.ts", ["--apply"]);
      if (r.status === 0) throw new Error(`expected non-zero exit; stdout=${r.stdout}`);
      assertContains(r.stdout, "corrupt");
      assertContains(r.stdout, "FAILED");
      const after = readFileSync(join(DATA_DIR, "novels", "corrupt.json"), "utf-8");
      if (after !== before) throw new Error("corrupt artifact was modified");
    });
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  rmSync(DATA_DIR, { recursive: true, force: true });
  if (failed > 0) process.exit(1);
  process.exit(0);
}

main().catch((e) => { console.error("Fatal:", e); process.exit(2); });
