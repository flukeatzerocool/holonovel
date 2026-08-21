// State Manager — Novels, Roster, NPCs, World Model, Snapshots, Audit, Badge Gating, Persistence
// REQ-040, REQ-041, REQ-043, REQ-055, REQ-065, REQ-073, REQ-074, REQ-075,
// REQ-076, REQ-077, REQ-079, REQ-081, REQ-082, REQ-083, REQ-084,
// REQ-088, REQ-089, REQ-090, REQ-091, REQ-092, REQ-093, REQ-095, REQ-096,
// REQ-097, REQ-116, REQ-195, REQ-198, REQ-199, REQ-218, REQ-219,
// REQ-232, REQ-233, REQ-234, REQ-236, REQ-238, REQ-239, REQ-240,
// REQ-241, REQ-242, REQ-246, REQ-256, REQ-257, REQ-258, REQ-285, REQ-289

import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import { WorldModel, WorldRoom, WorldThing, Direction, createEmptyWorldModel, oppositeDirection } from "../world/model.js";

const SPEC_VERSION: string = JSON.parse(
  fs.readFileSync(new URL("../../package.json", import.meta.url), "utf-8")
).version;

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
}

export interface NpcState {
  id: string;
  name: string;
  description?: string;
  disposition?: string;
  location?: string;
  personality?: { description?: string; voice?: string; background?: string; goals?: string };
  voice_examples?: { context: string; dialogue: string; tag?: string }[];
  conditions: string[];
  condition_rounds: Record<string, number>;
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
}

export interface SecretState {
  key: string;
  content: string;
  triggers: string[];
  badge_scope: "game_master" | "shared";
  known_by: string[];
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
  scene_history: { timestamp: string; description: string; location?: string; time_of_day?: string; atmosphere?: string }[];
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
    | { decision: string; snapshot: any }
    | { decision: string; snapshot: any; creation?: import("./character-creation.js").CreationWorkflowState }
    | null;
  connection_counter: number;
  pending_staleness_counter: number;
  pov_mode: "character" | "omniscient";
  help_category_overrides: Record<string, string>;
  story_journal: StoryEntry[];
  factions: FactionState[];
  secrets: SecretState[];
  relationships: Relationship[];
  gm_context: GMContext;
  constraint_overrides: { type: string; name?: string; source?: string; prerequisites?: string[]; slots_remaining?: number; match_all?: boolean }[];
  synthesis_activated: Record<string, number>;
  synthesis_module_enabled: Record<string, boolean>;
  notes: NoteEntry[];
  vows: VowState[];
  checkpoints: Checkpoint[];
  description: string;
  genre: string;
  adventure_index: { npcs: Array<{ name: string; description?: string }>; locations: Array<{ name: string; description: string }>; factions: Array<{ name: string; goals?: string }>; premise: string; hooks: string[] } | null;
  adventure_scene_waypoint: { anchor: string; description: string } | null;
  // World-model tier
  world: WorldModel;
  metadata: {
    created: string;
    modified: string;
    session_count: number;
    total_combat_rounds: number;
    last_scene_anchor: string;
  };
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
  serverNotes: Map<string, string> = new Map();
  codex: Map<string, CodexEntry> = new Map();

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
      help_category_overrides: {},
      story_journal: [],
      factions: [],
      secrets: [],
      relationships: [],
      gm_context: {},
      constraint_overrides: [],
      synthesis_activated: {},
      synthesis_module_enabled: {},
      notes: [],
      vows: [],
      checkpoints: [],
      description: "",
      genre: "",
      adventure_index: null,
      adventure_scene_waypoint: null,
      world: createEmptyWorldModel(),
      metadata: {
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        session_count: 0,
        total_combat_rounds: 0,
        last_scene_anchor: "",
      },
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

  resumeNovel(slug: string): NovelState {
    const filePath = path.join(this.stateDir, "novels", `${slug}.json`);
    if (!fs.existsSync(filePath)) throw new Error(`[STATE_CONFLICT] Novel '${slug}' does not exist on disk.`);

    const raw = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(raw);

    if (data._checksum) {
      const payload = { ...data };
      delete (payload as any)._checksum;
      const computed = crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");
      if (computed !== data._checksum) {
        const bakPath = filePath + ".bak";
        if (fs.existsSync(bakPath)) {
          const bakRaw = fs.readFileSync(bakPath, "utf-8");
          const bakData = JSON.parse(bakRaw);
          const loaded = this.loadNovelFromData(bakData);
          this.novels.set(slug, loaded);
          this.activeNovelId = slug;
          this.audit(loaded, loaded.badge, "resume_novel", { slug, restored_from_backup: true });
          return loaded;
        }
        throw new Error(`[STATE_CONFLICT] Novel '${slug}' is corrupted (checksum mismatch).`);
      }
    }

    const novel = this.loadNovelFromData(data);
    this.novels.set(slug, novel);
    this.activeNovelId = slug;
    this.audit(novel, novel.badge, "resume_novel", { slug });
    return novel;
  }

  private loadNovelFromData(data: any): NovelState {
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
      help_category_overrides: data.help_category_overrides ?? {},
      story_journal: data.story_journal ?? [],
      factions: data.factions ?? [],
      secrets: data.secrets ?? [],
      relationships: data.relationships ?? [],
      gm_context: data.gm_context ?? {},
      constraint_overrides: data.constraint_overrides ?? [],
      synthesis_activated: data.synthesis_activated ?? {},
      synthesis_module_enabled: data.synthesis_module_enabled ?? {},
      notes: data.notes ?? [],
      vows: data.vows ?? [],
      checkpoints: data.checkpoints ?? [],
      description: data.description ?? "",
      genre: data.genre ?? "",
      adventure_index: data.adventure_index ?? null,
      adventure_scene_waypoint: data.adventure_scene_waypoint ?? null,
      world: worldFromJSON(data.world),
      metadata: data.metadata ?? {
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        session_count: 0,
        total_combat_rounds: 0,
        last_scene_anchor: "",
      },
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

  endNovel(novel: NovelState, dispose: "yes" | "cancel"): { removed: boolean } {
    if (dispose === "cancel") return { removed: false };
    const trashDir = path.join(this.stateDir, ".trash");
    fs.mkdirSync(trashDir, { recursive: true });
    const novelFile = path.join(this.stateDir, "novels", `${novel.slug}.json`);
    const bakFile = novelFile + ".bak";
    if (fs.existsSync(novelFile)) {
      fs.renameSync(novelFile, path.join(trashDir, `${novel.slug}-${Date.now()}.json`));
    }
    if (fs.existsSync(bakFile)) {
      fs.renameSync(bakFile, path.join(trashDir, `${novel.slug}-${Date.now()}.json.bak`));
    }
    this.novels.delete(novel.slug);
    if (this.activeNovelId === novel.slug) {
      this.activeNovelId = null;
    }
    return { removed: true };
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
    novel.entities = restored.entities;
    novel.active_entity_id = restored.active_entity_id;
    novel.npcs = restored.npcs;
    novel.scene_description = restored.scene_description;
    novel.scene_location = restored.scene_location;
    novel.scene_time_of_day = restored.scene_time_of_day;
    novel.scene_atmosphere = restored.scene_atmosphere;
    novel.scene_history = restored.scene_history;
    novel.scene_type = restored.scene_type;
    novel.narrative_directive = restored.narrative_directive;
    novel.combat = restored.combat;
    novel.countdowns = restored.countdowns;
    novel.lore = restored.lore;
    novel.badge = restored.badge;
    novel.player_signals = restored.player_signals;
    novel.briefing_assembly_count = restored.briefing_assembly_count;
    novel.story_journal = restored.story_journal;
    novel.factions = restored.factions;
    novel.secrets = restored.secrets;
    novel.relationships = restored.relationships;
    novel.gm_context = restored.gm_context;
    novel.notes = restored.notes;
    novel.vows = restored.vows;
    novel.checkpoints = restored.checkpoints;
    novel.world = restored.world;
    novel.metadata = restored.metadata;
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
    novel.entities = restored.entities;
    novel.active_entity_id = restored.active_entity_id;
    novel.npcs = restored.npcs;
    novel.scene_description = restored.scene_description;
    novel.scene_location = restored.scene_location;
    novel.scene_time_of_day = restored.scene_time_of_day;
    novel.scene_atmosphere = restored.scene_atmosphere;
    novel.scene_history = restored.scene_history;
    novel.scene_type = restored.scene_type;
    novel.narrative_directive = restored.narrative_directive;
    novel.combat = restored.combat;
    novel.countdowns = restored.countdowns;
    novel.lore = restored.lore;
    novel.badge = restored.badge;
    novel.player_signals = restored.player_signals;
    novel.briefing_assembly_count = restored.briefing_assembly_count;
    novel.story_journal = restored.story_journal;
    novel.factions = restored.factions;
    novel.secrets = restored.secrets;
    novel.relationships = restored.relationships;
    novel.gm_context = restored.gm_context;
    novel.notes = restored.notes;
    novel.vows = restored.vows;
    novel.checkpoints = restored.checkpoints;
    novel.world = restored.world;
    novel.metadata = restored.metadata;
    this.saveNovel(novel);
    return { data: restore };
  }

  // ── Audit ─────────────────────────────────────────────────────

  audit(novel: NovelState, badge: Badge, tool: string, args: any, output_prefix?: string): void {
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
    const turn_order: string[] = [];
    // Simple ordering: entities first, then dangers — no initiative rolling in ruleset-free mode
    for (const pid of participants) {
      if (!turn_order.includes(pid)) turn_order.push(pid);
    }
    for (const d of dangers) {
      if (!turn_order.includes(d.name)) turn_order.push(d.name);
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

  saveNovel(novel: NovelState): void {
    const dir = path.join(this.stateDir, "novels");
    fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, `${novel.slug}.json`);
    const tmpPath = filePath + `.${process.pid}-${Date.now()}.tmp`;
    const bakPath = filePath + ".bak";

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
    payload._checksum = crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");

    const out = JSON.stringify(payload, null, 2);
    if (fs.existsSync(filePath)) {
      fs.copyFileSync(filePath, bakPath);
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
    fs.writeFileSync(path.join(dir, "roster.json"), JSON.stringify(rosterData, null, 2), "utf-8");
  }

  loadRoster(): void {
    const filePath = path.join(this.stateDir, "roster.json");
    if (!fs.existsSync(filePath)) return;
    const raw = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(raw);
    for (const [id, entity] of Object.entries(data)) {
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
      for (const [key, content] of Object.entries(data)) {
        this.serverNotes.set(key, content as string);
      }
    } catch { /* ignore corrupt */ }
  }

  saveServerNotes(): void {
    fs.mkdirSync(this.stateDir, { recursive: true });
    fs.writeFileSync(
      path.join(this.stateDir, "server-notes.json"),
      JSON.stringify(Object.fromEntries(this.serverNotes), null, 2),
      "utf-8",
    );
  }

  loadCodex(): void {
    const filePath = path.join(this.stateDir, "codex.json");
    if (!fs.existsSync(filePath)) return;
    try {
      const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      for (const [id, entry] of Object.entries(data)) {
        this.codex.set(id, entry as CodexEntry);
      }
    } catch { /* ignore corrupt */ }
  }

  saveCodex(): void {
    fs.mkdirSync(this.stateDir, { recursive: true });
    fs.writeFileSync(
      path.join(this.stateDir, "codex.json"),
      JSON.stringify(Object.fromEntries(this.codex), null, 2),
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
    help_category_overrides: novel.help_category_overrides,
    story_journal: novel.story_journal,
    factions: novel.factions,
    secrets: novel.secrets,
    relationships: novel.relationships,
    gm_context: novel.gm_context,
    constraint_overrides: novel.constraint_overrides,
    synthesis_activated: novel.synthesis_activated,
    synthesis_module_enabled: novel.synthesis_module_enabled,
    notes: novel.notes,
    vows: novel.vows,
    checkpoints: novel.checkpoints,
    description: novel.description,
    genre: novel.genre,
    adventure_index: novel.adventure_index,
    adventure_scene_waypoint: novel.adventure_scene_waypoint,
    world: worldToJSON(novel.world),
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
    help_category_overrides: data.help_category_overrides ?? {},
    story_journal: data.story_journal ?? [],
    factions: data.factions ?? [],
    secrets: data.secrets ?? [],
    relationships: data.relationships ?? [],
    gm_context: data.gm_context ?? {},
    constraint_overrides: data.constraint_overrides ?? [],
    synthesis_activated: data.synthesis_activated ?? {},
    synthesis_module_enabled: data.synthesis_module_enabled ?? {},
    notes: data.notes ?? [],
    vows: data.vows ?? [],
    checkpoints: data.checkpoints ?? [],
    description: data.description ?? "",
    genre: data.genre ?? "",
    adventure_index: data.adventure_index ?? null,
    adventure_scene_waypoint: data.adventure_scene_waypoint ?? null,
    world: worldFromJSON(data.world),
    metadata: data.metadata ?? {
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      session_count: 0,
      total_combat_rounds: 0,
      last_scene_anchor: "",
    },
  };
}
