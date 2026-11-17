# Plan — Roadmap drain 6: item 3 chunk 5 (the `T497` block closes as a unit)

**Date:** 2026-11-16 · **Kind:** planned · **Depth:** standard · **Revision:** 3 ·
**Increment:** `docs/plans/2026-11-16-roadmap-drain-6` · **Rollback cost:** 1 ·
**Evidence:** git HEAD `13c2460`, clean tree except this untracked increment directory.
Plan sha256 reviewed by the cold pass `a150fa97…`; revision 3 changes only this Revision label and
the "three list calls" wording (`:138`, `:168`) — no design content. Preflight sidecar:
`~/.local/state/opencode/plans/fe586f0907cda9bed04d391d454275b4a14bc3e300047c43f32dd854d4f08ed4/plan.evidence.json`
(keyed on the repo and plan path, not on the plan hash) — 12 targets, 0 missing, 0 untracked,
11 cited REQs, 0 missing, git HEAD `13c2460`. Its absolute-path list holds exactly three
entries: that sidecar, its `~/.local/state` parent, and `/tmp/d6.txt` (V1's output file); none
is a source dependency.
**Review history.** Revision 1 (seven rows closed, `REQ-313b` deferred) failed the cold pass
with three design blockers: the linkage predicate is T-ID-scoped so a deferral of one REQ is
unrepresentable (`scripts/lib/req-checks.ts:881-887`); `REQ-314b`'s `surfaces` branch was
unasserted; the evidence sidecar was missing. Revision 2 closes all eight rows and fixes the
sidecar.

## Why

- **EV1 — baseline is green.** `check:fast` → `46 passed, 0 failed`, trailing
  `check:fast: PASS`. `validate` → exit 0, `0 error(s), 385 warning(s)`, buckets
  A 0 / B 0 / C 493 / D 0 / E 117, `REQ evidence linkage: 80 finding(s)`. Tree clean.
- **EV2 — the `T497` block is eight rows over one T-ID.** `corpus.md:57-64` carries
  `REQ-313a…d` and `REQ-314a…d`, all `Automated | automated-unexercised`, all citing `T497`
  (`spec/appendices-reference.md:1528`). Chunk 4 deferred all eight
  (`docs/plans/2026-11-16-roadmap-drain-5/dispositions.md:64-71`).
- **EV3 — the linkage predicate cannot express a per-REQ deferral.**
  `checkReqEvidenceLinkage` iterates `citations` (REQ → T-ID) and reports a row only when
  `!input.exercised.has(tid)` (`scripts/lib/req-checks.ts:881-887`). The exercised set is a
  set of T-IDs, built from `labelsFromContent` (`:855-877`) over `test(...)` titles. One
  exercised `T497` clears all eight rows; seven titles cannot leave one row standing. So the
  block is atomic: partially closing it would either strand the corpus at 80 while seven
  clauses are asserted, or clear `REQ-313b` nominally — the outcome chunk 4 refused
  (`spec/audit/review-register.md:3160-3165`).
- **EV4 — three clauses are unimplemented, not merely unasserted.**
  (i) The five component **hashes** are never rendered into `DECISIONS.md`:
  `renderFingerprintDelta` (`scripts/lib/spec-update.ts:114-119`) prints the changed/unchanged
  name lists only, so the entry cannot name the `sentinel`. The intended form is the manual
  table at `holonovel/DECISIONS.md:1733-1739`; the entry producer is
  `scripts/spec-update-record.ts:123-145`.
  (ii) `hashSurfaces` (`scripts/lib/fingerprints.ts:51-59`) hashes the bytes of `index.ts` and
  `state.ts`, not "the sorted, concatenated list of registered tool names, resource URIs, and
  prompt names" (`spec/02-requirements.md:2153`). No committed artifact holds that triple:
  `tool-surface-registry.json` is action taxonomy (`actions`, 300 entries, no names),
  `tool-definitions.json` holds 37 tool names plus 32 hidden aliases and no resources or
  prompts, and resources/prompts exist only as 66 `server.registerResource(...)` and 6
  `server.prompt(...)` calls (`:17696-17716`) inside `holonovel/src/index.ts`.
  (iii) No per-component action mapping exists: `scripts/update-server.ts:511-517` prints one
  generic "typecheck + affected Pattern Buffer sub-workflows" line for every single-component
  change, so `REQ-314b`'s four branches are unimplemented.
- **EV5 — the enumerating mechanism already exists.** `holonovel/scripts/generate-tool-definitions.ts`
  boots the server over stdio and calls `tools/list` (`:269`); the same client can call
  `resources/list`, `resources/templates/list`, and `prompts/list`. Its `--check` mode is the
  `check-tool-definitions-sync` gate (`package.json`), so extending its artifact gates the new
  fields for free.
- **EV6 — the residue beyond `T497` is 72.** 80 findings − 8 = 72, of which 57 are class (b)
  and 15 class (c). Closing them is not session-sized; item 3 stays open with a named residue.

## Roadmap disposition

| # | Section | Priority | Trigger measured this session | Disposition |
|---|---|---|---|---|
| 1 | Independent verification (§10) | P1 | publish head is `v2026.11.08`; 139 commits unpushed, last pipeline run stopped at `record` (`npm run status`) | Operator-bound: a different model, cold checkout, `DECISIONS.md` item (6) redacted (`spec/07-independent.md:5-16`). **Not this session.** The trigger is live: the next successful publish inherits the debt. |
| 2 | Mutation-sample depth | P2 | "next Holosuite lens change" — none since `5a26f11` | Record-and-close. |
| 3 | REQ evidence linkage | P1 | 80 findings (EV1) | **This increment.** Chunk 5: the whole `T497` block (EV2–EV5). |
| 4 | Split `index.ts` | P2 | anchors moved by this increment < 50 | Not triggered. |
| 5 | Codex pack | P3 | no REQ-620/REQ-621 change | Not triggered. |

## Decisions

- **D1 — The eight rows close together or not at all** (EV3). No `T497`-titled `test(...)` is
  committed unless every clause of all eight rows is asserted. The red-first cases are written
  with neutral titles (`fingerprint scoped rebuild: …`) and renamed to `T497/REQ-313a…d` and
  `T497/REQ-314a…d` in
  one mechanical pass once the last clause is green. A stall therefore leaves the corpus at 80
  rather than manufacturing a partial clearance.
- **D2 — `REQ-313a` closes by rendering the five hashes into the Spec Update entry.** Extend
  `renderFingerprintDelta` with a five-row `Component | Prior | Current` table, clipped to 16
  hex chars + `…`, `none` when `prior` is null — the shape `holonovel/DECISIONS.md:1733-1739`
  already uses by hand. "Alongside the build fingerprint" reads as the dated entry carrying the
  prior and current spec hash, the only build record in `DECISIONS.md` (1). Rejected: writing
  the server state fingerprint (REQ-065a), which lives in the state directory, not the register.
- **D3 — `REQ-313b` closes by making `surfaces` mean what the REQ says** (EV4ii, EV5).
  Extend `generate-tool-definitions.ts` to emit `surface_names: { tools: string[], resources:
  string[], prompts: string[] }` in `tool-definitions.json`, enumerated from `tools/list`,
  `resources/list`, and `prompts/list` and **sorted ascending at emission**; `resources/templates/list`
  is deliberately not called — a URI template is not a "registered resource URI" (`:2153`).
  `hashSurfaces(serverDir)` then hashes the sorted concatenation of the three lists joined by
  `"\n"` in the fixed order tools, resources, prompts — one sort rule in one place, so the
  emitted order and the hashed order cannot diverge — and returns `"absent"` when the artifact
  is missing (a state that cannot occur for this server: the artifact is committed and its
  freshness is gated). Rejected: hashing an existing file's bytes (today's proxy, which moves on
  any comment edit and never on a prompt rename); hashing the 124 KB artifact whole (it carries
  descriptions, so a wording edit would read as a surface change). No new artifact, no
  package-manifest change (`tool-definitions.json` is build-only — `holonovel/package.json`
  `files` excludes it). Name-only hashing loses no change: a description or schema edit still
  moves `source` through `hashDirectory` over `src/**/*.ts` (`fingerprints.ts:63`), while a
  prompt or resource rename is now caught for the first time.
- **D4 — `REQ-314b` needs a real code change, not a label.** Add
  `scopingAdvice(changed: string[]): string` to `scripts/update-server.ts`, returning the
  REQ-314b action set per changed component — `config`/`lockfile` → dependency reinstall +
  typecheck only; `extraction` → re-index generation data only with prior extraction reused;
  `surfaces` → Pattern Buffer sub-workflows for the changed tools, resources, or prompts;
  `source` → typecheck then Pattern Buffer sub-workflows for the changed surfaces. Components
  concatenate in the fixed order `source, config, lockfile, extraction, surfaces`, joined
  `"; "`. It replaces the `:511-517` branch and is carried into the delta record as an `advice`
  field, so the assertion reads the record rather than a console string. `scopingAdvice([])`
  returns the literal `"none"` and is carried into the zero-change record at `:412-425` like
  every other site. Rejected: inferring the advice in the test, which would assert the test's
  own copy of the rule.
- **D5 — `REQ-313c`'s "SHALL NOT gate startup" closes on a static read**, not only the sentinel.
  `grep -rnE "pipeline-fingerprints|FINGERPRINT_FILE" holonovel/src` returns no match today;
  the case asserts the absence over `holonovel/src/**/*.ts`, so a future startup read fails it.
  "Updated on every build" is asserted once under the `T497` ID by a second reconcile whose
  `current` hashes equal the second run's computation, instead of borrowing the
  `T84e/REQ-394a` case.
- **D6 — No scan widening and no new gate.** `labelsFromContent` is unchanged; `test(...)`
  titles are the admitted shape. The generator's existing `--check` becomes the freshness gate
  for `surface_names`, so no new gate is added and the false-positive budget does not apply.
- **D7 — The class (c) rows and the 57 remaining class-(b) rows are recorded, not executed**;
  they are carried forward on `ROADMAP.md` in the same import.

## Done bar

All eight `T497` rows are `closed` in `dispositions.md`, each with a `home` of the form
`holonovel/scripts/test-update-workflow.ts:<line>`; `validate` reports `REQ evidence linkage: 72`;
the regenerated corpus contains **no** `T497` row (`grep -cF '| T497 |'` = 0); `check:fast` PASS
un-piped; `test:all` green; `check-tool-definitions-sync` green with the new field; one commit;
AAR ends `LOOP PAUSED`. **Fallback bar** — if any clause is unfinished, no `T497` title is
committed: the corpus, `ROADMAP.md`, and the register stay at 80, the code that landed stays
(it is gate-green on its own), `dispositions.md` records each row's state, and the AAR records
the increment as chunk 5a.

## Blast radius

| File | Change | Size |
|---|---|---|
| `holonovel/scripts/generate-tool-definitions.ts` | `surface_names` in the artifact, enumerated from three MCP list calls and sorted; `--check` compares it | M |
| `holonovel/tool-definitions.json` | Regenerated (new `surface_names` block) | S |
| `scripts/lib/fingerprints.ts` | `hashSurfaces` → sorted concatenation of the three name lists; `"absent"` when the artifact is missing | S |
| `scripts/lib/spec-update.ts` | `renderFingerprintDelta`: five-row hash table, sentinel rendered verbatim, optional `advice` line; `FingerprintDelta` gains `advice?: string` | M |
| `scripts/update-server.ts` | `scopingAdvice(changed)` per D4; `:511-517` uses it; `advice` carried into every `writeDeltaRecord` site | M |
| `holonovel/scripts/test-update-workflow.ts` | Eight `T497` cases over synthetic trees (five hashes, sentinel, startup, scoped reuse, four advices, cold seed, four-of-five, baseline refresh) | L |
| `scripts/test-spec-tooling.ts` | Renderer case extended: five table rows in fixed order, sentinel verbatim, `none` prior column, absent `advice` tolerated | S |
| `docs/plans/2026-11-16-roadmap-drain-6/` | `plan.md`, `tasks.md`, `dispositions.md`, `aar.md`, `cold-review/` | L |
| `docs/plans/2026-11-15-req-evidence-linkage/corpus.md`, `spec/audit/req-coverage.md` | Regenerated (two separate commands) | S |
| `ROADMAP.md`, `spec/audit/review-register.md`, `CHANGELOG.md` | Residue `72`, class split `57 + 15`, dated subsection, entry | S |

Rollback cost 1: reversible text and three script edits, one commit via `session:close --single`.
Non-goals: the 57 class-(b) and 15 class-(c) residues; class (c) flips; error-mode for the
linkage check; changing `labelsFromContent`; dropping the `.ts` filter in `hashDirectory`
(unrelated to this block); shipping `tool-definitions.json`.

## Phases

### P1 — Red tests, against today's tree

Add a second synthetic tree to `test-update-workflow.ts` (no `src/generated`, a minimal
`tool-definitions.json` carrying `surface_names`) and write the eight cases with neutral
titles. Expected red reads: the hash-table case fails (names only, no table); the sentinel case
fails (`sentinel` absent from the rendered entry); the extraction-advice case fails (generic
text); the surfaces-fingerprint case fails (`hashSurfaces` ignores the fixture's
`surface_names`). The startup-absence case passes on first run and is recorded as
assertion-only. Quote each read in `tasks.md`.

### P2 — The surfaces component (D3)

Extend the generator with the three list calls and the sorted `surface_names`; regenerate
`tool-definitions.json`; confirm `check-tool-definitions-sync` and `check-reference-server-cleanliness`
both pass; change `hashSurfaces`; then the fingerprint case goes green.

### P3 — The record (D2, D4)

Renderer table + sentinel + `advice`; `scopingAdvice`; the `advice` field at every
`writeDeltaRecord` site.

### P4 — Labelling and records

Verify all eight clauses green, rename the eight titles to `T497/REQ-313a…d` / `T497/REQ-314a…d`
in one pass; regenerate
the corpus and the register (two commands); author `dispositions.md` with eight `closed` rows;
**supersede `spec/audit/review-register.md:3160-3165`** — the paragraph that calls the eight rows
"deliberately **deferred**" and states "Residue: 80 rows = 65 (b) + 15 (c)" — pointing it at the
new dated subsection, since `check-registers` reads structure and REQ tokens, not prose residue,
and would not catch the stale claim; update `ROADMAP.md` (residue `72`, class split `57 + 15`,
the `T497` note replaced by the closure); then the dated `review-register.md` subsection (after
the roadmap and after the supersession, because `check-registers` fails a row whose `REQ-` tokens
are not all on the roadmap, `register-checks.ts:64-67`); then `CHANGELOG.md`.

### P5 — Gates and close

`npm run check:fast` un-piped, `npm run test:all`, `npm run test:spec-tooling`,
`npm run check-tool-definitions-sync`, `npm run check-roadmap`, `npm run check-registers`,
`aar.md`, `npm run session:close --single`.

## Verification

| # | Command | Expected |
|---|---|---|
| V1 | `npm run validate > /tmp/d6.txt; echo $?` | exit 0; `0 error(s)`; `REQ evidence linkage: 72`; buckets A 0 / B 0 |
| V2 | `grep -cF '\| T497 \|' docs/plans/2026-11-15-req-evidence-linkage/corpus.md` | `0`, from `8` before |
| V3 | `npm run test:update-workflow` | eight new cases pass; printed count rises by eight |
| V4 | `npm run test:spec-tooling` | passes, including the extended renderer case |
| V5 | `npm run check-tool-definitions-sync`; `npm run check-reference-server-cleanliness` | both pass with `surface_names` present |
| V6 | `npm run check:fast` (un-piped); `npm run check-roadmap`; `npm run check-registers` | trailing `check:fast: PASS`; item 3 keeps `**Trigger:**`; every register `REQ-` token is on the roadmap |
| V7 | `npm run test:all` | green (`run-test-suite.ts:79` runs `test:update-workflow`) |
| V8 | `awk -F'\|' 'NR>2 && NF>5 {gsub(/ /,"",$7); c[$7]++} END {for (k in c) printf "%s %d\n", k, c[k]}' dispositions.md`; `npm run check-loop-artifacts` | 8 rows, all `closed`; 0 errors |

## Risks

- **R1 — the increment is L-sized.** The surfaces artifact is the new mechanism. Mitigation: the
  fallback bar (no `T497` title) keeps a partial landing honest, and P2 is independent of P3.
- **R2 — a `surface_names` enumeration changes every stored fingerprint once.** Truthful (the
  component genuinely changes definition) and visible in the next publication's delta; no gate
  compares against a stored hash.
- **R3 — the generator boots the server.** It already does (`:269`); four more list calls on the
  same client add seconds, not minutes.
- **R4 — `advice` changes the delta record shape.** Optional field; older records and the
  no-`advice` renderer path are asserted in V4.
