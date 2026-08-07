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

1. [RESEARCH] World-model layer — spatial interaction & parser commands (player/GM-facing).
   Spec: REQ-195–202, §5.10, Appendix K.
   Research: Inform 7's room/exit/thing model is the defining paradigm of interactive fiction — the world model IS the game state. How does IF's convention of "rooms as containers, things within rooms, exits as directional relations" compare to Holonovel's kind hierarchy (room, thing, exit with properties)? Does the parser command catalog (go, examine, take, drop, open, close) cover natural-language player intents, or are there Inform patterns for extending the parser vocabulary that Holonovel should adopt? What IF design patterns for spatial puzzles, locked containers, and hidden exits translate to Holonovel's world model without adding TTRPG-specific mechanics?
   Benchmark: AI Dungeon has no spatial model — every location exists only in prose, and the player has no persistent inventory or directional agency. Holonovel's world-model layer gives players structured spatial interaction (inventory, containment, directional movement) that persists across scenes. Does structured spatial agency feel like a game or a constraint when the player is used to freeform AI narration?
   Score: 42 (friction=4, crit=4, freq=5). Cplx: 4, Coupling: 4.
   Risk: If the world model misinterprets containment, exits don't connect correctly, or parser commands don't match player intent, the player can't navigate the game world — every movement command fails or produces wrong results.

## Infrastructure & polish

Tier 3 — Score ≤ 24. Quality-of-life and build-time infrastructure. Sequence by (cplx + coupling) ascending.

2. [RESEARCH] Ruleset-free build mode — world-model-only servers (operator-facing).
   Spec: REQ-218–219, §5.11, §6.2.
   Research: Inform 7 without a game — the Inform application is a design-time IDE for creating IF worlds, not a runtime environment that serves world-model interactions without mechanical resolution. What does IF's authoring-tool UX (creating rooms, defining objects, writing descriptions, testing interactively) teach about Holonovel's ruleset-free mode where the builder creates a world-model-only server? Is the parser-command catalog + spatial model compelling enough as a standalone experience, or does it need procedural generation, puzzles, or narrative scaffolding to feel like a game rather than a tech demo?
   Benchmark: No comparable tool exists that builds a world-model server from scratch without a ruleset — this is Holonovel-unique. The operator use case is a pure parser-IF server with spatial interaction but no dice, stats, or combat. Does this mode justify the additional build-path complexity (B1=none, viability pre-check skip, zero-case convergence metrics)?
   Score: 16 (friction=1, crit=3, freq=1). Cplx: 2, Coupling: 2.
   Risk: If ruleset-free builds are undertested or convergence metrics produce misleading zero-case results, the server may ship with a broken world model — rooms without exits, things that can't be examined, parser commands that don't match the kind hierarchy.
