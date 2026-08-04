# AGENTS.md — D&D 5e Holonovel MCP Server

AI maintainer orientation for the D&D 5e Holonovel MCP server implementation.

## Layer Map

```
src/dice.ts             PRNG (LCG 1664525/1013904223), rollD20, rollDice,
                        abilityModifier, proficiencyBonus
        ↓
src/data.ts             Structured ruleset data: ABILITY_SCORES, SKILLS,
                        CONDITIONS, RACES, CLASSES, plus lookup functions
                        (lookupWeapon, lookupArmor, lookupSpell,
                        lookupMonster, lookupMagicItem, lookupEquipment,
                        searchRules, buildSearchIndex). Imports frozen
                        JSON from src/generated/.
        ↓
src/state.ts            StateManager: roster, games (Map<id, Game>),
                        snapshots (per-game undo stacks), audit log,
                        persona (player|game_master), workflows.
                        Persists to .holonovel-state/.
        ↓
src/index.ts            McpServer: registers all 23 tools, 6 prompts,
                        5 resources. Entry point for STDIO transport.
```

## Key Conventions

### Output Prefixes (REQ-001)

Every tool response is prefixed:

- `[OK]` — successful operation
- `[ERROR]` — error with standardized taxonomy
- `[NEED_INPUT]` — workflow awaiting user decision

### Error Taxonomy (REQ-002)

All errors use one of four codes:

| Code             | When                                               |
|------------------|----------------------------------------------------|
| `FORBIDDEN`      | GM-only tool called by player persona              |
| `STATE_CONFLICT` | Action invalid for current game state              |
| `NOT_FOUND`      | Entity, resource, or ruleset entry not found       |
| `INVALID_INPUT`  | Malformed parameters, out-of-range values          |

### Where Requirements Live

| REQ Range | Purpose                | Primary File                     |
|-----------|------------------------|----------------------------------|
| REQ-001   | Output prefix          | `src/index.ts`                   |
| REQ-002   | Error taxonomy         | `src/index.ts`                   |
| REQ-014   | Frozen source data     | `src/data.ts` (imports), `scripts/build-index.ts` (extraction) |
| REQ-022   | MCP resources          | `src/index.ts`                   |
| REQ-023   | MCP prompts            | `src/index.ts`                   |
| REQ-032   | Persona gating         | `src/index.ts` (`requireGame`, `requireGM`) |
| REQ-034   | State persistence      | `src/state.ts` (`saveState`, `loadState`) |
| REQ-042   | Workflow management    | `src/index.ts` (`respond`, `create_character`) |
| REQ-043   | Combat lifecycle       | `src/index.ts` (`init_combat`, `advance_combat`, `end_combat`) |
| REQ-050   | PRNG seeding           | `src/dice.ts`                    |
| REQ-055   | Undo/snapshots         | `src/state.ts` (`snapshot`, `undo`) |
| REQ-057   | Canonical lookups      | `src/data.ts` (all `lookup*` functions) |
| REQ-061   | Source citations       | `src/index.ts` (lookup tool handlers add `source` field) |
| REQ-065   | Ruleset fingerprint    | `package.json` (`holonovel.rulesetFingerprint`) |

## Build Commands

```bash
npm run build-index    # Extract structured data from ruleset/ → src/generated/
npm run build          # Full pipeline: build-index + tsc
npm run start          # Run compiled server (node dist/index.js)
npm run dev            # Run with tsx (no compile step)
npm run typecheck      # tsc --noEmit
```

## State Directory

`.holonovel-state/` — created on first run. Contains:

- `roster.json` — persistent character library (baselines)
- `game-{id}.json` — one file per active game session (entities, combat, conditions)
- `audit.json` — append-only mutation log

State survives process restarts. The server loads existing state on startup
and saves on every mutation. Snapshots are in-memory during a session.

## Ruleset Directory

`ruleset/` — frozen SRD v5.1 Markdown source (1021 files, 10 directories):

```
races/          classes/        equipment/      spells/
monsters/       magic-items/    using-ability-scores/
adventuring/    combat/         gameplay/
```

Do not modify files in `ruleset/`. If the ruleset needs updating, re-clone
from `oldmanumby/dnd.srd.5.1` and re-run `npm run build-index`.

## Adding a New Tool

1. Add the handler function + `registerTool` call in `src/index.ts`.
2. Add the tool name to the `ALL_TOOLS` array.
3. Add the tool to the grouped lists in the `help` tool handler.
4. If the tool is persona-gated (player or GM only), add it to the
   `persona_briefing` prompt.
5. Run `npm run typecheck` and `npm run build` to verify.

## Commit Style

Follow the project CHANGELOG.md style: date-stamped heading with bulleted
entries. Each bullet describes a coherent change group. Push to origin:

```bash
git push origin main
```
