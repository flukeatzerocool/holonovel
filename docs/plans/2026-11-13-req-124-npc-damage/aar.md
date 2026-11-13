# AAR — REQ-124 NPC damage resolution

Increment: `docs/plans/2026-11-13-req-124-npc-damage/`
Plan: `plan.md` (sha256 `06f4fd13…`, cold-reviewed) · Tasks: `tasks.md`
Terminal token: **LOOP PAUSED**

## What shipped

- `manage_combat (action: damage)`: required `target_id`/`attacker_id`, pure
  `dice` notation and/or non-negative `amount`, optional `weapon` and free-text
  `damage_type`. The result reports the weapon, dice, modifier, total, and
  `HP before → after` (REQ-003). Every present numeric health key (`hp`,
  `current_hp`, `hit_points`) loses the same total and clamps at 0; the lowest
  key at or below 0 applies the model's optional `incapacitation_condition` or
  the base `incapacitated` condition (REQ-124a).
- Validation runs before `novelSnapshot()`, so unknown targets, a missing health
  stat, no operand, a negative `amount`, a zero total, and an inline dice
  modifier return `[INVALID_INPUT]`/`[NOT_FOUND]` and leave no undo frame.
- The mutation is audited as `roll_weapon_damage` (significant roll, REQ-174),
  undoable, checkpoint-restorable, and visible to the audit-derived combat turn
  report and recap with no formatter change (REQ-040a, REQ-041, REQ-043b,
  REQ-124b).
- Spec: REQ-124a names the surface; REQ-124b's acceptance criterion uses the
  real invocation; Appendix F T131/T161 name the action and the ruleset-backed
  fixture. `holonovel/DECISIONS.md` records the decisions and a dated
  re-baseline (37 tools, 245 canonical actions, 299 total declarations).
- Tests: T131 and T161 in `holonovel/scripts/test-backfill.ts`, both passing.
- Registers: F-P3B2-15 and F-P3B1-9 `Resolved`; REQ-124 leaves the
  intended-gap whitelist and the coverage register reports bucket C; ROADMAP
  retires the §5.6 clock/combat-report and REQ-124 sections.
- Regenerated: `tool-definitions.json`, `tool-surface-baseline.json`,
  contract fingerprints, `req-coverage.md`, starter Novel, README markers, and
  the CalVer surfaces (version unchanged at 2026.11.13).

## Evidence

| Gate | Result |
|---|---|
| `npm --prefix holonovel run test:backfill` | 117 passed, 0 failed (baseline 115; +T131/T161) |
| `npm --prefix holonovel run test:all` | 56 passed, 0 failed (164.1 s) |
| `npm run check:fast` (un-piped) | 41 passed, 0 failed; trailing `check:fast: PASS` |
| `npm run check` | PASS |
| `npm run build-order` | complete; fingerprints and version surfaces synced |
| `npm run check-tool-surface` | PASS — 299 actions, ~29,417 tokens |
| `npm run tool-definitions-lint` | PASS — 37 tools, 0 violations |
| `npm run check-tool-definitions-sync` | in sync (37 tools) |
| `npm run surface-budget` | PASS — standard 25,819/26,476; small 1,180/2,942 |
| `npm run surface-replay` | precision 0.978 (floor 0.90); recorded artifact unchanged |
| `npm run check-registers` | PASS |
| `npm run check-roadmap` | OK (9 sections) |
| `npm run check-markers` | OK |
| `npm run action-conflicts -- --check` | all candidates baselined |
| `npm --prefix holonovel run typecheck` | exit 0 |

## Deviations and amendments

1. **Recap status pinned on the entity fallback, not the NPC.** The recap's
   structured `entities` payload covers player entities only, so the status
   surface is asserted on the ruleset-free fallen entity while the NPC branch
   asserts the ruleset condition (`downed`) and the absence of the base
   condition. Contract intent (both surfaces pinned) is preserved.
2. **Checkpoint restore is a decision flow.** The harness asserts `[NEED_INPUT]`
   and confirms with `respond_decision {decision: "restore_checkpoint:<label>"}`,
   matching every existing checkpoint test.
3. **Dice roller binding.** `rollDice` is a module export, not a
   `RulesetManager` method; the handler imports and calls it directly.
4. **Holosuite anchors repointed.** Thirteen `path:line#symbol` anchors in
   `holonovel/scripts/lib/holosuite-*.ts` shifted with the `index.ts` edits and
   were repointed to the current definition/case lines (the manual practice the
   *Holosuite anchor repoint automation* roadmap item would automate).
5. **Intended-gap whitelist shrinks.** `scripts/validate.ts` dropped REQ-124
   from `INTENDED_GAP_REQS` and `INTENDED_GAP_CITED_DISPOSITIONS`; without that,
   the register kept bucket E despite T131.
6. **DECISIONS live header updated.** The recorded tool budget now says 245
   canonical actions and the surface budgets carry the measured tokens; the
   dated 2026-10-19 baseline bullet is left byte-identical and named superseded.

## Findings

No new P0/P1. Two recorded conditions were verified during execution:

- C-1 — T131 creates `t131-free` with `manage_novel (action: create)` for the
  divergent-key and fallback cases. Verified in the test body.
- C-2 — T131 reads `stats.hp` from the `npcs://` GM payload. Verified.

No open action items; the remaining roadmap sections are the already-scheduled
work.

LOOP PAUSED — gates green, no open P0/P1 beyond scheduled roadmap, zero new
action items.
