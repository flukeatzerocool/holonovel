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
  --vow "<central vow>" --escape-room "<room>" --persona completionist \
  --gm gm_fair --seed 1

npx tsx scripts/playtest.ts briefing --run my-run --agent gm
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
unrecovered defect turns remain (`[ERROR]`/`[RULE_VIOLATION]`/
`[STATE_CONFLICT]`; expected refusals such as `[FORBIDDEN]` do not count). A
partial score weights beat progress, vow resolution, and error rate.

The oracle also emits a `mission` block with objective telemetry for the
mission scorecard: `tools/list` hallucinated-tool check, prefix histogram,
state-fingerprint persistence violations (end-of-turn N vs start-of-turn
N+1), unexplained room drift, lookup-anchor ratio, `[NEED_INPUT]` capture,
per-turn latency, and briefing-byte growth. `partial_score` and the beat
fraction are heuristic/ordinal, not interval metrics.

Run provenance (`--gm`, `--seed`, git SHA, ruleset/novel/module hashes, node
version) is recorded in `run.json`; the tool catalog is snapshotted to
`tools.json` at init.

## Harness behavior

- **Per-turn seed.** The server keeps restart determinism (REQ-050c), so the
  harness varies `TTRPG_SEED` per turn (`<--seed>:<turn index>`) — session
  rolls advance within a run instead of repeating the default-seed first draw.
- **Per-run lock.** A `turn` holds `runs/<id>/.lock`; a second concurrent turn
  on the same run is refused (stale locks older than 10 min are reclaimed).
- **Fixtures.** Operator-supplied modules should model the objects their prose
  makes examinable; unmodeled scenery produces honest `[NOT_FOUND]` denials
  and is a fixture gap, not a server defect.

## Findings taxonomy

Record each defect with the turn sequence and a `file:line` predicate for the
server condition it rests on: `hallucinated_tool`, `wrong_tool`,
`forbidden_thrash`, `unrecovered_error`, `missing_corrective`, `dead_end`,
`loop`, `ambiguity_stall`, `state_divergence`, plus GM/interaction lanes
(`gating_leak`, `world_population_failure`, `coupling_failure`,
`unreachable_goal`).

## Holosuite tiers

The playtest harness is the stochastic tier of the **Holosuite** evaluation
environment (`plans/2026-10-02-holosuite`). Four deterministic tiers run
alongside it and gate CI/pre-push:

- **T0 `conformance`** (`scripts/holosuite.ts --tier=conformance`) — the live
  registry does what `tool-definitions.json` says: identical tool-name set,
  titles and non-empty descriptions, all four REQ-450 annotation booleans, and a
  recognized envelope for a negative probe.
- **T1 `invariants`** (`scripts/holosuite.ts --tier=invariants`) — a bounded,
  seeded world-mutation sequence asserting read-only non-mutation, gating
  refusals, undo round-trip, envelope recognition, and fingerprint continuity
  across a server restart.
- **T3 `adversarial`** (`scripts/holosuite.ts --tier=adversarial`) — a bounded
  battery of malformed, unknown, oversized, and hostile inputs: a known tool
  with bad arguments still returns a recognized envelope, an unknown tool
  returns a well-formed protocol error, the server stays live, and read-only
  injection probes never move the state fingerprint. Scoped to classes the
  STRIDE harness (`test-security`) does not own.
- **T4 `differential`** (`scripts/holosuite.ts --tier=differential`) — two
  independently built Novels receiving the same operations in different orders,
  plus a same-sequence replay in a third process and a restart, asserting an
  order-independent world projection is identical.

All four tiers are deterministic (fixed seed, small step count) and wired into
`holonovel/package.json`, `scripts/run-test-suite.ts`, `.github/workflows/ci.yml`,
and `.githooks/pre-push`.

The playtest harness is the stochastic **Understudies** tier. It emits the same
canonical schema (`lib/eval-schema.ts`) as the deterministic tiers and sections
its findings by the nine analytic lenses §8 defines plus the separate
GM/interaction lanes (see `oracle.json` `lenses` / `gm_lanes` and the canonical
`holosuite.json` report). Each tier's events carry the REQ identifiers they
exercise, and the runner emits a per-REQ coverage aggregate.

The **method audit** (`scripts/holosuite.ts --tier=mutation`, `npm run
test:holosuite-mutation`) is report-only: it seeds a deterministic mutant set,
checks that the oracle catches each, and prints the catch rate. It is excluded
from `--tier=all` and from every gate. A persona campaign is not treated as
evidence unless its accompanying catch rate is published.

## Related

- `driver.md` — the external-driver turn protocol.
- `personas/` — six player archetypes and six GM types (`gm_fair`,
  `gm_adversarial`, `gm_benevolent`, `gm_rules_literal`, `gm_narrative`,
  `gm_lorekeeper`).
