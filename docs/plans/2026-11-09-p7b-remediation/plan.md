# Plan — §5.2/§5.8 behaviour remediation (F-P7b-1…-7, -9)

Status: revised after cold review FAILED · Kind: planned · Depth: standard
Increment: `docs/plans/2026-11-09-p7b-remediation/`

## 0. Revision note

Cold pass 1 raised 3 blockers, 6 majors, 4 nits. This revision:
- removes the done-bar escape hatch (T288 is committed work, not optional);
- extends the lore design to sticky decay (REQ-155a/b), presence gating
  (REQ-083f), world targets and the `[world]` tag (REQ-328a/b), and the
  briefing-order `lore` token;
- names the generated/documented surfaces the schema and resource changes move;
- makes the budget unit and T83 runtime clause explicit (row correction);
- designs confidence-tag rendering, not just data;
- fixes the table-enum two defects, the scaffolding gate, and the
  assemble/version ritual.

## 1. Objective

Implement the eight behaviours the 2026-11-09 assertion-repair session proved
absent and close the findings with passing harness evidence.

**Done bar** (no conditional clauses)

1. F-P7b-1…-7 and -9 are `Resolved` in `spec/audit/review-register.md`, each
   with an exercising test title and a `file:line` predicate.
2. The roadmap section `§5.2/§5.8 assertion and behaviour remediation (P1)` is
   retired.
3. `npm run validate -- --write-register` reports 0 bucket-A gaps;
   `check-registers`, `check-loop-artifacts`, `check:fast` pass.
4. All touched harnesses pass: `test:output-contracts`, `test:narrative`,
   `test:backfill`, `test:tool-definitions`, `test:surface-guards`.
5. `npm run build-order` completes, and the CalVer/AGENTS/DECISIONS/index/
   lockfile/server.json set advances with it.

## 2. Verified baseline

- HEAD `1fd3176`, clean tree, 22 unpushed; `check:fast` PASS (37/37).
- `test:backfill` 82 passed; `test:narrative` 69 passed.
- Verified predicates: `index.ts:8006` (empty `entity_ids`), `:887-912`
  (shared-only lore in knowledge state), `:6933` (default `gm_only`),
  `core/state.ts:1000,1052` (`maxLoreTokens` unconsumed), `:3128-3151`
  (no sheet known-information), `:4054` (JSON sheet path uses
  `entitySheetJson`), `:13568` (static `DEFAULT_WISDOM`), `:6185` (closed
  scene enum), `:2296-2307` (else-if families), `:4609-4611` (suggest
  fallback), `:7940` (static table param), `:2185` (table merge),
  `spec/audit/tool-surface-baseline.json` (surface budget baseline),
  `holonovel/AGENTS.md:46` (resource/template counts).
- `TTRPG_MAX_LORE_TOKENS` already has its config row (`spec/04-runtime.md:178`);
  no config-surface addition is needed.
- Appendix F is outside the fingerprinted section set; the T63/T83 row edits do
  not touch `contract-fingerprints.ts`.

## 3. Work items

### 3.1 F-P7b-1 — story journal attribution (S)

- **File:** `holonovel/src/index.ts` (record handler, `:7989-8010`).
- **Design:** `entity_ids` = `[activeId]` when an active entity is set, else
  `characters_present_ids`, else `[]`; `scene_anchor`, timestamp, `room_id`
  unchanged.
- **Test:** `T282` in `test-output-contracts.ts`: record; `entity_ids`
  contains the active entity; ISO timestamp; anchor; undo does not reverse;
  export carries `story_journal`; Player `[FORBIDDEN]`; invalid type enumerates
  values; recap `story_entries` ≤ 10; briefing `story` token; end clears.

### 3.2 F-P7b-2 — lore surface (L)

- **Files:** `holonovel/src/index.ts`, `holonovel/src/core/state.ts`,
  `spec/appendices-reference.md` (T83 row).
- **Design:**
  1. `manage_scene (action: set)` decays `sticky_remaining` for enabled entries
     whose triggers no longer match and resets it to `sticky` on re-match
     (REQ-155a/b); reads never decay.
  2. `composeLoreSection(novel, badge)` renders triggered entries:
     - activation = keyword match in scene text, OR `sticky_remaining > 0`, OR
       `world_target` resolves to the active entity's room, the scene location,
       or a thing located in the current room (REQ-328a without new persisted
       state);
     - visibility: GM all; Player/observer `shared` and `player_discovered`;
     - `gm_only`/`player_discovered` additionally require a knowing entity in
       `characters_present_ids` (REQ-083f);
     - ordered by `priority` desc then key; world-targeted rows carry
       `[world] <target>` (REQ-328b);
     - rendered whenever it has content (the current composer is not gated by
       `briefing_order`; `spec_health.section_tokens` at `index.ts:12262` is
       reporting, not a render predicate — no new gate is built here).
  3. Budget: `TTRPG_MAX_LORE_TOKENS` caps the section. `maxLoreTokens` is
     consumed at render: rows are admitted in order while
     `ceil(chars/4)` stays within budget; the remainder is omitted.
     `spec_health` gains `lore_budget: { max_tokens, used_tokens,
     omitted_entries }` (null budget → `used` reported, `omitted` 0).
     Appendix F T83 is corrected: the "adjustable at runtime" clause is
     removed (REQ-083 defines only configuration, not a runtime setter).
  4. `lore://groups` resource returns `{ group: [keys] }` for grouped entries,
     badge-filtered, plus its `resources/templates/list` entry.
  5. `manage_lore (action: suggest)` returns a JSON array of at most 5 rows
     `{ key, content (≤120 chars), triggers, confidence, source_url,
     badge_scope }`; GM sees all scopes, Player excludes `game_master`
     (REQ-083b); no-synthesis returns the existing guidance note.
- **Tests:** `T67`, `T79`, `T81`, `T82`, `T83` in `test-narrative.ts`; `T83`
  boots with `TTRPG_MAX_LORE_TOKENS=40`; sticky decay asserted through
  `manage_scene` only (read twice, no change).
- **Risk:** world-target activation is computed from location/thing placement,
  not a per-interaction log (REQ-328a names examine/enter/navigate). This is a
  recorded normative substitution: it lands in `holonovel/DECISIONS.md` under
  accepted tradeoffs with the governing REQ-328a, and the test comment points
  at it — not a comment-only divergence.

### 3.3 F-P7b-5 — sheet known information (S)

- **Files:** `holonovel/src/index.ts` (`fmtEntitySheet`, `entitySheetJson`,
  `case "sheet"`).
- **Design:** both renderers gain a known-information view: secrets whose
  `known_by` contains the entity id, and `player_discovered` lore known by the
  entity. Omitted when empty.
- **Test:** `T274` in `test-narrative.ts`.

### 3.4 F-P7b-3 / F-P7b-7 — synthesis provenance, confidence, auto-activation
(L)

- **Files:** `holonovel/src/index.ts`, `holonovel/src/core/wisdom.ts`,
  `spec/appendices-reference.md` (T63 row).
- **Design:**
  1. Every synthesis item row (`manage_synthesis (action: list)`) and every
     `synthesis://` resource row carries `collected_at` from the manifest
     timestamp, so a rerun refreshes all items together.
  2. Confidence tags are rendered, not only stored: rows and resources compose
     the tag as `[supplementary] [LOW]` / `[supplementary] [MEDIUM]` (tag
     first, confidence second), HIGH items carry no confidence tag, and LOW
     items sort after HIGH/MEDIUM inside their module (T95).
  3. `run` appends Novel-derived items after the static defaults:
     - per entity/NPC with `personality.voice` or `personality.description`, a
       `voice_examples` item `{ confidence: "MEDIUM", tag: "supplementary",
       source_url: "novel://<id>" }`;
     - when the story journal is non-empty, one `supplementary_guidance` theme
       item `{ confidence: "LOW", tag: "supplementary",
       source_url: "novel://story_journal" }`.
     Deterministic (sorted by id), additive only, mechanics untouched.
  4. Adventure synthesis surfacing (T288): when synthesis is active, `load`
     computes the ruleset-native (`ruleset`/`vendor` tag) `voice_examples`
     whose `entity_name`/`name` matches an adventure-index NPC and renders them
     in a briefing `### Adventure synthesis` section; the section is absent
     when nothing matches. Tier 1 is active by default (REQ-260e), so this is a
     **derived view — nothing is written to `novel.synthesis_activated`**. The
     load response adds two lines: `Synthesis: N item(s) active for this
     adventure` and, when inert community items exist (`supplementary`/`player`
     tags), `Community synthesis items: M inert — activate with
     manage_synthesis (action: activate)`.
  5. Appendix F T63 is corrected to REQ-080g2's split: synthesis-sourced items
     carry `[supplementary]`, ruleset-native items carry `[ruleset]`/`[vendor]`.
- **Tests:** `T63`, `T95`, `T97`, `T102`, `T288`, `T325` in `test-backfill.ts`;
  `T102` boots with `TTRPG_SYNTHESIS_STALE_DAYS=0`; `T288` seeds an adventure
  whose index names an NPC matching a seeded voice example.

### 3.5 F-P7b-4 — scene catalog and multi-type priority (M)

- **Files:** `holonovel/src/index.ts` (`manage_scene` schema/handler,
  `availableActionsSection`), `holonovel/tool-definitions.json` (regenerated).
- **Design:**
  1. `scene_type` becomes `z.union([z.string(), z.array(z.string())])`; the
     handler validates against the resolved catalog — default
     `combat|social|exploration|neutral` plus `ruleset.model.scene_types`
     strings when present. Unknown → `[ERROR] [NOT_FOUND]` naming the catalog;
     duplicates collapse; `[]` clears.
  2. `availableActionsSection` evaluates combat, social, and exploration
     families independently (no `else if`), so a combined tag contributes both
     families before unmatched entries.
- **Tests:** `T135`, `T71` in `test-backfill.ts`.
- **Note:** `model.scene_types` is not currently emitted by any in-tree
  package; the resolver reads it when present and otherwise uses the default
  catalog, which is the behaviour both tests exercise.

### 3.6 F-P7b-6 — suggestion and capability gating (M)

- **File:** `holonovel/src/index.ts` (`availableActionsSection`, suggest).
- **Design:**
  1. When the active entity has `spells` (objects `{name, level}` or bare
     names = level 0), emit `Cast <name>` for each spell whose level has a
     positive value in `entity.stats.spell_slots` (`{"3": 1}`); bare names and
     level-0 spells are always legal. `manage_character (action: update)`'s
     existing `stats` shallow-merge is the spending mechanism.
  2. Suggest: a non-empty intent matching no domain returns
     `[OK] No matching actions for "<intent>".` (no spatial fallback); empty
     intent keeps the contextual fallback (T68).
- **Tests:** `T359`, `T68` in `test-backfill.ts`.

### 3.7 F-P7b-9 — table classification (M)

- **Files:** `holonovel/src/index.ts` (tools/list wrapper, roll handler).
- **Design:**
  1. In `installBadgeFilteredToolList`, when the active Novel is bound, patch
     `resolve_mechanic.inputSchema.properties.table` to
     `{ type: "string", enum: [...Object.keys(model.generation_tables)] }`.
     With zero tables the property keeps the permissive `string` (no empty
     enum; the runtime refusal preserves the "no random generation tables"
     message). The enum derives from `generation_tables`, the same source the
     roll handler validates against; the fixture places all tables there.
  2. The roll handler refuses a name outside the generation set with
     `[NOT_FOUND]` naming the valid tables.
- **Tests:** `T255` in `test-backfill.ts` using the `seedPackage` pattern from
  `test-competitive-gaps.ts` (trinkets, madness, equipment d100 under
  `generation_tables`; a lookup name refuses; a zero-table package returns the
  no-tables message). The D&D 5e build clause is exercised by fixture
  substitution; the test comment and the register record why.

## 4. Scaffolding and ritual (every commit)

1. `docs/plans/2026-11-09-p7b-remediation/{plan,tasks,aar}.md` exist **before
   the first commit**; the AAR opens with `LOOP OPEN` and is rewritten to its
   final token in the last commit (satisfies `check-loop-artifacts` for every
   intermediate commit).
2. After schema/resource changes: regenerate tool definitions
   (`npx tsx holonovel/scripts/generate-tool-definitions.ts`), then
   `npm run surface-budget -- --write` and update the recorded budget line in
   `holonovel/DECISIONS.md`; update `holonovel/AGENTS.md:46` resource/template
   counts.
3. Spec-row edits: `npm run assemble`, then `npm run build-order` (propagates
   `holonovel/holonovel.md`, refreshes fingerprints, version sync).
4. Registers: `npm run validate -- --write-register` before each commit.

## 5. Commit plan

| # | Scope | Findings | Must pass |
|---|---|---|---|
| 1 | story journal, lore surface, sheet | F-P7b-1, -2, -5 | `test:output-contracts`, `test:narrative`, `check:fast`, `build-order` (T83 row edit) |
| 2 | synthesis provenance/confidence/auto-activation | F-P7b-3, -7 | `test:backfill`, `check:fast` |
| 3 | scene catalog, actions, suggestions | F-P7b-4, -6 | `test:backfill`, `test:tool-definitions`, `check:fast` |
| 4 | table classification | F-P7b-9 | `test:backfill`, `check:fast`, `build-order` |

Roadmap bullets are removed in the commit that closes their finding; if that
leaves the section empty the section is deleted there. Registers move the same
way.

## 6. Verification

| Step | Command | Pass |
|---|---|---|
| Harnesses | `npm --prefix holonovel run test:output-contracts`, `test:narrative`, `test:backfill` | exit 0 |
| Tool surface | `test:tool-definitions`, `test:surface-guards`, `check-tool-definitions-sync`, `surface-budget` | exit 0 |
| Registers | `check-registers`, `check-loop-artifacts` | exit 0 |
| Full | `npm run assemble && npm run check:fast` (unpiped) | `check:fast: PASS` |
| Sync | `npm run build-order` | exit 0 |
| Close | `npm run session:close` (per commit) | commit created |

## 7. Failure handling

- Test still red after two fixes → stop that item, keep its roadmap bullet and
  its scheduled finding, record the new predicate. The remaining items still
  commit; the done bar is judged per finding, so a dropped item must leave the
  roadmap section non-empty. This is an abort-and-report, not a silent skip.
- Existing harness regression → fix forward inside the same commit; if it
  reveals a spec conflict, stop and record it.
- Rollback cost 1 per commit (`git revert`); no destructive or remote step.

## 8. Blast radius

| File | Change | Size |
|---|---|---|
| `holonovel/src/index.ts` | all eight designs | L |
| `holonovel/src/core/state.ts` | lore budget helper | S |
| `holonovel/src/core/wisdom.ts` | confidence/`collected_at` helpers if needed | S |
| `holonovel/tool-definitions.json` | regenerated | M |
| `spec/audit/tool-surface-baseline.json` | re-recorded | S |
| `holonovel/DECISIONS.md` | budget/count line; REQ-328a world-target substitution | S |
| `holonovel/AGENTS.md` | resource/template counts | S |
| `holonovel/scripts/test-output-contracts.ts` | T282 | M |
| `holonovel/scripts/test-narrative.ts` | T67, T79, T81, T82, T83, T274 | L |
| `holonovel/scripts/test-backfill.ts` | T63, T95, T97, T102, T288, T325, T135, T71, T359, T68, T255 | L |
| `spec/appendices-reference.md` | T63 and T83 row corrections | S |
| `holonovel.md`, `holonovel/holonovel.md` | assembled + propagated | S |
| `spec/audit/review-register.md` | 8 findings Resolved | M |
| `spec/audit/req-coverage.md` | regenerated | M |
| `ROADMAP.md` | section retired | S |
| `CHANGELOG.md` | four entries | S |
| `docs/plans/2026-11-09-p7b-remediation/{plan,tasks,aar}.md` | increment artifacts | S |

## 9. Alternatives considered

- **Split T288 into a new finding** — rejected: the done bar must be
  unconditional and the row is implementable with the seeded fixture.
- **Add a runtime budget setter** — rejected: REQ-083 closes the lore action
  enum; the T83 clause is corrected instead.
- **New tool for spell slots** — rejected: `manage_character (action: update)`
  already merges `stats`.
- **Empty enum for zero-table rulesets** — rejected: unsatisfiable schema;
  keep the permissive string plus the runtime refusal.
