// Enrichment Manifest — Tier 1 ruleset-native + vendor enrichment
// REQ-080: additive only, never modifies mechanics
// REQ-225: Tier 1 enrichment extracted at build time
// REQ-227: Tier 1 (ruleset-native + vendor, never removed by revert_enrichment)
// Seven output modules populated per §11.1 — community enrichment (Tier 2) not run
// Types re-exported from holonovel/core

export type { EnrichmentItem, ActionPattern, EnrichmentManifest, NarrativeVoice } from "holonovel/core";

import type { EnrichmentManifest } from "holonovel/core";

export const DEFAULT_ENRICHMENT: EnrichmentManifest = {
  collected_at: new Date().toISOString(),
  spec_version: "2026.08.09",
  voice_examples: [],
  briefing_order: {
    sections: ["scene", "combat_status", "entity_states", "lore_triggered", "countdown_status", "guidance"],
    reason: "D&D 5e gameplay priorities — scene context first, then combat state (D&D's primary mechanical layer), entity conditions and HP, triggered lore, active countdowns, and GM guidance per the SRD Gamemastering chapter",
    source_url: "ruleset/08_Gamemastering/",
    confidence: "HIGH",
  },
  lore_templates: [
    {
      content: "Monster ecology — describe the creature's place in the world: habitat, diet, social structure, territory, and relationship with nearby settlements. A hunter becomes a character when you know what it's protecting.",
      source_url: "ruleset/10_Monsters/Monsters.md",
      confidence: "HIGH",
      tag: "ruleset",
      hat_scope: "game_master",
      category: "monster_ecology",
    },
    {
      content: "Race lore — each people carries a cultural identity beyond ability score increases. Dwarven clan honor, Elven patience born of centuries, Halfling hospitality as survival strategy. Use these as story hooks, not stereotypes.",
      source_url: "ruleset/01_Races/Races_Each/",
      confidence: "HIGH",
      tag: "ruleset",
      hat_scope: "game_master",
      category: "race_lore",
    },
    {
      content: "Class archetype — every class represents a story archetype, not just a mechanical package. A Fighter swore an oath real or unspoken. A Cleric heard a call. A Rogue learned trust is expensive. Build NPCs from the archetype outward.",
      source_url: "ruleset/02_Classes/",
      confidence: "HIGH",
      tag: "ruleset",
      hat_scope: "game_master",
      category: "class_archetypes",
    },
    {
      content: "Magic item provenance — every magic item has a creator, a purpose, and a history. Who made it? For what war, ritual, or betrayal? Magic items found in tombs carry the weight of their origin. A +1 sword with a name and a grudge is a plot engine.",
      source_url: "ruleset/09_Magic_Items/Magic_Items.md",
      confidence: "HIGH",
      tag: "ruleset",
      hat_scope: "game_master",
      category: "magic_item_lore",
    },
  ],
  action_patterns: [
    {
      intent: "I want to make an ability check against a difficulty",
      expected_categories: ["Resolution"],
      ruleset_section: "06_Gameplay/Using_Ability_Scores.md — Ability Checks",
      source_url: "ruleset/06_Gameplay/Using_Ability_Scores.md",
    },
    {
      intent: "I want to make a saving throw to resist an effect",
      expected_categories: ["Resolution"],
      ruleset_section: "06_Gameplay/Using_Ability_Scores.md — Saving Throws",
      source_url: "ruleset/06_Gameplay/Using_Ability_Scores.md",
    },
    {
      intent: "I want to take a special action in combat",
      expected_categories: ["Command", "Resolution"],
      ruleset_section: "06_Gameplay/Order_of_Combat.md — Actions in Combat (Dash, Disengage, Dodge, Help, Hide, Ready, Search, Use an Object)",
      source_url: "ruleset/06_Gameplay/Order_of_Combat.md",
    },
    {
      intent: "I want to grapple or shove a creature",
      expected_categories: ["Resolution", "Command"],
      ruleset_section: "06_Gameplay/Order_of_Combat.md — Grappling and Shoving",
      source_url: "ruleset/06_Gameplay/Order_of_Combat.md",
    },
    {
      intent: "I want to make a death saving throw",
      expected_categories: ["Resolution"],
      ruleset_section: "06_Gameplay/Order_of_Combat.md — Death Saving Throws",
      source_url: "ruleset/06_Gameplay/Order_of_Combat.md",
    },
    {
      intent: "I want to stabilize a dying creature",
      expected_categories: ["Resolution", "Command"],
      ruleset_section: "06_Gameplay/Order_of_Combat.md — Stabilizing a Creature",
      source_url: "ruleset/06_Gameplay/Order_of_Combat.md",
    },
  ],
  supplementary_guidance: [
    {
      content: "Ability checks are the core resolution mechanic — roll a d20, add the relevant ability modifier, compare to a Difficulty Class. The DM sets the DC based on the task: Very Easy (5), Easy (10), Medium (15), Hard (20), Very Hard (25), Nearly Impossible (30). Call for checks only when the outcome is uncertain and failure has consequences.",
      source_url: "ruleset/06_Gameplay/Using_Ability_Scores.md",
      confidence: "HIGH",
      tag: "ruleset",
      hat_scope: "game_master",
      category: "ability_checks",
    },
    {
      content: "Advantage and disadvantage replace numerical modifiers for circumstantial effects. When you have advantage, roll two d20s and take the higher. When you have disadvantage, take the lower. If both apply, they cancel regardless of how many sources of each. This is the ruleset's primary situational modifier — use it instead of stacking +2/-2 bonuses.",
      source_url: "ruleset/06_Gameplay/Using_Ability_Scores.md",
      confidence: "HIGH",
      tag: "ruleset",
      hat_scope: "game_master",
      category: "advantage_disadvantage",
    },
    {
      content: "Combat runs on a three-pillar action economy: Action, Bonus Action, Reaction. Every creature gets one of each per round, plus movement. An Action covers Attack, Cast a Spell, Dash, Disengage, Dodge, Help, Hide, Ready, Search, or Use an Object. A Bonus Action is available only when a feature or spell grants one. A Reaction triggers on a specific event — opportunity attacks are the most common.",
      source_url: "ruleset/06_Gameplay/Order_of_Combat.md",
      confidence: "HIGH",
      tag: "ruleset",
      hat_scope: "game_master",
      category: "combat_actions",
    },
    {
      content: "Conditions are the primary state modifiers: Blinded, Charmed, Deafened, Frightened, Grappled, Incapacitated, Invisible, Paralyzed, Petrified, Poisoned, Prone, Restrained, Stunned, Unconscious, and Exhaustion (6 levels). Each has specific mechanical effects. Use conditions instead of ad-hoc penalties — they're the language the ruleset speaks for status effects.",
      source_url: "ruleset/08_Gamemastering/Conditions.md",
      confidence: "HIGH",
      tag: "ruleset",
      hat_scope: "game_master",
      category: "conditions",
    },
    {
      content: "Inspiration is the GM's tool for rewarding character-driven play. Award it when a player draws on their personality traits, ideals, bonds, or flaws in a way that drives the story — especially when it creates complications. A player with inspiration can spend it to gain advantage on any d20 roll. A player can also transfer their inspiration to another player as a reward for good roleplaying.",
      source_url: "ruleset/03_Characterization/Inspiration.md",
      confidence: "HIGH",
      tag: "ruleset",
      hat_scope: "game_master",
      category: "inspiration",
    },
  ],
  adventure_advice: {
    templates: [
      {
        content: "Build encounters around the adventuring day budget. A party can handle 6-8 medium or hard encounters between long rests, with two short rests. The XP thresholds per character per adventuring day set the pace: Easy (drain few resources), Medium (one or two scary moments), Hard (a character might go down), Deadly (lethal without tactics).",
        source_url: "ruleset/08_Gamemastering/",
        confidence: "HIGH",
        tag: "ruleset",
        hat_scope: "game_master",
      },
      {
        content: "Design obstacles, not solutions. A progress clock tracks the obstacle — never the method. This preserves player agency over how they overcome each challenge. D&D's three-pillar model (Combat, Exploration, Social Interaction) means every obstacle has multiple approaches.",
        source_url: "narrative_world_model/bitd/progress-clocks.md",
        confidence: "HIGH",
        tag: "vendor",
        hat_scope: "game_master",
      },
    ],
    scenario_starters: [
      {
        content: "A dungeon entrance with three distinct paths: the trapped front door (perception + thieves' tools), the guarded side entrance (stealth + deception), and the collapsed tunnel (athletics + survival). Each path demonstrates a different pillar — the party's choice reveals their preferred approach to danger.",
        source_url: "ruleset/08_Gamemastering/",
        confidence: "HIGH",
        tag: "ruleset",
        hat_scope: "game_master",
      },
      {
        content: "Two racing clocks — the party must complete their objective before a danger clock fills. If the party's clock fills first, they succeed with a cost. If the danger clock fills first, the situation escalates but creates a new angle of approach. The clock shows progress — it doesn't determine it.",
        source_url: "narrative_world_model/bitd/progress-clocks.md",
        confidence: "HIGH",
        tag: "vendor",
        hat_scope: "game_master",
      },
    ],
    table_expansions: [],
  },
  narrative_voices: [
    {
      name: "Sword & Sorcery — Howard and Leiber",
      source: "narrative_world_model/if-craft-corpus/README.md",
      media_title: "IF Craft Corpus (genre-conventions cluster)",
      media_type: "other",
      description: "Pulp pacing, visceral action, moral ambiguity. Heroes survive by wit and steel, not divine favor. Cities are dens of intrigue; wilderness is indifferent and lethal. Treasure has weight — carrying it out matters as much as finding it. Magic is rare, dangerous, and leaves marks on those who wield it.",
      confidence: "HIGH",
      tag: "vendor",
      hat_scope: "game_master",
    },
    {
      name: "High Fantasy — Tolkien Tradition",
      source: "narrative_world_model/if-craft-corpus/README.md",
      media_title: "IF Craft Corpus (genre-conventions cluster)",
      media_type: "other",
      description: "Epic scope, clear moral stakes, the weight of history. Ancient evils stir; unlikely heroes rise. Locations are characters — the Mines of Moria, the Shire, the Lonely Mountain tell their own stories. Songs and languages hint at deeper worlds. Victory costs something irreplaceable. The small and overlooked change the fate of the powerful.",
      confidence: "HIGH",
      tag: "vendor",
      hat_scope: "game_master",
    },
    {
      name: "Dark Fantasy — Gothic and Weird Fiction",
      source: "narrative_world_model/if-craft-corpus/README.md",
      media_title: "IF Craft Corpus (genre-conventions cluster)",
      media_type: "other",
      description: "Corruption seeps from within, not without. The monster is a mirror — what the hero fears becoming. Gothic atmosphere layers dread: crumbling estates, mist-choked streets, bloodlines carrying old debts. Information is currency; knowledge of the true threat is hard-won and harder to share. Victory is survival, not triumph.",
      confidence: "HIGH",
      tag: "vendor",
      hat_scope: "game_master",
    },
  ],
};
