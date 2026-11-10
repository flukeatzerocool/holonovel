# Tasks — §5.21–§5.23 capability remediation (F-P6b-17, F-P6b-18)

Dependency order. Each task names its verification. A task is done only when
its verification ran and its result is recorded here or in `aar.md`.

## T1 — Red tests (Phase 1)

- [ ] T1.1 `holonovel/scripts/test-forged.ts`: extend T528 — a named mark
      records the consequence and `list` shows it; a repeated name is not
      duplicated; a filling mark records the trauma and appends no
      consequence; resist removes the consequence and spends the cost; an
      unrecorded resist name is `[NOT_FOUND]`; over-budget resist stays
      `[RULE_VIOLATION]`.
      Verify: `npm --prefix holonovel run test:forged` **fails** on the new
      assertions pre-fix; capture the output in `aar.md`.
- [ ] T1.2 `holonovel/scripts/test-persistence-guardrails.ts`: extend T10 with
      the five-entry refusal matrix — `fate_point` spend above balance
      (REQ-436), `fate_aspect` invoke at zero points (REQ-435), `fate_stress`
      unknown `op`, `ironsworn_progress` mark on a missing track (REQ-440), and
      `forged_stress` resist above the track (REQ-442) — asserting the undo
      reverses the prior mutation, redo still succeeds, and no refused call
      created a `fate.stress` or `forged.characters` entry.
      Verify: `npm --prefix holonovel run test:persistence-guardrails` fails
      pre-fix.
- [ ] T1.3 `holonovel/scripts/test-backfill.ts`: extend T121 — redo survives a
      refused capability call.
      Verify: `npm --prefix holonovel run test:backfill` fails pre-fix.

## T2 — Refusal atomicity (Phase 2)

- [ ] T2.1 For each of the seven branches, move the op whitelist, argument
      guards, and state lookups **above** `novelSnapshot()`, and move the entry
      creation (`fate.stress[entity_id] ??=`, `forged.characters[entity_id]
      ??=`) plus every write **below** it. Branch table: `plan.md` Phase 2.
      Sites: `index.ts:7908`, `:7956`, `:7992`, `:8057`, `:8120`, `:8204`,
      `:8247`.
      Verify: T1.2 and T1.3 pass; `test:fate` and `test:ironsworn` still pass.
- [ ] T2.2 Review each branch by hand for snapshot-after-mutation
      (`grep -n -B6 -A6 "novelSnapshot()" holonovel/src/index.ts` inside the
      seven ranges).

## T3 — Forged consequence model (Phase 3)

- [ ] T3.1 Audit first: `grep -n "normalizeForgedState" holonovel/src` confirms
      no competing normalizer.
- [ ] T3.2 `holonovel/src/core/state.ts`: add `consequences: string[]` to
      `ForgedCharacterState`; deep-normalize per character in
      `normalizeForgedState` (absent → `[]`).
- [ ] T3.3 `holonovel/src/index.ts`: both entry literals gain
      `consequences: []` (`:8207`, `:8250`); both `list` projections report
      consequences (`:8200`, `:8243`); mark/resist follow D1; audit names
      unchanged. A nameless `resist` is refused `[INVALID_INPUT]` (D1 retired
      the legacy spend-without-removal path) and T528 asserts it.
      Verify: `npm --prefix holonovel run test:forged` passes; T529 still
      passes.
- [ ] T3.4 Descriptions: `RESOLVE_MECHANIC_SCHEMA.name` and the
      `resolve_mechanic` tool description name the consequence semantics.

## T4 — Spec alignment (Phase 4)

- [ ] T4.1 `spec/02-requirements.md:4151`: write the exact 793-char body from
      the `plan.md` Phase 4 fenced block after the existing REQ-442 header.
      Verify: `npm run validate --sdd-strict` reports no REQ-442 shape,
      violation, or proofreading error; re-measure with `extractReqBodies` and
      record the length.
- [ ] T4.2 `spec/04-runtime.md:339-346`: add "and named consequences" to the
      §7.7.0 Forged clause.
- [ ] T4.3 `spec/appendices-reference.md:1946`: rewrite the T528 row.
      Verify: `npm run validate --sdd-strict` (Appendix F assertion checks).

## T5 — Regeneration (Phase 5)

- [ ] T5.1 `npx tsx holonovel/scripts/generate-tool-definitions.ts`, then
      `npm run check-tool-definitions-sync`, `npm run tool-definitions-lint`,
      `npm run check-tdqs-scoreboard`, `npm run surface-budget` (`-- --write`
      only if the footprint moved).
- [ ] T5.2 `npm run assemble` — `holonovel.md` refreshed.

## T6 — Registers and disposition (Phase 5)

- [ ] T6.1 `spec/audit/review-register.md`: move F-P6b-17 and F-P6b-18 to a new
      `## Resolved — 2026-11-10 §5.21–§5.23 capability remediation` section
      with `file:line` predicates; F-P6b-21 stays scheduled.
- [ ] T6.2 `ROADMAP.md`: remove lines 15-23 (the §5.21–§5.23 section and its
      `**Trigger:**`).
- [ ] T6.3 `npm run validate -- --write-register` — coverage register current.
- [ ] T6.4 `CHANGELOG.md`: new top heading
      `## 2026-11-10 — §5.21–§5.23 capability remediation` above the existing
      §5.18 heading, with the verification line.

## T7 — Full verification (Phase 6)

- [ ] T7.1 `npm run check:fast` un-piped → exit 0 and the trailing
      `check:fast: PASS` line.
- [ ] T7.2 `npm run build-order` → complete; record the data-format fingerprint
      advance and that `package_format` is unchanged.
- [ ] T7.3 `npm run check-registers`, `npm run check-roadmap`,
      `npm run check-traceability` → PASS.

## T8 — Close (Phase 6)

- [ ] T8.1 Write `aar.md` with the red-test record, gate evidence, finding
      dispositions, and the terminal token.
- [ ] T8.2 `npm run session:close` → one commit whose subject matches the
      CHANGELOG heading.
