# Diff re-review — plan revision 1 → 2

**Artifact integrity:** `sha256sum` = `39518c94c75fda393baa76a4e40be89834110505ae0705560853225fcdeab955`,
matching the declared revised hash and differing from the previous artifact (`0fb99aa3…`).

**Protocol:** plan-review Diff Re-review, standard depth, changed lines only. Previous cold report
read first; no new-lens sweep; unchanged sections not re-read.

## 1. Prior findings — status

| # | Prior finding | Status | Evidence |
|---|---|---|---|
| B1 | D6's `(written; delta +2)` cannot match `\(written\)` | RESOLVED | Emits `-> path:to (written) [delta +2]`; `test-anchor-tooling.ts:85`, `:120` still match. |
| B2 | Offset miss falls back to `--repath` and can bind a sibling file | RESOLVED | Fallback fires only when the recorded file carries zero occurrences; pose by C16, P3, Done bar; cites `resolveAnchorInRoot`'s recorded-path exclusion. |
| M1 | Done bar claims closure of a class it half closes | RESOLVED | "Stated residual" in D1; Done bar says the coincidental-carrier case is explicitly not claimed. |
| M2 | CLI assertion count stated three incompatible ways | RESOLVED | One total: 8 unit + 36 CLI = 44 over 24 labels, consistent across blast radius, P3, V1, Done bar; verified against the live suite (6 unit + 14 CLI today). |
| M3 | Register close left under `Scheduled-roadmap`; `check-registers` report-only | RESOLVED | In-place paragraph plus a new `## Resolved — 2026-11-17 anchor repair…` section; acceptance is `check-registers:strict` (`package.json:35`). |
| M4 | `--offset` scope over unselected anchors undefined | RESOLVED | "Scope:" paragraph: the run still scans every anchor; `--offset` layers on the selected set; exit code unchanged in meaning. |
| N-D4 | "verified" overstates the offset path | RESOLVED | Guarantee restated as "the declaration is applied only where the number lands on a carrying line"; asymmetry with D3 named deliberate. |
| N-D5 | `--check --offset` cannot distinguish right from wrong by exit code | RESOLVED | Stated: both exit 1, only stderr distinguishes. |
| N-D6 | Local helper duplicates `args.ts` responsibility | RESOLVED | Value-flag skip moves into `rejectUnknown`; `scripts/lib/args.ts` added to blast radius. |
| N-D7 | EV6's "nothing else consumes the anchor format" overstated | RESOLVED | Cites `eval-predicate.ts:29-30,80-124`; discovery claim scoped to gates. |
| N-ST4 | U7 is a tautology | RESOLVED | Labelled signature-level; U2 carries the behaviour. |
| N-SY1 | `C2` named both a detector and an assertion | RESOLVED | Detector named by description; C2 is the staleness case. |
| N-SY2 | Scanner-regex citation off by two lines | RESOLVED | Cites `refresh-predicates.ts:33`. |
| N-S1.6/SY-3 | `probe.md` written by two phases | RESOLVED | Audit snippet goes to `tasks.md`; only P4 writes `probe.md`. |

## 2. Mandated re-checks

**(i) Validation matrix — reads correctly.** Requirements and matrix are mutually consistent; no
existing caller regresses (`fix-anchors` passes only `--write --repath`). Two residuals, both in
unchanged lines and therefore Deferred: a non-integer `--from-line` value is not listed, and
`--offset` with neither `--write` nor `--check` is unspecified.

**(ii) V1 labels vs total — internally consistent.** Live suite: 6 unit + 14 CLI = 20. New: 6 − 1
deleted + 3 new = 8 unit; 14 + 22 new = 36 CLI; 44 total, 24 labels (U1–U8, C1–C16). Numbers close.
One clarity residual (new Nit N-3): V1 does not say a label may group several assertions.

**(iii) D8 probe 3 vs D2 wording — does not match (unchanged text; Deferred, Major).**
Two problems: D2's first bullet ("recorded line carries the symbol → untouched") intercepts any
live anchor (all 39 are on carrying lines), so probe 3 exits 0 and never reaches the target check;
and `does not carry` was not a string D2 defined. P4/V4's "four labelled failures" could not be
satisfied as written.

## 3. New findings (changed lines only)

- **N-1 [Nit · clarity]** "optional third parameter" but the signature has four arguments.
- **N-2 [Nit · clarity]** the fallback gate says "zero occurrences of the symbol" while D1's
  precondition is zero candidate lines under `lineCarriesSymbol`; these diverge for a comment or
  longer-identifier occurrence, producing an over-refusal.
- **N-3 [Nit · clarity]** V1 does not state that a label may group several assertions.

No new hard blocker or Major is introduced by the changed lines.

## 4. Deferred (unchanged text; for build-review)

| Item | Location | Severity |
|---|---|---|
| D8 probe 3 cannot produce its stated failure; `does not carry` undefined in D2 | probe list vs D2 semantics | Major |
| "both `includes()` sites" — only one exists (`refresh-predicates.ts:140`) | D1, P2 | Nit |
| Non-integer `--from-line` unlisted | validation matrix | Nit |

## 5. Unknowns

- `spec/audit/review-register.md:3140-3141` was a new citation in the changed D7 text and was not
  re-read (budget spent). (Parent correction: the pointer is at `:3141-3142`.)
- Live-corpus claims in unchanged text rest on the plan's own scan; not re-run.
- The evidence sidecar was not read.

**Reads used:** 10 / 10.

```
independent-review passed. plan.md rev 2 — 2/2 Blockers, 4/4 Majors, 7/7 Nits resolved; the three mandated re-checks pass on (i) and (ii); (iii) fails in unchanged text and is Deferred (D8 probe 3 vs D2 semantics), not a blocker.

Plan artifact: docs/plans/2026-11-17-anchor-repair-gap/plan.md · sha256 39518c94c75fda393baa76a4e40be89834110505ae0705560853225fcdeab955
Gate depth: standard · Re-review 1/1 (cap reached)
New findings: 3 Nits · Deferred: 1 Major (probe 3), 2 Nits · Unknowns: 3
```

## 6. Parent resolution of the Deferred and new findings (revision 3)

Text-only amendment; re-stamped, not re-reviewed (standard cap reached; plan-review's
condition-only path). Every Deferred and new finding is resolved in revision 3:

1. D8 probe 3 now names the setup edit (move a live anchor off its carrying line, as probes 1–2
   do) and D2 pins the stderr text: `offset target <path>:<target> does not carry '<symbol>'
   (anchor <source>:<path>:<recorded>)`.
2. The "two `includes()` sites" claim is corrected to the single site at
   `scripts/refresh-predicates.ts:140` (D1 and P2).
3. The validation list adds a non-integer `--from-line` and the no-flag report-only default.
4. N-1: the parameter is stated as an optional additive fourth argument.
5. N-2: the fallback gate reads "zero candidate lines — no `lineCarriesSymbol` match".
6. N-3: V1 states that a label groups one or more assertions (C1 three, C2/C4/C9 two to three).
7. The register pointer citation is corrected to `:3141-3142`.
