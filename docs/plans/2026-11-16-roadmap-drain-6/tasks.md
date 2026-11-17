# Tasks — Roadmap drain 6: item 3 chunk 5 (the `T497` block, eight rows)

A task is done when its check passes, not when the edit lands. Re-grep every
`file:line` before editing it.

**`dispositions.md`** carries the eight `T497` rows only (the other 72 are
carried forward untouched). Header, then one row per REQ:
`| REQ | T-ID | class | cite | home | action |`, `action` = `closed`, and
`home` names the asserting `path:line`. Count the action column with field 7.

**Probe:** the T-ID is corpus column 2, so `grep -cF '| T497 |' <file>` — fixed
string, no anchor. Baseline 8; after the increment 0.

**Atomicity (plan D1):** no case carries a `T497` title until all eight clauses
are green. Neutral titles during P1; one rename pass in P4.

| # | Task | Depends on | Check |
|---|---|---|---|
| 1 | **Red tests first.** Add a second synthetic tree to `holonovel/scripts/test-update-workflow.ts` — no `src/generated`, a minimal `tool-definitions.json` with `surface_names` — and eight cases with neutral titles: (a) five-hash table in the rendered entry; (b) sentinel; (c) startup never reads the baseline; (d) source-only scoped reuse; (e) `scopingAdvice` per component, four branches; (f) cold seed; (g) four-of-five full; (h) baseline refresh on a second reconcile | — | (a) fails (names only); (b) fails (`sentinel` absent); (e) fails (generic text); (g)/`REQ-313b` fails (`hashSurfaces` ignores the fixture); (c) passes — quote and record as assertion-only |
| 2 | `holonovel/scripts/generate-tool-definitions.ts`: call `resources/list` and `prompts/list` on the existing stdio client (no `resources/templates/list` — a template is not a registered URI); emit `surface_names: { tools, resources, prompts }`, each sorted ascending at emission; `--check` compares the field like the rest of the artifact | 1 | `npx tsx holonovel/scripts/generate-tool-definitions.ts` writes the block; a second run is byte-identical |
| 3 | Regenerate `holonovel/tool-definitions.json` | 2 | `npm run check-tool-definitions-sync` passes; `npm run check-reference-server-cleanliness` passes |
| 4 | `scripts/lib/fingerprints.ts`: `hashSurfaces(serverDir)` hashes the concatenation, joined `"\n"` in the fixed order tools, resources, prompts, of each list sorted ascending — the same rule as emission; `"absent"` when the artifact is missing | 3 | the fixture case goes green; renaming a prompt in the fixture changes the hash; adding a tool changes it; a description-only edit does not |
| 5 | `scripts/lib/spec-update.ts`: `renderFingerprintDelta` appends the five-row `Component \| Prior \| Current` table (16 hex + `…`, `none` when `prior` is null) after the bullet and after any dispositions table; sentinel rendered verbatim; add `advice?: string` and a `- **Scoping advice:**` line | 1 | (a) and (b) green; a record without `advice` renders unchanged bytes |
| 6 | `scripts/update-server.ts`: `scopingAdvice(changed: string[])` per plan D4 (fixed order, joined `"; "`, `[]` → `"none"`); replace the `:511-517` branch; carry `advice` into every `writeDeltaRecord` call site (`:413-425`, `:485-497`, `:519+`) | 5 | (e) green for all four branches; the zero-change record carries `advice: "none"`; the `REQ-394a` cases still pass |
| 7 | `scripts/test-spec-tooling.ts:314`: extend the renderer case with the table (fixed order), the sentinel value, and the `none` prior column | 5, 6 | `npm run test:spec-tooling` passes |
| 8 | Rename the eight cases to `T497/REQ-313a…d`, `T497/REQ-314a…d` in one pass — only after every clause is green | 1–7 | all eight green after the rename; no neutral-titled case remains |
| 9 | `npm run validate -- --write-linkage-corpus docs/plans/2026-11-15-req-evidence-linkage/corpus.md` then `npm run validate -- --write-register` (**two separate runs**) | 8 | probe = 0; `req-coverage.md` changes only `Exercised tests` cells, no bucket moves; a second regenerate is byte-identical |
| 10 | `dispositions.md` — eight `closed` rows | 9 | every row has a `path:line` home; `awk` over field 7 reports `closed 8` |
| 11 | `ROADMAP.md` item 3: residue `72`, class split `57 + 15`, the `T497` note replaced by the closure, `**Trigger:**` preserved | 10 | `npm run check-roadmap` |
| 12 | Supersede `spec/audit/review-register.md:3160-3165` (the "deliberately deferred" paragraph and its `80 = 65 + 15` residue), then add the dated subsection (after task 11) | 11 | the superseded paragraph points at the new subsection; `npm run check-registers`; every `REQ-` token cited appears on `ROADMAP.md` |
| 13 | `CHANGELOG.md` entry; `npm run check:fast` un-piped; `npm run test:all`; `aar.md`; `npm run session:close --single` | 12 | trailing `check:fast: PASS`; suite green; one commit; AAR ends `LOOP PAUSED` |

## Red reads

Filled during execution, not before.

## Fallback (plan done bar)

If any clause is unfinished, do **not** rename the titles: the corpus, `ROADMAP.md`,
and the register stay at 80, `dispositions.md` records each row's state, and the
AAR records chunk 5a. Landed code stays — it is gate-green independently
(`check-tool-definitions-sync`, `test:spec-tooling`, `test:update-workflow` all
pass without a `T497` title).
