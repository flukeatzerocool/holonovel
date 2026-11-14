# Tasks — Trust-core authorization surface (F-P1-7, F-P1-8, F-P1-9)

Bar: `plan.md` § Done bar, items 1–8. Plan depth: standard. Work is not started.

| # | Task | Verify |
|---|---|---|
| T0 ✓ | Enumeration probe: iterate the 91 registry-`read` actions under Observer on a seeded Novel; record refusals, audit appends, and state moves; settle `OBSERVER_DENY_ACTIONS`; record the current three list payloads as baseline | probe log in `/tmp/opencode/probe-badge-gate.ts` output; deny set written down |
| T1 ✓ | C1: `holonovel/src/core/badge-gate.ts` — key resolution, observer action rule, tool visibility, `badgeRefusalFor`, deny set with REQ-015 labels | new unit assertions in `test-security.ts` red then green |
| T2 ✓ | C2: wire `badgeRefusalFor` into `guardToolCall`; boundary audit; skip no-Novel, unknown-tool, `set_badge` | `test/security` shows one boundary entry per refusal; `test:output-contracts` unchanged |
| T3 ✓ | C3a: `toolsVisibleToBadge` Observer branch | `test:tool-definitions` (T151) red then green |
| T4 ✓ | C3b/c: `PROMPT_GATE` filter on `prompts/list` + `prompts/get`; `run_workflow` badge-visible tool map | `test:output-contracts` (T349) asserts Player prompt content |
| T5 ✓ | C3d: `installBadgeFilteredResourceList` with `RESOURCE_GATE` | `test:backfill` (T16, T104) |
| T6 ✓ | C4: REQ-032c + Appendix REQ index row + T16/T104/T151/T349 row amendments; measure body | `npm run assemble && npm run validate` |
| T7 ✓ | Full harness sweep and anchor repoints | `npm --prefix holonovel run test:all` |
| T8 ✓ | C5: register dispositions, roadmap bullet removal + trigger retitle, coverage register, changelog | `check-registers`, `check-roadmap`, `check-loop-artifacts` |
| T9 ✓ | Gates and commit | `npm run assemble && npm run check:fast` → `check:fast: PASS`; `npm run session:close` |

Executed 2026-11-14. T9 = `check:fast` PASS; commit via `session:close`.
