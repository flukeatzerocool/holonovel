## 11. Synthesis

_This workflow does not gate the Definition of Done. It extends the Build workflow._

After Synthesis completes, re-run the Pattern Buffer blocking sub-workflows (§6.6 exit
criteria) and verify no regression. A previously-passing blocking sub-workflow that now
fails is a defect that must be resolved
before handoff. Record re-verification results in DECISIONS.md.

Ruleset Wisdom (ruleset-native + vendor) is extracted at build time per REQ-225 and is
always present in the Novel — it is not subject to synthesis reversion. Synthesis is an
optional, default-off workflow that may be run after Build completes and all verification
workflows pass (§8), adding content to the Novel from two sources: external (web-sourced
play advice) and internal (Novel state analysis). At intake (§6.2), the Synthesis
workflow defaults to "no." Build alone produces a fully working server with Ruleset
Wisdom; synthesis adds supplementary content to every module. Synthesis items carry
`[supplementary]` tag and never replace Ruleset Wisdom items (REQ-080).

### 11.1 External synthesis

**Research requirements.** Search the web for ruleset-specific play advice across all
selected source types (E2). Research depth is deep — at minimum:

- **5 distinct source domains** across all selected source types.
- **3 substantive pages** of extracted content per source type (≥500 words each after
  stripping boilerplate).

A source type that returns zero results is recorded as a finding with the "empty"
disposition and does not block completion. Failure or empty results leave the server
unchanged; all synthesis content is additive.

A source-domain shortfall — fewer than 5 distinct domains returning non-empty results
across all source types — is recorded with the "incomplete" disposition and does not
block handoff. The builder may supplement the research with: (a) synthesis content
retained from prior Build cycles that carries verified source URLs, (b) pages fetched
from pre-seeded, known-TTRPG-community domains listed in the intake answers, or (c)
an accepted limitation with re-activation conditions: a target date and a domain
threshold (e.g., "re-run when ≥3 new domains are reachable"). An incomplete
disposition requires a supplement source audit in DECISIONS.md (6) listing which
modules drew from supplemental content and which are from live research.

### 11.2 Internal synthesis

The server analyzes the active Novel's state — NPCs, lore entries, the story journal,
scene history, factions, secrets, relationships, countdowns, and world-model
(rooms and things) — and produces synthesis items across the seven output modules.
Synthesis is stateless — it reads the current Novel state and produces items. A
`synthesis_fingerprint` hash of the novel state prevents wasteful re-synthesis when
nothing has changed.

**Auto-trigger.** When `TTRPG_SYNTHESIS_AUTO_TRIGGER` is set to
`on_session_start` or `on_scene_change`, synthesis triggers automatically per
REQ-264. Auto-triggered items are inert (inactive by default). The GM must
explicitly activate them via `synthesis (action: activate)` (REQ-260).

**Source inputs.** The synthesis tool analyzes seven categories of Novel state.
Each category maps to specific output modules:

| Source category | Analyzed state | Output modules |
|---|---|---|
| NPCs | name, description, disposition, goals, personality fields (REQ-075, REQ-077), voice examples (REQ-077) | voice_examples, supplementary_guidance, action_patterns |
| Lore entries | key, content, triggers, badge_scope, group assignments (REQ-083) | lore_templates, supplementary_guidance |
| Story journal | type, entry text, timestamp, scene_anchor, entity_ids (REQ-246) | narrative_voices, supplementary_guidance, adventure_advice |
| Scene history + current scene | description, location, time_of_day, atmosphere, scene type (REQ-076, REQ-087) | adventure_advice, supplementary_guidance, briefing_order |
| Factions + secrets + relationships | faction state (REQ-233), secret knowledge status (REQ-234), relationship objects (REQ-236) | supplementary_guidance, lore_templates |
| Countdowns | name, remaining ticks, type, scope, direction (REQ-072, REQ-073) | supplementary_guidance, adventure_advice |
| Rooms + Things | room name, description, exits, contained things; thing name, description, properties, location (REQ-195, REQ-198) | adventure_advice, lore_templates |

**Synthesis rules.** For each source category, the builder applies
category-specific heuristics:

1. **NPC → voice_examples.** When an NPC has populated personality fields
   (description, voice, goals), extract up to 3 dialogue snippets per NPC
   matching the voice description. Snippets SHALL be short (one to three
   sentences) and keyed to the NPC's goals or disposition. Snippets carry a
   context tag derived from the NPC's disposition or current scene.

2. **NPC → supplementary_guidance.** When a Novel has more than 5 NPCs, produce
   an NPC spotlight recommendation — which NPCs have not been referenced in
   recent story journal or scene history entries, which have unresolved
   disposition changes, which have goals that intersect current scene content.

3. **Lore → lore_templates.** Cross-reference lore entries for name overlap
   with NPCs, factions, or other lore entries. When two lore entries reference
   the same name or concept, produce a connecting template suggesting a
   relationship or shared narrative arc. Up to 5 cross-reference suggestions
   per synthesis pass.

4. **Story journal → narrative_voices.** Analyze the most recent 10 story
   journal entries for recurring themes (betrayal, discovery, sacrifice,
   alliance), recurring emotional tones, and narrative pacing patterns. Produce
   a single narrative voice profile synthesizing the detected themes with a
   one-paragraph description.

5. **Scene history → adventure_advice.** When the Novel has 3 or more distinct
   scene anchors in the audit log or story journal, produce one scene hook
   suggestion per unresolved thread — an entry in the story journal tagged
   `decision` without a corresponding `consequence` entry involving the same
   entity IDs, or a lore entry whose trigger keywords have not appeared in
   recent scene text.

6. **Factions + secrets → supplementary_guidance.** When two factions share a
   secret (both named in a secret's `known_by` list), produce a tension note.
   When a secret has no `known_by` entries, produce a revelation opportunity
   suggestion. When a relationship (REQ-236) has a `type` of `hostile` or
   `suspicious` and no associated secret, produce a "create a secret" suggestion.

7. **Countdowns → supplementary_guidance.** When a countdown has 1 tick
   remaining, produce an urgency warning. When two countdowns share the same
   scope or direction, produce a tension note linking them. When a Novel has no
   countdowns but has active factions, produce a countdown suggestion.

8. **Rooms + Things → adventure_advice.** When a Novel has 3 or more
   populated rooms with exits forming a connected graph, produce one
   scene-hook suggestion per room referencing its description, exits, and
   notable contents — "The Hall of Statues (3 exits: north to Crypt, east
   to Gallery, west to Armory) — a confrontation here blocks three paths."
   **Rooms + Things → lore_templates.** When a thing carries descriptive
   text via `readable`, `description`, or `read_text` with named entities
   (capitalized proper nouns), produce a lore template linking the named
   entity to the thing's room. Up to 3 suggestions per synthesis pass from
   this source across both output modules combined.

### 11.3 Output modules

Every item across all seven modules records a `collected_at` ISO 8601
timestamp, enabling staleness detection. The timestamp is surfaced in synthesis resource
output.

1. **Voice examples.** Up to 5 example dialogue snippets per entity type. Each records:
   `text` (the dialogue), `context` (situation tag), `source_url` or `source` (for internal
   items), and `confidence`. Stored at `synthesis://voice_examples`. The GM activates them
   via `character (action: voice)` (REQ-077).

2. **Prompt ordering.** A single recommended ordering of `badge_briefing` section
   tokens. Every token in the recommendation SHALL appear in the builder-documented
   section token vocabulary (REQ-185). The recommendation MAY omit tokens — omitted
   tokens follow their builder-default position after the listed tokens. Tokens not
   in the vocabulary are invalid and the synthesis module SHALL NOT produce them.
   Stored at `synthesis://briefing_order`. **Inert** — visible in `spec_health`,
   never auto-applies. The GM must explicitly call `session (action: briefing_order)` (REQ-082) to
   use it.

3. **Lore templates.** Up to 3 seed entries per major ruleset setting keyword, 30 entries
   total. Each records: `key` (slug), `content` (Markdown), `triggers` (keyword array),
   `badge_scope`, `source_url` or `source`, and `confidence`. Stored at `lore://templates`.
   **Inert** — the GM must explicitly activate them via `lore (action: set)` (REQ-083).

4. **Action patterns.** Up to 10 patterns mapping common player intents to ruleset-legal
   actions. Each records: `intent` (natural-language string), `suggested_actions` (array of
   ruleset tool names), `source_url` or `source`, and `confidence`. They supplement the
   `command (action: suggest)` (REQ-084) matching index. **Inert** — the GM must explicitly
   activate them via a Novel-scoped toggle before they appear in `command (action: suggest)`
   results. Unactivated patterns are visible at `synthesis://action_patterns` for
   review.

5. **Supplementary guidance.** Up to 20 items. Appended to `badge_briefing` with
   `[supplementary]` tag, source URL or source, and confidence. Includes the expanded badge
   foundations catalogue (REQ-062) and the full anti-slop catalogue (REQ-070), both served
   at their respective guidance URIs.

6. **Adventure advice.** Up to 30 items covering adventure templates (five-room dungeon,
   node-based design, three-act arc), random table expansions (community encounter, treasure,
   and NPC tables), and genre/scenario starters (premise seeds categorised by genre: horror,
   mystery, heist, sandbox). Each item records: `category` (adventure_templates,
   table_expansions, or scenario_starters), `content` (Markdown), `source_url` or `source`,
   `confidence`, and `badge_scope`. Stored at `synthesis://adventure_advice`. **Inert**
   — the `adventure (action: generate)` and `adventure (action: generate_encounter)` tools (REQ-090, REQ-091) may draw
   from this module to seed scaffolds, but the content never auto-applies.

7. **Narrative voice profiles.** Up to 15 items. Ruleset Wisdom items
   extracted during Discovery per REQ-226 already populate the module. Each item
   records: `name` (e.g., "Sword & Sorcery — Conan"), `media_title`, `media_type` (film,
   novel, game), `description` (narrative techniques from the source material),
   `source_url` (for external items; ruleset-native items carry `source` anchor), and
   `confidence`. Stored at `synthesis://narrative_voices`. **Inert** — the GM applies a
   profile via `scene (action: directive)` (REQ-081) by naming the profile. External
   items tagged `[supplementary]`; ruleset-native items tagged `[ruleset]`.

**Boundaries.** Synthesis may ADD to: entity voice_examples, prompt ordering
recommendations, lore templates, action suggestion patterns, adventure advice, narrative
voice profiles, and supplementary guidance.
Synthesis MUST NOT modify: mechanical fields (stats, saves, HP, conditions, combat state),
build-derived tool registrations, badge gating rules, or any `[ruleset]` or `[vendor]`-tagged
content (REQ-080).

**Badge scope assignment.** During external research, the builder assigns `badge_scope` by
these rules, applied in order: (1) if the source material is explicitly addressed to
Dungeon Masters/Game Masters (imperative "tell your players," "set the scene," "describe
the monster"), scope is `game_master`; (2) if addressed to players ("your character,"
"at the table," "talk to your DM"), scope is `player`; (3) if the advice applies to all
participants or is ambiguous, scope is `shared`. For internal synthesis, item badge scope
defaults to `game_master` — they are GM prep aids by nature. The GM may override scope
per REQ-265. Overridden items retain the original scope as `auto_scope` for
audit. The builder records scope overrides in the synthesis manifest.

**Budgets.** Caps prevent unbounded state growth. External synthesis follows the spec
minimums; internal synthesis has per-pass limits and total Novel caps:

| Output module       | External cap              | Internal per-pass cap | Total Novel cap |
| ------------------- | ------------------------- | --------------------- | --------------- |
| Voice examples      | 5 per entity type         | 3 per NPC             | 50              |
| Prompt ordering     | 1 (single recommendation) | 1                     | 1               |
| Lore templates      | 3 per keyword, 30 total   | 5                     | 30              |
| Action patterns     | 10 total                  | 5                     | 10              |
| Supplementary guidance | 20 total               | 10                    | 20              |
| Adventure advice    | 30 total                  | 8                     | 30              |
| Narrative voice profiles | 15 total             | 1                     | 15              |

External caps are configurable via E4 at intake (§6.2). Overrides must be ≥ the
spec minimum shown in this table. Overrides below the minimum are rejected with a
warning and the default is used. The per-pass cap limits how many new items a single
internal synthesis pass produces. When synthesis would exceed a total Novel cap, it
produces up to the cap and records the overflow count in the synthesis result. The GM
may remove items via `synthesis (action: deactivate)` or `remove_synthesis_item` to make room.

**Confidence.** Synthesis confidence uses source authority for external items,
not mechanical completeness:

| Confidence | Source type |
| ---------- | ----------- |
| HIGH       | Designer blog/post, official publisher advice, published strategy guide |
| MEDIUM     | Curated community wiki, recognized actual-play podcast, prominent community guide — or internal items derived from explicit Novel fields |
| LOW        | Individual forum/Reddit post, personal blog, unverified source — or internal items derived from inference |

This is distinct from Build confidence (which derives from mechanical completeness per
REQ-011). The LLM sees both labels with full provenance. Internal items carry `MEDIUM`
when derived from explicit Novel fields and `LOW` when derived from inference.

**LOW-confidence budget.** After external synthesis completes its primary research pass
(HIGH and MEDIUM confidence items), it may collect up to half as many LOW
confidence items as the total HIGH + MEDIUM count. Example: 20 HIGH + MEDIUM
items permits up to 10 additional LOW items. This ensures the server captures
community metadiscussion without diluting the synthesis manifest. Collection
stops when sources are exhausted, whichever comes first.

**LOW-confidence presentation.** LOW-confidence items carry a visible `[LOW]` tag in
`badge_briefing` and in synthesis resource output, distinct from the standard
`[supplementary]` tag. Items are grouped after HIGH and MEDIUM items within their output
module. The LLM sees both tags; the `[LOW]` tag signals reduced weight in narration
decisions.

**Deduplication and conflicts.** When two synthesis findings make contradictory claims
on the same mechanical or narrative topic, both are recorded. The later collection (by
`collected_at`) carries a `conflicts_with` reference to the earlier item's key. Both
appear in the synthesis manifest; the LLM sees the conflict annotation and may flag it
to the GM in `badge_briefing`. The GM resolves by disabling or removing one entry.

**Idempotence.** Synthesis records the synthesis fingerprint — composed of the
ruleset content hash (REQ-044) and the synthesis intake answers (E1–E4), plus the
Novel state hash for internal synthesis. The specification version is excluded so that
spec-only updates do not invalidate valid synthesis. Running synthesis against the same
fingerprint is a no-op (detected, reported as `[OK] Synthesis up to date`). Running
synthesis against a new fingerprint replaces all external synthesis items; internal items
are refreshed per-source. Synthesis items are stored in the Novel JSON under a
`synthesis` key, organized by output module, alongside the Novel's other properties.

**Reversion.** Calling `synthesis (action: revert)` (REQ-103) removes all external synthesis items
at runtime without requiring a rebuild. Internal synthesis items are removed by the same
call. Ruleset Wisdom persists. Synthesis manifest and verification results remain in
DECISIONS.md for audit.

**Synthesis resource rendering.** Every synthesis resource URI
(`synthesis://voice_examples`, `synthesis://briefing_order`,
`synthesis://action_patterns`, `synthesis://adventure_advice`, `synthesis://narrative_voices`,
`lore://templates`)
and every badge guidance resource that draws from synthesis data
(`guidance://<badge>/voice`, `guidance://<badge>/tone`) SHALL render from the Novel's
live synthesis state — not from hardcoded text. When the synthesis array is
non-empty, the resource output SHALL contain the synthesis items filtered by
output_module and badge scope. Ruleset Wisdom items (`[ruleset]`, `[vendor]`-tagged) are
always present; synthesis items (`[supplementary]`-tagged) are present when synthesis
has been run and not reverted.

**Partial refresh.** The synthesis fingerprint SHALL include per-module hashes in
addition to the root aggregate hash. When external synthesis is re-run and a
module's hash matches the stored value, that module is unchanged — its inactive
items are preserved as-is. When a module's hash differs, only that module's
inactive items are replaced with fresh output; active (GM-activated) items are
preserved per REQ-130. Modules whose hashes are individually unchanged SHALL NOT
be disturbed — their items, timestamps, and activation state remain identical.
This allows staleness resolution and incremental synthesis without rebuilding
the entire manifest. The synthesis fingerprint root hash SHALL still aggregate
all module hashes for quick whole-manifest comparison.

**Verification.** After synthesis completes, the builder runs these checks and records
results in DECISIONS.md:

1. Source completeness: every external finding has source_url, quoted_excerpt, badge_scope,
   confidence, collected_at, and output_module — all non-empty. Every internal finding
   has a `novel://` source URI resolvable to the Novel state that produced it.
2. Tag audit: all synthesis content carries `[supplementary]` tag (and `[LOW]` tag where
   applicable); no `[ruleset]` or `[vendor]` content is modified (diff entity personality
   fields, briefing sections, lore entries before/after).
3. Boundary enforcement: no mechanics, stats, tools, or badge gating changed (diff
   `tools/list`, `resources/list`, and entity stat fields).
4. Idempotence: re-run synthesis against same synthesis fingerprint → no-op, identical
   manifest.
5. Badge filtering: GM-scoped synthesis content hidden from Player badge. LOW-confidence
   items carry `[LOW]` tag in all badge views.
6. Budget compliance: no output module exceeds its cap.
7. Research depth: every output module (modules 1–7) contains ≥1 actionable item. Source
   domains for each module total ≥2 distinct domains, or the "empty"/"incomplete"
   disposition with supplement source audit is recorded in DECISIONS.md.
8. Content relevance: every external synthesis item references the ruleset by name or by a
   term drawn from the ruleset's index. Generic RPG advice without a ruleset-specific anchor
   is flagged in DECISIONS.md with the "generic" disposition and does not block handoff.
9. Surface connection: every synthesis item that references a build surface
   (action pattern tool names, lore template keywords, adventure advice ruleset
   terms) is cross-referenced against the live tool registry, ruleset index, and
   resource map. Orphan references — items pointing to tools, sections, or
   keywords absent from the current build — are recorded in DECISIONS.md with
   the "orphan" disposition and their source URLs.
10. World-model coverage audit: verify that the synthesis manifest includes at
   least one item from each world-model component type (`constraint_override`,
   `scene_world`, and `npc_world` per REQ-354). Barren component types SHALL
   be recorded as synthesis defects with the "empty" disposition and the
   component type named. Vendor content items tagged `[vendor]` in these
   categories satisfy this check.
11. Internal synthesis coverage: every synthesis-capable module is populated when the
   corresponding source category has data. Empty modules with `[empty]` markers are
   recorded with the empty reason.
12. Confidence distribution: `MEDIUM` items outnumber `LOW` items across all sources, or a
   justification is recorded in DECISIONS.md explaining which source categories lacked
   explicit fields.

These are verification steps, not new verification workflows. Failures are synthesis
defects recorded in DECISIONS.md; the server state rolls back to the pre-synthesis
snapshot.

**Copyright.** Synthesis content is supplementary reference material. The operator is
responsible for ensuring all sourced content is used in compliance with the source's terms
of service and copyright license. Synthesis records `source_url` for attribution; it does
not redistribute source content beyond the Novel's local state.

**Rebuild scenarios.** Synthesis items are stored in the Novel alongside all other
Novel properties and follows the Novel's persistence contract (REQ-092) — it
survives server restarts and same-ruleset rebuilds unchanged. The synthesis
fingerprint (above) controls re-synthesis: unchanged fingerprint → no-op, changed
fingerprint → replacement. A nuclear rebuild — a build from scratch where the
state directory is absent — produces no synthesis unless the Synthesis workflow
is selected at intake. The builder surfaces synthesis status after build in
`spec_health`.

### 11.4 Ruleset Wisdom (vendor content)

Vendor content draws from curated, licensed documentation vendored in the
`holonovel/narrative_world_model/` directory at the Holonovel repository root.
It is Ruleset Wisdom — extracted at build time alongside ruleset-native content
per REQ-225, always present in the Novel, and not subject to synthesis reversion.
Items carry `[vendor]` tag with source anchor pointing to the vendor file within
the repository.

**Sources.** Ten source bundles, all open-source licensed:

| Source | License | What it contributes |
|---|---|---|
| DMCP (shawnrushefsky/dmcp) | MIT | NPC voice design, pause/resume patterns, combat management, campaign lifecycle |
| Blades in the Dark SRD (John Harper) | CC-BY 3.0 | Clock design philosophy, tension management, linked/danger/racing clock patterns |
| Lonelog (lonelog.org) | CC BY-SA 4.0 | Session notation structure, scene/action/outcome separation |
| IF Craft Corpus (pvliesdonk) | CC-BY 4.0 | Narrative structure, character voice, worldbuilding, scene structure, genre conventions |
| Ironsworn: Starforged SRD (Shawn Tomkin) | CC-BY 4.0 | Vow and progress track design, oracle move mechanics, solo narrative structure, quest framing |
| Sly Flourish Lazy GM Resource Document (Mike Shea) | CC-BY 4.0 | Session prep shortcuts, NPC design heuristics, scene pacing, encounter templates |
| The Alexandrian (Justin Alexander) | CC-BY 4.0 | Node-based adventure design, Three Clue Rule, faction intrigue structure, revelation pacing |
| Dungeon World SRD (Sage LaTorra, Adam Koebel) | CC-BY 3.0 | GM Agenda (3 items), GM Principles (12), GM Moves (12) retained as normative rules; player-facing moves triggered from fiction; front/danger system |
| Fate SRD (Evil Hat Productions) | CC-BY 3.0 | Player role definition and collaboration ethos ("make everyone at the table look awesome"); GM scene pacing, drama vs. realism, aspect-driven narrative structure; scenario building |
| Ironsworn SRD (Shawn Tomkin) | CC-BY 4.0 | Player principles, solo play chapter, guided/co-op play modes, oracle moves; dark fantasy solo conventions distinct from Starforged |

**When vendor content runs.** Vendor processing SHALL run at build time for
all non-ruleset-free builds. For TTRPG builds, vendor content provides
infrastructure craft advice that complements ruleset-native Wisdom. For
ruleset-free builds, vendor content is the primary Ruleset Wisdom source —
ruleset-native extraction produces an empty manifest; vendor content fills all
seven output modules with infrastructure-level craft advice.

Vendor content SHALL be indexed alongside ruleset-native extraction. Vendor
items carry `[vendor]` tag with source anchor pointing to the vendor file within
the repository. Vendor content follows the same budgets and confidence model as
other Ruleset Wisdom content (§11.3). Vendor content confidence defaults to HIGH
(curated, licensed, reviewed) with MEDIUM overrides for opinion content within
vendor documents and LOW overrides for experimental content.

**Pre-verified manifest.** The `holonovel/narrative_world_model/` directory
SHALL include a `MANIFEST.md` recording per-module pre-audited data for
each vendor source: module name, module content hash, item count, confidence
distribution (HIGH/MEDIUM/LOW counts), term anchoring score (percentage of items
referencing valid ruleset index terms), and the timestamp of last verification.

During Phase 1 convergence metrics, the builder SHALL compare each
module's content hash against the MANIFEST.md entry. When the hash matches, the
builder SHALL use the pre-verified confidence distribution and term anchoring
score from the manifest. When a module's hash differs from the manifest (vendor
content was updated), the builder SHALL re-audit only the changed module —
computing fresh confidence and term anchoring scores — and update the manifest
with the new hash and scores. Modules whose hashes are individually unchanged
SHALL NOT be disturbed.

When the `holonovel/narrative_world_model/` directory contains no MANIFEST.md, the
builder SHALL audit all vendor content from source and record the results — no
manifest match is attempted. The builder MAY produce a MANIFEST.md from the audit
results for use in subsequent builds.
