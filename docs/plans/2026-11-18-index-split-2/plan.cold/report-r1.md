# Cold review — revision 1 (index split stage 2)

**Verdict:** `independent-review FAILED.` — 3 Blockers, 4 Majors, 3 Minors, 3 Nits.
**Stages:** 1–5 in one cold context. Reads: 26/40. Tree `0fd600c`.
**Comprehension:** faithful-with-gaps (the done bar was present but arithmetically unreachable).

## Verified as claimed

Block boundaries (`:6528` header, `:7153` `});`, `:7154` blank, `:7155` next header; 627 lines;
`slice(6527,7154)` exact); 20 anchors with the stated 7/1/12 partition; the fifteen context names
complete for every module-scope reference in the block; `server` appears once (`:6593`); TDZ
reasoning for `knowledgeTools` correct; all five interfaces used on both sides of the cut and
imported nowhere outside `index.ts`; one external read of `MANAGE_WORLD_SCHEMA` (`:7515`); no
resource/prompt registration in range; ROADMAP lines match; `holonovel/AGENTS.md:59` carries 17,856.

## Blockers

1. **Anchor repair cannot pass.** Removing 26 lines above the cut (`:469`, `:499-507`, `:509-512`,
   `:576-581`, `:583-588`) shifts the post-cut anchors by roughly −649 to −650, not −627, and the
   five below-cut anchors also move. The tool refuses an offset target that does not carry the
   symbol.
2. **`index.ts` = 17,230 is self-contradictory** with the plan's own type move; real end state
   ≈17,208.
3. **The `:6641` `create_room` anchor cannot be repathed.** After the move `index.ts` still carries
   the symbol once (`:9316`, a description), so in-file resolution binds there and `--repath` never
   runs; the module carries it four times and `--repath` refuses ambiguity. D5 forbids the hand edit
   that would fix it.

## Majors

4. D3's helper-use premise is false: six of eight helpers have zero uses outside the block.
5. Widening `ToolContext` with 15 required fields breaks stage 1's literal at `index.ts:10324`, which
   the plan never mentions.
6. V6's `includes` check contradicts a normally indented function body.
7. The type-use sentence misattributes which helper uses which type (all five have outside uses).

## Minors / Nits

- Rollback omits `CHANGELOG.md` and the increment directory.
- The new module's import list is never enumerated.
- D3 says "typed from their declarations" but three signatures are inferred or generic.
- The "13 anchors (1 repathed, 12 shifted)" count is the symptom of Blocker 1 (true count 18).
- V8's grep is narrower than the done bar's "no module imports `index.ts`".
- The per-file anchor split is not given.

## Unknowns

`check-anchors` itself was not read (semantics taken from `refresh-predicates.ts`); no exhaustive
register grep for a split row; the evidence sidecar was not read; `holonovel/AGENTS.md` was injected
by the harness rather than handed over; `test:all` and the surface gates were not executed.
