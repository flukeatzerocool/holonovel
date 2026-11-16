# Tasks — Roadmap drain 2: items 3 and 6 close, item 4 chunk 1

A task is done when its check passes, not when the edit lands. Re-grep every
`file:line` immediately before editing it (current HEAD moves between phases).

| # | Task | Depends on | Check |
|---|---|---|---|
| A1 | Run `git log --since=2026-11-14 --format='%H|%ct|%s' --name-only`; pair consecutive commits ≤15 min apart and count pairs sharing a touched path | — | Recorded numbers: 52 commits, 19 pairs, 7 sharing at `349e05f`; met = ≤7 of 26 |
| A2 | Record window, pairs, sharing, and the rate verdict in a skeleton `aar.md` ending `LOOP OPEN` (required by the strict full gate in D4); delete the ROADMAP section either way — a regression adds a dated diagnosis item | A1 | `npm run check-roadmap` PASS; `check-loop-artifacts` (strict) PASS |
| B1 | New `scripts/lib/changelog-entry.ts`: `parseChangelogEntry`, `renderChangelogEntry`; pure, no `fs`, no clock | — | `npm run typecheck` |
| B2 | `scripts/session-close.ts`: the block owns its session's entry and is written once (byte-identical heading = no-op); malformed exits 1 naming the file; absent warns; an omitted `--increment` with two increments on one date is refused; `workingPaths()`/`planCommits` move below `check:fast` and the write precedes them | B1 | A **scratch** increment's `session:close --dry-run` prints the entry; malformed exits 1; absent warns; ambiguous date refused |
| B3 | Cases in `scripts/test-commit-plan.ts`: render, idempotence, parse acceptance, malformed variants rejected, absent, subject passes the hook | B1, B2 | `npm run test:commit-plan` |
| B4 | `docs/plans/README.md:47-54`: step 7a points at the AAR block; route the AAR skill template edit through `skill-improvement-loop` (C-1 if declined) | B2 | README step 7a names the block; SK record or accepted edit |
| B5 | Generate this increment's entry through the close, not by hand | B2, B3 | CHANGELOG heading matches the AAR title; a second close is a no-op |
| C1 | New `scripts/lib/loop-bounds.ts`: `readBaseline(path)` (absent → empty exemptions + warning; unparseable → error) and `artifactOverage` over `{ since, exempt }` | — | `npm run typecheck` |
| C2 | `scripts/loop-audit.ts`: `readIncrements` returns `planLines`/`aarLines`; metrics field; "Artifact bounds" section; `checkThresholds` problem per non-exempt overage dated ≥ `since`, and per unreadable baseline | C1 | `npm run loop-audit -- --check` exit 0 |
| C3 | New `spec/audit/loop-artifact-baseline.json`: `since: 2026-11-16`, exempt = the four 2026-11-16 predecessors | C1 | `for d in docs/plans/*/; do … wc -l …; done` reports 109 oversized (4 exempt, 105 pre-`since`) |
| C4 | Cases in `scripts/test-loop-artifacts.ts`: over-limit plan, over-limit AAR, exempt, before-`since`, exactly-at-limit, absent baseline, unreadable baseline | C1, C2 | `npm run test:loop-artifacts` |
| C5 | `scripts/weekly.ts:38` gains `--check` | C2, C3 | `npm run weekly -- --dry-run` shows the new argv |
| C6 | Error-gate dry run: a scratch non-exempt oversized increment fails; this tree passes | C2–C5 | Exit 1 for the scratch tree, exit 0 for the repo |
| D1 | Regenerate the corpus to a temp path; `diff` against `corpus.md` | — | Empty diff (122 rows) |
| D2 | Triage the 23 rows below: `document` (row is right) or `re-cite` (row does not fit) | D1 | Every row carries one verdict in this file |
| D3 | Add `## Manual verification procedures — 2026-11-16` to `holonovel/DECISIONS.md`: per T-ID, the Appendix F row, the actor and precondition, and the record the operator keeps | D2 | All 14 T-IDs named once; each entry names a row and a record |
| D4 | Re-cite proven-wrong rows in `spec/02-requirements.md`; `npm run assemble`; `npm run build-order` only when the skeleton `aar.md` exists | D2, D3 | `check-fingerprint-sync`; `validate` 0 errors |
| D5 | Regenerate `corpus.md` with `npm run validate -- --write-linkage-corpus <path>` | D3, D4 | 99 rows; 0 `manual-undocumented` |
| D6 | Update the Scheduled-roadmap entry at `spec/audit/review-register.md:3085-3095` with chunk 1 of 3, and amend the stale "stays scheduled" sentence at `:3069-3073` | D5 | `npm run check-registers` |
| E1 | Retire ROADMAP 3 and 6; set item 4's count to 99 with its trigger; leave 1/2/5/7 | A2, D5 | `check-roadmap` PASS |
| E2 | AAR: findings, disposition table with trigger evidence, `## Changelog entry` | A2, D6 | `check-loop-artifacts` |
| E3 | `npm run session:close` (one commit if a REQ body changed, else two: `scripts → docs`) | E1, E2 | Fast gate PASS; clean tree; one commit or the stated two |

## Phase D triage — 23 `manual-undocumented` citations

| REQ | T-ID | Verdict | Note |
|---|---|---|---|
| REQ-002 | T18 | document | |
| REQ-013 | T33 | document | |
| REQ-017 | T28 | document | |
| REQ-020b | T3 | document | |
| REQ-020b | T33 | document | |
| REQ-020b | T5 | document | |
| REQ-021 | T3 | document | |
| REQ-023b | T28 | document | |
| REQ-024a | T3 | document | |
| REQ-024b | T3 | document | |
| REQ-024b | T49 | document | |
| REQ-025c | T93 | document | |
| REQ-032b | T18 | document | |
| REQ-056 | T38 | document | |
| REQ-063c | T49 | document | |
| REQ-064f | T51 | document | |
| REQ-070b | T223 | document | |
| REQ-089d | T74 | document | |
| REQ-099 | T86 | document | |
| REQ-101c | T89 | document | |
| REQ-102c | T93 | document | |
| REQ-148 | T183 | document | |
| REQ-184b | T223 | document | |

## Notes

- All 23 triage rows are `document`: Appendix F's REQ column or the procedure
  text matches the citing REQ, so no `_Check:_` citation was re-cited and Phase D
  touched no spec source. `T3`'s row omits `REQ-020b` from its REQ column, but its
  registry-completeness procedure is the check that REQ-020b (the `tools/list`
  minimum set) needs.
- No new npm script: helper cases ride `test:commit-plan` and `test:loop-artifacts`.
- The corpus path is a repo path; `docs/plans/2026-11-15-req-evidence-linkage/corpus.md`
  is the committed copy.
- `## Changelog entry` block shape: `**Title:**` (one line, no date, ≤100 chars),
  `**Summary:**` (one paragraph), then 1–8 `- ` bullets.
- If a regeneration number differs from this file, stop and amend the plan; do not
  adopt it silently.
