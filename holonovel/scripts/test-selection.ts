#!/usr/bin/env node
/**
 * test-selection.ts — intent-selection and search-budget harness. [gate]
 *
 * T683 (REQ-583): selection telemetry reports projection refusals and unknown
 * tool calls per ruleset, and is absent when no package is loaded.
 * T687 (REQ-587): the serialized default catalog is byte-identical across
 * invocations with unchanged scope and reports a cacheable prefix length.
 * T688 (REQ-588): the search result budget reports suppressed results, truncates
 * an oversized passage with a resolving ruleset:// pointer, and reports the
 * configured bound.
 *
 * Exit codes: 0 = pass, 1 = one or more assertions failed.
 */
import { spawn } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { PACKAGE_FORMAT } from "../src/generated/contract-fingerprints.js";
import { sha256Canonical } from "../../scripts/lib/hash.js";
import { installHarnessGuard, harnessComplete } from "./lib/harness-guard.js";
installHarnessGuard();

const SERVER_SCRIPT = join(import.meta.dirname, "..", "src", "index.ts");
const DATA_DIR = mkdtempSync(join(tmpdir(), "selection-harness-"));
let msgId = 0;
const pending = new Map<number, (value: any) => void>();
let buffer = "";

function send(proc: any, msg: any): Promise<any> {
  return new Promise((resolve) => {
    const id = ++msgId;
    pending.set(id, resolve);
    proc.stdin!.write(JSON.stringify({ ...msg, id, jsonrpc: "2.0" }) + "\n");
  });
}
function attach(proc: any): void {
  buffer = "";
  proc.stdout!.on("data", (d: Buffer) => {
    buffer += d.toString();
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const m = JSON.parse(line);
        if (m.id !== undefined && pending.has(m.id)) {
          pending.get(m.id)!(m);
          pending.delete(m.id);
        }
      } catch {
        // non-JSON server log line; not part of the protocol stream
      }
    }
  });
}
async function boot(env: any = {}): Promise<any> {
  const p = spawn("npx", ["tsx", SERVER_SCRIPT], {
    env: { ...process.env, TTRPG_DATA_DIR: DATA_DIR, ...env },
    stdio: ["pipe", "pipe", "pipe"],
  });
  attach(p);
  await send(p, {
    method: "initialize",
    params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "selection", version: "1" } },
  });
  p.stdin!.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n");
  await new Promise((r) => setTimeout(r, 250));
  return p;
}
async function call(proc: any, name: string, args: any = {}): Promise<any> {
  return send(proc, { method: "tools/call", params: { name, arguments: args } });
}
async function text(proc: any, name: string, args: any = {}): Promise<string> {
  const r = await call(proc, name, args);
  return (r.result?.content ?? []).map((x: any) => x?.text ?? "").join("\n");
}
async function health(proc: any): Promise<any> {
  const r = await call(proc, "manage_diagnostics", { action: "health" });
  const body = (r.result?.content ?? []).map((x: any) => x?.text ?? "").join("\n");
  const start = body.indexOf("{");
  return JSON.parse(body.slice(start));
}
function close(proc: any): void {
  try {
    proc.kill("SIGKILL");
  } catch {
    // process already exited
  }
}

const INDEX = [
  { id: "goblin", anchor: "Monsters > Goblin", source_file: "fixture.md", content: "Goblin: AC 15, HP 7. " + "Goblin tactics. ".repeat(80), category: "Monsters", confidence: "high", line_range: "1-2" },
  { id: "goblin_king", anchor: "Monsters > Goblin King", source_file: "fixture.md", content: "Goblin King: AC 17, HP 22.", category: "Monsters", confidence: "high", line_range: "3-4" },
];
const MODEL = { monsters: { goblin: { name: "Goblin" }, goblin_king: { name: "Goblin King" } }, info: {}, tables: {}, generation_tables: {}, concepts: {}, resolution: {}, roles: {} };
const TOOLS: any[] = [];
const RESOURCES: any[] = [];
const PROMPTS: any[] = [];
function packageFixture(): any {
  const manifest: any = {
    slug: "fixture", name: "Fixture", host_version: "0.0.0", package_format: PACKAGE_FORMAT,
    built_at: "2026-10-21", counts: { index: INDEX.length },
  };
  manifest.content_hash = sha256Canonical(INDEX, MODEL, TOOLS, RESOURCES, PROMPTS);
  return { slug: "fixture", manifest, index: INDEX, model: MODEL, tools: TOOLS, resources: RESOURCES, prompts: PROMPTS };
}

let passed = 0;
let failed = 0;
async function test(name: string, fn: () => Promise<void> | void): Promise<void> {
  try {
    await fn();
    passed++;
    console.log(`  PASS ${name}`);
  } catch (e: any) {
    failed++;
    console.error(`  FAIL ${name}: ${e.message ?? e}`);
  }
}
function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(msg);
}

async function main(): Promise<void> {
  // REQ-586 — install a performance record so spec_health reports it.
  writeFileSync(
    join(DATA_DIR, "performance-record.json"),
    readFileSync(join(import.meta.dirname, "..", "..", "spec", "audit", "performance-record.json")),
  );
  const proc = await boot({ TTRPG_SURFACE_PROFILE: "small", TTRPG_SEARCH_MAX_TOKENS: "50" });
  try {
    const pkg = packageFixture();
    await call(proc, "manage_ruleset", { action: "install", slug: pkg.slug, manifest: pkg.manifest, index: pkg.index, model: pkg.model, tools: pkg.tools, resources: pkg.resources, prompts: pkg.prompts });

    await test("T686/REQ-586: spec_health reports an installed performance record", async () => {
      const h = await health(proc);
      assert(h.performance_record?.scope === "reference-host", "installed performance record not reported");
      assert(h.performance_record?.terms?.tool_selection_coverage === 1, "record terms not reported");
    });

    await test("T687/REQ-587: catalog is byte-identical and reports a cacheable prefix", async () => {
      const a = await send(proc, { method: "tools/list", params: {} });
      const b = await send(proc, { method: "tools/list", params: {} });
      assert(JSON.stringify(a.result) === JSON.stringify(b.result), "tools/list changed between identical invocations");
      const h = await health(proc);
      assert(typeof h.tool_surface?.cacheable_prefix_bytes === "number", "spec_health.tool_surface.cacheable_prefix_bytes missing");
      assert(h.tool_surface.cacheable_prefix_bytes > 0, "cacheable prefix length is not positive");
    });

    await test("T683/REQ-583: telemetry counts unknown tools and projection refusals", async () => {
      await call(proc, "manage_novel", { action: "create", name: "selection-telemetry" });
      await call(proc, "set_badge", { badge: "game_master" });
      await call(proc, "no_such_tool", {});
      const refusal = await text(proc, "manage_faction", { action: "create", name: "The Guild" });
      assert(refusal.includes("belongs to group"), `expected a projection refusal under small profile, got: ${refusal.slice(0,200)}`);
      const h = await health(proc);
      assert(h.selection_telemetry !== undefined, "selection_telemetry missing with a package loaded");
      assert(h.selection_telemetry.unknown_tool_calls >= 1, "unknown tool call not counted");
      assert(h.selection_telemetry.projection_refusals >= 1, "projection refusal not counted");
      assert(h.selection_telemetry.undeclared_cross_group_calls >= 1, "cross-group refusal not counted");
    });

    await test("T717/REQ-606: context ledger lists every section and does not mutate", async () => {
      const before = await health(proc);
      const parseLedger = (body: string) => JSON.parse(body.slice(body.indexOf("{")));
      const first = parseLedger(await text(proc, "manage_diagnostics", { action: "context_report" }));
      const second = parseLedger(await text(proc, "manage_diagnostics", { action: "context_report" }));
      const names = first.sections.map((section: any) => section.name);
      const expected = ["tool_catalog", "registered_prompts", "resource_directory", "scene_state", "memory_tiers", "last_tool_output"];
      for (const name of expected) assert(names.filter((n: string) => n === name).length === 1, `section '${name}' missing or duplicated`);
      assert(first.sections.every((section: any) => typeof section.class === "string" && typeof section.tokens === "number"), "section class/tokens missing");
      const sum = first.sections.reduce((total: number, section: any) => total + section.tokens, 0);
      assert(first.total_tokens === sum, "total does not equal the section sum");
      assert(JSON.stringify(first) === JSON.stringify(second), "two calls on unchanged state returned different ledgers");
      const after = await health(proc);
      assert(before.audit_log_entries === after.audit_log_entries, "context_report appended an audit entry");
    });

    await test("T718/REQ-607: stable-prefix hash and ratio are stable and hit-rate-free", async () => {
      const a = await health(proc);
      const b = await health(proc);
      const sa = a.tool_surface ?? {};
      const sb = b.tool_surface ?? {};
      assert(typeof sa.cacheable_prefix_sha256 === "string" && sa.cacheable_prefix_sha256.length === 64, "prefix hash missing");
      assert(sa.cacheable_prefix_sha256 === sb.cacheable_prefix_sha256, "prefix hash changed between identical calls");
      assert(typeof sa.prefix_ratio === "number" && sa.prefix_ratio > 0 && sa.prefix_ratio <= 1, "prefix ratio out of range");
      assert(sa.cache_hit_rate === undefined, "spec_health claimed a provider cache-hit rate");
    });

    await test("T719/REQ-608: replay baseline records recall at budget per profile", async () => {
      const replay = JSON.parse(readFileSync(join(import.meta.dirname, "..", "..", "spec", "audit", "tool-surface-replay.json"), "utf-8"));
      const profiles = replay.profiles ?? [];
      assert(profiles.length === 3, "expected three profile rows");
      for (const row of profiles) {
        assert(typeof row.recall_at_budget?.budget_tokens === "number", `${row.profile}: budget missing`);
        assert(typeof row.recall_at_budget?.recall === "number", `${row.profile}: recall missing`);
        assert(row.recall_at_budget.recall >= 0 && row.recall_at_budget.recall <= 1, `${row.profile}: recall out of range`);
      }
    });

    await test("T720/REQ-609: discover discloses schemas on demand and keeps the summary default", async () => {
      const summary = await text(proc, "manage_session", { action: "discover", query: "npc" });
      assert(!summary.trim().startsWith("{"), "default discover returned a schema payload");
      const body = await text(proc, "manage_session", { action: "discover", query: "npc", detail: "schema" });
      const parsed = JSON.parse(body.slice(body.indexOf("{")));
      assert(parsed.detail === "schema", "schema detail not echoed");
      assert(parsed.matches.length > 0, "schema detail returned no matches");
      assert(parsed.matches[0].input_schema?.properties, "matched tool carries no input schema");
      const unknown = await text(proc, "manage_session", { action: "discover", query: "npc", detail: "bogus" });
      assert(unknown.includes("INVALID_INPUT"), "unknown detail did not refuse");
      const noQuery = await text(proc, "manage_session", { action: "discover", detail: "schema" });
      assert(noQuery.includes("INVALID_INPUT"), "schema detail without a query did not refuse");
    });

    await test("T721/REQ-610: budget allocator drops volatile first and refuses an invalid budget", async () => {
      const parseLedger = (body: string) => JSON.parse(body.slice(body.indexOf("{")));
      const tight = parseLedger(await text(proc, "manage_diagnostics", { action: "context_report", budget_tokens: 1 }));
      const allocation = tight.allocation ?? {};
      assert(allocation.dropped.includes("last_tool_output"), "volatile section was not dropped first");
      assert(allocation.kept.includes("tool_catalog"), "required tool_catalog was dropped");
      assert(allocation.kept.includes("registered_prompts"), "required registered_prompts was dropped");
      assert(allocation.within_budget === false, "required-over-budget case claimed to fit");
      const invalid = await text(proc, "manage_diagnostics", { action: "context_report", budget_tokens: 0 });
      assert(invalid.includes("INVALID_INPUT"), "invalid budget did not refuse");
    });

    await test("T688/REQ-588: search budget suppresses and truncates with a resource pointer", async () => {
      const body = await text(proc, "manage_ruleset", { action: "search", query: "goblin", slug: "fixture" });
      assert(body.includes("ruleset://fixture/"), "oversized passage did not carry a ruleset:// pointer");
      const h = await health(proc);
      assert(h.search_budget?.max_tokens === 50, "configured search budget not reported");
      assert(h.search_budget.last_returned < 2, "budget did not suppress a result");
      assert(h.search_budget.last_suppressed >= 1, "suppressed count not reported");
    });
  } finally {
    close(proc);
  }

  const BARE_DIR = mkdtempSync(join(tmpdir(), "selection-bare-"));
  const bare = await boot({ TTRPG_DATA_DIR: BARE_DIR });
  try {
    await test("T683/REQ-583: selection telemetry is absent with no package", async () => {
      const h = await health(bare);
      assert(h.selection_telemetry === undefined, "selection_telemetry present with no package");
    });
  } finally {
    close(bare);
  }

  rmSync(DATA_DIR, { recursive: true, force: true });
  rmSync(BARE_DIR, { recursive: true, force: true });
  console.log(`test-selection: ${passed} passed, ${failed} failed`);
  harnessComplete();
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
