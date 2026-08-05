import weaponsData from "./generated/weapons.json" with { type: "json" };
import armorData from "./generated/armor.json" with { type: "json" };
import spellsData from "./generated/spells.json" with { type: "json" };
import monstersData from "./generated/monsters.json" with { type: "json" };
import magicItemsData from "./generated/magic_items.json" with { type: "json" };
import tablesData from "./generated/tables.json" with { type: "json" };
import * as fs from "node:fs";
import * as path from "node:path";

export const ABILITY_SCORES = ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"] as const;
export type AbilityScore = typeof ABILITY_SCORES[number];

export const ABILITY_LABELS: Record<AbilityScore, string> = {
  strength: "STR", dexterity: "DEX", constitution: "CON",
  intelligence: "INT", wisdom: "WIS", charisma: "CHA",
};

export const SKILLS: Record<string, AbilityScore> = {
  "acrobatics": "dexterity", "animal handling": "wisdom", "arcana": "intelligence",
  "athletics": "strength", "deception": "charisma", "history": "intelligence",
  "insight": "wisdom", "intimidation": "charisma", "investigation": "intelligence",
  "medicine": "wisdom", "nature": "intelligence", "perception": "wisdom",
  "performance": "charisma", "persuasion": "charisma", "religion": "intelligence",
  "sleight of hand": "dexterity", "stealth": "dexterity", "survival": "wisdom",
};

export const SKILL_MAP = SKILLS;

export const CONDITIONS = [
  "blinded", "charmed", "deafened", "frightened", "grappled",
  "incapacitated", "invisible", "paralyzed", "petrified", "poisoned",
  "prone", "restrained", "stunned", "unconscious", "exhaustion",
];

export const RACES = [
  "dragonborn", "dwarf", "elf", "gnome", "half-elf",
  "half-orc", "halfling", "human", "tiefling",
] as const;

export const RACE_MODIFIERS: Record<string, Partial<Record<AbilityScore, number>>> = {
  dragonborn: { strength: 2, charisma: 1 },
  "hill dwarf": { constitution: 2, wisdom: 1 },
  dwarf: { constitution: 2 },
  "high elf": { dexterity: 2, intelligence: 1 },
  elf: { dexterity: 2 },
  "forest gnome": { intelligence: 2, dexterity: 1 },
  gnome: { intelligence: 2 },
  "half-elf": { charisma: 2 },
  "half-orc": { strength: 2, constitution: 1 },
  "lightfoot halfling": { dexterity: 2, charisma: 1 },
  halfling: { dexterity: 2 },
  human: { strength: 1, dexterity: 1, constitution: 1, intelligence: 1, wisdom: 1, charisma: 1 },
  tiefling: { charisma: 2, intelligence: 1 },
};

export const CLASS_HIT_DIE: Record<string, number> = {
  barbarian: 12, bard: 8, cleric: 8, druid: 8, fighter: 10,
  monk: 8, paladin: 10, ranger: 10, rogue: 8, sorcerer: 6,
  warlock: 8, wizard: 6,
};

export const CLASS_SAVES: Record<string, [AbilityScore, AbilityScore]> = {
  barbarian: ["strength", "constitution"], bard: ["dexterity", "charisma"],
  cleric: ["wisdom", "charisma"], druid: ["intelligence", "wisdom"],
  fighter: ["strength", "constitution"], monk: ["strength", "dexterity"],
  paladin: ["wisdom", "charisma"], ranger: ["strength", "dexterity"],
  rogue: ["dexterity", "intelligence"], sorcerer: ["constitution", "charisma"],
  warlock: ["wisdom", "charisma"], wizard: ["intelligence", "wisdom"],
};

export const CLASS_NAMES = Object.keys(CLASS_HIT_DIE);
export type ClassName = keyof typeof CLASS_HIT_DIE;

export const BACKGROUNDS = [
  "acolyte", "charlatan", "criminal", "entertainer", "folk hero",
  "guild artisan", "hermit", "noble", "outlander", "sage",
  "sailor", "soldier", "urchin",
];

export const ALIGNMENTS = [
  "lawful good", "neutral good", "chaotic good",
  "lawful neutral", "true neutral", "chaotic neutral",
  "lawful evil", "neutral evil", "chaotic evil",
];

export const LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

export const DIFFICULTY_CLASSES = [
  { label: "Very easy", dc: 5 }, { label: "Easy", dc: 10 },
  { label: "Medium", dc: 15 }, { label: "Hard", dc: 20 },
  { label: "Very hard", dc: 25 }, { label: "Nearly impossible", dc: 30 },
];

export const WEAPONS = weaponsData as Record<string, any>[];
export const ARMOR = armorData as Record<string, any>[];
export const SPELLS = spellsData as Record<string, any>[];
export const MONSTERS = monstersData as Record<string, any>[];
export const MAGIC_ITEMS = magicItemsData as Record<string, any>[];
export const TABLES = tablesData;

export interface SearchIndexEntry {
  file: string;
  anchor: string;
  title: string;
  text: string;
}

let _searchIndex: SearchIndexEntry[] | null = null;

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function buildSearchIndex(): SearchIndexEntry[] {
  if (_searchIndex) return _searchIndex;

  const rulesetDir = path.resolve(process.cwd(), "ruleset");
  const entries: SearchIndexEntry[] = [];

  function walk(dir: string) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir)) {
      const full = path.join(dir, entry);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        walk(full);
      } else if (entry.endsWith(".md")) {
        try {
          const text = fs.readFileSync(full, "utf-8");
          const rel = path.relative(rulesetDir, full);
          const headingMatch = text.match(/^#\s+(.+)$/m);
          const title = headingMatch ? headingMatch[1].trim() : entry.replace(/\.md$/, "");
          const anchor = slugify(title);

          const lines = text.split("\n");
          const headings: { level: number; title: string; anchor: string }[] = [{ level: 1, title, anchor }];
          for (const line of lines) {
            const m = line.match(/^(#{2,4})\s+(.+)$/);
            if (m) {
              const hTitle = m[2].trim();
              headings.push({ level: m[1].length, title: hTitle, anchor: slugify(hTitle) });
            }
          }
          for (const h of headings) {
            entries.push({
              file: rel,
              anchor: h.anchor,
              title: h.title,
              text: h.level === 1 ? text.slice(0, 500) : text.slice(0, 300),
            });
          }
        } catch (_) { /* skip */ }
      }
    }
  }

  walk(rulesetDir);
  _searchIndex = entries;
  return entries;
}

export function searchRules(query: string): SearchIndexEntry[] {
  const index = buildSearchIndex();
  if (!query || query.trim().length === 0) return [];
  const q = query.toLowerCase();
  return index
    .filter(e => e.title.toLowerCase().includes(q) || e.text.toLowerCase().includes(q))
    .slice(0, 20);
}

export function lookupWeapon(name: string): Record<string, any> | null {
  const n = name.toLowerCase().trim();
  return WEAPONS.find(w => w.name.toLowerCase() === n) ?? null;
}

export function lookupArmor(name: string): Record<string, any> | null {
  const n = name.toLowerCase().trim();
  return ARMOR.find(a => a.name.toLowerCase() === n) ?? null;
}

export function lookupSpell(name: string): Record<string, any> | null {
  const n = name.toLowerCase().trim();
  return SPELLS.find(s => s.name.toLowerCase() === n) ?? null;
}

export function lookupMonster(name: string): Record<string, any> | null {
  const n = name.toLowerCase().trim();
  return MONSTERS.find(m => m.name.toLowerCase() === n) ?? null;
}

export function lookupMagicItem(name: string): Record<string, any> | null {
  const n = name.toLowerCase().trim();
  return MAGIC_ITEMS.find(i => i.name.toLowerCase() === n) ?? null;
}

export function lookupEquipment(name: string): Record<string, any> | null {
  return lookupWeapon(name) || lookupArmor(name) || lookupMagicItem(name) || null;
}

export function lookupClass(name: string): { name: string; hitDie: number; saves: AbilityScore[] } | null {
  const n = name.toLowerCase().trim();
  if (!(n in CLASS_HIT_DIE)) return null;
  return { name: n, hitDie: CLASS_HIT_DIE[n], saves: CLASS_SAVES[n] ?? [] };
}
