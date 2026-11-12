# After-action report — §5.12 observer resolve and resource reads

Status: complete.
Plan: `plan.md` · Tasks: `tasks.md` · Independent review: `independent-review.md`

## Phase 0 — baseline (measured before any edit)

- `npm run assemble` → exit 0.
- `npm run check:fast` → 40 passed, 0 failed, `check:fast: PASS`.
- `npm --prefix holonovel run test:narrative` → 75 passed, 0 failed.
- `npm --prefix holonovel run test:competitive-gaps` → 30 passed, 0 failed.
- `grep -c 'requireNotObserver();' holonovel/src/index.ts` → 45.
- `npm run status` → 52 unpushed commits, 16 open roadmap items.
- `git status --porcelain` → empty (tracked tree).

## Phase 1 — probes (shipped behaviour)

Probe 1 (observer access): Novel `probe`, room `Vault`, thing `lantern`,
`character_01`, then `set_badge observer`:

```text
resolve:    [FORBIDDEN] Observer mode is read-only. Corrective action: switch badges with set_badge to interact.
visibility: [FORBIDDEN] Observer mode is read-only. Corrective action: switch badges with set_badge to interact.
audibility: [FORBIDDEN] Observer mode is read-only. Corrective action: switch badges with set_badge to interact.
room OBS:   ## Vault | A cold vault. |  | **You can see:** lantern. |  | **Exits:** north, south
thing OBS:  ## lantern | No description. |  | **Location:** vault
map OBS:    Vault: north → Vault, south → Vault
```

Probe 2 (resolution shape, Game Master): `visibility` without a target returned
`{"source":"character_01","room":"Throne Room","visible":["lantern"]}`;
`target: "lantern"` returned `{"can_see":true}`; `audibility` returned
`{"can_hear":true}`; a room name as target returned
`[NOT_FOUND] Target 'Throne Room' not found.`; `resolve` returned
`{"status":"resolved", …}`.

Probe 3 (resource URI form): `room://Throne%20Room` returned
`**You can see:** lantern (lantern, thing)` and `thing://lantern` returned
`**Kind:**`, `**Location:** Throne Room (lantern → Throne Room)`,
`**Properties:** …`; `room://throne_room` and `room://anteroom` returned
`{"error":"not found"}`. This invalidated the plan's literal `room://throne_room`
and produced the build-time delta recorded in `plan.revision-diff.md`.

## Phase 2 — implementation

- `holonovel/src/index.ts`: removed `requireNotObserver()` from the
  `visibility`/`audibility` branch and from `resolve`; the Player refusal and
  the Player point-of-view restriction are unchanged.
- `room-single` and `thing-single`: `isGM` now admits `observer`, so `room://`
  and `thing://` render at the same depth as `world://map`/`world://kinds`.
- No tool description, schema, or generated artifact changed:
  `git diff --stat -- holonovel/tool-definitions.json
  spec/audit/tool-surface-baseline.json` → empty.

## Phase 3 — harness evidence

- `holonovel/scripts/test-narrative.ts` T417 extended with resolve, targetless
  and targeted `visibility`, `audibility`, `room://Throne%20Room`,
  `thing://lantern`, and `world://map` assertions under the observer badge.
  `npm --prefix holonovel run test:narrative` → **75 passed, 0 failed**
  (case count unchanged).
- `holonovel/scripts/test-competitive-gaps.ts` T643's observer window extended
  with `resolve` and `visibility` on the ruleset-bound Novel.
  `npm --prefix holonovel run test:competitive-gaps` → **30 passed, 0 failed**
  (case count unchanged).

## Phase 4 — spec and register

- REQ-366b body: 694 characters, 4 sentences, `_Check:_ T417` added (was
  missing). Depth sentence: "World-model resource reads render at the observer's
  unfiltered state depth (REQ-305)."
- Appendix F T417 row widened with the resolve/query/resource clauses; T643 row
  widened and its REQ column extended to `REQ-309, REQ-196a, REQ-366b`.
- F-5.12-1 moved to `## Resolved` under a dated `### 2026-11-11 §5.12 observer
  resolve and resource reads` heading, with the predicate corrected.
- `ROADMAP.md` §5.12 section deleted; the next item is §5.10 parser tool-name
  drift.
- `check-registers:strict` → PASS; `check-roadmap` → OK (15 items + Non-goals).

## Phase 5 — bookkeeping

- CHANGELOG entry added as the first dated block.
- `npm run validate -- --write-register` → register written; REQ-366 row now
  cites `T417, T643`; buckets A 0, B 0, C 490, D 0, E 118; 0 errors.
- `npm run assemble` → spec hash `45ab4a58…`, build-phase-map hash updated.

## Phase 6 — verification

| Check | Result |
|---|---|
| `test:narrative` | 75 passed, 0 failed |
| `test:competitive-gaps` | 30 passed, 0 failed |
| `grep -c 'requireNotObserver();'` | 43 (baseline 45) |
| `grep -c 'isGM = .*observer'` | 2 |
| REQ-366b length | 694 (≤800) |
| T417 row clause | 1 hit |
| T643 REQ column | 1 hit |
| Generated surface diff | empty |
| `npm run assemble && npm run check:fast` | 40 passed, 0 failed, `check:fast: PASS` |
| `npm run validate:sdd` | 0 errors, 285 warnings |
| `npm run validate` | 0 errors |
| `npm run check-registers:strict` | PASS |
| `npm run check-roadmap` | OK |
| `npm run check-loop-artifacts` | PASS |
| `npm run typecheck` | 0 (part of check:fast) |

Anchor delta: the 21 `holonovel/src/index.ts` anchors resolve identically
before (`git show HEAD:holonovel/src/index.ts`) and after — `:12` OK, every
other anchor already stale at those line numbers. No new unresolved predicate.

## Condition follow-through

- C-1 (M1, hazard-annotation observer parity): the observer's
  `**Annotations:**` rendering on `room://` follows the same `isGM` predicate
  as the rest of the GM branch, but T417's fixture has no hazard annotation, so
  that specific line is not asserted here. REQ-622's annotation contract is
  asserted at GM depth by T741. Recorded as a soft gap, not claimed green.
- Build-time delta (room URI percent-encoding): amended in the plan, restamped,
  and verified by the T417 harness run.

`deployed: not applicable — no publication in scope`

LOOP PAUSED
