# Cold review — assembler appendix completeness

Artifact: `docs/plans/2026-11-12-assembler-appendix-completeness/plan.md`
Artifact sha256: `f3f70cfcbf192f6db0dffcab1175c1f947f65f020169e3d9e6d8676c4a0a7719` (verified, matches)
Reviewer: independent cold (no authoring context). Read-only; no gate run.

## Verdict

The plan targets a real, reproducible defect and its core predicates hold on the
tree. Two defects in the plan's own specification of the fix keep it from being
cleanly executable as written: (1) the stated block-trim rule and the recorded
`+132` / 14 153-line done bar describe two different outputs — the dry-run
artifact contains a **doubled `---`** at the Appendix A/B boundary and the count
only matches that doubled form; (2) the preamble emission rule is under-specified
so the double rule is not acknowledged or gated. Several evidence counts and
citations are also wrong (O block 78→178 vs actual 74→174; T91/T770 line refs).
No Blocker: the content-correct outcome is reachable and the defects are
localized to the insertion rule and the evidence table.

## Findings

### Blocker

None.

### Major

**M1 — The trim rule, the dry-run output, and the line-count done bar contradict
each other; executing the plan reproduces a doubled `---`.**
- Predicate: `plan.md:67-68` ("trailing `\n\n---` and newlines trimmed"),
  `plan.md:123` ("14 153 lines (+132)"), `plan.md:140-142` (step 4 expects +132).
- The source preamble is 27 content lines (`spec/appendices-fixtures.md:1-27`),
  then blank `:28`, `---` `:29`, blank `:30`, heading `:31`. Trimming the
  trailing separator yields 27 lines; the join at `scripts/assemble.ts:119`
  adds 3, so the insertion is **+30**, total **14151** by the assemble report
  metric, not 14 153.
- The dry-run artifact shows the untrimmed form: `---` twice at
  `/tmp/opencode/holonovel.sim.md:9052` and `:9054`, with `## Appendix B:` at
  `:9056`. The matrix region `:9024-9055` is 32 lines, i.e. the `+132` count
  *requires* the doubled rule (preamble 29 lines including its separator + 3).
- Consequence: an executor who follows D1's trim rule gets 14 151 and fails the
  done bar; an executor who matches 14 153 commits a duplicated horizontal rule
  into the canonical spec that neither `validate` nor markdownlint reports.
  Resolve before execution: either state that the preamble keeps its `---`
  (and then remove the duplicate explicitly, adjusting the count), or keep the
  trim rule and change the done bar to +130 / 14 151. Severity is Major, not
  Blocker, because either choice yields meaning-correct content.

**M2 — Preamble/header discrimination is unspecified for non-reference sources.**
- Predicate: `plan.md:72-79` (D2) and `plan.md:136-139` (step 3) say each source
  file's preamble is emitted, but `parseAppendices` returns `{header, preamble,
  blocks}` per file while `scripts/assemble.ts:90-97` currently uses only
  `refHeader` and discards the rest.
- Nothing in the plan states that the `header`/`preamble` split is by
  `# Appendices` prefix, nor that a non-reference file's `# Appendices` header
  is not emitted mid-document. Today only `spec/appendices-reference.md:1` has
  that header, so the corpus does not trigger it — but the parser contract
  admits a future source file re-emitting `# Appendices` before its first
  appendix. D3's reconstruction invariant does not cover emission, so this is
  not caught. Add the rule and a test, or make `header` reference-file-only.

### Minor

**m1 — Per-appendix counts are wrong (delta is right).** Plan: "O 78 → 178
lines" (`plan.md:55-56`). Actual: HEAD `## Appendix O:` spans
`holonovel.md:12751-12824` = **74** lines; sim spans
`/tmp/opencode/holonovel.sim.md:12783-12956` = **174** lines (`## Appendix P:`
at `:12960`). Delta +100 is correct; both endpoints are off by 4, which can
false-alarm step 4's "per-block comparison."

**m2 — Two of three sampled H-4c citations do not resolve.** Plan cites
`holonovel.md:1558` for T91 and `:2117` for T770 (`plan.md:44`). T91 is at
`holonovel.md:10883`; line 1558 is `_Check:_ T38` (`holonovel.md:1558`). T770 is
at `holonovel.md:11442`; line 2117 is REQ-289e prose. `:4614` does cite
"Appendix O" — 1 of 3 sampled refs is right. These look like source-file line
numbers pasted into an assembled-file column; the H-4c substance is unaffected.

**m3 — Fingerprint section list is incomplete.** `plan.md:112-115` names only
§5.16/§5.17/§6.3/§6.4.2 and §7.7/§5.9/§5.19/Appendix Q, but
`scripts/lib/contract-fingerprint.ts:27-43` also hashes §5.6,
§5.21–§5.28, §5.31, §5.32. The conclusion (no change) still holds: the inserted
content lies outside every hashed section and extraction is content-based
(`contract-fingerprint.ts:45-50`).

**m4 — "the only appendix check is `checkAppendixRange`" is false.**
`plan.md:97-99`. `scripts/validate.ts` also parses the Appendix E manifest
(`:147-149`, `:295-344`) and Appendix F assertions (`:1644-1710`). The
substantive claim — no check covers part-completeness — stands; the
overstatement weakens the existing-check discovery paragraph.

**m5 — Register reconciliation is incomplete.** `review-register.md:2217` cites
REQ-629/630/**633** for H-4, while O.13 cites REQ-629/630/**632**
(`spec/appendices-reference.md:3188-3190`); D5 (`plan.md:103-109`) says it
records predicates but not that it corrects REQ-633. Also H-4 is the sole bullet
under `### 2026-11-12 harness failure remediation` (`review-register.md:2207`),
so the move leaves an empty subsection unless the plan says to delete the
heading; whether `check-registers` rejects that is unverified (see Unknowns).

**m6 — The 14 153 figure uses an unnamed metric.** 14 153 is assemble's
`Total lines` (`assemble.ts:130`, `split("\n").length`), which is wc-l+1;
`holonovel.md` is 14 020 lines by `wc -l`. An executor who verifies with
`wc -l` sees 14 152 and may conclude the done bar failed. State the metric in
the done bar.

**m7 — Matrix citation ranges are imprecise.** Plan says `:1-29` and "SHALL
(`appendices-fixtures.md:22-29`)" (`plan.md:25`, `:43`). The block content ends
at `:27` (SHALLs at `:21-26`); `:28-30` are blank/`---`/blank.

**m8 (Nit) — New lib module header not mentioned.** Step 2 (`plan.md:133-135`)
does not state the header comment. `scripts/lib/script-discipline.ts:45-57`
exempts `scripts/lib` from shebang and role but still requires a header
comment.

## Claims re-verified

- Artifact sha256 matches the supplied digest; tree clean at HEAD a36d133 (state
  as supplied, not re-derived).
- `parseAppendices` is at `scripts/assemble.ts:46-76`; split at `:52`; header
  branch at `:57`; discard path at `:70-73`. ✔
- Four dropped O parts: `**O.8/O.11/O.12/O.13` at
  `spec/appendices-reference.md:3110,3133,3160,3186`; the retained labels are
  O.2/O.1/O.9/O.10 (`:3038,3058,3081,3096`). Intervening separators at
  `:3108,3131,3158,3184`; O's block ends before the `:3208` separator. ✔
- Fixture-matrix drop: `spec/appendices-fixtures.md:1` is the H2 preamble,
  Appendix B at `:31`; `holonovel.md` contains neither `Fixture Coverage Matrix`
  nor `Outcome opposition pairs` (grep: 0 matches). ✔
- Appendix heading counts 17/7/1/1 = 26 (`## Appendix [A-Z]:` per source). ✔
- Line counts: `holonovel.md` 14 020 lines (wc); assemble report metric 14 021.
  Sim is 14 152 lines / 14 153 report metric; delta **+132** verified
  (matrix +32 at sim `:9024-9055`, O +100). ✔ (but see M1 re composition)
- `scripts/lib/contract-fingerprint.ts:24-43` section list (with m3 caveat).
- `checkAppendixRange` at `scripts/validate.ts:729` (with m4 caveat).
- `review-register.md:2205` `## Scheduled-roadmap`, H-4 at `:2209`,
  `## Resolved` exists at `:12`. ✔
- `scripts/check-registers.ts:7,20` cross-checks Scheduled-roadmap against
  ROADMAP.md. ✔
- `test:spec-tooling` is a fast+full gate; 41 fast gates = 44 manifest rows
  minus the three full-only rows (`check-container-image`, `playability`,
  `test:pipeline`) — arithmetic supports the 41/0 baseline claim. ✔
- `ROADMAP.md:15-28` is the P0 section the plan removes; its trigger matches the
  plan's close condition for O (the matrix is additional, recorded as H-4b). ✔
- `assemble` writes both `holonovel.md` and `holonovel/holonovel.md`
  (`scripts/assemble.ts:167-175`) and rewrites `spec/build-phase-map.md` only on
  a source-hash change (`:179-184`) — no diff expected since no `spec/` source
  is edited. ✔
- `session:close` stages untracked files and commits a spec increment as one
  commit (`scripts/session-close.ts:109-125,178`) — "one commit lands" is
  achievable with the new untracked increment dir. ✔
- README `@spec:` markers are property-value based, not whole-file hashes
  (`scripts/cross-property-couple.ts:132-172`), so reassembly should not stale
  them; the §8 contingency is safe. ✔

## Unknowns

- `npm run check:fast` 41/0 and `npm run status` (12 items) were not re-run
  (read-only mandate); only the gate-count arithmetic was checked.
- "65 unpushed commits" not verified.
- `check-registers` behavior on an empty `###` subsection after H-4 moves, and
  on a `###` subsection under the old `## Resolved` (line 12) when recent
  resolutions use top-level `## Resolved — <date>` headings (`:2077`, `:2098`).
- Whether any gate flags a doubled `---` (dry-run says validate and markdownlint
  are clean; not re-run here).
- Exact final line count under the trimmed-preamble variant (predicted 14 151 by
  the report metric from source structure; sim only demonstrates the untrimmed
  form).

## Reads used

1. `sha256sum` of plan.md + evidence sidecar (hash verified)
2. `docs/plans/2026-11-12-assembler-appendix-completeness/plan.md` (full)
3. `spec/` grep, `## Appendix [A-Z]:` across `appendices-*.md`
4. `wc -l holonovel.md`
5. `spec/appendices-fixtures.md:1-33`
6. `spec/` grep, `^\*\*O\.`
7. `holonovel.md:14010-14020`
8. `holonovel.md` grep, `^## Appendix [A-Z]:`
9. `scripts/assemble.ts` (full)
10. `holonovel.md:12816-12833`
11. `scripts/lib/contract-fingerprint.ts:1-50`
12. `scripts` grep, `checkAppendixRange`
13. repo grep, `O\.8|Fixture Coverage Matrix`
14. `spec/audit` grep, `H-4`
15. `holonovel.md` grep, `Outcome opposition pairs` (0 matches)
16. `spec/audit/review-register.md:2192-2227`
17. `ROADMAP.md:1-45`
18. `scripts/test-spec-tooling.ts:1-30`
19. `holonovel/scripts` grep, `specHash|spec_hash|spec-hash`
20. repo grep, `14[ ,]0\d\d|14[ ,]1\d\d`
21. `spec/appendices-reference.md:3186-3211`
22. `scripts/**/*marker*` glob; `package.json` grep `check-markers`
23. `holonovel/src` grep, `SPEC_HASH|specHash`
24. `spec/appendices-reference.md:1-8`
25. `holonovel.md` grep, `T770|Appendix O \``
26. `holonovel.md:4610-4615`
27. `holonovel.md:2113-2118`
28. `holonovel.md:1554-1559`
29. `spec/audit` grep, `^## `
30. `scripts/check-registers.ts` grep, ROADMAP/Resolved
31. `scripts` grep, `parseAppendices|assemble\.ts`
32. `docs/plans/2026-11-12-assembler-appendix-completeness` listing
33. `/tmp/opencode/holonovel.sim.md:9018-9057`
34. `/tmp/opencode/holonovel.sim.md` grep, Appendix N/O/P headings
35. `/tmp/opencode/holonovel.sim.md:14150-14152`
36. `scripts/validate.ts` grep, `ppendix`
37. `scripts/lib/script-discipline.ts` grep, shebang/role/lib
38. `scripts/check-script-discipline.ts:55-84`
39. `scripts/session-close.ts` grep, add/commit
40. `scripts/cross-property-couple.ts` grep, marker/hash

independent-review passed.

## Delta re-review (round 1)

Artifact revised: 241 lines, sha256
`400920dda4cb91467b04e320da52ac82593bf8b0908c70aa7220826d2c4e6a3e`
(verified). Reviewed only the changed lines and their immediate consistency.

### Verdict table

| Finding | Status | Evidence in revised plan |
|---|---|---|
| **M1** trim rule vs. count vs. doubled `---` | **Resolved** | `plan.md:52-66`: stripped preamble, `Total lines` 14 151, HEAD 14 021, +130, single separator, rejected +132 form recorded. `plan.md:145`, `:165`, `:188`, `:200-202` all use 14 151/+130. Verified against the revised dry-run: `/tmp/opencode/holonovel.sim2.md` matrix at `:9024`, single `---` at `:9052`, `## Appendix B:` at `:9054` (HEAD B at `holonovel.md:9024`, so +30 on the matrix), O at `:12781` and P at `:12958` (+100) — 14 021 + 130 = 14 151 is coherent. |
| **M2** preamble/header discrimination | **Resolved** | `plan.md:79-86`: only the reference file may supply `# Appendices`; a non-reference `# Appendices` preamble is a fatal error; preambles get the block trim so the join yields exactly one separator. Pinned by D3.4 (`:100-105`) and restated in step 3 (`:159-163`). |
| **m1** O block 78→178 | **Resolved (wording note)** | `plan.md:58` now says "heading-to-heading slice 78 → 178". Coherent only when read as inclusive of the next heading: HEAD `holonovel.md:12751`→`:12828` = 78; sim2 `:12781`→`:12958` = 178; delta 100 matches +130 total. Suggest adding "inclusive of the next heading" so the metric is not read as 77/177. |
| **m2** T91/T770 citations | **Resolved** | `plan.md:44` now `holonovel.md:10883` / `holonovel.md:11442`; both match the tree. |
| **m3** fingerprint section list | **Resolved** | `plan.md:133-136` names `PACKAGE_SECTIONS` (§5.16/§5.17/§6.3/§6.4.2) and `DATA_SECTIONS` (§5.6, §5.9, §5.19, §5.21–§5.28, §5.31, §5.32, §7.7, Appendix Q), matching `scripts/lib/contract-fingerprint.ts:27-43`. |
| **m4** "only appendix check" | **Resolved** | `plan.md:110-117` names `checkAppendixRange` (`validate.ts:729`), Appendix E manifest (`:295-344`), Appendix F assertions (`:1644-1710`), and the AGENTS layer-map check (`:2144`, verified: it scans `^## Appendix ([A-Z]):` across `spec/appendices-*.md`). Claim narrowed to source-part retention. |
| **m5** register reconciliation | **Resolved** | `plan.md:122-127`: deletes the emptied `### 2026-11-12 harness failure remediation …` heading (`review-register.md:2207`) and aligns H-4 to REQ-629/630/632 (O.13 header at `appendices-reference.md:3188-3190`). Done bar `:149-150` also requires no empty heading left. |
| **m6** 14 153 metric unnamed | **Resolved** | `plan.md:55` names assemble's `split("\n").length` metric; `:145` and `:200` repeat `Total lines`. `git diff` count (130 added / 0 removed) is metric-independent. |
| **m7** matrix citation ranges | Not addressed (unchanged `:1-29` / `:22-29`) | Cosmetic, was not required; no impact on executability. |
| **m8 (Nit)** new lib header | Not addressed | `plan.md:156-158` still silent on the header comment; `scripts/lib/script-discipline.ts:45-57` requires one even for lib files. Nit. |

### New findings from the edits

**Minor — stale `+132` in the risks section.** `plan.md:231` still says "Only
content after Appendix A moves (+132)", contradicting +130 at `:56`, `:145`,
`:165`, `:188`, `:200-202` and the rejection note at `:63-66`. No step or done-bar
item depends on it; update to +130 for consistency.

No new Blocker or Major: the revised emission rule is now single-valued, the
count is reproducible from the sources (+30 matrix, +100 O), the done bar's
`Total lines` target is achievable under the stated trim, and D2's fatal-error
branch does not trigger on the current corpus (`appendices-fixtures.md:1` is
`## Fixture Coverage Matrix`; only `appendices-reference.md:1` is `# Appendices`).

### Reads used (delta)

1. `sha256sum` + `wc -l` of plan.md
2. `plan.md` (full revised read)
3. grep `holonovel.sim2.md` for matrix/O/P headings
4. `/tmp/opencode/holonovel.sim2.md:9048-9057`
5. `scripts/validate.ts:2138-2151`

independent-review passed.

## Binding update

Plan sha256: 016696687220f963cc8f4717ab1fa61346888b5fd5cf1b4ff862bce5a90d7d7d

Final plan artifact: `docs/plans/2026-11-12-assembler-appendix-completeness/plan.md`
sha256 `016696687220f963cc8f4717ab1fa61346888b5fd5cf1b4ff862bce5a90d7d7d`
(verified). This review is re-bound to that digest; the earlier delta section
refers to the superseded `400920dd…` version.

The only content difference from the delta-reviewed version is the lone Minor
correction: `plan.md:231` now reads "(+130)" instead of "(+132)". Confirmed by
re-reading all 241 lines against the delta-version content in this review's
context:

- line count unchanged at 241;
- `grep '132|130'` yields exactly the expected set — `:56`, `:145`, `:165`,
  `:188`, `:201`, `:231` all +130 / 130, and the two remaining `+132` mentions
  at `:65` and `:228` are the deliberately recorded *rejected* doubled-`---`
  form, not the done bar;
- every other region (§1–§7, §9) matches the delta-reviewed text verbatim.

This step confirmed the correction; it did not re-review the artifact under any
new lens. Verdict is unchanged: **no Blocker, no Major — the plan is executable
as written.** The two acknowledged residuals remain non-blocking (the
"heading-to-heading slice" wording could state "inclusive of the next heading";
the new lib module's header comment is unstated but required by
`scripts/lib/script-discipline.ts:45-57`).

independent-review passed.
