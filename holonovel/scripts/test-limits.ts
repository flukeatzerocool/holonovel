#!/usr/bin/env node
// Property-group cardinality + Novel-health conformance harness
// (REQ-129, REQ-097; REQ-041 snapshot depth). Exercises Appendix F T143 and
// T101/T160 against live server processes booted with per-test configuration.

import { spawn, ChildProcess } from "node:child_process";
import { mkdtempSync, rmSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { installHarnessGuard, harnessComplete } from "./lib/harness-guard.js";
installHarnessGuard();

const SERVER_SCRIPT = join(import.meta.dirname!, "..", "src", "index.ts");
const DATA_DIR = mkdtempSync(join(tmpdir(), "holonovel-limits-test-"));

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
        const m = JSON.parse(line);
        if (m.id !== undefined && pending.has(m.id)) { pending.get(m.id)!(m); pending.delete(m.id); }
      } catch { /* non-JSON output */ }
    }
  });
}
async function boot(env: Record<string, string> = {}, dir: string = DATA_DIR): Promise<ChildProcess> {
  const proc = spawn("npx", ["tsx", SERVER_SCRIPT], {
    env: { ...process.env, TTRPG_DATA_DIR: dir, ...env },
    stdio: ["pipe", "pipe", "pipe"],
  });
  attach(proc);
  await send(proc, { method: "initialize", params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "limits", version: "1.0.0" } } });
  proc.stdin!.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n");
  await sleep(250);
  return proc;
}
async function call(proc: ChildProcess, name: string, args: Record<string, unknown> = {}): Promise<string> {
  const resp = await send(proc, { method: "tools/call", params: { name, arguments: args } });
  if (resp.error) throw new Error(`RPC error: ${JSON.stringify(resp.error)}`);
  return (resp.result?.content ?? []).map((c: any) => (c?.text ?? "")).join("\n");
}
function kill(proc: ChildProcess): Promise<void> {
  return new Promise((resolve) => {
    if (proc.exitCode !== null || proc.signalCode !== null) { resolve(); return; }
    let done = false;
    const finish = () => { if (!done) { done = true; resolve(); } };
    proc.on("exit", finish);
    proc.on("error", finish);
    try { proc.kill(); } catch { finish(); }
    setTimeout(finish, 5000);
  });
}
function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }
async function health(proc: ChildProcess): Promise<any> {
  return JSON.parse(await call(proc, "manage_session", { action: "health" }));
}
async function readResource(proc: ChildProcess, uri: string): Promise<string> {
  const resp = await send(proc, { method: "resources/read", params: { uri } });
  if (resp.error) throw new Error(`RPC error: ${JSON.stringify(resp.error)}`);
  return (resp.result?.contents ?? []).map((c: any) => (c?.text ?? "")).join("\n");
}
async function promptText(proc: ChildProcess, name: string, args: Record<string, unknown> = {}): Promise<string> {
  const resp = await send(proc, { method: "prompts/get", params: { name, arguments: args } });
  if (resp.error) throw new Error(`RPC error: ${JSON.stringify(resp.error)}`);
  return (resp.result?.messages ?? []).map((m: any) => m?.content?.text ?? "").join("\n");
}
async function freshNovel(proc: ChildProcess, slug: string): Promise<void> {
  await call(proc, "manage_novel", { action: "create", name: slug });
  await call(proc, "set_badge", { badge: "game_master" });
}

async function main() {
  console.log("=== Property-group cardinality + health (REQ-129 / REQ-097) ===\n");

  // ── Default maxima and health shape (T143 default / T101, T160) ────────
  {
    const proc = await boot();
    await freshNovel(proc, "limits-default");

    await test("T143/REQ-129: default cardinality reports current/max per group", async () => {
      for (let i = 0; i < 3; i++) {
        const r = await call(proc, "manage_npc", { action: "create", name: `npc-${i}` });
        assertContains(r, "[OK]");
      }
      const h = await health(proc);
      const c = h.cardinality?.npcs;
      if (!c || c.count !== 3 || c.max !== 500 || c.overflow !== false) {
        throw new Error(`npcs cardinality wrong: ${JSON.stringify(c)}`);
      }
      if (typeof h.healthy !== "boolean") throw new Error("healthy flag missing");
    });

    await test("T101/T160/REQ-097: spec_health reports Novel health fields", async () => {
      const h = await health(proc);
      for (const field of ["healthy", "health_warnings", "synthesis_gap_count", "story_journal_entries", "story_journal_chars", "snapshot_depth", "file_size", "cardinality"]) {
        if (!(field in h)) throw new Error(`missing health field ${field}`);
      }
      if (typeof h.file_size !== "number" || h.file_size <= 0) throw new Error(`file_size not positive: ${h.file_size}`);
      if (h.healthy !== true) throw new Error(`healthy should be true with no threshold hit: ${JSON.stringify(h.health_warnings)}`);
    });

    await kill(proc);
  }

  // ── Configured maxima: refusal, overflow, healthy=false (T143) ─────────
  {
    const proc = await boot({ TTRPG_MAX_NPCS: "3", TTRPG_MAX_COUNTDOWNS: "3", TTRPG_MAX_LORE_ENTRIES: "3" });
    await freshNovel(proc, "limits-capped");

    await test("T143/REQ-129: NPC cap refuses the over-max create with counts", async () => {
      for (let i = 0; i < 3; i++) await call(proc, "manage_npc", { action: "create", name: `npc-${i}` });
      const fourth = await call(proc, "manage_npc", { action: "create", name: "npc-3" });
      assertContains(fourth, "[STATE_CONFLICT]");
      assertContains(fourth, "NPCs at maximum (3/3)");
      const h = await health(proc);
      if (!h.cardinality.npcs.overflow) throw new Error("npcs overflow flag missing");
      if (h.healthy !== false) throw new Error("healthy should be false at maximum");
    });

    await test("T143/REQ-129: countdown cap refuses the over-max set", async () => {
      for (let i = 0; i < 3; i++) await call(proc, "manage_countdown", { action: "set", name: `cd-${i}`, ticks: 2, type: "narrative" });
      const fourth = await call(proc, "manage_countdown", { action: "set", name: "cd-3", ticks: 2, type: "narrative" });
      assertContains(fourth, "[STATE_CONFLICT]");
      assertContains(fourth, "countdowns at maximum");
    });

    await test("T143/REQ-129: lore cap refuses the over-max set but updates upsert", async () => {
      for (let i = 0; i < 3; i++) await call(proc, "manage_lore", { action: "set", key: `lore-${i}`, content: "c" });
      const fourth = await call(proc, "manage_lore", { action: "set", key: "lore-3", content: "c" });
      assertContains(fourth, "[STATE_CONFLICT]");
      assertContains(fourth, "lore entries at maximum");
      const update = await call(proc, "manage_lore", { action: "set", key: "lore-0", content: "updated" });
      assertContains(update, "[OK]");
    });

    await kill(proc);
  }

  // ── Zero maximum disables the group (T143) ─────────────────────────────
  {
    const proc = await boot({ TTRPG_MAX_NPCS: "0" });
    await freshNovel(proc, "limits-disabled");
    await test("T143/REQ-129: TTRPG_MAX_NPCS=0 disables manage_npc (create)", async () => {
      const r = await call(proc, "manage_npc", { action: "create", name: "blocked" });
      assertContains(r, "[STATE_CONFLICT]");
      assertContains(r, "disabled");
    });
    await kill(proc);
  }

  // ── Entities, roster, story, snapshot maxima ───────────────────────────
  {
    const proc = await boot({ TTRPG_MAX_ENTITIES: "2", TTRPG_MAX_STORY_ENTRIES: "1", TTRPG_MAX_SNAPSHOT_DEPTH: "12" });
    await freshNovel(proc, "limits-others");

    await test("T143/REQ-129: entity cap refuses the over-max character create", async () => {
      await call(proc, "manage_character", { action: "create", name: "pc-a" });
      await call(proc, "manage_character", { action: "create", name: "pc-b" });
      const third = await call(proc, "manage_character", { action: "create", name: "pc-c" });
      assertContains(third, "[STATE_CONFLICT]");
      assertContains(third, "entities at maximum (2/2)");
    });

    await test("T143/REQ-129: story-journal cap refuses the over-max record", async () => {
      await call(proc, "manage_story", { action: "record", type: "moment", entry: "first" });
      const second = await call(proc, "manage_story", { action: "record", type: "moment", entry: "second" });
      assertContains(second, "[STATE_CONFLICT]");
      assertContains(second, "story journal entries at maximum (1/1)");
    });

    await test("T143/REQ-129: snapshot-depth maximum is reported", async () => {
      const h = await health(proc);
      if (h.cardinality.snapshots.max !== 12) throw new Error(`snapshot max wrong: ${JSON.stringify(h.cardinality.snapshots)}`);
    });

    await kill(proc);
  }

  // ── Checkpoints: cap, export inclusion, health (REQ-241b/c) ────────────
  {
    const proc = await boot({ TTRPG_MAX_CHECKPOINTS: "1" });
    await freshNovel(proc, "ckpt-cap");
    await test("T279/REQ-241b: TTRPG_MAX_CHECKPOINTS discards the oldest", async () => {
      await call(proc, "manage_novel", { action: "checkpoint_set", label: "first" });
      await call(proc, "manage_novel", { action: "checkpoint_set", label: "second" });
      const list = JSON.parse(await call(proc, "manage_novel", { action: "checkpoint_list" }));
      if (list.length !== 1 || list[0].label !== "second") throw new Error(`cap not applied: ${JSON.stringify(list)}`);
      const h = await health(proc);
      if (h.checkpoint_count !== 1 || typeof h.checkpoint_bytes !== "number") throw new Error(`health checkpoint fields wrong: ${JSON.stringify({ c: h.checkpoint_count, b: h.checkpoint_bytes })}`);
    });
    await test("T279/REQ-241b: export omits checkpoints unless include_checkpoints", async () => {
      const without = JSON.parse(await call(proc, "manage_novel", { action: "export", format: "json", scope: "full" }));
      if ("checkpoints" in (without.novel ?? {})) throw new Error("checkpoints present without include_checkpoints");
      const withCp = JSON.parse(await call(proc, "manage_novel", { action: "export", format: "json", scope: "full", include_checkpoints: true }));
      if (!("checkpoints" in (withCp.novel ?? {}))) throw new Error("checkpoints missing with include_checkpoints=true");
    });
    await kill(proc);
  }

  // ── Export adventure embedding (REQ-096h/i1) ───────────────────────────
  {
    const proc = await boot({ TTRPG_EXPORT_EMBED_ADVENTURES: "true" });
    await freshNovel(proc, "embed-adv");
    await test("T100/REQ-096h: TTRPG_EXPORT_EMBED_ADVENTURES embeds adventure content", async () => {
      await call(proc, "manage_adventure", { action: "generate", premise: "A sealed lighthouse." });
      const out = JSON.parse(await call(proc, "manage_novel", { action: "export", format: "json", scope: "full" }));
      if (out.manifest.adventures_embedded !== true) throw new Error("adventures_embedded not true");
      if (!out.adventure || !out.adventure.content_hash) throw new Error(`adventure not embedded: ${JSON.stringify(out.adventure)}`);
    });
    await kill(proc);
  }

  // ── Novel compression (REQ-092g/h1) ─────────────────────────────────────
  {
    const dir = mkdtempSync(join(tmpdir(), "holonovel-compress-"));
    const proc = await boot({ TTRPG_NOVEL_COMPRESS: "true" }, dir);
    await freshNovel(proc, "compressed");
    await test("T475/REQ-092g: TTRPG_NOVEL_COMPRESS writes a gzip file that reloads", async () => {
      const files = readdirSync(join(dir, "novels")).filter((f) => f.endsWith(".json"));
      const buf = readFileSync(join(dir, "novels", files[0]));
      if (!(buf[0] === 0x1f && buf[1] === 0x8b)) throw new Error("novel file is not gzip");
    });
    await kill(proc);
    const proc2 = await boot({}, dir);
    await test("T475/REQ-092h1: compressed Novel reloads under disabled compression with [compression-mismatch]", async () => {
      const listed = await call(proc2, "manage_novel", { action: "list" });
      if (!listed.includes("compressed")) throw new Error(`compressed novel did not reload: ${listed.substring(0, 160)}`);
      const h = JSON.parse(await call(proc2, "manage_session", { action: "health" }));
      const mism = Object.keys(h.data_health?.compression_mismatch ?? {});
      if (mism.length === 0) throw new Error(`no compression mismatch surfaced: ${JSON.stringify(h.data_health)}`);
    });
    await kill(proc2);
    rmSync(dir, { recursive: true, force: true });
  }

  // ── Audit-log compaction across sessions (REQ-239) ─────────────────────
  {
    const dir = mkdtempSync(join(tmpdir(), "holonovel-compact-"));
    // Three distinct sessions produce three [session-boundary] markers.
    let p = await boot({ TTRPG_SESSION_ID: "s1" }, dir);
    await call(p, "manage_novel", { action: "create", name: "compact-novel" });
    await call(p, "set_badge", { badge: "game_master" });
    await call(p, "manage_note", { action: "set", key: "n1", content: "one" });
    await kill(p);
    p = await boot({ TTRPG_SESSION_ID: "s2" }, dir);
    await call(p, "manage_novel", { action: "resume", slug: "compact-novel" });
    await call(p, "set_badge", { badge: "game_master" });
    await call(p, "manage_note", { action: "set", key: "n2", content: "two" });
    await kill(p);
    p = await boot({ TTRPG_SESSION_ID: "s3" }, dir);
    await call(p, "manage_novel", { action: "resume", slug: "compact-novel" });
    await call(p, "set_badge", { badge: "game_master" });
    await call(p, "manage_note", { action: "set", key: "n3", content: "three" });

    await test("T277/REQ-239: compress archives old sessions and keeps the hash chain valid", async () => {
      const ni = await call(p, "manage_session", { action: "compress", sessions: 2 });
      assertContains(ni, "[NEED_INPUT]");
      const done = await call(p, "respond_decision", { decision: "compress_audit:2", option: "yes" });
      assertContains(done, "[OK]");
      assertContains(done, "compacted");
      const archive = JSON.parse(await readResource(p, "audit://novel/archive"));
      if (!Array.isArray(archive) || archive.length !== 1 || archive[0].session_id !== "s1") {
        throw new Error(`archive wrong: ${JSON.stringify(archive)}`);
      }
      if (typeof archive[0].entry_count !== "number" || !("confrontations" in archive[0]) || !("significant_rolls" in archive[0])) {
        throw new Error(`summary fields missing: ${JSON.stringify(archive[0])}`);
      }
      const h = await health(p);
      if (h.audit_chain?.valid !== true) throw new Error(`hash chain broken after compaction: ${JSON.stringify(h.audit_chain)}`);
      const recap = await call(p, "manage_session", { action: "recap", session_id: "s1" });
      assertContains(recap, "archived_session: s1");
    });
    await kill(p);
    rmSync(dir, { recursive: true, force: true });
  }

  // ── Briefing / intro / badge / auto-record (REQ-084a2, 030/055a, 063b, 405, 246a) ──
  {
    const proc = await boot({ TTRPG_MAX_AVAILABLE_ACTIONS: "2", TTRPG_BADGE: "game_master", TTRPG_NOVEL_PREVIEW_CHARS: "10", TTRPG_AUTO_RECORD: "false", TTRPG_STORY_JOURNAL_DISPLAY: "full" });
    await call(proc, "manage_novel", { action: "create", name: "brief-novel", description: "A long description sentence that continues beyond the preview budget for sure." });

    await test("T148/REQ-084a2: badge_briefing carries a capped available_actions section", async () => {
      const b = await promptText(proc, "badge_briefing");
      assertContains(b, "Available Actions (available_actions)");
      const section = b.split("available_actions)")[1]?.split("\n\n")[0] ?? "";
      const bullets = section.split("\n").filter((l) => l.trim().startsWith("-"));
      if (bullets.length > 2) throw new Error(`cap not applied: ${bullets.length} actions`);
      const h = await health(proc);
      const tok = (h.section_tokens ?? []).find((t: any) => t.token === "available_actions");
      if (!tok) throw new Error("available_actions token missing from spec_health");
    });

    await test("T9/REQ-030/REQ-055a: TTRPG_BADGE sets the initial badge on a new Novel", async () => {
      const h = await health(proc);
      if (h.active_badge !== "game_master") throw new Error(`initial badge wrong: ${h.active_badge}`);
    });

    await test("T49/REQ-063b: intro preview honors TTRPG_NOVEL_PREVIEW_CHARS and lists session/synthesis", async () => {
      const intro = await promptText(proc, "intro");
      assertContains(intro, "…");
      assertContains(intro, "sessions ");
      assertContains(intro, "synthesis");
    });

    await test("T474/REQ-405: TTRPG_AUTO_RECORD=false disables auto-moment by default", async () => {
      const out = JSON.parse(await call(proc, "manage_novel", { action: "export", format: "json", scope: "full" }));
      if (out.novel?.auto_record !== false) throw new Error(`auto_record not false: ${out.novel?.auto_record}`);
    });

    await test("T408/REQ-246a: TTRPG_STORY_JOURNAL_DISPLAY=full returns full entries", async () => {
      await call(proc, "manage_story", { action: "record", type: "moment", entry: "A complete journal entry far longer than any preview would show." });
      const list = JSON.parse(await call(proc, "manage_story", { action: "list" }));
      if (!list[0] || typeof list[0].entry !== "string") throw new Error(`full entry not returned: ${JSON.stringify(list[0])}`);
    });

    await kill(proc);
  }

  harnessComplete();
  console.log(`\n${passed} passed, ${failed} failed`);
  rmSync(DATA_DIR, { recursive: true, force: true });
  if (failed > 0) process.exit(1);
  process.exit(0);
}

main().catch((e) => { console.error("Fatal:", e); process.exit(2); });
