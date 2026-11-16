# Holonovel

> **Quick Reference.** An AI build prompt for a ruleset-free MCP host and the declarative
> ruleset packages it loads: read a tabletop RPG ruleset, extract its mechanics, emit the
> package, and prove the host runs it. Output: a running host with dice, combat, character management, rules lookup, narrative directives,
> dynamic lore, action suggestions, voice examples, macros, scene-type tagging, audit
> compression, scene-state tracking, NPC management, countdowns, session recap, hybrid
> adventure modules, and Ruleset Wisdom — plus four handoff artifacts
> (RULESET_MODEL.md, DECISIONS.md, README.md, AGENTS.md) and LICENSE.md. World-model
> infrastructure (rooms, things, exits, properties, parser commands, kind hierarchy) provides
> the spatial foundation for scene composition — defining what is physically possible in the
> story — with configurable surface prominence (REQ-309). Optional synthesis
> workflow adds web-sourced play advice and Novel-state insights. Quality is enforced by
> verification workflows, 18 handoff verification steps (H1–H18, §9),
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
> and prose modules (REQ-079). State tiers: roster, codex, Novel, and Session (§7.7);
> world-model and lore data are Novel property groups; connections are ephemeral
> transport; Novel audit logs persist. Base capabilities (Fate, Ironsworn, Forged
> in the Dark) and the epistemic/causal layers (temporal event log, belief and
> evidence, character identity, causal state, knowledge corpus) are specified in
> §5.21–§5.33. RNG is deterministic and seedable. Requirements state the contract; verification
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

Read this specification in layers — not front to back. It is written for two
readers: the builder, an AI agent implementing a host or a ruleset package from
it, and the maintainer, who edits it. A player, Game Master, or operator needs no
knowledge of this document; §1 names the product's own front doors.

This spec lives as 14 source files under `spec/`. `npm run assemble` joins
them into one document. A builder reads `build-phase-map.md` to load only the
files the current phase needs. That cuts phase context by about 73% versus the full spec.

**If you are a builder implementing a server for the first time:**
Start with §1 (Mission), then §4 (Standing Rules — every builder must internalize
these), then §6 (Build Process — this is your workflow). Use `build-phase-map.md`
for per-phase file loading. Consult §5 (Requirements) by subsection as each build
phase demands it. Skip the appendices until G0a (structural integrity, §8).

**If you are updating an existing server:**
Read §6.7 (Spec-driven updates), then the CHANGELOG for the spec version delta,
then the §5 subsections cited by the gap audit (§6.7). Confirm which deployed server tree
the Update workflow will evaluate (REQ-398) before the gap audit (§6.7). The
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

**Phased artifact model.** This spec follows the Spec Kit phased model:
constitution (§4 Standing Rules), specify (this document), plan and tasks
(per-increment files under `plans/`), implement (§6 Build Process), and converge
(§6.5/§6.7). The house executable-spec rules (gates, traceability, golden
transcript) set the quality bar.

---

## 1. Mission and Play Model

**Mission.** Give a solo player a world that runs their own books, and remembers
what happened. Holonovel is a narrative simulation engine for tabletop play: it
binds a ruleset to a living world, resolves play through that ruleset's own
mechanics, and keeps a durable record of every consequence. One person wears the
badge; an AI takes the counterpart seat; the two play one story from opposite
sides of the screen. What the engine refuses is arbitration by vibes — when the
ruleset answers, the ruleset answers.

**Why this is not a chatbot.** Chat forgets. A holonovel does not. State is
canonical and server-side: characters, scenes, factions, clocks, lore, and the
audit trail outlive the process, the connection, and the host. The world model
holds what is physically possible; the narrative layer holds what is happening;
the epistemic layers hold what each character believes and has perceived. Prose
is rendered against engine truth; truth is never reconstructed from prose.

**Engine, adapter, program.** Holonovel is a narrative simulation engine: it owns
canonical state, resolves the rules, and records what happened. The MCP server is
the reference adapter — one way to reach the engine, not the engine itself. A
Novel is the portable program: the save file that carries a world and its history
to another host. Tabletop play is the first application of the engine, not its
definition.

**The specification is the source.** This document is canonical for the host and
the package contract. A build yields two artifacts: the host — versioned,
installed, updated through §6.7 — and a ruleset package — generated data (model,
index, tool schemas, resources, prompts) emitted by the Package step (REQ-389).
Packages are never hand-edited. The host is never regenerated per ruleset, and
loading a package does not modify it (REQ-390). A spec change routes through
§6.7, where the delta class decides what is rebuilt, updated, or left alone.

**Goals.** Six. Each names the failure it prevents (§3) and the contract that
makes it checkable.

- **Fidelity** — mechanical outcomes come from the bound ruleset's text; a
  missing mechanic is reported, never invented (F1, F4; REQ-011, REQ-058).
- **Continuity** — nothing that happened is lost, across restarts, host updates,
  package changes, and travel to another host (F5; REQ-055, REQ-092, REQ-396,
  REQ-397).
- **Authorship** — the engine governs consequences, the player governs authorship;
  resolution is enforced, description and direction are free (REQ-031a, REQ-032,
  REQ-077c).
- **Legibility** — every consequence is inspectable: what rolled, what ruled, what
  changed, and why (REQ-040, REQ-174, REQ-589).
- **Rebuildability** — one spec, many hosts, zero hand-edits; drift surfaces at
  startup, not in play (REQ-313, REQ-394, REQ-420, REQ-423).
- **Composability** — rulesets are data; installing or removing one changes
  neither the host nor the user's Novels (F8; REQ-379, REQ-389, REQ-390).

**Non-goals.** No hosted platform, no multiplayer, no runtime network, no rendered
presentation, and no curated compact default surface. The authoritative list,
each entry citing its governing requirement, is `DECISIONS.md` `## Non-goals`.

**The north star.** A *holonovel* is a Star Trek holodeck program — an interactive
narrative where the user steps inside as a character, the cast responds with
intent, and the rules govern the consequences. Holonovel builds the server (the
Holodeck) and loads your campaign (the Holonovel program) from your rulebooks. The
Novel is the saved program file — create it, resume it, export it, share it. No
holograms. No 3D. Your books, rendered as tools and mechanics, running inside the
room. *Intent*, here, is recorded intent: an NPC acts from its goals, its memory,
and what it knows (REQ-077, REQ-122, REQ-308, REQ-339), not from improvised
characterization.

**The test.** When a proposal is ambiguous, ask one question: does the engine
govern the consequences, and does the player govern the authorship? Consequences —
damage, clocks, conditions, who learns what, what persists — resolve through the
bound ruleset, a stored fact, or a recorded ruling. Authorship — what a character
attempts, how they are described, where the story goes — belongs to the player and
is never gated by mechanics. Ruleset-free play does not suspend the test; it
changes who supplies the rules, and the GM's rulings become the recorded ones.

**Trajectory.** Three commitments decide what the engine becomes; a future REQ
should serve at least one. Rulesets stay data, so the library grows without
forking the host. The world keeps memory at three depths — what happened (the
event log), what is true (causal state), and what each character believes
(perception, evidence, and subjective memory) — so characters can be wrong in ways
that persist. And a Novel stays portable, so a campaign outlives the server it was
played on. A proposal that weakens one of these is probably the wrong proposal.

**Who this document is for.** Two readers: the builder, an AI agent that
implements the host or a ruleset package from this spec, and the maintainer, who
edits it. Everyone else meets Holonovel through the product — the README installs
it, the wiki routes play by task, and the running server explains itself through
`badge_briefing`. A user needs no knowledge of this document, and the spec assumes
none.

**Who Holonovel is for.** One person, moving between four uses that never require
choosing one.

- *Prepare* — build characters, NPCs, factions, lore, clocks, rooms, things, and
  encounters in a Novel under the Editor badge, or in the codex, a server-level
  library that needs no Novel and no story (REQ-321).
- *Play* — solo with an AI counterpart, as Game Master with an AI player, or as an
  observer watching both.
- *Build* — convert a book and build a ruleset package other people can install.
- *Host* — install, back up, and update a server that keeps the data.

The uses hand off: a Novel travels to another host, a ruleset built once runs for
people who will never build one, and preparation reaches an interchange surface
without entering play.

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
End the Novel with `manage_novel (action: end)` — the save file is deleted. `set_badge` works without
restart. One user per MCP connection (REQ-030) — no multiplayer. Holonovel targets
solo play: one human operator, one AI counterpart. By default, the human wears the
Player badge and the AI briefs as Game Master (REQ-304). The human may switch badges
freely — the AI's narrative role follows as counterpart, or can be locked to a fixed
role via `TTRPG_AI_ROLE`. One player may control multiple characters (REQ-074) with
entity presence tracking (REQ-307) and knowledge gated by who was present for each
scene (REQ-308).

**The play model (ruleset-free).** When no TTRPG ruleset is present, the server provides
freeform narrative roleplay. The GM's narrative tools are the main way to play. Use
`manage_scene (action: set)` to describe a scene. Use `manage_npc (action: create)` to introduce characters. Use
`manage_scene (action: choices)` to offer decisions. Use `manage_lore (action: set)` to build the world as you play.
Player tools describe character and preferences: `manage_character (action: personality)`, `manage_character (action: signal)`, and
`manage_character (action: sheet)`. Parser navigation (`go north`) is available when an adventure adds
rooms. It is never required to be in the story. Adventures are starting-state Novels:
factions, NPCs, scenes, and lore pre-populated for the GM to run.

**Definition of done.** The server must pass every verification workflow (§8). It must
replay a golden transcript of a known fixture (§B.3) and a smoke session of cooperative
play with a real LLM. It must hand off the four specified handoff documents (plus LICENSE.md) and nothing else (§9).
It must survive an independent verification (§10): a second AI re-runs the verification
workflows blind from a cold checkout, comparing its results against the builder's own.

**Ruleset package model.** A ruleset build (B1) runs Discovery and Construction once.
The Package step (§6.4.2) then emits a declarative ruleset package — the extracted model,
search index, tool schemas with logic as data, resources,
prompts, a content hash, and a version manifest (REQ-389). The base `holonovel` host
never changes when a package is installed. On startup the host scans the install
directory, checks package integrity, and lazily loads tool/index state only when a
Novel bound to that ruleset is first activated (REQ-390). Ruleset-derived tools carry a
`<slug>_` prefix (REQ-379); infrastructure tools (World, Narrative, Novels, Badges)
carry no prefix and are shared. Each Novel is bound to one ruleset (REQ-380). A
single audited path migrates from ruleset-free to an installed ruleset (REQ-380c). The
active Novel's ruleset decides which ruleset-derived tools are callable (REQ-381).
Cross-ruleset contamination is a defect (F8). Installing or removing a package is a
server-scoped, audited operation (`manage_ruleset (action: install)` / `manage_ruleset (action: remove)` / `manage_ruleset (action: list)`);
it never rebuilds the host. Updating the host re-checks installed packages without
re-running their builds and keeps all user data (REQ-389, REQ-393, §6.7).

**Executed-in-context boundaries.** Programmatic tool calling, code-mode execution, and client-side subagent splitting fall outside this specification's contract. Mechanical resolution stays as plain, inspectable tool calls. A badge-carrying caller may observe the results between calls. Builders and verifiers treat these methods as out of scope, not as missing coverage.

---

## 2. Requirements at a Glance

The canonical requirements manifest is in [Appendix E](#appendix-e-requirements-manifest).
The manifest covers output contracts, error taxonomy, and roll transparency. It covers
badges and security, extraction and confidence, and tools and resources. It covers Novel
state and persistence, guidance, and determinism. It covers input safety, durability, and
infrastructure. Four groups divide these concerns. World is the world-model layer:
rooms, things, exits, properties, parser commands, and hybrid source conversion. Novels
is the save-file layer: lifecycle, exchange, checkpoints, notes, resume state, and
archive. Badges & Workflow is the identity-and-permission layer. Narrative is the narrative layer: scenes, NPCs, factions, countdowns, and lore.
It also holds the story journal, player choices, and all other REQ-020 base tools. Beyond
those four, the base-capability layer (§5.21–§5.23) holds the Fate, Ironsworn, and
Forged in the Dark resolution surfaces, and the epistemic/causal layer (§5.24–§5.33)
holds the temporal event log and branching, belief and evidence, character identity,
causal transition validation, knowledge corpus, semantic index, knowledge graph,
durable agent tasks, perception ledger, and briefing consistency. The compression
ladder and recall layer (§5.34) holds tiered narrative-memory summaries and recall. The requirements
preamble's section map lists every subsection.
Each
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
| F5   | Server-side state reported at the edge disappears in the middle — HP and conditions lost on reconnect. | State survival under restart (REQ-055 — T9, T31; §6.6 Pattern Buffer); audit log (REQ-040); Novel persistence (REQ-092)    |
| F6   | Client configuration for the built server has wrong field names, paths, or values.                | H11 client-config launch; G0b live initialize                    |
| F7   | World-model assertions fail to parse — rooms, exits, or things produce incorrect containment or missing connections. | `manage_world (action: convert)` validation phase (REQ-201); adventure content validation (REQ-171); kind hierarchy enforcement (REQ-200) |
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
- Premature or accidental `manage_novel (action: end)` → REQ-088, T31

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
