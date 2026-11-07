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

## Workflow convergence with Infobroker

- Adopt `npm run status`, a `commit-msg` hook, and the Agent Operating Routine
  so the same habits work in both repos.
- Harden the publish path with Infobroker's stage guards (secret scan,
  deny-list, leftover check, identity guard, partial-range rehearsal) and
  enforce atomic commits: one spec increment stays one commit; non-spec
  sessions split by concern.
- Pin CI actions and remove gate steps already covered by `npm run check`.

**Trigger:** the first session after the workflow-convergence plan is approved;
closes when `check:fast`, `check`, and `status` pass, the publish guards and
split mode are tested, and the roadmap gate is green.

## Rehearse the `next` publication engine on a real publish

- The step registry is the default engine, but the harness only proves control
  flow against a scratch remote. The first real publish must record which
  recovery path it used (preflight rejection, deploy reset, tag reuse, resume),
  or state that none was needed, in `docs/publish-pipeline.md`.
- Delete the `scripts/push-pipeline-legacy.sh` engine and the deprecated
  `HOLONOVEL_PIPELINE_GATES` bridge in the hooks once that run completes
  without touching the recovery column.

**Trigger:** the next real publish through the step-registry engine; closes when
that run's recovery path is recorded in `docs/publish-pipeline.md` and the
legacy engine is deleted.

## Materialize adventure-module hazard annotations (REQ-079a, REQ-622)

- `manage_world (action: convert)` and `manage_adventure (action: load)` count
  `@encounter`/`@trap` annotations but never write the target room's structured
  hazard field, so the §5.10 materialization sentence is unimplemented. Emit
  the annotation from `convertSource` and extend the adventure-load test.

**Trigger:** the next hazard-model increment; closes when a converted module's
target room carries `annotations.encounter`/`annotations.trap` and the
adventure-load test asserts it.

## Non-goals

Authoritative list and rationale: `holonovel/DECISIONS.md` § Non-goals.
