# Holonovel

> **Quick Reference.** An AI build prompt for an MCP server that reads a tabletop RPG
> ruleset, extracts mechanics, builds the server, and proves it works. Output: a running
> MCP server with dice, combat, character management, rules lookup, narrative directives,
> dynamic lore, action suggestions, voice examples, macros, scene-type tagging, audit
> compression, scene-state tracking, NPC management, countdowns, session recap, hybrid
> adventure modules, and Ruleset Wisdom — plus four handoff artifacts (plus
> LICENSE.md) (RULESET_MODEL.md, DECISIONS.md, README.md, AGENTS.md). World-model
> infrastructure (rooms, things, exits, properties, parser commands, kind hierarchy) provides
> the spatial foundation for scene composition — defining what is physically possible in the
> story — with configurable surface prominence (REQ-309). Optional synthesis
> workflow adds web-sourced play advice and Novel-state insights. Quality enforced by
> verification workflows, 14 handoff verification steps,
> and a golden-transcript replay. One base server — the ruleset-free `holonovel`
> host — loads one or more declarative ruleset packages at startup (packages are
> data, not code: extracted models, tool schemas, and indexes). Ruleset-derived
> tools carry `<slug>_` prefixes (REQ-379); one ruleset binds per Novel
> (REQ-380), siloed per §5.16. Installing or removing a package never modifies
> the host; updating the host never touches installed packages or user data
> (REQ-390, REQ-393). No network at runtime
> (REQ-051). Badges control tool-access gating (REQ-032): `player`, `game_master`,
> `observer`, or `none`, switchable via `set_badge` (REQ-066). The AI's narrative role is
> the counterpart of the active badge by default — human as Player → AI as Game Master,
> human as Game Master → AI as Player — configurable via `TTRPG_AI_ROLE` (REQ-304).
> Observer mode (REQ-305) lets the human spectate while the AI plays both roles.
> Adjustable autonomy (REQ-306) controls how much the AI auto-plays vs. defers to the
> human. Multi-character support with entity presence (REQ-307) and knowledge gating by
> presence (REQ-308): one adventure loads as a hybrid world-model
> and prose modules (REQ-079). State tiers: world model, roster, Novels (with synthesis
> state), lore, and codex (server-level); connections are ephemeral transport; Novel
> audit logs persist. RNG deterministic and seedable. Requirements state the contract; verification
> loops enforce quality.

## Contents

- [1. Mission and Play Model](#1-mission-and-play-model)
- [2. Requirements at a Glance](#2-requirements-at-a-glance)
- [3. How This Build Fails](#3-how-this-build-fails)
- [4. Standing Rules and Terminology](#4-standing-rules-and-terminology)
- [5. Requirements](#5-requirements)
- [6. The Build Process](#6-the-build-process)
- [7. Runtime Conventions](#7-runtime-conventions)
- [8. Verification Workflows](#8-verification-workflows)
- [9. Artifacts and Handoff](#9-artifacts-and-handoff)
- [10. Independent Verification](#10-independent-verification)
- [11. Synthesis](#11-synthesis)
- [Appendices](#appendices)

---

### How to read this specification

Read this specification in layers — not front to back.

This specification is maintained as 13 source files under `spec/`. `npm run assemble`
joins them into this document. During an AI build, the builder reads
`build-phase-map.md` to load only the files the current phase needs. This cuts
per-phase context by about 73% versus loading the full specification.

**If you are a builder implementing a server for the first time:**
Start with §1 (Mission), then §4 (Standing Rules — every builder must internalize
these), then §6 (Build Process — this is your workflow). Use `build-phase-map.md`
for per-phase file loading. Consult §5 (Requirements) by subsection as each build
phase demands it. Skip the appendices until G0a.

**If you are updating an existing server:**
Read §6.7 (Spec-driven updates), then the CHANGELOG for the spec version delta,
then the §5 subsections cited by the gap audit. Confirm which deployed server tree
the Update workflow will evaluate (REQ-398) before the gap audit. The
`build-phase-map.md` identifies which files to load for the gap audit.

**If you are a spec maintainer:**
Start with Appendix M (REQ Authoring Conventions). Then read §4 Standing Rules 7–8 —
the contracts-over-implementations and red-team disciplines. Then the CHANGELOG for
recent revision patterns. Source files live in `spec/`. Run `npm run assemble`
before committing.

**If you are verifying a build:**
§8 (Verification Workflows) and §9 (Artifacts and Handoff) are your entry points.
The verification workflows are executable — follow them in order. Use the assembled
`holonovel.md` or load spec files per `build-phase-map.md`.

**If you are adding a ruleset:**
Read Appendix V (Workflow Runbooks) first — it names the entry point and happy path
for Convert, Build, Synthesize, and Update before their §6 details.

**Reference material** (Appendices) is supplementary. Glance at Appendix E to learn the
REQ names. Appendix F shows test coverage. Appendix S defines domain terms. Consult the
rest on demand during build phases or verification.

---

## 1. Mission and Play Model

**Mission.** Build an MCP server from a tabletop RPG ruleset provided as Markdown (or
converted from PDF/HTML/web scrape). The server exposes the ruleset's resolution mechanics,
entity management, tables, and guidance as MCP tools, resources, and prompts. No manual
coding — the AI reads the ruleset and builds. The specification is the permanent
artifact; implementations are disposable and rebuilt on demand. This is a
Spec-as-Source (Tier 3 SDD) system — the specification is the canonical source
code. Humans edit the spec; the builder AI generates, verifies, and regenerates
the server code. Generated server code is never edited by hand. Full rebuilds have
token and time costs. The builder prefers incremental updates when the spec delta is
narrow (§6.7). A full rebuild is required when the ruleset changes, the extraction
model changes, or the spec version changes.

**The north star.** A *holonovel* is a Star Trek holodeck program — an interactive
narrative where the user steps inside as a character, the cast responds with intent,
and the rules govern every outcome. Holonovel builds the server (the Holodeck) and
loads your campaign (the Holonovel program) from your rulebooks. The Novel is the
saved program file — create it, resume it, export and share it. No holograms. No 3D.
Your books, rendered as tools and mechanics, running inside the room.

**The play model (TTRPG).** Four badges, enforced server-side when the story is active.
The Novel is the container — a named, persistent save file holding the world model,
entities, scenes, and all state. Entering a Novel (create or resume) starts in the
Editor badge (full access per REQ-031). Work on characters, load an
adventure, build the world, refine lore — the Novel is yours to shape before the story
begins. When ready, activate a badge via `set_badge` (REQ-066): wearing the player or
game_master badge means you are in the story. Badge gating (REQ-032) activates. Under the
Player badge, the player acts through the ruleset's resolution mechanics — skill checks,
attacks, spells, exploration actions. World-model navigation (parser commands like `go
north` or `take lamp`) is available when adventures provide spatial maps; the ruleset,
not the world model, drives the story. Switch to the Game Master badge to correct, undo,
or directly manage Novel state while staying in the story. Switch to the Observer badge
(REQ-305) to spectate — the AI plays both Player and Game Master while you watch,
intervening only for mechanical decisions at your configured autonomy level (REQ-306).
End the story with `set_badge("none")` — return to the Editor badge with the Novel intact.
End the Novel with `end_novel` — the save file is deleted. `set_badge` works without
restart. One user per MCP connection (REQ-030) — no multiplayer. Holonovel targets
solo play: one human operator, one AI counterpart. By default, the human wears the
Player badge and the AI briefs as Game Master (REQ-304). The human may switch badges
freely — the AI's narrative role follows as counterpart, or can be locked to a fixed
role via `TTRPG_AI_ROLE`. One player may control multiple characters (REQ-074) with
entity presence tracking (REQ-307) and knowledge gated by who was present for each
scene (REQ-308).

**The play model (ruleset-free).** When no TTRPG ruleset is present, the server provides
freeform narrative roleplay. The GM's narrative tools are the main way to play. Use
`set_scene_state` to describe a scene. Use `create_npc` to introduce characters. Use
`present_choices` to offer decisions. Use `set_lore_entry` to build the world as you play.
Player tools describe character and preferences: `set_personality`, `player_signal`, and
`character_sheet`. Parser navigation (`go north`) is available when an adventure adds
rooms. It is never required to be in the story. Adventures are starting-state Novels:
factions, NPCs, scenes, and lore pre-populated for the GM to run.

**Definition of done.** The server must pass every verification workflow (§8). It must
replay a golden transcript of a known fixture (§B.3) and a smoke session of cooperative
play with a real LLM. It must hand off four specified artifacts and nothing else (§9).
It must survive an independent verification (§10): a second AI re-runs the verification
workflows blind from a cold checkout, comparing its results against the builder's own.

**Ruleset package model.** A ruleset build (B1) runs Discovery and Construction once,
then the Package step (§6.4.2) emits a declarative ruleset package — the extracted model,
full-text search index, tool schemas with execution logic expressed as data, resources,
prompts, a content hash, and a version manifest (REQ-389). The base `holonovel` host
never changes when a package is installed. At startup the host scans the install
directory, validates package integrity, and lazily hydrates tool/index state only when a
Novel bound to that ruleset is first activated (REQ-390). Ruleset-derived tools carry a
`<slug>_` prefix (REQ-379); infrastructure tools (World, Narrative, Novels, Badges)
carry no prefix and are shared. Each Novel is bound to one ruleset (REQ-380), with a
single audited migration path from ruleset-free to an installed ruleset (REQ-380c). The
active Novel's ruleset determines which ruleset-derived tools are callable (REQ-381).
Cross-ruleset contamination is a defect (F8). Installing or removing a package is a
server-scoped, audited operation (`install_ruleset` / `remove_ruleset` / `list_rulesets`);
it never rebuilds the host. Updating the host revalidates installed packages without
re-running their builds and preserves all user data (REQ-389, REQ-393, §6.7).

**Executed-in-context boundaries.** Programmatic tool calling, code-mode execution, and
client-side subagent segmentation are out of contract for this specification: mechanical
resolution remains expressible as discrete inspectable tool calls whose intermediate results
a badge-appropriate caller may observe. Builders and verifiers treat such techniques as
out-of-scope, not as missing coverage.

---

## 2. Requirements at a Glance

The canonical requirements manifest is in [Appendix E](#appendix-e-requirements-manifest).
The manifest covers output contracts, error taxonomy, and roll transparency. It covers
badges and security, extraction and confidence, and tools and resources. It covers Novel
state and persistence, guidance, and determinism. It covers input safety, durability, and
infrastructure. Three groups divide these concerns. World is the world-model layer:
rooms, things, exits, properties, parser commands, and hybrid source conversion. Novels
is the save-file layer: lifecycle, exchange, checkpoints, notes, resume state, and
archive. Narrative is the narrative layer: scenes, NPCs, factions, countdowns, and lore.
It also holds the story journal, player choices, and all other REQ-020 base tools. Each
requirement is one paragraph in §5. The manifest is the packing list for the DECISIONS.md
traceability table. `scripts/validate.ts` verifies it mechanically.

---

## 3. How This Build Fails

The spec is designed around eight failure modes. Recognize them early.

| Mode | Symptom                                                                                          | Primary mitigation                                                 |
| ---- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| F1   | The server invents rules instead of extracting them.                                              | Golden transcript replay (G2); no tool-result fabrication (REQ-058) |
| F2   | Context exhaustion — large rulesets drive the AI into prompt-size limits.                         | Chunked reading (§6.3); confidence thresholds (REQ-011)             |
| F3   | The server speaks MCP incorrectly — wrong method names, malformed JSON, missing handshake fields. | G0b (MCP conformance, REQ-001, Appendix D)                |
| F4   | A specific ruleset's classes, spells, or equipment are hardcoded into the source tree.            | Fixture isolation (H4); hardcoded-mechanics check (H3); REQ-013     |
| F5   | Server-side state reported at the edge disappears in the middle — HP and conditions lost on reconnect. | State survival under restart (REQ-055 — T9, T31; Pattern Buffer-5); audit log (REQ-040); Novel persistence (REQ-092)    |
| F6   | Client configuration for the built server has wrong field names, paths, or values.                | H11 client-config launch; G0b live initialize                    |
| F7   | World-model assertions fail to parse — rooms, exits, or things produce incorrect containment or missing connections. | `convert_source` validation phase (REQ-201); adventure content validation (REQ-171); kind hierarchy enforcement (REQ-200) |
| F8   | Mechanics from one ruleset leak into a Novel bound to a different ruleset — Starfinder condition names appear in a D&D combat, or a D&D spell lookup succeeds under a Mothership Novel. | Tool prefix gating (REQ-379, REQ-381); per-ruleset extraction isolation (REQ-382); cross-ruleset isolation verification (G8) |

**Fault trees.** Every root maps to a REQ or verification workflow. If a leaf has no
guard, the gap is explicit.

**F1 — Server invents rules.**

- Missed extraction section → REQ-011, G0 (structural integrity)
- Low-confidence treated as canonical → REQ-012, convergence loop (§6.5)
- LLM hallucination in tool construction → G2 (golden transcript), REQ-058
- Truncated ruleset feeding incomplete model (F2 interaction) → REQ-004, convergence
- Missing convergence check → §6.5 audit subagent, convergence loop

**F2 — Context exhaustion.**

- Single-pass ingestion of large ruleset → §6.3 chunked reading, REQ-100 tiers
- Indexed items exceed context window → REQ-100 thresholds, confidence floor (≥70%)
- Golden transcript fails on large fixture → G2 (N fixture), Appendix N
- No complexity detection before build → G0 structural pass item count

**F3 — MCP protocol errors.**

- Wrong method names → G0b (Appendix D)
- Malformed JSON → REQ-001, G2
- Missing handshake fields → G0b, Appendix D
- SDK schema errors → REQ-001 (-32602), T39a
- URI template mismatch → G2, T16

**F4 — Ruleset contamination.**

- Fixture mechanics in server code → H3, H4
- Waiver system abused → H6, REQ-013
- Convergence too permissive → REQ-011, REQ-099
- Builder familiar with same ruleset → T35, T42, G2

**F5 — State loss.**

- Memory-only state → REQ-092, T72
- Corrupted state file → REQ-092 (atomic writes, .bak), T88
- Model change breaks state load → REQ-065, T52
- Audit log lost on restart → REQ-040, T8
- Premature or accidental `end_novel` → REQ-088, T31

**F6 — Client configuration errors.**

- Config doesn't match server metadata → H11, §6.2 config-write validation
- Port/host mismatch → G0 live initialize
- Transport type wrong → REQ-001
- Config tested against different build → H1, REQ-065

**F7 — World-model assertion failures.**

- Unrecognized assertion pattern → REQ-201 not-implemented warning
- Duplicate names or incompatible properties → REQ-201 validation diagnostics
- TTRPG annotation references unresolved → REQ-201 unmatched reference reporting
- Kind contract violation → REQ-200 kind hierarchy enforcement
- Malformed adventure with corrupt `## World` section → REQ-171, partial index with prose fallback
- Exit symmetry broken → REQ-198 implicit reverse exit creation

**F8 — Ruleset cross-contamination.**

- Missing ruleset annotation on tool → REQ-379, G8
- Novel created without ruleset binding → REQ-380
- Ruleset gating not enforced at call time → REQ-381, G8
- Search index returns results from wrong ruleset → REQ-382
- Infrastructure tool accepts ruleset-specific parameters → REQ-379 parameter contract
- Package load mis-prefixes or mis-annotates a ruleset tool → G8 per-ruleset tool-name audit

---

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
    (`suggest_actions`) are exempt — their content contracts are defined by their
    respective REQs. This rule is verified at G4 and G5 — narrative prompts
    containing tool names or technical syntax are a construction defect.
11. **Holodeck config alignment.** Every behavioral configuration dimension — any
    `TTRPG_*` variable or narrative-tool parameter that affects story pacing,
    character behavior, world reactivity, tone, autonomy, synthesis activation,
    or narration style — SHALL register a natural language access path via a
    coupling row in §7.7.1a with a Session-archetype source (`player_signal` or
    `set_narrative_directive`). System configuration (storage caps, file paths,
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
| Story Journal  | The Novel's narrative memory — a typed, timestamped journal of decisions, moments, revelations, bonds, and consequences the GM chooses to record. Surfaced in session_recap, badge_briefing, and export_novel. REQ-246. |
| State ledger    | The `state_ledger` briefing token — reports the last state-mutation timestamp and per-group mutation counts for the session, so the GM sees at a glance what has been persisted. REQ-401. |
| State drift     | The condition where the GM has narrated (via pause context or prose) advances beyond what has been committed through state tools. Surfaced as a `[state-drift]` marker and gated by `TTRPG_STATE_GATE`. REQ-403. |
| Roster         | Persistent character store surviving games; baseline values immutable.                    |
| Server Notes   | Server-level key-value note store surviving Novels and rebuilds. `server-notes://<key>`. Game Master only. REQ-285. |
| Codex          | Server-level typed content library for reusable content (NPCs, characters, scenes, encounters, lore, factions, countdowns, rooms, things, equipment, spells, relationships, voice profiles, adventures) that persists outside Novels. `codex://<id>`. Accessible under the Editor badge; badge-filtered by visibility field per REQ-321. |
| Novel         | One named, persistent save file identified by `TTRPG_NOVEL`. Holds all          |
|               |               entities, NPCs, scene state, countdowns, lore, synthesis, adventure,            |
|               | audit log, snapshots, and badge state for a single ruleset story. A Novel          |
|               | can be edited under the Editor badge. The story begins when a       |
|               | badge is activated and ends when the badge is removed — the Novel persists.          |
|               | Persists to `.holonovel-state/novels/<slug>.json`; survives process restarts      |
|               | and rebuilds. Removed from disk by `end_novel`. Multiple Novels per server       |
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
| Provenance tier | The source-of-truth classification of indexed or synthesized content: `[ruleset]` (Tier 1), `[vendor]` (Tier 2 — supplementary), `[supplementary]` (synthesis), `[player]` (player-authored), and `[novel]` (novel-derived). "Tier 1/2/3" is display shorthand for these tags. |
| Waiver           | Recorded acceptance of a REQ deviation with justification and re-activation condition. REQ-013. |
| World             | The world-model package (`holonovel`). Rooms, things, exits, parser commands, kind hierarchy (thing, container, supporter, door, device, vehicle, person, backdrop, region), `convert_source`. Serves as spatial foundation for scene composition when populated — defines what is physically possible. Surface prominence configurable via `TTRPG_WORLD_PROMINENCE` (REQ-309). §5.10. |
| World prominence   | Build-time `TTRPG_WORLD_PROMINENCE` setting (REQ-309): `secondary` (default), `visible`, or `prominent`. Controls default surface emphasis of world-model and narrative tools across help, `badge_briefing`, and `suggest_actions`. Skipped in ruleset-free mode. |
| Novels            | The save-file layer. Lifecycle (`create_novel`, `resume_novel`, `end_novel`, `switch_novel`, `clone_novel`), exchange (`export_novel`, `import_novel`, `export_lorebook`, `import_lorebook`), checkpoints (`set_checkpoint`, `list_checkpoints`, `restore_checkpoint`, `remove_checkpoint`), notes (`set_note`, `remove_note`, `list_notes`—badge-scoped per REQ-242), resume state (`set_pause_context`, `get_pause_context`), and archive (`compact_audit_log`). Notes and server notes (REQ-285) are scoped per their respective REQs. |
| Badges              | The identity and permission layer. `set_badge` switches between `player`, `game_master`, `observer`, and `none` (Editor). Badge gating (REQ-032) enforces tool access server-side — `observer` is read-only (spectator). The AI's narrative role is the counterpart of the active badge by default (REQ-304): human as Player → AI briefs as Game Master, human as Game Master → AI briefs as Player. Configurable via `TTRPG_AI_ROLE`. `badge_briefing` (REQ-109) composes orientation from the AI role and state surface from the active badge. Adjustable autonomy (REQ-306) controls how much the AI auto-plays. `set_briefing_order` (REQ-082) lets the GM reorder briefing sections. The cross-property coupling table (§7.7.1) documents badge-scope annotations for every coupling — each row identifies whether the coupling is GM-only, Player-visible, or Player-only. |
| AI Role           | The narrative role the AI plays — derived as the counterpart of the active badge by default, or locked to `game_master` / `player` via `TTRPG_AI_ROLE` (REQ-304). Determines the orientation content in `badge_briefing` (foundations, anti-slop, tone, behavioral boundaries). When the human is the Game Master, the AI's role is Player — the AI inhabits a character. When the human is the Observer, the AI plays both roles. |
| Observer          | Spectator mode (REQ-305). The human wears the Observer badge (`set_badge("observer")`) — read-only access to the Novel. The AI plays both Player and Game Master. The human watches the AI write the Novel, stepping in for mechanical decisions at the configured autonomy level (REQ-306). Maps to Holodeck objective mode. |
| Autonomy          | Configurable AI decision delegation (REQ-306). Four independent sliders: `level` (full/mechanical_prompt/manual), `confirmation` (auto/confirm/prompt), `safety` (safe/moderate/hardcore), `creativity` (predictable/standard/chaotic). Novel-scoped, GM-only, persisted to disk. Controls how much the AI auto-plays vs. defers to the human. `mechanical_prompt` only pauses for TTRPG ruleset mechanics — world-model and narrative actions are never paused. |
| Presence          | Entity presence tracking (REQ-307). Each entity carries a `present` flag and `last_location` field, derived from the `characters_present` parameter on `set_scene_state`. Non-present entities are marked `[not present]` in `badge_briefing` and the party resource. The GM controls presence with `set_party_presence`. |
| Knowledge Gating  | Presence-scoped knowledge (REQ-308). An entity only learns percepts from scenes where it was present. Knowledge gained from attended scenes is retained regardless of current presence. The `knowledge_state` briefing section shows only what the active entity knows based on scenes it attended. The GM controls information sharing across characters via `reveal_secret`. |
| Narrative         | The story-content layer, grouped by function: Scene & Tone (scene state, scene type, narrative directive), Cast & Characters (NPCs, personality, voice examples, relationships), World State (lore, factions, countdowns, secrets), Player Interaction (choices, action suggestions, player signals), Story Memory (story journal, session recap), Session Management (briefing ordering, adventure load/generation), and Synthesis Controls (revert, granular activation, player suppression). Ruleset-derived tools (canonical lookups, dice resolution, conditions) are not infrastructure. |
| Ruleset-free mode | The base host operating with no ruleset packages installed: no TTRPG ruleset is indexed; the server provides a freeform narrative roleplay surface — scene management, NPCs, lore, player choices, and world-model interactions. REQ-218. |
| Host server       | The base `holonovel` server — ruleset-free by default, the sole MCP entry point. It loads declarative ruleset packages (REQ-389), never changes when a package is installed or removed, and updates without touching installed packages or user data (REQ-390). |
| Ruleset package   | A self-contained declarative artifact produced by the Package step (§6.4.2): the extracted model, full-text search index, tool schemas with execution logic as data, resources, prompts, a content hash, and a version manifest. Loaded by the host without re-parsing ruleset Markdown (REQ-389). |
| Install directory | The well-known directory from which the host scans and validates installed packages at startup. Lives under the preserved state directory (`TTRPG_DATA_DIR`) so it survives updates (REQ-390, §7.6). |
| Deployment        | The git-managed specification repository (source of truth, edited by maintainers) versus the separately deployed host server tree (built from it, hosting runtime state). Spec changes reach the deployed server only via the Update workflow (§6.7) and the fingerprint gate (REQ-394); user data and installed packages live outside the spec repository (REQ-396, REQ-397, REQ-398). |
| Ruleset slug     | A filename-safe identifier for a ruleset (e.g., `dnd5e`, `starfinder`, `osr`). Derived from the ruleset identifier (B2) using slug rules (§7.1a). Used as the tool prefix for ruleset-derived tools (REQ-379). Recorded in DECISIONS.md (1). |
| Tool prefix      | The ruleset slug prepended to every ruleset-derived tool name with an underscore separator: `<slug>_<tool_name>`. Infrastructure tools (REQ-020 categories) carry no prefix. The server reports the prefix-to-ruleset mapping in `spec_health`. REQ-379. |
| Package set      | The installed ruleset packages known to the host. Each package was built independently by the Package step (§6.4.2), installed via `install_ruleset`, and hydrated lazily on first activation of a Novel bound to its slug (REQ-390). |
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

