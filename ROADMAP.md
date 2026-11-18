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
## Deterministic lens breadth

- The aggregate catch rate is 35 of 35, but its lens stratum is only 5 of 35, so
  a lens-only interval stays under-powered (5/5 `[0.5655, 1.0000]`). Three lens
  mutants (`hallucinated_tool`, `unrecovered_error`, `state_divergence`) are
  excluded as tautologies because the lens re-emits the field the mutant seeds.
- Grow the stratum by de-tautologising those three (the lens derives its signal
  from the transcript) and by giving each deterministic lens at least two fault
  branches, with a clean control per branch. A tenth lens is a §8 change.

**Trigger:** the next change to `computeLenses` — a new or revised lens, or a
lens's signal handed to it; closes when no lens mutant is `ORACLE_DERIVED` and
the lens stratum reaches at least 22 cases with a width ≤ 0.15 at zero misses.

## Split `index.ts` (P2)

- Stage 1 landed 2026-11-17 (`docs/plans/2026-11-17-index-split-1`): `--repath` on
  `refresh-predicates`, the knowledge-tool cluster in `src/tools/knowledge.ts`,
  `index.ts` 19,156 → 17,857 lines.
- Stages 2 and 3 landed 2026-11-18 (`docs/plans/2026-11-18-index-split-2`,
  `2026-11-18-index-split-3`): the `manage_world` CRUD block and the `run_command`
  world-model surface now live in `src/tools/world-crud.ts` and
  `src/tools/world-model.ts`, both behind one shared `toolCtx`; `index.ts`
  17,857 → 16,244 lines. Extract next: dispatch, the ruleset surface, and the
  synthesis router.
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
