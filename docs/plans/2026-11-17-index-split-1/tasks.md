# Tasks — Split `index.ts`, stage 1: `--repath` and the knowledge-tool cluster

Increment: `docs/plans/2026-11-17-index-split-1` · Plan: `plan.md` (revision 1)
Baseline the plan was written against: git HEAD `0df83dc`, tree clean, `check:fast` PASS (46/46),
`holonovel` `test:all` 56/56, `check-anchors` `predicates current`, `index.ts` 19,156 lines.

Tick a task only when its acceptance line is satisfied; `aar.md` (P5) records the readings, not
the ticks.

## P1 — Baseline and probe

- [x] `npm run check:fast` reproduces `46 passed, 0 failed` and `check:fast: PASS`.
- [x] `npm --prefix holonovel run test:all` reports 56 commands, all PASS.
- [x] `npm run check-anchors` reads `predicates current`; `wc -l holonovel/src/index.ts` reads
      `19156`.
- [x] Scratch-tree probe: with the symbol moved to another file and no `--repath`, `--check`
      fails with `has no code line with` and no repair is offered.

## P2 — `--repath`

- [x] `scripts/lib/anchor-resolver.ts` gains a pure source-root file index over a supplied
      `Map<path, lines>`; it returns one carrying file, several (ambiguous, sorted), or none.
- [x] `scripts/refresh-predicates.ts` accepts `--repath`: when the recorded file has no matching
      code line, resolution searches that file's source root only (first two path segments),
      writes the new path *and* line (nearest ±40 window, else first code line in file order), and
      reports `-> <path>:<line>`; without the flag the behaviour is unchanged. `--repath` joins
      `rejectUnknown`, the header, and `USAGE`.
- [x] `scripts/test-anchor-tooling.ts` covers the nine numbered cases in P2 (moved definition;
      moved non-definition line; other-root caller ignored; two carrying files ambiguous; absent
      symbol; deleted recorded path; `--check` without `--repath`; `--check --repath` without
      writing; `--write --repath` then a passing check).
- [x] Control over the unmodified tree: `refresh-predicates --check --repath` reads
      `predicates current` (no false positive).
- [x] `package.json:94` reads `refresh-predicates --write --repath`; `check-anchors` keeps
      `--check`.
- [x] `AGENTS.md` script row documents `--repath`.
- [x] `npx tsx scripts/test-anchor-tooling.ts` passes with the new cases.

## P3 — Extraction

- [x] `holonovel/src/tools/context.ts` exports `ToolContext` with the ten measured names (`state`,
      `configInt`, `wantsDetail`, `memoryScoreInputs`, `windowAwareVerdict`, `audit`, `ok`, `err`,
      `raw`, `mergeScopedArgs`) and `RegisterTool = (name, config, handler) => void`.
- [x] `holonovel/src/tools/knowledge.ts` holds `index.ts:10323-11626` verbatim inside
      `registerKnowledgeTools(register, ctx)` with the ten names destructured as its first
      statement and the five badge helpers imported from `../core/server.js`.
- [x] `index.ts` passes the *patched* `server.registerTool` (never `_registerTool`).
- [x] The five shared symbols (`identityFor`, `handleCausalActions`, `handleCorpusActions`,
      `gatherIndexSources`, `gatherGraphSources`) are exported from the new module and imported by
      `index.ts`; no second definition exists.
- [x] The call site sits where the block started, so registration order is unchanged.
- [x] `npm --prefix holonovel run typecheck` is clean, and every identifier the context had to
      grow for is recorded in the AAR.
- [x] `index.ts` is below 17,900 lines; `knowledge.ts` is below 1,400.

## P4 — Anchor repair and gates

- [x] `npx tsx scripts/refresh-predicates.ts --check --repath` names the `knowledge_query` anchor
      moving to `holonovel/src/tools/knowledge.ts`, exit 1.
- [x] `npm run fix-anchors` rewrites it; `npm run check-anchors` then reads `predicates current`.
- [x] `npm --prefix holonovel run typecheck` and `npm run typecheck` are clean.
- [x] `npm --prefix holonovel run test:all` reports 56/56.
- [x] `npm run check:fast` reports `46 passed, 0 failed` and `check:fast: PASS`, run un-piped.

## P5 — Registers and close

- [x] `holonovel/AGENTS.md` layer map names `src/tools/context.ts` and
      `src/tools/knowledge.ts` and the new `index.ts` line count.
- [x] `CHANGELOG.md` carries the dated entry for this increment.
- [x] `aar.md` is written with V1–V10 recorded and the terminal token filled before the last gate
      run.
- [x] Two commits, non-spec split: tooling (`scripts/`, `package.json`, `AGENTS.md`), then server
      (`holonovel/src`, `holonovel/scripts/lib/holosuite-*.ts`, `holonovel/AGENTS.md`,
      `CHANGELOG.md`, plan artifacts).
