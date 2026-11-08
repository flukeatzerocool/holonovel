#!/usr/bin/env node
// Belief & Evidence harness — covers REQ-461 (acquisition record), REQ-462 [gate]
// (provenance), REQ-463 (question identity), REQ-464 (admission states),
// REQ-465 (stance materialization), REQ-466 (independent corroboration),
// REQ-467 (contradiction preservation), REQ-468 (refresh), REQ-469 (family
// policies), REQ-470 (single-value predicates), REQ-471 (branch inheritance),
// and REQ-472 (badge gating). Subjective memory: REQ-623 (record), REQ-624
// (recording action), REQ-625 (read and gating), REQ-626 (deterministic
// briefing selection), REQ-627 (persistence and retention), and REQ-628
// (separation from recorded state).

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
async function call(proc: any, name: string, args: any = {}): Promise<string> { const r = await send(proc, { method: "tools/call", params: { name, arguments: args } }); if (r.error) throw new Error(`${name}: ${r.error.message ?? JSON.stringify(r.error)}`); const c = r.result?.content ?? []; return c.map((x: any) => x?.text ?? "").join("\n"); }
async function kill(proc: any) { try { proc.kill("SIGKILL"); } catch { /* already exited */ } await new Promise((r) => setTimeout(r, 100)); }

let passed = 0; let failed = 0;
async function test(name: string, fn: () => void | Promise<void>): Promise<void> {
  try { await fn(); passed++; console.log(`PASS ${name}`); } catch (e: any) { failed++; console.error(`FAIL ${name}: ${e.message ?? e}`); }
}
function assert(cond: any, msg: string) { if (!cond) throw new Error(msg); }
async function newNovel(p: any, name: string) { await call(p, "manage_novel", { action: "create", name }); await call(p, "set_badge", { badge: "game_master" }); }
async function admit(p: any, args: any) { return call(p, "manage_belief", { action: "admit", ...args }); }
async function prompt(proc: any, name: string, args: any = {}): Promise<string> {
  const r = await send(proc, { method: "prompts/get", params: { name, arguments: args } });
  if (r.error) throw new Error(`${name} prompt: ${r.error.message ?? JSON.stringify(r.error)}`);
  const msgs = r.result?.messages ?? [];
  return msgs.map((m: any) => m?.content?.text ?? "").join("\n");
}
// REQ-626 — extract one briefing section by heading, up to the next heading.
function section(text: string, heading: string): string {
  const i = text.indexOf(heading);
  if (i < 0) return "";
  const rest = text.slice(i + heading.length);
  const end = rest.search(/\n#{1,3} /);
  return heading + (end < 0 ? rest : rest.slice(0, end));
}
async function present(p: any, name: string): Promise<string> {
  const created = await call(p, "manage_character", { action: "create", name });
  const id = created.match(/Entity id ([a-z0-9_]+)/i)?.[1];
  if (!id) throw new Error(`create did not return an entity id: ${created.slice(0, 160)}`);
  await call(p, "manage_staging", { action: "presence", entity_ids: [id] });
  return id;
}
async function memory(p: any, entity: string, gist: string, extra: any = {}) {
  const { subject, predicate, object, ...rest } = extra;
  return call(p, "manage_belief", {
    action: "subjective_record",
    subjective_entity: entity,
    subjective_gist: gist,
    subjective_subject: subject ?? "the bridge",
    subjective_predicate: predicate ?? "collapsed under",
    subjective_object: object ?? "the wagon",
    ...rest,
  });
}
async function listBeliefs(p: any, entity_id: string): Promise<any[]> { const t = await call(p, "manage_belief", { action: "list", entity_id, detail: true }); if (/^\[OK\] No /.test(t.trim())) return []; try { return JSON.parse(t); } catch { throw new Error(`beliefs were not JSON: ${t.slice(0, 200)}`); } }
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
    await call(p, "manage_diagnostics", { action: "event", text: "I saw the ghost" });
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
    await call(p, "manage_archive", { action: "branch", source_slug: "bel11", new_name: "bel11-b" });
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

  // ── T629: reconciliation enablement (REQ-465, REQ-468) ───────────────
  await test("T629/REQ-465: disabling reconciliation retains evidence without a stance", async () => {
    process.env.TTRPG_BELIEF_RECONCILIATION = "false";
    const p = await boot(); await newNovel(p, "bel13");
    await admit(p, { entity_id: "hero", subject: "the door", predicate: "is", object: "locked", polarity: "positive", weight: 0.9, source: "witness" });
    const ev = JSON.parse(await call(p, "manage_belief", { action: "evidence", entity_id: "hero" }));
    const offBeliefs = await listBeliefs(p, "hero");
    await kill(p);
    delete process.env.TTRPG_BELIEF_RECONCILIATION;
    assert(ev.length === 1, "evidence was not retained while reconciliation was disabled");
    assert(offBeliefs.length === 0, "a stance was materialized while reconciliation was disabled: " + JSON.stringify(offBeliefs));
    const p2 = await boot(); await newNovel(p2, "bel14");
    await admit(p2, { entity_id: "hero", subject: "the door", predicate: "is", object: "locked", polarity: "positive", weight: 0.9, source: "witness" });
    const onBeliefs = await listBeliefs(p2, "hero");
    await kill(p2);
    assert(onBeliefs.length === 1 && onBeliefs[0].accepted === true, "stance not materialized when reconciliation enabled: " + JSON.stringify(onBeliefs));
  });

  // ── T743: subjective memory record (REQ-623, REQ-624) ────────────────
  await test("T743/REQ-623: record carries entity, ordinal, claim, affect, salience, origin", async () => {
    const p = await boot(); await newNovel(p, "subj1");
    const id = await present(p, "Hero");
    await call(p, "manage_diagnostics", { action: "event", text: "The bridge collapses under the wagon." });
    const res = await memory(p, id, "the bridge gave way", {
      subject: "the bridge",
      predicate: "collapsed under",
      object: "the wagon",
      subjective_polarity: "negative",
      subjective_felt_then: "terror",
      subjective_salience: 0.9,
      subjective_origin: "witnessed",
    });
    assert(res.includes("[OK]"), "record refused: " + res.slice(0, 200));
    const recs = JSON.parse(await call(p, "manage_belief", { action: "subjective_list", subjective_entity: id }));
    assert(recs.length === 1, "expected one memory, got " + recs.length);
    const r = recs[0];
    assert(r.entity_id === id && r.gist === "the bridge gave way" && r.felt_then === "terror" && r.salience === 0.9 && r.origin === "witnessed", "fields wrong: " + JSON.stringify(r));
    assert(r.claim.subject === "the bridge" && r.claim.predicate === "collapsed under" && r.claim.object === "the wagon" && r.claim.polarity === "negative", "claim wrong: " + JSON.stringify(r.claim));
    assert(typeof r.event_ordinal === "number" && r.event_ordinal >= 1, "ordinal not bound: " + JSON.stringify(r.event_ordinal));
    await kill(p);
    const p2 = await boot();
    await call(p2, "manage_novel", { action: "resume", slug: "subj1" });
    await call(p2, "set_badge", { badge: "game_master" });
    const after = JSON.parse(await call(p2, "manage_belief", { action: "subjective_list", subjective_entity: id }));
    assert(after.length === 1 && after[0].gist === "the bridge gave way", "memory did not survive a restart");
    await kill(p2);
  });

  // ── T744: badge gating (REQ-624, REQ-625) ────────────────────────────
  await test("T744/REQ-625: subjective memory is Game Master only", async () => {
    const p = await boot(); await newNovel(p, "subj2");
    const id = await present(p, "Hero");
    await memory(p, id, "a remembered shout");
    const before = await call(p, "manage_context", { action: "history" });
    await call(p, "set_badge", { badge: "player" });
    const read = await call(p, "manage_belief", { action: "subjective_list", subjective_entity: id });
    assert(read.includes("[FORBIDDEN]"), "Player read was not refused: " + read.slice(0, 160));
    const write = await memory(p, id, "a Player write");
    assert(write.includes("[FORBIDDEN]"), "Player write was not refused: " + write.slice(0, 160));
    await call(p, "set_badge", { badge: "observer" });
    const obs = await call(p, "manage_belief", { action: "subjective_list" });
    assert(obs.includes("[FORBIDDEN]"), "Observer read was not refused: " + obs.slice(0, 160));
    const after = await call(p, "manage_context", { action: "history" });
    assert(before === after, "a refused read advanced the event log");
    await kill(p);
  });

  // ── T745: deterministic capped GM section (REQ-626) ──────────────────
  await test("T745/REQ-626: GM section is deterministic, ordered, capped, GM-only", async () => {
    const p = await boot(); await newNovel(p, "subj3");
    const id = await present(p, "Hero");
    await call(p, "manage_diagnostics", { action: "event", text: "one" });
    await memory(p, id, "low-salience memory", { subjective_salience: 0.2 });
    await call(p, "manage_diagnostics", { action: "event", text: "two" });
    await memory(p, id, "high-salience memory", { subjective_salience: 0.95, subjective_event_ordinal: 2 });
    await memory(p, id, "second high memory", { subjective_salience: 0.95, subjective_event_ordinal: 2 });
    const b1 = section(await prompt(p, "badge_briefing", { badge: "game_master" }), "## Subjective Memory");
    const b2 = section(await prompt(p, "badge_briefing", { badge: "game_master" }), "## Subjective Memory");
    assert(b1.length > 0, "GM briefing has no Subjective Memory section");
    assert(b1 === b2, "two renders of unchanged state differ");
    const low = b1.indexOf("low-salience memory");
    const high = b1.indexOf("high-salience memory");
    const second = b1.indexOf("second high memory");
    assert(low > 0 && high > 0 && second > 0, "not all memories rendered: " + b1);
    assert(high < low && second < low, "salience ordering wrong: " + b1);
    assert(high < second, "equal-salience tie-break should order by ascending record id: " + b1);
    await call(p, "set_badge", { badge: "player" });
    const player = section(await prompt(p, "badge_briefing", { badge: "player" }), "## Subjective Memory");
    assert(player === "", "Player briefing leaked the subjective-memory section");
    await kill(p);
    // Cap: one record at most.
    process.env.TTRPG_SUBJECTIVE_MEMORY_BRIEFING_MAX = "1";
    const p2 = await boot();
    await call(p2, "manage_novel", { action: "resume", slug: "subj3" });
    await call(p2, "set_badge", { badge: "game_master" });
    const capped = section(await prompt(p2, "badge_briefing", { badge: "game_master" }), "## Subjective Memory");
    await kill(p2);
    delete process.env.TTRPG_SUBJECTIVE_MEMORY_BRIEFING_MAX;
    assert((capped.match(/^- \[/gm) ?? []).length === 1, "briefing cap not honored: " + capped);
  });

  // ── T746: persistence, cap eviction, checkpoint, count (REQ-627) ─────
  await test("T746/REQ-627: storage cap evicts oldest; checkpoint keeps later records; count reported", async () => {
    process.env.TTRPG_SUBJECTIVE_MEMORY_MAX_ENTRIES = "1";
    const p = await boot(); await newNovel(p, "subj4");
    const id = await present(p, "Hero");
    await memory(p, id, "older memory");
    await memory(p, id, "newer memory");
    const recs = JSON.parse(await call(p, "manage_belief", { action: "subjective_list", subjective_entity: id }));
    assert(recs.length === 1 && recs[0].gist === "newer memory", "cap did not evict oldest-first: " + JSON.stringify(recs));
    const health = await call(p, "manage_diagnostics", { action: "health" });
    assert(health.includes('"subjective_memory_count": 1'), "spec_health did not report the count: " + health.slice(0, 300));
    await kill(p);
    delete process.env.TTRPG_SUBJECTIVE_MEMORY_MAX_ENTRIES;
    const p2 = await boot();
    await call(p2, "manage_novel", { action: "resume", slug: "subj4" });
    await call(p2, "set_badge", { badge: "game_master" });
    await call(p2, "manage_archive", { action: "checkpoint_set", label: "cp" });
    await memory(p2, id, "after the checkpoint");
    const restore = await call(p2, "manage_archive", { action: "checkpoint_restore", label: "cp" });
    assert(restore.includes("[NEED_INPUT]"), "restore did not ask for confirmation: " + restore.slice(0, 160));
    await call(p2, "respond_decision", { decision: "restore_checkpoint:cp", option: "yes" });
    const after = JSON.parse(await call(p2, "manage_belief", { action: "subjective_list", subjective_entity: id }));
    assert(after.some((r: any) => r.gist === "after the checkpoint"), "checkpoint restore dropped a post-checkpoint record");
    await kill(p2);
  });

  // ── T747: separation from recorded state (REQ-628) ───────────────────
  await test("T747/REQ-628: recording a memory leaves belief, evidence, perception, and the event log alone", async () => {
    const p = await boot(); await newNovel(p, "subj5");
    const id = await present(p, "Hero");
    await call(p, "manage_diagnostics", { action: "event", text: "the door is locked" });
    await admit(p, { entity_id: id, subject: "the door", predicate: "is", object: "locked", polarity: "positive", weight: 0.9, source: "witness" });
    await call(p, "manage_belief", { action: "perception_record", perception_entity_id: id, perception_summary: "saw the door" });
    const beliefsBefore = await call(p, "manage_belief", { action: "list", entity_id: id, detail: true });
    const evidenceBefore = await call(p, "manage_belief", { action: "evidence", entity_id: id });
    const perceptionBefore = await call(p, "manage_belief", { action: "perception_list" });
    const infoBefore = await call(p, "manage_novel", { action: "info", slug: "subj5" });
    const eventsBefore = infoBefore.match(/"event_count":\s*(\d+)/)?.[1];
    assert(eventsBefore !== undefined, "info did not report an event count: " + infoBefore.slice(0, 200));
    await memory(p, id, "the door was open");
    assert((await call(p, "manage_belief", { action: "list", entity_id: id, detail: true })) === beliefsBefore, "memory altered belief state");
    assert((await call(p, "manage_belief", { action: "evidence", entity_id: id })) === evidenceBefore, "memory altered evidence");
    assert((await call(p, "manage_belief", { action: "perception_list" })) === perceptionBefore, "memory altered the perception ledger");
    const infoAfter = await call(p, "manage_novel", { action: "info", slug: "subj5" });
    assert(infoAfter.match(/"event_count":\s*(\d+)/)?.[1] === eventsBefore, "memory advanced the event log: " + infoAfter.slice(0, 200));
    await call(p, "manage_belief", { action: "reconcile", entity_id: id });
    const mems = JSON.parse(await call(p, "manage_belief", { action: "subjective_list", subjective_entity: id }));
    assert(mems.length === 1 && mems[0].gist === "the door was open", "reconcile rewrote the memory: " + JSON.stringify(mems));
    await kill(p);
  });

  harnessComplete();
  console.log(`\n${passed} passed, ${failed} failed`);
  rmSync(DATA_DIR, { recursive: true, force: true });
  if (failed > 0) process.exit(1);
}
main().catch((e) => { console.error("FATAL", e); process.exit(2); });
