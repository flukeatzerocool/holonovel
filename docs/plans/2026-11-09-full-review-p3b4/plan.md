# Plan — Full-review sweep, chunk P3b-4 (§5.6 state surfaces and fingerprinting)

**Status:** draft, awaiting user approval · **Date:** 2026-11-09 · **Depth:** standard
**Review independence:** fresh — cold pass `independent-review passed.`
(0 blockers, 2 majors, 5 nits on the first artifact; all resolved in this
revision; stages 5/5, 29/40 reads)
**Roadmap item:** `ROADMAP.md` § Remaining full-review sweep (P1)
**Predecessor:** `docs/plans/2026-11-09-full-review-p3b3/` (chunk P3b-3, closed
2026-11-09, `LOOP PAUSED`)
**Tracker:** `docs/plans/2026-11-09-full-review-sweep/worklist.md`

## Review status

Drafted and self-reviewed against the plan-review checklist (§1–§8) and the
spec-project checks. Chunk P3b-4 is the **last §5.6 sub-chunk**: with it closed,
§5.6 coverage across P3b-1–P3b-4 is complete and the sweep advances to chunk P4.
Depth is `standard`: the increment touches review records, registers, roadmap,
and changelog, is fully reversible, and performs no destructive, remote, or
schema-migration operation.

## Done bar

**Done bar:** this increment only — chunk P3b-4 of the sweep program. The bar is
met when all nine items hold; anything else found is scheduled, not chased.

1. `docs/plans/2026-11-09-full-review-p3b4/` carries `plan.md`, `tasks.md`, and
   `aar.md`, and `aar.md` ends in `LOOP PAUSED` or `LOOP OPEN`.
   `check-loop-artifacts` passes.
2. The sweep `worklist.md` holds a chunk P3b-4 section with **one row per REQ in
   the chunk — 67 rows across 15 families**, each carrying its bucket inherited
   from the base family row in `spec/audit/req-coverage.md` (D14) and a verdict
   of `holds` (including `holds (inherited from <family>)` for sub-REQs with no
   own `_Check:` and `holds (fixed <finding>)` for an in-session P0),
   `finding:<ID>`, `builder-side`, or `deferred:<chunk>` (a behaviour the REQ
   states that lands wholly in a later chunk's surface — `P1`, `P4`, `P5`, `P6`,
   or `P8` per Q5 — recorded without a register finding; the worklist row names
   the owning chunk). That row set, not the gate result, is the falsifiable record that the
   chunk was reviewed.
3. Every `finding:<ID>` names a `file:line` or `spec:line` predicate and a
   P-severity, and has a terminal disposition (`Resolved` · `Scheduled-roadmap` ·
   `Closed-P3` · `Deferred-by-user`).
4. Zero open P0 findings remain. A P0 that cannot be fixed inside the session
   stops the run and still lands as a record (see **Stopped-run landing**).
5. Each of the four clusters (A–D below) has a recorded review verdict: `holds`
   with the gate or harness that carries it, the finding IDs it produced, or
   `builder-side` (clusters A and B in part). A cluster is not "reviewed"
   because a gate is green.
6. `spec/audit/review-register.md` carries every P3b-4 finding under the section
   its disposition names; no `Scheduled-roadmap` row is written without its
   matching `ROADMAP.md` entry, and every `REQ-NNN` token in a
   `Scheduled-roadmap` row appears literally in `ROADMAP.md`
   (`scripts/lib/register-checks.ts:64-68`, strict inside `npm run check`).
7. `ROADMAP.md` is updated in the same increment: the sweep section names the
   remaining chunks P4–P8 plus M1 (no §5.6 sub-chunk remains), its
   `**Trigger:**` line names chunk P4, and the section keeps the admission shape
   (1–3 bullets + `**Trigger:**`). A new remediation section (halted P0 or
   P1-schedule, the P3b-2/P3b-3 precedent) is added **only** when a finding
   needs it; it carries its own `**Trigger:**` line and cites every REQ its
   register rows name; when no finding needs one, no second section is added.
8. These exit 0 un-piped: `npm run assemble`, `npm run check:fast`,
   `npm run check`.
9. The increment is one commit, subject derived by `npm run session:close` from
   the `CHANGELOG.md` heading; a conditional C0 baseline fix precedes it as its
   own commit. No push.

## Open questions (answers recorded as decisions before execution)

- **Q1 — Chunk scope.** `ROADMAP.md` names chunk P3b-4 as §5.6 state surfaces
  and fingerprinting: **67 REQs across 15 families** (D12). The fence is the
  remaining §5.6 families after P3b-1 (19 families), P3b-2 (30), and P3b-3 (11):
  `REQ-044`, `065`, `232`, `233`, `236`, `237`, `239`, `241`, `242`, `285`,
  `302`, `313`, `314`, `321`, `332`. Families stay atomic.
  **Recommendation:** execute as one increment; the stopped-run landing is the
  only split point.
- **Q2 — Fix policy.** D13 unchanged: P0 fixed in-session (bounded), P1
  scheduled on `ROADMAP.md`, P2 fixed only on a demonstrated failure, P3
  record-and-close. **Recommendation:** adopt, so chunks stay comparable.
- **Q3 — Increment record.** New directory
  `docs/plans/2026-11-09-full-review-p3b4/` for this increment's plan/tasks/AAR;
  the sweep `worklist.md` stays the cross-session tracker and carries the P3b-4
  verdict table and decisions D36–D43. **Recommendation:** yes.
- **Q4 — Bucket resolution.** Resolve by base family ID from
  `spec/audit/req-coverage.md` (D14), never by section membership. **11 families
  are bucket C (56 REQs)**; **four are bucket E (11 REQs: `REQ-044`, `REQ-302a/b`,
  `REQ-313a–d`, `REQ-314a–d`)**; none A/B/D. Re-verify at Phase 0.
  **Recommendation:** yes.
- **Q5 — Chunk boundaries.** P3b-4 reviews the *state-surface and integrity*
  contract: drift detection and the build-fingerprint diagnostic surface,
  pause/resume context capture, factions and world reactivity, entity
  relationships, session segmentation, audit compaction, checkpoints, Novel and
  server notes, the codex and its provenance, and the generated fingerprints
  those surfaces expose. `core/state.ts` file I/O (save/load/archive/undo
  internals) stays with P4; the event-log ordinals and engine loop with P5;
  resource projection and world-model tier internals with **P6**; a
  badge-filter-only predicate with **P1**; subjective-memory internals with
  **P8**. These four labels are the only `deferred:<chunk>` values used. The
  builder-side fingerprint computation (`REQ-044`, `REQ-302`, `REQ-313`,
  `REQ-314`) is `builder-side` unless a runtime predicate exists.
  **Recommendation:** record and defer across the boundary.
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
- **Q8 — Publication.** `npm run status` reports **10 unpushed commits** at
  session start (EV2). **Recommendation:** no push; publication stays
  user-authorized.

## Scope

**In scope.** Chunk P3b-4 review of the 67 state-surface REQs: the build
fingerprint and its drift diagnostics (REQ-065), ruleset/section hashing and
implementation-fingerprint rebuild scoping as builder contracts (REQ-044,
REQ-302, REQ-313, REQ-314), pause/resume `gm_context` (REQ-232), factions and
world reactivity (REQ-233), entity relationships (REQ-236), session segmentation
(REQ-237), audit-log compaction (REQ-239), checkpoints (REQ-241), Novel notes
(REQ-242), server notes (REQ-285), the codex (REQ-321), and codex provenance
(REQ-332). Citation resolution for all 67 REQs. Findings dispositioned. Roadmap
trigger advanced. Register rows. Changelog entry.

**Out of scope.** `core/state.ts` save/load/archive/undo internals (P4); the
engine loop, event stream, and event-log ordinals (P5); resource projection,
world-model tier internals, and generic search ranking (P6); subjective-memory
internals (P8); the open remediation roadmap items (§5.6 adventure content,
§5.6 entities and NPCs, §5.6 core state, §5.4 remediation and citation repair,
trust-core contract and citation repair, harness test-ID hygiene, anchor repoint
automation); publication.

**Family fence (15 families, 67 REQs).** `REQ-044` (1), `065` (6), `232` (4),
`233` (6), `236` (3), `237` (3), `239` (4), `241` (3), `242` (4), `285` (3),
`302` (2), `313` (4), `314` (4), `321` (17), `332` (3). Total 67. A REQ outside
this fence belongs to another chunk; record it there, not here. One family in
the same §5.6 block — `REQ-073` (two sub-REQs, `a1`/`a2`) — belongs to P3b-1
(already reviewed; F-P3B1-6) and is excluded from this chunk's row set.

## Evidence base (this session)

| # | Evidence | Source | Trust |
|---|---|---|---|
| EV1 | `npm run check:fast` → exit 0, 37 passed / 0 failed, trailing line `check:fast: PASS` | tool output, this session | tool-output |
| EV2 | `npm run status`: version `2026.11.09`, last publish `2026-11-09T04:30:29Z`, 10 unpushed commits (oldest 17.2 h), 10 open roadmap items | tool output, this session | tool-output |
| EV3 | Tree clean at plan time (`git status --porcelain` empty) before this directory was written; `git rev-parse --short HEAD` = `3994590` | `git status`, `git rev-parse` | repo |
| EV4 | §5.6 spans `spec/02-requirements.md:1452-2266`; the *Fingerprinting and State Integrity* block is `:2065-2266` and holds **69 REQs** across 16 families; excluding `REQ-073a1/a2` (P3b-1) leaves **67 REQs / 15 families** | `grep -n '^### 5\.'`, family enumeration | repo |
| EV5 | Coverage register: 15 family rows — **11 bucket C (56 REQs), 4 bucket E (11 REQs)**; none A/B/D. Rows: `REQ-044` `:34` (E), `065` `:49` (C), `232` `:210` (C), `233` `:211` (C), `236` `:214` (C), `237` `:215` (C), `239` `:217` (C), `241` `:219` (C), `242` `:220` (C), `285` `:260` (C), `302` `:271` (E), `313` `:282` (E), `314` `:283` (E), `321` `:290` (C), `332` `:301` (C) | `grep -nE '^\| \`?REQ-N'`, this session | repo |
| EV6 | Family sub-part counts (sum 67): 044:1, 065:6, 232:4, 233:6, 236:3, 237:3, 239:4, 241:3, 242:4, 285:3, 302:2, 313:4, 314:4, 321:17, 332:3 | `awk` + `uniq -c`, this session | repo |
| EV7 | Code surface (re-measure at Phase 1): `manage_novel` schema `index.ts:10499` (`save_context` `:11013`, `get_context` `:11032`, checkpoint handler `:11043`), `manage_archive` registration `:11354` with the staged subset `:11353`; `manage_faction` `:7181`, `manage_relationship` `:7263`, `manage_note` `:8016`, `manage_context` `:9945`, `manage_diagnostics` delegation `:9958`, `manage_codex` `:13218`; `open_session` `:14416`, `close_session` `:14455`, `take_turn` `:14478`; `codex://` resource `:12683` (`:11671` catalog entry); `spec_health` `server_notes` `:12029`, `codex` `:12030`, `checkpoint_count` `:12063`; `audit_archive` recap `:9783-9821`; `audit://novel/archive` `:12468`; drift comparison `core/state.ts:1083-1086`; `state-hash.ts`, `core/state.ts` checkpoints `:758`, server notes `:2642` | `grep -n`, this session | repo |
| EV8 | §5.6 is a **data-format** section: `DATA_SECTIONS` includes `"### 5.6 "` (`scripts/lib/contract-fingerprint.ts:38`), so REQ-body edits require fingerprint regeneration via `build-order` (Q7) | `grep -n` | repo |
| EV9 | Harness citations: `T224` (`test-backfill.ts:445`, `:509`; `test-persistence.ts`), `T268` (`test-backfill.ts`), `T269` (`test-narrative.ts`), `T275` (`test-output-contracts.ts`), `T277` (`test-limits.ts`, `test-backfill.ts`), `T279` (`test-limits.ts`, `test-backfill.ts`), `T280`/`T334` (`test-backfill.ts`), `T471` (`test-persistence-guardrails.ts`), `T366`/`T382`/`T383`/`T384` (`test-output-contracts.ts`), `T397`/`T402`/`T408`/`T410`/`T413`/`T415`/`T416` (`test-narrative.ts`). **Absent from every harness and root script: `T17`, `T52`, `T346`, `T497`, `T358`, `T270`** — all classified `Automated` in Appendix F; review leads, not yet findings | `grep -rl`, this session | repo |
| EV10 | No §5.6-specific root gate exists. `npm --prefix holonovel run test:all` is the authoritative server run (it includes `test-fingerprints`, `test-limits`, `test-persistence-guardrails`, `test-narrative`, `test-output-contracts`, `test-backfill`; `holonovel/scripts/run-test-suite.ts` is the member list). `test-package-manifest` is a **root** gate inside `check:fast`/`check`, not a `test:all` member | `holonovel/scripts/run-test-suite.ts`, EV1 | repo |
| EV11 | The roadmap's sweep section names chunk P3b-4 as the next start and closes when P3b-4–P8 and M1 report | `ROADMAP.md:15-30` | repo |
| EV12 | Zero-padded harness title tokens shadow real IDs (F-P2-4), scheduled under ROADMAP *Harness test-ID label hygiene*; they are not evidence | `spec/audit/review-register.md` | repo |
| EV13 | Checkpoint actions are exposed twice: the legacy `manage_novel` schema (`index.ts:10499`) and the staged `manage_archive` subset (`:11353`), delegating to the same handler (REQ-413/REQ-581 alias pattern). `action-conflicts` is green, so this is a verification target, not a finding | `index.ts:10499`, `:11353-11370`; EV1 | repo |
| EV14 | Drift warnings are emitted by `core/state.ts:1083-1086` at startup from stored-versus-current fingerprint fields; `REQ-065` is bucket C and therefore runtime-reviewable even though `REQ-044`/`REQ-302`/`REQ-313`/`REQ-314` are bucket E builder contracts | `core/state.ts:1060-1090` | repo |

## The chunk's review surface — four clusters

Mapping check: the 67 REQ IDs partition across these clusters with no gap and no
duplicate (17 + 16 + 14 + 20 = 67). Re-verify before starting.

| Cluster | REQs | Families | Count | Code/spec target |
|---|---|---|---|---|
| **A** fingerprinting and rebuild | 044, 302a–b, 065a–f, 313a–d, 314a–d | 5 | 17 | `core/state.ts:1060-1090` drift comparison; `spec_health` fingerprint fields; `scripts/lib/contract-fingerprint.ts:37`, `scripts/check-fingerprint-sync.ts`, `holonovel/src/generated/contract-fingerprints.ts`, `core/state-hash.ts`; builder contracts are bucket E |
| **B** continuity and world reactivity | 232a–d, 233a1–a3/b1–b3, 236a–c, 237a/b1–b2 | 4 | 16 | `manage_novel` `save_context` `:11013` / `get_context` `:11032`, `manage_faction` `:7181`, `manage_relationship` `:7263`, session-boundary markers and `spec_health.sessions`; `badge_briefing` World in Motion and `narrative_threads` markers |
| **C** durability and notes | 239a–d, 241a–c, 242a–d, 285a–c | 4 | 14 | `manage_diagnostics (action: compact)` `:9958`, `audit_archive` (`:9783-9821`), `audit://novel/archive` `:12468`, checkpoint handler `:11043`, `manage_note` `:8016`, `server-notes.json` `core/state.ts:2642`, `notes://` and `server-notes://` resources |
| **D** codex and provenance | 321a–n, 332a–c | 2 | 20 | `manage_codex` `:13218`, `codex://` resource `:12683`, `spec_health.codex` `:12030`, `codex_source` provenance, `manage_novel (action: info)` `codex_sources`, `[codex-stale]` |

Cluster A's four bucket-E families (`REQ-044`, `REQ-302`, `REQ-313`, `REQ-314`)
are builder-side: their verdict is `builder-side` unless a runtime predicate
exists. `REQ-065` is bucket C and is reviewed at runtime (drift diagnostics,
graceful load, precedence rules); a predicate that lands in `state.ts`
persistence is recorded against P4. A predicate in the event-log or engine loop
is recorded against P5.

## Steps

### Phase 0 — Baseline (no source edits)

1. Re-run `npm run check:fast` un-piped immediately before the review and record
   the exit status; run `npm run check` once so the full gate's baseline is
   measured rather than inherited from EV1. A red baseline is a P0 and is fixed
   first, as its own commit; if it cannot be fixed in-session, land per
   **Stopped-run landing** (red-baseline branch) and do not claim a green record.
2. Run `npm --prefix holonovel run test:all` and record the per-harness summary
   and exit status; at minimum the run must include `test-fingerprints`,
   `test-limits`, `test-persistence`, `test-persistence-guardrails`,
   `test-narrative`, `test-output-contracts`, `test-backfill`,
   `test-tool-surface` (EV10). `test-package-manifest` is a root gate, not a
   member of `test:all` — it runs inside `check:fast`/`check` (step 1) and is
   not a separate Phase 0 invocation.
3. Confirm `git status --porcelain` shows **only** the untracked
   `docs/plans/2026-11-09-full-review-p3b4/` directory and record
   `git rev-parse --short HEAD`.
4. Confirm the artefact directory is trackable: `git check-ignore -v
   docs/plans/2026-11-09-full-review-p3b4/` returns nothing.
5. Record Q1–Q8 as **D36–D43** in the sweep `worklist.md` before review work
   starts (D1–D35 are already recorded and are not renumbered). Decisions go in
   the worklist, not this file, so the stamped plan hash stays valid.
6. Record the plan gate's evidence sidecar at its existing path
   `<plan-gate state dir>/plan.evidence.json` (outside
   `docs/plans/2026-11-09-full-review-p3b4/`, which holds only plan/tasks/aar).
7. Re-derive the partition (67 REQ IDs, 17 + 16 + 14 + 20) and the bucket for
   each family from `spec/audit/req-coverage.md` (EV5/EV6). A mismatch is fixed
   in the worklist, not by silently re-scoping.

### Phase 1 — Code side (read-only review)

1. **Enumerate the surface**, recording `file:line` anchors in the worklist:
   every action case in `manage_novel` (`save_context`/`get_context`/checkpoint),
   `manage_archive`, `manage_faction`, `manage_relationship`, `manage_note`,
   `manage_context`/`manage_diagnostics`, `manage_codex`, `open_session` /
   `close_session` / `take_turn`, the `codex://`, `notes://`, `server-notes://`,
   `faction://`, `factions://`, and `audit://novel/archive` resources, the
   `spec_health` integrity fields, the drift-comparison block, and the
   fingerprint builder paths. Enumeration confirms names; nothing is assumed
   from the P3b-3 worklist.
2. **Run a read-only conformance review cluster by cluster (A, B, C, D)** — the
   `code-review` lenses against the current tree and each cluster's REQ bodies,
   with no diff and no edits. Findings batched, one pass per cluster. A finding
   cites the predicate (`file:line`), never a gate message.
3. **Check the carrying assertion against the REQ text** for every REQ a harness
   is believed to carry: open the test, read what it asserts, and confirm it
   tests what the REQ states. A passing harness asserting something narrower is a
   finding (the class that produced F-P1-1, F-P3B1-3, and F-P3-1). In
   particular verify that `T224` (startup drift), `T268` (pause/resume), `T269`
   (factions), `T275` (session segmentation), `T277` (compaction), `T279`
   (checkpoints), `T280`/`T334` (notes/server notes), `T471` (no-mutation), and
   `T366`/`T382`/`T383`/`T384` (codex/provenance) assert the full contract, not
   a substring, and classify the six tokens absent from every harness
   (`T17`, `T52`, `T346`, `T497`, `T358`, `T270`, EV9) before calling them
   missing.
4. **Verify the fingerprint surface** (REQ-044, REQ-302, REQ-065, REQ-313,
   REQ-314): stored-versus-current field comparison and each drift marker, the
   build-timestamp exemption, precedence of active-build values, graceful load
   of unknown/missing fields, unrecoverable-state reporting, fresh-start match,
   `spec_health` fingerprint fields, and the builder-side sentinel/partial-rebuild
   contracts. Classify each bucket-E REQ as `builder-side` or a runtime finding
   on the evidence, not on the register bucket alone.
5. **Verify continuity and world reactivity** (REQ-232, REQ-233, REQ-236,
   REQ-237): every `gm_context` field, save/get/end/resume behaviour, the
   auto-capture of clocks/countdowns/dispositions/relationships/story/vows,
   faction create/update/remove plus clock coupling and resources, relationship
   set/get/in-place update/sheet section/narrative marker, session-boundary
   markers and badge filtering, `recap(session_id)`, and `spec_health.sessions`.
6. **Verify durability and notes** (REQ-239, REQ-241, REQ-242, REQ-285):
   compaction window, summary fields, `source_ordinals`/`source_sessions`,
   hash-chain re-anchoring, irreversibility with `[NEED_INPUT]`, active-session
   exclusion, Player refusal; checkpoint capture/exclusions, restore digest
   check, capacity eviction, export inclusion, end-novel removal; note scopes,
   default GM scope, badge filtering, `notes://`, export/clone/checkpoint
   inclusion; server-note persistence, `spec_health.server_notes`,
   `server-notes://`, and exclusion from Novel bundles. Confirm the checkpoint
   action alias (EV13) keeps one dispatch contract.
7. **Verify the codex and provenance** (REQ-321, REQ-332): all content kinds,
   badge gates, upsert/merge semantics, atomic array import with index-tagged
   failure, per-kind materialization (including adventure), capture and
   `update_source` rules, `[STATE_CONFLICT]` when no Novel is active,
   persistence across end/rebuild, `spec_health.codex` counts, `codex://`
   access, `codex_source` provenance fields, `[codex-stale]`, and clone/checkpoint
   preservation.
8. **Record one verdict per REQ** in the worklist's chunk P3b-4 table (67 rows,
   done-bar item 2), using the established column shape `REQ | § | Bucket |
   Verdict | Evidence`, plus one **cluster verdict row** per cluster in the same
   section: `holds` named with the gate or harness that carries the cluster,
   `builder-side`, or the finding IDs it produced (done-bar item 5).

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
4. Fill the bucket and verdict columns for all 67 rows.

### Phase 3 — Triage, registers, roadmap, artefacts

1. **Triage** every finding per Q2. Guardrails for a P0 fix:
   - A fix that changes an action's parameters or output first runs a
     sibling-contract check: grep the REQ corpus for other REQs naming the same
     `tool (action: X)` and confirm no sibling contract conflicts. Checkpoint
     actions are named by both `manage_novel`-era and `manage_archive` REQ text
     (EV13) — reconcile before editing dispatch.
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
   - bullet 1 — chunk P4 (`core/state.ts` persistence with the §5.19
     cross-check), first chunk of the post-§5.6 remainder;
   - bullet 2 — chunks P5–P7 (engine loop and event stream; adapters and
     rulesets; determinism and knowledge);
   - bullet 3 — chunk P8 (narrative cognition) and the closing M1 machine-evidence
     re-run;
   - trigger — chunk P4.
   When triage produces scheduled findings, **also** add one remediation section
   (the P3b-2/P3b-3 precedent) whose bullets name their `REQ-NNN` IDs, because
   `check-registers --strict` requires every REQ in a `Scheduled-roadmap` row to
   appear literally in `ROADMAP.md` (`scripts/lib/register-checks.ts:64-68`).
   When it produces none, add no second section.
4. **`CHANGELOG.md`**: one dated heading
   `<YYYY-MM-DD> — Full-review sweep: chunk P3b-4 (§5.6 state surfaces and
   fingerprinting)`. The date equals the current CalVer date written with
   hyphens (`2026.11.09` → `2026-11-09`); verify at execution.
5. **Artefacts**: replace the provisional `aar.md` with the execution record and
   the token the outcome earns, and update the sweep worklist's status table
   (P3b-4 closed-or-halted; P4 remains `scheduled`).

## Register write-back

| Disposition | Section | Row shape |
|---|---|---|
| `Resolved` | `## Resolved` | `### <date> full-review sweep — chunk P3b-4`; bullet `**F-P3B4-N — <title> (resolved):**` + predicate + the REQ IDs it covers + fix location + the assertion that now covers it |
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

1. `worklist.md` marks chunk P3b-4 `halted on <finding ID>` and keeps the
   partial per-REQ table.
2. `ROADMAP.md` gains an additional section for the P0: heading
   `## <finding ID> — <title> (P0)`, 1–3 bullets naming the predicate and the
   reproduction, and a `**Trigger:**` line; the admission rule applies.
3. `CHANGELOG.md` heading reads
   `<date> — Full-review sweep: chunk P3b-4 (halted on <finding ID>)`.
4. `aar.md` ends `LOOP OPEN` naming the P0 row; gates still run. Green is
   required for whatever landed **except** the red-baseline branch below.
5. No push. The P0 is the next session's first item, ahead of chunk P4.

**Red-baseline branch.** When the unfixable P0 is the baseline itself (Phase 0's
`npm run check` or a server harness is red and cannot be fixed in-session), the
landing records the red gate output verbatim in the AAR, lands the planning
artifacts, the baseline record, and the `ROADMAP.md` P0 section, and the
run does **not** claim green gates. `LOOP OPEN` names the red gate. Do not
commit review findings against a tree whose gates were never green.

## Blast radius

| File | Change | Size |
|---|---|---|
| `docs/plans/2026-11-09-full-review-p3b4/{plan,tasks,aar}.md` | this increment's artefacts | M |
| `docs/plans/2026-11-09-full-review-sweep/worklist.md` | chunk P3b-4 section, 67-row table, D36–D43, status rows | M |
| `spec/audit/review-register.md` | P3b-4 finding rows (one dated subsection per used disposition) | S |
| `ROADMAP.md` | sweep bullets re-scoped to P4–P8/M1; trigger advanced to P4; one remediation section only when triage schedules findings (it must name their REQs); extra P0 section only on a halted run | S |
| `CHANGELOG.md` | dated heading + bullets | S |
| `holonovel/src/**`, `holonovel/scripts/test-*.ts` | only if a P0 fix lands (named at that time) | S–M |
| `holonovel/src/generated/contract-fingerprints.ts` | regenerated by `build-order` if a §5.6 REQ body changes (Q7) | — |
| `holonovel/tool-definitions.json` | regenerated only if a P0 fix edits a tool definition | — |
| `spec/**` + `holonovel.md` | only if a P0 fix amends a REQ (then `assemble` + register refresh) | S–M |
| `spec/audit/req-coverage.md` | refreshed by `npm run validate -- --write-register` when a §5.6 REQ body changes | S |
| `README.md` | `@spec:` markers refreshed by `npm run refresh-properties` only when a P0 fix amends a §5.6 REQ body (`check-markers` gates it) | S |
| `holonovel/package.json`, `package-lock.json`, `server.json`, `AGENTS.md`, `DECISIONS.md` header | advanced by `build-order` version sync | — |

## Considered and rejected

- **Splitting P3b-4 further.** Rejected: D12 fixed four family-atomic §5.6
  sub-increments; P3b-4 is the last, and the 67 rows are within one session's
  budget at the pace of P3b-1's 66-row table.
- **Treating the four bucket-E fingerprint families as unreviewable.**
  Rejected: a builder verdict is recorded, not skipped; `REQ-065` is bucket C and
  states runtime drift diagnostics, so the fingerprint cluster carries real
  runtime predicates.
- **Auditing `core/state.ts` save/load/archive internals here.** Rejected: chunk
  P4 owns them (Q5); a persistence predicate is recorded and deferred.
- **Folding the codex cluster into P6 (surface projection).** Rejected: the codex
  store and its provenance are §5.6 state surfaces; P6 owns projection internals.
- **Fixing every finding.** Rejected: P1/P2/P3 findings are scheduled or closed;
  only a P0 blocks the chunk's close.
- **Scheduling P1 findings inside the sweep bullets only.** Rejected:
  `check-registers --strict` requires every `REQ-NNN` a `Scheduled-roadmap` row
  cites to appear literally in `ROADMAP.md`; a remediation section that names
  them is the only conforming destination once a finding exists.
- **Recording P4/P5/P6 predicates as `finding:` rows.** Rejected: a boundary is
  not a defect in this chunk's surface; `deferred:<chunk>` keeps the verdict
  vocabulary mechanical without writing a register finding the code does not
  support.

## Verification

| Check | Command | Expected |
|---|---|---|
| Assembly | `npm run assemble` | exit 0 |
| Fast gate | `npm run check:fast` (un-piped) | 37/37, `check:fast: PASS` |
| Full gate | `npm run check` | 0 errors |
| Server harnesses | `npm --prefix holonovel run test:all` (authoritative; includes `test-fingerprints`, `test-limits`, `test-narrative`, `test-output-contracts`, `test-backfill`) | exit 0, record per-harness summary |
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
- **A finding that is really generic badge filtering or resource projection.**
  Mitigation: record against P1/P6 unless the rule is owned by a §5.6 surface.
- **False citation holds.** Mitigation: open every cited test; the zero-padded
  token class (F-P2-4) is a known shadowing source, and EV9 lists six tokens to
  classify before calling them absent.
- **Bucket-E fingerprint families hiding a runtime contract.** Mitigation: read
  the REQ text before recording `builder-side`; drift diagnostics and
  `spec_health` fields are runtime obligations even when the hash is computed at
  build time.
- **Checkpoint action alias drift (EV13).** Mitigation: compare the two schemas
  and the single dispatch target; a divergent contract is a finding, a staged
  alias is not.
- **The 67-row table exceeding the session.** Mitigation: the family fence is
  fixed; if the session caps, land per **Stopped-run landing** rather than
  committing a partial table as complete.
- **Gate-pinned values.** The changelog date is the CalVer date;
  `session:close` derives the commit subject from the top CHANGELOG heading.
- **Draft artefact breaks a gate mid-session.** `check-loop-artifacts` requires
  plan, tasks, and a LOOP token; all three exist from the drafting step.
- **No destructive operations, no push.** Every change is a reversible edit or an
  added artefact; rollback cost 1 (one `git revert`) when there is no C0, or 2
  (revert C1 then C0) when a baseline fix landed first.

## Commit order and gates

| # | Commit | Scope | Gate before commit |
|---|---|---|---|
| C0 (conditional) | Restore a green baseline | only if Phase 0's `npm run check` or a server harness is red — that fix alone | `check:fast`, `check`, plus the red server harness re-run |
| C1 | Full-review sweep: chunk P3b-4 (§5.6 state surfaces and fingerprinting) | plan/tasks/AAR, worklist chunk-P3b-4 rows and status, register rows, ROADMAP.md, CHANGELOG.md, any P0 fix | `assemble`, `check:fast`, `check`, `check-roadmap`, `check-registers --strict`, `check-loop-artifacts`, `build-order`, `npm --prefix holonovel run test:all` (and `validate --sdd-strict` if a REQ body changed) |

C1 is one commit (spec increment); C0 exists only when the baseline is red and
lands first. Publication is not part of this increment.

## User impact

None to runtime behaviour unless a P0 fix lands. The increment changes review
records, the roadmap trigger (advanced to chunk P4), and the changelog; chunks
P4–P8 stay scheduled, not executed.

## Evidence

- Review artefact: this file; tracker:
  `docs/plans/2026-11-09-full-review-sweep/worklist.md`.
- Finding predicates: recorded per finding in `spec/audit/review-register.md`.
- Baseline: EV1–EV14 above (repo and tool-output sources).
- No external sources; no user-supplied content drives an instruction.
