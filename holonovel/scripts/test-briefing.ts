#!/usr/bin/env node
// Briefing-consistency harness — REQ-515 (readiness cursor), REQ-516 [gate]
// (consistency declaration), REQ-517 (derived-surface freshness), REQ-518
// (determinism), REQ-519 (read-only), REQ-520 (visibility), REQ-521 (staleness
// advisory).

import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { installHarnessGuard, harnessComplete } from "./lib/harness-guard.js";
installHarnessGuard();

const SERVER_SCRIPT = join(process.cwd(), "src", "index.ts");
const DATA_DIR = mkdtempSync(join(tmpdir(), "brief-"));
let msgId = 0; const pending = new Map(); let buffer = "";
function send(proc: any, msg: any): Promise<any> { return new Promise((r) => { const id = ++msgId; pending.set(id, r); proc.stdin!.write(JSON.stringify({ ...msg, id, jsonrpc: "2.0" }) + "\n"); }); }
function attach(proc: any) { buffer = ""; proc.stdout!.on("data", (d: Buffer) => { buffer += d.toString(); const ls = buffer.split("\n"); buffer = ls.pop() ?? ""; for (const l of ls) { if (!l.trim()) continue; try { const m = JSON.parse(l); if (m.id !== undefined && pending.has(m.id)) { pending.get(m.id)!(m); pending.delete(m.id); } } catch { /* non-JSON */ } } }); }
async function boot(env: Record<string, string> = {}) { const p = spawn("npx", ["tsx", SERVER_SCRIPT], { env: { ...process.env, TTRPG_DATA_DIR: DATA_DIR, ...env }, stdio: ["pipe", "pipe", "pipe"] }); attach(p); await send(p, { method: "initialize", params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "brief", version: "1" } } }); p.stdin!.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n"); await new Promise((r) => setTimeout(r, 250)); return p; }
async function call(proc: any, name: string, args: any = {}): Promise<string> { const r = await send(proc, { method: "tools/call", params: { name, arguments: args } }); if (r.error) throw new Error(`${name}: ${r.error.message ?? JSON.stringify(r.error)}`); return (r.result?.content ?? []).map((x: any) => x?.text ?? "").join("\n"); }
async function health(p: any): Promise<any> { return JSON.parse(await call(p, "manage_diagnostics", { action: "health" })); }
async function promptText(p: any, name: string): Promise<string> { const r = await send(p, { method: "prompts/get", params: { name, arguments: {} } }); return (r.result?.messages ?? []).map((m: any) => m.content?.text ?? "").join("\n"); }
async function resource(p: any, uri: string): Promise<string> { const r = await send(p, { method: "resources/read", params: { uri } }); return (r.result?.contents ?? []).map((x: any) => x.text ?? "").join("\n"); }
async function kill(proc: any) { try { proc.kill("SIGKILL"); } catch { /* exited */ } await new Promise((r) => setTimeout(r, 100)); }

let passed = 0; let failed = 0;
async function test(name: string, fn: () => void | Promise<void>) { try { await fn(); passed++; console.log(`PASS ${name}`); } catch (e: any) { failed++; console.error(`FAIL ${name}: ${e.message ?? e}`); } }
function assert(c: any, m: string) { if (!c) throw new Error(m); }
async function newNovel(p: any, name: string) { await call(p, "manage_novel", { action: "create", name }); await call(p, "set_badge", { badge: "game_master" }); }

async function main() {
  await test("T620/REQ-515: the briefing reports the event-log cursor", async () => {
    const p = await boot(); await newNovel(p, "bc1");
    await call(p, "manage_diagnostics", { action: "event", text: "one" });
    await call(p, "manage_diagnostics", { action: "event", text: "two" });
    const bc = (await health(p)).briefing_consistency;
    assert(bc.available === true && bc.through_ordinal === 2, "cursor wrong: " + JSON.stringify(bc));
    await kill(p);
  });

  await test("T621/REQ-516: consistency is declared", async () => {
    const p = await boot(); await newNovel(p, "bc2");
    const bc = (await health(p)).briefing_consistency;
    assert(bc.available === true && typeof bc.through_ordinal === "number", "consistency not declared: " + JSON.stringify(bc));
    await kill(p);
  });

  await test("T622/REQ-517: derived-surface freshness is reported", async () => {
    const p = await boot(); await newNovel(p, "bc3");
    await call(p, "manage_lore", { action: "set", key: "dragon", content: "a dragon", badge_scope: "shared" });
    let bc = (await health(p)).briefing_consistency;
    assert(bc.index === "unbuilt" && bc.graph === "unbuilt", "expected unbuilt: " + JSON.stringify(bc));
    await call(p, "manage_knowledge", { action: "index_build" });
    await call(p, "manage_knowledge", { action: "graph_build" });
    bc = (await health(p)).briefing_consistency;
    assert(bc.index === "current" && bc.graph === "current", "expected current: " + JSON.stringify(bc));
    await call(p, "manage_lore", { action: "set", key: "tower", content: "a tower", badge_scope: "shared" });
    bc = (await health(p)).briefing_consistency;
    assert(bc.index === "stale" && bc.graph === "stale", "expected stale: " + JSON.stringify(bc));
    await kill(p);
  });

  await test("T623/REQ-518: repeated reports are identical", async () => {
    const p = await boot(); await newNovel(p, "bc4");
    await call(p, "manage_diagnostics", { action: "event", text: "x" });
    const a = JSON.stringify((await health(p)).briefing_consistency);
    const b = JSON.stringify((await health(p)).briefing_consistency);
    assert(a === b, "consistency report is not deterministic: " + a + " vs " + b);
    await kill(p);
  });

  await test("T624/REQ-519: the consistency report mutates nothing", async () => {
    const p = await boot(); await newNovel(p, "bc5");
    await call(p, "manage_diagnostics", { action: "event", text: "one" });
    const before = (await health(p)).briefing_consistency.through_ordinal;
    await health(p); await health(p);
    const after = (await health(p)).briefing_consistency.through_ordinal;
    assert(before === after, "consistency report changed the cursor: " + before + " -> " + after);
    await kill(p);
  });

  await test("T625/REQ-520: the report is available to every badge", async () => {
    const p = await boot(); await newNovel(p, "bc6");
    for (const badge of ["player", "observer"]) {
      await call(p, "set_badge", { badge });
      const bc = (await health(p)).briefing_consistency;
      assert(bc.available === true, `report unavailable to ${badge}: ` + JSON.stringify(bc));
    }
    await kill(p);
  });

  await test("T626/REQ-521: staleness is an advisory and the briefing still renders", async () => {
    const p = await boot(); await newNovel(p, "bc7");
    await call(p, "manage_lore", { action: "set", key: "dragon", content: "a dragon", badge_scope: "shared" });
    await call(p, "manage_knowledge", { action: "index_build" });
    await call(p, "manage_lore", { action: "set", key: "tower", content: "a tower", badge_scope: "shared" });
    const bc = (await health(p)).briefing_consistency;
    assert(typeof bc.advisory === "string" && bc.advisory.includes("stale"), "stale advisory missing: " + JSON.stringify(bc));
    const text = await promptText(p, "badge_briefing");
    assert(text.includes("Briefing consistency"), "briefing did not render the consistency line");
    await kill(p);
  });

  await test("T148/REQ-134: player briefing lists only Player-callable tools", async () => {
    const p = await boot(); await newNovel(p, "bc8");
    await call(p, "manage_world", { action: "create_room", name: "The Hall", description: "A hall." });
    await call(p, "manage_scene", { action: "set", description: "In the hall", location: "Hall" });
    await call(p, "set_badge", { badge: "player" });
    const text = await promptText(p, "badge_briefing");
    assert(!text.includes('command("'), "player briefing named a non-existent command() tool");
    assert(!text.includes("run_command (action: resolve)"), "player briefing suggested the Player-forbidden resolve action");
    assert(text.includes("run_command (action: execute"), "ruleset-free player should be offered the parser (REQ-218/REQ-309e)");
    assert(text.includes("### Surroundings") && text.includes("The Hall"), "player surroundings did not resolve the room");
    const suggest = await call(p, "run_command", { action: "suggest", intent: "look around" });
    assert(!suggest.includes('command("'), "suggest named a non-existent command() tool");
    assert(!suggest.includes("(action: resolve)"), "suggest offered the Player-forbidden resolve action");
    assert(suggest.includes("run_command (action: execute"), "ruleset-free player suggest should offer the parser");
    await kill(p);
  });

  await test("T391/REQ-341: player surroundings resolve an article-prefixed scene location", async () => {
    const p = await boot(); await newNovel(p, "bc9");
    await call(p, "manage_world", { action: "create_room", name: "The Vault", description: "A vault." });
    await call(p, "manage_scene", { action: "set", description: "The vault", location: "Vault" });
    await call(p, "set_badge", { badge: "player" });
    const text = await promptText(p, "badge_briefing");
    assert(text.includes("### Surroundings") && text.includes("The Vault"), "article-prefixed location not resolved: " + text.slice(0, 200));
    await kill(p);
  });

  await test("T482: turn handoff follows the AI narrative role and survives the never-truncated tier", async () => {
    // REQ-412: the directive's variant follows the AI's narrative role
    // (REQ-304), not the human badge; it renders in the never-truncated tier
    // (REQ-135). Each combination gets its own server because the role is
    // read from the environment at request time.
    const handoff = (brief: string): "invite" | "handback" | "none" => {
      const start = brief.indexOf("### Turn handoff");
      if (start < 0) return "none";
      const next = brief.indexOf("\n### ", start + 5);
      const section = brief.slice(start, next < 0 ? undefined : next);
      if (/inviting the player/i.test(section)) return "invite";
      if (/hands initiative back/i.test(section)) return "handback";
      return "none";
    };
    const cases: Array<[Record<string, string>, string, "invite" | "handback" | "none"]> = [
      [{ TTRPG_AI_ROLE: "player" }, "player", "handback"],
      [{ TTRPG_AI_ROLE: "player" }, "observer", "handback"],
      [{ TTRPG_AI_ROLE: "game_master" }, "player", "invite"],
      [{ TTRPG_AI_ROLE: "game_master" }, "game_master", "none"],
      [{ TTRPG_MAX_BRIEFING_TOKENS: "400" }, "player", "invite"],
    ];
    for (const [env, badge, expected] of cases) {
      const p = await boot(env);
      try {
        await newNovel(p, `ho-${badge}-${Object.keys(env)[0]}-${expected}`);
        await call(p, "set_badge", { badge });
        const got = handoff(await promptText(p, "badge_briefing"));
        assert(got === expected, `${JSON.stringify(env)} / badge ${badge}: expected ${expected}, got ${got}`);
      } finally { await kill(p); }
    }
  });

  const SECRET = "The butler killed Lord Ashworth in the library";
  const GM_LORE = "The vault code is 4417";
  const MIND = "Secretly reports to the rival guild";
  async function visibilityNovel(p: any, name: string) {
    await newNovel(p, name);
    await call(p, "manage_lore", { action: "set_secret", key: "murder_confession", content: SECRET });
    await call(p, "manage_lore", { action: "set", key: "vault_code", content: GM_LORE, badge_scope: "game_master", triggers: ["vault"] });
    await call(p, "manage_scene", { action: "set", description: "Inside the vault" });
    const created = await call(p, "manage_character", { action: "create", name: "Rogue" });
    const id = (created.match(/Entity id ([A-Za-z0-9_]+)/) ?? [])[1];
    assert(id, "entity id missing: " + created);
    await call(p, "manage_character", { action: "set_active", entity_id: id });
    await call(p, "manage_npc", { action: "create", name: "Innkeeper", mind: { directive: MIND } });
  }

  await test("T707/REQ-598: narrator clearance follows the AI role, not the badge", async () => {
    const p = await boot(); await visibilityNovel(p, "vis1");
    const narrate = await promptText(p, "narrate");
    assert(narrate.includes("**Narrative role:** Player"), "player-role narrator not named: " + narrate.slice(0, 160));
    assert(!narrate.includes(SECRET), "player-role clearance leaked the secret");
    assert(!narrate.includes(GM_LORE), "player-role clearance leaked GM-only lore");
    assert(!narrate.includes(MIND), "player-role clearance leaked the NPC mind");
    const briefing = await promptText(p, "badge_briefing");
    assert(briefing.includes(GM_LORE), "GM badge briefing should still show GM-only lore");
    assert(briefing.includes("### Knowledge state"), "GM briefing lost its knowledge-state section");
    await kill(p);
  });

  await test("T708/REQ-598: a GM-role narrator receives the full state", async () => {
    const p = await boot({ TTRPG_AI_ROLE: "game_master" }); await visibilityNovel(p, "vis2");
    const narrate = await promptText(p, "narrate");
    assert(narrate.includes("**Narrative role:** Game Master"), "GM-role narrator not named");
    assert(narrate.includes(SECRET), "GM-role clearance dropped the secret");
    assert(narrate.includes(GM_LORE), "GM-role clearance dropped GM-only lore");
    assert(narrate.includes(MIND), "GM-role clearance dropped the NPC mind");
    await kill(p);
  });

  await test("T709/REQ-599: the draft scan redacts player-audience disclosure", async () => {
    const p = await boot(); await visibilityNovel(p, "vis3");
    const leaked = await call(p, "manage_diagnostics", { action: "visibility_check", audience: "player", text: `You learn that ${SECRET}.` });
    assert(leaked.includes("[visibility]") && leaked.includes("[redacted]"), "flagged draft not redacted: " + leaked);
    assert(!leaked.includes(SECRET), "redacted output still carried the secret");
    const clean = await call(p, "manage_diagnostics", { action: "visibility_check", audience: "player", text: "The rogue enters the tavern." });
    assert(!clean.includes("[visibility]") && clean.includes("tavern"), "ordinary prose was flagged: " + clean);
    await call(p, "manage_lore", { action: "set_secret", key: "trap", content: "A pressure plate triggers a dart" });
    const allow = await call(p, "manage_diagnostics", { action: "visibility_check", audience: "player", text: "The trap is sprung." });
    assert(!allow.includes("[redacted]") && allow.includes("The trap is sprung."), "allowlisted common-noun key was redacted: " + allow);
    const gm = await call(p, "manage_diagnostics", { action: "visibility_check", audience: "game_master", text: `You learn that ${SECRET}.` });
    assert(!gm.includes("[visibility]") && gm.includes(SECRET), "GM audience should not be scanned: " + gm);
    await kill(p);
  });

  await test("T710/REQ-599: strict mode refuses a leaked draft", async () => {
    const p = await boot({ TTRPG_NARRATOR_VISIBILITY: "strict" }); await visibilityNovel(p, "vis4");
    const refused = await call(p, "manage_diagnostics", { action: "visibility_check", audience: "player", text: `You learn that ${SECRET}.` });
    assert(refused.includes("[ERROR] [RULE_VIOLATION]"), "strict mode did not refuse: " + refused);
    assert(!refused.includes(SECRET), "strict refusal echoed the secret");
    await kill(p);
  });

  await test("T711/REQ-600: the visibility audit reports decisions without content", async () => {
    const p = await boot(); await visibilityNovel(p, "vis5");
    await call(p, "manage_diagnostics", { action: "visibility_check", audience: "player", text: `You learn that ${SECRET}.` });
    const audit = await call(p, "manage_diagnostics", { action: "visibility_audit" });
    assert(audit.includes("visibility-check") && audit.includes("player"), "audit entry missing: " + audit);
    assert(!audit.includes(SECRET), "audit echoed the secret");
    await kill(p);
  });

  await test("T358/REQ-233a: World in Motion gates NPC pursuit and surfaces ripple changes", async () => {
    // REQ-233a3 — reactivity off: no World in Motion section at all.
    {
      const off = await boot({ TTRPG_WORLD_REACTIVITY: "off", TTRPG_NPC_AUTONOMY: "on" });
      await newNovel(off, "wim-off");
      await call(off, "manage_npc", { action: "create",  name: "Schemer", goals: "Steal the crown" });
      await call(off, "manage_scene", { action: "set",  description: "Throne room" });
      const brief = await promptText(off, "badge_briefing");
      assert(!brief.includes("World in Motion"), "reactivity off still rendered World in Motion");
      await kill(off);
    }

    // REQ-233a2 — autonomy off: no NPC pursuit, but non-NPC changes still surface.
    {
      const p = await boot({ TTRPG_WORLD_REACTIVITY: "on", TTRPG_NPC_AUTONOMY: "off" });
      await newNovel(p, "wim-noautonomy");
      await call(p, "manage_npc", { action: "create",  name: "Schemer", goals: "Steal the crown" });
      const alice = (await call(p, "manage_npc", { action: "create",  name: "Alice" })).match(/\(([^)]+)\)/)?.[1];
      const bob = (await call(p, "manage_npc", { action: "create",  name: "Bob" })).match(/\(([^)]+)\)/)?.[1];
      assert(alice && bob, "NPC ids not reported");
      await call(p, "manage_relationship", { action: "set",  entity_a: alice, entity_b: bob, type: "ally" });
      await call(p, "manage_relationship", { action: "set",  entity_a: alice, entity_b: bob, type: "rival" });
      await call(p, "manage_scene", { action: "set",  description: "Courtyard" });
      const brief = await promptText(p, "badge_briefing");
      assert(brief.includes("World in Motion"), "non-NPC change missing from World in Motion");
      assert(brief.includes("source: relationship"), "ripple entry does not name its source");
      assert(!brief.includes('pursues "Steal the crown"'), "NPC pursuit surfaced with autonomy off");
      await kill(p);
    }

    // REQ-233a1/a3 — an ally→rival flip writes a campaign fact on the
    // connected entity; accepting a change records the GM decision; the fourth
    // deferral escalates to a spec_health warning.
    {
      const p = await boot({ TTRPG_WORLD_REACTIVITY: "on", TTRPG_NPC_AUTONOMY: "on" });
      await newNovel(p, "wim-on");
      await call(p, "manage_npc", { action: "create",  name: "Schemer", goals: "Steal the crown" });
      const alice = (await call(p, "manage_npc", { action: "create",  name: "Alice" })).match(/\(([^)]+)\)/)?.[1];
      const bob = (await call(p, "manage_npc", { action: "create",  name: "Bob" })).match(/\(([^)]+)\)/)?.[1];
      assert(alice && bob, "NPC ids not reported");
      await call(p, "manage_relationship", { action: "set",  entity_a: alice, entity_b: bob, type: "ally" });
      const before = (await health(p)).campaign_memory.threads;
      await call(p, "manage_relationship", { action: "set",  entity_a: alice, entity_b: bob, type: "rival" });
      const afterFlip = (await health(p)).campaign_memory.threads;
      assert(afterFlip > before, "relationship flip wrote no campaign-memory fact");
      await call(p, "manage_scene", { action: "set",  description: "Throne room" });
      const brief = await promptText(p, "badge_briefing");
      assert(brief.includes("World in Motion"), "World in Motion missing at transition");
      assert(brief.toLowerCase().includes("steal the crown"), "NPC goal pursuit missing with autonomy on");

      const changeId = brief.match(/\(change ([^)]+)\)/)?.[1];
      assert(changeId, "no pending world change surfaced");

      // Accept records the GM decision in campaign memory.
      const beforeAccept = (await health(p)).campaign_memory.threads;
      const accepted = await call(p, "respond_decision", { decision: changeId, option: "accept" });
      assert(accepted.includes("[OK]"), "accept refused: " + accepted);
      const afterAccept = (await health(p)).campaign_memory.threads;
      assert(afterAccept > beforeAccept, "accept wrote no campaign-memory fact");

      // Defer re-surfaces at the next transition; the fourth deferral warns.
      await call(p, "manage_scene", { action: "set",  description: "Great hall" });
      const second = await promptText(p, "badge_briefing");
      const deferredId = second.match(/\(change ([^)]+)\)/)?.[1];
      assert(deferredId, "no pending change after the transition");
      for (let i = 0; i < 4; i++) {
        await call(p, "respond_decision", { decision: deferredId, option: "defer" });
      }
      const warnings = (await health(p)).world_reactivity_warnings ?? [];
      assert(warnings.length > 0, "fourth deferral produced no spec_health warning");
      await call(p, "manage_scene", { action: "set",  description: "Courtyard" });
      const third = await promptText(p, "badge_briefing");
      assert(third.includes("modify"), "deferred change did not re-surface with modify");
      await kill(p);
    }
  });

  await test("T351/REQ-307: party presence — listing, [not present], explicit declaration", async () => {
    const p = await boot(); await newNovel(p, "pres1");
    await call(p, "manage_character", { action: "create", name: "Rogue", species: "Human" });
    await call(p, "manage_character", { action: "create", name: "Wizard", species: "Elf" });
    await call(p, "manage_scene", { action: "set", description: "Dark corridor" });
    // REQ-307a — with no presence declaration every imported entity is present.
    let brief = await promptText(p, "badge_briefing");
    assert(brief.includes("### Party"), "party listing missing from the briefing");
    assert(brief.includes("Rogue") && brief.includes("Wizard"), "party listing omits an entity");
    assert(!brief.includes("[not present]"), "default presence marked an entity absent");

    // REQ-307c — an explicit declaration marks the rest absent.
    const declared = await call(p, "manage_staging", { action: "presence", entity_ids: ["character_01"] });
    assert(declared.includes("[OK]"), "presence declaration refused: " + declared);
    brief = await promptText(p, "badge_briefing");
    assert(brief.includes("[not present]"), "non-present entity carries no [not present] marker");

    // REQ-307b — presence accepts a location without touching the description.
    const located = await call(p, "manage_staging", { action: "presence", entity_ids: ["character_01"], location: "Camp" });
    assert(located.includes("[OK]") && located.includes("Camp"), "presence location not recorded: " + located);
    const scene = await promptText(p, "badge_briefing");
    assert(scene.includes("Camp"), "presence location missing from the briefing");
    assert(scene.includes("Dark corridor"), "presence changed the scene description");

    // REQ-307b — activating a non-present entity is not an error.
    const act = await call(p, "manage_character", { action: "set_active", entity_id: "character_02" });
    assert(act.includes("[OK]"), "set_active to a non-present entity failed: " + act);

    // REQ-307c — [] marks every entity absent.
    await call(p, "manage_staging", { action: "presence", entity_ids: [] });
    const none = await promptText(p, "badge_briefing");
    assert((none.match(/\[not present\]/g) ?? []).length >= 2, "empty presence did not mark all entities absent");
    await kill(p);
  });

  await test("T57/REQ-076b3: scene tick resets on a transition and advances on a combat round", async () => {
    const p = await boot(); await newNovel(p, "tick1");
    await call(p, "manage_character", { action: "create", name: "Tick A", species: "Human" });
    await call(p, "manage_character", { action: "create", name: "Tick B", species: "Elf" });
    await call(p, "manage_scene", { action: "set", description: "Arena" });
    let brief = await promptText(p, "badge_briefing");
    assert(brief.includes("Scene tick:** 0"), "scene tick did not start at zero");
    await call(p, "manage_combat", { action: "init", participants: ["character_01", "character_02"] });
    await call(p, "manage_combat", { action: "advance" });
    brief = await promptText(p, "badge_briefing");
    assert(brief.includes("Scene tick:** 0"), "tick advanced mid-round");
    await call(p, "manage_combat", { action: "advance" });
    brief = await promptText(p, "badge_briefing");
    assert(brief.includes("Scene tick:** 1"), "tick did not advance on the round wrap");
    await call(p, "manage_scene", { action: "set", description: "Courtyard" });
    brief = await promptText(p, "badge_briefing");
    assert(brief.includes("Scene tick:** 0"), "tick did not reset on the scene transition");
    // REQ-076b3 — GM only: the Player badge renders no tick.
    await call(p, "set_badge", { badge: "player" });
    const player = await promptText(p, "badge_briefing");
    assert(!player.includes("Scene tick"), "scene tick surfaced under the Player badge");
    await kill(p);
  });

  // ── §5.6 personality, signal, and citation remediation ──

  await test("T140/REQ-126: the personality group renders voice examples before traits", async () => {
    const p = await boot(); await newNovel(p, "pers140");
    const created = await call(p, "manage_character", { action: "create", name: "Voice One", description: "Tall" });
    assert(created.includes("[OK]"), "entity creation failed: " + created.slice(0, 120));
    const ents = JSON.parse(await resource(p, "entities://"));
    const id = Object.keys(ents)[0];
    await call(p, "manage_character", { action: "personality", entity_id: id, voice: "slow drawl, formal register", goals: "find the relic", persona: "patient, formal" });
    await call(p, "manage_character", { action: "voice", entity_id: id, examples: [{ context: "greeting", dialogue: "Well met, traveller.", tag: "neutral" }] });
    const brief = await promptText(p, "badge_briefing");
    assert(brief.includes("### Personality"), "no personality group");
    assert(brief.includes("Voice One"), "entity absent from the personality group");
    assert(brief.includes("Well met, traveller."), "voice example absent");
    assert(brief.indexOf("Well met, traveller.") < brief.indexOf("**Voice:**"), "voice examples did not precede traits");
    assert(brief.includes("**Persona:** patient, formal"), "persona absent");
    assert(brief.includes("**Goals:** find the relic"), "goals absent");
    assert(brief.includes("**Description:** Tall"), "description absent");
    assert(!brief.includes("**Background:**"), "unset background rendered a placeholder");
    const sheet = await call(p, "manage_character", { action: "sheet", entity_id: id });
    assert(sheet.includes("Well met, traveller."), "sheet omitted the voice example");
    await kill(p);
  });

  await test("T140/REQ-166: NPC personality carries an [NPC] marker and the empty state renders", async () => {
    const p = await boot(); await newNovel(p, "pers140b");
    await call(p, "manage_npc", { action: "create", name: "Smith", description: "A smith" });
    const npcs = JSON.parse(await resource(p, "npcs://"));
    const nid = Object.keys(npcs)[0];
    await call(p, "manage_character", { action: "personality", entity_id: nid, voice: "gruff" });
    const brief = await promptText(p, "badge_briefing");
    assert(brief.includes("[NPC]"), "NPC marker absent");
    assert(brief.includes("**Voice:** gruff"), "NPC voice field absent");
    const q = await boot(); await newNovel(q, "pers140c");
    const empty = await promptText(q, "badge_briefing");
    assert(empty.includes("[No entity personality data"), "empty-state marker absent");
    await kill(q); await kill(p);
  });

  await test("T57/REQ-076: scene state renders, persists, and refuses the Player badge", async () => {
    const p = await boot(); await newNovel(p, "scene57");
    await call(p, "manage_scene", { action: "set", description: "A moonlit glade", location: "Glade" });
    const current = await resource(p, "scene://current");
    assert(current.includes("A moonlit glade"), "scene://current lacks the description");
    const brief = await promptText(p, "badge_briefing");
    assert(brief.includes("A moonlit glade"), "briefing lacks the scene description");
    const audit = await resource(p, "audit://novel");
    assert(audit.includes("set_scene"), "scene change not audited");
    await call(p, "set_badge", { badge: "player" });
    const player = await promptText(p, "badge_briefing");
    assert(player.includes("A moonlit glade"), "Player briefing lost the scene state");
    const forbidden = await call(p, "manage_scene", { action: "set", description: "Denied" });
    assert(forbidden.includes("[FORBIDDEN]"), "Player scene set was not refused");
    await kill(p);
  });

  await test("T142/REQ-128/REQ-069: signals show age, removal, audit identity, and GM-only scope", async () => {
    const p = await boot(); await newNovel(p, "sig142");
    await call(p, "set_badge", { badge: "player" });
    await call(p, "manage_character", { action: "signal", signal: "tone", value: "darker" });
    await call(p, "manage_character", { action: "signal", signal: "pace", value: "faster" });
    await call(p, "set_badge", { badge: "game_master" });
    let brief = await promptText(p, "badge_briefing");
    assert(brief.includes("### Player signals"), "no signals section");
    assert(brief.includes("tone: darker (set this connection)"), "signal age absent");
    const audit = await resource(p, "audit://novel");
    assert(audit.includes("manage_character (action: signal)"), "audit tool name is not the REQ-069c identity");
    assert(audit.includes("Signal 'tone' recorded."), "audit output prefix is wrong");
    await call(p, "set_badge", { badge: "player" });
    await call(p, "manage_character", { action: "signal", signal: "tone", value: "" });
    await call(p, "set_badge", { badge: "game_master" });
    brief = await promptText(p, "badge_briefing");
    assert(!brief.includes("tone:"), "empty value did not remove the signal");
    const audit2 = await resource(p, "audit://novel");
    assert(audit2.includes("Signal 'tone' removed."), "removal prefix is wrong");
    await call(p, "set_badge", { badge: "player" });
    const player = await promptText(p, "badge_briefing");
    assert(!player.includes("### Player signals"), "Player badge saw the signals section");
    const q = await boot(); await newNovel(q, "sig142b");
    const empty = await promptText(q, "badge_briefing");
    assert(empty.includes("[No player signals set.]"), "empty-state marker absent");
    await kill(q); await kill(p);
  });

  await test("T332/REQ-282: the voice directive honours location, scope, role, and tags", async () => {
    const p = await boot(); await newNovel(p, "vd282");
    await call(p, "manage_scene", { action: "set", description: "The forge", location: "smithy", scene_type: "social" });
    await call(p, "manage_npc", { action: "create", name: "Gruff", location: "smithy" });
    await call(p, "manage_npc", { action: "create", name: "Hidden", location: "smithy" });
    const npcs = JSON.parse(await resource(p, "npcs://"));
    const ids = Object.keys(npcs).filter((k) => !k.startsWith("__"));
    const gruff = ids.find((k) => JSON.stringify(npcs[k]).includes("Gruff"))!;
    const hidden = ids.find((k) => JSON.stringify(npcs[k]).includes("Hidden"))!;
    await call(p, "manage_npc", { action: "update", npc_id: gruff, scope: "shared", role: "Blacksmith" });
    await call(p, "manage_character", { action: "personality", entity_id: gruff, voice: "gruff, uses 'oi'" });
    await call(p, "manage_character", { action: "voice", entity_id: gruff, examples: [
      { context: "greeting", dialogue: "Oi! What?", tag: "neutral" },
      { context: "combat", dialogue: "Die!", tag: "combat" },
      { context: "chat", dialogue: "Fine day.", tag: "social" },
    ] });
    await call(p, "manage_character", { action: "personality", entity_id: hidden, voice: "quiet" });
    await call(p, "manage_character", { action: "voice", entity_id: hidden, examples: [{ context: "hi", dialogue: "Hello.", tag: "neutral" }] });
    let brief = await promptText(p, "badge_briefing");
    assert(brief.includes("Voice directive (Gruff, Blacksmith)"), "directive missing role or name");
    assert(brief.includes("Oi! What?"), "neutral example absent");
    assert(brief.includes("Fine day."), "social-tagged example absent");
    assert(!brief.includes("Die!"), "combat-tagged example surfaced in a social scene");
    assert(brief.includes("Voice directive (Hidden"), "GM lost a GM-scope directive");
    await call(p, "set_badge", { badge: "player" });
    const player = await promptText(p, "badge_briefing");
    assert(player.includes("Voice directive (Gruff"), "Player lost the shared-scope directive");
    assert(!player.includes("Voice directive (Hidden"), "Player saw a GM-scope directive");
    await call(p, "set_badge", { badge: "game_master" });
    await call(p, "manage_scene", { action: "set", location: "market", description: "The market" });
    brief = await promptText(p, "badge_briefing");
    assert(!brief.includes("Voice directive (Gruff"), "directive survived a location change");
    await kill(p);
  });

  await test("T314/REQ-255b: boundary collision warns on every free-text entry point", async () => {
    const p = await boot(); await newNovel(p, "bound314");
    await call(p, "set_badge", { badge: "player" });
    await call(p, "manage_character", { action: "signal", signal: "boundary", value: "spiders" });
    await call(p, "set_badge", { badge: "game_master" });
    const created = await call(p, "manage_npc", { action: "create", name: "Web", description: "a nest of spiders" });
    assert(created.includes("[WARNING]") && created.includes("[OK]"), "NPC create suppressed the operation or lost the warning");
    const npcs = JSON.parse(await resource(p, "npcs://"));
    const nid = Object.keys(npcs)[0];
    const updated = await call(p, "manage_npc", { action: "update", npc_id: nid, goals: "harvest spiders" });
    assert(updated.includes("[WARNING]") && updated.includes("[OK]"), "NPC update warning missing");
    const lore = await call(p, "manage_lore", { action: "set", key: "web", content: "spiders fill the rafters" });
    assert(lore.includes("[WARNING]") && lore.includes("[OK]"), "lore set warning missing");
    const loreUpdate = await call(p, "manage_lore", { action: "update", key: "web", content: "more spiders" });
    assert(loreUpdate.includes("[WARNING]"), "lore update warning missing");
    const directive = await call(p, "manage_scene", { action: "directive", directive: "make the spiders louder" });
    assert(directive.includes("[WARNING]") && directive.includes("[OK]"), "directive warning missing");
    const scene = await call(p, "manage_scene", { action: "set", description: "a hall of spiders" });
    assert(scene.includes("[WARNING]") && scene.includes("[OK]"), "scene set warning missing");
    await kill(p);
  });

  await test("T65/REQ-077a: a sixth voice example is refused at the write path", async () => {
    const p = await boot(); await newNovel(p, "cap65");
    await call(p, "manage_character", { action: "create", name: "Capped" });
    const ents = JSON.parse(await resource(p, "entities://"));
    const id = Object.keys(ents)[0];
    const examples = Array.from({ length: 6 }, (_, i) => ({ context: `c${i}`, dialogue: `line ${i}` }));
    const refused = await call(p, "manage_character", { action: "voice", entity_id: id, examples });
    assert(refused.includes("[INVALID_INPUT]"), "a sixth example was accepted: " + refused.slice(0, 160));
    await kill(p);
  });

  // ── T109 — REQ-109f badge-briefing mandatory groups, markers, and inventory ──
  await test("T109/REQ-109f: mandatory groups, empty markers, and known-heading inventory", async () => {
    const p = await boot({ TTRPG_AI_ROLE: "game_master" }); await newNovel(p, "t109-groups");
    await call(p, "manage_character", { action: "create", name: "Rogue" });
    await call(p, "manage_npc", { action: "create", name: "Innkeeper" });
    await call(p, "manage_countdown", { action: "set", name: "tension", ticks: 1, total: 3, type: "narrative" });
    await call(p, "manage_scene", { action: "set", description: "Inside the vault" });
    await call(p, "manage_scene", { action: "directive", directive: "Keep the pace tense." });
    await call(p, "manage_lore", { action: "set", key: "vault_code", content: "The vault code is 4417", triggers: ["vault"] });
    await call(p, "manage_adventure", { action: "load", slug: "hollow-of-the-moth", target: "novel" });
    await call(p, "manage_character", { action: "set_active", entity_id: "character_01" });
    await call(p, "manage_combat", { action: "init", participants: ["character_01"], dangers: [{ name: "goblin" }] });

    const gm = await promptText(p, "badge_briefing");
    // Every REQ-109 group with a writable source renders its anchor.
    for (const anchor of ["### Party", "### Combat", "### NPCs (depth)", "### Lore", "## Adventure",
      "### Point of view", "### Who They Are", "### Personality", "### Narrative directive",
      "### Player signals", "### Novel Setup", "### Autonomy", "### Story beats", "### Available Actions"]) {
      assert(gm.includes(anchor), `REQ-109 group anchor missing: ${anchor}`);
    }
    // Inventory: every rendered section heading is a known section (no drift).
    const known = new Set(["Play loop", "Party", "Combat", "NPCs (depth)", "Available Actions (available_actions)",
      "Turn handoff", "Badge boundary", "Anti-slop guidance", "Narrative tone", "Narrative directive",
      "Narration contract", "Player signals", "Novel Setup", "Point of view", "Who They Are", "Personality",
      "Autonomy", "GM State", "Surroundings", "State persistence", "state_ledger", "Persistence tools",
      "Story beats", "Narrative threads", "Lore", "Knowledge state", "Player Tools", "Synthesis", "Server guidance"]);
    const seen = gm.split("\n").filter((l) => l.startsWith("### ")).map((l) => l.slice(4).trim());
    for (const heading of seen) assert(known.has(heading), `unknown briefing section: ${heading}`);
    // REQ-109d/REQ-109e — the decision-critical layer precedes the
    // supplementary layer, and each layer keeps its resolved default order.
    const heads = [...gm.matchAll(/^#{2,3} ([^\n]+)$/gm)].map((m) => m[1].trim());
    const CRITICAL = ["Point of view", "Party", "Narrative threads", "Combat", "NPCs (depth)", "Lore",
      "Campaign Memory", "Knowledge state", "State persistence", "state_ledger",
      "Available Actions (available_actions)", "Story journal"];
    const SUPPLEMENTARY = ["Who They Are", "Play loop", "Anti-slop guidance", "Narrative tone",
      "Badge boundary", "Personality", "Narrative directive", "Narration contract", "Adventure",
      "GM State", "Persistence tools", "Player signals", "Autonomy", "Novel Setup", "Story beats",
      "Synthesis", "Server guidance"];
    let firstSupplementary = "";
    for (const h of heads) {
      if (SUPPLEMENTARY.includes(h)) { if (!firstSupplementary) firstSupplementary = h; continue; }
      if (CRITICAL.includes(h)) assert(!firstSupplementary, `decision-critical section ${h} rendered after supplementary ${firstSupplementary}`);
    }
    const present = CRITICAL.filter((h) => heads.includes(h));
    const positions = present.map((h) => heads.indexOf(h));
    for (let i = 1; i < positions.length; i++) {
      assert(positions[i] > positions[i - 1], `decision-critical order broken at ${present[i]}`);
    }
    // Player badge sees the player-visible groups and none of the GM-only ones.
    await call(p, "set_badge", { badge: "player" });
    const player = await promptText(p, "badge_briefing");
    for (const anchor of ["### Party", "### Knowledge state", "### Point of view"]) {
      assert(player.includes(anchor), `REQ-109f Player group missing: ${anchor}`);
    }
    for (const anchor of ["### Autonomy", "### GM State", "### Player signals", "### Narrator"]) {
      assert(!player.includes(anchor), `REQ-109f GM-only group leaked to Player: ${anchor}`);
    }
    // REQ-109e — the relative order survives the Player badge's filtering.
    const pheads = [...player.matchAll(/^#{2,3} ([^\n]+)$/gm)].map((m) => m[1].trim());
    const porder = ["Point of view", "Party", "Knowledge state", "Who They Are", "Play loop"].filter((h) => pheads.includes(h));
    for (let i = 1; i < porder.length; i++) {
      assert(pheads.indexOf(porder[i]) > pheads.indexOf(porder[i - 1]), `Player briefing order broken at ${porder[i]}`);
    }
    await call(p, "set_badge", { badge: "game_master" });
    // Empty markers and group omission.
    await call(p, "manage_combat", { action: "end" });
    assert(!(await promptText(p, "badge_briefing")).includes("### Combat"), "ended combat still renders the combat group");
    await call(p, "manage_npc", { action: "remove", npc_id: "npc_1" }).catch(() => "");
    await call(p, "manage_character", { action: "remove", entity_id: "character_01" });
    const cleared = await promptText(p, "badge_briefing");
    assert(!cleared.includes("### Party"), "removed entities still render the party group");
    await call(p, "manage_scene", { action: "set", description: "" });
    assert(!(await promptText(p, "badge_briefing")).includes("**Scene:**"), "cleared scene state still renders a scene line");
    await kill(p);
  });

  // ── T336 — REQ-286c knowledge-state token ──
  await test("T336/REQ-286c: knowledge-state secret, presence marker, no-entity marker, Player projection", async () => {
    const p = await boot(); await newNovel(p, "t336-knowledge");
    const created = await call(p, "manage_character", { action: "create", name: "Rogue" });
    const rogue = (created.match(/Entity id ([A-Za-z0-9_]+)/) ?? [])[1];
    assert(rogue, "entity id missing: " + created.slice(0, 160));
    const second = await call(p, "manage_character", { action: "create", name: "Other" });
    const other = (second.match(/Entity id ([A-Za-z0-9_]+)/) ?? [])[1];
    await call(p, "manage_lore", { action: "set_secret", key: "floor_trap", content: "A pressure plate fires a dart." });
    await call(p, "manage_lore", { action: "set_secret", key: "other_secret", content: "Only the other knows." });
    await call(p, "manage_lore", { action: "reveal", key: "floor_trap", entity_id: rogue });
    await call(p, "manage_lore", { action: "reveal", key: "other_secret", entity_id: other });
    await call(p, "manage_character", { action: "set_active", entity_id: rogue });
    let brief = await promptText(p, "badge_briefing");
    assert(brief.includes("### Knowledge state"), "knowledge-state section missing");
    assert(brief.includes("Secret: floor_trap — A pressure plate fires a dart."), "revealed secret not listed");
    // Entity absent from the scene: marker above retained knowledge.
    await call(p, "manage_staging", { action: "presence", entity_ids: [other] });
    brief = await promptText(p, "badge_briefing");
    const ks = brief.split("\n### ").find((s) => s.startsWith("Knowledge state")) ?? "";
    assert(ks.includes("[Entity not present in this scene]"), "absence marker missing");
    assert(ks.indexOf("[Entity not present in this scene]") < ks.indexOf("Secret: floor_trap"), "absence marker must precede retained knowledge");
    // Player projection: only the active entity's own knowledge.
    await call(p, "set_badge", { badge: "player" });
    const player = await promptText(p, "badge_briefing");
    assert(player.includes("floor_trap"), "Player lost its own knowledge");
    assert(!player.includes("other_secret"), "Player saw another entity's secret");
    // No active entity: the explicit empty-state marker on a fresh Novel.
    await call(p, "set_badge", { badge: "game_master" });
    await call(p, "manage_novel", { action: "create", name: "t336-fresh" });
    const fresh = await promptText(p, "badge_briefing");
    assert(fresh.includes("[No active entity — knowledge state unavailable.]"), "no-active-entity marker missing");
    await kill(p);
  });

  harnessComplete();
  console.log(`\n${passed} passed, ${failed} failed`);
  rmSync(DATA_DIR, { recursive: true, force: true });
  if (failed > 0) process.exit(1);
}
main().catch((e) => { console.error("FATAL", e); process.exit(2); });
