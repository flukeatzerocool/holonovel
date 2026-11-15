# Delta re-review — U7 plan v3

Reviewer: same cold context as `report-v2.1.md` (no authoring context)
Artifact: /home/fluke/Holonovel/plans/2026-11-15-unscoped-u7.md (603 lines, revised)
Revised sha256: 4ad9cd27900cf3f7a390428a1dfd3a31daf7412ec7e24de05057a506b3f00cb5
Prior report: plans/2026-11-15-unscoped-u7.cold/report-v2.1.md
Scope: delta only — the `## Resolutions (cold pass v2.1 → v3)` section and the
sections it names
Reads: 4/10

Persisted by the parent session (the reviewer had no write path).

Independently verified structural facts: `plans/2026-11-15-unscoped-u7.cold/`
exists and holds three files; `docs/plans/` contains no `2026-11-15-unscoped-u7/`
entry. The pre-gate state the revised plan claims is the state on disk.

## Prior findings — settlement (18/18)

| Prior | v3 evidence | Status |
|---|---|---|
| **B1** increment dir broke the baseline | `:8-11`, `:149-150`, `:334-352`, `:527`, `:529`, `:553`; gate contract re-read (`scripts/lib/loop-artifacts.ts:32-41,65-72`, `scripts/check-loop-artifacts.ts:55`); directory listing confirms no increment dir exists | **RESOLVED** |
| **B2** done bar 4 vs 6.6 | `:585` matches 6.6 (`:490-491`), V6b (`:533`), question 5 (`:138-139`) | **RESOLVED** |
| **B3** register shape invisible to the parser | `:471-483` two-level shape; bucket anchors verified; body rule in `:531` | **RESOLVED** (count semantics → **M-R2**) |
| **M1** Scheduled-roadmap REQ rule | `:479-481`, K8 `:557` | **RESOLVED** |
| **M2** 3-bullet cap | `:492-496`, K10 `:559`; both cited owners re-verified at three bullets | **RESOLVED** |
| **M3** sample stride over-run | `:229-230`, `:258` | **RESOLVED** |
| **M4** `-S` blind to body edits | `:248`, `:384-385` now `-L` | **RESOLVED** (window → **N-R1**) |
| **M5** `source_url` unverified | Phase 4 step 2 `:433-436`, R59 `:317` | **RESOLVED** (predicate path → **N-R3**) |
| **M6** code-class P0 | vocabulary `:213-216`, worklist `:485-486` | **RESOLVED** (P0-scheduled slot → **N-R4**) |
| **M7** V1–V4 repair path | 6.8 `:502-505`, K9 `:558` | **RESOLVED** |
| **M8** V6 over-claim | V6 `:532`, V6b `:533`; `check-roadmap.ts:24-25` matches | **RESOLVED** |
| **N1** R32/R33 split | `:280-281` at the real boundary | **RESOLVED** |
| **N2** EV7 file contents | `:155` "A, D–M, O–T" | **RESOLVED** |
| **N3** EV14 anchor | `:162` cites `:37-43` | **RESOLVED** |
| **N4** literal X/Y/Z | `:485-487` | **RESOLVED** |
| **N5** lint scope | `:462-464`, `:541-542` | **RESOLVED** |
| **N6** probe 4 example | `:384-385` uses `REQ-321f` | **RESOLVED** |
| **N7** rollback omitted `:32` | `:13-14`, `:516` | **RESOLVED** |

**Still-blocking: none.**

## New findings introduced by the revision

### Major R1 — Phase 0 states the opposite of the gate's behaviour and defers the
aggregate gate to the end

`:338-352` claims `check-loop-artifacts` is red from Phase 0 and `check:fast`
inherits it. Predicate: `scripts/lib/loop-artifacts.ts:75-91` makes `LOOP OPEN` an
error **only** under `options.requirePausedFor === increment.name`, and
`scripts/check-loop-artifacts.ts:33` calls `validateIncrements(ROOT)` with no
options, exiting non-zero only on errors. A stub `LOOP OPEN` therefore yields zero
findings. The refusal lives in `session:close`, not the gate. Effect: no aggregate
gate would run between Phase 0 and 6.8. Change: state the true contract and
schedule a mid-session `check:fast` after 6.3.

### Major R2 — V5b cannot be satisfied on the artifacts 6.4 and V3 prescribe

V5b compares `grep -c '^- \*\*U7-F'` against "the `DEFECT` count V11 reports", but
6.4 also records U7-F1 (a 6.5 fix, not a verdict row) in that same shape, and V3
caps `review.md` at exactly 67 rows, so the two sides differ by one on a
conformant run. Change: make it the same set comparison V11 uses, or a non-zero
test, and say where U7-F1 lives.

### Nits

- **N-R1** R9's `+6` window can miss a longer REQ paragraph; use an end anchor.
- **N-R2** The verification table now holds 13 rows; done bar 5 says "V1–V11".
- **N-R3** Phase 4 step 2 does not name the synthesis-manifest path or the
  no-row fallback.
- **N-R4** The worklist template has no slot for a P0 that is scheduled.
- **N-R5** The front matter cites `re-review-v3.md` before it existed.

## Verification commands

Shell denied in this context, so no V-row was executed. On the code as read:
V1, V3, V5, V7, V8, V9, V10, V11 have no reason to fail; V2 and V4 pass earlier
than the plan claimed (Major R1); V5b cannot pass as written (Major R2); V6 passes,
and V6b is a read rather than a gate.

## Verdict

The revision is a genuine structural repair, not a re-statement: Phase 0 ordering
with a stub AAR, the parser-shaped register bullet, the REQ-in-ROADMAP rule, the
fold-or-new-section ROADMAP move, `-L` attribution, and the split V6/V6b all match
the predicates checked in the code. All 18 prior findings settle clean. The two new
Majors are both in the repair's own machinery and neither prevents execution.

**independent-review passed.** 2026-11-15-unscoped-u7.md — delta re-review, 18/18
prior findings resolved. Blockers 0 · Majors 2 (M-R1, M-R2) · Nits 5 (N-R1…N-R5).
Reads 4/10.
