# Plan — Full-review sweep, chunk P4 (persistence and the §5.19 cross-check)

**Status:** draft, awaiting user approval · **Date:** 2026-11-09 · **Depth:** standard
**Review independence:** fresh — cold pass `independent-review passed.`
(0 blockers, 3 majors, 8 nits; all resolved in this revision; stages 5/5;
report `/tmp/opencode/p4-independent-review.md`, diff re-review
`/tmp/opencode/p4-independent-rereview.md`)
**Roadmap item:** `ROADMAP.md` § Remaining full-review sweep (P1)
**Predecessor:** `docs/plans/2026-11-09-full-review-p3b4/` (chunk P3b-4, closed
2026-11-09, `LOOP PAUSED`)
**Tracker:** `docs/plans/2026-11-09-full-review-sweep/worklist.md`

## Review status

Drafted against the live tree and the sweep's established method. Chunk P4 is
the first chunk after the §5.6 family series: it reviews `core/state.ts`
persistence, `core/data-dir.ts`, and the save/load/archive/undo lifecycle, and
cross-checks the nine §5.19 persistence-guardrail REQs. Depth is `standard`: the
increment edits review records, registers, roadmap, and changelog; it is fully
reversible and performs no destructive, remote, or schema-migration operation.

## Done bar

**Done bar:** this increment only — chunk P4 of the sweep program. The bar is
met when all nine items hold; anything else found is scheduled, not chased.

1. `docs/plans/2026-11-09-full-review-p4/` carries `plan.md`, `tasks.md`, and
   `aar.md`, and `aar.md` ends in `LOOP PAUSED` or `LOOP OPEN`.
   `check-loop-artifacts` passes.
2. The sweep `worklist.md` holds a chunk P4 section with **one row per §5.19
   REQ — 9 rows** (`REQ-400`, `401`, `402`, `403a`, `403b`, `404`, `405`,
   `406`, `407`), each carrying its bucket inherited from the base family row in
   `spec/audit/req-coverage.md` and a verdict of `holds`, `finding:<ID>`, or
   `deferred:<chunk>`.
3. The same section holds a **persistence code-surface table** — one row per
   reviewed behaviour, at minimum: save path and atomic write, backup rotation,
   checksum/stamp, compression, restore from backup, roster/notes/codex writes,
   migration/re-stamp, hydration scan, `end`/trash, archive/unarchive,
   checkpoint/snapshot/undo/redo, reassembly/export-import, data-dir resolution,
   and slug-to-path safety — each with a `file:line` anchor, the harness that
   carries it, and a verdict. That row set, not the gate result, is the
   falsifiable record that the code was reviewed; a reviewed behaviour is not
   "covered" by a cluster verdict alone.
4. Every `finding:<ID>` names a `file:line` or `spec:line` predicate and a
   P-severity, and has a terminal disposition (`Resolved` · `Scheduled-roadmap` ·
   `Closed-P3` · `Deferred-by-user`).
5. Zero open P0 findings remain. A P0 that cannot be fixed inside the session
   stops the run and still lands as a record (see **Stopped-run landing**).
6. Each of the four clusters (A–D below) has a recorded review verdict: `holds`
   with the gate or harness that carries it, the finding IDs it produced, or
   `deferred:<chunk>` where the predicate lands wholly in a later chunk.
7. `spec/audit/review-register.md` carries every P4 finding under the section
   its disposition names; no `Scheduled-roadmap` row is written without its
   matching `ROADMAP.md` entry, and every `REQ-NNN` token in a
   `Scheduled-roadmap` row appears literally in `ROADMAP.md`
   (`scripts/lib/register-checks.ts:64-68`, strict inside `npm run check`).
8. `ROADMAP.md` is updated in the same increment: the sweep section names the
   remaining chunks P5–P8 plus M1, its `**Trigger:**` line names chunk P5, and
   the section keeps the admission shape (1–3 bullets + `**Trigger:**`).
9. These exit 0 un-piped: `npm run assemble`, `npm run check:fast`,
   `npm run check`, and `npm --prefix holonovel run test:all`. The increment is
   one commit, subject derived by `npm run session:close` from the
   `CHANGELOG.md` heading; a conditional C0 baseline fix precedes it as its own
   commit. No push.

## Open questions (answers recorded as decisions before execution)

- **Q1 — Chunk scope.** The roadmap names chunk P4 as `core/state.ts`
  persistence with the §5.19 cross-check. The spec row set is the nine §5.19
  REQs (EV4); the code surface is `core/state.ts` persistence and lifecycle
  (`saveNovel`, `resumeNovel`, backups, archive, undo), `core/data-dir.ts`, and
  the persistence handlers in `index.ts`. **Recommendation:** execute as one
  increment; the stopped-run landing is the split point.
- **Q2 — Fix policy.** D2/D13 unchanged: P0 fixed in-session (bounded), P1
  scheduled on `ROADMAP.md`, P2 fixed only on a demonstrated failure, P3
  record-and-close. **Recommendation:** adopt, so chunks stay comparable.
- **Q3 — Increment record.** New directory
  `docs/plans/2026-11-09-full-review-p4/` for this increment's plan/tasks/AAR;
  the sweep `worklist.md` stays the cross-session tracker and carries the P4
  tables and decisions D44–D51. **Recommendation:** yes.
- **Q4 — Bucket resolution.** Resolve by base family ID from
  `spec/audit/req-coverage.md`, never by section membership. The §5.19 block has
  **eight family rows and nine REQs** (`REQ-403` carries `403a`/`403b`); all are
  bucket C (EV9). Re-verify at Phase 0. **Recommendation:** yes.
- **Q5 — Boundaries.** `§5.9` and `§5.19` semantic review stay closed from the
  2026-11-09 seam pass (EV11); P4 does a **code-side** review, so a code defect
  in the persistence surface is a finding even when the §5.9 prose is settled.
  A predicate wholly in the event log or engine loop is `deferred:P5`; resource
  projection `deferred:P6`; determinism primitives `deferred:P7`; subjective-
  memory internals `deferred:P8`. A badge-filter-only predicate is not a new
  destination — chunk P1 is closed, so it is recorded `Closed-P3` with the P1
  closure reference unless it is a persistence defect. These four `deferred:`
  labels are the only values used. **Recommendation:** record and defer across
  the boundary.
- **Q6 — Citation resolution scope.** Apply chunk P2/P3b-1's method unchanged:
  each REQ's own `*Check:*` IDs; a REQ with no own Check inherits its family's
  citation set; an `Automated` citation must appear literally in a
  `holonovel/scripts` harness **and** the harness body must be opened and must
  exercise the stated behaviour; `Manual`, `Gate`, and scenario citations need
  no harness. Zero-padded title tokens (`T0nn`) are shadowing, not evidence
  (F-P2-4). **Recommendation:** adopt.
- **Q7 — Fingerprint consequence.** Both `§5.9` and `§5.19` are in
  `DATA_SECTIONS` (`scripts/lib/contract-fingerprint.ts:38`, EV12), so **any**
  REQ-body edit in this chunk requires `npm run build-order` to regenerate
  `holonovel/src/generated/contract-fingerprints.ts`. The plan budgets for it.
  **Recommendation:** adopt; the increment is review-only, so this triggers only
  if a P0 fix amends a REQ body.
- **Q8 — Publication.** `npm run status` reports **11 unpushed commits** at
  session start (EV2/EV13). **Recommendation:** no push; publication stays
  user-authorized.

## Scope

**In scope.** Chunk P4 review of the persistence surface: the save path and its
integrity envelope (atomic temp write, fsync, rename, checksum, compression,
backup rotation), restore and corruption handling (primary read, rotated-backup
chain, legacy `.bak`, `[state-regression]`, trash retention), lifecycle file
operations (`end`, archive/unarchive, clone/export-import touchpoints,
checkpoint/snapshot/undo/redo), data-directory resolution (`resolveDataDir`,
`resolveInboxDir`, `resolveWithin`, `isSafeSlug`), and the §5.19 cross-check of
nine REQs. Citation resolution for those nine. Findings dispositioned. Roadmap
trigger advanced. Register rows. Changelog entry.

**Out of scope.** Re-opening the §5.9 or §5.19 semantic review (closed by the
2026-11-09 seam pass, EV11); the event log, engine loop, and agent tasks (P5);
surface projection, world-model tiers, rulesets, and library (P6); RNG, state
hash semantics, limits, corpus, semantic index, and graph (P7); narrative
cognition (P8); the open remediation roadmap items; publication.

**Row set (§5.19, 9 REQs).** `REQ-400`, `REQ-401`, `REQ-402`, `REQ-403a`,
`REQ-403b`, `REQ-404`, `REQ-405`, `REQ-406`, `REQ-407`. A REQ outside this set
belongs to another chunk; record it there, not here.

## Evidence base (this session)

| # | Evidence | Source | Trust |
|---|---|---|---|
| EV1 | `npm run check:fast` → exit 0, 37 passed / 0 failed, trailing line `check:fast: PASS` | tool output, this session | tool-output |
| EV2 | `npm run status`: version `2026.11.09`, last publish `2026-11-09T04:30:29Z`, 11 unpushed commits, 12 open roadmap items | tool output, this session | tool-output |
| EV3 | Tree clean at plan time; `git rev-parse --short HEAD` = `5f941e4`; `origin/main..HEAD` = 11 commits | `git status`, `git rev-list` | repo |
| EV4 | §5.19 spans `spec/02-requirements.md:4034-4097` and holds **9 REQs**: `REQ-400`, `401`, `402`, `403a`, `403b`, `404`, `405`, `406`, `407` | `grep -n '^### 5\.'`, `awk` | repo |
| EV5 | Code surface: `core/state.ts` 3 080 lines, `core/data-dir.ts` 98, `index.ts` 14 736 | `wc -l` | repo |
| EV6 | `state.ts` persistence anchors: checksum predicate `:75-82`; `reStampArtifact` `:174`; backup scan `:150`; `backupCount` `:2422`; `backupCandidates` `:2429`; `restoreFromBackups` `:2439`; `backupFilesOnDisk` `:2455`; `stateDigest` `:2475`; `saveNovel` `:2479`; `saveRoster` `:2558`; `loadRoster` `:2582`; `loadServerNotes` `:2641`; `saveServerNotes` `:2654`; `loadCodex` `:2667`; `saveCodex` `:2680`; `readNovelData` `:1304`; `resumeNovel` `:1321-1370`; hydration scan `:1446-1530`; `loadNovelFromData` `:1534`; `endNovel` `:1697`; `archiveNovel` `:1730`; `unarchiveNovel` `:1751`; `archivedNovels` `:1770`; `restoreFromSnapshot` `:1817`; `snapshot` `:1875`; `undo` `:1887`; `redo` `:1902`; `recordStateRegression` `:2093` | `grep -n`, `sed` this session | repo |
| EV7 | `data-dir.ts` exports `resolveDataDir` `:46`, `resolveInboxDir` `:71`, `resolveWithin` `:80`, `isSafeSlug` `:96`; `index.ts` resolves `DATA_DIR` at `:92`; `state.ts:3079-3080` re-exports only `resolveDataDir` and the `DataDirOptions` type | `grep -n` | repo |
| EV8 | Carrying harnesses: `test-persistence.ts` (`T158/REQ-140` `:368`, `T276/REQ-238` `:362`, `:539`, `:560`, `:573`, `T381/REQ-334` `:414`, `T240/REQ-240` `:119`, `T122` `:405`, `T712/REQ-601` `:692`); `test-persistence-guardrails.ts` (`T469`–`T476`, `:100-257`); `test-limits.ts` (`T475` compression `:296`, `T474` `:398`); `test-data-dir.ts` (`T731`, `:58`) | `grep -n`, this session | repo |
| EV9 | Coverage register: the §5.19 block has eight family rows and nine REQs, all bucket C (`REQ-400`–`407`, `spec/audit/req-coverage.md:369-376`). Persistence-contract rows are also bucket C: `REQ-092` `:75`, `REQ-238` `:216`, `REQ-240` `:218`, `REQ-241` `:219`, `REQ-334` `:303`, `REQ-613` `:571`, `REQ-601` `:559` | `grep -nE`, this session | repo |
| EV10 | No §5.19-specific root gate exists. `npm --prefix holonovel run test:all` is the authoritative server run (`holonovel/scripts/run-test-suite.ts`); `test-package-manifest` is a root gate inside `check:fast`/`check` | `run-test-suite.ts`, EV1 | repo |
| EV11 | The 2026-11-09 seam pass closed the §5.9/§5.19 semantic review and REQ-401–406 drift reachability (`spec/audit/review-register.md:66`); its fixes are in the code this chunk reviews | `review-register.md` | repo |
| EV12 | `DATA_SECTIONS` includes `"### 5.9 "` and `"### 5.19 "` (`scripts/lib/contract-fingerprint.ts:38`) | `sed` | repo |
| EV13 | The sweep's roadmap section names chunk P4 as the next start; §5.6 sub-chunks are all closed (`ROADMAP.md:15-28`) | `ROADMAP.md` | repo |

## The chunk's review surface — four clusters

Mapping check: the four clusters partition the code surface with one named
seam (REQ-406, below); the nine §5.19 rows are cluster D's spec set.

| Cluster | Surface | Code targets | Harnesses |
|---|---|---|---|
| **A** save path and integrity | `saveNovel` atomic write, backup rotation, checksum, compression, roster/notes/codex writes, re-stamp/migration | `state.ts:2479`, `:2422-2455`, `:75-82`, `:174-215`, `:2558-2690` | `test-persistence.ts` (`T276`), `test-limits.ts` (`T475`) |
| **B** load, restore, corruption | primary read, gzip detection, rotated-backup restore, legacy `.bak`, `[state-regression]`, no-valid-backup path, hydration scan | `state.ts:1304`, `:1310-1370`, `:1446-1530`, `:1534`, `:2434-2464`, `:2093` | `test-persistence.ts` (`T276` corruption `:560`, `T159`), `test-persistence-guardrails.ts` (`T475`) |
| **C** lifecycle file operations | `end`/trash, archive/unarchive, clone/export-import touchpoints, checkpoint/snapshot/undo/redo, trash retention | `state.ts:1697`, `:1730`, `:1751`, `:1770`, `:1817-1913`; `index.ts` `manage_novel`/`manage_archive` handlers | `test-persistence.ts` (`T158`, `T381`, `T240`, `T122`, `T712`) |
| **D** §5.19 cross-check | persistence directive, `state_ledger`, no-mutation marker, drift + gate, roll-to-commit, auto-moment, backup-restore regression, never-truncated persist tools | `index.ts` `badge_briefing`, `spec_health` (inside `manage_diagnostics (action: health)`), `manage_context (action: recap)`; `state.ts` drift block; `test-persistence-guardrails.ts` | `T469`–`T476` |

Cluster A/B/C verdicts are code-surface rows (done bar 3). Cluster D carries the
nine per-REQ verdicts (done bar 2). `REQ-406` (backup-restore regression) is the
seam between B and D: its code predicate is recorded once, under cluster B, and
its REQ verdict under cluster D.

## Steps

### Phase 0 — Baseline (no source edits)

1. Re-run `npm run check:fast` un-piped immediately before the review and record
   the exit status; run `npm run check` once so the full gate's baseline is
   measured rather than inherited. A red baseline is a P0 and is fixed first, as
   its own commit; if it cannot be fixed in-session, land per **Stopped-run
   landing** (red-baseline branch).
2. Run `npm --prefix holonovel run test:all` and record the per-harness summary
   and exit status; at minimum the run must include `test-persistence`,
   `test-persistence-guardrails`, `test-limits`, `test-data-dir`, and
   `test-fingerprints` (EV8/EV10). These four are the **persistence harnesses**
   re-run after any P0 fix that touches the store: `test-persistence`,
   `test-persistence-guardrails`, `test-limits`, `test-data-dir`.
3. Confirm `git status --porcelain` shows **only** the untracked
   `docs/plans/2026-11-09-full-review-p4/` directory and record
   `git rev-parse --short HEAD`.
4. Confirm the artefact directory is trackable: `git check-ignore -v
   docs/plans/2026-11-09-full-review-p4/` returns nothing.
5. Record Q1–Q8 as **D44–D51** in the sweep `worklist.md` before review work
   starts (D1–D43 are already recorded and are not renumbered). Decisions go in
   the worklist, not this file, so the stamped plan hash stays valid.
6. Record the plan gate's evidence sidecar at the concrete path `preflight`
   returned (this session:
   `~/.local/state/opencode/plans/fe586f0907cda9bed04d391d454275b4a14bc3e300047c43f32dd854d4f08ed4/plan.evidence.json`,
   outside the increment directory, which holds only plan/tasks/aar).
7. Re-derive the row set (nine §5.19 REQs) and the bucket for each family from
   `spec/audit/req-coverage.md` (EV9). A mismatch is fixed in the worklist, not
   by silently re-scoping.

### Phase 1 — Code side (read-only review)

1. **Enumerate the surface**, recording `file:line` anchors in the worklist:
   `saveNovel` and its backup chain, `reStampArtifact`, the checksum predicate,
   `readNovelData`/`resumeNovel`/`loadNovelFromData`, the hydration scan,
   `restoreFromBackups`/`backupCandidates`/`backupFilesOnDisk`, `endNovel`,
   `archiveNovel`/`unarchiveNovel`/`archivedNovels`, `restoreFromSnapshot`,
   `snapshot`/`undo`/`redo`, `saveRoster`/`loadRoster`,
   `saveServerNotes`/`loadServerNotes`, `saveCodex`/`loadCodex`,
   `stateDigest`, and the `data-dir.ts` helpers. Enumeration confirms names;
   nothing is assumed from the P3b worklist.
2. **Review with `code-review`** (read-only, reached through
   `programming-orchestrator`) cluster by cluster over that surface: A
   save/integrity, B load/restore, C lifecycle file operations. Every finding
   cites the predicate (`file:line`), never a gate message.
3. **Check each assertion against the behaviour it claims.** Open every cited
   harness and confirm the body exercises the contract: `T276` (rotation and
   restore), `T158` (end/trash), `T381` (archive), `T240` (clone), `T122`
   (retention), `T712` (state digest), `T475` (compression and restore
   regression). A passing harness asserting something narrower is a finding.
   Zero-padded title tokens (`T0nn`) are shadowing, not evidence (F-P2-4).
4. **Verify atomicity and failure paths**: temp-file naming and cleanup, `fsync`
   before rename, backup rotation ordering, the first-save-after-restore guard
   (`restoredThisSession`), the no-valid-backup path, trash-move of the backup
   chain, retention purge, and export/import reassembly. Record any branch that
   has no reachable assertion (a citation-gap finding, not an automated one).
5. **Verify the §5.19 cross-check (cluster D)** against the nine REQs: the
   persistence directive and `state_ledger` token (REQ-400/401), the
   `[session-no-mutations]` marker and drift/gate behaviour (REQ-402/403a/b),
   `[uncommitted-roll]` (REQ-404), auto-moment recording and the `auto_record`
   flag (REQ-405), `[state-regression]` on backup restore (REQ-406), and the
   never-truncated persist-tool section (REQ-407). The seam pass's fixes
   (EV11) are in scope to confirm, not to re-litigate.
6. **Verify `data-dir.ts`**: `TTRPG_DATA_DIR` precedence, legacy install
   detection, per-OS paths, owner-only creation, `resolveWithin` traversal
   refusal, and `isSafeSlug` on every slug that reaches a path join. A slug that
   bypasses one of these is a finding.
7. **Record one verdict per §5.19 REQ** (9 rows, done bar 2) and one row per
   reviewed persistence behaviour (done bar 3), using the established column
   shape `REQ | § | Bucket | Verdict | Evidence`, plus one **cluster verdict
   row** per cluster (done bar 6).

### Phase 2 — Spec side (citation resolution)

1. Apply the reproducible method (Q6): each REQ's own `*Check:*` IDs; a REQ with
   no own Check inherits its family's citation set; an `Automated` citation must
   appear literally in a `holonovel/scripts` harness **and** its body must
   exercise the stated behaviour; `Manual`, `Gate`, and scenario citations need
   none. Bucket from the base family row per Q4.
2. Classify citation *kind* before counting a missing harness: P1 produced 69
   false findings by skipping it; P2 saw 20 from zero-padded token shadowing
   (F-P2-4). A scenario citation needs no harness; an `Automated` token with no
   harness is a finding.
3. A REQ whose cited test does not exercise the stated behaviour is a finding.
   `npm run check:conformance -- --dedicated` over-flags on this corpus
   (AGENTS.md), so its output is evidence to inspect, never a finding by itself.
4. Fill the bucket and verdict columns for all nine rows.

### Phase 3 — Triage, registers, roadmap, artefacts

1. **Triage** every finding per Q2. Guardrails for a P0 fix:
   - A fix in `state.ts` file I/O runs the four persistence harnesses plus
     `test:all`; a fix that changes a save format also re-runs `test-limits`
     (compression) and `test-fingerprints`.
   - A fix that changes an action's parameters or output first runs a
     sibling-contract check: grep the REQ corpus for other REQs naming the same
     `tool (action: X)` and confirm no sibling contract conflicts.
   - A fix that amends a REQ body complies with Appendix M's authoring limits
     (one paragraph, no tables/bullets/steps, 800-char and 8-sentence caps);
     `npm run validate --sdd-strict` is the check.
   - A fix that edits a §5.9 or §5.19 REQ body: `npm run assemble`, then
     `npm run validate -- --write-register`, then `npm run build-order` — both
     sections are in `DATA_SECTIONS`, so the fingerprint **must** regenerate
     (Q7).
   - A fix that edits a tool definition re-runs the generator and the surface
     gates (`npm run build-order`); `check-tool-definitions-sync` fails on a
     stale `tool-definitions.json`.
2. **`spec/audit/review-register.md`**: one dated heading per used disposition
   section, rows per **Register write-back** below.
3. **`ROADMAP.md`**: keep the sweep item's 1–3 bullet + `**Trigger:**` shape
   (`check-roadmap` rejects any other) and update it to:
   - bullet 1 — chunk P5 (engine loop, event stream, durable agent tasks);
   - bullet 2 — chunks P6–P7 (adapters/rulesets; determinism and knowledge);
   - bullet 3 — chunk P8 (narrative cognition) and the closing M1
     machine-evidence re-run;
   - trigger — chunk P5.
   When triage produces scheduled findings, **also** add one remediation section
   (the P3b-2/P3b-3 precedent) whose bullets name their `REQ-NNN` IDs, because
   `check-registers --strict` requires every REQ in a `Scheduled-roadmap` row to
   appear literally in `ROADMAP.md` (`scripts/lib/register-checks.ts:64-68`).
   When it produces none, add no second section.
4. **`CHANGELOG.md`**: one dated heading `<YYYY-MM-DD> — Full-review sweep:
   chunk P4 (persistence and the §5.19 cross-check)`. The date equals the
   current CalVer date written with hyphens (`2026.11.09` → `2026-11-09`);
   verify at execution.
5. **Artefacts**: replace the provisional `aar.md` with the execution record and
   the token the outcome earns, and update the sweep worklist's status table
   (P4 closed-or-halted; P5 remains `scheduled`).

## Register write-back

| Disposition | Section | Row shape |
|---|---|---|
| `Resolved` | `## Resolved` | `### <date> full-review sweep — chunk P4`; bullet `**F-P4-N — <title> (resolved):**` + predicate + the REQ IDs it covers + fix location + the assertion that now covers it; the bullet text itself carries the date or fix commit ref (`register-checks.ts` dates the finding text, not the heading) |
| `Scheduled-roadmap` | `## Scheduled-roadmap` | same heading; bullet names the finding, the predicate, the REQ IDs it covers, and the `ROADMAP.md` section it is scheduled under, plus a date or commit ref; each cited `REQ-NNN` also appears literally in `ROADMAP.md` |
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

1. `worklist.md` marks chunk P4 `halted on <finding ID>` and keeps the partial
   tables.
2. `ROADMAP.md` gains an additional section for the P0: heading
   `## <finding ID> — <title> (P0)`, 1–3 bullets naming the predicate and the
   reproduction, and a `**Trigger:**` line; the admission rule applies.
3. `CHANGELOG.md` heading reads
   `<date> — Full-review sweep: chunk P4 (halted on <finding ID>)`.
4. `aar.md` ends `LOOP OPEN` naming the P0 row; gates still run. Green is
   required for whatever landed **except** the red-baseline branch below.
5. No push. The P0 is the next session's first item, ahead of chunk P5.

**Red-baseline branch.** When the unfixable P0 is the baseline itself (Phase 0's
`npm run check` or a server harness is red and cannot be fixed in-session), the
landing records the red gate output verbatim in the AAR, lands the planning
artifacts, the baseline record, and the `ROADMAP.md` P0 section, and the run
does **not** claim green gates. `LOOP OPEN` names the red gate. Do not commit
review findings against a tree whose gates were never green.

## Blast radius

| File | Change | Size |
|---|---|---|
| `docs/plans/2026-11-09-full-review-p4/{plan,tasks,aar}.md` | this increment's artefacts | M |
| `docs/plans/2026-11-09-full-review-sweep/worklist.md` | chunk P4 section, 9-REQ table + code-surface table, D44–D51, status rows | M |
| `spec/audit/review-register.md` | P4 finding rows (one dated subsection per used disposition) | S |
| `ROADMAP.md` | sweep bullets re-scoped to P5–P8/M1; trigger advanced to P5; one remediation section only when triage schedules findings (it must name their REQs); extra P0 section only on a halted run | S |
| `CHANGELOG.md` | dated heading + bullets | S |
| `holonovel/src/core/state.ts`, `holonovel/src/core/data-dir.ts`, `holonovel/src/index.ts` | only if a P0 fix lands (named at that time) | S–M |
| `holonovel/scripts/test-*.ts` | only if a P0 fix needs an assertion (named at that time) | S |
| `holonovel/src/generated/contract-fingerprints.ts` | regenerated by `build-order` if a §5.9/§5.19 REQ body changes (Q7) | — |
| `holonovel/tool-definitions.json` | regenerated only if a P0 fix edits a tool definition | — |
| `spec/**` + `holonovel.md` | only if a P0 fix amends a REQ (then `assemble` + register refresh) | S–M |
| `spec/audit/req-coverage.md` | refreshed by `npm run validate -- --write-register` when a REQ body changes | S |
| `README.md` | `@spec:` markers refreshed by `npm run refresh-properties` only when a P0 fix amends a fingerprinted REQ body (`check-markers` gates it) | S |
| `holonovel/package.json`, `package-lock.json`, `server.json`, `AGENTS.md`, `DECISIONS.md` header | advanced by `build-order` version sync | — |

## Considered and rejected

- **Reviewing §5.9 persistence prose again.** Rejected: the 2026-11-09 seam
  pass closed it (EV11); P4's value is the code-side check, and reopening the
  prose would duplicate a closed review.
- **Folding the §5.19 rows into the §5.6 tables.** Rejected: §5.19 is its own
  section and the roadmap names it as this chunk's cross-check; a separate row
  set keeps the verdict vocabulary mechanical.
- **Treating `data-dir.ts` as out of scope because it is 98 lines.** Rejected:
  it is the only gate between a slug and a filesystem path; `resolveWithin` and
  `isSafeSlug` are exactly the kind of predicate a persistence review must open.
- **Chasing every uncovered branch with a new harness.** Rejected: an
  unreachable branch with no assertion is a citation-gap finding; writing
  harnesses for every branch is remediation, not review.
- **Fixing every finding.** Rejected: P1/P2/P3 findings are scheduled or closed;
  only a P0 blocks the chunk's close.
- **Scheduling P1 findings inside the sweep bullets only.** Rejected:
  `check-registers --strict` requires every `REQ-NNN` a `Scheduled-roadmap` row
  cites to appear literally in `ROADMAP.md`; a remediation section that names
  them is the only conforming destination once a finding exists.
- **Recording P5–P8 predicates as `finding:` rows.** Rejected: a boundary is not
  a defect in this chunk's surface; `deferred:<chunk>` keeps the verdict
  vocabulary mechanical without writing a register finding the code does not
  support.

## Verification

| Check | Command | Expected |
|---|---|---|
| Assembly | `npm run assemble` | exit 0 |
| Fast gate | `npm run check:fast` (un-piped) | 37/37 (or the new total if a P0 fix adds a harness), `check:fast: PASS` |
| Full gate | `npm run check` | 0 errors |
| Server harnesses | `npm --prefix holonovel run test:all` (authoritative; includes `test-persistence`, `test-persistence-guardrails`, `test-limits`, `test-data-dir`) | exit 0, record per-harness summary |
| Roadmap admission | `npm run check-roadmap` | pass after the roadmap edit |
| Register cross-refs | `npm run check-registers -- --strict` | pass |
| Loop artefacts | `npm run check-loop-artifacts` | pass, LOOP token present |
| Coverage register | `npm run validate -- --write-register` | only when a REQ body changed |
| REQ shape (conditional) | `npm run validate --sdd-strict` | only when a P0 fix amends a REQ body; 0 shape errors |
| Fingerprints (conditional) | `npm run build-order` | 0 errors; `check-fingerprint-sync` passes |
| Machine evidence | `npm run check:conformance` | exit 0; record the summary |

## Risks and rollback

- **A persistence defect discovered late can exceed the session.** Mitigation:
  stop, record, land per **Stopped-run landing**; the plan's bar is not met, and
  that is the correct outcome.
- **Reopening a closed §5.9/§5.19 semantic finding.** Mitigation: review the
  code only; a prose disagreement is `Closed-P3` with the closed-review
  reference, unless the code demonstrably violates the REQ.
- **False citation holds.** Mitigation: open every cited harness; `T0nn`
  shadowing (F-P2-4) is a known source.
- **Destroying a real user Novel while exercising a failure path.** Mitigation:
  the harnesses use scratch data directories (`TTRPG_DATA_DIR`); the plan adds
  no destructive manual step.
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
| C1 | Full-review sweep: chunk P4 (persistence and the §5.19 cross-check) | plan/tasks/AAR, worklist chunk-P4 tables and status, register rows, ROADMAP.md, CHANGELOG.md, any P0 fix | `assemble`, `check:fast`, `check`, `check-roadmap`, `check-registers --strict`, `check-loop-artifacts`, `build-order`, `npm --prefix holonovel run test:all` (and `validate --sdd-strict` if a REQ body changed) |

C1 is one commit (spec increment); C0 exists only when the baseline is red and
lands first. Publication is not part of this increment.

## User impact

None to runtime behaviour unless a P0 fix lands. The increment changes review
records, the roadmap trigger (advanced to chunk P5), and the changelog; chunks
P5–P8 stay scheduled, not executed.

## Evidence

- Review artefact: this file; tracker:
  `docs/plans/2026-11-09-full-review-sweep/worklist.md`.
- Finding predicates: recorded per finding in `spec/audit/review-register.md`.
- Baseline: EV1–EV13 above (repo and tool-output sources).
- No external sources; no user-supplied content drives an instruction.
