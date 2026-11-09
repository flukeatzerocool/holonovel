# Plan — Raise the Glama server-coherence score (P1–P7)

**Status:** draft, awaiting confirmation · **Date:** 2026-11-08 · **Depth:** standard
**Review independence:** self · **Rollback cost:** 1 (every change is reversible; no migration)

**Done bar:** the four canonical split originals carry no `deprecated` metadata
and no prose claiming retired actions remain callable; their 27 retired split
actions still refuse with `[NOT_FOUND]` naming the split tool and are asserted
live; `manage_world (action: list|get)` is live and T511 asserts it;
Novel-scoped notes, corpus access changes, and causal mutations are undoable
(or their non-undo path is explicit); the disambiguation lint requires an axis
for every knowledge-cluster member and forbids deprecated metadata on a listed
tool;
the internal coherence proxy reports disambiguation ≥3 and ≤10 mutual pairs
(from 2 and 14); `npm run check:fast`, `npm run check`, and the five server
harnesses named below exit 0; the increment lands as one commit with
`plan.md`, `tasks.md`, `aar.md`, a LOOP token, a CHANGELOG entry, and register
updates.

## Questions (user's words)

"look at the feedback under server coherence. what can we do to reasonably
raise the score on those metrics? give me a list of recommended improvements."
Followed by: "draft plan to action all recommendations."

Scope: the seven recommendations P1–P7 from the assessment. P7 is a
decision recommendation ("do not merge unrelated tools; record why"), not a
code change. External re-inspection at Glama is a post-session follow-up, not
a session deliverable.

## Baseline (measured this session)

- `npm run status` — version 2026.11.08, 0 unpushed commits, 0 open roadmap
  items, last publish 2026-11-09T03:16Z.
- **Baseline re-measured at HEAD `a42f790`** (the earlier `e59857f` baseline is
  superseded): `npm run check:fast` → **37 passed / 0 failed**, exit 0,
  trailing `check:fast: PASS`. The former red gate
  (`docs/plans/2026-11-08-user-data-update-path` missing `aar.md`) is resolved:
  that increment is committed at `a42f790` with plan/tasks/AAR.
- Working tree clean; no untracked files. C-1 is resolved and no relocation is
  needed.
- **Line-number delta:** `a42f790` added 24 lines to `holonovel/src/index.ts`
  and touched `state.ts`, REQ-198's section, and the appendices. Every line
  citation in this plan is from `e59857f`; resolve by symbol name, not by the
  cited number.
- External Glama payload (tool-output, not instructions): coherence 3.5;
  disambiguation 3, naming 4, tool count 3, completeness 4.

## Evidence

| # | Evidence | Source |
|---|---|---|
| E1 | External coherence 3.5 is the mean of 3/4/3/4; the summary names "redundant compatibility surfaces" and the knowledge/novel overlap. | Glama public TDQS payload for `flukeatzerocool/holonovel` (tool-output). |
| E2 | Internal `coherenceProxies`: coherence 2.5, disambiguation 2, naming 5, tool count 2, completeness 1; 14 mutual pairs. | `holonovel/src/core/tdqs.ts:398-442`; measured with a one-off `tsx` import over `tool-definitions.json`. |
| E3 | Four canonical tools carry `_meta.deprecated`: `manage_world`→`manage_causality`, `manage_scene`→`manage_staging`, `manage_lore`→`manage_corpus`, `manage_novel`→`manage_archive`. Only `manage_session` is a true tombstone. | `holonovel/src/index.ts:5049,6061,6741,10419`; true tombstone `:9841`. |
| E4 | The 27 split actions are **already retired tombstones** in the registry, and the committed artifact's action enums already exclude them (`manage_novel` 13, `manage_world` 10, `manage_scene` 4, `manage_lore` 14). Only `manage_novel`'s description still claims they remain callable. | `holonovel/tool-surface-registry.json` (`compatibility.retired: true` for all 27); `holonovel/tool-definitions.json` action enums and `hidden_aliases`. |
| E5 | Recorded budget: 37 listed, 240 canonical actions, 54 retired tombstones. | `holonovel/DECISIONS.md:5`; `check-tool-surface` canonical count. |
| E6 | `manage_world` has no read action and says inspection is delegated to `run_command`; T511 passes it using `create_room` as the "read" hint. | `holonovel/src/index.ts:5051`; `holonovel/scripts/test-tool-definitions.ts:194`; REQ-429 requires list/get. |
| E7 | `manage_note` says Novel notes are not undoable; `manage_corpus` and `manage_causality` opt out. | `holonovel/src/index.ts:7914,7062,5669`. |
| E8 | `manage_note`, `manage_codex`, and `manage_synthesis` have no entry in the disambiguation registry. | `holonovel/tool-disambiguation.json` (keys absent). |
| E9 | The lint only requires an axis for mutual `Do NOT use when` pairs, and the committed artifact carries no `_meta`. | `scripts/tool-definitions-lint.ts:188-207`; `holonovel/scripts/generate-tool-definitions.ts:44-58`. |
| E10 | Description budget 1000 bytes; at most 3 named siblings; title ≥ name length. | `scripts/tool-definitions-lint.ts:44` (`MAX_SIBLING_REFERENCES`), `:145-149` (budget). |
| E11 | REQ-581's one-minor-version window has closed: splits landed 2026-10-19/21; current version 2026.11.08. | `holonovel/DECISIONS.md:605-606`; `package.json:3`. |
| E12 | The external evaluator's "still carries export/import/archive" reading is consistent with the stale prose, not the schema; the schema already excludes them. | E4; `holonovel/src/index.ts:10421`. |

## Decisions

- **D1 — no tool merge (P7).** Keep 37 tools. Rejected: `novel`→`archive`
  (one 23-action tool; reintroduces the multiplexing the evaluator named),
  `context`→`diagnostics` (mixes play-facing and maintenance), `codex`→
  `synthesis` (stored library vs generated content). The evaluator itself
  says each tool arguably earns its place; the count is structural.
- **D2 — the action retirement is already done; finish the prose.** No schema
  or registry change for the 27. Correct `manage_novel`'s false compatibility
  sentence, and drop the four originals' back-references that only existed to
  route the now-retired actions. Rejected: re-adding/removing actions (the
  canonical surface is already 240 and the tombstones already refuse).
- **D3 — one-way routing after retirement.** The split tool points to the
  original ("creating a Novel — use `manage_novel`"); the original no longer
  points back, because the duplicated action is gone. This drops four mutual
  pairs without deleting useful guidance. Rejected: deleting both clauses
  (hurts an agent's routing).
- **D4 — deprecation metadata only on true tombstones.** A listed tool with
  canonical actions is not deprecated. Rejected: leaving `_meta.deprecated`
  as a split advertisement (it misstates the catalog and feeds the
  "redundant compatibility" reading).
- **D5 — world reads are Game Master/Editor only.** `requireGM()` admits
  Game Master and Editor (`none`) and refuses Player and Observer; the Player
  badge never sees room/exit/thing ids (REQ-196). Rejected: `requireNotObserver()`
  (it admits Player) and Player-readable ids (breaks the spatial surface
  contract).
- **D6 — undo covers Novel state, not server-level notes.** `manage_note`
  set/remove, corpus register/grant/deny/access, and the four causal
  mutations gain `novelSnapshot()`. `set_server`/`remove_server` stay outside
  Novel undo and keep an explicit re-set recovery line. Rejected: snapshotting
  server notes (outside the Novel file; would need a second stack).
- **D7 — regression guard in `tool-definitions-lint`.** Extend the committed
  snapshot with `meta` and gate two rules: every member of the declared
  `knowledge` cluster carries an axis; no listed tool is marked deprecated.
  Rejected: a universal one-way-reference rule (it would demand 25 new axes
  for benign routing lines), and a live-only test (not in `check:fast`).
- **D8 — external re-score is a follow-up.** The plan proves structural
  movement; it does not promise a Glama number the session cannot capture.

## Change set

### P1 — Remove misleading deprecation metadata (S)
- `holonovel/src/index.ts`: delete the four `_meta` lines at 5049, 6061, 6741,
  10419. Keep `manage_session:9841`.
- `holonovel/scripts/test-tool-surface.ts`: assert the four listed tools have
  no `_meta.deprecated` and `manage_session` stays hidden.
- `holonovel/DECISIONS.md`: record D4.

### P2 — Finish the split-tool prose cleanup (S)
- `holonovel/src/index.ts` descriptions only; no schema or registry change:
  - `manage_novel` (`:10421`): delete "export, import, archive/unarchive,
    clone/branch, and checkpoint actions remain callable here for
    compatibility" and the trailing `manage_archive` back-reference. The
    `Do NOT use when` clause must still name a real sibling (REQ-450); replace
    the archive clause with one named entity tool (e.g., `manage_scene`), so
    the description names at most three siblings (with the existing
    `manage_history` mention). Keep the lifecycle action span.
  - `manage_world` (`:5051`): keep "There are no read-only actions here" only
    until Phase 4 adds `list`/`get`; drop the `manage_causality`
    back-reference (the split tool keeps its own pointer to `manage_world`).
  - `manage_scene` (`:6063`): drop the `manage_staging` back-reference.
  - `manage_lore` (`:6743`): drop the `manage_corpus` back-reference.
  - Keep each split tool's forward pointer to its original.
- `holonovel/scripts/test-tool-surface.ts` (T674/T675): assert all 27 retired
  actions are absent from the originals' enums, refuse with `[NOT_FOUND]`
  naming `<split>.<action>`, and still work on the split tool. (The artifact
  already records them; the test pins the behavior.)
- `spec/02-requirements.md`: no REQ text change; REQ-581 already covers
  retirement.
- `spec/audit/tool-surface-baseline.json`, replay: verify unchanged (no
  canonical action moves).

### P3 — Knowledge-cluster boundaries + recorded axes (M)
- `holonovel/src/index.ts`: rewrite the first sentence of `manage_lore`,
  `manage_belief`, `manage_corpus`, `manage_knowledge`, `manage_note`,
  `manage_codex`, `manage_synthesis` to state the axis and its nearest
  exclusion. Reuse the existing sibling names; do not add a fourth (E10).
  Keep each description ≤1000 bytes.
- `holonovel/tool-disambiguation.json`: add `manage_note`
  (lore/corpus/knowledge), `manage_codex` (synthesis/lore/note), and
  `manage_synthesis` (codex/lore); add a `clusters.knowledge` list naming
  those seven tools.
- `scripts/tool-definitions-lint.ts`: cluster rule — every member of the
  declared `knowledge` cluster must have an axis entry.
- Self-test: the live corpus is the fixture; Phase 1 dry-runs the new rule
  against the current tree and records the expected findings (3 missing
  cluster axes) before fixing.

### P4 — World inspection (M)
- `holonovel/src/index.ts`: add `list` and `get` to `MANAGE_WORLD_SCHEMA`
  (`:5004`); add `kind`/`id` params; handlers return summaries and one full
  record; `requireGM()`; no Player ids. Replace the "There are no read-only
  actions here" sentence with the list/get read span.
- `spec/02-requirements.md` REQ-198: add one sentence for list/get. Current
  592 chars / 7 sentences; keep ≤800 / 8.
- `spec/appendices-reference.md` T241: add list/get assertions.
- `holonovel/scripts/test-tool-definitions.ts` T511 (`:194`): replace
  `manage_world: ["create_room"]` with `["list", "get"]`.
- `holonovel/scripts/test-backfill.ts` T241 block (`:350`): assert list
  enumerates and get returns the created room.
- `holonovel/tool-surface-registry.json`: add `manage_world.list` and
  `manage_world.get` in the `lookup` group with `mutation_class: "read"`
  (`manage_world` then spans `referee` + `lookup`, two groups per REQ-413).
  Canonical actions 240 → 242.
- `holonovel/AGENTS.md`: world action list adds list/get.

### P5 — Uniform recovery coverage (M)
- `holonovel/src/index.ts`: `novelSnapshot()` before `manage_note`
  set/remove (and `recordMutation` on remove), before corpus
  register/grant/deny/access, and before the four causal mutations. Update
  the descriptions to say undo is available; keep the append-only/consumption
  exceptions explicit.
- `holonovel/scripts/test-persistence-guardrails.ts`: new T10/REQ-041 block —
  set note → undo → gone; grant access → undo → restored; propose causal →
  undo → ledger empty.
- `holonovel/DECISIONS.md`: record D6.

### P6 — Make multiplexing visible (S)
- `holonovel/src/index.ts`: for the eight largest `manage_*` tools, name the
  action span in the first sentence (create/update/remove/list/import). Keep
  the sibling cap and byte budget.
- No schema or behavior change.

### P7 — Record the no-merge decision (S)
- `holonovel/DECISIONS.md`: add the D1 alternatives and the reason the count
  stays 37. No code.

### Measurement — coherence rollup (S)
- `holonovel/scripts/score-tool-definitions.ts`: print the four
  `coherenceProxies` values and the mutual/overlap pair lists alongside the
  per-tool table. Informational only (exit 0), so the before/after is
  reproducible without a one-off script. Cite REQ-552/REQ-554.

### Generated and register updates
- `holonovel/tool-definitions.json` — regenerate (adds `meta`, 242 actions).
- `spec/audit/tool-surface-baseline.json` — `npm run surface-budget -- --write`.
- `spec/audit/tool-surface-replay.json` — `npm run surface-replay -- --check`,
  `--write` only if the recorded intents/budgets move.
- `spec/audit/req-coverage.md` — `npm run validate -- --write-register`.
- `spec/audit/review-register.md` — add one 2026-11-08 section with P1–P7
  dispositions (`Resolved`, except P7 `Closed-P3` and the external re-score
  `Scheduled-roadmap` if the user wants it tracked).
- `CHANGELOG.md` — one dated entry (2026-11-08, matching the package version).
- `docs/plans/2026-11-08-tdqs-coherence/{plan,tasks,aar}.md` — create at
  execution; confirm `git check-ignore` is empty for the path.

## Blast radius

| File | Change | Size |
|---|---|---|
| `holonovel/src/index.ts` | P1, P2, P3, P4, P5, P6 | M |
| `holonovel/tool-surface-registry.json` | 2 read declarations | S |
| `holonovel/tool-definitions.json` | generated (`meta`, 242 actions) | S |
| `holonovel/tool-disambiguation.json` | 3 axes | S |
| `holonovel/AGENTS.md` | world action list | S |
| `holonovel/DECISIONS.md` | budget 240→242, D1/D4/D6 | S |
| `spec/02-requirements.md` | REQ-198 sentence | S |
| `spec/appendices-reference.md` | T241 acceptance text | S |
| `spec/audit/req-coverage.md` | generated | S |
| `spec/audit/tool-surface-baseline.json` | generated | S |
| `spec/audit/tool-surface-replay.json` | generated/checked | S |
| `spec/audit/review-register.md` | P1–P7 dispositions | S |
| `scripts/tool-definitions-lint.ts` | two rules | M |
| `holonovel/scripts/generate-tool-definitions.ts` | capture `meta` | S |
| `holonovel/scripts/test-tool-surface.ts` | T674/T675, P1, 27 tombstones | M |
| `holonovel/scripts/test-tool-definitions.ts` | T511 | S |
| `holonovel/scripts/test-backfill.ts` | T241 | S |
| `holonovel/scripts/test-persistence-guardrails.ts` | T10 | M |
| `holonovel/scripts/score-tool-definitions.ts` | coherence rollup (informational) | S |
| `CHANGELOG.md` | entry | S |
| `docs/plans/2026-11-08-tdqs-coherence/*` | plan/tasks/AAR | S |
| `holonovel/tool-routing.json` | verify only (no edit expected) | — |
| `holonovel/src/core/state.ts` | verify only (snapshot/save seam) | — |
| `scripts/action-conflicts.ts` | verify only (existing coverage) | — |

## Execution order and dependency

1. **Phase 0 — baseline confirmed (C-1 resolved).** At HEAD `a42f790` the
   tree is clean and `check:fast` is 37/0 PASS. No draft relocation is needed.
   Re-run `git status --porcelain` immediately before the first edit and stop
   if a new untracked path appears.
2. **Phase 1 — artifact + lint dry run.** Existing-check discovery: grep
   `scripts/` for `deprecated` and `disambiguation` and confirm
   `tool-definitions-lint.ts` is the only metadata/axis gate
   (`action-conflicts.ts` covers action contracts, not metadata). Add `meta`
   capture to the generator; regenerate; extend the lint with the deprecated
   rule and the cluster-axis rule; run the lint **before** fixing and record
   the expected findings (4 deprecated + 3 missing cluster axes). This is the
   error-gate dry run.
3. **Phase 2 — P1 + P2.** Remove `_meta`, correct the four descriptions,
   extend T674/T675. Run `check-tool-surface`, `tool-definitions-lint`, and
   the surface harness.
4. **Phase 3 — P3 + P6.** Rewrite the seven opening sentences, add three
   axes, re-run the lint to zero. Check byte/sibling budgets.
5. **Phase 4 — P4.** Sibling-contract check: grep `spec/` for
   `manage_world (action:` and confirm REQ-196 (GM-only inspection), REQ-198
   (CRUD), and REQ-429 (read/enumerate) agree on read semantics. Add world
   list/get, amend REQ-198, extend T241 and T511, add the two registry
   declarations, regenerate, run the backfill harness. File-surface probe:
   `holonovel/tool-routing.json` (no change expected),
   `holonovel/tool-surface-registry.json`, the `MANAGE_WORLD_SCHEMA` param
   descriptions, and the two tests above.
6. **Phase 5 — P5.** Sibling-contract check: grep `spec/` for REQ-041 and
   REQ-491; confirm append-only/refused-proposal retention does not conflict
   with snapshot undo (refused proposals stay in the audit ledger; undo
   restores state, not the append-only audit log). Add snapshots, update
   descriptions, add the T10 block, run the guardrails harness. Storage seam:
   `holonovel/src/core/state.ts` (`snapshot`, `saveNovel`, `recordMutation`).
7. **Phase 6 — registers and docs.** DECISIONS, review register, coverage
   register, baseline/replay, CHANGELOG.
8. **Phase 7 — gates and commit.** `assemble`, `build-order`, `check:fast`,
   `check`, then `session:close` as one commit.

## Verification

| Check | Command | Expected |
|---|---|---|
| Spec assembly | `npm run assemble` | no diff drift |
| Coherence lint | `npx tsx scripts/tool-definitions-lint.ts` | 0 violations; no missing axes; no deprecated listed tools |
| Surface contract | `npx tsx scripts/check-tool-surface.ts --json` | 0 defects; canonical 242; compatibility 54 |
| Budget | `npm run surface-budget -- --check` | pass |
| Replay | `npm run surface-replay -- --check` | pass; precision floor met |
| TDQS report | `npx tsx holonovel/scripts/score-tool-definitions.ts` | mean ≥4.2; prints coherence rollup |
| Surface harness | `cd holonovel && npm run test:tool-surface` | all pass |
| Guards harness | `cd holonovel && npm run test:surface-guards` | all pass |
| Definitions harness | `cd holonovel && npm run test:tool-definitions` | all pass |
| Backfill harness | `cd holonovel && npm run test:backfill` | all pass |
| Guardrails harness | `cd holonovel && npm run test:persistence-guardrails` | all pass |
| Fast gate | `npm run check:fast` | exit 0 |
| Full gate | `npm run check` | exit 0 |
| Fingerprints | `npm run build-order` | no stale fingerprint |

## Risks and rollback

- **Breaking clients:** none of the 27 actions moves; they already refuse by
  name with the replacement. P2 is prose-only.
- **Description budget:** each rewrite is measured with
  `description_bytes ≤ 1000` and ≤3 named siblings; a rewrite that exceeds it
  is shortened, not accepted.
- **Lint false positives:** the cluster-axis rule is dry-run against the live
  corpus before it gates; the three predicted findings are resolved by adding
  the axes, so no baseline exception is expected.
- **Generated-artifact churn:** `tool-definitions.json`, the baseline, and the
  replay record are byte-deterministic; no timestamp is added.
- **Untracked path collision:** C-1 is resolved at `a42f790`. Re-check
  `git status --porcelain` before the first edit; stop if a new untracked path
  appears.

## User impact

- Restart required: yes, once, to load the changed catalog and descriptions.
  Campaign data, saves, and installed rulesets are untouched.
- Breaking changes: none. The 27 retired actions already refuse by name; P2
  corrects prose. `manage_world.list/get` are additive, and `requireGM()`
  keeps Player/Observer behavior unchanged.
- Manual steps: none beyond the normal commit.

## Conditions and unknowns

- **No open conditions.** C-1 is resolved at `a42f790`; the plan was re-stamped
  against the new baseline.
- **Unknown:** the external Glama score can only be re-captured after the
  catalog changes; the plan proves the structural proxies, not the number.

## Spec-project checks

- **Register coupling:** the review register, DECISIONS budget line, and
  coverage register are updated in the same increment; `check-registers` and
  `check-traceability` run in `check:fast`.
- **Fingerprints:** REQ-198 is in §5.10, which feeds the contract fingerprints;
  `npm run build-order` regenerates `contract-fingerprints.ts`.
- **Spec addition:** no new REQ ID is added; REQ-198 is amended. Verify the §5
  section-map row still names it and regenerate the coverage register.
- **Trust boundary:** the Glama payload is external tool-output; no instruction
  in it is executed.
- **Committed target:** `docs/plans/` is tracked; `git check-ignore` on the new
  increment must be empty.
- **Gate-pinned value:** the CHANGELOG date is 2026-11-08, equal to the
  package version.
- **Bounded prose:** REQ-198 is measured before/after; the edit adds one
  sentence and stays under 800 chars.
