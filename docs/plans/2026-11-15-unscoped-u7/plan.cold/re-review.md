# Diff re-review — plans/2026-11-15-unscoped-u7.md (v1 → v2)

Reviewer: independent-review (targeted re-review, standard depth)
Superseded artifact sha256: e74db7b6…b8a37 (v1)
Revised artifact sha256: 2a2199bb57a6887944882e0fa664b2dc0c29e6db2fca9a591a190767972d5705 (v2) — verified
Prior cold report: docs/plans/2026-11-15-unscoped-u7/plan.cold/report.md
  sha256 5f9cae06f8be1ab1b1c4d38ce878e2b5c525cba6197f8eb2df113f9c5d6b81f4 — verified,
  and the plan cites exactly this hash at :25-26
Scope: the `## Resolutions` section and every amended location it names.
       Unchanged text was not re-read.

Persisted by the parent session: the reviewer's sandbox again denied file writes,
so this body is the reviewer's report reproduced verbatim under its intended path.

## Verdict: FAILED — 1 Blocker

Eleven of twelve Blockers are genuinely closed. The exception is **B9**: the fix
is asserted in the resolutions but the command it introduces cannot pass, so the
done bar it was meant to make observable is still unobservable.

## Blockers

**B9 — STILL-BLOCKING [design] — V11 cannot run and cannot pass.**
:492 reads:

    comm -23 <(grep -oE 'DEFECT [A-Z0-9-]+' …/review.md | sort -u)
             <(grep -oE '^\*\*U7-F[0-9]+' spec/audit/review-register.md | sort -u)

Two independent defects:
1. **The two sides never match.** The left side emits `DEFECT U7-F3` (the verdict
   cell, per the vocabulary at :184-185 and the U6 precedent
   `docs/plans/2026-11-15-unscoped-u6/review.md:18-20`). The right side emits
   `**U7-F3` (`-o` prints the matched text, including the leading `**`). Neither
   string equals the other, so `comm -23` prints *every* DEFECT line and V11 is
   non-empty whenever any DEFECT exists — it fails on success and only "passes"
   when there are no DEFECTs to check.
2. **`…/review.md` is a literal ellipsis**, not a path. The command is not
   runnable as written.

Consequence: done bar 2 (:531-533) still has no verification; a DEFECT dropped
from the register cannot fail any V-entry, which was the whole of B9.
Change: `grep -oE 'DEFECT [A-Z0-9-]+' …/review.md | sed 's/^DEFECT //' | sort -u`
against `grep -oE 'U7-F[0-9]+' spec/audit/review-register.md | sort -u`, with the
real path spelled out.

## Majors

**R1 [clarity] — B2's second half survives as a stale trigger.** The
self-cancellation is genuinely fixed (:316 "**Do not edit `ROADMAP.md` at Phase
0.**" — resolved), but 6.6 (:451-453) still says "Advance `ROADMAP.md:30` to U8,
**leave the trigger intact**". `ROADMAP.md:32-33` reads "**Trigger:** the next
allocated review session takes U7", so the committed section would say "U8 is
next" (:30) while its trigger still names U7. V6 (:487) encodes the staleness as
expected ("its trigger unchanged").
Change: update the trigger to name U8, or state why a trigger that names a closed
chunk is correct.

## Minors

**R2 [design] — K4's revert set does not cover the prose fixes.** :507 reverts
`spec/audit/review-register.md ROADMAP.md worklist.md` then runs `npm run
assemble`. If K4 fires *after* 6.2, `spec/appendices-reference.md` /
`spec/appendices-licenses.md` stay edited and `assemble` regenerates from them,
so the tree is not clean. The guarantee holds only for a K4 hit before 6.2 —
which is the likely case, hence Minor rather than Blocker.
Change: add the two appendix files and the regenerated artifacts to the revert.

## Nits

**R3 [clarity]** — Done bar 3 (:536) resolves M11 with "V5 for the register
cross-reference; **the file read** for the row". A file read is not a command, so
that clause is not observable the way the other bars are.

**R4 [clarity]** — R9 (:225) compares a CalVer release stamp to
`git log -1 --format=%cs`, i.e. the *committer* date of the last change. A commit
made after a release but before the stamp was bumped yields a false DEFECT. The
row is sound in intent; state the tolerance (e.g. "equal to the release date or
the next release after it").

## Prior findings — status

| Finding | Status | Evidence |
|---|---|---|
| B1 E block rows / version column | **RESOLVED** | :202-211 names the uncovered columns (stamp attribution, title drift, suffixed-ID majority) and states a reproducible sample rule (rows 1,11,21…, stride 10, 10 samples, explicit pass condition). R9 (:225) now tests attribution via `git log -1 --format=%cs -S"**REQ-<id>"`, not resolvability. |
| B2 Phase 0 self-cancellation | **RESOLVED** (trigger half → R1) | :316 "Do not edit `ROADMAP.md` at Phase 0"; the pointer moves once, at 6.6. |
| B3 dated ROADMAP section | **RESOLVED** | :41-44 and :443-444: a dated entry *inside an existing* section, named in the register row; V6 (:487) asserts section presence and pointer, never a count. |
| B4 register write not executable | **RESOLVED** | :436-445 names the bucket per disposition with verified anchors (`review-register.md:12,2885,2940,3374` — all four confirmed), uses "the increment commit" (:442) instead of a hash, and moves U7-F1 into 6.4 (:444). The `###`-under-`## Resolved` pattern is precedented at `:12`→`:14`. |
| B5 citations confirmed before edits | **RESOLVED** | Order is now 6.2 prose (:424) → 6.3 regenerate (:430) → 6.4 register with `sed -n` (:436-442), which states "so every cited line is current". |
| B6 K4 branch | **RESOLVED** (revert set → R2) | :507 now reverts the record edits, leaves the increment dir uncommitted, runs no close, reports. Executable. |
| B7 cold-pass path | **RESOLVED** | :8-10 states the directory exists before the gate and already holds `plan.cold/report.md`; :24-27 cites the anchored path *and its sha256, which matches the file on disk*. |
| B8 builder-side terminal surface | **RESOLVED** | :184-193 maps every verdict onto the four legal dispositions (`docs/plans/README.md:60-63`); `builder-side`/`external-skill` take AAR record-and-close notes, mandated at :457-458. |
| **B9 / V11** | **STILL-BLOCKING** | See above. |
| B10 review.md shape | **RESOLVED** | :200 and :423 both give `| Row | Unit | Predicate | Verdict | Tier |`; the P-tier field is in the vocabulary (:192-193). 6.5's P0/P1/P3 counts are now computable. |
| B11 R57/R58 anchors | **RESOLVED** | Verified against `spec/appendices-licenses.md`: prose `:3-5`, header `:7-8`, rows `:9-21`, rules `:23-43`. R57 `:1-8` and R58 `:9-21` (:292-293) now span the table exactly; wildcard is `:23-43`. |
| B12 DECISIONS.md blast radius | **RESOLVED** | :470-471 splits "Generated" from "Generated record — the G7 table inside `holonovel/DECISIONS.md`"; :474 read-only = "all records **except** the G7 table"; :173-175 states the same boundary. Unambiguous. |
| M1–M10, M12 | **RESOLVED** | Spot-checked at :164-171 (§5 scheduled not fixed), :454-456 (entry above the existing 2026-11-15 heading), :236 (R20 orphan sweep), :186-187 (predicate defined once), :361-362 (every T/O row runs all four gates), :344-354 (probes redirect, exit captured, no pipes), :327-328 (self pass recorded), :459-461 (red V5–V11 → fix or K4), :15-18 (rollback narrowing), :184-185 (`UNSET` defined with its K4 constraint). |
| M11 | **RESOLVED** (residual → R3) | :536 replaces the phantom "V6 sibling check". |
| N1–N13 | **RESOLVED** | :19-20 (EV3 `repo`, EV13 `tool-output`), :139 (O-blocks in file order), :149/:312 (EV21 last, "EV1–EV21"), :324-326 (both trigger arms), :311-313 (carve-out removed), :257-258 (O.12/O.13 labels split), :267 (R37 relabelled), :300/:413 (`tool_count` vs `tools.length`, 37 over 299), :11-12 (rollback anchors), :157 (`PROVENANCE.md`), :444 (U7-F1 in 6.4), :482 (V1 conditional), :318-320 (`check-registry` exists, network-bound). |

## Unknowns

1. HEAD `f886d9c` unverified — `git` remains denied by the sandbox allowlist.
2. Whether `check-registers:strict` cross-references the register row to the
   ROADMAP section 6.4 now requires (V5's claim at :486).
3. Whether `spec/02-requirements.md` is the correct file for R9's
   `git log -S` probe and for the sample rule's `grep -c "^\*\*REQ-<id> "` — I did
   not read it inside this budget.
4. Isolation: project `AGENTS.md` is injected into this context and was not part
   of the dispatch.

## Budget

6 of 10 reads used: revised artifact (full), prior report + revised artifact
hashes, `spec/appendices-licenses.md:1-10`, register bucket-heading grep.

**independent-review FAILED.** Counts: 1 Blocker (B9), 1 Major (R1), 1 Minor
(R2), 2 Nits (R3, R4). Prior findings: 11 of 12 Blockers RESOLVED, 12 Majors
RESOLVED, 13 Nits RESOLVED, 1 Blocker STILL-BLOCKING.
