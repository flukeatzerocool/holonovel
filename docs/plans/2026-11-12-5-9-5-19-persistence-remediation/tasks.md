# Tasks — §5.9/§5.19 persistence remediation

Plan: `plan.md` (this directory). One commit, split by concern only if the diff
is large; `npm run session:close` at the end. Mark each item with its evidence
command or artifact when done.

## Phase 0 — baseline and preconditions

- [x] `npm run status`: 57 unpushed, 13 open roadmap items, version 2026.11.11.
- [x] `git status --short`: clean.
- [x] `npm run check:fast`: 40 passed, 0 failed, `check:fast: PASS`.
- [x] `npm --prefix holonovel run test:persistence-guardrails` baseline count
      recorded in `aar.md`.
- [x] Re-grep the eight predicates and confirm the register's line numbers have
      drifted (symbol anchors hold).

## Phase 1 — red probes

- [x] Archive-over-archive replaced the archived copy (F-P4-2).
- [x] `novel_format_version` absent; v1 JSONL not migrated; v3 silent
      (F-P4-5).
- [x] No `[corrupted-novel]`, no chain paths (F-P4-4).
- [x] Restore branch leaves `staleness_counter` unchanged (F-P4-8).
- [x] Two combat rounds append no `moment` (F-P4-3).
- [x] Warn text names no beat or tool; recap repeats the sentence (F-P4-6).
- [x] Directive lacks the eight omitted category tokens (F-P4-7).
- [x] Widened T470/T471/T475 clauses fail (F-P4-9).

## Phase 2 — persistence integrity (`holonovel/src/core/state.ts`)

- [x] `corruptDetail` map plus `markCorrupt(slug, reason, primaryPath)`; stderr
      lists primary and chain paths; `data_health.markers` carries
      `[corrupted-novel]`, `corrupted_detail` the chain.
- [x] Four call sites use it: `resumeNovel` catch, both hydration branches, and
      `TTRPG_NOVEL` startup activation (`index.ts`).
- [x] `archiveNovel` refuses when the archive target or a backup destination
      exists; message names the file and corrective action.
- [x] `resumeNovel` restore branch calls `checkWorkflowStaleness(loaded)`.

## Phase 3 — on-disk format version

- [x] `NOVEL_FORMAT_VERSION = 2`; `NovelState.format_version`;
      `novelToJSON` emits the on-disk `novel_format_version` key (only);
      export manifest uses the constant (`index.ts:11453`).
- [x] `novel_format_version` in `RESERVED_FUTURE_FIELDS`; load-save digest
      case.
- [x] `migrateNovelFormat(data, filePath): {migrated}` and
      `loadNovelFromData(data, filePath?): {novel, migrated}`; three call
      sites updated.
- [x] `< 2` JSONL adopt/verify/delete; broken chain keeps the JSONL, empty
      `audit_log`, `[migration-missing-audit]` reason `chain_invalid`; no JSONL
      records the marker; `> 2` records `formatFuture`.
- [x] `data_health.format_future` and `[format-future]` marker.
- [x] Immediate save on migration, skipped when `restoredThisSession` holds the
      slug.

## Phase 4 — guardrail behaviour

- [x] `appendStoryMoment` exported from `core/state.ts`; `index.ts`
      `recordStoryMoment` delegates; `advanceCombat` appends a `moment` on
      round increment when `novel.auto_record` and audits `auto-moment`.
- [x] `GMContext.saved_beats` populated by `save_context` from supplied beat
      keys only; accumulated across the drift window (reset when a save opens
      it), cleared by `recordMutation`.
- [x] REQ-232a enumeration gains `saved_beats`.
- [x] `stateDriftWarning` names up to five beats with committing tools; recap,
      switch/end responses, and block message share the formatter;
      `Commit each narrated beat` verbatim.
- [x] `PERSISTENCE_CATEGORY_TOKENS` table feeds both `### State persistence`
      and `### Persistence tools`; preserve `scene, action: set` and the six
      current families.
- [x] Run the sibling-contract and harness-surface greps before editing.

## Phase 5 — assertions and catalogue

- [x] `test-persistence.ts`: archive refusal and unarchive-then-re-archive
      (T381).
- [x] `test-persistence-guardrails.ts`: format stamp, v1-with-JSONL,
      v1-without-JSONL, broken-chain, v3 `[format-future]`, digest survival
      (`T77/REQ-092e`).
- [x] `test-persistence-guardrails.ts`: corruption marker, detail paths, stderr
      (T175/REQ-001a, REQ-092c/238).
- [x] `test-persistence-guardrails.ts`: restore staleness accounting (T266
      family/REQ-224a).
- [x] `test-persistence-guardrails.ts`: combat-round moment (T474/REQ-405).
- [x] `test-persistence-guardrails.ts`: warn-mode beat list and recap
      enumeration (T472/REQ-403b).
- [x] `test-persistence-guardrails.ts`: directive category tokens plus the
      `TTRPG_MAX_BRIEFING_TOKENS` leg (T469/REQ-400).
- [x] `test-persistence-guardrails.ts`: T470 timestamp + drift marker (with
      `save_context` setup); T471 session ID; T475 timestamp gap and
      unparseable-primary branch (F-P4-9).
- [x] Widen T77 and T381 catalogue rows; `npm run assemble`.
- [x] Pre-fix red output pasted into `aar.md`.

## Phase 6 — registers, roadmap, decisions, changelog

- [x] Delete the chunk-P4 heading from `## Scheduled-roadmap` (`:1829-1880`);
      add `### 2026-11-12 §5.9/§5.19 persistence remediation` under
      `## Resolved` with F-P4-2…F-P4-9 and current predicates; leave the
      `## Closed-P3` block (`:2367`) untouched.
- [x] `ROADMAP.md`: section removed; `npm run check-roadmap` green.
- [x] `DECISIONS.md`: `chain_invalid` outcome; `novel_format_version` envelope
      stamp exemption.
- [x] `npm run validate -- --write-register`; REQ-092/224/334/400–406 bucket C.
- [x] `CHANGELOG.md` dated entry.
- [x] `aar.md` finalized with `LOOP PAUSED`.

## Gates

- [x] `npm --prefix holonovel run test:persistence-guardrails`
- [x] `npm --prefix holonovel run test:persistence`
- [x] `npm --prefix holonovel run test:output-contracts`
- [x] `npm --prefix holonovel run typecheck`
- [x] `npm run typecheck`
- [x] `npm run assemble`
- [x] `npm run check:fast` (un-piped; `PASS` line)
- [x] `npm run check`
