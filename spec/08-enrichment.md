## 11. Optional Workflows

_This workflow does not gate the Definition of Done. It extends the Build workflow._

After Enrich completes, re-run the Gauntlet blocking sub-workflows (§6.6 exit criteria) and verify no regression. A
previously-passing blocking sub-workflow that now fails is a defect that must be resolved
before handoff. Record re-verification results in DECISIONS.md.

### 11.1 Community enrichment

Ruleset-native enrichment (tier 1) is extracted during Discovery per REQ-225 and
shipped with every build. Community enrichment (tier 2) is run after Build
completes and all verification workflows pass (§8), enhancing the server with
web-sourced play advice layered on top of ruleset-native enrichment. Pre-build
questions are collected in §6.2 when the `enrich` workflow is selected. Build
alone produces a fully working server with ruleset-native enrichment; community
enrichment adds supplementary content to every module. Community items carry
`[supplementary]` tag and never replace ruleset-native items (REQ-227).

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

**Structured outputs.** Every item across all six modules records a `collected_at` ISO 8601
timestamp, enabling staleness detection. The timestamp is surfaced in enrichment resource
output. Enrich produces an enrichment manifest with six output modules:

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

### 11.2 Vendor enrichment

Vendor enrichment draws from curated, licensed documentation vendored in the
`enrich/` directory at the Holonovel repository root. It supplements community
enrichment (§11.1) with infrastructure-level craft advice sourced from interactive
fiction design, GM tooling, and solo RPG communities.

**Sources.** Four source bundles, all open-source licensed:

| Source | License | What it enriches |
|---|---|---|
| DMCP (shawnrushefsky/dmcp) | MIT | NPC voice design, pause/resume patterns, combat management, campaign lifecycle |
| Blades in the Dark SRD (John Harper) | CC-BY 3.0 | Clock design philosophy, tension management, linked/danger/racing clock patterns |
| Lonelog (lonelog.org) | CC BY-SA 4.0 | Session notation structure, scene/action/outcome separation |
| IF Craft Corpus (pvliesdonk) | CC-BY 4.0 | Narrative structure, character voice, worldbuilding, scene structure, genre conventions |

**When vendor enrichment runs.** Vendor enrichment SHALL run when the operator sets
E5 to `yes` (default). It runs alongside community enrichment (§11.1): for TTRPG
builds, vendor enrichment provides infrastructure craft advice that complements
the ruleset-anchored community enrichment. For ruleset-free builds, vendor
enrichment is the primary enrichment source — community enrichment (§11.1) SHALL
use infrastructure-level search terms (freeform roleplay, GM techniques, narrative
design) in place of ruleset-anchored terms, and vendor content carries higher
weight.

**No separate infrastructure web enrichment.** For TTRPG builds, the ruleset-anchored
community enrichment (§11.1) already captures infrastructure concepts through the
ruleset's lens (e.g., "D&D 5e NPC personality" returns NPC design advice). Vendor
enrichment fills remaining gaps at higher quality. A separate infrastructure-only
web enrichment pass is not run — it would find redundant or lower-quality content
compared to the combination of ruleset-anchored web search and vendor sources.

**Indexing.** The builder SHALL index all vendored enrichment sources from
`enrich/` alongside web-sourced community enrichment. Vendor content SHALL carry
`[supplementary]` tag with source URL pointing to the vendor file within the
repository. Vendor content follows the same budgets, confidence model, and
deduplication rules as community enrichment (§11.1). Vendor content confidence
defaults to HIGH (curated, licensed, reviewed) with MEDIUM overrides for
opinion content within vendor documents and LOW overrides for experimental
content.

**Enrichment fingerprint.** The enrichment fingerprint SHALL include the vendor
content hashes alongside the community enrichment fingerprint. Vendor content
changes (updates to `enrich/` files) trigger module replacement per the partial
refresh contract; unchanged vendor modules are not disturbed.

