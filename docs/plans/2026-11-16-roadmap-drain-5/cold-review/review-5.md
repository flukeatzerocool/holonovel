# Cold review 5 — Roadmap drain 5 (standard depth, independent)

Reviewer: review (cold, single dispatch, Stage 5 + repair re-audit)
Plan sha256: `704e4c29a2bd6dadaaa6346e998126f5f5ec8671035aa8793edd1fa5a539f852` (150 lines)
Companion: `docs/plans/2026-11-16-roadmap-drain-5/tasks.md` sha256
`5607ae79d81e73bdebbe68b2c31a443045188c8697c4dd848a100fcdf46a11ee`
Evidence sidecar: binds — `plan.path` is this artifact, `plan.sha256` equals the dispatched hash,
`git_head` `6155f9c`; the increment directory is the only untracked entry. Sidecar `lines: 151` vs
"150" is a trailing-newline artifact. Sidecar `unknowns` lists "one or more target paths do not
exist" — that is `dispositions.md` (created by task 2) plus the three `/tmp` paths, both expected.

## Stage summary

| Stage | Ran | Result |
|---|---|---|
| 1 — zoom out | yes | 1 internal arithmetic wobble; otherwise coherent |
| 2 — comprehension | yes | **faithful** (goal, five-row closure, `N = 80`, done bar all recoverable) |
| 3 — critics (six repairs + checklist) | yes | 1 Blocker, 3 Majors, 6 Nits |
| 4 — re-zoom | not run | no edits made in this pass; this is the re-audit after revision 5 |
| 5 — readiness | yes | fails on one unreachable acceptance case |

## Repair verification

| # | Repair | Verdict | Evidence |
|---|---|---|---|
| 1 | B1 defer branch | **PASS** | Closure set is exactly T493, T682, T541 (REQ-451 + REQ-451a), T542 = 5 rows → `N = 80` (plan:50; corpus rows `corpus.md:14,84,85,86,87`). The 8 T497 rows are `defer` (plan:51-56, tasks:24; corpus:58-65). No surviving edit instruction for `holonovel/scripts/test-update-workflow.ts`: it appears only as evidence and as the deferral reason, and is absent from the blast-radius table. The deferral reason matches the appendix row: `spec/appendices-reference.md:1528` carries exactly three clauses (sentinel; source-only rebuild reuses hashes; four-of-five change runs full Build). |
| 2 | D5 probe | **PASS** | Fixed-string counts on the committed corpus: T493 1 (`:14`), T682 1 (`:87`), T541 2 (`:84-85`), T542 1 (`:86`) — exactly the plan's `1,1,2,1`. Post-edit target is the regenerated `corpus.md`, not the baseline. |
| 3 | V3 regeneration | **PARTIAL** | Structurally sound: the corpus is 87 lines = header + separator + 85 rows, no count/timestamp line, rows REQ-sorted, so deleting five rows yields exactly five diff lines. But the literal `diff corpus.md /tmp/c2.md` had no directory (the file is `docs/plans/2026-11-15-req-evidence-linkage/corpus.md`), and the writer's determinism was not read (Unknown). |
| 4 | V5 split | **PASS** | `test:ruleset-gates` is a real script (`package.json:60`, `holonovel/package.json:79`) and prints `${passed} passed, ${failed} failed` (`holonovel/scripts/test-ruleset-gates.ts:397`); it is genuinely absent from `run-test-suite.ts:26-82`, so splitting the row was necessary. |
| 5 | V4 stale-version caller case | **FAIL — Blocker 1** | See below. |
| 6 | M5 per-script guards | **PASS** | `version-check.ts` is not a manifest gate; reachable via `npm run version-check` (`package.json:77`), the CI-only step and build-order — matching the plan. `surface-replay` and `test:spec-tooling` are `yes/yes` gates; `test:ruleset-gates` is its own `yes/yes` gate and absent from `test:all`. All four claims hold. |

## Findings

### Blocker 1 — `[design]` The stale-version caller case (and the surface-replay unit case) cannot be reached from `test-spec-tooling.ts`

`plan:139` (V4), `plan:79`, `tasks.md:28` (task 6).

- `scripts/version-check.ts` is a top-level script with **no exports** and module-level execution
  from `:49` to `:147`, ending in `process.exit(1)`/`process.exit(0)` (`:140-147`). The "caller
  block" is the bare statement sequence at `:132-138`, not a function.
- `scripts/surface-replay.ts` has the same shape: `defects` and every `.push(` at module scope
  (`:270-298`), no exports, ending in `process.exit(defects.length === 0 ? 0 : 1)` (`:326`).
- `scripts/test-spec-tooling.ts` only imports `scripts/lib/*` (`:17-25`) and runs other scripts
  through `npx tsx` (`:36-45`). A spawn of `version-check.ts` always reads the live repo (`ROOT` at
  `version-check.ts:14`) and can only assert the current, non-stale state; an import executes the
  whole script and terminates the test process.
- No main-guard idiom exists anywhere in `scripts/` (searched `import.meta.main`,
  `pathToFileURL(process.argv`, `process.argv[1]` — no matches).

**What must change** (pick one, then update `plan:79`, `plan:139`, `tasks.md:28`):
1. Export the pure check, add an exported caller returning `{ lines, ok }`, move the module body
   under a main guard so an import has no side effects and no `process.exit`.
2. Or drop the caller case from V4 and state that only the extracted function is unit-tested, with
   the script's exit contract covered by a direct run.

The same reasoning applies to the "visibility-only baseline" case against
`checkExpectedActionPrecision` (`surface-replay.ts:270-326`): unreachable by import and not
injectable by spawn (`surface-replay.ts:28` fixes the prior artifact path). Either export it with a
main guard, or assert it in-file as a fixture (as `:264-268` already does) and remove it from V4's
unit-case count.

### Major 1 — `[design]` T682 is a new assertion, not a label move; class (a) is wrong as recorded

`plan:44-45` (D1(a)), `plan:57-59` (D4), `plan:78`, `tasks.md:25`.

`spec/appendices-reference.md:2177` requires two clauses: a sibling selection counts as a wrong
selection, **and** a visibility-only baseline fails. The first exists
(`surface-replay.ts:264-268,285`); the second does not — the product currently *accepts* a
visibility-only prior by falling back to it: `prior?.recall_at_budget?.recall ??
prior?.visibility_rate` (`:288`). The plan's task 5 adds the missing assertion, so the work is
specified, but the dispositions row would record T682 as class (a) "already covered", which is false
at triage time and overstates pre-existing evidence.

**What must change:** state in D3/D4 that T682's second clause is newly authored (and whether the
`:288` fallback is removed, kept, or bypassed by the fixture), and record the row so the label-gap
claim is not applied. The committed replay record is not a hazard: all three profiles carry
`selection_precision` and `recall_at_budget`
(`spec/audit/tool-surface-replay.json:14,17,726,729,1438,1441`).

### Major 2 — `[design]` The P1 bail-out cannot satisfy the plan's own done bar

`plan:149-150` versus `plan:69-71`.

`N = 80` and the closed-row state are produced only by P2–P4; stopping before P2 leaves the corpus
at 85, ROADMAP unrevised, and the five closures undone — a failed increment, not a bounded one, and
the AAR would judge against an unsatisfiable bar. The 85-row triage also includes, per task 2's
check, quoting an asserting test body for every class-(a) row: an unbounded read cost with no
checkpoint.

**What must change:** declare the fallback's own done bar (dispositions.md authored through all 85
rows; corpus and ROADMAP untouched; increment renamed 4a) so a stall closes cleanly, or add a
checkpoint with a decision point.

### Major 3 — `[design]` `check-registers` can fail on the new `Scheduled-roadmap` row's REQ tokens

`plan:123-126`, `tasks.md:33`, V6 at `plan:141`.

`scripts/lib/register-checks.ts:64-67` extracts **every** `REQ-\d{3}[a-z0-9]*` token from a
`Scheduled-roadmap` finding and fails if `ROADMAP.md` does not contain that literal string. Task 11
constrains ROADMAP item 3 to "1–3 bullets carrying the residue by class and `80`" — no REQ tokens —
while the register row describes the same 80 rows. If the row cites any residual REQ identifier the
bullets do not carry (the residuals span dozens, e.g. REQ-108b, REQ-211c), V6 fails.

**What must change:** state that the register finding cites only REQs named in item 3's bullets (or
that the entry is `Resolved` for the five closed rows), and add "each cited `REQ-` token appears in
`ROADMAP.md`" to task 11's check.

### Nits

1. `[clarity]` **EV2 surplus arithmetic contradicts itself.** "The ten surplus rows duplicate an
   already-cited ID: `T497` ×8, `T541` ×2, `T87` ×2, `T431` ×2" is 14 duplicated rows; 85 − 14 = 71,
   not 75. Reword as "ten surplus rows (T497 +7, T541 +1, T87 +1, T431 +1)".
2. `[clarity]` **Bare line citations.** `plan:78` and `tasks.md:25` cite `:2177`/`:1524` with no
   filename; `plan:28` cites `check-vendor-manifest.ts:29-31` without its `holonovel/scripts/`
   prefix. Cold readers must guess the file.
3. `[clarity]` **V-rows are not pasteable.** `plan:138` uses `diff corpus.md /tmp/c2.md` — no such
   file at the repo root. `plan:141` mixes `npm run check:fast` with bare `check-roadmap` /
   `check-registers`.
4. `[design]` **A third private `argValue` copy.** Task 8 specifies an "explicit parse"; `argValue`
   is already duplicated at `scripts/update-server.ts:43` and
   `holonovel/scripts/check-conversion-evidence.ts:24`, and AGENTS requires multi-flag scripts to
   parse through `scripts/lib/args.ts`; `check-script-quality` (C2) gates duplicate helpers. Say
   "reuse/extract `argValue` into `scripts/lib/args.ts`".
5. `[clarity]` **D2 leaves two columns undecided.** `cite` has domain {`yes`,`—`} but no definition,
   and no task or V-row validates it; the class→action mapping is inferable but never written.
6. `[clarity]` **Unit cases have no red-before-green step.** `plan:108` says the red reads run before
   the extraction lands, but `tasks.md:28` depends on task 5 and its check substitutes the corpus
   probe, which proves the label is absent, not that the new case fails first.

### Unknowns

- `scripts/build-order.ts:261` invoking `version-check.ts` — not read; accepted on citation (the CI
  step and `package.json:77` were confirmed).
- `--write-linkage-corpus` writer ordering/determinism — not read; V3's byte-identity is inferred
  from the corpus's count-free, REQ-sorted 87-line shape.
- `scripts/validate.ts:1610`, `:1222`, `:2710-2724` and
  `spec/audit/conformance-baseline.json:2-3` — not read; D3/D4's scan claims taken on citation.
- `test-update-workflow.ts:190,199` and `test-spec-tooling.ts:296-323` contents — not read; the
  deferral reason is consistent with `spec/appendices-reference.md:1528`.
- `scripts/lib/args.ts` exports — not read; only the absence of a shared `argValue` was established.
- Whether `check-script-quality` C2 would flag a third `argValue` copy — detector not read.

### Note on the `--root` assumption (checked, holds)

`plan:80`, `tasks.md:30` claim `--root` can be added with the default unchanged. Verified: `ROOT`,
`NARRATIVE_DIR`, `MANIFEST_PATH` are defined at `holonovel/scripts/check-vendor-manifest.ts:29-31`,
first consumed at `:49`; `--help` is handled at `:34-41` and returns before any read. Moving the
constants below argument parsing leaves the no-flag path byte-identical. The one behaviour change is
that unknown flags, currently ignored by `process.argv.includes` (`:33-34`), will exit 1 — stated in
task 8, and no known caller passes an unknown flag.

Reads used: 26 of 40 (25 read/grep calls plus one denied shell call).

**independent-review FAILED.** [plan.md] — 1 blocker

1. [design] The V4 stale-version caller case is unreachable: `scripts/version-check.ts` exports
   nothing and executes at module scope with `process.exit` (`:49-147`); the "caller" is a bare block
   at `:132-138`; `scripts/test-spec-tooling.ts` can neither import it nor inject a stale version by
   spawning (`:36-45`). The same holds for the surface-replay unit case (`:270-326`). Export the pure
   checks behind a main guard, or drop the two cases from V4/tasks 6.

Majors: 3 · Nits: 6 · reads 26/40

## Resolution (author amendment, revision 6)

- **Blocker 1** — taken as the *spawn* path, not the main-guard path: `version-check.ts` gains a
  `--root <dir>` seam (mirroring the vendor gate), so `scripts/test-spec-tooling.ts` spawns it
  against a scratch root with a stale `package.json`/`CHANGELOG.md` (exit 1) and a current one
  (exit 0). No import, no main guard. `surface-replay`'s visibility-only clause is asserted **in
  file** by `checkExpectedActionPrecision`, as `:264-268` already does for the sibling fixture;
  V4 no longer claims unit cases for it.
- **Major 1** — D3 records T682 and T493 as *authoring*, not relabelling, and states that
  `surface-replay.ts:288` currently accepts a visibility-only prior; the task must decide and record
  the fallback.
- **Major 2** — the done bar now carries a **fallback bar**: all 85 rows triaged, corpus and
  `ROADMAP.md` untouched, increment renamed `4a`.
- **Major 3** — P4 states the register cites only REQs that item 3's bullets name; task 12's check
  asserts it.
- **Nits 1–6** — EV2 surplus arithmetic corrected to `+7/+1/+1/+1`; citations carry their filenames;
  V3 uses the full corpus path and V5 uses `npm run` forms; both gates reuse `scripts/lib/args.ts`
  rather than adding a third `argValue`; D2 defines `cite` and the class→action mapping; the
  unit-case red-read claim is dropped and replaced by the spawned stale-root red read.
