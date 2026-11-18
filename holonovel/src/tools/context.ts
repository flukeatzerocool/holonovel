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
import type { Rng } from "../core/rng.js";
import type { RulesetManager } from "../rulesets.js";
import type { WorldKind, WorldModel, AnnotationDirective } from "../world/model.js";
import type { WorldGenRole, GeneratedSecret, GeneratedWitness, WorldGenTable, WorldGenRoll } from "../world/generation-types.js";
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
  // ── World-model and generation surface (stage 2 of the entry-point split) ──
  /** The loaded-ruleset manager (`:2208` in `index.ts`). */
  rulesets: RulesetManager;
  /** Reduce a schema to the named keys the caller exposes. */
  pickParams<T extends Record<string, unknown>>(schema: T, keys: readonly string[]): Partial<T>;
  /** Emit the world snapshot resource after a world mutation. */
  worldSnapshot(): void;
  /** The world-generation room cap (`TTRPG_WORLD_GEN_MAX_ROOMS`). */
  worldGenMaxRooms(): number;
  /** The generation role order (`room`, `objects`, `persons`, `hazards`, `secrets`). */
  WORLD_GEN_ROLES: WorldGenRole[];
  /** Map a sanitized generation name to its role. */
  sanitizeGenerationName(value: unknown): string;
  /** Strip markup the world model cannot store from generated prose. */
  sanitizeGenerationText(value: unknown): string;
  /** Resolve a generation table key and title to its role. */
  worldGenRoleOf(key: string, title: string): WorldGenRole | null;
  /** Resolve the world kind a generated object belongs to. */
  generationObjectKind(result: string, title: string): WorldKind;
  /** The generation validator: returns one failure string per broken invariant. */
  validateGeneratedWorld(world: WorldModel, secrets: GeneratedSecret[], witness: GeneratedWitness | null, personTablePresent: boolean): string[];
  /** Roll one generation table row. */
  rollGenerationTable(rng: Rng, table: WorldGenTable): WorldGenRoll | null;
  /** Materialize an adventure's annotations into the live Novel. */
  materializeAnnotations(novel: NovelState, directives: AnnotationDirective[], slug: string | null): { counts: { npcs: number; lore: number }; warnings: string[] };
  /** The `[NEED_INPUT]` envelope, with its parsed decision options. */
  needInput(text: string): { content: Array<{ type: "text"; text: string }>; structuredContent: unknown };
  /** The `(seed n)` suffix for a generated proposal. */
  seedWarningSuffix(seed: unknown): string;
  /** The knowledge-tool helpers, resolved lazily because they are created after this literal. */
  knowledgeTools(): any;
}

/** Re-exported for module signatures that name the badge. */
export type { Badge, NovelState, StateManager };
