# DECISIONS.md — Inform MCP Server

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
