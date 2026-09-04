// State Manager — Novels, Roster, NPCs, World Model, Snapshots, Audit, Badge Gating, Persistence
// REQ-040, REQ-041, REQ-043, REQ-055, REQ-065, REQ-073, REQ-074, REQ-075,
// REQ-076, REQ-077, REQ-079, REQ-081, REQ-082, REQ-083, REQ-084,
// REQ-088, REQ-089, REQ-090, REQ-091, REQ-092, REQ-093, REQ-095, REQ-096,
// REQ-097, REQ-116, REQ-195, REQ-198, REQ-199, REQ-218, REQ-219,
// REQ-232, REQ-233, REQ-234, REQ-236, REQ-238, REQ-239, REQ-240,
// REQ-241, REQ-242, REQ-246, REQ-256, REQ-257, REQ-258, REQ-285, REQ-289,
// REQ-335, REQ-336, REQ-337, REQ-338, REQ-339, REQ-340, REQ-341, REQ-342,
// REQ-343, REQ-344, REQ-345, REQ-347, REQ-348, REQ-349, REQ-350, REQ-351,
// REQ-352, REQ-353, REQ-355, REQ-356, REQ-357, REQ-358, REQ-359, REQ-360,
// REQ-361, REQ-362, REQ-363, REQ-364, REQ-365, REQ-366

import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import { createRng } from "./rng.js";
import { DATA_FORMAT } from "../generated/contract-fingerprints.js";
import { WorldModel, WorldRoom, WorldThing, Direction, createEmptyWorldModel, oppositeDirection } from "../world/model.js";

const SPEC_VERSION: string = JSON.parse(
  fs.readFileSync(new URL("../../package.json", import.meta.url), "utf-8")
).version;

// REQ-423 — reserved envelope key carrying the data-format fingerprint and spec
// version on flat-map artifacts (roster, codex, server notes). Double-underscore
// prefix avoids collision with operator-authored keys.
const META_KEY = "__holonovel_meta";

function computeSourceHash(): string {
  try {
    const srcDir = new URL("../../src", import.meta.url).pathname;
    const h = crypto.createHash("sha256");
    const entries = fs.readdirSync(srcDir, { recursive: true }).sort();
    for (const entry of entries) {
      const p = path.join(srcDir, entry as string);
      try {
        if (fs.statSync(p).isFile()) {
          h.update(entry as string);
          h.update(fs.readFileSync(p));
        }
      } catch { /* skip */ }
    }
    return h.digest("hex");
  } catch {
    return "unavailable";
  }
}

// ── Types ──────────────────────────────────────────────────────────

export type Badge = "player" | "game_master" | "observer" | "none";

export function normalizeBadge(raw: unknown): Badge {
  if (raw === "player" || raw === "game_master" || raw === "observer") return raw;
  return "none"; // null, undefined, "none", and unknown values resolve to the Editor badge
}

export function migrateNovelData(data: any): any {
  const out: any = { ...data };
  out.badge = normalizeBadge(data.badge ?? data.hat);
  if (data.lore) {
    out.lore = Object.fromEntries(
      Object.entries(data.lore).map(([k, v]: [string, any]) => [
        k, { ...v, badge_scope: v.badge_scope ?? v.hat_scope ?? "game_master" },
      ]),
    );
  }
  if (data.secrets) {
    out.secrets = data.secrets.map((s: any) => ({ ...s, badge_scope: s.badge_scope ?? s.hat_scope ?? "game_master" }));
  }
  if (data.notes) {
    out.notes = data.notes.map((n: any) => ({ ...n, badge_scope: n.badge_scope ?? n.hat_scope ?? "game_master" }));
  }
  return out;
}

export interface NovelEntity {
  id: string;
  name: string;
  personality?: { description?: string; voice?: string; background?: string; goals?: string };
  voice_examples?: { context: string; dialogue: string; tag?: string }[];
  inventory: string[]; // thing lowercased names held
  current_room: string | null;
  conditions: string[];
  condition_rounds: Record<string, number>;
  // Ruleset-derived mechanical statistics (REQ-104/181). Populated by the
  // ruleset-driven character creation workflow. Ruleset-free: opaque storage.
  stats?: Record<string, any>;
  // REQ-330 — exploration-derived knowledge (rooms visited, things taken),
  // retained per REQ-308 regardless of current presence.
  knowledge?: { explored?: Array<{ type: "room" | "thing"; name: string; at: string }> };
  // REQ-332 — codex provenance: records which Codex entry produced this entity
  // and when (id, imported_at, codex_modified_at).
  codex_source?: { id: string; kind: string; imported_at: string; codex_modified_at: string };
}

export interface NpcState {
  id: string;
  name: string;
  description?: string;
  disposition?: string;
location?: string;
  // REQ-327 — NPC-world coupling: room id when location matches a room.
  room_id?: string;
  personality?: { description?: string; voice?: string; background?: string; goals?: string };
  voice_examples?: { context: string; dialogue: string; tag?: string }[];
  // REQ-075f — NPC mind: GM-only journal/directive/auto_play, excluded from
  // every Player-badge surface.
  mind?: { private_journal?: string[]; directive?: string; auto_play?: boolean };
  conditions: string[];
  condition_rounds: Record<string, number>;
  // REQ-311 — per-NPC memory model: witnessed events, per-entity contact
  // history, emotional-state signals, and goal pursuit, persisted with Novel.
  memory?: {
    witnessed_events: Array<{ event: string; at: string }>;
    contacts: Record<string, { encounters: number; first_contact: string; last_contact: string; last_disposition: string; prior_dispositions: string[] }>;
    stress_markers: string[];
    goals?: string[];
    last_3_interactions: Array<{ entity: string; summary: string; at: string }>;
  };
}

export interface LoreEntry {
  key: string;
  content: string;
  triggers: string[];
  badge_scope: "game_master" | "shared";
  priority: number;
  sticky: number;
  sticky_remaining: number;
  enabled: boolean;
  group?: string;
  // REQ-333 — provenance for promoted story journal entries.
  source?: string;
  // REQ-328 — lore-world coupling: world-model target that triggers the entry
  // on interaction instead of (or alongside) keyword match.
  world_target?: string;
}

export interface Countdown {
  name: string;
  ticks: number;
  total: number;
  type: "round" | "narrative";
  scope?: string;
  direction?: string;
  clock_type?: "danger" | "racing" | "linked" | "tug_of_war" | "faction" | "mission";
  on_scene_transition?: boolean;
  // REQ-329 — countdown-world coupling: mechanical triggers that advance the
  // countdown when the matching world-model event occurs (on_room_enter(<id>),
  // on_thing_take(<id>), on_door_open(<ref>)). Any trigger match advances one
  // tick; triggers supplement (never replace) normal advancement.
  triggers?: string[];
  // REQ-368 — countdown-world effect coupling: applied when the countdown fires.
  world_effect?: { type: "describe" | "property" | "exit"; target: string; direction?: string; destination?: string; property?: string; value?: string };
}

export interface CombatState {
  participants: string[];
  dangers: { name: string; ac?: number; hp?: number; max_hp?: number; initiative_bonus?: number }[];
  round: number;
  turn_order: string[];
  current_turn: number;
  active: boolean;
}

export interface AuditEntry {
  timestamp: string;
  badge: Badge;
  tool: string;
  args: string;
  output_prefix: string;
  hash: string;
}

export interface StoryEntry {
  index: number;
  type: "decision" | "moment" | "revelation" | "bond" | "consequence";
  entry: string;
  scene_anchor: string;
  entity_ids: string[];
  timestamp: string;
  discovered?: boolean; // REQ-340 — consequence fired while absent
  room_id?: string; // REQ-331 — story journal-world coupling
}

export interface FactionState {
  id: string;
  name: string;
  description: string;
  goals: string[];
  resources: string;
  clock: number;
  clock_max: number;
  status: string;
  territory?: string[]; // REQ-364 — faction world coupling
}

// REQ-335/337 — scene beat taxonomy and story-beat arc sequence.
export interface StoryBeat {
  beat: string;
  scene_preview: string;
  source?: "adventure-scaffold" | "gm";
  // REQ-332 — codex provenance on adventure-scaffold beats.
  codex_source?: { id: string; kind: string; imported_at: string; codex_modified_at: string };
}

// REQ-339 — NPC goal pursuit suggestion lifecycle.
export interface GoalSuggestion {
  npc_id: string;
  text: string;
  state: "pending" | "deferred" | "dismissed" | "accepted";
}

export interface SecretState {
  key: string;
  content: string;
  triggers: string[];
  badge_scope: "game_master" | "shared";
  known_by: string[];
  world_target?: string; // REQ-363 — world-model room ID
}

export interface Relationship {
  entity_a: string;
  entity_b: string;
  type: "ally" | "rival" | "neutral" | "mentor" | "dependent" | "suspicious";
  value?: number;
  description?: string;
}

export interface GMContext {
  current_scene?: string;
  immediate_situation?: string;
  pending_player_action?: string;
  short_term_plans?: string;
  long_term_plans?: string;
  active_threads?: { name: string; status: string; urgency: string; description: string }[];
  npc_attitudes?: Record<string, string>;
  player_goals?: string;
  saved_at?: string;
  story_context?: string[];
  active_vows?: { name: string; difficulty: string; milestone_count: number }[];
  faction_clocks?: { name: string; clock: number; clock_max: number; status: string }[];
  countdown_positions?: { name: string; ticks: number; total: number }[];
  npc_dispositions?: { name: string; disposition?: string; location?: string }[];
  relationships?: Relationship[];
}

export interface CodexEntry {
  id: string;
  kind: string;
  visibility: "library" | "shared" | "private";
  name: string;
  content: Record<string, any>;
  description?: string;
  tags?: string[];
  imported_at: string;
  codex_modified_at: string;
}

export interface VowState {
  name: string;
  description: string;
  parties: string[];
  difficulty: "troublesome" | "dangerous" | "formidable" | "extreme" | "epic";
  scope: "gm" | "shared" | "faction" | "party";
  milestones: number;
  rank_track: number;
  state: "active" | "resolved" | "forsaken";
  outcome?: string;
  consequences?: string;
  reason?: string;
}

export interface NoteEntry {
  key: string;
  content: string;
  badge_scope: "game_master" | "player" | "shared";
}

export interface Checkpoint {
  label: string;
  timestamp: string;
  state: any;
}

export interface ConditionState {
  conditions: string[];
  condition_rounds: Record<string, number>;
}

// Pre-workflow snapshot (REQ-042b): captured when a tool raises [NEED_INPUT],
// persisted with the pending decision, and restored on respond(cancel) or
// staleness auto-cancel. `state` is a novelToSnapshotJSON clone (undo/redo
// stacks omitted); `timestamp` records when the workflow began.
export interface WorkflowSnapshot {
  timestamp: string;
  state: any;
}

export interface AutonomyState {
  level: "full" | "mechanical_prompt" | "manual";
  confirmation: "auto" | "confirm" | "prompt";
  safety: "safe" | "moderate" | "hardcore";
  creativity: "predictable" | "standard" | "chaotic";
  confirmed_safety_tiers: string[];
}

export const DEFAULT_AUTONOMY: AutonomyState = {
  level: "mechanical_prompt",
  confirmation: "prompt",
  safety: "safe",
  creativity: "standard",
  confirmed_safety_tiers: ["safe"],
};

export function normalizeAutonomy(raw: unknown): AutonomyState {
  const r = (raw ?? {}) as Record<string, unknown>;
  const level = ["full", "mechanical_prompt", "manual"].includes(r.level as string) ? r.level as AutonomyState["level"] : DEFAULT_AUTONOMY.level;
  const confirmation = ["auto", "confirm", "prompt"].includes(r.confirmation as string) ? r.confirmation as AutonomyState["confirmation"] : DEFAULT_AUTONOMY.confirmation;
  const safety = ["safe", "moderate", "hardcore"].includes(r.safety as string) ? r.safety as AutonomyState["safety"] : DEFAULT_AUTONOMY.safety;
  const creativity = ["predictable", "standard", "chaotic"].includes(r.creativity as string) ? r.creativity as AutonomyState["creativity"] : DEFAULT_AUTONOMY.creativity;
  const confirmed = Array.isArray(r.confirmed_safety_tiers) ? r.confirmed_safety_tiers as string[] : [safety];
  return { level, confirmation, safety, creativity, confirmed_safety_tiers: confirmed };
}

// REQ-306 / §7.6 — TTRPG_AUTONOMY launch preset seeds new-Novel defaults as a
// comma-separated `level,confirmation,safety,creativity` list.
export function autonomyDefaultsFromEnv(): AutonomyState {
  const raw = process.env.TTRPG_AUTONOMY;
  if (!raw) return { ...DEFAULT_AUTONOMY, confirmed_safety_tiers: ["safe"] };
  const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);
  const seeded: Partial<AutonomyState> = {};
  if (parts[0]) seeded.level = parts[0] as AutonomyState["level"];
  if (parts[1]) seeded.confirmation = parts[1] as AutonomyState["confirmation"];
  if (parts[2]) seeded.safety = parts[2] as AutonomyState["safety"];
  if (parts[3]) seeded.creativity = parts[3] as AutonomyState["creativity"];
  return normalizeAutonomy({ ...DEFAULT_AUTONOMY, ...seeded });
}

export const DIFFICULTY_TRACKS: Record<string, number> = {
  troublesome: 12, dangerous: 8, formidable: 4, extreme: 2, epic: 1,
};

export interface NovelState {
  slug: string;
  name: string;
  ruleset: string | null;
  badge: Badge;
  entities: Map<string, NovelEntity>;
  active_entity_id: string | null;
  npcs: Map<string, NpcState>;
  scene_description: string;
  scene_location?: string;
  scene_time_of_day?: string;
  scene_atmosphere?: string;
  scene_history: { timestamp: string; description: string; location?: string; time_of_day?: string; atmosphere?: string; beat?: string }[];
  scene_beat: string; // REQ-335 — current beat ("" = unset, renders as mid_scene)
  scene_type: ("combat" | "social" | "exploration" | "neutral")[];
  narrative_directive: string;
  combat: CombatState | null;
  countdowns: Map<string, Countdown>;
  lore: Map<string, LoreEntry>;
  briefing_assembly_count: number;
  player_signals: Record<string, string>;
  adventure_slug: string | null;
  generated_adventure: any | null;
  audit_log: AuditEntry[];
  undo_stacks: Record<string, NovelState[]>;
  redo_stacks: Record<string, NovelState[]>;
  briefing_order: string[];
  action_patterns_enabled: boolean;
  session_zero_completed: boolean;
  characters_present: boolean;
  characters_present_ids: string[];
  adventure_set: boolean;
  pending_workflow:
    | { decision: string; snapshot: WorkflowSnapshot | null; payload?: any }
    | { decision: string; snapshot: WorkflowSnapshot | null; creation?: import("./character-creation.js").CreationWorkflowState; payload?: any }
    | null;
  connection_counter: number; // REQ-030 — single-user connection; incremented per session
  pending_staleness_counter: number;
  pov_mode: "character" | "omniscient";
  autonomy: AutonomyState;
  help_category_overrides: Record<string, string>;
  story_journal: StoryEntry[];
  factions: FactionState[];
  secrets: SecretState[];
  relationships: Relationship[];
  gm_context: GMContext;
  constraint_overrides: { type: string; name?: string; source?: string; prerequisites?: string[]; slots_remaining?: number; match_all?: boolean }[];
  synthesis_activated: Record<string, number>;
  synthesis_module_enabled: Record<string, boolean>;
  // REQ-261 — player-authored synthesis items, per module, tagged [player].
  player_synthesis: Record<string, Array<{ key: string; content: string; triggers?: string[]; badge_scope: string; created_at: string }>>;
  // REQ-310 — campaign memory: engine-recorded per-NPC/thread/location facts
  // derived from state-changing tool calls, surviving restart and rebuild.
  campaign_memory: Array<{ category: "npcs" | "threads" | "locations"; text: string; at: string; badge_scope: "gm" | "shared" | "discovered"; scene: string }>;
  notes: NoteEntry[];
  vows: VowState[];
  checkpoints: Checkpoint[];
  description: string;
  genre: string;
  adventure_index: { npcs: Array<{ name: string; description?: string }>; locations: Array<{ name: string; description: string }>; factions: Array<{ name: string; goals?: string }>; premise: string; hooks: string[]; scene_count?: number } | null;
  adventure_scene_waypoint: { anchor: string; description: string } | null;
  // World-model tier
  world: WorldModel;
  // §5.12 Narrative Architecture (REQ-335 through REQ-366)
  story_beats: StoryBeat[]; // REQ-337 — completed beat sequence
  pacing_counter: number; // REQ-336 — tool calls since last transition
  pacing_autonomy_fired: boolean; // REQ-351 — at-most-once per pacing window
  scene_transition_count: number; // REQ-338 — for faction autonomous interval
  faction_autonomous_ticks: Record<string, number>; // REQ-338 — per-faction autonomous tick count
  npc_goal_suggestions: GoalSuggestion[]; // REQ-339 — World in Motion suggestions
  voice_corrections_this_session: number; // REQ-344 — correction limit counter
  // §5.19 State Persistence Guardrails (REQ-400 through REQ-407)
  auto_record: boolean; // REQ-405 — auto-moment on transitions
  session_no_mutation_windows: string[]; // REQ-402 — sessions closed with zero mutations
  state_regression: { audit_gap: number; timestamp_gap_ms: number; recorded_at: string; backup_index?: number } | null; // REQ-406/REQ-238
  last_mutation_at: string | null; // REQ-401/403 — timestamp of last state write
  mutation_counts_by_group: Record<string, number>; // REQ-401 — per-group counts this session
  uncommitted_rolls: Array<{ roll: string; suggested_tool: string; at: string }>; // REQ-404
  metadata: {
    created: string;
    modified: string;
    session_count: number;
    total_combat_rounds: number;
    last_scene_anchor: string;
    // REQ-237 — session segmentation: per-session metadata derived from
    // `[session-boundary]` audit markers (entry_count, combat rounds,
    // significant rolls, scene transitions, timespan).
    sessions: Array<{
      session_id: string;
      entry_count: number;
      timespan_start: string;
      timespan_end: string | null;
      combat_rounds: number;
      significant_roll_count: number;
      scene_transitions: number;
    }>;
  };
  // REQ-237 — the session id currently being written; marker emitted on change.
  active_session_id: string | null;
  // REQ-322 — pending vow-countdown creation suggestion surfaced in
  // narrative_threads; accepted via `respond accept` (auto-creates the linked
  // mission countdown) or declined via `respond decline`.
  pending_vow_countdown_suggestion: { vow_name: string; countdown_name: string; tick_count: number; scope: string } | null;
  // REQ-332 — codex provenance register for the Novel: every Codex-sourced
  // artifact, with import timestamp and the Codex entry's modified_at.
  codex_sources: Array<{ id: string; kind: string; imported_at: string; codex_modified_at: string }>;
}

export interface RosterEntity extends NovelEntity {
  // Roster baselines are immutable except narrative fields
}

const VALID_SCENE_TYPES = ["combat", "social", "exploration", "neutral"] as const;
type SceneType = (typeof VALID_SCENE_TYPES)[number];

function normalizeSceneType(raw: unknown): SceneType[] {
  if (!raw) return ["neutral"];
  if (Array.isArray(raw)) {
    return (raw as string[]).filter((t): t is SceneType => (VALID_SCENE_TYPES as readonly string[]).includes(t));
  }
  if (typeof raw === "string" && (VALID_SCENE_TYPES as readonly string[]).includes(raw)) {
    return [raw as SceneType];
  }
  return ["neutral"];
}

function worldToJSON(world: WorldModel): any {
  return {
    rooms: Object.fromEntries(world.rooms),
    things: Object.fromEntries(world.things),
  };
}

function worldFromJSON(data: any): WorldModel {
  const world = createEmptyWorldModel();
  if (data?.rooms) {
    for (const [key, room] of Object.entries(data.rooms)) {
      const r = room as any;
      world.rooms.set(key, {
        name: r.name,
        description: r.description || "",
        exits: new Map(Object.entries(r.exits || {})),
        doorRefs: new Map(Object.entries(r.doorRefs || {})),
        annotations: r.annotations || {},
      });
    }
  }
  if (data?.things) {
    for (const [key, thing] of Object.entries(data.things)) {
      const t = thing as any;
      world.things.set(key, {
        name: t.name,
        description: t.description || "",
        kind: t.kind || "thing",
        location: t.location ?? null,
        locationType: t.locationType ?? null,
        portable: t.portable ?? true,
        openable: t.openable ?? false,
        open: t.open ?? false,
        lockable: t.lockable ?? false,
        locked: t.locked ?? false,
        lit: t.lit ?? false,
        capacity: t.capacity,
        doorConnects: t.doorConnects,
        switchable: t.switchable ?? false,
        switched_on: t.switched_on ?? false,
        enterable: t.enterable ?? false,
        vehicleInterior: t.vehicleInterior,
        vehiclePassengers: t.vehiclePassengers ?? [],
        wearable: t.wearable ?? false,
        worn_by: t.worn_by ?? null,
        readable: t.readable ?? false,
        read_text: t.read_text ?? null,
        edible: t.edible ?? false,
        drinkable: t.drinkable ?? false,
        climbable: t.climbable ?? false,
        transparent: t.transparent ?? false,
        annotations: t.annotations || {},
      });
    }
  }
  return world;
}

// ── State Manager ──────────────────────────────────────────────────

export class StateManager {
  novels = new Map<string, NovelState>();
  roster = new Map<string, RosterEntity>();
  activeNovelId: string | null = null;

  buildFingerprint: {
    specVersion: string;
    specRepoUrl: string;
    specHash: string;
    sourceHash: string;
    rulesetHash: string;
    buildTimestamp: string;
    lastSpecReview?: string;
    lastGauntlet?: string;
  };

  enriched = false;
  enrichmentManifest: any = null;
  maxLoreTokens: number | null = null;
  serverNotes: Map<string, { content: string; narrative_tag?: string }> = new Map();
  codex: Map<string, CodexEntry> = new Map();

  // REQ-423 — the host's current data-format fingerprint and the set of
  // persisted artifacts whose fingerprint differs (flagged [data-stale]).
  readonly dataFormat = DATA_FORMAT;
  staleData = new Map<string, string>();
  // REQ-001a — Novels whose save file could not be loaded at hydration or
  // resume (unparseable JSON, checksum mismatch, or data-migration failure),
  // surfaced as a [WARNING] in spec_health.data_health.corrupted.
  corruptData = new Map<string, string>();
  // REQ-238 — slugs loaded from a backup this session. The first save after a
  // backup restore skips copying the (corrupt/stale) on-disk primary into
  // `.bak.1`, so a good backup is never overwritten and corruption is never
  // propagated into the rotated chain.
  private restoredThisSession = new Set<string>();

  private npcCounter = 0;
  private entityCounter = 0;
  private stateDir: string;

  constructor(stateDir: string) {
    this.stateDir = stateDir;
    this.loadServerNotes();
    this.loadCodex();
    this.buildFingerprint = {
      specVersion: SPEC_VERSION,
      specRepoUrl: "https://github.com/anomalyco/Holonovel",
      specHash: "unknown",
      sourceHash: computeSourceHash(),
      rulesetHash: "ruleset-free",
      buildTimestamp: new Date().toISOString(),
    };
    const budgetRaw = process.env.TTRPG_MAX_LORE_TOKENS;
    if (budgetRaw) {
      const budget = parseInt(budgetRaw, 10);
      if (!isNaN(budget) && budget > 0) this.maxLoreTokens = budget;
    }
  }

  get activeNovel(): NovelState | undefined {
    return this.activeNovelId ? this.novels.get(this.activeNovelId) : undefined;
  }

  // ── Badge Gating ────────────────────────────────────────────────

  requireGM(badge: Badge): void {
    if (badge === "observer") throw new Error("[FORBIDDEN] Observer mode is read-only. Corrective action: switch badges with set_badge to interact.");
    if (badge === "player") throw new Error("[FORBIDDEN] This tool is Game Master only. Corrective action: use set_badge to switch.");
  }

  requirePlayer(badge: Badge): void {
    if (badge === "observer") throw new Error("[FORBIDDEN] Observer mode is read-only. Corrective action: switch badges with set_badge to interact.");
    if (badge === "game_master") throw new Error("[FORBIDDEN] This tool is Player only. Corrective action: use set_badge to switch.");
  }

  requireNotObserver(badge: Badge): void {
    if (badge === "observer") throw new Error("[FORBIDDEN] Observer mode is read-only. Corrective action: switch badges with set_badge to interact.");
  }

  requireNovel(): NovelState {
    const novel = this.activeNovel;
    if (!novel) throw new Error("[STATE_CONFLICT] No active Novel. Corrective action: create_novel or resume_novel first.");
    return novel;
  }

  // ── Entity Management ─────────────────────────────────────────

  getActiveEntity(): NovelEntity | undefined {
    const novel = this.activeNovel;
    if (!novel || !novel.active_entity_id) return undefined;
    return novel.entities.get(novel.active_entity_id);
  }

  resolveEntity(entityId?: string): NovelEntity {
    const novel = this.requireNovel();
    const id = entityId ?? novel.active_entity_id;
    if (!id) throw new Error("[INVALID_INPUT] No entity_id provided and no active entity set. Corrective action: pass entity_id or call set_active_entity first.");
    const entity = novel.entities.get(id);
    if (!entity) throw new Error(`[NOT_FOUND] Entity '${id}' not found. Corrective action: list_novels or list_roster_characters to see available ids.`);
    return entity;
  }

  resolveEntityNullable(entityId?: string): NovelEntity | undefined {
    const novel = this.activeNovel;
    if (!novel) return undefined;
    const id = entityId ?? novel.active_entity_id;
    if (!id) return undefined;
    return novel.entities.get(id);
  }

  // ── Novel Lifecycle ───────────────────────────────────────────

  createNovel(name: string, ruleset: string | null = null): NovelState {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    if (this.novels.has(slug)) throw new Error(`[STATE_CONFLICT] Novel '${slug}' already exists.`);

    const novel: NovelState = {
      slug,
      name,
      ruleset: ruleset ?? null,
      badge: "none",
      entities: new Map(),
      active_entity_id: null,
      npcs: new Map(),
      scene_description: "",
      scene_location: undefined,
      scene_time_of_day: undefined,
      scene_atmosphere: undefined,
      scene_history: [],
      scene_beat: "",
      scene_type: ["neutral"],
      narrative_directive: "",
      combat: null,
      countdowns: new Map(),
      lore: new Map(),
      briefing_assembly_count: 0,
      player_signals: {},
      adventure_slug: null,
      generated_adventure: null,
      audit_log: [],
      undo_stacks: { player: [], game_master: [], observer: [], none: [] },
      redo_stacks: { player: [], game_master: [], observer: [], none: [] },
      briefing_order: [],
      action_patterns_enabled: false,
      session_zero_completed: false,
      characters_present: false,
      characters_present_ids: [],
      adventure_set: false,
      pending_workflow: null,
      connection_counter: 0,
      pending_staleness_counter: 0,
      pov_mode: "character",
      autonomy: autonomyDefaultsFromEnv(),
      help_category_overrides: {},
      story_journal: [],
      factions: [],
      secrets: [],
      relationships: [],
      gm_context: {},
      constraint_overrides: [],
      synthesis_activated: {},
      synthesis_module_enabled: {},
      player_synthesis: {},
      campaign_memory: [],
      notes: [],
      vows: [],
      checkpoints: [],
      description: "",
      genre: "",
      adventure_index: null,
      adventure_scene_waypoint: null,
      world: createEmptyWorldModel(),
      story_beats: [],
      pacing_counter: 0,
      pacing_autonomy_fired: false,
      scene_transition_count: 0,
      faction_autonomous_ticks: {},
      npc_goal_suggestions: [],
      voice_corrections_this_session: 0,
      auto_record: true,
      session_no_mutation_windows: [],
      state_regression: null,
      last_mutation_at: null,
      mutation_counts_by_group: {},
      uncommitted_rolls: [],
      metadata: {
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        session_count: 0,
        total_combat_rounds: 0,
        last_scene_anchor: "",
        sessions: [],
      },
      active_session_id: null,
      pending_vow_countdown_suggestion: null,
      codex_sources: [],
    };

    this.novels.set(slug, novel);
    this.activeNovelId = slug;
    this.audit(novel, novel.badge, "create_novel", { name, ruleset: ruleset ?? null });
    this.saveNovel(novel);
    return novel;
  }

  // Bind a ruleset-free Novel to an installed ruleset slug (REQ-380c). One-way:
  // refuse when the Novel already carries a ruleset (a different slug or any
  // existing binding). Audited and persisted.
  bindNovelRuleset(slug: string): NovelState {
    const novel = this.activeNovel;
    if (!novel) throw new Error(`[STATE_CONFLICT] No active Novel to bind.`);
    if (novel.ruleset) {
      throw new Error(`[STATE_CONFLICT] Novel '${novel.slug}' is already bound to ruleset '${novel.ruleset}'. Binding is one-way.`);
    }
    novel.ruleset = slug;
    this.audit(novel, novel.badge, "bind_novel_ruleset", { slug });
    this.saveNovel(novel);
    return novel;
  }

  // REQ-406 — compute the content regression incurred by a backup restore:
  // the audit-log entries and wall-clock age lost relative to the corrupted
  // primary. Shared by resumeNovel and hydrateNovelsFromDisk so the two paths
  // report identical state_regression values.
  private computeStateRegression(data: any, bakData: any): { audit_gap: number; timestamp_gap_ms: number } {
    const auditGap = (data.audit_log?.length ?? 0) - (bakData.audit_log?.length ?? 0);
    const tsGap = (new Date((data.metadata?.modified ?? bakData.metadata?.modified) ?? new Date()).getTime())
      - new Date(bakData.metadata?.modified ?? new Date()).getTime();
    return { audit_gap: Math.max(0, auditGap), timestamp_gap_ms: Math.max(0, tsGap) };
  }

  // REQ-092 — a payload's checksum is valid when absent (legacy writes) or when
  // it matches the recomputed hash of the payload excluding the checksum field.
  private hasValidChecksum(data: any): boolean {
    if (!data._checksum) return true;
    const payload = { ...data };
    delete (payload as any)._checksum;
    const computed = crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");
    return computed === data._checksum;
  }

  resumeNovel(slug: string): NovelState {
    const filePath = path.join(this.stateDir, "novels", `${slug}.json`);
    if (!fs.existsSync(filePath)) throw new Error(`[STATE_CONFLICT] Novel '${slug}' does not exist on disk.`);

    let data: any;
    let primaryData: any = null;
    try {
      data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      primaryData = data;
    } catch {
      data = null; // structurally corrupt primary — fall through to backup restore
    }

    // REQ-238a — restore triggers on a structural JSON error or a checksum
    // mismatch (REQ-092); the first valid backup wins and its index is audited.
    if (data === null || !this.hasValidChecksum(data)) {
      const restored = this.restoreFromBackups(filePath);
      if (restored) {
        const loaded = this.loadNovelFromData(restored.data);
        // REQ-406 — surface the backup-restore content regression.
        loaded.state_regression = {
          ...this.computeStateRegression(primaryData ?? restored.data, restored.data),
          backup_index: restored.index,
          recorded_at: new Date().toISOString(),
        };
        this.novels.set(slug, loaded);
        this.activeNovelId = slug;
        this.restoredThisSession.add(slug);
        this.audit(loaded, loaded.badge, "resume_novel", { slug, restored_from_backup: restored.index });
        return loaded;
      }
      this.corruptData.set(slug, "corrupt primary, no valid backup");
      throw new Error(`[STATE_CONFLICT] Novel '${slug}' is corrupted.`);
    }

    const novel = this.loadNovelFromData(data);
    this.novels.set(slug, novel);
    this.activeNovelId = slug;
    this.audit(novel, novel.badge, "resume_novel", { slug });
    this.checkWorkflowStaleness(novel);
    return novel;
  }

  // REQ-088 — activate an already-hydrated Novel by its internal slug (registry
  // key). Used by the TTRPG_NOVEL startup auto-load so a save file whose name
  // diverges from its internal slug is activated without a second file read.
  // Audits the resume and, when hydration restored from a backup, emits the
  // `[restored-from-backup]` entry naming the backup index (REQ-238/T276).
  activateHydratedNovel(slug: string): NovelState {
    const novel = this.novels.get(slug);
    if (!novel) throw new Error(`[STATE_CONFLICT] Novel '${slug}' is not hydrated.`);
    this.activeNovelId = slug;
    const restoredIndex = novel.state_regression?.backup_index ?? null;
    this.audit(novel, novel.badge, "resume_novel", restoredIndex !== null
      ? { slug, restored_from_backup: restoredIndex }
      : { slug });
    this.checkWorkflowStaleness(novel);
    return novel;
  }

  // REQ-065 — hydrate the in-memory Novel registry from the on-disk novels/
  // directory at startup so list_novels reflects disk without an explicit
  // resume. Loads each save file (falling back to its .bak on a checksum
  // mismatch) without activating a Novel, auditing, or bumping session count.
  //
  // Keying note: the registry is keyed by each Novel's *internal* slug (from
  // data.slug, falling back to the filename), so list/info/create/switch/
  // archive/rename/resume all agree even when a save file's name diverges from
  // its slug (e.g. a file copied in by consolidate-novels.ts). Duplicate
  // internal slugs resolve deterministically: the canonical `<slug>.json`
  // filename wins; otherwise the first file in sorted order is kept.
  //
  // REQ-193a/REQ-224a — hydration is not a "connection" to a Novel, so it
  // deliberately does NOT advance the pending-workflow staleness counter.
  hydrateNovelsFromDisk(): void {
    const dir = path.join(this.stateDir, "novels");
    let entries: string[];
    try {
      entries = fs.readdirSync(dir);
    } catch {
      return; // no novels dir yet — nothing to hydrate
    }
    entries = entries.filter((f) => f.endsWith(".json")).sort();
    const canonicalKeys = new Set<string>();
    for (const file of entries) {
      const fileSlug = file.slice(0, -".json".length);
      const filePath = path.join(dir, file);
      let data: any;
      let primaryData: any = null;
      try {
        data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        primaryData = data;
      } catch {
        data = null; // structurally corrupt primary — fall through to backup restore
      }
      let restoredIndex: number | null = null;
      // REQ-238a — a structural JSON error or checksum mismatch triggers the
      // rotated-backup restore chain; no valid backup → the corrupt-novel path.
      if (data === null || !this.hasValidChecksum(data)) {
        const restored = this.restoreFromBackups(filePath);
        if (!restored) {
          const reason = data === null ? "unparseable JSON, no valid backup" : "checksum mismatch, no valid backup";
          this.corruptData.set(fileSlug, reason);
          process.stderr.write(`[holonovel] hydration: skipped corrupt novel '${file}' (${reason}).\n`);
          continue;
        }
        data = restored.data;
        restoredIndex = restored.index;
      }
      let novel: NovelState;
      try {
        novel = this.loadNovelFromData(data);
      } catch (e) {
        this.corruptData.set(fileSlug, `load failed: ${(e as Error).message}`);
        process.stderr.write(`[holonovel] hydration: skipped novel '${file}' (${(e as Error).message}).\n`);
        continue;
      }
      if (restoredIndex !== null) {
        novel.state_regression = {
          ...this.computeStateRegression(primaryData ?? data, data),
          backup_index: restoredIndex,
          recorded_at: new Date().toISOString(),
        };
        this.restoredThisSession.add(novel.slug);
      }
      const key = novel.slug || fileSlug;
      if (this.novels.has(key)) {
        const candidateCanonical = fileSlug === key;
        const existingCanonical = canonicalKeys.has(key);
        if (candidateCanonical && !existingCanonical) {
          this.novels.set(key, novel); // canonical filename displaces a misnamed copy
          canonicalKeys.add(key);
        }
        process.stderr.write(`[holonovel] hydration: duplicate slug '${key}' — skipped '${file}'.\n`);
        continue;
      }
      this.novels.set(key, novel);
      if (fileSlug === key) canonicalKeys.add(key);
    }
  }

  private loadNovelFromData(data: any): NovelState {
    // REQ-423 — a Novel written under a prior (or absent) data-format
    // fingerprint is flagged [data-stale]; it still loads per REQ-065.
    if (data.data_format !== DATA_FORMAT) {
      this.staleData.set(`novel:${data.slug}`, data.data_format
        ? "data-format fingerprint mismatch"
        : "missing data-format fingerprint");
    }
    data = migrateNovelData(data);
    const novel: NovelState = {
      slug: data.slug,
      name: data.name,
      ruleset: data.ruleset ?? null,
      badge: data.badge,
      entities: new Map(Object.entries(data.entities ?? {}) as any),
      active_entity_id: data.active_entity_id ?? null,
      npcs: new Map(Object.entries(data.npcs ?? {}) as any),
      scene_description: data.scene_description ?? "",
      scene_location: data.scene_location,
      scene_time_of_day: data.scene_time_of_day,
      scene_atmosphere: data.scene_atmosphere,
      scene_history: data.scene_history ?? [],
      scene_beat: data.scene_beat ?? "",
      scene_type: normalizeSceneType(data.scene_type),
      narrative_directive: data.narrative_directive ?? "",
      combat: data.combat ?? null,
      countdowns: new Map(Object.entries(data.countdowns ?? {}) as any),
      lore: new Map(Object.entries(data.lore ?? {}) as any),
      briefing_assembly_count: data.briefing_assembly_count ?? 0,
      player_signals: data.player_signals ?? {},
      adventure_slug: data.adventure_slug ?? null,
      generated_adventure: data.generated_adventure ?? null,
      audit_log: data.audit_log ?? [],
      undo_stacks: {
        player: data.undo_stacks?.player ?? [],
        game_master: data.undo_stacks?.game_master ?? [],
        observer: data.undo_stacks?.observer ?? [],
        none: data.undo_stacks?.none ?? data.undo_stacks?.null ?? [],
      },
      redo_stacks: {
        player: data.redo_stacks?.player ?? [],
        game_master: data.redo_stacks?.game_master ?? [],
        observer: data.redo_stacks?.observer ?? [],
        none: data.redo_stacks?.none ?? data.redo_stacks?.null ?? [],
      },
      briefing_order: data.briefing_order ?? [],
      action_patterns_enabled: data.action_patterns_enabled ?? false,
      session_zero_completed: data.session_zero_completed ?? false,
      characters_present: data.characters_present ?? false,
      characters_present_ids: data.characters_present_ids ?? [],
      adventure_set: data.adventure_set ?? false,
      pending_workflow: data.pending_workflow ?? null,
      connection_counter: data.connection_counter ?? 0,
      pending_staleness_counter: data.pending_staleness_counter ?? 0,
      pov_mode: data.pov_mode ?? "character",
      autonomy: normalizeAutonomy(data.autonomy),
      help_category_overrides: data.help_category_overrides ?? {},
      story_journal: data.story_journal ?? [],
      factions: data.factions ?? [],
      secrets: data.secrets ?? [],
      relationships: data.relationships ?? [],
      gm_context: data.gm_context ?? {},
      constraint_overrides: data.constraint_overrides ?? [],
      synthesis_activated: data.synthesis_activated ?? {},
      synthesis_module_enabled: data.synthesis_module_enabled ?? {},
      player_synthesis: data.player_synthesis ?? {},
      campaign_memory: data.campaign_memory ?? [],
      notes: data.notes ?? [],
      vows: data.vows ?? [],
      checkpoints: data.checkpoints ?? [],
      description: data.description ?? "",
      genre: data.genre ?? "",
      adventure_index: data.adventure_index ?? null,
      adventure_scene_waypoint: data.adventure_scene_waypoint ?? null,
      world: worldFromJSON(data.world),
      story_beats: data.story_beats ?? [],
      pacing_counter: data.pacing_counter ?? 0,
      pacing_autonomy_fired: data.pacing_autonomy_fired ?? false,
      scene_transition_count: data.scene_transition_count ?? 0,
      faction_autonomous_ticks: data.faction_autonomous_ticks ?? {},
      npc_goal_suggestions: data.npc_goal_suggestions ?? [],
      voice_corrections_this_session: data.voice_corrections_this_session ?? 0,
      auto_record: data.auto_record ?? true,
      session_no_mutation_windows: data.session_no_mutation_windows ?? [],
      state_regression: data.state_regression ?? null,
      last_mutation_at: data.last_mutation_at ?? null,
      mutation_counts_by_group: data.mutation_counts_by_group ?? {},
      uncommitted_rolls: data.uncommitted_rolls ?? [],
      metadata: { ...(data.metadata ?? {}), sessions: data.metadata?.sessions ?? [] },
      active_session_id: data.active_session_id ?? null,
      pending_vow_countdown_suggestion: data.pending_vow_countdown_suggestion ?? null,
      codex_sources: data.codex_sources ?? [],
    };
    return novel;
  }

  switchNovel(slug: string): NovelState {
    if (!this.novels.has(slug) && !fs.existsSync(path.join(this.stateDir, "novels", `${slug}.json`))) {
      throw new Error(`[STATE_CONFLICT] Novel '${slug}' does not exist.`);
    }
    if (!this.novels.has(slug)) {
      return this.resumeNovel(slug);
    }
    this.activeNovelId = slug;
    return this.novels.get(slug)!;
  }

  renameNovel(novel: NovelState, newSlug: string): NovelState {
    const oldSlug = novel.slug;
    // REQ-256 — refuse a rename onto an existing slug (in-memory or on disk)
    // rather than silently overwriting the target's save file.
    if (newSlug !== oldSlug && (this.novels.has(newSlug) || fs.existsSync(path.join(this.stateDir, "novels", `${newSlug}.json`)))) {
      throw new Error(`[STATE_CONFLICT] Novel '${newSlug}' already exists.`);
    }
    novel.slug = newSlug;
    novel.name = newSlug;
    this.novels.delete(oldSlug);
    this.novels.set(newSlug, novel);
    if (this.activeNovelId === oldSlug) this.activeNovelId = newSlug;
    this.audit(novel, novel.badge, "rename_novel", { from: oldSlug, to: newSlug });
    this.saveNovel(novel);
    return novel;
  }

  // REQ-117 — Novel retention period: ended Novels move to .trash/ and are
  // excluded from resume_novel; retention is configurable via
  // TTRPG_NOVEL_RETENTION_DAYS (cleanupExpiredTrash).
  endNovel(novel: NovelState, dispose: "yes" | "cancel"): { removed: boolean } {
    if (dispose === "cancel") return { removed: false };
    const trashDir = path.join(this.stateDir, ".trash");
    fs.mkdirSync(trashDir, { recursive: true });
    const novelFile = path.join(this.stateDir, "novels", `${novel.slug}.json`);
    if (fs.existsSync(novelFile)) {
      fs.renameSync(novelFile, path.join(trashDir, `${novel.slug}-${Date.now()}.json`));
    }
    // REQ-238b — move the whole backup chain (`.bak.N` + legacy `.bak`) to trash
    // alongside the primary so no orphaned backups survive an ended Novel.
    for (const bakPath of this.backupFilesOnDisk(novelFile)) {
      const suffix = bakPath.slice(novelFile.length);
      fs.renameSync(bakPath, path.join(trashDir, `${novel.slug}-${Date.now()}.json${suffix}`));
    }
    const archiveDir = path.join(this.stateDir, "archive");
    if (fs.existsSync(archiveDir)) {
      for (const entry of fs.readdirSync(archiveDir)) {
        if (entry.startsWith(`${novel.slug}-`) || entry === `${novel.slug}.json`) {
          const full = path.join(archiveDir, entry);
          fs.renameSync(full, path.join(trashDir, `archived-${entry}`));
        }
      }
    }
    this.novels.delete(novel.slug);
    if (this.activeNovelId === novel.slug) {
      this.activeNovelId = null;
    }
    return { removed: true };
  }

  // REQ-334 — Novel archive: move a Novel to .holonovel-state/archive/.
  // Archived Novels are read-only long-term references, never auto-deleted.
  archiveNovel(slug: string): { archived: boolean; at: string } {
    const novelFile = path.join(this.stateDir, "novels", `${slug}.json`);
    if (!fs.existsSync(novelFile)) throw new Error(`[STATE_CONFLICT] Novel '${slug}' does not exist on disk.`);
    const archiveDir = path.join(this.stateDir, "archive");
    fs.mkdirSync(archiveDir, { recursive: true });
    const target = path.join(archiveDir, `${slug}.json`);
    if (fs.existsSync(target)) fs.unlinkSync(target);
    fs.renameSync(novelFile, target);
    // REQ-334 — move the backup chain alongside the archived primary.
    for (const bakPath of this.backupFilesOnDisk(novelFile)) {
      const suffix = bakPath.slice(novelFile.length);
      const dest = target + suffix;
      if (fs.existsSync(dest)) fs.unlinkSync(dest);
      fs.renameSync(bakPath, dest);
    }
    this.novels.delete(slug);
    if (this.activeNovelId === slug) this.activeNovelId = null;
    return { archived: true, at: new Date().toISOString() };
  }

  unarchiveNovel(slug: string): NovelState {
    const archiveFile = path.join(this.stateDir, "archive", `${slug}.json`);
    if (!fs.existsSync(archiveFile)) throw new Error(`[STATE_CONFLICT] Novel '${slug}' is not archived.`);
    const novelsDir = path.join(this.stateDir, "novels");
    fs.mkdirSync(novelsDir, { recursive: true });
    const target = path.join(novelsDir, `${slug}.json`);
    if (fs.existsSync(target)) throw new Error(`[STATE_CONFLICT] Novel '${slug}' already exists as active.`);
    fs.renameSync(archiveFile, target);
    // REQ-334 — restore the backup chain alongside the unarchived primary.
    for (const bakPath of this.backupFilesOnDisk(archiveFile)) {
      const suffix = bakPath.slice(archiveFile.length);
      const dest = target + suffix;
      if (fs.existsSync(dest)) fs.unlinkSync(dest);
      fs.renameSync(bakPath, dest);
    }
    return this.resumeNovel(slug);
  }

  archivedNovels(): Array<{ slug: string; archived_at: string }> {
    const archiveDir = path.join(this.stateDir, "archive");
    if (!fs.existsSync(archiveDir)) return [];
    return fs.readdirSync(archiveDir)
      .filter((f) => f.endsWith(".json") && !f.endsWith(".json.bak"))
      .map((f) => {
        const stat = fs.statSync(path.join(archiveDir, f));
        return { slug: f.replace(/\.json$/, ""), archived_at: stat.mtime.toISOString() };
      });
  }

  cleanupExpiredTrash(): void {
    const trashDir = path.join(this.stateDir, ".trash");
    if (!fs.existsSync(trashDir)) return;
    const retentionDays = parseInt(process.env.TTRPG_NOVEL_RETENTION_DAYS ?? "0", 10);
    if (!retentionDays || retentionDays <= 0) return;
    const cutoff = Date.now() - retentionDays * 86400_000;
    for (const entry of fs.readdirSync(trashDir)) {
      const full = path.join(trashDir, entry);
      const stat = fs.statSync(full);
      if (stat.mtimeMs < cutoff) {
        fs.unlinkSync(full);
      }
    }
  }

  // ── Snapshots, Undo, Redo ─────────────────────────────────────

  // Capture a pre-workflow snapshot (REQ-042b/d): a full Novel-state clone with
  // the workflow start timestamp. Persisted alongside the pending decision so
  // respond(cancel) or staleness auto-cancel can restore it after a restart.
  captureWorkflowSnapshot(novel: NovelState): WorkflowSnapshot {
    // The connection that raises the workflow is connection 1 for staleness
    // accounting (REQ-224, T266): the workflow survives the first N connections
    // and auto-cancels on the (N+1)th.
    novel.connection_counter = (novel.connection_counter ?? 0) + 1;
    novel.pending_staleness_counter = 1;
    return {
      timestamp: new Date().toISOString(),
      state: JSON.parse(JSON.stringify(novelToSnapshotJSON(novel))),
    };
  }

  // Restore the pre-workflow snapshot over all Novel-tier fields, clear the
  // pending workflow, and reset the staleness counter (REQ-042b, REQ-224a).
  // The audit entry is the caller's responsibility (explicit cancel vs. stale
  // differ in their entry tags). Returns the restored snapshot for audit text.
  restoreFromSnapshot(novel: NovelState, snapshot: WorkflowSnapshot | null): { timestamp: string } {
    let timestamp = snapshot?.timestamp ?? new Date().toISOString();
    if (snapshot?.state) {
      const restored = novelFromJSON(snapshot.state);
      // Preserve the undo/redo stacks and audit log from the *pre-restore*
      // novel — REQ-041 keeps workflow cancellation independent of undo, and
      // the snapshot omits stacks/bookkeeping by design.
      const undoStacks = novel.undo_stacks;
      const redoStacks = novel.redo_stacks;
      const auditLog = novel.audit_log;
      const connectionCounter = novel.connection_counter;
      applyNovelState(novel, restored);
      novel.undo_stacks = undoStacks;
      novel.redo_stacks = redoStacks;
      novel.audit_log = auditLog;
      novel.connection_counter = connectionCounter;
      timestamp = snapshot!.timestamp;
    }
    novel.pending_workflow = null;
    novel.pending_staleness_counter = 0;
    return { timestamp };
  }

  // REQ-224a/b: on each new connection to a Novel with a pending workflow,
  // increment the staleness counter. When it reaches TTRPG_WORKFLOW_STALENESS_CONNECTIONS
  // (default 5), auto-cancel with the same behavior as respond("cancel"), but
  // tagged [workflow-stale]. A threshold of 0 disables detection. Returns a
  // non-null description when an auto-cancel occurred.
  checkWorkflowStaleness(novel: NovelState): string | null {
    const threshold = parseInt(process.env.TTRPG_WORKFLOW_STALENESS_CONNECTIONS ?? "5", 10);
    if (threshold <= 0) return null;
    if (!novel.pending_workflow) return null;

    novel.connection_counter = (novel.connection_counter ?? 0) + 1;
    novel.pending_staleness_counter = (novel.pending_staleness_counter ?? 0) + 1;

    const counter = novel.pending_staleness_counter;
    const decision = novel.pending_workflow.decision;
    if (counter < threshold) {
      this.saveNovel(novel);
      return null;
    }

    // Auto-cancel: restore the pre-workflow snapshot and emit a [workflow-stale]
    // audit entry distinct from explicit cancellation (REQ-224a).
    const snapshot = novel.pending_workflow.snapshot;
    const baseline = novel.pending_staleness_counter;
    this.restoreFromSnapshot(novel, snapshot);
    // restoreFromSnapshot resets the counter; carry the value into the audit text.
    this.audit(novel, novel.badge, "workflow_stale", {
      decision,
      connections: baseline,
      timestamp: snapshot?.timestamp ?? null,
    }, "[workflow-stale]");
    this.saveNovel(novel);
    return `Workflow '${decision}' auto-cancelled after ${baseline} connections (staleness threshold ${threshold}).`;
  }

  snapshot(novel: NovelState, badge: Badge): void {
    const clone = JSON.parse(JSON.stringify(novelToSnapshotJSON(novel)));
    const stackKey = badge;
    novel.undo_stacks[stackKey].push(clone);
    if (novel.undo_stacks[stackKey].length > 10) {
      novel.undo_stacks[stackKey].shift();
    }
    novel.redo_stacks[stackKey] = [];
  }

  undo(novel: NovelState, badge: Badge): { data: any } | null {
    const stackKey = badge;
    const stack = novel.undo_stacks[stackKey];
    if (stack.length === 0) throw new Error("[STATE_CONFLICT] Nothing to undo.");

    const current = JSON.parse(JSON.stringify(novelToSnapshotJSON(novel)));
    novel.redo_stacks[stackKey].push(current);

    const restore = stack.pop()!;
    const restored = novelFromJSON(restore);
    applyNovelState(novel, restored);
    this.saveNovel(novel);
    return { data: restore };
  }

  redo(novel: NovelState, badge: Badge): { data: any } | null {
    const stackKey = badge;
    const stack = novel.redo_stacks[stackKey];
    if (stack.length === 0) throw new Error("[STATE_CONFLICT] Nothing to redo.");

    const current = JSON.parse(JSON.stringify(novelToSnapshotJSON(novel)));
    novel.undo_stacks[stackKey].push(current);

    const restore = stack.pop()!;
    const restored = novelFromJSON(restore);
    applyNovelState(novel, restored);
    this.saveNovel(novel);
    return { data: restore };
  }

  // ── Audit ─────────────────────────────────────────────────────

  audit(novel: NovelState, badge: Badge, tool: string, args: any, output_prefix?: string): void {
    // REQ-237 — session segmentation: when the session id changes (first
    // mutating call after start/resume, or a new TTRPG_SESSION_ID), emit a
    // `[session-boundary]` marker entry and open a new session record.
    const sessionId = process.env.TTRPG_SESSION_ID ?? `session-${novel.metadata.session_count + 1}`;
    if (novel.active_session_id !== sessionId) {
      const prev = novel.active_session_id;
      const now = new Date().toISOString();
      const prevSession = prev ? novel.metadata.sessions.find((s) => s.session_id === prev) : undefined;
      if (prevSession) prevSession.timespan_end = now;
      novel.active_session_id = sessionId;
      novel.metadata.sessions.push({
        session_id: sessionId,
        entry_count: 0,
        timespan_start: now,
        timespan_end: null,
        combat_rounds: 0,
        significant_roll_count: 0,
        scene_transitions: 0,
      });
      const marker: AuditEntry & { session_id?: string } = {
        timestamp: now,
        badge,
        tool: "[session-boundary]",
        args: JSON.stringify({ session_id: sessionId }),
        output_prefix: "[session-boundary]",
        hash: "",
      };
      marker.session_id = sessionId;
      marker.hash = crypto.createHash("sha256").update((novel.audit_log.length > 0 ? novel.audit_log[novel.audit_log.length - 1].hash : "00000000") + marker.tool + marker.args).digest("hex").substring(0, 8);
      novel.audit_log.push(marker as AuditEntry);
    }
    const prevHash = novel.audit_log.length > 0 ? novel.audit_log[novel.audit_log.length - 1].hash : "00000000";
    const entry: AuditEntry = {
      timestamp: new Date().toISOString(),
      badge,
      tool,
      args: JSON.stringify(args),
      output_prefix: output_prefix ?? "",
      hash: crypto.createHash("sha256").update(prevHash + tool + JSON.stringify(args)).digest("hex").substring(0, 8),
    };
    novel.audit_log.push(entry);
    const cur = novel.metadata.sessions.find((s) => s.session_id === novel.active_session_id);
    if (cur) {
      cur.entry_count++;
      if (tool === "advance_combat") cur.combat_rounds++;
      if (tool === "set_scene_state") cur.scene_transitions++;
    }
  }

  auditForbidden(badge: Badge, tool: string, args: any): void {
    const novel = this.activeNovel;
    if (!novel) return;
    const prevHash = novel.audit_log.length > 0 ? novel.audit_log[novel.audit_log.length - 1].hash : "00000000";
    const entry: AuditEntry & { violation_type?: string } = {
      timestamp: new Date().toISOString(),
      badge,
      tool,
      args: JSON.stringify(args),
      output_prefix: "[BOUNDARY_VIOLATION]",
      hash: crypto.createHash("sha256").update(prevHash + tool + JSON.stringify(args)).digest("hex").substring(0, 8),
    };
    (entry as any).violation_type = "boundary";
    novel.audit_log.push(entry as AuditEntry);
  }

  // §5.19 REQ-401/403 — record a state-mutating write for the state_ledger
  // token and drift detection. `group` groups tools into the REQ-401 per-group
  // mutation counts (scene, journal, countdown, note, personality, npc, vow).
  recordMutation(novel: NovelState, tool: string, group: string): void {
    const now = new Date().toISOString();
    novel.last_mutation_at = now;
    novel.mutation_counts_by_group[group] = (novel.mutation_counts_by_group[group] ?? 0) + 1;
    // REQ-404 — a committing mutation drains pending uncommitted-roll markers.
    novel.uncommitted_rolls = [];
    this.saveNovel(novel);
  }

  // §5.19 REQ-402 — close the current session window; record a no-mutation
  // window when the session produced zero state writes.
  closeSessionWindow(novel: NovelState, sessionId: string): void {
    const hasMutation = Object.keys(novel.mutation_counts_by_group).some((g) => novel.mutation_counts_by_group[g] > 0);
    if (!hasMutation && !novel.session_no_mutation_windows.includes(sessionId)) {
      novel.session_no_mutation_windows.push(sessionId);
    }
    novel.mutation_counts_by_group = {};
    novel.metadata.session_count += 1;
    this.saveNovel(novel);
  }

  // §5.19 REQ-403b — the TTRPG_STATE_GATE setting (off|warn|block) gates
  // session-close / context tools while state drift is active.
  stateGate(): "off" | "warn" | "block" {
    const v = process.env.TTRPG_STATE_GATE ?? "off";
    return v === "warn" || v === "block" ? v : "off";
  }

  stateDriftActive(novel: NovelState): boolean {
    const savedAt = novel.gm_context?.saved_at;
    if (!savedAt || !novel.last_mutation_at) return false;
    return new Date(savedAt).getTime() > new Date(novel.last_mutation_at).getTime();
  }

  // §5.19 REQ-406 — mark a load-from-backup with the content regression gap.
  markStateRegression(novel: NovelState, auditEntryCountGap: number, timestampGapMs: number): void {
    novel.state_regression = { audit_gap: auditEntryCountGap, timestamp_gap_ms: timestampGapMs, recorded_at: new Date().toISOString() };
    this.saveNovel(novel);
  }

  verifyAuditChain(novel: NovelState): { valid: boolean; entries: number; first_broken_index?: number } {
    const entries = novel.audit_log;
    if (entries.length === 0) return { valid: true, entries: 0 };
    let prevHash = "00000000";
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const expected = crypto.createHash("sha256").update(prevHash + entry.tool + entry.args).digest("hex").substring(0, 8);
      if (entry.hash !== expected) {
        return { valid: false, entries: entries.length, first_broken_index: i };
      }
      prevHash = entry.hash;
    }
    return { valid: true, entries: entries.length };
  }

  getEnrichmentHealth(): any {
    const manifest = this.enrichmentManifest;
    if (!manifest) return {
      enrichment_active: this.enriched,
      module_counts: {},
      stale_count: 0,
      activated_count: 0,
      fingerprint: null,
    };
    const staleDays = parseInt(process.env.TTRPG_SYNTHESIS_STALE_DAYS ?? "90", 10);
    const cutoff = Date.now() - staleDays * 86400_000;
    let staleCount = 0;
    let activatedCount = 0;
    const moduleCounts: Record<string, number> = {};
    const modules = ["voice_examples", "briefing_order", "lore_templates", "action_patterns", "supplementary_guidance", "adventure_advice", "narrative_voices"];
    for (const mod of modules) {
      const items = (manifest[mod] ?? []) as any[];
      moduleCounts[mod] = items.length;
      for (const item of items) {
        if (item.collected_at && new Date(item.collected_at).getTime() < cutoff) staleCount++;
        if (item.activated) activatedCount++;
      }
    }
    return {
      enrichment_active: this.enriched,
      module_counts: moduleCounts,
      stale_count: staleCount,
      activated_count: activatedCount,
      fingerprint: manifest._fingerprint ?? null,
    };
  }

  // ── Combat ────────────────────────────────────────────────────

  initCombat(novel: NovelState, participants: string[], dangers: { name: string; ac?: number; hp?: number; max_hp?: number; initiative_bonus?: number }[], seedStr?: string): CombatState {
    // REQ-157 — combat determinism: danger initiative draws use the per-call
    // seed's isolated PRNG (createRng), not advancing the session PRNG
    // position; same seed → same danger initiative across sessions.
    const turn_order: string[] = [];
    // Simple ordering: entities first, then dangers — no initiative rolling in ruleset-free mode
    for (const pid of participants) {
      if (!turn_order.includes(pid)) turn_order.push(pid);
    }
    if (seedStr) {
      // Deterministic danger initiative from the isolated per-call draw.
      const rng = createRng(`combat:${seedStr}`);
      const seeded = [...dangers].sort((a, b) => (rng.roll(20) + (a.initiative_bonus ?? 0)) - (rng.roll(20) + (b.initiative_bonus ?? 0))).reverse();
      for (const d of seeded) {
        if (!turn_order.includes(d.name)) turn_order.push(d.name);
      }
    } else {
      for (const d of dangers) {
        if (!turn_order.includes(d.name)) turn_order.push(d.name);
      }
    }

    const combat: CombatState = {
      participants,
      dangers: dangers.map(d => ({ ...d, hp: d.max_hp ?? d.hp ?? 1, max_hp: d.max_hp ?? d.hp ?? 1 })),
      round: 1,
      turn_order,
      current_turn: 0,
      active: true,
    };
    novel.combat = combat;
    this.audit(novel, novel.badge, "init_combat", { participants, dangers });
    return combat;
  }

  advanceCombat(novel: NovelState): CombatState {
    if (!novel.combat || !novel.combat.active) throw new Error("[STATE_CONFLICT] No active combat.");

    const combat = novel.combat;
    const currentName = combat.turn_order[combat.current_turn];
    const isEntity = novel.entities.has(currentName);
    const isNpc = novel.npcs.has(currentName);
    const isDanger = combat.dangers.some(d => d.name === currentName);

    // REQ-206 — combat-round condition expiry: conditions with a round duration
    // decrement when the affected participant's turn resolves, then expire at
    // zero (audited as [condition-expired]). No duration → no auto-expiry.
    const target = novel.entities.get(currentName) ?? novel.npcs.get(currentName);
    if (target && target.condition_rounds) {
      for (const [cond, remaining] of Object.entries(target.condition_rounds)) {
        if (remaining <= 0) continue;
        target.condition_rounds[cond] = remaining - 1;
        if (target.condition_rounds[cond] <= 0) {
          delete target.condition_rounds[cond];
          target.conditions = target.conditions.filter((c) => c !== cond);
          this.audit(novel, novel.badge, "condition_expired", { entity: currentName, condition: cond, round: combat.round }, "[condition-expired]");
        }
      }
    }

    // In ruleset-free mode, everyone auto-advances
    combat.current_turn++;
    if (combat.current_turn >= combat.turn_order.length) {
      combat.current_turn = 0;
      combat.round++;
      novel.metadata.total_combat_rounds++;

      for (const [, cd] of novel.countdowns) {
        if (cd.type === "round") {
          cd.ticks--;
          if (cd.ticks <= 0) {
            this.audit(novel, novel.badge, "countdown_expired", { name: cd.name });
          }
        }
      }
    }

    this.audit(novel, novel.badge, "advance_combat", {
      participant: currentName,
      round: combat.round,
      turn: combat.current_turn,
      statless: true,
    });
    return combat;
  }

  endCombat(novel: NovelState, outcome: string): void {
    if (!novel.combat) throw new Error("[STATE_CONFLICT] No active combat.");
    novel.combat.active = false;
    this.audit(novel, novel.badge, "end_combat", { outcome, rounds_played: novel.combat.round });
    novel.combat = null;
  }

  addCombatParticipant(novel: NovelState, participantId: string): CombatState {
    // REQ-205 — mid-combat participant changes: added participants insert after
    // the current turn without advancing the pointer; unresolved IDs → NOT_FOUND.
    if (!novel.combat || !novel.combat.active) throw new Error("[STATE_CONFLICT] No active combat.");
    if (!novel.entities.has(participantId) && !novel.npcs.has(participantId)) {
      const valid = [...novel.entities.keys(), ...novel.npcs.keys()];
      throw new Error(`[NOT_FOUND] Participant '${participantId}' not found. Valid: ${valid.join(", ") || "(none)"}`);
    }
    if (novel.combat.turn_order.includes(participantId)) {
      throw new Error(`[STATE_CONFLICT] Participant '${participantId}' is already in combat.`);
    }
    const combat = novel.combat;
    const insertIdx = combat.current_turn + 1;
    combat.turn_order.splice(insertIdx, 0, participantId);
    if (combat.current_turn >= insertIdx) {
      combat.current_turn++;
    }
    if (!combat.participants.includes(participantId)) {
      combat.participants.push(participantId);
    }
    this.audit(novel, novel.badge, "add_combat_participant", { participant_id: participantId });
    return combat;
  }

  removeCombatParticipant(novel: NovelState, participantId: string): { combat: CombatState | null; ended: boolean; outcome?: string } {
    // REQ-205b/c — removing the current participant advances the pointer before
    // removal; removing the last participant auto-triggers end_combat.
    if (!novel.combat || !novel.combat.active) throw new Error("[STATE_CONFLICT] No active combat.");
    const combat = novel.combat;
    const idx = combat.turn_order.indexOf(participantId);
    if (idx === -1) {
      throw new Error(`[NOT_FOUND] Participant '${participantId}' is not in combat.`);
    }
    if (combat.turn_order.length <= 1) {
      combat.active = false;
      this.audit(novel, novel.badge, "end_combat", { outcome: "All participants removed.", rounds_played: combat.round });
      novel.combat = null;
      return { combat: null, ended: true, outcome: "All participants removed." };
    }
    if (idx === combat.current_turn) {
      combat.current_turn = (combat.current_turn + 1) % combat.turn_order.length;
    }
    combat.turn_order.splice(idx, 1);
    if (combat.current_turn >= combat.turn_order.length) {
      combat.current_turn = 0;
    }
    if (idx < combat.current_turn) {
      combat.current_turn--;
    }
    combat.participants = combat.participants.filter(p => p !== participantId);
    this.audit(novel, novel.badge, "remove_combat_participant", { participant_id: participantId });
    return { combat, ended: false };
  }

  combatReport(novel: NovelState): string {
    if (!novel.combat || !novel.combat.active) return "\nNone";
    const c = novel.combat;
    const gm = novel.badge === "game_master";
    const turnOrder = c.turn_order.map((name, i) => {
      const marker = i === c.current_turn ? "← current" : "";
      const isEntity = novel.entities.has(name);
      if (!gm && !isEntity) return null;
      return `  ${i + 1}. ${name}${marker}`;
    }).filter(Boolean).join("\n");
    return `\nRound ${c.round} — Turn ${c.current_turn + 1} of ${c.turn_order.length}
${turnOrder}`;
  }

  // ── World-model helpers ───────────────────────────────────────

  worldHasRooms(novel: NovelState): boolean {
    return novel.world.rooms.size > 0;
  }

  // ── Persistence ───────────────────────────────────────────────

  // REQ-238 — the number of rotated backups retained per Novel, configured via
  // TTRPG_NOVEL_BACKUP_COUNT (minimum 1; unset defaults to 1 = current behavior).
  private backupCount(): number {
    const raw = parseInt(process.env.TTRPG_NOVEL_BACKUP_COUNT ?? "1", 10);
    return Number.isFinite(raw) && raw >= 1 ? raw : 1;
  }

  // REQ-238 — ordered restore candidates: `.bak.1..N` (newest first), then a
  // legacy singular `.bak` (pre-rotation saves) accepted as the index-1 candidate.
  private backupCandidates(filePath: string): { path: string; index: number }[] {
    const candidates: { path: string; index: number }[] = [];
    for (let i = 1; i <= this.backupCount(); i++) candidates.push({ path: `${filePath}.bak.${i}`, index: i });
    candidates.push({ path: `${filePath}.bak`, index: 1 });
    return candidates;
  }

  // REQ-238/REQ-092 — restore from the first parseable backup with a valid
  // checksum. Returns the winning data plus its backup index, or null when no
  // candidate is usable (REQ-238b hands off to the existing recovery path).
  private restoreFromBackups(filePath: string): { data: any; index: number } | null {
    for (const cand of this.backupCandidates(filePath)) {
      if (!fs.existsSync(cand.path)) continue;
      try {
        const raw = fs.readFileSync(cand.path, "utf-8");
        const data = JSON.parse(raw);
        if (!this.hasValidChecksum(data)) continue;
        return { data, index: cand.index };
      } catch {
        continue; // structurally corrupt or unreadable candidate — try the next
      }
    }
    return null;
  }

  // REQ-238 — enumerate every backup file on disk for a primary file path: the
  // rotated `<file>.bak.N` chain plus the legacy singular `<file>.bak`.
  private backupFilesOnDisk(filePath: string): string[] {
    const dir = path.dirname(filePath);
    const base = path.basename(filePath);
    const legacy = `${base}.bak`;
    const prefix = `${base}.bak.`;
    const found: string[] = [];
    let entries: string[] = [];
    try {
      entries = fs.readdirSync(dir);
    } catch {
      return found;
    }
    for (const e of entries) {
      if (e === legacy || e.startsWith(prefix)) found.push(path.join(dir, e));
    }
    return found.sort();
  }

  saveNovel(novel: NovelState): void {
    const dir = path.join(this.stateDir, "novels");
    fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, `${novel.slug}.json`);
    const tmpPath = filePath + `.${process.pid}-${Date.now()}.tmp`;
    const count = this.backupCount();

    novel.metadata.modified = new Date().toISOString();

    // Defensive guard: the undo/redo stacks are internal bookkeeping. If they
    // have grown pathologically (e.g. a snapshot regression embedded prior
    // stacks), trim them rather than let an unbounded save brick all writes.
    const SANE_STACK_BYTES = 16 * 1024 * 1024; // 16 MiB per badge
    for (const key of Object.keys(novel.undo_stacks)) {
      const stack = novel.undo_stacks[key];
      while (stack.length > 0 && estimateJsonBytes(stack) > SANE_STACK_BYTES) {
        stack.shift();
      }
    }
    for (const key of Object.keys(novel.redo_stacks)) {
      const stack = novel.redo_stacks[key];
      while (stack.length > 0 && estimateJsonBytes(stack) > SANE_STACK_BYTES) {
        stack.shift();
      }
    }

    const json = JSON.stringify(novelToJSON(novel));
    const payload: any = JSON.parse(json);
    // REQ-423 — stamp the data-format fingerprint and spec version at write time.
    payload.data_format = DATA_FORMAT;
    payload.spec_version = SPEC_VERSION;
    payload._checksum = crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");

    const out = JSON.stringify(payload, null, 2);
    // REQ-238 — rotate the backup chain before committing the new primary:
    // `.bak.N-1` → `.bak.N`, … `.bak.1` → `.bak.2`, then the previous primary
    // becomes `.bak.1`. count=1 writes only `.bak.1` (the previous primary).
    if (count > 1) {
      for (let i = count - 1; i >= 1; i--) {
        const from = `${filePath}.bak.${i}`;
        const to = `${filePath}.bak.${i + 1}`;
        if (fs.existsSync(from)) {
          if (fs.existsSync(to)) fs.unlinkSync(to);
          fs.renameSync(from, to);
        }
      }
    }
    if (fs.existsSync(filePath) && !this.restoredThisSession.delete(novel.slug)) {
      fs.copyFileSync(filePath, `${filePath}.bak.1`);
    }
    // Prune backups beyond the configured chain (e.g. TTRPG_NOVEL_BACKUP_COUNT
    // lowered between runs); breaks immediately when no stale index remains.
    for (let i = count + 1; ; i++) {
      const stale = `${filePath}.bak.${i}`;
      if (!fs.existsSync(stale)) break;
      fs.unlinkSync(stale);
    }
    const fd = fs.openSync(tmpPath, "w");
    fs.writeFileSync(fd, out, "utf-8");
    fs.fsyncSync(fd);
    fs.closeSync(fd);
    fs.renameSync(tmpPath, filePath);
  }

  saveRoster(): void {
    const dir = this.stateDir;
    fs.mkdirSync(dir, { recursive: true });
    const rosterData: Record<string, any> = {};
    for (const [id, entity] of this.roster) {
      rosterData[id] = {
        id: entity.id,
        name: entity.name,
        personality: entity.personality,
        voice_examples: entity.voice_examples,
        inventory: entity.inventory,
        current_room: entity.current_room,
        conditions: entity.conditions,
        condition_rounds: entity.condition_rounds,
        stats: entity.stats,
      };
    }
    rosterData[META_KEY] = { data_format: DATA_FORMAT, spec_version: SPEC_VERSION };
    fs.writeFileSync(path.join(dir, "roster.json"), JSON.stringify(rosterData, null, 2), "utf-8");
  }

  loadRoster(): void {
    const filePath = path.join(this.stateDir, "roster.json");
    if (!fs.existsSync(filePath)) return;
    const raw = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(raw);
    this.checkFlatMeta("roster", data);
    for (const [id, entity] of Object.entries(data)) {
      if (id === META_KEY) continue;
      const e = entity as any;
      this.roster.set(id, {
        id: e.id || id,
        name: e.name,
        personality: e.personality,
        voice_examples: e.voice_examples,
        inventory: e.inventory || [],
        current_room: e.current_room || null,
        conditions: e.conditions || [],
        condition_rounds: e.condition_rounds || {},
        stats: e.stats,
      });
    }
  }

  // REQ-423 — record a [data-stale] flag for a flat-map artifact whose stamped
  // data-format fingerprint differs from (or is absent from) the host's value.
  private checkFlatMeta(artifact: string, data: Record<string, any>): void {
    const meta = data[META_KEY];
    if (!meta || meta.data_format !== DATA_FORMAT) {
      this.staleData.set(artifact, meta?.data_format ? "data-format fingerprint mismatch" : "missing data-format fingerprint");
    }
  }

  // ── Server Notes (REQ-285) ─────────────────────────────────────

  // Stage an entity into the roster (REQ-219 roster staging). Persists the
  // roster. The entity keeps its stats, personality, and inventory baseline.
  addToRoster(entity: NovelEntity): string {
    const id = entity.id;
    this.roster.set(id, {
      id: entity.id,
      name: entity.name,
      personality: entity.personality,
      voice_examples: entity.voice_examples,
      inventory: entity.inventory || [],
      current_room: entity.current_room || null,
      conditions: entity.conditions || [],
      condition_rounds: entity.condition_rounds || {},
      stats: entity.stats,
    });
    this.saveRoster();
    return id;
  }

  loadServerNotes(): void {
    const filePath = path.join(this.stateDir, "server-notes.json");
    if (!fs.existsSync(filePath)) return;
    try {
      const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      this.checkFlatMeta("server-notes", data);
      for (const [key, val] of Object.entries(data)) {
        if (key === META_KEY) continue;
        this.serverNotes.set(key, typeof val === "string" ? { content: val } : (val as { content: string; narrative_tag?: string }));
      }
    } catch { /* ignore corrupt */ }
  }

  saveServerNotes(): void {
    fs.mkdirSync(this.stateDir, { recursive: true });
    const notesData: Record<string, any> = Object.fromEntries(this.serverNotes);
    notesData[META_KEY] = { data_format: DATA_FORMAT, spec_version: SPEC_VERSION };
    fs.writeFileSync(
      path.join(this.stateDir, "server-notes.json"),
      JSON.stringify(notesData, null, 2),
      "utf-8",
    );
  }

  loadCodex(): void {
    const filePath = path.join(this.stateDir, "codex.json");
    if (!fs.existsSync(filePath)) return;
    try {
      const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      this.checkFlatMeta("codex", data);
      for (const [id, entry] of Object.entries(data)) {
        if (id === META_KEY) continue;
        this.codex.set(id, entry as CodexEntry);
      }
    } catch { /* ignore corrupt */ }
  }

  saveCodex(): void {
    fs.mkdirSync(this.stateDir, { recursive: true });
    const codexData: Record<string, any> = Object.fromEntries(this.codex);
    codexData[META_KEY] = { data_format: DATA_FORMAT, spec_version: SPEC_VERSION };
    fs.writeFileSync(
      path.join(this.stateDir, "codex.json"),
      JSON.stringify(codexData, null, 2),
      "utf-8",
    );
  }

  // ── Entity Factory (ruleset-free, REQ-219) ────────────────────

  createEntity(name: string, personality?: { description?: string; voice?: string; background?: string; goals?: string }, stats?: Record<string, any>): NovelEntity {
    this.entityCounter++;
    const id = `character_${String(this.entityCounter).padStart(2, "0")}`;
    const entity: NovelEntity = {
      id,
      name,
      personality,
      inventory: [],
      current_room: null,
      conditions: [],
      condition_rounds: {},
      stats,
    };
    return entity;
  }

  addEntity(novel: NovelState, entity: NovelEntity): void {
    novel.entities.set(entity.id, entity);
    if (!novel.active_entity_id) {
      novel.active_entity_id = entity.id;
    }
    novel.characters_present = true;
  }
}

// ── Serialization helpers ──────────────────────────────────────────

function novelToJSON(novel: NovelState): any {
  return {
    slug: novel.slug,
    name: novel.name,
    ruleset: novel.ruleset,
    badge: novel.badge,
    entities: Object.fromEntries(novel.entities),
    active_entity_id: novel.active_entity_id,
    npcs: Object.fromEntries(novel.npcs),
    scene_description: novel.scene_description,
    scene_location: novel.scene_location,
    scene_time_of_day: novel.scene_time_of_day,
    scene_atmosphere: novel.scene_atmosphere,
    scene_history: novel.scene_history,
    scene_beat: novel.scene_beat,
    scene_type: novel.scene_type,
    narrative_directive: novel.narrative_directive,
    combat: novel.combat,
    countdowns: Object.fromEntries(novel.countdowns),
    lore: Object.fromEntries(novel.lore),
    briefing_assembly_count: novel.briefing_assembly_count,
    player_signals: novel.player_signals,
    adventure_slug: novel.adventure_slug,
    generated_adventure: novel.generated_adventure,
    audit_log: novel.audit_log,
    undo_stacks: novel.undo_stacks,
    redo_stacks: novel.redo_stacks,
    briefing_order: novel.briefing_order,
    action_patterns_enabled: novel.action_patterns_enabled,
    session_zero_completed: novel.session_zero_completed,
    characters_present: novel.characters_present,
    characters_present_ids: novel.characters_present_ids,
    adventure_set: novel.adventure_set,
    pending_workflow: novel.pending_workflow,
    connection_counter: novel.connection_counter,
    pending_staleness_counter: novel.pending_staleness_counter,
    pov_mode: novel.pov_mode,
    autonomy: novel.autonomy,
    help_category_overrides: novel.help_category_overrides,
    story_journal: novel.story_journal,
    factions: novel.factions,
    secrets: novel.secrets,
    relationships: novel.relationships,
    gm_context: novel.gm_context,
    constraint_overrides: novel.constraint_overrides,
    synthesis_activated: novel.synthesis_activated,
    synthesis_module_enabled: novel.synthesis_module_enabled,
    player_synthesis: novel.player_synthesis,
    campaign_memory: novel.campaign_memory,
    notes: novel.notes,
    vows: novel.vows,
    checkpoints: novel.checkpoints,
    description: novel.description,
    genre: novel.genre,
    adventure_index: novel.adventure_index,
    adventure_scene_waypoint: novel.adventure_scene_waypoint,
    world: worldToJSON(novel.world),
    story_beats: novel.story_beats,
    pacing_counter: novel.pacing_counter,
    pacing_autonomy_fired: novel.pacing_autonomy_fired,
    scene_transition_count: novel.scene_transition_count,
    faction_autonomous_ticks: novel.faction_autonomous_ticks,
    npc_goal_suggestions: novel.npc_goal_suggestions,
    voice_corrections_this_session: novel.voice_corrections_this_session,
    auto_record: novel.auto_record,
    session_no_mutation_windows: novel.session_no_mutation_windows,
    state_regression: novel.state_regression,
    last_mutation_at: novel.last_mutation_at,
    mutation_counts_by_group: novel.mutation_counts_by_group,
    uncommitted_rolls: novel.uncommitted_rolls,
    metadata: novel.metadata,
  };
}

// Snapshot-clone serialization: identical to novelToJSON but omits the
// undo/redo stacks. Stacks are internal bookkeeping; embedding them in a
// snapshot would recursively capture every prior snapshot, causing
// exponential growth (see snapshot/undo/redo).
function novelToSnapshotJSON(novel: NovelState): any {
  const base = novelToJSON(novel);
  delete base.undo_stacks;
  delete base.redo_stacks;
  return base;
}

// Cheap size estimate for the undo/redo stack health guard in saveNovel.
function estimateJsonBytes(value: unknown): number {
  try {
    return JSON.stringify(value).length;
  } catch {
    return Number.MAX_SAFE_INTEGER;
  }
}

function novelFromJSON(data: any): NovelState {
  data = migrateNovelData(data);
  return {
    slug: data.slug,
    name: data.name,
    ruleset: data.ruleset ?? null,
    badge: data.badge,
    entities: new Map(Object.entries(data.entities ?? {})),
    active_entity_id: data.active_entity_id ?? null,
    npcs: new Map(Object.entries(data.npcs ?? {})),
    scene_description: data.scene_description ?? "",
    scene_location: data.scene_location,
    scene_time_of_day: data.scene_time_of_day,
    scene_atmosphere: data.scene_atmosphere,
    scene_history: data.scene_history ?? [],
    scene_beat: data.scene_beat ?? "",
    scene_type: normalizeSceneType(data.scene_type),
    narrative_directive: data.narrative_directive ?? "",
    combat: data.combat ?? null,
    countdowns: new Map(Object.entries(data.countdowns ?? {})),
    lore: new Map(Object.entries(data.lore ?? {})),
    briefing_assembly_count: data.briefing_assembly_count ?? 0,
    player_signals: data.player_signals ?? {},
    adventure_slug: data.adventure_slug ?? null,
    generated_adventure: data.generated_adventure ?? null,
    audit_log: data.audit_log ?? [],
    undo_stacks: {
      player: data.undo_stacks?.player ?? [],
      game_master: data.undo_stacks?.game_master ?? [],
      observer: data.undo_stacks?.observer ?? [],
      none: data.undo_stacks?.none ?? data.undo_stacks?.null ?? [],
    },
    redo_stacks: {
      player: data.redo_stacks?.player ?? [],
      game_master: data.redo_stacks?.game_master ?? [],
      observer: data.redo_stacks?.observer ?? [],
      none: data.redo_stacks?.none ?? data.redo_stacks?.null ?? [],
    },
    briefing_order: data.briefing_order ?? [],
    action_patterns_enabled: data.action_patterns_enabled ?? false,
    session_zero_completed: data.session_zero_completed ?? false,
    characters_present: data.characters_present ?? false,
    characters_present_ids: data.characters_present_ids ?? [],
    adventure_set: data.adventure_set ?? false,
    pending_workflow: data.pending_workflow ?? null,
    connection_counter: data.connection_counter ?? 0,
    pending_staleness_counter: data.pending_staleness_counter ?? 0,
    pov_mode: data.pov_mode ?? "character",
    autonomy: normalizeAutonomy(data.autonomy),
    help_category_overrides: data.help_category_overrides ?? {},
    story_journal: data.story_journal ?? [],
    factions: data.factions ?? [],
    secrets: data.secrets ?? [],
    relationships: data.relationships ?? [],
    gm_context: data.gm_context ?? {},
    constraint_overrides: data.constraint_overrides ?? [],
    synthesis_activated: data.synthesis_activated ?? {},
    synthesis_module_enabled: data.synthesis_module_enabled ?? {},
    campaign_memory: data.campaign_memory ?? [],
    player_synthesis: data.player_synthesis ?? {},
    notes: data.notes ?? [],
    vows: data.vows ?? [],
    checkpoints: data.checkpoints ?? [],
    description: data.description ?? "",
    genre: data.genre ?? "",
    adventure_index: data.adventure_index ?? null,
    adventure_scene_waypoint: data.adventure_scene_waypoint ?? null,
    world: worldFromJSON(data.world),
    story_beats: data.story_beats ?? [],
    pacing_counter: data.pacing_counter ?? 0,
    pacing_autonomy_fired: data.pacing_autonomy_fired ?? false,
    scene_transition_count: data.scene_transition_count ?? 0,
    faction_autonomous_ticks: data.faction_autonomous_ticks ?? {},
    npc_goal_suggestions: data.npc_goal_suggestions ?? [],
voice_corrections_this_session: data.voice_corrections_this_session ?? 0,
      auto_record: data.auto_record ?? true,
      session_no_mutation_windows: data.session_no_mutation_windows ?? [],
      state_regression: data.state_regression ?? null,
      last_mutation_at: data.last_mutation_at ?? null,
      mutation_counts_by_group: data.mutation_counts_by_group ?? {},
      uncommitted_rolls: data.uncommitted_rolls ?? [],
      metadata: { ...(data.metadata ?? {}), sessions: data.metadata?.sessions ?? [] },
    active_session_id: data.active_session_id ?? null,
    pending_vow_countdown_suggestion: data.pending_vow_countdown_suggestion ?? null,
    codex_sources: data.codex_sources ?? [],
  };
}

// Serialize a Novel to its full interchange form (REQ-096). Returns the flat
// serialization used on disk — including actual world rooms/things, entities,
// npcs, countdowns, audit log, checkpoints, notes, and vows — so that
// export → import → export is byte-identical after a no-op import.
export function exportNovelJSON(novel: NovelState): any {
  return novelToJSON(novel);
}

// Reconstruct a NovelState from interchange data. Mirrors the on-disk load
// path so an exported payload round-trips through import without loss.
export function importNovelJSON(data: any): NovelState {
  return novelFromJSON(data);
}

// Overwrite every Novel-tier field of `target` with the values from `source`.
// Used by undo/redo (existing) and workflow-snapshot restore (REQ-042b), which
// must cover all Novel property groups, not a subset. Undo/redo stacks are
// deliberately NOT touched here — they are internal bookkeeping, preserved
// across a workflow-cancel restore (REQ-041: workflows are independent of undo).
export function applyNovelState(target: NovelState, source: NovelState): void {
  target.slug = source.slug;
  target.name = source.name;
  target.ruleset = source.ruleset;
  target.badge = source.badge;
  target.entities = source.entities;
  target.active_entity_id = source.active_entity_id;
  target.npcs = source.npcs;
  target.scene_description = source.scene_description;
  target.scene_location = source.scene_location;
  target.scene_time_of_day = source.scene_time_of_day;
  target.scene_atmosphere = source.scene_atmosphere;
  target.scene_history = source.scene_history;
  target.scene_beat = source.scene_beat;
  target.scene_type = source.scene_type;
  target.narrative_directive = source.narrative_directive;
  target.combat = source.combat;
  target.countdowns = source.countdowns;
  target.lore = source.lore;
  target.briefing_assembly_count = source.briefing_assembly_count;
  target.player_signals = source.player_signals;
  target.adventure_slug = source.adventure_slug;
  target.generated_adventure = source.generated_adventure;
  target.briefing_order = source.briefing_order;
  target.action_patterns_enabled = source.action_patterns_enabled;
  target.session_zero_completed = source.session_zero_completed;
  target.characters_present = source.characters_present;
  target.characters_present_ids = source.characters_present_ids;
  target.adventure_set = source.adventure_set;
  target.pending_workflow = source.pending_workflow;
  target.pov_mode = source.pov_mode;
  target.autonomy = source.autonomy;
  target.help_category_overrides = source.help_category_overrides;
  target.story_journal = source.story_journal;
  target.factions = source.factions;
  target.secrets = source.secrets;
  target.relationships = source.relationships;
  target.gm_context = source.gm_context;
  target.constraint_overrides = source.constraint_overrides;
  target.synthesis_activated = source.synthesis_activated;
  target.synthesis_module_enabled = source.synthesis_module_enabled;
  target.notes = source.notes;
  target.vows = source.vows;
  target.checkpoints = source.checkpoints;
  target.description = source.description;
  target.genre = source.genre;
  target.adventure_index = source.adventure_index;
  target.adventure_scene_waypoint = source.adventure_scene_waypoint;
  target.world = source.world;
  target.story_beats = source.story_beats;
  target.pacing_counter = source.pacing_counter;
  target.pacing_autonomy_fired = source.pacing_autonomy_fired;
  target.scene_transition_count = source.scene_transition_count;
  target.faction_autonomous_ticks = source.faction_autonomous_ticks;
  target.npc_goal_suggestions = source.npc_goal_suggestions;
  target.voice_corrections_this_session = source.voice_corrections_this_session;
  target.auto_record = source.auto_record;
  target.session_no_mutation_windows = source.session_no_mutation_windows;
  target.state_regression = source.state_regression;
  target.last_mutation_at = source.last_mutation_at;
  target.mutation_counts_by_group = source.mutation_counts_by_group;
  target.uncommitted_rolls = source.uncommitted_rolls;
  target.metadata = source.metadata;
}
