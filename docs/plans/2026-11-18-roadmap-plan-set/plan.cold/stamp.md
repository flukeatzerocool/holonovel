# Plan gate — stamp record

- **Artifact under review:** `~/.local/state/opencode/plans/fe586f09…/2026-11-18T14-36-09-723Z-6c809a6a.md`
- **sha256:** `6c809a6a1d805a8b5d12325ad65c3e4772f6b3fe81d62098cfc6492cce9afc1d` (byte-identical to
  `docs/plans/2026-11-18-roadmap-plan-set/plan.md`)
- **Stamp:** `kind: planned`, `depth: standard`, `independence: fresh`, `verdict: passed`,
  stages `5`, reviewer "cold pass: independent-review stages 1-5 (r1, FAILED) + diff re-review (r2,
  passed)"; cold artifact `plan.cold/review-r2.md`,
  `81739c278aaaf0968a92b8d774c1e16a558bc73f5300714e552732220ecf13ee`.
- **Blocker 1 (identity), resolved:** the state directory's `plan.md` is a pre-existing artifact from
  another session (§5.6 remediation, 505 lines) and was never this plan's copy. The stamp binds the
  timestamped file above, whose hash equals the repo plan's, so the gate hash and the reviewed text
  cannot diverge. The stale `plan.md` is left untouched: it is another session's state, outside this
  repository.

Any edit to `plan.md` invalidates `plan_sha256`; a condition-only amendment must re-stamp.
