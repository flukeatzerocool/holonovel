#!/usr/bin/env node
// Competitive-gap harness — exercises the 2026-09-04 feature wave against a real
// server process: NPC mind (REQ-075f), NPC mind auto-apply (REQ-339d),
// procedural world generation (REQ-431), knowledge-graph projections
// (REQ-296c), vendor package certification (REQ-432), player-safe recap GM
// channel (REQ-072h), and the event notification surface (REQ-433).
//
// Tests T513–T519. Exit codes: 0 = pass, 1 = one or more assertions failed.

import { spawn, ChildProcess } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createHash } from "node:crypto";
import { PACKAGE_FORMAT } from "../src/generated/contract-fingerprints.js";

const SERVER_SCRIPT = join(import.meta.dirname!, "..", "src", "index.ts");
const DATA_DIR = mkdtempSync(join(tmpdir(), "holonovel-competitive-gaps-"));

let passed = 0;
let failed = 0;
async function test(name: string, fn: () => void | Promise<void>): Promise<void> {
  try { await fn(); passed++; console.log(`  PASS ${name}`); }
  catch (e: any) { failed++; console.error(`  FAIL ${name}: ${e.message}`); }
}
function assert(cond: boolean, msg: string): void { if (!cond) throw new Error(msg); }
function assertContains(hay: string, needle: string): void {
  if (!hay.toLowerCase().includes(needle.toLowerCase())) throw new Error(`expected to contain "${needle}", got: ${hay.substring(0, 300)}`);
}
function assertNotContains(hay: string, needle: string): void {
  if (hay.toLowerCase().includes(needle.toLowerCase())) throw new Error(`expected NOT to contain "${needle}", got: ${hay.substring(0, 300)}`);
}

// ── MCP client (with notification capture) ───────────────────────────

let msgId = 0;
const pending = new Map<number, (msg: any) => void>();
let buffer = "";
let notifications: any[] = [];

function send(proc: ChildProcess, msg: any): Promise<any> {
  return new Promise((resolve) => {
    const id = ++msgId;
    pending.set(id, resolve);
    proc.stdin!.write(JSON.stringify({ ...msg, id, jsonrpc: "2.0" }) + "\n");
  });
}
function attach(proc: ChildProcess): void {
  buffer = "";
  notifications = [];
  proc.stdout!.on("data", (data: Buffer) => {
    buffer += data.toString();
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.trim()) continue;
      let m: any;
      try { m = JSON.parse(line); } catch { continue; }
      if (m.id !== undefined && pending.has(m.id)) { pending.get(m.id)!(m); pending.delete(m.id); }
      else if (m.method === "notifications/holonovel/event") notifications.push(m.params);
    }
  });
}
async function boot(envOverrides: Record<string, string> = {}): Promise<ChildProcess> {
  const proc = spawn("npx", ["tsx", SERVER_SCRIPT], {
    env: { ...process.env, TTRPG_DATA_DIR: DATA_DIR, ...envOverrides },
    stdio: ["pipe", "pipe", "pipe"],
  });
  attach(proc);
  await send(proc, { method: "initialize", params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "competitive-gaps", version: "1" } } });
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
async function readResource(proc: ChildProcess, uri: string): Promise<string> {
  const resp = await send(proc, { method: "resources/read", params: { uri } });
  if (resp.error) throw new Error(`RPC error: ${JSON.stringify(resp.error)}`);
  const content = resp.result?.contents ?? [];
  return content.map((c: any) => (c?.text ?? "")).join("\n");
}
async function readPrompt(proc: ChildProcess, name: string, args: Record<string, string> = {}): Promise<string> {
  const resp = await send(proc, { method: "prompts/get", params: { name, arguments: args } });
  if (resp.error) throw new Error(`RPC error: ${JSON.stringify(resp.error)}`);
  const messages = resp.result?.messages ?? [];
  return messages.map((m: any) => (m?.content?.text ?? "")).join("\n");
}

async function newNovel(proc: ChildProcess, name: string): Promise<void> {
  await call(proc, "novel", { action: "create", name });
  await call(proc, "set_badge", { badge: "game_master" });
}

// ── Fixture package seeding ─────────────────────────────────────────

function packageContentHash(index: any[], model: any, tools: any[], resources: any[], prompts: any[]): string {
  const canonical = (obj: any) => JSON.stringify(JSON.parse(JSON.stringify(obj)));
  const h = createHash("sha256");
  for (const obj of [index, model, tools, resources, prompts]) h.update(canonical(obj));
  return h.digest("hex");
}
function seedPackage(slug: string, model: Record<string, any>, sourceLicense?: string): void {
  const dir = join(DATA_DIR, "rulesets", slug);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const index: any[] = [];
  const tools: any[] = [];
  const resources: any[] = [];
  const prompts: any[] = [];
  const manifest: any = {
    slug, name: slug, host_version: "0.0.0",
    package_format: PACKAGE_FORMAT,
    content_hash: packageContentHash(index, model, tools, resources, prompts),
    built_at: new Date().toISOString(), counts: {},
  };
  if (sourceLicense !== undefined) manifest.source_license = sourceLicense;
  for (const [name, obj] of Object.entries({
    "manifest.json": manifest, "index.json": index, "model.json": model,
    "tools.json": tools, "resources.json": resources, "prompts.json": prompts,
  })) {
    writeFileSync(join(dir, name), JSON.stringify(obj, null, 2) + "\n");
  }
}

async function main() {
  console.log("=== Competitive-gap features (T513–T519) ===\n");

  // ── T513 (REQ-075f) + T514 (REQ-339d) — NPC mind ──────────────────
  {
    const proc = await boot({ TTRPG_NPC_MIND: "on", TTRPG_NPC_AUTONOMY: "on" });
    await newNovel(proc, "mind-test");
    const create = await call(proc, "npc", { action: "create", name: "Innkeeper", goals: "Protect the cellar", disposition: "suspicious", mind: { private_journal: ["Owes a debt to the Thieves' Guild."], directive: "Suspicious of strangers; guards the cellar key.", auto_play: true } });
    const idMatch = create.match(/\((\w+)\)/);
    assert(idMatch, `npc create did not report an id: ${create}`);
    const npcId = idMatch![1];

    await test("T513/REQ-075f: GM surfaces the mind; Player badge strips it from every surface", async () => {
      const gmGet = await call(proc, "npc", { action: "get", npc_id: npcId });
      assertContains(gmGet, "mind");
      assertContains(gmGet, "directive");
      const gmResource = await readResource(proc, `npc://${npcId}?format=json`);
      assertContains(gmResource, "mind");
      await call(proc, "set_badge", { badge: "player" });
      const playerGet = await call(proc, "npc", { action: "get", npc_id: npcId });
      assertNotContains(playerGet, "mind");
      assertNotContains(playerGet, "directive");
      const playerResource = await readResource(proc, `npc://${npcId}?format=json`);
      assertNotContains(playerResource, "mind");
      await call(proc, "set_badge", { badge: "game_master" });
    });

    await test("T514/REQ-339d: NPC with a directive surfaces auto-apply; selecting it applies with [npc-mind]", async () => {
      const bb = await readPrompt(proc, "badge_briefing", { badge: "game_master" });
      assertContains(bb, "World in Motion");
      assertContains(bb, "auto-apply");
      const resp = await call(proc, "respond", { decision: "Innkeeper", option: "auto-apply" });
      assertContains(resp, "auto-applied");
    });
    proc.kill("SIGKILL");

    // T514b — with TTRPG_NPC_MIND off, no auto-apply option surfaces.
    const procB = await boot({ TTRPG_NPC_AUTONOMY: "on" });
    await newNovel(procB, "mind-off");
    await call(procB, "npc", { action: "create", name: "Guard", goals: "Stop intruders", disposition: "suspicious", mind: { directive: "Do not let anyone past." } });
    await test("T514/REQ-339d: auto-apply is absent when TTRPG_NPC_MIND is off", async () => {
      const bb = await readPrompt(procB, "badge_briefing", { badge: "game_master" });
      assertContains(bb, "World in Motion");
      assertNotContains(bb, "auto-apply");
    });
    procB.kill("SIGKILL");
  }

  // ── T515 (REQ-431) — procedural world generation ───────────────────
  {
    seedPackage("gentest", { generation_tables: { trinkets: { dice_expression: "1d100", ranges: [{ min: 1, max: 100, result: "a dusty trinket" }] } } });
    const proc = await boot();
    await newNovel(proc, "gen-test");
    await call(proc, "ruleset", { action: "bind", slug: "gentest" });

    await test("T515/REQ-431: world generate produces a deterministic batch offered as a decision", async () => {
      const g1 = await call(proc, "world", { action: "generate", seed: "42" });
      assertContains(g1, "NEED_INPUT");
      assertContains(g1, "Generated Chamber 1");
      assertContains(g1, "apply");
      const resp = await call(proc, "respond", { decision: "world_generate", option: "apply" });
      assertContains(resp, "World generated");
    });

    await test("T515/REQ-431: same seed reproduces the same world", async () => {
      const count = (s: string) => (s.match(/Generated Chamber (\d+) is a room/g) ?? []).length;
      await call(proc, "novel", { action: "create", name: "gen-repro" });
      await call(proc, "ruleset", { action: "bind", slug: "gentest" });
      const g1 = await call(proc, "world", { action: "generate", seed: "7" });
      await call(proc, "respond", { decision: "world_generate", option: "discard" });
      const g2 = await call(proc, "world", { action: "generate", seed: "7" });
      await call(proc, "respond", { decision: "world_generate", option: "discard" });
      assert(count(g1) === count(g2) && count(g1) > 0, `same seed must produce the same room count (got ${count(g1)} vs ${count(g2)})`);
    });

    await test("T515/REQ-431: Player badge is forbidden from world generate", async () => {
      await call(proc, "set_badge", { badge: "player" });
      const g = await call(proc, "world", { action: "generate", seed: "42" });
      assertContains(g, "FORBIDDEN");
      await call(proc, "set_badge", { badge: "game_master" });
    });
    proc.kill("SIGKILL");

    // Ruleset-free: content-absent.
    const proc3 = await boot();
    await newNovel(proc3, "gen-free");
    await test("T515/REQ-431: ruleset-free build returns the content-absent message", async () => {
      const g = await call(proc3, "world", { action: "generate", seed: "42" });
      assertContains(g, "No generation tables");
      assertNotContains(g, "NEED_INPUT");
    });
    proc3.kill("SIGKILL");
  }

  // ── T516 (REQ-296c) — knowledge-graph projections ─────────────────
  {
    const proc = await boot();
    await newNovel(proc, "graph-test");
    await call(proc, "world", { action: "create_room", name: "Throne Room", description: "grand" });
    await call(proc, "world", { action: "create_room", name: "Guard Room", description: "guarded" });
    await call(proc, "world", { action: "create_exit", direction: "east", room_a: "Throne Room", room_b: "Guard Room" });
    await call(proc, "npc", { action: "create", name: "Guard", location: "Guard Room" });
    await call(proc, "faction", { action: "create", name: "Merchant Guild", goals: ["Expand to East Dock"] });
    await call(proc, "faction", { action: "create", name: "Crown Loyalists", goals: ["Protect the throne"] });

    await test("T516/REQ-296c: political, timeline, and geography projections are distinct", async () => {
      const political = JSON.parse(await readResource(proc, "graph://novel/political"));
      const timeline = JSON.parse(await readResource(proc, "graph://novel/timeline"));
      const geography = JSON.parse(await readResource(proc, "graph://novel/geography"));
      assert(political.projection === "political", "political projection marker missing");
      assert(timeline.projection === "timeline", "timeline projection marker missing");
      assert(geography.projection === "geography", "geography projection marker missing");
      assert((political.factions ?? []).length >= 2, "political view should list factions");
      assert((geography.rooms ?? []).length >= 2, "geography view should list rooms");
      const defaultView = JSON.parse(await readResource(proc, "graph://novel"));
      assert(defaultView.entities !== undefined && defaultView.projection === undefined, "default adjacency list should not carry a projection");
    });
    proc.kill("SIGKILL");
  }

  // ── T517 (REQ-432) — vendor package certification ─────────────────
  {
    seedPackage("vendor-ok", {}, "CC BY 4.0");
    seedPackage("vendor-bad", {}, "PROPRIETARY-NO-SUCH-LICENSE");
    const proc = await boot();
    await newNovel(proc, "vendor-test");
    await test("T517/REQ-432: licensed vendor package lists license; unattributed one is held inactive", async () => {
      const list = JSON.parse(await call(proc, "ruleset", { action: "list" }));
      const ok = list.find((p: any) => p.slug === "vendor-ok");
      assert(ok, "vendor-ok should be listed");
      assert(ok.licensed === true, "vendor-ok should be licensed");
      assert(ok.source_license === "CC BY 4.0", "vendor-ok should carry its source_license");
      const bad = list.find((p: any) => p.slug === "vendor-bad");
      assert(!bad, "vendor-bad should be held inactive (absent from list)");
      const health = JSON.parse(await call(proc, "session", { action: "health" }));
      const alerts = health.ruleset_package_alerts ?? [];
      const unattributed = alerts.filter((a: any) => String(a.reason ?? "").includes("[license-unattributed]"));
      assert(unattributed.some((a: any) => String(a.slug) === "vendor-bad"), "vendor-bad should be flagged [license-unattributed]");
    });
    proc.kill("SIGKILL");
  }

  // ── T518 (REQ-072h) — player-safe recap GM channel ────────────────
  {
    const proc = await boot();
    await newNovel(proc, "recap-test");
    await test("T518/REQ-072h: gm_notes returns to GM, never to Player", async () => {
      const gm = await call(proc, "session", { action: "recap", gm_notes: "The real culprit is the butler." });
      assertContains(gm, "gm_notes");
      assertContains(gm, "butler");
      await call(proc, "set_badge", { badge: "player" });
      const player = await call(proc, "session", { action: "recap", gm_notes: "The real culprit is the butler." });
      assertNotContains(player, "gm_notes");
      assertNotContains(player, "butler");
    });
    proc.kill("SIGKILL");
  }

  // ── T519 (REQ-433) — event notification surface ───────────────────
  {
    const proc = await boot();
    await newNovel(proc, "notify-test");
    const sub = await call(proc, "session", { action: "subscribe", topics: ["countdown_fire"] });
    assertContains(sub, "countdown_fire");
    await test("T519/REQ-433: subscribed countdown_fire emits a notification on expiry", async () => {
      await call(proc, "countdown", { action: "set", name: "timer", ticks: 1, type: "narrative" });
      notifications = [];
      await call(proc, "countdown", { action: "advance", name: "timer" });
      await new Promise((r) => setTimeout(r, 100));
      assert(notifications.some((n) => n.topic === "countdown_fire" && n.name === "timer"), `countdown_fire notification missing: ${JSON.stringify(notifications)}`);
    });
    await test("T519/REQ-433: unsubscribed topics emit nothing", async () => {
      await call(proc, "session", { action: "subscribe", topics: [] });
      await call(proc, "countdown", { action: "set", name: "timer2", ticks: 1, type: "narrative" });
      notifications = [];
      await call(proc, "countdown", { action: "advance", name: "timer2" });
      await new Promise((r) => setTimeout(r, 100));
      assert(notifications.filter((n) => n.topic === "countdown_fire").length === 0, "unsubscribed topic should not emit");
    });
    proc.kill("SIGKILL");
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => { console.error("Harness fatal error:", e); process.exit(2); });
