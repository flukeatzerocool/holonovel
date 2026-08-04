# Holonovel

Turn your RPG rulebooks into an AI game master.

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

- **Two ways to play.** Player mode — the AI acts as your game
  master, narrating and rolling while keeping secrets secret. Game
  master mode — full access, full control, every tool at your
  command.

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

You. You've got tabletop RPG books and an AI agent. You want the
rules at your fingertips without wiring up tools by hand. Players
who want dice automation and character tracking. Game masters who
want combat management and instant monster lookups. Developers who
want to skip the integration work and let AI build the bridge.

## How it works

The build runs in four phases. At the start of each phase, the AI
asks a few questions about your preferences — so it builds what you
want, not what it assumes. At the end of each phase, it pauses to
report what it built and asks whether you want to continue.

### Phase 1: Prepare your rulebooks

The AI reads your source files and formats them so every rule is
machine-readable. It checks for common problems — missing table
headers, ambiguous headings, broken links, missing referee markers —
and fixes them automatically. Before any code touches the rules, you
get a preview and can approve or ask for adjustments.

### Phase 2: Build the game server

This is the core. The AI reads your formatted ruleset and builds a
complete MCP game server from scratch. Dice rolling, combat tracking,
character management, monster and spell lookups, random tables, and
more — every mechanic traced back to your actual books with a
citation. The server always includes a working character sheet tool,
inferred directly from the rules. Before moving on, the AI runs a
full test suite and verification pipeline against a known ruleset to
prove the build is sound.

### Phase 3: Enrich with community advice (optional)

The AI searches the web for game-specific tips — GM advice, player
strategy guides, actual-play breakdowns, designer commentary — and
adds them to the server's persona knowledge. Your AI game master now
knows not just the rules, but how the community plays the game. Skip
it if you prefer a lean server or already know your system inside
out.

### Phase 4: Add a character sheet (optional)

The AI studies your game's official character sheet from a PDF you
provide and enhances the built-in sheet tool with the official
layout, an ASCII format for terminal play, and an optional HTML
display for MCP App hosts. If you don't have a PDF, the Phase 2
baseline already gives you a working sheet from the rules alone —
this phase adds polish.

### Between phases

The AI reports what it built, what it verified, and any issues it
found. You decide: continue to the next phase, or stop here. A
server that finishes Phase 2 is fully functional — the rest is
enhancement.

## Prerequisites

- **Node.js 20+** — runs the spec's validation tooling
  (markdownlint, TypeScript type checking, cross-reference
  validation).
- **An AI agent** — reads the spec and builds the server. We
  recommend DeepSeek Pro or an equivalent model. Building a
  server for D&D 2024 cost about US $2 with DeepSeek v4 Pro.
  We use Opencode Go for DeepSeek access.

## Quick Start

1. Clone this repo or download [`holonovel.md`](holonovel.md).
2. Choose your ruleset source:
   - **Markdown:** place your `.md` files alongside `holonovel.md` and feed
     them to the agent.
   - **PDF/HTML:** point the agent at the source files; it converts them to
     Markdown first using built-in conversion tools.
   - **Web SRD:** ask the agent to scrape a permissively-licensed game. It
     presents a catalog of ten games (D&D 3.5/5e, Pathfinder 1e/2e, Starfinder,
     Traveller, FATE, Blades in the Dark, Dungeon World, Old-School Essentials)
     or you can suggest your own URL. The spec verifies the license before
     scraping.
3. Feed the spec and your ruleset to an AI agent:

   > Use holonovel.md to build a server from `players-handbook.md`.

4. The agent guides you through four build phases — preparing the rules,
   building the server, and optionally enriching it with community advice and a
   character sheet tool. It pauses between each phase so you can review progress
   and decide whether to continue. A hard-stop review gate asks you to confirm
   the prepared ruleset before any server code is written.
5. (Optional) Validate the spec itself:

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

## Validating

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
│                                 verification; §11 optional phases;
│                                 appendices A–G, T, I)
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
