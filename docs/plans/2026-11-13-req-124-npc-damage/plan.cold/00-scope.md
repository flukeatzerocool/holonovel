# Cold pass — scope

Artifact: `/home/fluke/Holonovel/docs/plans/2026-11-13-req-124-npc-damage/plan.md`
Plan sha256: `c78a553b4224d9cef340968f428ad5900c3d055fcc0bba0175dc4fba5a34144d`
Dispatched: 2026-11-13 · Gate depth: standard · Budget: ≤10 reads per dispatch,
≤40 total.

## Target files handed to reviewers

- `/home/fluke/Holonovel/holonovel/src/index.ts`
- `/home/fluke/Holonovel/holonovel/scripts/test-backfill.ts`
- `/home/fluke/Holonovel/holonovel/tool-surface-registry.json`
- `/home/fluke/Holonovel/holonovel/tool-routing.json`
- `/home/fluke/Holonovel/holonovel/tool-definitions.json`
- `/home/fluke/Holonovel/spec/02-requirements.md`
- `/home/fluke/Holonovel/spec/appendices-reference.md`
- `/home/fluke/Holonovel/holonovel/DECISIONS.md`
- `/home/fluke/Holonovel/holonovel/AGENTS.md`
- `/home/fluke/Holonovel/ROADMAP.md`
- `/home/fluke/Holonovel/spec/audit/review-register.md`
- `/home/fluke/Holonovel/spec/audit/req-coverage.md`
- `/home/fluke/Holonovel/spec/audit/tool-surface-baseline.json`
- `/home/fluke/Holonovel/CHANGELOG.md`

## Standards

- `/home/fluke/Holonovel/AGENTS.md`
- `/home/fluke/Holonovel/docs/plans/README.md`
- `/home/fluke/Holonovel/spec/appendices-reference.md` (Appendix M authoring checklist)

## Dispatching note

Each stage is a fresh `review` subagent. No stage receives the authoring
conversation, the self-review artifact, or another stage's findings (Stage 4
receives the changed sections only, per the skill).

## Stage log

- Stage 1 — zoom out: dispatched
- Stage 2 — comprehension: dispatched
