// Enrichment Manifest — Community-sourced play advice
// REQ-080: additive only, never modifies mechanics
// Six output modules populated during Enrich workflow (§11.1)

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
}

export const DEFAULT_ENRICHMENT: EnrichmentManifest = {
  collected_at: new Date().toISOString(),
  spec_version: "2026.08.06",
  voice_examples: [
    {
      content: "Use your character's voice, mannerisms, and speech patterns to convey their personality and perspective. Whether you're playing a stoic warrior, a charming bard, or a mischievous rogue, channeling your character's persona can help bring them to life at the table.",
      source_url: "https://dungeondwellersdigest.wordpress.com/2024/03/02/enhancing-your-roleplaying-experience-tips-for-dd-5e-players/",
      confidence: "MEDIUM",
      tag: "voice",
      hat_scope: "player",
    },
    {
      content: "Actively listen and respond in-character to actions, questions, and dialogue. Pay attention to emotions, motivations, and intentions behind words, and use your character's reactions to deepen roleplaying.",
      source_url: "https://dungeondwellersdigest.wordpress.com/2024/03/02/enhancing-your-roleplaying-experience-tips-for-dd-5e-players/",
      confidence: "MEDIUM",
      tag: "voice",
      hat_scope: "player",
    },
  ],
  briefing_order: {
    sections: ["scene", "entities", "lore_triggered", "guidance"],
    reason: "Prioritize actionable state over reference content per community advice",
    source_url: "https://dungeondwellersdigest.wordpress.com/2024/03/02/enhancing-your-roleplaying-experience-tips-for-dd-5e-players/",
    confidence: "MEDIUM",
  },
  lore_templates: [
    {
      content: "NPC has a hidden motivation. Surface: a subtle nervous habit or repeated phrase they use when lying. DC 15 Insight check reveals they're holding something back.",
      source_url: "https://dungeondwellersdigest.wordpress.com/2024/03/02/enhancing-your-roleplaying-experience-tips-for-dd-5e-players/",
      confidence: "MEDIUM",
      hat_scope: "game_master",
      category: "hidden_motives",
    },
    {
      content: "An object in the scene holds sentimental value to a character. DC 12 Investigation reveals a hidden compartment or message. The GM notes who it was from and why it matters.",
      source_url: "https://dungeondwellersdigest.wordpress.com/2024/03/02/enhancing-your-roleplaying-experience-tips-for-dd-5e-players/",
      confidence: "MEDIUM",
      hat_scope: "game_master",
      category: "sentimental_object",
    },
  ],
  action_patterns: [
    { intent: "I want to stay in character and use my persona's voice", expected_categories: ["Command"], ruleset_section: "Guidance — player roleplaying", source_url: "https://dungeondwellersdigest.wordpress.com/2024/03/02/enhancing-your-roleplaying-experience-tips-for-dd-5e-players/" },
    { intent: "I actively listen and respond to what NPCs say in-character", expected_categories: ["Command"], ruleset_section: "Guidance — player roleplaying", source_url: "https://dungeondwellersdigest.wordpress.com/2024/03/02/enhancing-your-roleplaying-experience-tips-for-dd-5e-players/" },
    { intent: "I make decisions based on my character's personality and backstory", expected_categories: ["Resolution", "Command"], ruleset_section: "Guidance — player agency", source_url: "https://dungeondwellersdigest.wordpress.com/2024/03/02/enhancing-your-roleplaying-experience-tips-for-dd-5e-players/" },
    { intent: "I collaborate with the GM on backstory integration into the narrative", expected_categories: ["Command"], ruleset_section: "Guidance — player-GM collaboration", source_url: "https://dungeondwellersdigest.wordpress.com/2024/03/02/enhancing-your-roleplaying-experience-tips-for-dd-5e-players/" },
    { intent: "I want to use props, letters, or maps to enhance immersion", expected_categories: ["Command"], ruleset_section: "Guidance — player immersion", source_url: "https://dungeondwellersdigest.wordpress.com/2024/03/02/enhancing-your-roleplaying-experience-tips-for-dd-5e-players/" },
  ],
  supplementary_guidance: [
    {
      content: "Embrace your character's personality, background, motivations, quirks, and personality traits. Channeling your character's persona helps bring them to life at the table.",
      source_url: "https://dungeondwellersdigest.wordpress.com/2024/03/02/enhancing-your-roleplaying-experience-tips-for-dd-5e-players/",
      confidence: "MEDIUM",
      hat_scope: "player",
    },
    {
      content: "Share your character's backstory, goals, and motivations with your DM. Work together to weave those elements into the overarching narrative. Be open to improvisation and creative storytelling.",
      source_url: "https://dungeondwellersdigest.wordpress.com/2024/03/02/enhancing-your-roleplaying-experience-tips-for-dd-5e-players/",
      confidence: "MEDIUM",
      hat_scope: "shared",
    },
    {
      content: "Stay in character during roleplaying scenes, but be mindful of your fellow players' comfort levels and boundaries. D&D is ultimately a collaborative storytelling experience.",
      source_url: "https://dungeondwellersdigest.wordpress.com/2024/03/02/enhancing-your-roleplaying-experience-tips-for-dd-5e-players/",
      confidence: "MEDIUM",
      hat_scope: "shared",
    },
    {
      content: "When faced with decisions, consider what your character would do based on their personality, beliefs, and goals. Embrace the consequences as part of the roleplaying experience.",
      source_url: "https://dungeondwellersdigest.wordpress.com/2024/03/02/enhancing-your-roleplaying-experience-tips-for-dd-5e-players/",
      confidence: "MEDIUM",
      hat_scope: "player",
    },
    {
      content: "Engage in dialogue and interaction with other players and NPCs. Be open to roleplaying opportunities that arise during the game.",
      source_url: "https://dungeondwellersdigest.wordpress.com/2024/03/02/enhancing-your-roleplaying-experience-tips-for-dd-5e-players/",
      confidence: "MEDIUM",
      hat_scope: "player",
    },
  ],
  adventure_advice: {
    templates: [
      {
        content: "Open with a scene that immediately engages the character's personality, background, or goals. Start in media res with a decision point that tests their values.",
        source_url: "https://dungeondwellersdigest.wordpress.com/2024/03/02/enhancing-your-roleplaying-experience-tips-for-dd-5e-players/",
        confidence: "MEDIUM",
        hat_scope: "game_master",
      },
    ],
    scenario_starters: [
      {
        content: "The party discovers an item from one character's backstory in an unexpected location. How does the character react? Who else recognizes it?",
        source_url: "https://dungeondwellersdigest.wordpress.com/2024/03/02/enhancing-your-roleplaying-experience-tips-for-dd-5e-players/",
        confidence: "MEDIUM",
        hat_scope: "game_master",
      },
    ],
    table_expansions: [],
  },
};
