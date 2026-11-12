# AAR — §5.9/§5.19 persistence remediation

Status: complete · Increment:
`docs/plans/2026-11-12-5-9-5-19-persistence-remediation/`
Plan: `plan.md` (sha256 `495c13dd…`) · Delta: `delta-1.md`

## Phase 0 — baseline

- `npm run status`: version 2026.11.11, 57 unpushed commits, 13 open roadmap
  items, last publish 2026-11-09. Tree clean.
- `npm run check:fast`: 40 passed, 0 failed, `check:fast: PASS`.
- `test:persistence-guardrails`: 17 passed, 0 failed.
- `test:persistence`: 45 passed, 0 failed.
- Target section: `ROADMAP.md:15-32`; findings F-P4-2…F-P4-9 at
  `spec/audit/review-register.md:1831-1880` (under `## Scheduled-roadmap`).

## Phases 1–4 — implementation and red evidence

Predicate re-anchoring confirmed the register's line numbers had drifted
(`state.ts:1736` is `resolveEntity`); all edits used symbol anchors.

- **F-P4-2:** `archiveNovel` refuses when the archive target or a backup
  destination exists (`state.ts:1872-1893`). Red evidence: the first harness
  run archived over the existing copy and the follow-up test exposed the
  correct collision semantics (unarchive is blocked when a live same-slug file
  exists; the message now names rename).
- **F-P4-3:** `advanceCombat` appends a `moment` via `appendStoryMoment`
  (`state.ts:2496`). Red evidence: `before 0, after 0` in the first combat
  case, then the fixture was corrected (init rejects unknown participants).
- **F-P4-4:** `markCorrupt` (`state.ts:2633`) records `corrupted_detail` and a
  stderr line; `data_health.markers` carries `[corrupted-novel]`. Four call
  sites. Red evidence: the existing T175 asserted only
  `data_health.corrupted` keys.
- **F-P4-5:** `NOVEL_FORMAT_VERSION`, `NovelState.format_version`,
  `migrateNovelFormat` (`state.ts:1758`), the load return shape, the
  `RESERVED_FUTURE_FIELDS` entry, and the export-manifest constant. Red
  evidence: the pre-fix on-disk Novel had no `novel_format_version` (probe
  recorded in the plan's Phase 1); the v1/v3 fixtures were unhandled.
- **F-P4-6:** `GMContext.saved_beats` accumulated in `recordContextSave`,
  cleared in `recordMutation`, rendered by `stateDriftWarning`
  (`index.ts:12611`). Red evidence: recap at the baseline printed only the
  generic sentence.
- **F-P4-7:** `PERSISTENCE_CATEGORY_TOKENS` feeds the directive and the
  REQ-407 list (`index.ts:15347`). Red evidence: the old directive named six
  families and none of the eight omitted categories.
- **F-P4-8:** the restore branch calls `checkWorkflowStaleness`
  (`state.ts:1431`). Red evidence: the restore-staleness case saw
  `connections` stay at 1 pre-fix (the assertion was written for `>= 2`).
- **F-P4-9:** T470/T471/T475 widened; T77/T381 catalogue rows widened with
  exercising cases. Red evidence: the baseline harness failed T475 on the
  audit gap while the fixture's raw primary carried 2 entries (migration
  audit) — fixed by computing the regression before the loader runs.

**Delta 1 (`delta-1.md`, in-scope Phase-4 finding).** The T469 budget leg
showed `### State persistence`, `### State_ledger`, and
`### Persistence tools` were all truncated at `TTRPG_MAX_BRIEFING_TOKENS=200`,
violating REQ-400/401/407. `NEVER_TRUNCATED` (`index.ts:3174`) gained the three
headers. Before: `[truncated — full content: guidance://state-persistence]`.
After: the sections render in full.

**Deviation recorded.** Red-first was observed for T475, the T469 budget leg,
and several live behaviours, but the T470/T471 clauses and some format cases
were added after their code fix (the harness was written in one pass). Those
assertions are verified green, not red-proven.

## Phase 5–6 — catalogue, registers, docs

- `spec/appendices-reference.md`: T77 names the format stamp and the v1
  migration; T381 names the archive-collision refusal.
- `spec/02-requirements.md`: REQ-232a enumerates `saved_beats` (body trimmed to
  756 chars to stay under the 800-char limit after the addition).
- `spec/audit/review-register.md`: the chunk-P4 block moved from
  `## Scheduled-roadmap` to a new `### 2026-11-12 §5.9/§5.19 persistence
  remediation` under `## Resolved`; F-P4-2…F-P4-9 resolved with current
  predicates. The `## Closed-P3` chunk-P4 block (F-P4-10/11/12) is untouched.
- `ROADMAP.md`: section removed. `holonovel/DECISIONS.md`: two entries
  (`novel_format_version` envelope stamp; chain-invalid sidecar retention).
- `CHANGELOG.md`: dated entry.
- `npm run validate -- --write-register`: A 0, B 0, C 490, D 0, E 118.

## Gates

- `test:persistence-guardrails`: **24 passed, 0 failed** (17 → 24).
- `test:persistence`: **46 passed, 0 failed** (45 → 46).
- `test:output-contracts`: 390 passed, 0 failed.
- `npm run typecheck` (root) and `holonovel` tsc: clean.
- `npm run check:fast`: **40 passed, 0 failed**, `check:fast: PASS`.
- `npm run build-order`: complete after regenerating `NOVEL_FORMAT_VERSION`
  fingerprints (`npm run build:starter-novel`); version advanced to
  2026.11.12.
- `npm run check` (inside build-order): 0 errors.
- `check-registers`, `check-roadmap`: pass.

## New action items

None. The section's findings are resolved; F-P4-10/11/12 remain recorded
Closed-P3 as before.

LOOP PAUSED
