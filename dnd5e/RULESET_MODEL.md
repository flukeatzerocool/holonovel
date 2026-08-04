# Ruleset Model — D&D 5e SRD v5.1

Semantic model of the ruleset as extracted from `ruleset/` (1021 Markdown files,
10 category directories) and materialized in `src/generated/`. Each section
cites the source file(s) that define the structured data and assigns a
confidence label.

---

## Ability Scores

Six core abilities (3–30 range), each mapped to an array of skills.

- **Strength (STR)** — Athletics
- **Dexterity (DEX)** — Acrobatics, Sleight of Hand, Stealth
- **Constitution (CON)** — (no associated skills)
- **Intelligence (INT)** — Arcana, History, Investigation, Nature, Religion
- **Wisdom (WIS)** — Animal Handling, Insight, Medicine, Perception, Survival
- **Charisma (CHA)** — Deception, Intimidation, Performance, Persuasion

**Confidence: HIGH** — enumerated in `src/data.ts:ABILITY_SCORES`, `src/data.ts:ABILITY_INDEX`.
**Source:** `ruleset/using-ability-scores/ability-scores.md`, `src/data.ts`.
**Table:** `ability_modifiers` (score → modifier, `src/data.ts:abilityModifier`).

---

## Skills

Eighteen skills, each keyed to exactly one ability score.

| Skill           | Ability |
|-----------------|---------|
| Acrobatics      | DEX     |
| Animal Handling | WIS     |
| Arcana          | INT     |
| Athletics       | STR     |
| Deception       | CHA     |
| History         | INT     |
| Insight         | WIS     |
| Intimidation    | CHA     |
| Investigation   | INT     |
| Medicine        | WIS     |
| Nature          | INT     |
| Perception      | WIS     |
| Performance     | CHA     |
| Persuasion      | CHA     |
| Religion        | INT     |
| Sleight of Hand | DEX     |
| Stealth         | DEX     |
| Survival        | WIS     |

**Confidence: HIGH** — enumerated in `src/data.ts:SKILLS` with ability mappings
in `src/data.ts:SKILL_ABILITIES`.
**Source:** `ruleset/using-ability-scores/skills.md`, `src/data.ts`.

---

## Races

Nine playable races, each with ability score modifiers and racial traits.

| Race        | Ability Modifiers                           |
|-------------|---------------------------------------------|
| Dwarf       | CON +2                                      |
| Elf         | DEX +2                                      |
| Halfling    | DEX +2                                      |
| Human       | All scores +1                               |
| Dragonborn  | STR +2, CHA +1                              |
| Gnome       | INT +2                                      |
| Half-Elf    | CHA +2, plus one other +1                   |
| Half-Orc    | STR +2, CON +1                              |
| Tiefling    | CHA +2, INT +1                              |

**Confidence: HIGH** — enumerated in `src/data.ts:RACES` and
`src/data.ts:RACE_MODIFIERS` with structured modifiers.
**Source:** `ruleset/races/` (one file per race), `src/data.ts`.

---

## Classes

Twelve base classes (levels 1–20), each with hit die, saving throw proficiencies,
and class features keyed by level.

| Class      | Hit Die | Saves          | Class Features Summary                               |
|------------|---------|----------------|------------------------------------------------------|
| Barbarian  | d12     | STR, CON       | Rage, Unarmored Defense, Reckless Attack, Danger Sense |
| Bard       | d8      | DEX, CHA       | Spellcasting, Bardic Inspiration, Jack of All Trades |
| Cleric     | d8      | WIS, CHA       | Spellcasting, Channel Divinity, Divine Domain        |
| Druid      | d8      | INT, WIS       | Spellcasting, Wild Shape, Druid Circle               |
| Fighter    | d10     | STR, CON       | Fighting Style, Second Wind, Action Surge            |
| Monk       | d8      | STR, DEX       | Martial Arts, Ki, Unarmored Movement                 |
| Paladin    | d10     | WIS, CHA       | Divine Sense, Lay on Hands, Smite, Spellcasting      |
| Ranger     | d10     | STR, DEX       | Favored Enemy, Natural Explorer, Spellcasting        |
| Rogue      | d8      | DEX, INT       | Sneak Attack, Cunning Action, Expertise              |
| Sorcerer   | d6      | CON, CHA       | Spellcasting, Metamagic, Sorcerous Origin            |
| Warlock    | d8      | WIS, CHA       | Pact Magic, Eldritch Invocations, Pact Boon          |
| Wizard     | d6      | INT, WIS       | Spellcasting, Arcane Recovery, Arcane Tradition      |

**Confidence: HIGH** — enumerated in `src/data.ts:CLASSES`, `src/data.ts:CLASS_HIT_DIE`,
`src/data.ts:CLASS_SAVES`.
**Source:** `ruleset/classes/` (one file per class), `src/data.ts`.
**Table:** `xp_thresholds` (level → XP, `src/data.ts:LEVELS`).

---

## Conditions

Fifteen conditions with mechanical effects.

1. Blinded
2. Charmed
3. Deafened
4. Exhausted (6 levels, `exhaustion` table)
5. Frightened
6. Grappled
7. Incapacitated
8. Invisible
9. Paralyzed
10. Petrified
11. Poisoned
12. Prone
13. Restrained
14. Stunned
15. Unconscious

**Confidence: HIGH** — enumerated in `src/data.ts:CONDITIONS`.
**Source:** `ruleset/gameplay/conditions.md`, `src/data.ts`.
**Table:** `exhaustion` (level → effect).

---

## Equipment

### Weapons (37)

Weapon classifications include: simple vs. martial, melee vs. ranged, damage
type, damage dice, weight, and properties (light, finesse, thrown, heavy,
two-handed, reach, versatile, loading, ammunition, special).

Examples: longsword, greatsword, rapier, shortbow, longbow, dagger, club, mace,
handaxe, javelin, quarterstaff, crossbow (light/heavy/hand), scimitar, warhammer,
battleaxe, flail, glaive, greataxe, greatclub, halberd, lance, maul, morningstar,
pike, sickle, sling, spear, trident, war pick, whip, blowgun, dart, net,
shortsword, light hammer.

### Armor (14)

Armor types: light (3), medium (5), heavy (4), shields (2).

| Category | Armors                                                           |
|----------|------------------------------------------------------------------|
| Light    | Padded, Leather, Studded Leather                                 |
| Medium   | Hide, Chain Shirt, Scale Mail, Breastplate, Half Plate           |
| Heavy    | Ring Mail, Chain Mail, Splint, Plate                             |
| Shield   | Shield, Tower Shield (DMG)                                       |

**Confidence: HIGH** — both weapons and armor are in structured tables;
extracted into `src/generated/weapons.json` (37 entries) and
`src/generated/armor.json` (14 entries).
**Source:** `ruleset/equipment/`, `scripts/build-index.ts`, `src/data.ts:lookupWeapon`,
`src/data.ts:lookupArmor`.

---

## Spells

319 spells across levels 0 (cantrip) through 9.

Each spell includes: name, level, school, casting time, range, components,
duration, and full description text. Spell lists are keyed by class.

Schools: Abjuration, Conjuration, Divination, Enchantment, Evocation,
Illusion, Necromancy, Transmutation.

**Confidence: HIGH** — extracted from structured spell-list tables and
individual spell files. The SRD spells are canonical and complete for SRD scope.
**Source:** `ruleset/spells/` (one file per spell letter group + index files),
`src/generated/spells.json` (319 entries), `src/data.ts:lookupSpell`.

---

## Monsters

318 monster stat blocks.

Each monster includes: name, size, type, alignment, armor class, hit points,
speed, ability scores, saving throws, skills, damage vulnerabilities/resistances/
immunities, condition immunities, senses, languages, challenge rating (CR),
and traits/actions (multiattack, legendary actions where applicable).

Types: aberration, beast, celestial, construct, dragon, elemental, fey, fiend,
giant, humanoid, monstrosity, ooze, plant, undead.

**Confidence: HIGH** — extracted from structured stat-block entries. CR range
0 through 30.
**Source:** `ruleset/monsters/` (one file per monster), `src/generated/monsters.json`
(318 entries), `src/data.ts:lookupMonster`.

---

## Magic Items

239 magic items extracted from the SRD magic items list and item descriptions.

Each item includes: name, type (armor, weapon, potion, ring, rod, scroll, staff,
wand, wondrous item), rarity (common, uncommon, rare, very rare, legendary),
attunement requirement, and description.

**Confidence: MEDIUM** — extracted from prose descriptions rather than pure
structured tables. Some items may have incomplete fields (e.g. missing
attunement flags or ambiguous rarity). Validated against the canonical SRD
item list but not exhaustively compared.
**Source:** `ruleset/magic-items/`, `src/generated/magic-items.json` (239 entries),
`src/data.ts:lookupMagicItem`.

---

## Additional Tables

| Table                 | Contents                                                  |
|-----------------------|-----------------------------------------------------------|
| `ability_modifiers`   | Score → modifier mapping (1:1 formula)                    |
| `difficulty_classes`  | DC 5 (Very Easy) through DC 30 (Nearly Impossible)         |
| `exhaustion`          | 6 levels of exhaustion effects                            |
| `xp_thresholds`       | Level 1–20 XP requirements                                |
| `trinkets`            | 100-entry d100 trinket table                              |
| `travel_pace`         | Fast/Normal/Slow pace with per-minute/hour/day distances  |

**Source:** `src/data.ts`, `ruleset/equipment/trinkets.md`,
`ruleset/adventuring/`, `ruleset/using-ability-scores/`.

---

## Defect Log

Known extraction gaps or deviations from the full 5e rules (not SRD-limited):

1. **No subclasses beyond base features.** The SRD includes class feature
   progressions but only the base class and one exemplar subclass (e.g.
   Life Domain for Cleric, Evocation School for Wizard). All other
   subclasses are omitted.

2. **No psionics subsystem.** Psionic classes (Mystic) and psionic subclasses
   (Soul Knife, Psi Warrior) are not in the SRD.

3. **No epic-level content.** Levels 21+ and epic boons are not in the SRD;
   the ruleset caps at level 20.

4. **No vehicle or ship combat rules.** Naval combat, airship, and vehicle
   rules from supplemental books are absent.

5. **Limited downtime activities.** Only the downtime activities described in
   `ruleset/adventuring/` are available; expanded crafting, stronghold,
   and follower rules are not in the SRD.

6. **Magic item confidence MEDIUM.** Some items may have missing attunement
   flags, incomplete rarity classifications, or truncated descriptions
   due to prose-based extraction.

7. **Warlock invocations limited.** The SRD includes a subset of Eldritch
   Invocations; the full invocation list from the Player's Handbook is
   not available.

8. **Multiclass rules exist but are not validated mechanically.** The
   multiclassing section is present in the SRD but the server does not
   enforce multiclass build constraints automatically.

9. **Feats are present but limited.** Only the SRD-available feats (e.g.
   Grappler) are included; the full PHB feat list is not available.

10. **Backgrounds are present but not indexed for lookup.** Background files
    exist in the ruleset but are not extracted into structured JSON tables.
