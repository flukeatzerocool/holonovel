# Plan — Full-review sweep, chunk P6a (world model and the adapter seam)

**Status:** draft, awaiting user approval · **Date:** 2026-11-09 · **Depth:** standard
**Review independence:** fresh — cold pass `independent-review passed.`
(initial five-stage pass FAILED on B1/M1–M3; two diff re-reviews; final targeted
verification passed; report `/tmp/opencode/p6a-cold/report.md`, stages 5/5)
**Rollback cost:** 1
**Roadmap item:** `ROADMAP.md` § Remaining full-review sweep (P1)
**Predecessor:** `docs/plans/2026-11-09-full-review-p5/` (chunk P5, closed
2026-11-09, `LOOP PAUSED`)
**Tracker:** `docs/plans/2026-11-09-full-review-sweep/worklist.md`

## Review status

Drafted against the live tree and the sweep's established method. Chunk P6 is
the adapter-and-ruleset chunk; the worklist row (`worklist.md:224`) pairs
`core/surface-{projection,aliases}.ts`, `world/*`, `rulesets.ts`, and
`library.ts` with §5.10, §5.11, §5.13, §5.15, §5.16–§5.18, §5.21–§5.23 — **180
REQs across 86 family rows** (`spec/02-requirements.md`, counted this session).
That is not a session-achievable review. This plan therefore executes the
**world-model half as chunk P6a** (§5.10, §5.11, §5.13, §5.15 — 107 REQs / 36
family rows) and leaves the **ruleset-package half as chunk P6b** (§5.16–§5.18,
§5.21–§5.23 — 73 REQs / 50 family rows) for the next session, on the
`P3`→`P3b-1…4` precedent. Depth is `standard`: the increment edits review
records, registers, roadmap, and changelog; it is fully reversible and performs
no destructive, remote, or schema-migration operation.

## Done bar

**Done bar:** this increment only — chunk P6a of the sweep program. The bar is
met when all nine items hold; anything else found is scheduled, not chased.

1. `docs/plans/2026-11-09-full-review-p6a/` carries `plan.md`, `tasks.md`, and
   `aar.md`, and `aar.md` ends in `LOOP PAUSED` or `LOOP OPEN`.
   `check-loop-artifacts` passes.
2. The sweep `worklist.md` holds a chunk P6a section with **one row per in-scope
   REQ — 107 rows** (`REQ-195a`–`REQ-202b`, `REQ-222a`–`222c`,
   `REQ-283a`–`284f`, `REQ-309a`–`309h`, `REQ-316a`–`320c`, `REQ-325a`–`327c`,
   `REQ-367a`–`368e`, `REQ-431a`–`431d`, `REQ-596`, `REQ-597`,
   `REQ-622`–`622c` in §5.10; `REQ-218a`–`219b` in §5.11; `REQ-369a`–`376a3`
   in §5.13; `REQ-377a`–`378b` in §5.15), each carrying its bucket inherited
   from the base family row in `spec/audit/req-coverage.md` and a verdict of
   `holds`, `finding:<ID>`, `builder-side`, or `deferred:<chunk>`.
3. The same section holds a **code-surface table** of **at least fourteen
   behaviour rows**: kind/property contracts, resource payload
   (`world://map`, `world://kinds`), `manage_world` action set,
   `run_command` execute/suggest/resolve, the world-generation path, parser
   dispatch, verb tiers and implicit hints, movement and visibility/audibility,
   source conversion and annotation linking, containment propagation,
   countdown-world coupling, scene/NPC coupling, the ruleset-free creation path
   (`manage_character`, `manage_combat`), and the §5.11 registration/waiver
   surface. Each row carries a `file:line` anchor, the carrying evidence, and a
   verdict. A finding ID is `F-P6a-N`, N restarting at 1 and shared across
   severities. Table shape is the P5 one:
   `Behaviour | Anchor | Harness | Verdict`; cluster verdicts
   `Cluster | REQs | Verdict | Evidence`.
4. Every `finding:<ID>` names a `file:line` or `spec:line` predicate and a
   P-severity, and has a terminal disposition (`Resolved` ·
   `Scheduled-roadmap` · `Closed-P3` · `Deferred-by-user`), recorded as
   `finding:F-P6a-n (P1|P2|P3)`.
5. Zero open P0 findings remain. A P0 that cannot be fixed inside the session
   stops the run and still lands as a record (see **Stopped-run landing**).
6. Each of the four clusters (A–D below) has a recorded verdict
   (`holds`, `finding:F-P6a-n (Pn)`, `deferred:<chunk>`, or `builder-side`), and
   a cluster verdict is the worst-of its own REQ rows under the order
   `finding` > `deferred` > `builder-side` > `holds` (within `finding`, the
   highest severity wins; ties go to the lowest `F-P6a-n`). Every REQ has
   exactly one owning cluster (the disjoint lists in the cluster section);
   clusters' *target lists* may overlap at a seam, but row ownership does not.
7. `spec/audit/review-register.md` carries every P6a finding under the section
   its disposition names; no `Scheduled-roadmap` row is written without its
   matching `ROADMAP.md` entry, and every `REQ-NNN` token in a
   `Scheduled-roadmap` row appears literally in `ROADMAP.md`
   (`scripts/lib/register-checks.ts:64-68`, enforced by
   `npm run check-registers:strict`).
8. `ROADMAP.md` is updated in the same increment: the sweep section names the
   remaining chunks P6b–P8 and the closing M1 re-run, retains the scope clause,
   its `**Trigger:**` names chunk P6b on a closed run (or the P0 / chunk P6a
   resume on a halt), and the section keeps the admission shape (1–3 bullets +
   `**Trigger:**`).
9. These exit 0 un-piped: `npm run assemble`, `npm run check:fast`,
   `npm run check`, and `npm --prefix holonovel run test:all`. The increment is
   one commit, subject derived by `npm run session:close` from the
   `CHANGELOG.md` heading; a conditional C0 baseline fix precedes it as its own
   commit (see **Commit order and gates**). No push.

## Open questions (answers recorded as decisions before execution)

- **Q1 — Does P6 execute whole, or split?** Whole P6 is 180 REQs / 86 family
  rows across two code families. **Recommendation:** split, on the
  `P3`→`P3b-1…4` precedent. This session is **P6a** = §5.10 (`world/*` and the
  world handlers), §5.11 (ruleset-free build), §5.13 (holodeck coupling),
  §5.15 (mechanical coupling). **P6b** = §5.16–§5.18 (`rulesets.ts`,
  `library.ts`, the build/update entry points) and §5.21–§5.23 (Fate /
  Ironsworn / Forged base capabilities). Splitting the roadmap bullet does not
  change its admission shape.
- **Q2 — Fix policy.** D2/D13 unchanged: P0 fixed in-session (bounded), P1
  scheduled on `ROADMAP.md`, P2 fixed only on a demonstrated failure, P3
  record-and-close. **Recommendation:** adopt, so chunks stay comparable.
- **Q3 — Increment record.** New directory
  `docs/plans/2026-11-09-full-review-p6a/`; the sweep `worklist.md` stays the
  cross-session tracker and carries the P6a tables and decisions D61 onward
  (D60 is the last recorded). **Recommendation:** yes.
- **Q4 — Bucket resolution.** Resolve by base family ID from
  `spec/audit/req-coverage.md`, never by section membership. Measured this
  session: §5.10 26 family rows all bucket C; §5.11 2 rows all C; §5.13 6 rows
  all E; §5.15 2 rows all E. Re-verify at Phase 0.
  **Recommendation:** yes.
- **Q5 — Boundaries (one rule, no overlap).** P6a owns the world-model surface:
  the world data model and its property/kind contracts, parser dispatch and
  verbs, conversion and annotation linking, containment and countdown coupling,
  vis/audibility and movement, ruleset-free build mode, and the
  `manage_world` / `run_command` / `world://` handler paths. Boundaries:
  (a) generic tool-surface projection (`surface-projection.ts`,
  `surface-aliases.ts`) and ruleset packages are **P6b**; (b) the semantic
  index, corpus, and knowledge graph used by world lookups are `deferred:P7`;
  (c) storage mechanics for `novel.world` (atomic save, backup rotation) are
  `Closed-P3` against chunk P4 unless they violate a §5.10 predicate;
  (d) narrative-cognition interpretation behind a world description is
  `deferred:P8`; (e) badge gating of the transport layer is chunk P1's, but a
  missing world-tool badge gate is a P6a finding against the owning §5.10/§5.11
  REQ. **Recommendation:** adopt this single rule.
- **Q5a — Row precedence.** One verdict per REQ; a predicate straddling a
  boundary is worst-of, so any defect in a P6a predicate is `finding:<ID>` even
  when another predicate in the same REQ is `deferred:<chunk>`; `holds`
  requires every non-deferred predicate to hold, and the evidence cell names
  the deferred part. **Recommendation:** adopt.
- **Q6 — Citation resolution scope.** Apply P2/P3b/P4/P5's method unchanged:
  each REQ's own `*Check:*` IDs; a REQ with no own Check inherits its family's
  citation set; an `Automated` citation must appear literally in a
  `holonovel/scripts` harness **and** the harness body must be opened and must
  exercise the stated behaviour; `Manual`, `Gate`, and scenario citations need
  no harness. Zero-padded title tokens (`T0nn`) are shadowing, not evidence
  (F-P2-4). **Recommendation:** adopt.
- **Q7 — Fingerprint consequence.** `DATA_SECTIONS`
  (`scripts/lib/contract-fingerprint.ts:37-43`) includes §5.21–§5.23 but **not**
  §5.10, §5.11, §5.13, §5.15, §5.16–§5.18. A P6a REQ-body edit therefore needs
  `npm run assemble` and `npm run validate -- --write-register`, but no
  fingerprint regeneration; `build-order` still runs for version sync per
  AGENTS.md. **Recommendation:** adopt.
- **Q8 — Row granularity.** P5 recorded one row per REQ; keep that shape (107
  rows) with the bucket inherited per family row. **Recommendation:** adopt.
- **Q9 — Publication.** `npm run status` reports **14 unpushed commits** at
  session start (EV2). **Recommendation:** no push; publication stays
  user-authorized.

## Scope

**In scope.** Chunk P6a review of the world-model layer and the adapter seam:
world kinds, property contracts, and resources (§5.10 `REQ-195`–`202`,
`REQ-222`, `REQ-283`/`284`, `REQ-309`, `REQ-316`–`320`, `REQ-325`–`327`,
`REQ-367`/`368`, `REQ-431`, `REQ-596`/`597`, `REQ-622`); parser dispatch, verb
tiers, movement, visibility and audibility; source conversion and annotation
linking; ruleset-free build and entity creation (§5.11); the holodeck coupling
model (§5.13); mechanical coupling extraction and verification (§5.15).
Citation resolution for all 107 REQs. Findings dispositioned. Roadmap trigger
advanced. Register rows. Changelog entry.

**Out of scope.** The ruleset-package half (§5.16–§5.18, §5.21–§5.23) — chunk
P6b; semantic index, corpus, and knowledge graph (P7); narrative cognition
(P8); the §5.9/§5.19 persistence review (closed by the seam pass and chunk P4);
badge/transport gating (P1); the open remediation roadmap items; publication.

**Row set (107 REQs / 36 family rows).** §5.10: 82 REQs; §5.11: 6; §5.13: 13;
§5.15: 6. A REQ outside this set belongs to another chunk; record it there, not
here. §5.12 and §5.14 are P8 and P7 respectively and are not in scope even
though they sit between §5.10 and §5.16.

## Evidence base (this session)

| # | Evidence | Source | Trust |
|---|---|---|---|
| EV1 | `npm run check:fast` → exit 0, 37 passed / 0 failed, trailing line `check:fast: PASS` | tool output, this session | tool-output |
| EV2 | `npm run status`: version `2026.11.09`, 14 unpushed commits, 14 open roadmap items | tool output, this session | tool-output |
| EV3 | `git rev-parse --short HEAD` = `6893d8b`; top commit is chunk P5 | `git log`, this session | repo |
| EV4 | §5.10 holds **82 REQs** across **26 family rows**, all bucket C | `spec/02-requirements.md`, `spec/audit/req-coverage.md` | repo |
| EV5 | §5.11 holds **6 REQs** / 2 family rows, bucket C | same | repo |
| EV6 | §5.13 holds **13 REQs** / 6 family rows, all bucket **E** (builder-side) | same | repo |
| EV7 | §5.15 holds **6 REQs** / 2 family rows, all bucket **E** | same | repo |
| EV8 | §5.16–§5.18 hold 23 + 15 + 25 = 63 REQs / 40 family rows (P6b), and §5.21–§5.23 hold 10 REQs / 10 rows (P6b) | same | repo |
| EV9 | Code size: `world/model.ts` 1068 lines, `world/parser.ts` 931, `world/index.ts` 24; P6b targets `rulesets.ts` 684, `library.ts` 7, `surface-projection.ts` 167, `surface-aliases.ts` 85 | `wc -l` | repo |
| EV10 | `world/model.ts` anchors: `WORLD_MODEL_KINDS` `:5`, `WORLD_MODEL_PROPERTIES` `:43`, `ROOM_DIRECTIONS` `:135`, `createEmptyWorldModel` `:239`, `BASE_PARSER_COMMANDS` `:243`, `resolveThingName` `:272`, `ConvertResult` `:300`, `parseAnnotationClause` `:405`, `linkAnnotations` `:518`, `convertSource` `:537`, `worldMap` `:976`, `worldKinds` `:988`, `verbCatalog` `:1058` | `grep -n '^export'` | repo |
| EV11 | `world/parser.ts` anchors: `ParserContext` `:6`, `ParserResult` `:13`, `dispatchCommand` `:26`, `roomIsLit` `:803`, `thingRoom` `:826`, `isVisibleFrom` `:839`, `visibleHere` `:855`, `isAudibleFrom` `:865`, `resolveGoMovement` `:891` | `grep -n '^export'` | repo |
| EV12 | `index.ts` anchors: `run_command` registration `:4468`, Player refusal `:4512`, `manage_world` registration `:5114`, `convertSource` call sites `:3417`, `:5316`, `:5549`, `:5555`, `:10180`, `verbCatalog` `:4917`, `:12176`, `world://map` `:12542`, `world://kinds` `:12548`, world resources listed `:11673-11674`, world tool group `:2991`, GM tool gating `:3670` | `grep -n` | repo |
| EV13 | Carrying gates: `check-world-provider` + `test:world-provider` gate the `world://kinds` payload (REQ-200, REQ-202a) from `holonovel/scripts/generate-world-provider.ts` | `package.json`, gate manifest | repo |
| EV14 | Carrying harnesses for the row set's citations (measured by test-ID grep): `test-backfill.ts` (T241 family), `test-persistence.ts` (T238, T414), `test-output-contracts.ts` (T418), `test-adventure.ts`, `test-narrative.ts`, `test-competitive-gaps.ts`, `test-belief.ts`, `test-character-creation.ts`, `test-world-provider.ts`, `run_ruleset_pattern_buffer.ts`. No harness is dedicated to the world parser or `convertSource`. | `grep -rl 'T…'` over `holonovel/scripts` | repo |
| EV15 | `DATA_SECTIONS` = §5.6, §5.9, §5.19, §5.21–§5.23, §5.24–§5.28, §5.31, §5.32, §7.7, Appendix Q — P6a's four sections are **not** fingerprinted | `scripts/lib/contract-fingerprint.ts:37-43` | repo |
| EV16 | `check-registers --strict` requires every `REQ-NNN` in a `Scheduled-roadmap` row to appear literally in `ROADMAP.md` | `scripts/lib/register-checks.ts:64-68`; `--help` | repo |
| EV17 | The sweep worklist's P6 row is `scheduled` and names the full 180-REQ surface (`worklist.md:224`); the last recorded decision is D60 | `worklist.md` | repo |
| EV18 | `check-loop-artifacts` scans **every** directory under `docs/plans`, tracked or not, and requires `plan.md`, `tasks.md`, `aar.md`, and a LOOP token | `scripts/lib/loop-artifacts.ts:24-70` | repo |
| EV19 | M1's first machine-evidence pass closed 2026-11-09; the closing re-run over the post-P8 tree remains on the roadmap | `worklist.md`, `ROADMAP.md` | repo |

## The chunk's review surface — four clusters

Mapping check: every REQ has exactly one **owning** cluster, so the row set is
partitioned with no duplicate ownership; the clusters follow code ownership, not
section order, because §5.10 spans the model, the parser, and the handlers. The
target-list column may name the same file in two clusters at a seam (cluster B
reads the model's verb catalog; cluster C reads the conversion seam), but each
REQ row is written once under its owner and its evidence cell names the split.

| Cluster | Surface | Code targets | Carrying evidence |
|---|---|---|---|
| **A** model, kinds, and resources | kind catalog, property contracts, room/thing shapes, `world://map` / `world://kinds` payloads, generation bounds | `world/model.ts:5-239`, `:976-1019`; `world/index.ts:1-24`; `index.ts:11673-11674`, `:12542-12549`; `holonovel/scripts/generate-world-provider.ts` | `check-world-provider`, `test:world-provider` (REQ-200/202a); `test-output-contracts.ts` (T418 family) |
| **B** parser, verbs, movement | command dispatch, base and extended vocabulary, verb tiers, implicit hints, movement, lit-room, visibility/audibility, things-in-room resolution | `world/parser.ts:6-931`; `world/model.ts:243-299`, `:1021-1067`; `index.ts:4468-4530` (`run_command`), `:4917`, `:12176` | `test-adventure.ts`, `test-narrative.ts` (supporting, no row-set IDs) |
| **C** conversion, containment, coupling | source conversion `convertSource`, annotation parsing/linking, thing/room placement, containment propagation, countdown effect, scene/NPC coupling, mechanical coupling extraction/verification (§5.13, §5.15) | `world/model.ts:300-975`; `index.ts:3417`, `:5316`, `:5549-5555`, `:10180` | `test-backfill.ts` (T241), `test-persistence.ts` (T238/T414), `run_ruleset_pattern_buffer.ts` (supporting) |
| **D** handler surface and ruleset-free mode | `manage_world` action set and badge gates, `run_command` execute/suggest/resolve, `REQ-309` surface prominence, ruleset-free build and entity creation (`manage_character`, `manage_combat`), tool/resource/prompt registration and the `manage_ruleset (action: search)` waiver (§5.11) | `index.ts:5114-5600` (`manage_world`), `:4468-4530`, `:3846` (`manage_character`), `:5690` (`manage_combat`), `:2991`, `:3670`; `world/model.ts` conversion seam | `test-character-creation.ts`, `test-belief.ts`, `test-competitive-gaps.ts`, `test-output-contracts.ts` |

Ownership is disjoint and complete: **A** = `REQ-195`–`202` (all family rows,
including `REQ-201`'s conversion contract), `REQ-283`/`284`, `REQ-316`–`320`,
`REQ-431`, `REQ-596`/`597`, `REQ-622`; **B** = `REQ-222`, `REQ-325`–`327`;
**C** = `REQ-367`/`368`, §5.13 (`REQ-369`–`376`), §5.15 (`REQ-377`/`378`);
**D** = `REQ-309`, §5.11 (`REQ-218`/`219`). Cluster D also reviews `REQ-218c`
(the inert-coupling and verification-workflow substitution contract) spec-side
with a verdict row and no behaviour-table row. Sub-REQs inherit their family
row's owner; a seam behaviour that another cluster's code carries is recorded in
the owner's row with a cross-reference, never as a second row.

## Steps

### Phase 0 — Baseline (no source edits)

1. Re-run `npm run check:fast` un-piped immediately before the review and
   record the exit status; run `npm run check` once so the full gate's baseline
   is measured rather than inherited. A red baseline is a P0 and is fixed first,
   as its own commit; if it cannot be fixed in-session, land per **Stopped-run
   landing** (red-baseline branch).
2. Run `npm --prefix holonovel run test:all`; record the per-harness summary and
   exit status, including at minimum `test:world-provider`, `test:backfill`,
   `test-persistence`, `test-output-contracts`, `test-adventure`,
   `test-narrative`, `test-character-creation`, and
   `test:pattern-buffer-ruleset`. These eight are the **world-path harnesses**
   re-run after any P0 fix that touches the world model or its handlers.
3. Confirm `git status --porcelain` shows only this increment's untracked
   directory, record `git rev-parse --short HEAD`, and note that the cold-pass
   directory and the plan-gate sidecar live outside the repository (under
   `/tmp/opencode/` and `~/.local/state/opencode/plans/`) and are therefore
   absent from `git status`.
4. Confirm the artefact directory is trackable: `git check-ignore -v
   docs/plans/2026-11-09-full-review-p6a/` returns nothing.
5. Record Q1–Q9 and Q5a as **D61–D70** in the sweep `worklist.md` before review
   work starts (D60 is the last recorded; do not renumber). Decisions go in the
   worklist, not this file, so the stamped plan hash stays valid; if a decision
   departs from its recommendation, amend this plan and re-stamp instead.
6. Record the plan-gate evidence sidecar by running
   `node ~/.config/opencode/skills/plan-review/scripts/plan-gate.mjs preflight
   --project /home/fluke/Holonovel --plan
   docs/plans/2026-11-09-full-review-p6a/plan.md --target ROADMAP.md --target
   CHANGELOG.md --target spec/audit/review-register.md --target
   docs/plans/2026-11-09-full-review-sweep/worklist.md --req REQ-195a --req
   REQ-218a --req REQ-369a --req REQ-377a`
   (repeat `--target` and `--req` once per path and REQ; the flags are not
   comma-lists).
7. Re-derive the row set (107 REQs across 36 family rows) and the bucket for
   each family from `spec/audit/req-coverage.md` (EV4–EV7). A verified mismatch
   is a plan defect: stop, amend this plan, and re-stamp before proceeding —
   never silently re-scope in the worklist.

### Phase 1 — Code side (read-only review)

1. **Enumerate the surface**, recording `file:line` anchors in the worklist:
   every export of `world/model.ts`, `world/parser.ts`, and `world/index.ts`;
   the `manage_world` and `run_command` action branches; the world resource
   registrations; the generation path; and the ruleset-free build/creation
   branches. Enumeration confirms names; nothing is assumed from this plan.
2. **Review with `code-review`** (read-only, reached through
   `programming-orchestrator`) cluster by cluster: A model/resources, B
   parser/verbs, C conversion/coupling, D handlers/ruleset-free. Clusters are
   independent and may be reviewed in parallel; Phase 3 triage is the join
   point. Every finding cites the predicate (`file:line`), never a gate message.
3. **Verify the model and resource contracts**: every declared kind appears in
   `WORLD_MODEL_KINDS` and the generated `world://kinds` document; property
   contracts match the declarable kinds; `world://map` renders deterministic
   room/exit text; scene and NPC coupling resolve against real ids. A kind or
   property served by the resource but absent from the model (or the reverse) is
   a finding.
4. **Verify the parser and verbs**: dispatch covers the base vocabulary and the
   extended tier, unknown verbs refuse with a corrective action, implicit hints
   resolve to real commands, movement updates both sides of an exit, and
   visibility/audibility honour lit rooms and containment. A command documented
   in the REQ body that `dispatchCommand` cannot reach is a finding.
5. **Verify conversion and coupling**: `convertSource` preserves existing
   subtrees unless the REQ says replace, annotations link once, containment
   propagation reaches nested things, countdown effects apply at the stated
   tick, and §5.13/§5.15's derivation statements match what the build emits.
   A conversion that silently drops a described element is a P0 candidate.
6. **Verify the handler surface**: `manage_world` actions and their badges,
   `run_command` execute/suggest/resolve gating, the world-generation bounds
   (`TTRPG_WORLD_GEN_MAX_ROOMS`), and the ruleset-free creation path through
   `manage_character` (`index.ts:3846`) and `manage_combat`
   (`index.ts:5690`) plus the §5.11 registration/waiver surface. A handler
   that accepts a mutation the owning REQ forbids is a finding.
7. **Check each assertion against the behaviour it claims**: open every cited
   harness and confirm the body exercises the contract. A passing harness
   asserting something narrower is a finding. Zero-padded title tokens (`T0nn`)
   are shadowing, not evidence (F-P2-4).
8. **Record one verdict per REQ** (107 rows, done bar 2) and one row per
   reviewed behaviour (done bar 3), plus one **cluster verdict row** per cluster
   A–D (done bar 6). Phase 1 verdicts are provisional until Phase 2 completes.

### Phase 2 — Spec side (citation resolution)

1. Apply the reproducible method (Q6): each REQ's own `*Check:*` IDs; a REQ with
   no own Check inherits its family's citation set; an `Automated` citation must
   appear literally in a `holonovel/scripts` harness **and** its body must
   exercise the stated behaviour; `Manual`, `Gate`, and scenario citations need
   none. Bucket from the base family row per Q4.
2. Classify citation *kind* before counting a missing harness: a scenario
   citation needs no harness; an `Automated` token with no harness is a finding.
3. A REQ whose cited test does not exercise the stated behaviour is a finding.
   `npm run check:conformance -- --dedicated` over-flags on this corpus
   (AGENTS.md), so its output is evidence to inspect, never a finding by itself.
4. Fill the bucket and verdict columns for all 107 rows. Bucket-E REQs
   (§5.13/§5.15) are `builder-side` unless the server runtime or build emits
   their statement; a build-side gap that the owning REQ requires is a finding,
   not an automatic `builder-side` pass.

### Phase 3 — Triage, registers, roadmap, artefacts

1. **Triage** every finding per Q2. Guardrails for a P0 fix:
   - A fix in the world path runs the eight world-path harnesses (Phase 0.2)
     plus `test:all`.   - A fix that changes an action's parameters or output first runs a
     sibling-contract check: grep the REQ corpus for other REQs naming the same
     `tool (action: X)` and confirm no sibling contract conflicts (notably
     `manage_world (action: …)` and `run_command (action: …)`).
   - A fix that amends a REQ body complies with Appendix M (one paragraph, no
     tables/bullets/steps, 800-char and 8-sentence caps);
     `npm run validate --sdd-strict` is the check.
   - A fix that edits a §5.10/§5.11/§5.13/§5.15 REQ body: `npm run assemble`,
     then `npm run validate -- --write-register`; no fingerprint regeneration is
     required (Q7), but `npm run build-order` still runs for version sync.
   - A fix that edits a tool definition re-runs the generator and the surface
     gates (`npm run build-order`); `check-tool-definitions-sync` fails on a
     stale `tool-definitions.json`.
   - A fix to `world/model.ts` kind or property tables re-runs
     `npm run check-world-provider` (it is the freshness gate over the emitted
     provider document).
2. **`spec/audit/review-register.md`**: one dated heading per used disposition
   section, rows per **Register write-back** below.
3. **`ROADMAP.md`**: keep the sweep item's 1–3 bullet + `**Trigger:**` shape
   (`check-roadmap` rejects any other) and update it to:
   - bullet 1 — chunk P6b (ruleset packages, host build/update entry points,
     Fate/Ironsworn/Forged base capabilities) and chunk P7 (determinism and
     knowledge);
   - bullet 2 — chunk P8 (narrative cognition) and the closing M1
     machine-evidence re-run over the post-P8 tree, covering
     `check:conformance`, `fmea`, and `graph-deps`, plus the retained scope
     clause ("Scope is §5.1–§5.35 except §5.9 and §5.19; §5.6 and chunks P4,
     P5, P6a are closed");
   - trigger — chunk P6b on a closed run; on a halt, the P0 fix or the chunk
     P6a resume instead.
   When triage produces scheduled findings, **also** add remediation
   section(s) in groups of 1–3 bullets split by theme, because `check-roadmap`
   admits at most three bullets per section and `check-registers:strict`
   requires every REQ in a `Scheduled-roadmap` row to appear literally in
   `ROADMAP.md` (EV16). Every bullet names its finding's `REQ-NNN` IDs,
   including lowercase suffixes, and every remediation section carries a
   `**Trigger:**` line ("closes when the finding is `Resolved`"). When triage
   produces none, add no second section.
4. **`CHANGELOG.md`**: one dated heading
   `<YYYY-MM-DD> — Full-review sweep: chunk P6a (world model and the adapter
   seam)`. The date equals the current CalVer date written with hyphens
   (`2026.11.09` → `2026-11-09`); verify at execution.
5. **Artefacts**: tick the completed items in `tasks.md`, replace the
   provisional `aar.md` with the execution record and the token the outcome
   earns, and update the sweep worklist's status table (P6a closed-or-halted;
   P6b remains `scheduled`).

## Register write-back

| Disposition | Section | Row shape |
|---|---|---|
| `Resolved` | first `## Resolved` block (`review-register.md:12`), newest-first | `### <date> full-review sweep — chunk P6a`; bullet `**F-P6a-N — <title> (resolved):**` + predicate + the REQ IDs it covers + fix location + the assertion that now covers it (or `no new assertion`); an in-C1 fix cites the register date `YYYY-MM-DD` (the resolver at `scripts/lib/register-checks.ts:61-63` accepts a dated row) and names the plan-local label `C1` in prose |
| `Scheduled-roadmap` | `## Scheduled-roadmap` | same heading; bullet names the finding, the predicate, the REQ IDs it covers (including lowercase suffixes), and the `ROADMAP.md` section it is scheduled under, plus the date; each cited `REQ-NNN` also appears literally in that `ROADMAP.md` section |
| `Closed-P3` | `## Closed-P3 (recorded, no action)` | same heading; bullet records the predicate, the REQ IDs, and why no action follows |
| `Deferred-by-user` | `## Deferred-by-user` | only on an explicit user deferral; names the decision |

A finding scheduled against a later sweep chunk writes both the register row and
the chunk reference in the sweep `worklist.md` **and** its exact `REQ-NNN`
tokens in a `ROADMAP.md` remediation bullet. A finding scheduled against a
roadmap-section-owned fix writes the `ROADMAP.md` entry in the same step. P6a
does not retire a register row owned by another chunk, so no cross-referencing
register is updated beyond the sweep worklist's status row and the roadmap
trigger.

## Stopped-run landing

If a P0 cannot be fixed within the session, the run halts and still lands as a
record:

1. `worklist.md` marks chunk P6a `halted on <finding ID>` and keeps the partial
   tables.
2. `ROADMAP.md` gains an additional section for the P0: heading
   `## <finding ID> — <title> (P0)`, 1–3 bullets naming the predicate, the
   reproduction, and the finding's `REQ-NNN` IDs, and a `**Trigger:**` line;
   the admission rule and the strict REQ-literal rule both apply.
3. `CHANGELOG.md` heading reads
   `<date> — Full-review sweep: chunk P6a (halted on <finding ID>)`.
4. `spec/audit/review-register.md` carries the unfixed P0 as a
   `Scheduled-roadmap` row whose matching `ROADMAP.md` entry is the P0 section
   from step 2. A baseline P0 is a gate defect, not a review finding, so it gets
   no register row; record it in the AAR only.
5. `aar.md` ends `LOOP OPEN` naming the P0 row; gates still run. Green is
   required for whatever landed **except** the red-baseline branch below.
6. The roadmap scope clause records "chunk P6a halted", never "closed".
7. No push. The P0 is the next session's first item, ahead of chunk P6b.

**Red-baseline branch.** When the unfixable P0 is the baseline itself (Phase 0's
`npm run check` or a server harness is red and cannot be fixed in-session):

1. `aar.md` records the red gate output verbatim and ends `LOOP OPEN` naming
   the red gate; `worklist.md` status reads `halted — red baseline`.
2. `ROADMAP.md` gains a heading `## Baseline red — <gate> (halted)` (no finding
   ID, because a gate defect is not a review finding), 1–3 bullets naming the
   failing command and its first failing assertion, and a `**Trigger:**` line
   naming the baseline fix. No `Scheduled-roadmap` row exists, so the
   REQ-literal rule does not apply.
3. No `CHANGELOG.md` entry is written: a red baseline produces no semantic
   change, and the AAR is the record.
4. Stage only the planning record — `git add
   docs/plans/2026-11-09-full-review-p6a/
   docs/plans/2026-11-09-full-review-sweep/worklist.md ROADMAP.md` — never
   `git add -A`.
5. Commit **manually** with the dated subject
   `<YYYY-MM-DD> — Full-review sweep: chunk P6a (baseline red, halted)`. The
   pre-commit hook cannot pass on a tree that is red by construction, so this
   commit is made with `git commit --no-verify`; the AAR records the bypass and
   its reason, and the bypass is detectable as a commit with no corresponding
   event in `.holonovel-state/hook-events.jsonl` (the loop audit's invocation
   log). No other commit in this increment may bypass a hook. The run does
   **not** claim green gates; `session:close` is not used on this branch. The
   sweep section's `**Trigger:**` is amended to name the baseline fix.

**Time-boxed landing (ran out of time, no P0).** When the session ends with
review work unfinished but every gate green and no open P0, the increment lands
as a partial record — it is neither a P0 halt nor a red baseline:

1. `worklist.md` marks chunk P6a `partial — family rows n/36, REQ rows m/107`
   and keeps the tables as far as they were completed; the remaining rows stay
   `pending`, never `holds`.
2. `aar.md` ends `LOOP OPEN` naming the unfinished row range; it records which
   clusters closed and which did not.
3. `CHANGELOG.md` heading reads
   `<date> — Full-review sweep: chunk P6a (partial — family rows n/36, REQ rows
   m/107)`.
4. `ROADMAP.md` keeps the sweep section's shape and its `**Trigger:**` names
   "resume chunk P6a at the first pending row"; on this branch the trigger is
   **not** advanced to P6b.
5. Gates still run and must be green for whatever landed; no-`P0` findings found
   so far are dispositioned exactly as on a closed run. No push.

## Blast radius

| File | Change | Size |
|---|---|---|
| `docs/plans/2026-11-09-full-review-p6a/{plan,tasks,aar}.md` | this increment's artefacts | M |
| `docs/plans/2026-11-09-full-review-sweep/worklist.md` | chunk P6a section: 107-REQ table, behaviour table, cluster table, D61–D70, status rows, P6 split row | M |
| `spec/audit/review-register.md` | P6a finding rows (one dated subsection per used disposition) | S |
| `ROADMAP.md` | sweep bullets re-scoped to P6b/P7 and P8/M1 with the scope clause retained; trigger advanced to P6b; remediation section(s) only when triage schedules findings (each names its REQs); extra P0 section only on a halted run | S |
| `CHANGELOG.md` | dated heading + bullets | S |
| `holonovel/src/world/model.ts`, `world/parser.ts`, `world/index.ts` | only if a P0 fix lands (named at that time) | S–M |
| `holonovel/src/index.ts` | only if a P0 fix lands in the world/`run_command`/`manage_world` handlers | S–M |
| `holonovel/scripts/test-*.ts`, `holonovel/scripts/run_ruleset_pattern_buffer.ts` | only if a P0 fix needs an assertion | S |
| `holonovel/src/generated/` | regenerated only if a P0 fix changes the world-provider document (`check-world-provider`) | — |
| `holonovel/tool-definitions.json` | regenerated only if a P0 fix edits a tool definition | — |
| `spec/**` + `holonovel.md` | only if a P0 fix amends a REQ (then `assemble` + register refresh) | S–M |
| `spec/audit/req-coverage.md` | refreshed by `npm run validate -- --write-register` when a REQ body changes | S |
| `holonovel/package.json`, `package-lock.json`, `server.json`, `AGENTS.md`, `DECISIONS.md` header, version constant | advanced by `build-order` version sync | — |

## Considered and rejected

- **Executing all 180 P6 REQs in one session.** Rejected: two code families and
  four spec families in one pass cannot meet a session-achievable done bar; the
  `P3`→`P3b-1…4` split is the established precedent.
- **Splitting by section order instead of code ownership.** Rejected: §5.10
  spans the model, parser, and handlers; section-order splits would make each
  cluster's rows straddle two sessions and re-open the same code twice.
- **Reviewing `rulesets.ts` here.** Rejected: it is P6b's surface; the only
  ruleset touchpoint in P6a is the coupling derivation (§5.13/§5.15), which is
  builder-side and reviewed as a spec-to-build statement, not as server code.
- **Reviewing the semantic index used by world lookups.** Rejected: P7 owns
  `core/semantic.ts`; a lookup path that violates no §5.10 predicate is
  `deferred:P7`.
- **Writing a harness for every unreachable world branch.** Rejected: an
  unreachable branch with no assertion is a citation-gap finding; writing
  harnesses for every branch is remediation, not review.
- **Chasing every finding.** Rejected: P1/P2/P3 findings are scheduled or
  closed; only a P0 blocks the chunk's close.
- **Recording P6b/P7/P8 predicates as `finding:` rows.** Rejected: a boundary
  is not a defect in this chunk's surface; `deferred:<chunk>` keeps the verdict
  vocabulary mechanical.

## Verification

| Check | Command | Expected |
|---|---|---|
| Assembly | `npm run assemble` | exit 0 |
| Fast gate | `npm run check:fast` (un-piped) | 37/37 (or the new total if a P0 fix adds a harness), `check:fast: PASS` |
| Full gate | `npm run check` | 0 errors |
| Server harnesses | `npm --prefix holonovel run test:all` | exit 0, record per-harness summary |
| World-provider freshness | `npm run check-world-provider` | pass |
| Roadmap admission | `npm run check-roadmap` | pass after the roadmap edit |
| Register cross-refs | `npm run check-registers:strict` | pass |
| Loop artefacts | `npm run check-loop-artifacts` | pass, LOOP token present |
| Coverage register | `npm run validate -- --write-register` | only when a REQ body changed |
| REQ shape (conditional) | `npm run validate --sdd-strict` | only when a P0 fix amends a REQ body; 0 shape errors |
| Version sync (conditional) | `npm run build-order` | 0 errors |
| Machine evidence | `npm run check:conformance` | exit 0; record the summary |

## Risks and rollback

- **82 §5.10 REQs can exceed one session.** Mitigation: one row per family first,
  expanded per REQ as the review proceeds; a session that cannot finish lands per
  **Time-boxed landing** with the partial table intact and the trigger pointing
  at the first pending row.
- **A P0 discovered late can exceed the session.** Mitigation: stop, record,
  land; the plan's bar is not met and that is the correct outcome.
- **`convertSource` destroying described content.** Mitigation: probes use
  scratch data directories (`TTRPG_DATA_DIR`); the conversion review treats
  silent element loss as a P0 candidate.
- **False citation holds.** Mitigation: open every cited harness; `T0nn`
  shadowing (F-P2-4) is a known source. No harness is dedicated to the world
  parser, so citation gaps are likely and must be evidenced, not assumed.
- **Gate-pinned values.** The changelog date is the CalVer date;
  `session:close` derives the commit subject from the top CHANGELOG heading.
- **Draft artefact breaks a gate mid-session.** `check-loop-artifacts` requires
  plan, tasks, and a LOOP token in every `docs/plans` directory (EV18); all
  three exist from the drafting step.
- **No destructive operations, no push.** Every change is a reversible edit or
  an added artefact; rollback cost 1 (one `git revert`) when there is no C0, or
  2 when a baseline fix landed first.

## Commit order and gates

| # | Commit | Scope | Gate before commit |
|---|---|---|---|
| C0 (conditional) | Restore a green baseline | only if Phase 0's `npm run check` or a server harness is red — that baseline fix alone, committed **manually** with a dated subject `YYYY-MM-DD — Restore green baseline (<gate>)`; `session:close` is used for C1 only, and the AAR records the deviation | `check:fast`, `check`, plus the red server harness re-run |
| C1 | Full-review sweep: chunk P6a (world model and the adapter seam) | plan/tasks/AAR, worklist chunk-P6a tables and status, register rows, ROADMAP.md, CHANGELOG.md, any review P0 fix | `assemble`, `check:fast`, `check`, `check-roadmap`, `npm run check-registers:strict`, `check-loop-artifacts`, `npm --prefix holonovel run test:all`, plus `build-order` if a REQ body or tool definition changed and `validate -- --write-register` if a REQ body changed |

C1 is one commit (spec increment); C0 exists only when the baseline is red and
lands first. Publication is not part of this increment.

## User impact

None to runtime behaviour unless a P0 fix lands. The increment changes review
records, the roadmap trigger (advanced to chunk P6b on a closed run), and the
changelog; chunks P6b–P8 stay scheduled, and the closing M1 re-run remains on
the roadmap.

## Evidence

- Review artefact: this file; tracker:
  `docs/plans/2026-11-09-full-review-sweep/worklist.md`.
- Finding predicates: recorded per finding in `review-register.md`.
- Baseline: EV1–EV19 above (repo and tool-output sources).
- No external sources; no user-supplied content drives an instruction.
