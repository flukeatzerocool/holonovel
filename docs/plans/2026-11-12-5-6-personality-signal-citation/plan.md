# Plan — §5.6 personality, signal, and citation remediation

Status: reviewed (cold pass FAILED on the first revision, diff re-review passed; no open conditions) · Kind: planned · Depth: standard
Increment target: `docs/plans/2026-11-12-5-6-personality-signal-citation/`
Rollback cost: 1 (server source, generated artifacts, harness assertions, registers;
reversible in one commit)
Evidence class: repo only (no web, no user-supplied content)

## 1. Objective

Take the next open `ROADMAP.md` section, *§5.6 personality, signal, and citation
remediation (P1)* (`ROADMAP.md:38-58`), and its six findings **F-P3B2-9 through
F-P3B2-14** in `spec/audit/review-register.md:2119-2147`. The predecessor
increment (2026-11-12, entity/scene/NPC-depth) closed F-P3B2-1…8 and split the
section; this plan closes the remainder.

The REQs already state the contracts (REQ-069a/b/c, REQ-077a/b/d/e/f, REQ-126a/b,
REQ-128a/b, REQ-166a/b/c, REQ-167a/b, REQ-173b, REQ-255b, REQ-282a/b/c). The
server is narrower than the spec. This is an implementation-and-assertion
increment with a citation-repair phase. It changes **no requirement body and no
`_Check:_` line**: the one unimplemented citation (REQ-124b's T131) is scheduled
as its own P1 roadmap item rather than re-pointed (D10).

Baseline (this session, before any edit; commands run from `/home/fluke/Holonovel`):

- `npm run status`: version `2026.11.12`, 61 unpushed commits, 11 open roadmap
  items, last publish `2026-11-09`. Publication is **out of scope** (§8).
- `git status --porcelain`: clean.
- `npm run check:fast`: **41 passed, 0 failed**, trailing `check:fast: PASS`.
- Server harness baseline: not yet recorded; Phase 0 runs the six suites in §6
  and records each pass count, so a pre-existing red is named rather than
  inherited.

Findings and current predicates (verified this session by symbol/line read; the
register's line numbers drift, so Phase 0 re-anchors after any predecessor
commit):

| Finding | Predicate (current) | Contract |
|---|---|---|
| F-P3B2-9 | `composeBadgeBriefing` has no entity personality group. `fmtEntitySheet` renders personality only in the sheet (`index.ts:3679-3694`). Voice examples are stored on `NovelEntity`/`NpcState` (`core/state.ts:230`, `:267`) but never rendered in the briefing; `manage_character (action: voice)` stores `args.examples` uncapped (`index.ts:4878-4882`; schema `:4674`); `NovelEntity.personality` has no `persona` field while `NpcState.persona` is NPC-only (`core/state.ts:229`, `:258`) | REQ-077a, REQ-077b, REQ-077d, REQ-077e, REQ-077f, REQ-126a, REQ-126b, REQ-166a, REQ-166b, REQ-166c |
| F-P3B2-10 | The voice directive block is inside the `badge === "game_master" \|\| badge === "observer"` branch (`index.ts:16472-16509`), so a Player never sees a shared-scope directive; it has no NPC `scope` gate, no `role` field (NpcState has none), and no `tag`/active-`scene_type` filter (`index.ts:16492-16507`) | REQ-282a, REQ-282b, REQ-282c |
| F-P3B2-11 | `entity://<id>/personality` returns `entity.personality ?? {}` and `npc://<id>/personality` returns the bare personality object plus `description` — no `entity_id`/`npc_id`, no `name`, no `voice_examples`, no source metadata, no badge filter (`index.ts:14224-14231`, `:14366-14376`) | REQ-167a, REQ-167b |
| F-P3B2-12 | `player_signals: Record<string, string>` (`core/state.ts:759`); the signal handler writes the raw string and stores `""` instead of removing (`index.ts:4918-4921`); no `connection_counter` or `last_updated`; audit uses `audit("player_signal", …)` not the REQ-069c tool name/prefix; the briefing prints `k: v` with no age (`index.ts:16382-16389`) | REQ-069a, REQ-069b, REQ-069c, REQ-128a, REQ-128b, REQ-173b |
| F-P3B2-13 | `boundaryCollisionWarning` is called from exactly one site, `manage_scene (action: set)` (`index.ts:2715-2723`, call at `:7468`); `manage_npc`, `manage_lore`, and `manage_scene (action: directive)` never call it | REQ-255b |
| F-P3B2-14 | T55, T56, T57, T58, T65, T112, T132, T140, T142, T723 appear in per-REQ `_Check:_` lines but in no `holonovel/scripts` harness title; T131 is titled on the conflict-lifecycle test (`test-backfill.ts:415`); T201 asserts a resource read rather than briefing rendering (`test-output-contracts.ts:1126`); T216/T220 assert an entity count, not the contract (`test-backfill.ts:943`) | REQ-074, REQ-075g, REQ-076, REQ-077, REQ-126b, REQ-124b, REQ-128b, REQ-167b |

Out of scope: the P2 sweeps (unscoped-surface review, harness label hygiene,
anchor repoint automation), the F-P3B1/B3/B4 families, and publication.

## 2. Done bar

**Done bar:** F-P3B2-9 through F-P3B2-13 are `Resolved` in
`spec/audit/review-register.md` with current predicates, and F-P3B2-14 is
`Resolved` for the false-match and narrow-assertion defects it owns while its one
unimplemented citation is split out: a new **REQ-124 NPC damage resolution (P1)**
row enters `ROADMAP.md` and a matching `Scheduled-roadmap` register row records
the REQ-124a/b gap (D10). Every `Scheduled-roadmap` cross-reference naming the
retired section is updated in the same step; the shipped
*§5.6 personality, signal, and citation remediation (P1)* section is removed from
`ROADMAP.md`. Every new assertion was observed red before its fix and the
transcripts are in `aar.md`; the six suites — `test-output-contracts`,
`test-backfill`, `test-narrative`, `test-briefing`, `test-persistence`,
`test-persistence-guardrails` — pass; root and server `typecheck`,
`npm run check:fast`, and the full `npm run check` (via `build-order`) are green
with the summary read; `holonovel/tool-definitions.json` is regenerated for the
schema/description changes; `surface-budget --write` and the DECISIONS
action/token counts agree with the new parameters; no new tool and no new action
is added; the §7.7 outcome is the one Phase 1's declaration probe records — no new
property group either way, and if the probe requires a class-contract sentence the
plan's fingerprint regeneration step (`build-order`) runs; the coverage register
is regenerated and REQ-069/077/126/128/166/167/173/255/282 stay bucket C at family
level; `aar.md` ends `LOOP PAUSED` with zero new action items.

**Fallback if the session cap binds (not an alternate bar):** the completed
findings commit with their green assertions, the ROADMAP section stays open with
those findings moved to `Resolved` in the register, the REQ-124 item is still
added, and `aar.md` ends `LOOP OPEN` naming the remaining findings. A finding is
never claimed resolved without its green assertion.

Current values the edit must respect:

- `spec/02-requirements.md` bodies and `_Check:_` lines: no edit.
- `spec/04-runtime.md` §7.7: Phase 1's declaration probe decides. The group table
  is group-granular and `persona`/`scope`/`role`/the signal compound are members
  of existing surfaces, so the expected outcome is no edit. If the probe requires
  a §7.7.0 class-contract sentence, `check-fingerprint-sync` fails; the plan then
  runs `npm run build-order` to regenerate fingerprints in the same increment.
- `player_signals` is persisted through four paths (`core/state.ts:1240`,
  `:1688`, `:3015`, `:3201`) and read by the boundary helper and the briefing;
  the migration must cover every path (D7).
- `audit(tool, args, prefix?)` (`index.ts:2725`) forwards to `state.audit`; the
  REQ-069c prefix is set through this third argument.
- `NEVER_TRUNCATED` (`index.ts:3500`) is keyed by section title; REQ-128b's
  "never truncated" requires the player-signals title to join it (D8).
- `resolvedSceneTypes` (`index.ts:7240-7246`) is the existing active-`scene_type`
  source; `novel.scene_type` is an array (`core/state.ts:752`).

## 3. Design decisions

**D1 — one personality accessor, one renderer, one voice-example source.**
Add `core/personality.ts` with three pure helpers:
`personalityFieldsFor(target)` returns `{description, voice, background, goals,
persona}` with unset keys removed and the NPC description read through the
existing `npcDescription` rule; `voiceExamplesFor(target, activeSceneTypes)` caps
at 5 and filters by tag (no tag or `neutral` always surfaces, otherwise the tag
must match an active `scene_type`); `renderPersonalityBlock(name, fields,
examples, opts)` emits voice examples **before** trait lines, omits unset fields,
preserves the `[player-corrected]` annotation (REQ-344/P32) and the
`[supplementary] <source_url>` annotation, and distinguishes NPCs with an `[NPC]`
marker. The briefing, both personality resources, and `fmtEntitySheet` all call
these helpers, so REQ-126's ordering cannot drift between surfaces.

**D1b — `persona` renders because REQ-077d says "the fields", and the plan
records the enumeration tension.** REQ-166a and REQ-167a enumerate `description`,
`voice`, `background`, and `goals`; REQ-077a defines `persona` as a personality
field and REQ-077d says "the server surfaces the fields". The plan reads
REQ-077d's broader phrase as governing, so `persona` renders after `goals` on the
briefing group, both resources, and the sheet. The Phase 1 declaration probe is
the decision point: if it shows the shorter enumerations are read as exhaustive
(the validator does not mechanically check field enumerations), the fallback is
to persist `persona` and omit it from read surfaces, recording the P3 note in
`aar.md`. Phase 1 resolves this before Phase 3.

**D2 — the personality group renders all entity blocks, and scope-filtered NPC
blocks.** `composeBadgeBriefing` gains one call to a `composePersonalityGroup`
helper, outside the GM-only branch. Entity blocks render for every badge: the
Player badge already reads every entity's personality through the
`party://current`/entity resources, and REQ-166a places no badge qualifier on the
entity block. NPC blocks render for GM/Editor always and for the Player only when
`npc.scope === "shared"` (REQ-282a's badge rule). When no entity or NPC has
personality data, the group renders the REQ-109 empty-state marker. The group is
supplementary (REQ-109e) and therefore truncatable; the NPC memory sub-block
stays GM-only and unchanged.

**D3 — NPC badge scope and role are stored fields on the NPC group.**
`NpcState` gains `scope?: "game_master" | "shared"` and `role?: string`.
`manage_npc (action: create|update)` gains `scope` and `role` parameters; `scope`
defaults to `game_master` (the safe default for pre-existing NPCs, which have no
scope) and `role` defaults to `"NPC"` at render time. The directive format is
`Voice directive (<name>, <role>): <voice>.` followed by up to two filtered
examples and the `Avoid:` line (D4). No new property group: both fields are
members of the NPC group.

**D4 — the voice directive moves out of the GM branch, keeps the location gate,
and filters before it slices.** The block renders after the NPC's personality
block, not in a separate GM-state area, per REQ-282b. It keeps REQ-282a's two
conditions exactly: the NPC's `location` matches the current scene location
(case-insensitive, the same predicate the presence loops use) **and**
`voice_examples` is non-empty. It selects examples with `voiceExamplesFor` (tag
filter first), then takes the first two; REQ-282a says "the first two examples
from the array" while REQ-282c says only tag-matching examples surface, and the
plan resolves the tension as filter-then-slice (a tagged-out first example does
not consume a slot) and asserts it. `Avoid:` is synthesized from the voice field
with a small fixed table (for example formal/casual, clipped/rambling, warm/cold)
and falls back to naming the opposite of the voice value when no table row
matches. The directive is advisory text only; it never gates an action.

**D5 — voice examples carry source metadata and a hard 5-example cap.** The
example type gains optional `source?: "synthesis"` and `source_url?: string` in
both `NovelEntity` and `NpcState`. `manage_character (action: voice)` and the
NPC/card import paths normalize through one `normalizeVoiceExamples` helper:
more than 5 examples returns `[INVALID_INPUT]` naming the cap (silent truncation
would drop authored data), and synthesis-sourced entries keep `source`/
`source_url` and render `[supplementary] <source_url>` after player-authored
examples (REQ-126b). Existing Novels with more than 5 examples render the first
5 and are not rewritten on load.

**D6 — both personality resources return one structured shape.** Add
`personalityResource(target, kind)` returning `{ entity_id | npc_id, name, ...
populated fields, voice_examples }` with unset fields absent (REQ-167a). The
`entity://{id}/personality` handler resolves entities only (the current NPC
fallback is removed; NPCs have their own URI) and the `npc://{id}/personality`
handler resolves NPCs. Badge filtering follows REQ-167b: the entity resource is
readable by every badge; the NPC resource is GM/Editor-only for
`scope: "game_master"` and readable by the Player for `scope: "shared"`. A
filtered NPC returns `[FORBIDDEN]`-shaped JSON with a corrective action rather
than an empty object, so the caller can tell "hidden" from "unpopulated".

**D7 — player signals become a compound entry with migration.** Replace
`Record<string, string>` with `Record<string, PlayerSignalEntry>` where
`PlayerSignalEntry = { value: string; connection_counter?: number; last_updated?:
string }`. `manage_character (action: signal)` for the five REQ-069a types and for
`detail` (REQ-197/REQ-197c call it a signal and store it through the same action):
empty `value` deletes the key and audits `Signal '<signal>' removed.`; a
non-empty value writes `{ value, connection_counter: novel.connection_counter,
last_updated: new Date().toISOString() }` and audits
`manage_character (action: signal)` with `{signal, value}` and
`Signal '<signal>' recorded.` (REQ-069c). The load path migrates a legacy string
to `{ value: string }` with no counter, so REQ-173b's "unknown" age applies to
pre-existing Novels. `voice_feedback` keeps its existing audit and storage path.
Readers (`boundaryCollisionWarning`, the boundaries section, the signals section)
read `.value`.

**D8 — the signals section reports age and joins the never-truncated tier.**
The GM-only section lists `type: value (set N connections ago)`; zero renders
"set this connection", no counter renders "unknown" (REQ-173b), one renders
"set 1 connection ago" and N>1 "set N connections ago" (REQ-128a). An empty map
renders the existing empty-state marker. The literal token `"player signals"`
joins `NEVER_TRUNCATED`, which lowercases the section header and substring-matches
it (`index.ts:3500-3520`), so the prompt-budget pass cannot drop it (REQ-128b).
The separate Boundaries section keeps its current GM-only absolute directive and
renders only an active `boundary` signal.

**D9 — boundary propagation is one helper at every free-text entry point.**
Add `appendBoundaryWarning(output, novel, texts)` that runs
`boundaryCollisionWarning` over each supplied text and appends one `[WARNING]`
paragraph naming the matched boundary and the colliding segment. Call sites:
`manage_scene (action: set)` (existing), `manage_scene (action: directive)`,
`manage_npc (action: create|update)` over `description`/`persona`/`goals`,
`manage_lore (action: set|update)` over `content`. The operation still succeeds;
the warning is appended after the `[OK]` line. Multiple matches produce one
warning per matched boundary, deduplicated.

**D10 — citation repair uses only existing catalogue IDs, and the one
unimplemented citation is scheduled rather than re-pointed.** Write assertions
whose titles carry T55, T56, T57, T58, T65, T112, T132, T140, T142, T723, T129,
and T202, in the harness that owns the surface (Phase 8). Correct the
conflict-lifecycle title at `test-backfill.ts:415` by removing the false T131
token; the title's T91 (a Manual Appendix O cross-check) and T162 are recorded as
residual mislabels under the existing P2 harness-hygiene item, not fixed here.
For REQ-124b, no reachable NPC-damage resolution surface exists today (verified:
no `roll_weapon_damage` handler or HP application path; `manage_ruleset (action:
roll)` only rolls generation tables). Re-pointing its `_Check:_` to a party or
count assertion would make the coverage audit read an unimplemented contract as
evidenced. The plan therefore leaves REQ-124b's citation and body untouched,
adds a **REQ-124 NPC damage resolution (P1)** item to `ROADMAP.md` with a
matching `Scheduled-roadmap` register row, and marks F-P3B2-14 `Resolved` for the
false-match and narrow-assertion defects it owns. T201 is tightened to assert
briefing rendering, and T216/T220 are tightened to assert the party/
`party://current` contract rather than an entity count.

**D11 — no new tool, action, or §7.7 property group.** The schema changes are
parameters on `manage_character (action: signal/voice/personality)` and
`manage_npc (action: create/update)`; no action is added. `scope`/`role` are
members of the existing NPC group; `persona` and the voice-example source fields
are members of the existing personality/Voice Examples surface; the signal
compound stays in the Session/Pacing Signal surface. If `npm run validate`
rejects a field as undeclared, the fix is a §7.7.0 class-contract sentence plus
`build-order` fingerprint regeneration, not a new property row.

## 4. Blast radius

| Path | Size | Change | Gate that notices |
|---|---|---|---|
| `holonovel/src/core/personality.ts` | M | New pure module: `personalityFieldsFor`, `voiceExamplesFor`, `renderPersonalityBlock`, `normalizeVoiceExamples`, `npcRole` | `typecheck`, `check-script-quality` (reachability) |
| `holonovel/src/core/state.ts` | M | `NovelEntity.personality.persona`; voice-example `source`/`source_url`; `NpcState.scope`/`role`; `PlayerSignalEntry` + `player_signals` type; migration in both load paths and both serialize paths | `typecheck`, `test:persistence`, `test:persistence-guardrails` |
| `holonovel/src/index.ts` | L | Personality group + renderer wiring; directive move/scope/tag; personality resources; signal storage/audit/ages; boundary helper at five sites; schema/description edits | `typecheck`, `surface-budget`, `check-tool-definitions-sync`, `action-conflicts`, `check-tool-surface`, `surface-replay` |
| `holonovel/scripts/test-output-contracts.ts` | M | T55, T58, T65, T132, T129, T202 assertions; tighten T201/T216/T220 | harness run |
| `holonovel/scripts/test-briefing.ts` | M | T57, T140, T142, T332 scope/tag assertions; personality-group ordering | harness run |
| `holonovel/scripts/test-narrative.ts` | M | T56, T112, T723 assertions | harness run |
| `holonovel/scripts/test-backfill.ts` | M | T56 restart/persistence; T131 title correction | harness run |
| `holonovel/scripts/test-persistence.ts` | S | Signal-compound round-trip and legacy-string migration | harness run |
| `holonovel/scripts/test-persistence-guardrails.ts` | S | Legacy save literal accepts the string form | harness run |
| `holonovel/tool-definitions.json` | S | Regenerated (schema/description text); deterministic | `check-tool-definitions-sync`, `tool-definitions-lint` |
| `holonovel/DECISIONS.md` | S | Action/token counts refreshed only if `surface-budget --write` moves the footprint | `check-traceability`, `surface-budget` |
| `spec/02-requirements.md` | — | No change (no body or `_Check:_` edit) | `validate`, `lint` |
| `spec/audit/review-register.md` | S | F-P3B2-9…14 → `Resolved` with current predicates; a `Scheduled-roadmap` row for REQ-124a/b; `Scheduled-roadmap` rows naming the retired section updated | `check-registers` |
| `spec/audit/req-coverage.md` | S | Regenerated | `validate` freshness |
| `ROADMAP.md` | S | Remove the shipped section and add **REQ-124 NPC damage resolution (P1)**; `## Non-goals` untouched | `check-roadmap` |
| `CHANGELOG.md` | S | Dated `2026-11-12` heading (matches package version) with one bullet per surface group | `session:close` |
| `docs/plans/2026-11-12-5-6-personality-signal-citation/{plan,tasks,aar}.md` | S | This plan, its task list, the AAR (plus cold-review artifact) | `check-loop-artifacts` |

Not touched: `spec/04-runtime.md` (§7.6/§7.7 unchanged unless Phase 1's
declaration probe requires a class-contract sentence, in which case
`build-order` regenerates fingerprints); `spec/02-requirements.md` (no body or
citation edit); `holonovel/AGENTS.md` (no tool or action count change);
`scripts/` (no new gate); `holonovel/package.json` (no dependency or script
change).

## 5. Phases

### Phase 0 — baseline and re-anchor

1. Confirm the tree is clean (`git status --porcelain`); if a predecessor
   increment is uncommitted, commit it first so the baseline is honest.
2. Re-run `npm run check:fast` and record the trailing PASS line.
3. Run the six suites in §6 and record each suite's pass count.
4. Re-anchor every predicate in §1 and every citation token in Phase 8 to the
   current tree (`grep -n`), correcting drift.

**Done when:** clean tree, green `check:fast`, six baselines recorded, anchors
verified.

### Phase 1 — probes before implementation

1. Sibling-contract probe: grep the REQ corpus for every REQ that binds
   `manage_character (action: signal)` or `(action: personality|voice)`,
   `manage_npc (action: create|update)`, `manage_scene (action: directive)`,
   `manage_lore (action: set|update)`, and both personality resources. Record
   what each demands of parameters, output, and badge filtering; resolve any
   conflict before the first edit.
2. Declaration probe: grep §7.7/§7.7.0 for `persona`, `scope`, `role`,
   `player_signals`, and `voice_examples`; confirm no class-contract sentence is
   required or add it and schedule fingerprint regeneration.
3. Surface probe: enumerate the tool-schema fields and descriptions in
   `index.ts` for the five touched actions plus `manage_character (action: sheet)`
   and the two resource registrations; list every site the change must touch so
   no surface is discovered at implementation time.
4. Audit-path probe: confirm every `player_signals` reader/writer
   (`grep -rn player_signals holonovel/`) is in the blast-radius table.

**Done when:** the probes' findings are recorded in `aar.md`, and any scope
change is folded into this plan before Phase 2.

### Phase 2 — red probes

Write each assertion before its implementation and capture the failure text in
`aar.md`: personality group presence and ordering, voice-example tag filter,
5-example refusal, NPC directive under Player/shared and Player/GM-scope,
resource shape and badge filter, signal compound and removal, signal ages,
boundary warning from each of the five entry points, and the tightened
T201/T216/T220 assertions.

**Done when:** every listed assertion has been observed red once.

### Phase 3 — personality accessor and group (D1, D2; F-P3B2-9, -11)

- Add `core/personality.ts` helpers and wire `fmtEntitySheet` through them.
- Compose and insert the entity personality group outside the GM-only branch;
  render voice examples before traits, omit unset fields, add the `[NPC]`
  marker and the REQ-109 empty state.
- Reshape both personality resources through `personalityResource` and badge
  filter the NPC resource.

### Phase 4 — voice directive, scope, and tags (D3, D4, D5; F-P3B2-10)

- Add `NpcState.scope`/`role`, schema parameters, defaults, and directive
  rendering with role, the REQ-282a location match, the tag filter (filter
  before slice), and the synthesized `Avoid:` line.
- Move the directive out of the GM-only branch; GM sees all, Player sees shared.
- Add source metadata, the `[player-corrected]` annotation, and the 5-example
  cap on every write path; render `[supplementary]` after player-authored
  examples.

### Phase 5 — signal storage, audit, and briefing (D7, D8; F-P3B2-12)

- Compound type, four persistence paths, legacy-string migration.
- Removal on empty value; counter/timestamp refresh; REQ-069c audit tool name,
  args, and output prefix.
- GM-only age rendering and the never-truncated title.
- Boundaries and boundary helper adapt to `.value`.

### Phase 6 — boundary propagation (D9; F-P3B2-13)

- `appendBoundaryWarning` at all five entry points; assert the operation still
  succeeds and the warning names boundary and segment; assert a no-boundary
  Novel is unchanged.

### Phase 7 — registers, roadmap, generated surfaces

- Review register: F-P3B2-9…14 `Resolved` with current predicates; add the
  `Scheduled-roadmap` row for REQ-124a/b; update every `Scheduled-roadmap` row
  that names the retired ROADMAP section in the same edit.
- `ROADMAP.md`: remove the shipped section, add **REQ-124 NPC damage resolution
  (P1)** with its trigger and the two REQs it covers; run `check-roadmap` and
  `check-registers` immediately after.
- `npm run validate -- --write-register`; regenerate
  `holonovel/tool-definitions.json`; run `npm run surface-budget --write` and
  refresh DECISIONS counts only if the baseline moved.

### Phase 8 — citation repair (D10; F-P3B2-14)

- Write catalogue-titled assertions: T55 (entity lifecycle + `party://current`
  in `test-output-contracts`), T56 (NPC partial stats/turn/persistence in
  `test-backfill`), T57 (scene state/Player refusal in `test-briefing`), T58
  (entity personality briefing/resource/override in `test-output-contracts`),
  T65 (voice examples + supplementary + Player refusal in
  `test-output-contracts`), T112 (scene history order in `test-narrative`), T132
  (N+1 cap/suppressed count/audit in `test-output-contracts`), T140 (render
  ordering cross-surface, including the sheet, in `test-briefing`), T142 (signal
  lifecycle in `test-briefing`), T723 (talkativeness default/selection/Player
  read in `test-narrative`), T129 (NPC narrative fields/Player refusal in
  `test-output-contracts`), T202 (personality-resource shape in
  `test-output-contracts`).
- Correct the conflict-lifecycle title in `test-backfill` by removing T131;
  record T91/T162 as residual mislabels for the P2 harness-hygiene item.
- Leave REQ-124b's body and `_Check:_` untouched; add the REQ-124 roadmap item
  and scheduled register row (Phase 7); tighten T201/T216/T220.
- Re-run the coverage resolution and record the result.

### Phase 9 — gates

`npm run assemble`, then `npm run check:fast`, the six suites, root and server
`typecheck`, `npm run surface-budget`, and `npm run build-order` for the full
`check` pass with the review summary read, not swallowed.

## 6. Verification

| Gate | Command | Expected |
|---|---|---|
| Baseline | `npm run status`, `npm run check:fast` | 41/41, `check:fast: PASS` |
| Harness baseline | six suites in Phase 0 | pass counts recorded; a pre-existing failure is named |
| Output contracts | `npm --prefix holonovel run test:output-contracts` | all pass, new assertions included |
| Backfill | `npm --prefix holonovel run test:backfill` | all pass |
| Narrative | `npm --prefix holonovel run test:narrative` | all pass |
| Briefing | `npm --prefix holonovel run test:briefing` | all pass |
| Persistence | `npm --prefix holonovel run test:persistence` | compound round-trip and legacy migration pass |
| Guardrails | `npm --prefix holonovel run test:persistence-guardrails` | legacy literal accepted |
| Types | `npm run typecheck`, `npm --prefix holonovel run typecheck` | clean |
| Surface | `npm run surface-budget --write` then `npm run surface-budget` | within budget; DECISIONS counts refreshed only if the baseline moved |
| Definitions | `npm run check-tool-definitions-sync` after regeneration | green |
| Coverage | `npm run validate -- --write-register` | 0 errors, no bucket-A growth |
| Fast gate | `npm run check:fast` | all pass, trailing line read from the un-piped command |
| Full gate | `npm run build-order` | `check` green, review summary printed |

Negative-path checks that must appear in assertions, not only happy paths: a
sixth voice example is refused; a Player sees a shared-scope directive and not a
GM-scope one; an NPC whose `location` does not match the scene renders no
directive; a tag that matches no active scene type is filtered and does not
consume one of the two slots; a `[player-corrected]` example keeps its
annotation; an empty signal value removes the row and the briefing empty state
returns; a legacy string signal shows "unknown"; a boundary collision on each of
`manage_npc`, `manage_lore`, and `manage_scene (action: directive)` warns without
blocking; T132 asserts exactly N entries plus the suppressed count and the full
audit log.

## 7. Risks and mitigations

1. **The signal shape change breaks old Novels.** Mitigation: migrate on load in
   both paths and assert a literal legacy save in `test-persistence-guardrails`.
2. **The personality group changes briefing ordering or truncation.** Mitigation:
   render from one helper at one insertion point; assert T140 ordering and the
   signals-never-truncated case; keep the group supplementary per REQ-109e.
3. **Player visibility of NPC personality leaks GM content.** Mitigation: the
   resource and directive both gate on `scope`; the default is `game_master`, so
   pre-existing NPCs stay hidden until the GM explicitly shares them; assert
   both directions.
4. **The directive tag filter and the "first two examples" rule conflict.**
   Mitigation: filter first, then slice, and assert a tagged-out first example
   does not consume a slot (D4).
5. **`persona` on entities is undeclared state or outside the read enumerations.**
   Mitigation: Phase 1's declaration probe decides; the plan records REQ-077d's
   broader "the fields" reading (D1b), and if `validate` rejects it the fallback
   is persist-only with a P3 note; any §7.7.0 sentence triggers `build-order`
   fingerprint regeneration rather than a hand edit.
6. **Citation repair becomes implementation work (T131).** Mitigation: D10 leaves
   REQ-124b untouched and schedules the missing NPC damage surface as a P1
   roadmap item; no damage tool is added here, and the coverage audit never reads
   the gap as evidenced.
7. **Scope creep into the P2 harness-label family.** Mitigation: use only
   existing Appendix F IDs; fix only the T131 false token and record T91/T162 as
   residual mislabels rather than renumbering harness titles wholesale.

## 8. Deliberately deferred

- **Publication** — `./scripts/push-pipeline.sh` is a user-authorized step, not
  part of this session.
- **The P2 sweeps** (unscoped-surface review, test-ID label hygiene, anchor
  repoint automation) — untouched.
- **REQ-124a/b NPC damage resolution** — no reachable damage surface; scheduled
  as a new P1 ROADMAP item (D10), not claimed as fixed.
- **REQ-069b's pace-window adjustment** — the current `pacingWindow()` reads only
  the environment (`index.ts:384`); the signal does not adjust it. This is
  outside F-P3B2-12's storage/briefing predicate and is recorded as a P3
  coverage note, not claimed as fixed.
- **T91/T162 residual title mislabels** — recorded under the P2 harness-hygiene
  item; this increment removes only the false T131 token.

## 9. Commit plan

One commit (`§5.6 personality, signal, and citation remediation`), per
AGENTS.md's "a spec increment is one commit" rule. The CHANGELOG heading is
dated `2026-11-12` — the package version and the value `session:close` derives
its subject from — with one bullet per coherent surface group (personality
rendering/resources, voice directive/scope/tags, signals/boundary, citation
repair, roadmap/register).

## 10. User impact and sizing

- **Players** see their entity's personality fields and voice examples in the
  briefing and resources, and see shared-scope NPC voice directives; GM-scope
  NPC material stays hidden.
- **The GM** gets a personality group with voice examples ahead of traits, a
  scope- and scene-tag-aware voice directive, a signal section that reports how
  old each preference is, and boundary warnings on every free-text entry point.
- **Cost:** roughly 300-450 changed source lines plus assertions across six
  harness files; one generated artifact (`tool-definitions.json`), the surface
  baseline, two register files, one ROADMAP removal and one new ROADMAP item.
- **No migration:** every new field defaults on load; legacy signals render
  "unknown" rather than a wrong age.

## 11. Review record

- Self pass: run against artifact `dcde0bdf…`; it found the REQ-124b re-point
  contradiction and the two-done-bars ambiguity before dispatch. The review
  independence is recorded in the AAR.
- Cold pass (`independent-review`, standard depth): **FAILED** on `dcde0bdf…`
  with one Blocker (REQ-124b re-point was circular and mis-tiered), five Majors
  (two done bars, the dropped REQ-282a location gate, the asserted-but-deferred
  §7.7 position, `persona` outside the read enumerations, and the missing
  T129/T202 coverage plus a non-existent "T167-resource" ID), and seven Nits.
  Every Blocker and Major is resolved in this revision: D10 now schedules
  REQ-124a/b instead of re-pointing; §2 states one bar plus a separate fallback;
  D4/Phase 4 keep the location gate; the §7.7 outcome is conditional on the
  Phase 1 probe; D1b records the REQ-077d reading; T129/T202 and the sheet half
  of T140 are assigned. The Nits are resolved in D8 (literal token), D7
  (REQ-197c), D1/D5 (`[player-corrected]`), Phase 8 (residual T91/T162), D4
  (filter-then-slice), and this record.
- Diff re-review (standard-depth cap, 10 reads): `independent-review passed.` —
  all prior findings adjudicated, with two changed-line Majors left for a final
  cleanup: a surviving `T167-resource` mislabel in the blast radius and a
  `REQ-197c`-only citation for the `detail` signal. Both are fixed in this
  revision (the cell now names T202 only; D7 cites REQ-197/REQ-197c), so no
  changed-line Major remains.
- Conditions carried into execution: none.
