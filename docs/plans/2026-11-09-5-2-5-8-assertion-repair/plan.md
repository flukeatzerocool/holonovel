# Plan — §5.2/§5.8 assertion repair (F-P7b-1 … F-P7b-9)

Status: revised after cold review FAILED · Kind: planned · Depth: standard

## 0. Revision note (why this plan changed)

The first draft assumed every cited contract was implemented and only the
citations were stale. A cold pass plus direct verification disproved that:

| Claim in draft 1 | Verified reality | Evidence |
|---|---|---|
| Story journal records entity IDs | `entity_ids: []` is written unconditionally | `holonovel/src/index.ts:8006` (sole assignment) |
| `lore://groups` exists | No such resource is registered | `holonovel/src/index.ts:11726-11728`, `:12493-12984` list only `lore://active`, `lore://{key}`, `lore://templates` |
| Lore token budget is enforced | `TTRPG_MAX_LORE_TOKENS` is read into `maxLoreTokens` and never consumed | `holonovel/src/core/state.ts:1000,1049-1053`; zero other reads repo-wide |
| Character sheet renders known secrets | `fmtEntitySheet` has no "Known Information" section | `holonovel/src/index.ts:3128-3150` |
| `resolve_mechanic.table` enumerates generation tables | Static `z.string()`; no in-tree D&D 5e package; `test-backfill` boots ruleset-free | `holonovel/src/index.ts:7940`; `holonovel/scripts/test-backfill.ts:67-70,298` |
| Synthesis auto-activates on adventure load | `run` installs the static `DEFAULT_WISDOM` manifest | `holonovel/src/index.ts:13561-13572` |
| REQ-082a/b carry a `_Check:_` line | They carry none; only 082c does | `spec/02-requirements.md:2607,2610,2613` |

Therefore this increment is **probe-first**: it commits an assertion only where
the assertion passes, and converts every failure into a precise, scheduled
remediation finding instead of a false citation repair. No production source
change is planned.

## 1. Objective

Shrink the first open `ROADMAP.md` section (**§5.2/§5.8 assertion repair,
P1**) to exactly the findings that need implementation work, and close the
rest with real harness evidence.

**Done bar**

1. Every new test committed passes in its harness.
2. Every one of F-P7b-1 … F-P7b-9 has a terminal disposition: `Resolved` with
   a `file:line` exercising test, or `Scheduled-roadmap` under a named roadmap
   section with the failing predicate recorded.
3. `ROADMAP.md`'s §5.2/§5.8 section lists only the findings that remain, and
   its `**Trigger:**` matches the new set.
4. For F-P7b-8: REQ-082a gains `_Check:_ T66.`, REQ-082c cites `T66` only, and
   REQ-082b gains `_Check:_ T205.` (the builder-side row that actually matches
   its documentation contract).
5. `npm run assemble` + `npm run build-order` complete; generated artifacts
   (`holonovel.md`, `holonovel/holonovel.md`, contract fingerprints, version
   files) are committed with the spec edit.
6. `check:fast`, `check-registers`, `check-loop-artifacts` pass; CHANGELOG
   entry present; AAR records a terminal loop token.

## 2. Verified baseline

- HEAD `048fb5e`, 21 unpushed, 21 roadmap items; only the untracked increment
  directory `docs/plans/2026-11-09-5-2-5-8-assertion-repair/` is uncommitted.
- `npm run check:fast` → `EXIT=0`, `check:fast: PASS` (37/37).
- No harness title carries T282, T67, T79, T81, T82, T83, T94, T95, T97, T102,
  T288, T135, T136, T144, T274, T68, T205, T255 (`grep -rn` under
  `holonovel/scripts` → 0 hits). `T66` is carried by
  `holonovel/scripts/test-backfill.ts:811`.
- All 24 IDs are present as Appendix F rows.
- Harness conventions: `test-narrative.ts` and `test-backfill.ts` share a
  `boot()`/`call(proc, …)`/per-`test()` counter; `test-output-contracts.ts`
  boots per test and counts per assertion (`passed++` inside its assert
  helpers).
- `npm run assemble` is the only way to refresh `holonovel.md`; a `spec/`
  edit therefore triggers the full `build-order` sync (precedent:
  `5c73f7e` changed `spec/`, `holonovel.md`, fingerprints, `package.json`,
  `holonovel/package.json`, `holonovel/server.json`).

## 3. Gate depth and rollback

- **Standard.** Multiple harness files, one spec citation edit, two registers,
  generated artifacts. No destructive or remote operation.
- **Rollback cost: 1** — every edit is reversible. Backout: `git checkout --`
  the touched paths, or `git revert` the single commit. The spec edit is a
  three-line citation change; reverting it requires only re-running
  `assemble` + `build-order`.

## 4. Probe-first method (applies to every finding)

For each finding, in this order:

1. Write the assertion(s) for the **full** Appendix F row — not the subset the
   draft named — into the target harness.
2. Run the target harness.
3. **Pass** → keep the test, mark the finding `Resolved` with the title and
   file:line.
4. **Fail** → do not weaken the assertion to match current behaviour. Delete
   the failing test, record the finding as `Scheduled-roadmap` with:
   - the exact predicate that fails (`file:line` of the source),
   - the REQ that requires it,
   - the work needed (one line of prose, not an estimate),
   and add it to the roadmap section `## §5.2/§5.8 {theme} remediation (P1)`.

A probe is not "write and delete silently": the failure evidence is recorded in
the review register, so the roadmap keeps an auditable reason.

## 5. Work items

### 5.0 Phase 0 — increment scaffolding

Create `docs/plans/2026-11-09-5-2-5-8-assertion-repair/tasks.md` and a stub
`aar.md` before the first probe. `tasks.md` mirrors §7's table plus a probe
matrix (finding → probe → outcome). `check-loop-artifacts` requires both files
and a terminal loop token in the AAR.

### 5.1 F-P7b-8 — prompt-ordering citations (spec-only, no probe needed)

**File:** `spec/02-requirements.md`.
- REQ-082a: append ` _Check:_ T66.` to the body (it has none today).
- REQ-082c: change `_Check:_ T66, T205.` → `_Check:_ T66.`
- REQ-082b: append ` _Check:_ T205.` — T205
  (`spec/appendices-reference.md:1605`) is the builder-side DECISIONS.md
  section-token assertion; it covers 082b's documentation half (the mapping and
  default ordering), not the runtime ordering, which T66 covers for 082a/082c.
  This makes each citation explicit instead of lending a builder-side test to
  the runtime REQs.

`npm run assemble` then `npm run build-order`; commit the generated artifacts.

### 5.2 F-P7b-4 — scene tagging and transition hook (probe; expected pass)

**File:** `holonovel/scripts/test-backfill.ts` (scene block) and
`holonovel/scripts/test-narrative.ts` (beside T404 at `:404`).

Full rows:
- **T135** (`REQ-087a–c`): `["social","exploration"]` orders both families
  before unmatched; single `"exploration"` matches the string behaviour;
  `["nonexistent"]` → `[ERROR] [NOT_FOUND]` with valid values; Player →
  `[FORBIDDEN]`.
- **T71** (`REQ-087a–c`): `social` prioritizes social tools and
  `run_command (action: suggest, "talk")` yields social actions; combat init
  restores combat priority; unknown type → `[NOT_FOUND]` with enumeration.
- **T136** (`REQ-125a–b`): `forest` → `cave` writes a `[scene-transition]`
  audit entry naming both descriptions; a countdown with
  `on_scene_transition: true` decrements; `skip_transition_hook: true` writes
  no audit entry; Player sees `scene://history` but not the GM-only mechanics.

### 5.3 F-P7b-6 — proactive and reactive suggestions (probe; expected pass)

**File:** `holonovel/scripts/test-backfill.ts` (beside the suggest block at
`:455`).

Full rows:
- **T359** (`REQ-084a1–a3`, `REQ-084b1–b3`): wizard with 3rd-level slots;
  combat scene → `## Available Actions` lists weapon and spell actions; "Cast
  Fireball" only while a slot remains; social scene → persuasion/deception;
  `run_command (action: suggest, "fight")` still reactive; at most 8 actions.
- **T68** (`REQ-084b4`): combat intent → combat tools with names and parameter
  hints; empty intent → context-relevant list; nonsense intent → empty list;
  no GM-only tool under Player; ambiguous social intent → multiple tools;
  synthesis-active patterns appear beside registry matches.

### 5.4 F-P7b-3 — synthesis run/revert/rebuild (probe; partial expected)

**File:** `holonovel/scripts/test-backfill.ts` (synthesis block `:300-480`,
`:880-960`).

Probe rows in this order, keeping each that passes: **T63**, **T95**, **T97**,
**T102**, **T94**, **T144**, **T288**. T288 is the likely failure (synthesis
`run` installs a static manifest, `holonovel/src/index.ts:13561-13572`) and is
expected to become a scheduled remediation finding.

### 5.5 F-P7b-7 — synthesis removal and confidence (probe; partial expected)

**File:** `holonovel/scripts/test-backfill.ts` (synthesis block).

Rows: **T324** (revert empties supplementary items, preserves Tier 1,
idempotent, Player `[FORBIDDEN]`), **T325** (`[supplementary] [MEDIUM]` from
explicit personality, `[LOW]` from inference, `collected_at` refresh).

### 5.6 F-P7b-2 — lore lifecycle, groups, suggest, budget (probe; partial expected)

**File:** `holonovel/scripts/test-narrative.ts` (lore block `:693-799`).

Rows: **T67**, **T79**, **T82** are expected to pass. **T81** (`lore://groups`)
and **T83** (`TTRPG_MAX_LORE_TOKENS` enforcement plus `spec_health` reporting)
are expected to fail on the verified gaps and become scheduled findings.

### 5.7 F-P7b-1 — story journal (probe; expected fail)

**File:** `holonovel/scripts/test-output-contracts.ts`.

Probe **T282** for the full row. The `entity_ids` assertion is expected to fail
(`holonovel/src/index.ts:8006`). Record the gap; do not edit `holonovel/src`.

If the probe reveals that the rest of the row passes except entity attribution,
the finding is still scheduled as one item, with the passing sub-assertions
noted in the register so the remediation is known to be one line plus a test.

### 5.8 F-P7b-5 — secrets and knowledge (probe; partial expected)

**File:** `holonovel/scripts/test-narrative.ts` (beside `:784-799`).

Probe **T274** in two parts: the `knowledge` half (`holonovel/src/index.ts:7134`,
implemented) and the character-sheet "Known Information" half (absent). Commit
the passing half under `T274` only if a single test title can honestly carry it;
otherwise schedule the whole row.

### 5.9 F-P7b-9 — table classification (no probe; verified unimplementable here)

Do not write T255. Record as `Scheduled-roadmap`: the `table` parameter is a
static `z.string()` (`holonovel/src/index.ts:7940`), REQ-214c requires a
dynamic generation-table enum, and no D&D 5e package exists in-tree
(`.gitignore` excludes `scripts/ruleset-builds/`; F-P6b-7). Schedule under a
new roadmap section `## §5.2/§5.8 table-classification remediation (P1)`.
The gaps found by probes in §5.6 (T81 groups, T83 budget) and §5.4 (T288
auto-activation) stay in the existing §5.2/§5.8 assertion-repair section under
their own sub-bullets, because they are the same contracts the section already
names, not table classification.

## 6. Registers, roadmap, changelog

1. `npm run validate -- --write-register` after the probes settle.
2. `spec/audit/review-register.md`: for each finding, move the row to
   `Resolved` (with exercising test title + `file:line`) or keep it under
   `Scheduled-roadmap` with the failed predicate. Rewrite the nine bullets'
   section attribution to the new roadmap section names.
3. `ROADMAP.md`: rewrite the §5.2/§5.8 section to contain only the remaining
   findings, and add `## §5.2/§5.8 table-classification remediation (P1)` for
   F-P7b-9 only. Every finding kept on the roadmap or moved must keep its REQ
   tokens in the section bullet — `check-registers`
   (`scripts/lib/register-checks.ts:64-70`) flags a register row whose REQ
   tokens no roadmap section carries. Keep each section to 1–3 bullets plus
   `**Trigger:**` (admission rule).
4. `CHANGELOG.md`: one dated entry stating which findings closed, which were
   rescheduled and why.
5. `docs/plans/2026-11-09-5-2-5-8-assertion-repair/tasks.md` and `aar.md` are
   created during Phase 0 (the AAR starts as a stub and is completed before the
   commit; `check-loop-artifacts` requires both).

## 7. Verification

| Step | Command | Pass condition |
|---|---|---|
| Phase 1 | `npm --prefix holonovel run test:output-contracts` | exit 0 |
| Phase 1 | `npm --prefix holonovel run test:narrative` | exit 0 |
| Phase 2 | `npm --prefix holonovel run test:backfill` | exit 0 |
| Spec | `npm run assemble` | exit 0, `holonovel.md` refreshed |
| Sync | `npm run build-order` | exit 0; generated artifacts consistent |
| Registers | `npm run check-registers` | exit 0 |
| Loop | `npm run check-loop-artifacts` | exit 0 |
| Full fast | `npm run check:fast` (unpiped) | `check:fast: PASS` |
| Close | `npm run session:close` | one commit, fast suite green |

Each committed test is proven by its own harness run before any register row
claims it.

## 8. Failure handling

- **Harness test fails after two fix attempts** → treat as a probe result
  (§4.4): delete the test, record the gap, continue. This is the normal path,
  not an error.
- **A probe reveals a one-line source gap** → do **not** fix it in this
  increment; schedule it. (Keeps the increment free of production-source
  changes and keeps the assertion honest.)
- **`build-order` reports a check failure** → stop; fix as a separate baseline
  commit if unrelated, otherwise abort-and-pause.
- **A test ID collides with an existing title** → stop, re-read Appendix F, and
  record the collision; do not rename without evidence (P2 hygiene class).

## 9. Blast radius

| File | Change | Size |
|---|---|---|
| `holonovel/scripts/test-backfill.ts` | T63/T95/T97/T102/T94/T144/T288/T135/T71/T359/T68/T324/T325 (subset that passes) | L |
| `holonovel/scripts/test-narrative.ts` | T67/T79/T81/T82/T83/T274/T136 (subset that passes) | L |
| `holonovel/scripts/test-output-contracts.ts` | T282 (if it passes; otherwise none) | M |
| `spec/02-requirements.md` | REQ-082a/b/c `_Check:_` citations | S |
| `holonovel.md` (generated) | re-assembled | S |
| `holonovel/holonovel.md` (generated) | propagated | S |
| `holonovel/src/generated/contract-fingerprints.ts` | only if `build-order` reports drift | S |
| `package.json`, `holonovel/package.json`, `holonovel/server.json`, lockfile | only if `build-order` advances the CalVer | S |
| `spec/audit/review-register.md` | 9 dispositions | M |
| `spec/audit/req-coverage.md` | regenerated | M |
| `ROADMAP.md` | section rewrite | S |
| `CHANGELOG.md` | dated entry | S |
| `docs/plans/2026-11-09-5-2-5-8-assertion-repair/{plan,tasks,aar}.md` | increment artifacts | S |

No `holonovel/src/**` behavioural change is planned. `build-order` is the
authority on which generated files move; anything it reports as changed joins
the commit.

## 10. Commit plan

One commit (spec increment). If the session cap is reached after Phase 1, commit
the passing harness work alone with its own register/roadmap update and re-plan
the rest; never remove a roadmap finding that is not terminal.

## 11. Alternatives considered

- **Write every assertion and accept red harnesses** — rejected: a committed
  failing gate blocks every other session.
- **Weaken assertions to match current behaviour** — rejected: it manufactures
  the exact false-citation defect this roadmap item exists to remove.
- **Fix the four gaps (entity_ids, groups, budget, sheet section) in this
  increment** — deferred: it is a remediation program, not assertion repair, and
  each gap needs its own REQ-level review. Scheduled instead.
- **Re-point partial findings to neighbour tests** — rejected for the partial
  cases: a neighbour test that does not exercise the stated contract is the
  defect.
