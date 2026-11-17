# Cold review — roadmap-drain-10 plan, revision 1

Reviewer: independent cold subagent (no authoring context), standard depth.
Artifact reviewed: `docs/plans/2026-11-17-roadmap-drain-10/plan.md`
sha256: `049833bdb742cd35d429916701dda7cf9b9827582970eee791cdfedcde87d0c2`
Reviewed at git HEAD `66fa82d`.

**Isolation caveat.** This dispatch forbade nesting, so the five
`independent-review` stages ran as five sequential passes inside one cold
context rather than five fresh subagent contexts. Stage-to-stage isolation was
therefore not achieved. The verdict does not depend on it — the findings rest
on file evidence.

**Token:** `independent-review FAILED. plan.md — 3 blockers`

## Blockers (3)

1. `[design]` The T297 negative probe cannot fire as written. D7 probed T297 by
   editing `spec/appendices-fixtures.md`, but `checkFixtureWitness(text)` reads
   the **assembled** spec (`scripts/lib/parse-spec.ts:9`), so the source edit
   never reaches the check and V2 would record only two labelled failures.
2. `[design]` `tasks.md` is in the blast radius but no phase authors it;
   `session:close` is strict about its presence
   (`scripts/lib/loop-artifacts.ts:64-74`).
3. `[clarity]` P5 orders `check:fast` (V3) before the AAR terminal token exists;
   an existing `aar.md` without `LOOP PAUSED`/`LOOP OPEN` is an unconditional
   error (`scripts/lib/loop-artifacts.ts:79-84`).

## Majors (5)

4. `[design]` REQ-082b's "default ordering" clause has no assertion and the
   unclaimed-clause list omits it.
5. `[design]` D2(b) models the runtime token set as unconditional concatenation;
   `holonovel/src/index.ts:18586-18595` inserts the view token only when
   `narrative_threads` is present.
6. `[design]` The three checks are called "not pattern heuristics" while all
   three are regex/table parsers with no stated escape for future variation;
   D2(a) pins the layer cell to two values and D3's die predicate is unstated.
7. `[clarity]` D3 does not state how fixture regions are delimited or how a
   bracketed array binds to its seed.
8. `[clarity]` The three new function signatures omit the `: string[]` return
   type the label collector requires (`scripts/lib/req-checks.ts:812-823`).

## Nits (4)

9. `[clarity]` D5 lists `holonovel/DECISIONS.md` twice.
10. `[clarity]` D2(c) asserts source text, not enumeration behaviour; state the
    limitation.
11. `[clarity]` The ROADMAP restatement reads as coverage rather than row count.
12. `[clarity]` V4's `wc -l == 49` is correct but unqualified.

## Assumption answers

- Row-closure honesty: T297 genuine (its final clause is the validate flag);
  T106 genuine but two of six clauses; T205 **not** fully honest at revision 1 —
  the default-ordering clause was silently unasserted (finding 4).
- Predicate shapes: DECISIONS table `:270-311` verified (40 rows, layers
  `critical|supplementary`); B.4 two rows with d6+d20 columns verified; N.4 four
  d20 rows verified; B.3 die forms and seeds verified at `:204`, `:258`, `:264`,
  with `rolled 2` at `:218` correctly excluded.
- Placement compatibility holds, subject to finding 8.
- Numbers 50→47 and 52→49 internally consistent; each T-ID cited by exactly one
  REQ (`spec/02-requirements.md:91`, `:890`, `:2665`).
- Blast radius: one omission (`tasks.md`, finding 2). `test:spec-tooling.ts:455-469`
  writes the real root version into its scratch `--root`, so the new CalVer
  assertion does not break `test:spec-tooling`.
- The four unscoped roadmap items: none triggers, verified against
  `ROADMAP.md:15-81`.

## Unknowns recorded by the reviewer

`BRIEFING_SECTIONS` literal count and the 80/80 witness arithmetic were not
executable in that dispatch; `npm run status` readings were out of allowlist;
only the first corpus row was inspected; `check-registers` is report-only unless
`--strict`; the isolation caveat above.

## Cost

Stages 5/5 (one cold context, see caveat) · reads 29/40 · Blockers 3 ·
Majors 5 · Nits 4.
