# Tasks — §5.10 parser response and help contracts

Dependency-ordered. Each task names its verification; a task is done when its
check passes, not when the edit lands.

## Phase 0 — Baseline

- [x] T0.1 `npm run status` and `npm run check:fast` un-piped; record both in
      `aar.md` (expectation: 40/40, `check:fast: PASS`).
- [x] T0.2 Re-confirm predicates A–L (`plan.md` §3) with `grep -n`; drop any
      that already holds and record the evidence.
- [x] T0.3 Run the baseline harnesses this plan depends on
      (`test:backfill`, `test:output-contracts`, `test:world-provider`,
      `test:adventure`, `test:narrative`) and `npm run check:conformance`;
      a red one is a P0 fixed first.
- [x] T0.4 Verify §5.1, §5.10, and Appendix F are outside `DATA_SECTIONS` /
      `PACKAGE_SECTIONS` (`scripts/lib/contract-fingerprint.ts:27-43`).
- [x] T0.5 Sibling-contract grep over the REQ corpus for `command(`,
      `run_command`, `help`, `[UNIMPLEMENTED]`, `[AMBIGUOUS]`, `REQ-002a1`,
      `REQ-002a2`, `REQ-002b1`; record the REQ-196e/REQ-002 reading and the D12
      resolution.
- [x] T0.6 Grep the **whole** `spec/audit/review-register.md` for the 11 REQ IDs
      and `F-P6a-17`; only the F-P6a-7, F-P6a-11, and F-P6a-17 rows may cite
      them.
- [x] T0.7 Measure the pre-edit bodies of REQ-002a1, REQ-002a2, and REQ-002b1
      with `extractReqBodies`; record the counts.
- [x] T0.8 Read `world-model-provider.template.md`; record whether per-verb
      descriptions need a template edit.
- [x] T0.9 Confirm `docs/plans/2026-11-10-5-10-parser-help-remediation/` is not
      git-ignored.

## Phase 1 — Red tests

- [x] T1.1 Extend T239 in `holonovel/scripts/test-backfill.ts:375`:
      unknown verb → `[UNIMPLEMENTED]` + 3 nearest; Player-badge filter;
      closed-container take → `[RULE_VIOLATION]` then open+take → `[OK]`;
      numbered ambiguity + numeric selection + clearing; help/commands/what
      can I do? identity with categories, descriptions, and tier grouping;
      `jump`/`touch` dispatch and touch under inspection.
      Check: `npm --prefix holonovel run test:backfill` fails on the new
      assertions only.
- [x] T1.2 Extend T240 in `holonovel/scripts/test-output-contracts.ts:1438`:
      `look` returns name, verbatim description, final line beginning `Exits:`;
      no `Exits:` inside the description. Check: `test:output-contracts` fails
      on the new assertion only.
- [x] T1.3 Extend T333 (`test-output-contracts.ts`): `verbs` output is
      byte-identical to `help`; body groups by tier with per-tier counts.
      Check: fails pre-fix.
- [x] T1.4 Extend T245 in `holonovel/scripts/test-world-provider.ts:47`:
      `world://kinds` carries a `read_text` property row. Check: fails pre-fix.
- [x] T1.5 Extend T365 in `holonovel/scripts/test-backfill.ts:788`: `throw`
      at a same-room NPC leaves the thing in that room and out of inventory;
      `throw` at an NPC in another room records `[WARNING]` and deposits in the
      current room; `give` to that NPC returns `[WARNING]` and keeps the item.
      Check: fails pre-fix.
- [x] T1.6 Copy the pre-fix failure output into `aar.md`.

## Phase 2 — Catalog and parser

- [x] T2.1 Add `PARSER_CATALOG` to `holonovel/src/world/model.ts` (verb,
      category, tier, args, effect, source, property gate); derive
      `BASE_PARSER_COMMANDS`, `CORE_VERBS`, `STANDARD_VERBS`, `VERB_PROPERTY`,
      `verbCatalog` from it. Check: `npm run typecheck`; core tier still 7;
      every entry has non-empty `effect`.
- [x] T2.2 Add the `read_text` property contract row following the
      `noise`/`scent` pattern. Check: T1.4 passes.
- [x] T2.3 Render category, args, description, and tier from the catalog in
      `worldKinds()`. Check: `npm run check-world-provider` reports stale until
      T5.1 regenerates.
- [x] T2.4 Unknown-verb `[UNIMPLEMENTED]` + nearest-3 with the REQ-309b filter
      (`holonovel/src/world/parser.ts:115-121`). Check: T1.1 subset passes.
- [x] T2.5 Widen `handleTake`'s take-resolution candidate set so
      closed-container contents resolve and the existing rule-violation branch
      fires (`parser.ts:386-417`); REQ-284a hint reachability is unchanged.
- [x] T2.6 Structured numbered disambiguation with locations (`parser.ts:401`,
      `:442`).
- [x] T2.7 Exits move to a `status` field; description body stays verbatim
      (`parser.ts:324-325`).
- [x] T2.8 `jump` handler and `touch` inspection catalog entry.
      Check: `npm --prefix holonovel run test:backfill`.

## Phase 3 — Handlers

- [x] T3.1 Prepend the REQ-196b sentence to the `run_command` description
      (`holonovel/src/index.ts:4738-4741`).
- [x] T3.2 Rewrite `renderVerbCatalog` (`:5219-5225`) to the single canonical
      text (tier sections, category blocks, descriptions, counts) and add the
      `commands` / `what can I do?` aliases at `:4885`.
- [x] T3.3 Add the session-local ambiguity record
      (`{command, target, matches}`) and numeric-reply substitution in the
      `run_command` handler; clear it on any non-numeric command.
      Check: T1.1 ambiguity assertions pass.
- [x] T3.4 Room-scope `give`/`show` NPC resolution (`:5293`, `:5306`); make
      `throw` use the matched target's room with the current-room miss fallback
      (`:5276-5277`). Check: T1.5 passes.
- [x] T3.5 Pass ruleset-bound/badge context to the parser for the nearest-verb
      filter. Check: T1.1 Player-badge assertion passes.

## Phase 4 — Spec alignment

- [x] T4.1 Apply D12: REQ-002a1 (one added sentence), REQ-002a2 (first
      sentence scoped), REQ-002b1 (final sentence replaced), Appendix O.2
      `[UNIMPLEMENTED]` row. Walk the Appendix M checklist for each amended
      REQ.
- [x] T4.2 Re-measure all three REQ bodies; record counts in `aar.md`
      (targets: ≤800 chars, ≤8 sentences).
- [x] T4.3 Widen Appendix F rows T239, T240, T245, T333, T365
      (`spec/appendices-reference.md`). T363 is not touched.
- [x] T4.4 `npm run validate --sdd-strict` → 0 errors.

## Phase 5 — Regeneration and bookkeeping

- [x] T5.1 Edit the provider template first only if T0.8 found it necessary;
      then `npx tsx holonovel/scripts/generate-world-provider.ts`;
      `npm run check-world-provider`; `npm run test:world-provider`.
- [x] T5.2 Regenerate tool definitions; run `check-tool-definitions-sync`,
      `tool-definitions-lint`, `check-tdqs-scoreboard`, `surface-budget`.
- [x] T5.3 Move F-P6a-7, F-P6a-11, and F-P6a-17 to the Resolved section with
      post-change predicates; leave F-P6a-8, F-P6a-9, F-P6a-10, F-P6a-12,
      F-P6a-13, and F-P6a-14 scheduled.
- [x] T5.4 Delete the first bullet of the §5.10 ROADMAP section; rewrite the
      trigger to name the two remaining bullets and close when F-P6a-8/9/10 and
      F-P6a-12/13/14 are Resolved. Check: `npm run check-roadmap`.
- [x] T5.5 `npm run validate -- --write-register`; `npm run check-registers`.
- [x] T5.6 New top `CHANGELOG.md` heading naming the D12 clause amendment.
- [x] T5.7 `npm run build-order`.

## Phase 6 — Verify and close

- [x] T6.1 Run every command in `plan.md` §7.
- [x] T6.2 Write `aar.md` with the red-test record, the re-audit outcomes, the
      D12 measurements, and the terminal token.
- [x] T6.3 `npm run session:close`; report the commit list.
