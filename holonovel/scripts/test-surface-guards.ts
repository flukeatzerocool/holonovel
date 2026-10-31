#!/usr/bin/env node
// Tool-surface guard harness (REQ-573, REQ-575, REQ-576). [gate]
// Exercises T666 (precondition refusal), T668 (cross-group edge/refusal), and
// T669 (Editor override + audit surface).
//
// Exit codes: 0 = pass, 1 = one or more assertions failed.

import { spawn, type ChildProcess } from "node:child_process";
import { mkdtempSync, rmSync, readFileSync } from "node:fs";
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
// Boot a second server into its own data directory (first-run checks). Safe
// because `attach`'s shared buffer is only read while a call is in flight, and
// the caller's primary process is idle between assertions.
async function bootAt(dataDir: string, extraEnv: Record<string, string> = {}): Promise<ChildProcess> {
  const proc = spawn("npx", ["tsx", SERVER], {
    env: { ...process.env, TTRPG_DATA_DIR: dataDir, ...extraEnv },
    stdio: ["pipe", "pipe", "pipe"],
  });
  attach(proc);
  await send(proc, {
    method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "surface-guards-first-run", version: "1.0.0" },
    },
  });
  proc.stdin!.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n");
  await new Promise((resolve) => setTimeout(resolve, 250));
  return proc;
}
async function call(proc: ChildProcess, name: string, args: Record<string, unknown>): Promise<string> {  const response = await send(proc, { method: "tools/call", params: { name, arguments: args } });
  const content = response?.result?.content ?? [];
  return content.map((part: any) => part?.text ?? "").join("\n");
}
function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}

async function run(): Promise<void> {
  const proc = await boot("small");
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
      const forbidden = await call(proc, "manage_combat", { action: "init" });
      assert(forbidden.includes("[FORBIDDEN]"), `open_session did not switch to Player: ${forbidden.slice(0, 160)}`);
      await call(proc, "open_session", { badge: "game_master" });
    });

    // REQ-577 — a fresh install seeds the starter but activates nothing, so the
    // documented first call (no arguments) must still open a session.
    await test("T670: open_session with no arguments opens the only Novel on a fresh install", async () => {
      const dir = mkdtempSync(join(tmpdir(), "holonovel-first-run-"));
      const p = await bootAt(dir);
      try {
        const recap = await call(p, "open_session", {});
        assert(!recap.includes("[STATE_CONFLICT]"), `fresh install refused to open: ${recap.slice(0, 200)}`);
        assert(recap.includes("torre-nosferatu"), `recap did not name the seeded Novel: ${recap.slice(0, 200)}`);
      } finally {
        p.kill();
        rmSync(dir, { recursive: true, force: true });
      }
    });

    await test("T670: open_session with no Novel refuses naming the create path", async () => {
      const dir = mkdtempSync(join(tmpdir(), "holonovel-no-novel-"));
      const p = await bootAt(dir, { TTRPG_STARTER_NOVEL: "off" });
      try {
        const text = await call(p, "open_session", {});
        assert(text.includes("[STATE_CONFLICT]"), `expected STATE_CONFLICT: ${text.slice(0, 200)}`);
        assert(text.includes("manage_novel (action: create)"), `did not name the create path: ${text.slice(0, 200)}`);
      } finally {
        p.kill();
        rmSync(dir, { recursive: true, force: true });
      }
    });

    await test("T670: two Novels and no active Novel refuses listing the slugs", async () => {
      const dir = mkdtempSync(join(tmpdir(), "holonovel-many-novels-"));
      const first = await bootAt(dir, { TTRPG_STARTER_NOVEL: "off" });
      await call(first, "manage_novel", { action: "create", name: "Alpha" });
      await call(first, "manage_novel", { action: "create", name: "Beta" });
      first.kill();
      await new Promise((resolve) => setTimeout(resolve, 500));
      const p = await bootAt(dir, { TTRPG_STARTER_NOVEL: "off" });
      try {
        const text = await call(p, "open_session", {});
        assert(text.includes("[STATE_CONFLICT]"), `expected STATE_CONFLICT: ${text.slice(0, 200)}`);
        assert(text.includes("alpha") && text.includes("beta"), `refusal did not list the slugs: ${text.slice(0, 200)}`);
        const named = await call(p, "open_session", { novel: "alpha" });
        assert(!named.includes("[STATE_CONFLICT]"), `explicit slug refused: ${named.slice(0, 200)}`);
      } finally {
        p.kill();
        rmSync(dir, { recursive: true, force: true });
      }
    });

    await test("T670: close_session returns recap and context", async () => {
      const text = await call(proc, "close_session", {});
      assert(text.trim().length > 0, "close_session returned no content");
      assert(text.includes("narrative_orientation") || text.includes("context") || text.includes("{"),
        `close_session lacked recap/context markers: ${text.slice(0, 200)}`);
    });

    await test("T664/T662: tool_surface reports the budget and active profile", async () => {
      const health = JSON.parse(await call(proc, "manage_diagnostics", { action: "health" }));
      const surface = health?.tool_surface;
      assert(surface && typeof surface.catalog_tokens_estimate === "number", "missing catalog token estimate");
      assert(surface?.budgets?.standard > 0 && surface?.budgets?.small > 0, "missing profile budgets");
      assert(typeof surface?.profile === "string", "missing active profile");
    });

    await test("T674: split aliases advertise replacements", async () => {
      const listed = await send(proc, { method: "tools/list", params: { profile: "full" } });
      const tools = listed?.result?.tools ?? [];
      const old = tools.find((t: any) => t.name === "manage_session");
      const fresh = tools.find((t: any) => t.name === "manage_context");
      assert(old === undefined, `retired manage_session must be hidden from tools/list: ${JSON.stringify(old?._meta)}`);
      assert(fresh !== undefined, "manage_context missing from tools/list");
      assert(!fresh?._meta?.deprecated, `replacement is deprecated: ${JSON.stringify(fresh?._meta)}`);
    });

    await test("T675: retired compatibility aliases are hidden and name their replacements", async () => {
      const listed = await send(proc, { method: "tools/list", params: { _meta: { profile: "full" } } });
      const tools = listed?.result?.tools ?? [];
      const names = tools.map((t: any) => t.name);
      for (const name of ["resolve_fate", "resolve_ironsworn", "resolve_forged", "manage_session"]) {
        assert(!names.includes(name), `${name} must be hidden from tools/list`);
      }
      assert(names.includes("resolve_mechanic"), "resolve_mechanic missing from tools/list");
      const ruleset = tools.find((t: any) => t.name === "manage_ruleset");
      const session = tools.find((t: any) => t.name === "manage_context");
      assert(!ruleset?.inputSchema?.properties?.action?.enum?.includes("roll"), "retired roll action still advertised");
      assert(!session?.inputSchema?.properties?.action?.enum?.includes("health"), "retired health action still advertised");
      const retired: Array<[string, Record<string, unknown>, string]> = [
        ["resolve_fate", { action: "fate_point" }, "resolve_mechanic.fate_point"],
        ["resolve_ironsworn", { action: "move" }, "resolve_mechanic.ironsworn_move"],
        ["resolve_forged", { action: "stress" }, "resolve_mechanic.forged_stress"],
        ["manage_ruleset", { action: "roll", table: "weather" }, "resolve_mechanic.roll"],
        ["manage_session", { action: "health" }, "manage_diagnostics.health"],
        ["manage_session", { action: "recap" }, "manage_context.recap"],
      ];
      for (const [name, args, replacement] of retired) {
        const text = await call(proc, name, args);
        assert(text.includes("[NOT_FOUND]"), `${name} (${String(args.action)}) was not refused: ${text.slice(0, 160)}`);
        assert(text.includes(replacement), `${name} (${String(args.action)}) did not name ${replacement}: ${text.slice(0, 160)}`);
      }
      const canonical = await call(proc, "resolve_mechanic", { action: "fate_point", op: "list" });
      assert(!canonical.includes("[NOT_FOUND]"), `canonical action failed: ${canonical.slice(0, 160)}`);
    });

    await test("T675: spec_health and the group directory advertise hidden aliases", async () => {
      const baseline = JSON.parse(readFileSync(join(import.meta.dirname, "..", "..", "spec", "audit", "tool-surface-baseline.json"), "utf8")).baseline;
      const health = JSON.parse(await call(proc, "manage_diagnostics", { action: "health" }));
      const surface = health?.tool_surface;
      assert(surface?.canonical?.tools === baseline.canonical_tools, `canonical tools ${surface?.canonical?.tools} != baseline ${baseline.canonical_tools}`);
      assert(surface?.canonical?.actions === baseline.canonical_actions, `canonical actions ${surface?.canonical?.actions} != baseline ${baseline.canonical_actions}`);
      assert(surface?.compatibility?.tools === baseline.compatibility_tools, `compatibility tools ${surface?.compatibility?.tools} != baseline ${baseline.compatibility_tools}`);
      assert(surface?.compatibility?.actions === baseline.compatibility_actions, `compatibility actions ${surface?.compatibility?.actions} != baseline ${baseline.compatibility_actions}`);
      assert(surface?.compatibility?.retired === baseline.compatibility_actions, `retired actions ${surface?.compatibility?.retired} != baseline ${baseline.compatibility_actions}`);
      const aliases = surface?.compatibility?.aliases ?? [];
      for (const name of ["resolve_fate", "resolve_ironsworn", "resolve_forged", "manage_ruleset.roll"]) {
        assert(aliases.some((a: any) => a.name === name), `alias ${name} missing from spec_health`);
      }
      for (const alias of aliases) {
        assert(alias.retired === true, `alias ${alias.name} not reported retired`);
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
      const health = await call(proc, "manage_diagnostics", { action: "health" });
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
