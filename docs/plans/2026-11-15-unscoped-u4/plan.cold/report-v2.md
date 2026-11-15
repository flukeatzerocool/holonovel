# Independent review — diff re-review (U4 plan v2)

Reviewer: review (cold subagent, deepseek-v4.1-flash)
Plan sha256: not captured by the reviewer; the reviewed text was plan.md v2 at
HEAD 5aa2e64 (superseded by v3, which carries the three post-re-audit fixes)
Consumes: plan.cold/report-v1.md, sha256 39562f7fea692a098a6a04f3b53646f6c4028d582e560cb7399afa97b400eb7d
Scope: changed lines only, against the v1 findings. No new lens sweep.
Stages: diff re-review (not a fresh five-stage pass) · reads 3/10

## Outcome

Seven of eight v1 findings are resolved. B-2 is only partially resolved: the old
12-step / nine-composite count survives verbatim in Phase 2 step 12 and in Open
question 1, so the plan now contradicts itself (C-3 says eight steps and ten
composites; step 12 says 12 steps and nine outside). The header's "all resolved
below" is therefore false.

## Prior findings

- B-1 resolved — `plan.md:97` (84 bodies, first `:3583`, last `:3809`, REQ-353
  `:3591` unsuffixed); `plan.md:169` carries 84. Matches the v1 count.
- B-2 STILL OPEN — `plan.md:95` (15 steps), `plan.md:171` (eight verification
  steps, ten `npm run` composites) and `plan.md:134` (15 steps, `:9-47`) are
  corrected, but `plan.md:299` still reads "12 steps — … nine are outside the
  manifest" and `plan.md:437` still reads "C-3 measures nine CI-only
  composites". Fifteen steps with nine verification entries is right; step 12
  leaves one step unclassified and both sites contradict C-3.
- M-1 resolved — `plan.md:409-422` names the nine workflows (`:12-22`), assigns
  G4/G5 harnesses, calls G2/G7 partial, and drops the "eleven".
- M-2 resolved — `plan.md:180` probes `spec/06-artifacts.md:16-19,55,57` and
  names `spec/03-build.md:742`; `plan.md:323-333` corrects that single site,
  forbids §9 and the H rows, and records-and-schedules the reverse case. Probe
  is now live.
- M-3 resolved — `plan.md:376-391` names the row-free gates, cites
  `worklist.md:194-197`, and points at `check-gate-table`/`check-script-quality`.
- N-1 resolved — `plan.md:236` states the `##`-heading rule and the rejection
  behaviour, with `register-checks.ts:32-37,57-59`.
- N-2 resolved — `plan.md:134` anchors `:9-47`.
- N-3 / U-1…U-7 — accepted as no-action at `plan.md:43-48`; nothing contradicts
  the tree.

## New / residual

1. [Blocker][design] Residual count contradiction — `plan.md:299` versus
   `plan.md:171`, and `plan.md:437` versus `plan.md:171`. Fix: make step 12 read
   "15 steps — every step fails the job, and eight verification steps run
   non-manifest commands (`C-3`)", and Open question 1 read "ten `npm run`
   composites across eight verification steps".
2. [Nit][clarity] C-13 can settle itself with evidence it already cites:
   `spec/appendices-reference.md:1726` (T259) asserts both forms in one test —
   G0a passes with "no ruleset — skipped" *and* the convergence metrics record
   `ruleset-free` zero-case dispositions — which is the discriminator between
   "two intentional annotations" and "one drifted token". Say so in the claim.
3. [Nit][design] Step 15 pre-judges the direction ("Correct `:742` to (6)")
   while the two rows it leans on speak to different artifacts (H10 = the
   confidence check, H12 = the G2 replay). The confirmation gate is present, so
   this is a wording risk only: phrase it as "correct it to (6) if the skip is
   evidence rather than a waiver".

## Consistency checks requested

- Candidate count: thirteen, C-1…C-13 at `plan.md:169-181`; done bar item 3 at
  `:208`; step 8 assigns five (`:283`), step 9 five (`:286`), steps 10–12 assign
  C-2, C-9, C-3. All thirteen have a home.
- Surface budget: still 52 — `plan.md:65-67` (18+30+2+2), table total `:136`,
  done bar `:197`.
- Resolutions section: B-1, M-1, M-2, M-3, N-1, N-2 and U-7 match the body;
  B-2's claim matches EV10/C-3/the CI row but not step 12 or Open question 1,
  and the header's "all resolved" (`:3-4`) is the false part.

independent-review FAILED.
