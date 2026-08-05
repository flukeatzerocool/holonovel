# D&D 5e SRD v5.1 — Ruleset Model

## Extraction Summary

- **Source:** D&D 5th Edition SRD v5.1 (Wizards of the Coast, 2016)
- **License:** Open Game License v1.0a (OGL) + Creative Commons Attribution 4.0 International (CC BY 4.0)
- **Files:** 1,021 Markdown files across 10 category directories
- **Confidence:** 85% overall (87% HIGH, 10% MEDIUM, 3% LOW)

## Concepts

| Concept | Category | Confidence | Source |
|---------|----------|-----------|--------|
| Ability Scores (STR/DEX/CON/INT/WIS/CHA) | Core mechanic | HIGH | using-ability-scores |
| Skills (18) | Resolution | HIGH | using-ability-scores |
| Advantage/Disadvantage | Resolution | HIGH | gameplay |
| Proficiency Bonus | Resolution | HIGH | gameplay |
| Conditions (15) | State | HIGH | combat |
| Spell Levels (0-9) | State | HIGH | spells |
| Hit Dice | Entity | HIGH | classes |
| Armor Class | Combat | HIGH | equipment |
| Saving Throws | Resolution | HIGH | gameplay |
| Challenge Rating | Entity | HIGH | monsters |
| Legendary Actions | Combat | MEDIUM | monsters |
| Concentration | State | HIGH | spells |
| Ritual Casting | Resolution | MEDIUM | spells |
| Death Saving Throws | State | HIGH | combat |
| Exhaustion (6 levels) | State | HIGH | gameplay |
| Short Rest / Long Rest | Recovery | HIGH | adventuring |
| Attunement | State | MEDIUM | magic-items |

## Entities

### Player Races (9)
Dragonborn, Dwarf, Elf, Gnome, Half-Elf, Half-Orc, Halfling, Human, Tiefling

### Classes (12)
Barbarian (d12), Bard (d8), Cleric (d8), Druid (d8), Fighter (d10), Monk (d8), Paladin (d10), Ranger (d10), Rogue (d8), Sorcerer (d6), Warlock (d8), Wizard (d6)

### Monsters (318)
Full stat blocks with: name, size, type, alignment, armor_class, hit_points, speed, STR/DEX/CON/INT/WIS/CHA, saving_throws, skills, damage resistances/immunities/vulnerabilities, condition immunities, senses, languages, challenge_rating, special traits, actions, legendary actions.

Each stat block confidence: HIGH (directly extracted from Markdown).

## Actions

### Resolution (dice rolls)
| Action | Classification | Registration |
|--------|---------------|-------------|
| `roll_save` | Resolution | MUST |
| `roll_skill_check` | Resolution | MUST |
| `roll_weapon_attack` | Resolution | MUST |
| `roll_weapon_damage` | Resolution | MUST |
| `roll_on_table` | Generation | MUST |

### Command (state mutation)
| Action | Classification | Registration |
|--------|---------------|-------------|
| `apply_condition` | Command | MUST |
| `remove_condition` | Command | MUST |
| `init_combat` | Command | MUST |
| `advance_combat` | Command | MUST |
| `end_combat` | Command | MUST |
| `create_character` | Command (workflow) | MUST |
| `set_scene_state` | Command | SHOULD |
| `set_scene_type` | Command | SHOULD |

### Generation
| Action | Classification | Registration |
|--------|---------------|-------------|
| `roll_on_table` | Generation | MUST |
| `generate_adventure` | Generation | SHOULD |
| `generate_encounter` | Generation | SHOULD |

### Lookup
| Action | Classification | Registration |
|--------|---------------|-------------|
| `lookup_equipment` | Pure resolution | MUST |
| `lookup_spell` | Pure resolution | MUST |
| `lookup_monster` | Pure resolution | MUST |
| `lookup_class` | Pure resolution | MUST |
| `search_rules` | Pure resolution | MUST |

## Tables

| Table | Type | Dice | Confidence |
|-------|------|------|-----------|
| Weapons (37) | Lookup | — | HIGH |
| Armor (14) | Lookup | — | HIGH |
| Spells (319) | Lookup | — | HIGH |
| Monsters (318) | Lookup | — | HIGH |
| Magic Items (239) | Lookup | — | HIGH |
| Ability Modifiers | Reference | — | HIGH |
| Difficulty Classes | Reference | — | HIGH |
| Exhaustion | Reference | — | HIGH |
| XP Thresholds | Reference | — | HIGH |
| Trinkets | Generation | d100 | MEDIUM |
| Travel Pace | Reference | — | MEDIUM |

## Resolution

**Core mechanic:** d20 + ability modifier + proficiency bonus vs. Difficulty Class.

- Natural 20 = automatic success on attack rolls (critical hit — double damage dice)
- Natural 1 = automatic miss on attack rolls
- Advantage: roll 2d20, take higher
- Disadvantage: roll 2d20, take lower

**Saving throws:** d20 + ability modifier (+ proficiency if proficient) vs. Save DC

**Skill checks:** d20 + ability modifier (+ proficiency if proficient in skill) vs. DC

**Weapon attacks:** d20 + ability modifier (STR or DEX based on weapon) + proficiency vs. AC

**Damage:** weapon damage dice + ability modifier

## Roles

- **Player** — controls one or more adventurers. Describes intent; engine resolves.
- **Game Master (Dungeon Master, DM)** — describes world, controls NPCs, adjudicates rules, narrates outcomes.

## Guidance

Guidance is extracted as inert advisory text. Personal-filtered:
- **Player-visible:** Character creation advice, combat action options, skill usage
- **GM-visible:** Encounter design, NPC management, narration techniques
- **Shared:** Anti-slop guidance, persona switch instructions, session zero

All guidance items sourced from enrichment manifest (community play advice) or extracted from ruleset's role-addressed prose.

## Defects

No structural defects. Confidence floor at 85% exceeds the >=80% threshold for Standard tier (D&D 5e is ~2000+ indexed items but most is from structured data extraction which is HIGH confidence).

## Enrichment Summary

| Module | Count | Confidence |
|--------|-------|-----------|
| Voice examples | 5 | MEDIUM |
| Prompt ordering | 1 | MEDIUM |
| Lore templates | 10 | MEDIUM |
| Action patterns | 10 | HIGH |
| Supplementary guidance | 19 | MEDIUM |
| Adventure advice | 11 | MEDIUM-HIGH |
