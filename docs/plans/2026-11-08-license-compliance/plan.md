# Plan — Remove non-licensed TTRPG text and enforce license compliance

**Status:** approved, executing · **Date:** 2026-11-08 · **Depth:** deep
**Review independence:** self · **Rollback cost:** 2

## Done bar

**Done bar:** no tracked path under `scripts/ruleset-builds/` carries third-party
rulebook prose; the two the supplement files are absent from the worktree, from
`git log --all -- <path>`, and from a clone of the bundled backup repository;
every tracked build input is classified in `docs/licenses/build-inputs.json`;
the license gate fails on a fixture that adds an unclassified file, on a tracked
`operator-supplied` path, and on an untracked non-ignored file under
`scripts/ruleset-builds/`; the four-way parity check (vendored dir ↔ LICENSE ↔
Appendix U ↔ ATTRIBUTION.md) passes; `check:fast`, `check`, and
`test:package-smoke` exit 0; the deployed instance is re-cloned from the rewritten
origin and running; the increment lands with plan/tasks/AAR and a LOOP token.

## Evidence (root cause)

1. `scripts/ruleset-builds/the supplement pipeline’s supplemental-md`
   (745,960 B) and `supplement-b.md` (320,997 B) reproduce a commercial
   book — foreword, credits, chapter prose — verbatim.
2. Both are tracked (`git ls-files`) and introduced in `ad08fa2` (2026-10-03).
   The GitHub remote resolves as `Public`, 687 commits, so the text is published.
3. The files' own header cites SRD 5.2.1/CC BY 4.0. That notice covers SRD
   material the book uses; it does not license the book, whose credits place ©
   with the publisher and supplement ™/© Warner Bros. and Ted Wolf.
4. `.gitignore:20-22` already excludes `*/package/` and
   `the extraction output` — extraction output was kept out, source text was not.
5. `scripts/ruleset-builds/the second rebuild/` (9,877 B) is labelled "a non-open ruleset
   rules reference", has no Appendix U row, and names a trademarked product.
6. Appendix U records SRD v5.1 + OGL 1.0a (`spec/appendices-licenses.md:9`) while
   the build scripts use 5.2.1 + CC BY 4.0 — the registry is stale.
7. `check-reference-server-cleanliness.ts` allowlists build **slugs**
   (`the supplement pipeline`, `the second rebuild`) and package triples; it never inspects file content, and
   it reads `git ls-files` only, so an untracked local copy is invisible to it.
8. `check:vendor` (`holonovel/package.json:110`) exists but no gate in
   `scripts/lib/gate-manifest.ts` runs it, so the hash pins that prove "byte
   identical" are advisory.
9. `check-registers` reads only `spec/audit/review-register.md` and
   `spec/audit/proofread-register.md`; `docs/licenses/ATTRIBUTION.md` is outside
   every gate, so G2/G3 can rot silently.
10. `git-filter-repo` is **not installed** (`command -v` → missing), so the
    history-rewrite step needs an install or a `filter-branch` fallback.
11. Baseline at plan time: `npm run check:fast` PASS (36 gates), tree clean, two
    unpushed commits, five open roadmap items.

## Findings register (everything raised this session)

| ID | Severity | Finding | Phase |
|---|---|---|---|
| R1 | P0 | 1.07 MB of commercial the supplement book text is tracked and published | P1 |
| R2 | P0 | The build reads its input from an in-tree path, so deletion breaks it unless a source path is introduced | P1 |
| R3 | P0 | Deleting at HEAD leaves the text in every prior commit and on both remotes | P2 |
| R4 | P0 | the supplement naming and derived data persist in adjacent build files, `scripts/update.ts`, `spec/audit/*`, `DECISIONS.md`, and two `plans/` files | P1 |
| R5 | P1 | `the second rebuild/` has no Appendix U row and names a non-open, trademarked product | P1 |
| R6 | P1 | Appendix U is stale: SRD v5.1/OGL 1.0a recorded, 5.2.1/CC BY 4.0 used | P3 |
| R7 | P1 | Appendix U has no class for "operator-supplied, never committed" build input | P3 |
| R8 | P1 | No gate classifies tracked build inputs; the slug allowlist is the only control | P4 |
| R9 | P1 | `check:vendor` is not in the gate manifest | P4 |
| R10 | P1 | G3 — lonelog-derived wisdom items carry no CC BY-SA label | P5 |
| R11 | P2 | G2 — `source_url` holds repo-relative paths, so attribution is not actionable in an exported Novel | P5 |
| R12 | P1 | G2/G3 are marked "Scheduled" with no `ROADMAP.md` row | P5 |
| R13 | P2 | No four-way parity between vendored dir, LICENSE, Appendix U, and the register | P4 |
| R14 | P2 | The npm tarball has no third-party `NOTICE` file; attribution rides on README only | P6 |
| R15 | P3 | No OGL 1.0a Section 15 policy recorded for the day a package ships from this repo | P6 |
| R16 | P2 | License facts have no recorded decision, inviting a drifting third copy | P3 |
| R17 | P2 | The published README footer lists 12 sources (COF missing) and the mirror lags `83a0984` | P6 |
| R18 | P1 | The content-boundary gate cannot see untracked local copies (`git ls-files` only) | P4 |
| R19 | P1 | `git-filter-repo` is absent; the rewrite step is unexecutable as first drafted | P2 |

Trust boundary: R1–R5 and the second rebuild decision rest on **user** confirmation of
licensing rights; all other premises are **repo**-sourced.

## Blast radius

| File / surface | Change | Size |
|---|---|---|
| `scripts/ruleset-builds/the supplement pipeline/supplemental-md/*.md` | delete (operator-supplied instead) | L |
| `scripts/ruleset-builds/the supplement pipeline/the extractor` | source path from `TTRPG_SUPPLEMENT_DIR`, refuse when absent | S |
| `scripts/ruleset-builds/the supplement pipeline/*` (authored, deploy, annotate, build, provenance) | neutral naming, provenance refresh | M |
| `scripts/ruleset-builds/the second rebuild/*` | re-author/label, or de-track (user decision) | S |
| `.gitignore` | ignore the input files, not the directory (keep `.gitkeep` trackable) | S |
| `spec/appendices-licenses.md` | SRD row, third content class, gate reference | M |
| `docs/licenses/build-inputs.json` (new) | classification manifest | M |
| `docs/licenses/ATTRIBUTION.md` | R6/R7 rows, finding dispositions | S |
| `scripts/check-reference-server-cleanliness.ts` | classification, tracked/untracked scan, four-way parity | M |
| `scripts/test-reference-server-cleanliness.ts` (new) | gate self-tests (harness role) | M |
| `scripts/lib/gate-manifest.ts` + `package.json` (root) + `holonovel/package.json` | register the new gate/self-test and `check:vendor` | S |
| `AGENTS.md` | regenerate the gate table (`npm run gates -- --list --format=md`) | S |
| `holonovel/src/core/wisdom.ts` | `license`/`creator` fields, upstream `source_url` | M |
| `holonovel/scripts/test-output-contracts.ts` | assert the new wisdom fields | S |
| `spec/audit/review-register.md` | finding rows and dispositions | S |
| `ROADMAP.md` | rows for G2/G3 or their closure | S |
| `holonovel/DECISIONS.md` | one decision line | S |
| `CHANGELOG.md` + version stamp | dated entry; CalVer advance via `version-bump` | S |

Rollback cost: 2 (history rewrite is irreversible without the restore bundle).

## Alternatives considered

1. **Delete at HEAD only, leave history.** Rejected: the text stays fetchable
   from every clone and from GitHub; exposure unchanged.
2. **Keep the text and add a license row.** Rejected: no license grants
   redistribution of that book; a row would manufacture false compliance.
3. **New `check-content-boundary` script.** Rejected for R8: the cleanliness gate
   already owns the reference-server content boundary and the slug allowlist, so
   the finding class belongs there (AGENTS.md existing-check discovery).
4. **Heuristic content scan (size threshold, © detection).** Rejected as the
   primary control: brittle, false-positive prone. An explicit classification
   manifest fails closed; no false-positive budget is needed because the check is
   not heuristic.
5. **Put the license register in `DECISIONS.md`.** Rejected: `DECISIONS.md`
   carries decisions with a governing REQ, not registers; a third copy drifts.
6. **Add a new REQ for the build-input boundary.** Not now: Appendix U already
   carries the admission rule. Extending its prose avoids coverage-map, test-ID,
   and fingerprint consequences. Revisit if the rule becomes enforceable behavior.

## Commit and gate order

A history rewrite cannot ride the push pipeline (`git add -A`, fast-forward
push), so it is a separate manual operation. Sequence:

1. **Commit A** — P1 tree removal + naming sanitization + `.gitignore`.
   Gate: `npm run assemble && npm run check:fast`.
2. **Rewrite (no commit)** — P2: bundle backup, `filter-repo`/`filter-branch`,
   retag, verify, force-push. Gate: `git log --all -- <paths>` empty; local bundle
   clone greps clean.
3. **Commit B** — P3 registry and policy. Gate: `check:fast` (validate, lint,
   check-registers).
4. **Commit C** — P4 gates and self-tests. Gate: `check:fast`, including the new
   self-test and the regenerated AGENTS.md gate table.
5. **Commit D** — P5 attribution fields and ROADMAP rows. Gate: `check:fast`,
   `holonovel/scripts/test-output-contracts.ts`.
6. **Commit E** — P6 NOTICE, OGL policy, version bump, CHANGELOG, AAR.
   Gate: `npm run check`, `test:package-smoke`, `session:close`.

## Steps

Phases run in order; P2 gates on user approval and a verified backup.

### P1 — Remove from the working tree

1. Delete `scripts/ruleset-builds/the supplement pipeline’s supplemental-md`
   and `supplement-b.md` (R1).
2. `.gitignore`: ignore `scripts/ruleset-builds/*/supplemental-md/*.md` (not the
   directory) and negate the keep-file
   `!scripts/ruleset-builds/*/supplemental-md/.gitkeep`; commit the `.gitkeep`
   (R2).
3. Repoint `the extractor:21` at `TTRPG_SUPPLEMENT_DIR`; exit 1 with an
   operator instruction when unset (R2).
4. Sanitize R4: neutral package slug and labels in `authored/the authored tools file`,
   `the annotator`, `deploy.mjs`, `build-package.mjs`,
   `provenance.json`, `scripts/update.ts`, `spec/audit/*`, `holonovel/DECISIONS.md`,
   `plans/2026-10-03-convert-build-hardening.md`,
   `plans/2026-10-10-ruleset-rebuild-emitter-stress-test.md`. Delete derived
   artifacts rather than re-describing them.
5. Resolve `the second rebuild/` (R5) per the open question.

### P2 — Purge from history (destructive, approval-gated)

6. `git bundle create ../holonovel-pre-purge.bundle --all`; tag locally
   `pre-license-purge`. Restore path if needed:
   `git fetch ../holonovel-pre-purge.bundle 'refs/*:refs/restore/*'`.
7. Resolve the rewrite tool (R19): install `git-filter-repo` (pipx/apt) or run
   `npx git-filter-repo`; if neither is available, fall back to
   `git filter-branch --index-filter 'git rm -r --cached --ignore-unmatch <paths>'`.
   Record which path was used.
8. Rewrite: `--invert-paths` over `scripts/ruleset-builds/the supplement pipeline/supplemental-md`
   and any path dropped in step 5.
9. Retag `v2026.11.07`; confirm `git log --all -- <paths>` is empty and the tree
   builds.
10. Force-push `main` to `origin` (git.gay) and `github` with
    `--force-with-lease`; confirm zero forks first; re-clone the deployed instance
    and preserve `.holonovel-state/` (REQ-396).
11. Record the residual risk: any clone taken before today retains the text.

### P3 — Registry and policy

12. Appendix U: replace the SRD row with the version and license actually used
    (SRD 5.2.1 / CC BY 4.0), or split rows if OGL 5.1 content remains (R6).
13. Appendix U: add the third content class, "operator-supplied build input —
    never committed, resolved from the environment" (R7).
14. `docs/licenses/build-inputs.json`: one entry per tracked build path with
    `class: authored | redistributable | operator-supplied`.
15. `docs/licenses/ATTRIBUTION.md`: rows or "not distributed" markers for each
    retained build source, and terminal dispositions for G1–G5 (R6/R7).
16. `holonovel/DECISIONS.md`: one line naming Appendix U + ATTRIBUTION.md as the
    two records and the gate as enforcement (R16).
17. Update every cross-referencing register in the same step (check-registers,
    check-traceability): `spec/audit/review-register.md` rows for R1–R19.

### P4 — Gates

18. **Existing-check discovery:** grep `scripts/` for any other script asserting
    build-input classification or vendored-license parity; confirm none, and
    record the command and result in the AAR.
19. Extend `check-reference-server-cleanliness.ts`: every tracked path under
    `scripts/ruleset-builds/**` must appear in `build-inputs.json`; a
    `redistributable` path requires an Appendix U row and a LICENSE; an
    `operator-supplied` path must not be tracked (R8). Add the untracked scan:
    `git ls-files --others --exclude-standard` under `scripts/ruleset-builds/`
    must be empty (R18).
20. Add the four-way parity check (vendored dir ↔ LICENSE ↔ Appendix U ↔
    ATTRIBUTION.md) to the same gate (R13).
21. **Dry run before promising green:** run the extended gate against the current
    tree and resolve or record every finding from step 14's classification;
    report the finding count in the AAR.
22. Add `scripts/test-reference-server-cleanliness.ts` (harness role: shebang,
    role header, exit codes, wired into a `package.json` script) with fixtures for
    an unclassified file, a tracked `operator-supplied` path, and an untracked
    non-ignored file.
23. Register the gate and `check:vendor` in `scripts/lib/gate-manifest.ts`
    (fast + full); regenerate the AGENTS.md gate table with
    `npm run gates -- --list --format=md`; `check-gate-table` must pass (R9).

### P5 — Close the open attribution findings

24. `wisdom.ts`: add `license` and `creator` to vendor items; lonelog items carry
    CC BY-SA 4.0 (R10). Update `holonovel/scripts/test-output-contracts.ts` for the
    new fields; reconcile existing assertions on item shape.
25. `wisdom.ts`: upstream `source_url`, local anchor in a separate field (R11).
26. `ROADMAP.md`: add G2/G3 sections, or record their closure here (R12), and
    update the matching Scheduled-roadmap rows in `spec/audit/review-register.md`.

### P6 — Distribution surfaces and close

27. Ship a `NOTICE` file in the tarball and add it to `holonovel/package.json`
    `files` (R14).
28. Record the OGL 1.0a Section 15 policy in Appendix U or the register (R15).
29. Version stamp: `npm run version-bump` so CalVer, CHANGELOG date, `AGENTS.md`,
    `DECISIONS.md`, `index.ts`, lockfile, and `server.json` advance together
    (REQ-107a) — the CHANGELOG heading date must equal the package version.
30. `npm run assemble` after every `spec/` edit; `validate --sdd-strict` clean.
31. Publish, then verify the README footer carries all 13 sources and the wiki
    mirror carries no copied TTRPG text (R17).
32. Write the AAR with the LOOP token; update the review register.

## Risks / edge cases

- **History rewrite breaks continuity.** All SHAs after `ad08fa2` change; the
  Holosuite provenance pins (`git_sha`) no longer resolve and their evidence must
  be regenerated. Tags must be re-pointed.
- **Deploy pipeline.** `git pull --ff-only` cannot fast-forward across a rewrite;
  the deployed clone must be re-cloned, preserving `.holonovel-state/` (REQ-396).
- **GitHub object retention.** Unreachable objects may persist; with zero forks a
  support request is the escalation path.
- **Push-pipeline assumptions.** It stages with `git add -A` and pushes
  fast-forward; the rewrite is manual and precedes the next publish.
- **Two unpushed commits today.** Rewrite first, then rebase them on top.
- **Licence reversal.** If the user holds redistribution rights, R1/R3 downgrade
  to "register in Appendix U and attribute".
- **Gate false negatives.** Classification is by manifest, not content scanning,
  so prose pasted into a classified file passes; the review checklist keeps the
  no-rulebook-prose rule visible.
- **Transient red gate.** Creating this increment makes `check-loop-artifacts`
  fail ("missing aar.md") until the AAR lands; do not commit before it does.

## Verification

1. `git ls-files scripts/ruleset-builds` shows no `.md` under `supplemental-md/`.
2. `git log --all -- scripts/ruleset-builds/the supplement pipeline/supplemental-md` is empty.
3. Substitute for a network clone: `git clone ../holonovel-pre-purge.bundle
   /tmp/verify && grep -ri "supplement 5.5e" /tmp/verify` is empty; repeat against
   the live remotes after the push.
4. `npx tsx scripts/test-reference-server-cleanliness.ts` passes, and each
   fixture fails for the expected reason.
5. `npx tsx holonovel/scripts/check-vendor-manifest.ts --strict` passes.
6. `npm run check:fast`, `npm run check`, `npm run test:package-smoke` exit 0.
7. Deployed instance re-cloned; `open_session` resumes `torre-nosferatu`.

## Delta amendment 2 — 2026-11-08 (the pre-rename tree history purge)

User-directed scope addition: purge the historical `the pre-rename tree/` tree (1,072 files of
converted SRD rules text from the repo's pre-rename era), `the pre-rename server sibling/`
(13 files), and `an obsolete extractor`.

- **R22.** Add a second rewrite: backup bundle, `git filter-branch` over the three
  paths, `--prune-empty` (early commits that only carried `the pre-rename tree/` disappear),
  retag, verify, force-push both remotes, reconcile the deployed clone.
- SRD 5.1 text is openly licensed, so this is a content-boundary policy purge,
  not a legal-exposure one; it is user-directed and recorded as such.
- Not purged: `inform/` (17 files, Artistic 2.0 conventions) — outside the
  instruction.

## Open questions

1. ~~Redistribution rights for the supplement book?~~ **Resolved 2026-11-08:
   none held. R1/R3 proceed as removal.**
2. ~~History rewrite approved?~~ **Resolved 2026-11-08: approved.**
3. ~~`the second rebuild/`: re-author or de-track?~~ **Resolved 2026-11-08: remove entirely.**
4. Is any OGL 1.0a content still in use, or is everything 5.2.1 / CC BY 4.0?

## Delta amendment — 2026-11-08 (the second rebuild removal)

Resolving C-3 (remove `scripts/ruleset-builds/the second rebuild/` entirely) exposed two
dependencies the first draft did not carry:

- **R20.** `holonovel/scripts/test-ruleset-gates.ts` T689 and T737 spawn
  `scripts/ruleset-builds/the second rebuild/build-package.mjs` and read
  `scripts/ruleset-builds/the second rebuild/provenance.json`. Deleting the directory breaks
  both tests. Fix: the test writes a neutral stub emitter plus provenance into
  its own `TMP` directory and spawns that, exercising the shared
  `ruleset-build-kit` behaviour (surface injection, fixed-timestamp determinism,
  provenance population/omission) with no committed the second rebuild artifact. Recorded
  weakening: the test no longer exercises the shipped reference emitter.
- **R21.** `scripts/update.ts` resolves an installed package's emitter through
  `scripts/ruleset-builds/<slug>/build-package.mjs`. Removing `the second rebuild/` makes the
  deployed instance's installed `the second rebuild` package `deferred` with
  "no recorded emitter or source" (`update.ts:112-115`) — accepted, not a
  failure; the installed package stays usable. `the supplement pipeline` rebuilds now require
  `TTRPG_SUPPLEMENT_DIR` (R2).

Additional surfaces in this delta: `scripts/check-reference-server-cleanliness.ts`
allowlist drops `the second rebuild`; `spec/audit/script-quality-baseline.json` drops the second rebuild
emitter entry; `holonovel/DECISIONS.md:384` names `the supplement pipeline` only;
`holonovel/scripts/playtest/authoring.md:25`, `holonovel/scripts/lib/playtest-lib.ts:110`,
and `holonovel/scripts/test-playtest.ts:172-179` stop naming the product;
`spec/appendices-reference.md` T737 drops the `the second rebuild` example. P2's rewrite path
list gains `scripts/ruleset-builds/the second rebuild`.
