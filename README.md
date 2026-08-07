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
  Feature blurbs: Each h3 blurb under §3 and §4 follows a four-beat
    cadence — benefit hook, mechanics, competitive proof, closer. The
    competitive-proof sentence contrasts Holonovel against the
    current tool landscape without naming individual competitors; it
    answers "why this beats what you're used to."
  MCP server order: Features under §3 follow a natural RPG session
    arc — Setup (campaign, characters, roles), Knowledge (rules,
    available actions), World (scenes, NPCs, lore, generation),
    Action (dice, combat), Feedback (player signals), Safety (rollback,
    export). New features insert at the arc point they serve; reorder
    the section to restore the arc after every addition or removal.
  Comparison table: Three columns (Tool name | What you're used to |
    How Holonovel differs). One row per competitor category, never
    individual products. Prose paragraph below synthesizes the table;
    it never repeats a row's content verbatim.
  Hero: Exactly three elements — h1 heading, bold tagline, one prose
    paragraph. No sub-headings, bullet lists, or preamble paragraphs.
    The tagline uses short declarative fragments separated by periods
    — never a sentence or question. The closing refrain "Your books.
    Your server. Your table." and the game-system mention "D&D 5e
    today. Mothership tomorrow." are echoed in the comparison section;
    changing one requires updating the other. Three capability
    exemplars preview the MCP server feature sections without
    enumerating every tool category. Enforced maximum 200 words
    (validate-readme).
-->

# Holonovel

**One spec. Any game. Zero code.**

You have the books. You know the rules. Holonovel makes your AI know
them too — a single specification reads every mechanic, extracts every
table, and builds you a complete MCP game server. Look up spells by
name. Roll dice that show their work. Track conditions on schedule.
D&D 5e today. Mothership tomorrow. No hand-coding, no waiting for
someone to build your game. Your books. Your server. Your table.

## Try it now — D&D 5e

This repo ships a pre-built D&D 5e SRD v5.1 server: 61 tools, 1,021
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
  "command": ["npx", "tsx", "src/index.ts"],
  "cwd": "<path>/dnd5e",
  "environment": {
    "TTRPG_NOVEL": "default"
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
Export and import with merge, replace, or dry-run modes.
Context-window-only tools lose your campaign the moment the chat
resets. Holonovel writes everything — party, NPCs, scenes, lore,
combat — to a single local file that survives every restart and
rebuild. No cloud. No sync. One local file — copy it, back it up,
share it.

### Character

> "Create a character."
> "Import my fighter from the roster."

Your characters are permanent. The roster survives every campaign and
rebuild — create once, play forever. Build step by step with guided
decisions, or in a single call. Switch characters between games.
Advancement follows the ruleset's own progression tables. Sheet in Markdown or
ASCII. No other RPG tool gives you a permanent roster that lives
outside any single game — create once, import anywhere, the character
survives every rebuild.

### Hat

> "Put on the Game Master hat. I need to fix something."
> "Switch to my Player hat. Let's play."

Two enforced hats, switched without restart. The AI narrates and
adjudicates as GM. Switch to your Player hat and GM secrets vanish — hat
gating is enforced server-side. You're never locked out of your own
game. Every other AI GM trusts a prompt to keep secrets between
hats; Holonovel enforces hat boundaries server-side — switch
hats and player-side secrets actually stay hidden. Jump behind the
screen mid-session to tweak state, inject a complication, or add an
NPC on the fly.

### Rules Access

> "Look up Fireball."
> "Search the rules for grappling."

Name it, get the rule. Every result cites a source page. Full-text
search across the indexed ruleset. Look up spells, monsters,
equipment, and classes by name and documented alias. Every other AI
GM improvises mechanics from memory; Holonovel reads your books — by
the page, with a citation.

### Action Suggestions

> "I want to sneak past the guards."
> "What can I do in combat?"

You describe what you want to do — the AI maps it to ruleset-legal
tools. No memorizing command names. No guessing which tool handles
what. Suggestions are context-sensitive: they know the scene type,
your conditions, and your hat's visible tools. No other MCP RPG
server bridges natural-language intent to its tool surface.

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
on cue. Context-window tools inject lore until the session ends;
Holonovel writes your world — lore, countdowns, GM directives — to
disk, where it survives every rebuild. Standing GM directives shape
every response.

### Adventures & Encounters

> "Generate an adventure: a heist at the wizard's auction."
> "Create an encounter: the party enters the flooded crypt."

One sentence becomes a campaign scaffold — scenes, NPCs, hooks.
Generate the whole outline, or build encounters one at a time as
single undoable steps. Load adventure modules from Markdown files.
Freeform AI storytellers generate disconnected scenes with no
through-line and no way back; Holonovel scaffolds a full campaign from
one sentence and snapshots every encounter as a single undoable step.

### Dice

> "Make a Dexterity save to dodge the trap."
> "Attack the ogre with my longsword."

Every roll shows its work — the die faces, the modifiers, the target.
Advantage flips two dice. Critical hits double damage. Seedable RNG
makes every roll reproducible. Dispute an outcome, replay it, get the
same result. Most AI RPG tools don't roll dice — they ask the LLM to
invent an outcome; Holonovel's dice are real, seeded, and
deterministic. The AI narrates. The dice decide.

### Combat

> "Roll initiative. The goblins ambush from the treeline."

You don't track initiative, conditions, or HP — the AI does, by the
book. Bleeding stops when the rules say it does. Paralysis expires on
schedule. Combat state survives server restarts. Undo bad rolls.
LLM-only AI DMs hallucinate conditions and forget whose turn it is;
Holonovel tracks bleeding, paralysis, and exhaustion by the book —
they expire when the rules say they do, not when the AI forgets. You
focus on tactics.

### Player Signal

> "I want things to move faster."
> "Boundary: no body horror."

You don't have to hope the AI reads the room — you tell it. Send
structured signals for pace, difficulty, tone, focus, and topic
boundaries. Every signal persists in the GM's briefing, shaping every
response until you change it. No other AI GM gives the player
structured, persistent control over the game's direction — signals
don't get buried in chat history.

### State & Recovery

> "Undo that."
> "Recap the session."
> "Export the entire campaign."

Every mutation is a snapshot. Undo reverts the last step. Session
recaps summarize play. Checksums detect corruption before you'd
notice. Export your campaign as a single file. Import back with merge,
replace, or dry-run. No competitor offers snapshot-based rollback
with corruption detection across a full campaign; Holonovel snapshots
every mutation, detects file corruption on load, and exports your
entire campaign as one file. Nothing is permanent unless you want it
to be.

## The specification

Your books become a server. The spec becomes your toolchain.
Everything you build survives every rebuild.

### Convert

> "Convert my PDF to Markdown."

This is the hardest step — and the spec handles it. PDF, HTML, or web
scrape → clean, well-structured Markdown. Tables reassembled across
page breaks. Adornments stripped. Structure validated. Conversion
fidelity tracked at 90% minimum. Every existing MCP RPG server was
built by a human transcribing rules from PDFs by hand; Holonovel
automates the step every other tool skips. After clean Markdown, the
rest is automatic.

### Build

> "Build me a game server."

No hallucinated spells. No invented armor classes. Discovery reads
every mechanic, table, entity, and procedure from your books in
chunks. Construction assembles a complete MCP server in six
dependency-ordered steps. A convergence loop measures six quality
metrics and iterates until every threshold is met. A second model
cross-audits the first — catching defects a single model would miss.
Every MCP RPG server today is hand-coded for a single system;
Holonovel's spec reads your sourcebooks, assembles a complete server,
and cross-audits with a second model — no hand-coding, no system
lock-in. Your rules make it in.

### Enrich

> "Search the web for Pathfinder 2e GM advice."

Optional. Additive. Never touches mechanics. Web research across
community forums, actual-play breakdowns, designer notes, and media
influences. Produces voice examples, lore templates, action suggestion
patterns, and adventure advice — all tagged with source URLs,
confidence labels, and freshness timestamps. No other tool aggregates
real community GM advice with source attribution and weaves it into
your server's hat. `revert_enrichment` removes everything in one
call.

### Gauntlet

> "Run the gauntlet after the Build workflow."

The Gauntlet finds what structure checks miss. Twenty-three adversarial
scenarios. Two simulated hats — player and game master — share
one server and one novel. Combat endurance. Hat boundary
enforcement. Corrupted state recovery. Campaign survival: 30 rounds
of combat, 3 confrontations, over 100 audit log entries. Blocking
scenarios must pass. Re-runs after every server change. No AI RPG
tool ships with an adversarial test suite — users find the bugs;
Holonovel's 22 scenarios with simulated hats test combat
endurance, boundary enforcement, and state recovery before you ever
see a defect. If it breaks, the Gauntlet finds it before you do.

### Spec Update

> "Update my server to the latest spec."

Your campaign outlives the build. The spec improves — your server
follows. A full comparison audit finds every gap between your running
server and the current specification, implements changes, and re-verifies. When a hand-coded
server is updated, your campaign data may not survive the upgrade;
Holonovel's comparison audit finds every gap and applies only what
changed — your characters, worlds, and Novels survive every rebuild.

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
   [`holonovel.md`](holonovel.md) — the complete assembled specification
   (generated from source files in [`spec/`](spec/)).
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

### Spec queue pipeline

SPEC-QUEUE.md tracks the spec-engineering queue — every subsystem inventoried
and reviewed through a full-cycle pipeline of AI research, improvement planning,
and automated application. All 55 subsystems have completed the cycle as of
August 7, 2026.

```sh
./scripts/spec-queue-cycle.sh research    # Launch parallel AI research sessions
./scripts/spec-queue-cycle.sh status      # Check progress across all items
./scripts/spec-queue-cycle.sh execute     # Review, apply, sync, commit
./scripts/spec-queue-cycle.sh run-all     # Full-auto pipeline: research → execute → repeat
```

**research** launches detached opencode sessions that analyze one subsystem
each — reading the spec, changelog, and implementation, calibrating against
the web — and produce concrete improvement plans with exact spec prose.
Plans land in `.holonovel-state/queue-plans/`.

**execute** shows the findings, auto-approves each batch, applies approved
changes to the specification, runs the spec-driven update workflow (gap
audit → implement → scoped Gauntlet), validates with `npm run check`, and
commits everything as one batch.

A knowledge base at `.holonovel-state/knowledge-base/` caches web research and
spec summaries across cycles. The knowledge base is local — it's in `.gitignore`.

License: MIT. [RSS](https://git.gay/flukeatzerocool/Holonovel).
