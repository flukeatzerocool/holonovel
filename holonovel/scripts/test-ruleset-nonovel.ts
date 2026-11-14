#!/usr/bin/env node
// Ruleset no-Novel access harness (REQ-558). Exercises T651 [gate]: an installed
// package serves every derived tool — search, lookup, roll, table, info — with no
// active Novel and no eager-hydration env, and `spec_health` reports the installed
// packages. Also asserts info tools return [NOT_FOUND] (not their own description)
// when no model entry backs them, name/alias resolution, and declared defaultDice.
//
// Uses a self-contained synthetic package fixture, so the reference server's test
// surface carries no ruleset-specific content. With `--package <dir>`, replays
// that package instead (REQ-560 reuse by the package gates): lists its declared
// tools, calls each once with an argument derived from its model, and asserts no
// [NOT_FOUND].
//
// Exit codes: 0 = pass, 1 = one or more assertions failed.

import { spawn, ChildProcess } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, cpSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { computeContentHash } from "../src/rulesets.js";
import { PACKAGE_FORMAT } from "../src/generated/contract-fingerprints.js";
import { installHarnessGuard, harnessComplete } from "./lib/harness-guard.js";
installHarnessGuard();

const SERVER_SCRIPT = process.env.HOLONOVEL_SERVER ?? join(import.meta.dirname!, "..", "src", "index.ts");
const DATA_DIR = mkdtempSync(join(tmpdir(), "holonovel-ruleset-nonovel-"));
const DEFAULT_SLUG = "fixture558";

// REQ-560 — the package gates replay an emitted package through this harness.
const pkgFlag = process.argv.indexOf("--package");
const EXTERNAL_DIR = pkgFlag >= 0 ? process.argv[pkgFlag + 1] : null;
if (pkgFlag >= 0 && (!EXTERNAL_DIR || !existsSync(join(EXTERNAL_DIR, "manifest.json")))) {
  console.error(`--package requires a directory containing manifest.json (got: ${EXTERNAL_DIR ?? "<none>"})`);
  process.exit(2);
}
const SLUG = EXTERNAL_DIR
  ? JSON.parse(readFileSync(join(EXTERNAL_DIR, "manifest.json"), "utf-8")).slug
  : DEFAULT_SLUG;

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
// `slug` lets one run install a second package (the legacy variant below). A
// package's tools are registered as `${slug}_${tool.name}`
// (src/index.ts:2462) and resolved by `startsWith(slug + "_")`
// (src/index.ts:2071-2073), so the install slugs must not be `_`-prefix
// related — and `isSafeSlug` (src/rulesets.ts:688) forbids `_` in a slug, so
// the constraint is structural. Keep the pair distinct anyway.
const LEGACY_SLUG = `${DEFAULT_SLUG}legacy`;
function installFixture(opts: { slug?: string; legacy?: boolean } = {}): string {
  const slug = opts.slug ?? SLUG;
  // REQ-210d — three index entries carry the model's declared `badge_scope`.
  // `legacy` strips the field and marks the GM entry by `category` only, the
  // shape a package built before REQ-210d ships.
  const scoped = !opts.legacy;
  const index: any[] = [
    { id: "the-thing-2", anchor: "The Thing", source_file: "fixture.md", content: "A thing.", category: "concepts", confidence: "HIGH" },
    { id: "random-hit-location", anchor: "Random Hit Location", source_file: "fixture.md", content: "Roll d100.", category: "tables", confidence: "HIGH" },
    { id: "shared-lore", anchor: "Shared Lore", source_file: "fixture.md", content: "A shared thing about the thing.", category: "concepts", confidence: "HIGH", badge_scope: "shared" },
    { id: "gm-secret-thing", anchor: "GM Secret Thing", source_file: "fixture.md", content: "hidden gm thing", category: scoped ? "concepts" : "gm", confidence: "HIGH" },
    { id: "core_mechanic", anchor: "Fixture resolution", source_file: "fixture.md", content: "percentile die resolution", category: scoped ? "concepts" : "gm", confidence: "HIGH" },
  ];
  if (scoped) {
    index[3].badge_scope = "game_master";
    index[4].badge_scope = "game_master";
  }
  const model = {
    concepts: {},
    things: { "the-thing-2": { name: "Big Thing", aliases: ["Huge Thing"], content: "A big thing.", source_file: "fixture.md" }, "gm-secret-thing": { name: "GM Secret Thing", aliases: ["Forbidden Alias"], content: "hidden gm thing", badge_scope: "game_master", source_file: "fixture.md" } },
    info: { core_mechanic: { name: "Fixture resolution", content: "Roll a percentile die and compare to the skill.", source_file: "fixture.md", anchor: "Fixture resolution", badge_scope: "game_master" } },
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
    slug,
    name: opts.legacy ? "No-Novel Legacy Fixture (REQ-210d)" : "No-Novel Fixture (REQ-558)",
    host_version: "0.0.0",
    package_format: PACKAGE_FORMAT,
    content_hash: computeContentHash(index, model, tools, resources, prompts),
    built_at: new Date().toISOString(),
    counts: {},
  };
  const dir = join(DATA_DIR, "rulesets", slug);
  mkdirSync(dir, { recursive: true });
  for (const [name, obj] of Object.entries({ "manifest.json": manifest, "index.json": index, "model.json": model, "tools.json": tools, "resources.json": resources, "prompts.json": prompts })) {
    writeFileSync(join(dir, name), JSON.stringify(obj, null, 2) + "\n");
  }
  return slug;
}

// REQ-560 — replay an emitted package supplied with `--package`.
function installExternal(dir: string): { tools: any[]; index: any[]; model: any } {
  const target = join(DATA_DIR, "rulesets", SLUG);
  mkdirSync(target, { recursive: true });
  for (const file of ["manifest.json", "index.json", "model.json", "tools.json", "resources.json", "prompts.json"]) {
    if (existsSync(join(dir, file))) cpSync(join(dir, file), join(target, file));
  }
  return {
    tools: JSON.parse(readFileSync(join(dir, "tools.json"), "utf-8")),
    index: JSON.parse(readFileSync(join(dir, "index.json"), "utf-8")),
    model: JSON.parse(readFileSync(join(dir, "model.json"), "utf-8")),
  };
}

// A canonical argument per tool kind, derived from the package's own parts.
function replayArgs(tool: any, index: any[], model: any): Record<string, unknown> {
  const firstKey = (obj: any): string | undefined => (obj && typeof obj === "object" ? Object.keys(obj)[0] : undefined);
  const required: string[] = Array.isArray(tool?.inputSchema?.required) ? tool.inputSchema.required : [];
  const valueFor = (prop: string): unknown => {
    const schema = tool?.inputSchema?.properties?.[prop] ?? {};
    if (schema.type === "number" || schema.type === "integer") return 50;
    if (schema.type === "boolean") return false;
    return firstKey(model?.[tool?.collection])
      ?? firstKey(model?.generation_tables)
      ?? firstKey(model?.tables)
      ?? index?.[0]?.id
      ?? index?.[0]?.anchor
      ?? "test";
  };
  const args: Record<string, unknown> = {};
  if (tool?.kind === "search") {
    args[required[0] ?? "query"] = index?.[0]?.anchor ?? "test";
  } else if (tool?.kind === "table") {
    args[required[0] ?? "table"] = firstKey(model?.generation_tables) ?? firstKey(model?.tables) ?? "test";
  } else if (tool?.kind === "roll" || tool?.kind === "info") {
    for (const prop of required) args[prop] = valueFor(prop);
  } else {
    for (const prop of required) args[prop] = valueFor(prop);
  }
  return args;
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
  if (resp.error) throw new Error(`${name}: ${resp.error.message ?? JSON.stringify(resp.error)}`);
  const content = resp.result?.content ?? [];
  return content.map((c: any) => c?.text ?? "").join("\n");
}
function kill(proc: ChildProcess): Promise<void> {
  return new Promise((resolve) => { proc.on("exit", () => resolve()); proc.kill(); });
}
function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

async function main() {
  if (EXTERNAL_DIR) {
    console.log(`=== Ruleset replay for an emitted package (REQ-560) — ${SLUG} ===\n`);
    const parts = installExternal(EXTERNAL_DIR);
    await test(`T653/REQ-560: every declared tool replays without [NOT_FOUND] (${SLUG})`, async () => {
      const p = await boot();
      const listed = await send(p, { method: "tools/list", params: { _meta: { scope: "all" } } });
      const names = ((listed.result?.tools ?? []) as any[]).map((t) => t.name);
      let called = 0;
      for (const tool of parts.tools) {
        const name = `${SLUG}_${tool.name}`;
        assertContains(names.join(","), name, `tool ${name} registered`);
        const out = await call(p, name, replayArgs(tool, parts.index, parts.model));
        assertNotContains(out, "[ERROR] [NOT_FOUND]", `replay ${name} answered`);
        assertNotContains(out, "[ERROR]", `replay ${name} did not error`);
        called++;
      }
      console.log(`  replay: ${called} declared tool(s)`);
      await kill(p);
    });
    console.log(`\n${passed} passed, ${failed} failed`);
    rmSync(DATA_DIR, { recursive: true, force: true });
    if (failed === 0) harnessComplete();
    process.exit(failed > 0 ? 1 : 0);
  }

  console.log("=== Ruleset no-Novel access (REQ-558 / T651) ===\n");
  installFixture();
  // REQ-210d — the legacy variant ships no `badge_scope` on its index entries.
  installFixture({ slug: LEGACY_SLUG, legacy: true });

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

  await test("T179/REQ-002c1: GM-only entries stay hidden from the Player lookup surface", async () => {
    const p = await boot();
    await call(p, "manage_novel", { action: "create", name: "t179", ruleset: SLUG });
    await call(p, "set_badge", { badge: "player" });
    // Enumeration and hint: the GM-only name and alias are absent.
    const missing = await call(p, `${SLUG}_lookup_thing`, { key: "missing-thing" });
    assertContains(missing, "[ERROR] [NOT_FOUND]", "player unknown key refuses");
    assertContains(missing, "Big Thing", "player enumeration keeps shared names");
    assertNotContains(missing, "GM Secret Thing", "player enumeration omits the GM-only name");
    const hint = await call(p, `${SLUG}_lookup_thing`, { key: "GM Secret Thin" });
    assertNotContains(hint, "Did you mean 'GM Secret Thing'", "player hint omits the GM-only name");
    assertNotContains(hint, "Forbidden Alias", "player hint omits the GM-only alias");
    // Resolution: exact key and alias are treated as absent.
    const exact = await call(p, `${SLUG}_lookup_thing`, { key: "gm-secret-thing" });
    assertContains(exact, "[ERROR] [NOT_FOUND]", "player exact key is absent");
    assertNotContains(exact, "hidden gm thing", "player exact key discloses no content");
    const byAlias = await call(p, `${SLUG}_lookup_thing`, { key: "Forbidden Alias" });
    assertContains(byAlias, "[ERROR] [NOT_FOUND]", "player alias is absent");
    assertNotContains(byAlias, "hidden gm thing", "player alias discloses no content");
    // Info-kind entry: absent for Player, present for GM.
    const playerInfo = await call(p, `${SLUG}_core_mechanic`, {});
    assertContains(playerInfo, "[ERROR] [NOT_FOUND]", "player info entry is absent");
    await call(p, "set_badge", { badge: "game_master" });
    const gmExact = await call(p, `${SLUG}_lookup_thing`, { key: "gm-secret-thing" });
    assertContains(gmExact, "hidden gm thing", "GM sees the GM-only entry");
    const gmMissing = await call(p, `${SLUG}_lookup_thing`, { key: "missing-thing" });
    assertContains(gmMissing, "GM Secret Thing", "GM enumeration lists the GM-only name");
    const gmInfo = await call(p, `${SLUG}_core_mechanic`, {});
    assertContains(gmInfo, "percentile die", "GM sees the info entry");
    await kill(p);
  });

  await test("T784/REQ-210d: index-backed search and the entry resource honor badge scope", async () => {
    const p = await boot();
    const readResource = async (uri: string): Promise<string> => {
      const resp = await send(p, { method: "resources/read", params: { uri } });
      return (resp.result?.contents ?? []).map((c: any) => c?.text ?? "").join("\n");
    };
    await call(p, "manage_novel", { action: "create", name: "t784", ruleset: SLUG });

    // 1 — hits and the reported total are both filtered; `max_results` is a
    // host-search parameter, so the total assertion drives `manage_ruleset`.
    await call(p, "set_badge", { badge: "player" });
    const playerHits = await call(p, `${SLUG}_search_rules`, { query: "thing" });
    assertNotContains(playerHits, "gm-secret-thing", "player search omits the GM-only hit");
    const playerTotal = await call(p, "manage_ruleset", { action: "search", query: "thing", max_results: 1 });
    assertContains(playerTotal, "[1 of 2 results]", "player total counts visible matches only");
    // 2 — a query matching only GM entries is indistinguishable from no match.
    const onlyGm = await call(p, `${SLUG}_search_rules`, { query: "hidden gm" });
    assertContains(onlyGm, "[ERROR] [NOT_FOUND]", "player query matching only GM entries is absent");
    assertNotContains(onlyGm, "hidden gm thing", "no content disclosure");
    // 3 — the blank/whitespace query path takes the same filter.
    const blank = await call(p, `${SLUG}_search_rules`, { query: "" });
    assertNotContains(blank, "hidden gm thing", "blank query discloses no GM content");
    const spaced = await call(p, "manage_ruleset", { action: "search", query: " " });
    assertNotContains(spaced, "hidden gm thing", "whitespace query discloses no GM content");
    // 4 — Observer behaves as Player.
    await call(p, "set_badge", { badge: "observer" });
    const observer = await call(p, `${SLUG}_search_rules`, { query: "thing" });
    assertNotContains(observer, "gm-secret-thing", "observer search omits the GM-only hit");
    const observerTotal = await call(p, "manage_ruleset", { action: "search", query: "thing", max_results: 1 });
    assertContains(observerTotal, "[1 of 2 results]", "observer total is filtered");
    // 5 — Editor sees every entry.
    await call(p, "set_badge", { badge: "none" });
    const editorTotal = await call(p, "manage_ruleset", { action: "search", query: "thing", max_results: 1 });
    assertContains(editorTotal, "[1 of 3 results]", "editor total includes every entry");
    // 6 — Game Master sees and reads it.
    await call(p, "set_badge", { badge: "game_master" });
    const gmTotal = await call(p, "manage_ruleset", { action: "search", query: "thing", max_results: 1 });
    assertContains(gmTotal, "[1 of 3 results]", "GM total includes the GM-only entry");
    const gmRead = await readResource(`ruleset://${SLUG}/gm-secret-thing`);
    assertContains(gmRead, "hidden gm thing", "GM can read the entry resource");
    // 7 — the resource read is non-disclosing for Player.
    await call(p, "set_badge", { badge: "player" });
    const denied = await readResource(`ruleset://${SLUG}/gm-secret-thing`);
    assertContains(denied, "[ERROR] [NOT_FOUND]", "player entry read is absent");
    assertNotContains(denied, "hidden gm thing", "no content disclosure");
    assertNotContains(denied, "Game Master only", "no scope confirmation");

    // 8 — a package with no declared scope keeps its legacy category refusal.
    await call(p, "manage_novel", { action: "create", name: "t784-legacy", ruleset: LEGACY_SLUG });
    await call(p, "set_badge", { badge: "player" });
    const legacy = await call(p, `${LEGACY_SLUG}_search_rules`, { query: "thing" });
    assertNotContains(legacy, "hidden gm thing", "legacy category:gm entry is withheld from search");
    const legacyHost = await call(p, "manage_ruleset", { action: "search", slug: LEGACY_SLUG, query: "thing" });
    assertNotContains(legacyHost, "hidden gm thing", "host search withholds the legacy entry");
    const legacyRead = await readResource(`ruleset://${LEGACY_SLUG}/gm-secret-thing`);
    assertContains(legacyRead, "[ERROR] [NOT_FOUND]", "legacy entry resource is withheld");
    await call(p, "set_badge", { badge: "game_master" });
    const legacyGm = await call(p, `${LEGACY_SLUG}_search_rules`, { query: "hidden gm thing" });
    assertContains(legacyGm, "hidden gm thing", "GM sees the legacy entry");
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
    // REQ-391a — with no Novel, package tools are reachable through scope=all.
    const listed = await send(p, { method: "tools/list", params: { _meta: { scope: "all" } } });
    const names = ((listed.result?.tools ?? []) as any[]).map((t) => t.name);
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
