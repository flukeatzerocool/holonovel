# DECISIONS.md — holonovel MCP Server

**Spec hash:** acf3e99d8bc0122490f3f199157ae996275503e648f0f848389cf9077a9095fc

### Holonovel Full Update — 2026-08-11

| Field | Value |
|-------|-------|
| Spec version | 2026.08.09 |
| Build fingerprint | recomputed at startup from embedded holonovel.md |
| Delta class | major |
| Changed | source, surfaces (all tools/resource/prompt surface changed) |
| Verification | typecheck 0 errors |

Gap audit — 45+ new tools added, state model expanded with all Novel-management features:

| REQ | Gap | Disposition |
|-----|-----|-------------|
| REQ-232 | Missing pause/resume context | Added dm_context, save_pause_context, get_resume_context |
| REQ-233 | Missing factions | Added factions type, create/update/remove_faction tools |
| REQ-234 | Missing secrets/knowledge | Added secrets type, set_secret, reveal_secret, check_knowledge |
| REQ-236 | Missing relationships | Added relationship type, set_relationship, get_relationships |
| REQ-241 | Missing checkpoints | Added checkpoints type, set/list/restore/delete_checkpoint |
| REQ-242 | Missing notes | Added notes type, set/remove/list_notes |
| REQ-246 | Missing story journal | Added story journal type, record/update/remove/list_stories |
| REQ-256 | Missing rename_novel | Added rename_novel tool |
| REQ-257 | Missing list_novels | Added list_novels tool |
| REQ-258 | Missing novel_info | Added novel_info tool |
| REQ-240 | Missing clone_novel | Added clone_novel tool |
| REQ-285 | Missing server notes | Added server_notes store, set/remove/list_server_notes |
| REQ-289 | Missing vows | Added vow type, set_vow, mark_milestone, resolve_vow, forsake_vow |
| REQ-235 | Missing present_choices | Added present_choices tool with respond integration |
| REQ-291 | Missing oracle | Added ask_oracle tool |
| REQ-115 | Missing toggle_action_patterns | Added toggle_action_patterns tool |
| REQ-176 | Missing remove_entity | Added remove_entity tool |
| REQ-177 | Missing remove_roster_character | Added remove_roster_character tool |
| REQ-178 | Missing list_roster_characters | Added list_roster_characters tool |
| REQ-168 | Audit resource | audit://novel resource already existed |
| REQ-184 | Anti-slop resources | guidance://player/anti-slop and GM anti-slop already existed |
| REQ-206 | Conditions | Added conditions fields to entities/NPCs, apply/remove_condition |
| REQ-025 | spec_health completeness | Added tool_count, prompt_count, resource_count, enrichment_health, audit_chain, safety_protocols |
| REQ-187 | Runtime spec hash | Replaced hardcoded SPEC_HASH with runtime computeSpecHash() |

Tool surface: ~75 tools, ~22 resources, 5 prompts. All holonovel-capable runtime REQs implemented.
Class C (LLM-dependent: novel enrichment, NPC voice directive, generation intent, genre filtering, autonomy modes) remains deferred.



| Field | Value |
|-------|-------|
| Spec version | 2026.08.09 |
| Build fingerprint | 0f9c1b6c421443a0633fd4b6784ae3de14baa1407475944db746dfb05df9b5df |
| Implementation fingerprints | source=1b1d7f45db034344a5f4ef010488efa81eb5ad630c2993d881610869ca26b023, config=7316427a378075beb83ff30d9e4ecaaf1ce7aff094d9faf8e2e83363615089c6, lockfile=698b829bb8e547fcaad0fc463b1ef49fdf6645335db970ad49a158c92ae18797, extraction=sentinel, surfaces=12d776431f36afb445c2ad7932f442d0a8d7c91767448e71374d6992b636d3c2 |
| Gauntlet (I1-I13) | I1 PASS, I2 PASS, I3 PASS, I4 PASS, I5 PASS, I6 PASS, I7 PASS, I8 PASS, I9 PASS, I10 PASS, I11 PASS, I12 PASS, I13 PASS |
| Blocking (I1-I6, I10) | All PASS |
| Verification | typecheck 0 errors, spec-delta sync |

### Holonovel Scoped Update — 2026-08-09

| Field | Value |
|-------|-------|
| Delta class | minor |
| Changed | source |
| Reused | config, lockfile, extraction, surfaces |
| Gauntlet | PASS, 13/13 (all surfaces scoped — source changes affect full tool/resource/prompt surface) |
| Verification | typecheck 0 errors, spec-delta unsync (major delta — spec holonovel.md changed) |

## 2026-08-09 — Rebuild (Gauntlet I1-I13 verified)

- Added I11 (Narrative CRUD cycle), I12 (Lore and countdown lifecycle), I13 (Scene state and guidance) to the gauntlet harness, completing the full 13-sub-workflow Inform Gauntlet per §6.6.
- Updated spec hash to current holonovel.md (`dc99736bf...`).
- Fixed `doAction` prompt response extraction to handle MCP prompt message format (`content.text` vs `text`).
- Added lazy argument evaluation (`TL` helper) to gauntlet for capturing dynamic IDs (NPC ids).
- All 13 sub-workflows PASS. Blocking sub-workflows (I1-I6, I10): all PASS. Non-blocking (I7-I9, I11-I13): all PASS.
- Surface hash: `355f234ce91886d8fb4d3cd8717044966019e546eea3e9e78189c8280f5bc93d`.

### Verification

- `npm run typecheck` — passes (0 errors).
- `npm run spec-delta -- --server inform` — in sync with spec.
- Gauntlet: 13/13 PASS, 0 blocking failures.

### Known limitations

- `convert_source` does not parse the multi-direction door form (`X is north of Y and south of Z`).
- `create_thing` does not support `locationType` control — things always default to `locationType: "room"`.
- Parser command `take` only scans room things (`locationType: "room"`), not things on supporters or in open containers.

---

## 2026-08-08 — Rebuild (Gauntlet verified)

- Build from provider documentation (`docs_md/world-model-provider.md`): kind hierarchy (thing,
  container, supporter, door, person, backdrop, region), property contracts, parser command
  catalog, and declarative assertion syntax indexed and surfaced at `world://kinds`.
- Server version: 2026.08.07. Specification version: 2026.08.08.
- Ruleset hash: "ruleset-free" (B1=none). World-model base: `holonovel` (B10).
- Build fingerprint: spec hash `55a4b9d3fcb7ed36cc4486bfe3b819ce550613952f0be8f772cc3b19889490b6`, ruleset-free, build timestamp 2026-08-08T23:00Z.

### Inform Gauntlet (I1–I13) — 2026-08-08

All 10 sub-workflows executed against live MCP server (`scripts/run_gauntlet.ts`).
Blocking sub-workflows (I1–I6, I10): all PASS. Non-blocking (I7–I9): all PASS.

| Sub-workflow | Verdict | Blocking |
|---|---|---|
| I1 — Parser command sweep | PASS | Yes |
| I2 — Room navigation cycle (5 rooms) | PASS | Yes |
| I3 — Object interaction cycle | PASS | Yes |
| I4 — CRUD round-trip | PASS | Yes |
| I5 — convert_source with fixture | PASS | Yes |
| I6 — Property state propagation | PASS | Yes |
| I7 — World-model resources | PASS | No |
| I8 — Large-map navigation (50 rooms) | PASS | No |
| I9 — Empty world model | PASS | No |
| I10 — Hybrid adventure load | PASS | Yes |

Surface hash: 0f9d1b3f (tools: 17, resources: 4, prompts: 4).

### Verification

- `npm run typecheck` — passes (0 errors).
- `npm run spec-delta -- --server inform` — in sync with spec.
- Convergence manifest: not yet computed (Phase 2 — REQ-245 — deferred to publish).

### Known limitations

- `convert_source` does not parse the multi-direction door form (`X is north of Y and south of Z`).
  Use separate exit declarations and explicit door things instead.
- `create_thing` does not support `locationType` control — things always default to
  `locationType: "room"`. Container/supporter containment must be set up via
  `convert_source` fixture assertions.
- Parser command `take` only scans room things (`locationType: "room"`), not things on
  supporters or in open containers. The drop side-effect handler in index.ts uses exact
  name matching, not the parser's fuzzy resolution.

---

## 2026-08-07 — Initial implementation

- Created ruleset-free Inform MCP server in `inform/` directory alongside
  the dnd5e server and `docs_md/world-model-provider.md`.
- Implements REQ-218 (ruleset-free build), REQ-219 (ruleset-free entity creation),
  REQ-195–202 (world-model tier, parser commands, CRUD, properties, kinds,
  convert_source, resources), REQ-222 (base parser vocabulary).
- Ruleset hash: "ruleset-free" (REQ-218). No canonical lookups registered
  (waived under REQ-013).
- Entity model: ruleset-free — name + personality fields only, no stats,
  no HP, no equipment (REQ-219).
- Combat model: all participants auto-advance with [AUTO] marker (REQ-219).
- Help categories: builder-assigned with world-model category for parser
  commands and world-model CRUD tools.
- Resources: all REQ-022 URIs registered with hat filtering on world-model
  resources. World-model-specific resources (room://, thing://, world://map,
  world://kinds) implemented per REQ-202.
- Prompts: intro (world-model-only notice), hat_briefing (player/GM guidance
  with triggered lore), session_zero, novel_setup.
