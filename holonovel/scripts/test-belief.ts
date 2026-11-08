#!/usr/bin/env node
// Belief & Evidence harness — covers REQ-461 (acquisition record), REQ-462 [gate]
// (provenance), REQ-463 (question identity), REQ-464 (admission states),
// REQ-465 (stance materialization), REQ-466 (independent corroboration),
// REQ-467 (contradiction preservation), REQ-468 (refresh), REQ-469 (family
// policies), REQ-470 (single-value predicates), REQ-471 (branch inheritance),
// and REQ-472 (badge gating). Subjective memory: REQ-623 (record), REQ-624
// (recording action), REQ-625 (read and gating), REQ-626 (deterministic
// briefing selection), REQ-627 (persistence and retention), and REQ-628
// (separation from recorded state). Disclosure and Player exposure: REQ-634
// (Player-badge briefing exposure) and REQ-635 (reclassification), with the
// draft-scan targets of REQ-599b. Divergence: REQ-629 (truth projection),
// REQ-630 (verdicts), REQ-631 (GM truth view), and REQ-632 (briefing marker).

import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { installHarnessGuard, harnessComplete } from "./lib/harness-guard.js";
import { normalizeSubjectiveRecord } from "../src/core/subjective.js";
installHarnessGuard();

const SERVER_SCRIPT = join(process.cwd(), "src", "index.ts");
const DATA_DIR = mkdtempSync(join(tmpdir(), "belief-"));
let msgId = 0; const pending = new Map(); let buffer = "";
function send(proc: any, msg: any): Promise<any> { return new Promise((r) => { const id = ++msgId; pending.set(id, r); proc.stdin!.write(JSON.stringify({ ...msg, id, jsonrpc: "2.0" }) + "\n"); }); }
function attach(proc: any) { buffer = ""; proc.stdout!.on("data", (d: Buffer) => { buffer += d.toString(); const ls = buffer.split("\n"); buffer = ls.pop() ?? ""; for (const l of ls) { if (!l.trim()) continue; try { const m = JSON.parse(l); if (m.id !== undefined && pending.has(m.id)) { pending.get(m.id)!(m); pending.delete(m.id); } } catch { /* non-JSON line */ } } }); }
async function boot() { const p = spawn("npx", ["tsx", SERVER_SCRIPT], { env: { ...process.env, TTRPG_DATA_DIR: DATA_DIR }, stdio: ["pipe", "pipe", "pipe"] }); attach(p); await send(p, { method: "initialize", params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "belief", version: "1" } } }); p.stdin!.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n"); await new Promise((r) => setTimeout(r, 250)); return p; }
async function call(proc: any, name: string, args: any = {}): Promise<string> { const r = await send(proc, { method: "tools/call", params: { name, arguments: args } }); if (r.error) throw new Error(`${name}: ${r.error.message ?? JSON.stringify(r.error)}`); const c = r.result?.content ?? []; return c.map((x: any) => x?.text ?? "").join("\n"); }
async function kill(proc: any) { try { proc.kill("SIGKILL"); } catch { /* already exited */ } await new Promise((r) => setTimeout(r, 100)); }
async function resource(proc: any, uri: string): Promise<string> {
  const r = await send(proc, { method: "resources/read", params: { uri } });
  if (r.error) throw new Error(`${uri}: ${r.error.message ?? JSON.stringify(r.error)}`);
  const c = r.result?.contents ?? [];
  return c.map((x: any) => x?.text ?? "").join("\n");
}

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
// REQ-631 — one row of the GM truth view, matched by its gist.
function verdictOf(json: string, gist: string): string {
  const rows = JSON.parse(json);
  const row = rows.find((r: any) => r.gist === gist);
  return row ? row.verdict : "(missing)";
}
// REQ-629 — NPC ids are generated, so the fact sources come from the id.
async function makeNpc(p: any, name: string, disposition: string): Promise<string> {
  const res = await call(p, "manage_npc", { action: "create", name, disposition });
  const id = res.match(/\((npc_[a-z0-9]+)\)/)?.[1];
  if (!id) throw new Error(`npc create did not return an id: ${res.slice(0, 160)}`);
  return id;
}
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
    const orphan = await memory(p, "Nobody", "an orphan memory");
    assert(orphan.includes("[INVALID_INPUT]"), "an unresolved entity was accepted: " + orphan.slice(0, 160));
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
    const byName = await memory(p, "Hero", "a name-resolved memory");
    assert(byName.includes("[OK]"), "name resolution failed: " + byName.slice(0, 160));
    const withName = JSON.parse(await call(p, "manage_belief", { action: "subjective_list", subjective_entity: id }));
    assert(withName.some((m: any) => m.gist === "a name-resolved memory" && m.entity_id === id), "name-resolved record not bound to the entity");
    await kill(p);
    const p2 = await boot();
    await call(p2, "manage_novel", { action: "resume", slug: "subj1" });
    await call(p2, "set_badge", { badge: "game_master" });
    const after = JSON.parse(await call(p2, "manage_belief", { action: "subjective_list", subjective_entity: id }));
    assert(after.some((m: any) => m.gist === "the bridge gave way"), "memory did not survive a restart");
    await kill(p2);
  });

  // ── T744: read scoping and badge gating (REQ-624, REQ-625) ────────────
  await test("T744/REQ-625: Player reads own visible memories; foreign and Observer refused", async () => {
    const p = await boot(); await newNovel(p, "subj2");
    const id = await present(p, "Hero");
    const other = await present(p, "Rival");
    await memory(p, id, "a remembered shout", { subjective_disclosure: "open" });
    await memory(p, id, "a hidden betrayal");
    const before = await call(p, "manage_context", { action: "history" });
    await call(p, "set_badge", { badge: "player" });
    await call(p, "manage_character", { action: "set_active", entity_id: id });
    const read = await call(p, "manage_belief", { action: "subjective_list" });
    assert(read.includes("a remembered shout"), "Player read dropped an open memory: " + read.slice(0, 200));
    assert(!read.includes("a hidden betrayal"), "Player read leaked a secret memory: " + read.slice(0, 200));
    const foreign = await call(p, "manage_belief", { action: "subjective_list", subjective_entity: other });
    assert(foreign.includes("[FORBIDDEN]"), "Player read of another entity was not refused: " + foreign.slice(0, 160));
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
  await test("T745/REQ-626: GM section is deterministic, ordered, capped, disclosure-tagged", async () => {
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
    assert(b1.includes("[authored, secret]"), "a non-open record was not tagged with its disclosure level: " + b1);
    const low = b1.indexOf("low-salience memory");
    const high = b1.indexOf("high-salience memory");
    const second = b1.indexOf("second high memory");
    assert(low > 0 && high > 0 && second > 0, "not all memories rendered: " + b1);
    assert(high < low && second < low, "salience ordering wrong: " + b1);
    assert(high < second, "equal-salience tie-break should order by ascending record id: " + b1);
    await call(p, "set_badge", { badge: "player" });
    const player = section(await prompt(p, "badge_briefing", { badge: "player" }), "## Subjective Memory");
    assert(player === "", "Player briefing rendered secret-only memories: " + player);
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

  // ── T746: branch drops memories of later events (REQ-458) ─────────────
  await test("T746/REQ-458: a branch drops memories of events after the branch point", async () => {
    const p = await boot(); await newNovel(p, "subj-branch");
    const id = await present(p, "Hero");
    await call(p, "manage_diagnostics", { action: "event", text: "one" });
    await call(p, "manage_diagnostics", { action: "event", text: "two" });
    await memory(p, id, "early memory", { subjective_event_ordinal: 1 });
    await memory(p, id, "late memory", { subjective_event_ordinal: 2 });
    const branched = await call(p, "manage_archive", { action: "branch", source_slug: "subj-branch", new_name: "subj-branch-copy", from_event: 1 });
    assert(branched.includes("[OK]"), "branch refused: " + branched.slice(0, 200));
    await call(p, "manage_novel", { action: "switch", slug: "subj-branch-copy" });
    const recs = JSON.parse(await call(p, "manage_belief", { action: "subjective_list", subjective_entity: id }));
    assert(recs.some((r: any) => r.gist === "early memory"), "the branch dropped a record at or before its point");
    assert(!recs.some((r: any) => r.gist === "late memory"), "the branch kept a record from a future event: " + JSON.stringify(recs.map((r: any) => r.gist)));
    await kill(p);
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

  // ── T748: recorded-state truth projection (REQ-629) ──────────────────
  await test("T748/REQ-629: projection is deterministic and tracks recorded state", async () => {
    const p = await boot(); await newNovel(p, "div1");
    const hero = await present(p, "Hero");
    const kael = await makeNpc(p, "Kael", "loyal");
    await call(p, "manage_relationship", { action: "set", entity_a: hero, entity_b: kael, type: "ally" });
    const infoBefore = await call(p, "manage_novel", { action: "info", slug: "div1" });
    const eventsBefore = infoBefore.match(/"event_count":\s*(\d+)/)?.[1];
    await memory(p, hero, "Kael is my ally", { subject: "Kael", predicate: "relationship", object: "Kael", subjective_polarity: "positive" });
    await memory(p, hero, "Kael stands with me", { subject: "Hero", predicate: "relationship", object: "Kael", subjective_polarity: "positive" });
    const first = await call(p, "manage_belief", { action: "subjective_verify", subjective_entity: hero });
    const second = await call(p, "manage_belief", { action: "subjective_verify", subjective_entity: hero });
    assert(first === second, "two projections of unchanged state differ");
    assert(verdictOf(first, "Kael stands with me") === "confirmed", "relationship fact not projected as confirmed: " + first.slice(0, 300));
    await call(p, "manage_relationship", { action: "set", entity_a: hero, entity_b: kael, type: "rival" });
    const changed = await call(p, "manage_belief", { action: "subjective_verify", subjective_entity: hero });
    assert(verdictOf(changed, "Kael stands with me") === "false_outcome", "a relationship change did not alter the projected facts: " + changed.slice(0, 300));
    const infoAfter = await call(p, "manage_novel", { action: "info", slug: "div1" });
    assert(infoAfter.match(/"event_count":\s*(\d+)/)?.[1] === eventsBefore, "projection appended an event");
    await kill(p);
  });

  // ── T749: divergence verdicts (REQ-630) ──────────────────────────────
  await test("T749/REQ-630: each verdict fires on its deliberately wrong memory", async () => {
    const p = await boot(); await newNovel(p, "div2");
    const hero = await present(p, "Hero");
    const kael = await makeNpc(p, "Kael", "loyal");
    await makeNpc(p, "Mira", "hostile");
    await call(p, "manage_relationship", { action: "set", entity_a: hero, entity_b: kael, type: "ally" });
    await call(p, "manage_diagnostics", { action: "event", text: "Kael gave the chapel to Hero" });
    await call(p, "manage_diagnostics", { action: "event", text: "Mira betrayed Hero" });
    const infoBefore = await call(p, "manage_novel", { action: "info", slug: "div2" });
    const eventsBefore = infoBefore.match(/"event_count":\s*(\d+)/)?.[1];

    await memory(p, hero, "confirmed-probe", { subject: "Kael", predicate: "disposition", object: "loyal", subjective_felt_then: "relieved" });
    await memory(p, hero, "false-outcome-probe", { subject: "Kael", predicate: "disposition", object: "loyal", subjective_polarity: "negative" });
    await memory(p, hero, "misattributed-probe", { subject: "Hero", predicate: "disposition", object: "loyal", subjective_polarity: "positive" });
    await memory(p, hero, "conflated-probe", { subject: "Mira", predicate: "outcome", object: "Kael", subjective_polarity: "negative" });
    await memory(p, hero, "displaced-probe", { subject: "Kael", predicate: "outcome", object: "Hero", subjective_polarity: "positive", subjective_event_ordinal: 2 });
    await memory(p, hero, "affect-drift-probe", { subject: "Kael", predicate: "disposition", object: "loyal", subjective_polarity: "positive", subjective_felt_then: "terrified" });
    await memory(p, hero, "unverifiable-probe", { subject: "the bridge", predicate: "collapsed under", object: "the wagon", subjective_polarity: "negative" });

    const out = await call(p, "manage_belief", { action: "subjective_verify", subjective_entity: hero });
    const expected: Array<[string, string]> = [
      ["confirmed-probe", "confirmed"],
      ["false-outcome-probe", "false_outcome"],
      ["misattributed-probe", "misattributed"],
      ["conflated-probe", "conflated"],
      ["displaced-probe", "displaced"],
      ["affect-drift-probe", "affect_drift"],
      ["unverifiable-probe", "unverifiable"],
    ];
    for (const [gist, verdict] of expected) {
      assert(verdictOf(out, gist) === verdict, `${gist} returned ${verdictOf(out, gist)} instead of ${verdict}: ` + out.slice(0, 400));
    }
    const again = await call(p, "manage_belief", { action: "subjective_verify", subjective_entity: hero });
    assert(out === again, "recomputation of unchanged state differs");
    const infoAfter = await call(p, "manage_novel", { action: "info", slug: "div2" });
    assert(infoAfter.match(/"event_count":\s*(\d+)/)?.[1] === eventsBefore, "the divergence check advanced the event log");
    await kill(p);
  });

  // ── T749: false outcome precedes displaced (REQ-630) ─────────────────
  await test("T749/REQ-630: an opposite fact at the cited event is a false outcome, not a displacement", async () => {
    const p = await boot(); await newNovel(p, "div-prec");
    const hero = await present(p, "Hero");
    await makeNpc(p, "Kael", "loyal");
    await call(p, "manage_diagnostics", { action: "event", text: "Kael rescued Hero" });
    await call(p, "manage_diagnostics", { action: "event", text: "Kael betrayed Hero" });
    await memory(p, hero, "kael-rescued-at-two", {
      subject: "Kael", predicate: "outcome", object: "Hero",
      subjective_polarity: "positive", subjective_event_ordinal: 2,
    });
    const out = await call(p, "manage_belief", { action: "subjective_verify", subjective_entity: hero });
    assert(verdictOf(out, "kael-rescued-at-two") === "false_outcome", "expected false_outcome, got " + verdictOf(out, "kael-rescued-at-two") + ": " + out.slice(0, 300));
    await kill(p);
  });

  // ── T750: GM truth view (REQ-631) ────────────────────────────────────
  await test("T750/REQ-631: truth view returns verdict, truth, and source; GM only", async () => {
    const p = await boot(); await newNovel(p, "div3");
    const hero = await present(p, "Hero");
    const kael = await makeNpc(p, "Kael", "loyal");
    await call(p, "manage_diagnostics", { action: "event", text: "Kael gave the chapel to Hero" });
    await memory(p, hero, "kael-loyal", { subject: "Kael", predicate: "disposition", object: "loyal", subjective_polarity: "positive" });
    await call(p, "manage_diagnostics", { action: "event", text: "The bell rang at dusk" });
    await memory(p, hero, "kael-hostile", { subject: "Kael", predicate: "disposition", object: "loyal", subjective_polarity: "negative" });
    const infoBefore = await call(p, "manage_novel", { action: "info", slug: "div3" });
    const eventsBefore = infoBefore.match(/"event_count":\s*(\d+)/)?.[1];
    const view = await call(p, "manage_belief", { action: "subjective_verify", subjective_entity: hero });
    const rows = JSON.parse(view);
    assert(Array.isArray(rows) && rows.length === 2, "truth view did not return both records: " + view.slice(0, 200));
    const row = rows[0];
    for (const field of ["record_id", "entity_id", "event_ordinal", "gist", "claim", "verdict", "reason", "truth"]) {
      assert(field in row, `truth view row missing '${field}': ` + JSON.stringify(row));
    }
    assert(row.truth && row.truth.polarity === "positive" && row.truth.source.startsWith("npc:"), "truth fact did not carry its recorded source: " + JSON.stringify(row.truth));
    const filtered = JSON.parse(await call(p, "manage_belief", { action: "subjective_verify", subjective_entity: hero, subjective_event_ordinal: 2 }));
    assert(filtered.length === 1 && filtered[0].gist === "kael-hostile", "event-ordinal filter did not narrow the view: " + JSON.stringify(filtered));
    const twice = await call(p, "manage_belief", { action: "subjective_verify", subjective_entity: hero });
    assert(twice === view, "two truth views of unchanged state differ");
    await call(p, "set_badge", { badge: "player" });
    const player = await call(p, "manage_belief", { action: "subjective_verify", subjective_entity: hero });
    assert(player.includes("[FORBIDDEN]"), "Player truth view was not refused: " + player.slice(0, 160));
    await call(p, "set_badge", { badge: "observer" });
    const observer = await call(p, "manage_belief", { action: "subjective_verify", subjective_entity: hero });
    assert(observer.includes("[FORBIDDEN]"), "Observer truth view was not refused: " + observer.slice(0, 160));
    await call(p, "set_badge", { badge: "game_master" });
    const infoAfter = await call(p, "manage_novel", { action: "info", slug: "div3" });
    assert(infoAfter.match(/"event_count":\s*(\d+)/)?.[1] === eventsBefore, "the truth view advanced the event log");
    await kill(p);
  });

  // ── T751: divergence marker in the briefing (REQ-632) ────────────────
  await test("T751/REQ-632: divergent records carry the marker; confirmed ones do not", async () => {
    const p = await boot(); await newNovel(p, "div4");
    const hero = await present(p, "Hero");
    const kael = await makeNpc(p, "Kael", "loyal");
    await call(p, "manage_relationship", { action: "set", entity_a: hero, entity_b: kael, type: "ally" });
    await memory(p, hero, "kael-is-loyal", { subject: "Kael", predicate: "disposition", object: "loyal", subjective_polarity: "positive", subjective_salience: 0.9 });
    await memory(p, hero, "kael-is-hostile", { subject: "Kael", predicate: "disposition", object: "loyal", subjective_polarity: "negative", subjective_salience: 0.8 });
    const b1 = section(await prompt(p, "badge_briefing", { badge: "game_master" }), "## Subjective Memory");
    const b2 = section(await prompt(p, "badge_briefing", { badge: "game_master" }), "## Subjective Memory");
    assert(b1.length > 0, "no Subjective Memory section in the GM briefing");
    assert(b1 === b2, "two renders of unchanged state differ");
    const confirmedLine = b1.split("\n").find((l) => l.includes("kael-is-loyal")) ?? "";
    const divergentLine = b1.split("\n").find((l) => l.includes("kael-is-hostile")) ?? "";
    assert(confirmedLine.length > 0 && divergentLine.length > 0, "both memories did not render: " + b1);
    assert(!confirmedLine.includes("[divergence"), "a confirmed memory rendered a divergence marker: " + confirmedLine);
    assert(divergentLine.includes("[divergence: false outcome]"), "a divergent memory did not name its verdict: " + divergentLine);
    assert(b1.indexOf("kael-is-loyal") < b1.indexOf("kael-is-hostile"), "marker changed the salience order: " + b1);
    await kill(p);
  });

  // ── T753: disclosure default and validation (REQ-623, REQ-624) ───────
  await test("T753/REQ-623,REQ-624: disclosure defaults to secret, validates, and survives reload", async () => {
    // REQ-623 — a stored record carrying no level loads as `secret`.
    assert(normalizeSubjectiveRecord({ id: "sm-1" }).disclosure === "secret", "a record with no level did not load as secret");
    assert(normalizeSubjectiveRecord({ id: "sm-2", disclosure: "bogus" }).disclosure === "secret", "an unknown stored level did not fall back to secret");
    assert(normalizeSubjectiveRecord({ id: "sm-3", disclosure: "open" }).disclosure === "open", "a stored open level was lost");
    const p = await boot(); await newNovel(p, "disc1");
    const id = await present(p, "Hero");
    await memory(p, id, "a quiet debt");
    const recs = JSON.parse(await call(p, "manage_belief", { action: "subjective_list", subjective_entity: id }));
    assert(recs.length === 1 && recs[0].disclosure === "secret", "the record-time default is not secret: " + JSON.stringify(recs[0]?.disclosure));
    const bad = await memory(p, id, "a bad level", { subjective_disclosure: "loud" });
    assert(bad.includes("[INVALID_INPUT]"), "an unknown disclosure was accepted: " + bad.slice(0, 160));
    const good = await memory(p, id, "a shared victory", { subjective_disclosure: "open" });
    assert(good.includes("[OK]"), "an explicit level was refused: " + good.slice(0, 160));
    await kill(p);
    const p2 = await boot();
    await call(p2, "manage_novel", { action: "resume", slug: "disc1" });
    await call(p2, "set_badge", { badge: "game_master" });
    const after = JSON.parse(await call(p2, "manage_belief", { action: "subjective_list", subjective_entity: id }));
    assert(after.some((r: any) => r.gist === "a quiet debt" && r.disclosure === "secret"), "the default level did not survive a reload");
    assert(after.some((r: any) => r.gist === "a shared victory" && r.disclosure === "open"), "an explicit level did not survive a reload");
    await kill(p2);
  });

  // ── T754: Player read scoping (REQ-625) ──────────────────────────────
  await test("T754/REQ-625: Player read is scoped to the active entity and the ordinal filter stays inside it", async () => {
    const p = await boot(); await newNovel(p, "disc2");
    await call(p, "set_badge", { badge: "player" });
    const noActive = await call(p, "manage_belief", { action: "subjective_list" });
    assert(noActive.includes("[STATE_CONFLICT]"), "no active entity did not raise a state conflict: " + noActive.slice(0, 160));
    await call(p, "set_badge", { badge: "game_master" });
    const id = await present(p, "Hero");
    const other = await present(p, "Rival");
    await call(p, "manage_diagnostics", { action: "event", text: "one" });
    await call(p, "manage_diagnostics", { action: "event", text: "two" });
    await memory(p, id, "an open recollection", { subjective_disclosure: "open", subjective_event_ordinal: 1 });
    await memory(p, id, "a guarded recollection", { subjective_disclosure: "guarded", subjective_event_ordinal: 2 });
    await memory(p, id, "a secret recollection");
    await memory(p, other, "a rival open memory", { subjective_disclosure: "open", subjective_event_ordinal: 1 });
    await call(p, "set_badge", { badge: "player" });
    await call(p, "manage_character", { action: "set_active", entity_id: id });
    const read = await call(p, "manage_belief", { action: "subjective_list" });
    assert(read.includes("an open recollection") && read.includes("a guarded recollection"), "Player read dropped a visible memory: " + read.slice(0, 240));
    assert(!read.includes("a secret recollection"), "Player read leaked a secret memory: " + read.slice(0, 240));
    assert(!read.includes("a rival open memory"), "Player read leaked a foreign entity's memory: " + read.slice(0, 240));
    const guarded = JSON.parse(read).find((r: any) => r.gist === "a guarded recollection");
    assert(guarded && guarded.claim.subject === "" && guarded.felt_then === "", "the guarded projection was not stripped: " + JSON.stringify(guarded));
    const byOrdinal = await call(p, "manage_belief", { action: "subjective_list", subjective_event_ordinal: 1 });
    const rows = JSON.parse(byOrdinal);
    assert(rows.length > 0 && rows.every((r: any) => r.entity_id === id && r.gist !== "a rival open memory"), "the ordinal filter escaped the active entity: " + byOrdinal.slice(0, 240));
    await kill(p);
  });

  // ── T755: Player briefing exposure (REQ-626, REQ-634) ────────────────
  await test("T755/REQ-626,REQ-634: Player briefing renders open in full, guarded as gist, secret absent", async () => {
    const p = await boot(); await newNovel(p, "disc3");
    const id = await present(p, "Hero");
    await call(p, "manage_character", { action: "set_active", entity_id: id });
    await memory(p, id, "the open bell", { subjective_disclosure: "open", subject: "the bell", predicate: "rang for", object: "the town", subjective_felt_then: "relief", subjective_origin: "witnessed" });
    await memory(p, id, "the guarded door", { subjective_disclosure: "guarded", subject: "the door", predicate: "hides", object: "a cellar", subjective_felt_then: "dread" });
    await memory(p, id, "the secret letter");
    const gm = section(await prompt(p, "badge_briefing", { badge: "game_master" }), "## Subjective Memory");
    assert(gm.includes("[witnessed]") && gm.includes(", secret]") && gm.includes(", guarded]"), "the GM section did not tag non-open records: " + gm);
    await call(p, "set_badge", { badge: "player" });
    const b1 = section(await prompt(p, "badge_briefing", { badge: "player" }), "## Subjective Memory");
    const b2 = section(await prompt(p, "badge_briefing", { badge: "player" }), "## Subjective Memory");
    assert(b1.length > 0 && b1 === b2, "the Player section is missing or unstable: " + b1);
    assert(b1.includes("the open bell") && b1.includes("(felt relief)"), "an open record did not render in full: " + b1);
    assert(b1.includes("rang for the town"), "an open record did not render its claim: " + b1);
    assert(b1.includes("the guarded door") && !b1.includes("the cellar") && !b1.includes("dread"), "a guarded record leaked its claim or affect: " + b1);
    assert(!b1.includes("the secret letter"), "the Player section leaked a secret memory: " + b1);
    await call(p, "set_badge", { badge: "observer" });
    const obs = section(await prompt(p, "badge_briefing", { badge: "observer" }), "## Subjective Memory");
    assert(obs === "", "the Observer briefing carried the section: " + obs);
    await kill(p);
  });

  // ── T756: reclassification (REQ-635) ─────────────────────────────────
  await test("T756/REQ-635: reclassification changes every Player surface and undo does not revert it", async () => {
    const p = await boot(); await newNovel(p, "disc4");
    const id = await present(p, "Hero");
    await call(p, "manage_character", { action: "set_active", entity_id: id });
    await memory(p, id, "the buried oath");
    const recs = JSON.parse(await call(p, "manage_belief", { action: "subjective_list", subjective_entity: id }));
    const rid = recs[0].id;
    const bad = await call(p, "manage_belief", { action: "subjective_disclose", subjective_record_id: rid, subjective_disclosure: "loud" });
    assert(bad.includes("[INVALID_INPUT]"), "an unknown level was accepted: " + bad.slice(0, 160));
    const missing = await call(p, "manage_belief", { action: "subjective_disclose", subjective_record_id: "sm-99", subjective_disclosure: "open" });
    assert(missing.includes("[NOT_FOUND]"), "an unknown record id was not refused: " + missing.slice(0, 160));
    const done = await call(p, "manage_belief", { action: "subjective_disclose", subjective_record_id: rid, subjective_disclosure: "open" });
    assert(done.includes("[OK]"), "a valid reclassification was refused: " + done.slice(0, 160));
    const after = JSON.parse(await call(p, "manage_belief", { action: "subjective_list", subjective_entity: id }));
    assert(after[0].disclosure === "open" && after[0].gist === "the buried oath" && after[0].id === rid, "reclassification changed more than the level: " + JSON.stringify(after[0]));
    const audit = await resource(p, "audit://novel");
    assert(audit.includes("subjective_disclose"), "the reclassification recorded no audit entry");
    await call(p, "set_badge", { badge: "player" });
    const read = await call(p, "manage_belief", { action: "subjective_list" });
    assert(read.includes("the buried oath"), "the Player read did not reflect the new level: " + read.slice(0, 200));
    await call(p, "set_badge", { badge: "game_master" });
    await call(p, "manage_history", { action: "undo" });
    const afterUndo = JSON.parse(await call(p, "manage_belief", { action: "subjective_list", subjective_entity: id }));
    assert(afterUndo[0].disclosure === "open", "undo reverted the reclassification: " + JSON.stringify(afterUndo[0]?.disclosure));
    await kill(p);
  });

  // ── T757: scan targets and player-scope export (REQ-599b, REQ-627) ───
  await test("T757/REQ-599b,REQ-627: secret memory text is redacted; player export filters levels", async () => {
    const p = await boot(); await newNovel(p, "disc5");
    const id = await present(p, "Hero");
    await call(p, "manage_character", { action: "set_active", entity_id: id });
    await memory(p, id, "the vault code is nine seven", { subjective_disclosure: "secret", subject: "the vault", predicate: "opens with", object: "nine seven" });
    await memory(p, id, "a sealed grief", { subjective_disclosure: "secret", subject: "the seal", predicate: "hides", object: "a name", subjective_felt_then: "a cold dread that will not lift" });
    await memory(p, id, "the market fair was loud", { subjective_disclosure: "open" });
    await memory(p, id, "the cellar door is barred", { subjective_disclosure: "guarded", subject: "the cellar", predicate: "is", object: "barred" });
    const leak = await call(p, "manage_diagnostics", { action: "visibility_check", audience: "player", text: "You recall the vault code is nine seven." });
    assert(leak.includes("[redacted]") && !leak.includes("nine seven"), "secret memory text was not redacted: " + leak.slice(0, 240));
    const owner = await call(p, "manage_diagnostics", { action: "visibility_check", audience: "player", text: "The cellar is barred, you remember." });
    assert(owner.includes("[redacted]"), "a guarded claim was not redacted for its owner: " + owner.slice(0, 240));
    const open = await call(p, "manage_diagnostics", { action: "visibility_check", audience: "player", text: "The market fair was loud." });
    assert(!open.includes("[redacted]"), "an open memory was redacted: " + open.slice(0, 240));
    const affectOnly = await call(p, "manage_diagnostics", { action: "visibility_check", audience: "player", text: "You feel a cold dread that will not lift." });
    assert(!affectOnly.includes("[redacted]"), "a secret affect was redacted although it is not a scan target: " + affectOnly.slice(0, 240));
    const exported = await call(p, "manage_archive", { action: "export", scope: "player", format: "json" });
    const data = JSON.parse(exported.slice(exported.indexOf("{")));
    const mems = data.novel.subjective_memory ?? [];
    assert(mems.length === 2, "the player export did not carry the two visible records: " + JSON.stringify(mems));
    assert(!JSON.stringify(mems).includes("nine seven"), "the player export leaked a secret memory");
    const guarded = mems.find((m: any) => m.gist === "the cellar door is barred");
    assert(guarded && guarded.claim.subject === "" && guarded.felt_then === "", "the player export did not strip the guarded claim: " + JSON.stringify(guarded));
    await kill(p);
  });

  harnessComplete();
  console.log(`\n${passed} passed, ${failed} failed`);
  rmSync(DATA_DIR, { recursive: true, force: true });
  if (failed > 0) process.exit(1);
}
main().catch((e) => { console.error("FATAL", e); process.exit(2); });
