import { applyEnrichment } from "../../src/enrichment.js";
import { StateManager } from "../../src/state.js";
import type { NovelState, EnrichmentRecord } from "../../src/state.js";
import * as fs from "node:fs";

let passed = 0;
let failed = 0;

function assert(label: string, condition: boolean, detail?: string) {
  if (condition) {
    passed++;
  } else {
    failed++;
    console.error(`FAIL: ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

const DATA_DIR = ".holonovel-state-test-enrichment";
const sm = new StateManager("enrichment-seed", DATA_DIR);
const novel = sm.createNovel("Enrichment Test");

assert("applyEnrichment produces entries", novel.enrichment.length > 0, `got ${novel.enrichment.length}`);

const modules = new Set<string>();
for (const e of novel.enrichment) {
  modules.add(e.output_module);
}

assert("has voice_examples", modules.has("voice_examples"));
assert("has lore_templates", modules.has("lore_templates"));
assert("has action_patterns", modules.has("action_patterns"));
assert("has supplementary_guidance", modules.has("supplementary_guidance"));
assert("has adventure_advice", modules.has("adventure_advice"));

const countBefore = novel.enrichment.length;
applyEnrichment(novel, sm.buildFingerprint.rulesetHash);
const countAfter = novel.enrichment.length;
assert("re-application is idempotent (no duplicates)", countBefore === countAfter,
  `before=${countBefore}, after=${countAfter}`);

const voiceEntries = novel.enrichment.filter(e => e.output_module === "voice_examples");
assert("voice_examples has entries", voiceEntries.length > 0);

const playerVoice = voiceEntries.filter(e => e.persona_scope === "player");
const gmVoice = voiceEntries.filter(e => e.persona_scope === "game_master");
assert("voice_examples includes player scoped", playerVoice.length > 0);
assert("voice_examples includes GM scoped", gmVoice.length > 0);

const actionEntries = novel.enrichment.filter(e => e.output_module === "action_patterns");
assert("action_patterns has entries", actionEntries.length > 0);
const highAction = actionEntries.filter(e => e.confidence === "HIGH");
assert("action_patterns has HIGH confidence entries", highAction.length > 0);

sm.endNovel();
fs.rmSync(DATA_DIR, { recursive: true, force: true });

console.log(`enrichment tests: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
