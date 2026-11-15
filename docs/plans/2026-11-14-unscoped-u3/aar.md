# AAR — U3 runtime conventions and the engine-contract remainder

AAR: SUCCESS — 28 verdict rows recorded, one P0 fixed atomically, four P1s
scheduled; the state-model fingerprint regenerated through `build-order`.

## 1. What was supposed to happen

Close chunk U3 of the unscoped-surface review program (roadmap item
`ROADMAP.md:15-32`): record a verdict for every unit of `spec/04-runtime.md` §7,
`docs/engine-contract.md` §1/§7–§10 plus the appendix, and the eight named
adapter/server modules; disposition every finding; advance the program record.
Done bar: 28 cited rows, 13 candidates resolved, zero unfixed P0, worklist and
roadmap advanced, gates green un-piped after `aar.md`, `session:close`
committing, no push.

The plan was reviewed at `standard` depth with a five-stage cold pass and
stamped `passed` (fresh, 5/5), condition C-1 tracked.

## 2. What happened

Phases 1–4 ran in order. Evidence by step:

| Step | Evidence |
|---|---|
| T1–T4 (read predicates, gates, fingerprint boundary, engine/library) | `scripts/validate.ts:1049-1206,1273-1328`; `gate-manifest.ts:159-162,177-265`; `contract-fingerprint.ts:37-43`; `assemble.ts:48-60`; `engine.ts` (19 lines); `package.json:34-52` |
| T5–T11 (28 verdicts, 13 candidates) | `review.md`: 28 rows, verdicts `holds`/`finding`/`builder-side` |
| T12–T13 (triage, prose fix) | `npm run assemble` exit 0; `npm run validate:sdd` exit 0, `0 error(s), 296 warning(s)` (baseline 296) |
| T14 (C-1 atomic seven-site fix) | P1–P59 → P1–P61 at `spec/04-runtime.md:648`, `spec/01a-constitution.md:116`, `spec/02-requirements.md:3811,3816`, `spec/appendices-reference.md:1880,1881,1894` |
| T15 (register + roadmap) | `npm run check-registers -- --strict` exit 0; `npm run check-roadmap` exit 0 (7 sections) |
| T16–T17 (worklist, changelog) | `worklist.md:93` reviewed, boundary amended; `CHANGELOG.md` dated entry |
| T18–T19 (AAR, gates) | `build-order` exit 0; `check:fast` 41/41 PASS; see the gate table below |
| T20 (close) | `npm run session:close` |

**Loop closure.** plan-review passed → build-review passed → execution → gate
verification. The finding chain is complete: F-U3-5 fixed; F-U3-1…4 scheduled
on `ROADMAP.md` and in the register's `Scheduled-roadmap` section.

**Gate outcomes.**

| Gate | Token / result | Verdict |
|---|---|---|
| plan-review | `plan-review passed.` (fresh, 5/5) | passed |
| independent-review | `independent-review passed.` (`plan.cold/report.md`) | passed |
| drift-report | n/a — the review itself is the drift pass | n/a |
| build-review | `build-review passed.` | passed |
| spec-review | n/a (not a spec-authoring increment) | n/a |
| proofread | `validate:sdd` 0 errors, 296 warnings | passed |

## 3. What went right

- The cold pass changed the plan materially before execution: it caught a
  non-existent predicate symbol (`checkCouplingDerivation`), a vacuous staged
  gate, a P2 class with no terminal disposition, and a row split that summed to
  32. None of those reached the build.
- C-1's fix was atomic and cheap: seven one-token edits, no gate regression.
- The predicate work paid for itself. C-2 (101 declared variables vs 97 read)
  resolved as `holds` only because `holonovel/DECISIONS.md:2777-2779` disposes
  the three spec-only names; the plan's probe pointed straight at it.

## 4. What went wrong

- The plan's first two drafts carried wrong counts (workload arithmetic, then
  the "3 Majors + 10 Nits" tally). Both were caught by later stages, but each
  cost a review round. A count written in the header should be derived from the
  ledger in the same edit.
- The cold pass first ran as a single-context "supplementary" read because the
  dispatched reviewer could not spawn children; the five-stage protocol was then
  run from the parent. The sequencing cost one extra round and produced a
  non-stampable intermediate artifact.
- This session's Stage 5 readiness overran its read budget (44/40) — the overrun
  was what surfaced `test:pipeline` as a missing full-only gate.

## 5. Session performance

- **Outcome vs done bar.** Bar met except T20, which this AAR precedes by
  design. 28 rows, 13 candidates, one P0 fixed, four P1s scheduled.
- **Scope adherence.** No code edits; no tool or schema change. The only
  generated artifact touched is the state-model fingerprint, forced by the §7.7
  text edit.
- **Verification quality.** `validate:sdd` was re-run with the same command as
  the baseline (296 warnings, unchanged). The coupling predicate reports
  61/61 rules covered after the fix. `check-registers --strict` and
  `check-roadmap` both exit 0.
- **Rework.** The prose fix ran once; no file was edited twice except the plan
  itself across review rounds.
- **Cost.** Roughly 40 shell/read calls for the review, 8 subagent dispatches
  for the cold pass (Stages 1, 2, 3×3, 4, 5, 5-re-audit).
- **User intervention.** One instruction: "execute plan". No correction.

## 6. Findings

- **Project findings.** Four P1s, each with a demonstrated predicate, are
  dispositioned in `spec/audit/review-register.md` under
  `Scheduled-roadmap` and scheduled in `ROADMAP.md` § *Identifier-derivation
  conformance (P1)* and § *§7.3a documentation and P60 vocabulary (P1)*. No
  project action item remains open.
- **Skill findings.** None raised: every skill that should have fired did
  (programming-orchestrator → plan-review → independent-review → build-review →
  after-action-report), and none fired unexpectedly.

## 7. Invocation audit

| Expected | Loaded | Verdict |
|---|---|---|
| `programming-orchestrator` | yes | routed |
| `plan-review` | yes | routed |
| `independent-review` | yes | routed |
| `build-review` | yes | routed |
| `after-action-report` | yes | routed |
| `changelog-before-commit` | no | n/a — `session:close` stages and commits; the entry is written manually per the plan |

Invocation: 5 expected, 5 loaded, 0 misses.

## Gate results (measured)

| Gate | Command | Result |
|---|---|---|
| assemble | `npm run assemble` | exit 0 |
| registers | `npm run check-registers -- --strict` | exit 0, structurally clean |
| roadmap | `npm run check-roadmap` | exit 0, 7 sections |
| build-order | `npm run build-order` | exit 0 (after one starter-freshness fix) |
| fingerprint | `npm run check-fingerprint-sync` | "Fingerprints in sync." |
| guarded co-change | `npm run check-guarded-rule-change` | exit 0, "no unacknowledged rule/validator co-change" |
| fast suite | `npm run check:fast` | 41 passed, 0 failed, `check:fast: PASS` |

**Deviation (recorded, not improvised).** The first `build-order` run failed
`check-starter-freshness`: the §7.7 edit changed the data-format fingerprint, and
the bundled starter Novel records it. `npm --prefix holonovel run
build:starter-novel` regenerated `holonovel/content/torre-nosferatu.json`
(315,556 bytes) — the regeneration sequence AGENTS.md prescribes. `assemble`
also refreshed `spec/build-phase-map.md`'s content hash, which covers every spec
source. Both files join the blast radius as generated artifacts; the fingerprint
regenerated to `data_format 2b86de0c…`.

LOOP PAUSED
