# Tasks — §5.20 staging order source and AI-role turn handoff

Increment: `docs/plans/2026-11-11-5-20-staging-order-turn-role/`
Plan: `plan.md` · AAR: `aar.md`
Status: complete (2026-11-11)

## Phase 0 — baseline and predicate confirmation

- [x] 0.1 Record the measured baseline in `aar.md`: `check:fast` 40/40 PASS,
      `test:backfill` 105/105, `test:competitive-gaps` 30/30, clean tree,
      54 unpushed commits, 15 open roadmap items, version `2026.11.11`.
- [x] 0.2 Re-grep the edited locations and confirm they still match the plan:
      `holonovel/src/index.ts:6696-6726`, `:6909-6941`, `:7311`,
      `:15013-15033`; `spec/02-requirements.md:4119`, `:4122`;
      `spec/appendices-reference.md:1498`, `:2199`;
      `spec/audit/review-register.md:1775-1798`.
- [x] 0.3 Confirm F-P5-5 and F-P5-6 are the only `Scheduled-roadmap` rows naming
      the §5.20/§5.24 section, and that F-P5-7 is the remainder.

## Phase 1 — probe

- [x] 1.1 Probe the shipped `list` behaviour: three NPCs,
      `manage_staging { action: "cast", strategy: "list", order: [...] }`;
      record whether `order` is rejected or ignored and confirm selection is
      insertion order.
- [x] 1.2 Probe the seven-row handoff matrix (badge × `TTRPG_AI_ROLE`, one
      process per override); confirm the two rows the plan expects to change.
- [x] 1.3 Copy both transcripts into `aar.md`; stop and report if a predicate
      already holds.

## Phase 2 — GM order source (F-P5-5)

- [x] 2.1 Add `order: z.array(z.string()).optional()` to `MANAGE_SCENE_SCHEMA`
      beside `strategy`/`select`.
- [x] 2.2 Add `"order"` to `MANAGE_SCENE_STAGING_PARAMS` (`:6686`) and to the
      `manage_staging` `pickParams` list; extend its description sentence with
      the `list` order.
- [x] 2.3 Store `cast.order = args.order` in the `cast` branch when supplied,
      and add `order: cast.order` to the `set_scene_cast` audit payload.
- [x] 2.4 Order the `next_speaker` `list` selection by `cast.order ?? []` first,
      then insertion order; keep mute/force precedence; comment REQ-612.
- [x] 2.5 Regenerate `holonovel/tool-definitions.json`; confirm the diff touches
      `manage_staging` only (`manage_scene` byte-identical).
- [x] 2.6 Run the parameter's surface gates: `check-tool-surface`,
      `surface-replay` (re-record only if stale), `action-conflicts -- --check`,
      `check-tool-definitions-sync`; record results in `aar.md`.

## Phase 3 — AI-role handoff (F-P5-6)

- [x] 3.1 Replace the badge-keyed block at `holonovel/src/index.ts:15013-15023`
      with the `narrativeRole(novel)` form: `badge !== "none"` short-circuit,
      invite branch guarded by REQ-412's WHEN clause, hand-back branch on the
      AI-Player role; keep both directive texts verbatim.
- [x] 3.2 Comment the block with REQ-412, REQ-304, and the REQ-598 resolver.

## Phase 4 — harness

- [x] 4.1 Extend T482 (`holonovel/scripts/test-backfill.ts:1250-1255`): invite
      and hand-back under counterpart, the three override cases (Player badge +
      AI player, Observer badge + AI player, Game Master badge + AI game_master
      → no section), and the `TTRPG_MAX_BRIEFING_TOKENS=400` case; spawn
      override processes with `boot({ TTRPG_AI_ROLE: … })` and kill them in
      `finally`.
- [x] 4.2 Extend T728 (`holonovel/scripts/test-competitive-gaps.ts:609-614`):
      `after_user: true` reset, declared order sequence, wrap, unknown-id skip,
      muted-head skip, force precedence, `reason` values.
- [x] 4.3 Run both extensions on the pre-fix tree and paste the failure output
      into `aar.md` (red proof).
- [x] 4.4 Run both harnesses after the fix: `test:backfill` 105/105,
      `test:competitive-gaps` 30/30.

## Phase 5 — normative and catalogue surfaces

- [x] 5.1 Replace REQ-611 (`spec/02-requirements.md:4119`) with the pinned
      draft (747 chars) and REQ-612 (`:4122`) with the pinned draft (726 chars),
      each one physical line.
- [x] 5.2 Append the order setter and ignore clause to the T728 row
      (`spec/appendices-reference.md:2199`), and the Game Master badge with
      `TTRPG_AI_ROLE=game_master` no-directive case to the T482 row (`:1498`).
- [x] 5.3 Move F-P5-5 and F-P5-6 into a dated `Resolved` group with corrected
      predicates; retarget the F-P5-7 row to the retitled roadmap section.
- [x] 5.4 Replace `ROADMAP.md:28-39` with
      `## §5.20/§5.24 assertion repair (P1)` carrying only the F-P5-7 bullet.

## Phase 6 — regeneration and bookkeeping

- [x] 6.1 `npm run surface-budget -- --write`; update the `DECISIONS.md`
      recorded budget lines from `npm run surface-budget -- --json`.
- [x] 6.2 `npm run validate -- --write-register`; confirm REQ-611/REQ-612 still
      resolve against T727/T728.
- [x] 6.3 `npm run assemble`; add the CHANGELOG entry.
- [x] 6.4 `npm run build-order` (assemble, full `check`, propagate,
      source-propagate, typecheck, version sync; REQ-107a).
- [x] 6.4 Complete `tasks.md` and `aar.md` (probe transcripts, red output,
      fingerprint-unchanged diff, handoff matrix, `deployed: not applicable`).

## Phase 7 — verify and commit

- [x] 7.1 Run the §6 verification table in order; capture un-piped exit codes.
- [x] 7.2 Confirm `holonovel/src/generated/contract-fingerprints.ts` is
      unchanged; if it moved, stop and amend the plan.
- [x] 7.3 `npm run session:close`; confirm `git status --porcelain` is empty.
