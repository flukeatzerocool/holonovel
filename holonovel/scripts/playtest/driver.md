# Playtest driver protocol

You are the external driver for `playtest.ts`. Pick one persona from
`personas/` for the player and `personas/gm.md` for the Game Master. Play one
run to its completion oracle or a turn budget.

## Roles and badges

- **GM** — badge `game_master`. Owns the world, NPCs, scene, beats, countdowns,
  and the parser. Executes the party's declared actions via `run_command`
  (action: execute), resolves rolls, and advances the beat arc toward
  `resolution`/`denouement`.
- **Player** — badge `player`. Declares the party's intentions in narrative and
  may call only Player-callable tools (`run_command` action: suggest, dice
  resolution, lookups, sheet, signals, undo, discover, set_badge). It cannot
  call the parser directly; the GM resolves declared actions.

## Loop

1. `briefing --run <id> --agent <role>` to read current state.
2. Choose one action; call `turn --run <id> --agent <role> --tool <name>
   --args '<json>' [--intent "<what you meant>"]`.
3. Read the result prefix. On `[ERROR]`/`[WARNING]`, recover on the next turn
   (the harness flags unrecovered errors).
4. Alternate GM and player. The GM alternates `run_command` resolution with
   scene/beat/vow updates so the beat arc advances as the party progresses.
5. Stop when the party has escaped and the GM can resolve the central vow, or
   at the turn budget. Then run `oracle --run <id>`.

## Rules

- Declare `--intent` on every turn: the `wrong_tool` and `ambiguity_stall`
  findings depend on comparing intent to the tool actually chosen.
- Do not narrate outcomes before the engine validates them.
- Keep the GM's adjudication consistent with the world model; a GM that declares
  success the party did not achieve is a `gating_leak`/attribution finding, not
  a win — the oracle requires the PC to be in the escape room.
