# Roadmap

<!--
  Format: one `## <title>` per upcoming item, followed by 1–3 bullet lines.
  Newest first. Remove entries once they ship (they move to CHANGELOG.md).
  Update this file when planning a release.
-->

## Scheduled — Codex `capture` action-contract conflict (REQ-321f vs REQ-347a)

- REQ-321f defines `manage_codex (action: capture, kind, source_id)` (pull an
  existing Novel artifact into the codex); REQ-347a and the implementation
  define the same action as `capture, entity_id, update_source` (voice-profile
  capture). The general capture path is unimplemented.
- Reconcile: narrow REQ-321f to the voice-profile contract, or schedule general
  capture as a feature. Found by `scripts/action-conflicts.ts`.

## Deferred — action-contract conflict error gate (REQ authoring guard)

- A corpus-wide dry run shows the `tool (action: …, params…)` heuristic yields
  ~7 candidate groups, only ~2 of which are genuine defects; the rest are
  requirement decomposition (an action's parameters legitimately introduced
  across multiple REQs).
- The report-only lint ships as `scripts/action-conflicts.ts`; the Appendix M
  action-contract-uniqueness item documents the convention. Error-gating stays
  deferred until a semantic discriminator separates operation overload from
  decomposition.
