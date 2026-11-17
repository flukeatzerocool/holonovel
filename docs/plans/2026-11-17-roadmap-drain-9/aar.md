# AAR — Roadmap drain 9 (REQ evidence linkage chunk 8, the committed-artifact assertions)

## What was supposed to happen

The plan (`plan.md`, stamped, revision 3) claimed four class-(b) rows would gain real asserting
sites: `T186` and `T187` through a new `checkHandoffDocs` over the server handoff documents,
`T298` as a label on `checkPhaseMapHash`, and `T538` as a label on the §6.6 coverage-map gap
error — with the builder-side file-list clause of REQ-278 explicitly out of scope, each assertion
proven by a negative probe, the registers restated at 50, and `check:fast` green.

## What happened

All four rows landed and the residue moved 54 → 50 (`npm run validate` prints
`REQ evidence linkage: 50 finding(s)`, `0 error(s)`). Two were labels on checks that already
asserted their clause; two exposed real document gaps. The pre-edit dry run produced exactly the
five expected findings the cold re-review's condition named: the missing `## Troubleshooting`
section plus four License items (canonical origin, literal `Built from:`, RSS, last-updated) — C-1
is satisfied.

The new `checkHandoffDocs` is error-level and reads `holonovel/AGENTS.md` and
`holonovel/README.md` from the repo root, parsing Appendix U out of the assembled spec for the
per-source bullet check. `T186` requires each of the four class subsections to carry a recovery
marker and a backticked command that names an existing harness; `T187` requires the five handoff
items and the footer shape.

Two documents changed under the new gate: `holonovel/AGENTS.md` gained a `## Troubleshooting`
section with four subsections; `holonovel/README.md`'s License section gained the canonical-origin
line, the literal `Built from:` lead-in, the RSS link, and the last-updated date. `assemble` left
`holonovel.md` byte-identical (the spec sources were not touched), so the change is
documentation-plus-tooling only.

## Verification

| # | Command | Reading |
|---|---|---|
| V1 | `npm run validate` | exit 0; `0 error(s), 355 warning(s)`; `REQ evidence linkage: 50 finding(s)` |
| V2 | probes (4) | `T298` stale-hash warning names the map; `T538` error on a removed covered-section row; `T186` on a removed Troubleshooting section; `T187` on a removed mcpServers block and on a removed canonical-origin line; each restored |
| V3 | `npm run check:fast` (un-piped) | exit 0; `46 passed, 0 failed`; trailing `check:fast: PASS` |
| V4 | `wc -l docs/plans/2026-11-15-req-evidence-linkage/corpus.md` | `52` |
| V5 | item-3 bullets; corpus `grep -c` for the four T-IDs | `3`; `0` |
| V6 | `check-registers`; `check-roadmap` | PASS; `OK … (6 section(s))` |
| V7 | `npm run assemble`; `git status -- holonovel.md` | content hash current; `holonovel.md` unmodified |
| V8 | `git diff --numstat -- holonovel.md` | empty (anchor delta 0; roadmap item 4 untriggered) |
| — | `npm run typecheck`; `npm run test:validators` | clean; `79 passed, 0 failed` |

## Deviations

1. **The coverage register was regenerated at P2, not only at P4.** The register's freshness
   check turns red the moment a T-ID becomes exercised, so the planned "0 errors at 52 findings"
   step could not hold without the regeneration. It was written at P2 to keep the tree green, then
   again at P4 after the doc checks landed; the final diff moves four evidence cells and no bucket.
2. **The last-updated predicate was relaxed within P3.** The first implementation anchored
   `Last updated:` at line start; the conformant shape (copied from the root README) puts it after
   the RSS link on one line, so the check reported the item missing on a compliant document. The
   predicate now matches anywhere in the License section. This is a check-side amendment, not a
   doc-side workaround.
3. **The `T187` `Built from:` predicate is literal and case-sensitive** per condition C-1; the
   pre-edit dry run confirmed four License findings, not three.

## Findings and dispositions

- **`T298`'s builder-side clause.** REQ-278 asks the builder to record the differing-file list in
  DECISIONS.md (6). The automated row claims the validate equality obligation only; the
  builder-side duty is named in `dispositions.md` and in the review-register subsection. No new
  action — it is a build-record obligation, not a test gap.
- **Cold-pass defects (first revision).** The per-file diff had no baseline and the file-list
  clause was misattributed; both were corrected before execution. Recorded in
  `cold-review/report.md`; no roadmap entry (they were this increment's own design defects).
- **No new action items.** The 50 remaining rows are tracked on `ROADMAP.md` item 3; roadmap
  items 1, 2, 4 and 5 remain trigger-gated or operator-bound.

## Changelog entry

**Title:** Linkage chunk 8: the committed-artifact assertions, residue 54 → 50

**Summary:** Chunk 8 gave four class-(b) rows real asserting sites. `T538` now labels the §6.6 coverage-map gap error and `T298` the build-phase-map hash check; a new handoff-document check asserts the AGENTS.md troubleshooting section and the server README's five handoff items and license footer, which exposed two real document gaps now closed. The residue falls 54 → 50.

- `scripts/validate.ts`: `checkHandoffDocs` asserts the AGENTS.md `## Troubleshooting` section (four classes, each with a recovery step and a verification command naming an existing harness) and the server README's prerequisites, `mcpServers`, RNG, badge and state-model items plus the Appendix U license footer
- `T538` labels the Pattern Buffer coverage-map gap error; `T298` labels the build-phase-map hash check, claiming its validate obligation only
- `holonovel/AGENTS.md` gains a `## Troubleshooting` section; `holonovel/README.md`'s License gains the canonical-origin line, the literal `Built from:` lead-in, the RSS link, and the last-updated date
- Four negative probes prove each assertion fires; the pre-edit dry run found exactly the five expected gaps
- Residue 54 → 50; corpus 52 lines, four evidence cells move in the coverage register with no bucket change; `ROADMAP.md` item 3 restated at 50 and the review register gains the chunk-8 subsection

LOOP PAUSED
