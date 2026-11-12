# Plan — §5.20/§5.24 assertion repair (F-P5-7)

Status: draft · Kind: planned · Depth: standard
Increment target: `docs/plans/2026-11-11-5-20-5-24-assertion-repair/`
Rollback cost: 1 (reversible source, harness, catalogue, and register edits; one commit)
Evidence class: repo only (no web, no user-supplied content)

## 1. Objective

Take the top open `ROADMAP.md` section — **§5.20/§5.24 assertion repair (P1)**
(`ROADMAP.md:15-23`) — and close its only finding, **F-P5-7** — six assertions
that exist but cover a fraction of the contract their `_Check:_` cites
(`spec/audit/review-register.md:1809-1819`):

| Test | REQ | Today | Contract the check must reach |
|---|---|---|---|
| T545 | REQ-455 | two appends return `#1`, `#2` | ordinals survive a restart and a fresh run reproduces them |
| T550 | REQ-460 | `through_ordinal` range only | a derived record **cites** its contributing ordinal |
| T640 | REQ-412a | token appears once | per AI role, and in the never-truncated tier |
| T712 | REQ-601 | key order and one field | session identity and wall-clock bookkeeping are excluded |
| T713 | REQ-602 | newest hash equals live | a legacy entry reports unhashed, an older one historical |
| T727 | REQ-611 | pooled/mute/force/forbidden | a transition clears the manual selection; cast state survives export/clone/checkpoint |

Four are assertion-only (T545, T550, T712, T727). **T640 needs a code fix**: the
orientation token keys on the badge (and a field that does not exist) rather
than the AI role, and REQ-135b names it tier 1 while `NEVER_TRUNCATED` does not
list it. That is a demonstrated contract gap, not a widened assertion. **T713's
legacy fixture exposes a second one**: `verify` claims `clean` while reporting
unhashed entries, which REQ-603 forbids (D5a).

The section is one of the last open P1 remediation chunks from the 2026-11-09
full-review sweep; five §5.20/§5.24 defects (F-P5-5, F-P5-6, F-P5-8, F-P5-9,
F-P6a-21) already shipped. Closing F-P5-7 retires the roadmap section (D8) and leaves 13
open items.

**D1 — T545 asserts restart continuity and fresh-run reproduction (REQ-455).**
The append handler persists before it answers (`state.saveNovel(novel)` at
`holonovel/src/index.ts:10318`, then the `ok` result), so a `kill` after a
completed call loses nothing; `nextOrdinal` reads the last persisted ordinal
(`holonovel/src/core/event-log.ts:34-39`) and the log loads wholesale
(`holonovel/src/core/state.ts:1690`, `:3053`). Extend the existing T545 case
(`holonovel/scripts/test-event-log.ts:33-44`): after two appends, `kill(p)`;
`boot()` again on the same module-level `DATA_DIR`;
`manage_novel (action: switch, slug: "elog1")`; `history` still shows `#1`
before `#2`; `replay (to_event: 2)` returns both entries; a third and fourth
append report `#3` and `#4`. Then a fresh Novel
(`elog1-replay`) fed the same two observation texts reports `#1` then `#2` —
REQ-455's "replaying the same inputs reproduces the same ordinals", which the
catalogue row already states. That fresh-run leg is a regression guard, not red
proof: `nextOrdinal` is per-log (`event-log.ts:34-39`), so a new Novel starts at
`#1` by construction and the assertion cannot fail for any implementation. The
restart leg and the `replay` observation carry the evidence. No code change.

**D2 — T550 asserts an explicit contributing-ordinal citation (REQ-460).**
REQ-460 has two halves; T550 (`test-event-log.ts:143-153`) asserts only the
range half. `manage_belief (action: admit)` already honours
`source_ordinal` (`holonovel/src/index.ts:9003-9011`) and
`action: evidence` returns the record JSON including `source_ordinals`
(`:8979-8990`). Extend T550: append `#1` and `#2`; call `manage_belief (action:
admit, entity_id: "hero", subject: "the butler", predicate: "did", object: "it",
polarity: "positive", source_ordinal: 1)` — `admit` records `entity_id` as given
and does not require an existing entity, exactly as T552 does
(`holonovel/scripts/test-belief.ts:107-114`); then call `manage_belief (action:
evidence, entity_id: "hero")`, which returns a JSON **array** (`raw(JSON.stringify(records))`,
`index.ts:8990`), and assert `JSON.parse(text)[0].source_ordinals` deep-equals
`[1]` — the cited ordinal, not the newest entry. Keep the existing range
assertion. The default-latest half is already covered by T552/REQ-462
(`test-belief.ts:107-114`), so this case adds the explicit-attribution branch
REQ-460 names ("cite the event-log ordinals that contributed"). No code change.

**D3 — T640 asserts the per-role token in the never-truncated tier; the code
changes (REQ-412a, REQ-135b).** Two defects:

1. `loopRole` is `(novel as any).ai_role ?? (badge === "game_master" ? "player" : "game_master")`
   (`holonovel/src/index.ts:14963`). `NovelState` has no `ai_role` field, and
   `TTRPG_AI_ROLE` never reaches the token, so REQ-412a's "adapt its wording to
   the active AI role (REQ-304)" is false for every override. The resolver for
   exactly this question exists and is already used by the turn handoff —
   `narrativeRole(novel)` (`:1107-1112`, REQ-598). Replace the expression with
   `narrativeRole(novel) ?? "game_master"`; the `??` preserves today's text for
   the Editor badge (`narrativeRole` returns `null`), which the renderer already
   treats as the Game-Master variant.
2. REQ-135b lists the play-loop orientation token in **tier 1, never-truncated**
   (`spec/02-requirements.md:1349`), but `NEVER_TRUNCATED` holds only
   `badge boundary`, `turn handoff`, and `intro` (`holonovel/src/index.ts:3175`).
   The token survives today only because it sits in the briefing preamble, which
   `applyPromptBudget` keeps only while it fits (`:3179-3212`); a budget below
   the preamble drops it. Render it as its own `### Play loop` section and add
   `"play loop"` to `NEVER_TRUNCATED`, the same shape `### Turn handoff` already
   uses (`:15038-15048`).

Concretely the briefing template (`:14972-14976`) becomes:

```ts
let briefing = `## Badge Briefing — ${badgeLabel(badge).toUpperCase()}
**Novel:** ${novel.name} (${novel.slug})
${novel.scene_description ? `**Scene:** ${novel.scene_description}` : ""}${novel.scene_description ? ` (${novel.scene_type.join(", ")})` : ""}
**Player-Detail:** ${detailLevel}

### Play loop
${orientation}`;
```

The token moves below `**Player-Detail:**`, after a blank line and an
`### Play loop` heading, and gains the tier-1 registration. Behaviour matrix
(`composeBadgeOrientation`,
`holonovel/src/core/prompt-composition.ts:336-341`):

| Badge | `TTRPG_AI_ROLE` | Role resolved | Today | After |
|---|---|---|---|---|
| game_master | unset | player (counterpart) | player variant | unchanged |
| player | unset | game_master (counterpart) | GM variant | unchanged |
| none | unset | null → default | GM variant | unchanged |
| **game_master** | **`game_master`** | game_master | player variant | **GM variant** (fixed) |
| **player** | **`player`** | player | GM variant | **player variant** (fixed) |
| **none** | **`player`** | player | GM variant | **player variant** (env lock, REQ-304) |

The three bold rows are the red proof. The variants are distinguishable by
their wording (`prompt-composition.ts:336-341`): the player variant contains
"act in character once the engine validates the result", the GM variant
"narrate the validated result to the table", and the lean profile "State, then
tools, then narration". T640 becomes **seven `test()` cases** — one per matrix
case plus the budget case — because the harness's `test()` catches one failure
per case (`test-lean-narrator.ts:65-68`); a single case would abort at the first
red and hide the rest. Each matrix case asserts: rows 1, 5, and 6 → the player
phrase; rows 2, 3, and 4 → the GM phrase; and each asserts the other variant's
phrase is absent. One process per
case (`boot(env)` at `:38-45` takes an env override; T640 currently shares the
harness's single process at `:71`). Every process needs its
own setup, because `boot()` mints a fresh `TTRPG_DATA_DIR` (`:39`) and the badge
lives on the Novel: `manage_novel (action: create, name: "role-<n>")`, then
`set_badge {badge}` (`"none"` is a valid value), then `prompts/get
badge_briefing`, then `kill`. Pin the ambient environment per boot:
`TTRPG_AI_ROLE: ""` for the unset rows (`narrativeRole` treats `""` as
counterpart, `index.ts:1108`) and `TTRPG_GUIDANCE_PROFILE: "full"` everywhere so
a shell carrying `lean` cannot change the variant.

A seventh boot sets `TTRPG_MAX_BRIEFING_TOKENS=150` (Phase 1 substitutes a lower
measured X if 150 is not red pre-fix) — read by `briefingBudget`
(`holonovel/src/index.ts:3173-3174`), compared against the rendered character
count, not tokens (`:3184`), and applied to the briefing at
`:15421` (`briefing = applyPromptBudget(briefing)`) — with a Game-Master badge
and `TTRPG_AI_ROLE: ""`; the case asserts **both**
`text.includes("**Play loop:**")` and `text.includes("[truncated")`. The
`**Play loop:**` label comes from `composeBadgeOrientation`
(`prompt-composition.ts:336-341`), which prefixes every variant with it; the
`### Play loop` heading is separate. The `[truncated` marker is the stable
observable: `applyPromptBudget` emits it as part of the header line (`:3201`),
and the leading headerless chunk is itself truncatable. The lean profile
variant (`TTRPG_GUIDANCE_PROFILE=lean`) is not asserted — it is a profile, not
an AI role — and the AAR records it as a soft gap (D9).

**D3a — alternatives rejected.** (a) Keep the badge key and add the env
override beside it: leaves two role computations that must stay in sync, which
is what produced F-P5-6's drift. (b) Assert the token only at a 400-token
budget: the token fits inside the preamble at that size, so the case passes
pre-fix and proves nothing about tier 1; it also leaves REQ-135b's tier-1 clause
unimplemented. (c) Move the token under a heading without registering it: the
section then truncates like any other, which is worse than today.

**D4 — T712 asserts the session-identity exclusion (REQ-601).** The unit case
(`test-event-log.ts:157-162`) asserts key order and one changed field. Add:

```ts
const s1 = stateHash({ scene: "hall", count: 2, active_session_id: "sess-a",
  last_mutation_at: "2026-01-01T00:00:00Z" } as any);
const s2 = stateHash({ scene: "hall", count: 2, active_session_id: "sess-b",
  last_mutation_at: "2026-01-02T00:00:00Z" } as any);
assert(s1 === s2, "T712 session identity changed the digest");
```

No code change: `STATE_HASH_EXCLUDED_KEYS` already lists both keys
(`holonovel/src/core/state-hash.ts:13-23`).

**D5 — T713 asserts the legacy and older-projection branches (REQ-602).**
`verifyStateHashes` already counts `unhashed_events` and
`historical_event_hashes` and `replayInspection` prints `[unhashed]`
(`holonovel/src/index.ts:10181-10183`, `:10247`, output at `:10707-10709`), but
no harness builds those entries. Extend T713 by writing the save file directly,
following the T714 tamper precedent (`test-event-log.ts:188-196`). The flow runs
after T713's existing assertions and its `kill(p)` (`:175`), so no live process
can re-save over the rewritten file:

1. `const pT = await boot();` `manage_novel (action: create, name:
   "legacyhash")`; `set_badge {badge: "game_master"}`;
   `manage_diagnostics (action: event, text: "the gate opens")`; `kill(pT)`.
2. `const dir = join(DATA_DIR, "novels");` and `const file =
   join(dir, readdirSync(dir).find((f) => f.startsWith("legacyhash"))!)` —
   T714's lookup, not a literal path (`test-event-log.ts:188-190`). `join` is
   imported at `:8`, the rest at `:7` and `:10`, and `DATA_DIR` is defined at
   `:17`.
3. `const payload = JSON.parse(readFileSync(file, "utf-8"));` push
   `{ordinal: 2, source: "system", kind: "event", text: "legacy", at: new Date().toISOString()}`
   with no `state_hash`, and
   `{ordinal: 3, source: "system", kind: "event", text: "older projection", at: new Date().toISOString(), state_hash: "<64 hex>", state_hash_projection: 1}` —
   `1` is older than the current projection `2`
   (`holonovel/src/core/state-hash.ts:27`). `<64 hex>` is any 64-character hex
   string; only its presence and projection matter.
4. `delete payload._checksum; payload._checksum = createHash("sha256").update(JSON.stringify(payload)).digest("hex");`
   then **write it back**: `writeFileSync(file, JSON.stringify(payload, null, 2));`
   — exactly T714 (`test-event-log.ts:194-196`), which is the rule
   `state.ts:1328-1340` validates and the only step that makes the fixture
   visible.
5. `const pV = await boot();` `manage_novel (action: switch, slug: "legacyhash")`;
   `verify` → `unhashed events: 1` and `historical event hashes: 1`;
   `replay (to_event: 2)` → `recorded state hash at #2: [unhashed]`; the
   existing live-equals-recorded assertion stays; `kill(pV)`.

`projection_stale` is computed from the **save-time** digest's projection
(`novel.metadata.state_hash_projection`, `index.ts:10176-10177`), not from event
entries, so the injected `state_hash_projection: 1` entry leaves the record
`verified` and non-stale; the historical count appears while the status stays
`unhashed entries: 1`. No code change beyond D5a.

**D5a — the T713 fixture exposes a `verify` status defect; fix it (REQ-603).**
REQ-603 says verify "SHALL … report unhashed entries rather than claiming a
clean result" (`spec/02-requirements.md:4173`), but the status line returns
`clean` whenever the recorded digests agree, regardless of unhashed entries
(`holonovel/src/index.ts:10698-10699`). With the D5 fixture the tool would print
`State verification: clean` next to `unhashed events: 1` — the exact claim the
clause forbids. Change the status composition only (the `clean` field keeps its
digest-agreement meaning):

```ts
const status = report.verified
  ? (report.projection_stale
    ? `stale (projection v${report.recorded_projection}, current v${report.projection_version})`
    : report.clean && report.unhashed_events === 0 && report.unhashed_checkpoints.length === 0
      ? "clean"
      : report.clean
        ? `unhashed entries: ${report.unhashed_events + report.unhashed_checkpoints.length}`
        : `DIVERGENCE at #${report.first_mismatch_ordinal ?? "?"}`)
  : "unverified (no save-time digest recorded)";
```

`report.clean` is digest-only today: `clean = recorded !== null &&
!projectionStale && mismatchOrdinals.length === 0`
(`holonovel/src/index.ts:10206`), and `report.clean` is read only in this status
composition (`:10698-10699`). The report's field types are fixed by
`StateVerifyReport` (`:10154-10169`): `verified: boolean`,
`unhashed_checkpoints: string[]`, `recorded_projection: number | null`,
`projection_version: number`. `unhashed_checkpoints` already exists
(`:10166`, `:10197-10199`), so a Novel with a hashed log and an unhashed
checkpoint cannot claim clean either. The status prints the combined count; the
`unhashed events:` and `unhashed checkpoints:` lines below it still break the
two apart.

T713 then asserts `State verification: unhashed entries: 1`. The two existing
`State verification: clean` assertions (`test-event-log.ts:245` T716; the
`test-persistence.ts:698` case that reuses the `T712` title) stay clean because
every event they write
carries a digest — T716 appends an event (`test-event-log.ts:241`) and the
appended entry is hashed (`:171-174`) — and neither writes an unhashed
checkpoint. Alternative rejected: assert only the two count lines and leave the
`clean` claim — that documents a normative violation instead of closing it, and
the next reviewer would re-raise REQ-603.

No other code change. The injected entries are synthetic legacy fixtures in the
on-disk format the loader accepts wholesale (`state.ts:1690`); no production
path writes them. The save-time digest is unchanged by the injection because
the projection excludes `event_log` (REQ-601).

**D6 — T727 asserts the manual-selection clear (REQ-611) and exercises the
row's unclaimed persistence clause.** Two gaps in the same row; the
persistence clause is catalogue text, not REQ-611's body:

1. REQ-611 says "a scene transition SHALL clear the pooled spoken set **and any
   manual selection**". The implementation clears both
   (`holonovel/src/index.ts:6848-6859`); the harness asserts only the spoken
   set. Place this at the **end** of the second T727 block
   (`test-competitive-gaps.ts:681-692`, Novel `cast-default`), after the
   existing spoken-reset assertion so that assertion's counts are untouched.
   Rewrite the two create calls (`:679-680`) to capture the ids:
   `const ann = (await call(...create, name:"Ann")).match(/\((\w+)\)/)![1]` and
   the same for `ben`. The block has already set a scene
   (`:689`), so: `manage_staging (action: cast, strategy: "manual", select:
   ben)` (`select` is a `cast`/`next_speaker` parameter, `index.ts:6714`;
   the cast branch stores it at `:6917`) → `next_speaker` returns `ben` with
   `reason: "manual"` (`index.ts:6943` sets `reason = "manual"` on the manual
   branch) →
   `manage_scene (action: set, description: "The cellar.")` →
   `next_speaker` returns `ann` with `reason: "manual"`. `ann` is the observable
   because the manual branch falls back to the first present NPC when no
   selection is stored (`index.ts:6943`: `present.find(...) ?? present[0]`); if
   the selection were retained the second call would still return `ben`.
   REQ-612 does not define that fallback, so the assertion records the
   implementation's observable without claiming a contract; the AAR notes the
   silence (D9).
2. The row already claims "cast state survives export/clone/checkpoint"
   (`spec/appendices-reference.md:2198`) and nothing asserts it — D7 does not
   append that clause. Add, at the end
   of the first T727 block (`:588-607`, Novel `crl-test`):
   `cast {strategy: "list", order: [Cato, Mira, Bo]}` (Mira is already muted by
   the preceding clause); export via `manage_archive (action: export, format:
   "json")` (the payload is `data.novel = exportNovelJSON(novel)`,
   `index.ts:11445-11463`, and `social_cast` is
   `{strategy, order, muted, spoken, selected}`, `state.ts:737`) and assert
   `JSON.parse(text).data.novel.social_cast` carries
   `strategy: "list"`, the order array, and `muted` containing Mira;
   `manage_archive (action: clone, source_slug: "crl-test", new_name:
   "crl-cast-clone")`, switch to the clone, export again, assert the same,
   switch back; `checkpoint_set (label: "cast-cp")`, `cast {strategy:
   "pooled"}`, `checkpoint_restore (label: "cast-cp")`, `respond_decision
   {decision: "restore_checkpoint:cast-cp", option: "yes"}` (the pattern at
   `test-belief.ts:381-390`), export, assert `strategy` is `"list"` again.
   T728 then opens with `cast {strategy: "natural", unmute: Mira}`
   (`:609-611`), restoring today's starting state.

`social_cast` is part of the interchange payload
(`holonovel/src/core/state.ts:2825`); the checkpoint snapshot copies that payload
(`exportNovelJSON(novel)`, `index.ts:11854`) minus the append-only logs and
checkpoints, so the field rides along. No code change is expected. Contingency:
if the clone or checkpoint leg cannot be made deterministic inside the block,
**stop and report** — the row keeps its clause, no leg is silently dropped, and
the increment waits for a scope decision.

**D7 — the spec change is six catalogue rows; no REQ body changes.** The bodies
already state every widened behaviour (REQ-455 `spec/02-requirements.md:4157`,
REQ-460 `:4167`, REQ-412a `:4114-4117`, REQ-601 `:4169`, REQ-602 `:4171`,
REQ-611 `:4118-4119`). Widening is therefore catalogue-only:

- `spec/appendices-reference.md:1963` (T545): append "after a restart the
  retained ordinals survive and the next append continues at the next ordinal"
  (the row's "reproduced on replay with the same inputs" already covers D1's
  fresh-run leg).
- `:1968` (T550): append "a record admitted with an explicit contributing
  ordinal cites that ordinal, not the newest entry".
- `:2058` (T640): append "and survives a minimal briefing budget".
- `:2183` (T712): append "session identity and wall-clock bookkeeping do not
  change the digest".
- `:2184` (T713): append "a legacy entry reports unhashed, an older-projection
  entry reports historical, and the status line names the unhashed entries
  rather than reporting clean".
- `:2198` (T727): append "a scene transition clears the manual selection" (the
  row's export/clone/checkpoint clause is already there; D6 asserts it).

§5.24 **is** a data-format fingerprint source
(`scripts/lib/contract-fingerprint.ts:37-43`) and §5.20 is not, so **no §5.24
or §5.20 body may be edited in this increment**; an appendix row is outside
every fingerprinted section. `npm run build-order` must leave
`holonovel/src/generated/contract-fingerprints.ts` byte-identical (done bar 14).

**D8 — registers close, not narrow.** F-P5-7 moves to `## Resolved` under a new
`### 2026-11-11 §5.20/§5.24 assertion repair` group; each predicate names the
widened test by title and a `file:line` **re-grepped after the assertion edits**
(the pre-edit numbers cannot survive the insertions — the register's own stale
numbers are the cautionary example). The `## Scheduled-roadmap` bullet **and its
now-empty `### 2026-11-09 … chunk P5 (engine loop, event stream, agent tasks)`
heading** are deleted: F-P5-7 is that group's only body (`review-register.md:1807-1819`),
so leaving the heading would strand an empty section. The moved bullet's text
loses its "Scheduled under ROADMAP …" sentence, which would otherwise cite a
deleted section. `ROADMAP.md:15-23` is deleted —
the section has no remaining bullet, and the admission rule removes shipped
work. `check-roadmap` and `check-registers:strict` both gate the
cross-reference.

**D9 — recorded, not fixed.** (a) `T712` is also used as a title in
`test-persistence.ts:696` and `:701` for a different assertion — the
duplicate-ID hygiene item on `ROADMAP.md` (P2). (b) The lean guidance profile's
shorter token is not asserted. (c) REQ-412a's wording ("adapt its wording")
matches the three existing variants; no new wording is introduced. (d) REQ-612
does not define `next_speaker`'s result when the `manual` strategy has no stored
selection; the T727 assertion records the implementation's first-present
fallback (`index.ts:6943`) and the AAR notes the spec silence rather than
inventing a contract.

**Done bar** (each item names its command or artifact)

1. T545 asserts restart continuity (`#1`, `#2` survive, a `replay (to_event: 2)`
   returns both; `#3`, `#4` follow) and a fresh Novel reproducing `#1`, `#2`
   for the same inputs.
2. T550 asserts `JSON.parse(text)[0].source_ordinals` deep-equals `[1]` for an
   admission that supplies `source_ordinal: 1` while `#2` exists (`admit`
   stores the supplied ordinal as the sole entry, `index.ts:9003-9011`), and
   keeps the range assertion.
3. The `loopRole` expression (today `holonovel/src/index.ts:14963`) reads
   `narrativeRole(novel) ?? "game_master"`;
   the orientation renders under `### Play loop`; `NEVER_TRUNCATED`
   (`:3175`) contains `"play loop"`.
4. T640 asserts **all six** matrix cases (both counterparts, both override rows,
   and both `none`-badge rows) and, at the measured budget X (`150` unless
   Phase 1 measures lower), that the briefing still contains
   `**Play loop:**` while carrying `[truncated`.
5. T712 asserts the session-identity and wall-clock exclusion.
6. T713 asserts `unhashed events: 1`, `historical event hashes: 1`,
   `recorded state hash at #2: [unhashed]`, and
   `State verification: unhashed entries: 1` on the injected save (D5a).
7. T727 asserts the manual-selection clear on a real scene transition and the
   export, clone, and checkpoint preservation of the cast state.
8. The new **behavioural** assertions fail on the pre-fix tree — paste the
   output in `aar.md`: the three changed T640 matrix cases, the T640 budget
   case, and the T713 status line. The budget bar is the pair (pre-fix red at
   budget X, post-fix green at budget X): Phase 1 records the first X at
   which the pre-fix token is absent, and the case uses that X. If 150 is not
   red pre-fix, use the measured X and record it. If no X above zero drops the
   token pre-fix, stop and report: the token is outside the preamble already
   and the tier-1 claim needs re-scoping.
9. The **already-conforming** assertions (T545 restart, T550 citation, T712
   exclusion, T713 counts, T727 clear and persistence) are green pre-fix by
   construction where the implementation already matches the body; each is
   recorded in `aar.md` as a regression guard. If one fails pre-fix, **stop and
   report** — the plan is amended before any file moves; no in-session fix is
   authorised (the fix/no-fix judgement is not the executor's).
10. `npm --prefix holonovel run test:event-log` reports 12 passed, 0 failed;
    `test:lean-narrator` 16 passed, 0 failed (10 minus T640 plus seven cases);
    `test:competitive-gaps` 30 passed, 0 failed; `test:persistence` passes
    (baseline count recorded in Phase 0).
11. The six catalogue rows carry the D7 clauses; no line in
    `spec/02-requirements.md` changes (`git diff --stat -- spec/02-requirements.md`
    empty).
12. `spec/audit/review-register.md` moves F-P5-7 into the dated `Resolved`
    group with predicates naming the widened test titles and `file:line`
    anchors re-grepped on the committed tree (they will differ from today's
    numbers), removes the `Scheduled-roadmap` bullet, deletes the emptied
    `### … chunk P5` heading, and drops the moved bullet's "Scheduled under
    ROADMAP …" sentence; `npm run check-registers:strict` passes.
13. `ROADMAP.md` no longer carries the §5.20/§5.24 section; `npm run
    check-roadmap` passes and `npm run status` reports one fewer open item (13).
14. `holonovel/src/generated/contract-fingerprints.ts` is unchanged after
    `npm run build-order` (`git diff --stat` empty for that file). If it moves,
    stop and report: a §5.24 body edit slipped in.
15. `spec/audit/req-coverage.md` is refreshed with `npm run validate --
    --write-register`; REQ-455, REQ-460, REQ-601, REQ-602, REQ-603, REQ-611, and
    REQ-412a still resolve (T545, T550, T712, T713, T727, T640), and the T713
    row records that it also exercises REQ-603's unhashed-status clause.
16. `CHANGELOG.md` gains a first entry
    `## 2026-11-11 — §5.20/§5.24 assertion repair` naming the six tests, the
    REQs, the T640 code fix (REQ-135b tier 1, REQ-304 role), the REQ-603 status
    fix, and the retired roadmap section.
17. `npm run assemble && npm run check:fast` exits 0 un-piped with the trailing
    `check:fast: PASS`; `npm run validate:sdd` reports 0 errors.
18. The increment directory holds `plan.md`, `tasks.md`, `aar.md`, and
    `independent-review.md` (the plan-review cold artifact, written before this
    increment executes); `aar.md` records the Phase 0 baseline, the Phase 1
    probe transcript, the pre-fix red output, the fingerprint diff, and ends
    `LOOP PAUSED`; `npm run check-loop-artifacts` passes.
19. The increment lands as one commit via `npm run session:close`, and
    `git status --porcelain` is empty afterwards.

## 2. Evidence (repo, verified this session)

Line anchors are as-of-draft: the Phase 2 edits move every `index.ts` anchor
below `:10698` (D5a) and the Phase 3 insertions move every `test-event-log.ts`
anchor below `:44`. Re-grep each before relying on it, and use the re-grepped
numbers in the register predicates (D8).

- `ROADMAP.md:15-23` — the section and its single bullet (six assertions,
  F-P5-7), trigger closes when F-P5-7 is `Resolved`.
- `spec/audit/review-register.md:1809-1819` — F-P5-7: "`T545` never reproduces
  ordinals across a restart (`REQ-455`); `T550` never asserts a derived record's
  cited ordinal (`REQ-460`); `T640` asserts the orientation token once, not per
  AI role or at a minimal budget (`REQ-412a`); `T712` never tests session-identity
  exclusion (`REQ-601`); `T713` never tests the unhashed/older-projection
  branches (`REQ-602`); `T727` never asserts manual-selection clearing on a
  scene transition (`REQ-611`). Predicates: `test-event-log.ts:32-43`,
  `:113-123`, `:127-132`; `test-lean-narrator.ts:115-119`;
  `test-competitive-gaps.ts:591-602`." The register's `test-event-log.ts:113-123`
  and `:127-132` predicates are stale (T545 is `:33-44`, T550 `:143-153`,
  T712 `:157-162`, T713 `:165-176`); the resolution row corrects them. The
  bullet is the **only** body of the `### … chunk P5` group
  (`review-register.md:1807-1821`), so D8 deletes the heading with it.
- `spec/02-requirements.md:4157` — REQ-455: "a session of N inputs produces N
  ordered entries, and replaying the same inputs reproduces the same ordinals",
  `_Check:_ T545`.
- `spec/02-requirements.md:4167` — REQ-460: "Any derived knowledge, belief, or
  identity record SHALL cite the event-log ordinals that contributed to it, and
  the server SHALL return the entries for a requested ordinal range",
  `_Check:_ T550`.
- `spec/02-requirements.md:4114-4117` — REQ-412a: token in the never-truncated
  tier (REQ-135), plain English, "adapt its wording to the active AI role
  (REQ-304)"; acceptance criterion "under each AI role and it survives a
  minimal briefing budget", `_Check:_ T640`.
- `spec/02-requirements.md:1349` — REQ-135b tier 1 lists "the play-loop
  orientation token (REQ-412a)"; REQ-135a carries the budget limit.
- `spec/02-requirements.md:4169` — REQ-601: exclusions include
  `active_session_id` and `last_mutation_at`; acceptance criterion "equal story
  content hashes equally regardless of key order or session identity",
  `_Check:_ T712`.
- `spec/02-requirements.md:4171` — REQ-602: "An entry written before this hash
  existed SHALL be reported as unhashed … A hash recorded under an older
  projection SHALL be reported as historical"; acceptance criterion names both,
  `_Check:_ T713`.
- `spec/02-requirements.md:4118-4119` — REQ-611: "a scene transition SHALL clear
  the pooled spoken set and any manual selection", `_Check:_ T727.
- `spec/02-requirements.md:4173` — REQ-603: verify "SHALL … report unhashed
  entries rather than claiming a clean result"; `_Check:_ T714`.
- `spec/appendices-reference.md:1963`, `:1968`, `:2058`, `:2183`, `:2184`,
  `:2198` — the six rows as they read today.
- `holonovel/src/core/event-log.ts:34-39` — `nextOrdinal` returns
  `log[last].ordinal + 1`; the comment names REQ-455's replay determinism.
- `holonovel/src/core/state.ts:1690`, `:3053` — `event_log: data.event_log ?? []`
  on load, so injected legacy entries survive hydration unnormalised.
- `holonovel/src/core/state.ts:1328-1340` — checksum predicate: absent or
  SHA-256 of the payload without `_checksum`.
- `holonovel/src/core/state.ts:2825` — `social_cast` in `novelToJSON` (export,
  clone, checkpoint).
- `holonovel/src/core/state-hash.ts:13-23`, `:27` — the exclusion list
  (`active_session_id`, `last_mutation_at`) and projection version `2`.
- `holonovel/src/index.ts:10318` — `event` appends via `recordEvent` and calls
  `state.saveNovel(novel)` before returning `Event #N recorded`.
- `holonovel/src/index.ts:10698-10709` — the `verify` status composition (the
  D5a defect) and its report lines; `report.clean` is read only there.
- `holonovel/src/core/state.ts:737` — `social_cast: { strategy; order; muted;
  spoken; selected }`; `holonovel/src/index.ts:12980` exposes strategy, muted,
  and spoken in `health`.
- `holonovel/src/index.ts:11445-11463` — `data.novel = exportNovelJSON(novel)`,
  the export payload the T727 export leg parses.
- `holonovel/src/index.ts:3173-3174` — `briefingBudget()` reads
  `TTRPG_MAX_BRIEFING_TOKENS` (character-length comparison, REQ-180).
- `package.json:30`, `:32` — `check-registers` and `check-registers:strict`.
- `holonovel/package.json:79`, `:94`, `:101`, `:117` — `test:persistence`,
  `test:competitive-gaps`, `test:event-log`, `test:lean-narrator`.
- `holonovel/src/index.ts:3586` — `set_badge` accepts `player`, `game_master`,
  `observer`, `none`.
- `holonovel/scripts/lib/harness-guard.ts:22-38` — the guard watches the exit
  path, not spawn/kill balance, so extra boots are safe.
- `holonovel/src/index.ts:9003-9011` — `admit` uses `args.source_ordinal` when
  supplied, else the newest ordinal; `:8979-8990` — `evidence` returns the
  records as JSON, `source_ordinals` included.
- `holonovel/src/index.ts:10181-10183` — `unhashed_events` and
  `historical_event_hashes` counts; `:10247` — replay prints
  `recorded state hash at #N: [unhashed]`; `:10707-10709` — the `verify` lines.
- `holonovel/src/index.ts:1107-1112` — `narrativeRole(novel)` (REQ-598): env
  override, `null` for the Editor badge, otherwise the counterpart of the badge.
- `holonovel/src/index.ts:14963` — the badge-keyed `loopRole` (D3's defect);
  `:14972-14976` — the briefing template; `:15038-15048` — `### Turn handoff`,
  the tier-1 section shape the token will copy.
- `holonovel/src/index.ts:3175` — `NEVER_TRUNCATED`; `:3179-3212` —
  `applyPromptBudget` (`###` sections, required headers kept).
- `holonovel/src/core/prompt-composition.ts:336-341` —
  `composeBadgeOrientation(profile, loopRole)`: lean, player, and GM variants.
- `holonovel/src/index.ts:6848-6859` — scene set clears `spoken` and `selected`
  on a transition and when no scene existed.
- `holonovel/src/index.ts:11854-11861`, `:11894-11898` — checkpoint snapshot
  keeps `social_cast`; restore asks `yes`/`cancel` through `respond_decision`.
- `holonovel/scripts/test-event-log.ts:33-44` (T545), `:143-153` (T550),
  `:157-162` (T712), `:165-176` (T713), `:188-196` (T714's checksum-recompute
  injection precedent).
- `holonovel/scripts/test-lean-narrator.ts:38-45` (`boot(env)`), `:115-119`
  (T640), `:120` (`kill`).
- `holonovel/scripts/test-competitive-gaps.ts:554-568` (the `crl-test` fixture:
  Mira 0, Bo 100, Cato 50), `:588-607` (T727 first block), `:609-611` (T728
  resets strategy and unmute), `:681-692` (T727 second block, `cast-default`
  with Ann and Ben).
- `holonovel/scripts/test-belief.ts:107-114` — T552/REQ-462 asserts
  `source_ordinals [1]` for the default-latest path; `:381-390` — the
  checkpoint-restore confirmation pattern.
- `spec/audit/req-coverage.md:424`, `:429`, `:559`, `:560`, `:569` — the rows
  binding REQ-455→T545, REQ-460→T550, REQ-601→T712, REQ-602→T713, REQ-611→T727.
- `scripts/lib/contract-fingerprint.ts:37-43` — `DATA_SECTIONS` includes
  `### 5.24 `; `:27` — `PACKAGE_SECTIONS` includes none of §5.20/§5.24. The
  appendix rows are in neither.
- Baseline this session: `npm run status` → 56 unpushed commits, 14 open
  roadmap items; `git status --porcelain` empty; `npm run check:fast` → 40
  passed, 0 failed, `check:fast: PASS`; `npm --prefix holonovel run
  test:event-log` → 12 passed, 0 failed; `test:lean-narrator` → 10 passed;
  `test:competitive-gaps` → 30 passed.

## 3. Blast radius

Sizes: S = a few lines; M = a section; gen = written by a tool.

| Path | Change | Size |
|---|---|---|
| `holonovel/src/index.ts` | `loopRole` → `narrativeRole`; `### Play loop` section; `NEVER_TRUNCATED` entry; `verify` status composition | S |
| `holonovel/scripts/test-event-log.ts` | T545 restart/replay, T550 citation, T712 exclusion, T713 legacy branches | M |
| `holonovel/scripts/test-lean-narrator.ts` | T640 role matrix and budget case | S |
| `holonovel/scripts/test-competitive-gaps.ts` | T727 manual clear and export/clone/checkpoint persistence | S |
| `spec/appendices-reference.md` | six catalogue rows (T545, T550, T640, T712, T713, T727) | S |
| `spec/audit/review-register.md` | F-P5-7 → `Resolved`; `Scheduled-roadmap` row removed | S |
| `spec/audit/req-coverage.md` | regenerated by `npm run validate -- --write-register` | gen |
| `ROADMAP.md` | section retired (14 → 13 items) | S |
| `CHANGELOG.md` | new dated first entry | S |
| `holonovel.md`, `holonovel/holonovel.md` | generated by `npm run assemble` | gen |
| `spec/build-phase-map.md` | content-hash line rewritten by `npm run assemble` (REQ-278) | gen |
| version-sync surfaces, only if `build-order` advances the version (`holonovel/AGENTS.md`, `holonovel/DECISIONS.md`, `holonovel/package.json`, lockfile, `server.json`, and the `index.ts` version constant; REQ-107a) | gen | gen |
| `docs/plans/2026-11-11-5-20-5-24-assertion-repair/` | `plan.md`, `tasks.md`, `aar.md`, `independent-review.md` | S |

No tool, resource, prompt, action, or schema is added; `tool-definitions.json`,
`tool-surface-*`, and the surface budget are untouched. No state-schema change,
no migration, no fingerprint change. No data, credential, network, or
publication step.

## 4. Steps (dependency order)

**Phase 0 — baseline and precondition confirmation.** `plan.md` and
`independent-review.md` exist (this plan's review); write `tasks.md` and the
`aar.md` skeleton with the Phase 0 baseline (14 open items, clean tree,
`test:event-log` 12, `test:lean-narrator` 10, `test:competitive-gaps` 30,
`test:persistence` count, and the `check:fast` result recorded there). Re-grep
every edited location
(`index.ts:1107-1112`, `:3175`, `:14963-14976`, `:6848-6859`;
`test-event-log.ts:33-176`; `test-lean-narrator.ts:115-120`;
`test-competitive-gaps.ts:588-697`; the six appendix rows) and confirm F-P5-7 is
the only `Scheduled-roadmap` bullet for this section and the only open bullet in
its group. Also run `rg -c "State verification: clean" holonovel/scripts/` and
record the count: D5a relies on every such assertion writing only hashed
entries, and a third occurrence would not be caught by `check:fast`.

**Phase 1 — probe the shipped behaviour (trust boundary: tool output).** Run a
throwaway `/tmp/opencode` tsx probe against a booted host and paste the
transcript into `aar.md`:

1. T640 matrix: six matrix boots plus the budget boot (`TTRPG_AI_ROLE` × badge) reading
   `prompts/get badge_briefing`, each creating its own Novel and setting its
   badge → confirm the three changed cases render the wrong variant today.
2. Budget: `TTRPG_MAX_BRIEFING_TOKENS=150` → confirm the token's presence or
   absence today and record the measured threshold.
3. T545 restart, T550 citation, T712 exclusion, T713 injected branches (counts,
   replay, and the D5a status line), T727 manual clear and
   export/clone/checkpoint → confirm each behaves as the body says.

Stop and report if a D-numbered premise already fails (the code moved;
re-scope before editing), and if the T727 checkpoint leg is not deterministic,
apply D6's contingency.

**Phase 2 — widen the assertions.**
1. `test-event-log.ts` T545: restart continuation (`switch` after reboot, then
   `#3`/`#4`) plus the fresh-run reproduction; add a `replay (to_event: 2)`
   observation that names `#1` and `#2`.
2. T550: explicit `source_ordinal` citation (`records[0].source_ordinals`) plus
   the existing range.
3. T712: the session-identity unit assertion.
4. T713: the injection procedure of D5 plus the D5a status assertion.
5. `test-lean-narrator.ts` T640: seven `test()` cases (six matrix cases plus the
   budget case), one `boot(env)` process each with its own `manage_novel
   (action: create)` and `set_badge`, `kill` on every process, and
   `TTRPG_GUIDANCE_PROFILE: "full"` pinned. The harness count rises from 10 to
   16 (one T640 case is replaced by seven).
6. `test-competitive-gaps.ts` T727: the second block's manual clear and the
   first block's export/clone/checkpoint legs. Run `test:competitive-gaps`
   again after T727 and before judging the red run, so a disturbed `spoken`
   cursor cannot be mistaken for a widened-assertion failure.

**Phase 3 — record the pre-fix red.** With the widened assertions and **no**
`index.ts` change, run the three harnesses and paste the output into `aar.md`:
the three changed T640 matrix cases, the T640 budget case at the measured
threshold, and the T713 status line must fail; the remaining assertions must
pass (done bar 9). No stash is needed because the code fix has not been applied
yet.

**Phase 4 — the T640 and D5a code fixes (REQ-412a, REQ-135b, REQ-603).** Replace
the `loopRole` expression with `narrativeRole(novel) ?? "game_master"`; move
`${orientation}` out of the preamble into a `### Play loop` section after
`**Player-Detail:**`; add `"play loop"` to `NEVER_TRUNCATED`; and change the
`verify` status composition per D5a. Comment each change with its REQ. Re-run
the three harnesses green.

**Phase 5 — catalogue rows.** Apply the six D7 clauses; re-read each row for one
physical line and no table or bullet break.

**Phase 6 — registers and roadmap.** Move F-P5-7 into the dated `Resolved`
group with corrected predicates; delete the `Scheduled-roadmap` bullet **and its
emptied `### … chunk P5` heading**; delete the roadmap section; run
`check-registers:strict` and `check-roadmap`.

**Phase 7 — regeneration and bookkeeping.** `npm run validate --
--write-register` → `npm run assemble` → CHANGELOG entry → `npm run
build-order` (assemble, full `check`, propagate, source-propagate, typecheck,
version sync; REQ-107a) → confirm the fingerprint file is untouched → complete
`tasks.md` and `aar.md`.

**Phase 8 — verify and commit.** Run the Section 6 verification table in order,
then `npm run session:close`.

## 5. Edge cases and rollback

- **The T640 budget case passes pre-fix.** The token is in the preamble, and at
  some budgets the preamble fits. Search downward from 150 in steps of 50
  characters and use the first budget X at which the pre-fix token is absent;
  record X in `aar.md` and use it in the case. The tier-1 claim is only proven
  when the token survives a budget that drops the preamble.
- **The T640 budget case fails after the fix** because `applyPromptBudget`
  reorganised the preamble. The `###` level is unchanged (the briefing already
  has `###` sections), and the play-loop section is required, so it is kept;
  if it is not, the header match is wrong — check the lowercased header text.
- **A widened assertion fails pre-fix where the body says it should pass.**
  That is a real defect, not a test bug: record the predicate and stop (done
  bar 9) — the plan is amended, no in-session fix.
- **The T713 injection makes `verify` report a divergence.** The save-time
  digest excludes `event_log` (REQ-601); the expected status is
  `unhashed entries: 1`, not `DIVERGENCE`. If it diverges, the loader re-derives
  `metadata.state_hash` from a different projection — stop and record, do not
  widen the projection.
- **A D5a status change breaks another assertion.** Two tests assert
  `State verification: clean` (`test-event-log.ts:245`, `test-persistence.ts:698`);
  both write only hashed entries and no checkpoint, so both stay clean. If one
  fails, its fixture gained an unhashed entry and the status is telling the
  truth — fix the fixture, not the status.
- **The T640 harness leaks seven temp data dirs per run.** `test-lean-narrator`
  already creates one `mkdtemp` per `boot()` and never removes it; the seven
  extra boots add to that. The dirs live under `os.tmpdir()` and hold no
  tracked state, so this is accepted and recorded in `aar.md` rather than
  widening the harness.
- **`test-persistence` is not in `check:fast`.** It is run explicitly in the
  verification table because D5a touches a status string it asserts; the gate
  suite alone would not catch a regression there.
- **The T727 clone leaves a second Novel in the shared temp dir.** The harness
  removes `DATA_DIR` at exit and later tests address novels by slug, so a
  leftover clone is inert; switch back to `crl-test` before the block ends.
- **The checkpoint restore stays pending.** `respond_decision` needs
  `decision: "restore_checkpoint:<label>"` and `option: "yes"`; without it the
  next call sees a pending workflow and refuses.
- **An appendix edit trips `markdownlint`** (line length). Rows are tables and
  excluded from the 120-column prose rule, but keep each row on one physical
  line regardless.
- **Fingerprint moves.** Contradicts D7; stop, paste the diff, and remove the
  body edit — a §5.24 change would require the data-format migration story.
- **Rollback.** `git revert` of the single commit restores the token's role
  source and placement, the never-truncated set, the six assertions, the six
  catalogue rows, the register, the roadmap, and the changelog. No persisted
  data, package, or publication state is involved.

## 6. Verification summary

| Check | Command | Expected |
|---|---|---|
| Event-log harness | `npm --prefix holonovel run test:event-log` | 12 passed, 0 failed |
| Role/budget harness | `npm --prefix holonovel run test:lean-narrator` | 16 passed, 0 failed |
| Cast harness | `npm --prefix holonovel run test:competitive-gaps` | 30 passed, 0 failed |
| Persistence harness | `npm --prefix holonovel run test:persistence` | baseline count recorded in Phase 0, 0 failed |
| Token follows the role | `grep -c "narrativeRole(novel)" holonovel/src/index.ts` | 3 (baseline 2: the handoff call at `:15039` and the `narrate` prompt at `:15438`) |
| Tier-1 registration | `grep -c '"play loop"' holonovel/src/index.ts` | 1 |
| Session exclusion | the T712 assertion | pass |
| Legacy branches | the T713 assertions | pass (`unhashed entries: 1` status) |
| No REQ body edit | `git diff --stat -- spec/02-requirements.md` | empty |
| Fingerprint unchanged | `git diff --stat -- holonovel/src/generated/contract-fingerprints.ts` | empty |
| Assemble + gates | `npm run assemble && npm run check:fast` | `check:fast: PASS` |
| Strict validation | `npm run validate:sdd` | 0 errors |
| Build order | `npm run build-order` | completes |
| Coverage register | `npm run validate -- --write-register` | refreshed, seven REQs resolve |
| Roadmap admission | `npm run check-roadmap` | pass, one fewer item |
| Register hygiene | `npm run check-registers:strict` | pass |
| Increment artifacts | `npm run check-loop-artifacts` | pass |
| Commit | `npm run session:close` | one commit, clean tree |

Unverified by design: `npm run playability` and `test:package-smoke` (no tool,
resource, or prompt is added; the briefing text change is covered by the
lean-narrator harness and `check:fast`); the lean-profile token variant (D9);
the spec's silence on the manual-with-no-selection fallback (D9) and on the
exact `unhashed entries` status wording (D5a picks it).

## 7. Open questions

None blocking. Every assertion widens to a clause its REQ body already states,
the T640 fix reads the role through the existing REQ-598 resolver, D5a's status
wording is the only string the spec leaves open, and the catalogue rows are the
only spec surface the change touches. One number is measured in Phase 1 rather
than fixed here — the T640 budget threshold (the plan states 150 and a
measurement rule) — and the T713 injected-entry shape is stated exactly in D5.
Publication is out of scope; the plan stops at the local commit.

## Files expected

- `holonovel/src/index.ts`
- `holonovel/scripts/test-event-log.ts`
- `holonovel/scripts/test-lean-narrator.ts`
- `holonovel/scripts/test-competitive-gaps.ts`
- `spec/appendices-reference.md` (T545, T550, T640, T712, T713, T727)
- `spec/audit/review-register.md`
- `spec/audit/req-coverage.md` (regenerated)
- `ROADMAP.md`, `CHANGELOG.md`
- `holonovel.md`, `holonovel/holonovel.md` (assembled)
- `spec/build-phase-map.md` (assembled content hash)
- version-sync surfaces, only if `build-order` advances the version
  (`holonovel/AGENTS.md`, `holonovel/DECISIONS.md`, `holonovel/package.json`,
  the lockfile, `server.json`; REQ-107a)
- `docs/plans/2026-11-11-5-20-5-24-assertion-repair/{plan,tasks,aar}.md`,
  `docs/plans/2026-11-11-5-20-5-24-assertion-repair/independent-review.md`
