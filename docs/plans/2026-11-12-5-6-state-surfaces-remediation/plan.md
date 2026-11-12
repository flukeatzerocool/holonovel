# Plan — §5.6 state surfaces remediation

Status: draft (self pass pending) · Kind: planned · Depth: standard
Increment target: `docs/plans/2026-11-12-5-6-state-surfaces-remediation/`
Rollback cost: 2 (server source, harness, catalogue citation, register, roadmap;
reversible, one commit)
Evidence class: repo only (no web, no user-supplied content)

## 1. Objective

Take the top open `ROADMAP.md` section — **§5.6 state surfaces remediation
(P1)** (`ROADMAP.md:15-37`) — and close its fifteen findings, F-P3B4-1 through
F-P3B4-15 (`spec/audit/review-register.md:2065-2117`). The REQs already state
the contracts; the server and its harness are narrower than the spec. This is an
implementation-and-assertion increment, not a spec-design change.

Baseline (this session, before any edit):

- `npm run status`: version `2026.11.12`, 58 unpushed commits, 12 open roadmap
  items, last publish `2026-11-09`. Publication is **out of scope** (§8).
- `git status --short`: clean apart from this untracked plan directory
  (`?? docs/plans/2026-11-12-5-6-state-surfaces-remediation/`); no other edit
  exists in the tree.
- `npm run check:fast`: 40 passed, 0 failed, `check:fast: PASS`.

| Finding | Predicate (current, symbol-anchored) | Contract |
|---|---|---|
| F-P3B4-1 | `get_context` returns raw JSON with no `badge_briefing` (`index.ts:11841-11850`); `save_context` slices `story_journal` with no type filter (`:11822`); `intro` composes without `gm_context` (`:14967`, `core/prompt-composition.ts:90`) | REQ-232b, REQ-232c |
| F-P3B4-2 | The World in Motion block renders `npc_goal_suggestions` only, with accept/defer/dismiss/auto-apply (`index.ts:15431-15475`); the resolver has no `modify` and no deferral cap (`:3624-3646`); no ripple trace on a connected change | REQ-233a1, REQ-233a2, REQ-233a3 |
| F-P3B4-3 | No lore-entry prompt on an `ally`↔`rival` flip (nothing in `manage_relationship`/briefing); the neutral-inclusive transition set **is** implemented (`:1049-1057`) — assertion only | REQ-236a, REQ-236b |
| F-P3B4-4 | `audit://novel` renders each entry's raw `args` for every badge (`index.ts:13442-13461`), so a Player sees `session_id` | REQ-237b1 |
| F-P3B4-5 | No `notes` section token or section in `badge_briefing` (`index.ts:15006-15490`; token table `:13149-13161` has no `notes` row) | REQ-242b |
| F-P3B4-6 | `saveServerNotes` (`core/state.ts:2849-2861`) and `saveCodex` (`:2875-2887`) call `writeFileSync` with no temp-and-rename and no backup rotation; `saveNovel` (`:2673-2745`) is atomic and rotating | REQ-285a, REQ-321k |
| F-P3B4-7 | `spec_health.codex` is `state.codex.size` (`index.ts:12985`), not partitioned by kind | REQ-321l |
| F-P3B4-8 | **Already implemented** at `index.ts:14527` (`ruleset: novel.ruleset ?? null`, REQ-387a) — assertion only | REQ-321g |
| F-P3B4-9 | No `codex-stale` literal anywhere in `holonovel/src`; `spec_health` computes no staleness (`:12985-12987`) | REQ-332b, REQ-332c |
| F-P3B4-10 | REQ-065f cites Automated T52, which no harness titles (`spec/appendices-reference.md:1514`). T224 exercises the drift branch (`holonovel/scripts/test-persistence.ts:702-712`) | REQ-065f |
| F-P3B4-11 | REQ-236c cites Automated T270, which no harness titles | REQ-236c |
| F-P3B4-12 | REQ-233a3 cites Automated T358, which no harness titles | REQ-233a3 |
| F-P3B4-13 | T275 asserts only that `spec_health.sessions` is an array (`test-output-contracts.ts:714-724`) | REQ-237b1, REQ-237b2 |
| F-P3B4-14 | T280 asserts set/list/remove only (`test-backfill.ts:250-255`) | REQ-242d |
| F-P3B4-15 | T334 asserts set/list plus briefing (`test-backfill.ts:257-300`); no restart, no Player tool refusal, no `server-notes://`, no health count | REQ-285c |

**Two findings are already satisfied in code.** F-P3B4-3's neutral-inclusive
marker set and F-P3B4-8's captured-entry `ruleset` are present. Phase 1 proves
each with a red-first assertion attempt (the assertion should pass immediately;
that pass is recorded as *already-satisfied*, not as red-proven) and the plan
spends no implementation step on them. Every other row is a real gap.

Out of scope: the other §5.6 remediation sections (`ROADMAP.md:38-140`,
F-P3B1/B2/B3 families) and the P2 sweeps (F-P4-10/11/12 stay `Closed-P3`).

## 2. Done bar

**Done bar:** all fifteen findings are `Resolved` in
`spec/audit/review-register.md` with current predicates; the ROADMAP section is
removed; every new assertion was observed red before its fix, except the two
already-satisfied rows, and the exception is recorded in `aar.md`;
`npm --prefix holonovel run test:output-contracts`, `:test-backfill`,
`:test-persistence`, `:test-briefing`, and `:test-narrative` pass;
`npm run typecheck` (root and server), `npm run check:fast`, and the full
`npm run check` are green; the coverage register is regenerated and
REQ-065/232/233/236/237/242/285/321/332 stay bucket C; no new tool, resource, or
gate is added; the one new Novel-persisted key (`world_in_motion`) is added to
the `novelToJSON`/load/import enumerations and the §7.7 property group it belongs
to already exists; `aar.md` ends `LOOP PAUSED` with zero new action items.

Current values the edit must respect:

- `spec/02-requirements.md` REQ bodies: the only body edit is REQ-065f's
  `_Check:` line (the replacement is shorter than the current `T52, T224`
  citation, so the 800-character body limit is not at risk).
- `holonovel/src/index.ts` is fingerprinted only as source code (REQ-313);
  `npm run build-order` re-runs the gate after the edit.
- `spec/appendices-reference.md` catalogue rows T270/T358/T384 already state the
  full contract; the plan verifies each row and edits a row only when the
  assertion cannot match the stated wording.

## 3. Design decisions

**D1 — `get_context` reuses the briefing renderer with side effects off
(F-P3B4-1).** The 485-line body of `server.prompt("badge_briefing")`
(`index.ts:15006-15490`) is extracted into
`function composeBadgeBriefing(novel: NovelState, opts: { mutate: boolean }): string`.
The prompt becomes a thin wrapper calling `composeBadgeBriefing(novel, { mutate: true })`
(byte-identical output). `get_context` calls it with `mutate: false`, which
skips `triggerPacingAutonomy` (REQ-336/351 advances the counter) and skips
`ensureGoalSuggestion` plus the save/audit in the World in Motion block. The
tool is **not** re-gated: REQ-232b marks only `save_context` Game Master only, and
it says `get_context` "returns a complete briefing" including `gm_context`
content, the Novel state summary, and the `badge_briefing` prompt. The
`gm_context` field therefore stays in the response for every caller exactly as
it is today; this increment adds the `badge_briefing` payload and does not
re-scope the field. Rejected alternative: invoking the registered prompt
callback from the tool — `index.ts:1582` records that `badge_briefing`
deliberately mutates (pacing counter, world-in-motion bookkeeping), so a
documented read tool would write.

**D2 — `save_context` filters, `intro` summarizes (F-P3B4-1).**
`story_context` becomes `novel.story_journal.filter(s => s.type === "decision" || s.type === "bond").slice(-3)`
(REQ-232c). `IntroContext` (`core/prompt-composition.ts`) gains
`gmContext?: string`; `composeIntro` renders a `## GM context` block after the
library when present. The `intro` prompt builds the summary from
`novel.gm_context` — `current_scene`, `immediate_situation`,
`pending_player_action`, `short_term_plans`, `long_term_plans`,
`story_context`, `active_vows` — only when a Novel is active and the object has
content. The summary goes through `applyPromptBudget` like the rest.

**D3 — World in Motion generalizes without a new property group (F-P3B4-2).**
`NovelState` gains `world_in_motion: WorldChange[]` (REQ-233a2's "pending world
changes") with
`{ id, source, summary, targets: string[], state: "pending"|"accepted"|"deferred"|"dismissed", defer_count, created_at }`.
The §7.7 property table already lists **World in Motion** (Narrative-memory,
REQ-233a) and the coupling table already carries
`World in Motion → Campaign Memory | P16` (`spec/04-runtime.md:554`), so no
property-group, class-contract, or coupling row changes. The key is added to
`NovelState` (`state.ts:793`), the fresh-Novel default (`:1256`),
`loadNovelFromData` (`:1712`), `novelToJSON` (`:2998`), and `importNovelJSON`
(`:3192`) — clone and checkpoint copy through `exportNovelJSON`/`novelToJSON`,
so they inherit it.

**D4 — the reactivity cycle covers all three REQ-233a1 triggers.**
`enqueueWorldChange(novel, source, summary, seedIds)` computes `targets` as the
one-hop neighbours of `seedIds` in `novel.relationships` (deduped) and appends a
pending `world_in_motion` entry when no non-terminal entry with the same
`source + summary` exists. It is a no-op when `worldReactivityOn()` is false
(REQ-233a3). Three call sites, one per trigger named in REQ-233a1
(`spec/02-requirements.md:2154`):

- **Relationship change** — `manage_relationship (action: set)` at its
  `recordRelationshipMarker` call site (`index.ts:7980`); the pure predicate
  `shouldMarkRelationshipChange` (`:1052-1056`) is unchanged. Two effects, both
  required by the acceptance criterion (`:2160`): the ripple fact
  `<b> now regards <a> as <type>` is written **immediately** through
  `recordCampaignMemory(novel, "threads", text, "game_master")` (`index.ts:2420-2424`),
  and a GM-facing pending entry is enqueued with the same summary (REQ-233a2's
  accept/modify/defer surface). Campaign memory is Novel-level with no
  per-entity column, so REQ-233a3's "fact on entity B" is represented by a fact
  whose text names entity B; the connected entity ids are carried on the
  pending entry's `targets`.
- **Faction clock fill** — `fillFactionClock` (`index.ts:6449` caller;
  fill handler nearby), summary `Faction <name> completed <goal>`, seed = the
  faction id.
- **Secret revelation** — `manage_lore (action: reveal)`, secret branch
  (`index.ts:7728-7744`), summary `Secret '<key>' revealed to <entity>`,
  seed = the recipient entity id.

**Transition capture.** The marker list is deleted at `index.ts:6830`, before
the hook at `:6831-6843` that calls `advanceSceneTransitionCountdowns` at
`:6836`. The step copies
`const transitionMarkers = [...(relationshipMarkers.get(novel.slug) ?? [])]`
immediately **before** the delete and passes that copy to
`runWorldReactivityCycle(novel, transitionMarkers)`, which is called inside the
hook after `advanceSceneTransitionCountdowns`. The parser-move site
(`index.ts:5118`) gets the same call, using the marker list captured before its
own transition bookkeeping. The cycle re-surfaces deferred entries (they stay
rendered) and does not itself mutate counters. NPC goal pursuit stays in
`npc_goal_suggestions` (REQ-339) and still requires `npcAutonomyOn()`
(REQ-233a2); the briefing renders both lists in one `## World in Motion`
section, preserving the heading the Appendix F T358 row asserts.

**D5 — resolution adds `modify` and the deferral cap (F-P3B4-2).**
`respond_decision` (`index.ts:3624`) resolves `world_in_motion` entries before
the NPC block, matching on change id, then the earliest pending entry:

- `accept` → `recordCampaignMemory(novel, "threads", "GM accepted: <summary>", "game_master")`
  (`index.ts:2420-2424`), `state = "accepted"`, audit `world-in-motion`. The
  relationship ripple's own fact was already written at the state change (D4),
  so accept records the GM decision rather than duplicating the trace.
- `modify` → `novel.pending_workflow = { decision: "world_change:<id>", snapshot: state.captureWorkflowSnapshot(novel), payload: { change_id: id } }`
  and the tool returns `needInput` with the exact text
  `Modify world change '<summary>'. Respond with apply to accept it, or cancel to leave it pending.`
  and options `apply` / `cancel`. `apply` routes through the accept branch;
  `cancel` is the generic drain (`index.ts:3674-3683`), which restores the
  captured snapshot and clears `pending_workflow`, leaving the change pending.
  This is REQ-233a2's `[NEED_INPUT]`.
- `defer` → `defer_count += 1`, `state = "deferred"`; the entry re-appears at
  every transition because rendering includes deferred entries.
- `dismiss` → `state = "dismissed"` (parity with NPC suggestions; not in the
  REQ text, retained).

`spec_health.world_reactivity_warnings` (GM only) is **derived at render time**
from entries whose `defer_count >= 4` — `{ id, summary, deferrals }` per entry,
flagged `[WARNING]`. No second persisted key exists, so the done bar's
"one new Novel-persisted key" stays true. Rendering shows `source`, `summary`,
and the `accept` / `modify` / `defer` labels.

**D6 — non-GM audit rendering redacts `args` (F-P3B4-4).**
`audit://novel` builds each line through `auditLineForBadge(entry, badge)`. For
`badge === "player"` or `"observer"`, a `[session-boundary]` entry renders
`started_at`/`ended_at` only (REQ-237b1) and any other entry's `args` have the
`session_id` key removed (JSON parsed when possible, a key-delete on the parsed
object; otherwise the `session_id` key is removed textually (`/"?session_id"?\s*:\s*"[^"]*"/g`
and the `[session-boundary]` arg form). The GM path is unchanged, the hash column is
untouched, and the audit chain is not rewritten.

**D7 — one atomic flat-store writer (F-P3B4-6).**
`private writeFlatStore(fileName: "server-notes.json" | "codex.json", payload: Record<string, unknown>): void`
performs `mkdir -p`, the same `.bak.N` rotation as `saveNovel`
(`state.ts:2709-2737`, count from `backupCount()` → `TTRPG_NOVEL_BACKUP_COUNT`,
reused rather than adding a new behavioral config), an `fsync`-ed
`<file>.<pid>-<Date.now()>.tmp`, then `renameSync`. `saveServerNotes` and
`saveCodex` build their payload and delegate. Rejected alternative: reuse the
Novel writer — it stamps `novel_format_version`, checksums, and compresses,
none of which the flat META_KEY format carries.

**D8 — `spec_health.codex` becomes a partition and staleness is computed
(F-P3B4-7, F-P3B4-9).** `codex: isGM ? { total, by_kind } : undefined`
(REQ-321l). `codex_stale` (GM only) lists, for every Novel artifact carrying
`codex_source`, the artifacts whose source entry's `codex_modified_at` is newer
than the recorded `codex_source.codex_modified_at`, each shaped
`{ artifact, kind, codex_id, flag: "[codex-stale]" }` (REQ-332b). The list is
recomputed per `spec_health` call, not persisted. T384's existing substring
assertion (`test-output-contracts.ts:962`) still passes; it is widened per D10.

**D9 — relationship lore prompt is a scene-scoped, in-memory prompt
(F-P3B4-3).** `recordRelationshipMarker` additionally records a lore prompt for
an `ally`↔`rival` flip (either direction) in a `relationshipLorePrompts` map
keyed by Novel slug, mirroring `relationshipMarkers` (which is already in-memory
and cleared at `index.ts:6830`). The briefing renders
`Consider recording a lore entry for the <a>/<b> shift.` in the narrative
threads block. Persisting it would add a Novel surface with no §7.7 group;
REQ-236a asks for a prompt, not durable state. Rejected alternative: append to
`campaign_memory` — that would fabricate a fact the GM has not accepted.

**D10 — assertions are written red-first, in the harness that owns the surface.**
- T268 (pause/resume) → widen in `test-backfill.ts:221`: `get_context` returns
  the `badge_briefing` field and `save_context` captures only `decision`/`bond`
  story entries.
- T270 (relationships) → `test-narrative.ts` (already calls
  `manage_relationship`): get includes the suspicious entry, the sheet shows
  `Relationships: Guard (suspicious)`, the `ally` flip prompts a lore entry, and
  `save_context` carries the row.
- T358 (world reactivity) → `test-briefing.ts`: boot twice with
  `TTRPG_WORLD_REACTIVITY`/`TTRPG_NPC_AUTONOMY` matrices; assert the section
  appears/absent, the NPC entry gated on autonomy, the relationship flip's
  immediate campaign-memory fact on the connected entity, an accepted
  non-relationship change appearing in campaign memory, the deferral re-surface,
  and the 4th-deferral `[WARNING]` (derived from `defer_count`).
- T275 (sessions) → widen in `test-output-contracts.ts:714`: two boots with
  distinct `TTRPG_SESSION_ID`, two `[session-boundary]` markers, recap scoping
  per session, and per-session `entry_count`/`timespan_*`/`combat_rounds`.
- T280 (notes) → widen in `test-backfill.ts:250`: default `game_master` scope,
  Player list filtering, Player `notes://` `[FORBIDDEN]`, briefing `notes`
  section for both badges, Player `set` `[FORBIDDEN]`, export shape, and
  end-Novel clearing.
- T334 (server notes) → widen in `test-backfill.ts:257`: restart persistence,
  Player `[FORBIDDEN]` on all four surfaces, `server-notes://<key>` content,
  `spec_health.server_notes` count, and removal.
- T384 (codex staleness) → widen the `T366/REQ-321` codex test (`test-output-contracts.ts:941`,
  substring assertion at `:962`): the partition shape and a `[codex-stale]`
  entry after a Codex `set`, and its clearing after re-import.

**D11 — REQ-065f is re-pointed, not re-implemented (F-P3B4-10).** T224 already
exercises the `[spec-drift]`/`[spec-version-drift]`/`[ruleset-drift]` branches
(`test-persistence.ts:702-712`), and the corrupted-state and roster-baseline
clauses are exercised by T226 and the corrupt-novel tests. REQ-065f becomes
`_Check:_ T224. Writing a T52 build-and-rebuild harness would require a build
inside the test run, which no harness does; re-pointing matches the roadmap's
"write or re-point" wording and the earlier citation-repair precedent.

## 4. Blast radius

| File | Change | Size |
|---|---|---|
| `holonovel/src/index.ts` | D1 renderer extraction + `get_context`; D2 filter/intro input; D4/D5 cycle + resolution + briefing sections; D6 redaction; D8 health keys; D9 lore prompt; `notes` token | L |
| `holonovel/src/core/state.ts` | D3 `world_in_motion` (interface, default, load, `novelToJSON`, `importNovelJSON`); D7 `writeFlatStore` | M |
| `holonovel/src/core/prompt-composition.ts` | D2 `gmContext` input and block | S |
| `holonovel/scripts/test-narrative.ts` | D10 T270 | M |
| `holonovel/scripts/test-briefing.ts` | D10 T358 | M |
| `holonovel/scripts/test-output-contracts.ts` | D10 T275 widening, T384 widening | M |
| `holonovel/scripts/test-backfill.ts` | D10 T280/T334 widening | M |
| `spec/02-requirements.md` | D11 REQ-065f `_Check:` | S |
| `spec/appendices-reference.md` | verify T270/T358/T384 wording; edit a row only if the assertion cannot match it | S |
| `spec/audit/review-register.md` | F-P3B4-1…15 dispositions; new resolved block | M |
| `spec/audit/req-coverage.md` | regenerated (`validate -- --write-register`) | S |
| `ROADMAP.md` | remove the §5.6 state-surfaces section | S |
| `CHANGELOG.md` | dated entry | S |
| `holonovel/DECISIONS.md` | the in-memory lore prompt and the `codex` shape change | S |
| `holonovel/src/generated/contract-fingerprints.ts` | regenerated by `build-order` after the spec/source edits (Phase 6 step 20) | S |
| `docs/plans/2026-11-12-5-6-state-surfaces-remediation/{plan,tasks,aar}.md` | this increment | S |

Not touched: no tool schema, prompt name, resource URI, or gate list changes;
`holonovel/AGENTS.md` tool counts are unchanged.

## 5. Phases

### Phase 0 — baseline (complete)

`npm run status`, `git status --short`, `npm run check:fast` recorded in §1.
Harness baselines: record the pass counts of the five suites in `aar.md`.

### Phase 1 — red probes

1. Add the T270, T358, T275, T280, T334, and T384 assertions exactly as D10
   describes, with no implementation change.
2. Run each suite; capture the failing assertion text per finding in `aar.md`.
3. Run the two already-satisfied rows (F-P3B4-3 marker set, F-P3B4-8 captured
   `ruleset`) and record the immediate pass as *already-satisfied*. The T384
   codex-partition/staleness assertion is part of step 1 (D10).

### Phase 2 — pause/resume and briefing (F-P3B4-1, F-P3B4-3, F-P3B4-5)

4. Extract `composeBadgeBriefing` (D1); verify the `badge_briefing` prompt text
   is unchanged by diffing a rendered briefing before and after.
5. Add the `badge_briefing` field and the `mutate: false` path to
   `get_context`, keeping `gm_context` in the response; add the decision/bond
   filter to `save_context`; add `gmContext` to `composeIntro` and feed it from
   the `intro` prompt.
6. Add the `notes` section token and the briefing section: GM sees all scopes,
   Player sees `player`/`shared` only (REQ-242b). Two token surfaces must agree
   — `section_tokens` in `spec_health` (`index.ts:13151`) and the
   `briefing_order` `VALID_TOKENS` list (`:10357`); both already carry the same
   eleven tokens, so the step adds exactly one `notes` row to each and the
   rendered section.
7. Add the lore prompt in `recordRelationshipMarker` and render it in the
   narrative threads block (REQ-236a).

### Phase 3 — world reactivity (F-P3B4-2)

8. Add `WorldChange` and `world_in_motion` to the state model and every
   serialization site (D3). The warnings surface is derived, not persisted.
9. Add `enqueueWorldChange` and its three call sites (relationship set, faction
   clock fill, secret reveal), plus the immediate one-hop ripple fact on a
   relationship change (D4).
10. Capture the marker list before `index.ts:6830` and call
    `runWorldReactivityCycle` inside the hook after
    `advanceSceneTransitionCountdowns`, and at the parser-move site (D4).
11. Extend the `respond_decision` resolver with accept/modify/defer/dismiss, the
    `modify` `[NEED_INPUT]` apply/cancel workflow, and the deferral cap (D5).
12. Render both lists in `## World in Motion` and derive
    `world_reactivity_warnings` in `spec_health` (D5).

### Phase 4 — persistence and codex truth (F-P3B4-6…9)

13. Add `writeFlatStore` and delegate both flat writers (D7). Verify the
    rotation by writing twice and asserting `.bak.1` exists.
14. Partition `spec_health.codex` and add `codex_stale` (D8).
15. Confirm F-P3B4-8's `ruleset` field through the T382/T383 assertions (no
    code change).

### Phase 5 — audit redaction (F-P3B4-4)

16. Add `auditLineForBadge` and route the resource through it (D6). Assert a
    Player `[session-boundary]` line carries no `session_id` and the GM line
    does.

### Phase 6 — citation repair and registers

17. Re-point REQ-065f to T224 (D11).
18. `npm run validate -- --write-register`; confirm REQ-065/232/233/236/237/242/285/321/332
    remain bucket C and that no new bucket-A row appears.
19. Move F-P3B4-1…15 to a `### 2026-11-12 §5.6 state surfaces remediation`
    block under `## Resolved` with current predicates; remove the ROADMAP
    section; add the CHANGELOG entry and the DECISIONS notes.
20. Refresh the generated fingerprint artifact with the regeneration sequence
    (`check-tool-definitions-sync` → `surface-budget` if moved →
    `build:starter-novel` if stale → `build-order`), which rewrites
    `holonovel/src/generated/contract-fingerprints.ts`.

### Phase 7 — gates

21. Run the five harness suites, root and server `typecheck`, `check:fast`, then
    the full `check` via `build-order`; write `aar.md` with the red transcripts,
    deviations, and the terminal `LOOP PAUSED`.

## 6. Verification

| Step | Command | Expected |
|---|---|---|
| Pause/resume | `npm --prefix holonovel run test:backfill` | T268 green |
| Sessions | `npm --prefix holonovel run test:output-contracts` | T275 green |
| World reactivity | `npm --prefix holonovel run test:briefing` | T358 green |
| Relationships | `npm --prefix holonovel run test:narrative` | T270 green |
| Notes | `npm --prefix holonovel run test:backfill` | T280/T334 green |
| Drift re-point | `npm --prefix holonovel run test:persistence` | T224 green, T52 uncited |
| Types | `npm run typecheck` + `npm --prefix holonovel run typecheck` | clean |
| Spec gates | `npm run assemble && npm run check:fast` | `check:fast: PASS` |
| Full gate | `npm run build-order` | full `check` 0 errors |
| Loop artifacts | `npm run check-loop-artifacts` | pass |
| Registers | `npm run check-registers` | pass |

## 7. Risks and mitigations

| Risk | Mitigation |
|---|---|
| The 485-line briefing extraction changes GM-visible text | Diff a captured GM briefing and a Player briefing (before/after) as a step; the wrapper must re-emit identical bytes |
| `get_context` output changes shape | Only the additive `badge_briefing` field changes; `gm_context` is untouched. The harness calls are `test-backfill.ts:223` (GM) and `run_ruleset_pattern_buffer.ts:566`; T268 gains the field assertion |
| `spec_health.codex` shape change breaks an unknown consumer | Grep `health.codex`/`JSON.parse(...).codex` across harness and docs; only T384 matches (`:962`) and it is widened |
| `world_in_motion` is dropped by clone/checkpoint | Clone and checkpoint go through `exportNovelJSON`; add a T358 assertion that clone/checkpoint retain an accepted change |
| Deferral cap double-counts on re-render | `defer_count` increments only in the resolver, never in the render path |
| Ripple entry floods the section on repeated transitions | Dedupe on `source + summary` while a non-terminal entry exists |
| Flat-store rotation writes backups the reconciler mistakes for primaries | `findPersistedArtifacts` (`state.ts:151-178`) skips only `.bak`-containing names for novels and reads fixed flat filenames; assert the reconciler treats `codex.json.bak.1` as absent |
| T358 needs two boots with different env | Follow the existing `boot(env)` helper pattern in `test-briefing.ts`; no new harness |

## 8. Deliberately deferred

- Publication (`./scripts/push-pipeline.sh`): 58 unpushed commits predate this
  session; publishing is the user's separate "push" authorization.
- T52 as a full build-and-rebuild harness: re-pointed per D11.
- F-P3B4-10…15 remain citation/assertion work; no spec body changes beyond
  REQ-065f's `_Check:`.
- The P2 sweeps and the other §5.6 remediation sections stay on the roadmap.
- The REQ-082/REQ-185a section-token-to-group mapping table is absent from
  `holonovel/DECISIONS.md` for every token (T205 is not exercised); adding it is
  a P3 outside this finding set. This increment only extends the two runtime
  token lists and adds the `notes` token the REQ mandates.

## 9. Commit plan

One spec increment, one commit (`npm run session:close` after the gates pass).
No history rewrite; the working tree must be clean of unrelated edits before
Phase 1.

## 10. User impact and sizing

Restart required after upgrade (schema gain). No tool or parameter is renamed or
removed. `spec_health.codex` changes from a number to `{total, by_kind}`; it is
a GM-only diagnostic, documented in the DECISIONS entry and asserted by T384.
`get_context` keeps its access and its `gm_context` field exactly as today; the
increment adds only the `badge_briefing` payload. Rollback cost 2 (revert the
commit and delete a `world_in_motion`-bearing Novel, which loads inertly
without it).

## 11. Review record

Review independence: fresh (one cold pass plus one permitted diff re-review;
standard depth). The cold reviewer returned FAILED on both passes: pass 1 found
2 Blockers / 6 Majors / 8 Nits, pass 2 (Stages 4–5, re-review cap reached) found
the residual step-8 persisted-key contradiction and two restatements. Those four
edits were applied after the cap and are recorded as condition **C-1** for
`build-review`; no third cold pass was run. The complete report, both artifact
hashes, and the resolution delta are in `cold-review.md` beside this plan.
