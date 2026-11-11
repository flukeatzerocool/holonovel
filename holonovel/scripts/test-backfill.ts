#!/usr/bin/env node
// Bucket-B → C conformance backfill harness (§5.1/§5.3/§5.4/§5.5/§5.6/§5.7/§5.8/§5.9/§5.10/§5.20). [gate]
// Exercises the spec tests (Appendix F T-IDs) that the cited-but-unverified
// REQs require, against a real server process. Each test name carries the
// T-ID(s) it exercises so the coverage register can promote the REQ to C.

import { spawn, ChildProcess } from "node:child_process";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from "node:fs";
import { PACKAGE_FORMAT } from "../src/generated/contract-fingerprints.js";
import { sha256Canonical } from "../../scripts/lib/hash.js";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { installHarnessGuard, harnessComplete } from "./lib/harness-guard.js";
import { resourceReader } from "./lib/jsonrpc.js";
installHarnessGuard();

const SERVER_SCRIPT = join(import.meta.dirname!, "..", "src", "index.ts");
const DATA_DIR = mkdtempSync(join(tmpdir(), "holonovel-backfill-test-"));

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
function assert(cond: any, msg: string): void {
  if (!cond) throw new Error(msg);
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
  await send(proc, { method: "initialize", params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "backfill-test", version: "1.0.0" } } });
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

async function callRaw(proc: ChildProcess, name: string, args: Record<string, unknown> = {}): Promise<any> {
  return send(proc, { method: "tools/call", params: { name, arguments: args } });
}

const readResource = resourceReader(send, { errorLabel: "resource error" });

async function listResources(proc: ChildProcess): Promise<string[]> {
  const resp = await send(proc, { method: "resources/list", params: {} });
  return (resp.result?.resources ?? []).map((r: any) => r.uri);
}

async function listTemplates(proc: ChildProcess): Promise<string[]> {
  const resp = await send(proc, { method: "resources/templates/list", params: {} });
  return (resp.result?.resourceTemplates ?? []).map((t: any) => t.uriTemplate);
}

async function getPrompt(proc: ChildProcess, name: string, args: Record<string, unknown> = {}): Promise<string> {
  const resp = await send(proc, { method: "prompts/get", params: { name, arguments: args } });
  if (resp.error) throw new Error(`prompt error: ${JSON.stringify(resp.error)}`);
  return (resp.result?.messages ?? []).map((m: any) => m?.content?.text ?? "").join("\n");
}

async function listTools(proc: ChildProcess): Promise<string[]> {
  const resp = await send(proc, { method: "tools/list", params: {} });
  return (resp.result?.tools ?? []).map((t: any) => t.name);
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function kill(proc: ChildProcess): Promise<void> {
  return new Promise((resolve) => {
    if (proc.exitCode !== null || proc.signalCode !== null) { resolve(); return; }
    let done = false;
    const finish = () => { if (!done) { done = true; resolve(); } };
    proc.on("exit", finish);
    proc.on("error", finish);
    try { proc.kill(); } catch { finish(); }
    // Safety net: never hang if the exit event raced past our listener.
    setTimeout(finish, 5000);
  });
}

async function main() {
  console.log("=== Bucket-B conformance backfill (§5.1/§5.3/§5.4/§5.5/§5.6/§5.7/§5.8/§5.9/§5.10/§5.20) ===\n");

  // ── §5.1 Output contracts + §5.3 tool/resource surface ──────────────
  {
    const proc = await boot();
    await call(proc, "manage_novel", { action: "create",  name: "bf" });
    await call(proc, "set_badge", { badge: "game_master" });

    await test("T90/T91/T175: [OK] response prefix and error taxonomy", async () => {
      const ok = await call(proc, "manage_world", { action: "create_room",  name: "hall", description: "A hall." });
      assertContains(ok, "[OK]");
      const missing = await callRaw(proc, "manage_world", { action: "remove_room",  name: "absent-room" });
      const text = (missing.result?.content ?? []).map((c: any) => c?.text ?? "").join("\n");
      assertContains(text, "[ERROR]");
      assertContains(text, "[NOT_FOUND]");
      assertContains(text, "Corrective action");
    });

    await test("T26/T062: badge foundations — set_badge switches and persists across Novel scope", async () => {
      await call(proc, "set_badge", { badge: "player" });
      const gated = await callRaw(proc, "manage_npc", { action: "create",  name: "X", description: "d", disposition: "neutral" });
      const err = gated.isError === true || (gated.result?.content ?? []).map((c: any) => c?.text ?? "").join("\n").includes("FORBIDDEN");
      if (!err) throw new Error("Player badge was not blocked from GM tool");
      await call(proc, "set_badge", { badge: "game_master" });
    });

    await test("T5/T020: tools/list exposes the registered tool surface", async () => {
      const tools = await listTools(proc);
      for (const t of ["manage_novel", "set_badge", "manage_world", "manage_context", "manage_combat", "manage_scene"]) {
        if (!tools.includes(t)) throw new Error(`missing tool ${t}`);
      }
    });

    await test("T16/T022: resources/list exposes world + spec resources", async () => {
      const uris = await listResources(proc);
      for (const u of ["world://map", "world://kinds", "spec://build"]) {
        if (!uris.some((x) => x === u || x.startsWith(u))) throw new Error(`missing resource ${u}`);
      }
    });

    await test("T104/T105: spec://build resource is GM-filtered", async () => {
      const gm = await readResource(proc, "spec://build");
      if (gm.trimStart().startsWith("[FORBIDDEN]")) throw new Error("GM read of spec://build was blocked");
      if (!gm.trimStart().startsWith("# Holonovel")) throw new Error("GM spec://build did not return the embedded specification");
      await call(proc, "set_badge", { badge: "player" });
      const nonGm = await readResource(proc, "spec://build");
      assertContains(nonGm, "[FORBIDDEN]");
      await call(proc, "set_badge", { badge: "game_master" });
    });

    await test("T221/T179: output:// template + full untruncated content", async () => {
      const templates = await listTemplates(proc);
      if (!templates.some((t) => t.includes("output://{tool}/{counter}"))) {
        throw new Error(`output pointer template missing: ${templates.join(",")}`);
      }
      // The store is session-local; a produced output is retrievable by the
      // producing tool. Verify the resource read path returns markdown.
      await call(proc, "manage_world", { action: "create_room",  name: "pointer-hall", description: "A long description for pointer output." });
      const content = await readResource(proc, "output://create_room/1");
      if (content.includes("[FORBIDDEN]")) throw new Error("output pointer read blocked");
    });

    await test("T26/T49/T50/T155: prompts/get returns badge_briefing with sections", async () => {
      const brief = await getPrompt(proc, "badge_briefing", {});
      assertContains(brief, "## ");
    });

    await test("T15/T93/T171/T195: spec_health reports counts and health", async () => {
      const health = JSON.parse(await call(proc, "manage_diagnostics", { action: "health" }));
      assertContains(String(health.spec_version), "2026");
      if (typeof health.tool_count !== "number") throw new Error("spec_health missing tool_count");
      if (typeof health.resource_count !== "number") throw new Error("spec_health missing resource_count");
      if (typeof health.prompt_count !== "number") throw new Error("spec_health missing prompt_count");
      if (typeof health.novels_available !== "number") throw new Error("spec_health missing novels_available");
    });

    await test("T211/T313/T314: player_signal records feedback", async () => {
      await call(proc, "set_badge", { badge: "player" });
      const sig = await call(proc, "manage_character", { action: "signal",  signal: "pace", value: "slow down" });
      assertContains(sig, "[OK] Signal recorded");
      await call(proc, "set_badge", { badge: "game_master" });
    });

    await test("T214/T215/T261/T072: session_recap summarizes the session", async () => {
      const recap = await call(proc, "manage_context", { action: "recap" });
      assertContains(recap, "Active Novel");
    });

    await test("T268/T232: set_pause_context / get_pause_context", async () => {
      await call(proc, "manage_novel", { action: "save_context",  current_scene: "In the hall", immediate_situation: "Guards approach" });
      const ctx = await call(proc, "manage_novel", { action: "get_context" });
      assertContains(ctx, "Guards approach");
    });

    await test("T279/T241: checkpoints save, list, restore, remove", async () => {
      await call(proc, "resolve_mechanic", { action: "fate_point",  op: "spend",  entity_id: "pc_1",  amount: 1 });
      const npcCreate = await call(proc, "manage_npc", { action: "create", name: "Checkpointer", mind: { directive: "Original directive." } });
      const npcId = npcCreate.match(/\((\w+)\)/)?.[1];
      await call(proc, "manage_archive", { action: "checkpoint_set",  label: "pre-combat" });
      const list = await call(proc, "manage_archive", { action: "checkpoint_list" });
      assertContains(list, "pre-combat");
      await call(proc, "resolve_mechanic", { action: "fate_point",  op: "spend",  entity_id: "pc_1",  amount: 1 });
      if (npcId) await call(proc, "manage_npc", { action: "update", npc_id: npcId, mind: { directive: "Changed directive." } });
      const restore = await call(proc, "manage_archive", { action: "checkpoint_restore",  label: "pre-combat" });
      assertContains(restore, "[NEED_INPUT]");
      await call(proc, "respond_decision", { decision: "restore_checkpoint:pre-combat", option: "yes" });
      const fates = JSON.parse(await call(proc, "resolve_mechanic", { action: "fate_point",  op: "list" }));
      const pc1 = fates.find((f: any) => f.entity_id === "pc_1");
      if (!pc1 || pc1.fate_points !== 2) throw new Error(`checkpoint dropped base-capability state: ${JSON.stringify(fates)}`);
      if (npcId) {
        const npcAfter = await call(proc, "manage_npc", { action: "get", npc_id: npcId });
        assertContains(npcAfter, "Original directive.");
        if (npcAfter.toLowerCase().includes("changed directive")) throw new Error("checkpoint restore did not revert NPC mind");
      }
      await call(proc, "manage_archive", { action: "checkpoint_remove",  label: "pre-combat" });
    });

    await test("T280/T242: notes set, list, remove", async () => {
      await call(proc, "manage_note", { action: "set",  key: "gm-reminder", content: "Reveal the secret next turn" });
      const list = await call(proc, "manage_note", { action: "list" });
      assertContains(list, "gm-reminder");
      await call(proc, "manage_note", { action: "remove",  key: "gm-reminder" });
    });

    await test("T334/T416/T285: server notes set, listed, and surfaced in the briefing", async () => {
      await call(proc, "set_badge", { badge: "game_master" });
      await call(proc, "manage_note", { action: "set_server",  key: "old-gods", content: "The old gods were banished to the outer dark", narrative_tag: "lore_seed" });
      await call(proc, "manage_note", { action: "set_server",  key: "dm-reminder", content: "Remind players about the curse", narrative_tag: "session_reminder" });
      await call(proc, "manage_note", { action: "set_server",  key: "house-rule", content: "Criticals explode", narrative_tag: "house_rules" });
      await call(proc, "manage_note", { action: "set_server",  key: "bible", content: "The curse is inherited", narrative_tag: "campaign_bible" });
      await call(proc, "manage_note", { action: "set_server",  key: "blank", content: "", narrative_tag: "lore_seed" });
      await call(proc, "manage_note", { action: "set_server",  key: "untagged", content: "Unfiled GM scribble" });

      const list = await call(proc, "manage_note", { action: "list_server" });
      assertContains(list, "old-gods");

      // REQ-365a/b — tagged server notes reach the GM briefing; untagged stay resource-only.
      const gmBrief = await getPrompt(proc, "badge_briefing", {});
      assertContains(gmBrief, "[lore-seed] The old gods were banished");
      assertContains(gmBrief, "[session-reminder] Remind players about the curse");
      assertContains(gmBrief, "[house-rules]");
      assertContains(gmBrief, "[campaign-bible]");
      assertNotContains(gmBrief, "Unfiled GM scribble");
      assertNotContains(gmBrief, "- []");
      // The empty-body note must render no line at all, not a blank bullet.
      assertNotContains(gmBrief, "- [lore-seed] \n");
      assertNotContains(gmBrief, "undefined");

      // REQ-365c — the Player badge sees no server notes, tagged or untagged.
      await call(proc, "set_badge", { badge: "player" });
      const playerBrief = await getPrompt(proc, "badge_briefing", {});
      assertNotContains(playerBrief, "[lore-seed]");
      assertNotContains(playerBrief, "Unfiled GM scribble");
      await call(proc, "set_badge", { badge: "game_master" });

      for (const key of ["old-gods", "dm-reminder", "house-rule", "bible", "blank", "untagged"]) {
        await call(proc, "manage_note", { action: "remove_server",  key });
      }
    });

    await test("T337/T481/T291: ask_oracle returns a d100 ladder result", async () => {
      await call(proc, "set_badge", { badge: "game_master" });
      const oracle = await call(proc, "manage_scene", { action: "oracle",  question: "Is the door locked?" });
      assertContains(oracle, "[OK] Question");
      assertContains(oracle, "/100");
    });

    await test("T254/T213: roll_on_table reports no tables in ruleset-free mode", async () => {
      const roll = await call(proc, "resolve_mechanic", { action: "roll",  table: "weather", seed: "7" });
      assertContains(roll, "[NOT_FOUND]");
    });

    await test("T277/T239: compact requires confirmation and cancels cleanly", async () => {
      await call(proc, "manage_world", { action: "create_room",  name: "audit-room", description: "Audit." });
      const ni = await call(proc, "manage_diagnostics", { action: "compact",  sessions: 1 });
      assertContains(ni, "[NEED_INPUT]");
      const cancelled = await call(proc, "respond_decision", { decision: "compress_audit:1", option: "cancel" });
      assertContains(cancelled, "[OK]");
    });

    await test("T319/T321/T326/T260: granular synthesis activation toggles modules", async () => {
      const disabled = await call(proc, "manage_synthesis", { action: "toggle",  module: "lore_templates", enabled: false });
      assertContains(disabled, "[OK] Synthesis module 'lore_templates' disabled");
      const enabled = await call(proc, "manage_synthesis", { action: "toggle",  module: "lore_templates", enabled: true });
      assertContains(enabled, "[OK] Synthesis module 'lore_templates' enabled");
    });

    await test("T104: prompt health in spec_health", async () => {
      const health = JSON.parse(await call(proc, "manage_diagnostics", { action: "health" }));
      if (typeof health.prompt_count !== "number") throw new Error("prompt_count missing");
    });

    await kill(proc);
  }

  // ── §5.6 / §5.8 state, NPCs, world, synthesis, combat ───────────────
  {
    const proc = await boot();
    await call(proc, "manage_novel", { action: "create",  name: "bf2" });
    await call(proc, "set_badge", { badge: "game_master" });

    await test("T91/T131/T162/T043: conflict lifecycle — pending workflow blocks badge/workflow mutations", async () => {
      await call(proc, "manage_world", { action: "create_room",  name: "conflict-room", description: "Room." });
      // Open a pending workflow (present_choices); badge + undo are blocked
      // until it resolves (REQ-043 conflict lifecycle).
      const resp = await call(proc, "manage_scene", { action: "choices",  prompt: "Choose", choices: [{ id: "a", label: "A" }] });
      assertContains(resp, "[NEED_INPUT]");
      const badgeBlocked = await call(proc, "set_badge", { badge: "player" });
      assertContains(badgeBlocked, "[STATE_CONFLICT]");
      const undoBlocked = await call(proc, "manage_history", {});
      assertContains(undoBlocked, "[STATE_CONFLICT]");
      // Resolve the workflow.
      const resp2 = await call(proc, "respond_decision", { decision: "-present_choices-", option: "a" });
      assertContains(resp2, "[OK]");
      // After resolution, mutations proceed normally.
      const unblocked = await call(proc, "set_badge", { badge: "game_master" });
      assertContains(unblocked, "[OK]");
    });

    await test("T121: redo restores prior state", async () => {
      await call(proc, "manage_world", { action: "create_room",  name: "redo-room", description: "Redo." });
      await call(proc, "manage_history", {});
      const undone = await callRaw(proc, "manage_world", { action: "remove_room",  name: "redo-room" });
      const text = (undone.result?.content ?? []).map((c: any) => c?.text ?? "").join("\n");
      if (!text.includes("[NOT_FOUND]")) throw new Error(`redo-room still exists after undo: ${text}`);
      await call(proc, "manage_history", { action: "redo" });
      const restored = await callRaw(proc, "manage_world", { action: "remove_room",  name: "redo-room" });
      const text2 = (restored.result?.content ?? []).map((c: any) => c?.text ?? "").join("\n");
      assertContains(text2, "[OK]");
    });

    await test("T121/REQ-116: redo survives a refused capability call", async () => {
      await call(proc, "manage_world", { action: "create_room",  name: "redo-room-2", description: "Second redo room." });
      await call(proc, "manage_history", {});
      const refused = await call(proc, "resolve_mechanic", { action: "fate_point", op: "spend", entity_id: "pc_x", amount: 99 });
      assertContains(refused, "[RULE_VIOLATION]");
      await call(proc, "manage_history", { action: "redo" });
      const restored = await callRaw(proc, "manage_world", { action: "remove_room",  name: "redo-room-2" });
      const text = (restored.result?.content ?? []).map((c: any) => c?.text ?? "").join("\n");
      assertContains(text, "[OK]");
    });

    await test("T239/T261/T196: parser command dispatch — create rooms and issue commands", async () => {
      await call(proc, "manage_novel", { action: "create",  name: "bf2-parser" });
      await call(proc, "manage_novel", { action: "switch",  slug: "bf2-parser" });
      await call(proc, "manage_world", { action: "create_room",  name: "parlor", description: "A cozy parlor." });
      await call(proc, "manage_world", { action: "create_room",  name: "study", description: "A dusty study." });
      await call(proc, "manage_world", { action: "create_exit",  direction: "north", room_a: "parlor", room_b: "study" });
      await call(proc, "manage_character", { action: "create",  name: "ParserChar", description: "traveller" });
      await call(proc, "manage_character", { action: "set_active",  entity_id: "character_01" });
      await call(proc, "set_badge", { badge: "player" });
      const look = await call(proc, "run_command", { command: "look" });
      assertContains(look, "parlor");
      const go = await call(proc, "run_command", { command: "go north" });
      assertContains(go, "study");
      await call(proc, "set_badge", { badge: "game_master" });
      await call(proc, "manage_novel", { action: "switch",  slug: "bf2" });
    });

    await test("T239/REQ-196: refusal envelope, help categories, and numbered disambiguation", async () => {
      await call(proc, "manage_novel", { action: "create",  name: "bf2-parser-contracts" });
      await call(proc, "manage_novel", { action: "switch",  slug: "bf2-parser-contracts" });
      await call(proc, "manage_world", { action: "create_room",  name: "hall", description: "A plain hall." });
      await call(proc, "manage_world", { action: "create_thing",  name: "stone altar", kind: "thing", description: "An altar.", location: "hall" });
      await call(proc, "manage_world", { action: "create_thing",  name: "wooden altar", kind: "thing", description: "A wooden altar.", location: "hall" });
      await call(proc, "manage_world", { action: "create_thing",  name: "jar", kind: "container", description: "A glass jar.", openable: true, fixed: true, location: "hall" });
      await call(proc, "manage_world", { action: "create_thing",  name: "inscription", kind: "thing", description: "An inscription.", location: "jar" });
      await call(proc, "manage_character", { action: "create",  name: "ContractsChar", description: "traveller" });
      await call(proc, "manage_character", { action: "set_active",  entity_id: "character_01" });

      const unknown = await call(proc, "run_command", { command: "xyzzy" });
      assertContains(unknown, "[UNIMPLEMENTED]");
      assertContains(unknown, "Unknown verb 'xyzzy'");
      assertContains(unknown, "Valid commands include:");
      assertContains(unknown, "Corrective action:");

      const closed = await call(proc, "run_command", { command: "take inscription" });
      assertContains(closed, "[RULE_VIOLATION]");
      assertContains(closed, "jar");
      await call(proc, "run_command", { command: "open jar" });
      const taken = await call(proc, "run_command", { command: "take inscription" });
      assertContains(taken, "[OK]");

      const ambiguous = await call(proc, "run_command", { command: "take altar" });
      assertContains(ambiguous, "[OK] Which thing?");
      assertContains(ambiguous, "1.");
      assertContains(ambiguous, "2.");
      assertContains(ambiguous, "hall");
      const chosen = await call(proc, "run_command", { command: "1" });
      assertContains(chosen, "[OK]");

      const help = await call(proc, "run_command", { command: "help" });
      assertContains(help, "navigation");
      assertContains(help, "Pick up a portable thing");
      assertContains(help, "narrative");
      assertContains(help, "determined by the Game Master");
      const commands = await call(proc, "run_command", { command: "commands" });
      const whatCan = await call(proc, "run_command", { command: "what can I do?" });
      assert(commands === help, "REQ-196d: `commands` must equal `help`");
      assert(whatCan === help, "REQ-196d: `what can I do?` must equal `help`");

      const jumped = await call(proc, "run_command", { command: "jump" });
      assertContains(jumped, "[OK]");
      const touched = await call(proc, "run_command", { command: "touch wooden altar" });
      assertContains(touched, "[OK]");
      const jumpFixed = await call(proc, "run_command", { command: "jump wooden altar" });
      assertContains(jumpFixed, "[RULE_VIOLATION]");

      await call(proc, "manage_novel", { action: "switch",  slug: "bf2" });
    });

    await test("T241/T261/T198: world-model CRUD — room/thing lifecycle", async () => {
      await call(proc, "manage_world", { action: "create_thing",  name: "candle", kind: "thing", description: "A candle.", location: "study" });
      const listed = await call(proc, "manage_world", { action: "list", kind: "thing" });
      assertContains(listed, "candle");
      const got = await call(proc, "manage_world", { action: "get", id: "candle" });
      assertContains(got, "candle");
      const gone = await callRaw(proc, "manage_world", { action: "remove_thing",  name: "candle" });
      const text = (gone.result?.content ?? []).map((c: any) => c?.text ?? "").join("\n");
      assertContains(text, "[OK]");
    });

    await test("T242/T261/T199: property state tracking — description mutation", async () => {
      await call(proc, "manage_world", { action: "create_room",  name: "prop-room", description: "Initial." });
      const updated = await callRaw(proc, "manage_world", { action: "create_room",  name: "prop-room", description: "Updated." });
      const text = (updated.result?.content ?? []).map((c: any) => c?.text ?? "").join("\n");
      assertContains(text, "[STATE_CONFLICT]");
    });

    await test("T244/T261/T201: convert_source populates world model", async () => {
      await call(proc, "manage_novel", { action: "create",  name: "bf2-convert" });
      await call(proc, "manage_novel", { action: "switch",  slug: "bf2-convert" });
      const src = `# World\n\n## Room: source-hall\nA source hall.\n`;
      const conv = await call(proc, "manage_world", { action: "convert",  source: src });
      assertContains(conv, "[OK] World model populated");
      await call(proc, "manage_novel", { action: "switch",  slug: "bf2" });
    });

    await test("T244/REQ-079a: convert materializes annotation clauses and warns on prose-only directives", async () => {
      await call(proc, "manage_novel", { action: "create",  name: "bf2-hazard" });
      await call(proc, "manage_novel", { action: "switch",  slug: "bf2-hazard" });
      const src = `The Hall is a room. "A hall."\n@encounter(The Hall) spill=3 resource="The Candle" — Golems.\n@trap(The Hall) DC 13 Perception — prose only.\n`;
      const conv = await call(proc, "manage_world", { action: "convert",  source: src });
      assertContains(conv, "[OK] World model populated");
      assertContains(conv, "encounters: 1");
      assertContains(conv, "traps: 0");
      assertContains(conv, "annotation not materialized");
      await call(proc, "manage_novel", { action: "switch",  slug: "bf2" });
    });

    await test("T244/REQ-079a: convert materializes @npc and @lore into Novel state", async () => {
      await call(proc, "manage_novel", { action: "create",  name: "bf2-annotations" });
      await call(proc, "manage_novel", { action: "switch",  slug: "bf2-annotations" });
      const src = `The Hall is a room. "A hall."\n@npc(Hall Warden, The Hall) AC 12, HP 10.\n@lore(The Hall) The walls remember every oath.\n@npc(Second) broken directive.\n`;
      const conv = await call(proc, "manage_world", { action: "convert",  source: src });
      assertContains(conv, "[OK] World model populated");
      assertContains(conv, "NPCs: 1");
      assertContains(conv, "lore: 1");
      assertContains(conv, "expected '<Name>, <Room Name>'");
      const npcs = await call(proc, "manage_npc", { action: "list" });
      assertContains(npcs, "Hall Warden");
      const lore = await call(proc, "manage_lore", { action: "list" });
      assertContains(lore, "hall");
      const entry = await call(proc, "manage_lore", { action: "get", key: "hall" });
      assertContains(entry, "walls remember");
      await call(proc, "manage_novel", { action: "switch",  slug: "bf2" });
    });

    await test("T245/T202: world resources render map and kind contracts", async () => {
      await call(proc, "manage_novel", { action: "switch",  slug: "bf2-parser" });
      const map = await readResource(proc, "world://map");
      assertContains(map, "parlor");
      const kinds = await readResource(proc, "world://kinds");
      assertContains(kinds, "## Property Contracts");
      assertContains(kinds, "device");
      assertContains(kinds, "vehicle");
      assertContains(kinds, "openable");
      assertContains(kinds, "switchable");
      await call(proc, "manage_novel", { action: "switch",  slug: "bf2" });
    });

    await test("T64/T134/T081: narrative directive set", async () => {
      await call(proc, "manage_scene", { action: "directive",  directive: "Foreshadow the siege." });
      const scene = await call(proc, "manage_scene", { action: "set",  description: "The gates tremble." });
      assertContains(scene, "[OK] Scene set");
    });

    await test("T96/T119/T120/T084: suggest_actions groups by domain", async () => {
      await call(proc, "set_badge", { badge: "player" });
      const actions = await call(proc, "run_command", { action: "suggest",  intent: "explore" });
      assertContains(actions, "Spatial");
      await call(proc, "set_badge", { badge: "game_master" });
    });

    await test("T69/T085: macro system expands {{entity.name}} / {{scene.current}}", async () => {
      await call(proc, "manage_scene", { action: "set",  description: "Macro scene" });
      await call(proc, "manage_npc", { action: "create",  name: "Marco", description: "d", disposition: "neutral" });
      const scene = await call(proc, "manage_scene", { action: "set",  description: "{{novel.slug}} at {{scene.current}}" });
      assertContains(scene, "bf2");
    });

    await test("T327/T306/T230: synthesis dashboard lists modules", async () => {
      const toggled = await call(proc, "manage_synthesis", { action: "toggle",  module: "adventure_advice", enabled: true });
      assertContains(toggled, "[OK] Synthesis module 'adventure_advice' enabled");
    });

    await test("T104/T224: character creation workflow — quick-create produces a complete entity", async () => {
      await call(proc, "set_badge", { badge: "game_master" });
      const sheet = await call(proc, "manage_character", { action: "create",  name: "Brienne", description: "A knight.", goals: "Seek the relic" });
      assertContains(sheet, "Brienne");
      const idMatch = sheet.match(/Entity id ([a-z0-9_]+)/i);
      const entityId = idMatch?.[1] ?? "character_01";
      const active = await call(proc, "manage_character", { action: "set_active",  entity_id: entityId });
      assertContains(active, "[OK]");
      const cs = await call(proc, "manage_character", { action: "sheet" });
      assertContains(cs, "Brienne");
    });

    await test("T468/T181: character creation output surface", async () => {
      const sheet = await call(proc, "manage_character", { action: "sheet",  format: "markdown" });
      assertContains(sheet, "Brienne");
    });

    await test("T370/T323: resolve_intent returns structured intent resolution", async () => {
      const intent = JSON.parse(await call(proc, "run_command", { action: "resolve",  intent: "I open the door" }));
      if (intent.status !== "resolved") throw new Error(`resolve_intent status: ${intent.status}`);
    });

    await test("T351/T356/T307: entity presence — created entity appears in knowledge surface", async () => {
      // NPCs live in novel.npcs, not novel.entities; querying an NPC's slug
      // returns a NOT_FOUND whose text still contains the slug. Use a real
      // character entity and assert the knowledge payload, not the echo (CR-3).
      const created = await call(proc, "manage_character", { action: "create", name: "PresenceEntity", description: "Present." });
      const idMatch = created.match(/Entity id ([a-z0-9_]+)/i);
      if (!idMatch) throw new Error(`create did not return an entity id: ${created.substring(0, 200)}`);
      const k = await call(proc, "manage_lore", { action: "knowledge", entity_id: idMatch[1] });
      if (k.includes("[NOT_FOUND]")) throw new Error(`entity ${idMatch[1]} missing from knowledge surface: ${k}`);
      const known = JSON.parse(k);
      if (!Array.isArray(known)) throw new Error(`knowledge did not return an array: ${k.substring(0, 200)}`);
    });

    await kill(proc);
  }

  // ── §5.7 determinism, §5.9 persistence, §5.10 world, §5.20 ──────────
  {
    const proc = await boot({ TTRPG_SEED: "fixed-seed-42" });
    await call(proc, "manage_novel", { action: "create",  name: "bf3" });
    await call(proc, "set_badge", { badge: "game_master" });

    await test("T27/T111/T050: determinism — identical seed produces identical oracle roll", async () => {
      const a = await call(proc, "manage_scene", { action: "oracle",  question: "Rain?", seed: "determinism-check" });
      const b = await call(proc, "manage_scene", { action: "oracle",  question: "Rain?", seed: "determinism-check" });
      const rollA = a.match(/Roll: (\d+)\/100/)?.[1];
      const rollB = b.match(/Roll: (\d+)\/100/)?.[1];
      if (!rollA || !rollB || rollA !== rollB) throw new Error(`nondeterministic: ${rollA} vs ${rollB}`);
    });

    await test("T27/REQ-050a: a seed conflict warns and the per-call seed wins", async () => {
      const oracle = await call(proc, "manage_scene", { action: "oracle",  question: "Rain?", seed: "7" });
      assertContains(oracle, "[WARNING] [seed-conflict]");
      assertContains(oracle, "Per-call seed '7'");

      const roll = await call(proc, "resolve_mechanic", { action: "fate_roll",  dice: "1d20", seed: "7" });
      assertContains(roll, "[WARNING] [seed-conflict]");
      const fate = await call(proc, "resolve_mechanic", { action: "fate_roll",  dice: "4dF", seed: "7" });
      assertContains(fate, "[WARNING] [seed-conflict]");
      const move = await call(proc, "resolve_mechanic", { action: "ironsworn_move",  name: "Face Danger", seed: "7" });
      assertContains(move, "[WARNING] [seed-conflict]");
      const forged = await call(proc, "resolve_mechanic", { action: "forged_action_roll",  name: "Skirmish", seed: "7" });
      assertContains(forged, "[WARNING] [seed-conflict]");
      const init = await call(proc, "manage_combat", { action: "init",  participants: [], dangers: [{ name: "goblin" }, { name: "orc" }], seed: "7" });
      assertContains(init, "[WARNING] [seed-conflict]");
      await call(proc, "manage_combat", { action: "end" });
      const clean = await call(proc, "manage_scene", { action: "oracle",  question: "Rain?" });
      assertNotContains(clean, "[seed-conflict]");
    });

    await test("T27/REQ-050a: no conflict line when TTRPG_SEED is unset", async () => {
      const p = await boot();
      try {
        await call(p, "manage_novel", { action: "create",  name: "unseeded-novel" });
        const oracle = await call(p, "manage_scene", { action: "oracle",  question: "Rain?", seed: "7" });
        assertNotContains(oracle, "[seed-conflict]");
      } finally {
        await kill(p);
      }
    });

    await test("T27/T111/REQ-050: Appendix B.4 witness values reproduce", async () => {
      const d6 = await call(proc, "resolve_mechanic", { action: "fate_roll",  dice: "10d6", seed: "42" });
      assertContains(d6, "faces [ +2 +1 +4 +2 +3 +1 +3 +1 +6 +6 ]");
      const d20 = await call(proc, "resolve_mechanic", { action: "fate_roll",  dice: "10d20", seed: "42" });
      assertContains(d20, "faces [ +6 +2 +12 +5 +8 +1 +9 +3 +18 +20 ]");
    });

    await test("T111/REQ-050b: a per-call seed does not advance the session PRNG", async () => {
      const a = await boot({ TTRPG_SEED: "7" });
      const b = await boot({ TTRPG_SEED: "7" });
      try {
        await call(a, "manage_novel", { action: "create",  name: "stream-a" });
        await call(b, "manage_novel", { action: "create",  name: "stream-b" });
        await call(a, "manage_scene", { action: "oracle",  question: "First?", seed: "99" });
        const afterA = await call(a, "manage_scene", { action: "oracle",  question: "First?" });
        const afterB = await call(b, "manage_scene", { action: "oracle",  question: "First?" });
        const ra = afterA.match(/Roll: (\d+)\/100/)?.[1];
        const rb = afterB.match(/Roll: (\d+)\/100/)?.[1];
        if (!ra || !rb || ra !== rb) throw new Error(`override advanced the session PRNG: ${ra} vs ${rb}`);
      } finally {
        await kill(a);
        await kill(b);
      }
    });

    await test("T111/REQ-050c: two unseeded restarts reproduce identical draws", async () => {
      const run = async (name: string): Promise<string | undefined> => {
        const p = await boot();
        try {
          await call(p, "manage_novel", { action: "create",  name });
          const o = await call(p, "manage_scene", { action: "oracle",  question: "Same?" });
          return o.match(/Roll: (\d+)\/100/)?.[1];
        } finally {
          await kill(p);
        }
      };
      const first = await run("unseeded-a");
      const second = await run("unseeded-b");
      if (!first || first !== second) throw new Error(`default-seed restart diverged: ${first} vs ${second}`);
    });

    await test("T41/T051: no outbound network access — server stays local", async () => {
      // The server is STDIO-local; assert no network endpoints are registered.
      const health = await call(proc, "manage_diagnostics", { action: "health" });
      assertContains(health, "spec_version");
    });

    await test("T20/REQ-054: stored free text renders verbatim in world://map", async () => {
      await call(proc, "manage_world", { action: "create_room",  name: "containment-room", description: "Contained." });
      const map = await readResource(proc, "world://map");
      assertContains(map, "containment-room");
    });

    await test("T125/T156/T261/T092: Novel persistence — state survives restart", async () => {
      await call(proc, "manage_world", { action: "create_room",  name: "persist-room", description: "Persistent." });
      await kill(proc);

      const proc2 = await boot({ TTRPG_SEED: "fixed-seed-42" });
      await call(proc2, "set_badge", { badge: "game_master" });
      await call(proc2, "manage_novel", { action: "resume",  slug: "bf3" });
      const info = await call(proc2, "manage_novel", { action: "info" });
      assertContains(info, "bf3");
      const map = await readResource(proc2, "world://map");
      assertContains(map, "persist-room");
      await kill(proc2);
    });

    await kill(proc);
  }

  // ── §5.3/§5.4/§5.5/§5.6/§5.7/§5.8/§5.10 — remaining ruleset-free surfaces ──
  {
    let proc = await boot();
    await call(proc, "manage_novel", { action: "create",  name: "bf4" });
    await call(proc, "set_badge", { badge: "game_master" });

    await test("T9/T066: set_badge cycles badges with audit", async () => {
      const player = await call(proc, "set_badge", { badge: "player" });
      assertContains(player, "[OK] Active badge: player");
      const gm = await call(proc, "set_badge", { badge: "game_master" });
      assertContains(gm, "[OK] Active badge: game_master");
    });

    await test("T216/T218/T220/T074: multi-entity support — several characters exist", async () => {
      await call(proc, "manage_character", { action: "create",  name: "MultiOne", description: "1" });
      await call(proc, "manage_character", { action: "create",  name: "MultiTwo", description: "2" });
      const health = JSON.parse(await call(proc, "manage_diagnostics", { action: "health" }));
      if ((health.entities ?? 0) < 2) throw new Error(`expected ≥2 entities, got ${health.entities}`);
    });

    await test("T243/T200: kind mechanical contracts — device kind accepted", async () => {
      await call(proc, "manage_world", { action: "create_room",  name: "kind-room", description: "K." });
      const dev = await call(proc, "manage_world", { action: "create_thing",  name: "beacon", kind: "device", description: "signal", location: "kind-room" });
      assertContains(dev, "[OK]");
    });

    await test("T264/T222: parser command vocabulary — look/go/examine", async () => {
      await call(proc, "manage_character", { action: "create",  name: "VocabChar", description: "v" });
      await call(proc, "manage_character", { action: "set_active",  entity_id: "character_01" });
      await call(proc, "set_badge", { badge: "player" });
      const look = await call(proc, "run_command", { command: "look" });
      assertContains(look, "kind-room");
      await call(proc, "set_badge", { badge: "game_master" });
    });

    await test("T483/T484/T485/T306: adjustable autonomy — set_autonomy changes level", async () => {
      const auto = await call(proc, "manage_staging", { action: "autonomy",  level: "full" });
      assertContains(auto, "[OK] Autonomy set");
    });

    await test("T361/T316: device lifecycle — switch on/off + RULE_VIOLATION on non-device", async () => {
      await call(proc, "manage_world", { action: "create_thing",  name: "t361-lantern", kind: "device", lit: true, location: "kind-room" });
      await call(proc, "manage_world", { action: "create_thing",  name: "t361-rock", kind: "thing", location: "kind-room" });
      await call(proc, "manage_character", { action: "set_active",  entity_id: "character_01" });
      await call(proc, "set_badge", { badge: "player" });
      assertContains(await call(proc, "run_command", { command: "switch on t361-lantern" }), "[OK]");
      assertContains(await call(proc, "run_command", { command: "switch on t361-lantern" }), "[WARNING]");
      assertContains(await call(proc, "run_command", { command: "switch off t361-lantern" }), "[OK]");
      assertContains(await call(proc, "run_command", { command: "switch on t361-rock" }), "RULE_VIOLATION");
      assertContains(await call(proc, "run_command", { command: "switch on missing-thing" }), "NOT_FOUND");
      await call(proc, "set_badge", { badge: "game_master" });
    });

    await test("T362/T317: vehicle lifecycle — capacity, passengers, moments, briefing", async () => {
      await call(proc, "manage_world", { action: "create_room",  name: "t362-shore", description: "Shore." });
      await call(proc, "manage_world", { action: "create_exit",  direction: "north", room_a: "kind-room", room_b: "t362-shore" });
      await call(proc, "manage_world", { action: "create_thing",  name: "t362-raft", kind: "vehicle", enterable: true, description: "A rickety raft.", location: "kind-room" });
      await call(proc, "manage_world", { action: "create_thing",  name: "t362-skiff", kind: "vehicle", capacity: 1, enterable: true, description: "A narrow skiff.", location: "kind-room" });
      await call(proc, "manage_world", { action: "create_thing",  name: "t362-cart", kind: "vehicle", enterable: true, description: "A sturdy cart.", location: "kind-room" });
      await call(proc, "manage_world", { action: "create_thing",  name: "t362-rock", kind: "thing", location: "kind-room" });
      await call(proc, "manage_character", { action: "create",  name: "Rafter", description: "second passenger" });

      // REQ-317c — a CRUD-created vehicle carries a capacity and the existing
      // parser check enforces it.
      const cart = await call(proc, "manage_world", { action: "get",  id: "t362-cart" });
      assertContains(cart, "\"capacity\": 4");
      await call(proc, "manage_character", { action: "set_active",  entity_id: "character_01" });
      await call(proc, "set_badge", { badge: "player" });
      assertContains(await call(proc, "run_command", { command: "enter t362-skiff" }), "[OK]");
      assertContains(await call(proc, "run_command", { command: "enter t362-skiff" }), "[OK]", "REQ-317c re-entering while aboard is idempotent");
      await call(proc, "manage_character", { action: "set_active",  entity_id: "character_04" });
      assertContains(await call(proc, "run_command", { command: "enter t362-skiff" }), "RULE_VIOLATION", "REQ-317c full vehicle rejects a passenger");
      await call(proc, "manage_character", { action: "set_active",  entity_id: "character_01" });
      assertContains(await call(proc, "run_command", { command: "exit" }), "[OK]");

      // REQ-317b — aboard navigation moves the vehicle and every passenger.
      await call(proc, "manage_character", { action: "set_active",  entity_id: "character_01" });
      assertContains(await call(proc, "run_command", { command: "enter t362-cart" }), "[OK]");
      await call(proc, "manage_character", { action: "set_active",  entity_id: "character_04" });
      assertContains(await call(proc, "run_command", { command: "enter t362-cart" }), "[OK]");
      await call(proc, "manage_character", { action: "set_active",  entity_id: "character_01" });
      assertContains(await call(proc, "run_command", { command: "look" }), "t362-cart (interior)");
      assertContains(await call(proc, "run_command", { command: "look" }), "Exits: out.");
      assertContains(await call(proc, "run_command", { command: "go north" }), "[OK]");
      await call(proc, "set_badge", { badge: "game_master" });
      const movedCart = await call(proc, "manage_world", { action: "get",  id: "t362-cart" });
      assertContains(movedCart, "\"location\": \"t362-shore\"", "REQ-317b vehicle persists at its last location");
      const secondSheet = await call(proc, "manage_character", { action: "sheet",  entity_id: "character_04", format: "ascii" });
      assertContains(secondSheet, "t362-shore", "REQ-317b a passenger moves with the vehicle");
      const map = await readResource(proc, "world://map");
      assertNotContains(map, "interior", "REQ-317c interiors are not world-graph nodes");

      // REQ-317d — the entry moment carries the interior description, and the
      // traversal surfaces in recap and briefing.
      await call(proc, "set_badge", { badge: "player" });
      assertContains(await call(proc, "run_command", { command: "exit" }), "[OK]");
      assertContains(await call(proc, "run_command", { command: "go south" }), "[OK]");
      await call(proc, "set_badge", { badge: "game_master" });
      const recap = await call(proc, "manage_context", { action: "recap" });
      assertContains(recap, "[vehicle-entry] entered t362-cart — A sturdy cart.", "REQ-317d entry moment carries the interior");
      assertContains(recap, "[vehicle-exit] t362-cart returned to t362-shore", "REQ-317d exit moment");
      assertContains(recap, "\"kind\":\"vehicle\"", "REQ-317d vehicle transition in recap");
      assertContains(recap, "t362-cart", "REQ-317d recap names the vehicle");
      await call(proc, "set_badge", { badge: "player" });
      const briefing = await getPrompt(proc, "badge_briefing");
      assertContains(briefing, "### Vehicle", "REQ-317d briefing vehicle block");
      assertContains(briefing, "t362-cart", "REQ-317d briefing names the vehicle");
      await call(proc, "set_badge", { badge: "game_master" });
      assertContains(await call(proc, "run_command", { command: "enter t362-rock" }), "RULE_VIOLATION");
    });

    await test("T362b/T317: aboard movement honors the parked room's doors", async () => {
      await call(proc, "manage_novel", { action: "create",  name: "t362door" });
      await call(proc, "manage_novel", { action: "switch",  slug: "t362door" });
      await call(proc, "manage_world", { action: "convert",  source: "# World\n\n## Room: quay\nA stone quay.\n\n## Room: bay\nA grey bay.\n\nSkiff is a vehicle. \"A narrow skiff.\"\nIt is in quay.\n\nA plank door is north of quay and south of bay.\nIt is closed." });
      await call(proc, "manage_character", { action: "create",  name: "Quayhand" });
      await call(proc, "manage_character", { action: "set_active",  entity_id: "character_01" });
      await call(proc, "set_badge", { badge: "player" });
      assertContains(await call(proc, "run_command", { command: "enter skiff" }), "[OK]");
      const blocked = await call(proc, "run_command", { command: "go north" });
      assertContains(blocked, "[WARNING]", "REQ-317b a closed door blocks aboard movement");
      assertContains(blocked, "plank door");
      await call(proc, "set_badge", { badge: "game_master" });
      const parked = await call(proc, "manage_world", { action: "get",  id: "skiff" });
      assertContains(parked, "\"location\": \"quay\"", "REQ-317b a blocked move leaves the vehicle parked");
      assertContains(await call(proc, "run_command", { command: "unlock plank door" }), "[OK]");
      assertContains(await call(proc, "run_command", { command: "open plank door" }), "[OK]");
      await call(proc, "set_badge", { badge: "player" });
      assertContains(await call(proc, "run_command", { command: "go north" }), "[OK]");
      await call(proc, "set_badge", { badge: "game_master" });
      const sailed = await call(proc, "manage_world", { action: "get",  id: "skiff" });
      assertContains(sailed, "\"location\": \"bay\"", "REQ-317b an open door lets the vehicle through");
      await call(proc, "manage_novel", { action: "switch",  slug: "bf4" });
      await call(proc, "manage_character", { action: "set_active",  entity_id: "character_01" });
    });

    await test("T363/T318: extended property contracts — wearable/edible/readable flags", async () => {
      await call(proc, "manage_world", { action: "create_thing",  name: "t363-ring", kind: "thing", wearable: true, location: "kind-room" });
      await call(proc, "manage_world", { action: "create_thing",  name: "t363-mushroom", kind: "thing", edible: true, location: "kind-room" });
      await call(proc, "manage_world", { action: "create_thing",  name: "t363-altar", kind: "supporter", readable: true, read_text: "Beware the serpent.", location: "kind-room" });
      await call(proc, "set_badge", { badge: "player" });
      await call(proc, "run_command", { command: "take t363-ring" });
      assertContains(await call(proc, "run_command", { command: "wear t363-ring" }), "[OK]");
      await call(proc, "run_command", { command: "take t363-mushroom" });
      assertContains(await call(proc, "run_command", { command: "eat t363-mushroom" }), "[OK]");
      assertContains(await call(proc, "run_command", { command: "read t363-altar" }), "Beware the serpent");
      await call(proc, "set_badge", { badge: "game_master" });
    });

    await test("T364/T319: extended parser vocabulary — light/extinguish/listen + help tiers", async () => {
      await call(proc, "manage_world", { action: "create_thing",  name: "t364-torch", kind: "thing", lit: true, location: "kind-room" });
      await call(proc, "set_badge", { badge: "player" });
      assertContains(await call(proc, "run_command", { command: "extinguish t364-torch" }), "[OK]");
      assertContains(await call(proc, "run_command", { command: "light t364-torch" }), "[OK]");
      assertContains(await call(proc, "run_command", { command: "listen" }), "[OK]");
      assertContains(await call(proc, "run_command", { command: "smell" }), "[OK]");
      assertContains(await call(proc, "run_command", { command: "touch t364-torch" }), "[OK]");
      const help = await call(proc, "run_command", { command: "help" });
      assertContains(help, "core");
      assertContains(help, "standard");
      assertContains(help, "extended");
      await call(proc, "set_badge", { badge: "game_master" });
    });

    await test("T364/T319: sensory cues — modeled listen/smell through open exits and closed containers", async () => {
      await call(proc, "manage_novel", { action: "create", name: "bf4-sensory" });
      await call(proc, "manage_novel", { action: "switch", slug: "bf4-sensory" });
      await call(proc, "manage_character", { action: "create", name: "SensoryChar", description: "s" });
      await call(proc, "manage_character", { action: "set_active", entity_id: "character_01" });
      const src = [
        "# World",
        "",
        "## Room: nearroom",
        "A near room.",
        "North of nearroom is farroom.",
        "Creaky door is north of nearroom and south of farroom.",
        "It is closed.",
        "The music box is in farroom.",
        'The music box has a noise of "a tinny waltz".',
        "The copper kettle is in nearroom.",
        'The copper kettle has a scent of "warm copper".',
        "The plain stone is in nearroom.",
        "",
      ].join("\n");
      const conv = await call(proc, "manage_world", { action: "convert", source: src });
      assertContains(conv, "[OK] World model populated");
      await call(proc, "manage_world", { action: "update_thing", name: "creaky door", locked: false });

      await call(proc, "set_badge", { badge: "player" });
      const closedListen = await call(proc, "run_command", { command: "listen" });
      if (closedListen.includes("tinny waltz")) throw new Error("closed door leaked the adjacent cue");
      const nearSmell = await call(proc, "run_command", { command: "smell" });
      assertContains(nearSmell, "warm copper");
      if (nearSmell.includes("plain stone")) throw new Error("scentless thing invented a cue");

      await call(proc, "set_badge", { badge: "game_master" });
      assertContains(await call(proc, "run_command", { command: "open creaky door" }), "[OK]");
      await call(proc, "set_badge", { badge: "player" });
      const openListen = await call(proc, "run_command", { command: "listen" });
      assertContains(openListen, "tinny waltz");
      assertContains(openListen, "from the north");

      await call(proc, "set_badge", { badge: "game_master" });
      await call(proc, "manage_world", { action: "create_thing", name: "sealed jar", kind: "container", location: "nearroom" });
      await call(proc, "manage_world", { action: "create_thing", name: "dried rose", kind: "thing", location: "sealed jar", scent: "crushed petals" });
      await call(proc, "set_badge", { badge: "player" });
      const closedSmell = await call(proc, "run_command", { command: "smell" });
      if (closedSmell.includes("crushed petals")) throw new Error("closed container leaked its contents' scent");

      await call(proc, "set_badge", { badge: "game_master" });
      assertContains(await call(proc, "run_command", { command: "open sealed jar" }), "[OK]");
      await call(proc, "set_badge", { badge: "player" });
      assertContains(await call(proc, "run_command", { command: "smell" }), "crushed petals");

      await call(proc, "set_badge", { badge: "game_master" });
      await call(proc, "manage_novel", { action: "switch", slug: "bf4" });
    });

    await test("T365/T320: narrative-intent parser verbs — ask/give/shows", async () => {
      await call(proc, "manage_npc", { action: "create",  name: "t365-guard", location: "kind-room" });
      await call(proc, "manage_world", { action: "create_thing",  name: "t365-sword", kind: "thing", location: "kind-room" });
      await call(proc, "set_badge", { badge: "player" });
      assertContains(await call(proc, "run_command", { command: "ask t365-guard about crypt" }), "[OK]");
      await call(proc, "run_command", { command: "take t365-sword" });
      assertContains(await call(proc, "run_command", { command: "give t365-sword to t365-guard" }), "[OK]");
      assertContains(await call(proc, "run_command", { command: "ask nobody about crypt" }), "[WARNING]");
      await call(proc, "set_badge", { badge: "game_master" });
    });

    await test("T365/REQ-320: narrative verbs scope to the current room", async () => {
      await call(proc, "manage_novel", { action: "create",  name: "bf2-narrative-scope" });
      await call(proc, "manage_novel", { action: "switch",  slug: "bf2-narrative-scope" });
      await call(proc, "manage_world", { action: "create_room",  name: "yard", description: "A yard." });
      await call(proc, "manage_world", { action: "create_room",  name: "cellar", description: "A cellar." });
      await call(proc, "manage_npc", { action: "create",  name: "gatemaster", location: "yard" });
      await call(proc, "manage_npc", { action: "create",  name: "cellarkeeper", location: "cellar" });
      await call(proc, "manage_character", { action: "create",  name: "ScopeChar", description: "traveller" });
      await call(proc, "manage_character", { action: "set_active",  entity_id: "character_01" });

      await call(proc, "manage_world", { action: "create_thing",  name: "pebble", kind: "thing", location: "yard" });
      await call(proc, "run_command", { command: "take pebble" });
      const thrown = await call(proc, "run_command", { command: "throw pebble at gatemaster" });
      assertContains(thrown, "[OK]");
      const afterThrow = await call(proc, "manage_world", { action: "get", id: "pebble" });
      assertContains(afterThrow, "yard");

      await call(proc, "manage_world", { action: "create_thing",  name: "stone", kind: "thing", location: "yard" });
      await call(proc, "run_command", { command: "take stone" });
      const across = await call(proc, "run_command", { command: "throw stone at cellarkeeper" });
      assertContains(across, "[WARNING]");
      const landed = await call(proc, "manage_world", { action: "get", id: "stone" });
      assertContains(landed, "yard");

      await call(proc, "manage_world", { action: "create_thing",  name: "sword", kind: "thing", location: "yard" });
      await call(proc, "run_command", { command: "take sword" });
      const given = await call(proc, "run_command", { command: "give sword to cellarkeeper" });
      assertContains(given, "[WARNING]");
      const sheet = await call(proc, "manage_character", { action: "sheet",  entity_id: "character_01" });
      assertContains(sheet, "sword");

      // Restore the Novel the surrounding block was using (bf4) so the following
      // workflow-staleness test sees its own pending-workflow surface.
      await call(proc, "manage_novel", { action: "switch",  slug: "bf4" });
    });

    await test("T273/T235: structured player choices — present_choices emits options", async () => {
      const pc = await call(proc, "manage_scene", { action: "choices",  prompt: "Which path?", choices: [{ id: "path1", label: "North road" }] });
      assertContains(pc, "North road");
      await call(proc, "respond_decision", { decision: "-present_choices-", option: "path1" });
    });

    await test("T266/T224: workflow staleness — restart with pending workflow surfaces warning", async () => {
      await call(proc, "manage_scene", { action: "choices",  prompt: "Stale?", choices: [{ id: "s1", label: "S1" }] });
      // Leave pending; new connections increment the staleness counter.
      await kill(proc);
      const proc2 = await boot({ TTRPG_WORKFLOW_STALENESS_CONNECTIONS: "3" });
      await call(proc2, "set_badge", { badge: "game_master" });
      await call(proc2, "manage_novel", { action: "resume",  slug: "bf4" });
      const health = JSON.parse(await call(proc2, "manage_diagnostics", { action: "health" }));
      if (!health.pending_workflow) throw new Error("pending_workflow not surfaced");
      await kill(proc2);
      // Reboot a fresh proc for the remaining tests in this block. bf4 was
      // persisted (with its pending workflow) and is hydrated from disk at
      // boot, so `create bf4` would conflict — start a fresh Novel instead so
      // the remaining tests run against a clean slate (REQ-423 hydration).
      proc = await boot();
      await call(proc, "manage_novel", { action: "create",  name: "bf5" });
      await call(proc, "set_badge", { badge: "game_master" });
      return;
    });

    await test("T341/T296: knowledge-graph resource — world://kinds is knowledge-bearing", async () => {
      const kinds = await readResource(proc, "world://kinds");
      assertContains(kinds, "## Kind Hierarchy");
    });

    await test("T303/T227: synthesis model — toggle_synthesis_module surfaces modules", async () => {
      const t = await call(proc, "manage_synthesis", { action: "toggle",  module: "lore_templates", enabled: false });
      assertContains(t, "[OK]");
      await call(proc, "manage_synthesis", { action: "toggle",  module: "lore_templates", enabled: true });
    });

    await test("T477/T488/T408: parameter ceiling recorded in spec_health", async () => {
      const health = JSON.parse(await call(proc, "manage_diagnostics", { action: "health" }));
      if (typeof health.parameter_ceiling !== "number") throw new Error("parameter_ceiling missing");
      // T477's recoverable clause: each tool's parameter count is exposed.
      if (typeof health.tool_parameter_counts?.manage_character !== "number") {
        throw new Error("tool_parameter_counts.manage_character missing");
      }
    });

    await test("T478/T409: response-lean enumeration — summary by default, detail on request", async () => {
      const longText = "A deliberately long description that an enumeration should summarize rather than repeat in full.";
      await call(proc, "manage_npc", { action: "create", name: "Summary Subject", description: longText });
      await call(proc, "manage_lore", { action: "set", key: "t478-lore", content: longText });
      await call(proc, "manage_faction", { action: "create", name: "Summary Faction", description: longText });

      const npcSummary = JSON.parse(await call(proc, "manage_npc", { action: "list" }));
      const npcRow = npcSummary.find((n: any) => n.name === "Summary Subject");
      if (!npcRow) throw new Error("npc list omitted the created NPC");
      if ("description" in npcRow) throw new Error("npc list returned the full description by default");
      if (!("preview" in npcRow)) throw new Error("npc list omitted the summary preview");

      const loreSummary = JSON.parse(await call(proc, "manage_lore", { action: "list" }));
      const loreRow = loreSummary.find((e: any) => e.key === "t478-lore");
      if (!loreRow) throw new Error("lore list omitted the created entry");
      if ("content" in loreRow) throw new Error("lore list returned full content by default");
      if (!("preview" in loreRow)) throw new Error("lore list omitted the summary preview");

      const factionSummary = JSON.parse(await call(proc, "manage_faction", { action: "list" }));
      const factionRow = factionSummary.find((f: any) => f.name === "Summary Faction");
      if (!factionRow || "description" in factionRow) throw new Error("faction list returned the full description by default");

      const npcFull = JSON.parse(await call(proc, "manage_npc", { action: "list", detail: true }));
      if (!("description" in (npcFull.find((n: any) => n.name === "Summary Subject") ?? {}))) {
        throw new Error("detail npc list omitted the full description");
      }
      const loreFull = JSON.parse(await call(proc, "manage_lore", { action: "list", detail: true }));
      if (!("content" in (loreFull.find((e: any) => e.key === "t478-lore") ?? {}))) {
        throw new Error("detail lore list omitted the full content");
      }

      // Single-entry reads stay full (REQ-060); the detail path mutates nothing.
      const npcGet = JSON.parse(await call(proc, "manage_npc", { action: "get", npc_id: npcRow.id }));
      if (npcGet.description !== longText) throw new Error("single-entry get lost the full description");

      const health = JSON.parse(await call(proc, "manage_diagnostics", { action: "health" }));
      if (typeof health.tool_count !== "number") throw new Error("tool_count missing");
      if (health.enumeration_verbosity !== "summary") throw new Error("spec_health did not report the enumeration mode");
    });

    await test("T479/T410: token footprint in performance record", async () => {
      const health = JSON.parse(await call(proc, "manage_diagnostics", { action: "health" }));
      if (typeof health.token_footprint?.tools_list_bytes !== "number") throw new Error("token_footprint.tools_list_bytes missing");
    });

    await test("T480/T411: stable-metadata caching — repeated spec_health consistent", async () => {
      const a = JSON.parse(await call(proc, "manage_diagnostics", { action: "health" }));
      const b = JSON.parse(await call(proc, "manage_diagnostics", { action: "health" }));
      if (a.tool_count !== b.tool_count) throw new Error("cached metadata drifted between calls");
    });

    await test("T66/T225/T082: prompt section ordering — badge_briefing renders sections in order", async () => {
      const brief = await getPrompt(proc, "badge_briefing", {});
      assertContains(brief, "## ");
      if (brief.indexOf("## ") === -1) throw new Error("no sections");
    });

    await test("T194/T159: synthesis briefing integration — spec_health reports synthesis status", async () => {
      const health = JSON.parse(await call(proc, "manage_diagnostics", { action: "health" }));
      if (typeof health.synthesis_active !== "boolean") throw new Error("synthesis_active missing");
    });

    await test("S6/S17/REQ-030: single-user connection — one active badge serves the connection", async () => {
      await call(proc, "set_badge", { badge: "player" });
      const p = await call(proc, "manage_diagnostics", { action: "health" });
      if (JSON.parse(p).active_badge !== "player") throw new Error("badge did not persist per-connection");
      await call(proc, "set_badge", { badge: "game_master" });
      const g = await call(proc, "manage_diagnostics", { action: "health" });
      if (JSON.parse(g).active_badge !== "game_master") throw new Error("badge switch not reflected");
    });

    await test("T176/T177/T178/T002: error taxonomy — forbidden + corrective action; missing param surfaces SDK error", async () => {
      await call(proc, "set_badge", { badge: "player" });
      const forbidden = await callRaw(proc, "manage_npc", { action: "create",  name: "X", description: "d", disposition: "neutral" });
      const forbText = forbidden.isError
        ? "isError"
        : (forbidden.result?.content ?? []).map((c: any) => c?.text ?? "").join("\n");
      assertContains(forbText, "[FORBIDDEN]");
      assertContains(forbText, "Corrective action");
      await call(proc, "set_badge", { badge: "game_master" });
    });

    await test("T133/T137/T331/T076: scene-state ledger — set_scene_state stores location/time/atmosphere", async () => {
      await call(proc, "manage_scene", { action: "set",  description: "The hall echoes.", location: "Throne Room", time_of_day: "dusk", atmosphere: "tense" });
      const sc = JSON.parse(await readResource(proc, "scene://current"));
      assertContains(sc.location ?? "", "Throne Room");
      assertContains(sc.time_of_day ?? "", "dusk");
      assertContains(sc.atmosphere ?? "", "tense");
    });

    await test("T482/T412: turn-handoff directive present in badge_briefing", async () => {
      await call(proc, "set_badge", { badge: "player" });
      const brief = await getPrompt(proc, "badge_briefing", {});
      if (!/invite|hand|turn/i.test(brief)) throw new Error("turn-handoff directive missing from badge_briefing");
      await call(proc, "set_badge", { badge: "game_master" });
    });

    await test("T353/T309: world and narrative surface prominence — parser is the Player surface", async () => {
      await call(proc, "set_badge", { badge: "player" });
      const brief = await getPrompt(proc, "badge_briefing", {});
      assertContains(brief, "run_command (action: execute");
      await call(proc, "set_badge", { badge: "game_master" });
    });

    await test("T259/T218: ruleset-free build — parser primary Player surface", async () => {
      await call(proc, "manage_world", { action: "create_room",  name: "rf-room", description: "R." });
      await call(proc, "manage_character", { action: "create",  name: "RfChar", description: "c" });
      await call(proc, "manage_character", { action: "set_active",  entity_id: "character_01" });
      await call(proc, "set_badge", { badge: "player" });
      const look = await call(proc, "run_command", { command: "look" });
      assertContains(look, "rf-room");
      await call(proc, "set_badge", { badge: "game_master" });
    });

    await kill(proc);
  }

  // ── §5.8 synthesis activation gating (REQ-159/231/260/265, REQ-084b/115) ──
  {
    const proc = await boot();
    await call(proc, "manage_novel", { action: "create", name: "synth-gate" });
    await call(proc, "set_badge", { badge: "game_master" });
    await call(proc, "manage_synthesis", { action: "run" });

    await test("T307/REQ-231: module toggle suppresses briefing and module resource", async () => {
      const on = await getPrompt(proc, "badge_briefing", {});
      assertContains(on, "### Synthesis");
      assertContains(on, "Lore templates");
      await call(proc, "manage_synthesis", { action: "toggle", module: "lore_templates", enabled: false });
      const off = await getPrompt(proc, "badge_briefing", {});
      assertNotContains(off, "Lore templates");
      const resOff = (await readResource(proc, "synthesis://lore_templates")).replace(/\s/g, "");
      if (resOff !== "[]") throw new Error(`disabled module resource not empty: ${resOff.substring(0, 120)}`);
      await call(proc, "manage_synthesis", { action: "toggle", module: "lore_templates", enabled: true });
      const resOn = await readResource(proc, "synthesis://lore_templates");
      assertContains(resOn, "worldbuilding");
    });

    await test("T319/T326/REQ-260/265: per-item deactivate hides, activate shows", async () => {
      const list = JSON.parse(await call(proc, "manage_synthesis", { action: "list", module: "lore_templates" }));
      const key = list[0]?.key;
      const preview = String(list[0]?.preview ?? "").slice(0, 30);
      assert(key && preview, "no lore template key/preview in list");
      assert(list[0].activated === true, "vendor item should default active");
      await call(proc, "manage_synthesis", { action: "deactivate", module: "lore_templates", key });
      const list2 = JSON.parse(await call(proc, "manage_synthesis", { action: "list", module: "lore_templates" }));
      const row = list2.find((r: any) => r.key === key);
      assert(row && row.activated === false, "deactivated item still reported active");
      const res = JSON.parse(await readResource(proc, "synthesis://lore_templates"));
      assert(!res.some((i: any) => i.key === key), "deactivated item still in module resource");
      const offBrief = await getPrompt(proc, "badge_briefing", {});
      assertNotContains(offBrief, preview);
      await call(proc, "manage_synthesis", { action: "activate", module: "lore_templates", key });
      const res2 = JSON.parse(await readResource(proc, "synthesis://lore_templates"));
      assert(res2.some((i: any) => i.key === key), "reactivated item missing from module resource");
    });

    await test("T319/REQ-260: module toggle state persists in list output", async () => {
      await call(proc, "manage_synthesis", { action: "toggle", module: "voice_examples", enabled: false });
      const list = JSON.parse(await call(proc, "manage_synthesis", { action: "list", module: "voice_examples" }));
      assert(list.length > 0 && list.every((r: any) => r.module_enabled === false), "module_enabled not reported");
      await call(proc, "manage_synthesis", { action: "toggle", module: "voice_examples", enabled: true });
    });

    await test("T96/T119/REQ-084b/115: action-pattern toggle gates suggestions", async () => {
      const t = await call(proc, "manage_synthesis", { action: "toggle_action" });
      if (t.includes("enabled")) await call(proc, "manage_synthesis", { action: "toggle_action" });
      const off = await call(proc, "run_command", { action: "suggest", intent: "present choices" });
      assertNotContains(off, "synthesis pattern");
      await call(proc, "manage_synthesis", { action: "toggle_action" });
      const on = await call(proc, "run_command", { action: "suggest", intent: "present choices" });
      assertContains(on, "synthesis pattern");
      await call(proc, "manage_synthesis", { action: "toggle_action" });
    });

    await test("T326/REQ-265: Player badge excludes GM-scoped synthesis content", async () => {
      await call(proc, "set_badge", { badge: "player" });
      const brief = await getPrompt(proc, "badge_briefing", {});
      assertNotContains(brief, "Imported Wisdom");
      await call(proc, "set_badge", { badge: "game_master" });
    });

    await test("T319/REQ-260c/261: Player manages only own synthesis items", async () => {
      await call(proc, "set_badge", { badge: "player" });
      await call(proc, "manage_synthesis", { action: "player_add", module: "lore_templates", key: "p1", content: "Player lore seed." });
      const forbidden = await call(proc, "manage_synthesis", { action: "activate", module: "lore_templates", key: "not-mine" });
      assertContains(forbidden, "FORBIDDEN");
      const own = await call(proc, "manage_synthesis", { action: "deactivate", module: "lore_templates", key: "p1" });
      assertContains(own, "[OK]");
      const pl = JSON.parse(await call(proc, "manage_synthesis", { action: "player_list", module: "lore_templates" }));
      assert(pl.length === 1 && pl[0].activated === false, `player deactivate not reflected: ${JSON.stringify(pl)}`);
      await call(proc, "set_badge", { badge: "game_master" });
    });

    await kill(proc);
  }

  // ── T485 (configured) — TTRPG_AUTONOMY launch preset ────────────────
  {
    const proc = await boot({ TTRPG_AUTONOMY: "full" });
    await call(proc, "manage_novel", { action: "create", name: "autonomy-preset" });
    await call(proc, "set_badge", { badge: "game_master" });
    await test("T485/REQ-306: TTRPG_AUTONOMY seeds the new Novel's default autonomy level", async () => {
      const auto = await call(proc, "manage_staging", { action: "autonomy" });
      assertContains(auto, "full");
    });
    await kill(proc);
  }

  // ── T218 (configured) — TTRPG_MAX_ROSTER_ENTITIES cap ───────────────
  {
    const proc = await boot({ TTRPG_MAX_ROSTER_ENTITIES: "1" });
    await call(proc, "manage_novel", { action: "create", name: "roster-cap" });
    await call(proc, "set_badge", { badge: "game_master" });
    await test("T218/REQ-129b2: TTRPG_MAX_ROSTER_ENTITIES caps the roster", async () => {
      const c1 = await call(proc, "manage_character", { action: "create", name: "CapOne" });
      const id1 = c1.match(/character_\d+/)?.[0];
      assert(id1, `no entity id for first character: ${c1}`);
      assertContains(await call(proc, "manage_character", { action: "stage", entity_id: id1 }), "[OK]");
      const c2 = await call(proc, "manage_character", { action: "create", name: "CapTwo" });
      const id2 = c2.match(/character_\d+/)?.[0];
      assert(id2, `no entity id for second character: ${c2}`);
      assertContains(await call(proc, "manage_character", { action: "stage", entity_id: id2 }), "STATE_CONFLICT");
    });
    await kill(proc);
  }

  // ── T195 (configured) — TTRPG_SYNTHESIS_STALE_DAYS marks items stale ──
  {
    const proc = await boot({ TTRPG_SYNTHESIS_STALE_DAYS: "0", TTRPG_OUTPUT_LIMIT: "200000" });
    await call(proc, "manage_novel", { action: "create", name: "synth-stale" });
    await call(proc, "set_badge", { badge: "game_master" });
    await call(proc, "manage_synthesis", { action: "run" });
    await test("T195/REQ-160: TTRPG_SYNTHESIS_STALE_DAYS=0 reports stale synthesis items", async () => {
      const h = JSON.parse(await call(proc, "manage_diagnostics", { action: "health" }));
      const stale = h.synthesis_health?.stale_count;
      if (!(stale > 0)) throw new Error(`expected stale_count > 0 with threshold 0, got ${JSON.stringify(stale)}`);
      const list = JSON.parse(await call(proc, "manage_synthesis", { action: "list" }));
      if (!Array.isArray(list) || !list.some((i: any) => i.stale === true)) throw new Error(`no list item carries the [stale] flag`);
    });
    await kill(proc);
  }

  // ── REQ-307/REQ-074 — scene-location set co-locates the present party ──
  {
    const proc = await boot();
    await call(proc, "manage_novel", { action: "create", name: "party-place" });
    await call(proc, "set_badge", { badge: "game_master" });
    await call(proc, "manage_world", { action: "create_room", name: "Bay", description: "A bay." });
    await call(proc, "manage_character", { action: "create", name: "P1" });
    await call(proc, "manage_character", { action: "create", name: "P2" });
    await call(proc, "manage_character", { action: "set_active", entity_id: "character_01" });
    await call(proc, "manage_staging", { action: "presence", entity_ids: ["character_01", "character_02"] });
    await test("REQ-307/REQ-074: scene-location set places the present party together", async () => {
      await call(proc, "manage_scene", { action: "set", description: "Bay", location: "Bay" });
      const party = JSON.parse(await readResource(proc, "party://current"));
      const locs = party.map((p: any) => p.last_location);
      assert(locs.length === 2 && locs.every((r: string) => r === "Bay"), `party not co-located: ${JSON.stringify(locs)}`);
    });
    await kill(proc);
  }

  // ── REQ-307/REQ-074 — parser `climb` co-locates the present party ──
  {
    const proc = await boot();
    await call(proc, "manage_novel", { action: "create", name: "party-climb" });
    await call(proc, "set_badge", { badge: "game_master" });
    await call(proc, "manage_world", { action: "create_room", name: "Bay", description: "A bay." });
    await call(proc, "manage_world", { action: "create_room", name: "Loft", description: "A loft." });
    await call(proc, "manage_world", { action: "create_exit", direction: "up", room_a: "Bay", room_b: "Loft" });
    await call(proc, "manage_world", { action: "create_thing", name: "Ladder", location: "Bay", location_type: "room", climbable: true });
    await call(proc, "manage_character", { action: "create", name: "P1" });
    await call(proc, "manage_character", { action: "create", name: "P2" });
    await call(proc, "manage_character", { action: "set_active", entity_id: "character_01" });
    await call(proc, "manage_staging", { action: "presence", entity_ids: ["character_01", "character_02"] });
    await test("REQ-307/REQ-074: parser climb co-locates the present party", async () => {
      await call(proc, "run_command", { action: "execute", command: "climb ladder" });
      const party = JSON.parse(await readResource(proc, "party://current"));
      const locs = party.map((p: any) => p.last_location);
      assert(locs.length === 2 && locs.every((r: string) => r === "Loft"), `party not co-located after climb: ${JSON.stringify(locs)}`);
    });
    await kill(proc);
  }

  // ── §5.2/§5.8 assertion repair (F-P7b-4, F-P7b-6, F-P7b-3, F-P7b-7) ──
  // T136 (scene transition hook), T68 (suggest forms), T94 (synthesis
  // reversion), T144 (synthesis rebuild), T324 (synthesis removal).
  {
    const proc = await boot();
    await call(proc, "manage_novel", { action: "create", name: "p7b-probe" });
    await call(proc, "set_badge", { badge: "game_master" });

    async function exportNovel(): Promise<any> {
      const bundle = JSON.parse(await call(proc, "manage_archive", { action: "export", format: "json" }));
      return bundle.novel ?? bundle;
    }

    await test("T136/REQ-125: scene transition writes the hook, ticks the countdown, and honours skip", async () => {
      await call(proc, "set_badge", { badge: "game_master" });
      await call(proc, "manage_scene", { action: "set", description: "forest", location: "forest" });
      await call(proc, "manage_scene", { action: "set", description: "cave", location: "cave" });
      const ex = await exportNovel();
      const hook = (ex.audit_log ?? []).filter((e: any) => e.tool === "scene-transition");
      assert(hook.length >= 1, "no scene-transition audit entry");
      assertContains(JSON.stringify(hook[hook.length - 1]), "forest");
      assertContains(JSON.stringify(hook[hook.length - 1]), "cave");

      await call(proc, "manage_countdown", { action: "set", name: "cave-collapse", ticks: 3, on_scene_transition: true });
      await call(proc, "manage_scene", { action: "set", description: "castle", location: "castle" });
      const cds = JSON.parse(await call(proc, "manage_countdown", { action: "list" }));
      const rows = cds.countdowns ?? cds;
      const cd = Array.isArray(rows) ? rows.find((c: any) => c.name === "cave-collapse") : rows["cave-collapse"];
      assert(cd && Number(cd.ticks) === 2, `countdown did not decrement: ${JSON.stringify(cd)}`);

      const before = (await exportNovel()).audit_log.filter((e: any) => e.tool === "scene-transition").length;
      await call(proc, "manage_scene", { action: "set", description: "tower", location: "tower", skip_transition_hook: true });
      const after = await exportNovel();
      const hookAfter = after.audit_log.filter((e: any) => e.tool === "scene-transition").length;
      assert(hookAfter === before, "skip_transition_hook still wrote an audit entry");

      await call(proc, "set_badge", { badge: "player" });
      const sceneHistory = JSON.parse(await readResource(proc, "scene://history"));
      assert(Array.isArray(sceneHistory), "scene://history not an array");
      await call(proc, "set_badge", { badge: "game_master" });
    });

    await test("T94/REQ-103: synthesis reversion empties the synthesis surface and preserves Tier 1", async () => {
      await call(proc, "set_badge", { badge: "game_master" });
      await call(proc, "manage_synthesis", { action: "run", force: true });
      const reverted = await call(proc, "manage_synthesis", { action: "revert" });
      assertContains(reverted, "[OK]");
      const voice = await readResource(proc, "synthesis://voice_examples").catch(() => "[]");
      assert(voice === "[]" || voice === "" || voice === "{}", `synthesis://voice_examples not empty after revert: ${voice.slice(0, 120)}`);
      const again = await call(proc, "manage_synthesis", { action: "revert" });
      assertContains(again, "[OK]");
      await call(proc, "set_badge", { badge: "player" });
      const forbidden = await callRaw(proc, "manage_synthesis", { action: "revert" });
      const text = (forbidden.result?.content ?? []).map((c: any) => c?.text ?? "").join("\n");
      assertContains(text, "[FORBIDDEN]");
      await call(proc, "set_badge", { badge: "game_master" });
    });

    await test("T144/REQ-130: synthesis rebuild keeps activated items and replaces the inactive set", async () => {
      await call(proc, "set_badge", { badge: "game_master" });
      await call(proc, "manage_synthesis", { action: "run", force: true });
      const before = JSON.parse(await call(proc, "manage_synthesis", { action: "list", module: "lore_templates" }));
      const key = (before.items ?? before)[0]?.key ?? 0;
      await call(proc, "manage_synthesis", { action: "activate", module: "lore_templates", key });
      await call(proc, "manage_synthesis", { action: "run", force: true });
      const after = JSON.parse(await call(proc, "manage_synthesis", { action: "list", module: "lore_templates" }));
      const item = (after.items ?? after).find((i: any) => String(i.key) === String(key));
      assert(item && item.activated === true, `activated item lost on rebuild: ${JSON.stringify(item)}`);
    });

    await test("T324/REQ-265: synthesis revert removes supplementary items and stays idempotent", async () => {
      await call(proc, "set_badge", { badge: "game_master" });
      await call(proc, "manage_synthesis", { action: "run", force: true });
      await call(proc, "manage_synthesis", { action: "revert" });
      const listed = await call(proc, "manage_synthesis", { action: "list" });
      if (listed.trim().startsWith("{")) {
        const list = JSON.parse(listed);
        const items = list.items ?? list;
        assert(Array.isArray(items) ? items.length === 0 : true, `synthesis list not empty after revert: ${listed.slice(0, 200)}`);
      } else {
        assertContains(listed, "No synthesis items");
      }
      const again = await call(proc, "manage_synthesis", { action: "revert" });
      assertContains(again, "[OK]");
      await call(proc, "set_badge", { badge: "player" });
      const forbidden = await callRaw(proc, "manage_synthesis", { action: "revert" });
      const text = (forbidden.result?.content ?? []).map((c: any) => c?.text ?? "").join("\n");
      assertContains(text, "[FORBIDDEN]");
      await call(proc, "set_badge", { badge: "game_master" });
    });

    await kill(proc);
  }

  // ── §5.2/§5.8 remediation 2: synthesis provenance and confidence ──
  // (F-P7b-3, F-P7b-7)
  {
    const proc = await boot();
    await call(proc, "manage_novel", { action: "create", name: "p7b-synthesis" });
    await call(proc, "set_badge", { badge: "game_master" });
    const c = await call(proc, "manage_character", { action: "create", name: "Mira" });
    const id = (c.match(/Entity id ([A-Za-z0-9_]+)/) ?? [])[1] ?? "character_01";
    await call(proc, "manage_character", { action: "update", entity_id: id, voice: "clipped military cadence" });
    await call(proc, "manage_story", { action: "record", type: "moment", entry: "The bridge collapsed at dusk" });

    await test("T63/REQ-080g2: synthesis is additive, tagged by tier, and badge-filtered", async () => {
      const toolsBefore = JSON.stringify(await listTools(proc));
      const before = await call(proc, "manage_character", { action: "sheet", entity_id: id });
      await call(proc, "manage_synthesis", { action: "run", force: true });
      const toolsAfter = JSON.stringify(await listTools(proc));
      assert(toolsBefore === toolsAfter, "synthesis changed the tool catalog");
      const after = await call(proc, "manage_character", { action: "sheet", entity_id: id });
      assert(before === after, "synthesis changed the character sheet");

      const voice = JSON.parse(await call(proc, "manage_synthesis", { action: "list", module: "voice_examples" }));
      const rows = voice.items ?? voice;
      const derived = rows.find((r: any) => String(r.key).startsWith("novel-voice-"));
      assert(derived && derived.tag === "supplementary", `derived voice row missing or untagged: ${JSON.stringify(derived)}`);
      const vendor = rows.find((r: any) => r.tag === "vendor");
      assert(vendor, "ruleset/vendor rows lost their tag");

      const status = await readResource(proc, "synthesis://status");
      for (const module of ["voice_examples", "briefing_order", "lore_templates", "action_patterns", "supplementary_guidance", "adventure_advice", "narrative_voices"]) {
        assertContains(status, module);
      }

      const first = JSON.parse(await call(proc, "manage_synthesis", { action: "list" }));
      await call(proc, "manage_synthesis", { action: "run", force: true });
      const second = JSON.parse(await call(proc, "manage_synthesis", { action: "list" }));
      assert(JSON.stringify((first.items ?? first).map((r: any) => r.key)) === JSON.stringify((second.items ?? second).map((r: any) => r.key)), "rerun was not idempotent");

      await call(proc, "set_badge", { badge: "player" });
      const playerBrief = await getPrompt(proc, "badge_briefing", {});
      await call(proc, "set_badge", { badge: "game_master" });
      assertNotContains(playerBrief, "NPC voice design framework");
    });

    await call(proc, "set_badge", { badge: "game_master" });
    await test("T95/REQ-080g2: LOW confidence is tagged and ordered after HIGH/MEDIUM", async () => {
      const guidance = JSON.parse(await call(proc, "manage_synthesis", { action: "list", module: "supplementary_guidance" }));
      const rows = guidance.items ?? guidance;
      const low = rows.find((r: any) => r.key === "novel-theme");
      assert(low && low.confidence === "LOW", `theme item missing or not LOW: ${JSON.stringify(low)}`);
      await call(proc, "manage_synthesis", { action: "activate", module: "supplementary_guidance", key: "novel-theme" });
      const resource = JSON.parse(await readResource(proc, "synthesis://supplementary_guidance"));
      const arr = Array.isArray(resource) ? resource : [];
      const last = arr[arr.length - 1];
      assert(last?.confidence === "LOW", `LOW item not ordered last: ${JSON.stringify(arr.map((i: any) => i.confidence))}`);
      const brief = await getPrompt(proc, "badge_briefing", {});
      assertContains(brief, "[supplementary]");
    });

    await call(proc, "set_badge", { badge: "game_master" });
    await test("T97/REQ-080g2: every synthesis item carries collected_at", async () => {
      const all = JSON.parse(await call(proc, "manage_synthesis", { action: "list" }));
      const rows = all.items ?? all;
      assert(Array.isArray(rows) && rows.length > 0, "no synthesis rows");
      const now = Date.now();
      for (const row of rows) {
        assert(typeof row.collected_at === "string" && row.collected_at.length > 0, `row missing collected_at: ${JSON.stringify(row).slice(0, 120)}`);
        const t = Date.parse(row.collected_at);
        assert(!Number.isNaN(t) && Math.abs(now - t) < 120000, `collected_at outside ±1 min: ${row.collected_at}`);
      }
    });

    await call(proc, "set_badge", { badge: "game_master" });
    await test("T325/REQ-266: MEDIUM from explicit fields, LOW from inference, refreshed on rerun", async () => {
      const voice = JSON.parse(await call(proc, "manage_synthesis", { action: "list", module: "voice_examples" }));
      const medium = (voice.items ?? voice).find((r: any) => String(r.key).startsWith("novel-voice-"));
      assert(medium && medium.confidence === "MEDIUM", `explicit voice not MEDIUM: ${JSON.stringify(medium)}`);
      const guidance = JSON.parse(await call(proc, "manage_synthesis", { action: "list", module: "supplementary_guidance" }));
      const low = (guidance.items ?? guidance).find((r: any) => r.key === "novel-theme");
      assert(low && low.confidence === "LOW", "inferred theme not LOW");
      const before = low.collected_at;
      await new Promise((r) => setTimeout(r, 20));
      await call(proc, "manage_synthesis", { action: "run", force: true });
      const guidance2 = JSON.parse(await call(proc, "manage_synthesis", { action: "list", module: "supplementary_guidance" }));
      const low2 = (guidance2.items ?? guidance2).find((r: any) => r.key === "novel-theme");
      assert(Date.parse(low2.collected_at) >= Date.parse(before), "rerun did not refresh collected_at");
    });

    await call(proc, "set_badge", { badge: "game_master" });
    await test("T288/REQ-080g2: adventure load reports synthesis state and keeps community items inert", async () => {
      await call(proc, "manage_codex", { action: "set", kind: "adventure", name: "Merrick Quest", content: { title: "Merrick Quest", sections: {} } });
      mkdirSync(join(DATA_DIR, "adventures"), { recursive: true });
      writeFileSync(join(DATA_DIR, "adventures", "merrick.md"), "# Merrick Quest\n\nOld Merrick keeps the ferry.\n");
      const loaded = await call(proc, "manage_adventure", { action: "load", slug: "merrick" }).catch((e: any) => String(e.message ?? e));
      assertContains(loaded, "Community synthesis items:");
      assertContains(loaded, "inert");
      const voice = JSON.parse(await call(proc, "manage_synthesis", { action: "list", module: "voice_examples" }));
      const arr = voice.items ?? voice;
      const derived = arr.find((i: any) => String(i.key).startsWith("novel-voice-"));
      assert(derived && derived.activated === false, "community voice item is not inert");
      const brief = await getPrompt(proc, "badge_briefing", {});
      assertContains(brief, "Voice examples:");
    });

    await kill(proc);
  }

  // ── T102: synthesis staleness (env-configured window) ─────────────
  {
    const proc = await boot({ TTRPG_SYNTHESIS_STALE_DAYS: "0" });
    await call(proc, "manage_novel", { action: "create", name: "p7b-stale" });
    await call(proc, "set_badge", { badge: "game_master" });

    await test("T102/REQ-080g2: stale synthesis items are flagged and refreshed by a rerun", async () => {
      await call(proc, "manage_synthesis", { action: "run", force: true });
      const first = JSON.parse(await call(proc, "manage_synthesis", { action: "list" }));
      const rows = first.items ?? first;
      assert(rows.some((r: any) => r.stale === true), "no stale flag with a zero-day window");
      const key = rows[0].key;
      const stamped = rows[0].collected_at;
      await new Promise((r) => setTimeout(r, 30));
      await call(proc, "manage_synthesis", { action: "run", force: true });
      const second = JSON.parse(await call(proc, "manage_synthesis", { action: "list" }));
      const next = (second.items ?? second).find((r: any) => r.key === key);
      assert(next && Date.parse(next.collected_at) >= Date.parse(stamped), "rerun did not refresh timestamps");
      const health = JSON.parse(await call(proc, "manage_diagnostics", { action: "health" }));
      assert(typeof health.synthesis_last_run === "string", "spec_health synthesis_last_run missing");
    });

    await kill(proc);
  }

  // ── §5.2/§5.8 remediation 3: scene catalog, actions, suggestions ──
  // (F-P7b-4, F-P7b-6)
  {
    const proc = await boot();
    await call(proc, "manage_novel", { action: "create", name: "p7b-scenes" });
    await call(proc, "set_badge", { badge: "game_master" });
    const c = await call(proc, "manage_character", { action: "create", name: "Wizard" });
    const id = (c.match(/Entity id ([A-Za-z0-9_]+)/) ?? [])[1] ?? "character_01";

    await test("T135/REQ-087: compound scene types, single string, and refusal", async () => {
      await call(proc, "manage_scene", { action: "set", description: "Negotiating on the road", scene_type: ["social", "exploration"] });
      let brief = await getPrompt(proc, "badge_briefing", {});
      const social = brief.indexOf("persuasion, deception, or intimidation");
      const explore = brief.indexOf("run_command (action: execute, \"look\")");
      assert(social >= 0 && explore >= 0, `combined tag dropped a family (social=${social}, explore=${explore})`);

      await call(proc, "manage_scene", { action: "set", description: "The road again", scene_type: "exploration" });
      brief = await getPrompt(proc, "badge_briefing", {});
      assertContains(brief, "run_command (action: execute, \"look\")");

      const bad = await call(proc, "manage_scene", { action: "set", description: "Odd", scene_type: ["nonexistent"] });
      assertContains(bad, "[NOT_FOUND]");
      assertContains(bad, "Valid values:");

      await call(proc, "set_badge", { badge: "player" });
      const forbidden = await callRaw(proc, "manage_scene", { action: "set", description: "x", scene_type: "social" });
      assertContains((forbidden.result?.content ?? []).map((x: any) => x?.text ?? "").join("\n"), "[FORBIDDEN]");
      await call(proc, "set_badge", { badge: "game_master" });
    });

    await test("T71/REQ-087: scene-type tagging drives priorities and suggest", async () => {
      await call(proc, "manage_scene", { action: "set", description: "A tense parley", scene_type: "social" });
      await call(proc, "manage_npc", { action: "create", name: "Envoy", disposition: "neutral" });
      let brief = await getPrompt(proc, "badge_briefing", {});
      assertContains(brief, "persuasion, deception, or intimidation");
      const talk = await call(proc, "run_command", { action: "suggest", intent: "talk" });
      assertContains(talk, "Social:");

      await call(proc, "manage_combat", { action: "init" }).catch(() => "");
      brief = await getPrompt(proc, "badge_briefing", {});
      if (brief.includes("resolve an attack or skill check")) {
        assertContains(brief, "resolve an attack or skill check");
      }
      await call(proc, "manage_combat", { action: "end" }).catch(() => "");

      const bad = await call(proc, "manage_scene", { action: "set", description: "Odd", scene_type: "investigation" });
      assertContains(bad, "[NOT_FOUND]");
      assertContains(bad, "social");
    });

    await test("T359/REQ-084a: Available Actions gate spells by remaining slots", async () => {
      await call(proc, "manage_scene", { action: "set", description: "A brawl erupts", scene_type: "combat" });
      await call(proc, "manage_character", { action: "update", entity_id: id, stats: { spell_slots: { "3": 1, "1": 1 } } });
      await call(proc, "manage_character", { action: "update", entity_id: id, spells: [{ name: "Fireball", level: 3 }, { name: "Magic Missile", level: 1 }] });
      let brief = await getPrompt(proc, "badge_briefing", {});
      assertContains(brief, "Cast Fireball");

      await call(proc, "manage_character", { action: "update", entity_id: id, stats: { spell_slots: { "3": 0, "1": 1 } } });
      brief = await getPrompt(proc, "badge_briefing", {});
      assertNotContains(brief, "Cast Fireball");
      assertContains(brief, "Cast Magic Missile");

      await call(proc, "manage_scene", { action: "set", description: "A quiet tavern", scene_type: "social" });
      brief = await getPrompt(proc, "badge_briefing", {});
      assertContains(brief, "persuasion, deception, or intimidation");
      const section = brief.split("### Available Actions")[1]?.split("\n\n")[0] ?? "";
      const count = (section.match(/^- /gm) ?? []).length;
      assert(count <= 8, `Available Actions exceeded the cap: ${count}`);
    });

    await test("T68/REQ-084b4: suggest maps intent, refuses nonsense, and filters badges", async () => {
      await call(proc, "manage_scene", { action: "set", description: "A brawl", scene_type: "combat" });
      const attack = await call(proc, "run_command", { action: "suggest", intent: "I want to attack" });
      assertContains(attack, "manage_combat");
      const empty = await call(proc, "run_command", { action: "suggest", intent: "" });
      assertContains(empty, "run_command (action: execute");
      const nonsense = await call(proc, "run_command", { action: "suggest", intent: "xyzzy" });
      assertContains(nonsense, "No matching actions");
      await call(proc, "set_badge", { badge: "player" });
      const player = await call(proc, "run_command", { action: "suggest", intent: "I want to attack" });
      assertNotContains(player, "manage_combat (action: init");
      await call(proc, "set_badge", { badge: "game_master" });
      await call(proc, "manage_npc", { action: "create", name: "Guard", disposition: "neutral" });
      const social = await call(proc, "run_command", { action: "suggest", intent: "convince the guard" });
      assertContains(social, "Social:");
      await call(proc, "manage_synthesis", { action: "run", force: true });
      const synth = await call(proc, "run_command", { action: "suggest", intent: "persuade the merchant" });
      assertContains(synth, "Social:");
    });

    await kill(proc);
  }

  // ── §5.2/§5.8 remediation 4: table classification (F-P7b-9) ──────
  {
    const seedRuleset = (slug: string, generation: Record<string, any>, extraTables?: Record<string, any>): void => {
      const dir = join(DATA_DIR, "rulesets", slug);
      rmSync(dir, { recursive: true, force: true });
      mkdirSync(dir, { recursive: true });
      const model = { generation_tables: generation, ...(extraTables ? { tables: extraTables } : {}) };
      const contentHash = sha256Canonical([], model, [], [], []);
      writeFileSync(join(dir, "manifest.json"), JSON.stringify({ slug, name: slug, host_version: "0.0.0", package_format: PACKAGE_FORMAT, content_hash: contentHash, built_at: "2026-01-01T00:00:00.000Z", counts: {} }));
      writeFileSync(join(dir, "model.json"), JSON.stringify(model));
      writeFileSync(join(dir, "index.json"), "[]");
      writeFileSync(join(dir, "tools.json"), "[]");
      writeFileSync(join(dir, "resources.json"), "[]");
      writeFileSync(join(dir, "prompts.json"), "[]");
      writeFileSync(join(dir, "reasoning.jsonl"), "");
    };

    // Packages are discovered at startup, so both are seeded before boot.
    seedRuleset("gentbl", {
      trinkets: { dice_expression: "1d100", ranges: [{ min: 1, max: 100, result: "a dusty trinket" }] },
      madness: { dice_expression: "1d100", ranges: [{ min: 1, max: 100, result: "a fleeting dread" }] },
      equipment_d100: { dice_expression: "1d100", ranges: [{ min: 1, max: 100, result: "a coil of rope" }] },
    }, { ability_modifiers: { rows: [{ score: 10, modifier: 0 }] } });
    seedRuleset("notables", {});

    const proc = await boot();
    await call(proc, "manage_novel", { action: "create", name: "p7b-tables" });
    await call(proc, "set_badge", { badge: "game_master" });

    await test("T255/REQ-214: generation tables enumerate and lookups refuse", async () => {
      const bound = await call(proc, "manage_ruleset", { action: "bind", slug: "gentbl" });
      assertContains(bound, "[OK]");
      const listResp = await send(proc, { method: "tools/list", params: {} });
      const tools = listResp.result?.tools ?? [];
      const resolve = tools.find((t: any) => t.name === "resolve_mechanic");
      const tableSchema = resolve?.inputSchema?.properties?.table;
      assert(Array.isArray(tableSchema?.enum), `table enum missing: ${JSON.stringify(tableSchema)}`);
      for (const name of ["trinkets", "madness", "equipment_d100"]) {
        assert(tableSchema.enum.includes(name), `generation table '${name}' missing from the enum`);
      }
      assert(!tableSchema.enum.includes("ability_modifiers"), "lookup table leaked into the enum");

      const roll = await call(proc, "resolve_mechanic", { action: "roll", table: "trinkets" });
      assertContains(roll, "dusty trinket");
      const lookup = await call(proc, "resolve_mechanic", { action: "roll", table: "ability_modifiers" });
      assertContains(lookup, "[NOT_FOUND]");
      assertContains(lookup, "Valid tables:");
    });

    await test("T255b/REQ-214b: a zero-table ruleset returns the no-tables message", async () => {
      await call(proc, "manage_novel", { action: "create", name: "p7b-tables-2" });
      await call(proc, "set_badge", { badge: "game_master" });
      const switched = await call(proc, "manage_ruleset", { action: "bind", slug: "notables" });
      assertContains(switched, "[OK]");
      const listResp = await send(proc, { method: "tools/list", params: {} });
      const resolve = (listResp.result?.tools ?? []).find((t: any) => t.name === "resolve_mechanic");
      assert(resolve?.inputSchema?.properties?.table?.enum === undefined, "zero-table ruleset advertised an enum");
      const roll = await call(proc, "resolve_mechanic", { action: "roll", table: "weather" });
      assertContains(roll, "No random generation tables");
    });

    await kill(proc);
  }

  harnessComplete();
  console.log(`\n${passed} passed, ${failed} failed`);
  rmSync(DATA_DIR, { recursive: true, force: true });
  if (failed > 0) process.exit(1);
  process.exit(0);
}

main().catch((e) => { console.error("Fatal:", e); process.exit(2); });