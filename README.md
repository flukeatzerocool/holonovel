<!--
README DESIGN:
  Voice: punchy, hype-forward. Direct address ("you").
  Demo: natural-language prompts ("Load the adventure."), never tool
    names (`load_adventure`). Show the reader how they'd talk to the
    server — the AI maps intent to tools.
  Structure: Hero → Try it (D&D 5e) → Playing a Novel → Build your
    own → Extend → Compare → Get started → Contribute → Footer.
  Audience split: §2 is for players who want the sample server now.
    §3 is the universal play experience (shared by both audiences).
    §4 is for builders bringing their own rulebooks. §8 is for spec
    contributors.
  No repetition. No feature lists. One excitement vector per section.
-->

# Holonovel

Turn your RPG rulebooks into an AI Game Master.

**One spec. Any game. Zero code.**

Every time you pause to look up a spell, track initiative on scratch
paper, or flip pages for a saving throw, the story loses momentum.
Tabletop RPGs are at their best when the rules fade into the background
— but managing them takes work.

Holonovel closes that gap. Feed your rulebooks — Markdown, PDF, HTML,
or a scraped SRD — to an AI agent. It reads every mechanic, extracts
every table, and builds you a complete MCP game server. Your books
become interactive. The AI runs the rules. You run the story.

## Try it now — D&D 5e

This repo ships a pre-built D&D 5e SRD v5.1 server: 23 tools, 1,029
indexed ruleset sections. Ten seconds to your first AI Game Master.

```sh
cd dnd5e
npm install
npm run build
```

Add this to your MCP client's config (Opencode:
`~/.config/opencode/opencode.json`):

```json
"dnd5e-holonovel": {
  "type": "local",
  "command": ["node", "<path>/dnd5e/dist/index.js"],
  "environment": {
    "TTRPG_NOVEL": "default",
    "TTRPG_DATA_DIR": "<path>/dnd5e/.holonovel-state",
    "TTRPG_RULESET_DIR": "<path>/dnd5e/ruleset"
  },
  "enabled": true
}
```

SRD data: CC BY 4.0 + OGL 1.0a (Wizards of the Coast). Server code:
MIT.

## Playing a Novel

The Novel is your game — a named, persistent save file. Everything
lives in one file on disk: your party, every NPC you've met, the scene,
countdowns, lore, combat state, the audit log. Restart the server.
Rebuild it. Your Novel is right where you left it.

You don't call tools. You say what you want.

> "Start a new game called the Dragon Tomb."

One sentence. The server shows you what's available — import characters,
load an adventure module, generate one from a premise, or build your own
from scene and NPC tools. You drive. The server recommends a path.

> "Here's my party. Set the scene: a flooded ossuary. The air is thick
> with old incense and something darker."

> "When anyone mentions the ossuary, remind me: the drowned priests
> still pray down here."

> "Export all my lore. Save it — I'll use this world again."

> "The ritual completes in five rounds. Start the countdown."

> "An acolyte named Sister Mora steps out of the shadows. She's
> terrified, not hostile."

Setup is a freeform toolkit. Scenes, NPCs, countdowns, lore — you add
what you need, when you need it.

> "Take over as Game Master. I'm ready."

The AI narrates. It adjudicates. It keeps GM-only secrets hidden from
you — persona gating is enforced server-side. You act, you roll, you
drive the story forward.

> "Switch to Game Master. I need to fix something."

Jump behind the screen anytime to course-correct, add an NPC on the fly,
inject a complication, or tweak state. No restart. Never locked out.

> "Undo that."

Your characters are permanent — the roster survives every Novel. Novels
come and go. Your party remains.

> "End the game."

The save file cleans up. Start a new Novel whenever you're ready. Your
characters, your roster — still there.

## Build your own game server

You don't code, you commission. This is specification-driven development:
the spec is the permanent artifact, the implementation is disposable.
An AI agent reads your rulebooks, builds an MCP server, and fights
itself until it's right.

> "Convert my PDF to Markdown."

PDF, HTML, or web SRD — the agent reassembles tables across page breaks,
strips page furniture, and delivers clean Markdown. Stop here or keep
going.

> "Build me a game server."

The agent reads your ruleset and constructs a server around it. Dice
with ruleset-correct modifiers. Combat with initiative and conditions.
Monster, spell, and equipment lookups that cite page sources. Character
creation with leveling. Random tables. Every mechanic traced to your
books.

Then it verifies. A convergence loop measures quality, improves, and
re-verifies — up to three cycles. Six verification gates. The 19-scenario
Gauntlet — combat, stress, and persona endurance under live AI-simulated
play. A golden transcript proves the server behaves correctly against a
known fixture. A blind second AI re-runs every gate from a cold checkout.
The spec bets its reputation on reproducibility.

Output: a self-contained MCP server with your ruleset baked inside. Move
it anywhere. It's yours.

> "Add the Monster Manual to my ruleset."

**The spec doesn't retire.** Drop in a new sourcebook — the server learns
creatures it didn't know yesterday. Load an adventure module for your
next campaign. Rebuild against a newer spec — the spec defines a formal
update workflow: full comparison audit, gap plan, Gauntlet
re-verification. Point the Build job at your existing server directory
and an updated ruleset — it discovers the gap between current
implementation and the updated spec, fills it, and re-runs every
verification gate including the Gauntlet. Fixes and features land
without touching your Novels. That's spec-driven development: the spec
is your long-term investment. The server is rebuilt whenever the spec
changes. Everything you've created — characters, worlds, novels —
survives every rebuild.
Re-run Enrich to catch fresh community wisdom. Feed it a character sheet
PDF you just found — the layout
updates. You never start over. You add on.

## Extend with Enrich and Sheet

Optional. Idempotent. Never touch mechanics.

> "Search the web for Pathfinder 2e GM advice and player strategy."

The AI hunts down community wisdom — actual-play breakdowns, designer
commentary, media influences. Your GM learns how the community plays the
game, not just what the rulebook says.

> "Here's the official character sheet PDF."

The built-in sheet — already generated from the rules alone — gains the
official layout, an ASCII format for terminal play, and an HTML variant
for rich clients.

## How it compares

| Tool | What it is | Holonovel instead |
|------|-----------|-------------------|
| AI Dungeon | Freeform AI storyteller | Rules-literate. Real mechanics, no invented armor classes, no hallucinated saves. |
| rpg-mcp | D&D 5e MCP server | One ruleset vs. any ruleset. Feed it any TTRPG. |
| Raw ChatGPT / local LLM | Improvised DM, forgets rules mid-combat | Can't forget. Can't invent. Survives sessions. A lorebook for rules. |
| Consumer AI GM apps | Walled-garden subscriptions | Open-source. Local. Free. Works with any LLM through your MCP client. |

(Note: Researched on August 4, 2026.)

## Get started

1. **Node.js 20+.** `node --version`. Get it at
   [nodejs.org](https://nodejs.org).
2. **The spec.** Clone this repo or download
   [`holonovel.md`](holonovel.md) — one file, the complete specification.
3. **Your rulebooks.** Markdown, PDF, HTML, or a URL. No books handy?
   The spec includes a catalog of 10 permissively-licensed games (D&D,
   Pathfinder, Starfinder, Traveller, FATE, Blades in the Dark, Dungeon
   World, Old-School Essentials) — the agent can scrape one for you.
4. **An MCP client.** Opencode, Claude Desktop, Continue.dev, Cursor —
   anything with MCP support. The AI needs an LLM behind it (API key or
   local model). Holonovel is built and tested with DeepSeek on Opencode
   Go.
5. **Point your client at the spec.** The agent reads `holonovel.md`,
   asks what you want to build and which ruleset to use, then gets to
   work — converting, building, verifying. It pauses between jobs so you
   can review. Default answers work.

When the Build job finishes, the agent connects the server to your
client and verifies the handshake. Open a fresh conversation. Say hello.
Your AI Game Master answers.

## Contribute to the spec

```sh
npm install && npm run check
```

`markdownlint` + cross-reference validator (REQ citations, test IDs, TOC
sync, block shape).

License: MIT. [RSS](https://git.gay/flukeatzerocool/Holonovel).
