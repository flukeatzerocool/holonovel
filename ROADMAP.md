# Roadmap

<!--
  Format: one `## <title>` per upcoming item, followed by 1–3 bullet lines.
  Newest first. Remove entries once they ship (they move to CHANGELOG.md).
  Update this file when planning a release.
-->

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
