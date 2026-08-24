#!/usr/bin/env node
// Workflow-lifecycle conformance harness (REQ-042, REQ-193, REQ-224, P50).
// Exercises T138 (raise/freeze/cancel-restore/resolve), T157 (restart survival),
// and T266 (staleness auto-cancel) against a real server process, including
// spawn/kill/respawn cycles against a shared data directory.

import { spawn, ChildProcess } from "node:child_process";
import { mkdtempSync, rmSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const SERVER_SCRIPT = join(import.meta.dirname!, "..", "src", "index.ts");
const DATA_DIR = mkdtempSync(join(tmpdir(), "holonovel-workflow-test-"));

let passed = 0;
let failed = 0;
async function test(name: string, fn: () => void | Promise<void>): Promise<void> {
  try { await fn(); passed++; console.log(`  PASS ${name}`); }
  catch (e: any) { failed++; console.error(`  FAIL ${name}: ${e.message}`); }
}
function assertContains(hay: string, needle: string): void {
  if (!hay.toLowerCase().includes(needle.toLowerCase())) throw new Error(`expected to contain "${needle}", got: ${hay.substring(0, 300)}`);
}

// ── MCP client ──────────────────────────────────────────────────────

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

async function boot(env: Record<string, string> = {}): Promise<ChildProcess> {
  const proc = spawn("npx", ["tsx", SERVER_SCRIPT], {
    env: { ...process.env, TTRPG_DATA_DIR: DATA_DIR, ...env },
    stdio: ["pipe", "pipe", "pipe"],
  });
  attach(proc);
  await send(proc, { method: "initialize", params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "workflow-test", version: "1.0.0" } } });
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

// ── Main ────────────────────────────────────────────────────────────

async function main() {
  console.log("=== Workflow-lifecycle conformance (REQ-042 / REQ-193 / REQ-224 / P50) ===\n");
  mkdirSync(DATA_DIR, { recursive: true });

  // ── T138: raise → freeze → cancel-restore → resolve ───────────────
  {
    const proc = await boot();
    await call(proc, "create_novel", { name: "workflow-t138" });
    await call(proc, "set_badge", { badge: "game_master" });
    await call(proc, "create_character", { name: "Sentinel" });

    const raise = await call(proc, "create_character", {});
    assertContains(raise, "[NEED_INPUT]");

    await test("T138a: undo frozen during pending workflow", async () => {
      const r = await call(proc, "undo", {});
      assertContains(r, "[STATE_CONFLICT]");
    });
    await test("T138b: redo frozen during pending workflow", async () => {
      const r = await call(proc, "redo", {});
      assertContains(r, "[STATE_CONFLICT]");
    });
    await test("T138c: set_badge frozen during pending workflow", async () => {
      const r = await call(proc, "set_badge", { badge: "player" });
      assertContains(r, "[STATE_CONFLICT]");
    });
    await test("T138d: second workflow raise returns STATE_CONFLICT", async () => {
      const r = await call(proc, "present_choices", { prompt: "q", choices: [{ id: "a", label: "A" }] });
      assertContains(r, "[STATE_CONFLICT]");
    });

    await test("T138e: respond(cancel) cancels and restores pre-workflow snapshot", async () => {
      const r = await call(proc, "respond", { decision: "character creation", option: "cancel" });
      assertContains(r, "cancelled");
      // The pre-existing entity survives (it was present before the workflow).
      const sheet = await call(proc, "character_sheet", {});
      assertContains(sheet, "Sentinel");
    });

    await test("T138f: after cancel, a fresh workflow can be raised and resolved", async () => {
      const r = await call(proc, "present_choices", { prompt: "which path?", choices: [{ id: "north", label: "North" }, { id: "south", label: "South" }] });
      assertContains(r, "[NEED_INPUT]");
      const resolve = await call(proc, "respond", { decision: "present choices", option: "north" });
      assertContains(resolve, "north");
    });

    await test("T138/REQ-190: drained workflow restores blocked tools and clears pending", async () => {
      // After the T138f drain, undo must be callable (no pending workflow).
      const undo = await call(proc, "undo", {});
      if (undo.includes("A workflow decision is pending")) {
        throw new Error(`undo still blocked after drain: ${undo.substring(0, 120)}`);
      }
    });

    await test("T32/REQ-191: options render as display-label pairs (kebab, label)", async () => {
      const r = await call(proc, "present_choices", { prompt: "choose", choices: [{ id: "acrobatics", label: "Acrobatics" }, { id: "arcana", label: "Arcana" }] });
      assertContains(r, "acrobatics");
      assertContains(r, "Acrobatics");
      assertContains(r, "arcana");
    });

    await test("S22/REQ-192: second respond on drained workflow returns STATE_CONFLICT", async () => {
      await call(proc, "present_choices", { prompt: "collide?", choices: [{ id: "a", label: "A" }] });
      const first = await call(proc, "respond", { decision: "-present_choices-", option: "a" });
      assertContains(first, "[OK]");
      const second = await call(proc, "respond", { decision: "-present_choices-", option: "a" });
      assertContains(second, "[STATE_CONFLICT]");
      if (second.includes("[NOT_FOUND]")) throw new Error("drained respond should be STATE_CONFLICT, not NOT_FOUND");
    });

    await kill(proc);
  }

  // ── T157: pending workflow survives restart; cancel restores ─────
  {
    let proc = await boot();
    await call(proc, "create_novel", { name: "workflow-t157" });
    await call(proc, "set_badge", { badge: "game_master" });
    await call(proc, "create_character", { name: "PreExisting" });
    const raise = await call(proc, "create_character", {});
    assertContains(raise, "[NEED_INPUT]");

    await kill(proc);
    proc = await boot();
    await call(proc, "resume_novel", { slug: "workflow-t157" });

    await test("T157: respond(cancel) after restart restores pre-workflow state", async () => {
      const cancel = await call(proc, "respond", { decision: "character creation", option: "cancel" });
      assertContains(cancel, "cancelled");
      const sheet = await call(proc, "character_sheet", {});
      assertContains(sheet, "PreExisting");
    });
    await kill(proc);
  }

  // ── T266: staleness auto-cancel (threshold) and disable (0) ───────
  {
    const THRESHOLD = "3";
    let proc = await boot({ TTRPG_WORKFLOW_STALENESS_CONNECTIONS: THRESHOLD });
    await call(proc, "create_novel", { name: "workflow-t266" });
    await call(proc, "set_badge", { badge: "game_master" });
    await call(proc, "create_character", { name: "Anchor" });
    await call(proc, "create_character", {}); // raise workflow (connection 1)

    // Each resume after a restart is a new connection (REQ-224a).
    await kill(proc);
    proc = await boot({ TTRPG_WORKFLOW_STALENESS_CONNECTIONS: THRESHOLD });
    await call(proc, "resume_novel", { slug: "workflow-t266" }); // connection 2

    await kill(proc);
    proc = await boot({ TTRPG_WORKFLOW_STALENESS_CONNECTIONS: THRESHOLD });
    await call(proc, "resume_novel", { slug: "workflow-t266" }); // connection 3 → auto-cancel

    await test("T266a: staleness auto-cancels at threshold (workflow drained)", async () => {
      const health = await call(proc, "spec_health", {});
      assertContains(health, '"active_novel": "workflow-t266"');
      // pending_workflow should be null (drained) — not report an open decision.
      const undo = await call(proc, "undo", {});
      // After auto-cancel, undo is callable again (no pending workflow).
      if (undo.includes("[STATE_CONFLICT] A workflow decision is pending")) {
        throw new Error(`undo still blocked by a pending workflow: ${undo.substring(0, 200)}`);
      }
    });
    await kill(proc);

    // Threshold=0 disables detection — workflow stays pending across resumes.
    proc = await boot({ TTRPG_WORKFLOW_STALENESS_CONNECTIONS: "0" });
    await call(proc, "create_novel", { name: "workflow-t266b" });
    await call(proc, "set_badge", { badge: "game_master" });
    await call(proc, "create_character", {});
    for (let i = 0; i < 4; i++) {
      await kill(proc);
      proc = await boot({ TTRPG_WORKFLOW_STALENESS_CONNECTIONS: "0" });
      await call(proc, "resume_novel", { slug: "workflow-t266b" });
    }
    await test("T266c: threshold 0 disables auto-cancel (workflow still pending)", async () => {
      const health = await call(proc, "spec_health", {});
      // pending_workflow still reports an open decision.
      assertContains(health, "character_creation");
    });
    await kill(proc);
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  rmSync(DATA_DIR, { recursive: true, force: true });
  if (failed > 0) process.exit(1);
  process.exit(0);
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(2);
});
