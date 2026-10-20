#!/usr/bin/env node
// Tool-surface guard harness (REQ-573, REQ-575, REQ-576). [gate]
// Exercises T666 (precondition refusal), T668 (cross-group edge/refusal), and
// T669 (Editor override + audit surface).
//
// Exit codes: 0 = pass, 1 = one or more assertions failed.

import { spawn, type ChildProcess } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { installHarnessGuard, harnessComplete } from "./lib/harness-guard.js";
installHarnessGuard();

const SERVER = join(import.meta.dirname, "..", "src", "index.ts");
const DATA_DIR = mkdtempSync(join(tmpdir(), "holonovel-surface-guards-"));

let passed = 0;
let failed = 0;
async function test(name: string, fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
    passed++;
    console.log(`  PASS ${name}`);
  } catch (e: any) {
    failed++;
    console.error(`  FAIL ${name}: ${e?.message ?? e}`);
  }
}

let nextId = 0;
const pending = new Map<number, (msg: any) => void>();
let buffer = "";
function send(proc: ChildProcess, message: any): Promise<any> {
  return new Promise((resolve) => {
    const id = ++nextId;
    pending.set(id, resolve);
    proc.stdin!.write(JSON.stringify({ ...message, id, jsonrpc: "2.0" }) + "\n");
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
      } catch {
        // Non-JSON stderr/oversized lines are not protocol messages.
      }
    }
  });
}
async function boot(profile: string): Promise<ChildProcess> {
  const proc = spawn("npx", ["tsx", SERVER], {
    env: { ...process.env, TTRPG_DATA_DIR: DATA_DIR, TTRPG_SURFACE_PROFILE: profile },
    stdio: ["pipe", "pipe", "pipe"],
  });
  attach(proc);
  await send(proc, {
    method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "surface-guards", version: "1.0.0" },
    },
  });
  proc.stdin!.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n");
  await new Promise((resolve) => setTimeout(resolve, 250));
  return proc;
}
async function call(proc: ChildProcess, name: string, args: Record<string, unknown>): Promise<string> {
  const response = await send(proc, { method: "tools/call", params: { name, arguments: args } });
  const content = response?.result?.content ?? [];
  return content.map((part: any) => part?.text ?? "").join("\n");
}
function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}

async function run(): Promise<void> {
  const proc = await boot("standard");
  try {
    await call(proc, "manage_novel", { action: "create", name: "surface-guards" });
    // Novel creation activates the Editor badge, which intentionally bypasses
    // the surface guard. Switch to Game Master for the enforcement checks.
    await call(proc, "set_badge", { badge: "game_master" });

    await test("T666: combat advance before init refuses with next init", async () => {
      const text = await call(proc, "manage_combat", { action: "advance" });
      assert(text.includes("[STATE_CONFLICT]"), `expected STATE_CONFLICT, got: ${text.slice(0, 160)}`);
      assert(text.includes("manage_combat (action: init)"), `missing next init: ${text.slice(0, 160)}`);
    });

    await test("T668: undeclared referee call from explore refuses", async () => {
      const text = await call(proc, "manage_faction", { action: "create", name: "The Guild" });
      assert(text.includes("[STATE_CONFLICT]"), `expected STATE_CONFLICT, got: ${text.slice(0, 160)}`);
      assert(text.includes("referee"), `missing group name: ${text.slice(0, 160)}`);
    });

    await test("T668: declared edge from explore to referee succeeds", async () => {
      const text = await call(proc, "manage_countdown", { action: "set", name: "Dawn", ticks: 3 });
      assert(!text.includes("belongs to group"), `edge was refused: ${text.slice(0, 160)}`);
    });

    await test("T668: lookup is cross-cutting", async () => {
      const text = await call(proc, "manage_ruleset", { action: "search", query: "test" });
      assert(!text.includes("belongs to group"), `lookup was refused: ${text.slice(0, 160)}`);
    });

    await test("T670/T667: take_turn mints a handle and record consumes it", async () => {
      const turn = await call(proc, "take_turn", { intent: "look around the room" });
      assert(turn.includes("[TURN]"), `take_turn did not mint a handle: ${turn.slice(0, 200)}`);
      assert(turn.includes("Suggested next actions"), `take_turn lacked suggestions: ${turn.slice(0, 200)}`);
      const handle = turn.match(/\[TURN\]\s+(\S+)/)?.[1];
      assert(handle, `no handle parsed: ${turn.slice(0, 200)}`);
      const bad = await call(proc, "manage_story", { action: "record", type: "moment", entry: "x", turn_handle: "not-a-handle" });
      assert(bad.includes("[STATE_CONFLICT]"), `invalid handle was accepted: ${bad.slice(0, 160)}`);
      const good = await call(proc, "manage_story", { action: "record", type: "moment", entry: "A turn was recorded.", turn_handle: handle });
      assert(!good.includes("[STATE_CONFLICT]"), `valid handle refused: ${good.slice(0, 160)}`);
      const replay = await call(proc, "manage_story", { action: "record", type: "moment", entry: "Replay.", turn_handle: handle });
      assert(replay.includes("[STATE_CONFLICT]"), `consumed handle was accepted: ${replay.slice(0, 160)}`);
      const noHandle = await call(proc, "manage_story", { action: "record", type: "moment", entry: "No handle." });
      assert(!noHandle.includes("[STATE_CONFLICT]"), `recording without a handle refused: ${noHandle.slice(0, 160)}`);
    });

    await test("T670: open_session resumes, sets the badge, and returns a recap", async () => {
      const recap = await call(proc, "open_session", { badge: "player" });
      assert(recap.trim().length > 0, "open_session returned no content");
      assert(recap.includes("surface-guards"), `open_session recap lacked the Novel: ${recap.slice(0, 200)}`);
      const forbidden = await call(proc, "manage_scene", { action: "presence", entity_ids: [] });
      assert(forbidden.includes("[FORBIDDEN]"), `open_session did not switch to Player: ${forbidden.slice(0, 160)}`);
      await call(proc, "open_session", { badge: "game_master" });
    });

    await test("T670: close_session returns recap and context", async () => {
      const text = await call(proc, "close_session", {});
      assert(text.trim().length > 0, "close_session returned no content");
      assert(text.includes("narrative_orientation") || text.includes("context") || text.includes("{"),
        `close_session lacked recap/context markers: ${text.slice(0, 200)}`);
    });

    await test("T664/T662: tool_surface reports the budget and active profile", async () => {
      const health = JSON.parse(await call(proc, "manage_session", { action: "health" }));
      const surface = health?.tool_surface;
      assert(surface && typeof surface.catalog_tokens_estimate === "number", "missing catalog token estimate");
      assert(surface?.budgets?.standard > 0 && surface?.budgets?.small > 0, "missing profile budgets");
      assert(typeof surface?.profile === "string", "missing active profile");
    });

    await test("T674: split aliases advertise replacements", async () => {
      const listed = await send(proc, { method: "tools/list", params: { profile: "full" } });
      const tools = listed?.result?.tools ?? [];
      const old = tools.find((t: any) => t.name === "manage_session");
      const fresh = tools.find((t: any) => t.name === "manage_diagnostics");
      assert(old?._meta?.deprecated === true, `old tool lacks deprecation: ${JSON.stringify(old?._meta)}`);
      assert(old?._meta?.replacement === "manage_diagnostics", `old tool replacement wrong: ${JSON.stringify(old?._meta)}`);
      assert(!fresh?._meta?.deprecated, `replacement is deprecated: ${JSON.stringify(fresh?._meta)}`);
    });

    await test("T675: hidden compatibility aliases are omitted from tools/list but remain callable", async () => {
      const listed = await send(proc, { method: "tools/list", params: { _meta: { profile: "full" } } });
      const names = (listed?.result?.tools ?? []).map((t: any) => t.name);
      for (const name of ["resolve_fate", "resolve_ironsworn", "resolve_forged"]) {
        assert(!names.includes(name), `${name} must be hidden from tools/list`);
      }
      assert(names.includes("resolve_mechanic"), "resolve_mechanic missing from tools/list");
      const alias = await call(proc, "resolve_fate", { action: "fate_point", op: "list" });
      assert(!alias.includes("not found") && !alias.includes("Invalid"), `hidden alias not callable: ${alias.slice(0, 160)}`);
      const canonical = await call(proc, "resolve_mechanic", { action: "fate_point", op: "list" });
      assert(!canonical.includes("not found"), `canonical action failed: ${canonical.slice(0, 160)}`);
      const roll = await call(proc, "manage_ruleset", { action: "roll", table: "weather" });
      assert(!roll.includes("Invalid option") && !roll.includes("Invalid enum"), `hidden roll action failed validation: ${roll.slice(0, 160)}`);
    });

    await test("T675: spec_health and the group directory advertise hidden aliases", async () => {
      const health = JSON.parse(await call(proc, "manage_session", { action: "health" }));
      const surface = health?.tool_surface;
      assert(surface?.canonical?.tools === 36, `canonical tools ${surface?.canonical?.tools}`);
      assert(surface?.canonical?.actions === 214, `canonical actions ${surface?.canonical?.actions}`);
      assert(surface?.compatibility?.tools === 3, `compatibility tools ${surface?.compatibility?.tools}`);
      assert(surface?.compatibility?.actions === 45, `compatibility actions ${surface?.compatibility?.actions}`);
      const aliases = (surface?.compatibility?.aliases ?? []).map((a: any) => a.name);
      for (const name of ["resolve_fate", "resolve_ironsworn", "resolve_forged", "manage_ruleset.roll"]) {
        assert(aliases.includes(name), `alias ${name} missing from spec_health`);
      }
      const resource = await send(proc, { method: "resources/read", params: { uri: "holonovel://tool-groups" } });
      const text = resource?.result?.contents?.[0]?.text ?? "{}";
      const payload = JSON.parse(text);
      assert(Array.isArray(payload.aliases) && payload.aliases.length >= 4, `group directory aliases missing: ${text.slice(0, 200)}`);
    });

    await test("T669: Editor override bypasses and is surfaced", async () => {
      const switched = await call(proc, "set_badge", { badge: "none" });
      assert(switched.includes("Editor"), `Editor switch failed: ${switched.slice(0, 160)}`);
      const text = await call(proc, "manage_faction", { action: "create", name: "The Guild" });
      assert(!text.includes("belongs to group"), `override did not bypass: ${text.slice(0, 160)}`);
      const health = await call(proc, "manage_session", { action: "health" });
      assert(health.includes("tool_surface"), `health missing tool_surface: ${health.slice(0, 160)}`);
      assert(/"overrides":\s*[1-9]/.test(health), `override not counted: ${health.slice(0, 300)}`);
    });
  } finally {
    proc.kill();
    rmSync(DATA_DIR, { recursive: true, force: true });
  }

  harnessComplete();
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed === 0 ? 0 : 1);
}

run().catch((e) => {
  console.error("Fatal:", e);
  process.exit(2);
});
