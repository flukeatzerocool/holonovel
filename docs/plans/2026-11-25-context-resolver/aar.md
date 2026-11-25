# AAR — context resolver, checked audit, and the two no-Novel authoring paths (A1 + A2)

**Plan:** `plan.md` · **Tasks:** `tasks.md` · **Session:** 2026-11-25 · **Commit:** one spec
increment (see the Changelog entry below).

## What was supposed to happen

A pure `resolveContext()` with six precedence rules; a raw-safe `withContext` carrier on the
context-aware tools; a typed audit table generated from the observed `requireNovel()` call sites and
enforced by a new gate; two no-Novel creation paths (character → roster, NPC → codex); and a spec
movement (`REQ-661` added; `REQ-088e`, `REQ-075a`, `REQ-075b` amended) behind the full gate chain.

## What happened

Every phase landed, but the build found four defects the plan had not anticipated, and three plan
claims were wrong or incomplete. All were resolved in-session.

| Phase | Result | Evidence |
|---|---|---|
| P0 baseline | 46/46, `check:fast: PASS` | `npm run check:fast` → exit 0 |
| P1 resolver | 6 rules + `null` unresolved case + raw-safe carrier | `tsc --noEmit` → 0; tsx import resolves |
| P2 harness | 25 cases | `test:context` → 25 passed, 0 failed |
| P3 carrier | second block for prose, structured-only for JSON bodies | `check:fast` + `test:output-contracts` |
| P4 gate | 177 keys / 186 sites / 192 rows; red test exits 1 | `check-context-audit` → PASS; removal → FAIL |
| P5 fields | `context` on four tools, `ruleset` on create | schema diff; explicit-wins test |
| P6 unbindings | roster create, codex NPC create, reload survival | 5 live proofs + restart probe |
| P7 spec | `REQ-661`, three amendments, `T794`–`T798` | `validate:sdd` → 0 errors; strict → 0 |
| P8 regeneration | definitions, budget, fingerprints, starter, g7 | `build-order` → PASS |

## What went right

- **The gate caught what the harness could not.** The audit table is generated from
  `--observed`; the red test proved a removed row fails, so the table cannot silently drift.
- **The reload probe was decisive.** It exposed a pre-existing defect: `saveRoster` never wrote
  `ruleset` although `loadRoster` read it, so staging a character had been losing its ruleset
  scope across restarts. Fixed with `created_at`/`created_by` in the same writer.
- **The cold reviews paid for themselves.** They caught the raw-JSON carriage problem, the roster
  persistence gap, a task cycle, and a three-vs-two amendment miscount before any code was written.
- **The resolver is genuinely pure.** `core/context.ts` imports nothing, so the six rules are
  tested without booting a server.

## What went wrong, and the disposition

- **F-1 — the raw-body contract broke four existing harnesses. Resolved.** `withContext` appended
  a text block to `raw()` results; the project's harnesses join content blocks and parse the text
  as JSON. Fixed by making the second block opt-in (`textBlock: false` at the six JSON sites) and
  keeping the store in `structuredContent.context`. This is the C-6 deviation from D3.
- **F-2 — 21 evidence anchors drifted. Resolved.** `requireNovel` insertions moved `index.ts` by
  +199 lines and `state.ts` by +4. A uniform `--offset` rewrite was wrong for anchors in different
  regions and was reverted; each anchor was repointed to a carrying line by identity.
- **F-3 — the tool description overran its budget. Resolved.** `manage_character` reached 1140 B
  against a 1000 B budget; rewritten to 986 B with the new behaviour folded in.
- **F-4 — the recorded surface budget moved. Resolved.** Regenerated the baseline and updated the
  `DECISIONS.md` figure (30,261 full / 26,275 standard).
- **F-5 — new test IDs need an executed `test("…")` name. Resolved.** `testAsync` did not match
  the validator's `\btest\s*\(` scan; `test()` now accepts async callbacks so `T794`–`T798` are
  collected.
- **F-6 — the audit's scope is 186 sites, not the roadmap's 129.** The roadmap counted one file;
  `knowledge.ts` (41), `world-crud.ts` (12), and `world-model.ts` (4) were not counted. Recorded
  in the corrected roadmap and in `context-audit.md`.
- **F-7 — a campaign-less mutation writes no audit entry. Scheduled.** `audit()` is Novel-only
  (`index.ts:2972`), so the new roster and codex creations are unaudited. Tracked as `F-CTX-1`
  with a ROADMAP section and a register row; a server-level audit ring or a REQ-040a carve-out
  closes it.
- **F-8 — the plan's cold-pass cap forced an unverified final edit.** The two post-review blockers
  were fixed after the re-review cap and verified only by the commit-time gates. Recorded as
  C-1/C-2 in the build record.

## Verification (post-change)

- `npm run check:fast` → `PASS`, 0 errors.
- `npm run check` (via `build-order`) → 0 errors, 304 warnings (proofreading, pre-existing class).
- `HOLONOVEL_IMPL_STRICT=1 npm run validate` → 0 errors.
- `npm --prefix holonovel run test:all` → 57 commands, 0 failures.
- `npm run check-context-audit` → 177 keys, 186 sites, 192 rows, PASS.
- `npm --prefix holonovel run test:context` → 25 passed.
- `npm run check-anchors` → predicates current.
- `npm run surface-budget` → 30,261 / 26,275 within budget.

## Rework and cost

- Three cold plan reviews and one diff re-review; four build defects found by gates and fixed in
  session; two regeneration cycles (`g7-attestation`, `starter-novel`) and one anchor repair.
- One spec increment, about 32 files. No data migration; two additive roster fields.

## Open items

- None unscheduled. `F-CTX-1` is scheduled on ROADMAP.md with a `Scheduled-roadmap` register row.
- The `wrongly-novel-bound` rows for lore, note, faction, relationship (A4) and identity (A5) are
  recorded in `docs/authoring-surfaces/context-audit.md` with their target increment.

## Changelog entry

**Title:** Context resolution, a checked requireNovel audit, and no-Novel creation

**Summary:** A pure context resolver decides which store an operation acts on and reports it; a
generated gate enforces a classification of every `requireNovel()` call site; a character can be
created on the roster and an NPC in the codex with no campaign open.

- Added `REQ-661` and the pure `resolveContext()` precedence (explicit, open Novel, subject,
  authoring, lookup, codex fallback) with a raw-safe `withContext` carrier.
- Added `check-context-audit`, a typed 192-row table over 186 `requireNovel()` call sites across
  the four tool-surface files, a generated audit page, and the red test that fails on a missing row.
- `manage_character (action: create)` with no active Novel writes a roster entry (profile-only
  unless `ruleset` is named); `manage_npc (action: create)` writes a Codex entry of kind `npc`.
- Fixed `saveRoster` dropping `ruleset` that `loadRoster` reads; added `created_at`/`created_by`.
- Amended `REQ-088e`, `REQ-075a`, `REQ-075b`; added `T794`–`T798`; corrected the authoring roadmap
  from 129 to 186 sites and recorded the campaign-less audit gap on ROADMAP.md.

LOOP PAUSED
