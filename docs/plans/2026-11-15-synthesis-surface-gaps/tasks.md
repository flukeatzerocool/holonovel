# Tasks — Synthesis-surface gaps (U6-F3, U6-F4, U6-F5)

Dependency-ordered. A task is done when its verification line passes; tasks in
one phase may run in any order unless a dependency is named.

## Phase 0 — preconditions

| # | Task | Verification |
|---|---|---|
| 1 | Confirm clean tree and record HEAD | `git status --porcelain` empty; `git rev-parse --short HEAD` |
| 2 | Fast-gate baseline | `npm run check:fast` → `45 passed, 0 failed`, `PASS` |
| 3 | Confirm the three register rows are `Scheduled-roadmap` and the roadmap section still names them | `sed -n '2992,3017p' spec/audit/review-register.md`; `sed -n '15,28p' ROADMAP.md` |
| 4 | Confirm the increment directory holds `plan.md`, `tasks.md`, and `plan.cold/report.md` | `ls -R docs/plans/2026-11-15-synthesis-surface-gaps` |
| 5 | Sibling-contract probe: enumerate every REQ binding `manage_synthesis`, `synthesis_fingerprint` and `synthesis_health`; confirm none contradicts DP-1/DP-3 | `grep -n 'synthesis_fingerprint\|synthesis_health\|manage_synthesis (action:' spec/02-requirements.md` |
| 6 | File-surface probe: name the file for each of the four crossed surfaces (tool schema, storage seam, read surfaces, harnesses) | plan Phase 0 step 6 |
| 7 | DATA_FORMAT audit: record the pre-edit fingerprint state | `npm run check-fingerprint-sync` |
| 8 | No-op text probe: the old message is not asserted anywhere | `grep -rn 'Synthesis up to date\|Use force' holonovel/scripts` returns nothing |

## Phase 1 — core synthesis module

| # | Task | Depends | Verification |
|---|---|---|---|
| 9 | Create `holonovel/src/core/synthesis.ts`: `SYNTHESIS_MODULES`, `synthesisProjection`, `moduleSourceHashes`, `synthesisFingerprint`, `synthesizeFromNovel`, cap application, `synthesisGroupStatus` | 8 | `npm --prefix holonovel run typecheck` |
| 10 | Import `SYNTHESIS_MODULES` in `index.ts` and delete the local const | 9 | typecheck; `grep -n 'const SYNTHESIS_MODULES' holonovel/src/index.ts` returns nothing |
| 11 | Define the capped set as internal items (`source_url` starting `novel://`); never derive it from `tag` | 9 | the predicate is asserted by T790 against an untagged `action_patterns` item |
| 12 | Implement the six missing category rules (3, 4, 5, 6, 7, 8) with stable keys and `novel://` source URIs | 9 | harness task 23 |
| 13 | Implement per-pass caps and total caps with overflow reporting, `TTRPG_MAX_SYNTHESIS_ITEMS` precedence, `spec_health` group status, and `[STATE_CONFLICT]` at zero (DP-3, REQ-129c) | 11, 12 | harness task 24 |
| 14 | Keep `novel-voice-*` and `novel-theme` keys intact; add the narrative-voice profile beside them | 12 | `grep -n 'novel-theme' holonovel/src/core/synthesis.ts` |

## Phase 2 — persistence

| # | Task | Depends | Verification |
|---|---|---|---|
| 15 | Add `NovelState.synthesis` (internal items only) to the type, the initializer, the serializer and the loader default | 9 | `npm --prefix holonovel run test:persistence` |
| 16 | Hydrate on activation, undo/redo, `checkpoint_restore` and `import`: rebuild `DEFAULT_WISDOM`, re-merge persisted internal items, null branch clears both | 15 | harness task 23 (restart/undo/restore branches) |
| 17 | Write `manifest._fingerprint`; report it in `spec_health.synthesis_health.fingerprint` instead of `SPEC_HASH`; add the group count/max/overflow | 16 | T195 still passes; health shows a 64-hex value and the group status |

## Phase 3 — run handler

| # | Task | Depends | Verification |
|---|---|---|---|
| 18 | No-op on unchanged fingerprint with `[OK] Synthesis up to date — <ISO>`; `force` bypasses; zero cap returns `[STATE_CONFLICT]` | 17 | T321 and new T321a |
| 19 | Partial refresh: unchanged modules untouched, changed modules replace inactive internal items only, active items preserved (REQ-130b) | 18 | T321a |
| 20 | Persist + audit the pass; report per-module counts, overflow, `[empty]` markers, and group status | 19 | harness run of the synthesis block |

## Phase 4 — `[LOW]` provenance

| # | Task | Depends | Verification |
|---|---|---|---|
| 21 | `provenanceTags(item)` replaces `wisdomTag`; the briefing renders the tag pair once | 9 | `badge_briefing` contains `[LOW]` for a LOW item |
| 22 | `provenance` in every JSON synthesis resource payload; Markdown resources prefix the tag; `list` rows carry it | 21 | T325a |

## Phase 5 — tests and spec

| # | Task | Depends | Verification |
|---|---|---|---|
| 23 | `T321a` (no-op, partial refresh, restart/undo/restore) and `T325a` (`[LOW]` on three surfaces) in the existing harnesses | 20, 22 | `npm --prefix holonovel run test:backfill` |
| 24 | `T325b` (Player-badge views) in the existing harnesses | 22 | `npm --prefix holonovel run test:backfill` |
| 25 | `T789` (six category rules) and `T790` (caps, overflow, untagged exemption, zero-cap conflict) asserted in the harnesses | 13 | `npm --prefix holonovel run test:backfill` |
| 26 | Appendix F rows T789, T790 with REQ cells; §11.3 caps-precedence clause | 25 | `npm run validate` |
| 27 | `npm run assemble` — the assembled spec is what `validate` reads (EV29) | 26 | exit 0; build-phase-map hash updated |
| 28 | `npx tsx holonovel/scripts/generate-g7-attestation.ts` | 27 | `npm run check-g7-attestation` |
| 29 | Regenerate the coverage register from the assembled spec, then re-validate | 28 | `npm run validate -- --write-register`; `npm run validate` clean |

## Phase 6 — records and close

| # | Task | Depends | Verification |
|---|---|---|---|
| 30 | Flip `U6-F3`/`U6-F4`/`U6-F5` to `Resolved` with the closing commit; add the new P1 `Scheduled-roadmap` row for the `guidance://` gap | 29 | `npm run check-registers:strict` |
| 31 | Delete the `Synthesis-surface gaps` section from `ROADMAP.md`; add the `guidance://<badge>/voice|tone` section with its trigger | 30 | `npm run check-roadmap` (four sections) |
| 32 | Record DP-1/DP-2/DP-3 in `holonovel/DECISIONS.md`; write the `CHANGELOG.md` entry dated to the session | 31 | `npm run check-registers`, `npm run check-traceability`, lint |
| 33 | Write `aar.md` (noting the push-time spec-update record is owed); run the verification table (V1–V11) un-piped | 32 | every V row passes with its exit status recorded |
| 34 | `npm run session:close` — one commit | 33 | `git log -1 --stat` shows one commit; `check-loop-artifacts` passes |

## Branch

If a phase cannot complete in this session, stop at the last green phase, leave
the unrun tasks unmarked, record them in `aar.md` as `UNSET`, keep the roadmap
section open, and schedule the remainder as a new dated section. No commit.
