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

- The report holds **85 findings** (2026-11-16 chunk 3 closed six — `T17`, `T88`, `T421`,
  `T434`, `T435`, `T540` — and fixed the two citation paths, `T541`/`T542`). Each remaining
  row needs a per-row assertion read before it can be labelled or flipped; that read is
  chunk 4's whole scope, not a sweep.
- Residue by owner: gate-side builder rows confirmed against their check function
  (`checkPatternBufferCoverageMap`, `checkSection52CoverageMap`, `checkAppendixFAssertions`,
  `checkPhaseMapHash`, `checkConfigSurfaceParity`, `compare-spec-code`) and server-runtime
  rows whose harness assertion must be located or authored. `REQ-107a` (`T493`) and
  `REQ-569` (`T682`) are **not** label-closeable — their reports sit in top-level script
  sections the label scan does not read.
- Class (b) is real, not a bookkeeping artefact: `T420`/`T425`/`T439` require "≥1 archetype
  per group" and no check asserts non-emptiness (`scripts/validate.ts:1097`).

**Trigger:** every remaining row dispositioned and class (a) at zero; closes when the check
is error-mode in `validate`.

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
