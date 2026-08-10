# DMCP - Dungeon Master MCP Service

An MCP (Model Context Protocol) server that enables AI agents to act as dynamic dungeon masters for text-based RPGs. Supports any setting or style with dynamically generated rule systems.

Source: <https://github.com/shawnrushefsky/dmcp> — MIT License

## Features

- **Dynamic Rule Systems** - Agent designs rules appropriate to the setting (fantasy, sci-fi, horror, etc.)
- **Full Game State Management** - Games, characters, locations, items, quests, combat
- **Voice Descriptions** - NPC voice characteristics for TTS/voice mode integration
- **Player Choice System** - Structured choices with multi-select and free-form input
- **Narrative Logging** - Event history for story continuity and export
- **Dice & Checks** - Flexible dice rolling and skill resolution
- **Factions & Politics** - Organizations with resources, goals, and relationships
- **Secrets System** - Hidden knowledge that can be revealed to characters
- **Entity Relationships** - Track attitudes, bonds, rivalries between any entities
- **Game Notes** - Searchable DM notes with auto-generated recaps
- **Pause & Resume** - Save agent context for seamless game continuation
- **Status Effects** - Buffs, debuffs with duration, stacking, and modifiers

## NPC with Voice

```javascript
create_character({
  name: "Mama Chen",
  isPlayer: false,
  voice: {
    pitch: "high",
    speed: "fast",
    tone: "raspy",
    accent: "Cantonese-influenced",
    quirks: ["ends sentences with 'yeah?'", "laughs before bad news"],
    description: "Sounds like 40 years of cigarettes and secrets"
  }
})
```

## Player Choices

```javascript
present_choices({
  prompt: "The corpo goon blocks your path. What's your play?",
  choices: [
    {id: "talk", label: "Talk your way past", description: "Use your silver tongue"},
    {id: "bribe", label: "Slip him some creds", description: "Everyone has a price"},
    {id: "fight", label: "Go loud", description: "Violence is always an option"},
    {id: "sneak", label: "Find another way", description: "There's always a back door"}
  ],
  allowFreeform: true,
  context: {urgency: "medium"}
})
```

## Pause & Resume

Save context before ending a game for seamless continuation:

```javascript
save_pause_state({
  gameId: "...",
  currentScene: "The party is in the merchant's basement after discovering the hidden door",
  immediateSituation: "Kira has her hand on the trapdoor, asking if they should descend",
  sceneAtmosphere: "Tense, dusty, dim light from above",
  pendingPlayerAction: "Deciding whether to open trapdoor or search for traps",
  dmShortTermPlans: "If they descend, ghost encounter triggers",
  dmLongTermPlans: "Building toward cult revelation in Chapter 3",
  activeThreads: [{
    name: "Missing Merchant",
    status: "active",
    urgency: "high",
    description: "Finding what happened to Old Chen"
  }],
  npcAttitudes: { "guard_captain_id": "suspicious after tavern incident" },
  playerApparentGoals: "Focused on finding the merchant, ignoring side quests"
})

get_resume_context({ gameId: "..." })
// Returns formatted briefing + full game state
```

## Full Tool Catalogue

DMCP provides 170 tools across 26 categories: Game Management, Game Setup
Interview, Rules System, World Management, Character Management, Dice & Checks,
Combat, Inventory, Quests, Narrative, Player Interaction, Resources, Time &
Calendar, Timers, Random Tables, Secrets & Knowledge, Relationships, Tags,
Status Effects, Factions, Abilities & Powers, Game Notes, Pause & Resume,
Multi-Agent Collaboration, Image Storage, Display & Theme.

See the full README at <https://github.com/shawnrushefsky/dmcp> for the
complete tool catalogue.

## License

MIT — see LICENSE file in this directory.
