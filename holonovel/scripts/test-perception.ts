#!/usr/bin/env node
// Perception Ledger harness — REQ-540 (record), REQ-541 (observed vs believed), [gate]
// REQ-542 (per-entity), REQ-543 (event provenance), REQ-544 (persistence),
// REQ-545 (badge gating).

import { spawn } from "node:child_process";
import { mkdtempSync, rmSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
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
    await call(p, "manage_diagnostics", { action: "event", text: "a horn sounds" });
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


  await test("T701/REQ-596: room light gates visibility across rooms", async () => {
    const p = await boot(); await newNovel(p, "pc7");
    const src = [
      "# World", "",
      "## Room: litroom", "A lit room.",
      "The torch is in litroom.", "It is lit.", "It is switched on.", "It is switchable.",
      "North of litroom is darkroom.",
      "## Room: darkroom", "A dark room.",
      "The boulder is in darkroom.", "",
    ].join("\n");
    await call(p, "manage_world", { action: "convert", source: src });
    await call(p, "manage_character", { action: "create", name: "Watcher" });
    await call(p, "manage_character", { action: "set_active", entity_id: "character_01" });
    await call(p, "run_command", { command: "look" });
    await call(p, "run_command", { command: "go north" });
    const dark = JSON.parse(await call(p, "run_command", { action: "visibility", source: "character_01", target: "boulder" }));
    assert(dark.can_see === false, "dark room leaked visibility: " + JSON.stringify(dark));
    await call(p, "manage_world", { action: "create_thing", name: "dark torch", kind: "thing", location: "darkroom", lit: true, switched_on: true, switchable: true });
    const lit = JSON.parse(await call(p, "run_command", { action: "visibility", source: "character_01", target: "boulder" }));
    assert(lit.can_see === true, "lit room hid a visible thing: " + JSON.stringify(lit));
    await kill(p);
  });

  await test("T702/REQ-596: opaque boundary hides, transparent boundary reveals", async () => {
    const p = await boot(); await newNovel(p, "pc8");
    const src = [
      "# World", "",
      "Vault is a room.", "",
      "## Room: vault", "A vault.",
      "The sunstone is in vault.", "It is lit.", "It is switched on.",
      "An iron chest is a container. It is in vault.",
      "A glass jar is a container. It is transparent. It is in the iron chest.",
      "A glowing lantern is in the glass jar.", "It is lit.", "It is switched on.", "",
    ].join("\n");
    await call(p, "manage_world", { action: "convert", source: src });
    await call(p, "manage_character", { action: "create", name: "Watcher" });
    await call(p, "manage_character", { action: "set_active", entity_id: "character_01" });
    await call(p, "run_command", { command: "look" });
    const hidden = JSON.parse(await call(p, "run_command", { action: "visibility", source: "character_01", target: "glowing lantern" }));
    assert(hidden.can_see === false, "opaque outer chest leaked its contents: " + JSON.stringify(hidden));
    await call(p, "run_command", { command: "open iron chest" });
    const revealed = JSON.parse(await call(p, "run_command", { action: "visibility", source: "character_01", target: "glowing lantern" }));
    assert(revealed.can_see === true, "transparent jar hid a lit thing: " + JSON.stringify(revealed));
    const stone = JSON.parse(await call(p, "run_command", { action: "visibility", source: "character_01", target: "sunstone" }));
    assert(stone.can_see === true, "same-room lit thing not visible");
    await kill(p);
  });

  await test("T703/REQ-597: sound crosses one open exit but not a closed door", async () => {
    const p = await boot(); await newNovel(p, "pc9");
    const src = [
      "# World", "",
      "## Room: near", "Near.", "## Room: far", "Far.",
      "North of near is far.",
      "Oak door is north of near and south of far.",
      "It is closed.",
      "A bell is in far.", "",
    ].join("\n");
    await call(p, "manage_world", { action: "convert", source: src });
    await call(p, "manage_character", { action: "create", name: "Watcher" });
    await call(p, "manage_character", { action: "set_active", entity_id: "character_01" });
    await call(p, "run_command", { command: "look" });
    await call(p, "manage_npc", { action: "create", name: "Far Guard", location: "far" });
    const closed = JSON.parse(await call(p, "run_command", { action: "audibility", source: "character_01", target: "Far Guard" }));
    assert(closed.can_hear === false, "closed door leaked sound: " + JSON.stringify(closed));
    await call(p, "run_command", { command: "unlock oak door" });
    await call(p, "run_command", { command: "open oak door" });
    const open = JSON.parse(await call(p, "run_command", { action: "audibility", source: "character_01", target: "Far Guard" }));
    assert(open.can_hear === true, "open exit did not carry sound: " + JSON.stringify(open));
    await kill(p);
  });

  await test("T704/REQ-595: derived witnesses and knowledge query", async () => {
    const p = await boot(); await newNovel(p, "pc10");
    const src = [
      "# World", "",
      "## Room: hall", "A hall.",
      "The torch is in hall.", "It is lit.", "It is switched on.",
      "North of hall is porch.",
      "## Room: porch", "A porch.", "",
    ].join("\n");
    await call(p, "manage_world", { action: "convert", source: src });
    await call(p, "manage_character", { action: "create", name: "Watcher" });
    await call(p, "manage_character", { action: "create", name: "Listener" });
    await call(p, "manage_character", { action: "set_active", entity_id: "character_01" });
    await call(p, "run_command", { command: "look" });
    await call(p, "manage_staging", { action: "presence", entity_ids: ["character_01", "character_02"] });
    await call(p, "run_command", { command: "go north" });
    await call(p, "run_command", { command: "go south" });
    await call(p, "manage_world", { action: "create_thing", name: "hall torch", kind: "thing", location: "hall", lit: true, switched_on: true });
    await call(p, "manage_world", { action: "create_room", name: "cellar", description: "Disconnected." });
    await call(p, "manage_npc", { action: "create", name: "Distant Guard", location: "cellar" });
    await call(p, "manage_diagnostics", { action: "event", text: "a bell rings" });
    const all = JSON.parse(await call(p, "manage_belief", { action: "perception_list" }));
    const forEvent = (all ?? []).filter((r: any) => r.summary === "a bell rings");
    assert(forEvent.length === 1 && forEvent[0].entity_id === "character_02",
      "room isolation failed: " + JSON.stringify(forEvent));
    const knowledge = JSON.parse(await call(p, "manage_belief", { action: "knowledge_query", entity_id: "character_02" }));
    const saw = (knowledge.perceptions ?? []).find((r: any) => r.summary === "a bell rings");
    assert(!!saw, "derived perception missing: " + JSON.stringify(knowledge));
    assert(saw.witness === "saw" && saw.sense === "sight", "wrong witness provenance: " + JSON.stringify(saw));
    assert(saw.event_ordinal !== null, "derived perception lacks event provenance");
    await call(p, "set_badge", { badge: "player" });
    const own = await call(p, "manage_belief", { action: "knowledge_query", entity_id: "character_01" });
    assert(!own.includes("[FORBIDDEN]"), "Player could not read own knowledge");
    const other = await call(p, "manage_belief", { action: "knowledge_query", entity_id: "character_02" });
    assert(other.includes("[FORBIDDEN]"), "Player read another entity's knowledge");
    await kill(p);
  });

  await test("T705/REQ-594: legacy perception records load inert", async () => {
    const p = await boot(); await newNovel(p, "pc11");
    await rec(p, { entity_id: "hero", summary: "an older sight" });
    await kill(p);
    const file = join(DATA_DIR, "novels", "pc11.json");
    const data = JSON.parse(readFileSync(file, "utf-8"));
    for (const entry of data.perception_ledger ?? []) {
      delete entry.witness;
      delete entry.sense;
      delete entry.source_entity;
      delete entry.room_id;
      delete entry.confidence;
    }
    delete data._checksum;
    data._checksum = createHash("sha256").update(JSON.stringify(data)).digest("hex");
    writeFileSync(file, JSON.stringify(data, null, 2));
    const p2 = await boot();
    await call(p2, "manage_novel", { action: "resume", slug: "pc11" });
    const recs = await forEntity(p2, "hero");
    assert(recs.length === 1 && recs[0].witness === "inferred" && recs[0].sense === null && recs[0].confidence === 0,
      "legacy record not normalized: " + JSON.stringify(recs));
    await kill(p2);
  });

  harnessComplete();
  console.log(`\n${passed} passed, ${failed} failed`);
  rmSync(DATA_DIR, { recursive: true, force: true });
  if (failed > 0) process.exit(1);
}
main().catch((e) => { console.error("FATAL", e); process.exit(2); });
