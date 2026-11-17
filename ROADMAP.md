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

- 47 findings remain — all class (b), rows with no asserting site. Chunk 9 added the
  cross-artifact agreement checks on 2026-11-17 (`T205` DECISIONS token table ↔ runtime registry,
  `T297` witness tables ↔ generator ↔ transcript dice, `T106` CalVer shape), so the residue is
  runtime assertions with no in-repo site. The chunk dispositions live in
  `docs/plans/2026-11-16-roadmap-drain-5/dispositions.md` through
  `docs/plans/2026-11-17-roadmap-drain-10/dispositions.md` (chunks 4–9).
- Class (b) is real, not bookkeeping: chunk 7 authored the `T420`/`T425`/`T439` archetype
  assertions (`scripts/validate.ts`, `checkCouplingCompleteness`), chunk 8 the committed-artifact
  assertions (`T186`/`T187` handoff documents, `T298` phase-map hash, `T538` coverage map), and
  chunk 9 two registry/table comparisons plus a generator re-derivation; each closed a row that
  had no asserting site.
- Chunk 9 also pinned its parse predicates rather than inferring them: the briefing check fails
  loud when the registry markers or `narrative_threads` are absent, and the witness check pins d6
  for transcript arrays and d20 for the B.4/N.4 columns, so a future die type is a parse error
  rather than a silent skip. Chunk 7 kept the property parse's empty cell observable; chunk 6
  created Manual procedures for the class (c) rows. The block closes as a unit because the
  linkage predicate is T-ID-scoped (`scripts/lib/req-checks.ts:881-887`).

**Trigger:** every remaining row dispositioned and class (a) at zero; closes when the check is
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
