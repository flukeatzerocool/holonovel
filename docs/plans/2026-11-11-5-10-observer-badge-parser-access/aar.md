# After-action report — §5.10 observer badge parser access

Status: complete.
Plan: `plan.md` · Tasks: `tasks.md` · Independent review: `independent-review.md`

## Baseline (before the first edit)

| Command | Result |
|---|---|
| `npm run status` | 51 unpushed commits, 16 open roadmap items, version 2026.11.11 |
| `npm run check:fast` | 40 passed, 0 failed, `check:fast: PASS` |
| `npm --prefix holonovel run test:backfill` | 104 passed, 0 failed |
| `npm --prefix holonovel run test:competitive-gaps` | 30 passed, 0 failed |
| `npm --prefix holonovel run test:output-contracts` | 390 passed, 0 failed |
| `grep -c "state.saveNovel(novel)" holonovel/src/index.ts` | 193 |
| `npm run check-registers` | PASS, 133 grandfathered findings |

## Phase 1 probe (trust boundary: tool-output)

Probe: `/tmp/opencode/observer-probe2.mts` (uncommitted). Boots the real server
over MCP stdio with a temp `TTRPG_DATA_DIR`; Case B seeds the `probe-percept`
package before boot so the ruleset registry loads it.

Captured output (trimmed to the responses):

```
=== CASE A: ruleset-free, observer ===
--- look ---      [FORBIDDEN] Observer mode is read-only. Corrective action: switch badges with set_badge to interact.
--- inventory --- [FORBIDDEN] Observer mode is read-only. ...
--- go north ---  [FORBIDDEN] Observer mode is read-only. ...
--- take lamp --- [FORBIDDEN] Observer mode is read-only. ...
--- brief ---     [OK] Description mode: brief (room name + exits only).
--- metadata.modified ---
before=2026-11-11T22:34:21.766Z
after =2026-11-11T22:34:21.770Z
changed=true

=== CASE B: ruleset-bound, observer ===
--- bind ---       [OK] Novel 'probe-bound' bound to ruleset 'probe-percept'.
--- look ---       [FORBIDDEN] Observer mode is read-only. ...
--- i ---          [FORBIDDEN] Observer mode is read-only. ...
--- go north ---   [FORBIDDEN] Observer mode is read-only. ...
--- resolve look --- [FORBIDDEN] Observer mode is read-only. ...
--- visibility --- [FORBIDDEN] Observer mode is read-only. ...
```

Conclusions: all three plan assumptions hold. The parser gate refuses the
observer on both Novel types (F-5.10-2 and the REQ-366b parser clause), the
resolve/visibility paths refuse it too (scheduled F-5.12-1), and `brief`
mutates persisted metadata (the pre-gate write defect).

## Execution log

| Step | Files | Command / evidence | Result |
|---|---|---|---|
| 2.1 read-only predicate | `holonovel/src/index.ts:4966-4986` | `grep -c observerReadOnly` → 3 | `observerReadOnly` folded into `readOnlyBadge`; ruleset-free `requireNotObserver()` deleted; snapshot and `allowedVerbs` follow the predicate |
| 2.2 description-mode write | `holonovel/src/index.ts:4937-4940` | `grep -c state.saveNovel(novel)` → 190 (baseline 193) | `brief`/`verbose`/`normal` persist nothing |
| 2.3 description text | `holonovel/src/index.ts:4775` | `npm run check-tool-definitions-sync` → in sync | description names Player and Observer |
| 2.4 surface record | `holonovel/tool-definitions.json`, `spec/audit/tool-surface-baseline.json`, `holonovel/DECISIONS.md:9` | `npm run surface-budget` → PASS (full 28,585; standard 24,987; small 1,180) | regenerated; recorded header advanced by 3 tokens each |
| 3.1 T353 case | `holonovel/scripts/test-backfill.ts` | `npm --prefix holonovel run test:backfill` → 105 passed | ruleset-free observer resolves `look`/`inventory`, refused `go north`/`take` |
| 3.2 T643 window | `holonovel/scripts/test-competitive-gaps.ts` | `npm --prefix holonovel run test:competitive-gaps` → 30 passed | ruleset-bound observer resolves `look`/`i`, refused `go north` |
| 3.3 description-mode guard | `holonovel/scripts/test-output-contracts.ts` (unchanged) | `test:output-contracts` → 390 passed | T240 still green after the save removal |
| 4.1 REQ-196a | `spec/02-requirements.md:3243` | `wc -m` → 754; `validate:sdd` → 0 errors | observer admitted on a ruleset-free Novel |
| 4.2 REQ-309b | `spec/02-requirements.md:3415` | `wc -m` → 798; no REQ-309b warnings | observer exception named |
| 4.3 Appendix F | `spec/appendices-reference.md:1779`, `:2061` | grep rows → 1/1 | T353 and T643 widened |
| 4.4 register | `spec/audit/review-register.md` | `npm run check-registers` → PASS | F-5.10-2 Resolved; F-5.12-1 scheduled |
| 4.5 roadmap | `ROADMAP.md` | `npm run check-roadmap` → OK (17 sections) | closed section replaced by §5.12 observer read surface |
| 5.1 changelog | `CHANGELOG.md` | new dated first entry | records the four change groups |
| 5.2 coverage register | `spec/audit/req-coverage.md` | `validate -- --write-register` → 0 errors | regenerated |
| 5.3 assemble | `holonovel.md`, `holonovel/holonovel.md`, `spec/build-phase-map.md` | `npm run assemble` → hash `851181de…` | generated |
| 6.1 gates | — | `npm run check:fast` → 40 passed, `check:fast: PASS` | green |
| 6.2 strict validation | — | `npm run validate:sdd` → 0 errors, 285 warnings | green |
| Anchors | `holonovel/scripts/lib/holosuite-*.ts` | `/tmp/opencode/anchors.mts` → 1 resolved (`:12`), 20 unresolved | unchanged in kind; the only already-resolving anchors sit before the edit point |

## Delta amendments (execution vs plan)

1. **REQ-309b wording.** The pinned 795-character draft raised two proofreading
   warnings (a 51-word sentence and a four-conjunction sentence). The body was
   split into shorter sentences at 797 characters; no REQ-309b warning remains.
   The §6 verification pattern became
   `the observer's read-only commands (REQ-366b) add a second` (count 1).
2. **T643 fixture order.** Room and character creation moved before the ruleset
   bind. A bound Novel with an empty world returns `STATE_CONFLICT` for `look`,
   which made the pre-existing Player assertion (`assertNotContains(look,
   "FORBIDDEN")`) vacuous; the observer `look` assertion also switched from the
   room description to the room name because the first `look` marks the room
   seen under normal description mode. Both assertions now observe a populated
   Novel.
3. **Surface record.** The description edit moved the measured footprint, and
   `surface-budget` named the stale recorded header in `holonovel/DECISIONS.md`
   (28,582/24,984 → 28,585/24,987). Updated in the same change; the plan
   anticipated the baseline rewrite but not the header.

## Findings

- **Observer `help` asymmetry (recorded, no change).** The help branch refuses
  only the `player` (`holonovel/src/index.ts:4945-4953`), so an observer on a
  ruleset-bound Novel sees the full verb catalogue while a Player does not. Kept
  deliberately: REQ-305 defines observer mode as carrying GM-level state
  visibility.
- **REQ-366b remainder (scheduled).** `resolve` and `visibility`/`audibility`
  still call `requireNotObserver()` (`holonovel/src/index.ts:4793`, `:4820-4825`),
  recorded as F-5.12-1 under ROADMAP §5.12.
- **Anchor corpus (unchanged).** 20 of 21 `index.ts` anchors were already
  unresolved before this change; the only resolving anchor (`:12`) is before the
  edit point. Repointing remains the open P2 roadmap item.

## Deployed

`not applicable — no publication in scope`.

## Loop

Gates green, no open P0, and the only open P1 is F-5.12-1, which is scheduled on
ROADMAP.md. No new action items.

LOOP PAUSED
