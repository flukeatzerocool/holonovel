#!/usr/bin/env node
// Forged in the Dark base-capability harness — exercises the action roll with
// position/effect (REQ-441), stress/trauma + resistance (REQ-442), and
// downtime recovery (REQ-443) against a real ruleset-free server process.
// Tests T527–T529. Exit codes: 0 = pass, 1 = one or more assertions failed.

import { spawn, ChildProcess } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const SERVER_SCRIPT = join(import.meta.dirname!, "..", "src", "index.ts");
const DATA_DIR = mkdtempSync(join(tmpdir(), "holonovel-forged-"));

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
  await send(proc, { method: "initialize", params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "test-forged", version: "1" } } });
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
  console.log("=== Forged in the Dark base capabilities (T527–T529) ===\n");

  // ── T527 (REQ-441) — action roll with position/effect ─────────────
  {
    const proc = await boot();
    await newNovel(proc, "fitd-roll");
    await test("T527/REQ-441: action roll reports highest die, position, effect, and a band", async () => {
      const out = await call(proc, "forged", { action: "action_roll", name: "Skirmish", dice: 3, position: "risky", effect: "standard", seed: "42" });
      assertContains(out, "Skirmish");
      assertContains(out, "risky position");
      assertContains(out, "standard effect");
      assertContains(out, "highest");
      assert(/Critical success|Partial success|Miss/.test(out), `missing band: ${out}`);
    });
    await test("T527/REQ-441: same seed reproduces identical action rolls", async () => {
      const a = await call(proc, "forged", { action: "action_roll", dice: 2, seed: "42" });
      const b = await call(proc, "forged", { action: "action_roll", dice: 2, seed: "42" });
      assert(a === b, `seeded rolls diverged:\n${a}\nvs\n${b}`);
    });
    proc.kill("SIGKILL");
  }

  // ── T528 (REQ-442) — stress/trauma + resistance ───────────────────
  {
    const proc = await boot();
    await newNovel(proc, "fitd-stress");
    await test("T528/REQ-442: mark stress, resist for stress, and fill the track to trauma", async () => {
      const mark = await call(proc, "forged", { action: "stress", op: "mark", entity_id: "pc_1", amount: 2 });
      assertContains(mark, "stress now 2/8");
      const resist = await call(proc, "forged", { action: "stress", op: "resist", entity_id: "pc_1", name: "Harm", cost: 2 });
      assertContains(resist, "resisted 'Harm' for 2 stress");
      assertContains(resist, "now 4/8");
      const fill = await call(proc, "forged", { action: "stress", op: "mark", entity_id: "pc_1", amount: 4 });
      assertContains(fill, "gained trauma");
      assertContains(fill, "stress reset to 0");
      const list = await call(proc, "forged", { action: "stress", op: "list" });
      assertContains(list, "trauma");
    });
    await test("T528/REQ-442: resist is refused when it would exceed the track", async () => {
      await call(proc, "forged", { action: "stress", op: "mark", entity_id: "pc_2", amount: 7 });
      const refused = await call(proc, "forged", { action: "stress", op: "resist", entity_id: "pc_2", cost: 2 });
      assertContains(refused, "RULE_VIOLATION");
    });
    proc.kill("SIGKILL");
  }

  // ── T529 (REQ-443) — downtime ─────────────────────────────────────
  {
    const proc = await boot();
    await newNovel(proc, "fitd-downtime");
    await test("T529/REQ-443: recover reduces stress; indulge_vice clears it", async () => {
      await call(proc, "forged", { action: "stress", op: "mark", entity_id: "pc_1", amount: 3 });
      const recover = await call(proc, "forged", { action: "downtime", op: "recover", entity_id: "pc_1", amount: 2 });
      assertContains(recover, "stress now 1/8");
      const vice = await call(proc, "forged", { action: "downtime", op: "indulge_vice", entity_id: "pc_1" });
      assertContains(vice, "stress cleared to 0");
    });
    proc.kill("SIGKILL");
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => { console.error("Harness fatal error:", e); process.exit(2); });
