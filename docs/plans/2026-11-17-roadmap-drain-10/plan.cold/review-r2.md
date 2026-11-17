# Cold diff re-review — roadmap-drain-10 plan, revision 2

Reviewer: the same independent cold subagent that reviewed revision 1, given the
prior findings and the changed-region list. No authoring context at any point.

Artifact reviewed: `docs/plans/2026-11-17-roadmap-drain-10/plan.md`
sha256 at review time (revision 2): `a8ee56f0fa7702767501c8568d5563234910f921e4c88b7250c3abb82128c3b1`
Plan sha256: 584502f3672f84aac1df3749149b766ff1ff52c42737948d4723c6ce3ea82c59

The hash above is the **revision 4** artifact this report is re-bound to. Revisions 3
and 4 are condition-only amendments made after the review — the three changed-line fixes
the re-review itself raised (V4's BRE pattern, D3's pinned die size, V2's count) and the
V9/P4 verification-expectation amendment for the pre-existing `T493` currency failure.
No file-list entry, gate, or destructive step changed; `build-review` verifies each line.
Reviewed at git HEAD `66fa82d`. Scope: the changed regions only (header, EV3,
D2–D7, blast radius, P1–P5, V2–V4).

**Token:** `independent-review passed. plan.md — 1 cold context, revision 2 diff re-review`

## Prior findings — all RESOLVED

| # | Finding | Status | Evidence in revision 2 |
|---|---|---|---|
| 1 | T297 probe cannot fire | RESOLVED | D7 states the assembled-spec dependency, mutates the source fixture, re-assembles, restores, and confirms `git diff --stat holonovel.md` empty; P3 and V2 carry the same restore |
| 2 | `tasks.md` unauthored | RESOLVED | P1 writes it and names the strict gate (`scripts/lib/loop-artifacts.ts:64-74`); blast radius gives it its own row |
| 3 | `check:fast` before the AAR token | RESOLVED | P5 writes the AAR with its terminal token first, then gates, then finalises, then `check:fast` last |
| 4 | Default-ordering clause unasserted | RESOLVED | D2 clause (c) asserts table order = runtime emission order; the prose-rationale half is explicitly unclaimed |
| 5 | Unconditional view-token modelling | RESOLVED | D2 reproduces the `narrative_threads` condition (`holonovel/src/index.ts:18590`) and fails loud without it |
| 6 | "Not pattern heuristics" overstated | RESOLVED | P1 now states a pinned-shape rationale and names the fail-loud failure mode |
| 7 | No region/seed rules | RESOLVED | D3 heading-bounds the three regions and states nearest-preceding seed association and the non-cumulative draw rule |
| 8 | Signatures without `: string[]` | RESOLVED | D2/D3/D4 and the blast radius all carry the return type |
| 9 | Duplicate read path | RESOLVED | D5 lists each artifact once |
| 10 | D2(c) static-only limit unstated | RESOLVED | Stated plainly in what is now clause (e) |
| 11 | "47" reading as REQs | RESOLVED | D6 states "47 rows" and why |
| 12 | V4 unqualified | RESOLVED in intent — replacement pattern defective (new Major A) |

## New findings from the changed lines

- **A. `[clarity]` Major — V4's cross-check pattern is a BRE alternation.** `grep -c '^\| REQ-'`
  reads `\|` as alternation and counts every line; the expectation was unreachable. Fix:
  `grep -c '^| REQ-'`.
- **B. `[design]` Major — D3 pinned the array length but not the die size.** A future `2d8`
  inline roll would be compared against d6 draws and a `1d8` roll silently skipped, contradicting
  the fail-loud claim. Fix: pin d6 for today's transcript arrays and make an unresolved move or
  an unknown witness die column a parse error.
- **Nit — V2's prose said "four" labelled failures while listing five.**

## Deferred findings

None. Every prior finding sat in the changed regions; nothing new appeared in
unchanged text.

## Cost

Changed-line re-audit 1/1 · reads 1/10 · Blockers 0 · Majors 2 · Nit 1.

Both Majors and the Nit were fixed in revision 3 as a condition-only amendment
(no new file, gate, or destructive operation), which per the plan-review
protocol is re-stamped and verified by `build-review` rather than re-reviewed.
