# Plan — Torre player-facing knowledge depth (roadmap P3)

Session 2026-11-08. Base HEAD `a30bfdf` (clean tree). Gate depth: standard
(multi-file, one generated artifact, one pinned harness count; rollback cost 1).
This plan is a draft: `docs/plans/2026-11-08-torre-knowledge-depth/` is created
at execution time, because an increment directory without `aar.md` fails
`check-loop-artifacts` in `check:fast`.

## Questions (user's words)

"Draft plan for next roadmap item." `npm run status` reports two open items,
both P3:

1. Torre player-facing knowledge depth — add two or three pages (the tower's
   origin, the survivors' bargain, the matches) or mark lore entries
   `player_discovered` with a page-reveal path (REQ-083d, REQ-565).
2. Survivor race clock — decide descriptive vs. mechanical (REQ-233).

This plan takes item 1, the first in roadmap order. Item 2 is untouched and
keeps its trigger.

## Trigger status

Item 1's trigger is "after the seven current pages have been played through and
exploration still feels thin." No playtest evidence exists in this session and
none of the repository's gates can produce it: `check-playability` asserts goal
reachability, soft-lock absence, countdown validity, encounter survivability,
and economy viability (`holonovel/scripts/playability.ts` header) — it measures
structure, not whether exploration feels thin. The trigger is therefore a
maintainer judgment, recorded as condition C-1.

## Baseline (measured this session)

- `git log --oneline -1` → `a30bfdf`; `git status --porcelain` empty.
- Root `npm run check:fast` → 37 passed / 0 failed, trailing `check:fast: PASS`.
- `npm run status` → 2 open roadmap items; 13 unpushed commits; version
  `2026.11.08`; last publish 2026-11-07T20:30Z. Publication is a separate
  authorized step (`./scripts/push-pipeline.sh`), not part of this plan.
- Starter source counts (enumerated from `world.things` / `lore` with a
  `node -e` pass): 32 things, of which 7 are `page — …`; 17 lore entries, none
  carrying `visibility`; 3 GM secrets. Local date is 2026-11-08, so the
  CHANGELOG heading and `session:close`'s default date agree.

## Findings

| ID | Severity | Finding | Predicate (file:line) |
|---|---|---|---|
| K-1 | Major | The Player's whole knowledge surface is one ~30-word fragment per floor; the 17 lore entries are GM-only. This is the thinness the roadmap item names. | `holonovel/content/torre-nosferatu.source.json` `world.things` (32 entries, 7 `page — …`) and `lore` (17 keys, none with `visibility`). |
| K-2 | Minor | The Holosuite novel tier pins the starter's thing count, so a page addition fails the tier until the pin moves. | `holonovel/scripts/lib/holosuite-novel.ts:185` (`["things", …, 32, "REQ-565"]`). |
| K-3 | Minor | The starter harness pins rooms (94) and hazard counts but has no page-surface assertion, so fragment depth can regress silently. | `holonovel/scripts/test-starter-novel.ts:160` (`rooms … === 94`); the file contains no `Page —` assertion. |

K-1 is the roadmap item's own evidence (already registered as
`Scheduled-roadmap`); K-2 and K-3 are consequences of fixing it.

## Decisions

- **D1 — Content-only pages; no reveal path.** Add three readable fragments.
  Rejected: marking lore `player_discovered` "with a page-reveal path" — there
  is no content→lore reveal mechanism today (`manage_lore (action: reveal)` is
  a GM mutation, `holonovel/src/index.ts:6815-6828`), so that option needs a
  thing→lore binding, a read-path reveal, a new REQ, a §7.7 coupling row, T-row
  coverage, and fingerprint regeneration. That is a server-behavior increment,
  not the P3 content polish this item asks for. Pages are the low-blast-radius
  half of the roadmap's own "or".
- **D2 — Three pages, one per chosen floor, each earning its place.**
  `the tower's origin` (Seventh Floor — Teaching Nest), `the bargain`
  (Second Floor — Social Hall), `the matches` (Fifth Floor — Wax Refill). Each
  voices the system that floor already carries — the framing at the top, the
  Survivors' trade where they deal, the wax economy where wax is spent — which
  is the roadmap's "unless the added pages earn their place". Rejected: three
  fragments on one floor (breaks the one-per-floor rhythm without earning it).
- **D3 — No new secrets or lore entries.** The pages stay Player-visible flavor.
  New GM secrets would deepen GM machinery, not the Player's knowledge, and
  would add a `secrets` count pin. Rejected.
- **D4 — Regenerate the artifact last.** The prior increment's F3 ordering rule
  applies: `build:starter-novel` stamps `data_format` from the generated
  fingerprints and `spec_version` from the package (`holonovel/scripts/lib/
  starter-novel.ts:45-53`), so it runs after any regeneration. The artifact also
  copies the pages into `pending_workflow.snapshot.state` via
  `deriveOpeningSnapshot`; the diff shows each page twice — expected, not drift.
- **D5 — Move the Holosuite pin in the same change** (32 → 35). It is a
  structural expectation of the shipped Novel, not a review finding.
- **D6 — Register coupling.** Shipping the item removes its `ROADMAP.md`
  section and moves the matching `## Scheduled-roadmap` row to `## Resolved`.
  `check-registers` validates only Scheduled-roadmap rows against `ROADMAP.md`
  (`scripts/lib/register-checks.ts:64-68`), so the row must move in the same
  increment or the gate fails.
- **D7 — No spec-source change.** No REQ, table, or appendix row moves; the
  review register is the only `spec/` file touched. `npm run assemble` is a
  no-op check, and `session:close` still classifies the session as a spec
  increment (any `spec/` path, `scripts/lib/commit-plan.ts:36-39`) — one commit.

## Blast radius

| File | Phase | Change | Size |
|---|---|---|---|
| `holonovel/content/torre-nosferatu.source.json` | 1 | Three `world.things` page entries (full property set copied from an existing page) | S |
| `holonovel/content/torre-nosferatu.json` | 2 | Regenerated by `build:starter-novel`; pages appear in `world.things` and the opening snapshot | M |
| `holonovel/scripts/test-starter-novel.ts` | 2 | Page-surface assertions (count, readable, `read_text`, seven floors) | S |
| `holonovel/scripts/lib/holosuite-novel.ts` | 2 | `things` pin 32 → 35 (`:185`) | S |
| `ROADMAP.md` | 3 | Remove the "Torre player-facing knowledge depth" section (`:15-24`) | S |
| `spec/audit/review-register.md` | 3 | Scheduled-roadmap row → Resolved with date and evidence (`:950-953`) | S |
| `CHANGELOG.md` | 3 | One dated entry, top of file | S |
| `docs/plans/2026-11-08-torre-knowledge-depth/plan.md`, `tasks.md`, `aar.md` | all | Increment artifacts, AAR ending in a LOOP token | S |

Not touched: `spec/02-requirements.md`, `spec/appendices-reference.md`,
`holonovel.md`, `holonovel/holonovel.md`, tool definitions, surface baseline,
coverage register, README markers, contract fingerprints. No new tool, action,
persisted surface, or behavioral config.

## Phase 0 — Trigger confirmation (condition C-1)

1. Read the seven `read_text` fragments and enumerate the Player-visible
   knowledge surface (7 pages, 17 GM-only lore, 3 GM secrets).
2. Confirm with the maintainer that the seven pages have been played and
   exploration still reads thin. If not confirmed, stop: leave `ROADMAP.md` and
   the register unchanged, record the finding, and close the session with no
   content change.

## Phase 1 — Author the three pages (K-1, D2)

1. Append three entries to `world.things` in
   `holonovel/content/torre-nosferatu.source.json`, copying the field set of an
   existing page (`kind: "thing"`, `portable: true`, `readable: true`,
   `read_text`, all other booleans `false`, `annotations: {}`):

   | Key | Name | Location | Description |
   |---|---|---|---|
   | `page — the tower's origin` | `Page — The Tower's Origin` | Seventh Floor — Teaching Nest | A torn page in a nest of old lessons. |
   | `page — the bargain` | `Page — The Bargain` | Second Floor — Social Hall | A torn page on a social hall table, left where the bargaining stopped. |
   | `page — the matches` | `Page — The Matches` | Fifth Floor — Wax Refill | A torn page among the wax, folded once and not unfolded since. |

2. Author `read_text` in the established voice (quoted first person, ellipsis
   open and close, ~30 words), each consistent with the lore it echoes
   (`the-tower`, `the-survivors`, `resources`):
   - origin: "…it was not built. It was here before the first of us woke with a
     candle and no name, and it will be here when the last of us is out of wax.
     We are not prisoners. We are the rent."
   - bargain: "…there is no bargain. That is the bargain. Your wax buys you the
     next room, and my wax buys you nothing at all, and we both keep paying. We
     are not five friends. We are five prices, and the tower is buying."
   - matches: "…a match is not light. It is one more chance, and you only ever
     get the one. Spend it on yourself or spend it on a stranger — the tower
     does not care which. It only counts."
3. Confirm each `location` resolves to an existing room name and that no
   existing thing name collides (names must stay unique; the Holosuite indexes
   things by name).

## Phase 2 — Harnesses and artifact (K-2, K-3, D4, D5)

1. `holonovel/scripts/test-starter-novel.ts`: inside the world-content test
   (`:164-208`) assert the page surface — exactly 10 things named `Page — …`,
   every one `readable` with non-empty `read_text`, every one placed in an
   existing room by name, and all seven floors represented.
2. `holonovel/scripts/lib/holosuite-novel.ts:185`: `things` expected 32 → 35.
3. `cd holonovel && npm run build:starter-novel`; review the diff — it must be
   confined to the three pages in `world.things` and their copy in
   `pending_workflow.snapshot.state`.

**Verification:** `cd holonovel && npm run test:starter-novel && npm run
test:holosuite-novel && npm run test:output-contracts && npm run test:all`;
root `npm run check-playability`, `npm run check-starter-freshness`.

## Phase 3 — Registers, changelog, AAR (D6, D7)

1. `ROADMAP.md`: delete the "Torre player-facing knowledge depth" section.
2. `spec/audit/review-register.md`: move the seven-pages row to `## Resolved`,
   citing the source predicate and the new count.
3. `CHANGELOG.md`: one dated entry at the top (2026-11-08) describing the three
   fragments and the moved pins.
4. Write `plan.md`, `tasks.md`, and `aar.md` under
   `docs/plans/2026-11-08-torre-knowledge-depth/`; the AAR records measured
   evidence and ends in `LOOP PAUSED` or `LOOP OPEN`.

**Verification:** root `npm run assemble && npm run check:fast`; `npm run
build-order`.

## Done bar

**Done bar:** the starter carries 10 readable `Page — …` fragments across all seven floors, with the three new fragments voiced to their floors; `test:starter-novel` asserts the page surface and the Holosuite novel tier's thing pin is 35; the ROADMAP section is removed and its Scheduled-roadmap row is Resolved; the regenerated starter artifact and the dated CHANGELOG entry are in the tree; `test:starter-novel`, `test:holosuite-novel`, `test:output-contracts`, `npm run test:all`, `check-playability`, `check-starter-freshness`, root `check:fast`, and `build-order` pass; the increment lands as one commit with plan/tasks/AAR and a terminal LOOP token; nothing is pushed.

## Commit order and gates

One commit: the session touches `spec/` (`spec/audit/review-register.md`), so
`session:close` classifies it as a spec increment and refuses to split it.

1. Phase 1 and 2 changes are staged together; `npm run session:close` runs the
   fast suite, verifies the AAR, and commits with the top CHANGELOG heading.
2. Publication is out of scope; `./scripts/push-pipeline.sh` is a separate
   authorized step.

## User impact

- A fresh data directory seeds the expanded starter (REQ-565 seeds once);
  existing data directories and running campaigns are unaffected.
- The packaged artifact changes, so a server restart is needed to pick it up in
  the deployed instance. No API, schema, tool, or configuration change; no
  migration; nothing destructive.

## Risks and rollback

- **Holosuite count pin (K-2)** — the novel tier fails loudly if the pin and the
  content disagree; fixed in Phase 2 before the gate run.
- **Walkthrough interference** — the tier walks key rooms, wax refills, and
  grand stairs and resolves `take` by name; the new pages sit in non-hazard
  rooms and are inert. `test:holosuite-novel` and `test:starter-novel` are the
  probes.
- **Freshness drift** — `check-starter-freshness` fails when the committed
  artifact does not match a rebuild; regenerate in Phase 2.
- **Voice drift** — the three fragments are checked against `the-tower`,
  `the-survivors`, and `resources` in Phase 1; a contradiction is a content
  edit, not a spec change.
- **Rollback** — reversible edits (cost 1): `git checkout -- holonovel/content
  ROADMAP.md spec/audit/review-register.md`; nothing is destructive.

## Conditions

- **C-1** — If the trigger is not confirmed at Phase 0, stop before Phase 1 and
  leave `ROADMAP.md` unchanged; only the confirmation finding is recorded.
- **C-2** — If any other harness pins the starter's thing count or page list,
  move that pin in Phase 2 rather than weakening the assertion; the enumeration
  in Phase 2 step 1 is the check.
