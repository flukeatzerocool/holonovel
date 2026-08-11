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
  voice_examples: [
    {
      content: "D&D SRD narrative voice — the ruleset's own prose models a GM's descriptive register. Scene-setting passages use sensory detail and concrete nouns: 'A net hidden among the trees might drop on travelers who pass underneath.' Environmental descriptions build threat through implication rather than declaration. The SRD teaches GMs to describe what the character perceives, not what the character concludes — 'you see a section of floor with no foot traffic' rather than 'you find a pit trap.'",
      source_url: "ruleset/08_Gamemastering/Traps.md",
      confidence: "HIGH",
      tag: "ruleset",
      hat_scope: "game_master",
      category: "narrative_register",
    },
    {
      content: "The SRD's opening vignettes model scene-setting tone for each ruleset subsystem. When introducing a disease, the ruleset frames it as story: 'A plague ravages the kingdom, setting the adventurers on a quest to find a cure.' When describing planar travel: 'They are undertaking a legendary journey across the thresholds of existence to a mythic destination.' Use these tonal models as voice templates — open each chapter of your campaign with the SRD's mix of concrete stakes and mythic scope.",
      source_url: "ruleset/08_Gamemastering/Diseases.md",
      confidence: "HIGH",
      tag: "ruleset",
      hat_scope: "game_master",
      category: "opening_vignettes",
    },
    {
      content: "NPC voice design — define pitch (high/medium/low), speed (fast/medium/slow), tone (raspy/warm/clipped/resonant), accent, and vocal quirks (catchphrases, speech patterns, physical tics). A barkeep with 'raspy tone, slow speed, laughs before bad news' is immediately distinct from a guard captain with 'clipped tone, fast speed, ends every sentence as a question.' Voice fields make NPCs recognizable before the GM says their name.",
      source_url: "narrative_world_model/narrative/dmcp/README.md",
      confidence: "HIGH",
      tag: "vendor",
      hat_scope: "game_master",
      category: "npc_voice_fields",
    },
    {
      content: "Choice prompt voice — structure decision points as the ruleset structures trap descriptions: present the observable situation first, then the possible approaches. 'The corpo goon blocks your path. What's your play?' followed by distinct tactical options (talk, bribe, fight, sneak). Each choice label is a verb that implies method. Each description gives just enough context for the player to commit without resolving the outcome. Allow freeform input for approaches the GM didn't anticipate.",
      source_url: "narrative_world_model/narrative/dmcp/README.md",
      confidence: "HIGH",
      tag: "vendor",
      hat_scope: "game_master",
      category: "choice_prompt_voice",
    },
    {
      content: "Session-notation voice — adopt Lonelog's separation of mechanics from fiction in your narrative presentation. When a roll occurs, state the mechanic ('DC 15 Dexterity saving throw') then narrate the outcome ('The ceiling groans, dust rains from the cracks — you dive clear as the stone collapses behind you'). Keep mechanical calls visible but distinct from narrative description. This separation lets players track game state without interrupting the fiction.",
      source_url: "narrative_world_model/narrative/lonelog/lonelog.md",
      confidence: "HIGH",
      tag: "vendor",
      hat_scope: "game_master",
      category: "mechanics_fiction_separation",
    },
  ],
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
      content: "Divine worldbuilding — pantheons are not background lists; they are faction maps. Each deity's domain, alignment, and symbol implies a mortal institution: temples, cults, knightly orders, heretic sects. Deities with overlapping domains (Ares and Athena both claim War) are natural rivals whose mortal agents compete. Use the pantheon as a political layer — divine favor is a resource temples hoard and adventurers spend.",
      source_url: "ruleset/08_Gamemastering/Pantheons.md",
      confidence: "HIGH",
      tag: "ruleset",
      hat_scope: "game_master",
      category: "pantheon_worldbuilding",
    },
    {
      content: "Planar geography — the planes are not alternate dimensions to visit at high level; they are environmental templates for every location. A volcano's heart is a border region of the Plane of Fire. The depths of the ocean touch the Plane of Water. A desecrated temple bleeds into a Lower Plane. Use planar bleed to explain environmental hazards, magical phenomena, and creature ecologies without invoking high-level spells. The Material Plane is the nexus — every fantastic location is a place where another plane presses close.",
      source_url: "ruleset/08_Gamemastering/Planes.md",
      confidence: "HIGH",
      tag: "ruleset",
      hat_scope: "game_master",
      category: "planar_lore",
    },
    {
      content: "Trap as environmental storytelling — a trap reveals its builder. Scything blades in a tomb speak of a culture that feared grave robbers. A poison needle in a merchant's lockbox tells of paranoia, not greed. The trap's trigger mechanism (pressure plate vs. trip wire vs. magical ward), its effect (damage vs. restraint vs. alarm), and its bypass (hidden lever vs. password vs. sacrificial offering) are all clues about who built it and what they valued. Traps are messages from the dungeon's past — let the party read them.",
      source_url: "ruleset/08_Gamemastering/Traps.md",
      confidence: "HIGH",
      tag: "ruleset",
      hat_scope: "game_master",
      category: "trap_lore",
    },
    {
      content: "Disease as narrative catalyst — a disease is a timer with a face. Cackle Fever spreads through proximity and forces saving throws under stress — it punishes combat and rewards isolation. Sewer Plague drains recovery resources — it turns long rests into tactical decisions. Sight Rot escalates over days — it creates urgency without combat. Each disease in the SRD models a different story structure: outbreak (contagion), mystery (finding the cure), siege (holding out until help arrives), or tragedy (watching an ally deteriorate). The specific mechanics are less important than the clock they impose.",
      source_url: "ruleset/08_Gamemastering/Diseases.md",
      confidence: "HIGH",
      tag: "ruleset",
      hat_scope: "game_master",
      category: "disease_lore",
    },
    {
      content: "Madness as consequence layer — the SRD splits madness into three durations (short-term, long-term, indefinite) that map directly to story stakes. Short-term madness (1d10 minutes) is combat disruption — a failed save in a fight creates chaos the party must manage. Long-term madness (1d10×10 hours) is session-level complication — the party must protect a compromised member through the rest of the adventure. Indefinite madness (until cured) is character-defining — a new flaw that changes how the player roleplays. Madness is not a punishment; it is a narrative tool for horror campaigns that makes every encounter a potential origin story.",
      source_url: "ruleset/08_Gamemastering/Madness.md",
      confidence: "HIGH",
      tag: "ruleset",
      hat_scope: "game_master",
      category: "madness_lore",
    },
    {
      content: "Poison as intrigue tool — the SRD's four delivery types (contact, ingested, inhaled, injury) each enable a different story. Contact poison smeared on a door handle is a trap the party can discover by investigation. Ingested poison in food or drink is a social-encounter weapon — perception and insight replace attack rolls. Inhaled poison as a gas or powder creates area denial. Injury poison on a weapon or trap is an assassination tool. Poisons are illegal in most societies — possession alone creates legal jeopardy, making every poison-related encounter a potential crime scene.",
      source_url: "ruleset/08_Gamemastering/Poisons.md",
      confidence: "HIGH",
      tag: "ruleset",
      hat_scope: "game_master",
      category: "poison_lore",
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
      intent: "I want to take a short rest to spend Hit Dice and recover",
      expected_categories: ["Command"],
      ruleset_section: "06_Gameplay/Adventuring.md — Short Rest (spend Hit Dice, regain hit points equal to roll + Constitution modifier)",
      source_url: "ruleset/06_Gameplay/Adventuring.md",
    },
    {
      intent: "I want to take a long rest to recover fully",
      expected_categories: ["Command"],
      ruleset_section: "06_Gameplay/Adventuring.md — Long Rest (8 hours, 6 hours sleep, regain all HP and up to half of spent Hit Dice)",
      source_url: "ruleset/06_Gameplay/Adventuring.md",
    },
    {
      intent: "I want to detect or disable a trap",
      expected_categories: ["Resolution", "Command"],
      ruleset_section: "08_Gamemastering/Traps.md — Detecting and Disabling (Wisdom (Perception) to spot, Intelligence (Investigation) to deduce, Dexterity with thieves' tools to disable, Intelligence (Arcana) for magic traps)",
      source_url: "ruleset/08_Gamemastering/Traps.md",
    },
    {
      intent: "I want to craft an item during downtime",
      expected_categories: ["Command"],
      ruleset_section: "06_Gameplay/Adventuring.md — Crafting (5 gp progress per day, raw materials cost half market value, requires tool proficiency)",
      source_url: "ruleset/06_Gameplay/Adventuring.md",
    },
    {
      intent: "I want to research information during downtime",
      expected_categories: ["Command", "Resolution"],
      ruleset_section: "06_Gameplay/Adventuring.md — Researching (1 gp per day, GM determines availability and DC, Intelligence (Investigation) or Charisma (Persuasion) checks)",
      source_url: "ruleset/06_Gameplay/Adventuring.md",
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
      content: "Trap design and adjudication — every trap needs a trigger (pressure plate, trip wire, doorknob, wrong key), a detection method (Wisdom (Perception) vs. trap DC, passive Perception for noticing in passing), and a disable method (Dexterity with thieves' tools, Intelligence (Arcana) for magic traps, dispel magic, or clever physical bypass). Never let die rolls override clever play — if a player describes an action that would clearly reveal or foil a trap, no check is required. A trap's severity (setback/dangerous/deadly) sets the save DC and damage, scaled to character level. Complex traps roll initiative and act each round — treat them as combat encounters with non-creature opponents.",
      source_url: "ruleset/08_Gamemastering/Traps.md",
      confidence: "HIGH",
      tag: "ruleset",
      hat_scope: "game_master",
      category: "trap_adjudication",
    },
    {
      content: "Object interaction and destruction — objects have AC by substance (cloth 11, wood 15, stone 17, steel 19, adamantine 23) and HP by size and fragility (Tiny fragile 2, Large resilient 27). Objects are immune to poison and psychic damage. Large objects like castle walls may have a damage threshold — they ignore all damage from any single attack below the threshold. For Huge and Gargantuan objects, divide into Large sections and track each section's HP separately. The core principle: given enough time and the right tools, characters can destroy any destructible object — the rules only matter when time is a factor.",
      source_url: "ruleset/08_Gamemastering/Objects.md",
      confidence: "HIGH",
      tag: "ruleset",
      hat_scope: "game_master",
      category: "object_interaction",
    },
    {
      content: "Disease as plot device — a disease that infects more than a few party members is primarily a story engine, not a mechanical affliction. The SRD explicitly states that 'the specifics of how a disease works aren't bound by a common set of rules' and that 'what matters is the story you want to tell.' Diseases can target specific races, spread through specific vectors (bite, contact, contaminated water), have incubation periods, and impose conditions or exhaustion. Use diseases to create quest structures: find the cure, stop the spread, survive the outbreak, or discover Patient Zero.",
      source_url: "ruleset/08_Gamemastering/Diseases.md",
      confidence: "HIGH",
      tag: "ruleset",
      hat_scope: "game_master",
      category: "disease_guidance",
    },
    {
      content: "Madness system — resistance usually requires a Wisdom or Charisma saving throw. Short-term madness lasts 1d10 minutes and produces combat-level effects (paralysis, incapacitation, fright, compulsion to attack). Long-term madness lasts 1d10×10 hours with session-level effects (paranoia, delusion, amnesia, attachment to objects, confusion on damage). Indefinite madness grants a new character flaw until cured via greater restoration or equivalent magic. Calm emotions suppresses effects; lesser restoration cures short/long-term; greater restoration cures indefinite. Madness is a horror-campaign tool — it makes every supernatural encounter carry personality-level stakes beyond hit point loss.",
      source_url: "ruleset/08_Gamemastering/Madness.md",
      confidence: "HIGH",
      tag: "ruleset",
      hat_scope: "game_master",
      category: "madness_guidance",
    },
    {
      content: "Poison delivery and adjudication — four types govern how poison reaches its target. Contact poison on objects remains potent until touched or washed. Ingested poison requires a full dose in food or liquid; partial doses may grant advantage on the save or halve damage. Inhaled poisons fill a 5-foot cube and dissipate immediately; holding breath is ineffective. Injury poison on weapons or traps remains potent until delivered through a wound or washed off. Most poisons impose the poisoned condition with secondary effects (unconscious, paralyzed, blinded, ongoing damage). Higher-value poisons (Purple Worm 2,000 gp, Wyvern 1,200 gp) deliver more damage and higher save DCs.",
      source_url: "ruleset/08_Gamemastering/Poisons.md",
      confidence: "HIGH",
      tag: "ruleset",
      hat_scope: "game_master",
      category: "poison_guidance",
    },
    {
      content: "Rest and recovery pacing — short rests (1 hour) let characters spend Hit Dice to recover HP. Long rests (8 hours, 6 hours sleep) restore all HP and up to half of spent Hit Dice. Characters can't benefit from more than one long rest per 24 hours. Use rest availability to control adventure pacing: a dungeon with no safe room for 8 hours forces resource management. Interrupt a long rest with 1 hour of strenuous activity to deny its benefits. A character who goes without food for 3+Con mod days or without sufficient water gains exhaustion levels that can't be removed until they eat and drink.",
      source_url: "ruleset/06_Gameplay/Adventuring.md",
      confidence: "HIGH",
      tag: "ruleset",
      hat_scope: "game_master",
      category: "rest_recovery",
    },
    {
      content: "Downtime activities — between adventures, players can craft (5 gp progress/day, raw materials at half cost, requires tool proficiency), practice a profession (covers modest lifestyle, comfortable if in an organization, wealthy with Performance skill), recuperate (3 days then DC 15 Constitution save to end a recovery-blocking effect or gain advantage on disease/poison saves), research (1 gp/day, GM determines availability and checks), or train (250 days, 1 gp/day, learn a language or tool proficiency). Downtime turns campaign time into a resource — what the party chooses to do between adventures reveals their priorities.",
      source_url: "ruleset/06_Gameplay/Adventuring.md",
      confidence: "HIGH",
      tag: "ruleset",
      hat_scope: "game_master",
      category: "downtime_activities",
    },
    {
      content: "Vision and light management — three illumination levels govern perception: bright light (normal vision), dim light (lightly obscured, disadvantage on sight-based Wisdom (Perception) checks), darkness (heavily obscured, effectively blinded when trying to see into it). Darkvision lets creatures see in darkness as if dim light (no color, only grayscale) within range. Blindsight perceives surroundings without sight. Truesight sees through magical darkness, invisibility, illusions, and shapechanging, and perceives into the Ethereal Plane. Light management is a dungeon-design tool — every light source is a decision about what the party can and cannot perceive.",
      source_url: "ruleset/06_Gameplay/Adventuring.md",
      confidence: "HIGH",
      tag: "ruleset",
      hat_scope: "game_master",
      category: "vision_light",
    },
    {
      content: "Travel and exploration pacing — three time scales govern movement: minutes (dungeon crawling, room-by-room), hours (city and wilderness travel), and days (long journeys). Three travel paces control the tradeoff between speed and awareness: Fast (30 miles/day, -5 passive Perception), Normal (24 miles/day), Slow (18 miles/day, able to stealth). Difficult terrain halves distance. Forced march beyond 8 hours requires escalating Constitution saves against exhaustion. Use these scales to make travel a decision space — the party chooses speed vs. safety, and the choice has mechanical consequences.",
      source_url: "ruleset/06_Gameplay/Adventuring.md",
      confidence: "HIGH",
      tag: "ruleset",
      hat_scope: "game_master",
      category: "travel_exploration",
    },
    {
      content: "Pantheons as worldbuilding tools — the SRD provides four complete pantheons (Celtic, Greek, Egyptian, Norse) with deities, alignments, domains, and symbols. Each deity implies institutions: temples, orders, cults. Use pantheon structure to build your own divine politics — deities with overlapping domains are rivals, deities with complementary domains are allies. A deity's alignment sets the tone of their mortal followers. The symbol is a narrative shorthand — a black star on gray (Arawn), a flaming snake (Apep), a coiled cobra (Set) — that appears on temple doors, cultist robes, and ancient relics, letting players piece together divine allegiances through observation.",
      source_url: "ruleset/08_Gamemastering/Pantheons.md",
      confidence: "HIGH",
      tag: "ruleset",
      hat_scope: "game_master",
      category: "pantheon_guidance",
    },
    {
      content: "Planes as adventure settings — the Material Plane is the nexus where all other planes press close. Planar travel can be accomplished by spell (plane shift, gate, etherealness, astral projection) or portal (stationary connections between specific locations). Portals can be doorways, circles of standing stones, sailing ships, or entire towns that exist in multiple planes at once. The Inner Planes (Air, Earth, Fire, Water) provide elemental environments that become more alien and hostile the farther you travel from the Material boundary. The Outer Planes are alignment-aligned realms of thought and spirit where distance is meaningless and the landscape reshapes to the will of powerful inhabitants. A plane's alignment creates dissonance for mismatched visitors — an evil creature in a good-aligned plane feels profoundly uncomfortable. Demiplanes are extradimensional spaces with unique rules, accessible through a single point of contact.",
      source_url: "ruleset/08_Gamemastering/Planes.md",
      confidence: "HIGH",
      tag: "ruleset",
      hat_scope: "game_master",
      category: "planes_guidance",
    },
    {
      content: "Survival pressure — food and water create natural urgency timers. A character needs 1 pound of food and 1 gallon of water per day (2 gallons in hot weather). Going without food for 3+Con mod days imposes exhaustion daily. Drinking half the required water requires a DC 15 Constitution save or exhaustion. Characters already exhausted take two levels. Exhaustion from deprivation can't be removed until the character eats and drinks fully. Use resource scarcity as a pacing tool — a desert crossing, a shipwreck, or a siege turns food and water into quest objectives.",
      source_url: "ruleset/06_Gameplay/Adventuring.md",
      confidence: "HIGH",
      tag: "ruleset",
      hat_scope: "game_master",
      category: "survival",
    },
    {
      content: "NPC voice design for D&D — define each significant NPC with voice fields adapted from DMCP's character voice model: pitch (high/medium/low), speed (fast/medium/slow), tone (raspy/warm/clipped/resonant), accent (regional, class-based, or species-specific), and one or two vocal quirks (catchphrase, speech impediment, verbal tic). A dwarf smith with 'low pitch, slow speed, resonant tone, ends every statement with a question' is instantly distinct from an elf scholar with 'high pitch, fast speed, clipped tone, inserts elvish words for things she considers beneath Common.' Voice fields are performance cues that make NPCs recognizable without requiring the GM to maintain a full accent for hours.",
      source_url: "narrative_world_model/narrative/dmcp/README.md",
      confidence: "HIGH",
      tag: "vendor",
      hat_scope: "game_master",
      category: "npc_voice_design",
    },
    {
      content: "Session pause and resume — save GM context before ending a session: current scene, immediate situation, pending player action, short-term and long-term GM plans, active threads with urgency, NPC attitudes, and player apparent goals. The saved context plus full novel state creates a resume briefing that lets you pick up mid-scene without re-establishing tone or stakes. Use DMCP's pause/resume pattern: capture what the characters are about to decide, not just where they are. The most valuable context is the unanswered question.",
      source_url: "narrative_world_model/narrative/dmcp/README.md",
      confidence: "HIGH",
      tag: "vendor",
      hat_scope: "game_master",
      category: "pause_resume",
    },
    {
      content: "Session structure with Lonelog notation — separate mechanical resolution from narrative description in your session presentation using the Lonelog model. Scene headers establish location and atmosphere. Character actions are declared. Mechanical resolution (dice, DCs, outcomes) is reported cleanly. Narrative outcome follows as prose. Oracle questions and their answers are explicit. This structure keeps game state visible to the player without interrupting the fiction — they know what was rolled and why before hearing what happened. The five-symbol Lonelog vocabulary (###, @, d:, =>, ?) maps directly to GM presentation beats: set scene, describe action, resolve, narrate outcome, ask oracle.",
      source_url: "narrative_world_model/narrative/lonelog/lonelog.md",
      confidence: "HIGH",
      tag: "vendor",
      hat_scope: "game_master",
      category: "session_structure",
    },
    {
      content: "Interactive fiction craft principles — the IF Craft Corpus identifies seven clusters of narrative design patterns applicable to D&D GMing. Narrative structure (branching, pacing, scene structure, endings) maps to adventure design. Prose and language (dialogue craft, character voice, exposition, subtext, POV) maps to NPC performance and scene description. Genre conventions (horror, mystery, romance, sci-fi, fantasy tropes) maps to campaign tone and worldbuilding. World and setting (worldbuilding, canon management, setting as character, naming patterns) maps to lore consistency. Emotional design (tension, atmosphere, emotional beats, conflict patterns) maps to scene pacing. Use genre-appropriate patterns — horror campaigns benefit from dread escalation and limited information; mystery campaigns need clue placement and revelation timing.",
      source_url: "narrative_world_model/narrative/if-craft-corpus/README.md",
      confidence: "HIGH",
      tag: "vendor",
      hat_scope: "game_master",
      category: "if_craft_principles",
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
        content: "Complex trap encounters — treat a complex trap as a combat encounter with a non-creature opponent. The trap rolls initiative and acts each round (rising water, moving blades, collapsing sections). The party must divide attention between disabling the trap's mechanism (skill checks at specific locations in the room) and surviving its ongoing effects (saving throws, damage, forced movement). A complex trap turns trap resolution from a single check into a multi-round tactical problem. The SRD's Rolling Sphere trap (initiative +8, 60 ft. movement, DC 15 Dexterity save or 10d10 damage, can be slowed with DC 20 Strength check) is the reference design.",
        source_url: "ruleset/08_Gamemastering/Traps.md",
        confidence: "HIGH",
        tag: "ruleset",
        hat_scope: "game_master",
      },
      {
        content: "Disease outbreak campaign — an epidemic is a four-act structure. Act I: Patient Zero — the party encounters the first case, symptoms unclear. Act II: Spread — the disease jumps populations, the party traces vectors while managing infected NPCs. Act III: Cure — research, ingredient gathering, rival factions pursuing their own solutions. Act IV: Consequence — even after the cure, society is changed; blame, gratitude, and power vacuums create the next adventure. The SRD's sample diseases model different story speeds: Cackle Fever spreads fast through proximity and punishes stress — use it for siege scenarios. Sewer Plague drains recovery — use it for exploration attrition. Sight Rot escalates over days — use it for ticking-clock quests.",
        source_url: "ruleset/08_Gamemastering/Diseases.md",
        confidence: "HIGH",
        tag: "ruleset",
        hat_scope: "game_master",
      },
      {
        content: "Madness in horror campaigns — use madness as a consequence layer that escalates with exposure. The first brush with cosmic horror imposes short-term madness (combat disruption, 1d10 minutes). Repeated exposure or a major revelation escalates to long-term madness (session-level complication, 1d10×10 hours). Direct contact with an elder evil or a catastrophic failure imposes indefinite madness (new character flaw, permanent until greater restoration). The three tiers create a resource management layer — lesser restoration cures short/long-term but costs spell slots; greater restoration cures indefinite but is expensive and rare. The party's cleric becomes their sanity resource. Madness effects are also roleplaying prompts — use them to reveal character under pressure.",
        source_url: "ruleset/08_Gamemastering/Madness.md",
        confidence: "HIGH",
        tag: "ruleset",
        hat_scope: "game_master",
      },
      {
        content: "Poison intrigue framework — poison is the weapon of social encounters, not combat. Build adventures around the four delivery types. Contact poison: a doorknob, a throne, a religious relic — anyone who touches it is exposed. The party investigates who had access. Ingested poison: a banquet, a wedding toast, a healing potion — the social setting provides suspects and motives. Inhaled poison: a sealed room, a trap corridor, a sacrificial chamber — the environment is the weapon. Injury poison: an assassination attempt, a duel, a trapped chest — the attack reveals the attacker's resources and connections. Every poison encounter is also a legal encounter — possession is illegal in most societies, making investigation and prosecution as important as survival.",
        source_url: "ruleset/08_Gamemastering/Poisons.md",
        confidence: "HIGH",
        tag: "ruleset",
        hat_scope: "game_master",
      },
      {
        content: "Plane-hopping campaign structure — start on the Material Plane and escalate outward. Tier 1 (levels 1-4): planar bleed — locations where another plane touches the Material (volcanic vent to Plane of Fire, deep ocean trench to Plane of Water, desecrated temple to a Lower Plane). Tier 2 (levels 5-10): portal discovery — the party finds and activates a portal to a border region of an Inner or Outer Plane, completing a mission there before returning. Tier 3 (levels 11-16): deliberate travel — the party uses plane shift or gate to pursue a villain or quest across multiple planes, navigating alignment dissonance and hostile environments. Tier 4 (levels 17-20): cosmic stakes — the party operates across the Outer Planes, interacting with deities and reshaping the multiverse. Each tier adds a new plane as setting without overwhelming lower-level play.",
        source_url: "ruleset/08_Gamemastering/Planes.md",
        confidence: "HIGH",
        tag: "ruleset",
        hat_scope: "game_master",
      },
      {
        content: "Pantheon faction politics — each deity's mortal followers form a faction with goals aligned to the deity's domain and alignment. A LN god of death (Anubis) sponsors an order of tomb guardians who oppose grave robbers — including adventurers. A CE god of murder (Set) sponsors assassin cults who operate in the shadows of legitimate temples. Use divine politics as a faction layer: temples compete for converts, resources, and political influence. A deity's rivals are enemies of their followers. A deity's allies are potential patrons. Divine magic is traceable — when a cleric of Thor casts a spell, Thor's enemies (the frost giants, Thrym's cult) can sense it. This makes divine allegiance a strategic choice with narrative consequences.",
        source_url: "ruleset/08_Gamemastering/Pantheons.md",
        confidence: "HIGH",
        tag: "ruleset",
        hat_scope: "game_master",
      },
      {
        content: "Wilderness exploration framework — use the three travel paces (Fast/Normal/Slow) as decision points, not bookkeeping. Fast pace: the party races against a clock but risks ambush (−5 passive Perception). Normal pace: balanced risk. Slow pace: the party moves carefully, uses stealth, and maps thoroughly. Terrain determines difficulty: dense forest halves speed, mountains require climbing checks, swamps carry disease risk. Forced march (travel beyond 8 hours) imposes escalating Constitution saves — the party decides whether pushing on is worth exhaustion. Food and water create natural turnaround points. A wilderness expedition is a resource-management puzzle where the party chooses pace, path, and provisions — each choice changes what encounters they find and in what condition they face them.",
        source_url: "ruleset/06_Gameplay/Adventuring.md",
        confidence: "HIGH",
        tag: "ruleset",
        hat_scope: "game_master",
      },
      {
        content: "Downtime-driven campaign pacing — structure campaigns around adventure/downtime cycles. After each adventure, the party returns to a hub (city, stronghold, ship, temple) where they spend days or weeks on downtime activities. Crafting builds equipment and reputation. Researching advances mysteries and reveals backstory. Training unlocks new capabilities. Recuperating recovers from lasting injuries. The downtime window lets factions advance their own goals (tick faction clocks), NPCs react to the party's last adventure, and the world changes independently. This rhythm keeps campaigns grounded — the party's relationship to their hub community deepens with every cycle, and the world feels alive because things happen when the party isn't looking.",
        source_url: "ruleset/06_Gameplay/Adventuring.md",
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
        content: "Linked and tug-of-war clocks — a linked clock unlocks another clock once filled (overcome 'Defense' to access 'Vulnerable,' fill 'Alert' to trigger 'Trapped'). Use linked clocks to structure multi-phase encounters: each phase changes the tactical situation. A tug-of-war clock can be filled and emptied by events — perfect for faction turf wars, siege morale, or environmental instability where progress can be lost. The clock shows the current state; it doesn't determine it. The party's actions tick it up or down, and the clock's position tells everyone where they stand.",
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
        content: "A collapsing temple — the party triggers a complex trap (Collapsing Roof variant) that begins destroying the chamber round by round. Each round, sections of ceiling fall (DC 15 Dexterity save, 4d10 bludgeoning, creates difficult terrain). The exit is blocked by debris. The party must reach the control altar at the far end (Intelligence (Investigation) to understand the mechanism, Dexterity with thieves' tools to disable it) while dodging collapse zones and rescuing pinned NPCs. The trap has initiative +5 and acts on its turn — the destruction is a second combatant.",
        source_url: "ruleset/08_Gamemastering/Traps.md",
        confidence: "HIGH",
        tag: "ruleset",
        hat_scope: "game_master",
      },
      {
        content: "A plague ship drifts into harbor — the crew is dead or dying of an unknown disease (Cackle Fever variant). The harbormaster quarantines the docks and offers a reward for anyone willing to board, identify the disease, and retrieve the ship's manifest (which names the last port of call — the source of the outbreak). The party must navigate a closed environment full of infected corpses, survive exposure checks, and decide whether to burn the ship (stopping the spread but destroying evidence) or investigate further (risking the city). Time pressure: the quarantine won't hold forever, and someone on the city council wants the ship burned before questions are asked.",
        source_url: "ruleset/08_Gamemastering/Diseases.md",
        confidence: "HIGH",
        tag: "ruleset",
        hat_scope: "game_master",
      },
      {
        content: "A noble's heir is poisoned at their own betrothal feast — the party are guests and potential suspects. The poison (Midnight Tears, ingested) won't take effect until midnight — the party has hours to identify the poisoner among the wedding guests before the heir dies. Investigation means social maneuvering, not combat: questioning nobles without causing offense, searching kitchens without being caught, analyzing the poison's properties (Intelligence (Arcana) or herbalism kit), and identifying who had access to the heir's cup. The true culprit may be a rival house using a proxy, a spurned lover, or the heir themselves (arranging their own 'poisoning' to frame an enemy).",
        source_url: "ruleset/08_Gamemastering/Poisons.md",
        confidence: "HIGH",
        tag: "ruleset",
        hat_scope: "game_master",
      },
      {
        content: "A wizard's tower has slipped into the Ethereal Plane — it's visible as a ghostly silhouette at midnight, but solid only during the new moon. The party must enter during a three-night window, navigate a dungeon where the walls shift between Material and Ethereal (rooms exist in different states depending on the phase), retrieve the wizard's planar anchor before the moon waxes, and escape before the tower becomes permanently ethereal with them inside. Enemies include phase spiders, ethereal filchers, and the wizard's abandoned experiments now running unsupervised.",
        source_url: "ruleset/08_Gamemastering/Planes.md",
        confidence: "HIGH",
        tag: "ruleset",
        hat_scope: "game_master",
      },
      {
        content: "Two temples to rival war gods (Ares and Athena) are escalating from theological dispute to armed conflict. Each temple hires adventurers to sabotage the other's rituals, steal relics, and gather intelligence. The party is approached by both sides — whichever they refuse becomes an enemy. The temples' conflict is destabilizing the city: street brawls between faithful, merchants refusing to sell to 'heretics,' the city guard caught between religious authority and civil order. The party can pick a side, play both against each other, or try to broker peace — each choice reshapes the city's faction map and makes enemies of powerful institutions.",
        source_url: "ruleset/08_Gamemastering/Pantheons.md",
        confidence: "HIGH",
        tag: "ruleset",
        hat_scope: "game_master",
      },
      {
        content: "The party must cross a mountain range before winter closes the pass — 30 days of wilderness travel with limited provisions. Each week, they choose pace (Fast/Normal/Slow) based on terrain, weather, and threats. Fast pace risks ambush and exhaustion. Slow pace preserves resources but may not beat the snow. Encounters are environmental (blizzard, avalanche, river crossing) as much as hostile (yetis, rocs, territorial griffons). The party's navigation choices determine which encounters they face — a detour through the old dwarf tunnel is faster but structurally unstable; the high ridge offers visibility but exposure; the valley provides water and forage but is troll territory.",
        source_url: "ruleset/06_Gameplay/Adventuring.md",
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
      {
        content: "Faction clocks in motion — the party returns from an adventure to find the city changed. While they were gone, three faction clocks advanced: the Thieves' Guild completed their 'Infiltrate the Watch' clock (the guard captain is now a guild agent), the Merchant League filled their 'Monopolize the Grain Trade' clock (food prices have tripled), and the Temple of Arawn is one tick from completing their 'Raise the Death Knight' clock. The party's downtime activities must now address crises. Each faction clock the party interferes with creates a new enemy; each clock they ignore advances toward its consequence. The world moves whether the party is watching or not.",
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
    {
      name: "Mythic — Celtic Saga Voice",
      source: "ruleset/08_Gamemastering/Pantheons.md",
      media_title: "D&D 5e SRD (Celtic Pantheon)",
      media_type: "other",
      description: "Something wild lurks in the heart of every soul — the Celtic gods spring from brook and stream, their might heightened by the strength of the oak. Nature is sacred and alive; every tree has a face, every brook a voice. Druids and clerics serve the same powers. The landscape is the primary character — forests, rivers, standing stones, and mistletoe on oak carry divine presence. Heroes are defined by their relationship to the land they protect. Magic is natural, not arcane — it flows through living things and ancient places.",
      confidence: "HIGH",
      tag: "ruleset",
      hat_scope: "game_master",
    },
    {
      name: "Epic — Greek Tragedy Voice",
      source: "ruleset/08_Gamemastering/Pantheons.md",
      media_title: "D&D 5e SRD (Greek Pantheon)",
      media_type: "other",
      description: "The gods make themselves known with the gentle lap of waves against the shores and the crash of thunder among cloud-enshrouded peaks. Divine presence is immanent — every aspect of nature echoes with their passing. Heroes are caught between competing divine wills; the gods' rivalries play out through mortal champions. Hubris is the cardinal sin — mortals who forget their place are destroyed by the very gods who once favored them. Beauty and violence are inseparable. The story's stakes are existential: a hero's legacy outlasts their life. Fate is negotiable but never escapable.",
      confidence: "HIGH",
      tag: "ruleset",
      hat_scope: "game_master",
    },
    {
      name: "Saga — Norse Grim Valor",
      source: "ruleset/08_Gamemastering/Pantheons.md",
      media_title: "D&D 5e SRD (Norse Pantheon)",
      media_type: "other",
      description: "Where the land plummets from snowy hills into icy fjords, where the longboats draw up on the beach, where the glaciers flow forward and retreat with every fall and spring — this is a brutal clime that calls for brutal living. Survival is earned, not guaranteed. The world is divided between two divine families (Aesir and Vanir) once enemies, now allied against common foes. Heroism means choosing a death that will be remembered. Fate is known in advance — Ragnarok is coming — and the measure of a warrior is how they face the inevitable. Treasure is taken, not found. Glory is the only currency that outlives the grave.",
      confidence: "HIGH",
      tag: "ruleset",
      hat_scope: "game_master",
    },
    {
      name: "Ancient — Egyptian Cosmic Order",
      source: "ruleset/08_Gamemastering/Pantheons.md",
      media_title: "D&D 5e SRD (Egyptian Pantheon)",
      media_type: "other",
      description: "The gods are a young dynasty of an ancient divine family, heirs to the rulership of the cosmos and the maintenance of Ma'at — the fundamental order of truth, justice, and law. The universe is a hierarchy: gods above, pharaohs below, ordinary people in their rightful place. Three death gods (Anubis the judge, Set the murderer, Nephthys the mourner) embody death's three faces — order, chaos, and grief. Stories are about maintaining or restoring cosmic order. Knowledge is sacred — Thoth records everything, and written words have power. The afterlife is a known destination; how you are judged determines what you find there. Magic is ritual, not spontaneous — names, symbols, and proper procedure matter.",
      confidence: "HIGH",
      tag: "ruleset",
      hat_scope: "game_master",
    },
  ],
};
