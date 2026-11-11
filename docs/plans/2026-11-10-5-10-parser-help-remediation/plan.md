# Plan — §5.10 parser response and help contracts (F-P6a-7, F-P6a-11, F-P6a-17)

Status: revised after cold review (4 Blockers, 5 Majors, 5 Minors folded in) ·
Kind: planned · Depth: standard
Increment: `docs/plans/2026-11-10-5-10-parser-help-remediation/`
Rollback cost: 1 (reversible source and spec edits; one spec increment, one commit)
Evidence class: repo only (no web, no user-supplied content)

## 1. Objective

Take the **first bullet** of the first open `ROADMAP.md` section — **§5.10
world-model contract remediation (P1)** — and close the findings it owns:

- **F-P6a-7.** Parser response and help contracts: unknown verbs refuse with
  `NOT_FOUND` instead of `[UNIMPLEMENTED]` plus three nearest verbs, taking from
  a closed container reports `NOT_FOUND` instead of a rule violation, the
  ambiguous-object prompt is unnumbered, `help` lacks the category/description
  body and the `commands`/`what can I do?` aliases, `jump` is advertised with
  no dispatch, `touch` dispatches but is absent from the catalog, and exits are
  appended to the room-description body (REQ-196b, REQ-196c, REQ-196d,
  REQ-196e, REQ-197a, REQ-283a, REQ-283b, REQ-318a).
- **F-P6a-11.** Narrative-intent verbs: no `narrative` parser category or
  catalog entries, help lists the verbs flat, `give`/`show` resolve an NPC in
  any room, and `throw` deposits in the current room (REQ-320a, REQ-320b,
  REQ-320c).
- **F-P6a-17.** The `Closed-P3` row that folded the same narrative-verb scope
  defects into F-P6a-11 (`spec/audit/review-register.md:2139-2143`). It is
  re-disposed in the same increment, because the register cross-references the
  work this plan performs.

The user selected this split on 2026-11-10: bullets two (hints, detail signal,
vehicle traversal — F-P6a-8/9/10) and three (resources, suggest mapping, CRUD
lifecycle — F-P6a-12/13/14) remain scheduled on `ROADMAP.md` and are not
touched.

**Done bar** (each item names its command or artifact; no conditional clause)

1. F-P6a-7, F-P6a-11, and F-P6a-17 appear under
   `## Resolved — 2026-11-10 §5.10 parser and help contracts` in
   `spec/audit/review-register.md`, each with a post-change `file:line`
   predicate that resolves on the committed tree; every REQ the row covers is
   named in the row.
2. The `## §5.10 world-model contract remediation (P1)` section in
   `ROADMAP.md` keeps only its second and third bullets plus a `**Trigger:**`
   line whose closing condition names F-P6a-8, F-P6a-9, F-P6a-10, F-P6a-12,
   F-P6a-13, and F-P6a-14; `npm run check-roadmap` passes.
3. The new assertions in `holonovel/scripts/test-backfill.ts` (T239, T365),
   `holonovel/scripts/test-output-contracts.ts` (T240, T333), and
   `holonovel/scripts/test-world-provider.ts` (T245) fail on the pre-fix tree
   (output recorded in `aar.md`) and pass after the fix; these exit 0:
   `npm --prefix holonovel run test:backfill`, `test:output-contracts`,
   `test:world-provider`, `test:adventure`, `test:narrative`.
4. REQ-002a1, REQ-002a2, and REQ-002b1 admit the parser-vocabulary
   `[UNIMPLEMENTED]` case with measured bodies under the validator's
   800-character limit (recorded in `aar.md`), and `npm run validate
   --sdd-strict` reports 0 errors.
5. `npx tsx holonovel/scripts/generate-world-provider.ts --check` passes after
   regeneration and `npm run check-world-provider` passes, with the generated
   `narrative_world_model/world/world-model-provider.md` byte-identical to a
   fresh render.
6. `npm run assemble` and `npm run check:fast` exit 0 un-piped with the
   trailing `check:fast: PASS` line; `npm run check` reports 0 errors.
7. `npm run build-order` completes; `npm run check-tool-definitions-sync`,
   `npm run tool-definitions-lint`, `npm run check-tdqs-scoreboard`, and
   `npm run surface-budget` pass after the description edit.
8. `spec/audit/req-coverage.md` is refreshed (`npm run validate --
   --write-register`) and `npm run check-registers` passes.
9. `aar.md` ends `LOOP PAUSED`; the increment lands as one commit via
   `npm run session:close`.

## 2. Verified baseline

- `npm run status`: 45 unpushed commits, 15 open roadmap items, version
  `2026.11.10`, last publish `2026-11-09T04:30:29.593Z` (`repo`, this session).
- `npm run check:fast`: **40 passed, 0 failed**, trailing `check:fast: PASS`
  (`repo`, this session). The baseline is green; no pre-fix commit is needed.
- `git status --porcelain` was empty at draft time; the only additions are this
  increment's three artifacts (`repo`, this session).
- `docs/plans/` is tracked and `check-loop-artifacts` reads every directory
  there, so `plan.md`, `tasks.md`, and `aar.md` all exist from the drafting
  step (`scripts/lib/loop-artifacts.ts:24-78`).
- Version `2026.11.10` already equals the session date; `session:close` derives
  the commit subject from the top `CHANGELOG.md` heading.

## 3. Evidence (re-derived this session)

The register rows were written on 2026-11-09 against a tree that has since
moved (vehicle traversal, narrative verbs, and verb tiers all landed). Each
predicate below was re-checked on the current tree; clauses that now hold are
listed separately so the plan closes them with evidence instead of re-fixing
them.

**Still open (defects):**

| # | Predicate | Current code |
|---|---|---|
| A | Unknown verb returns `[ERROR] [NOT_FOUND]` with a fixed `Try:` line, not `[UNIMPLEMENTED]` + 3 nearest (REQ-196c) | `holonovel/src/world/parser.ts:115-121` |
| B | The reachable-set excludes closed-container contents, so `take` reports `NOT_FOUND` before reaching the existing closed-container `[RULE_VIOLATION]` branch (REQ-196c) | `parser.ts:386-400`, branch at `:411-417` |
| C | Ambiguous-object prompt is unnumbered, has no location, and carries no selection mechanism (REQ-196e) | `parser.ts:401-404`, `:442-445` |
| D | `help` renders tiers only, with no category, no one-line description, and no `commands` / `what can I do?` aliases (REQ-196d) | `holonovel/src/index.ts:4885-4893`, `:5219-5225` |
| E | `jump` is in the standard tier with no dispatch case; `touch` dispatches but is absent from every catalog (REQ-196d, REQ-283a) | `holonovel/src/world/model.ts:1047`; `parser.ts:113` |
| F | The two verb lists disagree: `BASE_PARSER_COMMANDS` has 26 entries and `STANDARD_VERBS` 31, they overlap unevenly, and `touch` appears in neither while `jump` sits in the tier list with no dispatch (REQ-196d, REQ-283a) | `model.ts:243-270`, `:1046-1047` |
| G | Exits are appended to the description body (REQ-197a) | `parser.ts:324-325` |
| H | The `run_command` description omits the required sentence "AI-narrator tool — resolves spatial intent internally." (REQ-196b) | `index.ts:4738-4741` |
| I | `read_text` has no property-contract row in the catalog that `world://kinds` serves (REQ-318a) | `model.ts:43-133`, `:99-102` |
| J | No `narrative` category in the catalog: `ask`/`tell`/`give`/`show`/`throw` sit in the flat standard tier with no category or description, and help renders them flat (REQ-320a, REQ-320c) | `model.ts:243-270`, `:1046-1047` |
| K | `give`/`show` fall back to an NPC in any room (REQ-320b) | `index.ts:5293`, `:5306` |
| L | `throw` places the thing in `currentRoom` rather than the resolved target's room (REQ-320b). With K fixed the two coincide for a matched target, so L is a precision fix that rides with K | `index.ts:5276-5277` |

**Re-audited as holding (close with evidence, no edit):**

- `spec_health.parser_verb_coverage` reports per-tier counts (REQ-283b) —
  `holonovel/src/index.ts:12789`.
- `world://kinds` reports the kind hierarchy, property contracts, the parser
  command catalog, and per-tier verb lists (REQ-202a, REQ-283b) —
  `holonovel/src/world/model.ts:1002-1036`.
- `command("brief"|"verbose"|"normal")` are recognized and persist in the
  session (REQ-197a/b) — `holonovel/src/index.ts:4878-4883`.
- `ask`/`tell` mark a `[WARNING]` when no NPC matches, and `badge_briefing`
  renders the `### Player Intent` section for the GM badge (REQ-320a,
  REQ-320c) — `index.ts:5311-5319`, `:14659-14662`.
- The empty-world help path lists verbs because the catalog is static
  (REQ-196d) — `index.ts:4885-4893`.

**Carrying assertions.** T239 (`holonovel/scripts/test-backfill.ts:375`), T240
and T333 (`holonovel/scripts/test-output-contracts.ts:1438`), T245
(`holonovel/scripts/test-world-provider.ts:47-65`), T365
(`test-backfill.ts:788`), T353 (`test-backfill.ts:942`), T363
(`test-backfill.ts:706`, convert property flags — a different contract, not
touched). No harness asserts the `[UNIMPLEMENTED]` nearest-verb pattern,
numbered disambiguation, help categories/aliases/parity, the read-only
nearest-verb filter, or narrative-verb NPC scoping.

**Generator and gate coupling.** `BASE_PARSER_COMMANDS`,
`WORLD_MODEL_PROPERTIES`, and `verbCatalog` are template inputs for
`holonovel/scripts/generate-world-provider.ts:20-54`, so a catalog edit makes
`check-world-provider` stale until regeneration.
`holonovel/scripts/test-world-provider.ts:67-70` asserts every
`BASE_PARSER_COMMANDS` entry carries non-empty `effect` prose, so the catalog
keeps `args` and `effect` (`M7`). `run_command`'s description feeds
`holonovel/scripts/generate-tool-definitions.ts`, `tool-definitions-lint`, and
the TDQS scoreboard.

**Contract conflicts this change creates.** REQ-196c mandates an
`[UNIMPLEMENTED]` refusal for an unknown parser verb, while REQ-002a1/a2 and
REQ-002b1 scope `[UNIMPLEMENTED]` to a waived ruleset subsystem and require the
corrective action to name the waiver entry
(`spec/02-requirements.md:100-105`); Appendix O.2 repeats the waiver condition
(`spec/appendices-reference.md:3047`). The conflict is resolved in this
increment by D12, not deferred.

## 4. Decisions

**D1 — One parser catalog.** Introduce `PARSER_CATALOG` in
`holonovel/src/world/model.ts` as the single source of truth: `verb`,
`category` (`navigation`, `inspection`, `object_interaction`, `inventory`,
`narrative`, `wait`), `tier` (`core` / `standard`), `args`, `effect` (the
one-line description), `source` (the base-vocabulary anchor string), and an
optional property gate. `BASE_PARSER_COMMANDS`, `CORE_VERBS`, `STANDARD_VERBS`,
`VERB_PROPERTY`, `verbCatalog`, `worldKinds`, and the generated provider
document all derive from it. `args` and `effect` stay because
`test-world-provider.ts:67-70` requires effect prose on every base command, and
every catalog entry gets a non-empty `effect`. Rejected: keep two lists and
patch them — that is the defect (F). Rejected: add `touch`/narrative verbs to
`BASE_PARSER_COMMANDS` only — leaves the tier lists and the provider document
divergent.

**D2 — One help text, aliased.** `renderVerbCatalog` produces a single
canonical text: tier sections (`core`, `standard`, `extended`) in order, each
holding category blocks, each verb annotated with `args` and its one-line
description, a `narrative` block carrying the note "Outcomes are determined by
the Game Master.", and trailing per-tier counts. `help`, `commands`,
`what can I do?`, and `verbs` return byte-identical text. This satisfies
REQ-196d's alias parity, REQ-196d's category + description body, REQ-283b's
"help groups commands by tier" (tiers are the primary grouping), and REQ-283b's
"verbs reports tiered coverage" (the identical text carries the counts).
Rejected: a tier-only help body — fails REQ-196d. Rejected: `verbs` returning a
different tier view — contradicts REQ-196d and T333 (cold-review B1).
`help verbs` is dropped: REQ-196d enumerates exactly three aliases plus `help`.

**D3 — Unknown verbs.** Return
`[UNIMPLEMENTED] Unknown verb '<verb>'. Valid commands include: <a>, <b>, <c>.`
with the three nearest catalog verbs by Levenshtein distance over the whole
verb string (stable tie-break: distance, then alphabetical). The corrective
action is one imperative sentence naming the same three verbs — per D12, the
parser-vocabulary `[UNIMPLEMENTED]` carries nearest values instead of a waiver
entry. The nearest list is filtered by REQ-309b (the Player badge on a
ruleset-bound Novel SHALL never see parser verb names in tool output): the
eligible set is `look`, `examine`, `search`, `inventory`, so three are always
available and REQ-196c's "three nearest" holds without padding. Rejected: keep
`NOT_FOUND` — fails REQ-196c. Rejected: cite a DECISIONS.md waiver — no waiver
exists for the base vocabulary.

**D4 — Closed-container take.** Widen the take-resolution candidate set so a
thing inside a closed container in the room resolves, then let the existing
`[RULE_VIOLATION]` branch fire with a corrective action naming
`open <container>`. This is the parser's own resolution set, not REQ-284a's
hint-reachability rule (which excludes closed containers and is unchanged).
Rejected: add a second lookahead branch — duplicates the existing one at
`parser.ts:411-417` (cold-review M11).

**D5 — Numbered disambiguation.** `ParserResult` gains an optional structured
`disambiguation` field. The parser returns `[OK] Which <type>?` plus a numbered
list with locations. `holonovel/src/index.ts` renders it, stores a
session-local record, and handles a bare numeric reply:

- stored shape: `{ command: string, target: string, matches: [{ name, location }] }`
  where `command` is the original command text and `target` is the exact
  argument substring the parser resolved;
- substitution rule: a numeric reply replaces the **first** occurrence of
  `target` in `command` with the chosen match's `name`, then re-dispatches the
  rebuilt command through the normal path;
- any non-numeric command clears the record.

The `[OK]` prefix follows REQ-196e verbatim and is scoped to the parser's
disambiguation prompt. It does not relax the shared taxonomy: REQ-002 /
Appendix O.2's `[AMBIGUOUS]` category governs a *tool input value* that matches
several canonical entries (T177), while the parser is asking which world object
the caller meant and expects a follow-up. T177 is not amended.

**D6 — Exits as a status line.** `ParserResult` gains an optional `status`
string. `handleLook` returns the body (name, verbatim description, visible
things) and `status: "Exits: …"`; `index.ts` renders the body followed by the
status line as the final line. No `Exits:` text is appended inside the
description body. T240 asserts the first line is the room name, the description
is verbatim, and the final line begins `Exits:`.

**D7 — `jump` and `touch` dispatch.** `jump` with no target returns
`[OK] You jump.`; `jump <thing>` resolves a reachable thing and requires
`climbable`, otherwise `[RULE_VIOLATION]`. `touch` is an `inspection` catalog
entry (REQ-319b lists touch with `read`/`listen`/`smell`) that resolves a
reachable thing and returns `[OK] You touch the <thing>.`, `[NOT_FOUND]` when
unreachable. Both are `standard` tier. Rejected: drop `jump` — REQ-283a names
it as a standard verb.

**D8 — Narrative verbs.** `ask`, `tell`, `give`, `show`, `throw` are
`narrative`-category, `standard`-tier catalog entries with descriptions.
`give`/`show` resolve the NPC only in the current room (drop the
`?? resolveNpcInRoom(novel, npcName, null)` fallback); a miss records the intent
with `[WARNING]` and does not transfer the thing. `throw` resolves the target
in the current room: on a match the thing moves to `npc.location ??
currentRoom`; on a miss the throw still deposits in the current room and the
intent records `[WARNING]`. REQ-320b's "moves a thing to the target's room"
therefore holds for every matched target, and because resolution is
current-room-scoped a matched target's room is the caller's room — the
observable behaviour is asserted as "left inventory, present in the room",
never as "not the caller's room" (cold-review B2).

**D9 — `read_text` contract row.** Add a `read_text` entry to
`WORLD_MODEL_PROPERTIES` using the existing text-property pattern: values
`text`, with the default-null rule stated in `contract`, group "Extended
Properties (all things)", doc `all-things` (matching `noise`/`scent`,
`model.ts:124-132`). No REQ body change: REQ-318a already requires it.

**D10 — `run_command` description.** Prepend the exact sentence "AI-narrator
tool — resolves spatial intent internally." to the existing description, then
regenerate `tool-definitions.json` and re-run the description gates. Rejected:
paraphrase — REQ-196b quotes the sentence.

**D11 — Scope stop.** Bullets two and three of the roadmap section
(F-P6a-8/9/10, F-P6a-12/13/14) are out of scope. A defect discovered in their
surface during execution becomes a register row, not an in-plan expansion.

**D12 — Spec reconciliation for the parser-vocabulary `[UNIMPLEMENTED]`.**
Four precise edits, because leaving the conflict to a P3 AAR row would leave
two normative REQs unsatisfiable at once:

1. REQ-002a1 (`spec/02-requirements.md:99-100`): after the waiver sentence, add
   "The tool also raises `[UNIMPLEMENTED]` when a parser command verb is absent
   from the registered catalog (REQ-196c)." Body measured this session at 497
   characters, 3 sentences; the addition makes it ~655 characters, 4 sentences
   (limit 800 / 8).
2. REQ-002a2 (`:102-103`): scope the first sentence — "The response names the
   unimplemented subsystem and cites the waiver entry for a waived subsystem,
   or names the nearest valid verbs for a parser-vocabulary refusal
   (REQ-196c)." Body measured at 324 characters; the edit keeps it well under
   800 and changes no sentence count.
3. REQ-002b1 (`:104-105`): replace the final sentence with "For a waived
   `[UNIMPLEMENTED]` subsystem, the corrective action names the waiver entry in
   DECISIONS.md (5); for a parser-vocabulary `[UNIMPLEMENTED]` it names the
   nearest valid verbs (REQ-196c)." Body measured at 445 characters; the
   replacement keeps it under 800, at roughly 4 sentences (re-measured in
   Phase 0.7).
4. Appendix O.2 `[UNIMPLEMENTED]` row (`spec/appendices-reference.md:3047`):
   condition becomes "Valid input but feature not yet modeled, or a parser
   command verb outside the catalog"; the corrective column adds "for a
   parser-vocabulary refusal, name the nearest valid verbs".

REQ-196c is not amended. Rejected: file the conflict as P3 — cold-review B3 is
right that a demonstrated conflict between normative REQs is not informational.
Rejected: amend REQ-196c to a satisfied category — no existing category means
"verb outside the vocabulary" while keeping the required response pattern.

## 5. Phases

### Phase 0 — Baseline and predicate re-check (S)

1. Run `npm run status` and `npm run check:fast` un-piped; record both.
2. Re-confirm each predicate in §3 with `grep -n`; a clause that already holds
   is dropped from the fix list and recorded as evidence in `aar.md`.
3. Run the baseline harnesses this plan depends on —
   `npm --prefix holonovel run test:backfill`, `test:output-contracts`,
   `test:world-provider`, `test:adventure`, `test:narrative` — plus
   `npm run check:conformance`; record exit status. A red baseline is a P0 and
   is fixed first, as its own commit.
4. Verify the fingerprint claim: `DATA_SECTIONS`/`PACKAGE_SECTIONS`
   (`scripts/lib/contract-fingerprint.ts:27-43`) exclude §5.10, §5.1, and
   Appendix F. If a fingerprinted section is in the edit set, add its
   regeneration step to Phase 5.
5. **Sibling-contract check.** Grep the REQ corpus for other clauses binding
   the parser surface this plan changes — `command(`, `run_command`, `help`,
   `ambiguity`, `[UNIMPLEMENTED]`, `[AMBIGUOUS]`, `REQ-002a1`, `REQ-002a2`,
   `REQ-002b1` — and confirm no second contract fixes the same output beyond
   D12's four edits. A newly found conflicting REQ stops the run for a
   decision.
6. **Register cross-reference.** Grep the **whole** of
   `spec/audit/review-register.md` (not one section) for each of the 11 REQ IDs
   and for `F-P6a-17`; the F-P6a-7, F-P6a-11, and F-P6a-17 rows are the only
   ones allowed to cite them, and all three are re-disposed in Phase 5.3.
7. Measure the pre-edit bodies of REQ-002a1, REQ-002a2, and REQ-002b1 with
   `extractReqBodies`; record the counts in `aar.md`.
8. Read `holonovel/narrative_world_model/world/world-model-provider.template.md`
   and confirm whether per-verb descriptions require a template edit; record
   the answer (cold-review Unknown 2).
9. Confirm `git check-ignore docs/plans/2026-11-10-5-10-parser-help-remediation/`
   returns nothing.

### Phase 1 — Red tests (M)

1. `holonovel/scripts/test-backfill.ts`, T239 (extend `:375`):
   - `run_command (command: "xyzzy")` → `[UNIMPLEMENTED]` and three valid
     verbs; under the Player badge on a ruleset-bound Novel the three are
     read-only perception verbs only.
   - a thing inside a closed container: `take <thing>` → `[RULE_VIOLATION]`
     naming the container; `open <container>` then `take <thing>` → `[OK]`.
   - two same-named things in one room: the prompt is `[OK] Which thing?` with
     a numbered list carrying both locations; reply `1` applies the original
     command to the first match; a non-numeric command clears the record.
   - `help`, `commands`, and `what can I do?` return identical text; the text
     names each category, carries each verb's description, and groups by tier.
   - `jump` and `touch <thing>` return `[OK]`; `jump <non-climbable>` returns
     `[RULE_VIOLATION]`; `touch` under `inspection` in the help body.
2. `holonovel/scripts/test-output-contracts.ts`, T240 (extend `:1438`): `look`
   returns the room name first, the verbatim description next, and a final line
   beginning `Exits:`; the description contains no `Exits:`.
3. `holonovel/scripts/test-output-contracts.ts`, T333: `verbs` output is
   byte-identical to `help`; the body groups by tier and carries per-tier
   counts.
4. `holonovel/scripts/test-world-provider.ts`, T245: `world://kinds` carries a
   `read_text` property row.
5. `holonovel/scripts/test-backfill.ts`, T365 (`:788`): `throw rock at guard`
   in the same room leaves the rock in that room and out of inventory;
   `throw rock at stranger` where the stranger is in another room records
   `[WARNING]` and deposits in the current room; `give sword to stranger`
   returns `[WARNING]` and keeps the sword.
6. All new assertions must fail on the current tree; the exact failure output
   goes into `aar.md`.

### Phase 2 — Catalog and parser (M)

`holonovel/src/world/model.ts`:

- Add `PARSER_CATALOG` (D1) with every dispatched verb, the narrative verbs,
  `touch` (inspection), and `jump`; derive `BASE_PARSER_COMMANDS`,
  `CORE_VERBS`, `STANDARD_VERBS`, `VERB_PROPERTY`, and `verbCatalog` from it.
- Add the `read_text` contract row (D9).
- `worldKinds()` renders category, args, description, and tier from the
  catalog.

`holonovel/src/world/parser.ts`:

- Unknown-verb default (A): `[UNIMPLEMENTED]` with the three nearest verbs
  (D3), filtered through `ctx.badge` and a new `ctx.rulesetBound` flag.
- `handleTake` (B): widen the take-resolution candidate set so
  closed-container contents resolve and the existing rule-violation branch
  fires (D4).
- Ambiguity (C): structured `disambiguation` result, `[OK]` prefix, numbered
  matches with `thingRoom` locations (D5).
- `handleLook` (G): exits move to `status` (D6).
- `handleJump` (E): new handler; `handleTouch` stays and gains a catalog entry.

### Phase 3 — Handlers (M)

`holonovel/src/index.ts`:

- `run_command` description sentence (D10, `:4738-4741`).
- Help renderer (D2): tier sections, category blocks, descriptions, aliases
  `help` / `commands` / `what can I do?` / `verbs`; narrative note.
- Ambiguity selection (D5): session-local record, numeric reply substitution,
  clearing on any non-numeric command.
- Narrative verbs (D8): room-scoped NPC resolution for `give`/`show`; `throw`
  matched-target room with current-room miss fallback and `[WARNING]`.
- Pass `rulesetBound`/badge context into the parser for D3's filter.

### Phase 4 — Spec alignment (M)

1. Apply the four D12 edits, walking the Appendix M authoring checklist for
   each amended REQ; record post-edit body counts.
2. `spec/appendices-reference.md`: widen T239 (unknown-verb pattern and
   nearest-3, closed-container take, numbered disambiguation and selection,
   help categories/aliases, jump/touch under inspection), T240 (exits status
   line), T245 (`read_text` contract row), T333 (help/verbs identity, tier
   grouping, per-tier counts), T365 (current-room NPC scoping, throw deposit,
   `[WARNING]` on an unmatched target). T363 is not touched.
3. `npm run validate --sdd-strict`; any shape error stops the run.
4. No other REQ body changes are expected; if one becomes necessary, apply
   Appendix M and record the deviation in `aar.md`.

### Phase 5 — Regeneration and bookkeeping (M)

1. `npx tsx holonovel/scripts/generate-world-provider.ts` (edit the template
   first only if Phase 0.8 found it necessary), then
   `npm run check-world-provider`; `npm run test:world-provider`.
2. `npx tsx holonovel/scripts/generate-tool-definitions.ts`, then
   `npm run check-tool-definitions-sync`, `tool-definitions-lint`,
   `check-tdqs-scoreboard`, `surface-budget` (`-- --write` only if the
   footprint moved).
3. `spec/audit/review-register.md`: move F-P6a-7, F-P6a-11, and F-P6a-17 to
   `## Resolved — 2026-11-10 §5.10 parser and help contracts` with post-change
   predicates; leave F-P6a-8, F-P6a-9, F-P6a-10, F-P6a-12, F-P6a-13, and
   F-P6a-14 in `## Scheduled-roadmap`.
4. `ROADMAP.md`: delete the first bullet of the §5.10 section and rewrite the
   `**Trigger:**` line to name the two remaining bullets and close when
   F-P6a-8/9/10 and F-P6a-12/13/14 are Resolved; keep the admission shape.
5. `npm run validate -- --write-register`; `npm run check-registers`.
6. `CHANGELOG.md`: new top heading
   `## 2026-11-10 — §5.10 parser and help contracts`, naming the D12 clause
   amendment in its bullets.
7. `npm run build-order`.

### Phase 6 — Verify and close (S)

Run the commands in §7, write `aar.md` (token per the outcome), then
`npm run session:close`.

## Files expected

- `holonovel/src/world/model.ts`
- `holonovel/src/world/parser.ts`
- `holonovel/src/index.ts`
- `holonovel/scripts/test-backfill.ts`
- `holonovel/scripts/test-output-contracts.ts`
- `holonovel/scripts/test-world-provider.ts`
- `holonovel/narrative_world_model/world/world-model-provider.md`
- `holonovel/narrative_world_model/world/world-model-provider.template.md`
  (only if Phase 0.8 finds a template edit necessary)
- `holonovel/tool-definitions.json`
- `holonovel/tool-surface-registry.json`
- `holonovel/src/generated/contract-fingerprints.ts` (only if a fingerprinted
  section is touched; §5.1, §5.10, and Appendix F are not in `DATA_SECTIONS`)
- `spec/02-requirements.md` (REQ-002a1, REQ-002a2, REQ-002b1 — D12)
- `spec/appendices-reference.md` (T239, T240, T245, T333, T365, Appendix O.2)
- `spec/audit/review-register.md`
- `spec/audit/req-coverage.md`
- `spec/audit/tool-surface-baseline.json` (only if the budget moves)
- `holonovel.md`, `holonovel/holonovel.md` (assembled)
- `ROADMAP.md`
- `CHANGELOG.md`
- `docs/plans/2026-11-10-5-10-parser-help-remediation/{plan,tasks,aar}.md`

## 6. Blast radius and rollback

| Surface | Change | Size |
|---|---|---|
| `holonovel/src/world/model.ts` | one catalog, derived exports, `read_text` row | M |
| `holonovel/src/world/parser.ts` | unknown verb, take reachable-set, ambiguity, look status, jump/touch | M |
| `holonovel/src/index.ts` | help renderer, aliases, ambiguity selection, narrative scoping, description sentence | M |
| `holonovel/scripts/test-backfill.ts` | T239, T365 widened | S |
| `holonovel/scripts/test-output-contracts.ts` | T240, T333 widened | S |
| `holonovel/scripts/test-world-provider.ts` | T245 widened | S |
| `holonovel/narrative_world_model/world/world-model-provider.md` | regenerated from the catalog | S |
| `holonovel/tool-definitions.json`, `holonovel/tool-surface-registry.json` | regenerated after the description edit | S |
| `spec/02-requirements.md` | three sub-REQ bodies (D12), measured against 800 chars / 8 sentences | S |
| `spec/appendices-reference.md` | five widened Appendix F rows + one Appendix O.2 row | S |
| `spec/audit/review-register.md` | three findings moved to Resolved | S |
| `spec/audit/req-coverage.md` | refreshed by `validate -- --write-register` | S |
| `ROADMAP.md`, `CHANGELOG.md` | bullet removed, dated heading added | S |
| `holonovel.md`, `holonovel/holonovel.md` | assembled from `spec/` | S |
| `holonovel/src/generated/contract-fingerprints.ts`, `spec/audit/tool-surface-baseline.json` | rewritten only if a fingerprinted section or the surface budget moves (Phase 0.4 / Phase 5.2) | — |

Rollback cost 1: every edit is a reversible source or spec edit; no Novel
schema changes and no migration is written to disk.

## 7. Verification

| Step | Command | Expectation |
|---|---|---|
| Red tests | the three harnesses, pre-fix | each new assertion fails (recorded) |
| Targeted harnesses | `npm --prefix holonovel run test:backfill`, `test:output-contracts`, `test:world-provider`, `test:adventure`, `test:narrative` | exit 0 |
| World provider | `npm run check-world-provider`, `npm run test:world-provider` | PASS, byte-identical |
| Tool surface | `check-tool-definitions-sync`, `tool-definitions-lint`, `check-tdqs-scoreboard`, `surface-budget` | PASS |
| REQ shape | `npm run validate --sdd-strict` | 0 errors; D12 bodies under 800 chars / 8 sentences |
| Assembled spec | `npm run assemble` | exit 0 |
| Fast gates | `npm run check:fast` (un-piped) | exit 0, `check:fast: PASS` |
| Full gates | `npm run check` | 0 errors |
| Registers | `check-registers`, `check-roadmap`, `check-traceability`, `check-loop-artifacts` | PASS |
| Conformance | `npm run check:conformance` | baseline recorded in Phase 0; the post-change run is the check (its PASS is an assumption until then) |
| Full pipeline | `npm run build-order` | completes |
| Close | `npm run session:close` | one commit |

## 8. Risks, edge cases, assumption audits

- **Nearest-verb determinism.** Levenshtein over a static list is
  deterministic; tie-break on alphabetical order so the output is byte-stable
  for the same tree.
- **Badge leakage.** REQ-309b forbids the Player badge from seeing parser verb
  names in tool output; Phase 1 asserts the filtered set, and the eligible set
  always holds at least three verbs.
- **Ambiguity state staleness.** A numeric reply after the record is cleared
  must not re-run a stale command; Phase 1 asserts clearing. The substitution
  rule (first occurrence of the resolved target) is specified in D5 so an
  implementer does not invent it.
- **Catalog duplication risk.** Deriving every export from `PARSER_CATALOG`
  must keep `args`/`effect` (`test-world-provider.ts:67-70`), preserve the core
  tier count (7), and keep every dispatched verb reachable.
- **Template drift.** If `world-model-provider.template.md` hardcodes the
  parser-command block, Phase 0.8 records it and Phase 5.1 edits the template
  in the same change; the freshness gate then passes deterministically.
- **Tool-description score drift.** Adding a sentence can move a TDQS sub-score;
  `check-tdqs-scoreboard` and `tool-definitions-lint` run after regeneration,
  and `surface-budget --write` is used only when the footprint moves.
- **Fingerprint expectation.** §5.1, §5.10, Appendix F, and Appendix T are
  outside `DATA_SECTIONS`/`PACKAGE_SECTIONS`; `check-fingerprint-sync` is
  expected to pass unchanged. A fingerprint change means an out-of-scope
  section was edited — stop and investigate.
- **Spec body budget (D12).** Pre-edit counts measured this session (REQ-002a1
  497 chars / 3 sentences; REQ-002a2 324 chars; REQ-002b1 445 chars). Post-edit
  counts are re-measured and recorded; a breach is trimmed before commit, not
  waived.
- **Cross-roadmap touch.** D12 edits §5.1 bodies that the trust-core roadmap
  item also reviews. The CHANGELOG entry names the amendment so the next review
  pass sees it; no roadmap item is retired or re-scoped.
- **No new gate.** No check is installed, so no false-positive budget applies;
  the reused gates are listed in §7.

## 9. User impact

Four caller-visible output changes, all required by the named REQs:

1. An unknown parser verb now returns `[UNIMPLEMENTED]` with the three nearest
   commands instead of `[NOT_FOUND]` with a fixed `Try:` list (REQ-196c).
2. An ambiguous object reference now returns `[OK] Which thing?` with a
   numbered, location-bearing list and accepts a numeric reply, instead of
   `[ERROR] [AMBIGUOUS]` with an unnumbered list (REQ-196e).
3. `look` prints exits as a trailing status line rather than inside the
   description body (REQ-197a).
4. `give`/`show` no longer match an NPC in another room, and a `throw` at an
   unmatched target records `[WARNING]` (REQ-320b/c).

`help` gains categories, descriptions, tier grouping, and three aliases; no
tool is renamed, no parameter changes, and no persisted state shape changes. A
Novel saved before this increment loads unchanged (the `read_text` row is
catalog metadata).

## 10. Open questions

None. The user chose the split on 2026-11-10 (this bullet; hints/vehicles and
resources/CRUD stay scheduled). The two contract conflicts are resolved in-plan
by D5 (parser prompt versus the `[AMBIGUOUS]` taxonomy) and D12 (parser
vocabulary versus the `[UNIMPLEMENTED]` waiver rule).
