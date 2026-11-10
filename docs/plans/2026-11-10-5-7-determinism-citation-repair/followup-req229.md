# Plan (minimal) — restore the REQ-229c linkage wording

Follow-up to `docs/plans/2026-11-10-5-7-determinism-citation-repair/`.
Kind: minimal (single reversible source change).

## Objective

Fix the pre-existing `test:output-contracts` failure
`T305/REQ-229: load_adventure synthesis augmentation section`, which expected
`Synthesis found` and got `Synthesis: 1 item(s) active …`.

## Root cause

Commit `3b05c2c` reworded the load-response match line to
`Synthesis: N item(s) active for this adventure (M lore template(s) …)` without
updating REQ-229c, which quotes the earlier string verbatim
(`spec/02-requirements.md:1989-1991`). The server drifted from its contract; the
test was correct.

## Change

`holonovel/src/index.ts`, world-model load branch: restore the REQ-229c string
`Synthesis found ${synthVoice} voice examples for adventure NPCs, ${synthLore}
lore templates for adventure locations. Review at \`synthesis://status\`.`

Unchanged: the community-inert line (`Community synthesis items: N inert — …`),
the no-world branch, and T288's assertions.

## Verification

- `npm --prefix holonovel run test:output-contracts` → 355 passed, 0 failed.
- `npm --prefix holonovel run test:backfill` → 99 passed, 0 failed (T288).
- `npm run check:fast` → PASS.

## Scope and rollback

Three files: the source line, `CHANGELOG.md`, and the increment AAR follow-up.
Rollback cost 1 (`git revert`).
