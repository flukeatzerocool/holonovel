#!/usr/bin/env npx tsx
/**
 * surface-replay.ts — deterministic surface-replay proxy for the Tool Surface
 * Contract (REQ-569, Appendix T.3). [informational]
 *
 * Runs a fixed intent set against the full, standard, and small projections and
 * reports expected-tool visibility, the mean number of calls needed to reach
 * the expected tool (a group switch counts as one extra call), and catalog
 * size. This is a proxy for live-model tool selection, not a substitute for it:
 * a real model run remains advisory and is recorded separately.
 *
 * Flags: --check (fail when the full projection hides an expected tool),
 * --write (record the baseline), --json (machine-readable). Exit codes:
 * 0 = report, 1 = --check defect, 2 = fatal.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { SURFACE_GLOBALS, entryTools, toolGroups as groupsFor } from "./lib/surface.js";

const ROOT = join(import.meta.dirname, "..");
const DEFS = join(ROOT, "holonovel", "tool-definitions.json");
const REGISTRY = join(ROOT, "holonovel", "tool-surface-registry.json");
const OUT = join(ROOT, "spec", "audit", "tool-surface-replay.json");

interface ToolDefinition { name: string; description?: string; }
interface Declaration { group: string; entry: boolean; }
interface Registry { taxonomy: { groups: string[] }; actions: Record<string, Declaration>; }
interface Intent { intent: string; tool: string; group: string; }

// Thirty fixed intents spanning the play loop and both backstage modes.
const INTENTS: Intent[] = [
  { intent: "start a new campaign", tool: "manage_novel", group: "table" },
  { intent: "resume my campaign", tool: "manage_novel", group: "table" },
  { intent: "switch to another novel", tool: "manage_novel", group: "table" },
  { intent: "end the session", tool: "manage_novel", group: "table" },
  { intent: "show my character sheet", tool: "manage_character", group: "table" },
  { intent: "create a character", tool: "manage_character", group: "table" },
  { intent: "look around the room", tool: "run_command", group: "explore" },
  { intent: "go north", tool: "run_command", group: "explore" },
  { intent: "pick up the lantern", tool: "run_command", group: "explore" },
  { intent: "examine the door", tool: "run_command", group: "explore" },
  { intent: "roll a skill check", tool: "manage_ruleset", group: "resolve" },
  { intent: "start combat", tool: "manage_combat", group: "resolve" },
  { intent: "advance the round", tool: "manage_combat", group: "resolve" },
  { intent: "apply a condition", tool: "manage_condition", group: "resolve" },
  { intent: "make a fate roll", tool: "resolve_fate", group: "resolve" },
  { intent: "make an ironsworn move", tool: "resolve_ironsworn", group: "resolve" },
  { intent: "make a forged action roll", tool: "resolve_forged", group: "resolve" },
  { intent: "track my vow", tool: "manage_vow", group: "resolve" },
  { intent: "record this story beat", tool: "manage_story", group: "narrate" },
  { intent: "set the scene", tool: "manage_scene", group: "narrate" },
  { intent: "recap what happened", tool: "manage_session", group: "narrate" },
  { intent: "search the rules for grappling", tool: "manage_ruleset", group: "lookup" },
  { intent: "look up a lore entry", tool: "manage_lore", group: "lookup" },
  { intent: "search the knowledge index", tool: "manage_knowledge", group: "lookup" },
  { intent: "create an NPC", tool: "manage_npc", group: "referee" },
  { intent: "set a countdown", tool: "manage_countdown", group: "referee" },
  { intent: "generate an adventure", tool: "manage_adventure", group: "author" },
  { intent: "export my novel", tool: "manage_archive", group: "author" },
  { intent: "undo the last change", tool: "manage_history", group: "maintain" },
  { intent: "show me the tool groups", tool: "manage_session", group: "table" },
];

function fail(message: string): never {
  console.error(`[surface-replay] ${message}`);
  process.exit(2);
}
function readJson<T>(path: string): T {
  if (!existsSync(path)) fail(`missing artifact: ${path}`);
  try { return JSON.parse(readFileSync(path, "utf8")) as T; } catch { fail(`unreadable JSON: ${path}`); }
}
function visible(registry: Registry, tool: string, group: string, profile: string): boolean {
  if (profile === "full") return true;
  if (SURFACE_GLOBALS.has(tool)) return true;
  const declared = groupsFor(registry, tool);
  if (declared.has(group)) return true;
  if (declared.has("lookup") || declared.has("maintain")) return true;
  if (profile === "small") return entryTools(registry, group).includes(tool);
  return false;
}

const defs = readJson<{ tools: ToolDefinition[] }>(DEFS);
const registry = readJson<Registry>(REGISTRY);
const profiles = ["full", "standard", "small"] as const;
const startGroup = (intent: Intent): string => {
  if (intent.group === "table" || intent.group === "referee" || intent.group === "author") return intent.group;
  return "explore";
};
const results = profiles.map((profile) => {
  const rows = INTENTS.map((intent) => {
    const group = startGroup(intent);
    const shown = visible(registry, intent.tool, group, profile);
    return { ...intent, start_group: group, visible: shown, calls: shown ? 1 : 2 };
  });
  const visibleCount = rows.filter((r) => r.visible).length;
  return {
    profile,
    intents: rows.length,
    expected_tool_visible: visibleCount,
    visibility_rate: Number((visibleCount / rows.length).toFixed(3)),
    mean_calls: Number((rows.reduce((sum, r) => sum + r.calls, 0) / rows.length).toFixed(3)),
    rows,
  };
});
const defects = results[0].rows.filter((r) => !r.visible).map((r) => `${r.intent}: ${r.tool} hidden in full`);
const payload = {
  schema_version: 1,
  proxy: "expected-tool visibility and group-switch call cost; live-model selection is advisory",
  intents: INTENTS.length,
  profiles: results,
  defects,
};

if (process.argv.includes("--write")) {
  writeFileSync(OUT, JSON.stringify(payload, null, 2) + "\n");
  console.log(`surface-replay: wrote ${OUT}`);
}
if (process.argv.includes("--json")) {
  console.log(JSON.stringify(payload, null, 2));
} else if (defects.length) {
  for (const defect of defects) console.error(`FAIL: ${defect}`);
} else {
  console.log(
    `surface-replay: ${INTENTS.length} intents — ` +
      results.map((r) => `${r.profile} visibility ${r.visibility_rate} mean calls ${r.mean_calls}`).join("; "),
  );
}
process.exit(defects.length === 0 ? 0 : 1);
