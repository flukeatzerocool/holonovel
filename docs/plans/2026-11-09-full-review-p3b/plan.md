# Plan — Full-review sweep, chunk P3b-1 (§5.6 core state and lifecycle)

**Status:** draft, awaiting user approval · **Date:** 2026-11-09 · **Depth:** standard
**Review independence:** fresh — cold pass `independent-review passed.` (0 blockers,
2 majors, 4 nits) on revision `d1a252db…`; all six resolved and the diff re-audit
passed on revision `3e0292be…`. Report
`/tmp/opencode/sweep-p3b/independent-review-final.md`. This revision differs from
the diff-audited one only in this header and two citation line wraps.
**Roadmap item:** `ROADMAP.md` § Remaining full-review sweep (P1)
**Predecessor:** `docs/plans/2026-11-09-full-review-p3/` (chunk P3, closed
2026-11-09, `LOOP PAUSED`)
**Tracker:** `docs/plans/2026-11-09-full-review-sweep/worklist.md`

## Done bar

**Done bar:** this increment only — chunk P3b-1 of the sweep program. The bar is
met when all nine items hold; anything else found is scheduled, not chased.

1. `docs/plans/2026-11-09-full-review-p3b/` carries `plan.md`, `tasks.md`, and
   `aar.md`, and `aar.md` ends in `LOOP PAUSED` or `LOOP OPEN`.
   `check-loop-artifacts` passes.
2. The sweep `worklist.md` holds a chunk P3b-1 section with **one row per REQ in
   the chunk — 66 rows**, each carrying its bucket inherited from the base
   family row in `spec/audit/req-coverage.md` and a verdict of `holds`
   (including `holds (inherited from <family>)` for sub-REQs with no own
   `_Check:`), `finding:<ID>`, or `builder-side`. That row set, not the gate
   result, is the falsifiable record that the chunk was reviewed.
3. Every `finding:<ID>` names a `file:line` or `spec:line` predicate and a
   P-severity, and has a terminal disposition (`Resolved` · `Scheduled-roadmap` ·
   `Closed-P3` · `Deferred-by-user`).
4. Zero open P0 findings remain. A P0 that cannot be fixed inside the session
   stops the run and still lands as a record (see **Stopped-run landing**).
5. Each of the three §5.6-1 clusters (A–C below) has a recorded review verdict:
   `holds` with the gate or harness that carries it, or the finding IDs it
   produced. A cluster is not "reviewed" because a gate is green.
6. `spec/audit/review-register.md` carries every P3b-1 finding under the section
   its disposition names; no `Scheduled-roadmap` row is written without its
   matching `ROADMAP.md` entry.
7. `ROADMAP.md` is updated in the same increment: the sweep section names the
   remaining P3b sub-chunks (P3b-2 … P3b-4) and chunks P4–P8 plus M1, its
   `**Trigger:**` line names chunk P3b-2, and the section keeps the admission
   shape (1–3 bullets + `**Trigger:**`). No second roadmap section is added.
8. These exit 0 un-piped: `npm run assemble`, `npm run check:fast`,
   `npm run check`.
9. The increment is one commit, subject derived by `npm run session:close` from
   the `CHANGELOG.md` heading; a conditional C0 baseline fix precedes it as its
   own commit. No push.

## Open questions (answers recorded as decisions before execution)

- **Q1 — Chunk scope.** `ROADMAP.md` names chunk P3b as §5.6 — **265 REQs across
  75 families**, 2.3× chunk P2's 115-row table and 8.3× chunk P3's 32 rows. One
  session cannot review it with a per-REQ verdict table. **Recommendation:**
  split §5.6 into four family-atomic sub-increments and execute the first in
  this increment:
  - **P3b-1 (this increment)** — Core state and lifecycle: **66 REQs, 19
    families** (`REQ-040`, `168`, `041`, `116`, `043`, `203`–`206`, `221`, `217`,
    `072`, `279`, `174`, `175`, `073`, `329`, `289`, `322`).
  - **P3b-2** — Entities and NPCs: 93 REQs, 30 families (`REQ-074`–`129` group).
  - **P3b-3** — Adventure content: 39 REQs, 11 families (`REQ-079`–`132`).
  - **P3b-4** — State surfaces and fingerprinting: 67 REQs, 15 families
    (`REQ-044`, `065`, `232`, `233`, `236`, `237`, `239`, `241`, `242`, `285`,
    `302`, `313`, `314`, `321`, `332`).
  **Families are atomic**: `REQ-073` straddles the §5.6 internal heading split
  (`c1`–`c3` in *Core State and Lifecycle*, `a1`–`a2` in *Fingerprinting and
  State Integrity*); its five parts are assigned whole to P3b-1, its owning block.
  The heading-block counts are 64 / 132 / 69; moving `REQ-073`'s two third-block
  parts into P3b-1 gives 66 / 93 / 39 / 67 = 265, each REQ counted exactly once.
  The mapping invariant holds. This is a user decision, as Q1 was for P3.
- **Q2 — Fix policy.** Chunk P1's D2 adopted unchanged: P0 fixed in-session
  (bounded), P1 scheduled on `ROADMAP.md`, P2 fixed only on a demonstrated
  failure, P3 record-and-close. **Recommendation:** adopt, so chunks stay
  comparable.
- **Q3 — Increment record.** New directory
  `docs/plans/2026-11-09-full-review-p3b/` for this increment's plan/tasks/AAR;
  the sweep `worklist.md` stays the cross-session tracker and carries the
  P3b-1 verdict table and decisions. **Recommendation:** yes.
- **Q4 — Bucket resolution.** Resolve the bucket by base family ID from
  `spec/audit/req-coverage.md`, never by section membership (P3's D8). All 75
  §5.6 families have a §5.6 row, so no foreign-section inheritance is expected;
  re-verify at Phase 0.
- **Q5 — §5.6 / P4 boundary.** Chunk P4 reviews `core/state.ts` persistence
  (save/load, archive, `.trash`, data-dir) against §5.19. P3b-1 reviews the
  *lifecycle* behaviour §5.6 states — audit entries, snapshots/undo/redo
  availability, conflict lifecycle, combat-round and condition transitions,
  recap/clock/vow projections — as observed through the handlers and the public
  state methods. **Recommendation:** record any predicate that lands in
  `state.ts` file I/O and reference chunk P4; do not audit save-format internals
  here.
- **Q6 — Citation resolution scope.** Apply chunk P2's method unchanged: each
  REQ's own `*Check:*` IDs; a REQ with no own Check inherits its family's
  citation set; an `Automated` citation must appear literally in a
  `holonovel/scripts` harness **and** the harness body must be opened (the P2
  lesson: a token match is not evidence the behaviour is exercised);
  `Manual`, `Gate`, and scenario citations need no harness. Zero-padded title tokens
  (`T0nn`) are shadowing, not evidence (F-P2-4).
- **Q7 — Fingerprint consequence.** §5.6 is in `DATA_SECTIONS`
  (`scripts/lib/contract-fingerprint.ts:38`), so **any** REQ-body edit in this
  chunk requires `npm run build-order` to regenerate
  `holonovel/src/generated/contract-fingerprints.ts`; `check-fingerprint-sync` fails
  otherwise. The plan budgets for it.
- **Q8 — Publication.** `npm run status` reports 7 unpushed commits at session
  start (EV2). **Recommendation:** no push; publication stays user-authorized.

## Scope

**In scope.** Chunk P3b-1 review of the 66 core-state-and-lifecycle REQs: the
audit log and its resource, snapshots, undo/redo, conflict lifecycle, combat
initiation/participants/round expiry, combat-navigation interaction, condition
tools, session recap, narrative orientation, the significant-roll and
confrontation-summary derivations, countdowns and their world coupling, vows and
their countdown coupling. Citation resolution for all 66 REQs. Findings
dispositioned. The §5.6 split recorded. Roadmap trigger advanced. Register rows.
Changelog entry.

**Out of scope.** P3b-2 … P3b-4 (93 + 39 + 67 REQs — scheduled by this plan,
not reviewed here); `core/state.ts` save/load/archive internals (Q5, chunk P4);
chunks P5–P8 and M1; §5.9/§5.19 (closed by the 2026-11-09 seam pass); the open
remediation roadmap items (§5.4 remediation, §5.4 citation repair, trust-core
contract and citation repair, harness test-ID hygiene, anchor repoint
automation); publication.

## Evidence base (this session)

| # | Evidence | Source | Trust |
|---|---|---|---|
| EV1 | `check:fast` → exit 0, 37 passed / 0 failed, trailing line `check:fast: PASS` | tool output, this session | tool-output |
| EV2 | `npm run status`: version `2026.11.09`, last publish `2026-11-09T04:30:29Z`, 7 unpushed commits (oldest 14.1 h), 8 open roadmap items | tool output, this session | tool-output |
| EV3 | Tree clean; `git rev-parse --short HEAD` = `cfaad6b` | `git status --porcelain`, `git rev-parse` | repo |
| EV4 | §5.6 spans `spec/02-requirements.md:1452-2266` and holds **265 REQs** (`^**REQ-` count) across **75 families** | enumerated this session | repo |
| EV5 | Coverage register carries **75 §5.6 family rows — 65 bucket C, 10 bucket E, none A/B/D**; no §5.6 family is missing or extra | `grep '5.6 State, Lifecycle' spec/audit/req-coverage.md` | repo |
| EV6 | Internal structure: *Core State and Lifecycle* (`:1454-1643`, 64 REQs, 19 families), *Entities, NPCs, and Adventure Content* (`:1644-2064`, 132 REQs, 41 families), *Fingerprinting and State Integrity* (`:2065-2266`, 69 REQs, 16 families). Family-atomic regrouping moves `REQ-073`'s two third-block parts into P3b-1: 66 / 93 / 39 / 67 = 265, each REQ once (Q1) | `python3` block split on `**REQ-` and `#### `, this session | repo |
| EV7 | Code surface: `holonovel/src/index.ts` 14 722 lines; `core/state.ts` 3 080; `core/artifact-registry.ts` 192; `core/state-hash.ts` 64; `core/limits.ts` 47; `core/lonelog.ts` 114; `core/hazard.ts` 168. Registrations: `manage_history` `index.ts:3614`, `manage_scene` `:6166`, `manage_npc` `:6424`, `manage_countdown` `:6677`, `manage_condition` `:7103`, `manage_faction` `:7181`, `manage_relationship` `:7263`, `manage_vow` `:7322`, `manage_note` `:8016`, `manage_adventure` `:10004`, `manage_codex` `:13204`; `state.snapshot` `core/state.ts:1875`, `undo` `:1887`, `redo` `:1902`, `audit` `:1935` | `wc -l`, `grep -n` | repo |
| EV8 | §5.6 is a **data-format** section: `DATA_SECTIONS` includes `"### 5.6 "` (`scripts/lib/contract-fingerprint.ts:38`), so REQ-body edits require fingerprint regeneration via `build-order` (Q7) | `grep -n`, file read | repo |
| EV9 | Register already records the §5.6 consolidation question as `Deferred-by-user` (density justified; "§5.6 is a candidate for a future dedicated consolidation increment") — this chunk is review, not consolidation | `spec/audit/review-register.md:738-745` | repo |
| EV10 | The roadmap's sweep section names chunk P3b as the next start and closes when P3b–P8 and M1 report | `ROADMAP.md:15-29` | repo |
| EV11 | No §5.6-specific gate exists. The assertions live in the server suite (outside the root manifest): `test-workflow`, `test-persistence`, `test-persistence-guardrails`, `test-adventure`, `test-narrative`, `test-supplementary`, `test-backfill`, `test-output-contracts`, `test-fingerprints`, `test-playtest`. A green `check:fast` says nothing about them | `holonovel/package.json:70-118`, `ls holonovel/scripts/test-*.ts` | repo |

## The chunk's review surface — three clusters

Mapping check: the 66 REQ IDs partition across these clusters with no gap and no
duplicate (17 + 15 + 34 = 66). Re-verify before starting.

| Cluster | REQs | Families | Count | Code/spec target |
|---|---|---|---|---|
| **A** audit log, history, conflicts | 040a–d, 168a–b, 041a–c, 116, 043a–g | 5 | 17 | `state.audit` (`core/state.ts:1935`), `snapshot`/`undo`/`redo` (`:1875`–`:1902`), `manage_history` (`index.ts:3614`), audit resource (`audit://`) |
| **B** combat and conditions | 203, 204a–b, 205a–c, 206a–c, 221a–b, 217a–d | 6 | 15 | `manage_combat` (`index.ts:5690`), `manage_condition` (`:7103`), combat round/expiry paths, `core/hazard.ts` only if it carries condition resolution |
| **C** recap, orientation, clocks, vows | 072a1–i, 279a–c, 174a–b, 175a–b, 073a1–c3, 329a–b, 289a–e, 322a–d | 8 | 34 | `manage_history (action: recap)` (`index.ts:9647` region), `manage_story` (`:7895`), `manage_countdown` (`:6677`), `manage_vow` (`:7322`), `manage_world` coupling (`:5114`), `core/state.ts` recap derivation |

Cluster A's `REQ-040` family is declared in §5.6 itself; the audit trail is also
consumed by §5.1/§5.4 surfaces reviewed in chunks P1/P3 — a predicate landing in
those sections is recorded against the owning chunk rather than reopened.

## Steps

### Phase 0 — Baseline (no source edits)

1. Re-run `npm run check:fast` un-piped immediately before the review and record
   the exit status; run `npm run check` once so the full gate's baseline is
   measured rather than inherited from EV1. A red baseline is a P0 and is fixed
   first, as its own commit.
2. Run the server harnesses that own this chunk's assertions — at minimum
   `npm --prefix holonovel run test:workflow`, `test-persistence`,
   `test-persistence-guardrails`, `test-output-contracts`, `test-backfill`,
   `test-narrative`, `test-supplementary`, `test-adventure`,
   `test-fingerprints` — and record each exit status (EV11).
3. Confirm `git status --porcelain` and record `git rev-parse --short HEAD`.
4. Confirm the artefact directory is trackable: `git check-ignore -v
   docs/plans/2026-11-09-full-review-p3b/` returns nothing.
5. Record Q1–Q8 as **D12–D19** in the sweep `worklist.md` before review work
   starts (D1–D11 are already recorded and are not renumbered). Decisions go in
   the worklist, not this file, so the stamped plan hash stays valid.
6. Record the plan gate's evidence sidecar (`plan-gate.mjs preflight`) beside the
   stamped artifact.
7. Re-derive the partition (66 REQ IDs, 17 + 15 + 34) and the bucket for each
   family from `spec/audit/req-coverage.md`. A mismatch is fixed in the
   worklist, not by silently re-scoping.

### Phase 1 — Code side (read-only review)

1. **Enumerate the surface**, recording `file:line` anchors in the worklist: the
   audit writer and every call site, the snapshot/undo/redo stack operations,
   the `audit://` resource projection, every `manage_combat`
   / `manage_condition` / `manage_countdown` / `manage_vow` action case, the
   recap derivation, and the countdown-world / vow-countdown coupling paths.
   Enumeration confirms names; nothing is assumed from the P2/P3 worklists.
2. **Run a read-only conformance review cluster by cluster (A, B, C)** — the
   `code-review` lenses against the current tree and each cluster's REQ bodies,
   with no diff and no edits. Findings batched, one pass per cluster. A finding
   cites the predicate (`file:line`), never a gate message.
3. **Check the carrying assertion against the REQ text** for every REQ a harness
   is believed to carry: open the test, read what it asserts, and confirm it
   tests what the REQ states. A passing harness asserting something narrower is a
   finding (the class that produced F-P1-1 and F-P3-1).
4. **Verify the audit and undo guarantees by reading the implementation**, not by
   trusting their tokens: REQ-040's audit entry must carry tool, badge, and
   arguments at the documented moment; REQ-041/116's undo/redo must be per-badge
   and must not resurrect across a drain (the §5.4 drain contract); REQ-043's
   conflict lifecycle transitions must be total (every state reachable, no
   transition without a recorded entry).
5. **Verify clock and vow arithmetic** for REQ-073/289/322/329 against their
   stated bounds and coupling rules — a countdown at the boundary, a vow linked
   to both a clock and a world fact.
6. **Record one verdict per REQ** in the worklist's chunk P3b-1 table (66 rows,
   done-bar item 2), plus one **cluster verdict row** per cluster in the same
   section: `holds` named with the gate or harness that carries the cluster, or
   the finding IDs it produced (done-bar item 5).

### Phase 2 — Spec side (citation resolution)

1. Apply chunk P1's reproducible method (Q6): each REQ's own `*Check:*` IDs; a
   REQ with no own Check inherits its family's citation set; an `Automated`
   citation must appear literally in a `holonovel/scripts` harness and its body
   must exercise the stated behaviour; `Manual`, `Gate`, and scenario citations
   need none. Bucket from the base family row per Q4.
2. Classify citation *kind* before counting a missing harness: P1's first pass
   produced 69 false findings by skipping it
   (`docs/plans/2026-11-09-full-review-sweep/aar.md:39`); P2 saw 20 from
   zero-padded token shadowing
   (`docs/plans/2026-11-09-full-review-p2/aar.md:37-44`). A scenario citation
   needs no harness; an `Automated` token with no harness is a finding.
3. A REQ whose cited test does not exercise the stated behaviour is a finding.
   `npm run check:conformance -- --dedicated` over-flags on this corpus
   (AGENTS.md), so its output is evidence to inspect, never a finding by itself.
4. Fill the bucket and verdict columns for all 66 rows.

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
   - bullet 1 — chunks P3b-2 (entities/NPCs, 93 REQs), P3b-3 (adventure content,
     39), P3b-4 (state surfaces and fingerprinting, 67);
   - bullet 2 — chunk P4 (`core/state.ts` persistence, §5.19 cross-check) and
     chunks P5–P7 (engine loop, adapters/rulesets, determinism);
   - bullet 3 — chunk P8 (narrative cognition) and the closing M1 re-run;
   - trigger — chunk P3b-2;
   and add nothing else: the sweep item remains the single scheduling surface.
4. **`CHANGELOG.md`**: one dated heading
   `2026-11-09 — Full-review sweep: chunk P3b-1 (§5.6 core state and lifecycle)`.
   The date equals the CalVer date (EV2).
5. **Artefacts**: replace the provisional `aar.md` with the execution record and
   the token the outcome earns, and update the sweep worklist's status table
   (P3b → P3b-1 closed-or-halted; new P3b-2 … P3b-4 rows, `scheduled`).

## Register write-back

| Disposition | Section | Row shape |
|---|---|---|
| `Resolved` | `## Resolved` | `### 2026-11-09 full-review sweep — chunk P3b-1`; bullet `**P3B1-FN — <title> (resolved):**` + predicate + fix location + the assertion that now covers it |
| `Scheduled-roadmap` | `## Scheduled-roadmap` | same heading; bullet names the finding, the predicate, and the `ROADMAP.md` section it is scheduled under |
| `Closed-P3` | `## Closed-P3 (recorded, no action)` | same heading; bullet records the predicate and why no action follows |
| `Deferred-by-user` | `## Deferred-by-user` | only on an explicit user deferral; names the decision |

A finding scheduled against a later sweep chunk writes both the register row and
the chunk reference in the sweep `worklist.md`; a finding scheduled against a
roadmap section writes the `ROADMAP.md` entry in the same step (`check-registers`
cross-references the two).

## Stopped-run landing

If a P0 cannot be fixed within the session, the run halts and still lands as a
record:

1. `worklist.md` marks chunk P3b-1 `halted on <finding ID>` and keeps the
   partial per-REQ table.
2. `ROADMAP.md` gains an additional section for the P0: heading
   `## <finding ID> — <title> (P0)`, 1–3 bullets naming the predicate and the
   reproduction, and a `**Trigger:**` line; the admission rule applies.
3. `CHANGELOG.md` heading reads
   `2026-11-09 — Full-review sweep: chunk P3b-1 (halted on <finding ID>)`.
4. `aar.md` ends `LOOP OPEN` naming the P0 row; gates still run and must be green
   for whatever landed.
5. No push. The P0 is the next session's first item, ahead of chunk P3b-2.

## Blast radius

| File | Change | Size |
|---|---|---|
| `docs/plans/2026-11-09-full-review-p3b/{plan,tasks,aar}.md` | this increment's artefacts | M |
| `docs/plans/2026-11-09-full-review-sweep/worklist.md` | chunk P3b-1 section, 66-row table, D12–D19, P3b-2…P3b-4 status rows, status table re-scope | M |
| `spec/audit/review-register.md` | P3b-1 finding rows (one dated subsection per used disposition) | S |
| `ROADMAP.md` | sweep bullets re-scoped to P3b-2…P3b-4/P4–P8/M1; trigger advanced to P3b-2; extra section only on a halted P0 | S |
| `CHANGELOG.md` | dated heading + bullets | S |
| `holonovel/src/**`, `holonovel/scripts/test-*.ts` | only if a P0 fix lands (named at that time) | S–M |
| `holonovel/src/generated/contract-fingerprints.ts` | regenerated by `build-order` if a §5.6 REQ body changes (Q7) | — |
| `holonovel/tool-definitions.json` | regenerated only if a P0 fix edits a tool definition | — |
| `spec/**` + `holonovel.md` | only if a P0 fix amends a REQ (then `assemble` + register refresh) | S–M |
| `spec/audit/req-coverage.md` | refreshed by `npm run validate -- --write-register` when a §5.6 REQ body changes | S |
| `holonovel/package.json`, `package-lock.json`, `server.json`, `AGENTS.md`, `DECISIONS.md` header | advanced by `build-order` version sync | — |

## Considered and rejected

- **Reviewing all 265 §5.6 REQs in one increment.** Rejected: the verdict table
  is 2.3× the largest chunk completed so far, and a partial 265-row record is
  worse than complete smaller ones (Q1).
- **Splitting by the three `####` headings alone.** Rejected: `REQ-073`'s parts
  straddle the first and third heading blocks; splitting a family across chunks
  makes its citation set ambiguous. Families are atomic (Q1).
- **Reusing the P3 plan directory.** Rejected: one increment = one
  plan/tasks/AAR triple (Q3).
- **Auditing `state.ts` save/load/archive here.** Rejected: chunk P4 owns it
  (Q5).
- **Fixing every finding.** Rejected: P1/P2/P3 findings are scheduled or closed;
  only a P0 blocks the chunk's close.
- **Consolidating §5.6 while reviewing it.** Rejected: the register already
  defers consolidation by user decision (EV9); mixing an editorial restructure
  into a review increment hides the review record.

## Verification

| Check | Command | Expected |
|---|---|---|
| Assembly | `npm run assemble` | exit 0 |
| Fast gate | `npm run check:fast` (un-piped) | 37/37, `check:fast: PASS` |
| Full gate | `npm run check` | 0 errors |
| Server harnesses | `npm --prefix holonovel run test:workflow`, `test-persistence`, `test-persistence-guardrails`, `test-output-contracts`, `test-backfill`, `test-narrative`, `test-supplementary`, `test-adventure`, `test-fingerprints` | each exit 0 |
| Roadmap admission | `npm run check-roadmap` | pass after the roadmap edit |
| Register cross-refs | `npm run check-registers` | pass |
| Loop artefacts | `npm run check-loop-artifacts` | pass, LOOP token present |
| Coverage register | `npm run validate -- --write-register` | only when a §5.6 REQ body changed |
| REQ shape (conditional) | `npm run validate --sdd-strict` | only when a P0 fix amends a REQ body; 0 shape errors |
| Fingerprints (conditional) | `npm run build-order` | 0 errors; `check-fingerprint-sync` passes |
| Machine evidence | `npm run check:conformance` | exit 0; record the summary |

## Risks and rollback

- **A finding whose predicate lands in `state.ts` file I/O.** Mitigation: record
  the predicate and reference chunk P4 (Q5); do not chase it here. If it is a
  demonstrated correctness defect rather than a coverage gap, it is a P0 and is
  fixed at the smallest surface that removes it.
- **False citation holds.** Mitigation: open every cited test (P2's lesson); the
  zero-padded-token class (F-P2-4) is a known shadowing source.
- **The 66-row table turning into a 265-row one.** Mitigation: the worklist fence
  is the chunk's 19 families; a REQ outside them belongs to P3b-2…P3b-4 and is
  recorded there, not here.
- **A P0 discovered late can exceed the session.** Mitigation: stop, record, land
  per **Stopped-run landing**.
- **Gate-pinned values.** The changelog date is the CalVer date; `session:close`
  derives the commit subject from the top CHANGELOG heading.
- **Draft artefact breaks a gate mid-session.** `check-loop-artifacts` requires
  plan, tasks, and a LOOP token; all three are created in one step.
- **No destructive operations, no push.** Every change is a reversible edit or an
  added artefact; rollback cost 1 (single `git revert`).

## Commit order and gates

| # | Commit | Scope | Gate before commit |
|---|---|---|---|
| C0 (conditional) | Restore a green baseline | only if Phase 0's `npm run check` or a server harness is red — that fix alone | `check:fast`, `check` |
| C1 | Full-review sweep: chunk P3b-1 (§5.6 core state and lifecycle) | plan/tasks/AAR, worklist chunk-P3b-1 rows and P3b-2…P3b-4 rows, register rows, ROADMAP.md, CHANGELOG.md, any P0 fix | `assemble`, `check:fast`, `check`, `check-roadmap`, `check-registers`, `check-loop-artifacts`, `build-order`, plus the nine server harnesses (and `validate --sdd-strict` if a REQ body changed) |

C1 is one commit (spec increment); C0 exists only when the baseline is red and
lands first. Publication is not part of this increment.

## User impact

None to runtime behaviour unless a P0 fix lands. The increment changes review
records, the roadmap shape (§5.6 split into P3b-1…P3b-4), and the changelog;
P3b-2…P3b-4 stay scheduled, not executed.

## Evidence

- Review artefact: this file; tracker:
  `docs/plans/2026-11-09-full-review-sweep/worklist.md`.
- Finding predicates: recorded per finding in `spec/audit/review-register.md`.
- Baseline: EV1–EV11 above (repo and tool-output sources).
- No external sources; no user-supplied content drives an instruction.

## Conditions

- **C-indep — resolved.** The standard-depth cold pass ran and passed (0
  blockers); the diff re-audit resolved all six of its findings. No further
  authorization is needed before build.
- **C-ev** — Phase 0's measurements supersede EV1–EV11 if the tree changed
  between this draft and execution; the plan's claims are re-checked against the
  baseline recorded then.
- **C-split** — Q1's four-way split is a user decision. If the user prefers a
  different partition, the worklist and the ROADMAP trigger change; the chunk
  row set changes with it.
