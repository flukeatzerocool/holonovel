# AAR — Torre Nosferatu readiness

AAR: SUCCESS — the starter now exposes player-visible lore and a held secret,
the harness gates both, and the tutorial tells a new player to put on the
Player badge.

## 1. What was supposed to happen

**Task.** Act on the Torre Nosferatu review findings: make the shipped tutorial
exercise the player-visible lore axis and the secret-holder coupling, and close
the badge-onboarding gap.

**Plan.** `docs/plans/2026-11-16-torre-readiness/plan.md`, reviewed at light
depth (`plan-review passed.`, independence self). Success criteria: the done
bar in the plan — freshness PASS, starter 16/16, T2 100/100, playability clean,
wiki page carries the badge step, `session:close` commits with a green fast
gate.

**Explicit assumptions.** Synthesis is optional and additive, not a play
prerequisite (`spec/08-synthesis.md:11-19`). The starter harness is the right
home for the content assertion. The wiki is a separate git clone and is not part
of the main commit.

## 2. What happened

All six phases executed.

- Phase 1: two `visibility: "shared"` fields and one `known_by` holder written
  to `holonovel/content/torre-nosferatu.source.json`.
- Phase 2: artifact regenerated (315,768 bytes); the diff touches only the
  source and its generated artifact, including the opening-workflow snapshot.
- Phase 3: one new `test-starter-novel` case; harness goes 15 → 16 passed.
- Phase 4: wiki page gains the badge subsection; committed as `fd184f3`
  (1 file, 11 insertions, 1 deletion); 22 unrelated wiki modifications left
  uncommitted.
- Phase 5: freshness PASS, starter 16/16, T2 100/100, playability clean.
- Phase 6: CHANGELOG entry, this AAR, and `session:close`.

**Deviations.** The plan's playability command used
`npm --prefix holonovel exec -- tsx scripts/playability.ts`, which resolved
`scripts/` against the repo root and failed with `ERR_MODULE_NOT_FOUND`. The
command was corrected to run from `holonovel/` and the plan records the delta.
No scope change.

### Gate outcomes

| Gate | Token | Verdict |
|------|-------|---------|
| plan-review | `plan-review passed.` | passed (light, self) |
| independent-review | not run — light depth | n/a |
| build-review | `build-review passed.` | passed |
| changelog-before-commit | `changelog-before-commit: entry written.` | passed (loaded late) |
| spec-review | not applicable — no spec edit | n/a |
| proofread | not applicable — no spec prose edit | n/a |
| drift-report | not applicable | n/a |

## 3. What went right

- The change is small and the verification is load-bearing: the new assertion
  fails if either shared entry or the held secret disappears, and T2 still
  walks the whole escape route.
- The artifact regeneration was byte-clean and the diff was inspected before
  the harness ran.
- The wiki commit was scoped to one path; the 22 pre-existing modifications
  were not swept in.
- The review's synthesis correction held: no synthesis pre-seeding was needed,
  and the plan records why.

## 4. What went wrong

- **Verification command ran from the wrong directory.** The plan's
  playability command used `npm --prefix` but the script path is relative to
  `holonovel/`. The baseline run exposed it before any code change; the command
  was corrected and the delta recorded.
- **The wiki repo needed its own plan stamp.** The wiki clone is allowlisted;
  its 2026-10-25 stamp had expired, so the first commit was blocked. A second
  stamp keyed to the wiki repo and a build marker were required. This is
  recorded as `SK-19`.
- **The CHANGELOG entry was drafted before the skill loaded.** The
  `changelog-before-commit` skill was loaded afterward and the entry was
  revised to the reader standard (dropped internal test counts and the
  regeneration bullet). This repeats the pattern already recorded as
  SK-1/2/3/18; no duplicate row was added.
- **Pre-existing red, not caused.** `version-check` reports the package version
  2026.11.15 below the top CHANGELOG date 2026-11-16. It is a publish-time
  gate; `build-order`/`push-pipeline` bumps CalVer. This plan did not bump it.

## 5. Session performance

- **Outcome vs done-bar.** Met: all five criteria hold; the only pending item
  is `session:close`, which this AAR gates.
- **Scope adherence.** No out-of-plan edits. The wiki page and the generated
  artifact are the only files outside the source/test/CHANGELOG set, and both
  are in the blast-radius table.
- **Verification quality.** The starter harness assertion is falsifiable (it
  reads the hydrated Novel, not the source file), and T2 independently walks
  the world. The playability gate is content-solvability, not a pass-only
  path.
- **Rework.** One command correction, one wiki stamp, one staged-index re-add
  after the blocked commit. No file was edited more than twice.
- **Cost.** Roughly 45 tool calls, dominated by review/plan artifacts and the
  four verification runs; no long-running full `test:all` was needed.
- **User intervention.** One correction: the user rejected the synthesis
  framing and clarified the played save is disposable. Both changed the plan
  before execution.

## 6. Findings and dispositions

| Finding | Disposition |
|---|---|
| Playability command used the repo root as cwd | Fixed in-session; plan Delta; command rerun clean. |
| Wiki repo's expired stamp blocked the commit | Fixed in-session with a per-repo stamp and build marker; `SK-19` recorded. |
| CHANGELOG drafted before the skill loaded | Fixed in-session; entry revised to the reader standard; existing SK records cover the pattern. |
| `version-check` red before this session | Record-and-close: publish-time gate; `build-order` bumps CalVer. Not caused by this increment. |
| Existing seeded Novels do not receive the new content (REQ-565 tombstone) | Record-and-close: documented in the plan's User impact; the user confirmed the played save is disposable. |
| Synthesis pre-seeding rejected | Record-and-close: optional and additive; would duplicate authored voice work. |

Project action items: **zero residual.** No P0/P1/P2 item remains. The
`version-check` state is a known release-time step, not a session action.

## 7. Auto-remediation

Not run — the user asked to execute the approved plan, not to open a
remediation loop. No remediation plan was requested.

## 8. Invocation audit

| Expected | Loaded | Verdict |
|---|---|---|
| `programming-orchestrator` | yes | routed |
| `plan-review` | yes | routed |
| `build-review` | yes | routed |
| `changelog-before-commit` | yes (after the first draft) | routed, late |
| `after-action-report` | yes | routed |
| `independent-review` | no | n/a — light depth |
| `code-review` | no | n/a — no code review requested |
| `testing` | no | n/a — existing harness extended |

Invocation: 5 expected, 5 loaded, 0 misses (one late load).

Skill findings: 1 SK record appended (`SK-19`, per-repo plan stamp).

LOOP PAUSED
