# After-action report — U8: repo governance and content assets

Session 2026-11-15 · increment `docs/plans/2026-11-15-unscoped-u8/` · one commit.
Plan gate: `plan-review passed.` at standard depth, fresh cold pass plus a
targeted verification pass (plan sha256 `dc17da65…4215d`).

## What was supposed to happen

Review the repo governance docs and the vendored/content assets against live
artifacts and gates — 60 rows — repair only what is bounded prose or a
licence-content gap, schedule anything that needs code or a gate change,
disposition every finding, and close the roadmap's sweep section because U8 is
the last chunk.

## What happened

- 60 rows settled: 50 PASS, 10 findings. Six repaired (1 P0, 3 P1, 2 P2), four
  recorded and closed as P3. None left `UNSET`.
- The six repairs: the README design contract's Node prerequisite (24→22, the
  body and server package were already right); the server README tool count
  (36→37); the AGENTS layer-map appendix range (D–S→D–M, O–S); the vendored IF
  Craft corpus cell (a 59-document claim against two vendored files); the
  container image's missing `LICENSE.md`; and the P2 chunk's dangling
  scheduled pointer, replaced by a live roadmap section for its residual
  zero-padded harness ID.
- The sweep section left `ROADMAP.md`; the worklist reads program complete; a
  new P2 section carries the one genuinely open item U8 surfaced.
- All gates green: `check:fast` 45/0 before and after the writes,
  `check-registers:strict`, `check-roadmap` (5 sections), `check-vendor-manifest`
  25/25, `lint`, `validate:sdd` 0 errors.

## What went right

- The plan's evidence table did the heavy lifting. EV8 (36 vs 37) and EV19 (the
  59-document claim) were confirmed within minutes because the plan had already
  located the predicates.
- Splitting the ten findings by whether a repair is bounded prose or behaviour
  kept the session to prose: no server, gate, or generated artifact changed.
- The preflight target list made the blast radius verifiable; `git status`
  matched it exactly.

## What went wrong

- The decision on the README Node line took two passes: the body (22+) was
  right and the DESIGN comment (24+) was stale, but the first instinct was to
  change the body. The evidence that settled it was the server package's own
  engine floor.
- The worklist counts were written once as "5 fixed, 1 scheduled" before the
  review totals were tallied; the row was corrected to 6 fixed / 4 closed. The
  AAR records it because a count written before the tally is how a worklist
  drifts.

## Findings dispositioned

Every row is in `review.md`; every finding is in `spec/audit/review-register.md`
under the 2026-11-15 U8 heading. U8-F1…F6 are `Resolved`; U8-F7, U8-F8, U8-F9,
and U8-F11 are `Closed-P3` with their predicates. The one open item — the
zero-padded `T056` in a harness comment — is scheduled on `ROADMAP.md` §
*Harness test-ID label hygiene (P2)*; it is not a U8 finding and does not hold
this increment open.

## Done bar verdict

1. `review.md` carries 60 rows, `R1`–`R60`, in the declared shape, none `UNSET`
   — met (V3).
2. Every `DEFECT` has a dated, dispositioned register bullet; no
   `builder-side`/`external-skill` row exists — met (V5, V11, V11b).
3. The sweep section is removed, `worklist.md` reads `reviewed 2026-11-15` with
   counts from `review.md`, and the program-status line says complete — met
   (V6, V6b).
4. `check:fast` is green at the close with the baseline's count, and every
   verification row passes, recorded un-piped — met (V1–V13).
5. This AAR states the verdict against the bar and ends `LOOP PAUSED` — met.
6. One commit from `session:close` — met (one commit, tree clean after).

## Cost

Two cold passes plus one verification pass and a self pass on the plan; 60
review rows; one mid-session gate run; one commit.

LOOP PAUSED
