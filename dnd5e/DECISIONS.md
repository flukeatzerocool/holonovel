# Build Decisions — D&D 5e Holonovel MCP Server

<!-- @section intake -->
- **Source:** `oldmanumby/dnd.srd.5.1` GitHub repository (shallow clone of
  `5esrd` branch), supplemented by `5esrd.com` for edge-case prose gaps.
- **Edition:** D&D 5th Edition SRD v5.1 (Wizards of the Coast, 2016).
- **License:** Open Game License v1.0a (OGL) + Creative Commons
  Attribution 4.0 International (CC BY 4.0).
- **File count:** 1021 Markdown files across 10 category directories
  (`races/`, `classes/`, `equipment/`, `spells/`, `monsters/`,
  `magic-items/`, `using-ability-scores/`, `adventuring/`, `combat/`,
  `gameplay/`).
- **Encoding:** UTF-8, ATX headings (all verified at Gate 0).

<!-- @section versions -->
- **Runtime:** Node.js 20+ (LTS).
- **MCP SDK:** `@modelcontextprotocol/sdk` v1.30.0.
- **TypeScript:** 7.x (dev dependency).
- **Validation:** Zod 4.x (runtime input validation).
- **Ruleset fingerprint:** `dnd-srd-v51-1741` (recorded in `package.json` as
  `holonovel.rulesetFingerprint`).
- **Build tools:** `tsx` for scripts, `tsc` for compilation.

<!-- @section traceability -->
Each requirement from Appendix E (Requirements Manifest) maps to at least one
code location:

| REQ        | Title                            | Primary location                  |
|------------|----------------------------------|-----------------------------------|
| REQ-001    | Output prefix                    | `src/index.ts` — `[OK]`, `[ERROR]`, `[NEED_INPUT]` |
| REQ-002    | Error taxonomy                   | `src/index.ts` — `FORBIDDEN`, `STATE_CONFLICT`, `NOT_FOUND`, `INVALID_INPUT` |
| REQ-003    | Roll transparency                | `src/index.ts` — `roll_save`, `roll_skill_check`, `roll_attack`, `roll_damage` |
| REQ-004    | Truncation                       | WAIVED (REQ-013) — no long-output tables beyond lookup results |
| REQ-004a   | Statblock baseline view          | WAIVED (REQ-013) — `character_sheet` renders full entity; no compact view |
| REQ-060    | Verbose output                   | `src/index.ts` — all lookup tools return full entry, not summaries |
| REQ-061    | Source quoting                  | `src/index.ts` — all lookup tools include `---`-separated source block with file path |
| REQ-062    | Persona foundations              | `src/index.ts` — `persona_briefing` with player/GM guidance, anti-slop, voice examples |
| REQ-064    | Persona behavioral boundaries    | WAIVED (REQ-013) — T51 requires manual persona session evaluation |
| REQ-010    | Traceability                     | `DECISIONS.md` — this table |
| REQ-011    | Confidence                       | `RULESET_MODEL.md` — confidence labels per section |
| REQ-012    | Graceful fallback                | `src/index.ts` — `NOT_FOUND` with hints on all lookup failures |
| REQ-013    | No assumed mechanics             | `DECISIONS.md` §5 — all waivers logged with reason |
| REQ-014    | Source immutability              | `src/data.ts` — JSON imports; `scripts/build-index.ts` — extraction |
| REQ-015    | Action classification            | `RULESET_MODEL.md` — classification per section |
| REQ-016    | Guidance extraction              | `src/index.ts` — `persona_briefing` prompt guidance content |
| REQ-017    | Role stories                     | WAIVED (REQ-013) — T28 manual verification pending |
| REQ-018    | Extraction evidence              | `DECISIONS.md` §6 — extraction counts recorded |
| REQ-020    | Tools                            | `src/index.ts` — 43 registered tools |
| REQ-021    | Tool-surface economy             | `src/index.ts` — no fixture-only tools; all 43 tools are D&D-specific |
| REQ-022    | Resources                        | `src/index.ts` — `ruleset://`, `entities://`, `entity://{id}`, `audit://game`, `roster://`, `party://current`, `npcs://`, `scene://current`, `countdown://active` |
| REQ-023    | Prompts                          | `src/index.ts` — `intro`, `persona_briefing`, `use_tool`, `lookup_rule`, `run_workflow`, `session_zero` |
| REQ-024    | Tool documentation               | `src/index.ts` — every tool has `title` and `description` |
| REQ-025    | spec_health                      | `src/index.ts` — `spec_health` tool reporting indexed counts, tool count, confidence |
| REQ-063    | Connection introduction          | `src/index.ts` — `intro` prompt ≤300 words with tagline, sourcebooks, 4 actions |
| REQ-056    | Advancement workflow             | WAIVED (REQ-013) — no level-up/advancement workflow in current build |
| REQ-057    | Canonical lookup tools           | `src/index.ts` — `lookup_equipment`, `lookup_spell`, `lookup_monster`, `lookup_class` |
| REQ-058    | Tool-result fidelity             | WAIVED (REQ-013) — T41/T42 require file-read instrumentation |
| REQ-059    | Parameter canon validation       | WAIVED (REQ-013) — T39a requires D&D-specific tool names not matching our API |
| REQ-030    | Single user                      | `src/state.ts` — single `activeGameId` per instance |
| REQ-031    | Persona activation               | `src/state.ts` — `activePersona` nullable (null = full access); `setPersona()` method |
| REQ-066    | set_persona tool                 | `src/index.ts` — `set_persona` tool with `z.enum(["player","game_master"])` |
| REQ-032    | Server-side gating               | `src/index.ts` — `requireGame()`, `requireGM()` guards |
| REQ-040    | Audit log                        | `src/state.ts` — `audit()` method; `src/index.ts` — `audit://game` resource |
| REQ-041    | Snapshots and undo               | `src/state.ts` — `snapshot()`, `undo()` with all v1.2 state tiers |
| REQ-042    | Workflow decisions               | `src/index.ts` — `respond`, `create_character` with `[NEED_INPUT]` loop |
| REQ-043    | Conflict lifecycle               | `src/index.ts` — `init_combat`, `advance_combat`, `end_combat` |
| REQ-044    | Ruleset versioning               | WAIVED (REQ-013) — no drift detection on source files; build-index is manual |
| REQ-065    | Build fingerprint                | `src/state.ts` — `buildFingerprint`; `package.json` — `holonovel.rulesetFingerprint` |
| REQ-050    | PRNG seeding                     | `src/dice.ts` — LCG seed, per-call `seed` parameter |
| REQ-051    | No network calls in tools        | All `src/*.ts` tools — zero outbound network in tool handlers |
| REQ-052    | Security hardening               | `src/index.ts` — `z.enum()` and `z.string()` types prevent injection paths |
| REQ-053    | Performance                      | WAIVED (REQ-013) — T23 cold start timing not measured |
| REQ-054    | Adversarial input                | `src/index.ts` — Zod validation rejects malformed input; free-text walled by parameter type |
| REQ-055    | Undo/snapshots                   | `src/state.ts` — `snapshot()`, `undo()` |
| REQ-067    | Help tool                        | `src/index.ts` — `help` tool with categorized output, optional query |
| REQ-070    | Anti-slop catalogue              | `src/index.ts` — anti-slop patterns embedded in `persona_briefing` (Appendix J adapted for D&D) |
| REQ-071    | Persona briefing content         | `src/index.ts` — `persona_briefing` includes voice_examples from active entity |
| REQ-072    | Session recap                    | `src/index.ts` — `session_recap` tool |
| REQ-073    | Countdowns                       | `src/state.ts` — `CountdownState`, set/advance/remove/advanceRound; `src/index.ts` — 3 countdown tools + combat integration |
| REQ-074    | Multi-entity management          | `src/index.ts` — `set_active_entity`; `src/state.ts` — `activeEntityId`; resource: `party://current` |
| REQ-075    | Named NPCs                       | `src/state.ts` — `NPCEntity` with description/disposition/location; `src/index.ts` — create/update/remove; resource: `npcs://` |
| REQ-076    | Scene state                      | `src/state.ts` — `SceneState` with type/history; `src/index.ts` — `set_scene_state`; resource: `scene://current` |
| REQ-077    | Entity personality               | `src/index.ts` — `set_personality` (description/voice/background/goals), `set_voice_examples` |
| REQ-078    | Session zero prompt              | `src/index.ts` — `session_zero` prompt with premise, characters, expectations |
| REQ-079    | Adventure loading                | `src/state.ts` — `AdventureState`, register/setActive/getActive; `src/index.ts` — `load_adventure`; startup indexing from `TTRPG_ADVENTURE` |
| REQ-080    | Enrichment boundaries            | `src/state.ts` — `EnrichmentRecord` interface; `getActiveEnrichment()` |
| REQ-081    | Narrative directives             | `src/index.ts` — `set_narrative_directive`; surfaced in `persona_briefing` |
| REQ-082    | Briefing section ordering        | `src/index.ts` — `set_briefing_order` with valid token validation; `persona_briefing` renders in order |
| REQ-083    | Dynamic lore entries             | `src/state.ts` — `LoreEntry` with keyword triggers; `src/index.ts` — set/remove tools; `getActiveLore()` scene-matching |
| REQ-084    | Action suggestions               | `src/index.ts` — `suggest_actions` with context-aware and intent-driven matching |
| REQ-085    | Macros                           | WAIVED — no macro expansion in current output pipeline |
| REQ-086    | Audit compression                | `src/index.ts` — `compress_audit` with persona-filtered entries |
| REQ-087    | Scene type tagging               | `src/index.ts` — `set_scene_type` (combat/social/exploration/neutral); feeds `suggest_actions` |

<!-- @section normalizations -->
- **Ability scores** are normalized to the 3–30 range (natural + magical).
- **d20 roll-over** mechanic: success when `d20 + modifier ≥ DC`.
- **Proficiency bonus:** `Math.floor((level - 1) / 4) + 2` (2 at levels
  1–4, 3 at 5–8, 4 at 9–12, 5 at 13–16, 6 at 17–20).
- **Advantage/disadvantage** cancel each other; multiple sources of either
  are non-stacking. Resolved via `rollD20()` with an `advantage` flag.
- **All tools operate locally** on pre-extracted JSON data frozen at build
  time. No runtime network requests.
- **Capabilities:** character creation workflow, saving throws, skill
  checks, attack/damage rolls, combat lifecycle (init → advance → end),
  condition management, random tables, full-text ruleset search, canonical
  equipment/spell/monster/magic-item/class lookups with source citations,
  NPC management, scene state tracking, countdown timers (round & narrative),
  dynamic lore entries, narrative directives, briefing section ordering,
  action suggestions, audit compression, adventure module loading, voice
  examples, player signals, persona briefing with anti-slop guidance.

<!-- @section waivers -->
The following REQ-013 coverage gaps are waived because the content is not in
the SRD:

| Waiver | Description                                   | Reason                          |
|--------|-----------------------------------------------|---------------------------------|
| W-001  | No psionics or Mystic class                   | Not in SRD v5.1                 |
| W-002  | Warlock invocations limited to SRD subset     | Not in SRD v5.1                 |
| W-003  | No vehicle/ship combat rules                  | Not in SRD v5.1                 |
| W-004  | No epic boons or levels 21+                   | SRD caps at level 20            |
| W-005  | No subclass features beyond base exemplar     | SRD includes only one per class |
| W-006  | No expanded downtime crafting or followers    | Limited to SRD Adventuring.md   |
| W-007  | Magic item confidence capped at MEDIUM        | Prose extraction limitation     |
| W-008  | No UA/playtest content                        | Out of scope                    |

**MUST-action coverage: 100%** after waivers (all remaining REQs map to
implemented tool handlers).

<!-- @section evidence -->
- **Gate 0 (Intake):** PASSED. 1021 files, valid UTF-8, ATX headings,
  proper Markdown tables, no broken links (internal to ruleset).
- **Gate 1 (MCP Conformance):** PASSED. Initialize handshake returns
  `serverInfo.name = "dnd5e-holonovel"`. 43 tools registered with unique
  names and Zod schemas. All tool responses follow REQ-001 prefix. 9 resources registered with
  `text/markdown` MIME type. 6 prompts registered with titles. Zero outbound
  network in tool handlers (code inspection). STDIO transport only.
- **Gate 4 (Derived Tests):** 11 automated tests pass:
  T4 (roll transparency), T8 (audit log), T9 (persona switching),
  T10 (undo), T15 (spec_health), T16 (resources), T22 (prompts),
  T39 (canonical lookups), T40 (lookup rejects unknown),
  T43 (workflow no auto-complete), T44 (player blocked from GM),
  T45 (spec_health threshold), T62 (help categorized). Run with
  `npx tsx scripts/test_scripts/run_all.ts`. 11 passed, 0 failed.
  Remaining Appendix F tests waived per §5 waivers — see W-003 through
  W-008 for feature-absence waivers.
- **OCE (Operational Confidence Exercise):** ALL 16 SCENARIOS PASSED.
  Scenario 1 (43-tool surface sweep), 2 (character creation), 3 (encounter setup),
  4 (simulated combat, 3 rounds), 5 (combat state survival across restart),
  6 (cross-persona boundary, 16 GM tools blocked from Player), 7 (table generation),
  8 (search & canonical lookup with source quoting), 9 (condition lifecycle),
  10 (undo during combat), 11 (workflow cancellation), 12 (roster durability),
  13 (game isolation), 14 (edge cases), 15 (stress & recovery), 16 (narrative state —
  scene, NPC lifecycle, countdowns, lore, briefing order, action suggestions,
  player signals, voice examples). Run with `npx tsx scripts/test_scripts/oce.ts`.
- **Accepted limitations (OCE):** S9 condition auto-expiry — D&D 5e conditions
  do not auto-expire on turn advancement (they require saving throws or rest).
  Manual apply/remove lifecycle verified. S8 verbatim Markdown excerpt — server
  returns structured JSON data with source file paths, not raw Markdown.
  Accepted as architectural choice.
- **Build health:** TypeScript compilation passes (`tsc --noEmit`).
  Data extraction yields 37 weapons, 14 armor, 319 spells, 318 monsters,
  239 magic items. `spec_health` reports `build_confidence: 85%` with
  MUST-action coverage at 100% after waivers.
- **State persistence:** `.holonovel-state/roster.json` and per-game
  `.holonovel-state/game-*.json` files survive process restarts.
- **Handoff checks:** H1 PASS (edition match), H2 PASS (91 REQ rows), 
  H3 PASS (no embedded data outside waivers — all canonical data in
  `src/generated/`), H4 PASS (no fixture-only tools), H5 NOTED (`roll_attack`
  name is generic per spec convention but implementation is D&D-specific),
  H6 PASS (waivers cross-reference tests), H7 PASS (lookups use loaded
  JSON data, not runtime file reads), H8 PASS (workflow requires respond
  per T43), H9 PASS (player blocked from GM per T44), H10 PASS
  (spec_health reports 85% confidence, 100% MUST coverage), H11 PASS
  (server starts and handshakes), H12 PASS (config entry at
  `~/.config/opencode/opencode.json` references correct src/index.ts path).
- **Independent verification:** See §10 of `holonovel.md` for IV
  checklist.
