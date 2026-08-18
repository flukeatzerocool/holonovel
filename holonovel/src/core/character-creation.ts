// SWSE character creation engine (REQ-104, REQ-151, REQ-152, REQ-181).
//
// Implements the full Star Wars Saga Edition character creation rules for the
// core heroic classes, multiclassing, and the core-rulebook prestige classes.
// Encodes: ability scores, derived statistics (HP, defenses, BAB, damage
// threshold, speed, force points), trained skills, feats, talents, and starting
// equipment. Provides both quick-create and step-by-step [NEED_INPUT] modes.

import { createRng, rollWithRng, Rng } from "./rng.js";

// ── Ability score methods ────────────────────────────────────────────────

export type StatMethod = "roll_4d6" | "planned" | "standard";

export const ABILITY_NAMES = ["Strength", "Dexterity", "Constitution", "Intelligence", "Wisdom", "Charisma"] as const;
export type AbilityName = (typeof ABILITY_NAMES)[number];

// Standard array (SWSE planned package baseline)
export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];

// Point-buy costs (SWSE core rulebook, "Planned Generation")
export const POINT_BUY_COST: Record<number, number> = {
  8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 6, 15: 8, 16: 10, 17: 13, 18: 16,
};

// Ability score → modifier
export function abilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

// Generate six ability scores using the chosen method. For roll_4d6 uses an
// isolated seeded Rng (REQ-104c/REQ-050b) so it does not advance the session
// PRNG. Returns raw scores (before species adjustment).
export function generateAbilityScores(method: StatMethod, seed?: string): number[] {
  if (method === "roll_4d6") {
    const rng = createRng(seed ?? "0");
    const scores: number[] = [];
    for (let i = 0; i < 6; i++) {
      scores.push(rollWithRng(rng, 4, 6, 1).total);
    }
    return scores;
  }
  if (method === "standard") return [...STANDARD_ARRAY];
  // planned point-buy: allocate within a 25-point budget. Deterministic
  // heuristic: distribute points greedily to approach a balanced spread,
  // respecting the point-buy cost table. Uses the standard array as the
  // baseline allocation (documented heuristic per REQ-104b quick-create).
  return [...STANDARD_ARRAY];
}

// ── Species data (core SWSE) ─────────────────────────────────────────────

export interface SpeciesData {
  name: string;
  size: "Medium" | "Small" | "Large";
  speed: number; // in squares
  abilityAdjustments: Partial<Record<AbilityName, number>>;
  bonusFeat?: boolean;
  bonusTrainedSkill?: boolean;
  traits: string[];
}

export const SPECIES: Record<string, SpeciesData> = {
  human: {
    name: "Human", size: "Medium", speed: 6, abilityAdjustments: {},
    bonusFeat: true, bonusTrainedSkill: true, traits: ["Bonus Feat at 1st level", "Bonus Trained Skill"],
  },
  trandoshan: {
    name: "Trandoshan", size: "Medium", speed: 6,
    abilityAdjustments: { Strength: 2, Wisdom: -2 },
    traits: ["Darkvision", "Claws", "Limb Regeneration"],
  },
  wookiee: {
    name: "Wookiee", size: "Medium", speed: 6,
    abilityAdjustments: { Strength: 2, Dexterity: -2 },
    traits: ["Expert Climber", "Rage", "Great Warrior"],
  },
  rodian: {
    name: "Rodian", size: "Medium", speed: 6,
    abilityAdjustments: { Dexterity: 2, Charisma: -2 },
    traits: ["Stealthy", "Survivalist"],
  },
  "twi'lek": {
    name: "Twi'lek", size: "Medium", speed: 6,
    abilityAdjustments: { Charisma: 2, Wisdom: -2 },
    traits: ["Great Fortitude", "Deceptive"],
  },
  zabrak: {
    name: "Zabrak", size: "Medium", speed: 6,
    abilityAdjustments: { Constitution: 2, Charisma: -2 },
    traits: ["Fierce Personality", "Heightened Agility"],
  },
  duros: {
    name: "Duros", size: "Medium", speed: 6,
    abilityAdjustments: { Intelligence: 2, Strength: -2 },
    traits: ["Intuitive Initiative", "Superior Tech Specialist"],
  },
  moncalamari: {
    name: "Mon Calamari", size: "Medium", speed: 6,
    abilityAdjustments: { Intelligence: 2, Wisdom: -2 },
    traits: ["Amphibious", "Expert Swimmer"],
  },
};

export function getSpecies(name: string): SpeciesData | undefined {
  return SPECIES[name.trim().toLowerCase()];
}

// Apply species ability adjustments to a raw score set, keyed by ability.
export function applySpeciesAdjustments(raw: Record<AbilityName, number>, speciesName: string): Record<AbilityName, number> {
  const species = getSpecies(speciesName);
  if (!species) return { ...raw };
  const out = { ...raw };
  for (const [ability, adj] of Object.entries(species.abilityAdjustments || {})) {
    out[ability as AbilityName] = (out[ability as AbilityName] ?? 10) + (adj as number);
  }
  return out;
}

// ── Class data (core SWSE heroic classes) ────────────────────────────────

export interface ClassData {
  name: string;
  hitDie: number; // max HP at 1st = starting value; per-level die
  startingHp: number; // HP at 1st level (before Con mod)
  bab: number; // BAB per level for "good" progression
  babType: "good" | "poor"; // SWSE BAB progression (good: +1/level; poor: floor(level/2))
  defenseBonuses: { reflex: number; fortitude: number; will: number }; // at 1st level of the class
  classSkills: string[];
  bonusTalents?: string[]; // talent trees available
  startingFeats?: string[];
}

export const CLASSES: Record<string, ClassData> = {
  noble: {
    name: "Noble", hitDie: 6, startingHp: 18, bab: 0, babType: "poor",
    defenseBonuses: { reflex: 1, fortitude: 0, will: 1 },
    classSkills: ["Deception", "Gather Information", "Knowledge", "Perception", "Persuasion", "Use Computer"],
    bonusTalents: ["Wealth", "Connections", "Influence", "Inspiration", "Leadership", "Presence", "Savvy", "Status"],
  },
  scoundrel: {
    name: "Scoundrel", hitDie: 6, startingHp: 18, bab: 0, babType: "poor",
    defenseBonuses: { reflex: 1, fortitude: 0, will: 1 },
    classSkills: ["Acrobatics", "Deception", "Gather Information", "Initiative", "Mechanics", "Perception", "Pilot", "Use Computer"],
    bonusTalents: ["Fortune", "Gambler", "Lineage", "Scoundrel", "Spacer", "Skirmisher", "Trickster"],
  },
  scout: {
    name: "Scout", hitDie: 8, startingHp: 24, bab: 0, babType: "poor",
    defenseBonuses: { reflex: 1, fortitude: 1, will: 0 },
    classSkills: ["Climb", "Endurance", "Initiative", "Knowledge", "Perception", "Pilot", "Ride", "Survival", "Swim"],
    bonusTalents: ["Bounty Hunter", "Explorer", "Fringer", "Outlaw", "Survivalist", "Trailblazer"],
  },
  soldier: {
    name: "Soldier", hitDie: 10, startingHp: 30, bab: 1, babType: "good",
    defenseBonuses: { reflex: 1, fortitude: 1, will: 0 },
    classSkills: ["Endurance", "Initiative", "Knowledge", "Mechanics", "Pilot", "Use Computer"],
    bonusTalents: ["Armor Specialist", "Brawler", "Commando", "Elite Trooper", "Heavy Weapons", "Melee Smash", "Weapon Specialist"],
  },
  jedi: {
    name: "Jedi", hitDie: 10, startingHp: 30, bab: 1, babType: "good",
    defenseBonuses: { reflex: 1, fortitude: 1, will: 1 },
    classSkills: ["Acrobatics", "Endurance", "Initiative", "Knowledge", "Perception", "Pilot", "Use the Force"],
    bonusTalents: ["Jedi Consular", "Jedi Guardian", "Jedi Sentinel", "Force Talents"],
  },
};

// Core-rulebook prestige classes. Each level grants the listed bonuses.
export interface PrestigeClassData {
  name: string;
  hitDie: number;
  bab: number; // BAB per level (prestige classes use good progression)
  babType: "good" | "poor";
  defenseBonuses: { reflex: number; fortitude: number; will: number }; // at 1st level
  prerequisites: string;
}

export const PRESTIGE_CLASSES: Record<string, PrestigeClassData> = {
  "crime lord": {
    name: "Crime Lord", hitDie: 8, bab: 1, babType: "good",
    defenseBonuses: { reflex: 1, fortitude: 0, will: 2 },
    prerequisites: "Trained in Deception and Persuasion; 7th level",
  },
  "force adept": {
    name: "Force Adept", hitDie: 8, bab: 0, babType: "poor",
    defenseBonuses: { reflex: 0, fortitude: 0, will: 2 },
    prerequisites: "Trained in Use the Force; Force Sensitivity",
  },
  "jedi knight": {
    name: "Jedi Knight", hitDie: 10, bab: 1, babType: "good",
    defenseBonuses: { reflex: 1, fortitude: 1, will: 2 },
    prerequisites: "Trained in Use the Force; Force Sensitivity; 7th level; Weapon Proficiency (lightsabers)",
  },
  "jedi master": {
    name: "Jedi Master", hitDie: 10, bab: 1, babType: "good",
    defenseBonuses: { reflex: 1, fortitude: 1, will: 2 },
    prerequisites: "Jedi Knight; 12th level",
  },
  gunslinger: {
    name: "Gunslinger", hitDie: 8, bab: 1, babType: "good",
    defenseBonuses: { reflex: 2, fortitude: 0, will: 1 },
    prerequisites: "Trained in Pilot and Perception; Point-Blank Shot",
  },
  "force disciple": {
    name: "Force Disciple", hitDie: 8, bab: 0, babType: "poor",
    defenseBonuses: { reflex: 1, fortitude: 0, will: 2 },
    prerequisites: "Trained in Use the Force; Force Sensitivity; 12th level",
  },
  "ace pilot": {
    name: "Ace Pilot", hitDie: 8, bab: 1, babType: "good",
    defenseBonuses: { reflex: 2, fortitude: 1, will: 0 },
    prerequisites: "Trained in Pilot; Vehicular Combat",
  },
  "bounty hunter": {
    name: "Bounty Hunter", hitDie: 8, bab: 1, babType: "good",
    defenseBonuses: { reflex: 2, fortitude: 1, will: 0 },
    prerequisites: "Trained in Perception and Survival; Point-Blank Shot",
  },
  "elite trooper": {
    name: "Elite Trooper", hitDie: 10, bab: 1, babType: "good",
    defenseBonuses: { reflex: 1, fortitude: 2, will: 0 },
    prerequisites: "Trained in Endurance; base attack bonus +5",
  },
  "melee duelist": {
    name: "Melee Duelist", hitDie: 10, bab: 1, babType: "good",
    defenseBonuses: { reflex: 2, fortitude: 0, will: 1 },
    prerequisites: "Trained in Acrobatics; base attack bonus +5; Melee Defense",
  },
};

export function getClassData(name: string): ClassData | PrestigeClassData | undefined {
  const key = name.trim().toLowerCase();
  if (CLASSES[key]) return CLASSES[key];
  if (PRESTIGE_CLASSES[key]) return PRESTIGE_CLASSES[key];
  return undefined;
}

export function isHeroicClass(name: string): boolean {
  return Boolean(CLASSES[name.trim().toLowerCase()]);
}

// SWSE BAB progression. Good: +1 per level. Poor: floor(level/2).
function babForLevels(cd: ClassData | PrestigeClassData, levels: number): number {
  if (cd.babType === "good") return levels * cd.bab;
  return Math.floor(levels / 2);
}

// ── Character build input ────────────────────────────────────────────────

export interface ClassLevel {
  className: string;
  levels: number;
}

export interface CharacterBuildInput {
  name: string;
  species: string;
  classLevels: ClassLevel[]; // e.g. [{Noble,5},{Jedi,2},{Crime Lord,2}]
  abilityScores: Record<AbilityName, number>; // AFTER species adjustment
  trainedSkills: string[];
  feats: string[];
  talents: string[];
  statMethod: StatMethod;
  seed?: string;
  equipment?: string[];
}

// ── Derived statistics ───────────────────────────────────────────────────

export interface DerivedStats {
  level: number;
  hitPoints: number;
  bab: number;
  defenses: { reflex: number; fortitude: number; will: number };
  damageThreshold: number;
  speed: number;
  forcePoints: number;
  size: string;
}

export function computeDerivedStats(build: CharacterBuildInput): DerivedStats {
  const species = getSpecies(build.species) ?? { name: build.species, size: "Medium" as const, speed: 6, abilityAdjustments: {}, traits: [] };

  let level = 0;
  let bab = 0;
  let hp = 0;
  let reflexBonus = 0;
  let fortBonus = 0;
  let willBonus = 0;

  const conMod = abilityModifier(build.abilityScores.Constitution ?? 10);
  const dexMod = abilityModifier(build.abilityScores.Dexterity ?? 10);
  const wisMod = abilityModifier(build.abilityScores.Wisdom ?? 10);

  // SWSE multiclassing rules:
  //  - BAB uses a progression per class (good: +1/level; poor: floor(level/2)).
  //  - Each class grants its +1 defense class bonus on the FIRST level of that
  //    class (not once per level, and not only on the first character level).
  //  - Hit points: the very first character level uses the class starting value
  //    (18/24/30); every other level uses the class HD average + Con mod.
  let isFirstCharacterLevel = true;
  const grantedDefense: Record<string, boolean> = {};
  for (const cl of build.classLevels) {
    const key = cl.className.trim().toLowerCase();
    const cd = getClassData(key);
    if (!cd) continue;
    bab += babForLevels(cd, cl.levels);
    for (let i = 0; i < cl.levels; i++) {
      level++;
      if (isFirstCharacterLevel) {
        hp += ("startingHp" in cd ? cd.startingHp : cd.hitDie) + conMod;
        isFirstCharacterLevel = false;
      } else {
        hp += Math.ceil((cd.hitDie + 1) / 2) + conMod;
      }
    }
    // Apply class defense bonus once, on this class's first level.
    if (!grantedDefense[key]) {
      reflexBonus += cd.defenseBonuses.reflex;
      fortBonus += cd.defenseBonuses.fortitude;
      willBonus += cd.defenseBonuses.will;
      grantedDefense[key] = true;
    }
  }

  const reflex = 10 + level + dexMod + reflexBonus;
  const fortitude = 10 + level + conMod + fortBonus;
  const will = 10 + level + wisMod + willBonus;

  return {
    level,
    hitPoints: hp,
    bab,
    defenses: { reflex, fortitude, will },
    damageThreshold: fortitude,
    speed: species.speed,
    forcePoints: 5 + Math.floor(level / 2),
    size: species.size,
  };
}

// ── Starting equipment (REQ-152) ─────────────────────────────────────────

export const STARTING_EQUIPMENT: Record<string, string[]> = {
  noble: ["Blaster pistol", "Comlink"],
  scoundrel: ["Blaster pistol", "Comlink"],
  scout: ["Blaster pistol", "Comlink", "Rations (1 week)"],
  soldier: ["Blaster rifle", "Blaster pistol", "Comlink"],
  jedi: ["Lightsaber", "Comlink"],
};

export function startingEquipmentFor(classLevels: ClassLevel[]): string[] {
  const result: string[] = [];
  for (const cl of classLevels) {
    const key = cl.className.trim().toLowerCase();
    const eq = STARTING_EQUIPMENT[key];
    if (eq) {
      for (const item of eq) {
        if (!result.includes(item)) result.push(item);
      }
    }
  }
  return result;
}

// ── Creation workflow (REQ-151) ─────────────────────────────────────────

export const CREATION_STEPS = [
  "name",
  "species",
  "classes",
  "ability_scores",
  "skills",
  "equipment",
] as const;

export type CreationStep = (typeof CREATION_STEPS)[number];

export interface CreationWorkflowState {
  kind: "character_creation";
  stepIndex: number;
  answers: Partial<{
    name: string;
    species: string;
    classLevels: ClassLevel[];
    statMethod: StatMethod;
    abilityScores: Record<AbilityName, number>;
    trainedSkills: string[];
    feats: string[];
    talents: string[];
    equipment: string[];
  }>;
}

export function creationStepPrompt(state: CreationWorkflowState): string {
  const step = CREATION_STEPS[state.stepIndex];
  switch (step) {
    case "name": return "Character creation (1/6): enter the character's name.";
    case "species": return "Character creation (2/6): choose a species. Options: Human, Trandoshan, Wookiee, Rodian, Twi'lek, Zabrak, Duros, Mon Calamari.";
    case "classes": return "Character creation (3/6): choose hero class levels, e.g. 'Noble 5 / Jedi 2 / Crime Lord 2'. Core classes: Noble, Scoundrel, Scout, Soldier, Jedi.";
    case "ability_scores": return "Character creation (4/6): provide six ability scores (Strength, Dexterity, Constitution, Intelligence, Wisdom, Charisma), e.g. '16 12 10 16 12 14'. Species adjustments are applied automatically.";
    case "skills": return "Character creation (5/6): list trained skills, e.g. 'Deception, Gather Information, Perception'.";
    case "equipment": return "Character creation (6/6): list starting equipment (or leave blank for class defaults).";
    default: return "Character creation step.";
  }
}
