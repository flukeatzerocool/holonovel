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

## Remaining full-review sweep (P1)

- Code-side sweep with `code-review` over `holonovel/src` by subsystem:
  tools/handlers, state/persistence, engine loop, adapters, plus security and
  determinism passes.
- Spec-side sweep of §5.1–5.8, §5.10–5.18, and §5.20–5.31 in cold chunks, then
  `check:conformance`, `fmea`, and `graph-deps` for machine evidence.
- The 2026-11-09 seam pass closed `docs/engine-contract.md` + §5.9/§5.19 only;
  this item covers everything else.

**Trigger:** a session allocated to review work, starting with the code-side
sweep; closes when both sweeps and the machine-evidence pass report.

## Holosuite anchor repoint automation (P2)

- Add a fix mode to the evidence-anchor tooling (`npm run fix-anchors` or
  `holosuite --fix-anchors`) that content-matches a stale
  `path:line#symbol` predicate to its current line and rewrites it, instead of
  the manual repoints recorded at `2026-10-24`, roadmap-clearance F2, and
  `d92b8f0`.
- Keep the check strict and the fix conservative: `--check` still fails on a
  stale anchor, only the fix mode writes, and it refuses to guess when a
  symbol has no unique content match (REQ-141m).

**Trigger:** the next `holonovel/src/index.ts` or `holonovel/src/core/state.ts`
edit that drifts a predicate, closing when the four manual-repoint sessions no
longer need hand-editing.

## Non-goals

Authoritative list and rationale: `holonovel/DECISIONS.md` § Non-goals.
