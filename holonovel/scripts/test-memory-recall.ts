#!/usr/bin/env node
/**
 * test-memory-recall.ts — compression-ladder and recall-probe gate. [gate]
 *
 * Builds a deterministic three-session fixture campaign, forces session
 * summarization through the real compaction path, and verifies source-pointer
 * traversal, budgeted tier degradation, and recall@budget against the committed
 * probe fixture.
 *
 * Exit codes: 0 = pass, 1 = a check failed, 2 = fatal.
 * REQ-590, REQ-591, REQ-592, REQ-593
 */

import { spawn, ChildProcess } from "node:child_process";
import { mkdtempSync, rmSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { installHarnessGuard, harnessComplete } from "./lib/harness-guard.js";

installHarnessGuard();

const SERVER_SCRIPT = join(import.meta.dirname!, "..", "src", "index.ts");
const FIXTURE = join(import.meta.dirname!, "fixtures", "memory-recall.json");
const DATA_DIR = mkdtempSync(join(tmpdir(), "holonovel-memory-recall-"));
const SLUG = "recall-fixture";

let passed = 0;
let failed = 0;
async function test(name: string, fn: () => void | Promise<void>): Promise<void> {
  try { await fn(); passed++; console.log(`  PASS ${name}`); }
  catch (e: any) { failed++; console.error(`  FAIL ${name}: ${e.message}`); }
}
function assertContains(hay: string, needle: string): void {
  if (!hay.toLowerCase().includes(needle.toLowerCase())) throw new Error(`expected to contain "${needle}", got: ${hay.substring(0, 400)}`);
}
function assertNotContains(hay: string, needle: string): void {
  if (hay.toLowerCase().includes(needle.toLowerCase())) throw new Error(`expected NOT to contain "${needle}", got: ${hay.substring(0, 400)}`);
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

async function boot(env: Record<string, string> = {}): Promise<ChildProcess> {
  const proc = spawn("npx", ["tsx", SERVER_SCRIPT], {
    env: { ...process.env, TTRPG_DATA_DIR: DATA_DIR, ...env },
    stdio: ["pipe", "pipe", "pipe"],
  });
  attach(proc);
  await send(proc, { method: "initialize", params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "memory-recall-test", version: "1.0.0" } } });
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

async function readResource(proc: ChildProcess, uri: string): Promise<string> {
  const resp = await send(proc, { method: "resources/read", params: { uri } });
  if (resp.error) throw new Error(`RPC error: ${JSON.stringify(resp.error)}`);
  return (resp.result?.contents ?? []).map((c: any) => c?.text ?? "").join("\n");
}

function kill(proc: ChildProcess): Promise<void> {
  return new Promise((resolve) => {
    proc.on("exit", () => resolve());
    proc.kill();
  });
}

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

interface Probe {
  id: string;
  question: string;
  expected_contains: string[];
  tier: string;
  budget_tokens: number;
  required: boolean;
}

async function main() {
  console.log("=== Compression ladder and recall probes (REQ-590–593) ===\n");
  mkdirSync(DATA_DIR, { recursive: true });

  // ── Session 1: stable facts and the vault event ─────────────────────
  let proc = await boot({ TTRPG_SESSION_ID: "s1" });
  await call(proc, "manage_novel", { action: "create", name: SLUG });
  await call(proc, "set_badge", { badge: "game_master" });
  await call(proc, "manage_npc", { action: "create", name: "Kael", disposition: "loyal", goals: "Guard the chapel" });
  await call(proc, "manage_faction", { action: "create", name: "Merchant Guild", goals: ["Control the docks"] });
  await call(proc, "manage_vow", { action: "set", name: "Protect the chapel", difficulty: "dangerous" });
  await call(proc, "manage_lore", { action: "set", key: "vault", content: "The vault lies beneath the chapel." });
  await call(proc, "manage_diagnostics", { action: "event", text: "The vault door was opened" });
  await kill(proc);

  // ── Session 2: the oath ─────────────────────────────────────────────
  proc = await boot({ TTRPG_SESSION_ID: "s2" });
  await call(proc, "manage_novel", { action: "resume", slug: SLUG });
  await call(proc, "set_badge", { badge: "game_master" });
  await call(proc, "manage_diagnostics", { action: "event", text: "Kael swore to protect the chapel" });
  await kill(proc);

  // ── Session 3: the bell, then compact sessions 1–2 ──────────────────
  proc = await boot({ TTRPG_SESSION_ID: "s3" });
  await call(proc, "manage_novel", { action: "resume", slug: SLUG });
  await call(proc, "set_badge", { badge: "game_master" });
  await call(proc, "manage_diagnostics", { action: "event", text: "The bell rang at dusk" });

  const pendingCompact = await call(proc, "manage_diagnostics", { action: "compact", sessions: 1 });
  assertContains(pendingCompact, "[NEED_INPUT]");
  const compacted = await call(proc, "respond_decision", { decision: "compress_audit:1", option: "yes" });
  assertContains(compacted, "compacted");

  await test("T697: campaign and arc tiers carry deterministic facts and pointers", async () => {
    const campaign = await call(proc, "manage_session", { action: "recap", tier: "campaign", budget_tokens: 4000 });
    assertContains(campaign, "Kael");
    assertContains(campaign, "Merchant Guild");
    assertContains(campaign, "lore vault");
    const again = await call(proc, "manage_session", { action: "recap", tier: "campaign", budget_tokens: 4000 });
    const strip = (s: string) => s.replace(/\d{4}-\d{2}-\d{2}T[^\s]+/g, "<ts>");
    if (strip(campaign) !== strip(again)) throw new Error("campaign tier derivation is not deterministic");
    const arc = await call(proc, "manage_session", { action: "recap", tier: "arc", budget_tokens: 4000 });
    assertContains(arc, "Kael swore to protect the chapel");
  });

  let archivedPointers: number[] = [];
  await test("T698: summary source pointers traverse back to raw events", async () => {
    const archive = JSON.parse(await readResource(proc, "audit://novel/archive"));
    if (!Array.isArray(archive) || archive.length < 2) throw new Error(`expected archived sessions, got ${JSON.stringify(archive)}`);
    archivedPointers = [...new Set(archive.flatMap((s: any) => s.source_ordinals ?? []))].sort((a, b) => a - b) as number[];
    if (archivedPointers.length === 0) { const hist = await call(proc, "manage_diagnostics", { action: "history" }); throw new Error(`archived summaries carry no source_ordinals: ${JSON.stringify(archive)} history=${hist}`); }
    const raw = await call(proc, "manage_diagnostics", { action: "history", ordinals: archivedPointers });
    assertContains(raw, "The vault door was opened");
    assertContains(raw, "Kael swore to protect the chapel");
  });

  await test("T699: budgeted assembly drops tiers in declared order; no-arg recap unchanged", async () => {
    const plain1 = await call(proc, "manage_session", { action: "recap" });
    const plain2 = await call(proc, "manage_session", { action: "recap" });
    if (plain1 !== plain2) throw new Error("no-arg recap is not deterministic");
    assertNotContains(plain1, "tiered_memory");
    const tight = await call(proc, "manage_session", { action: "recap", budget_tokens: 1 });
    assertContains(tight, "tiered_memory:");
    assertContains(tight, "[truncated] arc tier omitted");
    assertContains(tight, "[truncated] session tier omitted");
    const bad = await call(proc, "manage_session", { action: "recap", tier: "nope" });
    assertContains(bad, "[INVALID_INPUT]");
    const badBudget = await call(proc, "manage_session", { action: "recap", budget_tokens: 0 });
    assertContains(badBudget, "[INVALID_INPUT]");
  });

  const probes: Probe[] = JSON.parse(readFileSync(FIXTURE, "utf8")).probes;
  await test("T700: recall@budget meets the threshold", async () => {
    let hits = 0;
    const misses: string[] = [];
    for (const probe of probes) {
      const out = await call(proc, "manage_session", { action: "recap", tier: probe.tier, budget_tokens: probe.budget_tokens });
      const hit = probe.expected_contains.every((needle) => out.toLowerCase().includes(needle.toLowerCase()));
      if (hit) hits++;
      else misses.push(`${probe.id} (${probe.tier})`);
    }
    const recall = hits / probes.length;
    console.log(`    recall@budget: ${(recall * 100).toFixed(0)}% (${hits}/${probes.length})`);
    const requiredMiss = probes.some((p) => p.required && misses.some((m) => m.startsWith(p.id)));
    if (requiredMiss) throw new Error(`required-recall probe missed: ${misses.join(", ")}`);
    if (recall < 0.9) throw new Error(`aggregate recall ${recall.toFixed(2)} below 0.90: ${misses.join(", ")}`);
  });

  await kill(proc);

  // ── Eviction: pointers survive as [evicted] markers ─────────────────
  proc = await boot({ TTRPG_SESSION_ID: "s4", TTRPG_EVENT_LOG_MAX_ENTRIES: "1" });
  await call(proc, "manage_novel", { action: "resume", slug: SLUG });
  await call(proc, "set_badge", { badge: "game_master" });
  await call(proc, "manage_diagnostics", { action: "event", text: "A new observation evicts the rest" });
  await test("T698/REQ-591: evicted pointers report [evicted] instead of vanishing", async () => {
    const old = archivedPointers[0];
    const raw = await call(proc, "manage_diagnostics", { action: "history", ordinals: [old] });
    assertContains(raw, "[evicted]");
  });
  await kill(proc);

  rmSync(DATA_DIR, { recursive: true, force: true });
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
  harnessComplete();
}

main().catch((e) => { console.error(e); process.exit(2); });
