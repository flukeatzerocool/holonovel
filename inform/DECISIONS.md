# DECISIONS.md — Inform MCP Server

**Spec hash:** f61a89ac40d8934e247f0364f34ba05369dcf6253257a042f6af015372f9a8e9

## 2026-08-08 — Rebuild (Gauntlet verified)

- Build from provider documentation (`docs_md/world-model-provider.md`): kind hierarchy (thing,
  container, supporter, door, person, backdrop, region), property contracts, parser command
  catalog, and declarative assertion syntax indexed and surfaced at `world://kinds`.
- Server version: 2026.08.07. Specification version: 2026.08.08.
- Ruleset hash: "ruleset-free" (B1=none). World-model base: `@holonovel/inform` (B10).
- Build fingerprint: spec hash `f61a89ac`, ruleset-free, build timestamp 2026-08-08T23:00Z.

### Inform Gauntlet (I1–I10) — 2026-08-08

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
