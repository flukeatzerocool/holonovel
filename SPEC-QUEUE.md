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

**Builder scoring.** Builder items use reproducibility/diagnosability/efficiency
instead of fidelity/friction/safety. `Score = (reproducibility × 3) +
(diagnosability × 2) + (efficiency × 2)` (range 7–35).

| Axis             | 1                                  | 3                                      | 5                                        |
|------------------|------------------------------------|----------------------------------------|------------------------------------------|
| Reproducibility  | One builder succeeds; another would too | Second builder succeeds with guidance | Second builder would likely fail        |
| Diagnosability   | Failure is self-explanatory        | Failure requires reading logs          | Failure is silent or misleading          |
| Efficiency       | Token/time cost is near-optimal    | Some wasted work; acceptable            | Significant rework or redundant passes   |

**Builder tiers.**

- **Tier B1 — Build-critical.** Score ≥ 28. Block handoff or cause silent defects.
- **Tier B2 — Build-degrading.** Score 19–27. Slow iteration, waste tokens.
- **Tier B3 — Build-QoL.** Score ≤ 18. Nice-to-have, does not block.

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

10. [RESEARCH] Re-immersion quality on resume — "What was I doing, and why did it matter?"
    (player-facing).
    Holodeck: In every Holodeck episode where someone enters mid-program, the world is exactly
    as it was — not just mechanically, but emotionally. *It's Only a Paper Moon* (DS9 7x10) —
    Nog steps back into Vic's lounge and the world remembers him. The computer never needs to
    be told "remind me what's happening."
    Spec: `save_pause_context`, `get_resume_context` (REQ-020 Narrative > Session Management),
    `session_recap` (REQ-072), REQ-055 (durability and resume), §5.9 (Novel persistence).
    Benchmark: Play-by-post forums require a "previously on" summary at the top of every GM
    post. Solo journaling games (Thousand Year Old Vampire, Artefact) build re-immersion
    prompts into the journaling prompts themselves. Video games with "loading screen tips"
    that recap story progress (Dragon Age, The Witcher 3). Play-by-post quit moment: "I
    posted my action, waited 3 days for a response, and forgot what was happening."
    Research: What does the spec's current resume context capture that a player returning
    after 7 days actually needs? Does `session_recap` provide emotional stakes ("the cleric
    is furious at you for breaking your oath") or only mechanical state ("3 entities, 2
    conditions")? Should `get_resume_context` include the last 3 story journal entries,
    active NPC dispositions, and the current narrative directive? Should resume output be
    structured as a "previously on" narrative summary rather than a state dump? What do
    play-by-post platforms (Rolegate, Discord bots) include in their turn-notification
    messages to jog player memory?
    Score: 29 (fidelity=5, friction=4, safety=2). Cplx: 3, Coupling: 2.
    Risk: A solo player returns after a week, types `resume_novel`, and gets a mechanical
    state dump — entity HP, active conditions, turn order. They don't remember *why* the
    goblin negotiation mattered, what the cleric was angry about, or what they were walking
    toward when they stopped. The first 10 minutes of the session are spent re-reading the
    audit log instead of playing. After three such resumes, the player abandons the Novel
    and starts a new one — or stops using Holonovel entirely.

11. [RESEARCH] Ruleset runtime fidelity — the server must not misrepresent mechanical truth
    (GM-facing).
    Holodeck: Every Holodeck episode — when a character fires a phaser, a phaser fires. The
    simulation never alters the rules of the universe it's modeling. When Picard asks the
    Dixon Hill program for a gun, it gives him a 1940s revolver, not a plasma rifle.
    Spec: REQ-011 (extraction confidence), REQ-050 (determinism), REQ-058 (tool-result
    fidelity), §5.2 (confidence aggregation), §5.7 (determinism), §6.5 (convergence loop).
    Benchmark: D&D Beyond's compendium accuracy — the PHB is the single source of truth and
    the tool is wrong if it disagrees. Foundry VTT's ruleset modules are community-vetted
    for mechanical accuracy. Live tabletop GM quit moment: "the server gave me the wrong
    rule — the player corrected me from the physical book."
    Research: Does Holonovel need a runtime fidelity check — comparing tool output against
    the extracted model at runtime, not just at build time? Can the server detect when a
    lookup produces content that contradicts the ruleset's own cross-references? Should
    `spec_health` include a `fidelity_anomalies` section flagging extracted content whose
    cross-references don't resolve? What does D&D Beyond's content pipeline do to ensure
    the PHB text is never altered in transit? Does the server need a "cite your source"
    requirement — every ruleset lookup including the source anchor so the GM can verify?
    Score: 31 (fidelity=5, friction=4, safety=4). Cplx: 4, Coupling: 3.
    Risk: A live-table GM calls `lookup_spell("fireball")`, reads the output aloud, and a
    player says "that's 8d6, not 6d6 — the PHB says 8d6." The GM checks the physical book
    and the player is right. Trust in Holonovel is destroyed in one interaction. If this
    happens once, the GM never opens it again.

12. [RESEARCH] Narrative consistency enforcement — the AI GM must not contradict the world
    it built (player/GM-facing).
    Holodeck: *Emergence* (TNG 7x23) — the ship's systems create a coherent narrative
    program where every element follows from a unifying premise. Characters, settings, and
    conflicts are internally consistent. The program doesn't describe a crowded train
    station in one scene and an empty platform in the next.
    Spec: REQ-083 (dynamic lore), REQ-246 (story journal), REQ-076 (scene state), §5.8
    (enrichment, lore, macros), §7.7 (Scene → Lore coupling).
    Benchmark: AI Dungeon's #1 user complaint is memory/context inconsistency — NPCs change
    names, locations shift, dead characters return. NovelAI addresses this with context
    management and lorebook anchoring. Ironsworn's oracle mechanics provide mechanical
    certainty where narrative would be ambiguous. AI RP hobbyist quit moment: "The AI
    forgot what happened 10 turns ago."
    Research: Does the spec need a cross-turn consistency check — asserting that lore
    entries, NPC disposition, and scene state don't contradict each other across mutations?
    Should `hat_briefing` include an "active narrative threads" section tracking unresolved
    plot points (promises made, clues discovered, threats pending)? How do AI storytelling
    tools enforce consistency — does AI Dungeon's memory system or NovelAI's lorebook
    provide patterns Holonovel should adopt? Should the story journal's `bond` and
    `consequence` types trigger consistency warnings when the AI GM narrates something
    incompatible? Is the problem that the information isn't stored correctly, or that it
    isn't *used* faithfully at runtime — or both?
    Score: 28 (fidelity=4, friction=4, safety=2). Cplx: 4, Coupling: 3.
    Risk: The AI GM describes the inn as crowded and noisy in scene 1. Two scenes later,
    the same inn is "quiet, with only the innkeeper present." The player notices the
    contradiction, loses immersion, and stops trusting the narrative. This is the #1
    complaint about AI-generated storytelling — the spec treats lore as a trigger system
    but doesn't enforce that the AI GM *uses* stored information faithfully.

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

13. [RESEARCH] Voice and dialogue fidelity — NPCs must sound different from each other
    (player/GM-facing).
    Holodeck: *Our Man Bashir* (DS9 4x10) — real people ARE the NPCs. Garak doesn't talk like
    Bashir. Kira doesn't talk like O'Brien. The Holodeck preserves individual voice because
    the characters aren't generated — they're inhabited. *Spirit Folk* (VOY 6x13) — the Fair
    Haven characters have distinct personalities that the crew can distinguish.
    Spec: REQ-077 (personality and voice examples on entities), REQ-226 (narrative voice
    profiles), REQ-220 (narrative POV), §5.8 (enrichment — voice examples).
    Benchmark: Character.AI enforces personality persistence — each character has a defined
    voice and the model is prompted to stay in-character. NovelAI's style adherence keeps
    generated prose within a defined narrative voice. AI RP hobbyist quit moment: "Every
    NPC talks the same way — formal, helpful, bland."
    Research: Does the spec require the server to *use* voice_examples in narrative
    generation, or only to *store* them? Should `hat_briefing` include a voice directive for
    NPCs present in the scene — "Greta (innkeeper, voice: warm, uses 'dearie')"? Should the
    narrative POV directive (REQ-220) include a voice reference for the active entity?
    What mechanisms do Character.AI and NovelAI use to enforce character voice consistency,
    and can those be adapted to Holonovel's REQ-as-contract model?
    Score: 21 (fidelity=3, friction=3, safety=1). Cplx: 2, Coupling: 2.
    Risk: The barkeep ("rough, uses 'oi'") and the guard captain ("formal, never contracts
    words") both greet the player with identical polite, helpful dialogue because the AI GM
    isn't constrained by their voice_examples. The player can't distinguish NPCs by voice,
    immersion breaks, and the world feels populated by chatbots rather than characters. Voice
    examples were stored faithfully but never *used*.

14. [RESEARCH] IF parser depth parity — the parser must understand what a reasonable IF
    player would type (player-facing).
    Holodeck: *The Big Goodbye* (TNG 1x12) — Picard walks in and interacts naturally. He
    doesn't learn a command vocabulary, doesn't get "not implemented" errors, doesn't receive
    parse failures. The interface interprets intent, not just syntax.
    Spec: REQ-196 (parser command dispatch), REQ-222 (parser command vocabulary extension),
    §5.10 (world-model layer).
    Benchmark: Inform 7's standard library defines ~60 verbs that IF players expect as
    baseline — search, knock, ask/tell, push/pull, climb, jump, eat/drink, wear/remove,
    light/extinguish, turn on/off, cut, dig, fill/pour, wave, listen, smell, taste. The
    IF community's XYZZY Awards and IFDB reviews penalize parsers that lack these. The
    standard for disambiguation ("Which altar?") and implicit actions ("You need the iron
    key first") is decades old. Inform/IF player quit moment: "I typed three perfectly
    reasonable IF commands and all failed."
    Research: What is the minimum verb set an IF player expects before concluding a parser
    is "broken"? Which missing verbs cause immediate abandonment vs. workaround? Should
    `command("help")` categorize verbs by IF-standard expectations (core, extended,
    specialist)? Should the parser support pronoun reference ("examine it"), compound
    commands ("take the key and unlock the door"), and implicit action hints ("the chest is
    locked — you'll need a key")? How do Inform 7's scope rules (objects in darkness,
    objects in closed containers) map to REQ-199's property model?
    Score: 22 (fidelity=3, friction=4, safety=1). Cplx: 3, Coupling: 2.
    Risk: An experienced IF player types `search the desk`, `knock on the door`, and `ask
    the guard about the key` — three perfectly standard IF commands, all returning
    `[NOT_IMPLEMENTED]`. The player concludes the world model is a thin facade over a TTRPG
    rules engine, not a real interactive fiction environment. They stop using parser commands
    and treat Holonovel as a dice roller with extra steps.

15. [RESEARCH] Vow and progress tracking — the server should know what the player is working
    toward (GM-facing).
    Holodeck: *Fistful of Datas* (TNG 6x08) — Worf doesn't wander the West aimlessly. He has
    an objective: rescue the holographic damsel. The program tracks whether he's making
    progress. Every Holodeck episode has a goal — solve the mystery, win the game, survive
    the scenario. The Holodeck knows what you're trying to accomplish.
    Spec: REQ-073 (countdowns), REQ-246 (story journal), §5.6 (state and lifecycle), §5.8
    (narrative control).
    Benchmark: Ironsworn's vow system — every quest is a vow with a difficulty rank
    (troublesome, dangerous, formidable, extreme, epic) and a progress track. Milestones
    mark progress; a progress roll determines success, complication, or failure. Quest
    tracking in CRPGs (Baldur's Gate 3 journal, The Witcher 3 quest log). Solo journaling
    games where the player states an intention and works toward it.
    Research: Should Holonovel model vows as the positive mirror of countdowns — a `set_vow`
    tool with milestones, difficulty, and a resolution mechanic (success/complication/
    failure)? How does resolution interact with the TTRPG hierarchy — should the ruleset's
    quest/reward mechanics override narrative vow tracking? Should resolved vows produce
    story journal `decision` entries, bridging the vow tracker to the existing narrative
    memory system? Should `hat_briefing` surface active vows alongside active countdowns?
    Does vow tracking help the re-immersion item (10) by giving the returning player a
    clear "this is what you're working toward" signal?
    Score: 22 (fidelity=3, friction=4, safety=1). Cplx: 3, Coupling: 2.
    Risk: A solo player has been working toward "find the missing merchant" for three
    sessions. They resume after a week and `session_recap` tells them combat stats and NPC
    names but doesn't surface their active goal. The player wanders aimlessly for two scenes
    before remembering what they were doing. The story loses momentum, and narrative threads
    are abandoned not because the player chose to, but because the server forgot them.

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

16. [RESEARCH] Oracle loop — GM-facing uncertainty resolution (GM-facing).
    Holodeck: The Holodeck generates detail on interaction. When Picard opens a desk drawer,
    the computer decides what's inside — not from a pre-authored list, but from the program's
    internal logic. The GM shouldn't always know what's behind the door; some world details
    should surprise the GM too.
    Spec: `roll_on_table` (REQ-213), `generate_encounter` (REQ-091), player signals
    (REQ-069), §5.7 (determinism), §5.8 (narrative control).
    Benchmark: Mythic GME's oracle — ask a yes/no question, set likelihood, roll against odds,
    interpret. Ironsworn's "Ask the Oracle" move — generate an answer from a likelihood
    table. Solo RPGs use oracles because there's no human GM to decide; Holonovel has an AI
    GM, but the AI doesn't always *know* what should happen either.
    Research: Should Holonovel provide an `ask_oracle(question, likelihood)` tool as
    infrastructure — deterministic and seedable per REQ-050? Should enrichment supply
    genre-specific oracle tables (noir odds tables, dungeon likelihood tables)? Is there a
    risk that an oracle tool creates ambiguity — "who's driving, the AI GM or the dice?" —
    and if so, should the oracle be positioned as a GM-input aid rather than a narrative-
    resolution mechanic? How does Mythic GME's fate chart (chaos factor + odds) map to
    Holonovel's deterministic PRNG requirements?
    Score: 15 (fidelity=2, friction=3, safety=0). Cplx: 2, Coupling: 1.
    Risk: Low — the oracle is a tool the GM *chooses* to use. The worst case is an unused
    tool. However, if the oracle is poorly designed, GMs might use it to replace the AI GM's
    narrative judgment, creating a disjointed experience where some scenes are AI-narrated
    and others are dice-resolved with no consistent voice.

17. [RESEARCH] Adventure ecosystem discoverability — browse, preview, and catalog adventures
    (GM-facing).
    Holodeck: *The Big Goodbye* (TNG 1x12) — Picard knows "Dixon Hill" exists. He doesn't
    need to remember a slug or file path. The computer has a browsable catalog of programs,
    each with a description, genre, and premise visible before loading.
    Spec: `load_adventure(slug)` (REQ-079), Appendix K (adventure module format), §5.9
    (Novel persistence), `list_novels` (REQ-257).
    Benchmark: World Anvil's world browser — searchable, filterable by genre, theme, and
    complexity. Minecraft's world selection screen — thumbnail, name, last played, game
    mode. Foundry VTT's compendium browser with preview panes before import.
    Research: Should Holonovel provide a `list_adventures` or `browse_adventures` tool
    returning adventure metadata (slug, title, premise, genre tags, room count, NPC count,
    complexity estimate) without loading? Should adventure modules carry a `preview` field
    — a 2-3 sentence GM-facing premise — in their format spec (Appendix K)? Should
    `spec_health` report the adventure catalog count? How do VTT compendium browsers handle
    preview without full load — what metadata is essential for the browse decision?
    Score: 18 (fidelity=3, friction=3, safety=1). Cplx: 2, Coupling: 1.
    Risk: A GM has three adventure modules in `TTRPG_ADVENTURE` but can only load them by
    remembering exact slugs from a directory listing. They can't browse premises, filter by
    genre, or preview complexity before loading. Adventure discovery is a filesystem
    operation, not a Holodeck interaction. The GM loads an adventure blind, discovers it
    doesn't fit their campaign, ends it, and repeats — wasting setup time and eroding trust
    in the adventure system.

18. [RESEARCH] Genre and tone fidelity enforcement — the world must respect its declared
    genre (GM-facing).
    Holodeck: *The Killing Game* (VOY 4x18-19) — a WWII simulation stays in-genre. No one
    casts fireball. *The Big Goodbye* (TNG 1x12) — the noir detective program doesn't become
    a fantasy quest. The Holodeck respects the program's declared reality and generates
    content within its constraints.
    Spec: `set_scene_type` (combat/social/exploration/neutral), `set_narrative_directive`
    (REQ-081), `player_signal` tone (REQ-069), `generate_adventure` (REQ-090),
    `generate_encounter` (REQ-091), §5.8 (narrative control).
    Benchmark: AI Dungeon's world/genre settings constrain generation. Ironsworn's setting
    truths define what's possible — magic exists or it doesn't, the dead walk or they rest.
    Solo RP tools that ask "what genre?" before generating any content. Live tabletop GM
    quit moment: "The generated encounter doesn't match my campaign's tone."
    Research: Should Holonovel accept a genre declaration (`noir`, `high_fantasy`,
    `sci_fi_horror`, `sword_and_sorcery`) that filters encounter tables, NPC generation,
    and lore suggestions? Should `generate_encounter` respect the active Novel's declared
    genre — rejecting a dragon encounter in a noir detective story? Should enrichment
    templates carry genre tags so community content is filtered appropriately? Can the genre
    system integrate with narrative voice profiles (REQ-226) — "noir" activating noir-
    appropriate voice conventions?
    Score: 16 (fidelity=3, friction=2, safety=0). Cplx: 3, Coupling: 2.
    Risk: A GM declares a noir detective story, runs `generate_encounter`, and gets a wizard
    and a dragon because the ruleset's encounter tables don't filter by genre. The GM
    manually overrides every generated element. After three genre-violating generations, the
    GM stops using generation tools entirely and builds encounters manually — defeating the
    purpose of having generative tools.

19. [RESEARCH] Connected-knowledge graph — linked web of references with GM/player
    visibility toggle (GM-facing).
    Holodeck: In *Our Man Bashir* (DS9 4x10), the transporter stores crew patterns as
    Holodeck characters. Real people ARE the NPCs — with histories, relationships, and
    secrets. The Holodeck knows which characters know each other, who has secrets from whom,
    and what information each character possesses. The AI must track what the player knows
    and doesn't know to avoid leaking secrets.
    Spec: `set_relationship` / `get_relationships` (REQ-020, Narrative > Cast & Characters),
    `set_secret` / `reveal_secret` / `check_knowledge` (REQ-020, Narrative > World State),
    REQ-075 (named NPCs), REQ-077 (personality), §5.8 (lore and narrative memory).
    Benchmark: World Anvil's article linking — click an NPC to see every article they appear
    in. Obsidian's graph view and backlinks — surface connections you didn't know existed.
    Both tools have GM-only vs. player-visible toggles, ensuring the GM can build a rich
    world while controlling what the player sees.
    Research: Should Holonovel provide a `graph://novel` resource returning the full
    entity-relationship graph with hat-filtered visibility? Should `hat_briefing` include a
    `knowledge_state` section showing what the active entity currently knows (revealed
    secrets, known NPC relationships)? Should the AI GM be able to query "what does the
    player know about X?" before narrating to prevent accidental secret leakage? How do
    World Anvil's visibility toggles map to Holonovel's hat model — should every lore entry,
    NPC field, and relationship carry a `visibility` field (gm_only / shared /
    player_discovered)?
    Score: 18 (fidelity=3, friction=3, safety=1). Cplx: 3, Coupling: 3.
    Risk: An AI GM describes the innkeeper as "secretly a cultist" in narration because the
    lore entry said so — but the player hadn't discovered that yet. The secret is leaked,
    the mystery is ruined, and the GM realizes the server has no mechanism to prevent this.
    Without a knowledge-graph surface, the AI GM can't answer "what does the player know?"
    before narrating, making every secret a ticking leak.

## Builder

Build-process items scored on reproducibility/diagnosability/efficiency.
Score = (reproducibility × 3) + (diagnosability × 2) + (efficiency × 2).
Sequence by (cplx + coupling) ascending within tier.

**Tier B1 — Score ≥ 28.** Block handoff or cause silent defects.
**Tier B2 — Score 19–27.** Slow iteration, waste tokens, degrade build quality.
**Tier B3 — Score ≤ 18.** Build-QoL, does not block.

B1. [RESEARCH] Cross-model audit sufficiency — define what makes a cross-model audit
    rigorous vs performative (builder-facing).
    Spec: §6.5.2 (cross-model audit), §6.5 (verification and convergence), §6.6 (the
    Gauntlet).
    Benchmark: Security audit standards — a checklist audit ("did you look at X?") vs. a
    penetration test ("here's the evidence X was tested"). Code review standards — "LGTM"
    vs. a review that identifies specific lines and proposes alternatives.
    Research: What makes a cross-model audit sufficient? Should the auditor produce findings
    with REQ citations and specific discrepancies, not general assessments? Should the
    auditor be required to run a subset of the Gauntlet against the model under audit, not
    just read the extraction output? Does the spec need a minimum finding count, a minimum
    REQ coverage threshold, or a "no findings is a red flag" rule? When two models disagree,
    what's the resolution protocol — which model is authoritative, and is the disagreement
    recorded as a permanent finding?
    Score: 21 (reproducibility=4, diagnosability=2, efficiency=1). Cplx: 2, Coupling: 2.
    Risk: The cross-model auditor produces "extraction looks complete, no issues found" for a
    ruleset where an entire spell level is missing. The builder accepts the audit as sufficient,
    ships the build, and the player discovers the gap at runtime. The audit was performed but
    provided no actual verification — it was performative, not rigorous. Without sufficiency
    criteria, every cross-model audit passes by default.

B2. [RESEARCH] Gauntlet failure debuggability — when verification fails, the builder gets a
    traceable diagnosis (builder-facing).
    Spec: §6.6 (the Gauntlet), §8 (verification workflows), §6.5 (verification and
    convergence).
    Benchmark: CI/CD pipelines with structured failure reports — which gate failed, which
    REQ was violated, which test case produced the mismatch, and what the expected vs actual
    output was. A pass/fail result without traceability is a broken pipeline.
    Research: When the Gauntlet fails a golden transcript replay (Gate 2), does the builder
    receive enough information to diagnose the failure — expected output, actual output,
    diff, and the REQ/test citation — or does it get a binary pass/fail? Should Gauntlet
    failures produce structured diagnostics (gate name, failing test ID, REQ citation,
    expected vs actual) rather than conversational summaries? Should the convergence loop
    (§6.5) produce a traceable audit trail linking each convergence iteration to the
    specific REQ or test it addressed?
    Score: 27 (reproducibility=4, diagnosability=4, efficiency=2). Cplx: 3, Coupling: 2.
    Risk: Golden transcript replay fails. The builder sees a conversation about what might
    be wrong, guesses at a fix, re-runs, fails again. Three iterations later the root cause
    is identified — a parameter schema mismatch — that a structured diagnostic would have
    surfaced on the first failure. Token budget is wasted, the build takes twice as long,
    and the builder's confidence in the Gauntlet erodes.

B3. [RESEARCH] Incremental ruleset rebuild — rulebook changes trigger re-extraction only of
    changed sections (builder-facing).
    Spec: §6.3 (discovery), §6.7 (spec-driven updates), REQ-044 (content hash), §6.2
    (intake).
    Benchmark: Incremental compilation — change one source file, recompile only that unit
    (make, ninja, tsc --incremental). Without incrementality, every ruleset change triggers
    a full rebuild with full token cost.
    Research: When the spec-driven update workflow (§6.7) handles a ruleset change rather
    than a spec change, can the builder detect which sections changed (via content hashes
    per heading) and re-extract only those? Should the ruleset content hash (REQ-044) be
    computed per-section to enable targeted re-extraction? What's the token cost of a full
    rebuild vs. an incremental one for a ruleset adding one new spell or class — is the
    efficiency delta worth building incremental extraction?
    Score: 23 (reproducibility=3, diagnosability=1, efficiency=5). Cplx: 3, Coupling: 2.
    Risk: A ruleset adds one new spell. The builder re-extracts the entire 200-page ruleset,
    re-verifies every fixture, and re-runs the full Gauntlet — consuming 80% of the token
    budget for a 0.1% content change. Over multiple ruleset updates, the cumulative waste
    makes the build economically unsustainable for actively maintained rulesets.
