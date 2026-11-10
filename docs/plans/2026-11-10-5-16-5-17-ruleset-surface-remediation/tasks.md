# Tasks — §5.16/§5.17 ruleset surface remediation

Dependency-ordered. `[A]`/`[B]`/`[C]` mark the delivery slice. Each task names
its verification; a task is done only when its verification is recorded.

## Preflight

- [x] P1 `[A]` Run `npm run status`, `npm run check:fast`, and
      `npm --prefix holonovel run test:ruleset-surface-remediation`; record the
      baseline.
- [x] P2 `[A]` Re-derive every §2 anchor with `rg -n`; reconcile the site sets.
- [x] P3 `[A]` Confirm the increment directory is trackable
      (`git check-ignore -v docs/plans/2026-11-10-5-16-5-17-ruleset-surface-remediation/`).
- [x] P4 `[A]` Record the plan-gate evidence sidecar and the approved plan hash.

## Slice A — scope, annotation, health, suggest

- [x] A1 `[A]` Add `_meta.ruleset` to every `tools/list` entry (host `null`,
      package slug otherwise). Verify: `tools/list` sample.
- [x] A2 `[A]` Add `_meta.inapplicable` under `scope=all` for mismatched
      rulesets with an active Novel. Verify: T442.
- [x] A3 `[A]` Build `spec_health.ruleset_health` per slug (confidence,
      indexed counts, MUST-action coverage, defect count, verification
      dispositions) and `combined`. Verify: T444.
- [x] A4 `[A]` Player-filter `ruleset_health`; keep `combined` visible.
      Verify: T444 Player snapshot.
- [x] A5 `[A]` Scope `run_command (action: suggest)` to the active package's
      tools with prefixed names; `[STATE_CONFLICT]` with no Novel. Verify: T446.
- [x] A8 `[A]` Run `surface-budget --write` if `_meta` moves the footprint;
      assert T459 still reflects the untruncated default listing.
- [x] A6 `[A]` Record the prefix map and D1/D3/D7 in `holonovel/DECISIONS.md`.
- [x] A7 `[A]` Flip F-P6b-9 and F-P6b-11 to `Resolved`; add F-P6b-9a
      (`ruleset://`, REQ-012/REQ-214a); add REQ-389c to F-P6b-16's row; amend
      roadmap bullet 3 to name REQ-012 and REQ-214a; remove bullet 1. Verify:
      `check-registers`, `check-roadmap`.

## Slice B — identity, import/export, codex

- [x] B1 `[B]` Refuse `bind` when mechanics-derived state exists (D2), before
      any write or audit. Verify: T441/T451.
- [x] B2 `[B]` Audit `switch` with both endpoints' slug and ruleset.
      Verify: T445.
- [x] B3 `[B]` Validate the imported `ruleset` (archive) and the roster entry
      ruleset (character import). Verify: T447.
- [x] B4 `[B]` Add `ruleset` to the export manifest. Verify: T447.
- [x] B5 `[B]` Add `RosterEntity.ruleset` (create/stage write path) and
      `CodexEntry.ruleset` with set/capture defaults, list filter, and
      mismatched-import refusal. Verify: T448, T447.
- [x] B6 `[B]` Exercise the existing T448 row; do not edit REQ-387b's `_Check:_`
      (fingerprint). Verify: `tool-citation-check`.
- [x] B7 `[B]` Flip F-P6b-10 to `Resolved`; remove roadmap bullet 2.
      Verify: `check-registers`, `check-roadmap`.

## Slice C — metrics, budget, lifecycle

- [x] C1 `[C]` Extract `registerPackageTools(slug)`; call it on install beside
      prompt reload; roll back on failure. Verify: T453/T454.
- [x] C2 `[C]` Register `ruleset://{slug}/{anchor}` and resolve search pointers.
      Verify: T688.
- [x] C3 `[C]` Report `spec_health.ruleset_index_bytes` without hydrating.
      Verify: T455.
- [x] C4 `[C]` Add the aggregate package tool budget and the emitter refusal.
      Verify: T512/T648.
- [x] C5 `[C]` Fix `APPENDIX_U_LICENSES` (D4); add `source_license` to the
      registry and the emitted manifest; add the parity assertion.
      Verify: T517, `test:ruleset-gates`.
- [x] C6 `[C]` Implement `tools/list` pagination (D6). Verify: T458.
- [x] C7 `[C]` Widen T688 so the `ruleset://` pointer resolves; no new row.
      Verify: `test:selection`.
- [x] C8 `[C]` Flip F-P6b-9a, -12, -16, -20 to `Resolved`; retire the roadmap
      section; reassign F-P6b-12's REQ-421 clause to F-P6b-15.
      Verify: `check-registers`, `check-roadmap`.

## Close-out

- [x] X1 Regenerate `spec/audit/req-coverage.md`.
- [x] X2 Write the dated `CHANGELOG.md` entry.
- [x] X3 Run `npm run assemble`, `npm run build-order`, and `npm run check:fast`
      un-piped.
- [x] X4 Complete `aar.md` and end it with the earned LOOP token.
- [x] X5 Commit with `npm run session:close`.
