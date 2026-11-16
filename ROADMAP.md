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

## Independent verification (§10) (P1)

- The spec binds the operator: a different model re-executes the verification
  workflows from a cold checkout with DECISIONS.md item (6) withheld. The
  2026-11-16 release-hardening increment left it unrun because this session's
  context is not independent.

**Trigger:** the first publish after 2026-11-16; closes when the verifier report
and its `DISPUTED` adjudications are recorded.

## Mutation-sample depth (P2)

- `test:holosuite-mutation` scores 12 transcript-derived cases: the lens set
  plus four contract mutants with clean controls (2026-11-16, 8 → 12). The two
  uncomputed lanes (`world_population_failure`, `coupling_failure`) are judgment
  lanes, so a larger *lens* sample needs new deterministic lenses rather than
  repeated seeds (the tautology `ORACLE_DERIVED`/CR-32 already excludes).

**Trigger:** the next Holosuite lens change; closes when the derived sample is
large enough to report a catch rate with a useful confidence interval.

## REQ evidence linkage (P1)

- The report-only `checkReqEvidenceLinkage` pass shipped (2026-11-15); triage its
  99 remaining findings to zero, then promote the check to error. A REQ whose
  `_Check:_` cites a T-ID must land on an Automated Appendix F row a harness
  names, or a Manual row whose procedure `DECISIONS.md` documents. Appendix F has
  no `Gate` kind. The 23 Manual rows were documented 2026-11-16 (chunk 1 of 3).
- T22, T35, and T103 all have asserting harnesses; the remaining defect class is
  the 99 unlinked Automated citations, 99 of them in REQs already whitelisted as
  builder-side.
- The companion class is evidence *granularity*: `check:conformance --
  --dedicated` reports 126 bucket-C REQs whose only evidence is shared with
  another REQ (bucket-C cited only in comments: 42, advisory). A REQ is not
  evidenced until its own assertion names it; triage both lists together.

**Trigger:** the corpus dry-run list is triaged to zero; closes when the check is
error-mode in `validate`.

## Split `index.ts` (P2)

- Add `--repath` to `refresh-predicates`, then extract leaf-first: tool registry,
  trust core, dispatch, ruleset surface, world model, synthesis router.
- Each stage is one commit passing `test:all` 56/56; no file above 3,000 lines.

**Trigger:** the next increment that moves more than 50 anchors, or a week with
more than 100 reads of one file.

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
