# Cold review — 2026-11-16-roadmap-drain-5

Reviewer: review subagent (cold, no authoring context)
Plan sha256: fb6086ff15c252fe23a4ab5f9e032c2fe9d01b83f93c052b2fbe031f3fa3cb77
(verified by `sha256sum docs/plans/2026-11-16-roadmap-drain-5/plan.md`)
Standards: plan-review §1–§8 (standard depth), references/review-prompt.md,
references/spec-project-checks.md. Evidence sidecar: plan.evidence.json (git 6155f9c).

## Findings

1. [Blocker|design] The red-read evidence D4 promises does not exist: `tasks.md:25-28`
   contains `| T541 | — | — |` and `| T542 | — | — |` while `plan.md:59` (D4) requires
   "a red read recorded in `tasks.md`" and `tasks.md:17` asserts "both tests fail before
   task 6/7's fix (red read quoted below)" — nothing is quoted below.
2. [Blocker|design] The red read is unobservable in the stated order: `tasks.md:17`
   declares task 7 dependent on task 6, so the `--root` fix lands before the test that is
   supposed to fail without it; no step names the substitute (write the test first, or run
   against a stashed tree).
3. [Blocker|design] The done bar `N ≤ 80` (`plan.md:64-67`) is not guaranteed by D2's
   unconditional closure (`plan.md:51-54`) because P1's own class rule (`plan.md:47-50`)
   closes a row as (a) only when an emitting assertion covers the behaviour. T682's
   Appendix F row has two clauses (`spec/appendices-reference.md:2177`: sibling-action
   wrong-selection *and* "a baseline that reports visibility only fails"); only the first
   has a site (`scripts/surface-replay.ts:264-285`). If P1 must class it (b), N=81 and D2
   forbids re-scoring it. T493 carries the same structural risk
   (`spec/appendices-reference.md:1524` asserts both blocked and proceeds;
   `scripts/version-check.ts:132-138` covers only the currency predicate).
4. [Blocker|design] Wrong command for a named artifact: `tasks.md:19` regenerates
   "`corpus.md` and `spec/audit/req-coverage.md` (`npm run validate -- --write-register`)",
   but `--write-register` writes only the coverage register; `corpus.md` is written by
   `--write-linkage-corpus <path>` — as `plan.md:130` (V2) itself demonstrates. The
   committed corpus listed in the blast radius (`plan.md:79`) can therefore go stale while
   V2 still passes on a fresh `/tmp` write.
5. [Blocker|design] The blast-radius table (`plan.md:69-80`) omits two files the plan says
   it changes: `docs/plans/2026-11-16-roadmap-drain-5/tasks.md` (edited per `plan.md:59`)
   and `docs/plans/2026-11-16-roadmap-drain-5/aar.md` (named in P5, `plan.md:123`). §2 makes
   the table the set build-review compares against.
6. [Major|design] The per-task checks for both restructures are presence greps:
   `tasks.md:14-15` use `grep -c 'T493'` / `grep -c 'T682'` ≥ 1. Those already-absent
   strings would be satisfied by a *top-level* `console.error` or the existing comment at
   `scripts/surface-replay.ts:264`, neither of which `scripts/lib/req-checks.ts:864-867`
   admits. Only aggregate N (V1) tests admission, and aggregate N can be met by a different
   closure set. Name a per-row probe (`--write-linkage-corpus` → `grep '^| T682 |'` = 0).
7. [Major|design] `plan.md:14-16` states "33 rows have their REQ id cited in code, 52 have
   none" with no named enumeration. EV3 names its `grep -rlw`; EV2 names nothing, so the
   class (a)/(b) split rests on an unstated count.
8. [Nit|clarity] `plan.md:110-112` writes the T542 fail case as "sub-90% fidelity rate
   (exit 1)" without `--strict`; `holonovel/scripts/check-conversion-evidence.ts:114-117`
   exits 0 without it. `tasks.md:17` says "strict fail" — plan and tasks disagree.
9. [Nit|clarity] The plan is exactly at its own bound: `wc -l` = 150, `PLAN_LIMIT = 150`
   (`scripts/lib/loop-bounds.ts:13`), and the increment is in scope
   (`spec/audit/loop-artifact-baseline.json:3` since 2026-11-16; not exempt). Zero
   headroom — any clarification added while resolving these findings trips
   `check-loop-artifacts`. The sidecar also disagrees (`plan.evidence.json:13` says 151).
10. [Nit|clarity] `plan.md:99` says "`main` prints each and sets `ok = false`";
    `scripts/version-check.ts` has no `main` — it is a top-level script ending at `:140-147`,
    so the caller seam must be invented.
11. [Nit|clarity] `plan.md:132` (V4) expects `test:validators` "72 passed"; no evidence
    entry carries that count (EV1 records `validate`, not the validator suite).
12. [Nit|design] No step reconciles `validate`'s pre-existing nominal-evidence ratchets when
    T493/T541/T542/T497 become exercised (`scripts/validate.ts:2710-2724`;
    `spec/audit/conformance-baseline.json:2-3` pins both at 0). Cold verification found the
    proposed names safe — the ID sits in the test-name prefix (`scripts/validate.ts:1610`),
    `test-ruleset-gates.ts` is already gated (`holonovel/package.json:79`) and imports the
    harness guard (`:21-22`), and the five Appendix F rows carry no `TTRPG_` token
    (`spec/appendices-reference.md:1524,1528,1974,1975,2177`) — but the plan does not record
    that for build-review.

## Claims checked and found sound

- Corpus shape: 85 rows at `docs/plans/2026-11-15-req-evidence-linkage/corpus.md:3-87`;
  T497 ×8 (`:58-65`), T541 ×2 (`:84-85`), T542 (`:86`), T493 (`:14`), T682 (`:87`).
  85 − 5 = 80; the floor holds *if* finding 3 is resolved.
- Label mechanism: `checkFunctionRanges` (`scripts/lib/req-checks.ts:814`) matches
  `function check\w*(…): string[]` and `:867` takes `return` literals inside it, so
  `checkVersionCurrency` / `checkExpectedActionPrecision` do make T493/T682 readable
  without touching `labelsFromContent` (`:854-870`). Caveat: an arrow-function or
  un-annotated refactor silently loses the label — state the exact shape in tasks.
- Root-script scanning is real: `scripts/validate.ts:1469-1473` feeds every `scripts/**`
  file through `labelsFromContent`; test names feed `gatherExercisedIds` (`:1455-1465`).
- `check-registers` ordering constraint is genuine: `scripts/check-registers.ts:7,39-40`
  resolves Scheduled-roadmap findings against `ROADMAP.md`; the live entry is
  `spec/audit/review-register.md:3088`. P4's ordering is correct.
- `--root` on the vendor gate breaks no caller: `holonovel/package.json:115` passes only
  `--strict`; `holonovel/scripts/run-test-suite.ts:80-81` names npm scripts, not flags; the
  default root (`holonovel/scripts/check-vendor-manifest.ts:29`) is unchanged.
- No spec edit means no `assemble`/fingerprint regeneration; D5's record-don't-execute call
  is correct.
- The plan artifact hash matches the dispatched sha256.

## Stage summary

1. **Zoom out** — The document holds together and is unusually well-evidenced; its
   contradictions cluster in the companion: the empty red-read table (`tasks.md:25-28`) vs
   task 7's "quoted below" (`:17`), and task 9's single command for two artifacts (`:19`).
   Two counts are carried without support (33/52 at `plan.md:14-16`).
2. **Comprehension** — Reproducible: triage 85 rows, close five (thirteen with T497), print
   N, regenerate registers, one commit. The only place the paraphrase must hedge is how
   T682's second Appendix F clause is covered; that hedge is finding 3, not a clarity
   failure of the document.
3. **Critics** — Design lens: done-bar satisfiability depends on a class decision D2
   pre-empts (finding 3); per-task probes are presence-only (finding 6); structural lens:
   red-read ordering is unexecutable (finding 2) and the corpus regeneration is partial
   (finding 4); style lens: `main` (`plan.md:99`), `--strict` (`:110-112`), and "quoted
   below" with nothing below.
4. **Re-zoom** — Not applicable to this dispatch: no author revision exists; every finding
   is first-pass against the artifact as delivered (sha256 above).
5. **Readiness** — Not ready. An implementer would still decide (a) T682's class and hence N,
   (b) how `corpus.md` is regenerated, and (c) how a red read is produced under task 7's
   dependency order.

## Unknowns

- Whether any unlabelled assertion elsewhere covers T682's "visibility-only baseline fails"
  clause — the cold pass read only `scripts/surface-replay.ts:250-326` and the plan's EV3
  says T682 occurs nowhere else; a repo-wide assertion search would settle it.
- Whether `validate`'s bucket/B5/comment-ID paths shift once T493/T541/T542/T497 become
  exercised (only B2/B4/gating were checked).
- The 33/52 citation split, and V4's "72 passed" validator-suite count.
- Gate state: EV1's `check:fast`/`validate`/`test:all` numbers were not re-run (read-only
  stage); no gate result is asserted here.

Reads used: 32 of 40 (plus 2 read-only shell calls: `wc -l`, `sha256sum`).

independent-review FAILED. Blockers 5 · Major 2 · Nit 5 · Deferred 0 · stages 5/5 · reads 32/40
