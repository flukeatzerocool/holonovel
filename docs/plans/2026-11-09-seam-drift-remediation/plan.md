# Plan — Close the seam-drift findings (state health, drift reachability, warn mode)

**Status:** approved and executed · **Date:** 2026-11-09 · **Depth:** standard
**Review independence:** fresh (cold stages 1–5, closure pass READY) · **Rollback cost:** 1
**Gate artifact:** `~/.local/state/opencode/plans/<repo-key>/2026-11-09T16-28-57-249Z-73fdf090.md` · sha256 `73fdf090e5583660db57b0755504920fb0812409a3adffc761c0a58a4e77154b`

## Done bar

**Done bar:**
1. `health.state_health.markers` surfaces `[session-no-mutations]`,
   `[state-drift]`, `[state-regression]`, and T471/T472/T475 assert the
   corresponding string.
2. Drift is reachable: after `save_context` on a Novel with no story-state
   mutation, `stateDriftActive` is true and the marker appears; a story-state
   mutation clears it. T472 proves both directions.
3. `TTRPG_STATE_GATE=warn` appends a session-close warning (via recap, `end`,
   and `switch`) **when drift is active**, naming the drift-since timestamp, the
   commit route (the state tool for each beat), and the recap enumerator.
4. REQ-030, REQ-088a/c/d, REQ-095a/b, REQ-240b, REQ-256a, REQ-334a, and T98
   describe the process-global active Novel; REQ-403a/b and T472 describe drift
   as "no story-state mutation since the last context save".
5. The eight install-relative save paths in §5.9 read `<DATA_DIR>/…`.
6. The four stale engine-contract citations resolve to the code they name.
7. Every finding F1–F7 (with F2 split into F2a/F2b/F2c) has a `Resolved`
   entry in `spec/audit/review-register.md`.
8. These exit 0: `npm --prefix holonovel run test:persistence-guardrails`,
   `npm run check:fast`, `npm run check`, `npm run build-order`.
9. The increment lands with `plan.md`, `tasks.md`, `aar.md`, and `LOOP OPEN`
   (publication is out of scope, so PAUSED is not claimable).

## User decisions (recorded 2026-11-09)

- **D1.** Remove `save_context` from REQ-403b's block list; `end` and `switch`
  stay blocked.
- **D2.** Amend the REQs to process-global; no per-connection state (the
  2026-10-29 E8 decision in `holonovel/DECISIONS.md` declined multi-engine
  hosting).
- **D3.** A context save does not advance `last_mutation_at`; drift means
  "context saved, no story-state mutation since".
- **D4.** Implement `warn` at session close.

## Scope

Closes the seven findings from the 2026-11-09 seam drift report plus the two
defects the cold pass exposed inside F2. Out of scope: the rest of the spec
sweep, the code-side sweep, per-connection state, and publication.

## Evidence base (this session)

| # | Evidence | Source | Trust |
|---|---|---|---|
| EV1 | `buildSpecHealth()` has no drift/regression/session key; markers exist only at recap 9709-9717, ledger 14082-14083, block errors 10536/10554 | `holonovel/src/index.ts:11714-11990` | repo |
| EV2 | T471 asserts recap only; T472 never creates drift; T475 fetches `health` (:240) and never asserts it | `holonovel/scripts/test-persistence-guardrails.ts:174-247` | repo |
| EV3 | Only writer of `saved_at` is `save_context` (10978); `recordMutation` (10979) sets `last_mutation_at`; drift needs `saved_at > last_mutation_at`; a fresh Novel has `last_mutation_at: null` | `index.ts:10978-10979`; `state.ts:1225,2023,2073-2077` | repo |
| EV4 | `stateGate()` compared only to `"block"` (10536, 10554); no warn path | `index.ts`; `state.ts:2068-2071` | repo |
| EV5 | One process-global `activeNovelId`; badge is `novel.badge` | `state.ts:989,1090,348` | repo |
| EV6 | §5.9 literals: 8 install-relative at 2886, 2895, 2923, 3009, 3115, 3123 (2), 3126, 3129; legacy at 3024 (REQ-092f) | `spec/02-requirements.md` | repo |
| EV7 | Residual per-connection phrasing: 1194-1203 (REQ-030), 2886, 2892, 2895, 2923, 2926, 2928, 3118, 3123 | `spec/02-requirements.md` | repo |
| EV8 | T98 asserts two connections with different active Novels | `spec/appendices-reference.md:1559` | repo |
| EV9 | Four citations resolve to unrelated code | `docs/engine-contract.md:59,124,179,202` | repo |
| EV10 | Real targets: roster 2563, server notes 2640-2645, codex 2665-2671, fingerprint 1062; verify/replay 9335-9450; legacy backup 2425-2447; export/import audit 10589/10770 | `state.ts`; `index.ts` | repo |
| EV11 | `state_regression` carries `audit_gap`, `timestamp_gap_ms`, `recorded_at`, `backup_index` | `state.ts:2079-2085` | repo |
| EV12 | Baseline: `check:fast` exit 0; guardrails 13/13 pass while criteria are unmet | tool output | tool-output |
| EV13 | Tests read named health keys; none snapshots the key set | `test-persistence-guardrails.ts:256`; `test-fingerprints.ts:230` | repo |
| EV14 | `close_session` calls recap then save_context; `end` at 10550, `switch` at 10534 | `index.ts:14380-14395` | repo |
| EV15 | §5.9/§5.19 edits require fingerprint regeneration; `version-bump` advances package files | `AGENTS.md`; `version-bump.ts:7` | repo |

## Findings register

| ID | Finding | Disposition |
|---|---|---|
| F1 | REQ-402 marker absent from `health` | S3 + S4; `Resolved` |
| F2a | Drift unreachable (context save clears the compared timestamp) | D3 → S1; `Resolved` |
| F2b | `warn` mode unimplemented | D4 → S2; `Resolved` |
| F2c | REQ-403a marker absent from `health` | S3 + S4; `Resolved` |
| F3 | REQ-406 marker absent from `health` | S3 + S4; `Resolved` |
| F4 | REQ-403b lists `save_context` in block mode | D1 → S5; `Resolved` |
| F5 | Per-connection Novel claim false (8 sites + T98) | D2 → S6; `Resolved` |
| F6 | Four stale engine-contract citations | S8; `Resolved` |
| F7 | §5.9 install-relative save paths | S7; `Resolved` |

## Blast radius

| File | Change | Size |
|---|---|---|
| `holonovel/src/core/state.ts` | `stateDriftActive` null-clock rule; new `recordContextSave` | S |
| `holonovel/src/index.ts` | `save_context` recorder; warn at recap/`end`/`switch`; block message; `state_health` | M |
| `holonovel/scripts/test-persistence-guardrails.ts` | Rewrite T471/T472/T475 | M |
| `spec/02-requirements.md` | REQ-403a/b, 088a/c/d, 095a/b, 240b, 256a, 334a, 8 paths | L |
| `spec/appendices-reference.md` | T472, T98 | S |
| `docs/engine-contract.md` | 4 citations | S |
| `spec/audit/review-register.md` | `Resolved` subsection | S |
| `CHANGELOG.md` | Dated heading + bullets | S |
| `spec/audit/req-coverage.md` | Regenerated | S |
| `holonovel.md`, `holonovel/holonovel.md`, `holonovel/src/generated/contract-fingerprints.ts` | Generated | — |
| `holonovel/package.json`, `package-lock.json`, `server.json`, `AGENTS.md`, `DECISIONS.md` (header) | Advanced by `version-bump` | — |
| `docs/plans/2026-11-09-seam-drift-remediation/{plan,tasks,aar}.md` | Increment artifacts | S |

## Steps

**S1 — Make drift reachable (S).**
1. `core/state.ts:2073-2077`: `stateDriftActive` returns false when `saved_at`
   is absent; when `saved_at` exists and `last_mutation_at` is null, returns
   **true**; otherwise compares the two.
2. Add `recordContextSave(novel)`: increments
   `mutation_counts_by_group["context"]` and saves. It does **not** set
   `last_mutation_at`, does **not** clear `uncommitted_rolls` (REQ-404 — a
   context save is not a committing mutation), and does **not** run the
   REQ-449 agency ceiling (that ceiling bounds AI story mutations).
3. `index.ts:10979`: replace `state.recordMutation(novel, "set_pause_context",
   "context")` with `state.recordContextSave(novel)`.
Verify: `npm run typecheck`; T472 (S4) fails before and passes after.

**S2 — Implement warn and fix the block message (S).**
Anchor: recap `index.ts:9712`, `switch` `10534`, `end` `10550`. When
`stateGate() === "warn"` and `stateDriftActive(novel)`, append to the success
text of the `switch`/`end` return and to the recap body:
`[state-drift] context saved at <saved_at>; no story-state mutation since. Commit each narrated beat with its state tool (manage_context (action: recap) lists them), then retry.`
Under `block`, keep `[STATE_CONFLICT]` but replace the message text at
`10537`/`10555` with: "commit the narrated state, then retry; `manage_context
(action: recap)` lists the uncommitted beats." `close_session` needs no edit —
it calls recap (`index.ts:14380-14395`).
Verify: T472 warn and block cases.

**S3 — Surface the three markers (S).**
In `buildSpecHealth`, after `data_health`:

```ts
state_health: isGM ? {
  markers: [
    ...(novel && state.stateDriftActive(novel) ? ["[state-drift]"] : []),
    ...(novel && (novel.session_no_mutation_windows?.length ?? 0) > 0 ? ["[session-no-mutations]"] : []),
    ...(novel?.state_regression ? ["[state-regression]"] : []),
  ],
  drift_active: novel ? state.stateDriftActive(novel) : false,
  drift_since: novel?.gm_context?.saved_at ?? null,
  session_no_mutation_windows: novel?.session_no_mutation_windows ?? [],
  regression: novel?.state_regression ?? null,
} : undefined,
```

GM-gated like `data_health` (REQ-097c). `healthy`/`health_warnings` untouched.

**S4 — Make the tests assert the criteria (M).**
- T471: fetch `health`; assert `state_health.markers` contains
  `[session-no-mutations]` and `session_no_mutation_windows` is non-empty (no
  window-name assertion).
- T472: create Novel, GM badge, `save_context`; assert `[state-drift]` in
  `health.state_health.markers`, in recap, and in the briefing `state_ledger`;
  assert block refuses `end` and `switch` with `[STATE_CONFLICT]` and permits
  `save_context`; assert a story-state mutation clears `drift_active`; assert
  warn appends the S2 string in recap, `end`, and `switch`.
- T472 warning/block cases: convert `test-persistence-guardrails.ts:174-198`.
  The `:174-185` warn case keeps `save_context` then `switch` → `[OK]` (warn
  does not block) and adds the warning assertion. The `:187-191` block case
  currently saves context then switches expecting `[OK]`; under S1/S2 that
  drifts and blocks, so it must record a story-state mutation (`manage_note
  (action: set)`) after `save_context`, then assert `switch` returns `[OK]`.
- T475: assert `[state-regression]` in `markers` and
  `state_health.regression.audit_gap === 1`; keep the briefing assertion.

**S5 — Drift contract wording (S).**
1. REQ-403a (`spec/02-requirements.md:4057-4061`): "newer than the last
   *story-state* mutation — a context save records `gm_context.saved_at` but
   is not a story-state mutation".
2. REQ-403b (`:4063-4070`): delete `manage_novel (action: save_context)` from
   the block list; reword the warn sentence to name the uncommitted beats and
   the commit route via `manage_context (action: recap)`, not `save_context`.
3. T472 (`spec/appendices-reference.md:1482`): same deletion; replace "a
   commit call clears the gate" with "a story-state mutation clears the gate".

**S6 — D2: process-global active Novel (M).** Per-site rewrites:
- `1194-1203` (REQ-030): "Each connection may independently switch between
  Novels via `manage_novel (action: switch)`" → "Any connection may switch the
  process's active Novel via `manage_novel (action: switch)`"; keep "each
  Novel stores its own badge independently" and the shared-badge sentence.
- `2886` (REQ-088a): "for the calling connection" → "for the server process".
- `2892` (REQ-088c): "switches the active Novel for a connection" →
  "switches the process's active Novel".
- `2895` (REQ-088d): "One Novel is active per connection at a time (REQ-030);
  a connection may switch between Novels" → "One Novel is active per process
  at a time (REQ-030); any connection may switch the active Novel".
- `2923` (REQ-095a): "the connection's current Novel" → "the process's current
  Novel".
- `2926` (REQ-095b): "Novel-scoped tools operate on the connection's active
  Novel. Each connection maintains its own active Novel reference; two
  connections may have different Novels active simultaneously." → "Novel-scoped
  tools operate on the process's active Novel; every connection observes the
  same active Novel reference."
- `2928` (REQ-256a): delete "or if the active Novel is active in another
  connection"; the "SHALL be active when called" sentence remains.
- `3118` (REQ-240b): "the caller's active Novel is unchanged" → "the process's
  active Novel is unchanged".
- `3123` (REQ-334a): "the Novel SHALL NOT be active in another connection" and
  "IF the Novel is active in another connection" → "the Novel SHALL NOT be the
  process's active Novel" / "IF the Novel is the process's active Novel".
- `appendices-reference.md:1559` (T98): "Assert two connections with different
  active Novels operate independently" → "Assert two concurrent connections
  observe the same active Novel."

**S7 — F7: save-path literals (M).** Nine occurrences across eight lines, per
site:
- `2886`: `.holonovel-state/novels/<slug>.json` → `<DATA_DIR>/novels/<slug>.json`
- `2895`: same (the `.trash/` mention stays; it is already relative)
- `2923`: same
- `3009` (REQ-092a): same
- `3115` (REQ-240a): `.holonovel-state/novels/<new_slug>.json` → `<DATA_DIR>/novels/<new_slug>.json`
- `3123` (REQ-334a): both `.holonovel-state/novels/<slug>.json` and `.holonovel-state/archive/<slug>.json` → `<DATA_DIR>/…`
- `3126` (REQ-334b): novels → `<DATA_DIR>/novels/<slug>.json`
- `3129` (REQ-334c): `.holonovel-state/archive/my-novel.json` → `<DATA_DIR>/archive/my-novel.json`
- **Do not touch** `3024` (REQ-092f): the legacy v1 JSONL layout that REQ-613
  preserves.
Guard: `rg -n '\.holonovel-state/(novels|archive)' spec/02-requirements.md`
returns exactly line 3024.

**S8 — F6: four citations (S).** Anchor by surrounding text, edit bottom-up.
`:59` → `state.ts:2563-2569` (roster write), `2640-2645` (server-notes write),
`2666-2671` (codex write), `1062` (build-fingerprint); `:124` →
`index.ts:9335-9450` (verify/replay); `:179` → `state.ts:2413-2420`
(`backupCandidates`, which accepts the legacy `.bak` as index 1); `:202` →
`index.ts:10589,10770` (export/import audit). Re-grep each after editing.

**S9 — Registers, changelog, artifacts (S).** Add
`### 2026-11-09 seam-drift remediation` under `## Resolved` with **F1, F2a,
F2b, F2c, F3, F4, F5, F6, F7**, each citing its predicate and `Resolved`. Add
the CHANGELOG entry. Create the three plan artifacts; `aar.md` starts and ends
`LOOP OPEN`.

**S10 — Regenerate and gate.** `npm run assemble` →
`npm run validate -- --write-register` → `npm run build-order` →
`npm run check:fast` → `npm run check`. Capture exit codes un-piped.

## Edge cases and rollback

- **Fresh Novel, no mutation** → `saved_at` present + `last_mutation_at` null →
  drift true (S1 rule).
- **`warn` without drift** → no warning text.
- **Player badge** → `state_health` omitted.
- **Legacy path** → REQ-092f is the only surviving literal; the S7 guard
  enforces it.
- **Version bump** → up to six package files advance in the same commit.
- **Rollback** → one commit; `git revert` restores everything. Cost 1.

## Commit order and gates

One commit (spec increment), subject from the CHANGELOG via
`npm run session:close`. Gates before commit: `assemble`,
`validate --write-register`, `build-order`, `check:fast`, `check`,
`test:persistence-guardrails`. Publication out of scope.

## User impact

Medium-low: drift becomes observable after a context save (previously never),
and `warn` speaks at session close. No tool signature, state-shape, or data
migration change.
