#!/usr/bin/env node
// Character Identity harness — covers REQ-473 (candidate staging), REQ-474 [gate]
// (stability classes), REQ-475 (perspective), REQ-476 (compiled kernel),
// REQ-477 (write-authority isolation), REQ-478 (revision audit), REQ-479
// (card-bootstrap exclusions), REQ-480 (kernel exposure), REQ-481 (visibility
// gating), REQ-482 (developmental proposal-only), REQ-483 (source provenance),
// REQ-547 (candidate retention bound), and the psyche-depth facets REQ-636–643.

import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { installHarnessGuard, harnessComplete } from "./lib/harness-guard.js";
import { resourceReader, promptReader } from "./lib/jsonrpc.js";
import { normalizeFacetAttributes } from "../src/core/identity.js";
installHarnessGuard();

const SERVER_SCRIPT = join(process.cwd(), "src", "index.ts");
const DATA_DIR = mkdtempSync(join(tmpdir(), "identity-"));
let msgId = 0; const pending = new Map(); let buffer = "";
function send(proc: any, msg: any): Promise<any> { return new Promise((r) => { const id = ++msgId; pending.set(id, r); proc.stdin!.write(JSON.stringify({ ...msg, id, jsonrpc: "2.0" }) + "\n"); }); }
function attach(proc: any) { buffer = ""; proc.stdout!.on("data", (d: Buffer) => { buffer += d.toString(); const ls = buffer.split("\n"); buffer = ls.pop() ?? ""; for (const l of ls) { if (!l.trim()) continue; try { const m = JSON.parse(l); if (m.id !== undefined && pending.has(m.id)) { pending.get(m.id)!(m); pending.delete(m.id); } } catch { /* non-JSON line */ } } }); }
async function boot() { const p = spawn("npx", ["tsx", SERVER_SCRIPT], { env: { ...process.env, TTRPG_DATA_DIR: DATA_DIR }, stdio: ["pipe", "pipe", "pipe"] }); attach(p); await send(p, { method: "initialize", params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "identity", version: "1" } } }); p.stdin!.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n"); await new Promise((r) => setTimeout(r, 250)); return p; }
async function call(proc: any, name: string, args: any = {}): Promise<string> { const r = await send(proc, { method: "tools/call", params: { name, arguments: args } }); if (r.error) throw new Error(`${name}: ${r.error.message ?? JSON.stringify(r.error)}`); const c = r.result?.content ?? []; return c.map((x: any) => x?.text ?? "").join("\n"); }
const readRes = resourceReader(send, { throwOnError: false });
async function kill(proc: any) { try { proc.kill("SIGKILL"); } catch { /* already exited */ } await new Promise((r) => setTimeout(r, 100)); }

let passed = 0; let failed = 0;
async function test(name: string, fn: () => void | Promise<void>): Promise<void> {
  try { await fn(); passed++; console.log(`PASS ${name}`); } catch (e: any) { failed++; console.error(`FAIL ${name}: ${e.message ?? e}`); }
}
function assert(cond: any, msg: string) { if (!cond) throw new Error(msg); }
async function makeCharacter(p: any, name: string): Promise<string> {
  const r = await call(p, "manage_character", { action: "create", name, stage_to_roster: true });
  const m = r.match(/roster as (\S+?)\./) || r.match(/Entity id (\S+?)\./);
  if (!m) throw new Error("could not determine character id from: " + r.slice(0, 200));
  return m[1];
}
async function stage(p: any, character_id: string, facet: string, value: string, extra: any = {}): Promise<string> {
  const r = await call(p, "manage_identity", { action: "stage", character_id, facet, value, ...extra });
  const m = r.match(/candidate (idc-\d+)/);
  if (!m) throw new Error("stage failed: " + r.slice(0, 200));
  return m[1];
}
async function listIdentity(p: any, character_id: string): Promise<any> { return JSON.parse(await call(p, "manage_identity", { action: "list", character_id })); }
async function snapshotIdentity(p: any, character_id: string): Promise<any> { return JSON.parse(await call(p, "manage_identity", { action: "snapshot", character_id })); }
const briefing = (p: any) => promptReader(send)(p, "badge_briefing");
function kernelFacets(kernel: any): any[] { return [...kernel.structural, ...kernel.constitutional, ...kernel.core, ...kernel.developmental]; }

async function main() {
  // ── T563: candidate staging (REQ-473) ────────────────────────────────
  await test("T563/REQ-473: staging a candidate does not change durable identity", async () => {
    const p = await boot(); await call(p, "manage_novel", { action: "create", name: "id1" }); await call(p, "set_badge", { badge: "game_master" });
    const cid = await makeCharacter(p, "Alice");
    await stage(p, cid, "calling", "Wandering blade");
    const id = await listIdentity(p, cid);
    assert(id.candidates.length === 1 && id.candidates[0].status === "pending", "candidate not pending: " + JSON.stringify(id.candidates));
    assert(id.facets.length === 0 && id.version === 0, "durable identity changed on stage");
    await kill(p);
  });

  // ── T564: stability classes (REQ-474) ────────────────────────────────
  await test("T564/REQ-474: facets carry their stability class; accept bumps the version", async () => {
    const p = await boot(); await call(p, "manage_novel", { action: "create", name: "id2" }); await call(p, "set_badge", { badge: "game_master" });
    const cid = await makeCharacter(p, "Alice");
    const c1 = await stage(p, cid, "calling", "Wandering blade", { stability: "core" });
    await call(p, "manage_identity", { action: "accept", character_id: cid, candidate_id: c1 });
    const id = await listIdentity(p, cid);
    assert(id.facets[0].stability === "core", "stability not recorded");
    assert(id.version === 1, "version not bumped on accept: " + id.version);
    await kill(p);
  });

  // ── T565: perspective (REQ-475) ──────────────────────────────────────
  await test("T565/REQ-475: perspective is retained and secrets stay out of the kernel", async () => {
    const p = await boot(); await call(p, "manage_novel", { action: "create", name: "id3" }); await call(p, "set_badge", { badge: "game_master" });
    const cid = await makeCharacter(p, "Alice");
    const c1 = await stage(p, cid, "origin", "born in the north", { perspective: "biographical" });
    await call(p, "manage_identity", { action: "accept", character_id: cid, candidate_id: c1 });
    const c2 = await stage(p, cid, "true_name", "the Hollow King", { perspective: "secret" });
    await call(p, "manage_identity", { action: "accept", character_id: cid, candidate_id: c2 });
    const kernel = JSON.parse(await call(p, "manage_identity", { action: "snapshot", character_id: cid }));
    const all = [...kernel.structural, ...kernel.constitutional, ...kernel.core, ...kernel.developmental];
    const origin = all.find((f: any) => f.facet === "origin");
    assert(origin && origin.perspective === "biographical", "biographical perspective not retained: " + JSON.stringify(origin));
    assert(!all.some((f: any) => f.facet === "true_name"), "secret facet leaked into the kernel");
    await kill(p);
  });

  // ── T566: compiled kernel + version (REQ-476) ────────────────────────
  await test("T566/REQ-476: kernel is version-keyed and changes only on a new version", async () => {
    const p = await boot(); await call(p, "manage_novel", { action: "create", name: "id4" }); await call(p, "set_badge", { badge: "game_master" });
    const cid = await makeCharacter(p, "Alice");
    const k1 = JSON.parse(await call(p, "manage_identity", { action: "snapshot", character_id: cid }));
    const k2 = JSON.parse(await call(p, "manage_identity", { action: "snapshot", character_id: cid }));
    assert(k1.identity_version === k2.identity_version, "kernel version changed without an accept");
    const c1 = await stage(p, cid, "name", "Alice the Bold", { stability: "structural" });
    await call(p, "manage_identity", { action: "accept", character_id: cid, candidate_id: c1 });
    const k3 = JSON.parse(await call(p, "manage_identity", { action: "snapshot", character_id: cid }));
    assert(k3.identity_version === k1.identity_version + 1, "kernel version did not advance");
    assert(k3.structural.some((f: any) => f.facet === "name"), "accepted structural facet absent from kernel");
    await kill(p);
  });

  // ── T567: write-authority isolation (REQ-477) ────────────────────────
  await test("T567/REQ-477: play does not rewrite identity", async () => {
    const p = await boot(); await call(p, "manage_novel", { action: "create", name: "id5" }); await call(p, "set_badge", { badge: "game_master" });
    const cid = await makeCharacter(p, "Alice");
    const c1 = await stage(p, cid, "calling", "Wandering blade"); await call(p, "manage_identity", { action: "accept", character_id: cid, candidate_id: c1 });
    const before = (await listIdentity(p, cid)).version;
    await call(p, "manage_diagnostics", { action: "event", text: "the blade sings" });
    await call(p, "manage_belief", { action: "admit", entity_id: cid, subject: "hero", predicate: "is", object: "brave", polarity: "positive" });
    await call(p, "manage_scene", { action: "set", description: "a windswept pass" });
    const after = (await listIdentity(p, cid)).version;
    assert(after === before, `play changed identity version ${before} -> ${after}`);
    await kill(p);
  });

  // ── T568: revision audit (REQ-478) ───────────────────────────────────
  await test("T568/REQ-478: re-accepting a facet advances its revision", async () => {
    const p = await boot(); await call(p, "manage_novel", { action: "create", name: "id6" }); await call(p, "set_badge", { badge: "game_master" });
    const cid = await makeCharacter(p, "Alice");
    const c1 = await stage(p, cid, "calling", "Wandering blade"); await call(p, "manage_identity", { action: "accept", character_id: cid, candidate_id: c1 });
    const c2 = await stage(p, cid, "calling", "Sworn shield"); await call(p, "manage_identity", { action: "accept", character_id: cid, candidate_id: c2 });
    const id = await listIdentity(p, cid);
    const calling = id.facets.find((f: any) => f.facet === "calling");
    assert(calling.value === "Sworn shield" && calling.revision === 2, "revision not advanced: " + JSON.stringify(calling));
    await kill(p);
  });

  // ── T568b: compensating revert (REQ-478) ─────────────────────────────
  await test("T568b/REQ-478: revert restores the displaced facet and keeps history internal", async () => {
    const p = await boot(); await call(p, "manage_novel", { action: "create", name: "id6b" }); await call(p, "set_badge", { badge: "game_master" });
    const cid = await makeCharacter(p, "Alice");
    const c1 = await stage(p, cid, "calling", "Wandering blade"); await call(p, "manage_identity", { action: "accept", character_id: cid, candidate_id: c1 });
    const c2 = await stage(p, cid, "calling", "Sworn shield"); await call(p, "manage_identity", { action: "accept", character_id: cid, candidate_id: c2 });
    const reverted = await call(p, "manage_identity", { action: "revert", character_id: cid });
    assert(/revision 3/.test(reverted), "revert did not report revision 3: " + reverted.slice(0, 200));
    const id = await listIdentity(p, cid);
    const calling = id.facets.find((f: any) => f.facet === "calling");
    assert(calling.value === "Wandering blade" && calling.revision === 3, "revert did not restore the prior value: " + JSON.stringify(calling));
    assert(id.version === 3, "revert did not advance the version: " + id.version);
    assert(id.history === undefined, "list exposed the internal history");
    await kill(p);
  });

  await test("T568b/REQ-478: revert with no displaced facet refuses", async () => {
    const p = await boot(); await call(p, "manage_novel", { action: "create", name: "id6c" }); await call(p, "set_badge", { badge: "game_master" });
    const cid = await makeCharacter(p, "Alice");
    const refused = await call(p, "manage_identity", { action: "revert", character_id: cid });
    assert(/STATE_CONFLICT/.test(refused), "empty-history revert was not refused: " + refused.slice(0, 200));
    await kill(p);
  });

  // ── T569: card-bootstrap exclusions (REQ-479) ────────────────────────
  await test("T569/REQ-479: bootstrap excludes scenario and first message", async () => {
    const p = await boot(); await call(p, "manage_novel", { action: "create", name: "id7" }); await call(p, "set_badge", { badge: "game_master" });
    const cid = await makeCharacter(p, "Alice");
    await call(p, "manage_identity", { action: "bootstrap", character_id: cid, card: { name: "Alice", description: "a wanderer", scenario: "you meet at a tavern", first_mes: "Hello there." } });
    const id = await listIdentity(p, cid);
    const facets = id.candidates.map((c: any) => c.facet);
    assert(facets.includes("name") && facets.includes("description"), "expected card identity fields staged: " + JSON.stringify(facets));
    assert(!facets.includes("scenario") && !facets.includes("first_mes"), "scenario/first_mes were staged: " + JSON.stringify(facets));
    await kill(p);
  });

  // ── T570: kernel exposure (REQ-480) ──────────────────────────────────
  await test("T570/REQ-480: the compiled kernel is served to sheet/briefing surfaces", async () => {
    const p = await boot(); await call(p, "manage_novel", { action: "create", name: "id8" }); await call(p, "set_badge", { badge: "game_master" });
    const cid = await makeCharacter(p, "Alice");
    await call(p, "manage_identity", { action: "bootstrap", character_id: cid, card: { name: "Alice", description: "a wanderer" } });
    const viaResource = JSON.parse(await readRes(p, `identity://${cid}`));
    assert(viaResource.character_id === cid, "identity resource missing character id");
    assert(Array.isArray(viaResource.structural) && Array.isArray(viaResource.core), "identity resource missing kernel groups");
    await kill(p);
  });

  // ── T571: visibility gating (REQ-481) ────────────────────────────────
  await test("T571/REQ-481: Player reads own identity only; Observer cannot mutate", async () => {
    const p = await boot(); await call(p, "manage_novel", { action: "create", name: "id9" }); await call(p, "set_badge", { badge: "game_master" });
    const alice = await makeCharacter(p, "Alice");
    const bob = await makeCharacter(p, "Bob");
    await call(p, "set_badge", { badge: "player" });
    const other = await call(p, "manage_identity", { action: "list", character_id: bob });
    assert(other.includes("[FORBIDDEN]"), "Player read of another character should be forbidden: " + other.slice(0, 100));
    await call(p, "set_badge", { badge: "observer" });
    const obs = await call(p, "manage_identity", { action: "stage", character_id: alice, facet: "x", value: "y" });
    assert(obs.includes("[FORBIDDEN]") || obs.includes("[ERROR]"), "Observer mutation should fail: " + obs.slice(0, 100));
    await kill(p);
  });

  // ── T572: developmental proposal-only (REQ-482) ──────────────────────
  await test("T572/REQ-482: developmental candidates stay pending", async () => {
    const p = await boot(); await call(p, "manage_novel", { action: "create", name: "id10" }); await call(p, "set_badge", { badge: "game_master" });
    const cid = await makeCharacter(p, "Alice");
    await stage(p, cid, "calling", "maybe a healer", { stability: "developmental" });
    await stage(p, cid, "fear_of_failure", "not good enough", { stability: "developmental", kind: "fear", awareness: "no" });
    const id = await listIdentity(p, cid);
    assert(id.facets.length === 0 && id.version === 0, "developmental candidate was auto-applied");
    assert(id.candidates.length === 2 && id.candidates.every((c: any) => c.status === "pending" && c.stability === "developmental"), "developmental candidate not pending");
    await kill(p);
  });

  // ── T573: source provenance (REQ-483) ────────────────────────────────
  await test("T573/REQ-483: candidates carry their source", async () => {
    const p = await boot(); await call(p, "manage_novel", { action: "create", name: "id11" }); await call(p, "set_badge", { badge: "game_master" });
    const cid = await makeCharacter(p, "Alice");
    await stage(p, cid, "calling", "Wandering blade", { source: "wiki" });
    await call(p, "manage_identity", { action: "bootstrap", character_id: cid, card: { name: "Alice" } });
    const id = await listIdentity(p, cid);
    const manual = id.candidates.find((c: any) => c.facet === "calling");
    const carded = id.candidates.find((c: any) => c.facet === "name");
    assert(manual.source === "wiki", "manual source not recorded");
    assert(carded && carded.source === "character_card", "card source not recorded: " + JSON.stringify(carded));
    await kill(p);
  });

  // ── T758: facet kinds and render order (REQ-636) ─────────────────────
  await test("T758/REQ-636: facets carry a psyche kind and render in catalog order", async () => {
    const p = await boot(); await call(p, "manage_novel", { action: "create", name: "id15" }); await call(p, "set_badge", { badge: "game_master" });
    const cid = await makeCharacter(p, "Alice");
    await call(p, "manage_character", { action: "set_active", entity_id: cid });
    const v = await stage(p, cid, "val", "keeps her word", { kind: "value" });
    const f = await stage(p, cid, "fear", "burning out", { kind: "fear" });
    const plain = await stage(p, cid, "calling", "Wandering blade");
    const name = await stage(p, cid, "name", "Alice", { stability: "structural" });
    for (const id of [v, f, plain, name]) await call(p, "manage_identity", { action: "accept", character_id: cid, candidate_id: id });
    const k = await snapshotIdentity(p, cid);
    const facet = (n: string) => kernelFacets(k).find((x: any) => x.facet === n);
    assert(facet("val").kind === "value" && facet("fear").kind === "fear", "kind not preserved in the kernel");
    assert(facet("calling").kind === "fact", "unset kind did not default to fact");
    const b = await briefing(p);
    assert(b.includes("- value: keeps her word") && b.includes("- fear: burning out"), "psyche kinds not rendered");
    assert(b.indexOf("- value:") < b.indexOf("- fear:"), "catalog order not applied");
    assert(b.indexOf("- value:") < b.indexOf("- name:"), "catalog order did not keep the fact last across stability classes");
    assert(b.includes("- calling: Wandering blade"), "fact facet did not render as its key");
    await kill(p);
  });

  // ── T759: self-awareness (REQ-637) ───────────────────────────────────
  await test("T759/REQ-637: unaware facets are marked for the GM and never stated to the Player", async () => {
    const p = await boot(); await call(p, "manage_novel", { action: "create", name: "id16" }); await call(p, "set_badge", { badge: "game_master" });
    const cid = await makeCharacter(p, "Alice");
    await call(p, "manage_character", { action: "set_active", entity_id: cid });
    const c = await stage(p, cid, "shame", "she cannot forgive the fire", { kind: "wound", awareness: "no" });
    await call(p, "manage_identity", { action: "accept", character_id: cid, candidate_id: c });
    const gm = await briefing(p);
    assert(gm.includes("she cannot forgive the fire") && gm.includes("[unaware]"), "GM render did not mark the unaware facet");
    await call(p, "set_badge", { badge: "player" });
    const player = await briefing(p);
    assert(!player.includes("she cannot forgive the fire"), "unaware facet was stated to the Player");
    assert(player.includes("### Who They Are"), "Player lost the who-they-are section");
    await kill(p);
  });

  // ── T760: false-but-held belief (REQ-638) ────────────────────────────
  await test("T760/REQ-638: a false belief is marked for the GM, unmarked for the Player, and survives reconciliation", async () => {
    const p = await boot(); await call(p, "manage_novel", { action: "create", name: "id17" }); await call(p, "set_badge", { badge: "game_master" });
    const cid = await makeCharacter(p, "Alice");
    await call(p, "manage_character", { action: "set_active", entity_id: cid });
    const c = await stage(p, cid, "web", "the web got heavy because nobody paid", { kind: "belief", false_but_held: true });
    await call(p, "manage_identity", { action: "accept", character_id: cid, candidate_id: c });
    assert((await briefing(p)).includes("[false belief]"), "GM render did not mark the false belief");
    await call(p, "manage_belief", { action: "reconcile", entity_id: cid });
    assert((await briefing(p)).includes("[false belief]"), "reconciliation cleared the false-belief mark");
    await call(p, "set_badge", { badge: "player" });
    const player = await briefing(p);
    assert(player.includes("the web got heavy because nobody paid"), "Player lost the belief");
    assert(!player.includes("[false belief]"), "Player saw the false-belief mark");
    await kill(p);
  });

  // ── T761: valence (REQ-639) ──────────────────────────────────────────
  await test("T761/REQ-639: stance valence is preserved and rendered", async () => {
    const p = await boot(); await call(p, "manage_novel", { action: "create", name: "id18" }); await call(p, "set_badge", { badge: "game_master" });
    const cid = await makeCharacter(p, "Alice");
    await call(p, "manage_character", { action: "set_active", entity_id: cid });
    const c = await stage(p, cid, "brother", "her brother's caution", { kind: "stance", valence: -40 });
    await call(p, "manage_identity", { action: "accept", character_id: cid, candidate_id: c });
    const k = await snapshotIdentity(p, cid);
    const stance = kernelFacets(k).find((x: any) => x.facet === "brother");
    assert(stance.valence === -40, "valence not preserved in the kernel: " + JSON.stringify(stance));
    assert((await briefing(p)).includes("(valence -40)"), "valence not rendered");
    const refused = await call(p, "manage_identity", { action: "stage", character_id: cid, facet: "x", value: "y", kind: "value", valence: 10 });
    assert(refused.includes("INVALID_INPUT"), "valence on a value facet was not refused: " + refused.slice(0, 120));
    await kill(p);
  });

  // ── T761: load-time normalization (REQ-638, REQ-639) ─────────────────
  await test("T761/REQ-638,REQ-639: load clamps valence and clears off-kind false belief", () => {
    const clamped = normalizeFacetAttributes({ kind: "stance", valence: 400 });
    assert(clamped.valence === 100, "valence not clamped on load: " + clamped.valence);
    const cleared = normalizeFacetAttributes({ kind: "value", false_but_held: true });
    assert(cleared.false_but_held === false, "off-kind false belief not cleared on load");
    const kept = normalizeFacetAttributes({ kind: "belief", false_but_held: true });
    assert(kept.false_but_held === true, "belief-kind false-but-held was cleared");
  });

  // ── T762: temporal bounds (REQ-640) ──────────────────────────────────
  await test("T762/REQ-640: an ended facet is absent from the render and present in the kernel", async () => {
    const p = await boot(); await call(p, "manage_novel", { action: "create", name: "id19" }); await call(p, "set_badge", { badge: "game_master" });
    const cid = await makeCharacter(p, "Alice");
    await call(p, "manage_character", { action: "set_active", entity_id: cid });
    await call(p, "manage_diagnostics", { action: "event", text: "a marker event for the identity window" });
    const old = await stage(p, cid, "old_oath", "an oath she has outgrown", { kind: "value", until: "2000-01-01" });
    const now = await stage(p, cid, "new_oath", "an oath she keeps", { kind: "value" });
    for (const id of [old, now]) await call(p, "manage_identity", { action: "accept", character_id: cid, candidate_id: id });
    const b = await briefing(p);
    assert(b.includes("an oath she keeps"), "in-window facet missing from the render");
    assert(!b.includes("an oath she has outgrown"), "ended facet rendered");
    const k = await snapshotIdentity(p, cid);
    assert(kernelFacets(k).some((x: any) => x.facet === "old_oath"), "ended facet dropped from the kernel");
    const inverted = await call(p, "manage_identity", { action: "stage", character_id: cid, facet: "bad", value: "window", since: "2026-02-01", until: "2026-01-01" });
    assert(inverted.includes("INVALID_INPUT"), "inverted window was not refused: " + inverted.slice(0, 120));
    await kill(p);
  });

  // ── T763: owned contradiction (REQ-641) ──────────────────────────────
  await test("T763/REQ-641: a contradiction reports a tension that survives reconciliation", async () => {
    const p = await boot(); await call(p, "manage_novel", { action: "create", name: "id20" }); await call(p, "set_badge", { badge: "game_master" });
    const cid = await makeCharacter(p, "Alice");
    await call(p, "manage_character", { action: "set_active", entity_id: cid });
    const a = await stage(p, cid, "value_a", "keeps her word", { kind: "value" });
    const b = await stage(p, cid, "stance_b", "distrusts every oath", { kind: "stance", valence: -30 });
    const contra = await stage(p, cid, "contra", "preaches patience, works at night", { kind: "contradiction", contradicts: ["value_a", "stance_b"] });
    for (const id of [a, b, contra]) await call(p, "manage_identity", { action: "accept", character_id: cid, candidate_id: id });
    let k = await snapshotIdentity(p, cid);
    assert(k.tensions.length === 1, "expected one tension: " + JSON.stringify(k.tensions));
    assert(k.tensions[0].ends[0] === "stance_b" && k.tensions[0].ends[1] === "value_a", "tension ends not sorted");
    assert((await briefing(p)).includes("Tension: preaches patience"), "tension not rendered");
    await call(p, "manage_belief", { action: "reconcile", entity_id: cid });
    k = await snapshotIdentity(p, cid);
    assert(k.tensions.length === 1, "tension did not survive reconciliation");
    const ghost = await stage(p, cid, "contra_ghost", "names no current end", { kind: "contradiction", contradicts: ["ghost_a", "ghost_b"] });
    await call(p, "manage_identity", { action: "accept", character_id: cid, candidate_id: ghost });
    k = await snapshotIdentity(p, cid);
    assert(k.tensions.length === 1, "a dormant contradiction surfaced a tension");
    await kill(p);
  });

  // ── T764: renderer determinism and exclusions (REQ-642) ──────────────
  await test("T764/REQ-642: two renders are identical; secret and ended facets are absent", async () => {
    const p = await boot(); await call(p, "manage_novel", { action: "create", name: "id21" }); await call(p, "set_badge", { badge: "game_master" });
    const cid = await makeCharacter(p, "Alice");
    await call(p, "manage_character", { action: "set_active", entity_id: cid });
    await call(p, "manage_diagnostics", { action: "event", text: "a marker event" });
    const v = await stage(p, cid, "value_a", "keeps her word", { kind: "value" });
    const hidden = await stage(p, cid, "hidden", "a secret she keeps", { perspective: "secret" });
    const ended = await stage(p, cid, "old", "a habit she broke", { kind: "habit", until: "2000-01-01" });
    for (const id of [v, hidden, ended]) await call(p, "manage_identity", { action: "accept", character_id: cid, candidate_id: id });
    const first = await briefing(p); const second = await briefing(p);
    assert(first === second, "two renders at one version differ");
    assert(first.includes("keeps her word"), "current facet missing");
    assert(!first.includes("a secret she keeps"), "secret facet rendered");
    assert(!first.includes("a habit she broke"), "ended facet rendered");
    const bob = await makeCharacter(p, "Bob");
    await call(p, "manage_character", { action: "set_active", entity_id: bob });
    const bobId = await stage(p, bob, "temp", "nothing durable");
    await call(p, "manage_identity", { action: "reject", character_id: bob, candidate_id: bobId });
    assert((await briefing(p)).includes("[No identity facets to state.]"), "empty state marker missing");
    await kill(p);
  });

  // ── T765: Player projection and resource gate (REQ-643) ──────────────
  await test("T765/REQ-643: a Player reads a projected kernel and is refused a foreign identity", async () => {
    const p = await boot(); await call(p, "manage_novel", { action: "create", name: "id22" }); await call(p, "set_badge", { badge: "game_master" });
    const alice = await makeCharacter(p, "Alice");
    const bob = await makeCharacter(p, "Bob");
    for (const [cid, tag] of [[alice, "alice"], [bob, "bob"]] as const) {
      const belief = await stage(p, cid, "belief_" + tag, `a belief ${tag} holds`, { kind: "belief", false_but_held: true });
      const unaware = await stage(p, cid, "unaware_" + tag, `a wound ${tag} hides`, { kind: "wound", awareness: "no" });
      for (const id of [belief, unaware]) await call(p, "manage_identity", { action: "accept", character_id: cid, candidate_id: id });
    }
    await call(p, "manage_character", { action: "set_active", entity_id: alice });
    await call(p, "set_badge", { badge: "player" });
    const foreign = await call(p, "manage_identity", { action: "list", character_id: bob });
    assert(foreign.includes("[FORBIDDEN]"), "Player tool read of a foreign identity was not refused");
    const foreignRes = await readRes(p, `identity://${bob}`);
    assert(String(foreignRes).includes("FORBIDDEN"), "Player resource read of a foreign identity was not refused");
    const own = await snapshotIdentity(p, alice);
    assert(!kernelFacets(own).some((f: any) => f.facet === "unaware_alice"), "Player snapshot carried an unaware facet");
    const ownBelief = kernelFacets(own).find((f: any) => f.facet === "belief_alice");
    assert(ownBelief && ownBelief.false_but_held === false, "Player snapshot kept the false-belief mark");
    await call(p, "set_badge", { badge: "game_master" });
    const gm = await snapshotIdentity(p, alice);
    assert(kernelFacets(gm).find((f: any) => f.facet === "belief_alice").false_but_held === true, "GM snapshot lost the false-belief mark");
    await kill(p);
  });

  // ── T630: candidate retention bound (REQ-547) ────────────────────────
  await test("T630/REQ-547: the candidate cap evicts the oldest candidate", async () => {
    process.env.TTRPG_IDENTITY_MAX_CANDIDATES = "2";
    const p = await boot(); await call(p, "manage_novel", { action: "create", name: "id12" }); await call(p, "set_badge", { badge: "game_master" });
    const cid = await makeCharacter(p, "Alice");
    await stage(p, cid, "calling", "first");
    await stage(p, cid, "calling", "second");
    await stage(p, cid, "calling", "third");
    const id = await listIdentity(p, cid);
    await kill(p);
    delete process.env.TTRPG_IDENTITY_MAX_CANDIDATES;
    assert(id.candidates.length === 2, "expected 2 candidates after cap, got " + id.candidates.length);
    const values = id.candidates.map((c: any) => c.value);
    assert(!values.includes("first") && values.includes("second") && values.includes("third"), "oldest not evicted: " + JSON.stringify(values));
    assert(id.facets.length === 0, "accepted facets changed by eviction: " + JSON.stringify(id.facets));
  });

  // ── T631: authored bootstrap acceptance (REQ-473, REQ-479) ───────────
  await test("T631/REQ-473: bootstrap acceptance toggles between facets and pending candidates", async () => {
    const p = await boot(); await call(p, "manage_novel", { action: "create", name: "id13" }); await call(p, "set_badge", { badge: "game_master" });
    const cid = await makeCharacter(p, "Alice");
    await call(p, "manage_identity", { action: "bootstrap", character_id: cid, card: { name: "Alice", description: "a wanderer" } });
    const accepted = await listIdentity(p, cid);
    await kill(p);
    assert(accepted.facets.length === 2, "authored fields were not accepted as facets: " + JSON.stringify(accepted.facets));
    assert(accepted.candidates.every((c: any) => c.status === "accepted"), "candidates not marked accepted: " + JSON.stringify(accepted.candidates));
    process.env.TTRPG_IDENTITY_AUTO_ACCEPT_AUTHORED = "false";
    const p2 = await boot(); await call(p2, "manage_novel", { action: "create", name: "id14" }); await call(p2, "set_badge", { badge: "game_master" });
    const cid2 = await makeCharacter(p2, "Bob");
    await call(p2, "manage_identity", { action: "bootstrap", character_id: cid2, card: { name: "Bob", description: "a tinker" } });
    const staged = await listIdentity(p2, cid2);
    await kill(p2);
    delete process.env.TTRPG_IDENTITY_AUTO_ACCEPT_AUTHORED;
    assert(staged.facets.length === 0, "staging-only bootstrap created facets: " + JSON.stringify(staged.facets));
    assert(staged.candidates.every((c: any) => c.status === "pending"), "staging-only bootstrap accepted candidates: " + JSON.stringify(staged.candidates));
  });

  harnessComplete();
  console.log(`\n${passed} passed, ${failed} failed`);
  rmSync(DATA_DIR, { recursive: true, force: true });
  if (failed > 0) process.exit(1);
}
main().catch((e) => { console.error("FATAL", e); process.exit(2); });
