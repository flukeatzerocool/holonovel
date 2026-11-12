# Tasks — §5.10 parser tool-name drift

Increment: `docs/plans/2026-11-11-5-10-parser-tool-name-drift/`
Plan: `plan.md` · AAR: `aar.md`
Status: complete (2026-11-11)

## Phase 0 — baseline and re-confirmation

- [x] 0.1 Record the baseline in `aar.md`: `check:fast` 40/40 PASS
      (`check:fast: PASS`), clean tree, 53 unpushed commits, 15 open roadmap
      items, version `2026.11.11`.
- [x] 0.2 Re-grep each edited location and confirm the plan matches:
      `spec/01a-constitution.md:141`; `spec/02-requirements.md:3199-3203`,
      `:3243`, `:3252`, `:3263`, `:3271`, `:3277`, `:3283`, `:3285`, `:3290`,
      `:3293`, `:3296`, `:3299`, `:3323`, `:3331`, `:3333`, `:3336`, `:3339`,
      `:3415`–`:3433`, `:3454`, `:3465`, `:3468`;
      `spec/appendices-fixtures.md:778-790` (Appendix W preamble);
      `spec/appendices-reference.md:1721`. Stop and report on any mismatch.
- [x] 0.3 Re-run the body-length measurement and record every affected body's
      current length; confirm REQ-309b is the only one near 800 (798) and
      REQ-196a is 754.
- [x] 0.4 Confirm `check-fingerprint-sync` is green at baseline, so later drift
      is attributable to this increment.

## Phase 1 — detector (D5), red test first

- [x] 1.1 Add failing assertions to `scripts/test-req-checks.ts`: a body with
      `` `command` `` as a tool (flagged), a body with the MCP `command` key
      (clean), a body with "parser command" prose (clean).
- [x] 1.2 `npm run test:validators` — record the failure; stop if the fixture
      cannot be made to fail.
- [x] 1.3 Implement `checkToolTokenDrift(bodies, allow)` in
      `scripts/lib/req-checks.ts` and call it from
      `scripts/tool-citation-check.ts`; allowlist = REQ-221b, REQ-330a,
      REQ-385a. No section filter.
- [x] 1.4 Corpus run: `npm run tool-citation-check` and classify every finding.
      Expect exactly the 26 §5.10 bodies. If benign > true, do not land the
      detector; record the rate and the `Closed-P3` disposition.

## Phase 2 — §5.10 normative prose (D1)

- [x] 2.1 §5.10 section prose: `:3199-3200` ("the `command` tool") and `:3203`
      ("the parser `command` SHALL be").
- [x] 2.2 REQ-196a (`:3243`) — one bare token, 754 → 758.
- [x] 2.3 REQ-196d (`:3252`), REQ-283b (`:3263`), REQ-284b/d/f (`:3271`,
      `:3277`, `:3283`).
- [x] 2.4 REQ-316a (`:3285`), REQ-317a–d (`:3290`–`:3299`).
- [x] 2.5 REQ-319d (`:3323`), REQ-320c (`:3331`), REQ-197a–c
      (`:3333`–`:3339`).
- [x] 2.6 REQ-309b–h (`:3415`–`:3433`). REQ-309b is 798 with three bare tokens:
      `run_command` (+4), "never the parser" (−2), `run_command` (+4), drop the
      redundant "(B1=`none`)" (−10) → 794. Re-measure and record.
- [x] 2.7 REQ-327a (`:3454`), REQ-367b1/b2 (`:3465`, `:3468`).
- [x] 2.8 Confirm `:900`, `:1542`, `:1826`, `:3906`, `spec/03-build.md:152`,
      `:395-414`, and Appendix W's wire lines are unchanged.

## Phase 3 — notation clause (D3)

- [x] 3.1 "the Appendix T test catalog" → "the Appendix F test catalogue" at
      `spec/01a-constitution.md:141`.
- [x] 3.2 Add the exclusion: admissible in golden transcripts
      (Appendices B/C/N/W/X) and test-assertion prose (Appendix F and the §6
      verification steps that restate it), never in §5 normative text, and name
      the three tracked exceptions (REQ-221b, REQ-330a, REQ-385a).
- [x] 3.3 Confirm `spec/03-build.md:1804`–`:1898` falls inside the clause; no
      text change expected.

## Phase 4 — Appendix W and T261 (D4)

- [x] 4.1 Add the preamble sentence to Appendix W: tool lines use the §4
      fixture notation; `command("X")` is `run_command (action: execute, "X")`.
      (Executed per plan rev 2 — no wire line was rewritten.)
- [x] 4.2 Re-word T261 (`spec/appendices-reference.md:1721`) to assert the
      expected prefix and interaction, naming `run_command (action: execute)`
      where it previously said "tool name".
- [x] 4.3 Confirm no wire line in Appendix W changed.

## Phase 5 — regeneration and verification

- [x] 5.1 `npm run assemble`; confirm both `holonovel.md` and
      `holonovel/holonovel.md` are rewritten.
- [x] 5.2 `npm run check:fast` — capture the un-piped exit status and the
      `check:fast: PASS` line.
- [x] 5.3 Scoped greps (`awk 'NR>=3158 && NR<3505'` over
      `spec/02-requirements.md`), expected empty: `` `command` `` and
      `command("`. Spec-wide, expect exactly `:900`, `:1542`, `:1826`, `:3906`.
- [x] 5.4 `npm run validate --sdd-strict` — one paragraph, <=800 chars, <=8
      sentences per edited body; record final lengths in `aar.md`.
- [x] 5.5 `npm run validate -- --write-register`.
- [x] 5.6 `npm run test:validators` and `npm run tool-citation-check` green.
- [x] 5.7 Confirm `check-tool-surface`, `action-conflicts`,
      `check-tool-definitions-sync` green.
- [x] 5.8 `check-fingerprint-sync` green **without** regeneration; confirm
      `git diff --stat` touches no fingerprinted section.
- [x] 5.9 Confirm `npm run check-loop-artifacts` passes (needs `aar.md`).

## Phase 6 — close

- [x] 6.1 Remove the §5.10 roadmap section; add the fingerprinted-token
      roadmap section naming the suffixed IDs `REQ-221b`, `REQ-330a`,
      `REQ-385a` (exact-token match, `scripts/lib/register-checks.ts:64-68`),
      with a Trigger covering both fingerprint tiers.
- [x] 6.2 Add F-P6a-20 (`Resolved`, §5.10) and the deferral finding
      (`Scheduled-roadmap`, §5.6/§5.16) to `spec/audit/review-register.md`, each
      with a `file:line` predicate and a date.
- [x] 6.3 Write the `CHANGELOG.md` entry dated `2026-11-11`, including the
      D3/D4 deviation from the roadmap's "re-point" instruction.
- [x] 6.4 Write `aar.md`; it must end `LOOP PAUSED` or `LOOP OPEN`.
- [x] 6.5 `npm run check-registers` and `npm run check-roadmap`.
- [x] 6.6 One commit for the increment (`npm run session:close`).
