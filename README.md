# Holonovel

Turn your RPG rulebooks into an AI Game Master.

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

- **Rules-aware dice.** The server knows which modifier goes where.
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

- **Two ways to play.** Player mode — the AI acts as your Game
  Master, narrating and rolling while keeping secrets secret, and
  respects your agency: it describes the world without making
  decisions for you. Game Master mode — full access, full control,
  every tool at your command. Switch personas anytime with
  `set_persona` — no restart needed.

- **Any format in.** Markdown files, PDF rulebooks, HTML source, or
  scraped web SRDs from permissively-licensed games. A built-in
  catalog of ten open-license systems (D&D 3.5/5e, Pathfinder 1e/2e,
  Starfinder, Traveller, FATE, Blades in the Dark, Dungeon World,
  Old-School Essentials) gets you started fast.

- **Self-contained.** The finished server bundles a copy of your
  ruleset inside itself. No external file paths, no dangling
  dependencies — move it anywhere and it still works.

Pick a game. Feed it to an AI. Start playing.

## Who is this for?

**Solo RPG players.** You run entire parties by yourself. You need rules
that don't drift, dice you can trust, and state that survives between
sessions. You use SillyTavern, OpenRouter, or a local LLM as your
narrator — Holonovel is the rules engine that keeps it honest.

**AI roleplay enthusiasts.** You've spent hours tuning character cards,
lorebooks, and system prompts. Your narrator still forgets the rules
mid-combat and invents mechanics that don't exist. Holonovel is the
lorebook for rules — it can't forget, can't invent, and cites its
sources.

**Players who want less bookkeeping.** Dice automation, character
tracking, condition management, countdowns, session recaps — the
server handles it so you focus on the story. Two play modes: Player
mode lets the AI narrate and adjudicate while you act; Game Master
mode gives you full control.

**Developers.** Skip the integration work. Feed the spec your rulebooks
and an AI agent builds the MCP server. Dice, combat, character
sheets, monster lookups, NPCs, scene tracking — 35+ requirements
verified against a golden transcript.

## How it works

Holonovel runs as independently selectable jobs. Pick one or more jobs —
the AI asks only the questions those jobs need, then gets to work.

### Convert: Prepare your rulebooks

Feed the AI PDF rulebooks, HTML files, or web SRD URLs. It converts them
to clean, machine-readable Markdown — reassembling tables across page
breaks, stripping page furniture, and flagging structural problems. This
job runs standalone: you get converted Markdown files and stop there.
Come back and run Build when you're ready.

### Build: Build the game server

This is the core. Feed the AI your Markdown ruleset and it builds a
complete MCP game server from scratch. Dice rolling, combat tracking,
character management, monster and spell lookups, random tables, and
more — every mechanic traced back to your actual books with a citation.
The server always includes a working character sheet tool, inferred
directly from the rules. Before handing off, the AI runs a full test
suite, three ruleset-facing verification gates (structural integrity, MCP
conformance, derived tests), and an Operational Confidence Exercise —
end-to-end scenarios including AI-simulated combat — to prove the build
is sound. Two fixture gates verify the builder against a known-correct
specification once per implementation, not per ruleset. If your source needs conversion first, run the Convert
job.

### Enrich: Community advice (optional)

The AI searches the web for game-specific tips — GM advice, player
strategy guides, actual-play breakdowns, designer commentary — and
adds them to the server's persona knowledge. Your AI Game Master now
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

## Wait, what's an MCP server?

MCP (Model Context Protocol) is how AI apps use external tools. Think of it
like a USB port for AI — your chat app (Claude Desktop, Opencode, Cursor,
or any MCP-compatible client) plugs into Holonovel, and suddenly it can
roll dice, look up rules, and track combat. You don't run the server
yourself. Your chat app does, automatically, every time you start a
conversation.

To use it you need three things: your rulebooks, an MCP-compatible AI
client, and Node.js.

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

Don't have any ruleset? Start with the spec's built-in Tin Lanterns
fixture — a tiny playable game included in the spec that lets you test
the whole pipeline in under a minute.

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
Anthropic, OpenRouter, DeepSeek) or a local model. Building a server
for D&D 2024 cost about US $2 with DeepSeek v4 Pro (pricing varies — check
current rates).

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
   want. No ruleset at all? The spec includes Tin Lanterns, a tiny
   playable game, so you can test the pipeline in under a minute.

4. **Open your AI client and feed it the spec.** Use a prompt like:

   > Use holonovel.md to build a server from `players-handbook.md`.

   The agent reads the spec and your rules, asks which jobs to run
   (Convert, Build, and optionally Enrich or Sheet), then builds
   everything automatically. It pauses between jobs so you can review
   progress. Default answers work for most setups.

5. **Start playing.** When the Build job finishes, the agent connects the
   server to your MCP client and verifies the handshake. Open a fresh
   conversation and the server is ready. Say hello and the AI Game
   Master answers.

### For spec contributors

If you're editing the spec itself (not building a server), validate your
changes:

```sh
npm install && npm run check
```

## Project status

Holonovel is in active development.

Most build specifications prescribe every detail in advance — output
formats, tool names, architecture decisions. Holonovel takes the opposite
approach: it defines a convergence loop. After each build stage, the AI
measures quality against objective thresholds, improves the work, and
re-verifies — up to three iterations per activity. Adversarial subagents
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

## Validating (spec contributors)

If you're editing the specification itself, validate your changes:

```sh
npm run check
```

This runs:

- `npm run lint` — style checks via
  [markdownlint](https://github.com/DavidAnson/markdownlint)
- `npm run validate` — cross-reference checker (REQ citations, test IDs, TOC
  sync, heading separators, requirement block shape)

Also available separately:

- `npm run typecheck` — TypeScript type checking (`npx tsc --noEmit`)

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
├── .markdownlint.json     ← lint rules
├── package.json           ← npm scripts (lint, validate, typecheck, check)
├── scripts/
│   └── validate.ts        ← cross-reference checker
├── tsconfig.json           ← TypeScript configuration
├── .githooks/
│   └── pre-commit          ← pre-commit hook
├── .gitignore
├── CHANGELOG.md
├── LICENSE
└── README.md              ← this file
```

## Contributing

- Commit messages use date-stamped headings with bulleted entries
  (see the CHANGELOG for examples). Push to `main`.
- Prose wraps near 110 columns (enforced at 120 by markdownlint).
  ATX headings only (`##`, `###`). Separate top-level sections
  with `---`.
- Run `npm run check` before committing.
- Fork, branch from `main`, make your changes, open a pull request.

## License

MIT — see [LICENSE](./LICENSE) for details.
