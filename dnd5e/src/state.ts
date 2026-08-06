// State Manager — Novels, Roster, NPCs, Snapshots, Audit, Hat Gating, Persistence
// REQ-040, REQ-041, REQ-043, REQ-055, REQ-065, REQ-073, REQ-074, REQ-075,
// REQ-076, REQ-077, REQ-079, REQ-081, REQ-082, REQ-083, REQ-084,
// REQ-088, REQ-089, REQ-090, REQ-091, REQ-092, REQ-093, REQ-095, REQ-096,
// REQ-097, REQ-116

import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import { seed, snapshotSeed, getState } from "./dice.js";
import { RACES, CLASSES } from "./data.js";
import { abilityModifier } from "./dice.js";

const SPEC_VERSION: string = JSON.parse(
  fs.readFileSync(new URL("../package.json", import.meta.url), "utf-8")
).version;

// ── Types ──────────────────────────────────────────────────────────

export type Hat = "player" | "game_master" | null;

export interface NovelEntity {
  id: string;
  name: string;
  race: string;
  class_name: string;
  level: number;
  background: string;
  stats: Record<string, number>;
  hp: number;
  max_hp: number;
  temp_hp: number;
  ac: number;
  speed: number;
  initiative: number;
  conditions: string[];
  hit_dice: { total: number; remaining: number; die: number };
  proficiencies: { armor: string[]; weapons: string[]; tools: string[]; saves: string[]; skills: string[] };
  features: string[];
  personality?: { description?: string; voice?: string; background?: string; goals?: string };
  voice_examples?: { context: string; dialogue: string; tag?: string }[];
}

export interface NpcState {
  id: string;
  name: string;
  description?: string;
  disposition?: string;
  location?: string;
  ac?: number;
  hp?: number;
  max_hp?: number;
  speed?: number;
  conditions?: string[];
  stats?: Record<string, number>;
}

export interface LoreEntry {
  key: string;
  content: string;
  triggers: string[];
  hat_scope: "game_master" | "shared";
  priority: number;
  sticky: number;
  enabled: boolean;
  group?: string;
}

export interface Countdown {
  name: string;
  ticks: number;
  total: number;
  type: "round" | "narrative";
}

export interface CombatState {
  participants: string[];
  dangers: { name: string; ac: number; hp: number; max_hp: number; initiative_bonus?: number }[];
  round: number;
  turn_order: string[];
  current_turn: number;
  active: boolean;
}

export interface AuditEntry {
  timestamp: string;
  hat: Hat;
  tool: string;
  args: string;
  output_prefix: string;
  hash: string;
}

export interface NovelState {
  slug: string;
  name: string;
  hat: Hat;
  entities: Map<string, NovelEntity>;
  active_entity_id: string | null;
  npcs: Map<string, NpcState>;
  scene_description: string;
  scene_history: { timestamp: string; description: string }[];
  scene_type: "combat" | "social" | "exploration" | "neutral";
  narrative_directive: string;
  combat: CombatState | null;
  countdowns: Map<string, Countdown>;
  lore: Map<string, LoreEntry>;
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
  adventure_set: boolean;
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

// ── State Manager ──────────────────────────────────────────────────

export class StateManager {
  novels = new Map<string, NovelState>();
  roster = new Map<string, RosterEntity>();
  activeNovelId: string | null = null;

  buildFingerprint: {
    specVersion: string;
    specRepoUrl: string;
    rulesetHash: string;
    buildTimestamp: string;
    lastSpecReview?: string;
    lastGauntlet?: string;
  };

  enriched = false;
  enrichmentManifest: any = null;

  private npcCounter = 0;
  private entityCounter = 0;
  private stateDir: string;

  constructor(stateDir: string) {
    this.stateDir = stateDir;
    this.buildFingerprint = {
      specVersion: SPEC_VERSION,
      specRepoUrl: "https://github.com/anomalyco/Holonovel",
      rulesetHash: this.computeRulesetHash() ?? "unknown",
      buildTimestamp: new Date().toISOString(),
    };
  }

  private computeRulesetHash(): string {
    try {
      const rulesetDir = path.join(process.cwd(), "ruleset");
      if (!fs.existsSync(rulesetDir)) return crypto.randomBytes(8).toString("hex");
      const files = walkDir(rulesetDir, ".md");
      files.sort();
      const hash = crypto.createHash("sha256");
      for (const file of files) {
        hash.update(fs.readFileSync(file));
      }
      return hash.digest("hex").substring(0, 16);
    } catch {
      return "unknown";
    }
  }

  get activeNovel(): NovelState | undefined {
    return this.activeNovelId ? this.novels.get(this.activeNovelId) : undefined;
  }

  // ── Hat Gating ────────────────────────────────────────────────

  requireGM(hat: Hat): void {
    if (hat === "player") throw new Error("[FORBIDDEN] This tool is Game Master only. Use set_hat to switch.");
  }

  requirePlayer(hat: Hat): void {
    if (hat === "game_master") throw new Error("[FORBIDDEN] This tool is Player only. Use set_hat to switch.");
  }

  requireNovel(): NovelState {
    const novel = this.activeNovel;
    if (!novel) throw new Error("[STATE_CONFLICT] No active Novel. Create or resume one first.");
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
    if (!id) throw new Error("[INVALID_INPUT] No entity_id provided and no active entity set.");
    const entity = novel.entities.get(id);
    if (!entity) throw new Error(`[NOT_FOUND] Entity '${id}' not found.`);
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

  createNovel(name: string): NovelState {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    if (this.novels.has(slug)) throw new Error(`[STATE_CONFLICT] Novel '${slug}' already exists.`);

    const novel: NovelState = {
      slug,
      name,
      hat: null,
      entities: new Map(),
      active_entity_id: null,
      npcs: new Map(),
      scene_description: "",
      scene_history: [],
      scene_type: "neutral",
      narrative_directive: "",
      combat: null,
      countdowns: new Map(),
      lore: new Map(),
      player_signals: {},
      adventure_slug: null,
      generated_adventure: null,
      audit_log: [],
      undo_stacks: { player: [], game_master: [], null: [] },
      redo_stacks: { player: [], game_master: [], null: [] },
      briefing_order: [],
      action_patterns_enabled: false,
      session_zero_completed: false,
      characters_present: false,
      adventure_set: false,
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
    this.audit(novel, null, "create_novel", { name });
    this.saveNovel(novel);
    return novel;
  }

  resumeNovel(slug: string): NovelState {
    const filePath = path.join(this.stateDir, "novels", `${slug}.json`);
    if (!fs.existsSync(filePath)) throw new Error(`[STATE_CONFLICT] Novel '${slug}' does not exist on disk.`);

    const raw = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(raw);

    // Checksum verification (REQ-092)
    if (data._checksum) {
      const payload = { ...data };
      delete (payload as any)._checksum;
      const computed = crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");
      if (computed !== data._checksum) {
        // Try backup restore
        const bakPath = filePath + ".bak";
        if (fs.existsSync(bakPath)) {
          const bakRaw = fs.readFileSync(bakPath, "utf-8");
          const bakData = JSON.parse(bakRaw);
          const loaded = this.loadNovelFromData(bakData);
          this.novels.set(slug, loaded);
          this.activeNovelId = slug;
          this.audit(loaded, null, "resume_novel", { slug, restored_from_backup: true });
          return loaded;
        }
        throw new Error(`[STATE_CONFLICT] Novel '${slug}' is corrupted (checksum mismatch).`);
      }
    }

    const novel = this.loadNovelFromData(data);
    this.novels.set(slug, novel);
    this.activeNovelId = slug;
    this.audit(novel, null, "resume_novel", { slug });
    return novel;
  }

  private loadNovelFromData(data: any): NovelState {
    const novel: NovelState = {
      slug: data.slug,
      name: data.name,
      hat: data.hat ?? null,
      entities: new Map(Object.entries(data.entities ?? {}) as any),
      active_entity_id: data.active_entity_id ?? null,
      npcs: new Map(Object.entries(data.npcs ?? {}) as any),
      scene_description: data.scene_description ?? "",
      scene_history: data.scene_history ?? [],
      scene_type: data.scene_type ?? "neutral",
      narrative_directive: data.narrative_directive ?? "",
      combat: data.combat ?? null,
      countdowns: new Map(Object.entries(data.countdowns ?? {}) as any),
      lore: new Map(Object.entries(data.lore ?? {}) as any),
      player_signals: data.player_signals ?? {},
      adventure_slug: data.adventure_slug ?? null,
      generated_adventure: data.generated_adventure ?? null,
      audit_log: data.audit_log ?? [],
      undo_stacks: { player: data.undo_stacks?.player ?? [], game_master: data.undo_stacks?.game_master ?? [], null: data.undo_stacks?.null ?? [] },
      redo_stacks: { player: data.redo_stacks?.player ?? [], game_master: data.redo_stacks?.game_master ?? [], null: data.redo_stacks?.null ?? [] },
      briefing_order: data.briefing_order ?? [],
      action_patterns_enabled: data.action_patterns_enabled ?? false,
      session_zero_completed: data.session_zero_completed ?? false,
      characters_present: data.characters_present ?? false,
      adventure_set: data.adventure_set ?? false,
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

    // Move to trash (REQ-117)
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

  // ── Snapshots, Undo, Redo ─────────────────────────────────────

  snapshot(novel: NovelState, hat: Hat): void {
    const clone = JSON.parse(JSON.stringify(novelToJSON(novel)));
    const stackKey = hat ?? "null";
    novel.undo_stacks[stackKey].push(clone);
    if (novel.undo_stacks[stackKey].length > 10) {
      novel.undo_stacks[stackKey].shift();
    }
    novel.redo_stacks[stackKey] = [];
  }

  undo(novel: NovelState, hat: Hat): { data: any } | null {
    const stackKey = hat ?? "null";
    const stack = novel.undo_stacks[stackKey];
    if (stack.length === 0) throw new Error("[STATE_CONFLICT] Nothing to undo.");

    const current = JSON.parse(JSON.stringify(novelToJSON(novel)));
    novel.redo_stacks[stackKey].push(current);

    const restore = stack.pop()!;
    const restored = novelFromJSON(restore);
    // Apply restored state fields back into novel
    novel.entities = restored.entities;
    novel.active_entity_id = restored.active_entity_id;
    novel.npcs = restored.npcs;
    novel.scene_description = restored.scene_description;
    novel.scene_history = restored.scene_history;
    novel.scene_type = restored.scene_type;
    novel.narrative_directive = restored.narrative_directive;
    novel.combat = restored.combat;
    novel.countdowns = restored.countdowns;
    novel.lore = restored.lore;
    novel.hat = restored.hat;
    novel.player_signals = restored.player_signals;
    novel.metadata = restored.metadata;
    this.saveNovel(novel);
    return { data: restore };
  }

  redo(novel: NovelState, hat: Hat): { data: any } | null {
    const stackKey = hat ?? "null";
    const stack = novel.redo_stacks[stackKey];
    if (stack.length === 0) throw new Error("[STATE_CONFLICT] Nothing to redo.");

    const current = JSON.parse(JSON.stringify(novelToJSON(novel)));
    novel.undo_stacks[stackKey].push(current);

    const restore = stack.pop()!;
    const restored = novelFromJSON(restore);
    novel.entities = restored.entities;
    novel.active_entity_id = restored.active_entity_id;
    novel.npcs = restored.npcs;
    novel.scene_description = restored.scene_description;
    novel.scene_history = restored.scene_history;
    novel.scene_type = restored.scene_type;
    novel.narrative_directive = restored.narrative_directive;
    novel.combat = restored.combat;
    novel.countdowns = restored.countdowns;
    novel.lore = restored.lore;
    novel.hat = restored.hat;
    novel.player_signals = restored.player_signals;
    novel.metadata = restored.metadata;
    this.saveNovel(novel);
    return { data: restore };
  }

  // ── Audit ─────────────────────────────────────────────────────

  audit(novel: NovelState, hat: Hat, tool: string, args: any, output_prefix?: string): void {
    const prevHash = novel.audit_log.length > 0 ? novel.audit_log[novel.audit_log.length - 1].hash : "00000000";
    const entry: AuditEntry = {
      timestamp: new Date().toISOString(),
      hat,
      tool,
      args: JSON.stringify(args),
      output_prefix: output_prefix ?? "",
      hash: crypto.createHash("sha256").update(prevHash + tool + JSON.stringify(args)).digest("hex").substring(0, 8),
    };
    novel.audit_log.push(entry);
  }

  // ── Combat ────────────────────────────────────────────────────

  initCombat(novel: NovelState, participants: string[], dangers: { name: string; ac: number; hp: number; max_hp?: number; initiative_bonus?: number }[]): CombatState {
    const turn_order: string[] = [];
    const initiative: [string, number][] = [];

    for (const pid of participants) {
      const entity = novel.entities.get(pid);
      const init = entity ? entity.initiative : 10;
      initiative.push([pid, init]);
    }
    for (const d of dangers) {
      const bonus = d.initiative_bonus ?? 0;
      const roll = Math.floor(Math.random() * 20) + 1 + bonus;
      initiative.push([d.name, roll]);
    }

    // Resolve ties: entity > NPC > danger, then alphabetically
    initiative.sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      const aIsEntity = novel.entities.has(a[0]);
      const bIsEntity = novel.entities.has(b[0]);
      const aIsDanger = dangers.some(d => d.name === a[0]);
      const bIsDanger = dangers.some(d => d.name === b[0]);
      if (aIsEntity && !bIsEntity) return -1;
      if (!aIsEntity && bIsEntity) return 1;
      if (aIsDanger && !bIsDanger) return 1;
      if (!aIsDanger && bIsDanger) return -1;
      return a[0].localeCompare(b[0]);
    });

    for (const [name] of initiative) {
      turn_order.push(name);
    }

    const combat: CombatState = {
      participants,
      dangers: dangers.map(d => ({ ...d, hp: d.max_hp ?? d.hp, max_hp: d.max_hp ?? d.hp })),
      round: 1,
      turn_order,
      current_turn: 0,
      active: true,
    };
    novel.combat = combat;
    this.audit(novel, novel.hat, "init_combat", { participants, dangers });
    return combat;
  }

  advanceCombat(novel: NovelState): CombatState {
    if (!novel.combat || !novel.combat.active) throw new Error("[STATE_CONFLICT] No active combat.");

    const combat = novel.combat;
    combat.current_turn++;
    if (combat.current_turn >= combat.turn_order.length) {
      combat.current_turn = 0;
      combat.round++;
      novel.metadata.total_combat_rounds++;

      // Decrement round-based countdowns
      for (const [, cd] of novel.countdowns) {
        if (cd.type === "round") {
          cd.ticks--;
          if (cd.ticks <= 0) {
            this.audit(novel, novel.hat, "countdown_expired", { name: cd.name });
          }
        }
      }
    }
    this.audit(novel, novel.hat, "advance_combat", { round: combat.round, turn: combat.current_turn });
    return combat;
  }

  endCombat(novel: NovelState, outcome: string): void {
    if (!novel.combat) throw new Error("[STATE_CONFLICT] No active combat.");
    novel.combat.active = false;
    this.audit(novel, novel.hat, "end_combat", { outcome, rounds_played: novel.combat.round });
    novel.combat = null;
  }

  // ── Persistence ───────────────────────────────────────────────

  saveNovel(novel: NovelState): void {
    const dir = path.join(this.stateDir, "novels");
    fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, `${novel.slug}.json`);
    const tmpPath = filePath + ".tmp";
    const bakPath = filePath + ".bak";

    novel.metadata.modified = new Date().toISOString();

    const json = JSON.stringify(novelToJSON(novel));
    const payload: any = JSON.parse(json);
    payload._checksum = crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");

    const out = JSON.stringify(payload, null, 2);
    if (fs.existsSync(filePath)) {
      fs.copyFileSync(filePath, bakPath);
    }
    fs.writeFileSync(tmpPath, out, "utf-8");
    fs.renameSync(tmpPath, filePath);
  }

  saveRoster(): void {
    const dir = this.stateDir;
    fs.mkdirSync(dir, { recursive: true });
    const rosterData: Record<string, any> = {};
    for (const [id, entity] of this.roster) {
      rosterData[id] = { ...entity, personality: entity.personality, voice_examples: entity.voice_examples };
    }
    fs.writeFileSync(path.join(dir, "roster.json"), JSON.stringify(rosterData, null, 2), "utf-8");
  }

  loadRoster(): void {
    const filePath = path.join(this.stateDir, "roster.json");
    if (!fs.existsSync(filePath)) return;
    const raw = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(raw);
    for (const [id, entity] of Object.entries(data)) {
      this.roster.set(id, entity as RosterEntity);
    }
  }

  // ── Entity Factory ────────────────────────────────────────────

  createEntity(name: string, race: string, className: string, background: string, stats: Record<string, number>): NovelEntity {
    this.entityCounter++;
    const id = `character_${String(this.entityCounter).padStart(2, "0")}`;

    const raceKey = race.toLowerCase();
    const classKey = className.toLowerCase();

    if (!RACES[raceKey]) throw new Error(`[NOT_FOUND] Race '${race}' not found. Valid: ${Object.keys(RACES).join(", ")}`);
    if (!CLASSES[classKey]) throw new Error(`[NOT_FOUND] Class '${className}' not found. Valid: ${Object.keys(CLASSES).join(", ")}`);

    const raceData = RACES[raceKey];
    const classData = CLASSES[classKey];

    const conMod = abilityModifier(stats.constitution);
    const dexMod = abilityModifier(stats.dexterity);

    const entity: NovelEntity = {
      id,
      name,
      race: raceData.name,
      class_name: classData.name,
      level: 1,
      background,
      stats,
      max_hp: classData.hp_1st + conMod,
      hp: classData.hp_1st + conMod,
      temp_hp: 0,
      ac: computeAC(classData, stats),
      speed: raceData.speed,
      initiative: dexMod,
      conditions: [],
      hit_dice: { total: 1, remaining: 1, die: classData.hit_dice },
      proficiencies: {
        armor: classData.proficiencies.armor,
        weapons: classData.proficiencies.weapons,
        tools: classData.proficiencies.tools,
        saves: classData.proficiencies.saves,
        skills: classData.proficiencies.skills.slice(0, classData.skill_choices),
      },
      features: classData.features[1] ?? [],
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

// ── Helpers ─────────────────────────────────────────────────────────

function computeAC(classData: any, stats: Record<string, number>): number {
  const dexMod = Math.floor((stats.dexterity - 10) / 2);
  if (classData.name === "Barbarian") {
    const conMod = Math.floor((stats.constitution - 10) / 2);
    return 10 + dexMod + conMod;
  }
  if (classData.name === "Monk") {
    const wisMod = Math.floor((stats.wisdom - 10) / 2);
    return 10 + dexMod + wisMod;
  }
  if (classData.name === "Sorcerer" && classData.subclasses?.draconic) {
    return 13 + dexMod;
  }
  // Default leather-equivalent
  return 11 + dexMod;
}

function walkDir(dir: string, ext: string): string[] {
  const files: string[] = [];
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkDir(full, ext));
    } else if (entry.name.endsWith(ext)) {
      files.push(full);
    }
  }
  return files;
}

function novelToJSON(novel: NovelState): any {
  return {
    slug: novel.slug,
    name: novel.name,
    hat: novel.hat,
    entities: Object.fromEntries(novel.entities),
    active_entity_id: novel.active_entity_id,
    npcs: Object.fromEntries(novel.npcs),
    scene_description: novel.scene_description,
    scene_history: novel.scene_history,
    scene_type: novel.scene_type,
    narrative_directive: novel.narrative_directive,
    combat: novel.combat,
    countdowns: Object.fromEntries(novel.countdowns),
    lore: Object.fromEntries(novel.lore),
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
    adventure_set: novel.adventure_set,
    metadata: novel.metadata,
  };
}

function novelFromJSON(data: any): NovelState {
  return {
    slug: data.slug,
    name: data.name,
    hat: data.hat ?? null,
    entities: new Map(Object.entries(data.entities ?? {})),
    active_entity_id: data.active_entity_id ?? null,
    npcs: new Map(Object.entries(data.npcs ?? {})),
    scene_description: data.scene_description ?? "",
    scene_history: data.scene_history ?? [],
    scene_type: data.scene_type ?? "neutral",
    narrative_directive: data.narrative_directive ?? "",
    combat: data.combat ?? null,
    countdowns: new Map(Object.entries(data.countdowns ?? {})),
    lore: new Map(Object.entries(data.lore ?? {})),
    player_signals: data.player_signals ?? {},
    adventure_slug: data.adventure_slug ?? null,
    generated_adventure: data.generated_adventure ?? null,
    audit_log: data.audit_log ?? [],
    undo_stacks: { player: data.undo_stacks?.player ?? [], game_master: data.undo_stacks?.game_master ?? [], null: data.undo_stacks?.null ?? [] },
    redo_stacks: { player: data.redo_stacks?.player ?? [], game_master: data.redo_stacks?.game_master ?? [], null: data.redo_stacks?.null ?? [] },
    briefing_order: data.briefing_order ?? [],
    action_patterns_enabled: data.action_patterns_enabled ?? false,
    session_zero_completed: data.session_zero_completed ?? false,
    characters_present: data.characters_present ?? false,
    adventure_set: data.adventure_set ?? false,
    metadata: data.metadata ?? {
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      session_count: 0,
      total_combat_rounds: 0,
      last_scene_anchor: "",
    },
  };
}
