## 4. Standing Rules and Terminology

**Constitution.** These rules are the project's immutable foundation. They apply to
every feature, every build, and every spec revision, regardless of ruleset or target
platform. A substantive change to any standing rule requires a spec version bump and a
CHANGELOG entry. The builder SHALL treat these rules as non-negotiable. They override
any conflicting instruction in §5–§11. Changes to terminology or clarity wording that
do not alter meaning are editorial and do not require a version bump.

**Standing rules.**

1. The server keeps no state between calls. All build-level state is in-process and
   rebuilt from scratch on startup. Novel state persists to disk (REQ-092).
2. Randomness is deterministic and seedable (REQ-050).
3. No network access at runtime (REQ-051).
4. The server trusts nothing client-supplied; every tool validates its inputs (REQ-054).
5. Badge gating is enforced server-side (REQ-032).
6. **LLMs propose intentions; the engine validates and executes.** The AI narrator
    never directly mutates story state — every change flows through validated
   tools. This is the same architecture as rpg-mcp's embodiment model, enforced
   server-side by badge gating (REQ-032), tool-result fidelity (REQ-058),
   and parameter canon validation (REQ-059).
7. **Contracts, not implementations.** Requirements state what the server must do. The
   convergence loop (§6.5) and verification workflows (§8) enforce quality. Do not prescribe
   how. The REQ authoring checklist in Appendix M governs what belongs in a REQ.
8. **Red-team every REQ.** Before finalizing a new or modified REQ, answer four
   questions: (a) How could an AI builder misinterpret this requirement? Read each
   sentence and list a plausible wrong reading. (b) What words in this REQ body are
   ambiguous or context-dependent? Flag every hedge, every undefined term, every
   ruleset-relative concept. (c) What edge case does this REQ not cover? Think across
   ruleset paradigms — diceless, level-less, classless, single-stat. (d) What ruleset
   paradigm would make this REQ inapplicable or contradictory? If any question
   produces a concrete gap, tighten the REQ or record the gap in Appendix M. This is a
   spec-authoring discipline — not a mechanical check — and is exercised by the author,
    not the builder. No _Check:_ citation attaches.
9. **Ruleset-free skip rule.** When B1 is `none`, every check, metric, or
    workflow that requires ruleset content SHALL be skipped with a `ruleset-free —
    skipped` annotation in DECISIONS.md. The builder SHALL NOT attempt to measure,
    score, or verify ruleset-derived properties in ruleset-free mode. Fixture
    selections, workflow branches, and verification steps that carry explicit
    ruleset-free clauses in their own sections SHALL follow those specific clauses
    in preference to this general rule.
10. **Plain English, no tool names.** User-facing narrative prompts — `intro`,
    `session_zero`, and `novel_setup` — SHALL describe capabilities in plain
    English with plaintext examples: what the user does, not what the tool is
    called. Tool names, parameter shapes, and technical syntax SHALL NOT appear
    in these prompts. The builder writes as if instructing a person, not
    documenting an API. Narrative capability descriptions SHALL use plaintext
    examples: a sentence the player or GM would write, not a function signature.
    Operational prompts (`badge_briefing`, `run_workflow`) and tool output
    (`command (action: suggest)`) are exempt — their content contracts are defined by their
    respective REQs. This rule is verified at G4 and G5 — narrative prompts
    containing tool names or technical syntax are a construction defect.
11. **Holodeck config alignment.** Every behavioral configuration dimension — any
    `TTRPG_*` variable or narrative-tool parameter that affects story pacing,
    character behavior, world reactivity, tone, autonomy, synthesis activation,
    or narration style — SHALL register a natural language access path via a
    coupling row in §7.7.1a with a Session-archetype source (`character (action: signal)` or
    `scene (action: directive)`). System configuration (storage caps, file paths,
    build parameters, seed values) is exempt. The coverage of behavioral configs
    with natural language access paths SHALL be mechanically verified at
    assembly time, reported in `spec_health` at runtime, and checked against the
    Appendix M authoring checklist before every new or modified REQ is committed.
12. **REQ atomicity.** Every requirement is exactly one paragraph — no
    exceptions. A REQ body that requires a second paragraph (blank line),
    a bullet list, a numbered step sequence, or an embedded table is at
    minimum two REQs. Sub-REQs (XXXa, XXXb) are the mechanism for
    composable concerns. `npm run check` enforces this mechanically via
    `validate --sdd-strict` — violations exit non-zero and block commits.

**Terminology.**

| Term           | Meaning                                                                                  |
| -------------- | ---------------------------------------------------------------------------------------- |
| Operator       | The human running the build.                                                             |
| Builder        | The AI executing this specification.                                                     |
| Verifier       | A second, independent AI that re-runs the verification workflow suite (§10).                               |
| Ruleset        | The TTRPG source material — Markdown, or converted to Markdown.                           |
| Model          | The extracted semantic model of the ruleset (RULESET_MODEL.md).                           |
| Badge        | Active badge — `player`, `game_master`, `observer`, or `none` (Editor, full access). Four badges: Player, Game Master, Observer, Editor. Wearing the player, game_master, or observer badge means you are in the story. REQ-031, REQ-066.         |
| Story       | The active play session — a period during which a badge is active and narration is happening. Starts with `set_badge("player")` or `set_badge("game_master")`. Ends with `set_badge("none")`. Multiple stories can occur within one Novel's lifetime. |
| In the story | Player or GM badge is active. Player or GM is making decisions, narration is flowing. While in the story, confine actions and responses to the current Novel — `set_badge("none")` switches to the Editor badge, stepping away from the table. |
| Editor badge | Full access to all tools. Setting up characters, building the world, loading adventures, refining lore. The default badge on Novel creation and resume. Out of the story. |
| Story Journal  | The Novel's narrative memory — a typed, timestamped journal of decisions, moments, revelations, bonds, and consequences the GM chooses to record. Surfaced in session (action: recap), badge_briefing, and novel (action: export). REQ-246. |
| State ledger    | The `state_ledger` briefing token — reports the last state-mutation timestamp and per-group mutation counts for the session, so the GM sees at a glance what has been persisted. REQ-401. |
| State drift     | The condition where the GM has narrated (via pause context or prose) advances beyond what has been committed through state tools. Surfaced as a `[state-drift]` marker and gated by `TTRPG_STATE_GATE`. REQ-403. |
| Health report (`spec_health`) | The build-health diagnostic report produced by the `session` tool's `health` action (REQ-025, REQ-429). Reports live-registry counts, confidence, convergence summary, indexed counts, safety protocols, and badge-filtered sub-reports. `spec_health` names the report surface throughout this specification, not a tool. |
| Roster         | Persistent character store surviving games; baseline values immutable.                    |
| Server Notes   | Server-level key-value note store surviving Novels and rebuilds. `server-notes://<key>`. Game Master only. REQ-285. |
| Codex          | Server-level typed content library for reusable content (NPCs, characters, scenes, encounters, lore, factions, countdowns, rooms, things, equipment, spells, relationships, voice profiles, adventures) that persists outside Novels. `codex://<id>`. Accessible under the Editor badge; badge-filtered by visibility field per REQ-321. |
| Novel         | One named, persistent save file identified by `TTRPG_NOVEL`. Holds all          |
|               |               entities, NPCs, scene state, countdowns, lore, synthesis, adventure,            |
|               | audit log, snapshots, and badge state for a single ruleset story. A Novel          |
|               | can be edited under the Editor badge. The story begins when a       |
|               | badge is activated and ends when the badge is removed — the Novel persists.          |
|               | Persists to `.holonovel-state/novels/<slug>.json`; survives process restarts      |
|               | and rebuilds. Removed from disk by `novel (action: end)`. Multiple Novels per server       |
|               | instance; one active per connection. Isolated from other Novels.                  |
| Connection     | One MCP transport lifecycle; born at startup, dies at close. No persistent   |
|                | state of its own — Novel state and audit log survive the connection.         |
| Convergence loop | Iterative quality-enforcement (§6.5) measuring extraction quality, coverage, and compliance. |
| Danger           | Non-entity combat participant with no persistent ID or state; auto-resolved. |
| Holodeck Coupling | Cross-property interaction contract (§7.7). Pattern rules (P1–P54) define archetype-pair interactions; the coupling table (§7.7.1a) instantiates them as specific property-group pairs. Each coupling has a nature (Mechanical, Navigational, or Narrative) and badge scope. |
| Pattern Buffer         | Operational verification suite (§6.6) — 33 sub-workflows against a running server. |
| Badge briefing         | `badge_briefing` prompt — composes guidance, state, lore, and registry content badge-filtered. |
| Macro            | Token `{{<path>}}` expanded to live state values before delivery. REQ-085. |
| Computer      | The system persona. The server answers to "Computer" — the Holodeck's voice. The canonical name for the MCP server in all user-facing surfaces. The registered MCP server name is operator-chosen (B6), defaulting to `[game_name]-holonovel`. |
| AI narrator    | The runtime AI persona that renders narrative prose against engine-validated state. Standing Rule 6: the narrator proposes intentions; the engine validates and executes. |
| Engine         | The validated execution core that owns canonical state — dice resolution, badge gating, parameter canon, coupling effects, State/Observation/Badge properties. The "server" is the MCP process wrapping the engine; the "narrator" is the AI rendering prose against engine truth. |
| Ruleset Wisdom | Build-time-extracted play guidance from the ruleset's own text (voice examples, action patterns, lore templates, pacing, encounter seeds). Not the D&D ability score — the name references the ruleset as the source of play wisdom. Tagged `[ruleset]` or `[vendor]` (REQ-225, REQ-371). |
| Clock          | A display synonym for a countdown — faction clocks, vow-coupled countdowns, and narrative timers. The tool/state mechanism is named "countdown"; "clock" describes the same device in prose (REQ-073, REQ-233, REQ-322). |
| Provenance tier | The source-of-truth classification of indexed or synthesized content: `[ruleset]` (Tier 1) and `[vendor]` (Tier 1 — Ruleset Wisdom vendor content), `[supplementary]` (Tier 2 — synthesis, external and internal), and `[player]` (player-authored). "Tier 1/2" is display shorthand for these tags. |
| Waiver           | Recorded acceptance of a REQ deviation with justification and re-activation condition. REQ-013. |
| World             | The world-model package (`holonovel`). Rooms, things, exits, parser commands, kind hierarchy (thing, container, supporter, door, device, vehicle, person, backdrop, region), `world (action: convert)`. Serves as spatial foundation for scene composition when populated — defines what is physically possible. Surface prominence configurable via `TTRPG_WORLD_PROMINENCE` (REQ-309). §5.10. |
| World prominence   | Build-time `TTRPG_WORLD_PROMINENCE` setting (REQ-309): `visible` (default), `secondary`, or `prominent`. Controls default surface emphasis of world-model and narrative tools across help, `badge_briefing`, and `command (action: suggest)`. Skipped in ruleset-free mode. |
| Novels            | The save-file layer. Lifecycle (`novel (action: create)`, `novel (action: resume)`, `novel (action: end)`, `novel (action: switch)`, `novel (action: clone)`), exchange (`novel (action: export)`, `novel (action: import)`, `lore (action: export)`, `lore (action: import)`), checkpoints (`novel (action: checkpoint_set)`, `novel (action: checkpoint_list)`, `novel (action: checkpoint_restore)`, `novel (action: checkpoint_remove)`), notes (`note (action: set)`, `note (action: remove)`, `note (action: list)`—badge-scoped per REQ-242), resume state (`novel (action: save_context)`, `novel (action: get_context)`), archive (`novel (action: archive)`, `novel (action: unarchive)` per REQ-334), and genre (`novel (action: genre)` per REQ-294). Notes and server notes (REQ-285) are scoped per their respective REQs. |
| Badges              | The identity and permission layer. `set_badge` switches between `player`, `game_master`, `observer`, and `none` (Editor). Badge gating (REQ-032) enforces tool access server-side — `observer` is read-only (spectator). The AI's narrative role is the counterpart of the active badge by default (REQ-304): human as Player → AI briefs as Game Master, human as Game Master → AI briefs as Player. Configurable via `TTRPG_AI_ROLE`. `badge_briefing` (REQ-109) composes orientation from the AI role and state surface from the active badge. Adjustable autonomy (REQ-306) controls how much the AI auto-plays. `session (action: briefing_order)` (REQ-082) lets the GM reorder briefing sections. The cross-property coupling table (§7.7.1) documents badge-scope annotations for every coupling — each row identifies whether the coupling is GM-only, Player-visible, or Player-only. |
| AI Role           | The narrative role the AI plays — derived as the counterpart of the active badge by default, or locked to `game_master` / `player` via `TTRPG_AI_ROLE` (REQ-304). Determines the orientation content in `badge_briefing` (foundations, anti-slop, tone, behavioral boundaries). When the human is the Game Master, the AI's role is Player — the AI inhabits a character. When the human is the Observer, the AI plays both roles. |
| Observer          | Spectator mode (REQ-305). The human wears the Observer badge (`set_badge("observer")`) — read-only access to the Novel. The AI plays both Player and Game Master. The human watches the AI write the Novel, stepping in for mechanical decisions at the configured autonomy level (REQ-306). Maps to Holodeck objective mode. |
| Autonomy          | Configurable AI decision delegation (REQ-306). Four independent sliders: `level` (full/mechanical_prompt/manual), `confirmation` (auto/confirm/prompt), `safety` (safe/moderate/hardcore), `creativity` (predictable/standard/chaotic). Novel-scoped, GM-only, persisted to disk. Controls how much the AI auto-plays vs. defers to the human. `mechanical_prompt` only pauses for TTRPG ruleset mechanics — world-model and narrative actions are never paused. |
| Presence          | Entity presence tracking (REQ-307). Each entity carries a `present` flag and `last_location` field, derived from the `characters_present` parameter on `scene (action: set)`. Non-present entities are marked `[not present]` in `badge_briefing` and the party resource. The GM controls presence with `scene (action: presence)`. |
| Knowledge Gating  | Presence-scoped knowledge (REQ-308). An entity only learns percepts from scenes where it was present. Knowledge gained from attended scenes is retained regardless of current presence. The `knowledge_state` briefing section shows only what the active entity knows based on scenes it attended. The GM controls information sharing across characters via `lore (action: reveal)`. |
| Narrative         | The story-content layer, grouped by function: Scene & Tone (scene state, scene type, narrative directive), Cast & Characters (NPCs, personality, voice examples, relationships), World State (lore, factions, countdowns, secrets), Player Interaction (choices, action suggestions, player signals), Story Memory (story journal, session recap), Session Management (briefing ordering, adventure load/generation), and Synthesis Controls (revert, granular activation, player suppression). Ruleset-derived tools (canonical lookups, dice resolution, conditions) are not infrastructure. |
| Ruleset-free mode | The base host operating with no ruleset packages installed: no TTRPG ruleset is indexed; the server provides a freeform narrative roleplay surface — scene management, NPCs, lore, player choices, and world-model interactions. REQ-218. |
| Host server       | The base `holonovel` server — ruleset-free by default, the sole MCP entry point. It loads declarative ruleset packages (REQ-389), never changes when a package is installed or removed, and updates without touching installed packages or user data (REQ-390). |
| Ruleset package   | A self-contained declarative artifact produced by the Package step (§6.4.2): the extracted model, full-text search index, tool schemas with execution logic as data, resources, prompts, a content hash, and a version manifest. Loaded by the host without re-parsing ruleset Markdown (REQ-389). |
| Install directory | The well-known directory from which the host scans and validates installed packages at startup. Lives under the preserved state directory (`TTRPG_DATA_DIR`) so it survives updates (REQ-390, §7.6). |
| Deployment        | The git-managed specification repository (source of truth, edited by maintainers) versus the separately deployed host server tree (built from it, hosting runtime state). Spec changes reach the deployed server only via the Update workflow (§6.7) and the fingerprint gate (REQ-394); user data and installed packages live outside the spec repository (REQ-396, REQ-397, REQ-398). |
| User data         | Operator-owned persistent state served by the host: Novels (including embedded world-model data), roster, codex, server notes, and installed ruleset packages. Preserved byte-for-byte across deploys and host updates (REQ-396, REQ-397). |
| Host version      | The CalVer of the host server at the time a package or state artifact was produced, recorded in each package's version manifest (REQ-389). Compatibility between the host and installed packages or state artifacts is determined by the package-format and data-format fingerprints, not by this string alone (REQ-420, REQ-423). |
| Package-format fingerprint | A content hash of the package-contract sections (§5.16, §5.17, §6.3, §6.4.2) of the assembled specification, computed at Package time and recorded in each package's version manifest. The host compares it against its own current value at startup and after a host update (REQ-420). |
| Data-format fingerprint | A content hash of the state-model sections (§7.7, §5.9, §5.19, Appendix Q) of the assembled specification, computed at write time and recorded in every persisted user-data artifact. The host compares it against its own current value at startup and after a host update (REQ-423). |
| Drift             | A change detected after build between a source artifact and the fingerprint recorded at build time, surfaced as `[ruleset-drift]`, `[spec-drift]`, or `[holonovel-drift]` (REQ-065). Distinct from format-stale and incompatible. |
| Format-stale      | A persisted state artifact written under a data-format fingerprint that differs from — or is absent from — the host's current value; surfaced as `[data-stale]` and always loadable (REQ-423). Distinct from stale (synthesis age) and incompatible (packages). |
| Incompatible      | A ruleset package whose package-format fingerprint differs from — or is absent from — the host's current value; held inactive and surfaced as `[package-incompatible]` (REQ-420). |
| Stale             | A synthesis item older than the configured freshness window, surfaced with a `[stale]` marker (REQ-080, REQ-102). Distinct from format-stale. |
| Ruleset slug     | A filename-safe identifier for a ruleset (e.g., `dnd5e`, `starfinder`, `osr`). Derived from the ruleset identifier (B2) using slug rules (§7.1a). Used as the tool prefix for ruleset-derived tools (REQ-379). Recorded in DECISIONS.md (1). |
| Tool prefix      | The ruleset slug prepended to every ruleset-derived tool name with an underscore separator: `<slug>_<tool_name>`. Infrastructure tools (REQ-020 categories) carry no prefix. The server reports the prefix-to-ruleset mapping in `spec_health`. REQ-379. |
| Package set      | The installed ruleset packages known to the host. Each package was built independently by the Package step (§6.4.2), installed via `ruleset (action: install)`, and hydrated lazily on first activation of a Novel bound to its slug (REQ-390). |
| Ruleset scope    | The ruleset bound to the active Novel. Determines which ruleset-derived tools are callable (REQ-381), which extraction model serves lookups and search (REQ-382), and which Ruleset Wisdom modules are surfaced in the Novel. Immutable except the single audited migration path (REQ-380c). |
| Inapplicable hint | A marker on tools in `tools/list` whose `ruleset` scope does not match the active Novel's ruleset — the tool is registered and its description visible, but it is not callable under the current Novel. REQ-381. |

**Technology stack.** TypeScript on Node.js 20+, with stdio transport. It is a single
process, with no database and no external services. This is the prescribed stack. The
holonovel reference implementation uses it. Builders may pick another language, runtime,
or transport. The result must still pass every verification workflow and the full
Pattern Buffer. Record the alternative choice with justification in DECISIONS.md (2).
_Check:_ T92.

**Distribution.** The builder must provide at least one of: a Docker container, a
single-binary build (via Bun build, pkg, or equivalent), or an `npx`-runnable package.
The goal is that an operator can run the server without a language toolchain beyond the
MCP client's runtime.

