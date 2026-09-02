<!--
README DESIGN:

  Product principle.
    The README answers three questions for three readers, each in under
    60 seconds: an operator gets a running server, an evaluator
    understands what it does and how it differs, a contributor finds how
    to help. It is a design document, not an afterthought. Every section
    earns its place.

  Scannability.
    Engineers scan, don't read. Consistent heading hierarchy (ATX only,
    no setext). No wall of prose — every section is broken into
    digestible paragraphs. One story vector per section.

  Voice.
    Punchy, reserved, grounded in fact. Direct address ("you"). No
    first-person ("we", "I", "our"). Professional without being cold.
    No "obvious to me" assumptions — every sentence survives a reader
    who knows nothing about the project.

  Plain English (Standing Rule 10).
    Describe what the user does, not what the tool is called. Write as
    if instructing a person, not documenting an API. Tool names,
    parameter shapes, and technical syntax SHALL NOT appear in prose.
    The validator enforces this.

  Structure.
    Orientation → Table of contents → Run a server (§1) → How it works
    (§2) → How it compares (§3) → Contribute (§4) → Footer. No other
    ordering. Section headings use canonical numbering (§1–§4) matching
    the TOC and cross-reference links. The TOC is a bulleted list of
    every h2 and h3 heading with Markdown anchor links, each h2 entry
    tagged by audience. It does not link to itself or the Orientation.

  Audience split.
    §1 is for operators who want a server now — one copy-paste
    quick-start sequence, plus installing and building rulesets. §2
    describes capabilities to an evaluator. §3 is the competitive
    landscape — one row per competitor category. §4 is for contributors.

  Orientation.
    Exactly four elements: h1 heading, bold tagline on its own line,
    the MCP server card badge (below the tagline), one prose paragraph
    (≤80 words). The paragraph defines "holonovel"
    as a Star Trek holodeck program. States what Holonovel builds (the
    server, the Holodeck), what a campaign becomes (the program, the
    Novel), and what rulebooks become (the engine). Names D&D 5e and
    Starfinder as example rulesets the spec can build. Closes with
    "Your books. Your server. Your Holodeck."

  Table of contents.
    Bulleted list of every h2 and h3 heading with Markdown anchor links.
    Appears between the Orientation and §1. Each h2 entry carries a
    trailing audience tag — operators, evaluators, or contributors —
    outside the link. h3 entries are untagged. No prose, no descriptions.
    The validator enforces TOC-to-heading consistency.

  Run a server (§1).
    Three h3 subsections. No introductory prose under the h2.
    Install: one descriptive sentence, prerequisite (Node.js 20+), shell
    code block for install, and copy-paste JSON config block with
    `<path>` placeholder.
    Install a ruleset: drop-in packages, lazy loading, and the
    `.holonovel-state/` location.
    Build your own rulebook: the build-ruleset entry point.
    Config blocks use `json` language tag. Shell blocks use `sh`.
    No blockquotes, no tool names in prose.

  How it works (§2).
    One introductory h2 sentence (≤50 words) naming the pipeline, then
    five stages — Convert → Build → World → Novel → Synthesis. Each
    stage follows this format:
      1. What-it-is paragraph — defines the capability conceptually.
      2. What-you-can-do paragraph — describes player/GM capabilities.
      3. Demo blockquote — 2–5 natural-language prompts, each a
         self-contained sentence valid on the holonovel MCP server.
      4. Closing takeaway — one factual sentence, not a slogan.
    Badge enforcement is not a stage — it is a cross-cutting runtime
    layer, described once inside Novel. No forward references between
    stages. Each stage is readable independently.

  Five stages (§2).
    Convert (rulebooks → clean Markdown) and Build (Markdown → a
    declarative ruleset package) carry the Convert/Build claims.
    World (the spatial model) covers rooms, things, exits, containment.
    Mentions Inform exactly once.
    Novel (the campaign object) covers scenes, NPCs, lore, factions,
    secrets, journal, and the badge settings Player / Game Master /
    Observer / Editor. Badges are Novel-scoped; enforcement runs
    server-side.
    Synthesis (the game evolving) distinguishes Ruleset Wisdom from
    external research.

  Badge terminology.
    The canonical term is "badge," not "hat." Badges are Novel-scoped:
    each Novel has its own active badge. Enforcement runs server-side.
    Four settings: Player, Game Master, Observer, Editor. Player and GM
    are "in the story." Observer is in the story. Editor (none) is out
    of the story.

  Comparison table (§3).
    h2 heading, no introductory prose. Three columns (Category | What
    you're used to | How Holonovel differs). Three rows, one per
    competitor category — AI storytelling apps, generic LLM chat, and
    first-generation rules MCP servers. Never individual products. One
    closing prose paragraph (≤80 words) states the gap and names D&D 5e
    and Starfinder.

  Refrain contract.
    "Your books. Your server. Your Holodeck." appears once, in the
    Orientation paragraph. The word "Holodeck" appears in the tagline
    and the refrain as the product's central metaphor. Additional prose
    uses are permissible where the metaphor drives meaning.

  Contribute (§4).
    One h3 subsection — Improve the spec. No introductory prose under
    the h2. Prerequisite sentence, four-row commands table, closing
    assemble sentence, canonical-origin note, project-wiki link. No
    duplicated instructions from §1. License footer follows immediately
    — no heading.

  License footer.
    Three attribution lines: MIT, sources (Inform, four narrative
    frameworks), Inform credit. RSS link. "Last updated: YYYY-MM-DD."
    Date matches package.json version date. Update both or neither.

  Demo prompt maintenance.
    Every prompt in a demo blockquote SHALL be a valid natural-language
    command on the holonovel MCP server. The author SHALL verify all
    prompts after any tool or capability change. Broken prompts are a
    README defect.

  Blockquote convention.
    Blockquotes appear only in §2 stage subsections. No other section
    uses blockquotes. Each blockquote contains 2–5 natural-language
    prompts, each a self-contained sentence. No tool names, no parameter
    shapes, no function signatures — exactly what the user would say
    or type.

  Table convention.
    Exactly two tables: the comparison table (§3) and the Contribute
    commands table (§4). No other tables. No tables in prose.
    Pipe-delimited Markdown. No inline formatting beyond bold. Column
    widths are author-managed.

  No repetition.
    One story vector per section. Don't explain the same concept in two
    different places. The validator detects near-duplicate sentences.
    No bullet lists of features in prose. No tables for feature
    descriptions.

  Future targets.
    The Orientation and §3 closing prose name D&D 5e and Starfinder as
    example rulesets. No Mothership appears anywhere in the document.

  Non-goals.
    The README is not an API reference, a tool catalog, a spec document,
    or a changelog. It does not enumerate tools or parameters. It does
    not describe implementation details. It does not repeat information
    found in CHANGELOG.md, AGENTS.md, or holonovel.md.

  Word budget.
    Total prose ≤ 1,500 words (excludes code blocks, config JSON,
    tables, blockquotes, TOC, and footer). Orientation ≤ 80 words. §3
    closing prose ≤ 80 words.

  Validator.
    All rules marked "The validator enforces" SHALL be checked by
    scripts/validate-readme.ts. Rules without mechanical enforcement
    are maintained by author discipline. Adding an enforceable rule
    requires a corresponding validator check.

  Readme-driven development.
    The README is the first artifact of the repo. Changes that affect
    the README's claims SHALL update the README before or alongside the
    code change. A README that promises something the server does not
    deliver is a defect.
-->

# Holonovel

**Build the Holodeck. Load your campaign.**

[![holonovel MCP server](https://glama.ai/mcp/servers/flukeatzerocool/holonovel/badges/card.svg)](https://glama.ai/mcp/servers/flukeatzerocool/holonovel)

A *holonovel* is a Star Trek holodeck program — an interactive story where you
step inside as a character and the rules govern. Holonovel builds the server (the
Holodeck). Your campaign is the program (the Novel). Your rulebooks become the
engine — D&D 5e, Starfinder, or the game on your shelf. Your books. Your server.
Your Holodeck.

## Table of contents

- [Run a server](#run-a-server) — operators
  - [Install](#install)
  - [Install a ruleset](#install-a-ruleset)
  - [Build your own rulebook](#build-your-own-rulebook)
- [How it works](#how-it-works) — evaluators
  - [Convert](#convert)
  - [Build](#build)
  - [World](#world)
  - [Novel](#novel)
  - [Synthesis](#synthesis)
- [How it compares](#how-it-compares) — evaluators
- [Contribute](#contribute) — contributors
  - [Improve the spec](#improve-the-spec)

## Run a server

### Install

The base server — a world-model MCP with rooms, things, exits, parser commands,
and narrative tools. Install it, then install any number of ruleset packages —
each drops in alongside the base and never modifies it. Node.js 20+ required.

```sh
cd holonovel
npm install
npm run start
```

Add to your MCP client:

```json
"holonovel": {
  "type": "local",
  "command": ["npx", "tsx", "src/index.ts"],
  "cwd": "<path>/holonovel",
  "environment": {
    "TTRPG_NOVEL": "default"
  },
  "enabled": true
}
```

### Install a ruleset

The Build workflow turns a rulebook into a declarative package. Drop the package
into the install directory — `.holonovel-state/rulesets/<slug>/` by default — and
the running server registers it. Packages load lazily: a ruleset's tools and index
hydrate only when you open a campaign bound to that ruleset, so stacking many
packages costs you nothing up front. Install, remove, and list packages from the
server tools, or just move files and restart.

Your campaign data and installed packages live under `.holonovel-state/`, outside
the server tree — updating holonovel never touches them.

### Build your own rulebook

To start a build, run the entry point — it records the intake and prints the
workflow to follow (see the spec's Workflow Runbooks appendix for the full happy
path):

```sh
npm run build-ruleset dnd5e=ruleset/dnd5e/
```

## How it works

Holonovel is one pipeline — Convert, Build, World, Novel, Synthesis — that turns
a rulebook into a running table. Badge enforcement runs across all of it,
server-side.

### Convert

Convert takes PDFs, HTML, and web scrapes and turns them into clean Markdown.
Column detection reassembles tables across page breaks. OCR catches text
embedded in images. The output is structurally sound — every heading resolved,
every reference traced.

> "Take the Dungeon Master's Guide — every chapter, every table, every sidebar —
> and make it a clean source file the server can build from."
> "Convert this PDF to Markdown, and reassemble the tables that break across
> pages."

Clean Markdown, ready to build.

### Build

Build reads that Markdown and extracts every mechanic. Dice procedures, combat
systems, spell catalogues, equipment tables, condition tracks — every structured
element becomes a tool, resource, or prompt in a declarative ruleset package.
Guidance prose becomes narrative material. The discovery engine samples the
source, measures extraction confidence, and iterates until every mechanical
section is accounted for. What can't be modeled stays searchable — nothing is
fabricated to fill a gap.

> "Build me a ruleset package from these files."
> "Extract every mechanic from this rulebook — the dice, the combat, the spells —
> into a ruleset package."

One spec. Any rulebook. Zero code.

### World

The world model is a spatial simulation layer — rooms, exits, containers,
supports, doors. Every object knows where it is and what it contains. The server
maintains a real containment graph, not a paragraph of prose it hopes the AI
remembers. The world model is powered by the Inform programming language — the
same engine behind decades of interactive fiction classics.

Parser commands navigate the world with real containment logic. Go north. The
room is there. Take the lantern. It moves from the sarcophagus to your
inventory. Open containers, lock doors, examine surroundings. Exits connect
automatically in both directions. Most AI RPG tools have no spatial model — the
AI pretends to remember where things are.

> "Go north."
> "Take the lantern from the sarcophagus."
> "Look around."
> "Open the iron door."
> "Examine the runes carved into the altar."

Your map is real.

### Novel

A Novel is your entire campaign — party, NPCs, scenes, lore, combat state, world
model, story journal, factions, secrets, everything. The narrative model gives
your world depth: scenes set the stage, NPCs carry personality profiles and
dialogue voice, lore entries fire automatically when keywords match, factions
track standing, secrets gate knowledge, vows bind quests, countdowns escalate on
schedule. The story journal records decisions, moments, and consequences — a
narrative memory that survives every rebuild.

A Novel lives on the server. It survives restarts, rebuilds, and session breaks.
Export as JSON or Markdown. Import with merge, replace, or dry-run modes. Clone
to test a story branch. Set checkpoints before pivotal moments. Undo any
mutation. A Novel is not a chat log — it is a structured save file. Other tools
ask the AI to remember your world. Holonovel writes it to the server —
structured, queryable, permanent.

Every Novel has four badge settings. Player. Game Master. Observer. Editor.
Switch between them at any time — no restart, no reload. The AI takes the
opposite role automatically: when you're the player, the AI is your GM. Badge
gating is not a prompt instruction. It is enforced server-side — the GM's
secrets, lore entries, and narrative directives never leak to the Player badge.

> "Set the scene: a flooded ossuary beneath the old cathedral. The air is thick
> with stale incense and something older."
> "A figure emerges from the shadows — Sister Mora, an acolyte of the buried
> order. She's terrified, not hostile."
> "I swear a vow to recover the Saint's Reliquary before the next full moon."
> "Switch to the Game Master badge. I need to set up the next scene."
> "Pace: I want things to move faster."

Your campaign. On the server. Forever.

### Synthesis

Synthesis deepens your campaign through two source categories. Ruleset Wisdom is
extracted from your rulebooks during Build — voice examples from example-of-play
dialogue, lore templates from setting descriptions, action patterns from
resolution sequences, narrative voice profiles from inspirational media
citations. It persists as first-class server behavior — the Holodeck renders
your rulebook's own genre conventions mechanically. Ruleset Wisdom survives
every rebuild and synthesis reversion.

External research runs on demand — web-sourced GM advice, actual-play
breakdowns, designer notes. Tagged with source URLs, confidence scores, and
freshness timestamps. Every synthesis item is inert by default. The GM toggles
what matters on and off at runtime. Re-running synthesis replaces inactive items
while preserving everything the GM has activated. Revert synthesis removes
external research — Ruleset Wisdom persists.

> "Find me GM advice and play examples for running horror one-shots."
> "Research how other tables handle horror pacing, and tag what you find with
> sources."

The game evolves without losing what you've built.

## How it compares

| Category | What you're used to | How Holonovel differs |
|----------|---------------------|-----------------------|
| AI storytelling apps | Freeform AI storytellers — invent rules, forget consequences | Your rulebooks. Real dice. Real conditions. Not AI improv. |
| Generic LLM chat | Forgets conditions mid-combat, invents spells, drifts from the ruleset | The server remembers every rule you gave it. Deterministic dice. Conditions that don't vanish mid-fight. |
| First-generation rules MCP servers | Hand-built for one edition of one game. Rules lookup and nothing else. | Not locked to one system. One spec reads any rulebook — D&D 5e, Starfinder, or whatever's on your shelf. |

Every tool in this space asks you to pick. Rules engines serve one system and
stop there. AI storytellers improvise mechanics as they go. Holonovel doesn't
pick. The server enforces every mechanic. The AI narrates. The Novel preserves
everything — D&D 5e, Starfinder, or your own rulebook.

## Contribute

### Improve the spec

```sh
npm install && npm run check   # lint + validate + assumption audit + ambiguity
                                # scan + cross-ref check + dupe detection
```

| Command | What it checks |
|---------|---------------|
| `npm run fmea` | REQ-level failure mode and effects |
| `npm run validate --traceability` | Full REQ↔test↔workflow traceability |
| `npm run graph-deps` | REQ dependency graph (DOT/Graphviz) |
| `npm run spec-health-trends` | REQ count, test count, cross-ref density |

Edit files in `spec/`. Run `npm run assemble` before committing. Do not edit
`holonovel.md` directly — it is generated from `spec/` source files.

Canonical origin: [git.gay/flukeatzerocool/Holonovel](https://git.gay/flukeatzerocool/Holonovel). This GitHub repository is a read-only mirror.

Guides for players, Game Masters, and builders live in the [project wiki](https://git.gay/flukeatzerocool/Holonovel/wiki).

License: MIT. Built from: Graham Nelson's Inform (Artistic License 2.0),
if-craft-corpus (CC BY 4.0), dmcp (MIT, Shawn Rushefsky), lonelog (CC BY-SA 4.0),
BitD SRD (CC BY 3.0, John Harper).
[RSS](https://git.gay/flukeatzerocool/Holonovel). Last updated: 2026-08-29.
