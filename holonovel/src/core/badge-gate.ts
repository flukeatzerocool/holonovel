// badge-gate.ts — active-badge authorization rules for the dispatcher and the
// filtered metadata surfaces.
//
// REQ-032a/REQ-032c — the Player badge sees every non-GM-only tool; the
// Observer badge is read-only: only state-reading actions are permitted, and
// every mutating action returns [FORBIDDEN] with the handler-local corrective
// action. REQ-137b — `tools/list` filtering agrees with the gate table.
// REQ-305a — the Observer's state surface stays unfiltered (resources are not
// filtered for that badge).
//
// The classification source is the committed Tool Surface Contract
// (`tool-surface-registry.json`, REQ-567), whose `mutation_class` is validated
// by `check-tool-surface`. The registry is not authoritative for semantics
// (`manage_vow.resolve` and `manage_session.visibility_check` are `read` but
// mutate), so those keys are denied explicitly; the gate fails closed for any
// key the registry does not carry, and is inert (today's behaviour) when the
// registry artifact is absent. Handler-local guards remain the backstop.
//
// This is library code, not a script; it has no side effects and no server
// imports (the registry types come from the pure projection module).

import type { SurfaceRegistryLike } from "./surface-projection.js";

export type BadgeLike = "player" | "game_master" | "observer" | "none";

export interface ToolAnnotationsLike {
  readOnlyHint?: boolean;
}

// Generation and command actions the registry marks `read` but which mutate or
// resolve: dice rolls persist and audit, visibility_check writes an audit entry
// and saves the Novel, and the two writes above mutate state. Everything else
// mislabelled is caught by the handler-local guards (which refuse the Observer
// before mutating). The dispatcher's audit-capacity gate reads the same set
// (REQ-447), so one list serves both rules.
export const MUTATING_READ_ACTIONS: ReadonlySet<string> = new Set([
  "resolve_fate.roll",
  "resolve_mechanic.roll",
  "resolve_mechanic.fate_roll",
  "manage_session.visibility_check",
  "manage_vow.resolve",
  "manage_lore.corpus_access",
  "manage_corpus.corpus_access",
]);

/** Retained name for the Observer predicate's call sites; the set is shared
 *  with the audit-capacity gate. */
export const OBSERVER_DENY_ACTIONS = MUTATING_READ_ACTIONS;

// Always callable under any badge (REQ-066a: set_badge is NEVER badge-gated, so
// the Observer can leave spectator mode).
const ALWAYS_CALLABLE: ReadonlySet<string> = new Set(["set_badge"]);

// REQ-309h — the spatial parser classifies its own commands: perception
// commands (`look`, `inventory`, visibility) are read-only for the Observer and
// every mutating command (`go`, `take`) is refused inside the handler. The
// dispatcher therefore defers `run_command` to that handler rather than
// rejecting the whole action on its `execute` class.
const OBSERVER_DELEGATED_TOOLS: ReadonlySet<string> = new Set(["run_command"]);

// REQ-032a/REQ-031a — prompts may declare a GM gate. The shipped host prompts
// all declare `shared` (REQ-063/078/089), so this map is empty today; the rule
// exists so a future GM-gated prompt is filtered rather than leaked.
export const PROMPT_GATE: ReadonlyMap<string, "shared" | "GM-only"> = new Map<
  string,
  "shared" | "GM-only"
>();

// Player badge hides entries whose read is GM-only (REQ-032a). Content-level
// filtering stays in each resource handler; this map covers entries that are
// wholly GM-only. Editor, Game Master, and Observer keep the full list
// (REQ-031a full access; REQ-305a unfiltered state surface).
export const RESOURCE_GATE: ReadonlyMap<string, "shared" | "GM-only"> = new Map<
  string,
  "shared" | "GM-only"
>([
  ["spec://build", "GM-only"],
  ["guidance://game_master", "GM-only"],
  ["guidance://game_master/anti-slop", "GM-only"],
]);

/** The registry key for a call: `${name}.${action}` when an action is supplied,
 *  else the bare tool name (the registry keys action-less tools by name). */
export function actionKey(name: string, args: Record<string, unknown> | undefined): string {
  const action = typeof args?.action === "string" ? args.action : null;
  return action ? `${name}.${action}` : name;
}

function hasToolActions(registry: SurfaceRegistryLike, name: string): boolean {
  const prefix = `${name}.`;
  return Object.keys(registry.actions).some((key) => key === name || key.startsWith(prefix));
}

/** REQ-032c — an Observer may call a state-reading action only. */
export function observerActionAllowed(registry: SurfaceRegistryLike | null, key: string): boolean {
  if (!registry) return true; // documented degradation: gate inert
  const decl = registry.actions[key];
  if (!decl) return false; // unknown key under Observer fails closed
  return decl.mutation_class === "read" && !MUTATING_READ_ACTIONS.has(key);
}

/** REQ-032c — a tool is listed for the Observer iff it holds at least one
 *  permitted action, or (unregistered package tool) its registration is
 *  read-only. `set_badge` is always listed. */
export function toolObserverVisible(
  registry: SurfaceRegistryLike | null,
  name: string,
  annotations?: ToolAnnotationsLike,
): boolean {
  if (ALWAYS_CALLABLE.has(name)) return true;
  if (!registry) return true; // documented degradation: catalog unfiltered
  if (!hasToolActions(registry, name)) return annotations?.readOnlyHint === true;
  const prefix = `${name}.`;
  return Object.keys(registry.actions).some(
    (key) => (key === name || key.startsWith(prefix)) && observerActionAllowed(registry, key),
  );
}

/** REQ-032c — the dispatcher refusal for a badge, or null to proceed. The
 *  Player branch needs the tool-level gate (REQ-137a) from the caller so this
 *  module keeps no second copy of the GM-only list. */
export function badgeRefusalFor(
  badge: BadgeLike,
  name: string,
  args: Record<string, unknown> | undefined,
  registry: SurfaceRegistryLike | null,
  annotations: ToolAnnotationsLike | undefined,
  gmOnly: boolean,
): string | null {
  if (badge === "game_master" || badge === "none") return null;
  if (ALWAYS_CALLABLE.has(name)) return null;
  if (OBSERVER_DELEGATED_TOOLS.has(name)) return null;
  if (badge === "player") {
    if (!gmOnly) return null;
    // REQ-495 — a tool the table classifies GM-only may still expose a
    // state-reading action the Player may call (e.g. manage_causality
    // (action: state)); the handler guard decides those. A mutating action on
    // a GM-only tool is refused here.
    const key = actionKey(name, args);
    if (registry?.actions[key]?.mutation_class === "read" && !MUTATING_READ_ACTIONS.has(key)) return null;
    return "[FORBIDDEN] This tool is Game Master only. Corrective action: use set_badge to switch.";
  }
  // Observer: registry keys are classified per action; an unregistered tool
  // falls back to its registration annotation (read-only kinds only).
  if (!registry) return null;
  if (!hasToolActions(registry, name)) {
    return annotations?.readOnlyHint === true
      ? null
      : "[FORBIDDEN] Observer mode is read-only. Corrective action: switch badges with set_badge to interact.";
  }
  return observerActionAllowed(registry, actionKey(name, args))
    ? null
    : "[FORBIDDEN] Observer mode is read-only. Corrective action: switch badges with set_badge to interact.";
}

/** REQ-031a/REQ-032a — prompt visibility by active badge, over a supplied gate
 *  declaration map so the rule is unit-testable with a synthetic entry. */
export function promptAllowed(
  gates: ReadonlyMap<string, "shared" | "GM-only">,
  badge: BadgeLike,
  name: string,
): boolean {
  if (badge === "game_master" || badge === "none" || badge === "observer") return true;
  return gates.get(name) !== "GM-only";
}

/** REQ-031a/REQ-032a — the `prompts/get` refusal for a GM-gated prompt. */
export function promptRefusalFor(
  gates: ReadonlyMap<string, "shared" | "GM-only">,
  badge: BadgeLike,
  name: string,
): string | null {
  if (promptAllowed(gates, badge, name)) return null;
  return `[ERROR] [FORBIDDEN] Prompt '${name}' is Game Master only. Corrective action: switch badges with set_badge.`;
}

/** REQ-031a/REQ-032a — resource-list visibility. Only the Player loses GM-only
 *  entries; the Observer keeps the state surface (REQ-305a). */
export function resourceAllowed(
  gates: ReadonlyMap<string, "shared" | "GM-only">,
  badge: BadgeLike,
  uri: string,
): boolean {
  if (badge !== "player") return true;
  for (const [prefix, gate] of gates) {
    if (gate !== "GM-only") continue;
    if (uri === prefix || uri.startsWith(`${prefix}/`)) return false;
  }
  return true;
}
