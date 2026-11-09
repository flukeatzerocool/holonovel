# Plan — Full-review sweep, chunk P3 (§5.4 decision workflows)

**Status:** draft, awaiting user approval · **Date:** 2026-11-09 · **Depth:** standard
**Review independence:** fresh — cold pass FAILED (1 blocker: decision-ID
collision; 5 majors, 4 minors) on sha256 `10fc3d78…`, diff re-review PASSED on
sha256 `d7eb9b10…`; this final revision differs only by the four applied nits.
Review artifact `/tmp/opencode/sweep-p3/independent-review.md` sha256
`ebd869f7…` · stages 5/5 · 29/40 reads · **Rollback cost:** 1
**Roadmap item:** `ROADMAP.md` § Remaining full-review sweep (P1)
**Predecessor:** `docs/plans/2026-11-09-full-review-p2/` (chunk P2, closed
2026-11-09, `LOOP PAUSED`)

## Done bar

**Done bar:** this increment only — chunk P3 (§5.4) of the sweep program. The bar
is met when all nine items hold; anything else found is scheduled, not chased.

1. `docs/plans/2026-11-09-full-review-p3/` carries `plan.md`, `tasks.md`, and
   `aar.md`, and `aar.md` ends in `LOOP PAUSED` or `LOOP OPEN`.
   `check-loop-artifacts` passes.
2. `docs/plans/2026-11-09-full-review-sweep/worklist.md` holds a chunk P3 section
   with **one row per §5.4 REQ — 32 rows**, each carrying its bucket inherited
   from the base family row in `spec/audit/req-coverage.md` and a verdict of
   `holds` (including `holds (inherited from <family>)` for the 14 sub-REQs with
   no own `_Check:`), `finding:<ID>`, or `builder-side`. That row set, not the
   gate result, is the falsifiable record that the chunk was reviewed.
3. Every `finding:<ID>` names a `file:line` or `spec:line` predicate and a
   P-severity, and has a terminal disposition (`Resolved` · `Scheduled-roadmap` ·
   `Closed-P3` · `Deferred-by-user`).
4. Zero open P0 findings remain. A P0 that cannot be fixed inside the session
   stops the run and still lands as a record (see **Stopped-run landing**).
5. Each of the two §5.4 clusters (A–B below) has a recorded review verdict:
   `holds` with the gate or harness that carries it, or the finding IDs it
   produced. A cluster is not "reviewed" because a gate is green.
6. `spec/audit/review-register.md` carries every P3 finding under the section
   its disposition names; no `Scheduled-roadmap` row is written without its
   matching `ROADMAP.md` entry.
7. `ROADMAP.md` is updated in the same increment: the sweep section names the
   remaining chunks (P3b, P4–P8, M1) and its `**Trigger:**` line names chunk
   P3b. No second roadmap section is added — the sweep item already schedules
   every remaining chunk, and a duplicate entry would compete with it.
8. These exit 0 un-piped: `npm run assemble`, `npm run check:fast`,
   `npm run check`.
9. The increment is one commit, subject derived by `npm run session:close` from
   the `CHANGELOG.md` heading; a conditional C0 baseline fix precedes it as its
   own commit. No push.

## Open questions (answers recorded as decisions before execution)

- **Q1 — Chunk scope.** The worklist labels P3 as "§5.4, §5.6" — 297 REQs, 10
  clusters, 2.6× chunk P2's 115-row table. **Decided by the user 2026-11-09:**
  split at the subsection boundary. This increment is **P3 = §5.4 (32 REQs)**;
  §5.6 (265 REQs, 75 families) becomes **chunk P3b**, scheduled on `ROADMAP.md`
  with its own plan. The chunk mapping invariant is preserved: §5.4 is assigned
  to P3, §5.6 to P3b, once each.
- **Q2 — Fix policy.** Chunk P1's D2 adopted unchanged: P0 fixed in-session
  (bounded), P1 scheduled on `ROADMAP.md`, P2 fixed only on a demonstrated
  failure, P3 record-and-close. **Recommendation:** adopt, so chunks stay
  comparable.
- **Q3 — Increment record.** New directory
  `docs/plans/2026-11-09-full-review-p3/` for this increment's plan/tasks/AAR;
  the sweep `worklist.md` stays the cross-session tracker and carries the P3
  verdict table and decisions. **Recommendation:** yes (one tracker, one
  increment record per chunk).
- **Q4 — Bucket resolution across a section boundary.** `REQ-548d` sits in §5.4
  but its family row is `REQ-548` in **§5.1** (bucket C, T632–T634). Resolving
  by section would find no row and mislabel it. **Recommendation:** resolve the
  bucket by base family ID from the register, never by section membership; a
  sub-REQ whose family is registered under another section inherits that row and
  the row records the foreign family (`inherited from REQ-548 (§5.1)`).
- **Q5 — §5.4 / P4 boundary.** `core/state.ts` (3 080 lines) owns snapshots,
  undo/redo, and save/load; chunk P4 reviews it code-side against §5.19. §5.4's
  REQ-190/193/042 reference workflow drain and undo *availability*, not state
  internals. **Recommendation:** P3 reviews the handler and contract surface
  (dispatch, tool actions, decision payloads, drain atomicity as observed from
  the handler) and records predicates that land in `state.ts`; it does not audit
  `state.ts` internals, which P4 owns.
- **Q6 — Citation resolution scope.** §5.4's REQ bodies cite T157, T158, T260,
  T266, T273, T468, T494, T635, T32, T47, T138, T103 and Manual T38; the register
  adds T141 and T261 at family level, plus scenario S22 (REQ-192).
  **Recommendation:** apply chunk P2's method unchanged — an
  `Automated` citation must appear literally in a `holonovel/scripts` harness
  *and* the harness body must be opened (the P2 lesson: a token match is not
  evidence the behaviour is exercised); `Manual`/`Gate`/scenario citations need
  no harness, but a scenario cited where the REQ claims an automated check is a
  finding.
- **Q7 — Publication.** `npm run status` reports 5 unpushed commits at session
  start (EV2). **Recommendation:** no push; publication stays user-authorized.

## Scope

**In scope.** Chunk P3 review of §5.4 (32 REQs): the `respond_decision` drain
and pending-workflow surface, staleness detection and its `spec_health` counter,
structured choice presentation, the end-Novel confirmation dispatch, the
advancement workflow, character creation and its output surface, and the
creation-package/step/equipment enumeration contracts. Citation resolution for
all 32 REQs. Findings dispositioned. Roadmap split recorded and trigger advanced.
Register rows. Changelog entry.

**Out of scope.** §5.6 and chunk P3b (265 REQs — scheduled by this plan, not
reviewed here); `core/state.ts` internals (Q5); chunks P4–P8 and M1; §5.9/§5.19
(closed by the 2026-11-09 seam pass); the three open remediation items (§5.3
citation repair, trust-core contract, trust-core citation repair) — independent
roadmap entries; publication.

## Evidence base (this session)

| # | Evidence | Source | Trust |
|---|---|---|---|
| EV1 | `check:fast` → exit 0, 37 passed / 0 failed, `check:fast: PASS` | tool output, this session | tool-output |
| EV2 | `npm run status`: version `2026.11.09`, last publish `2026-11-09T04:30:29Z`, 5 unpushed commits (oldest 13.3h), 6 open roadmap items | tool output, this session | tool-output |
| EV3 | Tree clean at `48a3867`; nothing untracked outside the planned increment | `git status --porcelain`, `git rev-parse --short HEAD` | repo |
| EV4 | §5.4 = **32 REQs** (`REQ-056` … `REQ-235c`), flat list with no `###5.N` subsections; **14 carry no own `_Check:`** line and inherit their family's citation set | `spec/02-requirements.md:1059-1191` (enumerated this session, block split on `**REQ-`) | repo |
| EV5 | Coverage register carries **14 §5.4 family rows — 13 bucket C, 1 bucket E (`REQ-056`), none A/B/D**; no §5.4 family is missing and none is extra. `REQ-548d`'s family row is `REQ-548` in §5.1 (bucket C) | `spec/audit/req-coverage.md` (grep of `| 5.4 Decision workflows |`) | repo |
| EV6 | §5.6 — the *other* half of the worklist's old P3 label — is **265 REQs across 75 families** (65 C, 10 E), i.e. 2.6× this chunk; it is P3b, not this increment | `spec/02-requirements.md:1452-2266`, `spec/audit/req-coverage.md` (counted this session) | repo |
| EV7 | Code surface: `holonovel/src/index.ts` 14 681 lines with 280 `case "` dispatch sites (`:2061`–`:13717`); `audit()` at `:2409`; the `respond_decision` handler spans `:3290-3572` (its drain logic `:3298-3572`, ending at the `[NOT_FOUND]` return `:3564-3567`); 33 `pending_workflow` references; `core/character-creation.ts` 447 lines; `core/prompt-composition.ts` 349; `core/state.ts` 3 080 (read-only here) | `wc -l`, `grep -n`, `sed -n` | repo |
| EV8 | §5.4 citation inventory, resolved per REQ this session (14 REQs have no own Check and inherit their family set). Cluster A tokens: T32, T138, T157, T266 → `test-workflow.ts`; T494 → `test-output-contracts.ts`; T273 → `test-backfill.ts`; T635 → `test-lean-narrator.ts`; T158 → `test-persistence.ts`; S22 is a scenario, not a test. Cluster B tokens: T32 → `test-workflow.ts`/`test-output-contracts.ts`; T47, T141 → `test-output-contracts.ts`; T468, T260 → `test-backfill.ts`/`test-character-creation.ts`; T38 is **Manual**; **T103 is Automated and appears in no `holonovel/scripts` harness** (candidate finding, not an assumption). Existence is not exercise (P2's lesson) | `grep -rl` plus the per-REQ `_Check:_` enumeration, this session | repo |
| EV9 | Chunk P2 closed 2026-11-09 with `LOOP PAUSED`; the worklist marks P3 `scheduled` and its trigger text names P3 | `docs/plans/2026-11-09-full-review-p2/aar.md:68`, `worklist.md:36` | repo |
| EV10 | Roadmap trigger names chunk P3 (mutation, decision, lifecycle handlers) as the next session's start | `ROADMAP.md:27-29` | repo |
| EV11 | Gate manifest carries no §5.4-specific gate; the nearest are `action-conflicts` (action contract conflicts), `check-tool-surface`/`surface-budget` (surface arithmetic), and full-mode `playability`. The §5.4 assertions live in the server suite, outside the root manifest | `scripts/run-gates.ts` manifest, `holonovel/package.json` | repo |
| EV12 | §5.4 is in neither fingerprint section list: `PACKAGE_SECTIONS` = §5.16, §5.17, §6.3, §6.4.2; `DATA_SECTIONS` = §5.6, §5.9, §5.19, §5.21–§5.28, §5.31, §5.32, §7.7, Appendix Q. A §5.4 REQ-body edit implies no fingerprint regeneration; §5.6 (chunk P3b) **is** a data-format section, so P3b's REQ edits will require `build-order` | `scripts/lib/contract-fingerprint.ts:27`, `:37-43` | repo |

## The chunk's review surface — two clusters

Mapping check: the 32 REQ IDs from EV4 partition across these clusters with no
gap and no duplicate (19 + 13 = 32). Re-verify before starting.

| Cluster | REQs | Count | Code/spec target | What carries it today |
|---|---|---|---|---|
| **A** decision transport and staleness | 042a–f, 190, 191, 192, 193a/b, 224a–c, 235a–c, 140, 548d | 19 | `index.ts` `respond_decision` (`:3290-3572`), `pending_workflow` sites, `manage_scene (action: choices)`, `spec_health.pending_workflow`, end-Novel confirmation path | `test-workflow.ts` (T32, T138, T157, T266), `test-output-contracts.ts` (T494), `test-backfill.ts` (T273), `test-lean-narrator.ts` (T635), `test-persistence.ts` (T158); scenario S22 (REQ-192) |
| **B** creation and advancement | 056, 104a–c, 151a/b, 152a/b, 181a/b, 399a–c | 13 | `core/character-creation.ts`, `core/prompt-composition.ts`, `manage_character (action: create\|advance)`, creation output surface | `test-character-creation.ts` (T468), `test-workflow.ts`/`test-output-contracts.ts` (T32), `test-output-contracts.ts` (T47, T141), `test-backfill.ts` (T260); T38 is Manual; T103 is Automated with no harness (candidate finding) |

Cluster A's REQ-548d is a §5.1-declared family that §5.4 depends on; it is
reviewed here for its §5.4 behaviour (structured option set on a pending
decision), and a finding whose predicate lands in §5.1 machinery is recorded
against chunk P1's closed surface rather than reopened.

## Steps

### Phase 0 — Baseline (no source edits)

1. Re-run `npm run check:fast` un-piped immediately before the review and record
   the exit status; run `npm run check` once so the full gate's baseline is
   measured rather than inherited from EV1. A red baseline is a P0 and is fixed
   first, as its own commit.
2. Run the server harnesses that own §5.4's assertions — at minimum
   `npm --prefix holonovel run test:workflow`,
   `test:character-creation`, `test-output-contracts`, `test-backfill`,
   `test-lean-narrator`, `test-persistence` — and record each exit status. They
   are not in the root manifest (EV11), so a green `check:fast` says nothing
   about them.
3. Confirm `git status --porcelain` and record `git rev-parse --short HEAD`.
4. Confirm the artefact directory is trackable: `git check-ignore -v
   docs/plans/2026-11-09-full-review-p3/` returns nothing.
5. Record Q1–Q7 as **D5–D11** in the sweep `worklist.md` before review work
   starts (D1–D4 are already recorded there and are not renumbered). Decisions
   go in the worklist, not this file, so the stamped plan hash stays valid for
   the whole increment.
6. Record the plan gate's evidence sidecar (`plan-gate.mjs preflight`) beside the
   stamped artifact, per chunk P2's Phase 0 step 6.
7. Re-derive the cluster partition (the 32 REQ IDs) and confirm 19 + 13. A
   mismatch is fixed in the worklist, not by silently re-scoping.

### Phase 1 — Code side (read-only review)

1. **Enumerate the surface**, recording `file:line` anchors in the worklist: the
   `respond_decision` registration and drain body, every `pending_workflow`
   read/write, `manage_scene (action: choices)`, the staleness counter's
   `spec_health` field, the end-Novel confirmation path, and the
   `character-creation` / `prompt-composition` modules. Enumeration confirms
   names; nothing is assumed from the P2 worklist.
2. **Run a read-only conformance review cluster by cluster (A, then B)** — the
   `code-review` lenses applied to the current tree against each cluster's REQ
   bodies, with no diff and no edits. Findings batched, one pass per cluster. A
   finding cites the predicate (`file:line`), never a gate message.
3. **Check the carrying assertion against the REQ text** for every REQ a harness
   is believed to carry: open the test, read what it asserts, and confirm it
   tests what the REQ states. A passing harness asserting something narrower is a
   finding (the class that produced F-P1-1).
4. **Verify drain atomicity by reading the whole handler (`:3290-3572`)**, not by
   trusting T138: the REQ-190 contract is that a partial drain (workflow cleared,
   state change not applied) is a defect. For every early return and error
   branch, record whether it applies both or neither. Check the
   character-creation completion branch specifically: it clears
   `pending_workflow` (`:3488`) before class validation (`:3503-3505`), which is
   the shape REQ-190 calls a defect — raise it as a finding or record why the
   drain is safe there.
5. **Record one verdict per REQ** in the worklist's chunk P3 table (32 rows,
   done-bar item 2).

### Phase 2 — Spec side (citation resolution)

1. Apply chunk P1's reproducible method (`worklist.md:69-72`): each REQ's own
   `*Check:*` IDs; a REQ with no own Check inherits its family's citation set; an
   `Automated` citation must appear literally in a `holonovel/scripts` harness
   and its body must exercise the stated behaviour; `Manual`/`Gate` citations
   need none. Bucket is inherited from the base family row per **Q4** —
   `REQ-548d` resolves through `REQ-548` (§5.1).
2. Classify citation *kind* before counting a missing harness: P1's first pass
   produced 69 false findings by skipping it (sweep `aar.md:39`); P2 saw 20 from
   zero-padded token shadowing (`p2/aar.md:37-44`). S22 (REQ-192) is a scenario
   citation and T38 (REQ-056) is Manual — neither needs a harness; T103
   (REQ-104c) is Automated and has none, which resolves as a finding, not a
   bypass.
3. A REQ whose cited test does not exercise the stated behavior is a finding.
   `npm run check:conformance -- --dedicated` over-flags on this corpus
   (AGENTS.md), so its output is evidence to inspect, never a finding by itself.
4. Fill the bucket and verdict columns for all 32 rows.

### Phase 3 — Triage, registers, roadmap, artefacts

1. **Triage** every finding per Q2. Guardrails for a P0 fix:
   - A fix that changes an action's parameters or output first runs a
     sibling-contract check: grep the REQ corpus for other REQs naming the same
     `tool (action: X)` and confirm no sibling contract conflicts.
   - A fix that amends a REQ body complies with Appendix M's authoring limits
     (one paragraph, no tables/bullets/steps, 800-char and 8-sentence caps);
     `npm run validate --sdd-strict` is the check.
   - A fix that edits a §5.4 REQ body: `npm run assemble`, then
     `npm run validate -- --write-register`, then `npm run build-order`. §5.4 is
     in neither fingerprint section list (EV12), so the REQ edit implies no
     fingerprint regeneration; `build-order` still runs for version sync.
   - A fix that edits a tool definition re-runs the generator and surface gates
     (`npm run build-order`); `check-tool-definitions-sync` fails on a stale
     `tool-definitions.json`.
   - A fix that edits an action's contract (parameter, meaning, or output)
     enumerates the full surface before editing: the registration and
     description in `holonovel/src/index.ts`, the generated
     `holonovel/tool-definitions.json`, the dispatch case, and the owning
     harness. Re-run that harness and add the assertion there if the fix has
     none.
2. **`spec/audit/review-register.md`**: one dated heading per used disposition
   section, rows per **Register write-back** below.
3. **`ROADMAP.md`**: keep the sweep item's 1–3 bullet + `**Trigger:**` shape
   (`check-roadmap` rejects any other) and update it to:
   - bullet 1 — chunk P3b (§5.6 state, lifecycle, entities, adventure content;
     265 REQs) and P4 (`core/state.ts` persistence, §5.19 cross-check);
   - bullet 2 — chunks P5–P7 (engine loop, adapters/rulesets, determinism);
   - bullet 3 — chunk P8 (narrative cognition) and the closing M1 re-run;
   - trigger — chunk P3b;
   and add nothing else: the sweep item remains the single scheduling surface
   (a second §5.6 entry would duplicate the program and compete with the sweep
   item's trigger).
4. **`CHANGELOG.md`**: one dated heading
   `2026-11-09 — Full-review sweep: chunk P3 (§5.4 decision workflows)`. The date
   equals the CalVer date (EV2).
5. **Artefacts**: write this increment's `tasks.md` progress and `aar.md` with
   the token the outcome earns, and update the sweep worklist's status table
   (P3 → §5.4 closed-or-halted; new P3b row for §5.6, `scheduled`).

## Register write-back

The register partitions dispositions into four sections (`## Resolved`,
`## Scheduled-roadmap`, `## Closed-P3 (recorded, no action)`,
`## Deferred-by-user`). One finding goes to exactly one section, under a dated
subsection:

| Disposition | Section | Row shape |
|---|---|---|
| `Resolved` | `## Resolved` | `### 2026-11-09 full-review sweep — chunk P3`; bullet `**P3-FN — <title> (resolved):**` + predicate + fix location + the assertion that now covers it |
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

1. `worklist.md` marks chunk P3 `halted on <finding ID>` and keeps the partial
   per-REQ table.
2. `ROADMAP.md` gains an additional section for the P0: heading
   `## <finding ID> — <title> (P0)`, 1–3 bullets naming the predicate and the
   reproduction, and a `**Trigger:**` line; the admission rule applies
   (`check-roadmap`).
3. `CHANGELOG.md` heading reads
   `2026-11-09 — Full-review sweep: chunk P3 (halted on <finding ID>)`.
4. `aar.md` ends `LOOP OPEN` naming the P0 row; gates still run and must be green
   for whatever landed.
5. No push. The P0 is the next session's first item, ahead of chunk P3b.

## Blast radius

| File | Change | Size |
|---|---|---|
| `docs/plans/2026-11-09-full-review-p3/{plan,tasks,aar}.md` | this increment's artefacts | M |
| `docs/plans/2026-11-09-full-review-sweep/worklist.md` | chunk P3 section, 32-row table, D5–D11, P3b status row, status table re-scope | M |
| `spec/audit/review-register.md` | P3 finding rows (one dated subsection per used disposition) | S |
| `ROADMAP.md` | sweep trigger advanced to P3b; sweep bullets re-scoped to P3b/P4–P8/M1; extra section only on a halted P0 | S |
| `CHANGELOG.md` | dated heading + bullets | S |
| `holonovel/src/**`, `holonovel/scripts/test-*.ts` | only if a P0 fix lands (named at that time) | S–M |
| `holonovel/tool-definitions.json` | regenerated only if a P0 fix edits a tool definition | — |
| `spec/**` + `holonovel.md` | only if a P0 fix amends a REQ (then `assemble` + register refresh) | S–M |
| `spec/audit/req-coverage.md` | refreshed by `npm run validate -- --write-register` when a §5.4 REQ body changes | S |
| `holonovel/package.json`, `package-lock.json`, `server.json`, `AGENTS.md`, `DECISIONS.md` header | advanced by `build-order` version sync | — |

## Considered and rejected

- **Keeping P3 whole (297 REQs, §5.4 + §5.6).** Rejected by the user's decision
  (Q1): the verdict table and cluster count exceed one session, and a partial
  record is worse than a smaller complete one.
- **Splitting §5.6 into two chunks now.** Rejected as premature: the natural
  boundary inside §5.6 is a question for P3b's own plan, made after §5.4's
  findings are in hand.
- **Trusting the server harnesses as the review.** Rejected: they assert selected
  behaviours (T138's drain, T157's workflow shape), not the whole §5.4 contract —
  staleness thresholds, choice-payload stability, creation-package fallback, and
  the output surface are mostly unasserted or asserted narrowly.
- **Reusing the P2 plan directory.** Rejected: one increment = one
  plan/tasks/AAR triple (Q3).
- **Auditing `core/state.ts` here** because drain touches snapshots. Rejected:
  chunk P4 owns it (Q5); P3 records the predicate and stops at the handler.
- **Fixing every finding.** Rejected: P1/P2/P3 findings are scheduled or closed;
  only a P0 blocks the chunk's close.

## Verification

| Check | Command | Expected |
|---|---|---|
| Assembly | `npm run assemble` | exit 0 |
| Fast gate | `npm run check:fast` (un-piped) | 37/37, `check:fast: PASS` |
| Full gate | `npm run check` | 0 errors |
| Server harnesses | `npm --prefix holonovel run test:workflow`, `test:character-creation`, `test:output-contracts`, `test:backfill`, `test:lean-narrator`, `test:persistence` | each exit 0 (not in the root manifest) |
| Roadmap admission | `npm run check-roadmap` | pass after the roadmap edit |
| Register cross-refs | `npm run check-registers` | pass |
| Loop artefacts | `npm run check-loop-artifacts` | pass, LOOP token present |
| Coverage register | `npm run validate -- --write-register` | only when a §5.4 REQ body changed |
| REQ shape (conditional) | `npm run validate --sdd-strict` | only when a P0 fix amends a REQ body; 0 shape errors |
| Build/version sync | `npm run build-order` | 0 errors |
| Machine evidence | `npm run check:conformance` | exit 0; record the summary |

## Risks and rollback

- **A §5.4 finding whose predicate lies in `state.ts`.** Mitigation: record the
  predicate and reference chunk P4 (Q5); do not chase it here. If the predicate
  is a demonstrated correctness defect rather than a coverage gap, it is a P0 and
  is fixed at the smallest surface that removes the defect.
- **False citation holds.** Mitigation: open every cited test; a literal token
  match is not evidence (P2's lesson).
- **Drain-atomicity review turning into a state-machine rewrite.** Mitigation:
  the done bar asks for a verdict per REQ, not for redesign; a design gap is
  scheduled as its own increment.
- **A P0 discovered late can exceed the session.** Mitigation: stop, record, land
  per **Stopped-run landing**; the bar is not met and that is the correct
  outcome.
- **Gate-pinned values.** The changelog date is the CalVer date; `session:close`
  derives the commit subject from the top CHANGELOG heading.
- **Draft artefact breaks a gate mid-session.** `check-loop-artifacts` requires
  plan, tasks, and a LOOP token; all three are created in one step (P2's lesson).
- **No destructive operations, no push.** Every change is a reversible edit or an
  added artefact; rollback cost 1 (single `git revert`).

## Commit order and gates

| # | Commit | Scope | Gate before commit |
|---|---|---|---|
| C0 (conditional) | Restore a green baseline | only if Phase 0's `npm run check` or a server harness is red — that fix alone | `check:fast`, `check` |
| C1 | Full-review sweep: chunk P3 (§5.4 decision workflows) | plan/tasks/AAR, worklist chunk-P3 rows and P3b row, register rows, ROADMAP.md, CHANGELOG.md, any P0 fix | `assemble`, `check:fast`, `check`, `check-roadmap`, `check-registers`, `check-loop-artifacts`, `build-order`, plus the six server harnesses (and `validate --sdd-strict` if a REQ body changed) |

C1 is one commit (spec increment); C0 exists only when the baseline is red and
lands first. Publication is not part of this increment.

## User impact

None to runtime behaviour unless a P0 fix lands. The increment changes review
records, the roadmap shape (P3 split into P3/P3b), and the changelog; §5.6 stays
scheduled, not executed.

## Evidence

- Review artefact: this file; tracker:
  `docs/plans/2026-11-09-full-review-sweep/worklist.md`.
- Finding predicates: recorded per finding in `spec/audit/review-register.md`.
- Baseline: EV1–EV12 above (repo and tool-output sources).
- No external sources; no user-supplied content drives an instruction.

## Conditions

- **C-indep** — the independent cold pass (standard depth) has not run. It is
  required before build, unless the user records
  `risk accepted: no cold pass — authorized by <name>` as a condition.
- **C-stamp** — the plan artifact is not yet stamped; stamp it (`kind:
  planned`, `independence: self` now, `fresh` after the cold pass) before the
  first source edit.
- **C-ev** — Phase 0's measurements supersede EV1–EV12 if the tree changed
  between this draft and execution; the plan's claims are re-checked against the
  baseline recorded then.
