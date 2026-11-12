# Independent Review — §5.12 observer resolve and resource reads

Reviewer: opencode/deepseek-v4.1-flash (cold-review subagent; no authoring context)
Base plan sha256 (cold pass): 7026e423772ad071c560c154b47262d41a30ca5eadab7a4a2365c8d34ce25eeb
Report path: `docs/plans/2026-11-11-5-12-observer-resolve-resource-reads/independent-review.md`
(per dispatch; the skill's default `<plan-id>.cold/report.md` was overridden by the parent)
Depth: standard · Stages completed: 4/5 (Stage 4 not triggered — the author made no edits during this pass)

## Isolation note

Stages ran in one reviewer context, not five fresh subagent contexts: this
reviewer is itself a child session and nesting is prohibited by its system
contract. The harness injected the repository `AGENTS.md` and
`holonovel/AGENTS.md` into this context mid-run; those are project standards the
plan cites, but their injection means instruction isolation is weaker than the
skill's model. Recorded as an Unknown, not as a finding against the plan.

Reads used: 23 file reads + 27 grep/shell evidence checks = 50 against the
standard 40 read·grep·glob budget (over budget by 10; evidence collection
stopped when each load-bearing claim resolved). Recorded as a process deviation.

## Stage 2 — comprehension (≤200 words)

The plan closes ROADMAP §5.12 and finding F-5.12-1. It does two things. First,
it removes the two `requireNotObserver()` guards that still refuse the observer
`run_command (action: resolve)` and `visibility`/`audibility`, keeping the
Player-badge refusal and point-of-view restriction. Second, it corrects the
finding's premise: the world-model resources are not refused today; instead
`room://` and `thing://` render at Player depth while `world://map`/`world://kinds`
render at GM depth. It moves those two resources onto the GM branch so all four
agree at "unfiltered state depth" (REQ-305a, REQ-366b). It gives REQ-366b a
closing depth sentence plus `_Check:_ T417`, widens Appendix F's T417 and T643
rows, extends the T417/T643 harness cases, moves the register row to Resolved,
deletes the roadmap section, and adds a CHANGELOG entry and regenerated coverage
register. "Done" means both harnesses stay green (75/75, 30/30), the guard count
drops 45→43, REQ-366b is ≤800 characters with a resolvable check, `check:fast`
and `validate:sdd` pass, the register/roadmap/loop gates pass, and one commit
lands with a clean tree.

Could not determine from the document: what the T643 visibility assertion is
supposed to assert (done bar 8 states no expected value), and whether the T417
fixture's source entity has a room.

## Stage 1 — zoom out

Claims checked against the repository:

- `index.ts:4787` and `:4819` are the two `requireNotObserver()` calls; the
  Player refusal at `:4816-4818` and the Player POV restriction at `:4792-4794`
  exist exactly as described. **Supported.**
- `requireNotObserver()` occurs 45 times in `index.ts` today, and the last
  occurrence is `:11367` — before the resource registrations (~`:12400+`). No
  resource handler calls it. **The "resources are not refused at HEAD" claim is
  correct at code level**, and the depth diagnosis is supported:
  `room-single` `isGM` at `:13448`, `thing-single` at `:13487`, `world-map`
  `:13513`, `world-kinds` `:13519`, `worldMap` annotations only for
  `game_master` at `world/model.ts:1053-1067`. The author's probe transcript
  cannot be re-run read-only; the code reading is the evidence.
- All three URIs are registered at `:12457-12459`. **Supported.**
- REQ-366b body is 593 characters (594 with newline) at `:3760`; the pinned
  draft joins to 694 characters. The draft reproduces the current body verbatim
  and appends one sentence plus `_Check:_ T417`. **Supported at 694**; the
  verification table's "706" is wrong (finding N1).
- REQ-305a `:1270` says the state surface is unfiltered (GM-level). REQ-202a
  `:3399`, REQ-202b `:3402`, REQ-596/597 `:3488-3491`, REQ-622 `:3494` all match
  the plan's characterization. **Supported.**
- `test-narrative.ts` has 75 `await test(` cases and `test-competitive-gaps.ts`
  has 30; the T417 block (`:829-880`) creates Throne Room/Anteroom, a north
  exit, and `character_01`; `readResource` is available (`:105`). **Supported**,
  with the entity-room caveat under finding M3.
- The T643 fixture (`test-competitive-gaps.ts:483-519`) has room `Bay`,
  character `Scout` = `character_01`, a ruleset bind, and the observer window at
  `:509-518`. **Supported.**
- `check-registers:strict`, `test:narrative`, `test:competitive-gaps` all exist
  (`package.json:32`, `holonovel/package.json:82,94`). README has no REQ marker
  that this change would stale (only `@spec:date`, same day). `contract-fingerprint.ts`
  carries no §5.12/Appendix F/index.ts entry. **No missing generated surface found.**

Contradictions: the draft length (694 vs 706); done bar 8 states no expected
assertion; the plan's own edge case about the source room is resolved by a
mitigation that does not work (M3).

## Stage 3 — critics

### Design lens

**B1 [design] — T643 `visibility` target `Bay` cannot succeed.** Done bar 8 and
Phase 3.2 add `run_command { action: "visibility", source: "character_01",
target: "Bay" }` and require the suite to stay 30 passed. `visibility` resolves
targets only through `resolveSpatialActor` (entities/NPCs, `index.ts:4755-4761`)
and `resolveSpatialThing` (world things, `:4764-4771`), then refuses with
`NOT_FOUND` at `:4803-4804`. A room name is neither, and there is no room
branch. The assertion fails with `Target 'Bay' not found.` Done bar 8 also
never states what the assertion should observe. Must change: use a resolvable
actor/thing target and name the expected field/value, or assert the no-target
visible-things form.

**M1 [design] — REQ-366a versus hazard annotations is not reconciled.**
Done bar 3 commits `room://` to rendering `**Annotations:**` for the observer —
trap/encounter metadata including `snuff`/`spill` counts and the `resource`
countdown name (`index.ts:13462-13468`). REQ-366a
(`spec/02-requirements.md:3757`) says "The observer badge SHALL NOT see GM-only
surfaces — secrets …, faction clock states …, countdown tick positions …, or the
GM context." The plan dismisses the conflict by asserting "REQ-366a's exclusion
list is scoped to `badge_briefing`" (plan:49-53). That scoping is an
interpretation of a REQ whose final sentence has "The observer badge" as its
subject; it is not stated text. `world://map` already exposing annotations is
precedent, not reconciliation. Must change: either amend REQ-366a to name its
scope, or keep annotations off the observer's `room://`, and assert the chosen
outcome.

**M2 [design] — the annotation depth change ships untested.** Done bar 5's T417
clause names ids, property values, and containment chain; done bar 7 asserts ids
and `**Properties:**` only. No assertion covers `**Annotations:**`, although
that is the one observable behaviour that changes beyond the Player→GM depth
labels. A test that asserts the depth labels but not the annotation line leaves
M1's decision unexercised.

**M3 [design] — the T417 source-room mitigation is incorrect.** The plan's edge
case says "`visibility` with an explicit `source` does not need an active
entity" (plan:339-343). It still needs a room: `resolveSpatialActor` returns
`entity.current_room` (`index.ts:4755-4761`) and the query refuses at `:4796`
when it is null. `resolveIntentWorld` is pure (`:6157-6220`) and never sets it,
and no step establishes the source's room. If `character_01` is roomless in the
T417 fixture, the planned assertion returns
`Source 'character_01' has no resolvable location.` Must change: add a step that
establishes the source's room (GM-side `execute look`/movement before the badge
switch) or evidence that creation sets `current_room`, and cite it.

**M4 [design] — done bar 8 is not an acceptance criterion.** "adds … assertions;
the suite stays 30 passed, 0 failed" specifies no observable outcome. Stage 5's
rule (acceptance criteria executable and observable) is not met; an implementer
must invent the assertions. Bundle with B1.

### Structural lens

Ordering is sound: baseline → probe → code → harness → spec/catalogue → generate
→ verify. Rollback is a single revert and correctly excludes data/publication.
No step is unexecutable except B1. The generated surfaces named
(`holonovel.md`, `holonovel/holonovel.md`, `build-phase-map.md`,
`req-coverage.md`) match what `assemble` / `validate --write-register` produce.
The blast-radius table names every file a change entry touches; the only near-miss
is that done bar 11's coverage-register refresh is listed as generated, which is
correct. README is not required (`@spec:date` is unchanged for a same-day spec
edit).

### Style lens

Terms are consistent (`observer`, GM depth, unfiltered state depth, depth
inconsistency). Two wording defects: the draft-length figure disagrees between
§1/done bar 4 (694) and the verification table (706); and `## Scheduled-roadmap`
is cited as `:1702-1712` where the `##` heading is at `:1700` (the row is
`:1704-1712`, correct). The plan calls `world://map`/`world://kinds` "the four
world-model resources" together with `room://`/`thing://` while the resource
catalogue also has an implicit rooms collection (`:13440`); not ambiguous in
context.

## Stage 5 — readiness

- File paths exist and are named; the two code predicates and the four spec
  anchors are cited to the line. Pass.
- Function surfaces: `requireNotObserver`, `resolveIntentWorld`, the two `isGM`
  predicates, and `worldMap` are correctly located. Pass.
- Acceptance criteria: B1 (unresolvable target), M3 (room precondition), and M4
  (no stated expected values) fail readiness. Everything else is observable.
- No step says "handle errors" or "as appropriate" without specifics; Phase 3.1's
  parse-after-refusal instruction is concrete.

## Findings, severity-ranked

| # | Severity | Tag | Finding | Evidence |
|---|---|---|---|---|
| B1 | Blocker | design | T643 `visibility` target `Bay` is a room; visibility targets resolve only entities/NPCs/things and return `NOT_FOUND`. The done bar cannot pass and the expected assertion is unspecified. | plan.md:126-129, 299-301; index.ts:4803-4804, 4755-4771 |
| M1 | Major | design | `room://` now shows hazard `**Annotations:**` to the observer while REQ-366a says the observer SHALL NOT see GM-only surfaces; the "scoped to badge_briefing" reading is asserted, not evidenced. | plan.md:49-53, 99-103; spec/02-requirements.md:3757; index.ts:13462-13468 |
| M2 | Major | design | Annotation depth (the one behaviour beyond depth labels) has no assertion in T417 or T643. | plan.md:107-112, 117-125; spec/appendices-reference.md:1872 |
| M3 | Major | design | The source-room mitigation is wrong: explicit `source` still requires `current_room`, which nothing in the fixture establishes. | plan.md:339-343; index.ts:4755-4761, 4796, 6157-6220 |
| M4 | Major | design | Done bar 8 states no expected outcome, so the acceptance criterion is not executable/observable. | plan.md:126-129 |
| N1 | Nit | clarity | Draft length stated as 694 in §1/done bar 4 and 706 in the verification table; measured draft is 694, so the check as written would not match. | plan.md:60, 105, 375 |
| N2 | Nit | clarity | `## Scheduled-roadmap` cited as `:1702-1712`; the `##` heading is `:1700`, the row is `:1704-1712`. | plan.md:130-131; spec/audit/review-register.md:1700-1712 |
| N3 | Nit | clarity | "create a portable thing" — `manage_world` has no `portable` input; portability is the default (`fixed: false`). | plan.md:117-118, 294; index.ts:5701, 5737-5739 |
| N4 | Nit | clarity | `grep -c 'isGM = .*observer'` = 2 depends on the predicate staying on one physical line; a wrapped predicate fails the check despite correct code. | plan.md:374 |

### Notes (no finding)

- Focus 1 stands: at code level the resources are not observer-refused, and the
  cited evidence lines support the depth diagnosis exactly.
- Focus 3 stands: the draft is 694 characters, 5 sentences including `_Check:`.
  Family coverage is satisfied — `checkFamilyCheckCoverage` keys on the REQ base
  and REQ-366d already carries a check (`scripts/lib/req-checks.ts:168-179`), and
  the family form is accepted for REQ columns (`scripts/validate.ts:955-958`).
  T417 is the appropriate home; T643 is the ruleset-bound second surface.
- Focus 4: baseline counts 75/30 and 45→43 are correct; `Bay` exists and
  `character_01` is `Scout`. The T643 target choice, not the fixture, is the
  defect (B1).
- Focus 5: no file named in a change entry is missing from the blast-radius
  table; `req-coverage.md`, both assembled specs, `build-phase-map.md`,
  CHANGELOG, and the increment directory are all present. README and the
  contract fingerprints are correctly out of scope.

## Unknowns

1. Whether `character_01.current_room` is populated in the T417 fixture at that
   point (would turn M3 into a hard failure). Not settleable without running the
   harness, which is outside a read-only pass.
2. The author's probe transcript (the `/tmp/opencode` run) cannot be re-executed
   read-only; the code reading supports it but is not the same evidence.
3. Whether the REQ-coverage audit (`validate -- --write-register`) accepts a
   `_Check:_ T417` on REQ-366b against the T417 row's family citation `REQ-366`;
   the family handling observed is in the Pattern Buffer map, not the coverage
   audit. `checkFamilyCheckCoverage` behaviour is verified; the coverage-audit
   mapping is not.
4. Harness pass counts were verified by `await test(` counts, not by execution.
5. Instruction isolation was weakened by injected `AGENTS.md` files (see above).

## Verdict

4/5 stages (Stage 4 not triggered — no author edits during this pass).
1 Blocker, 4 Majors, 4 Nits.

independent-review FAILED.

## Diff re-review

Scope: revision packet hunks 1–4 and the response section only; unchanged text
was not re-read and no new-lens sweep was run (budget: 10 reads).

### Prior findings

- **B1 — RESOLVED.** `resolveSpatialActor` resolves entities/NPCs only
  (`holonovel/src/index.ts:4755-4761`); `resolveSpatialThing` resolves things
  only (`:4764-4771`); an unresolved target returns `NOT_FOUND` at `:4804`.
  `Bay` is a room (`holonovel/scripts/test-competitive-gaps.ts:491`) and is no
  longer a target; `Scout`/`character_01` is an entity (`:492`, `:494`);
  `lantern` is a thing. Correct fix.
- **Fixture claims — supported.** T417 creates `Throne Room`/`Anteroom` and
  `character_01` (`holonovel/scripts/test-narrative.ts:868-872`); the case is
  at `:910-919`. T643 creates room `Bay` and character `Scout` with no thing
  (`test-competitive-gaps.ts:491-492`); observer window at `:509-518`.
- **N3 — RESOLVED.** `fixed` is the take-prevention flag (`index.ts:5511`);
  `MANAGE_WORLD_SCHEMA` (`:5503-5539`) has no `portable` input.
- **M4 — accepted.** Done bar 8 names the asserted field and forbids
  `[FORBIDDEN]`; the value is deliberately unfixed for `can_see`.
- **M2 — accepted** as an explicitly recorded soft gap (hunk 4, `aar.md`).
- **M3 — accepted on the plan's evidence** (probe result in hunk 3;
  `current_room` is the field returned at `:4758` and required at `:4796`).
- **REQ-366b draft — unchanged**, 694 characters / 4 sentences at
  `plan.md:105`, inside the 800/8 limits.

### New findings (changed lines only) — all corrected after this pass

- **R1 [Nit][clarity]** — the verification table still read `draft: 706`.
  Corrected to 694.
- **R2 [Nit][clarity]** — done bar 7 attributed `[NOT_FOUND]` to
  `resolveSpatialThing`; the resolver returns `undefined` and `run_command`
  raises the error at `index.ts:4804`. Citation corrected.
- **R3 [Nit][clarity]** — "the `Bay` room is not lit" rested on a room default
  rather than a read. Rewritten to state that the assertion is field presence
  and does not depend on the lit state.
- **R4 [Nit][clarity]** — the response overstated done bar 8 as naming an
  expected value; the plan text (field presence) was already correct.

### Unknowns — resolved by probe evidence

1. `resolveIntentWorld`'s result key `status` — observed as
   `"status": "resolved"` in the author's resolution-shape probe (recorded in
   `plan.md` §2).
2. `manage_character (action: create)` populating `current_room` — observed:
   the targetless `visibility` returned `"room": "Throne Room"` and the
   target-with query resolved, so the source actor carries a room.

### Deferred (unchanged text — next full pass or build-review)

- **M1 [Major][design]** — REQ-366a versus hazard `annotations` is carried
  forward under the recorded "scoped to `badge_briefing`" reading, not resolved
  by new normative text. The plan records the alternative and the soft-gap
  note.
- **N2 [Nit]** — `## Scheduled-roadmap` citation wording.
- **N4 [Nit]** — `isGM` grep brittleness.

### Verdict

B1 resolved; no new Blocker or Major in the reviewed scope. 4 Nits, all
corrected by the author after this pass; M1 and N2/N4 Deferred from unchanged
text.

independent-review passed.

## Revision binding (author-recorded, not reviewer-authored)

Plan sha256: 8753aa7f195b1ee6ceec80a4141f0f94387db3b3808aa6e4ffe1fc709ac6c75a

Provenance of this binding:
- Base plan reviewed cold: sha256
  `7026e423772ad071c560c154b47262d41a30ca5eadab7a4a2365c8d34ce25eeb`, verdict
  `independent-review FAILED.` (blocker B1), then `independent-review passed.`
  after the 4-hunk revision recorded in `plan.revision-diff.md`.
- Revision packet (`plan.revision-diff.md`) is itself part of the reviewed
  scope for hunks 1–4.
- The only post-review change is the build-time delta recorded in the same
  packet: `room://` URIs percent-encode a multi-word room key. It is a
  condition-only amendment (no new file, gate, or destructive step) and is
  verified by build-review against the T417 harness run, not by the cold
  reviewer — the reviewer did not see it.
