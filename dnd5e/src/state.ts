// State management: roster, game entities, NPCs, scene, countdowns, lore, enrichment, adventure, snapshots, audit log, persona
import { PRNG } from "./dice.js";
import { AbilityScore, CLASS_NAMES, ClassName } from "./data.js";
import * as fs from "node:fs";
import * as path from "node:path";

export interface DnDEntity {
  id: string;
  name: string;
  race: string;
  className: ClassName;
  level: number;
  stats: Record<AbilityScore, number>;
  maxHp: number;
  currentHp: number;
  tempHp: number;
  hitDice: { total: number; remaining: number; size: number };
  armorClass: number;
  speed: number;
  initiative: number;
  skills: string[];
  saveProficiencies: AbilityScore[];
  conditions: string[];
  inventory: string[];
  equippedWeapons: string[];
  equippedArmor: string;
  spellSlots: Record<number, { max: number; used: number }>;
  personality: Record<string, string>;
  description?: string;
  voice?: string;
  background?: string;
  goals?: string;
  voice_examples?: { context: string; dialogue: string; tag?: string }[];
}

export interface NPCEntity {
  id: string;
  name: string;
  stats: Partial<Record<AbilityScore, number>>;
  ac: number;
  hp: { max: number; current: number };
  speed: number;
  conditions: string[];
  description?: string;
  disposition?: string;
  location?: string;
}

export interface CombatParticipant {
  id: string;
  type: "entity" | "npc" | "danger";
  name: string;
  initiative: number;
  ac?: number;
  hp?: number;
}

export interface CombatState {
  active: boolean;
  round: number;
  participants: CombatParticipant[];
  turnIndex: number;
}

export interface AuditEntry {
  timestamp: string;
  persona: string;
  tool: string;
  args: Record<string, unknown>;
  result: string;
}

export interface CountdownState {
  name: string;
  ticks: number;
  total: number;
  type: "round" | "narrative";
  active: boolean;
}

export interface LoreEntry {
  key: string;
  content: string;
  triggers: string[];
  persona_scope: "game_master" | "shared";
}

export interface SceneState {
  description: string;
  type: "combat" | "social" | "exploration" | "neutral";
  history: { timestamp: string; description: string }[];
}

export interface EnrichmentRecord {
  source_url: string;
  quoted_excerpt: string;
  persona_scope: "game_master" | "shared" | "player";
  confidence: "HIGH" | "MEDIUM" | "LOW";
  output_module: "voice_examples" | "briefing_order" | "lore_templates" | "action_patterns" | "supplementary_guidance";
}

export interface AdventureState {
  slug: string;
  title: string;
  sections: { anchor: string; title: string; gm_only: boolean; content: string }[];
}

export interface BuildFingerprint {
  specVersion: string;
  buildTimestamp: string;
}

export interface GameState {
  entities: Record<string, DnDEntity>;
  npcs: Record<string, NPCEntity>;
  combat: CombatState | null;
  auditLog: AuditEntry[];
  scene: SceneState;
  countdowns: Record<string, CountdownState>;
  loreEntries: Record<string, LoreEntry>;
  enrichment: EnrichmentRecord[];
  activeAdventureId: string | null;
  narrativeDirective: string;
  briefingOrder: string[];
  activeEntityId: string | null;
  ended: boolean;
}

export interface Snapshot {
  timestamp: string;
  entities: Record<string, DnDEntity>;
  combat: CombatState | null;
  npcs: Record<string, NPCEntity>;
  scene: SceneState;
  countdowns: Record<string, CountdownState>;
  loreEntries: Record<string, LoreEntry>;
  activeEntityId: string | null;
}

export type Persona = "player" | "game_master";

export interface WorkflowState {
  persona: Persona | null;
  decisionQueue: { question: string; options: string[] }[];
  preWorkflowSnapshot: Snapshot | null;
  characterDraft: Partial<DnDEntity> | null;
}

function defaultScene(): SceneState {
  return { description: "", type: "neutral", history: [] };
}

function defaultGame(): GameState {
  return {
    entities: {},
    npcs: {},
    combat: null,
    auditLog: [],
    scene: defaultScene(),
    countdowns: {},
    loreEntries: {},
    enrichment: [],
    activeAdventureId: null,
    narrativeDirective: "",
    briefingOrder: [],
    activeEntityId: null,
    ended: false,
  };
}

export class StateManager {
  _roster: Record<string, DnDEntity> = {};
  _games: Record<string, GameState> = {};
  _activeGameId: string | null = null;
  public prng: PRNG;
  public sessionSeed: string | null = null;
  private personaStacks: Record<Persona, Snapshot[]> = { player: [], game_master: [] };
  public activePersona: Persona | null = null;
  public workflow: WorkflowState | null = null;
  public dataDir: string;
  public corruptStates: string[] = [];
  private entityCounter = 0;
  private npcCounter = 0;
  public buildFingerprint: BuildFingerprint = { specVersion: "1.2.0", buildTimestamp: new Date().toISOString() };
  public adventureModules: Record<string, AdventureState> = {};

  get activeGameId(): string | null { return this._activeGameId; }

  constructor(seed: string, dataDir: string) {
    this.prng = new PRNG(seed);
    this.dataDir = dataDir;
  }

  setPersona(p: Persona): void { this.activePersona = p; }

  deactivatePersona(): void { this.activePersona = null; }

  getPersonaSnapshots(): Snapshot[] {
    const p = this.activePersona ?? "game_master";
    return this.personaStacks[p] ?? this.personaStacks["game_master"];
  }

  getActiveGame(): GameState | null {
    if (!this._activeGameId) return null;
    const g = this._games[this._activeGameId] ?? null;
    if (g?.ended) return null;
    return g;
  }

  getOrCreateGame(gameId: string): GameState {
    this._activeGameId = gameId;
    if (!this._games[gameId]) {
      this._games[gameId] = defaultGame();
    }
    return this._games[gameId];
  }

  endGame(): void {
    if (!this._activeGameId) return;
    const g = this._games[this._activeGameId];
    if (g) {
      g.ended = true;
    }
    this.deactivatePersona();
    this.personaStacks = { player: [], game_master: [] };
  }

  snapshot(): void {
    const game = this.getActiveGame();
    if (!game) return;
    const snap: Snapshot = {
      timestamp: new Date().toISOString(),
      entities: JSON.parse(JSON.stringify(game.entities)),
      combat: game.combat ? JSON.parse(JSON.stringify(game.combat)) : null,
      npcs: JSON.parse(JSON.stringify(game.npcs)),
      scene: JSON.parse(JSON.stringify(game.scene)),
      countdowns: JSON.parse(JSON.stringify(game.countdowns)),
      loreEntries: JSON.parse(JSON.stringify(game.loreEntries)),
      activeEntityId: game.activeEntityId,
    };
    const p = this.activePersona ?? "game_master";
    if (!this.personaStacks[p]) this.personaStacks[p] = [];
    this.personaStacks[p].push(snap);
    if (this._activeGameId) this.saveState(this._activeGameId);
  }

  undo(): Snapshot | null {
    const p = this.activePersona ?? "game_master";
    const stack = this.personaStacks[p] ?? [];
    const game = this.getActiveGame();
    if (!game || stack.length === 0) return null;
    const snap = stack.pop()!;
    game.entities = snap.entities;
    game.combat = snap.combat;
    game.npcs = snap.npcs;
    game.scene = snap.scene;
    game.countdowns = snap.countdowns;
    game.loreEntries = snap.loreEntries;
    game.activeEntityId = snap.activeEntityId;
    return snap;
  }

  audit(persona: string, tool: string, args: Record<string, unknown>, result: string): void {
    const game = this.getActiveGame();
    if (!game) return;
    game.auditLog.push({
      timestamp: new Date().toISOString(),
      persona: persona || "none",
      tool,
      args,
      result,
    });
  }

  nextEntityId(): string { return `e${++this.entityCounter}`; }

  nextNpcId(): string {
    this.npcCounter++;
    return `npc${String(this.npcCounter).padStart(2, "0")}`;
  }

  addRoster(entity: DnDEntity): void {
    this._roster[entity.id] = JSON.parse(JSON.stringify(entity));
    this.saveRoster();
  }

  getRoster(id: string): DnDEntity | undefined { return this._roster[id]; }

  importCharacter(rosterId: string): DnDEntity | null {
    const baseline = this._roster[rosterId];
    if (!baseline) return null;
    const game = this.getActiveGame();
    if (!game) return null;
    const copy: DnDEntity = JSON.parse(JSON.stringify(baseline));
    game.entities[copy.id] = copy;
    if (!game.activeEntityId) game.activeEntityId = rosterId;
    if (this._activeGameId) this.saveState(this._activeGameId);
    return copy;
  }

  getGameEntity(id: string): DnDEntity | null {
    const game = this.getActiveGame();
    if (!game) return null;
    return game.entities[id] ?? null;
  }

  getAllGameEntities(): DnDEntity[] {
    const game = this.getActiveGame();
    if (!game) return [];
    return Object.values(game.entities);
  }

  setActiveEntity(id: string): boolean {
    const game = this.getActiveGame();
    if (!game) return false;
    if (!game.entities[id]) return false;
    game.activeEntityId = id;
    return true;
  }

  getActiveEntity(): DnDEntity | null {
    const game = this.getActiveGame();
    if (!game || !game.activeEntityId) return null;
    return game.entities[game.activeEntityId] ?? null;
  }

  // ─── NPC methods ──────────────────────────────────────────────────────

  createNpc(name: string, fields?: Partial<NPCEntity>): NPCEntity {
    const game = this.getActiveGame()!;
    const id = this.nextNpcId();
    const npc: NPCEntity = {
      id, name,
      stats: fields?.stats ?? {},
      ac: fields?.ac ?? 10,
      hp: fields?.hp ?? { max: 1, current: 1 },
      speed: fields?.speed ?? 30,
      conditions: fields?.conditions ?? [],
      description: fields?.description,
      disposition: fields?.disposition,
      location: fields?.location,
    };
    game.npcs[id] = npc;
    return npc;
  }

  updateNpc(id: string, fields: Partial<NPCEntity>): NPCEntity | null {
    const game = this.getActiveGame();
    if (!game || !game.npcs[id]) return null;
    Object.assign(game.npcs[id], fields);
    return game.npcs[id];
  }

  removeNpc(id: string): boolean {
    const game = this.getActiveGame();
    if (!game || !game.npcs[id]) return false;
    delete game.npcs[id];
    return true;
  }

  getAllNpcs(): NPCEntity[] {
    const game = this.getActiveGame();
    if (!game) return [];
    return Object.values(game.npcs);
  }

  // ─── Countdown methods ────────────────────────────────────────────────

  setCountdown(name: string, ticks: number, type: "round" | "narrative"): CountdownState {
    const game = this.getActiveGame()!;
    const c: CountdownState = { name, ticks, total: ticks, type, active: true };
    game.countdowns[name] = c;
    return c;
  }

  advanceCountdown(name: string): CountdownState | null {
    const game = this.getActiveGame();
    if (!game || !game.countdowns[name]) return null;
    const c = game.countdowns[name];
    c.ticks = Math.max(0, c.ticks - 1);
    if (c.ticks === 0) c.active = false;
    return c;
  }

  removeCountdown(name: string): boolean {
    const game = this.getActiveGame();
    if (!game || !game.countdowns[name]) return false;
    delete game.countdowns[name];
    return true;
  }

  advanceRoundCountdowns(): void {
    const game = this.getActiveGame();
    if (!game) return;
    for (const c of Object.values(game.countdowns)) {
      if (c.type === "round" && c.active) {
        c.ticks = Math.max(0, c.ticks - 1);
        if (c.ticks === 0) c.active = false;
      }
    }
  }

  // ─── Lore methods ─────────────────────────────────────────────────────

  setLoreEntry(key: string, content: string, triggers: string[], persona_scope: "game_master" | "shared"): LoreEntry {
    const game = this.getActiveGame()!;
    const e: LoreEntry = { key, content, triggers, persona_scope };
    game.loreEntries[key] = e;
    return e;
  }

  removeLoreEntry(key: string): boolean {
    const game = this.getActiveGame();
    if (!game || !game.loreEntries[key]) return false;
    delete game.loreEntries[key];
    return true;
  }

  getActiveLore(persona: Persona): LoreEntry[] {
    const game = this.getActiveGame();
    if (!game || !game.scene.description) return [];
    const sceneLower = game.scene.description.toLowerCase();
    return Object.values(game.loreEntries)
      .filter(e => persona === "game_master" || e.persona_scope === "shared")
      .filter(e => e.triggers.some(t => sceneLower.includes(t.toLowerCase())))
      .slice(0, 50);
  }

  getActiveEnrichment(persona: Persona): EnrichmentRecord[] {
    const game = this.getActiveGame();
    if (!game) return [];
    return game.enrichment
      .filter(e => persona === "game_master" || e.persona_scope === "shared" || e.persona_scope === "player");
  }

  // ─── Adventure methods ────────────────────────────────────────────────

  registerAdventure(slug: string, title: string, sections: { anchor: string; title: string; gm_only: boolean; content: string }[]): void {
    this.adventureModules[slug] = { slug, title, sections };
  }

  setActiveAdventure(slug: string): boolean {
    if (!this.adventureModules[slug]) return false;
    const game = this.getActiveGame();
    if (!game) return false;
    game.activeAdventureId = slug;
    return true;
  }

  getActiveAdventure(): AdventureState | null {
    const game = this.getActiveGame();
    if (!game || !game.activeAdventureId) return null;
    return this.adventureModules[game.activeAdventureId] ?? null;
  }

  // ─── Save/load state to disk ───────────────────────────────────────────

  saveState(gameId: string): void {
    const game = this._games[gameId];
    const state = {
      roster: this._roster,
      game: game ?? null,
      seed: this.sessionSeed,
      counter: this.entityCounter,
      npcCounter: this.npcCounter,
      persona: this.activePersona,
      fp: this.buildFingerprint,
    };
    const dir = path.join(this.dataDir, "state");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, `${gameId}.json`), JSON.stringify(state, null, 2));
  }

  loadState(gameId: string): boolean {
    const file = path.join(this.dataDir, "state", `${gameId}.json`);
    if (!fs.existsSync(file)) return false;
    try {
      const data = JSON.parse(fs.readFileSync(file, "utf-8"));
      this._roster = data.roster ?? {};
      if (data.game) {
        const g = defaultGame();
        const loaded = data.game;
        g.entities = loaded.entities ?? {};
        g.combat = loaded.combat ?? null;
        g.auditLog = loaded.auditLog ?? [];
        g.npcs = loaded.npcs ?? {};
        g.scene = loaded.scene ?? defaultScene();
        g.countdowns = loaded.countdowns ?? {};
        g.loreEntries = loaded.loreEntries ?? {};
        g.enrichment = loaded.enrichment ?? [];
        g.activeAdventureId = loaded.activeAdventureId ?? null;
        g.narrativeDirective = loaded.narrativeDirective ?? "";
        g.briefingOrder = loaded.briefingOrder ?? [];
        g.activeEntityId = loaded.activeEntityId ?? null;
        g.ended = loaded.ended ?? false;
        this._games[gameId] = g;
        this._activeGameId = gameId;
      }
      if (data.seed) {
        this.prng.reseed(data.seed);
        this.sessionSeed = data.seed;
      }
      this.entityCounter = data.counter ?? 0;
      this.npcCounter = data.npcCounter ?? 0;
      if (data.persona !== undefined) this.activePersona = data.persona;
      if (data.fp) this.buildFingerprint = data.fp;
      this.corruptStates = this.corruptStates.filter(s => s !== gameId);
      return true;
    } catch {
      if (!this.corruptStates.includes(gameId)) this.corruptStates.push(gameId);
      return false;
    }
  }

  saveRoster(): void {
    try {
      fs.mkdirSync(this.dataDir, { recursive: true });
      fs.writeFileSync(path.join(this.dataDir, "roster.json"), JSON.stringify(this._roster, null, 2));
    } catch (_) { /* silent */ }
  }

  loadRoster(): void {
    try {
      const f = path.join(this.dataDir, "roster.json");
      if (fs.existsSync(f)) this._roster = JSON.parse(fs.readFileSync(f, "utf-8"));
    } catch (_) { /* silent */ }
  }
}

export const state = new StateManager(
  process.env.TTRPG_SEED || "dnd5e-default",
  process.env.TTRPG_DATA_DIR || path.join(process.cwd(), ".holonovel-state"),
);
state.loadRoster();
if (process.env.TTRPG_GAME_ID) {
  const loaded = state.loadState(process.env.TTRPG_GAME_ID);
  if (!loaded) state.getOrCreateGame(process.env.TTRPG_GAME_ID);
}
