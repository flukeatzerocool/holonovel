# Tasks — Release hardening

Revision 2. Line numbers are current at `64e810f`; re-grep before editing.
`P1-T1` is written first and must fail on the current tree.

## P1 — Input contract (R1–R4)

- [x] P1-T1 Generated battery in `holonovel/scripts/lib/holosuite-adversarial.ts`:
      sweep all 241 `action_enum` values plus the five action-less tools
      (`take_turn`, `set_badge`, `respond_decision`, `open_session`,
      `close_session`) with minimal args. Assert per surface: `[MISSING_PARAM]`
      naming the parameter, or a legal `-32602` schema refusal for a classified
      surface; no state mutation for refused surfaces (state hash before == after);
      every `resources/list` entry has a string `name`; every surface is
      classified or declared no-arg.
      Gate: fails on the current tree with 22 silent accepts + 3 raw exceptions.
- [x] P1-T2 `holonovel/src/core/param-contract.ts`: `REQUIRED_PARAMS` keyed
      `${tool}:${action}` (empty action for action-less tools), format hints,
      pure `validateParams(tool, action, args)`.
- [x] P1-T3 Call `validateParams` from `guardToolCall`
      (`holonovel/src/index.ts:2030`), after retired-alias/telemetry and before
      badge authorization; host tools only.
- [x] P1-T4 Wrap both seams: MCP handler call (`:2140`) and façade `call`
      (`:18823`+); unexpected throw → `[ERROR] [SYSTEM]`, `isError`, detail to
      stderr (D1).
- [x] P1-T5 `String(k)` at three projections: `:15706`, `:16054`, `:16603`.
- [x] P1-T6 `npm run fix-anchors`; `check-anchors` green. Same commit as
      T3–T5.
- [x] P1-T7 `holonovel/scripts/test-backfill.ts:1544`: assert
      `[ERROR] [MISSING_PARAM]` naming the parameter; rename the test but keep
      `T176/T177/T178` in the title.
- [x] P1-T8 `holonovel/DECISIONS.md` dated section for D1/D2 (not under
      Non-goals); `npm run validate -- --write-register`; `CHANGELOG.md` dated
      to the package version.

Commit order, each passing `check:fast`:
1. P1-T1 + P1-T2 + P1-T3 + P1-T4 + P1-T5 + P1-T6.
2. P1-T7.
3. P1-T8.

Gates after P1: `check:fast` PASS (incl. `check-anchors`); `test:all` green;
`test:package-smoke` 11/11; sweep 0/0/0 with unchanged state hash.

## P2 — Release integrity (R5, R7, R9, R10)

- [ ] P2-T1 `scripts/publish/run.ts`: add optional `dry_run` and `stopped_at`
      to the record. `scripts/lib/publish-state.ts`: pure
      `describePublishRun(record)` → `dry run, stopped at <step>` /
      `pipeline run, stopped at <step>`; no registry claim. `scripts/status.ts`
      calls it. Assertion in `scripts/test-push-pipeline.ts` (pure function, no
      scratch-root read). Gate: `npm run test:pipeline` on this commit.
- [ ] P2-T2 `ROADMAP.md`: shared-evidence bullet on the existing REQ evidence
      linkage section, citing 122 (linkage) and 126 (shared-only) with their
      commands (D4). Gate: `check-roadmap`.
- [ ] P2-T3 `spec/audit/review-register.md:3103`: restore or strike. Gate:
      `grep -c "rows below"` plus a read (not `check-registers`).
- [ ] P2-T4 F7 disposition: bump SDK or record non-reachability in
      `SECURITY.md`; `npm audit`.
- [ ] P2-T5 `docs/publish-pipeline.md`: container rehearsal status.
- [ ] P2-T6 T177 `[AMBIGUOUS]` half: enumerate surfaces that can return
      multiple canonical matches; implement there, or amend the row and record
      the reasoning. Gate: `grep AMBIGUOUS holonovel/src` shows emissions or a
      recorded amendment. An amended row requires `npm run assemble` and
      commits `holonovel.md` + `holonovel/holonovel.md`.

Commit order: (1) P2-T1 + `test:pipeline`; (2) P2-T2 + P2-T3; (3) P2-T4 +
P2-T5; (4) P2-T6.

## P3 — Verification depth (R6, R8)

- [ ] P3-T1 `holonovel/scripts/lib/holosuite-mutation.ts`: 8 → ~30 mutants
      across persistence, badge gating, dispatch; record the catch rate.
- [ ] P3-T2 §10 independent verification; write
      `independent-verification.md`; disposition every finding into the
      registers.

## P4 — Publish

- [ ] P4-T1 `./scripts/push-pipeline.sh`.
- [ ] P4-T2 Verify the tag equals the published CalVer version, npm `latest`,
      deploy clone, wiki.
- [ ] P4-T3 Re-record the external TDQS score.

## Close

- [ ] C1 Review-register rows for F1–F11 with terminal dispositions.
- [ ] C2 Replace the provisional AAR; run `after-action-report`; end with
      `LOOP PAUSED` or `LOOP OPEN`.
- [ ] C3 `npm run session:close` per phase.
