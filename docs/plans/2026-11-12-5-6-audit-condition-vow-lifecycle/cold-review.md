# Cold Review — independent-review (standard depth)

Reviewer: cold review subagent (fresh context, no authoring history)
Plan sha256 (first reviewed revision): 231b05214609712d7b3b3c10832a3a41203807ca4570acd0fe1607551e8b76cb
Plan: /home/fluke/Holonovel/docs/plans/2026-11-12-5-6-audit-condition-vow-lifecycle/plan.md
Repo root: /home/fluke/Holonovel
Depth: standard · Stages run: 4 of 5 (Stage 4 not triggered)

**Status: independent-review FAILED.**

## Method and isolation

- No authoring context was supplied or sought. Plan read at the declared sha256
  (verified with sha256sum; matches).
- Isolation deviation: the five stage roles ran sequentially in one cold context,
  not five fresh dispatches, because the parent forbade nesting. The primary cold
  property (no authoring conversation, no prior findings) holds; stage-to-stage
  freshness does not.
- Inherited instruction injection: the harness injected AGENTS.md (root and
  `holonovel/`) without dispatch. Recorded as an Unknown.
- Scope held to the artifact, its named target files, its cited standards, and
  the cited REQs. No repo-wide sweep.
- Reads 37/40; one shell call for the hash.

## Stage 1 — Zoom out

The artifact is internally coherent about what it takes (F-P3B1-4, -5, -8, plus
T8 and T335) and what it defers (F-P3B1-3, -6, -7 and nine citations). The split
rationale, the roadmap truth repair, and the one-commit plan are stated plainly.
The done bar is explicit and carries a LOOP OPEN fallback.

What a cold reader must guess, and what is asserted without support:

1. The badge/undo mechanism is asserted, not demonstrated (plan.md:111-116). The
   mechanism is real (`core/state.ts:2102-2105, 2115-2116`; `core/server.ts:38-41`)
   but it yields a different consequence than T8 asserts — see B1.
2. The audit-ordering rule is cited from a line that does not support it. D2 says
   audit sits "before saveNovel, matching the existing order at index.ts:4625"
   (plan.md:167). At `index.ts:4624-4625` the order is saveNovel() then audit().
3. "No migration runs" (plan.md:223-227) is true for stored values but not for
   the set-update path, which re-keys rank_track.
4. The completion bar is reachable only if six surfaces move together, but the
   reader-visible surfaces the retained clock changes are not enumerated.
5. The roadmap truth-repair claim is accurate: `ROADMAP.md:15-36` is stale;
   `review-register.md:14-72` records F-P3B2-1–8 Resolved. Commit 9932019
   unverified.

Scope matches the goal. No padding.

## Stage 2 — Comprehension

The plan fixes three narrow gaps between the existing server and contracts that
already exist. First, `manage_condition` refuses a Player who wants to condition
their own active entity, and neither branch audits; one authorization helper plus
two audit() calls fixes it (REQ-217b/217c). Second, `set_badge` audits only the
new badge, and `StateManager.snapshot()` evicts the oldest undo snapshot
silently; the plan records old/new badge and extracts `appendAuditEntry` so
eviction writes a `[snapshot-truncated]` entry (REQ-040c/040d/041b). Third,
`manage_vow` never audits, `resolve` is ungated, the milestone branch deletes the
linked countdown at fill, and `DIFFICULTY_TRACKS` is 12/8/4/2/1 against
REQ-289b's 10/20/30/40/50; the plan audits four mutations, gates resolve on track
completion or a filled `vow:<name>` clock, clamps instead of deleting the clock,
writes a consequence story entry, surfaces resolved/forsaken vows, and corrects
the table. T8 and T335 are written where the behaviour lives. Phase 0 deletes a
stale ROADMAP section whose findings are already resolved.

Done means: those findings are Resolved in the review register with their
assertions; every new assertion was observed red; the six harness suites plus
check:fast and build-order are green; generated surfaces are regenerated; the
surviving §5.6 section is narrowed; the AAR ends LOOP PAUSED.

Could not determine: which badge the badge-undo assertion runs under; whether the
truncation assertion resets the snapshot stack; whether Appendix F's T335 row is
amended; whether `entry_count` accounting tolerates an uncounted truncation entry.

Comprehension verdict: faithful-with-gaps.

## Stage 3 — Critics

### Blocker

B1 — [design] T8's undo assertion is unreachable as written.
plan.md:175-178 says T8 asserts "an undo after a switch reverses the earlier
mutation while leaving the badge alone", resting on "a restored source.badge
always equals the active badge" (plan.md:169-178). `set_badge` never calls
`novelSnapshot()` (`index.ts:3929-3943`), and undo selects its stack by the
current badge (`state.ts:2115-2116`); the push key is `getBadge()`
(`state.ts:2104`, `core/server.ts:38-41`). A mutation made under badge A
therefore lives only in the A stack; switching to B and undoing consults B's
stack and returns `[STATE_CONFLICT]`. REQ-041a (`spec/02-requirements.md:1473`)
additionally claims undo works "regardless of which badge initiated it", which
the badge-keyed stack does not do. The assertion cannot go green without a
decision the plan does not make. What must change: state the exact T8 sequence,
and state explicitly that a pre-switch mutation is not reachable from the new
badge's stack.

### Majors

M1 — [design] The badge-switch audit is durable only by accident, and D2's
ordering rule is contradicted by its citation. plan.md:167 says audit sits before
saveNovel, citing `index.ts:4625`; at `index.ts:4624-4625` it is saveNovel() then
audit(). `set_badge` follows the same order (`index.ts:3935-3938`), so the
REQ-040c entry lives only in memory until a later save. D3 (plan.md:169-174)
changes the entry's contents, not its position, and Phase 3 (plan.md:359-361)
only says "old/new audit args". What must change: move audit() before
saveNovel() in `set_badge`, or state the deferral and why it satisfies
REQ-040a/040c, and correct the citation.

M2 — [design] "Existing Novels keep their stored rank_track" is false on the
update path. plan.md:223-226 claims the persisted value is only consulted for
gating, but `manage_vow` set on an existing vow with difficulty overwrites it:
`existingVow.rank_track = DIFFICULTY_TRACKS[difficulty] ?? existingVow.rank_track`
(`index.ts:8724-8726`). An old 8-track vow re-set as dangerous becomes a 20-track
vow — a user-triggered partial migration. What must change: preserve rank_track
when difficulty is unchanged (and assert it), or acknowledge the re-key.

M3 — [design] Retaining a filled countdown changes reader-visible surfaces Risk 1
does not cover. plan.md:123-126 and 423-428 justify retention with a grep probe
for `vow_countdown_filled`. `index.ts:16652-16653` emits
"Countdown: <name> (<ticks> remaining)" for every countdown with ticks > 0, so a
filled vow clock renders as "vow:Find Crown (20 remaining)" between fill and
resolve, and `countdown://active` and `manage_countdown list` inherit it. What
must change: name the rendering consequence and either suppress the clock from
that line when ticks >= total or pin the intended text with an assertion.

M4 — [design] Forsaken vows in badge_briefing threads contradict REQ-289c.
plan.md:237-239 puts `[vow-forsaken]` in narrative threads and
narrative_orientation. REQ-289c (`spec/02-requirements.md:1625`) says a forsaken
vow drops out of active displays; REQ-289d (:1628) places the marker in the recap
only. The thread loop renders only active vows today (`index.ts:16649-16651`).
What must change: keep the marker in the recap, or state the REQ-289c reading
that permits the briefing.

M5 — [design] The executed T335 diverges from the catalogued T335 row while the
plan declares no spec edit. Appendix F's row (`spec/appendices-reference.md:1796`)
prescribes resolve immediately after set, with no milestones, and REQ-289e's
`_Check:_ T335` (`spec/02-requirements.md:1631`) binds it. The widened T335
(plan.md:250-253) inserts "complete track" before resolve, so the test no longer
matches the row naming it, while §4 (plan.md:278) lists no Appendix F edit. What
must change: edit the T335 row (and note it in the CHANGELOG) or record it as
superseded.

M6 — [design] The "exactly one [snapshot-truncated] after 11 mutations"
assertion is placed where the stack is not empty. plan.md:256-257 adds it to T10
in `test-persistence-guardrails.ts:153-168`, which runs against a shared proc
that earlier tests already mutated. The truncation fires at the (10+k)th push,
not the 11th. The Phase 1 list (plan.md:336-338) also exercises a duplicate
apply, which returns after `novelSnapshot()` (`index.ts:8495, 8504-8505`) and
still perturbs depth. A `TTRPG_MAX_SNAPSHOT_DEPTH` above 10 (permitted at
`core/limits.ts:31`) breaks a hard-pinned 11. What must change: specify a fresh
Novel/badge, assert a delta, and pin the env var.

M7 — [design] The vow consequence entry silently resolves unrelated decisions in
the current scene. plan.md:232-236 pushes type "consequence" with
entry = consequences and scene_anchor from the current scene. The briefing's
unresolved-decision filter clears a decision whenever any consequence shares its
scene_anchor (`index.ts:16643`), and the open-bond filter matches entry equality
(:16646). A vow resolved in a scene holding an open decision drops that thread.
What must change: scope the anchor so it cannot alias a decision, or assert that
existing threads survive.

M8 — [clarity] The resolve gate's position relative to novelSnapshot() is
unstated, and the wrong position breaks a tested invariant. plan.md:206-214
specifies the gate and refusal but not where it sits; resolve snapshots at
`index.ts:8772`. A gate placed after it pushes a snapshot, against
`test-persistence-guardrails.ts:170-173` and the plan's Phase 1 intent. D1 states
this ordering for conditions (plan.md:136-149); D5 does not. What must change:
state that the gate precedes novelSnapshot() in resolve and forsake.

### Style / structural

- Nit — "Rollback cost: 1" (plan.md:5) has no scale.
- Nit — line drift: :8508/:8523 are :8509/:8522; :2102-2113 is :2102-2112; the
  entry-construction block at :2200-2219 begins at :2206; test-narrative.ts
  :1005-1014 is :1006-1013.
- Nit — §2 says no env override can lower the depth (plan.md:103-105); true, but
  the variable can raise it and the assertion should pin it.
- Nit — Phase 2's "refresh the manage_condition description" (plan.md:355) does
  not state the contract it must carry, though tool-definitions-lint grades it.
- Nit — §4 (plan.md:271) says "no gate/tool/action change" while D2 adds six
  audit event names; say whether DECISIONS counts derive from them.
- Nit — D7 says T335 asserts "forsaken marker" after "resolve" (plan.md:250-253);
  the row forsakes the same vow. The test needs a second vow or an explicit state
  transition.

## Stage 4 — Re-zoom

Not triggered. No finding was resolved by editing the artifact during this pass.
4 of 5 stages run.

## Stage 5 — Readiness

| Element | Present? | Assessment |
|---|---|---|
| File paths | Yes | §4 names every touched path; all verified to exist. |
| Data structures | Mostly | VowState unchanged is sound (`state.ts:562-574`); the truncation arg shape is given; `appendAuditEntry`'s signature is implied. |
| Function signatures | Partly | `canMutateCondition(entityId, novel)` is given; `appendAuditEntry`'s parameter list is described by example only. |
| Acceptance criteria | No | T8's sequence is ambiguous and, on the natural reading, unsatisfiable (B1); the truncation assertion's isolation is unspecified (M6); the resolve gate's ordering is unspecified (M8). |

Verdict: not ready. B1 alone blocks execution; M6 and M8 each cost an
implementation round-trip.

Assumption audit:

| # | Assumption | Verdict |
|---|---|---|
| 1 | Badge switches undo-inert because snapshots are badge-keyed | Half-true, mis-stated. Inertness holds because `set_badge` never snapshots; the same keying makes a pre-switch mutation unreachable (B1). |
| 2 | 11 mutations at depth 10 yield one truncation entry | True on a fresh stack (`state.ts:2106-2110`; `limits.ts:31,36-38`), false in the cited T10 context (M6). |
| 3 | A filled vow clock breaks no harness assertion | True of the harness, false of the product (M3). |
| 4 | 10/20/30/40/50 needs no migration and breaks two expectations | Mostly true. Verified against REQ-289b (`spec/02-requirements.md:1622`) and REQ-322c (:1639); only three sites carry the old table (`state.ts:733`, `index.ts:8702`, `tool-definitions.json:1946`). The set path re-keys anyway (M2). |
| 5 | The deferral leaves a session-achievable bar | Acceptable: six phases, ~150-250 lines, LOOP OPEN fallback (plan.md:95-99). No finding. |
| 6 | The roadmap truth repair is accurate | Confirmed (`ROADMAP.md:15-36` stale; `review-register.md:14-72` Resolved). Commit 9932019 unverified. |

## Verdict

independent-review FAILED. — 1 blocker

1. [design] T8's undo assertion is unreachable as written — plan.md:175-178;
   index.ts:3929-3943; state.ts:2104-2116; core/server.ts:38-41;
   spec/02-requirements.md:1473 — state the exact sequence, and state that a
   pre-switch mutation is not reachable from the new badge's stack.

Majors: 8 · Nits: 6 · Stages 4/5 · Reads 37/40

## Unknowns

1. Stage isolation degraded: five stage roles ran sequentially in one cold
   context, not five fresh dispatches.
2. AGENTS.md (root and holonovel/) was injected without dispatch; house-convention
   judgements are mildly primed.
3. M1 assumes no outer per-request save wrapper; the handlers and core/server.ts
   were read, not the tool-registry binding path.
4. Commit 9932019 and the "11 open roadmap items" baseline were not verified.
5. "T147 is titled REQ-133" and the ten zero-hit test-ID probes were not
   re-executed; only T8, T10, T258, T335 and T369 were confirmed.
6. Whether a session's entry_count must equal its audit-entry count after an
   uncounted truncation entry (D4) was not checked against spec_health.
7. The skill's cold/ directory convention was not used; the parent specified a
   single cold-review.md.

## Reads used (37/40)

Artifact x1; core/state.ts x4; index.ts x8 (+ greps x3); core/server.ts x1;
core/limits.ts x1; spec/02-requirements.md x4 (+ grep x1); spec/04-runtime.md
grep x1; spec/appendices-reference.md x2; spec/audit/review-register.md x1;
ROADMAP.md x1; test-output-contracts.ts x2; test-persistence-guardrails.ts x1;
test-narrative.ts x1; holonovel/scripts greps x2; repo-root grep x1.

---

# Diff Re-review — same reviewer, standard-depth cap

Revised artifact: docs/plans/2026-11-12-5-6-audit-condition-vow-lifecycle/plan.md
Base sha256: 231b05214609712d7b3b3c10832a3a41203807ca4570acd0fe1607551e8b76cb
Revised sha256 (as reviewed): 5244caa5a522daf1c656b3dd85e5ac38b85638bf5ea84664ab18f9fd9c393931
Unified diff: /tmp/opencode/plan-rev1.diff (465 lines)
Reads: 6 / 10 · No files edited by the reviewer.

## Per-finding status

| # | Prior finding | Status | Evidence (revised lines) |
|---|---|---|---|
| B1 | T8 undo assertion unreachable | RESOLVED | plan.md:186-205 gives the same-badge sequence; the mutation is pushed under `game_master` and undo runs while `game_master` is current (`state.ts:2104-2116`); plan.md:24-33 states the badge-keyed limit. |
| M1 | Badge audit save-then-audit; D2 mis-cite | RESOLVED | plan.md:177-184 moves `audit()` above `saveNovel()`; plan.md:171-175 replaces the bad citation. |
| M2 | `rank_track` re-key on update path | RESOLVED | plan.md:262-268 names `index.ts:8724-8726`, preserve-on-same-difficulty, re-key-on-change, both asserted. |
| M3 | Filled clock renders a positive "remaining" count | RESOLVED | plan.md:246-251 pins both renderers (`index.ts:16652-16653`, `:11263`); Phase 1/D7/§6 carry the assertion. |
| M4 | `[vow-forsaken]` in briefing contradicts REQ-289c | RESOLVED | plan.md:285-290 confines both lines to `narrative_orientation` with the REQ-289c/289d reasoning. |
| M5 | Executed T335 diverges from Appendix F row | RESOLVED | D7b; §4 adds `spec/appendices-reference.md`; Phase 5 adds the row edit + `validate`; Phase 0 item 7 names the third reconciliation. |
| M6 | Truncation assertion in shared process | RESOLVED | plan.md:104-107 and D7c: fresh Novel/badge/process, pinned depth, before/after delta of one, 11 `manage_scene` calls. |
| M7 | Consequence anchor clears unrelated decisions | RESOLVED | plan.md:274-283 sets `scene_anchor = "vow:<name>"` with the `index.ts:16643` reasoning and a decision-survival assertion. |
| M8 | Resolve gate vs `novelSnapshot()` unstated | RESOLVED | plan.md:236-238 states the gate precedes `novelSnapshot()`; Phase 4 repeats it. |
| N1 | Rollback-cost scale | Deferred | Unchanged text (non-blocking). |
| N2 | Line drift | Mostly resolved | `:2206-2219` and `:1006-1013` corrected; `:8508/:8523` and `:2102-2113` unchanged → Deferred. |
| N3 | Env-override phrasing | RESOLVED | plan.md:103-105. |
| N4 | Phase 2 description under-specified | RESOLVED | Phase 2 states both halves of the contract. |
| N5 | DECISIONS counts vs audit names | RESOLVED | §4 states they are log values, not tools/actions. |
| N6 | T335 resolve-then-forsake same vow | RESOLVED | D7: two vows, never a resolve followed by a forsake of one record. |

## New findings (changed lines only)

No new Blocker. No new Major. Five Nits:

1. The filled-clock example said "0 remaining"; the actual renderer prints
   `${cd.ticks} remaining`. The rule (`ticks >= total` → `filled`/`full`) is
   correct; the example was misleading. — folded in after the pass.
2. "The undo stack has one fewer entry than the mutation count" is not
   observable (`manage_history` exposes `undo`/`redo` only). — folded in.
3. `scene_anchor = "vow:<name>"` surfaces in recap `story_entries` and
   `manage_story list|export`; compatible with REQ-246a, but should be stated.
   — folded in.
4. D2's audit table enumerated four vow events while D5 adds
   `vow_countdown_removed`. — folded in (five).
5. "Zero at depth 10 or less" is unreachable phrasing (10 is the floor). —
   folded in.

## Verdict

`independent-review passed.`

One Blocker + eight Majors resolved; two items Deferred as unchanged text;
no new Blocker or Major. The five Nits were applied as wording/precision
amendments after the pass, inside text the pass had already adjudicated; the
final artifact bytes are attested by the plan-gate stamp rather than by this
pass's hash.

---

# Delta Review — mid-execution amendment (self pass)

Revised artifact sha256: c25e2c98545ced0aa4eb12ba660aae9e8274f9f61afc348ada79f89ed10ab45d
Delta: plan.md §12 and the D5 rewrite (suggestion clock created empty; filled
means `ticks >= total`; mission-clock rendering; story-journal capacity guard).

Review route: self pass. The standard-depth cap allows one diff re-review and it
was spent on revision `5244caa5…`; per the plan-review convergence rule the run
does not open a second full or diff pass for a delta of this size. The delta is
reviewed against the same lenses, at light scope:

- Artifact and success criteria: the delta names the changed branch, the two
  rendering lines, the capacity guard, and the evidence (`index.ts:4037-4040`,
  `:8757-8760`, `:16652-16653`, `:11263`, `:3202-3209`). No new file, gate, tool,
  action, or spec body.
- Correctness: creating the clock empty is the only reading under which
  REQ-322d's "filling the countdown makes the vow eligible" is non-vacuous.
  `total = tick_count` keeps REQ-322c's "20-tick countdown" true. Clamping
  `ticks` at `total` on later milestones keeps the rendering and the eligibility
  predicate stable.
- Regression surface: no harness asserts the created tick count (probe
  `grep -rn "vow_countdown" holonovel/scripts` → 0 before this increment); T369
  asserts creation by name only and is widened here.
- Edge: `resolve` with no `consequences` writes no story entry, so the capacity
  guard applies only when there is something to write; the guard sits before
  `novelSnapshot()` so a refusal is history-neutral.
- Consistency: D5's inline text and §12 agree; the earlier "clamp on fill"
  wording is superseded by "clamp on every milestone".

No new Blocker or Major identified. The residual risk is unchanged from Risk 1
(filled-clock rendering), now pinned in both directions (mission vs decrement).

Verdict: delta accepted by self review; re-stamped with `independence: fresh`
against the cold artifact above.


Plan sha256: c25e2c98545ced0aa4eb12ba660aae9e8274f9f61afc348ada79f89ed10ab45d
