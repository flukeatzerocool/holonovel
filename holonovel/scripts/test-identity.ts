#!/usr/bin/env node
// Character Identity harness — covers REQ-473 (candidate staging), REQ-474 [gate]
// (stability classes), REQ-475 (perspective), REQ-476 (compiled kernel),
// REQ-477 (write-authority isolation), REQ-478 (revision audit), REQ-479
// (card-bootstrap exclusions), REQ-480 (kernel exposure), REQ-481 (visibility
// gating), REQ-482 (developmental proposal-only), REQ-483 (source provenance),
// and REQ-547 (candidate retention bound).

import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { installHarnessGuard, harnessComplete } from "./lib/harness-guard.js";
installHarnessGuard();

const SERVER_SCRIPT = join(process.cwd(), "src", "index.ts");
const DATA_DIR = mkdtempSync(join(tmpdir(), "identity-"));
let msgId = 0; const pending = new Map(); let buffer = "";
function send(proc: any, msg: any): Promise<any> { return new Promise((r) => { const id = ++msgId; pending.set(id, r); proc.stdin!.write(JSON.stringify({ ...msg, id, jsonrpc: "2.0" }) + "\n"); }); }
function attach(proc: any) { buffer = ""; proc.stdout!.on("data", (d: Buffer) => { buffer += d.toString(); const ls = buffer.split("\n"); buffer = ls.pop() ?? ""; for (const l of ls) { if (!l.trim()) continue; try { const m = JSON.parse(l); if (m.id !== undefined && pending.has(m.id)) { pending.get(m.id)!(m); pending.delete(m.id); } } catch { /* non-JSON line */ } } }); }
async function boot() { const p = spawn("npx", ["tsx", SERVER_SCRIPT], { env: { ...process.env, TTRPG_DATA_DIR: DATA_DIR }, stdio: ["pipe", "pipe", "pipe"] }); attach(p); await send(p, { method: "initialize", params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "identity", version: "1" } } }); p.stdin!.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n"); await new Promise((r) => setTimeout(r, 250)); return p; }
async function call(proc: any, name: string, args: any = {}): Promise<string> { const r = await send(proc, { method: "tools/call", params: { name, arguments: args } }); const c = r.result?.content ?? []; return c.map((x: any) => x?.text ?? "").join("\n"); }
async function readRes(proc: any, uri: string): Promise<string> { const r = await send(proc, { method: "resources/read", params: { uri } }); const c = r.result?.contents ?? []; return c.map((x: any) => x?.text ?? "").join("\n"); }
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
    await call(p, "manage_session", { action: "event", text: "the blade sings" });
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
    const id = await listIdentity(p, cid);
    assert(id.facets.length === 0 && id.version === 0, "developmental candidate was auto-applied");
    assert(id.candidates[0].status === "pending" && id.candidates[0].stability === "developmental", "developmental candidate not pending");
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
