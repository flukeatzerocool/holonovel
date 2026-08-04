# Holonovel

Turn your RPG rulebooks into an AI Game Master.

**One spec. Any game. Zero code.**

## What is Holonovel?

Your rulebooks are sitting on the shelf. What if they could sit at the
table with you — rolling dice, tracking hit points, and running
monsters while you focus on the story?

That's the gap. Tabletop RPGs are more fun when the rules fade into the
background, but managing them takes work. You look up a spell
mid-combat, flip pages for a saving throw, track initiative on scratch
paper, and by the time the dice land, the moment is gone.

Holonovel closes that gap. Feed your rulebooks — Markdown, PDF, HTML,
or a scraped online SRD — to an AI agent. It reads the rules, extracts
every mechanic, and builds you a complete MCP game server. Your books
become interactive.

**What you get:**

- **Rules-aware dice — the AI game master's calculator.** The server
  knows which modifier goes where.
  Roll an attack, cast a spell, make a saving throw — the right dice,
  the right bonuses, every time.

- **Live combat tracking.** Initiative order, hit points, conditions,
  and turn-by-turn resolution. The server keeps the bookkeeping so you
  keep the momentum.

- **Smart lookups.** Ask for a monster by name, a spell by effect, a
  weapon by damage type — in natural language. The server knows your
  rulebooks.

- **Character sheets with leveling.** Create characters, level them up,
  and render their sheets. The server builds one from your rules even
  if you don't have a PDF. Give it an official sheet and it matches
  the layout.

- **Two personas for play — unrestricted access for setup.** Build
  characters, load adventures, and prep your game with every tool
  unlocked. When you're ready to play, activate Player persona via
  `set_persona` — the AI narrates and adjudicates, keeping secrets
  secret while you act. Switch to Game Master anytime for full
  control. No restart needed.

- **Any format in.** Markdown, PDF, HTML, or scraped SRDs. A catalog
  of ten permissively-licensed TTRPG systems (D&D 3.5/5e, Pathfinder
  1e/2e, Starfinder, Traveller, FATE, Blades in the Dark, Dungeon World,
  Old-School Essentials) gets your AI dungeon master started fast.

- **Self-contained MCP game server.** The finished server bundles a
  copy of your ruleset inside itself. No external file paths, no
  dangling dependencies — move it anywhere and it still works.

Pick a game. Feed it to an AI. Start playing.

## What's an MCP server?

MCP (Model Context Protocol) is how AI apps use external tools. Think of it
like a USB port for AI — your chat app (Claude Desktop, Opencode, Cursor,
or any MCP-compatible client) plugs into Holonovel, and suddenly it can
roll dice, look up rules, and track combat. You don't run the server
yourself. Your chat app does, automatically, every time you start a
conversation.

To use it you need three things: your rulebooks, an MCP-compatible AI
client, and Node.js.

## Who is this for?

**Solo RPG players.** You run entire parties by yourself. You need rules
that don't drift, dice you can trust, and state that survives between
sessions. You use an AI RP client (such as SillyTavern) or a local LLM
as your narrator — Holonovel is the solo RPG rules engine that keeps it
honest.

**AI roleplay enthusiasts.** You've spent hours tuning character cards,
lorebooks, and system prompts. Your narrator still forgets the rules
mid-combat and invents mechanics that don't exist. Holonovel is the
lorebook for rules — it can't forget, can't invent, and cites its
sources.

**Players who want less bookkeeping.** Dice automation, character
tracking, condition management, countdowns, session recaps — the
server handles it so you focus on the story. Start with everything unlocked
for setup. Activate Player persona when you want the AI to narrate
and adjudicate; switch to Game Master anytime for full control.

**Developers.** Skip the integration work. Feed the spec your rulebooks
and an AI agent builds the MCP server. Dice, combat, character
sheets, monster lookups, NPCs, scene tracking — 35+ requirements
verified against a golden transcript.

## How Holonovel Compares

The RPG MCP niche has roughly seven known projects.
Holonovel is the only one that's a factory, not a fixed product. Here's how it stacks up. (Researched on August 4, 2026.)

**vs. AI Dungeon.** AI Dungeon is freeform fiction — great for improvised
stories, but it doesn't enforce real tabletop rules. Holonovel extracts
actual mechanics from your rulebooks, validates every action against them,
and cites its sources. No invented armor classes. No hallucinated saving
throws.

**vs. rpg-mcp.** A well-tested D&D 5e server — if you play that one system
and that one system only, it's the most feature-complete option. Holonovel
builds servers for any ruleset you feed it: D&D, Pathfinder, Call of
Cthulhu, Mothership, your homebrew. One spec, any game.

**vs. ChatGPT as a Dungeon Master.** An LLM running solo forgets the rules
mid-combat, invents mechanics that don't exist, and can't track state
between sessions. Holonovel is the lorebook for rules — it can't forget,
can't invent, and survives restarts with full game state intact.

**vs. Consumer AI GM platforms.** LoreKeeper, Friends & Fables, and
similar tools are polished experiences — and walled gardens. They run their
own AI, charge subscriptions, and don't integrate with other tools.
Holonovel is open-source, works with any LLM (via your MCP client), deploys
locally, and costs nothing.

**The difference in one sentence:** Other tools give you a game.
Holonovel gives you the rules engine — and you bring the narrator.

## How it works

Holonovel runs as independently selectable jobs. Pick one or more jobs —
the AI asks only the questions those jobs need, then gets to work.

### Convert: Prepare your rulebooks

Feed the AI any game materials — core rulebooks, supplemental books,
character sheets, adventure modules, PDFs, HTML files, or web SRD URLs.
It converts them to clean, machine-readable Markdown — reassembling tables across page
breaks, stripping page furniture, and flagging structural problems. This
job runs standalone: you get converted Markdown files and stop there.
Come back and run Build when you're ready.

### Build: Build the game server

This is the core. Feed the AI any game materials — core rulebooks,
supplemental books, character sheets, and adventure modules — and it
builds a complete MCP game server from scratch. Adventures are
discovered within your provided files automatically. Dice rolling, combat tracking,
character management, monster and spell lookups, random tables, and
more — every mechanic traced back to your actual books with a citation.
The server always includes a working character sheet tool, inferred
directly from the rules. Before handing off, the AI runs a full test
suite, three ruleset-facing verification gates (structural integrity, MCP
conformance, derived tests), and a 15-scenario Operational Confidence
Exercise — simulated combat, state survival, stress testing, and persona
boundary enforcement — to prove the build is sound. Two fixture gates verify the builder against a known-correct
specification once per implementation, not per ruleset. If your source needs conversion first, run the Convert
job.

### Enrich: Community advice (optional)

The AI searches the web for game-specific tips — GM advice, player
strategy guides, actual-play breakdowns, designer commentary, and
media influences (movies, TV, video games) — and adds them to the
server's knowledge. Your AI Game Master now
knows not just the rules, but how the community plays the game. Run
this job against an existing build anytime.

### Sheet: Character sheet (optional)

The AI studies your game's official character sheet from a PDF you
provide and enhances the built-in sheet tool with the official layout,
an ASCII format for terminal play, and an optional HTML display for MCP
App hosts. The Build job already gives you a working sheet from the
rules alone — this job adds polish. Run it against an existing build
anytime.

### Between jobs

By default, the AI pauses after each job to report what it built and
ask whether to continue. During setup you can choose to skip pauses and
run jobs back-to-back. The builder also asks whether to connect the
finished server to your MCP client — if you say yes, it writes the config
entry and verifies the handshake so your server is ready immediately.
A server that finishes the Build job is fully
functional — the rest is enhancement.

## Sample MCP Server

This repo includes a pre-built D&D 5e SRD v5.1 MCP server —
23 tools, 1,029 indexed ruleset sections, playable immediately.

### Quick install

```sh
cd dnd5e
npm install
npm run build
```

### Connect to your client

Add to your MCP client's config. For Opencode
(`~/.config/opencode/opencode.json`):

```json
"dnd5e-holonovel": {
  "type": "local",
  "command": ["node", "<path-to-repo>/dnd5e/dist/index.js"],
  "environment": {
    "TTRPG_GAME_ID": "default",
    "TTRPG_DATA_DIR": "<path-to-repo>/dnd5e/.holonovel-state",
    "TTRPG_SEED": "dnd5e-default",
    "TTRPG_RULESET_DIR": "<path-to-repo>/dnd5e/ruleset"
  },
  "enabled": true
}
```

Replace `<path-to-repo>` with the directory where you cloned this repo.

### SRD License

The SRD data in `dnd5e/ruleset/` is CC BY 4.0 + OGL 1.0a by
Wizards of the Coast. The server code in `dnd5e/src/` is MIT.
See `dnd5e/LICENSE.md` for details. You may freely distribute
this server — the ruleset data is permissively licensed.

## Prerequisites

### Your rulebooks

The rules for whatever game you want to play. Pick one format:

- **Markdown files** — ideal. If your game has an SRD available as `.md`
  files, use those. If you've already converted a PDF with the Convert
  job, the Markdown output goes here.
- **A PDF rulebook** — the agent converts it for you using the Convert
  job. Vision-capable models (GPT-4o, Claude 3.5 Sonnet, Gemini 2.5 Pro)
  handle this best.
- **A web SRD** — point the agent at a URL. The spec includes a catalog
  of 10 permissively-licensed games (D&D 3.5/5e, Pathfinder 1e/2e,
  Starfinder, Traveller, FATE, Blades in the Dark, Dungeon World,
   Old-School Essentials) — pick one or suggest your own.

### An MCP-compatible AI client

This is the app where you chat with the AI. It needs to support the
MCP protocol so it can connect to Holonovel's server. Compatible clients
include:

- **Opencode** — open-source terminal client with built-in MCP support.
  Free. Works with any LLM API.
- **Claude Desktop** — Anthropic's desktop app. Free, requires an
  Anthropic API key or Pro subscription.
- **Continue.dev** — open-source AI plugin for VS Code and JetBrains.
- **Cursor** and **Windsurf** — AI-powered code editors with MCP support.

Any MCP-compatible client works. If your client supports MCP tools, it
can use Holonovel.

Each client needs an LLM behind it — either an API key (OpenAI,
Anthropic, OpenRouter, DeepSeek) or a local model. Holonovel is built
and tested with DeepSeek on Opencode Go.

### Node.js 20 or later

Download from [nodejs.org](https://nodejs.org). npm (the Node.js package
manager) comes bundled.

Verify your installation:

```sh
node --version   # should print v20.x, v22.x, or later
npm --version    # should print 10.x or later
```

Node.js is used by the spec's validation tooling (markdownlint,
TypeScript type checking). If you're only building a server and not
editing the spec, you can skip installing npm dependencies — the agent
handles that part.

## Quick Start

1. **Install Node.js 20+** ([nodejs.org](https://nodejs.org)). Verify it
   worked:

   ```sh
   node --version
   ```

2. **Get the spec.** Clone this repo or download
   [`holonovel.md`](holonovel.md) — it's a single file containing the
   complete build specification. Everything you need is in that one
   document.

3. **Prepare your rules.** Put your ruleset files (`.md`, PDF, or a URL)
   alongside `holonovel.md`. If you don't have a ruleset yet, the agent
   can scrape one from the built-in catalog of 10 open-license games
   (D&D, Pathfinder, Starfinder, Traveller, FATE, Blades in the Dark,
   Dungeon World, Old-School Essentials) — just tell it which game you
    want.

4. **Open your AI client and give it the spec.** Use a prompt like:

   > Read holonovel.md

   The agent reads the spec, then asks what you want to build and which
   ruleset to use. It handles the rest — converting PDFs, building the
   server, and optionally enriching with community advice or adding a
   character sheet. It pauses between jobs so you can review progress.
   Default answers work for most setups.

5. **Start playing.** When the Build job finishes, the agent connects the
   server to your MCP client and verifies the handshake. Open a fresh
   conversation and the server is ready. Say hello and the AI Game
   Master answers.

### Validating (spec contributors)

If you're editing the specification itself, validate your changes:

```sh
npm install && npm run check
```

This runs:

- `npm run lint` — style checks via
  [markdownlint](https://github.com/DavidAnson/markdownlint)
- `npm run validate` — cross-reference checker (REQ citations, test IDs, TOC
  sync, heading separators, requirement block shape)

Also available separately:

- `npm run typecheck` — TypeScript type checking (`npx tsc --noEmit`)

## Project status

Holonovel is in active development.

Most build specifications prescribe every detail in advance — output
formats, tool names, architecture decisions. Holonovel takes the opposite
approach: it defines a convergence loop. After each build stage, the AI
measures quality against objective thresholds, improves the work, and
re-verifies — up to three attempts per activity. Adversarial subagents
audit every checkpoint with fresh context. A golden transcript replay
proves the server behaves correctly against a known fixture. This loop is
the quality engine. It means the specification can stay lean — it states
what the server must do, not how to build it. The loops close the gaps.

Holonovel just leveled up. It now thinks like the community it serves — you're
the player, the AI is your Game Master, and you can always jump in to course-correct
when the narrator drifts off-script. Instead of leaving your AI to improvise or keep
everything in context alone, Holonovel hands it a full tabletop toolkit: it knows
who's in every scene, it tracks deadlines and timers, it remembers every NPC you meet
by name and disposition, it recaps what happened between sessions, and it loads whole
adventure books as indexed, searchable reference so your narrator never invents a rule
or forgets a room. It's a lorebook for rules, delivered as an MCP server — keeping
your GM honest, creative, and on-world.

## Project structure

```
Holonovel/
├── holonovel.md                ← the complete build specification
│                                 (§1–5 mission, requirements, failure
│                                 modes, standing rules; §6 build process;
│                                 §7 runtime conventions; §8 verification
│                                 gates; §9 handoff; §10 independent
│                                 verification; §11 optional jobs;
│                                 appendices A–I)
├── dnd5e/                       ← pre-built D&D 5e SRD v5.1 MCP server
├── .markdownlint.json          ← lint rules
├── package.json                ← npm scripts (lint, validate, typecheck, check)
├── scripts/
│   └── validate.ts             ← cross-reference checker
├── tsconfig.json               ← TypeScript configuration
├── .githooks/
│   └── pre-commit              ← pre-commit hook
├── .gitignore
├── CHANGELOG.md
├── LICENSE
└── README.md                   ← this file
```

## Stay Updated

Subscribe to the [RSS feed](https://git.gay/flukeairwalker/Holonovel.rss)
for changelog updates as they land.

## License

MIT — see [LICENSE](./LICENSE) for details.
