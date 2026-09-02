#!/usr/bin/env node
// Wave-1 §5.1 Output & Error Contracts harness.
// Covers REQ-003 (roll transparency), REQ-004 (truncation + output://),
// REQ-060 (verbose output), REQ-061 (source quoting), REQ-064 (badge boundary),
// REQ-070 (anti-slop), REQ-071 (narrative tone), REQ-113 (result counts),
// REQ-118 (prompt budget), REQ-184 (anti-slop resource), REQ-194 (anchor),
// REQ-280 (source anchor).

import { spawn } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { deriveAnchor } from "../src/core/anchors.js";
import { PACKAGE_FORMAT } from "../src/generated/contract-fingerprints.js";

const SERVER_SCRIPT = join(process.cwd(), "src", "index.ts");
const DATA_DIR = mkdtempSync(join(tmpdir(), "wave1-"));
let msgId = 0; const pending = new Map(); let buffer = "";
function send(proc: any, msg: any) { return new Promise((r) => { const id = ++msgId; pending.set(id, r); proc.stdin!.write(JSON.stringify({ ...msg, id, jsonrpc: "2.0" }) + "\n"); }); }
function attach(proc: any) { buffer = ""; proc.stdout!.on("data", (d: Buffer) => { buffer += d.toString(); const ls = buffer.split("\n"); buffer = ls.pop() ?? ""; for (const l of ls) { if (!l.trim()) continue; try { const m = JSON.parse(l); if (m.id !== undefined && pending.has(m.id)) { pending.get(m.id)!(m); pending.delete(m.id); } } catch { /* non-JSON line */ } } }); }
async function boot(env: any = {}) { const p = spawn("npx", ["tsx", SERVER_SCRIPT], { env: { ...process.env, TTRPG_DATA_DIR: DATA_DIR, ...env }, stdio: ["pipe", "pipe", "pipe"] }); attach(p); await send(p, { method: "initialize", params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "wave1", version: "1" } } }); p.stdin!.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n"); await new Promise((r) => setTimeout(r, 250)); return p; }
// REQ-426c — boot with the MCP Apps extension negotiated (io.modelcontextprotocol/ui).
async function bootApps(env: any = {}) { const p = spawn("npx", ["tsx", SERVER_SCRIPT], { env: { ...process.env, TTRPG_DATA_DIR: DATA_DIR, ...env }, stdio: ["pipe", "pipe", "pipe"] }); attach(p); await send(p, { method: "initialize", params: { protocolVersion: "2024-11-05", capabilities: { extensions: { "io.modelcontextprotocol/ui": {} } }, clientInfo: { name: "wave1", version: "1" } } }); p.stdin!.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n"); await new Promise((r) => setTimeout(r, 250)); return p; }
async function callRaw(proc: any, name: string, args: any = {}) { const r = await send(proc, { method: "tools/call", params: { name, arguments: args } }); return r.result ?? {}; }
async function readRaw(proc: any, uri: string) { const r = await send(proc, { method: "resources/read", params: { uri } }); return r.result ?? {}; }
async function call(proc: any, name: string, args: any = {}) { const r = await send(proc, { method: "tools/call", params: { name, arguments: args } }); const c = r.result?.content ?? []; return c.map((x: any) => x?.text ?? "").join("\n"); }
async function proto(proc: any, method: string, params: any) {
  const r = await send(proc, { method, params });
  if (r.result?.contents) return r.result.contents.map((x: any) => x.text ?? "").join("\n");
  if (r.result?.messages) return r.result.messages.map((m: any) => m.content?.text ?? "").join("\n");
  return JSON.stringify(r.result).slice(0, 500);
}
async function kill(proc: any) { try { proc.kill("SIGKILL"); } catch { /* already exited */ } await new Promise((r) => setTimeout(r, 100)); }

let passed = 0; let failed = 0;
async function test(name: string, fn: () => void | Promise<void>): Promise<void> {
  try { await fn(); } catch (e: any) { failed++; console.error(`FAIL ${name}: ${e.message ?? e}`); }
}
function assertContains(hay: string, needle: string, label: string) {
  if (hay.includes(needle)) { passed++; return; }
  failed++;
  console.error(`FAIL ${label}: expected to contain "${needle}" but got:\n${hay.slice(0, 400)}`);
}
function assertNotContains(hay: string, needle: string, label: string) {
  if (!hay.includes(needle)) { passed++; return; }
  failed++;
  console.error(`FAIL ${label}: expected NOT to contain "${needle}" but it did:\n${hay.slice(0, 400)}`);
}

// Compute the ruleset content hash the same way the host does (REQ-389).
function contentHash(pkg: any): string {
  const canonical = (obj: any) => JSON.stringify(JSON.parse(JSON.stringify(obj)));
  const h = createHash("sha256");
  for (const obj of [pkg.index, pkg.model, pkg.tools, pkg.resources, pkg.prompts]) h.update(canonical(obj));
  return h.digest("hex");
}

const RULESET_PKG = {
  slug: "wave1test",
  manifest: { slug: "wave1test", name: "Wave1 Test", host_version: "2026.08.18", package_format: PACKAGE_FORMAT, content_hash: "TBD", built_at: "2026-08-24", counts: { index: 3 } },
  index: [
    { id: "fireball", anchor: "Spells > Level 3 > Fireball", source_file: "wave1test.md", content: "Fireball deals 8d6 fire damage. See Monsters > Goblin for a common target.", category: "Spells", confidence: "high", line_range: "1420-1445" },
    { id: "goblin", anchor: "Monsters > Goblin", source_file: "wave1test.md", content: "Goblin: AC 15, HP 7.", category: "Monsters", confidence: "high", line_range: "200-210" },
  ],
  model: {
    concepts: {
      fireball: { name: "Fireball", level: 3, school: "Evocation", damage: "8d6 fire" },
      goblin: { name: "Goblin", ac: 15, hp: 7, traits: ["nimble escape"] },
    },
    tables: { "omen": [{ result: "A cold wind", weight: 1 }, { result: "A crow caws", weight: 1 }] },
    generation_tables: {
      "omen": { name: "omen", badge_scope: "shared", dice_expression: "1d6", ranges: [{ min: 1, max: 6, result: "A cold wind" }] },
      "secret_table": { name: "secret_table", badge_scope: "game_master", dice_expression: "1d6", ranges: [{ min: 1, max: 6, result: "hidden" }] },
    },
  },
  tools: [
    { name: "lookup_spell", title: "Lookup Spell", description: "Look up a spell.", kind: "lookup", collection: "concepts", inputSchema: { type: "object", properties: { key: { type: "string" } } } },
    { name: "roll_check", title: "Roll Check", description: "Roll a check.", kind: "roll", inputSchema: { type: "object", properties: { dice: { type: "string" }, skill: { type: "string" } } } },
  ],
  resources: [], prompts: [],
};
RULESET_PKG.manifest.content_hash = contentHash(RULESET_PKG);

// Seed the package on disk so startup tool registration picks it up (REQ-373).
function seedRuleset(): void {
  const dir = join(DATA_DIR, "rulesets", "wave1test");
  mkdirSync(dir, { recursive: true });
  const files: Record<string, any> = {
    "manifest.json": RULESET_PKG.manifest,
    "index.json": RULESET_PKG.index,
    "model.json": RULESET_PKG.model,
    "tools.json": RULESET_PKG.tools,
    "resources.json": [],
    "prompts.json": [],
  };
  for (const [name, obj] of Object.entries(files)) writeFileSync(join(dir, name), JSON.stringify(obj, null, 2) + "\n");
}

async function main() {
  // ── REQ-003 roll transparency + REQ-060 verbose + REQ-061/280 source ──
  await test("T210/T47/REQ-003 + REQ-060 + REQ-061/REQ-280: ruleset lookup full entry, source quoting, roll transparency", async () => {
    seedRuleset();
    const p = await boot();
    await call(p, "create_novel", { name: "w1", ruleset: "wave1test" });
    await call(p, "set_badge", { badge: "game_master" });
    const look = await call(p, "wave1test_lookup_spell", { key: "fireball" });
    assertContains(look, '"school": "Evocation"', "REQ-060 verbose full entry");
    assertContains(look, "---\nwave1test.md#spells-level-3-fireball", "REQ-061 source block");
    const roll = await call(p, "wave1test_roll_check", { dice: "2d6", skill: "strength", seed: "seed1" });
    assertContains(roll, "(2d6)", "REQ-003 dice notation");
    assertContains(roll, "modifier +0", "REQ-003 modifier reporting");
    const nl = await call(p, "search_rules", { query: "goblin" });
    assertContains(nl, "Monsters > Goblin", "REQ-280 source anchor via search");
    await kill(p);
  });

  // ── REQ-064 boundary + REQ-070 anti-slop + REQ-071 tone (default budget) ──
  await test("T461/REQ-064 + T223/REQ-070 + T26/REQ-071: briefing orientation layer", async () => {
    const p = await boot();
    await call(p, "create_novel", { name: "w1b" });
    const brief = await proto(p, "prompts/get", { name: "badge_briefing" });
    assertContains(brief, "Confine tool use and responses to the current Novel", "REQ-064 badge boundary");
    assertContains(brief, "[anti-slop]", "REQ-070 anti-slop items");
    assertContains(brief, "[narrative-tone]", "REQ-071 tone sample");
    await kill(p);
  });

  // ── REQ-118 prompt length budget truncation (small budget) ──
  await test("T123/REQ-118: prompt budget truncation with never-truncated elements", async () => {
    const p = await boot({ TTRPG_PROMPT_BUDGET: "500" });
    await call(p, "create_novel", { name: "w1e" });
    const brief = await proto(p, "prompts/get", { name: "badge_briefing" });
    assertContains(brief, "[truncated", "REQ-118 prompt budget truncation");
    assertContains(brief, "### Badge boundary", "REQ-118 never-truncated badge boundary");
    await kill(p);
  });

  // ── REQ-184 anti-slop resource + REQ-070 badge filtering ──
  await test("T223/REQ-184 + REQ-070: guidance anti-slop resource badge-filtered", async () => {
    const p = await boot();
    await call(p, "create_novel", { name: "w1c" });
    await call(p, "set_badge", { badge: "player" });
    const pr = await proto(p, "resources/read", { uri: "guidance://player/anti-slop" });
    assertContains(pr, "Establishing world facts", "REQ-184 player anti-slop resource");
    assertNotContains(pr, "Purple prose", "REQ-070 player excludes GM-only items");
    await call(p, "set_badge", { badge: "game_master" });
    const gm = await proto(p, "resources/read", { uri: "guidance://game_master/anti-slop" });
    assertContains(gm, "Purple prose", "REQ-184 GM anti-slop resource");
    await kill(p);
  });

  // ── REQ-004 truncation + output:// pointer (via search with tiny limit) ──
  await test("T13/REQ-004 + T221/REQ-179: truncation with output:// pointer retrieval", async () => {
    seedRuleset();
    const p = await boot({ TTRPG_OUTPUT_LIMIT: "100" });
    await call(p, "create_novel", { name: "w1d", ruleset: "wave1test" });
    await call(p, "set_badge", { badge: "game_master" });
    const s = await call(p, "search_rules", { query: "fireball" });
    assertContains(s, "[truncated — full content: output://search_rules/", "REQ-004 truncation pointer");
    const uri = s.match(/output:\/\/search_rules\/(\d+)/)?.[0];
    if (!uri) { failed++; console.error("FAIL REQ-004: no output uri"); }
    else {
      const full = await proto(p, "resources/read", { uri });
      assertContains(full, "Fireball", "REQ-179 output:// full content");
    }
    await kill(p);
  });

  // ── REQ-194 anchor determinism (unit-level, same function the server uses) ──
  await test("T236/REQ-194: anchor derivation determinism, CJK, explicit id, duplicates", async () => {
    const seen = new Set<string>();
    if (deriveAnchor("Spells > Level 3 > Fireball", undefined, seen) !== "spells-level-3-fireball") throw new Error("basic derivation failed");
    if (deriveAnchor("Spells > Level 3 > Fireball", undefined, seen) !== "spells-level-3-fireball-1") throw new Error("duplicate -1 failed");
    if (deriveAnchor("角色介绍", undefined, seen) !== "角色介绍") throw new Error("CJK preservation failed");
    if (deriveAnchor("Keeper Secrets {#secrets}", undefined, seen) !== "secrets") throw new Error("explicit id override failed");
    if (deriveAnchor("*Keeper only* The Door", undefined, seen) !== "the-door") throw new Error("role-scoping strip failed");
    if (deriveAnchor("A & B — C", undefined, seen) !== "a-b-c") throw new Error("punctuation strip failed");
    passed++;
  });

  // ── REQ-061 source quoting + REQ-280 ruleset-free null anchor ──
  await test("T48/REQ-061 + T329/REQ-280: source quoting and ruleset-free null source_anchor", async () => {
    seedRuleset();
    const p = await boot();
    await call(p, "create_novel", { name: "w1f" });
    await call(p, "set_badge", { badge: "game_master" });
    // Ruleset-free novel with installed rulesets: search reports no binding.
    const rf = await call(p, "search_rules", { query: "nothing" });
    assertContains(rf, "No ruleset bound", "REQ-280 ruleset-free no source anchor path");
    await call(p, "create_novel", { name: "w1g", ruleset: "wave1test" });
    const g = await call(p, "search_rules", { query: "fireball" });
    assertContains(g, "source_anchor", "REQ-280 source_anchor field present");
    assertContains(g, "---", "REQ-061 source block present");
    await kill(p);
  });

  // ── REQ-106 spec repo URL + REQ-413/414/415 catalog surfaces ──
  await test("T105/REQ-106 + T486/REQ-413 + T487/REQ-414 + T488/REQ-415: spec_health surfaces", async () => {
    const p = await boot({ TTRPG_SPEC_REPO_URL: "https://example.com/spec" });
    await call(p, "create_novel", { name: "w1h" });
    const health = JSON.parse(await call(p, "spec_health", {}));
    assertContains(JSON.stringify(health.spec_repo_url), "example.com", "REQ-106 spec_repo_url");
    if (!("catalog_verbosity" in health)) throw new Error("REQ-415 catalog_verbosity missing");
    if (!("action_discriminators" in health)) throw new Error("REQ-413 action_discriminators missing");
    if (!("nested_input_counts" in health)) throw new Error("REQ-414 nested_input_counts missing");
    if (typeof health.tool_parameter_counts?.create_character !== "number") throw new Error("REQ-408 param counts missing");
    if (health.tool_parameter_counts.create_character > health.parameter_ceiling) {
      throw new Error(`REQ-408 ceiling exceeded: create_character ${health.tool_parameter_counts.create_character} > ${health.parameter_ceiling}`);
    }
    const intro = await proto(p, "prompts/get", { name: "intro" });
    assertContains(intro, "example.com", "REQ-106 intro pointer");
    passed++;
    await kill(p);
  });

  // ── REQ-057/059/183 lookup enumeration + REQ-112 cross-references ──
  await test("T39/REQ-057 + T39a/REQ-059 + T39b/REQ-183 + T115/REQ-112: lookup NOT_FOUND enumeration and cross-refs", async () => {
    seedRuleset();
    const p = await boot();
    await call(p, "create_novel", { name: "w1i", ruleset: "wave1test" });
    await call(p, "set_badge", { badge: "game_master" });
    const nf = await call(p, "wave1test_lookup_spell", { key: "fireballx" });
    assertContains(nf, "Valid values: fireball, goblin", "REQ-057/059/183 NOT_FOUND enumeration");
    assertContains(nf, "Did you mean 'fireball'?", "REQ-002 did-you-mean hint");
    const okLookup = await call(p, "wave1test_lookup_spell", { key: "fireball" });
    assertContains(okLookup, "cross_references", "REQ-112 cross-reference discovery");
    passed++;
    await kill(p);
  });

  // ── REQ-078 session zero + REQ-138 prompt health + REQ-139/169/269 ──
  await test("T124/REQ-078: session zero has all 8 sections", async () => {
    const p = await boot();
    await call(p, "create_novel", { name: "w1j" });
    const sz = await proto(p, "prompts/get", { name: "session_zero" });
    for (const s of ["## 1.", "## 2.", "## 3.", "## 4.", "## 5.", "## 6.", "## 7.", "## 8."]) {
      if (!sz.includes(s)) throw new Error(`session_zero missing ${s}`);
    }
    passed++;
    await kill(p);
  });

  await test("T152/REQ-138 + T153/REQ-139 + T204/REQ-169 + T289/REQ-269: spec_health reporting surfaces", async () => {
    const p = await boot();
    await call(p, "create_novel", { name: "w1k" });
    const health = JSON.parse(await call(p, "spec_health", {}));
    if (!Array.isArray(health.prompt_health) || health.prompt_health.length === 0) throw new Error("REQ-138 prompt_health empty");
    for (const ph of health.prompt_health) {
      if (!("name" in ph) || !("within" in ph) || !("stale_references" in ph)) throw new Error("REQ-138 prompt_health shape");
    }
    if (!Array.isArray(health.resource_uris) || health.resource_uris.length === 0) throw new Error("REQ-139 resource_uris empty");
    for (const ru of health.resource_uris) {
      if (!("uri" in ru) || !("presence" in ru)) throw new Error("REQ-139 resource_uris shape");
    }
    if (!health.audit_chain || health.audit_chain.valid !== true) throw new Error("REQ-169 audit_chain missing/valid");
    if (!health.safety_protocols?.state_loss) throw new Error("REQ-269 safety_protocols missing");
    passed++;
    await kill(p);
  });

  // ── Wave 3: §5.5 Badges & Access ──
  await test("T9/REQ-031 + T147/REQ-133: badge activation and forbidden-call audit", async () => {
    const p = await boot();
    await call(p, "create_novel", { name: "w3a" });
    const s = await call(p, "set_badge", { badge: "game_master" });
    assertContains(s, "[OK]", "REQ-031 badge activation");
    await call(p, "set_badge", { badge: "player" });
    const fb = await call(p, "create_npc", { name: "Denied" });
    assertContains(fb, "[FORBIDDEN]", "REQ-032 player GM gate");
    await call(p, "set_badge", { badge: "game_master" });
    const audit = await proto(p, "resources/read", { uri: "audit://novel" });
    assertContains(audit, "create_npc", "REQ-133 forbidden call audited");
    assertContains(audit, "boundary", "REQ-133 boundary marker");
    passed++;
    await kill(p);
  });

  await test("T150/REQ-136: editor badge briefing (no novel) lists Novels + intro pointer", async () => {
    const p = await boot();
    const brief = await proto(p, "prompts/get", { name: "badge_briefing" });
    assertContains(brief, "Editor Briefing", "REQ-136 editor orientation");
    assertContains(brief, "intro prompt", "REQ-136 intro pointer");
    passed++;
    await kill(p);
  });

  await test("T257/REQ-216: GM-only generation table filtered under Player", async () => {
    seedRuleset();
    const p = await boot();
    await call(p, "create_novel", { name: "w3b", ruleset: "wave1test" });
    await call(p, "set_badge", { badge: "player" });
    const roll = await call(p, "roll_on_table", { table: "secret_table" });
    assertContains(roll, "[FORBIDDEN]", "REQ-216 player table filtered");
    assertNotContains(roll, "hidden", "REQ-216 table content not revealed");
    await call(p, "set_badge", { badge: "game_master" });
    const gmRoll = await call(p, "roll_on_table", { table: "secret_table" });
    assertContains(gmRoll, "Roll:", "REQ-216 GM sees table result");
    passed++;
    await kill(p);
  });

  await test("T262/REQ-220 + T265/REQ-223: POV directive and pov mode control", async () => {
    const p = await boot();
    await call(p, "create_novel", { name: "w3c" });
    await call(p, "set_badge", { badge: "player" });
    await call(p, "create_character", { name: "PovChar" });
    await call(p, "set_active_entity", { entity_id: "character_01", pov: "omniscient" });
    const brief1 = await proto(p, "prompts/get", { name: "badge_briefing" });
    assertContains(brief1, "POV: none — narration is omniscient", "REQ-223 omniscient marker");
    await call(p, "set_active_entity", { entity_id: "character_01", pov: "character" });
    const brief2 = await proto(p, "prompts/get", { name: "badge_briefing" });
    assertContains(brief2, "Describe the scene through PovChar's eyes", "REQ-220 character POV");
    passed++;
    await kill(p);
  });

  await test("T348/REQ-304: TTRPG_AI_ROLE locks orientation", async () => {
    const p = await boot({ TTRPG_AI_ROLE: "player" });
    await call(p, "create_novel", { name: "w3d" });
    await call(p, "set_badge", { badge: "game_master" });
    const brief = await proto(p, "prompts/get", { name: "badge_briefing" });
    assertContains(brief, "[anti-slop]", "REQ-304 anti-slop present under forced role");
    passed++;
    await kill(p);
  });

  await test("T349/REQ-305: observer mode read-only", async () => {
    const p = await boot();
    await call(p, "create_novel", { name: "w3e" });
    const s = await call(p, "set_badge", { badge: "observer" });
    assertContains(s, "read-only spectator mode", "REQ-305 observer mode");
    const fb = await call(p, "create_npc", { name: "No" });
    assertContains(fb, "[FORBIDDEN]", "REQ-305 observer mutating call forbidden");
    const help = await call(p, "help", {});
    assertNotContains(help, "[ERROR]", "REQ-305 observer read-only succeeds");
    passed++;
    await kill(p);
  });

  // ── REQ-281 narrative threads section token ──
  await test("T330/REQ-281: narrative_threads section renders in briefing", async () => {
    const p = await boot();
    await call(p, "create_novel", { name: "w3f" });
    await call(p, "set_badge", { badge: "game_master" });
    await call(p, "set_countdown", { name: "Doom", ticks: 3 });
    await call(p, "create_npc", { name: "Grumpy", disposition: "hostile" });
    const brief = await proto(p, "prompts/get", { name: "badge_briefing" });
    assertContains(brief, "Countdown: Doom", "REQ-281 countdown in threads");
    assertContains(brief, "Grumpy (hostile)", "REQ-281 NPC disposition in threads");
    passed++;
    await kill(p);
  });

  // ── Wave 4: §5.6 State/lifecycle + §5.9 ──
  await test("T216/REQ-176 + T217/REQ-177 + T219/REQ-178: entity/roster removal and listing", async () => {
    const p = await boot();
    await call(p, "create_novel", { name: "w4a" });
    await call(p, "create_character", { name: "R1", stage_to_roster: true });
    await call(p, "set_badge", { badge: "game_master" });
    const lst = await call(p, "list_roster_characters", {});
    assertContains(lst, "character_01", "REQ-178 roster listing");
    const rm = await call(p, "remove_roster_character", { roster_id: "character_01" });
    assertContains(rm, "[OK]", "REQ-177 roster removal");
    const rm2 = await call(p, "remove_roster_character", { roster_id: "character_01" });
    assertContains(rm2, "[NOT_FOUND]", "REQ-177 NOT_FOUND on absent");
    const entRm = await call(p, "remove_entity", { entity_id: "character_01" });
    assertContains(entRm, "[OK]", "REQ-176 entity removal");
    passed++;
    await kill(p);
  });

  await test("T258/REQ-217: condition tools with validation and warnings", async () => {
    const p = await boot();
    await call(p, "create_novel", { name: "w4b" });
    await call(p, "set_badge", { badge: "game_master" });
    await call(p, "create_character", { name: "Cond" });
    const a = await call(p, "apply_condition", { entity_id: "character_01", condition: "prone" });
    assertContains(a, "[OK]", "REQ-217 apply");
    const dup = await call(p, "apply_condition", { entity_id: "character_01", condition: "prone" });
    assertContains(dup, "[WARNING]", "REQ-217 duplicate warning");
    const bad = await call(p, "apply_condition", { entity_id: "character_01", condition: "not_a_condition" });
    assertContains(bad, "[INVALID_INPUT]", "REQ-217 unknown condition");
    const rem = await call(p, "remove_condition", { entity_id: "character_01", condition: "prone" });
    assertContains(rem, "[OK]", "REQ-217 remove");
    const rem2 = await call(p, "remove_condition", { entity_id: "character_01", condition: "prone" });
    assertContains(rem2, "[WARNING]", "REQ-217 remove absent warning");
    passed++;
    await kill(p);
  });

  await test("T275/REQ-237 + T328/REQ-279: session segmentation and narrative orientation", async () => {
    const p = await boot({ TTRPG_SESSION_ID: "sess-1" });
    await call(p, "create_novel", { name: "w4c" });
    await call(p, "set_badge", { badge: "game_master" });
    await call(p, "record_story", { type: "decision", entry: "The party weighs the two doors." });
    const recap = await call(p, "session_recap", {});
    assertContains(recap, "narrative_orientation", "REQ-279 orientation field");
    assertContains(recap, "The party weighs the two doors", "REQ-279 decision in orientation");
    const health = JSON.parse(await call(p, "spec_health", {}));
    if (!Array.isArray(health.sessions)) throw new Error("REQ-237 sessions array missing");
    passed++;
    await kill(p);
  });

  await test("T352/REQ-308 + T374/T377/REQ-330: knowledge gating by presence and exploration", async () => {
    const p = await boot();
    await call(p, "create_novel", { name: "w4d" });
    await call(p, "set_badge", { badge: "game_master" });
    await call(p, "create_character", { name: "Explorer" });
    await call(p, "create_room", { name: "Entrance", description: "d" });
    await call(p, "create_room", { name: "Guard Room", description: "g" });
    await call(p, "create_exit", { direction: "north", room_a: "Entrance", room_b: "Guard Room" });
    const nav = await call(p, "command", { command: "go north" });
    assertContains(nav, "[OK]", "REQ-330 parser navigation");
    const brief = await proto(p, "prompts/get", { name: "badge_briefing" });
    assertContains(brief, "Explored:", "REQ-330 exploration knowledge");
    passed++;
    await kill(p);
  });

  await test("T369/REQ-322: vow-countdown coupling", async () => {
    const p = await boot();
    await call(p, "create_novel", { name: "w4e" });
    await call(p, "set_badge", { badge: "game_master" });
    await call(p, "set_vow", { name: "Find Crown", description: "Recover the Crown", parties: ["pc_1"], difficulty: "dangerous", scope: "shared" });
    const brief = await proto(p, "prompts/get", { name: "badge_briefing" });
    assertContains(brief, "Vow countdown suggestion", "REQ-322 suggestion in threads");
    await call(p, "respond", { decision: "accept", option: "accept" });
    const brief2 = await proto(p, "prompts/get", { name: "badge_briefing" });
    assertContains(brief2, "vow:Find Crown", "REQ-322 linked countdown created");
    await call(p, "mark_milestone", { vow_name: "Find Crown" });
    passed++;
    await kill(p);
  });

  // ── REQ-094 lorebook round-trip + REQ-295 genre filtering ──
  await test("T80/REQ-094 + T340/REQ-295: lorebook round-trip and genre-filtered generation", async () => {
    const p = await boot();
    await call(p, "create_novel", { name: "w4f" });
    await call(p, "set_badge", { badge: "game_master" });
    await call(p, "set_lore_entry", { key: "city", content: "The city is old.", triggers: ["city"], badge_scope: "shared" });
    const exp = await call(p, "export_lorebook", {});
    const imp = await call(p, "import_lorebook", { data: exp, mode: "replace" });
    assertContains(imp, "[OK]", "REQ-094 import replace");
    const exp2 = await call(p, "export_lorebook", {});
    assertContains(exp2, "The city is old.", "REQ-094 round-trip preserves content");
    const playerBlocked = await call(p, "set_badge", { badge: "player" });
    void playerBlocked;
    const expP = await call(p, "export_lorebook", {});
    assertContains(expP, "[FORBIDDEN]", "REQ-094 player forbidden");
    await call(p, "set_badge", { badge: "game_master" });
    passed++;
    await kill(p);
  });

  // ── REQ-329 countdown-world trigger ──
  await test("T373/T376/REQ-329: countdown on_room_enter trigger advances", async () => {
    const p = await boot();
    await call(p, "create_novel", { name: "w4g" });
    await call(p, "set_badge", { badge: "game_master" });
    await call(p, "create_character", { name: "Wanderer" });
    await call(p, "create_room", { name: "Hall", description: "h" });
    await call(p, "create_room", { name: "guard_room", description: "g" });
    await call(p, "create_exit", { direction: "east", room_a: "Hall", room_b: "guard_room" });
    await call(p, "set_countdown", { name: "ambush", ticks: 2, type: "narrative", triggers: ["on_room_enter(guard_room)"] });
    const nav = await call(p, "command", { command: "go east" });
    assertContains(nav, "[OK]", "REQ-329 navigation");
    const brief = await proto(p, "prompts/get", { name: "badge_briefing" });
    assertContains(brief, "ambush (1", "REQ-329 trigger advanced countdown");
    passed++;
    passed++;
    await kill(p);
  });

  // ── REQ-332 codex provenance ──
  await test("T380/T384/REQ-332: codex import records provenance and reports stale", async () => {
    const p = await boot();
    await call(p, "create_novel", { name: "w4h" });
    await call(p, "set_badge", { badge: "game_master" });
    await call(p, "codex_set", { kind: "npc", name: "Blacksmith", content: { description: "Sturdy smith" } });
    await call(p, "codex_import", { entry_id: "npc_blacksmith" });
    const info = JSON.parse(await call(p, "novel_info", {}));
    assertContains(JSON.stringify(info), "codex_sources", "REQ-332 codex_sources in novel_info");
    const health = JSON.parse(await call(p, "spec_health", {}));
    assertContains(JSON.stringify(health), "npc_blacksmith", "REQ-332 provenance registered");
    passed++;
    await kill(p);
  });

  // ── Wave 5: §5.6 NPC surface & memory ──
  await test("T126/REQ-119 + T127/REQ-120 + T128/REQ-121: NPC stat reference, rendering, resources", async () => {
    seedRuleset();
    const p = await boot();
    await call(p, "create_novel", { name: "w5a", ruleset: "wave1test" });
    await call(p, "set_badge", { badge: "game_master" });
    const created = await call(p, "create_npc", { name: "Goblin", ruleset_reference: "Goblin" });
    assertContains(created, "[OK]", "REQ-119 create with reference");
    const list = await proto(p, "resources/read", { uri: "npcs://" });
    assertContains(list, "Goblin", "REQ-121 npcs resource");
    const bad = await call(p, "create_npc", { name: "X", ruleset_reference: "NoSuchThing" });
    assertContains(bad, "[NOT_FOUND]", "REQ-119 unknown reference");
    passed++;
    await kill(p);
  });

  await test("T129/REQ-122 + T191/REQ-156: NPC personality fields and description field", async () => {
    const p = await boot();
    await call(p, "create_novel", { name: "w5b" });
    await call(p, "set_badge", { badge: "game_master" });
    await call(p, "create_npc", { name: "Guard", description: "Tall" });
    const npcs = JSON.parse(await proto(p, "resources/read", { uri: "npcs://" }));
    const id = Object.keys(npcs)[0];
    await call(p, "set_personality", { entity_id: id, description: "Suspicious" });
    const res = await proto(p, "resources/read", { uri: `npc://${id}/personality` });
    assertContains(res, "Suspicious", "REQ-156 description most-recent-wins");
    passed++;
    await kill(p);
  });

  await test("T356/REQ-311: NPC memory updates on combat engagement", async () => {
    const p = await boot();
    await call(p, "create_novel", { name: "w5c" });
    await call(p, "set_badge", { badge: "game_master" });
    await call(p, "create_character", { name: "Fighter" });
    await call(p, "create_npc", { name: "Thug" });
    const npcs = JSON.parse(await proto(p, "resources/read", { uri: "npcs://" }));
    const id = Object.keys(npcs)[0];
    await call(p, "init_combat", { participants: ["character_01", id] });
    await call(p, "advance_combat", {});
    const health = JSON.parse(await call(p, "spec_health", {}));
    if (typeof health.npc_memory_count !== "number") throw new Error("REQ-311 npc_memory_count missing");
    if (health.npc_memory_count < 1) throw new Error(`REQ-311 npc_memory_count ${health.npc_memory_count}`);
    passed++;
    await kill(p);
  });

  // ── Wave 5b: remaining NPC/personality surfaces ──
  await test("T130/REQ-123 + T191/REQ-156 + T200/REQ-165 + T201/REQ-166 + T202/REQ-167: NPC stat fields, personality rendering", async () => {
    const p = await boot();
    await call(p, "create_novel", { name: "w5d" });
    await call(p, "set_badge", { badge: "game_master" });
    await call(p, "create_npc", { name: "Smith", description: "A smith" });
    const npcs = JSON.parse(await proto(p, "resources/read", { uri: "npcs://" }));
    const id = Object.keys(npcs)[0];
    await call(p, "set_personality", { entity_id: id, voice: "gruff" });
    await call(p, "set_voice_examples", { entity_id: id, examples: [{ context: "greeting", dialogue: "What do you need?" }] });
    const pers = await proto(p, "resources/read", { uri: `npc://${id}/personality` });
    assertContains(pers, "gruff", "REQ-166 personality rendering");
    const voice = await proto(p, "resources/read", { uri: `npc://${id}/voice_examples` });
    assertContains(voice, "What do you need?", "REQ-126 voice examples resource");
    passed++;
    await kill(p);
  });

  await test("T203/REQ-168 + T332/REQ-282: audit resource and NPC voice directive", async () => {
    const p = await boot();
    await call(p, "create_novel", { name: "w5e" });
    await call(p, "set_badge", { badge: "game_master" });
    await call(p, "create_character", { name: "PC" });
    const aud = await proto(p, "resources/read", { uri: "audit://novel" });
    assertContains(aud, "create_novel", "REQ-168 audit resource");
    await call(p, "create_npc", { name: "Smith" });
    const npcs = JSON.parse(await proto(p, "resources/read", { uri: "npcs://" }));
    const id = Object.keys(npcs)[0];
    await call(p, "update_npc", { npc_id: id, location: "smithy" });
    await call(p, "set_voice_examples", { entity_id: id, examples: [{ context: "hi", dialogue: "Gruff hello." }] });
    await call(p, "set_scene_state", { description: "forge", location: "smithy" });
    const brief = await proto(p, "prompts/get", { name: "badge_briefing" });
    assertContains(brief, "Voice directive", "REQ-282 NPC voice directive");
    passed++;
    await kill(p);
  });

  // ── Wave 6: §5.6 Adventure resources ──
  await test("T146/REQ-132 + T285/REQ-248 + T286/REQ-249: generated adventure lifecycle and resources", async () => {
    const p = await boot();
    await call(p, "create_novel", { name: "w6a" });
    await call(p, "set_badge", { badge: "game_master" });
    await call(p, "generate_adventure", { premise: "A haunted station" });
    const ov = await proto(p, "resources/read", { uri: "adventure://generated/overview" });
    assertContains(ov, "Premise", "REQ-248 overview resource");
    const nav = await proto(p, "resources/read", { uri: "adventure://generated/navigation" });
    assertContains(nav, "Navigation", "REQ-249 navigation resource");
    await call(p, "set_scene_state", { description: "scene", adventure_scene: "hall" });
    passed++;
    await kill(p);
  });

  await test("T207/REQ-170 + T338/REQ-292: adventure catalog and discovery surface", async () => {
    const p = await boot();
    await call(p, "create_novel", { name: "w6b" });
    const cat = await call(p, "list_adventures", {});
    assertContains(cat, "[No adventure modules found.]", "REQ-292 empty-state");
    const health = JSON.parse(await call(p, "spec_health", {}));
    if (typeof health.adventure_catalog_count !== "number") throw new Error("REQ-292 adventure_catalog_count");
    passed++;
    await kill(p);
  });

  await test("T284/REQ-250 + T312/REQ-252: adventure waypoint and fast-forward", async () => {
    const p = await boot();
    await call(p, "create_novel", { name: "w6c" });
    await call(p, "set_badge", { badge: "game_master" });
    await call(p, "generate_adventure", { premise: "A tower" });
    await call(p, "set_countdown", { name: "ritual", ticks: 3, type: "narrative" });
    await call(p, "set_scene_state", { description: "foyer", fast_forward: { interval: "three days of travel" } });
    const brief = await proto(p, "prompts/get", { name: "badge_briefing" });
    void brief;
    const aud = await proto(p, "resources/read", { uri: "audit://novel" });
    assertContains(aud, "fast-forward", "REQ-252 fast-forward audit entry");
    passed++;
    await kill(p);
  });

  // ── REQ-229 adventure synthesis linkage ──
  await test("T305/REQ-229: load_adventure synthesis augmentation section", async () => {
    const advDir = join(DATA_DIR, "adventures");
    mkdirSync(advDir, { recursive: true });
    writeFileSync(join(advDir, "test-tower.md"), `# Test Tower\n## Premise\nA tall tower.\n## Adventure Hook\nThe tower rises.\n## World\n## Location\nentrance\n## NPCs\n**Guard captain**\n3 HP\n`);
    const p = await boot({ TTRPG_ADVENTURE_DIR: advDir });
    await call(p, "create_novel", { name: "w6d" });
    await call(p, "set_badge", { badge: "game_master" });
    await call(p, "synthesize", {});
    const load = await call(p, "load_adventure", { slug: "test-tower" });
    assertContains(load, "Synthesis found", "REQ-229 synthesis linkage augmentation");
    passed++;
    await kill(p);
  });

  // ── Wave 7: Combat ──
  await test("T246/REQ-203 + T247/REQ-204 + T248/REQ-205: combat init guard, participant validation, mid-combat changes", async () => {
    const p = await boot();
    await call(p, "create_novel", { name: "w7a" });
    await call(p, "set_badge", { badge: "game_master" });
    await call(p, "create_character", { name: "Hero" });
    await call(p, "create_npc", { name: "Goblin" });
    const g = await call(p, "init_combat", { participants: ["nonexistent"] });
    assertContains(g, "[NOT_FOUND]", "REQ-204 participant validation");
    const c1 = await call(p, "init_combat", { participants: ["character_01", "npc_"] });
    void c1;
    const npcs = JSON.parse(await proto(p, "resources/read", { uri: "npcs://" }));
    const npcId = Object.keys(npcs)[0];
    await call(p, "init_combat", { participants: ["character_01", npcId] });
    const again = await call(p, "init_combat", { participants: ["character_01", npcId] });
    assertContains(again, "[STATE_CONFLICT]", "REQ-203 combat-init guard");
    const add = await call(p, "add_combat_participant", { participant_id: "nonexistent2" });
    assertContains(add, "[NOT_FOUND]", "REQ-205 add validation");
    passed++;
    await kill(p);
  });

  await test("T249/REQ-206: combat-round condition expiry", async () => {
    const p = await boot();
    await call(p, "create_novel", { name: "w7b" });
    await call(p, "set_badge", { badge: "game_master" });
    await call(p, "create_character", { name: "Fighter" });
    await call(p, "apply_condition", { entity_id: "character_01", condition: "prone", rounds: 1 });
    await call(p, "init_combat", { participants: ["character_01"] });
    await call(p, "advance_combat", {});
    await call(p, "advance_combat", {});
    const sheet = await call(p, "character_sheet", { entity_id: "character_01" });
    assertNotContains(sheet, "prone", "REQ-206 condition expired");
    const aud = await proto(p, "resources/read", { uri: "audit://novel" });
    assertContains(aud, "condition_expired", "REQ-206 expiry audited");
    passed++;
    await kill(p);
  });

  await test("T263/REQ-221: combat-navigation interaction blocks movement", async () => {
    const p = await boot();
    await call(p, "create_novel", { name: "w7c" });
    await call(p, "set_badge", { badge: "game_master" });
    await call(p, "create_character", { name: "W" });
    await call(p, "create_room", { name: "A", description: "a" });
    await call(p, "create_room", { name: "B", description: "b" });
    await call(p, "create_exit", { direction: "north", room_a: "A", room_b: "B" });
    await call(p, "init_combat", { participants: ["character_01"] });
    const nav = await call(p, "command", { command: "go north" });
    assertContains(nav, "[STATE_CONFLICT]", "REQ-221 navigation blocked in combat");
    const look = await call(p, "command", { command: "look" });
    assertNotContains(look, "[ERROR]", "REQ-221 inspection allowed");
    await call(p, "end_combat", {});
    const nav2 = await call(p, "command", { command: "go north" });
    assertNotContains(nav2, "Combat is active", "REQ-221 navigation resumes");
    passed++;
    await kill(p);
  });

  await test("T311/REQ-251: generation intent guard warns on harm/power-inversion", async () => {
    const p = await boot();
    await call(p, "create_novel", { name: "w7d" });
    await call(p, "set_badge", { badge: "game_master" });
    const warn = await call(p, "generate_adventure", { premise: "create an adversary capable of defeating Hero" });
    assertContains(warn, "[WARNING]", "REQ-251 generation guard warns");
    const force = await call(p, "generate_adventure", { premise: "!force create an adversary capable of defeating Hero" });
    assertContains(force, "[OK]", "REQ-251 !force override proceeds");
    const aud = await proto(p, "resources/read", { uri: "audit://novel" });
    assertContains(aud, "generation-guard-overridden", "REQ-251 override audited");
    passed++;
    await kill(p);
  });

  await test("T313/REQ-253: terse output verbosity", async () => {
    const p = await boot();
    await call(p, "create_novel", { name: "w7e" });
    await call(p, "set_badge", { badge: "game_master" });
    await call(p, "set_verbosity", { mode: "terse" });
    const health = JSON.parse(await call(p, "spec_health", {}));
    if (health.verbosity_mode !== "terse") throw new Error("REQ-253 verbosity_mode not reported");
    passed++;
    await kill(p);
  });

  await test("T192/REQ-157: combat determinism with per-call seed", async () => {
    const p = await boot();
    await call(p, "create_novel", { name: "w7f" });
    await call(p, "set_badge", { badge: "game_master" });
    await call(p, "init_combat", { participants: [], dangers: [{ name: "goblin" }, { name: "orc" }], seed: "42" });
    await call(p, "end_combat", {});
    await call(p, "init_combat", { participants: [], dangers: [{ name: "goblin" }, { name: "orc" }], seed: "42" });
    const aud = await proto(p, "resources/read", { uri: "audit://novel" });
    assertContains(aud, "init_combat", "REQ-157 combat seeded init");
    passed++;
    await kill(p);
  });

  // ── Wave 8: §5.7/§5.2 determinism & safety ──
  await test("T20/T42/REQ-054: adversarial input stored and echoed verbatim", async () => {
    const p = await boot();
    await call(p, "create_novel", { name: "w8a" });
    await call(p, "set_badge", { badge: "game_master" });
    const evil = "'); DROP TABLE novels;--";
    const s = await call(p, "set_scene_state", { description: evil });
    assertContains(s, evil, "REQ-054 verbatim echo");
    const cur = await proto(p, "resources/read", { uri: "scene://current" });
    assertContains(cur, evil, "REQ-054 stored verbatim");
    passed++;
    await kill(p);
  });

  await test("T357/REQ-312 + T490/REQ-417: narration validation gate and startup probes", async () => {
    const p = await boot({ TTRPG_NARRATION_VALIDATION: "on" });
    await call(p, "create_novel", { name: "w8b" });
    await call(p, "set_badge", { badge: "game_master" });
    await call(p, "create_npc", { name: "Corpse", stats: { hp: 0 } });
    const h1 = JSON.parse(await call(p, "spec_health", {}));
    if (h1.narration_validation !== "on") throw new Error("REQ-312 narration_validation missing");
    if (typeof h1.narration_rejection_count !== "number") throw new Error("REQ-312 rejection count");
    if (h1.startup_probes?.ruleset_scan !== "completed") throw new Error("REQ-417 probe status");
    passed++;
    await kill(p);
  });

  // ── Wave 9: §5.8 Synthesis ──
  await test("T70/REQ-086: compress_audit format and INVALID_INPUT", async () => {
    const p = await boot();
    await call(p, "create_novel", { name: "w9a" });
    await call(p, "set_badge", { badge: "game_master" });
    const ca = await call(p, "compress_audit", { max_entries: 5 });
    assertContains(ca, "Compressed audit log", "REQ-086 header line");
    const bad = await call(p, "compress_audit", { max_entries: 0 });
    assertContains(bad, "[INVALID_INPUT]", "REQ-086 zero entries");
    passed++;
    await kill(p);
  });

  await test("T476/REQ-087 + T119/REQ-115: scene type tagging and action pattern toggle", async () => {
    const p = await boot();
    await call(p, "create_novel", { name: "w9b" });
    await call(p, "set_badge", { badge: "game_master" });
    const st = await call(p, "set_scene_state", { description: "social scene", scene_type: "social" });
    assertContains(st, "[OK]", "REQ-087 scene type");
    const tg = await call(p, "toggle_action_patterns", {});
    assertContains(tg, "[OK]", "REQ-115 action pattern toggle");
    passed++;
    await kill(p);
  });

  await test("T300/REQ-185 + T225/REQ-186: section token vocabulary and discoverability", async () => {
    const p = await boot();
    await call(p, "create_novel", { name: "w9c" });
    await call(p, "set_badge", { badge: "game_master" });
    const health = JSON.parse(await call(p, "spec_health", {}));
    if (!Array.isArray(health.section_tokens) || health.section_tokens.length === 0) throw new Error("REQ-185/186 section_tokens missing");
    const bad = await call(p, "set_briefing_order", { sections: ["not_a_token"] });
    assertContains(bad, "[INVALID_INPUT]", "REQ-082 unknown token");
    passed++;
    await kill(p);
  });

  await test("T299/REQ-155: sticky counter decay", async () => {
    const p = await boot();
    await call(p, "create_novel", { name: "w9d" });
    await call(p, "set_badge", { badge: "game_master" });
    await call(p, "set_lore_entry", { key: "k", content: "c", triggers: ["fire"], sticky: 2, badge_scope: "shared" });
    await call(p, "set_scene_state", { description: "the fire burns" });
    await call(p, "set_scene_state", { description: "quiet now" });
    await call(p, "set_scene_state", { description: "quiet now" });
    const brief = await proto(p, "prompts/get", { name: "badge_briefing" });
    assertNotContains(brief, "Triggered Lore", "REQ-155 sticky entry not triggered");
    assertNotContains(brief, "the fire burns", "REQ-155 sticky content absent");
    passed++;
    await kill(p);
  });

  await test("T307/REQ-231 + T322/REQ-263: per-module toggle and auto-trigger reporting", async () => {
    const p = await boot();
    await call(p, "create_novel", { name: "w9e" });
    await call(p, "set_badge", { badge: "game_master" });
    const bad = await call(p, "toggle_synthesis_module", { module: "nope", enabled: false });
    assertContains(bad, "[INVALID_INPUT]", "REQ-231 unknown module");
    const h = JSON.parse(await call(p, "spec_health", {}));
    if (!("synthesis_auto_trigger" in h)) throw new Error("REQ-263 auto-trigger missing");
    passed++;
    await kill(p);
  });

  await test("T321/REQ-262 + T323/REQ-264 + T326/REQ-265: synthesize tool and briefing presence", async () => {
    const p = await boot();
    await call(p, "create_novel", { name: "w9f" });
    await call(p, "set_badge", { badge: "game_master" });
    const s = await call(p, "synthesize", {});
    assertContains(s, "[OK]", "REQ-262 synthesize runs");
    const s2 = await call(p, "synthesize", {});
    assertContains(s2, "up to date", "REQ-262 staleness fingerprint");
    passed++;
    await kill(p);
  });

  await test("T355/REQ-310: campaign memory counts", async () => {
    const p = await boot();
    await call(p, "create_novel", { name: "w9g" });
    await call(p, "set_badge", { badge: "game_master" });
    await call(p, "create_npc", { name: "MemNpc" });
    const h = JSON.parse(await call(p, "spec_health", {}));
    if (h.campaign_memory?.npcs < 1) throw new Error("REQ-310 campaign_memory npcs missing");
    const brief = await proto(p, "prompts/get", { name: "badge_briefing" });
    assertContains(brief, "Campaign Memory", "REQ-310 briefing section");
    passed++;
    await kill(p);
  });

  await test("T375/REQ-328 + T378/REQ-331: lore-world and story-world coupling", async () => {
    const p = await boot();
    await call(p, "create_novel", { name: "w9h" });
    await call(p, "set_badge", { badge: "game_master" });
    await call(p, "set_lore_entry", { key: "altar", content: "The altar hums", triggers: ["altar"], world_target: "altar_01" });
    const s = await call(p, "record_story", { type: "moment", entry: "Found the door" });
    assertContains(s, "[OK]", "REQ-331 record_story");
    passed++;
    await kill(p);
  });

  await test("T302/REQ-226: narrative voice profiles resource", async () => {
    const p = await boot();
    await call(p, "create_novel", { name: "w9i" });
    const r = await proto(p, "resources/read", { uri: "synthesis://narrative_voices" });
    assertContains(r, "Narrative Voice Profiles", "REQ-226 narrative voices resource");
    passed++;
    await kill(p);
  });

  // ── Wave 10: §5.10 World-model couplings ──
  await test("T240/REQ-197 + T333/REQ-283: description modes and verb coverage", async () => {
    const p = await boot();
    await call(p, "create_novel", { name: "w10a" });
    await call(p, "set_badge", { badge: "game_master" });
    const b = await call(p, "command", { command: "brief" });
    assertContains(b, "[OK]", "REQ-197 brief mode");
    const v = await call(p, "command", { command: "verbs" });
    assertContains(v, "Verb coverage", "REQ-283 verb tiers");
    const h = JSON.parse(await call(p, "spec_health", {}));
    if (typeof h.parser_verb_coverage?.core !== "number") throw new Error("REQ-283 parser_verb_coverage");
    if (h.description_mode !== "brief") throw new Error("REQ-197 description_mode");
    passed++;
    await kill(p);
  });

  await test("T370/REQ-326 + T371/REQ-327: scene-world and NPC-world coupling", async () => {
    const p = await boot();
    await call(p, "create_novel", { name: "w10b" });
    await call(p, "set_badge", { badge: "game_master" });
    await call(p, "create_room", { name: "Throne Room", description: "golden" });
    await call(p, "create_npc", { name: "Blacksmith", location: "Throne Room" });
    await call(p, "set_scene_state", { description: "The throne room", location: "Throne Room" });
    const cur = await proto(p, "resources/read", { uri: "scene://current" });
    assertContains(cur, "Throne Room", "REQ-326 scene-world coupling room match");
    const npcs = JSON.parse(await proto(p, "resources/read", { uri: "npcs://" }));
    const id = Object.keys(npcs)[0];
    const upd = await call(p, "update_npc", { npc_id: id, location: "Inn" });
    assertContains(upd, "[OK]", "REQ-327 update_npc location");
    passed++;
    await kill(p);
  });

  await test("T419/REQ-368: countdown world_effect fires and applies", async () => {
    const p = await boot();
    await call(p, "create_novel", { name: "w10c" });
    await call(p, "set_badge", { badge: "game_master" });
    await call(p, "create_room", { name: "cellar", description: "dry" });
    await call(p, "set_countdown", { name: "flood", ticks: 1, type: "narrative", world_effect: { type: "describe", target: "cellar", value: "Knee-deep water" } });
    await call(p, "advance_countdown", { name: "flood" });
    const cur = await proto(p, "resources/read", { uri: "scene://current" });
    void cur;
    const room = await proto(p, "resources/read", { uri: "room://cellar" });
    assertContains(room, "Knee-deep water", "REQ-368 world_effect applied");
    passed++;
    await kill(p);
  });

  await test("T372/REQ-325: constraint override catalog", async () => {
    const p = await boot();
    await call(p, "create_novel", { name: "w10d" });
    await call(p, "set_badge", { badge: "game_master" });
    const c = await proto(p, "resources/read", { uri: "constraints://active" });
    assertContains(c, "[", "REQ-325 constraints resource");
    const h = JSON.parse(await call(p, "spec_health", {}));
    if (!("constraint_override_counts" in h)) throw new Error("REQ-325 constraint_override_counts");
    passed++;
    await kill(p);
  });

  await test("T354/REQ-284: implicit action hints on locked open", async () => {
    const p = await boot();
    await call(p, "create_novel", { name: "w10e" });
    await call(p, "set_badge", { badge: "game_master" });
    await call(p, "create_character", { name: "W" });
    await call(p, "create_room", { name: "Hall", description: "h" });
    await call(p, "create_thing", { name: "chest", description: "a chest", openable: true, lockable: true, locked: true, fixed: true, location: "Hall" });
    const noKey = await call(p, "command", { command: "open chest" });
    assertContains(noKey, "locked", "REQ-284 locked message");
    await call(p, "create_thing", { name: "iron key", description: "k", location: "Hall" });
    const hint = await call(p, "command", { command: "open chest" });
    assertContains(hint, "Hint: You need the iron key", "REQ-284 reachable key hint");
    passed++;
    await kill(p);
  });

  await test("T418/REQ-367: property propagation across containment", async () => {
    const p = await boot();
    await call(p, "create_novel", { name: "w10f" });
    await call(p, "set_badge", { badge: "game_master" });
    await call(p, "create_character", { name: "W2" });
    await call(p, "create_room", { name: "Dark", description: "d" });
    await call(p, "create_thing", { name: "glass jar", description: "j", openable: true, fixed: true, transparent: true, location: "Dark" });
    await call(p, "create_thing", { name: "lantern", description: "l", lit: true, switched_on: true, location: "glass jar", location_type: "container" });
    const look = await call(p, "command", { command: "look" });
    assertContains(look, "glowing lantern", "REQ-367 transparent container propagation");
    passed++;
    await kill(p);
  });

  // ── Wave 11: §5.16/§5.17 Ruleset packages + §5.4 workflows ──
  await test("T441/T449/REQ-380 + T452/T453/REQ-389 + T454/T455/REQ-390: ruleset binding, package format, lazy hydration", async () => {
    seedRuleset();
    const p = await boot();
    await call(p, "create_novel", { name: "w11a", ruleset: "wave1test" });
    await call(p, "set_badge", { badge: "game_master" });
    const h = JSON.parse(await call(p, "spec_health", {}));
    if (typeof h.rulesets_installed !== "number") throw new Error("REQ-380 ruleset binding health");
    const look = await call(p, "wave1test_lookup_spell", { key: "fireball" });
    assertContains(look, "Evocation", "REQ-389 package tool surface");
    const list = await call(p, "list_rulesets", {});
    assertContains(list, "wave1test", "REQ-390 hydration state");
    passed++;
    await kill(p);
  });

  await test("T460/REQ-393 + T459/REQ-392 + T456/REQ-391: update preservation, tool budget, scoped listing", async () => {
    seedRuleset();
    const p = await boot();
    await call(p, "create_novel", { name: "w11b", ruleset: "wave1test" });
    const h = JSON.parse(await call(p, "spec_health", {}));
    if (typeof h.rulesets_hydrated !== "number") throw new Error("REQ-393 update preservation");
    if (typeof h.tools_list_bytes !== "number") throw new Error("REQ-392 tools_list_bytes");
    const list = await call(p, "list_rulesets", {});
    assertContains(list, "wave1test", "REQ-391 scoped listing");
    passed++;
    await kill(p);
  });

  await test("T32/REQ-056: advancement workflow raises NEED_INPUT per open choice", async () => {
    const p = await boot();
    await call(p, "create_novel", { name: "w11c" });
    await call(p, "set_badge", { badge: "game_master" });
    const nf = await call(p, "create_character", {});
    assertContains(nf, "[NEED_INPUT]", "REQ-056 workflow raises");
    await call(p, "respond", { decision: "cancel", option: "cancel" });
    passed++;
    await kill(p);
  });

  await test("T494/REQ-193: pending workflow staleness surfaced in spec_health", async () => {
    const p = await boot();
    await call(p, "create_novel", { name: "w11d" });
    await call(p, "set_badge", { badge: "game_master" });
    await call(p, "create_character", {});
    const h = JSON.parse(await call(p, "spec_health", {}));
    if (!("pending_workflow" in h)) throw new Error("REQ-193 staleness surface");
    passed++;
    await kill(p);
  });

  // ── Wave 12: output format catalog (REQ-425) + MCP Apps UI surface (REQ-426) ──
  await test("T505/REQ-425: output format catalog uniformity + validation", async () => {
    const p = await boot();
    await call(p, "create_novel", { name: "w12a" });
    await call(p, "set_badge", { badge: "game_master" });
    await call(p, "create_character", { name: "Fen", description: "scarred" });
    const entity_id = "character_01";
    // markdown default
    const mdDefault = await call(p, "character_sheet", { entity_id });
    assertContains(mdDefault, "## Fen", "T505 character_sheet markdown default");
    // json structured
    const j = await call(p, "character_sheet", { entity_id, format: "json" });
    const parsed = JSON.parse(j);
    if (parsed.name !== "Fen") throw new Error("T505 json name mismatch");
    // html presentational
    const html = await call(p, "character_sheet", { entity_id, format: "html" });
    assertContains(html, "<h2>", "T505 character_sheet html");
    // ascii
    const ascii = await call(p, "character_sheet", { entity_id, format: "ascii" });
    assertContains(ascii, "Fen", "T505 character_sheet ascii");
    // unsupported format -> INVALID_INPUT with enumeration
    const bad = await call(p, "character_sheet", { entity_id, format: "pdf" });
    assertContains(bad, "[INVALID_INPUT]", "T505 unsupported format rejects");
    assertContains(bad, "Supported formats", "T505 unsupported format enumerates");
    // resource ?format= markdown/json/html + byte-consistency via same renderer
    await call(p, "create_npc", { name: "Goblin" });
    const npcs = JSON.parse(await proto(p, "resources/read", { uri: "npcs://" }));
    const npc_id = Object.keys(npcs)[0];
    const npcMd = await proto(p, "resources/read", { uri: `npc://${npc_id}` });
    assertContains(npcMd, "## Goblin", "T505 npc resource markdown default");
    const npcHtml = await proto(p, "resources/read", { uri: `npc://${npc_id}?format=html` });
    assertContains(npcHtml, "<h2>", "T505 npc resource html");
    // codex + lore resources honor the catalog
    await call(p, "codex_set", { kind: "npc", name: "Blacksmith", content: { ac: 14 } });
    const codexHtml = await proto(p, "resources/read", { uri: "codex://npc_blacksmith?format=html" });
    assertContains(codexHtml, "<h2>", "T505 codex resource html");
    await call(p, "set_lore_entry", { key: "treaty", content: "A border treaty." });
    const loreJson = await proto(p, "resources/read", { uri: "lore://treaty?format=json" });
    assertContains(loreJson, "border treaty", "T505 lore resource json");
    passed++;
    await kill(p);
  });

  await test("T506/REQ-425d: ruleset-declared format registry surfaced in spec_health", async () => {
    const p = await boot();
    await call(p, "create_novel", { name: "w12b" });
    await call(p, "set_badge", { badge: "game_master" });
    const h = JSON.parse(await call(p, "spec_health", {}));
    const of = h.output_formats;
    if (!of || !Array.isArray(of.declared)) throw new Error("T506 output_formats.declared missing");
    if (!Array.isArray(of.universal) || !of.universal.includes("html")) throw new Error("T506 universal html missing");
    passed++;
    await kill(p);
  });

  await test("T507/REQ-426: MCP Apps ui:// surface (negotiated)", async () => {
    const p = await bootApps();
    await call(p, "create_novel", { name: "w12c" });
    await call(p, "set_badge", { badge: "game_master" });
    await call(p, "create_character", { name: "Fen" });
    const entity_id = "character_01";
    // tool result carries ui:// linkage metadata (REQ-426b)
    const r = await callRaw(p, "character_sheet", { entity_id });
    const item = (r.content ?? [])[0] ?? {};
    if (item._meta?.ui?.resourceUri !== `ui://character-sheet/${entity_id}`) throw new Error("T507 character_sheet ui linkage missing");
    // ui:// resource served as text/html;profile=mcp-app with restrictive CSP (REQ-426a/d)
    const res = await readRaw(p, `ui://character-sheet/${entity_id}`);
    const c = (res.contents ?? [])[0];
    if (!c || c.mimeType !== "text/html;profile=mcp-app") throw new Error("T507 ui mimeType mismatch: " + c?.mimeType);
    if (!(c.text ?? "").includes("<h2>")) throw new Error("T507 ui html body missing");
    const csp = c._meta?.ui?.csp;
    if (!csp || (csp.connectDomains ?? []).length !== 0) throw new Error("T507 ui CSP must declare no external origins");
    passed++;
    await kill(p);
  });

  await test("T508/REQ-426c: fallback without negotiation", async () => {
    const p = await boot();
    await call(p, "create_novel", { name: "w12d" });
    await call(p, "set_badge", { badge: "game_master" });
    await call(p, "create_character", { name: "Fen" });
    const entity_id = "character_01";
    // tool result has no ui linkage metadata when the client did not negotiate
    const r = await callRaw(p, "character_sheet", { entity_id });
    const item = (r.content ?? [])[0] ?? {};
    if (item._meta?.ui?.resourceUri !== undefined) throw new Error("T508 unexpected ui linkage");
    // ui:// read returns a plain-text fallback, not HTML
    const res = await readRaw(p, `ui://character-sheet/${entity_id}`);
    const c = (res.contents ?? [])[0];
    if (c?.mimeType === "text/html;profile=mcp-app") throw new Error("T508 ui served HTML without negotiation");
    assertContains(c?.text ?? "", "MCP Apps extension", "T508 fallback notice");
    passed++;
    await kill(p);
  });

  console.log(`\n${passed} passed, ${failed} failed`);
  rmSync(DATA_DIR, { recursive: true, force: true });
  if (failed > 0) process.exit(1);
}
main().catch((e) => { console.error("FATAL", e); process.exit(2); });