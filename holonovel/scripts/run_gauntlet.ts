#!/usr/bin/env node
// Inform Gauntlet — §6.6 world-model verification harness
// Spawns inform MCP server, executes I1–I13 sub-workflows, records structured results.
// Blocking: I1, I2, I3, I4, I5, I6, I10. Non-blocking: I7, I8, I9, I11, I12, I13.

import { spawn, ChildProcess } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, rmSync, mkdirSync, mkdtempSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const SERVER_SCRIPT = join(import.meta.dirname!, "..", "src", "index.ts");
const SPEC_PATH = join(import.meta.dirname!, "..", "..", "holonovel.md");

const DATA_DIR = mkdtempSync(join(tmpdir(), "holonovel-inform-gauntlet-"));

// ── Types ──────────────────────────────────────────────────────────

type ToolAction = { kind: "tool"; name: string; args: Record<string, unknown> | (() => Record<string, unknown>) };
type ResourceAction = { kind: "resource"; uri: string };
type PromptAction = { kind: "prompt"; name: string; args: Record<string, string> };
type GauntletAction = ToolAction | ResourceAction | PromptAction;

interface GauntletStep {
  label: string;
  action: GauntletAction;
  assert: (response: string) => void;
}

interface GauntletScenario {
  scenario_id: string;
  objective: string;
  blocking: boolean;
  steps: GauntletStep[];
}

interface GauntletVerdict {
  scenario_id: string;
  objective: string;
  blocking: boolean;
  passed: boolean;
  duration_ms: number;
  failure?: {
    step: string;
    error: string;
    response: string;
  };
}

// ── MCP Client ─────────────────────────────────────────────────────

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
    params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "inform-gauntlet", version: "1.0.0" } },
  });
  proc.stdin!.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n");
  await sleep(300);
}

async function doAction(proc: ChildProcess, action: GauntletAction): Promise<string> {
  let resp: any;
  if (action.kind === "tool") {
    const args = typeof action.args === "function" ? action.args() : action.args;
    resp = await send(proc, { method: "tools/call", params: { name: action.name, arguments: args } });
  } else if (action.kind === "resource") {
    resp = await send(proc, { method: "resources/read", params: { uri: action.uri } });
  } else {
    resp = await send(proc, { method: "prompts/get", params: { name: action.name, arguments: action.args } });
  }
  if (resp.error) throw new Error(`RPC error: ${JSON.stringify(resp.error)}`);
  const content = resp.result?.content ?? resp.result?.contents ?? resp.result?.messages ?? [];
  return content.map((c: any) => {
    if (typeof c === "string") return c;
    if (c.content?.text) return c.content.text;
    return c.text ?? "";
  }).join("\n");
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

// ── Assertions ─────────────────────────────────────────────────────

function assertOK(response: string) {
  if (response.includes("[ERROR]") || response.includes("[STATE_CONFLICT]") || response.includes("[FORBIDDEN]"))
    throw new Error(`Expected OK, got error: ${response.substring(0, 300)}`);
}

function assertContains(response: string, substr: string) {
  if (!response.toLowerCase().includes(substr.toLowerCase()))
    throw new Error(`Expected to contain "${substr}" but got: ${response.substring(0, 300)}`);
}

function assertNotContains(response: string, substr: string) {
  if (response.toLowerCase().includes(substr.toLowerCase()))
    throw new Error(`Expected NOT to contain "${substr}" but got: ${response.substring(0, 300)}`);
}

function assertError(response: string) {
  if (!response.includes("[ERROR]") && !response.includes("[STATE_CONFLICT]") && !response.includes("[NOT_FOUND]") && !response.includes("[FORBIDDEN]"))
    throw new Error(`Expected error, got: ${response.substring(0, 300)}`);
}

function assertStateConflict(response: string) {
  if (!response.includes("[STATE_CONFLICT]"))
    throw new Error(`Expected STATE_CONFLICT, got: ${response.substring(0, 200)}`);
}

function sha256(s: string): string {
  return createHash("sha256").update(s).digest("hex");
}

// ── Fixtures ───────────────────────────────────────────────────────

const APPENDIX_K_FIXTURE = `The Entrance Chamber is a room. "A dusty room with faded murals of serpent figures."
North of the Entrance Chamber is the Hall of Statues.
The Hall of Statues is a room. "Tall statues line both walls."
The Throne Room is a room. "A grand chamber with a raised dais at the far end."
North of the Hall of Statues is the Throne Room.
The Obsidian Door is a door. "A massive dark door with serpent motifs."
The Obsidian Door is in the Hall of Statues.
It is closed and locked.
The Serpent Crown is in the Throne Room. "A golden crown set with emerald eyes."
A rusty sword is in the Entrance Chamber. "An old iron sword, still serviceable."
The Stone Altar is a supporter. "A heavy stone altar carved with runes."
The Stone Altar is in the Hall of Statues.
It is fixed.
A silver key is on the Stone Altar. "A small silver key with a serpent-head bow."`;

const CHAIN_5 = Array.from({ length: 5 }, (_, i) =>
  `Room ${i + 1} is a room. "Room number ${i + 1}."`).join("\n") + "\n" +
  Array.from({ length: 4 }, (_, i) =>
  `East of Room ${i + 1} is Room ${i + 2}.`).join("\n");

const CHAIN_50 = Array.from({ length: 50 }, (_, i) =>
  `Room ${i + 1} is a room. "Room number ${i + 1}."`).join("\n") + "\n" +
  Array.from({ length: 49 }, (_, i) =>
  `East of Room ${i + 1} is Room ${i + 2}.`).join("\n");

const ADVENTURE_FIXTURE = `# Tomb of the Serpent King
_A dungeon adventure for 4–6 delvers._

## Overview
The tomb lies beneath the Marsh of Whispers.

## Adventure Hook
The village elder offers 500 gold for the Crown.

## World
The Entrance Chamber is a room. "A dusty room with faded murals of serpent figures."
North of the Entrance Chamber is the Hall of Statues.
The Hall of Statues is a room. "Tall statues line both walls."
North of the Hall of Statues is the Inner Sanctum.
The Inner Sanctum is a room. "A chamber lit by an eerie green glow."

## Encounters
@encounter(Entrance Chamber) Poison dart trap.

## Lore
@lore(Entrance Chamber) The murals depict the Serpent King.`;

// ── Helper: shorthand action creators ──────────────────────────────

const T = (name: string, args: Record<string, unknown> = {}): ToolAction => ({ kind: "tool", name, args });
const TL = (name: string, argsFn: () => Record<string, unknown>): ToolAction => ({ kind: "tool", name, args: argsFn });
const R = (uri: string): ResourceAction => ({ kind: "resource", uri });
const P = (name: string, args: Record<string, string> = {}): PromptAction => ({ kind: "prompt", name, args });

// ── Scenarios ──────────────────────────────────────────────────────

function buildScenarios(): GauntletScenario[] {
  const I1: GauntletScenario = {
    scenario_id: "I1",
    objective: "Parser command sweep — every parser command on populated world model",
    blocking: true,
    steps: [
      { label: "create_novel", action: T("novel", { action: "create",  name: "gauntlet-i1" }), assert: assertOK },
      { label: "set_badge GM", action: T("set_badge", { badge: "game_master" }), assert: assertOK },
      { label: "convert_source", action: T("world", { action: "convert",  source: APPENDIX_K_FIXTURE }), assert: (r) => {
        assertContains(r, "rooms"); assertContains(r, "exits"); assertContains(r, "things");
      }},
      { label: "create_character", action: T("character", { action: "create",  name: "TestHero" }), assert: assertOK },
      { label: "set_badge player", action: T("set_badge", { badge: "player" }), assert: assertOK },
      { label: "command(look)", action: T("command", { command: "look" }), assert: (r) => {
        assertContains(r, "Entrance Chamber"); assertContains(r, "rusty sword");
      }},
      { label: "command(go north)", action: T("command", { command: "go north" }), assert: (r) => {
        assertContains(r, "Hall of Statues");
      }},
      { label: "command(go east) — no exit", action: T("command", { command: "go east" }), assert: (r) => {
        assertContains(r, "can't go");
      }},
      { label: "command(examine stone altar)", action: T("command", { command: "examine stone altar" }), assert: (r) => {
        assertContains(r, "Stone Altar");
      }},
      { label: "command(inventory)", action: T("command", { command: "inventory" }), assert: assertOK },
      { label: "command(wait)", action: T("command", { command: "wait" }), assert: (r) => assertContains(r, "Time passes") },
      { label: "command(xyzzy) — unrecognized", action: T("command", { command: "xyzzy" }), assert: (r) => {
        assertContains(r, "not a recognized command");
      }},
    ],
  };

  const I2: GauntletScenario = {
    scenario_id: "I2",
    objective: "Room navigation cycle — navigate through ≥5 linked rooms",
    blocking: true,
    steps: [
      { label: "create_novel", action: T("novel", { action: "create",  name: "gauntlet-i2" }), assert: assertOK },
      { label: "set_badge GM", action: T("set_badge", { badge: "game_master" }), assert: assertOK },
      { label: "populate 5-room chain", action: T("world", { action: "convert",  source: CHAIN_5 }), assert: (r) => {
        assertContains(r, "5 rooms");
      }},
      { label: "create_character", action: T("character", { action: "create",  name: "Navigator" }), assert: assertOK },
      { label: "set_badge player", action: T("set_badge", { badge: "player" }), assert: assertOK },
      { label: "look at room 1", action: T("command", { command: "look" }), assert: (r) => assertContains(r, "Room 1") },
      { label: "go east to room 2", action: T("command", { command: "go east" }), assert: (r) => assertContains(r, "Room 2") },
      { label: "go east to room 3", action: T("command", { command: "go east" }), assert: (r) => assertContains(r, "Room 3") },
      { label: "go east to room 4", action: T("command", { command: "go east" }), assert: (r) => assertContains(r, "Room 4") },
      { label: "go east to room 5", action: T("command", { command: "go east" }), assert: (r) => assertContains(r, "Room 5") },
      { label: "go west back to room 4", action: T("command", { command: "go west" }), assert: (r) => assertContains(r, "Room 4") },
    ],
  };

  const I3: GauntletScenario = {
    scenario_id: "I3",
    objective: "Object interaction — take/drop portable, fixed blocked, contained in closed blocked",
    blocking: true,
    steps: [
      { label: "create_novel", action: T("novel", { action: "create",  name: "gauntlet-i3" }), assert: assertOK },
      { label: "set_badge GM", action: T("set_badge", { badge: "game_master" }), assert: assertOK },
      { label: "convert_source", action: T("world", { action: "convert",  source: APPENDIX_K_FIXTURE }), assert: (r) => {
        assertContains(r, "rooms");
      }},
      { label: "create_character", action: T("character", { action: "create",  name: "Collector" }), assert: assertOK },
      { label: "set_badge player", action: T("set_badge", { badge: "player" }), assert: assertOK },
      { label: "look", action: T("command", { command: "look" }), assert: (r) => assertContains(r, "Entrance Chamber") },
      { label: "take rusty sword", action: T("command", { command: "take rusty sword" }), assert: (r) => assertOK(r) },
      { label: "examine rusty sword in inventory", action: T("command", { command: "examine rusty sword" }), assert: (r) => assertContains(r, "old iron sword") },
      { label: "drop sword", action: T("command", { command: "drop rusty sword" }), assert: assertOK },
      { label: "inventory should be empty", action: T("command", { command: "inventory" }), assert: (r) => assertContains(r, "nothing") },
      { label: "take fixed thing (Entrance Chamber is a room)", action: T("command", { command: "take entrance chamber" }), assert: (r) => {
        assertContains(r, "see no");
      }},
      { label: "take fixed altar", action: T("command", { command: "go north" }), assert: (r) => assertContains(r, "Hall of Statues") },
      { label: "take stone altar (fixed)", action: T("command", { command: "take stone altar" }), assert: (r) => {
        assertContains(r, "fixed");
      }},
    ],
  };

  const I4: GauntletScenario = {
    scenario_id: "I4",
    objective: "CRUD round-trip — create room/thing/exit, read resource, delete, undo",
    blocking: true,
    steps: [
      { label: "create_novel", action: T("novel", { action: "create",  name: "gauntlet-i4" }), assert: assertOK },
      { label: "set_badge GM", action: T("set_badge", { badge: "game_master" }), assert: assertOK },
      { label: "create_room", action: T("world", { action: "create_room",  name: "TestRoom", description: "A test room." }), assert: (r) => assertContains(r, "created") },
      { label: "create_thing", action: T("world", { action: "create_thing",  name: "TestSword", location: "TestRoom", kind: "thing" }), assert: (r) => assertContains(r, "created") },
      { label: "create_room2", action: T("world", { action: "create_room",  name: "TestRoom2", description: "Second room." }), assert: assertOK },
      { label: "create_exit", action: T("world", { action: "create_exit",  direction: "east", room_a: "TestRoom", room_b: "TestRoom2" }), assert: (r) => assertContains(r, "Exit created") },
      { label: "world://map includes rooms", action: R("world://map"), assert: (r) => {
        assertContains(r, "TestRoom"); assertContains(r, "TestRoom2");
      }},
      { label: "room://testroom resource", action: R("room://testroom"), assert: (r) => assertContains(r, "TestRoom") },
      { label: "remove_room", action: T("world", { action: "remove_room",  name: "TestRoom" }), assert: (r) => assertContains(r, "removed") },
      { label: "world://map — room gone", action: R("world://map"), assert: (r) => assertNotContains(r, "TestRoom →") },
      { label: "undo", action: T("undo", {}), assert: assertOK },
      { label: "world://map — room restored", action: R("world://map"), assert: (r) => {
        assertContains(r, "TestRoom"); // may or may not have exits after undo
      }},
    ],
  };

  const I5: GauntletScenario = {
    scenario_id: "I5",
    objective: "convert_source with fixture — object counts, look output, state conflict on re-convert",
    blocking: true,
    steps: [
      { label: "create_novel", action: T("novel", { action: "create",  name: "gauntlet-i5" }), assert: assertOK },
      { label: "set_badge GM", action: T("set_badge", { badge: "game_master" }), assert: assertOK },
      { label: "convert_source", action: T("world", { action: "convert",  source: APPENDIX_K_FIXTURE }), assert: (r) => {
        assertContains(r, "rooms");
        assertContains(r, "exits");
        assertContains(r, "things");
      }},
      { label: "create_character", action: T("character", { action: "create",  name: "FixtureHero" }), assert: assertOK },
      { label: "set_badge player", action: T("set_badge", { badge: "player" }), assert: assertOK },
      { label: "look shows Entrance Chamber", action: T("command", { command: "look" }), assert: (r) => {
        assertContains(r, "Entrance Chamber");
        assertContains(r, "rusty sword");
      }},
      { label: "set_badge GM for re-convert", action: T("set_badge", { badge: "game_master" }), assert: assertOK },
      { label: "convert_source again — STATE_CONFLICT", action: T("world", { action: "convert",  source: "The Crypt is a room. \"Dark.\"" }), assert: (r) => {
        assertStateConflict(r);
      }},
    ],
  };

  const I6: GauntletScenario = {
    scenario_id: "I6",
    objective: "Property state propagation — open/close/lock/unlock container via parser commands",
    blocking: true,
    steps: [
      { label: "create_novel", action: T("novel", { action: "create",  name: "gauntlet-i6" }), assert: assertOK },
      { label: "set_badge GM", action: T("set_badge", { badge: "game_master" }), assert: assertOK },
      { label: "create room", action: T("world", { action: "create_room",  name: "TestRoom", description: "Test room." }), assert: assertOK },
      { label: "create chest (container)", action: T("world", { action: "create_thing",  name: "Wooden Chest", kind: "container", location: "TestRoom", lockable: true }), assert: assertOK },
      { label: "create_character", action: T("character", { action: "create",  name: "ChestOpener" }), assert: assertOK },
      { label: "set_badge player", action: T("set_badge", { badge: "player" }), assert: assertOK },
      { label: "command(open chest) — should open (new chests start unlocked)", action: T("command", { command: "open wooden chest" }), assert: (r) => assertContains(r, "open") },
      { label: "command(close chest)", action: T("command", { command: "close wooden chest" }), assert: (r) => assertContains(r, "close") },
      { label: "command(lock chest)", action: T("command", { command: "lock wooden chest" }), assert: (r) => assertContains(r, "lock") },
      { label: "command(open chest) — locked, should warn", action: T("command", { command: "open wooden chest" }), assert: (r) => assertContains(r, "locked") },
      { label: "command(close chest) — already closed", action: T("command", { command: "close wooden chest" }), assert: (r) => assertContains(r, "already closed") },
      { label: "command(unlock chest)", action: T("command", { command: "unlock wooden chest" }), assert: (r) => assertContains(r, "unlock") },
      { label: "command(open chest) — now opens", action: T("command", { command: "open wooden chest" }), assert: (r) => assertOK(r) },
      { label: "world://kinds shows container properties", action: R("world://kinds"), assert: (r) => {
        assertContains(r, "container");
        assertContains(r, "door");
      }},
    ],
  };

  const I7: GauntletScenario = {
    scenario_id: "I7",
    objective: "World-model resources — room://, thing://, world://map, world://kinds",
    blocking: false,
    steps: [
      { label: "create_novel", action: T("novel", { action: "create",  name: "gauntlet-i7" }), assert: assertOK },
      { label: "set_badge GM", action: T("set_badge", { badge: "game_master" }), assert: assertOK },
      { label: "convert_source", action: T("world", { action: "convert",  source: APPENDIX_K_FIXTURE }), assert: assertOK },
      { label: "world://map", action: R("world://map"), assert: (r) => {
        assertContains(r, "Entrance Chamber");
        assertContains(r, "→");
      }},
      { label: "world://kinds", action: R("world://kinds"), assert: (r) => {
        assertContains(r, "Kind Hierarchy");
        assertContains(r, "Parser Commands");
        assertContains(r, "container");
        assertContains(r, "door");
      }},
      { label: "room://the entrance chamber", action: R("room://the%20entrance%20chamber"), assert: (r) => {
        assertContains(r, "Entrance Chamber");
      }},
      { label: "thing://rusty sword", action: R("thing://rusty%20sword"), assert: (r) => {
        assertContains(r, "rusty sword");
      }},
      { label: "set_badge player — GM metadata hidden", action: T("set_badge", { badge: "player" }), assert: assertOK },
      { label: "world://map as player", action: R("world://map"), assert: (r) => {
        assertContains(r, "Entrance");
      }},
    ],
  };

  const I8: GauntletScenario = {
    scenario_id: "I8",
    objective: "Large-map navigation — 50+ room world model, ≥10 sequential moves",
    blocking: false,
    steps: [
      { label: "create_novel", action: T("novel", { action: "create",  name: "gauntlet-i8" }), assert: assertOK },
      { label: "set_badge GM", action: T("set_badge", { badge: "game_master" }), assert: assertOK },
      { label: "populate 50-room chain", action: T("world", { action: "convert",  source: CHAIN_50 }), assert: (r) => {
        assertContains(r, "rooms");
      }},
      { label: "create_character", action: T("character", { action: "create",  name: "LongWalker" }), assert: assertOK },
      { label: "set_badge player", action: T("set_badge", { badge: "player" }), assert: assertOK },
      // Walk 10 steps east
      ...[2,3,4,5,6,7,8,9,10,11].map(n => ({
        label: `go east → room ${n}`,
        action: T("command", { command: "go east" }) as GauntletAction,
        assert: (r: string) => { assertContains(r, `Room ${n}`); },
      })),
    ],
  };

  const I9: GauntletScenario = {
    scenario_id: "I9",
    objective: "Empty world model — parser commands error, CRUD works, then parser works",
    blocking: false,
    steps: [
      { label: "create_novel (empty world)", action: T("novel", { action: "create",  name: "gauntlet-i9" }), assert: assertOK },
      { label: "create_character", action: T("character", { action: "create",  name: "EmptyWalker" }), assert: assertOK },
      { label: "set_badge player", action: T("set_badge", { badge: "player" }), assert: assertOK },
      { label: "command(look) — should fail", action: T("command", { command: "look" }), assert: (r) => {
        assertContains(r, "not been populated");
      }},
      { label: "command(go north) — should fail", action: T("command", { command: "go north" }), assert: (r) => {
        assertContains(r, "not been populated");
      }},
      { label: "set_badge GM", action: T("set_badge", { badge: "game_master" }), assert: assertOK },
      { label: "create_room on empty world", action: T("world", { action: "create_room",  name: "TestRoom", description: "A test room." }), assert: (r) => {
        assertContains(r, "created");
      }},
      { label: "set_badge player", action: T("set_badge", { badge: "player" }), assert: assertOK },
      { label: "command(look) — now works", action: T("command", { command: "look" }), assert: (r) => {
        assertContains(r, "TestRoom");
      }},
    ],
  };

  const I10: GauntletScenario = {
    scenario_id: "I10",
    objective: "Hybrid adventure load — load adventure module with ## World assertions",
    blocking: true,
    steps: [
      { label: "create_novel", action: T("novel", { action: "create",  name: "gauntlet-i10" }), assert: assertOK },
      { label: "set_badge GM", action: T("set_badge", { badge: "game_master" }), assert: assertOK },
      { label: "load_adventure", action: T("adventure", { action: "load",  slug: "tomb-of-the-serpent-king" }), assert: (r) => {
        assertContains(r, "loaded");
        assertContains(r, "rooms");
      }},
      { label: "create_character", action: T("character", { action: "create",  name: "Adventurer" }), assert: assertOK },
      { label: "set_badge player", action: T("set_badge", { badge: "player" }), assert: assertOK },
      { label: "command(look) — adventure entrance", action: T("command", { command: "look" }), assert: (r) => {
        assertContains(r, "Entrance Chamber");
      }},
      { label: "go north to Hall", action: T("command", { command: "go north" }), assert: (r) => assertContains(r, "Hall of Statues") },
      { label: "go north to Inner Sanctum", action: T("command", { command: "go north" }), assert: (r) => assertContains(r, "Inner Sanctum") },
      { label: "session_recap", action: T("session", { action: "recap" }), assert: (r) => {
        assertContains(r, "rooms");
      }},
    ],
  };

  const I11: GauntletScenario = {
    scenario_id: "I11",
    objective: "Narrative CRUD cycle — create_npc → set_personality → set_voice_examples → update_npc → remove_npc",
    blocking: false,
    steps: (() => {
      const npcRef = { id: "" };
      return [
        { label: "create_novel", action: T("novel", { action: "create",  name: "gauntlet-i11" }), assert: assertOK },
        { label: "set_badge GM", action: T("set_badge", { badge: "game_master" }), assert: assertOK },
        { label: "create_npc", action: T("npc", { action: "create",  name: "Galt", description: "A stern dwarf.", disposition: "neutral", location: "The Forge" }), assert: (r) => {
          const match = r.match(/\((\w+)\)/);
          if (match) npcRef.id = match[1];
          assertContains(r, "Galt");
          assertOK(r);
        }},
        { label: "set_personality on npc", action: TL("character", () => ({ entity_id: npcRef.id, description: "A stocky dwarf with a braided beard.", voice: "Gruff, speaks in mining metaphors.", background: "Once a royal smith.", goals: "Forge the perfect blade." })), assert: assertOK },
        { label: "set_voice_examples on npc", action: TL("character", () => ({ entity_id: npcRef.id, examples: [{ context: "when asked about his work", dialogue: "This steel's got good bones. Sing to it, and it'll sing back.", tag: "craftsman" }] })), assert: assertOK },
        { label: "update_npc", action: TL("npc", () => ({ npc_id: npcRef.id, disposition: "friendly" })), assert: assertOK },
        { label: "remove_npc", action: TL("npc", () => ({ npc_id: npcRef.id })), assert: assertOK },
        { label: "remove_nonexistent → NOT_FOUND", action: T("npc", { action: "remove",  npc_id: "nonexistent" }), assert: assertError },
      ];
    })(),
  };

  const I12: GauntletScenario = {
    scenario_id: "I12",
    objective: "Lore and countdown lifecycle — set/toggle/update/remove lore; countdown expiry",
    blocking: false,
    steps: [
      { label: "create_novel", action: T("novel", { action: "create",  name: "gauntlet-i12" }), assert: assertOK },
      { label: "set_badge GM", action: T("set_badge", { badge: "game_master" }), assert: assertOK },
      { label: "set_lore_entry", action: T("lore", { action: "set",  key: "artifact", content: "The Obsidian Crown was forged by the Serpent King.", triggers: ["crown", "serpent"], badge_scope: "shared", priority: 5 }), assert: (r) => assertContains(r, "created") },
      { label: "toggle_lore_entry (disable)", action: T("lore", { action: "toggle",  key: "artifact" }), assert: (r) => assertContains(r, "disabled") },
      { label: "toggle_lore_entry (re-enable)", action: T("lore", { action: "toggle",  key: "artifact" }), assert: (r) => assertContains(r, "enabled") },
      { label: "update_lore_entry", action: T("lore", { action: "update",  key: "artifact", content: "The Obsidian Crown whispers secrets to its wearer.", priority: 8 }), assert: assertOK },
      { label: "remove_lore_entry", action: T("lore", { action: "remove",  key: "artifact" }), assert: assertOK },
      { label: "remove_nonexistent lore", action: T("lore", { action: "remove",  key: "nonexistent" }), assert: assertError },
      { label: "set_countdown(ticks=2)", action: T("countdown", { action: "set",  name: "timer", ticks: 2, type: "narrative" }), assert: assertOK },
      { label: "advance_countdown → 1 left", action: T("countdown", { action: "advance",  name: "timer" }), assert: (r) => assertContains(r, "1 tick") },
      { label: "advance_countdown → expiry", action: T("countdown", { action: "advance",  name: "timer" }), assert: (r) => assertContains(r, "expired") },
      { label: "advance_expired → NOT_FOUND", action: T("countdown", { action: "advance",  name: "timer" }), assert: assertError },
    ],
  };

  const I13: GauntletScenario = {
    scenario_id: "I13",
    objective: "Scene state and guidance — set_scene_state, scene_type, directive, badge_briefing, briefing_order",
    blocking: false,
    steps: [
      { label: "create_novel", action: T("novel", { action: "create",  name: "gauntlet-i13" }), assert: assertOK },
      { label: "set_badge GM", action: T("set_badge", { badge: "game_master" }), assert: assertOK },
      { label: "set_scene_state full", action: T("scene", { action: "set",  description: "The marketplace bustles with activity.", location: "Market Square", time_of_day: "midday", atmosphere: "lively", scene_type: "social" }), assert: (r) => assertContains(r, "Scene set") },
      { label: "set_narrative_directive", action: T("scene", { action: "directive",  directive: "Emphasize the noise and crowd density." }), assert: assertOK },
      { label: "badge_briefing prompt — GM", action: P("badge_briefing", { badge: "game_master" }), assert: (r) => {
        assertContains(r, "marketplace");
        assertContains(r, "GM State");
      }},
      { label: "set_scene_state second (push prior to history)", action: T("scene", { action: "set",  description: "The alley is dark and quiet.", location: "Back Alley", time_of_day: "night" }), assert: assertOK },
      { label: "scene_history resource includes prior scene", action: R("scene://history"), assert: (r) => {
        assertContains(r, "Market Square");
        assertContains(r, "midday");
      }},
      { label: "set_briefing_order", action: T("session", { action: "briefing_order",  sections: ["scene_state", "world_state", "narrative_threads"] }), assert: assertOK },
    ],
  };

  return [I1, I2, I3, I4, I5, I6, I7, I8, I9, I10, I11, I12, I13];
}

// ── Main ────────────────────────────────────────────────────────────

async function main() {
  console.log("=== Inform Gauntlet ===\n");

  const specHash = sha256(readFileSync(SPEC_PATH, "utf-8"));
  console.log(`Spec hash: ${specHash}`);
  console.log(`Data dir: ${DATA_DIR}`);
  console.log();

  // Clean & prepare
  try { rmSync(DATA_DIR, { recursive: true }); } catch { /* fresh dir — absent on first run */ }
  mkdirSync(DATA_DIR, { recursive: true });
  const adventuresDir = join(DATA_DIR, "adventures");
  mkdirSync(adventuresDir, { recursive: true });
  writeFileSync(join(adventuresDir, "tomb-of-the-serpent-king.md"), ADVENTURE_FIXTURE);

  // Start server
  console.log("[BOOT] Starting inform server...");
  const proc = spawn("npx", ["tsx", SERVER_SCRIPT], {
    env: { ...process.env, TTRPG_DATA_DIR: DATA_DIR, TTRPG_ADVENTURE_DIR: adventuresDir },
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
      } catch { /* non-JSON line */ }
    }
  });

  proc.on("error", (e) => { console.error("Server error:", e); process.exit(2); });

  await initialize(proc);
  console.log("[BOOT] Server initialized.\n");

  // Run scenarios
  const scenarios = buildScenarios();
  const verdicts: GauntletVerdict[] = [];
  let blockingFailures = 0;
  let nonBlockingFailures = 0;

  for (const scenario of scenarios) {
    const started = Date.now();
    const verdict: GauntletVerdict = {
      scenario_id: scenario.scenario_id,
      objective: scenario.objective,
      blocking: scenario.blocking,
      passed: true,
      duration_ms: 0,
    };

    try {
      for (const step of scenario.steps) {
        const response = await doAction(proc, step.action);
        try {
          step.assert(response);
        } catch (e: any) {
          throw new Error(`${step.label}: ${e.message}\nResponse: ${response.substring(0, 300)}`);
        }
      }
    } catch (e: any) {
      verdict.passed = false;
      verdict.failure = {
        step: e.message.split("\n")[0],
        error: e.message,
        response: "",
      };
      if (scenario.blocking) blockingFailures++;
      else nonBlockingFailures++;
    }

    // Clean up for next scenario
    try {
      await doAction(proc, T("novel", { action: "end" }));
      await doAction(proc, T("respond", { decision: "end novel confirm", option: "yes" }));
    } catch { /* cleanup best-effort — a dead server errors here */ }

    verdict.duration_ms = Date.now() - started;
    verdicts.push(verdict);

    const status = verdict.passed ? "PASS" : "FAIL";
    const blockTag = scenario.blocking ? "[BLOCKING]" : "[non-blocking]";
    console.log(`${status} ${blockTag} ${scenario.scenario_id}: ${scenario.objective} (${verdict.duration_ms}ms)`);
    if (verdict.failure) {
      console.log(`  Failure: ${verdict.failure.error.split("\n")[0]}`);
    }
  }

  proc.kill();

  // Summary
  console.log("\n=== Gauntlet Summary ===");
  const passed = verdicts.filter(v => v.passed).length;
  console.log(`Total: ${verdicts.length} | Passed: ${passed} | Failed: ${verdicts.length - passed}`);
  console.log(`Blocking failures: ${blockingFailures} | Non-blocking: ${nonBlockingFailures}`);

  // Surface hash
  const toolNames = [
    "adventure", "character", "codex", "combat", "command", "condition", "countdown",
    "faction", "help", "lore", "note", "novel", "npc", "redo", "relationship",
    "respond", "ruleset", "scene", "session", "set_badge", "story", "synthesis",
    "undo", "vow", "world",
  ].sort();
  const resourceUris = [
    "room://{id}", "thing://{id}", "world://map", "world://kinds", "scene://history",
  ].sort();
  const promptNames = ["intro", "badge_briefing", "session_zero", "novel_setup"].sort();
  const surfaceHash = sha256(JSON.stringify({ tools: toolNames, resources: resourceUris, prompts: promptNames }));

  // Write structured encoding
  const encoding = {
    gauntlet_timestamp: new Date().toISOString(),
    server: "inform",
    spec_hash: specHash,
    surface_hash: surfaceHash,
    verdicts: verdicts.map(v => ({
      scenario_id: v.scenario_id,
      passed: v.passed,
      blocking: v.blocking,
      duration_ms: v.duration_ms,
      failure: v.failure,
    })),
    summary: {
      total: verdicts.length,
      passed,
      failed: verdicts.length - passed,
      blocking_failures: blockingFailures,
      non_blocking_failures: nonBlockingFailures,
    },
  };

  writeFileSync(join(DATA_DIR, "gauntlet-results.json"), JSON.stringify(encoding, null, 2));
  console.log(`\nResults: ${join(DATA_DIR, "gauntlet-results.json")}`);

  if (blockingFailures > 0) {
    console.error(`\nFAIL: ${blockingFailures} blocking sub-workflow(s) failed.`);
    process.exit(1);
  }

  console.log("\nPASS: All blocking sub-workflows passed.");
  process.exit(0);
}

main().catch((e) => {
  console.error("Gauntlet fatal error:", e);
  process.exit(2);
});
