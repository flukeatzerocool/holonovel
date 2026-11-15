# Cold review v3 — targeted check (U4 plan)

Reviewer: review (cold subagent, deepseek-v4.1-flash) · fresh context, no
authoring history beyond the two prior artifacts named below
Plan: docs/plans/2026-11-15-unscoped-u4/plan.md (v3 → v4 during this check)
Consumes: `report-v1.md` (sha256 39562f7f…) and `report-v2.md` by reference only;
neither was re-reviewed.
Scope: four author-claimed fixes. Budget 6 reads; used 5, then 3 on the
count-confirmation round.

## Checks requested

1. **Residual count contradiction (v2 Blocker)** — step 12 and Open question 1
   still carried the old 12-step / nine-composite wording.
2. **C-13 discriminator nit** — the claim should record that T259 asserts both
   spellings in one test.
3. **Step 15 direction nit** — the fix must be conditional on the phase-2 read.
4. **Amendment consistency** — thirteen candidates, 52 rows, header note.

## Round 1 (v3)

- Claim 2 RESOLVED (`plan.md:185`).
- Claim 3 RESOLVED (`plan.md:327-336`, conditional both ways; §9 and H rows
  read-only).
- Claim 4 RESOLVED (13 candidates at `:212`, C-table `:173-185`; 52 rows at
  `:140`, `:197`, `:201`, `:239`, `:383`; header `:3-5`).
- Claim 1 OPEN as a granularity error: ten `npm run` composites were attributed
  to eight verification steps, but `test:starter-novel` shares the manifest-gated
  starter step. Nit. Also: `plan.md:30` claimed an empty grep whose own pattern
  sat on that line. Nit.
- Verdict: `independent-review FAILED.`

## Round 2 (v4)

The two Nits were fixed (nine-step attribution; empty-grep claim removed). The
reviewer then found the replacement command total off by one (14 vs 15), and
that the header claimed all three sites carried the number while step 12 carried
none. Verdict: `independent-review FAILED.`

## Round 3 — closure

The author replaced the asserted count with a direct enumeration of `run:` lines
(`.github/workflows/ci.yml:18-47`, splitting each `run:` on `&&`): **16 commands**
in the nine verification steps, exactly one of them the manifest gate
`check:starter-freshness`, so **15 outside the manifest**, of which **10 are
`npm run` composites**. Four sites carry that arithmetic (header B-2 bullet
`:31-34`, C-3 `:179`, step 12 `:307-310`, Open question 1 `:446-448`) and EV10
(`:102`) enumerates the same 15.

Reviewer's confirmation, verbatim: "**Resolved.** All four sites now carry the
same arithmetic, and it matches the tree. … **Remaining contradiction:** none."

**independent-review passed.**

## Residual notes carried into execution

- Narrative only: the header still says the CI count was "wrong twice"; it is now
  the third correction. No count is asserted there.
- Cosmetic: the header writes "10" where the body writes "ten".
- Budget overrun disclosed by the reviewer: 3 reads on the confirmation round
  against a stated 2, because step 12 and Open question 1 sit 140 lines apart.

## Read budget

Cold five-stage pass 36/40 · diff re-review 3/10 · targeted check 5+3 reads.
