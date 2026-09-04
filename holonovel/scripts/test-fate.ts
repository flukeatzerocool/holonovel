#!/usr/bin/env node
// Fate base-capability harness — exercises Fudge dice (REQ-434), aspects
// (REQ-435), Fate points (REQ-436), and stress + consequences (REQ-437)
// against a real ruleset-free server process. Tests T520–T523.
// Exit codes: 0 = pass, 1 = one or more assertions failed.

import { spawn, ChildProcess } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const SERVER_SCRIPT = join(import.meta.dirname!, "..", "src", "index.ts");
const DATA_DIR = mkdtempSync(join(tmpdir(), "holonovel-fate-"));

let passed = 0;
let failed = 0;
async function test(name: string, fn: () => void | Promise<void>): Promise<void> {
  try { await fn(); passed++; console.log(`  PASS ${name}`); }
  catch (e: any) { failed++; console.error(`  FAIL ${name}: ${e.message}`); }
}
function assert(cond: boolean, msg: string): void { if (!cond) throw new Error(msg); }
function assertContains(hay: string, needle: string): void {
  if (!hay.toLowerCase().includes(needle.toLowerCase())) throw new Error(`expected to contain "${needle}", got: ${hay.substring(0, 300)}`);
}
function assertNotContains(hay: string, needle: string): void {
  if (hay.toLowerCase().includes(needle.toLowerCase())) throw new Error(`expected NOT to contain "${needle}", got: ${hay.substring(0, 300)}`);
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
      let m: any;
      try { m = JSON.parse(line); } catch { continue; }
      if (m.id !== undefined && pending.has(m.id)) { pending.get(m.id)!(m); pending.delete(m.id); }
    }
  });
}
async function boot(): Promise<ChildProcess> {
  const proc = spawn("npx", ["tsx", SERVER_SCRIPT], {
    env: { ...process.env, TTRPG_DATA_DIR: DATA_DIR },
    stdio: ["pipe", "pipe", "pipe"],
  });
  attach(proc);
  await send(proc, { method: "initialize", params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "test-fate", version: "1" } } });
  proc.stdin!.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n");
  await new Promise((r) => setTimeout(r, 250));
  return proc;
}
async function call(proc: ChildProcess, name: string, args: Record<string, unknown> = {}): Promise<string> {
  const resp = await send(proc, { method: "tools/call", params: { name, arguments: args } });
  if (resp.error) throw new Error(`RPC error: ${JSON.stringify(resp.error)}`);
  const content = resp.result?.content ?? [];
  return content.map((c: any) => (c?.text ?? "")).join("\n");
}
async function newNovel(proc: ChildProcess, name: string): Promise<void> {
  await call(proc, "novel", { action: "create", name });
  await call(proc, "set_badge", { badge: "game_master" });
}

async function main() {
  console.log("=== Fate base capabilities (T520–T523) ===\n");

  // ── T520 (REQ-434) — Fudge dice ───────────────────────────────────
  {
    const proc = await boot();
    await newNovel(proc, "fate-dice");
    await test("T520/REQ-434: 4dF returns four faces in {-1,0,+1}, a total, and a ladder band", async () => {
      const out = await call(proc, "fate", { action: "roll", skill: "Fight", modifier: 2, difficulty: 2, seed: "42" });
      const m = out.match(/faces \[ (.*) \]  total (-?\d+)  modifier/);
      assert(m, `roll output missing faces/total line: ${out}`);
      const faces = m![1].trim().split(/\s+/).map((f) => parseInt(f.replace("+", ""), 10));
      assert(faces.length === 4, `expected 4 faces, got ${faces.length}: ${out}`);
      for (const f of faces) assert([-1, 0, 1].includes(f), `face ${f} not in {-1,0,1}: ${out}`);
      assert(/Fail|Tie|Succeed with style|Succeed/.test(out), `missing ladder band: ${out}`);
    });
    await test("T520/REQ-434: same seed reproduces identical faces", async () => {
      const a = await call(proc, "fate", { action: "roll", seed: "42" });
      const b = await call(proc, "fate", { action: "roll", seed: "42" });
      assert(a === b, `seeded rolls diverged:\n${a}\nvs\n${b}`);
    });
    proc.kill("SIGKILL");
  }

  // ── T521 (REQ-435) — aspects ──────────────────────────────────────
  {
    const proc = await boot();
    await newNovel(proc, "fate-aspect");
    await test("T521/REQ-435: create/list an aspect; invoke consumes one Fate point", async () => {
      const create = await call(proc, "fate", { action: "aspect", op: "create", name: "Dark Alley", target: "scene" });
      assertContains(create, "Dark Alley");
      const list = await call(proc, "fate", { action: "aspect", op: "list" });
      assertContains(list, "Dark Alley");
      const invoke = await call(proc, "fate", { action: "aspect", op: "invoke", name: "Dark Alley", entity_id: "pc_1" });
      assertContains(invoke, "2 Fate point");
    });
    await test("T521/REQ-435: invoke with zero Fate points is refused", async () => {
      await call(proc, "fate", { action: "aspect", op: "invoke", name: "Dark Alley", entity_id: "pc_1" });
      await call(proc, "fate", { action: "aspect", op: "invoke", name: "Dark Alley", entity_id: "pc_1" });
      const refused = await call(proc, "fate", { action: "aspect", op: "invoke", name: "Dark Alley", entity_id: "pc_1" });
      assertContains(refused, "RULE_VIOLATION");
    });
    proc.kill("SIGKILL");
  }

  // ── T522 (REQ-436) — Fate points ──────────────────────────────────
  {
    const proc = await boot();
    await newNovel(proc, "fate-points");
    await test("T522/REQ-436: spend reduces points; spend at zero is refused; refresh restores", async () => {
      const spend = await call(proc, "fate", { action: "fate_point", op: "spend", entity_id: "pc_1", amount: 1 });
      assertContains(spend, "now 2");
      const spend2 = await call(proc, "fate", { action: "fate_point", op: "spend", entity_id: "pc_1", amount: 2 });
      assertContains(spend2, "now 0");
      const refused = await call(proc, "fate", { action: "fate_point", op: "spend", entity_id: "pc_1", amount: 1 });
      assertContains(refused, "RULE_VIOLATION");
      const refresh = await call(proc, "fate", { action: "fate_point", op: "refresh", entity_id: "pc_1" });
      assertContains(refresh, "refreshed to 3");
      const list = await call(proc, "fate", { action: "fate_point", op: "list" });
      assertContains(list, "pc_1");
    });
    proc.kill("SIGKILL");
  }

  // ── T523 (REQ-437) — stress & consequences ────────────────────────
  {
    const proc = await boot();
    await newNovel(proc, "fate-stress");
    await test("T523/REQ-437: mark physical stress and a consequence; clear empties the track", async () => {
      const mark = await call(proc, "fate", { action: "stress", op: "mark", entity_id: "pc_1", track: "physical", shifts: 2 });
      assertContains(mark, "physical 2");
      const cons = await call(proc, "fate", { action: "stress", op: "mark", entity_id: "pc_1", consequence: "moderate" });
      assertContains(cons, "moderate");
      const list = await call(proc, "fate", { action: "stress", op: "list" });
      assertContains(list, "physical");
      assertContains(list, "moderate");
      const clear = await call(proc, "fate", { action: "stress", op: "clear", entity_id: "pc_1", track: "physical" });
      assertContains(clear, "physical 0");
    });
    proc.kill("SIGKILL");
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => { console.error("Harness fatal error:", e); process.exit(2); });
