<!--
README DESIGN:
  Voice: punchy, reserved, grounded in fact. Video-game-hype energy
    without overstatement. Direct address ("you").
  Demo: natural-language prompts ("Go north.", "Set the scene..."),
    never tool names (`command`, `set_scene_state`). Show the
    reader how they'd talk to the server — the AI maps intent to
    tools.
  Structure: Hero → Try it now → Holonovel MCP Server →
    How it compares → Contribute → Footer.
  Audience split: §2 is for players who want a server now
    (holonovel and dnd5e-holonovel quick-starts). §3 describes the
    server architecture through four infrastructure pillars.
    §5 is for contributors.
  No tables for feature descriptions. No repetition. One story
    vector per section.
  MCP server pillars: Four infrastructure pillars under §3 — World
    Model, Narrative Model, Novels, Hats — follow a build-then-play
    arc: the spatial foundation, the living world, the persistent
    campaign file, the role architecture. Each pillar gets two
    paragraphs: what it is, what you can do. Spec concepts (Convert,
    Build, Enrich, Gauntlet) are woven in as supporting detail — the
    server is the product, the spec is how it was built.
  Enrichment: Described in the Novels pillar — three tiers
    enriching the campaign with ruleset-native, community, and
    novel-generated content.
  World Model: Mentions the Inform programming language exactly
    once — "powered by the Inform programming language."
  Comparison table: Three columns (Tool name | What you're used to |
    How Holonovel differs). One row per competitor category, never
    individual products. Holodeck row: "Holonovel actually exists."
  Hero: Exactly three elements — h1 heading, bold tagline, one prose
    paragraph. The closing refrain "Your books. Your server. Your
    table." appears in the hero and the comparison section prose;
    updating one requires updating the other.
-->

# Holonovel

**One spec. Any game. Zero code.**

Holonovel is spec-driven RPG infrastructure. You have the books — this makes your
AI know every rule, every table, every condition track. A single specification
reads any rulebook and produces a complete MCP game server. Two servers ship in
this repo: a world-model base and a full D&D 5e build. D&D 5e today. Mothership
tomorrow. No hand-coding, no waiting for someone to build your game. Your books.
Your server. Your table.

## Try it now

### holonovel

The base server — a world-model MCP with rooms, things, exits, parser commands,
and narrative tools. Ruleset-free. Start here to build your own.

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

### dnd5e-holonovel

A complete D&D 5e SRD v5.1 server: ~106 tools, 1,021 indexed ruleset sections.
Built on top of holonovel.

```sh
cd dnd5e-holonovel
npm install
npm run build
```

```json
"dnd5e-holonovel": {
  "type": "local",
  "command": ["npx", "tsx", "src/index.ts"],
  "cwd": "<path>/dnd5e-holonovel",
  "environment": {
    "TTRPG_NOVEL": "default"
  },
  "enabled": true
}
```

SRD data: CC BY 4.0 + OGL 1.0a (Wizards of the Coast). Server code: MIT.

## Holonovel MCP Server

Holonovel is built on four infrastructure pillars. Together they deliver a
complete tabletop RPG server — your rulebooks become the referee, you run the
table.

### World Model

The world model is a spatial simulation layer — rooms, exits, containers,
supports, doors. Every object knows where it is and what it contains. The server
maintains a real containment graph, not a paragraph of prose it hopes the AI
remembers.

The world model is powered by the Inform programming language — the same engine
behind decades of interactive fiction classics. Holonovel reads your adventure
modules and sourcebooks, extracts every location description, and builds the
spatial model automatically. The Convert workflow turns your PDFs into clean
Markdown. The Build workflow assembles the rooms, exits, and containment
relationships. Go north. The room is there. Take the lamp. It moves from the
altar to your inventory. Your map is real.

> "Go north."
> "Take the lamp from the altar."
> "Look around."

Parser commands navigate the world with real containment logic. Rooms track what
they contain. Exits connect automatically in both directions. Open containers,
lock doors, examine surroundings. Exits are typed and directional. Convert
`## World` sections from adventure sources or build rooms by hand. Most AI RPG
tools have no spatial model — the AI pretends to remember where things are.
Holonovel tracks rooms, exits, containers, and objects with real containment
logic. Your map is real.

### Narrative Model

The narrative model is everything that gives your world depth. Scenes set the
stage. NPCs carry personality profiles, dispositions, and dialogue voice
examples. Lore entries fire automatically when keywords match the unfolding
story. Factions track standing and agendas. Secrets gate knowledge behind
discovery checks. Relationships evolve between every entity. Vows bind
characters to quests with milestone tracking. Countdowns escalate tension on
schedule. The story journal records decisions, moments, and consequences — a
narrative memory that survives every rebuild.

Holonovel reads your rulebooks and extracts not just rules, but narrative
material: example-of-play dialogue, designer notes, inspirational media
citations, GM advice. The Build workflow assembles a complete narrative tool
surface from your source material — no hand-coding. Every NPC, faction, and
relationship is a first-class data structure, not a paragraph of prose the AI
might forget.

> "Set the scene: a flooded ossuary. The air is thick with old incense."
> "An acolyte named Sister Mora steps from the shadows. She's terrified, not
> hostile."
> "The Thieves' Guild has a standing of -3. They want the party dead."
> "When anyone mentions the ossuary, remind me: the drowned priests still pray
> down here."

Create NPCs with voice, goals, and disposition. Lore entries trigger on
keywords. Factions with standing and agendas. Secrets that characters can
discover or miss. Relationships that shift with every interaction. Vows that
track milestones and consequences. The story journal remembers every decision.
Countdowns escalate tension on cue. Standing GM directives shape every response.
Other tools ask the AI to remember your world. Holonovel writes it to disk —
structured, queryable, permanent.

### Novels

A Novel is your entire campaign in one file — party, NPCs, scenes, lore, combat
state, world model, story journal, factions, secrets, everything. It lives on
disk. It survives server restarts and rebuilds. Export as JSON or Markdown.
Import with merge, replace, or dry-run modes. Clone to test a story branch. Set
checkpoints before pivotal moments. Pause mid-combat and resume from the same
round and turn. A Novel is not a chat log. It is a structured save file — every
property group is typed, validated, and checksummed against corruption.

> "Start a new game called the Dragon Tomb."
> "Switch to my other campaign."
> "Export the entire campaign."
> "Undo that."

Create, resume, rename, clone. Export and share. Import from other GMs. Undo any
mutation. Session recaps summarize play. Save pause context — step away and
return to the exact same state.

Enrichment works on the Novel across three tiers. Ruleset-native enrichment is
extracted from your books during Build: voice examples, lore templates, action
patterns — all anchored to your ruleset's own text. Community enrichment adds
web-sourced GM advice, actual-play breakdowns, and designer notes — tagged with
source URLs, confidence scores, and freshness timestamps. Novel-generated
enrichment synthesizes from your own world state as you play: NPC personality
profiles become voice examples, unresolved story threads become scene hooks,
faction tensions become countdown warnings. Every enrichment item is inert by
default — the GM activates what matters. Each tier has an independent removal
boundary. Revert any tier without affecting the others.

Before you ever see a defect, the Gauntlet subjects every Novel operation to 29
adversarial sub-workflows: simulated combat endurance across 30 rounds, hat
boundary probes from adversarial personas, corrupted-state recovery, campaign
survival across restarts. Two simulated hats — player and GM — share one server
and one Novel. Blocking sub-workflows must pass. If it breaks, the Gauntlet
finds it before you do.

### Hats

Holonovel enforces roles at the server level. Player. Game Master. Observer.
Editing mode. Four roles switched without restart. The AI takes the opposite
role automatically — when you're the player, the AI is your GM. When you GM, the
AI plays the characters. Observer mode lets the AI run both sides while you
watch, stepping in for mechanical decisions at your chosen autonomy level.

Hat gating is not a prompt instruction. It is enforced server-side — GM secrets,
lore entries, and narrative directives vanish from the Player hat's tool
surface. The response the player sees never leaks what the GM knows. Every
boundary violation is audited. Four roles. No restart. Real enforcement.

> "Put on the Game Master hat. I need to fix something."
> "Switch to my Player hat. Let's play."
> "Observer mode. Sit back and watch the AI run the whole table."
> "I want things to move faster."
> "Boundary: no body horror."

Switch hats mid-scene. The AI adapts instantly. Player signals give you
structured, persistent control: set pace, difficulty, tone, focus, and topic
boundaries. Every signal persists in the GM's briefing, shaping every response
until you change it. You don't have to hope the AI reads the room. You tell it.

## How it compares

| Tool name | What you're used to | How Holonovel differs |
|-----------|--------------------|-----------------------|
| AI Dungeon | Freeform AI storyteller — invents rules, forgets consequences | Your rulebooks. Real dice. Real conditions. Not AI improv. |
| First-generation MCP servers | Hand-built for one edition of one game. Rules lookup and nothing else. | Not locked to one system. D&D today. One spec reads any rulebook — no hand-coding, no waiting for someone to build your game. |
| Raw ChatGPT / local LLM | Forgets conditions mid-combat, invents spells, drifts from the ruleset | The AI remembers every rule you gave it. Deterministic dice. Conditions that don't vanish mid-fight. |
| SillyTavern | LLM roleplay frontend — character cards, context prompts, WorldInfo. No rules engine. | Mechanics aren't prompts. They're code. Your rulebooks enforce the rules — not the AI's best guess. |
| NovelAI | Subscription AI storyteller and image generator — no enforced game mechanics | No subscription. No walled garden. Your books. Your server. Your table. |
| Holodeck | Science fiction — literally | Holonovel actually exists. |

Every tool in this space asks you to pick. Rules engines serve one system and
stop there. AI storytellers improvise mechanics as they go. SillyTavern gives
you perfect prompt controls — and still trusts a context window to remember what
"poisoned" means three rounds later.

Holonovel doesn't pick. The server enforces every mechanic. The AI narrates. The
Novel preserves everything. Two servers ship in this repo today. Bring your own
rulebook and the spec builds another. One spec. Any game. Zero code.

Last updated: 2026-08-09.

## Contribute

### Run a server

Pick one. Both servers require Node.js 20+ ([nodejs.org](https://nodejs.org)).

**holonovel** — the base world-model server. `cd holonovel && npm install &&
npm run start`.

**dnd5e-holonovel** — the D&D 5e server. `cd dnd5e-holonovel && npm install &&
npm run build`. Add the config snippet above to your MCP client. Open a fresh
conversation. Your AI Game Master answers.

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

License: MIT. [RSS](https://git.gay/flukeatzerocool/Holonovel).
