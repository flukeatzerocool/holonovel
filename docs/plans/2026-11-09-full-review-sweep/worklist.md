# Worklist — full-review sweep

Cross-session tracker for the `ROADMAP.md` item *Remaining full-review sweep*.
One row per chunk. A chunk is closed only when its findings are dispositioned in
`spec/audit/review-register.md` and its exit evidence is recorded below.

Bootstrap: `plan.md` (2026-11-09). Update this file at each chunk close; do not
restart the enumeration from scratch.

## How a chunk closes

1. Surface enumerated with `file:line` anchors (recorded in the chunk section).
2. Review run with the named skill; findings carry IDs and predicates.
3. Every finding dispositioned: `P0` fixed here · `P1` roadmap row · `P2`
   fixed only with a demonstrated failure · `P3` record-and-close.
4. Exit evidence run un-piped and its exit status recorded.
5. `review-register.md` row added; `ROADMAP.md` trigger advanced to the next chunk.

## Decisions (2026-11-09, user-approved)

- **D1 — Include §5.32–§5.35.** The sweep covers all 35 subsections except the
  two the seam pass closed (§5.9, §5.19). §5.32–§5.35 are assigned to P8, and
  the `ROADMAP.md` range is corrected to "§5.1–§5.35 except §5.9/§5.19".
- **D2 — Fix policy confirmed.** P0 fixed in-session (bounded), P1 scheduled on
  `ROADMAP.md`, P2 fixed only with a demonstrated failure, P3 record-and-close.
- **D3 — Chunk order confirmed.** Code-first; P1 (trust core) first.
- **D4 — No push.** Publication stays user-authorized; 3 commits are already
  unpushed at session start.

### Decisions (2026-11-09, chunk P3)

- **D5 — Chunk scope split (user-decided).** P3 = §5.4 (32 REQs); §5.6 (265
  REQs, 75 families) becomes chunk P3b with its own increment. The worklist's old
  "§5.4, §5.6" P3 label is re-scoped; the mapping invariant holds (each
  subsection assigned once).
- **D6 — Fix policy.** Q2 = D2 unchanged: P0 in-session, P1 roadmap, P2 only on
  a demonstrated failure, P3 record-and-close.
- **D7 — Increment record.** New `docs/plans/2026-11-09-full-review-p3/` for
  plan/tasks/AAR; this worklist carries the P3 table and decisions.
- **D8 — Bucket resolution.** Bucket follows the base family row by family ID,
  not section membership: `REQ-548d` (a §5.4 REQ) inherits `REQ-548`'s §5.1 row
  (bucket C).
- **D9 — §5.4/P4 boundary.** P3 reviews the handler and contract surface; a
  predicate landing in `core/state.ts` internals is recorded and referenced to
  chunk P4, not audited here.
- **D10 — Citation resolution.** Chunk P2's method unchanged; a literal token is
  not evidence the behaviour is exercised. T38 is Manual, S22 a scenario, T103
  Automated with no harness (a finding).
- **D11 — No push.** Publication stays user-authorized.

### Decisions (2026-11-09, chunk P3b-1)

- **D12 — §5.6 split (user-approved via "execute plan").** §5.6 is split into
  four family-atomic sub-increments: P3b-1 core state and lifecycle (66 REQs),
  P3b-2 entities and NPCs (93), P3b-3 adventure content (39), P3b-4 state
  surfaces and fingerprinting (67). `REQ-073`'s five parts stay whole in P3b-1.
- **D13 — Fix policy.** D2 unchanged: P0 in-session, P1 roadmap, P2 only on a
  demonstrated failure, P3 record-and-close.
- **D14 — Bucket resolution.** By base family ID from
  `spec/audit/req-coverage.md`. Every P3b-1 family row is bucket C.
- **D15 — §5.6/P4 boundary.** P3b-1 reviews lifecycle behaviour through the
  handlers and public state methods; `state.ts` save/load/archive internals stay
  with chunk P4.
- **D16 — Citation resolution.** P2/P3's method: own `_Check:_`, else family
  citation; an `Automated` token must appear literally in a harness and the
  harness body must exercise the behaviour.
- **D17 — Fingerprint consequence.** §5.6 is a `DATA_SECTIONS` member; a REQ-body
  edit would require `build-order` fingerprint regeneration. This increment
  changed no REQ body.
- **D18 — No push.** Publication stays user-authorized.
- **D19 — Baseline.** `check:fast` 37/37 PASS, `check` PASS, nine server
  harnesses green before the review; tree clean at `cfaad6b`.

## Status

| Chunk | Surface | Spec | Skill | Status |
|---|---|---|---|---|
| P1 | routing, badge gates, `audit()`, error envelopes | §5.1, §5.5 | `code-review` | **closed 2026-11-09** |
| P2 | tool registration, schemas, descriptions | §5.3 | `code-review` + citation resolution | **closed 2026-11-09** |
| P3 | decision and creation handlers, structured choices, staleness | §5.4 | `code-review` + citation resolution | **closed 2026-11-09** |
| P3b-1 | mutation, decision, and lifecycle handlers; audit resource | §5.6 core state and lifecycle | `code-review` + citation resolution | **closed 2026-11-09** |
| P3b-2 | entities, NPCs, personality, briefings | §5.6 entities and NPCs (93 REQs) | `code-review` + citation resolution | scheduled |
| P3b-3 | adventure content, resources, generation | §5.6 adventure content (39 REQs) | `code-review` + citation resolution | scheduled |
| P3b-4 | state surfaces and fingerprinting | §5.6 fingerprints, facts, checkpoints, codex (67 REQs) | `code-review` + citation resolution | scheduled |
| P4 | `core/state.ts`, `core/data-dir.ts`, save/load/archive/undo | §5.19 code-side | `code-review` | scheduled |
| P5 | engine loop, `core/event-hub.ts`, `core/event-log.ts`, `core/agent.ts` | §5.20, §5.24, §5.31, engine-contract §2–§6 | `code-review` | scheduled |
| P6 | `core/surface-{projection,aliases}.ts`, `world/*`, `rulesets.ts`, `library.ts` | §5.10, §5.11, §5.13, §5.15, §5.16–§5.18, §5.21–§5.23 | `code-review` | scheduled |
| P7 | `core/{rng,state-hash,limits,corpus,semantic,graph}.ts` | §5.2, §5.7, §5.8, §5.14, §5.28–§5.30 | `code-review` | scheduled |
| P8 | `core/{belief,identity,causal,subjective,perception,memory,divergence}.ts` | §5.12, §5.25–§5.27, §5.32–§5.35 | `code-review` + `spec-review` | scheduled (pending Q1) |
| M1 | `check:conformance`, `fmea`, `graph-deps` | all | machine evidence | **closed 2026-11-09** |

**Mapping invariant.** Every subsection of §5.1–§5.8, §5.10–§5.18, §5.20–§5.31 is
assigned exactly once, plus §5.32–§5.35 in P8 pending Q1. §5.9 and §5.19 are the
only exclusions (deferred by the seam pass). Verify with
`grep -n '^### 5\.' spec/02-requirements.md` before starting any chunk.

## Chunk P1 — trust core

**Code targets:** `holonovel/src/index.ts` request dispatch; badge-gate helpers;
`audit()` (`index.ts:2409`) and call sites; error-envelope constructors.
**Spec:** §5.1 (54 REQs), §5.5 (71 REQs).
**Already gated:** `action-conflicts`, `check-tool-surface`, `surface-budget`,
`check-tool-definitions-sync` cover the tool-surface arithmetic, not runtime
gating or the audit payload.
**Exit evidence (recorded 2026-11-09):** `check:fast` 37/37 PASS, `check`
PASS, `check-roadmap` PASS, `check-registers` PASS, `check-loop-artifacts`
PASS, `build-order` clean. Findings: F-P1-1…F-P1-13 and F-S1 scheduled in
`spec/audit/review-register.md`; prototype-key hardening `Closed-P3`. No source
file changed.

### P1 per-REQ verdict table (filled during the chunk)

One row per REQ: `holds` (the REQ's own automated citations resolve to a
harness that names the test ID), `finding:<ID>` (see the register), or
`builder-side` (bucket E: builder/verifier-side, no harness expected).

Resolution method (reproducible): each REQ's own `*Check:*` IDs; a REQ with no
own Check inherits its family's citation set; an `Automated` citation must
appear literally in a `holonovel/scripts` harness; `Manual`/`Gate` citations
need no harness. Bucket comes from `spec/audit/req-coverage.md`.

Result: **105 holds, 15 builder-side, 5 findings** (F-P1-2).

| REQ | § | Verdict | Predicate / finding |
|---|---|---|---|
| REQ | § | Bucket | Verdict | Evidence |
|---|---|---|---|---|
| REQ-101a | 5.1 | E | builder-side | bucket E; verifier-side citation T89 |
| REQ-101b | 5.1 | E | builder-side | bucket E; verifier-side citation T89 |
| REQ-101c | 5.1 | E | builder-side | bucket E; verifier-side citation T89 |
| REQ-001 | 5.1 | C | holds | manual/gate G2 by kind |
| REQ-001a1 | 5.1 | C | holds | no own Check; family exercised: G2, T175, T180 |
| REQ-001a2 | 5.1 | C | holds | automated T175 exercised |
| REQ-548a | 5.1 | C | holds | automated T632 exercised |
| REQ-548b | 5.1 | C | holds | automated T633 exercised |
| REQ-548c | 5.1 | C | holds | automated T634 exercised |
| REQ-277 | 5.1 | E | builder-side | bucket E; verifier-side citation T297 |
| REQ-002 | 5.1 | C | holds | automated T177 exercised; manual/gate T18 by kind |
| REQ-002a1 | 5.1 | C | holds | no own Check; family exercised: T18, T177, T176, T178, T179 |
| REQ-002a2 | 5.1 | C | holds | automated T176 exercised |
| REQ-002b1 | 5.1 | C | holds | no own Check; family exercised: T18, T177, T176, T178, T179 |
| REQ-002b2 | 5.1 | C | holds | automated T178 exercised |
| REQ-002c1 | 5.1 | C | holds | no own Check; family exercised: T18, T177, T176, T178, T179 |
| REQ-002c2 | 5.1 | C | holds | automated T179 exercised |
| REQ-003a | 5.1 | C | holds | no own Check; family exercised: G2, T47 |
| REQ-003b | 5.1 | C | holds | no own Check; family exercised: G2, T47 |
| REQ-003c | 5.1 | C | holds | automated T47 exercised; manual/gate G2 by kind |
| REQ-004 | 5.1 | C | holds | automated T13 exercised |
| REQ-004a | 5.1 | C | holds | automated T13 exercised |
| REQ-179a | 5.1 | C | holds | no own Check; family exercised: T221 |
| REQ-179b | 5.1 | C | holds | automated T221 exercised |
| REQ-118a | 5.1 | C | holds | no own Check; family exercised: T123 |
| REQ-118b | 5.1 | C | holds | automated T123 exercised |
| REQ-113 | 5.1 | C | holds | automated T116 exercised |
| REQ-060a | 5.1 | C | holds | no own Check; family exercised: T47 |
| REQ-060b | 5.1 | C | holds | automated T47 exercised |
| REQ-061 | 5.1 | C | holds | automated T48 exercised |
| REQ-280a | 5.1 | C | holds | no own Check; family exercised: T329 |
| REQ-280b | 5.1 | C | holds | no own Check; family exercised: T329 |
| REQ-280c | 5.1 | C | holds | automated T329 exercised |
| REQ-062 | 5.1 | C | holds | manual/gate T26 by kind |
| REQ-070a | 5.1 | C | holds | no own Check; family exercised: T223 |
| REQ-070b | 5.1 | C | holds | manual/gate T223 by kind |
| REQ-184a | 5.1 | C | holds | no own Check; family exercised: T223 |
| REQ-184b | 5.1 | C | holds | manual/gate T223 by kind |
| REQ-194a | 5.1 | C | holds | no own Check; family exercised: T16, T236 |
| REQ-194b | 5.1 | C | holds | automated T16,T236 exercised |
| REQ-071a | 5.1 | C | holds | no own Check; family exercised: T26 |
| REQ-071b | 5.1 | C | holds | manual/gate T26 by kind |
| REQ-064a | 5.1 | C | holds | no own Check; family exercised: T51, T461 |
| REQ-064b | 5.1 | C | holds | no own Check; family exercised: T51, T461 |
| REQ-064c | 5.1 | C | holds | no own Check; family exercised: T51, T461 |
| REQ-064d | 5.1 | C | holds | no own Check; family exercised: T51, T461 |
| REQ-064e | 5.1 | C | holds | no own Check; family exercised: T51, T461 |
| REQ-064f | 5.1 | C | holds | automated T461 exercised; manual/gate T51 by kind |
| REQ-001b1 | 5.1 | C | holds | no own Check; family exercised: G2, T175, T180 |
| REQ-001b2 | 5.1 | C | finding:F-test | automated citation unexercised: T180 |
| REQ-425a | 5.1 | C | holds | automated T505 exercised |
| REQ-425b | 5.1 | C | holds | automated T505 exercised |
| REQ-425c | 5.1 | C | holds | automated T505 exercised |
| REQ-425d | 5.1 | C | holds | automated T506 exercised |
| REQ-030 | 5.5 | C | holds | non-test Check (Appendix D gate) or citation on a sibling part |
| REQ-031a | 5.5 | C | holds | no own Check; family exercised: T9, T150 |
| REQ-031b | 5.5 | C | holds | automated T9,T150 exercised |
| REQ-066a | 5.5 | C | holds | no own Check; family exercised: T9 |
| REQ-066b | 5.5 | C | holds | automated T9 exercised |
| REQ-032a | 5.5 | C | holds | no own Check; family exercised: T9, T13, T15, T18, T26, T44, T148, T151 |
| REQ-032b | 5.5 | C | finding:F-test | automated citation unexercised: T44 |
| REQ-216a | 5.5 | C | holds | no own Check; family exercised: T257 |
| REQ-216b | 5.5 | C | holds | automated T257 exercised |
| REQ-133a | 5.5 | C | holds | no own Check; family exercised: T147 |
| REQ-133b | 5.5 | C | holds | automated T147 exercised |
| REQ-134 | 5.5 | C | holds | automated T148 exercised |
| REQ-220a | 5.5 | C | holds | no own Check; family exercised: T262 |
| REQ-220b | 5.5 | C | holds | no own Check; family exercised: T262 |
| REQ-220c | 5.5 | C | holds | no own Check; family exercised: T262 |
| REQ-220d | 5.5 | C | holds | automated T262 exercised |
| REQ-223a | 5.5 | C | holds | no own Check; family exercised: T265 |
| REQ-223b | 5.5 | C | holds | no own Check; family exercised: T265 |
| REQ-223c | 5.5 | C | holds | automated T265 exercised |
| REQ-304a | 5.5 | C | holds | no own Check; family exercised: T348 |
| REQ-304b | 5.5 | C | holds | no own Check; family exercised: T348 |
| REQ-304c | 5.5 | C | holds | automated T348 exercised |
| REQ-305a | 5.5 | C | holds | no own Check; family exercised: T349 |
| REQ-305b | 5.5 | C | holds | automated T349 exercised |
| REQ-306a | 5.5 | C | holds | no own Check; family exercised: T350, T485, T483, T484 |
| REQ-306b | 5.5 | C | holds | no own Check; family exercised: T350, T485, T483, T484 |
| REQ-306c | 5.5 | C | holds | no own Check; family exercised: T350, T485, T483, T484 |
| REQ-306d | 5.5 | C | holds | no own Check; family exercised: T350, T485, T483, T484 |
| REQ-306e | 5.5 | C | finding:F-test | automated citation unexercised: T350 |
| REQ-306f | 5.5 | C | holds | automated T483 exercised |
| REQ-306g | 5.5 | C | holds | automated T484 exercised |
| REQ-109a | 5.5 | C | holds | no own Check; family exercised: T109, T110, T149 |
| REQ-109b | 5.5 | C | holds | no own Check; family exercised: T109, T110, T149 |
| REQ-109c1 | 5.5 | C | holds | no own Check; family exercised: T109, T110, T149 |
| REQ-109c2 | 5.5 | C | holds | no own Check; family exercised: T109, T110, T149 |
| REQ-109c3 | 5.5 | C | holds | no own Check; family exercised: T109, T110, T149 |
| REQ-109d | 5.5 | C | holds | no own Check; family exercised: T109, T110, T149 |
| REQ-109e | 5.5 | C | holds | no own Check; family exercised: T109, T110, T149 |
| REQ-109f | 5.5 | C | finding:F-test | automated citation unexercised: T109, T110 |
| REQ-281a | 5.5 | C | holds | no own Check; family exercised: T330 |
| REQ-281b | 5.5 | C | holds | no own Check; family exercised: T330 |
| REQ-281c | 5.5 | C | holds | automated T330 exercised |
| REQ-286a | 5.5 | C | holds | no own Check; family exercised: T336 |
| REQ-286b | 5.5 | C | holds | no own Check; family exercised: T336 |
| REQ-286c | 5.5 | C | finding:F-test | automated citation unexercised: T336 |
| REQ-159a | 5.5 | C | holds | no own Check; family exercised: T194 |
| REQ-159b | 5.5 | C | holds | no own Check; family exercised: T194 |
| REQ-159c | 5.5 | C | holds | automated T194 exercised |
| REQ-159d | 5.5 | C | holds | no own Check; family exercised: T194 |
| REQ-135a | 5.5 | C | holds | no own Check; family exercised: T149 |
| REQ-135b | 5.5 | C | holds | no own Check; family exercised: T149 |
| REQ-135c | 5.5 | C | holds | automated T149 exercised |
| REQ-180a | 5.5 | E | builder-side | bucket E; verifier-side citation T222 |
| REQ-180b | 5.5 | E | builder-side | bucket E; verifier-side citation T222 |
| REQ-136a | 5.5 | C | holds | no own Check; family exercised: T150 |
| REQ-136b | 5.5 | C | holds | automated T150 exercised |
| REQ-137a | 5.5 | C | holds | no own Check; family exercised: T151 |
| REQ-137b | 5.5 | C | holds | automated T151 exercised |
| REQ-148 | 5.5 | E | builder-side | bucket E; verifier-side citation G0a, T183 |
| REQ-149 | 5.5 | E | builder-side | bucket E; verifier-side citation G0b, T184 |
| REQ-150a | 5.5 | E | builder-side | bucket E; verifier-side citation G2, T185 |
| REQ-150b | 5.5 | E | builder-side | bucket E; verifier-side citation G2, T185 |
| REQ-211a | 5.5 | E | builder-side | bucket E; verifier-side citation T253, T188 |
| REQ-211b | 5.5 | E | builder-side | bucket E; verifier-side citation T253, T188 |
| REQ-211c | 5.5 | E | builder-side | bucket E; verifier-side citation T253, T188 |
| REQ-275 | 5.5 | E | builder-side | bucket E; verifier-side citation T295 |
| REQ-276 | 5.5 | E | builder-side | bucket E; verifier-side citation T296 |
| REQ-598 | 5.5 | C | holds | automated T707,T708,T729 exercised |
| REQ-599a | 5.5 | C | holds | automated T709,T710 exercised |
| REQ-599b | 5.5 | C | holds | automated T709,T757 exercised |
| REQ-600 | 5.5 | C | holds | automated T711 exercised |


## Chunk M1 — machine evidence

**Commands:** `npm run check:conformance` (gate), `npm run fmea`,
`npm run graph-deps` (informational, exit 0).
**Rule:** a finding must rest on a confirmed predicate, never on a tool message.
**Exit evidence:** output summary appended to this file as a **Delta
amendment** (not `plan.md`, so the stamped plan hash stays valid);
`check:conformance` exit recorded.

## Delta amendment — M1 machine evidence (2026-11-09)

Run after chunk P1's spec-side pass; outputs archived under
`/tmp/opencode/sweep-p1/`.

| Command | Exit | Result |
|---|---|---|
| `npm run check:conformance` | 0 | `Bundle-dependent REQs (0):` — PASS, no bundle-dependent REQ |
| `npm run fmea` | 0 | 1 311 rows; severity 5 = REQ-002, REQ-003a, REQ-148; severity 4 = REQ-001, REQ-149 |
| `npm run graph-deps` | 0 | 1 586-line DOT graph; node colours blue 55 / green 126 / red 95 / gray 1 035 |

Findings: **none new.**

- `check:conformance` is a gate and passed clean; no predicate to confirm.
- `fmea` is a skeleton: its Detection column restates each REQ's `*Check:*`
  line, so it cannot raise a finding the REQ body has not already stated. It
  does corroborate the chunk choice — every severity-4/5 REQ (REQ-001, REQ-002,
  REQ-003a, REQ-148, REQ-149) sits in §5.1/§5.5, i.e. chunk P1. Recorded as
  alignment evidence for F-P1-2.
- `graph-deps` colours nodes by citation degree. 1 035 of 1 411 nodes are
  isolated (gray) and 0 REQs are unreachable in the graph sense; this is normal
  for requirement prose and raises no finding. Recorded as an observation.

## Deferred by the roadmap item itself

`§5.9` and `§5.19` semantic review — closed by the 2026-11-09 seam pass
(`review-register.md:14`). Chunk P4 reads `core/state.ts` code-side only.

## Chunk P2 — tool surface and §5.3

**Closed 2026-11-09.** Increment record:
`docs/plans/2026-11-09-full-review-p2/`.

**Code targets:** `holonovel/src/index.ts` tool/resource/prompt registration
(42 `registerTool` sites, 56 `registerResource`, 6 `server.prompt`),
`holonovel/src/tool-registry.ts`, `holonovel/src/surface-report.ts`,
`holonovel/scripts/generate-tool-definitions.ts` and the generated
`holonovel/tool-definitions.json`, `spec_health` / `manage_diagnostics` handlers.
**Spec:** §5.3 (115 REQs).
**Already gated:** seven tool-definition gates (`check-tool-definitions-sync`,
`tool-definitions-lint`, `check-tool-surface`, `surface-budget`,
`surface-replay`, `check-tdqs-scoreboard`, `tool-citation-check`) plus
`action-conflicts` and `check-package-manifest`; the TDQS harnesses
(`test-tool-definitions.ts` T509/T644–T648/T679–T680, `test-security.ts` T536)
run in the server suite, outside the root manifest.

### Decisions (2026-11-09)

- **D1 — Fix policy.** Chunk P1's D2 adopted unchanged: P0 fixed in-session,
  P1 scheduled on `ROADMAP.md`, P2 fixed only with a demonstrated failure, P3
  record-and-close.
- **D2 — Increment record.** New `docs/plans/2026-11-09-full-review-p2/` for
  plan/tasks/AAR; this worklist stays the cross-session tracker and carries the
  P2 table.
- **D3 — Verdict vocabulary.** No fourth verdict. Bucket is inherited from the
  register's family row; the 38 sub-REQs with no own `_Check:_` inherit their
  family's citation set. Verdicts: `holds`, `finding:<ID>`, `builder-side`.
  §5.3 has **69 family rows — 58 C, 11 E, none A/B/D** (verified by base-ID
  comparison: no family missing, no extra). The 38 is produced by enumerating
  the §5.3 blocks and testing each for `_Check:_`.
- **D4 — §5.3/P6 boundary.** P2 reviewed the registration surface and the
  advertised payload; resource projection and adapter internals stay with P6.
- **D5 — Surface arithmetic.** 42 `registerTool` sites = 37 canonical + 4
  retired hidden tombstones (`resolve_fate`, `resolve_ironsworn`,
  `resolve_forged`, `manage_session`) + 1 dynamic loop (`index.ts:2229`).
  `tool_count` is compared against canonical entries only, never the site count.
- **D6 — No push.** Publication stays user-authorized.

### Cluster verdicts

| Cluster | REQs | Verdict | Evidence |
|---|---|---|---|
| A tool surface and economy | 21 | holds | `check-tool-surface`, `surface-budget`, `action-conflicts`, `tool-definitions-lint`; DECISIONS per-tool justification table = 37 rows = live registry; `spec_health` surfaces asserted by T105/T486/T487/T488 |
| B tool documentation and TDQS | 10 | holds | T536 (`test-security.ts:236`), T642/T644–T648/T679–T680 (`test-tool-definitions.ts`), `check-tdqs-scoreboard` |
| C resources and UI | 13 | holds | 56 `registerResource` sites cover the REQ-022a catalog; `ui://` resources with empty-origin CSP (`index.ts:3188`); `graph://` + projections; `spec://build`; REQ-139 asserted by T153 |
| D prompts and guidance | 18 | **finding:F-P2-1** | prompts registered via `server.prompt(name, title, handler)`; REQ-023b's cited T22 has no harness — the only literal `T022` is an unrelated resource-list test |
| E spec_health and diagnostics | 19 | holds | `prompt_health`/`resource_uris` asserted under T152/T153; context ledger `context_ledger`/`prefix_ratio` (`index.ts:12106`); T105/T488 surfaces |
| F surface profiles and projection | 15 | holds | `surface-budget`, `surface-replay` (T682 in `scripts/surface-replay.ts:264`), `check-tool-surface` |
| G build metadata and configuration | 19 | holds | `build-order` version sync (REQ-107a), `check-fingerprint-sync`, phase-map hash (REQ-278); the rest bucket E |

**Gate assertion vs REQ text.** Each carrying gate was read against its REQ.
No gate was found asserting something narrower than the REQ it is credited
with, so no gate-class finding is raised. `check-tdqs-scoreboard` reads the
committed scoreboard rather than the live surface as REQ-552 requires — it
passes only because `score:tools` regenerates the scoreboard from the live
registry; recorded as an observation, not a finding (no demonstrated drift).

### Findings

| ID | Finding | Predicate | Severity | Disposition |
|---|---|---|---|---|
| F-P2-1 | Nine §5.3 REQs cite T22; no harness implements prompt registration/lifecycle. The only literal token is `T022` in a test that asserts resource listing. REQ-023a/023b need the T22 assertion written; REQ-078a–078d are already exercised by T124 and need only a re-point | `holonovel/scripts/test-backfill.ts:164`; REQ-023b Check; REQ-078a–078d Check | P1 | `Scheduled-roadmap` — ROADMAP § §5.3 citation repair |
| F-P2-2 | REQ-024a cites T35 (fixture isolation); no harness asserts fixture-only tool names are absent from a target ruleset's `tools/list` or present when serving the fixture | cite T35; no `create_delver`/`roll_move` in `holonovel/scripts` | P1 | `Scheduled-roadmap` — ROADMAP § §5.3 citation repair |
| F-P2-3 | Stale citations: REQ-025a/b1/b2/c cite T45/T154/T165/T166/T170, REQ-138a/b cite T167, REQ-139 cites T168, REQ-057a/b cite T40. Each behaviour is exercised under a different ID (T105/T486/T487/T488, T152, T153, T39) | `holonovel/scripts/test-output-contracts.ts:281`, `:419`, `:305` | P1 | `Scheduled-roadmap` — ROADMAP § §5.3 citation repair |
| F-P2-4 | Harness titles carry zero-padded test IDs that do not exist in Appendix F (`T020`, `T022`, `T002`, and others) and shadow real IDs; demonstrated false hold on REQ-023b | `holonovel/scripts/test-backfill.ts:157`, `:164`, `:802` | P2 | `Scheduled-roadmap` — ROADMAP § Harness test-ID label hygiene |

No P0. No source file was changed by this chunk.

### Exit evidence (recorded 2026-11-09)

`check:fast` 37/37 PASS · `check` PASS (0 errors) ·
`npm --prefix holonovel run test:tool-definitions` 17/17 · `test:security` 12/12 ·
`check-roadmap` PASS · `check-registers` PASS · `check-loop-artifacts` PASS ·
`build-order` clean.

### P2 per-REQ verdict table (115 rows)

Resolution method: each REQ's own `*Check:*` IDs; a REQ with no own Check
inherits its family's citation set; an `Automated` citation must appear
literally in a harness under `holonovel/scripts` or root `scripts`; `Manual`
citations need no harness; bucket inherited from the base family row in
`spec/audit/req-coverage.md`.

Result: **76 holds, 20 builder-side, 19 findings** (9 F-P2-1, 1 F-P2-2,
9 F-P2-3). No bucket A/B/D row exists in §5.3.

| REQ | § | Bucket | Verdict | Evidence |
|---|---|---|---|---|
| REQ-020a | 5.3 | C | holds | no own Check; family exercised: G2,T3,T32,T33,T5 |
| REQ-020b | 5.3 | C | holds | own Check exercised: T3,T5,T32,T33,G2 |
| REQ-021 | 5.3 | E | builder-side | bucket E; verifier-side |
| REQ-408 | 5.3 | C | holds | own Check exercised: T477 |
| REQ-413 | 5.3 | C | holds | own Check exercised: T486 |
| REQ-414 | 5.3 | C | holds | own Check exercised: T487 |
| REQ-415 | 5.3 | C | holds | own Check exercised: T488 |
| REQ-022a | 5.3 | C | holds | no own Check; family exercised: T104,T16 |
| REQ-022b | 5.3 | C | holds | own Check exercised: T16,T104 |
| REQ-296a | 5.3 | C | holds | no own Check; family exercised: T341,T516 |
| REQ-296b | 5.3 | C | holds | own Check exercised: T341 |
| REQ-296c | 5.3 | C | holds | own Check exercised: T516 |
| REQ-426a | 5.3 | C | holds | own Check exercised: T507 |
| REQ-426b | 5.3 | C | holds | own Check exercised: T507 |
| REQ-426c | 5.3 | C | holds | own Check exercised: T507,T508 |
| REQ-426d | 5.3 | C | holds | own Check exercised: T507 |
| REQ-023a | 5.3 | C | finding:F-P2-1 | automated citation unexercised: T22 |
| REQ-023b | 5.3 | C | finding:F-P2-1 | automated citation unexercised: T22 |
| REQ-024a | 5.3 | C | finding:F-P2-2 | automated citation unexercised: T35 |
| REQ-024b | 5.3 | C | holds | own Check exercised: T3,T49 |
| REQ-024c | 5.3 | C | holds | own Check exercised: T642 |
| REQ-584 | 5.3 | E | builder-side | bucket E; verifier-side |
| REQ-427 | 5.3 | C | holds | own Check exercised: T509 |
| REQ-450 | 5.3 | C | holds | own Check exercised: T536 |
| REQ-552 | 5.3 | C | holds | own Check exercised: T644,T679,T680,T730 |
| REQ-553 | 5.3 | C | holds | own Check exercised: T645 |
| REQ-554 | 5.3 | C | holds | own Check exercised: T646 |
| REQ-555 | 5.3 | C | holds | own Check exercised: T647 |
| REQ-025a | 5.3 | C | finding:F-P2-3 | automated citation unexercised: T45,T154,T165,T166,T170 |
| REQ-025b1 | 5.3 | C | finding:F-P2-3 | automated citation unexercised: T45,T154,T165,T166,T170 |
| REQ-025b2 | 5.3 | C | finding:F-P2-3 | automated citation unexercised: T45,T154,T165,T166,T170 |
| REQ-025c | 5.3 | C | finding:F-P2-3 | automated citation unexercised: T45,T154,T165,T166,T170 |
| REQ-411 | 5.3 | C | holds | own Check exercised: T480 |
| REQ-587 | 5.3 | C | holds | own Check exercised: T687 |
| REQ-588 | 5.3 | C | holds | own Check exercised: T688 |
| REQ-606 | 5.3 | C | holds | own Check exercised: T717 |
| REQ-607 | 5.3 | C | holds | own Check exercised: T718 |
| REQ-608 | 5.3 | C | holds | own Check exercised: T719 |
| REQ-609 | 5.3 | C | holds | own Check exercised: T720 |
| REQ-610 | 5.3 | C | holds | own Check exercised: T721 |
| REQ-160a | 5.3 | C | holds | no own Check; family exercised: T195 |
| REQ-160b | 5.3 | C | holds | no own Check; family exercised: T195 |
| REQ-160c | 5.3 | C | holds | own Check exercised: T195 |
| REQ-169a | 5.3 | C | holds | no own Check; family exercised: T204 |
| REQ-169b | 5.3 | C | holds | own Check exercised: T204 |
| REQ-138a | 5.3 | C | finding:F-P2-3 | automated citation unexercised: T167 |
| REQ-138b | 5.3 | C | finding:F-P2-3 | automated citation unexercised: T167 |
| REQ-139 | 5.3 | C | finding:F-P2-3 | automated citation unexercised: T168 |
| REQ-269 | 5.3 | C | holds | own Check exercised: T289 |
| REQ-388a | 5.3 | C | holds | no own Check; family exercised: T450 |
| REQ-388b | 5.3 | C | holds | no own Check; family exercised: T450 |
| REQ-388c | 5.3 | C | holds | no own Check; family exercised: T450 |
| REQ-388d | 5.3 | C | holds | own Check exercised: T450 |
| REQ-105 | 5.3 | C | holds | own Check exercised: T104 |
| REQ-106 | 5.3 | C | holds | own Check exercised: T105 |
| REQ-107a | 5.3 | E | builder-side | bucket E; verifier-side |
| REQ-107b | 5.3 | E | builder-side | bucket E; verifier-side |
| REQ-187a | 5.3 | E | builder-side | bucket E; verifier-side |
| REQ-187b | 5.3 | E | builder-side | bucket E; verifier-side |
| REQ-278 | 5.3 | E | builder-side | bucket E; verifier-side |
| REQ-161a | 5.3 | E | builder-side | bucket E; verifier-side |
| REQ-161b | 5.3 | E | builder-side | bucket E; verifier-side |
| REQ-161c | 5.3 | E | builder-side | bucket E; verifier-side |
| REQ-162a | 5.3 | E | builder-side | bucket E; verifier-side |
| REQ-162b | 5.3 | E | builder-side | bucket E; verifier-side |
| REQ-162c | 5.3 | E | builder-side | bucket E; verifier-side |
| REQ-163a | 5.3 | E | builder-side | bucket E; verifier-side |
| REQ-163b | 5.3 | E | builder-side | bucket E; verifier-side |
| REQ-164a | 5.3 | E | builder-side | bucket E; verifier-side |
| REQ-164b | 5.3 | E | builder-side | bucket E; verifier-side |
| REQ-067a | 5.3 | C | holds | no own Check; family exercised: T118,T62,T636 |
| REQ-067b | 5.3 | C | holds | no own Check; family exercised: T118,T62,T636 |
| REQ-067c | 5.3 | C | holds | own Check exercised: T62,T118 |
| REQ-067d | 5.3 | C | holds | own Check exercised: T636 |
| REQ-063a | 5.3 | C | holds | no own Check; family exercised: T259,T49,T50 |
| REQ-063b | 5.3 | C | holds | no own Check; family exercised: T259,T49,T50 |
| REQ-063c | 5.3 | C | holds | own Check exercised: T49,T50,T259 |
| REQ-078a | 5.3 | C | finding:F-P2-1 | automated citation unexercised: T22 |
| REQ-078b | 5.3 | C | finding:F-P2-1 | automated citation unexercised: T22 |
| REQ-078c1 | 5.3 | C | finding:F-P2-1 | automated citation unexercised: T22 |
| REQ-078c2 | 5.3 | C | finding:F-P2-1 | automated citation unexercised: T22 |
| REQ-078c3 | 5.3 | C | finding:F-P2-1 | automated citation unexercised: T22 |
| REQ-078c4 | 5.3 | C | finding:F-P2-1 | automated citation unexercised: T22 |
| REQ-078d | 5.3 | C | finding:F-P2-1 | automated citation unexercised: T22 |
| REQ-057a | 5.3 | C | finding:F-P2-3 | automated citation unexercised: T40 |
| REQ-057b | 5.3 | C | finding:F-P2-3 | automated citation unexercised: T40 |
| REQ-112 | 5.3 | C | holds | own Check exercised: T115 |
| REQ-058 | 5.3 | C | holds | own Check exercised: T41,T42 |
| REQ-110 | 5.3 | E | builder-side | bucket E; verifier-side |
| REQ-059a | 5.3 | C | holds | no own Check; family exercised: T39,T39a |
| REQ-059b | 5.3 | C | holds | no own Check; family exercised: T39,T39a |
| REQ-059c | 5.3 | C | holds | own Check exercised: T39,T39a |
| REQ-182a | 5.3 | E | builder-side | bucket E; verifier-side |
| REQ-182b | 5.3 | E | builder-side | bucket E; verifier-side |
| REQ-183a | 5.3 | C | holds | no own Check; family exercised: T39b |
| REQ-183b | 5.3 | C | holds | own Check exercised: T39b |
| REQ-323a | 5.3 | C | holds | no own Check; family exercised: T367 |
| REQ-323b | 5.3 | C | holds | own Check exercised: T367 |
| REQ-567 | 5.3 | C | holds | own Check exercised: T660 |
| REQ-568 | 5.3 | C | holds | own Check exercised: T661 |
| REQ-583 | 5.3 | C | holds | own Check exercised: T683 |
| REQ-569 | 5.3 | C | holds | own Check exercised: T662,T682 |
| REQ-570 | 5.3 | C | holds | own Check exercised: T663,T676,T677 |
| REQ-571 | 5.3 | C | holds | own Check exercised: T664,T678 |
| REQ-572 | 5.3 | C | holds | own Check exercised: T665 |
| REQ-580 | 5.3 | C | holds | own Check exercised: T673,T676,T677 |
| REQ-573 | 5.3 | C | holds | own Check exercised: T666 |
| REQ-575 | 5.3 | C | holds | own Check exercised: T668,T676 |
| REQ-576 | 5.3 | C | holds | own Check exercised: T669 |
| REQ-578 | 5.3 | C | holds | own Check exercised: T671 |
| REQ-581 | 5.3 | C | holds | own Check exercised: T674,T675 |
| REQ-579 | 5.3 | C | holds | own Check exercised: T672 |
| REQ-579a | 5.3 | C | holds | no own Check; family exercised: T672 |
| REQ-577 | 5.3 | C | holds | own Check exercised: T670 |
| REQ-574 | 5.3 | C | holds | own Check exercised: T667 |

## Chunk P3 — decision workflows (§5.4)

**Closed 2026-11-09.** Increment record:
`docs/plans/2026-11-09-full-review-p3/`.

**Code targets:** `holonovel/src/index.ts` `respond_decision` (`:3290-3572`),
`parseDecisionOptions`/`needInput` (`:2566-2608`, `:2788`), `manage_scene
(action: choices)` (`:6342-6354`), `spec_health` pending-workflow payload
(`:12041-12044`), `state.checkWorkflowStaleness` (`core/state.ts:1845-1873`),
`manage_character (action: create)` (`:3839-3950`), `core/character-creation.ts`.
**Spec:** §5.4 (32 REQs, 14 families — 13 C, 1 E; none A/B/D).
**Already gated:** no §5.4-specific root gate. The assertions live in the server
suite: `test-workflow` (T32/T138/T157/T266), `test-output-contracts` (T47/T141/
T494), `test-backfill` (T261/T273), `test-character-creation` (T468),
`test-lean-narrator` (T635), `test-persistence` (T158).

### Cluster verdicts

| Cluster | REQs | Verdict | Evidence |
|---|---|---|---|
| A decision transport and staleness | 19 | **findings F-P3-1, F-P3-3, F-P3-5** | `respond_decision` drain, `parseDecisionOptions`, `spec_health.pending_workflow(_warning)` |
| B creation and advancement | 13 | **findings F-P3-2, F-P3-6, F-P3-7, F-P3-8** | `manage_character create`, step-by-step drain, `core/character-creation.ts` |

**Gate/harness assertion vs REQ text.** T32 asserted the *text* rendering of the
choice list (ids and labels present) but never the structured option set, so
REQ-548d/REQ-191 passed while `structuredContent.options` carried a mangled
value. T635 asserted only "options non-empty and cancel present" — the narrow-
assertion class this sweep exists to find.

### Findings

| ID | Finding | Predicate | Severity | Disposition |
|---|---|---|---|---|
| F-P3-1 | `parseDecisionOptions` returned the whole `**id** — label` line as both `value` and `label`, captured only the first choice, and emitted no kebab value, no display label, no free-text/cancel entry and no 25-entry cap — REQ-042b/REQ-191/REQ-548d violated | `index.ts:2566-2570` (pre-fix) | P0 | **Resolved** — parser rewritten (`index.ts:2566-2608`); T32/REQ-548d and T635 assertions widened |
| F-P3-2 | Step-by-step creation collected the `equipment` answer (`index.ts:3480`) and never passed it into the build, so the player's equipment choice was discarded and defaults substituted | `index.ts:3512-3521` (pre-fix) | P0 | **Resolved** — `equipment: wf.answers.equipment ?? []` |
| F-P3-3 | Partial drain: `pending_workflow` cleared before the class-validation error (`:3488` then `:3504`) and before the world-generate missing-payload error (`:3378`) — the state change never applied | `index.ts:3378`, `:3488-3504` (pre-fix) | P0 | **Resolved** — the field is cleared only after validation; error paths leave the workflow open and name it in the corrective action |
| F-P3-4 | Baseline red: 19 holosuite evidence anchors were stale (`index.ts:2589#err`, `state.ts:2465#saveNovel`, …), so `adversarial` (6 findings) and `differential` (1) failed on `predicate_unresolved`; six more were stale but unattached | `holonovel/scripts/lib/holosuite-*.ts` | P0 | **Resolved** (C0 baseline commit) — all 19 repointed; `test:all` 54/54 |
| F-P3-5 | REQ-140 requires the end-Novel disposal to be recorded in the audit log; `state.endNovel` moves the file to trash with no audit entry and `respond_decision` writes none | `index.ts:3406-3416`, `core/state.ts:1697-1725` | P1 | `Scheduled-roadmap` — ROADMAP § §5.4 remediation |
| F-P3-6 | REQ-152a's `equipment` entries carry `name` and `quantity` but no ruleset `source` for player-supplied items, and an equipment-less creation stores `equipment: []` rather than omitting the field | `index.ts:3797-3799` | P1 | `Scheduled-roadmap` — ROADMAP § §5.4 remediation |
| F-P3-7 | REQ-399b requires a *named creation error* when a declared formula fails; `evaluateFormula` throws inside `computeDerived` (`core/character-creation.ts:368`) and the create handler (`index.ts:3780`) does not catch, so the caller sees an uncaught tool failure | `core/character-creation.ts:368`, `index.ts:3780` | P1 | `Scheduled-roadmap` — ROADMAP § §5.4 remediation |
| F-P3-8 | REQ-104c cites Automated T103; no harness implements it (Appendix F catalogues it) | `spec/appendices-reference.md:1564`; no `T103` in `holonovel/scripts` | P1 | `Scheduled-roadmap` — ROADMAP § §5.4 citation repair |
| F-P3-9 | The drain-atomicity fix (F-P3-3) has no reachable in-tree assertion: the failing branch needs a ruleset package with character creation, which the repo does not ship | `index.ts:3503-3504`; `holonovel/scripts/fixtures/` has no ruleset package | P2 | `Scheduled-roadmap` — ROADMAP § §5.4 remediation |

No P0 remains open. F-P3-4 landed as its own baseline commit (C0) because the
baseline was red before the review work; F-P3-1–F-P3-3 landed with the chunk.

### Exit evidence (recorded 2026-11-09)

`check:fast` 37/37 PASS · `check` PASS (0 errors) · server suite `test:all`
54/54 PASS (incl. `test:workflow` 14/14, `test:lean-narrator` 10/10) ·
`check-roadmap` PASS · `check-registers` PASS · `check-loop-artifacts` PASS ·
`build-order` clean.

### P3 per-REQ verdict table (32 rows)

Resolution method: each REQ's own `*Check:*` IDs; a REQ with no own Check
inherits its family's citation set; an `Automated` citation must appear
literally in a harness and its body must exercise the behaviour; `Manual` /
scenario citations need none; bucket inherited from the base family row (D8).

Result: **25 holds, 1 builder-side, 6 findings** (F-P3-1 → 191/548d, F-P3-2 and
F-P3-6 → 152a, F-P3-7 → 399b, F-P3-8 → 104c, F-P3-5 → 140).

| REQ | § | Bucket | Verdict | Evidence |
|---|---|---|---|---|
| REQ-056 | 5.4 | E | builder-side | bucket E; T38 is Manual, T32 applies |
| REQ-042a | 5.4 | C | holds | no own Check; family exercised: T32, T138, T157 |
| REQ-042b | 5.4 | C | holds | no own Check; family exercised: T32, T138, T157; option contract asserted by T32/REQ-548d after F-P3-1 |
| REQ-042c | 5.4 | C | holds | no own Check; family exercised: T32, T138, T157 |
| REQ-042d | 5.4 | C | holds | no own Check; family exercised: T32, T138, T157 |
| REQ-042e | 5.4 | C | holds | no own Check; family exercised: T32, T157 (restart survival) |
| REQ-042f | 5.4 | C | holds | own Check exercised: T32, T138, T157; G2 by kind; S22 scenario |
| REQ-190 | 5.4 | C | holds | own Check exercised: T138; atomicity branch reviewed, fixed under F-P3-3 (assertion gap F-P3-9) |
| REQ-548d | 5.4 | C | finding:F-P3-1 | T635 asserted a narrow subset; parser fixed and assertion widened |
| REQ-191 | 5.4 | C | finding:F-P3-1 | T32 asserted text only; kebab/label pairs now emitted and asserted |
| REQ-192 | 5.4 | C | holds | scenario S22 exercised (test-workflow) |
| REQ-193a | 5.4 | C | holds | no own Check; family exercised: T494 |
| REQ-193b | 5.4 | C | holds | own Check exercised: T494 |
| REQ-104a | 5.4 | C | holds | no own Check; family exercised: T32, T468, T141 |
| REQ-104b | 5.4 | C | holds | no own Check; family exercised: T32, T468, T141 |
| REQ-104c | 5.4 | C | finding:F-P3-8 | T32/T47 exercised; Automated T103 has no harness |
| REQ-181a | 5.4 | C | holds | own Check exercised: T47 |
| REQ-181b | 5.4 | C | holds | own Check exercised: T47 |
| REQ-151a | 5.4 | C | holds | no own Check; family exercised: T32, T468 |
| REQ-151b | 5.4 | C | holds | own Check exercised: T32 |
| REQ-152a | 5.4 | C | finding:F-P3-6 | own Check: T32, G2; step-by-step drop fixed (F-P3-2), source field outstanding |
| REQ-152b | 5.4 | C | holds | own Check exercised: T32, G2 |
| REQ-399a | 5.4 | C | holds | own Check exercised: T468 |
| REQ-399b | 5.4 | C | finding:F-P3-7 | own Check exercised: T468; failure naming unhandled |
| REQ-399c | 5.4 | C | holds | own Check exercised: T260 (test-backfill), T468 |
| REQ-140 | 5.4 | C | finding:F-P3-5 | own Check exercised: T158; disposal not audited |
| REQ-224a | 5.4 | C | holds | no own Check; family exercised: T266 |
| REQ-224b | 5.4 | C | holds | no own Check; family exercised: T266; `spec_health.pending_workflow` carries decision/counter/threshold |
| REQ-224c | 5.4 | C | holds | own Check exercised: T266 |
| REQ-235a | 5.4 | C | holds | no own Check; family exercised: T273 |
| REQ-235b | 5.4 | C | holds | no own Check; family exercised: T273 |
| REQ-235c | 5.4 | C | holds | own Check exercised: T273 |

## Chunk P3b-1 — core state and lifecycle (§5.6)

**Closed 2026-11-09.** Increment record:
`docs/plans/2026-11-09-full-review-p3b/`.

**Code targets:** `core/state.ts` audit/snapshot/undo/redo/combat lifecycle
(`audit` `:1935`, `snapshot` `:1875`, `undo` `:1887`, `redo` `:1902`,
`advanceCombat`/`endCombat`/`addCombatParticipant`/`removeCombatParticipant`
`:2290`–`:2400`), `index.ts` `manage_history` (`:3614`), `manage_combat`
(`:5690`), `manage_condition` (`:7103`), `manage_countdown` (`:6677`),
`manage_vow` (`:7322`), `manage_context (action: recap)` (`:9647`), the
`audit://novel` resource (`:12442`), and `core/server.ts` `withForbiddenAudit`.
**Spec:** the Core State and Lifecycle family block plus `REQ-073a1/a2` — 19
families, **66 REQs, all bucket C**.

### Cluster verdicts

| Cluster | REQs | Verdict | Evidence |
|---|---|---|---|
| A audit log, history, conflicts | 17 | **findings F-P3B1-1, F-P3B1-2, F-P3B1-5, F-P3B1-9** | audit resource and boundary badge fixed; remaining gaps scheduled |
| B combat and conditions | 15 | **findings F-P3B1-2, F-P3B1-4, F-P3B1-7** | messages fixed; turn report and condition badge/audit gaps scheduled |
| C recap, orientation, clocks, vows | 34 | **findings F-P3B1-3, F-P3B1-6, F-P3B1-8, F-P3B1-9** | orientation and clock/vow basics hold; structured recap, clock types, vow lifecycle scheduled |

**Gate/harness assertion vs REQ text.** T203 asserted only that the string
`create_novel` appeared in the resource — not the Markdown shape, the full log,
badge filtering, the boundary prefix, the absence of state queries, or the
no-Novel error. T214/T215/T261/T072 asserted only `Active Novel` for the whole
structured recap contract. T258 exercised the GM condition path only. These
narrow assertions are why the gaps survived.

### Findings

| ID | Finding | Predicate | Severity | Disposition |
|---|---|---|---|---|
| F-P3B1-1 | `audit://novel` returned the last 50 entries as JSON, unfiltered, with no no-Novel error — REQ-168a/b violated (Markdown, full log, player filter, boundary prefix, `[STATE_CONFLICT]` when no Novel) | `index.ts:12447` (pre-fix); T203 at `test-output-contracts.ts:1031` | P0 | **Resolved** — resource renders Markdown with a badge filter and the no-Novel error; T203 asserts format, filter, state-query absence, boundary prefix, no-Novel error; `test-security`/`test-artifact-registry` parse the Markdown |
| F-P3B1-2 | Combat refusals named the nonexistent `end_combat` tool instead of `manage_combat (action: end)` — REQ-203/REQ-221a quote the corrective action | `index.ts:5708`, `:4636` (pre-fix) | P0 | **Resolved** — both messages corrected; T246/T263 assert the quoted action |
| F-P3B1-3 | Recap is a line-oriented text blob, not the typed structure REQ-072b/c1/c2/d requires: no `entities[]`, `lore_entries[]`, `narrative_directive`, `scene_type`, `roster_changes`, `condition_changes`, `story_entries`, `total_combat_rounds`, `timespan_*`, and `confrontations_completed` is a count, not per-combat `{participants, rounds, outcome}` objects (REQ-175a) | `index.ts:9694-9727`; `test-backfill.ts:214` | P1 | `Scheduled-roadmap` — ROADMAP § §5.6 core state and lifecycle remediation |
| F-P3B1-4 | `manage_condition` requires GM/Editor for `apply`/`remove`, refusing a Player on their own active entity (REQ-217b), and neither action writes an audit entry (REQ-217c/REQ-040a) | `index.ts:7115`, `:7135` | P1 | `Scheduled-roadmap` — ROADMAP § §5.6 core state and lifecycle remediation |
| F-P3B1-5 | Audit coverage gaps: badge switches record only the new badge (REQ-040c requires old + new + timestamp, `index.ts:3313`); snapshot truncation discards the oldest snapshot with no `[snapshot-truncated]` entry (REQ-041b, `core/state.ts:1881`); vow mutations write no audit entry (REQ-040a, `index.ts:7338-7411`) | `index.ts:3313`; `core/state.ts:1881`; `index.ts:7338` | P1 | `Scheduled-roadmap` — ROADMAP § §5.6 core state and lifecycle remediation |
| F-P3B1-6 | `manage_countdown` exposes no `clock_type` (or `opposes`/`link_countdown`/`retreat_countdown`), so the racing/linked/tug_of_war/retreat interaction models of REQ-073a1/a2 are unimplemented; `CountdownState.clock_type` is only set internally for faction/mission clocks | `index.ts:6678-6706` schema; `core/state.ts:318` | P1 | `Scheduled-roadmap` — ROADMAP § §5.6 core state and lifecycle remediation |
| F-P3B1-7 | `manage_combat (action: advance)` returns only the turn line with `[AUTO]`; it does not derive the turn report from the audit log (participant actions, rolls, state changes) and the marker case is `[AUTO]`, not `[auto]` (REQ-043b/043c/043f) | `index.ts:5727-5732` | P1 | `Scheduled-roadmap` — ROADMAP § §5.6 core state and lifecycle remediation |
| F-P3B1-8 | Vow lifecycle gaps: `resolve` is not gated on a completed rank track (REQ-289c), `consequences` is not recorded as a `consequence` story entry (REQ-289c), and `resolve`/`forsake` do not remove the linked `vow:<name>` countdown (REQ-322b/322d) | `index.ts:7389-7411` | P1 | `Scheduled-roadmap` — ROADMAP § §5.6 core state and lifecycle remediation |
| F-P3B1-9 | Citation repair: Automated tokens with no harness — T8 (REQ-040d), T25/T33/T110/T161 (REQ-043f), T53/T212 (REQ-072f), T271 (REQ-073a2), T54/T139 (REQ-073c3), T335 (REQ-289e) | per-REQ `_Check:_` lines; no token in `holonovel/scripts` | P1 | `Scheduled-roadmap` — ROADMAP § §5.6 core state and lifecycle remediation |

No P0 remains open. No REQ body changed.

### Baseline and exit evidence (recorded 2026-11-09)

Baseline before review: `check:fast` 37/37 PASS, `check` PASS, nine server
harnesses green (`workflow` 14, `persistence` 41, `persistence-guardrails` 16,
`output-contracts` 338, `backfill` 78, `narrative` 69, `supplementary` 4,
`adventure` 19, `fingerprints` 12), tree clean at `cfaad6b`.

Exit evidence after the two P0 fixes: `check:fast` 37/37 PASS · `check` PASS
(0 errors) · `npm --prefix holonovel run test:all` 54/54 PASS (including
`output-contracts` 344, `security` 12, `artifact-registry` 23) · `check-roadmap`
PASS · `check-registers --strict` PASS · `check-loop-artifacts` PASS ·
`build-order` clean. One holosuite evidence anchor (`index.ts:13810#prompt`)
was repointed to `:13824` after the audit-resource edit shifted the line.

### P3b-1 per-REQ verdict table (66 rows)

Resolution method: each REQ's own `*Check:*` IDs; a REQ with no own Check
inherits its family's citation set; an `Automated` citation must appear
literally in a `holonovel/scripts` harness and its body must exercise the
behaviour; bucket inherited from the base family row (D14).

Result: **59 holds, 7 finding rows carrying 9 finding IDs** (REQ-040a F-4; 040c,
041b F-5; 040d F-9; 043b/c/f F-7+F-9; 217b/c F-4; 072a1/a2/b/c1/c2/d/f F-3+F-9;
175a/b F-3; 073c3 F-9; 289c F-8; 289e F-9; 322b/d F-8; 073a1 F-6; 073a2 F-6+F-9).
Rows marked `holds (fixed …)` carried a P0 that this increment resolved.

| REQ | § | Bucket | Verdict | Evidence |
|---|---|---|---|---|
| REQ-040a | 5.6 | C | finding:F-P3B1-4 | family exercised T70/T100/T203/T147; condition mutations unaudited |
| REQ-040b | 5.6 | C | holds | no own Check; family exercised T70/T100/T203/T147; session-boundary marker at `state.ts:1941-1971` |
| REQ-040c | 5.6 | C | finding:F-P3B1-5 | audit records the new badge only (`index.ts:3313`) |
| REQ-040d | 5.6 | C | finding:F-P3B1-9 | T147 exercised; Automated T8 has no harness |
| REQ-168a | 5.6 | C | holds (fixed F-P3B1-1) | T203 widened to the Markdown/filter/prefix contract |
| REQ-168b | 5.6 | C | holds (fixed F-P3B1-1) | T203 asserts the no-Novel `[STATE_CONFLICT]` |
| REQ-041a | 5.6 | C | holds | no own Check; family exercised T10/T76/T90/T91/T121/T138/T261; per-badge stacks `state.ts:1875-1885` |
| REQ-041b | 5.6 | C | finding:F-P3B1-5 | truncation drops the oldest snapshot without an audit entry (`state.ts:1881`) |
| REQ-041c | 5.6 | C | holds | own Check exercised: T10 |
| REQ-116 | 5.6 | C | holds | own Check exercised: T121; redo stack clear on snapshot `state.ts:1884` |
| REQ-043a | 5.6 | C | holds | no own Check; family exercised T47/T90/T91/T131/T162 |
| REQ-043b | 5.6 | C | finding:F-P3B1-7 | advance does not derive the audit-based turn report |
| REQ-043c | 5.6 | C | finding:F-P3B1-7 | `[AUTO]` marker case and narrative action report absent |
| REQ-043d | 5.6 | C | holds | cumulative `total_combat_rounds` (`state.ts:2317`) |
| REQ-043e | 5.6 | C | holds | briefing combat group implemented |
| REQ-043f | 5.6 | C | finding:F-P3B1-7, F-P3B1-9 | T162 exercised; T25/T33/T110/T161 have no harness |
| REQ-043g | 5.6 | C | holds | combat state Novel-scoped; resume path preserves it |
| REQ-203 | 5.6 | C | holds (fixed F-P3B1-2) | T246 asserts `[STATE_CONFLICT]` and the corrected action |
| REQ-204a | 5.6 | C | holds | no own Check; family exercised T247; validation before initiative |
| REQ-204b | 5.6 | C | holds | own Check exercised: T247 |
| REQ-205a | 5.6 | C | holds | no own Check; family exercised T248; insertion after current turn |
| REQ-205b | 5.6 | C | holds | no own Check; family exercised T248; pointer advances before removal |
| REQ-205c | 5.6 | C | holds | own Check exercised: T248; last-participant auto-end `state.ts:2377` |
| REQ-206a | 5.6 | C | holds | no own Check; family exercised T249; expiry audited `state.ts:2306` |
| REQ-206b | 5.6 | C | holds | no own Check; family exercised T249; no-duration exemption |
| REQ-206c | 5.6 | C | holds | own Check exercised: T249 |
| REQ-221a | 5.6 | C | holds (fixed F-P3B1-2) | navigation guard at `index.ts:4636`; T263 asserts the corrected action |
| REQ-221b | 5.6 | C | holds | own Check exercised: T263 |
| REQ-217a | 5.6 | C | holds | no own Check; family exercised T258; catalogue validation at `index.ts:7120` |
| REQ-217b | 5.6 | C | finding:F-P3B1-4 | Player own-entity path refused by `requireGM()` |
| REQ-217c | 5.6 | C | finding:F-P3B1-4 | no audit entry on apply/remove |
| REQ-217d | 5.6 | C | holds | own Check exercised: T258 (GM path) |
| REQ-072a1 | 5.6 | C | finding:F-P3B1-3 | recap omits active-entity final state and typed fields |
| REQ-072a2 | 5.6 | C | finding:F-P3B1-3 | roster/condition change arrays absent |
| REQ-072b | 5.6 | C | finding:F-P3B1-3 | output is line text, not a typed structure |
| REQ-072c1 | 5.6 | C | finding:F-P3B1-3 | named fields absent |
| REQ-072c2 | 5.6 | C | finding:F-P3B1-3 | named fields absent |
| REQ-072d | 5.6 | C | finding:F-P3B1-3 | typed null/empty-array contract absent |
| REQ-072e | 5.6 | C | holds | session_id/max_transitions/max_rolls implemented and bounded |
| REQ-072f | 5.6 | C | finding:F-P3B1-3, F-P3B1-9 | T213/T214/T215 exercised; T53/T212 have no harness; typed-value acceptance unasserted |
| REQ-072g | 5.6 | C | holds | own Check exercised: T272; Lonelog format path |
| REQ-072h | 5.6 | C | holds | own Check exercised: T518; GM-only gm_notes |
| REQ-072i | 5.6 | C | holds | own Check exercised: T699; tiered memory |
| REQ-279a | 5.6 | C | holds | no own Check; family exercised T328; orientation field present |
| REQ-279b | 5.6 | C | holds | no own Check; family exercised T328; prose + empty-state marker |
| REQ-279c | 5.6 | C | holds | own Check exercised: T328 |
| REQ-174a | 5.6 | C | holds | no own Check; family exercised T473/T213; filter at `index.ts:9697-9712` |
| REQ-174b | 5.6 | C | holds | own Check exercised: T213 |
| REQ-175a | 5.6 | C | finding:F-P3B1-3 | `confrontations_completed` is a count, not per-combat objects |
| REQ-175b | 5.6 | C | finding:F-P3B1-3 | pending is a prose string, not typed null/object |
| REQ-073c1 | 5.6 | C | holds | family exercised T90/T261/T312/T404/T406/T409/T410/T411; round/narrative + direction |
| REQ-073c2 | 5.6 | C | holds | family exercised; advance/remove/fire audit |
| REQ-073c3 | 5.6 | C | finding:F-P3B1-9 | Automated T54/T139 have no harness |
| REQ-329a | 5.6 | C | holds | family exercised T376; three trigger types at `index.ts:4394-4410` |
| REQ-329b | 5.6 | C | holds | own Check exercised: T373/T376 |
| REQ-289a | 5.6 | C | holds | family exercised T407/T412/T413; rank tracks at `index.ts:7356` |
| REQ-289b | 5.6 | C | holds | family exercised; milestone advances |
| REQ-289c | 5.6 | C | finding:F-P3B1-8 | resolve not gated; consequences not a story entry |
| REQ-289d | 5.6 | C | holds | family exercised; active/resolved/forsaken surfaces |
| REQ-289e | 5.6 | C | finding:F-P3B1-9 | Automated T335 has no harness |
| REQ-322a | 5.6 | C | holds | family exercised T369; suggestion + linked advance |
| REQ-322b | 5.6 | C | finding:F-P3B1-8 | linked countdown not removed on close |
| REQ-322c | 5.6 | C | holds | family exercised; shared-scope visibility |
| REQ-322d | 5.6 | C | finding:F-P3B1-8 | resolve does not remove the linked countdown |
| REQ-073a1 | 5.6 | C | finding:F-P3B1-6 | clock_type interaction models unimplemented |
| REQ-073a2 | 5.6 | C | finding:F-P3B1-6, F-P3B1-9 | no `clock_type` parameter; T271 has no harness |
