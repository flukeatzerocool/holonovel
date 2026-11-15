# Cold review — gate-retirement sweep plan (v1)

Reviewer: `review` subagent, cold (no authoring context, no prior review output)
Plan artifact: `docs/plans/2026-11-15-gate-retirement-sweep/plan.md`
Plan sha256 (v1): `752070096d3ad465d5c59689216a241975cc97eb88ad7ab9716075c9a489bdeb`
Depth: standard · Repo: `/home/fluke/Holonovel`

Verdict: `independent-review FAILED: 1 blockers` — 1 Blocker, 6 Majors, 6 Nits.
Stages run: 4 of 5 (1, 2, 3, 5; stage 4 not triggered) · 22 of 40 read/grep/glob calls.

## Blocker

B1 [clarity] "Candidate" has two mutually exclusive definitions; V2 and V4 cannot both pass,
and Scope 2 prints nothing in the expected end state (Scope 1 at plan.md:53-55 vs Scope 2
at :57-58, Scope 4 at :60-61, D4 at :120-121, V2 at :203, V4 at :205, V5 at :206).
Suggested fix: three nouns — rows / candidates / writable.

## Majors

M1 [design] The saving formulas depend on per-tier medians the row model cannot produce
(`gate-cost-report.ts:73-99` groups by gate only; `TimingRecord` at `:32-37` omits `mode`
although `run-gates.ts:187` writes it); no outline step names the data-model change.
M2 [clarity] V2 requires a `reason` field the implementation never adds (only `cover` and
`savingMs` are added).
M3 [clarity] The cover-resolution set is defined twice, incompatibly (Scope 1 and step 1 admit
"a gated harness command"; D5 and `resolveCovers` resolve against manifest gates only).
M4 [clarity] The zero-saving claim is scoped to fast mode in the Why but generalized to all
retirement, contradicting D4's non-zero `fullSavingMs`.
M5 [design] The AAR may be permitted to end `LOOP OPEN`, which makes `session:close`
impossible (`docs/plans/README.md:52-54, :66`).
M6 [design] V10's replay is not executable as written: a lone copy of the script fails on its
`import.meta.dirname`-relative `./lib/*` imports and timing path.

## Nits

N1 Stale citation: `gate-cost-report.ts:3-8` says 26 → 46, not 49; refresh the header count
with the edit.
N2 Scope 7 / blast radius say "one finding row"; step 6 says a `## Resolved` section — the
file's convention is the section.
N3 Register entries in this class carry finding IDs; the proposed entry has none.
N4 The new module's proposed role "build-tool-side library" is not the enforced vocabulary;
use `[build tool]`.
N5 `AGENTS.md:95` is the layer-map line, not a role sentence; the conditional edit is likely
unnecessary.
N6 The 0.25 s figure is the 12.53 − 12.32 runner-overhead gap, not a per-gate measurement —
label it an upper bound.

## Claims verified against the repository

Every `file:line` predicate the reviewer checked held exactly except N1: workflow-cadence
:50-52, gate-cost-report :96 / :113-119 / :142-168, gate-manifest :22-23 / :341-361 (warning
at :353) / :368-375, run-gates :190-215 / :217-224 (no pool) / :232-245, weekly.ts:39, six
`playability` rows with no manifest entry, absent `gate-retirement.json`, `ROADMAP.md:15-25`,
`review-register.md:3060`, `test-script-tooling.ts:20`, and blast-radius completeness (9/9
named paths).

## Unknowns recorded

- Project `AGENTS.md` and user instructions were injected into the reviewer context.
- Stages ran as sequential lenses in one dispatch; no per-stage context isolation.
- Shell was denied, so the reviewer could not recompute the plan hash, the live timings, or
  the 36-candidate count; those rest on the evidence sidecar and untracked telemetry.
- All 36 candidates being manifest gates is plausible but unproven by the reviewer.
- `check-registers` tolerance for a `Resolved` entry without a finding ID was unknown.
