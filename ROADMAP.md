# Roadmap

<!--
  Format: one `## <title>` per upcoming item, followed by 1–3 bullet lines.
  Newest first. Remove entries once they ship (they move to CHANGELOG.md).
  Update this file when planning a release.
-->

## Scheduled — General codex capture (feature request)

- REQ-321f originally specified `manage_codex (action: capture, kind, source_id)`
  to pull an arbitrary Novel artifact into the codex; the implementation provides
  per-kind capture only (adventure via REQ-321g, voice profile via REQ-347a).
  REQ-321f is narrowed to the provenance contract and the general path is
  recorded here as a feature request. Found by `scripts/action-conflicts.ts`.

## Deferred — §6.7 update self-invocation

- `scripts/update-server.ts` prints the `opencode run` command but does not
  execute it; the update remains human/CI-invoked. Revisit if unattended
  updates are required.

## Deferred — action-contract conflict error gate (REQ authoring guard)

- A corpus-wide dry run shows the `tool (action: …, params…)` heuristic yields
  ~7 candidate groups, only ~2 of which are genuine defects; the rest are
  requirement decomposition (an action's parameters legitimately introduced
  across multiple REQs).
- The report-only lint ships as `scripts/action-conflicts.ts`; the Appendix M
  action-contract-uniqueness item documents the convention. Error-gating stays
  deferred until a semantic discriminator separates operation overload from
  decomposition.
