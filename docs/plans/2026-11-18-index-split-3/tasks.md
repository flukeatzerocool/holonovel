# Tasks — index.ts split, stage 3

## P0 — Plan gate (revision 3)

- [x] Preflight: 11 targets (1 new, expected), 0 external paths, HEAD `817281d`.
- [x] Cold pass r1 → `independent-review FAILED.` (3 Blockers, 5 Majors, 4 Nits).
- [x] Revision 3: full seam designed; revision 4 corrects two rows (comment text and a
      member-expression name, not calls) and the ports count → 14-identifier seam, 18-member ports,
      `parserState`, module-scope ports slot, three anchor bands (1/6/12), order capture.
- [x] Diff re-review → `independent-review passed.` (narrow: two Majors, five Nits).
- [x] Stamp `fresh` at standard depth with the passing report's path and hash.
- [x] `build-review` with the baseline and the step-to-evidence table.
- [x] Execution amendment (revision 5): the factory returns the two helpers; the nullable module
      slot is gone. The binding pass caught four stale sentences, fixed inside that amendment.

## P1 — Re-measure and capture

- [x] Slice bounds `5524-6503` (980 lines); 26 declarations (25 functions/consts + `interface
      SpatialActor` at `:5756`).
- [x] Parsed-identifier scan (comments and property names excluded): exactly 14 rows, no fifteenth;
      `getBadge`/`requireGM`/`requireNovel` stay out (imported at `:66`).
- [x] Outbound helpers: `expireCountdown` → `7103`, `7255`, `11424`; `expireSurvivalWithUnit` →
      `8156`.
- [x] Forward references: seven, all `function` declarations; six in the `run_command` handler, one
      in `expireCountdown`.
- [x] Anchor partition per file: 7 before / 12 at or after / 0 inside.
- [x] Capture `tools/list` order → `/tmp/opencode/tools-before.txt`.

## P2 — Convert the parser state

- [x] `index.ts:2156-2165` → one `const parserState` object; slice references become
      `parserState.x`.
- [x] `npm --prefix holonovel run typecheck` → 0 errors (P2).

## P3 — Move

- [x] `holonovel/src/tools/world-model.ts`: slice bodies, `ctx` destructure, `WorldModelPorts`,
      module-scope ports slot, three exports.
- [x] `index.ts`: delete the slice, add the module/helper imports, hoist `toolCtx`, build the ports
      literal, call the registration at the block's first line.
- [x] `typecheck` 0 errors; `grep -c "server\."` in the module → 0.

## P4 — Surface, order, harness

- [x] `check-tool-surface` 300 actions / 29,915 tokens; `surface-budget` and `surface-replay` pass unchanged.
- [x] Captured the order again → `/tmp/opencode/tools-after.txt`; `diff` against before → empty.
- [x] `npm --prefix holonovel run test:all` → 56/56 (174.3 s). An earlier run failed four anchor predicates, which P5 then fixed.

## P5 — Anchors

- [x] Measured: `α`=+1, `δ`=−7, post-slice `−973`. from `git diff -U0 -- holonovel/src/index.ts`.
- [x] Three declarations, each with `--path holonovel/src/index.ts`, largest magnitude first:
      `α+δ+β−980 --from-line 5524` (12), `α+δ --from-line 2156` (6), `α` (1).
- [x] `npm run check-anchors` → `predicates current`; four holosuite files touched.

## P6 — Docs and close

- [x] `holonovel/AGENTS.md` counts and module list; `DECISIONS.md` entry; `ROADMAP.md` bullet rewritten. and module list; `AGENTS.md` if it names the count.


- [x] `npm run check:fast` un-piped → 46/46 PASS.
- [ ] `mark-build`, AAR, `session:close`.
