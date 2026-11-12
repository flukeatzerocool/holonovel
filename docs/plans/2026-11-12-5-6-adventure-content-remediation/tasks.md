# Tasks — §5.6 adventure content remediation

Derived from `plan.md` (sha256 `be3f4d00300e6f1efe72b84f7c8ecf9628c1311318b5c598201171d2c65e0f47`).
Each task names its design decision; a task is done when its verification line
in `plan.md` §6 is green.

## Phase 1 — red probes

- [x] T1.1 Write the server-side blocks: T59, T60, T61, T206, T287, T368 in
  `holonovel/scripts/test-adventure.ts`; T146/T207/T284/T285/T286/T305/T338 in
  `holonovel/scripts/test-output-contracts.ts` (D14). Record red output.
- [x] T1.2 After the build tool exists (T2.2), write T208/T209/T283 and observe
  them red for the missing behaviour, not a missing binary.

## Phase 2 — extractor and build index

- [x] T2.1 Add `holonovel/src/core/adventure.ts` (D1) and exercise it through
  `test:adventure`.
- [x] T2.2 Add `holonovel/scripts/generate-adventure-index.ts`, the two
  fixtures, the DECISIONS markers, and the npm scripts (D12).
  Verify `--check` twice and byte identity.
- [x] T2.3 Grep for an existing discovery/index check; add the root
  `check-adventure-index` script, wire `scripts/lib/gate-manifest.ts`, and
  regenerate the AGENTS gate table.

## Phase 3 — load

- [x] T3.1 Add `target` to the load schema and the codex branch; correct the
  tool description (D2).
- [x] T3.2 Add `novelSnapshot` and `prepopulateAdventure` on all three novel
  branches, duplicate skips, the summary, and the monster suggestion (D3).
- [x] T3.3 Add `TTRPG_ADVENTURE` file paths and the slug-enumerating
  `[NOT_FOUND]` (D13).

## Phase 4 — resources and catalog

- [x] T4.1 Add `adventure://{slug}/{anchor}` after the two specific templates,
  with generated anchors (D6).
- [x] T4.2 Rewrite overview and navigation on the extractor; fix the
  `[STATE_CONFLICT]` branch and both `[WARNING]` branches (D8).
- [x] T4.3 Apply the catalog filter and the `player_visible`/hook rule to
  `manage_adventure (action: list)` and `adventures://`; add the preview
  fallback; exclude `skipped` slugs (D7, D12).

## Phase 5 — briefing, search, transition

- [x] T5.1 Render the indexed and generated briefing blocks (D4).
- [x] T5.2 Merge adventure prose into ruleset search with the sort, tag, and
  source-anchor rules (D5).
- [x] T5.3 Include a waypoint change in the transition predicate; keep history
  and audit honest; correct the waypoint type (D9).

## Phase 6 — generated lifecycle and synthesis

- [x] T6.1 Emit the generated `## World`; materialize and track rooms; make
  `load` preserve generated content (D10).
- [x] T6.2 Route both load branches through the shared augmentation renderer;
  derive the adventure tag in `manage_synthesis (action: list)` (D11).

## Phase 7 — registers and generated surfaces

- [x] T7.1 Add REQ-171/REQ-172 dispositions in `scripts/validate.ts`; regenerate
  the coverage register; confirm buckets.
- [x] T7.2 Move F-P3B3-1…12 to `Resolved`; remove the ROADMAP section; add the
  CHANGELOG entry and DECISIONS notes.
- [x] T7.3 Regenerate `tool-definitions.json`, run `surface-budget --write`,
  refresh the DECISIONS budget lines, then `build-order`.
- [x] T7.4 Verify condition C-1 (the `player_visible` marker against the
  provenance parser and the embed round-trip).

## Phase 8 — gates

- [x] T8.1 Run the six harness suites, both typechecks, `check:fast`,
  `check-adventure-index`, `check-gate-table`, `surface-budget`, and the full
  `check` via `build-order`.
- [x] T8.2 Write `aar.md` with the red transcripts, deviations, C-1 result, and
  the terminal `LOOP PAUSED`.
