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
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { emitPackage } from "../../scripts/lib/ruleset-package.mjs";
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
      { name: "core_mechanic", title: "Core", description: "Core mechanic. Use when: asked. Do NOT use when: rolling — use roll_check.", kind: "info", inputSchema: { type: "object", properties: {} } },
      { name: "roll_check", title: "Roll", description: "Roll a d100 check. Use when: checking. Do NOT use when: info — use core_mechanic.", kind: "roll", defaultDice: "1d100", inputSchema: { type: "object", properties: { modifier: { type: "number", description: "mod" } }, required: ["modifier"] } },
      { name: "lookup_thing", title: "Thing", description: "Look up a thing. Use when: resolving. Do NOT use when: unknown — use core_mechanic.", kind: "lookup", collection: "things", inputSchema: { type: "object", properties: { key: { type: "string", description: "k" } }, required: ["key"] } },
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

console.log(`\n${passed} passed, ${failed} failed`);
rmSync(TMP, { recursive: true, force: true });
if (failed === 0) harnessComplete();
process.exit(failed > 0 ? 1 : 0);
