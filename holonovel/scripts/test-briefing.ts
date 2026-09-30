#!/usr/bin/env node
// Briefing-consistency harness — REQ-515 (readiness cursor), REQ-516
// (consistency declaration), REQ-517 (derived-surface freshness), REQ-518
// (determinism), REQ-519 (read-only), REQ-520 (visibility), REQ-521 (staleness
// advisory).

import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { installHarnessGuard, harnessComplete } from "./lib/harness-guard.js";
installHarnessGuard();

const SERVER_SCRIPT = join(process.cwd(), "src", "index.ts");
const DATA_DIR = mkdtempSync(join(tmpdir(), "brief-"));
let msgId = 0; const pending = new Map(); let buffer = "";
function send(proc: any, msg: any): Promise<any> { return new Promise((r) => { const id = ++msgId; pending.set(id, r); proc.stdin!.write(JSON.stringify({ ...msg, id, jsonrpc: "2.0" }) + "\n"); }); }
function attach(proc: any) { buffer = ""; proc.stdout!.on("data", (d: Buffer) => { buffer += d.toString(); const ls = buffer.split("\n"); buffer = ls.pop() ?? ""; for (const l of ls) { if (!l.trim()) continue; try { const m = JSON.parse(l); if (m.id !== undefined && pending.has(m.id)) { pending.get(m.id)!(m); pending.delete(m.id); } } catch { /* non-JSON */ } } }); }
async function boot() { const p = spawn("npx", ["tsx", SERVER_SCRIPT], { env: { ...process.env, TTRPG_DATA_DIR: DATA_DIR }, stdio: ["pipe", "pipe", "pipe"] }); attach(p); await send(p, { method: "initialize", params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "brief", version: "1" } } }); p.stdin!.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n"); await new Promise((r) => setTimeout(r, 250)); return p; }
async function call(proc: any, name: string, args: any = {}): Promise<string> { const r = await send(proc, { method: "tools/call", params: { name, arguments: args } }); return (r.result?.content ?? []).map((x: any) => x?.text ?? "").join("\n"); }
async function health(p: any): Promise<any> { return JSON.parse(await call(p, "manage_session", { action: "health" })); }
async function promptText(p: any, name: string): Promise<string> { const r = await send(p, { method: "prompts/get", params: { name, arguments: {} } }); return (r.result?.messages ?? []).map((m: any) => m.content?.text ?? "").join("\n"); }
async function kill(proc: any) { try { proc.kill("SIGKILL"); } catch { /* exited */ } await new Promise((r) => setTimeout(r, 100)); }

let passed = 0; let failed = 0;
async function test(name: string, fn: () => void | Promise<void>) { try { await fn(); passed++; console.log(`PASS ${name}`); } catch (e: any) { failed++; console.error(`FAIL ${name}: ${e.message ?? e}`); } }
function assert(c: any, m: string) { if (!c) throw new Error(m); }
async function newNovel(p: any, name: string) { await call(p, "manage_novel", { action: "create", name }); await call(p, "set_badge", { badge: "game_master" }); }

async function main() {
  await test("T620/REQ-515: the briefing reports the event-log cursor", async () => {
    const p = await boot(); await newNovel(p, "bc1");
    await call(p, "manage_session", { action: "event", text: "one" });
    await call(p, "manage_session", { action: "event", text: "two" });
    const bc = (await health(p)).briefing_consistency;
    assert(bc.available === true && bc.through_ordinal === 2, "cursor wrong: " + JSON.stringify(bc));
    await kill(p);
  });

  await test("T621/REQ-516: consistency is declared", async () => {
    const p = await boot(); await newNovel(p, "bc2");
    const bc = (await health(p)).briefing_consistency;
    assert(bc.available === true && typeof bc.through_ordinal === "number", "consistency not declared: " + JSON.stringify(bc));
    await kill(p);
  });

  await test("T622/REQ-517: derived-surface freshness is reported", async () => {
    const p = await boot(); await newNovel(p, "bc3");
    await call(p, "manage_lore", { action: "set", key: "dragon", content: "a dragon", badge_scope: "shared" });
    let bc = (await health(p)).briefing_consistency;
    assert(bc.index === "unbuilt" && bc.graph === "unbuilt", "expected unbuilt: " + JSON.stringify(bc));
    await call(p, "manage_knowledge", { action: "index_build" });
    await call(p, "manage_knowledge", { action: "graph_build" });
    bc = (await health(p)).briefing_consistency;
    assert(bc.index === "current" && bc.graph === "current", "expected current: " + JSON.stringify(bc));
    await call(p, "manage_lore", { action: "set", key: "tower", content: "a tower", badge_scope: "shared" });
    bc = (await health(p)).briefing_consistency;
    assert(bc.index === "stale" && bc.graph === "stale", "expected stale: " + JSON.stringify(bc));
    await kill(p);
  });

  await test("T623/REQ-518: repeated reports are identical", async () => {
    const p = await boot(); await newNovel(p, "bc4");
    await call(p, "manage_session", { action: "event", text: "x" });
    const a = JSON.stringify((await health(p)).briefing_consistency);
    const b = JSON.stringify((await health(p)).briefing_consistency);
    assert(a === b, "consistency report is not deterministic: " + a + " vs " + b);
    await kill(p);
  });

  await test("T624/REQ-519: the consistency report mutates nothing", async () => {
    const p = await boot(); await newNovel(p, "bc5");
    await call(p, "manage_session", { action: "event", text: "one" });
    const before = (await health(p)).briefing_consistency.through_ordinal;
    await health(p); await health(p);
    const after = (await health(p)).briefing_consistency.through_ordinal;
    assert(before === after, "consistency report changed the cursor: " + before + " -> " + after);
    await kill(p);
  });

  await test("T625/REQ-520: the report is available to every badge", async () => {
    const p = await boot(); await newNovel(p, "bc6");
    for (const badge of ["player", "observer"]) {
      await call(p, "set_badge", { badge });
      const bc = (await health(p)).briefing_consistency;
      assert(bc.available === true, `report unavailable to ${badge}: ` + JSON.stringify(bc));
    }
    await kill(p);
  });

  await test("T626/REQ-521: staleness is an advisory and the briefing still renders", async () => {
    const p = await boot(); await newNovel(p, "bc7");
    await call(p, "manage_lore", { action: "set", key: "dragon", content: "a dragon", badge_scope: "shared" });
    await call(p, "manage_knowledge", { action: "index_build" });
    await call(p, "manage_lore", { action: "set", key: "tower", content: "a tower", badge_scope: "shared" });
    const bc = (await health(p)).briefing_consistency;
    assert(typeof bc.advisory === "string" && bc.advisory.includes("stale"), "stale advisory missing: " + JSON.stringify(bc));
    const text = await promptText(p, "badge_briefing");
    assert(text.includes("Briefing consistency"), "briefing did not render the consistency line");
    await kill(p);
  });

  await test("T148/REQ-134: player briefing lists only Player-callable tools", async () => {
    const p = await boot(); await newNovel(p, "bc8");
    await call(p, "manage_world", { action: "create_room", name: "The Hall", description: "A hall." });
    await call(p, "manage_scene", { action: "set", description: "In the hall", location: "Hall" });
    await call(p, "set_badge", { badge: "player" });
    const text = await promptText(p, "badge_briefing");
    assert(!text.includes('command("'), "player briefing named a non-existent command() tool");
    assert(!text.includes("run_command (action: resolve)"), "player briefing suggested the Player-forbidden resolve action");
    assert(text.includes("run_command (action: execute"), "ruleset-free player should be offered the parser (REQ-218/REQ-309e)");
    assert(text.includes("### Surroundings") && text.includes("The Hall"), "player surroundings did not resolve the room");
    const suggest = await call(p, "run_command", { action: "suggest", intent: "look around" });
    assert(!suggest.includes('command("'), "suggest named a non-existent command() tool");
    assert(!suggest.includes("(action: resolve)"), "suggest offered the Player-forbidden resolve action");
    assert(suggest.includes("run_command (action: execute"), "ruleset-free player suggest should offer the parser");
    await kill(p);
  });

  await test("T391/REQ-341: player surroundings resolve an article-prefixed scene location", async () => {
    const p = await boot(); await newNovel(p, "bc9");
    await call(p, "manage_world", { action: "create_room", name: "The Vault", description: "A vault." });
    await call(p, "manage_scene", { action: "set", description: "The vault", location: "Vault" });
    await call(p, "set_badge", { badge: "player" });
    const text = await promptText(p, "badge_briefing");
    assert(text.includes("### Surroundings") && text.includes("The Vault"), "article-prefixed location not resolved: " + text.slice(0, 200));
    await kill(p);
  });

  harnessComplete();
  console.log(`\n${passed} passed, ${failed} failed`);
  rmSync(DATA_DIR, { recursive: true, force: true });
  if (failed > 0) process.exit(1);
}
main().catch((e) => { console.error("FATAL", e); process.exit(2); });
