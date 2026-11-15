# Independent review — U4 verification workflows and CI

Reviewer: review (cold subagent, deepseek-v4.1-flash)
Plan sha256: 419ab11bfe0a429ebe481842d76260f146c9940942929d3705e8d843b378bc23
Plan: /home/fluke/Holonovel/docs/plans/2026-11-15-unscoped-u4/plan.md
Tasks: /home/fluke/Holonovel/docs/plans/2026-11-15-unscoped-u4/tasks.md
Repo: /home/fluke/Holonovel · HEAD 5aa2e64 · depth standard
Stages: 1,2,3,5 run · Stage 4 n/a (no author edits during this pass) · reads 36/40

isolation note: this reviewer never saw the authoring conversation, but the five
stages ran sequentially in one fresh child context (nesting is prohibited by
dispatch), not five separate child contexts. Stage-to-stage contamination is
possible; independence from the author is intact. Recorded as Unknown U-7.

## Verdict-relevant summary

The plan's arithmetic is sound where it is load-bearing: the 52-row budget is
internally consistent (18 §8 blocks + 1 run-gates + 21 check-*.ts + 8 test-*.ts
+ 1 run-test-suite + 1 test-harness-guard + 2 CI jobs), the phase steps sum to
the same 52 (18+22+10+2), and the §8 block count, gate count, check/test counts,
and the AAR-before-gates ordering all verify against the tree. Two measured
counts in the Evidence table are wrong and feed findings, so the plan cannot be
executed as written without producing wrong verdict text. D5's central premise
survives scrutiny; its supporting count does not. C-12's probe cannot settle
its candidate.

## Blockers

**B-1 [design] EV12/C-1's §5.12 count is wrong (82 vs 84).**
`plan.md:62` asserts "§5.12 spans `spec/02-requirements.md:3566-3813` and
carries **82** REQ bodies (all sub-lettered)". Direct count of the cited span
yields **84** `**REQ-` headers (3583, 3586, 3589, 3591, 3602 … 3804, 3807,
3809), i.e. `spec/02-requirements.md:3583-3809`. The figure is independently
corroborated at 84 by `docs/plans/2026-11-09-full-review-p8/plan.md:28` ("§5.12's
31 rows expand to 84 headers"). The parenthetical is also false: `REQ-353`
(`spec/02-requirements.md:3591`) carries no letter suffix. This is the flagship
candidate C-1 (`plan.md:134`), so the wrong number propagates into the G7
verdict row and its register entry.
Fix: correct EV12 to 84 (and drop "all sub-lettered"), or state the counting
rule that yields 82. Re-derive C-1's sentence from the corrected number.

**B-2 [design] EV10's CI step counts are wrong twice (12/13 steps; 9/10 composites).**
`plan.md:60` asserts "CI's `gates` job runs **12 steps** (`ci.yml:18-47`); **9**
are `npm run` composites the manifest does not contain
(`test:tool-definitions`, `test:security`, `test:starter-novel`, six
`test:holosuite-*` tiers, `test:package-smoke`)". The step list at
`.github/workflows/ci.yml:18,20,21,24,26,28,30,32,34,37,40,43,46` is **13**
steps, and the sentence's own enumeration contains **10** names (2+1+6+1), not
9. The Manifest confirms none of the ten is a gate
(`scripts/lib/gate-manifest.ts`, AGENTS.md generated table). `C-3`
(`plan.md:136`, "Nine CI steps …") and the CI row (`plan.md:99`, "12 steps")
inherit both numbers, so the register would record a demonstrably wrong count —
the exact failure class this review program exists to catch.
Fix: re-count and restate both numbers; prefer expressing C-3 as the
enumerated name list, which is reproducible, with the count derived from it.

## Majors

**M-1 [design] D5's scope sentence rests on an unreproducible count.**
`plan.md:361` — "eleven of its workflows are builder-facing" — has no
enumerated referent. `spec/05-verification.md:12-22` defines **nine** workflows
(G0a, G0b, G2–G8); the plan's own unit is 18 blocks (`plan.md:74-101`). Neither
9 nor 11 nor 18 is reconciled anywhere, and D5 is the decision that scopes the
whole chunk. The substance of D5 survives (see "D5 assessment"); the count does
not.
Fix: name the eleven (or say "11 of the 18 blocks", listing them), or delete
the number.

**M-2 [design] C-12's probe cannot settle C-12, and its fix pair is the wrong pair.**
`plan.md:145` probes "read the DECISIONS numbered-item structure".
`holonovel/DECISIONS.md` has no numbered-item structure (no `(5)`/`(6)`
occurrences). The numbering is defined at `spec/06-artifacts.md:16-19` — `(5)`
= waivers, `(6)` = verification workflow evidence — and `spec/06-artifacts.md:55`
(Appendix H, H10) already records the ruleset-free skip in **(6)**, matching
§8:6. So the live contradiction is `spec/03-build.md:742` (`(5)`) versus
Appendix H H10 and §9, not `§8:6` versus `03-build:742`. Step 15
(`plan.md:288-289`) names §8:6 + 03-build:742 as the atomic pair; executing it
would either "correct" the one line §9 says is right, or violate the plan's own
one-sided-fix ban, and the other side (Appendix H, or §9 = U5's surface) is not
in the blast radius. Done bar item 3 ("none is left unverified") is also at
risk, since the stated probe is dead.
Fix: repoint the probe to `spec/06-artifacts.md:16-19` and
`spec/06-artifacts.md:55`; restate C-12 as 03-build:742 vs H10/§9; extend the
blast radius (or narrow D3 to "record the contradiction, schedule the fix")
before step 15 can run.

**M-3 [design] The 52-row inventory covers 23 of the 44 gates without saying so.**
`plan.md:161-167` and `plan.md:74-101` row only `check-*.ts` + `test-*.ts` +
`run-gates.ts` + two server harnesses + two CI jobs. The Objective
(`plan.md:149-153`) asks whether "every gate that runs" propagates failure, and
the enforcement table (`plan.md:112-125`) enumerates 9 consumers, not 44 gates.
Manifest gates implemented outside `check-*`/`test-*` (`lint`, `validate`,
`validate-readme`, `surface-budget`, `surface-replay`, `tool-definitions-lint`,
`tool-citation-check`, `action-conflicts`, `check:conformance`,
`check-world-provider`, `check-adventure-index`, `check-tool-definitions-sync`,
`check-vendor-manifest`, `check-starter-freshness`, `playability`,
`test:data-dir`, `detect-dupes`) carry no row and no boundary note, although D1
(`plan.md:336-341`) records boundaries only for `holonovel/scripts/**` and
`publish.yml`. The row set does match the worklist's declared code surface
exactly (`docs/plans/2026-11-10-unscoped-surface-review/worklist.md:194-197`),
so this is a document defect, not a scope defect.
Fix: add one D1 sentence citing the worklist line, naming the non-`check-*`
manifest gates as deliberately row-free, and pointing at `check-gate-table` /
`check-script-quality` as the existing coverage.

## Nits

**N-1 [clarity] The register-heading mechanism is inverted.**
`plan.md:200` says "a row under a bare `##` heading inherits the preceding `###`
block (`scripts/lib/register-checks.ts:25-35,64-67`)". `parseFindings` derives
the section from the nearest preceding `##` heading only
(`scripts/lib/register-checks.ts:32-37`); `###` headings are ignored entirely,
and a row under a non-disposition `##` becomes `unknown` and fails the gate
(`:57-59`). The prescribed action ("one dated `### …` heading per disposition
section") is correct and matches the file (`spec/audit/review-register.md:12`,
`:14`); only the explanation is wrong. Reword to "the parser keys on the `##`
disposition heading; a row under any other `##` fails."

**N-2 [clarity] CI job anchor off by one.** `plan.md:99` anchors the `gates` job
at `.github/workflows/ci.yml:8-47`; `:8` is `jobs:` and the job begins at `:9`.

**N-3 [clarity] EV17's baseline is unverifiable from the tree.**
`plan.md:67` (0 errors / 296 warnings) and the proofread-register count (286)
cannot be reproduced read-only; T13 (`tasks.md:49-53`) re-measures before any
edit, so the number is not load-bearing. Same for EV1's "95 unpushed commits"
(`plan.md:51`) and EV7's "63 top-level `.ts`" (`plan.md:57`) — `rev-list` is
outside the review allowlist and the 63 was not counted.

## Verified (no finding)

- **52-row arithmetic** — `plan.md:74-101` sums to 52; Phase 2
  (`plan.md:243-265`) sums to 18+22+10+2 = 52; D1 agrees. No double count, no
  orphan row.
- **44 gates / 3 full-only / 41 fast** — AGENTS.md generated table; matches
  EV6 (`plan.md:56`).
- **21 `check-*.ts`, 8 `test-*.ts`, EV7's 17/1/1/2 classification** — `ls`
  count and name-by-name match against the manifest names, `.githooks`, and
  `check-workflows.ts`.
- **§8 shape** — 269 lines; the 18 block anchors in EV5 (`plan.md:55`) resolve
  exactly; four `_Check:_` at `:74`, `:83`, `:136`, `:226`; zero `npm run`
  (EV11).
- **D4 fingerprint boundary** — `spec/05-verification.md` is absent from
  `DATA_SECTIONS` (`scripts/lib/contract-fingerprint.ts:37-43`), and
  `scripts/check-fingerprint-sync.ts:3-8` is fingerprint-section scoped. A §8
  prose edit therefore needs `assemble`, not `build-order`, as claimed.
- **Done-bar command validity** — `check-registers --strict`
  (`scripts/check-registers.ts:22-24,54`), `check-roadmap` /
  `check-fingerprint-sync` / `check-guarded-rule-change` / `session:close`
  (`package.json:27,28,31,32,84`); `check-guarded-rule-change` defaults to the
  staged diff (`scripts/check-guarded-rule-change.ts:12-13`); the
  AAR-before-gates ordering is real (`scripts/lib/loop-artifacts.ts:38-44,
  72-89`; `scripts/session-close.ts:7`). The adjacent chunks ran the same
  `--strict` command against this register and recorded PASS
  (`docs/plans/2026-11-14-unscoped-u3/aar.md:119`,
  `docs/plans/2026-11-14-unscoped-u2/aar.md:67`).
- **Blast radius membership** — all nine concrete paths are tracked
  (`git ls-files`); only `docs/plans/2026-11-15-unscoped-u4/` is untracked,
  which is inherent to a new increment (evidence sidecar `:48`) and is added by
  `session:close`. No entry names an ignored path. No edited file is missing
  for the declared edits; the gap is M-2's third site, not a missing
  housekeeping file.
- **EV8/EV9 wiring** — `test:loop-artifacts` (`package.json:25`) and
  `test:holosuite-mutation` (`holonovel/package.json:129`) appear in no
  manifest entry, hook, workflow, `scripts/**`, or `run-test-suite.ts`.
- **run-gates contracts** — full mode exits 1 at the first failure and 2 on a
  spawn error (`scripts/run-gates.ts:190-215`); fast mode counts every failure
  and exits 1 (`:217-249`, `:113-124`). The enforcement table is accurate.
- **Candidates C-2, C-5, C-9, C-10, C-11 are correctly stated** at
  `spec/05-verification.md:260-262`, `:74`, `:102-105`, `:96`, `:37`/`:46-47`,
  and each probe is a read that can settle it.

## D5 assessment (explicitly requested)

D5 is **sound in substance and unsound in its number**. §8 names workflows, not
commands (`spec/05-verification.md:12-27`), and contains no `npm run`; its
workflows are builder-facing by construction. Treating the manifest as a
different vocabulary is therefore a correct reading, not an excuse: the one
repo-side gap D5 could have swallowed — CI running composites the manifest does
not hold — is retained as C-3 (`plan.md:136`), and G4's parallel-propagation
clause is mapped rather than waved through (C-9). D5 does not excuse a
demonstrable spec defect. It does, however, amend the program's own exit
evidence (`worklist.md:201-203`) inside the increment that benefits from the
amendment; that is transparent (done bar item 5, step 17) and evidence-backed
by EV11, but the record should say plainly that the clause was mis-specified at
program-design time, not that U4 chose to relax it.

## Unknowns

- U-1 EV17's 296-warning / 286-register baseline: not reproducible read-only;
  non-blocking because T13 re-measures.
- U-2 EV1's "95 unpushed commits": `rev-list` outside the allowlist.
- U-3 EV7's "63 top-level `.ts`": only the 21+8 split was counted.
- U-4 EV12's "31 base families" in `SECTION_512_REQS`
  (`holonovel/src/index.ts:375-383`): the array exists at the cited lines and
  `G7_ATTESTATION_RECORDED = true` is a literal at `:384`; the 31 was not counted.
- U-5 EV14's single `@section evidence` and the C-6 field comparison: not read.
- U-6 EV15's "zero `Gate N` outside §8": not re-grepped.
- U-7 Stage fusion: five stages in one fresh context, not five child contexts.
- U-8 The review could not write its own artifacts (read-only dispatch); the
  parent must persist this file and hash it.

## Stage record

1. Zoom-out: B-1, B-2, M-1, M-2, M-3, N-1..N-3. Internal contradictions found:
   EV10's count vs its own list; D5's "eleven" vs the nine-workflow table;
   C-12's stated pair vs §9.
2. Comprehension: faithful-with-gaps. Reader reconstructed the chunk, the row
   budget, the D1–D7 decisions, and the done bar; could not determine which
   manifest gates are deliberately row-free (M-3) or which 11 blocks D5 counts
   (M-1).
3. Critics: design → B-1, B-2, M-2, M-3; structural → M-1, ordering and
   dependency order verified sound; style → N-1, N-2.
4. Re-zoom: n/a — no author edits during this pass.
5. Readiness: NO-GO. B-1 and B-2 must be corrected before an implementer can
   write correct rows; M-2 must be corrected before done bar item 3 can be met.

independent-review FAILED.
