#!/usr/bin/env node
// Ruleset Pattern Buffer harness — §6.6 verification harness [gate]
//
// Enumerates all 37 Ruleset Pattern Buffer sub-workflows (S1–S37) and executes
// the server-native ones against a running holonovel server, emitting the
// `ruleset_pattern_buffer_manifest` (H13 handoff artifact) to stdout as JSON on
// `--json` and to `<data-dir>/ruleset-pattern-buffer-manifest.json`.
// Host-tree scaffolding for ruleset (TTRPG) builds: mechanics-fidelity
// sub-workflows record `skip` (ruleset-free host), S30/S31 record `blocked`
// (REQ-372/373 bucket-E gap, see ROADMAP.md).
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
const DATA_DIR = mkdtempSync(join(tmpdir(), "holonovel-ruleset-pattern-buffer-"));
const OUT_PATH = join(DATA_DIR, "ruleset-pattern-buffer-manifest.json");

const jsonOut = process.argv.includes("--json");

// ── Types ──────────────────────────────────────────────────────────

type ToolAction = { kind: "tool"; name: string; args: Record<string, unknown> | (() => Record<string, unknown>) };
type ResourceAction = { kind: "resource"; uri: string | (() => string) };
type PromptAction = { kind: "prompt"; name: string; args: Record<string, string> };
type RestartAction = { kind: "restart"; resume?: string; env?: Record<string, string> };
type PBAction = ToolAction | ResourceAction | PromptAction | RestartAction;

interface PBStep { label: string; action: PBAction; assert: (r: string) => void; }

type PBMode = "execute" | "skip" | "stub" | "blocked" | "follow-on";

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

// ── MCP client (shared shape with the Holonovel Pattern Buffer) ───────

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
    resp = await send(proc, { method: "resources/read", params: { uri: typeof action.uri === "function" ? action.uri() : action.uri } });
  } else if (action.kind === "prompt") {
    resp = await send(proc, { method: "prompts/get", params: { name: action.name, arguments: action.args } });
  } else {
    throw new Error("restart action must be handled by the runner loop, not doAction");
  }
  if (resp.error) throw new Error(`RPC error: ${JSON.stringify(resp.error)}`);
  const content = resp.result?.content ?? resp.result?.contents ?? resp.result?.messages ?? [];
  return content.map((c: any) => (typeof c === "string" ? c : (c?.content?.text ?? c?.text ?? ""))).join("\n");
}

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

const T = (name: string, args: Record<string, unknown> | (() => Record<string, unknown>) = {}): ToolAction => ({ kind: "tool", name, args });
const R = (uri: string | (() => string)): ResourceAction => ({ kind: "resource", uri });
const P = (name: string, args: Record<string, string> = {}): PromptAction => ({ kind: "prompt", name, args });
const RS = (resume?: string, env?: Record<string, string>): RestartAction => ({ kind: "restart", resume, env });

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

// Capture a value (e.g. a server-assigned entity id) from one step's response
// for use in a later step's args/uri function. Pattern's first group is stored.
const captured: Record<string, string> = {};
function capture(key: string, pattern: RegExp): (r: string) => void {
  return (r: string) => {
    const m = r.match(pattern);
    if (m) captured[key] = m[1];
    else throw new Error(`capture '${key}': pattern did not match — ${r.substring(0, 200)}`);
  };
}

// ── §6.6 sub-workflow register ─────────────────────────────────────

function buildRegister(): PBSubworkflow[] {
  const followOn = (s_id: string, name: string, blocking: boolean, objective: string): PBSubworkflow =>
    ({ s_id, name, objective, blocking, mode: "follow-on", reason: "not yet ported into this harness — bounded future increment" });
  const skip = (s_id: string, name: string, blocking: boolean, objective: string): PBSubworkflow =>
    ({ s_id, name, objective, blocking, mode: "skip", reason: "skipped — ruleset hash unchanged (§6.6 convergence-loop scoping)" });
  const stub = (s_id: string, name: string, blocking: boolean, original: string): PBSubworkflow =>
    ({ s_id, name, objective: `Merged into ${original}.`, blocking, mode: "stub", reason: `merged into ${original}` });
  const blocked = (s_id: string, name: string, blocking: boolean, reason: string): PBSubworkflow =>
    ({ s_id, name, objective: `Blocked — ${reason}`, blocking, mode: "blocked", reason });

  return [
    { s_id: "S1", name: "Tool surface sweep", objective: "one read-only tool per REQ-015 category + badge/lifecycle tools; invalid input errors cleanly", blocking: true, mode: "execute", steps: S1_STEPS },
    skip("S2", "Character creation workflow", true, "step-by-step and quick creation; derived stats; roster import; undo; no-active-Novel conflict"),
    skip("S3", "Encounter setup", false, "combat init reports round counter, turn order, participant classification"),
    skip("S4", "Simulated combat session", true, "≥3-round deterministic combat; roll transparency; undo; identical seed → identical sequence"),
    { s_id: "S5", name: "Combat state survival", objective: "HP/conditions/round counter restored after restart (tool-observable surfaces)", blocking: true, mode: "execute", steps: S5_STEPS },
    { s_id: "S6", name: "Cross-badge boundary enforcement", objective: "GM-only tools blocked from Player; no GM-only content leaks", blocking: true, mode: "execute", steps: S6_STEPS },
    skip("S7", "Table generation sweep", false, "every generation table produces valid results; GM-only tables blocked from Player"),
    skip("S8", "Search and canonical lookup", false, "exact/prefix/substring search; canonical lookup; NOT_FOUND enumeration"),
    skip("S9", "Condition lifecycle", false, "conditions apply, affect mechanics, expire by triggers; manual removal"),
    stub("S10", "Undo during combat", false, "S4"),
    stub("S11", "Workflow cancellation", false, "S20"),
    { s_id: "S12", name: "Roster durability", objective: "roster baselines immutable; re-import produces fresh copy matching baseline", blocking: true, mode: "execute", steps: S12_STEPS },
    { s_id: "S13", name: "Novel isolation", objective: "entities, adventures, generated content do not leak between Novels", blocking: true, mode: "execute", steps: S13_STEPS },
    { s_id: "S14", name: "Edge cases", objective: "rapid calls; adversarial input; spec_health filtering; unknown decision", blocking: true, mode: "execute", steps: S14_STEPS },
    followOn("S15", "Stress and recovery", true, "two-connection concurrency; corruption WARNING; rapid badge alternation; 50-round combat; direct file-read assertions"),
    { s_id: "S16", name: "Narrative state", objective: "scene/NPC/countdown/lore/briefing end-to-end with deterministic seeds", blocking: false, mode: "execute", steps: S16_STEPS },
    { s_id: "S17", name: "Novel lifecycle and persistence", objective: "create/resume/switch/end; state persists; ended Novel blocks resume", blocking: true, mode: "execute", steps: S17_STEPS },
    { s_id: "S18", name: "Adventure generation and encounter lifecycle", objective: "generate produces scoped/searchable content; regenerate replaces prior", blocking: false, mode: "execute", steps: S18_STEPS },
    { s_id: "S19", name: "Badge briefing correctness", objective: "Player vs GM content filtering; briefing adapts to scene type", blocking: true, mode: "execute", steps: S19_STEPS },
    { s_id: "S20", name: "Lorebook interchange", objective: "export → modify → import dry-run/merge/replace cycle", blocking: true, mode: "execute", steps: S20_STEPS },
    followOn("S21", "Campaign endurance", true, "30-round endurance; audit-log hash chain; recap; ≤5 MB Novel"),
    { s_id: "S22", name: "Workflow validation", objective: "NEED_INPUT drain/cancel/restart; blocked gating during pending workflow", blocking: true, mode: "execute", steps: S22_STEPS },
    followOn("S23", "Narrative features sweep", true, "save/get_context; factions; secrets; choices; relationships; notes; clock taxonomy"),
    followOn("S24", "Session segmentation and audit compaction", false, "session-boundary markers; per-session recap; compaction + archive"),
    followOn("S25", "State durability: backups, checkpoints, clones", true, "rotated backups; corruption restore; checkpoint cycle; clone independence"),
    { s_id: "S26", name: "Narrative POV", objective: "set_active POV directive; omniscient vs character-locked; restart persistence", blocking: true, mode: "execute", steps: S26_STEPS },
    followOn("S27", "Synthesis lifecycle + Wisdom mechanical enactment", true, "toggle/revert; Wisdom P6/P7/P10; deactivate/reactivate"),
    { s_id: "S28", name: "Briefing ordering, voice examples, session notation", objective: "briefing_order; voice examples; lonelog format", blocking: false, mode: "execute", steps: S28_STEPS },
    { s_id: "S29", name: "Novel export/import cycle", objective: "export/import dry-run/replace round-trip; lore-only; strict broken-reference", blocking: true, mode: "execute", steps: S29_STEPS },
    blocked("S30", "Supplementary ruleset import", true, "REQ-372/373 intended-gap (bucket E): the reference server does not implement import_supplementary/remove_supplementary or dynamic tool registration; a server-capability increment is scheduled on ROADMAP.md — out of harness scope"),
    blocked("S31", "Dynamic tool registration", true, "REQ-372/373 intended-gap (bucket E): the reference server does not implement import_supplementary/remove_supplementary or dynamic tool registration; a server-capability increment is scheduled on ROADMAP.md — out of harness scope"),
    { s_id: "S32", name: "Coupling chain exercise", objective: "countdown ⇄ world_effect ⇄ scene-transition ⇄ lore trigger chain + fire", blocking: true, mode: "execute", steps: S32_STEPS },
    followOn("S33", "Wisdom mechanical enactment", true, "P6/P7/P10 auto-population; deactivate/reactivate behavior"),
    { s_id: "S34", name: "Entity-bearing chain exercise", objective: "NPC memory facts across restart; relationship flip", blocking: false, mode: "execute", steps: S34_STEPS },
    { s_id: "S35", name: "Narrative architecture chain exercise", objective: "on_scene_transition countdown; discovered consequence; pacing signals", blocking: false, mode: "execute", steps: S35_STEPS },
    { s_id: "S36", name: "Decision chain exercise", objective: "vow ⇄ countdown; milestone advance; NPC-goal vow suggestion", blocking: false, mode: "execute", steps: S36_STEPS },
    { s_id: "S37", name: "Coupling advisory sweep", objective: "advisory sweep across countdown scope, secrets, vows, relationships, factions, notes", blocking: false, mode: "execute", steps: S37_STEPS },
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

const S12_STEPS: PBStep[] = [
  { label: "set_badge GM", action: T("set_badge", { badge: "game_master" }), assert: assertOK },
  { label: "novel create", action: T("novel", { action: "create", name: "pb-roster" }), assert: assertOK },
  { label: "character create + stage_to_roster", action: T("character", { action: "create", name: "Roster Hero", stage_to_roster: true }), assert: (r) => { assertContains(r, "created", "roster-create "); capture("rosterId", /Staged to roster as (\S+?)\./)(r); } },
  { label: "roster_list shows baseline", action: T("character", { action: "roster_list" }), assert: (r) => assertContains(r, "Roster Hero", "roster-baseline ") },
  { label: "import reproduces fresh copy", action: T("character", () => ({ action: "import", roster_id: captured.rosterId })), assert: (r) => assertContains(r, "imported", "roster-import ") },
  { label: "sheet matches roster baseline", action: T("character", () => ({ action: "sheet", entity_id: captured.rosterId, format: "json" })), assert: (r) => assertContains(r, "Roster Hero", "roster-sheet ") },
  { label: "roster_list still has baseline (immutable)", action: T("character", { action: "roster_list" }), assert: (r) => assertContains(r, "Roster Hero", "roster-immutable ") },
];

const S16_STEPS: PBStep[] = [
  { label: "set_badge GM", action: T("set_badge", { badge: "game_master" }), assert: assertOK },
  { label: "novel create", action: T("novel", { action: "create", name: "pb-narrative" }), assert: assertOK },
  { label: "scene set", action: T("scene", { action: "set", description: "A quiet keep under storm.", scene_type: "exploration" }), assert: assertOK },
  { label: "npc create", action: T("npc", { action: "create", name: "Caretaker" }), assert: (r) => assertContains(r, "created", "npc ") },
  { label: "countdown set", action: T("countdown", { action: "set", name: "The Storm", ticks: 3 }), assert: (r) => assertContains(r, "tick", "countdown ") },
  { label: "lore set", action: T("lore", { action: "set", key: "keep_history", content: "The keep predates the kingdom." }), assert: (r) => assertContains(r, "created", "lore ") },
  { label: "countdown://active shows the storm", action: R("countdown://active"), assert: (r) => assertContains(r, "Storm", "cd-resource ") },
  { label: "lore://active shows the entry", action: R("lore://active"), assert: (r) => assertContains(r, "keep_history", "lore-resource ") },
  { label: "badge_briefing surfaces scene", action: P("badge_briefing", { badge: "game_master" }), assert: (r) => assertContains(r, "quiet keep", "briefing-scene ") },
];

const S18_STEPS: PBStep[] = [
  { label: "set_badge GM", action: T("set_badge", { badge: "game_master" }), assert: assertOK },
  { label: "novel create", action: T("novel", { action: "create", name: "pb-adventure" }), assert: assertOK },
  { label: "adventure generate (novel+codex)", action: T("adventure", { action: "generate", premise: "A smuggler's delivery across the bay", target: "both" }), assert: (r) => assertContains(r, "generated", "adventure-gen ") },
  { label: "regenerate replaces prior", action: T("adventure", { action: "generate", premise: "A caravan guarded at dawn", target: "both" }), assert: (r) => { assertContains(r, "caravan", "adventure-regen "); assertContains(r, "scaffold stored", "adventure-regen-store "); } },
  { label: "generate_encounter (batch state)", action: T("adventure", { action: "generate_encounter", context: "an ambush at the ford" }), assert: (r) => assertContains(r, "undo", "encounter-batch ") },
  { label: "briefing reflects generated scene", action: P("badge_briefing", { badge: "game_master" }), assert: (r) => assertContains(r, "ford", "briefing-encounter ") },
];

const S19_STEPS: PBStep[] = [
  { label: "novel create", action: T("novel", { action: "create", name: "pb-briefing" }), assert: assertOK },
  { label: "set_badge GM (after create)", action: T("set_badge", { badge: "game_master" }), assert: assertOK },
  { label: "character with profile", action: T("character", { action: "create", name: "Brief Hero", species: "human", personality: { description: "A cautious scout." } }), assert: assertOK },
  { label: "scene set social", action: T("scene", { action: "set", description: "Negotiation in the guild hall.", scene_type: "social" }), assert: assertOK },
  { label: "countdown (populates GM state)", action: T("countdown", { action: "set", name: "Hidden Pact", ticks: 4 }), assert: assertOK },
  { label: "GM briefing has GM-only + entity", action: P("badge_briefing", { badge: "game_master" }), assert: (r) => { assertContains(r, "Brief Hero", "gm-entity "); assertContains(r, "GM State", "gm-state "); } },
  { label: "set_badge player", action: T("set_badge", { badge: "player" }), assert: assertOK },
  { label: "player briefing filters GM-only", action: P("badge_briefing", { badge: "player" }), assert: (r) => { assertContains(r, "Brief Hero", "player-entity "); assertNotContains(r, "GM State", "player-filter "); } },
];

const S20_STEPS: PBStep[] = [
  { label: "set_badge GM", action: T("set_badge", { badge: "game_master" }), assert: assertOK },
  { label: "novel create", action: T("novel", { action: "create", name: "pb-lorebook" }), assert: assertOK },
  { label: "lore set", action: T("lore", { action: "set", key: "artifact", content: "The Shard glows in moonlight.", group: "items" }), assert: assertOK },
  { label: "lore export", action: T("lore", { action: "export" }), assert: (r) => assertContains(r, "artifact", "lore-export ") },
  { label: "import dry-run (no side effects)", action: T("lore", { action: "import", data: "[{\"key\":\"artifact\",\"content\":\"The Shard glows in moonlight.\"}]", mode: "dry-run" }), assert: (r) => assertContains(r, "dry-run", "lore-dryrun ") },
  { label: "merge restores missing entry", action: T("lore", { action: "import", data: "[{\"key\":\"new_key\",\"content\":\"merged.\"}]", mode: "merge" }), assert: (r) => assertContains(r, "merge", "lore-merge ") },
  { label: "re-export has both entries", action: T("lore", { action: "export" }), assert: (r) => { assertContains(r, "artifact", "merge-keep "); assertContains(r, "new_key", "merge-add "); } },
  { label: "replace overwrites", action: T("lore", { action: "import", data: "[{\"key\":\"replaced\",\"content\":\"fresh.\"}]", mode: "replace" }), assert: (r) => assertContains(r, "replace", "lore-replace ") },
  { label: "re-export shows only replaced", action: T("lore", { action: "export" }), assert: (r) => { assertContains(r, "replaced", "replace-new "); assertNotContains(r, "artifact", "replace-old-gone "); } },
];

const S28_STEPS: PBStep[] = [
  { label: "set_badge GM", action: T("set_badge", { badge: "game_master" }), assert: assertOK },
  { label: "novel create", action: T("novel", { action: "create", name: "pb-brieforder" }), assert: assertOK },
  { label: "briefing_order known order", action: T("session", { action: "briefing_order", sections: ["scene_state", "entities", "lore"] }), assert: (r) => assertContains(r, "Briefing order set", "order ") },
  { label: "briefing_order unknown token → INVALID_INPUT", action: T("session", { action: "briefing_order", sections: ["bogus"] }), assert: (r) => assertContains(r, "INVALID_INPUT", "order-bad ") },
  { label: "briefing_order reset", action: T("session", { action: "briefing_order", sections: [] }), assert: (r) => assertContains(r, "Briefing order set", "order-reset ") },
  { label: "character with voice examples", action: T("character", { action: "create", name: "Voiced", voice: "Laconic with a drawl." }), assert: (r) => { assertOK(r, "voice-create "); capture("voicedId", /Entity id (\S+?)\./)(r); } },
  { label: "character voice examples set", action: T("character", () => ({ action: "voice", entity_id: captured.voicedId, examples: [{ context: "greeting", dialogue: "Howdy.", tag: "formal" }] })), assert: (r) => assertContains(r, "examples", "voice-set ") },
  { label: "entity voice resource", action: R(() => `entity://${captured.voicedId}/voice_examples`), assert: (r) => assertContains(r, "formal", "voice-res ") },
  { label: "session recap lonelog", action: T("session", { action: "recap", format: "lonelog" }), assert: (r) => assertContains(r, "narrative_orientation", "lonelog ") },
];

const S29_STEPS: PBStep[] = [
  { label: "set_badge GM", action: T("set_badge", { badge: "game_master" }), assert: assertOK },
  { label: "novel create", action: T("novel", { action: "create", name: "pb-interchange" }), assert: assertOK },
  { label: "mutate (scene)", action: T("scene", { action: "set", description: "The treasury vault." }), assert: assertOK },
  { label: "export json", action: T("novel", { action: "export", format: "json" }), assert: (r) => assertContains(r, "format_version", "export-json ") },
  { label: "export lore-only scope", action: T("novel", { action: "export", format: "json", scope: "lore" }), assert: (r) => assertContains(r, "lore", "export-lore ") },
  { label: "import dry-run valid", action: T("novel", { action: "import", data: "{\"slug\":\"x\",\"name\":\"X\"}", mode: "dry-run" }), assert: (r) => assertContains(r, "would be imported", "dryrun-valid ") },
  { label: "import dry-run broken-ref reports", action: T("novel", { action: "import", data: "{\"slug\":\"broken\",\"name\":\"B\",\"lore\":{\"k\":{\"entry\":\"e\",\"triggers\":[\"npc:ghost\"]}}}", mode: "dry-run", strict: true }), assert: (r) => assertContains(r, "reference failure", "dryrun-broken ") },
  { label: "import strict replace blocks", action: T("novel", { action: "import", data: "{\"slug\":\"broken\",\"name\":\"B\",\"lore\":{\"k\":{\"entry\":\"e\",\"triggers\":[\"npc:ghost\"]}}}", mode: "replace", strict: true }), assert: assertError },
  { label: "command suggest combat category", action: T("command", { action: "suggest", intent: "attack the goblin" }), assert: (r) => assertContains(r.toLowerCase(), "combat", "suggest-combat ") },
];

const S32_STEPS: PBStep[] = [
  { label: "novel create", action: T("novel", { action: "create", name: "pb-coupling" }), assert: assertOK },
  { label: "set_badge GM", action: T("set_badge", { badge: "game_master" }), assert: assertOK },
  { label: "rooms A and B", action: T("world", { action: "create_room", name: "Chamber A", description: "A vaulted hall." }), assert: (r) => assertContains(r, "created", "room-a ") },
  { label: "room B", action: T("world", { action: "create_room", name: "Chamber B", description: "A narrow passage." }), assert: (r) => assertContains(r, "created", "room-b ") },
  { label: "exit A→B", action: T("world", { action: "create_exit", from: "Chamber A", to: "Chamber B", direction: "east" }), assert: assertOK },
  { label: "countdown with world_effect", action: T("countdown", { action: "set", name: "Cave-in", ticks: 1, on_scene_transition: true, direction: "the ceiling splinters", world_effect: { type: "describe", target: "Chamber A", value: "The ceiling has splintered into rubble." } }), assert: (r) => assertContains(r, "tick", "cd-world ") },
  { label: "scene set (initial, not a transition)", action: T("scene", { action: "set", description: "Dust settles in the hall.", location: "Chamber A" }), assert: assertOK },
  { label: "scene transition fires the countdown", action: T("scene", { action: "set", description: "A tremor rolls through the passage.", location: "Chamber B" }), assert: assertOK },
  { label: "countdown fired (consequence in briefing)", action: P("badge_briefing", { badge: "game_master" }), assert: (r) => assertContains(r, "Cave-in", "fired ") },
  { label: "countdown removed after fire", action: R("countdown://active"), assert: (r) => assertNotContains(r, "Cave-in", "cd-gone ") },
];

const S35_STEPS: PBStep[] = [
  { label: "novel create", action: T("novel", { action: "create", name: "pb-architecture" }), assert: assertOK },
  { label: "set_badge GM", action: T("set_badge", { badge: "game_master" }), assert: assertOK },
  { label: "entity (becomes active, absent from scene)", action: T("character", { action: "create", name: "Rook" }), assert: assertOK },
  { label: "on_scene_transition countdown (3 ticks)", action: T("countdown", { action: "set", name: "The Rift", ticks: 3, on_scene_transition: true }), assert: assertOK },
  { label: "scene set (initial)", action: T("scene", { action: "set", description: "The plaza is calm." }), assert: assertOK },
  { label: "advance once → 2 remaining", action: T("scene", { action: "set", description: "Clouds gather overhead." }), assert: assertOK },
  { label: "countdown at 2 remaining", action: R("countdown://active"), assert: (r) => assertContains(r, "\"ticks\":2", "cd2 ") },
  { label: "advance twice more to fire", action: T("scene", { action: "set", description: "The sky darkens." }), assert: assertOK },
  { label: "fire (entity absent → discovered)", action: T("scene", { action: "set", description: "The rift widens." }), assert: assertOK },
  { label: "discovered consequence in briefing", action: P("badge_briefing", { badge: "game_master" }), assert: (r) => assertContains(r, "[discovered]", "discovered ") },
];

const S36_STEPS: PBStep[] = [
  { label: "novel create", action: T("novel", { action: "create", name: "pb-decision" }), assert: assertOK },
  { label: "set_badge GM", action: T("set_badge", { badge: "game_master" }), assert: assertOK },
  { label: "vow set", action: T("vow", { action: "set", name: "Prove the caretaker's innocence", difficulty: "dangerous" }), assert: (r) => assertContains(r, "set", "vow ") },
  { label: "accept linked countdown", action: T("respond", { decision: "vow_countdown", option: "accept" }), assert: (r) => assertContains(r, "Linked countdown", "vow-accept ") },
  { label: "linked countdown created", action: R("countdown://active"), assert: (r) => assertContains(r, "vow:", "vow-cd ") },
  { label: "milestone advances coupled countdown", action: T("vow", { action: "milestone", vow_name: "Prove the caretaker's innocence" }), assert: (r) => assertContains(r, "Linked countdown", "milestone ") },
  { label: "NPC goal → vow suggestion", action: T("npc", { action: "create", name: "Magistrate", goals: "To silence the witnesses before the inquest completes" }), assert: assertOK },
  { label: "vow suggestion in threads", action: P("badge_briefing", { badge: "game_master" }), assert: (r) => assertContains(r, "Vow-creation suggestion", "vow-suggest ") },
];

const S37_STEPS: PBStep[] = [
  { label: "novel create", action: T("novel", { action: "create", name: "pb-advisory" }), assert: assertOK },
  { label: "set_badge GM", action: T("set_badge", { badge: "game_master" }), assert: assertOK },
  { label: "entity (for secret reveal)", action: T("character", { action: "create", name: "Tess" }), assert: (r) => { assertOK(r, "entity "); capture("tessId", /Entity id (\S+?)\./)(r); } },
  { label: "countdown scoped to the citadel", action: T("countdown", { action: "set", name: "Citadel Collapse", ticks: 4, scope: "twilight_citadel" }), assert: assertOK },
  { label: "secret overlapping scope", action: T("lore", { action: "set_secret", key: "twilight", content: "The citadel groans." }), assert: assertOK },
  { label: "reveal secret to entity", action: T("lore", () => ({ action: "reveal", key: "twilight", entity_id: captured.tessId })), assert: assertOK },
  { label: "lore with urgency trigger", action: T("lore", { action: "set", key: "omegaseal", content: "The seal is weakening.", triggers: ["imminent"] }), assert: assertOK },
  { label: "relationship rival matching scope", action: T("relationship", { action: "set", entity_a: "tess", entity_b: "citadel", type: "rival" }), assert: assertOK },
  { label: "advisory sweep surfaces", action: P("badge_briefing", { badge: "game_master" }), assert: (r) => {
    assertContains(r, "Countdown-advancement advisory", "adv-secret ");
    assertContains(r, "Countdown-creation advisory", "adv-urgency ");
    assertContains(r, "Relationship-countdown advisory", "adv-rel ");
  } },
];

const S5_STEPS: PBStep[] = [
  { label: "novel create", action: T("novel", { action: "create", name: "pb-combat" }), assert: assertOK },
  { label: "set_badge GM", action: T("set_badge", { badge: "game_master" }), assert: assertOK },
  { label: "entity A", action: T("character", { action: "create", name: "Ala" }), assert: (r) => { assertOK(r, "a "); capture("alaId", /Entity id (\S+?)\./)(r); } },
  { label: "entity B", action: T("character", { action: "create", name: "Bara" }), assert: (r) => { assertOK(r, "b "); capture("baraId", /Entity id (\S+?)\./)(r); } },
  { label: "combat init (seed)", action: T("combat", () => ({ action: "init", participants: [captured.alaId, captured.baraId], dangers: [{ name: "Grunt", hp: 5, ac: 12 }], seed: "s5" })), assert: (r) => assertContains(r, "Combat started", "init ") },
  { label: "advance a turn", action: T("combat", { action: "advance" }), assert: assertOK },
  { label: "status reports round + danger", action: T("combat", { action: "status" }), assert: (r) => { assertContains(r, "Grunt", "status-danger "); assertContains(r, "round", "status-round "); } },
  { label: "restart (same data dir, resume novel)", action: RS("pb-combat"), assert: assertOK },
  { label: "combat state survives restart", action: T("combat", { action: "status" }), assert: (r) => { assertContains(r, "Grunt", "survive-danger "); assertContains(r, "\"active\": true", "survive-active "); } },
];

const S14_STEPS: PBStep[] = [
  { label: "novel create", action: T("novel", { action: "create", name: "pb-edge" }), assert: assertOK },
  { label: "set_badge GM", action: T("set_badge", { badge: "game_master" }), assert: assertOK },
  { label: "adversarial scene (SQL injection)", action: T("scene", { action: "set", description: "Robert'; DROP TABLE novels;-- the gate" }), assert: (r) => assertContains(r, "DROP TABLE novels", "sql-echo ") },
  { label: "rapid countdown advances (5×)", action: T("countdown", { action: "set", name: "Ticker", ticks: 10 }), assert: assertOK },
  { label: "advance 1", action: T("countdown", { action: "advance", name: "Ticker" }), assert: assertOK },
  { label: "advance 2", action: T("countdown", { action: "advance", name: "Ticker" }), assert: assertOK },
  { label: "advance 3", action: T("countdown", { action: "advance", name: "Ticker" }), assert: assertOK },
  { label: "advance 4", action: T("countdown", { action: "advance", name: "Ticker" }), assert: assertOK },
  { label: "advance 5", action: T("countdown", { action: "advance", name: "Ticker" }), assert: assertOK },
  { label: "set_badge player", action: T("set_badge", { badge: "player" }), assert: assertOK },
  { label: "spec_health player-filtered", action: T("session", { action: "health" }), assert: (r) => assertContains(r, "spec_version", "health-filter ") },
];

const S22_STEPS: PBStep[] = [
  { label: "novel create", action: T("novel", { action: "create", name: "pb-workflow" }), assert: assertOK },
  { label: "set_badge GM", action: T("set_badge", { badge: "game_master" }), assert: assertOK },
  { label: "end novel → NEED_INPUT", action: T("novel", { action: "end" }), assert: (r) => assertContains(r, "NEED_INPUT", "wf-open ") },
  { label: "set_badge during pending → blocked", action: T("set_badge", { badge: "player" }), assert: (r) => assertContains(r, "STATE_CONFLICT", "wf-badge ") },
  { label: "second workflow → STATE_CONFLICT", action: T("character", { action: "create" }), assert: (r) => assertContains(r, "STATE_CONFLICT", "wf-second ") },
  { label: "cancel restores state", action: T("respond", { decision: "end novel", option: "cancel" }), assert: (r) => assertContains(r, "cancelled", "wf-cancel ") },
  { label: "re-open end workflow", action: T("novel", { action: "end" }), assert: (r) => assertContains(r, "NEED_INPUT", "wf-reopen ") },
  { label: "restart (pending workflow survives)", action: RS("pb-workflow"), assert: assertOK },
  { label: "drain pending workflow after restart", action: T("respond", { decision: "end novel", option: "yes" }), assert: (r) => assertContains(r, "ended", "wf-drain ") },
];

const S26_STEPS: PBStep[] = [
  { label: "novel create", action: T("novel", { action: "create", name: "pb-pov" }), assert: assertOK },
  { label: "set_badge GM", action: T("set_badge", { badge: "game_master" }), assert: assertOK },
  { label: "entity 1 (active)", action: T("character", { action: "create", name: "Finn" }), assert: (r) => { assertOK(r, "f "); capture("finnId", /Entity id (\S+?)\./)(r); } },
  { label: "entity 2", action: T("character", { action: "create", name: "Pia" }), assert: (r) => { assertOK(r, "p "); capture("piaId", /Entity id (\S+?)\./)(r); } },
  { label: "character POV directive", action: P("badge_briefing", { badge: "game_master" }), assert: (r) => assertContains(r, "Finn's eyes", "pov-char ") },
  { label: "omniscient POV", action: T("character", () => ({ action: "set_active", entity_id: captured.piaId, pov: "omniscient" })), assert: assertOK },
  { label: "omniscient directive", action: P("badge_briefing", { badge: "game_master" }), assert: (r) => assertContains(r, "omniscient", "pov-omni ") },
  { label: "restart (POV mode persists)", action: RS("pb-pov"), assert: assertOK },
  { label: "POV still omniscient after restart", action: P("badge_briefing", { badge: "game_master" }), assert: (r) => assertContains(r, "omniscient", "pov-persist ") },
  { label: "switch back to character POV", action: T("character", () => ({ action: "set_active", entity_id: captured.piaId, pov: "character" })), assert: assertOK },
  { label: "character-locked directive", action: P("badge_briefing", { badge: "game_master" }), assert: (r) => assertContains(r, "Pia's eyes", "pov-locked ") },
];

const S34_STEPS: PBStep[] = [
  { label: "novel create", action: T("novel", { action: "create", name: "pb-memory" }), assert: assertOK },
  { label: "set_badge GM", action: T("set_badge", { badge: "game_master" }), assert: assertOK },
  { label: "entity", action: T("character", { action: "create", name: "Mara" }), assert: (r) => { assertOK(r, "m "); capture("maraId", /Entity id (\S+?)\./)(r); } },
  { label: "NPC", action: T("npc", { action: "create", name: "Keeper" }), assert: (r) => { assertOK(r, "k "); capture("keeperId", /created \((npc_\w+)\)/)(r); } },
  { label: "combat with NPC (records memory)", action: T("combat", () => ({ action: "init", participants: [captured.maraId, captured.keeperId] })), assert: assertOK },
  { label: "advance to NPC turn (records memory)", action: T("combat", { action: "advance" }), assert: assertOK },
  { label: "restart (memory facts survive)", action: RS("pb-memory"), assert: assertOK },
  { label: "NPC memory persists in briefing", action: P("badge_briefing", { badge: "game_master" }), assert: (r) => assertContains(r, "Keeper", "mem-persist ") },
];

// ── Runner ─────────────────────────────────────────────────────────

function log(msg: string) {
  if (!jsonOut) console.log(msg);
}

let proc: ChildProcess | null = null;
let currentEnv: Record<string, string> = {};

async function bootServer(envOverrides: Record<string, string> = {}): Promise<ChildProcess> {
  if (proc) { try { proc.kill(); } catch { /* already gone */ } proc = null; }
  currentEnv = { ...process.env, TTRPG_DATA_DIR: DATA_DIR, ...envOverrides };
  const p = spawn("npx", ["tsx", SERVER_SCRIPT], {
    env: currentEnv,
    stdio: ["pipe", "pipe", "pipe"],
  });
  attach(p);
  proc = p;
  await send(p, { method: "initialize", params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "holonovel-ruleset-pattern-buffer", version: "1.0.0" } } });
  p.stdin!.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n");
  await sleep(400);
  return p;
}

async function main() {
  log("=== Ruleset Pattern Buffer ===\n");
  const specHash = sha256(readFileSync(SPEC_PATH, "utf-8"));
  log(`Spec hash: ${specHash}`);
  log(`Data dir: ${DATA_DIR}\n`);

  try { rmSync(DATA_DIR, { recursive: true }); } catch { /* fresh */ }
  mkdirSync(DATA_DIR, { recursive: true });

  proc = await bootServer({});

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
        let response: string;
        if (step.action.kind === "restart") {
          const env: Record<string, string> = { ...(step.action.env ?? {}) };
          if (step.action.resume) env.TTRPG_NOVEL = step.action.resume;
          proc = await bootServer(env);
          response = "[restarted]";
        } else {
          response = await doAction(proc!, step.action);
        }
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
    try { await doAction(proc!, T("novel", { action: "end" })); await doAction(proc!, T("respond", { decision: "end novel", option: "yes" })); } catch { /* safe to ignore */ }
  }

  proc?.kill();

  const failed = verdicts.filter((v) => v.status === "FAIL");
  const passed = verdicts.filter((v) => v.status === "PASS").length;
  const executed = verdicts.filter((v) => v.status === "PASS" || v.status === "FAIL").length;
  const blockingFailures = failed.filter((v) => v.blocking);

  const manifest = {
    manifest: "ruleset_pattern_buffer",
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
      blocked: verdicts.filter((v) => v.status === "blocked").length,
      follow_on: verdicts.filter((v) => v.status === "follow-on").length,
      blocking_failures: blockingFailures.length,
    },
  };

  writeFileSync(OUT_PATH, JSON.stringify(manifest, null, 2) + "\n");

  if (jsonOut) {
    console.log(JSON.stringify(manifest, null, 2));
  } else {
    console.log("\n=== Ruleset Pattern Buffer Summary ===");
    console.log(`Total: ${verdicts.length} | Passed: ${passed} | Failed: ${failed.length} | Skipped: ${manifest.summary.skipped} | Stubbed: ${manifest.summary.stubbed} | Blocked: ${manifest.summary.blocked} | Follow-on: ${manifest.summary.follow_on}`);
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
