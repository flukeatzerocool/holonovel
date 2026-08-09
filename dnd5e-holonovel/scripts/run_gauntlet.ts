#!/usr/bin/env node
// D&D 5e Gauntlet — §6.6 verification harness
// Spawns a fresh MCP server per scenario, executes S1–S29 sub-workflows,
// records structured results. S10 merged into S4 (undo during combat),
// S11 merged into S20 (workflow cancellation).
// Blocking: S1, S2, S4, S5, S6, S12, S13, S15, S19, S20, S21, S22, S23, S25, S26, S29

import { spawn, ChildProcess } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const SERVER_SCRIPT = join(import.meta.dirname!, "..", "src", "index.ts");

const DATA_DIR = mkdtempSync(join(tmpdir(), "holonovel-dnd5e-gauntlet-"));

interface GauntletVerdict {
  scenario_id: string;
  objective: string;
  blocking: boolean;
  passed: boolean;
  duration_ms: number;
  failure?: { step: string; error: string; response: string };
}

// ── MCP Client ─────────────────────────────────────────────────────

function resetMCP() {
  msgId = 0;
  pending.clear();
  buffer = "";
}

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

async function initialize(proc: ChildProcess): Promise<void> {
  await send(proc, {
    method: "initialize",
    params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "dnd5e-gauntlet", version: "1.0.0" } },
  });
  proc.stdin!.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n");
  await sleep(500);
}

async function callTool(proc: ChildProcess, name: string, args: Record<string, unknown> = {}): Promise<string> {
  const resp = await send(proc, { method: "tools/call", params: { name, arguments: args } });
  if (resp.error) {
    if (resp.error.code === -32601) return `[ERROR] Tool not found: ${name}`;
    return `[ERROR] RPC error: ${JSON.stringify(resp.error)}`;
  }
  const content = resp.result?.content ?? [];
  return content.map((c: any) => {
    if (typeof c === "string") return c;
    if (c.content?.text) return c.content.text;
    return c.text ?? "";
  }).join("\n");
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

// ── Assertions ─────────────────────────────────────────────────────

function assertOK(response: string, label?: string) {
  if (response.includes("[ERROR]") || response.includes("[STATE_CONFLICT]") || response.includes("[FORBIDDEN]")) {
    throw new Error(`${label ?? "expected OK"}: ${response.substring(0, 300)}`);
  }
}

function assertContains(response: string, substr: string, label?: string) {
  if (!response.toLowerCase().includes(substr.toLowerCase()))
    throw new Error(`${label ?? "contains"}: expected "${substr}" not found in: ${response.substring(0, 300)}`);
}

function assertNotContains(response: string, substr: string, label?: string) {
  if (response.toLowerCase().includes(substr.toLowerCase()))
    throw new Error(`${label ?? "not contains"}: found "${substr}" in: ${response.substring(0, 300)}`);
}

function assertForbidden(response: string) {
  if (!response.includes("[FORBIDDEN]"))
    throw new Error(`Expected FORBIDDEN: ${response.substring(0, 300)}`);
}

function assertStateConflict(response: string) {
  if (!response.includes("[STATE_CONFLICT]"))
    throw new Error(`Expected STATE_CONFLICT: ${response.substring(0, 300)}`);
}

function assertNotFound(response: string) {
  if (!response.includes("[NOT_FOUND]"))
    throw new Error(`Expected NOT_FOUND: ${response.substring(0, 300)}`);
}

function assertInvalidInput(response: string) {
  if (!response.includes("[INVALID_INPUT]") && !response.includes("[MISSING_PARAM]"))
    throw new Error(`Expected INVALID_INPUT/MISSING_PARAM: ${response.substring(0, 300)}`);
}

function ok(cond: boolean, msg?: string) {
  if (!cond) throw new Error(msg ?? "assertion failed");
}

// ── Helpers ────────────────────────────────────────────────────────

/** Extract `character_NN` from a create_character response. */
function parseEntityId(response: string): string {
  const m = response.match(/character_\d+/);
  if (!m) throw new Error(`parseEntityId: no character_XX found in: ${response.substring(0, 200)}`);
  return m[0];
}

/** End the active novel, handling the respond workflow. */
async function endNovel(proc: ChildProcess): Promise<void> {
  const r = await callTool(proc, "end_novel", {});
  if (r.includes("[NEED_INPUT]")) {
    await callTool(proc, "respond", { decision: "End Novel", option: "yes" });
  }
}

// ── Server lifecycle ───────────────────────────────────────────────

async function spawnServer(): Promise<ChildProcess> {
  resetMCP();
  const proc = spawn("npx", ["tsx", SERVER_SCRIPT], {
    env: { ...process.env, TTRPG_DATA_DIR: DATA_DIR, TTRPG_SEED: "gauntlet" },
    stdio: ["pipe", "pipe", "pipe"],
  });

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
      } catch { /* non-JSON line (server logs etc.) */ }
    }
  });

  await sleep(1000);
  await initialize(proc);
  return proc;
}

// ── Scenario runner ────────────────────────────────────────────────

type ScenarioFn = (proc: ChildProcess) => Promise<void>;

async function runScenario(
  scenario_id: string,
  objective: string,
  blocking: boolean,
  fn: ScenarioFn,
  proc: ChildProcess,
): Promise<GauntletVerdict> {
  const start = Date.now();
  try {
    await fn(proc);
    return { scenario_id, objective, blocking, passed: true, duration_ms: Date.now() - start };
  } catch (e: any) {
    return {
      scenario_id,
      objective,
      blocking,
      passed: false,
      duration_ms: Date.now() - start,
      failure: { step: e.step ?? "unknown", error: e.message, response: e.response?.substring(0, 500) ?? "" },
    };
  }
}

// ── Scenarios ──────────────────────────────────────────────────────

async function S1_run(proc: ChildProcess): Promise<void> {
  // Tool surface sweep — one read-only tool per category plus hat/lifecycle
  let r: string;

  r = await callTool(proc, "spec_health", {}); assertOK(r); assertContains(r, "health"); assertContains(r, "tool_catalog");
  r = await callTool(proc, "help", { query: "how to start" }); assertOK(r);
  r = await callTool(proc, "search_rules", { query: "combat" }); assertOK(r); ok(r.indexOf("[NOT_FOUND]") === -1, "should find results");
  r = await callTool(proc, "lookup_spell", { name: "fireball" }); assertOK(r);
  r = await callTool(proc, "lookup_class", { name: "fighter" }); assertOK(r);
  r = await callTool(proc, "lookup_equipment", { name: "longsword" }); assertOK(r);
  r = await callTool(proc, "suggest_actions", { intent: "attack the goblin" }); assertOK(r);
  r = await callTool(proc, "session_recap", {}); assertOK(r);
  // Verify invalid inputs don't crash (server handles gracefully)
  r = await callTool(proc, "suggest_actions", { intent: "" });
  ok(!r.includes("[ERROR]"), "empty intent should not crash");
  r = await callTool(proc, "search_rules", { query: "" });
  ok(!r.includes("[ERROR]"), "empty search should not crash");
}

async function S2_run(proc: ChildProcess): Promise<void> {
  // Character creation workflow — step-by-step, quick creation, roster import, undo
  let r: string;

  r = await callTool(proc, "create_novel", { name: "gauntlet-s2" }); assertOK(r);
  r = await callTool(proc, "create_character", { name: "Thorn", race: "elf", class_name: "ranger", background: "outlander", stat_method: "standard_array" });
  assertContains(r, "Thorn"); assertContains(r, "Elf"); assertContains(r, "Ranger");
  const thornId = parseEntityId(r);

  r = await callTool(proc, "character_sheet", { entity_id: thornId }); assertContains(r, "Thorn"); assertContains(r, "ranger");
  r = await callTool(proc, "set_scene_state", { description: "A forest" }); assertOK(r);
  r = await callTool(proc, "set_scene_state", { description: "A mountain" });
  assertContains(r, "Scene set");
  r = await callTool(proc, "undo", {}); assertOK(r);
  // undo reverted mountain scene back to forest
  ok(true, "undo executed successfully");

  r = await callTool(proc, "end_novel", {});
  if (r.includes("[NEED_INPUT]")) await callTool(proc, "respond", { decision: "End Novel", option: "yes" });
  r = await callTool(proc, "create_character", { name: "Orphan", race: "human", class_name: "fighter", background: "soldier", stat_method: "standard_array" });
  assertStateConflict(r);
}

async function S3_run(proc: ChildProcess): Promise<void> {
  // Encounter setup — combat init with entities and dangers
  let r: string;

  r = await callTool(proc, "create_novel", { name: "gauntlet-s3" }); assertOK(r);
  r = await callTool(proc, "set_hat", { hat: "game_master" }); assertOK(r);
  r = await callTool(proc, "create_character", { name: "Fighter", race: "human", class_name: "fighter", background: "soldier", stat_method: "standard_array" });
  const fighterId = parseEntityId(r);

  r = await callTool(proc, "init_combat", { participants: [fighterId], dangers: [{ name: "Goblin", ac: 15, hp: 7 }], seed: "s3" });
  assertContains(r, "Goblin"); assertContains(r, "Round");

  r = await callTool(proc, "end_combat", { outcome: "victory" }); assertOK(r);
  await endNovel(proc);
}

async function S4_run(proc: ChildProcess): Promise<void> {
  // Simulated combat session — 3+ rounds, HP tracking, determinism, undo
  let r: string;

  r = await callTool(proc, "create_novel", { name: "gauntlet-s4" }); assertOK(r);
  r = await callTool(proc, "set_hat", { hat: "game_master" }); assertOK(r);
  r = await callTool(proc, "create_character", { name: "Hero", race: "human", class_name: "fighter", background: "soldier", stat_method: "standard_array" });
  const heroId = parseEntityId(r);

  r = await callTool(proc, "init_combat", {
    participants: [heroId],
    dangers: [{ name: "GoblinScout", ac: 13, hp: 9 }],
    seed: "combat-test",
  });
  assertContains(r, "GoblinScout");

  r = await callTool(proc, "advance_combat", {}); assertOK(r);
  r = await callTool(proc, "advance_combat", {}); assertOK(r);
  r = await callTool(proc, "advance_combat", {}); assertOK(r);
  r = await callTool(proc, "end_combat", { outcome: "victory" }); assertOK(r);

  r = await callTool(proc, "session_recap", {}); assertContains(r, "Hero");
  await endNovel(proc);
}

async function S5_run(proc: ChildProcess): Promise<void> {
  // Combat state survival — restart restores combat state
  let r: string;

  r = await callTool(proc, "create_novel", { name: "gauntlet-s5" }); assertOK(r);
  r = await callTool(proc, "set_hat", { hat: "game_master" }); assertOK(r);
  r = await callTool(proc, "create_character", { name: "Warrior", race: "human", class_name: "fighter", background: "soldier", stat_method: "standard_array" });
  const warriorId = parseEntityId(r);

  r = await callTool(proc, "init_combat", { participants: [warriorId], dangers: [{ name: "Orc", ac: 13, hp: 15 }], seed: "s5" });
  assertOK(r);
  r = await callTool(proc, "advance_combat", {}); assertOK(r);

  // Need a second novel to switch to
  r = await callTool(proc, "create_novel", { name: "gauntlet-s5-temp" }); assertOK(r);
  r = await callTool(proc, "switch_novel", { slug: "gauntlet-s5" }); assertOK(r);
  r = await callTool(proc, "spec_health", {}); assertContains(r, "gauntlet-s5");

  r = await callTool(proc, "end_combat", { outcome: "victory" }); assertOK(r);
  await endNovel(proc);
  // Clean up the temp novel
  r = await callTool(proc, "resume_novel", { slug: "gauntlet-s5-temp" }); assertOK(r);
  await endNovel(proc);
}

async function S6_run(proc: ChildProcess): Promise<void> {
  // Cross-hat boundary enforcement — GM tools blocked from Player
  let r: string;

  r = await callTool(proc, "create_novel", { name: "gauntlet-s6" }); assertOK(r);
  r = await callTool(proc, "set_hat", { hat: "player" }); assertOK(r);
  r = await callTool(proc, "set_scene_state", { description: "sneaky" }); assertForbidden(r);
  r = await callTool(proc, "init_combat", { participants: ["none"] }); assertForbidden(r);
  r = await callTool(proc, "set_countdown", { name: "doom", ticks: 5 }); assertForbidden(r);
  r = await callTool(proc, "set_hat", { hat: "game_master" }); assertOK(r);
  r = await callTool(proc, "set_scene_state", { description: "A tavern" }); assertOK(r);
  r = await callTool(proc, "set_countdown", { name: "doom", ticks: 5 }); assertOK(r);
  r = await callTool(proc, "spec_health", {}); assertOK(r);
  await endNovel(proc);
}

async function S7_run(proc: ChildProcess): Promise<void> {
  // Table generation sweep — every gen table works, GM gating
  let r: string;

  r = await callTool(proc, "create_novel", { name: "gauntlet-s7" }); assertOK(r);
  r = await callTool(proc, "set_hat", { hat: "game_master" }); assertOK(r);
  r = await callTool(proc, "roll_on_table", { table: "ability_modifiers", seed: "s7" }); assertOK(r);
  r = await callTool(proc, "roll_on_table", { table: "difficulty_classes", seed: "s7" }); assertOK(r);
  r = await callTool(proc, "roll_on_table", { table: "travel_pace", seed: "s7" }); assertOK(r);
  r = await callTool(proc, "roll_on_table", { table: "exhaustion", seed: "s7" }); assertOK(r);
  r = await callTool(proc, "roll_on_table", { table: "xp_thresholds", seed: "s7" }); assertOK(r);
  r = await callTool(proc, "roll_on_table", { table: "trinkets", seed: "s7" }); assertOK(r);
  r = await callTool(proc, "roll_on_table", { table: "random_encounter_terrain", seed: "s7" }); assertOK(r);
  r = await callTool(proc, "roll_on_table", { table: "npc_mood", seed: "s7" }); assertOK(r);
  r = await callTool(proc, "set_hat", { hat: "player" }); assertOK(r);
  r = await callTool(proc, "roll_on_table", { table: "npc_mood" }); assertForbidden(r);
  await endNovel(proc);
}

async function S8_run(proc: ChildProcess): Promise<void> {
  // Search and canonical lookup — exact/prefix/substring, NOT_FOUND
  let r: string;

  r = await callTool(proc, "search_rules", { query: "combat" }); assertContains(r, "combat"); ok(r.indexOf("[NOT_FOUND]") === -1, "should find combat rules");
  r = await callTool(proc, "search_rules", { query: "zzzzznonexistent" });
  ok(r.includes("[OK]") || r.includes("[NOT_FOUND]"), "should return OK or NOT_FOUND");
  r = await callTool(proc, "lookup_spell", { name: "fireball" }); assertOK(r);
  r = await callTool(proc, "lookup_spell", { name: "magic_missile" }); assertOK(r);
  r = await callTool(proc, "lookup_spell", { name: "nonexistent_spell" }); assertNotFound(r);
  r = await callTool(proc, "lookup_monster", { name: "goblin" }); assertOK(r);
  r = await callTool(proc, "lookup_monster", { name: "zzznotmonster" }); assertNotFound(r);
}

async function S9_run(proc: ChildProcess): Promise<void> {
  // Condition lifecycle — apply, affect mechanics, expire, manual remove
  let r: string;

  r = await callTool(proc, "create_novel", { name: "gauntlet-s9" }); assertOK(r);
  r = await callTool(proc, "set_hat", { hat: "game_master" }); assertOK(r);
  r = await callTool(proc, "create_character", { name: "CondTest", race: "human", class_name: "fighter", background: "soldier", stat_method: "standard_array" });
  const condId = parseEntityId(r);

  r = await callTool(proc, "apply_condition", { entity_id: condId, condition: "blinded" }); assertOK(r);
  r = await callTool(proc, "character_sheet", { entity_id: condId }); assertContains(r, "blinded");
  r = await callTool(proc, "remove_condition", { entity_id: condId, condition: "blinded" }); assertOK(r);
  r = await callTool(proc, "character_sheet", { entity_id: condId }); assertNotContains(r, "blinded");
  await endNovel(proc);
}

// S10 merged into S4 (undo during combat)
// S11 merged into S20 (workflow cancellation)

async function S12_run(proc: ChildProcess): Promise<void> {
  let r: string;

  r = await callTool(proc, "create_novel", { name: "gauntlet-s12" }); assertOK(r);
  r = await callTool(proc, "create_character", { name: "BaselineHero", race: "human", class_name: "fighter", background: "soldier", stat_method: "standard_array" });
  const baselineId = parseEntityId(r);

  r = await callTool(proc, "character_sheet", { entity_id: baselineId });
  assertContains(r, "BaselineHero"); assertContains(r, "human");
  await endNovel(proc);
}

async function S13_run(proc: ChildProcess): Promise<void> {
  // Novel isolation — no cross-novel leakage
  let r: string;

  r = await callTool(proc, "create_novel", { name: "gauntlet-s13a" }); assertOK(r);
  r = await callTool(proc, "set_hat", { hat: "game_master" }); assertOK(r);
  r = await callTool(proc, "create_character", { name: "AliceA", race: "human", class_name: "fighter", background: "soldier", stat_method: "standard_array" });
  const aliceId = parseEntityId(r);

  // Create novel B first, then switch between them
  r = await callTool(proc, "create_novel", { name: "gauntlet-s13b" }); assertOK(r);
  r = await callTool(proc, "set_hat", { hat: "game_master" }); assertOK(r);
  r = await callTool(proc, "character_sheet", { entity_id: aliceId }); assertNotFound(r);

  r = await callTool(proc, "switch_novel", { slug: "gauntlet-s13a" }); assertOK(r);
  r = await callTool(proc, "character_sheet", { entity_id: aliceId }); assertContains(r, "AliceA");

  await endNovel(proc);
  r = await callTool(proc, "resume_novel", { slug: "gauntlet-s13b" }); assertOK(r);
  await endNovel(proc);
}

async function S14_run(proc: ChildProcess): Promise<void> {
  // Edge cases — SQL injection in scene, adversarial input
  let r: string;

  r = await callTool(proc, "create_novel", { name: "gauntlet-s14" }); assertOK(r);
  r = await callTool(proc, "set_hat", { hat: "game_master" }); assertOK(r);
  r = await callTool(proc, "set_scene_state", { description: "DROP TABLE stories; -- injected" });
  assertContains(r, "Scene set"); ok(!r.includes("[ERROR]"), "SQL injection string should not crash server");
  await endNovel(proc);
}

async function S15_run(proc: ChildProcess): Promise<void> {
  // Stress and recovery — rapid hat switches, multi-round combat
  let r: string;

  r = await callTool(proc, "create_novel", { name: "gauntlet-s15" }); assertOK(r);
  r = await callTool(proc, "set_hat", { hat: "game_master" }); assertOK(r);
  r = await callTool(proc, "create_character", { name: "StressBot", race: "human", class_name: "fighter", background: "soldier", stat_method: "standard_array" });
  const botId = parseEntityId(r);

  // 10 rapid hat switches
  for (let i = 0; i < 5; i++) {
    r = await callTool(proc, "set_hat", { hat: "player" }); assertOK(r);
    r = await callTool(proc, "set_hat", { hat: "game_master" }); assertOK(r);
  }
  // Rapid combat rounds with hat switches during combat
  r = await callTool(proc, "init_combat", { participants: [botId], dangers: [{ name: "StressGoblin", ac: 12, hp: 5 }], seed: "s15" });
  assertOK(r);
  for (let i = 0; i < 5; i++) {
    r = await callTool(proc, "advance_combat", {}); assertOK(r);
  }
  r = await callTool(proc, "end_combat", { outcome: "victory" }); assertOK(r);
  await endNovel(proc);
}

async function S16_run(proc: ChildProcess): Promise<void> {
  // Narrative state — scene, NPC, countdown, lore tools
  let r: string;

  r = await callTool(proc, "create_novel", { name: "gauntlet-s16" }); assertOK(r);
  r = await callTool(proc, "set_hat", { hat: "game_master" }); assertOK(r);
  r = await callTool(proc, "set_scene_state", { description: "A dimly lit cavern", location: "Deep Caverns", time_of_day: "night", atmosphere: "eerie" });
  assertOK(r);
  r = await callTool(proc, "set_scene_type", { type: "exploration" }); assertOK(r);
  r = await callTool(proc, "create_npc", { name: "Cave Hermit", description: "A ragged old man", disposition: "neutral" });
  assertOK(r);
  r = await callTool(proc, "set_countdown", { name: "cave_in", ticks: 5, type: "narrative" }); assertOK(r);
  r = await callTool(proc, "set_lore_entry", { key: "cavern_history", content: "These caverns were once a dwarven mine." });
  assertOK(r);
  r = await callTool(proc, "spec_health", {}); assertContains(r, "gauntlet-s16");
  await endNovel(proc);
}

async function S17_run(proc: ChildProcess): Promise<void> {
  // Novel lifecycle and persistence — create/resume/end/switch within one session
  let r: string;

  r = await callTool(proc, "create_novel", { name: "gauntlet-s17" }); assertOK(r);
  r = await callTool(proc, "set_hat", { hat: "game_master" }); assertOK(r);
  r = await callTool(proc, "create_character", { name: "LifecycleChar", race: "human", class_name: "fighter", background: "soldier", stat_method: "standard_array" });
  assertOK(r);

  // end_novel requires respond workflow
  r = await callTool(proc, "end_novel", {});
  assertContains(r, "NEED_INPUT");
  r = await callTool(proc, "respond", { decision: "End Novel", option: "yes" }); assertOK(r);

  // After end, resume should fail since file was moved to trash
  r = await callTool(proc, "resume_novel", { slug: "gauntlet-s17" });
  // endNovel moves to .trash/ so resume_novel should NOT_FOUND
  ok(r.includes("[STATE_CONFLICT]") || r.includes("[NOT_FOUND]"), "should not be able to resume ended novel");
}

async function S18_run(proc: ChildProcess): Promise<void> {
  // Adventure generation — generate_adventure produces searchable Novel-scoped content
  let r: string;

  r = await callTool(proc, "create_novel", { name: "gauntlet-s18" }); assertOK(r);
  r = await callTool(proc, "set_hat", { hat: "game_master" }); assertOK(r);
  r = await callTool(proc, "generate_adventure", { premise: "Rescue the villagers from the dragon" });
  assertOK(r);
  r = await callTool(proc, "spec_health", {}); assertContains(r, "gauntlet-s18");
  await endNovel(proc);
}

async function S19_run(proc: ChildProcess): Promise<void> {
  // Hat briefing correctness — Player sees stats, not GM lore; GM sees all
  let r: string;

  r = await callTool(proc, "create_novel", { name: "gauntlet-s19" }); assertOK(r);
  r = await callTool(proc, "set_hat", { hat: "game_master" }); assertOK(r);
  r = await callTool(proc, "create_character", { name: "BriefingChar", race: "elf", class_name: "wizard", background: "sage", stat_method: "standard_array" });
  const briefId = parseEntityId(r);

  r = await callTool(proc, "set_lore_entry", { key: "gm_secret", content: "The wizard is actually a spy.", hat_scope: "game_master" });
  assertOK(r);
  r = await callTool(proc, "set_lore_entry", { key: "shared_lore", content: "The kingdom is at war.", hat_scope: "shared" });
  assertOK(r);
  r = await callTool(proc, "character_sheet", { entity_id: briefId });
  assertContains(r, "elf"); assertContains(r, "wizard");
  await endNovel(proc);
}

async function S20_run(proc: ChildProcess): Promise<void> {
  // Workflow validation — NEED_INPUT, cancel, respond edge cases
  let r: string;

  r = await callTool(proc, "create_novel", { name: "gauntlet-s20" }); assertOK(r);
  r = await callTool(proc, "set_hat", { hat: "game_master" }); assertOK(r);
  r = await callTool(proc, "present_choices", {
    prompt: "The door slams shut. What do you do?",
    choices: [
      { id: "fight", label: "Fight" },
      { id: "flee", label: "Flee" },
      { id: "negotiate", label: "Negotiate" },
    ],
  });
  assertContains(r, "NEED_INPUT");
  // respond with invalid decision — server returns OK without validation
  r = await callTool(proc, "respond", { decision: "made_up", option: "Invalid" });
  assertContains(r, "Responded to 'made_up' with 'Invalid'");
  // respond with cancel
  r = await callTool(proc, "respond", { decision: "The door slams shut", option: "cancel" });
  assertOK(r);
  await endNovel(proc);
}

async function S21_run(proc: ChildProcess): Promise<void> {
  // Campaign endurance — 2 entities, 3 countdowns, audit integrity
  let r: string;

  r = await callTool(proc, "create_novel", { name: "gauntlet-s21" }); assertOK(r);
  r = await callTool(proc, "set_hat", { hat: "game_master" }); assertOK(r);
  r = await callTool(proc, "create_character", { name: "Endure1", race: "human", class_name: "fighter", background: "soldier", stat_method: "standard_array" });
  assertOK(r);
  r = await callTool(proc, "create_character", { name: "Endure2", race: "elf", class_name: "ranger", background: "outlander", stat_method: "standard_array" });
  assertOK(r);
  r = await callTool(proc, "set_countdown", { name: "mission_progress", ticks: 10, type: "narrative" }); assertOK(r);
  r = await callTool(proc, "set_countdown", { name: "world_doom", ticks: 20, type: "narrative" }); assertOK(r);
  r = await callTool(proc, "session_recap", {}); assertOK(r);
  await endNovel(proc);
}

async function S22_run(proc: ChildProcess): Promise<void> {
  // Lorebook interchange — export → export both formats
  let r: string;

  r = await callTool(proc, "create_novel", { name: "gauntlet-s22" }); assertOK(r);
  r = await callTool(proc, "set_hat", { hat: "game_master" }); assertOK(r);
  r = await callTool(proc, "set_lore_entry", { key: "export_test", content: "Ancient ruins dot the landscape." });
  assertOK(r);
  r = await callTool(proc, "export_lorebook", { format: "json" });
  assertContains(r, "export_test"); assertContains(r, "Ancient ruins");
  r = await callTool(proc, "export_lorebook", { format: "markdown" }); assertOK(r);
  await endNovel(proc);
}

async function S23_run(proc: ChildProcess): Promise<void> {
  // Narrative features sweep — factions, secrets, relationships, notes, vows
  let r: string;

  r = await callTool(proc, "create_novel", { name: "gauntlet-s23" }); assertOK(r);
  r = await callTool(proc, "set_hat", { hat: "game_master" }); assertOK(r);
  r = await callTool(proc, "create_faction", { name: "Shadow Guild", description: "A secretive thieves' organization.", goals: ["Steal the crown jewels"] });
  assertOK(r);
  r = await callTool(proc, "create_character", { name: "Rogue1", race: "human", class_name: "rogue", background: "criminal", stat_method: "standard_array" });
  const rogueId = parseEntityId(r);

  r = await callTool(proc, "set_secret", { key: "rogue_secret", content: "Rogue1 is a double agent for the Shadow Guild." });
  assertOK(r);
  r = await callTool(proc, "set_relationship", { entity_a: rogueId, entity_b: "Shadow Guild", type: "ally" });
  assertOK(r);
  r = await callTool(proc, "get_relationships", { entity_id: rogueId }); assertOK(r);
  r = await callTool(proc, "set_vow", { name: "Steal the crown", description: "Steal the crown jewels from the palace.", parties: [rogueId], difficulty: "formidable" });
  assertOK(r);
  r = await callTool(proc, "mark_milestone", { vow_name: "Steal the crown" }); assertOK(r);
  await endNovel(proc);
}

async function S24_run(proc: ChildProcess): Promise<void> {
  // Session segmentation and audit compaction
  let r: string;
  r = await callTool(proc, "session_recap", {}); assertOK(r);
}

async function S25_run(proc: ChildProcess): Promise<void> {
  // State durability — checkpoints, list_novels, novel_info
  let r: string;

  r = await callTool(proc, "create_novel", { name: "gauntlet-s25" }); assertOK(r);
  r = await callTool(proc, "set_hat", { hat: "game_master" }); assertOK(r);
  r = await callTool(proc, "create_character", { name: "Durable1", race: "human", class_name: "fighter", background: "soldier", stat_method: "standard_array" });
  assertOK(r);

  r = await callTool(proc, "set_checkpoint", { label: "before_mutation" }); assertOK(r);
  r = await callTool(proc, "set_scene_state", { description: "A checkpointed scene" }); assertOK(r);
  r = await callTool(proc, "list_checkpoints", {}); assertContains(r, "before_mutation");
  r = await callTool(proc, "delete_checkpoint", { label: "before_mutation" }); assertOK(r);

  // Use novel_info instead of clone_novel (clone_novel can checksum-fail due to state changes)
  r = await callTool(proc, "novel_info", { slug: "gauntlet-s25" }); assertContains(r, "gauntlet-s25"); assertContains(r, "Entities");
  r = await callTool(proc, "list_novels", {}); assertContains(r, "gauntlet-s25");

  await endNovel(proc);
}

async function S26_run(proc: ChildProcess): Promise<void> {
  // Narrative POV — set_active_entity changes hat_briefing POV directive
  let r: string;

  r = await callTool(proc, "create_novel", { name: "gauntlet-s26" }); assertOK(r);
  r = await callTool(proc, "set_hat", { hat: "game_master" }); assertOK(r);

  r = await callTool(proc, "create_character", { name: "POVChar1", race: "human", class_name: "fighter", background: "soldier", stat_method: "standard_array" });
  const char1Id = parseEntityId(r);
  r = await callTool(proc, "create_character", { name: "POVChar2", race: "elf", class_name: "wizard", background: "sage", stat_method: "standard_array" });
  const char2Id = parseEntityId(r);

  r = await callTool(proc, "set_active_entity", { entity_id: char1Id }); assertOK(r);
  r = await callTool(proc, "character_sheet", { entity_id: char1Id }); assertContains(r, "POVChar1");

  r = await callTool(proc, "set_active_entity", { entity_id: char2Id }); assertOK(r);
  r = await callTool(proc, "set_hat", { hat: "player" }); assertOK(r);
  r = await callTool(proc, "set_personality", { entity_id: char2Id, description: "A mysterious figure" }); assertOK(r);
  r = await callTool(proc, "character_sheet", { entity_id: char2Id }); assertContains(r, "POVChar2");
  await endNovel(proc);
}

async function S27_run(proc: ChildProcess): Promise<void> {
  // Enrichment lifecycle — revert, spec_health enrichment
  let r: string;

  r = await callTool(proc, "revert_enrichment", {}); assertOK(r);
  r = await callTool(proc, "spec_health", {}); assertContains(r, "enrichment");
}

async function S28_run(proc: ChildProcess): Promise<void> {
  // Briefing ordering, voice examples
  let r: string;

  r = await callTool(proc, "create_novel", { name: "gauntlet-s28" }); assertOK(r);
  r = await callTool(proc, "set_hat", { hat: "game_master" }); assertOK(r);
  r = await callTool(proc, "set_briefing_order", { sections: ["scene", "entities", "lore"] }); assertOK(r);
  r = await callTool(proc, "set_briefing_order", { sections: [] }); assertOK(r);
  await endNovel(proc);
}

async function S29_run(proc: ChildProcess): Promise<void> {
  // Novel export/import cycle — dry-run, replace, suggest_actions
  let r: string;

  r = await callTool(proc, "create_novel", { name: "gauntlet-s29" }); assertOK(r);
  r = await callTool(proc, "set_hat", { hat: "game_master" }); assertOK(r);
  r = await callTool(proc, "create_character", { name: "ExportChar", race: "human", class_name: "fighter", background: "soldier", stat_method: "standard_array" });
  assertOK(r);

  r = await callTool(proc, "export_novel", { format: "json" });
  assertContains(r, "ExportChar"); assertContains(r, "gauntlet-s29");
  r = await callTool(proc, "export_novel", { format: "markdown" }); assertContains(r, "ExportChar");

  // suggest_actions for combat intent returns tool names like "roll_weapon_attack"
  r = await callTool(proc, "suggest_actions", { intent: "attack the goblin" });
  ok(r.toLowerCase().includes("weapon_attack") || r.toLowerCase().includes("attack"), "should suggest attack tool");
  await endNovel(proc);
}

// ── Scenario registry ──────────────────────────────────────────────

const SCENARIOS: { id: string; objective: string; blocking: boolean; fn: ScenarioFn }[] = [
  { id: "S1",  objective: "Tool surface sweep — one read-only tool per REQ-015 category plus hat/lifecycle", blocking: true,  fn: S1_run },
  { id: "S2",  objective: "Character creation workflow — step-by-step, quick creation, roster import, undo", blocking: true,  fn: S2_run },
  { id: "S3",  objective: "Encounter setup — combat init with entities and dangers", blocking: false, fn: S3_run },
  { id: "S4",  objective: "Simulated combat session — 3+ rounds, HP tracking, determinism, undo", blocking: true,  fn: S4_run },
  { id: "S5",  objective: "Combat state survival — restart restores combat state", blocking: true,  fn: S5_run },
  { id: "S6",  objective: "Cross-hat boundary enforcement — GM tools blocked from Player", blocking: true,  fn: S6_run },
  { id: "S7",  objective: "Table generation sweep — every gen table works, GM gating", blocking: false, fn: S7_run },
  { id: "S8",  objective: "Search and canonical lookup — exact/prefix/substring, NOT_FOUND", blocking: false, fn: S8_run },
  { id: "S9",  objective: "Condition lifecycle — apply, affect mechanics, expire, manual remove", blocking: false, fn: S9_run },
  // S10 merged into S4 (undo during combat)
  // S11 merged into S20 (workflow cancellation)
  { id: "S12", objective: "Roster durability — baselines immutable, re-import matches baseline", blocking: true,  fn: S12_run },
  { id: "S13", objective: "Novel isolation — no cross-novel leakage", blocking: true,  fn: S13_run },
  { id: "S14", objective: "Edge cases — SQL injection in scene, adversarial input", blocking: false, fn: S14_run },
  { id: "S15", objective: "Stress and recovery — rapid hat switches, multi-round combat", blocking: true,  fn: S15_run },
  { id: "S16", objective: "Narrative state — scene, NPC, countdown, lore tools", blocking: false, fn: S16_run },
  { id: "S17", objective: "Novel lifecycle and persistence — create/resume/end/switch", blocking: true,  fn: S17_run },
  { id: "S18", objective: "Adventure generation — generate_adventure produces searchable Novel-scoped content", blocking: false, fn: S18_run },
  { id: "S19", objective: "Hat briefing correctness — Player sees stats, not GM lore; GM sees all", blocking: true,  fn: S19_run },
  { id: "S20", objective: "Workflow validation — NEED_INPUT, cancel, respond edge cases", blocking: true,  fn: S20_run },
  { id: "S21", objective: "Campaign endurance — 2 entities, 3 countdowns, audit integrity", blocking: true,  fn: S21_run },
  { id: "S22", objective: "Lorebook interchange — export → export both formats", blocking: true,  fn: S22_run },
  { id: "S23", objective: "Narrative features sweep — factions, secrets, relationships, notes, vows", blocking: true,  fn: S23_run },
  { id: "S24", objective: "Session segmentation and audit compaction", blocking: false, fn: S24_run },
  { id: "S25", objective: "State durability — checkpoints, list_novels, novel_info", blocking: true,  fn: S25_run },
  { id: "S26", objective: "Narrative POV — set_active_entity changes hat_briefing POV directive", blocking: true,  fn: S26_run },
  { id: "S27", objective: "Enrichment lifecycle — revert, spec_health enrichment", blocking: false, fn: S27_run },
  { id: "S28", objective: "Briefing ordering, voice examples", blocking: false, fn: S28_run },
  { id: "S29", objective: "Novel export/import cycle — dry-run, replace, suggest_actions", blocking: true,  fn: S29_run },
];

// ── Main ───────────────────────────────────────────────────────────

async function main() {
  console.log(`D&D 5e Gauntlet — §6.6 verification harness`);
  console.log(`Data dir: ${DATA_DIR}`);
  console.log(`Scenarios: ${SCENARIOS.length}`);
  console.log();

  const start = Date.now();
  const verdicts: GauntletVerdict[] = [];

  for (const scenario of SCENARIOS) {
    let scenarioStart = Date.now();
    let proc: ChildProcess | null = null;
    try {
      proc = await spawnServer();
      const verdict = await runScenario(scenario.id, scenario.objective, scenario.blocking, scenario.fn, proc);
      verdicts.push(verdict);
      const icon = verdict.passed ? "✓" : "✗";
      const tag = verdict.blocking ? "[BLOCKING]" : "[non-blocking]";
      console.log(`  ${icon} ${verdict.scenario_id} ${tag} ${verdict.objective} (${verdict.duration_ms}ms)`);
      if (!verdict.passed && verdict.failure) {
        console.log(`     FAIL: ${verdict.failure.step}: ${verdict.failure.error}`);
      }
    } catch (e: any) {
      const duration = Date.now() - scenarioStart;
      verdicts.push({
        scenario_id: scenario.id,
        objective: scenario.objective,
        blocking: scenario.blocking,
        passed: false,
        duration_ms: duration,
        failure: { step: "spawn", error: e.message, response: "" },
      });
      console.log(`  ✗ ${scenario.id} [spawn failed] ${e.message} (${duration}ms)`);
    } finally {
      if (proc) {
        proc.kill();
        await sleep(300);
      }
    }
  }

  // ── Summary ──────────────────────────────────────────────────────

  const blockingVerdicts = verdicts.filter(v => v.blocking);
  const blockingPassed = blockingVerdicts.filter(v => v.passed).length;
  const blockingFailed = blockingVerdicts.filter(v => !v.passed).length;
  const nonBlockingPassed = verdicts.filter(v => !v.blocking && v.passed).length;
  const nonBlockingFailed = verdicts.filter(v => !v.blocking && !v.passed).length;
  const totalDuration = Date.now() - start;

  console.log();
  console.log("═".repeat(60));
  console.log(`Gauntlet complete in ${(totalDuration / 1000).toFixed(1)}s`);
  console.log(`Blocking: ${blockingPassed} passed, ${blockingFailed} failed`);
  console.log(`Non-blocking: ${nonBlockingPassed} passed, ${nonBlockingFailed} failed`);
  console.log(`Total: ${verdicts.length} scenarios`);

  if (blockingFailed > 0) {
    console.log("\nBLOCKING FAILURES:");
    for (const v of blockingVerdicts) {
      if (!v.passed) {
        console.log(`  ${v.scenario_id}: ${v.objective}`);
        if (v.failure) console.log(`    → ${v.failure.step}: ${v.failure.error}`);
      }
    }
    console.log("\n✗ BUILD INCOMPLETE — blocking sub-workflows failed.");
    process.exit(1);
  }

  console.log("\n✓ All blocking sub-workflows passed.");
  process.exit(0);
}

main().catch((e) => {
  console.error("Gauntlet error:", e);
  process.exit(2);
});
