// Structured D&D 5e ruleset data — extracted from ruleset/ Markdown
// REQ-011, REQ-057, REQ-059, REQ-111

import * as fs from "fs";
import * as path from "path";

// ── Ability Scores ────────────────────────────────────────────────
// Source: 06_Gameplay/Using_Ability_Scores.md § "Ability Scores and Modifiers"

export const ABILITY_SCORES = [
  "strength", "dexterity", "constitution",
  "intelligence", "wisdom", "charisma"
] as const;
export type AbilityScore = typeof ABILITY_SCORES[number];

// ── Skills ─────────────────────────────────────────────────────────
// Source: 06_Gameplay/Using_Ability_Scores.md § "Skills"

export const SKILL_MAP: Record<AbilityScore, string[]> = {
  strength: ["athletics"],
  dexterity: ["acrobatics", "sleight_of_hand", "stealth"],
  constitution: [],
  intelligence: ["arcana", "history", "investigation", "nature", "religion"],
  wisdom: ["animal_handling", "insight", "medicine", "perception", "survival"],
  charisma: ["deception", "intimidation", "performance", "persuasion"],
};

export const SKILLS = Object.values(SKILL_MAP).flat();

// ── Conditions ─────────────────────────────────────────────────────
// Source: 08_Gamemastering/Conditions.md

export const CONDITIONS = [
  "blinded", "charmed", "deafened", "frightened",
  "grappled", "incapacitated", "invisible", "paralyzed",
  "petrified", "poisoned", "prone", "restrained",
  "stunned", "unconscious"
] as const;
export type ConditionName = typeof CONDITIONS[number];

// Exhaustion is a special condition with levels 1-6
// Source: 08_Gamemastering/Conditions.md § "Exhaustion"
export const EXHAUSTION_EFFECTS = [
  "Disadvantage on ability checks",
  "Speed halved",
  "Disadvantage on attack rolls and saving throws",
  "Hit point maximum halved",
  "Speed reduced to 0",
  "Death",
] as const;

// ── Damage Types ──────────────────────────────────────────────────
// Source: 06_Gameplay/Order_of_Combat.md § "Damage Types"

export const DAMAGE_TYPES = [
  "acid", "bludgeoning", "cold", "fire", "force",
  "lightning", "necrotic", "piercing", "poison",
  "psychic", "radiant", "slashing", "thunder"
] as const;
export type DamageType = typeof DAMAGE_TYPES[number];

// ── Races ──────────────────────────────────────────────────────────
// Source: 01_Races/Races_Each/

export const RACES: Record<string, RaceData> = {
  dwarf: {
    name: "Dwarf",
    ability_increases: { constitution: 2 },
    size: "Medium",
    speed: 25,
    darkvision: 60,
    traits: ["Dwarven Resilience", "Dwarven Combat Training", "Tool Proficiency", "Stonecunning"],
    languages: ["Common", "Dwarvish"],
    source: "01_Races/Races_Each/Dwarf.md",
    subraces: {
      hill_dwarf: { name: "Hill Dwarf", ability_increases: { wisdom: 1 }, traits: ["Dwarven Toughness"] },
    },
  },
  elf: {
    name: "Elf",
    ability_increases: { dexterity: 2 },
    size: "Medium",
    speed: 30,
    darkvision: 60,
    traits: ["Keen Senses", "Fey Ancestry", "Trance"],
    languages: ["Common", "Elvish"],
    source: "01_Races/Races_Each/Elf.md",
    subraces: {
      high_elf: { name: "High Elf", ability_increases: { intelligence: 1 }, traits: ["Elf Weapon Training", "Cantrip"] },
    },
  },
  halfling: {
    name: "Halfling",
    ability_increases: { dexterity: 2 },
    size: "Small",
    speed: 25,
    darkvision: 0,
    traits: ["Lucky", "Brave", "Halfling Nimbleness"],
    languages: ["Common", "Halfling"],
    source: "01_Races/Races_Each/Halfling.md",
    subraces: {
      lightfoot: { name: "Lightfoot Halfling", ability_increases: { charisma: 1 }, traits: ["Naturally Stealthy"] },
    },
  },
  human: {
    name: "Human",
    ability_increases: { strength: 1, dexterity: 1, constitution: 1, intelligence: 1, wisdom: 1, charisma: 1 },
    size: "Medium",
    speed: 30,
    darkvision: 0,
    traits: [],
    languages: ["Common"],
    source: "01_Races/Races_Each/Human.md",
    subraces: {},
  },
  dragonborn: {
    name: "Dragonborn",
    ability_increases: { strength: 2, charisma: 1 },
    size: "Medium",
    speed: 30,
    darkvision: 0,
    traits: ["Draconic Ancestry", "Breath Weapon", "Damage Resistance"],
    languages: ["Common", "Draconic"],
    source: "01_Races/Races_Each/Dragonborn.md",
    subraces: {},
  },
  gnome: {
    name: "Gnome",
    ability_increases: { intelligence: 2 },
    size: "Small",
    speed: 25,
    darkvision: 60,
    traits: ["Gnome Cunning"],
    languages: ["Common", "Gnomish"],
    source: "01_Races/Races_Each/Gnome.md",
    subraces: {
      rock_gnome: { name: "Rock Gnome", ability_increases: { constitution: 1 }, traits: ["Artificer's Lore", "Tinker"] },
    },
  },
  "half-elf": {
    name: "Half-Elf",
    ability_increases: { charisma: 2 },
    size: "Medium",
    speed: 30,
    darkvision: 60,
    traits: ["Fey Ancestry", "Skill Versatility"],
    languages: ["Common", "Elvish"],
    source: "01_Races/Races_Each/Half-Elf.md",
    subraces: {},
  },
  "half-orc": {
    name: "Half-Orc",
    ability_increases: { strength: 2, constitution: 1 },
    size: "Medium",
    speed: 30,
    darkvision: 60,
    traits: ["Menacing", "Relentless Endurance", "Savage Attacks"],
    languages: ["Common", "Orc"],
    source: "01_Races/Races_Each/Half-Orc.md",
    subraces: {},
  },
  tiefling: {
    name: "Tiefling",
    ability_increases: { intelligence: 1, charisma: 2 },
    size: "Medium",
    speed: 30,
    darkvision: 60,
    traits: ["Hellish Resistance", "Infernal Legacy"],
    languages: ["Common", "Infernal"],
    source: "01_Races/Races_Each/Tiefling.md",
    subraces: {},
  },
};

export interface RaceData {
  name: string;
  ability_increases: Partial<Record<AbilityScore, number>>;
  size: string;
  speed: number;
  darkvision: number;
  traits: string[];
  languages: string[];
  source: string;
  subraces: Record<string, SubraceData>;
}

export interface SubraceData {
  name: string;
  ability_increases: Partial<Record<AbilityScore, number>>;
  traits: string[];
}

// ── Classes ───────────────────────────────────────────────────────
// Source: 02_Classes/

export interface ClassData {
  name: string;
  hit_dice: number;
  hp_1st: number;
  proficiencies: { armor: string[]; weapons: string[]; tools: string[]; saves: AbilityScore[]; skills: string[] };
  skill_choices: number;
  spellcasting_ability?: AbilityScore;
  source: string;
  features: Record<number, string[]>;
  subclasses: Record<string, SubclassData>;
}

export interface SubclassData {
  name: string;
  features: Record<number, string[]>;
}

export const CLASSES: Record<string, ClassData> = {
  barbarian: {
    name: "Barbarian",
    hit_dice: 12,
    hp_1st: 12,
    proficiencies: {
      armor: ["Light", "Medium", "Shields"],
      weapons: ["Simple", "Martial"],
      tools: [],
      saves: ["strength", "constitution"],
      skills: ["Animal Handling", "Athletics", "Intimidation", "Nature", "Perception", "Survival"],
    },
    skill_choices: 2,
    source: "02_Classes/Barbarian.md",
    features: {
      1: ["Rage", "Unarmored Defense"],
      2: ["Reckless Attack", "Danger Sense"],
      3: ["Primal Path"],
      4: ["Ability Score Improvement"],
      5: ["Extra Attack", "Fast Movement"],
      7: ["Feral Instinct"],
      9: ["Brutal Critical (1 die)"],
      11: ["Relentless Rage"],
      13: ["Brutal Critical (2 dice)"],
      15: ["Persistent Rage"],
      17: ["Brutal Critical (3 dice)"],
      18: ["Indomitable Might"],
      20: ["Primal Champion"],
    },
    subclasses: {
      berserker: {
        name: "Path of the Berserker",
        features: {
          3: ["Frenzy"],
          6: ["Mindless Rage"],
          10: ["Intimidating Presence"],
          14: ["Retaliation"],
        },
      },
    },
  },
  bard: {
    name: "Bard",
    hit_dice: 8,
    hp_1st: 8,
    proficiencies: {
      armor: ["Light"],
      weapons: ["Simple", "hand crossbows", "longswords", "rapiers", "shortswords"],
      tools: ["Musical instrument (3)"],
      saves: ["dexterity", "charisma"],
      skills: ["Any (3)"],
    },
    skill_choices: 3,
    spellcasting_ability: "charisma",
    source: "02_Classes/Bard.md",
    features: {
      1: ["Spellcasting", "Bardic Inspiration (d6)"],
      2: ["Jack of All Trades", "Song of Rest (d6)"],
      3: ["Bard College", "Expertise"],
      5: ["Bardic Inspiration (d8)", "Font of Inspiration"],
      6: ["Countercharm"],
      10: ["Bardic Inspiration (d10)", "Magical Secrets"],
      14: ["Magical Secrets"],
      15: ["Bardic Inspiration (d12)"],
      18: ["Magical Secrets"],
      20: ["Superior Inspiration"],
    },
    subclasses: {
      lore: {
        name: "College of Lore",
        features: {
          3: ["Bonus Proficiencies", "Cutting Words"],
          6: ["Additional Magical Secrets"],
          14: ["Peerless Skill"],
        },
      },
    },
  },
  cleric: {
    name: "Cleric",
    hit_dice: 8,
    hp_1st: 8,
    proficiencies: {
      armor: ["Light", "Medium", "Shields"],
      weapons: ["Simple"],
      tools: [],
      saves: ["wisdom", "charisma"],
      skills: ["History", "Insight", "Medicine", "Persuasion", "Religion"],
    },
    skill_choices: 2,
    spellcasting_ability: "wisdom",
    source: "02_Classes/Cleric.md",
    features: {
      1: ["Spellcasting", "Divine Domain"],
      2: ["Channel Divinity (1/rest)"],
      5: ["Destroy Undead (CR 1/2)"],
      6: ["Channel Divinity (2/rest)"],
      8: ["Destroy Undead (CR 1)"],
      10: ["Divine Intervention"],
      11: ["Destroy Undead (CR 2)"],
      14: ["Destroy Undead (CR 3)"],
      17: ["Destroy Undead (CR 4)"],
      18: ["Channel Divinity (3/rest)"],
      20: ["Divine Intervention auto-success"],
    },
    subclasses: {
      life: {
        name: "Life Domain",
        features: {
          1: ["Bonus Proficiency (Heavy Armor)", "Disciple of Life"],
          2: ["Channel Divinity: Preserve Life"],
          6: ["Blessed Healer"],
          8: ["Divine Strike (1d8)"],
          14: ["Divine Strike (2d8)"],
          17: ["Supreme Healing"],
        },
      },
    },
  },
  druid: {
    name: "Druid",
    hit_dice: 8,
    hp_1st: 8,
    proficiencies: {
      armor: ["Light", "Medium", "Shields (no metal)"],
      weapons: ["Clubs", "daggers", "darts", "javelins", "maces", "quarterstaffs", "scimitars", "sickles", "slings", "spears"],
      tools: ["Herbalism kit"],
      saves: ["intelligence", "wisdom"],
      skills: ["Arcana", "Animal Handling", "Insight", "Medicine", "Nature", "Perception", "Religion", "Survival"],
    },
    skill_choices: 2,
    spellcasting_ability: "wisdom",
    source: "02_Classes/Druid.md",
    features: {
      1: ["Druidic", "Spellcasting"],
      2: ["Wild Shape", "Druid Circle"],
      18: ["Timeless Body", "Beast Spells"],
      20: ["Archdruid"],
    },
    subclasses: {
      land: {
        name: "Circle of the Land",
        features: {
          2: ["Bonus Cantrip", "Natural Recovery"],
          3: ["Circle Spells"],
          6: ["Land's Stride"],
          10: ["Nature's Ward"],
          14: ["Nature's Sanctuary"],
        },
      },
    },
  },
  fighter: {
    name: "Fighter",
    hit_dice: 10,
    hp_1st: 10,
    proficiencies: {
      armor: ["All", "Shields"],
      weapons: ["Simple", "Martial"],
      tools: [],
      saves: ["strength", "constitution"],
      skills: ["Acrobatics", "Animal Handling", "Athletics", "History", "Insight", "Intimidation", "Perception", "Survival"],
    },
    skill_choices: 2,
    source: "02_Classes/Fighter.md",
    features: {
      1: ["Fighting Style", "Second Wind"],
      2: ["Action Surge (1 use)"],
      3: ["Martial Archetype"],
      5: ["Extra Attack"],
      9: ["Indomitable (1 use)"],
      11: ["Extra Attack (2)"],
      13: ["Indomitable (2 uses)"],
      17: ["Action Surge (2 uses)", "Indomitable (3 uses)"],
      20: ["Extra Attack (3)"],
    },
    subclasses: {
      champion: {
        name: "Champion",
        features: {
          3: ["Improved Critical (19-20)"],
          7: ["Remarkable Athlete"],
          10: ["Additional Fighting Style"],
          15: ["Superior Critical (18-20)"],
          18: ["Survivor"],
        },
      },
    },
  },
  monk: {
    name: "Monk",
    hit_dice: 8,
    hp_1st: 8,
    proficiencies: {
      armor: ["None"],
      weapons: ["Simple", "shortswords"],
      tools: ["Artisan's tools or musical instrument"],
      saves: ["strength", "dexterity"],
      skills: ["Acrobatics", "Athletics", "History", "Insight", "Religion", "Stealth"],
    },
    skill_choices: 2,
    source: "02_Classes/Monk.md",
    features: {
      1: ["Unarmored Defense", "Martial Arts (d4)"],
      2: ["Ki", "Unarmored Movement"],
      3: ["Monastic Tradition", "Deflect Missiles"],
      4: ["Slow Fall", "Ability Score Improvement"],
      5: ["Extra Attack", "Stunning Strike", "Martial Arts (d6)"],
      6: ["Ki-Empowered Strikes"],
      7: ["Evasion", "Stillness of Mind"],
      10: ["Purity of Body"],
      11: ["Martial Arts (d8)"],
      13: ["Tongue of the Sun and Moon"],
      14: ["Diamond Soul"],
      15: ["Timeless Body"],
      17: ["Martial Arts (d10)"],
      18: ["Empty Body"],
      20: ["Perfect Self"],
    },
    subclasses: {
      open_hand: {
        name: "Way of the Open Hand",
        features: {
          3: ["Open Hand Technique"],
          6: ["Wholeness of Body"],
          11: ["Tranquility"],
          17: ["Quivering Palm"],
        },
      },
    },
  },
  paladin: {
    name: "Paladin",
    hit_dice: 10,
    hp_1st: 10,
    proficiencies: {
      armor: ["All", "Shields"],
      weapons: ["Simple", "Martial"],
      tools: [],
      saves: ["wisdom", "charisma"],
      skills: ["Athletics", "Insight", "Intimidation", "Medicine", "Persuasion", "Religion"],
    },
    skill_choices: 2,
    spellcasting_ability: "charisma",
    source: "02_Classes/Paladin.md",
    features: {
      1: ["Divine Sense", "Lay on Hands"],
      2: ["Fighting Style", "Spellcasting", "Divine Smite"],
      3: ["Divine Health", "Sacred Oath"],
      5: ["Extra Attack"],
      6: ["Aura of Protection"],
      10: ["Aura of Courage"],
      11: ["Improved Divine Smite"],
      14: ["Cleansing Touch"],
      18: ["Aura range 30 ft"],
    },
    subclasses: {
      devotion: {
        name: "Oath of Devotion",
        features: {
          3: ["Channel Divinity: Sacred Weapon", "Channel Divinity: Turn the Unholy"],
          7: ["Aura of Devotion"],
          15: ["Purity of Spirit"],
          20: ["Holy Nimbus"],
        },
      },
    },
  },
  ranger: {
    name: "Ranger",
    hit_dice: 10,
    hp_1st: 10,
    proficiencies: {
      armor: ["Light", "Medium", "Shields"],
      weapons: ["Simple", "Martial"],
      tools: [],
      saves: ["strength", "dexterity"],
      skills: ["Animal Handling", "Athletics", "Insight", "Investigation", "Nature", "Perception", "Stealth", "Survival"],
    },
    skill_choices: 3,
    spellcasting_ability: "wisdom",
    source: "02_Classes/Ranger.md",
    features: {
      1: ["Favored Enemy", "Natural Explorer"],
      2: ["Fighting Style", "Spellcasting"],
      3: ["Ranger Archetype", "Primeval Awareness"],
      5: ["Extra Attack"],
      8: ["Land's Stride"],
      10: ["Hide in Plain Sight"],
      14: ["Vanish"],
      18: ["Feral Senses"],
      20: ["Foe Slayer"],
    },
    subclasses: {
      hunter: {
        name: "Hunter",
        features: {
          3: ["Hunter's Prey"],
          7: ["Defensive Tactics"],
          11: ["Multiattack"],
          15: ["Superior Hunter's Defense"],
        },
      },
    },
  },
  rogue: {
    name: "Rogue",
    hit_dice: 8,
    hp_1st: 8,
    proficiencies: {
      armor: ["Light"],
      weapons: ["Simple", "hand crossbows", "longswords", "rapiers", "shortswords"],
      tools: ["Thieves' tools"],
      saves: ["dexterity", "intelligence"],
      skills: ["Acrobatics", "Athletics", "Deception", "Insight", "Intimidation", "Investigation", "Perception", "Performance", "Persuasion", "Sleight of Hand", "Stealth"],
    },
    skill_choices: 4,
    source: "02_Classes/Rogue.md",
    features: {
      1: ["Expertise", "Sneak Attack", "Thieves' Cant"],
      2: ["Cunning Action"],
      3: ["Roguish Archetype"],
      5: ["Uncanny Dodge"],
      7: ["Evasion"],
      11: ["Reliable Talent"],
      14: ["Blindsense"],
      15: ["Slippery Mind"],
      18: ["Elusive"],
      20: ["Stroke of Luck"],
    },
    subclasses: {
      thief: {
        name: "Thief",
        features: {
          3: ["Fast Hands", "Second-Story Work"],
          9: ["Supreme Sneak"],
          13: ["Use Magic Device"],
          17: ["Thief's Reflexes"],
        },
      },
    },
  },
  sorcerer: {
    name: "Sorcerer",
    hit_dice: 6,
    hp_1st: 6,
    proficiencies: {
      armor: ["None"],
      weapons: ["Daggers", "darts", "slings", "quarterstaffs", "light crossbows"],
      tools: [],
      saves: ["constitution", "charisma"],
      skills: ["Arcana", "Deception", "Insight", "Intimidation", "Persuasion", "Religion"],
    },
    skill_choices: 2,
    spellcasting_ability: "charisma",
    source: "02_Classes/Sorcerer.md",
    features: {
      1: ["Spellcasting", "Sorcerous Origin"],
      2: ["Font of Magic (Sorcery Points)"],
      3: ["Metamagic"],
      10: ["Metamagic (3rd option)"],
      17: ["Metamagic (4th option)"],
      20: ["Sorcerous Restoration"],
    },
    subclasses: {
      draconic: {
        name: "Draconic Bloodline",
        features: {
          1: ["Dragon Ancestor", "Draconic Resilience"],
          6: ["Elemental Affinity"],
          14: ["Dragon Wings"],
          18: ["Draconic Presence"],
        },
      },
    },
  },
  warlock: {
    name: "Warlock",
    hit_dice: 8,
    hp_1st: 8,
    proficiencies: {
      armor: ["Light"],
      weapons: ["Simple"],
      tools: [],
      saves: ["wisdom", "charisma"],
      skills: ["Arcana", "Deception", "History", "Intimidation", "Investigation", "Nature", "Religion"],
    },
    skill_choices: 2,
    spellcasting_ability: "charisma",
    source: "02_Classes/Warlock.md",
    features: {
      1: ["Otherworldly Patron", "Pact Magic"],
      2: ["Eldritch Invocations"],
      3: ["Pact Boon"],
      11: ["Mystic Arcanum (6th level)"],
      13: ["Mystic Arcanum (7th level)"],
      15: ["Mystic Arcanum (8th level)"],
      17: ["Mystic Arcanum (9th level)"],
      20: ["Eldritch Master"],
    },
    subclasses: {
      fiend: {
        name: "The Fiend",
        features: {
          1: ["Dark One's Blessing"],
          6: ["Dark One's Own Luck"],
          10: ["Fiendish Resilience"],
          14: ["Hurl Through Hell"],
        },
      },
    },
  },
  wizard: {
    name: "Wizard",
    hit_dice: 6,
    hp_1st: 6,
    proficiencies: {
      armor: ["None"],
      weapons: ["Daggers", "darts", "slings", "quarterstaffs", "light crossbows"],
      tools: [],
      saves: ["intelligence", "wisdom"],
      skills: ["Arcana", "History", "Insight", "Investigation", "Medicine", "Religion"],
    },
    skill_choices: 2,
    spellcasting_ability: "intelligence",
    source: "02_Classes/Wizard.md",
    features: {
      1: ["Spellcasting", "Arcane Recovery"],
      2: ["Arcane Tradition"],
      18: ["Spell Mastery"],
      20: ["Signature Spells"],
    },
    subclasses: {
      evocation: {
        name: "School of Evocation",
        features: {
          2: ["Evocation Savant", "Sculpt Spells"],
          6: ["Potent Cantrip"],
          10: ["Empowered Evocation"],
          14: ["Overchannel"],
        },
      },
    },
  },
};

// ── Class Level Tables ─────────────────────────────────────────────

export const PROFICIENCY_BONUS: Record<number, number> = {
  1: 2, 2: 2, 3: 2, 4: 2, 5: 3, 6: 3, 7: 3, 8: 3, 9: 4,
  10: 4, 11: 4, 12: 4, 13: 5, 14: 5, 15: 5, 16: 5, 17: 6, 18: 6, 19: 6, 20: 6,
};

export const XP_THRESHOLDS: Record<number, number> = {
  1: 0, 2: 300, 3: 900, 4: 2700, 5: 6500, 6: 14000, 7: 23000, 8: 34000,
  9: 48000, 10: 64000, 11: 85000, 12: 100000, 13: 120000, 14: 140000,
  15: 165000, 16: 195000, 17: 225000, 18: 265000, 19: 305000, 20: 355000,
};

// Source: 03_Characterization/Beyond_1st_Level.md

// ── Weapons ────────────────────────────────────────────────────────
// Source: 04_Equipment/Weapons.md

export interface WeaponData {
  name: string;
  category: "simple_melee" | "simple_ranged" | "martial_melee" | "martial_ranged";
  cost: string;
  damage: string;
  damage_type: string;
  weight: string;
  properties: string[];
}

export const WEAPONS: WeaponData[] = [
  // Simple Melee
  { name: "Club", category: "simple_melee", cost: "1 sp", damage: "1d4", damage_type: "bludgeoning", weight: "2 lb.", properties: ["Light"] },
  { name: "Dagger", category: "simple_melee", cost: "2 gp", damage: "1d4", damage_type: "piercing", weight: "1 lb.", properties: ["Finesse", "Light", "Thrown (20/60)"] },
  { name: "Greatclub", category: "simple_melee", cost: "2 sp", damage: "1d8", damage_type: "bludgeoning", weight: "10 lb.", properties: ["Two-handed"] },
  { name: "Handaxe", category: "simple_melee", cost: "5 gp", damage: "1d6", damage_type: "slashing", weight: "2 lb.", properties: ["Light", "Thrown (20/60)"] },
  { name: "Javelin", category: "simple_melee", cost: "5 sp", damage: "1d6", damage_type: "piercing", weight: "2 lb.", properties: ["Thrown (30/120)"] },
  { name: "Light Hammer", category: "simple_melee", cost: "2 gp", damage: "1d4", damage_type: "bludgeoning", weight: "2 lb.", properties: ["Light", "Thrown (20/60)"] },
  { name: "Mace", category: "simple_melee", cost: "5 gp", damage: "1d6", damage_type: "bludgeoning", weight: "4 lb.", properties: [] },
  { name: "Quarterstaff", category: "simple_melee", cost: "2 sp", damage: "1d6", damage_type: "bludgeoning", weight: "4 lb.", properties: ["Versatile (1d8)"] },
  { name: "Sickle", category: "simple_melee", cost: "1 gp", damage: "1d4", damage_type: "slashing", weight: "2 lb.", properties: ["Light"] },
  { name: "Spear", category: "simple_melee", cost: "1 gp", damage: "1d6", damage_type: "piercing", weight: "3 lb.", properties: ["Thrown (20/60)", "Versatile (1d8)"] },
  // Simple Ranged
  { name: "Light Crossbow", category: "simple_ranged", cost: "25 gp", damage: "1d8", damage_type: "piercing", weight: "5 lb.", properties: ["Ammunition (80/320)", "Loading", "Two-handed"] },
  { name: "Dart", category: "simple_ranged", cost: "5 cp", damage: "1d4", damage_type: "piercing", weight: "0.25 lb.", properties: ["Finesse", "Thrown (20/60)"] },
  { name: "Shortbow", category: "simple_ranged", cost: "25 gp", damage: "1d6", damage_type: "piercing", weight: "2 lb.", properties: ["Ammunition (80/320)", "Two-handed"] },
  { name: "Sling", category: "simple_ranged", cost: "1 sp", damage: "1d4", damage_type: "bludgeoning", weight: "—", properties: ["Ammunition (30/120)"] },
  // Martial Melee
  { name: "Battleaxe", category: "martial_melee", cost: "10 gp", damage: "1d8", damage_type: "slashing", weight: "4 lb.", properties: ["Versatile (1d10)"] },
  { name: "Flail", category: "martial_melee", cost: "10 gp", damage: "1d8", damage_type: "bludgeoning", weight: "2 lb.", properties: [] },
  { name: "Glaive", category: "martial_melee", cost: "20 gp", damage: "1d10", damage_type: "slashing", weight: "6 lb.", properties: ["Heavy", "Reach", "Two-handed"] },
  { name: "Greataxe", category: "martial_melee", cost: "30 gp", damage: "1d12", damage_type: "slashing", weight: "7 lb.", properties: ["Heavy", "Two-handed"] },
  { name: "Greatsword", category: "martial_melee", cost: "50 gp", damage: "2d6", damage_type: "slashing", weight: "6 lb.", properties: ["Heavy", "Two-handed"] },
  { name: "Halberd", category: "martial_melee", cost: "20 gp", damage: "1d10", damage_type: "slashing", weight: "6 lb.", properties: ["Heavy", "Reach", "Two-handed"] },
  { name: "Lance", category: "martial_melee", cost: "10 gp", damage: "1d12", damage_type: "piercing", weight: "6 lb.", properties: ["Reach", "Special"] },
  { name: "Longsword", category: "martial_melee", cost: "15 gp", damage: "1d8", damage_type: "slashing", weight: "3 lb.", properties: ["Versatile (1d10)"] },
  { name: "Maul", category: "martial_melee", cost: "10 gp", damage: "2d6", damage_type: "bludgeoning", weight: "10 lb.", properties: ["Heavy", "Two-handed"] },
  { name: "Morningstar", category: "martial_melee", cost: "15 gp", damage: "1d8", damage_type: "piercing", weight: "4 lb.", properties: [] },
  { name: "Pike", category: "martial_melee", cost: "5 gp", damage: "1d10", damage_type: "piercing", weight: "18 lb.", properties: ["Heavy", "Reach", "Two-handed"] },
  { name: "Rapier", category: "martial_melee", cost: "25 gp", damage: "1d8", damage_type: "piercing", weight: "2 lb.", properties: ["Finesse"] },
  { name: "Scimitar", category: "martial_melee", cost: "25 gp", damage: "1d6", damage_type: "slashing", weight: "3 lb.", properties: ["Finesse", "Light"] },
  { name: "Shortsword", category: "martial_melee", cost: "10 gp", damage: "1d6", damage_type: "piercing", weight: "2 lb.", properties: ["Finesse", "Light"] },
  { name: "Trident", category: "martial_melee", cost: "5 gp", damage: "1d6", damage_type: "piercing", weight: "4 lb.", properties: ["Thrown (20/60)", "Versatile (1d8)"] },
  { name: "War Pick", category: "martial_melee", cost: "5 gp", damage: "1d8", damage_type: "piercing", weight: "2 lb.", properties: [] },
  { name: "Warhammer", category: "martial_melee", cost: "15 gp", damage: "1d8", damage_type: "bludgeoning", weight: "2 lb.", properties: ["Versatile (1d10)"] },
  { name: "Whip", category: "martial_melee", cost: "2 gp", damage: "1d4", damage_type: "slashing", weight: "3 lb.", properties: ["Finesse", "Reach"] },
  // Martial Ranged
  { name: "Blowgun", category: "martial_ranged", cost: "10 gp", damage: "1", damage_type: "piercing", weight: "1 lb.", properties: ["Ammunition (25/100)", "Loading"] },
  { name: "Hand Crossbow", category: "martial_ranged", cost: "75 gp", damage: "1d6", damage_type: "piercing", weight: "3 lb.", properties: ["Ammunition (30/120)", "Light", "Loading"] },
  { name: "Heavy Crossbow", category: "martial_ranged", cost: "50 gp", damage: "1d10", damage_type: "piercing", weight: "18 lb.", properties: ["Ammunition (100/400)", "Heavy", "Loading", "Two-handed"] },
  { name: "Longbow", category: "martial_ranged", cost: "50 gp", damage: "1d8", damage_type: "piercing", weight: "2 lb.", properties: ["Ammunition (150/600)", "Heavy", "Two-handed"] },
  { name: "Net", category: "martial_ranged", cost: "1 gp", damage: "—", damage_type: "—", weight: "3 lb.", properties: ["Special", "Thrown (5/15)"] },
];

export const WEAPON_BY_NAME: Record<string, WeaponData> = {};
for (const w of WEAPONS) {
  WEAPON_BY_NAME[w.name.toLowerCase()] = w;
}

// ── Armor ──────────────────────────────────────────────────────────
// Source: 04_Equipment/Armor.md

export interface ArmorData {
  name: string;
  category: "light" | "medium" | "heavy" | "shield";
  cost: string;
  ac_formula: string;
  strength_req: number | null;
  stealth_disadvantage: boolean;
  weight: string;
}

export const ARMOR: ArmorData[] = [
  { name: "Padded", category: "light", cost: "5 gp", ac_formula: "11 + Dex mod", strength_req: null, stealth_disadvantage: true, weight: "8 lb." },
  { name: "Leather", category: "light", cost: "10 gp", ac_formula: "11 + Dex mod", strength_req: null, stealth_disadvantage: false, weight: "10 lb." },
  { name: "Studded Leather", category: "light", cost: "45 gp", ac_formula: "12 + Dex mod", strength_req: null, stealth_disadvantage: false, weight: "13 lb." },
  { name: "Hide", category: "medium", cost: "10 gp", ac_formula: "12 + Dex mod (max 2)", strength_req: null, stealth_disadvantage: false, weight: "12 lb." },
  { name: "Chain Shirt", category: "medium", cost: "50 gp", ac_formula: "13 + Dex mod (max 2)", strength_req: null, stealth_disadvantage: false, weight: "20 lb." },
  { name: "Scale Mail", category: "medium", cost: "50 gp", ac_formula: "14 + Dex mod (max 2)", strength_req: null, stealth_disadvantage: true, weight: "45 lb." },
  { name: "Breastplate", category: "medium", cost: "400 gp", ac_formula: "14 + Dex mod (max 2)", strength_req: null, stealth_disadvantage: false, weight: "20 lb." },
  { name: "Half Plate", category: "medium", cost: "750 gp", ac_formula: "15 + Dex mod (max 2)", strength_req: null, stealth_disadvantage: true, weight: "40 lb." },
  { name: "Ring Mail", category: "heavy", cost: "30 gp", ac_formula: "14", strength_req: null, stealth_disadvantage: true, weight: "40 lb." },
  { name: "Chain Mail", category: "heavy", cost: "75 gp", ac_formula: "16", strength_req: 13, stealth_disadvantage: true, weight: "55 lb." },
  { name: "Splint", category: "heavy", cost: "200 gp", ac_formula: "17", strength_req: 15, stealth_disadvantage: true, weight: "60 lb." },
  { name: "Plate", category: "heavy", cost: "1500 gp", ac_formula: "18", strength_req: 15, stealth_disadvantage: true, weight: "65 lb." },
  { name: "Shield", category: "shield", cost: "10 gp", ac_formula: "+2", strength_req: null, stealth_disadvantage: false, weight: "6 lb." },
];

export const ARMOR_BY_NAME: Record<string, ArmorData> = {};
for (const a of ARMOR) {
  ARMOR_BY_NAME[a.name.toLowerCase()] = a;
}

// ── DC Table ───────────────────────────────────────────────────────
// Source: 06_Gameplay/Using_Ability_Scores.md § "Difficulty Classes"

export const DIFFICULTY_CLASSES: Record<string, number> = {
  "Very Easy": 5,
  "Easy": 10,
  "Medium": 15,
  "Hard": 20,
  "Very Hard": 25,
  "Nearly Impossible": 30,
};

// ── Travel Pace ────────────────────────────────────────────────────
// Source: 06_Gameplay/Adventuring.md § "Travel Pace"

export const TRAVEL_PACE = {
  Fast: { per_minute: 400, per_hour: 4, per_day: 30, effect: "-5 passive Perception" },
  Normal: { per_minute: 300, per_hour: 3, per_day: 24, effect: "" },
  Slow: { per_minute: 200, per_hour: 2, per_day: 18, effect: "can use stealth" },
};

// ── Search Index ───────────────────────────────────────────────────
// REQ-111: search_rules returns match context

let searchIndex: Map<string, { path: string; heading: string; content: string }> | null = null;

export function buildSearchIndex(rulesetDir: string): void {
  searchIndex = new Map();
  const files = walkDir(rulesetDir, ".md");
  for (const file of files) {
    const relative = path.relative(rulesetDir, file);
    const text = fs.readFileSync(file, "utf-8");
    const headings = extractHeadings(text);
    for (const h of headings) {
      const key = `${relative}#${h.heading}`;
      searchIndex.set(key.toLowerCase(), {
        path: relative,
        heading: h.heading,
        content: h.content.substring(0, 2000),
      });
    }
  }
}

export function searchRules(query: string, maxResults = 10): { path: string; heading: string; context: string; relevance: number }[] {
  if (!searchIndex) return [];
  const q = query.toLowerCase();
  const results: { key: string; entry: typeof searchIndex extends Map<any, infer V> ? V : never; relevance: number }[] = [];

  for (const [key, entry] of searchIndex as Map<string, { path: string; heading: string; content: string }>) {
    const inKey = key.includes(q) ? 3 : 0;
    const inContent = entry.content.toLowerCase().includes(q) ? 1 : 0;
    const relevance = inKey + inContent;
    if (relevance > 0) {
      results.push({ key, entry, relevance });
    }
  }

  results.sort((a, b) => b.relevance - a.relevance);
  return results.slice(0, maxResults).map(r => ({
    path: r.entry.path,
    heading: r.entry.heading,
    context: extractContext(r.entry.content, q),
    relevance: r.relevance,
  }));
}

function extractContext(content: string, query: string): string {
  const idx = content.toLowerCase().indexOf(query.toLowerCase());
  if (idx < 0) return content.substring(0, 200);
  const start = Math.max(0, idx - 100);
  const end = Math.min(content.length, idx + query.length + 100);
  return (start > 0 ? "..." : "") + content.substring(start, end) + (end < content.length ? "..." : "");
}

function walkDir(dir: string, ext: string): string[] {
  const files: string[] = [];
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

function extractHeadings(text: string): { heading: string; content: string }[] {
  const results: { heading: string; content: string }[] = [];
  const sections = text.split(/^(?=#{2,3}\s)/m);
  for (const section of sections) {
    const m = section.match(/^(#{2,3})\s+(.+)$/m);
    if (m) {
      results.push({
        heading: m[2].trim().replace(/\*/g, ""),
        content: section.substring(m[0].length).trim(),
      });
    }
  }
  return results;
}

export function getSearchIndexSize(): number {
  return searchIndex?.size ?? 0;
}

// ── Lookup Functions ──────────────────────────────────────────────

export function lookupWeapon(name: string): WeaponData | null {
  return WEAPON_BY_NAME[name.toLowerCase()] ?? null;
}

export function lookupArmor(name: string): ArmorData | null {
  return ARMOR_BY_NAME[name.toLowerCase()] ?? null;
}

export function lookupEquipment(name: string): WeaponData | ArmorData | null {
  return lookupWeapon(name) ?? lookupArmor(name);
}

export function listWeapons(): string[] {
  return WEAPONS.map(w => w.name);
}

export function listArmor(): string[] {
  return ARMOR.map(a => a.name);
}

export function listRaces(): string[] {
  return Object.keys(RACES);
}

export function listClasses(): string[] {
  return Object.keys(CLASSES);
}
