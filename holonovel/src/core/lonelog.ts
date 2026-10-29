/**
 * Lonelog notation formatter — REQ-072g.
 *
 * Deterministic, side-effect-free helpers shared by `manage_context (action:
 * recap)`, `manage_diagnostics (action: compress)`, and the audit append path.
 * No wall-clock, network, or ambient state: the same inputs always render the
 * same bytes.
 */

export interface RecapScene {
  description: string;
  location?: string;
  timestamp?: string;
}

export interface RecapStoryEntry {
  type: string;
  entry: string;
  discovered?: boolean;
}

export interface RecapRoll {
  tool: string;
  entity?: string;
  dice?: string;
  outcome?: string;
}

export interface RecapLonelogInput {
  orientation?: string;
  scenes: RecapScene[];
  transitions: Array<{ description: string; location?: string }>;
  story: RecapStoryEntry[];
  rolls: RecapRoll[];
  directive?: string;
}

function compactValue(value: string, max = 120): string {
  const oneLine = value.replace(/\s+/g, " ").trim();
  return oneLine.length > max ? `${oneLine.slice(0, max - 1)}…` : oneLine;
}

/** Render a tool invocation as a resolved-mechanics Lonelog line. */
export function auditNotation(tool: string, args: unknown): string {
  let detail = "";
  if (typeof args === "string") {
    detail = args;
  } else if (args !== null && args !== undefined) {
    try {
      detail = JSON.stringify(args);
    } catch {
      detail = String(args);
    }
  }
  const compact = detail ? ` ${compactValue(detail)}` : "";
  return `d: ${tool}${compact}`;
}

/** Render the current scene and transition history as `###` headers. */
function sceneHeaders(input: RecapLonelogInput): string[] {
  const lines: string[] = [];
  if (input.scenes.length === 0 && input.transitions.length === 0) return lines;
  const seen = new Set<string>();
  const pushScene = (scene: RecapScene) => {
    const label = compactValue(scene.location ?? scene.description);
    if (!label || seen.has(label)) return;
    seen.add(label);
    lines.push(`### ${label}`);
    if (scene.location && scene.description && scene.location !== scene.description) {
      lines.push(compactValue(scene.description));
    }
  };
  for (const scene of input.scenes) pushScene(scene);
  for (const transition of input.transitions) {
    pushScene({ description: transition.description, location: transition.location });
  }
  return lines;
}

/** Render a structured recap as Lonelog notation (REQ-072g). */
export function renderRecapLonelog(input: RecapLonelogInput): string {
  const lines: string[] = [];
  if (input.orientation) lines.push(`narrative_orientation: ${input.orientation}`);
  const headers = sceneHeaders(input);
  if (headers.length > 0) lines.push("", ...headers);
  for (const entry of input.story) {
    if (entry.type === "decision") lines.push(`? ${compactValue(entry.entry)}`);
    else if (entry.type === "consequence" || entry.discovered) lines.push(`=> ${compactValue(entry.entry)}`);
    else lines.push(`@ ${compactValue(entry.entry)}`);
  }
  for (const roll of input.rolls) {
    const parts = [`d: ${roll.tool}`];
    if (roll.entity) parts.push(roll.entity);
    if (roll.dice) parts.push(roll.dice);
    if (roll.outcome) parts.push(roll.outcome);
    lines.push(parts.join(" "));
  }
  if (input.directive) lines.push(`? ${compactValue(input.directive)}`);
  return lines.join("\n");
}

/** Render audit entries as Lonelog mechanics lines for `compress`. */
export function renderCompressLonelog(
  entries: Array<{ timestamp?: string; badge?: string; tool: string; args?: unknown; output_prefix?: string }>,
): string {
  return entries
    .map((entry) => {
      const stamp = (entry.timestamp ?? "").replace("T", " ").substring(0, 19).trim();
      const prefix = entry.output_prefix && entry.output_prefix !== "[BOUNDARY_VIOLATION]" ? ` ${entry.output_prefix}` : "";
      const base = entry.tool === "[session-boundary]" ? `? session boundary` : auditNotation(entry.tool, entry.args);
      return [stamp, base + prefix].filter(Boolean).join(" ");
    })
    .join("\n");
}
