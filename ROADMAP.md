# Roadmap

<!--
  Format: one `## <title>` per upcoming item, followed by 1–3 bullet lines.
  Newest first. Remove entries once they ship (they move to CHANGELOG.md).
  Update this file when planning a release.
-->

## Scheduled — Guarded-rule-change check (push-review tooling)

- A change that edits a normative spec authoring rule and, in the same commit,
  the validator pattern implementing it is self-attesting — the rule and its
  gate move together (e.g., Appendix M's `_Check:` rule relaxed to family scope
  alongside the new `checkFamilyCheckCoverage` gate). Add a check that flags
  such a commit and requires a review-register entry naming the rule. Predicate:
  a diff touching both a `spec/` normative rule and `scripts/lib/req-checks.ts`
  or `scripts/validate.ts`. Found 2026-09-27 during push-review hardening.

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
