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

## Status

| Chunk | Surface | Spec | Skill | Status |
|---|---|---|---|---|
| P1 | routing, badge gates, `audit()`, error envelopes | §5.1, §5.5 | `code-review` | **closed 2026-11-09** |
| P2 | tool registration, schemas, descriptions | §5.3 | `code-review` + `spec-review` | scheduled |
| P3 | mutation and decision handlers, lifecycle transitions | §5.4, §5.6 | `code-review` + `spec-review` | scheduled |
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
