# AAR — §5.20/§5.24 assertion repair (F-P5-7)

Status: complete · Increment: `docs/plans/2026-11-11-5-20-5-24-assertion-repair/`

## Phase 0 — baseline

- `npm run status`: 56 unpushed commits, 14 open roadmap items.
- `git status --porcelain`: only this increment directory (untracked).
- `npm run check:fast`: 40 passed, 0 failed, `check:fast: PASS`.
- `npm --prefix holonovel run test:event-log`: 12 passed, 0 failed.
- `npm --prefix holonovel run test:lean-narrator`: 10 passed, 0 failed.
- `npm --prefix holonovel run test:competitive-gaps`: 30 passed, 0 failed.
- `npm run check-registers`: PASS (133 grandfathered INFO rows).
- Register rows to move: F-P5-7 (`spec/audit/review-register.md:1809`, the only
  body of its `### … chunk P5` group) and `ROADMAP.md:15-23`.

## Phase 1 — probes (throwaway `/tmp/opencode/probe-assertion-repair.ts`)

Trust boundary: tool output from a local host; no web or user content.

- **T640 matrix**: rows 1–3 (counterpart, no env) rendered the expected variant;
  rows 4–6 (AI-role override under Game-Master, Player, and Editor badges)
  rendered the wrong variant — the red cases.
- **T640 budget**: token present at 400/350/300/250, absent at 200/150/100. The
  plan's 150 is red pre-fix, so no threshold search was needed.
- **T545**: after a restart the retained `#1`/`#2` survived, `replay (to_event:
  2)` returned both, `#3`/`#4` continued, and a fresh Novel reproduced `#1`/`#2`.
- **T550**: `evidence` returned a JSON array with `source_ordinals: [1]` for an
  admission citing ordinal 1 while `#2` existed.
- **T712**: differing `active_session_id`/`last_mutation_at` left the digest
  equal; a changed field changed it.
- **T713**: the injected save reported `unhashed events: 1`, `historical event
  hashes: 1`, and `replay #2: [unhashed]`, but the status line said
  `State verification: clean` — the REQ-603 defect D5a predicted.
- **T727**: manual selection returned `Ben`, a scene transition returned `Ann`
  with `reason: "manual"`; export, clone, and checkpoint restore all preserved
  `strategy`, `order`, and `muted`.

## Phase 2/3 — widened assertions and pre-fix red

With the assertions widened and **no** `src/index.ts` change:

- `test:event-log`: 11 passed, **1 failed** — `T713 status claimed clean beside
  an unhashed entry: [OK] State verification: clean`.
- `test:lean-narrator`: 12 passed, **4 failed** — the three T640 override cases
  (AI-Game-Master under a Game-Master badge; AI-Player under a Player badge;
  AI-Player under the Editor badge) and the 150-character budget case.
- `test:competitive-gaps`: 30 passed, 0 failed — the T545/T550/T712/T727
  additions are regression guards and passed pre-fix as designed.

## Phase 4 — code fixes

- `loopRole` now reads `narrativeRole(novel) ?? "game_master"`
  (`holonovel/src/index.ts:14963`) — the same REQ-598 resolver the turn handoff
  uses; the phantom `novel.ai_role` fallback and the badge-keyed expression are
  gone.
- The orientation renders under `### Play loop` after `**Player-Detail:**`, and
  `NEVER_TRUNCATED` carries `"play loop"` (`:3175`), so REQ-135b's tier 1 is
  implemented rather than positional.
- The `verify` status no longer claims `clean` while entries or checkpoints are
  unhashed: `clean` requires zero unhashed events and zero unhashed checkpoints,
  otherwise the status names the combined count (`:10696-10703`). The `clean`
  field keeps its digest-agreement meaning.

Post-fix: `test:event-log` 12/0, `test:lean-narrator` **16/0** (10 − 1 + 7),
`test:competitive-gaps` 30/0, `test:persistence` 45/0 (D5a collateral).

## Phase 5 — catalogue rows

Six Appendix F rows gained the widened clauses (T545, T550, T640, T712, T713,
T727). No `spec/02-requirements.md` line changed
(`git diff --stat -- spec/02-requirements.md` empty), so the §5.24 data-format
fingerprint did not move (`git diff --stat --
holonovel/src/generated/contract-fingerprints.ts` empty after `build-order`).

## Phase 6 — registers and roadmap

- F-P5-7 moved to `## Resolved` under `### 2026-11-11 §5.20/§5.24 assertion
  repair`, with predicates re-grepped on the edited tree
  (`test-event-log.ts:33`, `:165`, `:190`, `:204`;
  `test-lean-narrator.ts:122`; `test-competitive-gaps.ts:588`, `:704`).
- The emptied `### … chunk P5` heading was deleted with the bullet.
- `ROADMAP.md` retires the section; `check-roadmap` passes (13 work items +
  Non-goals), `check-registers:strict` passes.

## Phase 7 — regeneration

- `npm run validate -- --write-register`: bucket A 0, B 0, C 490, E 118; no
  register diff (the six test IDs are unchanged).
- `npm run assemble`: `holonovel.md`, `holonovel/holonovel.md`, and the
  build-phase-map content hash (`e3f71465…`).
- `npm run build-order`: complete, exit 0, 0 errors; propagate/typecheck/version
  steps OK, no version bump.

## Phase 8 — verification

| Check | Command | Result |
|---|---|---|
| Event-log harness | `test:event-log` | 12 passed, 0 failed |
| Role/budget harness | `test:lean-narrator` | 16 passed, 0 failed |
| Cast harness | `test:competitive-gaps` | 30 passed, 0 failed |
| Persistence harness | `test:persistence` | 45 passed, 0 failed |
| Role resolver count | `grep -c "narrativeRole(novel)"` | 3 (baseline 2) |
| Tier-1 registration | `grep -c '"play loop"'` | 1 |
| Clean-status assertions | `grep -c "State verification: clean"` | 2 (both hash-only fixtures) |
| No REQ body edit | `git diff --stat -- spec/02-requirements.md` | empty |
| Fingerprint | `git diff --stat -- …/contract-fingerprints.ts` | empty |
| Assemble + gates | `npm run assemble && npm run check:fast` | `check:fast: PASS` (40/40) |
| Strict validation | `npm run validate:sdd` | 0 errors, 286 warnings |
| Build order | `npm run build-order` | exit 0 |
| Register hygiene | `check-registers:strict` | PASS |
| Roadmap admission | `check-roadmap` | PASS |

## Deviations from the plan

1. **Budget threshold**: the plan allowed a measured X below 150; 150 was
   already red pre-fix (token absent at 200 and below), so the case keeps 150.
   No search was performed.
2. **T640 case count**: seven `test()` cases raised the harness 10 → 16, as the
   revised plan states.
3. **REQ-603 register row**: the generated coverage table still binds REQ-603 to
   T714 only. The unhashed-status clause is asserted by T713, but binding it in
   the table would require editing REQ-603's `_Check:_` in §5.24 — a data-format
   fingerprint source the plan forbids. The cross-coverage is recorded in the
   F-P5-7 resolved bullet instead. Recorded, not a defect.
4. **T545 fresh-run leg** is a regression guard, not red proof (a per-Novel
   counter starts at `#1` by construction); the restart and replay legs carry
   the evidence.

## Loop

Gates green, no open P0, the one P1 discovered (REQ-603's status claim) fixed
in-session, coverage bucket A = 0, and the roadmap section retired. No new
action items.

LOOP PAUSED
