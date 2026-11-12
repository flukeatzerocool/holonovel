# Stage 5 — readiness (cold, first run and re-audit)

Reviewer: two fresh `review` subagents · artifact sha256 52412d61… (first run)
and 450c2c42… (re-audit)

First run: **NO-GO** — 2 Blockers (D5's injection procedure omitted the
`writeFileSync` step; T550's `evidence` request/response shape and the entity
premise were unstated) plus 6 Majors (bar 4 vs bar 8 budget value; truncation
assertion unstated; `select`/`reason` literals uncited; export field names
uncited; report field types unpinned; `projection_stale` undefined; grep
baseline uncited).

All fixed before the re-audit:

- D5 now numbers create → lookup → read → checksum → **write** → verify, names
  `dir`/`file`/`payload`, and places the flow after T713's `kill`.
- D2 states `manage_belief (action: evidence, entity_id)` returns a JSON array
  and asserts `JSON.parse(text)[0].source_ordinals`, with `admit` not requiring
  an existing entity (T552 precedent).
- Done bar 4 uses the measured budget X; D3/D4 pin the two assertion strings.
- D6 cites `select` (`index.ts:6714`), the cast store (`:6917`), `reason =
  "manual"` (`:6943`), the `social_cast` shape (`state.ts:737`), and the export
  accessor `JSON.parse(text).data.novel.social_cast`.
- D5a cites `StateVerifyReport` for the field types and defines
  `projection_stale` as the save-time digest's projection only.
- The grep baseline cites both call sites (`:15039`, `:15438`).

Re-audit: **NO-GO** — 2 Blockers (B1: a single T640 `test()` case cannot yield
seven separate red observations because the harness aborts a case on the first
failed assert, and splitting cases breaks the fixed count; B2: the plan asserted
`**Play loop:**` without quoting the emitter) plus Majors (per-row assertions
missing; the budget call site uncited; the `reason` literal uncited; the export
accessor and a decision gate; the T545 fresh-run leg tautological; done bar 9's
"one-line" judgement).

All fixed after the re-audit:

- T640 becomes seven `test()` cases (six matrix + budget) and the harness count
  moves 10 → 16; the per-case assertions are named by row.
- The `**Play loop:**` label is quoted from `composeBadgeOrientation`, and the
  budget call site (`index.ts:15421`) is cited.
- The T545 fresh-run leg is labelled a regression guard, not red proof.
- Done bar 9 is a stop-always rule; the budget search is one rule (downward in
  50-character steps, first absent X).
- The export accessor, the `reason` literal, and the injection imports are
  named.

Per the skill's cap, Stage 5 was **not** run a third time after the second
failure; the remaining blockers are fixed in the artifact but unverified by a
cold reader. This is escalated to the user.
