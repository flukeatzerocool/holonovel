# AAR — trust-core contract and citation repair

AAR: SUCCESS — the three contract gaps and the four phantom citations are
implemented and asserted; one genuine ordering deviation was scheduled rather
than asserted falsely.

## 1. What was supposed to happen

The approved plan (stamped artifact
`2026-11-14T20-15-21-926Z-fe3be0e9.md`, sha256 `fe3be0e9…4bffc`, standard
depth, cold pass + passed diff re-review) had one done bar with eleven items:
implement the autonomy safety ladder, the `register` signal, and the
`mechanical_prompt` pause directive; make T44/T109/T336/T350 real; extend T461
for the register; rewrite the Appendix F rows; resolve F-S1; keep the registers
consistent; green `test:all`, `check:fast`, and the register gates; one commit.

The user directed the re-scope: the contract gaps were to be implemented in this
increment, not scheduled.

## 2. What happened

Phases ran in plan order. Four execution-time deviations were recorded in
`tasks.md` (amendments A1–A4) before they were acted on:

1. **A1** — an out-of-enum `signal` value is refused by the SDK schema
   (`-32602`) before the handler, so the handler validates only the two accepted
   values and the empty-value reset.
2. **A2** — the rendered briefing order does not satisfy REQ-109d/109e; the
   ordering leg is a genuine contract gap, so T109 asserts presence, inventory,
   markers, and Player exclusion, and the deviation is scheduled as F-S3.
3. **A3** — active adventure content is a level-2 `## Adventure` anchor, not a
   `###` heading; the inventory accepts both levels.
4. **A4** — the safety ladder keys on overkill (`total > hpBefore`), which is
   defined for the ruleset-free corpus.

A fifth, unplanned baseline item surfaced: `test:all` failed on four holosuite
tiers with 16 `predicate_unresolved` findings. The anchors were checked against
`git show HEAD:holonovel/src/index.ts` and **all 16 were already stale at HEAD**,
so the red baseline predates this increment. They were repointed to their
current declarations and the four tiers went green.

### Gate outcomes

| Gate | Token | Verdict |
|------|-------|---------|
| plan-review | `plan-review passed.` | passed (v1 FAILED cold pass → resolved → diff re-review passed) |
| independent-review | `independent-review FAILED.` → re-review `independent-review passed.` | passed on re-review |
| drift-report | `NOT_RUN.` | not applicable |
| build-review | `build-review passed.` | passed |
| spec-review | `NOT_RUN.` | not applicable |
| proofread | `0 errors, 286 warnings` (all accepted) | passed |

### Evidence

| Check | Result |
|---|---|
| `npm --prefix holonovel run test:backfill` | 119 passed, 0 failed (was 118) |
| `npm --prefix holonovel run test:briefing` | 27 passed, 0 failed (was 25) |
| `npm --prefix holonovel run test:output-contracts` | 540 passed, 0 failed (was 525) |
| `npm --prefix holonovel run test:all` | 56 passed, 0 failed (748s) |
| holosuite conformance / invariants / adversarial / novel | 45 / 25 / 26 / 100 passed, 0 failed (after the anchor repoints) |
| `npm run validate -- --write-register` | 0 errors, 286 warnings; A=0, B=0, C=491, E=117 |
| `npm run check-registers` | PASS |
| `npm run check-roadmap` | PASS (7 sections) |
| `npm run check-fingerprint-sync` | in sync |
| `npm run check-tool-surface` | PASS — 299 actions, 29,817 tokens |
| `npm run surface-budget` | PASS — full 29,817; standard 25,830 |
| `npm run surface-replay` | PASS — precision 0.978, visibility 1.0 |
| `npm run check:fast` | one failure only: `check-loop-artifacts` missing this `aar.md` |

### Loop closure

Plan reviewed (`plan-review passed.` after a FAILED cold pass and a passed diff
re-review) → executed under `build-review passed.` → outcome verified by the
suite and gate evidence above. No `spec-review` or `proofread FAILED.` finding
was open.

## 3. What went right

- The probe-first phase earned its cost: it found the ordering deviation, the
  level-2 adventure anchor, the SDK-level enum refusal, and the choices
  round-trip before any assertion was written. Each would have surfaced as a
  build-time surprise otherwise.
- The default-preserving safety design held: T131 and T161 passed unchanged on
  the first run, which is the strongest available evidence that `safe` is
  byte-compatible with the previous behaviour.
- The cold pass caught two real blockers in the behavioural draft (undefined
  max-stat semantics; the missing DECISIONS budget refresh). Both would have
  produced a red gate or an undefined contract.
- The register bypass was implemented as a distinct branch, so REQ-064f's
  non-persistence is structural rather than incidental.

## 4. What went wrong

- **The pre-existing red baseline was invisible to the previous increment's
  done bar.** `test:all` reported four failing tiers at HEAD; the 16 anchors were
  stale before this session touched `index.ts`. The prior increment recorded a
  green `test:all` that does not reproduce. This is a verification-integrity
  finding: a gate claim that cannot be reproduced from the committed tree is not
  evidence.
- **Anchor drift is still manual.** Three repoint algorithms were tried before a
  correct one (exact-line matching hit generic lines such as `}`; nearest-symbol
  matching picked the wrong `share`). The ROADMAP item for anchor automation is
  therefore validated by this session, not hypothetical.
- **Two assertion iterations were burned on fixture knowledge** (NPC stat
  merges and a zeroing-vs-overkill boundary) that the probe had not covered. The
  probe covered server surfaces but not the harness's own fixtures.
- **The changelog entry was written before `changelog-before-commit` loaded** —
  the same miss recorded as SK-1 in a prior session. The entry is correct, but
  the skill did not run.

## 5. Session performance

**Outcome vs done-bar.** All eleven items hold: three contracts implemented,
four assertions added, T461 extended, Appendix F rewritten, F-S1 resolved,
F-S3 scheduled, registers and budgets consistent, `test:all` and the register
gates green. The only non-green gate at report time was the missing AAR itself.

**Scope adherence.** No work outside the plan except the pre-existing anchor
repoint, which was required to reach the plan's own gate and is committed
separately as a baseline fix.

**Verification quality.** The assertions can fail and were observed failing
during development (four distinct assertion failures were fixed). The `safe`
tier is guarded by two pre-existing tests, not by the new test alone.

**Rework.** Three anchor-repoint attempts; two T350 iterations and one T461
restart iteration. All were fixture/line-mapping errors, not design changes.

**Cost and effort.** Roughly 140 tool calls: ~35 planning and review, ~20
probes, ~45 implementation and harness iteration, ~25 gate runs, the rest reads
and scripted edits. Two long-running suite runs (172s failed, 748s green).

**User intervention.** One intervention: the user chose to include the contract
implementation in this increment rather than schedule it. No corrections to
executed work.

## 6. Findings

| # | Finding | Disposition |
|---|---|---|
| 1 | A2: briefing order deviates from REQ-109d/109e | Scheduled — review-register F-S3 + `ROADMAP.md` § *Briefing section ordering (P1)* |
| 2 | A1: enum refusals are schema-level, not handler-level | Fixed in-increment; recorded in `DECISIONS.md` and tasks amendment A1 |
| 3 | 16 holosuite anchors stale at HEAD (pre-existing red baseline) | Fixed in-increment as a separate baseline commit; ROADMAP already carries anchor automation (P2) |
| 4 | The prior increment's "test:all green" claim does not reproduce | Record-and-close: the recorded evidence was unreproducible; this increment's evidence is the committed suite result. No new action — the reproducible-gate rule already exists in `AGENTS.md` |
| 5 | The coverage resolver cannot see sub-part phantom citations (D8) | Record-and-close (P3): a heuristic gate over 381 base rows has an unmeasured false-positive rate; no demonstrated failure beyond F-S1, which is now closed |
| 6 | T350's old row invented "safe clamps HP to 1" | Fixed: the row now describes the implemented overkill ladder |
| 7 | Anchor repoint is still manual | Covered by the existing ROADMAP P2 item; this session is the fourth manual repoint its trigger names |

Project action items after triage: none new (finding 1 is scheduled on the
roadmap; 2, 3, 6 are fixed; 4 and 5 are recorded-and-closed; 7 is already
scheduled).

Skill findings: 1 SK record appended (SK-2, `changelog-before-commit` miss).
Run `skill-improvement-loop` to triage.

## 7. Auto-remediation

Not requested; no loop run.

## 8. Invocation audit

Task shape: **Planned Change** (multi-file, behavioural, spec + server).

| Expected | Loaded | Verdict |
|---|---|---|
| `programming-orchestrator` | yes | routed |
| `plan-review` | yes | routed |
| `build-review` | yes | routed |
| `after-action-report` | yes | routed |
| `changelog-before-commit` | no | miss |

Invocation: 5 expected, 4 loaded, 1 miss.

LOOP PAUSED
