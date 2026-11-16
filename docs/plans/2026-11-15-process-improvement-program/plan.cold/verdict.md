# Cold pass verdict — 2026-11-15-process-improvement-program

Reviewer: read-only review subagent (no authoring context)
Plan sha256: 42902f946c75e99535688fbd5ed65421d2046d43fabe155324a45e4ab04c81ed
Git HEAD at review: f2ed2a5
Stages executed: 1, 2, 3 (design / structural / style), 5. Stage 4 not applicable — no author edits during review.
Reads used: 17 of 40 (standard budget).

## Verdict

`independent-review FAILED.` 5 Blockers · 8 Majors · 8 Nits.

## Stage 1 — Zoom out

Premise is sound in the large: the costs named (anchor churn, loop-artifact
ordering, bookkeeping, duplicate spec, monolithic `index.ts`) are each mapped to
an increment, and R10's exclusion is stated and honest. The decomposition fails
where it converts a bar item into work without naming a file.

**[Blocker] [design] Done-bar item 4 (admit I2–I6 to ROADMAP with triggers) has no
executable step.** plan.md:39 requires "I2–I6 ... admitted to `ROADMAP.md` with
triggers". `ROADMAP.md` appears in `§5` only at plan.md:139-143 (I2's classifier
wording) and in `§6` only at plan.md:244 (assigned to I2). No entry writes new
sections. ROADMAP.md:3-13 requires every `## <title>` to carry 1–3 bullets and a
`**Trigger:**` line; the file currently has exactly one such section
(ROADMAP.md:15-25). An implementer must invent five sections, their bullets, and
their triggers — and `check-roadmap` gates the shape.

**Nit** plan.md:21 cites plan artifacts at 70% of added lines as a cost, but I5
(plan.md:205-210) only restates the contract; no increment reduces plan volume.
**Nit** plan.md:112-113 misdescribes the anchor mechanism (see Stage 3, N6).

## Stage 2 — Comprehension (artifact only)

Paraphrase: a seven-increment program turning 13 retrospective recommendations
into tooling and documentation changes. I0 writes four process rules into
`docs/workflow-cadence.md` and points AGENTS.md at them. I1 makes anchor
checking run in fast mode, in the pre-commit hook, and heals anchors during
`session:close`. I2 splits the loop-artifact AAR finding by mode and classifies
commit fix-up pairs. I3 stops tracking the packaged spec copy. I4 adds a
REQ→test-evidence linkage validator. I5 derives CHANGELOG/ROADMAP blocks in
`session:close`. I6 splits `index.ts` in six leaf-first stages. "Done" means: I0
and I1 land with `check:fast` green, the anchor red test is demonstrated,
I2–I6 are specified and admitted to ROADMAP, and the session closes as two
commits.

Outcome: faithful-with-gaps. The bar is legible; what cannot be determined from
the document alone: (a) what "admitted to ROADMAP" concretely writes; (b) the
`retires` field I5 derives from; (c) which commit grouping the two-commit bar
means given the split-by-concern planner; (d) whether this increment's own
`tasks.md` exists. (a) and (b) are Blockers below, (c) is M7, (d) is B1.

## Stage 3 — Critics

### Blocker

**[Blocker] [design] The session bar cannot pass on the tree as it stands.**
Predicate: `scripts/lib/loop-artifacts.ts:65-72` emits `level: "error"` for a
missing `tasks.md` and a missing `aar.md`; `scripts/check-loop-artifacts.ts:34,55`
exits 1 on any error; `scripts/lib/gate-manifest.ts:311-316` runs that gate in
fast mode; `docs/plans/README.md:23` states "`plan.md`, `tasks.md`, and `aar.md`
are required". The increment directory contains only `plan.md`
(`ls docs/plans/2026-11-15-process-improvement-program/` → `plan.md`). Bar items 1
and 5 (plan.md:34, 40-41) require `check:fast` and `session:close` to be green.
No `§5` entry (plan.md:69-229) creates `tasks.md` for this increment. What must
change: add the `tasks.md` authoring step (and the `aar.md` step) to the bar's
executable work, or state the exemption explicitly.

**[Blocker] [design] I3's central change already exists in the tree.**
Predicate: `scripts/assemble.ts:6-7` — "writes the assembled `holonovel.md` plus
the reference-implementation copy (`holonovel/holonovel.md`)"; `:19`
`REF_IMPL_OUT`; `:149-156` writes both paths from the same `content` string. So
plan.md:156-161 ("after writing `holonovel.md`, write `holonovel/holonovel.md`
from the same bytes") is a no-op and its test `cmp holonovel.md
holonovel/holonovel.md` (plan.md:160) passes today — verified:
both files hash to `b0b6f0f7…44e2ad`. The `§1` attribution at plan.md:15-17
names `prepare-package.mjs:6-20`, which is the pack-time copy
(`holonovel/scripts/prepare-package.mjs:6-9,37`); the dev-time duplicate is
written by `assemble.ts:153-156`. What must change: re-scope I3 to the parts that
are actually missing (`.gitignore`, `git rm --cached`, the pack-time divergence
check, the test/clone precondition), drop the `assemble.ts` edit, and correct the
`§1` citation.

**[Blocker] [design] I2's stated invariant has no implementation path.**
Predicate: plan.md:119-124 makes missing `aar.md` an error only when `plan.md` is
staged or `--staged` is passed "by the pre-commit hook"; plan.md:126-130 adds
`--staged` only to `scripts/check-loop-artifacts.ts:21-40`. Neither an I2 entry
nor a `§6` row (plan.md:233-254) modifies `.githooks/pre-commit`. That hook has
no direct `check-loop-artifacts` call: `.githooks/pre-commit:31-50` consults
`run-gates --recorded` and, on a recorded pass, skips the suite entirely
(`:33-37`); otherwise it runs `run-gates --fast` with no per-gate flags. So
`--staged` is never passed, and even if it were, the skip branch bypasses it.
`session-close` compounds this: `scripts/session-close.ts:311` assemble, `:318`
`check:fast`, only then `:326 git add -A` — so the gate can only ever see
working-tree mode. The invariant "the commit still refuses without an AAR"
(plan.md:122) is therefore unimplementable from the document. What must change:
name the hook or `session-close` edit that passes staged mode, and say how the
recorded-pass skip is prevented from bypassing the new error.

**[Blocker] [design] I5 derives from a field that does not exist.**
Predicate: plan.md:199-201 — "derive the ROADMAP retirement from the plan's
'retires' field". `docs/plans/README.md:17-23` defines the artifact set
(`plan.md`, `tasks.md`, `aar.md`) and no field list; grep for
`[Rr]etires` in that file returns no match; `scripts/lib/loop-artifacts.ts:45-53`
parses only `**Done bar:**` and the LOOP token. There is no `retires` field
anywhere in the contract the plan cites. What must change: define the field
(name, location, format, parser) and the `docs/plans/README.md` /
`check-loop-artifacts` change that introduces it, or drop the derivation.

### Major

**[Major] [design] I3's `test-spec-tooling` edit rests on a false predicate.**
plan.md:162-166 says the test hashes "a file that is no longer tracked";
`scripts/test-spec-tooling.ts:320-323` compares `scripts/spec-hash.ts --file`
output with `hashFile(join(root, "holonovel", "holonovel.md"))` — a disk read
(`scripts/lib/hash.ts`), never the git index. Under I3 `assemble` writes both
paths, so the check passes unchanged. The real hazard — `test:spec-tooling` run
standalone before `assemble` (package.json:66) in a checkout where the copy is
untracked — is unaddressed. Must change: delete the edit or restate it as an
ordering precondition.

**[Major] [design] Blast radius omits a consumer of I3's change.**
`scripts/lib/commit-plan.ts:39` treats `holonovel/holonovel.md` as a spec path;
removing it from the index changes the planner's spec/non-spec decision and the
"a spec increment is one commit" rule, and `test:commit-plan` is the gate.
Neither `§5` (plan.md:146-171) nor `§6` (plan.md:233-254) names the file.

**[Major] [design] I2's modes contradict the human artifact contract without
updating it.** plan.md:119-124 downgrades missing `aar.md` to a warning in
working-tree mode; `docs/plans/README.md:23` states the three files are required
unconditionally, and that file appears in `§6` only for I5 (plan.md:253).

**[Major] [design] I2's ROADMAP edit invalidates the recorded baseline.**
plan.md:139-143 switches the measured quantity to the rework count;
ROADMAP.md:17-20 records "Baseline 2026-11-08→14: 26 pairs, 15 sharing. Target:
≤7 of the next 26" in shared-path terms. A rework count is not comparable to a
shared-path baseline; no entry restates either.

**[Major] [design] I6 cannot heal file-moved anchors.**
plan.md:225-226 runs `fix-anchors` in each stage; `scripts/refresh-predicates.ts:81`
reads only the anchor's recorded path, and `:94-96` records "no code line with
'<symbol>'" as unresolved (exit 1) once a symbol leaves that file. The resolver
(`scripts/lib/anchor-resolver.ts:23-31`) has no cross-file search. Moving symbols
into new modules (plan.md:223-224) therefore leaves anchors auto-heal cannot
repair; the `§8` mitigation (plan.md:274) covers only ambiguity.

**[Major] [design] I1's pre-commit instruction names a step that does not exist
and duplicates the fast gate.** plan.md:99-102 says "after the existing
discipline checks"; `.githooks/pre-commit:31-53` has three steps only (recorded
check, assemble + fast suite, guarded-rule-change) — script discipline runs
inside the suite. Once `check-anchors` is in the manifest (plan.md:92-98), the
hook already runs it via `run-gates --fast`, so a separate invocation is either
duplicated or sits outside the skip branch, unspecified.

**[Major] [design] The declared commit shape is not what `session:close`
produces.** plan.md:40-41 requires "one commit per increment (I0, I1 = two
commits)". `scripts/lib/commit-plan.ts:10,23` fixes the order pipeline → server →
config → misc → docs (docs last) and `:77-79` maps `docs/` to docs. I1 touches
`scripts/` + `.githooks/` + `AGENTS.md`; I0 touches `docs/` + `AGENTS.md`, so
AGENTS.md — carrying I1's regenerated gate table (plan.md:94-95) — lands in the
trailing docs commit, separated from `scripts/lib/gate-manifest.ts`. The gate runs
once before the series (`scripts/session-close.ts:318`, then `:326+`), so `§4`'s
"Gate each commit must pass" (plan.md:57) is unenforced and an intermediate
commit can be red on `check-gate-table`.

**[Minor] [design] I2 names a non-blocking command as a gate.** plan.md:61,288
list `npm run loop-audit`; package.json:85 is the plain writer — `--check` is the
trailing-window gate (AGENTS.md gate notes).

### Nit

- N1 plan.md:104-107 cites `:333` for staging; `session-close.ts:326` is
  `git add -A`, `:333` is `stagedPaths()`.
- N2 plan.md:92 cites `gate-manifest.ts:325-329`; the entry spans `:324-329`
  (verified: `fast: null`, `full: npm("check-anchors")` at `:327-328`).
- N3 plan.md:87 tests AGENTS.md with `validate-readme`, which validates README.md.
- N4 This plan's own bar is not machine-readable: `loop-artifacts.ts:45` matches
  `**Done bar:**`; plan.md:30 is a `##` heading, so the plan raises the
  "plan.md has no **Done bar:** line" warning (`loop-artifacts.ts:92-97`),
  contrary to `docs/plans/README.md:35`.
- N5 `Size:` S/M/L is used throughout (plan.md:83, 98, 125 …) with no legend,
  while the repo's split rule is stated in changed lines (AGENTS.md).
- N6 plan.md:112-113's "red on a 41+ line shift … pinning the window edge"
  misdescribes the gate: `refresh-predicates.ts:85-102` treats any line change as
  drift, and only duplicate symbols beyond the window are refused
  (`refresh-predicates.ts:90-92`, `anchor-resolver.ts:39-40`). With a unique
  symbol `--write` heals a 41-line shift (so the edge is not pinned); with a
  duplicated symbol `--write` cannot heal it (so "green after --write" is false).
- N7 plan-artifact volume (plan.md:21) is cited as a cost but not reduced by any
  increment.
- N8 `§7`'s I3 rationale ("must not precede I1 or the packaged copy drifts
  mid-run", plan.md:261) is unexplained and unreflected in `§4`/`§9`.

## Stage 5 — Readiness

Go/no-go: **no-go**. Every path named in `§5` exists and is a file the plan
describes accurately, with the exceptions recorded above (B1 missing `tasks.md`,
B2 wrong `assemble.ts` premise, M1 wrong `test-spec-tooling` premise, B4
nonexistent field). The bar's five items are individually achievable except item
1 (B1) and item 4 (B5); item 5's commit shape (M7) and its single gate pass are
not what the plan asserts.

## Coverage of the requested structural checks

| Claim in the plan | Result |
|---|---|
| `gate-manifest.ts:325-329` — `check-anchors` fast is null | Confirmed (`:324-329`, `fast: null`, `full: npm("check-anchors")`) |
| `loop-artifacts.ts:72` — missing `aar.md` error | Confirmed exactly |
| `session-close.ts:311-318` — assemble then check:fast | Confirmed (`:311`, `:318`) |
| `anchor-resolver.ts` — `ANCHOR_WINDOW = 40`, ambiguity refusal | Confirmed (`:9`, `:32-40`); refusal is enforced at `refresh-predicates.ts:90-92` |
| `prepare-package.mjs:6-20` — copies root spec into the package | Confirmed (`:19-20`, `:37`), but it is the pack-time copy, not the dev duplicate |
| `test-spec-tooling.ts:322` — hashes `holonovel/holonovel.md` | Confirmed as a disk read, not a tracked-file read — premise of the edit fails |
| `index.ts` line count | Confirmed 19,089 lines exactly |
| `holonovel/holonovel.md` tracked and byte-identical | Confirmed (`git ls-files` hits; both sha256 `b0b6f0f7…44e2ad`) |

## Unknowns

- `§1`'s counts (117 commits, 97 increments, 337 sessions, 3.37 B tokens, 4,000
  gate records, 54/97 AARs, 689 anchors, 269 register edits, 63 commits, 175 k/turn,
  565 verdict rows, U1 81%) are outside the read budget; the evidence sidecar must
  carry them.
- "17 gate failures, all missing aar.md" is unverifiable without
  `.holonovel-state` gate records.
- I2's expected test numbers (29 pairs / 15 sharing over 11-08→15; three "Secret
  relationship recommendations" splits) are unverified; ROADMAP.md:19 records
  26/15 for the shorter 11-08→14 window, so the arithmetic is plausible but
  unconfirmed.
- I4 assumes Appendix F carries a per-row kind column; not read (not a named path).
- Whether any gate other than `commit-plan.ts:39` reads the embedded spec from
  the git index: only `*.ts` was searched (5 hits); other gate implementations unread.
- Isolation: my context carried project `AGENTS.md` instructions not supplied by
  the parent. Findings above rest on file content, not on those instructions.
