#!/usr/bin/env node
// Durable Agent Task harness — REQ-522 (create/queued), REQ-523 (lifecycle),
// REQ-524 (admitted transitions), REQ-525 (action log), REQ-526 (autonomy),
// REQ-527 (subject), REQ-528 (terminal immutability), REQ-529 (goal source),
// REQ-530 (badge gating).

import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const SERVER_SCRIPT = join(process.cwd(), "src", "index.ts");
const DATA_DIR = mkdtempSync(join(tmpdir(), "agent-"));
let msgId = 0; const pending = new Map(); let buffer = "";
function send(proc: any, msg: any): Promise<any> { return new Promise((r) => { const id = ++msgId; pending.set(id, r); proc.stdin!.write(JSON.stringify({ ...msg, id, jsonrpc: "2.0" }) + "\n"); }); }
function attach(proc: any) { buffer = ""; proc.stdout!.on("data", (d: Buffer) => { buffer += d.toString(); const ls = buffer.split("\n"); buffer = ls.pop() ?? ""; for (const l of ls) { if (!l.trim()) continue; try { const m = JSON.parse(l); if (m.id !== undefined && pending.has(m.id)) { pending.get(m.id)!(m); pending.delete(m.id); } } catch { /* non-JSON */ } } }); }
async function boot() { const p = spawn("npx", ["tsx", SERVER_SCRIPT], { env: { ...process.env, TTRPG_DATA_DIR: DATA_DIR }, stdio: ["pipe", "pipe", "pipe"] }); attach(p); await send(p, { method: "initialize", params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "agent", version: "1" } } }); p.stdin!.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n"); await new Promise((r) => setTimeout(r, 250)); return p; }
async function call(proc: any, name: string, args: any = {}): Promise<string> { const r = await send(proc, { method: "tools/call", params: { name, arguments: args } }); return (r.result?.content ?? []).map((x: any) => x?.text ?? "").join("\n"); }
async function kill(proc: any) { try { proc.kill("SIGKILL"); } catch { /* exited */ } await new Promise((r) => setTimeout(r, 100)); }

let passed = 0; let failed = 0;
async function test(name: string, fn: () => void | Promise<void>) { try { await fn(); passed++; console.log(`PASS ${name}`); } catch (e: any) { failed++; console.error(`FAIL ${name}: ${e.message ?? e}`); } }
function assert(c: any, m: string) { if (!c) throw new Error(m); }
async function newNovel(p: any, name: string) { await call(p, "manage_novel", { action: "create", name }); await call(p, "set_badge", { badge: "game_master" }); }
async function create(p: any, args: any): Promise<string> { const r = await call(p, "manage_agent", { action: "create", ...args }); const m = r.match(/task (task-\d+)/); if (!m) throw new Error("create failed: " + r.slice(0, 120)); return m[1]; }

async function main() {
  await test("T605/REQ-522: a new task is queued", async () => {
    const p = await boot(); await newNovel(p, "ag1");
    const id = await create(p, { subject: "npc_kael", goal: "Secure the dock" });
    const t = JSON.parse(await call(p, "manage_agent", { action: "get", task_id: id }));
    assert(t.status === "queued" && t.actions.length === 0, "not queued: " + JSON.stringify(t));
    await kill(p);
  });

  await test("T606/REQ-523: lifecycle queued->active->done", async () => {
    const p = await boot(); await newNovel(p, "ag2");
    const id = await create(p, { subject: "npc_kael", goal: "g" });
    await call(p, "manage_agent", { action: "start", task_id: id });
    await call(p, "manage_agent", { action: "complete", task_id: id });
    const t = JSON.parse(await call(p, "manage_agent", { action: "get", task_id: id }));
    assert(t.status === "done", "not done: " + t.status);
    await kill(p);
  });

  await test("T607/REQ-524: an illegal transition is refused", async () => {
    const p = await boot(); await newNovel(p, "ag3");
    const id = await create(p, { subject: "npc_kael", goal: "g" });
    await call(p, "manage_agent", { action: "complete", task_id: id }); // queued->done illegal
    const t = JSON.parse(await call(p, "manage_agent", { action: "get", task_id: id }));
    assert(t.status === "queued", "illegal transition applied: " + t.status);
    await kill(p);
  });

  await test("T608/REQ-525: advance appends an action", async () => {
    const p = await boot(); await newNovel(p, "ag4");
    const id = await create(p, { subject: "npc_kael", goal: "g" });
    await call(p, "manage_agent", { action: "start", task_id: id });
    await call(p, "manage_agent", { action: "advance", task_id: id, description: "hired a guide" });
    const t = JSON.parse(await call(p, "manage_agent", { action: "get", task_id: id }));
    assert(t.actions.length === 1 && t.actions[0].description === "hired a guide", "action not logged: " + JSON.stringify(t.actions));
    await kill(p);
  });

  await test("T609/REQ-526: autonomy is recorded", async () => {
    const p = await boot(); await newNovel(p, "ag5");
    const id = await create(p, { subject: "npc_kael", goal: "g", autonomy: "auto" });
    const t = JSON.parse(await call(p, "manage_agent", { action: "get", task_id: id }));
    assert(t.autonomy === "auto", "autonomy not recorded: " + t.autonomy);
    await kill(p);
  });

  await test("T610/REQ-527: tasks are filterable by subject", async () => {
    const p = await boot(); await newNovel(p, "ag6");
    await create(p, { subject: "npc_a", goal: "g" });
    await create(p, { subject: "npc_b", goal: "g" });
    const list = JSON.parse(await call(p, "manage_agent", { action: "list", subject: "npc_a" }));
    assert(list.length === 1 && list[0].subject === "npc_a", "subject filter wrong: " + JSON.stringify(list));
    await kill(p);
  });

  await test("T611/REQ-528: a terminal task cannot advance", async () => {
    const p = await boot(); await newNovel(p, "ag7");
    const id = await create(p, { subject: "npc_kael", goal: "g" });
    await call(p, "manage_agent", { action: "start", task_id: id });
    await call(p, "manage_agent", { action: "complete", task_id: id });
    const r = await call(p, "manage_agent", { action: "advance", task_id: id, description: "late" });
    assert(r.includes("STATE_CONFLICT") || r.includes("[ERROR]"), "terminal task advanced: " + r.slice(0, 100));
    await kill(p);
  });

  await test("T612/REQ-529: a task may cite its originating goal suggestion", async () => {
    const p = await boot(); await newNovel(p, "ag8");
    const id = await create(p, { subject: "npc_kael", goal: "g", source_goal: "Steal the crown" });
    const t = JSON.parse(await call(p, "manage_agent", { action: "get", task_id: id }));
    assert(t.source_goal === "Steal the crown", "source goal not recorded");
    await kill(p);
  });

  await test("T613/REQ-530: Player cannot create; Observer is read-only", async () => {
    const p = await boot(); await newNovel(p, "ag9");
    await call(p, "set_badge", { badge: "player" });
    const pc = await call(p, "manage_agent", { action: "create", subject: "x", goal: "y" });
    assert(pc.includes("[FORBIDDEN]"), "Player create not forbidden: " + pc.slice(0, 100));
    await call(p, "set_badge", { badge: "observer" });
    const ob = await call(p, "manage_agent", { action: "create", subject: "x", goal: "y" });
    assert(ob.includes("[FORBIDDEN]") || ob.includes("[ERROR]"), "Observer create not refused: " + ob.slice(0, 100));
    await kill(p);
  });

  console.log(`\n${passed} passed, ${failed} failed`);
  rmSync(DATA_DIR, { recursive: true, force: true });
  if (failed > 0) process.exit(1);
}
main().catch((e) => { console.error("FATAL", e); process.exit(2); });
