# Plan — Full-review sweep, chunk P3b-3 (§5.6 adventure content)

**Status:** draft, awaiting user approval · **Date:** 2026-11-09 · **Depth:** standard
**Review independence:** fresh — cold pass `independent-review passed.` (1
blocker, 1 major, 5 nits on the first artifact; all resolved and the stage-only
re-audit passed 5/5 on the revised bytes)
**Roadmap item:** `ROADMAP.md` § Remaining full-review sweep (P1)
**Predecessor:** `docs/plans/2026-11-09-full-review-p3b2/` (chunk P3b-2, closed
2026-11-09, `LOOP PAUSED`)
**Tracker:** `docs/plans/2026-11-09-full-review-sweep/worklist.md`

## Review status

Drafted and self-reviewed against the plan-review checklist (§1–§8). One
standard-depth cold pass ran (`independent-review FAILED.` — 1 blocker:
`Scheduled-roadmap` rows had no conforming `ROADMAP.md` destination; 1 major:
no verdict for a predicate deferred to a later chunk; 5 nits). All were
resolved in the revision, and the stage-only re-audit returned
`independent-review passed.` (5/5 stages, 24/40 reads on the cold pass): done
bar 7 and Phase 3 permit a remediation section that names its REQs and carries
its own trigger, done bar 2 adds `deferred:<chunk>`, the fence spells
`REQ-247a/b1/b2/c`, cluster B may verdict `builder-side`, finding IDs use the
`F-P3B3-N` grammar, Q7 carries a recommendation, and EV7 anchors are
re-measured at HEAD `6ca27ba`. Report
`/tmp/opencode/p3b3-independent-review.md`.

## Done bar

**Done bar:** this increment only — chunk P3b-3 of the sweep program. The bar is
met when all nine items hold; anything else found is scheduled, not chased.

1. `docs/plans/2026-11-09-full-review-p3b3/` carries `plan.md`, `tasks.md`, and
   `aar.md`, and `aar.md` ends in `LOOP PAUSED` or `LOOP OPEN`.
   `check-loop-artifacts` passes.
2. The sweep `worklist.md` holds a chunk P3b-3 section with **one row per REQ in
   the chunk — 39 rows across 11 families**, each carrying its bucket inherited
   from the base family row in `spec/audit/req-coverage.md` (D14) and a verdict
   of `holds` (including `holds (inherited from <family>)` for sub-REQs with no
   own `_Check:` and `holds (fixed <finding>)` for an in-session P0),
   `finding:<ID>`, `builder-side`, or `deferred:<chunk>` (a behaviour the REQ
   states that lands wholly in a later chunk's surface — P4/P6 per Q5 — recorded
   without a register finding; the worklist row names the owning chunk). That
   row set, not the gate result, is the falsifiable record that the chunk was
   reviewed.
3. Every `finding:<ID>` names a `file:line` or `spec:line` predicate and a
   P-severity, and has a terminal disposition (`Resolved` · `Scheduled-roadmap` ·
   `Closed-P3` · `Deferred-by-user`).
4. Zero open P0 findings remain. A P0 that cannot be fixed inside the session
   stops the run and still lands as a record (see **Stopped-run landing**).
5. Each of the four clusters (A–D below) has a recorded review verdict: `holds`
   with the gate or harness that carries it, the finding IDs it produced, or
   `builder-side` (cluster B). A cluster is not "reviewed" because a gate is
   green.
6. `spec/audit/review-register.md` carries every P3b-3 finding under the section
   its disposition names; no `Scheduled-roadmap` row is written without its
   matching `ROADMAP.md` entry, and every `REQ-NNN` token in a
   `Scheduled-roadmap` row appears literally in `ROADMAP.md`
   (`scripts/lib/register-checks.ts:64-68`, strict inside `npm run check`).
7. `ROADMAP.md` is updated in the same increment: the sweep section names the
   remaining P3b sub-chunk (P3b-4) and chunks P4–P8 plus M1, its `**Trigger:**`
   line names chunk P3b-4, and the section keeps the admission shape (1–3
   bullets + `**Trigger:**`). A new remediation section (halted P0 or
   P1-schedule, the P3b-2 precedent) is added **only** when a finding needs it;
   it carries its own `**Trigger:**` line and cites every REQ its register rows
   name; when no finding needs one, no second section is added.
8. These exit 0 un-piped: `npm run assemble`, `npm run check:fast`,
   `npm run check`.
9. The increment is one commit, subject derived by `npm run session:close` from
   the `CHANGELOG.md` heading; a conditional C0 baseline fix precedes it as its
   own commit. No push.

## Open questions (answers recorded as decisions before execution)

- **Q1 — Chunk scope.** `ROADMAP.md` names chunk P3b-3 as §5.6 adventure content:
  **39 REQs across 11 families** (D12). The fence is the remaining §5.6 families
  after P3b-1 (19 families), P3b-2 (30), and P3b-4 (15): `REQ-079`, `132`, `170`,
  `171`, `172`, `229`, `247`–`250`, `292`. Families stay atomic.
  **Recommendation:** execute as one increment; the stopped-run landing is the
  only split point.
- **Q2 — Fix policy.** D13 unchanged: P0 fixed in-session (bounded), P1
  scheduled on `ROADMAP.md`, P2 fixed only on a demonstrated failure, P3
  record-and-close. **Recommendation:** adopt, so chunks stay comparable.
- **Q3 — Increment record.** New directory
  `docs/plans/2026-11-09-full-review-p3b3/` for this increment's plan/tasks/AAR;
  the sweep `worklist.md` stays the cross-session tracker and carries the P3b-3
  verdict table and decisions. **Recommendation:** yes.
- **Q4 — Bucket resolution.** Resolve by base family ID from
  `spec/audit/req-coverage.md` (D14), never by section membership. Eight families
  are bucket C (32 REQs); three are bucket E (7 REQs: `REQ-171a/b`, `REQ-172`,
  `REQ-247a/b1/b2/c`); none A/B/D. Re-verify at Phase 0. **Recommendation:** yes.
- **Q5 — Chunk boundaries.** P3b-3 reviews the adventure *content* contract:
  module load/pre-population, catalog and discovery surfaces, build-time
  validation and structure extraction, the adventure resources, the scene
  waypoint, synthesis linkage, and generated-adventure lifecycle. State
  persistence internals stay with P4; the engine loop with P5; badge gating
  mechanics are reviewed only where an adventure surface owns the rule;
  `manage_ruleset (action: search)` ranking internals that are not
  adventure-specific stay with P6. **Recommendation:** record and defer across
  the boundary.
- **Q6 — Citation resolution scope.** Apply chunk P2/P3b-1's method unchanged:
  each REQ's own `*Check:*` IDs; a REQ with no own Check inherits its family's
  citation set; an `Automated` citation must appear literally in a
  `holonovel/scripts` harness **and** the harness body must be opened and must
  exercise the stated behaviour; `Manual`, `Gate`, and scenario citations need
  no harness. Zero-padded title tokens (`T0nn`) are shadowing, not evidence
  (F-P2-4, open under ROADMAP *Harness test-ID label hygiene*).
  **Recommendation:** adopt.
- **Q7 — Fingerprint consequence.** §5.6 is in `DATA_SECTIONS`
  (`scripts/lib/contract-fingerprint.ts:38`), so **any** REQ-body edit in this
  chunk requires `npm run build-order` to regenerate
  `holonovel/src/generated/contract-fingerprints.ts`. The plan budgets for it.
  **Recommendation:** adopt; the increment is review-only, so this triggers only
  if a P0 fix amends a REQ body.
- **Q8 — Publication.** `npm run status` reports **9 unpushed commits** at
  session start (EV2). **Recommendation:** no push; publication stays
  user-authorized.

## Scope

**In scope.** Chunk P3b-3 review of the 39 adventure-content REQs: adventure
module load and world-model population (REQ-079a–j2), the adventure catalog
(REQ-292a–d), the discovery surface and `spec_health` fields (REQ-170),
build-time validation and drift detection (REQ-171a/b, REQ-172), structural
extraction (REQ-247a/b1/b2/c), the overview/navigation resources (REQ-248a/b,
REQ-249a/b), the scene waypoint and briefing block (REQ-250a–c), synthesis
linkage on load (REQ-229a–d), and generated-adventure lifecycle (REQ-132a–e).
Citation resolution for all 39 REQs. Findings dispositioned. Roadmap trigger
advanced. Register rows. Changelog entry.

**Out of scope.** Chunk P3b-4 (state surfaces and fingerprinting, 67 REQs);
`core/state.ts` save/load/archive internals (P4); the engine loop and event
stream (P5); adapters/rulesets internals and generic search ranking (P6); the
open remediation roadmap items (§5.6 core state, §5.6 entities and NPCs, §5.4
remediation and citation repair, trust-core contract and citation repair,
harness test-ID hygiene, anchor repoint automation); publication.

**Family fence (11 families, 39 REQs).** `REQ-079` (11), `132` (5), `170` (1),
`171` (2), `172` (1), `229` (4), `247` (4), `248` (2), `249` (2), `250` (3),
`292` (4). Total 39. A REQ outside this fence belongs to P3b-4 or another
chunk; record it there, not here.

## Evidence base (this session)

| # | Evidence | Source | Trust |
|---|---|---|---|
| EV1 | `npm run check:fast` → exit 0, 37 passed / 0 failed, trailing line `check:fast: PASS` (`/tmp/opencode/p3b3-baseline-fast.log`) | tool output, this session | tool-output |
| EV2 | `npm run status`: version `2026.11.09`, last publish `2026-11-09T04:30:29Z`, 9 unpushed commits (oldest 16.3 h), 10 open roadmap items | tool output, this session | tool-output |
| EV3 | Tree clean at plan time (`git status --porcelain` empty) before this directory was written; `git rev-parse --short HEAD` = `6ca27ba` | `git status`, `git rev-parse` | repo |
| EV4 | §5.6 spans `spec/02-requirements.md:1452-2266`; the adventure block is `:1940-2065` and holds **39 REQs** (`^**REQ-` count) across **11 families** | `sed` + `uniq -c`, this session | repo |
| EV5 | Coverage register: 11 family rows — **8 bucket C (32 REQs), 3 bucket E (7 REQs)**; none A/B/D | `spec/audit/req-coverage.md:62,115,150-152,207,225-228,264` | repo |
| EV6 | Family sub-part counts (sum 39): 079:11, 132:5, 170:1, 171:2, 172:1, 229:4, 247:4, 248:2, 249:2, 250:3, 292:4 | `grep` + `uniq -c`, this session | repo |
| EV7 | Code surface: `manage_adventure` registration `index.ts:10004` (actions `generate` `:10017`, `generate_encounter` `:10084`, `load` `:10133`, `list` `:10214`), `adventures://` `:10246`, `adventure://{slug}/overview` `:10264`, `adventure://{slug}/navigation` `:10277`, `spec_health` adventure fields `:12033-12037`, briefing waypoint block `:13895-13902`, scene waypoint input and validation `:6139`/`:6203-6208`, adventure file helpers `adventureFiles` `:2498`, `findAdventureFile` `:2514`, `countAdventureModules` `:2520`, `adventure_index` state `core/state.ts:761`, provenance helpers `core/adventure-provenance.ts`. Re-measured at HEAD `6ca27ba`; re-confirm at Phase 1 because anchors drift with any commit | `grep -n`, this session | repo |
| EV8 | §5.6 is a **data-format** section: `DATA_SECTIONS` includes `"### 5.6 "` (`scripts/lib/contract-fingerprint.ts:38`), so REQ-body edits require fingerprint regeneration via `build-order` (Q7) | `grep -n` | repo |
| EV9 | Adventure harnesses: `test-adventure.ts` carries `T75`, `T367`, `T244`, `T734`, `T735`, `T740`, `T741`; `test-output-contracts.ts:1080` carries `T146`/`T285`/`T286`, `:1094` `T207`/`T338`, `:1105` `T284`, `:1121` `T305`. Several REQ-cited tokens (`T59`, `T60`, `T61`, `T206`, `T287`, `T368`, `T208`, `T209`, `T283`) have no harness title at plan time — a review lead, not yet a finding | `grep -rl`, this session | repo |
| EV10 | No §5.6 adventure-specific gate exists. `check:fast` says nothing about adventure behaviour; `npm --prefix holonovel run test:all` is the authoritative run and must include `test-adventure` and `test-output-contracts` | `holonovel/package.json`, EV1 | repo |
| EV11 | The roadmap's sweep section names chunk P3b-3 as the next start and closes when P3b-3–P8 and M1 report | `ROADMAP.md:15-28` | repo |
| EV12 | Zero-padded harness title tokens shadow real IDs (F-P2-4), scheduled under ROADMAP *Harness test-ID label hygiene*; they are not evidence | `spec/audit/review-register.md` | repo |

## The chunk's review surface — four clusters

Mapping check: the 39 REQ IDs partition across these clusters with no gap and no
duplicate (15 + 8 + 11 + 5 = 39). Re-verify before starting.

| Cluster | REQs | Families | Count | Code/spec target |
|---|---|---|---|---|
| **A** indexed module load and catalog | 079a–j2, 292a–d | 2 | 15 | `manage_adventure (action: load)` (`index.ts:10133`), `list` (`:10214`), `adventures://` (`:10246`), `spec_health` fields (`:12033-12037`), `core/adventure-provenance.ts`, `novel.adventure_index` (`core/state.ts:761`) |
| **B** discovery, validation, drift, extraction | 170, 171a–b, 172, 247a–c | 4 | 8 | Build-time discovery/extraction (§6.3 paths), `spec_health` `indexed_adventures` (`:12033-12035`), adventure directory scan (`index.ts:2493`), Appendix K conventions |
| **C** resources, waypoint, synthesis linkage | 248a–b, 249a–b, 250a–c, 229a–d | 4 | 11 | `adventure://{slug}/overview` (`:10264`), `adventure://{slug}/navigation` (`:10277`), briefing block (`:13895-13902`), `manage_scene (action: set)` waypoint (`:6139`, `:6203-6208`), synthesis augmentation on load (`:10200-10210`) |
| **D** generated-adventure lifecycle | 132a–e | 1 | 5 | `manage_adventure (action: generate)` (`index.ts:10017-10082`), `novel.generated_adventure`, `adventure://generated/*`, discard on `manage_novel (action: end)` |

Cluster B's three bucket-E families (`REQ-171`, `REQ-172`, `REQ-247`) are
builder-side: their verdict is `builder-side` unless a runtime predicate exists,
in which case they are reviewed like any other REQ. A predicate that lands in
`core/state.ts` persistence is recorded against P4; a generic search-ranking
predicate that is not adventure-specific is recorded against P6.

## Steps

### Phase 0 — Baseline (no source edits)

1. Re-run `npm run check:fast` un-piped immediately before the review and record
   the exit status; run `npm run check` once so the full gate's baseline is
   measured rather than inherited from EV1. A red baseline is a P0 and is fixed
   first, as its own commit; if it cannot be fixed in-session, land per
   **Stopped-run landing** (red-baseline branch) and do not claim a green record.
2. Run `npm --prefix holonovel run test:all` and record the per-harness summary
   and exit status; at minimum the run must include `test-adventure`,
   `test-output-contracts`, `test-briefing`, `test-narrative`, `test-supplementary`,
   `test-workflow`, `test-persistence`, `test-tool-surface`, and
   `test-tool-definitions` (EV10).
3. Confirm `git status --porcelain` shows **only** the untracked
   `docs/plans/2026-11-09-full-review-p3b3/` directory and record
   `git rev-parse --short HEAD`.
4. Confirm the artefact directory is trackable: `git check-ignore -v
   docs/plans/2026-11-09-full-review-p3b3/` returns nothing.
5. Record Q1–Q8 as **D28–D35** in the sweep `worklist.md` before review work
   starts (D1–D27 are already recorded and are not renumbered). Decisions go in
   the worklist, not this file, so the stamped plan hash stays valid.
6. Record the plan gate's evidence sidecar (the external `plan-gate.mjs preflight`
   harness under the plan-review skill directory) beside the stamped artifact.
7. Re-derive the partition (39 REQ IDs, 15 + 8 + 11 + 5) and the bucket for each
   family from `spec/audit/req-coverage.md` (EV5/EV6). A mismatch is fixed in
   the worklist, not by silently re-scoping.

### Phase 1 — Code side (read-only review)

1. **Enumerate the surface**, recording `file:line` anchors in the worklist:
   every `manage_adventure` action case and its parameters, `findAdventureFile` /
   `adventureFiles` / `countAdventureModules`, the `adventures://` and
   `adventure://` resource bodies, the `spec_health` adventure fields, the scene
   waypoint path and briefing block, the synthesis augmentation path, the
   `generate` scaffold and its persistence, and the build-time discovery code (§6.3).
   Enumeration confirms names; nothing is assumed from the P3b-2 worklist.
2. **Run a read-only conformance review cluster by cluster (A, B, C, D)** — the
   `code-review` lenses against the current tree and each cluster's REQ bodies,
   with no diff and no edits. Findings batched, one pass per cluster. A finding
   cites the predicate (`file:line`), never a gate message.
3. **Check the carrying assertion against the REQ text** for every REQ a harness
   is believed to carry: open the test, read what it asserts, and confirm it
   tests what the REQ states. A passing harness asserting something narrower is a
   finding (the class that produced F-P1-1 and F-P3B1-3). In particular verify
   that `T146`/`T207`/`T244`/`T284`/`T285`/`T286`/`T305`/`T338` assert the full
   contract, not a substring, and classify the REQ-079 citations `T59`, `T60`,
   `T61`, `T206`, `T287`, `T368` (EV9) before treating them as absent.
4. **Verify module load and pre-population** (REQ-079a–j2): `## World` assertion
   extraction and `@encounter`/`@trap`/`@npc`/`@lore` linking, flat-prose fallback,
   duplicate skipping with a note, skeletal NPCs and fuzzy monster suggestions,
   anchor addressing, sort order and confidence, badge filtering of adjudicator
   sections, `target: codex` with no active Novel, codex storage and `source:
   loaded:<slug>`, state isolation on end/switch, and archive export/import.
5. **Verify the catalog and discovery surface** (REQ-292a–d, REQ-170): every
   catalog field, complexity thresholds, the genre filter under both badges, the
   empty state, `adventure_catalog_count`, `indexed_adventures` slugs and
   content hashes, `adventures://` badge filtering, and `help("manage_adventure
   (action: list)")`.
6. **Verify validation, drift, and extraction** (REQ-171, REQ-172, REQ-247):
   confirm whether the build-time validation, `[malformed-adventure]`,
   `[adventure-drift]`, and structural extraction exist at all; a bucket-E verdict
   is `builder-side` only when the REQ is genuinely builder-side and not a
   runtime contract.
7. **Verify the adventure resources, waypoint, and synthesis linkage**
   (REQ-248, REQ-249, REQ-250, REQ-229): premise/NPC roles/location one-liners/
   factions/scene count, badge filtering per section marker, empty-index warnings,
   `[STATE_CONFLICT]` when no adventure is loaded, `[→]` and adjacent-scene
   markers, `[NOT_FOUND]` enumeration, clearing, transition hook, briefing
   labeling, and the augmentation section's presence/omission rules.
8. **Verify generated-adventure lifecycle** (REQ-132a–e): Novel scope and
   discard, replacement semantics, coexistence with an indexed adventure,
   briefing order, the `[generated]` search tag and its non-effect on sort,
   `## World` generation when the premise is spatial, and world-object discard.
9. **Record one verdict per REQ** in the worklist's chunk P3b-3 table (39 rows,
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
4. Fill the bucket and verdict columns for all 39 rows.

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
   - bullet 1 — chunk P3b-4 (state surfaces and fingerprinting, 67 REQs), the
     last §5.6 sub-chunk;
   - bullet 2 — chunk P4 (`core/state.ts` persistence, §5.19 cross-check) and
     chunks P5–P7 (engine loop, adapters/rulesets, determinism);
   - bullet 3 — chunk P8 (narrative cognition) and the closing M1 re-run;
   - trigger — chunk P3b-4.
   When triage produces scheduled findings, **also** add one remediation section
   (the P3b-2 precedent) whose bullets name their `REQ-NNN` IDs, because
   `check-registers --strict` requires every REQ in a `Scheduled-roadmap` row to
   appear literally in `ROADMAP.md` (`scripts/lib/register-checks.ts:64-68`).
   When it produces none, add no second section.
4. **`CHANGELOG.md`**: one dated heading
   `<YYYY-MM-DD> — Full-review sweep: chunk P3b-3 (§5.6 adventure content)`.
   The date equals the current CalVer date written with hyphens (`2026.11.09`
   → `2026-11-09`); verify at execution.
5. **Artefacts**: replace the provisional `aar.md` with the execution record and
   the token the outcome earns, and update the sweep worklist's status table
   (P3b-3 closed-or-halted; P3b-4 remains `scheduled`).

## Register write-back

| Disposition | Section | Row shape |
|---|---|---|
| `Resolved` | `## Resolved` | `### <date> full-review sweep — chunk P3b-3`; bullet `**F-P3B3-N — <title> (resolved):**` + predicate + the REQ IDs it covers + fix location + the assertion that now covers it |
| `Scheduled-roadmap` | `## Scheduled-roadmap` | same heading; bullet names the finding, the predicate, the REQ IDs it covers, and the `ROADMAP.md` section it is scheduled under; each cited `REQ-NNN` also appears literally in `ROADMAP.md` |
| `Closed-P3` | `## Closed-P3 (recorded, no action)` | same heading; bullet records the predicate, the REQ IDs, and why no action follows |
| `Deferred-by-user` | `## Deferred-by-user` | only on an explicit user deferral; names the decision |

A finding scheduled against a later sweep chunk writes both the register row and
the chunk reference in the sweep `worklist.md`; a finding scheduled against a
roadmap-section-owned fix writes the `ROADMAP.md` entry in the same step
(`check-registers` cross-references the two, and the REQ-literal rule applies to
every `Scheduled-roadmap` row).

## Stopped-run landing

If a P0 cannot be fixed within the session, the run halts and still lands as a
record:

1. `worklist.md` marks chunk P3b-3 `halted on <finding ID>` and keeps the
   partial per-REQ table.
2. `ROADMAP.md` gains an additional section for the P0: heading
   `## <finding ID> — <title> (P0)`, 1–3 bullets naming the predicate and the
   reproduction, and a `**Trigger:**` line; the admission rule applies.
3. `CHANGELOG.md` heading reads
   `<date> — Full-review sweep: chunk P3b-3 (halted on <finding ID>)`.
4. `aar.md` ends `LOOP OPEN` naming the P0 row; gates still run. Green is
   required for whatever landed **except** the red-baseline branch below.
5. No push. The P0 is the next session's first item, ahead of chunk P3b-4.

**Red-baseline branch.** When the unfixable P0 is the baseline itself (Phase 0's
`npm run check` or a server harness is red and cannot be fixed in-session), the
landing records the red gate output verbatim in the AAR, lands the planning
artifacts, the baseline record, and the `ROADMAP.md` P0 section, and the
run does **not** claim green gates. `LOOP OPEN` names the red gate. Do not
commit review findings against a tree whose gates were never green.

## Blast radius

| File | Change | Size |
|---|---|---|
| `docs/plans/2026-11-09-full-review-p3b3/{plan,tasks,aar}.md` | this increment's artefacts | M |
| `docs/plans/2026-11-09-full-review-sweep/worklist.md` | chunk P3b-3 section, 39-row table, D28–D35, status rows | M |
| `spec/audit/review-register.md` | P3b-3 finding rows (one dated subsection per used disposition) | S |
| `ROADMAP.md` | sweep bullets re-scoped to P3b-4/P4–P8/M1; trigger advanced to P3b-4; one remediation section only when triage schedules findings (it must name their REQs); extra P0 section only on a halted run | S |
| `CHANGELOG.md` | dated heading + bullets | S |
| `holonovel/src/**`, `holonovel/scripts/test-*.ts` | only if a P0 fix lands (named at that time) | S–M |
| `holonovel/src/generated/contract-fingerprints.ts` | regenerated by `build-order` if a §5.6 REQ body changes (Q7) | — |
| `holonovel/tool-definitions.json` | regenerated only if a P0 fix edits a tool definition | — |
| `spec/**` + `holonovel.md` | only if a P0 fix amends a REQ (then `assemble` + register refresh) | S–M |
| `spec/audit/req-coverage.md` | refreshed by `npm run validate -- --write-register` when a §5.6 REQ body changes | S |
| `README.md` | `@spec:` markers refreshed by `npm run refresh-properties` only when a P0 fix amends a §5.6 REQ body (`check-markers` gates it) | S |
| `holonovel/package.json`, `package-lock.json`, `server.json`, `AGENTS.md`, `DECISIONS.md` header | advanced by `build-order` version sync | — |

## Considered and rejected

- **Folding P3b-3 and P3b-4 into one increment.** Rejected: the falsifiable
  chunk record needs a family to belong to exactly one row set; P3b-4's 67 rows
  are already the largest remaining chunk.
- **Treating the three bucket-E families as unreviewable.** Rejected: a builder
  verdict is recorded, not skipped; `REQ-172` states a runtime startup check and
  `REQ-171` a `spec_health` entry, so both may carry runtime predicates.
- **Auditing `core/state.ts` persistence here.** Rejected: chunk P4 owns it (Q5).
- **Fixing every finding.** Rejected: P1/P2/P3 findings are scheduled or closed;
  only a P0 blocks the chunk's close.
- **Re-splitting §5.6.** Rejected: D12 fixed four family-atomic sub-increments;
  the stopped-run landing is the only split point.
- **Scheduling P1 findings inside the sweep bullets only.** Rejected:
  `check-registers --strict` requires every `REQ-NNN` a `Scheduled-roadmap` row
  cites to appear literally in `ROADMAP.md`; a remediation section that names
  them is the only conforming destination once a finding exists.
- **Recording P4/P6 predicates as `finding:` rows.** Rejected: a boundary is not
  a defect in this chunk's surface; `deferred:<chunk>` keeps the verdict
  vocabulary mechanical without writing a register finding the code does not
  support.

## Verification

| Check | Command | Expected |
|---|---|---|
| Assembly | `npm run assemble` | exit 0 |
| Fast gate | `npm run check:fast` (un-piped) | 37/37, `check:fast: PASS` |
| Full gate | `npm run check` | 0 errors |
| Server harnesses | `npm --prefix holonovel run test:all` (authoritative; includes `test-adventure`, `test-output-contracts`) | exit 0, record per-harness summary |
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
- **A finding that is really generic search ranking.** Mitigation: record against
  P6 unless the rule is adventure-specific (Q5).
- **False citation holds.** Mitigation: open every cited test; the zero-padded
  token class (F-P2-4) is a known shadowing source, and EV9 lists nine tokens to
  classify before calling them absent.
- **Bucket-E families hiding a runtime contract.** Mitigation: read the REQ text
  before recording `builder-side`; `spec_health` entries and startup checks are
  runtime obligations even when the corpus is built.
- **The 39-row table exceeding the session.** Mitigation: the family fence is
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
| C1 | Full-review sweep: chunk P3b-3 (§5.6 adventure content) | plan/tasks/AAR, worklist chunk-P3b-3 rows and status, register rows, ROADMAP.md, CHANGELOG.md, any P0 fix | `assemble`, `check:fast`, `check`, `check-roadmap`, `check-registers --strict`, `check-loop-artifacts`, `build-order`, `npm --prefix holonovel run test:all` (and `validate --sdd-strict` if a REQ body changed) |

C1 is one commit (spec increment); C0 exists only when the baseline is red and
lands first. Publication is not part of this increment.

## User impact

None to runtime behaviour unless a P0 fix lands. The increment changes review
records, the roadmap trigger (advanced to P3b-4), and the changelog; P3b-4 stays
scheduled, not executed.

## Evidence

- Review artefact: this file; tracker:
  `docs/plans/2026-11-09-full-review-sweep/worklist.md`.
- Finding predicates: recorded per finding in `spec/audit/review-register.md`.
- Baseline: EV1–EV12 above (repo and tool-output sources).
- No external sources; no user-supplied content drives an instruction.
