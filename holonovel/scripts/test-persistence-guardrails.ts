#!/usr/bin/env node
// §5.19 State Persistence Guardrails conformance harness (REQ-400 through
// REQ-407). Exercises T469–T476 (persistence directive, state_ledger token,
// session no-mutation detection, state-drift gate, roll-to-commit coupling,
// auto-moment on transitions, backup regression visibility, persist-tools).

import { spawn, ChildProcess } from "node:child_process";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const SERVER_SCRIPT = join(import.meta.dirname!, "..", "src", "index.ts");
const DATA_DIR = mkdtempSync(join(tmpdir(), "holonovel-persistence-guardrails-"));

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
        const m = JSON.parse(line);
        if (m.id !== undefined && pending.has(m.id)) { pending.get(m.id)!(m); pending.delete(m.id); }
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
  await send(proc, { method: "initialize", params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "persist-guard", version: "1.0.0" } } });
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
  const messages = resp.result?.messages ?? [];
  return messages.map((m: any) => (m?.content?.text ?? "")).join("\n");
}
function kill(proc: ChildProcess): Promise<void> {
  return new Promise((resolve) => {
    if (proc.exitCode !== null || proc.signalCode !== null) { resolve(); return; }
    let done = false;
    const finish = () => { if (!done) { done = true; resolve(); } };
    proc.on("exit", finish);
    proc.on("error", finish);
    try { proc.kill(); } catch { finish(); }
    setTimeout(finish, 5000);
  });
}
function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

async function main() {
  console.log("=== §5.19 State Persistence Guardrails (REQ-400–407) ===\n");
  mkdirSync(DATA_DIR, { recursive: true });

  {
    const proc = await boot();
    await call(proc, "novel", { action: "create",  name: "guardrails" });
    await call(proc, "set_badge", { badge: "game_master" });

    await test("T469/REQ-400: State-Persistence Directive in GM briefing", async () => {
      const b = await briefing(proc);
      assertContains(b, "State persistence");
      assertContains(b, "scene, action: set");
    });

    await test("T470/REQ-401: state_ledger token renders with mutation counts", async () => {
      await call(proc, "note", { action: "set",  key: "ledger-note", content: "v" });
      const b = await briefing(proc);
      assertContains(b, "state_ledger");
      assertContains(b, "note: 1");
    });

    await test("T476/REQ-407: persistence tools listed for GM regardless of scene type", async () => {
      await call(proc, "scene", { action: "set",  description: "combat scene", scene_type: "combat" });
      const b = await briefing(proc);
      assertContains(b, "Persistence tools");
      for (const tool of ["scene (set)", "story (record)", "countdown (set)", "note (set)", "character (personality)", "npc (create)", "vow (set)"]) {
        if (!b.includes(tool)) throw new Error(`missing persist tool ${tool}`);
      }
    });

    await test("T473/REQ-404: uncommitted roll flagged and cleared by commit", async () => {
      await call(proc, "scene", { action: "oracle",  question: "Do they notice?", seed: "z1" });
      const recap = await call(proc, "session", { action: "recap" });
      assertContains(recap, "[uncommitted-roll]");
      await call(proc, "note", { action: "set",  key: "commit-note", content: "v" });
      const recap2 = await call(proc, "session", { action: "recap" });
      assertNotContains(recap2, "[uncommitted-roll]");
    });

    await test("T474/REQ-405: auto-moment recorded on scene transition", async () => {
      await call(proc, "scene", { action: "set",  description: "Transition A" });
      await call(proc, "scene", { action: "set",  description: "Transition B" });
      const exp = JSON.parse(await call(proc, "novel", { action: "export",  format: "json" }));
      const story = exp.novel?.story_journal ?? exp.story_journal ?? [];
      const moments = story.filter((s: any) => s.type === "moment");
      if (moments.length < 1) throw new Error(`no auto-moments, got ${story.length} journal entries`);
    });

    await kill(proc);
  }

  {
    const proc = await boot({ TTRPG_STATE_GATE: "warn" });
    await call(proc, "novel", { action: "create",  name: "gate-novel" });
    await call(proc, "set_badge", { badge: "game_master" });
    await test("T472/REQ-403b: TTRPG_STATE_GATE=warn does not block session tools", async () => {
      const pc = await call(proc, "novel", { action: "save_context",  current_scene: "Gate scene" });
      assertContains(pc, "[OK]");
      const sw = await call(proc, "novel", { action: "switch",  slug: "gate-novel" });
      assertContains(sw, "[OK]");
    });
    await kill(proc);
  }

  {
    const proc = await boot({ TTRPG_STATE_GATE: "block" });
    await call(proc, "novel", { action: "create",  name: "block-novel" });
    await call(proc, "set_badge", { badge: "game_master" });
    await test("T472/REQ-403b: TTRPG_STATE_GATE=block permits clean session close", async () => {
      await call(proc, "novel", { action: "save_context",  current_scene: "Clean" });
      const sw = await call(proc, "novel", { action: "switch",  slug: "block-novel" });
      assertContains(sw, "[OK]");
    });
    await kill(proc);
  }

  {
    const proc = await boot();
    await call(proc, "novel", { action: "create",  name: "mut-novel" });
    await call(proc, "set_badge", { badge: "game_master" });
    await call(proc, "note", { action: "set",  key: "m", content: "v" });
    await call(proc, "vow", { action: "set",  name: "The Quest", description: "d", parties: [], difficulty: "dangerous" });
    await test("T470/REQ-401: mutation counts tracked per group", async () => {
      const b = await briefing(proc);
      assertContains(b, "note: 1");
      assertContains(b, "vow: 1");
    });

    await test("T471/REQ-402: session close with zero mutations surfaces [session-no-mutations]", async () => {
      // Create a fresh novel, make no state writes, then close its session by
      // resuming it again — the zero-mutation window should be recorded.
      await call(proc, "novel", { action: "create",  name: "silent-session" });
      await call(proc, "set_badge", { badge: "game_master" });
      await call(proc, "novel", { action: "switch",  slug: "mut-novel" });
      await call(proc, "novel", { action: "resume",  slug: "silent-session" });
      await call(proc, "set_badge", { badge: "game_master" });
      // Resuming again closes silent-session's first (zero-mutation) window.
      await call(proc, "novel", { action: "switch",  slug: "mut-novel" });
      await call(proc, "novel", { action: "resume",  slug: "silent-session" });
      const recap = await call(proc, "session", { action: "recap" });
      assertContains(recap, "session-no-mutations");
    });

    await test("T475/REQ-406: backup restore surfaces [state-regression]", async () => {
      // Simulate a corrupt save with a backup present: write a novel file, then
      // corrupt the primary and rely on the .bak path. The state_regression
      // marker should surface in spec_health after resume.
      const novelDir = join(DATA_DIR, "novels");
      mkdirSync(novelDir, { recursive: true });
      const file = join(novelDir, "corrupt-novel.json");
      const bak = file + ".bak";
      const good = JSON.stringify({ slug: "corrupt-novel", name: "corrupt-novel", badge: "game_master", entities: {}, npcs: {}, scene_description: "", scene_location: null, scene_time_of_day: null, scene_atmosphere: null, scene_history: [], scene_beat: "", scene_type: ["neutral"], narrative_directive: "", combat: null, countdowns: {}, lore: {}, briefing_assembly_count: 0, player_signals: {}, adventure_slug: null, generated_adventure: null, audit_log: [{ timestamp: new Date().toISOString(), badge: "game_master", tool: "create_novel", args: "{}", output_prefix: "", hash: "aaaaaaaa" }], undo_stacks: {}, redo_stacks: {}, briefing_order: [], action_patterns_enabled: true, session_zero_completed: false, characters_present: false, characters_present_ids: [], adventure_set: false, pending_workflow: null, connection_counter: 0, pending_staleness_counter: 0, pov_mode: "character", autonomy: {}, help_category_overrides: {}, story_journal: [], factions: [], secrets: [], relationships: [], gm_context: {}, constraint_overrides: [], synthesis_activated: {}, synthesis_module_enabled: {}, notes: [], vows: [], checkpoints: [], description: "", genre: "", adventure_index: null, adventure_scene_waypoint: null, world: { rooms: {}, things: {} }, story_beats: [], pacing_counter: 0, pacing_autonomy_fired: false, scene_transition_count: 0, faction_autonomous_ticks: {}, npc_goal_suggestions: [], voice_corrections_this_session: 0, auto_record: true, session_no_mutation_windows: [], state_regression: null, last_mutation_at: null, mutation_counts_by_group: {}, uncommitted_rolls: [], metadata: { created: new Date().toISOString(), modified: new Date().toISOString(), session_count: 0, total_combat_rounds: 0, last_scene_anchor: "" } });
      writeFileSync(bak, good);
      // Primary file has a longer audit log (simulating post-corruption writes)
      // AND a wrong checksum, forcing the backup-restore path.
      const corrupt = JSON.parse(good);
      corrupt.audit_log.push({ timestamp: new Date().toISOString(), badge: "game_master", tool: "set_note", args: "{}", output_prefix: "", hash: "bbbbbbbb" });
      corrupt._checksum = "deadbeef0000000000000000000000000000000000000000000000000000";
      writeFileSync(file, JSON.stringify(corrupt));
      const resp = await call(proc, "novel", { action: "resume",  slug: "corrupt-novel" });
      assertContains(resp, "[OK]");
      const health = JSON.parse(await call(proc, "session", { action: "health" }));
      // state_regression surfaces via the state_ledger token in briefing.
      const b = await briefing(proc);
      assertContains(b, "state-regression");
    });
    await kill(proc);
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  rmSync(DATA_DIR, { recursive: true, force: true });
  if (failed > 0) process.exit(1);
  process.exit(0);
}

main().catch((e) => { console.error("Fatal:", e); process.exit(2); });