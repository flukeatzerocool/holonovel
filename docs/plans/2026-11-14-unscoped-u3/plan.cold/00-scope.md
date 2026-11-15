# Cold pass — scope

Artifact: `/home/fluke/Holonovel/docs/plans/2026-11-14-unscoped-u3/plan.md`
Plan sha256 on dispatch: `676f63a150e82cf56cb3e5073a3828b58319abc60b5d03cc35c4852a0a9f797a`
Depth: standard · Budget: ≤10 read/glob calls per dispatch · cap 7 dispatches
Targets: `spec/04-runtime.md`, `docs/engine-contract.md`,
`spec/audit/review-register.md`, `ROADMAP.md`,
`docs/plans/2026-11-10-unscoped-surface-review/worklist.md`,
`spec/02-requirements.md`, `spec/01a-constitution.md`,
`spec/appendices-reference.md`, `holonovel/src/generated/contract-fingerprints.ts`,
`docs/plans/2026-11-14-unscoped-u3/`.
Standards: `/home/fluke/Holonovel/AGENTS.md` ("Review-loop governance",
"Gates", "Before committing spec changes", "Split limits"),
`/home/fluke/Holonovel/docs/plans/README.md`,
`/home/fluke/.config/opencode/skills/plan-review/references/spec-project-checks.md`.

Assumptions each reviewer must challenge independently:

1. The 28-row verdict budget is reachable and countable from the plan's own
   tables and steps.
2. `spec/04-runtime.md` §7.7 is the only fingerprint-bearing prose in the
   chunk, and `docs/engine-contract.md` is not assembled.
3. The gate order places the AAR before `build-order` for a stated reason.
4. The atomic fix for the pattern-rule range is complete and executable.
5. The plan's declared surface and exit evidence match the worklist chunk.
