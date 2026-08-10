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

**Novel properties.** Every Novel contains sixteen property groups, all
Novel-scoped with shared lifecycle (survive connections and process restart,
discarded by `end_novel`):

| Property | Archetypes | GM access | Player access |
| -------- | ---------- | --------- | ------------- |
| NPC | Entity-bearing | read/write/create/delete (named NPCs per REQ-075) | read-only |
| Scene | Scene-anchored | read/write | read-only |
| Countdown | Temporal | read/write/create/delete | read-only |
| Lore | Knowledge-carrying | read/write/create/delete/enable/disable/group/export/import | read-only (badge-filtered per REQ-083) |
| Enrichment | Ruleset Wisdom | read/write (re-enrich preserves GM-activated items per REQ-130; reverted by `revert_enrichment`) | read-only (badge-filtered); read/write for `[player]` items (REQ-261) |
| Adventure | [content source] | read (indexed at build time; one generated adventure per Novel via `generate_adventure` per REQ-132) | content badge-filtered; indexed and generated adventures coexist in the active Novel |
| Adventure Scene Waypoint | [content source] | read/write (REQ-250) | read-only (pass-through in `badge_briefing`) |
| Faction | Entity-bearing, Temporal | read/write/create/delete (REQ-233) | read-only (GM-filtered) |
| Secret | Knowledge-carrying | read/write/create/delete (REQ-234) | Game Master only; revealed per-entity |
| Relationship | Relational | read/write/create/delete (REQ-236) | read-only (appears on character_sheet) |
| DM Context | Session | read/write (REQ-232) | Game Master only |
| Notes | Session | read/write/create/delete (badge-scoped; GM sees all scopes, Player sees `player` + `shared` scopes per REQ-242) | read/write/create/delete (badge-scoped; GM sees all scopes, Player sees `player` + `shared` scopes per REQ-242) |
| Server Notes | Session, Guidance | read/write/create/delete (REQ-285) | Game Master only |
| Story Journal | Narrative-memory | read/write/create (REQ-246) | read-only (GM-filtered) |
| Novel Enrichment | Ruleset Wisdom | read/write/revert (synthesized per REQ-263; removed by `revert_novel_enrichment` per REQ-265; auto-triggered per REQ-264) | read-only (badge-filtered per REQ-267; deactivatable via REQ-260) |
| Campaign Memory | Knowledge-carrying | read (engine-maintained; GM-filtered) | read-only (GM-filtered) |

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

#### 7.7.0 Holodeck archetypes

Novel property groups are classified into 11 archetypes. Each archetype defines
the property's behavioral nature. Coupling pattern rules between archetypes dictate
every cross-property interaction — the coupling table (§7.7.1) is derived from
these rules, not hand-enumerated.

**Content Sources.** Rulesets, supplementary rulesets, and adventure modules are
*inputs* that populate Novel property groups. They are not Holodeck archetypes —
they do not appear in the coupling table (§7.7.1). When a content source populates
a property group, that property group's archetype pattern rules dictate all
downstream couplings. Adventure-specific coupling rows in §7.7.1 are `[none]` —
the couplings already exist through the populated properties' own archetypes.

| Archetype | Definition | Example property groups |
|-----------|-----------|------------------------|
| Temporal | Progresses over time, fires on completion | Countdown, Faction clock, Pacing signal |
| Entity-bearing | Carries persistent identity with fields | NPC, Faction, Player character |
| Scene-anchored | Changes trigger scene-transition hooks | Scene state, Adventure waypoint, Story beats |
| Knowledge-carrying | Content surfaced by trigger matching | Lore, Secret, Knowledge state, Campaign memory, Background |
| Narrative-memory | Records story events for later recall | Story journal, Session recap |
| Spatial | Defines physical constraints and locations | World model (rooms, things, exits, vehicles) |
| Relational | Links entities through typed connections | Relationships |
| Decision | Presents structured player choices | Choices, Vows |
| Guidance | Advisory content, never mechanical | Server notes, Anti-slop, Narrative tone |
| Session | Scoped to the operator's presence | DM Context, Notes, Badge state, Player signals |
| Ruleset Wisdom | Ruleset-extracted behavioral content — the seven output modules (voice_examples, briefing_order, lore_templates, action_patterns, supplementary_guidance, adventure_advice, narrative_voices) produced during Discovery from the ruleset's own text per REQ-225. Persists as build output; survives tier reversion. Rendered as first-class server behavior, not advisory guidance — where the ruleset describes genre conventions, the server enacts them. | Enrichment (all 7 output modules) |

**Coupling pattern rules.** Each rule is a behavioral contract — a "what," not a
"how." Every row in the coupling table (§7.7.1) traces to one or more of these
rules.

| Rule | Source archetype → Target archetype | Behavior | Nature | Holodeck model |
|------|-------------------------------------|----------|--------|----------------|
| P1 | Temporal → Scene-anchored | Temporal properties advance one tick per scene transition | Mechanical | The clock runs while the scene plays |
| P2 | Knowledge-carrying → Scene-anchored | Scene text matched against knowledge triggers; matching knowledge surfaces in badge briefing | Navigational | The world knows what the scene describes |
| P3 | Entity-bearing → Spatial | Entity location fields resolve against spatial room names | Mechanical | Characters exist in physical space |
| P4 | Entity-bearing → Temporal | Entity goals auto-create coupled temporal progress tracks | Mechanical | Purpose drives the clock |
| P5 | Ruleset Wisdom → Knowledge-carrying | Wisdom lore templates mechanically activate on trigger match — the world renders what the ruleset says it knows | Mechanical | The program populates the world's knowledge |
| P6 | Ruleset Wisdom → Entity-bearing | NPCs created while Wisdom is active render with ruleset-derived voice, goals, and personality patterns — no manual activation required | Mechanical | Characters render with genre-appropriate behavior |
| P7 | Ruleset Wisdom → Temporal | Wisdom pacing and encounter patterns mechanically seed countdowns and advance them per ruleset-described dramatic rhythm | Mechanical | Threats escalate on the program's schedule |
| P8 | Ruleset Wisdom → Scene-anchored | Scene beats and type tags follow ruleset-described dramatic structure; briefing order modules render the ruleset's own narrative architecture | Mechanical + Navigational | The program structures the story |
| P9 | Ruleset Wisdom → Relational | Wisdom relationship patterns mechanically establish relationships between NPCs sharing scene presence when personality fields match ruleset-described dynamics | Mechanical | The cast relates as the genre dictates |
| P10 | Ruleset Wisdom → Decision | Wisdom action patterns and constraint overrides feed `suggest_actions` and the constraint catalog — the computer's reference library | Navigational | The computer consults its library |
| P11 | Ruleset Wisdom → Spatial | Spatial properties serve as synthesis source for Wisdom adventure hooks and scene templates from room layouts | Navigational | The room design suggests the story |
| P12 | Decision → Temporal | Decision resolution matching temporal scope advances that temporal | Mechanical | Choices advance the clock |
| P13 | Spatial → Scene-anchored | Spatial movement triggers scene-transition hooks | Mechanical | Entering a new room is a scene change |
| P14 | Temporal → Spatial | Temporal fire mutates spatial state (descriptions, properties, exits) | Mechanical | The clock changes the room |
| P15 | Temporal → Entity-bearing | Temporal fire shifts entity disposition when scope matches location | Mechanical | Threats change how characters feel |
| P16 | Narrative-memory → Knowledge-carrying | Narrative-memory entries promote to knowledge-carrying | Navigational | Remembered events become known facts |
| P17 | Session → Scene-anchored + Knowledge-carrying | Session annotations surface alongside referenced properties | Navigational | The operator's notes follow the scene |
| P18 | Relational → Temporal | Relational flip against temporal scope triggers advisory | Navigational | Betrayal signals the clock |
| P19 | Knowledge-carrying → Temporal | Knowledge entries with urgency triggers suggest temporal creation | Navigational | Urgent knowledge demands a countdown |
| P20 | Entity-bearing → Decision | Entity goals suggest decision (vow) creation | Navigational | Purpose suggests a quest |
| P21 | Knowledge-carrying → Spatial | Knowledge entries with spatial targets match spatial descriptions | Navigational | Secrets are anchored to places |
| P22 | Entity-bearing → Spatial | Entity territories match spatial locations | Navigational | Faction turf defines presence |
| P23 | Guidance → Decision + Knowledge-carrying + Entity-bearing | Advisory content surfaces alongside referenced properties — inert, never mechanical | Navigational | Server notes advise; they don't act |

#### 7.7.1 Cross-property coupling

The Novel property groups interact through coupling contracts derived from the
archetype pattern rules in §7.7.0. This section enumerates every active coupling
(§7.7.1a) and every pair that does not interact (§7.7.1b). Together they satisfy
the coupling completeness contract (REQ-370).

##### 7.7.1a Active couplings

| Property pair | Pattern Rule | Coupling | Badge Scope | Nature | REQs |
| ------------- | ------------ | -------- |------------ | ------ | ---- |
| Scene → Lore | P2 | Lore trigger keywords matched against scene description text; changing scene state reactivates or deactivates entries | GM-only | Navigational | REQ-083 |
| Scene → Countdown | P1 | Countdowns carrying `on_scene_transition` flag decrement when `set_scene_state` produces a new description | GM-only | Mechanical | REQ-125, REQ-073 |
| Scene → Faction | P1 | Faction clocks advance one tick on each scene transition | GM-only | Mechanical | REQ-233 |
| Combat ↔ NPC | — | NPCs may participate as combat participants alongside entities and dangers | GM-only | Mechanical | REQ-043, REQ-075, REQ-124 |
| Enrichment → Lore | P5 | Wisdom lore templates mechanically activate on trigger match | GM-only | Mechanical | REQ-080, REQ-083 |
| Enrichment → Scene/Entity/NPC | P6, P8 | Wisdom voice_examples, narrative guidance, and supplementary content render on scene, entity, and NPC surfaces — NPCs created while Wisdom is active render with ruleset-derived voice, goals, and personality | Player-visible (shared-scope), GM-only (GM-scope) | Mechanical | REQ-080 |
| Faction → Countdown | P4 | `create_faction` auto-creates a `faction`-type countdown for the faction's primary goal | GM-only | Mechanical | REQ-233, REQ-073 |
| Secret → Relationship | — | When secret text overlaps with entity/NPC/faction names, a `suspicious` relationship is recommended | GM-only | Navigational | REQ-234, REQ-236 |
| Relationship → Lore | — | When relationship type changes between `ally` and `rival`, the GM is prompted to consider a lore entry | GM-only | Navigational | REQ-236 |
| Choice → Countdown | P12 | `present_choices` with resolved `id` matching a countdown `scope` advances that countdown by one tick | GM-only | Mechanical | REQ-235, REQ-073 |
| Choice → Faction | P12 | `present_choices` with resolved `id` matching a faction goal keyword advances that faction's clock | GM-only | Mechanical | REQ-235, REQ-233 |
| DM Context → State | P17 | `save_pause_context` auto-captures faction clock states, countdown positions, NPC dispositions, and entity relationships | GM-only | Navigational | REQ-232, REQ-233, REQ-236 |
| Notes → Scene | P17 | Notes tagged with scene anchors surface when that scene is active — badge-filtered per REQ-242 scope | Player-visible, badge-scoped | Navigational | REQ-242 |
| NPC → NPC Memory | — | Interaction events (combat, social, mechanical) automatically update NPC disposition and memory facts | GM-only | Mechanical | REQ-311 |
| Campaign Memory → Scene | — | Campaign memory facts are prioritized by scene relevance in `badge_briefing` | GM-only | Navigational | REQ-310 |
| World Reactivity → Campaign Memory | — | World in Motion accepted changes produce campaign memory facts | GM-only | Mechanical | REQ-233a, REQ-310 |
| NPC Memory → Campaign Memory | — | Significant NPC memory events (disposition flips, goal milestones) populate campaign memory per-NPC facts | GM-only | Navigational | REQ-311, REQ-310 |
| Codex → NPC | — | `codex_import` of kind `npc` creates the NPC in the Novel with stored fields | GM-only (editing mode) | Mechanical | REQ-321, REQ-332 |
| Codex → World | — | `codex_import` of kind `room` or `thing` creates world-model objects in the Novel | GM-only (editing mode) | Mechanical | REQ-321 |
| Codex → Lore | — | `codex_import` of kind `lore_entry` creates a lore entry in the Novel | GM-only (editing mode) | Mechanical | REQ-321 |
| Codex → Faction | — | `codex_import` of kind `faction` creates a faction in the Novel | GM-only (editing mode) | Mechanical | REQ-321 |
| Codex → Countdown | — | `codex_import` of kind `countdown` creates a countdown in the Novel | GM-only (editing mode) | Mechanical | REQ-321 |
| Vows → Countdown | P4 | `set_vow` offers a coupled countdown per difficulty tier; `mark_milestone` advances both; countdown fill enables `resolve_vow` | GM-only | Mechanical | REQ-322 |
| World → Scene | P13 | Parser movement (`go north`) into a new room triggers the scene transition hook (countdown advancement, lore matching) | GM-only (mutation); Player-visible (read) | Mechanical | REQ-125, REQ-198 |
| Story Journal → Lore | P16 | `promote_story_to_lore` creates a lore entry from a `revelation` or `moment` journal entry | GM-only | Navigational | REQ-333 |
| Notes → Lore | P17 | Notes tagged with lore keys surface alongside those lore entries in `badge_briefing` | Player-visible, badge-scoped | Navigational | REQ-242 |
| Story Beats → Narrative Threads | — | Beat transitions populate the `story_beats` sequence in the `narrative_threads` briefing section | GM-only (GM surface), Player-visible (shared-scope beats in Player surface) | Narrative | REQ-335, REQ-281 |
| Beat → Countdown | P1 | `climax` beat accelerates `on_scene_transition` countdowns by `TTRPG_CLIMAX_ACCELERATION` ticks (default 2); `setup`/`denouement` beats use standard rate | GM-only | Mechanical | REQ-335, REQ-353, REQ-125, REQ-073 |
| Pacing Signal → Narrative Threads | — | When the pacing counter exceeds `TTRPG_PACING_WINDOW`, a pacing signal renders in `narrative_threads` | GM-only | Narrative | REQ-336, REQ-281 |
| Pacing Signal → Faction Autonomous | P1 | When a pacing signal fires, every faction clock receives an immediate autonomous tick, overriding the interval threshold | GM-only | Mechanical | REQ-336, REQ-338, REQ-351 |
| Pacing Signal → NPC Goal Pursuit | — | When a pacing signal fires, every goal-carrying NPC produces an immediate goal pursuit suggestion | GM-only | Mechanical | REQ-336, REQ-339, REQ-351 |
| Scene → World Model | P3 | `set_scene_state` with `location` resolving to a room derives scene description from world-model state | GM-only (mutation); Player-visible (read) | Narrative | REQ-342 |
| suggest_actions → resolve_intent | P10 | Spatial domain results in `suggest_actions` delegate to `resolve_intent` for exit, constraint, and thing context — same resolution pipeline | GM-only (resolve_intent); Player-visible (suggest_actions results) | Navigational | REQ-343, REQ-323 |
| Faction → Autonomous Countdown | P1 | Faction clocks advance an autonomous tick per `TTRPG_FACTION_AUTONOMY_INTERVAL` transitions; pending-fire countdowns surface as workflow decisions | GM-only | Mechanical | REQ-338 |
| Faction Autonomous → NPC Goal Pursuit | — | When a faction autonomous tick represents an outcome overlapping an NPC's goal, that NPC's goal pursuit suggestion is suppressed for this transition | GM-only | Mechanical | REQ-338, REQ-339, REQ-348 |
| NPC Goals → World in Motion | — | NPC goal-pursuit suggestions surface in `badge_briefing` World in Motion for GM accept/defer/dismiss | GM-only | Narrative | REQ-339, REQ-233a |
| Countdown Fire (absent) → Story Journal | — | Countdowns that fire while the player's entity is absent produce `[discovered]` consequence entries | GM-only (fire); Player-visible (discovered consequences via knowledge_state) | Mechanical | REQ-340, REQ-246 |
| Countdown → Knowledge | — | `[discovered]` consequences populate the discovering entity's `knowledge_state` with the countdown name, consequence text, and `source: discovered_consequence` | GM-only (write); Player-visible (read own-entity) | Mechanical | REQ-340, REQ-349, REQ-286 |
| Voice Feedback → Voice Examples | — | Player voice_feedback corrections update entity voice_examples with [player-corrected] annotation | Player-only (write); GM-visible (read) | Mechanical | REQ-344, REQ-077 |
| Background → Lore | P2 | An entity's `background` string is tokenized and matched against lore entry triggers; matching `shared`-scope entries surface in `knowledge_state` tagged `[background_relevant]` | Player-visible (read own-entity background matches) | Navigational | REQ-345, REQ-350, REQ-083 |
| Voice Feedback → Codex | — | Player-corrected voice examples captured to Codex via `codex_capture("voice_profile", ...)`; `codex_import` restores corrections tagged `[codex-corrected]` | GM-only (editing mode capture/import) | Mechanical | REQ-344, REQ-347, REQ-321 |
| Secret → Countdown | P18 | `reveal_secret` with matching countdown `scope` produces countdown-advancement advisory in `narrative_threads` | GM-only | Navigational | REQ-355, REQ-234, REQ-073 |
| Vow → Lore | P2 | Vow name/description keyword-matched against lore triggers; matching lore surfaced as `[vow-relevant]` in `narrative_threads` | GM-only (advice); Player-visible (shared-scope vows, narrative_threads per REQ-281) | Navigational | REQ-356, REQ-289, REQ-083 |
| Story Journal → Faction | — | `consequence` and `moment` entries referencing faction goal entities produce faction-clock-advancement advisory in `narrative_threads` | GM-only | Navigational | REQ-357, REQ-246, REQ-233 |
| Countdown → NPC | P15 | Countdown fire shifts disposition of NPCs whose `location` matches countdown `scope` by one step toward countdown `direction` | GM-only | Mechanical | REQ-358, REQ-073, REQ-075 |
| Countdown → World State | P14 | `world_effect` fires on countdown, mutates world-model properties (describe, property, exit) | GM-only | Mechanical | REQ-368 |
| Vehicle → Scene | — | Vehicle entry/exit records story journal moment entries | GM-only (write); Player-visible (read) | Navigational | REQ-317 |
| World → Novel Enrichment | P11 | World-model rooms and things as synthesis source for adventure_advice and lore_templates | GM-only | Navigational | §11.3 |
| Enrichment → Constraint Overrides | P10 | `constraint_override` component_type items feed override design patterns | GM-only | Navigational | REQ-354 |
| Relationship → Countdown | P18 | Relationship flip from `ally` to `rival`/`hostile` with matching countdown `scope` produces countdown-advancement advisory in `narrative_threads` | GM-only | Navigational | REQ-359, REQ-236, REQ-073 |
| Lore → Countdown | P19 | Lore entries with temporal urgency triggers suggest countdown creation in `narrative_threads` | GM-only | Navigational | REQ-360, REQ-083, REQ-073 |
| NPC → Vow | P20 | Goal-carrying NPCs with goal text >20 chars and no matching active vow produce vow-creation suggestion in `narrative_threads` | GM-only | Navigational | REQ-361, REQ-077, REQ-289 |
| Faction → Vow | P20 | Faction goals intersecting known entities/locations from lore or story journal produce vow-creation suggestion in `narrative_threads` | GM-only | Navigational | REQ-362, REQ-233, REQ-289 |
| Secret → World Model | P21 | Secrets with `world_target` room ID match triggers against room description; surfaced as `[world-linked]` in `narrative_threads` | GM-only | Navigational | REQ-363, REQ-234, REQ-195 |
| Faction → World Model | P22 | Factions with `territory` room IDs surface tagged `[territorial]` in `narrative_threads` when scene location matches | GM-only | Navigational | REQ-364, REQ-233, REQ-195 |
| Server Notes → Narrative | P23 | Server notes with `narrative_tag` surface in `badge_briefing` supplementary guidance alongside enrichment items | GM-only | Navigational | REQ-365, REQ-285 |

##### 7.7.1b Completeness register

Every Novel property-group pair from §7.7 is accounted for below. Pairs not listed
in §7.7.1a carry `[none]` — no interaction. Pairs where the source is a content
source (Adventure, Codex) are `[none]` — content sources populate property groups
which couple via their own archetype rules.

| Property pair | Disposition |
| ------------- | ----------- |
| NPC → Scene | [none] |
| NPC → Countdown | [none] |
| NPC → Lore | [none] |
| NPC → Enrichment | [none] |
| Scene → NPC | [none] |
| Scene → Enrichment | [none] |
| Countdown → Scene | [none] |
| Countdown → Lore | [none] |
| Countdown → Enrichment | [none] |
| Lore → Scene | [none] |
| Lore → Countdown | [none] |
| Lore → Enrichment | [none] |
| Enrichment → Countdown | [none] |
| Adventure → * (all targets) | [none — content source; populated property groups couple via their own archetype rules] |
| Adventure Scene Waypoint → * | [none — content source fragment; populated properties couple via their own archetype rules] |
| Adventure Index → * | [none — content source; populated properties couple via their own archetype rules] |
| Codex → Adventure | [none — content source; populated properties couple via their own archetype rules] |
| DM Context → * (all non-State targets) | [none] |
| Server Notes → * (all non-Narrative targets) | [none] |
| Story Journal → * (all non-Lore targets) | [none] |
| All remaining unlisted ordered pairs | [none] |

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

