# Cold review — REQ sentence-count enforcement

Reviewer: review subagent (cold pass; single-context — see Limitation)
Plan sha256 at cold pass: 6e06e6729615085b269b83c207e5ff3659b4d2e943370e645ee260bd17135e5f
Artifact: docs/plans/2026-11-14-req-sentence-enforcement/plan.md
Repo at review: 9a2f31f (matches the artifact's stated measurement commit)
Depth: standard · Stages run: 1, 2, 3, 5 · Stage 4 not triggered (no post-review edits)

Verdict: independent-review passed. — 0 Blockers · 4 Majors · 9 Nits

## Stage 2 — comprehension (faithful-with-gaps)

The increment adds one mechanical predicate: `checkReqSentenceCount` in
`scripts/lib/req-checks.ts`, called from `checkReqShape`
(`scripts/validate.ts:223-257`), which raises an issue for any REQ whose
`entry.sentences.length > 8`. Because `--sdd-strict` routes every shape issue
except the literal phrase "review for splitting" to ERROR (`validate.ts:2244-2245`),
and both gate modes pass `--sdd-strict`, a nine-sentence body starts failing
`check:fast` and `check`. Rationale: Appendix M (`spec/appendices-reference.md:2949`)
and `AGENTS.md:174` claim the ≤8-sentence rule is mechanically enforced, but no
predicate compares the supplied `sentences` to a limit; ROADMAP has a P1 item and
review-register finding F-U1-3 tracks the gap. The change also compresses the seven
over-limit bodies in place (per-REQ merge table), corrects Appendix M's region
description and AGENTS.md's parenthetical, moves F-U1-3 to `## Resolved`, removes
the ROADMAP section, adds a CHANGELOG entry, and regenerates the assembled spec and
contract fingerprints. Done = a nine-sentence body errors under
`validate --sdd-strict`, all 1322 REQs count ≤ 8, `check:fast` green with
fingerprints in sync, F-U1-3 Resolved, roadmap section gone, register/roadmap gates
pass, one commit.

Could not determine: which character measure the per-REQ "759c/788c/796c" figures
use, nor any post-merge character count; the replacement wording for the
"Three findings" register intro; whether publication (DECISIONS.md spec-hash sync,
dated Spec Update entry) is in scope.

## Majors

M1 [design] A `repo`-tagged premise is false: `entry.sentences` is read today.
- Artifact: `plan.md:15-16` ("has supplied `entry.sentences` unused since it was
  added") and the evidence row `plan.md:35` ("`sentences` produced at
  `scripts/lib/parse-spec.ts:197` is never read").
- Predicate: `scripts/validate.ts:542` (`const sentences = entry.sentences;`),
  consumed at `:548-550` (passive-voice percentage) and `:569-573` (sentence-length
  warnings). The true statement is "never compared against a limit".
- Why it matters beyond prose: step E7 (`plan.md:79`) rewrites this finding into
  `spec/audit/review-register.md`, a gate-checked audit artifact whose entries are
  required to cite the predicate they rest on. Propagating "never read" would put a
  provably wrong citation into the register.
- Must change: restate the premise as "the count is never compared to a limit" in
  `plan.md:15-16`, `plan.md:35`, and the replacement F-U1-3 text. The existing
  register wording (`review-register.md:2620`, "never counted") is already correct —
  reuse it.

M2 [clarity] The compression argument contradicts itself about whether text is
removed.
- `plan.md:97-98`: "Every merge replaces a `. ` boundary with a comma/semicolon
  clause, so no contract is dropped".
- `plan.md:94`: REQ-318a merges by "dropping the repeated 'property enables' stem".
- `plan.md:99-100`: "a merge that lengthens is rejected in favour of a shorter join".
- Removing stems and choosing shorter joins is rewriting, not boundary re-joining.
  A reader cannot tell whether clause preservation is guaranteed by construction or
  by review.
- Must change: state the invariant actually claimed (no field, property, condition
  label, or obligation is deleted; connective prose may be) and drop the
  "only replaces a boundary" wording, or supply the exact merged text for REQ-232a
  and REQ-318a as is done for the other five.

M3 [design] The 800-character claim is unquantified across two different regions.
- `plan.md:38-39` gives "n/NNNc" per REQ without saying which slice is measured;
  `plan.md:76` requires "body length ≤ 800" with no measure named; the merge table
  (`plan.md:87-95`) gives resulting sentence counts for every row but a resulting
  character count for none, including the two rows that start at 796c.
- Predicate: the 800-char limit is enforced over `extractReqBodies(text)` bodies
  (`validate.ts:188-194`), whose body includes the `*Acceptance criterion:*` and
  `_Check:_` clauses (`parse-spec.ts:86`), while the sentence count is taken over
  the AC-truncated body (`parse-spec.ts:195-197`). Two regions, one number.
- Arithmetic worth carrying: REQ-096d1's proposed merge (`. Condition (g): ` →
  `, and ` plus `Condition (f):` → `Conditions (f) and (g):`) nets about −4
  characters, so 796c → ~792c — inside the limit by 8. That is the margin the plan
  should show for both 796c rows before an implementer starts rewriting.
- Must change: name the measure ("full body incl. AC/`_Check:` trailer, per
  `checkSpecViolations`") and add an expected post-merge character count per row, or
  say explicitly that the merge text for REQ-232a/REQ-318a is unproven and E4's
  re-measure loop is the acceptance gate.

M4 [clarity] The new Appendix M region description is inaccurate.
- `plan.md:77` (E5): "state the counted region (normative body before
  `*Acceptance criterion:*`)".
- Predicate: `parse-spec.ts:195-197` slices only at `*Acceptance criterion:*`; when
  a REQ carries a `_Check:` trailer and no AC block, the trailer stays inside the
  counted slice. Calling that region "the normative body" misdescribes the boundary
  in the document authors will read.
- Must change: describe it as "the body truncated at `*Acceptance criterion:*`
  (the `_Check:_` trailer remains inside the count)". One clause.

## Nits

N1 `plan.md:121` cites "`scripts/validate.ts:472,543-550,631`" for `splitSentences`.
`splitSentences` is called at `:630` and `:644` only (plus the `:21` import); `:472`
has no such call, and `:543-550` is the `entry.sentences` consumer, not a caller.
N2 `plan.md:36` attributes `--sdd-strict --quick --no-proofread` to
`scripts/lib/gate-manifest.ts:31-37`. The manifest maps `validate` →
`validate:fast`/`validate:sdd`; the flags are in `package.json:9,12`.
N3 `plan.md:75` says "Three self-test cases" and then lists four assertions
(9→error, 8→pass, 8+3 AC→pass, soft-phrase absence).
N4 `plan.md:79` says to update the sub-heading's "Three findings" intro. The intro
(`review-register.md:17-18`) reads "Three findings were demonstrated prose defects
and are fixed here"; moving F-U1-3 in makes it four. No replacement wording is given.
N5 `plan.md:14,35` say `checkReqShape` "reads only `entry.body`"; it also reads
`entry.paragraphCount` (`validate.ts:229`). Harmless, but the row is tagged `repo` and
reads as exhaustive.
N6 `scripts/lib/req-checks.ts` currently has no imports at all (every export takes
`text: string`). E1's `checkReqSentenceCount(reqs: Map<string, ReqBodyEntry>)` is its
first dependency (type-only on `parse-spec.ts`). Either say so or take
`Iterable<[string, { sentences: string[] }]>`.
N7 `plan.md:162-164` runs `npm run assemble` before `npm run build-order`; build-order
step 1 already assembles when `spec/` changed (`build-order.ts:182-186`). Harmless
duplication presented as an ordering requirement.
N8 `plan.md:20` heads the section "## Questions (user's words)"; `docs/plans/README.md:28`
names the section "Open questions". Cosmetic contract drift.
N9 Publication is unscoped. `plan.md` ends at "one commit lands" and never says
whether the increment is pushed; if it is, `holonovel/DECISIONS.md` gains the
`**Spec hash:**` sync and the dated `### Holonovel Spec Update` entry (AGENTS.md,
push-pipeline step 5b), neither of which appears in the blast-radius table
(`plan.md:131-146`). Say "local commit only" or add the row.

## Assumption challenge (as instructed)

1. *Compression preserves every clause under 800 chars* — unproven as written; see
   M2/M3. The mechanism is sound for five of seven rows (verbatim merged text is
   supplied); the two 796c rows carry 4 characters of headroom and no character
   accounting.
2. *Pure check in `req-checks.ts` is importable, `validate.ts` is not* — CONFIRMED.
   `validate.ts:2707` calls `main()` at module scope; `req-checks.ts` is a
   dependency-free module of pure exported functions.
3. *Register + ROADMAP + guarded-rule land together* — CONFIRMED in structure.
   `VIGIL` is `["scripts/lib/req-checks.ts","scripts/validate.ts"]`
   (`check-guarded-rule-change.ts:37`); acknowledgment is any register line
   containing "Appendix M" (`guarded-rule.ts:24-31`); the F-U1-3 entry already
   contains "Appendix M" (`review-register.md:2622`). `check-registers` only
   cross-checks REQs cited by **Scheduled-roadmap** findings
   (`register-checks.ts:64-70`), so moving to `## Resolved`
   (`review-register.md:12,14`) vacates the constraint that removing the ROADMAP
   section would otherwise break.
4. *Fingerprint regeneration covers every edited body* — CONFIRMED for scope.
   `DATA_SECTIONS` = `### 5.6 `, `### 5.9 `, `### 5.19 `, 5.21–5.28, 5.31, 5.32,
   §7.7, Appendix Q (`contract-fingerprint.ts:37-43`). Of the seven bodies, only
   §5.6 (REQ-072c1 at `02-requirements.md:1594`, REQ-232a at `:2165`) and §5.9
   (REQ-096d1 at `:3102`) fall inside; §5.3/§5.8/§5.10 do not. Assemble →
   fingerprints → check ordering is real (`build-order.ts:182-224`), and assemble
   writes both copies (`assemble.ts:149-155`).
5. *Done bar achievable in one session* — plausible; the bar is bounded and its
   gates are named. Not independently verifiable.

## Other claims spot-checked in the repo (all hold unless listed above)

`checkReqShape` at `validate.ts:223-257` (ends at 257, not the 263 the register
says) · soft-band phrase at `:2244` · shape PASS line at `:2248` (matches the
Verification section) · `--quick` does not gate the shape block (`:2501` only) ·
`extractReqBodiesWithSentences` at `parse-spec.ts:188-200`, AC slice at `:195-197`,
`splitSentences` at `:121-133` · Appendix M `:2867`, `:2893`, `:2949` ·
`AGENTS.md:174` parenthetical · ROADMAP section at `:15-28` with `**Trigger:**` at
`:26`, `## Non-goals` untouched at `:93` · F-U1-3 at `review-register.md:2618-2627`
· `assemble.ts:149-155` · `build-order.ts:254` version-bump, `:258` refresh-properties
(so `plan.md:166-167` is accurate).

## Unknowns

- The "1322 REQs, exactly seven over 8" enumeration was not re-derived; it requires
  running the parser. The seven IDs and their section membership do check out.
- "41 gates" in `plan.md:31,199` was not verified against `npm run gates -- --list`.
- Whether `check-guarded-rule-change`'s `registerAcknowledges` scans only added lines
  was not read (the decision helper was).
- Merged text for REQ-232a and REQ-318a is absent, so their 800-char feasibility is
  unverified.
- The authoring conversation and the user's actual words were deliberately not
  provided; `plan.md:20-27` cannot be checked.

## Coverage

Stages 1 (zoom out), 2 (comprehension), 3 (design / structural / style critics),
and 5 (readiness) completed. Stage 4 (re-zoom) did not run: it triggers only when
Majors are resolved by editing the artifact, and no edits exist within a cold pass.
No Blocker was found at Stage 5: file paths, the predicate name, its input
(`Map<string, ReqBodyEntry>`), its message string, the `> 8` comparison, the test
cases, and the done bar are all present; the residual decisions (merged prose wording,
character deltas) are covered by E4's per-edit re-measure rule rather than left
undecided. The verdict is therefore "passed with Majors", not "no findings".

## Limitation (must be read before stamping)

This host forbids the reviewer from spawning subagents, so the five stages ran
sequentially in one cold context instead of five fresh dispatches. The pass is still
cold with respect to the author — no authoring conversation, no prior findings, no
evidence-sidecar conclusions were supplied — but stage-to-stage isolation is
collapsed: Stage 2 and Stage 3 did not read the artifact without prior exposure to
each other's output. A finding that depends on that isolation should be re-run in a
true per-stage fan-out. This context also received the project's `AGENTS.md` by
harness injection, which the reviewer was not given explicitly.

Reads used: 37 of 40 (including 3 denied/aborted calls and 1 mistaken path).

---

# Diff re-review (targeted)

Revised plan sha256: 6e5707dbad373d411e229f987eaab36eaadbf03bd6385f6867ba0bbe15e02d4d
Revised tasks sha256: a9d6b9683ca9e21e4ed5d46c7f734863cc0835e34cedf53bec800a7e93c2206b
Repo: 9a2f31f. Budget: 9/10 reads. Scope: changed regions only.

## Per-finding status

| Finding | Status | Evidence |
|---|---|---|
| M1 — false "never read" premise | RESOLVED | Why block states "No predicate compares the counted sentences to a limit"; names `entry.body` + `entry.paragraphCount` and the `:542-550`/`:569-573` consumers; credits F-U1-3's "never counted" |
| M2 — contradictory compression rationale | RESOLVED | Real invariant stated (names/obligations never deleted, connective prose may be rewritten, review enforces preservation); "only replaces a boundary" claim gone |
| M3 — 800-char claim unquantified | RESOLVED IN STRUCTURE, ONE ROW WRONG (R1) | Measure named, after-length per row; REQ-096d1 figure was arithmetically impossible |
| M4 — Appendix M region omits `_Check:` | RESOLVED | E5 and the evidence row use the truncated-body wording with the trailer inside the count |
| N1 `:472` citation | RESOLVED | `:630`, `:644` call sites; `:542-550`/`:569-573` consumers |
| N2 flags vs manifest | RESOLVED | `package.json:9,12` for flags; manifest for the mapping |
| N3 "three cases" | RESOLVED | Four assertions across three cases; tasks.md mirrors |
| N4 "Three findings" intro | RESOLVED | "Four findings were demonstrated prose defects and are fixed here" |
| N5 "reads only body" | RESOLVED | `entry.paragraphCount` named |
| N6 first import in req-checks.ts | RESOLVED | Structural `Map<string, { id: string; sentences: string[] }>` |
| N7 redundant assemble | RESOLVED | build-order assembles; P4 and Verification agree |
| N8 heading drift | RESOLVED | "## Open questions" |
| N9 publication unscoped | RESOLVED | Open question 3 and User impact state local-commit-only |

## New findings

R1 — Major [design]. The REQ-096d1 after-length was impossible: the merge
replaces a 17-character boundary with a 17-character one, so the body cannot
shrink from 796c to 779c. Not execution-blocking (under 800 either way) but it
overstated headroom on the tightest row and contradicted the "chosen to shorten"
clause. Must change: correct the figure and the clause.
Nit — the "(exact)" column header while REQ-232a's cells elide unchanged halves;
drop "(exact)" or print the full text.
Nit — tasks.md repeated the 796 figure; keep it consistent with R1's correction.

## Verdict

`plan-review passed.` — condition: correct the REQ-096d1 row before P2 starts.
One Major outstanding, zero hard blockers. No new hard blocker; no changed line
contradicts a repo predicate.

# Post-review amendment (condition-only)

R1 and both nits are corrected after the re-review, so the reviewed sha no longer
matches the file. Amendments:

- REQ-096d1's after-figure is now `8 / ~796c (length-neutral)`, and the headroom
  paragraph states that its join replaces a 17-character boundary with a
  17-character one (about four characters of headroom), naming it the first row
  to re-measure. The "chosen to shorten" phrasing is gone.
- REQ-200's after-figure corrected from `~788c` to `~792c` (the `; a closed` →
  `, and a closed` join adds four characters).
- The merge column header no longer says "(exact)"; a note says elided halves
  are unchanged prefixes and the review diff covers the whole body.
- `tasks.md` T4 re-measures REQ-096d1 first and states the assembled-spec
  measure.

No new file, gate, or destructive operation was introduced, so this is a
condition-only amendment verified by `build-review` rather than a second review
pass.

Final plan sha256 (after the condition-only amendment):
Plan sha256: 86a46a50dac3c54f646849af94893bce93c5d7277957d6f34cfa3286771fb7d2
Compiled tasks sha256:
a9d6b9683ca9e21e4ed5d46c7f734863cc0835e34cedf53bec800a7e93c2206b
