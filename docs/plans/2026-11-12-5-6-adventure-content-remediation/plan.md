# Plan — §5.6 adventure content remediation

Status: reviewed (one cold pass + one diff re-review; C-1 open) · Kind: planned · Depth: standard
Increment target: `docs/plans/2026-11-12-5-6-adventure-content-remediation/`
Rollback cost: 1 (server source, one generated artifact, two fixtures, one gate,
registers; reversible in one commit)
Evidence class: repo only (no web, no user-supplied content)

## 1. Objective

Take the top open `ROADMAP.md` section — **§5.6 adventure content remediation
(P1)** — and close its twelve findings, F-P3B3-1 through F-P3B3-12
(`spec/audit/review-register.md:2059-2124`). The REQs already state the
contracts (REQ-079a–j2, REQ-132a–e, REQ-170, REQ-171, REQ-172, REQ-229a–d,
REQ-247, REQ-248, REQ-249, REQ-250, REQ-292). The server, its build artifacts,
and its harness are narrower than the spec. This is an
implementation-and-assertion increment, not a spec-design change.

Baseline (this session, before any edit):

- `npm run status`: version `2026.11.12`, 59 unpushed commits, 11 open roadmap
  items, last publish `2026-11-09`. Publication is **out of scope** (§8).
- `git status --short`: clean.
- `npm run check:fast`: 40 passed, 0 failed, `check:fast: PASS`.
- The `manage_adventure` handler is `index.ts:10981-11221`; the adventure
  resources are `:11226-11273`; `spec_health` is `:13230-13233`;
  `adventureDirs`/`adventureFiles` are `:2807-2836`.

| Finding | Predicate (current, symbol-anchored) | Contract |
|---|---|---|
| F-P3B3-1 | `load` is `requireGM(); const novel = requireNovel();` and never reads `args.target` (`index.ts:11110-11113`); `target` is declared for `generate` only (`:10987`) | REQ-079h, REQ-079i |
| F-P3B3-2 | `load` derives `adventure_index` from heading/bold regexes (`:11129-11141`) and creates no NPC entity, faction, or lore entry; `badge_briefing` renders only the waypoint block (`:15340-15346`), no hook or room block | REQ-079c, REQ-079f, REQ-292d |
| F-P3B3-3 | `manage_ruleset (action: search)` queries only `rulesets.search` and returns `NOT_FOUND` when ruleset hits are empty (`:12176-12201`); no adventure prose, confidence tier, active-first sort, or `[generated]` tag | REQ-079b, REQ-079e, REQ-132a, REQ-132c |
| F-P3B3-4 | Only `adventure://{slug}/overview` and `/navigation` are registered (`:11245`, `:11258`); no per-anchor prose resource | REQ-079e |
| F-P3B3-5 | `indexed_adventures` is GM-only, emits one `"adventure-scaffold"` marker, and carries no hash or slug set (`:13230`); no `[malformed-adventure]` or `[adventure-drift]` literal in `holonovel/src`; no startup comparison | REQ-170, REQ-171b, REQ-172 |
| F-P3B3-6 | The genre filter is bypassed for the GM (`:11216`); the Player filter tests a non-empty preview (`:11217`), not REQ-292b's `player_visible`/shared-hook rule | REQ-292b |
| F-P3B3-7 | Overview lists NPC/location names only and hides factions from the Player rather than filtering per marker (`:11252`); navigation has no anchors and no GM filter (`:11265-11272`); `[STATE_CONFLICT]` tests Novel absence (`:11247`, `:11260`), not adventure absence | REQ-248a, REQ-249a, REQ-250c |
| F-P3B3-8 | `isTransition` derives only from a `scene_description` change (`:6889`); the waypoint branch (`:6920-6926`) neither sets it nor fires the hook | REQ-250b |
| F-P3B3-9 | `load` sets `novel.generated_adventure = null` on every branch (`:11157`, `:11167`, `:11186`); `generate` emits no `## World` section (`scaffold` at `:11026-11032`) | REQ-132b, REQ-132c, REQ-132d |
| F-P3B3-10 | The augmentation is voice/lore counting only, on the World path (`:11177-11185`); no encounter/theme matching, no ruleset-native activation, no omission branch; the community line reads `inert — activate with`, not REQ-229c's wording | REQ-229a, REQ-229b, REQ-229c, REQ-229d |
| F-P3B3-11 | T59/T60/T61/T206/T287/T368/T209/T283 appear in no `holonovel/scripts` harness (`grep -rn` over `scripts/*.ts`); T284 (`test-output-contracts.ts:1162`) asserts a fast-forward audit entry; T305 (`:1178`) asserts the augmentation line only; T338 (`:1151`) the empty state and count only; T146 (`:1137`) overview/navigation only | REQ-079, REQ-172, REQ-247, REQ-250c, REQ-229d, REQ-292, REQ-132e |
| F-P3B3-12 | `[NOT_FOUND]` enumerates `adventureDirs()`, not slugs (`:11114`); `TTRPG_ADVENTURE` is unread and only `TTRPG_ADVENTURE_DIR` is (`:2808`); no `lookup_monster` fuzzy suggestion | REQ-079d, REQ-079g |

Two related defects are fixed in passing because the same lines move: the
`manage_adventure` description claims "load and list are read-only"
(`:10983`) although `load` mutates, and `load` takes no `novelSnapshot`, so
pre-populated entities would be un-undoable.

Out of scope: every other `ROADMAP.md` section, the P2 sweeps, and the
`§5.6` F-P3B1/B2/B4 families.

## 2. Done bar

**Done bar:** all twelve findings are `Resolved` in
`spec/audit/review-register.md` with current predicates; the ROADMAP section is
removed; every new assertion was observed red before its fix (the build-artifact
assertions included) and the transcripts are in `aar.md`;
`npm --prefix holonovel run test:adventure`, `:test-output-contracts`,
`:test-briefing`, `:test-backfill`, `:test-narrative`, and `:test-pattern-buffer`
pass; `npm run typecheck` (root and server), `npm run check:fast`, and the full
`npm run check` (via `build-order`) are green; `npm run check-adventure-index`
and `npm run check-gate-table` pass; the coverage register is regenerated and
REQ-079/132/170/229/248/249/250/292 stay bucket C while REQ-171/172/247 stay
bucket E because `scripts/validate.ts` records an REQ-454 disposition for each
(the index and drift are builder-side; the server only reads the build
artifact); `surface-budget --write` and the DECISIONS action/token counts agree
with the new footprint; no new tool or action is added;
`spec_health.indexed_adventures` keeps its field name; no new §7.7 property
group is introduced (generated-world tracking lives inside the existing
`generated_adventure` payload); `aar.md` ends `LOOP PAUSED` with zero new action
items.

Sizing note: this is at the upper bound of a one-session increment. If the
session cap is hit after Phase 5, the completed findings commit, the ROADMAP
section stays open with F-P3B3-1…N moved to `Resolved`, and `aar.md` records
the partial pass. The plan never claims a finding resolved without its green
assertion.

Current values the edit must respect:

- `spec/02-requirements.md` bodies: no body edit at all. The only spec-file
  edit is `spec/audit/review-register.md`, `spec/audit/req-coverage.md`
  (regenerated), and `holonovel/DECISIONS.md` (generated table + notes).
- `holonovel/src/index.ts` is source, not a fingerprinted spec section; the
  section-fingerprint set (§5.9, §5.16–5.17, §6.3, §6.4.2, §7.7, §5.19,
  Appendix Q) is untouched, so `check-fingerprint-sync` stays green. The
  tool-description edit does move `holonovel/tool-definitions.json`, which is
  regenerated (Phase 7) and gated by `check-tool-definitions-sync`.
- The new gate is `check-adventure-index`; it is added to
  `scripts/lib/gate-manifest.ts` (fast and full) and the AGENTS gate table is
  regenerated from the manifest, because `check-gate-table` compares them.
- `holonovel/package.json` `files` gains `adventures` so the shipped modules
  travel with the package; `holonovel/adventures/` is not gitignored
  (`git check-ignore` returns nothing) and `check-reference-server-cleanliness`
  does not classify an adventure module as a build asset or a package triple.

## 3. Design decisions

**D1 — one structural extractor, shared by every surface (F-P3B3-2, -4, -7).**
A new pure module `holonovel/src/core/adventure.ts` exports
`extractAdventureStructure(content: string, slug: string): AdventureStructure`
with `{ premise, hooks, overview, preview, player_visible, toc, locations,
npcs, factions, sections, malformed }`. Headings are walked once; anchors come
from `deriveAnchor` (`src/core/anchors.ts:9`) with a per-file `Set` so GFM
`-1` suffixes are deterministic. `gm_only` is true when the heading (or its
line) carries an emphasis marker whose text ends in `only` under `*` or `_`
— §7.1's role-scoping rule — which covers `*Keeper only*`, `_GM only_`, and a
ruleset-specific adjudicator term without a ruleset lookup. NPC extraction
keeps REQ-247b1's shape (bolded name + numeric stat, role noun, or page
reference), records a `confidence` and a one-line `role` (first sentence after
the name, else the matched noun), and puts unparseable values in a `notes`
field. Faction extraction keeps REQ-247b2's organization-term + goal/resource
rule. `sections` holds the raw body per top-level heading, which the per-anchor
resource, overview, navigation, search, and pre-population all read instead of
re-parsing. The extractor replaces every inline regex in
`manage_adventure`, `adventures://`, and the two adventure resources. Rejected
alternative: keep the regexes and add a second parser for the resource — the
surfaces would drift again, which is exactly the finding.

**D2 — `load` gains `target` and a real codex path (F-P3B3-1).** The
`manage_adventure` schema gains `target` for `load` as well as `generate`, but
the enum is action-scoped at the handler: `load` accepts `novel` or `codex`
(`both` is rejected with `[INVALID_INPUT]` naming the two valid values).
`requireGM()` stays first and unconditional. The default is `novel` when a
Novel is active and `codex` otherwise (REQ-079i). The codex branch never calls
`requireNovel()`: it runs the extractor, builds the Appendix O.10 payload
(`title, slug, premise, overview, hook, locations[{heading, flavor_text}],
npc_suggestions, encounter_seeds, genre_tags, sections`), and writes
`state.codex` entry `adventure_<slug>` with `kind: "adventure"`,
`source: "loaded:<slug>"`, a preserved `imported_at`, a fresh
`codex_modified_at`, and `state.saveCodex()`. The response names the entry id,
the counts, and the `adventure://<slug>/overview` pointer, and the audit entry
carries `target: "codex"`. No Novel state is read or written. The novel branch
is D3. `manage_codex (action: get)` then returns the payload and T368's restart
assertion passes because the codex file is already atomic (REQ-285a).

**D3 — pre-population from the structural index (F-P3B3-2, -12).** The novel
branch wraps the whole load in `novelSnapshot()` (the first time `load` is
undoable) and then, after the world model is final:

- **NPCs** — one `novel.npcs` entity per extracted NPC:
  `id: npc_<slug>_<n>`, `{ name, description: role + notes, disposition:
  "neutral", location: first location, conditions: [], condition_rounds: {} }`.
  No stats are written, so REQ-079d's skeletal path is literal; combat's
  `[auto]` turn path already handles a statless NPC. A case-insensitive name
  already present in `novel.npcs` or `novel.entities` is skipped with
  `Skipped duplicate NPC '<name>'.`
- **Lore** — one entry per extracted location whose heading carries prose,
  keyed by the article-free heading name, `triggers: [name]`,
  `badge_scope: gm_only ? "game_master" : "shared"`, `visibility` matching,
  `priority: 0`, `sticky: 0`, `sticky_remaining: 0`, `enabled: true`,
  `known_by: []`. Existing keys are skipped with a note (REQ-079d).
- **Factions** — one `novel.factions` entry per extracted faction:
  `{ id: faction_<slug>_<n>, name, description, goals: [...], resources: "",
  clock: 0, clock_max: 4, status: "active" }`. Duplicates skip by name.
- **Hook** — the extracted premise becomes `adventure_index.hooks[0]` and the
  `badge_briefing` hook (D4).
- **Suggestions** — for each created NPC, when a ruleset is bound, search its
  index (`rulesets.search(slug, name, 5)`); a hit whose normalized name or
  name tokens overlap the NPC name appends
  `NPC '<name>' may match ruleset entry '<clear name>'. Confirm to populate stats.`
- **Response** — one summary line `Pre-populated: N NPCs, M lore entries,
  K factions.` plus each skip/suggestion line, then the provenance and hazard
  notes that already exist.

**D4 — the briefing gains an indexed and a generated adventure block
(F-P3B3-2, -7, -9).** In `composeBadgeBriefing`, after the waypoint block
(`:15340`), render `## Adventure` when an indexed adventure is active: the
hook; when no hook exists the GM sees the overview line and the Player sees no
adventure block at all, then
`**Current location:** <waypoint or scene location>`, then, when a world model
exists and the location resolves to a room, `**Room:** <name> — <visible
things>` built from `novel.world.rooms`/`things`. Sections whose `gm_only` is
true are omitted for Player and Observer. When `novel.generated_adventure`
exists, a second `## Generated Adventure` block follows the indexed block
(REQ-132c's ordering). This is additive to the existing waypoint block, which
keeps REQ-250a's label wording unchanged.

**D5 — adventure prose joins ruleset search (F-P3B3-3).** A helper
`searchAdventureProse(novel, query, max)` returns
`{ slug, anchor, heading, snippet, confidence, generated }`. Indexed results
read the active module's file (mtime-cached), generated results read
`novel.generated_adventure`. A query token in the heading is `HIGH`; a token in
the body is `MEDIUM` (`MEDIUM` only when no heading match) (REQ-079e). The
`manage_ruleset (action: search)` branch merges the two lists: every
active-adventure hit sorts before every ruleset hit; within the adventure set,
`HIGH` before `MEDIUM`, then document order. The rendered line begins
`[HIGH] adventure://<slug>/<anchor> — <heading>: <snippet>` and appends
` [generated]` for generated content. `[generated]` is a tag only and never a
sort key (REQ-079f, REQ-132c). Each indexed adventure result also carries
REQ-280's `source_anchor` (`{ file, heading, lines }`) beside its snippet,
because REQ-280 binds `manage_ruleset (action: search)`'s every result;
generated results carry `{ source: "generated", heading }` instead of a file
anchor, because they have no source file. Control flow: ruleset hits 0 but adventure hits
> 0 returns the adventure hits instead of `NOT_FOUND`; no ruleset installed but
adventure hits > 0 returns them before the existing guidance; no hits at all
keeps the current text. `max_results` bounds the merged list and the existing
`searchMaxTokens()` budget still truncates with a resource pointer.

**D6 — one per-anchor template, registered last (F-P3B3-4).** Add
`adventure://{slug}/{anchor}` after the two specific templates. The MCP SDK
matches templates in registration order and first match wins
(`node_modules/@modelcontextprotocol/sdk/dist/esm/server/mcp.js:441-449`), so
`/overview` and `/navigation` keep their handlers and every other anchor reaches
the new one. The handler resolves `slug` against the active indexed module
(read from file) or `generated`, resolves `anchor` against the extractor's
`toc`, and returns the section body as Markdown. For `slug === "generated"`,
the anchor map is derived from `novel.generated_adventure`:
`overview`, `hook`, `world`, plus `location-<n>` for each generated location
(REQ-132a, T146's `/generated/hook`). Unknown slug →
`[ERROR] [STATE_CONFLICT]` naming the active slug; unknown anchor → `[WARNING]`
naming the available anchors; a GM-only section read by Player or Observer →
`[ERROR] [FORBIDDEN]` naming the section, with no body (T59). This raises the
documented resource-template count from 21 to 22 in `holonovel/AGENTS.md`;
`check-tool-surface` reads only the tool artifacts, so it is unaffected, while
`surface-budget` also reads the DECISIONS budget lines and is refreshed in
Phase 7 (D12/Phase 7). Rejected alternative: register a bare
`adventure://{slug}/{anchor}` template and drop the two specific ones. The bare
template cannot render `/overview` without duplicating the two handlers, and
removing them would change two documented resource names the tests read.

**D7 — the catalog filter and visibility rule are badge-independent
(F-P3B3-6).** `filter` applies for every badge (delete `|| isGM`). An entry is
Player-visible when the module carries a `<!-- player_visible: true -->` marker
line **or** it has a non-empty `## Adventure Hook` (Appendix K makes the hook
player-visible by definition). The marker is a standalone HTML comment outside
the `---` provenance block, parsed by the extractor and stripped from served
prose. It is deliberately **not** a new provenance key: `parseAdventureProvenance`
rejects the whole block on an unknown key (`src/core/adventure-provenance.ts:15,42-44`),
which would silently disable signature verification and drop the flag on
bundle export (`buildEmbeddedProvenanceBlock`, `index.ts:11314`). REQ-292b names
the flag but not its carrier; the DECISIONS note records the marker rule. A
module with neither the marker nor a hook is omitted for Player and Observer,
complete for the GM. The `adventures://` resource applies
the same rule for its hook and title rows (REQ-170's badge gating). The catalog
derives `preview` from `## Preview` and falls back to the first two sentences
of `## Adventure Hook` prefixed `[derived]` (Appendix K), replacing the current
30-word slice. Rejected alternative: treat every module as Player-visible and
filter only the hook — a module whose only content is GM-facing would appear
empty in the Player catalog, which is the defect the finding names.

**D8 — the resource contracts are rendered from the extractor
(F-P3B3-7).** Overview: premise, then `- <name> — <role>` per NPC, `- <name> —
<description>` per location, faction lines, scene count. Player drops every
`gm_only` row; the premise and shared rows stay. Navigation: one line per
scene, `- [→] <name> (#<anchor>) (prev: …) (next: …)`, GM-only rows omitted for
Player. Both return `[ERROR] [STATE_CONFLICT]` when **no adventure is active**
(Novel present or not). The empty-index branches keep the current wordings:
overview returns `[WARNING] No structured overview available for '<slug>'.`
(REQ-248b's slug is retained) and navigation returns
`[WARNING] No navigation index available.` (REQ-249b).

**D9 — a waypoint change is a transition (F-P3B3-8).** Correct the state type
first: `adventure_scene_waypoint` is declared `{ anchor: string; description:
string } | null` (`core/state.ts:797`) but every read and write uses a string
(`index.ts:6921`, `:15341`); the declaration becomes `string | null`. Capture
`waypointChanged = adventure_scene !== undefined && (adventure_scene || null)
!== novel.adventure_scene_waypoint` before the assignment at `:6920`, then
`const isTransition = descriptionChanged || waypointChanged`. Scene history is
pushed only when the description changed (a waypoint-only change must not
fabricate a history row). The `audit("scene-transition")` payload carries
`adventure_scene` and only fills `from` when the description changed. The hook
body (`advanceSceneTransitionCountdowns`, `runWorldReactivityCycle`, faction
advance, pacing reset, social-cast reset) runs once, as today.

**D10 — generated adventures get a world and coexist with an indexed one
(F-P3B3-9).** `generate` emits a world section only when the premise matches a
fixed spatial keyword set (dungeon, tower, keep, crypt, station, temple, cave,
castle, ruin, harbor, mansion, ship, lab, tomb, vault, sewer, forest, island,
fort, mine). A premise outside the set produces no world section, exactly as
REQ-132c conditions it; the location count is not a proxy for spatiality. When
emitted, the section is:
`<Location N: …> is a room. "<flavor>"` per location plus
`<direction> of <A> is <B>` between consecutive locations (REQ-132d's minimum).
The section is returned in the generate response and stored on the scaffold.
The novel branch runs `convertSource` into `novel.world` and records the room
names in `scaffold.materialized_rooms`. A second `generate` deletes those rooms
and their exits before materializing the replacement (REQ-132e). A generated
room whose name already exists in `novel.world` gets a ` (generated)` suffix
instead of overwriting the indexed room, so neither adventure's map is lost.
`load` stops nulling `generated_adventure`: it deletes only the previously
loaded indexed adventure's `adventure_index.materialized_rooms`, replaces the
indexed world, and leaves the generated rooms in place (REQ-132b). Generated
rooms therefore never live in a store the indexed load rewrites. Tracking lives
inside the two existing payloads — no new Novel top-level key, no §7.7 change.
Rejected alternative: a dedicated `generated_world` model on `NovelState`. It
would be a new Novel-persisted surface with no §7.7 property group, so it would
require a property-group addition and the clone/checkpoint/archive
enumerations (REQ-240a/241a/334b) for a payload that is already Novel-scoped.

**D11 — synthesis linkage matches all four categories and uses the REQ wording
(F-P3B3-10).** After extraction, compute: `voice_examples` against extracted
NPC names (ruleset index lookup by normalized name/token overlap),
`lore_templates` against `@lore` keywords and location names (keep the
existing containment heuristic), `action_patterns` against extracted
`@encounter` descriptions, and `adventure_advice` against premise tokens and
genre tags. Ruleset-native items (`tag` in `ruleset|vendor`) are already active
through `isWisdomItemActive` (`:14149-14161`), so "automatic activation" needs
no write; `player`-tagged items are also active by that predicate and are
therefore **not** counted in the community-inert prompt, while
`supplementary` items are (REQ-080, REQ-229c). The augmentation block is
appended after the world-model confirmation on **both** the World and no-World
load branches — the no-World path currently calls `adventureSynthesisLines()`
(`:14102-14113`), whose `inert — activate with` wording is the defect. Both
paths share one renderer, in this order: the existing world line, then
`Synthesis found X voice examples for adventure NPCs, Y lore templates for
adventure locations. Review at synthesis://status.`, then `Synthesis N items
found. Review at synthesis://status and activate individually.` When every
count is zero the whole block is omitted with no error (REQ-229d).
Adventure-linked tagging is **derived at read time**, not persisted:
`manage_synthesis (action: list)` adds `adventure_slug` to the items matched
against the active Novel's adventure names, so T305's tag assertion holds,
`manage_novel (action: end)` removes the tag by ending the Novel, and
`manage_synthesis (action: revert)` leaves it untouched because revert acts
only on supplementary items. Rejected alternative: persist a per-Novel
adventure tag on each wisdom item — a new Novel-tier surface whose only
consumer is a derived list view. Rejected alternative: count `player` items as
community — they are player-authored and active, so the "inert" prompt would
be false.

**D12 — build-time index, validated and freshness-gated (F-P3B3-5, -11).** A
new `holonovel/scripts/generate-adventure-index.ts` [build tool] scans
`holonovel/adventures/*.md`, validates Appendix K, extracts structure through
`src/core/adventure.ts`, and writes two byte-deterministic outputs: the index
JSON and the table between `<!-- adventure-index:start -->` /
`<!-- adventure-index:end -->` in `holonovel/DECISIONS.md` (REQ-247c's
"recorded in DECISIONS.md"; the table also names the validation mechanism T206
asks for). Flags: `--input <dir>` (default `holonovel/adventures`),
`--out <file>` (default `<input>/index.json`), `--decisions <file>` (writes the
marker table; omitted with a temp `--input`), `--check` (regenerate in memory
and byte-compare every output named), `--json` (print the index to stdout for
the harness), `--help`. **Malformed** means a missing H1, `## Overview`,
`## Adventure Hook`, or an inconsistent adjudicator marker — the three
conventions REQ-171a lists. A structurally non-Appendix-K module that still
carries the three required headings is *not* malformed (T283's fixture), and a
module whose only defect is a missing optional section is not either. Each
malformed entry carries both the literal and the structured fields:
`{ flag: "[malformed-adventure]", convention, disposition:
"skipped"|"partial" }`. `skipped` slugs are absent from every surface —
`adventureFiles()`, `manage_adventure (action: list)`, `adventures://`, the
per-anchor resource, search, and `badge_briefing` — while `partial` slugs serve
their conforming sections and omit the failed ones (REQ-171b).
The index is a file, not a compiled module, and it is resolved **per
directory**: each directory in `adventureDirs()` that holds modules uses its own
`index.json` when present, so an installed `<DATA_DIR>/adventures` index cannot
shadow a temp `TTRPG_ADVENTURE_DIR` index and vice versa. A harness can
therefore point `TTRPG_ADVENTURE_DIR` at a temp directory carrying its own
index and module and exercise the malformed, partial, skipped, and drifted
branches without a shipped defect. A module present on disk but absent from its
directory's index (an installed module, REQ-620) is reported with a
startup-computed hash and `source: "installed"`, is never drift-compared (it has
no build hash), and is still loadable. `main()` gains `warmAdventureIndex()` beside
`warmCatalogCache()` (`:16276-16285`): it hashes each indexed module, compares
against the loaded index, caches `[adventure-drift]` entries
`{ flag: "[adventure-drift]", slug, stored_hash, current_hash, detected_at }`
and writes one stderr warning per drifted slug without failing startup
(REQ-172). `spec_health` reports `indexed_adventures: { [slug]: { title,
content_hash, player_visible, source, malformed: [...] } }` for every badge,
Player-filtered to `player_visible` rows (REQ-170), plus `adventure_drift`.
Rejected alternative: a compiled `src/generated/adventure-index.ts` module. It
would couple the build tool to `tsc`, and the harness could not swap the index
without rebuilding the server; a JSON file read from the same directory scan is
testable and ships with the modules.

**D13 — environment, not-found, and suggestions (F-P3B3-12).**
`adventureFiles()` appends the comma-separated file paths in `TTRPG_ADVENTURE`
(`§7.6` already declares the variable) after `<DATA_DIR>/adventures` and
before `TTRPG_ADVENTURE_DIR`/the build default, so an explicit pre-load path
wins over the scan dir and loses to an installed module. The `[NOT_FOUND]`
message enumerates available slugs (`Available adventures: a, b.`) or
`(none indexed)`, never directories. The fuzzy suggestion is D3. The tool
description is corrected to say `load` activates a module or stores its
scaffold with `target: codex`, and `generate`/`generate_encounter` persist and
are undoable.

**D14 — assertions are written red-first, in the harness that owns the surface
(F-P3B3-11).**
- `holonovel/scripts/test-adventure.ts` — new blocks, each widened to its
  Appendix F row:
  - **T208** — a temp build dir with a malformed module yields
    `spec_health.indexed_adventures[slug].malformed[0]` with
    `flag: "[malformed-adventure]"`, the convention, and the disposition; a
    `partial` module's conforming sections are retrievable at
    `adventure://<slug>/<anchor>`; a `skipped` slug is absent from the catalog,
    `adventures://`, search, and the briefing; a conforming module produces no
    entry.
  - **T59** — anchor resource retrieval, Keeper-only `[FORBIDDEN]` for Player,
    HIGH for a heading match and MEDIUM for a body match with the bracketed
    label leading each line, and `[generated]` not changing sort order.
  - **T60** — A's NPCs persist as Novel entities after loading B while A's
    prose leaves the briefing.
  - **T61** — restart restores the active adventure, its NPCs, and scene state.
  - **T206** — `[NOT_FOUND]` enumerates available slugs; a valid slug
    activates; the DECISIONS table names the validation mechanism.
  - **T287** — pre-population counts, a skeletal NPC taking an `[auto]` combat
    turn, the duplicate-name skip note, and the ruleset monster suggestion.
  - **T368** — codex load with no Novel, `source: loaded:<slug>`, full
    `manage_codex (action: get)` payload, and survival across restart.
  - **T209** — shadow an indexed module in a temp dir, restart, assert the
    `[adventure-drift]` entry with its timestamp and the matching stderr
    warning, and assert startup still serves requests.
  - **T283** — the build tool against a raw-prose, no-World, no-annotation
    module: scene/NPC/location rows appear in the generated table; a garbled
    module yields an empty index without error; the raw-prose module is not
    flagged malformed (only the three required conventions gate that).
- `holonovel/scripts/test-output-contracts.ts` — widen T146 (generate,
  `adventure://generated/overview` **and** `/generated/hook`, load coexistence
  with indexed first in the briefing, end discards the generated adventure
  only, regenerate replaces, generated `## World` has a starting room and
  exits), T207 (hash-bearing `indexed_adventures`, full `adventures://` list,
  Player-filtered hooks and titles, and the `<!-- player_visible: true -->`
  flag exposing a hookless module to the Player), T284 (waypoint block with slug and
  heading, adjacent scenes, independent free-text description, clear, unknown
  `[NOT_FOUND]` with nearby names, transition hook, Player pass-through, and
  Player `manage_scene (action: set, adventure_scene=…)` `[FORBIDDEN]`), T285
  (roles, descriptions, anchors, GM filtering, slug-bearing warning), T286
  (anchors, waypoint, GM filtering, no-adventure `[STATE_CONFLICT]`, warning),
  T305 (the four match categories, the exact community wording, the omission
  branch, `manage_synthesis (action: list)` adventure tagging, end removing
  the tag, revert leaving it), and T338 (two-module catalog with every REQ-292a
  field, Player visibility, and the genre filter for both badges; the
  catalogue's looser "ruleset compatibility" clause is satisfied by
  `genre_tags`, which is the field REQ-292a defines).
- `holonovel/scripts/run_pattern_buffer.ts` — read the shipped fixture file
  instead of the inline constant so the buffer and the catalog cannot diverge.

## 4. Blast radius

| File | Change | Size |
|---|---|---|
| `holonovel/src/core/adventure.ts` | D1 extractor (new) | M |
| `holonovel/adventures/index.json` | D12 generated artifact (new) | S |
| `holonovel/scripts/generate-adventure-index.ts` | D12 build tool (new) | M |
| `holonovel/adventures/tomb-of-the-serpent-king.md` | D12 fixture (new; moved from the pattern buffer) | S |
| `holonovel/adventures/hollow-of-the-moth.md` | D12 second fixture (new) | S |
| `holonovel/src/index.ts` | D2 load target/codex, D3 pre-population, D4 briefing, D5 search, D6 resource, D7 catalog, D8 overview/navigation, D9 transition, D10 generate/load world, D11 synthesis, D12 warm/drift, D13 env/not-found/description | L |
| `holonovel/src/core/adventure-provenance.ts` | no change: the `player_visible` marker stays outside the provenance block (D7) | — |
| `holonovel/src/core/state.ts` | `adventure_index.materialized_rooms?: string[]` (D10); `adventure_scene_waypoint: string \| null` (D9); the `generated_adventure` payload is untyped | S |
| `holonovel/scripts/test-adventure.ts` | D14 T59/T60/T61/T206/T287/T368/T209/T283 | L |
| `holonovel/scripts/test-output-contracts.ts` | D14 T146/T207/T284/T285/T286/T305/T338 | L |
| `holonovel/scripts/run_pattern_buffer.ts` | D14 fixture read | S |
| `holonovel/package.json` | `files` + `adventures`; `build:adventure-index` and `check-adventure-index` scripts; `test:adventure` unchanged | S |
| `package.json` (root) | `check-adventure-index` script delegating to the server package, so the gate manifest's `npm(...)` helper can run it | S |
| `scripts/validate.ts` | REQ-454 dispositions for REQ-171 and REQ-172 (the index/drift code cites them in source) | S |
| `spec/audit/tool-surface-baseline.json` | regenerated by `surface-budget --write` after the description edit | S |
| `holonovel/AGENTS.md` | template count 21→22; adventure-index tool in the layer map | S |
| `holonovel/DECISIONS.md` | generated adventure-index table; the two new notes | S |
| `holonovel/tool-definitions.json` | regenerated after the description edit | S |
| `scripts/lib/gate-manifest.ts` | `check-adventure-index` (fast + full) | S |
| `AGENTS.md` | gate table regenerated from the manifest | S |
| `spec/audit/review-register.md` | F-P3B3-1…12 dispositions; resolved block | M |
| `spec/audit/req-coverage.md` | regenerated (`validate -- --write-register`) | S |
| `ROADMAP.md` | remove the §5.6 adventure-content section | S |
| `CHANGELOG.md` | dated entry | S |
| `docs/plans/2026-11-12-5-6-adventure-content-remediation/{plan,tasks,aar}.md` | this increment | S |

Not touched: no tool or action name changes; no prompt; no §7.7 property group;
no spec REQ body; no `spec/` source file other than the two registers.

## 5. Phases

### Phase 0 — baseline (complete)

`npm run status`, `git status --short`, and `npm run check:fast` are recorded
in §1. Phase 5 records the five harness baselines in `aar.md`.

### Phase 1 — red probes

1. Write the server-side D14 blocks (T59/T60/T61/T206/T287/T368, T146–T338)
   with no implementation change; run the two harnesses and record each
   failing assertion in `aar.md`.
2. Sequence the build-artifact assertions differently: the tool must exist
   before "the assertion detects the defect" means anything. Add the tool in
   Phase 2 step 3 (no server wiring), write the T208/T209/T283 blocks, and
   observe them red against the missing index/drift/omission behaviour; a
   missing-binary failure is not recorded as evidence.

### Phase 2 — extractor and build index (D1, D12)

3. Add `src/core/adventure.ts`; unit-exercise it through the existing
   `test:adventure` boot (no new harness).
4. Add `generate-adventure-index.ts`, the two fixtures, the `DECISIONS.md`
   markers, and the npm scripts. Run `--check` (fails: artifact absent), write
   the artifact, run `--check` again (passes), and diff two runs for byte
   identity. Write the T208/T209/T283 blocks now and record their red output.
5. Grep `scripts/`, `holonovel/scripts/`, and the gate manifest for an existing
   check over adventure discovery or the index (expected: none —
   `check-world-provider` is the nearest precedent) before adding
   `check-adventure-index`; add the root `package.json` script that delegates to
   the server package, wire the manifest (fast + full), and regenerate the
   AGENTS gate table.

### Phase 3 — load (D2, D3, D13)

6. Add `target` to the load schema and the codex branch; correct the
   description.
7. Add `novelSnapshot`, one `prepopulateAdventure(novel, structure, slug)`
   helper called on **all three** novel branches (the world-replaced branch,
   the `[world-preserved]` branch at `:11156-11165`, and the no-World branch),
   the duplicate skips, the summary, and the monster suggestion.
8. Add `TTRPG_ADVENTURE` file paths and the slug-enumerating `[NOT_FOUND]`.

### Phase 4 — resources and catalog (D6, D7, D8)

9. Add the per-anchor template after the two specific ones.
10. Rewrite overview and navigation on the extractor; fix the
    `[STATE_CONFLICT]` branch and add the two `[WARNING]` branches.
11. Apply the catalog filter for every badge and the `player_visible`/hook
    rule to both `manage_adventure (action: list)` and `adventures://`;
    implement the Appendix K preview fallback; exclude `skipped` slugs from
    every surface.

### Phase 5 — briefing, search, transition (D4, D5, D9)

12. Render the indexed and generated briefing blocks.
13. Merge adventure prose into ruleset search with the sort and tag rules.
14. Move the transition predicate to include a waypoint change; keep history
    and the audit honest.

### Phase 6 — generated lifecycle and synthesis (D10, D11)

15. Emit the generated `## World`; materialize and track rooms; make `load`
    preserve generated content.
16. Implement the four synthesis match categories, route both load branches
    through the shared augmentation renderer with the exact wording and the
    omission branch, and derive the adventure tag in
    `manage_synthesis (action: list)`.

### Phase 7 — registers and generated surfaces

17. Add the REQ-171/REQ-172 `INTENDED_GAP_CITED_DISPOSITIONS` entries in
    `scripts/validate.ts`, then regenerate the coverage register and confirm
    the bucket assignments in §2.
18. Move F-P3B3-1…12 to a `### 2026-11-12 §5.6 adventure content remediation`
    block under `## Resolved` with current predicates; remove the ROADMAP
    section; add the CHANGELOG entry and the DECISIONS notes.
19. Regenerate `tool-definitions.json` (the description edit), run
    `check-tool-definitions-sync`, then `surface-budget --write` (the footprint
    moved) and refresh the DECISIONS canonical/compatibility/token budget
    lines to the measured values, then `build-order`.

### Phase 8 — gates

20. Run the six harness suites, root and server `typecheck`, `check:fast`,
    `check-adventure-index`, `check-gate-table`, then the full `check` via
    `build-order`; write `aar.md` with the red transcripts, deviations, and
    the terminal `LOOP PAUSED`.

## 6. Verification

| Step | Command | Expected |
|---|---|---|
| Load/codex/pre-population | `npm --prefix holonovel run test:adventure` | T59/T60/T61/T206/T287/T368 green |
| Build artifact | `npm run check-adventure-index` | pass; byte-identical on re-run |
| Drift | `npm --prefix holonovel run test:adventure` | T209 green |
| Structure extraction | `npm --prefix holonovel run test:adventure` | T283 green |
| Resources/briefing/catalog | `npm --prefix holonovel run test:output-contracts` | T146/T207/T284/T285/T286/T305/T338 green |
| Search merge | `npm --prefix holonovel run test:adventure` | T59 search assertions green |
| Pattern buffer | `npm --prefix holonovel run test:pattern-buffer` | green after the fixture read |
| Types | `npm run typecheck` + `npm --prefix holonovel run typecheck` | clean |
| Spec gates | `npm run assemble && npm run check:fast` | `check:fast: PASS` |
| Gate table | `npm run check-gate-table` | pass |
| Surface budget | `npm run surface-budget` | pass after `--write` and the DECISIONS refresh |
| REQ-454 dispositions | `npm run validate` | no whitelisted-citation error |
| Traceability | `npm run check-traceability` | pass |
| Full gate | `npm run build-order` | full `check` 0 errors |
| Loop artifacts | `npm run check-loop-artifacts` | pass |
| Registers | `npm run check-registers` | pass |

## 7. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Template resolution depends on registration order | Register the generic template **after** the two specific ones and assert both exact URIs still resolve in T285/T286; comment cites the SDK loop |
| Shipping fixtures changes the empty-state tests | T207/T338 boot with `TTRPG_ADVENTURE_DIR` pointed at an empty temp dir for the empty-state branch; the populated branch uses the shipped dir; grep `[No adventure modules found.]` and `adventure_catalog_count` for other consumers |
| Generated rooms are lost on an indexed load | Track `materialized_rooms` on both payloads; assert coexistence and the deletion order in T146 |
| `indexed_adventures` changes shape | Grep `indexed_adventures` across harnesses/docs; only T207 (which never reads it) and the register mention it; widen T207 |
| DECISIONS marker is rewritten by another tool | The block is additive and marker-delimited; `check-registers` and `check-traceability` do not parse it; assert the file diff is marker-local |
| Generated artifact is non-deterministic | Sorted slugs, LF, trailing newline, no timestamps; `--check` byte-compares twice in Phase 2 step 4 |
| Two `index.json` files resolve to the wrong one | Index resolution is per directory, so each directory's modules pair with its own index; T208/T209 use a temp `TTRPG_ADVENTURE_DIR` and Phase 4 asserts the shipped index governs the shipped modules |
| Pre-population duplicates Novel entities | Skip by case-insensitive name against `novel.npcs` **and** `novel.entities`; T287 asserts the note |
| `load` now snapshots, changing undo depth | Record the added snapshot in the CHANGELOG/DECISIONS note; assert one undo restores the pre-load state |
| A malformed shipped fixture breaks the gate | Fixtures are conforming; the malformed case is exercised only through `--input` in T283 |
| Search budget double-counts | Adventure hits enter the same `searchMaxTokens()` loop; T59 asserts the merged bound |
| Generated rooms clobber an indexed room of the same name | A colliding generated room gets a ` (generated)` suffix; T146 asserts both rooms survive |
| An installed module has no build hash | It is listed with `source: "installed"` and a startup hash, and is excluded from drift comparison |
| Pre-population runs twice on a re-load | The duplicate-name skip covers NPCs, lore keys, and faction names, so a second load adds only new items |

## 8. Deliberately deferred

- Publication (`./scripts/push-pipeline.sh`): 59 unpushed commits predate this
  session; publishing needs the separate "push" authorization.
- §7.6 spec prose: both `TTRPG_ADVENTURE` and `TTRPG_ADVENTURE_DIR` are already
  declared (`spec/04-runtime.md:149,177`); no doc change is needed.
- `manage_adventure` action growth: no new action; `load` reuses `target`.
- The other §5.6 remediation sections and the P2 review sweeps stay on the
  roadmap.
- A ruleset-specific adjudicator-term lookup: §7.1's emphasis rule is
  sufficient and already implemented in `deriveAnchor`; adding a model field
  would be a new ruleset contract.

## 9. Commit plan

One spec increment, one commit (`npm run session:close` after the gates pass).
No history rewrite. The working tree must be clean of unrelated edits before
Phase 1.

## 10. User impact and sizing

Restart required after upgrade (new catalog and index). `load` gains an
optional `target`; existing calls keep their behavior. One resource template
is added; the documented count moves 21→22. `spec_health.indexed_adventures`
changes from a one-key scaffold map to `{slug: {title, content_hash,
player_visible, source, malformed}}` and gains `adventure_drift`; both are GM
diagnostics except the Player-visible catalog rows. Two adventure modules ship
with the package, so a fresh install has a non-empty catalog; the tool
description and its measured token footprint move, so the DECISIONS budget
lines and the surface baseline are refreshed in the same commit. Rollback
cost 1: revert the commit; a Novel that already carries generated rooms loses
only those rooms because the tracking lives inside `generated_adventure`.

## 11. Review record

Review independence: fresh (one cold pass). Depth: standard. The cold reviewer
returned FAILED with six Blockers and eleven Majors; every Blocker and every
Major was resolved in this revision (gate invocation and root script, REQ-454
dispositions, Appendix F clause coverage, literal `[malformed-adventure]` /
`[adventure-drift]` markers, the surface-budget/DECISIONS budget refresh, the
slug-bearing overview warning, the installed-module index branch, the
`--input`/`--out`/`--decisions` split, generated anchors, the world-preserved
pre-population branch, the `player_visible` carrier, the spatial-premise gate,
the no-World synthesis path, the `adventures://` visibility rule, the
malformed-vs-non-conforming vocabulary, rejected alternatives, and red-first
ordering for the build-artifact assertions). The cold artifact and its hash
are recorded in §11 of this file's stamp; the exact report is in
`cold-review.md` beside this plan. One diff re-review at the standard cap
confirmed five of six Blockers and ten of eleven Majors resolved, and found the
`player_visible` carrier broken against the provenance parser; that is fixed in
D7 (an HTML-comment marker outside the provenance block) and recorded as
condition **C-1** for `build-review`, which verifies it against
`src/core/adventure-provenance.ts` and the bundle round-trip. No further cold
pass was run (standard-depth cap).
