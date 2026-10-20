#!/usr/bin/env npx tsx
/**
 * surface-replay.ts — deterministic surface-replay proxy for the Tool Surface
 * Contract (REQ-569, Appendix T.3). [informational; gate with --check]
 *
 * Runs a fixed intent set through the shared projection for the full,
 * standard, and small profiles and reports expected-tool visibility, the mean
 * number of calls needed to reach the expected tool (a group switch counts as
 * one extra call), and catalog size. `full` and `standard` must be
 * call-complete: visibility 1.0 and mean calls 1.0. `small` is a discovery
 * catalog and is reported without a call-cost gate.
 *
 * Flags: --check (default; fail when full or standard hides an expected tool),
 * --write (record the baseline), --json (machine-readable), --help. Exit codes:
 * 0 = report, 1 = --check defect, 2 = fatal.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { projectToolList, type SurfaceRegistryLike, type SurfaceTool } from "../holonovel/src/core/surface-projection.js";

const ROOT = join(import.meta.dirname, "..");
const DEFS = join(ROOT, "holonovel", "tool-definitions.json");
const REGISTRY = join(ROOT, "holonovel", "tool-surface-registry.json");
const OUT = join(ROOT, "spec", "audit", "tool-surface-replay.json");

interface ToolDefinition { name: string; description?: string; }
interface Registry extends SurfaceRegistryLike { taxonomy: { groups: string[] } }
interface Intent { intent: string; tool: string; group: string; }

const ARGV = process.argv.slice(2);
const KNOWN = new Set(["--check", "--write", "--json", "--help", "-h"]);
for (const arg of ARGV) {
  if (!KNOWN.has(arg)) {
    console.error(`[surface-replay] unknown flag: ${arg}`);
    process.exit(1);
  }
}
if (ARGV.includes("--help") || ARGV.includes("-h")) {
  console.log("surface-replay — deterministic visibility and call-cost proxy\n");
  console.log("Usage: npx tsx scripts/surface-replay.ts [--check] [--write] [--json]\n");
  console.log("  --check  fail when full or standard hides an expected tool (default)");
  console.log("  --write  record spec/audit/tool-surface-replay.json");
  console.log("  --json   machine-readable payload to stdout");
  process.exit(0);
}

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
  { intent: "make a fate roll", tool: "resolve_mechanic", group: "resolve" },
  { intent: "make an ironsworn move", tool: "resolve_mechanic", group: "resolve" },
  { intent: "make a forged action roll", tool: "resolve_mechanic", group: "resolve" },
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

const defs = readJson<{ tools: ToolDefinition[] }>(DEFS);
const registry = readJson<Registry>(REGISTRY);
const tools = defs.tools as SurfaceTool[];
const profiles = ["full", "standard", "small"] as const;
const startGroup = (intent: Intent): string => {
  if (intent.group === "table" || intent.group === "referee" || intent.group === "author") return intent.group;
  return "explore";
};
const results = profiles.map((profile) => {
  const rows = INTENTS.map((intent) => {
    const group = startGroup(intent);
    const projected = projectToolList(tools, { profile, group: null, activeGroup: group, registry });
    const shown = projected.some((tool) => tool.name === intent.tool);
    return { ...intent, start_group: group, visible: shown, calls: shown ? 1 : 2 };
  });
  const visibleCount = rows.filter((row) => row.visible).length;
  return {
    profile,
    intents: rows.length,
    expected_tool_visible: visibleCount,
    visibility_rate: Number((visibleCount / rows.length).toFixed(3)),
    mean_calls: Number((rows.reduce((sum, row) => sum + row.calls, 0) / rows.length).toFixed(3)),
    rows,
  };
});
const defects: string[] = [];
for (const result of results) {
  if (result.profile !== "full" && result.profile !== "standard") continue;
  const hidden = result.rows.filter((row) => !row.visible);
  if (hidden.length > 0) {
    defects.push(`${hidden.length} intent(s) hidden in ${result.profile}: ${hidden.map((row) => row.intent).join("; ")}`);
  }
  if (result.mean_calls !== 1) defects.push(`${result.profile} costs ${result.mean_calls} mean calls (expected 1.0)`);
}
const payload = {
  schema_version: 2,
  proxy: "expected-tool visibility and group-switch call cost; live-model selection is advisory",
  intents: INTENTS.length,
  profiles: results,
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
      results.map((result) => `${result.profile} visibility ${result.visibility_rate} mean calls ${result.mean_calls}`).join("; "),
  );
}
process.exit(defects.length === 0 ? 0 : 1);
