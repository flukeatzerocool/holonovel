# Roadmap

## Retire REQ-581 compatibility aliases (next minor)

- Retire the five 2026-10-19 split-duplicate action sets and the four 2026-10-20 consolidation aliases (`resolve_fate`, `resolve_ironsworn`, `resolve_forged`, and `manage_ruleset (action: roll)`) at the next minor release. The hidden aliases are advertised in `spec_health.tool_surface` and `holonovel://tool-groups`; a tombstone returns `[NOT_FOUND]` naming the replacement. Target release: the next CalVer minor after 2026.10.20. (REQ-581)

<!--
  Format: one `## <title>` per upcoming item, followed by 1–3 bullet lines.
  Newest first. Remove entries once they ship (they move to CHANGELOG.md).
  Update this file when planning a release.
-->

## Prompt generation from the ruleset model

- The reference host hardcodes all five MCP prompt bodies (`session_zero`,
  `novel_setup`, `intro`, `badge_briefing`, `run_workflow`) as English string
  literals, but REQ-078a and §6.4.1 require the builder to generate prompt text
  at build time from the ruleset model, and REQ-023a/REQ-127 require
  ruleset-native terminology. The package format already carries authored
  `prompts.json` (`dnd2024_session_zero`, `dnd2024_intro`) that the host never
  registers. Bounded first step: register package prompts at runtime; full
  build-time generation remains open. (REQ-078a, REQ-023a, REQ-127)

