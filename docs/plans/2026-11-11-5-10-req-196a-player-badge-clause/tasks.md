# Tasks — §5.10 REQ-196a Player-badge clause

Dependency order. Each task names its artifact and its check.

## Phase 0 — baseline

- [ ] 0.1 Create `aar.md` skeleton with the recorded baseline: `check:fast`
      40/40; `test:competitive-gaps` 30/30; `test:backfill` 104/104; clean tree.
- [ ] 0.2 Re-confirm the five predicates:
      `spec/02-requirements.md:3243`, `:3249`,
      `spec/appendices-reference.md:1697`, `:2061`,
      `spec/appendices-fixtures.md:963-964`.
- [ ] 0.3 Confirm `F-P6a-19` is the only scheduled row for this section, and no
      row covers the observer clause
      (`grep -n "Player badge calls return" spec/*.md`; `grep -n "observer" spec/audit/review-register.md`).

## Phase 1 — probe (trust boundary: tool-output)

- [ ] 1.1 Write `/tmp/opencode/req196a-probe.ts` (uncommitted) booting three
      configurations: ruleset-free player (Appendix K fixture), ruleset-bound
      player (seed package + `manage_ruleset (action: bind)`, per
      `test-competitive-gaps.ts:493-505`), and ruleset-free `observer`.
- [ ] 1.2 Capture `run_command { action: "execute", command: "xyzzy" }` under
      each badge; copy the probe body and exact output into `aar.md`.
- [ ] 1.3 Gate: ruleset-bound player must be `[FORBIDDEN]` with no nearest-verb
      list; observer must be `[FORBIDDEN]`. If either differs, stop and
      escalate (the observer success path drops F-5.10-2 and the P1 roadmap
      section).

## Phase 2 — spec alignment

- [ ] 2.1 `spec/02-requirements.md:3243`: rewrite REQ-196a's closing sentence to
      qualified badge gating (ruleset-bound GM-only navigation/mutation,
      Player read-only commands; ruleset-free `player` and `game_master`);
      append `_Check:_ T239, T643.`
- [ ] 2.2 Verify the REQ-196a body is one paragraph, ≤800 characters (`wc -m`,
      newline-inclusive), ≤8 sentences.
- [ ] 2.3 `spec/appendices-reference.md:1697`: delete the T239 Player
      ruleset-bound nearest-verb clause; leave the Game Master assertions.
- [ ] 2.4 `spec/appendices-reference.md:2061`: add the T643 unknown-verb
      `[FORBIDDEN]` clause (no `Valid commands include:` list).
- [ ] 2.5 `spec/appendices-fixtures.md:831`: add "(ruleset-free Novel)" to the
      Player-badge heading.
- [ ] 2.6 `spec/appendices-fixtures.md:964`: `[NOT_FOUND]` → `[UNIMPLEMENTED]`.
- [ ] 2.7 `spec/02-requirements.md:3249`: qualify REQ-196c's unrecognized-command
      sentence with the ruleset-bound Player badge gate (REQ-309b).

## Phase 3 — harness

- [ ] 3.1 `holonovel/scripts/test-competitive-gaps.ts:493-505`: add the
      unknown-verb `FORBIDDEN` assertion (and absence of
      `Valid commands include:`) inside the existing Player badge window.
- [ ] 3.2 Run `test:competitive-gaps` and `test:backfill`; record output in
      `aar.md`.

## Phase 4 — bookkeeping

- [ ] 4.1 `spec/audit/review-register.md`: move `F-P6a-19` to a dated
      `## Resolved` group with its predicate and the T239/T643 bindings.
- [ ] 4.2 `spec/audit/review-register.md`: add `F-5.10-2` to
      `## Scheduled-roadmap` with the `requireNotObserver` predicate, the probe
      output, and the ROADMAP section name.
- [ ] 4.3 `ROADMAP.md`: delete the closed section; add the P1 observer section
      and the P2 `command`→`run_command` naming-repair section (each 1–3
      bullets + a trigger).
- [ ] 4.4 `CHANGELOG.md`: add the dated first entry.
- [ ] 4.5 `npm run validate -- --write-register` to refresh
      `spec/audit/req-coverage.md`.

## Phase 5 — verify and commit

- [ ] 5.1 `npm run assemble`.
- [ ] 5.2 `npm run check:fast` un-piped → `check:fast: PASS`.
- [ ] 5.3 `npm run validate:sdd` → 0 errors.
- [ ] 5.4 `npm run check-registers:strict`, `npm run check-roadmap`,
      `npm run check-loop-artifacts` → pass.
- [ ] 5.5 Complete `aar.md` (baseline, probe, deviations, dispositions,
      `deployed: not applicable`, terminal token).
- [ ] 5.6 `npm run session:close`; confirm `git status --porcelain` empty.
