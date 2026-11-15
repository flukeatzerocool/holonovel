# Tasks — Roadmap residuals

Dependency order. Each phase ends with a green gate and its own commit; `aar.md` is written
after the last phase and before the final commit.

## Phase A — harness label hygiene

- [x] A1 `scripts/lib/req-checks.ts` — add/export `checkHarnessCommentIds(files)`; reuse the
      `^T0\d\d` predicate at `:614`.
- [x] A2 `scripts/validate.ts` — extend the `collectHarnessTestNames` pass (`:1544-1562`) to
      return file text (single read); call the detector at `:2607`; PASS line.
- [x] A3 Dry run on the unfixed tree: `npm run validate:fast` → 1 error naming
      `test-narrative.ts:1205` / `T056`. Record it.
- [x] A4 `scripts/test-req-checks.ts` — detector self-tests.
- [x] A5 `holonovel/scripts/test-narrative.ts:1205` — `T056/T723` → `T56/T723`.
- [x] A6 `spec/audit/review-register.md` — author F-P2-4 bullet under a new
      `## Resolved — 2026-11-15 roadmap residuals`; rewrite chunk-P2 preamble and U8-F6's
      closing pointer; record the corpus grep result.
- [x] A7 `ROADMAP.md` — remove § *Harness test-ID label hygiene (P2)*.
- [x] A8 `CHANGELOG.md` — dated entry (dry-run finding, grep result, detector).
- [x] A9 Gate: `npm run check:fast`; corpus grep → no hits. Commit.

## Phase B — vendor-manifest provenance

- [x] B1 `spec/08-synthesis.md` — `REQ-451a` after REQ-451 (`_Check:_ T541`).
- [x] B2 `spec/appendices-reference.md` — T541 row text; `REQ-451a` index row.
- [x] B3 `holonovel/narrative_world_model/MANIFEST.md` — `Source URL` column after
      `Verified`; all 25 rows from `docs/licenses/ATTRIBUTION.md:16-23`, plus a
      provenance paragraph.
- [x] B4 `holonovel/scripts/check-vendor-manifest.ts` — header-indexed lookup; all 25 rows
      parsed; provenance before the `(build-time)` guard; `NOURL`/`BADURL`; `--strict`
      fails either.
- [x] B5 Negative probe in place (see amendment A-1): blanked one URL →
      `NOURL … line 27`, exit 1; restored → exit 0.
- [x] B5b `scripts/validate.ts` — licence-source-parity manifest parse made
      header-indexed (amendment A-2); it had gone red on the new column.
- [x] B6 `spec/audit/review-register.md` — U7 subsection moved to the dated `## Resolved`.
- [x] B7 `ROADMAP.md` — vendor section removed.
- [x] B8 `CHANGELOG.md` — dated entry.
- [x] B9 Gate: `npm run assemble && npm run check:fast` → 45/45. Commit `e04ea1d`.

## Phase C — faction knowledge on secrets

- [x] C1 `holonovel/src/index.ts` — `known_by` parameter; `entity_id` description widened.
- [x] C2 `set_secret` — `known_by` resolved against entities then factions; `[NOT_FOUND]`
      names the unknown id.
- [x] C3 `reveal` — `resolveSecretHolder`; faction holder records the world change and
      skips the perception record (comment cites REQ-595).
- [x] C4 `knowledge` — accepts a faction id.
- [x] C5 `faction://{id}` — GM payload gains faction-known secrets; Player projection
      unchanged.
- [x] C6 `spec/02-requirements.md` — `REQ-234e`.
- [x] C7 `spec/appendices-reference.md` — REQ-234e index row; T274 row text.
- [x] C8 `holonovel/scripts/test-narrative.ts` — T274 faction assertions.
- [x] C9 `holonovel/scripts/test-backfill.ts` — both reveals asserted; T789 expectation list
      gains `novel-tension-secret-`.
- [x] C10 Regenerate: `assemble` → tool definitions → `surface-budget --write` →
      `validate -- --write-register` → `build-order`; DECISIONS budget header by hand
      (amendment A-3); `fix-anchors` for 13 drifted anchors (amendment A-4).
- [x] C11 `spec/audit/review-register.md` — U6 subsection relocated; F5 residual closed;
      U6-F5b scheduled row for REQ-234b/REQ-234d.
- [x] C12 `ROADMAP.md` — faction section removed; § *Secret relationship recommendations
      (P1)* added.
- [x] C13 `CHANGELOG.md` — dated entry.
- [x] C14 Gate: `check:fast` 45/45; `test:narrative` 84; `test:backfill` 127;
      `build-order` green (includes `check-anchors`); surface gates green.
- [x] C15 `plan.md` and `tasks.md` land with this commit.

## Close

- [ ] D1 `aar.md` — findings with terminal dispositions; end `LOOP PAUSED`.
- [ ] D2 `npm run session:close`.
- [ ] D3 Report the commit list and the unpushed/publish status (informational).
