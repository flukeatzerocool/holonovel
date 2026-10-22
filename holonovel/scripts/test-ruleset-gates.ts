#!/usr/bin/env npx tsx
/**
 * test-ruleset-gates.ts — self-tests for the ruleset package gates. [gate]
 *
 * T652 (REQ-559): `check-ruleset-model` passes a conformant package and fails a
 * package whose info tool has no backing model entry, whose table keeps only an
 * auto-generated key, or whose roll tool's defaultDice contradicts its
 * description.
 * T654 (REQ-561): two emissions of identical package parts with a fixed
 * timestamp are byte-identical and yield the same content hash.
 *
 * Exit codes: 0 = pass, 1 = one or more assertions failed.
 */
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { emitPackage } from "../../scripts/lib/ruleset-package.mjs";
import { validateToolSchema, CORE_TOOL_GROUPS, CORE_TOOL_PHASES } from "../src/rulesets.js";
import { isColophonHeading } from "../../scripts/lib/front-matter.js";
import { installHarnessGuard, harnessComplete } from "./lib/harness-guard.js";
installHarnessGuard();

const GATE = join(import.meta.dirname, "..", "..", "scripts", "check-ruleset-model.ts");
let passed = 0, failed = 0;
function test(name: string, fn: () => void): void {
  try { fn(); passed++; console.log(`  PASS ${name}`); }
  catch (e: any) { failed++; console.error(`  FAIL ${name}: ${e.message}`); }
}
function assert(cond: boolean, msg: string): void { if (!cond) throw new Error(msg); }

function runGate(dir: string): { code: number; out: string } {
  const r = spawnSync("npx", ["tsx", GATE, dir], { encoding: "utf-8" });
  return { code: r.status ?? -1, out: (r.stdout ?? "") + (r.stderr ?? "") };
}

const TMP = mkdtempSync(join(tmpdir(), "holonovel-ruleset-gates-"));

function goodParts() {
  return {
    slug: "fixturegate", name: "Gate Fixture", hostVersion: "0.0.0", packageFormat: "test",
    index: [{ id: "thing-1", anchor: "Thing", source_file: "f.md", content: "x", confidence: "HIGH" }],
    model: {
      things: { "thing-1": { name: "Thing", content: "x" } },
      info: { core_mechanic: { name: "Core", content: "Roll d100." } },
      tables: {}, generation_tables: { "gen-1": { name: "Random Hit Location", rows: [["01", "Head"]] } },
      concepts: {}, resolution: {}, roles: {},
    },
    tools: [
      { name: "core_mechanic", title: "Core", description: "Core mechanic. Use when: asked. Do NOT use when: rolling — use roll_check.", kind: "info", group: "table", phases: ["none", "setup", "scene", "closed"], inputSchema: { type: "object", properties: {} } },
      { name: "roll_check", title: "Roll", description: "Roll a d100 check. Use when: checking. Do NOT use when: info — use core_mechanic.", kind: "roll", group: "resolve", phases: ["scene", "combat", "downtime"], defaultDice: "1d100", inputSchema: { type: "object", properties: { modifier: { type: "number", description: "mod" } }, required: ["modifier"] } },
      { name: "lookup_thing", title: "Thing", description: "Look up a thing. Use when: resolving. Do NOT use when: unknown — use core_mechanic.", kind: "lookup", group: "lookup", phases: ["none", "setup", "scene", "combat", "downtime", "closed"], collection: "things", inputSchema: { type: "object", properties: { key: { type: "string", description: "k" } }, required: ["key"] } },
    ],
  };
}

test("T652/REQ-559: conformant package passes the model gate", () => {
  const dir = join(TMP, "good");
  emitPackage(dir, goodParts());
  const r = runGate(dir);
  assert(r.code === 0, `expected exit 0, got ${r.code}: ${r.out}`);
});

test("T652/REQ-559: info tool with no backing entry fails", () => {
  const dir = join(TMP, "bad-info");
  const p = goodParts();
  (p.tools as any[]).push({ name: "orphan_info", title: "Orphan", description: "Orphan info. Use when: test. Do NOT use when: real — use core_mechanic.", kind: "info", inputSchema: { type: "object", properties: {} } });
  emitPackage(dir, p);
  const r = runGate(dir);
  assert(r.code === 1, `expected exit 1, got ${r.code}`);
  assert(r.out.includes("orphan_info") && r.out.includes("no backing model entry"), `finding not reported: ${r.out}`);
});

test("T652/REQ-559: generated table key with no name fails", () => {
  const dir = join(TMP, "bad-table");
  const p = goodParts();
  (p.model.generation_tables as any)["file-md-headers-8"] = { headers: ["a", "b"], rows: [["1", "x"]] };
  emitPackage(dir, p);
  const r = runGate(dir);
  assert(r.code === 1, `expected exit 1, got ${r.code}`);
  assert(r.out.includes("no human 'name'"), `finding not reported: ${r.out}`);
});

test("T652/REQ-559: roll defaultDice contradicting the description fails", () => {
  const dir = join(TMP, "bad-dice");
  const p = goodParts();
  (p.tools as any[])[1].defaultDice = "1d20";
  emitPackage(dir, p);
  const r = runGate(dir);
  assert(r.code === 1, `expected exit 1, got ${r.code}`);
  assert(r.out.includes("does not match"), `finding not reported: ${r.out}`);
});

test("T655/REQ-562: colophon headings are excluded, ruleset headings kept", () => {
  for (const h of ["Credits", "Senior Editor: Alex Marciniszyn", "Ninth Printing — October 1992", "ISBN 0-916211-00-0", "Chief Artist: Kevin Long", "Typography: Maryann Siembieda", "Acknowledgments"]) {
    assert(isColophonHeading(h), `expected colophon: ${h}`);
  }
  for (const h of ["Combat", "Mecha Damage", "Pilot Veritech Fighter", "Random Hit Location", "Experience Points"]) {
    assert(!isColophonHeading(h), `expected ruleset heading: ${h}`);
  }
});

test("T654/REQ-561: two emissions of identical parts are byte-identical", () => {
  const a = join(TMP, "emit-a"), b = join(TMP, "emit-b");
  const parts = goodParts();
  const ha = emitPackage(a, parts);
  const hb = emitPackage(b, parts);
  assert(ha === hb, `content hash differs: ${ha} vs ${hb}`);
  for (const f of ["manifest.json", "index.json", "model.json", "tools.json", "resources.json", "prompts.json"]) {
    const ca = readFileSync(join(a, f), "utf-8"), cb = readFileSync(join(b, f), "utf-8");
    assert(ca === cb, `${f} differs between emissions`);
  }
});

test("T671/REQ-578: generated tool with no surface group fails", () => {
  const schema: any = {
    name: "orphan_tool", title: "Orphan", kind: "lookup",
    description: "Look up. Use when: looking. Do NOT use when: not — use core_mechanic.",
    inputSchema: { type: "object", properties: { key: { type: "string", description: "k" } } },
  };
  const defects = validateToolSchema(schema);
  assert(defects.includes("missing surface group"), `missing-group not reported: ${defects.join("; ")}`);
  assert(defects.includes("missing surface phases"), `missing-phases not reported: ${defects.join("; ")}`);
});

test("T671/REQ-578: unknown surface group fails", () => {
  const schema: any = {
    name: "bad_group", title: "Bad", kind: "lookup", group: "adventure",
    phases: ["scene"],
    description: "Look up. Use when: looking. Do NOT use when: not — use core_mechanic.",
    inputSchema: { type: "object", properties: { key: { type: "string", description: "k" } } },
  };
  assert(validateToolSchema(schema).some((d) => d.includes("unknown surface group")), "unknown-group not reported");
});

test("T671/REQ-578: conformant generated tool passes the surface check", () => {
  const schema: any = {
    name: "lookup_thing", title: "Thing", kind: "lookup", group: "lookup",
    phases: ["scene"], collection: "things",
    description: "Look up a thing. Use when: resolving. Do NOT use when: unknown — use core_mechanic.",
    inputSchema: { type: "object", properties: { key: { type: "string", description: "k" } } },
  };
  assert(validateToolSchema(schema).length === 0, validateToolSchema(schema).join("; "));
});

// ── T660 (REQ-567) — tool-surface registry fixture gate ──────────────
const SURFACE_GATE = join(import.meta.dirname, "..", "..", "scripts", "check-tool-surface.ts");
const SURFACE_TAXONOMY = {
  groups: [...CORE_TOOL_GROUPS],
  phases: [...CORE_TOOL_PHASES],
  mutation_classes: ["read", "write", "destructive", "idempotent"],
};
function surfaceDeclaration(group: string, entry = false): any {
  return { group, phases: ["scene"], entry, mutation_class: "read", ruleset: null, preconditions: [], successors: [], edges: [] };
}
function surfaceFixture(): { defs: any; registry: any } {
  const tools: any[] = [];
  const actions: Record<string, any> = {};
  for (const group of CORE_TOOL_GROUPS) {
    for (const suffix of ["a", "b"]) {
      const name = `${group}_${suffix}`;
      tools.push({ name, action_enum: ["run"] });
      actions[`${name}.run`] = surfaceDeclaration(group, suffix === "a");
    }
  }
  return { defs: { tools, tools_list_bytes: 400 }, registry: { schema_version: 1, taxonomy: SURFACE_TAXONOMY, actions } };
}
function runSurfaceGate(name: string, defs: any, registry: any): { code: number; out: string } {
  const defsPath = join(TMP, `${name}-defs.json`);
  const registryPath = join(TMP, `${name}-registry.json`);
  writeFileSync(defsPath, JSON.stringify(defs));
  writeFileSync(registryPath, JSON.stringify(registry));
  const r = spawnSync("npx", ["tsx", SURFACE_GATE, "--defs", defsPath, "--registry", registryPath], { encoding: "utf-8" });
  return { code: r.status ?? -1, out: (r.stdout ?? "") + (r.stderr ?? "") };
}

test("T660/REQ-567: a conformant fixture registry passes check-tool-surface", () => {
  const { defs, registry } = surfaceFixture();
  const r = runSurfaceGate("conformant", defs, registry);
  assert(r.code === 0, `expected exit 0, got ${r.code}: ${r.out}`);
  assert(r.out.includes("check-tool-surface: PASS"), `unexpected output: ${r.out}`);
});

test("T660/REQ-567: an unregistered action fails naming the action", () => {
  const { defs, registry } = surfaceFixture();
  delete registry.actions["table_a.run"];
  const r = runSurfaceGate("ungrouped", defs, registry);
  assert(r.code === 1, `expected exit 1, got ${r.code}: ${r.out}`);
  assert(r.out.includes("unregistered action: table_a.run"), `missing unregistered-action defect: ${r.out}`);
});

test("T660/REQ-567: a duplicated entry declaration fails naming the group", () => {
  const { defs, registry } = surfaceFixture();
  registry.actions["lookup_b.run"].entry = true;
  const r = runSurfaceGate("duplicate", defs, registry);
  assert(r.code === 1, `expected exit 1, got ${r.code}: ${r.out}`);
  assert(r.out.includes("group lookup: expected exactly one entry action"), `missing duplicate-entry defect: ${r.out}`);
});

test("T660/REQ-567: an unknown surface term fails naming the term", () => {
  const { defs, registry } = surfaceFixture();
  registry.actions["resolve_a.run"].group = "adventure";
  const r = runSurfaceGate("unknown", defs, registry);
  assert(r.code === 1, `expected exit 1, got ${r.code}: ${r.out}`);
  assert(r.out.includes("unknown group adventure"), `missing unknown-group defect: ${r.out}`);
});

test("T681/REQ-582: an action grouped against its recorded user goal fails", () => {
  const parts: any = goodParts();
  parts.tools[2] = { ...parts.tools[2], user_goal: "resolve", group: "lookup" };
  const dir = join(TMP, "goal-mismatch");
  emitPackage(dir, parts);
  const r = runGate(dir);
  assert(r.code === 1, `expected exit 1, got ${r.code}: ${r.out}`);
  assert(r.out.includes("records user goal 'resolve'"), `missing goal mismatch: ${r.out}`);
});

test("T684/REQ-584: a description that omits its recorded goal fails", () => {
  const parts: any = goodParts();
  parts.tools[2] = { ...parts.tools[2], user_goal: "lookup", description: "Look up a thing. Use when: resolving. Do NOT use when: unknown — use core_mechanic." };
  const dir = join(TMP, "goal-text");
  emitPackage(dir, parts);
  const r = runGate(dir);
  assert(r.code === 1, `expected exit 1, got ${r.code}: ${r.out}`);
  assert(r.out.includes("does not name its recorded user goal 'lookup'"), `missing routing-text defect: ${r.out}`);
});

test("T681/REQ-582: a goal-matched action with routing text passes", () => {
  const parts: any = goodParts();
  parts.tools[2] = { ...parts.tools[2], user_goal: "lookup", group: "lookup", description: "Look up a thing (lookup). Use when: resolving. Do NOT use when: unknown — use core_mechanic." };
  const dir = join(TMP, "goal-good");
  emitPackage(dir, parts);
  const r = runGate(dir);
  assert(r.code === 0, `expected exit 0, got ${r.code}: ${r.out}`);
});

test("T685/REQ-585: a converted table marked verified passes", () => {
  const parts: any = goodParts();
  parts.model.generation_tables["gen-1"].structure_verified = true;
  const dir = join(TMP, "convert-verified");
  emitPackage(dir, { ...parts, sourceWorkflow: "convert" });
  const r = runGate(dir);
  assert(r.code === 0, `expected exit 0, got ${r.code}: ${r.out}`);
});

test("T685/REQ-585: a converted table excluded with a reason passes", () => {
  const parts: any = goodParts();
  parts.model.generation_tables["gen-1"].structure_excluded = "merged column in source table";
  const dir = join(TMP, "convert-excluded");
  emitPackage(dir, { ...parts, sourceWorkflow: "convert" });
  const r = runGate(dir);
  assert(r.code === 0, `expected exit 0, got ${r.code}: ${r.out}`);
});

test("T685/REQ-585: an unmarked converted table fails naming it", () => {
  const parts: any = goodParts();
  const dir = join(TMP, "convert-unmarked");
  emitPackage(dir, { ...parts, sourceWorkflow: "convert" });
  const r = runGate(dir);
  assert(r.code === 1, `expected exit 1, got ${r.code}: ${r.out}`);
  assert(r.out.includes("generation_tables 'gen-1' has no structure verification"), `missing converted-table defect: ${r.out}`);
});

test("T689/REQ-563+REQ-578: emitter declares surfaces and is deterministic at a fixed timestamp", () => {
  const base = join(TMP, "swse-base");
  emitPackage(base, goodParts());
  // Strip surface declarations so the emitter's injection is observable.
  const toolsPath = join(base, "tools.json");
  const stripped = JSON.parse(readFileSync(toolsPath, "utf-8"));
  for (const t of stripped) { delete t.group; delete t.phases; }
  writeFileSync(toolsPath, JSON.stringify(stripped, null, 2) + "\n");

  const emitter = join(import.meta.dirname, "..", "..", "scripts", "ruleset-builds", "swse", "build-package.mjs");
  const env = { ...process.env, HOLONOVEL_BUILD_TIMESTAMP: "2020-01-01T00:00:00.000Z" };
  const outs = [join(TMP, "swse-emit-a"), join(TMP, "swse-emit-b")];
  for (const out of outs) {
    const r = spawnSync("node", [emitter, "--baseline", base, "--out", out, "--no-backup"], { encoding: "utf-8", env });
    assert(r.status === 0, `emitter failed: ${(r.stderr ?? "") + (r.stdout ?? "")}`);
  }
  const emitted = JSON.parse(readFileSync(join(outs[0], "tools.json"), "utf-8"));
  assert(emitted.every((t: any) => t.group && Array.isArray(t.phases) && t.phases.length > 0), "emitter did not declare surfaces");
  for (const f of ["manifest.json", "index.json", "model.json", "tools.json", "resources.json", "prompts.json"]) {
    assert(readFileSync(join(outs[0], f), "utf-8") === readFileSync(join(outs[1], f), "utf-8"), `${f} differs between emissions`);
  }
});

console.log(`\n${passed} passed, ${failed} failed`);
rmSync(TMP, { recursive: true, force: true });
if (failed === 0) harnessComplete();
process.exit(failed > 0 ? 1 : 0);
