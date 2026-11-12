# Tasks — §5.20/§5.24 assertion repair (F-P5-7)

Plan: `plan.md` (this directory). One commit; `npm run session:close` at the end.
Mark each item with its evidence command or artifact when done.

## Phase 0 — baseline and preconditions

- [ ] `tasks.md` written; `aar.md` skeleton holds the baseline: 14 open roadmap
      items, clean tree, `check:fast` 40/40 PASS, `test:event-log` 12,
      `test:lean-narrator` 10, `test:competitive-gaps` 30.
- [ ] Re-grep every edited location and confirm F-P5-7 is the only open bullet
      and the only `Scheduled-roadmap` row for this section.

## Phase 1 — probe the shipped behaviour

- [ ] T640 matrix probe (four processes) shows the two override rows render the
      wrong variant pre-fix; transcript in `aar.md`.
- [ ] `TTRPG_MAX_BRIEFING_TOKENS` probe records the pre-fix threshold at which
      the token disappears.
- [ ] T545/T550/T712/T713/T727 pre-fix probes behave as the bodies say; any
      failure is recorded as a defect with its predicate, not absorbed.

## Phase 2 — T640 code fix (REQ-412a, REQ-135)

- [ ] `loopRole` reads `narrativeRole(novel) ?? "game_master"`.
- [ ] Orientation renders under `### Play loop` after `**Player-Detail:**`.
- [ ] `NEVER_TRUNCATED` gains `"play loop"`.

## Phase 3 — widen the assertions

- [ ] T545: restart continuity (`#1`, `#2` survive; `#3`, `#4` follow) and a
      fresh Novel reproducing `#1`, `#2`.
- [ ] T550: `source_ordinals` deep-equals `[1]` for an explicit
      `source_ordinal`, with `#2` present; range assertion kept.
- [ ] T712: session-identity and wall-clock exclusion assertion.
- [ ] T713: injected unhashed and older-projection entries; `unhashed events:
      1`, `historical event hashes: 1`, `recorded state hash at #2: [unhashed]`,
      `verify` still clean.
- [ ] T640: counterpart matrix, two override rows, and the 150-token budget case
      with a later `[truncated` section.
- [ ] T727: manual-selection clear on a real transition; export, clone, and
      checkpoint preservation of cast state.
- [ ] Pre-fix red output for the T640 override rows and budget case pasted into
      `aar.md`.

## Phase 4 — catalogue rows

- [ ] `spec/appendices-reference.md` T545, T550, T640, T712, T713, T727 carry
      the D7 clauses, one physical line each.

## Phase 5 — registers and roadmap

- [ ] F-P5-7 moved to `## Resolved` with corrected post-change predicates and
      exercising harnesses; `Scheduled-roadmap` row removed.
- [ ] `ROADMAP.md` section deleted; `npm run check-roadmap` and
      `npm run check-registers:strict` pass.

## Phase 6 — regeneration and bookkeeping

- [ ] `npm run validate -- --write-register`.
- [ ] `npm run assemble`.
- [ ] `CHANGELOG.md` first entry `## 2026-11-11 — §5.20/§5.24 assertion repair`.
- [ ] `npm run build-order`; `git diff` empty for
      `holonovel/src/generated/contract-fingerprints.ts` and
      `spec/02-requirements.md`.
- [ ] `aar.md` completed with the verification table and `LOOP PAUSED`.

## Phase 7 — verify and commit

- [ ] §6 verification table run in order; every row matches.
- [ ] `npm run session:close`; `git status --porcelain` empty.
