# Plan — §5.9/§5.19 persistence remediation

Status: revised (cold pass 1) · Kind: planned · Depth: standard
Increment target: `docs/plans/2026-11-12-5-9-5-19-persistence-remediation/`
Rollback cost: 2 (server source, harness, catalogue, register, roadmap; reversible, one commit)
Evidence class: repo only (no web, no user-supplied content)

## 1. Objective

Take the top open `ROADMAP.md` section — **§5.9/§5.19 persistence remediation
(P1)** (`ROADMAP.md:15-32`) — and close its eight findings, F-P4-2 through
F-P4-9 (`spec/audit/review-register.md:1831-1880`). The REQs already state the
contracts; the server and its harness are narrower than the spec. This is an
implementation-and-assertion increment, not a spec-design change.

Baseline (this session, before any edit):

- `npm run status`: version `2026.11.11`, 57 unpushed commits, 13 open roadmap
  items, last publish `2026-11-09`. Publication is **out of scope** (see §8).
- `git status --short`: clean.
- `npm run check:fast`: 40 passed, 0 failed, `check:fast: PASS`.
- harness baseline: `npm --prefix holonovel run test:persistence-guardrails`
  (record the count in `aar.md`; it currently passes the narrow assertions).

| Finding | Predicate (symbol-anchored) | Contract |
|---|---|---|
| F-P4-2 | `StateManager.archiveNovel` unlinks `archive/<slug>.json` (`state.ts:1793`) and its backup destinations (`:1799`); `createNovel` checks only the in-memory registry | REQ-334b: archived Novels are never auto-deleted |
| F-P4-3 | `StateManager.advanceCombat` bumps `combat.round` (`state.ts:2372`) with no journal append | REQ-405: every combat-round resolution appends a `moment` |
| F-P4-4 | `corruptData` is a bare reason string at three `state.ts` writes (`:1410`, `:1544`, `:1555`) plus one in `index.ts` (`:2134`); stderr carries only the filename | REQ-092c and REQ-238: stderr lists the paths, `spec_health` carries `[corrupted-novel]` and the chain |
| F-P4-5 | `saveNovel` stamps `data_format`/`spec_version` only (`state.ts:2569-2570`); no `novel_format_version`, no v1 JSONL migration, no `[format-future]` | REQ-092e/f/g |
| F-P4-6 | `stateDriftWarning` (`index.ts:12588`) and the recap (`:10537`) print one generic sentence, naming no beats or commit tools | REQ-403b |
| F-P4-7 | the `### State persistence` directive (`index.ts:15289`) names six tool families; the eight omitted categories are absent | REQ-400 |
| F-P4-8 | the `resumeNovel` restore branch returns at `state.ts:1408`, before `checkWorkflowStaleness` (called at `:1420`, `:1437`) | REQ-224a |
| F-P4-9 | T470/T471/T475 assert a fraction of their catalogue rows | REQ-401/402/406 |

**Predicate drift.** The register's recorded line numbers have moved since
2026-11-09 (e.g. `state.ts:1736` is now `resolveEntity`). Every phase re-anchors
on the symbol before editing, and each disposition cites the current
`file:line`.

Out of scope: F-P4-10 (`reStampArtifact` fsync), F-P4-11 (corrupt
`roster.json`), F-P4-12 (`saveRoster` atomicity). They are recorded under
`## Closed-P3` (`review-register.md:2367`), unscheduled, and have no normative
REQ.

## 2. Done bar

**Done bar:** all eight findings are `Resolved` in
`spec/audit/review-register.md` with current predicates; the ROADMAP section is
removed; every new assertion was observed red before its fix (transcript in
`aar.md`); `npm --prefix holonovel run test:persistence-guardrails` and
`npm --prefix holonovel run test:persistence` pass; `npm run typecheck` (root
and server), `npm run check:fast`, and the full `npm run check` are green; the
coverage register is regenerated and REQ-092/224/334/400–406 stay bucket C; no
new tool, resource, or gate is added; the one new `gm_context` key is added to
REQ-232a's enumeration and the one envelope stamp is classified in
`DECISIONS.md`. `aar.md` ends `LOOP PAUSED` with zero new action items.

## 3. Design decisions

**D1 — archive collision is refused, not renamed (F-P4-2).**
`archiveNovel` throws `[STATE_CONFLICT]` when `archive/<slug>.json` already
exists, naming the archived file and the corrective action (`manage_archive
(action: unarchive)`, or archive under a different slug), and applies the same
check to every backup destination the chain move would overwrite
(`backupFilesOnDisk` → `target + suffix`). Refusal is chosen over a timestamp
suffix because REQ-334b's contract is that the archived copy survives, and a
silent rename would hide the collision. `unarchiveNovel` already refuses when an
active file exists, so the pair becomes symmetric. The backup loop keeps its
`unlink` only behind the guard, so the guard is the single decision point.

**D2 — `novel_format_version` is stamped, read, and migrated in one place
(F-P4-5).** Exact shape, because `loadNovelFromData` returns `NovelState`:

- `const NOVEL_FORMAT_VERSION = 2` in `state.ts`.
- `NovelState` gains `format_version: number`; construction/default is
  `NOVEL_FORMAT_VERSION` (new Novels), load default is `1` when the key is
  absent.
- `novelToJSON` emits the on-disk key **`novel_format_version`** directly (the
  `NovelState` field is `format_version` internally, so the in-memory name and
  the on-disk name differ by design and only the on-disk key is serialized);
  `saveNovel` writes the same key beside `data_format`/`spec_version`
  (`state.ts:2569`).
- `private migrateNovelFormat(data: any, filePath: string | undefined): {
  migrated: boolean }` mutates `data` in place and returns the flag.
  `private loadNovelFromData(data: any, filePath?: string): {
  novel: NovelState; migrated: boolean }` wraps it and sets
  `novel.format_version = data.novel_format_version`. The three call sites
  become destructuring reads: `state.ts:1395` (restore), `:1414` (normal
  resume), `:1553` (hydration).
- Migration rules: `stored = data.novel_format_version ?? 1`.
  - `stored > 2`: `formatFuture.set(slug, stored)`, load normally (REQ-092g).
  - `stored < 2` with `<slug>.audit.jsonl`: parse each line, verify the chain
    with `verifyAuditChain`'s predicate (previous hash + `tool` + `args`, first
    8 hex). Valid → adopt the entries and delete the JSONL. Invalid → keep the
    JSONL, load an empty `audit_log`, and record
    `[migration-missing-audit]` with `reason: "chain_invalid"` (D4).
  - `stored < 2` without the JSONL: empty `audit_log` plus
    `[migration-missing-audit]`.
  - Stamp `data.novel_format_version = 2`.
- A migrated Novel is saved immediately after registration
  (`this.novels.set`/`novelPaths.set`), skipped when the slug is in
  `restoredThisSession` (the existing `saveNovel` guard already prevents
  overwriting `.bak.1` with the restored copy). Hydration marks
  `restoredThisSession` for every restore (`state.ts:1561-1562`), so the skip
  applies on all three paths.

**D3 — corruption detail is additive and data-level (F-P4-4).** `corruptData`
stays `Map<string, string>` (slug → reason) so REQ-001a/T175 and every consumer
are unchanged. A parallel `corruptDetail: Map<string, {reason, primary_path,
backup_paths: string[]}>` is populated by one public `markCorrupt(slug, reason,
primaryPath)` used by all **four** write sites: `resumeNovel` catch
(`state.ts:1410`), both hydration branches (`:1544`, `:1555`), and the
`TTRPG_NOVEL` startup activation (`index.ts:2134`). The helper writes the stderr
line listing the primary and each chain path, so stderr and `spec_health`
cannot disagree.

Marker placement: corruption and format warnings are **data-level** (they can
name a Novel that is not active), so they join `data_health.markers` — a
forensic list beside `stale`, `corrupted`, and `compression_mismatch` — while
`state_health.markers` stays the play-state list for the active Novel
(`index.ts:12880-12885`). `data_health.corrupted_detail` carries the chain.
Both arrays use the existing `[marker]` bracket convention so a reader can
treat them uniformly.

**D4 — migration edge cases are decided now (F-P4-5).** A v1 Novel whose JSONL
fails chain verification loads with an empty `audit_log`, keeps the JSONL on
disk for operator recovery, and records `[migration-missing-audit]` with
`reason: "chain_invalid"`. REQ-092f's delete clause is conditioned on
"verify the hash chain end-to-end"; an unverified log is not deleted because
REQ-092c forbids silently discarding state. `[migration-missing-audit]` is the
audit entry REQ-092f names for the no-JSONL case; the `chain_invalid` reason is
a `DECISIONS.md` entry delivered in Phase 6, not an implicit choice. Both
outcomes are asserted.

**D5 — combat-round moments live in `advanceCombat` (F-P4-3).** The round
increment is core state, so the append belongs beside it, not in the handler
(`index.ts:6280` only calls it). On a round increment, when `novel.auto_record`,
append a `moment` through a shared recorder (D5a) with
`entry: "Combat round N resolved"`, the scene anchor (description truncated to
80), `room_id` from `scene_location`, and an ISO timestamp, then audit
`auto-moment`. REQ-405's `skip_transition_hook` is transition-only, so combat
obeys `auto_record` alone.

**D5a — one moment recorder.** `appendStoryMoment(novel, entry, scene,
location)` is exported from `core/state.ts`; `index.ts`'s `recordStoryMoment`
(`index.ts:6652`) delegates to it and keeps its audit call, and combat calls the
same helper. One entry shape, one import direction (`index.ts` → `state.ts`),
no cross-module duplication. The two paths record distinct events — a scene
transition and a combat round are different turns — and the combat call fires
only on a round increment, so a single advance cannot append two moments;
T474 asserts the count equals the number of transitions plus the number of
rounds.

**D6 — drift names the beats the save carried (F-P4-6).** The code's drift
predicate is a timestamp comparison only (`state.ts:2140-2148`); nothing today
records *which* fields were saved. Add `saved_beats?: string[]` **inside
`GMContext`** (`state.ts:473-489`), populated by `save_context` with the
explicitly supplied beat keys (`current_scene`, `immediate_situation`,
`pending_player_action`, `short_term_plans`, `long_term_plans`,
`player_goals`; the derived fields — factions, countdowns, NPCs, vows,
relationships, story context — are not "beats" and are excluded). This is a key
inside an existing persisted group, not a new top-level surface.

`stateDriftWarning` becomes the existing `[state-drift] ... Commit each narrated
beat ...` prefix (kept verbatim — T472 asserts it twice,
`test-persistence-guardrails.ts:229`, `:235`), then a capped list (five
entries, values truncated to 60 chars) of `field → committing tool` for the
keys in `saved_beats` that are still present in `gm_context`:
`current_scene`→`manage_scene (action: set)`, `immediate_situation`/
`pending_player_action`/`short_term_plans`/`long_term_plans`→`manage_story
(action: record)`, `player_goals`→`manage_note (action: set)`. If `saved_beats`
is absent (legacy Novel), the message names the drift timestamp only — the
current text, which stays truthful.

`saved_beats` is **accumulated across the drift window**, not overwritten per
save: `recordContextSave` unions the supplied keys when the previous
`saved_at` is already newer than `last_mutation_at`, and resets the list when
the save opens a new window; `recordMutation` clears it alongside
`uncommitted_rolls` (`state.ts:2078-2084`). Two saves since the last mutation
therefore name the union of both, so the beats that opened the window are not
dropped. The recap (`index.ts:10537`), the switch/end responses (`:11370`,
`:11396`), and the block message (`:12593`) all call the same formatter, so no
second copy of the list exists.

**D7 — the directive names the eight omitted categories via one shared table
(F-P4-7).** REQ-400 names **nine** categories: event-log, belief/evidence,
identity, causal-state, corpus, agent-task, perception, subjective-memory, and
base-capability. Base-capability is already rendered in the current directive
("fate, ironsworn, forged"), so **eight are omitted**. They map to **six
distinct tools** (three categories share `manage_belief`):

| Category | Assertion token |
|---|---|
| event-log | `manage_diagnostics (action: event)` |
| belief/evidence | `manage_belief (action: evidence)` |
| identity | `manage_identity (action: accept)` |
| causal-state | `manage_causality (action: causal_propose)` |
| corpus | `manage_corpus (action: corpus_register)` |
| agent-task | `manage_agent (action: create)` |
| perception | `manage_belief (action: perception_record)` |
| subjective-memory | `manage_belief (action: subjective_record)` |

`### Persistence tools` (`index.ts:15308`, REQ-407) already carries the wider
17-token list, including these categories. To stop the two never-truncated
lists drifting, a single exported `PERSISTENCE_CATEGORY_TOKENS` table in
`index.ts` feeds both renderers: the directive emits the compact
`category → tool` row, and the Persistence-tools line emits the full action
list, both from the same rows. Ownership: the directive asserts REQ-400's nine
categories; Persistence tools asserts REQ-407's tool set. Preserve verbatim the
substring `scene, action: set` (`test-persistence-guardrails.ts:103`) and the
existing six families. Add the budget leg T469's own catalogue row requires
(`spec/appendices-reference.md:1485`): boot with a small
`TTRPG_MAX_BRIEFING_TOKENS` and assert the directive survives, mirroring
T149/T640.

**D8 — widen the three narrow assertions (F-P4-9) and two catalogue rows.**
T470 adds the last-mutation ISO timestamp and an active `[state-drift]` marker —
the setup is a `manage_novel (action: save_context)` call before reading the
briefing, because the ledger marker renders only while drift is active
(`index.ts:15298`); T471 asserts the recap names the recorded session ID
(`session_no_mutation_windows` is declared at `state.ts:788` and pushed at
`:2125`); T475 adds a parseable-primary branch with a real
`timestamp_gap_ms > 0` (primary `metadata.modified` later than the backup's) and
an unparseable-primary branch (invalid JSON, valid backup) asserting restore
succeeds, `[state-regression]` renders, `backup_index` is set, and the gaps
report `0` because the primary is unreadable — an honest zero, not a fabricated
gap.

Two catalogue rows name contracts their tests do not assert, the same defect
class: widen T77 to name the `novel_format_version` stamp and the v1 migration
(`spec/appendices-reference.md:1542`), and T381 to name the
archive-over-archive refusal (`:1836`). Each widened row gets its asserting
case in the same phase — a `T77/REQ-092e` case in
`test-persistence-guardrails.ts` (no harness implements T77 today, so widening
the row alone would create the F-P4-9 defect in a new place) and
`T381/REQ-334b` cases in `test-persistence.ts` beside the existing T381 case
(`:414`). Appendix F is not one of the fingerprint-bearing sections (§5.9,
§5.16–17, §6.3, §6.4.2, §7.7, §5.19, Appendix Q), so `npm run assemble` is
required and `npm run build-order` is not, unless `check-fingerprint-sync`
reports otherwise.

**D9 — spec-text scope.** No §5.9 or §5.19 REQ body changes. One §5.6 body
change is in scope: REQ-232a's `gm_context` enumeration gains the `saved_beats`
field D6 adds, so the spec describes the object the code persists (REQ-232a is
not a fingerprint-bearing section). `DECISIONS.md` gains two entries in Phase 6:
(a) the `chain_invalid` migration outcome (D4); (b) `novel_format_version` is an
envelope stamp exempt from the §7.7 property group, like
`data_format`/`spec_version`/`_checksum` (Appendix T already declares that the
on-disk Novel field and the export `manifest` field carry the same value,
`spec/appendices-reference.md:3278`). If a phase discovers a genuine further
ambiguity, it records a third entry rather than rewriting a REQ.

## 4. Phases

### Phase 0 — baseline (complete)

Baseline captured in §1 and repeated in `aar.md`.

### Phase 1 — red probes

Write each new assertion before its fix and record the failure message.

- Archive: create `p4-archive`, archive it, re-create the same slug, archive
  again → the original archived file is currently replaced.
- Format: a fresh Novel's on-disk JSON has no `novel_format_version`; a v1
  fixture with `.audit.jsonl` does not migrate; a v3 fixture warns nothing.
- Corruption: a primary with no valid backup shows no `[corrupted-novel]`, no
  chain paths, and stderr names no path.
- Restore staleness: a backup carrying a pending workflow restores with
  `staleness_counter` unchanged.
- Combat: two full rounds append no `moment`.
- Drift: the warn text names no beat and no tool.
- Directive: the orientation lacks the eight category tokens.
- T470/T471/T475: the widened clauses fail on the current assertions.

### Phase 2 — persistence integrity (`holonovel/src/core/state.ts`)

D1, D3, D4-onwards (D4's decisions land here, its DECISIONS text in Phase 6).
Order: `markCorrupt` helper and its four call sites, then the archive guard,
then the restore-branch staleness call. Re-run the harness after each.

### Phase 3 — on-disk format version (`state.ts`, `index.ts`)

D2: constant, `NovelState.format_version`, serialize/stamp, `migrateNovelFormat`
and the `{novel, migrated}` return, the three call sites, `formatFuture`
surfacing (`data_health.format_future` and `[format-future]` in
`data_health.markers`), immediate save with the restore skip, and the export
manifest constant (`index.ts:11453`). Fixtures for v1-with-JSONL,
v1-without-JSONL, broken-chain, and v3 are written in the harness temp dir.

### Phase 4 — guardrail behaviour (`state.ts`, `index.ts`)

D5/D5a, D6, D7. Before editing, run the sibling-contract and file-surface
probes: `grep -n "state-drift\|manage_context (action: recap)"
spec/02-requirements.md` (REQ-072/401/403a/404 impose no conflicting recap
shape) and `grep -rn "data_health\|state_health\|Commit each narrated beat"
holonovel/scripts/*.ts` (today: `test-persistence.ts:523`,
`test-fingerprints.ts:289/574`, `test-limits.ts:307`,
`test-persistence-guardrails.ts`). Each hit is compatible or updated in the
same phase. The REQ-232a enumeration gains `saved_beats` in this phase
(D9); `npm run assemble` runs in Phase 5.

### Phase 5 — assertions and catalogue

D8 plus one case per new behaviour. Format-version, corruption, staleness,
combat, drift, and directive cases go to
`holonovel/scripts/test-persistence-guardrails.ts` (including the new
`T77/REQ-092e` case); the two `T381/REQ-334b` archive cases go to
`holonovel/scripts/test-persistence.ts` beside the existing T381 case (`:414`).
Case titles keep the `Tnnn/REQ-nnn` convention; no new catalogue ID is needed
because every affected REQ resolves to an existing row (T469–T476,
T77/T88/T156/T282, T381, T266). Fixtures are written under the harness temp
directory, never the repo. Then `npm run assemble` for the REQ-232a edit and
the two widened Appendix F rows.

### Phase 6 — registers, roadmap, changelog, decisions

- `spec/audit/review-register.md`: delete the
  `### 2026-11-09 full-review sweep — chunk P4 (persistence and §5.19)` heading
  from `## Scheduled-roadmap` (`:1829-1880`) and add one
  `### 2026-11-12 §5.9/§5.19 persistence remediation` block under
  `## Resolved` (the existing `### … chunk P4` at `:635` under Resolved is a
  different, earlier block — do not merge into it). Eight entries,
  `F-P4-2 … F-P4-9 — (resolved 2026-11-12)`, each with its current predicate
  and the exercising test. Leave the `## Closed-P3` chunk-P4 block (`:2367`,
  F-P4-10/11/12) untouched.
- `ROADMAP.md`: delete the §5.9/§5.19 section.
- `DECISIONS.md`: the two entries from D9.
- `npm run validate -- --write-register`; confirm the six REQ families stay
  bucket C.
- `CHANGELOG.md`: dated heading (`2026-11-12 — …`), bullets per fix group.
- `aar.md`: phases, red transcripts, final loop token.

## 5. Verification

| Step | Command | Pass signal |
|---|---|---|
| Harness | `npm --prefix holonovel run test:persistence-guardrails` | all cases pass, count recorded |
| Adjacent harness | `npm --prefix holonovel run test:persistence` | pass (T381 archive lifecyle) |
| Budget harness | `npm --prefix holonovel run test-output-contracts` | pass (T149 untouched) |
| Server types | `npm --prefix holonovel run typecheck` | clean |
| Root types | `npm run typecheck` | clean |
| Assemble | `npm run assemble` | spec rebuilt |
| Fast gate | `npm run check:fast` | `40 passed, 0 failed`, `check:fast: PASS` |
| Full gate | `npm run check` | 0 errors |
| Registers | `npm run check-registers`, `npm run check-roadmap` | pass |
| Coverage | `npm run validate -- --write-register` | REQ-092/224/334/400–406 bucket C |

Capture the un-piped exit code of `check:fast`; a piped run hides the aggregate
status.

## 6. Risks and mitigations

| Risk | Mitigation |
|---|---|
| The migration save rotates the backup chain of a freshly restored Novel | Skip when `restoredThisSession` holds the slug; assert `.bak.1` content in the restore test |
| The stamp re-enters state through `future_fields` and shifts the digest | Add it to `RESERVED_FUTURE_FIELDS` (`state.ts:2933`) and carry it in `novelToJSON`; a load-save-restart case asserts the digest survives |
| A v1 JSONL with a broken chain is deleted | D2/D4 never delete an unverified log; assert the file survives |
| `corruptData` shape change breaks T175 or `spec_health` consumers | D3 keeps slug → reason; detail and markers are additive |
| The longer drift text breaks the briefing budget or T472's phrase | Keep `Commit each narrated beat` verbatim; cap at five beats / 60 chars; keep the T469 budget leg |
| Two never-truncated lists drift | D7's single `PERSISTENCE_CATEGORY_TOKENS` table feeds both |
| `saved_beats` is new persisted state | It is a key inside the existing `gm_context` group (D6), documented in DECISIONS, not a §7.7 group |
| The archive refusal breaks an existing caller | No caller in `src/` archives twice; T381 gains the unarchive-then-re-archive happy path and the refusal case |
| Register line numbers drift again | Re-grep each predicate in Phase 6 |

## 7. Commit plan

One commit (`npm run session:close`) for the whole increment: server source,
harness, catalogue, register, roadmap, decisions, changelog. If the diff exceeds
roughly 300 lines, split by concern — (1) `state.ts` persistence integrity and
format version, (2) `index.ts` guardrail render surfaces, (3) harness and
catalogue, (4) registers and docs — four or fewer, each building.

## 7b. User impact and sizing

- **Restart:** none by hand; format migration runs on the next load.
- **Breaking:** one intended behaviour change — a second archive of the same
  slug is refused instead of silently deleting the first. `unarchive` first is
  the documented remedy.
- **Sizing:** L. `state.ts` (archive guard, corruption detail, format version,
  combat moment, drift beats) and `index.ts` (corruption call site, directive
  table, `spec_health`) are the two large surfaces; harness, catalogue and
  registers are S each. Rollback cost 2.
- **Version:** the CalVer bump and the spec-update narrative belong to the
  publication pipeline; the plan does not touch `package.json`.

## 8. Deliberately deferred

- Publishing (57 unpushed commits, last publish 2026-11-09): a push is explicit
  authorization and is not part of this plan; run `./scripts/push-pipeline.sh`
  separately when asked.
- F-P4-10/11/12 and the unscheduled §5.6/§5.4/trust-core sections: untouched.

## 9. Review record

- Cold pass 1 (`independent-review`, standard depth) returned three Blockers —
  REQ-400's nine-category count, D6's unsupported premise, D2's missing
  signature/plumbing — and seven Majors. The revision resolved them: the
  category table and token set are explicit (D7), the beat list is grounded in
  the save that opened the drift window (D6), the migration interface is named
  (D2/D4), marker placement is justified (D3), the shared recorder and table
  remove duplicate lists (D5a/D7), T470's setup and T471's substring are
  specified (D8), T381/T77 are widened, and the two DECISIONS entries are
  deliverables.
- Cold pass 2 (diff re-review) returned `independent-review passed.` with four
  conditions, now folded into the text: C1 the serializer emits only the
  on-disk `novel_format_version` key (D2); C2 `saved_beats` accumulates across
  the drift window and clears on a mutation (D6); C3 the widened T77 row gets
  a real `T77/REQ-092e` case (D8); C4 the new key is added to REQ-232a's
  enumeration, with `npm run assemble` in Phase 5 (D9). The soft flags are
  folded too: per-case file placement (Phase 5), the `session_no_mutation_windows`
  anchor (`:788`, `:2125`), the T149/T640 budget precedent (both exist in
  `test-output-contracts.ts:2207` and `test-lean-narrator.ts:144`), and the
  single-moment-per-event note (D5a).
