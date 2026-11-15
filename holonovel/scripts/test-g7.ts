#!/usr/bin/env node
// G7 narrative-coherence attestation harness (REQ-346, G7). Exercises the [gate]
// Appendix F verification tests T396 and T403 against a live server process:
// DECISIONS.md attestation presence, spec_health.narrative_coherence
// disposition, and the smoke-session transcript record.

import { spawn, ChildProcess } from "node:child_process";
import { readFileSync, mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { installHarnessGuard, harnessComplete } from "./lib/harness-guard.js";
import { narrativeCoherence, type Section512Req } from "../src/narrative-coherence.js";
installHarnessGuard();

const SERVER_SCRIPT = join(import.meta.dirname!, "..", "src", "index.ts");
const DATA_DIR = mkdtempSync(join(tmpdir(), "holonovel-g7-test-"));
const DECISIONS_PATH = join(import.meta.dirname!, "..", "DECISIONS.md");

let passed = 0;
let failed = 0;
async function test(name: string, fn: () => void | Promise<void>): Promise<void> {
  try { await fn(); passed++; console.log(`  PASS ${name}`); }
  catch (e: any) { failed++; console.error(`  FAIL ${name}: ${e.message}`); }
}
function assertContains(hay: string, needle: string): void {
  if (!hay.toLowerCase().includes(needle.toLowerCase())) throw new Error(`expected to contain "${needle}", got: ${hay.substring(0, 300)}`);
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
        if (msg.id !== undefined && pending.has(msg.id)) {
          pending.get(msg.id)!(msg);
          pending.delete(msg.id);
        }
      } catch { /* non-JSON */ }
    }
  });
}
async function boot(): Promise<ChildProcess> {
  const proc = spawn("npx", ["tsx", SERVER_SCRIPT], {
    env: { ...process.env, TTRPG_DATA_DIR: DATA_DIR },
    stdio: ["pipe", "pipe", "pipe"],
  });
  attach(proc);
  await send(proc, { method: "initialize", params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "g7-test", version: "1.0.0" } } });
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
function kill(proc: ChildProcess): Promise<void> {
  return new Promise((resolve) => { proc.on("exit", () => resolve()); proc.kill(); });
}

async function main() {
  console.log("=== G7 narrative-coherence attestation (T396 / T403) ===\n");

  // T396 — attestation block present in DECISIONS.md with @section evidence.
  await test("T396: DECISIONS.md carries narrative_coherence / @section evidence", () => {
    const decisions = readFileSync(DECISIONS_PATH, "utf-8");
    assertContains(decisions, "narrative_coherence");
    assertContains(decisions, "@section evidence");
    assertContains(decisions, "smoke-session");
  });

  // T396 — the block carries §8's evidence-record fields, so the attestation is
  // a run record rather than a claim.
  await test("T396: the narrative_coherence block carries §8's six fields", () => {
    const decisions = readFileSync(DECISIONS_PATH, "utf-8");
    const start = decisions.indexOf("#### narrative_coherence (G7)");
    if (start === -1) throw new Error("narrative_coherence block not found");
    const rest = decisions.slice(start);
    const end = rest.search(/\n#{3,4} /);
    const block = end === -1 ? rest : rest.slice(0, end);
    for (const field of ["**Workflow**", "**Timestamp**", "**Environment pins**", "**Commands and output**", "**Pass/fail**", "**Findings**"]) {
      assertContains(block, field);
    }
    for (const point of ["(a)", "(b)", "(c)"]) assertContains(block, point);
    assertContains(block, "g7:start");
    assertContains(block, "| §5.12 REQ | Parent | Disposition |");
  });

  // T403 — G7 gate: spec_health.narrative_coherence reports pass/partial/fail.
  {
    const proc = await boot();
    await test("T403: spec_health.narrative_coherence reports a disposition", async () => {
      const health = await call(proc, "manage_diagnostics", { action: "health" });
      assertContains(health, "narrative_coherence");
      const m = health.match(/disposition"?\s*[:=]\s*"?(\w+)/);
      if (!m || !["pass", "partial", "fail"].includes(m[1])) {
        throw new Error(`no valid disposition found in: ${health.substring(0, 400)}`);
      }
    });
    await kill(proc);
  }

  // T403 — the disposition is derived, not a literal: the same rule that backs
  // spec_health must reach `partial` when an attested parent is missing and
  // `fail` when nothing is attested and no attestation is recorded (REQ-346b).
  await test("T403: the disposition rule reaches pass, partial, and fail", () => {
    const reqs: Section512Req[] = [
      { id: "REQ-901a", parent: "REQ-901", builderSide: false },
      { id: "REQ-901b", parent: "REQ-901", builderSide: false },
      { id: "REQ-902a", parent: "REQ-902", builderSide: false },
      { id: "REQ-903a", parent: "REQ-903", builderSide: true },
    ];
    const pass = narrativeCoherence(reqs, ["REQ-901", "REQ-902", "REQ-903"], { recorded: true, specCurrent: true });
    if (pass.disposition !== "pass" || pass.total !== 3 || pass.implemented !== 3) {
      throw new Error(`expected pass over 3 server-side bodies, got ${JSON.stringify(pass)}`);
    }
    const partial = narrativeCoherence(reqs, ["REQ-901"], { recorded: true, specCurrent: true });
    if (partial.disposition !== "partial" || partial.missing.join(",") !== "REQ-902a") {
      throw new Error(`expected partial with REQ-902a missing, got ${JSON.stringify(partial)}`);
    }
    const fail = narrativeCoherence(reqs, [], { recorded: false, specCurrent: true });
    if (fail.disposition !== "fail" || fail.implemented !== 0) {
      throw new Error(`expected fail with nothing implemented, got ${JSON.stringify(fail)}`);
    }
    const stale = narrativeCoherence(reqs, ["REQ-901", "REQ-902"], { recorded: true, specCurrent: false });
    if (stale.disposition !== "partial" || stale.attestation !== "stale") {
      throw new Error(`expected partial/stale for a spec the attestation does not cover, got ${JSON.stringify(stale)}`);
    }
    const builderOnly = reqs.filter((req) => req.builderSide);
    if (builderOnly.length !== 1 || pass.reqs.includes("REQ-903a")) {
      throw new Error("a builder-side body must not count as a server-side implementation");
    }
  });

  harnessComplete();
  console.log(`\n${passed} passed, ${failed} failed`);
  rmSync(DATA_DIR, { recursive: true, force: true });
  if (failed > 0) process.exit(1);
  process.exit(0);
}

main().catch((e) => { console.error("Fatal:", e); process.exit(2); });
