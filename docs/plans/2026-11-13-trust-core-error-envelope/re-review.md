# Diff re-review — trust-core error envelope plan v2

Status: PASSED (v1 blockers B1–B3 and majors M1–M9 resolved; 1 Major, 2 Minors
carried to v3) · Reviewer: same independent reviewer, cold context preserved ·
Depth: standard · Budget: 8/10 calls

Artifact verified: `docs/plans/2026-11-13-trust-core-error-envelope/plan.md`
sha256 `bfb09cfd69640a74e9f73d57938d22e388df4cd1ee582eaf07ab0417ee894b91`
(321 lines). v1 sha `07c9f84…`; review scope: changed lines only.

## Disposition of v1 findings

| v1 | v2 resolution | Verdict | Evidence |
|---|---|---|---|
| B1 hash/provenance drift | §2 revision note, refreshed refs | Resolved | disk hash matches; `err()` 3200-3205, `raw()` 3358-3360, `guardToolCall` 1951/1959-1965/1969, SDK `mcp.js:185-191` all correct at `8edaa54` |
| B2 `isError` dropped | D4 `refusalResult` | Resolved | `{...err(), isError:true}` on converted + dispatcher refusals only; `err()` untouched; bars 1/2/5 restated; gap recorded as F-P1-14 |
| B3 ROADMAP duplication | D7 replace, not re-scope | Resolved | remainder bullet names F-P1-14/15/16; no overlap with bullets 2–3 |
| M1 pacing | D5 skip on `isError` | Resolved | no existing handler result carries `isError` through `paced` (`index.ts:247,1951,1964,1969,17660,17667`), so the guard changes only the new refusal |
| M2 REQ-001 AC | D8 body+AC, 548a success / 548c error | Resolved | ~180 chars / 3 sentences headroom against 800/8 |
| M3 SDK transport | premise restated, F-P1-15 | Resolved | tool result via `createToolError`; impossible branch removed |
| M4 T534b red test | bar 1 T178-only | Resolved | — |
| M5 F-S1 coupling | C7 in-increment | Resolved | `review-register.md:2429-2434`, `ROADMAP.md:38-41` |
| M6 stale predicates | refreshed, recomputed | Resolved | — |
| M7 badge-filter overclaim | D9 + F-P1-16 | Resolved (finding real) | `coll = pkg.model[collection]` (`:2240`) enumerated raw at `:2280-2282`; the comment at `:2274-2275` is the stale claim |
| M8 T634 call site | bar 4 names `:7603` | Resolved | `index.ts:7603` emits `Valid values: ${catalog}` |
| M9 hardcoded 41 | bar 8 restated | Resolved | — |

Also verified: `prefix()` keys a compound envelope on its most specific known
token, so `[ERROR] [FORBIDDEN]` stays a denial (`playtest-lib.ts:28-46`),
matching the plan's edge case.

## Remaining findings (carried to v3, non-blocking)

- **Major — bar 4's badge-fidelity rationale contradicted D9.** An unfiltered
  source yields an unfiltered `values` array; the structured copy inherits
  F-P1-16 exactly as the text does. v3 restates it as "no *additional*
  disclosure beyond the text" and stops implying REQ-548c's badge leg is
  exercised.
- **Minor — remainder bullet needed the findings' REQ tokens.** `check-registers`
  requires every `Scheduled-roadmap` finding's REQ tokens in ROADMAP
  (`register-checks.ts:64-70`). v3 names REQ-001b1, REQ-548c, REQ-002c1,
  REQ-445 in D7/C7.
- **Minor — F-P1-16 predicate should cite `index.ts:2280`,** noting the
  `:2274-2275` comment claims filtering. v3 does.

## Deferred (unchanged text, not blockers)

- Bar 3's universal quantifier is asserted by one T632 call on one tool.
- `err()` still omits `isError` for all returned errors (REQ-001b1) — recorded
  as F-P1-14, not claimed fixed.

## Unknowns

- Whether `surfaceRefusal` can return a code other than the two C4 names
  (`index.ts:1919-1931`) — C4 says "matching their current bracketed text", so
  the implementer derives it.
- The regenerated preflight sidecar's 12-target listing — artifact hash
  verified, sidecar not.

independent-review passed.
