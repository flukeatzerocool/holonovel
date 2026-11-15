# Independent Review — U8 plan, cold artifact

Reviewer: review subagent (cold dispatch; no authoring context)
Plan sha256: dd7181a7afc54959fe33813272f70e382d2bc22641924bb26ebfe3d855b95e62
Artifact: `plans/2026-11-15-unscoped-u8.cold/plan.v1.1.md` (491 lines)
Repo: `/home/fluke/Holonovel` @ `eb686b5`
Depth: standard · reads ≈29/40 · stages 5/5 applied in one fresh context

Process deviation (recorded): the reviewer was spawned as a single cold context
with nesting forbidden, so the five `independent-review` stages were applied
within that one fresh context rather than in five fresh children. No authoring
conversation and no prior findings were present, so isolation holds on the point
that matters. The reviewer had no write capability; this file is the parent's
transcription of the returned report.

## Blockers (2)

1. **[design] V6b asserts a line position the stated removal does not produce.**
   V6b (`plan.v1.1.md:444`) requires `sed -n '15p' ROADMAP.md` to print "the
   synthesis heading" after 6.5 removes `ROADMAP.md:15-33` (`:393`).
   `ROADMAP.md:33` is the last line of the sweep section, `:34` is the blank
   separator, and `:35` is `## Synthesis-surface gaps (P1)`. Deleting 15–33
   leaves old `:34` (blank) at new `:15`, so the row prints an empty line, goes
   red, and (per `:418`) forces the K4 abort branch — while the done bar
   (`:489`) requires every V row to pass. Also yields a double blank line in a
   governance doc.
   *Must change:* either state the removal as `ROADMAP.md:15-34` (section plus
   its trailing blank) or change V6b to expect `:16`.

2. **[design] 6.5 writes U8's exit evidence at the wrong block.**
   `plan.v1.1.md:399` and the blast radius (`:426`) target `worklist.md:324-326`
   as "U8's `**Exit evidence:**` line". In
   `docs/plans/2026-11-10-unscoped-surface-review/worklist.md`, U8's exit
   evidence is `:314-316`; `:324-325` is the **per-chunk close protocol**, step
   5, shared by every chunk of the program (heading at `:318`). Executing as
   written rewrites the shared protocol with a U8-specific result line and
   leaves U8's exit evidence unamended.
   *Must change:* re-anchor both places to `:314-316`; keep `:98` for the status
   row (that one is correct).

## Majors (6)

3. **[design] The blast radius and the fix surface omit five reviewed files.**
   Rows R11–R16 (`:195-200`), R32 (`:221`), R56 (`:260`), R57 (`:261`) review
   root `AGENTS.md`, root `LICENSE`, `holonovel/LICENSE.md`,
   `docs/e5-world-pack-gap-report.md`, `docs/ruleset-index-phase0.md`. None
   appears in 6.2's fix list (`:369-378`) or in any blast-radius row
   (`:423-430`); the Read-only row lists `docs/upstream/` and `docs/licenses/`
   but not the two named docs, and does not list root `AGENTS.md` at all. Yet the
   verdict vocabulary (`:166-168`) says a bounded governance-prose fix "is fixed
   in 6.2", and V13 (`:452`) rejects "unintended files". A demonstrated defect in
   `AGENTS.md` has no legal destination short of `Scheduled-roadmap`.
   *Must change:* add these five to either the Prose fix row or the Read-only
   row, and say which.

4. **[design] 6.5b's citation sweep is overbroad and its count claim is false.**
   `:401-403` says "One exists today —
   `spec/audit/review-register.md:60`". `review-register.md:60` does cite
   `ROADMAP.md:30-31` (verified), but tracked docs also cite ROADMAP lines at
   `docs/plans/2026-11-15-unscoped-u7/aar.md:106` (`ROADMAP.md:30`),
   `docs/plans/2026-11-15-unscoped-u7/plan.md:14,64,102,146-149`, and older
   `docs/plans/2026-11-08-*` plans. "Re-confirm **every** citation into
   `ROADMAP.md`" therefore collides with `worklist.md:40` — "This program does
   not write another increment's `AAR`."
   *Must change:* scope the sweep to live governance surfaces, and correct "one
   exists today".

5. **[design] R35's finding class has no repair destination.**
   R35 (`:229`) requires every `Scheduled-roadmap` bullet to name a **live**
   ROADMAP section. `review-register.md:2979` schedules under "§ *§5.3
   prompt-health and resource-presence*" — a section `ROADMAP.md` does not
   contain (its `##` sections are `:15, :35, :50, :62, :72`). So R35 necessarily
   yields a DEFECT against existing prose, but 6.4 only *adds* bullets
   (`:385-392`) and 6.2's file list excludes `spec/audit/`. A row with no
   disposition risks `UNSET`, which done bar 1 (`:482`) forbids and the
   vocabulary permits only on the K4 branch (`:157`).
   *Must change:* state whether a stale register pointer is repaired in place
   (and add `spec/audit/review-register.md` prose to 6.2) or recorded as a new
   finding.

6. **[design] 6.3 names no regeneration writer.**
   `:379-382` says "regenerate only on drift" for `check-g7-attestation` and
   `check-markers`, but names neither writer. `check-markers` runs
   `cross-property-couple.ts --check` (`package.json:31`); the writer is
   `npm run refresh-properties` (`package.json:78`). `check-g7-attestation` runs
   `generate-g7-attestation.ts --check` (`package.json:59`); the writer is the
   same script without `--check`. Two options exist for the G7 writer and the
   plan picks neither.
   *Must change:* name both commands.

7. **[design] "45 passed" is still pinned in three places, contradicting F4 and
   V2.** F4 (`:40-42`) claims V2 now compares against the Phase 0 count, and V2's
   command column does (`:439`), but the same cell still parenthesises "(45 when
   drafted)", 6.3b hard-codes "It must print … `45 passed, 0 failed`" (`:384`),
   and done bar 4 hard-codes `45 passed, 0 failed` (`:488`). Phase 0 pins HEAD
   (`:269-270`), so the count is in practice stable, but three sources of truth
   remain and the fix F4 declares is only one-third applied.
   *Must change:* make 6.3b and done bar 4 reference the Phase 0 baseline count.

8. **[design] The preflight evidence does not describe this artifact's write
   set.** `evidence.md` records `Plan: plans/2026-11-15-unscoped-u8/plan.md` — a
   path that does not exist (the artifact is `…u8.cold/plan.v1.1.md`) — "Plan
   lines: 492" against 491, a `Targets` table of 8 paths that omits root
   `AGENTS.md`, root `package.json`, `holonovel/DECISIONS.md`,
   `holonovel/NOTICE.md`, `holonovel/Dockerfile`, `LICENSE`,
   `holonovel/LICENSE.md` and the new `review.md`, an `Absolute paths` row for a
   phantom `/review.md` (Expanded `/review.md`, Exists false), and `Unknowns:
   none`. The sha256 does match (verified), so the bytes are right; the target
   enumeration and the unresolved path are not.
   *Must change:* re-run preflight against the artifact's real path before
   stamping, and resolve the `/review.md` expansion.

## Nits (9)

9. **R24 self-contradiction** — "all 37 names and their action lists, sampled at
   stride 5" (`:213`): it cannot be both exhaustive and sampled.
10. **R44 anchor is short** — `ROADMAP.md:1-70` (`:238`) excludes `## Non-goals`
    at `:72-74`, which 6.6/V6 require that row's owner to verify.
11. **R31's range description overlaps R30** — `:1372-2906` "dated entries"
    (`:220`) contains `## Gate classification (REQ-137a)` at
    `holonovel/DECISIONS.md:1491` and `## Configuration classification
    (REQ-388c)` at `:1559`, which R30 owns (`:219`). Harmless if R31 enumerates
    dated entries as units, misleading as written.
12. **Row-per-command mismatch** — the table says "each with its exit status
    captured" (`:434`) but V8, V10 and V12 each bundle two commands into one row
    (`:446-451`), so one status covers two exit codes.
13. **`## Done bar` is the wrong shape for the artifact contract** —
    `scripts/lib/loop-artifacts.ts:92-98` looks for a `**Done bar:**` line; a
    heading yields a warning on every `check-loop-artifacts` run (V4 still exits
    0, and `check:fast` still reports PASS).
14. **6.4 does not say how multiple dispositions are laid out** — `:385-389`
    prescribes one `### 2026-11-15 …` topic heading "under the bucket that
    matches the disposition"; an increment with `Resolved` + `Scheduled-roadmap`
    + `Closed-P3` findings needs one heading per bucket (`register-checks.ts:31-35`
    keys the section off `## `).
15. **V11/V11b mechanics** — the pipe ban (`:434`) cannot apply to a
    `comm … <(…|…|…)` process substitution; and V11b's "at least 1" (`:450`) is
    an unstated assumption that at least one DEFECT exists (safe here only
    because EV8's 36/37 drift is already confirmed at `holonovel/README.md:57`).
16. **6.7 omits the heading contract** — `session-close` requires
    `## <YYYY-MM-DD> — <title>` with the date equal to the session date, else
    exit 1 (`scripts/session-close.ts:246-257`); `:409-415` states only "dated
    section at the top" and the anchor `CHANGELOG.md:3`, a fact otherwise
    correct.
17. **Phase 0 step 6 misstates the second arm** — `:284-286` says "the commit
    count since `2026-11-15`"; `ROADMAP.md:52-59` gives the date `2026-11-28`
    and "26 new commits", with a 2026-11-08→14 baseline. No 2026-11-15 anchor
    exists in that section. (The conclusion — neither arm met — is unaffected.)

## What checked out (verified against the tree)

- Root `AGENTS.md` section map matches EV9 exactly (`:3,11,19,119,186,209,285,391,467,511`), so R11–R16's ranges all resolve.
- `holonovel/AGENTS.md` ranges R23–R27 and `holonovel/README.md` ranges R19–R22 both land on real `##` headings (`holonovel/README.md:11,15,28,41,55,73,90,99`); EV8's `:57` sits inside R20's `41-72`.
- Register buckets: `## Scheduled-roadmap` `:2919`, `## Closed-P3` `:2991`, `## Deferred-by-user` `:3443`, file ends `:3449` — R35/R36/R37's three ranges are exact and non-overlapping.
- `review-register.md:60` really does cite `ROADMAP.md:30-31`; `:2927-2938` is U7-F4.
- `package.json:7` is `markdownlint holonovel.md README.md` — the "two server docs are ungated" premise is correct, as is F2's fix.
- Fast-gate count: the generated table in `AGENTS.md` has exactly **45** `fast: yes` rows, matching EV2.
- Every command V1–V13 and the phases name exists in `package.json:7-97` and `holonovel/package.json:114`; `check:vendor` already carries `--strict`, so Phase 4 step 1 is right.
- `check-loop-artifacts` accepts a `LOOP OPEN` stub (`check-loop-artifacts.ts:33` passes no options; `loop-artifacts.ts:81-91` errors only under `requirePausedFor`) — Phase 0 step 4's legality argument is sound, and `session-close` supplies the `requirePausedFor` (`session-close.ts:263`).
- `check-roadmap`'s caps (3 bullets, 3 pointer lines, REQ-citing Non-goals) are at `scripts/check-roadmap.ts:23-25,32-36`; after removal the three survivors (Synthesis 3 bullets, loop-gate 1, vendor 1) are all admissible, and `## Non-goals` is exactly 3 lines (`ROADMAP.md:72-74`).
- **ROADMAP removal safety (question c):** safe. No `Scheduled-roadmap` bullet names the sweep section — the only three "Scheduled under `ROADMAP.md` § …" lead-ins are `:2923, :2940, :2979`, naming surviving sections (or the dead §5.3, see Major 5); `worklist.md` carries no ROADMAP line citations; a repo-wide search finds the sweep title only in `ROADMAP.md:15` and historical plan artifacts. Register bullet `:60` is the one live line citation, and 6.5b handles it.
- **One session (question e):** achievable on precedent — U6 ran 66 rows and U7 67 (`worklist.md:96-97`) against U8's 60.

## Unknowns

- EV2, EV6, EV8, EV17, EV25, EV26 are `tool-output` premises; no gate was run by the reviewer. The 45-row count is corroborated by counting the manifest table; the rest are unchecked.
- EV6's "58 retired aliases and zero live names" is a strange premise for a bare-tool-name ban and would itself be a finding; `validate-readme.ts` was not read to test it.
- `req-coverage.md` freshness and the 125-undated baseline are unverified.
- Inherited instructions: the reviewer's context carried this repository's `AGENTS.md` and user-level search/general instructions; no authoring conversation or prior findings were present.

## Verdict

`independent-review FAILED.` 2 Blockers, 6 Majors, 9 Nits. Comprehension:
faithful-with-gaps.

## Delta re-review (v1.1 → v1.2)

Reviewed: the 313-line diff only (budget 10 reads, 9 used). Result:

- Resolved: 15 of 17 (Blockers 1–2, Majors 3–7, Nits 9–17).
- Not resolved: **Major 8** — R8 promised a preflight re-run but no artifact text
  changed; the re-run is parent-side, so the verdict rests on plan text alone.
- New defects: **N1 [Major]** the R35 conditional section would make V6b's
  `^## ` count 5 and fail the row; **N2 [Major]** the G7 writer also rewrites
  `holonovel/src/generated/g7-attestation.ts`, which the blast radius called
  Unchanged; **N3 [Nit]** the added-section branch omitted the mandatory
  `**Trigger:**`; **N4 [Nit]** R7's "only EV2 records 45" was false (V2 names
  it); **N5 [Nit]** 6.2 and 6.5b could both rewrite the same register bullet;
  **N6 [Nit]** R4's narrative contradicted its own operative text.

`independent-review FAILED.` — 2 Majors, 4 Nits, all parent-applied as D1–D6.

## Post-delta application (v1.3)

D1–D6 are applied and the parent re-ran preflight against the revised artifact
with the full target list. The stamp records the delta report's hash and 5
stages.
