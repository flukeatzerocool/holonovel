# Authoring surfaces roadmap — novel, codex, roster, reference

**Status:** discussion draft, 2026-11-25. Not scheduled, not normative. This is the
program roadmap for the authoring and CLI workstreams; the first approved increments
move into `ROADMAP.md` and `docs/plans/` per the normal loop.

**Why this document exists.** The 2026-11-22 Ruined Hour run exposed a structural
assumption: Novel is treated as the default context, and codex, roster, and ruleset
reference are second-class. The same run exposed a second assumption: the model turns
every knob by hand because there is no mechanical surface. This roadmap replaces both
assumptions with an explicit context model and a CLI that belongs to the MCP package.

## 0. Decisions recorded 2026-11-25

| # | Decision |
|---|---|
| 1 | The server is canon; Markdown and PDF are mirrors. |
| 2 | Context resolves `auto` and prints the result. |
| 3 | The codex can carry anything a novel can carry. |
| 4 | The blocking set is structure, reachability, ending triggers, arithmetic, state parity, continuity, content floor, and leak; prose warns unless a rule is exact. |
| 5 | Module import parses structure and user-authored summaries, not source text; the artifact may carry an optional licensing field. |
| 6 | The CLI keeps CalVer-minor compatibility: additions are allowed, removals need a deprecation cycle. |
| 7 | The first proof is Nemes: roster-only creation, `sheet.json` render, one-file pack. |
| 8 | The Ruined Hour checks run before the next playthrough. |
| 9 | Mixed canon is whole-project; a `mixed` map is allowed only when every surface is named. |
| 10 | Codex snapshot mode is in scope: `template` or `snapshot`, designed in `docs/codex-snapshot.md`. |
| 11 | Document-canon anchors are explicit IDs plus a fuzzy diff that requires review. |

Snapshot-specific decisions (memory inclusion, storage, replay, restore, audience,
retention) are recorded in `docs/codex-snapshot.md` §0 so this table stays a program
log rather than a feature log.

**The one inversion to design for.** Decision 1 is the default, but the GM-notes
workflow inverts it: many users will treat their notes document as canon and expect
Holonovel to support it. The system therefore declares a **canon direction** per
project instead of assuming one. Server-canon is the default; document-canon is a
first-class mode. See §3.4.

---

## 1. What was asked for

The request, in the maintainer's words:

- Authoring features must be **descriptive, not prescriptive**. There are many ways
  people create novels; the workflow must accommodate all of them.
- Support both **hands-on detail** and **AI fills the blanks**.
- Support **adventure modules**, **scene setup**, and **GM-notes-style** scene and
  encounter authoring.
- The same treatment applies to **codex and roster**, not only Novel.
- **Novel is not the default.** Outside a novel, the default assumption is roster or
  codex. Inside a novel, the assumption is novel. *Context is for kings.*
- The **CLI is part of the Holonovel MCP**. It should mechanically process what can be
  processed; the AI should not turn every knob by hand. The AI can use the CLI.
- Writing and editing features belong in Holonovel.
- Produce a roadmap to discuss and work through in future sessions.

---

## 2. Design principles

1. **Context first.** Every operation resolves a context explicitly and reports it.
   No operation silently creates or requires a Novel when another surface is valid.
2. **Parity by default.** A capability that makes sense on novel, codex, and roster
   exists on all three, or its absence is documented with a reason.
3. **Descriptive, not prescriptive.** The system describes what exists, what can be
   done, and what a check found. It does not mandate an order. Rigor is available on
   demand, not imposed by default.
4. **Mechanical first.** Deterministic work (validate, render, export, diff, lint)
   lives in the CLI. Judgment work (invent, choose, dramatize) stays with the model or
   the user.
5. **One core, many adapters.** MCP and CLI call the same engine. Neither reimplements
   state, validation, or rules resolution.
6. **The user's detail is never discarded.** A user who wants to set a scene beat,
   an NPC's private want, or a clue's exact wording can do so without the system
   rewriting it. AI fills only what is blank.
7. **Every surface is exchangeable.** Novel, codex, roster, and ruleset each have a
   deterministic export and a documented import. Content moves between installations.
8. **Canon direction is declared, not assumed.** A project records whether the server
   or a document is authoritative. The system never silently reconciles two-way edits;
   it reports drift and proposes a patch.
9. **No hidden state.** The resolved data directory, context, canon source, and version
   are printable from one command.

---

## 3. The context model

Four contexts. They differ by **persistence**, **lifetime**, and **what they are for**.

| Context | What it is | Persists to | Lifetime | Default when |
|---|---|---|---|---|
| **Novel** | A play instance: world, scene, NPCs, clocks, beliefs, sessions | `novels/<slug>.json` | One campaign | A Novel is open |
| **Codex** | Reusable authored content: NPCs, characters, scenes, encounters, lore, factions, rooms, things, templates, voice profiles, adventures | `codex.json` | Across Novels | Authoring outside play |
| **Roster** | Persistent player characters | `roster.json` | Across Novels | A PC outside play |
| **Reference** | Read-only ruleset content | ruleset packages | Installed package | A rules lookup |

### 3.1 Resolution order

Every context-aware operation resolves in this order:

1. **Explicit** — a `context` or `target` argument (`novel`, `codex`, `roster`,
   `reference`, or a concrete id/slug).
2. **Play** — if a Novel is open and the operation is play-scoped (turn, scene,
   badge, session), use `novel`.
3. **Subject** — if the operation names a roster id or is a PC operation, use
   `roster`.
4. **Authoring** — if the operation names a codex entry or is an authoring
   operation, use `codex`.
5. **Lookup** — if the operation is a ruleset query, use `reference`.
6. **Fallback** — `codex`. Never `novel` as a silent fallback.

A response that resolved a context carries it:

```json
{
  "status": "OK",
  "context": { "kind": "codex", "id": "character_nemes" },
  "text": "..."
}
```

The CLI prints the same line in human mode:

```
context: codex (character_nemes)
```

### 3.2 What each context owns

The codex carries the same **state schema** as a novel. The difference is tense: a
codex entry is declared or initial state; a novel is the live instance. Capturing from
a novel freezes current values into a codex entry; materializing from a codex entry
instantiates a fresh live copy with a provenance link.

| Concern | Novel | Codex | Roster | Reference |
|---|---|---|---|---|
| World rooms, exits, things | Live | Yes (bundle) | — | — |
| Scene and encounter state | Live | Yes (bundle) | — | — |
| NPCs, including `mind` | Live | Yes (reusable) | — | — |
| Player characters | Live | Yes (reusable) | Yes (persistent) | — |
| Lore, secrets, factions | Live | Yes | — | — |
| Beliefs, memory, perception | Live | Yes (declared initial) | Identity only | — |
| Clocks, vows, agents | Live | Yes (declared initial) | — | — |
| Ruleset binding | Yes | Scope tag | Scope tag | Package |
| Play loop and session history | Yes | — | — | — |
| Export / import | Novel pack | Codex pack | Roster pack | Ruleset package |

**Snapshot mode.** A codex entry may be a `template` (declared initial state) or a
`snapshot` (a frozen moment from a played Novel). The snapshot is the holodeck feature:
restore, branch, diff, replay. The full design is in `docs/codex-snapshot.md`; the
roadmap tracks it as the S-series in §7.

### 3.3 The implementation gap

`requireNovel()` is called **129 times** in `holonovel/src/index.ts`.
`manage_character (action: create)` calls it, so a player character cannot be created
outside a Novel even though the roster is a persistent, ruleset-scoped store.
`manage_adventure` already handles `target: novel | codex | both`; that is the pattern
to generalize.

The audit work is to classify every `requireNovel()` call as one of:

- **novel-only** — play state genuinely needs a Novel (turn, scene, badge, session).
- **context-agnostic** — the operation is valid on codex or roster (create, edit,
  sheet, validate, export, render, search).
- **wrongly novel-bound** — currently requires a Novel but should not (the bugs).

The classification becomes a checked table, not a judgment call, so a new action cannot
quietly reintroduce the assumption.

### 3.4 Canon direction: server-canon and document-canon

A project declares one canon direction. The declaration is a small file at the project
root, or a front-matter block:

```yaml
# canon.yaml
project: ruined-hour
canon: server            # default
# canon: document:notes/ruined-hour-gm-notes.md
# mixed:                 # optional per-surface override
#   mechanics: server
#   narrative: document:notes/ruined-hour-gm-notes.md
```

**Server-canon (default).** The server is authoritative. Markdown, PDF, and JSON are
mirrors regenerated by `holonovel render`. An edit to a mirror is drift: the system
reports it and offers a patch, and never accepts it silently.

**Document-canon (the GM-notes mode).** A user-authored document is authoritative.
Holonovel parses it into a projection with stable IDs and source spans, and reports
drift in both directions:

- **Document → server:** a passage was added, changed, or removed; the projection is
  stale. The system proposes the structured change.
- **Server → document:** a structured object was edited in Holonovel and is not
  reflected in the document. The system proposes a patch back to the document.

This is the spec-to-code relationship the maintainer named: the notes doc is the
specification, the structured object is the implementation, and drift is the gap
between them. It is the same shape as `drift-report` in the engineering loop: each row
cites `doc:line → object:field`, and the report never edits either side.

Rules:

1. **One direction of truth per surface.** A two-way sync is always a pair of proposed
   patches, never a silent merge.
2. **Every projection carries provenance.** `source: {doc, span, hash}` on the object.
3. **The canon source is never rewritten without a diff.** `sync` proposes; `apply`
   writes.
4. **Mixed canon is opt-in and explicit.** Per-surface choices are allowed only when
   named; there is no implicit blend.
5. **A missing declaration means server-canon.** The default is safe and reversible.
6. **Anchors are explicit first.** A note carries an ID such as
   `<!-- holonovel:scene:ambush -->`; a fuzzy diff may propose a match but requires
   review before it becomes a projection.
7. **Mixed canon names every surface.** A `mixed` block is valid only when each entry
   names `server` or `document:<path>`; a partial map is refused.

The GM-notes recipe in §6 is this mode. The user writes as at a table; Holonovel is the
projection and the checker. The notes stay canon until the user promotes the server to
canon in one explicit step.

---

## 4. Surface parity matrix

Target state. A dash means the capability does not apply; a reason is recorded in the
capability manifest. "Carry" means the surface can store the state shape; "live" means
it owns the current instance and session history.

| Capability | Novel | Codex | Roster | Reference |
|---|---|---|---|---|
| Create / edit / duplicate / delete | Yes | Yes | Yes | — |
| Sheet / render (md, html, pdf, json) | Yes | Yes | Yes | — |
| Validate (schema, rules, arithmetic) | Yes | Yes | Yes | Yes |
| Export / import / pack | Yes | Yes | Yes | Yes |
| Snapshot / diff / merge / branch | Yes | Yes | Yes | — |
| Search / tag / link | Yes | Yes | Yes | Yes |
| Scene card / encounter card | Live | Carry | — | — |
| Lore / canon / secrets | Live | Carry | — | — |
| Beliefs / memory / perception | Live | Carry (initial) | Identity only | — |
| Clocks / vows / agents | Live | Carry (initial) | — | — |
| NPC `mind` | Live | Carry | — | — |
| Ruleset bind / scope | Yes | Yes | Yes | Yes |
| Module import (store) | — | Yes | — | — |
| Module instantiate (play) | Yes | — | — | — |
| Play loop and session history | Yes | — | — | — |
| Snapshot capture / restore / diff / replay | Yes (source) | Yes (store) | — | — |
| Review packet / ledger | Yes | Yes | Yes | — |

The rule: **a capability missing on a surface is a documented decision, not an
oversight.** The matrix is generated from the registry and gated, so it cannot drift
from the implementation.

---

## 5. Capability catalog

These are the verbs the authoring surfaces expose. They are capabilities, not stages.

**Author.** create, edit, duplicate, delete, merge, split, link, tag, promote, demote,
move between surfaces (codex ↔ novel, roster ↔ novel).

**Structure.** outline, scene card, encounter card, clue, reveal, ending, timeline,
relationship, faction, clock, vow, agenda.

**Validate.** schema, canon, reachability, trigger satisfiability, arithmetic,
continuity, state parity, content floor, leak, prose patterns, module completeness.

**Render.** markdown, html, pdf, json, character sheet, scene card, encounter card,
adventure module, reader edition.

**Exchange.** export, import, pack, unpack, snapshot, diff, merge.

**Canon.** declare, resolve, project, drift, sync, promote, demote.

**Play.** open, turn, close, recap.

**Review.** packet, panel, qa, ledger, aar.

**Admin.** status, doctor, schema, call, update, migrate.

---

## 6. Workflow recipes (descriptive, not prescriptive)

These are documented examples, not gates. A user can enter at any point and leave at
any point. The system suggests the next capability; it does not block on an order.

### Recipe 1 — AI-first

Premise → generate a scaffold → AI fills blanks → playtest → polish.
The user approves shape and content; checks are advisory until publish.

### Recipe 2 — Hands-on

Empty scene card → write each beat → attach clues and state deltas → validate → play.
The AI answers questions and runs checks; it does not rewrite authored text.

### Recipe 3 — Module import

Bring a published module → parse scenes, NPCs, encounters, clues → map to Holonovel
objects → review the map → instantiate a Novel → play.
The AI parses and proposes; the user accepts mappings.

### Recipe 4 — GM notes (document-canon)

Write freeform notes as at a table. Declare the notes document as canon. Holonovel
parses it into a projection: scenes, NPCs, clues, encounters, and state defaults, each
with a source span and hash. The user edits the notes, not the projection; `holonovel
sync` reports drift and proposes a patch. When the user is ready to let the server lead,
`holonovel canon set server` flips the direction in one explicit step.

The AI structures and checks; the user keeps the voice. This is the spec-to-code shape:
the notes doc is the specification, the structured projection is the implementation, and
drift is the gap between them.

### Recipe 5 — Character-first

Build a character in the roster → render a sheet → import into a Novel at session zero.
No Novel exists until play.

### Recipe 6 — Codex-first

Build a library of NPCs, scenes, encounters, lore → export a codex pack → import into a
Novel when ready.
Novel is a consumer of the codex, not its precondition.

### Recipe 7 — Polish existing

Import a draft → run prose, continuity, and canon checks → fix → blind read → package.
The AI reports; the user decides.

Each recipe is a one-page doc under `docs/recipes/`. They share capabilities; they do
not fork the engine.

---

## 7. Workstreams and increments

Eight workstreams. Increment IDs are stable for discussion; they are not commitments.

### W1 — Context model and surface parity

| ID | Increment | Depends on | Done bar |
|---|---|---|---|
| A1 | Context resolver: `resolveContext()`, response context, `--context` | — | Every context-aware action returns the resolved context; tests cover all six precedence rules |
| A2 | Audit the 129 `requireNovel()` sites; classify; fix the wrongly bound | A1 | A checked table; zero unclassified sites; the codex-vs-Novel and roster-create paths work without a Novel |
| A3 | Roster authoring parity: create, update, sheet, validate, export, import, snapshot | A2 | A PC can be created, edited, rendered, validated, and exported with no Novel |
| A4 | Codex authoring parity: kinds, schema, validate, render, link, snapshot | A2 | Every codex kind has create/edit/render/validate/export; a kind without a renderer is a documented decision |
| A5 | Shared entity schema across novel/codex/roster; migration | A3, A4 | One schema; existing data migrates; no field loss |
| A6 | Canon direction: `canon.yaml`, server/document resolution, printed canon | A1 | Server-canon is the default; document-canon resolves and prints; a missing declaration is server-canon |
| A7 | Document projection: stable IDs, source spans, content hash | A6 | A notes doc projects into objects; every object carries `source` |
| A8 | Drift report and proposed patch (`check drift`, `sync`) | A7 | Document→server and server→document drift are separate reports; no silent merge |

### W2 — Authoring surfaces

| ID | Increment | Depends on | Done bar |
|---|---|---|---|
| B1 | Project workspace: outline, scenes, timeline, clue graph, canon files | A1 | `project init` scaffolds; `project status` reports stage and gaps |
| B2 | Scene card: location, cast, purpose, entry/exit state, clues, choices | B1 | A scene card renders to a Novel scene and back without loss |
| B3 | Encounter card: stakes, opposition, terrain, rewards, failure | B1 | An encounter card instantiates as a Novel encounter |
| B4 | Adventure module import: parse, map, review, instantiate | B2, B3 | A module imports into codex and instantiates into a Novel |
| B5 | GM notes projection: freeform notes, promote to canon/scene/NPC/clue | A7, B1 | A note projects without rewriting its text; the source span is recorded |
| B6 | Canon tiers: hard, working, open, belief, retired; contradiction pass | A5 | A contradiction report quotes both sources and records a ruling |
| B7 | Character bible: want, fear, contradiction, voice anchors, knowledge ledger | A3 | A character renders a bible and a sheet from one record |
| B8 | Versioning: snapshot, diff, merge, branch for all surfaces | A5 | Two snapshots diff; a merge reports conflicts by field |
| B9 | Codex as a full bundle: carry the novel state schema as initial state | A5 | A codex entry can carry world, scenes, NPC minds, beliefs, clocks, and endings; instantiation is lossless |
| B10 | Optional licensing metadata on modules and codex packs | B4 | A module may carry `license`, `license_url`, `attribution`; absent is allowed |

### W2b — Snapshot mode (the holodeck)

Full design: `docs/codex-snapshot.md`. The short version: a snapshot is a frozen,
audienced, content-addressed copy of a Novel stored as a codex entry, distinct from a
checkpoint, clone, branch, or export.

| ID | Increment | Depends on | Done bar |
|---|---|---|---|
| S1 | Envelope, capture, state hash, audience, provenance | A5, B9 | A snapshot captures a Novel; the hash verifies; the audience is recorded |
| S2 | Sidecar storage, dedupe, retention, index | S1 | Two labels with the same state share one blob; delete is safe |
| S3 | Restore as new and in place, with confirmation and provenance | S2 | A snapshot restores into a fresh Novel and into an existing one; logs survive the in-place restore |
| S4 | Diff by path, human and JSON | S3 | Two snapshots diff by state path; added/removed/changed are named |
| S5 | Transcript replay (read-only) | S3 | A recorded run plays back without a model call |
| S6 | Share, export, import, redaction, licensing | S3 | A GM snapshot refuses to share until redacted; a player snapshot imports cleanly |
| S7 | CLI and MCP verbs | S3 | Every verb has `--help`, `--json`, and a parity test |
| S8 | Exact RNG draw replay (optional) | S5 | A restored snapshot reproduces the same session draw stream, or the limitation is stated |

S1–S3 are the core. S4–S7 make it usable. S8 is research; the default is state replay,
not draw replay.

### W3 — Mechanical validation

| ID | Increment | Depends on | Done bar |
|---|---|---|---|
| C1 | `check schema` and `check canon` | A5 | Schema and canon tiers validate; open questions must have owners |
| C2 | `check clues` and `check endings` | B1 | Every revelation has two routes; every ending trigger is satisfiable |
| C3 | `check state` (transcript vs export vs state) | A1 | Narrated-but-not-held facts are blockers |
| C4 | `check continuity` (names, dates, numbers, objects, knowledge) | B6 | A contradiction fixture fails; a clean fixture passes |
| C5 | `check prose` (slop patterns, gloss, action echo, speaker attribution) | — | The Ruined Hour v4 failures are caught by named rules |
| C6 | `check floor` and `check leak` | C3 | Content floor and player-edition leak are pass/fail |
| C7 | `check module` (import completeness) | B4 | A module missing a required section fails with a named gap |
| C8 | `check all` with `--strict` / `--advisory` | C1–C7 | One command; exit 0/1; JSON report |
| C9 | `check drift` for document-canon projects | A8 | Drift is a named report; a clean projection has zero drift |

### W4 — CLI as part of the MCP package

| ID | Increment | Depends on | Done bar |
|---|---|---|---|
| D1 | CLI skeleton: `status`, `doctor`, `schema`, `call`, `completion` | — | Same binary, same version; `holonovel` with no args still serves |
| D2 | Context commands: `context resolve`, `context list` | A1 | Prints the resolved context and why |
| D3 | Noun commands: `novel`, `codex`, `roster`, `ruleset`, `character`, `scene`, `adventure` | A3, A4, D1 | Each noun has list/get/create/edit/render/export; `--json` on all |
| D4 | `project` commands: init, status, check, aar | B1, C8 | A project folder is scaffolded and checked from the terminal |
| D5 | `review` commands: packet, ledger, save | C5 | A blind packet is built and a report is saved without copy-paste |
| D6 | Shell completion and `--help` at every level | D1 | bash/zsh/fish complete nouns, verbs, and flags |

### W5 — Rendering and interchange

| ID | Increment | Depends on | Done bar |
|---|---|---|---|
| E1 | Ruleset `sheet.json` contract; `render sheet` | A5 | One layout renders for Cyberpunk RED; a package without one falls back |
| E2 | Deterministic export (no read-side audit mutation) | A1 | Two exports of unchanged content are byte-identical |
| E3 | Novel pack, codex pack, roster pack, adventure module | E2 | Each packs and unpacks with a content hash |
| E4 | Reader edition (`--badge player`) | C6 | No GM-only string reaches the reader edition |
| E5 | One-file "send to a friend" package | E3, E4 | A single file opens on a clean install |

### W6 — Playtest and review harness

| ID | Increment | Depends on | Done bar |
|---|---|---|---|
| F1 | Player seat and narrator seat as first-class commands | D4 | A playtest runs from the CLI and writes transcript, choices, state |
| F2 | Blind packet builder with hashes and GM-only filtering | E4 | A packet has a hash and no design leakage |
| F3 | Review ledger: finding IDs, severity, disposition | C8 | Every blocker/major has a terminal disposition |
| F4 | AAR template for a writing run | F3 | A run ends with cost, rework, and loop status |

### W7 — Spec and governance

| ID | Increment | Depends on | Done bar |
|---|---|---|---|
| G1 | New REQs: context resolution, surface parity, CLI, deterministic export, reader edition | A1, D1, E2, E4 | Each REQ has a check; Appendix M authoring checklist applied |
| G2 | DECISIONS.md entries: gate classification, new non-goals | G1 | Every new tool classified; non-goals cite REQs |
| G3 | Gates: `check-context-parity`, `check-cli-schema`, `check-deterministic-export`, `check-reader-edition` | G1 | Wired into `check:fast` and `check` |
| G4 | Docs: `docs/authoring-surfaces.md`, `docs/cli.md`, `docs/recipes/` | D1, D3 | Docs match the generated schema |

### W8 — The writing process, as support rather than gate

| ID | Increment | Depends on | Done bar |
|---|---|---|---|
| H1 | `docs/writing-recipes.md`: the seven recipes, one page each | B1 | Recipes use existing capabilities only |
| H2 | Optional rigor profiles: `free`, `advisory`, `strict` | C8 | A profile changes what blocks, not what exists |
| H3 | A writing runbook, analogous to Appendix V | C8, F4 | A run names entry point, happy path, recovery |
| H4 | AAR loop for writing runs | F4 | Findings have owners; loop ends PAUSED or OPEN |

---

## 8. CLI design

### 8.1 Why it belongs to the MCP package

- Same binary, same version, same install, same data directory.
- `createEngine()` already loads the engine without starting the server
  (`holonovel/src/engine.ts`, `holonovel/src/library.ts`).
- The adapter boundary in `docs/engine-contract.md` §7 already allows a second
  transport.
- The 37-tool budget (REQ-429) stays flat: long-tail operations live in the CLI, not in
  new MCP tools.
- A small model can call `holonovel <noun> <verb>` more cheaply than it can hold 37
  JSON schemas. The CLI is an affordance for local models, not only humans.

### 8.2 Shape

```
holonovel
├── status
├── doctor [--fix] [--json]
├── version
├── schema [--json]
├── completion <bash|zsh|fish>
├── serve [--http] [--port N]
├── update | migrate [--dry-run] [--json]
├── context resolve|list
├── canon get|set|drift|sync
├── novel list|get|create|edit|export|import|snapshot|diff
├── codex list|get|set|edit|render|validate|export|import
├── codex snapshot create|list|get|diff|restore|export|import|delete
├── roster list|get|create|edit|render|validate|export|import
├── character sheet|validate|render
├── ruleset list|install|remove|bind|search|lookup|verify|convert
├── scene list|get|set|render
├── adventure list|import|map|instantiate
├── project init|status|check|aar
├── check schema|canon|clues|endings|state|continuity|prose|floor|leak|module|drift|all
├── review packet|ledger|save
├── transcript export|inspect
└── call <tool> [--args-json JSON]
```

`holonovel` with no arguments keeps its current behavior: start the MCP server.
`serve` makes that explicit.

### 8.3 Contract rules

- `--json` on every command; stable error kinds; `schema` describes commands, arguments,
  output shapes, and exit codes.
- `--dry-run` on every mutation; `--no-input` never hangs; `--yes` for destructive
  bypass.
- `--context` and `--target` on every context-aware command; `--canon` on every command
  that reads or writes a project.
- `--data-dir` and `HOLONOVEL_DATA_DIR`; `status` prints the resolved path.
- `status` prints `context:` and `canon:` lines; a JSON response carries both.
- stdout is the payload; stderr is diagnostics.
- Exit codes 0 (pass), 1 (gate/check failure), 2 (usage/fatal).
- `--no-color`, `NO_COLOR`, TTY detection.
- Idempotent reads; declare non-idempotent writes.
- Bounded output: `--limit`, `--cursor`, `truncated: true`.
- CalVer-minor compatibility: commands and JSON shapes are stable within a minor;
  additions are allowed; removals require a deprecation cycle.

### 8.4 Mechanical vs judgment split

| Operation | CLI (mechanical) | Model (judgment) |
|---|---|---|
| Schema, canon tiers, open questions | Yes | — |
| Clue reachability | Yes (graph) | Fairness judgment |
| Ending trigger satisfiability | Yes | Dramatic quality |
| Arithmetic and point buys | Yes | Build advice |
| State / transcript parity | Yes | — |
| Continuity names, dates, numbers | Yes (index) | Whether a change is justified |
| Prose slop patterns | Yes (rules) | Voice quality |
| Render sheet / PDF | Yes | Layout design |
| Export / import / pack | Yes | What to include |
| Diff / merge / snapshot | Yes | Which version to keep |
| Scene / encounter scaffold | Structure | Content |
| Module import | Parse and map | Interpretation |
| Playtest | Harness and transcript | Performance |

### 8.5 The AI uses the CLI

The MCP tool descriptions gain one line where a mechanical path exists:

> Mechanical alternative: `holonovel check clues --project <dir> --json`.

The AI may shell out for deterministic work and use MCP for state mutation and play.
This keeps the model out of loops it is bad at (counting, hashing, diffing) and inside
the ones it is good at (inventing, choosing, dramatizing).

---

## 9. Writing and editing features

The features the surfaces need, grouped by what they support.

**Structure.** Outline, beat sheet, scene card, encounter card, clue graph, reveal
ladder, ending map, timeline, relationship map, faction clock.

**Character.** Want, need, fear, contradiction, voice anchors, knowledge ledger,
private mind, relationship stances, arc beats.

**Canon.** Hard/working/open/belief/retired tiers, source links, contradiction pass,
rename and merge with reference updates.

**Drafting.** Scene prose, dialogue, choices, directives, freeform notes, AI fill with
a visible diff.

**Editing.** Line lint, repetition, speaker attribution, gloss and echo detection,
readability, style sheet, revision log.

**Validation.** The check suite in W3.

**Playtest.** Player seat, narrator seat, transcript, choices, state, blind packet,
review ledger.

**Packaging.** Reader edition, quickstart, cover, credits, content notes, optional
licensing metadata, one-file export.

These are capabilities. The recipes in §6 show how they compose; the system does not
require a composition.

---

## 10. Spec, gates, and docs

**New REQ areas.** Context resolution and precedence; canon direction and drift;
surface parity; CLI as a supported adapter; deterministic export; reader edition;
authoring capabilities; review ledger. Each needs a `*Check:*` and a gate.

**New gates.**

- `check-context-parity` — the capability matrix matches the registry.
- `check-canon-direction` — a project resolves server-canon or document-canon; no
  implicit blend.
- `check-cli-schema` — every command has `--help`, `--json`, and a schema entry.
- `check-deterministic-export` — two exports of unchanged content are byte-identical.
- `check-reader-edition` — no GM-only string reaches a player edition.
- `check-authoring-fixtures` — scene, encounter, character, and module round-trip.
- `check-drift` — a document-canon projection reports its drift and never merges
  silently.

**DECISIONS.md.** Record the context model, the canon-direction default, the parity
rule, the CLI as an adapter, and the new non-goals (e.g., no hosted authoring UI in this
program).

**Docs.** `docs/authoring-surfaces.md` (this document, promoted), `docs/cli.md`,
`docs/recipes/`, and a writing runbook analogous to Appendix V.

---

## 11. Sequencing

**Foundation first.** A1 and A2 gate everything else; without a context resolver, parity
work fights the old assumptions. A6–A8 follow because canon direction is the second
half of the same resolver.

**Then the mechanical surface.** D1 gives status, doctor, schema, call, and completion.
It is small and it removes the restart/stale-dist class of friction immediately.

**Then parity.** A3 and A4 make roster and codex real. B9 makes the codex a full bundle.
This is the user-visible promise.

**Then rendering.** E1 and E2 remove the one-off character-sheet generator and the
non-deterministic export.

**Then the first proof.** Nemes: roster-only creation, `sheet.json` render, one-file
pack. This exercises A3, B9, and E1 in one artifact.

**Then the holodeck.** S1–S3 give snapshot capture, restore, and diff on top of codex
parity. They are a parallel track to E1: the first snapshot can be the Nemes character
as a codex entry, and the first real one is a Ruined Hour moment captured before the v5
run.

**Then checks, then play.** C1–C9 and H1–H4 turn the quality sweeps into optional gates
and documented recipes. The Ruined Hour v4 baseline runs through the checks before the
next playthrough.

### Recommended first four increments

1. **A1 + A2 — context resolver and the 129-site audit.** One or two sessions. The
   deliverable is a resolution rule, a response field, a checked classification table,
   and the codex/roster paths working without a Novel.
2. **D1 — CLI skeleton.** One session. `status`, `doctor`, `schema`, `call`,
   `completion`. This is the mechanical surface the AI will use for everything else.
3. **A3 + A4 + B9 — roster and codex parity, full bundle.** Two to three sessions.
   Create, edit, sheet, validate, render, export, import on both surfaces; a codex entry
   can carry the novel state schema.
4. **E1 — `sheet.json` and `character sheet --format pdf`.** One to two sessions. The
   Nemes proof: roster-only creation, rendered sheet, one-file pack.

After those, A6–A8 (`canon`/`drift`) are the document-canon foundation, and C2/C3
(`check clues`, `check state`) are the highest-value quality win.

### The Ruined Hour sequence

Per decision 8, the checks run before the next playthrough:

1. Export the current v4 Novel and the reader edition.
2. Run `check canon`, `check clues`, `check endings`, `check state`, `check continuity`,
   `check prose`, `check floor`, `check leak` against a v4 baseline.
3. Write the findings to a ledger with IDs and dispositions.
4. Fix blockers and majors that are structural or factual; record the rest.
5. Re-run the checks until the blocking set is clean.
6. Play v5 with the strict profile; the ledger carries forward.

The baseline is the proof that the checks catch the v4 carryover list rather than
inventing a new one.

---

## 12. Decisions and remaining questions

### Settled 2026-11-25

The eleven decisions are recorded once in §0. This section does not restate them; it
records only what is still open.

### Remaining

1. **Document format.** Markdown only at first, or also docx/pdf ingestion? The proposal
   is Markdown first, with a converter boundary for other formats later.
2. **Promotion semantics.** When `canon set server` flips a project, what happens to
   notes that were never projected? The proposal: they remain in the document as
   `unprojected` and are reported, never discarded.
3. **Module formats.** Markdown and JSON first; PDF later through the Convert workflow.
   Does that match the modules you expect to bring in?
4. **The first proof's acceptance.** Is "Nemes renders from `sheet.json` and packs into
   one file" enough, or must it also import into a fresh Novel and play one turn? The
   proposal: both, because the pack must be demonstrably playable.
5. **Ruined Hour scope.** Does the v4 baseline try to fix the c09/June findings, or only
   measure them? The proposal: measure first, fix only what the blocking set names, and
   leave the rest to the v5 ledger.

Snapshot-specific questions live in `docs/codex-snapshot.md` §13: memory inclusion,
sidecar vs inline storage, exact RNG replay, in-place restore, audience default,
retention, ownership, and the canon relationship.

---

## 13. Non-goals for this program

- A hosted authoring UI, multiplayer, or a visual editor. The CLI and MCP surfaces are
  the program.
- A mandatory pipeline. The recipes are documentation, not gates.
- Replacing the existing tool surface. The CLI absorbs long-tail operations; MCP keeps
  its 37-tool budget.
- A general-purpose word processor. Editing features target narrative structure,
  continuity, and prose patterns.
- Storing copyrighted module text. Import structure and user-authored summaries.

---

## 14. Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Context resolver adds ambiguity instead of removing it | Medium | Print the resolved context; test all six precedence rules; explicit override always wins |
| Parity work grows the surface beyond budget | Medium | CLI carries long-tail actions; MCP parity is capability-level, not action-level |
| Mechanical checks produce false confidence | Medium | Advisory by default; strict only on publish; every check has a fixture and a false-positive test |
| CLI drifts from MCP | High if separate code | One engine, shared handlers, parity tests in CI |
| The writing recipes become a de facto mandate | Medium | Docs say "recipe, not rule"; no gate requires a recipe |
| Migration loses codex/roster data | Low | Additive schema; snapshot before migration; round-trip fixtures |
| Document-canon drift becomes a second source of truth | High if mixed | One declared direction; drift is a report; sync is a proposed patch; no silent merge |
| Codex snapshots bloat the library | Medium | Separate `template` and `snapshot` modes; size budget; dedupe by content hash |

---

## 15. Success measures

- A character can be created, edited, rendered, validated, and exported with **no Novel
  active**, from both MCP and CLI.
- A codex entry can be created, edited, rendered, validated, and exported with **no
  Novel active**, from both MCP and CLI.
- A codex entry can carry the full novel state schema as a template, and instantiate it
  without loss.
- A snapshot captures a Novel, restores into a fresh Novel, diffs against a second
  snapshot, and exports a player-safe copy.
- `holonovel status` answers "what version, what data directory, what context, what
  canon, what is stale" in one command.
- Two exports of unchanged content are byte-identical.
- A blind reader edition contains no GM-only string in a fixture with secrets.
- A document-canon project reports drift in both directions and never merges silently.
- The Nemes proof renders a sheet from `sheet.json`, packs into one file, imports into a
  fresh Novel, and plays one turn.
- The Ruined Hour v4 carryover findings are caught by named checks, not by a new panel.
- The 37-tool budget does not grow; the CLI command count grows instead.

---

## 16. Relationship to the existing loop

This document is a program roadmap, not a `ROADMAP.md` item. `ROADMAP.md` admits one to
three bullets and a trigger per section; the first approved increment moves there and
into `docs/plans/<date>-<slug>/` with `plan.md`, `tasks.md`, and `aar.md`.

The program follows the same review loop as the rest of the repo: plan review, a done
bar per increment, an AAR with terminal dispositions, and `LOOP PAUSED` or `LOOP OPEN`.
The difference is that the deliverable is authoring capability, not a gate.
