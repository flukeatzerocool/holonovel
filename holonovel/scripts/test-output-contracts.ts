// Wave-1 §5.1 Output & Error Contracts harness.
// Covers REQ-003 (roll transparency), REQ-004 (truncation + output://),
// REQ-060 (verbose output), REQ-061 (source quoting), REQ-064 (badge boundary),
// REQ-070 (anti-slop), REQ-071 (narrative tone), REQ-113 (result counts),
// REQ-118 (prompt budget), REQ-184 (anti-slop resource), REQ-194 (anchor),
// REQ-280 (source anchor).

import { spawn } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { deriveAnchor } from "../src/core/anchors.js";

const SERVER_SCRIPT = join(process.cwd(), "src", "index.ts");
const DATA_DIR = mkdtempSync(join(tmpdir(), "wave1-"));
let msgId = 0; const pending = new Map(); let buffer = "";
function send(proc: any, msg: any) { return new Promise((r) => { const id = ++msgId; pending.set(id, r); proc.stdin!.write(JSON.stringify({ ...msg, id, jsonrpc: "2.0" }) + "\n"); }); }
function attach(proc: any) { buffer = ""; proc.stdout!.on("data", (d: Buffer) => { buffer += d.toString(); const ls = buffer.split("\n"); buffer = ls.pop() ?? ""; for (const l of ls) { if (!l.trim()) continue; try { const m = JSON.parse(l); if (m.id !== undefined && pending.has(m.id)) { pending.get(m.id)!(m); pending.delete(m.id); } } catch { } } }); }
async function boot(env: any = {}) { const p = spawn("npx", ["tsx", SERVER_SCRIPT], { env: { ...process.env, TTRPG_DATA_DIR: DATA_DIR, ...env }, stdio: ["pipe", "pipe", "pipe"] }); attach(p); await send(p, { method: "initialize", params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "wave1", version: "1" } } }); p.stdin!.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n"); await new Promise((r) => setTimeout(r, 250)); return p; }
async function call(proc: any, name: string, args: any = {}) { const r = await send(proc, { method: "tools/call", params: { name, arguments: args } }); const c = r.result?.content ?? []; return c.map((x: any) => x?.text ?? "").join("\n"); }
async function proto(proc: any, method: string, params: any) {
  const r = await send(proc, { method, params });
  if (r.result?.contents) return r.result.contents.map((x: any) => x.text ?? "").join("\n");
  if (r.result?.messages) return r.result.messages.map((m: any) => m.content?.text ?? "").join("\n");
  return JSON.stringify(r.result).slice(0, 500);
}
async function kill(proc: any) { try { proc.kill("SIGKILL"); } catch { } await new Promise((r) => setTimeout(r, 100)); }

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
  manifest: { slug: "wave1test", name: "Wave1 Test", host_version: "2026.08.18", content_hash: "TBD", built_at: "2026-08-24", counts: { index: 3 } },
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

  console.log(`\n${passed} passed, ${failed} failed`);
  rmSync(DATA_DIR, { recursive: true, force: true });
  if (failed > 0) process.exit(1);
}
main().catch((e) => { console.error("FATAL", e); process.exit(2); });