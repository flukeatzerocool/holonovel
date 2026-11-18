# Cold re-review (diff scope only) — `2026-11-17-index-split-1/plan.md` revision 2

Reviewer: review (read-only subagent, same cold line as r1)
Plan sha256: 208709a26c7c1b1c74bccb5831c4ac27d7a3053fd81caf89489858903ebba3e6
Git HEAD: 0df83dc916eaf1e790242c59f2e9326634000ad1
Scope: the thirteen changed sections only; everything else treated as the
verified text of revision 1. Reads 5/10 (+ one `sha256sum`).
Reviewed: revision 1's five stages (1, 2, 3, 5). This pass re-audits the
failed dimensions on the changed sections and does not re-sweep.

## Prior findings — disposition

| ID | Sev | Disposition | Evidence |
|---|---|---|---|
| B1 | Blocker | RESOLVED | D1 (plan.md:82-92) restricts the search to the recorded file's own source root — `holonovel/src` for `holonovel/src/index.ts`. Within that root `knowledge_query` is carried only by the moved `holonovel/src/tools/knowledge.ts`; the four other carriers (`holosuite-novel.ts:394`, `test-security.ts:220`, `test-narrative.ts:1172,1175`, `test-perception.ts:196,202,204`) are all under `holonovel/scripts` and now out of scope. Exactly one accepting file, so P4/done bar 2 are reachable. |
| M1 | Major | RESOLVED | D1b (plan.md:93-99) states the rule is new ("This is a *new* rule, deliberately"), cites the real contract (`refresh-predicates.ts:85`), and names the self-validating consequence with a reviewer step. The objection was mislabeling plus silence; both are gone. Residual noted below (N-r2-3). |
| M2 | Major | RESOLVED | EV4 (plan.md:65-72) now names ten index-local declarations with definition lines, and all ten are genuinely called inside 10323-11626: `configInt` at 10947/11050/11479/11488/11495/11525, `memoryScoreInputs` at 11478/11601, `windowAwareVerdict` at 11603, `wantsDetail` at 10451/11269, `mergeScopedArgs` at 10440/10442, plus `state`/`audit`/`ok`/`err`/`raw`. The badge helpers are correctly restated as `core/server.ts` singletons — `initServer(state)` is at `index.ts:1437` as claimed. D4's type matches. |
| M3 | Major | RESOLVED | D3 (plan.md:119-123) gives `RegisterTool = (name: string, config: any, handler: any) => void` and fixes the argument as the patched `server.registerTool`, excluding `_registerTool` (:255) with the right reason. See (c) below — no type or binding defect. |
| M4 | Major | RESOLVED | D1c (plan.md:100-105) replaces the unfalsifiable dry run with a scratch-tree rehearsal of the live shape (moved description line + caller file in the other root) and moves the real post-move run to P3/P4, before commit 2. That is the control M4 asked for. |
| M5 | Major | RESOLVED | Done bar 1 (plan.md:203-206), D1c and V2 (plan.md:250) now expect `predicates current`, which is what `refresh-predicates.ts:120` prints when both counts are zero. |
| M6 | Major | RESOLVED | V9 (plan.md:257) now reads `git log --oneline -2` + `git status --porcelain`, which can show both subjects and a clean tree. |
| N1 | Nit | RESOLVED | The 42-declaration figure is gone; EV3 (plan.md:57-58) states the four `server.registerTool(` lines (verified: 10381, 10626, 11129, 11247) and the absence of resource/prompt registrations (verified) instead. |
| N2 | Nit | RESOLVED | EV5 (plan.md:73-78) lists 18 unique lines with `:12154` and `:12408` marked repeated → 20 calls outside the cut + 1 inside = 21. Arithmetic now checks. |
| N3 | Nit | RESOLVED | D2 (plan.md:109-111) and P2 (plan.md:153-154) add `--repath` to `rejectUnknown`, `USAGE`, the header, and the AGENTS row. |
| N4 | Nit | RESOLVED | V10 (plan.md:258-271) supplies an executable verbatim check. Its timing is defective — see M-r2-2. |
| N5 | Nit | DEFERRED | Unchanged text: tasks.md:69 still omits `holonovel/scripts/lib/holosuite-*.ts` from commit 2 while plan.md:177 includes it. Note that the changed review-history sentence (plan.md:24-26) claims the commit lists were corrected — that claim is inaccurate on the tasks.md side (N-r2-3). |
| N6 | Nit | DEFERRED | Unchanged text: EV2 still says "`npm run fix-anchors` is `refresh-predicates --write`" (plan.md:49-50) where package.json:94 is the full `npx tsx …` command. The same review-history sentence overstates this too. |

## Answers to the five questions

**(a) Is the live `knowledge_query` anchor decidable under the revision-2 D1
rule?** Yes. The recorded path is `holonovel/src/index.ts`, so the root is
`holonovel/src`. After the cut, the only file inside that root carrying
`knowledge_query` on a code line is `holonovel/src/tools/knowledge.ts` — every
`holonovel/src` occurrence (index.ts:10383, 10385, 10419, 10422, 10424) is
inside 10323-11626 and moves with the block; the harness carriers are under
`holonovel/scripts`. One accepting file, so the ambiguity branch cannot fire.
B1 is genuinely closed, not narrowed. Two small gaps in the rule's statement,
neither live: the derivation "first two path segments" is undefined for a path
with fewer than two segments (no such anchor exists today), and a future
cross-root move (`src` → `scripts`) becomes unrepatheable, which the
out-of-scope note (plan.md:229-230) already concedes.

**(b) Does D1b remove M1's objection or paper over it?** It removes it, on the
merits. The objection had two parts: the rule was described as "the existing
window extension" when it is new, and a wrong line was silently accepted. D1b
now says it is new, quotes the contract the anchor actually enforces
(`refresh-predicates.ts:85`: this line carries this symbol) and states the
self-validating consequence in the risk table (plan.md:238). Once the contract
is "the line carries the symbol", a carrying line is a valid anchor and the
plus a human diff review is a defensible policy rather than a guess. The
residual is only that the human review is not gated (N-r2-3), which is
acceptable at this stage because the live target is the first code line and is
semantically correct.

**(c) Is D3's register-argument rule executable?** Yes, on both axes.
*Binding:* the value assigned at index.ts:324-346 is an arrow function whose
body references only module bindings (`TOOL_ANNOTATIONS`, `withForbiddenAudit`,
`normalizeRefusal`, `withCapacityAbort`, `ensureStructured`,
`truncateHandler`, `withSystemEnvelope`, `state`, `bumpPacing`,
`toolRegistry`) — it never reads `this` — so passing `server.registerTool`
unbound is safe. *Type:* the property is cast back to
`typeof server.registerTool` at :346, and `(string, any, any) => void` accepts
it (method parameters are bivariant; `any` absorbs the SDK's config/callback
types, and a non-void return is assignable to `void`). The call site runs after
the patch (324 < 10323) so it reads the patched function. Calling `register(…)`
and discarding the return matches today's statement-position registrations. No
change is needed; if anything, the plan's structural type is safer than
`typeof server.registerTool`.

**(d) Are the nine cases and V1/V2/V10 consistent with the tool's output?**
Output strings, yes: V1's `N passed, 0 failed` matches
`scripts/test-anchor-tooling.ts:114`; V2's `predicates current` matches
`refresh-predicates.ts:120`; V10's `moved text matches: yes` matches its own
snippet. Counts and timing, no: P2 enumerates **eight** cases while done bar 1,
V1 and the blast-radius row say nine (M-r2-1), and V10's `git show
HEAD:…` is only correct while HEAD is the pre-move commit (M-r2-2). The
repath drift line also inherits the existing shape
`${path}:${from}#${symbol} -> ${to}` (`refresh-predicates.ts:117`), so P2's
`-> <path>:<line>` should say the right-hand side becomes `path:line` rather
than a bare number.

**(e) New Blocker/Major introduced by these edits?** No new Blocker. Two new
Majors (M-r2-1, M-r2-2) and three Nits, all in changed text and all one-line
fixes.

## New findings

**M-r2-1 — [Major][clarity] The self-test count says nine; the enumeration
lists eight.**
P2 (plan.md:147-152) names: moved definition; moved non-definition line;
other-root caller ignored; two carrying files in root ambiguous; absent symbol
unresolved; `--check` without `--repath` fails naming `fix-anchors`;
`--check --repath` exits 1 without writing; `--write --repath` repairs and the
next check passes. That is eight. Done bar 1 (plan.md:205-206), V1
(plan.md:249) and the blast-radius row (plan.md:189) all say nine, so neither
the done bar nor V1 can be matched to a named set. *What must change:* either
name the ninth case or change all three references to eight.

**M-r2-2 — [Major][design] V10 fails when run against the post-move HEAD.**
The snippet (plan.md:263-271) slices `git show HEAD:holonovel/src/index.ts`.
That is the pre-move file only while HEAD is commit 1 (the tooling commit). The
verification table does not fix V10's timing, and V9 is explicitly "at close",
by which point commit 2 has landed and `HEAD:holonovel/src/index.ts` no longer
contains 10323-11626 — the slice then compares unrelated text and prints
`moved text matches: NO`, a spurious failure of the only check behind done bar
3's "verbatim". *What must change:* pin the base explicitly, e.g. capture
`git rev-parse HEAD` after commit 1 and slice `git show <sha>:…`, or use
`HEAD~1` with a stated precondition that V10 runs before commit 2.

**N-r2-3 — [Nit] The review-history paragraph overstates two Nit fixes.**
plan.md:24-26 says "the … `rejectUnknown` set, verbatim check, and commit lists
are corrected (N1–N6)". The `rejectUnknown`/USAGE/header and verbatim items are
corrected; the commit-list inconsistency lives in tasks.md:69, which was not
edited, and EV2's `fix-anchors` shorthand (plan.md:49-50) is unchanged. Also
tasks.md:66 still reads "V1–V9", so the new V10 is not carried into the tasks
artifact. *What must change:* amend the sentence to N1–N4, or update
tasks.md.

**N-r2-4 — [Nit] D1 is silent on a recorded file that no longer exists.**
`refresh-predicates.ts:81-82` sends an unreadable recorded path straight to
`unresolved` and `continue`s, so `--repath` never runs for a deleted file. No
live case this increment (index.ts survives), but it is the shape most stages
2+ will produce (a module split, not a block move). Worth one sentence in D1.

**N-r2-5 — [Nit] D1b's human confirmation is not a step.**
The risk row (plan.md:238) says "the maintainer confirms the line in the
diff". P3/P4 do not name that step and the AAR's done bar does not record it,
so the acceptance has no artefact. Either name it in P4 ("confirm the reported
`path:line` is the description line") or rely on V2's output, which prints it.

## Unknowns

1. Whether `index.ts` contains top-level `await` in 10323-11626 — EV3's new
   claim. No `await` at module scope was observed in the regions read, but the
   range was not exhaustively scanned.
2. Whether every remaining identifier used by the block is imported
   (`summaryEntries`, `normalizeToken`, `questionKey`, `agentTransition`,
   `nextTaskId`, `AUTONOMY_LEVELS`, `isMutable` are all imports at
   index.ts:19/51/59, and the plan's ten are now measured), but a
   compiler-assisted closure was not run.

## Verdict

No changed-line Blocker remains. B1 is closed by the source-root restriction,
and M1–M6 are resolved with evidence rather than by rewording. The two new
Majors are mechanical: a count that does not match its enumeration, and a
verbatim check bound to a mutable `HEAD`. Fix both before commit 2; neither
needs a re-audit of the design.

independent-review passed.
