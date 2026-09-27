# Roadmap

<!--
  Format: one `## <title>` per upcoming item, followed by 1–3 bullet lines.
  Newest first. Remove entries once they ship (they move to CHANGELOG.md).
  Update this file when planning a release.
-->

## Scheduled — General codex import materialization (feature gap)

- The Codex import path materializes only `voice_profile` (REQ-347b) and
  `adventure` (REQ-321e) entries; the general per-kind materialization contract
  in REQ-321d (npc, character, scene, encounter, lore_entry, faction, countdown,
  room, thing, and the template kinds) is unimplemented. Predicate: the
  `manage_codex` import case in `holonovel/src/index.ts` branches only on
  `voice_profile`/`adventure`. Found 2026-09-26 while shipping general capture.

## Deferred — manage_session (action: compress) contract conflict

- REQ-086a defines `compress(max_entries)` as a non-mutating prompt generator;
  REQ-239a defines `compress(sessions?)` as an audit-log compactor that removes
  entries. Two normative contracts own one action. Baselined as `known-conflict`
  in `spec/audit/action-conflicts-baseline.json`; reopen when an operation
  discriminator (distinct action or mode parameter) is chosen.
