# Tasks — License compliance

Baseline: `check:fast` PASS (36 gates), tree clean, 2 unpushed commits.
Commit order and per-commit gates: see `plan.md` § Commit and gate order.

## P1 — Remove from the working tree (Commit A)

- [ ] T1 Delete `supplemental-md/thundercats-campaign.md` and
      `thundercats-adventures.md`.
- [ ] T2 `.gitignore`: ignore `*.md` inside `supplemental-md/`, negate `.gitkeep`.
- [ ] T3 `extract-thundercats.mjs` reads `TTRPG_SUPPLEMENT_DIR`, exits 1 when
      unset.
- [ ] T4 Sanitize naming/derived data in `authored/`, `deploy.mjs`,
      `annotate-thundercats.mjs`, `build-package.mjs`, `provenance.json`,
      `scripts/update.ts`, `spec/audit/*`, `DECISIONS.md`, the two `plans/` files.
- [ ] T5 Resolve `swse/` per the open question.
- [ ] T6 Gate: `npm run assemble && npm run check:fast`.

## P2 — Purge from history (approval-gated, no commit)

- [ ] T7 `git bundle create ../holonovel-pre-purge.bundle --all`; tag
      `pre-license-purge`.
- [ ] T8 Resolve the rewrite tool: `git-filter-repo` installed, `npx`, or
      `filter-branch` fallback.
- [ ] T9 Rewrite with `--invert-paths` over the confirmed paths.
- [ ] T10 Retag `v2026.11.07`; verify `git log --all -- <paths>` empty.
- [ ] T11 Force-push origin + github; re-clone deployed; verify from the bundle.

## P3 — Registry and policy (Commit B)

- [ ] T12 Appendix U: SRD 5.2.1 / CC BY 4.0 row (or split).
- [ ] T13 Appendix U: "operator-supplied build input" class.
- [ ] T14 `docs/licenses/build-inputs.json` classification manifest.
- [ ] T15 `ATTRIBUTION.md` rows and terminal dispositions for G1–G5.
- [ ] T16 `DECISIONS.md` single decision line.
- [ ] T17 `spec/audit/review-register.md` rows for R1–R19 (check-registers,
      check-traceability).

## P4 — Gates (Commit C)

- [ ] T18 Existing-check discovery: grep `scripts/` for a sibling check; record
      the command and result.
- [ ] T19 `check-reference-server-cleanliness.ts`: classification, LICENSE and
      Appendix U requirements, no tracked operator-supplied path.
- [ ] T20 Untracked scan: `git ls-files --others --exclude-standard` under
      `scripts/ruleset-builds/` must be empty.
- [ ] T21 Four-way parity check in the same gate.
- [ ] T22 Dry run against the current tree; resolve or record every finding.
- [ ] T23 `scripts/test-reference-server-cleanliness.ts` with three fixtures;
      wire into a `package.json` script.
- [ ] T24 Register the gate and `check:vendor` in `scripts/lib/gate-manifest.ts`;
      regenerate the AGENTS.md gate table.

## P5 — Attribution findings (Commit D)

- [ ] T25 `wisdom.ts` vendor items carry `license` and `creator` (CC BY-SA 4.0
      on lonelog items); update `test-output-contracts.ts`.
- [ ] T26 `wisdom.ts` upstream `source_url`, local anchor in its own field;
      reconcile existing assertions.
- [ ] T27 `ROADMAP.md` G2/G3 rows or recorded closure; matching review-register
      rows updated in the same step.

## P6 — Distribution and close (Commit E)

- [ ] T28 `NOTICE` in the tarball and in `holonovel/package.json` `files`.
- [ ] T29 OGL 1.0a Section 15 policy recorded.
- [ ] T30 `npm run version-bump`; CHANGELOG heading date equals the CalVer.
- [ ] T31 `npm run assemble`; `validate --sdd-strict` clean.
- [ ] T32 Publish; verify 13 README rows and a clean wiki mirror.
- [ ] T33 AAR with LOOP token; review-register update; `session:close`.
