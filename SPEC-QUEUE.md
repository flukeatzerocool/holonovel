# Spec-engineering queue

Living tracker for every feature, subsystem, and convention in holonovel.md —
inventoried and queued for Holodeck-driven improvement against KB research in
`.holonovel-state/knowledge-base/web/`.

**Mission.** Every item compares the spec against a Holodeck episode scene,
a competitive benchmark, or a persona quit moment. The question is always:
"Would someone who's seen Star Trek recognize this?" The answer drives spec
improvements across 8 axes: Translucency, Continuity, Agency, Fidelity,
Safety, Discoverability, Responsiveness, and Verisimilitude.

KB sources: `holodeck-episodes.md` (7 episode scenes → subsystem mapping),
`benchmark-landscape.md` (6 competitive axes from software/games),
`failure-modes.md` (7 persona quit moments).

**Scoring.** Three dimensions weighted toward Holodeck-calibre safety and
fidelity. `Score = (fidelity × 3) + (friction × 2) + (safety × 2)` (range 7–35).

| Axis     | 1                               | 3                                | 5                                  |
|----------|---------------------------------|----------------------------------|------------------------------------|
| Fidelity | Spec covers the Holodeck scene  | Spec partially covers; workaround exists | Spec has no mechanism for this scene |
| Friction | No impact on players/GMs        | Occasional workaround required   | Every session blocked              |
| Safety   | Failure is inconvenience only   | Could degrade trust or enjoyment | Could harm the player experience   |

Complexity and coupling are recorded separately for sequencing within a tier
— simpler, less-coupled items go first.

**Tiers.**

- **Tier 1 — Player/GM-critical.** Score ≥ 28. Break these and the game stops.
- **Tier 2 — Important UX.** Score 19–27. Break these and play degrades.
- **Tier 3 — Quality-of-life.** Score ≤ 18. Noticeable but non-blocking.

**Item format.**

```
N. [STATE] Feature name (player/GM-facing).
   Holodeck: Episode scene driving this item.
   Spec: REQ-XXX, §Y.Z.
   Research: [Text adventure / Inform 7 question] | [Benchmark against AI Dungeon, Mythic GME, or competitive tool]
   Score: NN (fidelity=N, friction=N, safety=N). Cplx: N, Coupling: N.
   Risk: [What breaks if this is wrong.]
```

**State markers.**

- `[RESEARCH]`   — domain research not yet done
- `[IN_PROGRESS]` — spec changes being drafted or applied
- `[DONE]`       — complete, removed from queue on next cleanup pass
- `[REJECTED]`   — user vetoed (terminal, manual intervention)

**Rules.** Add to bottom of tier. Delete on completion. No reordering
mid-tier. Check for duplicates before adding.

<!-- markdownlint-disable MD029 — continuous global item numbering across tiers -->

## Player/GM-critical

Tier 1 — Score ≥ 28. Break these and the game stops. Sequence by (cplx + coupling) ascending.

1. [DONE] Intent interpretation guardrails — prevent dangerous generation (player/GM-facing).
   Holodeck: *Elementary, Dear Data* (TNG 2x03) — Geordi says "create an adversary capable of
   defeating Data," the computer interprets literally and Moriarty is born with no clarifying
   questions or safety caps.
   Spec: REQ-090, REQ-091, §5.3 (generate_adventure, generate_encounter), §5.7.
   Research: How does AI Dungeon handle dangerous or overpowered prompts — does it reject, warn,
   or comply? What moderation/classification layer do AI storytelling tools place between user
   intent and world generation? How does Mythic GME's scene-check mechanic prevent power-creep by
   deferring to oracle rolls? Should `generate_encounter` cap difficulty against party level, and
   should `suggest_actions` warn when an intent ("kill the king") implies consequences the ruleset
   can't model?
   Score: 31 (fidelity=5, friction=4, safety=4). Cplx: 3, Coupling: 2.
   Risk: A player or GM types a natural-language intent with dangerous unintended consequences, the
   system complies without warning, and trust in Holonovel as a safe storytelling tool is lost.

2. [DONE] Parser command discoverability — surface valid commands without trial-and-error
   (player-facing).
   Holodeck: *The Big Goodbye* (TNG 1x12) — crew enters a noir program and immediately interacts:
   Picard speaks to characters, examines objects, navigates the office. Nobody types "help" or
   reads a manual. The interface is transparent.
   Spec: REQ-196, REQ-222, §5.10 (parser command dispatch), REQ-067 (help tool).
   Benchmark: VS Code command palette (Ctrl+Shift+P → type anything → discover features by name),
   Minecraft crafting book (searchable, visual, shows what you CAN make).
   Research: What parser verb coverage do IF players expect as baseline? Which missing verbs cause
   immediate abandonment vs. workaround? Look at IF community surveys (XYZZY Awards, IFDB reviews)
   and Inform 7 parser tutorials. Should `command("help")` or `command("what can I do?")` enumerate
   the valid verb set? Should parser errors suggest valid alternatives a la "Did you mean?" for verbs?
   Score: 28 (fidelity=4, friction=5, safety=1). Cplx: 2, Coupling: 1.
   Risk: A new player types three unrecognized commands in a row, gets three not-implemented responses,
   concludes the world model is broken, and quits. The IF community's standard for parser
   discoverability is high — Holonovel must meet it.

3. [DONE] Dual-register speech separation — distinguish in-character from meta-intent (player/GM-facing).
   Holodeck: *Bride of Chaotica!* (VOY 5x12) — crew speaks in-character AND in meta simultaneously.
   "Captain Proton would never retreat!" — said in character, meaning: we need the aliens to think
   we're committed. Players and GMs do this constantly: "I examine the altar" means both "my
   character looks at it" and "GM, tell me what my character sees."
   Spec: REQ-064 (hat behavioral boundaries), REQ-084 (suggest_actions), §5.5 (hats).
   Benchmark: rpg-mcp's embodiment model — LLM proposes intentions, engine validates and executes,
   keeping narrative and mechanical layers separate. Photopea/Blender mode-switching — select mode
   vs. paint mode vs. export mode, each with distinct tool surfaces.
   Research: How does `suggest_actions` handle the overlap between "I do X" (in-character action) and
   "what happens if I do X?" (meta-query about the rules)? Should `hat_briefing` include a register
   directive telling the GM AI how to interpret ambiguous player speech? Does the `help` or
   `suggest_actions` tool need a meta-intent category ("I want to know...", "Can my character...")?
   Score: 28 (fidelity=4, friction=4, safety=2). Cplx: 3, Coupling: 3.
   Risk: The AI GM misinterprets a player's meta-query ("can I jump the chasm?") as an in-character
   action, resolving it without the player's intent to probe the rules first. Or the GM narrates
   a character action when the player was asking an out-of-character question.

## Important UX

Tier 2 — Score 19–27. Break these and play degrades. Sequence by (cplx + coupling) ascending.

4. [DONE] Narrative fast-forward — skip to climax with coherent summary (GM-facing).
   Holodeck: *Fistful of Datas* (TNG 6x08) — Worf says "Computer, skip to the climax." The Holodeck
   advances the narrative, summarizes intervening events, and presents the final confrontation.
   Spec: REQ-073 (countdowns), REQ-076 (scene state), §5.6 (session_recap), §5.8 (narrative
   control).
   Benchmark: AI Dungeon's "retry" and "story" mode let players rewind or fast-forward. Ironsworn's
   progress tracks compress multi-step journeys into single resolution rolls. Video game fast-travel
   systems summarize the journey without playing every step.
   Research: Can Holonovel fast-forward between two scene states and produce a coherent summary of
   what happened in between? Does `advance_countdown` need a bulk-advance mode? Should
   `set_scene_state` accept a `narrative_bridge` parameter that the server expands into a summary?
   Score: 24 (fidelity=4, friction=3, safety=1). Cplx: 3, Coupling: 2.
   Risk: The GM wants to skip 3 days of travel but the only options are to narrate every scene
   manually or jump-cut with no intervening logic. Lore entries and countdowns that would have
   triggered during the skipped period are ignored, breaking continuity.

5. [DONE] NPC depth signaling — distinguish cardboard cutouts from campaign companions (player/GM-facing).
   Holodeck: *Our Man Bashir* (DS9 4x10) — transporter accidents store crew patterns as Holodeck
   characters. Real people ARE the NPCs. The Holodeck IS the life-support system — not a game, an
   environment. When does an entity stop being "game state" and start being "world state"?
   Spec: REQ-075 (named NPCs), REQ-077 (personality), REQ-246 (story journal), §5.6 (state).
   Benchmark: World Anvil — NPC life cycle from "mentioned once" to "stat block" to "campaign
   linchpin." Obsidian backlinks show every scene an NPC appeared in. Solo roleplayer quit moment:
   "The world forgot who that NPC was between sessions."
   Research: How do solo RPG tools (Mythic GME, Ironsworn) handle NPC reintroduction when sessions
   are days apart? Should `hat_briefing` signal NPC depth — "Greta (innkeeper, 2 sessions, 4 scenes)"
   vs. "Greta (innkeeper, first appearance)"? Should `session_recap` include an NPC relationship
   heatmap showing which entities have appeared most frequently? Does NPC persistence need a
   degradation signal (NPCs not seen in 5+ sessions marked as "distant")?
   Score: 22 (fidelity=3, friction=4, safety=1). Cplx: 2, Coupling: 2.
   Risk: A solo player returns after a week and can't remember which NPCs matter. A one-session
   shopkeeper and a campaign-long ally look identical in `hat_briefing`. The player treats a
   throwaway NPC as important or (worse) ignores a recurring NPC the GM spent three sessions
   building.

## Quality-of-life

Tier 3 — Score ≤ 18. Quality-of-life and build-time polish. Sequence by (cplx + coupling) ascending.

6. [DONE] Progressive detail control — "less detail" and "more detail" signals (player-facing).
   Holodeck: *The Big Goodbye* (TNG 1x12) — Picard: "I didn't create this detail, the computer did."
   The Holodeck generates appropriate detail from minimal prompts. It doesn't dump the entire noir
   detective's backstory on first entry — it reveals detail as you interact.
   Spec: REQ-197 (room descriptions — verbatim text, no generative prose), §5.10 (world model),
   §5.8 (lore triggers).
   Benchmark: Dark Souls item descriptions — lore-first, with gameplay mechanics encoded beneath.
   AI RP hobbyist quit moment: "The room description was 3 paragraphs. I just wanted to know where
   the door was." AI Dungeon's progressive disclosure — short initial output with "more detail" as
   an option.
   Research: How do successful AI RP tools use progressive disclosure? Should `command("look")`
   return a terse summary and `command("examine room")` or `command("examine altar in detail")`
   return the full description? Should `player_signal(focus)` include a detail-level option
   ("terse notifications" vs. "rich narrative")? Should lore entries carry a detail tier that
   controls how much content triggers on keyword match?
   Score: 18 (fidelity=3, friction=3, safety=0). Cplx: 2, Coupling: 1.
   Risk: Players drown in verbatim room descriptions when all they wanted was the exit list. GMs
   can't signal "the tapestry matters" without the player reading every word of every room.

7. [DONE] Responsiveness budget — speed-of-interaction requirements for live table use (GM-facing).
   Holodeck: The Holodeck processes voice commands in real time with no perceptible latency. The
   computer never says "processing" and the crew never waits. Interaction is instantaneous.
   Spec: §5.6 (combat lifecycle), §7.3 (output contracts), REQ-051 (no network at runtime).
   Benchmark: Live tabletop GM quit moment: "I spent 20 seconds typing while 5 people stared at me."
   D&D Beyond quick lookup (sub-second spell search). Foundry VTT combat tracker sidebar (always
   visible, never intrusive).
   Research: What's the absolute minimum output that still resolves the rules question? What do
   physical GM screens (laminated one-pagers) teach about information density? Should combat
   advance output be configurable between "terse" (participant name + result only) and "verbose"
   (full roll transparency)? Should `search_rules` have a "quick" mode that returns only the
   most relevant sentence? Does the spec need an output-latency budget — tools that resolve in
   >N seconds are recorded as a responsiveness defect?
   Score: 14 (fidelity=2, friction=4, safety=0). Cplx: 1, Coupling: 1.
   Risk: A GM at a live table calls `lookup_spell("fireball")` mid-combat, the output is 12 lines
   of verbose text, and the table loses momentum while the GM skims for the damage dice. If this
    happens three times in one combat, the GM closes Holonovel and picks up the physical PHB.

8. [DONE] Named Novel checkpoints — nested state save and restore (GM-facing).
   Holodeck: *Ship in a Bottle* (TNG 6x12) — Moriarty creates a nested simulation;
   Picard believes he's escaped but is still inside. The computer models worlds inside
   worlds.
   Spec: REQ-241, REQ-041, REQ-116, §5.6.
   Research: [Checkpoint patterns in IF engines] | [Benchmark against Obsidian's history,
   git branching metaphors, or game save-state systems]
   Score: 18 (fidelity=4, friction=2, safety=1). Cplx: 2, Coupling: 1.
   Risk: The GM runs a dream sequence or illusion scene, modifies state extensively, and
   has no way to revert except undo — which is LIFO and destructive. GM must manually
   track pre-dream state or avoid complex nested scenes entirely.

9. [DONE] Boundary signal enforcement — surface and warn on content violations (GM/player-facing).
   Holodeck: *Hollow Pursuits* (TNG 3x21) — Barclay uses the Holodeck to create fantasy
   versions of his crewmates. The computer doesn't judge — but the social consequences are
   real. Players and GMs may subvert the system for power fantasy, social manipulation,
   or grief processing.
   Spec: REQ-255, REQ-069, REQ-251, §5.5.
   Research: [Content safety guardrails in AI storytelling tools] | [Benchmark against AI
   Dungeon's moderation layer, Character.AI's safety filters, or RP platform consent tools]
   Score: 24 (fidelity=4, friction=3, safety=3). Cplx: 1, Coupling: 2.
   Risk: A GM (or AI GM) narrates content that violates a player's stated boundary. The
   player set the signal, but the GM ignored it — and the server had no mechanism to warn.
   The player loses trust in the system as a safe storytelling tool.

