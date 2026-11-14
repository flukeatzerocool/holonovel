# AAR — Trust-core error-envelope remainder (2026-11-14)

Plan: `plan.md` (v4, stamped `4319cf93…`; cold pass `cold-review.md`, diff
re-review `cold-review-r2.md`, both `independent-review` tokens present).
Commit subject: `2026-11-14 — Trust-core error envelope remainder: isError on
errors, scoped SDK shape, filtered lookups` (the plan's longer subject exceeded
the 120-character commit-msg limit; the heading in `CHANGELOG.md` is the
authoritative form).

## What shipped

1. **F-P1-14 — every tool-level error carries `isError`.** `err()` sets
   `isError: true as const`; `raw()` sets it when `classifyStatus` returns
   `ERROR` (covering the ten parser-command `raw("[ERROR] …")` sites);
   `refusalResult` folded into `err()`. `dispatcherRefusal` kept its
   exact-text contract.
2. **F-P1-14 (pacing) — error results do not advance the counter.** No code
   change to `paced` beyond the flag; REQ-336a now states the rule, and T386c
   proves it for a returned `err()` as well as a converted refusal.
3. **F-P1-15 — SDK structural result resolved by scoping.** REQ-548c is
   scoped to tool-level errors carrying a REQ-002 category and records the
   `-32602` shape; T180 asserts `structuredContent === undefined`.
4. **F-P1-16 — badge-filtered ruleset lookups.** New REQ-210c declares
   `badge_scope` on Concept, Entity, and info-tool entries;
   `rulesetEntryVisible` / `visibleRulesetCollection` apply it to lookup
   resolution, the `Valid values:` enumeration, the hint, and `info`.
5. **F-P1-17 scheduled, not smuggled.** Index-backed search
   (`RulesetIndexEntry` has no badge field; the match total is a second
   unfiltered query) is a separate data-contract change. Register row +
   ROADMAP bullet replace the resolved remainder bullet.

## Step-to-evidence

| Step | Command | Result |
|---|---|---|
| Baseline | `check:fast` | PASS (41 gates) |
| Baseline | `test:output-contracts` / `test:ruleset-nonovel` / `test:backfill` / `test:narrative` | 516/0, 9/0, 117/0, 84/0 |
| Step 0 probe | `/tmp/opencode/probe-envelope-remainder.ts` | returned `err()` → no `isError`; `-32602` → `isError: true`, `structuredContent` absent; Player exact-key GM entry resolved (leak) |
| Red | `test:output-contracts` | T783 + G2 fail on returned `err()`; expected |
| Red | `test:ruleset-nonovel` | T179 fails on Player enumeration |
| Red | `test:narrative` | T386c fails on a returned error advancing pacing |
| C1 typecheck | `npm run typecheck` | clean |
| Green | `test:output-contracts` | 516 passed, 0 failed |
| Green | `test:narrative` | 84 passed, 0 failed |
| Green | `test:ruleset-nonovel` | 10 passed, 0 failed |
| Spec | `npm run assemble` + `npm run validate -- --write-register` | 0 errors, 287 warnings |
| Full harness | `npm --prefix holonovel run test:all` | 56 suites, 0 failed |
| Gates | `npm run assemble && npm run check:fast` | see final run below |

## Deviations from the plan

1. **Version bump.** The dated CHANGELOG entry forced the CalVer gate, so
   `npm run version-bump` advanced root/holonovel version references to
   `2026.11.14`. It also re-emitted the covered reference package manifest
   (`holonovel/testdata/rulesets/fixture/manifest.json`) — the plan listed the
   fixture as verify-no-change. The change is the mechanical `host_version`
   stamp, not a format change; accepted.
2. **Holosuite anchors.** `src/index.ts` shifted by the edits; nine evidence
   anchors across `holosuite-adversarial`, `-conformance`, `-invariants`, and
   `-novel` were repointed and verified with `test:all`.
3. **Proofread register.** The live warning count was 284, not Batch 12's 283,
   before this increment's spec edits (verified by stashing the spec files and
   re-running). Batch 13 records the drift and states no edited body produced
   a new warning.
4. **Three red tests, not four.** The T180 extension is a regression guard
   that passes pre-change (the SDK result already lacked a structured result);
   T783 carries the red case for the contract.

## Findings and dispositions

- **F-P1-17 — index-backed search leaks GM-only entries. Scheduled-roadmap.**
  `ROADMAP.md` § Trust-core contract remediation bullet 1 (replaced), register
  row with predicates `index.ts:2341-2351`, `:13611-13637`.
- **Generic `table` kind has no badge gate — P3, record-and-close.** REQ-216a's
  generation-table gating runs through `resolve_mechanic` and is green (T257).
  No shipped package declares a GM-only lookup table; a future package that
  does should extend `rulesetEntryVisible` to the `table` case. No demonstrated
  failure, so no register row.
- **F-P1-14 predicate breadth — Closed-P3.** `raw()` error sites were inside
  the fix, not a separate finding; T783 covers both helpers.
- **Cold-review condition C-1 (staged lenses).** Recorded on the stamp; the
  build ran from the passed artifact and diff re-review.

## Done bar check

1. `isError` on every `[ERROR]` — T783 + G2, green.
2. Error results do not pace — T386c, green; REQ-336a amended.
3. `-32602` shape — T180, green; REQ-548c scoped.
4. GM-only entries absent on lookup/enumeration/hint/info — T179, green.
5. REQ-210c + REQ-002c1 + Appendix index + T179 row; no §5 map edit — done.
6. F-P1-14/15/16 resolved, F-P1-17 scheduled, coverage register regenerated — done.
7. `check:fast` PASS, `test:all` green, register/roadmap/loop gates — done.
8. One `session:close` commit — pending.

LOOP PAUSED
