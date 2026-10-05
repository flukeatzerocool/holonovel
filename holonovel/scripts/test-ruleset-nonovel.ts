#!/usr/bin/env node
// Ruleset no-Novel access harness (REQ-558). Exercises T651 [gate]: an installed
// package serves every derived tool — search, lookup, roll, table, info — with no
// active Novel and no eager-hydration env, and `spec_health` reports the installed
// packages. Also asserts info tools return [NOT_FOUND] (not their own description)
// when no model entry backs them, name/alias resolution, and declared defaultDice.
//
// Exit codes: 0 = pass, 1 = one or more assertions failed.

import { spawn, ChildProcess } from "node:child_process";
import { mkdtempSync, mkdirSync, cpSync, existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { installHarnessGuard, harnessComplete } from "./lib/harness-guard.js";
installHarnessGuard();

const SERVER_SCRIPT = process.env.HOLONOVEL_SERVER ?? join(import.meta.dirname!, "..", "src", "index.ts");
const DATA_DIR = mkdtempSync(join(tmpdir(), "holonovel-ruleset-nonovel-"));
// Prefer the deployed install dir; fall back to the Robotech build output.
const SOURCE_PKG = [
  "/home/fluke/Holonovel-deployed/holonovel/.holonovel-state/rulesets/robotech",
  "/home/fluke/Documents/Robotech-TTRPG/build/package",
].find((p) => existsSync(join(p, "manifest.json")));

let passed = 0;
let failed = 0;
async function test(name: string, fn: () => void | Promise<void>): Promise<void> {
  try { await fn(); passed++; console.log(`  PASS ${name}`); }
  catch (e: any) { failed++; console.error(`  FAIL ${name}: ${e.message}`); }
}
function assertContains(hay: string, needle: string, ctx = ""): void {
  if (!hay.toLowerCase().includes(needle.toLowerCase())) throw new Error(`${ctx} expected to contain "${needle}"`);
}
function assertNotContains(hay: string, needle: string, ctx = ""): void {
  if (hay.toLowerCase().includes(needle.toLowerCase())) throw new Error(`${ctx} expected NOT to contain "${needle}"`);
}

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
        const msg = JSON.parse(line);
        if (msg.id !== undefined && pending.has(msg.id)) { pending.get(msg.id)!(msg); pending.delete(msg.id); }
      } catch { /* non-JSON */ }
    }
  });
}
function bootEnv(): NodeJS.ProcessEnv {
  const env = { ...process.env, TTRPG_DATA_DIR: DATA_DIR };
  // REQ-558 — no Novel, no eager-hydration env: tools must serve on demand.
  delete env.TTRPG_NOVEL;
  delete env.TTRPG_RULESETS;
  return env;
}
async function boot(): Promise<ChildProcess> {
  const proc = spawn("npx", ["tsx", SERVER_SCRIPT], { env: bootEnv(), stdio: ["pipe", "pipe", "pipe"] });
  attach(proc);
  await send(proc, { method: "initialize", params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "ruleset-nonovel", version: "1.0.0" } } });
  proc.stdin!.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n");
  await sleep(250);
  return proc;
}
async function call(proc: ChildProcess, name: string, args: Record<string, unknown> = {}): Promise<string> {
  const resp = await send(proc, { method: "tools/call", params: { name, arguments: args } });
  const content = resp.result?.content ?? [];
  return content.map((c: any) => (c?.text ?? "")).join("\n");
}
function kill(proc: ChildProcess): Promise<void> {
  return new Promise((resolve) => { proc.on("exit", () => resolve()); proc.kill(); });
}
function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

async function main() {
  console.log("=== Ruleset no-Novel access (REQ-558 / T651) ===\n");
  if (!SOURCE_PKG) { console.error("  SKIP: no installed robotech package found to test"); process.exit(0); }
  mkdirSync(join(DATA_DIR, "rulesets"), { recursive: true });
  cpSync(SOURCE_PKG, join(DATA_DIR, "rulesets", "robotech"), { recursive: true });

  await test("T651/REQ-558: tools serve with no active Novel", async () => {
    const p = await boot();
    const out = await call(p, "robotech_lookup_mecha", { key: "VF-1A Veritech Fighter" });
    assertContains(out, "veritech", "lookup by canonical name/alias");
    assertNotContains(out, "not activated", "no hydration gate");
    await kill(p);
  });

  await test("T651/REQ-558a: core_mechanic returns model content, not its description", async () => {
    const p = await boot();
    const out = await call(p, "robotech_core_mechanic", {});
    assertContains(out, "d20", "resolution text");
    assertContains(out, "d100", "skill resolution text");
    assertNotContains(out, "Return the Robotech core resolution mechanic", "must not echo tool description");
    await kill(p);
  });

  await test("T651/REQ-558b: lookups resolve by name and alias", async () => {
    const p = await boot();
    const byName = await call(p, "robotech_lookup_mecha", { key: "VF-1A Veritech Fighter" });
    assertContains(byName, "the-veritech-fighters-2", "resolved the veritech entry");
    const byAlias = await call(p, "robotech_lookup_skill", { key: "Pilot Veritech" });
    assertContains(byAlias, "Pilot Veritech Fighter", "skill alias resolution");
    await kill(p);
  });

  await test("T651/REQ-558c: declared defaultDice is honored", async () => {
    const p = await boot();
    const out = await call(p, "robotech_roll_skill_check", { modifier: 55 });
    assertContains(out, "1d100", "percentile skill check");
    assertNotContains(out, "1d20", "must not fall back to d20");
    await kill(p);
  });

  await test("T651/REQ-558b: table rolls resolve by name", async () => {
    const p = await boot();
    const out = await call(p, "robotech_roll_on_table", { table: "random hit location" });
    assertNotContains(out, "[ERROR] [NOT_FOUND]", "table resolved by name");
    await kill(p);
  });

  await test("T651/REQ-558: manage_ruleset search by slug works with no Novel", async () => {
    const p = await boot();
    const out = await call(p, "manage_ruleset", { action: "search", slug: "robotech", query: "veritech" });
    assertContains(out, "veritech", "slug-scoped search returns entries");
    await kill(p);
  });

  await test("T651/REQ-558d: spec_health reports installed packages and confidence", async () => {
    const p = await boot();
    const out = await call(p, "manage_session", { action: "health" });
    assertContains(out, "robotech", "installed package reported");
    assertNotContains(out, "N/A — ruleset-free", "confidence reflects installed packages");
    await kill(p);
  });

  console.log(`\n${passed} passed, ${failed} failed`);
  rmSync(DATA_DIR, { recursive: true, force: true });
  if (failed === 0) harnessComplete();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
