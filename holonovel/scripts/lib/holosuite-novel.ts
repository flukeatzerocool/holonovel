// holosuite-novel.ts — Tier T2: the bundled Torre Nosferatu Novel.
//
// Boots a fresh data directory (which seeds the starter Novel), resumes
// `torre-nosferatu`, and asserts the shipped content and its live behaviour:
// structural integrity, the locked-door escape route, diagnostics determinism,
// Player-badge redaction, bundle-integrity state hashes, and restart
// continuity. Bounded (one boot plus the walkthrough) and deterministic.
// Exit codes: n/a (library; the runner owns the exit code).
//
// REQ citations: REQ-565 (starter Novel), REQ-601 (state hash), REQ-603/604
// (verify/replay), REQ-606 (context ledger), REQ-599/600 (visibility),
// REQ-542 (knowledge query), REQ-096j (bundle integrity).

import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { bootServer, type McpClient } from "./mcp-client.js";
import { readPersistedNovel } from "./eval-state.js";
import { stateHash, projectState, canonicalJson } from "../../src/core/state-hash.js";
import { assertionRecorder, type AssertionContext } from "./eval-assertion.js";
import type { TierResult } from "./eval-schema.js";

const P_STRUCTURE = "holonovel/scripts/lib/starter-novel.ts:54"; // buildStarterArtifact
const P_LOCK = "holonovel/src/world/parser.ts:332";
const P_HASH = "holonovel/src/core/state-hash.ts:50";
const P_CONTEXT = "holonovel/src/index.ts:8416";
const P_VISIBILITY = "holonovel/src/index.ts:8438";
const P_KNOWLEDGE = "holonovel/src/index.ts:7183"; // knowledge_query handler
const P_INTEGRITY = "holonovel/src/index.ts:8842";
const P_RESTART = "holonovel/src/core/state.ts:2236";

const NOVEL_NAME = "Torre Nosferatu";
const SLUG = "torre-nosferatu";
const OPPOSITE: Record<string, string> = {
  north: "south", south: "north", east: "west", west: "east",
  up: "down", down: "up", in: "out", out: "in",
};

interface Room {
  name?: string;
  exits?: Record<string, string>;
  doorRefs?: Record<string, string>;
}
interface Thing {
  name?: string;
  key?: string;
  locked?: boolean;
  openable?: boolean;
  location?: string;
}
interface NovelShape {
  name?: string;
  slug?: string;
  ruleset?: string | null;
  scene_location?: string;
  active_entity_id?: string;
  world?: { rooms?: Record<string, Room>; things?: Record<string, Thing> };
  npcs?: Record<string, unknown>;
  lore?: Record<string, unknown>;
  secrets?: Array<{ key: string; content?: string; badge_scope?: string }>;
  countdowns?: Record<string, unknown>;
  entities?: Record<string, { inventory?: Array<{ name?: string } | string> }>;
}

function asNovel(raw: Record<string, unknown>): NovelShape {
  return raw as NovelShape;
}

/** REQ-601 hash over persisted content, excluding the storage checksum stamp. */
function contentHash(novel: Record<string, unknown>): string {
  const { _checksum: _ignored, ...content } = novel;
  return stateHash(content);
}

function roomsByName(novel: NovelShape): Map<string, Room> {
  return new Map(Object.values(novel.world?.rooms ?? {}).map((r) => [String(r.name ?? ""), r]));
}

function thingsByName(novel: NovelShape): Map<string, Thing> {
  return new Map(Object.values(novel.world?.things ?? {}).map((t) => [String(t.name ?? ""), t]));
}

function thingsById(novel: NovelShape): Map<string, Thing> {
  return new Map(Object.entries(novel.world?.things ?? {}));
}

/** Shortest route that does not cross a locked-door direction. */
function route(rooms: Map<string, Room>, from: string, to: string): string[] | null {
  if (from === to) return [];
  const queue: Array<[string, string[]]> = [[from, []]];
  const seen = new Set([from]);
  while (queue.length > 0) {
    const [current, path] = queue.shift()!;
    const room = rooms.get(current);
    for (const [dir, target] of Object.entries(room?.exits ?? {})) {
      if (room?.doorRefs?.[dir]) continue;
      if (!rooms.has(target) || seen.has(target)) continue;
      if (target === to) return [...path, dir];
      seen.add(target);
      queue.push([target, [...path, dir]]);
    }
  }
  return null;
}

/** The room name in a `[OK] <room>` movement envelope. */
function movedTo(text: string): string {
  const line = text.split("\n")[0] ?? "";
  return line.replace(/^\[OK\]\s*/, "").trim();
}

async function go(client: McpClient, dir: string): Promise<string> {
  const res = await client.call("run_command", { action: "execute", command: `go ${dir}` });
  return res.text;
}

async function walk(client: McpClient, rooms: Map<string, Room>, from: string, to: string): Promise<{ ok: boolean; at: string; detail: string }> {
  const path = route(rooms, from, to);
  if (!path) return { ok: false, at: from, detail: `no unlocked route ${from} -> ${to}` };
  let at = from;
  for (const dir of path) {
    const text = await go(client, dir);
    at = movedTo(text);
    if (!text.startsWith("[OK]")) return { ok: false, at, detail: `go ${dir} from ${from}: ${text.split("\n")[0]}` };
  }
  return { ok: at === to, at, detail: at === to ? `reached ${to}` : `expected ${to}, arrived ${at}` };
}

async function take(client: McpClient, thing: string): Promise<string> {
  const res = await client.call("run_command", { action: "execute", command: `take ${thing}` });
  return res.text;
}

export async function runNovel(opts: { serverDir: string; dataDir?: string; seed?: number }): Promise<TierResult> {
  const ctx: AssertionContext = { findings: [], events: [], passed: 0, failed: 0 };
  const record = assertionRecorder(ctx, "novel");
  const ownsDataDir = opts.dataDir === undefined;
  const dataDir = opts.dataDir ?? mkdtempSync(join(tmpdir(), "holosuite-novel-"));
  let step = 0;
  const client = await bootServer({ serverDir: opts.serverDir, dataDir, seed: opts.seed ?? 1 });

  try {
    // --- Seed and resume ----------------------------------------------------
    step++;
    const seeded = await client.call("manage_novel", { action: "list" });
    record("starter_seeded", seeded.text.includes(SLUG), seeded.text.includes(SLUG) ? `${SLUG} listed` : `starter not listed: ${seeded.text.slice(0, 120)}`, step, ["REQ-565"], P_STRUCTURE);
    step++;
    const resumed = await client.call("manage_novel", { action: "resume", slug: SLUG });
    record("starter_resumes", resumed.text.startsWith("[OK]"), resumed.text.split("\n")[0] ?? "", step, ["REQ-565"], P_STRUCTURE);

    // Drain the opening decision so badge switching and state writes are legal.
    step++;
    const drained = await client.call("respond_decision", { decision: "present_choices", option: "take_stair" });
    record("opening_decision_drains", drained.text.startsWith("[OK]"), drained.text.split("\n")[0] ?? "", step, ["REQ-565"], P_STRUCTURE);
    await client.call("set_badge", { badge: "game_master" });

    let novel = asNovel(readPersistedNovel(dataDir, NOVEL_NAME));
    const rooms = roomsByName(novel);
    const things = thingsByName(novel);
    const thingsByIdMap = thingsById(novel);

    // --- Structure ----------------------------------------------------------
    const counts: Array<[string, number, number, string]> = [
      ["rooms", Object.keys(novel.world?.rooms ?? {}).length, 85, "REQ-565"],
      ["things", Object.keys(novel.world?.things ?? {}).length, 35, "REQ-565"],
      ["npcs", Object.keys(novel.npcs ?? {}).length, 6, "REQ-565"],
      ["lore", Object.keys(novel.lore ?? {}).length, 17, "REQ-565"],
      ["secrets", (novel.secrets ?? []).length, 3, "REQ-565"],
      ["countdowns", Object.keys(novel.countdowns ?? {}).length, 2, "REQ-565"],
    ];
    for (const [label, actual, expected, req] of counts) {
      step++;
      record(`structure_${label}`, actual === expected, `${label}: ${actual} (expected ${expected})`, step, [req], P_STRUCTURE);
    }

    step++;
    const dangling = Object.entries(novel.world?.rooms ?? {}).flatMap(([id, room]) =>
      Object.entries(room.exits ?? {}).filter(([, target]) => !rooms.has(target)).map(([dir, target]) => `${id}.${dir}->${target}`),
    );
    record("exits_resolve", dangling.length === 0, dangling.length === 0 ? "every exit target resolves" : dangling.slice(0, 3).join(", "), step, ["REQ-565"], P_STRUCTURE);

    step++;
    const reachable = new Set<string>();
    const queue = [novel.scene_location ?? "Seventh Floor — Spire"];
    while (queue.length > 0) {
      const at = queue.shift()!;
      if (reachable.has(at)) continue;
      reachable.add(at);
      for (const target of Object.values(rooms.get(at)?.exits ?? {})) if (rooms.has(target) && !reachable.has(target)) queue.push(target);
    }
    record("all_rooms_reachable", reachable.size === rooms.size, `${reachable.size}/${rooms.size} rooms reachable from the Spire`, step, ["REQ-565"], P_STRUCTURE);

    step++;
    const asymmetric = Object.entries(novel.world?.rooms ?? {}).flatMap(([id, room]) =>
      Object.entries(room.exits ?? {}).flatMap(([dir, target]) => {
        const back = OPPOSITE[dir];
        if (!back) return [];
        const other = rooms.get(target);
        if (!other?.exits?.[back]) return [];
        return other.exits[back] === String(room.name) ? [] : [`${id}.${dir}->${target}, ${target}.${back}->${other.exits[back]}`];
      }),
    );
    record("exit_symmetry", asymmetric.length === 0, asymmetric.length === 0 ? "bidirectional exits agree" : asymmetric.slice(0, 3).join("; "), step, ["REQ-565"], P_STRUCTURE);

    step++;
    const doorRefCount = Object.values(novel.world?.rooms ?? {}).reduce((n, room) => n + Object.keys(room.doorRefs ?? {}).length, 0);
    const bindings = Object.values(novel.world?.rooms ?? {}).flatMap((room) =>
      Object.entries(room.doorRefs ?? {}).flatMap(([dir, doorName]) => {
        const door = things.get(doorName);
        const key = door?.key ? (thingsByIdMap.get(door.key) ?? things.get(door.key)) : undefined;
        const problems: string[] = [];
        if (!room.exits?.[dir]) problems.push(`${room.name}: doorRef ${dir} has no exit`);
        if (!door) problems.push(`${room.name}: missing door ${doorName}`);
        else if (!door.key) problems.push(`${doorName}: no key binding`);
        else if (!key) problems.push(`${doorName}: missing key ${door.key}`);
        return problems;
      }),
    );
    record("door_bindings", bindings.length === 0 && doorRefCount === 7, bindings.length === 0 ? `${doorRefCount}/7 doorRefs bind an existing door and key` : bindings.slice(0, 3).join("; "), step, ["REQ-565"], P_STRUCTURE);

    // --- Escape walkthrough -------------------------------------------------
    const floors = ["Seventh", "Sixth", "Fifth", "Fourth", "Third", "Second", "First"] as const;
    let at = "Seventh Floor — Spire";
    const carried: string[] = [];
    for (const floor of floors) {
      const prefix = `${floor} Floor`;
      const keyName = `${prefix} Key`;
      const doorName = floor === "First" ? "The Exit Door" : `${prefix} Stair Door`;
      const stairName = floor === "First" ? "First Floor — Antechamber" : `${prefix} — Grand Stair`;
      const keyRoom = `${prefix} — Key Room`;

      if (floor !== "Seventh") {
        step++;
        const walked = await walk(client, rooms, at, keyRoom);
        record(`walk_${floor.toLowerCase()}_key_room`, walked.ok, walked.detail, step, ["REQ-565"], P_LOCK);
        at = walked.at;
      }

      step++;
      const took = await take(client, keyName);
      record(`take_${floor.toLowerCase()}_key`, took.startsWith("[OK]"), took.split("\n")[0] ?? "", step, ["REQ-565"], P_LOCK);
      if (took.startsWith("[OK]")) carried.push(keyName);

      if (floor !== "First") {
        step++;
        const walked = await walk(client, rooms, at, stairName);
        record(`walk_${floor.toLowerCase()}_stair`, walked.ok, walked.detail, step, ["REQ-565"], P_LOCK);
        at = walked.at;

        step++;
        const blocked = await go(client, "down");
        record(`locked_${floor.toLowerCase()}_stair_blocks`, blocked.startsWith("[WARNING]") && blocked.includes("locked"), blocked.split("\n")[0] ?? "", step, ["REQ-565", "REQ-284"], P_LOCK);

        step++;
        const unlocked = await client.call("run_command", { action: "execute", command: `unlock ${doorName} with ${keyName}` });
        record(`unlock_${floor.toLowerCase()}_stair`, unlocked.text.startsWith("[OK]"), unlocked.text.split("\n")[0] ?? "", step, ["REQ-565", "REQ-284"], P_LOCK);
        step++;
        const opened = await client.call("run_command", { action: "execute", command: `open ${doorName}` });
        record(`open_${floor.toLowerCase()}_stair`, opened.text.startsWith("[OK]"), opened.text.split("\n")[0] ?? "", step, ["REQ-565", "REQ-284"], P_LOCK);
        step++;
        const descended = await go(client, "down");
        at = movedTo(descended);
        record(`descend_${floor.toLowerCase()}`, descended.startsWith("[OK]"), descended.split("\n")[0] ?? "", step, ["REQ-565"], P_LOCK);
      }
    }

    step++;
    const toExit = await walk(client, rooms, at, "First Floor — Antechamber");
    record("walk_antechamber", toExit.ok, toExit.detail, step, ["REQ-565"], P_LOCK);
    at = toExit.at;
    step++;
    const exitBlocked = await go(client, "out");
    record("locked_exit_blocks", exitBlocked.startsWith("[WARNING]") && exitBlocked.includes("locked"), exitBlocked.split("\n")[0] ?? "", step, ["REQ-565", "REQ-284"], P_LOCK);
    step++;
    const exitUnlocked = await client.call("run_command", { action: "execute", command: `unlock The Exit Door with First Floor Key` });
    record("unlock_exit", exitUnlocked.text.startsWith("[OK]"), exitUnlocked.text.split("\n")[0] ?? "", step, ["REQ-565", "REQ-284"], P_LOCK);
    step++;
    const exitOpened = await client.call("run_command", { action: "execute", command: "open The Exit Door" });
    record("open_exit", exitOpened.text.startsWith("[OK]"), exitOpened.text.split("\n")[0] ?? "", step, ["REQ-565", "REQ-284"], P_LOCK);
    step++;
    const escaped = await go(client, "out");
    record("escape_reaches_threshold", movedTo(escaped) === "Beyond the Threshold", escaped.split("\n")[0] ?? "", step, ["REQ-565"], P_LOCK);

    step++;
    novel = asNovel(readPersistedNovel(dataDir, NOVEL_NAME));
    const inventory = (novel.entities?.[novel.active_entity_id ?? ""]?.inventory ?? []).map((i) => typeof i === "string" ? i : String(i.name ?? ""));
    const missingKeys = carried.filter((key) => !inventory.some((item) => item.toLowerCase() === key.toLowerCase()));
    record("all_keys_carried", carried.length === 7 && missingKeys.length === 0, `${inventory.length} carried; missing ${missingKeys.join(", ") || "none"}`, step, ["REQ-565"], P_LOCK);

    // --- Diagnostics --------------------------------------------------------
    step++;
    const verify1 = await client.call("manage_diagnostics", { action: "verify" });
    record("verify_clean", !verify1.isError && verify1.text.includes("clean"), verify1.text.split("\n")[0] ?? "", step, ["REQ-603"], P_HASH);
    step++;
    const verify2 = await client.call("manage_diagnostics", { action: "verify" });
    record("verify_repeat_stable", verify1.text === verify2.text, verify1.text === verify2.text ? "repeat verify identical" : "repeat verify changed", step, ["REQ-603"], P_HASH);

    step++;
    const ledger1 = await client.call("manage_diagnostics", { action: "context_report" });
    const ledger2 = await client.call("manage_diagnostics", { action: "context_report" });
    record("context_report_stable", !ledger1.isError && ledger1.text === ledger2.text, ledger1.isError ? "context_report errored" : `${ledger1.text.length} chars, repeat stable`, step, ["REQ-606"], P_CONTEXT);

    step++;
    const observed = await client.call("manage_diagnostics", { action: "event", text: "holosuite novel tier probe observation" });
    record("event_appended", !observed.isError, observed.text.split("\n")[0] ?? "", step, ["REQ-602"], P_HASH);
    step++;
    const replay = await client.call("manage_diagnostics", { action: "replay" });
    record("replay_reads_event", !replay.isError && replay.text.includes("holosuite novel tier probe"), replay.text.split("\n")[0] ?? "", step, ["REQ-604"], P_HASH);

    // --- Player-badge redaction --------------------------------------------
    await client.call("set_badge", { badge: "player" });
    const gmSecret = (novel.secrets ?? []).find((s) => s.badge_scope === "game_master");
    step++;
    const knowledge = await client.call("manage_belief", { action: "knowledge_query" });
    const leaksSecret = gmSecret?.content ? knowledge.text.includes(gmSecret.content) : false;
    record("knowledge_query_hides_gm_secrets", !leaksSecret, leaksSecret ? "knowledge query leaked a GM secret" : "no GM secret content returned", step, ["REQ-542"], P_KNOWLEDGE);
    step++;
    const visibility = gmSecret?.content
      ? await client.call("manage_diagnostics", { action: "visibility_check", text: `The truth: ${gmSecret.content}` })
      : await client.call("manage_diagnostics", { action: "visibility_check", text: "probe" });
    record("visibility_redacts_gm_secret", visibility.text.includes("[visibility]") && (!gmSecret?.content || !visibility.text.includes(gmSecret.content)), visibility.text.split("\n")[0] ?? visibility.text.slice(0, 80), step, ["REQ-599"], P_VISIBILITY);
    step++;
    const playerVerify = await client.call("manage_diagnostics", { action: "verify" });
    record("player_verify_denied", playerVerify.isError && /FORBIDDEN|Game Master only/.test(playerVerify.text), playerVerify.text.split("\n")[0] ?? "", step, ["REQ-603", "REQ-032"], P_HASH);
    await client.call("set_badge", { badge: "game_master" });

    // --- Bundle integrity ---------------------------------------------------
    step++;
    const export1 = await client.call("manage_archive", { action: "export" });
    const export2 = await client.call("manage_archive", { action: "export" });
    let bundle1: { novel?: Record<string, unknown>; integrity?: { state_hash?: string } } | null = null;
    let bundle2: { integrity?: { state_hash?: string } } | null = null;
    try {
      bundle1 = JSON.parse(export1.text);
      bundle2 = JSON.parse(export2.text);
    } catch {
      bundle1 = null;
      bundle2 = null;
    }
    const integrityHash = bundle1?.integrity?.state_hash;
    const recomputed = bundle1?.novel ? stateHash(bundle1.novel) : "";
    record("bundle_integrity_state_hash", Boolean(integrityHash) && integrityHash === recomputed && integrityHash === bundle2?.integrity?.state_hash, integrityHash ? `state hash matches payload${integrityHash === bundle2?.integrity?.state_hash ? " and repeat" : ""}` : "export did not carry an integrity state hash", step, ["REQ-096j", "REQ-601"], P_INTEGRITY);

    // --- Restart continuity -------------------------------------------------
    step++;
    const beforeNovel = readPersistedNovel(dataDir, NOVEL_NAME);
    const beforeRestart = contentHash(beforeNovel);
    await client.close();
    const rebooted = await bootServer({ serverDir: opts.serverDir, dataDir, seed: opts.seed ?? 1 });
    try {
      const resumedAgain = await rebooted.call("manage_novel", { action: "resume", slug: SLUG });
      await rebooted.call("set_badge", { badge: "game_master" });
      const verifyAgain = await rebooted.call("manage_diagnostics", { action: "verify" });
      const afterRestart = contentHash(readPersistedNovel(dataDir, NOVEL_NAME));
      record("restart_resumes_and_verifies", resumedAgain.text.startsWith("[OK]") && !verifyAgain.isError && verifyAgain.text.includes("clean"), verifyAgain.text.split("\n")[0] ?? "", step, ["REQ-089", "REQ-603"], P_RESTART);
      const afterNovel = readPersistedNovel(dataDir, NOVEL_NAME);
      const changed = beforeRestart === afterRestart
        ? []
        : Object.keys(projectState(beforeNovel)).filter((k) => canonicalJson(projectState(beforeNovel)[k]) !== canonicalJson(projectState(afterNovel)[k]));
      record("restart_state_stable", beforeRestart === afterRestart, beforeRestart === afterRestart ? "content hash stable across restart" : `content hash changed across restart${changed.length ? `; changed: ${changed.join(",")}` : ""}`, step + 1, ["REQ-601"], P_HASH);
    } finally {
      await rebooted.close();
    }

    ctx.events.push({
      tier: "novel", step, role: "player", badge: "game_master", tool: "holosuite",
      args: { slug: SLUG, seed: opts.seed ?? 1 }, prefix: "[OK]", error_class: "ok",
      is_error: false, mcp_error: false, latency_ms: 0,
      req_ids: ["REQ-565", "REQ-096j", "REQ-601", "REQ-603", "REQ-604", "REQ-606", "REQ-599", "REQ-542"],
      detail: "Torre Nosferatu structural and escape-route walkthrough",
    });
  } catch (e) {
    ctx.failed++;
    ctx.findings.push({ class: "novel_error", predicate: P_STRUCTURE, tier: "novel", step, severity: "P1", target: "T2", detail: e instanceof Error ? e.message : String(e) });
  } finally {
    await client.close();
    if (ownsDataDir) {
      try {
        rmSync(dataDir, { recursive: true, force: true });
      } catch {
        // Best-effort cleanup of the temp dir; not a test signal.
      }
    }
  }

  return { tier: "novel", passed: ctx.passed, failed: ctx.failed, findings: ctx.findings, events: ctx.events };
}
