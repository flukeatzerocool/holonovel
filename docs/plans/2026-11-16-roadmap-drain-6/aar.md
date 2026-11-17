# AAR — Roadmap drain 6: the `T497` block closes (item 3, chunk 5)

AAR: SUCCESS — the eight `T497` rows closed with real assertions, three implementations landed,
and the linkage residue fell from 80 to 72 with every gate green.

## 1. What was supposed to happen

Plan `docs/plans/2026-11-16-roadmap-drain-6/plan.md` (rev 3, standard depth, cold-passed). Done
bar: all eight rows `closed` in `dispositions.md` with an asserting `home`; `validate` reports
`REQ evidence linkage: 72`; the corpus carries no `T497` row; `check:fast` PASS un-piped;
`test:all` green; `check-tool-definitions-sync` green; one commit; AAR ends `LOOP PAUSED`.
Fallback bar: no `T497` title committed and no corpus/roadmap/register regeneration if any clause
stalled.

## 2. What happened

| # | Task | Result |
|---|---|---|
| 1 | Red cases over a ruleset-free synthetic tree | 9 cases written; first red run 11 failures (8 expected, 3 fixture/expectation defects — see §4) |
| 2–3 | `surface_names` in the generator; artifact regenerated | 37 tools / 47 resources / 6 prompts; a second run byte-identical (`cmp`) |
| 4 | `hashSurfaces` hashes the sorted name lists | fixture surfaces case green; hex returned for a real tree |
| 5–6 | Renderer table + sentinel + advice; `scopingAdvice` | all four advice branches green; `[]` → `"none"` on the zero-change record |
| 7 | `test-spec-tooling` renderer case | 113 passed |
| 8 | Titles authored as final (`T497/REQ-…`) | see deviation D-1 |
| 9 | Corpus + register regenerated (two runs) | corpus `T497` rows 8 → 0; register 1 error (staleness) then exit 0 |
| 10–12 | `dispositions.md`, `ROADMAP.md`, register supersession + dated entry | `check-roadmap` OK; `check-registers` PASS |
| 13 | Gates + close | `test:all` 56/56; `check:fast` 46/46 PASS |

**Deviations (amendments to the plan).**

- **D-1 — cases carried final titles from the start** instead of neutral titles renamed at task 8.
  Mitigation preserved the plan's intent: no corpus, roadmap, or register regeneration ran before
  every clause was green, so a stall could not have cleared a row. The atomicity risk the neutral
  titles guarded was about *record mutation*, and that ordering held.
- **D-2 — two pre-existing `REQ-394a` fixtures changed expectation** from `partial` to `scoped`
  (and one stderr assertion from `scoping: partial` to `scoping: scoped`). This is the direct
  consequence of `REQ-313b`: a `src/state.ts` edit no longer moves `surfaces`, so the fixture
  advances one component, not two. Updated with the reason inline; recorded in the review-register
  entry.
- **D-3 — the extraction fixture uses `src/generated/extraction.json`, not a `.ts` file**, because
  `source` hashes `src/**/*.ts` and would otherwise move too. Discovered by the red run, not by
  review.

- **D-4 — `holonovel/scripts/lib/holosuite-conformance.ts` was edited** (one line) although the
  blast-radius table did not name it: inserting the generator's list calls moved `buildRecord` from
  `:149` to `:154`, and `check-anchors` failed until `npm run fix-anchors` rewrote the anchor. A
  gate-mandated consequence of task 2, not a new surface.

## 3. What went right

- The cold pass paid for itself twice: rev 1's seven-close/one-defer split was unrepresentable
  under a T-ID-scoped predicate, and catching that before the first edit prevented a nominal
  clearance of `REQ-313b`.
- Red-first execution surfaced two design facts the plan had only predicted: the surfaces
  redefinition's effect on existing fixtures, and the source/extraction overlap.
- The gates caught the one mechanical consequence nobody planned for: `check-anchors` reported
  `generate-tool-definitions.ts:149#buildRecord → 154` after the generator edit; `fix-anchors`
  repaired it, and `check:fast` went from FAIL to PASS without a diagnosis round.

## 4. What went wrong

- The first red run failed on a missing `readdirSync` import — a self-inflicted compile-time error
  that cost one run, invisible until execution.
- Two `REQ-394a` fixtures were not audited for expectation drift when `REQ-313b` changed the
  definition of a component. The plan said the fingerprint would move; it did not say an existing
  fixture would assert the wrong count. Blameless framing: the blast-radius table named the files
  but not the *expectations* those files encode.
- `validate` failed once on register staleness after the code change — expected, but sequenced as
  a separate discovery rather than a planned step.
- The plan gate rejected `mark-build` because the cold report's `Plan sha256:` line named the
  pre-nit hash: fixing two reviewer nits changed the plan's bytes and unbound the report. The
  resolution was a two-read documentation-binding pass by the same reviewer, not a re-review.

## 5. Session performance

- **Outcome vs bar.** Every criterion holds on evidence: `validate` exit 0 with `72`, corpus
  `grep -cF '| T497 |'` = 0, `check:fast` trailing PASS, `test:all` 56/56.
- **Scope adherence.** No item outside the plan: no class-(c) flip, no `labelsFromContent`
  change, no `.ts` filter change in `hashDirectory` (explicitly a non-goal).
- **Verification quality.** The nine new cases are discriminating: four went red for real reasons
  (no table, no sentinel, no advice ×3), one is assertion-only and says so (`REQ-313c` startup,
  `REQ-314c` seed, `REQ-314d`).
- **Rework.** Three runs of `test:update-workflow` (red 11 → red 8 → green), one `fix-anchors`,
  one register regeneration. No file was rewritten more than twice.
- **Cost.** ~45 tool calls after the plan gate; the two heavy runs were `test:all` (185 s) and
  `check:fast`.
- **User intervention.** One explicit "execute plan"; no correction or redirect.

## 6. Findings

| ID | Sev | Finding | Disposition |
|---|---|---|---|
| F-1 | P2 | A component-definition change moves existing fixture expectations, and the blast-radius table named files but not the assertions those files encode. | Fixed in-session: both fixtures updated with the reason inline (D-2). |
| F-2 | P3 | `source` (`src/**/*.ts`) and `extraction` (`src/generated/**`) overlap, so a generated `.ts` file moves two components and an extraction-only change needs a non-`.ts` artifact. | Record-and-close: truthful per `REQ-313b`'s wording; the test documents the requirement. |
| F-3 | P3 | `hashSurfaces` returns `"absent"` for a server tree without `tool-definitions.json` (a third-party embedding), which is a marker among hashes. | Record-and-close: unreachable for this server (artifact committed + freshness-gated); stated in D3. |
| F-4 | P3 | 139 commits remain unpushed and the last pipeline run stopped at `record`. | Record-and-close: `ROADMAP.md` item 1 already names the live trigger; not this increment's surface. |
| F-5 | P3 | Correcting two reviewer nits on a plan changed its hash and unbound the cold report, so `mark-build` blocked after all work was green. | Record-and-close: the binding check is deliberate (`plan-gate-core.mjs:255-266`); the cheap path is to freeze the plan before the binding pass. Overlaps `SK-23`. |

Zero open project action items. No `SR-`/`PR-` IDs were raised (no spec-review or proofread gate ran).
No `SK` records appended: the one routing miss (`changelog-before-commit`) is the third instance of
`SK-24`, which the register already carries; per the AAR contract a repeated miss stays in the run
log rather than duplicating a row.

## 7. Invocation audit

| Expected | Loaded | Verdict |
|---|---|---|
| `programming-orchestrator` | yes | routed |
| `plan-review` | yes | routed |
| `build-review` | yes | routed |
| `after-action-report` | yes | routed |
| `changelog-before-commit` | no | miss (third instance of `SK-24`) |
| `independent-review` | yes (as the delegation inside plan-review) | routed |

Invocation: 5 expected, 5 loaded, 1 miss (`changelog-before-commit`, already recorded).

## Changelog entry

**Title:** Linkage chunk 5: the T497 block closes as a unit, residue 80 → 72

**Summary:** All eight `T497` rows under `REQ-313`/`REQ-314` closed with authored assertions after three implementations landed: the Spec Update record renders the five component hashes, the surfaces fingerprint hashes registered names rather than source bytes, and the delta record carries a per-component scoping advice. The block closed atomically because the linkage check keys on the T-ID, so a per-REQ deferral was not representable.

- `renderFingerprintDelta` renders the five-row `Component | Prior | Current` table, with `sentinel` verbatim and `none` for a cold seed, so `REQ-313a`'s build record now names what it claimed to record
- `REQ-313b`: `hashSurfaces` hashes the sorted tool names, resource URIs, and prompt names from `tool-definitions.json`'s new `surface_names` block (37 tools / 47 resources / 6 prompts), emitted by the generator's existing MCP list calls; the previous definition hashed `index.ts`/`state.ts` bytes
- `REQ-314b`: `scopingAdvice` states the per-component action — reinstall+typecheck, re-index and reuse prior extraction, or Pattern Buffer for changed surfaces — in the delta record instead of one generic line
- Nine harness cases cover the eight rows over a ruleset-free synthetic tree: five hashes, sentinel, startup absence, scoped reuse, four advice branches, cold seed, four-of-five full, and baseline refresh
- `REQ-394a` fixtures re-baselined from `partial` to `scoped`: with surfaces no longer tracking source bytes, a `src/state.ts` edit advances one component
- REQ evidence-linkage residue 80 → 72 (57 class-(b) + 15 class-(c)); corpus and coverage register regenerated, `ROADMAP.md` item 3 restated, the chunk-4 deferral paragraph superseded in the review register

LOOP PAUSED
