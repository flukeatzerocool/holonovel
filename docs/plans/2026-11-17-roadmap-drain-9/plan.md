# Plan — Roadmap drain 9: REQ evidence linkage chunk 8 (the committed-artifact assertions)

**Date:** 2026-11-17 · **Kind:** planned · **Depth:** standard · **Revision:** 3 ·
**Increment:** `docs/plans/2026-11-17-roadmap-drain-9` · **Rollback cost:** 1 ·
**Evidence:** git HEAD `84a39a2`; the tracked tree is clean — `git status --porcelain` shows only
the untracked increment directory `?? docs/plans/2026-11-17-roadmap-drain-9/`, recorded the same
way in the preflight sidecar. Baseline: `check:fast` exit 0 (`46 passed, 0 failed`, trailing
`check:fast: PASS`); `npm run validate` exit 0, `0 error(s), 359 warning(s)`,
`REQ evidence linkage: 54 finding(s)`; `npm run status` — 5 open roadmap items, 142 unpushed
commits, tag `v2026.11.08`.
**Trust boundary:** every premise below is `repo` evidence read from this checkout. No web or
user-supplied content is embedded.
**Review history.** Revision 1 was read by the cold stages 1–2 and the stage-3 critique. It raised
one Blocker (D2 proposed a per-file diff against no recorded per-file baseline — the comparison
was a tautology; the map records one aggregate hash), four Majors (REQ-278's file-list clause is
attributed to the builder's DECISIONS.md (6), not the validate message; P3's pre-edit expectation
contradicted D5; T186 under-asserted REQ-153; the probe-restore check could never pass with an
untracked increment directory), and four Minors (Holonovel-map row count 25 not 21; the cited
README range omitted the RSS/date lines; three line drifts; the server README already carries the
attribution bullets). Revision 2 removes the per-file mechanism, narrows D2 to the clause the
validate check actually asserts, strengthens the T186 predicate, scopes the restore check, and
corrects every citation. The targeted re-review resolved every one of those and left one Major, a
count mismatch: a case-insensitive `Built from:` test would pass on the pre-edit tree (the section
already says "built from:"), making the pre-edit set three items rather than four. Revision 3 is a
condition-only amendment — the check now requires the literal capitalised `Built from:` lead-in,
which restores the four-item expectation and makes the T5 re-prefix a real change; it also aligns
P2's intermediate count (52) and the rollback file count.

## Questions

The request: "draft plan for open roadmap items." `ROADMAP.md` carries five sections. Four are
trigger-gated or operator-bound (EV2); one — item 3, REQ evidence linkage — is the standing work
queue. This plan advances item 3 with the next bounded chunk and records why the other four are
not in this increment.

## Why

- **EV1 — item 3 residue is 54 rows, all class (b).** `ROADMAP.md:36-58` carries item 3. The
  corpus is `docs/plans/2026-11-15-req-evidence-linkage/corpus.md` — 56 lines (2 header + 54
  rows), every row `Automated | automated-unexercised`. `npm run validate` prints
  `REQ evidence linkage: 54 finding(s)` on this tree. Chunk 7 closed the §7.7 archetype family
  (`T420`, `T425`, `T439`, `docs/plans/2026-11-17-roadmap-drain-8/aar.md`).
- **EV2 — the other four roadmap items cannot start in this session.**
  - Item 1, independent verification (`ROADMAP.md:15-23`): triggered by "the first publish after
    2026-11-16", and `npm run status` reports the last pipeline run stopped at `record` with 142
    unpushed commits. The work itself binds the operator: §10 steps 2–3 require a cold checkout,
    a redacted DECISIONS.md (6), and "a fresh agent session — a different model from the builder"
    (`spec/07-independent.md:11-18`). This session cannot supply a different model or the
    operator's adjudication, so the item stays scheduled.
  - Item 2, mutation-sample depth (`ROADMAP.md:25-34`): trigger is "the next Holosuite lens
    change"; no lens change is scheduled. Not triggered.
  - Item 4, split `index.ts` (`ROADMAP.md:60-67`): trigger is "the next increment that moves more
    than 50 anchors, or a week with more than 100 reads of one file"; this increment moves no
    evidence anchors (V8 records the delta as 0).
  - Item 5, codex pack (`ROADMAP.md:69-79`): P3, trigger is "the next artifact-registry change
    (REQ-620/REQ-621), or a request to move a codex library between hosts"; neither applies.
- **EV3 — `T298` (REQ-278) has an asserting site, unlabelled.** REQ-278
  (`spec/02-requirements.md:896-904`) has three obligations: the map carries the concatenated hash
  at assembly; the **builder** records a DECISIONS.md (6) process-compliance finding "with the list
  of files whose content differs"; and "The `npm run validate` check SHALL verify the map's hash
  matches the current spec file set." `checkPhaseMapHash`
  (`scripts/validate.ts:1465-1477`) computes `computeSpecContentHash()`
  (`scripts/lib/phase-map-hash.ts:36-50`) and reports a mismatch; it is called at
  `scripts/validate.ts:2577`. It asserts the third obligation exactly. The map records a single
  aggregate hash (`spec/build-phase-map.md:3`; `readPhaseMapHash` returns one string,
  `scripts/lib/phase-map-hash.ts:46-50`), so no per-file comparison is possible without a new
  recorded artifact.
- **EV4 — `T538` (REQ-108c) is fully asserted, but the gap error carries no T-ID.**
  `checkPatternBufferCoverageMap` (`scripts/validate.ts:927-978`) parses the §6.6 map, derives the
  covered-section REQ families (`:943-957`, matching REQ-108a's list at `spec/03-build.md:1314`),
  and errors at `:961` for a REQ with no map row. The map's explicit non-Pattern-Buffer
  dispositions are rows (`| REQ-370 | — (validated by npm run validate) | Coupling derivation |` at
  `spec/03-build.md:1597`), which the parser admits, so REQ-108c's "row or explicit disposition"
  alternative is already honoured. Only the label is missing.
- **EV5 — `T186` (REQ-153) is not satisfied by the current handoff doc.** REQ-153
  (`spec/02-requirements.md:293-304`) requires a `## Troubleshooting` section naming four failure
  classes, each with steps "an operator can follow without access to the builder", and verification
  commands "where a matching automated test exists". `holonovel/AGENTS.md` has eight `##` sections
  (`:5`, `:65`, `:138`, `:176`, `:188`, `:201`, `:217`, `:247`) and no `## Troubleshooting`;
  `grep -n "config mismatch\|corrupted state\|badge confusion\|missing environment"` over it
  returns nothing. No existing gate checks this: `checkAgentsMapFreshness`
  (`scripts/validate.ts:2224-2248`) reads only the layer map, and `validate-readme.ts` reads only
  the root `README.md` (`package.json:16`).
- **EV6 — `T187` (REQ-154b) is partly satisfied.** REQ-154a/b
  (`spec/02-requirements.md:306-324`) require prerequisites, a copy-paste `mcpServers` entry, the
  RNG contract, the badge model, the state model, and a `## License` section with a
  canonical-origin line, an MIT statement, attribution bullets prefixed "Built from:", an RSS
  link, and a last-updated date. `holonovel/README.md` already carries `## Requirements` (`:11`),
  `## Install` (`:15`), `## MCP client configuration` (`:28`) with `mcpServers` (`:32`),
  `## Data` (`:41`), and `## License` (`:99`). The License section already has 13 attribution
  bullets (`:105-117`, matching Appendix U's 13 rows) and the sentence "built from:" (`:103`),
  but no canonical-origin line, no literal `Built from:` prefix, no RSS link, and no last-updated
  date. The root `README.md:437-479` shows the conformant shape.
- **EV7 — a `check*` function's message is the sanctioned evidence mechanism.**
  `labelsFromContent` (`scripts/lib/req-checks.ts:854-870`) collects ID literals inside `check*`
  functions' `push`/`console`/`return` arguments over `ROOT_SCRIPT_FILES =
  walkTsFilesRaw(__dirname)` (`scripts/validate.ts:1485`); `checkFunctionRanges` admits a function
  whose signature is `function check…(…): string[] {` (`scripts/lib/req-checks.ts:812-823`).
  Placing the four labels inside `checkPhaseMapHash`, `checkPatternBufferCoverageMap`, and a new
  `checkHandoffDocs` exercises them without a new script or gate.

## Decisions

- **D1 — Scope: the four committed-artifact rows.** The chunk is `T186` (REQ-153), `T187`
  (REQ-154b), `T298` (REQ-278), `T538` (REQ-108c). All are class (b) and bucket **E**
  (`spec/audit/req-coverage.md`: REQ-153↔T291, REQ-154 no exercised test, REQ-278, REQ-108 no
  exercised test). The common predicate: the clause is a machine-checkable property of a committed
  artifact (a handoff document, the phase map, the §6.6 coverage map). The other 50 rows are
  untouched; the roadmap restates 54 → 50.
  - Rejected: the §6.6 traceability family (`T107`, `T431`, `T537`, `T539`). Measured before
    drafting: the ruleset harness registers 29 `s_id` scenarios
    (`holonovel/scripts/run_ruleset_pattern_buffer.ts`) against the 37 sub-workflows §6.6 numbers
    (`spec/03-build.md:1082-1300`), so an error-mode `T537` check would fail the current tree;
    `T431`'s Holonovel map (`spec/03-build.md:1948-1974`) has 25 rows and the prose itself says a
    gap there is "a review finding, not an assembly error" (`:1945-1946`). Authoring either now
    would force an out-of-plan harness or spec rewrite.
  - Rejected: the bucket-C runtime rows (`T72`, `T73`, `T379`, `T205`, `T4`, `T371`). Each needs a
    server-harness drill; the existing tests exercise adjacent behavior under other T-IDs, so a
    label would be a copied ID, not an assertion (chunk 7's rule,
    `docs/plans/2026-11-17-roadmap-drain-8/plan.md`).
- **D2 — `T298` home: label the equality check; do not claim the builder's file list.**
  `checkPhaseMapHash` (`scripts/validate.ts:1465-1477`) asserts REQ-278's third obligation
  verbatim ("verify the map's hash matches the current spec file set"). The row's label goes on
  its stale-hash message (`:1473`), and `dispositions.md` records that the DECISIONS.md (6)
  file-list obligation belongs to the builder and is **not** claimed by this automated row.
  - Rejected: recording per-file hashes. The map carries one aggregate hash
    (`scripts/lib/phase-map-hash.ts:34-50`; `spec/build-phase-map.md:3`), so a per-file diff needs
    a new assembled artifact line — a format change REQ-278 does not ask the map to carry, and a
    generated-artifact change for a clause the builder owns. Revision 1 proposed it and the cold
    pass correctly showed the comparison had no baseline.
  - Rejected: a message listing the spec directory. It would imply a file-level claim the check
    cannot make; the existing message already names the artifact and the `npm run assemble`
    remedy.
- **D3 — `T538` home: label the clause-bearing gap only.** Add `T538` to `:961`. The three
  structural failures (`:930` map absent, `:932` terminator absent, `:936` empty map) are
  preconditions, not REQ-108c's predicate, and stay unlabelled. No predicate or parser change:
  explicit disposition rows are already admitted.
- **D4 — `T186`/`T187` home: one new `checkHandoffDocs(text)` in `scripts/validate.ts`.** It takes
  the assembled spec text (for Appendix U) and reads `holonovel/AGENTS.md` and
  `holonovel/README.md` from `path.resolve(__dirname, "..")`, the same way
  `checkAgentsMapFreshness` reads `AGENTS.md`.
  - `T186`: a `## Troubleshooting` heading; one `###` subsection per class with the class phrase
    (`config mismatch`, `corrupted state file`, `badge confusion`, `missing environment
    variables`); per subsection, a recovery marker (the `.bak` restore for corruption, a
    `TTRPG_` variable for environment, `set_badge` for badge, the `mcpServers`/config key for
    config) **and** a backticked verification command. A command that names a
    `holonovel/scripts/*.ts` path must resolve to an existing file.
  - `T187`: a prerequisites/setup heading; a fenced `json` block containing `mcpServers` with
    `command` and `args`; an RNG-continuity mention; a badge-model mention; a state-model/
    persistence mention; and, in `## License`, a `Canonical origin:` line, an MIT statement, the
    literal capitalised `Built from:` lead-in to the bullet list, one bullet per Appendix U source
    row (source name appears in the bullet, compared case-insensitively), an RSS link, and a
    `Last updated:` line.
  - Existing-check discovery (recorded): `grep` over `scripts/` finds no Troubleshooting check
    (`checkAgentsMapFreshness` covers the appendix map only) and no server-README check
    (`validate-readme.ts` reads the root README; `package.json:7` lints only `holonovel.md` and
    `README.md`). Extending `validate.ts` avoids a new gate, a manifest row, and a
    `check-script-discipline` surface.
  - Rejected: a new `check-handoff-docs.ts` gate — it duplicates an existing gate's invocation
    path for two file reads; rejected: extending `validate-readme.ts` — its header and its
    `--root`-less contract are README-specific, and `validate.ts` already owns
    `checkAgentsMapFreshness` over `AGENTS.md`.
- **D5 — the doc edits that make the new gate green.** `holonovel/AGENTS.md` gains a
  `## Troubleshooting` section between `## State Model` (`:201`) and `## Two-Repo Workflow`
  (`:217`), with one `###` subsection per class carrying symptom, recovery step, and a verification
  command that names a real `holonovel/scripts/test-*.ts` harness or `npm run test:all`.
  `holonovel/README.md` License gains a `Canonical origin:` line, the bullets are re-prefixed with
  the literal `Built from:`, the section gains
  `[RSS](https://git.gay/flukeatzerocool/Holonovel.rss)`, and a `Last updated: 2026-11-17` line
  closes it — mirroring `README.md:435-479`. These are handoff-document edits; they do not touch
  `spec/`, so `assemble` is byte-stable (V7).
- **D6 — register coupling (hard-check §2).** The increment updates, in the same step:
  `ROADMAP.md` item 3 (residue 54 → 50, the four T-IDs, three bullets, trigger unchanged — the
  `check-roadmap` bullet cap at `scripts/check-roadmap.ts:24`); `spec/audit/review-register.md`
  (a new `### 2026-11-17 — REQ evidence linkage chunk 8` subsection under `## Scheduled-roadmap`);
  the corpus (`validate -- --write-linkage-corpus`); the coverage register
  (`validate -- --write-register`); and `CHANGELOG.md` via the AAR block. No ROADMAP section is
  retired, so no `Scheduled-roadmap` row is renamed. The coverage-register step records each of
  the four REQs' before/after row as evidence; the expectation is that only the exercised-test
  cell moves, and the actual diff is recorded rather than asserted.
- **D7 — probes are negative and restored.** Each assertion is proven by a failure on a mutated
  artifact, then the artifact is restored and `git status --porcelain -- <path>` is confirmed
  empty for the probed path only (the increment directory stays untracked until `session:close`).
  `validate` reads the assembled `holonovel.md` (`scripts/lib/parse-spec.ts:9`), so the D3 probe
  edits `holonovel.md`; the D2 probe edits a referenced `spec/` file; `checkHandoffDocs` reads the
  real docs, so the D4 probes edit them directly. `check:fast` runs un-piped and its trailing
  `check:fast: PASS` is the reading.

## Blast radius

| File | Change | Size |
|---|---|---|
| `scripts/validate.ts` | `T298` label (`:1473`); `T538` label (`:961`); new `checkHandoffDocs(text)` + call in `main()` beside `:2588` | M |
| `holonovel/AGENTS.md` | new `## Troubleshooting` section with four subsections | S |
| `holonovel/README.md` | License: canonical-origin line, `Built from:` prefix, RSS link, last-updated line | S |
| `ROADMAP.md` | item 3 restated at 50 | S |
| `spec/audit/review-register.md` | chunk-8 subsection | S |
| `docs/plans/2026-11-15-req-evidence-linkage/corpus.md` | regenerated (52 lines) | S |
| `spec/audit/req-coverage.md` | regenerated (evidence cells) | S |
| `docs/plans/2026-11-17-roadmap-drain-9/{plan,tasks,dispositions,aar}.md` | artifacts | S |
| `CHANGELOG.md` | rendered from the AAR block by `session:close` | S |

Rollback: every code edit is message-level or an additive function; the doc edits are additive
sections. `git checkout --` on the seven tracked files above returns the tracked tree to `84a39a2`
with no generated artifact orphaned.

## Phases

- **P1 — Dry run and dispositions.** Accept: `npm run validate` reproduces `54 finding(s)`, 0
  errors; the four checks exist at the cited lines; the pre-edit `checkHandoffDocs` targets are
  measured (T186: section absent; T187: the License items from EV6 absent, the five other items
  present). Write `dispositions.md` with one row per finding
  (`| REQ | T-ID | class | cite | home | action |`). Stop rule: if any of the four rows' predicate
  does not hold as EV3–EV6 claims (e.g. `checkPhaseMapHash` is not reached from `main`, or the
  §6.6 map no longer carries disposition rows), record the reading, leave the registers untouched,
  and schedule the row as its own increment. No source write before this stop rule clears.
- **P2 — `T298` and `T538`.** Accept: the two labels are present and `validate` stays at 0 errors
  and 52 findings at this step (the two rows leave the corpus as soon as their labels land, leaving
  P3 to clear the last two). Probes: modify one referenced `spec/` file (T298) and
  delete a covered-section REQ's map row from `holonovel.md` (T538); each must fail with the right
  label; restore.
- **P3 — `checkHandoffDocs` and the docs.** Accept: the pre-edit run reports **T186's missing
  section plus T187's four absent License items** and nothing else (the five other README items
  pass); after the doc edits it passes; `validate` stays at 0 errors. Probes: remove
  `## Troubleshooting` and, separately, the `mcpServers` block and the `Canonical origin:` line;
  each must fail with the right label; restore.
- **P4 — Registers.** Accept: `ROADMAP.md` item 3 has exactly three bullets and the residue line
  reads 50; the review-register subsection exists; `check-registers` and `check-roadmap` pass; the
  corpus is 52 lines with the four T-IDs absent; the coverage-register diff is recorded for the
  four REQs.
- **P5 — Artifact, then gates.** Write `aar.md` first with the plan's readings, then run V1–V8 and
  record every reading, then **finalise `aar.md`** (readings, probes, changelog block, terminal
  token) before `session:close`; `check:fast` is un-piped and its trailing line is
  `check:fast: PASS`.

## Verification

| # | Command | Expected |
|---|---|---|
| V1 | `npm run validate` | exit 0; `0 error(s)`; `REQ evidence linkage: 50 finding(s)` |
| V2 | per-row probes (P2/P3) | four labelled failures, each restored (`git status --porcelain -- <path>` empty) |
| V3 | `npm run check:fast` (un-piped) | `46 passed, 0 failed` … `check:fast: PASS` |
| V4 | `wc -l docs/plans/2026-11-15-req-evidence-linkage/corpus.md` | `52` |
| V5 | item-3 bullet count; `grep -c` for the four T-IDs in the corpus | `3`; `0` |
| V6 | `npm run check-registers`; `npm run check-roadmap` | pass |
| V7 | `npm run assemble`; `git diff --stat holonovel.md` | byte-stable (no spec source edited) |
| V8 | `git diff --numstat` on anchors | anchor delta `0` (item 4 stays untriggered) |

## Done bar

Four class-(b) rows carry real asserting sites and their T-IDs (`T186`, `T187`, `T298`, `T538`);
the linkage residue is 50; each assertion has a recorded negative probe; the four registers are
consistent; `check:fast` is green; `aar.md` ends `LOOP PAUSED`; `npm run session:close --single`
commits the increment.

## Out of scope

The remaining 50 linkage rows (scheduled on `ROADMAP.md` item 3 by family); roadmap items 1, 2, 4
and 5 (EV2); the builder-side DECISIONS.md (6) file-list obligation of REQ-278; any change to
`spec/` prose; any new gate, harness, or tool; publication.

## Open questions

- None blocking. The one judgement call — `T298`'s scope — is recorded in D2: the row labels the
  validate equality check (REQ-278 sentence 3) and does not claim the builder's file list
  (sentence 2). If the re-review holds that a partial-clause label is not a closure, `T298` leaves
  the chunk; the Done bar's residue then reads 51 and this plan is amended before execution.
