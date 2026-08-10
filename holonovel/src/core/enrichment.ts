// Enrichment Manifest — Tier 1 vendor + ruleset-native enrichment
// REQ-080: additive only, never modifies mechanics
// REQ-225: Tier 1 enrichment — vendor content processed at build time
// REQ-227: Tier 1 (ruleset-native + vendor, never removed by revert_enrichment)

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
      content: "NPC voice design framework — define pitch, speed, tone, accent, and quirks for each named NPC. Use descriptive voice tags ('raspy baritone', 'clipped military cadence') rather than acting instructions. Voice descriptions should suggest character history: a hoarse whisper implies decades of secrets, a booming laugh implies untested confidence.",
      source_url: "narrative_world_model/narrative/dmcp/README.md",
      confidence: "HIGH",
      tag: "vendor",
      hat_scope: "game_master",
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
      hat_scope: "game_master",
      category: "worldbuilding",
    },
    {
      content: "Faction relationship network — for each faction, record allies, rivals, neutral parties, and a hidden agenda. When a faction takes action, ripple effects propagate through the relationship graph.",
      source_url: "narrative_world_model/narrative/dmcp/README.md",
      confidence: "HIGH",
      tag: "vendor",
      hat_scope: "game_master",
      category: "faction_network",
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
  ],
  supplementary_guidance: [
    {
      content: "Separate mechanics from fiction at the table. Track dice rolls, modifiers, and system resolution on one axis; track narrative outcomes, character reactions, and scene evolution on another. Both coexist without blurring — the Lonelog notation model (action → roll → outcome → oracle).",
      source_url: "narrative_world_model/narrative/lonelog/lonelog.md",
      confidence: "HIGH",
      tag: "vendor",
      hat_scope: "game_master",
      category: "session_notation",
    },
    {
      content: "Before ending a session, capture pause context: current scene description, immediate situation, scene atmosphere, pending player action, short-term GM plans, long-term GM plans, active threads with urgency, NPC attitude snapshots, and player apparent goals. This context enables seamless resumption.",
      source_url: "narrative_world_model/narrative/dmcp/README.md",
      confidence: "HIGH",
      tag: "vendor",
      hat_scope: "game_master",
      category: "session_management",
    },
    {
      content: "Use clocks to track progressive tension — for dangers approaching (alert level, pursuit proximity), races against time (escape vs capture), linked multi-phase obstacles (defense then vulnerability), faction projects ticking forward during downtime, and tug-of-war situations where events can fill or empty the clock.",
      source_url: "narrative_world_model/narrative/bitd/progress-clocks.md",
      confidence: "HIGH",
      tag: "vendor",
      hat_scope: "game_master",
      category: "clock_design",
    },
  ],
  adventure_advice: {
    templates: [
      {
        content: "Open scenes in media res — place characters at a decision point that tests their values, personality, or background. The first scene should ask a question the player answers through action.",
        source_url: "narrative_world_model/narrative/if-craft-corpus/README.md",
        confidence: "HIGH",
        tag: "vendor",
        hat_scope: "game_master",
      },
      {
        content: "Design obstacles, not solutions. A progress clock tracks the obstacle ('Interior Patrols', 'The Tower') — never the method ('Sneak Past the Guards'). This preserves player agency over how they overcome each challenge.",
        source_url: "narrative_world_model/narrative/bitd/progress-clocks.md",
        confidence: "HIGH",
        tag: "vendor",
        hat_scope: "game_master",
      },
    ],
    scenario_starters: [
      {
        content: "A faction clock reaches its final segment — the world changes independently of the players. What ripple effects reach their location? Who benefits? Who is harmed? How does the status quo shift?",
        source_url: "narrative_world_model/narrative/bitd/progress-clocks.md",
        confidence: "HIGH",
        tag: "vendor",
        hat_scope: "game_master",
      },
      {
        content: "Two racing clocks — the party's objective versus an environmental or antagonist clock. Both advance with consequences. If the party's clock fills first, they succeed at a cost. If the antagonist clock fills first, the situation escalates but the party has a new angle.",
        source_url: "narrative_world_model/narrative/bitd/progress-clocks.md",
        confidence: "HIGH",
        tag: "vendor",
        hat_scope: "game_master",
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
      hat_scope: "game_master",
    },
    {
      name: "Fiction-First — Blades in the Dark",
      source: "narrative_world_model/narrative/bitd/progress-clocks.md",
      media_title: "Blades in the Dark (John Harper)",
      media_type: "game",
      description: "Clocks reflect the fictional situation — they show speed, they don't determine it. Start from what makes sense in the story, then choose the mechanic. Obstacles are named for what they are in the world, not how the players intend to overcome them. The fiction drives the mechanics, not the reverse.",
      confidence: "HIGH",
      tag: "vendor",
      hat_scope: "game_master",
    },
  ],
};
