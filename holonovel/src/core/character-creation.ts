// Ruleset-driven character creation (REQ-104, REQ-151, REQ-152, REQ-181,
// REQ-219, REQ-399).
//
// The host does not hard-code a ruleset's character rules. Character-creation
// data lives in the bound ruleset's package model under the reserved
// `character_creation` key (REQ-399a). Derived statistics are computed by a
// safe expression evaluator over ruleset-declared formulas (REQ-399b). When no
// ruleset is bound, or the bound package carries no character-creation data,
// creation degrades to a profile-only contract (REQ-219, REQ-399c).

import { createRng, rollWithRng, Rng } from "./rng.js";

// ── Ruleset-declared types ──────────────────────────────────────────────

export interface SpeciesData {
  name: string;
  size?: string;
  speed?: number;
  abilityAdjustments?: Record<string, number>;
  bonusFeat?: boolean;
  bonusTrainedSkill?: boolean;
  traits?: string[];
  [key: string]: any;
}

export interface ClassData {
  name: string;
  hitDie?: number;
  startingHp?: number;
  bab?: number;
  babType?: "good" | "poor";
  defenseBonuses?: Record<string, number>;
  classSkills?: string[];
  bonusTalents?: string[];
  startingFeats?: string[];
  prerequisites?: string;
  [key: string]: any;
}

export interface EquipmentItem {
  name: string;
  quantity?: number;
  source?: string;
}

export interface DerivedStatDef {
  key: string;
  label: string;
  section?: string;
  formula: string;
}

export interface StatMethodDef {
  dice?: string;          // e.g. "4d6"
  drop_lowest?: number;   // e.g. 1
  point_buy?: Record<number, number>;
  budget?: number;
  array?: number[];
}

// The `character_creation` block of a ruleset package's model (REQ-399a).
export interface CharacterRules {
  steps?: string[];
  ability_names?: string[];
  ability_modifier_formula?: string;
  stat_methods?: Record<string, StatMethodDef>;
  default_ability_scores?: number[];
  species?: Record<string, SpeciesData>;
  classes?: Record<string, ClassData>;
  prestige_classes?: Record<string, ClassData>;
  starting_equipment?: Record<string, (string | EquipmentItem)[]>;
  derived_stats?: DerivedStatDef[];
}

// ── Ability names / stat method (ruleset-driven with a neutral fallback) ──

export type StatMethod = string;

// Neutral fallback used only when a ruleset does not declare ability names.
export const ABILITY_NAMES = ["Strength", "Dexterity", "Constitution", "Intelligence", "Wisdom", "Charisma"] as const;
export type AbilityName = (typeof ABILITY_NAMES)[number];

export function abilityNames(rules?: CharacterRules): string[] {
  return rules?.ability_names?.length ? rules.ability_names : [...ABILITY_NAMES];
}

export function abilityModifier(score: number, rules?: CharacterRules): number {
  const expr = rules?.ability_modifier_formula ?? "floor((score - 10) / 2)";
  return evaluateFormula(expr, { score });
}

// ── Character build input ───────────────────────────────────────────────

export interface ClassLevel {
  className: string;
  levels: number;
}

export interface CharacterBuildInput {
  name: string;
  species: string;
  classLevels: ClassLevel[];
  abilityScores: Record<string, number>;
  trainedSkills?: string[];
  feats?: string[];
  talents?: string[];
  statMethod?: StatMethod;
  seed?: string;
  equipment?: string[];
}

// ── Safe formula evaluator (REQ-399b) ───────────────────────────────────
// Grammar: numeric literals, + - * /, parentheses, floor()/ceil()/min()/max(),
// and dotted identifiers (`ability.strength`, `ability_mod.strength`,
// `class_bonus.reflex`, `species.speed`) resolved against the context.

export interface EvalContext {
  level?: number;
  bab?: number;
  score?: number;
  ability?: Record<string, number>;
  ability_mod?: Record<string, number>;
  class_bonus?: Record<string, number>;
  species?: Record<string, any>;
}

export function evaluateFormula(expr: string, ctx: EvalContext = {}): number {
  const s = String(expr).trim();
  if (!s) throw new Error("Empty formula.");
  const parser = new FormulaParser(s, ctx);
  const value = parser.parseExpression();
  parser.skipWhitespace();
  if (!parser.atEnd()) throw new Error(`Unexpected token '${parser.peek()}' in formula.`);
  return value;
}

class FormulaParser {
  private pos = 0;
  constructor(private src: string, private ctx: EvalContext) {}

  atEnd(): boolean { return this.pos >= this.src.length; }
  peek(): string { return this.src[this.pos] ?? ""; }
  skipWhitespace(): void { while (this.pos < this.src.length && /\s/.test(this.src[this.pos])) this.pos++; }

  parseExpression(): number {
    let value = this.parseTerm();
    while (true) {
      this.skipWhitespace();
      const ch = this.peek();
      if (ch === "+") { this.pos++; value += this.parseTerm(); }
      else if (ch === "-") { this.pos++; value -= this.parseTerm(); }
      else break;
    }
    return value;
  }

  parseTerm(): number {
    let value = this.parseFactor();
    while (true) {
      this.skipWhitespace();
      const ch = this.peek();
      if (ch === "*") { this.pos++; value *= this.parseFactor(); }
      else if (ch === "/") { this.pos++; value /= this.parseFactor(); }
      else break;
    }
    return value;
  }

  parseFactor(): number {
    this.skipWhitespace();
    const ch = this.peek();
    if (ch === "(") {
      this.pos++;
      const v = this.parseExpression();
      this.skipWhitespace();
      if (this.peek() !== ")") throw new Error("Unbalanced parentheses in formula.");
      this.pos++;
      return v;
    }
    if (ch === "-") { this.pos++; return -this.parseFactor(); }
    if (ch === "+") { this.pos++; return this.parseFactor(); }
    if (/[0-9.]/.test(ch)) return this.parseNumber();
    if (/[a-zA-Z_]/.test(ch)) return this.parseIdentifierOrCall();
    throw new Error(`Unexpected character '${ch}' in formula.`);
  }

  parseNumber(): number {
    this.skipWhitespace();
    const m = /^[0-9]*\.?[0-9]+/.exec(this.src.slice(this.pos));
    if (!m) throw new Error("Invalid number in formula.");
    this.pos += m[0].length;
    return parseFloat(m[0]);
  }

  parseIdentifierOrCall(): number {
    let ident = this.parseIdent();
    // Dotted identifier: a.b.c
    while (this.peek() === ".") {
      this.pos++;
      ident += "." + this.parseIdent();
    }
    this.skipWhitespace();
    if (this.peek() === "(") {
      return this.parseCall(ident);
    }
    return this.resolveVar(ident);
  }

  parseCall(name: string): number {
    this.pos++; // consume '('
    const args: number[] = [];
    while (true) {
      this.skipWhitespace();
      if (this.peek() === ")") { this.pos++; break; }
      args.push(this.parseExpression());
      this.skipWhitespace();
      if (this.peek() === ",") { this.pos++; continue; }
      if (this.peek() === ")") { this.pos++; break; }
      throw new Error("Expected ',' or ')' in function call.");
    }
    switch (name.toLowerCase()) {
      case "floor": return Math.floor(args[0]);
      case "ceil": return Math.ceil(args[0]);
      case "min": return Math.min(...args);
      case "max": return Math.max(...args);
      default: throw new Error(`Unknown function '${name}' in formula.`);
    }
  }

  parseIdent(): string {
    const m = /^[a-zA-Z_][a-zA-Z0-9_]*/.exec(this.src.slice(this.pos));
    if (!m) throw new Error("Invalid identifier in formula.");
    this.pos += m[0].length;
    return m[0];
  }

  resolveVar(ident: string): number {
    const L = ident.toLowerCase();
    if (L === "level") { if (this.ctx.level == null) throw new Error("Formula references undefined 'level'."); return this.ctx.level; }
    if (L === "bab") { if (this.ctx.bab == null) throw new Error("Formula references undefined 'bab'."); return this.ctx.bab; }
    if (L === "score") { if (this.ctx.score == null) throw new Error("Formula references undefined 'score'."); return this.ctx.score; }
    // dotted refs: a.b
    const dot = ident.search(/[.]/);
    if (dot === -1) throw new Error(`Formula references undefined input '${ident}'.`);
    const ns = ident.slice(0, dot).toLowerCase();
    const key = ident.slice(dot + 1).toLowerCase();
    const lookup = (band: Record<string, any> | undefined): number => {
      if (!band) throw new Error(`Formula references undefined input '${ident}'.`);
      const v = band[key] ?? band[ident.slice(dot + 1)];
      if (v == null) throw new Error(`Formula references undefined input '${ident}'.`);
      return Number(v);
    };
    if (ns === "ability") return lookup(this.ctx.ability);
    if (ns === "ability_mod") return lookup(this.ctx.ability_mod);
    if (ns === "class_bonus") return lookup(this.ctx.class_bonus);
    if (ns === "species") return lookup(this.ctx.species);
    throw new Error(`Formula references undefined input '${ident}'.`);
  }
}

// ── Generation helpers ──────────────────────────────────────────────────

export function generateAbilityScores(method: StatMethod, rules?: CharacterRules, seed?: string): number[] {
  const names = abilityNames(rules);
  const def = rules?.stat_methods?.[method];
  if (method === "roll_4d6" || (def?.dice && method !== "standard" && method !== "planned")) {
    const m = (def?.dice ?? "4d6").match(/^(\d+)d(\d+)$/i);
    const count = m ? parseInt(m[1], 10) : 4;
    const sides = m ? parseInt(m[2], 10) : 6;
    const drop = def?.drop_lowest ?? 1;
    const rng = createRng(seed ?? "0");
    const scores: number[] = [];
    for (let i = 0; i < names.length; i++) {
      scores.push(rollWithRng(rng, count, sides, drop).total);
    }
    return scores;
  }
  if (method === "standard" || (def?.array && !def?.dice)) {
    return [...(def?.array ?? rules?.default_ability_scores ?? [15, 14, 13, 12, 10, 8])];
  }
  // planned point-buy: neutral baseline (REQ-104b; documented heuristic).
  return [...(rules?.default_ability_scores ?? [15, 14, 13, 12, 10, 8])];
}

export function getSpecies(rules: CharacterRules, name: string): SpeciesData | undefined {
  const s = rules.species;
  if (!s) return undefined;
  return s[name.trim().toLowerCase()];
}

export function getClassData(rules: CharacterRules, name: string): ClassData | undefined {
  const key = name.trim().toLowerCase();
  if (rules.classes?.[key]) return rules.classes[key];
  if (rules.prestige_classes?.[key]) return rules.prestige_classes[key];
  return undefined;
}

export function applySpeciesAdjustments(raw: Record<string, number>, speciesName: string, rules?: CharacterRules): Record<string, number> {
  const species = rules ? getSpecies(rules, speciesName) : undefined;
  if (!species) return { ...raw };
  const out = { ...raw };
  for (const [ability, adj] of Object.entries(species.abilityAdjustments || {})) {
    // Case-insensitive ability-name match so ruleset data (which may use any
    // capitalization) aligns with the canonical ability names.
    const target = Object.keys(out).find((k) => k.toLowerCase() === ability.toLowerCase()) ?? ability;
    out[target] = (out[target] ?? 10) + (adj as number);
  }
  return out;
}

// ── Derived statistics (formula-driven, REQ-399b) ────────────────────────

export interface DerivedResult {
  values: Record<string, number>;
  labels: Record<string, string>;
  sections: Record<string, string>;
  order: string[];
}

export function computeDerived(build: CharacterBuildInput, rules: CharacterRules): DerivedResult {
  const names = abilityNames(rules);
  const raw = build.abilityScores;
  const systemSpecies = getSpecies(rules, build.species) ?? { name: build.species, size: "Medium", speed: 6 } as SpeciesData;

  let level = 0;
  let bab = 0;
  const classBonus: Record<string, number> = {};
  const granted = new Set<string>();

  for (const cl of build.classLevels) {
    const key = cl.className.trim().toLowerCase();
    const cd = getClassData(rules, key);
    if (!cd) continue;
    bab += cd.babType === "good" ? cl.levels * (cd.bab ?? 1) : (cd.babType === "poor" ? Math.floor(cl.levels / 2) : cl.levels * (cd.bab ?? 1));
    level += cl.levels;
    if (!granted.has(key)) {
      for (const [dk, dv] of Object.entries(cd.defenseBonuses || {})) {
        classBonus[dk] = (classBonus[dk] ?? 0) + (dv as number);
      }
      granted.add(key);
    }
  }

  // Build the evaluation context.
  const ability: Record<string, number> = {};
  const ability_mod: Record<string, number> = {};
  for (const n of names) {
    const lower = n.toLowerCase();
    ability[lower] = raw[lower] ?? raw[n] ?? 10;
    ability_mod[lower] = abilityModifier(ability[lower], rules);
  }
  const speciesCtx: Record<string, any> = {};
  Object.assign(speciesCtx, systemSpecies);

  const ctx: EvalContext = { level, bab, ability, ability_mod, class_bonus: classBonus, species: speciesCtx };

  const values: Record<string, number> = {};
  const labels: Record<string, string> = {};
  const sections: Record<string, string> = {};
  const order: string[] = [];

  for (const def of rules.derived_stats || []) {
    const value = evaluateFormula(def.formula, ctx);
    values[def.key] = value;
    labels[def.key] = def.label ?? def.key;
    sections[def.key] = def.section ?? "derived";
    order.push(def.key);
  }

  // Level is a primitive available to every derived-stat formula.
  values["level"] = level;

  return { values, labels, sections, order };
}

export function startingEquipmentFor(classLevels: ClassLevel[], rules?: CharacterRules): EquipmentItem[] {
  const out: EquipmentItem[] = [];
  const seen = new Set<string>();
  for (const cl of classLevels) {
    const key = cl.className.trim().toLowerCase();
    const list = (rules?.starting_equipment ?? {})[key];
    if (!list) continue;
    for (const item of list) {
      const entry: EquipmentItem = typeof item === "string" ? { name: item, quantity: 1 } : { name: item.name, quantity: item.quantity ?? 1, source: item.source };
      if (seen.has(entry.name)) continue;
      seen.add(entry.name);
      out.push(entry);
    }
  }
  return out;
}

// ── Creation workflow (REQ-151) ─────────────────────────────────────────

export const CREATION_STEPS = ["name", "species", "classes", "ability_scores", "skills", "equipment"] as const;
export type CreationStep = (typeof CREATION_STEPS)[number];

export function creationSteps(rules?: CharacterRules): string[] {
  return rules?.steps?.length ? rules.steps : [...CREATION_STEPS];
}

export interface CreationWorkflowState {
  kind: "character_creation";
  stepIndex: number;
  rules: CharacterRules | null;
  answers: Partial<{
    name: string;
    species: string;
    classLevels: ClassLevel[];
    statMethod: StatMethod;
    abilityScores: Record<string, number>;
    trainedSkills: string[];
    feats: string[];
    talents: string[];
    equipment: string[];
  }>;
}

export function creationStepPrompt(state: CreationWorkflowState): string {
  const steps = creationSteps(state.rules ?? undefined);
  const step = steps[state.stepIndex] ?? "name";
  const names = abilityNames(state.rules ?? undefined);
  const speciesOptions = state.rules?.species
    ? Object.values(state.rules.species).map((s) => s.name).join(", ")
    : "any";
  const classOptions = state.rules?.classes
    ? Object.values(state.rules.classes).map((c) => c.name).join(", ")
    : "the ruleset's classes";
  const idx = state.stepIndex + 1;
  const total = steps.length;
  switch (step) {
    case "name": return `Character creation (${idx}/${total}): enter the character's name.`;
    case "species": return `Character creation (${idx}/${total}): choose a species. Options: ${speciesOptions}.`;
    case "classes": return `Character creation (${idx}/${total}): choose class levels, e.g. '${classOptions.split(",")[0] ?? "Class"} 1'. Classes: ${classOptions}.`;
    case "ability_scores": return `Character creation (${idx}/${total}): provide ability scores (${names.join(", ")}), e.g. '${names.length ? names.map(() => 10).join(" ") : ""}'. Species adjustments are applied automatically.`;
    case "skills": return `Character creation (${idx}/${total}): list trained skills, e.g. 'Perception, Persuasion'.`;
    case "equipment": return `Character creation (${idx}/${total}): list starting equipment (or leave blank for class defaults).`;
    default: return `Character creation (${idx}/${total}): enter ${step}.`;
  }
}
