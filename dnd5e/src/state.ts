// State management: roster, novel entities, NPCs, scene, countdowns, lore, enrichment, adventure, snapshots, audit log, persona
import { PRNG } from "./dice.js";
import { AbilityScore, CLASS_NAMES, ClassName } from "./data.js";
import * as fs from "node:fs";
import * as path from "node:path";
import * as crypto from "node:crypto";
import { applyEnrichment } from "./enrichment.js";

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
  sticky?: number;          // Remaining scenes to persist without trigger
  stickyMax?: number;        // Original sticky duration
  enabled?: boolean;         // Default true
  group?: string;            // Group name
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
  public buildFingerprint: BuildFingerprint = { specVersion: "1.3.0", buildTimestamp: new Date().toISOString(), rulesetHash: "unknown" };
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
      // Apply enrichment to new novels
      applyEnrichment(this._novels[novelSlug], this.buildFingerprint.rulesetHash);
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

    // Use ruleset tables for flavor
    const trinkets = ["A mummified goblin hand", "A piece of crystal that faintly glows", "A brass orb etched with strange runes", "A silver skull with a dark patina", "A tiny mechanical spider", "A glass sphere filled with moving fog", "A 1-pound egg with a bright red shell"];
    const settings = ["dungeon", "wilderness", "urban", "coastal", "mountain", "underdark", "feywild"];
    const themes = ["mystery", "revenge", "protection", "recovery", "exploration", "survival"];

    const rng = this.prng;
    const pick = <T>(arr: T[]): T => arr[Math.floor(rng.next() * arr.length)];
    const count = 2 + Math.floor(rng.next() * 5); // 2–6 locations
    const setting = pick(settings);
    const theme = pick(themes);
    const reward = pick(trinkets);

    const sections = [
      { anchor: `${slug}-overview`, title: "Overview", gm_only: true, content: `# ${title}\n\n**Premise:** ${premise}\n\n**Setting:** ${setting} | **Theme:** ${theme}\n\n**Reward Hook:** ${reward}\n\nDetailed adventure content generated from premise. Populate locations, NPCs, encounters, and challenges using the ruleset tables and tools.` },
      { anchor: `${slug}-hook`, title: "Adventure Hook", gm_only: false, content: `## Adventure Hook\n\n${premise}\n\nThe party is drawn into the story, with the promise of ${reward} as a potential reward.` },
    ];

    for (let i = 0; i < count; i++) {
      const flavor = pick(trinkets);
      sections.push({
        anchor: `${slug}-location-${i + 1}`,
        title: `Location ${i + 1}`,
        gm_only: i % 2 === 0,
        content: `## Location ${i + 1}: ${flavor}\n\nA key location within the adventure. Features environmental details, potential encounters, and narrative connections to the overall story.`
      });
    }

    sections.push({
      anchor: `${slug}-npcs`,
      title: "NPCs",
      gm_only: true,
      content: `## NPCs\n\nKey NPCs the party may encounter:\n- **Quest Giver**: Provides the hook and motivation\n- **Ally**: Offers assistance and information\n- **Antagonist**: Drives the conflict`
    });

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
    const rng = this.prng;

    const locales = ["dark corridor", "crumbling chamber", "misty clearing", "ancient ruins", "twisting tunnel", "overlook point", "rushing river bank", "abandoned shrine", "forested path", "moonlit glade"];
    const ambiences = ["dripping water echoes", "a cold draft raises goosebumps", "shadows twist at the edge of torchlight", "the air hums with latent magic", "silence presses in like a held breath", "footprints in the dust lead forward", "a distant sound — claws on stone", "the smell of old smoke lingers"];
    const complications = ["something watches from the dark", "the floor is unstable here", "a previous expedition left marks", "time is running out", "the locals warned about this place", "an old trap triggers nearby"];

    const pick = <T>(arr: T[]): T => arr[Math.floor(rng.next() * arr.length)];
    const locale = pick(locales);
    const ambience = pick(ambiences);
    const complication = pick(complications);
    const sceneDescription = `${context}. ${locale}. ${ambience}. ${complication}.`;

    if (novel) novel.scene.description = sceneDescription;
    const npcName = `${pick(["Lost", "Wounded", "Watchful", "Eager", "Brooding", "Frightened", "Helpful", "Defiant", "Mysterious", "Battle-hardened"])} ${pick(["Traveler", "Guard", "Priest", "Scout", "Merchant", "Scholar", "Mercenary", "Hermit", "Guide", "Refugee"])}`;
    const npc = this.createNpc(npcName, { description: `Generated from: ${context}`, disposition: pick(["neutral", "friendly", "hostile", "suspicious", "frightened"]) });
    const loreKey = context.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40);
    if (novel) {
      novel.loreEntries[loreKey] = { key: loreKey, content: `Encounter lore: ${context}. Complication: ${complication}.`, triggers: [locale.split(" ")[0] || context.slice(0, 10)], persona_scope: "game_master", priority: 0, enabled: true };
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

  setLoreEntry(key: string, content: string, triggers: string[], persona_scope: "game_master" | "shared", fields?: { priority?: number; sticky?: number; enabled?: boolean; group?: string }): LoreEntry {
    const novel = this.getActiveNovel()!;
    const e: LoreEntry = {
      key, content, triggers, persona_scope,
      priority: fields?.priority ?? 0,
      sticky: fields?.sticky ?? 0,
      stickyMax: fields?.sticky ?? 0,
      enabled: fields?.enabled ?? true,
      group: fields?.group,
    };
    novel.loreEntries[key] = e;
    return e;
  }

  removeLoreEntry(key: string): boolean {
    const novel = this.getActiveNovel();
    if (!novel || !novel.loreEntries[key]) return false;
    delete novel.loreEntries[key];
    return true;
  }

  toggleLoreEntry(key: string): LoreEntry | null {
    const novel = this.getActiveNovel();
    if (!novel || !novel.loreEntries[key]) return null;
    const e = novel.loreEntries[key];
    e.enabled = !(e.enabled ?? true);
    return e;
  }

  setLoreGroup(key: string, group: string | null): LoreEntry | null {
    const novel = this.getActiveNovel();
    if (!novel || !novel.loreEntries[key]) return null;
    if (group === null) {
      delete novel.loreEntries[key].group;
    } else {
      novel.loreEntries[key].group = group;
    }
    return novel.loreEntries[key];
  }

  getLoreGroups(): Record<string, string[]> {
    const novel = this.getActiveNovel();
    if (!novel) return {};
    const groups: Record<string, string[]> = {};
    for (const [key, entry] of Object.entries(novel.loreEntries)) {
      if (entry.group) {
        if (!groups[entry.group]) groups[entry.group] = [];
        groups[entry.group].push(key);
      }
    }
    return groups;
  }

  advanceLoreSticky(): void {
    const novel = this.getActiveNovel();
    if (!novel) return;
    for (const entry of Object.values(novel.loreEntries)) {
      if (entry.sticky && entry.sticky > 0) {
        entry.sticky--;
      }
    }
  }

  getActiveLore(persona: Persona): LoreEntry[] {
    const novel = this.getActiveNovel();
    if (!novel || !novel.scene.description) return [];
    const sceneLower = novel.scene.description.toLowerCase();
    const active: LoreEntry[] = [];

    for (const entry of Object.values(novel.loreEntries)) {
      if (persona !== "game_master" && entry.persona_scope !== "shared") continue;
      if (entry.enabled === false) continue;

      const triggered = entry.triggers.some(t => sceneLower.includes(t.toLowerCase()));
      const isSticky = (entry.sticky ?? 0) > 0;

      if (triggered || isSticky) {
        // Refresh sticky if triggered
        if (triggered && entry.stickyMax) entry.sticky = entry.stickyMax;
        active.push(entry);
      }
    }

    // Sort by priority (descending) then by key
    active.sort((a, b) => {
      const pa = a.priority ?? 0;
      const pb = b.priority ?? 0;
      if (pa !== pb) return pb - pa;
      // Sticky entries before non-sticky
      if ((a.sticky ?? 0) > 0 && (b.sticky ?? 0) <= 0) return -1;
      if ((b.sticky ?? 0) > 0 && (a.sticky ?? 0) <= 0) return 1;
      return a.key.localeCompare(b.key);
    });

    // Apply lore token budget if configured
    const maxTokens = parseInt(process.env.TTRPG_MAX_LORE_TOKENS || "0");
    if (maxTokens > 0) {
      let tokenCount = 0;
      const budgeted: LoreEntry[] = [];
      let omitted = 0;
      let oneOversized = false;
      for (const entry of active) {
        const entryTokens = entry.content.length; // rough token estimate
        if (entryTokens > maxTokens && !oneOversized) {
          budgeted.push(entry);
          oneOversized = true;
          continue;
        }
        if (tokenCount + entryTokens <= maxTokens) {
          budgeted.push(entry);
          tokenCount += entryTokens;
        } else {
          omitted++;
        }
      }
      // Return budgeted entries but maintain priority sort
      return budgeted;
    }

    return active;
  }

  suggestLore(mockSceneText?: string): LoreEntry[] {
    const novel = this.getActiveNovel();
    if (!novel) return [];
    const enrich = novel.enrichment.filter(e => e.output_module === "lore_templates");
    if (enrich.length === 0) return [];

    const sceneText = (mockSceneText || novel.scene.description || "").toLowerCase();
    const scored = enrich.map(e => {
      const excerpt = e.quoted_excerpt.toLowerCase();
      const terms = sceneText.split(/\s+/).filter(t => t.length > 2);
      let score = 0;
      for (const term of terms) {
        if (excerpt.includes(term)) score += 1;
      }
      return { ...e, score };
    });

    return scored
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(s => ({
        key: (s as any).quoted_excerpt.slice(0, 40).toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        content: (s as any).quoted_excerpt,
        triggers: [],
        persona_scope: (s as any).persona_scope as "game_master" | "shared",
        priority: s.score as number,
      }));
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

        // Apply enrichment if not already enriched
        if (g.enrichment.length === 0) {
          applyEnrichment(g, this.buildFingerprint.rulesetHash);
        }
      }
      if (data.seed) {
        this.prng.reseed(data.seed);
        this.sessionSeed = data.seed;
      }
      this.entityCounter = data.counter ?? 0;
      this.npcCounter = data.npcCounter ?? 0;
      if (data.persona !== undefined) this.activePersona = data.persona;
      if (data.fp) {
        const stored = data.fp;
        if (stored.rulesetHash && stored.rulesetHash !== this.buildFingerprint.rulesetHash) {
          console.warn(`[WARNING] Build fingerprint mismatch: ruleset hash changed (stored: ${stored.rulesetHash}, current: ${this.buildFingerprint.rulesetHash}). A rebuild occurred.`);
        }
        this.buildFingerprint = stored;
      }
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

function computeRulesetHash(): string {
  try {
    const rulesDir = process.env.TTRPG_RULESET_DIR || path.join(process.cwd(), "ruleset");
    if (!fs.existsSync(rulesDir)) return "unknown";
    const hash = crypto.createHash("sha256");
    const walkDir = (dir: string) => {
      const items = fs.readdirSync(dir, { withFileTypes: true });
      for (const item of items.sort((a, b) => a.name.localeCompare(b.name))) {
        const full = path.join(dir, item.name);
        if (item.isDirectory()) { walkDir(full); }
        else if (item.name.endsWith(".md")) { hash.update(fs.readFileSync(full, "utf-8")); }
      }
    };
    walkDir(rulesDir);
    return hash.digest("hex").slice(0, 16);
  } catch { return "unknown"; }
}
state.buildFingerprint.rulesetHash = computeRulesetHash();

state.loadRoster();
const novelSlug = process.env.TTRPG_NOVEL || process.env.TTRPG_GAME_ID;
if (process.env.TTRPG_GAME_ID && !process.env.TTRPG_NOVEL) {
  console.warn("[WARNING] TTRPG_GAME_ID is deprecated; use TTRPG_NOVEL instead.");
}
if (novelSlug) {
  const loaded = state.loadState(novelSlug);
  if (!loaded) state.getOrCreateNovel(novelSlug);
}
state.buildFingerprint.lastSpecReview = new Date().toISOString().slice(0, 10);
state.buildFingerprint.lastGauntlet = new Date().toISOString().slice(0, 10);
