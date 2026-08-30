# Holonovel

> **Quick Reference.** An AI build prompt for an MCP server that reads a tabletop RPG
> ruleset, extracts mechanics, builds the server, and proves it works. Output: a running
> MCP server with dice, combat, character management, rules lookup, narrative directives,
> dynamic lore, action suggestions, voice examples, macros, scene-type tagging, audit
> compression, scene-state tracking, NPC management, countdowns, session recap, hybrid
> adventure modules, and Ruleset Wisdom — plus four handoff artifacts
> (RULESET_MODEL.md, DECISIONS.md, README.md, AGENTS.md) and LICENSE.md. World-model
> infrastructure (rooms, things, exits, properties, parser commands, kind hierarchy) provides
> the spatial foundation for scene composition — defining what is physically possible in the
> story — with configurable surface prominence (REQ-309). Optional synthesis
> workflow adds web-sourced play advice and Novel-state insights. Quality enforced by
> verification workflows, 18 handoff verification steps,
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

This specification is maintained as 14 source files under `spec/`. `npm run assemble`
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
for Convert, Build, Synthesize, and Update before their §6 details. When a spec
update changes the package contract or the state model, V.7 (`update-rulesets`)
and V.8 (`migrate-user-data`) name the rebuild and migration entry points.

**Reference material** (Appendices) is supplementary. Glance at Appendix E to learn the
REQ names. Appendix F shows test coverage. Appendix S defines domain terms. Consult the
rest on demand during build phases or verification.

**Phased artifact model.** This specification follows the Spec Kit phased model:
constitution (§4 Standing Rules), specify (this document), plan and tasks
(per-increment artifacts under `plans/`), implement (§6 Build Process), and converge
(§6.5/§6.7). The house executable-spec conventions (gates, traceability, golden
transcript) serve as the quality checklist layer.

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
play with a real LLM. It must hand off the four specified handoff documents (plus LICENSE.md) and nothing else (§9).
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

- Missed extraction section → REQ-011, G0a (structural integrity)
- Low-confidence treated as canonical → REQ-012, convergence loop (§6.5)
- LLM hallucination in tool construction → G2 (golden transcript), REQ-058
- Truncated ruleset feeding incomplete model (F2 interaction) → REQ-004, convergence
- Missing convergence check → §6.5 audit subagent, convergence loop

**F2 — Context exhaustion.**

- Single-pass ingestion of large ruleset → §6.3 chunked reading, REQ-100 tiers
- Indexed items exceed context window → REQ-100 thresholds, confidence floor (≥70%)
- Golden transcript fails on large fixture → G2 (N fixture), Appendix N
- No complexity detection before build → G0a structural pass item count

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
- Port/host mismatch → G0b live initialize
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
