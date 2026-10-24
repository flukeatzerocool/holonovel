# Roadmap

<!--
  Format: one `## <title>` per upcoming item, followed by 1–3 bullet lines.
  Newest first. Remove entries once they ship (they move to CHANGELOG.md).
  Update this file when planning a release.
-->

## Fix sensory parser stubs

- `listen` returns "You listen." and `smell` returns "You smell the air.";
  containment, transparency, and closed containers already work.
- Report modeled auditory/scent cues, fail neutrally when none exist, and add
  tests.
- Plan: `plans/2026-10-23-sensory-parser-fix/`

## Portable bundle integrity and player-safe export

- Export/import, manifest, migration, clone, and checkpoints exist; add an
  integrity envelope and a player-safe export.
- Verify on import (warn by default, refuse under `strict`); redact GM-only
  surfaces in the player scope.
- Plan: `plans/2026-10-23-portable-bundle-integrity/`

## Citation verification and ruling ledger

- Synthesis carries source URLs, confidence, and revert; add claim-level
  verification, source tiers, conflict detection, and a ruling ledger.
- Keep verification local; do not fetch at verify time.
- Plan: `plans/2026-10-23-citation-verification/`

## Compression ladder and recall probes

- Recap, campaign memory, and audit archives exist; add short/medium/long/
  campaign tiers with source pointers and recall-at-budget probes.
- Do not replace the event log or audit archive.
- Plan: `plans/2026-10-23-compression-ladder/`

## Line-of-sight and sound propagation

- Containment, transparency, and light exist; add visibility and one-hop sound
  propagation, then record witness/sense on derived perceptions.
- Depends on the sensory parser fix and witness-aware perception.
- Plan: `plans/2026-10-23-containment-propagation/`

## Containment-aware generation

- After table-driven generation lands, add branching layout, reachable secret
  placement, witness placement, and validation.
- Depends on table-driven generation and visibility/sound propagation.
- Plan: `plans/2026-10-23-containment-generation/`

## Location-gated discovery for countdown consequences

- Attribution now records discoverers at fire, but discovery is not gated on
  the entity reaching the countdown's location and the timestamp is fire time,
  not the scene transition (REQ-340a). `narrative_orientation` also lacks the
  "Meanwhile, ..." fragment (REQ-340b).
- Add location linkage, defer discovery until the entity is present there, and
  fill the orientation fragment; strengthen T390/T399 to their Appendix F
  descriptions.

## Witness-aware perception and NPC POV

- The Perception Ledger (REQ-540–545) exists but is manually recorded and has
  no witness attribution by presence or sense.
- Add witness kinds, containment/sense derivation, a per-NPC POV overlay, and a
  knowledge query.
- Plan: `plans/2026-10-23-witness-aware-perception/`

## Narrator visibility gate

- Badge filtering protects briefings, but GM-only facts can enter narrator
  context and leak into player-facing prose.
- Add a logic-pass → clearance-filter → narrator-pass pipeline with a
  post-generation leak scan.
- Plan: `plans/2026-10-23-narrator-visibility-gate/`

## Replay verification and state hashes

- The event log, audit hash chain, checkpoints, and branching already exist;
  add a runtime replay/verify surface and per-event state hashes.
- Do not rebuild the existing log, audit, export, or checkpoint systems.
- Plan: `plans/2026-10-23-replay-verification/`

## Context ledger and cache-aware surface

- Surface profiles already cut the catalog from 25,856 to ~1,156 tokens; add
  per-turn cost accounting, cache-hit measurement, and progressive disclosure.
- Measure `small`/`lean` quality before changing defaults.
- Plan: `plans/2026-10-23-context-ledger/`

## Prompt generation from the ruleset model

- The reference host still hardcodes all five MCP prompt bodies (`session_zero`,
  `novel_setup`, `intro`, `badge_briefing`, `run_workflow`) as English string
  literals, while REQ-078a and §6.4.1 require the builder to generate prompt
  text at build time from the ruleset model, and REQ-023a/REQ-127 require
  ruleset-native terminology. Runtime registration of installed package
  `prompts.json` entries landed 2026-10-21; full build-time generation remains
  open. (REQ-078a, REQ-023a, REQ-127)
