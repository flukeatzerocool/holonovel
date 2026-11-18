// Tool context — the host-side surface a tool module needs.
//
// `index.ts` owns the response envelope (OK / raw / error, with macro
// expansion), the audit writer, the behavioral config readers, and the
// StateManager singleton. A tool module receives exactly those by value, so it
// can be moved out of the entry point without importing it — and so the seam is
// explicit rather than a module cycle.
//
// `RegisterTool` is deliberately structural: the argument is the *patched*
// `server.registerTool` in `index.ts`, which enforces TOOL_ANNOTATIONS and
// applies the truncation, capacity-abort, refusal-normalization, structured-
// result, and forbidden-audit wrappers. Passing the unpatched SDK method would
// silently drop all of them.

import type { Badge, NovelState, StateManager } from "../core/state.js";
import type { DivergenceResult } from "../core/divergence.js";
import type { ReinforcementEntry, SubjectiveMemoryRecord, ValidityWindow } from "../core/subjective.js";

/** MCP registration entry point, as `index.ts` exposes it. */
export type RegisterTool = (name: string, config: any, handler: any) => void;

/** The host services a tool module destructures. */
export interface ToolContext {
  /** The single StateManager instance (`initServer` has already received it). */
  state: StateManager;
  /** Behavioral `TTRPG_*` integer reader with its default. */
  configInt(name: string, dflt: number): number;
  /** REQ-409 — normalize a per-call detail request (absent → summary). */
  wantsDetail(detail?: boolean): boolean;
  /** REQ-623–REQ-656 — the scoring inputs for one Novel's subjective memory. */
  memoryScoreInputs(novel: NovelState): {
    latestOrdinal: number;
    logLength: number;
    reinforcements: ReinforcementEntry[];
    decayHalfLife: number;
    reinforcementBonus: number;
    reinforcementMax: number;
  };
  /** REQ-656 — override a verdict with `displaced` when a closed window's successor disagrees. */
  windowAwareVerdict(
    novel: NovelState,
    record: SubjectiveMemoryRecord,
    result: DivergenceResult,
    windows: Map<string, ValidityWindow>,
  ): DivergenceResult;
  /** Append an audit entry for the active Novel and emit `audit_delta`. */
  audit(tool: string, args: any, prefix?: string): void;
  /** REQ-001 — the `[OK]` envelope with macro expansion. */
  ok(text: string): any;
  /** REQ-002 — the `[ERROR] [CODE]` envelope with a corrective action. */
  err(code: string, msg: string, correctiveAction?: string): any;
  /** REQ-001 — an unprefixed body result. */
  raw(text: string): any;
  /** REQ-413/REQ-429 — strip an absorbed action's scope prefix from args. */
  mergeScopedArgs(args: Record<string, any>, prefix: string): Record<string, any>;
}

/** Re-exported for module signatures that name the badge. */
export type { Badge, NovelState, StateManager };
