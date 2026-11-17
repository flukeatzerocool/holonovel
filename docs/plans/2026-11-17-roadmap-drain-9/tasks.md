# Tasks — Roadmap drain 9 (REQ evidence linkage chunk 8, the committed-artifact assertions)

Dependency order. Each task names its plan reference and the read that proves it. If a task
deviates, amend `plan.md` in the same phase rather than improvising.

## T1 — Dry run and dispositions (`plan.md` D1, P1)

Run `npm run validate` before editing anything; record `0 error(s), 359 warning(s)` and
`REQ evidence linkage: 54 finding(s)`. Re-read the four sites:

- `checkPhaseMapHash` (`scripts/validate.ts:1465-1477`) and its call (`:2577`);
- `checkPatternBufferCoverageMap` (`:927-978`) and its call (`:2612`); confirm the §6.6 map still
  carries the explicit disposition rows (`| REQ-370 | — (validated by npm run validate) | Coupling
  derivation |`, `spec/03-build.md:1597`);
- `holonovel/AGENTS.md`: eight `##` sections, no `## Troubleshooting`, no class phrase;
- `holonovel/README.md`: `## Requirements` (`:11`), `## Install` (`:15`),
  `## MCP client configuration` (`:28`), `## Data` (`:41`), `## License` (`:99`); record that the
  13 attribution bullets (`:105-117`) and "built from:" (`:103`) are present and that the
  canonical-origin line, the literal `Built from:` prefix, the RSS link, and the last-updated date
  are absent.

Write `dispositions.md` with one row per finding
(`| REQ | T-ID | class | cite | home | action |`). All four take `author`. The `cite` column names
the in-repo clause; `home` names the asserting site (`path:line`). For `T298`, record that the row
claims REQ-278's validate obligation only; the builder-side DECISIONS.md (6) file list is not
claimed. If a P1 stop-rule condition holds, record the reading, leave the registers untouched, and
schedule that row as its own increment instead of proceeding.

## T2 — `T538`: label (`plan.md` D3, P2)

Add `T538` to the clause-bearing gap error at `scripts/validate.ts:961`. Do not label the three
structural preconditions (`:930`, `:932`, `:936`), change the predicate, the `coveredSections`
list, or the §5.2 sibling check.

Probe: delete one covered-section REQ's row from the §6.6 map **in the assembled `holonovel.md`**
(not the source; `validate` reads the assembled file), run `npm run validate`, record the `T538`
error, then `git checkout -- holonovel.md` and confirm `git status --porcelain -- holonovel.md`
is empty.

## T3 — `T298`: label (`plan.md` D2, P2)

Add `T298` to the stale-hash message in `checkPhaseMapHash` (`scripts/validate.ts:1473`). Leave the
equality predicate and `computeSpecContentHash` untouched; do not add a per-file hash mechanism.

Probe: append one line to a referenced `spec/` file, run `npm run validate`, record the emitted
`T298` message naming the map and the `npm run assemble` remedy, then `git checkout -- <file>` and
confirm `git status --porcelain -- <file>` is empty.

## T4 — `checkHandoffDocs` (`plan.md` D4, P3)

Add `function checkHandoffDocs(text: string): string[]` to `scripts/validate.ts` and call it from
`main()` beside `checkAgentsMapFreshness` (`:2588`), passing the assembled spec text. It reads
`holonovel/AGENTS.md` and `holonovel/README.md` from `path.resolve(__dirname, "..")`.

- `T186`: a `## Troubleshooting` heading; one `###` subsection per class carrying the class
  phrase (`config mismatch`, `corrupted state file`, `badge confusion`, `missing environment
  variables`); per subsection, a recovery marker (`.bak` for corruption, `TTRPG_` for environment,
  `set_badge` for badge, the `mcpServers`/config key for config) and a backticked verification
  command. A command naming a `holonovel/scripts/*.ts` path must resolve to an existing file.
- `T187`: a prerequisites/setup heading; a fenced `json` block containing `mcpServers` with
  `command` and `args`; an RNG-continuity mention; a badge-model mention; a state-model/
  persistence mention; and, in `## License`, a `Canonical origin:` line, an MIT statement, the
  literal capitalised `Built from:` lead-in to the bullet list, one bullet naming each Appendix U
  source row (parsed from `text`; `spec/appendices-licenses.md:9-21` is the source of truth), an
  RSS link, and a `Last updated:` line.

Both are **error-level** findings (they block assembly, like `validate-readme`), not warnings.

Run it before the doc edits and record the exact findings (the error-gate dry run). Expected:
T186's missing section plus T187's four absent License items (canonical-origin, literal
`Built from:` prefix, RSS, last-updated) and nothing else — the five other README items pass. Any
other finding is a false positive; tighten the predicate before proceeding.

## T5 — The handoff docs (`plan.md` D5, P3)

1. `holonovel/AGENTS.md`: insert `## Troubleshooting` between `## State Model` and
   `## Two-Repo Workflow`, with four `###` subsections, each carrying symptom, recovery step, and
   a verification command that names a real `holonovel/scripts/test-*.ts` harness or
   `npm run test:all`.
2. `holonovel/README.md`: mirror the root `README.md:435-479` License shape — add a
   `Canonical origin:` line and MIT statement above the bullets, re-prefix the bullet list with
   `Built from:`, add `[RSS](https://git.gay/flukeatzerocool/Holonovel.rss)`, and close with
   `Last updated: 2026-11-17`.

Probes: remove `## Troubleshooting` → `T186` fails; remove the `mcpServers` block, then the
`Canonical origin:` line → `T187` fails; restore each and confirm
`git status --porcelain -- holonovel/AGENTS.md holonovel/README.md` is empty.

## T6 — Registers (`plan.md` D6, P4)

1. `ROADMAP.md` item 3: residue 50, the four closed T-IDs, still exactly three bullets; trigger
   unchanged.
2. `spec/audit/review-register.md`: new `### 2026-11-17 — REQ evidence linkage chunk 8` under
   `## Scheduled-roadmap`, naming T-IDs and dates only (no `REQ-` tokens,
   `scripts/lib/register-checks.ts:64-69`).
3. The only corpus and coverage-register writes:
   `npm run validate -- --write-linkage-corpus docs/plans/2026-11-15-req-evidence-linkage/corpus.md`
   and `npm run validate -- --write-register`. Record the coverage-register diff for the four
   REQs rather than assuming it.
4. `CHANGELOG.md`: rendered from the AAR block by `session:close`; the date equals the commit
   subject's date (2026-11-17).

## T7 — Artifact, then gates (`plan.md` P5, V1–V8)

Write `aar.md` first with the plan's readings — it is an input to `check-loop-artifacts`, strict
inside `check:fast` — then run V1–V8 in order and record every reading, including the probes.
Finalise `aar.md` (readings, deviations, changelog block, `LOOP PAUSED`) before `session:close`.
`check:fast` must be un-piped. If `check-fingerprint-sync` or `check-markers` fails, run
`npm run check-tool-definitions-sync` and `npm run refresh-properties`, then re-run V3; do not
fold a version-surface advance into this increment.

## T8 — Close (`plan.md` Done bar)

`aar.md` carries the `## Changelog entry` block, the statement that each row is exercised by an
assertion (not a copied ID), and `LOOP PAUSED`; then `npm run session:close --single`.
