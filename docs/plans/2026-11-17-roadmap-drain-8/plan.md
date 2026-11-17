# Plan — Roadmap drain 8: REQ evidence linkage chunk 7 (the §7.7 archetype family)

**Date:** 2026-11-17 · **Kind:** planned · **Depth:** standard · **Revision:** 2 ·
**Increment:** `docs/plans/2026-11-17-roadmap-drain-8` · **Rollback cost:** 1 ·
**Evidence:** git HEAD `381609a`, clean tree. Baseline: `check:fast` exit 0 (`46 passed,
0 failed`, trailing `check:fast: PASS`); `validate` exit 0, `0 error(s), 362 warning(s)`,
`REQ evidence linkage: 57 finding(s)`; `npm run status` — 5 open roadmap items, 141 unpushed
commits, tag `v2026.11.08`.
**Trust boundary:** every premise below is `repo` evidence read from this checkout. No web or
user-supplied content is embedded.
**Review history.** Revision 1 was read by the cold stages 1–2 and the three stage-3 critics.
Stage 1 raised a Blocker (the non-emptiness probe could never fire, because the property-table
parse drops empty cells) and two Majors (V8's `sed` range swept three roadmap items; the
conformance ratchet baseline was unbooked). Revision 2 books the parse amendment in D2/P2 and the
blast radius, scopes V8 to item 3, records the ratchet decision in R3, and corrects EV4 and the
line citations.

## Why

- **EV1 — the roadmap residue is 57 rows, all class (b).** `ROADMAP.md:36-53` carries item 3 with
  57 findings; chunk 6 closed the fifteen class (c) drills
  (`docs/plans/2026-11-17-roadmap-drain-7/dispositions.md:25-26`). The current corpus is
  `docs/plans/2026-11-15-req-evidence-linkage/corpus.md` — 59 lines (header 2 + 57 rows), every
  row `Automated | automated-unexercised` (regenerated this session; identical to the committed
  file).
- **EV2 — the linkage predicate is T-ID-scoped.** `checkReqEvidenceLinkage` reports an
  `Automated` row whose T-ID is absent from the exercised set (`scripts/lib/req-checks.ts:886-887`)
  and a `Manual` row whose T-ID is absent from `DECISIONS.md` (`:890-895`). Closing a row means
  giving its T-ID a real asserting site, not editing the register.
- **EV3 — three of the 57 rows are spec-table assertions the repository can already make.**
  `T420` (`spec/appendices-reference.md:1890`, cited by REQ-369b), `T425` (`:1895`, REQ-374b), and
  `T439` (`:1909`, REQ-374b) assert archetype coverage, archetype usage by coupling rows, and the
  12-archetype vocabulary. Every input they name lives in this checkout: the property table
  (`spec/04-runtime.md:259-301`), the archetype taxonomy (`spec/04-runtime.md:325`), the coupling
  table (`spec/04-runtime.md:528`), and its curation prose (`spec/04-runtime.md:641-671`). The
  roadmap names exactly this family as the demonstrative case: "`T420`/`T425`/`T439` require
  '≥1 archetype per group' and no check asserts non-emptiness (`scripts/validate.ts:1097`)"
  (`ROADMAP.md:43-44`).
- **EV4 — the gap is one missing assertion and one parse defect.** `checkCouplingCompleteness`
  (`scripts/validate.ts:1056-1229`) already parses the property table into `propGroups` with their
  archetypes (`:1082-1100`) and the coupling rows (`:1116-1146`). It warns on an *unrecognized*
  archetype (`:1097`), never counts the groups, and never asserts that a taxonomy archetype is
  used by a coupling row. The parse also cannot represent a missing archetype: `line.split("|")
  .map(trim).filter(Boolean)` (`:1087`) deletes an empty cell before `cols[1]` is read (`:1090`),
  so `| Scene |  | read/write | read-only |` yields `cols[1] = "read/write"` — the GM-access
  cell — and the archetype list becomes `["read/write"]`. Only a non-empty token that splits to
  nothing (e.g. `,`) yields `archetypes: []`, and a row short enough loses `cols[1]` entirely.
  Making non-emptiness observable therefore needs the parse amendment P2 books, not only a new
  `if`. A repo-wide grep finds no other non-emptiness assertion:
  `grep -rn "archetype assignment\|carries no archetype\|no archetype" scripts/ holonovel/scripts/`
  returns nothing.
- **EV5 — a `check*` function's message is the sanctioned evidence mechanism.** Root-script
  assertions are gathered by `labelsFromContent` (`scripts/lib/req-checks.ts:854-870`), which
  collects ID literals inside `check*` functions' `push`/`console`/`return` arguments, over
  `ROOT_SCRIPT_FILES = walkTsFilesRaw(__dirname)` (`scripts/validate.ts:1443`, `:1469-1473`).
  Two labels in the same function are already counted this way: `T421` (`:1215`) and `T435`
  (`:1188`) do not appear in the 57-row corpus, while `T420`/`T425`/`T439` do. Placing the new
  messages inside `checkCouplingCompleteness` therefore exercises the three rows without a new
  script, gate, or harness.
- **EV6 — measured predicate values.** A read-only parse of §7.7 (the same columns the check
  parses) on this checkout reports: 41 property groups, 102 coupling rows, 0 empty archetype
  cells, 12 distinct archetypes plus `[content source]`, and 0 unused archetypes. Three groups
  carry no coupling row — `Ruling Ledger`, `Adventure`, `Adventure Scene Waypoint` — two of which
  are `[content source]` and excluded by REQ-370a (`spec/02-requirements.md:3831`).
- **EV7 — the group-level reading of T420 contradicts §7.7.1b.** `spec/04-runtime.md:643-647`
  states the coupling table "is curated — not every combinatorially possible archetype-pair
  instantiation is a meaningful coupling", and `:662-665` excludes content-source and limits
  session-scoped groups. A check that fails `Ruling Ledger` for having no coupling row would
  enforce the opposite of the curation contract. The faithful predicate is archetype-level: every
  archetype an assignment names is used by at least one coupling row (EV6: 12/12), which is what
  removes the "orphaned archetype assignment" condition T420 and T439 name.
- **EV8 — the vocabulary is already fixed in one place.** §7.7.0 says property groups "are
  classified into 12 archetypes" (`spec/04-runtime.md:325-327`) and `VALID_ARCHETYPES`
  (`scripts/validate.ts:1058`) lists exactly those twelve. T439's "12 distinct archetypes
  enumerated" is therefore checkable against the existing constant rather than a second hardcoded
  list.
- **EV9 — no Appendix F edit is needed.** The three rows stay `Automated`; they become true
  statements about a real check. `B4` (`scripts/validate.ts:1735-1758`) only inspects `TTRPG_*`
  variables, and none of the three row texts names one. The row clauses that already have
  assertions (pattern-rule coverage `T435`, rule/archetype match `T421`, token resolution
  REQ-370a) stay where they are; the new work adds only the missing clauses.

## Roadmap disposition

| # | Section | Priority | Trigger measured this session | Disposition |
|---|---|---|---|---|
| 1 | Independent verification (§10) | P1 | publish head is tag `v2026.11.08`; 141 commits unpushed (`npm run status`); the trigger "first publish after 2026-11-16" is live | Operator-bound: a **different model** from the builder, cold checkout, `DECISIONS.md` item (6) withheld (`spec/07-independent.md:5-16`). Not this session and not a subagent of this model; remains on the roadmap. |
| 2 | Mutation-sample depth | P2 | "next Holosuite lens change" — no lens change since `5a26f11` | Record-and-close; not triggered. |
| 3 | REQ evidence linkage | P1 | 57 findings, all class (b) | **This increment.** Chunk 7: the archetype family, 3 rows (EV3–EV9). Residue 54. |
| 4 | Split `index.ts` | P2 | "more than 50 anchors moved" — measured in the AAR after this increment | Not triggered at plan time; the AAR records the anchor delta. |
| 5 | Codex pack | P3 | no REQ-620/REQ-621 change | Not triggered. |

**Ladder for the remaining 54.** Chunk 7 executes the first cluster. The rest need an asserting
site of one of three kinds — a static spec-table check (this chunk's kind), a server-runtime
harness test under `holonovel/scripts/`, or a Manual home via the chunk-6 mechanism when the
clause is operator- or builder-held. Chunk 8 classifies the residue into those three homes
(one disposition row per finding) and the following chunks execute by home. Naming clusters
before that read would be guesswork; the class (c) boundary no longer exists to inherit a split
from.

## Decisions

- **D1 — Chunk 7 closes exactly three rows: `T420`, `T425`, `T439`.** They are the roadmap's own
  "real, not bookkeeping" example (EV3) and they share one parser, one predicate family, and one
  test surface. Rejected: interleaving the other 54 (no triage exists for them; chunk 8 owns
  it); rejected: a triage-only increment (the roadmap already demonstrates this family fails
  today, so a triage that leaves it failing is a no-op).
- **D2 — Evidence is one parse amendment, three assertions, and one report line inside
  `checkCouplingCompleteness`.** The parse keeps a cell's position: split on `|`, trim each cell,
  strip only the leading and trailing empties the table delimiters create, then index — so an
  empty archetype cell stays `""` instead of shifting the GM-access cell into its place (EV4).
  A row that still carries fewer than four cells is reported by D4 output 1 as malformed rather
  than silently dropped. Well-formed rows parse exactly as today. No new script, no new gate, no
  new harness, and no ratchet move. Rejected: a new `scripts/check-archetypes.ts` (duplicates the
  existing parse, and a second gate over one finding class is the duplication
  `check-script-quality` C1 rejects); rejected: flipping these rows to `Manual` (the clauses are
  machine-checkable here — a flip would be false evidence); rejected: adding the assertion over
  the filtered columns without the parse change (it can never observe an empty cell — the
  defect revision 1's cold pass found).
- **D3 — "archetypes used by ≥1 coupling row" is archetype-level, not group-level.** Enforced as
  set membership over the archetype tokens the coupling pairs resolve to, excluding
  `[content source]` groups and `[non-property]` rows. Justified by EV7 and measured in EV6.
  `Ruling Ledger`'s lack of a coupling row is reported, not failed: the spec's curation clause
  makes it legitimate. Rejected: failing group-level orphans, which would require inventing a
  coupling row for `Ruling Ledger` and would contradict §7.7.1b.
- **D4 — The three assertion messages and their labels.** They are emitted from
  `checkCouplingCompleteness` so `labelsFromContent` counts them (EV5), and each names the row
  whose clause it asserts:
  1. `ERROR: T420/T425 — property group "<name>" carries no archetype in §7.7.`, and the same
     label for a row that does not carry all four columns
     (`ERROR: T420 — §7.7 property row "<first cell>" does not carry four columns.`);
  2. `ERROR: T439 — §7.7 property archetypes [<set>] differ from the §7.7.0 twelve-archetype
     vocabulary [<set>].`;
  3. `ERROR: T420/T439 — archetype "<name>" is used by no coupling row in §7.7.1a.`;
  4. `console.log` summary: `T425 — Archetype assignment completeness: <n>/<total> property
     groups carry ≥1 archetype; <k>/12 archetypes used.` The existing unknown-token `WARNING`
     (`:1097`) is left untouched so the warning count is not reclassified inside this increment.
     Outputs 2 and the `WARNING` are complementary by design: one bad cell produces both a
     warning (single token unrecognized) and an error (vocabulary set differs). Do not remove
     either as a "duplicate".
- **D5 — No specification prose changes.** The check is the deliverable; if the dry run finds a
  real data defect (an empty cell, a vocabulary mismatch, an unused archetype), the increment
  stops before the register edits and re-scopes, because fixing §7.7 data is a spec edit with
  fingerprint consequences that belongs in its own increment. EV6 measured zero such defects,
  so the expected path is green on the first run.
- **D6 — Registers move in one step, in dependency order.** `ROADMAP.md` first (item 3: residue
  54, the three closed T-IDs, still exactly three bullets per `scripts/check-roadmap.ts:24`),
  then the new dated subsection under `## Scheduled-roadmap` in
  `spec/audit/review-register.md`, then the corpus and the coverage register (two regeneration
  commands), then `CHANGELOG.md`. The new subsection names T-IDs and dates, not `REQ-` tokens:
  `checkReviewFindings` cross-checks every `REQ-` token in it against `ROADMAP.md`
  (`scripts/lib/register-checks.ts:64-69`), and item 3 does not need a fourth bullet to carry a
  REQ it already owns.
- **D7 — The three rows are exercised by the check, not by a copy of its output.** The AAR must
  record the assertion arguments, not just the corpus delta: a row leaves the corpus because the
  check now evaluates its clause, not because an ID was pasted into a message. The mutation
  probes in V3–V5 are that record.
- **D8 — The residue stays on the roadmap.** Item 3 keeps its trigger and its error-mode closure
  condition; the increment reports 54, not a claimed improvement in evidence quality.

## Done bar

- **Assertions** — the property-table parse preserves empty cells (D2), so a missing archetype is
  observable; `checkCouplingCompleteness` emits the four D4 outputs; the three ERROR classes fire
  under their mutation probes (V3–V5) and do not fire on the current tree (V1). The parsed group
  count is 41 before and after the parse change (V1 reads it).
- **Linkage** — `validate` reports `REQ evidence linkage: 54 finding(s)`, `0 error(s)`; the
  regenerated corpus is 56 lines (header 2 + 54 rows) and names none of `T420`, `T425`, `T439`
  (V2, V4).
- **Registers** — `ROADMAP.md` item 3 reads residue 54 with exactly three bullets and names the
  three closed T-IDs; `spec/audit/review-register.md` carries the dated chunk-7 subsection;
  `spec/audit/req-coverage.md` is regenerated and its only expected diff is the bucket move for
  the affected REQ rows (V6).
- **Gates** — `check:fast` PASS un-piped; `check-registers`, `check-roadmap`,
  `check-conformance`, `test:spec-tooling` pass; `npm run assemble` is idempotent (V7).
- **Close** — one commit; `aar.md` records the probes, the anchor delta for roadmap item 4, and
  ends `LOOP PAUSED`.

**Fallback bar** — if the dry run (V1) reports any D5 defect, the increment stops after P1:
`dispositions.md` records the reading, no register is touched, the AAR schedules the fix as its
own increment, and roadmap item 3 keeps 57.

## Blast radius

| File | Change | Size |
|---|---|---|
| `scripts/validate.ts` | Property-table parse retains empty cells (`:1087-1090`); four outputs (three errors, one summary) inside `checkCouplingCompleteness` (`:1056-1229`), reusing the parsed `propGroups`/coupling rows; ~55 lines | M |
| `docs/plans/2026-11-15-req-evidence-linkage/corpus.md` | Regenerated; three rows leave (57 → 54) | S |
| `spec/audit/req-coverage.md` | Regenerated (`validate -- --write-register`); expected bucket move only for the affected REQ rows | S |
| `ROADMAP.md` | Item 3: residue 54, the three closed T-IDs; still three bullets, trigger unchanged | S |
| `spec/audit/review-register.md` | New dated `### 2026-11-17 — REQ evidence linkage chunk 7` subsection under `## Scheduled-roadmap` | S |
| `CHANGELOG.md` | Dated entry (date equals the commit subject's) | S |
| `docs/plans/2026-11-17-roadmap-drain-8/` | `plan.md`, `tasks.md`, `dispositions.md` (P1), `aar.md` (P5) | L |

Rollback cost 1: one new assertion block and regenerated registers, reversible with one commit.
Non-goals: the other 54 rows; error-mode for the linkage check; any change to
`checkReqEvidenceLinkage`, `labelsFromContent`, `parseAppendixF`, or the Appendix F table;
editing §7.7 data or prose; a new script or gate; the unknown-token `WARNING`; a version-surface
advance.

## Phases

### P1 — Dry run and dispositions (no file writes beyond the plan artifacts)

Run V1's `validate` and confirm the four D4 outputs would be green on the current tree. Audit the
new assertions against the parsed data before writing them: confirm the 41 groups, 12 archetypes,
and 102 coupling rows are what the check will see (the check's own parse, not EV6's probe). Write
`dispositions.md` with one row per finding — `| REQ | T-ID | class | cite | home | action |`,
action `author`, `home` the assertion's location in `scripts/validate.ts` — and record the reading
that keeps D5's fallback available.

### P2 — The parse and the assertions

First amend the property-table parse in `checkCouplingCompleteness`: split on `|`, trim every
cell, drop only the leading and trailing empty cells that the table delimiters create, then keep
positional indexing. Assert the row still has four cells; a short row is reported by output 1
rather than dropped. Re-read the group count after the change (expect 41) before adding the
assertions.

Then add the D4 outputs. The non-emptiness check iterates `propGroups` after `:1100`; the
vocabulary check compares the distinct non-content-source archetypes against `VALID_ARCHETYPES`;
the usage check intersects resolved coupling archetypes with `VALID_ARCHETYPES` after
`couplingRows` is complete (`:1141`). The summary line goes beside the existing `T434` report
(`:1222`).

### P3 — Mutation probes (non-vacuity)

On a scratch copy of the tree (or a temporary edit reverted with `git checkout --`), prove each
assertion fires: empty one archetype cell; add a bogus archetype; remove every coupling row that
resolves to one archetype. Record the emitted message for each in `aar.md`. The tree must be
clean before P4.

### P4 — Registers

`ROADMAP.md` item 3 (residue 54, closed T-IDs, three bullets). Then the
`spec/audit/review-register.md` subsection under `## Scheduled-roadmap`. Then
`npm run validate -- --write-linkage-corpus docs/plans/2026-11-15-req-evidence-linkage/corpus.md`
and `npm run validate -- --write-register`. Then `CHANGELOG.md`.

### P5 — Gates and close

Write `aar.md` first (input to `check-loop-artifacts`, strict inside `check:fast`), then V1–V7,
then `npm run session:close --single`.

## Verification

Pipes inside a table cell are written `\|`; every command runs with a plain `|`.

| # | Command | Expected |
|---|---|---|
| V1 | `npm run validate > /tmp/opencode/d8.txt; echo $?` then `grep -e 'error(s)' -e 'REQ evidence linkage' -e 'Archetype assignment completeness' /tmp/opencode/d8.txt` | exit 0; `0 error(s)`; `REQ evidence linkage: 54 finding(s)`; one completeness line reading `41/41 … 12/12` |
| V2 | `wc -l docs/plans/2026-11-15-req-evidence-linkage/corpus.md` | `56` (header 2 + 54 rows), from 59 |
| V3 | scratch copy: empty the `Scene` archetype cell in `spec/04-runtime.md`, run `validate` | exactly one `ERROR: T420/T425 — property group "Scene" carries no archetype` (no `WARNING`, since the amended parse yields zero tokens), and the summary line reads `40/41`; then restore |
| V4 | scratch copy: change `Scene`'s archetype to `Bogus`, run `validate` | one `ERROR: T439 — … differ from the §7.7.0 twelve-archetype vocabulary` **and** the existing `WARNING: Property "Scene" has unrecognized archetype "Bogus"` — the two are complements (D4), not duplicates; then restore |
| V5 | scratch copy: delete the four `Mechanics → *` coupling rows (`spec/04-runtime.md:540-543`), run `validate` | one `ERROR: T420/T439 — archetype "Mechanical" is used by no coupling row`, plus four `ERROR: T435` for P34–P37, which lose their only rows; ignore both the `T434` summary change and any other unrelated output; then restore |
| V6 | `for t in T420 T425 T439; do grep -cF "\| $t \|" docs/plans/2026-11-15-req-evidence-linkage/corpus.md; done`; then `git diff --stat spec/audit/req-coverage.md`; `npm run check-registers`; `npm run check-roadmap` | `0` for each; coverage diff limited to the affected REQ rows' bucket/evidence cells (read, not reverted — record any extra diff in the AAR with its reason); both register gates pass |
| V7 | `npm run check:fast` un-piped; `npm run check-conformance`; `npm run test:spec-tooling`; `sha256sum holonovel.md` before and after `npm run assemble` | trailing `check:fast: PASS`; conformance and spec-tooling pass; the two hashes equal (no spec edit reached the assembled document) |
| V8 | `awk '/^## REQ evidence linkage/{f=1; next} f && /^## /{exit} f' ROADMAP.md \| grep -c '^- '`; `grep -c 'T420' ROADMAP.md`; `grep -c 'chunk 7' spec/audit/review-register.md` | `3` bullets in item 3 only (the `awk` skips the heading and stops at the next `## ` heading); `≥1`, the closed T-IDs are named; `≥1`, the dated subsection exists |

## Risks

- **R1 — the predicate is read the other way.** D3 fixes the archetype-level reading and EV7 is
  its evidence; V1 and V6 print both facts (12/12 used, the three uncoupled groups) so a reader can
  see the choice rather than infer it.
- **R2 — a label lands where `labelsFromContent` cannot see it.** Only `check*`-function
  `push`/`console`/`return` literals count (EV5). The four outputs go inside
  `checkCouplingCompleteness`; V1's finding drop is the proof, and a failure there means the label
  moved, not that the assertion is wrong.
- **R3 — the coverage or conformance register moves more than expected.** The bucket move for
  REQ-369b and REQ-374b is expected; any other coverage diff is read and recorded in the AAR,
  never reverted to force an empty diff (the drain-7 precedent for V9). The conformance ratchet is
  a different instrument: `bundledOnlyBucketC` counts bucket-C REQs whose only exercised evidence
  sits in a bundled test name (`scripts/validate.ts:1759-1762`,
  `spec/audit/conformance-baseline.json`). The new labels sit in a `check*` function, not a
  bundled test name, so the count is expected to stay flat. If `check-conformance` nevertheless
  fails, the increment stops and schedules the baseline decision as its own increment — a ratchet
  is never raised inside the increment that feeds it, and the baseline file is not in this
  blast radius.
- **R4 — a new ERROR fires on legitimate data later.** That is the assertion working; the
  fallback in D5 exists only for a finding at *plan* time, not for future spec edits.
- **R5 — the check duplicates an existing one.** Excluded by the existing-check discovery in EV4:
  the parse exists once, in the function being extended.
- **R6 — the increment drifts into roadmap item 1.** Independent verification needs a different
  model; if a publish is attempted mid-session, stop and report rather than folding a publish or a
  verification run into this increment.
- **R7 — the parse amendment regresses a well-formed row.** The control is V1's completeness line
  (41/41 groups, 12/12 archetypes) plus the unchanged `T434` row count; both are read before and
  after. A malformed row that the old parser dropped now surfaces as a T420 error — that is the
  amendment working, and the row is fixed in the spec only under the D5 stop rule.

## Open questions

None. The three rows' clauses, the parser's location, and the predicate reading are settled by
EV3–EV8; the residue's disposition is chunk 8's work by D1 and the ladder.
