#!/usr/bin/env node
/**
 * test-starter-novel.ts — bundled starter Novel harness. [gate]
 *
 * Purpose: verify the bundled starter contract (REQ-565/REQ-566) and its
 * hazard/match balance (REQ-622/REQ-622a). A fresh
 * install seeds the ruleset-free `torre-nosferatu` Novel once; the tombstone
 * suppresses re-seed after deletion; TTRPG_STARTER_NOVEL=off opts out; a
 * missing asset is non-fatal; the seeded Novel resumes and is playable with no
 * ruleset; and `spec_health` reports its provenance with no [data-stale] flag.
 *
 * Exit codes: 0 = pass, 1 = one or more assertions failed, 2 = fatal.
 *
 * Usage: tsx scripts/test-starter-novel.ts [--help]
 * REQ-565, REQ-566, REQ-622, REQ-622a, REQ-622b, REQ-622c.
 */

import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { StateManager } from "../src/core/state.js";
import { roomIsLit } from "../src/world/parser.js";
import { relationshipPairKey, resolveRelationshipParty } from "../src/core/relationships.js";
import { bootServer } from "./lib/mcp-client.js";
import { installHarnessGuard, harnessComplete } from "./lib/harness-guard.js";
installHarnessGuard();

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log("Usage: test-starter-novel.ts");
  console.log("  Verifies REQ-565/REQ-566 starter seed, tombstone, opt-out, playability.");
  process.exit(0);
}

const SERVER_DIR = join(import.meta.dirname, "..");
const SLUG = "torre-nosferatu";
let passed = 0;
let failed = 0;

async function test(name: string, fn: () => void | Promise<void>): Promise<void> {
  try { await fn(); passed++; console.log(`  PASS ${name}`); }
  catch (e: unknown) { failed++; console.error(`  FAIL ${name}: ${(e as Error).message}`); }
}
function assert(cond: unknown, msg: string): void {
  if (!cond) throw new Error(msg);
}
function freshDir(): string {
  const d = mkdtempSync(join(tmpdir(), "holonovel-starter-"));
  mkdirSync(d, { recursive: true });
  return d;
}
function healthJson(text: string): Record<string, any> {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  return JSON.parse(text.slice(start, end + 1));
}

async function main(): Promise<void> {
  await test("T658/REQ-565: fresh install seeds the starter once", () => {
    const dir = freshDir();
    const s = new StateManager(dir);
    s.seedStarterNovel();
    s.hydrateNovelsFromDisk();
    assert(s.starterStatus.seeded === true, "starterStatus.seeded true");
    assert(s.novels.has(SLUG), "starter Novel is hydrated");
    assert(existsSync(join(dir, "novels", `${SLUG}.json`)), "starter save written");
    assert(existsSync(join(dir, "starter-seeded.json")), "tombstone sentinel written");
    rmSync(dir, { recursive: true, force: true });
  });

  await test("T658/REQ-565: tombstone suppresses re-seed after deletion", () => {
    const dir = freshDir();
    new StateManager(dir).seedStarterNovel();
    rmSync(join(dir, "novels", `${SLUG}.json`));
    const s = new StateManager(dir);
    s.seedStarterNovel();
    s.hydrateNovelsFromDisk();
    assert(s.starterStatus.skipped === "already-seeded", "second seed skipped");
    assert(!s.novels.has(SLUG), "deleted starter is not resurrected");
    rmSync(dir, { recursive: true, force: true });
  });

  await test("T658/REQ-565: TTRPG_STARTER_NOVEL=off opts out", () => {
    const dir = freshDir();
    process.env.TTRPG_STARTER_NOVEL = "off";
    const s = new StateManager(dir);
    try {
      s.seedStarterNovel();
      s.hydrateNovelsFromDisk();
    } finally {
      delete process.env.TTRPG_STARTER_NOVEL;
    }
    assert(s.starterStatus.skipped === "opt-out", "opt-out recorded");
    assert(!s.novels.has(SLUG), "no starter seeded under opt-out");
    rmSync(dir, { recursive: true, force: true });
  });

  await test("T658/REQ-565: a missing asset is non-fatal", () => {
    const dir = freshDir();
    process.env.TTRPG_STARTER_NOVEL = "no-such-starter";
    const s = new StateManager(dir);
    try {
      s.seedStarterNovel();
    } finally {
      delete process.env.TTRPG_STARTER_NOVEL;
    }
    assert(s.starterStatus.skipped === "asset-missing", "missing asset recorded, not thrown");
    rmSync(dir, { recursive: true, force: true });
  });

  await test("T658/REQ-565: seeded Novel resumes and is playable with no ruleset", async () => {
    const c = await bootServer({ serverDir: SERVER_DIR, env: { TTRPG_BADGE: "game_master" } });
    try {
      const list = await c.call("manage_novel", { action: "list" });
      assert(list.text.includes(SLUG), "starter listed");
      const resume = await c.call("manage_novel", { action: "resume", slug: SLUG });
      assert(!resume.isError, `resume failed: ${resume.text}`);
      const look = await c.call("run_command", { action: "execute", command: "look" });
      assert(!look.isError, `look failed: ${look.text}`);
      assert(look.text.length > 20, "look returned room content ruleset-free");
      const visibility = await c.call("run_command", { action: "visibility", target: "Your Candle" });
      assert(!visibility.isError, `visibility failed: ${visibility.text}`);
      assert(visibility.text.includes('"can_see": true'), "the lit Spire is visible to the active entity");

      const cancel = await c.call("respond_decision", { decision: "present_choices", option: "cancel" });
      assert(!cancel.isError, `cancel failed: ${cancel.text}`);
      const gmSet = await c.call("set_badge", { badge: "game_master" });
      assert(!gmSet.isError, `GM badge failed: ${gmSet.text}`);
      const gm = await c.getPrompt("badge_briefing");
      assert(gm.includes("### Who They Are"), "who-they-are missing from the GM briefing");
      assert(gm.includes("A solicitor who came to Torre Nosferatu"), "authored calling facet missing");
      assert(gm.includes("You were sent to be a witness"), "unaware facet missing from the GM render");
      const npcGet = JSON.parse((await c.call("manage_npc", { action: "get", npc_id: "npc_mv4m1599" })).text);
      assert(npcGet.identity?.summary?.includes("calling"), "GM NPC read carries the identity summary");
      assert(npcGet.identity?.summary?.includes("count"), "GM NPC read carries the second facet");
      const playerSet = await c.call("set_badge", { badge: "player" });
      assert(!playerSet.isError, `Player badge failed: ${playerSet.text}`);
      const player = await c.getPrompt("badge_briefing");
      assert(player.includes("Keep the record exact"), "aware facet missing from the Player render");
      assert(!player.includes("You were sent to be a witness"), "unaware facet leaked to the Player render");
      const playerNpc = JSON.parse((await c.call("manage_npc", { action: "get", npc_id: "npc_mv4m1599" })).text);
      assert(playerNpc.identity === undefined, "Player NPC read must not carry the identity summary");
      await c.call("set_badge", { badge: "game_master" });
    } finally {
      await c.close();
    }
  });

  await test("T658/REQ-565: starter content keeps locks, light, and presence wired", () => {
    const dir = freshDir();
    const s = new StateManager(dir);
    s.seedStarterNovel();
    s.hydrateNovelsFromDisk();
    const novel = s.novels.get(SLUG);
    try {
      assert(novel, "starter hydrated");
      assert(novel!.characters_present_ids.includes("character_01"), "active entity marked present");

      const snapshot = novel!.pending_workflow?.snapshot?.state;
      assert(snapshot, "opening workflow snapshot exists");
      assert(Object.keys(snapshot.world?.rooms ?? {}).length === 94, "opening snapshot carries the world");
      assert(snapshot.entities?.character_01, "opening snapshot carries the active entity");
      assert(snapshot.pending_workflow === null, "opening snapshot is not recursive");

      const world = novel!.world;
      for (const floor of ["Seventh", "Sixth", "Fifth", "Fourth", "Third", "Second"]) {
        const room = world.rooms.get(`${floor.toLowerCase()} floor — grand stair`);
        assert(room?.doorRefs.get("down") === `${floor} Floor Stair Door`, `${floor} stair door bound to its exit`);
      }
      const antechamber = world.rooms.get("first floor — antechamber");
      assert(antechamber?.doorRefs.get("out") === "The Exit Door", "exit door bound to the out exit");

      const candle = [...world.things.values()].find((t) => t.name === "Your Candle");
      assert(candle?.lit && candle?.switched_on, "the starting candle is lit and switched on");
      assert(candle?.wearable === false, "the candle is held, not worn");
      assert([...world.things.values()].every((t) => !t.wearable), "no authored thing is wearable");
      assert(novel!.story_beats.length === 4, "the starter carries four authored beats");
      assert(
        novel!.story_beats.every((b) => /^[^.!?]*[.!?]$/.test(b.scene_preview)),
        "every authored beat preview is exactly one sentence",
      );
      assert(roomIsLit(world, "Seventh Floor — Spire"), "the Spire is lit");
      const candleClock = novel!.countdowns.get("The Candle");
      assert(candleClock?.ticks === 30, "the Candle starts at 30 wax");
      assert(candleClock?.total === 100, "the Candle capacity is 100");
      assert(candleClock?.survival?.bundle_increment === 10, "the Candle declares a ten-tick bundle increment");
      assert(candleClock?.survival?.per_use_decrement === 1, "the Candle declares a one-tick per-use decrement");
      assert(candleClock?.survival?.last_light_ticks === 3, "the Candle declares a three-tick last light");
      assert(candleClock?.survival?.light_thing === "your candle", "the Candle binds its light thing");
      assert(candleClock?.survival?.unit_countdown === "Matches", "the Candle binds its relight units");
      const waxBundles = [...world.things.values()].filter((t) => t.annotations?.bundle_of === "The Candle");
      assert(waxBundles.length === 7, "seven wax bundles are annotation-bound");
      const matchesClock = novel!.countdowns.get("Matches");
      assert(matchesClock?.ticks === 0 && matchesClock?.direction === "increment", "matches start at zero");
      assert(matchesClock?.survival?.bundle_increment === 2, "a match bundle adds two");
      const matchBundles = [...world.things.values()].filter((t) => t.annotations?.bundle_of === "Matches");
      assert(matchBundles.length === 3, "three match bundles are annotation-bound");
      const bundles = [...world.things.values()].filter((t) => /^Matches \(/.test(t.name));
      assert(bundles.length === 3 && bundles.every((t) => /Two matches/.test(t.description ?? "")), "three bundles carry two matches");
      const hazardRooms = [...world.rooms.values()].filter((r) => r.annotations?.trap || r.annotations?.encounter);
      assert(hazardRooms.length === 12, "twelve hazard rooms are annotated");
      assert([...world.rooms.values()].filter((r) => r.annotations?.encounter).length === 6, "six encounter rooms spill wax");
      assert([...world.rooms.values()].filter((r) => r.annotations?.trap).length === 6, "six trap rooms resolve snuff checks");
      assert(hazardRooms.every((r) => (r.annotations.trap ? r.annotations.trap.resource === "The Candle" && r.annotations.trap.faces === 8 : true)), "trap annotations carry structured resource and faces");
      assert([...novel!.npcs.values()].filter((n) => n.disposition === "friendly").length === 1, "only Petr starts friendly");
      assert([...novel!.npcs.values()].filter((n) => n.disposition === "wary").length >= 3, "the survivors start cold");
      const sensory = [...world.things.values()].filter((t) => t.noise || t.scent);
      assert(sensory.length >= 3, "starter content exercises sensory cues");
      const talkative = [...novel!.npcs.values()].filter((n) => typeof (n as any).talkativeness === "number");
      assert(talkative.length >= 3, "starter NPCs carry talkativeness");
      const identity = [...novel!.npcs.values()].filter((n) => ((n as any).mind?.identity_core?.length ?? 0) > 0);
      assert(identity.length >= 2, "starter NPCs carry identity cores");

      const relationships = novel!.relationships;
      assert(relationships.length === 30, `30 relationships, got ${relationships.length}`);
      const pairKeys = new Set<string>();
      for (const rel of relationships) {
        assert(resolveRelationshipParty(novel!, rel.entity_a), `relationship source resolves: ${rel.entity_a}`);
        assert(resolveRelationshipParty(novel!, rel.entity_b), `relationship target resolves: ${rel.entity_b}`);
        const key = relationshipPairKey(novel!, rel);
        assert(!pairKeys.has(key), `duplicate relationship pair: ${rel.entity_a} -> ${rel.entity_b}`);
        pairKeys.add(key);
      }
      const hasPair = (a: string, b: string): boolean => relationships.some((rel) => {
        const ra = resolveRelationshipParty(novel!, rel.entity_a);
        const rb = resolveRelationshipParty(novel!, rel.entity_b);
        return ra?.id === resolveRelationshipParty(novel!, a)?.id && rb?.id === resolveRelationshipParty(novel!, b)?.id;
      });
      for (const [a, b] of [
        ["Vlask", "Sister Marta"],
        ["Vlask", "Ilona"],
        ["Vlask", "Count Orlok"],
        ["Sister Marta", "Petr"],
        ["Sister Marta", "Nadja"],
        ["Sister Marta", "Count Orlok"],
        ["Ilona", "Nadja"],
        ["Petr", "Nadja"],
      ]) {
        assert(hasPair(a, b), `missing pair: ${a} -> ${b}`);
      }
      for (const name of ["Vlask", "Sister Marta", "Ilona", "Petr", "Nadja", "Count Orlok"]) {
        assert(hasPair(name, "The Survivors"), `missing faction link: ${name} -> The Survivors`);
      }

      const identities = novel!.identities;
      assert(identities?.character_01?.facets.length === 12, "protagonist identity facets missing");
      assert(identities?.npc_mv4m1599?.facets.length === 3, "NPC identity facets missing");
      assert(identities?.character_01?.facets.some((f) => f.kind === "contradiction"), "protagonist contradiction facet missing");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  await test("T658/REQ-565: cancelling the opening choice preserves the world", async () => {
    const c = await bootServer({ serverDir: SERVER_DIR, env: { TTRPG_BADGE: "game_master" } });
    try {
      const resume = await c.call("manage_novel", { action: "resume", slug: SLUG });
      assert(!resume.isError, `resume failed: ${resume.text}`);
      const cancel = await c.call("respond_decision", { decision: "present_choices", option: "cancel" });
      assert(!cancel.isError, `cancel failed: ${cancel.text}`);
      const state = JSON.parse(readFileSync(join(c.dataDir, "novels", `${SLUG}.json`), "utf-8"));
      assert(Object.keys(state.world?.rooms ?? {}).length === 94, "world survives cancel");
      assert(state.entities?.character_01, "active entity survives cancel");
      assert(state.pending_workflow === null, "pending workflow cleared");
    } finally {
      await c.close();
    }
  });

  await test("T741/REQ-622: hazards spill wax, snuff, and expire last light", async () => {
    const dir = freshDir();
    const s = new StateManager(dir);
    s.seedStarterNovel();
    s.hydrateNovelsFromDisk();
    const seeded = s.novels.get(SLUG);
    assert(seeded, "starter hydrated");
    seeded!.scene_location = "Sixth Floor — Connector 4";
    const main = seeded!.entities.get("character_01");
    assert(main, "active entity present");
    main!.current_room = "Sixth Floor — Connector 4";
    const candleCd = seeded!.countdowns.get("The Candle");
    const dreadCd = seeded!.countdowns.get("Dread");
    const matchCd = seeded!.countdowns.get("Matches");
    assert(candleCd && dreadCd && matchCd, "hazard clocks present");
    candleCd!.ticks = 50; dreadCd!.ticks = 8; matchCd!.ticks = 0;
    s.saveNovel(seeded!);

    let c = await bootServer({ serverDir: SERVER_DIR, dataDir: dir, env: { TTRPG_BADGE: "game_master", TTRPG_STARTER_NOVEL: "off", TTRPG_SEED: "1" } });
    try {
      const resume = await c.call("manage_novel", { action: "resume", slug: SLUG });
      assert(!resume.isError, `resume failed: ${resume.text}`);
      const trap = await c.call("run_command", { action: "execute", command: "go north" });
      assert(trap.text.startsWith("[OK]"), `go north failed: ${trap.text.split("\n")[0]}`);
      let state = JSON.parse(readFileSync(join(c.dataDir, "novels", `${SLUG}.json`), "utf-8"));
      assert(state.countdowns["The Candle"].ticks === 49, `candle should be 49, got ${state.countdowns["The Candle"].ticks}`);
      assert(state.countdowns["The Candle — last light"]?.ticks === 3, "a no-match snuff starts a three-tick last light");
      assert(state.world.things["your candle"].lit === false, "a no-match snuff extinguishes the candle");
      assert(state.countdowns["Matches"].ticks === 0, "no match is spent without one");

      // REQ-050c — restart continuity: the snuff, last light, and wax survive
      // a cross-process reload, and the next hazard roll stays seeded.
      await c.close();
      c = await bootServer({ serverDir: SERVER_DIR, dataDir: dir, env: { TTRPG_BADGE: "game_master", TTRPG_STARTER_NOVEL: "off", TTRPG_SEED: "1" } });
      const resumed = await c.call("manage_novel", { action: "resume", slug: SLUG });
      assert(!resumed.isError, `restart resume failed: ${resumed.text}`);
      state = JSON.parse(readFileSync(join(c.dataDir, "novels", `${SLUG}.json`), "utf-8"));
      assert(state.countdowns["The Candle"].ticks === 49 && state.countdowns["The Candle — last light"]?.ticks === 3, "hazard state survives restart");

      const exit = await c.call("run_command", { action: "execute", command: "go south" });
      assert(exit.text.startsWith("[OK]"), "leave the trap");
      const warren = await c.call("run_command", { action: "execute", command: "go east" });
      assert(warren.text.startsWith("[OK]"), `enter the warren: ${warren.text.split("\n")[0]}`);
      const back = await c.call("run_command", { action: "execute", command: "go west" });
      assert(back.text.startsWith("[OK]"), "return to the connector");
      state = JSON.parse(readFileSync(join(c.dataDir, "novels", `${SLUG}.json`), "utf-8"));
      assert(!state.countdowns["The Candle — last light"], "last light expires after three transitions");
      assert(!state.world.rooms["first floor — antechamber"].exits?.out, "last light seals the exit");
    } finally {
      await c.close();
      rmSync(dir, { recursive: true, force: true });
    }
  });

  await test("T742/REQ-622a: a bundle adds two matches and a match relights", async () => {
    const dir = freshDir();
    const s = new StateManager(dir);
    s.seedStarterNovel();
    s.hydrateNovelsFromDisk();
    const seeded = s.novels.get(SLUG);
    assert(seeded, "starter hydrated");
    seeded!.scene_location = "Sixth Floor — Connector 2";
    const main = seeded!.entities.get("character_01");
    assert(main, "active entity present");
    main!.current_room = "Sixth Floor — Connector 2";
    const candleCd = seeded!.countdowns.get("The Candle");
    const dreadCd = seeded!.countdowns.get("Dread");
    const matchCd = seeded!.countdowns.get("Matches");
    assert(candleCd && dreadCd && matchCd, "hazard clocks present");
    candleCd!.ticks = 50; dreadCd!.ticks = 8; matchCd!.ticks = 0;
    s.saveNovel(seeded!);

    const c = await bootServer({ serverDir: SERVER_DIR, dataDir: dir, env: { TTRPG_BADGE: "game_master", TTRPG_STARTER_NOVEL: "off", TTRPG_SEED: "1" } });
    try {
      const resume = await c.call("manage_novel", { action: "resume", slug: SLUG });
      assert(!resume.isError, `resume failed: ${resume.text}`);
      const took = await c.call("run_command", { action: "execute", command: "take matches" });
      assert(took.text.startsWith("[OK]"), `take matches failed: ${took.text.split("\n")[0]}`);
      let state = JSON.parse(readFileSync(join(c.dataDir, "novels", `${SLUG}.json`), "utf-8"));
      assert(state.countdowns["Matches"].ticks === 2, `bundle should add two, got ${state.countdowns["Matches"].ticks}`);

      const moved = await c.call("manage_scene", { action: "set", location: "Sixth Floor — Connector 4", skip_transition_hook: true });
      assert(!moved.isError, `scene set failed: ${moved.text}`);
      const trap = await c.call("run_command", { action: "execute", command: "go north" });
      assert(trap.text.startsWith("[OK]"), `go north failed: ${trap.text.split("\n")[0]}`);
      state = JSON.parse(readFileSync(join(c.dataDir, "novels", `${SLUG}.json`), "utf-8"));
      assert(state.countdowns["Matches"].ticks === 1, "a relight spends one match");
      assert(state.world.things["your candle"].lit === true, "a match relights the candle");
      assert(!state.countdowns["The Candle — last light"], "a relight cancels last light");
    } finally {
      await c.close();
      rmSync(dir, { recursive: true, force: true });
    }
  });

  await test("T742/REQ-622c: a unit buys last light at wax-out", async () => {
    const dir = freshDir();
    const s = new StateManager(dir);
    s.seedStarterNovel();
    s.hydrateNovelsFromDisk();
    const seeded = s.novels.get(SLUG);
    assert(seeded, "starter hydrated");
    seeded!.countdowns.get("The Candle")!.ticks = 1;
    seeded!.countdowns.get("Dread")!.ticks = 0;
    seeded!.countdowns.get("Matches")!.ticks = 2;
    s.saveNovel(seeded!);

    const c = await bootServer({ serverDir: SERVER_DIR, dataDir: dir, env: { TTRPG_BADGE: "game_master", TTRPG_STARTER_NOVEL: "off", TTRPG_SEED: "1" } });
    try {
      const resume = await c.call("manage_novel", { action: "resume", slug: SLUG });
      assert(!resume.isError, `resume failed: ${resume.text}`);
      const advanced = await c.call("manage_countdown", { action: "advance", name: "The Candle" });
      assert(!advanced.isError, `advance failed: ${advanced.text}`);
      const state = JSON.parse(readFileSync(join(c.dataDir, "novels", `${SLUG}.json`), "utf-8"));
      assert(!state.countdowns["The Candle"], "the expiring resource is consumed");
      assert(state.countdowns["The Candle — last light"]?.ticks === 3, "a unit buys the declared last light");
      assert(state.countdowns["Matches"].ticks === 1, "the reprieve spends one unit");
    } finally {
      await c.close();
      rmSync(dir, { recursive: true, force: true });
    }
  });

  await test("T741/REQ-622: a malformed annotation warns and permits entry", async () => {
    const dir = freshDir();
    const s = new StateManager(dir);
    s.seedStarterNovel();
    s.hydrateNovelsFromDisk();
    const seeded = s.novels.get(SLUG);
    assert(seeded, "starter hydrated");
    seeded!.scene_location = "Sixth Floor — Connector 4";
    const main = seeded!.entities.get("character_01");
    assert(main, "active entity present");
    main!.current_room = "Sixth Floor — Connector 4";
    const warren = seeded!.world.rooms.get("sixth floor — beast warren");
    assert(warren, "warren present");
    (warren as any).annotations = { trap: { snuff: 5 } };
    seeded!.countdowns.get("The Candle")!.ticks = 50;
    seeded!.countdowns.get("Dread")!.ticks = 0;
    s.saveNovel(seeded!);

    const c = await bootServer({ serverDir: SERVER_DIR, dataDir: dir, env: { TTRPG_BADGE: "game_master", TTRPG_STARTER_NOVEL: "off", TTRPG_SEED: "1" } });
    try {
      const resume = await c.call("manage_novel", { action: "resume", slug: SLUG });
      assert(!resume.isError, `resume failed: ${resume.text}`);
      const entered = await c.call("run_command", { action: "execute", command: "go east" });
      assert(entered.text.startsWith("[OK]"), `entry must not be blocked: ${entered.text.split("\n")[0]}`);
      assert(/\[WARNING\] room 'Sixth Floor — Beast Warren': trap annotation/.test(entered.text), `warning expected: ${entered.text}`);
      const state = JSON.parse(readFileSync(join(c.dataDir, "novels", `${SLUG}.json`), "utf-8"));
      assert(state.entities.character_01.current_room?.toLowerCase() === "sixth floor — beast warren", "the move landed");
    } finally {
      await c.close();
      rmSync(dir, { recursive: true, force: true });
    }
  });

  await test("T741/REQ-622a: an encounter subtracts its declared spill", async () => {
    const dir = freshDir();
    const s = new StateManager(dir);
    s.seedStarterNovel();
    s.hydrateNovelsFromDisk();
    const seeded = s.novels.get(SLUG);
    assert(seeded, "starter hydrated");
    seeded!.scene_location = "Sixth Floor — Connector 4";
    const main = seeded!.entities.get("character_01");
    assert(main, "active entity present");
    main!.current_room = "Sixth Floor — Connector 4";
    seeded!.countdowns.get("The Candle")!.ticks = 50;
    seeded!.countdowns.get("Dread")!.ticks = 0;
    s.saveNovel(seeded!);

    const c = await bootServer({ serverDir: SERVER_DIR, dataDir: dir, env: { TTRPG_BADGE: "game_master", TTRPG_STARTER_NOVEL: "off", TTRPG_SEED: "1" } });
    try {
      const resume = await c.call("manage_novel", { action: "resume", slug: SLUG });
      assert(!resume.isError, `resume failed: ${resume.text}`);
      const entered = await c.call("run_command", { action: "execute", command: "go east" });
      assert(entered.text.startsWith("[OK]"), `entry failed: ${entered.text.split("\n")[0]}`);
      const state = JSON.parse(readFileSync(join(c.dataDir, "novels", `${SLUG}.json`), "utf-8"));
      // One scene-transition tick (REQ-353) plus the declared spill of 1.
      assert(state.countdowns["The Candle"].ticks === 48, `wax should be 48, got ${state.countdowns["The Candle"].ticks}`);
      const spill = (state.audit_log ?? []).find((e: any) => e.tool === "hazard_spill");
      assert(spill, "the spill is audited");
      const args = JSON.parse(spill.args);
      assert(args.resource === "The Candle" && args.spill === 1, `spill names the resource: ${spill.args}`);
    } finally {
      await c.close();
      rmSync(dir, { recursive: true, force: true });
    }
  });

  await test("T742/REQ-622c: the Player badge sees units without a tick total", async () => {
    const c = await bootServer({ serverDir: SERVER_DIR, env: { TTRPG_BADGE: "player" } });
    try {
      const resume = await c.call("manage_novel", { action: "resume", slug: SLUG });
      assert(!resume.isError, `resume failed: ${resume.text}`);
      // The seeded Novel persists badge "none" and an opening decision; clear
      // both before switching to the Player badge.
      await c.call("respond_decision", { decision: "present_choices", option: "cancel" });
      const badge = await c.call("set_badge", { badge: "player" });
      assert(!badge.isError, `badge switch failed: ${badge.text}`);
      const list = await c.call("manage_countdown", { action: "list" });
      assert(!list.isError, `list failed: ${list.text}`);
      const rows = JSON.parse(list.text);
      assert(Array.isArray(rows) && rows.length > 0, "the player sees active countdowns");
      assert(rows.every((r: any) => !("total" in r)), "the player list omits tick totals");
      assert(rows.every((r: any) => typeof r.ticks === "number"), "the player list reports remaining units");
    } finally {
      await c.close();
    }
  });

  await test("T742/REQ-622b: climbing into a hazard room resolves the hazard", async () => {
    const dir = freshDir();
    const s = new StateManager(dir);
    s.seedStarterNovel();
    s.hydrateNovelsFromDisk();
    const seeded = s.novels.get(SLUG);
    assert(seeded, "starter hydrated");
    seeded!.scene_location = "Sixth Floor — Connector 4";
    const main = seeded!.entities.get("character_01");
    assert(main, "active entity present");
    main!.current_room = "Sixth Floor — Connector 4";
    seeded!.countdowns.get("The Candle")!.ticks = 50;
    seeded!.countdowns.get("Dread")!.ticks = 8;
    seeded!.countdowns.get("Matches")!.ticks = 0;
    seeded!.world.things.set("iron ladder", {
      name: "Iron Ladder", description: "An iron ladder bolted into the shaft.", kind: "thing",
      location: "Sixth Floor — Connector 4", locationType: "room",
      portable: false, openable: false, open: false, lockable: false, locked: false,
      lit: false, switchable: false, switched_on: false, enterable: false, vehiclePassengers: [],
      wearable: false, worn_by: null, readable: false, read_text: null, edible: false,
      drinkable: false, climbable: true, transparent: false, noise: null, scent: null, annotations: {},
    } as any);
    seeded!.world.rooms.get("sixth floor — connector 4")!.exits.set("up", "Sixth Floor — Trap Hall");
    s.saveNovel(seeded!);

    const c = await bootServer({ serverDir: SERVER_DIR, dataDir: dir, env: { TTRPG_BADGE: "game_master", TTRPG_STARTER_NOVEL: "off", TTRPG_SEED: "1" } });
    try {
      const resume = await c.call("manage_novel", { action: "resume", slug: SLUG });
      assert(!resume.isError, `resume failed: ${resume.text}`);
      const climbed = await c.call("run_command", { action: "execute", command: "climb iron ladder" });
      assert(climbed.text.startsWith("[OK]"), `climb failed: ${climbed.text.split("\n")[0]}`);
      const state = JSON.parse(readFileSync(join(c.dataDir, "novels", `${SLUG}.json`), "utf-8"));
      assert(state.countdowns["The Candle — last light"]?.ticks === 3, "the trap fired on the climb entry path");
      assert(state.world.things["your candle"].lit === false, "the climb snuff extinguished the light");
    } finally {
      await c.close();
      rmSync(dir, { recursive: true, force: true });
    }
  });

  await test("T659/REQ-566: spec_health reports provenance with no stale flag", async () => {
    const c = await bootServer({ serverDir: SERVER_DIR, env: { TTRPG_BADGE: "game_master" } });
    try {
      const health = await c.call("manage_diagnostics", { action: "health" });
      const h = healthJson(health.text);
      assert(h.starter?.slug === SLUG, "starter slug reported");
      assert(h.starter?.seeded === true, "starter seeded reported");
      assert(h.data_health?.stale && Object.keys(h.data_health.stale).length === 0,
        "no [data-stale] entry for the seeded starter");
    } finally {
      await c.close();
    }
  });

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed === 0) harnessComplete();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
