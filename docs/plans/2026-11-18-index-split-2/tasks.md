# Tasks — index.ts split, stage 2

One line per phase; ticked as it lands. `session:close` requires this file
(`scripts/lib/loop-artifacts.ts:72-74`).

Baseline (P1, measured on `9bfaa96`): `typecheck` clean both roots · `test:all` 56/56 (175 s) ·
`check-anchors` `predicates current` · `wc -l index.ts` 17,857 · 20 anchors (2 before `:469`,
18 after).

- [x] P1 — Identifier walk over `:6528-7154` (twenty-five context members, every type annotation);
      20-anchor table with each anchor's file; confirm `:7153` closes `manage_world` and `:7154` is
      blank.
- [x] P2 — Commit A (types), edit-then-repair: (a) create `world/generation-types.ts` and add the
      import, then `--offset +1 --from-line <import line>`; (b) delete the five declarations, then
      `--offset -26 --from-line <band position>`; `typecheck`, `check-anchors`, `check:fast`; commit.
- [x] P3 — Commit B (block): `tools/world-crud.ts` (verbatim at column 0; imports: `zod`, nine from
      `../world/model.js`, two from `../core/rng.js`, two from `../core/server.js`, five types; no
      `fs`/`path`/`crypto`), `toolCtx`, both call sites, `context.ts` +15; **delete the block at its
      post-commit-A bounds, re-measured at P3 start (6503-7129 as of this plan)**; offset run for
      anchors recorded at ≥ the old `:7155`; **D5 repoint** of `holosuite-adversarial.ts:30` to
      `world-crud.ts:<line>` (record it here); `typecheck`, V6 (BASE = `HEAD~1`), `check-anchors`;
      commit.
- [ ] P4 — Gates and docs: `test:all` 56/56, `check:fast` un-piped, layer map, roadmap bullet, AAR,
      `session:close`.

## Recorded measurements

| What | Value |
|---|---|
| `create_room` repoint target (D5) | `holonovel/src/tools/world-crud.ts:133` (`case "create_room": {`) |
| Commit A anchor delta (from the tool's hint) | `+1` for 19 anchors, then `-26` for 18 |
| Commit B anchor delta (from the tool's hint) | `-615` for 13 anchors (below the cut), `+2` for the six above it; `create_room` repointed |
| Final `wc -l` on `index.ts` / `world-crud.ts` / `generation-types.ts` | 17,217 / 648 / 36 |
