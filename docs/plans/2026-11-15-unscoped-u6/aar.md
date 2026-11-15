# After-action report — U6: synthesis and fixtures

## What was supposed to happen

Execute `plan.md` (stamped `c7ecc566…`, standard depth, independence fresh): 66
verdict rows over §11, the fixture coverage matrix and Appendices B/C/N/W/X/Y/Z,
plus nine harness units; disposition every finding in the review register;
advance the roadmap pointer; keep the increment to prose, records, and
regenerated assembly output; commit once through `session:close`.

## What happened

All 66 rows were settled against predicates. Every harness on the fixture
surface ran and passed:

| Run | Result |
|---|---|
| `test:playability` | exit 0 — `PASS (4 Novel(s))` |
| `test:holosuite-conformance` | exit 0 — 45 passed, 0 failed |
| `test:holosuite-invariants` | exit 0 — 25 passed, 0 failed |
| `test:holosuite-novel` | exit 0 — 100 passed, 0 failed |
| `test:holosuite-adversarial` | exit 0 — 26 passed, 0 failed |
| `test:holosuite-differential` | exit 0 — 3 passed, 0 failed |
| `test:holosuite-evidence` | exit 0 — 10 passed, 0 failed |
| `test:supplementary` | exit 0 — 4 passed, 0 failed |
| `test:competitive-gaps` | exit 0 — 30 passed, 0 failed |
| `test:world-provider` | exit 0 — 7 passed, 0 failed |
| `check-fixture-emitter` | exit 0 — 6 files, package current |
| `git status --porcelain holonovel/testdata` | empty before and after |

Six findings. Three were repaired in-session (two process, one prose); three
were scheduled because each needs behaviour change in `holonovel/src`.

## Finding triage

- **U6-F1** (process, P0-class for the loop's honesty) — the U5 close advanced
  the register half of step 5 but not the ROADMAP half, leaving "U5 is next"
  after U5 shipped. Fixed; the pointer moved into U6 at Phase 0 and into U7 at
  close.
- **U6-F2** (process) — the program worklist's Prose line carried X `:970`,
  Y `:1080`, Z `:1119` against actual `:974`/`:1084`/`:1123`. Fixed.
- **U6-F6** (prose, P0) — Appendix Z.1 required `tools/list` to gain two
  supplementary tools while the recorded REQ-372d/REQ-373 waiver makes that
  permanently unreachable for the reference build. Fixed by naming the waiver
  branch beside the normative expectation.
- **U6-F3 / U6-F4 / U6-F5** (P1 each) — no synthesis fingerprint writer, no
  `[LOW]` tag rendering, and two of eight internal-synthesis rules with no cap
  enforcement. Scheduled under `ROADMAP.md` § *Synthesis-surface gaps (P1)*;
  register rows are `Scheduled-roadmap`.

No P2 or P3 finding was created: the `builder-side` rows are settlements with a
recorded reason, not defects.

## What went right

- The row budget was honest. The cold pass caught three unassigned content
  regions (74 §11 lines, the whole module catalogue, and the fixture coverage
  matrix) and one unachievable verification step; all four were fixed before the
  first edit, and the review then found real gaps rather than re-arguing scope.
- The nine-harness evidence run took minutes and answered the fixture half of
  the exit evidence with commands instead of prose. Reading
  `playability.ts:212-219` explained the `4 Novel(s)` result (three fixtures plus
  the shipped Novel) rather than leaving it as an unexplained count.
- The `builder-side` verdict class did its job: 29 rows closed with a named duty
  ("G2 handoff fixture", "build-time extraction") instead of a fabricated gate
  claim, and no fixture file had to exist for the chunk to be settled.
- The plan's warning about the G7 attestation was correct: `SPEC_HASH` covers
  the assembled spec, so the two spec edits made the generated file stale until
  step 4.6 regenerated it.

## What went wrong

- The first cold pass could not write its own artifacts and reported collapsed
  stage isolation; the parent had to persist `plan.cold/`. Conditions C-1 and
  C-2 record it.
- The build gate initially looked satisfiable with the FAILED cold report in
  hand. The stamp was fresh but the artifact ended `independent-review FAILED.`;
  only the diff re-review produced the passing token the gate requires. That
  ordering is a real trap: a fresh stamp is not the same as a passing cold pass.
- The 66-row review relied on targeted greps for the runtime half and on
  appendix-level reading for the fixture half. Two rows (R14, R21) rest on
  field propagation plus a builder duty rather than a dedicated test; they are
  marked accordingly rather than promoted to PASS claims about behaviour.

## Conditions carried from plan review

- **C-1 — stage isolation was collapsed in the first cold pass.** Recorded here:
  the five stages ran as sequential passes in one already-cold context; the
  reviewer never saw the authoring conversation, but a fully staged pass could
  have surfaced a clarity finding it missed. Mitigated by the diff re-review,
  which re-checked every prior finding against the revised text.
- **C-2 — the first cold dispatch received `holonovel/AGENTS.md` it was not
  handed.** No finding changed, but the isolation was weaker than claimed.
  Recorded as review hygiene, not a product defect.

## Verification

V1–V9 ran un-piped; see the closing comment's evidence list. Row count is 66
(`grep -cE '^[|] R[0-9]'`), and every register row carries a terminal
disposition.

## Cost

One session. Cold pass plus diff re-review (two dispatches), 11 harness runs,
two regenerations (`assemble`, G7 attestation), one commit. No code change, no
server behaviour change, no publish.

## Done bar

Met. All seven items hold: 66 rows with none `UNSET`; every `DEFECT` register
row dispositioned; `worklist.md` records the session in the U1–U5 form with the
amended exit evidence; the pointer reads U7 with the trigger intact; V1–V9 pass;
this AAR carries the verdict and the conditions; one commit via `session:close`.

Not attempted, per the bar: closing the roadmap section (U8 owns that), any
harness repair, any code change, and the fix-up re-measurement (still
date-gated — the window held 0 commits at Phase 0).

## Loop

LOOP PAUSED
