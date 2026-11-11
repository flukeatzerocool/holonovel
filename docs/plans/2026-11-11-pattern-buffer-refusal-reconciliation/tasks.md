# Tasks — §5.10 parser unknown-verb refusal reconciliation

Dependency-ordered. Each task names its verification; done means the check
passed, not that the edit landed.

## Phase 0 — Baseline and predicates

- [x] T0.1 `npm run status` recorded: 15 open roadmap items, 49 unpushed
      commits, version 2026.11.11.
- [x] T0.2 `npm run check:fast` → 40 passed, 0 failed, `check:fast: PASS`.
- [x] T0.3 `test:pattern-buffer` baseline → 17/18, I1 failed
      (`Total: 18 | Passed: 17 | Failed: 1`).
- [x] T0.4 `test:pattern-buffer-ruleset` baseline → PASS, 27/27
      (8 skipped, 2 stubbed).
- [x] T0.5 `test:all` baseline → 50 passed, 6 failed; every failure is a
      holosuite `predicate_unresolved` anchor (pre-existing, ROADMAP P2).
- [x] T0.6 Stale-site grep: `not a recognized command` present only in
      `spec/appendices-fixtures.md:865` and
      `holonovel/scripts/run_pattern_buffer.ts:243`; `Unknown verb` present in
      the parser, T239, and T245.
- [x] T0.7 `Scheduled-roadmap` register scan: no row matched this section;
      F-P6a-19 free.

## Phase 1 — Capture

- [x] T1.1 W.1 fixture extracted from `spec/appendices-fixtures.md:789-807`.
- [x] T1.2 `/tmp/pb-w3-probe.ts` boots the server, creates `probe-w3`,
      converts W.1, creates/activates `ProbeHero`, sets `player`, calls
      `run_command { command: "xyzzy" }`.
- [x] T1.3 Captured: `[ERROR] [UNIMPLEMENTED] Unknown verb 'xyzzy'. Valid
      commands include: ask, climb, close.\nCorrective action: Use one of:
      ask, climb, close.` Recorded in `aar.md`.

## Phase 2 — Align the two stale surfaces

- [x] T2.1 `spec/appendices-fixtures.md:865-867` replaced with the wrapped
      response (two physical lines) and the corrective-action line; `:864`
      invocation preserved.
- [x] T2.2 `holonovel/scripts/run_pattern_buffer.ts:242-244` now asserts
      `[ERROR] [UNIMPLEMENTED]`, `Unknown verb 'xyzzy'`,
      `Valid commands include:`, `Corrective action:`.
- [x] T2.3 `npm --prefix holonovel run test:pattern-buffer` → 18/18.
- [x] T2.4 Scoped greps over `sed -n '860,880p'`: response line 1,
      corrective line 1, stale text 0.

## Phase 3 — Bookkeeping

- [x] T3.1 ROADMAP: closed section removed; `## §5.10 REQ-196a Player-badge
      clause (P1)` added in its slot with REQ-196a and a trigger.
- [x] T3.2 Register: `### 2026-11-11 parser refusal reconciliation` with
      F-P6a-19 under `## Scheduled-roadmap`.
- [x] T3.3 CHANGELOG: new first entry.
- [x] T3.4 `tasks.md` written; `aar.md` written from the Phase 0/1 records.

## Phase 4 — Verify and commit

- [x] T4.1 `test:pattern-buffer` → 18/18.
- [x] T4.2 `test:backfill` → 104/104; `test:world-provider` → 7/7.
- [x] T4.3 `npm run assemble && npm run check:fast` → `check:fast: PASS`
      (40 passed, 0 failed).
- [x] T4.4 `npm run validate -- --sdd-strict` → 0 errors (285 warnings);
      `check-roadmap`, `check-registers`, `check-loop-artifacts` pass.
- [x] T4.5 `npm run session:close` → one commit.
