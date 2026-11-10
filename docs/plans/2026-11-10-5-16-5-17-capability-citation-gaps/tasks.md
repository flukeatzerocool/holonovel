# Tasks — §5.16–§5.17 capability citation gaps (F-P6b-27, F-P6b-28)

Status: revised after cold review · Increment:
`docs/plans/2026-11-10-5-16-5-17-capability-citation-gaps/`

Dependency order is the phase order in `plan.md` §5. `[A]` = depends on the
task before it in the same phase; phase headers depend on every task in the
previous phase.

## Phase 0 — contract-surface probes (plan §4.5)

- [x] P0.1 Grep the spec for every REQ binding `tools/list` parameters
  (REQ-391a, REQ-391c, REQ-381b, REQ-570, REQ-137b); record that none conflicts
  with an added `ruleset` filter and that the `ruleset` + `scope` refusal
  covers the one precedence question.
- [x] P0.2 Confirm no existing gate covers the live-registry description budget
  (T642 covers the static catalog only) and record the split.
- [x] P0.3 Confirm no doc enumerates `tools/list` parameters
  (`docs/engine-contract.md:218` mentions only badge filtering); if one does,
  add it to the blast radius before Phase 3.

## Phase 1 — shared budget parser

- [x] P1.1 Create `holonovel/scripts/lib/tool-budget.ts` exporting
  `recordedDescriptionBudget()` (parse of `holonovel/DECISIONS.md:7`, throws
  when the line is absent) with a header comment naming the role.
- [x] P1.2 `[A]` Delete the local copy at
  `holonovel/scripts/test-tool-definitions.ts:72-77` and import the lib.
- [x] P1.3 `[A]` `npm --prefix holonovel run test:tool-definitions` → exit 0.

## Phase 2 — T459 / REQ-392

- [x] P2.1 Extend `test-output-contracts.ts:1791` with the description-budget
  assertion over the `scope=all` listing (every entry, naming offenders with
  byte counts).
- [x] P2.2 `[A]` Add the `tools_list_bytes` reflection assertion against
  `bound.result.tools` with `_meta.ruleset` / `_meta.inapplicable` removed.
- [ ] P2.3 `[A]` Red proofs: (a) lower the parsed budget below 994; (b) drop the
  `_meta` strip step. Capture both failures, revert, record in `aar.md`.
- [x] P2.4 `[A]` `npm --prefix holonovel run test:output-contracts` → exit 0.

## Phase 3 — ruleset filter / REQ-391b

- [x] P3.1 `holonovel/src/index.ts`: read `requestedRuleset`
  (`params._meta.ruleset`, top level accepted), select `visible` tools whose
  `packageSlugForTool` equals the slug, keep the group/profile projection on
  top of that base.
- [x] P3.2 `[A]` Refuse `ruleset` with `scope` or `group` together, and an
  unknown/uninstalled slug, both `[INVALID_INPUT]` with a corrective action.
- [x] P3.3 `[A]` Add `ruleset` to the `pageSignature` so a foreign cursor is
  rejected.
- [x] P3.4 `[A]` `test-selection.ts`: add `lookup_alpha` to the `fixture`
  package, install `fixture2` with `lookup_beta`, and extend the
  `T457/REQ-391b` block with the six assertions (exact set, no infrastructure,
  unknown slug, conflicting filters, `rulesets_hydrated` unchanged, cursor
  minted from the unscoped listing rejected on the filtered request) using a
  default-profile process with `TTRPG_TOOLS_LIST_MAX_BYTES=4096`.
- [x] P3.5 `[A]` Red proof: run the new assertions against the pre-change
  server, capture the failures, record in `aar.md`.
- [x] P3.6 `[A]` `npm --prefix holonovel run test:selection` → exit 0.

## Phase 4 — spec rows and registers

- [x] P4.1 Rewrite the T457 row (`spec/appendices-reference.md:1912`) to cover
  schema disclosure and the ruleset tool set.
- [x] P4.2 `[A]` Rewrite the T459 row (`:1914`) to add the description-budget
  assertion and the pre-annotation projection note.
- [x] P4.3 `[A]` Move F-P6b-27 and F-P6b-28 to a new
  `## Resolved — 2026-11-10 §5.16–§5.17 capability citation gaps` section with
  post-change `file:line` predicates; delete their `Scheduled-roadmap` rows.
- [x] P4.4 `[A]` Remove the closed section from `ROADMAP.md`.
- [x] P4.5 `[A]` `npm run validate -- --write-register` to refresh
  `spec/audit/req-coverage.md` (expected no-op).
- [x] P4.6 `[A]` `npm run assemble && npm run validate` (0 errors),
  `npm run check-registers`, `npm run check-roadmap`.

## Phase 5 — build and record

- [ ] P5.1 `npm run build-order`; confirm no contract fingerprint advanced and
  `check-fingerprint-sync` is green.
- [ ] P5.2 `[A]` `CHANGELOG.md` bullet group under `2026-11-10`.
- [ ] P5.3 `[A]` `npm run check:fast` un-piped → `check:fast: PASS`.

## Phase 6 — close

- [ ] P6.1 `aar.md`: probe results, red-test transcripts, dispositions,
  `LOOP PAUSED`.
- [ ] P6.2 `[A]` `npm run session:close` → one commit.
