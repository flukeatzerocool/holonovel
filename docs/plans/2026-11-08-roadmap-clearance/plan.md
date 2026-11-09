# Plan — Roadmap clearance: Torre polish (P1) and NPC identity in play (P2)

Session 2026-11-08. Base HEAD `2f5a0c8` (clean tree). Plan revision 3 —
revision 2 plus the user's two answers: add `gothic_horror` (D4 option B), and
leave Phase 3 to the next session. Gate depth: standard. Rollback cost: 1.

## Questions (user's words)

"Draft plan for open roadmap items." `npm run status` reports four open items:

1. Torre content polish (P1) — beat previews, `Your Candle` wearable, genre tag.
2. NPC identity in play (P2) — surface an NPC's identity facets in normal play.
3. Torre player-facing knowledge depth (P3) — more pages / discovered lore.
4. Survivor race clock (P3) — decide descriptive vs. mechanical.

User answers (this revision): (1) add `gothic_horror` to the canonical genre
set; (2) Phase 3 runs next session — it stays on ROADMAP under its trigger.
Phase 4 likewise keeps its trigger. This plan executes P1 and P2 only.

## Done bar

**Done bar:** the starter's four beat previews are first sentences and the
live recording path derives a first sentence; `Your Candle` is not wearable;
`gothic_horror` is a declared genre tag in REQ-294, `GENRE_CATALOG`, T339,
and the starter content; a Game Master sees an NPC's accepted identity facets
in `manage_npc (action: get)` and in the present-NPC briefing block while
every Player surface stays free of them; REQ-649, the §5 section map, the
created-REQ table, and T772 are in the spec; tool definitions, surface
baseline, coverage register, README markers, and assembled `holonovel.md` are
regenerated; the two shipped ROADMAP sections are removed and the three
matching register rows are Resolved; `test:starter-novel`, `test:narrative`,
`test:identity`, `test:persistence`, `test:output-contracts`,
`test:tool-definitions`, `npm run test:all`, root `check:fast`,
`check:conformance`, and `build-order` pass; the increment lands as one
commit with plan/tasks/AAR and a terminal LOOP token; nothing is pushed.

## Baseline (measured this session)

- `git log --oneline -1` → `2f5a0c8`; `git status --short` empty.
- Root `npm run check:fast` → 37 passed / 0 failed, trailing `check:fast: PASS`.
- `npm run status` → 4 open roadmap items; 12 unpushed commits; version
  2026.11.08, latest tag v2026.11.07. Publication is pending; it is a separate
  authorized step (`./scripts/push-pipeline.sh`), not part of this plan.
- `manage_npc` description is 565 UTF-8 bytes; the surface budget is
  proportional to the full catalog (DECISIONS.md "Recorded surface budgets":
  full 27,955 / standard 24,357 / small 1,149 tokens).
- Local date is 2026-11-08 (UTC already 2026-11-09); the CHANGELOG heading and
  `session:close --date` default therefore agree as 2026-11-08.

## Findings

| ID | Severity | Finding | Predicate (file:line) |
|---|---|---|---|
| R1-1 | Major | Beat previews are cut mid-word at 60 characters; REQ-337a requires the first sentence. | `holonovel/src/index.ts:6005` calls `recordBeatTransition(novel, beat, effectiveDescription.substring(0, 60))`; helper at `:5676-5686`; REQ-337a `spec/02-requirements.md:3561-3562`. |
| R1-2 | Minor | The four authored starter beats carry the same 60-character cut. | `holonovel/content/torre-nosferatu.source.json:3080-3101` (`story_beats`; first preview ends "with no m"). |
| R1-3 | Minor | `Your Candle` is the only world thing flagged wearable. | `holonovel/content/torre-nosferatu.source.json:2229` (`world.things["your candle"].wearable: true`); every other thing is false. |
| R1-4 | Minor | Genre is `historical`; the Novel description calls the story "a gothic-horror descent", and no gothic tag exists in the catalog. | `holonovel/content/torre-nosferatu.source.json:1175` and `genre`; `GENRE_CATALOG` `holonovel/src/index.ts:10037`; REQ-294 `spec/02-requirements.md:2967-2969`. |
| R2-1 | Major | NPC identity facets are unreachable in normal play. | `manage_npc` get returns the NPC record only (`holonovel/src/index.ts:6308-6313`); facets live in `novel.identities` (`content/torre-nosferatu.source.json` `identities.npc_mv4m1599`, 3 facets); the GM present-NPC block renders `npc.mind` only (`:13795-13799` → `composeNpcMemorySection` `:4106-4130`). |
| R3-1 | Deferred | Player-facing knowledge is seven readable pages and 17 GM-only lore entries. | `holonovel/content/torre-nosferatu.source.json` `lore` (17 keys, none with `visibility`), `world.things["page — …"]` (7 entries). |
| R4-1 | Deferred | The Survivors' 0/10 faction clock has no scene-transition advance, and REQ-233a3's "(current behavior)" claims one. | Faction clocks mutate at `holonovel/src/index.ts:682`, `:3413`, `:5702` (interval default 0 at `:360`); `worldReactivityEnabled` (`:379`) has no call site; REQ-233a3 `spec/02-requirements.md:2144-2145`. |

R3-1 and R4-1 are evidence for the existing P3 ROADMAP entries, not new
actions; they stay registered there.

Sibling contracts checked: REQ-075a–075i (NPC state, card import/export) —
REQ-075f already makes `mind` GM-only, and REQ-075i's card export reads the
NPC record only, so a separate identity store stays out of the card. No other
REQ binds `manage_npc (action: get)`.

## Decisions

- **D1 — Scope.** Execute P1 and P2 this session; Phase 3 runs next session;
  Phase 4 keeps its trigger.
- **D2 — First sentence, one helper.** Define the preview as the text through
  the first `.`, `!`, or `?` followed by whitespace or end of string,
  including the terminator; with no terminator, use the whole description.
  Call it at `:6005`. Rejected: keeping 60 characters as a cap.
  `scene_preview` is unbounded (`holonovel/src/core/state.ts:333`).
- **D3 — No save migration.** A live Novel keeps the previews it already
  recorded; the starter's previews are authored data re-emitted from source.
- **D4 — Genre: add `gothic_horror` (user choice).** Amend REQ-294's canonical
  set, add it to `GENRE_CATALOG` (`holonovel/src/index.ts:10037`), extend the
  T339/REQ-294 declaration test, and set the starter `genre` to
  `gothic_horror`. Rejected: keeping `historical` (superseded by the user's
  answer). The description's "gothic-horror" wording now matches the tag.
- **D5 — NPC identity through a new REQ-649.** The Game Master's
  `manage_npc (action: get)` and the present-NPC briefing block render a
  compiled identity summary for an NPC with accepted facets. The Player badge
  keeps the sanitized NPC record with no summary, and a Player identity read of
  another subject stays refused per REQ-643. Rejected: a per-NPC `identity`
  field (leaks through `sanitizeNpcForBadge`, `:582-587`; NI-4 precedent).
- **D6 — No new tool, action, persisted surface, or behavioral config.**
  `novel.identities` already exists, so §7.7, the clone/checkpoint/archive
  enumerations, and the tool-surface count are unchanged; only `manage_npc`'s
  description grows.
- **D7 — Register coupling.** Shipping P1/P2 removes their ROADMAP sections and
  moves the three matching `## Scheduled-roadmap` rows to `## Resolved`
  (`check-registers` fails a Scheduled-roadmap row whose cited REQ left
  ROADMAP: `scripts/lib/register-checks.ts:64-68`).

## Blast radius

| File | Phase | Change | Size |
|---|---|---|---|
| `holonovel/src/index.ts` | 1, 2 | `firstSentence()` + call site; `GENRE_CATALOG`; GM identity summary in `manage_npc` get; NPC identity lines in `composeNpcMemorySection`; `manage_npc` description | M |
| `holonovel/content/torre-nosferatu.source.json` | 1 | Four authored previews, `wearable: false`, `genre: gothic_horror` | S |
| `holonovel/content/torre-nosferatu.json` | 1 | Regenerated by `build:starter-novel` (byte-deterministic) | M |
| `holonovel/scripts/test-starter-novel.ts` | 1, 2 | Preview/term and wearable assertions; GM NPC-identity get assertion | S |
| `holonovel/scripts/test-narrative.ts` | 1 | First-sentence assertion on a scene-transition beat | S |
| `holonovel/scripts/test-persistence.ts` | 1 | T339 accepts `gothic_horror` | S |
| `holonovel/scripts/test-identity.ts` | 2 | T772: GM get summary, Player absence, determinism | M |
| `spec/02-requirements.md` | 1, 2 | REQ-294 canonical set; REQ-649 after REQ-643; §5 section map line 34 (`636–643, 649`) | S |
| `spec/appendices-reference.md` | 2 | Created-REQ row (2026-11-08) and Appendix T row T772 | S |
| `holonovel.md`, `holonovel/holonovel.md` | 1, 2 | Assembled output (`npm run assemble`) | M |
| `holonovel/tool-definitions.json` | 2 | Regenerated by `generate-tool-definitions.ts` | M |
| `spec/audit/tool-surface-baseline.json` | 2 | Regenerated by `surface-budget -- --write` | S |
| `holonovel/DECISIONS.md` | 2 | Recorded surface-budget line if the measured tokens move | S |
| `spec/audit/req-coverage.md` | 2 | `npm run validate -- --write-register` | S |
| `README.md`, `holonovel/AGENTS.md` | 2 | `npm run refresh-properties` (REQ count and markers) | S |
| `spec/audit/review-register.md` | 1, 2 | Three Scheduled-roadmap rows → Resolved (D7) | S |
| `ROADMAP.md` | 1, 2 | Remove the P1 and P2 sections once each ships | S |
| `CHANGELOG.md` | 1, 2 | One dated entry (single spec increment) | S |
| `docs/plans/2026-11-08-roadmap-clearance/plan.md`, `tasks.md`, `aar.md` | all | Increment artifacts, AAR ending in a LOOP token | S |

## Phase 1 — Torre content polish (P1)

1. Add `firstSentence(text)` beside `recordBeatTransition`
   (`holonovel/src/index.ts:5675`) per D2 and use it at `:6005`.
2. Author the four `story_beats` previews in `torre-nosferatu.source.json` as
   single first sentences consistent with the beat and the authored history
   (R1-2); keep beat values and order.
3. Set `world.things["your candle"].wearable` to `false` (R1-3).
4. Genre (D4): add `gothic_horror` to REQ-294's canonical set
   (`spec/02-requirements.md:2967-2969`), to `GENRE_CATALOG`
   (`holonovel/src/index.ts:10037`), and to the T339 test
   (`holonovel/scripts/test-persistence.ts:390-399`); set the starter `genre`.
5. Regenerate `cd holonovel && npm run build:starter-novel`; confirm the diff is
   confined to the intended fields.
6. Tests: `test-starter-novel` — every authored preview ends in `.`/`!`/`?`
   and no authored thing is `wearable`; `test-narrative` — a beat transition
   from a two-sentence description records exactly the first sentence.
7. Registers: move the preview and wearable rows to `## Resolved`; delete the
   P1 ROADMAP section (D7).

**Verification:** `cd holonovel && npm run test:starter-novel && npm run
test:narrative && npm run test:persistence`; root `npm run assemble && npm run
check:fast`.

## Phase 2 — NPC identity in play (P2)

1. Spec: add REQ-649 ("NPC identity summary") after REQ-643 in §5.26; update
   the §5 section map (line 34) to `473–483, 547, 636–643, 649`; add the
   created-REQ row and Appendix T row T772. Keep the body within one paragraph,
   ≤800 characters, ≤8 sentences, one `_Check:_`. Adding a server-runtime REQ
   implies the section-map row, created-REQ table, Appendix T row,
   coverage-register regeneration, marker refresh, and `build-order`; it adds
   no behavioral config (D6).
2. Implementation: `npcIdentitySummary(novel, npcId)` reads `identityFor`
   (`holonovel/src/index.ts:8087`), compiles with `compileKernel`
   (`src/core/identity.ts:216`), and renders with `renderWhoTheyAre`
   (`:333`) at the newest event-log instant; `manage_npc` get attaches
   `{ version, summary }` for the GM only, and `composeNpcMemorySection`
   (`:4106`) appends the summary lines. Return the plain record when the NPC
   has no current facets; never attach for a Player badge.
3. Update the `manage_npc` description to name the GM-only identity summary.
4. Regenerate: `npx tsx holonovel/scripts/generate-tool-definitions.ts`;
   `npm run surface-budget -- --write`; sync the DECISIONS.md budget line if
   it moved; `npm run validate -- --write-register`;
   `npm run refresh-properties`.
5. Test T772 in `test-identity.ts`: create an NPC, accept two facets (one
   unaware), assert the GM get lists both in catalog order with the unaware
   mark, the Player get carries no summary key, the Player briefing carries no
   NPC identity line, and two GM reads are byte-identical.
6. Registers: move the NPC-identity row to `## Resolved`; delete the P2 ROADMAP
   section.
7. CHANGELOG: one dated entry covering both phases.

**Verification:** `cd holonovel && npm run test:identity && npm run
test:output-contracts && npm run test:tool-definitions && npm run test:all`;
root `npm run assemble && npm run check:fast`; `npm run check:conformance`;
`npm run build-order`.

## Phase 3 — Torre player-facing knowledge depth (deferred to next session)

Shape only: add two or three readable `page — …` things (the tower's origin,
the survivors' bargain, the matches), optionally tagging lore entries
`visibility: player_discovered` with a reveal path (REQ-083d); extend
`test-starter-novel.ts` to assert the new page count; regenerate the starter.
The ROADMAP entry and its trigger stay unchanged.

## Phase 4 — Survivor race clock (deferred, trigger-gated)

Shape only: decide descriptive vs. mechanical. Descriptive closes the item with
a recorded decision. Mechanical adds an advance-on-scene-transition clock whose
completion fires a "first to the door" world effect, balanced against The
Candle and Dread, and must also settle R4-1. Playtest before shipping.

## Commit order and gates

One commit — the session changes `spec/`, so `session-close` treats it as a
spec increment and refuses to split it.

1. Write `plan.md`, `tasks.md`, and a complete `aar.md` (measured evidence,
   terminal LOOP token) before committing — `check-loop-artifacts` gates it.
2. Stage both phases; run `npm run session:close`.
3. Publication is a separate authorized step and is out of scope.

## User impact

No restart or migration is required beyond restarting the server to pick up the
rebuilt package; the new field is additive and GM-only, so existing Novels and
clients are unaffected. The regenerated starter applies only to fresh data
directories (REQ-565 seeds once). The genre tag adds one accepted value and
changes no stored Novel.

## Risks and rollback

- **Starter regeneration drift** — `check-starter-freshness` and the diff
  review catch it; revert with `git checkout -- holonovel/content`.
- **Description budget** — the baseline and the DECISIONS.md recorded line move
  together (REQ-429/REQ-571).
- **Output-contract change** — the GM `manage_npc get` `summary` key is
  additive and GM-only; `test-output-contracts` and `test-identity` verify it.
- **Rollback** — reversible edits (cost 1); no migration, nothing destructive.

## Open questions

None — both were answered for this revision.
