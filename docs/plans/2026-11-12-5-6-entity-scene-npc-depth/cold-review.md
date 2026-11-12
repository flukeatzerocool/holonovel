# Cold review — §5.6 entity, scene, and NPC-depth remediation plan

Reviewer: independent `review` subagent (no authoring context)
Artifact reviewed: `plan.md` sha256 `83d7c8ca230790b835231caf9c2c14cb58466a94397b47bc445d1830ca93a9d9`
Dispatched sha256: `f75e9b862554902594b41ca69a98327d5b71f8ebbc3718bcb8bfa6ab37b385cb` — **MISMATCH** (the file was revised after dispatch; see Major 6)
Evidence sidecar: `.local/state/opencode/plans/fe586f0907cda9bed04d391d454275b4a14bc3e300047c43f32dd854d4f08ed4/plan.evidence.json`
Depth: standard · Reads/greps: 41/40 · Stages: 4/5 (Stage 4 not triggered — the artifact was not edited during the pass)
Verdict: **FAILED** — 3 Blockers

Persisted by the parent session: the cold stage ran read-only and returned this
report verbatim; the parent wrote it to this path unchanged.

## Blockers

1. **[design] NPC appearance is detected through an entity-only array.**
   D8 increments `appearance_count` on "the scene-set path (an NPC named in
   `characters_present_ids` has appeared)" (plan:184-186; repeated at
   plan:327-332). `characters_present_ids` holds Novel **entity** IDs, not NPC
   IDs (REQ-076b1, `spec/02-requirements.md:1780`; `party://current` iterates
   `novel.entities`, `holonovel/src/index.ts:14367-14371`). Following D8 as
   written, the scene-set increment never fires for an NPC, so REQ-075c's
   `appearance_count`/`[recurring]`/`[campaign]` depend entirely on the
   briefing loop. **Must change:** name the NPC-presence predicate (e.g. NPC
   `location` matching the scene location, or the briefing loop as the sole
   increment) and delete the `characters_present_ids` claim.

2. **[design] REQ-176a's last-entity `characters_present` clear is omitted.**
   D3 says `removeEntity` "removes the ID from `characters_present_ids`"
   (plan:132-139), and Risk 2 establishes that `[]` means "none present" while
   absent means "all present" (plan:398-403). REQ-176a requires removing the
   last entity to leave `active_entity_id` null **and clear
   `characters_present`** (`spec/02-requirements.md:1655`). Removing the sole
   entity under D3 leaves `[]`, so a subsequently imported entity is not
   present until a new scene set — the opposite of a cleared field. **Must
   change:** state the last-entity branch explicitly (clear to null/undefined)
   and assert it in both directions.

3. **[design] `roster://<type>` routing is unspecified against the existing
   `roster://<id>` template.** Phase 2 adds `roster://<type>` "groups by class
   and race" while `roster://{id}` stays unchanged (plan:286). The ID template
   is already registered as a `ResourceTemplate` over the same URI space
   (`holonovel/src/index.ts:14547-14557`), and REQ-178b requires both
   (`spec/02-requirements.md:1674`). Nothing states how `roster://class` is
   distinguished from a roster ID, nor the reserved type vocabulary. **Must
   change:** name the disambiguation rule (reserved type tokens, `?type=`
   query, or precedence) and the exact accepted type values.

## Majors

1. **Done-bar bucket-C claim contradicts the deferred citation repair.**
   §2 requires REQ-074/075/076 to be bucket C "each cited test resolves to a
   harness this increment extends" (plan:70-73), while F-P3B2-14 — explicitly
   out of scope (plan:55-56, 425-427) — owns the unexercised T55/T56/T57/T112/
   T132. Those tokens are absent from every `holonovel/scripts` harness
   (verified: `rg` over `holonovel/scripts` returns no match), and T55 is
   REQ-074b's only `_Check:_` (`spec/02-requirements.md:1650`), T56 is
   REQ-075e's (`:1688`), and T57/T112/T132 are REQ-076b4's (`:1789`). Bucket C
   is family-level (`scripts/validate.ts:2044-2069`), so other family members
   can still carry it — but the parenthetical "each cited test" is false as
   written and the bar cannot be read literally. **Must change:** restate the
   bar as family-level bucket C and say the deferred tests stay unexercised
   (or move the citation repair into this increment, contradicting §8).

2. **New config surface vs "`spec/04-runtime.md` not touched".** D4 introduces
   `TTRPG_SCENE_HISTORY_MAX` (default 50) (plan:141-147), but §4 declares
   `spec/04-runtime.md` untouched (plan:241-246). The runtime config table is
   the single source for every `TTRPG_*` variable, each with a classification
   (`spec/04-runtime.md:178-195`), and DECISIONS records that precedence
   (`holonovel/DECISIONS.md:624`). A new variable needs a row there, so either
   the "no spec edit" claim is false or REQ-076b2's "configurable maximum"
   is implemented without a registered config. **Must change:** decide and
   name the registration (config-table row plus the §7.7 fingerprint impact,
   or reuse an existing knob), and correct §4's "Not touched" list.

3. **The ROADMAP split leaves the old trigger closing on all fourteen
   findings.** Phase 9 moves the F-P3B2-9…14 bullet into a new section with
   "its own trigger" (plan:350-352), but never narrows the existing
   `**Trigger:** … closes when F-P3B2-1–F-P3B2-14 are Resolved`
   (`ROADMAP.md:43-44`). The stated purpose — "so neither session inherits a
   bar it cannot close" (plan:17) — is therefore unmet, and `check-roadmap`
   checks structure (1–3 bullets + a Trigger line), not trigger text, so the
   gate will not catch it. **Must change:** explicitly rewrite the surviving
   section's trigger to F-P3B2-1…8 and give the new section F-P3B2-9…14.

4. **Blast radius omits files the plan itself writes.** §4 (plan:224-239)
   omits `CHANGELOG.md` (the commit plan requires a dated heading and bullets,
   plan:438-443), `spec/audit/tool-surface-baseline.json` (rewritten by
   `surface-budget --write`, `scripts/surface-budget.ts:26,152`; adding a
   `location` parameter moves the measured token footprint), and the increment
   artifacts `docs/plans/2026-11-12-5-6-entity-scene-npc-depth/{tasks,aar}.md`
   (named in §2/§6; `check-loop-artifacts` requires plan/tasks/AAR). All three
   are in the increment's commit. **Must change:** add them to §4 with the gate
   that notices each.

5. **F-P3B2-1 attributes an audit clause to REQ-177 that the REQ does not
   contain.** The §1 contract column cites REQ-177 for `roster_remove`
   writing no audit (plan:40), and D3 adds `audit("roster_remove", …)` while
   keeping `roster_remove` Novel-independent (plan:132-139). REQ-177 requires
   `[NOT_FOUND]` with valid-ID enumeration and forbids Player only
   (`spec/02-requirements.md:1659-1668`) — no audit. The `audit()` helper is a
   silent no-op when no Novel is active (`holonovel/src/index.ts:2725-2727`),
   so the promised entry is dropped in exactly the no-Novel case roster
   operations allow. **Must change:** drop the audit rationale from the finding
   closure (or cite the undo/audit convention that actually owes it) and state
   what happens with no active Novel.

6. **Artifact hash mismatch.** The dispatched hash
   `f75e9b86…b385cb` does not match the reviewed file
   `83d7c8ca…93a9d9`; the document was edited after dispatch (or the hash was
   taken from an earlier copy). The gate binds the cold report to the document
   it reviewed, so stamping the dispatched hash would bind a review to a
   revision no reviewer saw. **Must change:** re-freeze the artifact and
   re-dispatch, or stamp the recomputed hash after confirming the current file
   is the intended revision.

## Minors / Nits

- The objective cites the register range `:2057-2132` for F-P3B2-1…8
  (plan:12-13). F-P3B2-1…8 occupy `:2057-2088`; `:2132` is inside the next
  chunk. Fix the range.
- `NovelEntity has no hp … stats (core/state.ts:280-283)` (plan:99-101) points
  at `LoreVisibility`/`LoreEntry`; `stats` is `state.ts:237` inside the
  interface at `226-244`.
- "every new field rides an existing group (NPC, Scene, NPC Memory, Voice
  Examples)" (plan:74-78) does not cover `roster_source_id`, which is on
  `NovelEntity`, not the NPC map. Cite the Novel container/entity record
  (precedent: `codex_source`, `state.ts:243`).
- The scene-history marker shape is stated two ways: D4 "prefixed by a
  `suppressed: N` field and a `[truncated]` marker" (plan:143-147) versus Risk 4
  "inside the array as a first element `{ suppressed, truncated }`"
  (plan:407-412). Pick one and specify the element type.
- "six harness suites" (plan:64-69, 363) versus five assertion homes in §4
  (plan:229-233); `test:pattern-buffer` is a pass-only regression gate
  (`run_pattern_buffer.ts`), and Phase 1 requires assertions "in a harness file
  named in §4". Say so explicitly. Also Phase 7 says "old-save fixture"
  (plan:329) while §4 says "built inline … not a new fixture file" (plan:233) —
  one wording, one intent.

## Verified positives

- Both stale-premise corrections are right: `roster://{id}` exists at
  `holonovel/src/index.ts:14547-14557`, and `party://current` already emits
  `present` and `last_location` at `index.ts:14371-14372` (the register's
  `:12561`/`:12287` anchors are the stale ones).
- A representative sample of §1 anchors resolves: `scene://history` returns the
  whole array uncapped (`index.ts:14013-14021`); `roster_list` maps id/name only
  (`:4817-4821`); `remove`/`roster_remove`/`roster_list` sit at `:4800-4821`;
  personality mirrors `description` only for NPCs (`:4790-4794`);
  `recordNpcInteraction` is defined at `:4833` and called once at `:6671`;
  `composeNpcMemorySection` at `:4876`; `npc_memory_count` at `:13763`;
  `isTransition` at `:7134`; `NpcState` lacks the three depth fields
  (`core/state.ts:246-277`); the register's Scheduled-under line is exactly
  `:2054`.
- The six npm scripts exist (`holonovel/package.json:74,75,79,80,83,112`), and
  the five harnesses the plan assigns assertions to are the plausible homes for
  their surfaces (verified by script name; assertion titles not read).
- The §7.7 no-edit claim holds for fingerprints: §7.7 groups are coarse
  (`spec/04-runtime.md:257-299`), and `scene_tick`/`appearance_count` are
  already specified in REQ-076b3 / REQ-075c, so adding fields to the code does
  not change §7.7 text.
- The baseline premise is accurate: the predecessor §5.6 increment is
  staged-uncommitted and this increment's directory is untracked
  (`git status`), matching plan:28-34; Phase 0's clean-baseline ordering is
  sound.
- No `spec/02-requirements.md` body edit is required by the eight findings'
  contracts as written.

## Unknowns

- `RosterCharacter`'s field layout: whether race/class/level and `persona` live
  on the record or only in `stats` was not read. Phase 2's "`stats`/`persona`
  fallbacks" (plan:284-285) is therefore unverified. *Resolved during the
  revision: `RosterEntity extends NovelEntity` with no race/class/level fields
  (`core/state.ts:905-912`), so D2b makes them derived reads.*
- Whether `check-registers` validates the ROADMAP trigger text (the roadmap
  admission rule is structural), and whether any gate enumerates `TTRPG_*`
  variables — this affects whether Major 2's missing row fails a gate or ships
  silently. *Answered: `check-roadmap` is structural, and no gate enumerates the
  variables, so the §7.6 row is a house-rule obligation, not a gate failure.*
- The existing assertion titles inside the five harnesses (only script
  existence was verified), so exact home suitability is inferred from names.
- Pattern-buffer's sensitivity to the new fields was not read.

## Comprehension (Stage 2, faithful-with-gaps)

The plan closes eight P3b-2 findings (F-P3B2-1…8) in `holonovel/src` by adding
entity/roster lifecycle guards, party HP and presence, a capped scene ledger
with a tick and lore-contradiction warning, fast-forward bridging, NPC depth
metadata plus a recap heatmap, one NPC description reader, and broader NPC
memory ingestion; it splits the F-P3B2-9…14 bullet into a new P1 roadmap
section and regenerates the tool definitions, coverage register, and review
register. Done means the eight findings are Resolved with current predicates,
the roadmap split exists, new assertions were observed red, six harness suites
and the full gates pass, and the AAR ends LOOP PAUSED. Undetermined from the
document alone: how `roster://<type>` coexists with `roster://<id>`; how NPC
appearance is detected if not via `characters_present_ids`; whether the new
history cap needs a config-table entry; and whether the coverage bar is
family-level or per-test.

## Binding and verdict chain

```
independent-review FAILED. plan.md — 3 blockers
```

Cold pass artifact: `docs/plans/2026-11-12-5-6-entity-scene-npc-depth/cold-review.md`
Target: `docs/plans/2026-11-12-5-6-entity-scene-npc-depth/plan.md`
Plan sha256 reviewed: `83d7c8ca230790b835231caf9c2c14cb58466a94397b47bc445d1830ca93a9d9`
Dispatched sha256 (stale): `f75e9b862554902594b41ca69a98327d5b71f8ebbc3718bcb8bfa6ab37b385cb`

## Diff re-review (standard-depth cap, 10 reads)

Reviewed revision: `404bf79032a8c2c38d96dd57d2196956c3d36af2f7173082ebfe7ccdecb9356c`
Verdict: **passed**

- Blocker 1 (NPC appearance via the entity-only `characters_present_ids`) —
  `Resolved` (D8 names two NPC-scoped sites; the dedup unit was folded in after
  the pass).
- Blocker 2 (last-entity presence clear) — `Resolved` (D3 clears to `null`; both
  directions asserted in Phase 3).
- Blocker 3 (`roster://<type>` routing) — `Resolved` (D2c; static resources,
  reserved tokens, SDK-dispatch assumption recorded with a red probe).
- Major 1 (bucket-C wording) — `Resolved` (family-level, deferred IDs named).
- Major 2 (`TTRPG_SCENE_HISTORY_MAX`) — `Resolved` (§1 and §4 name the §7.6 row;
  §7.6 confirmed outside the fingerprint set).
- Major 3 (unnarrowed roadmap trigger) — `Resolved` (Phase 9 requires the
  narrowing and notes `check-roadmap` will not catch it).
- Major 4 (blast-radius omissions) — `Resolved` (`CHANGELOG.md`,
  `spec/audit/tool-surface-baseline.json`, the increment artifacts).
- Major 5 (REQ-177 audit misattribution) — `Resolved` (REQ-040a, no-active-Novel
  behaviour stated).
- Major 6 (hash mismatch) — cleared by the re-freeze above.

New issues introduced by the revision: two nits, both folded in after the pass
(the per-NPC-per-scene increment unit in D8; the SDK-dispatch wording in D2c).
No new Blocker or Major. A defect in unchanged text is `Deferred`, not blocking.

```
independent-review passed. plan.md — all 3 Blockers and 6 Majors resolved; no new Blocker
```

Plan sha256: fcdf573b9fda091942daf0c20dbec0b08f09d49552e87cbf7a392625d2a8ead6

Reviewed plan sha256: `404bf79032a8c2c38d96dd57d2196956c3d36af2f7173082ebfe7ccdecb9356c`
Final bound plan sha256: `fcdf573b9fda091942daf0c20dbec0b08f09d49552e87cbf7a392625d2a8ead6`
(the difference is the Status line plus the two folded nits — condition-only
amendments, re-stamped and verified by `build-review`)
