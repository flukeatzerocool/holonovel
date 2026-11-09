# Plan — Full-review sweep (P1 roadmap item)

**Status:** draft, awaiting user approval · **Date:** 2026-11-09 · **Depth:** standard
**Review independence:** fresh (cold pass 1 FAILED on B1; diff re-review passed with
conditions C-N1–C-N3, verified by `build-review`) · **Rollback cost:** 1
**Gate artifact:** `~/.local/state/opencode/plans/fe586f0907cda9bed04d391d454275b4a14bc3e300047c43f32dd854d4f08ed4/` ·
cold report sha256 `61365dc117a3a58e1db367437a3c5b0d72468e7dd318ee5161a79d618505d2ef` · stages 4/5
**Roadmap item:** `ROADMAP.md` § Remaining full-review sweep (P1)

## Done bar

**Done bar:** this increment only — the program below is 8 sessions.

1. `docs/plans/2026-11-09-full-review-sweep/worklist.md` exists and enumerates
   every chunk of the program (8 paired chunks + the machine-evidence pass),
   each with its code targets, spec sections, and review lens (exit evidence is
   recorded at each chunk's close),
   and the chunk→§5 mapping covers every subsection in scope with no gap and no
   duplicate: §5.1–§5.8, §5.10–§5.18, §5.20–§5.31, plus §5.32–§5.35 if **Q1**
   is answered yes. §5.9 and §5.19 are the only exclusions, each with its
   deferral line.
2. Chunk **P1** (trust core: request routing, badge gating, error contracts,
   audit → §5.1 + §5.5) is fully reviewed: `worklist.md` carries one row per
   in-scope §5.1/§5.5 REQ (125 rows) with a verdict of `holds`,
   `finding:<ID>`, or `builder-side`. That row set — not the gate result — is
   the falsifiable record that the chunk was reviewed. Every finding carries an
   ID, a `file:line` or `spec:line` predicate, a P-severity, and a terminal
   disposition.
3. Zero open P0 findings from P1 remain. If a P0 cannot be fixed inside this
   session, the run **halts** and still lands (see **Stopped-run landing**);
   the plan is not "done" by deferring it silently.
4. The machine-evidence pass (M1) has been executed and its outputs are
   recorded in `worklist.md` (Delta amendment): `npm run check:conformance`,
   `npm run fmea`, `npm run graph-deps`; each non-empty finding is dispositioned.
5. `ROADMAP.md` is updated in the same increment: the item's section range is
   corrected (see **Open question Q1**), the remaining chunks are named, and
   the `**Trigger:**` line names the next chunk.
6. `spec/audit/review-register.md` carries the P1 findings with terminal
   dispositions in the register's own sections (see **Register write-back**);
   no `Scheduled-roadmap` row is added without a matching `ROADMAP.md` entry
   (`check-registers` gates this).
7. These exit 0 un-piped: `npm run assemble`, `npm run check:fast`,
   `npm run check`.
8. The increment lands with `plan.md`, `tasks.md`, `aar.md`, and `worklist.md`.
   `aar.md` ends with the token its outcome earns: `LOOP PAUSED` when every P1
   finding is scheduled and no P0 is open, `LOOP OPEN` when a finding remains
   tracked outside the roadmap (a halted P0 always yields `LOOP OPEN` naming it).

## Open questions (answers become decisions before execution)

- **Q1 — Does the sweep cover §5.32–§5.35?** The roadmap item ends at §5.31;
  `spec/02-requirements.md` now has §5.32 Perception Ledger (8 REQs),
  §5.33 Briefing Consistency (7), §5.34 Compression Ladder and Recall (4),
  §5.35 Subjective Memory (18). **Recommendation:** include them (chunk P8);
  only §5.9 and §5.19 were declared closed by the 2026-11-09 seam pass. Amend
  the roadmap bullet in the same increment.
- **Q2 — Fix policy.** **Recommendation:** fix P0 in-session (bounded), schedule
  P1 on `ROADMAP.md`, fix P2 only when a failure is demonstrated, record-and-close
  P3. Per-chunk: true, not a remediation batch at the end.
- **Q3 — Chunk order.** **Recommendation:** code-first, as the roadmap trigger
  states; P1 (trust core) first because gating, audit, and error contracts have
  the widest blast radius in `index.ts`.
- **Q4 — Publication.** Three commits are already unpushed. **Recommendation:**
  no push in this increment; publication stays user-authorized.

## Scope

**In scope.** Execute chunk P1 and the machine-evidence pass; build the durable
worklist for the remaining seven chunks; amend `ROADMAP.md`; record findings.

**Out of scope.** The remaining seven chunks' execution; §5.9 and §5.19
semantic review (closed by the 2026-11-09 seam pass — their code may still be
read as part of chunk P4's code-side pass); publication; version release notes.

## Evidence base (this session)

| # | Evidence | Source | Trust |
|---|---|---|---|
| EV1 | `check:fast` → PASS, 37 passed / 0 failed | tool output, this session | tool-output |
| EV2 | `git status --porcelain` empty at session start; `origin/main..HEAD` = 3 commits (`2d4204b`, `5c73f7e`, `68e4c0b`); this plan's directory is untracked until the commit | tool output, this session; `plan.evidence.md` | repo |
| EV3 | 1282 REQ bodies across 35 subsections of §5 | `spec/02-requirements.md` (counted this session) | repo |
| EV4 | Coverage register: C 478, E 125, A 0, B 0 (603 rows) — no bucket-A gap to chase; the sweep is a semantic/behavioral check, not coverage fill | `spec/audit/req-coverage.md` | repo |
| EV5 | Code size: `index.ts` 14 681 lines, 42 `registerTool` sites, 280 `case "` branches; `core/` 8 698 lines (`state.ts` 3 080); `world/` 1 999 | `wc -l`, `grep -c` | repo |
| EV6 | Roadmap bullet ends at §5.31; spec has §5.32–§5.35 (37 REQs) | `ROADMAP.md:20`, `spec/02-requirements.md` | repo |
| EV7 | Seam pass closed only `docs/engine-contract.md` + §5.9/§5.19 | `spec/audit/review-register.md:14` | repo |
| EV8 | 46 harness scripts under `holonovel/scripts`; `test:all` → `run-test-suite.ts` | `ls`, `holonovel/package.json:117` | repo |
| EV9 | Machine evidence commands exist: `check:conformance` (gate), `fmea`, `graph-deps` (informational) | `package.json` | repo |
| EV10 | Audit entry point `audit()` at `index.ts:2409`; generic `registerTool` at `:2229` | `grep -n` | repo |

## Program (recorded here; executed one chunk per session)

Chunks pair a code surface with the spec sections that govern it, so a finding
in one can be checked against the other in the same pass. Full targets and exit
evidence live in `worklist.md`.

| Chunk | Code surface | Spec surface | Primary lens |
|---|---|---|---|
| **P1** (this session) | `index.ts` dispatch, badge gates, `audit()`, error envelopes | §5.1, §5.5 | security + contract |
| P2 | tool registration, schemas, descriptions (`index.ts`, `tool-registry.ts`, `holonovel/tool-definitions.json`) | §5.3 | surface economy + contract |
| P3 | mutation and decision handlers plus lifecycle transitions in `index.ts` (`respond_decision`, state tools) | §5.4, §5.6 | state integrity |
| P4 | `core/state.ts`, `core/data-dir.ts`, save/load/archive/undo | §5.19 cross-check (code-side) | persistence + determinism |
| P5 | engine loop, `core/event-hub.ts`, `core/event-log.ts`, `core/agent.ts` | §5.20, §5.24, §5.31, `docs/engine-contract.md` §2–§6 | ordering + event stream |
| P6 | `core/surface-projection.ts`, `core/surface-aliases.ts`, `world/*`, `rulesets.ts`, `library.ts` | §5.10, §5.11, §5.13, §5.15, §5.16–§5.18, §5.21–§5.23 | adapter seam |
| P7 | `core/rng.ts`, `core/state-hash.ts`, `core/limits.ts`, `core/corpus.ts`, `core/semantic.ts`, `core/graph.ts` | §5.2, §5.7, §5.8, §5.14, §5.28–§5.30 | determinism |
| P8 | `core/belief.ts`, `core/identity.ts`, `core/causal.ts`, `core/subjective.ts`, `core/perception.ts`, `core/memory.ts`, `core/divergence.ts` | §5.12, §5.25–§5.27, §5.32–§5.35 (Q1) | narrative cognition |
| **M1** | `check:conformance`, `fmea`, `graph-deps` | all | machine evidence |

Mapping check (run with `grep -n '^### 5\.' spec/02-requirements.md` + this
table): every subsection of §5.1–§5.8, §5.10–§5.18, §5.20–§5.31 is assigned
exactly once; §5.32–§5.35 are assigned to P8 pending **Q1**; §5.9 and §5.19 are
the sole exclusions (deferred by the seam pass), with P4 covering their code
side only.

## Steps

### Phase 0 — Baseline and worklist (no source edits)

1. Record the measured baseline (EV1–EV10) in `plan.md`; re-run
   `npm run check:fast` un-piped immediately before the review starts, and run
   `npm run check` once so the full gate's baseline is measured rather than
   assumed. A red full gate at baseline is a P0 and is fixed as its own commit
   before any review work, per the standing route.
2. Write `worklist.md`: for every chunk P1–P8 and M1, list code targets,
   spec sections, the review skill to apply, the harnesses that already cover
   it, and the exit evidence. One row per chunk; the file is the cross-session
   tracker and is updated at each chunk's close.
3. Confirm the artefact directory is trackable:
   `git check-ignore -v docs/plans/2026-11-09-full-review-sweep/` returns nothing.
4. Record the answers to **Q1–Q4** as **D1–D4** in `worklist.md` before any
   review work starts; the worklist's mapping and Phase 3's roadmap edit depend
   on Q1. Decisions go in the worklist, not this file, so the stamped plan hash
   stays valid for the whole increment.

### Phase 1 — Chunk P1: trust core (§5.1, §5.5)

1. **Enumerate the surface** (read-only, record `file:line` in the worklist):
   the request dispatcher and `createEngine` tool execution path, the badge-gate
   helpers wherever they are defined (the names `requireGM` / `requirePlayer` /
   `requireNotObserver` are the expected shapes, confirmed at enumeration, not
   assumed), the `audit()` writer at `index.ts:2409` and its call sites, and the
   error envelope builders that implement §5.1.
2. **Review with `code-review`** (read-only) over that surface,
   scoring against §5.1 (output and error contracts, truncation, roll-through
   transparency) and §5.5 (badge activation, server-side gating). Every finding
   cites the predicate — `file:line` — not a gate message.
3. **Cross-check the spec side** for the same region: each §5.1/§5.5 REQ's
   `*Check:*` citation must name a harness that actually exercises it; a REQ
   whose cited test does not exercise the stated behavior is a finding (this is
   the false-C class `check:conformance -- --dedicated` reports).
4. **Record one verdict per REQ.** Fill the `worklist.md` chunk-P1 table with one
   row per §5.1/§5.5 REQ (125 rows): `holds`, `finding:<ID>`, or
   `builder-side` (a REQ no server runtime satisfies; §5.1/§5.5 should yield
   none, so any such row is itself a finding). This table is the done-bar
   evidence for item 2.
5. **Triage and fix.** P0 fixes land in this increment with a targeted test
   addition; P1 goes to `ROADMAP.md`; P2 only with a demonstrated failure; P3
   record-and-close. If a P0 exceeds the session budget, invoke the
   **Stopped-run landing**.
6. **Record** every finding in `spec/audit/review-register.md` in the section its
   disposition names (see **Register write-back**) and mirror the P1 schedule
   rows in `ROADMAP.md`.

### Phase 2 — M1: machine evidence

1. `npm run check:conformance` — capture exit code and findings.
2. `npm run fmea` and `npm run graph-deps` — capture output paths/summary.
   Both are informational; findings are reviewed, not auto-accepted.
3. For each non-empty finding: confirm the predicate against the repo, then
   disposition it (P0 fix / P1 roadmap / P3 record-and-close). Do not add a
   finding that rests only on a tool message.
4. Append the outputs as a **Delta amendment** section in `worklist.md` — not in
   this file, so the stamped plan hash stays valid.

### Phase 3 — Roadmap, registers, gates, artefacts

1. Amend `ROADMAP.md`: correct the section range per Q1 and restate the item as
   the remaining chunk series. Admission rule shape (`ROADMAP.md:3-12`): 1–3
   bullets plus one `**Trigger:**`. The section currently carries three bullets,
   so the bullets are **replaced**, not appended — e.g. bullet 1 = chunks P2–P4
   (tool surface, mutation/lifecycle, persistence), bullet 2 = chunks P5–P7
   (engine loop, adapters/rulesets, determinism), bullet 3 = chunk P8 plus M1
   machine-evidence re-run; `**Trigger:**` names the next allocated session
   (chunk P2). `check-roadmap` rejects any other shape.
2. `spec/audit/review-register.md`: P1 rows placed per **Register write-back**;
   every `Scheduled-roadmap` row names its roadmap section (`check-registers`).
3. If a P0 fix amended a spec REQ: run `npm run assemble`, then
   `npm run validate -- --write-register` (refreshes `req-coverage.md` and the
   appendix revision rows), then `npm run build-order`. If the amended section
   is fingerprinted (§5.9, §5.16–§5.17, §6.3, §6.4.2, §7.7, §5.19, Appendix Q),
   `build-order` is mandatory — `check-fingerprint-sync` fails the commit on a
   stale `contract-fingerprints.ts`. A review-only increment that touches no
   spec REQ skips both, but `build-order` still runs for version sync.
4. `CHANGELOG.md`: one dated heading `2026-11-09 — Full-review sweep: chunk P1
   (trust core) and machine evidence`, date equal to the CalVer date.
5. Write `tasks.md` progress and `aar.md` with the token the outcome earns
   (`LOOP PAUSED` when zero P1 findings remain unscheduled and no P0 is open,
   else `LOOP OPEN` naming the tracking surface).

## Register write-back

The register partitions dispositions into four sections, each with its own
heading level (`spec/audit/review-register.md:12` `## Resolved`,
`:1039` `## Scheduled-roadmap`, `:1042` `## Closed-P3`,
`:1322` `## Deferred-by-user`). One P1 finding per disposition goes to exactly
one section, under a dated subsection in that section:

| Disposition | Section | Row shape |
|---|---|---|
| `Resolved` | `## Resolved` | `### 2026-11-09 full-review sweep — chunk P1` heading; bullets `**P1-FN — <title> (resolved):**` + predicate + fix location |
| `Scheduled-roadmap` | `## Scheduled-roadmap` | `### 2026-11-09 full-review sweep — chunk P1` heading; bullet names the finding, the predicate, and the `ROADMAP.md` section it is scheduled under |
| `Closed-P3` | `## Closed-P3` | same heading shape; bullet records the predicate and why no action follows |
| `Deferred-by-user` | `## Deferred-by-user` | only when the user defers a finding; names the user decision |

A finding that lands in `Scheduled-roadmap` and a `ROADMAP.md` entry are written
in the same step; `check-registers` cross-references them.

## Stopped-run landing

If a P0 cannot be fixed within the session (Q2's budget), the run halts but the
increment still lands as a record — never as a silent deferral:

1. `worklist.md` marks chunk P1 `halted on <finding ID>` and keeps the partial
   per-REQ verdict table.
2. Phase 3.1's chunk-series rewrite still runs (the remaining chunks are still
   the item), and an **additional** `ROADMAP.md` section is added for the P0:
   heading `## <finding ID> — <title> (P0)`, 1–3 bullets naming the predicate and
   the reproduction, and a `**Trigger:**` line naming the next session. The
   admission rule (`ROADMAP.md:3-12`, enforced by `check-roadmap`) applies to
   this section exactly as to the others.
3. `CHANGELOG.md` heading reads `2026-11-09 — Full-review sweep: chunk P1
   (halted on <finding ID>)`.
4. `aar.md` ends `LOOP OPEN` naming the P0 row; the gates still run and must be
   green for whatever landed.
5. No push. The P0 is the next session's first item, ahead of chunk P2.

## Blast radius

| File | Change | Size |
|---|---|---|
| `docs/plans/2026-11-09-full-review-sweep/{plan,tasks,aar,worklist}.md` | increment artefacts | M |
| `spec/audit/review-register.md` | P1 finding rows | S |
| `ROADMAP.md` | range correction, chunk bullets, trigger | S |
| `CHANGELOG.md` | dated heading + bullets | S |
| `holonovel/src/**`, `holonovel/scripts/test-*.ts` | only if a P0 fix lands (post-review, named at that time) | S–M |
| `spec/**` | only if a P0 fix amends a REQ (then fingerprints + registers) | S–M |
| `holonovel.md`, `holonovel/holonovel.md`, `holonovel/src/generated/contract-fingerprints.ts` | regenerated if `spec/` changes | — |
| `spec/audit/req-coverage.md` | regenerated only if a P0 fix amends a REQ | S |
| `holonovel/package.json`, `holonovel/package-lock.json`, `holonovel/server.json`, `holonovel/AGENTS.md`, `holonovel/DECISIONS.md` (header) | advanced by `build-order` version sync | — |

## Considered and rejected

- **One mega-session covering all 35 sections and 25 k lines of code.** Rejected:
  no session-achievable done bar, and review attention degrades past a chunk.
  The paired-chunk worklist keeps each session's bar reachable.
- **Chasing the coverage register first.** Rejected: bucket A is already 0
  (EV4), so there is no measured gap; the sweep's value is semantic (does the
  cited test exercise the stated behavior), which the register cannot answer.
- **Adding a new sweep gate.** Rejected for now: `check:conformance` plus the
  existing harnesses already cover the mechanical class; a new gate would
  duplicate coverage before the review demonstrates a gap.
- **Fixing every finding in its chunk.** Rejected: a review chunk can surface
  more work than a session absorbs; P1/P2/P3 findings are scheduled or closed,
  and only P0 blocks the chunk's close.

## Verification

| Check | Command | Expected |
|---|---|---|
| Assembly | `npm run assemble` | exit 0, no errors |
| Fast gate | `npm run check:fast` (un-piped) | 37/37, `check:fast: PASS` |
| Full gate | `npm run check` | 0 errors |
| Roadmap admission | `npm run check-roadmap` | pass after the roadmap edit |
| Register cross-refs | `npm run check-registers` | pass |
| Loop artefacts | `npm run check-loop-artifacts` | pass, LOOP token present |
| Build/version sync | `npm run build-order` | 0 errors |
| Conformance | `npm run check:conformance` | recorded in the Delta amendment |

## Risks and rollback

- **The chunk is review work, not a bounded edit — scope can creep.** The
  worklist is the fence: a finding outside the chunk's code/spec surface is
  recorded and scheduled, not chased.
- **A P0 discovered late can exceed the session.** Mitigation: stop, record,
  report; the plan's bar is not met, and that is the correct outcome.
- **False-C coverage.** `check:conformance -- --dedicated` over-flags on the
  current corpus (AGENTS.md), so its output is evidence to inspect, never a
  finding by itself.
- **Roadmap admission rule.** `check-roadmap` rejects a section without 1–3
  action bullets and a `**Trigger:**`; the edit is written to that shape.
- **No destructive operations, no push.** Every change is a reversible edit or
  an added artefact; rollback cost 1 (single `git revert`).

## Commit order and gates

| # | Commit | Scope | Gate before commit |
|---|---|---|---|
| C0 (conditional) | Restore a green full gate | only if the Phase 0 `npm run check` baseline is red — the fix for that failure alone | `check:fast`, `check` |
| C1 | Full-review sweep: chunk P1 and machine evidence | plan/tasks/worklist, review-register rows, ROADMAP.md, CHANGELOG.md, and any P0 fix | `assemble`, `check:fast`, `check`, `build-order`, `check-loop-artifacts` |

C1 is one commit (spec increment); C0 exists only when the baseline is red and
lands first, as its own commit, never folded into the review work. Subject
derived by `npm run session:close` from the CHANGELOG heading. Publication is
not part of this increment.

## User impact

None to runtime behavior unless a P0 fix lands. This increment changes review
records, the roadmap, and the changelog; the remaining seven chunks are
scheduled, not executed.

## Evidence

- Review artefact: this file; worklist: `docs/plans/2026-11-09-full-review-sweep/worklist.md`.
- Finding predicates: recorded per finding in `review-register.md`.
- Baseline: EV1–EV10 above (repo and tool-output sources).
- No external sources; no user-supplied content drives an instruction.
