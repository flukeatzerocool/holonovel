// Enrichment Manifest — Tier 1 vendor + ruleset-native enrichment
// REQ-080: additive only, never modifies mechanics
// REQ-225: Tier 1 enrichment — vendor content processed at build time
// REQ-227: Tier 1 (ruleset-native + vendor, never removed by revert_enrichment)

export interface EnrichmentItem {
  content: string;
  source_url: string;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  tag?: string;
  badge_scope: "player" | "game_master" | "shared";
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
  badge_scope: "player" | "game_master" | "shared";
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
      content: "NPC voice design framework — define pitch, speed, tone, accent, and quirks for each named NPC. Use descriptive voice tags ('raspy baritone', 'clipped military cadence') rather than acting instructions. Voice descriptions should suggest character history: a hoarse whisper implies decades of secrets, a booming laugh implies untested confidence.",
      source_url: "narrative_world_model/narrative/dmcp/README.md",
      confidence: "HIGH",
      tag: "vendor",
      badge_scope: "game_master",
    },
  ],
  briefing_order: {
    sections: ["scene", "active_threads", "immediate_situation", "entity_states", "lore_triggered", "pending_decisions", "guidance"],
    reason: "Prioritize actionable narrative state over reference content — scene first, then thread urgency, then immediate player-facing situation, then entity states and triggered memories, then pending decisions the GM flagged, then guidance",
    source_url: "narrative_world_model/narrative/dmcp/README.md",
    confidence: "HIGH",
  },
  lore_templates: [
    {
      content: "Worldbuilding seed — a location, faction, or event that shapes the setting. Three known facts, one secret, one rumor. NPCs who know each. A clock tracking how soon it becomes relevant.",
      source_url: "narrative_world_model/narrative/if-craft-corpus/README.md",
      confidence: "HIGH",
      tag: "vendor",
      badge_scope: "game_master",
      category: "worldbuilding",
    },
    {
      content: "Faction relationship network — for each faction, record allies, rivals, neutral parties, and a hidden agenda. When a faction takes action, ripple effects propagate through the relationship graph.",
      source_url: "narrative_world_model/narrative/dmcp/README.md",
      confidence: "HIGH",
      tag: "vendor",
      badge_scope: "game_master",
      category: "faction_network",
    },
    {
      content: "Kind hierarchy design — the world model classifies everything under 'thing', subdivided into kinds: container (openable, lockable), supporter (sit/stand), door (connects rooms), device (switched on/off), vehicle (enterable, mobile), person (NPCs), backdrop (scenery), region (spatial grouping). Each kind carries mechanical contracts: a container holds inventory, a door blocks passage when closed, a device changes state, a vehicle has an interior that functions as a contained space. Choose the kind that matches the object's behavior, not just its name.",
      source_url: "narrative_world_model/world/world-model-provider.md",
      confidence: "HIGH",
      tag: "vendor",
      badge_scope: "game_master",
      category: "kind_hierarchy",
    },
    {
      content: "Device world design — devices are the simplest form of machine: always in one of two states, switched on or switched off. Use devices where binary state changes the fiction: a powered generator changes what's visible, an active alarm changes who's present, a running machine changes the environment turn by turn. The device's state is separate from its description — switching it changes the fiction without changing the object. Design puzzles where device states cascade: switching one changes what another does.",
      source_url: "narrative_world_model/world/world-model-provider.md",
      confidence: "HIGH",
      tag: "vendor",
      badge_scope: "game_master",
      category: "device_world_design",
    },
    {
      content: "Vehicles as world fragments — a vehicle is a mobile room container. Its interior is a sub-world with its own contents and exits. Boarding a vehicle changes what the player can see, touch, and interact with. Exits from a vehicle interior connect to the outside world when the vehicle is stationary. Design vehicles as story engines: a ship's crew quarters, an elevator's single-button control, a train's dining car filling with water. The vehicle is never just transport — it's a location that moves.",
      source_url: "narrative_world_model/world/world-model-provider.md",
      confidence: "HIGH",
      tag: "vendor",
      badge_scope: "game_master",
      category: "vehicle_world_design",
    },
    {
      content: "Environmental text storytelling — readable objects deliver exposition through discovery, not narration. A readable inscription on a wall, a diary entry in a drawer, a warning carved into a doorframe — each tells the player something the world's past occupants chose to record. The read_text property holds discoverable text; the description property holds immediately visible text. Use the gap: a readable object that says one thing while its description shows another creates tension (a cheerful sign on a crumbling wall, a locked diary with a bookmark at a crucial entry).",
      source_url: "narrative_world_model/world/world-model-provider.md",
      confidence: "HIGH",
      tag: "vendor",
      badge_scope: "game_master",
      category: "environmental_text",
    },
  ],
  action_patterns: [
    {
      intent: "present structured choices to the player",
      expected_categories: ["Command"],
      ruleset_section: "Guidance — DMCP player interaction",
      source_url: "narrative_world_model/narrative/dmcp/README.md",
    },
    {
      intent: "manage combat with initiative, conditions, and turn order",
      expected_categories: ["Resolution", "Command"],
      ruleset_section: "Guidance — DMCP combat management",
      source_url: "narrative_world_model/narrative/dmcp/README.md",
    },
    {
      intent: "interact with world objects using parser commands",
      expected_categories: ["Command"],
      ruleset_section: "World Model — parser command dispatch (REQ-319)",
      source_url: "narrative_world_model/world/world-model-provider.md",
    },
    {
      intent: "turn devices and machines on or off",
      expected_categories: ["Command"],
      ruleset_section: "World Model — device kind (REQ-316)",
      source_url: "narrative_world_model/world/world-model-provider.md",
    },
    {
      intent: "enter, exit, or navigate aboard a vehicle",
      expected_categories: ["Command"],
      ruleset_section: "World Model — vehicle kind (REQ-317)",
      source_url: "narrative_world_model/world/world-model-provider.md",
    },
    {
      intent: "wear, remove, eat, drink, or climb an object",
      expected_categories: ["Command"],
      ruleset_section: "World Model — extended property commands (REQ-318)",
      source_url: "narrative_world_model/world/world-model-provider.md",
    },
    {
      intent: "read text or inspect readable objects",
      expected_categories: ["Command"],
      ruleset_section: "World Model — readable property (REQ-318)",
      source_url: "narrative_world_model/world/world-model-provider.md",
    },
    {
      intent: "ask, tell, give, show, or throw something at an NPC",
      expected_categories: ["Command"],
      ruleset_section: "World Model — narrative-intent verbs (REQ-320)",
      source_url: "narrative_world_model/world/world-model-provider.md",
    },
  ],
  supplementary_guidance: [
    {
      content: "Separate mechanics from fiction at the table. Track dice rolls, modifiers, and system resolution on one axis; track narrative outcomes, character reactions, and scene evolution on another. Both coexist without blurring — the Lonelog notation model (action → roll → outcome → oracle).",
      source_url: "narrative_world_model/narrative/lonelog/lonelog.md",
      confidence: "HIGH",
      tag: "vendor",
      badge_scope: "game_master",
      category: "session_notation",
    },
    {
      content: "Before ending a session, capture pause context: current scene description, immediate situation, scene atmosphere, pending player action, short-term GM plans, long-term GM plans, active threads with urgency, NPC attitude snapshots, and player apparent goals. This context enables seamless resumption.",
      source_url: "narrative_world_model/narrative/dmcp/README.md",
      confidence: "HIGH",
      tag: "vendor",
      badge_scope: "game_master",
      category: "session_management",
    },
    {
      content: "Use clocks to track progressive tension — for dangers approaching (alert level, pursuit proximity), races against time (escape vs capture), linked multi-phase obstacles (defense then vulnerability), faction projects ticking forward during downtime, and tug-of-war situations where events can fill or empty the clock.",
      source_url: "narrative_world_model/narrative/bitd/progress-clocks.md",
      confidence: "HIGH",
      tag: "vendor",
      badge_scope: "game_master",
      category: "clock_design",
    },
    {
      content: "Parser command tier system — the world-model parser organizes commands into four tiers. Core (go, look, examine, take, drop, inventory, wait, open, close, unlock, lock) covers fundamental interaction every player needs. Standard (wear, remove, eat, drink, climb, enter, exit, switch on, switch off, sit, stand, push, pull, light, extinguish, listen, smell, touch, insert, read) extends to object properties and sensory verbs. Narrative (ask, tell, give, show, throw) covers NPC-directed social verbs that route to the GM surface. Meta (again, g, help, verbs) covers parser-level operations. Unknown commands fall through to the GM for narrative interpretation — the parser is a floor, not a ceiling.",
      source_url: "narrative_world_model/world/world-model-provider.md",
      confidence: "HIGH",
      tag: "vendor",
      badge_scope: "game_master",
      category: "parser_tiers",
    },
    {
      content: "Device interaction patterns — devices work at the fiction level, not the mechanics level. Switching a device on or off changes what the world describes, not what dice resolve. Design device puzzles around observation: a player who understands what each device controls can solve the puzzle without a skill check. Group devices by effect domain — the lighting devices, the access devices, the alarm devices — so patterns are discoverable. A device whose effect is remote (switching it changes something in another room) creates exploration incentives.",
      source_url: "narrative_world_model/world/world-model-provider.md",
      confidence: "HIGH",
      tag: "vendor",
      badge_scope: "game_master",
      category: "device_patterns",
    },
    {
      content: "Vehicle design for interactive worlds — treat a vehicle's interior as a room with dynamic exits. The exits from a vehicle change with context: boarding creates 'out' exits to the embarkation point, docking creates exits to the dock, crash-landing creates exits to the crash site. Design vehicle events as environmental changes — a flood filling a compartment, a fire spreading through a hold, a hull breach exposing a room to vacuum. Passengers act independently: NPCs aboard a vehicle may pilot, repair, guard, or panic based on their disposition and the vehicle's state.",
      source_url: "narrative_world_model/world/world-model-provider.md",
      confidence: "HIGH",
      tag: "vendor",
      badge_scope: "game_master",
      category: "vehicle_patterns",
    },
    {
      content: "Extended property design patterns — wearable creates inventory slots on a character's body, not in their pack (invisible to 'take' unless removed first). Edible and drinkable are single-use, consumed on use (the object is removed after eating/drinking) — use for potions, rations, and consumable clues. Climbable associates with adjacent directional exits (a climbable rope next to an 'up' exit becomes that exit's access method). Readable separates discoverable text from visible description — a book's description is 'a leather-bound tome', its read_text is the passage the player discovers. Transparent lets players see container contents without opening — a glass display case, a jar of specimens, a window.",
      source_url: "narrative_world_model/world/world-model-provider.md",
      confidence: "HIGH",
      tag: "vendor",
      badge_scope: "game_master",
      category: "extended_properties",
    },
  ],
  adventure_advice: {
    templates: [
      {
        content: "Open scenes in media res — place characters at a decision point that tests their values, personality, or background. The first scene should ask a question the player answers through action.",
        source_url: "narrative_world_model/narrative/if-craft-corpus/README.md",
        confidence: "HIGH",
        tag: "vendor",
        badge_scope: "game_master",
      },
      {
        content: "Design obstacles, not solutions. A progress clock tracks the obstacle ('Interior Patrols', 'The Tower') — never the method ('Sneak Past the Guards'). This preserves player agency over how they overcome each challenge.",
        source_url: "narrative_world_model/narrative/bitd/progress-clocks.md",
        confidence: "HIGH",
        tag: "vendor",
        badge_scope: "game_master",
      },
      {
        content: "Interactive object design principles — every object in a room should do or tell something. A lever that does nothing, a book that says nothing, a locked door with no key — these are dead ends that teach the player not to investigate. The world-model property system makes object behavior explicit: a readable object carries a discoverable text, a switchable object changes state, an edible object is consumable. Design rooms where at least one object responds to each parser tier (core, standard, narrative) — this rewards thorough investigation.",
        source_url: "narrative_world_model/world/world-model-provider.md",
        confidence: "HIGH",
        tag: "vendor",
        badge_scope: "game_master",
      },
      {
        content: "Compound puzzle design — combine object kinds to create multi-step interactions. A device in a locked container behind a climbable barrier that the player must read about in a readable inscription. The player learns the solution by reading, reaches the device by climbing, opens the container by unlocking, then switches the device. Each step uses a different parser tier. Design compound puzzles so the order matters — the inscription mentions the device's location, the climbable object is only accessible after unlocking, the container's key is in another room.",
        source_url: "narrative_world_model/world/world-model-provider.md",
        confidence: "HIGH",
        tag: "vendor",
        badge_scope: "game_master",
      },
    ],
    scenario_starters: [
      {
        content: "A faction clock reaches its final segment — the world changes independently of the players. What ripple effects reach their location? Who benefits? Who is harmed? How does the status quo shift?",
        source_url: "narrative_world_model/narrative/bitd/progress-clocks.md",
        confidence: "HIGH",
        tag: "vendor",
        badge_scope: "game_master",
      },
      {
        content: "Two racing clocks — the party's objective versus an environmental or antagonist clock. Both advance with consequences. If the party's clock fills first, they succeed at a cost. If the antagonist clock fills first, the situation escalates but the party has a new angle.",
        source_url: "narrative_world_model/narrative/bitd/progress-clocks.md",
        confidence: "HIGH",
        tag: "vendor",
        badge_scope: "game_master",
      },
      {
        content: "Device-based mystery — a room with three devices and no explanation of what they control. Each device changes something in a different room. The player must explore, toggle, and observe to deduce the mapping. The solution is not a correct combination — it's understanding what each device does. The puzzle teaches the player how to read the world before the real challenge begins.",
        source_url: "narrative_world_model/world/world-model-provider.md",
        confidence: "HIGH",
        tag: "vendor",
        badge_scope: "game_master",
      },
      {
        content: "Vehicle journey — a multi-room vehicle with an onboard crisis. The engine room floods, the passenger cabin loses pressure, the bridge loses navigation. Players move between interiors, each with its own challenge. Exits from the vehicle change as the crisis evolves — a damaged hatch becomes an escape route, a sealed bulkhead creates a new boundary. The vehicle is both location and antagonist.",
        source_url: "narrative_world_model/world/world-model-provider.md",
        confidence: "HIGH",
        tag: "vendor",
        badge_scope: "game_master",
      },
    ],
    table_expansions: [],
  },
  narrative_voices: [
    {
      name: "Horror — Atmospheric Dread",
      source: "narrative_world_model/narrative/if-craft-corpus/README.md",
      media_title: "IF Craft Corpus (genre-conventions cluster)",
      media_type: "other",
      description: "Build tension through what is withheld rather than revealed. Use environmental detail as emotional register — oppressive silence, wrong shadows, sounds that shouldn't be there. The horror is in the anticipation, not the reveal. Players fill gaps with their own fears.",
      confidence: "HIGH",
      tag: "vendor",
      badge_scope: "game_master",
    },
    {
      name: "Fiction-First — Blades in the Dark",
      source: "narrative_world_model/narrative/bitd/progress-clocks.md",
      media_title: "Blades in the Dark (John Harper)",
      media_type: "game",
      description: "Clocks reflect the fictional situation — they show speed, they don't determine it. Start from what makes sense in the story, then choose the mechanic. Obstacles are named for what they are in the world, not how the players intend to overcome them. The fiction drives the mechanics, not the reverse.",
      confidence: "HIGH",
      tag: "vendor",
      badge_scope: "game_master",
    },
  ],
};
