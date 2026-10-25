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
    (§2) → How it compares (§3) → License. No other ordering. Section
    headings use canonical numbering (§1–§3) matching the TOC and
    cross-reference links. The TOC is a bulleted list of every h2 and h3
    heading with Markdown anchor links, each h2 entry tagged by audience.
    It does not link to itself or the Orientation.

  Audience split.
    §1 is for operators who want a server now — one copy-paste
    quick-start sequence, plus installing rulesets. §2
    describes capabilities to an evaluator. §3 is the competitive
    landscape — one row per competitor category.

  Orientation.
    Exactly five elements: h1 heading, bold tagline on its own line, a
    project-wiki line, the MCP server card badges (below the wiki line),
    and one prose paragraph (≤80 words). The paragraph defines "holonovel"
    as a Star Trek holodeck program. States what Holonovel builds (the
    server, the Holodeck), what a campaign becomes (the program, the
    Novel), and what rulebooks become (the engine). Names D&D 5e and
    Starfinder as example rulesets the spec can build. Closes with
    "Your books. Your server. Your Holodeck."

  Table of contents.
    Bulleted list of every h2 and h3 heading with Markdown anchor links.
    Appears between the Orientation and §1. Each h2 entry carries a
    trailing audience tag — operators, evaluators, or reference —
    outside the link. h3 entries are untagged. No prose, no descriptions.
    The validator enforces TOC-to-heading consistency.

  Run a server (§1).
    Two h3 subsections. No introductory prose under the h2.
    Install: a lede stating that a fresh install is playable with no
    rulebook (the starter Novel), the base-server description, prerequisite
    (Node.js 24+), shell code block for install, and copy-paste JSON config
    block with `<path>` placeholder.
    Install a ruleset: drop-in packages, lazy loading, and the
    state-directory location.
    Config blocks use `json` language tag. Shell blocks use `sh`.
    No blockquotes, no tool names in prose.

  How it works (§2).
    One introductory h2 sentence (≤50 words) naming the pipeline, then
    five stages — Convert → Build → Holodeck → Novel → Synthesis. Each
    stage follows this format:
      1. What-it-is paragraph — defines the capability conceptually.
      2. What-you-can-do paragraph — describes player/GM capabilities.
      3. Demo blockquote — 2–5 natural-language prompts, each a
         self-contained sentence valid on the holonovel MCP server.
      4. Closing takeaway — one factual sentence, not a slogan.
    Badge enforcement is not a stage — it belongs to the Novel, described
    once there. No forward references between stages. Each stage is
    readable independently.

  Five stages (§2).
    Convert (rulebooks → clean Markdown) and Build (Markdown → a
    declarative ruleset package) carry the Convert/Build claims.
    Holodeck (the simulation engine) covers the spatial model and the
    narrative model, including their couplings. Mentions Inform exactly
    once.
    Novel (the campaign save) covers the customizations and
    configurations that shape play — badge settings, badge enforcement,
    autonomy, player signals, narrative directives, behavioral settings,
    ruleset scope, and presentation.
    Synthesis (the game evolving) distinguishes Ruleset Wisdom, external
    research, internal synthesis, and player-authored items.

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
    rules MCP servers. Never individual products. One
    closing prose paragraph (≤80 words) states the gap and names D&D 5e
    and Starfinder. Rows name the concrete failure mode, not an abstraction.

  Refrain contract.
    "Your books. Your server. Your Holodeck." appears once, in the
    Orientation paragraph. The word "Holodeck" appears in the tagline
    and the refrain as the product's central metaphor. Additional prose
    uses are permissible where the metaphor drives meaning.

  License section.
    A `## License` h2 after §3, listed in the TOC with a reference tag.
    Opens with a canonical-origin line and an MIT statement, then a
    bulleted attribution list (every row in Appendix U, one per bullet)
    prefixed with "Built from:", then the RSS link and last-updated date.
    Date matches package.json version date. Update both or neither.
    Attribution bullets are exempt from the no-feature-list rule.

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
    Exactly one table: the comparison table (§3). No other tables. No
    tables in prose. Pipe-delimited Markdown. No inline formatting beyond
    bold. Column widths are author-managed.

  No repetition.
    One story vector per section. Don't explain the same concept in two
    different places. The validator detects near-duplicate sentences.
    No bullet lists of features in prose; license attribution bullets
    are the exception. No tables for feature descriptions.

  Future targets.
    The Orientation and §3 closing prose name D&D 5e and Starfinder as
    example rulesets. No Mothership appears anywhere in the document.

  Non-goals.
    The README is not an API reference, a tool catalog, a spec document,
    or a changelog. It does not enumerate tools or parameters. It does
    not describe implementation details. It does not repeat information
    found in CHANGELOG.md, AGENTS.md, or holonovel.md. Task-based routing
    lives in the wiki: the README links to Getting Started, Building a
    Server, Game Mastering, and the FAQ at the point of need, and links the
    wiki home once in the Orientation.

  Word budget.
    Total prose ≤ 1,500 words (excludes code blocks, config JSON,
    tables, blockquotes, TOC, and footer). Orientation ≤ 80 words. §3
    closing prose ≤ 80 words. The validator enforces the 1,500-word cap.

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

**The Holodeck for your rulebooks — rules enforced, worlds remembered.**

Start with the [project wiki](https://git.gay/flukeatzerocool/Holonovel/wiki) —
it routes players, Game Masters, and builders by task.

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
- [How it works](#how-it-works) — evaluators
  - [Convert](#convert)
  - [Build](#build)
  - [Holodeck](#holodeck)
  - [Novel](#novel)
  - [Synthesis](#synthesis)
- [How it compares](#how-it-compares) — evaluators
- [License](#license) — reference

## Run a server

### Install

A fresh install is playable without a rulebook. On first start the server creates
**Torre Nosferatu**, a tutorial Novel, and opens it; set `TTRPG_STARTER_NOVEL=off`
to start with an empty world instead.

The base server runs the Holodeck. Rooms, objects, exits, and containment form a
real state graph, while scenes, NPCs, lore, and a story journal layer on top, so
narration is grounded in stored facts rather than prior chat turns. Requires
Node.js 24+.

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

Setup details and first-run checks: [Getting Started
guide](https://git.gay/flukeatzerocool/Holonovel/wiki/Getting-Started).

### Install a ruleset

A ruleset package is a declarative bundle produced by the Build workflow. Copy it
into the server's ruleset install directory and the server registers it. That
directory is inside the state directory — by default a per-user data location
outside the project tree, or `.holonovel-state/` when the server runs inside one.

Packages load lazily: a ruleset's tools and index are read only when you open a
campaign bound to it, so unused packages cost nothing at startup. Install,
remove, and list packages from the server's own tools, or move files and restart.

Campaign data and installed packages stay in the state directory, outside the
server tree, so updating Holonovel leaves both intact. The [Building a Server
guide](https://git.gay/flukeatzerocool/Holonovel/wiki/Building-a-Server) covers
packaging a rulebook.

## How it works

Holonovel is one pipeline — Convert, Build, Holodeck, Novel, Synthesis — that
turns a rulebook into a running table.

### Convert

Convert takes PDFs, HTML, and web scrapes and turns them into clean Markdown.
Multi-column pages are read in the right order, and tables split across page
breaks are reassembled. Scanned pages fall back to OCR. The output is
structurally sound — headings resolve and references trace.

> "Convert the files in `ruleset/dnd5e/` to Markdown for the D&D 5e ruleset."
> "Convert the HTML export in `ruleset/starfinder/` for the Starfinder ruleset."

Clean, indexed Markdown ready for the build.

### Build

Build reads that Markdown and extracts the mechanics. Dice procedures, combat
systems, spell catalogues, equipment tables, condition tracks — modeled elements
become tools, resources, or prompts in a declarative ruleset package, while
anything that can't be modeled stays searchable. Guidance prose becomes narrative
material. The discovery engine reads the source in chunks, measures extraction
confidence, and works until the mechanical sections are accounted for. Nothing is
fabricated to fill a gap.

> "Build the Markdown in `ruleset/dnd5e/` into a holonovel."
> "Package `ruleset/starfinder/` as a second ruleset alongside D&D 5e."

One spec reads any rulebook, and the build produces zero hand-written code.

### Holodeck

The Holodeck is the narrative world model — the core engine that drives the
simulation. It turns a saved Novel into a running game. Every part of a campaign
is structured state: rooms, objects, exits, and containment in the spatial
model; scenes, NPCs, lore, factions, secrets, vows, countdowns, relationships,
decisions, and the story journal in the narrative model; mechanics and ruleset
voice alongside them. None is decoration. Each has a defined effect on the
others.

That effect is what makes it an engine. A scene sets the place and cast and
activates lore whose triggers match its text. An NPC carries identity,
disposition, relationships, and a location, so moving them changes who is
present and who can speak. A secret stays hidden until knowledge and trigger
conditions allow it to surface. A vow creates a decision the Game Master
must honor. A countdown advances on schedule and fires its result into the world.
A mechanical outcome — damage, a destroyed object, a doused light — mutates the
state it touches. The story journal records the consequence, and later scenes can
recall it.

The server evaluates these couplings. The AI narrates the result. Nothing is left
to a "remember this" instruction, and nothing drifts between turns.

Parser commands act on the spatial model with real containment logic. Go north.
Take the lantern. The room, the object, and the inventory are stored records, not
claims in narration. Exits connect in both directions, containers hold what they
hold, and doors stay locked until something unlocks them. The spatial conventions
are drawn from Inform, the interactive-fiction language behind decades of
text-adventure classics.

> "Go north into the flooded ossuary."
> "Set the scene here — the ossuary reeks of stale incense and old water."
> "Have Sister Mora follow me into the ossuary."
> "Ask Sister Mora what she knows about the buried order."
> "Advance the reliquary countdown by one day."

The Holodeck is the live simulation; the Novel is its save file.

### Novel

A Novel is the save file for a Holodeck game, and it stores the configuration
that shapes that game. Server settings supply defaults; each Novel overrides them
where the setting is campaign-scoped, and every change is saved with the
campaign.

Who plays is configurable. A badge sets your seat at the table and what that seat
can see: Player is in the story as a character, Game Master sees and controls the
world, Observer watches while the AI runs both roles, and Editor steps outside
the story to manage the save. The server enforces the boundary, so GM-only
secrets do not leak to the Player badge. Each Novel carries its own active badge,
and four autonomy sliders decide how much the AI handles alongside it: level
(auto-play, prompt on mechanical actions, or manual), confirmation (execute,
confirm, or prompt), safety (safe, moderate, or hardcore), and creativity
(predictable, standard, or chaotic). The sliders compose with any badge, so a
human can hand off one character, all NPCs, or the whole table without changing
seats. The [Game Mastering
guide](https://git.gay/flukeatzerocool/Holonovel/wiki/Game-Mastering) covers
running the world from the opposite side.

How the story behaves is configurable. Player signals set pace, difficulty, tone,
focus, and boundaries. A narrative directive tunes pacing, autonomy, world
reactivity, and synthesis in plain language; matching keywords take effect
mechanically, and anything else becomes guidance for the narrator. Behavioral
settings cover whether the world reacts, whether NPCs and factions pursue goals
on their own, when synthesis refreshes, how much memory each tier retains, and
whether moments record automatically. Point of view can lock to the active
character or stay omniscient, and social scenes can use a manual, natural, list,
or pooled speaker order.

What content appears is configurable. A Novel binds to one ruleset at creation
and can add supplementary rulesets without changing that binding. The categories
used to organize available actions can be reassigned per Novel, and briefing
order, enabled action patterns, and journal detail decide which guidance
surfaces during play.

Export as JSON or Markdown. Import with merge, replace, or dry-run. Clone,
checkpoint, and roll back. A clone carries the full configuration.

> "Let the AI run all NPCs and player characters, but pause for mechanical decisions."
> "Make the game faster and darker, with harder fights."
> "Let the world react and NPCs act independently; use the rulebook's voice patterns."
> "Run synthesis whenever the scene changes."
> "Clone this Novel with its settings."

Every Novel-scoped setting is saved with the Novel, so a clone or checkpoint
preserves the exact game you configured.

### Synthesis

Synthesis deepens the Holodeck beyond mechanics. Ruleset Wisdom comes from the
rulebook and any vendor package during Build — voice examples from example-of-play dialogue, lore
templates from setting descriptions, action patterns from resolution sequences,
and narrative voice profiles from inspirational media citations. It is build
output, active by default, and survives every rebuild and synthesis reversion.

The Synthesis run adds two layers on demand. External research collects
web-sourced GM advice, actual-play breakdowns, and designer notes, tagged with
source URLs, confidence scores, and freshness timestamps. Internal synthesis
reads the Novel itself for patterns the table has already produced. Both are
inert by default: the Game Master activates what fits and deactivates what does
not, and that activation state is saved with the Novel. Re-running synthesis
replaces inactive items and preserves active ones. Reverting removes the
synthesis layers; Ruleset Wisdom and player-authored items persist.

Synthesis can run on demand, at the start of a session, or after a scene change.

> "Research horror one-shot pacing and actual-play examples, tagged with sources."
> "Enable the horror pacing guidance that fits this campaign."
> "Run synthesis after every scene change."

Ruleset Wisdom, synthesis layers, and player-authored items coexist in the Novel
without replacing one another.

## How it compares

| Category | What you're used to | How Holonovel differs |
|----------|---------------------|-----------------------|
| AI storytelling apps | Narrative-first apps with no rule engine — conditions drift, dice are improvised, the world is whatever the model remembers | The server holds the rules, dice, and world state; the AI narrates outcomes it cannot invent. |
| Generic LLM chat | General-purpose chat with no durable state — forgets conditions mid-combat, invents spells, drifts toward safe outcomes | Mechanics resolve deterministically, state survives restarts, and the game keeps its consequences. |
| Rules MCP servers | Server-side mechanics and durable saves, but a fixed ruleset or a single SRD seed. | Any rulebook, a containment-based world, and badge-enforced roles in one server. |

Rules engines serve one system. Storytellers improvise mechanics. Holonovel does
neither: any rulebook becomes enforced mechanics, a spatial world, and a saved
campaign. Across the TTRPG MCP servers reviewed in October 2026, no other
reviewed server combined rulebook ingestion, spatial containment, and server-side
role enforcement — for D&D 5e, Starfinder, or your own book. Questions about a
specific table's setup? See the [FAQ](https://git.gay/flukeatzerocool/Holonovel/wiki/FAQ).

## License

Canonical origin: [git.gay/flukeatzerocool/Holonovel](https://git.gay/flukeatzerocool/Holonovel).

Holonovel is MIT-licensed. Built from:

- D&D 5e SRD v5.1 (CC BY 4.0 + OGL 1.0a, Wizards of the Coast)
- Graham Nelson's Inform (Artistic License 2.0, Graham Nelson)
- if-craft-corpus (CC BY 4.0, pvliesdonk)
- dmcp (MIT, Shawn Rushefsky)
- lonelog (CC BY-SA 4.0, zeruhur)
- BitD SRD (CC BY 3.0, John Harper)
- Ironsworn: Starforged SRD (CC BY 4.0, Shawn Tomkin)
- Sly Flourish Lazy GM Resource Document (CC BY 4.0, Mike Shea)
- The Alexandrian (CC BY 4.0, Justin Alexander)
- Dungeon World SRD (CC BY 3.0, Sage LaTorra, Adam Koebel)
- Fate SRD (CC BY 3.0, Evil Hat Productions)
- Ironsworn SRD (CC BY 4.0, Shawn Tomkin)

[RSS](https://git.gay/flukeatzerocool/Holonovel.rss). Last updated: <!-- @spec:date -->2026-10-25.
