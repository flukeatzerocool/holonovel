# AAR — index.ts split, stage 1: `--repath` and the knowledge-tool cluster

AAR: SUCCESS-WITH-DEVIATIONS — the stage landed: `--repath` exists and is tested, the
knowledge cluster lives in `src/tools/knowledge.ts`, `index.ts` is 17,857 lines, and
`test:all` is 56/56 with no behavioural change. The plan's assumption that `--repath`
alone would carry the anchors was wrong, and the correction is recorded below.

## 1. What was supposed to happen

The plan (`plan.md`, revision 3) had nine done-bar clauses: a `--repath` flag with nine
self-test cases; `npm run fix-anchors` performing the repair; `index.ts:10323-11626`
moving verbatim into `holonovel/src/tools/knowledge.ts` behind a destructured
`ToolContext`; both typechecks clean; `test:all` 56/56; `check:fast` 46/46; registration
order unchanged; docs and registers agreeing; `aar.md` ending `LOOP PAUSED` in two
commits.

## 2. What happened

| Phase | Result | Evidence |
|---|---|---|
| P1 | baseline + probe | `check:fast` 46/46 PASS; `test:all` 56/56 (180.8 s); `check-anchors` `predicates current`; `index.ts` 19,156 lines |
| P2 | `--repath` | `test-anchor-tooling` 20 passed / 0 failed (nine CLI cases + 11 resolver assertions); unmodified-tree control `predicates current` |
| P3 | extraction | 1,304 lines moved; `index.ts` 17,856 → 17,857 with the import; `knowledge.ts` 1,343; `moved text matches: yes` |
| P4 | anchors + gates | 21 anchors relocated; `check --repath` `predicates current`; both typechecks clean; `test:all` 56/56 (179.0 s) |
| P5 | docs + close | CHANGELOG, root and server AGENTS.md, ROADMAP bullet, review-register row; `check:fast` 46/46 |

**Deviations.**

1. **The anchor repair needed a deterministic offset, not the flag.** The extraction
   removed 1,304 lines and inserted four, so every anchor below the cut was stale by
   1,299 lines — far outside the resolver's ±40 window. `--check --repath` reported 12
   `ambiguous` and eight that resolved to a *nearby wrong* occurrence of the same word
   (`recap` at 10857 → 10855, `verify`, `prompt`, `context_report`, …). Running
   `fix-anchors` at that point would have written those wrong lines and then
   self-validated them. The 21 anchors were relocated by the block's exact offset (the
   in-cut anchor mapped into the new module), then `fix-anchors` repaired the single
   off-by-one that the import insertion caused above the cut. Recorded as a project
   finding and scheduled on ROADMAP item 4.
2. **V10 needed two execution adjustments** the plan's snippet did not carry: the
   `BASE` value must be exported for the child process, and `git show` of a 19 k-line
   file exceeds `execSync`'s default 1 MB buffer. Run as
   `BASE=<commit-1> node -e '…'` with `maxBuffer: 64 MB`; result `moved text matches:
   yes`.
3. **`ToolContext` gained two type-only imports** (`DivergenceResult`,
   `ReinforcementEntry`) that the plan did not name; the ten value names are exactly
   those the plan measured.
4. **The five shared helpers are returned, not separately exported** (D5 said "export
   them"). A `typeof` interface over function-local declarations does not compile, so
   `registerKnowledgeTools` returns them and `index.ts` holds them on the const. Same
   property — one definition, no cycle — with a different mechanism.

## 3. What went right

- The cold pass earned its cost twice. Revision 1's `--repath` searched both source
  roots and would have refused the only live anchor; revision 2 pinned the search to
  the recorded file's root, which is what made the move decidable.
- The nine scratch-tree cases caught two of my own output-shape mistakes before the
  live tree was touched (the `-> 3` versus `-> path:3` rendering).
- `holonovel` `typecheck` was the whole dependency contract for the move: it named the
  ten-missing-name set and the two type imports and nothing else — the block really was
  closed under use.
- The verbatim check (V10) is stronger than a diff: it proves byte equality of 1,304
  moved lines modulo the four `register(` renames.

## 4. What went wrong

- **The plan assumed a flag covered a shift.** `--repath` answers "which file", not
  "which line after a 1,300-line move", and the tool's window resolution will happily
  pick a nearby wrong occurrence. Cost: one manual relocation pass and a new ROADMAP
  bullet.
- **V10's snippet was not executable as written** (two Majors over three review passes:
  the mutable `HEAD`, then the unexported `BASE`). The lesson is general: a verification
  snippet is code and needs the same "does it run" check as the change.
- **`test:all` twice plus two `check:fast` runs** consumed roughly 7 minutes of wall
  clock; the pre-commit hook re-runs `check:fast`, so the third run was redundant but is
  the house convention.

## 5. Session performance

- **Outcome vs done bar.** All nine clauses hold; one required a deviation (anchor
  relocation) that was disclosed, verified line by line, and scheduled.
- **Scope adherence.** No out-of-plan code. The relocation script and the extraction
  script live in `/tmp` and are described in the AAR rather than committed.
- **Verification quality.** Every new predicate has a negative probe in the harness (20
  assertions), the moved text is byte-checked, and the anchors were confirmed
  semantically (each recorded line carries its symbol, and the moved one is the
  description line).
- **Rework.** Three cold passes (one Blocker, six Majors, then two Majors, then one
  Major) — all mechanical after the first.
- **Cost.** Roughly 150 tool calls; ~4 minutes of `test:all`, ~2 minutes of `check:fast`.
- **User intervention.** One: "execute plan", then the item selection. No corrections.

## 6. Findings

- **F-1 — the anchor window cannot follow a block move (P2, demonstrated).** The
  predicate is `scripts/lib/anchor-resolver.ts:56-68` (±40 window) plus
  `scripts/refresh-predicates.ts:85` (any containing line self-validates). Eight anchors
  matched a nearby wrong line. Disposition: `Scheduled-roadmap` — ROADMAP item 4 gains
  the closing bullet, the register records the finding. This is the plan-review
  "false-positive budget" hazard in the tool rather than a check, and it is exactly the
  failure a later stage would hit again.
- **F-2 — a verification snippet is untested code (P2, informational).** V10 failed
  twice for shell plumbing, not for the property it checks. Disposition:
  `Closed-P3` — no product defect; recorded here so the next plan ships a snippet it has
  actually run.
- **F-3 — `check-anchors` cannot see a wrong line once written (informational).**
  Consequence of F-1's second predicate, not a separate defect. Disposition:
  `Closed-P3`, folded into F-1's scheduled bullet.

**Skill findings.** None new. The `changelog-before-commit` miss repeats (the
CHANGELOG entry was authored during the increment, as the AAR block, not by the skill);
SK-18/SK-24/SK-26 already cover it.

## 7. Invocation audit

| Expected | Loaded | Verdict |
|---|---|---|
| `programming-orchestrator` | yes | routed (Planned Change → Refactoring) |
| `plan-review` | yes | 3 revisions, cold passes r1/r2/r3 |
| `build-review` | yes | passed before the first edit |
| `after-action-report` | yes | this file |
| `changelog-before-commit` | no | miss; entry authored inline (SK-26) |
| `independent-review` (via subagent) | yes | 3 targeted passes |

Invocation: 6 expected, 5 loaded, 1 miss.

## Changelog entry

**Title:** index.ts split, stage 1: --repath and the knowledge-tool cluster

The entry is in `CHANGELOG.md` under the 2026-11-17 heading; it names the flag, the two
new modules, the anchor relocation, and the docs.

## Verification readings

| # | Command | Result |
|---|---|---|
| V1 | `npx tsx scripts/test-anchor-tooling.ts` | `20 passed, 0 failed` |
| V2 | `npx tsx scripts/refresh-predicates.ts --check --repath` | `predicates current` (unmodified tree and after the repair) |
| V3 | `npm run check-anchors` | `predicates current`, exit 0 |
| V4 | `wc -l` | `index.ts` 17,857 · `knowledge.ts` 1,343 |
| V5 | `npm --prefix holonovel run typecheck` | exit 0 |
| V6 | `npm run typecheck` | exit 0 |
| V7 | `npm --prefix holonovel run test:all` | `56 passed, 0 failed` (179.0 s) |
| V8 | `npm run check:fast` | `46 passed, 0 failed`, `check:fast: PASS` |
| V9 | `git log --oneline -2` · `git status --porcelain` | two commits · clean |
| V10 | verbatim check, `BASE` = commit 1 | `moved text matches: yes` |

LOOP PAUSED
