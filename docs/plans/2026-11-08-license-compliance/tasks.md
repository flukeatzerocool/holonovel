# Tasks — License compliance

Baseline: `check:fast` PASS (36 gates), tree clean, 2 unpushed commits.
Commit order and per-commit gates: see `plan.md` § Commit and gate order.

## P1 — Remove from the working tree (done)

- [x] T1 Delete `supplemental-md/thundercats-campaign.md` and
      `thundercats-adventures.md`.
- [x] T2 `.gitignore`: ignore `scripts/ruleset-builds/` wholesale.
- [x] T3 ~~`extract-thundercats.mjs` reads `TTRPG_SUPPLEMENT_DIR`~~ — superseded:
      the whole per-book pipeline is removed (user decision), so no in-repo
      extractor remains.
- [x] T4 Remove the dnd2024 supplement pipeline and its authored tools.
- [x] T5 Remove `swse/` in full.
- [x] T6 Gate: `npm run assemble && npm run check:fast` → PASS.

## P2 — Purge from history (done)

- [x] T7 `git bundle create /tmp/opencode/holonovel-pre-purge.bundle --all` (11 MB).
- [x] T8 Rewrite tool resolved: `git-filter-repo` absent; used
      `git filter-branch --index-filter` (recorded per plan step 7).
- [x] T9 Rewrite with `--invert-paths` equivalent (`git rm -r --cached`) over
      `scripts/ruleset-builds` — the whole path, covering dnd2024, swse, and the
      historical robotech baseline.
- [x] T10 Tags rewritten (`--tag-name-filter cat`); `git log main -- <path>`
      empty; `git rev-list --objects --all | grep ruleset-builds` → 0.
- [x] T11 Force-push origin + github; deployed re-cloned (`reset --hard`),
      `.holonovel-state/` preserved.

## P3 — Registry and policy (Commit B)

- [ ] T12 Appendix U: SRD 5.2.1 / CC BY 4.0 row (or split).
- [ ] T13 Appendix U: "operator-supplied build input" class.
- [ ] T14 `docs/licenses/build-inputs.json` classification manifest.
- [ ] T15 `ATTRIBUTION.md` rows and terminal dispositions for G1–G5.
- [ ] T16 `DECISIONS.md` single decision line. (Partial: content-boundary bullet
      updated with P1; the register line is still open.)
- [ ] T17 `spec/audit/review-register.md` rows for R1–R19.

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
- [ ] T30 `npm run version-bump` (done early for P1: 2026.11.08); CHANGELOG
      heading date equals the CalVer.
- [ ] T31 `npm run assemble`; `validate --sdd-strict` clean.
- [ ] T32 Publish; verify 13 README rows and a clean wiki mirror.
- [ ] T33 AAR with LOOP token; review-register update; `session:close`.
