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

*Queue empty. All items addressed by spec REQs (REQ-058/280/025/281/299–303, knowledge_state).
Last research pass: 2026-08-08.*

**When the queue is empty:** run `./scripts/spec-queue-wrapup.sh` — a 10-step
pipeline that audits the spec, rebuilds both servers (Inform + dnd5e), scans
for dead data, updates README and wiki, then commits and pushes.
