import { PRNG } from "./dice.js";
import { AbilityScore, ClassName } from "./data.js";
import { applyEnrichment } from "./enrichment.js";
import * as fs from "node:fs";
import * as path from "node:path";
import * as crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __stateDirname = path.dirname(fileURLToPath(import.meta.url));
const SPEC_VERSION: string = JSON.parse(
  fs.readFileSync(path.join(__stateDirname, "..", "package.json"), "utf-8")
).version;

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
  priority?: number;
  sticky?: number;
  stickyMax?: number;
  enabled?: boolean;
  group?: string;
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
  output_module: "voice_examples" | "briefing_order" | "lore_templates" | "action_patterns" | "supplementary_guidance" | "adventure_advice";
  collected_at?: string;
}

export interface AdventureState {
  slug: string;
  title: string;
  sections: { anchor: string; title: string; gm_only: boolean; content: string }[];
}

export interface BuildFingerprint {
  specVersion: string;
  buildTimestamp: string;
  rulesetHash: string;
  lastSpecReview?: string;
  lastGauntlet?: string;
  gauntletScenariosPassed?: number;
  specRepoUrl?: string;
}

export interface NovelMetadata {
  slug: string;
  name: string;
  createdAt: string;
  charactersPresent: boolean;
  adventureSet: boolean;
  sessionZeroCompleted: boolean;
}

export interface NovelState {
  slug: string;
  name: string;
  createdAt: string;
  lastModified: string;
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
  actionPatternsEnabled: boolean;
  combatRoundsPlayed: number;
  totalCombatRounds: number;
  lastActiveSceneAnchor: string;
  sessionCount: number;
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
  const now = new Date().toISOString();
  return {
    slug: "", name: "", createdAt: now, lastModified: now,
    charactersPresent: false, adventureSet: false, sessionZeroCompleted: false,
    entities: {}, npcs: {}, combat: null, auditLog: [],
    scene: defaultScene(), countdowns: {}, loreEntries: {},
    enrichment: [], adventureModules: {}, activeAdventureId: null,
    narrativeDirective: "", briefingOrder: [], activeEntityId: null,
    ended: false, actionPatternsEnabled: false, combatRoundsPlayed: 0,
    totalCombatRounds: 0, lastActiveSceneAnchor: "", sessionCount: 0,
  };
}

function computeRulesetHash(): string {
  const rulesetDir = path.resolve(process.cwd(), "ruleset");
  const hash = crypto.createHash("sha256");
  function walk(dir: string) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir).sort()) {
      const full = path.join(dir, entry);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) { walk(full); }
      else if (entry.endsWith(".md")) { hash.update(fs.readFileSync(full)); }
    }
  }
  walk(rulesetDir);
  return hash.digest("hex").slice(0, 16);
}

export class StateManager {
  _roster: Record<string, DnDEntity> = {};
  _novels: Record<string, NovelState> = {};
  _activeNovelSlug: string | null = null;
  public prng: PRNG;
  public sessionSeed: string | null = null;
  private personaStacks: Record<string, Snapshot[]> = {};
  public activePersona: Persona | null = null;
  public workflow: WorkflowState | null = null;
  public dataDir: string;
  public corruptStates: string[] = [];
  private entityCounter = 0;
  private npcCounter = 0;
  public buildFingerprint: BuildFingerprint;
  public _systemAdventures: Record<string, AdventureState> = {};
  private lastMutationTime: number = 0;

  get activeNovelSlug(): string | null { return this._activeNovelSlug; }

  constructor(seed: string, dataDir: string) {
    this.prng = new PRNG(seed);
    this.dataDir = dataDir;
    this.buildFingerprint = {
      specVersion: SPEC_VERSION,
      buildTimestamp: new Date().toISOString(),
      rulesetHash: computeRulesetHash(),
      lastSpecReview: new Date().toISOString(),
      specRepoUrl: "https://github.com/anomalyco/Holonovel",
    };
    fs.mkdirSync(dataDir, { recursive: true });
    this.loadRoster();
  }

  setPersona(p: Persona): void { this.activePersona = p; }
  deactivatePersona(): void { this.activePersona = null; }

  getPersonaSnapshots(): Snapshot[] {
    const p = this.activePersona ?? "game_master";
    if (!this.personaStacks[p]) this.personaStacks[p] = [];
    return this.personaStacks[p];
  }

  getActiveNovel(): NovelState | null {
    if (!this._activeNovelSlug) return null;
    const n = this._novels[this._activeNovelSlug] ?? null;
    if (n?.ended) return null;
    return n;
  }

  getAllNovelEntities(): DnDEntity[] {
    const novel = this.getActiveNovel();
    if (!novel) return [];
    return Object.values(novel.entities);
  }

  getActiveEntity(): DnDEntity | null {
    const novel = this.getActiveNovel();
    if (!novel || !novel.activeEntityId) return null;
    return novel.entities[novel.activeEntityId] ?? null;
  }

  findEntity(id: string): DnDEntity | null {
    const novel = this.getActiveNovel();
    return novel?.entities[id] ?? null;
  }

  createNovel(name: string): NovelState {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    if (this._novels[slug] && !this._novels[slug].ended) return this._novels[slug];
    const novel = defaultNovel();
    novel.slug = slug;
    novel.name = name;
    novel.createdAt = new Date().toISOString();
    novel.lastModified = novel.createdAt;
    this._novels[slug] = novel;
    this._activeNovelSlug = slug;
    applyEnrichment(novel, this.buildFingerprint.rulesetHash);
    this.saveState(slug);
    return novel;
  }

  resumeNovel(slug: string): NovelState | null {
    if (this.loadState(slug)) {
      const n = this._novels[slug];
      if (n) {
        n.ended = false;
        this._activeNovelSlug = slug;
      }
      return n ?? null;
    }
    return null;
  }

  listNovels(): { slug: string; name: string; lastModified: string; active: boolean }[] {
    const results: { slug: string; name: string; lastModified: string; active: boolean }[] = [];
    const dir = path.join(this.dataDir, "novels");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    for (const entry of fs.readdirSync(dir)) {
      if (!entry.endsWith(".json") || entry.endsWith(".json.bak") || entry.endsWith(".json.tmp")) continue;
      const slug = entry.replace(/\.json$/, "");
      try {
        const stat = fs.statSync(path.join(dir, entry));
        const raw = JSON.parse(fs.readFileSync(path.join(dir, entry), "utf-8"));
        const novel = raw.novel || {};
        results.push({
          slug,
          name: novel.name || slug,
          lastModified: stat.mtime.toISOString(),
          active: slug === this._activeNovelSlug,
        });
      } catch (_) { /* skip unreadable */ }
    }
    return results;
  }

  endNovel(): void {
    if (!this._activeNovelSlug) return;
    const slug = this._activeNovelSlug;
    if (this._novels[slug]) { this._novels[slug].ended = true; }
    this.deactivatePersona();
    this.personaStacks = {};
    this._activeNovelSlug = null;
    try {
      const dir = path.join(this.dataDir, "novels");
      const file = path.join(dir, `${slug}.json`);
      const bak = path.join(dir, `${slug}.json.bak`);
      if (fs.existsSync(file)) fs.unlinkSync(file);
      if (fs.existsSync(bak)) fs.unlinkSync(bak);
    } catch (_) { /* silent */ }
  }

  generateNextEntityId(): string {
    this.entityCounter++;
    return `e${this.entityCounter}`;
  }

  generateNextNpcId(): string {
    this.npcCounter++;
    return `npc${this.npcCounter}`;
  }

  createNpc(name: string, fields: Partial<NPCEntity> = {}): NPCEntity {
    const novel = this.getActiveNovel();
    if (!novel) throw new Error("No active novel");
    const id = this.generateNextNpcId();
    const npc: NPCEntity = {
      id, name,
      stats: {}, ac: 10, hp: { max: 10, current: 10 }, speed: 30,
      conditions: [],
      ...fields,
    };
    novel.npcs[id] = npc;
    return npc;
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
      persona,
      tool,
      args,
      result,
    });
  }

  addToRoster(entity: DnDEntity): { ok: boolean; addedToNovel: boolean } {
    const novel = this.getActiveNovel();
    this._roster[entity.id] = JSON.parse(JSON.stringify(entity));
    let addedToNovel = false;
    if (novel) {
      novel.entities[entity.id] = JSON.parse(JSON.stringify(entity));
      if (!novel.activeEntityId) novel.activeEntityId = entity.id;
      novel.charactersPresent = true;
      addedToNovel = true;
    }
    this.saveRoster();
    return { ok: true, addedToNovel };
  }

  importFromRoster(rosterId: string): DnDEntity | null {
    const novel = this.getActiveNovel();
    if (!novel) return null;
    const baseline = this._roster[rosterId];
    if (!baseline) return null;
    const copy = JSON.parse(JSON.stringify(baseline)) as DnDEntity;
    novel.entities[copy.id] = copy;
    if (!novel.activeEntityId) novel.activeEntityId = copy.id;
    return copy;
  }

  generateAdventure(premise: string): AdventureState {
    const slug = premise.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
    const title = premise.slice(0, 80);
    const trinkets = [
      "A mummified goblin hand", "A piece of crystal that faintly glows",
      "A brass orb etched with strange runes", "A silver skull with a dark patina",
      "A tiny mechanical spider", "A glass sphere filled with moving fog",
      "A 1-pound egg with a bright red shell",
    ];
    const settings = ["dungeon", "wilderness", "urban", "coastal", "mountain", "underdark", "feywild"];
    const themes = ["mystery", "revenge", "protection", "recovery", "exploration", "survival"];
    const pick = <T>(arr: T[]): T => arr[Math.floor(this.prng.next() * arr.length)];
    const count = 2 + Math.floor(this.prng.next() * 5);
    const setting = pick(settings);
    const theme = pick(themes);
    const reward = pick(trinkets);

    const locationNames = ["The Forgotten Outpost", "Whispering Caverns", "Ruined Keep of Dusk", "The Sunken Shrine", "Crimson Hollow", "The Broken Tower"];
    const sections: { anchor: string; title: string; gm_only: boolean; content: string }[] = [
      {
        anchor: `${slug}-overview`,
        title: "Overview",
        gm_only: true,
        content: `# ${title}\n\n**Premise:** ${premise}\n\n**Setting:** ${setting} | **Theme:** ${theme}\n\n**Reward Hook:** ${reward}`,
      },
      {
        anchor: `${slug}-hook`,
        title: "Adventure Hook",
        gm_only: false,
        content: `## Adventure Hook\n\n${premise}. The party is drawn into the story, with the promise of ${reward} as a potential reward.`,
      },
    ];

    for (let i = 0; i < count; i++) {
      const loc = locationNames[i % locationNames.length];
      const anchor = `${slug}-loc-${i + 1}`;
      sections.push({
        anchor,
        title: loc,
        gm_only: true,
        content: `## ${loc}\n\n${pick(["The air is cold and damp here.", "Strange runes cover the walls.", "The sound of dripping water echoes.", "Faint traces of old blood stain the floor.", "A cold draft whispers through the chamber."])}\n\n**Encounter Seed:** ${pick([setting])} ${pick(themes)}.`,
      });
    }

    const adventure: AdventureState = { slug, title, sections };
    const novel = this.getActiveNovel();
    if (novel) {
      novel.adventureModules[slug] = adventure;
      novel.activeAdventureId = slug;
      novel.adventureSet = true;
    }
    return adventure;
  }

  generateEncounter(context: string): { sceneDescription: string; npcId: string; loreKey: string } {
    const pick = <T>(arr: T[]): T => arr[Math.floor(this.prng.next() * arr.length)];
    const locales = ["a crumbling ruin", "a dark forest clearing", "a narrow mountain pass", "a forgotten crypt entrance", "a misty riverbank", "a windswept hilltop", "a dusty crossroads"];
    const ambiences = ["The air is still and heavy with tension.", "Faint sounds echo from somewhere nearby.", "Shadows shift in the corner of your vision.", "The smell of old smoke lingers in the air.", "Everything is unnervingly quiet."];
    const complications = ["Something is watching from the shadows.", "Recent tracks suggest you are not alone.", "An old trap has been sprung — by what?", "A sealed chest sits in plain view — too easy.", "A faint voice calls for help — but no one is visible."];

    const locale = pick(locales);
    const ambience = pick(ambiences);
    const complication = pick(complications);
    const sceneDescription = `${context}. ${locale}. ${ambience}. ${complication}.`;
    const novel = this.getActiveNovel();
    if (novel) novel.scene.description = sceneDescription;

    const npcNames = ["Lost", "Wounded", "Watchful", "Eager", "Brooding", "Frightened", "Helpful", "Defiant", "Mysterious", "Battle-hardened"];
    const npcRoles = ["Traveler", "Guard", "Priest", "Scout", "Merchant", "Scholar", "Mercenary", "Hermit", "Guide", "Refugee"];
    const npc = this.createNpc(`${pick(npcNames)} ${pick(npcRoles)}`, {
      description: `Generated from: ${context}`,
      disposition: pick(["neutral", "friendly", "hostile", "suspicious", "frightened"]),
    });

    const loreKey = context.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40);
    if (novel) {
      novel.loreEntries[loreKey] = {
        key: loreKey,
        content: `Encounter lore: ${context}. Complication: ${complication}.`,
        triggers: [locale.split(" ")[0] || context.slice(0, 10)],
        persona_scope: "game_master",
        priority: 0,
        enabled: true,
      };
    }

    return { sceneDescription, npcId: npc.id, loreKey };
  }

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

  saveState(novelSlug: string): void {
    const novel = this._novels[novelSlug];
    if (!novel) return;
    novel.lastModified = new Date().toISOString();
    const state: Record<string, unknown> = {
      roster: this._roster,
      novel,
      seed: this.sessionSeed,
      counter: this.entityCounter,
      npcCounter: this.npcCounter,
      persona: this.activePersona,
      fp: this.buildFingerprint,
    };
    const checksum = crypto.createHash("sha256").update(JSON.stringify(state, null, 2)).digest("hex").slice(0, 16);
    state.checksum = checksum;
    const dir = path.join(this.dataDir, "novels");
    fs.mkdirSync(dir, { recursive: true });
    const target = path.join(dir, `${novelSlug}.json`);
    const tmp = path.join(dir, `${novelSlug}.json.tmp`);
    const bak = path.join(dir, `${novelSlug}.json.bak`);

    try {
      const json = JSON.stringify(state, null, 2);
      fs.writeFileSync(tmp, json, "utf-8");
      if (fs.existsSync(target)) {
        if (fs.existsSync(bak)) fs.unlinkSync(bak);
        fs.renameSync(target, bak);
      }
      fs.renameSync(tmp, target);
    } catch (e) {
      console.warn(`[WARNING] Atomic save failed for ${novelSlug}: ${e}`);
      try { if (fs.existsSync(tmp)) fs.unlinkSync(tmp); } catch (_) {}
    }
  }

  loadState(novelSlug: string): boolean {
    const dir = path.join(this.dataDir, "novels");
    const file = path.join(dir, `${novelSlug}.json`);
    const bak = path.join(dir, `${novelSlug}.json.bak`);
    let raw: string | null = null;
    let sourceName = file;

    try {
      if (fs.existsSync(file)) raw = fs.readFileSync(file, "utf-8");
    } catch (_) {}

    if (!raw && fs.existsSync(bak)) {
      console.warn(`[WARNING] Novel ${novelSlug} corrupted, loading backup.`);
      try { raw = fs.readFileSync(bak, "utf-8"); sourceName = bak; } catch (_) {}
    }

    if (!raw) return false;

    try {
      const data = JSON.parse(raw);

      if (data.checksum) {
        const storedChecksum = data.checksum as string;
        const { checksum: _, ...dataForHash } = data;
        const computed = crypto.createHash("sha256").update(JSON.stringify(dataForHash, null, 2)).digest("hex").slice(0, 16);
        if (storedChecksum !== computed) {
          if (sourceName === file && fs.existsSync(bak)) {
            console.warn(`[WARNING] Checksum mismatch for Novel ${novelSlug}. Attempting backup restore.`);
            try { raw = fs.readFileSync(bak, "utf-8"); sourceName = bak; } catch (_) { raw = null; }
            if (raw) {
              try {
                const bakData = JSON.parse(raw);
                if (bakData.checksum) {
                  const { checksum: _, ...bakForHash } = bakData;
                  const bakComputed = crypto.createHash("sha256").update(JSON.stringify(bakForHash, null, 2)).digest("hex").slice(0, 16);
                  if (bakData.checksum !== bakComputed) {
                    raw = null;
                  }
                }
              } catch { raw = null; }
            }
            if (raw) {
              return this.loadStateFromData(JSON.parse(raw), novelSlug, "restored_from_backup");
            }
          }
          if (!this.corruptStates.includes(novelSlug)) this.corruptStates.push(novelSlug);
          console.warn(`[WARNING] Checksum mismatch for Novel ${novelSlug}. Both primary and backup are tainted or missing.`);
          return false;
        }
      }

      return this.loadStateFromData(data, novelSlug);
    } catch {
      if (sourceName === file && fs.existsSync(bak)) {
        console.warn(`[WARNING] Novel ${novelSlug} structurally corrupt. Attempting backup restore.`);
        try {
          raw = fs.readFileSync(bak, "utf-8");
          const bakData = JSON.parse(raw);
          return this.loadStateFromData(bakData, novelSlug, "restored_from_backup");
        } catch { raw = null; }
      }
      if (!this.corruptStates.includes(novelSlug)) this.corruptStates.push(novelSlug);
      return false;
    }
  }

  private loadStateFromData(data: Record<string, unknown>, novelSlug: string, restoreTag?: string): boolean {
    this._roster = data.roster as Record<string, DnDEntity> ?? {};

    const novelData = (data.novel || data.game) as Record<string, unknown> | undefined;
    if (novelData) {
      const n = defaultNovel();
      n.slug = novelData.slug as string ?? novelSlug;
      n.name = novelData.name as string ?? "";
      n.createdAt = novelData.createdAt as string ?? new Date().toISOString();
      n.lastModified = novelData.lastModified as string ?? n.createdAt;
      n.charactersPresent = novelData.charactersPresent as boolean ?? false;
      n.adventureSet = novelData.adventureSet as boolean ?? false;
      n.sessionZeroCompleted = novelData.sessionZeroCompleted as boolean ?? false;
      n.entities = (novelData.entities as Record<string, DnDEntity>) ?? {};
      n.npcs = (novelData.npcs as Record<string, NPCEntity>) ?? {};
      n.combat = (novelData.combat as CombatState | null) ?? null;
      n.auditLog = (novelData.auditLog as AuditEntry[]) ?? [];
      n.scene = (novelData.scene as SceneState) ?? defaultScene();
      n.countdowns = (novelData.countdowns as Record<string, CountdownState>) ?? {};
      n.loreEntries = (novelData.loreEntries as Record<string, LoreEntry>) ?? {};
      n.enrichment = (novelData.enrichment as EnrichmentRecord[]) ?? [];
      n.adventureModules = (novelData.adventureModules as Record<string, AdventureState>) ?? {};
      n.activeAdventureId = novelData.activeAdventureId as string | null ?? null;
      n.narrativeDirective = novelData.narrativeDirective as string ?? "";
      n.briefingOrder = novelData.briefingOrder as string[] ?? [];
      n.activeEntityId = novelData.activeEntityId as string | null ?? null;
      n.ended = novelData.ended as boolean ?? false;
      n.actionPatternsEnabled = novelData.actionPatternsEnabled as boolean ?? false;
      n.combatRoundsPlayed = novelData.combatRoundsPlayed as number ?? 0;
      n.totalCombatRounds = novelData.totalCombatRounds as number ?? 0;
      n.lastActiveSceneAnchor = novelData.lastActiveSceneAnchor as string ?? "";
      n.sessionCount = novelData.sessionCount as number ?? 0;

      for (const e of n.enrichment) {
        if (!e.collected_at) e.collected_at = n.createdAt;
      }

      this._novels[novelSlug] = n;
      this._activeNovelSlug = novelSlug;

      if (n.enrichment.length === 0) {
        applyEnrichment(n, this.buildFingerprint.rulesetHash);
      }

      if (restoreTag) {
        n.auditLog.push({
          timestamp: new Date().toISOString(),
          persona: "system",
          tool: restoreTag,
          args: {},
          result: `Novel ${novelSlug} restored from backup`,
        });
      }
    }

    this.sessionSeed = data.seed as string ?? null;
    if (data.seed) this.prng.reseed(data.seed as string);
    this.entityCounter = data.counter as number ?? 0;
    this.npcCounter = data.npcCounter as number ?? 0;
    if (data.persona !== undefined) this.activePersona = data.persona as Persona | null;

    if (data.fp) {
      const stored = data.fp as Record<string, unknown>;
      if (stored.rulesetHash && stored.rulesetHash !== this.buildFingerprint.rulesetHash) {
        console.warn(`[WARNING] Build fingerprint mismatch: ruleset hash changed (stored: ${stored.rulesetHash}, current: ${this.buildFingerprint.rulesetHash}). A rebuild occurred.`);
      }
      this.buildFingerprint = { ...stored, ...this.buildFingerprint } as BuildFingerprint;
    }

    this.corruptStates = this.corruptStates.filter(s => s !== novelSlug);
    return true;
  }

  saveRoster(): void {
    const dir = this.dataDir;
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "roster.json"), JSON.stringify(this._roster, null, 2));
  }

  revertEnrichment(): boolean {
    const novel = this.getActiveNovel();
    if (!novel) return false;
    novel.enrichment = [];
    novel.briefingOrder = [];
    novel.actionPatternsEnabled = false;
    return true;
  }

  getNovelFileSize(slug: string): number {
    try {
      const file = path.join(this.dataDir, "novels", `${slug}.json`);
      return fs.statSync(file).size;
    } catch { return 0; }
  }

  loadRoster(): void {
    const file = path.join(this.dataDir, "roster.json");
    if (fs.existsSync(file)) {
      try {
        this._roster = JSON.parse(fs.readFileSync(file, "utf-8"));
      } catch (_) {}
    }
  }
}

const DEFAULT_DATA_DIR = process.env["TTRPG_DATA_DIR"] || ".holonovel-state";
const DEFAULT_SEED = process.env["TTRPG_SEED"] || String(Date.now());
export const state = new StateManager(DEFAULT_SEED, DEFAULT_DATA_DIR);
