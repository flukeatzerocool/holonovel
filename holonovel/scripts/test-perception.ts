#!/usr/bin/env node
// Perception Ledger harness — REQ-540 (record), REQ-541 (observed vs believed),
// REQ-542 (per-entity), REQ-543 (event provenance), REQ-544 (persistence),
// REQ-545 (badge gating).

import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { installHarnessGuard, harnessComplete } from "./lib/harness-guard.js";
installHarnessGuard();

const SERVER_SCRIPT = join(process.cwd(), "src", "index.ts");
const DATA_DIR = mkdtempSync(join(tmpdir(), "percept-"));
let msgId = 0; const pending = new Map(); let buffer = "";
function send(proc: any, msg: any): Promise<any> { return new Promise((r) => { const id = ++msgId; pending.set(id, r); proc.stdin!.write(JSON.stringify({ ...msg, id, jsonrpc: "2.0" }) + "\n"); }); }
function attach(proc: any) { buffer = ""; proc.stdout!.on("data", (d: Buffer) => { buffer += d.toString(); const ls = buffer.split("\n"); buffer = ls.pop() ?? ""; for (const l of ls) { if (!l.trim()) continue; try { const m = JSON.parse(l); if (m.id !== undefined && pending.has(m.id)) { pending.get(m.id)!(m); pending.delete(m.id); } } catch { /* non-JSON */ } } }); }
async function boot() { const p = spawn("npx", ["tsx", SERVER_SCRIPT], { env: { ...process.env, TTRPG_DATA_DIR: DATA_DIR }, stdio: ["pipe", "pipe", "pipe"] }); attach(p); await send(p, { method: "initialize", params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "percept", version: "1" } } }); p.stdin!.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n"); await new Promise((r) => setTimeout(r, 250)); return p; }
async function call(proc: any, name: string, args: any = {}): Promise<string> { const r = await send(proc, { method: "tools/call", params: { name, arguments: args } }); return (r.result?.content ?? []).map((x: any) => x?.text ?? "").join("\n"); }
const perception = (p: any, args: any) => { const out: any = { action: `perception_${args.action}` }; for (const [k, v] of Object.entries(args)) if (k !== "action") out[`perception_${k}`] = v; return call(p, "manage_belief", out); };
async function kill(proc: any) { try { proc.kill("SIGKILL"); } catch { /* exited */ } await new Promise((r) => setTimeout(r, 100)); }

let passed = 0; let failed = 0;
async function test(name: string, fn: () => void | Promise<void>) { try { await fn(); passed++; console.log(`PASS ${name}`); } catch (e: any) { failed++; console.error(`FAIL ${name}: ${e.message ?? e}`); } }
function assert(c: any, m: string) { if (!c) throw new Error(m); }
async function newNovel(p: any, name: string) { await call(p, "manage_novel", { action: "create", name }); await call(p, "set_badge", { badge: "game_master" }); }
async function rec(p: any, args: any) { return perception(p, { action: "record", ...args }); }
async function forEntity(p: any, id: string): Promise<any[]> { const t = await perception(p, { action: "for_entity", entity_id: id }); try { return JSON.parse(t); } catch { return []; } }

async function main() {
  await test("T614/REQ-540: a perception is recorded with kind and summary", async () => {
    const p = await boot(); await newNovel(p, "pc1");
    await rec(p, { entity_id: "hero", kind: "scene", summary: "the gate opens" });
    const recs = await forEntity(p, "hero");
    assert(recs.length === 1 && recs[0].kind === "scene" && recs[0].summary === "the gate opens", "record wrong: " + JSON.stringify(recs));
    await kill(p);
  });

  await test("T615/REQ-541: perception does not create belief", async () => {
    const p = await boot(); await newNovel(p, "pc2");
    await rec(p, { entity_id: "hero", kind: "observation", summary: "a shape in the mist" });
    const belief = await call(p, "manage_belief", { action: "list", entity_id: "hero" });
    assert(belief.includes("No beliefs") || belief === "", "perception leaked into belief: " + belief.slice(0, 100));
    await kill(p);
  });

  await test("T616/REQ-542: per-entity query returns only that entity's perceptions", async () => {
    const p = await boot(); await newNovel(p, "pc3");
    await rec(p, { entity_id: "hero", summary: "a" });
    await rec(p, { entity_id: "ally", summary: "b" });
    const hero = await forEntity(p, "hero");
    assert(hero.length === 1 && hero[0].entity_id === "hero", "entity filter wrong: " + JSON.stringify(hero));
    await kill(p);
  });

  await test("T617/REQ-543: perceptions carry event provenance", async () => {
    const p = await boot(); await newNovel(p, "pc4");
    await call(p, "manage_session", { action: "event", text: "a horn sounds" });
    await rec(p, { entity_id: "hero", summary: "heard the horn" }); // defaults to latest event ordinal
    const byEvent = JSON.parse(await perception(p, { action: "for_event", event_ordinal: 1 }));
    assert(byEvent.length === 1 && byEvent[0].entity_id === "hero", "event provenance wrong: " + JSON.stringify(byEvent));
    await kill(p);
  });

  await test("T618/REQ-544: perceptions persist across a restart", async () => {
    const p = await boot(); await newNovel(p, "pc5");
    await rec(p, { entity_id: "hero", summary: "a lasting sight" });
    await kill(p);
    const p2 = await boot();
    await call(p2, "manage_novel", { action: "resume", slug: "pc5" });
    const recs = await forEntity(p2, "hero");
    assert(recs.length === 1 && recs[0].summary === "a lasting sight", "perception did not persist");
    await kill(p2);
  });

  await test("T619/REQ-545: Player reads own entity only; Observer cannot record", async () => {
    const p = await boot(); await newNovel(p, "pc6");
    await rec(p, { entity_id: "hero", summary: "x" });
    await rec(p, { entity_id: "villain", summary: "y" });
    await call(p, "set_badge", { badge: "player" });
    const forbidden = await perception(p, { action: "for_entity", entity_id: "villain" });
    assert(forbidden.includes("[FORBIDDEN]"), "Player read of another entity should be forbidden: " + forbidden.slice(0, 100));
    await call(p, "set_badge", { badge: "observer" });
    const obs = await perception(p, { action: "record", entity_id: "hero", summary: "z" });
    assert(obs.includes("[FORBIDDEN]") || obs.includes("[ERROR]"), "Observer record should fail: " + obs.slice(0, 100));
    await kill(p);
  });

  harnessComplete();
  console.log(`\n${passed} passed, ${failed} failed`);
  rmSync(DATA_DIR, { recursive: true, force: true });
  if (failed > 0) process.exit(1);
}
main().catch((e) => { console.error("FATAL", e); process.exit(2); });
