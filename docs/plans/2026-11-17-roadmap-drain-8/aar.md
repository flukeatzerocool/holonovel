# AAR — Roadmap drain 8 (REQ evidence linkage chunk 7, the §7.7 archetype family)

## What was supposed to happen

The plan (`plan.md`, stamped `874eec98…`, condition C-1 and C-2 attached) claimed: author the
asserting sites for `T420`, `T425`, and `T439` inside `checkCouplingCompleteness`, which required
a small parse amendment because the property table dropped empty cells; prove each assertion by
mutation; regenerate the corpus and coverage register; and restate roadmap item 3 at 54 findings.

## What happened

The cold pass's Blocker was real and the plan's revision 2 met it. The parse at
`scripts/validate.ts:1087` did drop empty cells, so an empty archetype cell was read as the
GM-access column — the assertion revision 1 described could not have fired. Revision 2 booked the
parse change, and the execution confirms it: with `Ruling Ledger`'s archetype cell emptied, the
parser now yields `archetypes: []`, the `T420/T425` error fires, and the summary reads `40/41`.

Three labelled assertions plus one report line landed. `npm run validate` moved from
`57 finding(s)` to `54`, `0 error(s)`, with `T425 — Archetype assignment completeness: 41/41 …
12/12 archetypes used`. No spec prose changed, and `assemble` left `holonovel.md` byte-identical
(`151a176d…` before and after), which is the proof that the change is tooling-only.

The one substantive design judgement — that "archetypes used by ≥1 coupling row" is archetype-level
— was exercised by the probes: `Ruling Ledger` has no coupling row and still passes, because
`Narrative-memory` is used by `Story Journal` and four other rows. Enforcing the group-level
reading would have made the §7.7.1b curation clause a lie.

## Verification

| # | Command | Reading |
|---|---|---|
| V1 | `npm run validate` | exit 0; `0 error(s), 359 warning(s)`; `REQ evidence linkage: 54 finding(s)`; `T425 — … 41/41 … 12/12` |
| V2 | `wc -l docs/plans/2026-11-15-req-evidence-linkage/corpus.md` | `56` (2 + 54), from 59 |
| V3 | empty `Ruling Ledger`'s archetype cell in `holonovel.md`, `validate` | one `ERROR: T420/T425 — property group "Ruling Ledger" carries no archetype`; summary `40/41`; no `WARNING`, no `T421`; restored |
| V4 | set it to `Bogus`, `validate` | `WARNING: … unrecognized archetype "Bogus"` **and** `ERROR: T439 — §7.7 property archetypes [Bogus, …] differ from …`; summary `41/41`, `12/12`; restored |
| V5 | delete the four `Mechanics → *` rows, `validate` | one `ERROR: T420/T439 — archetype "Mechanical" is used by no coupling row`, plus four `ERROR: T435` (P34–P37), summary `11/12`; restored |
| V6 | corpus grep for the three T-IDs; coverage diff; `check-registers`; `check-roadmap` | `0` for each; 2-line diff (REQ-369, REQ-374 evidence cells); registers clean; roadmap clean, 6 sections |
| V7 | `check:fast` un-piped; `check-conformance`; `test:spec-tooling`; `assemble` | `46 passed, 0 failed`, `check:fast: PASS`; both included and green; `holonovel.md` hash unchanged |
| V8 | item-3 `awk`; `grep -c T420 ROADMAP.md`; `grep -c 'chunk 7'` register | `3` bullets; `1`; `2` (subsection + supersession note) |

## Deviations

1. **The probes edit `holonovel.md`, not `spec/04-runtime.md`.** `validate` reads the assembled
   spec (`scripts/lib/parse-spec.ts:9`), so a probe against the source file is invisible to it.
   P3's "temporary edit reverted" was executed against the assembled file and restored with
   `git checkout -- holonovel.md`. (A first attempt against the source file produced a false
   `41/41` reading, which is why the distinction is recorded here rather than left implicit.)
2. **The coverage-register diff is an evidence-cell move, not a bucket move.** REQ-369 and
   REQ-374 stay in bucket **E** (builder/verifier-side) and gain `T420, T439` and `T425, T439` in
   the evidence column. The plan described the expected diff as a bucket move; the platform is
   fixed by the REQ's class, so the evidence column is the only cell that can move.
3. **Condition C-1 executed as the `Ruling Ledger` probe.** The reviewer's alternative ("name the
   T421 cascade") was not needed: `Ruling Ledger` has no coupling rows, so the probes stay clean.
   Condition C-2's stop point (before P4's register edits) never triggered — no D5 defect surfaced.
4. **`CHANGELOG.md` is rendered from the block below by `session:close`**, per
   `docs/plans/README.md`; plan P4 listed the file directly. The resulting entry is identical.

## Findings and dispositions

- **Cold-pass Blocker (non-emptiness unreachable) — fixed in-session**, and the fix is what V3
  exercises. No roadmap entry: it was this increment's design defect, corrected before execution.
- **Cold-pass carried Major (V3/V4 cascade into T421) — closed by execution**, using the
  reviewer's clean-target alternative (C-1).
- **The register claim that `checkCouplingCompleteness` "validates only unrecognised archetype
  tokens" was stale after this change** — fixed in-session with a supersession note in the
  chunk-3 subsection pointing at chunk 7.
- **No new action items.** The 54 remaining rows are already tracked by `ROADMAP.md` item 3; the
  next chunk (classification of the residue by asserting site) is the roadmap's own ladder, not a
  new recommendation. Roadmap item 4 (split `index.ts`) was not triggered: this increment moved no
  evidence anchors (the anchor gate passed with no `check-anchors` regeneration).
- **Record-and-close:** the plan's soft flags (review-history stage attribution; "four outputs"
  phrasing) are documentation nits with no behavioural consequence.

## Changelog entry

**Title:** Linkage chunk 7: the §7.7 archetype family asserted, residue 57 → 54

**Summary:** Chunk 7 authored the first class-(b) asserting sites: `T420`, `T425`, and `T439` now have real checks in `checkCouplingCompleteness`. Writing them exposed a parse defect — the property table dropped empty cells, so a missing archetype was misread as the GM-access column; the parse now keeps cell position and reports a short row. The usage predicate is archetype-level because §7.7.1b states the coupling table is curated. The residue falls 57 → 54, all class (b).

- `scripts/validate.ts`: `checkCouplingCompleteness` now asserts archetype non-emptiness (`T420`/`T425`), the twelve-archetype vocabulary (`T439`), and archetype usage by coupling rows (`T420`/`T439`), and reports assignment completeness for all 41 groups; the property-table parse keeps empty cells so a missing archetype is observable
- `T420`/`T425`/`T439` leave the linkage corpus; residue 57 → 54, all class (b); corpus regenerated and the coverage register's REQ-369/REQ-374 evidence cells now cite the assertions (both stay bucket E)
- Mutation probes prove each assertion fires: an empty cell yields the `T420/T425` error and `40/41`; a bogus token yields the `T439` vocabulary error alongside the retained warning; removing the four `Mechanics → *` rows yields the usage error plus four `T435`. The current tree stays at `0 error(s)`
- The usage predicate is archetype-level, not group-level: `Ruling Ledger` carries no coupling row by design (§7.7.1b curation), so the completeness line reports the group count without failing on it
- `ROADMAP.md` item 3 restated at 54 with three bullets; `spec/audit/review-register.md` gains the chunk-7 subsection and supersedes the chunk-3 claim that only unrecognised tokens were validated

LOOP PAUSED
