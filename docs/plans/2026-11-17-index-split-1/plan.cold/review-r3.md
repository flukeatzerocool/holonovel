# Cold targeted third pass — `2026-11-17-index-split-1/plan.md` revision 3

Reviewer: review (read-only subagent, same cold line as r1/r2)
Plan sha256: e48210d9e5c5337f663ecb1c4dd97d6cb960daa0fcc9e604eede9735dcb83600
Git HEAD: 0df83dc916eaf1e790242c59f2e9326634000ad1
Scope: the five revision-2 findings only. Nothing else re-audited.
Reads 2/5. Hash verified with `sha256sum` before judging:
`e48210d9e5c5337f663ecb1c4dd97d6cb960daa0fcc9e604eede9735dcb83600` — match.

## Fix verification

| # | Fix | Present | Sufficient | Evidence |
|---|---|---|---|---|
| 1 | M-r2-1 nine self-test cases | yes | yes | P2 (plan.md:155-165) numbers 1–9, one per line; case 6 is "a recorded path that does not exist is unresolved and the run continues (N-r2-4)". The count now agrees across done bar 1 (plan.md:220), V1 (plan.md:264), the blast-radius row (plan.md:204), and tasks.md:28-31. |
| 2 | M-r2-2 V10 base pinning | yes | **no** | The table row (plan.md:273) says "run with `BASE` = the commit-1 sha, before commit 2"; the prose (plan.md:275-278) captures `BASE=$(git rev-parse HEAD)` after commit 1; the snippet reads `process.env.BASE` and interpolates `${base}` (plan.md:284-285). But a bare shell assignment is not exported, so the child `node` process sees `process.env.BASE === undefined` and `git show undefined:holonovel/src/index.ts` throws — the check aborts instead of printing either string. See M-r3-1. |
| 3 | N-r2-3 review history + companions | yes | yes | EV2 now reads "The `fix-anchors` script is `npx tsx scripts/refresh-predicates.ts --write` (`package.json:94`)" (plan.md:56-58). tasks.md:70 reads "V1–V10"; tasks.md:72-74 lists `holonovel/scripts/lib/holosuite-*.ts` in the commit-2 file set. The revision-3 paragraph (plan.md:26-33) records what revision 2's diff review found and what revision 3 changed. Residual: the revision-2 sentence at plan.md:24-26 still attributes the commit-list correction to revision 2, where the tasks.md half did not land — historically loose, substantively resolved. |
| 4 | N-r2-4 deleted recorded path | yes | yes | D1 (plan.md:98-99): "A recorded path that no longer exists has no root to search and is unresolved, not repathed." Case 6 (plan.md:162) tests exactly that, and tasks.md:30 carries it. Consistent with `refresh-predicates.ts:81-82`, which already routes an unreadable path to `unresolved` and `continue`s. |
| 5 | N-r2-5 locator confirmation step | yes | yes | P4 (plan.md:174-177): "confirm the reported `path:line` is the `manage_belief` description line in `knowledge.ts` (the D1b locator check, N-r2-5)", ordered before `npm run fix-anchors` — so the wrong line is caught before it is written. |

Bonus consistency gained in passing: P2's report format (plan.md:154) now
matches the tool's real drift-line shape
(`${path}:${from}#${symbol} -> ${to}`, `refresh-predicates.ts:117`), which was
the loose end noted in the r2 answer to (d).

## New findings

**M-r3-1 — [Major][design] V10's `BASE` is never exported, so the check as
written crashes.**
plan.md:281 shows the snippet's precondition as a bare assignment,
`# after commit 1: BASE=$(git rev-parse HEAD)`, while the script reads
`const base = process.env.BASE` (plan.md:284) and interpolates it into
`git show ${base}:holonovel/src/index.ts` (plan.md:285). A shell variable
assigned without `export` is not placed in a child process's environment, so
`base` is `undefined`, `git show undefined:…` fails, and `execSync` throws — the
only check behind done bar 3's "present verbatim" (plan.md:224-226) produces
neither `moved text matches: yes` nor `… NO`. The base pinning itself is
correct and the timing statement is correct; only the plumbing is wrong.
*What must change (one line):* `export BASE=$(git rev-parse HEAD)`, or run the
snippet as `BASE=$(git rev-parse HEAD) node -e '…'` so the assignment is
exported for that command.

**N-r3-1 — [Nit] The review-history attribution is still loose.**
plan.md:25-26 says the "commit lists are corrected (N1–N6)" as part of the
revision-2 list, but that correction landed in revision 3 (tasks.md:72-74).
The substance is right; the tense is wrong.

**N-r3-2 — [Nit] `tasks.md:3` still says "revision 1".**
The companion artifact identifies itself against `plan.md` (revision 1) while
the plan is revision 3. One-word fix.

**N-r3-3 — [Nit] The two artifacts give different repath report formats.**
plan.md:154 says the tool reports `path:from#symbol -> path:to`; tasks.md:26
still says `-> <path>:<line>`. The plan's format is the one that matches the
tool (`refresh-predicates.ts:117`); align tasks.md.

## Verdict

All five revision-2 findings are present in the artifact, and four are
sufficient on their own terms. M-r2-2's fix pins the base correctly but the
snippet cannot read it, so the verbatim check would abort on first run; that is
a one-line correction, not a design problem, and it does not touch the
extraction or the anchor work. No changed-line Blocker remains.

independent-review passed.
