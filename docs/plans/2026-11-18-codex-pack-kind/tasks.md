# Tasks — `codex pack` as a fourth artifact kind

Dependency order. Each task names its accept; a task is not done until its accept holds.

1. **T1 — Surface audit (P1).** [no dependencies] List every spelling of the kind union and
   every binding on `manage_artifact`/T738/T739; confirm the anchor inventory has seventeen
   `index.ts` anchors below line 11321 and exactly two at or after it.
   **Accept:** written lists; no edit; an unlisted union site or a hard-coded binding stops
   the increment for a plan amendment. The anchor inventory shows seventeen anchors below
   11321 and exactly two at or after it.

2. **T2 — Registry kind and scan (P2).** [`T1`] `artifact-registry.ts`: add `codex` to
   `ArtifactKind` and `KIND_ORDER`, add `RegistrySources.codexDir`, spread `scanCodexPacks`,
   seed the `registryCounts` record.
   **Accept:** `npm --prefix holonovel run typecheck`; a hand-placed valid pack appears in a
   scan with its title, declared provenance, and recomputed `content_hash`; the same entries
   in a different payload order produce the same hash (D3).

3. **T3 — Install branch (P2).** [`T2`] `index.ts`: `codexDir` in the sources literal, the
   `kind` enum, the description rewrite (D8), and the codex install case after the adventure
   case (D2–D5).
   **Accept:** isolated-data-dir install returns `[OK]`; `list` (unfiltered and `kind:
   codex`), `verify`, and `spec_health` report the entry and `counts.codex: 1`.

4. **T4 — Removal branch (P2).** [`T3`] `index.ts`: a `codex` case before the Novel
   fallback, and the removal label.
   **Accept:** remove deletes `<DATA_DIR>/codex/<slug>.json`, leaves the registry, and the
   message names "Codex pack".

5. **T5 — Harness cases (P3).** [`T3`, `T4`] `test-artifact-registry.ts`: export →
   install round-trip; no-declared-hash (`absent`); wrong schema; empty entries; duplicate
   slug; declared-hash mismatch; traversal source; remove and reinstall. Name each with a
   `T739`/`T738` prefix.
   **Accept:** 31 cases pass; every negative case asserts its code and that no file was
   written; `git status --porcelain` is empty after the pre-fix probe notes are taken.

6. **T6 — Anchor repair (P4).** [`T3`, `T4`] Measure `k1` and `k2` from `git diff -U0 --
   holonovel/src/index.ts`, then D10's two declarations, larger band first.
   **Accept:** `npm run check-anchors` prints `predicates current`; the first invocation's
   exit 1 is accounted for by the `11321#inboxSourcePath` unresolved line.

7. **T7 — Spec and doc surfaces (P5).** [`T5`] D6's eleven edits, with the REQ bodies
   copied from the plan's measured text.
   **Accept:** `npm run assemble`; `npm run validate` reports `0 error(s)` and warnings at
   or below the 303 baseline; both bodies remain within 800 characters and 8 sentences.

8. **T8 — Regeneration chain (P5).** [`T7`] `npm run check-tool-definitions-sync`
   (regenerate when it reports drift) → `npm run tool-definitions-lint` → `npm run
   surface-budget -- --write` when the footprint moved → `npx tsx
   holonovel/scripts/generate-g7-attestation.ts` → `npm run build-order`.
   **Accept:** every gate in V5 passes; `spec/build-phase-map.md` carries the new content
   hash; `check-fingerprint-sync` is unchanged.

9. **T9 — Registers and roadmap (P5).** [`T8`] Retire ROADMAP item 5, write the dated
   `## Resolved` entry in `spec/audit/review-register.md`, and add the dated
   `holonovel/DECISIONS.md` design entry.
   **Accept:** `npm run check-roadmap`; `npm run check-registers`.

10. **T10 — Close (P6).** [`T9`] `npm run check:fast` un-piped, `npm run check`, AAR with
    the Changelog block, `npm run session:close`.
    **Accept:** `46 passed, 0 failed`; full gate `0 error(s)`; one commit whose subject is
    the CHANGELOG heading; `aar.md` ends `LOOP PAUSED`.
