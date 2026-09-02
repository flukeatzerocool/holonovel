#!/usr/bin/env node
// Tool-definition quality harness (REQ-427, REQ-024) and registry-published
// distribution guard (REQ-428). Exercises T509 and T510.
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
// Exit codes: 0 = pass, 1 = one or more assertions failed.

import { spawn, spawnSync, ChildProcess } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

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

function npmCanonical(v: string): string {
  return v.split(".").map((p, i) => (i === 0 ? p : String(parseInt(p, 10)))).join(".");
}

async function main() {
  console.log("=== Tool-definition quality (T509) + registry distribution (T510) ===\n");

  // ── T509 ────────────────────────────────────────────────────────────
  const proc = await boot();
  const listResp = await send(proc, { method: "tools/list", params: {} });
  const tools: any[] = listResp.result?.tools ?? [];
  assert(tools.length > 50, `expected a large static tool surface, got ${tools.length}`);

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
