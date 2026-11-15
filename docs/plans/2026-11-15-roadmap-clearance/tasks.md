# Tasks — Roadmap clearance

Dependency order. Each task names its proof; a task is done when the proof is
green, not when the edit lands. `plan.md` holds the decisions behind each one.
Commit boundaries are marked; tasks inside a boundary land together.

## Commit 1 — G7 derivation (item 1)

- [ ] **T1.** Write `holonovel/scripts/generate-g7-attestation.ts` **[build tool]**:
  parse the 84 §5.12 headers from `holonovel.md`, classify the two attestation
  bodies (REQ-346a1/a2), read the `§5.12 disposition` column from
  `spec/audit/req-coverage.md`, emit the TS module, write **only the enumeration
  and hash line** between `<!-- g7:start -->`/`<!-- g7:end -->` (prose stays
  outside), and exit 1 on a register/spec disagreement. `--check` exits 1 on
  drift. Proof: `--check` exits 1 before the artifacts exist and 0 after; a
  planted disagreement exits 1 and names the REQ.
- [ ] **T2.** Write `holonovel/src/narrative-coherence.ts` (`parseSection512` +
  pure `narrativeCoherence`) and rewire `holonovel/src/index.ts:372–385` and
  `:15392–15398` to read the shipped spec through `specPath`. Proof:
  `npm run typecheck`; `grep -c G7_ATTESTATION_RECORDED holonovel/src/index.ts` → 0.
- [ ] **T3.** Add `check-g7-attestation` to `scripts/lib/gate-manifest.ts` (fast
  and full) and the `package.json` script. Proof:
  `npm run gates -- --list | grep g7`.
- [ ] **T4.** Add the T403 branches to `holonovel/scripts/test-g7.ts` — full
  attested → `pass`; three parents removed → `partial` with `missing` naming
  them; empty attested + `recorded=false` → `fail`; stale `SPEC_HASH` →
  `partial`. Do **not** touch T396. Proof: `npm --prefix holonovel run test:g7`
  green.
- [ ] **T5.** Regenerate both artifacts; hand-edit the `31/31` line and the "31 of
  31" prose outside the markers. Proof: `npm run check-g7-attestation` → 0;
  `npm run check:fast` 44 passed.

## Commit 2 — Harness test-ID hygiene (item 4)

- [ ] **T6.** Write the mapping table for the 21 padded tokens, the 5 orphans,
  and the 7 collision sites to `/tmp/opencode/id-map.md`. Proof: every row names
  a target catalogue ID or "drop".
- [ ] **T7.** Add `checkHarnessTitleIds()` to `scripts/validate.ts` on top of
  `collectHarnessTestNames()` and dry-run it on the unedited tree. Proof: it
  reports exactly 21 padded + 5 orphan findings, nothing else.
- [ ] **T8.** Apply the title corrections in `test-backfill.ts`,
  `test-persistence.ts`, `test-briefing.ts`, `test-limits.ts`, including the
  seven collision re-labels from B2a. Proof: the rule reports 0 findings.
- [ ] **T9.** Add the two Appendix F preamble sentences (suffixed refinement; no
  zero-padding). Proof: `npm run assemble` and `npm run lint` clean.
- [ ] **T10.** Add three fixtures to `scripts/test-req-checks.ts`. Proof:
  `npm run test:validators` green.
- [ ] **T11.** Re-run the server suite. Proof: `npm --prefix holonovel run test:all`
  → 56 passed, 0 failed.

## Commit 3 — Evidence record and the CI split (item 2)

- [ ] **T12.** Complete the **authored** part of the `narrative_coherence` block to
  §8's six fields plus the three attestation points and the transcript link,
  outside the generated markers. Proof: the block contains all six labels; the
  markers enclose only the enumeration.
- [ ] **T13.** Add the `## CI-only checks` table to `AGENTS.md`, keyed
  `<job>/<step name>`. Proof: eight rows (six gates-job + two container).
- [ ] **T14.** Extend `scripts/check-workflows.ts` with the four-class
  reconciliation; dry-run before the table exists to confirm it reports the
  unclassified CI-only steps. Proof: dry run reports them; after T13, 0.
- [ ] **T15.** Extend `scripts/test-workflows.ts` with a fixture per class plus
  unclassified and stale-table cases. Proof: `npm run test:workflows` green.
- [ ] **T16.** Extend T396 in `holonovel/scripts/test-g7.ts` to assert the six §8
  fields, keeping its three existing substrings. Proof:
  `npm --prefix holonovel run test:g7` green.

## Commit 4 — Anchor fix mode (item 5)

- [ ] **T18.** Add `--check`, the ±40-line ambiguity refusal, and the header/
  usage/exit-code/allowlist updates to `scripts/refresh-predicates.ts`. Proof: a
  scratch file with a duplicated symbol exits 1 with `ambiguous`.
- [ ] **T19.** Add `fix-anchors` and `check-anchors` to `package.json`. Proof:
  both run and print the documented output.
- [ ] **T20.** Add the `check-anchors` and `test:anchor-tooling` gate entries and
  regenerate the AGENTS table. Proof: `npm run check-anchors` at HEAD →
  `predicates current`; `npm run check-gate-table` green.
- [ ] **T21.** Write `scripts/test-anchor-tooling.ts` covering repair, ambiguity,
  out-of-window refusal, and check-before-write. Proof:
  `npm run test:anchor-tooling` green.
- [ ] **T21a.** Replay the class: scratch worktree at `acf7489^`, `--check` (23
  drifts, exit 1), `--write`, `--check` (exit 0). Proof: the two runs' output in
  the AAR.

## Commit 5 — Roadmap close, version sync, AAR

- [ ] **T22.** Remove roadmap items 1, 2, 4, 5; annotate item 3 with "U5 next".
  Proof: `npm run check-roadmap` green; six sections → two.
- [ ] **T23.** Move F-U4-1, F-U4-5, F-U4-7, and F-P8-2 to
  `## Resolved — 2026-11-15`, and add the D2 convention row. Proof:
  `npm run check-registers` green.
- [ ] **T24.** Write the `CHANGELOG.md` entry and `aar.md`. Proof: the AAR ends
  `LOOP PAUSED`.
- [ ] **T25.** Final gate in order: `npm run assemble && npm run check:fast`
  (unpiped, capture the exit code), then `npm run build-order`. Proof:
  `check:fast: PASS` at 45 gates.
- [ ] **T26.** `npm run session:close`. Proof: five commits, tree clean.
