# Independent review — plans/2026-11-15-unscoped-u7.md

Reviewer: independent-review (orchestrated cold pass; 6 fresh-context dispatches)
Plan sha256: e74db7b63857ae38ec6013f5fff4a847b44ea198d4f684b72f948103ae5b8a37
Repository root: /home/fluke/Holonovel · target HEAD f886d9c (unverified, see Unknowns)
Gate depth: standard
Stages: 1, 2, 3 (design/structural/style), 5 complete · Stage 4 not triggered
         (read-only pass: no author edits exist to re-read)

Persisted by the parent session: the reviewer's sandbox denied file writes, so
this body is the reviewer's report reproduced verbatim under its intended path.

## Verdict: NO-GO

The plan is well-researched and its anchors are unusually accurate — but it is not
executable as written. The defects cluster into four root causes:

1. **The review records have no defined schema or write order.** `review.md`'s
   columns, P-tier field, and the register's parent bucket are all unstated, the
   register is written before the section that holds it exists, and its citations
   are confirmed before the edits that move them.
2. **The disposition vocabulary is not reconciled** with the repo's four legal
   terminal dispositions.
3. **The Phase 1 gate-coverage claim is false for the column that defines
   Appendix E's contract.**
4. **Three branch/path defects** (K4, the cold-pass path, R58's anchor).

## Blockers (12)

**B1 [design] — E's block rows close on gates that cannot see the column defining
E's contract.** The plan justifies 20 rows by "E is gated" (:34-36, :144-146,
:245-251). Its own EV21 (:64) says the stamp gate reads only bare `^REQ-\d{3}$`
IDs. Verified in `scripts/validate.ts:705-731`: `checkSpecVersionFormat` flags a
row only when the ID matches `^REQ-\d{3}$` *and* the stamp is `—` or `(today)` —
so every suffixed row bypasses it and no check resolves a stamp to a heading.
E's stated contract is "records which specification version last changed each
requirement" (`spec/appendices-reference.md:97-99`). R9 (:131) is one row for
1,324 rows and tests resolvability, not attribution; `CHANGELOG.md:3` plus six
more 2026-11-15 entries make a day-granularity stamp unable to falsify a wrong
attribution. No sample rule appears anywhere.
Change: state which columns the gates do not cover; give every block row a
sample rule (n, selection, pass condition); make R9 test attribution.

**B2 [clarity] — Phase 0 step 5 both orders and forbids the same edit.**
:232-234: "Repair `ROADMAP.md:30` if it still reads 'U7 is next' — at Phase 0 it
does, and it is correct until Phase 6 closes." Condition true, verb imperative,
cancelling clause. All four stages that examined it flagged it.
Change: "do not edit `ROADMAP.md` at Phase 0".

**B3 [design] — `Scheduled-roadmap` is defined as adding a dated ROADMAP
*section*, which V6 forbids and the repo never does.** 6.2 (:344-348) requires
"a dated `ROADMAP.md` section in the admission shape"; V6 (:401) expects
"3 sections". Verified: `ROADMAP.md:15,35,50` are three *undated* sections;
`docs/plans/README.md:41` says "a dated `ROADMAP.md` entry"; the U6 precedent
scheduled into an existing section (`review-register.md:2889`).
Change: schedule a dated entry inside an existing section; restate V6 to assert
section identity, not a count.

**B4 [design] — 6.2's register write cannot be executed as written.** (a) No
parent bucket: the register is bucketed `## Resolved` (`review-register.md:12`),
`## Scheduled-roadmap` (:2885), `## Closed-P3` (:2940), `## Deferred-by-user`
(:3374); 6.2 (:339-341) names only a `###` heading. (b) It requires "the closing
commit" (:341), created only at 6.8 (:373) — self-referential. (c) Phase 0 step 4
(:228-231) records U7-F1 `Resolved` before the `### 2026-11-15 U7` section exists
(6.2 creates it) and before any row is reviewed.
Change: name the bucket per disposition; use a pending-commit placeholder; move
U7-F1 into 6.2 or create the header in Phase 0.

**B5 [design] — 6.2 confirms `file:line` citations before 6.5 moves them.**
6.2 (:342-343) requires `sed -n` confirmation of every surviving `file:line`;
6.5 (:356-361) then edits the files those citations point at. K3 (:418) claims
entries cite headings, but 6.2 mandates `file:line`. Same staleness applies to
`review.md`'s block anchors (:124-141).
Change: reorder, or re-run 6.2 after 6.5.

**B6 [design] — The K4 branch is unexecutable.** K4 (:419) says no commit, the
chunk "stays open as `U7b` in `worklist.md`". But Phase 0 step 4 already edited
`worklist.md:287-289` (and, per B4c, the register), so the tree is dirty; done
bar 7 (:449) requires one commit and rollback (:425-427) prices "one revert". An
uncommitted `aar.md` is never tracked; `U7b` never persists.
Change: define a K4 commit (partial `review.md` + register + dated `U7b` note,
`LOOP OPEN`) or a revert/hold procedure.

**B7 [clarity] — The cold-pass path is unanchored and resolves inside a directory
created after the gate.** :5-6: increment dir "created at execution start";
:16-17: the cold pass "must be recorded before the plan gate, and the stamp binds
`plan.cold/report.md`"; Phase 0 step 3 (:223-227) creates that directory. The
stamp path therefore cannot exist pre-gate, and `docs/plans/README.md:15-24` does
not define `plan.cold`. (This dispatch was in fact aimed at `plans/…-u7.cold/`,
beside the draft — the ambiguity is live.)
Change: name an anchored path that exists before the gate.

**B8 [design] — `builder-side` and `external-skill` are called "terminal" but
routed to no terminal surface.** :107-110 declares them terminal;
`docs/plans/README.md:60-63` admits exactly four terminal dispositions (fixed in
the increment; dated ROADMAP entry; register row; record-and-closed AAR note).
6.2 writes only `DEFECT` rows to the register (:339-342); Phase 3 says only "with
a recorded reason" (:297-299) without naming where. `builder-side` *is* an
established verdict (`worklist.md:183,:229`; U6 `review.md:3-5`), so the gap is
narrow but real: nothing requires the reason to persist anywhere the AAR reads.
Change: require an AAR record-and-close, or a register row, per builder-side row.

**B9 [design] — Done bar 2 is not observable by the verification it cites.**
Done bar 2 (:441) is "Every `DEFECT` row appears in the register with a terminal
disposition (V5)". V5 is `check-registers:strict`, which gates register structure
and dispositions — nothing compares `review.md` verdicts against register rows.
A dropped DEFECT cannot fail any V-entry.
Change: add a V-entry that diffs `review.md` DEFECTs against register rows.

**B10 [clarity] — `review.md`'s record shape is unspecified, and no field can
produce the worklist counts.** 6.1 (:337-338) says only "each carrying its
predicate and verdict". V3 (:398) hard-codes `grep -cE '^[|] R[0-9]'`; 6.3
(:349-351) requires "X P0 fixed, Y P1 scheduled, Z P3 closed", but no verdict in
the vocabulary (:107-110) carries a P-tier.
Change: state the table header and columns (e.g. `| Row | Unit | Predicate |
Verdict | P-tier |`) and the P-tier rule.

**B11 [design] — R58's anchor drops 2 of 13 licence rows and produces a false
DEFECT.** U's table is `spec/appendices-licenses.md:9-21` (13 rows); R58 anchors
`:11-27`, capturing 11 and starting past the table. Phase 4's set-equality
predicate (:311-312) would therefore report a false divergence. R57's `:1-10`
overlaps for the same reason.
Change: anchor R58 at `:9-21` and R57 at `:1-8`.

**B12 [clarity] — Blast radius contradicts itself on `holonovel/DECISIONS.md`.**
:381 lists "the G7 table in `holonovel/DECISIONS.md`" as regenerated by 6.6;
:384 lists "`holonovel/DECISIONS.md` records" under **Not touched**; :96-98 says
U7 "never edits them". Rollback (:7-10) does not name the file.
Change: split the row — "G7 table: regenerated; all other records: read-only".

## Majors (12)

M1 [clarity] E↔§5 (R10) and T↔§5.19 (R21) divergence has no legal disposition:
§5 is in neither scope list (:79-93), and 6.5 routes only server/gate/registry
changes to `Scheduled-roadmap`.
M2 [design] Same-date CHANGELOG collision: `CHANGELOG.md:3` already reads
`## 2026-11-15 — Synthesis and fixtures…`; 6.7 (:368-370) does not state
insertion position and `session:close` takes the **top** heading.
M3 [clarity] F's block rows rest on citation→harness resolution plus a count
ratchet (:249-251); orphan T-rows are unguarded and offsetting defects keep the
count level (the plan itself calls it "a warning ratchet", :420).
M4 [clarity] `predicate` is defined three ways (:109-110, :146, :241-242); the
widest contradicts `review-register.md:9-10` ("not a gate's emitted message").
M5 [clarity] Phase 2's table (:276-283) maps six labels onto thirteen rows
without saying whether each row runs all four gates.
M6 [clarity] Phase 1's probes violate the plan's own un-piped rule (:255-257 vs
:371-372, :392); probe 1 pipes a gate through `grep`, discarding its exit status.
M7 [clarity] No self-review step: the header records "self pass not yet run" (:3)
and Phase 0 folds "cold-pass resolutions" (:225), but nothing runs the self pass.
M8 [design] A single commit behind a fully coupled verification tail (:335-373):
a red V5/V6 leaves no commit and no programmed degrade path, though K8 is live.
M9 [clarity] The inherited-vocabulary citation "U6's `review.md:160-163`" (:107)
is unresolvable: no directory is given, and `docs/plans/2026-11-15-unscoped-u6/review.md`
is 130 lines with the vocabulary at `:3-5`.
M10 [design] Rollback granularity is misdeclared (:7-10, :425-427): one revert
also reverts the register rows, the U8 pointer, and the U7 status line, whose
correctness is independent of the prose fixes.
M11 [clarity] Done bar 3 invokes an undefined "V6's sibling check" (:443-444);
V6 governs `ROADMAP.md`, and no V-row reads `worklist.md`.
M12 [clarity] `UNSET` is used as a fifth verdict (:419, :439) but is absent from
the vocabulary (:107-110); done bar 1 depends on it.

## Nits (13)

N1 EV3 is `tool-output` in the header (:11) but `repo` in its own row (:57);
EV13's `tool-output` (:68) is missing from the header list.
N2 EV11 (:66) lists nine anchors for eight blocks and orders its labels
differently from the file (O.2 at :3063 precedes O.1 at :3083).
N3 EV21 sits between EV9 and EV10 (:64); :219 says "re-baseline EV1–EV20".
N4 Phase 0 step 6 is vacuous: `git log --since=2026-11-28` on 2026-11-15 returns
0 and ignores the "or 26 new commits" arm (`ROADMAP.md:59`).
N5 Phase 0 step 1's carve-out cannot occur: `plans/` is gitignored
(`docs/plans/README.md:9`), and ignored files never appear in `git status`.
N6 R32/R33 split the O.12/O.13 boundary mid-subsection (O.12 → :3210, O.13 at
:3211; R32 ends :3204, R33 starts :3205 inside O.12's recall-probe fixture).
N7 R37 is labelled "G.1" but starts at the `## Appendix G` heading (:2220).
N8 R60 asserts `tool_count` equals "the number of registry actions"; verified
`tool_count` is 37 (`holonovel/tool-definitions.json:3`) while each tool carries
many actions.
N9 Rollback cites `ROADMAP.md:30-31` (:8) though :31 is blank; it also omits the
"Already gated" line Phase 0 rewrites.
N10 Scope names only `mcp-server.schema.json` (:83) while R64 also reviews
`PROVENANCE.md` (:210).
N11 U7-F1 is created already `Resolved` (:230-231) with no named register home.
N12 V1's "build-phase-map hash updated" (:396) holds only if a prose edit
occurred — `scripts/assemble.ts:14` writes a hash of spec content — so a clean
review makes the stated expectation false.
N13 Phase 0 step 4's rationale "name gates that exist" misstates the defect:
`check-registry` exists (`package.json:77`); it is network-bound, not absent.

## Tested and not sustained

- **"Appendix M is unassigned."** Refuted: `worklist.md:61` and `:91` assign M to
  U1 (reviewed 2026-11-14), exactly as EV7 (:61) says. The `D–L` wording at
  `ROADMAP.md:23` is imprecise; the chunk table resolves it. Not reported.
- **"Appendix Q is not the only fingerprint-bearing target."** Refuted:
  `scripts/lib/contract-fingerprint.ts:42` ends `DATA_SECTIONS` with
  `"## Appendix Q:"`; `:27` `PACKAGE_SECTIONS` holds no appendix.
- **"The row-table anchors drift."** Refuted: all 17 `## Appendix ` headings, the
  E/F lead-ins, T.1–T.3, the eight O blocks, Q, U, `ROADMAP.md:15-62` and
  `worklist.md:87-97,278-321` match exactly.
- **"`check-registry` does not exist."** Refuted as worded — it exists
  (`package.json:77`), it is just absent from the manifest.

## Unknowns

1. HEAD `f886d9c` unverified — `git` is denied by the sandbox allowlist.
2. Whether `check-registers:strict` enforces bucket placement and the
   register→ROADMAP cross-reference (bears on B3/B4).
3. Whether `check-roadmap` tolerates the prose line at `ROADMAP.md:30`.
4. Whether `session:close` re-runs `assemble` (committed tree = verified tree?).
5. Whether `check-loop-artifacts` tolerates an unrecognised `plan.cold/`.
6. Isolation: reviewers' contexts included project `AGENTS.md` not in their
   dispatch; recorded per the skill's inherited-instruction clause.

## Budget

Dispatch reads: Stage 1 10/10 · Stage 2 1/3 · design 10/10 · structural 10/10 ·
style 9/10 · stage 5 10/10 = 50. The standard cap of 40 was exceeded because six
dispatches were required (Stage 3 alone is three critics); per-dispatch caps held
and no reviewer widened scope. Parent verification reads ≈48.

**independent-review FAILED.** Counts: 12 Blockers (7 design, 5 clarity),
12 Majors, 13 Nits. Stages 4/5 executed (Stage 4 not triggered).
