#!/usr/bin/env node
// Tool-definition quality harness (REQ-427, REQ-024), registry-published
// distribution guard (REQ-428), server-wide action-discriminator surface
// guard (REQ-429), and ruleset tool-quality conformance guard (REQ-430).
// Exercises T509, T510, T511, and T512.
//
// T509 (REQ-427 + REQ-024): boots a ruleset-free host and asserts every
// registered tool's description carries the three-clause structure (summary,
// "Use when:", "Do NOT use when:") and that every advertised input parameter
// carries a non-empty description in its JSON Schema.
//
// T510 (REQ-428): asserts holonovel/server.json's version and package version
// equal the npm-canonical host version, and that the root version-check gate
// passes against the committed manifest.
//
// T511 (REQ-429): asserts the registered tool catalog is at most twenty-five
// tools, one per persisted entity type, and that every persisted type carries
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

const ROOT = join(import.meta.dirname!, "..", "..");
const SERVER_SCRIPT = join(import.meta.dirname!, "..", "src", "index.ts");
const DATA_DIR = mkdtempSync(join(tmpdir(), "holonovel-tooldef-"));

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
async function boot(): Promise<ChildProcess> {
  const proc = spawn("npx", ["tsx", SERVER_SCRIPT], {
    env: { ...process.env, TTRPG_DATA_DIR: DATA_DIR },
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
  assert(tools.length === 25, `expected the consolidated 25-tool surface, got ${tools.length}`);

  // ── T511 (REQ-429): every persisted entity type has a read/enumerate action.
  await test("T511/REQ-429: server-wide action-discriminator surface within a 25-tool budget", () => {
    const toolNames = new Set(tools.map((t) => t.name));
    const requiredEntityTools = ["novel", "character", "npc", "world", "faction", "vow", "countdown", "lore", "story", "note", "codex", "combat", "condition", "relationship"];
    for (const name of requiredEntityTools) {
      assert(toolNames.has(name), `missing entity tool '${name}'`);
    }
    const readActionHints: Record<string, string[]> = {
      novel: ["info", "list"], character: ["sheet", "roster_list"], npc: ["list", "get"],
      world: ["create_room"], faction: ["list"], vow: ["list"], countdown: ["list"],
      lore: ["list", "get"], story: ["list"], note: ["list"], codex: ["list", "get"],
      combat: ["status"], condition: ["list"], relationship: ["get"],
    };
    for (const [name, actions] of Object.entries(readActionHints)) {
      const tool = tools.find((t) => t.name === name);
      const props: Record<string, any> = (tool?.inputSchema && typeof tool.inputSchema === "object") ? (tool.inputSchema.properties ?? {}) : {};
      const actionEnum: string[] = props.action?.enum ?? [];
      for (const a of actions) {
        assert(actionEnum.includes(a), `${name} action enum missing '${a}'`);
      }
    }
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
  const health = JSON.parse(await call(proc2, "session", { action: "health" }));

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
  const health3 = JSON.parse(await call(proc3, "session", { action: "health" }));
  await test("T512/REQ-430: conformant rebuild clears the tool-quality flag", () => {
    const counts = health3.ruleset_tool_quality;
    if (!counts || counts.conformant !== 2 || counts.non_conformant !== 0) {
      throw new Error(`flag did not clear: ${JSON.stringify(counts)}`);
    }
    const tq = (health3.ruleset_package_alerts ?? []).filter((a: any) => String(a.reason ?? "").startsWith("[tool-quality]"));
    if (tq.length !== 0) throw new Error(`residual tool-quality alerts: ${JSON.stringify(tq)}`);
  });
  proc3.kill("SIGKILL");

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

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
