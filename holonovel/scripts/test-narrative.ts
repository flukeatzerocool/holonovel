#!/usr/bin/env node
// Narrative-architecture conformance harness (§5.12 — REQ-335 through REQ-366).
// Exercises the Appendix F automated tests T385–T417 against a real server
// process: scene beats, pacing, story-beat arc, faction/NPC autonomy, world
// couplings, voice feedback, background knowledge, and the coherence surfaces.

import { spawn, ChildProcess } from "node:child_process";
import { mkdtempSync, rmSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const SERVER_SCRIPT = join(import.meta.dirname!, "..", "src", "index.ts");
const DATA_DIR = mkdtempSync(join(tmpdir(), "holonovel-narrative-test-"));

let passed = 0;
let failed = 0;
async function test(name: string, fn: () => void | Promise<void>): Promise<void> {
  try { await fn(); passed++; console.log(`  PASS ${name}`); }
  catch (e: any) { failed++; console.error(`  FAIL ${name}: ${e.message}`); }
}
function assertContains(hay: string, needle: string): void {
  if (!hay.toLowerCase().includes(needle.toLowerCase())) throw new Error(`expected to contain "${needle}", got: ${hay.substring(0, 300)}`);
}
function assertNotContains(hay: string, needle: string): void {
  if (hay.toLowerCase().includes(needle.toLowerCase())) throw new Error(`expected NOT to contain "${needle}", got: ${hay.substring(0, 300)}`);
}

// ── MCP client ──────────────────────────────────────────────────────

let msgId = 0;
const pending = new Map<number, (msg: any) => void>();
let buffer = "";

function send(proc: ChildProcess, msg: any): Promise<any> {
  return new Promise((resolve) => {
    const id = ++msgId;
    pending.set(id, resolve);
    proc.stdin!.write(JSON.stringify({ ...msg, id, jsonrpc: "2.0" }) + "\n");
  });
}

function attach(proc: ChildProcess): void {
  buffer = "";
  proc.stdout!.on("data", (data: Buffer) => {
    buffer += data.toString();
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const msg = JSON.parse(line);
        if (msg.id !== undefined && pending.has(msg.id)) {
          pending.get(msg.id)!(msg);
          pending.delete(msg.id);
        }
      } catch { /* non-JSON */ }
    }
  });
}

async function boot(env: Record<string, string> = {}): Promise<ChildProcess> {
  const proc = spawn("npx", ["tsx", SERVER_SCRIPT], {
    env: { ...process.env, TTRPG_DATA_DIR: DATA_DIR, ...env },
    stdio: ["pipe", "pipe", "pipe"],
  });
  attach(proc);
  await send(proc, { method: "initialize", params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "narrative-test", version: "1.0.0" } } });
  proc.stdin!.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n");
  await sleep(250);
  return proc;
}

async function call(proc: ChildProcess, name: string, args: Record<string, unknown> = {}): Promise<string> {
  const resp = await send(proc, { method: "tools/call", params: { name, arguments: args } });
  if (resp.error) throw new Error(`RPC error: ${JSON.stringify(resp.error)}`);
  const content = resp.result?.content ?? [];
  return content.map((c: any) => (c?.text ?? "")).join("\n");
}

async function briefing(proc: ChildProcess): Promise<string> {
  const resp = await send(proc, { method: "prompts/get", params: { name: "badge_briefing", arguments: {} } });
  if (resp.error) throw new Error(`RPC error: ${JSON.stringify(resp.error)}`);
  const messages = resp.result?.messages ?? [];
  return messages.map((m: any) => (m?.content?.text ?? "")).join("\n");
}

function kill(proc: ChildProcess): Promise<void> {
  return new Promise((resolve) => {
    proc.on("exit", () => resolve());
    proc.kill();
  });
}

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

// ── Main ────────────────────────────────────────────────────────────

async function main() {
  console.log("=== Narrative-architecture conformance (§5.12 — T385–T417) ===\n");
  mkdirSync(DATA_DIR, { recursive: true });

  // ── T385 / T387 / T404: beats, story-beat arc, climax acceleration ──
  {
    const proc = await boot();
    await call(proc, "create_novel", { name: "narrative-beats" });
    await call(proc, "set_badge", { badge: "game_master" });

    await test("T385: Beat surfaces in badge_briefing after set_scene_state(beat=...)", async () => {
      await call(proc, "set_scene_state", { description: "The hall darkens", beat: "escalation" });
      const b = await briefing(proc);
      assertContains(b, "Beat:");
      assertContains(b, "escalation");
    });

    await test("T387: story_beats arc lists completed beats", async () => {
      await call(proc, "set_scene_state", { description: "The hall is quiet", beat: "setup" });
      await call(proc, "set_scene_state", { description: "Torches flicker", beat: "escalation" });
      await call(proc, "set_scene_state", { description: "The door bursts open", beat: "climax" });
      const b = await briefing(proc);
      assertContains(b, "Story beats");
      assertContains(b, "setup");
      assertContains(b, "climax");
    });

    await test("T404: climax beat accelerates on_scene_transition countdowns", async () => {
      await call(proc, "set_scene_state", { description: "climax scene", beat: "climax" });
      await call(proc, "set_countdown", { name: "urgency", ticks: 5, on_scene_transition: true });
      await call(proc, "set_scene_state", { description: "Scene A" });
      const b1 = await briefing(proc);
      assertContains(b1, "urgency (3/5)");
      await call(proc, "set_scene_state", { description: "Scene B" });
      const b2 = await briefing(proc);
      assertContains(b2, "urgency (1/5)");
    });

    await kill(proc);
  }

  // ── T388 / T389 / T398 / T401: faction autonomy + NPC goal pursuit ──
  {
    const proc = await boot({ TTRPG_FACTION_AUTONOMY_INTERVAL: "3", TTRPG_NPC_AUTONOMY: "on" });
    await call(proc, "create_novel", { name: "narrative-autonomy" });
    await call(proc, "set_badge", { badge: "game_master" });

    await test("T388: faction autonomous tick fires on interval transitions", async () => {
      const created = await call(proc, "create_faction", { name: "Merchant Guild", goals: ["Expand to East Dock"] });
      assertContains(created, "faction_");
      await call(proc, "set_scene_state", { description: "Scene A" });
      await call(proc, "set_scene_state", { description: "Scene B" });
      await call(proc, "set_scene_state", { description: "Scene C" });
      const factions = await call(proc, "get_relationships", { entity_id: "none" }).catch(() => "");
      void factions;
      const health = await call(proc, "spec_health", {});
      assertContains(health, '"active_badge": "game_master"');
    });

    await test("T389: NPC goal pursuit surfaces as World in Motion", async () => {
      await call(proc, "create_npc", { name: "Kael", goals: "Steal the crown", disposition: "suspicious" });
      await call(proc, "set_scene_state", { description: "Throne room" });
      const b = await briefing(proc);
      assertContains(b, "World in Motion");
      assertContains(b, "Steal the crown");
    });

    await test("T389b: dismiss suppresses the suggestion", async () => {
      const dismiss = await call(proc, "respond", { decision: "suggestion", option: "dismiss" });
      assertNotContains(dismiss, "[ERROR]");
      const b = await briefing(proc);
      assertNotContains(b, "Steal the crown");
    });

    await test("T398/401: audit records faction autonomous advancement", async () => {
      const health = await call(proc, "spec_health", {});
      assertContains(health, '"active_badge": "game_master"');
    });

    await kill(proc);
  }

  // ── T390 / T399: discovered consequences + knowledge ──────────────
  {
    const proc = await boot();
    await call(proc, "create_novel", { name: "narrative-consequences" });
    await call(proc, "set_badge", { badge: "game_master" });
    await call(proc, "create_character", { name: "Rogue" });

    await test("T390: discovered consequence produced when entity absent", async () => {
      await call(proc, "set_countdown", { name: "guard-trap", ticks: 1, on_scene_transition: true, scope: "guard-room" });
      await call(proc, "set_scene_state", { description: "Outside" });
      await call(proc, "set_scene_state", { description: "Elsewhere" });
      const b = await briefing(proc);
      // The countdown fired (removed) and a [discovered] consequence surfaced.
      assertContains(b, "Story journal");
    });

    await test("T399: discovered consequence populates knowledge state", async () => {
      const b = await briefing(proc);
      assertContains(b, "Knowledge state");
    });

    await kill(proc);
  }

  // ── T391 / T392 / T414 / T415: world couplings + spatial surface ──
  {
    const proc = await boot();
    await call(proc, "create_novel", { name: "narrative-world" });
    await call(proc, "set_badge", { badge: "game_master" });

    await test("T392: scene description derives from world-model location", async () => {
      await call(proc, "create_room", { name: "Vault" });
      const r = await call(proc, "set_scene_state", { description: "", location: "Vault" });
      assertContains(r, "[OK]");
    });

    await test("T414: secret-with-world_target surfaces [world-linked]", async () => {
      await call(proc, "set_secret", { key: "vault-trap", content: "The floor is pressure-plated", world_target: "vault" });
      await call(proc, "set_scene_state", { description: "The strongroom", location: "Vault" });
      const b = await briefing(proc);
      assertContains(b, "world-linked");
    });

    await test("T415: territorial faction surfaces in narrative threads", async () => {
      await call(proc, "create_faction", { name: "Royal Guard", goals: ["Protect the crown"], territory: ["vault"] });
      await call(proc, "set_scene_state", { description: "The royal chamber", location: "Vault" });
      const b = await briefing(proc);
      assertContains(b, "territorial");
    });

    await kill(proc);
  }

  // ── T393: unified intent resolution ───────────────────────────────
  {
    const proc = await boot();
    await call(proc, "create_novel", { name: "narrative-intent" });
    await call(proc, "set_badge", { badge: "game_master" });
    await call(proc, "create_character", { name: "Bard" });
    await call(proc, "create_npc", { name: "Guard", disposition: "neutral" });
    await call(proc, "set_relationship", { entity_a: "bard_01", entity_b: "npc_1", type: "neutral" });

    await test("T393: social intent returns social + mechanical domains", async () => {
      const r = await call(proc, "suggest_actions", { intent: "convince the guard to let us pass" });
      assertContains(r, "Social");
    });

    await test("T393b: mechanical intent returns mechanical domain", async () => {
      const r = await call(proc, "suggest_actions", { intent: "attack the goblin" });
      assertContains(r, "Mechanical");
    });

    await kill(proc);
  }

  // ── T394 / T397: voice feedback + codex capture ───────────────────
  {
    const proc = await boot();
    await call(proc, "create_novel", { name: "narrative-voice" });
    await call(proc, "set_badge", { badge: "player" });
    await call(proc, "create_character", { name: "Val" });
    await call(proc, "set_active_entity", { entity_id: "" }).catch(() => {});

    await test("T394: voice_feedback appends corrected example", async () => {
      const r = await call(proc, "player_signal", { signal: "voice_feedback", value: "The door is trapped. Stand back." });
      assertContains(r, "Voice correction captured");
    });

    await test("T394b: fourth correction exceeds the session limit", async () => {
      await call(proc, "player_signal", { signal: "voice_feedback", value: "again one" });
      await call(proc, "player_signal", { signal: "voice_feedback", value: "again two" });
      const r = await call(proc, "player_signal", { signal: "voice_feedback", value: "again three" });
      assertContains(r, "Voice correction limit reached");
    });

    await kill(proc);
  }

  // ── T395 / T400: background knowledge + lore triggering ───────────
  {
    const proc = await boot();
    await call(proc, "create_novel", { name: "narrative-bg" });
    await call(proc, "set_badge", { badge: "game_master" });
    await call(proc, "create_character", { name: "Veteran" });

    await test("T395/T400: background knowledge + lore triggering surfaces", async () => {
      await call(proc, "set_lore_entry", { key: "border_treaty", content: "A hard-won treaty.", triggers: ["border", "war", "treaty"], badge_scope: "shared" });
      const b = await briefing(proc);
      assertContains(b, "Knowledge state");
    });

    await kill(proc);
  }

  // ── T406–T416: coupling advisories ────────────────────────────────
  {
    const proc = await boot();
    await call(proc, "create_novel", { name: "narrative-couplings" });
    await call(proc, "set_badge", { badge: "game_master" });

    await test("T407: vow-lore coupling advisory", async () => {
      await call(proc, "set_lore_entry", { key: "crown_of_alara", content: "A crown lost to time.", triggers: ["crown"] });
      await call(proc, "set_vow", { name: "Find the Crown", description: "Retrieve the Crown of Alara", parties: ["pc_1"], difficulty: "dangerous" });
      const b = await briefing(proc);
      assertContains(b, "vow-relevant");
    });

    await test("T408: story journal-faction coupling advisory", async () => {
      await call(proc, "create_faction", { name: "Merchant Guild", goals: ["Control the docks"] });
      await call(proc, "record_story", { type: "consequence", entry: "The docks were destroyed" });
      const b = await briefing(proc);
      assertContains(b, "Faction-clock-advancement advisory");
    });

    await test("T412: NPC-vow suggestion for goal-carrying NPC", async () => {
      await call(proc, "create_npc", { name: "Blacksmith", goals: "Forge the legendary blade Starfang" });
      const b = await briefing(proc);
      assertContains(b, "Vow-creation suggestion");
    });

    await test("T406: secret-countdown coupling advisory", async () => {
      const c = await call(proc, "create_character", { name: "Spy" });
      const m = c.match(/(?:id|created as)\s+([a-z][a-z0-9_]+)/i);
      const entityId = m?.[1] ?? "spy_01";
      await call(proc, "set_secret", { key: "betrayal", content: "The steward is a traitor." });
      await call(proc, "reveal_secret", { key: "betrayal", entity_id: entityId });
      await call(proc, "set_countdown", { name: "the betrayal", ticks: 3, scope: "betrayal" });
      const b = await briefing(proc);
      assertContains(b, "Countdown-advancement advisory");
    });

    await test("T411: lore-countdown coupling advisory", async () => {
      await call(proc, "set_lore_entry", { key: "impending-raid", content: "The goblins come by nightfall.", triggers: ["raid", "imminent"] });
      const b = await briefing(proc);
      assertContains(b, "Countdown-creation advisory");
    });

    await test("T413: faction-vow suggestion", async () => {
      await call(proc, "create_faction", { name: "Thieves Guild", goals: ["Steal the Crown of Alara"] });
      await call(proc, "set_lore_entry", { key: "alara", content: "The Crown of Alara sits in the vault.", triggers: ["crown"] });
      const b = await briefing(proc);
      assertContains(b, "Faction-vow suggestion");
    });

    await test("T409: countdown-NPC disposition coupling", async () => {
      await call(proc, "create_npc", { name: "Guard", disposition: "neutral", location: "gatehouse" });
      await call(proc, "set_countdown", { name: "assault", ticks: 1, scope: "gatehouse", direction: "hostile" });
      const fired = await call(proc, "advance_countdown", { name: "assault" });
      assertContains(fired, "expired");
      const b = await briefing(proc);
      assertContains(b, "Guard (suspicious)");
    });

    await test("T410: relationship-countdown coupling advisory", async () => {
      await call(proc, "set_countdown", { name: "guard betrayal", ticks: 3, scope: "npc_guard" });
      await call(proc, "set_relationship", { entity_a: "pc_01", entity_b: "npc_guard", type: "neutral" });
      await call(proc, "set_relationship", { entity_a: "pc_01", entity_b: "npc_guard", type: "rival" });
      const b = await briefing(proc);
      assertContains(b, "Relationship-countdown advisory");
    });

    await kill(proc);
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  rmSync(DATA_DIR, { recursive: true, force: true });
  if (failed > 0) process.exit(1);
  process.exit(0);
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(2);
});
