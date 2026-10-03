#!/usr/bin/env node
// Tool-definition quality harness (REQ-427, REQ-024), registry-published [gate]
// distribution guard (REQ-428), server-wide action-discriminator surface
// guard (REQ-429), ruleset tool-quality conformance guard (REQ-430), and the
// gate-classification table guard (REQ-137a/REQ-137b) and the Holodeck
// behavioral-config discovery guard (REQ-388). Exercises T151, T450, T509,
// T510, T511, T512, and T644–T648.
//
// T644 (REQ-552): deterministic TDQS conformance over the live registered
// surface, reported in spec_health.tdqs.
// T645 (REQ-553): the missing, tautological, and annotation-contradicting hard
// gates each fail conformance.
// T646 (REQ-554): the four server-coherence proxies, one naming convention, no
// undisambiguated overlap.
// T647 (REQ-555): invocation cost over the required subtree and shadow
// candidates.
// T648 (REQ-430): the build-time ruleset package conformance gate refuses a
// non-conformant tools.json and passes a conformant one.
//
// T509 (REQ-427 + REQ-024): boots a ruleset-free host and asserts every
// registered tool's description carries the three-clause structure (summary,
// "Use when:", "Do NOT use when:") and that every advertised input parameter
// carries a non-empty description in its JSON Schema.
//
// T642 (REQ-024c + REQ-548b): asserts the tool-definition authoring standard —
// no schema-restating parameter enumeration, a title at least as long as the
// tool name, a description within the recorded byte budget, and a documented
// output-schema field set.
//
// T510 (REQ-428): asserts holonovel/server.json's version and package version
// equal the npm-canonical host version, and that the root version-check gate
// passes against the committed manifest.
//
// T511 (REQ-429): asserts the registered tool catalog equals the recorded tool
// budget, one per persisted entity type, and that every persisted type carries
// a list/get/info/status/knowledge action on its entity tool.
//
// T512 (REQ-430): seeds a fixture package with one conformant and one
// non-conformant tool schema, and asserts the host registers both, flags the
// non-conformant one in spec_health.ruleset_package_alerts naming slug/tool/
// defect, reports conformant/non-conformant counts, and clears the flag after
// a conformant rebuild.
//
// Exit codes: 0 = pass, 1 = one or more assertions failed.

import { spawn, spawnSync, ChildProcess } from "node:child_process";
import { mkdtempSync, readFileSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createHash } from "node:crypto";
import { PACKAGE_FORMAT } from "../src/generated/contract-fingerprints.js";
import { applyHardGates, shadowCandidates, computeContextSignals } from "../src/core/tdqs.js";
import { installHarnessGuard, harnessComplete } from "./lib/harness-guard.js";
installHarnessGuard();

const ROOT = join(import.meta.dirname!, "..", "..");
const SERVER_SCRIPT = join(import.meta.dirname!, "..", "src", "index.ts");
const DATA_DIR = mkdtempSync(join(tmpdir(), "holonovel-tooldef-"));

// REQ-429 — the recorded tool budget in DECISIONS.md is the single source of
// truth for the catalog size; read it rather than hardcoding a count.
function recordedToolBudget(): number {
  const md = readFileSync(join(ROOT, "holonovel", "DECISIONS.md"), "utf-8");
  const m = md.match(/\*\*Recorded tool budget:\*\*\s*(\d+)/);
  if (!m) throw new Error("DECISIONS.md is missing the REQ-429 'Recorded tool budget' line");
  return parseInt(m[1], 10);
}

// REQ-024c — the description-size budget recorded in DECISIONS.md is the
// single source of truth; read it rather than hardcoding a byte count.
function recordedDescriptionBudget(): number {
  const md = readFileSync(join(ROOT, "holonovel", "DECISIONS.md"), "utf-8");
  const m = md.match(/\*\*Recorded description budget:\*\*\s*(\d+)/);
  if (!m) throw new Error("DECISIONS.md is missing the REQ-024c 'Recorded description budget' line");
  return parseInt(m[1], 10);
}

let passed = 0;
let failed = 0;
async function test(name: string, fn: () => void | Promise<void>): Promise<void> {
  try { await fn(); passed++; console.log(`  PASS ${name}`); }
  catch (e: any) { failed++; console.error(`  FAIL ${name}: ${e.message}`); }
}
function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(msg);
}

// ── MCP client ────────────────────────────────────────────────────────
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
      let m: any;
      try { m = JSON.parse(line); } catch { continue; }
      if (m.id !== undefined && pending.has(m.id)) { pending.get(m.id)!(m); pending.delete(m.id); }
    }
  });
}
async function boot(extraEnv: Record<string, string> = {}): Promise<ChildProcess> {
  const proc = spawn("npx", ["tsx", SERVER_SCRIPT], {
    env: { ...process.env, TTRPG_DATA_DIR: DATA_DIR, ...extraEnv },
    stdio: ["pipe", "pipe", "pipe"],
  });
  attach(proc);
  await send(proc, { method: "initialize", params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "tooldef", version: "1" } } });
  proc.stdin!.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n");
  await new Promise((r) => setTimeout(r, 250));
  return proc;
}

async function call(proc: ChildProcess, name: string, args: Record<string, unknown> = {}): Promise<string> {
  const resp = await send(proc, { method: "tools/call", params: { name, arguments: args } });
  if (resp.error) throw new Error(`RPC error: ${JSON.stringify(resp.error)}`);
  const content = resp.result?.content ?? [];
  return content.map((c: any) => (c?.text ?? "")).join("\n");
}

// REQ-430 — seed a fixture package under the data dir before boot. The content
// hash matches the host's algorithm (sha256 over the five canonical files in
// order), so the package passes integrity validation.
function packageContentHash(index: any[], model: any, tools: any[], resources: any[], prompts: any[]): string {
  const canonical = (obj: any) => JSON.stringify(JSON.parse(JSON.stringify(obj)));
  const h = createHash("sha256");
  for (const obj of [index, model, tools, resources, prompts]) h.update(canonical(obj));
  return h.digest("hex");
}

function seedTQPackage(tools: any[]): void {
  const dir = join(DATA_DIR, "rulesets", "tqtest");
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const index: any[] = [];
  const model: Record<string, any> = {};
  const resources: any[] = [];
  const prompts: any[] = [];
  const manifest = {
    slug: "tqtest",
    name: "Tool Quality Test",
    host_version: "0.0.0",
    package_format: PACKAGE_FORMAT,
    content_hash: packageContentHash(index, model, tools, resources, prompts),
    built_at: new Date().toISOString(),
    counts: {},
  };
  for (const [name, obj] of Object.entries({
    "manifest.json": manifest,
    "index.json": index,
    "model.json": model,
    "tools.json": tools,
    "resources.json": resources,
    "prompts.json": prompts,
  })) {
    writeFileSync(join(dir, name), JSON.stringify(obj, null, 2) + "\n");
  }
}

function npmCanonical(v: string): string {
  return v.split(".").map((p, i) => (i === 0 ? p : String(parseInt(p, 10)))).join(".");
}

async function main() {
  console.log("=== Tool-definition quality (T509) + registry distribution (T510) ===\n");

  // ── T509 ────────────────────────────────────────────────────────────
  const proc = await boot();
  const listResp = await send(proc, { method: "tools/list", params: {} });
  const tools: any[] = listResp.result?.tools ?? [];
  const budget = recordedToolBudget();
  assert(tools.length === budget, `expected the recorded tool budget of ${budget}, got ${tools.length}`);

  // ── T511 (REQ-429): every persisted entity type has a read/enumerate action.
  await test("T511/REQ-429: server-wide action-discriminator surface within the recorded tool budget", () => {
    const toolNames = new Set(tools.map((t) => t.name));
    const requiredEntityTools = ["manage_novel", "manage_character", "manage_npc", "manage_world", "manage_faction", "manage_vow", "manage_countdown", "manage_lore", "manage_story", "manage_note", "manage_codex", "manage_combat", "manage_condition", "manage_relationship", "resolve_fate", "resolve_ironsworn", "resolve_forged", "manage_belief", "manage_identity", "manage_knowledge", "manage_agent", "manage_session"];
    for (const name of requiredEntityTools) {
      assert(toolNames.has(name), `missing entity tool '${name}'`);
    }
    const readActionHints: Record<string, string[]> = {
      manage_novel: ["info", "list"], manage_character: ["sheet", "roster_list"], manage_npc: ["list", "get"],
      manage_world: ["create_room", "causal_state"], manage_faction: ["list"], manage_vow: ["list"], manage_countdown: ["list"],
      manage_lore: ["list", "get", "corpus_list", "corpus_get"], manage_story: ["list"], manage_note: ["list"], manage_codex: ["list", "get"],
      manage_combat: ["status"], manage_condition: ["list"], manage_relationship: ["get"], resolve_fate: ["roll", "aspect", "fate_point", "stress"],
      resolve_ironsworn: ["momentum", "move", "progress"], resolve_forged: ["action_roll", "stress", "downtime"],
      manage_belief: ["list", "get", "perception_list"], manage_identity: ["list", "snapshot"],
      manage_knowledge: ["index_status", "index_list", "graph_status", "graph_get", "graph_nodes", "graph_edges"],
      manage_agent: ["list", "get"], manage_session: ["event", "history"],
    };
    for (const [name, actions] of Object.entries(readActionHints)) {
      const tool = tools.find((t) => t.name === name);
      const props: Record<string, any> = (tool?.inputSchema && typeof tool.inputSchema === "object") ? (tool.inputSchema.properties ?? {}) : {};
      const actionEnum: string[] = props.action?.enum ?? [];
      for (const a of actions) {
        assert(actionEnum.includes(a), `${name} action enum missing '${a}'`);
      }
    }

    // Docs-as-code: the maintainer orientation must reflect the live surface.
    const agentsMd = readFileSync(join(ROOT, "holonovel", "AGENTS.md"), "utf-8");
    const docCount = agentsMd.match(/(\d+)\s+action-discriminator tools/);
    assert(docCount !== null, "holonovel/AGENTS.md is missing the tool-surface count line");
    assert(parseInt(docCount![1], 10) === tools.length, `holonovel/AGENTS.md tool count (${docCount![1]}) drifted from the live surface (${tools.length})`);
  });

  let toolsWithDescription = 0;
  let describedParams = 0;
  const violations: string[] = [];

  for (const t of tools) {
    const desc = typeof t.description === "string" ? t.description : "";
    if (!desc.includes("Use when") || !desc.includes("Do NOT use")) {
      violations.push(`${t.name}: description missing three-clause structure`);
    } else {
      toolsWithDescription++;
    }
    const props = (t.inputSchema && typeof t.inputSchema === "object" && t.inputSchema.properties) || {};
    for (const [key, prop] of Object.entries(props)) {
      const p = prop as any;
      if (!p || typeof p.description !== "string" || p.description.trim() === "") {
        violations.push(`${t.name}.${key}: parameter missing description`);
      } else {
        describedParams++;
      }
    }
  }

  await test(`T509/REQ-427+REQ-024: all ${tools.length} tools carry three-clause descriptions and described parameters`, () => {
    assert(violations.length === 0, `${violations.length} violations:\n  ${violations.slice(0, 20).join("\n  ")}`);
    assert(toolsWithDescription === tools.length, "not every tool has a three-clause description");
  });
  console.log(`    (${toolsWithDescription}/${tools.length} tools conformant; ${describedParams} parameters described)`);

  // ── T642 (REQ-024c, REQ-548b): tool-definition authoring standard — no
  // schema-restating parameter enumeration, title length, description budget,
  // and documented output-schema fields.
  await test(`T642/REQ-024c+REQ-548b: all ${tools.length} tools meet the authoring standard`, async () => {
    const budget = recordedDescriptionBudget();
    const defects: string[] = [];
    for (const t of tools) {
      const desc = typeof t.description === "string" ? t.description : "";
      const title = typeof t.title === "string" ? t.title : "";
      const bytes = Buffer.byteLength(desc, "utf-8");
      if (desc.includes("Parameters by action")) defects.push(`${t.name}: restates schema parameters (REQ-024c)`);
      if (bytes > budget) defects.push(`${t.name}: description ${bytes}B exceeds budget ${budget}B`);
      if (title.length < t.name.length) defects.push(`${t.name}: title '${title}' shorter than name`);
      const out: any = t.outputSchema;
      const props: Record<string, any> = out && typeof out === "object" ? (out.properties ?? {}) : {};
      if (Object.keys(props).length === 0) defects.push(`${t.name}: output schema has no documented fields`);
      for (const [k, v] of Object.entries(props)) {
        const d = v?.description;
        if (typeof d !== "string" || d.trim() === "") defects.push(`${t.name}: output field '${k}' undocumented`);
      }
    }
    assert(defects.length === 0, `${defects.length} authoring-standard defects:\n  ${defects.slice(0, 20).join("\n  ")}`);
    console.log(`    (${tools.length} tools within ${budget}B budget; output fields documented)`);
    // REQ-450/REQ-025 — runtime mirror of the static lint, reported in spec_health.
    const health = JSON.parse(await call(proc, "manage_session", { action: "health" }));
    const q = health.host_tool_quality;
    assert(q && typeof q.checked === "number", "spec_health.host_tool_quality missing");
    assert(q.defective === 0, `host tool quality defects: ${JSON.stringify(q.defects)}`);
  });

  // ── T644 (REQ-552): deterministic TDQS conformance over the live surface.
  await test(`T644/REQ-552: spec_health.tdqs reports every registered tool at or above the passing tier`, async () => {
    const health = JSON.parse(await call(proc, "manage_session", { action: "health" }));
    const t = health.tdqs;
    assert(t && typeof t === "object", "spec_health.tdqs missing (REQ-552)");
    assert(t.tool_count === tools.length, `tdqs.tool_count ${t.tool_count} != registered ${tools.length}`);
    assert(typeof t.mean_tdqs === "number" && typeof t.min_tdqs === "number", "tdqs mean/min missing");
    assert(["A", "B", "C", "D", "F"].includes(t.description_quality_tier), `bad tier '${t.description_quality_tier}'`);
    assert(Array.isArray(t.below_passing) && t.below_passing.length === 0, `tools below passing tier: ${JSON.stringify(t.below_passing)}`);
    assert(t.hard_gate_defects && typeof t.hard_gate_defects === "object", "tdqs.hard_gate_defects missing");
  });

  // ── T645 (REQ-553): hard gates — missing, tautological, contradiction.
  await test("T645/REQ-553: missing, tautological, and annotation-contradicting definitions fail the hard gates", () => {
    assert(applyHardGates({ name: "no_desc", description: "  " }).some((f) => f.gate === "No Description"), "missing description not flagged");
    assert(applyHardGates({ name: "manage_note", description: "manage_note" }).some((f) => f.gate === "Tautological Description"), "tautology not flagged");
    const contradiction = applyHardGates({ name: "lookup_spell", description: "Creates a new record.", annotations: { readOnlyHint: true } });
    assert(contradiction.some((f) => f.gate === "Annotation Contradiction"), "annotation contradiction not flagged");
    assert(applyHardGates({ name: "manage_note", description: "Set a note. Use when: recording. Do NOT use when: manage_lore.", annotations: { readOnlyHint: false } }).length === 0, "conformant definition flagged");
  });

  // ── T646 (REQ-554): server tool-surface coherence proxies.
  await test("T646/REQ-554: coherence proxies report one naming convention and no undisambiguated overlap", async () => {
    const health = JSON.parse(await call(proc, "manage_session", { action: "health" }));
    const c = health.tdqs?.coherence;
    assert(c && typeof c === "object", "spec_health.tdqs.coherence missing (REQ-554)");
    for (const k of ["disambiguation", "namingConsistency", "toolCountAppropriateness", "completeness", "coherence"]) {
      assert(typeof c[k] === "number", `coherence.${k} missing`);
    }
    assert(c.namingConsistency === 5, `naming consistency ${c.namingConsistency}/5 — a host name deviates from verb_noun`);
    assert(Array.isArray(c.overlappingPairs) && c.overlappingPairs.length === 0, `overlapping pairs: ${JSON.stringify(c.overlappingPairs)}`);
  });

  // ── T647 (REQ-555): invocation cost and shadow candidates.
  await test("T647/REQ-555: shadow candidates derive from required-subtree invocation cost", () => {
    const cheap = { name: "get_stat", description: "Return a single stat for a player and season.", inputSchema: { type: "object", required: ["a", "b", "c", "d"], properties: { a: { type: "string" }, b: { type: "string" }, c: { type: "string" }, d: { type: "string" } } } };
    const expensive = { name: "query_panel", description: "Return a single stat for a player and season, with qualifiers.", inputSchema: { type: "object", required: ["sel"], properties: { sel: { type: "object", required: ["population", "window", "measure", "operation"], properties: { population: { type: "string" }, window: { type: "string" }, measure: { type: "object", required: ["kind"], properties: { kind: { type: "string" } } }, operation: { type: "string" } } } } } };
    assert(computeContextSignals(cheap).invocationCost === 4, "flat four-scalar cost should be 4");
    assert(computeContextSignals(expensive).invocationCost > computeContextSignals(cheap).invocationCost, "nested query should cost more");
    const risks = shadowCandidates([cheap, expensive]);
    assert(risks.length === 1 && risks[0].tool === "query_panel" && risks[0].cheaperSibling === "get_stat", `expected query_panel shadowed by get_stat, got ${JSON.stringify(risks)}`);
    const nonOverlap = shadowCandidates([cheap, { ...expensive, description: "Aggregate measure variance across windows." }]);
    assert(nonOverlap.length === 0, `non-overlapping pair should report no risk, got ${JSON.stringify(nonOverlap)}`);
  });

  // ── T151 (REQ-137a/REQ-137b): the DECISIONS.md gate-classification table
  // enumerates every registered tool exactly once with a valid gate, and the
  // badge-filtered `tools/list` output matches the table's Gate column.
  await test("T151/REQ-137a+REQ-137b: gate table covers the registry; tools/list is badge-filtered", async () => {
    const md = readFileSync(join(ROOT, "holonovel", "DECISIONS.md"), "utf-8");
    const start = md.indexOf("## Gate classification");
    assert(start !== -1, "DECISIONS.md is missing the '## Gate classification' section");
    const nextHeading = md.indexOf("\n### ", start + 1);
    const section = nextHeading === -1 ? md.slice(start) : md.slice(start, nextHeading);
    const rows = new Map<string, string>();
    for (const line of section.split("\n")) {
      const m = line.match(/^\|\s*`([^`]+)`\s*\|\s*([^|]+?)\s*\|/);
      if (m) rows.set(m[1], m[2].trim());
    }
    const valid = new Set(["un-gated", "GM-only", "Player"]);
    for (const [name, gate] of rows) {
      assert(valid.has(gate), `${name} has invalid gate '${gate}'`);
    }
    for (const t of tools) {
      assert(rows.has(t.name), `gate-classification table missing '${t.name}'`);
    }
    assert(rows.size === tools.length, `gate table has ${rows.size} rows for ${tools.length} tools`);
    assert(rows.get("set_badge") === "un-gated", "set_badge must be un-gated");
    const playerOnly = [...rows].filter(([, g]) => g === "Player").map(([n]) => n);
    const gmOnly = new Set([...rows].filter(([, g]) => g === "GM-only").map(([n]) => n));
    for (const n of playerOnly) assert(!gmOnly.has(n), `${n} classified as both Player-only and GM-only`);

    // REQ-137b — tools/list filtering. Badge state lives on the active Novel.
    await call(proc, "manage_novel", { action: "create", name: "t151-gate" });
    await call(proc, "set_badge", { badge: "player" });
    const playerNames = new Set(((await send(proc, { method: "tools/list", params: {} })).result?.tools ?? []).map((t: any) => t.name));
    for (const n of gmOnly) assert(!playerNames.has(n), `Player tools/list must exclude GM-only '${n}'`);
    assert(playerNames.has("set_badge"), "set_badge must appear in Player tools/list");
    await call(proc, "set_badge", { badge: "game_master" });
    const gmNames = new Set(((await send(proc, { method: "tools/list", params: {} })).result?.tools ?? []).map((t: any) => t.name));
    for (const n of gmOnly) assert(gmNames.has(n), `GM tools/list must include GM-only '${n}'`);
    assert(gmNames.size === tools.length, `GM tools/list has ${gmNames.size} tools, expected ${tools.length}`);
  });

  proc.kill("SIGKILL");

  // ── T512 ────────────────────────────────────────────────────────────
  const badLookup = {
    name: "bad_lookup", title: "",
    description: "Look up.",
    kind: "lookup", collection: "concepts",
    inputSchema: { type: "object", properties: { key: { type: "string" } } },
  };
  const goodRoll = {
    name: "good_roll", title: "Roll Check",
    description: "Roll a check. Use when: resolving a check. Do NOT use when: looking things up.",
    kind: "roll",
    inputSchema: { type: "object", properties: { dice: { type: "string", description: "Dice notation, e.g. 1d20." } } },
  };

  seedTQPackage([badLookup, goodRoll]);
  const proc2 = await boot();
  const list2 = await send(proc2, { method: "tools/list", params: { scope: "all" } });
  const names2 = new Set(((list2.result?.tools ?? []) as any[]).map((t: any) => t.name));
  const health = JSON.parse(await call(proc2, "manage_session", { action: "health" }));

  await test("T512/REQ-430: non-conformant ruleset tool flagged in spec_health without blocking registration", () => {
    assert(names2.has("tqtest_bad_lookup"), "bad_lookup tool not registered");
    assert(names2.has("tqtest_good_roll"), "good_roll tool not registered");
    const alerts: any[] = health.ruleset_package_alerts ?? [];
    const tq = alerts.filter((a) => String(a.reason ?? "").startsWith("[tool-quality]"));
    const bad = tq.find((a) => String(a.reason).includes("bad_lookup"));
    if (!bad) throw new Error(`bad_lookup not flagged: ${JSON.stringify(tq)}`);
    if (!String(bad.reason).includes("missing")) throw new Error(`flag lacks a defect: ${JSON.stringify(bad)}`);
    const counts = health.ruleset_tool_quality;
    if (!counts || counts.conformant !== 1 || counts.non_conformant !== 1) {
      throw new Error(`unexpected tool-quality counts: ${JSON.stringify(counts)}`);
    }
  });
  proc2.kill("SIGKILL");

  // Re-seed conformant (fix the bad tool) and assert the flag clears.
  seedTQPackage([
    { ...badLookup, title: "Bad Lookup Fixed", description: "Look up. Use when: needing an entry. Do NOT use when: rolling.", inputSchema: { type: "object", properties: { key: { type: "string", description: "The entry key." } } } },
    goodRoll,
  ]);
  const proc3 = await boot();
  const health3 = JSON.parse(await call(proc3, "manage_session", { action: "health" }));
  await test("T512/REQ-430: conformant rebuild clears the tool-quality flag", () => {
    const counts = health3.ruleset_tool_quality;
    if (!counts || counts.conformant !== 2 || counts.non_conformant !== 0) {
      throw new Error(`flag did not clear: ${JSON.stringify(counts)}`);
    }
    const tq = (health3.ruleset_package_alerts ?? []).filter((a: any) => String(a.reason ?? "").startsWith("[tool-quality]"));
    if (tq.length !== 0) throw new Error(`residual tool-quality alerts: ${JSON.stringify(tq)}`);
  });
  proc3.kill("SIGKILL");

  // ── T648 (REQ-430): build-time ruleset package conformance gate.
  await test("T648/REQ-430: the package gate refuses a non-conformant tools.json and passes a conformant one", () => {
    const gate = join(ROOT, "scripts", "check-ruleset-package.ts");
    const badDir = mkdtempSync(join(tmpdir(), "holonovel-ruleset-bad-"));
    const goodDir = mkdtempSync(join(tmpdir(), "holonovel-ruleset-good-"));
    writeFileSync(join(badDir, "tools.json"), JSON.stringify([
      { name: "lookup_spell", title: "Spells", description: "Look up a spell. Use when: casting. Do NOT use when: rolling.", kind: "lookup", inputSchema: { type: "object", properties: { key: { type: "string" } } } },
    ]));
    writeFileSync(join(goodDir, "tools.json"), JSON.stringify([
      { name: "lookup_spell", title: "Spells", description: "Look up a spell. Use when: casting. Do NOT use when: rolling.", kind: "lookup", inputSchema: { type: "object", properties: { key: { type: "string", description: "The spell key." } } } },
    ]));
    const bad = spawnSync("npx", ["tsx", gate, badDir], { cwd: ROOT, encoding: "utf-8" });
    assert(bad.status === 1, `non-conformant package should exit 1, got ${bad.status}: ${bad.stdout}${bad.stderr}`);
    assert(String(bad.stderr).includes("lookup_spell"), "gate did not name the offending tool");
    const good = spawnSync("npx", ["tsx", gate, goodDir], { cwd: ROOT, encoding: "utf-8" });
    assert(good.status === 0, `conformant package should exit 0, got ${good.status}: ${good.stdout}${good.stderr}`);
  });

  // ── T450 (REQ-388a–d) ───────────────────────────────────────────────
  const procT450 = await boot({ TTRPG_PACING_WINDOW: "6", TTRPG_NPC_AUTONOMY: "off", TTRPG_WORLD_REACTIVITY: "on" });
  const health450 = JSON.parse(await call(procT450, "manage_session", { action: "health" }));
  await test("T450/REQ-388: holodeck_config reports behavioral-config coverage", () => {
    const hc = health450.holodeck_config;
    assert(hc, "spec_health is missing holodeck_config");
    const specMd = readFileSync(join(ROOT, "holonovel.md"), "utf-8");
    const cfgStart = specMd.indexOf("### 7.6 Configuration surface");
    const cfgEnd = specMd.indexOf("### 7.7 State model", cfgStart);
    const behavioralCount = specMd.slice(cfgStart, cfgEnd).split("\n")
      .filter((l) => /^\|\s*`TTRPG_\w+`\s*\|/.test(l) && l.includes("Behavioral")).length;
    assert(hc.behavioral_total === behavioralCount, `behavioral_total ${hc.behavioral_total} != §7.6 count ${behavioralCount}`);
    assert(hc.behavioral_coupled === hc.behavioral_total, "behavioral_coupled must equal behavioral_total");
    assert(Array.isArray(hc.uncoupled) && hc.uncoupled.length === 0, "uncoupled must be empty");
    const paths = hc.natural_language_paths ?? {};
    for (const v of ["pacing_window", "npc_autonomy", "npc_mind", "world_reactivity", "story_beat_window", "campaign_memory_max_facts", "auto_record", "max_available_actions", "narration_validation", "state_gate"]) {
      assert(typeof paths[v] === "string" && paths[v].length > 0, `natural_language_paths missing ${v}`);
    }
    for (const v of ["belief_reconciliation", "belief_accept_threshold", "belief_decision_margin", "causal_validation", "causal_latent_transitions", "agent_autonomy", "climax_acceleration", "faction_autonomy_interval", "npc_urgency_threshold", "vow_suggestion_goal_min_chars"]) {
      assert(!(v in paths), `natural_language_paths must exclude mechanically-coupled ${v}`);
    }
    for (const v of ["max_npcs", "data_dir", "world_prominence", "novel_preview_chars"]) {
      assert(!(v in paths), `system/presentation ${v} must be absent`);
    }
  });
  procT450.kill("SIGKILL");

  // ── T510 ────────────────────────────────────────────────────────────
  const pkgJson = JSON.parse(readFileSync(join(ROOT, "holonovel", "package.json"), "utf-8"));
  const serverJson = JSON.parse(readFileSync(join(ROOT, "holonovel", "server.json"), "utf-8"));

  await test("T510/REQ-428: server.json version equals npm-canonical host version", () => {
    const canonical = npmCanonical(pkgJson.version);
    assert(serverJson.version === canonical, `server.json version ${serverJson.version} != canonical ${canonical}`);
    assert(serverJson.packages?.[0]?.version === canonical, `server.json package version mismatch`);
  });

  await test("T510/REQ-428: version-check gate passes against the committed manifest", () => {
    const r = spawnSync("npx", ["tsx", join(ROOT, "scripts", "version-check.ts")], {
      encoding: "utf-8",
      timeout: 30000,
    });
    assert(r.status === 0, `version-check exit ${r.status}: ${(r.stderr ?? "").slice(0, 500)}`);
  });

  harnessComplete();
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
