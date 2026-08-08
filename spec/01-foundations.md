# Holonovel

> **Quick Reference.** An AI build prompt for an MCP server that reads a tabletop RPG
> ruleset, extracts mechanics, builds the server, and proves it works. Output: a running
> MCP server with dice, combat, character management, rules lookup, narrative directives,
> dynamic lore, action suggestions, voice examples, macros, scene-type tagging, audit
> compression, scene-state tracking, NPC management, countdowns, session recap, hybrid
> adventure modules, and ruleset-native enrichment — plus four handoff artifacts (plus
> LICENSE.md) (RULESET_MODEL.md, DECISIONS.md, README.md, AGENTS.md). World-model
> infrastructure (rooms, things, exits, properties, parser commands, kind hierarchy) is
> provided by `@holonovel/inform`. Optional community enrichment workflow adds web-sourced
> play advice. Quality enforced by verification workflows, 14 handoff verification steps,
> and a golden-transcript replay. One server per ruleset. No network at runtime
> (REQ-051). The Player hat is the human at the table; the Game Master hat is the AI
> narrator (REQ-032), switchable via `set_hat` (REQ-066). Multi-character support: one
> player may control multiple entities (REQ-074). Adventures load as hybrid world-model
> and prose modules (REQ-079). State tiers: world model, roster, Novels, lore, and
> enrichment tiers enhance guidance; connections are ephemeral transport; Novel audit logs
> persist. RNG deterministic and seedable. Requirements state the contract; verification
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
- [11. Optional Workflows](#11-optional-workflows)
- [Appendices](#appendices)

---

### How to read this specification

Read this specification in layers — not front to back.

This specification is maintained as 10 source files under `spec/`, assembled into
this document via `npm run assemble`. For per-phase loading during an AI build,
the builder consults `build-phase-map.md` to load only the files needed for the
current phase — reducing per-phase context by ~73% vs. loading the full specification.

**If you are a builder implementing a server for the first time:**
Start with §1 (Mission), then §4 (Standing Rules — every builder must internalize
these), then §6 (Build Process — this is your workflow). Use `build-phase-map.md`
for per-phase file loading. Consult §5 (Requirements) by subsection as each build
phase demands it. Skip the appendices until Gate 0.

**If you are updating an existing server:**
Read §6.7 (Spec-driven updates), then the CHANGELOG for the spec version delta,
then the §5 subsections cited by the gap audit. The `build-phase-map.md` identifies
which files to load for the gap audit.

**If you are a spec maintainer:**
Start with Appendix M (REQ Authoring Conventions), §4 Standing Rules 7–8 (the
contracts-over-implementations and red-team disciplines), then the CHANGELOG for
recent revision patterns. Source files live in `spec/`. Run `npm run assemble`
before committing. The SPEC-QUEUE.md tracks subsystems awaiting review.

**If you are verifying a build:**
§8 (Verification Workflows) and §9 (Artifacts and Handoff) are your entry points.
The verification workflows are executable — follow them in order. Use the assembled
`holonovel.md` or load spec files per `build-phase-map.md`.

**Reference material** (Appendices A–S) is supplementary. Glance at Appendix E
(Requirements Manifest) to orient yourself in the REQ namespace, Appendix F (Derived
Test Catalogue) to understand test coverage, and Appendix S (Builder Glossary) for
domain terminology. The remaining appendices are consulted on demand during specific
build phases or verification workflows.

---

## 1. Mission and Play Model

**Mission.** Build an MCP server from a tabletop RPG ruleset provided as Markdown (or
converted from PDF/HTML/web scrape). The server exposes the ruleset's resolution mechanics,
entity management, tables, and guidance as MCP tools, resources, and prompts. No manual
coding — the AI reads the ruleset and builds. The specification is the permanent
artifact; implementations are disposable and rebuilt on demand. Full rebuilds have
token and time costs. The builder prefers incremental updates when the spec delta is
narrow (§6.7). A full rebuild is required when the ruleset changes, the extraction
model changes, or the spec version changes.

**The play model.** Two hats, enforced server-side during play. The Novel is the
container — a named, persistent save file holding the world model, entities, scenes,
and all session state. Novel setup (create Novel, load adventure, import characters,
session zero) happens with no hat active (full access per REQ-031). Create a Novel,
populate its world model (load a hybrid adventure module, generate one from a
premise, or build with CRUD tools), set up characters, then activate the Player hat
via `set_hat` (REQ-066) to enforce hat gating (REQ-032). Under the Player hat, the
player acts through the ruleset's resolution mechanics — skill checks, attacks,
spells, exploration actions. World-model navigation (parser commands like `go north`
or `take lamp`) is available when adventures provide spatial maps; the ruleset, not
the world model, drives the game. Switch to Game Master hat to correct,
undo, or directly manage Novel state. `set_hat` works without restart. One user per
MCP connection (REQ-030) — no multiplayer. Holonovel targets solo play: one human
player, one AI Game Master. One player may control multiple characters (REQ-074).

**Definition of done.** The server must: (1) pass all verification workflows (§8), (2)
replay a golden transcript of a known fixture (§B.3) and a smoke session of cooperative
play with a real LLM, (3) hand off four specified artifacts and nothing else (§9), and (4)
survive an independent verification (§10) where a second AI re-runs the verification workflows blind from a
cold checkout, comparing its results against the builder's own.

---

## 2. Requirements at a Glance

The canonical requirements manifest is in [Appendix E](#appendix-e-requirements-manifest)
— requirements covering output contracts, error taxonomy, roll transparency, hats
and security, extraction and confidence, tools and resources, Novel state and
persistence, guidance, determinism, input safety, durability, and infrastructure
(the world-model layer: rooms, things, exits, properties, parser commands, hybrid
source conversion).
Each is one paragraph in §5. The manifest is the packing list for the
DECISIONS.md traceability table and is mechanically verified by
`scripts/validate.ts`.

---

## 3. How This Build Fails

The spec is designed around seven failure modes. Recognize them early.

| Mode | Symptom                                                                                          | Primary mitigation                                                 |
| ---- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| F1   | The server invents rules instead of extracting them.                                              | Golden transcript replay (Gate 2); no tool-result fabrication (REQ-058) |
| F2   | Context exhaustion — large rulesets drive the AI into prompt-size limits.                         | Chunked reading (§6.3); confidence thresholds (REQ-011)             |
| F3   | The server speaks MCP incorrectly — wrong method names, malformed JSON, missing handshake fields. | G0 step 2 (MCP conformance, REQ-001, Appendix D)                |
| F4   | A specific ruleset's classes, spells, or equipment are hardcoded into the source tree.            | Fixture isolation (H4); hardcoded-mechanics check (H3); REQ-013     |
| F5   | Server-side state reported at the edge disappears in the middle — HP and conditions lost on reconnect. | State survival under restart (REQ-055 — T9, T31; Gauntlet-5); audit log (REQ-040); Novel persistence (REQ-092)    |
| F6   | Client configuration for the built server has wrong field names, paths, or values.                | H11 client-config launch; Gate 0 live initialize                    |
| F7   | World-model assertions fail to parse — rooms, exits, or things produce incorrect containment or missing connections. | `convert_source` validation phase (REQ-201); adventure content validation (REQ-171); kind hierarchy enforcement (REQ-200) |

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

- Wrong method names → G0 step 2 (Appendix D)
- Malformed JSON → REQ-001, G2
- Missing handshake fields → G0 step 2, Appendix D
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

---

## 4. Standing Rules and Terminology

**Standing rules.**

1. The server is stateless across invocations; all build-level state is in-process and
   rebuilt from scratch on startup. Novel state persists to disk (REQ-092).
2. Randomness is deterministic and seedable (REQ-050).
3. No network access at runtime (REQ-051).
4. The server trusts nothing client-supplied; every tool validates its inputs (REQ-054).
5. Hat gating is enforced server-side (REQ-032).
6. **LLMs propose intentions; the engine validates and executes.** The AI narrator
   never directly mutates game state — every change flows through validated
   tools. This is the same architecture as rpg-mcp's embodiment model, enforced
   server-side by hat gating (REQ-032), tool-result fidelity (REQ-058),
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

**Terminology.**

| Term           | Meaning                                                                                  |
| -------------- | ---------------------------------------------------------------------------------------- |
| Operator       | The human running the build.                                                             |
| Builder        | The AI executing this specification.                                                     |
| Verifier       | A second, independent AI that re-runs the verification workflow suite (§10).                               |
| Ruleset        | The TTRPG source material — Markdown, or converted to Markdown.                           |
| Model          | The extracted semantic model of the ruleset (RULESET_MODEL.md).                           |
| Hat        | Active hat — `player`, `game_master`, or none (full access) (REQ-031, REQ-066).         |
| Roster         | Persistent character store surviving games; baseline values immutable.                    |
| Novel         | One named, persistent save file identified by `TTRPG_NOVEL`. Holds all          |
|               | entities, NPCs, scene state, countdowns, lore, enrichment, adventure,            |
|               | audit log, snapshots, and hat state for a single ruleset playthrough.         |
|               | Persists to `.holonovel-state/novels/<slug>.json`; survives process restarts      |
|               | and rebuilds. Removed from disk by `end_novel`. Multiple Novels per server       |
|               | instance; one active per connection. Isolated from other Novels.                  |
| Connection     | One MCP transport lifecycle; born at startup, dies at close. No persistent   |
|                | state of its own — Novel state and audit log survive the connection.         |
| Convergence loop | Iterative quality-enforcement (§6.5) measuring extraction quality, coverage, and compliance. |
| Danger           | Non-entity combat participant with no persistent ID or state; auto-resolved. |
| Gauntlet         | Operational verification suite (§6.6) — 22 sub-workflows against a running server. |
| Hat briefing         | `hat_briefing` prompt — composes guidance, state, lore, and registry content hat-filtered. |
| Macro            | Token `{{<path>}}` expanded to live state values before delivery. REQ-085. |
| Waiver           | Recorded acceptance of a REQ deviation with justification and re-activation condition. REQ-013. |
| World model  | Infrastructure layer providing rooms, things, exits, and parser commands via `@holonovel/inform`. When a TTRPG ruleset is present, the world model serves narration; the ruleset drives resolution. |
| Ruleset-free mode | Build mode selected by B1="none": no TTRPG ruleset is indexed; the server provides infrastructure tools and world-model interactions only. REQ-218. |

**Technology stack.** TypeScript on Node.js 20+, stdio transport. Single process, no
database, no external services. This is the prescribed stack; the dnd5e reference
implementation uses it. Builders may select an alternative language, runtime, or
transport if the resulting server passes every verification workflow and the full Gauntlet
— the alternative choice must be recorded with justification in DECISIONS.md (2).
_Check:_ T92.

**Distribution.** The builder must provide at minimum one of: a Docker container, a
single-binary build (via Bun build, pkg, or equivalent), or an `npx`-runnable
package. The goal is that an operator can run the server without installing a language
toolchain beyond the MCP client's runtime.

