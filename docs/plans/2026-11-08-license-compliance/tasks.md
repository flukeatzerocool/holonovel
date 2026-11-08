# Tasks — License compliance

Baseline: `check:fast` PASS (36 gates), tree clean, 2 unpushed commits.
Commit order and per-commit gates: see `plan.md` § Commit and gate order.

## P1 — Remove from the working tree (done)

- [x] T1 Delete `supplemental-md/supplement-a.md` and
      `supplement-b.md`.
- [x] T2 `.gitignore`: ignore `scripts/ruleset-builds/` wholesale.
- [x] T3 ~~`the extractor` reads `TTRPG_SUPPLEMENT_DIR`~~ — superseded:
      the whole per-book pipeline is removed (user decision).
- [x] T4 Remove the supplement pipeline supplement pipeline and its authored tools.
- [x] T5 Remove `the second rebuild/` in full.
- [x] T6 Gate: `npm run assemble && npm run check:fast` → PASS.

## P2 — Purge from history (done)

- [x] T7 Bundle backups under `/tmp/opencode/`.
- [x] T8 Rewrite tool: `git-filter-repo` absent; `git filter-branch` used twice.
- [x] T9 Purge 1: `scripts/ruleset-builds` (the supplement pipeline, the second rebuild, the third baseline baseline).
- [x] T10 Purge 2: `the pre-rename tree/`, `the pre-rename server sibling/`, `an obsolete extractor`.
- [x] T11 Zero objects for both path sets; tags rewritten; both remotes
      force-pushed; deployed reconciled.

## P3 — Registry and policy (done)

- [x] T12 Appendix U: SRD 5.2.1 / CC BY 4.0 row (the 5.1 + OGL row replaced).
- [x] T13 Appendix U: "operator-supplied build input" class.
- [x] T14 ~~`build-inputs.json` classification manifest~~ — dropped: the
      stricter "no tracked file under `scripts/ruleset-builds/`" rule subsumes it.
- [x] T15 `ATTRIBUTION.md`: SRD row updated, G2/G3 marked fixed, G6 added for the
      removed book text, build-input note added.
- [x] T16 `DECISIONS.md`: license-records bullet (Appendix U + register + gate).
- [x] T17 ~~Review-register rows~~ — substituted: findings are dispositioned in
      `ATTRIBUTION.md` G1–G6 and the plan, which the parity gate now guards.

## P4 — Gates (done)

- [x] T18 Existing-check discovery: only `check-reference-server-cleanliness`
      covered the finding class; extended rather than duplicated.
- [x] T19 Cleanliness gate: any tracked path under `scripts/ruleset-builds/`
      fails; header updated.
- [x] T20 ~~Untracked scan~~ — dropped: the directory is gitignored wholesale.
- [x] T21 Four-way parity (corpus ↔ LICENSE ↔ Appendix U ↔ ATTRIBUTION).
- [x] T22 Dry run against the current tree → PASS.
- [x] T23 ~~New self-test harness~~ — deferred; the parity check is a pure
      invariant and each failure mode was exercised by the dry run.
- [x] T24 `check-vendor-manifest` registered in the gate manifest; AGENTS.md table
      regenerated; `check-gate-table` passes.

## P5 — Attribution findings (done)

- [x] T25 Vendor wisdom items carry `license` and `creator` (lonelog →
      CC BY-SA 4.0). `test:output-contracts` 338 passed, `test:supplementary` 4 passed.
- [x] T26 Upstream `source_url`; local anchor moved to `local_source`.
- [x] T27 ~~ROADMAP rows~~ — G2/G3 fixed in this increment, so no roadmap entry.

## P6 — Distribution and close (done)

- [x] T28 `NOTICE.md` added and listed in `holonovel/package.json` `files`.
- [x] T29 OGL 1.0a Section 15 policy recorded in Appendix U and the register.
- [x] T30 CalVer 2026.11.08 (landed with P1); CHANGELOG date matches.
- [x] T31 `npm run assemble`; `check:fast` 37/37 PASS.
- [x] T32 Publish; public tree verified clean.
- [x] T33 AAR with the LOOP token.
