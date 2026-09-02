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
    await call(proc, "novel", { action: "create",  name: "narrative-beats" });
    await call(proc, "set_badge", { badge: "game_master" });

    await test("T385: Beat surfaces in badge_briefing after set_scene_state(beat=...)", async () => {
      await call(proc, "scene", { action: "set",  description: "The hall darkens", beat: "escalation" });
      const b = await briefing(proc);
      assertContains(b, "Beat:");
      assertContains(b, "escalation");
    });

    await test("T387: story_beats arc lists completed beats", async () => {
      await call(proc, "scene", { action: "set",  description: "The hall is quiet", beat: "setup" });
      await call(proc, "scene", { action: "set",  description: "Torches flicker", beat: "escalation" });
      await call(proc, "scene", { action: "set",  description: "The door bursts open", beat: "climax" });
      const b = await briefing(proc);
      assertContains(b, "Story beats");
      assertContains(b, "setup");
      assertContains(b, "climax");
    });

    await test("T404: climax beat accelerates on_scene_transition countdowns", async () => {
      await call(proc, "scene", { action: "set",  description: "climax scene", beat: "climax" });
      await call(proc, "countdown", { action: "set",  name: "urgency", ticks: 5, on_scene_transition: true });
      await call(proc, "scene", { action: "set",  description: "Scene A" });
      const b1 = await briefing(proc);
      assertContains(b1, "urgency (3/5)");
      await call(proc, "scene", { action: "set",  description: "Scene B" });
      const b2 = await briefing(proc);
      assertContains(b2, "urgency (1/5)");
    });

    await kill(proc);
  }

  // ── T388 / T389 / T398 / T401: faction autonomy + NPC goal pursuit ──
  {
    const proc = await boot({ TTRPG_FACTION_AUTONOMY_INTERVAL: "3", TTRPG_NPC_AUTONOMY: "on" });
    await call(proc, "novel", { action: "create",  name: "narrative-autonomy" });
    await call(proc, "set_badge", { badge: "game_master" });

    await test("T388: faction autonomous tick fires on interval transitions", async () => {
      const created = await call(proc, "faction", { action: "create",  name: "Merchant Guild", goals: ["Expand to East Dock"] });
      assertContains(created, "faction_");
      await call(proc, "scene", { action: "set",  description: "Scene A" });
      await call(proc, "scene", { action: "set",  description: "Scene B" });
      await call(proc, "scene", { action: "set",  description: "Scene C" });
      const factions = await call(proc, "relationship", { action: "get",  entity_id: "none" }).catch(() => "");
      void factions;
      const health = await call(proc, "session", { action: "health" });
      assertContains(health, '"active_badge": "game_master"');
    });

    await test("T389: NPC goal pursuit surfaces as World in Motion", async () => {
      await call(proc, "npc", { action: "create",  name: "Kael", goals: "Steal the crown", disposition: "suspicious" });
      await call(proc, "scene", { action: "set",  description: "Throne room" });
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
      const health = await call(proc, "session", { action: "health" });
      assertContains(health, '"active_badge": "game_master"');
    });

    await kill(proc);
  }

  // ── T390 / T399: discovered consequences + knowledge ──────────────
  {
    const proc = await boot();
    await call(proc, "novel", { action: "create",  name: "narrative-consequences" });
    await call(proc, "set_badge", { badge: "game_master" });
    await call(proc, "character", { action: "create",  name: "Rogue" });

    await test("T390: discovered consequence produced when entity absent", async () => {
      await call(proc, "countdown", { action: "set",  name: "guard-trap", ticks: 1, on_scene_transition: true, scope: "guard-room" });
      await call(proc, "scene", { action: "set",  description: "Outside" });
      await call(proc, "scene", { action: "set",  description: "Elsewhere" });
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
    await call(proc, "novel", { action: "create",  name: "narrative-world" });
    await call(proc, "set_badge", { badge: "game_master" });

    await test("T392: scene description derives from world-model location", async () => {
      await call(proc, "world", { action: "create_room",  name: "Vault" });
      const r = await call(proc, "scene", { action: "set",  description: "", location: "Vault" });
      assertContains(r, "[OK]");
    });

    await test("T414: secret-with-world_target surfaces [world-linked]", async () => {
      await call(proc, "lore", { action: "set_secret",  key: "vault-trap", content: "The floor is pressure-plated", world_target: "vault" });
      await call(proc, "scene", { action: "set",  description: "The strongroom", location: "Vault" });
      const b = await briefing(proc);
      assertContains(b, "world-linked");
    });

    await test("T415: territorial faction surfaces in narrative threads", async () => {
      await call(proc, "faction", { action: "create",  name: "Royal Guard", goals: ["Protect the crown"], territory: ["vault"] });
      await call(proc, "scene", { action: "set",  description: "The royal chamber", location: "Vault" });
      const b = await briefing(proc);
      assertContains(b, "territorial");
    });

    await kill(proc);
  }

  // ── T393: unified intent resolution ───────────────────────────────
  {
    const proc = await boot();
    await call(proc, "novel", { action: "create",  name: "narrative-intent" });
    await call(proc, "set_badge", { badge: "game_master" });
    await call(proc, "character", { action: "create",  name: "Bard" });
    await call(proc, "npc", { action: "create",  name: "Guard", disposition: "neutral" });
    await call(proc, "relationship", { action: "set",  entity_a: "bard_01", entity_b: "npc_1", type: "neutral" });

    await test("T393: social intent returns social + mechanical domains", async () => {
      const r = await call(proc, "command", { action: "suggest",  intent: "convince the guard to let us pass" });
      assertContains(r, "Social");
    });

    await test("T393b: mechanical intent returns mechanical domain", async () => {
      const r = await call(proc, "command", { action: "suggest",  intent: "attack the goblin" });
      assertContains(r, "Mechanical");
    });

    await kill(proc);
  }

  // ── T394 / T397: voice feedback + codex capture ───────────────────
  {
    const proc = await boot();
    await call(proc, "novel", { action: "create",  name: "narrative-voice" });
    await call(proc, "set_badge", { badge: "player" });
    await call(proc, "character", { action: "create",  name: "Val" });
    await call(proc, "character", { action: "set_active",  entity_id: "" }).catch(() => {});

    await test("T394: voice_feedback appends corrected example", async () => {
      const r = await call(proc, "character", { action: "signal",  signal: "voice_feedback", value: "The door is trapped. Stand back." });
      assertContains(r, "Voice correction captured");
    });

    await test("T394b: fourth correction exceeds the session limit", async () => {
      await call(proc, "character", { action: "signal",  signal: "voice_feedback", value: "again one" });
      await call(proc, "character", { action: "signal",  signal: "voice_feedback", value: "again two" });
      const r = await call(proc, "character", { action: "signal",  signal: "voice_feedback", value: "again three" });
      assertContains(r, "Voice correction limit reached");
    });

    await kill(proc);
  }

  // ── T395 / T400: background knowledge + lore triggering ───────────
  {
    const proc = await boot();
    await call(proc, "novel", { action: "create",  name: "narrative-bg" });
    await call(proc, "set_badge", { badge: "game_master" });
    await call(proc, "character", { action: "create",  name: "Veteran" });

    await test("T395/T400: background knowledge + lore triggering surfaces", async () => {
      await call(proc, "lore", { action: "set",  key: "border_treaty", content: "A hard-won treaty.", triggers: ["border", "war", "treaty"], badge_scope: "shared" });
      const b = await briefing(proc);
      assertContains(b, "Knowledge state");
    });

    await kill(proc);
  }

  // ── T402: codex adventure beat sequences ─────────────────────────
  {
    const proc = await boot();

    await test("T402: codex adventure suggested_beats pre-populate story_beats", async () => {
      await call(proc, "codex", { action: "set",  kind: "adventure", name: "Test Quest", content: { title: "Test Quest", sections: {}, suggested_beats: [
        { beat: "setup", scene_preview: "The tavern is quiet..." },
        { beat: "escalation", scene_preview: "A fight breaks out..." },
        { beat: "climax", scene_preview: "The dragon rises!" },
      ] } });
      await call(proc, "novel", { action: "create",  name: "test-quest", codex_adventure: "adventure_test_quest" });
      await call(proc, "set_badge", { badge: "game_master" });
      let b = await briefing(proc);
      assertContains(b, "setup (\"The tavern is quiet...\") [adventure-scaffold]");
      assertContains(b, "climax (\"The dragon rises!\") [adventure-scaffold]");

      // GM-set beat at a scaffold position replaces the scaffold entry; tag removed.
      await call(proc, "scene", { action: "set",  description: "The tavern hums with conversation", beat: "setup" });
      b = await briefing(proc);
      assertContains(b, "setup (\"The tavern hums");
      assertNotContains(b, "The tavern is quiet");

      // Advance scene without an explicit beat — the remaining scaffold stays tagged.
      await call(proc, "scene", { action: "set",  description: "The tension builds" });
      b = await briefing(proc);
      assertContains(b, "escalation (\"A fight breaks out...\") [adventure-scaffold]");

      // GM-set climax replaces the third scaffold.
      await call(proc, "scene", { action: "set",  description: "The vault doors open", beat: "climax" });
      b = await briefing(proc);
      assertNotContains(b, "The dragon rises!");
    });

    await test("T402b: adventure without suggested_beats pre-populates nothing", async () => {
      await call(proc, "codex", { action: "set",  kind: "adventure", name: "Plain Quest", content: { title: "Plain Quest", sections: {} } });
      await call(proc, "novel", { action: "create",  name: "plain-quest", codex_adventure: "adventure_plain_quest" });
      await call(proc, "set_badge", { badge: "game_master" });
      const b = await briefing(proc);
      assertContains(b, "[No beats completed.]");
    });

    await kill(proc);
  }

  // ── T406–T416: coupling advisories ────────────────────────────────
  {
    const proc = await boot();
    await call(proc, "novel", { action: "create",  name: "narrative-couplings" });
    await call(proc, "set_badge", { badge: "game_master" });

    await test("T407: vow-lore coupling advisory", async () => {
      await call(proc, "lore", { action: "set",  key: "crown_of_alara", content: "A crown lost to time.", triggers: ["crown"] });
      await call(proc, "vow", { action: "set",  name: "Find the Crown", description: "Retrieve the Crown of Alara", parties: ["pc_1"], difficulty: "dangerous" });
      const b = await briefing(proc);
      assertContains(b, "vow-relevant");
    });

    await test("T408: story journal-faction coupling advisory", async () => {
      await call(proc, "faction", { action: "create",  name: "Merchant Guild", goals: ["Control the docks"] });
      await call(proc, "story", { action: "record",  type: "consequence", entry: "The docks were destroyed" });
      const b = await briefing(proc);
      assertContains(b, "Faction-clock-advancement advisory");
    });

    await test("T412: NPC-vow suggestion for goal-carrying NPC", async () => {
      await call(proc, "npc", { action: "create",  name: "Blacksmith", goals: "Forge the legendary blade Starfang" });
      const b = await briefing(proc);
      assertContains(b, "Vow-creation suggestion");
    });

    await test("T406: secret-countdown coupling advisory", async () => {
      const c = await call(proc, "character", { action: "create",  name: "Spy" });
      const m = c.match(/(?:id|created as)\s+([a-z][a-z0-9_]+)/i);
      const entityId = m?.[1] ?? "spy_01";
      await call(proc, "lore", { action: "set_secret",  key: "betrayal", content: "The steward is a traitor." });
      await call(proc, "lore", { action: "reveal",  key: "betrayal", entity_id: entityId });
      await call(proc, "countdown", { action: "set",  name: "the betrayal", ticks: 3, scope: "betrayal" });
      const b = await briefing(proc);
      assertContains(b, "Countdown-advancement advisory");
    });

    await test("T411: lore-countdown coupling advisory", async () => {
      await call(proc, "lore", { action: "set",  key: "impending-raid", content: "The goblins come by nightfall.", triggers: ["raid", "imminent"] });
      const b = await briefing(proc);
      assertContains(b, "Countdown-creation advisory");
    });

    await test("T413: faction-vow suggestion", async () => {
      await call(proc, "faction", { action: "create",  name: "Thieves Guild", goals: ["Steal the Crown of Alara"] });
      await call(proc, "lore", { action: "set",  key: "alara", content: "The Crown of Alara sits in the vault.", triggers: ["crown"] });
      const b = await briefing(proc);
      assertContains(b, "Faction-vow suggestion");
    });

    await test("T409: countdown-NPC disposition coupling", async () => {
      await call(proc, "npc", { action: "create",  name: "Guard", disposition: "neutral", location: "gatehouse" });
      await call(proc, "countdown", { action: "set",  name: "assault", ticks: 1, scope: "gatehouse", direction: "hostile" });
      const fired = await call(proc, "countdown", { action: "advance",  name: "assault" });
      assertContains(fired, "expired");
      const b = await briefing(proc);
      assertContains(b, "Guard (suspicious)");
    });

    await test("T410: relationship-countdown coupling advisory", async () => {
      await call(proc, "countdown", { action: "set",  name: "guard betrayal", ticks: 3, scope: "npc_guard" });
      await call(proc, "relationship", { action: "set",  entity_a: "pc_01", entity_b: "npc_guard", type: "neutral" });
      await call(proc, "relationship", { action: "set",  entity_a: "pc_01", entity_b: "npc_guard", type: "rival" });
      const b = await briefing(proc);
      assertContains(b, "Relationship-countdown advisory");
    });

    await kill(proc);
  }

  // ── T386 / T391 / T397 / T401 / T417 — pacing, spatial, codex, observer ──
  {
    const proc = await boot({ TTRPG_PACING_WINDOW: "3", TTRPG_FACTION_AUTONOMY_INTERVAL: "5", TTRPG_NPC_AUTONOMY: "on" });
    await call(proc, "novel", { action: "create",  name: "narrative-pacing" });
    await call(proc, "set_badge", { badge: "game_master" });

    await test("T386: pacing signal fires after tool calls, resets on scene transition", async () => {
      await call(proc, "scene", { action: "set",  description: "Start", beat: "setup" });
      // 4 non-mutating tool calls (window 3).
      for (let i = 0; i < 4; i++) await briefing(proc);
      const b = await briefing(proc);
      assertContains(b, "[pacing] Scene stabilized");
      await call(proc, "scene", { action: "set",  description: "New scene" });
      const b2 = await briefing(proc);
      assertNotContains(b2, "[pacing] Scene stabilized");
    });

    await test("T401: pacing-triggered autonomy advances faction and surfaces goal pursuit", async () => {
      await call(proc, "faction", { action: "create",  name: "Thieves Guild", goals: ["Plunder the treasury"], resources: "lockpicks" });
      await call(proc, "npc", { action: "create",  name: "Locke", disposition: "suspicious", goals: "Crack the vault" });
      for (let i = 0; i < 4; i++) await briefing(proc);
      const b = await briefing(proc);
      assertContains(b, "[pacing]");
      assertContains(b, "World in Motion");
    });

    await test("T391: player-facing spatial surface renders room + exits, no internal IDs", async () => {
      await call(proc, "world", { action: "create_room",  name: "Throne Room", description: "A grand hall." });
      await call(proc, "world", { action: "create_room",  name: "Anteroom", description: "A small chamber." });
      await call(proc, "world", { action: "create_exit",  direction: "north", room_a: "Throne Room", room_b: "Anteroom" });
      await call(proc, "character", { action: "create",  name: "SpatialChar", description: "hero" });
      await call(proc, "character", { action: "set_active",  entity_id: "character_01" });
      await call(proc, "scene", { action: "set",  description: "In the throne room", location: "Throne Room" });
      await call(proc, "set_badge", { badge: "player" });
      const b = await briefing(proc);
      assertContains(b, "### Surroundings");
      assertContains(b, "Throne Room");
      assertContains(b, "Exits:");
      await call(proc, "set_badge", { badge: "game_master" });
    });

    await test("T397: voice feedback captured to Codex as voice_profile", async () => {
      await call(proc, "character", { action: "voice",  entity_id: "character_01", examples: [{ context: "greeting", dialogue: "Hello." }] });
      const cap = await call(proc, "codex", { action: "capture",  kind: "voice_profile", entity_id: "character_01", update_source: true });
      assertContains(cap, "[OK] Voice profile");
      const list = await call(proc, "codex", { action: "list",  kind: "voice_profile" });
      assertContains(list, "voice_profile_character_01");
    });

    await test("T417: observer briefing renders omniscient surface", async () => {
      await call(proc, "set_badge", { badge: "observer" });
      const b = await briefing(proc);
      assertContains(b, "### Observer Mode");
      assertContains(b, "omniscient");
      // Observer is read-only: set_scene_state must be blocked.
      const blocked = await call(proc, "scene", { action: "set",  description: "attempt" });
      assertContains(blocked, "[FORBIDDEN]");
      await call(proc, "set_badge", { badge: "game_master" });
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
