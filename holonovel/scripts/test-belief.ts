#!/usr/bin/env node
// Belief & Evidence harness — covers REQ-461 (acquisition record), REQ-462
// (provenance), REQ-463 (question identity), REQ-464 (admission states),
// REQ-465 (stance materialization), REQ-466 (independent corroboration),
// REQ-467 (contradiction preservation), REQ-468 (refresh), REQ-469 (family
// policies), REQ-470 (single-value predicates), REQ-471 (branch inheritance),
// and REQ-472 (badge gating).

import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { installHarnessGuard, harnessComplete } from "./lib/harness-guard.js";
installHarnessGuard();

const SERVER_SCRIPT = join(process.cwd(), "src", "index.ts");
const DATA_DIR = mkdtempSync(join(tmpdir(), "belief-"));
let msgId = 0; const pending = new Map(); let buffer = "";
function send(proc: any, msg: any): Promise<any> { return new Promise((r) => { const id = ++msgId; pending.set(id, r); proc.stdin!.write(JSON.stringify({ ...msg, id, jsonrpc: "2.0" }) + "\n"); }); }
function attach(proc: any) { buffer = ""; proc.stdout!.on("data", (d: Buffer) => { buffer += d.toString(); const ls = buffer.split("\n"); buffer = ls.pop() ?? ""; for (const l of ls) { if (!l.trim()) continue; try { const m = JSON.parse(l); if (m.id !== undefined && pending.has(m.id)) { pending.get(m.id)!(m); pending.delete(m.id); } } catch { /* non-JSON line */ } } }); }
async function boot() { const p = spawn("npx", ["tsx", SERVER_SCRIPT], { env: { ...process.env, TTRPG_DATA_DIR: DATA_DIR }, stdio: ["pipe", "pipe", "pipe"] }); attach(p); await send(p, { method: "initialize", params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "belief", version: "1" } } }); p.stdin!.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n"); await new Promise((r) => setTimeout(r, 250)); return p; }
async function call(proc: any, name: string, args: any = {}): Promise<string> { const r = await send(proc, { method: "tools/call", params: { name, arguments: args } }); const c = r.result?.content ?? []; return c.map((x: any) => x?.text ?? "").join("\n"); }
async function kill(proc: any) { try { proc.kill("SIGKILL"); } catch { /* already exited */ } await new Promise((r) => setTimeout(r, 100)); }

let passed = 0; let failed = 0;
async function test(name: string, fn: () => void | Promise<void>): Promise<void> {
  try { await fn(); passed++; console.log(`PASS ${name}`); } catch (e: any) { failed++; console.error(`FAIL ${name}: ${e.message ?? e}`); }
}
function assert(cond: any, msg: string) { if (!cond) throw new Error(msg); }
async function newNovel(p: any, name: string) { await call(p, "manage_novel", { action: "create", name }); await call(p, "set_badge", { badge: "game_master" }); }
async function admit(p: any, args: any) { return call(p, "manage_belief", { action: "admit", ...args }); }
async function listBeliefs(p: any, entity_id: string): Promise<any[]> { const t = await call(p, "manage_belief", { action: "list", entity_id }); try { return JSON.parse(t); } catch { return []; } }
function q(s: string, p1: string, o: string) { return `${s}|${p1}|${o}`.toLowerCase(); }

async function main() {
  // ── T551: acquisition record (REQ-461) ───────────────────────────────
  await test("T551/REQ-461: admit records proposition, polarity, weight, source", async () => {
    const p = await boot(); await newNovel(p, "bel1");
    await admit(p, { entity_id: "hero", subject: "the door", predicate: "is", object: "locked", polarity: "positive", weight: 0.9, source: "witness" });
    const ev = JSON.parse(await call(p, "manage_belief", { action: "evidence", entity_id: "hero" }));
    assert(ev.length === 1, "expected one evidence record");
    assert(ev[0].subject === "the door" && ev[0].object === "locked" && ev[0].polarity === "positive" && ev[0].weight === 0.9 && ev[0].source === "witness", "record fields wrong: " + JSON.stringify(ev[0]));
    await kill(p);
  });

  // ── T552: event provenance (REQ-462) ─────────────────────────────────
  await test("T552/REQ-462: evidence cites the contributing event ordinal", async () => {
    const p = await boot(); await newNovel(p, "bel2");
    await call(p, "manage_session", { action: "event", text: "I saw the ghost" });
    await admit(p, { entity_id: "hero", subject: "ghost", predicate: "exists", object: "true", polarity: "positive" });
    const ev = JSON.parse(await call(p, "manage_belief", { action: "evidence", entity_id: "hero" }));
    assert(JSON.stringify(ev[0].source_ordinals) === "[1]", "expected source_ordinals [1], got " + JSON.stringify(ev[0].source_ordinals));
    await kill(p);
  });

  // ── T553: polarity-independent question identity (REQ-463) ───────────
  await test("T553/REQ-463: opposite polarities contest one question", async () => {
    const p = await boot(); await newNovel(p, "bel3");
    await admit(p, { entity_id: "hero", subject: "the door", predicate: "is", object: "locked", polarity: "positive", weight: 0.7, source: "a" });
    await admit(p, { entity_id: "hero", subject: "the door", predicate: "is", object: "locked", polarity: "negative", weight: 0.7, source: "b" });
    await admit(p, { entity_id: "hero", subject: "the gate", predicate: "is", object: "locked", polarity: "positive", weight: 0.9, source: "a" });
    const beliefs = await listBeliefs(p, "hero");
    assert(beliefs.length === 2, "expected two questions, got " + beliefs.length);
    const door = beliefs.find((b: any) => b.question === q("the door", "is", "locked"));
    assert(door && door.support > 0 && door.opposition > 0, "door question should carry both sides: " + JSON.stringify(door));
    await kill(p);
  });

  // ── T554: admission states (REQ-464) ─────────────────────────────────
  await test("T554/REQ-464: suppressed evidence is retained but excluded", async () => {
    const p = await boot(); await newNovel(p, "bel4");
    await admit(p, { entity_id: "hero", subject: "trap", predicate: "is", object: "armed", polarity: "positive", weight: 1, status: "suppressed" });
    const beliefs = await listBeliefs(p, "hero");
    assert(beliefs.length === 0, "suppressed evidence must not create a stance");
    const ev = JSON.parse(await call(p, "manage_belief", { action: "evidence", entity_id: "hero" }));
    assert(ev.length === 1 && ev[0].status === "suppressed", "suppressed evidence not retained");
    await kill(p);
  });

  // ── T555: accept threshold + decision margin (REQ-465) ───────────────
  await test("T555/REQ-465: strong opposition yields unresolved", async () => {
    const p = await boot(); await newNovel(p, "bel5");
    await admit(p, { entity_id: "hero", subject: "king", predicate: "is", object: "alive", polarity: "positive", weight: 0.6, source: "a" });
    await admit(p, { entity_id: "hero", subject: "king", predicate: "is", object: "alive", polarity: "negative", weight: 0.6, source: "b" });
    const conflicts = JSON.parse(await call(p, "manage_belief", { action: "conflicts", entity_id: "hero" }));
    assert(conflicts.length === 1 && conflicts[0].stance === "unresolved", "expected unresolved stance: " + JSON.stringify(conflicts));
    await kill(p);
  });

  // ── T556: independent corroboration + determinism (REQ-466) ──────────
  await test("T556/REQ-466: correlated evidence does not compound; independent does", async () => {
    const p = await boot(); await newNovel(p, "bel6");
    // Correlated: same source key.
    await admit(p, { entity_id: "hero", subject: "relic", predicate: "is", object: "cursed", polarity: "positive", weight: 0.6, source: "witness" });
    await admit(p, { entity_id: "hero", subject: "relic", predicate: "is", object: "cursed", polarity: "positive", weight: 0.6, source: "witness" });
    let beliefs = await listBeliefs(p, "hero");
    assert(Math.abs(beliefs[0].support - 0.6) < 0.001, "correlated evidence compounded: " + beliefs[0].support);
    // Independent: distinct source keys.
    await admit(p, { entity_id: "hero", subject: "relic", predicate: "is", object: "blessed", polarity: "positive", weight: 0.6, source: "a" });
    await admit(p, { entity_id: "hero", subject: "relic", predicate: "is", object: "blessed", polarity: "positive", weight: 0.6, source: "b" });
    beliefs = await listBeliefs(p, "hero");
    const blessed = beliefs.find((b: any) => b.object === "blessed");
    assert(Math.abs(blessed.support - 0.84) < 0.001, "independent evidence did not compound: " + blessed.support);
    // Determinism.
    const before = JSON.stringify(await listBeliefs(p, "hero"));
    await call(p, "manage_belief", { action: "reconcile", entity_id: "hero" });
    const after = JSON.stringify(await listBeliefs(p, "hero"));
    assert(before === after, "reconcile is not deterministic");
    await kill(p);
  });

  // ── T557: contradiction preservation (REQ-467) ───────────────────────
  await test("T557/REQ-467: contradictory evidence remains retrievable", async () => {
    const p = await boot(); await newNovel(p, "bel7");
    await admit(p, { entity_id: "hero", subject: "bridge", predicate: "is", object: "safe", polarity: "positive", weight: 0.6, source: "a" });
    await admit(p, { entity_id: "hero", subject: "bridge", predicate: "is", object: "safe", polarity: "negative", weight: 0.6, source: "b" });
    const ev = JSON.parse(await call(p, "manage_belief", { action: "evidence", entity_id: "hero" }));
    assert(ev.length === 2, "both evidence records must remain: " + ev.length);
    await kill(p);
  });

  // ── T558: refresh on change (REQ-468) ────────────────────────────────
  await test("T558/REQ-468: a new opposing acquisition updates the stance", async () => {
    const p = await boot(); await newNovel(p, "bel8");
    await admit(p, { entity_id: "hero", subject: "ally", predicate: "is", object: "loyal", polarity: "positive", weight: 1, source: "a" });
    let b = (await listBeliefs(p, "hero"))[0];
    assert(b.stance === "positive" && b.accepted, "expected accepted positive: " + JSON.stringify(b));
    await admit(p, { entity_id: "hero", subject: "ally", predicate: "is", object: "loyal", polarity: "negative", weight: 1, source: "b" });
    b = (await listBeliefs(p, "hero"))[0];
    assert(b.stance === "unresolved" && !b.accepted, "expected unresolved after refresh: " + JSON.stringify(b));
    await kill(p);
  });

  // ── T559: family policies (REQ-469) ──────────────────────────────────
  await test("T559/REQ-469: durable accumulates, volatile takes the latest", async () => {
    const p = await boot(); await newNovel(p, "bel9");
    await admit(p, { entity_id: "hero", subject: "scholar", predicate: "knows", object: "the code", polarity: "positive", weight: 0.6, source: "a" });
    await admit(p, { entity_id: "hero", subject: "scholar", predicate: "knows", object: "the code", polarity: "positive", weight: 0.6, source: "b" });
    await admit(p, { entity_id: "hero", subject: "hero", predicate: "mood", object: "calm", polarity: "positive", weight: 0.6, source: "a" });
    await admit(p, { entity_id: "hero", subject: "hero", predicate: "mood", object: "calm", polarity: "negative", weight: 0.7, source: "b" });
    const beliefs = await listBeliefs(p, "hero");
    const knows = beliefs.find((b: any) => b.predicate === "knows");
    const mood = beliefs.find((b: any) => b.predicate === "mood");
    assert(knows.family === "durable" && Math.abs(knows.support - 0.84) < 0.001, "durable did not accumulate: " + JSON.stringify(knows));
    assert(mood.family === "volatile" && mood.stance === "negative", "volatile did not take latest: " + JSON.stringify(mood));
    await kill(p);
  });

  // ── T560: single-value predicates (REQ-470) ──────────────────────────
  await test("T560/REQ-470: single-value predicate keeps one current value", async () => {
    const p = await boot(); await newNovel(p, "bel10");
    await admit(p, { entity_id: "hero", subject: "hero", predicate: "location", object: "vault", polarity: "positive", weight: 0.9, source: "a" });
    await admit(p, { entity_id: "hero", subject: "hero", predicate: "location", object: "library", polarity: "positive", weight: 0.7, source: "b" });
    const beliefs = await listBeliefs(p, "hero");
    const vault = beliefs.find((b: any) => b.object === "vault");
    const library = beliefs.find((b: any) => b.object === "library");
    assert(vault.family === "single_value" && vault.current === true, "vault should be current: " + JSON.stringify(vault));
    assert(library.current === false, "library should not be current: " + JSON.stringify(library));
    await kill(p);
  });

  // ── T561: branch inheritance + sibling isolation (REQ-471) ───────────
  await test("T561/REQ-471: branch inherits beliefs, siblings stay isolated", async () => {
    const p = await boot(); await newNovel(p, "bel11");
    await admit(p, { entity_id: "hero", subject: "sky", predicate: "is", object: "blue", polarity: "positive", weight: 1, source: "a" });
    await call(p, "manage_novel", { action: "branch", source_slug: "bel11", new_name: "bel11-b" });
    const child = await listBeliefs(p, "hero");
    assert(child.length === 1, "child did not inherit the parent's belief");
    // Diverge the child.
    await call(p, "manage_novel", { action: "switch", slug: "bel11-b" });
    await admit(p, { entity_id: "hero", subject: "sky", predicate: "is", object: "blue", polarity: "negative", weight: 1, source: "b" });
    const childAfter = await listBeliefs(p, "hero");
    assert(childAfter[0].stance === "unresolved", "child did not diverge");
    const parent = await listBeliefs(p, "hero"); // active is still child; read parent via info? use switch
    await call(p, "manage_novel", { action: "switch", slug: "bel11" });
    const parentAfter = await listBeliefs(p, "hero");
    assert(parentAfter[0].stance === "positive", "parent was mutated by the child: " + JSON.stringify(parentAfter));
    await kill(p);
  });

  // ── T562: badge gating (REQ-472) ─────────────────────────────────────
  await test("T562/REQ-472: Player reads own entity only; Observer cannot mutate", async () => {
    const p = await boot(); await newNovel(p, "bel12");
    await admit(p, { entity_id: "hero", subject: "path", predicate: "is", object: "clear", polarity: "positive", weight: 1, source: "a" });
    await call(p, "set_badge", { badge: "player" });
    const forbidden = await call(p, "manage_belief", { action: "list", entity_id: "villain" });
    assert(forbidden.includes("[FORBIDDEN]"), "Player read of another entity should be forbidden: " + forbidden.slice(0, 120));
    await call(p, "set_badge", { badge: "observer" });
    const obs = await call(p, "manage_belief", { action: "admit", entity_id: "hero", subject: "x", predicate: "is", object: "y", polarity: "positive" });
    assert(obs.includes("[FORBIDDEN]") || obs.includes("[ERROR]"), "Observer mutation should fail: " + obs.slice(0, 120));
    await kill(p);
  });

  harnessComplete();
  console.log(`\n${passed} passed, ${failed} failed`);
  rmSync(DATA_DIR, { recursive: true, force: true });
  if (failed > 0) process.exit(1);
}
main().catch((e) => { console.error("FATAL", e); process.exit(2); });
