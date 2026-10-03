#!/usr/bin/env node
// Knowledge-Graph harness — covers REQ-510 (derived projection), REQ-511 (node [gate]
// typing), REQ-512 (edge derivation), REQ-513 (idempotency/staleness),
// REQ-514 (read-only scope-filtered exposure).

import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { installHarnessGuard, harnessComplete } from "./lib/harness-guard.js";
installHarnessGuard();

const SERVER_SCRIPT = join(process.cwd(), "src", "index.ts");
const DATA_DIR = mkdtempSync(join(tmpdir(), "graph-"));
let msgId = 0; const pending = new Map(); let buffer = "";
function send(proc: any, msg: any): Promise<any> { return new Promise((r) => { const id = ++msgId; pending.set(id, r); proc.stdin!.write(JSON.stringify({ ...msg, id, jsonrpc: "2.0" }) + "\n"); }); }
function attach(proc: any) { buffer = ""; proc.stdout!.on("data", (d: Buffer) => { buffer += d.toString(); const ls = buffer.split("\n"); buffer = ls.pop() ?? ""; for (const l of ls) { if (!l.trim()) continue; try { const m = JSON.parse(l); if (m.id !== undefined && pending.has(m.id)) { pending.get(m.id)!(m); pending.delete(m.id); } } catch { /* non-JSON line */ } } }); }
async function boot() { const p = spawn("npx", ["tsx", SERVER_SCRIPT], { env: { ...process.env, TTRPG_DATA_DIR: DATA_DIR }, stdio: ["pipe", "pipe", "pipe"] }); attach(p); await send(p, { method: "initialize", params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "graph", version: "1" } } }); p.stdin!.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n"); await new Promise((r) => setTimeout(r, 250)); return p; }
async function call(proc: any, name: string, args: any = {}): Promise<string> { const r = await send(proc, { method: "tools/call", params: { name, arguments: args } }); const c = r.result?.content ?? []; return c.map((x: any) => x?.text ?? "").join("\n"); }
async function kill(proc: any) { try { proc.kill("SIGKILL"); } catch { /* already exited */ } await new Promise((r) => setTimeout(r, 100)); }

let passed = 0; let failed = 0;
async function test(name: string, fn: () => void | Promise<void>): Promise<void> {
  try { await fn(); passed++; console.log(`PASS ${name}`); } catch (e: any) { failed++; console.error(`FAIL ${name}: ${e.message ?? e}`); }
}
function assert(cond: any, msg: string) { if (!cond) throw new Error(msg); }
async function newNovel(p: any, name: string) { await call(p, "manage_novel", { action: "create", name }); await call(p, "set_badge", { badge: "game_master" }); }
async function mkChar(p: any, name: string): Promise<string> { const r = await call(p, "manage_character", { action: "create", name }); const m = r.match(/Entity id (\S+?)\./); if (!m) throw new Error("char create failed: " + r.slice(0, 120)); return m[1]; }
async function build(p: any) { return call(p, "manage_knowledge", { action: "graph_build" }); }
async function graph(p: any): Promise<any> { return JSON.parse(await call(p, "manage_knowledge", { action: "graph_get" })); }

async function main() {
  // ── T600: derived projection (REQ-510) ───────────────────────────────
  await test("T600/REQ-510: projection is derived and idempotent, not state", async () => {
    const p = await boot(); await newNovel(p, "kg1");
    await mkChar(p, "Alice");
    await call(p, "manage_lore", { action: "set", key: "dragon", content: "a dragon", badge_scope: "shared" });
    const before = await call(p, "manage_lore", { action: "list" });
    await build(p);
    const g1 = await graph(p);
    assert(g1.nodes.length >= 2, "expected nodes for character and lore: " + JSON.stringify(g1.nodes));
    await build(p);
    const g2 = await graph(p);
    assert(JSON.stringify(g1.nodes) === JSON.stringify(g2.nodes) && JSON.stringify(g1.edges) === JSON.stringify(g2.edges), "rebuild is not idempotent");
    assert(before === await call(p, "manage_lore", { action: "list" }), "projection mutated authoritatative state");
    await kill(p);
  });

  // ── T601: node typing (REQ-511) ──────────────────────────────────────
  await test("T601/REQ-511: nodes carry stable id, type, and label", async () => {
    const p = await boot(); await newNovel(p, "kg2");
    await mkChar(p, "Alice");
    await build(p);
    const g = await graph(p);
    const alice = g.nodes.find((n: any) => n.type === "character" && n.label === "Alice");
    assert(alice && alice.id.startsWith("character:"), "character node not typed: " + JSON.stringify(g.nodes));
    await kill(p);
  });

  // ── T602: edge derivation (REQ-512) ──────────────────────────────────
  await test("T602/REQ-512: relationship and location edges are derived", async () => {
    const p = await boot(); await newNovel(p, "kg3");
    const alice = await mkChar(p, "Alice");
    const carol = await mkChar(p, "Carol");
    await call(p, "manage_relationship", { action: "set", entity_a: alice, entity_b: carol, type: "ally" });
    await call(p, "manage_world", { action: "create_room", name: "hall" });
    await call(p, "manage_npc", { action: "create", name: "Bob", location: "hall" });
    await build(p);
    const g = await graph(p);
    const rel = g.edges.find((e: any) => e.type === "relates_to" && e.label === "ally");
    assert(rel, "relationship edge missing: " + JSON.stringify(g.edges));
    const loc = g.edges.find((e: any) => e.type === "located_in" && e.from.startsWith("npc:") && e.to.startsWith("room:"));
    assert(loc, "location edge missing: " + JSON.stringify(g.edges));
    await kill(p);
  });

  // ── T603: idempotency + staleness (REQ-513) ──────────────────────────
  await test("T603/REQ-513: the graph reports staleness when sources change", async () => {
    const p = await boot(); await newNovel(p, "kg4");
    await call(p, "manage_lore", { action: "set", key: "a", content: "one", badge_scope: "shared" });
    await build(p);
    assert((await call(p, "manage_knowledge", { action: "graph_status" })).includes("current"), "fresh graph reported stale");
    await call(p, "manage_lore", { action: "set", key: "b", content: "two", badge_scope: "shared" });
    assert((await call(p, "manage_knowledge", { action: "graph_status" })).includes("STALE"), "changed sources not flagged stale");
    await build(p);
    assert((await call(p, "manage_knowledge", { action: "graph_status" })).includes("current"), "rebuild did not clear staleness");
    await kill(p);
  });

  // ── T604: read-only, scope-filtered exposure (REQ-514) ───────────────
  await test("T604/REQ-514: GM-scope nodes are hidden from the Player graph", async () => {
    const p = await boot(); await newNovel(p, "kg5");
    await mkChar(p, "Alice");
    await call(p, "manage_npc", { action: "create", name: "Bob", location: "hall" });
    await call(p, "manage_lore", { action: "set", key: "secret", content: "hidden", badge_scope: "game_master" });
    await build(p);
    const gm = await graph(p);
    assert(gm.nodes.some((n: any) => n.type === "npc"), "GM graph should include NPC nodes");
    await call(p, "set_badge", { badge: "player" });
    const player = await graph(p);
    assert(!player.nodes.some((n: any) => n.type === "npc"), "NPC node leaked to Player graph");
    assert(!player.nodes.some((n: any) => n.id === "lore:secret"), "GM-scope lore leaked to Player graph");
    await kill(p);
  });

  harnessComplete();
  console.log(`\n${passed} passed, ${failed} failed`);
  rmSync(DATA_DIR, { recursive: true, force: true });
  if (failed > 0) process.exit(1);
}
main().catch((e) => { console.error("FATAL", e); process.exit(2); });
