# Playtest driver protocol

You are the external driver for `playtest.ts`. Pick one persona from
`personas/` for the player and one **GM type** from `personas/gm_*.md` for the
Game Master. Play one run to its completion oracle or a turn budget.

## GM types

| File | Style |
|------|-------|
| `gm_fair.md` | Faithful control GM. |
| `gm_adversarial.md` | Maximizes threat; honest defeats. |
| `gm_benevolent.md` | Generous; the temptation to leak unearned success is the test. |
| `gm_rules_literal.md` | Cites and enforces the ruleset. |
| `gm_narrative.md` | Improvises; must persist what it invents. |
| `gm_lorekeeper.md` | Heavy, consistent world population. |

Every GM type shares one hard constraint: report only what the engine
returned; never narrate an outcome the engine did not validate.

## Authoring phase (`--from-scratch`)

When the run is initialized with `--from-scratch`, the GM and player first
**author** the campaign before playtesting. Follow `authoring.md`: create the
Novel, the party (the requested size), the world, the NPC cast, the beat arc,
the central vow, and the escape room — grounding the adventure in ruleset
search results. Authoring ends with
`playtest.ts finalize --run <id> --vow <text> --escape-room <room>`, which sets
the oracle's target from the finished module. Every turn before `finalize` is
tagged `authoring`; every turn after is `playtest`.

## Role isolation

Run the GM and the player as **separate contexts**. They exchange only
briefing and transcript state — never a shared reasoning trace. The player
context must not see the oracle formula, prior transcripts, or the module
source; the GM context must not see the composite success formula.

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

## Play notes

- **Locked doors are two-step.** `unlock <door> with <key>` clears the lock;
  passage then needs an explicit `open <door>`. A `go` before the `open`
  returns `[WARNING]` ("closed").
- **Player spatial intent.** `run_command (action: resolve)` is GM-gated; under
  the Player badge use `run_command (action: suggest)` to declare intent, and
  let the GM resolve it.
- **Argument-schema violations.** An invalid enum/type argument returns a tool
  result with `isError: true` and an `MCP error -32602: Input validation error
  …` message (a valid MCP tool error), not an `[ERROR] [CODE]` envelope. The
  harness classifies these as denials.
- **Dread beats / panic.** At a horror beat, invoke `mothership_roll_dice`
  (`1d20` vs current Stress) so the panic mechanic is exercised rather than
  narrated.
