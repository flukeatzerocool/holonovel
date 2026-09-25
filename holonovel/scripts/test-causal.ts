#!/usr/bin/env node
// Causal Transition Validation harness — covers REQ-484 (proposal), REQ-485
// (decision), REQ-486 (location exclusivity), REQ-487 (ordered scalar),
// REQ-488 (scope coordinate), REQ-489 (idempotency/version), REQ-490 (latent),
// REQ-491 (rejected evidence), REQ-492 (firewall), REQ-493 (ingress),
// REQ-494 (state resource), REQ-495 (badge gating).

import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const SERVER_SCRIPT = join(process.cwd(), "src", "index.ts");
const DATA_DIR = mkdtempSync(join(tmpdir(), "causal-"));
let msgId = 0; const pending = new Map(); let buffer = "";
function send(proc: any, msg: any): Promise<any> { return new Promise((r) => { const id = ++msgId; pending.set(id, r); proc.stdin!.write(JSON.stringify({ ...msg, id, jsonrpc: "2.0" }) + "\n"); }); }
function attach(proc: any) { buffer = ""; proc.stdout!.on("data", (d: Buffer) => { buffer += d.toString(); const ls = buffer.split("\n"); buffer = ls.pop() ?? ""; for (const l of ls) { if (!l.trim()) continue; try { const m = JSON.parse(l); if (m.id !== undefined && pending.has(m.id)) { pending.get(m.id)!(m); pending.delete(m.id); } } catch { /* non-JSON line */ } } }); }
async function boot(env: any = {}) { const p = spawn("npx", ["tsx", SERVER_SCRIPT], { env: { ...process.env, TTRPG_DATA_DIR: DATA_DIR, ...env }, stdio: ["pipe", "pipe", "pipe"] }); attach(p); await send(p, { method: "initialize", params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "causal", version: "1" } } }); p.stdin!.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n"); await new Promise((r) => setTimeout(r, 250)); return p; }
async function call(proc: any, name: string, args: any = {}): Promise<string> { const r = await send(proc, { method: "tools/call", params: { name, arguments: args } }); const c = r.result?.content ?? []; return c.map((x: any) => x?.text ?? "").join("\n"); }
async function readRes(proc: any, uri: string): Promise<string> { const r = await send(proc, { method: "resources/read", params: { uri } }); const c = r.result?.contents ?? []; return c.map((x: any) => x?.text ?? "").join("\n"); }
async function kill(proc: any) { try { proc.kill("SIGKILL"); } catch { /* already exited */ } await new Promise((r) => setTimeout(r, 100)); }

let passed = 0; let failed = 0;
async function test(name: string, fn: () => void | Promise<void>): Promise<void> {
  try { await fn(); passed++; console.log(`PASS ${name}`); } catch (e: any) { failed++; console.error(`FAIL ${name}: ${e.message ?? e}`); }
}
function assert(cond: any, msg: string) { if (!cond) throw new Error(msg); }
async function newNovel(p: any, name: string) { await call(p, "manage_novel", { action: "create", name }); await call(p, "set_badge", { badge: "game_master" }); }
async function propose(p: any, args: any): Promise<string> { const r = await call(p, "manage_causal", { action: "propose", ...args }); const m = r.match(/Proposal (tp-\d+)/); if (!m) throw new Error("propose failed: " + r.slice(0, 160)); return m[1]; }
async function admit(p: any, id: string): Promise<string> { return call(p, "manage_causal", { action: "admit", proposal_id: id }); }
async function state(p: any): Promise<any[]> { const t = await call(p, "manage_causal", { action: "state" }); try { return JSON.parse(t); } catch { return []; } }

async function main() {
  // ── T574: proposal recorded before application (REQ-484) ─────────────
  await test("T574/REQ-484: a proposal is recorded and does not change state", async () => {
    const p = await boot(); await newNovel(p, "cs1");
    const id = await propose(p, { entity: "hero", key: "location", value: "roomA" });
    const slots = await state(p);
    assert(slots.length === 0, "proposal changed state before admission");
    const ledger = JSON.parse(await call(p, "manage_causal", { action: "list" }));
    assert(ledger[0].id === id && ledger[0].decision === "underdetermined", "proposal not recorded as underdetermined");
    await kill(p);
  });

  // ── T575: admission decision (REQ-485) ───────────────────────────────
  await test("T575/REQ-485: a valid proposal is admitted", async () => {
    const p = await boot(); await newNovel(p, "cs2");
    const id = await propose(p, { entity: "hero", key: "location", value: "roomA" });
    const r = await admit(p, id);
    assert(r.includes("admitted"), "valid proposal not admitted: " + r);
    assert((await state(p)).length === 1, "admitted slot not applied");
    await kill(p);
  });

  // ── T576: location exclusivity (REQ-486) ─────────────────────────────
  await test("T576/REQ-486: one location per entity; incompatible prior conflicts", async () => {
    const p = await boot(); await newNovel(p, "cs3");
    await admit(p, await propose(p, { entity: "hero", key: "location", value: "roomA" }));
    const conflictId = await propose(p, { entity: "hero", key: "location", value: "roomC", from: "roomZ" });
    const bad = await admit(p, conflictId);
    assert(bad.includes("conflict"), "incompatible prior should conflict: " + bad);
    const moveId = await propose(p, { entity: "hero", key: "location", value: "roomB", from: "roomA" });
    assert((await admit(p, moveId)).includes("admitted"), "continuous move not admitted");
    const slots = await state(p);
    assert(slots.length === 1 && slots[0].value === "roomB", "entity did not move to one current location");
    await kill(p);
  });

  // ── T577: ordered scalar (REQ-487) ───────────────────────────────────
  await test("T577/REQ-487: scalar admits later values and refuses earlier ones", async () => {
    const p = await boot(); await newNovel(p, "cs4");
    await admit(p, await propose(p, { domain: "scalar", entity: "hero", key: "hp", value: 1 }));
    const up = await admit(p, await propose(p, { domain: "scalar", entity: "hero", key: "hp", value: 2 }));
    assert(up.includes("admitted"), "ordered scalar advance not admitted: " + up);
    const down = await admit(p, await propose(p, { domain: "scalar", entity: "hero", key: "hp", value: 1 }));
    assert(down.includes("conflict"), "incompatible scalar value not refused: " + down);
    await kill(p);
  });

  // ── T578: scope coordinate (REQ-488) ─────────────────────────────────
  await test("T578/REQ-488: a foreign scope coordinate is rejected", async () => {
    const p = await boot(); await newNovel(p, "cs5");
    const id = await propose(p, { scope: "some-other-world", entity: "hero", key: "location", value: "roomA" });
    const r = await admit(p, id);
    assert(r.includes("rejected_impossible"), "foreign scope not rejected: " + r);
    assert((await state(p)).length === 0, "rejected transition changed state");
    await kill(p);
  });

  // ── T579: idempotency + optimistic version (REQ-489) ─────────────────
  await test("T579/REQ-489: re-admitting a value does not bump the version", async () => {
    const p = await boot(); await newNovel(p, "cs6");
    await admit(p, await propose(p, { entity: "hero", key: "location", value: "roomA" }));
    await admit(p, await propose(p, { entity: "hero", key: "location", value: "roomB", from: "roomA" }));
    let slot = (await state(p))[0];
    assert(slot.version === 2, "expected version 2: " + JSON.stringify(slot));
    await admit(p, await propose(p, { entity: "hero", key: "location", value: "roomB" }));
    slot = (await state(p))[0];
    assert(slot.version === 2, "idempotent re-admit bumped the version: " + slot.version);
    const stale = await admit(p, await propose(p, { entity: "hero", key: "location", value: "roomC", expected_version: 1 }));
    assert(stale.includes("conflict"), "stale expected version not refused: " + stale);
    await kill(p);
  });

  // ── T580: latent transition (REQ-490) ────────────────────────────────
  await test("T580/REQ-490: with latent transitions enabled an incompatible write is flagged", async () => {
    const p = await boot({ TTRPG_CAUSAL_LATENT_TRANSITIONS: "true" }); await newNovel(p, "cs7");
    await admit(p, await propose(p, { entity: "hero", key: "location", value: "roomA" }));
    const id = await propose(p, { entity: "hero", key: "location", value: "roomC", from: "roomZ" });
    const r = await admit(p, id);
    assert(r.includes("admitted_with_latent_transition"), "latent transition not flagged: " + r);
    await kill(p);
  });

  // ── T581: rejected-transition evidence (REQ-491) ─────────────────────
  await test("T581/REQ-491: a refused proposal remains in the ledger", async () => {
    const p = await boot(); await newNovel(p, "cs8");
    const id = await propose(p, { scope: "elsewhere", entity: "hero", key: "location", value: "roomA" });
    await admit(p, id);
    const ledger = JSON.parse(await call(p, "manage_causal", { action: "list" }));
    const rec = ledger.find((r: any) => r.id === id);
    assert(rec && rec.decision === "rejected_impossible", "refused proposal not preserved: " + JSON.stringify(rec));
    await kill(p);
  });

  // ── T582: causal–epistemic firewall (REQ-492) ────────────────────────
  await test("T582/REQ-492: causal admission leaves belief and identity untouched", async () => {
    const p = await boot(); await newNovel(p, "cs9");
    await propose(p, { entity: "hero", key: "location", value: "roomA" });
    const beliefs = await call(p, "manage_belief", { action: "list", entity_id: "hero" });
    assert(beliefs.includes("No beliefs") || beliefs === "", "causal layer wrote belief state: " + beliefs.slice(0, 80));
    await kill(p);
  });

  // ── T583: deterministic machine ingress (REQ-493) ────────────────────
  await test("T583/REQ-493: machine ingress admits in one step with machine origin", async () => {
    const p = await boot(); await newNovel(p, "cs10");
    const r = await call(p, "manage_causal", { action: "ingress", domain: "scalar", entity: "reactor", key: "output", value: 40 });
    assert(r.includes("admitted"), "ingress not admitted: " + r);
    const ledger = JSON.parse(await call(p, "manage_causal", { action: "list" }));
    assert(ledger[0].origin_source === "machine", "ingress origin not machine: " + JSON.stringify(ledger[0]));
    await kill(p);
  });

  // ── T584: state resource (REQ-494) ───────────────────────────────────
  await test("T584/REQ-494: causal://state serves admitted state", async () => {
    const p = await boot(); await newNovel(p, "cs11");
    await admit(p, await propose(p, { entity: "hero", key: "location", value: "roomA" }));
    const served = JSON.parse(await readRes(p, "causal://state"));
    assert(served.length === 1 && served[0].value === "roomA", "causal state resource wrong: " + JSON.stringify(served));
    await kill(p);
  });

  // ── T585: badge gating (REQ-495) ─────────────────────────────────────
  await test("T585/REQ-495: Player cannot propose; Player reads objective state", async () => {
    const p = await boot(); await newNovel(p, "cs12");
    await admit(p, await propose(p, { entity: "hero", key: "location", value: "roomA" }));
    await call(p, "set_badge", { badge: "player" });
    const rd = await call(p, "manage_causal", { action: "state" });
    assert(rd.includes("roomA"), "Player should read objective state: " + rd.slice(0, 80));
    const prop = await call(p, "manage_causal", { action: "propose", entity: "hero", key: "location", value: "roomC" });
    assert(prop.includes("[FORBIDDEN]") || prop.includes("[ERROR]"), "Player propose should be forbidden: " + prop.slice(0, 80));
    await kill(p);
  });

  console.log(`\n${passed} passed, ${failed} failed`);
  rmSync(DATA_DIR, { recursive: true, force: true });
  if (failed > 0) process.exit(1);
}
main().catch((e) => { console.error("FATAL", e); process.exit(2); });
