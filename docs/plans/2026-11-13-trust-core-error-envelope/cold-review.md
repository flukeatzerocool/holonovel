# Cold review — trust-core error envelope plan

Status: FAILED (3 blockers, 6 majors, 3 minors) · Reviewer: independent (no
authoring context) · Depth: standard · Budget used: ~23 read/grep + 3 shell

Artifact reviewed: `docs/plans/2026-11-13-trust-core-error-envelope/plan.md`
sha256 `07c9f846bc287ed1988b5baacdf859b246244b8abadeb263c305f17eebc87d35`
(300 lines), git HEAD `8edaa54`.

## Verified premises

| Claim | Verdict | Predicate |
|---|---|---|
| `withForbiddenAudit(ensureStructured(handler), name)` at `index.ts:289` | true | `holonovel/src/index.ts:289` |
| Innermost `normalizeRefusal` preserves exactly-once audit | true | `core/server.ts:56-68` (returned branch), `:70-75` (throw branch) |
| `err()` already emits `[ERROR] [CODE]` + standalone line + structured result | true | `index.ts:3200-3205` |
| SDK override at `index.ts:236-251` live for validation failures | true | SDK `mcp.js:185-191` |
| Playtest classifier independent of the override | true | `scripts/lib/playtest-lib.ts:65-78` |
| T178 / T534b / T632 / T634 / T8 locations | true | `test-backfill.ts:1441`, `test-security.ts:173`, `test-lean-narrator.ts:80/86`, `test-output-contracts.ts:478-497` |
| F-P1-12 already fixed | true | `test-output-contracts.ts:489-490`, `index.ts:3955` |
| §5.1 feeds no contract fingerprint | true | `scripts/lib/contract-fingerprint.ts:27,37-38` |
| Harnesses `JSON.parse` raw text | true (cited site) | `test-engine-facade.ts:69` |
| Coverage bucket flips with a gated T180 | true | `scripts/validate.ts:1431-1443,2046,2056` |
| `check:registers` accepts dated `## Resolved` rows | true | `scripts/lib/register-checks.ts:6-11,61-63` |
| Fast gate count 41 | true | manifest table in `AGENTS.md` |

## Blockers

1. **B1 — artifact hash mismatch and stale evidence.** Disk `07c9f84…` (300
   lines) matches neither the supplied `b6592459…` nor the sidecar's
   `9d355b…` / 281 lines; the sidecar target table lists 7 of 10 named files
   and prints `Unknowns: none`. Several cited lines are off by 3–4
   (`err()` cited 3204-3209, actual 3200-3205; `raw()` cited 3362-3365,
   actual starts 3358). Re-hash and re-run preflight before the gate.
2. **B2 — C1/C4 drop `isError: true`.** `err()` sets no `isError`
   (`index.ts:3200-3205`), but a thrown `[FORBIDDEN]` reaches the SDK catch and
   returns `isError: true` (SDK `mcp.js:185-191`), which T178 depends on
   (`test-backfill.ts:1444-1446`). REQ-001b1 mandates it
   (`02-requirements.md:232`). Routing through `err()` would make done bars 1–2
   unsatisfiable and regress the three dispatcher refusals that carry
   `isError: true` today (`index.ts:1951,1959-1965,1969`).
3. **B3 — ROADMAP rewrite duplicates bullets 2–3.** `ROADMAP.md:15-30` already
   assigns F-P1-5…F-P1-9 to bullet 2 and F-P1-4/12/13 to bullet 3;
   "re-scoping" bullet 1 to those findings duplicates them. The correct edit is
   deletion of bullet 1.

## Majors

- **M1 — pacing drift.** `index.ts:290-299` `paced` calls `bumpPacing` for any
  returned result; a converted refusal would start advancing pacing. Not named
  in §7 or §9; Holosuite tiers assert pacing counts tool calls.
- **M2 — C5 leaves REQ-001's acceptance criterion contradicting the clause, and
  puts the error status in a success-scoped REQ.** `02-requirements.md:59-61`
  AC still says "exactly one of the five prefixes"; REQ-548a is scoped to
  "every successful tool response" (`:70-72`), so the `ERROR` leg belongs in
  REQ-548c (`:78-80`).
- **M3 — C2 transport premise wrong.** The SDK returns a tool result via
  `createToolError` (`mcp.js:185-191,202-211`), not a protocol `-32602`. After
  deletion that result has no `structuredContent`, while REQ-548c covers every
  error response. The plan's conditional branch and "protocol-level" wording
  describe an impossible shape.
- **M4 — T534b is not a red test for C1.** Its refusal is a *returned*
  `err("FORBIDDEN", …)` from `manage_belief` (`index.ts:9952,10006`) that
  already carries `structuredContent.category`; only T178 exercises the
  converted throw path (`test-backfill.ts:1443`).
- **M5 — F-S1 and the citation-repair ROADMAP bullet go stale.** Writing T180
  falsifies "REQ-001b2 → T180" at `review-register.md:2429-2434` and
  `ROADMAP.md:38-41`; C7 touches neither and §10 excludes them.
- **M6 — moved register rows keep stale predicates.** `review-register.md:2361`
  cites `state.ts:1097-1098` (actual 1213-1216), `:2369` cites
  `index.ts:226-233` (actual 236-251), `:2374` cites 2735-2737 (actual
  3358-3360), `:2412` cites 2589-2593 (actual 3200-3205), `:2417` cites
  1832/1835 (actual 1951/1959-1965). The register preamble and AGENTS.md
  require a current predicate.

## Minors

- **M7 — D5's badge-filter claim is overbroad.** `:2282` is badge-filtered;
  `:7603` builds `Valid values:` from a static scene-type catalog.
- **M8 — bar 4 names no call that emits `Valid values:`.** T634 currently uses
  `respond_decision` (`test-lean-narrator.ts:87`), which enumerates nothing.
- **M9 — bar 8 hardcodes the gate count.** "all fast gates pass, trailing
  `check:fast: PASS`" is the durable form.

## Unknowns

- Whether a Holosuite invariant asserts pacing count against call count (M1).
- Measured counts (142 `require*` sites, 156 `raw(` sites) not re-derived;
  none decision-critical.
- `plan.md:106`'s T13/T221 location unverified.

independent-review FAILED.
