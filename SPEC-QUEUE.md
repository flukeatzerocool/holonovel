# Spec-engineering queue

Living tracker for every feature, subsystem, and convention in holonovel.md —
inventoried, scored for player/GM friction, and queued for research-driven
improvement. Each item includes a domain research question drawn from text
adventure design, Inform 7 patterns, and competitive solo RPG tools.

**Mission.** Use research gained in the pipeline to inform how Holonovel works,
so players and Game Masters can use it with as little friction as possible.
The ruleset is tabletop, but text adventures and parser IF have decades of
hard-won lessons about state, narrative, and discoverability.

**Scoring.** Items are ranked by user impact, not internal spec health.
`Score = (friction × 5) + (criticality × 3) + (frequency × 2)` (range 10–50).

| Axis        | 1                         | 3                            | 5                              |
|-------------|---------------------------|------------------------------|--------------------------------|
| Friction    | Transparent to user       | Occasional workaround needed | Every session breaks here      |
| Criticality | Failure unnoticeable      | Inconvenience, playable      | Unplayable game                |
| Frequency   | Rarely (once per campaign)| Most sessions                | Every turn / every scene       |

Complexity and coupling are recorded separately for sequencing within a tier
— simpler, less-coupled items go first.

**Tiers.**

- **Tier 1 — Player/GM-critical.** Score ≥ 35. Break these and the game stops.
- **Tier 2 — Important UX.** Score 25–34. Break these and play degrades.
- **Tier 3 — Quality-of-life.** Score ≤ 24. Noticeable but non-blocking.

**Item format.**

```
N. [STATE] Feature name (player/GM-facing).
   Spec: REQ-XXX, §Y.Z.
   Research: [Text adventure / Inform 7 question] | [Benchmark against LoreKeeper, AI Dungeon, or Mythic GME]
   Score: NN (friction=N, crit=N, freq=N). Cplx: N, Coupling: N.
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

Tier 1 — Score ≥ 35. Break these and the game stops. Sequence by (cplx + coupling) ascending.

   Spec: REQ-043, REQ-124, Gauntlet S3–S5.
   Research: Inform 7's turn-based action model — how does the parser-sequence "before/check/carry out/after/report" rule ordering compare to Holonovel's round-tracking and condition lifecycle? Are there Inform patterns for handling "the player pressed Attack but should have moved first"?
   Benchmark: LoreKeeper's real-5e initiative tracking vs ChatGPT's freeform combat narration. Where does Holonovel's structured combat fall on the agency-vs-narration spectrum?
   Score: 50 (friction=5, crit=5, freq=5). Cplx: 4, Coupling: 4.

2. [DONE] Error handling & corrective actions — status prefixes, error taxonomy, "Did you mean?", corrective action line.
   Spec: REQ-001, REQ-002, REQ-002a–c, REQ-001a–b, REQ-064.
   Research: Text adventures' "guess the verb" problem — when the player types `>OPEN DOOR` but the parser only understands `>USE KEY ON DOOR`, the error message IS the UX. What error-message design patterns from IF parsers (Inform's parser messages, TADS's disambiguation) improve discoverability?
   Benchmark: When ChatGPT/Claude misinterprets a player command in a solo RPG session, what does the user do? How verbose should error messages be to recover 1-shot?
   Score: 42 (friction=4, crit=4, freq=5). Cplx: 3, Coupling: 3.

3. [DONE] Dice rolling & transparency — full calculation path, modifier sources, advantage/disadvantage faces, result bands.
   Spec: REQ-003.
   Research: Inform 7's dice and randomness model — how does `random` and seed-based generation in IF affect player trust in outcomes? Players in text adventures expect deterministic replay; does Holonovel's seeded RNG satisfy the same contract?
   Benchmark: LoreKeeper's "show the math" approach vs AI Dungeon's narrated outcomes with no math. For tactical play, how much calculation visibility is the right balance before it becomes noise?
   Score: 42 (friction=4, crit=4, freq=5). Cplx: 2, Coupling: 2.

4. [DONE] State persistence & Novel file — atomic writes, backup recovery, checksum, .trash retention, restart survival.
   Spec: REQ-092, REQ-088, REQ-093, REQ-095, REQ-097, REQ-117, REQ-065.
   Research: Inform 7's save/restore model — text adventures pioneered game-state persistence for interactive fiction. What UX lessons from save-file management (autosave, named saves, save-corruption recovery) apply to Holonovel's single-Novel-per-file model?
   Benchmark: The multi-LLM pipeline article's "Google Docs as vault of truth" pattern — NotebookLM's document-backed persistence vs Holonovel's disk file. Is a single JSON file enough, or do players need structured recovery?
   Score: 41 (friction=4, crit=5, freq=3). Cplx: 4, Coupling: 5.

5. [DONE] Character creation & import — step-by-step decisions, quick-create, roster import, undo after creation, Novel-scoped.
   Spec: REQ-042, REQ-056, REQ-104, REQ-151.
   Research: Inform 7's character definition model — how do IF games define the player character vs NPCs? What lesson does the IF convention of "the player IS the protagonist" offer for Holonovel's roster-vs-Novel entity model?
   Benchmark: LoreKeeper's "under 2 minutes to first scene" vs Mythic GME's manual stat generation. Where does Holonovel's guided creation fall? Can a player go from idea to playing in <5 minutes?
   Score: 41 (friction=4, crit=5, freq=3). Cplx: 4, Coupling: 3.

6. [DONE] Novel creation & lifecycle — create, resume, end, switch, confirmation workflow.
   Spec: REQ-088, REQ-092, REQ-093, REQ-095, REQ-097, REQ-117, REQ-055.
   Research: Text adventures' title-screen and session management — how do IF interpreters handle "new game vs continue"? What patterns for session management (auto-resume, multiple save slots, "are you sure?" on overwrite) produce the least friction?
   Benchmark: LoreKeeper's campaign persistence (database-backed, pick up where you left off) vs AI Dungeon's story list. What does Holonovel's create_novel/resume_novel/switch_novel UX feel like in comparison?
   Score: 41 (friction=4, crit=5, freq=3). Cplx: 3, Coupling: 5.

7. [DONE] Snapshots, undo, redo — clearing on new mutation, persistence across restarts, pending-workflow blocks.
   Spec: REQ-041, REQ-116.
   Research: Inform 7's UNDO command — it's the most-used debugging tool in IF play. How do players expect undo to work (one step? unlimited? across save/load?)? Does Holonovel's snapshot-per-mutation model meet player expectations for "oops, that wasn't what I meant"?
   Benchmark: No competitor AI GM tools publicly offer undo (they rely on "edit previous message" in chat UI). Holonovel's server-side undo is a competitive differentiator — verify it feels reliable in practice.
   Score: 38 (friction=3, crit=5, freq=4). Cplx: 3, Coupling: 4.

8. [DONE] Hat switching & briefing — set_hat enforcement, briefing content per hat, decision-critical boundary.
   Spec: REQ-031, REQ-032, REQ-066, REQ-109, REQ-135, REQ-055.
   Research: Inform 7's player-vs-narrator separation — IF has no explicit hat system, but the parser enforces a strict boundary between what the player can do and what the world reports. Does Holonovel's hat model create any friction where the player "feels like they should be able to" but are blocked by the GM hat?
   Benchmark: Solo RPG guide's "stay in player headspace" principle — the AI handles rolls so the player doesn't wear the GM hat. Does Holonovel's hat switching feel seamless or jarring when the player needs to switch hats mid-session?
   Score: 37 (friction=3, crit=4, freq=5). Cplx: 3, Coupling: 4.

## Core play surface

Tier 2 — Score 25–34. Important UX; degrades play if broken. Sequence by (cplx + coupling) ascending.

10. [DONE] Action suggestions — mapping player intent to ruleset-legal tools, enrichment patterns.
    Spec: REQ-084, REQ-087, REQ-015, enrichment action patterns.
    Research: The "guess the verb" problem is the defining UX failure of parser IF. When a player knows what they want their character to do but can't find the right tool, how does suggest_actions compare to Inform's disambiguation messages and TADS's hint system? What makes a suggestion feel helpful vs patronizing?
    Benchmark: ChatGPT/Claude as GM — players type natural language and the AI translates to mechanics. Holonovel's suggest_actions inverts this: the tool tells the player what's possible. Which direction produces more agency?
    Score: 32 (friction=3, crit=3, freq=4). Cplx: 3, Coupling: 2.

11. [DONE] Rules lookup — spells, equipment, classes, monsters, "Did you mean?", canonical resolution.
    Spec: REQ-057, REQ-059, REQ-060, REQ-061, REQ-112, REQ-184, REQ-185, REQ-186.
    Research: Inform 7's object examination — in IF, `>EXAMINE SWORD` returns the object's description. The parser disambiguates ambiguous nouns. What patterns from IF's object model (properties, relations, synonyms) improve Holonovel's lookup UX when a player searches for "fireball" vs a GM searching for "lich stat block"?
    Benchmark: D&D Beyond's search-as-you-type with rich result previews vs Holonovel's MCP-tool-based lookup. The output format needs to be scannable at a glance — how do solo players actually consume lookup results mid-session?
    Score: 32 (friction=3, crit=3, freq=4). Cplx: 2, Coupling: 2.

12. [DONE] Rules search — query matching, context snippets, relevance ordering, configurable display limit.
    Spec: REQ-111, REQ-113, REQ-004.
    Research: Text adventures don't have a "search the rulebook" equivalent — the player is IN the world. But IF design emphasizes that all information should be discoverable through interaction, not external reference. Does Holonovel's search_rules feel like breaking character to look something up, or does it feel like asking the GM "what do I know about trolls?"
    Benchmark: NotebookLM's document-query RAG pattern (ask questions against a fixed corpus) vs Holonovel's indexed search. When a player asks "how does grappling work?", is the experience closer to a search engine or a GM answering a question?
    Score: 32 (friction=3, crit=3, freq=4). Cplx: 2, Coupling: 2.

13. [DONE] Briefing composition — ordered section groups, GM-overridable ordering, truncation priority, empty-source omission.
    Spec: REQ-109, REQ-082, REQ-062, REQ-063, REQ-070, REQ-071, REQ-135, REQ-118.
    Research: Inform 7's room description model — a room description is the canonical IF briefing: what you see, what's here, where you can go. Does the IF convention of "brief but evocative" vs "exhaustive" room descriptions inform how Holonovel's hat_briefing should balance completeness against attention budget?
    Benchmark: The multi-LLM pipeline's "Previously On…" recap (2-3 paragraphs, under 300 words) — how does Holonovel's briefing length compare to what solo players actually read before acting?
    Score: 31 (friction=3, crit=3, freq=4). Cplx: 3, Coupling: 4.

14. [DONE] NPC management — create, update, remove NPCs; personality, disposition, location, voice examples.
    Spec: REQ-075, REQ-077, REQ-119, REQ-126, REQ-127, REQ-167.
    Research: The IF article's criticism: "99% of text adventures have no characters." Inform 7's NPC model is notoriously difficult — actions by non-player characters require explicit rules. What designs from the few IF games with compelling NPCs (Galatea, The Hitchhiker's Guide) make NPCs feel alive vs cardboard cutouts? How does Holonovel's voice_examples + personality fields stack up?
    Benchmark: AI Dungeon's freeform NPC generation (any character exists when you mention them) vs LoreKeeper's structured NPC database. Holonovel's GM-create-then-interact model — does it feel like work or worldbuilding?
    Score: 30 (friction=3, crit=3, freq=3). Cplx: 3, Coupling: 3.

15. [DONE] Help system & tool discoverability — categorized task map, query search, GM-customizable categories, hat-filtered.
    Spec: REQ-067.
    Research: Text adventures' HELP command — the player types HELP and gets... what? The standard IF HELP is notoriously unhelpful ("Try LOOK, EXAMINE, GO NORTH"). What does a good IF help system look like, and how does Holonovel's categorized tool index compare?
    Benchmark: ChatGPT's "you can ask me to..." prompt vs LoreKeeper's structured tool palette. How does Holonovel's help help a player who doesn't know what they can do yet?
    Score: 30 (friction=3, crit=3, freq=3). Cplx: 2, Coupling: 2.

16. [DONE] Player signals — pace, difficulty, tone, focus, boundary; GM briefing section with age delta.
    Spec: REQ-069, REQ-128, REQ-173.
    Research: Text adventures have no explicit "difficulty" or "tone" signal — the game IS the tone. But in tabletop, signaling is how the player and GM negotiate experience. How do solo RPG tools (oracles, GM emulators) handle the equivalent of "this is getting boring, change something" without the player having to break character?
    Benchmark: ChatGPT as GM — players often type out-of-character notes like "(can we make this harder?)". Is Holonovel's structured signal system (discrete values per axis) better or worse than freeform communication?
    Score: 30 (friction=3, crit=3, freq=3). Cplx: 2, Coupling: 2.

17. [DONE] Personality & voice examples — entity personality fields, dialogue snippets, ruleset-native mapping, briefing rendering.
    Spec: REQ-077, REQ-126, REQ-127, REQ-165, REQ-166, REQ-167.
    Research: Inform 7's description model — every object has a `description` property. Characters in IF are defined by what they say (conversation topics) and what the parser reports about them. How does the IF community's approach to character voice (dialogue trees, topic-based conversation) compare to Holonovel's voice_examples + personality fields?
    Benchmark: AI Dungeon's memory/author's note for tone vs Holonovel's structured personality. Which produces more consistent character behavior over a long campaign?
    Score: 29 (friction=3, crit=2, freq=3). Cplx: 2, Coupling: 2.

18. [DONE] Audit log — append-only, tamper-evident, chain verification, compress_audit for LLM summarization.
    Spec: REQ-040, REQ-086, REQ-168, REQ-169.
    Research: Text adventures don't maintain audit logs — but roguelikes do (NetHack's ttyrec, DCSS's morgue files). What does the roguelike community's approach to session replays teach about audit log utility for post-session review vs real-time debugging?
    Benchmark: No competitor AI GM tools offer audit logs. This is a unique Holonovel feature — but only valuable if players/GMs actually use it. What would make audit logs feel useful rather than noise?
    Score: 28 (friction=2, crit=4, freq=3). Cplx: 4, Coupling: 3.

19. [DONE] Session recap — structured summary, hat-filtered, configurable N, entity states, roll history.
    Spec: REQ-072, REQ-174, REQ-175.
    Research: Text adventures' transcript/scrollback — IF players re-read the transcript to remember what happened. But in IF, the transcript IS the game state. In Holonovel, the recap synthesizes a session. How should a recap balance completeness (every roll) against narrative coherence (the important beats)?
    Benchmark: The multi-LLM pipeline's NotebookLM "Previously On…" (300-word summary) vs Holonovel's structured recap with 14 named fields. Is Holonovel's recap too detailed, too sparse, or just right for session-to-session continuity?
    Score: 27 (friction=2, crit=3, freq=4). Cplx: 3, Coupling: 4.

20. [DONE] Scene setting — description, location, scene_type tagging, transition hooks.
    Spec: REQ-087, REQ-183.
    Research: Inform 7's room model — the room is the fundamental unit of IF. Every room has a description, exits, and contents. How does the IF convention of "describe the room on first entry, summarize on return" inform Holonovel's scene-state model? Should scene descriptions be long-form on first visit and condensed on repeat?
    Benchmark: AI Dungeon's freeform scene generation (every input produces a new scene) vs LoreKeeper's structured scene management. Holonovel's set_scene_state + set_scene_type — is it a GM tool or a storytelling aid?
    Score: 27 (friction=2, crit=3, freq=4). Cplx: 2, Coupling: 3.

21. [DONE] Multi-entity support — roster holds multiple, active_entity switching, party listing, import_character.
    Spec: REQ-074.
    Research: Inform 7's player-character is singular — the parser assumes "you" = one actor. Multi-character IF is rare and awkward. What lessons from party-based IF experiments (e.g., "you are the party leader, companions follow") apply to Holonovel's multi-entity model where one player controls multiple characters?
    Benchmark: LoreKeeper's party management (one player, one character sheet at a time) vs pen-and-paper where you might run a full party. Does Holonovel's multi-entity support feel natural or like admin overhead?
    Score: 27 (friction=2, crit=3, freq=4). Cplx: 2, Coupling: 3.

    Spec: REQ-042, REQ-056, REQ-104, REQ-140, REQ-151, REQ-152.
    Research: Inform 7's "ask/tell/topic" conversation model — IF dialogue works via decision-like branching. What patterns from IF dialogue systems (ASk/Tell, menu-based choice) map to Holonovel's [NEED_INPUT] decision workflow? Do players prefer typed responses or enumerated choices?
    Benchmark: LoreKeeper's character creation wizard (guided steps) vs ChatGPT's freeform character creation (describe your character). Does Holonovel's decision-queue model feel like a form to fill out or a conversation?
    Score: 26 (friction=2, crit=3, freq=3). Cplx: 3, Coupling: 3.

23. [DONE] Countdown management — set, advance, remove countdowns; round/narrative types; on_scene_transition hooks.
    Spec: REQ-073, REQ-125, REQ-130.
    Research: Inform 7's "every turn" rules — the IF equivalent of countdowns is the turn-based rule evaluation (before/after rules, timed events). How does IF's "the lamp goes out in 5 turns" pattern compare to Holonovel's narrative countdowns? What makes a countdown feel like dramatic pressure vs an ignored mechanic?
    Benchmark: No AI GM tool has explicit countdown mechanics. This is Holonovel-unique — derived from PbtA clocks and FitD timers. Does it translate well to a text-based solo experience?
    Score: 25 (friction=2, crit=3, freq=3). Cplx: 2, Coupling: 2.

24. [DONE] Intake & build config — workflow selection, build profiles, config verification, viability pre-check.
    Spec: REQ-101, REQ-161, REQ-162, REQ-163, REQ-164, §6.2.
    Research: Inform 7's IDE (the Inform application) provides project setup, extension management, and testing. How does the IF authoring-tool UX (project creation, material organization, "go" to test) inform Holonovel's intake Q&A? Is a batch questionnaire the right UX for starting a build?
    Benchmark: No comparable self-building tool exists. Holonovel's build-from-scratch workflow is unique — but the operator experience (answering 10+ questions upfront) should feel guided, not bureaucratic.
    Score: 26 (friction=3, crit=3, freq=1). Cplx: 2, Coupling: 2.

25. [DONE] Hat foundations & anti-slop — ruleset-agnostic best practices, forbidden narrative patterns, corrected alternatives.
    Spec: REQ-062, REQ-070, REQ-184, REQ-159, Appendix J.
    Research: Inform 7's Standard Rules — the built-in world model that every IF game inherits. IF authors override defaults; Holonovel's hat foundations are the equivalent of the Standard Rules for AI narration. What patterns from "best practice" IF authoring (Emily Short's writing advice, Aaron Reed's design patterns) translate to anti-slop guidance for AI GMs?
    Benchmark: ChatGPT-as-GM prompt templates include "don't default to clichés" guardrails. Holonovel's anti-slop system is richer (Appendix J synopsis + enrichment). Does it prevent "the villain monologues" and "it was all a dream" as effectively as a bespoke prompt?
    Score: 27 (friction=2, crit=3, freq=4). Cplx: 2, Coupling: 2.

26. [DONE] Verbose output — comprehensive fields, ruleset baseline format, no summaries, all derived statistics.
    Spec: REQ-060, REQ-004a, REQ-181.
    Research: Inform 7's `SHOWME` debugging command — it dumps every property of every object in scope. Verbose output is useful for debugging but overwhelming for play. How do IF games balance "tell me everything about the sword" vs "the sword is sharp"? What's the right level of detail for different player types (tactical vs narrative)?
    Benchmark: D&D Beyond's stat block format vs Holonovel's tool output. When a player looks up "fireball," should they see casting time + range + components + damage + saving throw + at-higher-levels, or just "8d6 fire damage, Dex save"?
    Score: 27 (friction=2, crit=3, freq=4). Cplx: 1, Coupling: 1.

27. [DONE] Source quoting — verbatim Markdown excerpt, `<file>#<anchor>` label, `---` separator.
    Spec: REQ-061, REQ-194.
    Research: Text adventures don't cite sources — they ARE the source. But IF documentation and hint systems (InvisiClues, built-in hints) use progressive disclosure: hint 1 is vague, hint 3 gives the answer. Should Holonovel's source quoting follow a progressive model (expand on request) or always be full?
    Benchmark: D&D Beyond's "View Source" links vs printed rulebook page references. In a solo play session, does the player want to verify the rule or just trust the GM?
    Score: 27 (friction=2, crit=3, freq=4). Cplx: 1, Coupling: 2.

28. [DONE] Narrative directive — set standing narration instruction, GM-only, hat_briefing integration.
    Spec: REQ-081.
    Research: Inform 7's "story description" and "table of initial states" — the IF equivalent of a narrative directive is the game's introductory text and the initial room description. How do IF games set tone and establish stakes in the first screen? What makes an opening directive effective vs skippable?
    Benchmark: ChatGPT-as-GM session-start prompts ("This session is a tense horror mystery") vs Holonovel's formal directive. Does the GM actually use this, or is it a feature that sits unused?
    Score: 25 (friction=2, crit=3, freq=3). Cplx: 1, Coupling: 2.

29. [DONE] Character sheet rendering — markdown and ASCII formats, ruleset-native fields, hat-filtered.
    Spec: REQ-060, REQ-004a.
    Research: Inform 7's INVENTORY command — the IF character sheet is what you're carrying. The INVENTORY output must be scannable at a glance. How does IF inventory format (plain list, grouped by category, "you are carrying:") inform Holonovel's character sheet rendering for quick reference mid-play?
    Benchmark: D&D Beyond's interactive character sheet vs LoreKeeper's inline stat display. Holonovel's character_sheet tool renders a snapshot — does it need to be refreshed, or is it consumed once per scene?
    Score: 27 (friction=2, crit=3, freq=4). Cplx: 2, Coupling: 2.

## Infrastructure & polish

Tier 3 — Score ≤ 24. Quality-of-life and build-time infrastructure. Sequence by (cplx + coupling) ascending.

30. [DONE] Lore management — create, update, remove, toggle, groups, keyword triggers, hat_scope, priority, sticky.
    Spec: REQ-083, REQ-130, REQ-155.
    Research: Inform 7's 'scenery' and 'backdrop' objects — in IF, a window is scenery: it's there, you can examine it, but you can't take it. Lore in Holonovel is the equivalent: inert state that triggers narrative context. What IF patterns for "things the player needs to know about but not interact with" improve Holonovel's lore trigger UX? Do keyword-triggered lore entries fire too often or not enough?
    Benchmark: No competitor has keyword-triggered lore. This is Holonovel-unique. Does dynamic lore feel like the GM remembering relevant details, or like pop-up ads?
    Score: 24 (friction=2, crit=3, freq=3). Cplx: 3, Coupling: 4.

    Spec: REQ-010, REQ-011, REQ-012, REQ-015, REQ-016, REQ-017, REQ-018, REQ-099, REQ-100, REQ-147, REQ-194, §6.3.
    Research: Inform 7's world-model compilation — the compiler reads source text and builds an internal model of rooms, objects, relations, and rules. How does Inform's compilation pipeline (scan → parse → resolve → generate) compare to Holonovel's discovery → extraction → construction? What compilation errors (undefined objects, ambiguous references) are analogous to discovery defects?
    Benchmark: No comparable AI-build tool exists. Discovery quality determines whether the server even works — but it's a build-time concern, not a runtime UX concern.
    Score: 24 (friction=2, crit=4, freq=1). Cplx: 5, Coupling: 5.

    Spec: §6.5, REQ-099, REQ-100.
    Research: Inform 7's "Problem" messages — the compiler reports specific, actionable errors with source locations. How does Inform's error-reporting philosophy (be specific, cite the source line, suggest a fix) inform Holonovel's convergence loop? Should convergence findings read like compiler errors or like code review comments?
    Benchmark: No comparable self-auditing tool exists. Convergence quality is invisible to players but determines whether the server is trustworthy.
    Score: 24 (friction=2, crit=4, freq=1). Cplx: 5, Coupling: 5.

33. [FAILED] Gauntlet — 23 sub-workflows, blocking classification, convergent handshake, regression assertions.
    Spec: §6.6, REQ-108, REQ-141, REQ-142.
    Research: Inform 7's "TEST" command — IF authors write test scripts (`test me with "n / e / take lamp / light lamp / n"`) and replay them to verify behavior. How does IF's regression-testing pattern (declare inputs, assert outcomes) compare to Holonovel's Gauntlet sub-workflows? What makes a test feel like it covers the right things?
    Benchmark: No comparable automated game-testing tool exists for TTRPG servers. The Gauntlet is Holonovel-unique — does its 23-scenario coverage give confidence, or does it miss edge cases a human tester would catch?
    Score: 24 (friction=2, crit=4, freq=1). Cplx: 5, Coupling: 4.

34. [DONE] Lore import/export — dry-run, merge, replace; round-trip identity.
    Spec: REQ-094, REQ-096, Appendix L, Q.
    Research: Inform 7's extension model — IF authors share libraries of rooms, objects, and rules via extensions. What patterns from IF's extension ecosystem (discoverability, versioning, compatibility) apply to Holonovel's lorebook interchange format?
    Benchmark: No competitor has lorebook interchange. Export/import is inherently a power-user feature — does it need to be polished for casual players, or is the GM the target audience?
    Score: 13 (friction=1, crit=2, freq=1). Cplx: 2, Coupling: 2.

35. [DONE] Novel import/export — dry-run, merge, replace; round-trip identity.
    Spec: REQ-094, REQ-096.
    Research: Inform 7's save-file format (glulx save states) — IF saves are binary blobs, not portable. But the broader game industry has settled on portable save formats. What UX conventions for export/import (confirmation, preview, "this will overwrite...") reduce data-loss anxiety?
    Benchmark: LoreKeeper's campaign export vs AI Dungeon's story sharing. Novel export as interchange makes Holonovel campaign-portable — but do players actually want this, or is it a spec feature without user demand?
    Score: 13 (friction=1, crit=2, freq=1). Cplx: 2, Coupling: 2.

36. [DONE] Enrichment — community play advice, 6 output modules, voice/lore/action patterns/guidance/adventure advice.
    Spec: §11, REQ-080, REQ-103, REQ-114, REQ-115, REQ-130, REQ-155, REQ-158, REQ-159.
    Research: Inform 7's extension ecosystem — community-authored libraries that extend the standard rules. How does IF's model of "install an extension, get new verbs and behavior" compare to Holonovel's enrichment model of "run research, get additive content"? What makes enrichment feel valuable vs. clutter?
    Benchmark: Mythic GME's supplement ecosystem (additional oracles, genre modules). Holonovel's enrichment is closest to "install a content pack" — does the value justify the workflow overhead?
    Score: 13 (friction=1, crit=2, freq=1). Cplx: 4, Coupling: 3.

37. [DONE] Handoff artifacts — DECISIONS.md, README.md, AGENTS.md, LICENSE.md, H1–H14 verification steps.
    Spec: §9, REQ-153, REQ-154.
    Research: Inform 7's "Release" workflow — the compiler generates a publishable game file plus cover art, bibliographic data, and a website. How does IF's release-engineering philosophy (everything needed to play, nothing more) compare to Holonovel's four-artifact handoff? What artifacts do operators actually consult vs ignore?
    Benchmark: No comparable build-handoff exists for AI-generated servers. The handoff is the operator's receipt — does it give confidence, or is it paperwork?
    Score: 16 (friction=1, crit=3, freq=1). Cplx: 4, Coupling: 3.

    Spec: §10.
    Research: Inform 7's "Release for Testing" — the compiler can generate a testable game file that a second person verifies. How does IF's playtesting model (structured test scripts, bug reports) inform Holonovel's independent verification? What makes a verification feel thorough vs perfunctory?
    Benchmark: No comparable self-verifying build exists. Independent verification is Holonovel-unique — it's the final trust layer. Does it catch real defects, or is it ceremonial?
    Score: 16 (friction=1, crit=3, freq=1). Cplx: 3, Coupling: 2.

39. [DONE] Output truncation — configurable limit, output:// pointers, session-local storage, eviction.
    Spec: REQ-004, REQ-179.
    Research: Inform 7's scrolling output — IF games produce text that scrolls past. The convention is pagination (MORE prompt) or transcript file. How do IF pagination conventions (wait-for-key, auto-scroll, scrollback buffer) inform Holonovel's truncation strategy? When is truncation a relief vs a frustration?
    Benchmark: ChatGPT's output truncation (generates in chunks, "continue" to see more) vs Holonovel's output:// pointer model. Which feels more natural for a player who wants "show me the rest of that spell"?
    Score: 20 (friction=2, crit=2, freq=2). Cplx: 2, Coupling: 2.

40. [DONE] Result count reporting — "3 of 42 results" counting, configurable display limit.
    Spec: REQ-113, REQ-004.
    Research: Inform 7 doesn't paginate search results — but library catalogues and search engines do. What UI patterns for "showing N of M results" (pagination, infinite scroll, "load more") inform Holonovel's result count reporting? Is "3 of 42" sufficient, or do players need pagination?
    Benchmark: D&D Beyond's search results grid vs Google's paginated results. In a text-based MCP tool, "3 of 42" is the entire pagination UX — is it discoverable that more results exist?
    Score: 17 (friction=1, crit=2, freq=3). Cplx: 1, Coupling: 1.

41. [DONE] Narrative tone — ruleset-extracted example-of-play snippets, `[narrative-tone]` tagged, hat_briefing.
    Spec: REQ-071.
    Research: Inform 7's "Example" system — the Inform documentation includes hundreds of runnable examples showing how to implement specific mechanics. How does IF's example-driven learning (copy an example, modify it) compare to Holonovel's narrative tone samples (extracted prose that demonstrates the ruleset's voice)?
    Benchmark: ChatGPT-as-GM prompt's "Tone: dry, ironic" directive vs Holonovel's tone samples. Does showing the GM example prose produce better narrative consistency than an abstract tone description?
    Score: 22 (friction=2, crit=2, freq=3). Cplx: 1, Coupling: 2.

42. [DONE] Macros — `{{path}}` token expansion, live state values, nonexistent paths expand literally.
    Spec: REQ-085.
    Research: Inform 7's text substitution (`[the noun]`, `[if dark]`) — IF uses bracketed substitutions for adaptive text. How does IF's rich text-substitution model (conditions, pronouns, adaptive descriptions) inform Holonovel's macro system? Are `{{entity.hp}}` and `{{scene.description}}` the right vocabulary, or should macros support conditionals and formatting?
    Benchmark: No competitor has state-aware macro expansion. Macros feel like a power-user feature — does the typical GM benefit from them, or are they infrastructure without user demand?
    Score: 17 (friction=1, crit=2, freq=3). Cplx: 2, Coupling: 2.

43. [DONE] Adventure loading & generation — load_adventure, adventure:// resources, generate_adventure from premise, generate_encounter.
    Spec: REQ-079, REQ-089, REQ-090, REQ-091, REQ-132, REQ-170, REQ-171, REQ-172.
    Research: Inform 7's "scenes" and "rooms" — IF games are authored as connected rooms with objects, puzzles, and triggers. An adventure module in IF IS the game. How do IF's structural units (room → region → scene) compare to Holonovel's adventure model (module → locations → encounters)? What makes a generated adventure feel authored vs random?
    Benchmark: AI Dungeon's scenario starters vs LoreKeeper's structured campaign modules. Holonovel's generate_adventure is an on-demand worldbuilder — but does the output feel like a scaffold worth building on, or like a Mad Libs version of a module?
    Score: 20 (friction=2, crit=2, freq=2). Cplx: 4, Coupling: 3.

44. [DONE] Spec-driven updates — gap audit, delta classification, scoped Gauntlet, state migration.
    Spec: REQ-098, §6.7.
    Research: Inform 7's "upgrading" — when a new Inform version ships, authors must recompile and fix breaking changes. What patterns from language-upgrade tooling (migration guides, deprecation warnings, automated fixers) apply to Holonovel's spec-driven update workflow? Should spec updates be transparent to the operator?
    Benchmark: No comparable self-updating build tool exists. Spec-driven updates are Holonovel-unique — they determine whether a server stays current or rots. Is the update workflow approachable or intimidating?
    Score: 16 (friction=1, crit=3, freq=1). Cplx: 5, Coupling: 5.

45. [DONE] Guidance surface & resource URIs — guidance:// hierarchy, hat-filtered, inert data, foundations/tone/anti-slop.
    Spec: REQ-016, REQ-022, REQ-105, REQ-109, REQ-159.
    Research: Inform 7's "Index" pane — the IDE provides a browsable index of rooms, objects, actions, and the rulebook. How does IF's design-time index (browse the compiled world) compare to Holonovel's runtime guidance surface (browse the guidance:// resources)? Should guidance be a reference tool or ambient briefing content?
    Benchmark: No competitor has a structured guidance surface distinct from the GM prompt. Holonovel's guidance:// URIs are the "rulebook" of AI narration — does anyone actually read them?
    Score: 22 (friction=2, crit=2, freq=3). Cplx: 2, Coupling: 3.

    Spec: REQ-020, REQ-021, REQ-024, REQ-015, REQ-110, REQ-187.
    Research: Inform 7's action model — every verb (TAKE, DROP, EXAMINE, GO) has a standard behavior that authors customize. How does IF's verb-naming convention (imperative, ruleset-native, discoverable) inform Holonovel's tool-naming? When does roll_skill_check feel mechanical vs attempt_stealth feel immersive?
    Benchmark: MCP tool naming is inherently technical (snake_case, flat namespace). Does the Player ever type tool names directly? If not, naming conventions only affect the LLM's tool selection — not the player.
    Score: 22 (friction=2, crit=2, freq=3). Cplx: 1, Coupling: 3.

47. [DONE] Config surface & state model — 12 env vars, state tiers, Novel property groups, cross-property coupling.
    Spec: §7.6, §7.7, REQ-055, REQ-065, REQ-106, REQ-107.
    Research: Inform 7's "Use options" — global configuration that changes parser behavior (scoring, pronouns, AMUSING victory messages). How does IF's model of "set these at compile time, never touch them during play" compare to Holonovel's runtime environment-variable config? Are environment variables the right config surface for a server, or do they create friction?
    Benchmark: MCP servers typically use env vars (stdio transport). Holonovel's 12 variables are within norm — but does the operator feel confident setting them up, or is config the first point of failure?
    Score: 14 (friction=1, crit=3, freq=1). Cplx: 2, Coupling: 3.

48. [DONE] Prompt composition — 5-source model, live index, state snapshot, truncation budget, required contract elements.
    Spec: REQ-023, REQ-063, REQ-078, REQ-118, §6.4.1.
    Research: Inform 7's adaptive text — the game generates prose at runtime based on state (room darkness, object visibility, NPC presence). How does IF's model of "prose is generated from state, not written" compare to Holonovel's 5-source prompt composition? Should prompts feel pre-written or dynamically assembled?
    Benchmark: ChatGPT-as-GM prompts are static templates. Holonovel's prompts are live-composed from 5 data sources — unique in the space. Does dynamic composition produce better or worse prompts than a curated template?
    Score: 22 (friction=2, crit=2, freq=3). Cplx: 3, Coupling: 4.

49. [FAILED] Condition lifecycle — apply, remove, ruleset triggers, combat integration, expire by mechanics.
    Spec: §5.6 condition tools, REQ-043, Gauntlet S9.
    Research: Inform 7 doesn't have "conditions" in the TTRPG sense — but it has "properties that change over time" (poisoned, lit, open). How does IF's model of mutable object properties compare to Holonovel's condition system? What makes a condition system feel like the rules are being followed vs an invisible spreadsheet?
    Benchmark: LoreKeeper's auto-tracked conditions vs manual condition tracking in ChatGPT play. Holonovel's condition system enforces rules — does it speed up or slow down play compared to freeform narration?
    Score: 22 (friction=2, crit=2, freq=3). Cplx: 2, Coupling: 3.

50. [DONE] Adventure & encounter generation quality — adventure scaffold structure, encounter batch composition, narrative coherence.
    Spec: REQ-090, REQ-091, REQ-132.
    Research: Inform 7's "procedural generation" experiments — the IF community has explored procedural room generation (The Gostak, procedural mazes). What makes procedurally generated IF feel authored vs random? Can a generated adventure scaffold produce the same narrative tension as a hand-authored module?
    Benchmark: AI Dungeon's "start a scenario" vs LoreKeeper's structured campaigns. Holonovel's generation tools produce structural outlines — does the GM find them useful, or do they feel like an AI hallucinating D&D module tropes?
    Score: 20 (friction=2, crit=2, freq=2). Cplx: 4, Coupling: 3.

51. [DONE] Determinism & seedable RNG — per-call seeds, session seeds, identical seed = identical results.
    Spec: REQ-050.
    Research: Inform 7's deterministic RNG — IF uses a seeded PRNG for random events. `random(1, 6)` is reproducible if the seed is known. How does IF's approach to randomness (replay for debugging, seed for sharing) compare to Holonovel's deterministic dice? When does determinism feel like a feature vs a limitation?
    Benchmark: LoreKeeper's server-side RNG vs ChatGPT's freeform dice narration. Deterministic dice enable replay verification — but do players actually want to replay a session, or is this a builder-side feature that doesn't improve play?
    Score: 14 (friction=1, crit=2, freq=1). Cplx: 1, Coupling: 3.

52. [DONE] Input validation & safety — trust nothing client-supplied, parameter canon validation, empty-string handling.
    Spec: REQ-054, REQ-059.
    Research: Inform 7's parser validation — the parser rejects unrecognized verbs, unknown objects, and impossible actions with specific error messages. How does IF's input-validation model (parse → understand → respond) compare to Holonovel's MCP parameter validation? What makes a rejected input feel helpful vs accusatory?
    Benchmark: MCP tools inherently validate parameters. Holonovel's hat-filtered error enumerations add a security layer — does this prevent frustration or create it when a Player can't see something they "know" exists?
    Score: 22 (friction=2, crit=2, freq=3). Cplx: 1, Coupling: 3.

53. Table rolling — generation tables (trinkets, names, etc.), ruleset-derived content, deterministic seeds.
    Spec: roll_on_table tool, Appendix generation tables.
    Research: Inform 7's "table" data structure — IF has built-in table lookups that can be random or sequential. How does IF's table model (define the table, then `choose row` or `random row`) compare to Holonovel's roll_on_table? What makes random tables feel like a game mechanic vs filler content?
    Benchmark: Mythic GME's oracle tables vs AI Dungeon's freeform generation. Holonovel's table rolling is mechanical (dice + ruleset content) — does it produce more consistent results than freeform generation, or does it feel constrained?
    Score: 20 (friction=2, crit=2, freq=2). Cplx: 1, Coupling: 1.

54. Roll on table, search rules, compress audit — peripheral utility tools.
    Spec: roll_on_table, search_rules, compress_audit, roll_save, roll_skill_check.
    Research: Inform 7's "out of world" actions — commands like SAVE, RESTORE, SCORE, and SCRIPT that aren't part of the game world but support play. How does IF's separation of "in-world" vs "out-of-world" commands inform Holonovel's utility tools? Should utility tools feel invisible or be prominent?
    Benchmark: ChatGPT's inline capabilities (translate, calculate) vs Holonovel's discrete utility tools. Do players use roll_on_table mid-session, or is it a GM prep tool?
    Score: 16 (friction=1, crit=2, freq=2). Cplx: 1, Coupling: 1.
