<!--
README DESIGN:
  Voice: punchy, hype-forward. Direct address ("you").
  Demo: natural-language prompts ("Load the adventure."), never tool
    names (`load_adventure`). Show the reader how they'd talk to the
    server — the AI maps intent to tools.
  Structure: Hero → Try it → Server features → Spec features →
    Compare → Contribute → Footer.
  Audience split: §2 is for players who want the sample server now.
    §3 is the universal play experience. §4 is for builders bringing
    their own rulebooks. §6 is for spec contributors.
  No tables for feature descriptions. No repetition. One story vector per section.
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

## MCP server

Your books become the referee. You run the table.

### Novel

> "Start a new game called the Dragon Tomb."
> "Switch to my other campaign."

Your game lives in one file on disk — party, NPCs, scenes, lore,
combat state, everything. Restart the server. Rebuild it. Your Novel
is right where you left it. Multiple campaigns coexist without leaks.
Export and import with merge, replace, or dry-run modes. No cloud. No
sync. One local file — copy it, back it up, share it.

### Character

> "Create a character."
> "Import my fighter from the roster."

Your characters are permanent. The roster survives every campaign and
rebuild — create once, play forever. Build step by step with guided
decisions, or in a single call. Switch characters between games.
Advancement follows the ruleset's own progression tables. Sheet in
markdown or ASCII.

### Persona

> "Take over as Game Master. I'm ready."
> "Switch to Game Master. I need to fix something."

Two enforced roles, switched without restart. The AI narrates and
adjudicates as GM. Switch to player and GM secrets vanish — persona
gating is enforced server-side. You're never locked out of your own
game. Jump behind the screen mid-session to tweak state, inject a
complication, or add an NPC on the fly.

### Combat

> "Roll initiative. The goblins ambush from the treeline."

You don't track initiative, conditions, or HP — the AI does, by the
book. Bleeding stops when the rules say it does. Paralysis expires on
schedule. Combat state survives server restarts. Undo bad rolls. You
focus on tactics.

### Dice

> "Make a Dexterity save to dodge the trap."
> "Attack the ogre with my longsword."

Every roll shows its work — the die faces, the modifiers, the target.
Advantage flips two dice. Critical hits double damage. Seedable RNG
makes every roll reproducible. Dispute an outcome, replay it, get the
same result. The AI narrates. The dice decide.

### Narrative Management

> "Set the scene: a flooded ossuary. The air is thick with old
> incense."
> "When anyone mentions the ossuary, remind me: the drowned priests
> still pray down here."
> "The ritual completes in five rounds. Start the countdown."
> "An acolyte named Sister Mora steps out of the shadows. She's
> terrified, not hostile."

You build the world once. The AI remembers. Set scenes. Create NPCs
with personality, disposition, and voice examples. Lore entries fire
when keywords match the unfolding story. Countdowns escalate tension
on cue. Standing GM directives shape every response.

### Adventures & Encounters

> "Generate an adventure: a heist at the wizard's auction."
> "Create an encounter: the party enters the flooded crypt."

One sentence becomes a campaign scaffold — scenes, NPCs, hooks.
Generate the whole outline, or build encounters one at a time as
single undoable steps. Load adventure modules from Markdown files.

### Rules Access

> "Look up Fireball."
> "Search the rules for grappling."

Name it, get the rule. Every result cites a source page. Full-text
search across the indexed ruleset. Look up spells, monsters,
equipment, and classes by name and documented alias. The AI never
invents a rule — it reads your books.

### State & Recovery

> "Undo that."
> "Recap the session."
> "Export the entire campaign."

Every mutation is a snapshot. Undo reverts the last step. Session
recaps summarize play. Checksums detect corruption before you'd
notice. Export your campaign as a single file. Import back with merge,
replace, or dry-run. Nothing is permanent unless you want it to be.

## The specification

Your books become a server. The spec becomes your toolchain.
Everything you build survives every rebuild.

### Convert

> "Convert my PDF to Markdown."

This is the hardest step — and the spec handles it. PDF, HTML, or web
scrape → clean, well-structured Markdown. Tables reassembled across
page breaks. Adornments stripped. Structure validated. Conversion
fidelity tracked at 90% minimum. After clean Markdown, the rest is
automatic.

### Build

> "Build me a game server."

No hallucinated spells. No invented armor classes. Discovery reads
every mechanic, table, entity, and procedure from your books in
chunks. Construction assembles a complete MCP server in six
dependency-ordered steps. A convergence loop measures six quality
metrics and iterates until every threshold is met. A second model
cross-audits the first — catching defects a single model would miss.
Your rules make it in.

### Enrich

> "Search the web for Pathfinder 2e GM advice."

Optional. Additive. Never touches mechanics. Web research across
community forums, actual-play breakdowns, designer notes, and media
influences. Produces voice examples, lore templates, action suggestion
patterns, and adventure advice — all tagged with source URLs,
confidence labels, and freshness timestamps. `revert_enrichment`
removes everything in one call.

### Gauntlet

> "Run the gauntlet after the Build workflow."

The Gauntlet finds what structure checks miss. Twenty-two adversarial
scenarios. Two simulated personas — player and game master — share
one server and one novel. Combat endurance. Persona boundary
enforcement. Corrupted state recovery. Campaign survival: 30 rounds
of combat, 3 confrontations, over 100 audit log entries. Blocking
scenarios must pass. Re-runs after every server change. If it breaks,
the Gauntlet finds it before you do.

### Spec Update

> "Update my server to the latest spec."

Your campaign outlives the build. The spec improves — your server
follows. A full comparison audit finds every gap between your running
server and the current specification. Implements changes. Re-verifies.
State migration preserves your data. Your characters, worlds, and
Novels survive every rebuild.

## How it compares

| Tool name | What you're used to | How Holonovel differs |
|-----------|--------------------|-----------------------|
| AI Dungeon | Freeform AI storyteller — invents rules, forgets consequences | Your rulebooks. Real dice. Real conditions. Not AI improv. |
| First-generation MCP servers | Hand-built for one edition of one game. Rules lookup and nothing else. | Not locked to one system. D&D today. Mothership tomorrow. One spec reads any rulebook — no hand-coding, no waiting for someone to build your game. |
| Raw ChatGPT / local LLM | Forgets conditions mid-combat, invents spells, drifts from the ruleset | The AI remembers every rule you gave it. Deterministic dice. Conditions that don't vanish mid-fight. |
| SillyTavern | LLM roleplay frontend — character cards, context prompts, WorldInfo. No rules engine. | Mechanics aren't prompts. They're code. Your rulebooks enforce the rules — not the AI's best guess. |
| NovelAI | Subscription AI storyteller and image generator — no enforced game mechanics | No subscription. No walled garden. Your books. Your server. Your table. |

Every tool in this space asks you to pick. Rules engines serve one system
and stop there. AI storytellers improvise mechanics as they go. SillyTavern
gives you perfect prompt controls — and still trusts a context window to
remember what "poisoned" means three rounds later.

Holonovel doesn't pick. It reads your rulebooks, builds a server that
enforces every mechanic, and hands it to your LLM as a rules-literate GM.
The specification is the permanent artifact. Rebuild the server whenever
the spec evolves — your campaigns don't notice. New sourcebook? Drop
it in. New system? Build it. One spec. Any game. Zero code.

Last researched: August 5, 2026.

## Contribute

### Server build & run

1. **Node.js 20+.** `node --version`. Get it at
   [nodejs.org](https://nodejs.org).
2. **The spec.** Clone this repo or download
   [`holonovel.md`](holonovel.md) — one file, the complete specification.
3. **Your rulebooks.** Markdown, PDF, HTML, or a URL. No books handy?
   The spec includes a catalog of 10 permissively-licensed games (D&D,
   Pathfinder, Starfinder, Traveller, FATE, Blades in the Dark, Dungeon
   World, Old-School Essentials) — the agent can scrape one for you.
4. **An MCP client.** Opencode, Claude Desktop, Continue.dev, Cursor —
   anything with MCP support. The AI needs an LLM behind it. Holonovel
   is built and tested with DeepSeek on Opencode Go.
5. **Point your client at the spec.** The agent reads `holonovel.md`,
   asks what you want to build, then gets to work — converting,
   building, verifying. It pauses between workflows so you can review.
   When the Build workflow finishes, the agent connects the server to
   your client and verifies the handshake. Open a fresh conversation.
   Your AI Game Master answers.

### Spec improvement

```sh
npm install && npm run check   # lint + validate + assumption audit + ambiguity scan
```

| Command | What it checks |
|---------|---------------|
| `npm run fmea` | REQ-level failure mode and effects |
| `npm run validate --traceability` | Full REQ↔test↔workflow traceability |
| `npm run graph-deps` | REQ dependency graph (DOT/Graphviz) |
| `npm run spec-health-trends` | REQ count, test count, cross-ref density |

All scripts share parsing logic from `scripts/lib/parse-spec.ts`.

License: MIT. [RSS](https://git.gay/flukeatzerocool/Holonovel).
