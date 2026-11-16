# Roadmap

<!--
  Admission rule: a `## <title>` section is a scheduled work item. It needs an
  action a maintainer can take, 1–3 bullet lines, and a `**Trigger:**` line
  naming what starts the work or what closes it. Priority order, P0 first;
  remove a section when the work ships (it moves to CHANGELOG.md).

  Standing facts are not roadmap items: accepted tradeoffs, by-design
  limitations, and out-of-scope tracks are recorded in `holonovel/DECISIONS.md`,
  and `## Non-goals` is the pointer to them. `npm run check-roadmap` enforces
  this rule; `## Non-goals` is exempt.
-->

## Loop-gate fix-up rate re-measurement (P2)

- Two weeks after the AAR close gate ships (2026-11-28), re-measure the fix-up
  rate: pair consecutive commits within 15 minutes and count pairs sharing a
  touched path. Baseline 2026-11-08→14: 26 pairs, 15 sharing. Target: ≤7 of
  the next 26.
  Command: `git log --since=<anchor> --format='%H|%ci|%s' --name-only`.
  If unchanged, the gate did not fix the ordering — reopen the diagnosis.

**Trigger:** the date 2026-11-28, or 26 new commits, whichever comes first;
closes when the re-measurement is recorded in the AAR of that session.

## REQ evidence linkage (P1)

- The report-only `checkReqEvidenceLinkage` pass shipped (2026-11-15); triage its
  122 findings to zero, then promote the check to error. A REQ whose `_Check:_`
  cites a T-ID must land on an Automated Appendix F row a harness names, or a
  Manual row whose procedure `DECISIONS.md` documents. Appendix F has no `Gate`
  kind.
- T22, T35, and T103 all have asserting harnesses; the defect class is the 122
  unlinked citations, 99 of them in REQs already whitelisted as builder-side.

**Trigger:** the corpus dry-run list is triaged to zero; closes when the check is
error-mode in `validate`.

## Loop artifact gate ordering (P2)

- Make `validateIncrements` mode-aware: the fast gate warns on a missing `aar.md`
  or `tasks.md` while an increment is in flight, and `session:close` keeps it an
  error. Seventeen of the week's gate failures were this one self-inflicted red.

**Trigger:** 2026-11-22 or the next missing-`aar.md` warning in `check:fast`;
closes when creating an increment directory no longer reddens the baseline.

## Single assembled spec copy (P2)

- Untrack `holonovel/holonovel.md` (written by `assemble`), ignore it, and make
  `prepare-package` fail on divergence instead of overwriting. One tracked copy
  removes 1.79 MB from every spec diff.

**Trigger:** the next `spec/` edit that regenerates the assembled spec; closes
when `git ls-files holonovel/holonovel.md` is empty.

## Split `index.ts` (P2)

- Add `--repath` to `refresh-predicates`, then extract leaf-first: tool registry,
  trust core, dispatch, ruleset surface, world model, synthesis router.
- Each stage is one commit passing `test:all` 56/56; no file above 3,000 lines.

**Trigger:** the next increment that moves more than 50 anchors, or a week with
more than 100 reads of one file.

## Duplicate Appendix F test ID (T553) (P3)

- `T553` is defined twice — `spec/appendices-reference.md:1822` (REQ-284f) and
  `:1984` (REQ-463) — and both rows are exercised by different harness tests
  (`holonovel/scripts/test-output-contracts.ts:2554`, `test-belief.ts:116`), so
  the reader's `Map` silently keeps the last one.
- Renumber one row, update its citation, and rename the matching harness test.

**Trigger:** the next Appendix F edit that adds or renumbers a test ID; closes
when `grep -c '^| T553 ' spec/appendices-reference.md` is 1.

## Bookkeeping derivation (P3)

- Derive the CHANGELOG block from the AAR in `session:close`; keep ROADMAP
  retirement manual.
- Bound the artifact: plan ≤ 150 lines, AAR ≤ 120, measured by `loop-audit`.

**Trigger:** the next close that edits three bookkeeping surfaces; closes when
`session:close` writes the CHANGELOG block without a manual rewrite.

## Codex pack as an artifact kind (P3)

- `manage_codex (action: export)` ships one-way: a library leaves the server as
  `holonovel.codex/1`, but nothing admits one back — `REQ-620`/`REQ-621` admit
  Novel pack, adventure module, and ruleset package only.
- Add `codex pack` to the kind set with a kind directory, a catalogue entry, and
  an admission assertion, so an exported library crosses hosts.

**Trigger:** the next artifact-registry change (REQ-620/REQ-621), or a request to
move a codex library between hosts; closes when `manage_artifact (action:
install)` admits a `codex pack` and `spec_health` reports its count.

## Non-goals

Authoritative list and rationale: `holonovel/DECISIONS.md` § Non-goals.
