# Plan — Badge guidance renderers from live synthesis state (U6-F6)

Status: draft v3 — **cold pass passed** (v1 self pass → v2: 7 findings; cold review of v1:
3 Blockers, 5 Majors, 6 Nits; diff re-review of v2: 1 Blocker, 3 Majors, 1 Nit; targeted
confirmation of v3: `independent-review passed.`, 0 Blockers, 0 Majors, 4 Nits, all applied
below). Five review stages were covered across three dispatches. Residual uncertainty rides
as build conditions C-1…C-4 · Kind: planned · Depth: standard
Increment target: `docs/plans/2026-11-15-synthesis-badge-guidance/` — created at task 1
with `plan.md`, `tasks.md`, and an `aar.md` placeholder that ends `LOOP OPEN`; the real
AAR replaces it at close. The gitignored `plans/` copy is the working draft only (see
`tasks.md` for the file-flow rule).
**Done bar:** four guidance resources live with a passing `T791`, REQ-022a/REQ-071b
catalogues bound to it, U6-F6 `Resolved` with its superseded rationale stated, roadmap
section removed, `check:fast` + `test:all` + `build-order` green, one commit under
`session:close` with `LOOP PAUSED`.
Rollback cost: 1 (one `git revert` of a single commit; no persisted-state migration).
Evidence class: every premise is a `file:line` read at HEAD `822228f` on a clean tree,
except the two green-gate facts recorded under *Baseline*.
Trust boundary: repository only. No web, user, or fetched content supplies a premise.
Review independence: `self` for v1 and v2; the cold pass artifact is recorded once the
diff re-review completes, then the stamp moves to `fresh`.

## Resolutions

**Self pass v1 → v2.**

- **S1 [Major] — the "no new REQ" consequence was unstated.** The increment edits two
  existing REQ bodies (REQ-022a, REQ-071b) and adds no REQ, so no §5 section-map row, no
  coverage-map table row, no `build-phase-map.md` edit, and no REQ-278 phase-map hash
  move is owed. Now stated in Phase 5 with that reason.
- **S2 [Major] — "the spec already mandates this" needed a counter-check.** The only
  spec-side enumeration of concrete guidance URIs is the T223 row
  (`spec/appendices-reference.md:1702`); §7.8 states the generic
  `guidance://<badge>/<anchor>` pattern (`spec/04-runtime.md:695`). Recorded, with the
  one real gap the cold pass then found (CB-M2).
- **S3 [Major] — DP-4 rejected the wrong alternative.** `T26` already has an automated
  block (`holonovel/scripts/test-output-contracts.ts:214`) even though Appendix F lists
  T26 as Manual (`:1463`). Extending it would re-kind a manual row; that rejection is now
  recorded alongside the T223 one.
- **S4 [Minor] — `shared` is a badge value in this client** (`guidance://shared/badge-switch`,
  `holonovel/src/index.ts:15771`). DP-1 now states that `shared/<anchor>` guidance is out
  of scope and that the catalog template's presence resolves through the two concrete
  registrations.
- **S5 [Minor] — test-name form made exact**: `"T791/REQ-071: …"`, matching the harness
  convention (`holonovel/scripts/test-output-contracts.ts:186`).
- **S6 [Minor] — the CHANGELOG date is gate-pinned** to the session date because
  `session:close` derives the commit subject from the top heading. Named in Phase 6.
- **S7 [Nit] — DP-5's "dead duplication" claim now cites the prefix match** in
  `resourceAllowed` rather than asserting it.

**Cold pass on v1 → v2** (independent reviewer; five review stages covered, run as one
combined dispatch).

- **CB1 [Blocker] — assert 2 could not pass on a default boot.** `wisdomManifest` starts
  `null` (`holonovel/src/core/state.ts:1117`) and is only assigned by hydration or a
  synthesis run (`:1232`, `holonovel/src/index.ts:16942`), while `effectiveWisdomItems`
  returns `[]` on a null manifest (`:16190-16192`). Both voice views would have rendered
  the empty marker. Fixed by DP-2's vendor-tier fallback (`DEFAULT_WISDOM.narrative_voices`
  when no manifest exists), which also settles CM4: §11.3's "Ruleset Wisdom always
  present" now has a mechanical source rather than a claim.
- **CB2 [Blocker] — the plan's own gate ordering was self-contradicting.** `check:fast`
  includes `check-loop-artifacts`, which errors on a `docs/plans/` directory without
  `aar.md` (`scripts/lib/loop-artifacts.ts:10,67-75`), so task 37 as written would have
  failed. Fixed: the increment directory is created at task 1 with an `aar.md` placeholder
  ending `LOOP OPEN`; the real AAR replaces it before `session:close`, and `LOOP OPEN` is
  itself an error only at close (`:82-91`).
- **CB3 [Blocker] — the tone payload dropped the `[narrative-tone]` tag it must serve.**
  Phase 1 stripped the prefix and the Markdown shape never restored it, contradicting
  assert 1 and REQ-071a (`spec/02-requirements.md:226`). Fixed by DP-7: the tag is part of
  the rendered item; only the intermediate array strips it.
- **CM1 [Major] — V5's `[LOW]` assertion was unsatisfiable.** No harness helper seeds a
  wisdom item, and both shipped voice profiles are HIGH + GM-scoped
  (`holonovel/src/core/wisdom.ts:323-344`); `manage_synthesis (action: player_add)` yields
  a `[player]` tag with no confidence. V5 is rewritten: T791 asserts that every item
  carries a non-empty `provenance` string produced by `provenanceTag`, and the LOW branch
  inherits T325a/T325b coverage instead of being re-asserted where it cannot be produced.
- **CM2 [Major] — REQ-022a's catalogue omits `voice`.** The enumeration names
  "foundations, anti-slop, tone, badge-switch" (`spec/02-requirements.md:695-701`) and
  REQ-022b's criterion is "`resources/list` includes all required URIs" (`:707`), so the
  catalogue edit is owed. Fixed by DP-9; the v1 sibling probe's pattern missed that line,
  which is now widened in Phase 0 step 3.
- **CM3 [Major] — "restricting to the badge named in the URI" was undefined and collided
  with a badge-reading filter.** Fixed by DP-3, which names both predicates and states
  that the payload is a function of state *and* caller badge, so V2 no longer claims
  cross-badge byte identity.
- **CM5 [Major] — required item fields were missing.** REQ-071a requires source anchor and
  confidence; §11.3's voice contract records `name`, `media_title`, `media_type`,
  description, source and confidence (`spec/08-synthesis.md:172-179`). Payload shapes now
  carry `key`, `name`, `media_title`, `media_type`, `source`, `description`, `confidence`,
  and `provenance`, and tone items carry `anchor` plus `confidence`.
- **Cm1–Cm6, Cn1–Cn3 [Minors and Nits].** Citation windows corrected (EV3 → `:199-204`,
  EV12 → `:349-355`, EV14 → `:270-282`, EV17 → `:3036-3043`; EV16 gains the T790 anchor
  `spec/appendices-reference.md:2147`); REQ-071's section corrected to §5.1 (m2); T791
  now binds one REQ and its label drops REQ-062 (m3); DP-5 records the precedent
  divergence (`holonovel/src/core/badge-gate.ts:78-79` keeps an explicit redundant row)
  and why we do not copy it (m4); the U6-F6 disposition now states that its scheduling
  rationale was wrong, not only that the predicate holds (m5); the status line, the
  item `key` field, the union-typed `confidence`, and the duplicated `plans/` note are
  fixed (n1, n2, n3).

**Diff re-review on v2 → v3** (same cold reviewer session, resolution-scoped; 5 reads).

- **Rev1 [Blocker] — assert 4 demanded provenance from ruleset tone items that had no such
  field.** The only default-boot tone item is the composer's built-in line, whose shape was
  `{ text, anchor, confidence }`. Fixed: the ruleset item shape carries
  `provenance: "[ruleset]"`, so "every item has a non-empty provenance" is now literally
  true in both views, and `tasks.md` matches the plan.
- **Rev2 [Major] — the vendor fallback yielded items with no `key`.** `key?` is optional on
  `NarrativeVoice` (`holonovel/src/core/wisdom.ts:13,323-344`), while the payload declares
  `key: string` and sorts on it. Fixed: the fallback is
  `withWisdomKeys(DEFAULT_WISDOM).narrative_voices`, the existing normaliser
  (`holonovel/src/core/wisdom.ts:461`), with the same call precedent at
  `holonovel/src/index.ts:16936`.
- **Rev3 [Major] — DP-3's two predicates were not expressible in the specified code.** The
  helper took only `callerBadge` while the handler passed the URI badge, and
  `badgeCanSeeWisdom` takes an item and reads the global badge
  (`holonovel/src/index.ts:16285-16288`). Fixed: the helper is
  `guidanceVoiceItems(viewBadge: Badge)`, and caller filtering goes through a new
  parameterised predicate `canSeeGuidanceItem(item, callerBadge)`; the handler composes
  them explicitly. Both roles now have a parameter.
- **Rev4 [Major, raised as M1(a)] — T325a/T325b were cited as if they were Appendix F rows.**
  Appendix F defines `T325` (`spec/appendices-reference.md:1771`); `T325a` and `T325b` are
  harness blocks under it (`holonovel/scripts/test-backfill.ts:2101,2118`). The inheritance
  claim stands; the citation is now to the harness blocks plus the Appendix F row, so no
  reader has to hunt for a non-existent table row.
- **Rev5 [Nit] — the cold pass stage count over-stated the dispatch.** Now recorded as one
  combined dispatch covering the five stages.

**Residual, carried as build conditions (re-review cap reached at standard depth).**
The plan-review stop rule ends cold review here; the following are prescriptions the cold
reviewer already named, with the exact place build-review must confirm each. None changes
the increment's shape.

- **C-1 — ruleset tone items have no source anchor.** REQ-071a requires each tone item to
  carry a source anchor and confidence (`spec/02-requirements.md:225-226`); the composer
  path supplies neither (`holonovel/src/core/prompt-composition.ts:349-355`). The
  synthesis/discovery branch carries both. Build-review confirms the DECISIONS entry
  records the ruleset branch's `anchor: null` / `confidence: "HIGH"` as a disclosed
  deviation, and that T791 asserts `anchor` only for the synthesis branch.
- **C-2 — `provenance` on the ruleset branch is derived, not literal.** `provenanceTag`
  needs `item.tag` (`holonovel/src/index.ts:16291-16296`), so the branch passes
  `{ tag: "ruleset" }` through it rather than hardcoding the string (Rev5/N3).
  Build-review confirms the handler calls the renderer, not a literal.
- **C-3 — `DEFAULT_WISDOM` fallback keys are synthesised, not stable-by-data.** Build-review
  confirms the fallback passes through `withWisdomKeys` before sorting, so repeated calls
  produce the same keys.
- **C-4 — the Player voice view stays empty on a stock build.** Build-review confirms
  T791 assert 2 asserts the empty marker explicitly (not "no assertion because empty"), so
  the product decision is pinned by a test rather than by prose.

**Targeted confirmation of v3 (user-authorized, beyond the standard re-review cap).**
Verdict: `independent-review passed.` — 0 Blockers, 0 Majors, 4 Nits, all applied here.

- **N1 — the wrong badge accessor was named.** The plan said `activeBadge`; the repo's
  accessor is `getBadge()` (`holonovel/src/index.ts:16286`). Phase 2 now names `getBadge()`.
- **N2 — the view filter was prose, the caller filter was a function.** Now stated
  mechanically: `badge_scope === viewBadge || badge_scope === "shared"` (Phase 1 item 1).
- **N3 — the ruleset provenance was a hardcoded literal.** It now comes from the shared
  renderer, `provenanceTag({ tag: "ruleset" })`, so it cannot drift from `provenanceTag`'s
  vocabulary (`holonovel/src/index.ts:16297`).
- **N4 — the cold pass was recorded as one dispatch.** Recorded accurately: five review
  stages covered across three dispatches (full review, diff re-review, targeted
  confirmation). The stamp's `stages: 5` therefore means stages covered, not dispatches.

## Summary

§11.3 (`spec/08-synthesis.md:269-279`) requires every badge guidance resource that draws
from synthesis data — `guidance://<badge>/voice` and `guidance://<badge>/tone` — to render
the Novel's live synthesis state, and neither URI exists today (`EV1`, `EV5`). The
2026-11-15 U6 sweep recorded the gap as **U6-F6** and scheduled it on `ROADMAP.md`
(`EV17`).

This increment:

1. Registers four concrete resources — `guidance://player/voice`,
   `guidance://game_master/voice`, `guidance://player/tone`,
   `guidance://game_master/tone` — whose payload is computed per call from the live
   wisdom manifest (falling back to the shipped vendor tier), the active Novel, and the
   badge, carrying provenance tags and the `[LOW]` marker through (EV10), with the
   `[narrative-tone]` tag retained on every tone item (DP-7).
2. Adds the two catalog templates `guidance://{badge}/voice` and
   `guidance://{badge}/tone` (`EV6`) and names `voice` in REQ-022a's catalogue
   enumeration (DP-9).
3. Records the surface-count change, adds harness test `T791`, disposes `U6-F6` with its
   corrected rationale, and removes the roadmap section.

This is an implementation increment: the spec already states the contract, and the only
spec edits are the REQ-022a catalogue word, a REQ-071b `_Check:` append, and one
Appendix F row.

## Questions (from the operator)

- **Q1 — scope.** Draft a sequenced queue for every open roadmap item, with the first
  increment fully specified. Answer: this plan is that first increment; the queue is
  the final section.
- **Q2 — gate depth.** Standard: self pass plus one cold pass. Recorded as `Depth:
  standard`; no `risk accepted: no cold pass` condition applies.

## Baseline at HEAD (this session)

| Fact | Value | How obtained |
|---|---|---|
| HEAD | `822228f` | `git rev-parse --short HEAD` |
| Tree | clean (`git status --porcelain` empty) | `git status --porcelain` |
| Fast gate | `45 passed, 0 failed`, `check:fast: PASS` | `npm run check:fast` (exit 0) |
| Release status | 5 open roadmap items, 109 unpushed commits, version `2026.11.15`, last publish 2026-11-09 | `npm run status` |

## Evidence

Every row is a read of the working tree at `822228f`.

| ID | Premise | Anchor |
|---|---|---|
| EV1 | The rendering contract: both badge guidance URIs SHALL render live synthesis state, filtered by output_module and badge scope; Ruleset Wisdom always present | `spec/08-synthesis.md:269-279` |
| EV2 | REQ-071a/b: `[narrative-tone]` items per badge at `guidance://<badge>/tone`, each with source anchor and confidence; `_Check: T26` | `spec/02-requirements.md:225-229` |
| EV3 | REQ-062: badge foundations catalogue at `guidance://<badge>/foundations`; `_Check: T26` | `spec/02-requirements.md:199-204` |
| EV4 | REQ-022 catalogue: guidance anchors are `guidance://<badge>/<anchor>`; §7.8 lists the badge surfaces | `spec/04-runtime.md:11`, `spec/04-runtime.md:695` |
| EV5 | Live guidance registrations: player, game_master, player/GM anti-slop, shared/badge-switch, player/GM foundations. No `voice`, no `tone` | `holonovel/src/index.ts:15755-15773`, `holonovel/src/index.ts:16321-16327` |
| EV6 | `REQ022_URI_CATALOG` feeds the REQ-025 presence report; guidance rows at `:14477-14481` | `holonovel/src/index.ts:14456`, `holonovel/src/index.ts:14477-14481` |
| EV7 | `RESOURCE_GATE` hides `guidance://game_master` from the Player list; `resourceAllowed` matches the URI or any `prefix/` child, so `/voice` and `/tone` are already covered | `holonovel/src/core/badge-gate.ts:73-81`, `holonovel/src/core/badge-gate.ts:179-190` |
| EV8 | `badgeCanSeeWisdom` is content-level filtering driven by the **active** badge: GM/`none` see all, Player sees `badge_scope !== "game_master"` | `holonovel/src/index.ts:16285-16289` |
| EV9 | `effectiveWisdomItems(module)` resolves the live, activated, module-enabled view; a null manifest yields `[]` | `holonovel/src/index.ts:16190-16209` |
| EV10 | `provenanceTag` emits `[supplementary] [LOW]` and is shared by the briefing and every synthesis resource | `holonovel/src/index.ts:16291-16296` |
| EV11 | Shipped `narrative_voices` profiles: 2 items, both `confidence: HIGH`, both `badge_scope: "game_master"` | `holonovel/src/core/wisdom.ts:323-344` |
| EV12 | Ruleset tone samples reach the briefing via `prompt_inputs.narrative_tone`; with none, `composeNarrativeTone` emits one built-in `[narrative-tone]` line | `holonovel/src/core/prompt-composition.ts:349-355`, `holonovel/src/index.ts:17291-17301` |
| EV13 | `WisdomItem` carries `category`, so a tone filter keys on `category` without overloading the provenance `tag` | `holonovel/src/core/wisdom.ts:16-22`, `holonovel/src/core/wisdom.ts:202-209` |
| EV14 | Anti-slop precedent: two concrete registrations, content computed per call, one catalog template, one harness block | `holonovel/src/index.ts:15763-15769`, `holonovel/scripts/test-output-contracts.ts:270-282` |
| EV15 | `resources/templates/list` is asserted in `test-tool-surface`; the only docs-as-code count gate covers tools | `holonovel/scripts/test-tool-surface.ts:110-114`, `holonovel/scripts/test-tool-definitions.ts:205-208` |
| EV16 | Appendix F: T26 at `:1463`, T223 at `:1702`, highest defined test ID `T790` at `:2147` | `spec/appendices-reference.md:1463,1702,2147` |
| EV17 | U6-F6 row and the roadmap section that carries it | `spec/audit/review-register.md:3036-3043`, `ROADMAP.md:15-23` |
| EV18 | Resource/template counts in the server orientation line are hand-maintained; one consumer parses the line for the wiki | `holonovel/AGENTS.md:46`, `scripts/cross-property-couple.ts:43-50` |
| EV19 | Presence is derived from live registrations; a catalog template counts as present when a live registration matches, so catalog and registration ship together | `holonovel/src/index.ts:14745-14777` |
| EV20 | `surface-budget` / `surface-replay` read `tool-definitions.json` only — resources never enter the tool catalog budget | `scripts/surface-budget.ts:22-30`, `scripts/surface-replay.ts:22-27` |
| EV21 | `wisdomManifest` starts `null`, is assigned only by hydration or a synthesis run, so no manifest exists before synthesis | `holonovel/src/core/state.ts:1117`, `:1232`, `holonovel/src/index.ts:16942` |
| EV22 | REQ-022a enumerates badge guidance as "foundations, anti-slop, tone, badge-switch" — no `voice`; REQ-022b requires `resources/list` to include every required URI | `spec/02-requirements.md:695-701`, `spec/02-requirements.md:707` |
| EV23 | `check-loop-artifacts` errors on a `docs/plans/` directory missing `aar.md`, and on a `LOOP OPEN` AAR only when close names it | `scripts/lib/loop-artifacts.ts:10,67-75,82-91` |
| EV24 | `DATA_SECTIONS` (the fingerprint source) covers §5.6, §5.9, §5.19, §5.21-§5.28, §5.31-§5.32, §7.7 and Appendix Q — §5.1 is outside it | `scripts/lib/contract-fingerprint.ts:37-40` |
| EV25 | §11.3's voice contract records `name`, `media_title`, `media_type`, description, source and confidence per profile | `spec/08-synthesis.md:172-179` |

## Scope

**In scope**

- Four guidance resource registrations and two catalog templates (§11.3, REQ-062,
  REQ-071a, REQ-022a).
- Two shared render helpers in `holonovel/src/index.ts`, so resources and briefing read one
  implementation (DP-2, DP-6, DP-7).
- One harness test `T791` (DP-4), one Appendix F row, REQ-071b `_Check:` append, REQ-022a
  catalogue word.
- Bookkeeping: `holonovel/AGENTS.md` counts, `holonovel/DECISIONS.md` entry, review-register
  disposition, `ROADMAP.md` removal, coverage register, CHANGELOG.

**Out of scope (recorded, not fixed)**

- A read-time `[FORBIDDEN]` refusal for a Player read of `guidance://game_master/...`. No
  resource-read gate exists (`EV7` filters `resources/list` only); adding one is a
  REQ-032a change with its own blast radius and is not what U6-F6 names. The Player view is
  protected at content level instead (DP-3).
- Changing the `badge_scope` of the shipped vendor profiles (`EV11`). Player-scoped voice
  content is a content decision; this increment renders whatever the manifest holds.
- `guidance://shared/voice` and `guidance://shared/tone`. `shared` is a badge value in this
  client (`EV5`), but §11.3 names the per-badge pair and the shipped shared surface is a
  single static badge-switch note. The catalog templates resolve through the two concrete
  registrations (`EV19`).
- Any tool, action, or parameter change. `tool-definitions.json`, REQ-429 and REQ-571 do
  not move (`EV20`).
- Briefing composition. `composeNarrativeTone` keeps its signature; the tone resource reuses
  it.

## Decision points

**DP-1 — four concrete registrations, not one `ResourceTemplate`.** Chosen: concrete
`player`/`game_master` × `voice`/`tone` registrations, with the catalog carrying the
`{badge}` templates. Rejected: `ResourceTemplate("guidance://{badge}/voice")` because (a)
the anti-slop precedent is concrete and presence already resolves a catalog template
against concrete registrations (`EV14`, `EV19`); (b) a template would serve arbitrary badge
strings no vocabulary defines; (c) `RESOURCE_GATE` is keyed on concrete URIs and already
covers this shape (`EV7`).

**DP-2 — module mapping, with a vendor-tier fallback.** Chosen: `voice` renders
`state.wisdomManifest ? effectiveWisdomItems("narrative_voices") : withWisdomKeys(DEFAULT_WISDOM).narrative_voices`,
so Ruleset Wisdom is present before synthesis has run (§11.3, EV1), keys are normalised on
both branches (Rev2), and the live manifest takes over once it exists (EV9, EV21). `tone`
renders ruleset tone samples via `composeNarrativeTone` **plus** `supplementary_guidance`
items whose `category` is `narrative-tone`. Rejected: (a) folding `voice_examples` in — REQ-071b separates
entity-level voice examples (REQ-077); (b) filtering tone on the `tag` field — `tag` is the
provenance channel `provenanceTag` owns (EV10), so overloading it would corrupt every
provenance display; `category` is the data field (EV13); (c) a new synthesis module —
§11.3 names existing `output_module`s and a new module would move the manifest schema and
the caps; (d) leaving the voice view empty before synthesis — CB1 and CM4.

**DP-3 — two named predicates, not "the badge".** Chosen: the **URI badge** selects the
view (`/player/*` renders the Player view, `/game_master/*` the GM view) and is passed to
the helper as `viewBadge`; the **caller badge** filters content through a new
parameterised predicate `canSeeGuidanceItem(item, callerBadge)`, which mirrors
`badgeCanSeeWisdom` (EV8) without reading global state, so a Player caller reading the GM
URI receives no GM-scoped item. Both roles are parameters; neither helper reads the badge
implicitly (Rev3). Consequence to accept knowingly: on a stock build
`guidance://player/voice` returns the explicit empty marker, because both shipped profiles
are GM-scoped (EV11); the GM view is non-empty (DP-2). That is spec-conformant badge-scope
filtering, asserted by T791 (C-4), not papered over. Rejected: serving GM-scoped voices to
the Player — the REQ-032a leak badge gates exist to prevent.

**DP-4 — new test ID `T791`, bound by REQ-071b alone.** Chosen: add `T791` to Appendix F
and change REQ-071b to `_Check:_ T26, T791`; the harness label is `"T791/REQ-071: …"`.
Rejected: (a) extending the T223 block — T223 is the REQ-070/REQ-184 anti-slop row and
relabelling it would misattribute coverage; (b) extending the T26 block
(`holonovel/scripts/test-output-contracts.ts:214`) — T26 is listed Manual in Appendix F
(EV16), so binding new automated assertions to it would re-kind a manual row inside this
increment; (c) an unbound test row — `validate` treats a test ID no REQ cites as an
orphan and the coverage register keys `Exercised tests` from `_Check:` lines.

**DP-5 — no new `RESOURCE_GATE` rows.** `resourceAllowed` already matches
`guidance://game_master` and any `prefix/` child (EV7). Precedent note: the repo keeps an
explicit, redundant `guidance://game_master/anti-slop` row
(`holonovel/src/core/badge-gate.ts:78-79`). We do not copy it: the prefix covers the shape,
and four more rows would have to be kept in sync with every future badge anchor.

**DP-6 — one renderer, two consumers.** The tone resource and the briefing both derive from
`composeNarrativeTone`, so the retrievable resource cannot drift from briefing text
(REQ-070b's "renders the same patterns" precedent). Rejected: a second tone selector
inside the resource handler.

**DP-7 — the `[narrative-tone]` tag survives rendering.** The intermediate array strips the
prefix to key items, but every rendered tone item is emitted as
`[narrative-tone] <provenance> <text>`, satisfying REQ-071a (EV2) and the T791 assertion
(CB3). Rejected: stripping the tag for display and re-adding it only in the briefing — the
resource then would not be the same retrievable artifact REQ-071a describes.

**DP-8 — determinism is scoped to state and caller badge.** V2's identical-bytes claim
holds for the same Novel state and the same caller badge; a badge switch is expected to
change the payload (DP-3).

**DP-9 — REQ-022a's catalogue gains `voice`.** The enumeration is the required-URI list
behind REQ-022b's acceptance criterion (EV22); §11.3 already requires the surface, so the
catalogue sentence is the stale half. Chosen: add `voice` to the parenthetical. Rejected:
relying on §11.3 alone — REQ-022b's criterion would then be satisfiable while a required
URI is absent from its own enumeration.

## Phase 0 — preconditions (confirm before the first edit)

1. Confirm the gap: `grep -n 'guidance:.*/\(voice\|tone\)' holonovel/src/index.ts` returns
   nothing.
2. Confirm no harness asserts these URIs:
   `grep -rn 'guidance://[a-z_]*/\(voice\|tone\)' holonovel/scripts` returns nothing.
3. Sibling-contract probe, widened after CM2:
   `grep -n 'guidance://\|badge-specific guidance\|foundations, anti-slop' spec/02-requirements.md spec/04-runtime.md spec/08-synthesis.md`
   → §11.3, REQ-022a/b, REQ-062, REQ-071a/b, §7.8. Confirm no third module, no other tag,
   and that REQ-022a's parenthetical is the only catalogue enumeration naming the badge
   anchors.
4. Record the current live resource and template counts (`resources/list`,
   `resources/templates/list` lengths, and `npm --prefix holonovel run test:tool-surface`);
   write both numbers into `tasks.md` — the AGENTS.md update is measured, not predicted.
5. Fingerprint surface: §5.1 is outside `DATA_SECTIONS` (`EV24`), so REQ-022a/REQ-071b
   edits owe no `contract-fingerprints.ts` regeneration. Confirm with
   `npm run check-fingerprint-sync` before and after.
6. Manifest-null probe (CB1): confirm `state.wisdomManifest` is `null` on a fresh boot
   (`EV21`) and that `DEFAULT_WISDOM.narrative_voices` is the only vendor-tier source
   (`EV11`), so DP-2's fallback is the mechanism, not an assumption.
7. New test ID free: `grep -c '| T791' spec/appendices-reference.md` → `0`; highest defined
   ID is `T790` (`EV16`).
8. Loop-artifact ordering (CB2): create the increment directory with `plan.md`,
   `tasks.md`, and an `aar.md` placeholder ending `LOOP OPEN`, then run
   `npm run check-loop-artifacts` → PASS (EV23). Every later gate run happens with the
   directory already valid.

## Phase 1 — render helpers (`holonovel/src/index.ts`)

Place both beside the existing wisdom helpers (`badgeCanSeeWisdom`, `provenanceTag`,
EV8/EV10) with a header comment citing REQ-022a, REQ-062, REQ-071a and §11.3.

1. `guidanceVoiceItems(viewBadge: Badge): GuidanceVoiceItem[]` where
   `GuidanceVoiceItem = { key: string; name: string; media_title: string; media_type: string; source: string; description: string; confidence: "HIGH" | "MEDIUM" | "LOW"; provenance: string }`.
   Source: `state.wisdomManifest ? effectiveWisdomItems("narrative_voices") : withWisdomKeys(DEFAULT_WISDOM).narrative_voices`
   (DP-2, Rev2), then the view filter `badge_scope === viewBadge || badge_scope === "shared"`,
   then `provenanceTag`, then a stable
   sort (confidence rank, then `name`, then `key`) so the payload is deterministic for a
   given manifest (DP-8).
2. `canSeeGuidanceItem(item: { badge_scope?: string }, callerBadge: Badge): boolean` — the
   parameterised mirror of `badgeCanSeeWisdom` (EV8): GM/`none` see all, Player sees
   `badge_scope !== "game_master"`. Both helpers take their badge explicitly (DP-3, Rev3).
3. `guidanceToneItems(viewBadge: Badge): { ruleset: Array<{ text: string; anchor: string | null; confidence: "HIGH" | "MEDIUM" | "LOW"; provenance: string }>; synthesis: GuidanceVoiceItem[] }`.
   `ruleset` from `composeNarrativeTone(promptInputsFor(state.activeNovel))` split on
   newlines: prefix stripped into `text`, `anchor: null`, `confidence: "HIGH"`, and
   `provenance` from the shared renderer, `provenanceTag({ tag: "ruleset" })`, so the
   literal cannot drift from it (EV12, Rev1, C-1, C-2); `synthesis` from
   `effectiveWisdomItems("supplementary_guidance")` filtered on `category === "narrative-tone"`
   with the view-badge and caller filters, mapped through `provenanceTag`, same ordering
   (EV13, EV10).
4. Both helpers are pure reads — no mutation, no writes — so no audit entry is owed
   (REQ-040a covers mutations).

**Markdown shape** (`text/markdown`, both resources): H1 naming the badge, `## Ruleset
Wisdom` then `## Synthesis`. A voice item renders as `## <provenance> <name> — <media_title>
(<media_type>)` followed by the description and a `source: <url>` line. A tone item renders
as `[narrative-tone] <provenance> <text>` (DP-7) plus `anchor:` and `confidence:` lines when
present. Empty views render the explicit marker `(no <kind> — module empty)`.

## Phase 2 — registrations

1. `guidance-player-voice` → `guidance://player/voice` ("Player Voice Guidance")
2. `guidance-gm-voice` → `guidance://game_master/voice` ("GM Voice Guidance")
3. `guidance-player-tone` → `guidance://player/tone` ("Player Tone Guidance")
4. `guidance-gm-tone` → `guidance://game_master/tone` ("GM Tone Guidance")

Each handler takes no arguments and computes its payload per call (no memoised module
state), matching the anti-slop handlers (EV14). Each passes the **URI** badge as
`viewBadge` and then filters the result with `canSeeGuidanceItem(item, getBadge())`
(DP-3, Rev3); neither value is inferred from the other.

Registration order: immediately after the foundations block (`EV5`,
`holonovel/src/index.ts:16321-16327`), so the guidance family stays contiguous.

## Phase 3 — catalogue and counts

1. Insert after the `guidance://{badge}/foundations` row (EV6):
   `{ template: "guidance://{badge}/voice", title: "Badge Voice Guidance" }` and
   `{ template: "guidance://{badge}/tone", title: "Badge Tone Guidance" }`.
2. Update `holonovel/AGENTS.md:46` with the **measured** counts (Phase 0 step 4 plus the new
   registrations, EV18). Expected direction: resources +4; templates unchanged (the catalog
   is not `resources/templates/list`). Record the measured template count if it moves.
3. No `RESOURCE_GATE` edit (DP-5). No `surface-budget --write`, no tool-definition
   regeneration: neither reads resources (EV20).

## Phase 4 — harness assertion (`holonovel/scripts/test-output-contracts.ts`)

One new block beside T223 (EV14), labelled
`"T791/REQ-071: badge guidance renders live synthesis state"`:

1. **Ruleset tone base.** On a default boot, `resources/read` on `guidance://player/tone`
   and `guidance://game_master/tone` each contain a `[narrative-tone]` line (the composer's
   built-in sample, EV12), and each line still carries the tag (DP-7, CB3).
2. **Vendor voice tier (before synthesis).** `guidance://game_master/voice` contains the
   shipped profile name and `[vendor]` (`EV11`, `EV21`, DP-2); `guidance://player/voice`
   contains the empty marker and **not** the profile name (DP-3, REQ-032a).
3. **Live synthesis passthrough.** Run `manage_synthesis (action: run)` and re-read
   `guidance://game_master/voice`; the payload must still contain the vendor profile and
   must now also reflect the post-run manifest (assert an item count or a synthesized
   profile when one exists; if the ruleset-free projection yields none, assert only that
   the vendor tier survives the run and record the reduced coverage in `tasks.md`).
4. **Provenance, anchor and presence.** Every rendered item in both views carries a
   non-empty `provenance` (voice and synthesis items and the ruleset tone line alike, all
   through `provenanceTag`, Rev1); the `[LOW]` branch inherits the harness blocks
   `T325a`/`T325b` (`holonovel/scripts/test-backfill.ts:2101,2118`, Appendix F `T325`
   at `spec/appendices-reference.md:1771`, CM1/Rev4); `anchor` is asserted for synthesis
   tone items only (C-1); the `spec_health` resource report lists both catalog templates as
   `present` (EV19); and a Player `resources/list` omits `guidance://game_master/voice`
   (EV7, the DP-5 assertion).

## Phase 5 — spec edit, assembly, register regeneration

1. REQ-022a: `(foundations, anti-slop, tone, badge-switch)` →
   `(foundations, anti-slop, tone, voice, badge-switch)` (DP-9, EV22). One word; the body
   stays inside §5.1 and inside its sentence budget.
2. REQ-071b: `_Check: T26` → `_Check: T26, T791` (DP-4).
3. Appendix F: add `T791` (Automated) after `T790` (`spec/appendices-reference.md:2147`),
   naming both URIs, the live-synthesis requirement, the badge filter, the `[LOW]`
   inheritance, and the empty-marker case; REQ column `REQ-071`.
4. No new REQ is added, so no §5 section-map row, coverage-map-table row,
   `build-phase-map.md` edit, or REQ-278 phase-map hash moves are owed (S1).
5. `npm run assemble`.
6. `npm run validate -- --write-register` — REQ-071's `Exercised tests` reads `T26, T791`.
7. `npm run build-order` — full `check` plus the near-duplicate scan; fingerprints must not
   drift (EV24).

## Phase 6 — records and close

1. `spec/audit/review-register.md`: U6-F6 → `Resolved`, stating that `T791` holds the
   predicate **and** that the scheduling rationale (REQ-429/REQ-571 moving, "both resource
   templates") was wrong — resources move no tool budget (EV20) and the catalog entries are
   not `resources/templates/list` entries (m5). Same step as the roadmap removal, so
   `check-registers` sees the pair.
2. `ROADMAP.md`: delete § *Synthesis badge-guidance renderers (P1)* (`ROADMAP.md:15-23`).
3. `holonovel/DECISIONS.md`: dated entry — four resources, two catalog templates, DP-2
   (vendor fallback through `withWisdomKeys`), DP-3 (Player-empty consequence), DP-7 (tag
   retention), the ruleset tone branch's `anchor: null` / `confidence: "HIGH"` deviation
   from REQ-071a's anchor duty (C-1), that REQ-429/REQ-571 are untouched with the
   reason (EV20), and the **pre-existing** count drift (measured 43 resources / 23
   templates at HEAD against the documented 40 / 22), so the recorded jump is not
   attributed wholly to this increment (A-2).
4. `CHANGELOG.md`: dated entry whose date equals the session date (S6); it becomes the
   commit subject.
5. Replace the `LOOP OPEN` placeholder `aar.md` with the real AAR ending `LOOP PAUSED`
   (CB2, EV23), then `npm run session:close`.

## Blast radius

| File | Change | Size |
|---|---|---|
| `holonovel/src/index.ts` | two helpers, four registrations, two catalog rows | M |
| `holonovel/scripts/test-output-contracts.ts` | one test block (`T791`) | S |
| `holonovel/scripts/lib/holosuite-conformance.ts` | one evidence anchor line re-pointed after the `index.ts` insertion | S |
| `holonovel/AGENTS.md` | resource/template counts | S |
| `spec/02-requirements.md` | REQ-022a catalogue word; REQ-071b `_Check:` append | S |
| `spec/appendices-reference.md` | Appendix F row `T791` | S |
| `spec/audit/req-coverage.md` | regenerated | S |
| `spec/audit/review-register.md` | U6-F6 → Resolved, rationale corrected | S |
| `spec/build-phase-map.md` | generated: REQ-278 content hash advanced by `assemble` | S (generated) |
| `ROADMAP.md` | section removed | S |
| `holonovel/DECISIONS.md` | dated entry | S |
| `holonovel/src/generated/g7-attestation.ts` | generated: `SPEC_HASH` advanced by the G7 attestation generator | S (generated) |
| `holonovel.md`, `holonovel/holonovel.md` | regenerated by assemble | M (generated) |
| `CHANGELOG.md` | dated entry | S |
| `docs/plans/2026-11-15-synthesis-badge-guidance/` | plan, tasks, AAR | M |

Examined, not edited: `holonovel/src/core/badge-gate.ts` (DP-5), `holonovel/src/core/wisdom.ts`
(DP-2 data), `holonovel/src/core/state.ts` (EV21), `scripts/lib/loop-artifacts.ts` (EV23),
`scripts/lib/contract-fingerprint.ts` (EV24), `scripts/surface-budget.ts`,
`scripts/surface-replay.ts`, `scripts/cross-property-couple.ts`.

## Files expected

- `holonovel/src/index.ts`
- `holonovel/scripts/test-output-contracts.ts`
- `holonovel/scripts/lib/holosuite-conformance.ts`
- `holonovel/AGENTS.md`
- `holonovel/DECISIONS.md`
- `holonovel/src/generated/g7-attestation.ts`
- `holonovel.md`
- `holonovel/holonovel.md`
- `spec/02-requirements.md`
- `spec/appendices-reference.md`
- `spec/audit/req-coverage.md`
- `spec/audit/review-register.md`
- `spec/build-phase-map.md`
- `ROADMAP.md`
- `CHANGELOG.md`
- `docs/plans/2026-11-15-synthesis-badge-guidance/plan.md`
- `docs/plans/2026-11-15-synthesis-badge-guidance/tasks.md`
- `docs/plans/2026-11-15-synthesis-badge-guidance/aar.md`

## Verification

| # | Claim | Probe | Pass condition |
|---|---|---|---|
| V1 | Resources register | `npm --prefix holonovel run build`, then a `resources/list` probe or the T791 block | all four URIs present |
| V2 | Payloads are live and deterministic for a given state + caller badge (DP-8) | run T791 twice on the same state | identical bytes; a synthesis run changes the GM voice payload |
| V3 | Badge filter holds | T791 assert 2 | Player voice view excludes the GM-scoped profile; GM view includes it |
| V4 | No Player leak in the list | T791 assert 4 | `guidance://game_master/voice` absent from the Player `resources/list` |
| V5 | Provenance carried on every item; `[LOW]` inherited | T791 assert 4 plus the `T325a`/`T325b` blocks for the LOW branch (CM1, Rev4) | every item has a non-empty `provenance` (all produced by `provenanceTag`); LOW branch covered by the existing harness blocks |
| V6 | Presence report resolves both templates | T791 assert 4 via `spec_health` | `present`, never `absent` |
| V7 | Harness suite | `npm --prefix holonovel run test:output-contracts`, then `npm run test:all` (server paths changed) | 0 failures |
| V8 | Spec gates | `npm run assemble && npm run check:fast` | trailing `check:fast: PASS`, exit 0, 0 errors |
| V9 | Full gate and fingerprints | `npm run build-order` | no fingerprint drift, no new `WARNING:` |
| V10 | Coverage register current | `grep -n 'REQ-071' spec/audit/req-coverage.md` | `Exercised tests` includes `T791` |
| V11 | Register pair consistent | `npm run check-registers` | PASS with U6-F6 `Resolved` and the section gone |
| V12 | Roadmap admission rule | `npm run check-roadmap` | PASS after the removal |
| V13 | Increment artifacts valid | `npm run check-loop-artifacts` | PASS at Phase 0 (placeholder) and at close (`LOOP PAUSED`) |

## User impact

- New retrievable surfaces only. No tool, action, parameter, or Novel-state change; no
  restart or migration; existing clients keep working.
- On a stock build `guidance://player/voice` is an explicit empty marker rather than
  invented content (DP-3), while the GM view is non-empty from the vendor tier (DP-2).
  Both are recorded in DECISIONS.md.
- Counts in the server orientation line move once (+4 resources).

## Risks and rollback

| Risk | Mitigation |
|---|---|
| A tone filter on `category` finds no items (no producer writes it yet, OQ-1) | The ruleset branch still renders (EV12), so the tone resource is never empty on a ruleset-bound Novel; the synthesis branch is additive. |
| The Player-empty voice view reads as a regression | Asserted and documented (DP-3, DECISIONS); changing vendor `badge_scope` is content work with its own review. |
| `DEFAULT_WISDOM` fallback diverges from the manifest once synthesis runs | The fallback is used only when `state.wisdomManifest` is null (EV21); after a run, `effectiveWisdomItems` is the single source. |
| Count drift in `holonovel/AGENTS.md` (only the tool count is gated, EV15) | Counts are measured, not predicted. The documented baseline was already stale (43/23 measured vs 40/22 documented at HEAD), so the DECISIONS entry reports the drift rather than presenting +4 as the whole move (A-2). |
| A new Appendix F row stales the coverage register | Phase 5 step 6 regenerates it in the same increment. |
| Gate ordering (CB2) | The increment directory exists and passes `check-loop-artifacts` from Phase 0; only the AAR body changes at close. |
| Rollback | One `git revert` of a single commit; `assemble` reproduces the generated copies byte-identically. |

## Commit plan

One commit. A spec-adjacent server change follows the spec-increment rule: `docs/plans`
artifact, spec edits, generated copies, and record updates land together. Gates before the
commit: `npm run assemble && npm run check:fast`, then `npm run test:all`, then
`npm run session:close` (which re-runs the fast gates and re-verifies the AAR).

## Done bar

This plan is done when all of the following hold in the session:

1. Four URIs registered; both catalog templates report `present`.
2. `T791` exists in Appendix F, is cited by REQ-071b, and passes in `test:output-contracts`
   and `test:all`.
3. REQ-022a's catalogue names `voice`; the coverage register is regenerated.
4. `npm run assemble && npm run check:fast` exits 0; `npm run build-order` reports no
   fingerprint drift.
5. U6-F6 is `Resolved` with its corrected rationale, the roadmap section is removed,
   `CHANGELOG.md` and `DECISIONS.md` carry the entry, and the increment is one commit closed
   by `session:close` with `LOOP PAUSED`.

## Open questions

- **OQ-1 — tone producer.** No code writes `category: "narrative-tone"` into
  `supplementary_guidance` today (grep at `822228f` returns none). The plan ships the filter
  plus the ruleset branch. A builder-side producer is scope growth and needs its own plan.
- **OQ-2 — Player-scoped voice content.** Whether to ship at least one shared/player
  `narrative_voices` profile so `guidance://player/voice` is non-empty on a stock build is a
  content decision, not a contract one. Not scheduled here.
- **OQ-3 — read-time refusal.** Whether resources should gain a read-path `[FORBIDDEN]`
  (T26's manual expectation for `guidance://<gm-badge>`) is an open REQ-032a question,
  explicitly out of scope here.
- **OQ-4 — ruleset tone anchors.** REQ-071a requires a source anchor per tone item; the
  ruleset composer has none (C-1). The synthesis/discovery branch supplies one. Whether the
  composer should also emit anchors is a discovery-side change, scheduled nowhere here.

## Queue — remaining roadmap items

Sequenced from `ROADMAP.md` at `822228f`. Priority first, then dependency and trigger
honesty. One increment = one commit.

| # | Item | Priority | Depends on | Trigger / note |
|---|---|---|---|---|
| 1 | **This plan** — synthesis badge-guidance renderers (U6-F6) | P1 | none | Closes the U6 residual; touches the guidance/wisdom read surface. |
| 2 | **Vendor-manifest source provenance (U7-F4)** | P1 | none | `source_url` column for the eight vendored rows plus a checker predicate, so Appendix U's admission rule (c) has a mechanical test. Independent of #1; touches `narrative_world_model/MANIFEST.md`, `check-vendor-manifest`, Appendix U. |
| 3 | **Harness test-ID label hygiene (F-P2-4)** | P2 | none | One-line comment fix at `holonovel/scripts/test-narrative.ts:1205` plus a corpus grep. Fold into the next session already editing harness files (eligible: #1 if it touched `test-narrative.ts` — it does not; so fold into #2 or run as a micro-commit). |
| 4 | **Faction knowledge on secrets (U6-F5 residual)** | P2 | #1 (both change guidance/lore read surfaces and share one register-regeneration pass) | `manage_lore (action: set_secret)` gains optional `known_by`; `reveal` accepts faction ids; §11.2 rule 6's shared-secret branch becomes harness-assertable. |
| 5 | **Loop-gate fix-up rate re-measurement** | P2 | the calendar | Trigger 2026-11-28 or 26 new commits, whichever first. No code; recorded in that session's AAR. Not schedulable before its trigger. |

Ordering rationale: the two P1s run first and are independent, so #2 can be picked up in any
session with room once #1 lands. #3 is folded into a harness-touching session rather than
given its own increment; a comment fix that moves no gate is not worth a commit alone. #4 is
sequenced behind #1 only because both change guidance/wisdom read surfaces and both need one
register-regeneration pass. #5 has a date trigger and must not be pulled forward.

## Amendments (execution)

- **A-1 (2026-11-15, Phase 5) — `spec/build-phase-map.md` is a generated target.**
  `npm run assemble` advanced the REQ-278 content hash in `spec/build-phase-map.md` after the
  REQ-022a/REQ-071b edits. The file was absent from the original Files-expected list; the
  plan authorised the command (`Phase 5 step 5`) but not the artifact it writes. Added to
  Files expected and the blast-radius table as a generated file. The diff is the hash line
  only; nothing in the phase map's structure moved.
- **A-3 (2026-11-15, Phase 5) — the G7 attestation carries the spec hash.** `npm run build-order`
  regenerated `holonovel/src/generated/g7-attestation.ts` because the §5.12 attestation
  embeds `SPEC_HASH`; the diff is that one constant (`f49af445…` → `a74df8c6…`), confirmed by
  the generator's own output. Added to Files expected and the blast-radius table as a
  generated file. The plan authorised `build-order`, which regenerates it, but the artifact
  was not named — the same class of omission as A-1.
- **A-4 (2026-11-15, Phase 5) — one Holosuite evidence anchor moved.** The 144 inserted lines
  in `holonovel/src/index.ts` shifted the conformance predicate's `PREDICATE_PROMPTS` anchor
  (`holonovel/scripts/lib/holosuite-conformance.ts:37`) from line 17487, where `prompt`
  stopped matching a unique candidate. Re-pointed to 17631 (the `server.prompt("intro", …)`
  registration); `npm run fix-anchors` reports "predicates current" and the conformance tier
  passes. Added to Files expected and the blast-radius table.
- **A-2 (2026-11-15, Phase 3) — the documented surface counts were already stale.** The
  measured live surface at HEAD `822228f` was 43 resources / 23 templates against the
  documented 40 / 22 (only the tool count is gated, EV15). This increment adds four
  resources, so `holonovel/AGENTS.md` now records the measured 47 / 23 and the DECISIONS
  entry states the pre-existing drift, rather than presenting the jump as this
  increment's alone.
