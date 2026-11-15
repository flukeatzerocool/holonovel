# Cold review — gate-retirement sweep plan

Two dispatches against the artifact. The first is a full cold pass (4 of 5 stages, one Blocker);
the second is the single permitted diff re-review, which passed. The plan's final text (v3)
carries the re-review's own resolutions.

---

## Dispatch 1 — full cold pass (v1 artifact, sha256 `7520700…`)

Verdict: `independent-review FAILED: 1 blockers` — 1 Blocker, 6 Majors, 6 Nits.
Stages run: 4 of 5 (1, 2, 3, 5; stage 4 not triggered) · 22 of 40 read/grep/glob calls.

B1 "Candidate" had two mutually exclusive definitions, so V2 and V4 could not both pass and
Scope 2 printed nothing in the expected end state.
M1 The saving formulas depended on per-tier medians the row model could not produce
(`TimingRecord` omitted `mode` although the runner writes it).
M2 V2 required a `reason` field no step added.
M3 The cover-resolution set was defined twice, incompatibly (harness command vs manifest gate).
M4 The zero-saving claim was scoped to fast mode in the Why but generalized to all retirement.
M5 The AAR could end `LOOP OPEN`, which makes `session:close` impossible.
M6 V10's replay was not executable: a lone script copy fails on its relative imports and paths.
N1 stale 26 → 46 header citation; N2 "finding row" vs `## Resolved` section; N3 no finding ID;
N4 role token not in the enforced vocabulary; N5 `AGENTS.md:95` is a layer-map line, not a role
sentence; N6 the 0.25 s figure is a runner-overhead gap, not a per-gate measurement.

Verified against the repository: every `file:line` predicate checked held except N1 —
`workflow-cadence.md:50-52`, `gate-cost-report.ts:96/:113-119/:142-168`, `gate-manifest.ts:22-23/
:341-361/:368-375`, `run-gates.ts:190-215/:217-224/:232-245`, `weekly.ts:39`, six `playability`
rows with no manifest entry, absent `gate-retirement.json`, `ROADMAP.md:15-25`,
`review-register.md:3060`, `test-script-tooling.ts:20`, blast-radius completeness (9/9).

Unknowns: injected project/user instructions weakened context isolation; stages ran as
sequential lenses in one dispatch; shell was denied so the hash, live timings, and 36-candidate
count could not be reproduced; "all 36 candidates are manifest gates" was plausible but
unproven; `check-registers` tolerance for a `Resolved` entry without a finding ID was unknown.

---

## Dispatch 2 — diff re-review (v2 artifact, sha256 `86ef380…`)

Verdict: `independent-review passed.` · diff-review reads: 2 of 10.

Per-finding status: B1, M1–M6, N1–N6 all **RESOLVED** — each by text that produces the asserted
behaviour, not merely by renaming. Specifically: the vocabulary section fixes row / candidate /
writable and the `--apply` skip branch now fires 36 times at HEAD; D9 names the
`TimingRecord.mode` + per-tier median change; `reason` is added to the table and `--json`;
manifest-gates-only cover is consistent in the type comment, Scope 1, step 1, and D5; the Why
separates fast-mode zero from full-mode seconds; step 7, T7, and Done bar 6 require
`LOOP PAUSED`; V10 uses a `git worktree`.

New findings introduced by v2 (all applied in v3):
- **Major** — V10 no longer discriminated the change (both outputs agreed on 36 candidates).
  Now a decision-path differential: `--apply` in the `675daeb` worktree writes 36 advisory
  names, the main tree writes nothing.
- **Minor** — the determinism claim backed the wrong half of V2 (36 is telemetry-derived;
  only `writable: []` is telemetry-independent).
- **Nits** — `writable` as a fifth `--json` field; EV13 mis-cited for the header refresh;
  the replay worktree needs dependencies; the eighth test case's target unnamed; the cold
  artifact living in `/tmp` is not durable (moved to `plan.cold/`).

Deferred: the Stage 2 gap on printed-table geometry and the untracked-telemetry Unknowns above;
neither is contradicted by v3.
