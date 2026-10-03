#!/usr/bin/env node
// Lean-narrator integration harness (2026-09-26). [gate]
//
// Role: gate — exercises the structured-result, discovery-routing, orientation,
// and grounding contracts, plus the builder-side disposition records.
// Exit codes: 0 = pass, 1 = failure.
// Covers REQ-548a (T632), REQ-548b (T633), REQ-548c (T634), REQ-548d (T635),
// REQ-067d (T636), REQ-114c (T637), REQ-551 (T638), REQ-551a (T639),
// REQ-412a (T640), and REQ-312e (T641).

import { spawn } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { installHarnessGuard, harnessComplete } from "./lib/harness-guard.js";
installHarnessGuard();

const SERVER_SCRIPT = join(process.cwd(), "src", "index.ts");
const DECISIONS = join(process.cwd(), "DECISIONS.md");
let msgId = 0;
const pending = new Map<number, (m: any) => void>();
let buffer = "";
function send(proc: any, msg: any): Promise<any> {
  return new Promise((r) => { const id = ++msgId; pending.set(id, r); proc.stdin.write(JSON.stringify({ ...msg, id, jsonrpc: "2.0" }) + "\n"); });
}
function attach(proc: any): void {
  buffer = "";
  proc.stdout.on("data", (d: Buffer) => {
    buffer += d.toString();
    const ls = buffer.split("\n");
    buffer = ls.pop() ?? "";
    for (const l of ls) {
      if (!l.trim()) continue;
      try { const m = JSON.parse(l); if (m.id !== undefined && pending.has(m.id)) { pending.get(m.id)!(m); pending.delete(m.id); } } catch { /* non-JSON diagnostic line */ }
    }
  });
}
async function boot(env: any = {}): Promise<any> {
  const p = spawn("npx", ["tsx", SERVER_SCRIPT], { env: { ...process.env, TTRPG_DATA_DIR: mkdtempSync(join(tmpdir(), "lean-")), ...env }, stdio: ["pipe", "pipe", "pipe"] });
  attach(p);
  await send(p, { method: "initialize", params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "lean", version: "1" } } });
  p.stdin.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n");
  await new Promise((r) => setTimeout(r, 350));
  return p;
}
async function raw(proc: any, name: string, args: any = {}): Promise<any> {
  const r = await send(proc, { method: "tools/call", params: { name, arguments: args } });
  return r.result ?? {};
}
async function call(proc: any, name: string, args: any = {}): Promise<string> {
  const r = await raw(proc, name, args);
  return (r.content ?? []).map((x: any) => x?.text ?? "").join("\n");
}
async function proto(proc: any, method: string, params: any): Promise<any> {
  const r = await send(proc, { method, params });
  return r.result ?? {};
}
async function kill(proc: any): Promise<void> {
  try { proc.kill("SIGKILL"); } catch { /* already exited */ }
  await new Promise((r) => setTimeout(r, 120));
}

let passed = 0; let failed = 0;
async function test(name: string, fn: () => void | Promise<void>): Promise<void> {
  try { await fn(); passed++; } catch (e: any) { failed++; console.error(`FAIL ${name}: ${e.message ?? e}`); }
}
function assert(c: boolean, m: string): void { if (!c) throw new Error(m); }

async function main(): Promise<void> {
  const p = await boot();

  await test("REQ-548b T633 output-schema declaration", async () => {
    const list = await proto(p, "tools/list", {});
    const tools = list.tools ?? [];
    assert(tools.length > 0, "no tools listed");
    for (const t of tools) assert(Boolean(t.outputSchema), `tool ${t.name} lacks outputSchema`);
  });

  await test("REQ-548a T632 structured tool results", async () => {
    const r = await raw(p, "manage_novel", { action: "create", name: "Lean Test" });
    assert(Boolean(r.structuredContent), "no structuredContent on ok response");
    assert(r.structuredContent.status === "OK", `status=${r.structuredContent.status}`);
  });

  await test("REQ-548c T634 structured error results", async () => {
    const r = await raw(p, "respond_decision", { decision: "x", option: "y" });
    assert(Boolean(r.structuredContent), "no structuredContent on error response");
    assert(Boolean(r.structuredContent.category), "no category");
    assert("corrective_action" in r.structuredContent, "no corrective_action");
  });

  await test("REQ-548d T635 machine-readable decision options", async () => {
    await call(p, "set_badge", { badge: "game_master" });
    const r = await raw(p, "manage_session", { action: "compact", sessions: 2 });
    const sc = r.structuredContent ?? {};
    assert(sc.status === "NEED_INPUT", `status=${sc.status}`);
    assert(Array.isArray(sc.options) && sc.options.length > 0, "no options");
    assert(sc.options.some((o: any) => o.value === "cancel"), "cancel option missing");
  });

  await test("REQ-067d T636 task-map intent routing", async () => {
    await call(p, "set_badge", { badge: "game_master" });
    const t = await call(p, "manage_session", { action: "discover" });
    assert(t.includes("Example:"), "no example invocation in task map");
  });

  await test("REQ-412a T640 play-loop orientation token", async () => {
    const r = await proto(p, "prompts/get", { name: "badge_briefing" });
    const text = (r.messages ?? []).map((m: any) => m.content?.text ?? "").join("\n");
    assert(text.includes("Play loop:"), "orientation token missing");
  });
  await kill(p);

  const p2 = await boot({ TTRPG_NARRATION_VALIDATION: "on" });
  await test("REQ-312e T641 narration grounding set", async () => {
    const r = await raw(p2, "manage_novel", { action: "create", name: "Grounding Test" });
    const sc = r.structuredContent ?? {};
    assert(Boolean(sc.grounding), "no grounding set on state-mutating response");
    assert(Array.isArray(sc.grounding.entities), "grounding.entities missing");
  });
  await kill(p2);

  const decisions = readFileSync(DECISIONS, "utf8");
  await test("REQ-114c T637 tool-selection coverage recorded", async () => { assert(decisions.includes("REQ-114c tool-selection coverage"), "REQ-114c record missing"); });
  await test("REQ-551 T638 extraction structural verification recorded", async () => { assert(decisions.includes("REQ-551 extraction structural verification"), "REQ-551 record missing"); });
  await test("REQ-551a T639 extractor divergence flags recorded", async () => { assert(decisions.includes("REQ-551a extractor divergence flags"), "REQ-551a record missing"); });

  harnessComplete();
  console.log(`lean-narrator harness: ${passed} passed, ${failed} failed`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
