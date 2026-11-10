# After-Action Report — §5.2/§5.8 behaviour remediation

Date: 2026-11-09 · Increment: `docs/plans/2026-11-09-p7b-remediation/`

## What was attempted

Implement the eight behaviours the prior assertion-repair session proved absent
(F-P7b-1…-7 and -9) and close the findings with harness evidence.

## What shipped

- **Commit 1 (`aab67be`)** — story-journal entity attribution with append-only
  undo semantics and recap surfacing (T282); a triggered `### Lore` briefing
  section with sticky decay, presence gating, `[world]` tags, a
  `TTRPG_MAX_LORE_TOKENS` budget reported in `spec_health`, the
  `lore://groups` resource, and structured `manage_lore (action: suggest)`
  rows (T67, T79, T81, T82, T83); a `### Known Information` sheet section
  (T274).
- **Commit 2 (`3b05c2c`)** — per-item `collected_at`, rendered
  `[supplementary] [MEDIUM|LOW]` tags with LOW ordering, Novel-derived
  MEDIUM/LOW synthesis items, adventure-load synthesis reporting with the
  inert-community prompt, and the Appendix F T63 correction (T63, T95, T97,
  T102, T288, T325).
- **Commit 3 (`233a8fd`)** — an open scene-type catalog with `[NOT_FOUND]`
  enumeration, independent action families, spell-slot-gated `Cast` actions,
  and an empty `suggest` result for unmatched intents (T135, T71, T359, T68).
  Tool definitions and the surface-budget baseline were regenerated.
- **Commit 4** — a dynamic generation-table enum in `tools/list` and the
  no-tables message on the roll path, with a seeded-package fixture (T255,
  T255b).

Registers: all nine P7b findings `Resolved`; the roadmap section retires; the
coverage register regenerates with 0 bucket-A gaps.

## What went right

- Probe-first evidence from the previous increment gave every change a
  `file:line` starting point; no speculative edits.
- Each commit was independently gated (`test:backfill` grew 82 → 94 passing
  assertions; `test:narrative` 75; `test:output-contracts` 355).
- Existing harnesses caught real regressions early: T342 (GM lore visibility),
  T96 (suggest fallback), and the T69/T327 badge cascade were all fixed before
  landing.

## What went wrong

- The plan gate needed two cold passes plus post-cap textual fixes; the
  re-review cap was reached before the last two blockers were closed.
- Roadmap edits corrupted the header once (an HTML-comment `## Non-goals`
  anchor matched before the section), caught by inspection and repaired.
- `build-order` failed after commit 2's first attempt because the roadmap
  dropped the REQ-084 tokens a scheduled finding still cited; the commit was
  amended after `check-registers` turned green.
- One test-only detour: the adventure-load synthesis lines were only emitted
  on the world-section branch, so the no-world path needed the helper too.

## Recommendations

- The next roadmap item comes from `ROADMAP.md`; none of this AAR's notes are
  open work.

LOOP PAUSED
