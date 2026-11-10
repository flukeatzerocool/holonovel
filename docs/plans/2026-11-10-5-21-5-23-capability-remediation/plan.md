# Plan — §5.21–§5.23 capability remediation (F-P6b-17, F-P6b-18)

Status: revised after cold review and diff re-review (all prior findings
resolved; the two re-review Majors are folded in below) · Kind: planned ·
Depth: standard
Increment: `docs/plans/2026-11-10-5-21-5-23-capability-remediation/`
Rollback cost: 1 (reversible edits; one spec increment, one commit)
Evidence class: repo only (no web, no user-supplied content)

## 1. Objective

Close the first open `ROADMAP.md` section — **§5.21–§5.23 capability
remediation (P1)** — by fixing the two demonstrated defects in the host
base-capability state (Fate, Ironsworn, Forged):

- **F-P6b-17.** `resolve_forged (op: resist)` spends stress and reduces
  nothing, because the Forged character state has no consequence slot
  (REQ-442).
- **F-P6b-18.** `novelSnapshot()` precedes validation in seven capability
  branches, so a refused call pushes an undo snapshot and clears the redo
  stack (REQ-041a, REQ-041b, REQ-116, REQ-435, REQ-436, REQ-440, REQ-442).

**Done bar** (each item names its command or artifact; no conditional clause)

1. F-P6b-17 and F-P6b-18 appear under `## Resolved — 2026-11-10 …` in
   `spec/audit/review-register.md`, each with a post-change `file:line`
   predicate that resolves on the committed tree, and each with an exercised
   harness assertion (T528 for F-P6b-17; T10 and T121 for F-P6b-18).
2. The `## §5.21–§5.23 capability remediation (P1)` section is removed from
   `ROADMAP.md`; no `Scheduled-roadmap` row still names it (`npm run
   check-registers` passes).
3. The new assertions fail on the pre-fix tree (recorded in `aar.md`) and pass
   after the fix: `npm --prefix holonovel run test:forged`, `test:fate`,
   `test:backfill`, and `test:persistence-guardrails` all exit 0.
4. `npm run assemble && npm run check:fast` exits 0 with the trailing
   `check:fast: PASS` line, run un-piped.
5. `npm run build-order` completes (assemble → full `check` → propagate →
   version sync); the data-format fingerprint advances because REQ-442 and
   §7.7.0 are in `DATA_SECTIONS` (`scripts/lib/contract-fingerprint.ts`), and
   `package_format` is unchanged because `PACKAGE_SECTIONS` excludes them.
6. `aar.md` ends `LOOP PAUSED`.

## 2. Verified baseline

- `npm run status`: 40 unpushed commits, 16 open roadmap items, version
  `2026.11.10`, last publish `2026-11-09T04:30:29.593Z` (`repo`, this session).
- `npm run check:fast`: 40 gates, **40 passed, 0 failed**, `check:fast: PASS`
  (`repo`, this session). The baseline is green, so no pre-fix commit is
  required.
- **REQ-442 body budget.** The validator measures the body slice *after* the
  REQ header (`findReqBoundaries` sets `start = match.index +
  match[0].length`, `scripts/lib/parse-spec.ts:20-31`) against an 800-char
  limit (`scripts/validate.ts:191`). Measured this session with
  `extractReqBodies`: the current body is **747** characters; the replacement
  body in Phase 4 is **793** characters, 7 sentences. Headroom: 7 characters.
- `git check-ignore docs/plans/...` exits 1 — increment artifacts are
  trackable, not ignored (`repo`).
- **Pre-existing working-tree work.** The tree already carries an unrelated
  uncommitted roadmap addition (`ROADMAP.md`, "Unscoped-surface review sweep")
  and its untracked increment `docs/plans/2026-11-10-unscoped-surface-review/`.
  They are not part of this increment: Phase 5's ROADMAP edit targets lines
  15-23 only, and the close stages this increment's files explicitly rather
  than `git add -A`.
- Version `2026.11.10` already equals the session date, so no version bump is
  needed (gate: `session:close` subject derivation from the top CHANGELOG
  heading).

## 3. Evidence (file:line)

**F-P6b-18 — snapshot before guard.** `holonovel/src/index.ts`:

| Line | Branch | Guards that must run before the snapshot |
|---|---|---|
| 7908 | `resolve_fate` / `aspect` | op whitelist, empty or duplicate name, `NOT_FOUND` remove, missing `entity_id`, aspect absent, zero Fate points |
| 7956 | `resolve_fate` / `fate_point` | missing `entity_id`, op whitelist, spend above balance |
| 7992 | `resolve_fate` / `stress` | missing `entity_id`, op whitelist |
| 8057 | `resolve_ironsworn` / `momentum` | missing `entity_id`, op whitelist |
| 8120 | `resolve_ironsworn` / `progress` | empty name, duplicate name, `NOT_FOUND` track, op whitelist |
| 8204 | `resolve_forged` / `stress` | missing `entity_id`, op whitelist, resist consequence and budget checks |
| 8247 | `resolve_forged` / `downtime` | missing `entity_id`, op whitelist |

Three branches also **create state before validating the op**: the character
or stress entries at `:7995` (`novel.fate.stress[entity_id] ??= …`), `:8207`,
and `:8250` (`novel.forged.characters[entity_id] ??= …`). The unknown-op
refusal is a fallthrough after the mutations (`:7945`, `:7981`, `:8013`,
`:8069`, `:8147`, `:8233`, `:8265`), so a literal one-line move of the
snapshot is not sufficient — see Phase 2.

The mechanism that makes this a defect, not tidiness: `snapshot()` clears
`novel.redo_stacks[badge]` (`holonovel/src/core/state.ts:1932`). The register's
original offsets (`7508, 7556, … 7847`) are stale after the
`resolve_mechanic` consolidation; the seven sites above were re-derived by
predicate this session.

**F-P6b-17 — no Forged consequence state.** `holonovel/src/core/state.ts:588-604`:
`ForgedCharacterState` is `{ stress, trauma }`, `FORGED_STRESS_MAX = 8`, and
`normalizeForgedState` passes `characters` through untouched. The resist
branch (`holonovel/src/index.ts:8225-8231`) adds `cost` stress, records a
mutation, audits, and returns — nothing is reduced. `resolve_fate`'s stress
branch (`:7983-8015`) already carries a `consequences: string[]` pattern
(REQ-437) that the Forged path lacks.

**Sibling-contract check.** `grep -n "forged_stress" spec/*.md` matches
REQ-442 (`spec/02-requirements.md:4151`) and the T473 catalogue row
(`spec/appendices-reference.md:1489`), which is a test description citing
REQ-404/REQ-174, not a second contract. No sibling REQ binds the action, so
widening the consequence semantics conflicts with nothing.

**Existing assertions.** T528 (`holonovel/scripts/test-forged.ts:101-118`),
T521/T522 (`holonovel/scripts/test-fate.ts:107-135`), T10
(`holonovel/scripts/test-persistence-guardrails.ts:113`), T121
(`holonovel/scripts/test-backfill.ts:352`), T526
(`holonovel/scripts/test-ironsworn.ts:119`). No harness asserts
capability-refusal atomicity: `grep -rn "redo" holonovel/scripts/*.ts` hits
T121 (`test-backfill.ts:352`), T138b (`test-workflow.ts:114`), and T696
(`test-security.ts:298`); none of the three follows a refused
`resolve_mechanic` capability call.

**Surface facts.** `resolve_forged` is a retired hidden tombstone in the
generated surface (`holonovel/tool-definitions.json:2615-2618`) but remains the
live delegated handler (`holonovel/src/index.ts:8340-8341`); the user-facing
description and parameter docs live on `resolve_mechanic` (`:8305`, schema at
`:8273-8302`). The generator emits **both** `holonovel/tool-definitions.json`
and `holonovel/tool-surface-registry.json`
(`holonovel/scripts/generate-tool-definitions.ts:33-34`).

**Fingerprint artifact.** The baked constants live in
`holonovel/src/generated/contract-fingerprints.ts`, generated from
`scripts/lib/contract-fingerprint.ts` (`DATA_SECTIONS` / `PACKAGE_SECTIONS`).

## 4. Decisions

**D1 — Forged consequence model (user-selected, option A).**
`ForgedCharacterState` gains `consequences: string[]`, ordered, deduplicated by
name.

- `mark` with `name` on a track that does **not** fill appends the name once as
  a recorded consequence.
- A `mark` that fills the track keeps today's semantics: the name labels the
  trauma, stress resets, and **no** consequence is appended.
- `resist` requires `name`: a recorded name is removed and `cost` is spent; an
  unrecorded name is `[NOT_FOUND]` with a corrective action naming `op: list`;
  a missing `name` is `[INVALID_INPUT]` (a resist must name the consequence it
  reduces, so the legacy spend-without-removal path is retired); an over-budget
  cost stays `[RULE_VIOLATION]`. The retirement is a deliberate behaviour
  change and is named in the CHANGELOG entry.
- `list` reports `stress`, `trauma`, and `consequences`.

`§7.7.0` already declares host base-capability state a self-contained,
non-coupling surface (`spec/04-runtime.md:339-346`), so a new field inside
`forged.characters` needs no property-group row, archetype, or coupling entry —
only the one-clause §7.7.0 update in Phase 4.

Rejected: **report-only resist** (no state change) — leaves F-P6b-17 a wording
fix rather than a state fix. Rejected: **severity model** (mild/moderate/severe
with a downgrade step) — invents an Appendix O catalogue REQ-442 does not
define.

**D2 — Fix shape for refusal atomicity.** Restructure each branch to
validate → snapshot → mutate, including moving the op whitelist and the entry
creation above/below the snapshot as Phase 2 specifies. Rejected: a
guard-aware `novelSnapshot(guard)` helper — it hides the ordering decision and
still has to be applied at all seven sites.

**D3 — Scope stop at the seven capability branches.** F-P6b-18's predicate is
the capability branches. The file holds 74 `novelSnapshot()` calls; 7 are in
scope and 67 are not swept. A repo-wide ordering audit is a candidate P3
record-and-close in the AAR, not this increment.

## 5. Phases

### Phase 1 — Red tests (M)

1. `holonovel/scripts/test-forged.ts` — extend T528:
   - `mark` with `name: "Harm"` (amount 1) reports the track and the recorded
     consequence; `list` includes `Harm`.
   - a second `mark` with the same name does not duplicate it.
   - `mark` that fills the track with `name: "Overreach"` records the trauma
     and appends **no** consequence.
   - `resist` with `name: "Harm"` (cost 2) reports the reduced stress and that
     the consequence is gone; `list` no longer shows it.
   - `resist` with an unrecorded name returns `[NOT_FOUND]`.
   - the existing over-budget `[RULE_VIOLATION]` assertion stays.
2. `holonovel/scripts/test-persistence-guardrails.ts` — extend T10 with a
   five-entry refusal matrix covering every cited REQ: create an aspect, then
   call, in turn, `fate_point` spend above balance (REQ-436), `fate_aspect`
   invoke at zero points (REQ-435), `fate_stress` with an unknown `op`,
   `ironsworn_progress` mark on a missing track (REQ-440), and `forged_stress`
   resist above the track (REQ-442). For each entry assert that one
   `manage_history (undo)` reverses the *aspect creation* (proving no snapshot
   was pushed), that the subsequent `redo` succeeds, and that the refused call
   left no entry behind (the `fate.stress` and `forged.characters` projections
   omit the entity the refused call named).
3. `holonovel/scripts/test-backfill.ts` — extend T121: mutation → undo (redo
   stack populated) → refused capability call → `redo` succeeds.

All three must fail on the current tree; the exact failure output goes into
`aar.md` as the red-test record.

### Phase 2 — Refusal atomicity (M)

`holonovel/src/index.ts`, per branch — `requireGM()`/`requireNovel()` and the
read-only `list` early return stay put; everything else becomes validate →
snapshot → mutate:

| Branch | Moves above the snapshot | Moves below the snapshot |
|---|---|---|
| `aspect` (`:7908`) | op whitelist (`create`, `remove`, `invoke`, `compel`), name checks, duplicate check, remove lookup, `entity_id`, aspect-present, points ≥ 1 | aspect push/splice, point debit/credit |
| `fate_point` (`:7956`) | `entity_id`, op whitelist (`spend`, `grant`, `refresh`), spend balance | point write |
| `fate stress` (`:7992`) | `entity_id`, op whitelist (`mark`, `clear`) | the `fate.stress[entity_id] ??=` entry creation and every write |
| `momentum` (`:8057`) | `entity_id`, op whitelist (`set`, `gain`, `lose`, `reset`) | momentum write |
| `progress` (`:8120`) | `create`: name + duplicate; `mark`/`test`: name + track lookup (`NOT_FOUND`); op whitelist | track push, ticks, challenge dice + audit |
| `forged stress` (`:8204`) | `entity_id`, op whitelist (`mark`, `clear`, `resist`), resist consequence + budget | the `forged.characters[entity_id] ??=` entry creation and every write |
| `downtime` (`:8247`) | `entity_id`, op whitelist (`recover`, `indulge_vice`) | entry creation and every write |

No success-path behaviour changes. T10's entry-absence assertion is the guard
for the `??=` literals: a fix that moves the snapshot but leaves the entry
creation above the op check still fails.

### Phase 3 — Forged consequence model (M)

- `holonovel/src/core/state.ts`: add `consequences: string[]` to
  `ForgedCharacterState`; deep-normalize each character in
  `normalizeForgedState` (`stress` number, `trauma` array, `consequences`
  array; absent → `[]`) so pre-change Novels load.
- `holonovel/src/index.ts`, `resolve_forged`:
  - both inline entry literals gain `consequences: []`
    (`:8207`, `:8250`);
  - both `list` projections report `consequences` (`:8200` stress list,
    `:8243` downtime list);
  - `mark` follows D1; `resist` follows D1; audit names are unchanged
    (`mark_stress_forged`, `resist_forged`).
- `holonovel/src/index.ts` `RESOLVE_MECHANIC_SCHEMA` `name` description and the
  `resolve_mechanic` tool description name the consequence semantics.

### Phase 4 — Spec alignment (S)

Replace `spec/02-requirements.md:4151` with this exact body (793 chars after
the header, 7 sentences; measured with `extractReqBodies`):

```text
 `resolve_mechanic (action: forged_stress)` SHALL mark, clear, resist, and list stress — a track capped by Appendix O. Marking adds `amount` stress and records `name` once as a consequence unless the track fills; a full track records trauma and resets stress. Resisting SHALL remove the recorded consequence and spend `cost` stress (Appendix O default), refusing an unrecorded name or over-budget cost. Mark, clear, and resist are Game Master operations; listing SHALL be readable by any badge. Stress, trauma, and consequences persist with the Novel. *Acceptance criterion:* a named mark reports the track and consequence; a resist removes it and spends the cost; an unrecorded name is refused; a full track records a trauma and resets stress; an over-budget resist is refused. _Check:_ T528.
```

The fenced block holds the exact body bytes; write it as one paragraph
immediately after the existing `**REQ-442 — Stress, trauma, and
resistance.**` header.

Also:

- `spec/04-runtime.md:339-346` — the Forged clause of the §7.7.0
  base-capability sentence gains "and named consequences" (the §7.7.0
  non-coupling declaration covers the new field, so no archetype, property
  group, coupling row, or clone/checkpoint/archive enumeration changes).
- `spec/appendices-reference.md:1946` — T528 row rewritten to the consequence
  assertions (recorded consequence, dedupe, fill records trauma only, resist
  removal, unrecorded `[NOT_FOUND]`, over-budget `[RULE_VIOLATION]`).
- Appendix O needs no new row: a consequence is a free-form label, not a tuning
  value.

### Phase 5 — Regeneration and bookkeeping (M)

1. `npx tsx holonovel/scripts/generate-tool-definitions.ts` (writes both
   `tool-definitions.json` and `tool-surface-registry.json`), then
   `npm run check-tool-definitions-sync`, `npm run tool-definitions-lint`,
   `npm run check-tdqs-scoreboard`, and `npm run surface-budget` (`-- --write`
   only if the footprint moved).
2. `spec/audit/review-register.md`: move F-P6b-17 and F-P6b-18 from
   `## Scheduled-roadmap` (`:1473-1481`) to a new
   `## Resolved — 2026-11-10 §5.21–§5.23 capability remediation` section with
   `file:line` predicates; leave F-P6b-21 in place.
3. `ROADMAP.md`: delete lines 15-23, including the `**Trigger:**` line.
4. `npm run validate -- --write-register` to refresh `spec/audit/req-coverage.md`.
5. `CHANGELOG.md`: add a **new top heading**
   `## 2026-11-10 — §5.21–§5.23 capability remediation` above the existing
   `## 2026-11-10 — §5.18 …` heading, with the verification line. A new
   heading is required because `session:close` derives the commit subject from
   the top heading.
6. `npm run build-order` — regenerates
   `holonovel/src/generated/contract-fingerprints.ts` (data-format advance),
   assembles `holonovel.md`, propagates to `holonovel/holonovel.md`, and syncs
   version metadata. When `check-starter-freshness` reports the starter stale
   after a spec edit, run `npm --prefix holonovel run build:starter-novel`
   first (the artifact embeds the spec hash) and re-run `build-order`.

### Phase 6 — Verify and close (S)

Run the commands in §7, write `aar.md` (`LOOP PAUSED` if the bar clears), then
`npm run session:close`.

## Files expected

- `holonovel/src/index.ts`
- `holonovel/src/core/state.ts`
- `holonovel/scripts/test-forged.ts`
- `holonovel/scripts/test-persistence-guardrails.ts`
- `holonovel/scripts/test-backfill.ts`
- `holonovel/tool-definitions.json`
- `holonovel/tool-surface-registry.json`
- `holonovel/content/torre-nosferatu.json`
- `holonovel/src/generated/contract-fingerprints.ts`
- `spec/02-requirements.md`
- `spec/04-runtime.md`
- `spec/appendices-reference.md`
- `spec/audit/review-register.md`
- `spec/audit/req-coverage.md`
- `spec/audit/tool-surface-baseline.json`
- `spec/build-phase-map.md`
- `ROADMAP.md`
- `CHANGELOG.md`
- `holonovel/DECISIONS.md`
- `holonovel.md`
- `holonovel/holonovel.md`
- `docs/plans/2026-11-10-5-21-5-23-capability-remediation/plan.md`
- `docs/plans/2026-11-10-5-21-5-23-capability-remediation/tasks.md`
- `docs/plans/2026-11-10-5-21-5-23-capability-remediation/aar.md`

## 6. Blast radius and rollback

| Surface | Change | Size |
|---|---|---|
| `holonovel/src/index.ts` | validate→snapshot→mutate in 7 branches; Forged consequence ops; two descriptions | M |
| `holonovel/src/core/state.ts` | one field, one deep normalizer | S |
| three harnesses | extended assertions only | S each |
| `spec/02-requirements.md` | one REQ body (793/800 chars) | S |
| `spec/04-runtime.md` | one clause | S |
| `spec/appendices-reference.md` | one T528 row | S |
| registers, ROADMAP, CHANGELOG | disposition and bookkeeping | S |
| generated artifacts, fingerprints, assembled spec | regenerated, not hand-edited | S |

Rollback cost 1: every edit is a reversible source or spec edit; no schema
migration is written to disk (a Novel without `consequences` normalizes to
`[]` and re-saves).

## 7. Verification

| Step | Command | Expectation |
|---|---|---|
| Red tests | the three harnesses, pre-fix | each new assertion fails |
| Targeted harnesses | `npm --prefix holonovel run test:forged`, `test:fate`, `test:backfill`, `test:persistence-guardrails` | exit 0 |
| Assembled spec | `npm run assemble` | ok |
| Fast gates | `npm run check:fast` (un-piped) | exit 0, `check:fast: PASS` |
| Tool surface | `npm run check-tool-definitions-sync`, `npm run tool-definitions-lint`, `npm run check-tdqs-scoreboard`, `npm run surface-budget` | PASS |
| Registers | `npm run check-registers`, `npm run check-roadmap`, `npm run check-traceability` | PASS |
| Full pipeline | `npm run build-order` | complete; data-format fingerprint advances, `package_format` unchanged |
| Close | `npm run session:close` | one commit |

`npm run check` runs inside `build-order`, so the full proofreading pass is
exercised once.

## 8. Risks, edge cases, assumption audits

- **Ordering hazard.** For `aspect` and `progress`, guards need state lookups
  (`find`, `findIndex`); validate after the lookup but before the snapshot, and
  keep the mutation after the guard. A snapshot moved *below* the mutation
  would make undo revert the wrong state — Phase 1's T10 assertion catches it.
- **Entry-creation hazard.** The three `??=` literals must sit *below* the
  snapshot and *after* the op whitelist, or a refused call still mutates state
  (an empty entry) while writing no undo record.
- **Assumption (D1 audit).** "No competing normalizer for `forged.characters`"
  is read from `state.ts:599-604`; Phase 3 confirms with
  `grep -n "normalizeForgedState" holonovel/src` before adding the deep
  normalizer.
- **Backward compatibility.** Legacy Novels without `consequences` must load
  and re-save; the normalizer default covers it. No legacy Forged-state fixture
  exists, so the coverage is asserted by the normalizer itself, not by a
  fixture.
- **REQ-442 budget.** 793/800 characters measured on the validator's own body
  slice; the edit is re-measured after writing and recorded in the AAR. Any
  further insertion requires an offsetting trim.
- **Fingerprint churn.** §5.21–§5.23 and §7.7 are in `DATA_SECTIONS`, so
  `build-order` must run; `package_format` must stay unchanged.
- **Tool-definition drift.** `resolve_mechanic`'s description is scored by
  `tool-definitions-lint` and the TDQS scoreboard; regenerate rather than
  hand-edit, and re-run `check-tdqs-scoreboard` because a description edit can
  shift a sub-score.
- **No new gate.** This increment installs no new check, so no false-positive
  budget or error-gate dry run applies; the only overlapping checks
  (`check-registers`, `check-roadmap`) are reused.
- **Not swept (D3).** 74 `novelSnapshot()` calls exist; 7 are in scope, 67 are
  not. A sibling defect demonstrated during Phase 2 becomes a register finding
  rather than an in-plan expansion.

## 9. Open questions

None. The user settled the three open items on 2026-11-10: consequence model
A, one session, and persist the artifacts and run plan review.
