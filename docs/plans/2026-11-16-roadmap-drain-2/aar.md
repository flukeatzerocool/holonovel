# After-action report — Roadmap drain 2, 2026-11-16

AAR: MET — items 3 and 6 retired, item 4 chunk 1 landed, the gates are green, and
the three execution deviations were each caught and either fixed in-session or
dispositioned. One plan assumption (one session per date) was wrong and forced an
amended guard.

## 1. What was supposed to happen

Close ROADMAP 3 (fix-up rate) and 6 (AAR-authored CHANGELOG block plus a measured
artifact bound), and take item 4 chunk 1 (the 23 `manual-undocumented` citations).
Bar: 99/0 linkage counts; the close derives its own entry; `loop-audit --check`
passes with the bound active; `check:fast` PASS; ROADMAP 3 and 6 gone.

## 2. What happened

| Phase | Outcome |
|---|---|
| A | Pairing at HEAD `349e05f`: 52 commits, 19 pairs ≤15 min, 7 sharing = 36.8% vs the 57.7% baseline and the 26.9% target. Improved, not met; recorded, section retired (close condition is the record). |
| B | `scripts/lib/changelog-entry.ts` (parse/render/prepend) and the `session-close` rewrite; 11 new cases in `test:commit-plan` (34 pass). Scratch increment proves derivation; malformed exits 1; absent warns. README step 7a and a "The Changelog entry" section. |
| C | `scripts/lib/loop-bounds.ts`, `loop-audit` counts/section/`--check`, the baseline JSON, `weekly --check --write`, 9 new cases in `test-loop-artifacts`. Red test: a scratch 153-line plan exits 1; restoring exits 0. |
| D | Corpus regenerated to a temp path and diffed against the 122-row baseline (identical); all 23 rows triaged `document`; 14 T-IDs documented in `holonovel/DECISIONS.md`; corpus now 99 rows, 0 `manual-undocumented`; register entry updated. |
| E | ROADMAP 3 and 6 retired, item 4 set to 99; register's stale "stays scheduled" sentence amended; this AAR; close. |

Deviations, all recorded rather than improvised:

- **The plan assumed one session per date.** `CHANGELOG.md` already holds two
  `## 2026-11-16 —` entries, so "an existing heading wins and must match the AAR
  title" would have blocked this close forever. The block now owns its session's
  entry, written once; a same-date heading from another session is not a conflict.
  Delta-reviewed (`independent-review passed.`).
- **The default increment target was wrong for this date.** `session-close`
  defaulted to `increments.at(-1)`, which is alphabetical, selecting
  `2026-11-16-torre-readiness`. The amendment refuses an omitted `--increment`
  when two increments share the session date, listing the candidates.
- **`spec/audit/loop-audit.md` was regenerated but absent from the blast radius.**
  A consequence of the `loop-audit` change, regenerated with `--write`. The
  omission is recorded here; the plan table named the script, not its snapshot.

### Gate outcomes

| Gate | Token | Verdict |
|---|---|---|
| plan-review | `plan-review passed.` (fresh, standard) | passed; 0 Blockers, 4 Majors, 6 Nits |
| independent-review (cold) | `independent-review passed.` 5/5 stages | pass with conditions M1–M4, all resolved |
| independent-review (delta) | `independent-review passed.` | pass on the amended guard |
| build-review | `build-review passed.` | pass (sequence note in F3) |
| test:commit-plan | 34 passed | pass |
| test:loop-artifacts | 22 passed | pass |
| loop-audit --check | exit 0; scratch oversized plan exit 1 | pass |
| validate linkage | 99 findings, 0 manual-undocumented | pass |
| check:fast | 46 gates, `check:fast: PASS` | pass |

## 3. What went right

- The cold pass found a real unreachability defect (M1: the date guard fired
  before any derivation), not style. Fixing it required moving the write ahead
  of `workingPaths()`, which the plan now states.
- The bound was exercised against itself: the amended plan hit 153 lines and
  `loop-audit --check` failed on it, which is why it was trimmed back to 150.
- The corpus diff before the edit proved the 122-row baseline rather than
  trusting the committed copy.

## 4. What went wrong

- **`build-review passed.` was emitted after Phase A's first two edits.** The gate
  checks had run; the contract line came late. Nothing shipped wrong.
- **The one-session-per-date assumption survived a five-stage cold pass.** It was
  unobservable from the artifact alone and only surfaced at execution.
- **Three plan rewrites for line count**; the new bound's `--check` caught each.

## 5. Session performance

- **Outcome vs done bar:** met. Item 3 recorded; the close derives an entry (and
  will write this one); `loop-audit --check` green with the bound active; 99/0
  linkage counts; `check:fast` PASS.
- **Verification quality:** the scratch-increment runs are the checks that can
  fail for the designed reason (malformed block, oversized plan, ambiguous
  date). The rest are suites.
- **Rework:** one guard redesign (F1), one ordering fix (F3), three line-count
  trims.

## 6. Findings

| ID | Finding | Class | Disposition |
|---|---|---|---|
| F1 | The plan assumed one session per date; the CHANGELOG holds several | project | **Fixed in-session** — block-owned entry + ambiguity refusal; delta-reviewed |
| F2 | `spec/audit/loop-audit.md` missing from the blast radius | project | **Fixed in-session** — regenerated; recorded here |
| F3 | `build-review` contract emitted after the first two edits | skill (invocation) | **Record-and-close** — SK-21 already tracks the load gap; ordering note added here |
| F4 | The AAR skill has no `## Changelog entry` section | skill | **SK-25** appended to the register; README is the in-repo authority (plan C-1) |
| F5 | Plan hit the new bound twice while being amended | project | **Record-and-close** — the gate caught it and the plan was trimmed |
| F6 | Plan predicted a two-commit split; `spec/audit/*` makes it a spec increment | project | **Fixed in-session** — one commit (`--single` semantics) |

No open project action items. Item 4 chunks 2–3 stay on ROADMAP; item 1 waits on
a publish (135 commits unpushed at session start).

## Changelog entry

**Title:** Roadmap drain 2: the close writes its own changelog, artifacts get a bound

**Summary:** Two ROADMAP items retired and the first chunk of the P1 evidence
work landed. `session:close` now derives the dated CHANGELOG block from the
increment's AAR, `loop-audit` measures a plan/AAR line bound and `--check`
enforces it, and the 23 undocumented Manual Appendix F citations are recorded in
`DECISIONS.md`, cutting the evidence-linkage list from 122 to 99.

- `session:close` renders the CHANGELOG entry from a `## Changelog entry` block in
  the AAR, writes it once after the gates pass, refuses a malformed block, warns
  on an absent one, and refuses an ambiguous same-date increment (item 6).
- `scripts/lib/loop-bounds.ts` and `loop-audit` measure plan ≤150 / AAR ≤120 lines
  from a `since` date; an unreadable baseline is an error and `weekly --check`
  runs it (item 6).
- The fix-up rate was re-measured early: 52 commits, 19 pairs ≤15 minutes, 7
  sharing (36.8% vs 57.7% baseline, 26.9% target) — improved, recorded, section
  retired (ROADMAP item 3).
- The 14 T-IDs behind the 23 `manual-undocumented` citations are documented in
  `holonovel/DECISIONS.md` § "Manual verification procedures — 2026-11-16";
  the corpus is 99 findings with none manual (ROADMAP item 4, chunk 1 of 3).

LOOP PAUSED
