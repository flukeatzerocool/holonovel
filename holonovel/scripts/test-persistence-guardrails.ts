#!/usr/bin/env node
// §5.19 State Persistence Guardrails conformance harness (REQ-400 through [gate]
// REQ-407, plus REQ-001a corruption reporting). Exercises T469–T476 and T175
// (persistence directive, state_ledger token, session no-mutation detection,
// state-drift gate, roll-to-commit coupling, auto-moment on transitions,
// backup regression visibility, persist-tools, corruption surfacing).

import { spawn, ChildProcess } from "node:child_process";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, readFileSync, existsSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createHash } from "node:crypto";
import { installHarnessGuard, harnessComplete } from "./lib/harness-guard.js";
installHarnessGuard();

const SERVER_SCRIPT = join(import.meta.dirname!, "..", "src", "index.ts");
const DATA_DIR = mkdtempSync(join(tmpdir(), "holonovel-persistence-guardrails-"));

let passed = 0;
let failed = 0;
async function test(name: string, fn: () => void | Promise<void>): Promise<void> {
  try { await fn(); passed++; console.log(`  PASS ${name}`); }
  catch (e: any) { failed++; console.error(`  FAIL ${name}: ${e.message}`); }
}
function assertContains(hay: string, needle: string): void {
  if (!hay.toLowerCase().includes(needle.toLowerCase())) throw new Error(`expected to contain "${needle}", got: ${hay.substring(0, 300)}`);
}
function assertNotContains(hay: string, needle: string): void {
  if (hay.toLowerCase().includes(needle.toLowerCase())) throw new Error(`expected NOT to contain "${needle}", got: ${hay.substring(0, 300)}`);
}

let msgId = 0;
const pending = new Map<number, (msg: any) => void>();
let buffer = "";
let stderrBuffer = "";
function send(proc: ChildProcess, msg: any): Promise<any> {
  return new Promise((resolve) => {
    const id = ++msgId;
    pending.set(id, resolve);
    proc.stdin!.write(JSON.stringify({ ...msg, id, jsonrpc: "2.0" }) + "\n");
  });
}
function attach(proc: ChildProcess): void {
  buffer = "";
  proc.stderr!.on("data", (data: Buffer) => { stderrBuffer += data.toString(); });
  proc.stdout!.on("data", (data: Buffer) => {
    buffer += data.toString();
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const m = JSON.parse(line);
        if (m.id !== undefined && pending.has(m.id)) { pending.get(m.id)!(m); pending.delete(m.id); }
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
  await send(proc, { method: "initialize", params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "persist-guard", version: "1.0.0" } } });
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
async function briefing(proc: ChildProcess): Promise<string> {
  const resp = await send(proc, { method: "prompts/get", params: { name: "badge_briefing", arguments: {} } });
  const messages = resp.result?.messages ?? [];
  return messages.map((m: any) => (m?.content?.text ?? "")).join("\n");
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

async function main() {
  console.log("=== §5.19 State Persistence Guardrails (REQ-400–407) ===\n");
  mkdirSync(DATA_DIR, { recursive: true });

  {
    const proc = await boot();
    await call(proc, "manage_novel", { action: "create",  name: "guardrails" });
    await call(proc, "set_badge", { badge: "game_master" });

    await test("T469/REQ-400: State-Persistence Directive in GM briefing", async () => {
      const b = await briefing(proc);
      assertContains(b, "State persistence");
      assertContains(b, "scene, action: set");
      // REQ-400 — the eight categories the directive previously omitted, each
      // named with the tool that commits it (base-capability is in the same
      // sentence and asserted separately).
      for (const token of [
        "manage_diagnostics (action: event)",
        "manage_belief (action: evidence)",
        "manage_identity (action: accept)",
        "manage_causality (action: causal_propose)",
        "manage_corpus (action: corpus_register)",
        "manage_agent (action: create)",
        "manage_belief (action: perception_record)",
        "manage_belief (action: subjective_record)",
      ]) {
        assertContains(b, token);
      }
      assertContains(b, "base-capability");
    });

    await test("T469/REQ-135: the persistence directive survives a small briefing budget", async () => {
      const small = await boot({ TTRPG_MAX_BRIEFING_TOKENS: "200" });
      await call(small, "manage_novel", { action: "create", name: "budget-novel" });
      await call(small, "set_badge", { badge: "game_master" });
      const b = await briefing(small);
      assertContains(b, "State persistence");
      if (!b.includes("manage_belief (action: evidence)")) {
        const i = b.indexOf("State persistence");
        throw new Error(`budget briefing directive window: ${b.substring(i, i + 600)}`);
      }
      await kill(small);
    });

    await test("T470/REQ-401: state_ledger token renders with mutation counts", async () => {
      await call(proc, "manage_note", { action: "set",  key: "ledger-note", content: "v" });
      const b = await briefing(proc);
      assertContains(b, "state_ledger");
      assertContains(b, "note: 1");
      // REQ-401 — the ledger carries the last-mutation ISO timestamp.
      if (!/Last state mutation: \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(b)) {
        throw new Error(`state_ledger has no ISO last-mutation timestamp: ${b.substring(0, 400)}`);
      }
      // REQ-401/REQ-403a — an active drift marker renders in the token.
      await call(proc, "manage_novel", { action: "save_context", current_scene: "drift ledger scene" });
      const driftBriefing = await briefing(proc);
      assertContains(driftBriefing, "[state-drift]");
    });

    await test("T10/REQ-041: note, corpus, and causal mutations are undoable", async () => {
      await call(proc, "manage_note", { action: "set",  key: "undo-note", content: "before" });
      await call(proc, "manage_history", { action: "undo" });
      const notes = await call(proc, "manage_note", { action: "list" });
      assertNotContains(notes, "undo-note");

      await call(proc, "manage_corpus", { action: "corpus_register",  corpus_title: "Undo Doc", corpus_body: "body", corpus_domain: "lore" });
      assertContains(await call(proc, "manage_corpus", { action: "corpus_list" }), "Undo Doc");
      await call(proc, "manage_history", { action: "undo" });
      assertNotContains(await call(proc, "manage_corpus", { action: "corpus_list" }), "Undo Doc");

      await call(proc, "manage_causality", { action: "causal_propose",  causal_entity: "npc_1", causal_key: "location", causal_value: "hall" });
      assertContains(await call(proc, "manage_causality", { action: "causal_list" }), "npc_1");
      await call(proc, "manage_history", { action: "undo" });
      assertNotContains(await call(proc, "manage_causality", { action: "causal_list" }), "npc_1");
    });

    await test("T10/REQ-041b: snapshot truncation is audited on a fresh stack", async () => {
      const p = await boot({ TTRPG_MAX_SNAPSHOT_DEPTH: "10" });
      await call(p, "manage_novel", { action: "create", name: "truncation" });
      await call(p, "set_badge", { badge: "game_master" });
      const auditText = async () => {
        const resp = await send(p, { method: "resources/read", params: { uri: "audit://novel" } });
        return (resp.result?.contents ?? []).map((c: any) => c.text ?? "").join("\n");
      };
      const countTruncations = (text: string) => text.split("\n").filter((l: string) => l.includes("[snapshot-truncated]")).length;
      const before = countTruncations(await auditText());
      for (let i = 0; i < 6; i++) await call(p, "manage_scene", { action: "set", description: `scene-${i}` });
      const midTruncations = countTruncations(await auditText());
      if (midTruncations !== before) throw new Error(`REQ-041b truncated early: ${before} -> ${midTruncations}`);
      for (let i = 6; i < 12; i++) await call(p, "manage_scene", { action: "set", description: `scene-${i}` });
      const after = countTruncations(await auditText());
      if (after - before !== 2) throw new Error(`REQ-041b expected 2 truncation entries after 12 mutations, got ${after - before}`);
      const health = JSON.parse(await call(p, "manage_diagnostics", { action: "health" }));
      if (!health.audit_chain || health.audit_chain.valid !== true) throw new Error("REQ-041b truncation broke the audit chain");
      const line = (await auditText()).split("\n").find((l: string) => l.includes("[snapshot-truncated]")) ?? "";
      assertContains(line, "discarded_timestamp");
      assertContains(line, "game_master");
      await kill(p);
    });

    await test("T10/REQ-041a: undo under a second badge reverses the newest mutation under another badge", async () => {
      // Fresh Novel on its own process: `manage_novel create` takes no snapshot,
      // so the final all-empty assertion is exact.
      const p = await boot();
      await call(p, "manage_novel", { action: "create", name: "cross-badge" });
      await call(p, "set_badge", { badge: "game_master" });
      await call(p, "manage_note", { action: "set", key: "gm-note", content: "gm-value" });
      await call(p, "set_badge", { badge: "player" });
      await call(p, "manage_note", { action: "set", key: "player-note", content: "player-value", badge_scope: "player" });
      await call(p, "set_badge", { badge: "game_master" });
      // The undo runs under the GM badge but must pick the Player's newer snapshot.
      assertContains(await call(p, "manage_history", { action: "undo" }), "[OK]");
      const afterFirst = await call(p, "manage_note", { action: "list" });
      assertContains(afterFirst, "gm-note");
      assertNotContains(afterFirst, "player-note");
      // ... and the GM's own earlier mutation is now the newest.
      assertContains(await call(p, "manage_history", { action: "undo" }), "[OK]");
      assertNotContains(await call(p, "manage_note", { action: "list" }), "gm-note");
      // Empty means no stack has an entry, not just the caller's (REQ-041b).
      await call(p, "set_badge", { badge: "player" });
      assertContains(await call(p, "manage_history", { action: "undo" }), "[STATE_CONFLICT]");
      await kill(p);
    });

    await test("T10/REQ-041a: redo after a cross-badge undo restores from the caller's stack", async () => {
      const p = await boot();
      await call(p, "manage_novel", { action: "create", name: "cross-badge-redo" });
      await call(p, "set_badge", { badge: "game_master" });
      await call(p, "manage_note", { action: "set", key: "gm-redo-note", content: "kept" });
      await call(p, "set_badge", { badge: "player" });
      await call(p, "manage_note", { action: "set", key: "player-redo-note", content: "reverted", badge_scope: "player" });
      await call(p, "set_badge", { badge: "game_master" });
      await call(p, "manage_history", { action: "undo" });
      assertNotContains(await call(p, "manage_note", { action: "list" }), "player-redo-note");
      // The undo targeted the Player's newer snapshot; the GM's own mutation
      // must survive it, otherwise this assertion could pass on the old
      // caller-only behaviour.
      assertContains(await call(p, "manage_note", { action: "list" }), "gm-redo-note");
      assertContains(await call(p, "manage_history", { action: "redo" }), "[OK]");
      assertContains(await call(p, "manage_note", { action: "list" }), "player-redo-note");
      await kill(p);
    });

    await test("T10/REQ-041a: a refused capability call pushes no snapshot and clears no redo", async () => {
      // Each cycle: one capability mutation, one refused call, then undo must
      // reverse the mutation (proving no snapshot was pushed) and redo must
      // still be available (proving the redo stack was not cleared).
      const aspectCycle = async (aspect: string, refuse: () => Promise<string>, code: string) => {
        await call(proc, "resolve_mechanic", { action: "fate_aspect", op: "create", name: aspect, target: "scene" });
        assertContains(await refuse(), code);
        await call(proc, "manage_history", { action: "undo" });
        assertNotContains(await call(proc, "resolve_mechanic", { action: "fate_aspect", op: "list" }), aspect);
        assertContains(await call(proc, "manage_history", { action: "redo" }), "[OK]");
        assertContains(await call(proc, "resolve_mechanic", { action: "fate_aspect", op: "list" }), aspect);
      };

      // REQ-436 — spending above the Fate balance.
      await aspectCycle("Refusal Aspect A",
        () => call(proc, "resolve_mechanic", { action: "fate_point", op: "spend", entity_id: "pc_a", amount: 99 }),
        "[RULE_VIOLATION]");

      // REQ-435 — invoking an aspect with zero Fate points.
      await call(proc, "resolve_mechanic", { action: "fate_point", op: "spend", entity_id: "pc_zero", amount: 3 });
      await aspectCycle("Refusal Aspect B",
        () => call(proc, "resolve_mechanic", { action: "fate_aspect", op: "invoke", name: "Refusal Aspect B", entity_id: "pc_zero" }),
        "[RULE_VIOLATION]");

      // REQ-442 — resisting above the stress track.
      await call(proc, "resolve_mechanic", { action: "forged_stress", op: "mark", entity_id: "pc_f", amount: 7, name: "Wound" });
      await aspectCycle("Refusal Aspect C",
        () => call(proc, "resolve_mechanic", { action: "forged_stress", op: "resist", entity_id: "pc_f", name: "Wound", cost: 2 }),
        "[RULE_VIOLATION]");

      // REQ-440 — marking a progress track that does not exist.
      await aspectCycle("Refusal Aspect D",
        () => call(proc, "resolve_mechanic", { action: "ironsworn_progress", op: "mark", name: "No Such Track", ticks: 1 }),
        "[NOT_FOUND]");

      // Unknown ops are refusals too, and must not leave a state entry behind.
      await aspectCycle("Refusal Aspect E",
        () => call(proc, "resolve_mechanic", { action: "fate_stress", op: "bogus", entity_id: "ghost_stress" }),
        "[INVALID_INPUT]");
      assertNotContains(await call(proc, "resolve_mechanic", { action: "fate_stress", op: "list" }), "ghost_stress");
      await aspectCycle("Refusal Aspect F",
        () => call(proc, "resolve_mechanic", { action: "forged_stress", op: "bogus", entity_id: "ghost_forged" }),
        "[INVALID_INPUT]");
      assertNotContains(await call(proc, "resolve_mechanic", { action: "forged_stress", op: "list" }), "ghost_forged");
    });

    await test("T476/REQ-407: persistence tools listed for GM regardless of scene type", async () => {
      await call(proc, "manage_scene", { action: "set",  description: "combat scene", scene_type: "combat" });
      const b = await briefing(proc);
      assertContains(b, "Persistence tools");
      for (const tool of ["manage_scene (set)", "manage_story (record)", "manage_countdown (set)", "manage_note (set)", "manage_character (personality)", "manage_npc (create)", "manage_vow (set)", "manage_diagnostics (event)", "manage_belief (admit/perception_record/subjective_record)", "manage_identity (accept)", "manage_causality (causal_propose)", "manage_corpus (corpus_register)", "manage_knowledge (index_build/graph_build)", "manage_agent (create)", "resolve_mechanic (fate_aspect)", "resolve_mechanic (ironsworn_momentum)", "resolve_mechanic (forged_stress)"]) {
        if (!b.includes(tool)) throw new Error(`missing persist tool ${tool}`);
      }
    });

    await test("T473/REQ-404: uncommitted roll flagged and cleared by commit", async () => {
      await call(proc, "manage_scene", { action: "oracle",  question: "Do they notice?", seed: "z1" });
      const recap = await call(proc, "manage_context", { action: "recap" });
      assertContains(recap, "[uncommitted-roll]");
      await call(proc, "manage_note", { action: "set",  key: "commit-note", content: "v" });
      const recap2 = await call(proc, "manage_context", { action: "recap" });
      assertNotContains(recap2, "[uncommitted-roll]");
    });

    await test("T473/REQ-404: base-capability roll names its commit tool", async () => {
      await call(proc, "resolve_mechanic", { action: "forged_action_roll",  name: "Skirmish", dice: 2, seed: "x1" });
      const recap = await call(proc, "manage_context", { action: "recap" });
      assertContains(recap, "[uncommitted-roll]");
      assertContains(recap, "resolve_mechanic (action: forged_stress)");
      await call(proc, "resolve_mechanic", { action: "forged_stress",  op: "mark", entity_id: "pc_1", amount: 1 });
      const recap2 = await call(proc, "manage_context", { action: "recap" });
      assertNotContains(recap2, "[uncommitted-roll]");
    });

    await test("T474/REQ-405: auto-moment recorded on scene transition", async () => {
      await call(proc, "manage_scene", { action: "set",  description: "Transition A" });
      await call(proc, "manage_scene", { action: "set",  description: "Transition B" });
      const exp = JSON.parse(await call(proc, "manage_archive", { action: "export",  format: "json" }));
      const story = exp.novel?.story_journal ?? exp.story_journal ?? [];
      const moments = story.filter((s: any) => s.type === "moment");
      if (moments.length < 1) throw new Error(`no auto-moments, got ${story.length} journal entries`);
    });

    await test("T474/REQ-405: a resolved combat round appends a moment", async () => {
      await call(proc, "manage_scene", { action: "set", description: "Combat hall" });
      await call(proc, "manage_combat", { action: "init", participants: [], dangers: [{ name: "goblin" }] });
      const before = JSON.parse(await call(proc, "manage_archive", { action: "export", format: "json" }));
      const beforeCount = (before.novel?.story_journal ?? []).filter((s: any) => String(s.entry ?? "").includes("Combat round")).length;
      await call(proc, "manage_combat", { action: "advance" });
      await call(proc, "manage_combat", { action: "advance" });
      const after = JSON.parse(await call(proc, "manage_archive", { action: "export", format: "json" }));
      const rounds = (after.novel?.story_journal ?? []).filter((s: any) => String(s.entry ?? "").startsWith("Combat round"));
      if (rounds.length < beforeCount + 2) {
        throw new Error(`combat rounds did not append moments: before ${beforeCount}, after ${rounds.length}`);
      }
      if (!rounds[rounds.length - 1].scene_anchor || !rounds[rounds.length - 1].timestamp) {
        throw new Error(`combat moment missing anchor/timestamp: ${JSON.stringify(rounds[rounds.length - 1])}`);
      }
      await call(proc, "manage_combat", { action: "end", outcome: "test" });
    });

    await kill(proc);
  }

  {
    const proc = await boot({ TTRPG_STATE_GATE: "warn" });
    await call(proc, "manage_novel", { action: "create",  name: "gate-novel" });
    await call(proc, "set_badge", { badge: "game_master" });
    await test("T472/REQ-403a: a context save alone activates drift", async () => {
      await call(proc, "manage_novel", { action: "save_context",  current_scene: "Gate scene", immediate_situation: "The gate is barred." });
      const health = JSON.parse(await call(proc, "manage_diagnostics", { action: "health" }));
      const markers = health.state_health?.markers ?? [];
      if (!markers.includes("[state-drift]")) {
        throw new Error(`[state-drift] missing from spec_health: ${JSON.stringify(health.state_health)}`);
      }
      const recap = await call(proc, "manage_context", { action: "recap" });
      assertContains(recap, "[state-drift]");
      assertContains(recap, "Commit each narrated beat");
      // REQ-403b — the warning names the saved beats and the tools that commit
      // them, and the recap enumerates the same beats.
      assertContains(recap, "Uncommitted beats:");
      assertContains(recap, "current_scene");
      assertContains(recap, "manage_scene (action: set)");
      assertContains(recap, "immediate_situation");
      assertContains(recap, "manage_story (action: record)");
    });

    await test("T472/REQ-403b: TTRPG_STATE_GATE=warn does not block and warns", async () => {
      const sw = await call(proc, "manage_novel", { action: "switch",  slug: "gate-novel" });
      assertContains(sw, "[OK]");
      assertContains(sw, "Commit each narrated beat");
      assertContains(sw, "Uncommitted beats:");
      assertContains(sw, "manage_scene (action: set)");
    });

    await test("T472/REQ-403a: a story-state mutation clears drift", async () => {
      await call(proc, "manage_note", { action: "set",  key: "drift", content: "committed" });
      const health = JSON.parse(await call(proc, "manage_diagnostics", { action: "health" }));
      if (health.state_health?.drift_active !== false) {
        throw new Error(`drift did not clear: ${JSON.stringify(health.state_health)}`);
      }
      const markers = health.state_health?.markers ?? [];
      if (markers.includes("[state-drift]")) throw new Error("[state-drift] survived a story-state mutation");
    });
    await kill(proc);
  }

  {
    const proc = await boot({ TTRPG_STATE_GATE: "block" });
    await call(proc, "manage_novel", { action: "create",  name: "block-novel" });
    await call(proc, "set_badge", { badge: "game_master" });
    await test("T472/REQ-403b: block refuses switch while drift is active", async () => {
      await call(proc, "manage_novel", { action: "save_context",  current_scene: "Clean" });
      const sw = await call(proc, "manage_novel", { action: "switch",  slug: "block-novel" });
      assertContains(sw, "STATE_CONFLICT");
      const pc = await call(proc, "manage_novel", { action: "save_context",  current_scene: "Still clean" });
      assertContains(pc, "[OK]");
    });
    await test("T472/REQ-403b: a story-state mutation clears the gate", async () => {
      await call(proc, "manage_note", { action: "set",  key: "gate", content: "v" });
      const sw = await call(proc, "manage_novel", { action: "switch",  slug: "block-novel" });
      assertContains(sw, "[OK]");
    });
    await kill(proc);
  }

  {
    const proc = await boot();
    await call(proc, "manage_novel", { action: "create",  name: "mut-novel" });
    await call(proc, "set_badge", { badge: "game_master" });
    await call(proc, "manage_note", { action: "set",  key: "m", content: "v" });
    await call(proc, "manage_vow", { action: "set",  name: "The Quest", description: "d", parties: [], difficulty: "dangerous" });
    await test("T470/REQ-401: mutation counts tracked per group", async () => {
      const b = await briefing(proc);
      assertContains(b, "note: 1");
      assertContains(b, "vow: 1");
    });

    await test("T471/REQ-402: session close with zero mutations surfaces [session-no-mutations]", async () => {
      // Create a fresh novel, make no state writes, then close its session by
      // resuming it again — the zero-mutation window should be recorded.
      await call(proc, "manage_novel", { action: "create",  name: "silent-session" });
      await call(proc, "set_badge", { badge: "game_master" });
      await call(proc, "manage_novel", { action: "switch",  slug: "mut-novel" });
      await call(proc, "manage_novel", { action: "resume",  slug: "silent-session" });
      await call(proc, "set_badge", { badge: "game_master" });
      // Resuming again closes silent-session's first (zero-mutation) window.
      await call(proc, "manage_novel", { action: "switch",  slug: "mut-novel" });
      await call(proc, "manage_novel", { action: "resume",  slug: "silent-session" });
      const recap = await call(proc, "manage_context", { action: "recap" });
      assertContains(recap, "session-no-mutations");
      const health = JSON.parse(await call(proc, "manage_diagnostics", { action: "health" }));
      const markers = health.state_health?.markers ?? [];
      if (!markers.includes("[session-no-mutations]")) {
        throw new Error(`[session-no-mutations] missing from spec_health: ${JSON.stringify(health.state_health)}`);
      }
      const windows = health.state_health?.session_no_mutation_windows ?? [];
      if (windows.length === 0) throw new Error("no session window recorded in state_health");
      // REQ-402 — the recap names the session that recorded no state writes.
      assertContains(recap, String(windows[0]));
    });

    await test("T475/REQ-406: backup restore surfaces [state-regression]", async () => {
      // Simulate a corrupt save with a backup present: write a novel file, then
      // corrupt the primary and rely on the .bak path. The state_regression
      // marker should surface in spec_health after resume.
      const novelDir = join(DATA_DIR, "novels");
      mkdirSync(novelDir, { recursive: true });
      const file = join(novelDir, "corrupt-novel.json");
      const bak = file + ".bak";
      const good = JSON.stringify({ slug: "corrupt-novel", name: "corrupt-novel", badge: "game_master", entities: {}, npcs: {}, scene_description: "", scene_location: null, scene_time_of_day: null, scene_atmosphere: null, scene_history: [], scene_beat: "", scene_type: ["neutral"], narrative_directive: "", combat: null, countdowns: {}, lore: {}, briefing_assembly_count: 0, player_signals: {}, adventure_slug: null, generated_adventure: null, audit_log: [{ timestamp: new Date().toISOString(), badge: "game_master", tool: "create_novel", args: "{}", output_prefix: "", hash: "aaaaaaaa" }], undo_stacks: {}, redo_stacks: {}, briefing_order: [], action_patterns_enabled: true, session_zero_completed: false, characters_present: false, characters_present_ids: [], adventure_set: false, pending_workflow: null, connection_counter: 0, pending_staleness_counter: 0, pov_mode: "character", autonomy: {}, help_category_overrides: {}, story_journal: [], factions: [], secrets: [], relationships: [], gm_context: {}, constraint_overrides: [], synthesis_activated: {}, synthesis_module_enabled: {}, notes: [], vows: [], checkpoints: [], description: "", genre: "", adventure_index: null, adventure_scene_waypoint: null, world: { rooms: {}, things: {} }, story_beats: [], pacing_counter: 0, pacing_autonomy_fired: false, scene_transition_count: 0, faction_autonomous_ticks: {}, npc_goal_suggestions: [], voice_corrections_this_session: 0, auto_record: true, session_no_mutation_windows: [], state_regression: null, last_mutation_at: null, mutation_counts_by_group: {}, uncommitted_rolls: [], metadata: { created: new Date().toISOString(), modified: new Date().toISOString(), session_count: 0, total_combat_rounds: 0, last_scene_anchor: "" } });
      writeFileSync(bak, good);
      // Primary file has a longer audit log (simulating post-corruption writes)
      // AND a wrong checksum, forcing the backup-restore path.
      const corrupt = JSON.parse(good);
      corrupt.audit_log.push({ timestamp: new Date().toISOString(), badge: "game_master", tool: "set_note", args: "{}", output_prefix: "", hash: "bbbbbbbb" });
      // REQ-406 — make the corruption event later than the restored state so
      // the marker's timestamp gap is measurable.
      corrupt.metadata.modified = new Date(Date.now() + 60_000).toISOString();
      corrupt._checksum = "deadbeef0000000000000000000000000000000000000000000000000000";
      writeFileSync(file, JSON.stringify(corrupt));
      const resp = await call(proc, "manage_novel", { action: "resume",  slug: "corrupt-novel" });
      assertContains(resp, "[OK]");
      const health = JSON.parse(await call(proc, "manage_diagnostics", { action: "health" }));
      const markers = health.state_health?.markers ?? [];
      if (!markers.includes("[state-regression]")) {
        throw new Error(`[state-regression] missing from spec_health: ${JSON.stringify(health.state_health)}`);
      }
      if (health.state_health?.regression?.audit_gap !== 1) {
        throw new Error(`unexpected regression audit gap: ${JSON.stringify(health.state_health?.regression)}`);
      }
      // REQ-406 — the marker carries the timestamp gap, not only the audit gap.
      if ((health.state_health?.regression?.timestamp_gap_ms ?? 0) < 60_000) {
        throw new Error(`regression timestamp gap not reported: ${JSON.stringify(health.state_health?.regression)}`);
      }
      // state_regression also surfaces via the state_ledger token in briefing.
      const b = await briefing(proc);
      assertContains(b, "state-regression");

      // REQ-406/REQ-092c — an unparseable primary restores from the backup and
      // reports honest zero gaps (there is no readable primary to compare).
      const unparseFile = join(novelDir, "corrupt-unparseable.json");
      writeFileSync(unparseFile + ".bak", good.replace(/"slug":"corrupt-novel"/, '"slug":"corrupt-unparseable"'));
      writeFileSync(unparseFile, "{ not valid json ");
      const respU = await call(proc, "manage_novel", { action: "resume",  slug: "corrupt-unparseable" });
      assertContains(respU, "[OK]");
      const healthU = JSON.parse(await call(proc, "manage_diagnostics", { action: "health" }));
      if (!(healthU.state_health?.markers ?? []).includes("[state-regression]")) {
        throw new Error(`[state-regression] missing for unparseable primary: ${JSON.stringify(healthU.state_health)}`);
      }
      const regU = healthU.state_health?.regression ?? {};
      if (regU.backup_index !== 1) throw new Error(`backup_index not recorded: ${JSON.stringify(regU)}`);
      if (regU.audit_gap !== 0 || regU.timestamp_gap_ms !== 0) {
        throw new Error(`unparseable primary should report zero gaps: ${JSON.stringify(regU)}`);
      }
    });
    await kill(proc);
  }

  // ── REQ-001a/T175: corrupted Novel surfaced as [WARNING] in spec_health ──
  {
    const dir = mkdtempSync(join(tmpdir(), "holonovel-corrupt-skip-"));
    mkdirSync(join(dir, "novels"), { recursive: true });
    writeFileSync(join(dir, "novels", "corrupt-skip.json"), "{ not valid json ");
    const proc = await boot({ TTRPG_DATA_DIR: dir });
    await test("T175/REQ-001a: corrupt novel on disk surfaces in spec_health.data_health.corrupted", async () => {
      const health = JSON.parse(await call(proc, "manage_diagnostics", { action: "health" }));
      const corrupted = Object.keys(health.data_health?.corrupted ?? {});
      if (!corrupted.includes("corrupt-skip")) throw new Error(`corrupt-skip not surfaced: ${JSON.stringify(health.data_health)}`);
      // REQ-092c/REQ-238 — the flag carries the slug, the chain paths, and a
      // stderr line naming the same paths.
      if (!(health.data_health?.markers ?? []).includes("[corrupted-novel]")) {
        throw new Error(`[corrupted-novel] marker missing: ${JSON.stringify(health.data_health)}`);
      }
      const detail = health.data_health?.corrupted_detail?.["corrupt-skip"];
      if (!detail?.primary_path?.includes("corrupt-skip.json")) {
        throw new Error(`corrupted_detail missing the primary path: ${JSON.stringify(detail)}`);
      }
      if (!stderrBuffer.includes("[corrupted-novel]") || !stderrBuffer.includes(detail.primary_path)) {
        throw new Error(`stderr does not name the primary path: ${stderrBuffer.substring(0, 500)}`);
      }
    });
    await kill(proc);
    rmSync(dir, { recursive: true, force: true });
  }

  // ── REQ-092e/f/g: on-disk format version and the v1 migration ────────────
  {
    const seedDir = mkdtempSync(join(tmpdir(), "holonovel-format-seed-"));
    const seed = await boot({ TTRPG_DATA_DIR: seedDir, TTRPG_STARTER_NOVEL: "off" });
    await call(seed, "manage_novel", { action: "create", name: "fmt-source" });
    await call(seed, "set_badge", { badge: "game_master" });
    await call(seed, "manage_note", { action: "set", key: "seed-note", content: "v" });
    const exp = JSON.parse(await call(seed, "manage_archive", { action: "export", format: "json" }));
    const template = exp.novel;
    await kill(seed);

    const seedFile = join(seedDir, "novels", "fmt-source.json");
    const seedData = JSON.parse(readFileSync(seedFile, "utf-8"));
    await test("T77/REQ-092e: a saved Novel carries novel_format_version 2", async () => {
      if (seedData.novel_format_version !== 2) {
        throw new Error(`expected novel_format_version 2, got ${JSON.stringify(seedData.novel_format_version)}`);
      }
    });
    rmSync(seedDir, { recursive: true, force: true });

    const dir = mkdtempSync(join(tmpdir(), "holonovel-format-test-"));
    const novelsDir = join(dir, "novels");
    mkdirSync(novelsDir, { recursive: true });
    const payload = (slug: string, version?: number): any => {
      const data: any = JSON.parse(JSON.stringify(template));
      data.slug = slug;
      data.name = slug;
      data.audit_log = [];
      if (version === undefined) delete data.novel_format_version;
      else data.novel_format_version = version;
      return data;
    };
    const chain = (tools: string[]): any[] => {
      let prev = "00000000";
      return tools.map((tool, i) => {
        const args = JSON.stringify({ i });
        const hash = createHash("sha256").update(prev + tool + args).digest("hex").substring(0, 8);
        prev = hash;
        return { timestamp: new Date().toISOString(), badge: "game_master", tool, args, output_prefix: "", hash };
      });
    };
    // v1 with a valid sidecar: adopted, then deleted.
    writeFileSync(join(novelsDir, "fmt-v1.json"), JSON.stringify(payload("fmt-v1")));
    writeFileSync(join(novelsDir, "fmt-v1.audit.jsonl"), chain(["set_note", "set_note"]).map((e) => JSON.stringify(e)).join("\n") + "\n");
    // v1 with no sidecar: empty log + [migration-missing-audit].
    writeFileSync(join(novelsDir, "fmt-missing.json"), JSON.stringify(payload("fmt-missing")));
    // v1 with a broken chain: sidecar preserved, empty log + marker.
    const broken = chain(["set_note"]);
    broken[0].hash = "deadbeef";
    writeFileSync(join(novelsDir, "fmt-broken.json"), JSON.stringify(payload("fmt-broken")));
    writeFileSync(join(novelsDir, "fmt-broken.audit.jsonl"), JSON.stringify(broken[0]) + "\n");
    // newer format: loads and warns.
    writeFileSync(join(novelsDir, "fmt-future.json"), JSON.stringify(payload("fmt-future", 3)));

    const fmt = await boot({ TTRPG_DATA_DIR: dir, TTRPG_STARTER_NOVEL: "off" });

    await test("T77/REQ-092f: a v1 Novel adopts and deletes its audit sidecar", async () => {
      const data = JSON.parse(readFileSync(join(novelsDir, "fmt-v1.json"), "utf-8"));
      if (data.novel_format_version !== 2) throw new Error(`v1 not migrated: ${JSON.stringify(data.novel_format_version)}`);
      if ((data.audit_log ?? []).length !== 2) throw new Error(`adopted log length ${(data.audit_log ?? []).length}`);
      if (existsSync(join(novelsDir, "fmt-v1.audit.jsonl"))) throw new Error("audit sidecar not deleted after adoption");
    });

    await test("T77/REQ-092f: a v1 Novel with no sidecar records [migration-missing-audit]", async () => {
      const data = JSON.parse(readFileSync(join(novelsDir, "fmt-missing.json"), "utf-8"));
      const marker = (data.audit_log ?? []).find((e: any) => e.tool === "migration_missing_audit");
      if (!marker) throw new Error(`no migration_missing_audit entry: ${JSON.stringify(data.audit_log)}`);
      assertContains(marker.args, "no_audit_sidecar");
    });

    await test("T77/REQ-092f: a v1 Novel with a broken chain keeps its sidecar", async () => {
      const data = JSON.parse(readFileSync(join(novelsDir, "fmt-broken.json"), "utf-8"));
      const marker = (data.audit_log ?? []).find((e: any) => e.tool === "migration_missing_audit");
      if (!marker) throw new Error(`no migration_missing_audit entry for broken chain: ${JSON.stringify(data.audit_log)}`);
      assertContains(marker.args, "chain_invalid");
      if (!existsSync(join(novelsDir, "fmt-broken.audit.jsonl"))) throw new Error("unverified sidecar was deleted");
    });

    await test("T77/REQ-092g: a newer-format Novel loads and surfaces [format-future]", async () => {
      const health = JSON.parse(await call(fmt, "manage_diagnostics", { action: "health" }));
      if (!(health.data_health?.markers ?? []).includes("[format-future]")) {
        throw new Error(`[format-future] missing: ${JSON.stringify(health.data_health)}`);
      }
      if (health.data_health?.format_future?.["fmt-future"] !== 3) {
        throw new Error(`format_future did not name the stored version: ${JSON.stringify(health.data_health?.format_future)}`);
      }
      // The Novel still loads and lists.
      assertContains(await call(fmt, "manage_novel", { action: "list" }), "fmt-future");
    });

    await kill(fmt);
    rmSync(dir, { recursive: true, force: true });
  }

  // ── REQ-224a: the backup-restore branch runs staleness accounting ─────────
  {
    const dir = mkdtempSync(join(tmpdir(), "holonovel-stale-restore-"));
    const first = await boot({ TTRPG_DATA_DIR: dir, TTRPG_STARTER_NOVEL: "off" });
    await call(first, "manage_novel", { action: "create", name: "stale-restore" });
    await call(first, "set_badge", { badge: "game_master" });
    const need = await call(first, "manage_novel", { action: "end" });
    assertContains(need, "NEED_INPUT");
    // A second save puts the pending workflow into the backup chain.
    await call(first, "manage_novel", { action: "save_context", current_scene: "pending end" });
    await kill(first);

    const second = await boot({ TTRPG_DATA_DIR: dir, TTRPG_STARTER_NOVEL: "off" });
    // Corrupt the primary after boot so `resume` takes the restore branch.
    writeFileSync(join(dir, "novels", "stale-restore.json"), "{ corrupt primary ");
    const resumed = await call(second, "manage_novel", { action: "resume", slug: "stale-restore" });
    assertContains(resumed, "[OK]");
    const health = JSON.parse(await call(second, "manage_diagnostics", { action: "health" }));
    if (!health.pending_workflow) throw new Error("pending workflow lost across the restore");
    if (health.pending_workflow.connections < 2) {
      throw new Error(`restore skipped staleness accounting: ${JSON.stringify(health.pending_workflow)}`);
    }
    await kill(second);
    rmSync(dir, { recursive: true, force: true });
  }

  harnessComplete();
  console.log(`\n${passed} passed, ${failed} failed`);
  rmSync(DATA_DIR, { recursive: true, force: true });
  if (failed > 0) process.exit(1);
  process.exit(0);
}

main().catch((e) => { console.error("Fatal:", e); process.exit(2); });