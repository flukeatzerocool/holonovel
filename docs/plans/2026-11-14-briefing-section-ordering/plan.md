# Plan — Briefing section ordering (F-S3) and a live `briefing_order`

Status: draft v4 (cold pass v1 FAILED — 3 Blockers / 6 Majors / 4 Nits, all
resolved; cold pass v2 diff re-review **passed** with 3 Majors / 3 Nits, all
applied as condition-only amendments — see § Review state) · Kind: planned ·
Depth: standard
Increment target: `docs/plans/2026-11-14-briefing-section-ordering/`
Rollback cost: 1 (one revert: section registry + ordering in `index.ts`, two REQ
amendments, four harness files, DECISIONS/register/roadmap bookkeeping)
Evidence class: repo
Trust boundary: every premise is read from the working tree at HEAD; no web,
user, or tool-output content enters the plan.
Cold pass v1: `/tmp/opencode/briefing-ordering-cold-review-v1.md`, sha256
`d9553559e9db89c2382f7a4bbc8e52d6b147ee3350f3bfc856dc4e64547648bf`, reviewed
plan sha256 `fe319a2b271e00d459b5703f65a90e74813d597d3292b9e36241f1a1e6ca2bfb`,
verdict FAILED. Cold pass v2 (diff re-review):
`/tmp/opencode/briefing-ordering-cold-review-v2.md`, sha256
`4c5498ad40cbb804fe7dc1d239b755686a44981f5b0ce0c6b237085e94f61505`, reviewed
plan v3 sha256 `30c75457e3f2acc998299d524d18a1e19a319a79563ec7cc8d193b251ac28c3f`,
verdict **passed** (0 blockers, 3 majors, 3 nits — all applied in v4).

## Resolutions (cold pass v1 → v3)

- **B1 (clarity).** The identity section is **supplementary, at the head of the
  supplementary layer** — one placement everywhere: the order table (row 16),
  the T109 clause, the REQ-109c2 replacement text, and the scope decision now
  agree. It is removed from the T109 critical-group list.
- **B2 (design).** Four rows added with tokens: `state_persistence` (REQ-400,
  critical), `state_ledger` (REQ-401, critical), `persistence_tools` (REQ-407,
  supplementary, never-truncated), `story_beats` (REQ-337, supplementary). The
  registry is now 39 entries, matching every top-level `###` the composer emits;
  the DECISIONS table carries all 39.
- **B3 (design).** The entry contract is specified in full — `token`, `group`,
  `layer`, `badges`, `empty`, `render` — with an explicit omit rule, a badge
  predicate per GM-branch section (listed with line references), and a stated
  consequence: Player-visible `narrative_threads` is **not** added by this
  increment (the section stays GM/observer), and the missing REQ-281b Player
  clause is recorded as **F-S4** and scheduled.
- **M1.** D3's fact is corrected: the spec default is `visible`
  (`spec/01a-constitution.md:127`, `spec/04-runtime.md:186`), and B12 is skipped
  in the ruleset-free build with no prominence recorded
  (`spec/03-build.md:133`). REQ-082b's tier branching is deferred with that
  predicate, not asserted as "not a defect".
- **M2.** T66 gains the absent-feature leg: a token whose group has no content
  renders its empty-state section rather than vanishing (REQ-082a/082c).
- **M3.** T149 gains the layer-truncation leg (critical marker survives, a
  supplementary non-never-truncated marker is `[truncated]` at the same budget).
- **M4.** `group` is a registry field; `spec_health.section_tokens` is derived
  from it and T225 asserts all three fields plus exact enumeration equality.
- **M5.** Baseline recorded as "clean except the untracked increment directory";
  step 26 stages it.
- **M6.** The fingerprint row now cites §5.5 and states that neither
  `PACKAGE_SECTIONS` nor `DATA_SECTIONS` contains it.
- **Nits.** T109 range corrected to `test-briefing.ts:522-569`; the heading is
  quoted verbatim as `### Available Actions (available_actions)`; a step updates
  `NEVER_TRUNCATED`'s comment and retires its now-dead `"intro"` member;
  REQ-109e's HEAD measurement restated as ≈773 chars.

## Questions

1. Which roadmap item is next? `ROADMAP.md:15-25` § *Briefing section ordering
   (P1)* — review-register **F-S3**: the rendered briefing places
   decision-critical groups after supplementary ones, contradicting REQ-109d/109e.
2. Why is `manage_context (action: briefing_order)` in this plan? Because the
   ordering work exposes a second, demonstrated defect: the override is written
   to Novel state and **never read**, so REQ-082a/082c's acceptance criterion
   ("`briefing_order` reorders `badge_briefing`") is false today. A demonstrated
   wrong output is a P0 fixed in-session, and the registry this plan builds is
   what makes the fix small.
3. What is explicitly out of scope? REQ-185c's ruleset-conditional token subset
   (`T300`), `room_detail`'s unrendered token, REQ-309 tier branching, and the
   REQ-281b Player narrative-threads surface (F-S4). None is regressed here.

## Objective

Make `badge_briefing` render its sections in an order the spec determines, and
make the persisted ordering override control that order — so `T109` asserts
ordering instead of recording a deviation, and `T66` stops being a vacuous "the
briefing has headings" check.

## Evidence (repo)

| Claim | Predicate |
|---|---|
| Section emission order is fixed by statement order in one function, with orientation and supplementary groups interleaved with state groups | `holonovel/src/index.ts:17144` (`composeBadgeBriefing`); `### Play loop` first (`:17174`), `### Party` (`:17236`), `### Combat` (`:17243`), `### Novel Setup` (`:17449`) before `### Point of view` (`:17461`), `### Autonomy` (`:17489`) before `### Narrative threads` (`:17653`) |
| `briefing_order` is persisted but never read | write only at `index.ts:11985`; no other read in `holonovel/src` — the remaining hits are the synthesis module name (`:15878`, `:15947-16002`) and tool descriptions |
| The valid token set is 12 hand-written tokens unrelated to the rendered set | `index.ts:11980` (`VALID_TOKENS`); `:15106-15119` (`spec_health.section_tokens`, which does emit `token`/`group`/`has_content`) |
| T66 asserts only that the briefing contains `"## "` | `holonovel/scripts/test-backfill.ts:1480-1484` |
| T109 asserts presence, inventory, exclusion, omission — not order | `holonovel/scripts/test-briefing.ts:522-569`; deviation sentence in the Appendix F row, `spec/appendices-reference.md:1581` |
| F-S3 carries this predicate | `spec/audit/review-register.md:2548-2560` |
| REQ-109 lives in §5.5, and §5.5 is in neither fingerprint list | `spec/02-requirements.md:1212` (heading), `:1314` (REQ-109a); `scripts/lib/contract-fingerprint.ts:27` (`PACKAGE_SECTIONS`), `:37-43` (`DATA_SECTIONS`) contain §5.16, §5.17, §6.3, §6.4.2, §5.24–§5.28, §5.31, §5.32 (§5.29, §5.30, §5.33 are deliberately excluded, `:33-36`) — no §5.5 |
| REQ body budgets: 109c2 has headroom, 109e does not | measured at HEAD: 109c2 541 chars/5 sentences, 109d 324/3, 109e ≈773/6 (limit 800/8) |
| The intro pointer is appended inside the last section, so truncation can drop it | `index.ts:17723-17724` precedes `applyPromptBudget` at `:17727`; REQ-118/REQ-063 require it never truncated; the `"intro"` member at `:3767` never matches a heading |
| The never-truncated set holds eight members | `index.ts:3767` (`badge boundary`, `turn handoff`, `play loop`, `intro`, `state persistence`, `state_ledger`, `persistence tools`, `player signals`); the comment is at `:3766` |
| `narrative_threads` renders only for GM/observer | `index.ts:17536` branch opens, `:17652-17656` emits the section; no Player occurrence anywhere in `holonovel/src` |
| Baseline gates are green; the only untracked path is this increment | `npm run check:fast` → `41 passed, 0 failed`, `check:fast: PASS`; `git status` → `?? docs/plans/2026-11-14-briefing-section-ordering/`; HEAD `582582a` |

## Specification conflicts this plan resolves

1. **Global order vs layer order.** REQ-109d calls the c1 enumeration "the
   builder's required default section ordering", but c1 puts adventure content
   and registered tools before combat state, while REQ-109e fixes both as
   supplementary and requires all critical groups first. → Amend REQ-109d so the
   enumeration order is the **within-layer** order.
2. **Who-they-are adjacency vs classification.** REQ-109c2 requires it
   "immediately after the POV directive"; REQ-109e lists it as supplementary and
   POV is critical. → Amend REQ-109c2 to head the **supplementary** layer, which
   is the user-confirmed resolution. Rejected alternative: reclassify it as
   critical — that edits REQ-109e, at ≈773/800 chars and 6/8 sentences.
3. **`narrative_threads` placement.** REQ-281b requires "after entities and
   before combat state"; REQ-109e's membership list names combat before threads.
   Because that list is membership ("include"), not order, REQ-281b's adjacency
   wins: entities → narrative threads → combat.

## Resolved default order (39 registry entries + 2 footers)

| # | Layer | Section (verbatim heading where rendered) | Token | Source |
|---|---|---|---|---|
| 1 | critical | `## Badge Briefing` scene lines + `**Beat:**` | `scene_state` | REQ-109c1, REQ-076, REQ-335 |
| 2 | critical | `### Point of view` | `point_of_view` | REQ-220, REQ-223 |
| 3 | critical | `### Party` | `entities` | REQ-074, REQ-307 |
| 4 | critical | `### Narrative threads` (incl. countdown sub-block) | `narrative_threads` | REQ-281, REQ-073a1 |
| 5 | critical | `### Combat` | `combat_state` | REQ-043e/f |
| 6 | critical | `### NPCs (depth)` | `npcs` | REQ-075c/d |
| 7 | critical | `### Lore` (triggered) | `lore` | REQ-083f, REQ-155 |
| 8 | critical | campaign memory block | `campaign_memory` | REQ-310 |
| 9 | critical | subjective memory block | `subjective_memory` | REQ-626, REQ-634 |
| 10 | critical | `### Knowledge state` | `knowledge_state` | REQ-286 |
| 11 | critical | `### State persistence` | `state_persistence` | REQ-400 |
| 12 | critical | `### state_ledger` | `state_ledger` | REQ-401 |
| 13 | critical | `## World in Motion` | `world_in_motion` | REQ-233a, REQ-339 |
| 14 | critical | `### Available Actions (available_actions)` | `available_actions` | REQ-084a |
| 15 | critical | `### Story journal` | `story_journal` | REQ-246 |
| 16 | supplementary | `### Who They Are` | `who_they_are` | REQ-642 (amended 109c2: heads the supplementary layer) |
| 17 | supplementary | `### Play loop` | `play_loop` | REQ-062, REQ-412a |
| 18 | supplementary | `### Anti-slop guidance` | `anti_slop` | REQ-070 |
| 19 | supplementary | `### Narrative tone` | `narrative_tone` | REQ-071 |
| 20 | supplementary | `### Badge boundary` | `badge_boundary` | REQ-064 |
| 21 | supplementary | `### Personality` | `personality` | REQ-166, REQ-282 |
| 22 | supplementary | `### Narrative directive` | `narrative_directive` | REQ-081 |
| 23 | supplementary | `### Narration contract` | `narration_contract` | REQ-598 |
| 24 | supplementary | `## Adventure` / `## Generated Adventure` (+ waypoint line) | `adventure` | REQ-079f, REQ-132c, REQ-250 |
| 25 | supplementary | `### Player Tools` | `player_tools` | REQ-134 |
| 26 | supplementary | `### GM State` | `gm_state` | REQ-087, REQ-109 |
| 27 | supplementary | `### Persistence tools` | `persistence_tools` | REQ-407 |
| 28 | supplementary | `### Surroundings` | `world_state` | REQ-185b, REQ-341 |
| 29 | supplementary | `### Vehicle` | `vehicle` | REQ-317d |
| 30 | supplementary | `### Player signals` | `player_signals` | REQ-128, REQ-069 |
| 31 | supplementary | `### Boundaries` | `boundaries` | REQ-069 (boundary) |
| 32 | supplementary | `### Autonomy` | `autonomy` | REQ-306 |
| 33 | supplementary | `### Novel Setup` | `novel_setup` | REQ-089 |
| 34 | supplementary | `### Player Intent` | `player_intent` | REQ-320 |
| 35 | supplementary | `### Story beats` | `story_beats` | REQ-337 |
| 36 | supplementary | `### Synthesis` | `synthesis` | REQ-159, REQ-265 |
| 37 | supplementary | `### Server guidance` | `server_guidance` | REQ-365a |
| 38 | supplementary | novel notes block | `notes` | REQ-242b |
| 39 | supplementary | `### Turn handoff` | `turn_handoff` | REQ-412 |
| — | footer | intro pointer | (not tokenized) | REQ-063, REQ-118 |
| — | footer | `**Briefing consistency:**` | (not tokenized) | REQ-515-521 |

`scene_state` controls the scene/beat **content lines**, not the
`## Badge Briefing` identity header (badge, novel, detail, register), which
always renders. `world_state` is the Player's `### Surroundings`; the GM's room
counts live in `gm_state`. `countdowns` is not a separate section — REQ-281c
requires countdowns inside narrative threads, so the existing `countdowns` token
selects the countdown sub-block of `narrative_threads`; omitting it suppresses
only those lines. `### Available Actions (available_actions)` keeps its verbatim
heading because the token name is part of the rendered contract.

## Design

Replace statement-order emission with a **section registry**: one ordered array
composed by one loop. Three runtime consumers read the same array — the
composer, the `briefing_order` validator, and `spec_health.section_tokens` — so
the token set cannot drift from the rendered set again. The DECISIONS table is
copied from it at build time and audited at review (it is documentation, not a
consumer).

```ts
type BriefingSection = {
  token: string;                     // snake_case, stable (REQ-185a)
  group: string;                     // REQ-109 group name (REQ-186a)
  layer: "critical" | "supplementary";
  badges?: Badge[];                  // omitted = every badge
  empty: "marker" | "omit";          // REQ-109d marker vs group omission
  hasContent(ctx: BriefingCtx): boolean;
  render(ctx: BriefingCtx): string;  // "" when empty:"omit" and no content
};
```

**Gates (preserved exactly; no gate widens or narrows).** Three gate kinds,
each carried by the entry:

- *Badge-gated, GM* — `boundaries` (`index.ts:17417`), `player_signals`
  (`:17432`), `autonomy` (`:17487`), `player_intent` (`:17306`), `story_journal`
  (`:17709`), `server_guidance` (GM/Editor, `:17405`).
- *Badge-gated, GM or observer* — `gm_state` and the persistence cluster
  (`:17536-17600`), `narrative_threads` (`:17646-17656`), `story_beats`
  (`:17593`).
- *Badge-gated, Player* — `player_tools` (`:17498`), `world_state` (`:17515`).
- *Role-gated, not badge-gated* — `narrative_directive` and
  `narration_contract` (`:17355-17360`, keyed on `orientationBadge`) and
  `turn_handoff` (`:17317-17325`, keyed on `narrativeRole`; two body variants,
  and no section at all for the Editor badge). `badges?: Badge[]` cannot express
  these, so they use `hasContent(ctx)` reading the role plus `empty: "omit"`.
- *All badges, filtered inside the body* — `scene_state`, `point_of_view`,
  `entities`, `combat_state`, `lore`, `knowledge_state`, `adventure`, `vehicle`,
  `notes`, `personality`, `who_they_are`, `synthesis`.

**Omission rule.** A token present in `briefing_order` renders, using its
`empty` mode when `hasContent` is false; a token absent does not render and its
side effects do not run. With no override, every entry renders (the builder
default). Side effects (`triggerPacingAutonomy` REQ-336/351,
`recordNpcAppearance` REQ-075c, world-in-motion persistence) run once per render,
only when `ctx.mutate` and only for entries actually rendered.

**Consequence recorded, not hidden.** `narrative_threads` stays GM/observer in
this increment; REQ-281b's Player clause is absent today and stays absent, so it
is scheduled as **F-S4**, not silently fixed (a Player threads surface needs
badge-filtered bond/countdown/disposition content, which is its own increment).

Determinism: a literal array, no wall-clock, no map-order dependence.
`applyPromptBudget` is unchanged mechanically; because emission order now puts
critical sections first, truncation keeps them and drops supplementary ones —
which is REQ-109e's intent and is asserted by T149 (M3).

## Phases and steps

### Phase 0 — probes and baseline (no writes)

1. Run `npm run check:fast` un-piped; record the exit code and the trailer
   (baseline: `41 passed, 0 failed`, `PASS`).
2. Confirm the P0 predicate: `grep -rn "briefing_order" holonovel/src` yields the
   write at `index.ts:11985`, tool descriptions, and the synthesis module only.
3. Record the observed GM render order from `index.ts:17168-17724` into
   `tasks.md` as the before-state (already transcribed there).
4. Record the REQ-109c2/109d/109e HEAD body lengths with the same measurement
   used by the validator, and re-measure after editing (C-3).

### Phase 1 — spec amendments (before code)

5. REQ-109d (`spec/02-requirements.md:1329-1330`): replace "The enumeration
   order above is the builder's required default section ordering for
   `badge_briefing`." with "Within each layer the enumeration order above is the
   builder's required default section ordering for `badge_briefing`; cross-layer
   placement follows REQ-109e, and a group the enumerations do not name is
   placed by the builder. The complete default order SHALL be recorded in
   DECISIONS.md per REQ-082b." Verify ≤ 800 chars, ≤ 8 sentences.
6. REQ-109c2 (`:1323-1324`): replace "immediately after the POV directive" with
   "at the head of the supplementary layer (REQ-109e), immediately after the
   decision-critical layer". Verify ≤ 800 chars, ≤ 8 sentences.
7. `spec/appendices-reference.md:1581` T109 row: delete the final sentence
   ("The decision-critical-before-supplementary ordering clause is a known
   deviation tracked as review-register F-S3, not asserted here.") and add the
   ordering clause — the 15 critical groups in the relative order of the table
   above, each before every supplementary group; for a Player render, the
   relative order holds among the sections the Player sees.
8. `npm run assemble && npm run validate`; do not proceed while red.

### Phase 2 — section registry and canonical order (code)

9. Extract each section body in `composeBadgeBriefing` into a `render*` helper
   as a **pure move**: identical text, identical badge gate, identical
   `mutate` guard. Keep every `// REQ-NNN` comment attached to its section —
   a lost comment strips the REQ's code lead and `check:conformance` reports it.
10. Add `BRIEFING_SECTIONS: BriefingSection[]` in the table order (39 entries),
    `BRIEFING_BY_TOKEN`, and the `BriefingCtx` type carrying `novel`, `badge`,
    `entity`, `mutate`.
11. Replace the emission body with one loop; the identity header renders first
    and is not a registry entry; the two footers render after the loop.
12. Behavioural preservation: render the T109 fixture before and after and diff.
    The only permitted difference is **section order** — every rendered body
    and every gate must be byte-identical. Any other difference stops the
    build. Record the diff in `tasks.md`.
13. `npm --prefix holonovel run test:briefing`, `test:output-contracts`,
    `test:backfill`; fix, do not weaken, any invalidated assertion (known safe:
    the position-independent `### Turn handoff` lifts at `test-briefing.ts:136-139`
    and `test-backfill.ts:1533`, and the `## Adventure`-before-`## Generated
    Adventure` check at `test-output-contracts.ts:1549-1550`).

### Phase 3 — the override actually orders

14. Derive `VALID_TOKENS` (`index.ts:11980`) and `spec_health.section_tokens`
    (`:15106-15119`) from `BRIEFING_SECTIONS`, with `group` and a per-section
    `has_content` (REQ-186a/186b).
15. Apply `novel.briefing_order` as permutation + filter over the registry;
    `[]` restores the default; unknown tokens stay `[INVALID_INPUT]`; the schema
    and the action set are unchanged (REQ-082a/c).
16. `holonovel/DECISIONS.md`: dated record with all 39 rows (token → REQ-109
    group → default order), the three spec resolutions, the omission rule, and
    the truncation-order consequence.
17. Harnesses:
    - `test-briefing.ts` T109: ordering legs (critical sequence, all critical
      before all supplementary, Player relative order).
    - `test-backfill.ts` T66: Appendix F legs — custom order observable;
      omitted token absent; empty array restores default; unknown token
      `[INVALID_INPUT]` enumerating valid tokens; a token whose group has no
      content renders its empty section; Player `[FORBIDDEN]`; ordering persists
      across restart.
    - `test-output-contracts.ts` T225: `spec_health.section_tokens` carries
      token/group/has_content and equals the `[INVALID_INPUT]` enumeration
      exactly.

### Phase 4 — the intro pointer is never truncated

18. Move the intro-pointer line (`index.ts:17723-17724`) after
    `applyPromptBudget` (`:17727`), beside the consistency footer.
19. Update the `NEVER_TRUNCATED` comment (`index.ts:3755`) and retire the now-dead
    `"intro"` member (`:3767`), or document in place why it is retained.
20. `test-output-contracts.ts` T149: at `TTRPG_MAX_BRIEFING_TOKENS=600`, assert
    the intro pointer survives; add the layer leg — a critical marker (e.g.
    `### Party`/`### Lore`) renders while a supplementary non-never-truncated
    marker (e.g. `### Synthesis`/`### Server guidance`) is `[truncated]`. Choose
    the exact budget by measurement at implementation.

### Phase 5 — registers, bookkeeping, gates

21. `spec/audit/review-register.md`: F-S3 → `## Resolved` with the satisfied
    predicate and the resolving tests; add **F-S4** (REQ-281b Player clause
    unimplemented, `index.ts:17649-17656`; T330 covers GM only,
    `test-output-contracts.ts:760-772`) under `## Scheduled-roadmap`.
22. `ROADMAP.md`: remove § *Briefing section ordering (P1)*; add
    § *Player narrative threads (P1)* (1–3 bullets + `**Trigger:**`) for F-S4.
23. `npm run validate -- --write-register` to refresh
    `spec/audit/req-coverage.md`.
24. `CHANGELOG.md`: dated entry (spec / server / harnesses / docs). The date must
    equal the session date and the top CHANGELOG heading — `session:close`
    derives the commit subject from it.
25. `npm run build-order` (assemble + propagate to `holonovel/holonovel.md` +
    `check` + summary), then `npm --prefix holonovel run test:all`. Capture
    un-piped exit codes.
26. Stage the untracked increment directory (M5), write `aar.md` ending
    `LOOP PAUSED`, and close with `npm run session:close`.

## Blast radius

| File | Change | Size |
|---|---|---|
| `holonovel/src/index.ts` | registry, ordered composer, `briefing_order` applied, tokens + `section_tokens` derived, intro pointer moved, `NEVER_TRUNCATED` comment/member | L |
| `spec/02-requirements.md` | REQ-109c2, REQ-109d amendments | S |
| `spec/appendices-reference.md` | T109 ordering clause | S |
| `holonovel.md` | generated by `npm run assemble` | S |
| `holonovel/holonovel.md` | propagated by `npm run build-order` | S |
| `holonovel/scripts/test-briefing.ts` | T109 ordering legs | M |
| `holonovel/scripts/test-backfill.ts` | T66 rewritten to the Appendix F contract | M |
| `holonovel/scripts/test-output-contracts.ts` | T225 fields/equality; T149 intro + layer legs | M |
| `holonovel/DECISIONS.md` | 39-row token → group → order record | M |
| `spec/audit/review-register.md` | F-S3 `Resolved`; F-S4 `Scheduled-roadmap` | S |
| `ROADMAP.md` | section removed; F-S4 section added | S |
| `spec/audit/req-coverage.md` | regenerated | S |
| `CHANGELOG.md` | dated entry | S |
| `docs/plans/2026-11-14-briefing-section-ordering/{plan,tasks,aar}.md` | this increment | M |

No tool is added, renamed, or removed; no new Novel state (the ordering field
already exists); no action re-classification; the `manage_context` schema is
unchanged.

## Verification and done bar

**Done bar:** `npm run assemble && npm run check:fast` prints
`check:fast: PASS`; T109, T66, T225 and T149 assert the ordering, override,
token-discoverability and truncation contracts; F-S3 is `Resolved` and F-S4 is
scheduled; no REQ body exceeds 800 chars or 8 sentences; the before/after render
diff (worktree at `582582a` vs the change) shows order-only differences.

- `npm run assemble && npm run check:fast` → `check:fast: PASS`, 41 gates,
  un-piped exit code captured.
- `test:briefing`, `test:output-contracts`, `test:backfill` green, then
  `npm --prefix holonovel run test:all` green.
- T109 asserts the ordering clause; T66 asserts all seven Appendix F legs; T225
  asserts token/group/has_content and enumeration equality; T149 asserts the
  intro pointer survives and critical sections outlive supplementary ones.
- REQ-109c2/109d bodies ≤ 800 chars and ≤ 8 sentences (measured post-edit).
- F-S3 `Resolved`; F-S4 scheduled with a matching ROADMAP section;
  `check-registers`, `check-roadmap`, `check-loop-artifacts` green.
- The before/after render diff shows order-only changes; every section body
  and gate is byte-identical.

## Edge cases and rollback

- **Saved overrides on existing Novels.** A non-empty `briefing_order` saved
  before this change starts filtering sections it never filtered (REQ-082a's
  absent-token rule). Mitigation: contract-correct; CHANGELOG note; T66 covers
  reset; no migration, no schema change.
- **Truncation priority flips.** Mitigated by T149's layer leg and the DECISIONS
  record.
- **Side-effecting sections.** Once per render, `mutate` only, rendered entries
  only (§ Design). T149 and T109 both render at least one mutating briefing.
- **Empty override vs omitted sections.** `[]` = default; `["lore"]` = only lore
  among the overridden set, then the footers. T66 distinguishes them.
- **Never-truncated supplementary sections.** `play_loop`, `badge_boundary`,
  `turn_handoff`, `persistence_tools`, `player_signals`, `state_persistence`,
  `state_ledger` stay protected; the T149 layer leg must therefore use
  *non-protected* supplementary markers (`synthesis`, `server_guidance`).
- **Rollback:** one revert. No persisted migration, no external state.

## Deferred decisions (recorded, not scheduled)

- **D1 — REQ-185c's ruleset-conditional token subset (`T300`) stays unasserted.**
  One runtime surface here; a fixture build is its own increment. Not a
  regression (unasserted at HEAD).
- **D2 — `room_detail` (REQ-185b) stays unrendered.** Pre-existing; the registry
  carries only sections with a renderer. Recorded in the AAR.
- **D3 — REQ-082b's `TTRPG_WORLD_PROMINENCE` tier branching is deferred.** The
  spec default is `visible` (`spec/01a-constitution.md:127`,
  `spec/04-runtime.md:186`), and B12 is skipped with no prominence recorded in
  the ruleset-free build (`spec/03-build.md:133`), so the static registry is the
  correct default for this build; a ruleset build must branch the default order,
  which requires a build-time ordering input. Predicate for reopening: a
  ruleset-build plan that records a prominence tier.

## Review state

Self pass: applied (sections 1–8). Cold pass v1: FAILED, 3 Blockers / 6 Majors /
4 Nits — all resolved in v3. Cold pass v2 (diff re-review, 8/10 reads, stage-2
re-audit passed): 0 Blockers / 3 Majors / 3 Nits, all applied in v4 as
condition-only amendments — registry count 38 → 39, `turn_handoff` named as
role-conditional with the three gate kinds spelled out, the unstated
"badge-predicate corrections" exemption deleted in favour of a strict order-only
diff, plus the three nits. Condition-only amendments are re-stamped per the
protocol; `build-review` verifies them, which is why no third cold pass runs.

Conditions for `build-review`:

- **C-1** Phase 2's "pure move" claim is verified by the step-12 diff; any
  difference beyond section order stops the build for reconciliation.
- **C-2** The gate assignments in § Design are re-read at the file when
  extracting; the layer assignments come from the spec, the gates from the code.
  Two are unverified at plan time: the `### Vehicle` block's badge gate
  (`index.ts:17289-17297`) and the exact `orientationBadge` guard around
  `### Narrative directive` / `### Narration contract` (`:17355-17360`).
- **C-3** REQ body lengths are measured after editing; the estimates here are
  not evidence.
