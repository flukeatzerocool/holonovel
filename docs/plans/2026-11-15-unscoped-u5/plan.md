# Plan — Roadmap closure: U5 now, U6–U8 and the fix-up re-measurement scheduled

Status: draft v2 (cold pass 2 Blockers, 6 Majors, 7 Nits — every Blocker and
Major resolved below) · Kind: planned · Depth: standard
Increment target: `docs/plans/2026-11-15-unscoped-u5/` (created at execution start;
this draft lives in the untracked `plans/` working area until approved)
Rollback cost: 1 (one revert: `plan.md`, `tasks.md`, `review.md`, `aar.md`, the
register rows, the `worklist.md` status and exit-evidence lines, the bounded
`spec/` prose fixes, `holonovel.md` + `holonovel/holonovel.md`, `CHANGELOG.md`)
Evidence class: repo and tool-output (EV2, EV3, EV12 are `tool-output`; every
other premise is a `file:line` read at HEAD `6f950d3` this session)
Trust boundary: every premise is read from the working tree; no web, user, or
fetched content enters the plan.
Review independence: fresh — cold pass recorded in `plan.cold/report.md`, whose
hash the stamp records.

## Resolutions (cold pass v1 → v2)

- **B-1 [Blocker] — the done bar forbade the ROADMAP edit the policy requires.**
  Done-bar item 5 now forbids only the removal or renaming of an existing
  section, states the admission rule a new section must satisfy (1–3 bullets plus
  a `**Trigger:**`, `scripts/check-roadmap.ts:163-181`), and allows the file to
  hold three sections at close. The blast-radius row and the verification table
  say the same thing.
- **B-2 [Blocker] — the row budget under-covered §9 and §10.** Two units added:
  §9's tail paragraph (`spec/06-artifacts.md:64-68`) and §10's binding statement
  (`:1-9`) plus its `DISPUTED` rule (`:121-127`), which also splits the verifier
  prompt and report format into one unit each. The budget is now 46 rows and
  states that every line of both sections is assigned.
- **M-1 [Major] — "four exit clauses" over three.** Corrected at both sites to
  three, anchored `worklist.md:250-252`.
- **M-2 [Major] — the row-count commands could not pass.** `review.md` now numbers
  rows `R1`–`R46`; the check is `grep -c '^| R[0-9]'` = 46, which header and
  separator lines cannot inflate.
- **M-3 [Major] — the blast radius omitted ten row subjects.** It now separates
  predicate reads from the twelve code/doc row subjects, states that a code
  defect needing behaviour change is scheduled rather than patched, and keeps a
  comment-only correction in the blast radius as a recorded amendment.
- **M-4 [Major] — §10's external-skill clause had no class or anchor form.** New
  terminal verdict `external-skill`, which records the skill's absolute path plus
  the in-repo carrier (`docs/plans/*/review.md`, `aar.md`, the register row).
- **M-5 [Major] — Phase 4's asset rows were not derivable.** The nine asset units
  are now enumerated (world model 4, content 2, docs 3) and the chunk bar reads
  25.
- **M-6 [Major] — the `check-registry` → `check-registers` change was silent.** A
  new § *Amendments to the program record* records it and the appendix-anchor
  correction as U5 findings, with `tasks.md` T4.7 landing them.
- **N-1 … N-7 [Nits] — all fixed.** The re-measurement trigger anchor is
  `ROADMAP.md:45-46`; `check-traceability`'s predicate is described accurately;
  the done bar uses the literal `**Done bar:**` marker the loop-artifact gate
  matches; `LOOP PAUSED` is required with `LOOP OPEN` as a stop state; the
  fingerprint anchors read `:27,37-43`; Phase 2's corrected appendix anchors are
  recorded in the amendments section; and `plan.md` and `tasks.md` share one
  anchor per row.

- **R-1 [Major] — program totals still quoted the pre-fix count.** Corrected to
  118 (46 + 23 + 24 + 25) at both restatements.
- **R-2 [Major] — two budget-row files appeared in both the blast radius and the
  predicate list.** `docs/workflow-cadence.md`, `docs/publish-pipeline.md`, and
  `docs/plans/README.md` are now blast-radius prose fixes only.
- **R-3 [Major] — "twelve code/doc rows" enumerated nine.** The nine code rows and
  the three doc rows are now named as separate sets that sum to twelve.
- **R-4 [Major] — §10's verifier prompt has ten steps, not nine.** The budget row
  and the evidence row now name steps 1–10 and step 10's REQ-274 confidence
  threshold.
- **R-5 … R-8 [Nits] — fixed.** The report format is eight fields; the coverage
  claim reads "every content line" with the unit boundaries stated; §10's binding
  row extends through the "The operator:" lead-in (`:1-11`); Phase 2's fixture
  units are enumerated (four files plus one unit spanning the two `testdata`
  directories) and the contested `testdata` git status is pre-identified as a U6
  finding; Phase 3's bar reads nine catalog gates.

## Questions

1. **What is being asked?** "Draft one plan to address all remaining roadmap
   items." `ROADMAP.md` holds exactly two open sections: the
   § *Unscoped-surface review sweep (P2)* (`ROADMAP.md:15-34`), whose chunks U1–U4
   are `Resolved` and whose next session is U5 (`:30-31`), and the
   § *Loop-gate fix-up rate re-measurement (P2)* (`:36-46`), which is gated on a
   date or a commit count (`:45-46`).
2. **Can both close in one session?** No, and the plan says so explicitly. The
   sweep is four sessions of review (U5–U8) with 118 verdict rows between them;
   the re-measurement cannot run before its trigger. What one plan can do is
   sequence all five closures, give each a session-achievable bar, and make the
   re-measurement a precondition check in every session so it closes on the first
   session where the trigger holds.
3. **Which chunk executes first?** U5. `ROADMAP.md:30` names it, and the
   program's chunk table lists it **scheduled** (`worklist.md:95`).
4. **What makes U5 done?** Its three exit clauses (`worklist.md:250-252`), one
   verdict row per listed unit, every finding dispositioned, gates green.
5. **What does "address" mean for the re-measurement?** Record the trigger
   evaluation, and — only when the window is full — record the number. The item's
   own trigger (`ROADMAP.md:45-46`) permits nothing else.

## Baseline at HEAD (this session)

| # | Evidence | Command / source | Trust |
|---|---|---|---|
| EV1 | Tree clean on `main`, 104 unpushed commits, version `2026.11.15`, 2 open roadmap sections | `git status --porcelain`; `npm run status` | tool-output |
| EV2 | Fast gate green: **45 passed, 0 failed**, trailing `check:fast: PASS` | `npm run check:fast` (un-piped) | tool-output |
| EV3 | The two roadmap sections and their triggers | `ROADMAP.md:15-34,36-46` | repo |
| EV4 | The program's chunk table, status rows, and per-chunk exit evidence | `docs/plans/2026-11-10-unscoped-surface-review/worklist.md:34-36,59-98,238-313` | repo |
| EV5 | U4's exit-evidence amendment form, the shape U5's `worklist.md` update must follow | `worklist.md:204-237` | repo |
| EV6 | §9 is 68 lines: lead-in, then the handoff verification table `H1`–`H18` (`:46-63`) | `wc -l spec/06-artifacts.md`; `sed -n` | repo |
| EV7 | §10 is 128 lines: a 5-step operator procedure (`:12-18`), a verifier prompt with steps 1–10 (`:37-105`), and an eight-field report format (`:111-118`) | `wc -l spec/07-independent.md`; `sed -n` | repo |
| EV8 | Appendix V is 293 lines with ten runbooks `V.1`–`V.10` (`:13,51,70,85,128,143,158,194,228,260`) | `grep -n '^### V\.'` | repo |
| EV9 | The publication surface: `push-pipeline.sh` 86, `publish/preflight.ts` 134, `publish/steps.ts` 682, `publish/run.ts` 227, `weekly.ts` 101, `loop-audit.ts` 412, `session-close.ts` 374, `publish.yml` 207, `workflow-cadence.md` 86, `publish-pipeline.md` 62, `loop-audit.md` 74, `docs/plans/README.md` 77 | `wc -l` on each | repo |
| EV10 | §9, §10, §11, and Appendix V are **not** fingerprint-bearing; Appendix Q alone is, via `DATA_SECTIONS` | `scripts/lib/contract-fingerprint.ts:27,37-43` | repo |
| EV11 | The register's four disposition headings: `Resolved` (`:12`), `Scheduled-roadmap` (`:2787`), `Closed-P3` (`:2810`), `Deferred-by-user` (`:3244`); U4's row is `### 2026-11-15 U4 verification workflows` (`:2745`) | `grep -n '^## ' spec/audit/review-register.md` | repo |
| EV12 | U6, U7, U8 surface sizes: §11 408 lines (`11.1`–`11.4`), fixtures appendices B/C/N/W/X/Y/Z 1208 lines, reference appendices D–T 3,167 lines with Appendix E alone 1,335 and F 790, Appendix U 43 lines; artifacts `tool-definitions.json` 124,422 B, `tool-surface-registry.json` 105,658 B, `tool-routing.json` 4,397 B, `tool-disambiguation.json` 4,548 B, `server.json` 656 B, `glama.json` 98 B; assets `narrative_world_model/` 124 K, `content/` 456 K, `docs/upstream/` 8 K | `wc -l`; `ls -la`; `du -sh` | repo |
| EV13 | The re-measurement's window is empty: **0** commits after `2026-11-15T00:00`, so the "next 26" clause is unmet; the date clause (2026-11-28) is also unmet today | `git log --since=2026-11-15 --format=%H \| wc -l` | tool-output |
| EV14 | `scripts/loop-audit.ts` computes commit, session, push, drift, and repeat-subject metrics and has no fix-up/pair metric (no `pair`, `fix-up`, or 15-minute logic) | `grep -n 'fix-up\|pair\|minute' scripts/loop-audit.ts` (no match) | repo |

## Program shape

One program, five closures, one session each. The plan is the program document;
each session writes its own increment under `docs/plans/` with its own
`plan.md`/`tasks.md`/`aar.md` (the loop-artifact contract), and this document is
the standing schedule they all cite.

| Phase | Session | Closes | Bar (session-achievable) |
|---|---|---|---|
| 1 — U5 | this one | the sweep's fifth chunk | 46 verdict rows + dispositions + gates green |
| 2 — U6 | next | the sweep's sixth chunk | 23 verdict rows + dispositions + gates green |
| 3 — U7 | next | the sweep's seventh chunk | 24 verdict rows + dispositions + gates green |
| 4 — U8 | next | the sweep's final chunk; removes the roadmap section | 25 verdict rows + dispositions + gates green |
| 5 — RM | the first session at or after the trigger | the re-measurement | trigger evaluated, number recorded, item closed |

**Program done bar.** `ROADMAP.md` holds zero scheduled sections; the
`worklist.md` chunk table shows U5–U8 in exit-evidence form; the register carries
a dated disposition for every finding; `check-roadmap` passes with the sweep
section removed.

**Why the program and not one session.** The four chunk bars total 118 rows
(46 + 23 + 24 + 25) plus fixes; U4 alone was 52 rows and one full session. A
single-session bar over 118 rows would be a bar no session can meet, which the
loop contract forbids (`docs/plans/README.md:31-33`).

## Phase 0 — precondition (every session)

1. **Re-measurement trigger.** Run
   `git log --since=2026-11-14T23:59:59 --format='%H|%cI' --name-only` and count
   commits. If fewer than 26, record the count and the date (EV13 today: 0, so
   the item stays open) and continue with the sweep chunk. If 26 or more, run
   Phase 5 before the chunk and let the AAR carry both closures.
2. **Baseline.** `npm run status` and un-piped `npm run check:fast`. A red
   baseline is fixed first as its own commit, never folded into the chunk
   (`AGENTS.md` § Agent Operating Routine).
3. **Row budget re-measure.** Re-derive the chunk's row table from the headings
   and unit list below. If a heading was added since this plan, the table grows;
   record the delta in `plan.md` as an amendment before reviewing rows.

## Phase 1 — U5, artifacts, independent verification, cadence, publication

**Scope (from `worklist.md:238-253`).** Prose `spec/06-artifacts.md` §9,
`spec/07-independent.md` §10, `spec/appendices-runbooks.md` Appendix V.
Docs and code `docs/workflow-cadence.md`, `docs/publish-pipeline.md`,
`scripts/push-pipeline.sh`, `scripts/publish/{preflight,steps,run}.ts`,
`scripts/weekly.ts`, `scripts/loop-audit.ts`, `scripts/session-close.ts`,
`spec/audit/loop-audit.md`, `.github/workflows/publish.yml`,
`docs/plans/README.md`. Lens: `drift-report` plus process review. Already gated:
`test:pipeline`, `check-loop-artifacts`, `check-workflows`, `check-registers`.

**Row budget (46).** One row per unit; a row is settled when its claim is
resolved against its predicate, not when the prose reads plausibly. Every content
line of §9 and §10 is assigned to a unit — the two sections are 68 and 128 lines
with no subheadings, so a unit that stopped at the last table row would leave the
tail paragraphs unreviewed. §10's unit boundaries are `:1-11` (binding statement
through the "The operator:" lead-in), `:12-18`, `:20-118`, `:121-127`; what
remains is blank lines and prose fences.

| Surface | Anchor | Rows |
|---|---|---|
| §9 lead-in and the handoff-artifact contract | `spec/06-artifacts.md:1-45` | 1 |
| §9 handoff verification `H1`–`H18` | `:46-63` | 18 |
| §9 tail: the un-exercisable-step waiver rule and the Markdown→REQ→code→test traceability chain | `:64-68` | 1 |
| §10 binding and scope statement (through the "The operator:" lead-in) | `spec/07-independent.md:1-11` | 1 |
| §10 operator procedure (5 steps) | `:12-18` | 1 |
| §10 verifier prompt (steps 1–10, including step 10's REQ-274 confidence threshold) and report format | `:20-118` | 1 |
| §10 `DISPUTED` adjudication rule | `:121-127` | 1 |
| Appendix V runbooks `V.1`–`V.10` | `spec/appendices-runbooks.md:13,51,70,85,128,143,158,194,228,260` | 10 |
| `docs/workflow-cadence.md` | whole file | 1 |
| `docs/publish-pipeline.md` | whole file | 1 |
| `scripts/push-pipeline.sh` | whole file | 1 |
| `scripts/publish/preflight.ts` | whole file | 1 |
| `scripts/publish/steps.ts` (ordered step registry) | whole file | 1 |
| `scripts/publish/run.ts` | whole file | 1 |
| `scripts/weekly.ts` | whole file | 1 |
| `scripts/loop-audit.ts` | whole file | 1 |
| `scripts/session-close.ts` | whole file | 1 |
| `spec/audit/loop-audit.md` (snapshot currency and claim shape) | whole file | 1 |
| `.github/workflows/publish.yml` | whole file | 1 |
| `docs/plans/README.md` (the loop contract the pipeline enforces) | whole file | 1 |
| **Total** | | **46** |

**Row IDs.** `review.md` numbers its rows `R1`–`R46` in the table's first column,
one per unit in the order above, so the completeness check is
`grep -c '^| R[0-9]' review.md` = 46 — independent of how many header or
separator lines the table renders.

**Row method.** Each prose row settles three facts: the workflow it describes,
the script or manual action that performs it, and the gate that would catch a
drift. Each code row settles four: declared role header, exit-code contract, the
wiring that runs it, and the §9/§10/Appendix V clause it serves. A prose row
with no script and no manual action is a finding of class *drift*; a script with
no prose is a finding of class *coverage*. Prose that instructs an external
builder with no repository check is `builder-side` — a terminal verdict, not a
gap, exactly as U4 recorded (`worklist.md:228-231`).

**Finding classes for this chunk.**
- *drift* — §9/§10/Appendix V names a workflow, count, token, or check that no
  script delivers, or names a file/convention the tree does not contain.
- *process* — a documented step in Appendix V or `docs/workflow-cadence.md` is
  unreachable from the pipeline, the hooks, or the weekly sweep, so the runbook
  tells an operator to do something no surface supports.
- *coverage* — the pipeline or a gate runs a blocking step that no §9/§10/
  Appendix V clause describes (an undocumented hard stop).
- *external-skill* — a §10 clause is carried by a harness skill that lives
  outside this repository. This is a terminal verdict like `builder-side`: the
  row records the skill's absolute path and the clause it satisfies, and it is
  not a gap merely because no in-repo gate can read it. Its in-repo carriers are
  named too (`docs/plans/*/review.md`, `docs/plans/*/aar.md`, and the register
  row the skill's findings land in).

**Expected work.** Bounded prose fixes only: the demonstrated defects of class
drift/process/coverage in §9, §10, Appendix V, `docs/workflow-cadence.md`,
`docs/publish-pipeline.md`. No script behaviour change lands in this increment; a
finding that requires one is scheduled on `ROADMAP.md` with the predicate and the
REQ it serves. This keeps the increment a spec change with a one-commit rollback.

**Two exclusions, stated so the build cannot drift into them.**

- **No REQ body is edited in this increment.** A defect whose fix lands inside a
  `**REQ-NNN — Title.**` body carries the full spec-addition blast radius — REQ
  shape under `validate --sdd-strict`, the §5 section map, the coverage register,
  and possibly a fingerprint — none of which is Phase 1's surface. Such a finding
  is scheduled on `ROADMAP.md` with its predicate and is not fixed here.
- **No new gate is added.** If a row shows a workflow with no mechanical check,
  that is a finding of class *coverage*, dispositioned as P1 or P3; building a
  check is a separate increment with its own dry run and baseline
  (`AGENTS.md` § Script discipline, existing-check discovery).

**Exit evidence (from `worklist.md:250-252`, three clauses).** Every runbook step
resolves to a script or a manual action; the publication failure ledger matches
the pipeline's guards; §10's independent-verification contract maps to the review
skills in use. Each clause is evidenced in `review.md` with `file:line` anchors —
or, for the `external-skill` rows, the absolute skill path plus the in-repo
carrier — and the `worklist.md:95` status row is rewritten in U4's
exit-evidence form.

## Phase 2 — U6, synthesis and fixtures

**Scope (`worklist.md:254-269`).** Prose `spec/08-synthesis.md` §11.1–§11.4
(408 lines, four subsections); appendices B (`:31`), C (`:331`), N (`:385`),
W (`:778`), X (`:974`), Y (`:1084`), Z (`:1123`) in
`spec/appendices-fixtures.md` (1208 lines). Assets
`holonovel/scripts/fixtures/*` (5 entries), `holonovel/testdata/{rulesets,state}`,
`holonovel/scripts/playability.ts`, `holonovel/scripts/holosuite.ts`, and the
synthesis harnesses `test-competitive-gaps.ts`, `test-supplementary.ts`,
`test-world-provider.ts`. Lens: fixture ↔ expectation, `playability` as evidence.
Already gated: `playability` (full gate), `check-fixture-emitter`,
`check-starter-freshness`, `check-vendor-manifest`.

**Row budget (23).** Four §11 subsections; seven appendices; five fixture units
(the four files under `holonovel/scripts/fixtures/` — `cof-sample.cof`,
`subjective-recall.json`, `subjective-divergence.json`, `memory-recall.json` —
plus one unit spanning the two `holonovel/testdata/` directories); five harnesses;
two gate-scope rows. **Exit evidence:** every appendix fixture is exercised by a
named harness or recorded `builder-side` with a reason; §11.1–§11.4 each map to a
handler or a recorded gap.

**One U6 finding is pre-identified.** `holonovel/DECISIONS.md:1072` says
`.gitignore` ignores the whole `testdata/` directory while `:2235` calls
`testdata/state/` "committed state fixtures"; the fixture unit must resolve which
is true before its row can be settled, and the resolution belongs in U6's register
row — not in this plan, which must not review a surface it does not own.

**Bar.** 23 rows settled, dispositions written, `check-fixture-emitter`,
`check-starter-freshness`, and full-mode `playability` green, fast gate green.

## Phase 3 — U7, reference appendices and registries

**Scope (`worklist.md:270-285`).** Appendices D–L and O–T in
`spec/appendices-reference.md` (3,167 lines) plus Appendix U in
`spec/appendices-licenses.md` (43 lines); artifacts
`holonovel/tool-definitions.json`, `tool-surface-registry.json`,
`tool-disambiguation.json`, `tool-routing.json`, `holonovel/schemas/`,
`holonovel/server.json`, `glama.json`, `docs/licenses/ATTRIBUTION.md`. Lens:
catalog ↔ live artifact comparison. Already gated:
`check-tool-definitions-sync`, `tool-definitions-lint`, `check-tdqs-scoreboard`,
`tool-citation-check`, `check-server-manifest`, `check-registers`,
`check-tool-surface`, `surface-budget`, `surface-replay`.

**Row budget (24).** Sixteen appendix rows (D, E, F, G, H, I, J, K, L, O, P, Q,
R, S, T, U); eight artifact rows (six JSON files, the schema directory with
`PROVENANCE.md`, `docs/licenses/ATTRIBUTION.md`). **Exit evidence:** each catalog
appendix matches the artifact it describes or carries a divergence finding; every
Appendix U license row resolves to `docs/licenses/ATTRIBUTION.md`.

**Bounded method for the catalog appendices.** Appendix E (1,335 lines) and F
(790 lines) are too large for row-by-row manual review and are already
mechanically gated: `check-traceability` walks the server `DECISIONS.md`
traceability rows (`scripts/check-traceability.ts:3,24,107`), and Appendix F is
covered by `tool-citation-check` plus the harness title-ID checks. For each of
them the chunk (a) runs the gate, (b) reads the gate's own predicate to confirm
the scope it covers, and (c) samples five rows deterministically — first, last,
and every ⌊n/4⌋th — recording each sample in `review.md`. A divergence found in a
sample promotes the appendix to full review. Appendices under 260 lines get full
rows.

**Fingerprint consequence.** Appendix Q is a `DATA_SECTIONS` member
(`scripts/lib/contract-fingerprint.ts:37-43`). If any finding edits it, run
`npm run build-order` and commit the regenerated `contract-fingerprints.ts` in the
same commit; `check-fingerprint-sync` blocks the commit otherwise.

**Bar.** 24 rows settled, dispositions written, the nine catalog gates green,
fast gate green.

## Phase 4 — U8, repo governance and content assets

**Scope (`worklist.md:286-313`).** `README.md` (479), `AGENTS.md` (564),
`SECURITY.md` (70), root `package.json`, `holonovel/Dockerfile`,
`holonovel/{README,AGENTS,DECISIONS,NOTICE}.md`, `LICENSE`,
`spec/audit/{review-register,req-coverage,proofread-register}.md` and the
`spec/audit` baselines/reports except `loop-audit.md` (U5), `ROADMAP.md`,
`CHANGELOG.md` conventions; assets `holonovel/narrative_world_model/` (124 K),
`holonovel/content/` (456 K), `docs/upstream/cof.md`,
`docs/e5-world-pack-gap-report.md`, `docs/ruleset-index-phase0.md`. Lens:
`drift-report` plus content/licensing review. Already gated: `validate-readme`,
`lint`, `check-registers`, `check-traceability`, `check-vendor-manifest`,
`check-reference-server-cleanliness`, `check-container-image`, `check-roadmap`,
`check-gate-table`.

**Row budget (25).** Sixteen governance rows; nine asset rows — the world model's
four entries (`MANIFEST.md`, `README.md`, `narrative/`, `world/`), the two content
files (`torre-nosferatu.json`, `torre-nosferatu.source.json`), and the three docs
(`docs/upstream/cof.md`, `docs/e5-world-pack-gap-report.md`,
`docs/ruleset-index-phase0.md`). **Exit evidence:** every governance document's
claims resolve to the file it describes; every vendor/content asset is either in
the vendor manifest with a matching hash or recorded as a non-vendored tracked
file with its license row.

**Closing duty.** When the chunk's findings are dispositioned, remove the sweep
section from `ROADMAP.md` (its own trigger says the section closes when U8 is
`Resolved`), flip `worklist.md:98` to exit-evidence form, and record the program
completion in the AAR. `check-roadmap` then passes with one fewer section.

**Register coupling (same step, in the same commit).** `check-registers`
cross-references every `Scheduled-roadmap` row in
`spec/audit/review-register.md` against the roadmap entries that carry it. So the
moment a roadmap section is retired, each register row that cites it is
re-dispositioned in the same step: `Resolved` if the chunk closed it, `Closed-P3`
if the finding is downgraded, `Deferred-by-user` if the maintainer sets it aside.
The same rule applies to every earlier chunk session (Phases 1–3): a fix that
retires a `Scheduled-roadmap` row updates that row in the same commit. Without
this, `check-registers` fails at build time rather than at review time.

**Bar.** 25 rows settled, the sweep section removed, `check-roadmap` and
`check-registers` green, fast gate green.

## Phase 5 — loop-gate fix-up rate re-measurement

**Trigger (`ROADMAP.md:45-46`).** The date 2026-11-28, or 26 new commits after
the 2026-11-08→14 baseline, whichever comes first. Today neither holds: 0 commits
after `2026-11-15T00:00` (EV13).

**Measurement, operational form.** Take the window's first 26 commits,
oldest-first. For each consecutive pair whose committer timestamps are within
900 seconds, intersect their touched-path sets. Record (a) the number of sharing
pairs, (b) the number of commits participating in at least one sharing pair, and
(c) the list of shared paths, largest first. Baseline to compare against: 26
pairs / 15 sharing, target ≤7 of 26.

**One clarification to record with the measurement.** `ROADMAP.md:39-41` states
the baseline in pairs and the target in commits ("≤7 of the next 26"), so the two
numbers are not the same unit. The plan measures and reports both, and the
closing AAR states which unit the verdict uses. If the verdict is "unchanged",
the item's own instruction applies: reopen the diagnosis rather than re-running
the count.

**Alternative considered and rejected.** Extending `scripts/loop-audit.ts` with a
fix-up-pair metric so the weekly sweep reports it automatically. Rejected: the
metric needs a per-commit path list that `readCommits` does not fetch
(`scripts/loop-audit.ts:93`), it is measured once, and the item closes on that
one measurement. Adding a wall-clock-window metric to a snapshot report whose
`--check` is drift-based would also put a moving number under a gate. Recorded
here so a later session does not re-litigate it.

**Bar.** Trigger evaluated and recorded; if met, the number recorded and the item
removed from `ROADMAP.md`; if unmet, the item retained with the evaluation date.

## Blast radius

| Path | Change | Class |
|---|---|---|
| `spec/06-artifacts.md` | bounded prose fixes (§9) | M |
| `spec/07-independent.md` | bounded prose fixes (§10) | M |
| `spec/appendices-runbooks.md` | bounded prose fixes (Appendix V) | M |
| `docs/workflow-cadence.md` | bounded prose fixes | S |
| `docs/publish-pipeline.md` | bounded prose fixes | S |
| `docs/plans/README.md` | bounded prose fixes (the loop contract the pipeline enforces) | S |
| `holonovel.md`, `holonovel/holonovel.md` | regenerated by `npm run assemble` | M |
| `holonovel/src/generated/g7-attestation.ts` | regenerated; `SPEC_HASH` is a hash of the whole assembled spec (amendment A-1) | S |
| `spec/audit/review-register.md` | dated U5 heading, one row per finding | S |
| `docs/plans/2026-11-10-unscoped-surface-review/worklist.md` | U5 status row → exit-evidence form | S |
| `spec/audit/loop-audit.md` | only if its snapshot claims drift (not regenerated by this plan) | S |
| `ROADMAP.md` | no existing section removed or renamed in Phase 1; a new section for a scheduled finding carries 1–3 bullets and a `**Trigger:**` line (admission rule, `scripts/check-roadmap.ts:163-181`); the sweep section is removed in Phase 4 | S |
| `CHANGELOG.md` | dated session entry | S |
| `docs/plans/2026-11-15-unscoped-u5/{plan,tasks,review,aar}.md` | this increment | M |

**Not touched in Phase 1.** No `holonovel/src/` or `holonovel/scripts/` file; no
fingerprint-bearing section (§9, §10, and Appendix V are outside
`PACKAGE_SECTIONS` and `DATA_SECTIONS`, EV10); no fingerprint regeneration; no
push; no version bump unless the session date advances past `2026.11.15`.

**Read but not changed (prose and doc rows).** The review reads these without
editing them; they are predicates, not blast radius: `scripts/validate.ts`,
`holonovel/scripts/test-*.ts`, `scripts/lib/gate-manifest.ts`,
`scripts/check-workflows.ts`, `scripts/lib/contract-fingerprint.ts`,
`spec/appendices-reference.md` (Appendix F test IDs), `AGENTS.md`, and
`package.json`. The three doc rows — `docs/workflow-cadence.md`,
`docs/publish-pipeline.md`, `docs/plans/README.md` — are budget rows *and* prose
fixes, so they live in the blast radius above, not here.

**Read but not changed (code rows).** Of the twelve code/doc rows, nine are code
rows that are *subjects* of review: `scripts/push-pipeline.sh`,
`scripts/publish/{preflight,steps,run}.ts`, `scripts/weekly.ts`,
`scripts/loop-audit.ts`, `scripts/session-close.ts`,
`.github/workflows/publish.yml`, `spec/audit/loop-audit.md`. The other three are
the doc rows named above. A code defect in any of the nine that
needs a behaviour change is scheduled, never patched in this increment; a defect that is a comment or doc-string correction is a prose fix and
joins the blast radius at the moment it is made, recorded as an amendment.

**Out of blast radius entirely.** `holonovel/src/**`, `holonovel/scripts/**`,
and every fingerprint-bearing section other than Appendix Q (which belongs to
Phase 3).

## Verification

| Claim | Command | Pass condition |
|---|---|---|
| Spec assembles | `npm run assemble` | exit 0; both assembled copies rewritten |
| Structural gates | `npm run check:fast` (un-piped) | trailing `check:fast: PASS`, 0 failed |
| Pipeline harness | `npm run test:pipeline` | exit 0 (full-mode gate, run explicitly) |
| Runbook/process claims | `npm run check-registers` | exit 0, no new warning naming this increment |
| Roadmap admission rule | `npm run check-roadmap` | exit 0; no existing section removed or renamed, and any added section carries a `**Trigger:**` |
| Fingerprints untouched | `npm run check-fingerprint-sync` | exit 0 (no regeneration expected) |
| Review rows complete | `grep -c '^| R[0-9]' docs/plans/2026-11-15-unscoped-u5/review.md` | 46 |
| Increment contract | `npm run check-loop-artifacts` | exit 0 with `aar.md` present |
| Close | `npm run session:close` | single commit, subject = CHANGELOG heading |

**Row-completeness check.** `review.md` numbers its rows `R1`–`R46`, one per
budget unit, keyed by the unit's anchor. The check above counts row IDs, not
table lines, so header and separator rows cannot mask a missing unit.

**Gate-pinned values.** The `CHANGELOG.md` heading date must equal the session
date; if the session runs after 2026-11-15 the CalVer surface must advance with
`npm run build-order` in the same commit (REQ-107a), never edited by hand.

## Risks and rollback

| Risk | Mitigation |
|---|---|
| A row reveals a P0 defect larger than bounded prose (e.g. a pipeline guard that does nothing) | Fix only when the fix is prose; otherwise record the predicate, schedule on `ROADMAP.md` as P1, and note it in the AAR — do not widen the increment |
| §9/§10 rows resolve to nothing checkable because the handoff workflow is builder-side | `builder-side` is a terminal verdict (U4 precedent); record the reason per row |
| The chunk runs past one session | Pre-declared split fence: finish the prose rows (§9/§10/Appendix V, 34 rows) and defer the 12 code/doc rows to a U5b increment, recorded in `worklist.md` under `D6` — never used as a done-bar escape |
| `test:pipeline` is slow or fails for environmental reasons | It runs in full mode only; run it explicitly before the close and record the exit code in the AAR |
| Register edits break `check-registers` (missing date, missing disposition) | Every row carries a dated heading and one of the four terminal dispositions (EV11) |
| The re-measurement window fills mid-session | Phase 0 re-checks the trigger each session; if it holds, run Phase 5 first and close both in one AAR |

**Rollback.** One revert restores every path in the blast radius: the increment
directory, the register heading, the `worklist.md` status line, the bounded
`spec/` edits, the two assembled copies, and the CHANGELOG entry. No data
migration, no external state, no publish.

## Commit plan

One commit for the increment, produced by `npm run session:close` (a spec
increment is one commit; `AGENTS.md` § Commits). It carries: the increment
directory, the register rows, the `worklist.md` update, the bounded `spec/` fixes,
`holonovel.md` + `holonovel/holonovel.md`, and the CHANGELOG entry. The commit
must pass `check:fast` and `test:pipeline` before it is made.

## Amendments to the program record

Two corrections to `worklist.md` are carried by this plan. They are recorded here
rather than silently applied, because a lens that exists to catch drift should
not absorb its own.

1. **`check-registry` → `check-registers`.** `worklist.md:249` and `:281` name
   `check-registry`; the tree has both `scripts/check-registers.ts` (a manifest
   gate, `scripts/lib/gate-manifest.ts:162-165`) and a publish-only
   `check-registry-publish` script. The plan's rows use `check-registers` because
   that is the gate that runs. This is itself a small finding against the
   worklist and belongs in U5's register row.
2. **Appendix fixture anchors.** `worklist.md:257-258` gives X `:970`, Y `:1080`,
   Z `:1119`; the actual headings are `:974`, `:1084`, `:1123`
   (`spec/appendices-fixtures.md`). Phase 2 uses the real anchors; the worklist
   correction lands in U6's exit-evidence update.

## Done bar

**Done bar:** Phase 1 (this session) — 46 review rows, every finding
dispositioned, gates green; Phases 2–5 are the program's later sessions.

1. `docs/plans/2026-11-15-unscoped-u5/` holds `plan.md`, `tasks.md`, `review.md`
   with rows `R1`–`R46`, and `aar.md` ending in `LOOP PAUSED`. A session that
   cannot reach `LOOP PAUSED` stops and reports; `session:close` refuses
   `LOOP OPEN` (`docs/plans/README.md:49-50,62-63`), so it is a stop state, not
   an acceptable close.
2. Every finding carries one terminal disposition: fixed in the increment, a
   dated `ROADMAP.md` section, a `spec/audit/review-register.md` row, or a dated
   record-and-close in the AAR.
3. `worklist.md:95` is rewritten in U4's exit-evidence form and names the three
   exit clauses with their evidence.
4. These exit 0 un-piped: `npm run assemble`, `npm run check:fast`,
   `npm run test:pipeline`, `npm run check-registers`, `npm run check-roadmap`,
   `npm run check-fingerprint-sync`.
5. No existing `ROADMAP.md` section is removed or renamed. A section added for a
   scheduled finding satisfies the admission rule (1–3 bullets plus a
   `**Trigger:**`), so the file may hold three sections at close.
6. No fingerprint-bearing section, server source, or publish action is touched.

**Program completion bar.** The four chunk sessions complete, the sweep section
removed from `ROADMAP.md` after U8, and the re-measurement recorded in the AAR of
the first session after its trigger — then `ROADMAP.md` holds zero scheduled
sections.

## Execution amendments

- **A-1 — the G7 attestation is keyed on the whole assembled spec.** The plan
  said no generated artifact would move because no fingerprint-bearing section was
  edited. That was incomplete: `holonovel/src/generated/g7-attestation.ts:1-4`
  carries `SPEC_HASH`, a hash of the entire assembled `holonovel.md`
  (`holonovel/scripts/generate-g7-attestation.ts:159`), so **any** spec edit makes
  it stale and `check-g7-attestation` fails. Regenerated in this increment; the
  diff is the single `SPEC_HASH` line. Blast-radius row added. The gate catches
  the staleness in every fast run, so the checklist omission is a convenience gap
  rather than a hole; the next chunk plan budgets the regeneration.
- **A-2 — Phase 0's commit count was measured with a query that cannot match.**
  EV13 recorded zero commits after the baseline window using
  `git log --since=2026-11-15`; that form is parsed as UTC midnight and returns
  nothing on this offset. `--since=2026-11-14T23:59:59` returns **11** commits,
  all dated 2026-11-15. The re-measurement trigger (26 commits) is still unmet, so
  the conclusion held, but the number did not.
- **A-3 — Appendix V's lead-in was outside the row budget.** R25 now covers the
  lead-in plus V.1, so no line of Appendix V is unassigned; the count stays 46.

## Open questions

1. **U5's expected change volume.** The chunk is a review, so the fix count is
   unknown until rows are settled. The plan bounds it by class (prose only) rather
   than by count; if the review yields more than roughly 15 prose fixes, the split
   fence above applies. No evidence can settle this before the review runs.
2. **`loop-audit.md`'s snapshot.** Its `--check` is drift-based
   (`scripts/loop-audit.ts:1-13`), so U5 verifies the claims but regenerates the
   snapshot only if a row demonstrates a stale value. The alternative — always
   regenerate — would turn a review increment into a build step.
3. **Whether U8 should close the sweep section itself.** This plan assigns that
   duty to U8 because its trigger says the section closes when U8 is `Resolved`.
   If the maintainer prefers the section to close with a separate roadmap edit,
   that is a one-line deviation recorded in the U8 plan.
