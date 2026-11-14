# Tasks — Briefing section ordering (F-S3) + live `briefing_order`

Dependency order. `[ ]` = open. Each task names its verification.

## Phase 0 — baseline

- [x] 0.1 Run `npm run check:fast` un-piped; record the exit code and the
      `41 passed, 0 failed` / `check:fast: PASS` trailer.
- [x] 0.2 Confirm the P0 predicate: `grep -rn "briefing_order" holonovel/src`
      yields only the write at `index.ts:11985`, tool descriptions, and the
      synthesis module — no render read.
- [x] 0.3 Before-state GM render order (recorded from `index.ts:17168-17724`):

      Play loop, (scene header), Adventure Scene, ## Adventure,
      ## Generated Adventure, Party, Combat, NPCs (depth), campaign memory,
      subjective memory, Beat, Active entity, Vehicle, Available Actions,
      Player Intent, Turn handoff, Badge boundary, Anti-slop guidance,
      Narrative tone, Narrative directive, Narration contract, Synthesis,
      Server guidance, Boundaries, Player signals, Novel Setup, Point of view,
      Who They Are, Personality, Autonomy, Player Tools | GM State (+ State
      persistence, state_ledger, Persistence tools, Story beats,
      Narrative threads, ## World in Motion, Story journal), Notes, Lore,
      Knowledge state, intro pointer, Briefing consistency

- [x] 0.4 Measure HEAD body lengths for REQ-109c2 / 109d / 109e with the
      validator's measurement; re-measure after editing (C-3).

## Phase 1 — spec amendments

- [x] 1.1 REQ-109d (`spec/02-requirements.md:1329-1330`): within-layer wording +
      DECISIONS default-order pointer. Verify ≤ 800 chars, ≤ 8 sentences.
- [x] 1.2 REQ-109c2 (`:1323-1324`): who-they-are heads the supplementary layer.
      Verify ≤ 800 chars, ≤ 8 sentences.
- [x] 1.3 T109 row (`spec/appendices-reference.md:1581`): drop the F-S3
      deviation sentence; add the ordering clause (15 critical groups in
      relative order, all before every supplementary group; Player render =
      relative order among rendered sections).
- [x] 1.4 `npm run assemble && npm run validate` green.

## Phase 2 — registry and canonical order

- [x] 2.1 Extract section bodies into `render*` helpers (pure move: same text,
      same badge gate, same `mutate` guard, REQ comment kept with its section).
- [x] 2.2 Add `BRIEFING_SECTIONS` (39 entries), `BRIEFING_BY_TOKEN`, and
      `BriefingCtx { novel, badge, entity, mutate }`.
- [x] 2.3 Emit via one loop; identity header first and untokenized; two footers
      after the loop.
- [x] 2.4 Before/after rendered-briefing diff on the T109 fixture: order-only;
      every body and gate byte-identical.
- [x] 2.5 `test:briefing`, `test:output-contracts`, `test:backfill` green.

## Phase 3 — the override orders

- [x] 3.1 `VALID_TOKENS` derived from the registry (`index.ts:11980`).
- [x] 3.2 `spec_health.section_tokens` derived from the registry with `token`,
      `group`, `has_content` (`:15106-15119`).
- [x] 3.3 Composer applies `novel.briefing_order` (order + omission; `[]` =
      default; unknown = `[INVALID_INPUT]`).
- [x] 3.4 `holonovel/DECISIONS.md`: dated 39-row token → group → order record,
      the three spec resolutions, the omission rule, the truncation consequence.
- [x] 3.5 `test-briefing.ts` T109 ordering legs.
- [x] 3.6 `test-backfill.ts` T66 rewritten to all seven Appendix F legs,
      including the absent-feature empty-section leg.
- [x] 3.7 `test-output-contracts.ts` T225 fields + exact enumeration equality.

## Phase 4 — intro pointer and truncation

- [x] 4.1 Move the intro pointer after `applyPromptBudget` (`index.ts:17723-17727`).
- [x] 4.2 Update the `NEVER_TRUNCATED` comment (`:3755`) and retire or document
      the dead `"intro"` member (`:3767`).
- [x] 4.3 `test-output-contracts.ts` T149: intro pointer survives `600`; plus the
      layer leg (critical marker survives, non-protected supplementary marker
      `[truncated]`).

## Phase 5 — registers, bookkeeping, gates

- [x] 5.1 `spec/audit/review-register.md`: F-S3 → `## Resolved`; add F-S4
      (REQ-281b Player clause, `index.ts:17649-17656`, T330 GM-only) under
      `## Scheduled-roadmap`.
- [x] 5.2 `ROADMAP.md`: remove § *Briefing section ordering (P1)*; add
      § *Player narrative threads (P1)* with 1–3 bullets + `**Trigger:**`.
- [x] 5.3 `npm run validate -- --write-register`.
- [x] 5.4 `CHANGELOG.md` dated entry (spec / server / harnesses / docs).
- [ ] 5.5 `npm run build-order` (assembles, propagates the spec copy, prints the
      check summary) then `npm --prefix holonovel run test:all`.
- [ ] 5.6 Stage the increment directory, write `aar.md` ending `LOOP PAUSED`,
      `npm run session:close`.

## Fixed buffers

- Body budgets measured post-edit: REQ-109c2 (HEAD 541 chars / 5 sentences),
  REQ-109d (324 / 3). REQ-109e is not edited (HEAD ≈773 / 6).
- Safe positional assertions: `test-briefing.ts:136-139` and
  `test-backfill.ts:1533` lift `### Turn handoff` to the next heading;
  `test-output-contracts.ts:1549-1550` compares `## Adventure` with
  `## Generated Adventure`.
- Never-truncated set (`index.ts:3766`): `badge boundary`, `turn handoff`,
  `play loop`, `intro`, `state persistence`, `state_ledger`,
  `persistence tools`, `player signals` — the T149 layer leg must use
  non-protected supplementary markers (`synthesis`, `server_guidance`).
