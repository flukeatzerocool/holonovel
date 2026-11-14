# Plan — §5.4 citation repair (REQ-104c / T103)

Status: draft (plan-review pending) · Kind: planned · Depth: light
Increment target: docs/plans/2026-11-13-s5-4-citation-repair/
Rollback cost: 1 (two snapshot calls in one tool handler, one harness, registers, roadmap, changelog; reversible in one commit)
Evidence class: repo only (no web, no user-supplied content)
Trust boundary: every premise below is repo evidence read in this session, plus a scratch probe run under /tmp/opencode.

## 1. Objective

Take the top open ROADMAP section, *§5.4 citation repair (P1)* (ROADMAP.md:15-24),
and close finding F-P3-8 (spec/audit/review-register.md:2344-2347): REQ-104c's
_Check:_ cites T103 (02-requirements.md:1140), Appendix F catalogues T103
(appendices-reference.md:1570), and no harness title carries the token, because
gatherExercisedIds() (scripts/validate.ts:1431-1444) collects IDs only from an
executed test("...") call.

Writing the assertion exposed a real defect, so this is not a bookkeeping
increment. The ruleset-free creation paths take no snapshot:

- quick create with no rules: index.ts:4810-4821 (createEntity/addEntity/save,
  no novelSnapshot()); probe: undo returns "[STATE_CONFLICT] Nothing to undo"
  and the character survives (sheet still OK).
- step-by-step completion with no rules: index.ts:4255-4266 (same omission);
  probe: same result.

The rules-backed paths do snapshot (index.ts:4863 before createEntity;
index.ts:4304 before the drain), so a ruleset-bound creation is undoable today.
The tool description promises "Novel mutations persist, are audited, and are
undoable via manage_history (action: undo)" (index.ts:4736), and REQ-041 owns
the undo contract. The gap is a demonstrated wrong output (P0), fixed in this
increment.

**Done bar:**

1. T103 resolves to an exercised harness: holonovel/scripts/test-workflow.ts
   carries four T103/REQ-104c assertions (quick-create undo, step-by-step undo,
   pending-decision refusal, drained-stack [STATE_CONFLICT]).
2. Profile-only quick create and profile-only step-by-step completion each take
   a pre-mutation snapshot, so both are undoable; no other stack-depth assertion
   regresses.
3. spec/audit/req-coverage.md lists T103 on the REQ-104 row and is fresh.
4. F-P3-8 is Resolved in spec/audit/review-register.md with a dated predicate,
   and no Scheduled-roadmap entry cites REQ-104c after the ROADMAP section goes.
5. ROADMAP.md no longer carries the section; CHANGELOG.md carries a 2026-11-13
   entry naming REQ-104c/T103 and the snapshot fix.
6. npm run assemble && npm run check:fast green (41/41, trailing
   check:fast: PASS); check:registers, check:roadmap, check-loop-artifacts pass.
7. One npm run session:close commit. Publication (push) is out of scope.

## 2. Baseline (verified this session)

- git rev-parse HEAD: 554a446; git status --porcelain: clean.
- npm run check:fast: 41 passed, 0 failed, trailing "check:fast: PASS".
- npm --prefix holonovel run test:character-creation: 13 pure + 6 server-tier
  passed.
- npm run status: version 2026.11.13, 74 unpushed commits, 7 open roadmap
  items, last publish 2026-11-09. Publication out of scope.
- Scratch probe /tmp/opencode/probe-profile.ts (ruleset-free Novel):
  quick create -> undo = "[STATE_CONFLICT] Nothing to undo", sheet still [OK];
  step-by-step (6 steps) -> undo = same, character persists; roster empty.
- Scratch probe /tmp/opencode/probe-t103.ts (fixture ruleset): quick create ->
  undo -> sheet [NOT_FOUND], roster unchanged; undo while pending ->
  [STATE_CONFLICT]; step-by-step (5 steps) -> undo -> entity removed; drained
  stack -> [STATE_CONFLICT] Nothing to undo.
- Scratch probe /tmp/opencode/probe-staged.ts: quick create with
  stage_to_roster=true -> undo -> roster still lists character_01 while the
  Novel entity is [NOT_FOUND].

## 3. Findings, predicates, dispositions

| Predicate (verified in this tree) | Contract | Disposition |
|---|---|---|
| gatherExercisedIds() matches /\btest\s*\(\s*["'`].../ (validate.ts:1439-1441); grep -rn 'test("T103' holonovel/scripts returns nothing; REQ-104 is bucket C only through T32/T468/T141 (req-coverage.md:87) | REQ-104c | **write the assertion** |
| test-character-creation.ts defines a local async helper named atest (test-character-creation.ts:190), which the collector does not match (no word boundary before "test"), so its six T468 server-tier titles are invisible; T468 is exercised only via test-backfill.ts:831 | discovery cost | **avoid** (see D1) |
| Ruleset-free quick create: no novelSnapshot() before state.createEntity (index.ts:4810-4821) | REQ-041, manage_character description (index.ts:4736) | **fix** (C1) |
| Ruleset-free step-by-step completion: no novelSnapshot() before state.createEntity (index.ts:4255-4266) | REQ-041 | **fix** (C1) |
| Rules-backed paths snapshot before mutation (index.ts:4863; index.ts:4304) | reference pattern | keep |
| Undo blocked while a workflow is pending (index.ts:4363-4365), already asserted as T138a (test-workflow.ts:110) but without the T103 token | T103, REQ-041 | **assert under T103** |
| Default create never writes the roster (addToRoster gated on stage_to_roster, index.ts:4814, 4866); staged create leaves a roster entry after undo (probe) | T103 roster clause; DECISIONS.md:796 ("the roster is outside the Novel history store") | assert the default path; staged residue **out of scope** (D2) |
| manage_novel (action: create) takes no snapshot (comment at test-persistence-guardrails.ts:195-196), so a fresh Novel's stack starts empty | determinism of the drained-stack assertion | constraint |
| Undo pops the caller's stack in state.undo() and throws "[STATE_CONFLICT] Nothing to undo." on empty (state.ts:2228) | T103 empty-stack clause | assert |

## 4. Decisions

**D1 — Assert in test-workflow.ts, not test-character-creation.ts.** test-workflow.ts
already owns the workflow lifecycle, defines an async collector-visible
test(name, fn) helper (test-workflow.ts:19), and creates profile-only characters
in a ruleset-free Novel (test-workflow.ts:99-110) — the exact surface the defect
lives on. Rejected: test-character-creation.ts (its atest titles are invisible
to the collector, so a T103 title there would resolve nothing without a helper
rename); expanding gatherExercisedIds to match atest (a validator change in a
citation increment, and it would newly activate every atest title at once — the
P2 *Harness test-ID label hygiene* item owns that class); a pure re-point to
T138a (it asserts only the pending-block clause, not creation undo).

**D2 — The staged-creation roster residue is not asserted.** REQ-041 snapshots
are Novel-tier and DECISIONS.md:796 records that the roster is outside the Novel
history store, so a staged creation's roster row surviving undo is by design.
T103's "roster returns to pre-creation state" is asserted on the default path,
where creation never writes the roster. Recorded, not fixed.

**D3 — No spec-body or _Check:_ edit.** REQ-104c already cites T103; only the
harness evidence is missing. Appendix F's T103 row stays as written.

**D4 — Empty-stack assertion uses the same block's drained stack.** The T103
block runs in its own Novel; its only snapshots are the two creations, each
undone by its own test, so the final undo hits an empty stack deterministically.
If a future change adds a snapshot to novel create or badge switch, this
assertion fails loudly — the correct outcome.

## 5. Changes

### C1 — Snapshot the two ruleset-free creation paths (REQ-041) · S

File: holonovel/src/index.ts

1. In the create handler's !rules branch, insert novelSnapshot() immediately
   before state.createEntity (index.ts:4810), after the existing capGuard calls.
2. In the respond_decision !rules completion branch, match the rules-backed
   ordering: novel.pending_workflow = null; then novelSnapshot(); then
   state.createEntity (index.ts:4255-4266).
3. No other change to either branch.

Verification: probe-profile.ts shows "[OK] Undo successful", sheet [NOT_FOUND],
roster empty for both modes; the new T103 tests pass; npm --prefix holonovel run
test:all shows no new failure (stack-depth assumptions elsewhere).

### C2 — T103 assertions · S

File: holonovel/scripts/test-workflow.ts

Add a block after the T138 block, booting its own process and Novel
("workflow-t103", GM badge), capturing roster_list once before the tests:

1. T103/REQ-104c: undo after quick creation removes the character and leaves
   the roster unchanged — create with name+species (ruleset-free quick path),
   parse "Entity id (\S+?)\.", undo, assert sheet [NOT_FOUND] and
   roster_list identical to the captured value.
2. T103/REQ-104c: undo after step-by-step creation removes the character —
   raise with no params, answer the six default steps (name, species, classes,
   ability_scores, skills, equipment) driving the loop off [NEED_INPUT] with a
   hard cap of 8, parse the id from "created as (\S+?) \(", undo, assert
   sheet [NOT_FOUND] and roster unchanged.
3. T103/REQ-104c: undo is refused while a creation decision is pending —
   raise, assert undo [STATE_CONFLICT], cancel and assert "cancelled".
4. T103/REQ-104c: undo on the drained creation stack returns [STATE_CONFLICT]
   "Nothing to undo".

Also extend the file header (test-workflow.ts:2-4) to name T103.

Verification: each step-1/2 assertion is observed red against HEAD 554a446
before C1 (recorded in tasks.md), green after; steps 3-4 are green before and
after (they already hold).

### C3 — Coverage register refresh · S

File: spec/audit/req-coverage.md

Run npm run validate -- --write-register, then a plain npm run validate. Expect
the REQ-104 row's exercised tests to gain T103 and no freshness finding.

### C4 — Review register closure · S

File: spec/audit/review-register.md

Add a dated "2026-11-13 §5.4 citation repair" subsection under ## Resolved
(:12) with F-P3-8: the predicate (validate.ts:1439-1441 collector, no T103
title), the assertion (T103 in test-workflow.ts), and the defect the assertion
exposed (no snapshot on the ruleset-free creation paths, fixed at index.ts:4810
and :4255). Then delete the Scheduled-roadmap chunk-P3 subsection (:2338-2347)
— its four implementation findings already live under the 2026-11-13 §5.4
remediation chunk (:14).

Verification: npm run check:registers passes; no Scheduled-roadmap finding cites
REQ-104c.

### C5 — ROADMAP section removal · S

File: ROADMAP.md

Delete the "## §5.4 citation repair (P1)" section (:15-24). No other roadmap
section references it (grep "§5.4 citation repair" outside docs/plans history
and CHANGELOG returns only this section). Verification: npm run check:roadmap.

### C6 — CHANGELOG entry · S

File: CHANGELOG.md

New dated heading "## 2026-11-13 — §5.4 citation repair (REQ-104c/T103)" with
bullets: T103 assertions written; profile-only creation undo fixed; F-P3-8
resolved; roadmap section retired. Verification: the push pipeline derives its
commit subject from this heading, and session:close reads it.

### C7 — Increment artifacts · S

Files: docs/plans/2026-11-13-s5-4-citation-repair/{plan.md,tasks.md,aar.md}

plan.md copied byte-for-byte from this plan; tasks.md with the step table, the
red log from C2, and command results; aar.md ending with LOOP PAUSED (or LOOP
OPEN with the open items named). Created in step 0 so check-loop-artifacts
never sees a partial increment.

## 6. Blast radius

| Path | Change |
|---|---|
| holonovel/src/index.ts | C1: two novelSnapshot() calls |
| holonovel/scripts/test-workflow.ts | C2: four tests + header |
| spec/audit/req-coverage.md | C3: regenerated |
| spec/audit/review-register.md | C4: F-P3-8 Resolved, chunk-P3 stub deleted |
| ROADMAP.md | C5: section deleted |
| CHANGELOG.md | C6: dated entry |
| docs/plans/2026-11-13-s5-4-citation-repair/ | C7: plan/tasks/aar |

Not touched: spec/ requirement bodies, Appendix F, tool definitions, contract
fingerprints, package surfaces, DECISIONS.md.

## 7. Execution order and verification

1. Step 0: create the increment directory with plan.md; run the baseline
   commands in §2 and record results in tasks.md.
2. Red: grep -rn 'test("T103' holonovel/scripts (no match) is the citation red;
   add C2's first two assertions and run npm --prefix holonovel run test:workflow
   to record the two expected failures in tasks.md.
3. C1: add the two snapshots; re-run test:workflow (all green) and
   probe-profile.ts (undo succeeds).
4. C3-C6 in that order, regenerating the coverage register after C2 lands.
5. npm --prefix holonovel run test:all (regression across the server suite).
6. npm run assemble && npm run check:fast (unpiped; read the aggregate exit and
   the trailing PASS line).
7. npm run check-conformance, npm run check:registers, npm run check:roadmap,
   npm run check-loop-artifacts.
8. AAR and npm run session:close (one commit).

## 8. Edge cases and rollback

- The step-by-step loop follows [NEED_INPUT] rather than hardcoding six steps,
  capped at 8 iterations, so a ruleset-free step-count change fails one
  assertion instead of hanging.
- Characters created by earlier T138/T157 blocks live in other Novels or other
  processes; the T103 block's Novel is new, so its stack is exactly the two
  snapshots D4 relies on.
- If a harness elsewhere counts snapshots after a profile-only creation, C1
  surfaces it as a failure in step 5 and the plan stops rather than adjusting
  the other harness by guesswork.
- Rollback: revert the two snapshot lines and the harness block; the register,
  roadmap, and CHANGELOG edits revert with them in the same commit.

## 9. Out of scope

- Publication/push (§1, item 7).
- The staged-creation roster residue (D2).
- The harness test-ID label hygiene class: atest-collector blindness, zero-padded
  tokens, duplicated T408-T412 (their own P2 roadmap item).
- The other P1 citation-repair sections (§5.3, trust-core).

## Amendment A1 — holosuite evidence anchors (added during execution)

**Why.** Step 5 (`npm --prefix holonovel run test:all`) surfaced a failure class
the plan did not anticipate: the Holosuite tiers pin evidence predicates as
hardcoded `anchor("holonovel/src/index.ts", <line>, "<symbol>")` constants
(holosuite-novel.ts:31-36, holosuite-adversarial.ts:29-37,
holosuite-conformance.ts:35-37/170/192, holosuite-invariants.ts:29-32/82/85).
C1's two inserted statements shift every anchor below them: +1 for recorded
lines 4263–4811, +2 for lines above 4811. All findings were
`predicate_unresolved` (the line landed on a comment or unrelated code), i.e.
line drift, not a behavioural failure — the quick/step undo assertions and
`test:workflow` are green.

**C8 — repoint the 13 drifted index.ts anchors · S.** Update each constant to
its shifted line: 6184→6186 (create_room), 12032→12034 (verify),
13794→13796 (inboxSourcePath), 12988→12990 (share), 11722→11724 (recap, both
files), 13066→13068 (strictMode), 16760→16762 (prompt), 4354→4355
(manage_history), 11284→11286 (replayInspection), 11976→11978 (context_report,
both files), 11997→11999 (visibility_check), 9957→9959 (knowledge_query),
12783→12785 (computeBundleIntegrity). Anchors at lines before the first
insertion (12, 189, 649, 1816, 2443, 3200) are unchanged. Each new line was
verified to contain its symbol before editing.

**Verification.** `npm --prefix holonovel run test:holosuite-conformance`,
`test:holosuite-invariants`, `test:holosuite-novel`,
`test:holosuite-adversarial`, `test:holosuite-differential` all green, then
`test:all` green.

**Blast-radius additions:** holonovel/scripts/lib/holosuite-novel.ts,
holosuite-adversarial.ts, holosuite-conformance.ts, holosuite-invariants.ts.
This is the documented manual-repoint cost named by the P2 roadmap item
*Holosuite anchor repoint automation*; no automation is added here.
