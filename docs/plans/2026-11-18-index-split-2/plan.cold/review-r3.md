# Cold review — revision 3 (targeted re-check, authorised over the cap)

Plan sha256: 14caf55f6b57d5c09f42b297b982054592ac0b5823b7ba716ea0aa453188f913

**Verdict:** `independent-review passed.` — 0 Blockers, 0 Majors, 2 Minors, 1 Nit.
**Scope:** the six changes made after the r2 pass, targeted, 5/6 reads, no new-lens sweep.
**Authorisation:** the maintainer authorised one pass over the standard-depth re-review cap
(the r2 pass had returned FAILED with one blocker).

**Note on the hash.** The pass read the revision-3 text at sha256 `80b1e1ea…`. Three
condition-only fixes were applied after the verdict, each one the reviewer's own remedy:
`seedWarningSuffix(seed: unknown): string` (it was written as a non-callable string field),
"seven anchors" in the commit-B per-file row (the row said eight), and the commit-B blast-radius
summary ("cut the block at its post-A bounds") instead of the pre-A range. The hash above is the
final text. No other line changed after the pass.

## Dispositions

| Item | Verdict | Settling evidence |
|---|---|---|
| B1 | RESOLVED | P2 (and `tasks.md`) now order each repair run after the edit it measures: import → `--offset +1 --from-line <import's line>`, then delete → `--offset -26 --from-line <band>`. Executable under `refresh-predicates.ts:258/:262` with no upper bound: after the import only, every anchor after it is stale by exactly +1; run (b)'s lower bound excludes `:213`, which is already correct and skipped by the symbol check. |
| NF1 | RESOLVED | V6 pins `BASE` to the pre-commit-A file, where `slice(6527, 7154)` is the block's own coordinates. |
| NF2 | RESOLVED | The commit-B delete instruction says "re-measured at P3 start (6503-7129)" in both artifacts. |
| NF3 | RESOLVED | `registerKnowledgeTools(server.registerTool, toolCtx)` — the binding that exists. |
| NF4 | RESOLVED | "moves 19 anchors (18 shifted, one repointed; `:12` does not move)". |
| NF5 | RESOLVED | "lands near 17,205 + Δ"; V1 keeps the arithmetic and the `< 17,250` bound. |
| N2 | RESOLVED | The import set is enumerated in both artifacts, including the nine `world/model.js` names verified at their use sites, and "no `fs`, `path`, or `crypto`". |
| N3 | RESOLVED after the fix | Fourteen of fifteen signatures matched the declarations exactly; the fifteenth (`seedWarningSuffix`) was a string field and is now the function signature. |
| n3 | RESOLVED | Per-file anchor rows for both commits, matching the real distribution (conformance 5, invariants 4, novel 4, adversarial 7). |

## New findings raised by this pass (all fixed)

- Minor: `seedWarningSuffix: string` was not callable → function signature.
- Minor: the commit-B per-file row said "eight anchors" for three files that carry seven.
- Nit: the commit-B blast-radius summary still said "cut `:6528-7154`".
