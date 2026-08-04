// D&D 5e SRD rules data — extracted from SRD v5.1
import * as fs from "node:fs";
import * as path from "node:path";

// ─── Generated JSON (loaded at startup via fs, not import — ESM compat) ────

const generatedDir = path.join(path.dirname(new URL(import.meta.url).pathname), "generated");

function loadJson<T = any>(filename: string): T {
  return JSON.parse(fs.readFileSync(path.join(generatedDir, filename), "utf-8"));
}

const weaponsJson = loadJson("weapons.json") as Record<string, any>[];
const armorJson = loadJson("armor.json") as Record<string, any>[];
const spellsJson = loadJson("spells.json") as Record<string, any>[];
const monstersJson = loadJson("monsters.json") as Record<string, any>[];
const magicItemsJson = loadJson("magic_items.json") as Record<string, any>[];
const tablesJson = loadJson("tables.json") as Record<string, any>;

// ─── Ability Scores & Skills ──────────────────────────────────────────────

export const ABILITY_SCORES = ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"] as const;
export type AbilityScore = (typeof ABILITY_SCORES)[number];

export const SKILLS: { name: string; ability: AbilityScore }[] = [
  { name: "athletics", ability: "strength" },
  { name: "acrobatics", ability: "dexterity" },
  { name: "sleight_of_hand", ability: "dexterity" },
  { name: "stealth", ability: "dexterity" },
  { name: "arcana", ability: "intelligence" },
  { name: "history", ability: "intelligence" },
  { name: "investigation", ability: "intelligence" },
  { name: "nature", ability: "intelligence" },
  { name: "religion", ability: "intelligence" },
  { name: "animal_handling", ability: "wisdom" },
  { name: "insight", ability: "wisdom" },
  { name: "medicine", ability: "wisdom" },
  { name: "perception", ability: "wisdom" },
  { name: "survival", ability: "wisdom" },
  { name: "deception", ability: "charisma" },
  { name: "intimidation", ability: "charisma" },
  { name: "performance", ability: "charisma" },
  { name: "persuasion", ability: "charisma" },
];

export const SKILL_MAP: Record<string, AbilityScore> = {};
for (const s of SKILLS) SKILL_MAP[s.name] = s.ability;

// ─── Conditions ───────────────────────────────────────────────────────────

export const CONDITIONS: Record<string, string[]> = {
  blinded: ["Can't see; auto-fails sight checks", "Attackers have advantage; blinded creature has disadvantage on attacks"],
  charmed: ["Can't attack/harm the charmer", "Charmer has advantage on social checks vs charmed"],
  deafened: ["Can't hear; auto-fails hearing checks"],
  exhaustion: ["Lv1: Disadvantage on ability checks", "Lv2: Speed halved", "Lv3: Disadvantage on attacks/saves", "Lv4: HP maximum halved", "Lv5: Speed 0", "Lv6: Death"],
  frightened: ["Disadvantage on checks/attacks while source in sight", "Can't willingly move closer to fear source"],
  grappled: ["Speed 0; no speed bonuses"],
  incapacitated: ["Can't take actions or reactions"],
  invisible: ["Heavily obscured for hiding", "Attackers have disadvantage; invisible has advantage"],
  paralyzed: ["Incapacitated; can't move or speak", "Auto-fails STR/DEX saves", "Attackers have advantage; hits within 5 ft are crits"],
  petrified: ["Transformed into stone; weight x10", "Incapacitated, unaware", "Resistance to all damage", "Immune to poison/disease (suspended)"],
  poisoned: ["Disadvantage on attack rolls and ability checks"],
  prone: ["Movement only by crawling (unless standing)", "Disadvantage on attacks", "Attackers within 5 ft have advantage; beyond have disadvantage"],
  restrained: ["Speed 0; no speed bonuses", "Attackers have advantage; restrained has disadvantage on attacks", "Disadvantage on DEX saves"],
  stunned: ["Incapacitated; can't move; faltering speech", "Auto-fails STR/DEX saves", "Attackers have advantage"],
  unconscious: ["Incapacitated, unaware; drops items, falls prone", "Auto-fails STR/DEX saves", "Attackers have advantage; hits within 5 ft are crits"],
};

export const DIFFICULTY_CLASSES: Record<string, number> = {
  "Very easy": 5, "Easy": 10, "Medium": 15, "Hard": 20, "Very hard": 25, "Nearly impossible": 30,
};

// ─── Level Progression ────────────────────────────────────────────────────

export const LEVELS = [
  { level: 1, proficiency: 2, xp: 0 }, { level: 2, proficiency: 2, xp: 300 }, { level: 3, proficiency: 2, xp: 900 },
  { level: 4, proficiency: 2, xp: 2700 }, { level: 5, proficiency: 3, xp: 6500 }, { level: 6, proficiency: 3, xp: 14000 },
  { level: 7, proficiency: 3, xp: 23000 }, { level: 8, proficiency: 3, xp: 34000 }, { level: 9, proficiency: 4, xp: 48000 },
  { level: 10, proficiency: 4, xp: 64000 }, { level: 11, proficiency: 4, xp: 85000 }, { level: 12, proficiency: 4, xp: 100000 },
  { level: 13, proficiency: 5, xp: 120000 }, { level: 14, proficiency: 5, xp: 140000 }, { level: 15, proficiency: 5, xp: 165000 },
  { level: 16, proficiency: 5, xp: 195000 }, { level: 17, proficiency: 6, xp: 225000 }, { level: 18, proficiency: 6, xp: 265000 },
  { level: 19, proficiency: 6, xp: 305000 }, { level: 20, proficiency: 6, xp: 355000 },
];

// ─── Races & Classes ──────────────────────────────────────────────────────

export const RACES = ["dragonborn", "dwarf", "elf", "gnome", "half_elf", "halfling", "half_orc", "human", "tiefling"] as const;
export type RaceName = (typeof RACES)[number];

export const RACE_MODIFIERS: Record<RaceName, Partial<Record<AbilityScore, number>>> = {
  dragonborn: { strength: 2, charisma: 1 },
  dwarf: { constitution: 2, wisdom: 1 },
  elf: { dexterity: 2, intelligence: 1 },
  gnome: { intelligence: 2, constitution: 1 },
  half_elf: { charisma: 2 },
  halfling: { dexterity: 2, charisma: 1 },
  half_orc: { strength: 2, constitution: 1 },
  human: { strength: 1, dexterity: 1, constitution: 1, intelligence: 1, wisdom: 1, charisma: 1 },
  tiefling: { charisma: 2, intelligence: 1 },
};

export const CLASS_NAMES = ["barbarian", "bard", "cleric", "druid", "fighter", "monk", "paladin", "ranger", "rogue", "sorcerer", "warlock", "wizard"] as const;
export type ClassName = (typeof CLASS_NAMES)[number];

export const CLASS_HIT_DIE: Record<ClassName, number> = { barbarian: 12, bard: 8, cleric: 8, druid: 8, fighter: 10, monk: 8, paladin: 10, ranger: 10, rogue: 8, sorcerer: 6, warlock: 8, wizard: 6 };
export const CLASS_SAVES: Record<ClassName, AbilityScore[]> = {
  barbarian: ["strength", "constitution"], bard: ["dexterity", "charisma"], cleric: ["wisdom", "charisma"],
  druid: ["intelligence", "wisdom"], fighter: ["strength", "constitution"], monk: ["strength", "dexterity"],
  paladin: ["wisdom", "charisma"], ranger: ["strength", "dexterity"], rogue: ["dexterity", "intelligence"],
  sorcerer: ["constitution", "charisma"], warlock: ["wisdom", "charisma"], wizard: ["intelligence", "wisdom"],
};

export const BACKGROUNDS = ["Acolyte", "Charlatan", "Criminal", "Entertainer", "Folk Hero", "Guild Artisan", "Hermit", "Noble", "Outlander", "Sage", "Sailor", "Soldier", "Urchin"];
export const ALIGNMENTS = ["Lawful Good", "Neutral Good", "Chaotic Good", "Lawful Neutral", "True Neutral", "Chaotic Neutral", "Lawful Evil", "Neutral Evil", "Chaotic Evil"];

// ─── Exported data arrays ─────────────────────────────────────────────────

export const WEAPONS = weaponsJson as Record<string, any>[];
export const ARMOR = armorJson as Record<string, any>[];
export const SPELLS = spellsJson as Record<string, any>[];
export const MONSTERS = monstersJson as Record<string, any>[];
export const MAGIC_ITEMS = magicItemsJson as Record<string, any>[];
export const TABLES = tablesJson as Record<string, any>;

// ─── Lookup functions ─────────────────────────────────────────────────────

function fuzzySearch<T extends Record<string, any>>(items: T[], query: string, key = "name"): T[] {
  const q = query.toLowerCase();
  const exact = items.filter(i => String(i[key] || "").toLowerCase() === q);
  if (exact.length > 0) return exact;
  const starts = items.filter(i => String(i[key] || "").toLowerCase().startsWith(q));
  if (starts.length > 0) return starts;
  const contains = items.filter(i => String(i[key] || "").toLowerCase().includes(q));
  return contains;
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const d: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) d[i][0] = i;
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) d[i][j] = Math.min(
    d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
  );
  return d[m][n];
}

function hints<T extends Record<string, any>>(items: T[], query: string, key = "name", maxDist = 2): string {
  const q = query.toLowerCase();
  const close = items.filter(i => levenshtein(String(i[key] || "").toLowerCase(), q) <= maxDist);
  if (close.length === 0) return "";
  return `\nDid you mean: ${close.slice(0, 5).map(c => c[key]).join(", ")}?`;
}

export function lookupWeapon(name: string): { item: Record<string, any>; hints: string; source: string } | null {
  const results = fuzzySearch(WEAPONS, name);
  if (results.length > 0) return { item: results[0], hints: "", source: "ruleset/04_Equipment/Weapons.md#" + results[0].name };
  return { item: null as any, hints: hints(WEAPONS, name), source: "" } as any;
}

export function lookupArmor(name: string): { item: Record<string, any>; hints: string; source: string } | null {
  const results = fuzzySearch(ARMOR, name);
  if (results.length > 0) return { item: results[0], hints: "", source: "ruleset/04_Equipment/Armor.md#" + results[0].name };
  return { item: null as any, hints: hints(ARMOR, name), source: "" } as any;
}

export function lookupSpell(name: string): { item: Record<string, any>; hints: string; source: string } | null {
  const results = fuzzySearch(SPELLS, name);
  if (results.length > 0) return { item: results[0], hints: "", source: "ruleset/07_Spells/Spells_Each/" + results[0].name.replace(/\s+/g, "_") + ".md#" + results[0].name };
  return { item: null as any, hints: hints(SPELLS, name), source: "" } as any;
}

export function lookupMonster(name: string): { item: Record<string, any>; hints: string; source: string } | null {
  const results = fuzzySearch(MONSTERS, name);
  if (results.length > 0) return { item: results[0], hints: "", source: "ruleset/10_Monsters/Monsters_Each/" + results[0].name.replace(/\s+/g, "_") + ".md#" + results[0].name };
  return { item: null as any, hints: hints(MONSTERS, name), source: "" } as any;
}

export function lookupMagicItem(name: string): { item: Record<string, any>; hints: string; source: string } | null {
  const results = fuzzySearch(MAGIC_ITEMS, name);
  if (results.length > 0) return { item: results[0], hints: "", source: "ruleset/09_Magic_Items/Magic_Items_Each/" + results[0].name.replace(/\s+/g, "_") + ".md#" + results[0].name };
  return { item: null as any, hints: hints(MAGIC_ITEMS, name), source: "" } as any;
}

export function lookupEquipment(name: string): { item: Record<string, any>; hints: string; type: string; source: string } | null {
  const w = lookupWeapon(name);
  if (w && w.item) return { ...w, type: "weapon" };
  const a = lookupArmor(name);
  if (a && a.item) return { ...a, type: "armor" };
  const mi = lookupMagicItem(name);
  if (mi && mi.item) return { ...mi, type: "magic_item" };
  return { item: null as any, hints: hints([...WEAPONS, ...ARMOR, ...MAGIC_ITEMS], name), type: "", source: "" } as any;
}

// ─── Search index built from Markdown files ────────────────────────────────

const rulesDir = path.resolve(process.env.TTRPG_RULESET_DIR || path.join(process.cwd(), "ruleset"));

interface SearchEntry {
  file: string;
  anchor: string;
  title: string;
  content: string;
}

let _searchIndex: SearchEntry[] | null = null;

export function buildSearchIndex(rulesDirOverride?: string): SearchEntry[] {
  if (_searchIndex) return _searchIndex;
  const dir = rulesDirOverride || rulesDir;
  const entries: SearchEntry[] = [];
  function walk(folder: string, depth = 0) {
    if (depth > 5) return;
    const items = fs.readdirSync(folder, { withFileTypes: true });
    for (const item of items) {
      const full = path.join(folder, item.name);
      if (item.isDirectory()) {
        walk(full, depth + 1);
      } else if (item.name.endsWith(".md")) {
        const text = fs.readFileSync(full, "utf-8");
        const lines = text.split("\n");
        const title = lines[0]?.replace(/^#+\s*/, "") || path.basename(item.name, ".md");
        const relative = path.relative(dir, full);
        let currentAnchor = title;
        let currentContent: string[] = [];
        for (let i = 1; i < lines.length; i++) {
          const hMatch = lines[i].match(/^(#{1,3})\s+(.+)/);
          if (hMatch) {
            if (currentContent.length > 0) {
              entries.push({ file: relative, anchor: currentAnchor.toLowerCase().replace(/[^a-z0-9]+/g, "_"), title: currentAnchor, content: currentContent.join(" ") });
            }
            currentAnchor = hMatch[2];
            currentContent = [currentAnchor, lines.slice(i + 1, i + 20).join(" ")];
          }
        }
        if (currentContent.length > 0) {
          entries.push({ file: relative, anchor: currentAnchor.toLowerCase().replace(/[^a-z0-9]+/g, "_"), title: currentAnchor, content: currentContent.join(" ") });
        }
      }
    }
  }
  walk(dir);
  _searchIndex = entries;
  return entries;
}

export function searchRules(query: string): { results: SearchEntry[]; totalFiles: number } {
  const index = buildSearchIndex();
  const terms = query.toLowerCase().split(/\s+/);
  const scored = index.map(entry => {
    const text = `${entry.title} ${entry.content}`.toLowerCase();
    let score = 0;
    for (const term of terms) {
      if (entry.title.toLowerCase().includes(term)) score += 3;
      else if (text.includes(term)) score += 1;
    }
    return { entry, score };
  });
  const results = scored.filter(s => s.score > 0).sort((a, b) => b.score - a.score).slice(0, 10).map(s => s.entry);
  return { results, totalFiles: index.length };
}
