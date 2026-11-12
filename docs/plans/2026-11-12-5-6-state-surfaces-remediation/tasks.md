# Tasks — §5.6 state surfaces remediation

Status legend: `[x]` done and verified · `[~]` done, verification pending ·
`[ ]` open.

## Phase 0 — baseline

- [x] `npm run status`: 2026.11.12, 58 unpushed, 12 roadmap items.
- [x] `git status --short`: only the untracked plan directory.
- [x] `npm run check:fast`: 40 passed, 0 failed, `PASS`.
- [x] Harness baseline: output-contracts 390, backfill 105, briefing 15,
      narrative 75, persistence 46 — all 0 failed.

## Phase 1 — red probes

- [x] T268/T280/T334/T275/T384 assertions added first; observed red
      (3 backfill failures, 4 output-contract failures).
- [x] T270 and T358 written; observed red (missing lore prompt, missing
      non-NPC World in Motion entry).
- [x] Already-satisfied rows recorded: F-P3B4-3 neutral marker set and
      F-P3B4-8 captured `ruleset` (assertion-only, immediate pass).

## Phase 2 — pause/resume and briefing

- [x] `composeBadgeBriefing` extracted; `badge_briefing` prompt is a thin
      wrapper; `get_context` calls it with `mutate: false`.
- [x] `save_context` filters story entries to `decision`/`bond`.
- [x] `IntroContext.gmContext` + `gmContextSummary` feed the intro prompt.
- [x] `notes` token + section added to both vocabularies and the briefing.
- [x] Ally↔rival lore prompt recorded and rendered for the GM.

## Phase 3 — world reactivity

- [x] `WorldChange` + `world_in_motion` added to the state model, default,
      load, export, and import paths.
- [x] `enqueueWorldChange` + one-hop `worldChangeTargets`; three triggers wired
      (relationship set, faction fill, secret reveal).
- [x] Transition cycle receives the marker list captured before the clear.
- [x] accept/modify/defer/dismiss resolver, `modify` apply/cancel workflow,
      fourth-deferral warning derived in `spec_health`.
- [x] World in Motion renders NPC suggestions and pending changes.

## Phase 4 — persistence and codex truth

- [x] `writeFlatStore` with rotation + fsync + rename; both flat writers
      delegate.
- [x] `spec_health.codex` partitioned; `codex_stale` computed.
- [x] Captured-entry `ruleset` asserted (no code change).

## Phase 5 — audit redaction

- [x] `auditArgsForBadge` redacts `session_id`; boundary markers visible to all
      badges as a timespan.
- [x] Boundary marker records `started_at`/`ended_at` (REQ-237a).
- [x] `manage_context (action: recap, session_id)` scopes a live session.

## Phase 6 — citations and registers

- [x] REQ-065f `_Check:` re-pointed to T224.
- [x] Coverage register regenerated (A 0 / B 0 / C 490 / E 118).
- [x] Review register F-P3B4-1…15 moved to Resolved with current predicates.
- [x] ROADMAP section removed; CHANGELOG and DECISIONS entries added.
- [x] Fingerprints refreshed; starter Novel rebuilt; `build-order` complete.

## Phase 7 — gates

- [x] Five harness suites green (396/105/16/76/46).
- [x] Root and server typecheck clean.
- [x] `npm run assemble && npm run check:fast`: 40 passed, 0 failed, PASS.
- [x] Full `check` via `build-order`: 0 errors, 286 warnings.
- [x] `aar.md` written (`LOOP PAUSED`).
- [ ] `session:close` commit.
