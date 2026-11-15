# Tasks — Badge guidance renderers from live synthesis state (U6-F6)

Dependency-ordered. A task is done when its verification line passes; tasks in one phase
may run in any order unless a dependency is named.

File flow: the working draft lives in the gitignored `plans/2026-11-15-synthesis-badge-guidance/`.
Task 1 copies it to the tracked increment directory together with an `aar.md` placeholder,
because `check-loop-artifacts` errors on a `docs/plans/` directory without an AAR
(`scripts/lib/loop-artifacts.ts:67-75`). The placeholder ends `LOOP OPEN`; task 41 replaces
it with the real AAR before `session:close`.

## Phase 0 — preconditions

| # | Task | Verification |
|---|---|---|
| 1 | Create `docs/plans/2026-11-15-synthesis-badge-guidance/` with `plan.md`, `tasks.md`, and an `aar.md` placeholder ending `LOOP OPEN` | `ls docs/plans/2026-11-15-synthesis-badge-guidance`; `npm run check-loop-artifacts` → PASS |
| 2 | Confirm clean tree and record HEAD | `git status --porcelain` empty; `git rev-parse --short HEAD` |
| 3 | Fast-gate baseline | `npm run check:fast` → `45 passed, 0 failed`, `PASS` |
| 4 | Confirm the gap: no `voice`/`tone` guidance registration | `grep -n 'guidance:.*/\(voice\|tone\)' holonovel/src/index.ts` → no match |
| 5 | Confirm no harness asserts these URIs | `grep -rn 'guidance://[a-z_]*/\(voice\|tone\)' holonovel/scripts` → no match |
| 6 | Widened sibling-contract probe: no REQ names a third module or other tag, and REQ-022a's parenthetical is the only catalogue enumeration | `grep -n 'guidance://\|badge-specific guidance\|foundations, anti-slop' spec/02-requirements.md spec/04-runtime.md spec/08-synthesis.md` |
| 7 | Record live resource and template counts | `npm --prefix holonovel run test:tool-surface`; write both counts here |
| 8 | Fingerprint state before the spec edit | `npm run check-fingerprint-sync` → PASS (§5.1 is outside `DATA_SECTIONS`) |
| 9 | Manifest-null probe: `wisdomManifest` is null on a fresh boot; the vendor tier is `withWisdomKeys(DEFAULT_WISDOM).narrative_voices` | `grep -n 'wisdomManifest' holonovel/src/core/state.ts`; `grep -n 'withWisdomKeys' holonovel/src/index.ts holonovel/src/core/wisdom.ts` |
| 10 | New test ID is free | `grep -c '\| T791' spec/appendices-reference.md` → `0`; highest defined ID is `T790` |

## Phase 1 — render helpers (`holonovel/src/index.ts`)

| # | Task | Depends | Verification |
|---|---|---|---|
| 11 | `guidanceVoiceItems(viewBadge)`: manifest items, else `withWisdomKeys(DEFAULT_WISDOM).narrative_voices`; then the view filter `badge_scope === viewBadge || badge_scope === "shared"`; then `provenanceTag`; stable sort by confidence rank, name, key | 9 | `npm --prefix holonovel run build` |
| 12 | `canSeeGuidanceItem(item, callerBadge)`: parameterised mirror of `badgeCanSeeWisdom`, no global-state read | 11 | build |
| 13 | `guidanceToneItems(viewBadge)`: ruleset lines from `composeNarrativeTone(promptInputsFor(activeNovel))` (prefix stripped into `text`, `anchor: null`, `confidence: "HIGH"`, `provenance` from `provenanceTag({ tag: "ruleset" })`); synthesis items filtered on `category === "narrative-tone"` through the view/caller predicates | 12 | build |
| 14 | Payload fields complete: voice carries `key`, `name`, `media_title`, `media_type`, `source`, `description`, `confidence`, `provenance`; tone carries `text`, `anchor`, `confidence`, `provenance` | 13 | source read against EV25/EV2 |
| 15 | Pure reads only (no mutation, no writes); no audit entry owed (REQ-040a covers mutations) | 13 | source read |
| 16 | Markdown shape: H1 with badge name; `## Ruleset Wisdom` then `## Synthesis`; tone items emitted as `[narrative-tone] <provenance> <text>` (tag retained); empty views render `(no <kind> — module empty)` | 14 | Phase 4 output inspected once |

## Phase 2 — registrations

| # | Task | Depends | Verification |
|---|---|---|---|
| 17 | Register `guidance-player-voice` → `guidance://player/voice` | 16 | `resources/list` includes it |
| 18 | Register `guidance-gm-voice` → `guidance://game_master/voice` | 17 | `resources/list` includes it |
| 19 | Register `guidance-player-tone` → `guidance://player/tone` | 18 | `resources/list` includes it |
| 20 | Register `guidance-gm-tone` → `guidance://game_master/tone` | 19 | `resources/list` includes it |
| 21 | Each handler passes the URI badge as `viewBadge` and filters with `canSeeGuidanceItem(item, getBadge())` (DP-3, Rev3); place the block directly after the foundations registrations | 20 | source read |

## Phase 3 — catalogue and counts

| # | Task | Depends | Verification |
|---|---|---|---|
| 22 | Add `guidance://{badge}/voice` and `guidance://{badge}/tone` to `REQ022_URI_CATALOG` after the foundations row | 21 | presence report shows both `present` |
| 23 | Update `holonovel/AGENTS.md:46` with the **measured** counts from task 7 plus the new registrations | 22 | counts equal the live list lengths |
| 24 | No `RESOURCE_GATE` edit; no `surface-budget --write`; no tool-definition regeneration | 22 | `npm run surface-budget` and `npm run check-tool-definitions-sync` both pass unchanged |

## Phase 4 — harness assertion

| # | Task | Depends | Verification |
|---|---|---|---|
| 25 | Add the block labelled `"T791/REQ-071: badge guidance renders live synthesis state"` to `holonovel/scripts/test-output-contracts.ts` beside T223 | 24 | `npm --prefix holonovel run test:output-contracts` |
| 26 | Assert 1: on a default boot both tone URIs contain a `[narrative-tone]` line, tag intact | 25 | test output |
| 27 | Assert 2: GM voice view carries the shipped vendor profile with `[vendor]`; Player voice view carries the empty marker and not the profile name (C-4: the empty marker is asserted, not skipped) | 25 | test output |
| 28 | Assert 3: after `manage_synthesis (action: run)`, the GM voice view still carries the vendor profile and reflects the post-run manifest; if the ruleset-free projection adds nothing, assert only survival and record the reduced coverage here | 25 | test output + note in this file |
| 29 | Assert 4: every rendered item carries a non-empty `provenance` (ruleset tone items the literal `[ruleset]`); `anchor` asserted for synthesis tone items only (C-1); both catalog templates report `present`; Player `resources/list` omits `guidance://game_master/voice` | 25 | test output |

## Phase 5 — spec edit, assembly, register regeneration

| # | Task | Depends | Verification |
|---|---|---|---|
| 30 | REQ-022a: add `voice` to the guidance parenthetical | 29 | `npm run validate:sdd` no new error; body stays within its sentence budget |
| 31 | REQ-071b: `_Check: T26` → `_Check: T26, T791` | 30 | `npm run validate:sdd` no new error |
| 32 | Appendix F: add `T791` (Automated) after `T790`, naming both URIs, live synthesis, the badge filter, the LOW inheritance, the empty-marker case; REQ column `REQ-071` | 31 | `npm run validate` test-ID checks pass |
| 33 | `npm run assemble` | 32 | `git diff --stat` shows only the expected generated files |
| 34 | `npm run validate -- --write-register` | 33 | REQ-071 row reads `T26, T791` |
| 35 | `npm run build-order` | 34 | no fingerprint drift; no new `WARNING:` |

## Phase 6 — records and close

| # | Task | Depends | Verification |
|---|---|---|---|
| 36 | `spec/audit/review-register.md`: U6-F6 → `Resolved`, stating the predicate holds **and** that the scheduling rationale (REQ-429/REQ-571, "both templates") was wrong | 29 | `npm run check-registers` |
| 37 | `ROADMAP.md`: remove the badge-guidance section | 36 | `npm run check-roadmap` |
| 38 | `holonovel/DECISIONS.md`: dated entry — four resources, two templates, DP-2 fallback through `withWisdomKeys`, DP-3 empty Player view, DP-7 tag retention, the ruleset tone branch's `anchor: null` deviation (C-1), and REQ-429/571 untouched | 36 | `npm run check-traceability` |
| 39 | `CHANGELOG.md`: dated entry equal to the session date | 38 | top heading date matches the session |
| 40 | Full suite: `npm run test:all` | 39 | 0 failures |
| 41 | Replace the `LOOP OPEN` placeholder `aar.md` with the real AAR ending `LOOP PAUSED` | 40 | `npm run check-loop-artifacts` → PASS |
| 42 | `npm run assemble && npm run check:fast`, then `npm run session:close` (fast gate runs last, with a complete increment directory) | 41 | trailing `check:fast: PASS`; one commit |

## Build conditions (from the plan gate)

C-1…C-4 in `plan.md` are build-review's checklist: the ruleset anchor deviation is recorded
(task 38), the `[ruleset]` literal is asserted (task 29), the fallback sorts after
`withWisdomKeys` (task 11), and the Player empty marker is asserted rather than skipped
(task 27).

## Execution log

- Task 7 (measured counts): live at HEAD `822228f` **43 resources / 23 templates**
  (documented 40 / 22 — pre-existing drift, see amendment A-2). After the change:
  **47 resources / 23 templates**.
- Task 27 (assert 3, live synthesis): asserted as "the vendor tier survives a synthesis
  run" — a ruleset-free projection adds no `narrative_voices` item, so the reduced
  coverage is recorded here as the task allowed.
- Task 8/34: `npm run check-fingerprint-sync` clean before and after the §5.1 edits.
- Deviations: amendments A-1…A-4 in `plan.md` (three generated/derived files plus the
  stale-count correction), all covered by the re-stamped plan and its conditions.
