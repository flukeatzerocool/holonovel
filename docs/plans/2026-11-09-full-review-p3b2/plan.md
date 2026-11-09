# Plan — Full-review sweep, chunk P3b-2 (§5.6 entities and NPCs)

**Status:** draft, awaiting user approval · **Date:** 2026-11-09 · **Depth:** standard
**Review independence:** fresh — cold pass `independent-review passed.` (0
blockers, 4 majors, 13 nits on revision `2f682067…`; all resolved and the diff
re-audit passed on revision `a236eac3…`, with four cosmetic nits applied after).
Report `/tmp/opencode/p3b2-independent-review-final.md`.
**Roadmap item:** `ROADMAP.md` § Remaining full-review sweep (P1)
**Predecessor:** `docs/plans/2026-11-09-full-review-p3b/` (chunk P3b-1, closed
2026-11-09, `LOOP PAUSED`)
**Tracker:** `docs/plans/2026-11-09-full-review-sweep/worklist.md`

## Done bar

**Done bar:** this increment only — chunk P3b-2 of the sweep program. The bar is
met when all nine items hold; anything else found is scheduled, not chased.

1. `docs/plans/2026-11-09-full-review-p3b2/` carries `plan.md`, `tasks.md`, and
   `aar.md`, and `aar.md` ends in `LOOP PAUSED` or `LOOP OPEN`.
   `check-loop-artifacts` passes.
2. The sweep `worklist.md` holds a chunk P3b-2 section with **one row per REQ in
   the chunk — 93 rows across 30 families**, each carrying its bucket inherited
   from the base family row in `spec/audit/req-coverage.md` (D14) and a verdict
   of `holds` (including `holds (inherited from <family>)` for sub-REQs with no
   own `_Check:` and `holds (fixed <finding>)` for an in-session P0),
   `finding:<ID>`, or `builder-side`. That row set, not the gate result, is the
   falsifiable record that the chunk was reviewed.
3. Every `finding:<ID>` names a `file:line` or `spec:line` predicate and a
   P-severity, and has a terminal disposition (`Resolved` · `Scheduled-roadmap` ·
   `Closed-P3` · `Deferred-by-user`).
4. Zero open P0 findings remain. A P0 that cannot be fixed inside the session
   stops the run and still lands as a record (see **Stopped-run landing**).
5. Each of the three clusters (A–C below) has a recorded review verdict: `holds`
   with the gate or harness that carries it, or the finding IDs it produced. A
   cluster is not "reviewed" because a gate is green.
6. `spec/audit/review-register.md` carries every P3b-2 finding under the section
   its disposition names; no `Scheduled-roadmap` row is written without its
   matching `ROADMAP.md` entry.
7. `ROADMAP.md` is updated in the same increment: the sweep section names the
   remaining P3b sub-chunks (P3b-3, P3b-4) and chunks P4–P8 plus M1, its
   `**Trigger:**` line names chunk P3b-3, and the section keeps the admission
   shape (1–3 bullets + `**Trigger:**`). No second roadmap section is added
   unless a P0 halts the run.
8. These exit 0 un-piped: `npm run assemble`, `npm run check:fast`,
   `npm run check`.
9. The increment is one commit, subject derived by `npm run session:close` from
   the `CHANGELOG.md` heading; a conditional C0 baseline fix precedes it as its
   own commit. No push.

## Open questions (answers recorded as decisions before execution)

- **Q1 — Chunk scope.** `ROADMAP.md` names chunk P3b-2 as §5.6 entities and
  NPCs: **93 REQs across 30 families** (D12). That is 1.4× chunk P3b-1's 66
  rows. Families stay atomic; the family list is fixed in the **Scope** section.
  **Recommendation:** execute as one increment (a 93-row table is larger but
  mechanical), with the stopped-run landing as the only split point. Do not
  re-split the roadmap a third time.
- **Q2 — Fix policy.** D13 unchanged: P0 fixed in-session (bounded), P1
  scheduled on `ROADMAP.md`, P2 fixed only on a demonstrated failure, P3
  record-and-close. **Recommendation:** adopt, so chunks stay comparable.
- **Q3 — Increment record.** New directory
  `docs/plans/2026-11-09-full-review-p3b2/` for this increment's plan/tasks/AAR;
  the sweep `worklist.md` stays the cross-session tracker and carries the P3b-2
  verdict table and decisions. **Recommendation:** yes.
- **Q4 — Bucket resolution.** Resolve by base family ID from
  `spec/audit/req-coverage.md` (D14), never by section membership. All 30
  families have a §5.6 row: **27 bucket C families (88 REQs) and 3 bucket E
  families (5 REQs: `REQ-123`, `REQ-124a/b`, `REQ-127a/b`)**; none A/B/D.
  Re-verify at Phase 0. **Recommendation:** yes.
- **Q5 — Chunk boundaries.** P4 owns `core/state.ts` save/load/archive
  internals (§5.19). P5 owns the engine loop, event stream, and durable agent
  tasks (§5.20/§5.24/§5.31). P8 owns narrative cognition and subjective memory
  (§5.12/§5.25–§5.27, §5.32–§5.35). P3b-2 reviews the entity/NPC *state and
  handler* behaviour §5.6
  states: roster and entity lifecycle, presence-gated visibility, scene ledger
  fields, fast-forward application, NPC records/stat-block references/resources,
  NPC memory as surfaced on the entity, personality/voice fields, signal and
  boundary propagation, and personality briefing rendering. A predicate that
  lands in persistence, engine scheduling, or subjective-memory internals is
  recorded against the owning chunk. **Recommendation:** record and defer, do
  not audit across the boundary.
- **Q6 — Citation resolution scope.** Apply chunk P2/P3b-1's method unchanged:
  each REQ's own `*Check:*` IDs; a REQ with no own Check inherits its family's
  citation set; an `Automated` citation must appear literally in a
  `holonovel/scripts` harness **and** the harness body must be opened and must
  exercise the stated behaviour; `Manual`, `Gate`, and scenario citations need
  no harness. Zero-padded title tokens (`T0nn`) are shadowing, not evidence
  (F-P2-4, still open under ROADMAP *Harness test-ID label hygiene*).
  **Recommendation:** adopt.
- **Q7 — Fingerprint consequence.** §5.6 is in `DATA_SECTIONS`
  (`scripts/lib/contract-fingerprint.ts:38`), so **any** REQ-body edit in this
  chunk requires `npm run build-order` to regenerate
  `holonovel/src/generated/contract-fingerprints.ts`. The plan budgets for it.
- **Q8 — Publication.** `npm run status` reports **8 unpushed commits** at
  session start (EV2). **Recommendation:** no push; publication stays
  user-authorized.

## Scope

**In scope.** Chunk P3b-2 review of the 93 entity-and-NPC REQs: multi-entity
support, entity removal and roster removal/listing, named-NPC state and card
import/export, NPC stat-block reference/rendering/resource URIs, NPC narrative
fields and builder-defined stat fields, NPC damage resolution, scene-state
ledger and structured scene fields, narrative fast-forward, entity presence and
presence-gated knowledge, knowledge-world coupling, NPC memory model, entity
personality fields, voice examples and NPC voice directives, ruleset-native
personality mapping, personality ownership gating and briefing rendering,
personality resource URIs, the Player feedback signal, the signal briefing
surface, boundary signal propagation, the connection counter, and property-group
cardinality. Citation resolution for all 93 REQs. Findings dispositioned.
Roadmap trigger advanced. Register rows. Changelog entry.

**Out of scope.** P3b-3 (adventure content, 39), P3b-4 (state surfaces and
fingerprinting, 67); `core/state.ts` save/load/archive internals (P4); the engine
loop and event stream (P5); adapters/rulesets internals (P6); §5.9/§5.19 (closed
by the 2026-11-09 seam pass); the open remediation roadmap items (§5.6 core
state remediation, §5.4 remediation and citation repair, trust-core contract and
citation repair, harness test-ID hygiene, anchor repoint automation);
publication.

**Family fence (30 families, 93 REQs).** `REQ-069` (3), `074` (3), `075` (9),
`076` (9), `077` (6), `119` (4), `120` (1), `121` (1), `122` (2), `123` (1),
`124` (2), `126` (2), `127` (2), `128` (2), `129` (5), `156` (1), `165` (2),
`166` (3), `167` (2), `173` (3), `176` (2), `177` (1), `178` (2), `252` (3),
`255` (3), `282` (4), `307` (3), `308` (2), `311` (7), `330` (3). Total 93.
A REQ outside this fence belongs to P3b-3, P3b-4, or another chunk; record it
there, not here.

## Evidence base (this session)

| # | Evidence | Source | Trust |
|---|---|---|---|
| EV1 | `check:fast` → exit 0, 37 passed / 0 failed, trailing line `check:fast: PASS` | tool output, this session | tool-output |
| EV2 | `npm run status`: version `2026.11.09`, last publish `2026-11-09T04:30:29Z`, 8 unpushed commits (oldest 14.8 h), 9 open roadmap items | tool output, this session | tool-output |
| EV3 | Tree carries only this increment's untracked plan directory at baseline: `?? docs/plans/2026-11-09-full-review-p3b2/`; no tracked file is modified. `git rev-parse --short HEAD` = `aad37c2` | `git status --porcelain`, `git rev-parse` | repo |
| EV4 | §5.6 spans `spec/02-requirements.md:1452-2266`; the entity/NPC block is `:1646-1939` and holds **93 REQs** (`^**REQ-` count) across **30 families** | enumerated this session | repo |
| EV5 | Coverage register: 30 family rows for this chunk — **27 bucket C (88 REQs), 3 bucket E (5 REQs)**; none A/B/D | `spec/audit/req-coverage.md` rows for the 30 families | repo |
| EV6 | Family sub-part counts (sum 93): 069:3, 074:3, 075:9, 076:9, 077:6, 119:4, 120:1, 121:1, 122:2, 123:1, 124:2, 126:2, 127:2, 128:2, 129:5, 156:1, 165:2, 166:3, 167:2, 173:3, 176:2, 177:1, 178:2, 252:3, 255:3, 282:4, 307:3, 308:2, 311:7, 330:3 | `sed` + `uniq -c`, this session | repo |
| EV7 | Code surface: `manage_character` `index.ts:3846`, `manage_scene` `:6166` (presence `:6299`, fast-forward `:6211`), `manage_npc` `:6424`, `manage_story` `:7895`, `manage_knowledge` `:8912`; entity resources `:12263-12286`, `npc://` resource `:12353` and `npc://{id}/personality`/`voice_examples` `:12391`/`:12400`; resource catalog `:11650`; presence-scoped lore/knowledge composition `:900-954`; NPC-memory briefing region `:4170-4186`; personality group in the briefing `:14126-14155`; `core/state.ts` `createEntity` `:2695`, roster map `:984`, `stageToRoster` `:2621`; cardinality `core/limits.ts:1-47` | `grep -n`, this session | repo |
| EV8 | §5.6 is a **data-format** section: `DATA_SECTIONS` includes `"### 5.6 "` (`scripts/lib/contract-fingerprint.ts:38`), so REQ-body edits require fingerprint regeneration via `build-order` (Q7) | `grep -n` | repo |
| EV9 | Register records the §5.6 consolidation question as `Deferred-by-user`; this chunk is review, not consolidation | `spec/audit/review-register.md` | repo |
| EV10 | The roadmap's sweep section names chunk P3b-2 as the next start and closes when P3b-2–P8 and M1 report | `ROADMAP.md:15-28` | repo |
| EV11 | No §5.6-specific gate exists. The assertions live in the server suite: `npm --prefix holonovel run test:all` is the authoritative run (it includes `test-limits`, which carries T143/REQ-129, and `test-briefing`, which carries briefing/NPC-mind assertions). Targeted harnesses named in Phase 0 are the minimum, not the whole set. A green `check:fast` says nothing about them | `holonovel/package.json`, `holonovel/scripts/test-limits.ts`, `ls holonovel/scripts/test-*.ts` | repo |
| EV12 | Zero-padded harness title tokens shadow real IDs (F-P2-4) and are scheduled under ROADMAP *Harness test-ID label hygiene*; they are not evidence | `spec/audit/review-register.md` | repo |

## The chunk's review surface — three clusters

Mapping check: the 93 REQ IDs partition across these clusters with no gap and no
duplicate (33 + 28 + 32 = 93). Re-verify before starting.

| Cluster | REQs | Families | Count | Code/spec target |
|---|---|---|---|---|
| **A** roster, entities, scene, presence | 074a–c, 176a–b, 177, 178a–b, 129a, 129b1–b2, 129c–d, 076a1–b7, 252a–c, 307a–c, 308a–b, 330a–c | 10 | 33 | `manage_character` (`index.ts:3846`), `manage_scene` presence (`:6299`) and fast-forward (`:6211`), `core/state.ts` `createEntity` (`:2695`)/roster (`:984`), `core/limits.ts`, presence-scoped lore/knowledge composition (`index.ts:900-954`) |
| **B** NPC records, stat blocks, memory | 075a–i, 119a–d, 120, 121, 122a–b, 123, 124a–b, 156, 311a–g | 9 | 28 | `manage_npc` (`index.ts:6424`), `npc://` resources (`:12353`–`:12400`), resource catalog (`:11650`), ruleset stat-block reference path, NPC memory render (`:4170-4186`) |
| **C** personality, voice, signal, briefing | 077a–f, 126a–b, 127a–b, 282a–d, 165a–b, 166a–c, 167a–b, 069a–c, 128a–b, 255a–c, 173a–c | 11 | 32 | `manage_character` personality/voice/signal (`:3846`), `entity://{id}/personality`/`voice_examples` (`:12269`/`:12278`), personality group in the briefing (`:14126-14155`), boundary signal propagation, connection counter |

Cluster B's three bucket-E families (`REQ-123`, `REQ-124`, `REQ-127`) are
builder-side: their verdict is `builder-side` unless a runtime predicate exists,
in which case it is reviewed like any other REQ. Cluster C's briefing rendering
is consumed by §5.5 surfaces reviewed in chunk P1; a predicate that is purely a
badge-filter rule is recorded against P1 rather than reopened.

## Steps

### Phase 0 — Baseline (no source edits)

1. Re-run `npm run check:fast` un-piped immediately before the review and record
   the exit status; run `npm run check` once so the full gate's baseline is
   measured rather than inherited from EV1. A red baseline is a P0 and is fixed
   first, as its own commit; if it cannot be fixed in-session, land per
   **Stopped-run landing** (red-baseline branch) and do not claim a green record.
2. Run `npm --prefix holonovel run test:all` and record the per-harness summary
   and exit status; at minimum the run must include `test:output-contracts`,
   `test:backfill`, `test:narrative`, `test:supplementary`, `test:adventure`,
   `test:persistence`, `test:persistence-guardrails`, `test:workflow`,
   `test:limits`, `test:briefing`, `test:fingerprints`, `test:security`, and
   `test:artifact-registry` (EV11).
3. Confirm `git status --porcelain` shows **only** the untracked
   `docs/plans/2026-11-09-full-review-p3b2/` directory (EV3) and record
   `git rev-parse --short HEAD`.
4. Confirm the artefact directory is trackable: `git check-ignore -v
   docs/plans/2026-11-09-full-review-p3b2/` returns nothing.
5. Record Q1–Q8 as **D20–D27** in the sweep `worklist.md` before review work
   starts (D1–D19 are already recorded and are not renumbered). Decisions go in
   the worklist, not this file, so the stamped plan hash stays valid.
6. Record the plan gate's evidence sidecar (the external `plan-gate.mjs preflight`
   harness under the plan-review skill directory) beside the stamped artifact.
7. Re-derive the partition (93 REQ IDs, 33 + 28 + 32) and the bucket for each
   family from `spec/audit/req-coverage.md` (EV5/EV6). A mismatch is fixed in
   the worklist, not by silently re-scoping.

### Phase 1 — Code side (read-only review)

1. **Enumerate the surface**, recording `file:line` anchors in the worklist:
   every `manage_character` and `manage_npc` action case, the `manage_scene`
   presence and fast-forward paths, the roster map operations, `createEntity` and
   entity-removal paths, every `entity://` and `npc://` resource projection, the
   presence and knowledge gates, the personality/voice/signal renderers, the
   briefing sections that carry personality, boundary, and connection state, and
   the cardinality guards in `core/limits.ts`. Enumeration confirms names;
   nothing is assumed from the P3b-1 worklist.
2. **Run a read-only conformance review cluster by cluster (A, B, C)** — the
   `code-review` lenses against the current tree and each cluster's REQ bodies,
   with no diff and no edits. Findings batched, one pass per cluster. A finding
   cites the predicate (`file:line`), never a gate message.
3. **Check the carrying assertion against the REQ text** for every REQ a harness
   is believed to carry: open the test, read what it asserts, and confirm it
   tests what the REQ states. A passing harness asserting something narrower is a
   finding (the class that produced F-P1-1 and F-P3B1-3). In particular verify
   that `T129`/`T126`/`T127`/`T128`/`T143`/`T191`/`T200`–`T202`/`T211`/`T216`–`T220`
   assert the full contract, not a substring.
4. **Verify entity lifecycle and roster arithmetic by reading the
   implementation**: stage/remove symmetry (REQ-176/177), roster listing shape
   (REQ-178), removal undoability, and cardinality refusals that name the group
   and the limit (REQ-129). A roster entry that diverges from the Novel entity
   baseline is a finding.
5. **Verify presence and knowledge gating** (REQ-307/308/330): an absent
   entity's narrative fields, lore, and knowledge must not leak into Player
   surfaces; the presence snapshot for the scene ledger must record movers.
   Test the empty-presence and unknown-entity cases explicitly.
6. **Verify NPC records and stat blocks** (REQ-075/119/120/121/122/156): the
   `ruleset_reference` links without copying, the rendering path resolves the
   referenced block, the `npc://` resources return the documented shape, and
   card import/export round-trips the fields REQ-075h/i name.
7. **Verify personality, voice, and signal surfaces** (REQ-077/126/127/282/165/
   166/167/069/128/255/173): ownership gating (REQ-165), briefing rendering and
   resource URIs (REQ-166/167), the voice directive and examples (REQ-282/126),
   the Player feedback signal and its briefing surface (REQ-069/128), boundary
   propagation (REQ-255), and the connection counter increment/reset
   (REQ-173). Null/empty fields must omit cleanly rather than render `undefined`.
8. **Record one verdict per REQ** in the worklist's chunk P3b-2 table (93 rows,
   done-bar item 2), plus one **cluster verdict row** per cluster in the same
   section: `holds` named with the gate or harness that carries the cluster, or
   the finding IDs it produced (done-bar item 5).

### Phase 2 — Spec side (citation resolution)

1. Apply the reproducible method (Q6): each REQ's own `*Check:*` IDs; a REQ with
   no own Check inherits its family's citation set; an `Automated` citation must
   appear literally in a `holonovel/scripts` harness **and** its body must
   exercise the stated behaviour; `Manual`, `Gate`, and scenario citations need
   none. Bucket from the base family row per Q4.
2. Classify citation *kind* before counting a missing harness: P1's first pass
   produced 69 false findings by skipping it; P2 saw 20 from zero-padded token
   shadowing (F-P2-4). A scenario citation needs no harness; an `Automated`
   token with no harness is a finding.
3. A REQ whose cited test does not exercise the stated behaviour is a finding.
   `npm run check:conformance -- --dedicated` over-flags on this corpus
   (AGENTS.md), so its output is evidence to inspect, never a finding by itself.
4. Fill the bucket and verdict columns for all 93 rows.

### Phase 3 — Triage, registers, roadmap, artefacts

1. **Triage** every finding per Q2. Guardrails for a P0 fix:
   - A fix that changes an action's parameters or output first runs a
     sibling-contract check: grep the REQ corpus for other REQs naming the same
     `tool (action: X)` and confirm no sibling contract conflicts.
   - A fix that amends a REQ body complies with Appendix M's authoring limits
     (one paragraph, no tables/bullets/steps, 800-char and 8-sentence caps);
     `npm run validate --sdd-strict` is the check.
   - A fix that edits a §5.6 REQ body: `npm run assemble`, then
     `npm run validate -- --write-register`, then `npm run build-order` — §5.6 is
     in `DATA_SECTIONS`, so the fingerprint **must** regenerate (Q7).
   - A fix that edits a tool definition re-runs the generator and the surface
     gates (`npm run build-order`); `check-tool-definitions-sync` fails on a
     stale `tool-definitions.json`.
   - A fix that edits an action's contract enumerates the full surface before
     editing: registration and description in `holonovel/src/index.ts`, the
     generated `holonovel/tool-definitions.json`, the dispatch case, and the
     owning harness; re-run that harness and add the assertion there.
2. **`spec/audit/review-register.md`**: one dated heading per used disposition
   section, rows per **Register write-back** below.
3. **`ROADMAP.md`**: keep the sweep item's 1–3 bullet + `**Trigger:**` shape
   (`check-roadmap` rejects any other) and update it to:
   - bullet 1 — chunks P3b-3 (adventure content, 39 REQs) and P3b-4 (state
     surfaces and fingerprinting, 67);
   - bullet 2 — chunk P4 (`core/state.ts` persistence, §5.19 cross-check) and
     chunks P5–P7 (engine loop, adapters/rulesets, determinism);
   - bullet 3 — chunk P8 (narrative cognition) and the closing M1 re-run;
   - trigger — chunk P3b-3;
   and add nothing else: the sweep item remains the single scheduling surface.
4. **`CHANGELOG.md`**: one dated heading
   `<YYYY-MM-DD> — Full-review sweep: chunk P3b-2 (§5.6 entities and NPCs)`.
   The date equals the current CalVer date written with hyphens (`2026.11.09`
   → `2026-11-09`); verify at execution.
5. **Artefacts**: replace the provisional `aar.md` with the execution record and
   the token the outcome earns, and update the sweep worklist's status table
   (P3b-2 closed-or-halted; P3b-3/P3b-4 remain `scheduled`).

## Register write-back

| Disposition | Section | Row shape |
|---|---|---|
| `Resolved` | `## Resolved` | `### <date> full-review sweep — chunk P3b-2`; bullet `**P3B2-FN — <title> (resolved):**` + predicate + the REQ IDs it covers + fix location + the assertion that now covers it |
| `Scheduled-roadmap` | `## Scheduled-roadmap` | same heading; bullet names the finding, the predicate, the REQ IDs it covers, and the `ROADMAP.md` section it is scheduled under |
| `Closed-P3` | `## Closed-P3 (recorded, no action)` | same heading; bullet records the predicate, the REQ IDs, and why no action follows |
| `Deferred-by-user` | `## Deferred-by-user` | only on an explicit user deferral; names the decision |

A finding scheduled against a later sweep chunk writes both the register row and
the chunk reference in the sweep `worklist.md`; a finding scheduled against a
roadmap section writes the `ROADMAP.md` entry in the same step (`check-registers`
cross-references the two).

## Stopped-run landing

If a P0 cannot be fixed within the session, the run halts and still lands as a
record:

1. `worklist.md` marks chunk P3b-2 `halted on <finding ID>` and keeps the
   partial per-REQ table.
2. `ROADMAP.md` gains an additional section for the P0: heading
   `## <finding ID> — <title> (P0)`, 1–3 bullets naming the predicate and the
   reproduction, and a `**Trigger:**` line; the admission rule applies.
3. `CHANGELOG.md` heading reads
   `<date> — Full-review sweep: chunk P3b-2 (halted on <finding ID>)`.
4. `aar.md` ends `LOOP OPEN` naming the P0 row; gates still run. Green is
   required for whatever landed **except** the red-baseline branch below.
5. No push. The P0 is the next session's first item, ahead of chunk P3b-3.

**Red-baseline branch.** When the unfixable P0 is the baseline itself (Phase 0's
`npm run check` or a server harness is red and cannot be fixed in-session), the
landing records the red gate output verbatim in the AAR, lands the planning
artifacts, the baseline record, and the `ROADMAP.md` P0 section, and the
run does **not** claim green gates. `LOOP OPEN` names the red gate. Do not
commit review findings against a tree whose gates were never green.

## Blast radius

| File | Change | Size |
|---|---|---|
| `docs/plans/2026-11-09-full-review-p3b2/{plan,tasks,aar}.md` | this increment's artefacts | M |
| `docs/plans/2026-11-09-full-review-sweep/worklist.md` | chunk P3b-2 section, 93-row table, D20–D27, status rows | M |
| `spec/audit/review-register.md` | P3b-2 finding rows (one dated subsection per used disposition) | S |
| `ROADMAP.md` | sweep bullets re-scoped to P3b-3/P3b-4/P4–P8/M1; trigger advanced to P3b-3; extra section only on a halted P0 | S |
| `CHANGELOG.md` | dated heading + bullets | S |
| `holonovel/src/**`, `holonovel/scripts/test-*.ts` | only if a P0 fix lands (named at that time) | S–M |
| `holonovel/src/generated/contract-fingerprints.ts` | regenerated by `build-order` if a §5.6 REQ body changes (Q7) | — |
| `holonovel/tool-definitions.json` | regenerated only if a P0 fix edits a tool definition | — |
| `spec/**` + `holonovel.md` | only if a P0 fix amends a REQ (then `assemble` + register refresh) | S–M |
| `spec/audit/req-coverage.md` | refreshed by `npm run validate -- --write-register` when a §5.6 REQ body changes | S |
| `README.md` | `@spec:` markers refreshed by `npm run refresh-properties` only when a P0 fix amends a §5.6 REQ body (`check-markers` gates it) | S |
| `holonovel/package.json`, `package-lock.json`, `server.json`, `AGENTS.md`, `DECISIONS.md` header | advanced by `build-order` version sync | — |

## Considered and rejected

- **Reviewing P3b-2 and P3b-3 in one increment.** Rejected: the chunk record
  stays falsifiable only when a family belongs to exactly one row set; 93 rows
  is already the largest single chunk in the program.
- **Splitting P3b-2 into entity and NPC halves.** Rejected: cluster C families
  (personality/voice/signal) bind entity and NPC records together, so a split
  would assign one action's contract to two chunks. The stopped-run landing is
  the only split point.
- **Treating the three bucket-E families as unreviewable.** Rejected: a builder
  verdict is recorded, not skipped; `REQ-124` has runtime damage handling even
  though its coverage row is E.
- **Auditing `core/state.ts` persistence and the engine loop here.** Rejected:
  chunk P4 and P5 own those surfaces (Q5).
- **Fixing every finding.** Rejected: P1/P2/P3 findings are scheduled or closed;
  only a P0 blocks the chunk's close.
- **Consolidating §5.6 while reviewing it.** Rejected: the register already
  defers consolidation by user decision (EV9).

## Verification

| Check | Command | Expected |
|---|---|---|
| Assembly | `npm run assemble` | exit 0 |
| Fast gate | `npm run check:fast` (un-piped) | 37/37, `check:fast: PASS` |
| Full gate | `npm run check` | 0 errors |
| Server harnesses | `npm --prefix holonovel run test:all` (authoritative; includes `test-limits`, `test-briefing`, `test-persistence-guardrails`, `test-fingerprints`) | exit 0, record per-harness summary |
| Roadmap admission | `npm run check-roadmap` | pass after the roadmap edit |
| Register cross-refs | `npm run check-registers -- --strict` | pass |
| Loop artefacts | `npm run check-loop-artifacts` | pass, LOOP token present |
| Coverage register | `npm run validate -- --write-register` | only when a §5.6 REQ body changed |
| REQ shape (conditional) | `npm run validate --sdd-strict` | only when a P0 fix amends a REQ body; 0 shape errors |
| Fingerprints (conditional) | `npm run build-order` | 0 errors; `check-fingerprint-sync` passes |
| Machine evidence | `npm run check:conformance` | exit 0; record the summary |

## Risks and rollback

- **A finding whose predicate lands in `state.ts` file I/O.** Mitigation: record
  the predicate and reference chunk P4 (Q5); do not chase it here.
- **A finding whose predicate lands in engine scheduling or subjective-memory
  internals.** Mitigation: record against P5/P8 (Q5).
- **False citation holds.** Mitigation: open every cited test; the zero-padded
  token class (F-P2-4) is a known shadowing source.
- **The 93-row table exceeding the session.** Mitigation: the family fence is
  fixed; if the session caps, land per **Stopped-run landing** rather than
  committing a partial table as complete.
- **Gate-pinned values.** The changelog date is the CalVer date;
  `session:close` derives the commit subject from the top CHANGELOG heading.
- **Draft artefact breaks a gate mid-session.** `check-loop-artifacts` requires
  plan, tasks, and a LOOP token; all three are created in one step.
- **No destructive operations, no push.** Every change is a reversible edit or an
  added artefact; rollback cost 1 (one `git revert`) when there is no C0, or 2
  (revert C1 then C0) when a baseline fix landed first.

## Commit order and gates

| # | Commit | Scope | Gate before commit |
|---|---|---|---|
| C0 (conditional) | Restore a green baseline | only if Phase 0's `npm run check` or a server harness is red — that fix alone | `check:fast`, `check`, plus the red server harness re-run |
| C1 | Full-review sweep: chunk P3b-2 (§5.6 entities and NPCs) | plan/tasks/AAR, worklist chunk-P3b-2 rows and status, register rows, ROADMAP.md, CHANGELOG.md, any P0 fix | `assemble`, `check:fast`, `check`, `check-roadmap`, `check-registers --strict`, `check-loop-artifacts`, `build-order`, `npm --prefix holonovel run test:all` (and `validate --sdd-strict` if a REQ body changed) |

C1 is one commit (spec increment); C0 exists only when the baseline is red and
lands first. Publication is not part of this increment.

## User impact

None to runtime behaviour unless a P0 fix lands. The increment changes review
records, the roadmap trigger (advanced to P3b-3), and the changelog; P3b-3 and
P3b-4 stay scheduled, not executed.

## Evidence

- Review artefact: this file; tracker:
  `docs/plans/2026-11-09-full-review-sweep/worklist.md`.
- Finding predicates: recorded per finding in `spec/audit/review-register.md`.
- Baseline: EV1–EV12 above (repo and tool-output sources).
- No external sources; no user-supplied content drives an instruction.
