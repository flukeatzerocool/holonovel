# Finding → fix table — revision 2 (index split stage 2)

Diff re-review input. Only changed lines are quoted; line numbers are as of revision 2.

| # | Plan location | Current text (quoted or paraphrased) | Resolves |
|---|---|---|---|
| B1 | plan.md EV6, D1, P2, P3, tasks P2 | "**One declared offset cannot satisfy both** (the tool takes one delta per path), so the repair runs per commit with the delta measured from the tool's own drift report" + the two-commit split (D1) + P2's "+1 then −26, second run's `--from-line` excludes `:213`" | B1 (offset arithmetic) |
| B2 | plan.md V1, Done bar | "`index.ts` < 17,250 (17,857 − 26 + 1 − 627 + Δ, Δ = commit B's added lines, recorded)" | B2 (line-count contradiction) |
| B3 | plan.md EV7, D5, P3, V9, tasks P3 | "**one anchor cannot be repaired mechanically** … a repoint to the module's `case \"create_room\":` line is therefore declared (D5)"; V9 asserts the repointed line and `check-anchors` acceptance | B3 (silent mispoint) |
| M1 | plan.md D3 | "six of the eight helpers have no use outside the block (…) so moving the family is *possible*; it would be a second extraction … deferred" + "(Revision 1 claimed each helper had exactly one external use; that was wrong and is corrected here.)" | M1 (false helper count) |
| M2 | plan.md D3, blast radius | "**One shared `toolCtx` object, declared before the cut** … stage 1's call site at `:10324` changes from its ten-field literal to `registerKnowledgeTools(register, toolCtx)`" | M2 (broken stage-1 literal) |
| M3 | plan.md D2 | "inserted **verbatim at column 0** inside the function body — no reindent — so the slice comparison (V6) is an exact `includes`" | M3 (indentation vs V6) |
| M4 | plan.md EV5 | "all five are also used by code that stays in `index.ts`: `WorldGenRole` (`:469`, used at `:470` and `:590`), `GeneratedSecret` (`:499`, used at `:520`), `GeneratedWitness` (`:509`, used at `:521`), `WorldGenTable` (`:576`, used at `:616`), `WorldGenRoll` (`:583`, used at `:616`)" | M4 (type attribution) |
| N1 | plan.md Blast radius / Rollback | "After `session:close`, add `git checkout -- CHANGELOG.md`; the increment directory is untracked until then and is removed with `git clean -fd`" | N1 (rollback omission) |
| N2 | plan.md P3, D2 | P3 lists "Create `world-crud.ts`, the `toolCtx` object, the two call sites"; the import set is derived in P1's identifier walk and enumerated in `tasks.md` (zod, `fs`, `world/model.js` ×8, `core/rng.js` ×2, `core/server.js` ×2, the type module) | N2 (import list) |
| N3 | plan.md D3 | "`ToolContext` gains the fifteen EV3 fields (required)" and the field list in EV3 carries the declaration lines; P1 records each member's type before the cut | N3 (inferred signatures) |
| n1 | plan.md EV6, Done bar, V5 | counts restated: 20 anchors, "18 shifted across the two commits, one repointed" | Nit 1 |
| n2 | plan.md V8 | "empty — the enforced form of 'no module imports `index.ts`'" | Nit 2 |
| n3 | plan.md blast radius | per-file rows for the anchor sets in both commits | Nit 3 |

## Notes

- Revision 2 also corrects the header evidence to `9bfaa96` (the version-currency fix landed after
  the baseline was first read) and records the review history in the header.
- `tasks.md` carries a "Recorded measurements" table so the three values the plan refuses to predict
  (anchor deltas, the repoint line, the final counts) are captured during execution.
