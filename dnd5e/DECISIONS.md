# Build Decisions — D&D 5e Holonovel MCP Server

<!-- @section intake -->
## 1. Intake Record

- **Source:** D&D 5th Edition SRD v5.1 Markdown (in-tree `ruleset/` directory)
- **Source origin:** `oldmanumby/dnd.srd.5.1` GitHub repository (shallow clone of `5esrd` branch)
- **Edition:** D&D 5th Edition SRD v5.1 (Wizards of the Coast, 2016)
- **License:** Open Game License v1.0a (OGL) + Creative Commons Attribution 4.0 International (CC BY 4.0)
- **File count:** 1,021 Markdown files across 10 category directories
- **Encoding:** UTF-8, ATX headings
- **Build date:** 2026-08-05
- **Pre-build answers:**
  - B1: Ruleset path = `ruleset/` (in-tree)
  - B2: Ruleset = D&D 5e SRD v5.1
  - B3: Client = Opencode CLI
  - B4: Data dir = `.holonovel-state`
  - B5: Config = `~/.config/opencode/opencode.json`
  - B6: Server name = `dnd5e-holonovel`
  - B7: Connect after build = yes
  - E1: Server path = `dnd5e/`
  - E2: Source types = all (community forums, actual plays, strategy guides, genre advice, designer notes)
  - E3: Minimum confidence = MEDIUM

<!-- @section versions -->
## 2. Pinned Versions

- **Runtime:** Node.js 20+
- **MCP SDK:** `@modelcontextprotocol/sdk` v1.30.0
- **TypeScript:** 7.x (dev dependency)
- **Validation:** Zod 4.x
- **Build tools:** `tsx` for scripts, `tsc` for compilation
- **Spec version:** 2026.08.05
- **Spec hash:** a78cdbe245c27b8249315fecf81302583ee2bdebf5113264a8990b98a50e4cd9
- **Ruleset fingerprint:** sha256 first 16 chars of combined ruleset Markdown

<!-- @section traceability -->
## 3. Traceability Table

| REQ | Title | Location |
|-----|-------|----------|
| REQ-001 | Response contract | `src/index.ts` — PREFIX_OK, PREFIX_ERR, PREFIX_PARTIAL, PREFIX_WARNING |
| REQ-002 | Error taxonomy | `src/index.ts` — FORBIDDEN, NOT_FOUND, INVALID_INPUT, STATE_CONFLICT, RULE_VIOLATION, UNIMPLEMENTED |
| REQ-003 | Roll transparency | `src/index.ts` — roll_save, roll_skill_check, roll_weapon_attack, roll_weapon_damage |
| REQ-004 | Truncation | ACCEPTED LIMITATION — output:// not yet implemented; no D&D lookup exceeds default threshold |
| REQ-010 | Traceability | DECISIONS.md — this table |
| REQ-011 | Confidence | RULESET_MODEL.md — confidence labels per section |
| REQ-012 | Graceful fallback | `src/index.ts` — NOT_FOUND with valid-value enumeration; search_rules returns unmodeled sections |
| REQ-013 | No assumed mechanics | DECISIONS.md §5 — waivers logged with reason |
| REQ-014 | Source immutability | `src/state.ts` — ruleset hash computed at build, drift warning on mismatch |
| REQ-015 | Action classification | RULESET_MODEL.md — Resolution/Command/Generation |
| REQ-016 | Guidance extraction | `src/enrichment.ts` — supplementary guidance, voice examples |
| REQ-018 | Extraction evidence | RULESET_MODEL.md — confidence labels per section |
| REQ-020 | Tools | `src/index.ts` — 54 registered tools |
| REQ-021 | Tool-surface economy | `src/index.ts` — no fixture-only tools |
| REQ-022 | Resources | `src/index.ts` — 31 resources |
| REQ-023 | Prompts | `src/index.ts` — 7 prompts (intro, persona_briefing, use_tool, lookup_rule, run_workflow, session_zero, novel_setup) |
| REQ-024 | Tool documentation | `src/index.ts` — every tool has title and description |
| REQ-025 | spec_health | `src/index.ts` — reports indexed counts, tool count, novel listing, gate dispositions |
| REQ-030 | Single user | `src/state.ts` — single activeNovelId, no multiplayer |
| REQ-031 | Persona activation | `src/state.ts` — null persona = full access |
| REQ-032 | Server-side gating | `src/index.ts` — requireGM() enforces GM-only tool access |
| REQ-040 | Audit log | `src/state.ts` — state.audit() appends to novel.auditLog |
| REQ-041 | Snapshots and undo | `src/state.ts` — snapshot()/undo() with persona stacks |
| REQ-042 | Workflow decisions | `src/index.ts` — respond() with NEED_INPUT queue |
| REQ-043 | Conflict lifecycle | `src/index.ts` — init_combat, advance_combat, end_combat |
| REQ-044 | Ruleset versioning | `src/state.ts` — rulesetHash in buildFingerprint |
| REQ-050 | Determinism | `src/dice.ts` — PRNG LCG, seedable, per-call seeds |
| REQ-051 | No runtime network | `src/` — no outbound network calls |
| REQ-054 | Input safety | `src/index.ts` — zod validation on all inputs |
| REQ-055 | Durability and resume | `src/state.ts` — persistent Novel state, restore on startup |
| REQ-056 | Advancement workflow | ACCEPTED LIMITATION — level-up workflow not yet implemented beyond character creation |
| REQ-057 | Canonical lookup tools | `src/index.ts` — lookup_equipment, lookup_spell, lookup_monster, lookup_class |
| REQ-058 | Tool-result fidelity | `src/index.ts` — canonical lookups use loaded index, never fabrication |
| REQ-060 | Verbose output | `src/index.ts` — all lookup tools return full entry |
| REQ-061 | Source quoting | `src/index.ts` — source block on lookup results |
| REQ-062 | Persona foundations | `src/index.ts` — persona_briefing with guidance |
| REQ-063 | Connection introduction | `src/index.ts` — intro prompt |
| REQ-065 | Build fingerprint | `src/state.ts` — buildFingerprint with specVersion, rulesetHash, timestamps |
| REQ-066 | set_persona tool | `src/index.ts` — always callable, no gating |
| REQ-067 | Help and tool discovery | `src/index.ts` — help tool with categorized task map |
| REQ-070 | Anti-slop guidance | `src/index.ts` — guidance://{role}/anti-slop, persona_briefing |
| REQ-071 | Voice examples | `src/enrichment.ts` — 5 per entity type, surfaced in guidance |
| REQ-072 | Session recap | `src/index.ts` — session_recap tool |
| REQ-073 | Countdowns | `src/index.ts` — set_countdown, advance_countdown, remove_countdown |
| REQ-074 | Multi-entity support | `src/index.ts` — set_active_entity, entities:// |
| REQ-075 | Named-NPC state | `src/index.ts` — create_npc, update_npc, remove_npc, npc://, npcs:// |
| REQ-076 | Scene-state ledger | `src/index.ts` — set_scene_state, scene_history |
| REQ-077 | Entity personality fields | `src/index.ts` — set_personality, set_voice_examples, entity://{id}/personality |
| REQ-078 | Session zero prompt | `src/index.ts` — session_zero prompt |
| REQ-079 | Adventure modules | `src/index.ts` — load_adventure, adventure://{slug}/{anchor} |
| REQ-080 | Enrichment boundaries | `src/enrichment.ts` — additive only, never modifies mechanics |
| REQ-081 | Narrative directive | `src/index.ts` — set_narrative_directive |
| REQ-082 | Prompt section ordering | `src/index.ts` — set_briefing_order |
| REQ-083 | Dynamic lore | `src/index.ts` — set_lore_entry, toggle_lore_entry, set_lore_group, suggest_lore, export/import lorebook |
| REQ-084 | Action suggestions | `src/index.ts` — suggest_actions |
| REQ-085 | Macro system | `src/macros.ts` — {{entity.name}}, {{entity.hp}}, {{scene.current}}, etc. |
| REQ-086 | Audit compression | `src/index.ts` — compress_audit (idempotent, no mutation) |
| REQ-087 | Scene type tagging | `src/index.ts` — set_scene_type |
| REQ-088 | Novel lifecycle | `src/state.ts` — create_novel, resume_novel, end_novel |
| REQ-089 | Novel setup | `src/index.ts` — novel_setup prompt, novel://setup |
| REQ-090 | Adventure generation | `src/index.ts` — generate_adventure |
| REQ-091 | Enhanced encounter generation | `src/index.ts` — generate_encounter |
| REQ-092 | Novel persistence | `src/state.ts` — atomic save with .tmp + rename + .bak |
| REQ-093 | Novel listing | `src/index.ts` — spec_health shows novels, novel://current, novel://{slug} |
| REQ-094 | Lorebook interchange | `src/index.ts` — export_lorebook, import_lorebook |
| REQ-098 | Spec-driven update | DECISIONS.md — dated gap-disposition entry |
| REQ-099 | Confidence-floor acknowledgment | Overall 85%, >80% Standard tier threshold |
| REQ-100 | Performance benchmark | Standard tier (>500 indexed items), D&D at ~2000 items but mostly HIGH confidence structured data |
| REQ-101 | Assumption audit trail | This DECISIONS.md entry |

<!-- @section normalizations -->
## 4. Assumptions, Normalizations, and Capabilities

- **Data extraction:** All structured data (weapons, armor, spells, monsters, magic items) extracted by `scripts/build-index.ts` into `src/generated/*.json`. Extraction is deterministic and verified by Gate 0.
- **Search index:** Built at first call from ruleset Markdown files, cached in memory.
- **State persistence:** Atomic saves with `.tmp` rename and `.bak` retention per REQ-092.
- **RNG:** LCG algorithm (1664525/1013904223), seedable per session or per call.
- **Persona model:** null = full access; explicit player/game_master with server-side gating.
- **Novel lifecycle:** One active Novel per server instance. Persists to `.holonovel-state/novels/<slug>.json`.
- **Capabilities inventory:** 54 tools, 31 resources, 7 prompts, 5 lookup categories, 15 conditions, 12 classes, 9 races.

<!-- @section waivers -->
## 5. Waivers and Accepted Limitations

| REQ | Waiver | Reason | Re-activation |
|-----|--------|--------|--------------|
| REQ-004 | Truncation + output:// | No D&D lookup exceeds default 32KB threshold. output:// URI template listed in resource templates for future implementation. | When a lookup produces output >32KB |
| REQ-004a | Statblock baseline view | character_sheet renders full entity; compact view not needed for D&D's simple stat block format | When ruleset demands compact view |
| REQ-017 | Role stories | Manual verification pending. Action mapping covers expected play activities via suggest_actions and help. | Manual play session |
| REQ-056 | Advancement workflow | Level-up mechanics not yet implemented beyond character creation. D&D's advancement is table-driven and complex. | When advancement tables are fully modeled |
| REQ-064 | Persona behavioral boundaries | Server enforces tool-level gating; conversational boundaries are LLM-level enforcement. | Add behavioral contract tests |

<!-- @section evidence -->
## 6. Gate Evidence

### Gate 0 — Structural Integrity
- **Timestamp:** 2026-08-05
- **Environment:** Node.js 20+, Linux
- **Result:** PASSED
- **Findings:** 1,021 Markdown files, all UTF-8, ATX headings, well-formed. build-index extracts 37 weapons, 14 armor, 319 spells, 318 monsters, 239 magic items without errors.

### Gate 1 — MCP Conformance
- **Timestamp:** 2026-08-05
- **Environment:** Node.js 20+, Linux
- **Result:** PASSED
- **Findings:** Server registers 54 tools, 31 resources, 7 prompts. All conform to MCP spec. Initialize handshake returns correct serverInfo.

### Gate 4 — Derived Tests
- **Timestamp:** 2026-08-05
- **Result:** PASSED
- **Tests:** 8 automated test scripts, 113 assertions. All pass (exit 0).
- **Coverage:** PRNG determinism, dice mechanics, lookup functions, novel lifecycle, character creation, macro expansion, enrichment, lore management, state persistence.

### Gate 5 — Gauntlet
- **Status:** PENDING
- **Note:** 22-scenario Gauntlet requires full server runtime with AI-simulated personas. Pending manual verification.

### Spec-Driven Update Gap Disposition (REQ-098)
- **Date:** 2026-08-05
- **Spec version:** 2.0.0 → 2026.08.05
- **Gap audit:** Tool catalog (54 tools match spec), resource map (31 resources), prompt list (7 prompts), state model (Novel lifecycle, atomic persistence), persona gating (server-side), behavioral contracts (tool-level enforcement)
- **Changes applied:** specVersion → 2026.08.05, CalVer migration (date-based versioning per REQ-107), atomic persistence (REQ-092), compress_audit idempotency (REQ-086), novel listing in spec_health (REQ-093)
- **Gauntlet:** Pending re-run on changed code paths
- **Verification:** typecheck (0 errors), test suite (113 assertions, 0 failures), build-index (clean regeneration)

### Enrichment Job (REQ-080, §11)
- **Date:** 2026-08-05
- **Pre-build answers:** E1 = dnd5e/, E2 = all source types, E3 = MEDIUM
- **Source domains (3 achieved, 5+ intended with supplement):**
  - https://www.cbr.com/dnd-fun-dialogue-roleplaying/ (Sonny Giordano II, May 2024) — DM dialogue preparation, NPC embodiment, player confidence
  - https://litrpgreads.com/blog/improvising-dialogue-making-reactions-feel-natural-in-dnd-roleplay (Kiera Mensah, Nov 2024) — REACT method, character voice, emotional range, scenario response patterns
  - https://dungeondwellersdigest.wordpress.com/2024/03/02/enhancing-your-roleplaying-experience-tips-for-dd-5e-players/ (Mar 2024) — player roleplay tips, in-character decisions, collaborative storytelling
  - Existing sources retained: https://thealexandrian.net (node-based design), https://rpgbot.net (action patterns), https://reddit.com/r/DMAcademy (community wisdom)
- **Output modules:**
  - Voice examples: 5 (3 player, 2 GM) — HIGH confidence from CBR + MEDIUM from blog sources
  - Briefing order: 1 recommendation — MEDIUM confidence (derived from prep workflow advice)
  - Lore templates: 10 (environment-specific lore with DC checks and social prompts) — MEDIUM confidence
  - Action patterns: 10 (skill+attack mappings derived from REACT method scenarios) — HIGH confidence
  - Supplementary guidance: 15 items (7 player, 5 GM, 3 shared) — MEDIUM confidence
  - Adventure advice: 11 items (3 templates, 4 scenario starters, 4 table expansions) — HIGH for templates, MEDIUM for expansions
- **Search limitation:** DuckDuckGo returned empty results for TTRPG-specific queries (1,024-character query limit may truncate terms). Content extracted from page-level fetches of 3 distinct domains. Supplemented with existing enrichment content where source URLs were retained from earlier builds.
- **Verification:** typecheck (0 errors), test suite (8/8 pass, enrichment test confirms 6 modules present with entries), no regression
- **Enrichment cap compliance:** Voice (5, cap 5), Lore (10, cap 30), Actions (10, cap 10), Supplementary (15, cap 20), Adventure (11, cap 30) — all within module budgets
