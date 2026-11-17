# AAR — Roadmap drain 7 (REQ evidence linkage chunk 6, class (c))

## What was supposed to happen

The plan (`plan.md`, stamped `3e717c5e…`) claimed: triage the 15 class-(c) rows with the burden on
the flip, reclassify the operator-held ones to `Manual` with a four-field procedure each, leave any
row with an in-repo-checkable half in class (b), and state the residue as `57 + n` with `n`
expected at 3 and a ceiling of 3.

## What happened

P1 returned **`n = 0`**: all fifteen rows are builder/verifier drills, and no in-repo-checkable
clause survived the read. The decisive evidence was systemic, not per-row — all thirteen cited REQs
sit in bucket **E** (builder/verifier-side, exempt from strict) in the coverage register — and the
three rows the design critic flagged as candidates were refuted individually: REQ-300's `resolution`
field, REQ-301's `convergence_summary`, and REQ-303's per-section skip annotations do not exist in
`holonovel/src` or `holonovel/scripts`; the ruleset Pattern Buffer skips on a whole-ruleset hash
(`holonovel/scripts/run_ruleset_pattern_buffer.ts:216`), which is a different contract from T347's
2-of-5-section scope. That reasoning is recorded in `dispositions.md` and in the new review-register
subsection, so the next reader can dispute it on the evidence rather than on the plan's authority.

Fifteen `Type` cells flipped, fifteen procedures landed in `holonovel/DECISIONS.md` under a dated
lead-in, the residue fell `72 → 57` with the class boundary gone, and the corpus and coverage
register were regenerated (the register is byte-identical, as expected).

## Verification

| # | Command | Reading |
|---|---|---|
| V1 | `npm run validate` | exit 0; `0 error(s), 362 warning(s)`; `REQ evidence linkage: 57 finding(s)` |
| V2 | `wc -l corpus.md` | `59` (2 + 57), from 74 |
| V3 | `grep -cF "\| $t \|" corpus.md` for the 15 T-IDs | `0` for all fifteen |
| V4 | `grep -c '\| Manual' spec/appendices-reference.md` | `38`, from 23 |
| V5 | four-label shape read per flipped T-ID | `4` labels for all fifteen |
| V6 | `check:fast` un-piped; `check-registers`; `check-roadmap`; item-3 bullet count | `check:fast: PASS`; registers clean; roadmap clean; `3` bullets |
| V7 | `sha256sum holonovel.md` at `3988a92`, post-P2, post-second-`assemble` | `9366d208…` → `151a176d…` → `151a176d…` (changed once, then idempotent) |
| V8 | dispositions awk; `check-loop-artifacts` | `closed 15`, `rows 15 ids 15 bad 0`; 0 errors |
| V9 | bucket read before/after `--write-register` | 13 lines each; `diff` empty |
| V10 | D8 sentence and residue line in `ROADMAP.md` | `1` each |

## Deviations

1. **V6's bullet-count command as written spans later sections** — the plan's
   `sed -n '/^## REQ evidence linkage/,/^## Non-goals/p'` includes the `index.ts` and codex-pack
   sections and reports `7`. Executed scoped to item 3 (`awk` range stopped at the next `## `),
   reading `3`. The plan's expectation was right; its command was not.
2. **V10's literal is case- and formula-sensitive** — the roadmap carries the D8 sentence with a
   capital `C` and states the residue as "57 findings remain" rather than `residue 57 + n`. Executed
   as `grep -ci` and `grep -c '57 findings remain'`, both `1`. With `n = 0` the substituted formula
   and the literal coincide; the plan's wording assumed `n > 0`.
3. **A generated artifact the plan did not list: `holonovel/src/generated/g7-attestation.ts`.**
   The first `check:fast` failed on `check-g7-attestation` (stale). The G7 attestation embeds a
   *spec hash*, so every spec edit staleness-flips it; EV8's claim ("no generated artifact carries
   an Appendix F kind") is true but too narrow — the artifact carries the hash of the whole spec.
   Regenerated with `npx tsx holonovel/scripts/generate-g7-attestation.ts`; the §5.12 table and the
   84-body / 31-parent counts were unchanged, and the second `check:fast` passed 46/46. The file is
   an expected addition to the blast radius and is committed with the increment.

Both command defects and the missing artifact are execution-time corrections, not design changes, so
the stamped plan was not amended; this AAR is the record.

## Findings and dispositions

- **The design critic's T344/T345/T347 claim is refuted** (fixed in-session): recorded in
  `dispositions.md` with the greps that settle it. No roadmap entry needed — it is this increment's
  evidence.
- **No new action items.** The class-(b) residue of 57 is already tracked by `ROADMAP.md` item 3;
  the fifteen created procedures are scheduled by the roadmap sentence "first execution is the next
  ruleset-package build" (D8).
- **Record-and-close:** the three cold-pass conditions (C-1 V8 shape, C-2 V9 empty diff, C-3
  ordering-only premise) are all verified above — C-1 at V8, C-2 at V9, C-3 by construction (the
  roadmap was edited before the register).

## Changelog entry

**Title:** Linkage chunk 6: the class (c) block reclassified to Manual, residue 72 → 57

**Summary:** All fifteen class-(c) rows moved from `Automated` to `Manual` after the triage found no in-repo-checkable clause in any of them. Every one of the thirteen cited REQs is bucket E (builder/verifier-side), and the three rows with a plausible in-repo half were refuted on evidence: the diagnostic record, `convergence_summary`, and per-section skip annotations do not exist in the server or its harnesses. Fifteen procedures were added to the Manual verification section; none has been executed yet, so the drop is a classification correction, not new evidence.

- `spec/appendices-reference.md`: fifteen `Type` cells flipped to `Manual` — `T21`, `T25`, `T36`, `T130`, `T252`, `T290`, `T292`, `T294`, `T295`, `T343`, `T344`, `T345`, `T347`, `T405`, `T430`; each row keeps its own cell padding and its Test text
- `holonovel/DECISIONS.md`: fifteen procedure entries under a dated lead-in, each naming actor, precondition, procedure, and record, with the Appendix F row left as the drill's full text
- `T344`/`T345`/`T347` were the candidates for authoring and were not flipped on judgement: REQ-300's `resolution` field, REQ-301's `convergence_summary`, and REQ-303's per-section annotations are absent from `holonovel/src` and `holonovel/scripts`, and the ruleset Pattern Buffer skips on a whole-ruleset hash (`run_ruleset_pattern_buffer.ts:216`) — a different contract from T347's 2-of-5-section scope
- REQ evidence-linkage residue 72 → 57, now all class (b); corpus and coverage register regenerated (the register is byte-identical, as the bucket derivation ignores row kind), `ROADMAP.md` item 3 restated with three bullets, and the chunk-5 subsection superseded in the review register
- Duty created, not executed: first execution of the fifteen procedures is the next ruleset-package build, recorded on the roadmap and in the AAR

LOOP PAUSED
