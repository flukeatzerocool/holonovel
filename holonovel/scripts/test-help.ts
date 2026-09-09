#!/usr/bin/env node
// Help-and-tool-discovery harness (REQ-067, REQ-032). Exercises T62
// (categorized task map + query search + badge filtering) and T118
// (GM category reassignment / reset / not-found / forbidden).
//
// Exit codes: 0 = pass, 1 = one or more assertions failed.

import { spawn, ChildProcess } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const SERVER_SCRIPT = join(import.meta.dirname!, "..", "src", "index.ts");
const DATA_DIR = mkdtempSync(join(tmpdir(), "holonovel-help-test-"));

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
  await send(proc, { method: "initialize", params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "help-test", version: "1.0.0" } } });
  proc.stdin!.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n");
  await sleep(250);
  return proc;
}
async function call(proc: ChildProcess, name: string, args: Record<string, unknown> = {}): Promise<string> {
  const resp = await send(proc, { method: "tools/call", params: { name, arguments: args } });
  if (resp.error) throw new Error(`RPC error: ${JSON.stringify(resp.error)}`);
  const content = resp.result?.content ?? [];
  return content.map((c: any) => (c?.text ?? "")).join("\n");
}
function kill(proc: ChildProcess): Promise<void> {
  return new Promise((resolve) => {
    proc.on("exit", () => resolve());
    proc.kill();
  });
}
function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

// ── Main ──────────────────────────────────────────────────────────────
async function main() {
  console.log("=== Help & Tool Discovery (REQ-067 / REQ-032) ===\n");
  mkdirSync(DATA_DIR, { recursive: true });

  // ── T62: categorized task map, query search, badge filtering ──────
  await test("T62: help() no-query lists categorized task map", async () => {
    const p = await boot();
    await call(p, "novel", { action: "create", name: "help-t62a" });
    await call(p, "set_badge", { badge: "game_master" });
    const h = await call(p, "help", {});
    assertContains(h, "### Tool Categories", "T62a");
    assertContains(h, "**Combat:** combat", "T62a combat category");
    assertContains(h, "**Characters:** character", "T62a characters category");
    await kill(p);
  });

  await test("T62: help(query) returns matching tools", async () => {
    const p = await boot();
    await call(p, "novel", { action: "create", name: "help-t62b" });
    await call(p, "set_badge", { badge: "game_master" });
    const h = await call(p, "help", { query: "combat" });
    assertContains(h, "combat", "T62b");
    await kill(p);
  });

  await test("T62: Player badge sees no GM-only tools", async () => {
    const p = await boot();
    await call(p, "set_badge", { badge: "player" });
    const h = await call(p, "help", {});
    assertContains(h, "**Characters:** character", "T62c player-visible category");
    assertNotContains(h, "**Combat:**", "T62c GM-only combat hidden from player");
    await kill(p);
  });

  // ── T118: GM category reassignment / reset / not-found / forbidden ──
  await test("T118: GM reassigns tool to user category", async () => {
    const p = await boot();
    await call(p, "novel", { action: "create", name: "help-t118a" });
    await call(p, "set_badge", { badge: "game_master" });
    const r = await call(p, "help", { action: "category", tool_name: "combat", category: "Custom" });
    assertContains(r, "assigned to category 'Custom'", "T118a");
    const h = await call(p, "help", {});
    assertContains(h, "**Custom:** combat", "T118a override rendered");
    assertNotContains(h, "**Combat:** combat", "T118a removed from builder category");
    await kill(p);
  });

  await test("T118: reset restores builder category", async () => {
    const p = await boot();
    await call(p, "novel", { action: "create", name: "help-t118b" });
    await call(p, "set_badge", { badge: "game_master" });
    await call(p, "help", { action: "category", tool_name: "combat", category: "Custom" });
    const r = await call(p, "help", { action: "category", tool_name: "combat", category: "" });
    assertContains(r, "removed", "T118b");
    const h = await call(p, "help", {});
    assertContains(h, "**Combat:** combat", "T118b restored builder category");
    assertNotContains(h, "**Custom:**", "T118b override cleared");
    await kill(p);
  });

  await test("T118: unknown tool name returns NOT_FOUND", async () => {
    const p = await boot();
    await call(p, "novel", { action: "create", name: "help-t118c" });
    await call(p, "set_badge", { badge: "game_master" });
    const r = await call(p, "help", { action: "category", tool_name: "bogus_tool", category: "X" });
    assertContains(r, "[ERROR] [NOT_FOUND]", "T118c");
    await kill(p);
  });

  await test("T118: Player badge cannot modify mapping", async () => {
    const p = await boot();
    await call(p, "novel", { action: "create", name: "help-t118d" });
    await call(p, "set_badge", { badge: "player" });
    const r = await call(p, "help", { action: "category", tool_name: "combat", category: "X" });
    assertContains(r, "[FORBIDDEN]", "T118d");
    await kill(p);
  });

  console.log(`\n${passed} passed, ${failed} failed`);
  rmSync(DATA_DIR, { recursive: true, force: true });
  if (failed > 0) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
