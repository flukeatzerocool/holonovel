# LLM-driven runner protocol

The scripted matrix (`driver.md` variants) exercises the tool surface
deterministically but does not measure *persona behavior*. An LLM-driven run
uses the same harness commands, with an agent choosing each turn.

## Why not a self-invoking script

`opencode run` cannot be invoked from within an opencode session (recursion
deadlock; see `scripts/build-ruleset.ts`). The runner is therefore an **agent
protocol**: the orchestrator launches one agent context per cell (GM and
player roles isolated), and each agent drives the harness turn by turn.

## Per-cell loop

For run id `<run>`, with the server under test and a scratch `PLAYTEST_HOME`:

1. `playtest.ts init --run <run> --state-dir <state> --novel <run>
   --from-scratch --gm <gm> --persona <persona> --seed <n>`
2. **Author** (follow `authoring.md`, GM and player roles isolated). Before
   each tool call, read the briefing for the acting role:
   `playtest.ts briefing --run <run> --agent gm|player`
   then act:
   `playtest.ts turn --run <run> --agent gm|player --tool <name>
   --args '<json>' --intent '<why>'`
3. Set party presence (`manage_scene (action: presence, entity_ids: [all PCs])`).
4. `playtest.ts finalize --run <run> --vow '<vow>' --escape-room '<room>'`
5. **Play** until the oracle succeeds or a stopping rule fires; each turn is a
   `briefing` → decide → `turn` cycle, alternating player intent and GM
   resolution.
6. `playtest.ts oracle --run <run>` — record `oracle.json` and `authoring.json`.

## Roles

- **Player** — declares intent in fiction, calls `manage_session (discover)`,
  `manage_character` for its own sheet, and `run_command (action: suggest)` for
  spatial intent. On ruleset-bound Novels the Player may also issue read-only
  perception commands via `run_command (action: execute)` — `look`, `examine`,
  `inventory`, `status` (REQ-309h); navigation and mutation stay GM-only.
  Never resolves outcomes the engine owns.
- **GM** — calls the mutating/world tools, adjudicates with `run_command
  (resolve)` where a roll is required, reports only what the engine returned.

## Isolation

Run the GM and player as separate contexts; a single agent must not see the
other's private briefing. This mirrors the 2026-09-29 matrix method.

## Comparison

Pair each LLM-driven cell with its scripted counterpart (same GM/player) and
compare `oracle.json` components, defect counts, and turn counts — the scripted
run is the floor; the LLM run measures behavior beyond it.
