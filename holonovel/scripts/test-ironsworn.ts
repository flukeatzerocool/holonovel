#!/usr/bin/env node
// Ironsworn base-capability harness — exercises momentum (REQ-438), the move
// framework (REQ-439), and progress tracks (REQ-440) against a real
// ruleset-free server process. Tests T524–T526.
// Exit codes: 0 = pass, 1 = one or more assertions failed.

import { spawn, ChildProcess } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const SERVER_SCRIPT = join(import.meta.dirname!, "..", "src", "index.ts");
const DATA_DIR = mkdtempSync(join(tmpdir(), "holonovel-ironsworn-"));

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
  await send(proc, { method: "initialize", params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "test-ironsworn", version: "1" } } });
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
  console.log("=== Ironsworn base capabilities (T524–T526) ===\n");

  // ── T524 (REQ-438) — momentum ─────────────────────────────────────
  {
    const proc = await boot();
    await newNovel(proc, "isw-momentum");
    await test("T524/REQ-438: set/gain/lose/reset momentum, clamped to -6..+10", async () => {
      const set = await call(proc, "ironsworn", { action: "momentum", op: "set", entity_id: "pc_1", amount: 5 });
      assertContains(set, "set to 5");
      const gain = await call(proc, "ironsworn", { action: "momentum", op: "gain", entity_id: "pc_1", amount: 1 });
      assertContains(gain, "now 6");
      const lose = await call(proc, "ironsworn", { action: "momentum", op: "lose", entity_id: "pc_1", amount: 2 });
      assertContains(lose, "now 4");
      const reset = await call(proc, "ironsworn", { action: "momentum", op: "reset", entity_id: "pc_1" });
      assertContains(reset, "reset to 2");
      const clamped = await call(proc, "ironsworn", { action: "momentum", op: "set", entity_id: "pc_1", amount: 99 });
      assertContains(clamped, "set to 10");
    });
    proc.kill("SIGKILL");
  }

  // ── T525 (REQ-439) — move framework ───────────────────────────────
  {
    const proc = await boot();
    await newNovel(proc, "isw-move");
    await test("T525/REQ-439: move rolls an action die and two challenge dice to a hit band", async () => {
      const out = await call(proc, "ironsworn", { action: "move", name: "Face Danger", adds: 2, seed: "42" });
      assertContains(out, "Face Danger");
      assertContains(out, "Action die");
      assertContains(out, "Challenge dice");
      assert(/Strong hit|Weak hit|Miss/.test(out), `missing hit band: ${out}`);
    });
    await test("T525/REQ-439: same seed reproduces identical move results", async () => {
      const a = await call(proc, "ironsworn", { action: "move", seed: "42" });
      const b = await call(proc, "ironsworn", { action: "move", seed: "42" });
      assert(a === b, `seeded moves diverged:\n${a}\nvs\n${b}`);
    });
    proc.kill("SIGKILL");
  }

  // ── T526 (REQ-440) — progress tracks ──────────────────────────────
  {
    const proc = await boot();
    await newNovel(proc, "isw-progress");
    await test("T526/REQ-440: create/mark/test a progress track", async () => {
      const create = await call(proc, "ironsworn", { action: "progress", op: "create", name: "Journey", rank: "dangerous" });
      assertContains(create, "created (dangerous, 10 boxes)");
      const mark = await call(proc, "ironsworn", { action: "progress", op: "mark", name: "Journey", ticks: 2 });
      assertContains(mark, "at 2/10");
      const testRoll = await call(proc, "ironsworn", { action: "progress", op: "test", name: "Journey", seed: "42" });
      assertContains(testRoll, "boxes vs");
      assert(/Strong hit|Weak hit|Miss/.test(testRoll), `missing progress band: ${testRoll}`);
      const list = await call(proc, "ironsworn", { action: "progress", op: "list" });
      assertContains(list, "Journey");
    });
    proc.kill("SIGKILL");
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => { console.error("Harness fatal error:", e); process.exit(2); });
