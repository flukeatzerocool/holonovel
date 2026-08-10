// Enrichment Manifest — Tier 1 ruleset-native + vendor enrichment
// REQ-080: additive only, never modifies mechanics
// REQ-225: Tier 1 enrichment extracted at build time
// REQ-227: Tier 1 (ruleset-native + vendor, never removed by revert_enrichment)
// Seven output modules populated per §11.1 — community enrichment (Tier 2) not run
export interface EnrichmentItem {
  content: string;
  source_url: string;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  tag?: string;
  hat_scope: "player" | "game_master" | "shared";
  category?: string;
}

export interface ActionPattern {
  intent: string;
  expected_categories: string[];
  ruleset_section: string;
  source_url?: string;
}

export interface NarrativeVoice {
  name: string;
  source: string;
  media_title: string;
  media_type: "film" | "novel" | "game" | "other";
  description: string;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  tag?: string;
  hat_scope: "player" | "game_master" | "shared";
}

export interface EnrichmentManifest {
  collected_at: string;
  spec_version: string;
  voice_examples: EnrichmentItem[];
  briefing_order: { sections: string[]; reason: string; source_url: string; confidence: string };
  lore_templates: EnrichmentItem[];
  action_patterns: ActionPattern[];
  supplementary_guidance: EnrichmentItem[];
  adventure_advice: {
    templates: EnrichmentItem[];
    scenario_starters: EnrichmentItem[];
    table_expansions: EnrichmentItem[];
  };
  narrative_voices: NarrativeVoice[];
}

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
    {
      content: "Device puzzle design — a device is switched on or switched off. Puzzle states are binary — power, access, visibility, safety. Design puzzles where the device's state gates progress: a powered-down elevator blocks ascent, a switched-on alarm draws patrols, a deactivated force field exposes a path. The puzzle is not the device — it's what the device controls. Place devices where multiple rooms can observe their effects.",
      source_url: "narrative_world_model/world/world-model-provider.md",
      confidence: "HIGH",
      tag: "vendor",
      hat_scope: "game_master",
      category: "device_puzzles",
    },
    {
      content: "Vehicle encounters — a vehicle is enterable and mobile. Design vehicles as contained world fragments: boarding changes location context, passengers share the vehicle's fate, exits from the interior can change mid-scene (a docking station, a crash site, an override hatch). Vehicles can be escape routes, mobile bases, or traps — what boards with you matters as much as where it travels.",
      source_url: "narrative_world_model/world/world-model-provider.md",
      confidence: "HIGH",
      tag: "vendor",
      hat_scope: "game_master",
      category: "vehicle_encounters",
    },
    {
      content: "Environmental text through readable objects — inscriptions, books, scrolls, and other readable things deliver lore without an NPC mouthpiece. A readable object tells the player what the world thinks is worth recording. Use read_text for the text players discover through the 'read' command; use the description property for what they see when they 'examine'. The gap between what's readable and what's visible is a puzzle design tool.",
      source_url: "narrative_world_model/world/world-model-provider.md",
      confidence: "HIGH",
      tag: "vendor",
      hat_scope: "game_master",
      category: "environmental_text",
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
    {
      intent: "I want to turn a device on, off, or interact with a machine",
      expected_categories: ["Command"],
      ruleset_section: "World Model — devices are switchable (REQ-316)",
      source_url: "narrative_world_model/world/world-model-provider.md",
    },
    {
      intent: "I want to enter, exit, or navigate aboard a vehicle",
      expected_categories: ["Command"],
      ruleset_section: "World Model — vehicles are enterable (REQ-317)",
      source_url: "narrative_world_model/world/world-model-provider.md",
    },
    {
      intent: "I want to wear, remove, eat, or drink an item",
      expected_categories: ["Command"],
      ruleset_section: "World Model — extended property commands (REQ-318)",
      source_url: "narrative_world_model/world/world-model-provider.md",
    },
    {
      intent: "I want to read text from an inscription, book, or readable object",
      expected_categories: ["Command"],
      ruleset_section: "World Model — readable property (REQ-318)",
      source_url: "narrative_world_model/world/world-model-provider.md",
    },
    {
      intent: "I want to ask, tell, give, show, or throw something at an NPC",
      expected_categories: ["Command"],
      ruleset_section: "World Model — narrative-intent verbs (REQ-320)",
      source_url: "narrative_world_model/world/world-model-provider.md",
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
    {
      content: "Device interaction in D&D world design — treat devices as environmental mechanics, not character abilities. A device's switched state is visible and testable: a lever is up or down, a gate is open or closed. Use devices for puzzles that don't require skill checks — a player who deduces the correct switch combination solves the puzzle regardless of their character's Intelligence score. D&D characters interact with devices via the 'switch on/off' parser commands, not ability checks — the puzzle is solved by player reasoning, not dice.",
      source_url: "narrative_world_model/world/world-model-provider.md",
      confidence: "HIGH",
      tag: "vendor",
      hat_scope: "game_master",
      category: "device_design",
    },
    {
      content: "Vehicle encounter design for D&D — vehicles extend the combat and exploration surfaces. A combat encounter aboard a moving vehicle adds terrain change on every turn (the steering deck, the cargo hold, the crow's nest). A vehicle chase uses speed and countdowns rather than attack rolls. Movement between vehicle interiors (deck to cabin, pilot seat to engine room) is room-level navigation with the vehicle as boundary. Vehicle exits are conditional room connections — they change based on the vehicle's state (docked, airborne, damaged, abandoned).",
      source_url: "narrative_world_model/world/world-model-provider.md",
      confidence: "HIGH",
      tag: "vendor",
      hat_scope: "game_master",
      category: "vehicle_design",
    },
    {
      content: "Parser commands in the world model — Core tier (go, look, examine, take, drop, inventory, wait, open, close, unlock, lock) covers fundamental physical interaction with the world. Standard tier (wear, remove, eat, drink, climb, enter, exit, switch on, switch off, sit, stand, push, pull, light, extinguish, listen, smell, touch, insert, read) extends to object properties and sensory actions. Narrative tier (ask, tell, give, show, throw) covers NPC-directed social verbs that route to the GM surface for narrative resolution. Commands not matching any tier fall through to the GM for interpretation — this keeps the parser open-ended.",
      source_url: "narrative_world_model/world/world-model-provider.md",
      confidence: "HIGH",
      tag: "vendor",
      hat_scope: "game_master",
      category: "parser_commands",
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
      {
        content: "Device-based puzzle design — a puzzle consists of at least two devices whose states interact. The combination that solves the puzzle gates progress. Map device response to environmental change: a switched-on generator lights a dark room, a deactivated barrier opens a path, a toggled lever raises a portcullis. Multi-room puzzles use devices whose effects are only observable from another location — the player must learn the relationship by observation, not by being told.",
        source_url: "narrative_world_model/world/world-model-provider.md",
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
      {
        content: "A vehicle escape — the party boards a vehicle to flee a pursuing danger. The vehicle's interior is a multi-room location. A countdown tracks pursuit proximity. Each turn, one player navigates (steering/evasion checks), another manages onboard hazards (damage control, cargo shifting), a third defends against boarding attempts. The vehicle itself has properties (condition, speed) that change turn by turn.",
        source_url: "narrative_world_model/world/world-model-provider.md",
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
