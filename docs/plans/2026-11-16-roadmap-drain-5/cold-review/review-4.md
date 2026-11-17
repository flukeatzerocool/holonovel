# Cold review 4 — 2026-11-16-roadmap-drain-5 (full pass, revision 4)

Reviewer: cold subagent, no authoring context. No parent findings were treated as authority; three
prior reviews were read as records only.
Plan artifact: `docs/plans/2026-11-16-roadmap-drain-5/plan.md` — sha256
`3576abfe52506f62a6ee2eb7aec9011e871a18d53caffda7931d4e430797d216`, **verified by `sha256sum`**,
149 lines (verified `wc -l`).
Companion: `docs/plans/2026-11-16-roadmap-drain-5/tasks.md`, 44 lines.
Evidence sidecar: `~/.local/state/opencode/plans/fe586f09…/plan.evidence.json` — **now binds to this
artifact** (`plan.sha256` = `3576abfe…`, `git_head` `6155f9c`, matching the plan's Evidence line at
`plan.md:4`).
Gate depth: **standard** (rollback cost 1, reversible text, one commit). Cold pass.

## Stage-by-stage

| Stage | Scope | Result |
|---|---|---|
| 1 — artifact & independence (§0) | hash, line count, sidecar binding, target list, prior-artifact hashes | **Clean.** `plan_sha256` equals the `sha256sum` output; 12 targets cover the 12 named blast-radius paths. One provenance nit (N3). |
| 2 — completeness, scope, blast radius (§1–§2) | every file named in a phase/task vs the table; implicit requirements; spec-project checks | Blast radius **complete** (6 code files, increment dir, `corpus.md`, `req-coverage.md`, `ROADMAP.md`, `review-register.md`, `CHANGELOG.md`). Read-only citations (`spec/appendices-reference.md`, `validate.ts:2710-2724`, `conformance-baseline.json`) correctly excluded. **B1** is a §2 partial-coverage defect (T497). |
| 3 — evidence re-measurement | EV1–EV5 against the tree at `6155f9c` | EV2's 85 rows, EV3's exception list, EV4's `labelsFromContent` shape, EV5's `ROOT` hardcode and both wired gates all hold. Row counts: T493 1, T682 1, T542 1, **T541 2**, **T497 8**. EV1/33-52/75-distinct deferred. |
| 4 — dependency order & assets (§3–§4) | task dependencies, gate ordering, committed targets | Sound. Task order 1→…→12 is acyclic; P4's register-after-ROADMAP ordering is safe (though its stated reason is broader than the gate — N4). |
| 5 — verification, done bar, gates, adversarial (§5–§8) | V1–V7 decidability, closure arithmetic, gate interactions | **M1–M5**: three verification rows cannot pass/be observed as written; the T541 red-read mechanism contradicts the change that creates it; one refactored script has no local gate. |

## Direct answers to the five claimed repairs

**1. D5's probe — form correct, expected value wrong.** The writer emits
`` | ${reqId} | ${tid} | kind | verdict | `` (`scripts/validate.ts:2654-2656`), so
`grep -cF '| T493 |'` is a valid column-2 fixed-string probe with no anchor and no BRE alternation.
But "`1` before closure, `0` after" is true only for singleton rows. Measured counts in `corpus.md`:
T493 = 1 (`:14`), T682 = 1 (`:87`), T542 = 1 (`:86`), **T541 = 2** (`:84-85`), **T497 = 8**
(`:58-65`). The prompt's hypothesis about `T420` is unfounded: `T420` and `T425` each appear in
exactly one row (`grep -cF`). So the "recorded per row" wording does **not** survive: two rows share
one T541 count, eight rows share one T497 count. See **M1**.

**2. Sidecar — repaired.** `plan.evidence.json:11` = `3576abfe…`, identical to the artifact; `:5` git
HEAD matches `plan.md:4`; `:15-99` lists all 12 blast-radius paths (`dispositions.md` stands in for
the increment directory, and its `exists:false` is expected for a new file). Only defect: `:13`
records 150 lines where the file is 149 — cosmetic (N3).

**3. M1's split — repaired, and the reason is stronger than the prose.** `checkImplCoverage` computes
the bucket at `validate.ts:2107-2115`: B is possible only when the REQ is cited and has **zero**
exercised tests; C requires ≥1. Baseline B = 0 (`plan.md:13`), so no affected row can move B→C, and
`INTENDED_GAP_REQS` rows stay E regardless (`:2113-2115`). Verified in the register: REQ-451 and
REQ-452 are bucket E today (`spec/audit/req-coverage.md:420-421`), so only their `Exercised tests`
cell changes (`—` → `T541` / `T542`). The register collapses sub-parts to base REQs
(`validate.ts:2080-2092`), so REQ-313a–d appear as one REQ-313 row — also consistent. "Only
`Exercised tests` cells change; no bucket moves" is **true**.

**4. M2's label site — the site is genuine, the second half is not.** `scripts/test-spec-tooling.ts:293-323`
are `check(cond, "message")` calls; `:296` is the `// REQ-313a / REQ-314b —` comment.
`labelsFromContent` admits every `check(` call's literals (`scripts/lib/req-checks.ts:861`) and root
`scripts/*.ts` feed `exercisedIds` (`validate.ts:1443, 1469-1472`), so a `T497` in a `check(...)`
message is a real emitting position and would close all eight rows (`corpus.md:58-65`). But the
*other* named site is the wrong contract: `holonovel/scripts/test-update-workflow.ts:190` is
`test("T689/REQ-395c: dry run plans a stale package…")` and `:199` is
`test("T689/REQ-395c: apply rebuilds through the recorded emitter…")`. Neither asserts T497's three
clauses (`spec/appendices-reference.md:1528`: DECISIONS sentinel; source-only hash reuse; 4-of-5
components → unscoped full build). Adding an ID to a test *name* cannot add an assertion, and no
other test in that file covers the clauses (grep for `T497|fingerprint|scoping|sentinel` returns
only the header comment, the T84b delta tests, and `contract-fingerprints.ts` reads). See **B1**.

**5. M3's format — the arithmetic is now unambiguous, the `awk` is not quite.** With D2's columns
(`plan.md:48-50`) and `closed` as a literal action, `N = 85 − count(action = closed)` has exactly
one meaning and `N ∈ {80, 72}` follows (5 or 13 rows). V7's `awk` is decidable **in principle**, but
three conventions are still unpinned: the class cell literal form (`(a)` per D1 vs `a|b|c` in the V7
comparison), whether a header row exists (affects "85 rows"), and the meaning of `cite` versus `home
line` (D2 never defines either, and V7 requires a home line only for `closed` rows without stating
the empty marker). See **N1**.

## Findings

### Blocker

**B1 `[design]` — the T497 closure has no asserting site, and the plan's own class definition forbids
it.** `plan.md:51-56` (D3) lists T497's eight rows among this increment's closures, and
`plan.md:110-112` / `tasks.md:25` name the closure mechanism: add `T497` to a `check(...)` message in
`scripts/test-spec-tooling.ts` and to the `test(...)` names at
`holonovel/scripts/test-update-workflow.ts:190,199`. D1(a) (`plan.md:45-47`) defines a label gap as
"an emitting assertion covers every clause of the row". The named tests are `T689/REQ-395c`
update-package tests (`dry run plans a stale package and writes nothing`; `apply rebuilds through the
recorded emitter`) — they assert package rebuild planning, not T497's fingerprint scoping. The
`check(...)` label lives in a *different* harness that asserts the fingerprint-delta renderer
(`test-spec-tooling.ts:296-323`), so the eight rows would be marked exercised by a string in an
unrelated file with no assertion anywhere covering the clauses. This is the partial-coverage class §2
treats as a hard blocker, and it also produces precisely the nominal evidence the harness's own
ratchets exist to prevent (the gates will not catch it: the prefix carries `T497`, so
`checkBundledEvidence` passes, `validate.ts:1610`; T497's row names no `TTRPG_` token, so
`checkAppendixFAssertions` stays at 0 — confirmed by grep; the name carries ≤2 IDs, so inflation
passes).
**Fix (either):** (a) set `action: defer` for the eight rows and delete the `test-update-workflow.ts`
instruction — then N = 80 and D3 states one branch; or (b) author the assertion first: a test in
`test-update-workflow.ts` that asserts the sentinel record, source-only reuse of
generated-data/extraction hashes, and the 4-of-5-component full build, named
`T497/REQ-313/REQ-314: …`. In both cases, P1's check must say the clause read is against the
**asserting test body**, not the Appendix F row.

### Major

**M1 `[design]` — D5's expected counts are wrong for two of the five closures, and the probe file is
unnamed after the edit.** `plan.md:63-64` and `plan.md:138` state `1` before / `0` after per closed
T-ID; `tasks.md:12-13` repeats it. Measured: T541 = 2, T497 = 8. As written, V2 false-fails for T541
and is unimplementable "per row" for T497 (eight rows, one count). Second gap: `/tmp/c.md` is the
85-row baseline from task 1 (`tasks.md:17`; task 6 calls it "the pre-task-5 probe"), while the closed
corpus is the regenerated `corpus.md` at task 10 (`tasks.md:26`) — the plan never says which file the
"after" read uses, and probing `/tmp/c.md` "after" still returns 1.
**Fix:** record the expected count per T-ID (T493 1, T682 1, T541 2, T542 1, T497 8) and name the
file for each read (`/tmp/c.md` before; `corpus.md` after) — or drop the before-value to "the row
count recorded at P1".

**M2 `[design]` — V3's `diff` expects identity between an 85-row baseline and an N-row regenerated
corpus.** `plan.md:139` asserts `diff /tmp/c.md docs/plans/2026-11-15-req-evidence-linkage/corpus.md`
is "identical". After task 10 the committed corpus has 80 or 72 rows (`tasks.md:26`), so the diff
shows the removals, not identity. Prior review validated only the `grep -c '^| REQ-'` half of this
line.
**Fix:** either re-run task 1's command to `/tmp/c.md` after the edits and say so (making the diff a
freshness/determinism proof), or change the expectation to "the only diff hunks are the closed rows"
and keep `grep -c` = N.

**M3 `[design]` — V5's expectation cannot be observed from the command it names.** `plan.md:141`
pairs `npm run test:all` with "`test-ruleset-gates` reports two more passing cases".
`holonovel/scripts/run-test-suite.ts:55-82` is a literal command list that contains
`test:update-workflow` (`:79`), `check:vendor` (`:80`), `check:conversion-evidence` (`:81`) but
**not** `test:ruleset-gates`; the suite would neither run the two new cases nor print their count.
The count itself is readable (`test-ruleset-gates.ts:397` prints `N passed, M failed`).
**Fix:** split V5 into two commands — `npm run test:ruleset-gates` (expect a count two above
baseline) and `npm run test:all` (suite green only).

**M4 `[design]` — task 7's red read relies on behavior task 8 is what introduces.** `tasks.md:23-24`
says the T541 case "fails now (`--root` unsupported)" and `tasks.md:37-38` expects "a non-zero exit
from the unknown flag"; but `holonovel/scripts/check-vendor-manifest.ts:33-41` parses only `--strict`
and `--help` — there is no unknown-flag rejection, so `--root <tmp>` is silently ignored, the real
manifest is checked, and the script exits 0 (`:29-31` derives `ROOT`/`MANIFEST_PATH` at module load).
Task 8's own scope ("unknown flag → stderr + exit 1", `tasks.md:24`) is the change that creates the
rejection, so the red read is circular. The tampered-copy assertion does fail pre-change, but because
the wrong manifest is checked — not for the stated reason — and the exit-0 half of the T541 case
passes vacuously (a non-discriminating green).
**Fix:** restate the red read as "the tampered-hash case fails because `--root` is ignored and the
real manifest passes", state that the exit-0 half only becomes discriminating after task 8, and note
that `ROOT`/`MANIFEST_PATH` must move below argument parsing.

**M5 `[design]` — the risk line's guard claim is false for one of the two restructured scripts.**
`plan.md:147-148` says "`test:all` (V5) and `check:fast` (V6) guard it". `scripts/version-check.ts` is
invoked nowhere in the gate manifest or the suite — only by `scripts/build-order.ts:261` and the
CI-only "Version consistency + currency" step. `test:all` runs neither `version-check.ts` nor
`test:ruleset-gates`; `check:fast` runs `surface-replay` and the function-level `test-spec-tooling`,
but nothing executes the refactored `version-check` CLI. Task 5's check ("both scripts exit 0 on the
tree") is the only local execution, and exit 0 does not prove the caller sets `ok = false` on a stale
version.
**Fix:** name the guard per script — `npm run test:spec-tooling` for both extracted functions,
`npx tsx scripts/version-check.ts` (exit 0) plus a stale-version unit case for the caller, and the
`surface-replay` gate for the other — and correct the Risk line.

### Nit

**N1 `[clarity]` — D2's shape still leaves three conventions unpinned**, so V7's `awk` is a family of
checks rather than one: the class literal (`plan.md:45-47` writes `(a)/(b)/(c)`; `tasks.md:18` counts
"class counts"), the header-row question ("85 rows"), and the undefined `cite` / `home line` pair
(`plan.md:48-50`; V7 at `:143` requires a home line only for `closed`). State the row template
verbatim, including the empty-cell marker.

**N2 `[clarity]` — T542's "no code seam" is wrong and its red read is not a red read.**
`holonovel/scripts/check-conversion-evidence.ts:33,40` already accepts `--decisions <path>` — that
flag *is* the seam the temp-file test uses. The intended claim ("no code change needed") is right,
but `plan.md:118-120` and `tasks.md:39-40` substitute "the corpus row" for D6's red read; a test that
passes on first run demonstrates nothing about the gate. Say "assertion against the existing seam;
the probe proves the T-ID unexercised, not that the gate fails".

**N3 `[clarity]` — sidecar line count.** `plan.evidence.json:13` records 150 lines; the artifact is
149. The sha256 binding is correct, so this is cosmetic — but it is the exact field a reader uses to
confirm the sidecar describes this revision.

**N4 `[clarity]` — the `check-registers` ordering rationale is broader than the gate.**
`plan.md:126-127` says the gate "resolves each `REQ-` token against the roadmap";
`scripts/lib/register-checks.ts:64-67` does that only for `Scheduled-roadmap` sections. Keeping the
order is harmless; the stated hard constraint is not what the gate enforces.

**N5 `[clarity]` — process.** This is the fourth cold pass on a standard-depth plan. `plan-review` §8
/ the re-review protocol cap standard at one re-review; `plan.md:8` records "At the escalation cap"
and then re-runs `preflight` and stamps a fourth revision. Recording it, not gating on it — the
remaining defects are amendment-scale, not rewrite-scale.

### Deferred

- **D1** — EV1's executed counts (`46 passed`, `0 error(s), 390 warning(s)`, buckets A0/B0/C493/D0/E117,
  700 exercised, 85 findings, 79 validators; `plan.md:12-14`) were not re-run: a cold read-only pass
  executes no gate.
- **D2** — the 33/52 "REQ id occurs in code" split (`plan.md:16-18`) was not re-derived row-by-row;
  the stated command is reproducible.
- **D3** — "85 rows over 75 distinct T-IDs" (`plan.md:15`) is unverified: a `sort -u` shell pipeline
  was denied. Arithmetic note for the next pass: T497 (8 rows) and T541 (2) account for 8 of the 10
  surplus rows, so two further duplicated T-IDs exist unmentioned — benign for this plan, since only
  D3's five IDs are probed.
- **D4** — T682's second clause at `spec/appendices-reference.md:2177` was not read (T493's
  two-direction clause at `:1524` was, and matches `plan.md:54`).

## Gate interactions (explicitly checked)

- **`check-tool-surface` / `surface-budget` / `action-conflicts`** — unaffected: no registered tool,
  action, or parameter changes; `--root` on `check-vendor-manifest.ts` is a script flag, not a tool
  definition.
- **Harness gating** — `test-ruleset-gates.ts` is already wired (`holonovel/package.json:79` +
  manifest gate), so the new cases are gated; no new harness file. (But see **M3** on where they
  actually run.)
- **Test-name inflation** — `collectHarnessTestNames` takes IDs from the pre-colon prefix
  (`validate.ts:1573-1577`); `T541/REQ-451`, `T542/REQ-452`, and `T689/T497/REQ-395c` each carry ≤2
  IDs. Safe.
- **Bundled-evidence ratchet** — the pre-colon prefix would include T497, so `direct` is true
  (`validate.ts:1610`) and `bundledOnlyBucketC` does not rise. The ratchet is silent on substance —
  which is why **B1** must be fixed by design, not by gates.
- **Appendix F assertion ratchet** — none of T493/T497/T541/T542/T682 names a `TTRPG_` token (grep
  over their Appendix F rows: no match); `conformance-baseline.json` pins both counters at 0
  (verified). No rise.
- **`check-anchors`** — the only spec mention of `version-check` is prose in
  `spec/audit/review-register.md`; no evidence anchor resolves to either restructured script, and
  both new function names are new symbols.
- **`checkHarnessTitleIds`** — T541/T542/T497 all resolve to Appendix F rows
  (`spec/appendices-reference.md:1974, 1975, 1528`).
- **`check-loop-artifacts`** — plan/tasks present, AAR named (`plan.md:131`), ≤120 lines is
  self-imposed; no line bound found in the artifact gate.
- **Done-bar satisfiability** — `a+b+c=85`, `N` arithmetic, and "probe 0 after" are satisfiable;
  M1–M3 are the three rows that are not as written.

Reads used: **40/40** read/grep (25 `read` + 15 `grep`), plus 5 successful read-only shell calls
(`sha256sum`, `wc -l`, `head`, `grep -c`, `cat`) and 4 denied shell calls (chained/multi-command
forms, `awk` pipeline) recorded above. No gate was executed.

independent-review FAILED. Blockers 1 · Majors 5 · Nits 5 · Deferred 4 · reads 40/40

**Disposition note.** The Blocker is a `design` finding, not `clarity`, so no single-stage re-audit is
implied; B1 has a one-line remedy (defer T497 → N = 80) that also settles M1's T497 half. M1–M5 are
all verification-text fixes, each with a concrete replacement line. The artifact must not be stamped
`fresh` for `build-review` until B1 is resolved, because the closure arithmetic (N = 72) and the
triage action for eight rows depend on it.

## Resolution (author amendment, revision 5)

- **B1** — taken as remedy (a): T497's eight rows take `action: defer` with the no-asserting-site
  reason; the `test-update-workflow.ts` instruction is deleted from the plan and the blast radius.
  Closure is five rows and `N = 80`, one branch, no conditional.
- **M1** — D5 records the pre-edit counts `T493 1, T682 1, T541 2, T542 1` and names both files:
  `/tmp/c.md` before, the regenerated `corpus.md` after.
- **M2** — V3 regenerates to `/tmp/c2.md` and expects an empty diff against the committed corpus,
  plus "the five closed rows only" against the baseline.
- **M3** — V5 splits into `npm run test:ruleset-gates` (count +2) and `npm run test:all` (green).
- **M4** — the T541 red read is restated: the tampered case fails because `--root` is ignored and the
  real manifest is checked; the exit-0 half is vacuous until task 8; `ROOT`/`MANIFEST_PATH` move below
  argument parsing.
- **M5** — the Risk line names the guard per script; V4 adds the stale-version caller case because
  `version-check.ts` runs in no local gate.
- **N1–N4** — D2 pins the row template, the header and the `—` empty marker; T542 is described as
  asserting against the existing `--decisions` seam; the register rationale is narrowed to
  `Scheduled-roadmap` findings; the sidecar count is one above `wc -l` by its own convention.
- **N5** — recorded; the user authorized each additional pass.
