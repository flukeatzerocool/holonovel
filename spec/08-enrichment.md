## 11. Optional Workflows

_This workflow does not gate the Definition of Done. It extends the Build workflow._

After Enrich completes, re-run the Gauntlet blocking sub-workflows (§6.6 exit criteria) and verify no regression. A
previously-passing blocking sub-workflow that now fails is a defect that must be resolved
before handoff. Record re-verification results in DECISIONS.md.

### 11.1 Community enrichment

Ruleset-native and vendor enrichment (tier 1) is extracted at build time per
REQ-225 and REQ-227 and is always present in the Novel. Community enrichment
(tier 2) is an optional, default-off workflow that may be run after Build
completes and all verification workflows pass (§8), enhancing the server with
web-sourced play advice layered on top of tier 1 enrichment. At intake (§6.2),
the Enrich workflow defaults to "none" (no community enrichment). Selecting
"community" runs the research phase described below. Build alone produces a
fully working server with tier 1 enrichment (ruleset-native + vendor); community
enrichment adds supplementary content to every module. Community items carry
`[supplementary]` tag and never replace tier 1 items (REQ-227).

**Research requirements.** Search the web for ruleset-specific play advice across all
selected source types (E2). Research depth is deep — at minimum:

- **5 distinct source domains** across all selected source types.
- **3 substantive pages** of extracted content per source type (≥500 words each after
  stripping boilerplate).

A source type that returns zero results is recorded as a finding with the "empty"
disposition and does not block completion. Failure or empty results leave the server
unchanged; all enrichment content is additive.

A source-domain shortfall — fewer than 5 distinct domains returning non-empty results
across all source types — is recorded with the "incomplete" disposition and does not
block handoff. The builder may supplement the research with: (a) enrichment content
retained from prior Build cycles that carries verified source URLs, (b) pages fetched
from pre-seeded, known-TTRPG-community domains listed in the intake answers, or (c)
an accepted limitation with re-activation conditions: a target date and a domain
threshold (e.g., "re-run when ≥3 new domains are reachable"). An incomplete
disposition requires a supplement source audit in DECISIONS.md (6) listing which
modules drew from supplemental content and which are from live research.

**Structured outputs.** Every item across all seven modules records a `collected_at` ISO 8601
timestamp, enabling staleness detection. The timestamp is surfaced in enrichment resource
output. Enrich produces an enrichment manifest with seven output modules:

1. **Voice examples.** Up to 5 example dialogue snippets per entity type. Each records:
   `text` (the dialogue), `context` (situation tag), `source_url`, and `confidence`.
   Stored at `enrichment://voice_examples`. The GM activates them via `set_voice_examples`
   (REQ-077).

2. **Prompt ordering.** A single recommended ordering of `hat_briefing` section
   tokens. Every token in the recommendation SHALL appear in the builder-documented
   section token vocabulary (REQ-185). The recommendation MAY omit tokens — omitted
   tokens follow their builder-default position after the listed tokens. Tokens not
   in the vocabulary are invalid and the enrichment module SHALL NOT produce them.
   Stored at `enrichment://briefing_order`. **Inert** — visible in `spec_health`,
   never auto-applies. The GM must explicitly call `set_briefing_order` (REQ-082) to
   use it.

3. **Lore templates.** Up to 3 seed entries per major ruleset setting keyword, 30 entries
   total. Each records: `key` (slug), `content` (Markdown), `triggers` (keyword array),
   `hat_scope`, `source_url`, and `confidence`. Stored at `lore://templates`. **Inert**
   — the GM must explicitly activate them via `set_lore_entry` (REQ-083).

4. **Action patterns.** Up to 10 patterns mapping common player intents to ruleset-legal
   actions. Each records: `intent` (natural-language string), `suggested_actions` (array of
   ruleset tool names), `source_url`, and `confidence`. They supplement the
    `suggest_actions` (REQ-084) matching index. **Inert** — the GM must explicitly
    activate them via a Novel-scoped toggle before they appear in `suggest_actions`
    results. Unactivated patterns are visible at `enrichment://action_patterns` for
    review.

5. **Supplementary guidance.** Up to 20 items. Appended to `hat_briefing` with
   `[supplementary]` tag, source URL, and confidence. Includes the expanded hat
   foundations catalogue (REQ-062) and the full anti-slop catalogue (REQ-070), both served
   at their respective guidance URIs.

6. **Adventure advice.** Up to 30 items covering adventure templates (five-room dungeon,
   node-based design, three-act arc), random table expansions (community encounter, treasure,
   and NPC tables), and genre/scenario starters (premise seeds categorised by genre: horror,
   mystery, heist, sandbox). Each item records: `category` (adventure_templates,
   table_expansions, or scenario_starters), `content` (Markdown), `source_url`,
   `confidence`, and `hat_scope`. Stored at `enrichment://adventure_advice`. **Inert**
   — the `generate_adventure` and `generate_encounter` tools (REQ-090, REQ-091) may draw
    from this module to seed scaffolds, but the content never auto-applies.

7. **Narrative voice profiles.** Up to 15 community-sourced items. Ruleset-native items
    extracted during Discovery per REQ-226 already populate the module. Each item
    records: `name` (e.g., "Sword & Sorcery — Conan"), `media_title`, `media_type` (film,
    novel, game), `description` (narrative techniques from the source material),
    `source_url` (for community items; ruleset-native items carry `source` anchor), and
    `confidence`. Stored at `enrichment://narrative_voices`. **Inert** — the GM applies a
    profile via `set_narrative_directive` (REQ-081) by naming the profile. Community
    items tagged `[supplementary]`; ruleset-native items tagged `[ruleset]`.

**Boundaries.** Community enrichment may ADD to: entity voice_examples, prompt ordering
recommendations, lore templates, action suggestion patterns, adventure advice, narrative
voice profiles, and supplementary guidance.
Enrich MUST NOT modify: mechanical fields (stats, saves, HP, conditions, combat state),
build-derived tool registrations, hat gating rules, or any `[ruleset]`-tagged content
(REQ-080).

**Hat scope assignment.** During research, the builder assigns `hat_scope` by
these rules, applied in order: (1) if the source material is explicitly addressed to
Dungeon Masters/Game Masters (imperative "tell your players," "set the scene," "describe
the monster"), scope is `game_master`; (2) if addressed to players ("your character,"
"at the table," "talk to your DM"), scope is `player`; (3) if the advice applies to all
participants or is ambiguous, scope is `shared`. Scope assignment is recorded as a
verification check — every item's scope must match one of these three rules.
The GM may override an item's assigned hat scope post-collection.
Overridden items retain the original lexical scope as `auto_scope` for
audit. The builder records scope overrides in the enrichment manifest.

**Budgets.** Caps prevent unbounded state growth:

| Output module       | Cap                       | Configurable? |
| ------------------- | ------------------------- | ------------- |
| Voice examples      | 5 per entity type         | Yes           |
| Prompt ordering     | 1 (single recommendation) | No            |
| Lore templates      | 3 per keyword, 30 total   | Yes           |
| Action patterns         | 10 total                  | Yes           |
| Supplementary guidance   | 20 total                  | Yes           |
| Adventure advice         | 30 total                  | Yes           |
| Narrative voice profiles   | 15 total                  | Yes           |

Budget cap overrides are accepted via E4 at intake (§6.2). Overrides must be ≥ the
spec minimum shown in this table. Overrides below the minimum are rejected with a
warning and the default is used.

**Confidence.** Enrich confidence uses source authority, not mechanical completeness:

| Confidence | Source type |
| ---------- | ----------- |
| HIGH       | Designer blog/post, official publisher advice, published strategy guide |
| MEDIUM     | Curated community wiki, recognized actual-play podcast, prominent community guide |
| LOW        | Individual forum/Reddit post, personal blog, unverified source |

This is distinct from Build confidence (which derives from mechanical completeness per
REQ-011). The LLM sees both labels with full provenance.

**LOW-confidence budget.** After enrichment completes its primary research pass
(HIGH and MEDIUM confidence items), it may collect up to half as many LOW
confidence items as the total HIGH + MEDIUM count. Example: 20 HIGH + MEDIUM
items permits up to 10 additional LOW items. This ensures the server captures
community metadiscussion without diluting the enrichment manifest. Collection
stops when sources are exhausted, whichever comes first.

**LOW-confidence presentation.** LOW-confidence items carry a visible `[LOW]` tag in
`hat_briefing` and in enrichment resource output, distinct from the standard
`[supplementary]` tag. Items are grouped after HIGH and MEDIUM items within their output
module. The LLM sees both tags; the `[LOW]` tag signals reduced weight in narration
decisions.

**Deduplication and conflicts.** When two enrichment findings make contradictory claims
on the same mechanical or narrative topic, both are recorded. The later collection (by
`collected_at`) carries a `conflicts_with` reference to the earlier item's key. Both
appear in the enrichment manifest; the LLM sees the conflict annotation and may flag it
to the GM in `hat_briefing`. The GM resolves by disabling or removing one entry.

**Idempotence.** Enrich records the enrichment fingerprint — composed of the
ruleset content hash (REQ-044) and the enrichment intake answers (E1–E4). The
specification version is excluded so that spec-only updates do not invalidate valid
enrichment. Running enrich against the same enrichment fingerprint is a no-op (detected,
reported as `[OK] Enrichment up to date`). Running enrich against a new enrichment
fingerprint replaces all enrichment state. Enrichment state is stored separately from
build state:
`enrichment/voice_examples.json`, `enrichment/prompt_ordering.json`,
`enrichment/lore_templates.json`, `enrichment/action_patterns.json`,
`enrichment/supplementary_guidance.json`, `enrichment/adventure_advice.json`.

**Verification.** After enrichment completes, the builder runs these checks and records
results in DECISIONS.md:

1. Source completeness: every finding has source_url, quoted_excerpt, hat_scope,
   confidence, collected_at, and output_module — all non-empty.
2. Tag audit: all enrich content carries `[supplementary]` tag (and `[LOW]` tag where
   applicable); no `[ruleset]` content
   is modified (diff entity personality fields, briefing sections, lore entries
   before/after).
3. Boundary enforcement: no mechanics, stats, tools, or hat gating changed (diff
   `tools/list`, `resources/list`, and entity stat fields).
4. Idempotence: re-run enrich against same enrichment fingerprint → no-op, identical
   manifest.
5. Hat filtering: GM-scoped enrich content hidden from Player hat. LOW-confidence
   items carry `[LOW]` tag in all hat views.
6. Budget compliance: no output module exceeds its cap.
7. Research depth: every output module (modules 1–7) contains ≥1 actionable item. Source
    domains for each module total ≥2 distinct domains, or the "empty"/"incomplete"
   disposition with supplement source audit is recorded in DECISIONS.md.
8. Content relevance: every enrichment item references the ruleset by name or by a term
   drawn from the ruleset's index. Generic RPG advice without a ruleset-specific anchor
   is flagged in DECISIONS.md with the "generic" disposition and does not block handoff.
9. Surface connection: every enrichment item that references a build surface
   (action pattern tool names, lore template keywords, adventure advice ruleset
   terms) is cross-referenced against the live tool registry, ruleset index, and
   resource map. Orphan references — items pointing to tools, sections, or
   keywords absent from the current build — are recorded in DECISIONS.md with
   the "orphan" disposition and their source URLs.

These are verification steps, not new verification workflows. Failures are enrichment defects recorded in
DECISIONS.md; the server state rolls back to the pre-enrich snapshot.

**Copyright.** Enrichment content is supplementary reference material. The operator is
responsible for ensuring all sourced content is used in compliance with the source's terms
of service and copyright license. Enrich records `source_url` for attribution; it does not
redistribute source content beyond the Novel's local state.

**Rebuild scenarios.** Enrichment is stored in the Novel alongside all other
Novel properties and follows the Novel's persistence contract (REQ-092) — it
survives server restarts and same-ruleset rebuilds unchanged. The enrichment
fingerprint (above) controls re-enrich: unchanged fingerprint → no-op, changed
fingerprint → replacement. Ruleset-native enrichment is subject to the Phase 1
convergence loop metrics (enrichment population and term anchoring, §6.5) —
a build that produces a barren enrichment manifest is flagged during
convergence and triggers re-read of source sections per REQ-225. A nuclear
rebuild — a build from scratch where the state directory is absent — produces
no enrichment unless the Enrich workflow is selected at intake. The builder
surfaces enrichment status after build in `spec_health`.

**Reversion.** Calling `revert_enrichment` (REQ-103) removes all community enrichment
state at runtime without requiring a rebuild. Ruleset-native enrichment persists.
Enrichment manifest and verification results remain in DECISIONS.md for audit.

**Enrichment resource rendering.** Every enrichment resource URI
(`enrichment://voice_examples`, `enrichment://briefing_order`,
`enrichment://action_patterns`, `enrichment://adventure_advice`, `enrichment://narrative_voices`,
`lore://templates`)
and every hat guidance resource that draws from enrichment data
(`guidance://<hat>/voice`, `guidance://<hat>/tone`) SHALL render from the Novel's
live enrichment state — not from hardcoded text. When the enrichment array is
non-empty, the resource output SHALL contain the enrichment items filtered by
output_module and hat scope. Ruleset-native items (`[ruleset]`-tagged) are always
present; community items (`[supplementary]`-tagged) are present when community
enrichment has been run and not reverted.

**Partial refresh.** The enrichment fingerprint SHALL include per-module hashes in
addition to the root aggregate hash. When community enrichment is re-run and a
module's hash matches the stored value, that module is unchanged — its inactive
items are preserved as-is. When a module's hash differs, only that module's
inactive items are replaced with fresh output; active (GM-activated) items are
preserved per REQ-130. Modules whose hashes are individually unchanged SHALL NOT
be disturbed — their items, timestamps, and activation state remain identical.
This allows staleness resolution and incremental enrichment without rebuilding
the entire manifest. The enrichment fingerprint root hash SHALL still aggregate
all module hashes for quick whole-manifest comparison.

### 11.2 Vendor content processing (Tier 1)

Vendor content draws from curated, licensed documentation vendored in the
`holonovel/narrative_world_model/` directory at the Holonovel repository root. It is
processed at build time as part of Tier 1 enrichment alongside ruleset-native extraction
per REQ-225.

**Sources.** Seven source bundles, all open-source licensed:

| Source | License | What it enriches |
|---|---|---|
| DMCP (shawnrushefsky/dmcp) | MIT | NPC voice design, pause/resume patterns, combat management, campaign lifecycle |
| Blades in the Dark SRD (John Harper) | CC-BY 3.0 | Clock design philosophy, tension management, linked/danger/racing clock patterns |
| Lonelog (lonelog.org) | CC BY-SA 4.0 | Session notation structure, scene/action/outcome separation |
| IF Craft Corpus (pvliesdonk) | CC-BY 4.0 | Narrative structure, character voice, worldbuilding, scene structure, genre conventions |
| Ironsworn: Starforged SRD (Shawn Tomkin) | CC-BY 4.0 | Vow and progress track design, oracle move mechanics, solo narrative structure, quest framing |
| Sly Flourish Lazy GM Resource Document (Mike Shea) | CC-BY 4.0 | Session prep shortcuts, NPC design heuristics, scene pacing, encounter templates |
| The Alexandrian (Justin Alexander) | CC-BY 4.0 | Node-based adventure design, Three Clue Rule, faction intrigue structure, revelation pacing |

**When vendor enrichment runs.** Vendor processing SHALL run at build time for
all non-ruleset-free builds. For TTRPG builds, vendor content provides
infrastructure craft advice that complements ruleset-native enrichment. For
ruleset-free builds, vendor enrichment is the primary Tier 1 enrichment source —
ruleset-native extraction produces an empty manifest; vendor content fills all
seven output modules with infrastructure-level craft advice.

The Ironsworn SRD enriches `narrative_voices` (vow-swearing conventions,
progress-track storytelling), `action_patterns` (oracle moves as structured
action suggestions), and `adventure_advice` (quest framing templates). The Lazy GM
enriches `supplementary_guidance` (session-prep heuristics), `adventure_advice`
(encounter templates), and `briefing_order` (recommended section ordering for
session flow). The Alexandrian enriches `adventure_advice` (node-based scenario
design, clue placement) and `lore_templates` (three-clue seeding).

Vendor content SHALL be indexed alongside ruleset-native extraction. Vendor
items carry `[vendor]` tag with source anchor pointing to the vendor file within
the repository. Vendor content follows the same budgets and confidence model as
community enrichment (§11.1). Vendor content confidence defaults to HIGH
(curated, licensed, reviewed) with MEDIUM overrides for opinion content within
vendor documents and LOW overrides for experimental content.

**Enrichment fingerprint.** The enrichment fingerprint SHALL include the vendor
content hashes alongside the ruleset content hash. Vendor content changes
(updates to `holonovel/narrative_world_model/` files) trigger module replacement per the
partial refresh contract; unchanged vendor modules are not disturbed.

**Pre-verified enrichment manifest.** The `holonovel/narrative_world_model/` directory
SHALL include a `MANIFEST.md` recording per-module pre-audited enrichment data for
each vendor source: module name, module content hash, item count, confidence
distribution (HIGH/MEDIUM/LOW counts), term anchoring score (percentage of items
referencing valid ruleset index terms), and the timestamp of last verification.

During Phase 1 enrichment convergence metrics, the builder SHALL compare each
module's content hash against the MANIFEST.md entry. When the hash matches, the
builder SHALL use the pre-verified confidence distribution and term anchoring
score from the manifest. When a module's hash differs from the manifest (vendor
content was updated), the builder SHALL re-audit only the changed module —
computing fresh confidence and term anchoring scores — and update the manifest
with the new hash and scores. Modules whose hashes are individually unchanged
SHALL NOT be disturbed, per the partial-refresh contract in §11.1.

When the `holonovel/narrative_world_model/` directory contains no MANIFEST.md, the
builder SHALL audit all vendor content from source and record the results — no
manifest match is attempted. The builder MAY produce a MANIFEST.md from the audit
results for use in subsequent builds.

### 11.3 Novel enrichment

Novel enrichment (tier 3) synthesizes enrichment items from the active Novel's
own state — NPCs, lore entries, the story journal, scene history, factions,
secrets, relationships, and countdowns. Unlike community enrichment (§11.1),
which is web-researched, and vendor content (§11.2), which is processed at build
time as part of Tier 1, novel enrichment is generated by the server at runtime. Items are
tagged `[novel]` and stored in the Novel JSON under a `novel_enrichment` key.

**Synthesis tool.** The GM runs `synthesize_novel_enrichment` (REQ-263) to
analyze the Novel's state and produce enrichment items across the seven output
modules. Synthesis is stateless — it reads the current Novel state and produces
items. A `novel_enrichment_fingerprint` hash of the Novel state prevents
wasteful re-synthesis when nothing has changed.

**Auto-trigger.** When `TTRPG_NOVEL_ENRICH_AUTO_TRIGGER` is set to
`on_session_start` or `on_scene_change`, synthesis triggers automatically per
REQ-264. Auto-triggered items are inert (inactive by default). The GM must
explicitly activate them via `activate_enrichment_item` (REQ-260).

**Source inputs.** The synthesis tool analyzes six categories of Novel state.
Each category maps to specific output modules:

| Source category | Analyzed state | Output modules |
|---|---|---|
| NPCs | name, description, disposition, goals, personality fields (REQ-075, REQ-077), voice examples (REQ-077) | voice_examples, supplementary_guidance, action_patterns |
| Lore entries | key, content, triggers, hat_scope, group assignments (REQ-083) | lore_templates, supplementary_guidance |
| Story journal | type, entry text, timestamp, scene_anchor, entity_ids (REQ-246) | narrative_voices, supplementary_guidance, adventure_advice |
| Scene history + current scene | description, location, time_of_day, atmosphere, scene type (REQ-076, REQ-087) | adventure_advice, supplementary_guidance, briefing_order |
| Factions + secrets + relationships | faction state (REQ-233), secret knowledge status (REQ-234), relationship objects (REQ-236) | supplementary_guidance, lore_templates |
| Countdowns | name, remaining ticks, type, scope, direction (REQ-072, REQ-073) | supplementary_guidance, adventure_advice |

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

**Output module budgets.** Novel enrichment follows the same budget caps as
community enrichment (§11.1), with per-synthesis-pass limits:

| Output module | Per-pass cap | Total Novel cap |
|---|---|---|
| Voice examples | 3 per NPC | 50 |
| Briefing order | 1 | 1 |
| Lore templates | 5 | 30 |
| Action patterns | 5 | 10 |
| Supplementary guidance | 10 | 20 |
| Adventure advice | 5 | 30 |
| Narrative voices | 1 | 15 |

The per-pass cap limits how many new items a single synthesis pass produces.
When synthesis would exceed a total Novel cap, it produces up to the cap and
records the overflow count in the synthesis result. The GM may remove items via
`deactivate_enrichment_item` or `remove_enrichment_item` (for Tier 2 and
`[novel]` items) to make room.

**Confidence.** All `[novel]` items carry `MEDIUM` or `LOW` confidence per
REQ-266. Items derived from explicit Novel fields carry `MEDIUM`; items derived
from inference carry `LOW`. Confidence is re-evaluated on each synthesis pass.
Items do not carry the `[stale]` flag — they are regenerated on demand, not
collected at a fixed time.

**Hat scope.** `[novel]` item hat scope defaults to `game_master` — they are
GM prep aids by nature. The GM may override scope per REQ-267. Items with
overridden scope retain the original `auto_scope: game_master` for audit.

**Storage.** `[novel]` items are stored in full in the Novel JSON under a
`novel_enrichment` key, organized by output module. The storage format mirrors
Tier 2 community enrichment: an object with module keys, each containing an
array of items. Each item records: key, module, content (structure differs by
module per §11.1), hat_scope, confidence, collected_at (ISO 8601 synthesis
timestamp), source (novel:// URI), and activated (boolean — defaults to false
for auto-synthesized items, true for GM-initiated explicit synthesis).

**Persistence.** `[novel]` items follow the Novel's persistence contract
(REQ-092). They survive server restarts and same-ruleset rebuilds. A ruleset
rebuild does not invalidate `[novel]` items — they reference Novel state, not
ruleset content. `end_novel` removes `[novel]` items with the Novel JSON.
`export_novel` includes the `novel_enrichment` key.

**Removal.** `revert_novel_enrichment` (REQ-265) removes all `[novel]` items.
Individual items may be removed via `remove_enrichment_item` (REQ-260).
`revert_enrichment` (REQ-103) SHALL NOT remove `[novel]` items — the three
tiers have independent removal boundaries.

**Interaction with community enrichment.** `[novel]` items coexist with Tier 1
and Tier 2 items in all enrichment surfaces. Community items carry
`[supplementary]`; novel items carry `[novel]`. When a `[novel]` item and a
community item share the same key within a module, both are preserved — the
`[novel]` item carries a `conflicts_with` reference to the community item. The
GM resolves by activating one and deactivating the other.

**Verification.** After `synthesize_novel_enrichment` completes, the builder
runs these checks and records results in DECISIONS.md:

1. Source traceability: every `[novel]` item has a `novel://` source URI
   resolvable to the Novel state that produced it.
2. Tag audit: all novel enrichment content carries `[novel]` tag; no `[ruleset]`
   or `[supplementary]` content is modified.
3. Boundary enforcement: `[novel]` items SHALL NOT modify mechanical fields,
   build-derived tool registrations, or hat gating rules.
4. Confidence distribution: `MEDIUM` items outnumber `LOW` items, or a
   justification is recorded in DECISIONS.md explaining which source categories
   lacked explicit fields.
5. Budget compliance: no module exceeds its total Novel cap. Overflow counts
   are recorded in the synthesis result.
6. Hat filtering: `[novel]` items default to `game_master` hat scope. Player
   hat sees only items with overridden `shared` or `player` scope.
7. Reversion boundary: `revert_novel_enrichment` removes all `[novel]` items;
   `revert_enrichment` does not. Both calls succeed independently.
8. Module coverage: every synthesis-capable module is populated when the
   corresponding source category has data. Empty modules with `[novel] [empty]`
   markers are recorded with the empty reason.

