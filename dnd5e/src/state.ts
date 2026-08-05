// State management: roster, novel entities, NPCs, scene, countdowns, lore, enrichment, adventure, snapshots, audit log, persona
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

export interface NovelState {
  slug: string;
  name: string;
  createdAt: string;
  charactersPresent: boolean;
  adventureSet: boolean;
  sessionZeroCompleted: boolean;
  entities: Record<string, DnDEntity>;
  npcs: Record<string, NPCEntity>;
  combat: CombatState | null;
  auditLog: AuditEntry[];
  scene: SceneState;
  countdowns: Record<string, CountdownState>;
  loreEntries: Record<string, LoreEntry>;
  enrichment: EnrichmentRecord[];
  adventureModules: Record<string, AdventureState>;
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

function defaultNovel(): NovelState {
  return {
    slug: "",
    name: "",
    createdAt: new Date().toISOString(),
    charactersPresent: false,
    adventureSet: false,
    sessionZeroCompleted: false,
    entities: {},
    npcs: {},
    combat: null,
    auditLog: [],
    scene: defaultScene(),
    countdowns: {},
    loreEntries: {},
    enrichment: [],
    adventureModules: {},
    activeAdventureId: null,
    narrativeDirective: "",
    briefingOrder: [],
    activeEntityId: null,
    ended: false,
  };
}

export class StateManager {
  _roster: Record<string, DnDEntity> = {};
  _novels: Record<string, NovelState> = {};
  _activeNovelSlug: string | null = null;
  public prng: PRNG;
  public sessionSeed: string | null = null;
  private personaStacks: Record<Persona, Snapshot[]> = { player: [], game_master: [] };
  public activePersona: Persona | null = null;
  public workflow: WorkflowState | null = null;
  public dataDir: string;
  public corruptStates: string[] = [];
  private entityCounter = 0;
  private npcCounter = 0;
  public buildFingerprint: BuildFingerprint = { specVersion: "1.3.0", buildTimestamp: new Date().toISOString() };
  public _systemAdventures: Record<string, AdventureState> = {};

  get activeNovelSlug(): string | null { return this._activeNovelSlug; }

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

  getActiveNovel(): NovelState | null {
    if (!this._activeNovelSlug) return null;
    const g = this._novels[this._activeNovelSlug] ?? null;
    if (g?.ended) return null;
    return g;
  }

  getOrCreateNovel(novelSlug: string, name?: string): NovelState {
    this._activeNovelSlug = novelSlug;
    if (!this._novels[novelSlug]) {
      this._novels[novelSlug] = defaultNovel();
      this._novels[novelSlug].slug = novelSlug;
      this._novels[novelSlug].name = name || novelSlug;
      this._novels[novelSlug].createdAt = new Date().toISOString();
    }
    return this._novels[novelSlug];
  }

  createNovel(name: string): NovelState {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    return this.getOrCreateNovel(slug, name);
  }

  resumeNovel(slug: string): NovelState | null {
    if (this.loadState(slug)) {
      return this._novels[slug] ?? null;
    }
    return null;
  }

  listNovels(): { slug: string; name: string; lastModified: string; active: boolean }[] {
    const results: { slug: string; name: string; lastModified: string; active: boolean }[] = [];
    const dir = path.join(this.dataDir, "novels");
    if (!fs.existsSync(dir)) return [];
    for (const entry of fs.readdirSync(dir)) {
      if (!entry.endsWith(".json")) continue;
      const slug = entry.replace(/\.json$/, "");
      try {
        const stat = fs.statSync(path.join(dir, entry));
        const raw = JSON.parse(fs.readFileSync(path.join(dir, entry), "utf-8"));
        const novel = raw.novel || raw.game || {};
        results.push({
          slug,
          name: novel.name || slug,
          lastModified: stat.mtime.toISOString(),
          active: slug === this._activeNovelSlug,
        });
      } catch (_) { /* skip unreadable files */ }
    }
    return results;
  }

  generateAdventure(premise: string): AdventureState {
    const slug = premise.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
    const title = premise.slice(0, 80);
    const sections = [
      { anchor: `${slug}-overview`, title: "Overview", gm_only: true, content: `# ${title}\n\n**Premise:** ${premise}\n\nDetailed adventure content generated from premise.` },
      { anchor: `${slug}-hook`, title: "Adventure Hook", gm_only: false, content: "## Adventure Hook\n\nThe party is drawn into the story by..." },
      { anchor: `${slug}-locations`, title: "Locations", gm_only: true, content: "## Locations\n\nKey locations and their descriptions." },
    ];
    const adv: AdventureState = { slug, title, sections };
    const novel = this.getActiveNovel();
    if (novel) {
      novel.adventureModules[slug] = adv;
      novel.adventureSet = true;
    }
    return adv;
  }

  generateEncounter(context: string): { sceneDescription: string; npcName: string; loreKey: string } {
    const novel = this.getActiveNovel();
    const sceneDescription = `Encounter: ${context}. The environment reacts to the party's presence.`;
    if (novel) novel.scene.description = sceneDescription;
    const npcName = `Encounter NPC (${context.slice(0, 20)})`;
    const npc = this.createNpc(npcName, { description: `Generated from: ${context}`, disposition: "neutral" });
    const loreKey = context.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40);
    if (novel) {
      novel.loreEntries[loreKey] = { key: loreKey, content: `Encounter lore: ${context}`, triggers: [], persona_scope: "game_master" };
    }
    return { sceneDescription, npcName: npc.id, loreKey };
  }

  endNovel(): void {
    if (!this._activeNovelSlug) return;
    const slug = this._activeNovelSlug;
    this._novels[slug].ended = true;
    this.deactivatePersona();
    this.personaStacks = { player: [], game_master: [] };
    this._activeNovelSlug = null;
    try {
      const file = path.join(this.dataDir, "novels", `${slug}.json`);
      if (fs.existsSync(file)) fs.unlinkSync(file);
    } catch (_) { /* silent */ }
  }

  snapshot(): void {
    const novel = this.getActiveNovel();
    if (!novel) return;
    const snap: Snapshot = {
      timestamp: new Date().toISOString(),
      entities: JSON.parse(JSON.stringify(novel.entities)),
      combat: novel.combat ? JSON.parse(JSON.stringify(novel.combat)) : null,
      npcs: JSON.parse(JSON.stringify(novel.npcs)),
      scene: JSON.parse(JSON.stringify(novel.scene)),
      countdowns: JSON.parse(JSON.stringify(novel.countdowns)),
      loreEntries: JSON.parse(JSON.stringify(novel.loreEntries)),
      activeEntityId: novel.activeEntityId,
    };
    const p = this.activePersona ?? "game_master";
    if (!this.personaStacks[p]) this.personaStacks[p] = [];
    this.personaStacks[p].push(snap);
    if (this._activeNovelSlug) this.saveState(this._activeNovelSlug);
  }

  undo(): Snapshot | null {
    const p = this.activePersona ?? "game_master";
    const stack = this.personaStacks[p] ?? [];
    const novel = this.getActiveNovel();
    if (!novel || stack.length === 0) return null;
    const snap = stack.pop()!;
    novel.entities = snap.entities;
    novel.combat = snap.combat;
    novel.npcs = snap.npcs;
    novel.scene = snap.scene;
    novel.countdowns = snap.countdowns;
    novel.loreEntries = snap.loreEntries;
    novel.activeEntityId = snap.activeEntityId;
    return snap;
  }

  audit(persona: string, tool: string, args: Record<string, unknown>, result: string): void {
    const novel = this.getActiveNovel();
    if (!novel) return;
    novel.auditLog.push({
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
    const novel = this.getActiveNovel();
    if (!novel) return null;
    const copy: DnDEntity = JSON.parse(JSON.stringify(baseline));
    novel.entities[copy.id] = copy;
    if (!novel.activeEntityId) novel.activeEntityId = rosterId;
    if (this._activeNovelSlug) this.saveState(this._activeNovelSlug);
    return copy;
  }

  getNovelEntity(id: string): DnDEntity | null {
    const novel = this.getActiveNovel();
    if (!novel) return null;
    return novel.entities[id] ?? null;
  }

  getAllNovelEntities(): DnDEntity[] {
    const novel = this.getActiveNovel();
    if (!novel) return [];
    return Object.values(novel.entities);
  }

  setActiveEntity(id: string): boolean {
    const novel = this.getActiveNovel();
    if (!novel) return false;
    if (!novel.entities[id]) return false;
    novel.activeEntityId = id;
    return true;
  }

  getActiveEntity(): DnDEntity | null {
    const novel = this.getActiveNovel();
    if (!novel || !novel.activeEntityId) return null;
    return novel.entities[novel.activeEntityId] ?? null;
  }

  // ─── NPC methods ──────────────────────────────────────────────────────

  createNpc(name: string, fields?: Partial<NPCEntity>): NPCEntity {
    const novel = this.getActiveNovel()!;
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
    novel.npcs[id] = npc;
    return npc;
  }

  updateNpc(id: string, fields: Partial<NPCEntity>): NPCEntity | null {
    const novel = this.getActiveNovel();
    if (!novel || !novel.npcs[id]) return null;
    Object.assign(novel.npcs[id], fields);
    return novel.npcs[id];
  }

  removeNpc(id: string): boolean {
    const novel = this.getActiveNovel();
    if (!novel || !novel.npcs[id]) return false;
    delete novel.npcs[id];
    return true;
  }

  getAllNpcs(): NPCEntity[] {
    const novel = this.getActiveNovel();
    if (!novel) return [];
    return Object.values(novel.npcs);
  }

  // ─── Countdown methods ────────────────────────────────────────────────

  setCountdown(name: string, ticks: number, type: "round" | "narrative"): CountdownState {
    const novel = this.getActiveNovel()!;
    const c: CountdownState = { name, ticks, total: ticks, type, active: true };
    novel.countdowns[name] = c;
    return c;
  }

  advanceCountdown(name: string): CountdownState | null {
    const novel = this.getActiveNovel();
    if (!novel || !novel.countdowns[name]) return null;
    const c = novel.countdowns[name];
    c.ticks = Math.max(0, c.ticks - 1);
    if (c.ticks === 0) c.active = false;
    return c;
  }

  removeCountdown(name: string): boolean {
    const novel = this.getActiveNovel();
    if (!novel || !novel.countdowns[name]) return false;
    delete novel.countdowns[name];
    return true;
  }

  advanceRoundCountdowns(): void {
    const novel = this.getActiveNovel();
    if (!novel) return;
    for (const c of Object.values(novel.countdowns)) {
      if (c.type === "round" && c.active) {
        c.ticks = Math.max(0, c.ticks - 1);
        if (c.ticks === 0) c.active = false;
      }
    }
  }

  // ─── Lore methods ─────────────────────────────────────────────────────

  setLoreEntry(key: string, content: string, triggers: string[], persona_scope: "game_master" | "shared"): LoreEntry {
    const novel = this.getActiveNovel()!;
    const e: LoreEntry = { key, content, triggers, persona_scope };
    novel.loreEntries[key] = e;
    return e;
  }

  removeLoreEntry(key: string): boolean {
    const novel = this.getActiveNovel();
    if (!novel || !novel.loreEntries[key]) return false;
    delete novel.loreEntries[key];
    return true;
  }

  getActiveLore(persona: Persona): LoreEntry[] {
    const novel = this.getActiveNovel();
    if (!novel || !novel.scene.description) return [];
    const sceneLower = novel.scene.description.toLowerCase();
    return Object.values(novel.loreEntries)
      .filter(e => persona === "game_master" || e.persona_scope === "shared")
      .filter(e => e.triggers.some(t => sceneLower.includes(t.toLowerCase())))
      .slice(0, 50);
  }

  getActiveEnrichment(persona: Persona): EnrichmentRecord[] {
    const novel = this.getActiveNovel();
    if (!novel) return [];
    return novel.enrichment
      .filter(e => persona === "game_master" || e.persona_scope === "shared" || e.persona_scope === "player");
  }

  // ─── Adventure methods ────────────────────────────────────────────────

  registerAdventure(slug: string, title: string, sections: { anchor: string; title: string; gm_only: boolean; content: string }[]): void {
    this._systemAdventures[slug] = { slug, title, sections };
  }

  setActiveAdventure(slug: string): boolean {
    const novel = this.getActiveNovel();
    if (!novel) return false;
    if (!novel.adventureModules[slug] && !this._systemAdventures[slug]) return false;
    novel.activeAdventureId = slug;
    return true;
  }

  getActiveAdventure(): AdventureState | null {
    const novel = this.getActiveNovel();
    if (!novel || !novel.activeAdventureId) return null;
    return novel.adventureModules[novel.activeAdventureId]
      ?? this._systemAdventures[novel.activeAdventureId]
      ?? null;
  }

  // ─── Save/load state to disk ───────────────────────────────────────────

  saveState(novelSlug: string): void {
    const novel = this._novels[novelSlug];
    const state = {
      roster: this._roster,
      novel: novel ?? null,
      seed: this.sessionSeed,
      counter: this.entityCounter,
      npcCounter: this.npcCounter,
      persona: this.activePersona,
      fp: this.buildFingerprint,
    };
    const dir = path.join(this.dataDir, "novels");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, `${novelSlug}.json`), JSON.stringify(state, null, 2));
  }

  loadState(novelSlug: string): boolean {
    const file = path.join(this.dataDir, "novels", `${novelSlug}.json`);
    if (!fs.existsSync(file)) return false;
    try {
      const data = JSON.parse(fs.readFileSync(file, "utf-8"));
      this._roster = data.roster ?? {};
      const loadedData = data.novel || data.game;
      if (loadedData) {
        const g = defaultNovel();
        const loaded = loadedData;
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
        g.name = loaded.name ?? "";
        g.slug = loaded.slug ?? novelSlug;
        g.createdAt = loaded.createdAt ?? new Date().toISOString();
        g.charactersPresent = loaded.charactersPresent ?? false;
        g.adventureSet = loaded.adventureSet ?? false;
        g.sessionZeroCompleted = loaded.sessionZeroCompleted ?? false;
        g.adventureModules = loaded.adventureModules ?? {};
        this._novels[novelSlug] = g;
        this._activeNovelSlug = novelSlug;
      }
      if (data.seed) {
        this.prng.reseed(data.seed);
        this.sessionSeed = data.seed;
      }
      this.entityCounter = data.counter ?? 0;
      this.npcCounter = data.npcCounter ?? 0;
      if (data.persona !== undefined) this.activePersona = data.persona;
      if (data.fp) this.buildFingerprint = data.fp;
      this.corruptStates = this.corruptStates.filter(s => s !== novelSlug);
      return true;
    } catch {
      if (!this.corruptStates.includes(novelSlug)) this.corruptStates.push(novelSlug);
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
const novelSlug = process.env.TTRPG_NOVEL || process.env.TTRPG_GAME_ID;
if (process.env.TTRPG_GAME_ID && !process.env.TTRPG_NOVEL) {
  console.warn("[WARNING] TTRPG_GAME_ID is deprecated; use TTRPG_NOVEL instead.");
}
if (novelSlug) {
  const loaded = state.loadState(novelSlug);
  if (!loaded) state.getOrCreateNovel(novelSlug);
}
