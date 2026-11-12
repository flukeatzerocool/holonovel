# Tasks — fingerprinted-section tool-token re-point

Dependency-ordered. Each task states its own verification; a task is done only
when that check passes.

| # | Task | Verify |
|---|---|---|
| T1 | Empty the production allowlist in `scripts/tool-citation-check.ts` (`TOKEN_ALLOW = new Set<string>()`, comment rewritten) | `npm run tool-citation-check` **fails** with exactly three `token_drift` entries: REQ-221b, REQ-330a, REQ-385a. Record the output (red test). |
| T2 | Re-point REQ-221b's three call forms to `run_command (action: execute, …)` (`spec/02-requirements.md:1542`) | Body ≤800 chars ≤8 sentences (measured 723/6); `npm run validate` shows no shape warning for REQ-221b. |
| T3 | Re-point REQ-330a's bare token (`:1826`) | Body 488/3; no shape warning. |
| T4 | Reword REQ-385a to "parser-command suggestions" (`:3906`) | Body 563/4; no shape warning. |
| T5 | Delete the §4 deferral sentence (`spec/01a-constitution.md:141`) | The row states the rule and names no remaining occurrences; `grep -n "Three occurrences remain" spec/` is empty. |
| T6 | `npm run assemble` | `git diff holonovel.md` shows exactly the four intended hunks. |
| T7 | Confirm the guard is live | `npm run tool-citation-check` → PASS; `--json` reports `token_drift: []`. |
| T8 | Add the `## 2026-11-11 — fingerprinted-section tool-token re-point` CHANGELOG entry. Must precede the build order: `version-bump` reads the CalVer from the top dated heading | Top heading parses; no version fields change (already `2026.11.11`). |
| T9 | Write `docs/plans/2026-11-11-fingerprinted-token-repoint/aar.md` with a provisional `LOOP OPEN` token and the red-test evidence. Must precede the first full-gate run: `check-loop-artifacts` errors on a missing `aar.md` in both gate modes | `npm run check-loop-artifacts` PASS. |
| T10 | `npm run build-order` — first pass, expected failure | Fails at step 2 reporting `check-starter-freshness`; `npm run check-fixture-emitter` fails for the same reason when run directly (the full runner stops at the first failure); `holonovel/src/generated/contract-fingerprints.ts` shows both constants changed. Any other failing gate → stop. |
| T11 | Re-emit the two bundled artifacts (`npm run build:covered-package`, `npm --prefix holonovel run build:starter-novel`) | `npm run check-fixture-emitter`, `npm run check-starter-freshness`, `npm run check-fingerprint-sync` all PASS; diffs confined to the `package_format` / `data_format` fields. |
| T12 | `npm run build-order` — second pass | Completes; step 2 `npm run check` green (including `check-loop-artifacts`); `holonovel/holonovel.md` and markers propagated. |
| T13 | Remove the roadmap section; move F-P6a-21 to `## Resolved` with the new `file:line` predicates; finalise the AAR token | `npm run check-roadmap`, `npm run check-registers:strict`, `npm run check-loop-artifacts` PASS. |
| T14 | `npm run assemble && npm run check:fast` (un-piped) | Exit 0, trailing `check:fast: PASS`. |
| T15 | `npm run session:close` — one commit | Commit subject equals the CHANGELOG heading; tree clean afterwards. |

## Ordering constraints

- T1 precedes T2–T4: the red test must fail for the right reason before the
  text moves.
- T8 precedes T10: `version-bump` reads the CalVer from the top dated CHANGELOG
  heading.
- T9 precedes T10: the full gate suite validates every increment under
  `docs/plans/`, so a missing `aar.md` fails the first build-order run.
- T10 precedes T11: the emitters import the regenerated constants.
- T11 precedes T12: otherwise the check step re-fails on the same two freshness
  gates.
- T13–T14 precede T15: the gates the commit runs are the ones these tasks fix.
