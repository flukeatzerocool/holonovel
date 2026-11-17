# Plan — Roadmap drain 7: item 3 chunk 6 (the class (c) block dispositioned as a unit)

**Date:** 2026-11-17 · **Kind:** planned · **Depth:** standard · **Revision:** 4 ·
**Increment:** `docs/plans/2026-11-17-roadmap-drain-7` · **Rollback cost:** 1 ·
**Evidence:** git HEAD `3988a92`, clean tree. Baseline: `check:fast` exit 0 (`46 passed,
0 failed`, trailing `check:fast: PASS`); `validate` exit 0, `0 error(s), 377 warning(s)`,
`REQ evidence linkage: 72 finding(s)`; `npm run status` — 5 open roadmap items, 140 unpushed
commits, tag `v2026.11.08`.
**Review history.** Revision 1 was read by cold stages 1–2; stage 1 raised a Blocker (an
unsupported "no build artifact exists" claim) and six Majors, all fixed in revision 2. Revision 2
was read by the stage-2 re-audit and the three stage-3 critics; the critics raised the control
defects that revision 3 fixes: a mixed row could be flipped despite an in-repo-checkable half
(M2), the Appendix F row was called authoritative while its Test text was frozen (M1), the
register-separation premise contradicted `DECISIONS_PATH` (M3), V5 asserted presence rather than
shape (M4), and V8/V9 could pass vacuously (M5). Revision 4 corrects the verification escapes and
the sequence labels.

## Why

- **EV1 — the roadmap residue is one arithmetic split.** `ROADMAP.md:36-52` carries item 3 with
  72 findings; the trail is `80 → 72` after chunk 5 (`spec/audit/review-register.md:3166-3192`),
  and chunk 4's triage fixed the split: 57 class (b) + 15 class (c)
  (`docs/plans/2026-11-16-roadmap-drain-6/dispositions.md:19`, class counts at
  `docs/plans/2026-11-16-roadmap-drain-5/dispositions.md:94-96`). Chunk numbering maps as
  chunk *N* → increment `roadmap-drain-(N+1)`: chunk 4 is drain-5's triage, chunk 5 is drain-6's
  `T497` closure, chunk 6 is this increment.
- **EV2 — the corpus holds exactly those 72 rows.** `docs/plans/2026-11-15-req-evidence-linkage/
  corpus.md` is 74 lines (header + separator + 72 rows), every row `Automated |
  automated-unexercised`. The 15 class (c) rows are one row each: `REQ-013`/`T25`,
  `REQ-013`/`T36`, `REQ-014`/`T21`, `REQ-123`/`T130`, `REQ-209`/`T252`, `REQ-270`/`T290`,
  `REQ-272`/`T292`, `REQ-274`/`T294`, `REQ-275`/`T295`, `REQ-299`/`T343`, `REQ-299`/`T430`,
  `REQ-300`/`T344`, `REQ-301`/`T345`, `REQ-303`/`T347`, `REQ-354`/`T405`.
- **EV3 — the linkage predicate is kind-driven, so a kind flip is the mechanism.**
  `checkReqEvidenceLinkage` reports an `Automated` row whose T-ID is absent from the exercised
  set (`scripts/lib/req-checks.ts:886-887`) and a `Manual` row whose T-ID is absent from
  `DECISIONS.md`, matched `\b`-anchored so `T84` is not satisfied by `T84e`
  (`scripts/lib/req-checks.ts:890-895`). The precedent section cites
  `scripts/lib/req-checks.ts:700-706` for the same rule; that range is the module's comment block,
  and `:886-895` is where it is enforced — one field, `row.kind`, read in one place. The rows map
  keeps every row regardless of kind (`parseAppendixFTestText`, `scripts/validate.ts:1696-1708`),
  so a flipped row lands in the `Manual` branch rather than becoming `no-row`.
- **EV4 — class (c) means "the Appendix F kind should be `Manual`"**
  (`docs/plans/2026-11-16-roadmap-drain-5/plan.md:43-45`); chunk 4 recorded the class and did not
  execute it, because flipping a kind is a spec edit needing `assemble`
  (`docs/plans/2026-11-16-roadmap-drain-5/plan.md:69-70`).
- **EV5 — the rows are builder drills against a build output, and this repository commits none.**
  `REQ-014` compares the sources against "the intake hash stored in `DECISIONS.md`"
  (`spec/02-requirements.md:398-407`); `REQ-270` inspects the four handoff artifacts and their
  first comment line (`spec/02-requirements.md:327-334`); `T130`'s drill builds a server for a
  ruleset carrying stat-block conventions (`spec/appendices-reference.md:1642`); `REQ-299`'s
  adjusted-threshold drill needs "a ruleset whose indexed-item count exceeds 200"
  (`spec/appendices-reference.md:1818`). Predicate for the build output:
  `git ls-files | grep -iE 'RULESET_MODEL|ruleset_model\.json'` returns nothing today. The
  register itself is *not* absent in the same sense: `holonovel/DECISIONS.md` is this repository's
  register of record (`DECISIONS_PATH`, `scripts/validate.ts:1642`), and the linkage check reads
  it — which is why the procedure of record must land there. What a drill needs and the repo does
  not hold is a *built ruleset* with its section (1)–(6) content. P1 re-reads each row on that
  distinction (D4); the classification rests on that read.
- **EV6 — the sanctioned mechanism already exists, with 14 precedents.**
  `holonovel/DECISIONS.md:3108` opens the "Manual verification procedures — 2026-11-16" section
  drain 2 created for exactly this move; it is the file's last section, running to `:3188`, and
  holds 14 entries (`:3117` T3 … `:3184` T223). Its lead-in says the entries "state the actor,
  the precondition, and the record" and that the Appendix F row "carries the full procedure";
  the entries themselves also carry a `Procedure:` line. D3 follows the entries, not the lead-in
  summary. Appendix F holds 23 rows whose `Type` cell is `Manual`
  (`grep -c '| Manual' spec/appendices-reference.md` = 23 today, every match a `Type` cell).
- **EV7 — the 15 T-IDs are cited once each.** Every one appears exactly once in the corpus, so
  no class (b) row shares an ID with a class (c) row; flipping these kinds cannot clear a (b)
  row by accident.
- **EV8 — nothing else reads the kind for these rows.** `parseAppendixF`
  (`scripts/compare-spec-code.ts:168-202`) uses only title and REQ tokens; the B4 assertion check
  iterates the exercised set (`scripts/validate.ts:1748-1758`), which these rows are not in; the
  implementation-coverage bucket is REQ-level and computed from `cited` and `exercised`
  (`scripts/validate.ts:2103-2112`), neither of which a kind flip touches; the Appendix F
  preamble (`spec/appendices-reference.md:1446`) states a documentation duty, not a count. No
  README `@spec:` marker and no fingerprinted section (§5.9, §5.16–5.17, §6.3, §6.4.2, §7.7,
  §5.19, Appendix Q) carries an Appendix F kind. V9 checks the bucket claim by reading the
  register before and after rather than trusting this paragraph; if that diff is nevertheless
  non-empty, the moved cells are committed with the reason stated in the new register subsection
  and the AAR — never silently re-run, and never reverted to force the diff empty.
- **EV9 — three rows carry an in-repo-checkable half.** `T344`
  (`spec/appendices-reference.md:1819`) asserts a resolution-field transition and a section-(5)
  diagnostic record; `T345` (`:1820`) asserts `convergence_summary` totals; `T347` (`:1822`)
  asserts Pattern Buffer sub-workflows are skipped with annotations for unchanged sections — and
  this repository's harness does run the Pattern Buffer (`test:all`). Those clauses cannot be
  closed by a kind flip without deleting an obligation the repository can meet (D4).

## Roadmap disposition

| # | Section | Priority | Trigger measured this session | Disposition |
|---|---|---|---|---|
| 1 | Independent verification (§10) | P1 | publish head is tag `v2026.11.08`; 140 commits unpushed (`npm run status`); trigger "first publish after 2026-11-16" is live | Operator-bound: a **different model** from the builder, cold checkout, `DECISIONS.md` item (6) withheld (`spec/07-independent.md:5-16`). Not this session, and not a subagent of this model. |
| 2 | Mutation-sample depth | P2 | "next Holosuite lens change" — no lens change since `5a26f11` | Record-and-close. |
| 3 | REQ evidence linkage | P1 | 72 findings; 57 (b) + 15 (c) | **This increment.** Chunk 6: the class (c) block (EV2–EV9). |
| 4 | Split `index.ts` | P2 | 0 anchors moved by this increment | Not triggered. |
| 5 | Codex pack | P3 | no REQ-620/REQ-621 change | Not triggered. |

## Decisions

- **D1 — Chunk 6 dispositions the whole class (c) block, and only that block.** Every one of the
  15 rows leaves class (c) — either flipped to `Manual` or, where EV9 applies, reclassified to
  class (b) with an authoring obligation. Nothing is left in a third state, and no class (b) row
  outside these 15 is touched. *Forecast, not a promise:* the design pass expects three rows to
  land in class (b) (EV9), so the residue is `57 + n` with `n` expected at 3 — P1's read decides.
  Rejected: interleaving the 57 existing class (b) rows — they need per-row assertion reads and
  are not session-sized; rejected: doing class (b) first, which would leave this block as a
  second residue for one roadmap item.
- **D2 — A class (c) row closes by flipping its kind, except where the row has an
  in-repo-checkable half.** Authoring a harness test under the same T-ID for a row whose clause
  is operator-held would assert a *different* contract than the row's text — the nominal evidence
  the register already refused once (`spec/audit/review-register.md:3155-3158`, chunk 4's refusal to
  relabel `T682` and its removal of the `?? visibility_rate` fallback). Rejected:
  re-citing a row to an existing exercised T-ID — no exercised test covers these clauses.
- **D3 — The Appendix F row keeps its text; only the `Type` cell becomes `Manual`; the procedure
  of record is the `DECISIONS.md` bullet.** The row is the one-line catalogue entry, and its
  "Assert …" clauses are what the operator checks; the bullet is where the actor, precondition,
  procedure, and record live, which is what the precedent's lead-in means by "carries the full
  procedure" read against the entries. The Appendix F edit changes one cell per row — Test text,
  REQ column, and every other row stay byte-identical. Nine of the fifteen rows are canonically
  padded — their cell becomes `| Manual   |`, replacing `| Automated |` — and six are unpadded
  (`T343`, `T344`, `T345`, `T347`, `T405`, `T430`), where `| Manual |` suffices. Either way P2
  edits by T-ID,
  never by pattern. The
  DECISIONS edit extends the existing section (`holonovel/DECISIONS.md:3108`) with a dated
  lead-in — "Extended 2026-11-17 by `docs/plans/2026-11-17-roadmap-drain-7`" — and one bullet per
  flipped T-ID in ascending order, in exactly this shape (the precedent's own, `:3117-3184`):
  `- **`Tnn` — <title>.** Actor: … Precondition: … Procedure: … Record: …` — four labelled
  fields on one bullet, four to eight lines, the Procedure a one-to-three-sentence summary of the
  drill and the Record the artifact the operator keeps. The block is appended after the last
  existing entry (`holonovel/DECISIONS.md:3188`), ascending within itself; the 14 precedents end
  at T223, so no splice into the existing list is possible or needed. Rejected: a second "Manual
  verification procedures" section — two near-identical containers for one duty.
- **D4 — P1's classifier has two outcomes, and the burden is on the flip.**
  `closed` → flip to `Manual` (the clause needs a built ruleset and has no in-repo-checkable
  half); `author` → keep `Automated`, record the in-repo-checkable clause in `cite`, and leave the
  row in the corpus (class (b), residue grows). There is no third state: a row with any
  in-repo-checkable half takes `author`, with the half named. EV9's three rows are the known
  candidates; P1 confirms or refutes each. The arithmetic is never fudged to reach a literal 57,
  and it has a floor as well as a ceiling: **`n ≤ 3`**. If P1 returns a larger `n`, the plan
  halts before P2, records the reading in `dispositions.md`, and re-scopes on a fresh increment —
  a block that mostly reclassifies is not the increment this plan describes. The D8 sentence is
  written only when `15 − n > 0`; at `n = 15` the increment would have created no procedure and
  the sentence would be false.
- **D5 — No check, parser, or scan changes.** The flip uses the existing kind field and the
  existing `\b`-anchored DECISIONS read (EV3). `labelsFromContent` is untouched; no new gate; no
  baseline or ratchet moves.
- **D6 — Registers move in one step, in dependency order.** `ROADMAP.md` first, then the
  supersession note in the chunk-5 review-register subsection pointing forward, then the new
  dated subsection, then the corpus and coverage register (two regeneration commands), then
  `CHANGELOG.md`. The new subsection goes under the existing `## Scheduled-roadmap` heading
  (`spec/audit/review-register.md:3086`), as a fifth `###` immediately after the chunk-5
  subsection (`:3191`, before the two blank lines at `:3192-3193`) and before
  `## Resolved — 2026-11-16 T553 duplicate identifier`
  (`:3194`) — the same level and container as chunks 3–5. That places it inside the
  Scheduled-roadmap family, so `checkReviewFindings` cross-checks every `REQ-` token in it
  against `ROADMAP.md` (`scripts/lib/register-checks.ts:64-69`); the roadmap update is therefore
  mandatory and must be made first, not merely tidy. `ROADMAP.md` item 3 already carries exactly
  three bullets (`:38`, `:43`, `:45`) and `MAX_BULLETS = 3` (`scripts/check-roadmap.ts:24`), so
  the residue, the D8 sentence, and the `author` rows' T-IDs are folded as continuation lines into the
  existing bullets — never a fourth bullet. Symmetrically, the new subsection names T-IDs and
  dates, not `REQ-` tokens: any REQ it must name goes into item 3's continuation lines in the
  same step, so the cross-check resolves by construction instead of at gate time.
- **D7 — The remaining class (b) rows stay on the roadmap, not in this increment.** They are
  recorded as the residue with the chunk-4 triage as their disposition (`author`), and item 3
  keeps its trigger and its "error-mode" closure condition.
- **D8 — The increment creates the duty; it does not execute it.** A flipped row is evidence of a
  documented procedure, not of a passed drill: nothing in this session runs the drills, and the
  AAR must say so. Each entry's Record field names the container that actually yields the
  fixture — the next ruleset-package build's verification record for a drill that needs a built
  ruleset, the release note's verification table for a drill that runs against the reference
  server alone (the distinction the 14 precedents draw: `:3117` release cut, `:3173` source
  conversion). `ROADMAP.md` item 3 carries the sentence "chunk 6 created Manual procedures for
  the class (c) rows; the first execution is the next ruleset-package build." That is the
  falsifiable point at which the procedure produces evidence, so the drop reads as
  reclassification, never as added evidence. Under the fallback the same sentence says
  "chunk 6a" and the register subsection heading uses that label.
- **D9 — The mid-increment state is named, not discovered.** Between P2 and P3 the tree holds
  `Manual` rows with no matching `DECISIONS.md` entry, so a fresh linkage read reports up to
  fifteen `manual-undocumented` findings; the corpus and coverage register are written only in
  P4, so a stray mid-increment `check:fast` shows that transient state rather than drift. No
  intermediate commit is made.

## Done bar

With `n` = the rows P1 sends to `author` (expected `n = 3` on EV9's reading; `n = 0` if P1
refutes all three):

- **Appendix F** — the remaining `15 − n` rows carry `Type: Manual`; `grep -c '| Manual'
  spec/appendices-reference.md` reads `38 − n` (from 23).
- **`DECISIONS.md`** — every flipped T-ID is named in a procedure bullet carrying all four labels
  (`Actor:`, `Precondition:`, `Procedure:`, `Record:`), checked by V5's shape read.
- **Linkage** — `validate` reports `REQ evidence linkage: 57 + n finding(s)`; the corpus holds no row for any
  flipped T-ID and still holds one for every `author` row.
- **Registers** — `ROADMAP.md` carries the D8 sentence with exactly three bullets;
  `spec/audit/req-coverage.md` is regenerated and its bucket cells for the affected REQs are
  identical (V9); `dispositions.md` holds exactly 15 rows, one per finding, `action: closed` or
  `author`.
- **Gates** — `check:fast` PASS un-piped, `check-registers` and `check-roadmap` pass,
  `assemble` idempotent (`holonovel.md` hash unchanged by the second run).
- **Close** — one commit; AAR ends `LOOP PAUSED`.

**Fallback bar** — if P1 returns `n > 3` (D4's ceiling), the increment stops before P2:
`dispositions.md` records the reading, the roadmap and the registers are untouched, the AAR
records the increment as "chunk 6a" and schedules the residue, and the next increment re-scopes.
The bar is never met by reaching a literal 57 when a row was reclassified.

## Blast radius

| File | Change | Size |
|---|---|---|
| `spec/appendices-reference.md` | `15 − n` `Type` cells `Automated` → `Manual` (T21, T25, T36, T130, T252, T290, T292, T294, T295, T343, T344, T345, T347, T405, T430 — the surviving subset) | S |
| `holonovel/DECISIONS.md` | Lead-in plus `15 − n` procedure bullets in the existing Manual section (`holonovel/DECISIONS.md:3108`) | M |
| `holonovel.md` | Regenerated by `npm run assemble` | S |
| `docs/plans/2026-11-15-req-evidence-linkage/corpus.md` | Regenerated; `15 − n` rows leave | S |
| `spec/audit/req-coverage.md` | Regenerated (`validate -- --write-register`); expected zero diff (V9) | S |
| `ROADMAP.md` | Item 3: residue `57 + n`, the T-IDs of the `author` rows, the D8 sentence; still three bullets | S |
| `spec/audit/review-register.md` | Chunk-5 supersession note + new dated subsection under `## Scheduled-roadmap` (`:3086`) | S |
| `CHANGELOG.md` | Dated entry (date equals the commit subject's) | S |
| `docs/plans/2026-11-17-roadmap-drain-7/` | `plan.md`, `tasks.md` (carried in; amended only on deviation), `dispositions.md` (P1), `aar.md` (P5), `cold-review/00-scope.md` and `cold-review/report.md` (written by the review session, already present) | L |

Rollback cost 1: reversible text only, one commit via `session:close --single`.
Non-goals: authoring the in-repo-checkable halves of the `author` rows; the existing 57 class (b)
rows; error-mode for the linkage check; any change to `labelsFromContent`,
`checkReqEvidenceLinkage`, or the Appendix F parser; re-citing rows to existing T-IDs; a second
Manual section; editing the Test text of any Appendix F row or the 14 existing procedure entries.

## Phases

### P1 — Triage the 15 rows (no spec edits)

Read the corpus as it stands (72 rows, no regeneration) and, for each of the 15 rows, read the
Appendix F text and the REQ body, applying D4. Write one `dispositions.md` row per finding
(`| REQ | T-ID | class | cite | home | action |`, action `closed` or `author`; `cite` records the
in-repo-checkable clause for an `author` row, `home` the `path:line` of its asserting site, and
both are `—` for a `closed` row (whose site is the `DECISIONS.md` bullet)). P1 also captures V9's baseline:
`awk -F'[\|]' '/^[\|] REQ-/ {k=$2; gsub(/ /,"",k); if (k ~ /^REQ-(013\|014\|123\|209\|270\|272\|274\|275\|299\|300\|301\|303\|354)$/) print k, $5}' spec/audit/req-coverage.md > /tmp/opencode/d7-bucket-before.txt`
(unescape the `\|` table escapes when running it), and fixes `n`. The only writes are
`dispositions.md` and that scratch file; the corpus is regenerated once, in P4. `tasks.md` is
authored with this plan and amended only by the phase that deviates.

### P2 — Appendix F flips

Edit each `closed` row's `Type` cell, by T-ID (nine rows are canonically padded, six are not —
never rewrite by pattern; D3 gives the target cell text for each group). `npm run assemble`.

### P3 — The procedures

Author one bullet per flipped T-ID in `holonovel/DECISIONS.md`'s Manual section under the dated
lead-in, in D3's exact shape, ascending by T-ID. The four field labels are mandatory and in that
order; the section's lead-in prose is a summary of the duty, not the entry shape.

### P4 — Registers

`ROADMAP.md` item 3: fold the residue (`57 + n`), the `author` rows' T-IDs, and the D8 sentence
into the three existing bullets as continuation lines — the bullet count stays at three
(`scripts/check-roadmap.ts:24`); the `**Trigger:**` line is unchanged. Then the chunk-5
supersession note, and the new `### 2026-11-17 — REQ evidence linkage chunk 6` subsection (or
`chunk 6a`) inserted after `:3191`, keeping the two blank lines before `:3194`, under
`## Scheduled-roadmap`. Its body states three facts: the flipped count (`15 − n`), the reading
`n`, and the residue (`57 + n`) — the same three the AAR summarizes. Then
`npm run validate -- --write-linkage-corpus
docs/plans/2026-11-15-req-evidence-linkage/corpus.md` and `npm run validate -- --write-register`
(the only corpus and coverage-register writes); then `CHANGELOG.md`.

### P5 — Gates and close

Write `aar.md` first (it is an input to the `check-loop-artifacts` gate, which runs strict inside
`check:fast`), then `npm run check:fast` un-piped, `npm run check-registers`,
`npm run check-roadmap`, `npm run assemble` (idempotence read: V7), then
`npm run session:close --single`.

## Verification

Pipes inside a table cell are written `\|`; that is Markdown table escaping, and every command
runs with a plain `|`.

| # | Command | Expected |
|---|---|---|
| V1 | `npm run validate > /tmp/opencode/d7.txt; echo $?` then `grep -e 'error(s)' -e 'REQ evidence linkage' /tmp/opencode/d7.txt` | exit 0; `0 error(s)`; `REQ evidence linkage: 57 + n finding(s)` (`n` from `dispositions.md`; the baseline form is `72 finding(s)`) |
| V2 | `wc -l docs/plans/2026-11-15-req-evidence-linkage/corpus.md` | `59 + n` (header 2 + rows `57 + n`), from 74; an `author` row stays, so the count rises with `n` |
| V3 | `cd /home/fluke/Holonovel && for t in T21 T25 T36 T130 T252 T290 T292 T294 T295 T343 T344 T345 T347 T405 T430; do printf '%s %s\n' "$t" "$(grep -cF "\| $t \|" docs/plans/2026-11-15-req-evidence-linkage/corpus.md \|\| true)"; done` | `0` for each flipped T-ID; `1` for each `author` row |
| V4 | `grep -c '\| Manual' spec/appendices-reference.md` | `38 − n`, from 23 |
| V5 | for each flipped T-ID: `sed -n '/^## Manual verification procedures/,$p' holonovel/DECISIONS.md \| grep -A8 -- "\`$t\`" \| grep -oE '(Actor\|Precondition\|Procedure\|Record):' \| sort -u \| wc -l` | `4` — the bullet sits inside the Manual section and carries all four labels, so a bare ID or a stray mention cannot pass |
| V6 | `npm run check:fast` (un-piped); `npm run check-registers`; `npm run check-roadmap`; `sed -n '/^## REQ evidence linkage/,/^## Non-goals/p' ROADMAP.md \| grep -c '^- '` | trailing `check:fast: PASS`; both register gates pass; item 3 has exactly `3` bullet lines |
| V7 | `sha256sum holonovel.md` at `3988a92` (pre-increment), then after P2's `assemble`, run `npm run assemble` again, `sha256sum holonovel.md` | the second and third hashes are equal **and** both differ from the `3988a92` hash — idempotence plus proof the edit reached the assembled spec |
| V8 | `awk -F'[\|]' '/^[\|] REQ-/ {gsub(/ /,"",$3); gsub(/ /,"",$7); c[$7]++; t[$3]=1; if ($7=="closed" && ($5 !~ /—/ \|\| $6 !~ /—/)) bad++; if ($7=="author" && ($5 ~ /—/ \|\| $6 ~ /—/)) bad++; rows++} END {for (k in c) printf "%s %d\n", k, c[k]; printf "rows %d ids %d bad %d\n", rows, length(t), bad+0}' docs/plans/2026-11-17-roadmap-drain-7/dispositions.md`; `npm run check-loop-artifacts` | `rows 15 ids 15 bad 0`, only `closed`/`author` keys, and the `author` set equals EV9's three rows; 0 errors |
| V9 | rerun P1's bucket command into `/tmp/opencode/d7-bucket-after.txt`, then `wc -l` both files and `diff` them | both files 13 lines; empty diff — bucket cells identical, since neither `cited` nor `exercised` moves |
| V10 | `grep -c 'chunk 6 created Manual procedures' ROADMAP.md`; `grep -c "residue 57 + n" ROADMAP.md` | `1` for the D8 sentence, `1` for the residue line — the two statements the done bar relies on are present, not merely implied |

## Risks

- **R1 — a misclassified row.** D4 is the control: the burden is on the flip, and an
  in-repo-checkable half forces `author`. P1 is the checkpoint, before any edit.
- **R2 — the corpus and the roadmap disagree at a commit boundary.** Mitigation: D6's order, and
  V1–V4 run after P4, before the commit.
- **R3 — a stale `holonovel.md`.** `assemble` runs in P2 and again in P5; V7 proves idempotence.
  If `check-fingerprint-sync` or `check-markers` fails anyway, the remediation is
  `npm run check-tool-definitions-sync` and `npm run refresh-properties` followed by a re-run of
  V6 — named here because EV8 asserts those gates see no change, and an assertion that fails at
  the last phase needs a planned action. A version-surface advance (CalVer, `AGENTS.md`,
  `server.json`, lockfile) is **not** folded in: if an edit reaches it, stop and schedule the
  publication step as its own increment.
- **R4 — a kind flip silently clears a class (b) row.** Excluded by EV7 (each of the 15 T-IDs is
  cited once); V1's `57 + n` reads low if it happened, and V3 prints a `1` for every row that
  stayed, so the two readings cross-check.
- **R5 — a flip manufactures a procedure that never runs.** D8 names the container that yields
  the fixture and puts the sentence on the roadmap and in the AAR; the AAR records the duty as
  created, not executed.

## Open questions

None — the class split, the mechanism, and the classifier are recorded in prior increments.
