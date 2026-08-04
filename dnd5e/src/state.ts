// State management: roster, game entities, snapshots, audit log, persona
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
}

export interface NPCEntity {
  id: string;
  name: string;
  stats: Partial<Record<AbilityScore, number>>;
  ac: number;
  hp: { max: number; current: number };
  speed: number;
  conditions: string[];
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

export interface GameState {
  entities: Record<string, DnDEntity>;
  npcs: Record<string, NPCEntity>;
  combat: CombatState | null;
  auditLog: AuditEntry[];
  sceneState: string;
  activeEntityId: string | null;
}

export interface Snapshot {
  timestamp: string;
  entities: Record<string, DnDEntity>;
  combat: CombatState | null;
}

export type Persona = "player" | "game_master";

export interface WorkflowState {
  persona: Persona;
  decisionQueue: { question: string; options: string[] }[];
  preWorkflowSnapshot: Snapshot | null;
  characterDraft: Partial<DnDEntity> | null;
}

export class StateManager {
  _roster: Record<string, DnDEntity> = {};
  _games: Record<string, GameState> = {};
  _activeGameId: string | null = null;
  public prng: PRNG;
  public sessionSeed: string | null = null;
  private personaStacks: Record<Persona, Snapshot[]> = { player: [], game_master: [] };
  public activePersona: Persona = "player";
  public workflow: WorkflowState | null = null;
  public dataDir: string;
  private entityCounter = 0;
  private npcCounter = 0;

  get activeGameId(): string | null { return this._activeGameId; }

  constructor(seed: string, dataDir: string) {
    this.prng = new PRNG(seed);
    this.dataDir = dataDir;
  }

  setPersona(p: Persona): void { this.activePersona = p; }

  getPersonaSnapshots(): Snapshot[] { return this.personaStacks[this.activePersona]; }

  getActiveGame(): GameState | null {
    if (!this._activeGameId) return null;
    return this._games[this._activeGameId] ?? null;
  }

  getOrCreateGame(gameId: string): GameState {
    this._activeGameId = gameId;
    if (!this._games[gameId]) {
      this._games[gameId] = {
        entities: {}, npcs: {}, combat: null, auditLog: [],
        sceneState: "", activeEntityId: null,
      };
    }
    return this._games[gameId];
  }

  endGame(): void {
    if (this._activeGameId) {
      delete this._games[this._activeGameId];
      this._activeGameId = null;
      this.personaStacks = { player: [], game_master: [] };
    }
  }

  snapshot(): void {
    const game = this.getActiveGame();
    if (!game) return;
    const snap: Snapshot = {
      timestamp: new Date().toISOString(),
      entities: JSON.parse(JSON.stringify(game.entities)),
      combat: game.combat ? JSON.parse(JSON.stringify(game.combat)) : null,
    };
    this.personaStacks[this.activePersona].push(snap);
    if (this._activeGameId) this.saveState(this._activeGameId);
  }

  undo(): boolean {
    const stack = this.personaStacks[this.activePersona];
    if (stack.length === 0) return false;
    stack.pop();
    const prev = stack[stack.length - 1];
    const game = this.getActiveGame();
    if (!game) return false;
    if (prev) {
      game.entities = JSON.parse(JSON.stringify(prev.entities));
      game.combat = prev.combat ? JSON.parse(JSON.stringify(prev.combat)) : null;
    }
    if (this._activeGameId) this.saveState(this._activeGameId);
    return true;
  }

  audit(persona: string, tool: string, args: Record<string, unknown>, result: string): void {
    const game = this.getActiveGame();
    if (!game) return;
    game.auditLog.push({ timestamp: new Date().toISOString(), persona, tool, args, result });
  }

  nextEntityId(): string { return `e${++this.entityCounter}`; }
  nextNpcId(): string { return `npc${++this.npcCounter}`; }

  saveState(gameId: string): void {
    try {
      fs.mkdirSync(this.dataDir, { recursive: true });
      const stateFile = path.join(this.dataDir, `game_${gameId}.json`);
      fs.writeFileSync(stateFile, JSON.stringify(this._games[gameId], null, 2));
    } catch (_) { /* silent persistence failure */ }
  }

  loadState(gameId: string): boolean {
    try {
      const stateFile = path.join(this.dataDir, `game_${gameId}.json`);
      if (!fs.existsSync(stateFile)) return false;
      this._games[gameId] = JSON.parse(fs.readFileSync(stateFile, "utf-8"));
      this._activeGameId = gameId;
      return true;
    } catch (_) { return false; }
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
    if (this._activeGameId) this.saveState(this._activeGameId);
    return copy;
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
