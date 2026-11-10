# Plan — Server-note narrative coupling (REQ-365a/b/c, F-P8-1)

**Status:** reviewed — approved with conditions · **Date:** 2026-11-09 · **Depth:** standard
**Review independence:** fresh — one cold pass (`independent-review passed.`,
5/5 stages, 38 reads) report `/tmp/opencode/p8-1-cold-report.md`, plus one
targeted diff re-review (`independent-review passed.`, 5/5 stages, 10 reads)
`/tmp/opencode/p8-1-rereview-report.md` sha256
`c26c15a92ca08f3e562fd17e4fd66de347297d193a13d6befc5d08edca5df259`. Condition
fixes from the re-review (M1 predicate wording, M2 citation) are in the text,
verified by `build-review`.
**Rollback cost:** 1 (reversible edit; no state, schema, or migration change)
**Roadmap item:** `ROADMAP.md:15-23` § Server-note narrative coupling (P1)
**Finding:** F-P8-1 — `spec/audit/review-register.md:1205`
**Predecessor:** `docs/plans/2026-11-09-full-review-p8/` (closing review chunk)
**Baseline:** `npm run check:fast` → 37 passed, 0 failed, `check:fast: PASS`;
the only tree change at plan time is this untracked plan directory.

## Questions

1. Where in `badge_briefing` do tagged server notes belong? REQ-365a says "in
   the `badge_briefing` supplementary guidance alongside synthesis items"
   (`spec/02-requirements.md:3736`). The existing "Supplementary guidance" line
   is a labelled group **inside** the `### Synthesis` block
   (`holonovel/src/index.ts:14073`), not a section of its own, and REQ-265b
   (`spec/02-requirements.md:2754`) forbids an empty synthesis section.
2. Does adding this surface need a new briefing section token (REQ-185/REQ-186),
   a DECISIONS.md token-mapping entry (REQ-082), or a spec-text change?
3. Which badge predicate gates it, given that REQ-365c forbids the Player badge
   and the `server-notes://` resource already admits `game_master` and `none`
   (`holonovel/src/index.ts:12756`)?

## Evidence

| Claim | Evidence | Class |
|---|---|---|
| `set_server` stores `narrative_tag` | `holonovel/src/index.ts:8143-8147`; store field `holonovel/src/core/state.ts:1001`; load/save `:2649`, `:2656` | repo |
| `server-notes://<key>` serves the note, GM/none only | `holonovel/src/index.ts:12754-12765` | repo |
| Briefing renders synthesis items only; no `serverNotes` read in the builder | `holonovel/src/index.ts:14059-14095` (synthesis block), `:14073` (Supplementary guidance group), `:14092-14094` (section emit); `grep serverNotes holonovel/src` finds only `:8145`, `:8151-8162`, `:12104`, `:12754`, `:12760` | repo |
| GM-only narration sections gate on the badge inline | `holonovel/src/index.ts:14099` (boundaries), `:14323` (NPC dispositions), `:14345` (World in Motion); `:14384-14388` (story journal) carries no adjacent guard and is visible wherever the enclosing narrative block renders | repo |
| T416 asserts set/list only | `holonovel/scripts/test-backfill.ts:255-260` | repo |
| T416's specified assertion is the briefing surface | `spec/appendices-reference.md:1865` | repo |
| Coverage register already lists REQ-365 → T416 as `implemented` | `spec/audit/req-coverage.md:334` | tool-output |
| No live cross-reference names the roadmap section outside the register row | `grep "Server-note narrative coupling"` → `spec/audit/review-register.md:1212` (resolved by C3) plus historical entries in `docs/plans/2026-11-09-full-review-p8/aar.md:25` and `docs/plans/2026-11-09-full-review-sweep/worklist.md:2551`, which are records and stay unchanged | repo |

## Decisions

- **D1 — render a dedicated `### Server guidance` section immediately after the
  `### Synthesis` block (`holonovel/src/index.ts:14095`).** REQ-365a's
  "supplementary guidance" names a supplementary-band destination, and REQ-109e
  (`spec/02-requirements.md:1310`) already names supplementary guidance as a
  supplementary group; a sibling section is also how every other
  non-synthesis guidance surface renders (`### Boundaries`, `### Story
  journal`), and sections without a briefing section token are established
  practice. The section is not a REQ-109 group, so REQ-109d's empty-state
  marker rule does not apply to it; it is omitted when empty, like
  `### Boundaries`.
  *Rejected:* reusing the "Supplementary guidance" labelled group inside
  `### Synthesis` — it conflicts with REQ-265b (a ruleset-free Novel with only
  tagged notes would gain a `### Synthesis` section holding no synthesis items),
  and `renderItems` returns before emitting its label when the item list is
  empty (`:14064-14066`), so the group's label would be absent exactly when the
  notes need it.
  *Rejected:* adding a briefing section token (REQ-185/REQ-186) and a REQ-082
  DECISIONS.md mapping — no REQ-109 group is added, and the neighbouring
  non-synthesis sections carry no token.
- **D2 — no normative spec change.** REQ-365a/b/c already state the contract.
  Adding placement prose ("a sibling section after Synthesis") is implementation
  detail the convergence loop would catch, which Appendix M excludes.
- **D3 — gate on the Editor-inclusive GM predicate
  (`badge === "game_master" || badge === "none"`).** It mirrors the
  `server-notes://` resource's own admission (`holonovel/src/index.ts:12756`)
  and the repo's `isGM` convention, satisfies REQ-365c, and keeps GM notebook
  text away from the `observer` badge, which REQ-366d also excludes from
  secrets, faction clocks, countdown positions, and GM context.
  *Rejected:* `badge !== "player"` — it would expose the text to the observer
  badge, which no REQ authorizes.
- **D4 — line shape `- [lore-seed] <content>`, tag underscores rendered as
  hyphens.** REQ-365b's acceptance text and T416 both spell the tags
  `[lore-seed]` / `[session-reminder]`; the stored enum uses underscores.
  Content follows the tag immediately so the REQ-365b substring
  (`[lore-seed] The old gods were banished…`) matches.
  *Rejected:* appending the note key or a provenance suffix — the key is
  already available through `list_server` and `server-notes://<key>`; the extra
  tokens buy nothing REQ-365 asks for.
- **D5 — no per-note count cap; sort by key.** REQ-365a says tagged notes
  "SHALL surface"; a cap would contradict it for the sixth note. Sorting by key
  makes briefing bytes deterministic across restarts (the store is a `Map`
  whose load order follows JSON object order). Length is bounded by REQ-118's
  existing prompt budget, which may truncate the section — accepted, because
  every non-never-truncated section already has that property.

## Change entries

### C1 — render a `### Server guidance` section for tagged server notes (M)

**File:** `holonovel/src/index.ts` (`badge_briefing` builder, immediately after
the synthesis block that ends at `:14095`).

- Add a block guarded by
  `badge === "game_master" || badge === "none"` (D3) that:
  - reads `state.serverNotes`, keeps entries with a `narrative_tag` **and**
    non-empty `content` (`content` is optional in the schema at `:8093`), sorts
    them by key (D5), and renders `- [<tag with `_`→`-`>] <content>` (D4);
  - emits nothing when the filtered list is empty;
  - otherwise appends
    `` briefing += `\n\n### Server guidance\n${lines.join("\n")}` ``.
- Comment cites `REQ-365a — tagged server notes (GM/Editor only); untagged
  notes stay resource-only (REQ-365a/b/c).`
- **No other line of the briefing changes**: the synthesis block
  (`:14059-14095`) is untouched, so REQ-265b and every existing assertion about
  it keep their behaviour.

### C2 — widen T416 to the briefing surface (S)

**File:** `holonovel/scripts/test-backfill.ts` (test at `:255`).

Widen the existing `T334/T416/T285` test into the assertion Appendix F
(`:1865`) specifies:

1. Start on the GM badge explicitly (`set_badge("game_master")`) so the test
   does not depend on the preceding test's badge.
2. `manage_note (action: set_server, key="old-gods", content="The old gods were
   banished to the outer dark", narrative_tag="lore_seed")`.
3. `manage_note (action: set_server, key="dm-reminder", content="Remind players
   about the curse", narrative_tag="session_reminder")`.
4. `manage_note (action: set_server, key="house-rule", content="Criticals
   explode", narrative_tag="house_rules")`.
5. `manage_note (action: set_server, key="bible", content="The curse is
   inherited", narrative_tag="campaign_bible")`.
6. `manage_note (action: set_server, key="blank", content="",
   narrative_tag="lore_seed")` — the empty-content guard.
7. `manage_note (action: set_server, key="untagged", content="Unfiled GM
   scribble", narrative_tag omitted)`.
8. `getPrompt(proc, "badge_briefing", {})` — assert it contains
   `[lore-seed] The old gods were banished`, `[session-reminder] Remind players
   about the curse`, `[house-rules]`, and `[campaign-bible]`; assert it does
   **not** contain `Unfiled GM scribble` and carries no empty bullet
   (`- []` absent).
9. `set_badge("player")` → assert the briefing contains neither
   `[lore-seed]` nor `Unfiled GM scribble`; `set_badge("game_master")` to
   restore.
10. `remove_server` all six notes (cleanup).

**Note:** server notes are server-scoped and survive Novel end (REQ-285a), so a
note left behind leaks into every later briefing in the process — cleanup is
part of the assertion, not tidying.

### C3 — review-register disposition (S)

**File:** `spec/audit/review-register.md`.

Move F-P8-1 out of `## Scheduled-roadmap` (`:1205`) into `## Resolved`
(entry text below `:12`), rewritten to the resolved form used by neighbouring
entries: what changed, the predicate (`holonovel/src/index.ts:<line>`,
`badge === "game_master" || badge === "none"` plus the tagged-note filter), and
the exercising harness (`test:backfill` T416). Keep F-P8-2 in place.

### C4 — retire the roadmap section (S)

**File:** `ROADMAP.md` — delete `## Server-note narrative coupling (P1)`
(`:15-23`). Its trigger names F-P8-1 `Resolved` as the close condition; C1–C3
meet it. `npm run check-roadmap` must still pass (no orphaned cross-reference).

### C5 — CHANGELOG entry (S)

**File:** `CHANGELOG.md` — new heading at the top:
`## 2026-11-09 — Server-note narrative coupling (REQ-365a/b/c remediation)`,
with bullets for the rendered surface, the widened T416 assertion, and the
retired roadmap entry. `session:close` derives the commit subject from the top
heading, and the gate pins the date to the package version date
(`package.json` 2026.11.09); if the CalVer advances before this increment
commits, the heading date must advance with it (`npm run status` prints the
version).

### C6 — DECISIONS.md placement note (S)

**File:** `holonovel/DECISIONS.md` — three lines recording D1/D3: tagged server
notes render as a `### Server guidance` section after `### Synthesis`, on the
GM/Editor badge, with no dedicated section token; the requirement the section
serves is REQ-365a. Place it under the existing briefing/decisions area
(implementer picks the section that already carries the REQ-082 briefing notes).

### C7 — coverage register refresh (S, conditional)

**File:** `spec/audit/req-coverage.md`.

Run `npm run validate -- --write-register` and stage the register only if it
changes. The REQ-365 row already names T416 and reads `implemented`
(`:334`), so no change is expected; the step exists because widening the
assertion in C2 is what makes that row's claim true, and the freshness check
inside `validate` runs unconditionally.

### C8 — increment record (S)

**File:** `docs/plans/2026-11-09-server-note-narrative-coupling/` —
`plan.md` (this file), `tasks.md`, and `aar.md`. `check-loop-artifacts` gates
the trio, and the AAR ends in `LOOP PAUSED` or `LOOP OPEN`.

## Blast radius

| Path | Entry | Size |
|---|---|---|
| `holonovel/src/index.ts` | C1 | M |
| `holonovel/scripts/test-backfill.ts` | C2 | S |
| `spec/audit/review-register.md` | C3 | S |
| `ROADMAP.md` | C4 | S |
| `CHANGELOG.md` | C5 | S |
| `holonovel/DECISIONS.md` | C6 | S |
| `spec/audit/req-coverage.md` | C7 (conditional) | S |
| `docs/plans/2026-11-09-server-note-narrative-coupling/` | `plan.md`, `tasks.md`, `aar.md` — the increment record, committed with the change | S |

Not touched: `spec/02-requirements.md` (D2), `holonovel/src/core/state.ts` (the
store already carries the tag), tool schemas and descriptions
(`manage_note`'s `narrative_tag` description is accurate at `:8095`), the
`server-notes://` resource, `spec_health.server_notes`.

## Edge cases and mitigations

1. **Ruleset-free briefing gains a section.** With tagged notes and no
   synthesis, the briefing now carries `### Server guidance` and still no
   `### Synthesis` section (REQ-265b untouched). No harness asserts the absence
   of either (`grep` of `holonovel/scripts` shows only
   `assertContains(on, "### Synthesis")` at `test-backfill.ts:857`, inside a
   synthesis-enabled branch); C2's assertions are the new cover.
2. **Prompt budget truncation.** A large briefing can drop the section
   (REQ-118). Accepted (D5); the test fixture is a small Novel.
3. **`content` is optional in the tool schema** (`holonovel/src/index.ts:8093`).
   Skip entries with empty/undefined content so the briefing never prints
   `undefined`.
4. **Server-level persistence across Novels and tests.** Mitigated by C2's
   cleanup step; the store also survives `manage_novel (action: end)`
   (REQ-285a), so nothing in C1 may assume a Novel-owned lifecycle.
5. **Tag enum drift.** Render from the stored string rather than a hardcoded
   map, so a future enum addition surfaces without a code change; the enum
   itself stays validated by the schema at `:8095`.
6. **Player and observer leakage.** C2 step 7 is the regression fence for
   REQ-365c; D3's predicate is the fence for the observer badge (REQ-366d).
7. **Empty notes.** `set_server` can store an empty string; the non-empty filter
   keeps a blank bullet out of the briefing.
8. **Rollback.** Deleting the C1 block restores the prior briefing exactly;
   C2–C6 are documentation and test edits with no runtime effect.

## Verification

| Step | Command | Expectation |
|---|---|---|
| Type check | `npm run typecheck` | 0 errors |
| Harness | `cd holonovel && npm run test:backfill` | all pass, T416 exercised |
| Fast gate | `npm run check:fast` | 37 passed, 0 failed, `check:fast: PASS` (unpiped) |
| Roadmap gate | `npm run check-roadmap` | pass with the section removed |
| Register gate | `npm run check-registers` | pass with F-P8-1 moved |
| Coverage | `npm run validate -- --write-register` | stage `spec/audit/req-coverage.md` only if it changes; the REQ-365 row already names T416 (`:334`) |
| Full gate (pre-push) | `npm run check` | 0 errors |
| Session close | `npm run session:close` | one spec increment commit, AAR verified |

No spec-source edit means `npm run assemble` changes nothing (`spec/audit/`
is not an assemble input; `scripts/assemble.ts` has no `audit` reference) — run
it only if a step touches `spec/0*.md`. `spec-update-record` sees no spec
*delta* and is expected to no-op — confirm, do not force.

## Commit order

One spec increment, one commit via `npm run session:close`: C1–C6, the
generated register if it moves (C7), and this directory's `plan.md`/`tasks.md`/
`aar.md`. Gate per commit: `check:fast: PASS` unpiped.

## Done bar

**Done bar:** this increment only. Met when all five hold:

1. A GM-badge `badge_briefing` renders `[lore-seed] The old gods…`,
   `[session-reminder] …`, and `[house-rules] …` for tagged server notes, and
   omits untagged notes.
2. The Player badge briefing contains neither tagged nor untagged server-note
   content.
3. T416 carries the assertions of Appendix F `:1865` (all four tag values,
   untagged omission, Player absence) and `npm run check:fast` passes unpiped.
4. F-P8-1 reads `Resolved` and the ROADMAP section is gone; `check-roadmap` and
   `check-registers` pass.
5. The increment is committed as one spec increment with a CHANGELOG heading.

Anything else surfaced by the build is scheduled, not chased.

## Unknowns

- Whether `check:fast` was green at HEAD before this planning session started —
  it was measured green in this session with only this untracked plan directory
  present, which is the operative baseline. The cold reviewer could not confirm
  it independently.
- The historical records naming the roadmap section
  (`docs/plans/2026-11-09-full-review-p8/aar.md:25`,
  `docs/plans/2026-11-09-full-review-sweep/worklist.md:2551`) are session
  history and intentionally left unchanged; whether any future audit script
  greps them is unknown, but no gate reads them today (`check-roadmap` reads
  `ROADMAP.md` only, `check-registers` reads `spec/audit/review-register.md`).
