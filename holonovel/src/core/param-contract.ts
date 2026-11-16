// param-contract.ts — required parameters for action-discriminated tools.
//
// REQ-001 (response contract), REQ-002 (error taxonomy), Appendix O.2
// `[MISSING_PARAM]`, Appendix F T177, REQ-054 (input safety).
//
// The MCP input schemas declare only `action` as required, because one tool
// carries many actions. Each action's own required parameters are therefore
// validated here, before any handler runs, so an absent parameter can never
// reach a handler that would store `undefined` or throw a raw TypeError.
//
// Scope. This table names the surfaces whose absent-parameter behaviour was
// demonstrated to create an undefined-keyed record or to throw. A surface
// absent from this table is no-argument for the adversarial battery, which
// still asserts that the sweep creates no undefined-keyed record.
//
// The table is keyed `${toolName}:${action ?? ""}` so that action-discriminated
// tools and action-less tools share one lookup.

export interface ParamRequirement {
  /** Parameter names that must carry a non-empty value. */
  readonly params: readonly string[];
  /** Alternative parameters: any one supplied satisfies the requirement. */
  readonly unless?: readonly string[];
  /** Optional per-parameter format hint used in the refusal text. */
  readonly formats?: Readonly<Record<string, string>>;
}

export interface ParamRefusal {
  readonly category: "MISSING_PARAM";
  readonly parameter: string;
  readonly message: string;
  readonly correctiveAction: string;
}

const KEY = "a non-empty key";
const NAME = "a non-empty name";
const SLUG = "an existing Novel slug";

export const REQUIRED_PARAMS: Readonly<Record<string, ParamRequirement>> = {
  "run_command:execute": { params: ["command"], formats: { command: "a parser command, e.g. look" } },

  "manage_context:briefing_order": { params: ["sections"], formats: { sections: "an array of briefing section tokens" } },
  "manage_context:verbosity": { params: ["mode"], formats: { mode: "terse or normal" } },

  "manage_adventure:generate_encounter": { params: ["context"], formats: { context: "the scene context for the encounter" } },

  "manage_archive:checkpoint_set": { params: ["label"], formats: { label: "a checkpoint label" } },
  "manage_archive:checkpoint_restore": { params: ["label"], formats: { label: "an existing checkpoint label" } },
  "manage_archive:checkpoint_remove": { params: ["label"], formats: { label: "an existing checkpoint label" } },

  "manage_character:signal": { params: ["signal"], formats: { signal: "the signal key to set or clear" } },

  "manage_countdown:set": { params: ["name"], unless: ["link_countdown"], formats: { name: NAME } },
  "manage_countdown:remove": { params: ["name"], formats: { name: "an existing countdown name" } },

  "manage_faction:create": { params: ["name"], formats: { name: NAME } },

  "manage_lore:set": { params: ["key"], formats: { key: KEY } },
  "manage_lore:update": { params: ["key"], formats: { key: "an existing lore key" } },
  "manage_lore:remove": { params: ["key"], formats: { key: "an existing lore key" } },
  "manage_lore:set_secret": { params: ["key"], formats: { key: KEY } },

  "manage_note:set": { params: ["key"], formats: { key: KEY } },
  "manage_note:remove": { params: ["key"], formats: { key: "an existing note key" } },
  "manage_note:set_server": { params: ["key"], formats: { key: KEY } },
  "manage_note:remove_server": { params: ["key"], formats: { key: "an existing server-note key" } },

  "manage_novel:create": { params: ["name"], formats: { name: NAME } },
  "manage_novel:rename": { params: ["new_slug"], formats: { new_slug: "the new Novel slug" } },
  "manage_novel:resume": { params: ["slug"], formats: { slug: SLUG } },
  "manage_novel:switch": { params: ["slug"], formats: { slug: SLUG } },

  "manage_npc:create": { params: ["name"], formats: { name: NAME } },

  "manage_ruleset:search": { params: ["query"], formats: { query: "a non-empty search query" } },

  "manage_story:record": { params: ["entry"], formats: { entry: "the story beat text" } },
};

/** The table key for a tool call: `${tool}:${action ?? ""}`. */
export function paramKey(toolName: string, action: unknown): string {
  return `${toolName}:${typeof action === "string" ? action : ""}`;
}

export function requirementFor(toolName: string, action: unknown): ParamRequirement | undefined {
  return REQUIRED_PARAMS[paramKey(toolName, action)];
}

/** True when a value is absent, null, or an empty/whitespace-only string. */
export function isAbsent(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  return typeof value === "string" && value.trim() === "";
}

/**
 * Refuse a call whose action requires a parameter the caller omitted.
 * Returns null when the call is acceptable (including every unclassified
 * surface, which this contract does not constrain).
 */
export function validateParams(toolName: string, args: Record<string, unknown> | undefined): ParamRefusal | null {
  const req = requirementFor(toolName, args?.action);
  if (!req) return null;
  // An alternate parameter (e.g. `link_countdown` on countdown set) satisfies
  // the requirement without the primary parameter.
  if (req.unless?.some((alternative) => !isAbsent(args?.[alternative]))) return null;
  for (const parameter of req.params) {
    if (isAbsent(args?.[parameter])) {
      const format = req.formats?.[parameter] ?? "a non-empty value";
      return {
        category: "MISSING_PARAM",
        parameter,
        message: `${toolName} (action: ${String(args?.action)}) requires '${parameter}' (${format}).`,
        correctiveAction: `Supply '${parameter}' (${format}) and retry.`,
      };
    }
  }
  return null;
}
