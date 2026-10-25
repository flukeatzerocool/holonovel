#!/usr/bin/env npx tsx
/**
 * surface-replay.ts — deterministic expected-action baseline for the Tool
 * Surface Contract (REQ-569, REQ-584, Appendix T.3). [informational; gate with --check]
 *
 * Runs a fixed intent set through the shared projection for the full, standard,
 * and small profiles and reports expected-action selection precision,
 * wrong-selection count, expected-tool visibility, the mean number of calls
 * needed to reach the expected tool, and catalog size. Routing text comes from
 * the committed `holonovel/tool-routing.json` plus the tool name, action, and
 * description; no model inference is involved.
 *
 * `full` and `standard` must be call-complete (visibility 1.0, mean calls 1.0)
 * and must meet the 0.90 expected-action precision floor. A separate held-out
 * set is reported as an advisory generalization signal and is not gated.
 *
 * Flags: --check (default), --write, --json, --help. Exit codes: 0 = report,
 * 1 = --check defect, 2 = fatal.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { projectToolList, type SurfaceRegistryLike, type SurfaceTool } from "../holonovel/src/core/surface-projection.js";

const ROOT = join(import.meta.dirname, "..");
const DEFS = join(ROOT, "holonovel", "tool-definitions.json");
const REGISTRY = join(ROOT, "holonovel", "tool-surface-registry.json");
const ROUTING = join(ROOT, "holonovel", "tool-routing.json");
const OUT = join(ROOT, "spec", "audit", "tool-surface-replay.json");
const BUDGETS = join(ROOT, "spec", "audit", "tool-surface-baseline.json");

interface ToolDefinition { name: string; description?: string; action_enum?: string[]; }
interface Registry extends SurfaceRegistryLike { taxonomy: { groups: string[] } }
interface Intent { intent: string; tool: string; action?: string; group: string; steps?: number; }
interface Routing { schema_version: number; actions: Record<string, string[]>; }

const ARGV = process.argv.slice(2);
const KNOWN = new Set(["--check", "--write", "--json", "--help", "-h"]);
for (const arg of ARGV) {
  if (!KNOWN.has(arg)) {
    console.error(`[surface-replay] unknown flag: ${arg}`);
    process.exit(1);
  }
}
if (ARGV.includes("--help") || ARGV.includes("-h")) {
  console.log("surface-replay — deterministic expected-action baseline and call-cost proxy\n");
  console.log("Usage: npx tsx scripts/surface-replay.ts [--check] [--write] [--json]\n");
  console.log("  --check  fail on visibility, call-cost, or precision defects (default)");
  console.log("  --write  record spec/audit/tool-surface-replay.json");
  console.log("  --json   machine-readable payload to stdout");
  process.exit(0);
}

// Thirty fixed intents spanning the play loop and both backstage modes, plus
// ten near-miss intents authored from the Appendix T.3 user goals.
const INTENTS: Intent[] = [
  { intent: "start a new campaign", tool: "manage_novel", action: "create", group: "table" },
  { intent: "resume my campaign", tool: "manage_novel", action: "resume", group: "table" },
  { intent: "switch to another novel", tool: "manage_novel", action: "switch", group: "table" },
  { intent: "end the session", tool: "close_session", group: "table" },
  { intent: "show my character sheet", tool: "manage_character", action: "sheet", group: "table" },
  { intent: "create a character", tool: "manage_character", action: "create", group: "table" },
  { intent: "look around the room", tool: "run_command", action: "resolve", group: "explore" },
  { intent: "go north", tool: "run_command", action: "resolve", group: "explore" },
  { intent: "pick up the lantern", tool: "run_command", action: "execute", group: "explore" },
  { intent: "examine the door", tool: "run_command", action: "resolve", group: "explore" },
  { intent: "roll a skill check", tool: "resolve_mechanic", action: "roll", group: "resolve" },
  { intent: "start combat", tool: "manage_combat", action: "init", group: "resolve" },
  { intent: "advance the round", tool: "manage_combat", action: "advance", group: "resolve" },
  { intent: "apply a condition", tool: "manage_condition", action: "apply", group: "resolve" },
  { intent: "make a fate roll", tool: "resolve_mechanic", action: "fate_roll", group: "resolve" },
  { intent: "make an ironsworn move", tool: "resolve_mechanic", action: "ironsworn_move", group: "resolve" },
  { intent: "make a forged action roll", tool: "resolve_mechanic", action: "forged_action_roll", group: "resolve" },
  { intent: "track my vow", tool: "manage_vow", action: "set", group: "resolve" },
  { intent: "record this story beat", tool: "manage_story", action: "record", group: "narrate" },
  { intent: "set the scene", tool: "manage_scene", action: "set", group: "narrate" },
  { intent: "recap what happened", tool: "manage_session", action: "recap", group: "narrate" },
  { intent: "search the rules for grappling", tool: "manage_ruleset", action: "search", group: "lookup" },
  { intent: "look up a lore entry", tool: "manage_lore", action: "get", group: "lookup" },
  { intent: "search the knowledge index", tool: "manage_knowledge", action: "index_search", group: "lookup" },
  { intent: "create an NPC", tool: "manage_npc", action: "create", group: "referee" },
  { intent: "set a countdown", tool: "manage_countdown", action: "set", group: "referee" },
  { intent: "generate an adventure", tool: "manage_adventure", action: "generate", group: "author" },
  { intent: "export my novel", tool: "manage_archive", action: "export", group: "author" },
  { intent: "undo the last change", tool: "manage_history", action: "undo", group: "maintain" },
  { intent: "show me the tool groups", tool: "manage_session", action: "discover", group: "table" },
  { intent: "roll initiative", tool: "manage_combat", action: "init", group: "resolve" },
  { intent: "who is in the room", tool: "run_command", action: "resolve", group: "explore" },
  { intent: "save my progress", tool: "manage_novel", action: "save_context", group: "table" },
  { intent: "look up a monster", tool: "manage_ruleset", action: "search", group: "lookup" },
  { intent: "give the NPC an item", tool: "run_command", action: "execute", group: "explore" },
  { intent: "show my inventory", tool: "manage_character", action: "sheet", group: "table" },
  { intent: "end combat", tool: "manage_combat", action: "end", group: "resolve" },
  { intent: "begin a new character", tool: "manage_character", action: "create", group: "table" },
  { intent: "what are my options", tool: "manage_scene", action: "choices", group: "narrate" },
  { intent: "archive this campaign", tool: "manage_archive", action: "archive", group: "author" },
  // REQ-586 — multi-step workflows. `steps` is the number of calls the
  // workflow takes once its expected action is reachable; the row's
  // expected_calls is `steps` under a call-complete profile.
  { intent: "make a new character", tool: "manage_character", action: "create", group: "table", steps: 3 },
  { intent: "begin a fight", tool: "manage_combat", action: "init", group: "resolve", steps: 3 },
  { intent: "move to another room", tool: "run_command", action: "resolve", group: "explore", steps: 2 },
  { intent: "load a saved game", tool: "manage_novel", action: "resume", group: "table", steps: 2 },
  { intent: "make a skill check", tool: "resolve_mechanic", action: "roll", group: "resolve", steps: 2 },
  { intent: "pick up an object", tool: "run_command", action: "execute", group: "explore", steps: 3 },
];

// Advisory only: differently worded intents that do not appear in the routing
// text. They measure generalization of the lexical router; they do not gate.
const HELD_OUT: Intent[] = [
  { intent: "begin a fresh story", tool: "manage_novel", action: "create", group: "table" },
  { intent: "go back to my saved game", tool: "manage_novel", action: "resume", group: "table" },
  { intent: "what is in this place", tool: "run_command", action: "resolve", group: "explore" },
  { intent: "grab the sword", tool: "run_command", action: "execute", group: "explore" },
  { intent: "test my agility", tool: "resolve_mechanic", action: "roll", group: "resolve" },
  { intent: "kick off a fight", tool: "manage_combat", action: "init", group: "resolve" },
  { intent: "next turn", tool: "manage_combat", action: "advance", group: "resolve" },
  { intent: "wrap up the session", tool: "close_session", group: "table" },
  { intent: "jot down this event", tool: "manage_story", action: "record", group: "narrate" },
  { intent: "send the campaign to a file", tool: "manage_archive", action: "export", group: "author" },
];

const STOP = new Set(["a", "an", "the", "my", "this", "that", "me", "to", "of", "for", "what", "how", "is", "up", "around", "new", "last", "in", "on"]);
const SYNONYMS: Record<string, string[]> = {
  start: ["create", "begin"], end: ["close", "finish"], look: ["examine", "inspect", "resolve"],
  go: ["move", "walk"], pick: ["take", "grab"], roll: ["check"], track: ["set"],
  show: ["list", "discover"], create: ["make"], search: ["find"], advance: ["next"],
  recap: ["summary"], export: ["archive"], undo: ["revert"], generate: ["create"],
  campaign: ["novel"], sheet: ["character", "inventory"], combat: ["init", "fight"],
};

function tokens(value: string): string[] {
  return value.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length > 1 && !STOP.has(t));
}
function fail(message: string): never {
  console.error(`[surface-replay] ${message}`);
  process.exit(2);
}
function readJson<T>(path: string): T {
  if (!existsSync(path)) fail(`missing artifact: ${path}`);
  try { return JSON.parse(readFileSync(path, "utf8")) as T; } catch { fail(`unreadable JSON: ${path}`); }
}

const defs = readJson<{ tools: ToolDefinition[] }>(DEFS);
const registry = readJson<Registry>(REGISTRY);
const routing = readJson<Routing>(ROUTING);
const budgetArtifact = readJson<{
  measurements: { full: { tokens: number } };
  budgets: { standard: number; small: number };
}>(BUDGETS);
const priorReplay = existsSync(OUT) ? readJson<{ profiles?: Array<{ profile: string; visibility_rate?: number; recall_at_budget?: { recall: number } }> }>(OUT) : null;
const budgetFor = (profile: "full" | "standard" | "small"): number =>
  profile === "full" ? budgetArtifact.measurements.full.tokens
  : profile === "standard" ? budgetArtifact.budgets.standard
  : budgetArtifact.budgets.small;
const tools = defs.tools as SurfaceTool[];
const profiles = ["full", "standard", "small"] as const;
const startGroup = (intent: Intent): string => {
  if (intent.group === "table" || intent.group === "referee" || intent.group === "author") return intent.group;
  return "explore";
};

function routingScore(intentTokens: Set<string>, hints: string[]): number {
  let best = 0;
  for (const hint of hints) {
    const hintTokens = new Set(tokens(hint));
    if (hintTokens.size === 0) continue;
    let overlap = 0;
    for (const token of hintTokens) if (intentTokens.has(token)) overlap++;
    if (overlap === hintTokens.size) best = Math.max(best, 25);
    else if (overlap / hintTokens.size >= 0.5) best = Math.max(best, 12);
  }
  return best;
}

function selectFirstChoice(intent: string, catalog: ToolDefinition[]): { tool: string | null; action: string | null } {
  const original = new Set(tokens(intent));
  const expanded = new Set(original);
  for (const token of original) for (const synonym of SYNONYMS[token] ?? []) expanded.add(synonym);
  let best: { tool: string; action: string | null; score: number } | null = null;
  for (const tool of catalog) {
    const toolHasHints = Object.keys(routing.actions).some(
      (key) => key === tool.name || key.startsWith(`${tool.name}.`),
    );
    const actions = tool.action_enum?.length ? tool.action_enum : [null];
    for (const action of actions) {
      const key = action ? `${tool.name}.${action}` : tool.name;
      // Committed routing text is authoritative for the actions it covers; the
      // lexical score only ranks actions the routing artifact does not cover.
      const hints = routing.actions[key] ?? [];
      let lexical = 0;
      for (const token of tokens(tool.name)) lexical += original.has(token) ? 6 : (expanded.has(token) ? 2 : 0);
      for (const token of action ? tokens(action) : []) lexical += original.has(token) ? 6 : (expanded.has(token) ? 1 : 0);
      for (const token of tokens(tool.description ?? "")) lexical += original.has(token) ? 2 : (expanded.has(token) ? 1 : 0);
      // Routing text dominates where it exists; lexical overlap breaks ties and
      // ranks actions the artifact does not cover.
      const score = hints.length > 0
        ? routingScore(original, hints) + Math.round(lexical * 0.3)
        : toolHasHints
          ? Math.round(lexical * 0.4)
          : lexical;
      if (
        !best ||
        score > best.score ||
        (score === best.score && key < `${best.tool}.${best.action ?? ""}`)
      ) {
        best = { tool: tool.name, action, score };
      }
    }
  }
  return best ? { tool: best.tool, action: best.action } : { tool: null, action: null };
}

function runSet(intents: Intent[], profile: "full" | "standard" | "small") {
  return intents.map((intent) => {
    const group = startGroup(intent);
    const projected = projectToolList(tools, { profile, group: null, activeGroup: group, registry });
    const shown = projected.some((tool) => tool.name === intent.tool);
    const selected = selectFirstChoice(intent.intent, projected as ToolDefinition[]);
    const correct = selected.tool === intent.tool && (intent.action === undefined || selected.action === intent.action);
    const steps = intent.steps ?? 1;
    return {
      ...intent,
      start_group: group,
      visible: shown,
      calls: (shown ? 1 : 2) + (steps - 1),
      expected_calls: steps,
      selected,
      correct,
    };
  });
}

const results = profiles.map((profile) => {
  const rows = runSet(INTENTS, profile);
  const visibleCount = rows.filter((row) => row.visible).length;
  const correctCount = rows.filter((row) => row.correct).length;
  return {
    profile,
    intents: rows.length,
    expected_tool_visible: visibleCount,
    visibility_rate: Number((visibleCount / rows.length).toFixed(3)),
    expected_action_selected: correctCount,
    selection_precision: Number((correctCount / rows.length).toFixed(3)),
    wrong_selection_count: rows.length - correctCount,
    mean_calls: Number((rows.reduce((sum, row) => sum + row.calls, 0) / rows.length).toFixed(3)),
    // REQ-608 — recall at the profile's recorded catalog budget.
    recall_at_budget: {
      budget_tokens: budgetFor(profile),
      expected_action_recalled: visibleCount,
      recall: Number((visibleCount / rows.length).toFixed(3)),
    },
    rows,
  };
});
const heldOut = runSet(HELD_OUT, "full");
const heldOutCorrect = heldOut.filter((row) => row.correct).length;
const heldOutResult = {
  intents: heldOut.length,
  selection_precision: Number((heldOutCorrect / heldOut.length).toFixed(3)),
  wrong_selection_count: heldOut.length - heldOutCorrect,
  rows: heldOut,
};

// T682 — the detector must count a sibling action as a wrong selection.
const fixtureIntent = { intent: "make an ironsworn move", tool: "resolve_mechanic", action: "fate_roll", group: "resolve" } as Intent;
const fullCatalog = projectToolList(tools, { profile: "full", group: null, activeGroup: "resolve", registry });
const fixtureSelected = selectFirstChoice(fixtureIntent.intent, fullCatalog as ToolDefinition[]);
const fixtureWrong = !(fixtureSelected.tool === fixtureIntent.tool && fixtureSelected.action === fixtureIntent.action);

const defects: string[] = [];
for (const result of results) {
  if (result.profile !== "full" && result.profile !== "standard") continue;
  const hidden = result.rows.filter((row) => !row.visible);
  if (hidden.length > 0) {
    defects.push(`${hidden.length} intent(s) hidden in ${result.profile}: ${hidden.map((row) => row.intent).join("; ")}`);
  }
  const misCalls = result.rows.filter((row) => row.calls !== row.expected_calls);
  if (misCalls.length > 0) {
    defects.push(`${result.profile} call cost differs from expected on: ${misCalls.map((row) => `${row.intent} (${row.calls} != ${row.expected_calls})`).join("; ")}`);
  }
  if (result.selection_precision < 0.9) {
    defects.push(`${result.profile} selection precision ${result.selection_precision} is below 0.90`);
  }
}
if (!fixtureWrong) defects.push("expected-action fixture did not record a wrong sibling selection");
for (const result of results) {
  const prior = priorReplay?.profiles?.find((p) => p.profile === result.profile);
  const priorRecall = prior?.recall_at_budget?.recall ?? prior?.visibility_rate;
  if (typeof priorRecall === "number" && result.recall_at_budget.recall < priorRecall) {
    defects.push(`${result.profile} recall ${result.recall_at_budget.recall} is below the recorded ${priorRecall}`);
  }
}
for (const key of Object.keys(routing.actions)) {
  const [name, action] = key.split(".");
  const tool = (tools as ToolDefinition[]).find((t) => t.name === name);
  const known = tool && (!action || (tool.action_enum ?? []).includes(action));
  if (!known) defects.push(`routing hint targets unknown action '${key}'`);
}

const payload = {
  schema_version: 5,
  proxy: "expected-action selection precision, wrong-selection count, visibility, recall at budget, and group-switch call cost; live-model selection is advisory",
  intents: INTENTS.length,
  precision_floor: 0.9,
  routing_source: "holonovel/tool-routing.json",
  profiles: results,
  held_out: heldOutResult,
  defects,
};

if (ARGV.includes("--write")) {
  writeFileSync(OUT, JSON.stringify(payload, null, 2) + "\n");
  console.log(`surface-replay: wrote ${OUT}`);
}
if (ARGV.includes("--json")) {
  console.log(JSON.stringify(payload, null, 2));
} else if (defects.length) {
  for (const defect of defects) console.error(`FAIL: ${defect}`);
} else {
  console.log(
    `surface-replay: ${INTENTS.length} intents — ` +
      results.map((result) => `${result.profile} visibility ${result.visibility_rate} precision ${result.selection_precision} wrong ${result.wrong_selection_count} mean calls ${result.mean_calls}`).join("; ") +
      `; held-out precision ${heldOutResult.selection_precision} (advisory)`,
  );
}
process.exit(defects.length === 0 ? 0 : 1);
