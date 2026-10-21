#!/usr/bin/env node
// Ruleset no-Novel access harness (REQ-558). Exercises T651 [gate]: an installed
// package serves every derived tool — search, lookup, roll, table, info — with no
// active Novel and no eager-hydration env, and `spec_health` reports the installed
// packages. Also asserts info tools return [NOT_FOUND] (not their own description)
// when no model entry backs them, name/alias resolution, and declared defaultDice.
//
// Uses a self-contained synthetic package fixture, so the reference server's test
// surface carries no ruleset-specific content.
//
// Exit codes: 0 = pass, 1 = one or more assertions failed.

import { spawn, ChildProcess } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { computeContentHash } from "../src/rulesets.js";
import { PACKAGE_FORMAT } from "../src/generated/contract-fingerprints.js";
import { installHarnessGuard, harnessComplete } from "./lib/harness-guard.js";
installHarnessGuard();

const SERVER_SCRIPT = process.env.HOLONOVEL_SERVER ?? join(import.meta.dirname!, "..", "src", "index.ts");
const DATA_DIR = mkdtempSync(join(tmpdir(), "holonovel-ruleset-nonovel-"));
const SLUG = "fixture558";

let passed = 0;
let failed = 0;
async function test(name: string, fn: () => void | Promise<void>): Promise<void> {
  try { await fn(); passed++; console.log(`  PASS ${name}`); }
  catch (e: any) { failed++; console.error(`  FAIL ${name}: ${e.message}`); }
}
function assertContains(hay: string, needle: string, ctx = ""): void {
  if (!hay.toLowerCase().includes(needle.toLowerCase())) throw new Error(`${ctx} expected to contain "${needle}"`);
}
function assertNotContains(hay: string, needle: string, ctx = ""): void {
  if (hay.toLowerCase().includes(needle.toLowerCase())) throw new Error(`${ctx} expected NOT to contain "${needle}"`);
}

// ── Synthetic package fixture (REQ-389 six-file format) ───────────────
function installFixture(): void {
  const index = [
    { id: "the-thing-2", anchor: "The Thing", source_file: "fixture.md", content: "A thing.", category: "concepts", confidence: "HIGH" },
    { id: "random-hit-location", anchor: "Random Hit Location", source_file: "fixture.md", content: "Roll d100.", category: "tables", confidence: "HIGH" },
  ];
  const model = {
    concepts: {},
    things: { "the-thing-2": { name: "Big Thing", aliases: ["Huge Thing"], content: "A big thing.", source_file: "fixture.md" } },
    info: { core_mechanic: { name: "Fixture resolution", content: "Roll a percentile die and compare to the skill.", source_file: "fixture.md", anchor: "Fixture resolution" } },
    generation_tables: { "gen-hitloc": { name: "Random Hit Location", aliases: ["random hit location", "hit location"], headers: ["d100", "Location"], rows: [["01-50", "Head"], ["51-00", "Body"]], type: "generation" } },
    tables: {},
    resolution: {},
    roles: {},
  };
  const tools = [
    { name: "search_rules", title: "Search Rules", description: "Search the fixture. Use when: term unknown. Do NOT use when: type known — use lookup_thing.", kind: "search", inputSchema: { type: "object", properties: { query: { type: "string", description: "Term." } }, required: ["query"] } },
    { name: "lookup_thing", title: "Look Up Thing", description: "Look up a thing by name. Use when: resolving a thing. Do NOT use when: unknown — use search_rules.", kind: "lookup", collection: "things", inputSchema: { type: "object", properties: { key: { type: "string", description: "Thing name." } }, required: ["key"] } },
    { name: "roll_check", title: "Roll Check", description: "Roll a fixture check. Use when: attempting a check. Do NOT use when: rolling damage — use roll_dice.", kind: "roll", defaultDice: "1d100", inputSchema: { type: "object", properties: { modifier: { type: "number", description: "Skill percentage." } }, required: ["modifier"] } },
    { name: "roll_on_table", title: "Roll on Table", description: "Roll on a fixture table. Use when: resolving a table. Do NOT use when: looking up a thing — use lookup_thing.", kind: "table", collection: "tables", inputSchema: { type: "object", properties: { table: { type: "string", description: "Table name." } }, required: ["table"] } },
    { name: "core_mechanic", title: "Core Mechanic", description: "Return the fixture core mechanic. Use when: asked how a check resolves. Do NOT use when: rolling — use roll_check.", kind: "info", inputSchema: { type: "object", properties: {} } },
    { name: "orphan_info", title: "Orphan Info", description: "An info tool with no backing model entry. Use when: testing. Do NOT use when: real use — use core_mechanic.", kind: "info", inputSchema: { type: "object", properties: {} } },
  ];
  const resources: any[] = [];
  const prompts: any[] = [];
  const manifest = {
    slug: SLUG,
    name: "No-Novel Fixture (REQ-558)",
    host_version: "0.0.0",
    package_format: PACKAGE_FORMAT,
    content_hash: computeContentHash(index, model, tools, resources, prompts),
    built_at: new Date().toISOString(),
    counts: {},
  };
  const dir = join(DATA_DIR, "rulesets", SLUG);
  mkdirSync(dir, { recursive: true });
  for (const [name, obj] of Object.entries({ "manifest.json": manifest, "index.json": index, "model.json": model, "tools.json": tools, "resources.json": resources, "prompts.json": prompts })) {
    writeFileSync(join(dir, name), JSON.stringify(obj, null, 2) + "\n");
  }
}

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
      try {
        const msg = JSON.parse(line);
        if (msg.id !== undefined && pending.has(msg.id)) { pending.get(msg.id)!(msg); pending.delete(msg.id); }
      } catch { /* non-JSON */ }
    }
  });
}
function bootEnv(): NodeJS.ProcessEnv {
  const env = { ...process.env, TTRPG_DATA_DIR: DATA_DIR };
  // REQ-558 — no Novel, no eager-hydration env: tools must serve on demand.
  delete env.TTRPG_NOVEL;
  delete env.TTRPG_RULESETS;
  return env;
}
async function boot(): Promise<ChildProcess> {
  const proc = spawn("npx", ["tsx", SERVER_SCRIPT], { env: bootEnv(), stdio: ["pipe", "pipe", "pipe"] });
  attach(proc);
  await send(proc, { method: "initialize", params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "ruleset-nonovel", version: "1.0.0" } } });
  proc.stdin!.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n");
  await sleep(250);
  return proc;
}
async function call(proc: ChildProcess, name: string, args: Record<string, unknown> = {}): Promise<string> {
  const resp = await send(proc, { method: "tools/call", params: { name, arguments: args } });
  const content = resp.result?.content ?? [];
  return content.map((c: any) => c?.text ?? "").join("\n");
}
async function listTools(proc: ChildProcess): Promise<string[]> {
  const resp = await send(proc, { method: "tools/list", params: {} });
  return ((resp.result?.tools ?? []) as any[]).map((t) => t.name);
}
function kill(proc: ChildProcess): Promise<void> {
  return new Promise((resolve) => { proc.on("exit", () => resolve()); proc.kill(); });
}
function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

async function main() {
  console.log("=== Ruleset no-Novel access (REQ-558 / T651) ===\n");
  installFixture();

  await test("T651/REQ-558: tools serve with no active Novel", async () => {
    const p = await boot();
    const out = await call(p, `${SLUG}_lookup_thing`, { key: "the-thing-2" });
    assertContains(out, "big thing", "lookup by exact key");
    assertNotContains(out, "not activated", "no hydration gate");
    await kill(p);
  });

  await test("T651/REQ-558a: info returns model content, not its description", async () => {
    const p = await boot();
    const out = await call(p, `${SLUG}_core_mechanic`, {});
    assertContains(out, "percentile die", "resolution text");
    assertNotContains(out, "Return the fixture core mechanic", "must not echo tool description");
    await kill(p);
  });

  await test("T651/REQ-558a: info with no backing entry returns [NOT_FOUND]", async () => {
    const p = await boot();
    const out = await call(p, `${SLUG}_orphan_info`, {});
    assertContains(out, "NOT_FOUND", "honest not-found");
    assertNotContains(out, "An info tool with no backing model entry", "must not echo tool description");
    await kill(p);
  });

  await test("T651/REQ-558b: lookups resolve by name and alias", async () => {
    const p = await boot();
    const byName = await call(p, `${SLUG}_lookup_thing`, { key: "Big Thing" });
    assertContains(byName, "A big thing", "resolved by canonical name");
    const byAlias = await call(p, `${SLUG}_lookup_thing`, { key: "Huge Thing" });
    assertContains(byAlias, "A big thing", "resolved by alias");
    await kill(p);
  });

  await test("T651/REQ-558c: declared defaultDice is honored", async () => {
    const p = await boot();
    const out = await call(p, `${SLUG}_roll_check`, { modifier: 55 });
    assertContains(out, "1d100", "declared percentile die");
    assertNotContains(out, "1d20", "must not fall back to the host default");
    await kill(p);
  });

  await test("T651/REQ-558b: table rolls resolve by name", async () => {
    const p = await boot();
    const out = await call(p, `${SLUG}_roll_on_table`, { table: "random hit location" });
    assertNotContains(out, "[ERROR] [NOT_FOUND]", "table resolved by name");
    await kill(p);
  });

  await test("T651/REQ-558: manage_ruleset search by slug works with no Novel", async () => {
    const p = await boot();
    const out = await call(p, "manage_ruleset", { action: "search", slug: SLUG, query: "thing" });
    assertContains(out, "thing", "slug-scoped search returns entries");
    await kill(p);
  });

  await test("T651/REQ-558d: spec_health reports installed packages and confidence", async () => {
    const p = await boot();
    const out = await call(p, "manage_diagnostics", { action: "health" });
    assertContains(out, SLUG, "installed package reported");
    assertNotContains(out, "N/A — ruleset-free", "confidence reflects installed packages");
    await kill(p);
  });

  await test("T653/REQ-560: every declared tool replays without [NOT_FOUND]", async () => {
    const p = await boot();
    const names = await listTools(p);
    for (const t of [`${SLUG}_search_rules`, `${SLUG}_lookup_thing`, `${SLUG}_roll_check`, `${SLUG}_roll_on_table`, `${SLUG}_core_mechanic`]) {
      assertContains(names.join(","), t, `tool ${t} registered`);
    }
    // Canonical argument per tool kind: first lookup key, first table name, info, roll.
    const calls: Array<[string, Record<string, unknown>]> = [
      [`${SLUG}_search_rules`, { query: "thing" }],
      [`${SLUG}_lookup_thing`, { key: "the-thing-2" }],
      [`${SLUG}_roll_check`, { modifier: 50 }],
      [`${SLUG}_roll_on_table`, { table: "random hit location" }],
      [`${SLUG}_core_mechanic`, {}],
    ];
    for (const [name, args] of calls) {
      const out = await call(p, name, args);
      assertNotContains(out, "[ERROR] [NOT_FOUND]", `replay ${name} answered`);
      assertNotContains(out, "[ERROR]", `replay ${name} did not error`);
    }
    await kill(p);
  });

  console.log(`\n${passed} passed, ${failed} failed`);
  rmSync(DATA_DIR, { recursive: true, force: true });
  if (failed === 0) harnessComplete();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
