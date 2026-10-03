#!/usr/bin/env node
// Semantic Index harness — covers REQ-504 (offline build), REQ-505 (staleness), [gate]
// REQ-506 (advisory ranking), REQ-507 (relations), REQ-508 (authority
// boundary), REQ-509 (scope filtering).

import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { installHarnessGuard, harnessComplete } from "./lib/harness-guard.js";
installHarnessGuard();

const SERVER_SCRIPT = join(process.cwd(), "src", "index.ts");
const DATA_DIR = mkdtempSync(join(tmpdir(), "index-"));
let msgId = 0; const pending = new Map(); let buffer = "";
function send(proc: any, msg: any): Promise<any> { return new Promise((r) => { const id = ++msgId; pending.set(id, r); proc.stdin!.write(JSON.stringify({ ...msg, id, jsonrpc: "2.0" }) + "\n"); }); }
function attach(proc: any) { buffer = ""; proc.stdout!.on("data", (d: Buffer) => { buffer += d.toString(); const ls = buffer.split("\n"); buffer = ls.pop() ?? ""; for (const l of ls) { if (!l.trim()) continue; try { const m = JSON.parse(l); if (m.id !== undefined && pending.has(m.id)) { pending.get(m.id)!(m); pending.delete(m.id); } } catch { /* non-JSON line */ } } }); }
async function boot() { const p = spawn("npx", ["tsx", SERVER_SCRIPT], { env: { ...process.env, TTRPG_DATA_DIR: DATA_DIR }, stdio: ["pipe", "pipe", "pipe"] }); attach(p); await send(p, { method: "initialize", params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "index", version: "1" } } }); p.stdin!.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n"); await new Promise((r) => setTimeout(r, 250)); return p; }
async function call(proc: any, name: string, args: any = {}): Promise<string> { const r = await send(proc, { method: "tools/call", params: { name, arguments: args } }); const c = r.result?.content ?? []; return c.map((x: any) => x?.text ?? "").join("\n"); }
async function kill(proc: any) { try { proc.kill("SIGKILL"); } catch { /* already exited */ } await new Promise((r) => setTimeout(r, 100)); }

let passed = 0; let failed = 0;
async function test(name: string, fn: () => void | Promise<void>): Promise<void> {
  try { await fn(); passed++; console.log(`PASS ${name}`); } catch (e: any) { failed++; console.error(`FAIL ${name}: ${e.message ?? e}`); }
}
function assert(cond: any, msg: string) { if (!cond) throw new Error(msg); }
async function newNovel(p: any, name: string) { await call(p, "manage_novel", { action: "create", name }); await call(p, "set_badge", { badge: "game_master" }); }
async function lore(p: any, key: string, content: string, badge_scope = "shared", triggers: string[] = []) { return call(p, "manage_lore", { action: "set", key, content, badge_scope, triggers }); }
async function build(p: any) { return call(p, "manage_knowledge", { action: "index_build" }); }
async function search(p: any, query: string, limit = 5): Promise<any[]> { const t = await call(p, "manage_knowledge", { action: "index_search", query, limit }); try { return JSON.parse(t); } catch { return []; } }

async function main() {
  // ── T594: offline build (REQ-504) ────────────────────────────────────
  await test("T594/REQ-504: build indexes sources deterministically", async () => {
    const p = await boot(); await newNovel(p, "ix1");
    await lore(p, "dragon", "the red dragon guards the pass");
    const r = await build(p);
    assert(/Indexed \d+ item/.test(r), "build did not report items: " + r.slice(0, 100));
    const list = JSON.parse(await call(p, "manage_knowledge", { action: "index_list" }));
    const rec = list.find((i: any) => i.id === "lore:dragon");
    assert(rec && rec.type === "lore", "indexed lore not listed: " + JSON.stringify(list));
    await kill(p);
  });

  // ── T595: staleness + rebuild (REQ-505) ──────────────────────────────
  await test("T595/REQ-505: the index reports staleness when sources change", async () => {
    const p = await boot(); await newNovel(p, "ix2");
    await lore(p, "dragon", "the red dragon guards the pass");
    await build(p);
    assert((await call(p, "manage_knowledge", { action: "index_status" })).includes("current"), "fresh index reported stale");
    await lore(p, "tower", "a lonely tower on the moor");
    assert((await call(p, "manage_knowledge", { action: "index_status" })).includes("STALE"), "changed sources not flagged stale");
    await build(p);
    assert((await call(p, "manage_knowledge", { action: "index_status" })).includes("current"), "rebuild did not clear staleness");
    await kill(p);
  });

  // ── T596: advisory ranking (REQ-506) ─────────────────────────────────
  await test("T596/REQ-506: search ranks candidates deterministically", async () => {
    const p = await boot(); await newNovel(p, "ix3");
    await lore(p, "dragon", "the red dragon guards the northern pass with fire and claw");
    await lore(p, "weather", "rain falls on the valley in autumn");
    await build(p);
    const first = await search(p, "dragon");
    const second = await search(p, "dragon");
    assert(first[0]?.id === "lore:dragon", "expected dragon ranked first: " + JSON.stringify(first));
    assert(JSON.stringify(first) === JSON.stringify(second), "ranking is not deterministic");
    await kill(p);
  });

  // ── T597: relations (REQ-507) ────────────────────────────────────────
  await test("T597/REQ-507: near-identical items yield an advisory relation", async () => {
    const p = await boot(); await newNovel(p, "ix4");
    await lore(p, "dragon_a", "the red dragon guards the northern mountain pass");
    await lore(p, "dragon_b", "the red dragon guards the northern mountain pass");
    await build(p);
    const rels = JSON.parse(await call(p, "manage_knowledge", { action: "index_relations" }));
    assert(rels.some((r: any) => r.relation === "equivalent" || r.relation === "related"), "no relation derived: " + JSON.stringify(rels));
    await kill(p);
  });

  // ── T598: authority boundary (REQ-508) ───────────────────────────────
  await test("T598/REQ-508: search never mutates state", async () => {
    const p = await boot(); await newNovel(p, "ix5");
    await lore(p, "dragon", "the red dragon guards the pass");
    await build(p);
    const before = await call(p, "manage_lore", { action: "list" });
    await search(p, "dragon");
    const after = await call(p, "manage_lore", { action: "list" });
    assert(before === after, "search mutated authoritative state");
    await kill(p);
  });

  // ── T599: scope filtering (REQ-509) ──────────────────────────────────
  await test("T599/REQ-509: GM-scope items are hidden from Player search", async () => {
    const p = await boot(); await newNovel(p, "ix6");
    await lore(p, "gm_dragon", "the dragon is secretly a polymorphed king", "game_master");
    await lore(p, "pub_dragon", "the dragon guards the northern pass", "shared");
    await build(p);
    await call(p, "set_badge", { badge: "player" });
    const results = await search(p, "dragon polymorphed king");
    assert(!results.some((c: any) => c.id === "lore:gm_dragon"), "GM-scope item leaked to Player: " + JSON.stringify(results));
    await kill(p);
  });

  harnessComplete();
  console.log(`\n${passed} passed, ${failed} failed`);
  rmSync(DATA_DIR, { recursive: true, force: true });
  if (failed > 0) process.exit(1);
}
main().catch((e) => { console.error("FATAL", e); process.exit(2); });
