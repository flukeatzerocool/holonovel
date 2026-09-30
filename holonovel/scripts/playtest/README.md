# Simulated-play harness (playtest)

An **informational** tool that drives a Holonovel server as a simulated
Game Master and player, records every turn, and scores whether the party
completed the adventure. It is how open-ended, goal-seeking play is exercised
beyond the scripted Holonovel Pattern Buffer (I1–I18).

## What it is not

- Not a gate. Runs are stochastic (an LLM drives the agents), so it exits 0 and
  is not wired into `check`/`check:fast`.
- Not a source of campaign content. The campaign save and the adventure module
  are **operator-supplied** and must not be committed here (third-party IP).

## Architecture

A pure MCP client: `playtest.ts` spawns the target server over stdio, performs
one tool call per invocation, appends a transcript record, and exits. State
lives on disk in a per-run scratch directory (`TTRPG_NOVEL` auto-load), so each
turn is a fresh process and cross-restart persistence is exercised for free.

An external driver (a human or an LLM agent following `driver.md` + a persona
in `personas/`) decides each turn; the harness only executes and records.

## Usage

```sh
# --server-dir is the code under test; --state-dir holds novels/ + rulesets/
npx tsx scripts/playtest.ts init \
  --run my-run --server-dir /path/to/holonovel \
  --state-dir /path/to/.holonovel-state --novel <slug> \
  --module /path/to/adventure.md --adventure <slug> \
  --vow "<central vow>" --escape-room "<room>" --persona completionist

npx tsx scripts/playtest.ts brief --run my-run --agent gm
npx tsx scripts/playtest.ts turn  --run my-run --agent gm \
  --tool run_command --args '{"action":"execute","command":"look"}'
npx tsx scripts/playtest.ts oracle --run my-run
npx tsx scripts/playtest.ts report
```

`--run` names the directory under `PLAYTEST_HOME` (default
`$TMPDIR/holonovel-playtest/runs`). `init` copies the campaign save and ruleset
package into an isolated data dir; the source state dir is never modified.

## Oracle

Composite success = the central vow is resolved **and** a terminal beat
(`resolution`/`denouement`) is recorded **and** the active PC is in the
`--escape-room` (when set) **and** at least one PC is alive **and** zero
unrecovered `[ERROR]`/`[FORBIDDEN]` turns remain. A partial score weights beat
progress, vow resolution, and error rate.

## Findings taxonomy

Record each defect with the turn sequence and a `file:line` predicate for the
server condition it rests on: `hallucinated_tool`, `wrong_tool`,
`forbidden_thrash`, `unrecovered_error`, `missing_corrective`, `dead_end`,
`loop`, `ambiguity_stall`, `state_divergence`, plus GM/interaction lanes
(`gating_leak`, `world_population_failure`, `coupling_failure`,
`unreachable_goal`).

## Related

- `driver.md` — the external-driver turn protocol.
- `personas/` — GM and player archetypes.
