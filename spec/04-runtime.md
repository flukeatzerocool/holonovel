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

Bracket tags and markers (`[tag]`) are lowercase with hyphen word separators
(e.g., `[session-boundary]`, `[pending-fire]`). Uppercase is reserved for the
five status prefixes and the eight error categories in this table.

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
  active (Ruleset Wisdom per REQ-225, or set by the GM via REQ-081), THE profile's
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
| Verbs | One verb per operation class: `create_` for entity creation, `set_` for state upsert, `update_` for partial mutation, `add_`/`remove_` for collection membership, `list_`/`get_` for reads. Deletion uses `remove_` exclusively — never `delete_`. | REQ-020 |
| Parameterization | Named sets share one parameterized tool | REQ-021, REQ-110 |
| Prompt naming | Prompt names are immutable contracts; style (bare-noun vs verb) is not enforced. Narrative prompts (`intro`, `session_zero`, `novel_setup`) are plain-English per Standing Rule 10; operational prompts (`badge_briefing`, `run_workflow`) follow their own REQ contracts. | REQ-020, Standing Rule 10 |
| Annotations | read-only/state-reading→`idempotentHint`, command→`destructiveHint`, generation/hybrid→both | REQ-015 |

### 7.5 Decisions and workflows

Character creation and advancement use sequential decision queues (REQ-042, REQ-056,
REQ-104). Each decision presents a `[NEED_INPUT]` with a question, kebab-cased option
list (≤25 entries from the ruleset index, "cancel" always last). The `decision` value
passed to `respond` is the exact question text. `respond` drains one decision; `cancel`
restores the pre-workflow snapshot. Pending workflows block undo, redo, and badge
switching. See §6.3 and REQ-399 for the creation data contract; REQ-104, REQ-151, REQ-152, and REQ-181 for the creation workflow.

### 7.6 Configuration surface

| Environment variable | Required | Meaning                                            |
| -------------------- | -------- | -------------------------------------------------- |
| `TTRPG_RULESET`      | Yes      | Comma-separated paths to Markdown ruleset files     |
| `TTRPG_BADGE`      | No       | Default active badge on startup (`player`, `game_master`, `observer`, `none`). `none` is the Editor badge — full access, default on Novel creation and resume. |
| `TTRPG_AI_ROLE`   | No       | AI narrative role — `counterpart` (default, opposite of active badge), `game_master`, or `player`. Determines orientation content in `badge_briefing` per REQ-304. Read at startup, applies to all connections. |
| `TTRPG_AUTONOMY`   | No       | Launch-time seed for new-Novel autonomy slider defaults, comma-separated `level,confirmation,safety,creativity` (e.g. `mechanical_prompt,prompt,safe,standard`). Read at startup; overridable per-Novel via `scene (action: autonomy)` (REQ-306). The four slider defaults are `mechanical_prompt`, `prompt`, `safe`, `standard` when absent. Behavioral — couples per §7.7.1a P45. |
| `TTRPG_NOVEL`       | No¹      | Default slug of the Novel to activate on startup. Multiple Novels may coexist on disk; this variable selects the initial active Novel for the first connection. If absent, the server starts with no Novel active.      |
| `TTRPG_SEED`         | No       | String seed for the deterministic PRNG              |
| `TTRPG_SESSION_ID`   | No       | Optional label for grouping audit log entries by play session |
| `TTRPG_DATA_DIR`     | No       | State directory holding all user data (Novels, roster, codex, server notes, world-model data) and the ruleset install directory (`<DATA_DIR>/rulesets/`). Default resolves to the well-known per-operating-system user-data location (e.g. `~/.local/share/holonovel` on Linux) when the server runs inside a git work tree, and to `.holonovel-state` otherwise; the default SHALL NOT resolve inside a git work tree. `TTRPG_RULESET_DIRS` may relocate the install directory. (REQ-390, REQ-396, REQ-397) |
| `TTRPG_PORT`         | No       | HTTP port, optional                                  |
| `TTRPG_MAX_NPCS`     | No       | Maximum NPCs per Novel (default 500)          |
| `TTRPG_MAX_LORE_ENTRIES` | No   | Maximum lore entries per Novel (default 500)  |
| `TTRPG_MAX_SNAPSHOT_DEPTH` | No | Maximum undo stack depth (minimum 10 per REQ-041)        |
| `TTRPG_SYNTHESIS_STALE_DAYS` | No   | Days before inactive synthesis items are flagged stale |
| `TTRPG_ADVENTURE`   | No       | Comma-separated paths to adventure Markdown files    |
| `TTRPG_RULESETS`    | No       | Comma-separated list of ruleset slugs the host hydrates eagerly at startup (opting out of lazy hydration per REQ-390). When set, the server SHALL validate that every slug in this list matches an installed package. When absent, all packages hydrate lazily on first activation of a Novel bound to their slug. |
| `TTRPG_RULESET_DIRS` | No      | Path to the ruleset install directory when it differs from `<TTRPG_DATA_DIR>/rulesets/`. The host scans this directory at startup and validates installed packages there (REQ-389, REQ-390). |
| `TTRPG_MAX_ENTITIES` | No      | Maximum playable entities per Novel (default 50) |
| `TTRPG_MAX_ROSTER_ENTITIES` | No | Maximum roster baselines per server (default 100) |
| `TTRPG_MAX_COUNTDOWNS` | No      | Maximum countdowns per Novel (default 100) |
| `TTRPG_MAX_SYNTHESIS_ITEMS` | No | Maximum synthesis items per module (default 15) |
| `TTRPG_MAX_STORY_ENTRIES` | No | Maximum story journal entries per Novel (default 1000) |
| `TTRPG_MAX_CHECKPOINTS` | No | Maximum checkpoints per Novel before oldest is discarded |
| `TTRPG_WORLD_GEN_MAX_ROOMS` | No | Maximum rooms produced by `world (action: generate)` in one call (default 20; REQ-431c) |
| `TTRPG_MAX_VOICE_CORRECTIONS_PER_SESSION` | No | Maximum `character (action: signal)` voice corrections accepted per session |
| `TTRPG_MAX_BRIEFING_TOKENS` | No | Maximum token budget for `badge_briefing` output |
| `TTRPG_AUDIT_RETENTION_SESSIONS` | No | Number of recent sessions before `session (action: compress)` archives older entries |
| `TTRPG_NOVEL_RETENTION_DAYS` | No | Days before an inactive Novel is flagged for archive |
| `TTRPG_NOVEL_COMPRESS` | No | `true` to gzip the serialized Novel JSON on disk (REQ-092) |
| `TTRPG_NOVEL_BACKUP_COUNT` | No | Rotating backup retention count (minimum 1) |
| `TTRPG_EXPORT_EMBED_ADVENTURES` | No | Embed adventure modules in `novel (action: export)` output |
| `TTRPG_STORY_JOURNAL_DISPLAY` | No | Story journal surface detail level (e.g., `summary`, `full`) |
| `TTRPG_CONFIDENCE_FLOOR` | No | Minimum per-item extraction confidence that does not block import (supplementary rulesets; default 70%). Distinct from the aggregate Standard-tier gate (≥80% per REQ-100/H10): the floor governs item admission, the gate governs overall build confidence. |
| `TTRPG_WORLD_PROMINENCE` | No | World-model prominence tier — `secondary`, `visible`, or `prominent` (REQ-309). Behavioral. |
| `TTRPG_PACING_WINDOW` | No | Scene-transition count before a pacing signal fires (REQ-336). Behavioral — couples per P43/P44. |
| `TTRPG_CLIMAX_ACCELERATION` | No | Extra countdown ticks applied on `climax` beats (default 2). Behavioral. |
| `TTRPG_FACTION_AUTONOMY_INTERVAL` | No | Scene-transition interval between faction autonomous ticks (REQ-338). Behavioral — couples per P4. |
| `TTRPG_NPC_AUTONOMY` | No | `true` enables autonomous NPC goal pursuit (REQ-339). Behavioral — couples per P45. |
| `TTRPG_NPC_MIND` | No | `true` enables the NPC-mind `auto-apply` option on goal-pursuit suggestions (REQ-339d, REQ-075f). Behavioral — couples per P45. |
| `TTRPG_NPC_URGENCY_THRESHOLD` | No | Goal-text length in characters at or above which an NPC's goal counts as "urgent" and suggests countdown advancement (REQ-369). Behavioral — couples per P4. |
| `TTRPG_VOW_SUGGESTION_GOAL_MIN_CHARS` | No | Minimum goal-text length in characters before a goal-carrying NPC produces a vow-creation suggestion (default 20; REQ-361). Behavioral — couples per P20. |
| `TTRPG_MAX_AVAILABLE_ACTIONS` | No | Maximum actions rendered in the proactive `available_actions` briefing section (default 8; REQ-084a2). Behavioral. |
| `TTRPG_STORY_BEAT_WINDOW` | No | Number of most-recent completed story beats retained in the `story_beats` sequence (default 10; REQ-337b). Behavioral. |
| `TTRPG_CAMPAIGN_MEMORY_MAX_FACTS` | No | Maximum campaign-memory facts injected into `badge_briefing` (default 10; REQ-310b). Behavioral. |
| `TTRPG_NOVEL_PREVIEW_CHARS` | No | Character budget for the Novel-library name/preview in the `intro` prompt (default 120; REQ-063b). Behavioral. |
| `TTRPG_WORLD_REACTIVITY` | No | `true` enables World in Motion reactivity (REQ-233a). Behavioral — couples per P46. |
| `TTRPG_NARRATION_VALIDATION` | No | `on`/`off` pre-narration validation gate (REQ-312). Behavioral. |
| `TTRPG_STATE_GATE` | No | `off` (default), `warn`, or `block` — state-drift enforcement (REQ-403). Behavioral. |
| `TTRPG_AUTO_RECORD` | No | `true` (default) enables auto-`moment` story journal entries on scene transitions and combat rounds (REQ-405). Behavioral. |
| `TTRPG_SYNTHESIS_AUTO_TRIGGER` | No | `off` (default), `on_session_start`, or `on_scene_change`. Behavioral. |
| `TTRPG_WORKFLOW_STALENESS_CONNECTIONS` | No | Connection count before a pending workflow auto-cancels (0 disables) |

¹ Optional. Sets the initial active Novel on startup.

All configuration is namespaced with the `TTRPG_` prefix to avoid collision with MCP
client environment variables. The prefix is product-agnostic and does not constrain
the ruleset or adventure content served.

For operator readability the configuration surface is grouped into three tiers — storage
and paths, mechanical limits, and behavioral tuning (REQ-388) — and `spec_health` renders
the same grouping. This is a documentation contract, not a requirement.

### 7.7 State model

State tiers:

| Tier       | What it holds                                                                       | Lifecycle                                              | Visibility                                                  |
| ---------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------- |
| Roster     | Character baselines (immutable), each owned by a player (narrative fields mutable per REQ-077) | Permanent — survives all Novels, rebuilds, and server restarts | Player (own entities) / Game Master (all)                    |
| Codex      | Typed content library (NPCs, characters, scenes, encounters, lore, factions, countdowns, rooms, things, equipment, spells, relationships, voice profiles, adventures) | Permanent — survives all Novels, rebuilds, and server restarts | Badge-filtered by visibility field (REQ-321) |
| Novel      | Active story state and active badge state (REQ-031b, REQ-055a), bound ruleset (REQ-380; immutable after creation), pending workflow, gm_context (pause/resume narrative context), host base-capability state (REQ-434–443), NPC mind state (REQ-075f), factions, secrets, relationships — the container for characters, NPCs, scene, countdowns, lore, synthesis, and adventures. Pending workflow is Novel-tier per REQ-042: the open `[NEED_INPUT]` decision and its pre-workflow snapshot persist to disk and survive process restarts. | Persists to disk at `.holonovel-state/novels/<slug>.json`; survives process restarts and rebuilds; moved to `.trash/` by `novel (action: end)` per REQ-117 | Multiple Novels per server; one active per Session |
| Session    | Active entity — ephemeral connection scoping            | Born when a client begins tool calls against a Novel; discarded on process restart or Novel switch | No persistent state — Novel state and audit log survive; all Session fields reset to defaults on restart or switch |

**Novel properties.** Every Novel contains thirty property groups, all
Novel-scoped with shared lifecycle (survive connections and process restart,
discarded by `novel (action: end)`):

| Property | Archetypes | GM access | Player access |
| -------- | ---------- | --------- | ------------- |
| NPC | Entity-bearing | read/write/create/delete (named NPCs per REQ-075) | read-only |
| Scene | Scene-anchored | read/write | read-only |
| Countdown | Temporal | read/write/create/delete | read-only |
| Lore | Knowledge-carrying | read/write/create/delete/enable/disable/group/export/import | read-only (badge-filtered per REQ-083) |
| Synthesis | Ruleset Wisdom | read/write/revert (synthesized per REQ-262; removed by `synthesis (action: revert)` per REQ-103; auto-triggered per REQ-263) | read-only (badge-filtered per REQ-265; deactivatable via REQ-260) |
| Adventure | [content source] | read (indexed at build time; one generated adventure per Novel via `adventure (action: generate)` per REQ-132) | content badge-filtered; indexed and generated adventures coexist in the active Novel |
| Adventure Scene Waypoint | [content source] | read/write (REQ-250) | read-only (pass-through in `badge_briefing`) |
| Faction | Entity-bearing, Temporal | read/write/create/delete (REQ-233) | read-only (GM-filtered) |
| Secret | Knowledge-carrying | read/write/create/delete (REQ-234) | Game Master only; revealed per-entity |
| Relationship | Relational | read/write/create/delete (REQ-236) | read-only (appears on character (action: sheet)) |
| Vow | Decision, Temporal | read/write/create/delete (REQ-289, REQ-322) | read-only (shared/party scope per REQ-289e) |
| GM Context | Session | read/write (REQ-232) | Game Master only |
| Pending Workflow | Decision | read (engine-maintained per REQ-042); `respond` drains | read-only (`respond` drains per REQ-235) |
| Notes | Session | read/write/create/delete (badge-scoped; GM sees all scopes, Player sees `player` + `shared` scopes per REQ-242) | read/write/create/delete (badge-scoped; GM sees all scopes, Player sees `player` + `shared` scopes per REQ-242) |
| Server Notes | Session, Guidance | read/write/create/delete (REQ-285) | Game Master only |
| Story Journal | Narrative-memory | read/write/create (REQ-246) | read-only (GM-filtered) |
| Campaign Memory | Knowledge-carrying | read (engine-maintained; GM-filtered) | read-only (GM-filtered) |
| Mechanics | Mechanical | read (engine-populated during Discovery; GM-filtered) | read-only (GM-filtered) |
| World | Spatial | read/write/create/delete (rooms, things, exits, vehicles per §5.10; parser command navigation) | read-only (room descriptions, thing descriptions, exit availability) |
| Story Beats | Scene-anchored | read/write (REQ-335) | read-only (shared-scope beats) |
| Pacing Signal | Temporal | read/write (REQ-336) | read-only |
| Narrative Directive | Session | read/write (REQ-081) | Game Master only |
| Voice Feedback | Session | read (REQ-344) | read/write (own entity) |
| Voice Examples | Entity-bearing | read/write (REQ-077) | read-only (own entity) |
| Background | Knowledge-carrying | read/write (REQ-345) | read-only (own entity) |
| NPC Memory | Knowledge-carrying | read (REQ-311) | read-only |
| World in Motion | Narrative-memory | read/write (REQ-233a) | read-only (shared) |
| Narrative Threads | Narrative-memory | read/write (REQ-281) | read-only (shared) |
| NPC Goal Pursuit | Entity-bearing | read/write (REQ-339) | read-only |
| Autonomous Countdown | Temporal | read/write (REQ-338) | read-only |

Dangers and non-entity combat participants have no IDs, no URIs, no
persistent state. Named NPCs (REQ-075) have IDs, URIs, and persistent state.

The build fingerprint — specification version, ruleset hash, and build
timestamp — is stored in the state directory. On startup with existing state,
the fingerprint determines compatibility (REQ-065).

Session is a Holonovel concept, independent of the MCP transport layer. Session
state exists only while the process holds an active Novel in memory; it is never
written to disk, never persists across process restarts, and is reset to defaults
when the active Novel changes via `novel (action: switch)` or `novel (action: end)`. The badge
activation state — previously per-session — remains persistent with the Novel
because it represents a player-facing state selection that must survive restarts
(REQ-055). This is a naming clarification: the tier previously called "Connection"
was always a Holonovel-level scoping construct, not the MCP protocol's session
layer (which the 2026-07-28 MCP specification has removed). The behavioral contract
is unchanged.

#### 7.7.0 Holodeck archetypes

Novel property groups are classified into 12 archetypes. Each archetype defines
the property's behavioral nature. Coupling pattern rules between archetypes dictate
every cross-property interaction — the coupling table (§7.7.1) is derived from
these rules, not hand-enumerated.

**Content Sources.** Rulesets, supplementary rulesets, and adventure modules are
*inputs* that populate Novel property groups. They are not Holodeck archetypes —
they do not appear in the coupling table (§7.7.1). When a content source populates
a property group, that property group's archetype pattern rules dictate all
downstream couplings. Adventure-specific coupling rows in §7.7.1 are `[none]` —
the couplings already exist through the populated properties' own archetypes.

**Host base capabilities.** Host-level base-capability state — Fate aspects,
Fate points, and stress/consequences (REQ-434–437); Ironsworn momentum, moves,
and progress tracks (REQ-438–440); Forged action rolls, stress, trauma, and
downtime (REQ-441–443) — persists with the Novel (REQ-092) but is not a Novel
property group and has no coupling rows in §7.7.1. Base-capability state is
self-contained: it mutates only through its own tool actions and does not
couple to any property group. Base-capability state is Novel-tier state on the
same footing as property groups: copy, snapshot, archive, and interchange
operations (REQ-240, REQ-241, REQ-334, REQ-096) SHALL include it wherever they
include property-group state. A future base capability that defines
cross-property effects SHALL register as a property group with archetypes and
coupling rows per REQ-370.

| Archetype | Definition | Example property groups |
|-----------|-----------|------------------------|
| Temporal | Progresses over time, fires on completion | Countdown, Faction clock, Pacing signal |
| Entity-bearing | Carries persistent identity with fields | NPC, Faction, Player character |
| Scene-anchored | Changes trigger scene-transition hooks | Scene state, Adventure waypoint, Story beats |
| Knowledge-carrying | Content surfaced by trigger matching | Lore, Secret, Knowledge state, Campaign memory, Background |
| Narrative-memory | Records story events for later recall | Story journal, Session recap |
| Spatial | Defines physical constraints and locations | World model (rooms, things, exits, vehicles) |
| Relational | Links entities through typed connections | Relationships |
| Decision | Presents structured player choices | Choices, Vows, Pending Workflow |
| Guidance | Advisory content, never mechanical | Server notes, Anti-slop, Narrative tone |
| Session | Scoped to the operator's presence | GM Context, Notes, Badge state, Player signals |
| Ruleset Wisdom | Ruleset-extracted behavioral content — the seven output modules (voice_examples, briefing_order, lore_templates, action_patterns, supplementary_guidance, adventure_advice, narrative_voices) produced during Discovery from the ruleset's own text per REQ-225. Persists as build output; not subject to synthesis reversion. Rendered as first-class server behavior, not advisory guidance — where the ruleset describes genre conventions, the server enacts them. Runtime content is the host's vendor manifest (§11.4); ruleset-native items are artifact-scope (§6.3). | Synthesis (all 7 output modules) |
| Mechanical | Ruleset-extracted resolution mechanics with Holodeck coupling effects. Defined during Discovery from extraction categories 1–6. Couples with other archetypes per P34–P37 — the ruleset's own text determines which mechanics affect which Holodeck surfaces. Where the ruleset describes a spell that destroys objects, the Holodeck registers the coupling; where the ruleset describes genre pacing, Wisdom drives the clock. Same Holodeck, different ruleset = different coupling map. | Mechanics (populated during Discovery per REQ-377) |

**Coupling pattern rules.** Each rule is a behavioral contract — a "what," not a
"how." Every row in the coupling table (§7.7.1) traces to one or more of these
rules.

**Keyword matching.** Where a coupling triggers on a trigger keyword or trigger
list (Scene → Lore P2, Background → Lore P54, Vow → Lore P51, and the REQ-083,
REQ-345, REQ-350, REQ-356 surfaces), "match" means a case-insensitive, whole-word
substring match at a token boundary in the target text — never partial-word,
fuzzy, or semantic matching.

| Rule | Source archetype → Target archetype | Behavior | Nature | Holodeck model |
|------|-------------------------------------|----------|--------|----------------|
| P1 | Temporal → Scene-anchored | Temporal properties advance one tick per scene transition | Mechanical | The clock runs while the scene plays |
| P2 | Knowledge-carrying → Scene-anchored | Scene text matched against knowledge triggers; matching knowledge surfaces in badge briefing | Navigational | The world knows what the scene describes |
| P3 | Entity-bearing → Spatial | Entity location fields resolve against spatial room names | Mechanical | Characters exist in physical space |
| P4 | Entity-bearing → Temporal | Entity goals auto-create coupled temporal progress tracks | Mechanical | Purpose drives the clock |
| P5 | Ruleset Wisdom → Knowledge-carrying | Wisdom lore templates mechanically activate on trigger match — the world renders what the ruleset says it knows | Mechanical | The program populates the world's knowledge |
| P6 | Ruleset Wisdom → Entity-bearing | NPCs created while Wisdom is active render with ruleset-derived voice, goals, and personality patterns — no manual activation required | Mechanical | Characters render with genre-appropriate behavior |
| P7 | Ruleset Wisdom → Temporal | Wisdom pacing and encounter patterns mechanically seed countdowns and advance them per the dramatic rhythm extracted during Discovery (REQ-225) | Mechanical | Threats escalate on the program's schedule |
| P8 | Ruleset Wisdom → Scene-anchored | Scene beats and type tags follow the dramatic structure extracted during Discovery (REQ-225); briefing order modules render the ruleset's own narrative architecture | Mechanical + Navigational | The program structures the story |
| P9 | Ruleset Wisdom → Relational | Wisdom relationship patterns mechanically establish relationships between NPCs sharing scene presence when personality fields match the relationship dynamics extracted during Discovery (REQ-225) | Mechanical | The cast relates as the genre dictates |
| P10 | Ruleset Wisdom → Decision | Wisdom action patterns and constraint overrides feed `command (action: suggest)` and the constraint catalog — the computer's reference library | Navigational | The computer consults its library |
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
| P23 | Guidance → Narrative-memory | Advisory content with narrative tags surfaces in narrative briefing surfaces — inert, never mechanical | Navigational | Server notes advise; they don't act |
| P24 | Entity-bearing ↔ Entity-bearing | Entity-bearing properties interact mechanically when sharing scene presence — combat linkage, relationship creation | Mechanical | Characters interact when they occupy the same room |
| P25 | Knowledge-carrying → Relational | Knowledge content overlapping entity/NPC/faction names suggests relationship creation | Navigational | Shared secrets imply connection |
| P26 | Relational → Knowledge-carrying | Relationship state changes (ally ↔ rival ↔ hostile) prompt knowledge entry creation | Navigational | Changed relationships become remembered facts |
| P27 | Entity-bearing → Knowledge-carrying | Entity interaction events — combat, social, disposition shifts — become persistent knowledge facts in entity memory and campaign memory | Mechanical | What characters experience becomes what they know |
| P28 | Temporal → Knowledge-carrying | Temporal fire and state transitions produce discoverable knowledge entries surfaced in the briefing alongside triggered lore | Mechanical | The clock's consequences become known facts |
| P29 | Temporal → Entity-bearing | Temporal signals bypass the Entity-bearing autonomous interval, triggering immediate goal pursuit and disposition updates | Mechanical | Ticking clocks drive character action |
| P30 | Entity-bearing → Narrative-memory | Entity goal-pursuit suggestions surface as World in Motion narrative-memory content for GM accept/defer/dismiss | Narrative | Character purpose drives the story forward |
| P31 | Temporal → Narrative-memory | Temporal fire produces narrative-memory records — countdown consequences become story journal entries | Mechanical | What happens becomes what's remembered |
| P32 | Session → Entity-bearing | Session corrections — voice feedback — update entity voice examples and personality profiles | Mechanical | The operator refines the character |
| P33 | Narrative-memory → Entity-bearing | Narrative-memory entries referencing entity goals or faction interests produce temporal advisories in narrative threads | Navigational | Recorded events signal faction consequences |
| P34 | Mechanical → Spatial | Mechanical outcomes that describe world-affecting effects (destruction, illumination, obstruction, transformation) mutate Spatial properties — room descriptions, thing properties, exits | Mechanical | Your actions change the room |
| P35 | Mechanical → Entity-bearing | Mechanical outcomes affecting entities (conditions, damage, disposition shifts) mutate Entity-bearing properties | Mechanical | Your actions change the characters |
| P36 | Mechanical → Temporal | Mechanical outcomes that create urgency or time pressure (destructive spells, area effects, round-limited mechanics) suggest Temporal property creation | Navigational | Your actions drive the clock |
| P37 | Mechanical → Knowledge-carrying | Mechanical outcomes that reveal information (divination, detection, lore checks) surface as Knowledge-carrying entries | Navigational | Your actions reveal knowledge |
| P38 | Scene-anchored → Spatial | Scene state `location` field resolves against Spatial room names; scene description derives from Spatial state when location matches | Mechanical | The scene describes the room |
| P39 | Temporal → Scene-anchored | Temporal property fire updates Scene-anchored properties sharing scope — a countdown that floods a room updates the scene description | Mechanical | The clock changes the scene |
| P40 | Knowledge-carrying → Scene-anchored | Knowledge-carrying properties active in the current scene surface in Scene-anchored descriptions — lore about a haunted chapel colors the scene | Navigational | What you know colors what you see |
| P41 | Scene-anchored → Entity-bearing | Scene type and atmosphere influence Entity-bearing disposition for entities in scene scope — active combat state makes NPCs hostile, social scenes shift them toward friendly, exploration scenes shift them toward neutral | Navigational | The scene shapes the cast |
| P42 | Entity-bearing → Scene-anchored | Entity-bearing presence registers in Scene-anchored descriptions — NPCs entering a room surface in the scene's `characters_present` field | Mechanical | Characters define the scene |
| P43 | Session → Temporal | Player pacing signals adjust the pacing window — a signal value requesting faster pacing reduces the window threshold; slower pacing increases it | Mechanical | The operator controls the story's rhythm |
| P44 | Session → Temporal | GM narrative directives containing pacing keywords adjust the pacing window threshold — directives requesting faster pacing reduce it, slower pacing increase it | Mechanical | The GM sets the story's tempo |
| P45 | Session → Entity-bearing | GM directives containing autonomy keywords toggle NPC autonomous behavior — "NPCs act independently" enables TTRPG_NPC_AUTONOMY, "characters drive themselves" enables autonomy, "NPCs think for themselves" enables TTRPG_NPC_MIND; directive text evaluated at resolution time | Mechanical | The GM delegates character control |
| P46 | Session → Narrative-memory | GM directives containing reactivity keywords toggle world-in-motion generation — "the world reacts" enables TTRPG_WORLD_REACTIVITY, "living world" enables both reactivity and NPC autonomy | Mechanical | The world comes alive on command |
| P47 | Session → Ruleset Wisdom | GM directives containing synthesis keywords map to synthesis module activation — "use voice patterns" activates voice_examples, "activate lore templates" activates lore_templates, "add flavor" sets TTRPG_SYNTHESIS_AUTO_TRIGGER to on_scene_change | Mechanical | The GM activates story flavor in plain English |
| P48 | Relational → Entity-bearing | Relationship type flips (ally↔rival↔hostile) drive entity disposition shifts for both involved entities | Mechanical | Betrayal changes how the cast behaves — when two characters become rivals, their dispositions shift accordingly |
| P49 | Guidance → Temporal | Guidance content with temporal urgency triggers suggests temporal-property creation in advisory surfaces | Navigational | The GM's notebook can drive the clock — what the operator records as urgent becomes a countdown suggestion |
| P50 | Decision → Session | A pending workflow freezes undo, redo, and badge switching until drained or cancelled; cancellation restores the pre-workflow snapshot over all Novel property groups | Mechanical | The workflow holds the table — no mutation or role change while a decision is open |
| P51 | Decision → Knowledge-carrying | Decision name and description keyword-match against knowledge triggers; matching knowledge surfaces as decision-relevant entries | Navigational | Vows match the Holodeck's knowledge |
| P52 | Scene-anchored → Narrative-memory | Scene beat transitions populate narrative-memory records — the story_beats sequence in the narrative briefing | Narrative | The program structures the story |
| P53 | Temporal → Temporal | A temporal signal coordinates with other temporal properties — a pacing fire advances every countdown | Mechanical | The clock drives the clock |
| P54 | Knowledge-carrying → Knowledge-carrying | Knowledge-carrying properties cross-reference each other — background and memory trigger-match against lore, and per-entity facts promote to campaign knowledge | Navigational | What one knows leads to what else one knows |

#### 7.7.1 Cross-property coupling

The Novel property groups interact through coupling contracts. The coupling table
(§7.7.1a) is the canonical set of cross-property couplings — each row
instantiates an archetype pattern rule from §7.7.0.

*Standing rules.* Unless marked otherwise, every coupling is GM-only. All
countdown-related couplings (rows with a countdown property in either column)
cite REQ-073. All lore-related couplings cite REQ-083. All relationship-related
couplings cite REQ-236.

*Advisory output shape.* A coupling that produces an "advisory in
`narrative_threads`" SHALL render a self-contained suggestion entry in that
section's suggestion surface (REQ-281): the relevant property name(s), a
one-line rationale, and the prompt for the GM to act or ignore. Advisory
couplings are Navigational — they never mutate state; the GM decides. A row
whose advisory is deferred to build is annotated `[unverified]` and recorded
as a convergence finding, never silently dropped.

*Illustrative examples.* Coupling cells that name a specific spell or mechanic
(e.g. "Fireball", "Hold Person", "Detect Magic") do so as illustrative examples
of the coupling contract only — they are not normative content and do not
constrain any ruleset. The normative rule is that coupling effects are derived
from the bound ruleset's own text during Discovery (REQ-377).

##### 7.7.1a Active couplings

| Property pair | Pattern Rule | Coupling | Holodeck model | Badge Scope | Nature | REQs |
| ------------- | ------------ | -------- | -------------- |------------ | ------ | ---- |
| Scene → Lore | P2 | Lore trigger keywords matched against scene description text; changing scene state reactivates or deactivates entries | The Holodeck reads the scene and surfaces what it knows — trigger keywords activate lore | — | Navigational | REQ-083 |
| Scene → Countdown | P1 | Countdowns carrying `on_scene_transition` flag decrement when `scene (action: set)` produces a new description | The clock runs while the scene plays — every scene (action: set) advances the story's urgency | — | Mechanical | REQ-125 |
| Scene → Faction | P1 | Faction clocks advance one tick on each scene transition | Faction clocks tick with the story — every scene transition drives faction momentum | — | Mechanical | REQ-233 |
| Combat ↔ NPC | P24 | NPCs may participate as combat participants alongside entities and dangers | Combat is physical — NPCs exist in the fight alongside characters, not just as narrative | — | Mechanical | REQ-043, REQ-075, REQ-124 |
| NPC → World | P3 | NPC `location` field resolves against spatial room names — NPCs exist in physical space | Characters exist in physical space — NPC location resolves against Holodeck rooms | GM-only (mutation); Player-visible (read) | Mechanical | REQ-369 |
| Synthesis → Lore | P5 | Wisdom lore templates mechanically activate on trigger match | The program populates the world's knowledge — Wisdom lore templates activate mechanically | — | Mechanical | REQ-080 |
| Synthesis → Scene | P8 | Wisdom scene beats and briefing order modules render the ruleset's own narrative architecture | The program structures the story — Wisdom renders the ruleset's narrative architecture | Player-visible (shared-scope), GM-only (GM-scope) | Mechanical + Navigational | REQ-080 |
| Synthesis → NPC | P6 | NPCs created while Wisdom is active render with ruleset-derived voice, goals, and personality patterns — no manual activation required | Characters render with genre-appropriate behavior — Wisdom-driven voices and goals | Player-visible (shared-scope), GM-only (GM-scope) | Mechanical | REQ-080 |
| Mechanics → World | P34 | Mechanical outcomes with world-affecting effects populate coupling metadata during Discovery per REQ-377 — example: Fireball (Spatial, destruction) | Your actions change the room — mechanical outcomes mutate the Holodeck | — | Mechanical | REQ-377 |
| Mechanics → NPC | P35 | Mechanical outcomes affecting entities populate coupling metadata during Discovery per REQ-377 — example: Hold Person (Entity-bearing, condition) | Your actions change the characters — mechanical outcomes affect NPC state | — | Mechanical | REQ-377 |
| Mechanics → Lore | P37 | Mechanical outcomes that reveal information surface as Knowledge-carrying entries per Discovery coupling metadata — example: Detect Magic (Knowledge-carrying, revelation) | Your actions reveal knowledge — detection and divination surface as lore | — | Navigational | REQ-377 |
| Mechanics → Countdown | P36 | Mechanical outcomes that create urgency or time pressure populate coupling metadata during Discovery per REQ-377 — example: a spell imposing a round limit suggests a countdown | Your actions drive the clock — urgency mechanics suggest countdowns | — | Navigational | REQ-377 |
| Faction → Countdown | P4 | `faction (action: create)` auto-creates a countdown with `clock_type: faction` for the faction's primary goal | Purpose drives the clock — every faction carries its own temporal accountability | — | Mechanical | REQ-233 |
| Secret → Relationship | P25 | When secret text overlaps with entity/NPC/faction names, a `suspicious` relationship is recommended | Secrets shared with two names imply connection — the Holodeck sees the overlap | — | Navigational | REQ-234 |
| Relationship → Lore | P26 | When relationship type changes between `ally` and `rival`, the GM is prompted to consider a lore entry | Changed relationships become remembered facts — relationship state changes prompt lore | — | Navigational | REQ-236 |
| Pending Workflow → Countdown | P12 | `scene (action: choices)` with resolved `id` matching a countdown `scope` advances that countdown by one tick | Choices advance the clock — player decisions matching countdown scope tick the timer | — | Mechanical | REQ-235 |
| Pending Workflow → Faction | P12 | `scene (action: choices)` with resolved `id` matching a faction goal keyword advances that faction's clock | Player decisions drive faction momentum — choices matching faction goals advance the clock | — | Mechanical | REQ-235, REQ-233 |
| Pending Workflow → Undo/Redo/Badge | P50 | A pending `[NEED_INPUT]` freezes undo, redo, and set_badge until drained or cancelled; `respond(cancel)` restores the pre-workflow snapshot over all Novel property groups | The workflow holds the table — no mutation or role change while a decision is open | All badges (blocking) | Mechanical | REQ-042, REQ-041, REQ-116, REQ-066 |
| GM Context → State [non-property] | P17 | `novel (action: save_context)` auto-captures faction clock states, countdown positions, NPC dispositions, and entity relationships | The operator's notes follow the scene — pause context captures state for resumption | — | Navigational | REQ-232, REQ-233 |
| Notes → Scene | P17 | Notes tagged with scene anchors surface when that scene is active — badge-filtered per REQ-242 scope | Scene-tagged notes surface when their room appears — the operator's annotations follow the scene | Player-visible, badge-scoped | Navigational | REQ-242 |
| NPC → NPC Memory | P27 | Interaction events (combat, social, mechanical) automatically update NPC disposition and memory facts | What characters experience becomes what they know — interactions create NPC memory | — | Mechanical | REQ-311 |
| Campaign Memory → Scene | P2 | Campaign memory facts are prioritized by scene relevance in `badge_briefing` | Scene-pertinent facts surface in the briefing — campaign memory follows location | — | Navigational | REQ-310 |
| World in Motion → Campaign Memory | P16 | World in Motion accepted changes produce campaign memory facts | The living world becomes recorded history — accepted World in Motion entries persist | — | Mechanical | REQ-233a, REQ-310 |
| NPC Memory → Campaign Memory | P54 | Significant NPC memory events (disposition flips, goal milestones) populate campaign memory per-NPC facts | Significant NPC events persist as campaign facts — memory survives the scene | — | Navigational | REQ-311, REQ-310 |
| Vow → Countdown | P12 | `vow (action: set)` offers a coupled countdown per difficulty tier; `vow (action: milestone)` advances both; countdown fill enables `vow (action: resolve)` | Purpose drives the clock — every vow carries a coupled countdown per difficulty | — | Mechanical | REQ-322 |
| World → Scene | P13 | Parser movement (`go north`) into a new room triggers the scene transition hook (countdown advancement, lore matching) | Entering a new room is a story beat — parser movement triggers the scene-transition hook | GM-only (mutation); Player-visible (read) | Mechanical | REQ-125, REQ-198 |
| Story Journal → Lore | P16 | `story (action: promote)` creates a lore entry from a `revelation` or `moment` journal entry | Remembered events become known facts — story journal entries promote to lore | — | Navigational | REQ-333 |
| Notes → Lore | P17 | Notes tagged with lore keys surface alongside those lore entries in `badge_briefing` | Lore-tagged notes surface alongside their lore entries — annotations follow knowledge | Player-visible, badge-scoped | Navigational | REQ-242 |
| Story Beats → Narrative Threads | P52 | Beat transitions populate the `story_beats` sequence in the `narrative_threads` briefing section | The program structures the story — beat transitions populate the narrative arc | GM-only (GM surface), Player-visible (shared-scope beats in Player surface) | Narrative | REQ-335, REQ-281 |
| Story Beats → Countdown | P1 | `climax` beat accelerates `on_scene_transition` countdowns by `TTRPG_CLIMAX_ACCELERATION` ticks (default 2); `setup`/`denouement` beats use standard rate | Dramatic structure accelerates the clock — climax speeds up countdown advancement | — | Mechanical | REQ-335, REQ-353, REQ-125 |
| Pacing Signal → Narrative Threads | P31 | When the pacing counter exceeds `TTRPG_PACING_WINDOW`, a pacing signal renders in `narrative_threads` | The operator controls the story's rhythm — pacing signals render in narrative threads | — | Narrative | REQ-336, REQ-281 |
| Pacing Signal → Autonomous Countdown | P53 | When a pacing signal fires, every faction clock receives an immediate autonomous tick, overriding the interval threshold | Ticking clocks drive faction action — pacing signals advance every faction clock | — | Mechanical | REQ-336, REQ-338, REQ-351 |
| Pacing Signal → NPC Goal Pursuit | P29 | When a pacing signal fires, every goal-carrying NPC produces an immediate goal pursuit suggestion | Ticking clocks drive character action — pacing signals trigger NPC goal pursuit | — | Mechanical | REQ-336, REQ-339, REQ-351 |
| Scene → World | P38 | `scene (action: set)` with `location` resolving to a room derives scene description from world-model state | The scene describes the room — location resolves against Holodeck spatial state | GM-only (mutation); Player-visible (read) | Narrative | REQ-342 |
| command (action: suggest) → command (action: resolve) | P10 | Spatial domain results in `command (action: suggest)` delegate to `command (action: resolve)` for exit, constraint, and thing context — same resolution pipeline | The computer consults its library — spatial intent resolution shares the pipeline | GM-only (command (action: resolve)); Player-visible (command (action: suggest) results) | Navigational | REQ-343, REQ-323 |
| Faction → Autonomous Countdown | P4 | Faction clocks advance an autonomous tick per `TTRPG_FACTION_AUTONOMY_INTERVAL` transitions; pending-fire countdowns surface as workflow decisions | The clock runs while the story plays — factions advance autonomously | — | Mechanical | REQ-338 |
| Autonomous Countdown → NPC Goal Pursuit | P29 | When a faction autonomous tick represents an outcome overlapping an NPC's goal, that NPC's goal pursuit suggestion is suppressed for this transition | Faction momentum coordinates with character purpose — overlapping goals suppress NPC pursuit | — | Mechanical | REQ-338, REQ-339, REQ-348 |
| NPC → World in Motion | P30 | NPC goal-pursuit suggestions surface in `badge_briefing` World in Motion for GM accept/defer/dismiss | Character purpose drives the story forward — NPC goals surface as narrative suggestions | — | Narrative | REQ-339, REQ-233a |
| NPC Mind → World in Motion | P30 | NPCs carrying a populated `mind.directive` (REQ-075f) surface an `auto-apply` option alongside accept/defer/dismiss when `TTRPG_NPC_MIND=on` | Character purpose drives the story forward — NPC directives enable auto-applied goal pursuit | — | Mechanical | REQ-339d, REQ-075f |
| Countdown → Story Journal | P31 | Countdowns that fire while the player's entity is absent produce `[discovered]` consequence entries | What happens becomes what's remembered — absent-player countdown fire produces discovered consequences | GM-only (fire); Player-visible (discovered consequences via knowledge_state) | Mechanical | REQ-340, REQ-246 |
| Countdown → Lore | P28 | `[discovered]` consequences populate the discovering entity's `knowledge_state` with the countdown name, consequence text, and `source: discovered_consequence` | The clock's consequences become known facts — discovered events populate knowledge state | GM-only (write); Player-visible (read own-entity) | Mechanical | REQ-340, REQ-349, REQ-286 |
| Voice Feedback → Voice Examples | P32 | Player voice_feedback corrections update entity voice_examples with [player-corrected] annotation | The operator refines the character — player corrections update NPC voice patterns | Player-only (write); GM-visible (read) | Mechanical | REQ-344, REQ-077 |
| Background → Lore | P54 | An entity's `background` string is tokenized and matched against lore entry triggers; matching `shared`-scope entries surface in `knowledge_state` tagged `[background-relevant]` | Your character's past matches the Holodeck's secrets — background text triggers lore entries | Player-visible (read own-entity background matches) | Navigational | REQ-345, REQ-350 |
| Secret → Countdown | P19 | `lore (action: reveal)` with matching countdown `scope` produces countdown-advancement advisory in `narrative_threads` | Revealed secrets drive the clock — secret revelation advances matching countdowns | — | Navigational | REQ-355, REQ-234 |
| Vow → Lore | P51 | Vow name/description keyword-matched against lore triggers; matching lore surfaced as `[vow-relevant]` in `narrative_threads` | Vows match the Holodeck's knowledge — vow keywords trigger relevant lore | GM-only (advice); Player-visible (shared-scope vows, narrative_threads per REQ-281) | Navigational | REQ-356, REQ-289 |
| Story Journal → Faction | P33 | `consequence` and `moment` entries referencing faction goal entities produce faction-clock-advancement advisory in `narrative_threads` | Recorded events signal faction consequences — journal entries drive faction advisories | — | Navigational | REQ-357, REQ-246, REQ-233 |
| Countdown → NPC | P15 | Countdown fire shifts disposition of NPCs whose `location` matches countdown `scope` by one step toward countdown `direction` | Threats change how characters feel — countdown fire shifts NPC disposition | — | Mechanical | REQ-358, REQ-075 |
| Countdown → World | P14 | `world_effect` fires on countdown, mutates world-model properties (describe, property, exit) | When the clock strikes, the room changes — world_effect mutates the Holodeck | — | Mechanical | REQ-368 |
| Vehicle → Scene | P13 | Vehicle entry/exit records story journal moment entries | Entering a vehicle is a story moment — vehicle entry/exit records journal entries | GM-only (write); Player-visible (read) | Navigational | REQ-317 |
| World → Synthesis | P11 | World-model rooms and things as synthesis source for adventure_advice and lore_templates | The room design suggests the story — spatial state seeds Wisdom templates | — | Navigational | §11 |
| Synthesis → Constraint Overrides | P10 | `constraint_override` component_type items feed override design patterns | The computer consults its library — Wisdom overrides feed constraint catalog | — | Navigational | REQ-354 |
| Synthesis → Countdown | P7 | Wisdom pacing and encounter patterns mechanically seed countdowns and advance them per the dramatic rhythm extracted during Discovery (REQ-225) | Threats escalate on the program's schedule — Wisdom mechanically seeds countdowns | — | Mechanical | REQ-371, REQ-225 |
| Synthesis → Relationship | P9 | Wisdom relationship patterns mechanically establish relationships between NPCs sharing scene presence when personality fields match the relationship dynamics extracted during Discovery (REQ-225) | The cast relates as the genre dictates — Wisdom establishes relationship patterns | — | Mechanical | REQ-371, REQ-225 |
| Relationship → Countdown | P18 | Relationship flip from `ally` to `rival`/`hostile` with matching countdown `scope` produces countdown-advancement advisory in `narrative_threads` | Betrayal signals the clock — relationship flip advances matching countdowns | — | Navigational | REQ-359 |
| Lore → Countdown | P19 | Lore entries with temporal urgency triggers suggest countdown creation in `narrative_threads` | Urgent knowledge demands a countdown — temporal urgency triggers suggest countdown creation | — | Navigational | REQ-360 |
| NPC → Vow | P20 | Goal-carrying NPCs with goal text at or above `TTRPG_VOW_SUGGESTION_GOAL_MIN_CHARS` chars and no matching active vow produce vow-creation suggestion in `narrative_threads` | Purpose suggests a quest — goal-carrying NPCs prompt vow creation | — | Navigational | REQ-361, REQ-077, REQ-289 |
| Faction → Vow | P20 | Faction goals intersecting known entities/locations from lore or story journal produce vow-creation suggestion in `narrative_threads` | Faction purpose suggests quests — faction goals intersecting known entities prompt vows | — | Navigational | REQ-362, REQ-233, REQ-289 |
| Secret → World | P21 | Secrets with `world_target` room ID match triggers against room description; surfaced as `[world-linked]` in `narrative_threads` | Secrets are anchored to places — world-target secrets link to Holodeck rooms | — | Navigational | REQ-363, REQ-234, REQ-195 |
| Faction → World | P22 | Factions with `territory` room IDs surface tagged `[territorial]` in `narrative_threads` when scene location matches | Faction turf defines presence — territorial factions surface when scene matches | — | Navigational | REQ-364, REQ-233, REQ-195 |
| Countdown → Scene | P39 | Countdown fire with scene scope updates the current scene description — countdown `world_effect` type `"scene"` mutates the scene state | The clock changes the scene — countdown fire updates scene description | — | Mechanical | REQ-369 |
| Lore → Scene | P40 | Active lore entries with current-scene triggers surface the lore content in the scene description tagged `[lore-relevant]` | What you know colors what you see — active lore surfaces in scene description | GM-only (GM surface), Player-visible (shared-scope lore) | Navigational | REQ-369 |
| Scene → NPC | P41 | Active combat state (REQ-043) shifts NPC disposition toward hostile; `social` scene type shifts toward friendly; `exploration` scene type shifts toward neutral — advisory surfaced in `narrative_threads` | The scene shapes the cast — scene type drives NPC disposition advisories | — | Navigational | REQ-369, REQ-043, REQ-075 |
| NPC → Scene | P42 | NPC presence in the current scene surfaces in `characters_present` field — NPCs whose `location` matches the active room auto-register | Characters define the scene — NPC presence registers in characters_present | GM-only (mutation); Player-visible (read) | Mechanical | REQ-369, REQ-075 |
| NPC → Countdown | P4 | Goal-carrying NPCs in the current scene produce countdown-advancement advisory in `narrative_threads` when their goal-text length is at or above `TTRPG_NPC_URGENCY_THRESHOLD` | NPC urgency drives the clock — goal-carrying NPCs suggest countdown advancement | — | Navigational | REQ-369, REQ-077 |
| Player Signal → Pacing Window | P43 | `character (action: signal, "pace", "faster")` reduces TTRPG_PACING_WINDOW; "slower" increases it; "normal" restores default | The operator controls the story's rhythm — player pacing signals adjust the window | Session-scoped (write); GM-visible (read via spec_health) | Mechanical | REQ-069 |
| Narrative Directive → Pacing Window | P44 | Directive text containing pacing keywords ("faster", "slower", "brisk", "leisurely") adjusts TTRPG_PACING_WINDOW | The GM sets the story's tempo — directive pacing keywords adjust the window | GM-only | Mechanical | REQ-081 |
| Narrative Directive → NPC Autonomy | P45 | Directive text containing autonomy keywords ("NPCs act independently", "characters drive themselves") enables TTRPG_NPC_AUTONOMY; directive text containing disabling keywords disables it | The GM delegates character control — directive autonomy keywords toggle NPC autonomy | GM-only | Mechanical | REQ-081 |
| Narrative Directive → NPC Mind | P45 | Directive text containing NPC-mind keywords ("NPCs think for themselves") enables TTRPG_NPC_MIND; directive text containing disabling keywords disables it | The GM delegates character thought — directive mind keywords toggle NPC auto-play | GM-only | Mechanical | REQ-081, REQ-339d |
| Narrative Directive → Autonomy `[non-property]` | P45 | Directive autonomy keywords also map to `scene (action: autonomy)` sliders — "play it safe" sets `safety=safe`, "hardcore mode" sets `safety=hardcore` — text evaluated at resolution time | The operator tunes the AI's grip in plain English | GM-only | Mechanical | REQ-081, REQ-306 |
| Narrative Directive → World in Motion | P46 | Directive text containing reactivity keywords ("the world reacts", "living world", "active factions") enables TTRPG_WORLD_REACTIVITY; disabling keywords disable it | The world comes alive on command — directive reactivity keywords enable world reactivity | GM-only | Mechanical | REQ-081 |
| Narrative Directive → Synthesis | P47 | Directive text containing synthesis keywords ("use voice patterns", "activate lore templates", "use action patterns", "add flavor") maps to the corresponding synthesis module or auto-trigger activation | The GM activates story flavor in plain English — directive keywords map to synthesis modules | GM-only | Mechanical | REQ-081, REQ-260 |
| Server Notes → Narrative Threads | P23 | Server notes with `narrative_tag` surface in `badge_briefing` supplementary guidance alongside synthesis items | Server notes advise; they don't act — narrative-tagged notes surface in briefing | — | Navigational | REQ-365, REQ-285 |
| Relationship → NPC | P48 | When a relationship type flips to `hostile` or `rival`, both involved NPCs shift disposition one step toward the new type — `hostile` → disposition shifts hostile, `rival` → disposition shifts suspicious | Betrayal changes how the cast behaves — relationship flips shift NPC disposition | — | Mechanical | REQ-369, REQ-236, REQ-075 |
| Entity ↔ NPC | P24 | Player character entities and NPCs sharing scene presence produce interaction advisories in `narrative_threads` with relationship-creation suggestions when entity background or goals overlap NPC domains | The player and the cast share the same room — entity-NPC co-presence produces interaction advisories | Player-visible (read own-entity interactions); GM-visible (all) | Navigational | REQ-369, REQ-307, REQ-308, REQ-345 |
| Faction → World in Motion | P30 | Faction goal milestones surface alongside NPC goal pursuits in `badge_briefing` World in Motion — GM may accept (advances faction clock), defer, or dismiss | Faction purpose drives the story — faction goals surface alongside NPC goals | — | Narrative | REQ-338, REQ-339, REQ-233a |
| Autonomous Countdown → Story Journal | P31 | Faction clock fire produces `[faction-event]` story journal `consequence` entries surfaced in `session (action: recap)` and `badge_briefing` narrative context | Faction momentum becomes story memory — clock fire records journal entries | — | Navigational | REQ-338, REQ-246 |
| Story Journal → NPC | P33 | `consequence` or `moment` entries referencing an NPC by name flag that NPC for goal-pursuit suggestion in next World in Motion cycle — past events prompt current NPC behavior | Past events remind NPCs of unfinished business — journal entries prompt NPC goal pursuit | — | Navigational | REQ-246, REQ-339 |
| Story Beats → NPC | P41 | Beat transitions drive NPC disposition advisories — `climax` beat shifts combat-ready NPCs toward hostile, `denouement` shifts all NPCs toward neutral — surfaced in `narrative_threads` | The dramatic structure shapes the cast — beat transitions drive NPC disposition advisories | — | Navigational | REQ-335, REQ-353, REQ-075 |
| Scene → Faction | P41 | Scene type and atmosphere surface faction-relevant advisories in `narrative_threads` — active combat state (REQ-043) highlights aggressive faction goals, social scenes highlight faction alliances and negotiations | Factions loom larger when the scene matches — scene type highlights relevant faction activity | — | Navigational | REQ-233, REQ-043, REQ-087 |
| Server Notes → Countdown | P49 | Server notes with temporal urgency keywords ("imminent", "within hours", "by dawn") suggest countdown creation in `narrative_threads` when scene scope matches or note is unscoped | The GM's notebook can drive the clock — temporal urgency notes suggest countdowns | — | Navigational | REQ-365, REQ-285, REQ-073 |

##### 7.7.1b Coupling curation

The coupling table (§7.7.1a) is the canonical set of cross-property couplings.
Each row instantiates an archetype pattern rule from §7.7.0 — the pattern rules
define interaction categories; the table instantiates them as specific
property-group pairs. The table is curated — not every combinatorially possible
archetype-pair instantiation is a meaningful coupling.

`npm run validate` SHALL verify that every pattern rule in §7.7.0 (P1–P54,
excluding content-source-excluded rules) has at least one coupling row in
§7.7.1a. A pattern rule with zero coupling rows is a spec defect. A coupling
row citing a pattern rule whose source or target archetypes do not match the
row's property-group archetypes is a spec defect. A coupling row whose
property-pair column carries the `[non-property]` marker is a single-property
snapshot or tool-delegation workflow, not a cross-property coupling — it is
exempt from archetype matching but still counts toward its pattern rule's
coupling-row coverage.

Content source groups (Adventure, Adventure Scene Waypoint, Adventure Index,
Codex) are excluded — their populated property groups couple via their own
archetype rules (§7.7.0). Session-scoped groups (GM Context, Notes, Server
Notes) couple per their pattern rules (P17, P23, P32); pairs not covered by
those rules produce no couplings. Input-validation workflows —
character-creation step-by-step decisions (REQ-104, REQ-151, REQ-152),
confirmation prompts (`novel (action: end)` REQ-140, `novel (action: checkpoint_restore)` REQ-241,
`session (action: compress)` REQ-239), and parser command disambiguation (§5.10) — are
single-property input workflows, not cross-property couplings; they produce no
coupling rows.

The Observer badge (REQ-305) is read-only — the Observer sees all
navigational couplings at GM visibility level and no mechanical couplings.
Dual-scope rows marked "GM-only (mutation); Player-visible (read)" are
GM-only for Observer: the Observer does not mutate state.

A coupling marked "Navigational" means it affects only guidance surfaces
(`badge_briefing`, resource rendering, suggestion tools) and does not influence
mechanical resolution (dice, HP, conditions). A coupling marked "Mechanical"
means it directly affects state mutation or tool behavior. A coupling marked
"Narrative" means it affects narrative coherence and is verified during the
G7 narrative coherence attestation (REQ-346); narrative couplings do not
block mechanical Pattern Buffer sub-workflows. When a source
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

