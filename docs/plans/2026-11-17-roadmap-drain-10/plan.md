# Plan — Roadmap drain 10: REQ evidence linkage chunk 9 (cross-artifact agreement)

**Date:** 2026-11-17 · **Kind:** planned · **Depth:** standard · **Revision:** 4 ·
**Increment:** `docs/plans/2026-11-17-roadmap-drain-10` · **Rollback cost:** 1 ·
**Evidence:** git HEAD `66fa82d`; tracked tree clean (`git status --porcelain` empty), so the
baseline is recoverable with `git checkout -- <path>`. Baseline: `npm run check:fast` exit 0
(`46 passed, 0 failed`, trailing `check:fast: PASS`); `npm run validate` exit 0,
`0 error(s), 359 warning(s)`, `REQ evidence linkage: 50 finding(s)`; `npm run status` — 5 open
roadmap items, 143 unpushed commits, tag `v2026.11.08`, last pipeline run stopped at `record`.
**Trust boundary:** every premise below is `repo` evidence read from this checkout. No web or
user-supplied content is embedded.
**Review history.** Revision 1 was read by one cold pass (five stages, one cold context). It
raised three Blockers — the `T297` probe mutated the source fixture while the check reads the
assembled spec, so the probe could not fire; `tasks.md` sat in the blast radius with no phase
authoring it; and P5 ran `check:fast` before the AAR carried its terminal token — plus five
Majors (REQ-082b's default-ordering clause was silently unclaimed; the view-token insertion was
modelled as unconditional; the "not a heuristic" justification overstated a regex parser; D3
omitted its region and seed association rules; the new signatures omitted `: string[]`) and four
Nits (duplicate read path, the static-only limit of clause (e), "47" reading as REQs, and V4's
unqualified line count). Revision 2 resolves all twelve: the probe now restores through
`npm run assemble`, P1 authors `tasks.md`, P5 fills the terminal token before any gate run, D2
asserts the order equality that covers the default-ordering clause, the view token is
conditional on `narrative_threads`, every parse predicate is stated, and every signature is
written with its `: string[]` return type. The cold diff re-review of revision 2 confirmed all
twelve as RESOLVED and raised two Majors and one Nit on the changed lines, all fixed in
revision 3 (a condition-only amendment, not re-reviewed): V4's row-count cross-check used a BRE
alternation (`'^\| REQ-'`) that counts every line instead of the literal pipe, D3 pinned the
transcript array length but not its die size, and V2's prose said "four" labelled failures while
listing five.

## Questions

The request: "draft plan for open roadmap items." `ROADMAP.md` carries five sections. Four are
trigger-gated or operator-bound (EV2); one — item 3, REQ evidence linkage — is the standing work
queue that chunks 1–8 have been draining (80 → 50). This plan advances item 3 with the next
bounded chunk and records why the other four are not in this increment.

## Why

- **EV1 — item 3 residue is 50 rows, all class (b).** `ROADMAP.md:36-60` carries item 3. The
  corpus is `docs/plans/2026-11-15-req-evidence-linkage/corpus.md` — 52 lines (2 header + 50
  rows), every row `Automated | automated-unexercised`. `npm run validate` prints
  `REQ evidence linkage: 50 finding(s)` on this tree. The predicate is T-ID-scoped: an
  `Automated` Appendix F row with no exercised T-ID
  (`scripts/lib/req-checks.ts:888`), where "exercised" means the ID literal appears inside a
  `check*` function's `push`/`console`/`return` argument, a `test(...)` first argument, or a
  `check(...)` argument (`labelsFromContent`, `scripts/lib/req-checks.ts:854-871`; the accepting
  function shape is `function check…(…): string[] {`, `:812-823`), scanned over every `.ts` under
  `scripts/` (`scripts/validate.ts:1485`, consumed at `:1511-1515`).
- **EV2 — the other four roadmap items cannot start in this session.**
  - Item 1, independent verification (`ROADMAP.md:15-23`): triggered by "the first publish after
    2026-11-16", and `npm run status` reports the last pipeline run stopped at `record` with 143
    unpushed commits. The work itself binds the operator: §10 steps 2–3 require a cold checkout, a
    redacted DECISIONS.md (6), and "a fresh agent session — a different model from the builder"
    (`spec/07-independent.md:11-18`). This session cannot supply a different model or the
    operator's adjudication, so the item stays scheduled.
  - Item 2, mutation-sample depth (`ROADMAP.md:25-34`): trigger is "the next Holosuite lens
    change"; no lens change is scheduled and this increment adds none. Not triggered.
  - Item 4, split `index.ts` (`ROADMAP.md:62-69`): trigger is "the next increment that moves more
    than 50 anchors, or a week with more than 100 reads of one file". This increment moves no
    evidence anchors (V8 records the anchor delta as 0) and reads `index.ts` twice, once per
    check. Not triggered.
  - Item 5, codex pack (`ROADMAP.md:71-81`): P3, trigger is "the next artifact-registry change
    (REQ-620/REQ-621), or a request to move a codex library between hosts"; neither applies.
- **EV3 — `T205` (REQ-082b) is measurable today and currently clean.** REQ-082b
  (`spec/02-requirements.md:2664-2665`) requires the builder to document the complete
  section-token-to-group mapping and the default ordering in DECISIONS.md, citing the REQ-109
  group each token corresponds to. The mapping exists: a 40-row table at
  `holonovel/DECISIONS.md:270-311` (header `:270`, separator `:271`, rows `:272-311`) with columns
  `# | Token | REQ-109 group | Layer`. The runtime registry is `BRIEFING_SECTIONS`
  (`holonovel/src/index.ts:17782-18574`, 39 `token:` literals) plus `BRIEFING_VIEW_TOKENS`
  (`:18578`, one token, `countdowns`), composed into `BRIEFING_TOKENS` (`:18586`) and
  `VALID_BRIEFING_TOKENS` (`:18595`), which is the enumeration printed by the unknown-token
  rejection at `:12104`. Measured on this tree: the DECISIONS token set and the runtime token set
  are equal (40 = 39 + 1; zero missing, zero extra), the DECISIONS row order is identical to the
  runtime emission order (`BRIEFING_VIEW_TOKENS` inserted after `narrative_threads`, mirroring
  `holonovel/src/index.ts:18586-18592`), and the `#` column runs 1..40 contiguous.
- **EV4 — `T297` (REQ-277) is measurable today and currently clean.** REQ-277
  (`spec/02-requirements.md:83-91`) requires the maintainer to update "the transcript and RNG
  witness values to match the new expected behavior", and treats a mismatched fixture as a spec
  defect. The witness tables exist at `spec/appendices-fixtures.md:279-296` (B.4: seeds 42 and 7,
  first 10 d6 faces and first 10 d20 faces) and `:762-775` (N.4: seeds 8, 1000, 2000, 88888,
  first 10 d20 faces), and both documents name the generator: `state ← (state × 1664525 +
  1013904223) mod 2³²`, initial state `seed`, d6 `⌊next() × 6⌋ + 1`, d20 `⌊next() × 20⌋ + 1`
  (`:285-289`). Measured on this tree: all eight witness rows reproduce exactly (80 of 80 faces).
  The B.3 transcript (`:178-273`) carries three seed-pinned bracketed die arrays — `Dice: 2d6 =
  [2, 1]` under `seed: 42` (`:204`), the inline `(Delve: [2, 1] + 2 = 5)` under `seed: 42`
  (`:258`), and `(Steady: [2, 6] + 1 - 1 = 8)` under `seed: 7` (`:264`) — and all three equal the
  first draws of the LCG (2, 1 twice; 2, 6). One further seed-pinned roll, `Knacks (knacks):
  rolled 2` under `seed: 42` (`:218`), states a single result without a die count and is excluded
  from the assertion (D3). No script asserts any of this:
  `grep -rn "witness" scripts/*.ts scripts/lib/*.ts` returns nothing.
- **EV5 — `T106` (REQ-107b) is half-asserted by `version-check.ts`.** REQ-107b
  (`spec/02-requirements.md:889-891`) requires `spec_health.spec_version` to be a CalVer
  date-stamp matching DECISIONS.md §2 Pinned Versions, and the server `package.json` version to
  match both. `scripts/version-check.ts` already compares `holonovel/package.json`
  (`:78`), `holonovel/AGENTS.md` (`:76-79`), the `| Spec version |` row of
  `holonovel/DECISIONS.md` (`:82-86`; first match at `holonovel/DECISIONS.md:1721`, the later
  historical rows at `:2871` and `:2913` do not match `grepVersion`'s first-match read),
  `holonovel/src/index.ts` (`:88-91`), the lockfile, `server.json`, and asserts the version is
  read dynamically from `package.json` (`:101-106` via `checkFileContains` on
  `holonovel/src/core/state.ts`). Nothing asserts the **CalVer shape** — a version such as
  `2026-11-16` or `2026.1.5` passes today. The file already carries the sanctioned labelled-check
  shape: `checkVersionCurrency` (`:150-164`) returns `string[]` and opens its message with
  `T493` (`:158`), so a sibling function is idiomatic there.
- **EV6 — the three rows share one predicate class: agreement between two committed artifacts.**
  `T205` compares DECISIONS.md to the source registry, `T297` compares the witness tables to the
  generator and the transcript to the witness tables, `T106` compares the version surfaces to
  each other and to the CalVer grammar. None needs a server, a ruleset build, or a new gate.
- **EV7 — no spec edit is required, so `assemble` stays byte-stable.** All three homes are
  scripts (`scripts/validate.ts`, `scripts/version-check.ts`); the artifacts read are
  `holonovel/DECISIONS.md`, `holonovel/src/index.ts`, `holonovel/package.json`, and the assembled
  `holonovel.md` (which `validate` already loads, `scripts/lib/parse-spec.ts:9`).

## Decisions

- **D1 — Scope: three class-(b) rows — `T205` (REQ-082b), `T297` (REQ-277), `T106` (REQ-107b).**
  Each clause is a machine-checkable agreement between committed artifacts that no gate compares
  today (EV6). Residue 50 → 47; the roadmap restates it.
  - Rejected: the remaining `§7.7.1a` coupling rows (`T432`, `T433`, `T426`, `T422`, `T428`,
    `T496`). Each requires a build against the D&D 5e SRD and per-spell assertions
    (`spec/appendices-reference.md:1902-1903`, `:1896`); the reference tree carries no committed
    coupling table to assert against, so a check would have to encrypt fixture expectations into
    the validator. Chunk 7 already covered the cluster with a committed artifact
    (`docs/plans/2026-11-17-roadmap-drain-8/plan.md`).
  - Rejected: `T537`/`T539`/`T107`/`T164` (Pattern Buffer record family). Chunk 8 measured the
    ruleset harness at 29 `s_id` scenarios against the 37 sub-workflows §6.6 numbers, so an
    error-mode coverage assertion would fail the current tree and force an out-of-plan harness
    rewrite (`docs/plans/2026-11-17-roadmap-drain-9/plan.md`, D1).
  - Rejected: the bucket-C runtime rows (`T72`, `T73`, `T379`, `T205`'s runtime half, `T4`,
    `T371`, `T489`). Each needs a live server call; `labelsFromContent` scans only `scripts/**`,
    so a label authored in `holonovel/scripts/test-*.ts` would not register, and a label placed in
    `scripts/` for behaviour that file does not exercise would be a copied ID rather than an
    assertion (chunk 7's rule).
  - Rejected: `T87` (REQ-100b/d). The row asks for "query latency ≤ 1 second", but REQ-100a
    (`spec/02-requirements.md:2406`) says query latency "carries no pass/fail threshold". A gate
    asserting the row would contradict its own REQ; the row needs a spec-side reconciliation
    first, which is out of scope here.
- **D2 — `T205` home: new `function checkBriefingTokenRegistry(text: string): string[]` in
  `scripts/validate.ts`.** It asserts five things: (a) the DECISIONS.md mapping table parses to 40
  rows, each with a `#` cell, a backticked token, a non-empty group cell, and a layer cell drawn
  from `critical`/`supplementary`; (b) the `#` column is contiguous 1..40; (c) the table's token
  **order** equals the runtime emission order — `token:` literals inside the `BRIEFING_SECTIONS`
  array body, with the single `BRIEFING_VIEW_TOKENS` entry inserted immediately after
  `narrative_threads`, exactly as `holonovel/src/index.ts:18586-18592` composes it; (d) the token
  **set** is therefore equal in both directions; (e) the unknown-token rejection at `:12104`
  interpolates `VALID_BRIEFING_TOKENS`, so the enumeration the spec calls "valid tokens" is the
  same set. The failure messages carry `T205`.
  - Clause (c) is what asserts REQ-082b's "default ordering" half: the documented row order and
    the runtime emission order are the same permutation, so a reordered DECISIONS table or a
    reordered array fails. It does not assert the *prose* rationale at
    `holonovel/DECISIONS.md:238-243` (why the order is what it is); that is unclaimed in
    `dispositions.md`.
  - The view-token insertion is conditional in the source (`:18590`: only when
    `section.token === "narrative_threads"`). The check reproduces the condition and fails with
    `T205` if `narrative_threads` is absent from the array body, so a renamed section cannot
    produce a false pass against a set the server never builds.
  - Parsing is marker-bounded, not line-numbered: the array body is the span between
    `const BRIEFING_SECTIONS` (`:17782`) and `const BRIEFING_VIEW_TOKENS` (`:18578`), the view
    entry is the span between those and `const BRIEFING_BY_TOKEN` (`:18582`), and a missing
    marker is itself a `T205` failure rather than a silent empty set. The token literal is matched
    as a whole-line `token: "…"` property; the layer vocabulary is the two values the table uses
    today, and a third value fails loudly (a deliberate signal to amend the check, not a silent
    pass).
  - The group cell is asserted non-empty under the header `REQ-109 group`; the check does **not**
    re-derive REQ-109's enumeration, so it claims "each token carries a group label", not "each
    label is the canonical REQ-109 name".
  - Existing-check discovery (recorded): `grep -rln "BRIEFING_SECTIONS\|section_tokens\|briefing
    section token" scripts/` returns no file, so no gate comparison exists to extend.
  - Not claimed, and recorded in `dispositions.md`: T205 sentence 2 ("invoke
    `manage_context (action: briefing_order)` with an unknown token — assert
    `[ERROR] [INVALID_INPUT]`") is a live-server drill. Clause (e) is a static binding — it can
    only see that the template interpolates the identifier, not that the value reaches a client —
    and that limit is what the disposition records.
  - Rejected: a new `check-token-registry.ts` gate — it duplicates `validate`'s invocation path
    for two file reads and adds a manifest row plus a `check-script-discipline` surface.
    Rejected: reading `spec_health.section_tokens` from a fixture — the registry source is the
    same array, so the comparison would be tautological.
- **D3 — `T297` home: new `function checkFixtureWitness(text: string): string[]` in
  `scripts/validate.ts`.** It implements the B.4 generator verbatim (32-bit LCG, multipliers
  1664525/1013904223, d6 and d20 draws) and asserts: (a) every row of the B.4 and N.4 tables
  equals the first-N draws for its seed and die — B.4 rows carry both a d6 and a d20 column, N.4
  rows a d20 column; (b) every seed-pinned bracketed die array in the B.3 transcript equals the
  draws for its seed, accepting both the `Dice: 2d6 = [2, 1]` line form (`:204`) and the inline
  `(Delve: [2, 1] + 2 = 5)` form (`:258`, `:264`); (c) every face lies within 1..faces. The
  single-die table roll `rolled 2` (`:218`) is excluded — the transcript does not state its die
  count, so binding it to "the first d6 draw" would be an assumption, not an assertion. The
  failure message carries `T297` and names the table, seed, and drawing column.
  - Regions are heading-bounded, not line-numbered: B.3 is `### B.3` … `### B.4`, B.4 is
    `### B.4` … the next `---` rule or `### ` heading, N.4 is `### N.4` … the next rule or
    heading. The `:279-296` / `:762-775` / `:178-273` citations in EV4 are evidence of where those
    regions sit today, not parse anchors.
  - Seed association is nearest-preceding: a bracketed array binds to the last `"seed": N` in its
    own request/response block (today `:202→:204`, `:257→:258`, `:263→:264`). Each array is an
    independent call that restarts at the seed's first draw — draws are **not** consumed
    cumulatively across the transcript, which is why the assertion compares each array to the
    first draws rather than to a running cursor.
  - The bracketed form is matched as `[<int>, <int>, …]` of length ≥2; the die **size** is d6 for
    every array in the B.3 transcript today, and that is pinned rather than inferred — a
    bracketed array whose request line does not resolve to a d6 move, or an array whose length
    exceeds the resolved die count, is a `T297` parse error rather than a guess. A single-value
    bracket is skipped (no die count to bind). A witness-table column naming a die other than d6
    or d20 is likewise a fail-loud parse error, so a future `2d8` inline roll cannot be silently
    compared against d6 draws.
  - Not claimed, and recorded in `dispositions.md`: T297 sentences 1–2 (the maintainer edits the
    source so replay fails, bumps the fixture version, and records the citing REQ in the fixture
    changelog comment). Those are maintainer actions on a break, not properties of the committed
    tree. The version comments themselves (`spec/appendices-fixtures.md:36`, `:386`, `:975`,
    `:1085`, `:1125`) are not asserted.
  - Rejected: asserting against a hardcoded expected-value table in the script — the point is to
    derive from the generator, not to restate the answer. Rejected: replaying B.3 in a harness —
    out of scope for a committed-artifact check (chunk 8's D1 rejected the same class).
- **D4 — `T106` home: new `function checkVersionCoordination(rootVersion: string,
  decisionsVersion: string | null): string[]` in `scripts/version-check.ts`.** It asserts: (a)
  `rootVersion` matches `^\d{4}\.\d{2}\.\d{2}$` (CalVer date-stamp; the missing clause, EV5); (b)
  the DECISIONS `| Spec version |` value equals `rootVersion` (re-expressing the existing
  `:82-86` equality as the T106 clause so the label sits on an assertion this function owns); (c)
  the month and day are in range and the date is a real calendar date. The failure messages carry
  `T106`. The existing `T493` currency check (`:150-164`) is untouched and stays a separate
  function.
  - Not claimed: `spec_health` reports the field, the Player badge reads it, and the same-version
    gap audit exits "current" — all live-server clauses. The dynamic-read half is already
    asserted by `checkFileContains` (`:101-106`) and is not re-claimed here.
  - Rejected: adding `version-check` to a local gate. `AGENTS.md` records version consistency as
    a CI-only step; the linkage scanner reads every `scripts/**/*.ts` regardless of gate wiring
    (`scripts/validate.ts:1485`), so the label counts without changing the publication surface.
- **D5 — all three checks parse text that already ships; no new artifact, no fixture, no
  network.** `validate` already loads the assembled spec (`scripts/lib/parse-spec.ts:9`), and the
  worker reads `holonovel/DECISIONS.md`, `holonovel/src/index.ts`, and
  `holonovel/package.json` directly from `path.resolve(import.meta.dirname, "..")` — the pattern
  `checkHandoffDocs` (`scripts/validate.ts:2267-2269`) already establishes.
- **D6 — register coupling (hard-check §2).** The increment updates, in the same step:
  `ROADMAP.md` item 3 (residue "50 findings" → "47 findings", i.e. **47 rows**, still stated as a
  row count so the register never reads as 47 fully exercised REQs, plus the three T-IDs, at most
  three bullets — the `check-roadmap` cap, `scripts/check-roadmap.ts`); `spec/audit/review-register.md`
  (a `### 2026-11-17 — REQ evidence linkage chunk 9` subsection under `## Scheduled-roadmap`);
  the corpus (`npm run validate -- --write-linkage-corpus docs/plans/2026-11-15-req-evidence-linkage/corpus.md`);
  the coverage register (`npm run validate -- --write-register`); and `CHANGELOG.md` via the AAR
  block. No ROADMAP section is retired, so no `Scheduled-roadmap` row is renamed.
- **D7 — probes are negative and restored.** Each assertion is proven by a failure on a mutated
  artifact, then the artifact is restored and `git status --porcelain -- <path>` is confirmed
  empty for the probed paths (the increment directory stays untracked until `session:close`).
  - `T205` probe: change one DECISIONS token row's token to a value absent from the registry;
    `validate` must report the `T205` message; restore `holonovel/DECISIONS.md`.
  - `T297` probe: `checkFixtureWitness` reads the **assembled** `holonovel.md`
    (`scripts/lib/parse-spec.ts:9`), so the probe edits the source fixture and re-assembles:
    change one face in the B.4 seed-42 d6 row → `npm run assemble` → `validate` must report the
    `T297` message → `git checkout -- spec/appendices-fixtures.md` → `npm run assemble` again →
    `git diff --stat holonovel.md` empty. Repeat once for one die value in the B.3 seed-42 array
    (`:204`).
  - `T106` probe: change the DECISIONS `| Spec version |` value; `npx tsx scripts/version-check.ts`
    must fail with the `T106` message; restore. A second probe lowers the root version's day
    digit (`2026.11.6`) to prove the CalVer-shape clause, then restores `package.json`.
  - `check:fast` runs un-piped and its trailing `check:fast: PASS` is the reading.

## Blast radius

| File | Change | Size |
|---|---|---|
| `scripts/validate.ts` | new `function checkBriefingTokenRegistry(text: string): string[]` and `function checkFixtureWitness(text: string): string[]` + two calls in `main()` beside `:2686` | M |
| `scripts/version-check.ts` | new `function checkVersionCoordination(rootVersion: string, decisionsVersion: string \| null): string[]` + call before the exit gate | S |
| `ROADMAP.md` | item 3 restated at 47 rows | S |
| `spec/audit/review-register.md` | chunk-9 subsection | S |
| `docs/plans/2026-11-15-req-evidence-linkage/corpus.md` | regenerated (49 lines) | S |
| `spec/audit/req-coverage.md` | regenerated (evidence cells) | S |
| `docs/plans/2026-11-17-roadmap-drain-10/plan.md` | this plan | S |
| `docs/plans/2026-11-17-roadmap-drain-10/tasks.md` | P1 checkpoint list, updated as phases land | S |
| `docs/plans/2026-11-17-roadmap-drain-10/dispositions.md` | per-row findings and the unclaimed-clause record (P1) | S |
| `docs/plans/2026-11-17-roadmap-drain-10/aar.md` | written in P5, finalised before `session:close` | S |
| `CHANGELOG.md` | rendered from the AAR block by `session:close` | S |

Rollback: both script edits are additive functions plus call lines; every other change is a
register or a generated artifact. `git checkout --` on the tracked files above returns the tree to
`66fa82d` with no generated artifact orphaned. No file under `spec/` is edited, so `assemble` is
byte-stable (V7). Ordering: P2 and P3 both edit `scripts/validate.ts`, so they run in sequence;
P4 edits a different file and can run before, between, or after them. No step depends on another
step's output except P5, which needs all three labels in place before it regenerates the corpus.

## Phases

- **P1 — Dry run, tasks list, and dispositions.** Accept: `npm run validate` reproduces `50
  finding(s)` and 0 errors; each pre-edit condition is re-confirmed by a command rather than by
  this plan's prose — `T205`: 40 DECISIONS rows, contiguous `1..40`, 39 + 1 runtime tokens in the
  same order; `T297`: 8 witness rows × 10 faces all match and 3 transcript die arrays match;
  `T106`: `2026.11.16` satisfies the CalVer grammar. Write `tasks.md` (one line per phase with its
  acceptance check, ticked as phases land — `session:close` is strict about its presence,
  `scripts/lib/loop-artifacts.ts:64-74`) and `dispositions.md` with one row per finding
  (`| REQ | T-ID | class | cite | home | action |`). The three checks compare a **pinned**
  artifact shape (a fixed table header, a fixed array marker, a fixed generator) with exact set
  and arithmetic equality; the risk is a *shape* change, not a false-positive rate, so P1 pins
  each shape by command and the checks fail loud on a missing marker or an unknown die column
  instead of silently passing. Stop rule: if any predicate does not hold as EV3–EV5 claims (e.g.
  a witness face mismatches, or the DECISIONS token set has drifted), record the reading, leave
  the registers untouched, and either fix the artifact as its own finding or drop that row from
  the chunk. No source write before this stop rule clears.
- **P2 — `T205`.** Accept: `checkBriefingTokenRegistry` reports nothing on the unmodified tree and
  `validate` drops to 49 findings; all five clauses (row shape, contiguous numbering, order
  equality, set equality, enumeration binding) are implemented, and the missing-marker and
  missing-`narrative_threads` paths each fail with `T205`. Probe per D7.
- **P3 — `T297`.** Accept: `checkFixtureWitness` reports nothing on the unmodified tree and
  `validate` drops to 48 findings. Probe per D7 (two mutations, each restored through
  `npm run assemble`).
- **P4 — `T106`.** Accept: `checkVersionCoordination` reports nothing; `npx tsx
  scripts/version-check.ts` reports **exactly the pre-existing `T493` currency failure and
  nothing else** (see the delta amendment at the end of this plan — the pre-edit run is already
  exit 1 on that line, unrelated to `T106`); `validate` drops to 47 findings.
  Probes per D7 (two: DECISIONS row, CalVer shape).
- **P5 — Registers, artifact, gates.** Accept: `ROADMAP.md` item 3 has at most three bullets and
  reads "47 findings"/47 rows; the review-register subsection exists; the corpus is 49 lines with
  the three T-IDs absent; the coverage-register diff is recorded for the three REQs. Then, in
  this order: write `aar.md` with the plan's readings **and its terminal token already filled**
  (an existing `aar.md` without `LOOP PAUSED`/`LOOP OPEN` fails `check-loop-artifacts`
  unconditionally, `scripts/lib/loop-artifacts.ts:79-84`, which would redden V3) → run V1–V9 and
  record every reading → **finalise `aar.md`** (probe evidence, changelog block, terminal token
  confirmed) → run V3 last, un-piped, with `check:fast: PASS` as the reading → `session:close`.

## Verification

| # | Command | Expected |
|---|---|---|
| V1 | `npm run validate` | exit 0; `0 error(s)`; `REQ evidence linkage: 47 finding(s)` |
| V2 | per-check probes (P2–P4) | five labelled failures (`T205` ×1, `T297` ×2, `T106` ×2), each restored (`git status --porcelain -- <path>` empty; for `T297`, `git diff --stat holonovel.md` empty after the restoring `npm run assemble`) |
| V3 | `npm run check:fast` (un-piped, run last in P5) | `46 passed, 0 failed` … `check:fast: PASS` |
| V4 | `wc -l docs/plans/2026-11-15-req-evidence-linkage/corpus.md`; `grep -c '^| REQ-' <same file>` | `49`; `47` — the two agree, so a writer that emits no trailing newline cannot fake the count |
| V5 | item-3 bullet count; `grep -c` for the three T-IDs in the corpus | `3`; `0` |
| V6 | `npm run check-registers`; `npm run check-roadmap` | pass |
| V7 | `npm run assemble`; `git diff --stat holonovel.md` | byte-stable (no spec source edited) |
| V8 | `git diff --numstat` on anchor files | anchor delta `0` (item 4 stays untriggered) |
| V9 | `npx tsx scripts/version-check.ts` | FAIL set unchanged from the pre-edit baseline: `T493` currency only (root `2026.11.16` predates the `2026-11-17` CHANGELOG entry — a publish-time version bump, REQ-107a, not this increment); no new failure line |

## Done bar

**Done bar:** three class-(b) rows carry real asserting sites and their T-IDs (`T205`, `T297`,
`T106`); the linkage residue is 47; each assertion has a recorded negative probe; the four
registers are consistent; `check:fast` is green; `aar.md` ends `LOOP PAUSED`; `npm run
session:close --single` commits the increment.

## Out of scope

The remaining 47 linkage rows (scheduled on `ROADMAP.md` item 3 by family); roadmap items 1, 2, 4
and 5 (EV2); T205's and T106's live-server clauses and T297's maintainer-action clauses (D2–D4);
REQ-100a/T87's latency contradiction; any change to `spec/` prose; any new gate, harness, or tool;
wiring `version-check` into a local gate; publication.

## Open questions

- None blocking. The one judgement call — partial-clause claims — is recorded in D2–D4: each row
  claims the clause its check asserts and names the unclaimed clauses in `dispositions.md`, the
  same shape chunk 8 used for `T298`. If the re-review holds that a partial-clause label is not a
  closure for `T106` or `T205`, that row leaves the chunk; the Done bar's residue then reads 48 or
  49 and this plan is amended before execution.

## Delta amendment — 2026-11-17, before the first edit

**What changed.** `npx tsx scripts/version-check.ts` on the untouched tree at `66fa82d` exits **1**,
not 0: `FAIL T493 — version currency: root version 2026.11.16 predates the latest substantive
CHANGELOG entry (2026.11.17)`. The root CalVer is one day behind the newest CHANGELOG heading,
which is the publish-time version bump (REQ-107a, `npm run version-bump` in the publication
pipeline), not an artifact of this increment. `check:fast` does not see it because version
consistency is CI-only (`AGENTS.md`).

**Why.** Revision 3's V9 and P4 assumed a green baseline for that command; the pre-edit baseline
run (§0.5) disproved it. Left unamended, P4's acceptance and V9 could never pass, and a green
`checkVersionCoordination` would be indistinguishable from a masked failure.

**Amendment.** P4's acceptance and V9 now assert the **FAIL set is unchanged** — exactly the
`T493` currency line before and after, with no new line from `T106`. This is stricter than
"exit 0" for this increment's purposes: it proves the new check adds no failure and that no
pre-existing failure is hidden. The `T493` failure is recorded in `aar.md` as a pre-existing
finding outside this increment's scope, with its recovery path named.

**Scope.** No file list change, no new gate, no destructive step — a verification-expectation
amendment, re-stamped and verified by `build-review`.
