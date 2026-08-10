## 7. Runtime Conventions

### 7.1 Anchors

Anchors are derived from heading text per REQ-194. They serve as cross-reference
identifiers for ruleset content in the following surfaces:

| Surface | Format | Source |
|---|---|---|
| Source quoting | `<file>#<anchor>` | REQ-060, REQ-061 |
| Guidance resource URIs | `guidance://<badge>/<anchor>` | REQ-022 |
| Adventure resource URIs | `adventure://<slug>/<anchor>` | REQ-079 |

### 7.1a Slugs (filename-safe identifiers)

Slugs share REQ-194's core derivation algorithm (lowercase, strip punctuation,
hyphenate) and additionally:

- SHALL avoid Windows reserved names (CON, PRN, AUX, NUL, COM1–COM9, LPT1–LPT9).
  Collisions with reserved names resolve by appending `-1`.
- SHALL NOT result in full Novel state paths exceeding 240 characters.
  Consider: prepend a short hash if the slug alone would produce a path
  exceeding the limit.
- Leading and trailing hyphens are stripped.

### 7.2 Entity IDs

Entity IDs use a deterministically generated counter with a ruleset-specific prefix:
`<prefix>_<NN>`. The prefix is derived from the entity type's canonical name in the
ruleset (e.g., `delver`, `character`). Roster IDs are `roster://<id>`; Novel entity IDs
are `entity://<id>`. Both are stable across sessions.

### 7.3 Output contracts

| Contract | Format | Source |
|----------|--------|--------|
| Status prefix | `[OK]`, `[NEED_INPUT]`, `[PARTIAL]`, `[ERROR]`, `[WARNING]` | REQ-001 |
| Roll result | Dice notation, individual faces, modifiers (source + signed contribution), total, prose outcome, result band | REQ-003 |
| Lookup result | Full entry + `---`-separated source block with `<file>#<anchor>` | REQ-060, REQ-061 |
| Error | `[ERROR] [<CATEGORY>] <explanation>` + `Corrective action: <action>` | REQ-002 |
| Macro | `{{<path>}}` → live state value; nonexistent → literal; no expansion in audit log | REQ-085 |

Roll output example:

```
[OK] Total: <N> — <outcome>
Dice: <NdS = [faces]>
Modifiers: <stat> <+/-> <value>[, …]
Outcome: <prose result>
```

Error output example:

```
[ERROR] [<CATEGORY>] <explanation>
Corrective action: <action>
```

### 7.3a Narrative Freshness

The Holonovel architecture enforces a structural separation between narrative prose and
canonical state. This principle — the engine owns the truth; the AI renders the moment —
prevents the copy-of-a-copy degeneration that affects transcript-only AI roleplaying
systems:

- **AI narrative output is archived, not re-injected.** The AI narrator's prose is
  preserved in the audit log (REQ-040) and story journal (REQ-246), but SHALL NOT be
  re-injected into future context windows as raw text. What enters the LLM's context is
  the structured state delta — entity conditions, NPC dispositions, faction clock
  positions, campaign memory facts — not the previous turn's narrative paragraph.

- **Narrative voice profiles are standing directives.** WHEN a narrative voice profile is
  active (enrichment Tier 1 per REQ-225, or set by the GM via REQ-081), THE profile's
  description SHALL be injected as a system-level directive in every context window, not
  merged into the conversational transcript where it can be diluted by chat history.

- **Scene-type anchoring.** WHEN a scene is tagged `combat`, `social`, `exploration`, or
  `neutral` (REQ-087), THE AI narrator SHALL receive a corresponding tone directive that
  persists for the scene's duration. This directive is a system-level instruction, not
  conversational context.

- **Anti-slop precedence.** The anti-slop catalogue (REQ-070, Appendix J) SHALL be
  weighted above conversational context in the AI's priority stack, ensuring forbidden
  narrative patterns are suppressed even in long-running sessions.

These conventions are builder-level implementation constraints, not runtime-enforced tool
behavior. Builders SHALL document how their prompt construction satisfies each clause in
DECISIONS.md.

### 7.4 Tool-surface conventions

| Convention | Rule | Source |
|-----------|------|--------|
| Naming | `snake_case`, ruleset terminology, one verb per category — every tool in a related operation set shares the same verb prefix (e.g., all dice-resolution tools use `roll_`, all state-setting tools use `set_`). When the ruleset uses an abbreviated term (e.g., "save" for "saving throw"), the tool name SHALL use the ruleset's most common form of that term. Display titles are human-readable expansions. | REQ-020, REQ-024 |
| Parameterization | Named sets share one parameterized tool | REQ-021, REQ-110 |
| Annotations | read-only/state-reading→`idempotentHint`, command→`destructiveHint`, generation/hybrid→both | REQ-015 |

### 7.5 Decisions and workflows

Character creation and advancement use sequential decision queues (REQ-042, REQ-056,
REQ-104). Each decision presents a `[NEED_INPUT]` with a question, kebab-cased option
list (≤25 entries from the ruleset index, "cancel" always last). The `decision` value
passed to `respond` is the exact question text. `respond` drains one decision; `cancel`
restores the pre-workflow snapshot. Pending workflows block undo, redo, and badge
switching. See §6.4 for the full creation contract.

### 7.6 Configuration surface

| Environment variable | Required | Meaning                                            |
| -------------------- | -------- | -------------------------------------------------- |
| `TTRPG_RULESET`      | Yes      | Comma-separated paths to Markdown ruleset files     |
| `TTRPG_BADGE`      | No       | Default active badge on startup (`player`, `game_master`, `observer`, `none`). When `none`, the Novel starts in editing mode with no badge active. |
| `TTRPG_AI_ROLE`   | No       | AI narrative role — `counterpart` (default, opposite of active badge), `game_master`, or `player`. Determines orientation content in `badge_briefing` per REQ-304. Read at startup, applies to all connections. |
| `TTRPG_NOVEL`       | No¹      | Default slug of the Novel to activate on startup. Multiple Novels may coexist on disk; this variable selects the initial active Novel for the first connection. If absent, the server starts with no Novel active.      |
| `TTRPG_SEED`         | No       | String seed for the deterministic PRNG              |
| `TTRPG_SESSION_ID`   | No       | Optional label for grouping audit log entries by play session |
| `TTRPG_DATA_DIR`     | No       | State directory (default `.holonovel-state`)        |
| `TTRPG_PORT`         | No       | HTTP port, optional                                  |
| `TTRPG_MAX_NPCS`     | No       | Maximum NPCs per Novel (unbounded if absent)          |
| `TTRPG_MAX_LORE_ENTRIES` | No   | Maximum lore entries per Novel (unbounded if absent)  |
| `TTRPG_MAX_SNAPSHOT_DEPTH` | No | Maximum undo stack depth (minimum 10 per REQ-041)        |
| `TTRPG_ENRICH_STALE_DAYS` | No   | Days before inactive enrichment items are flagged stale |
| `TTRPG_ADVENTURE`   | No       | Comma-separated paths to adventure Markdown files    |

¹ Optional. Sets the initial active Novel on startup.

### 7.7 State model

State tiers:

| Tier       | What it holds                                                                       | Lifecycle                                              | Visibility                                                  |
| ---------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------- |
| Roster     | Character baselines (immutable), each owned by a player (narrative fields mutable per REQ-077) | Permanent — survives all Novels, rebuilds, and server restarts | Player (own entities) / Game Master (all)                    |
| Codex      | Typed content library (NPCs, characters, scenes, encounters, lore, factions, countdowns, rooms, things, equipment, spells, relationships, voice profiles, adventures) | Permanent — survives all Novels, rebuilds, and server restarts | Badge-filtered by visibility field (REQ-321) |
| Novel      | Active story state and editing-mode state, pending workflow, dm_context (pause/resume narrative context), factions, secrets, relationships — the container for characters, NPCs, scene, countdowns, lore, enrichment, and adventures. Pending workflow is Novel-tier per REQ-042: the open `[NEED_INPUT]` decision and its pre-workflow snapshot persist to disk and survive process restarts. | Persists to disk at `.holonovel-state/novels/<slug>.json`; survives process restarts and rebuilds; removed by `end_novel` | Multiple Novels per server; one active per Session |
| Session    | Active badge, active entity — ephemeral connection scoping            | Born when a client begins tool calls against a Novel; discarded on process restart or Novel switch | No persistent state — Novel state and audit log survive; all Session fields reset to defaults on restart or switch |

**Novel properties.** Every Novel contains fourteen property groups, all
Novel-scoped with shared lifecycle (survive connections and process restart,
discarded by `end_novel`):

| Property    | GM access                                                          | Player access                                  |
| ----------- | ------------------------------------------------------------------ | ---------------------------------------------- |
| NPC         | read/write/create/delete (named NPCs per REQ-075)                  | read-only                                      |
| Scene       | read/write                                                         | read-only                                      |
| Countdown   | read/write/create/delete                                            | read-only                                      |
| Lore        | read/write/create/delete/enable/disable/group/export/import         | read-only (badge-filtered per REQ-083)        |
| Enrichment  | read/write (re-enrich preserves GM-activated items per REQ-130; reverted by `revert_enrichment`) | read-only (badge-filtered); read/write for `[player]` items (REQ-261) |
| Adventure   | read (indexed at build time; one generated adventure per Novel via `generate_adventure` per REQ-132) | content badge-filtered; indexed and generated adventures coexist in the active Novel  |
| Adventure Scene Waypoint | read/write (REQ-250)                                      | read-only (pass-through in `badge_briefing`)      |
| Faction     | read/write/create/delete (REQ-233)                                   | read-only (GM-filtered)                         |
| Secret      | read/write/create/delete (REQ-234)                                   | Game Master only; revealed per-entity            |
| Relationship| read/write/create/delete (REQ-236)                                   | read-only (appears on character_sheet)           |
| DM Context  | read/write (REQ-232)                                                 | Game Master only                                 |
| Notes       | read/write/create/delete (badge-scoped; GM sees all scopes, Player sees `player` + `shared` scopes per REQ-242) | read/write/create/delete (badge-scoped; GM sees all scopes, Player sees `player` + `shared` scopes per REQ-242) |
| Server Notes| read/write/create/delete (REQ-285)                                   | Game Master only                                 |
| Story Journal | read/write/create (REQ-246)                                          | read-only (GM-filtered)                           |
| Novel Enrichment | read/write/revert (synthesized per REQ-263; removed by `revert_novel_enrichment` per REQ-265; auto-triggered per REQ-264) | read-only (badge-filtered per REQ-267; deactivatable via REQ-260) |
| Campaign Memory | read (engine-maintained; GM-filtered)                                       | read-only (GM-filtered)                         |

Dangers and non-entity combat participants have no IDs, no URIs, no
persistent state. Named NPCs (REQ-075) have IDs, URIs, and persistent state.

The build fingerprint — specification version, ruleset hash, and build
timestamp — is stored in the state directory. On startup with existing state,
the fingerprint determines compatibility (REQ-065).

Session is a Holonovel concept, independent of the MCP transport layer. Session
state exists only while the process holds an active Novel in memory; it is never
written to disk, never persists across process restarts, and is reset to defaults
when the active Novel changes via `switch_novel` or `end_novel`. The badge
activation state — previously per-session — remains persistent with the Novel
because it represents a player-facing state selection that must survive restarts
(REQ-055). This is a naming clarification: the tier previously called "Connection"
was always a Holonovel-level scoping construct, not the MCP protocol's session
layer (which the 2026-07-28 MCP specification has removed). The behavioral contract
is unchanged.

#### 7.7.1 Cross-property coupling

The six Novel property groups are not isolated — they interact through coupling
contracts defined in the individual REQs below. This section enumerates every
cross-group dependency so that builders initialize and maintain them in a
consistent order.

| Property pair        | Coupling                                                                                                              | Nature          | REQs                |
| -------------------- | --------------------------------------------------------------------------------------------------------------------- | --------------- | ------------------- |
| Scene → Lore         | Lore trigger keywords matched against scene description text; changing scene state reactivates or deactivates entries | Navigational    | REQ-083             |
| Scene → Countdown    | Countdowns carrying `on_scene_transition` flag decrement when `set_scene_state` produces a new description           | Mechanical      | REQ-125, REQ-073    |
| Scene → Faction      | Faction clocks advance one tick on each scene transition                                                              | Mechanical      | REQ-233             |
| Combat ↔ NPC         | NPCs may participate as combat participants alongside entities and dangers                                           | Mechanical      | REQ-043, REQ-075, REQ-124 |
| Adventure → NPC      | Adventure module NPC stat blocks are reference templates — the Game Master creates named NPCs from them at runtime    | Navigational    | REQ-079, REQ-119    |
| Enrichment → Lore    | Enrichment produces lore templates surfaced via `suggest_lore`; GM activates them with `set_lore_entry`              | Navigational    | REQ-080, REQ-083    |
| Enrichment → Scene/Entity/NPC | Enrichment adds voice_examples, narrative guidance, and supplementary content to scene, entity, and NPC surfaces — additive and inert, never mechanical | Navigational   | REQ-080             |
| Faction → Countdown  | `create_faction` auto-creates a `faction`-type countdown for the faction's primary goal                               | Mechanical      | REQ-233, REQ-073    |
| Secret → Relationship| When secret text overlaps with entity/NPC/faction names, a `suspicious` relationship is recommended                    | Navigational    | REQ-234, REQ-236    |
| Relationship → Lore  | When relationship type changes between `ally` and `rival`, the GM is prompted to consider a lore entry                | Navigational    | REQ-236             |
| Choice → Countdown   | `present_choices` with resolved `id` matching a countdown `scope` advances that countdown by one tick                 | Mechanical      | REQ-235, REQ-073    |
| Choice → Faction     | `present_choices` with resolved `id` matching a faction goal keyword advances that faction's clock                    | Mechanical      | REQ-235, REQ-233    |
| DM Context → State   | `save_pause_context` auto-captures faction clock states, countdown positions, NPC dispositions, and entity relationships | Navigational   | REQ-232, REQ-233, REQ-236 |
| Notes → Scene       | Notes tagged with scene anchors surface when that scene is active — badge-filtered per REQ-242 scope | Navigational   | REQ-242 |
| Adventure Scene Waypoint → Scene | Setting `adventure_scene` populates the adventure scene description in `badge_briefing` alongside free-text scene state; changing waypoint fires scene transition hook | Mechanical | REQ-250, REQ-125 |
| Adventure Scene Waypoint → Lore | Location lore entries from adventure pre-population (REQ-079) are triggered by scene matching the waypoint anchor | Navigational   | REQ-250, REQ-083 |
| Adventure Index → NPC | Structural extraction populates NPC entities in the Novel on `load_adventure` | Mechanical | REQ-247, REQ-079 |
| NPC → NPC Memory | Interaction events (combat, social, mechanical) automatically update NPC disposition and memory facts | Mechanical | REQ-311 |
| Campaign Memory → Scene | Campaign memory facts are prioritized by scene relevance in `badge_briefing` | Navigational | REQ-310 |
| World Reactivity → Campaign Memory | World in Motion accepted changes produce campaign memory facts | Mechanical | REQ-233a, REQ-310 |
| NPC Memory → Campaign Memory | Significant NPC memory events (disposition flips, goal milestones) populate campaign memory per-NPC facts | Navigational | REQ-311, REQ-310 |
| Codex → NPC | `codex_import` of kind `npc` creates the NPC in the Novel with stored fields | Mechanical | REQ-321, REQ-332 |
| Codex → World | `codex_import` of kind `room` or `thing` creates world-model objects in the Novel | Mechanical | REQ-321 |
| Codex → Lore | `codex_import` of kind `lore_entry` creates a lore entry in the Novel | Mechanical | REQ-321 |
| Codex → Faction | `codex_import` of kind `faction` creates a faction in the Novel | Mechanical | REQ-321 |
| Codex → Countdown | `codex_import` of kind `countdown` creates a countdown in the Novel | Mechanical | REQ-321 |
| Codex → Adventure | `codex_import` of kind `adventure` populates world-model, NPCs, factions, lore, and enrichment linkages | Mechanical | REQ-321, REQ-229 |
| Vows → Countdown | `set_vow` offers a coupled countdown per difficulty tier; `mark_milestone` advances both; countdown fill enables `resolve_vow` | Mechanical | REQ-322 |
| World → Scene | Parser movement (`go north`) into a new room triggers the scene transition hook (countdown advancement, lore matching) | Mechanical | REQ-125, REQ-198 |
| Story Journal → Lore | `promote_story_to_lore` creates a lore entry from a `revelation` or `moment` journal entry | Navigational | REQ-333 |
| Notes → Lore | Notes tagged with lore keys surface alongside those lore entries in `badge_briefing` | Navigational | REQ-242 |
| Story Beats → Narrative Threads | Beat transitions populate the `story_beats` sequence in the `narrative_threads` briefing section | Narrative | REQ-335, REQ-281 |
| Beat → Countdown | `climax` beat accelerates `on_scene_transition` countdowns by `TTRPG_CLIMAX_ACCELERATION` ticks (default 2); `setup`/`denouement` beats use standard rate | Mechanical | REQ-335, REQ-353, REQ-125, REQ-073 |
| Pacing Signal → Narrative Threads | When the pacing counter exceeds `TTRPG_PACING_WINDOW`, a pacing signal renders in `narrative_threads` | Narrative | REQ-336, REQ-281 |
| Pacing Signal → Faction Autonomous | When a pacing signal fires, every faction clock receives an immediate autonomous tick, overriding the interval threshold | Mechanical | REQ-336, REQ-338, REQ-351 |
| Pacing Signal → NPC Goal Pursuit | When a pacing signal fires, every goal-carrying NPC produces an immediate goal pursuit suggestion | Mechanical | REQ-336, REQ-339, REQ-351 |
| Scene → World Model | `set_scene_state` with `location` resolving to a room derives scene description from world-model state | Narrative | REQ-342 |
| suggest_actions → resolve_intent | Spatial domain results in `suggest_actions` delegate to `resolve_intent` for exit, constraint, and thing context — same resolution pipeline | Navigational | REQ-343, REQ-323 |
| Faction → Autonomous Countdown | Faction clocks advance an autonomous tick per `TTRPG_FACTION_AUTONOMY_INTERVAL` transitions; pending-fire countdowns surface as workflow decisions | Mechanical | REQ-338 |
| Faction Autonomous → NPC Goal Pursuit | When a faction autonomous tick represents an outcome overlapping an NPC's goal, that NPC's goal pursuit suggestion is suppressed for this transition | Mechanical | REQ-338, REQ-339, REQ-348 |
| NPC Goals → World in Motion | NPC goal-pursuit suggestions surface in `badge_briefing` World in Motion for GM accept/defer/dismiss | Narrative | REQ-339, REQ-233a |
| Countdown Fire (absent) → Story Journal | Countdowns that fire while the player's entity is absent produce `[discovered]` consequence entries | Mechanical | REQ-340, REQ-246 |
| Countdown → Knowledge | `[discovered]` consequences populate the discovering entity's `knowledge_state` with the countdown name, consequence text, and `source: discovered_consequence` | Mechanical | REQ-340, REQ-349, REQ-286 |
| Voice Feedback → Voice Examples | Player voice_feedback corrections update entity voice_examples with [player-corrected] annotation | Mechanical | REQ-344, REQ-077 |
| Background → Lore | An entity's `background` string is tokenized and matched against lore entry triggers; matching `shared`-scope entries surface in `knowledge_state` tagged `[background_relevant]` | Navigational | REQ-345, REQ-350, REQ-083 |
| Voice Feedback → Codex | Player-corrected voice examples captured to Codex via `codex_capture("voice_profile", ...)`; `codex_import` restores corrections tagged `[codex-corrected]` | Mechanical | REQ-344, REQ-347, REQ-321 |
| Secret → Countdown | `reveal_secret` with matching countdown `scope` produces countdown-advancement advisory in `narrative_threads` | Navigational | REQ-355, REQ-234, REQ-073 |
| Vow → Lore | Vow name/description keyword-matched against lore triggers; matching lore surfaced as `[vow-relevant]` in `narrative_threads` | Navigational | REQ-356, REQ-289, REQ-083 |
| Story Journal → Faction | `consequence` and `moment` entries referencing faction goal entities produce faction-clock-advancement advisory in `narrative_threads` | Navigational | REQ-357, REQ-246, REQ-233 |
| Countdown → NPC | Countdown fire shifts disposition of NPCs whose `location` matches countdown `scope` by one step toward countdown `direction` | Mechanical | REQ-358, REQ-073, REQ-075 |
| Countdown → World State | `world_effect` fires on countdown, mutates world-model properties (describe, property, exit) | Mechanical | REQ-368 |
| Vehicle → Scene | Vehicle entry/exit records story journal moment entries | Navigational | REQ-317 |
| World → Novel Enrichment | World-model rooms and things as synthesis source for adventure_advice and lore_templates | Navigational | §11.3 |
| Enrichment → Constraint Overrides | `constraint_override` component_type items feed override design patterns | Navigational | REQ-354 |
| Relationship → Countdown | Relationship flip from `ally` to `rival`/`hostile` with matching countdown `scope` produces countdown-advancement advisory in `narrative_threads` | Navigational | REQ-359, REQ-236, REQ-073 |
| Lore → Countdown | Lore entries with temporal urgency triggers suggest countdown creation in `narrative_threads` | Navigational | REQ-360, REQ-083, REQ-073 |
| NPC → Vow | Goal-carrying NPCs with goal text >20 chars and no matching active vow produce vow-creation suggestion in `narrative_threads` | Navigational | REQ-361, REQ-077, REQ-289 |
| Faction → Vow | Faction goals intersecting known entities/locations from lore or story journal produce vow-creation suggestion in `narrative_threads` | Navigational | REQ-362, REQ-233, REQ-289 |
| Secret → World Model | Secrets with `world_target` room ID match triggers against room description; surfaced as `[world-linked]` in `narrative_threads` | Navigational | REQ-363, REQ-234, REQ-195 |
| Faction → World Model | Factions with `territory` room IDs surface tagged `[territorial]` in `narrative_threads` when scene location matches | Navigational | REQ-364, REQ-233, REQ-195 |
| Server Notes → Narrative | Server notes with `narrative_tag` surface in `badge_briefing` supplementary guidance alongside enrichment items | Navigational | REQ-365, REQ-285 |

A coupling marked "Navigational" means it affects only guidance surfaces
(`badge_briefing`, resource rendering, suggestion tools) and does not influence
mechanical resolution (dice, HP, conditions). A coupling marked "Mechanical"
means it directly affects state mutation or tool behavior. A coupling marked
"Narrative" means it affects narrative coherence and is verified during the
G7 narrative coherence attestation (REQ-346); narrative couplings do not
block mechanical Gauntlet sub-workflows. When a source
property changes, navigational and narrative couplings update on the next
resource read; mechanical couplings take effect at the moment of the
triggering mutation.

### 7.8 Guidance and badge knowledge

| Aspect | Rule | Source |
|--------|------|--------|
| Attribution | Marker-attributed (heading tag), inferred (heading text), or shared (no signal) | REQ-016 |
| Records | Verbatim source text, anchor, badge scope, confidence, attribution method | REQ-016 |
| Surface | `guidance://player`, `guidance://game_master`, `guidance://shared`; individual at `guidance://<badge>/<anchor>` | REQ-022 |
| Briefing | `badge_briefing` composes guidance, state, lore, registry — badge-filtered, GM-overridable ordering (REQ-082) | REQ-109 |

Guidance is quoted inert data — it never influences tool behavior or model extraction.

