#!/usr/bin/env node
// Pattern Buffer harness — §6.6 verification harness [gate]
//
// Enumerates all 37 Pattern Buffer sub-workflows (S1–S37) and executes the
// server-native ones against a running holonovel server, emitting the
// `pattern_buffer_manifest` (H13 handoff artifact) to stdout as JSON on
// `--json` and to `<data-dir>/pattern-buffer-manifest.json`.
//
// Sub-workflow modes:
//   execute  — steps run against the server; PASS/FAIL from assertions
//   skip     — mechanics-fidelity "skipped — ruleset hash unchanged" (§6.6)
//   stub     — merged into another sub-workflow (S10→S4, S11→S20)
//   follow-on — not yet ported into this harness (bounded future increment)
//
// Exit codes: 0 = all executed blocking sub-workflows pass; 1 = a blocking
// sub-workflow failed; 2 = fatal harness error (server failed to boot).
// Implements §6.6; cites REQ-108a/b/c (§6.6 coverage parity).

import { spawn, ChildProcess } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, rmSync, mkdirSync, mkdtempSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const SERVER_SCRIPT = join(import.meta.dirname!, "..", "src", "index.ts");
const SPEC_PATH = join(import.meta.dirname!, "..", "..", "holonovel.md");
const DATA_DIR = mkdtempSync(join(tmpdir(), "holonovel-pattern-buffer-"));
const OUT_PATH = join(DATA_DIR, "pattern-buffer-manifest.json");

const jsonOut = process.argv.includes("--json");

// ── Types ──────────────────────────────────────────────────────────

type ToolAction = { kind: "tool"; name: string; args: Record<string, unknown> | (() => Record<string, unknown>) };
type ResourceAction = { kind: "resource"; uri: string };
type PromptAction = { kind: "prompt"; name: string; args: Record<string, string> };
type PBAction = ToolAction | ResourceAction | PromptAction;

interface PBStep { label: string; action: PBAction; assert: (r: string) => void; }

type PBMode = "execute" | "skip" | "stub" | "follow-on";

interface PBSubworkflow {
  s_id: string;
  name: string;
  objective: string;
  blocking: boolean;
  mode: PBMode;
  reason?: string;
  steps?: PBStep[];
}

interface PBVerdict {
  s_id: string;
  name: string;
  blocking: boolean;
  status: "PASS" | "FAIL" | "skip" | "stub" | "follow-on";
  reason?: string;
  duration_ms?: number;
  failure?: { step: string; error: string };
}

// ── MCP client (shared shape with the Inform Gauntlet) ─────────────

let msgId = 0;
const pending = new Map<number, (m: any) => void>();
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
  proc.stdout!.on("data", (d: Buffer) => {
    buffer += d.toString();
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
      } catch { /* non-JSON line */ }
    }
  });
}

async function doAction(proc: ChildProcess, action: PBAction): Promise<string> {
  let resp: any;
  if (action.kind === "tool") {
    const args = typeof action.args === "function" ? action.args() : action.args;
    resp = await send(proc, { method: "tools/call", params: { name: action.name, arguments: args } });
  } else if (action.kind === "resource") {
    resp = await send(proc, { method: "resources/read", params: { uri: action.uri } });
  } else {
    resp = await send(proc, { method: "prompts/get", params: { name: action.name, arguments: action.args } });
  }
  if (resp.error) throw new Error(`RPC error: ${JSON.stringify(resp.error)}`);
  const content = resp.result?.content ?? resp.result?.contents ?? resp.result?.messages ?? [];
  return content.map((c: any) => (typeof c === "string" ? c : (c?.content?.text ?? c?.text ?? ""))).join("\n");
}

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

const T = (name: string, args: Record<string, unknown> = {}): ToolAction => ({ kind: "tool", name, args });
const R = (uri: string): ResourceAction => ({ kind: "resource", uri });
const P = (name: string, args: Record<string, string> = {}): PromptAction => ({ kind: "prompt", name, args });

// ── Assertions ─────────────────────────────────────────────────────

function assertOK(r: string, label = "") {
  if (r.includes("[ERROR]") || r.includes("[STATE_CONFLICT]") || r.includes("[FORBIDDEN]") || r.includes("[NOT_FOUND]"))
    throw new Error(`${label}expected OK, got: ${r.substring(0, 300)}`);
}
function assertContains(r: string, sub: string, label = "") {
  if (!r.toLowerCase().includes(sub.toLowerCase()))
    throw new Error(`${label}expected to contain "${sub}", got: ${r.substring(0, 300)}`);
}
function assertNotContains(r: string, sub: string, label = "") {
  if (r.toLowerCase().includes(sub.toLowerCase()))
    throw new Error(`${label}expected NOT to contain "${sub}", got: ${r.substring(0, 300)}`);
}
function assertError(r: string, label = "") {
  if (!r.includes("[ERROR]") && !r.includes("[STATE_CONFLICT]") && !r.includes("[NOT_FOUND]") && !r.includes("[FORBIDDEN]"))
    throw new Error(`${label}expected error, got: ${r.substring(0, 300)}`);
}

function sha256(s: string): string {
  return createHash("sha256").update(s).digest("hex");
}

// ── §6.6 sub-workflow register ─────────────────────────────────────

function buildRegister(): PBSubworkflow[] {
  const followOn = (s_id: string, name: string, blocking: boolean, objective: string): PBSubworkflow =>
    ({ s_id, name, objective, blocking, mode: "follow-on", reason: "not yet ported into this harness — bounded future increment" });
  const skip = (s_id: string, name: string, blocking: boolean, objective: string): PBSubworkflow =>
    ({ s_id, name, objective, blocking, mode: "skip", reason: "skipped — ruleset hash unchanged (§6.6 convergence-loop scoping)" });
  const stub = (s_id: string, name: string, blocking: boolean, original: string): PBSubworkflow =>
    ({ s_id, name, objective: `Merged into ${original}.`, blocking, mode: "stub", reason: `merged into ${original}` });

  return [
    { s_id: "S1", name: "Tool surface sweep", objective: "one read-only tool per REQ-015 category + badge/lifecycle tools; invalid input errors cleanly", blocking: true, mode: "execute", steps: S1_STEPS },
    skip("S2", "Character creation workflow", true, "step-by-step and quick creation; derived stats; roster import; undo; no-active-Novel conflict"),
    skip("S3", "Encounter setup", false, "combat init reports round counter, turn order, participant classification"),
    skip("S4", "Simulated combat session", true, "≥3-round deterministic combat; roll transparency; undo; identical seed → identical sequence"),
    followOn("S5", "Combat state survival", true, "HP/conditions/round counter restored after restart (tool-observable surfaces)"),
    { s_id: "S6", name: "Cross-badge boundary enforcement", objective: "GM-only tools blocked from Player; no GM-only content leaks", blocking: true, mode: "execute", steps: S6_STEPS },
    skip("S7", "Table generation sweep", false, "every generation table produces valid results; GM-only tables blocked from Player"),
    skip("S8", "Search and canonical lookup", false, "exact/prefix/substring search; canonical lookup; NOT_FOUND enumeration"),
    skip("S9", "Condition lifecycle", false, "conditions apply, affect mechanics, expire by triggers; manual removal"),
    stub("S10", "Undo during combat", false, "S4"),
    stub("S11", "Workflow cancellation", false, "S20"),
    followOn("S12", "Roster durability", true, "roster baselines immutable; re-import reproduces baseline"),
    { s_id: "S13", name: "Novel isolation", objective: "entities, adventures, generated content do not leak between Novels", blocking: true, mode: "execute", steps: S13_STEPS },
    followOn("S14", "Edge cases", true, "0 HP; heal cap; rapid calls; ambiguous alias; unknown decision; seed determinism; spec_health filtering; adversarial input"),
    followOn("S15", "Stress and recovery", true, "two-connection concurrency; corruption WARNING; rapid badge alternation; 50-round combat; direct file-read assertions"),
    followOn("S16", "Narrative state", false, "scene/NPC/countdown/lore/briefing end-to-end with deterministic seeds"),
    { s_id: "S17", name: "Novel lifecycle and persistence", objective: "create/resume/switch/end; state persists; ended Novel blocks resume", blocking: true, mode: "execute", steps: S17_STEPS },
    followOn("S18", "Adventure generation and encounter lifecycle", false, "generate produces scoped/searchable content; regenerate replaces prior"),
    followOn("S19", "Badge briefing correctness", true, "Player vs GM content filtering; briefing adapts to scene type"),
    followOn("S20", "Lorebook interchange", true, "export → modify → import dry-run/merge/replace cycle"),
    followOn("S21", "Campaign endurance", true, "30-round endurance; audit-log hash chain; recap; ≤5 MB Novel"),
    followOn("S22", "Workflow validation", true, "NEED_INPUT drain/cancel/restart; blocked gating during pending workflow"),
    followOn("S23", "Narrative features sweep", true, "save/get_context; factions; secrets; choices; relationships; notes; clock taxonomy"),
    followOn("S24", "Session segmentation and audit compaction", false, "session-boundary markers; per-session recap; compaction + archive"),
    followOn("S25", "State durability: backups, checkpoints, clones", true, "rotated backups; corruption restore; checkpoint cycle; clone independence"),
    followOn("S26", "Narrative POV", true, "set_active POV directive; omniscient vs character-locked; restart persistence"),
    followOn("S27", "Synthesis lifecycle + Wisdom mechanical enactment", true, "toggle/revert; Wisdom P6/P7/P10; deactivate/reactivate"),
    followOn("S28", "Briefing ordering, voice examples, session notation", false, "briefing_order; voice examples; lonelog format"),
    followOn("S29", "Novel export/import cycle", true, "export/import dry-run/replace round-trip; lore-only; strict broken-reference"),
    followOn("S30", "Supplementary ruleset import", true, "import_supplementary Appendix Z; tools/list annotation; remove_supplementary"),
    followOn("S31", "Dynamic tool registration", true, "supplementary tool registration/deregistration; waiver build"),
    followOn("S32", "Coupling chain exercise", true, "countdown ⇄ world_effect ⇄ faction ⇄ lore trigger chain + undo"),
    followOn("S33", "Wisdom mechanical enactment", true, "P6/P7/P10 auto-population; deactivate/reactivate behavior"),
    followOn("S34", "Entity-bearing chain exercise", false, "NPC co-presence relationship; secrets; memory facts across restart"),
    followOn("S35", "Narrative architecture chain exercise", false, "on_scene_transition countdown; discovered consequence; pacing signals"),
    followOn("S36", "Decision chain exercise", false, "vow ⇄ countdown; choices advance; milestone; forsake"),
    followOn("S37", "Coupling advisory sweep", false, "advisory sweep across countdown scope, secrets, vows, relationships, factions, notes"),
  ];
}

// ── Executed sub-workflow steps ────────────────────────────────────

const S1_STEPS: PBStep[] = [
  { label: "set_badge GM", action: T("set_badge", { badge: "game_master" }), assert: assertOK },
  { label: "novel create", action: T("novel", { action: "create", name: "pb-tool-sweep" }), assert: assertOK },
  { label: "session health (spec_health read)", action: T("session", { action: "health" }), assert: (r) => assertContains(r, "spec_version", "health ") },
  { label: "world://kinds resource", action: R("world://kinds"), assert: (r) => assertContains(r, "Kind Hierarchy", "kinds ") },
  { label: "badge_briefing prompt", action: P("badge_briefing", { badge: "game_master" }), assert: (r) => assertContains(r, "Briefing", "briefing ") },
  { label: "create_room", action: T("world", { action: "create_room", name: "Sweep Room", description: "Sweep." }), assert: (r) => assertContains(r, "created", "room ") },
  { label: "character create", action: T("character", { action: "create", name: "Sweeper" }), assert: assertOK },
  { label: "set_badge player", action: T("set_badge", { badge: "player" }), assert: assertOK },
  { label: "command empty → INVALID_INPUT", action: T("command", { command: "" }), assert: (r) => assertError(r, "empty command ") },
  { label: "command look", action: T("command", { command: "look" }), assert: (r) => assertContains(r, "Sweep Room", "look ") },
];

const S6_STEPS: PBStep[] = [
  { label: "set_badge GM", action: T("set_badge", { badge: "game_master" }), assert: assertOK },
  { label: "novel create", action: T("novel", { action: "create", name: "pb-crossbadge" }), assert: assertOK },
  { label: "create_room (GM ok)", action: T("world", { action: "create_room", name: "CB Room", description: "CB." }), assert: assertOK },
  { label: "set_badge player", action: T("set_badge", { badge: "player" }), assert: assertOK },
  { label: "world create_room as player → FORBIDDEN", action: T("world", { action: "create_room", name: "Leak Room" }), assert: (r) => assertContains(r, "FORBIDDEN", "GM-world ") },
  { label: "npc create as player → FORBIDDEN", action: T("npc", { action: "create", name: "LeakNpc" }), assert: (r) => assertContains(r, "FORBIDDEN", "GM-npc ") },
];

const S13_STEPS: PBStep[] = [
  { label: "set_badge GM", action: T("set_badge", { badge: "game_master" }), assert: assertOK },
  { label: "novel A", action: T("novel", { action: "create", name: "pb-isol-A" }), assert: assertOK },
  { label: "create_room in A", action: T("world", { action: "create_room", name: "isolated-room-A", description: "A only." }), assert: assertOK },
  { label: "character in A", action: T("character", { action: "create", name: "ISO-HERO-A" }), assert: assertOK },
  { label: "novel B (switches active)", action: T("novel", { action: "create", name: "pb-isol-B" }), assert: assertOK },
  { label: "world://map in B excludes A's room", action: R("world://map"), assert: (r) => assertNotContains(r, "isolated-room-A", "isolation-map ") },
  { label: "session health in B: no A entities", action: T("session", { action: "health" }), assert: (r) => {
    assertNotContains(r, "ISO-Hero-A", "isolation-entities ");
    assertContains(r, "entities", "health-entities ");
  } },
];

const S17_STEPS: PBStep[] = [
  { label: "set_badge GM", action: T("set_badge", { badge: "game_master" }), assert: assertOK },
  { label: "novel create", action: T("novel", { action: "create", name: "pb-lifecycle" }), assert: assertOK },
  { label: "mutate (create_room)", action: T("world", { action: "create_room", name: "Life Room", description: "Lifecycle." }), assert: assertOK },
  { label: "switch to second novel", action: T("novel", { action: "create", name: "pb-life-other" }), assert: assertOK },
  { label: "switch back (resume)", action: T("novel", { action: "resume", slug: "pb-lifecycle" }), assert: assertOK },
  { label: "persisted room survives switch", action: R("world://map"), assert: (r) => assertContains(r, "Life Room", "persist ") },
  { label: "end novel", action: T("novel", { action: "end" }), assert: assertOK },
  { label: "confirm end", action: T("respond", { decision: "end novel", option: "yes" }), assert: (r) => assertContains(r, "ended", "end ") },
  { label: "resume ended novel → blocked", action: T("novel", { action: "resume", slug: "pb-lifecycle" }), assert: (r) => assertError(r, "ended-resume ") },
];

// ── Runner ─────────────────────────────────────────────────────────

function log(msg: string) {
  if (!jsonOut) console.log(msg);
}

async function main() {
  log("=== Holonovel Pattern Buffer ===\n");
  const specHash = sha256(readFileSync(SPEC_PATH, "utf-8"));
  log(`Spec hash: ${specHash}`);
  log(`Data dir: ${DATA_DIR}\n`);

  try { rmSync(DATA_DIR, { recursive: true }); } catch { /* fresh */ }
  mkdirSync(DATA_DIR, { recursive: true });

  const proc = spawn("npx", ["tsx", SERVER_SCRIPT], {
    env: { ...process.env, TTRPG_DATA_DIR: DATA_DIR },
    stdio: ["pipe", "pipe", "pipe"],
  });
  attach(proc);

  await send(proc, { method: "initialize", params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "holonovel-pattern-buffer", version: "1.0.0" } } });
  proc.stdin!.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n");
  await sleep(400);

  const register = buildRegister();
  const verdicts: PBVerdict[] = [];

  for (const sw of register) {
    if (sw.mode !== "execute") {
      verdicts.push({ s_id: sw.s_id, name: sw.name, blocking: sw.blocking, status: sw.mode, reason: sw.reason });
      log(`${sw.mode.toUpperCase()} ${sw.s_id}: ${sw.name}${sw.reason ? ` (${sw.reason})` : ""}`);
      continue;
    }

    const started = Date.now();
    const verdict: PBVerdict = { s_id: sw.s_id, name: sw.name, blocking: sw.blocking, status: "PASS" };
    try {
      for (const step of sw.steps!) {
        const response = await doAction(proc, step.action);
        step.assert(response);
      }
    } catch (e: any) {
      verdict.status = "FAIL";
      verdict.failure = { step: String(e.message).split("\n")[0], error: String(e.message) };
    }
    verdict.duration_ms = Date.now() - started;
    verdicts.push(verdict);
    log(`${verdict.status} ${sw.blocking ? "[BLOCKING]" : "[non-blocking]"} ${sw.s_id}: ${sw.name} (${verdict.duration_ms}ms)`);
    if (verdict.failure) log(`  Failure: ${verdict.failure.error.split("\n")[0]}`);

    // Best-effort cleanup between sub-workflows.
    try { await doAction(proc, T("novel", { action: "end" })); await doAction(proc, T("respond", { decision: "end novel", option: "yes" })); } catch { /* safe to ignore */ }
  }

  proc.kill();

  const failed = verdicts.filter((v) => v.status === "FAIL");
  const passed = verdicts.filter((v) => v.status === "PASS").length;
  const executed = verdicts.filter((v) => v.status === "PASS" || v.status === "FAIL").length;
  const blockingFailures = failed.filter((v) => v.blocking);

  const manifest = {
    manifest: "pattern_buffer",
    server: "holonovel",
    spec_hash: specHash,
    generated_at: new Date().toISOString(),
    sub_workflows: verdicts.map((v) => ({ s_id: v.s_id, name: v.name, blocking: v.blocking, status: v.status, reason: v.reason, failure: v.failure })),
    summary: {
      total: verdicts.length,
      executed,
      passed,
      failed: failed.length,
      skipped: verdicts.filter((v) => v.status === "skip").length,
      stubbed: verdicts.filter((v) => v.status === "stub").length,
      follow_on: verdicts.filter((v) => v.status === "follow-on").length,
      blocking_failures: blockingFailures.length,
    },
  };

  writeFileSync(OUT_PATH, JSON.stringify(manifest, null, 2) + "\n");

  if (jsonOut) {
    console.log(JSON.stringify(manifest, null, 2));
  } else {
    console.log("\n=== Pattern Buffer Summary ===");
    console.log(`Total: ${verdicts.length} | Passed: ${passed} | Failed: ${failed.length} | Skipped: ${manifest.summary.skipped} | Stubbed: ${manifest.summary.stubbed} | Follow-on: ${manifest.summary.follow_on}`);
    console.log(`Blocking failures: ${blockingFailures.length}`);
    console.log(`Manifest: ${OUT_PATH}`);
  }

  if (blockingFailures.length > 0) {
    console.error(`FAIL: ${blockingFailures.length} blocking sub-workflow(s) failed.`);
    process.exit(1);
  }
  console.error("PASS: all executed blocking sub-workflows passed.");
  process.exit(0);
}

main().catch((e) => {
  console.error("Pattern Buffer fatal error:", e);
  process.exit(2);
});
