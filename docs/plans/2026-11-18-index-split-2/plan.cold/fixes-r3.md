# Finding → fix table — revision 3 (index split stage 2)

Produced after the r2 diff re-review (`independent-review FAILED.`, 1 Blocker + 2 Majors + 2 Minors +
1 Nit). The standard-depth re-review cap is reached, so this table is the record for escalation
rather than a third pass.

| # | Plan location | Written now (quoted) | Resolves |
|---|---|---|---|
| B1 | plan.md:183-190, tasks.md:13-15 | "`refresh-predicates.ts:258`: `recorded >= fromLine`, so **each repair run follows the edit it measures**: (a) create the types module and add the import → `--offset +1 --from-line <the import's line>`; (b) delete the five declarations → `--offset -26 --from-line <the band's position after step (a)>`" | B1 — the `+1` run no longer sweeps anchors that need −25, because it runs before the deletion |
| NF1 | plan.md:222-224 | "# before commit B, pin BASE to the PRE-COMMIT-A file, where the block still starts at :6528 / # BASE=$(git rev-parse HEAD~1)" | NF1 — V6 slices the pre-A coordinates the module was taken from |
| NF2 | plan.md:196-198, tasks.md:19 | "**delete the block at its post-commit-A bounds, re-measured at P3 start** (6503-7129 as of this plan)" | NF2 — no stale pre-A range is presented as the delete instruction |
| NF3 | plan.md:106-107 | "`registerKnowledgeTools(server.registerTool, toolCtx)`" | NF3 — the binding that exists in `index.ts` |
| NF4 | plan.md:34 | "this stage moves 19 anchors (18 shifted, one repointed; the anchor at `:12` does not move)" | NF4 — count matches the repair sets |
| NF5 | plan.md:37 | "`index.ts` lands near 17,205 + Δ lines (Δ = commit B's added lines)" | NF5 — no predicted total where the plan promises a band |
| N2 | plan.md:192-195, tasks.md:17-19 | the import set is enumerated: "`z` from `zod`; `WorldRoom`, `WorldThing`, `WorldKind`, `Direction`, `ROOM_DIRECTIONS`, `WORLD_MODEL_KINDS`, `createEmptyWorldModel`, `convertSource`, `oppositeDirection` from `../world/model.js`; `createRng`, `sessionRoll` from `../core/rng.js`; `requireGM`, `requireNovel` from `../core/server.js`; the five types from `../world/generation-types.js`. **No `fs`, `path`, or `crypto`**" | N2 — the list is in both artifacts and is measured (zero word-boundary `fs` uses) |
| N3 | plan.md:112-124 | "Field signatures (N3 — nothing is inferred…)": fifteen signatures, each with its real parameter and return types | N3 — `context.ts` imports the real types instead of drifting to `any` |
| n3 | plan.md:155-163 | per-file rows for both commits: conformance, invariants, novel, adversarial, each with its anchor lines and delta | n3 — P3 can confirm each file independently |

## What the r2 pass read

- Reads: 5/10. It confirmed B2, B3, M1–M4, N1, N3, n1, n2 as resolved and re-opened N2 (import list)
  and n3 (per-file rows), which this revision also closes.

## Residual, stated rather than hidden

- The r2 pass did not see these six edits. The one blocker it raised is a three-line ordering change
  on text it had already read and accepted as correct in substance ("two-commit split, measured
  deltas, and the two-band diagnosis are right").
- `refresh-predicates.ts:190` prints a hint naming the modal delta; both repair runs are gated by
  `check-anchors`, so a wrong delta fails loudly at P2 rather than silently.
