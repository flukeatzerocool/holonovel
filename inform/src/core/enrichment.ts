// Enrichment Manifest — Community-sourced play advice
// REQ-080: additive only, never modifies mechanics
// Ruleset-free mode: empty manifest — enrichment requires ruleset content

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
  spec_version: "2026.08.07",
  voice_examples: [],
  briefing_order: {
    sections: ["scene", "entities", "lore_triggered", "guidance"],
    reason: "Default world-model briefing order",
    source_url: "",
    confidence: "LOW",
  },
  lore_templates: [],
  action_patterns: [],
  supplementary_guidance: [],
  adventure_advice: {
    templates: [],
    scenario_starters: [],
    table_expansions: [],
  },
};
