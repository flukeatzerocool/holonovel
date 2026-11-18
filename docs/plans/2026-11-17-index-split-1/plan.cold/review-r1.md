independent-review FAILED. plan.md — 1 blocker (design)

Stages: 1, 2, 3, 5 completed (4 not run — no author edits after Stage 3) · reads 27/40
Comprehension: faithful-with-gaps
```

**Blocker**
- **[design] B1 — the `--repath` file-uniqueness rule makes the one live anchor ambiguous, so P4 and done bar 2 cannot succeed.** D1 (plan.md:63-73) searches `holonovel/src/**` *and* `holonovel/scripts/**` and refuses when two or more files carry the symbol on a code line. After the move, `knowledge_query` is on code lines in ≥5 files: `src/tools/knowledge.ts` (from index.ts:10383/10385/10419/10424) plus `holonovel/scripts/lib/holosuite-novel.ts:394`, `test-security.ts:220`, `test-narrative.ts:1172,1175`, `test-perception.ts:196,202,204` — one of which is the anchor's own source file. The tool must refuse, yet P4 (plan.md:123-124), done bar 2 (plan.md:168), V2/V3 and tasks.md:54 all expect a successful repath. Must change: restrict the index (declaration-bearing files, or exclude call-argument occurrences), or drop the scripts root, and add a self-test mirroring a caller file in a different root.

**Majors**
- **M1 [design]** The "first code line in file order" fallback is a *new* rule, not "the existing ±40-line window" — `anchor-resolver.ts:32-40` returns `ambiguous` when no candidate is near, and `refresh-predicates.ts:10-11` says such an anchor is "refused rather than guessed". In the live case 10383 is >10,000 lines from the token's new position, so the fallback alone decides; it lands correctly only by ordering luck, and `refresh-predicates.ts:85` then makes the result permanently self-validating.
- **M2 [design]** "Ten names from its host" is false — at least twelve. `wantsDetail` (index.ts:2201, used 10451/11269) and `mergeScopedArgs` (index.ts:3956, used 10440/10442) are index-local and in neither the ten-name list nor D5. D4 fixes the type to ten; P3 and the risk row assume growth. Also, EV4 lists 10 names but only 9 call-site counts (plan.md:51-54).
- **M3 [design]** `RegisterTool` has no signature and the `register` argument is unspecified. `server.registerTool` is patched at index.ts:324-346 (annotation enforcement, truncation); `_registerTool` at :255 binds the *unpatched* original. Passing the latter silently changes behaviour, contradicting plan.md:187.
- **M4 [design]** D1a's dry run cannot catch the failure it guards — over the unmodified tree the fallback never fires; B1/M1 appear only after the move, at P4, after commit 1 is made.
- **M5 [design]** Done bar 1 / V2 expect `0 drift(s), 0 unresolved` on a clean run, but `refresh-predicates.ts:120-121` prints `predicates current` when both are zero (matching the plan's own baseline, plan.md:8).
- **M6 [design]** V9 `git diff --stat HEAD` at close is empty after committing; it cannot show "two commits, no unrelated file".

**Nits:** N1 EV3's "42 top-level declarations" is not reproducible (24 by declaration-shaped grep). N2 EV5 lists 17 "other" anchors for a claimed 21; omits index.ts:12 (`holosuite-adversarial.ts:31`) and the 12408/12154 duplicates — though "exactly one anchor inside the cut" is true. N3 `--repath` must also be added to `rejectUnknown`'s allowed set (refresh-predicates.ts:65) and to USAGE/header. N4 "present verbatim" has no verifying command. N5 the two commit file lists disagree (plan.md:139 vs tasks.md:69). N6 "fix-anchors is `refresh-predicates --write`" is shorthand for `npx tsx scripts/refresh-predicates.ts --write` (package.json:94).

**Verified-correct claims** (worth not re-deriving): plan hash, HEAD, clean tree, index.ts 19,156 lines; EV2's ranges (`:49-60`, `:81-98`, `:95`, `:101`, `:123-127`), package.json:94/95, AGENTS.md:366; the 10323/11626 boundary and the absence of local interfaces in range; the five cross-referenced symbols are exactly right and complete; 10383 is indeed the `manage_belief` description under `server.registerTool("manage_belief", {` at 10381; all four in-block registrations use `server.registerTool(` with no resource/prompt calls in range; `holonovel/src/tools/` does not exist; `repath` has no precedent in `scripts/`. The D3 TDZ concern is a non-issue if D5 is followed.

Report persisted by the parent from the reviewer's verbatim text (the cold context has no write tool).
