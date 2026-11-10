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

### Decisions (2026-11-09, chunk P3b-2)

- **D20 — Chunk scope.** P3b-2 is 93 REQs across 30 families (§5.6 entities and
  NPCs), executed as one increment; the family fence is fixed and the only
  split point is the stopped-run landing.
- **D21 — Fix policy.** D13 unchanged: P0 in-session, P1 roadmap, P2 only on
  demonstrated failure, P3 record-and-close.
- **D22 — Increment record.** `docs/plans/2026-11-09-full-review-p3b2/` for
  plan/tasks/AAR; this worklist carries the P3b-2 table and decisions.
- **D23 — Bucket resolution.** By base family ID (D14): 27 families / 88 REQs
  bucket C; 3 families / 5 REQs bucket E (`REQ-123`, `REQ-124a/b`,
  `REQ-127a/b`); none A/B/D.
- **D24 — Boundaries.** `state.ts` persistence → P4; engine loop, event stream,
  durable agent tasks → P5; subjective-memory internals → P8; badge-filter-only
  predicates → P1. Record and defer across each boundary.
- **D25 — Citation resolution.** P2/P3b-1 method: own `_Check:`, else family
  set; an `Automated` token must appear in a harness and the body must exercise
  the behaviour; `T0nn` shadowing is not evidence (F-P2-4).
- **D26 — Fingerprint consequence.** §5.6 is in `DATA_SECTIONS`; a REQ-body
  edit requires `build-order` regeneration.
- **D27 — No push.** 8 commits unpushed at session start; publication stays
  user-authorized.

### Decisions (2026-11-09, chunk P3b-3)

- **D28 — Chunk scope.** P3b-3 is 39 REQs across 11 families (§5.6 adventure
  content): `REQ-079`, `132`, `170`, `171`, `172`, `229`, `247`, `248`, `249`,
  `250`, `292`. Executed as one increment; the family fence is fixed and the
  only split point is the stopped-run landing.
- **D29 — Fix policy.** D13 unchanged: P0 in-session, P1 roadmap, P2 only on
  demonstrated failure, P3 record-and-close.
- **D30 — Increment record.** `docs/plans/2026-11-09-full-review-p3b3/` for
  plan/tasks/AAR; this worklist carries the P3b-3 table and decisions.
- **D31 — Bucket resolution.** By base family ID (D14): 8 families / 32 REQs
  bucket C; 3 families / 7 REQs bucket E (`REQ-171a/b`, `REQ-172`,
  `REQ-247a/b1/b2/c`); none A/B/D.
- **D32 — Boundaries.** `state.ts` persistence → P4; engine loop, event stream,
  durable agent tasks → P5; generic search ranking and adapters/rulesets → P6;
  subjective-memory internals → P8. A predicate wholly in a later chunk's
  surface is recorded with verdict `deferred:<chunk>`, not as a finding.
- **D33 — Citation resolution.** P2/P3b-1 method: own `_Check:`, else family
  set; an `Automated` token must appear in a harness and the body must exercise
  the behaviour; `T0nn` shadowing is not evidence (F-P2-4).
- **D34 — Fingerprint consequence.** §5.6 is in `DATA_SECTIONS`; a REQ-body
  edit requires `build-order` regeneration. This increment is review-only
  unless a P0 fix amends a body.
- **D35 — No push.** 9 commits unpushed at session start; publication stays
  user-authorized.

### Decisions (2026-11-09, chunk P3b-4)

- **D36 — Chunk scope.** P3b-4 is 67 REQs across 15 families (§5.6 state
  surfaces and fingerprinting): `REQ-044`, `065`, `232`, `233`, `236`, `237`,
  `239`, `241`, `242`, `285`, `302`, `313`, `314`, `321`, `332`. Executed as one
  increment; the family fence is fixed and the only split point is the
  stopped-run landing. `REQ-073a1/a2` belong to P3b-1 and are excluded.
- **D37 — Fix policy.** D13 unchanged: P0 in-session, P1 roadmap, P2 only on
  demonstrated failure, P3 record-and-close.
- **D38 — Increment record.** `docs/plans/2026-11-09-full-review-p3b4/` for
  plan/tasks/AAR; this worklist carries the P3b-4 table and decisions.
- **D39 — Bucket resolution.** By base family ID (D14): 11 families / 56 REQs
  bucket C; 4 families / 11 REQs bucket E (`REQ-044`, `REQ-302a/b`,
  `REQ-313a–d`, `REQ-314a–d`); none A/B/D.
- **D40 — Boundaries.** `state.ts` persistence → P4; event-log ordinals and the
  engine loop → P5; resource projection and world-model tier internals → P6;
  badge-filter-only predicates → P1; subjective-memory internals → P8. A
  predicate wholly in a later chunk's surface is recorded `deferred:<chunk>`.
- **D41 — Citation resolution.** P2/P3b-1 method: own `_Check:`, else family
  set; an `Automated` token must appear in a harness and the body must exercise
  the behaviour; `T0nn` shadowing is not evidence (F-P2-4).
- **D42 — Fingerprint consequence.** §5.6 is in `DATA_SECTIONS`
  (`scripts/lib/contract-fingerprint.ts:38`); a REQ-body edit requires
  `build-order` regeneration. This increment is review-only and changed no REQ
  body.
- **D43 — Plan gate and publication.** Plan stamped `fresh`, standard depth,
  cold pass 5/5 (report `/tmp/opencode/p3b4-independent-review.md`); 10 commits
  unpushed at session start; no push.



### Decisions (2026-11-09, chunk P4)

- **D44 — Chunk scope.** P4 covers `core/state.ts` persistence, `core/data-dir.ts`,
  and the save/load/archive/undo lifecycle, with the nine §5.19 REQs as its spec
  row set. Executed as one increment; the stopped-run landing is the split point.
- **D45 — Fix policy.** D2/D13 unchanged: P0 in-session, P1 roadmap, P2 only on
  a demonstrated failure, P3 record-and-close.
- **D46 — Increment record.** `docs/plans/2026-11-09-full-review-p4/` for
  plan/tasks/AAR; this worklist carries the P4 tables and decisions D44–D51.
- **D47 — Bucket resolution.** By base family ID (D14): the §5.19 block has eight
  family rows and nine REQs (`REQ-403` carries `403a`/`403b`), all bucket C.
- **D48 — Boundaries.** §5.9/§5.19 semantic review stays closed (seam pass);
  P4 is a code-side review, so a persistence code defect is a finding. Event
  log/engine loop → `deferred:P5`; projection → `deferred:P6`; determinism →
  `deferred:P7`; subjective memory → `deferred:P8`. A badge-filter-only
  predicate is `Closed-P3` with the P1 closure reference.
- **D49 — Citation resolution.** D25 method: own `_Check:`, else family set; an
  `Automated` token must appear in a harness and the body must exercise the
  behaviour; `T0nn` shadowing is not evidence (F-P2-4).
- **D50 — Fingerprint consequence.** §5.9 and §5.19 are `DATA_SECTIONS` members;
  a REQ-body edit requires `build-order` regeneration. Review-only unless a P0
  fix amends a body.
- **D51 — Plan gate and publication.** Plan stamped `fresh`, standard depth,
  cold pass 5/5 (report `/tmp/opencode/p4-independent-rereview.md`); 11 commits
  unpushed at session start; no push.

### Decisions (2026-11-09, chunk P5)

- **D52 — Chunk scope.** P5 is the sweep worklist's P5 row: the engine loop,
  `core/event-{hub,log}.ts`, `core/agent.ts`, §5.20 (4 REQs), §5.24 (11), §5.31
  (9), and `docs/engine-contract.md` §2–§6. One increment; a halt is the only
  split.
- **D53 — Fix policy.** D45 unchanged: P0 in-session, P1 roadmap, P2 only on a
  demonstrated failure, P3 record-and-close.
- **D54 — Increment record.** `docs/plans/2026-11-09-full-review-p5/`; this
  worklist carries the P5 tables and D52–D60.
- **D55 — Bucket resolution.** By base family ID (D14): §5.20 has three family
  rows / four REQs (`REQ-412a` is a sub-part), §5.24 eleven, §5.31 nine — 24
  REQs / 23 family rows, all bucket C.
- **D56 — Boundaries (Q5).** P5 owns five event-path predicates: digest
  ordering; the REQ-601 exclusion list and version; legacy/older-projection
  reporting; verify/replay gating; save/load round-trip order and lineage.
  Hash canonicalization → `deferred:P7`; storage mechanics → `Closed-P3` (P4);
  resource projection → `deferred:P6`; staging cognition → `deferred:P8`.
  Q5a: a REQ verdict is worst-of its predicates.
- **D57 — Citation resolution.** D25/D49 method; `T0nn` shadowing is not
  evidence.
- **D58 — Fingerprint consequence.** §5.24/§5.31 are `DATA_SECTIONS` members;
  §5.20 is not. No REQ body changed this increment, so no regeneration was
  required.
- **D59 — Row precedence.** D56's Q5a: `finding` > `deferred` > `Closed-P3` >
  `holds`; cluster and cross-check aggregate verdicts are worst-of under that
  order.
- **D60 — Plan gate and publication.** Plan stamped `fresh`, standard depth,
  cold pass 5/5 (report `/tmp/opencode/p5-cold/report.md`); 12 commits unpushed
  at session start; one C0 baseline commit (`527e5da`) then one C1; no push.
- **D61 — Chunk P6 split.** Whole P6 is 180 REQs / 86 family rows over two code
  families; chunk P6a (this session) = §5.10, §5.11, §5.13, §5.15 (107 REQs /
  36 family rows); chunk P6b = §5.16–§5.18, §5.21–§5.23 (73 REQs / 50 family
  rows).
- **D62 — Fix policy.** Unchanged from D2/D13: P0 fixed in-session (bounded),
  P1 scheduled on `ROADMAP.md`, P2 fixed only on a demonstrated failure, P3
  record-and-close.
- **D63 — Increment record.** `docs/plans/2026-11-09-full-review-p6a/` holds
  plan/tasks/AAR; this worklist is the cross-session tracker and carries the
  P6a tables.
- **D64 — Bucket resolution.** By base family row in `req-coverage.md`:
  §5.10 26 rows all C; §5.11 2 rows all C; §5.13 6 rows all E; §5.15 2 rows all
  E. Re-verified 2026-11-09.
- **D65 — Boundaries.** P6a owns the world data model, parser, conversion,
  coupling, vis/audibility/movement, ruleset-free build, and the
  `manage_world`/`run_command`/`world://` paths. Surface projection and ruleset
  packages → P6b; semantic/corpus/graph → P7; cognition → P8; world storage
  mechanics → P4 (`Closed-P3` unless a §5.10 predicate breaks).
- **D66 — Row precedence.** `finding` > `deferred` > `builder-side` > `holds`;
  cluster verdicts are worst-of their own REQ rows.
- **D67 — Citation resolution.** Own `_Check:_` IDs; family inheritance when
  absent; an `Automated` token must appear literally in a harness whose body
  exercises the behaviour; `Manual`/`Gate`/scenario need none; `T0nn` titles are
  shadowing, not evidence.
- **D68 — Fingerprint consequence.** `DATA_SECTIONS` excludes §5.10/§5.11/
  §5.13/§5.15; a REQ-body edit needs `assemble` + `--write-register` but no
  fingerprint regeneration; `build-order` still runs for version sync.
- **D69 — Row granularity.** One row per REQ (107), bucket inherited per family
  row; family rows may be recorded first and expanded as the review proceeds.
- **D70 — Plan gate and publication.** Plan stamped `fresh`, standard depth,
  cold pass 5/5 with two diff re-reviews (report `/tmp/opencode/p6a-cold/`);
  14 commits unpushed at session start; baseline green (no C0); one C1; no push.

### Decisions (2026-11-09, chunk P6b)

- **D71 — Chunk scope.** P6b is the second half of the P6 split: §5.16 (23
  REQs / 9 family rows), §5.17 (15 / 9), §5.18 (25 / 22), §5.21–§5.23
  (10 / 10) = 73 REQs / 50 family rows. Executed whole; no second split.
- **D72 — Fix policy.** D62 unchanged: P0 fixed in-session (bounded), P1
  scheduled on `ROADMAP.md`, P2 fixed only on a demonstrated failure, P3
  record-and-close. A non-demonstrated P2 is recorded as P3.
- **D73 — Increment record.** `docs/plans/2026-11-09-full-review-p6b/` holds
  plan/tasks/AAR; this worklist is the tracker and carries the P6b tables.
- **D74 — Bucket resolution.** By base family row: §5.16 `REQ-380` C and the
  other eight E; §5.17 `REQ-389`, `430`, `432`, `390`, `391`, `392`, `393` C and
  `394`, `419` E; §5.18 `420`, `423`, `424`, `429`, `558`, `650`, `651`, `652`
  C and the rest E; §5.21–§5.23 all C.
- **D75 — Boundaries.** P6b owns the package manager, the ruleset-scoped
  surface, the host entry points, and the base capabilities. World model →
  P6a (closed); semantic index/corpus/graph → P7; narrative cognition → P8;
  user-data storage mechanics → P4 (closed) except §5.18 fingerprint
  reconciliation. A cross-cutting undo defect (F-P6b-18) is recorded against
  its capability REQs and REQ-041a/b even though §5.1 closed in chunk P1.
- **D76 — Row precedence.** `finding` > `deferred` > `builder-side` > `holds`;
  a resolved finding counts as `holds` for the cluster aggregate.
- **D77 — Citation resolution.** Own `_Check:_` IDs; family inheritance when
  absent; an `Automated` token must appear literally in a harness whose body
  exercises the behaviour; `Manual`/`Gate`/scenario need none; `T0nn` titles
  are shadowing, not evidence. A mis-citation (T431 on REQ-387b) is a finding.
- **D78 — Fingerprint consequence.** `PACKAGE_SECTIONS` = §5.16/§5.17/§6.3/
  §6.4.2; `DATA_SECTIONS` includes §5.21–§5.23. No REQ body changed this
  increment, so no fingerprint regeneration was required; `build-order` ran for
  version sync only.
- **D79 — Row granularity.** One row per REQ (73), bucket inherited per family
  row; behaviour table 20 rows; four cluster verdicts.
- **D80 — Baseline and publication.** Baseline was red on `test:all` (three
  Holosuite tiers, 13 stale evidence anchors); a C0 commit (`40a8808`)
  repointed them before the review. 15 commits unpushed at session start; no
  push.


### Decisions (2026-11-09, chunk P7a)

- **D81 — Chunk split (user-approved).** Whole P7 is 280 REQs / 131 family rows
  (measured, EV1). P7a = §5.7, §5.14, §5.28–§5.30 (91 REQs / 55 family rows);
  P7b = §5.2 + §5.8 (189 / 76). P7a executed this session; P7b stays scheduled.
- **D82 — Fix policy.** D2/D13/D62 unchanged: P0 in-session, P1 roadmap, P2 only
  on a demonstrated failure, P3 record-and-close. No P0 was raised.
- **D83 — Increment record.** `docs/plans/2026-11-09-full-review-p7a/` holds
  plan/tasks/AAR; this worklist is the tracker and carries the P7a tables.
- **D84 — Bucket resolution.** By base family row: §5.7 28 C / 5 E (`REQ-100`,
  `273`, `274`, `416`, `619`); §5.14 `REQ-372` C / `REQ-373` E; §5.28, §5.29,
  §5.30 all C — 49 C / 6 E, 55 rows.
- **D85 — Boundaries.** P7a owns determinism primitives, the supplementary
  import runtime, the corpus, the semantic index, and the graph projection.
  §5.2/§5.8 → P7b; package emission/install → closed P6b findings; storage
  mechanics → P4; narrative cognition → P8. §5.7 is reviewed in full here
  regardless of subject, including the REQ-312 rows.
- **D86 — Row precedence.** `finding` > `deferred` > `builder-side` > `holds`;
  cluster verdicts worst-of their own rows; a resolved finding counts as
  `holds`. No resolved findings this chunk.
- **D87 — Citation resolution.** D10/D25/D49/D67/D77 method; a token must appear
  in a harness whose body exercises the behaviour, so T20's map-rendering body
  is not evidence for REQ-052 (F-P7a-3).
- **D88 — Fingerprint consequence.** `DATA_SECTIONS` includes §5.28 only among
  the five; no REQ body changed, so no fingerprint regeneration was required;
  `build-order` ran for version sync.
- **D89 — Baseline.** The first `check:fast` failed solely on this increment
  directory's missing `tasks.md`/`aar.md` (`check-loop-artifacts`); after Phase
  0 step 2, `check:fast` 37/37 PASS, `check` PASS, `test:all` 56/56 PASS. No C0
  commit was needed.
- **D90 — Publication.** 17 commits unpushed at session start; no push (D4).

## Status

| Chunk | Surface | Spec | Skill | Status |
|---|---|---|---|---|
| P1 | routing, badge gates, `audit()`, error envelopes | §5.1, §5.5 | `code-review` | **closed 2026-11-09** |
| P2 | tool registration, schemas, descriptions | §5.3 | `code-review` + citation resolution | **closed 2026-11-09** |
| P3 | decision and creation handlers, structured choices, staleness | §5.4 | `code-review` + citation resolution | **closed 2026-11-09** |
| P3b-1 | mutation, decision, and lifecycle handlers; audit resource | §5.6 core state and lifecycle | `code-review` + citation resolution | **closed 2026-11-09** |
| P3b-2 | entities, NPCs, personality, briefings | §5.6 entities and NPCs (93 REQs) | `code-review` + citation resolution | **closed 2026-11-09** |
| P3b-3 | adventure content, resources, generation | §5.6 adventure content (39 REQs) | `code-review` + citation resolution | **closed 2026-11-09** |
| P3b-4 | state surfaces and fingerprinting | §5.6 fingerprints, facts, checkpoints, codex (67 REQs) | `code-review` + citation resolution | **closed 2026-11-09** |
| P4 | `core/state.ts`, `core/data-dir.ts`, save/load/archive/undo | §5.19 code-side | `code-review` | **closed 2026-11-09** |
| P5 | engine loop, `core/event-hub.ts`, `core/event-log.ts`, `core/agent.ts` | §5.20, §5.24, §5.31, engine-contract §2–§6 | `code-review` | **closed 2026-11-09** |
| P6a | world model, parser, conversion, coupling, ruleset-free mode | §5.10, §5.11, §5.13, §5.15 (107 REQs) | `code-review` + citation resolution | **closed 2026-11-09** |
| P6b | ruleset packages, host entry points, Fate/Ironsworn/Forged | §5.16–§5.18, §5.21–§5.23 (73 REQs) | `code-review` + citation resolution | **closed 2026-11-09** |
| P7a | `core/{rng,state-hash,limits,corpus,semantic,graph}.ts`, knowledge handlers | §5.7, §5.14, §5.28–§5.30 (91 REQs) | `code-review` + citation resolution | **closed 2026-11-09** |
| P7b | extraction and synthesis handlers; `core/wisdom.ts` | §5.2, §5.8 (189 REQs) | `code-review` + citation resolution | **closed 2026-11-09** |
| P8 | `core/{belief,identity,causal,subjective,perception,memory,divergence}.ts` | §5.12, §5.25–§5.27, §5.32–§5.35 (166 REQs) | `code-review` + citation resolution | **closed 2026-11-09** |
| M1 | `check:conformance`, `fmea`, `graph-deps` | all | machine evidence | **closed 2026-11-09** |

**Mapping invariant.** Every subsection of §5.1–§5.8, §5.10–§5.18, §5.20–§5.31 is
assigned exactly once, plus §5.32–§5.35 in P8. §5.9 and §5.19 are the
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

## Chunk P3b-2 — entities and NPCs (§5.6)

**Closed 2026-11-09.** Increment record:
`docs/plans/2026-11-09-full-review-p3b2/`.

**Code targets:** `manage_character` (`index.ts:3846`), `manage_npc` (`:6424`),
`manage_scene` (`:6166`), `manage_staging` (`:6661`), `manage_story` (`:7895`),
`manage_knowledge` (`:8912`); `entities://`/`party://current` (`:12545`),
`roster://current` (`:12287`), `scene://current`/`history` (`:12292`),
`entity://{id}/personality` (`:12269`), `npc://{id}` (`:12353`),
`npc://{id}/personality` (`:12391`), `npcs://` (`:12378`); personality group and
NPC voice directive (`:14126-14155`); signals/boundaries (`:4074-4086`,
`:14010-14040`); `core/state.ts` entity factory/roster (`:984`, `:2621`,
`:2695`); `core/limits.ts`.
**Spec:** entities, NPCs, personality, and briefings family block —
**93 REQs across 30 families; 88 bucket C, 5 bucket E.**

### Cluster verdicts

| Cluster | REQs | Verdict | Evidence |
|---|---|---|---|
| A roster, entities, scene, presence | 33 | **findings F-P3B2-1, F-P3B2-2, F-P3B2-3, F-P3B2-4, F-P3B2-5, F-P3B2-14** | roster and presence basics hold; duplicate import, roster listing/resources, scene cap/tick/warning, fast-forward, and presence markers scheduled |
| B NPC records, stat blocks, memory | 28 | **findings F-P3B2-6, F-P3B2-7, F-P3B2-8, F-P3B2-14** | stat-block reference/rendering/resources and card import/export hold; depth metadata, description unification, and memory depth scheduled |
| C personality, voice, signal, briefing | 32 | **findings F-P3B2-9, F-P3B2-10, F-P3B2-11, F-P3B2-12, F-P3B2-13, F-P3B2-14** | ownership gating, boundary section, and connection counter hold; personality/voice briefing rendering, directives, resources, signals, and boundary collision scheduled |

**Gate/harness assertion vs REQ text.** T201 asserted that
`npc://<id>/personality` contains `gruff` — not the briefing personality group,
voice ordering, or empty-field omission. T216/T217/T219 asserted `[OK]` /
`[NOT_FOUND]` only — not roster-baseline independence, valid-ID enumeration, or
the race/class/level listing. T220 asserted the entity count, not the duplicate
import conflict. T331 exercised scene fields, not the lore contradiction
warning. T356 asserted `npc_memory_count ≥ 1`, not the memory model.

### Findings

| ID | Finding | Predicate | Severity | Disposition |
|---|---|---|---|---|
| F-P3B2-1 | Entity/roster lifecycle: import has no per-Novel duplicate guard (REQ-074c); `party://current` omits HP (REQ-074b); entity removal leaves presence and audit stale (REQ-176a); `roster_remove` enumerates no valid IDs and writes no audit (REQ-177) | `index.ts:3996-4001`, `:12560-12566`, `:4120-4126`, `:4122` | P1 | `Scheduled-roadmap` — ROADMAP § §5.6 entities and NPCs remediation |
| F-P3B2-2 | Roster listing/resources: `roster_list` returns id+name only, omitting race/class/level (REQ-178a); `roster://<id>` and `roster://<type>` do not exist (REQ-178b) | `index.ts:4127-4130`, `:12287` | P1 | `Scheduled-roadmap` — same |
| F-P3B2-3 | Scene ledger: `scene_history` is unbounded with no cap or `[truncated]` marker (REQ-076b2/129c); `scene_tick` is absent (REQ-076b3); no lore/disposition contradiction warning (REQ-076b5–b7) | `index.ts:12295-12307`, `:6189`; `scene_tick` absent | P1 | `Scheduled-roadmap` — same |
| F-P3B2-4 | Fast-forward: `round` countdowns are not advanced proportionally, lore triggers are absent from the audit/summary, and no bridging prose is emitted (REQ-252a/b/c) | `index.ts:6211-6237` | P1 | `Scheduled-roadmap` — same |
| F-P3B2-5 | Presence: no `last_location` field (party uses `current_room`), no `[not present]` marker in the entity listing, and `manage_staging (action: presence)` accepts no `location` (REQ-307a/b/c) | `index.ts:12561`, `:6299`, `:6661-6674` | P1 | `Scheduled-roadmap` — same |
| F-P3B2-6 | NPC depth metadata is unimplemented: no `appearance_count`/`first_seen`/`last_seen`, no `[recurring]`/`[campaign]`/`[distant]` markers, no recap heatmap (REQ-075c/d/e) | NPC record in `core/state.ts`; no predicate exists | P1 | `Scheduled-roadmap` — same |
| F-P3B2-7 | NPC `description` diverges: create/update writes `npc.description`, while `npc://<id>/personality` reads `npc.personality` (REQ-156) | `index.ts:6503`, `:12398` | P1 | `Scheduled-roadmap` — same |
| F-P3B2-8 | NPC memory depth: only combat calls `recordNpcInteraction`; no party knowledge, emotional-state summary, social/mechanical ingestion, or campaign-memory coupling (REQ-311b/c/d/f) | `index.ts:5727`, `:4143-4186` | P1 | `Scheduled-roadmap` — same |
| F-P3B2-9 | Personality surfaces: `badge_briefing` renders no entity personality group, `voice_examples` never render ahead of traits, `persona` is NPC-only, and the 5-example cap is unenforced (REQ-077a/b/d/e, REQ-126a/b, REQ-166a/b/c) | `index.ts:14126-14155`, `:3105-3115`; no personality group | P1 | `Scheduled-roadmap` — same |
| F-P3B2-10 | NPC voice directive: Player badge never sees shared-scope directives, NPCs carry no `scope`, and no tag/`scene_type` filtering or role field is implemented (REQ-282a/b/c) | `index.ts:14138-14155`, `:6452-6464` | P1 | `Scheduled-roadmap` — same |
| F-P3B2-11 | Personality resources return the bare personality object (no `entity_id`/`npc_id`, `name`, or `voice_examples`) and are not badge-filtered (REQ-167a/b) | `index.ts:12276-12277`, `:12398` | P1 | `Scheduled-roadmap` — same |
| F-P3B2-12 | Player signals: storage is a string map, empty value is stored rather than removed, no timestamp/`connection_counter`, the briefing shows no age, and the audit tool/prefix differ from the contract (REQ-069a/b/c, REQ-128a/b, REQ-173b) | `index.ts:4085`, `:14031-14040`; `core/state.ts:711` | P1 | `Scheduled-roadmap` — same |
| F-P3B2-13 | Boundary propagation: the collision warning runs only on `manage_scene (action: set)`, not on NPC create/update, lore set/update, or `manage_scene (action: directive)` (REQ-255b) | `index.ts:6283` | P1 | `Scheduled-roadmap` — same |
| F-P3B2-14 | Citation repair: Automated tokens with no harness or a false match — T55 (074b), T56 (075e), T57/T112/T132 (076b4), T58/T65/T140 (077f/126b/167b), T8/T142 (069c/128b), T723 (075g), T131 (124b); narrow assertions T201/T216/T220/T331 | per-REQ `_Check:_` lines; `holonovel/scripts` search | P1 | `Scheduled-roadmap` — same |

No P0 remains open. **No source or REQ body changed** in this increment.

### Baseline and exit evidence (recorded 2026-11-09)

Baseline: `check:fast` 37/37 PASS · `check` PASS · `npm --prefix holonovel run
test:all` 54/54 PASS — tree at `aad37c2` with only the increment directory
untracked.

Exit evidence: `npm run assemble` exit 0 · `check:fast` 37/37 PASS ·
`check` PASS · `npm --prefix holonovel run test:all` 54/54 PASS ·
`check-registers --strict` PASS · `check-roadmap` OK (11 sections) ·
`check-loop-artifacts` PASS · `build-order` 0 errors. No source or REQ body
changed; no fingerprint regeneration was required.

### P3b-2 per-REQ verdict table (93 rows)

Resolution method: each REQ's own `*Check:*` IDs; a REQ with no own Check
inherits its family's citation set; an `Automated` citation must appear
literally in a `holonovel/scripts` harness and its body must exercise the
behaviour; bucket inherited from the base family row (D23).

Result: **38 holds, 50 finding rows carrying 14 findings, 5 builder-side.**

| REQ | § | Bucket | Verdict | Evidence |
|---|---|---|---|---|
| REQ-074a | 5.6 | C | holds | entities:// + set_active + party-move path; family T216/T218/T220/S17 |
| REQ-074b | 5.6 | C | finding:F-P3B2-1 | party://current omits HP (`index.ts:12560-12566`); Automated T55 has no harness |
| REQ-074c | 5.6 | C | finding:F-P3B2-1 | no duplicate-import guard (`index.ts:3996-4001`); T220 asserts entity count only |
| REQ-176a | 5.6 | C | finding:F-P3B2-1 | removal does not clear presence or audit (`index.ts:4120-4126`) |
| REQ-176b | 5.6 | C | holds | requireGM guard (`index.ts:4116`); T216 exercises GM removal |
| REQ-177 | 5.6 | C | finding:F-P3B2-1 | roster_remove NOT_FOUND lists no valid IDs and writes no audit (`index.ts:4122`) |
| REQ-178a | 5.6 | C | finding:F-P3B2-2 | roster_list returns id+name only, omits race/class/level (`index.ts:4127-4130`) |
| REQ-178b | 5.6 | C | finding:F-P3B2-2 | only roster://current exists; no roster://<id> or roster://<type> (`index.ts:12287`) |
| REQ-129a | 5.6 | C | holds | capGuard names group/current/max (`core/limits.ts:40-47`) |
| REQ-129b1 | 5.6 | C | holds | own Check exercised: T143 |
| REQ-129b2 | 5.6 | C | holds | own Check exercised: T218 |
| REQ-129c | 5.6 | C | holds | T143/spec_health per-group counts |
| REQ-129d | 5.6 | C | holds | own Check exercised: T143, T218 |
| REQ-076b1 | 5.6 | C | holds | fields preserved; T137 exercised |
| REQ-076b2 | 5.6 | C | finding:F-P3B2-3 | scene history unbounded; no cap, truncated marker, or suppressed count (`index.ts:12295-12307`) |
| REQ-076b3 | 5.6 | C | finding:F-P3B2-3 | scene_tick counter absent from state and briefing |
| REQ-076b4 | 5.6 | C | finding:F-P3B2-14 | T57/T112/T132 absent; T137 exercises the stored fields only |
| REQ-076b5 | 5.6 | C | finding:F-P3B2-3 | no lore-contradiction warning in manage_scene set |
| REQ-076b6 | 5.6 | C | finding:F-P3B2-3 | no lore/disposition contradiction comparison exists |
| REQ-076b7 | 5.6 | C | finding:F-P3B2-3 | T331 exercises scene state, not the contradiction warning |
| REQ-076a1 | 5.6 | C | holds | own Check exercised: T133/T137 |
| REQ-076a2 | 5.6 | C | holds | own Check exercised: T133 |
| REQ-252a | 5.6 | C | finding:F-P3B2-4 | round clocks not advanced; no bridging prose of lore/NPC changes (`index.ts:6211-6237`) |
| REQ-252b | 5.6 | C | finding:F-P3B2-4 | audit entry lacks lore triggers; round-clock adjustments absent |
| REQ-252c | 5.6 | C | finding:F-P3B2-4 | T312 exercises narrative clocks and undo; round clocks/lore triggers unasserted |
| REQ-307a | 5.6 | C | finding:F-P3B2-5 | no last_location field; party uses current_room (`index.ts:12561`) |
| REQ-307b | 5.6 | C | finding:F-P3B2-5 | no [not present] marker in the entity listing; manage_staging presence has no location parameter |
| REQ-307c | 5.6 | C | finding:F-P3B2-5 | presence [] works; marker and location gaps remain; T351 partial |
| REQ-308a | 5.6 | C | holds | knowledge_state presence marker (`index.ts:966`) |
| REQ-308b | 5.6 | C | holds | own Check exercised: T352 |
| REQ-330a | 5.6 | C | holds | exploration auto-presence path exercised |
| REQ-330b | 5.6 | C | holds | Explored grouping in knowledge_state (`index.ts:943-954`) |
| REQ-330c | 5.6 | C | holds | own Check exercised: T374, T377 |
| REQ-075a | 5.6 | C | holds | family T129/T409/T513/T722/T724/T725 |
| REQ-075b | 5.6 | C | holds | family exercised; mind stripped by sanitizeNpcForBadge |
| REQ-075c | 5.6 | C | finding:F-P3B2-6 | appearance_count/first_seen/last_seen absent; no [recurring]/[campaign] markers |
| REQ-075d | 5.6 | C | finding:F-P3B2-6 | no [distant] marker or session-distance computation |
| REQ-075e | 5.6 | C | finding:F-P3B2-6 | no recap NPC heatmap; Automated T56 has no harness |
| REQ-075f | 5.6 | C | holds | own Check exercised: T513, T722 |
| REQ-075g | 5.6 | C | finding:F-P3B2-14 | talkativeness default 50 implemented (`index.ts:380-383`); T723 absent |
| REQ-075h | 5.6 | C | holds | own Check exercised: T724 |
| REQ-075i | 5.6 | C | holds | own Check exercised: T725 |
| REQ-119a | 5.6 | C | holds | reference-populated stats (`index.ts:6470-6478`) |
| REQ-119b | 5.6 | C | holds | own Check exercised: T126 |
| REQ-119c | 5.6 | C | holds | caller fields extend the stat surface |
| REQ-119d | 5.6 | C | holds | family T126; builder mapping recorded |
| REQ-120 | 5.6 | C | holds | own Check exercised: T127 |
| REQ-121 | 5.6 | C | holds | own Check exercised: T128; npcs:// badge-filtered |
| REQ-122a | 5.6 | C | holds | narrative fields on NPCs via manage_character |
| REQ-122b | 5.6 | C | holds | own Check exercised: T129 |
| REQ-156 | 5.6 | C | finding:F-P3B2-7 | create/update writes npc.description (`index.ts:6503`); npc://<id>/personality reads personality only (`:12398`) |
| REQ-123 | 5.6 | E | builder-side | bucket E; builder-defined stat surface (T130) |
| REQ-124a | 5.6 | E | builder-side | bucket E; acceptance tool `roll_weapon_damage` is absent |
| REQ-124b | 5.6 | E | builder-side | bucket E; T131 exercises conflict lifecycle, not NPC damage |
| REQ-311a | 5.6 | C | holds | per-NPC memory store (`recordNpcInteraction`) |
| REQ-311b | 5.6 | C | finding:F-P3B2-8 | combat-only ingestion; no party knowledge or emotional-state summary |
| REQ-311c | 5.6 | C | finding:F-P3B2-8 | no per-entity party knowledge (capabilities/relationship status) |
| REQ-311d | 5.6 | C | finding:F-P3B2-8 | only combat calls recordNpcInteraction (`index.ts:5727`); no social/mechanical updates |
| REQ-311e | 5.6 | C | holds | presence-gated NPC memory section |
| REQ-311f | 5.6 | C | finding:F-P3B2-8 | no campaign-memory coupling on disposition flips |
| REQ-311g | 5.6 | C | finding:F-P3B2-8 | T356 asserts npc_memory_count only |
| REQ-077a | 5.6 | C | finding:F-P3B2-9 | persona is an NPC field only; voice_examples is not capped at 5 |
| REQ-077b | 5.6 | C | finding:F-P3B2-9 | personality edits target the Novel entity; no roster-baseline edit path |
| REQ-077c | 5.6 | C | holds | update shallow-merges stats; Player allowed |
| REQ-077d | 5.6 | C | finding:F-P3B2-9 | badge_briefing renders no entity personality group |
| REQ-077e | 5.6 | C | finding:F-P3B2-9 | voice_examples are not rendered ahead of traits (sheet or briefing) |
| REQ-077f | 5.6 | C | finding:F-P3B2-9 | T58/T65/T140 absent |
| REQ-126a | 5.6 | C | finding:F-P3B2-9 | no voice_examples rendering in prompt context |
| REQ-126b | 5.6 | C | finding:F-P3B2-9 | sheet/briefing omit voice_examples; T140 absent |
| REQ-282a | 5.6 | C | finding:F-P3B2-10 | Player badge never sees shared-scope NPC directives; no scope field |
| REQ-282b | 5.6 | C | finding:F-P3B2-10 | directive omits role; placement after personality fields moot |
| REQ-282c | 5.6 | C | finding:F-P3B2-10 | no tag/scene_type filtering (`index.ts:14146-14153`) |
| REQ-282d | 5.6 | C | holds | own Check exercised: T332 |
| REQ-127a | 5.6 | E | builder-side | bucket E; builder mapping |
| REQ-127b | 5.6 | E | builder-side | bucket E; builder mapping |
| REQ-165a | 5.6 | C | holds | ownership is non-exclusive per REQ-165b |
| REQ-165b | 5.6 | C | holds | own Check exercised: T200 |
| REQ-166a | 5.6 | C | finding:F-P3B2-9 | no entity personality block in badge_briefing |
| REQ-166b | 5.6 | C | finding:F-P3B2-9 | no empty-state marker for the personality group |
| REQ-166c | 5.6 | C | finding:F-P3B2-9 | T201 asserts the personality resource, not briefing rendering |
| REQ-167a | 5.6 | C | finding:F-P3B2-11 | resources return the bare personality object; no entity_id/name/voice_examples (`index.ts:12276-12277`) |
| REQ-167b | 5.6 | C | finding:F-P3B2-11 | no badge filtering; T58/T65 absent |
| REQ-069a | 5.6 | C | finding:F-P3B2-12 | empty value is stored, not removed (`index.ts:4085`); no last_updated |
| REQ-069b | 5.6 | C | finding:F-P3B2-12 | player_signals is Record<string,string>; no {value, connection_counter} (`core/state.ts:711`) |
| REQ-069c | 5.6 | C | finding:F-P3B2-12 | audit tool/prefix differ from the contract; T8/T142 absent |
| REQ-128a | 5.6 | C | finding:F-P3B2-12 | signals section has no age or 'set N connections ago' (`index.ts:14031-14040`) |
| REQ-128b | 5.6 | C | finding:F-P3B2-12 | empty signals render as blank entries; T142 absent |
| REQ-255a | 5.6 | C | holds | Boundaries section (GM only, untruncated) |
| REQ-255b | 5.6 | C | finding:F-P3B2-13 | collision check runs only on manage_scene set (`index.ts:6283`) |
| REQ-255c | 5.6 | C | holds | own Check exercised: T314 |
| REQ-173a | 5.6 | C | holds | connection_counter increments per connect (`core/state.ts:1805`) |
| REQ-173b | 5.6 | C | finding:F-P3B2-12 | no age display; blocked by the string-only signal store |
| REQ-173c | 5.6 | C | holds | own Check exercised: T211 |

## Chunk P3b-3 — adventure content

**Code targets:** `holonovel/src/index.ts` `manage_adventure` (`:10004`, actions
`generate` `:10017`, `generate_encounter` `:10084`, `load` `:10133`, `list`
`:10214`); `adventures://` (`:10246`), `adventure://{slug}/overview` (`:10264`),
`adventure://{slug}/navigation` (`:10277`); `spec_health` adventure fields
(`:12033-12037`); briefing waypoint block (`:13895-13901`); `manage_scene`
waypoint path (`:6139`, `:6180`, `:6203-6209`); adventure file helpers
(`:2492-2521`); `core/adventure-provenance.ts`; `core/state.ts:761`.
**Spec:** §5.6 adventure block `spec/02-requirements.md:1940-2065` (39 REQs, 11
families).
**Already gated:** nothing adventure-specific. `check:fast` says nothing about
adventure behaviour; the carrying assertions live in `test-adventure.ts`
(`T75`, `T367`, `T244`, `T734`, `T735`, `T740`, `T741`) and
`test-output-contracts.ts:1080-1130` (`T146`, `T207`, `T284`, `T285`, `T286`,
`T305`, `T338`).
**Exit evidence (recorded 2026-11-09):** `check:fast` 37/37 PASS, `check` PASS,
`npm --prefix holonovel run test:all` 54/54 PASS; tree at `6ca27ba` with only
this increment's directory untracked. Findings F-P3B3-1…F-P3B3-12 scheduled
under a new roadmap section; no source file or REQ body changed (review-only),
so no fingerprint regeneration was needed.

### P3b-3 per-REQ verdict table

One row per REQ: `holds`, `finding:<ID>`, `builder-side`, or
`deferred:<chunk>`. Resolution method per D33: each REQ's own `_Check:` IDs; a
REQ with no own Check inherits its family citation set; an `Automated` token
must appear literally in a `holonovel/scripts` harness **and** the harness body
must exercise the stated behaviour.

| REQ | § | Bucket | Verdict | Reason |
|---|---|---|---|---|
| REQ-079a | 5.6 | C | holds | World extraction and `@npc`/`@lore`/hazard materialization; T244 and the REQ-622 case exercise it (`test-adventure.ts:260`, `:290`) |
| REQ-079b | 5.6 | C | finding:F-P3B3-3 | flat-prose search absent: `manage_ruleset (action: search)` never queries adventure content (`index.ts:11161-11201`) |
| REQ-079c | 5.6 | C | finding:F-P3B3-2 | load builds `adventure_index` only; no extracted NPC/faction entities, lore entries, or hook (`index.ts:10149-10160`) |
| REQ-079d | 5.6 | C | finding:F-P3B3-12 | duplicate skip with note exists (`index.ts:2680-2700`); the fuzzy `lookup_monster` suggestion is absent |
| REQ-079e | 5.6 | C | finding:F-P3B3-3 | no adventure search, confidence tiering, or active-first sort; no `adventure://<slug>/<anchor>` resource (`index.ts:10246-10295`) |
| REQ-079f | 5.6 | C | finding:F-P3B3-2 | briefing carries no adventure hook/location/room block (`index.ts:13880-13910`) |
| REQ-079g | 5.6 | C | finding:F-P3B3-12 | env var is `TTRPG_ADVENTURE_DIR` (`index.ts:2493`), not `TTRPG_ADVENTURE`; NOT_FOUND enumerates directories, not slugs (`:10136`) |
| REQ-079h | 5.6 | C | finding:F-P3B3-1 | `load` ignores `target` and requires an active Novel (`index.ts:10133-10138`); no codex scaffold path |
| REQ-079i | 5.6 | C | finding:F-P3B3-1 | `load` cannot run without a Novel; `target` is not read |
| REQ-079j1 | 5.6 | C | holds | embed/export implemented (`embeddedAdventureContent` `index.ts:10307-10324`); family citations are stale (F-P3B3-11) |
| REQ-079j2 | 5.6 | C | finding:F-P3B3-11 | cites T59/T60/T61/T206/T287/T368; none appears in a harness title |
| REQ-292a | 5.6 | C | finding:F-P3B3-6 | filter is bypassed for the GM (`index.ts:10235`); T338 asserts only the empty state and count |
| REQ-292b | 5.6 | C | finding:F-P3B3-6 | no `player_visible`/`shared` hook rule; Player sees every entry with a preview (`index.ts:10236`) |
| REQ-292c | 5.6 | C | holds | empty-state message and count exercised (T338, `test-output-contracts.ts:1094`); narrative sections are MAY |
| REQ-292d | 5.6 | C | finding:F-P3B3-2 | narrative-only load creates no faction/lore/NPC entities from the index |
| REQ-170 | 5.6 | C | finding:F-P3B3-5 | `indexed_adventures` is GM-only, one scaffold string, no build-time hashes (`index.ts:12033-12035`); T207 never reads it |
| REQ-171a | 5.6 | E | builder-side | build-time validation (§6.3); no runtime predicate |
| REQ-171b | 5.6 | E | finding:F-P3B3-5 | `[malformed-adventure]` is never emitted; partial-index retrieval is a runtime surface |
| REQ-172 | 5.6 | E | finding:F-P3B3-5 | no startup hash comparison and no `[adventure-drift]` entry (`index.ts` has neither string) |
| REQ-247a | 5.6 | E | builder-side | build-time extraction; the runtime load path is not this contract |
| REQ-247b1 | 5.6 | E | builder-side | build-time extraction |
| REQ-247b2 | 5.6 | E | builder-side | build-time extraction |
| REQ-247c | 5.6 | E | builder-side | build-time extraction; T283 (build acceptance) has no runtime harness |
| REQ-248a | 5.6 | C | finding:F-P3B3-7 | overview omits NPC roles and location descriptions; Players lose factions entirely rather than badge-filtering per section (`index.ts:10271`) |
| REQ-248b | 5.6 | C | holds | `[WARNING] No structured overview available for '<slug>'` (`index.ts:10269`); T285 |
| REQ-249a | 5.6 | C | finding:F-P3B3-7 | no heading anchors, no GM-section badge filter; STATE_CONFLICT tests Novel absence, not adventure absence (`index.ts:10277-10295`) |
| REQ-249b | 5.6 | C | holds | `[WARNING] No navigation index available.` (`index.ts:10283`); T286 |
| REQ-250a | 5.6 | C | holds | briefing labels slug and heading and lists adjacent scenes (`index.ts:13895-13901`); own Check is narrow (F-P3B3-11) |
| REQ-250b | 5.6 | C | finding:F-P3B3-8 | waypoint-only change leaves `isTransition` false, so no scene-transition hook or audit (`index.ts:6180`, `:6203-6209`) |
| REQ-250c | 5.6 | C | finding:F-P3B3-7 | briefing renders regardless of badge, but the resource prose is never badge-filtered; T284 asserts neither |
| REQ-229a | 5.6 | C | finding:F-P3B3-10 | only wisdom voice/lore matches; no `@encounter` pattern or theme matching (`index.ts:10198-10203`) |
| REQ-229b | 5.6 | C | finding:F-P3B3-10 | no automatic activation or briefing/resource presence of matched items |
| REQ-229c | 5.6 | C | finding:F-P3B3-10 | no community-tier "Synthesis X items found" prompt |
| REQ-229d | 5.6 | C | finding:F-P3B3-11 | T305 asserts the augmentation line only; the omission branch is unasserted |
| REQ-132a | 5.6 | C | finding:F-P3B3-3 | Novel scope and discard hold; search/briefing surfacing of generated content does not (`index.ts:11161-11201`) |
| REQ-132b | 5.6 | C | finding:F-P3B3-9 | `load` clears `novel.generated_adventure` (`index.ts:10195`, `:10205`), so coexistence is impossible |
| REQ-132c | 5.6 | C | finding:F-P3B3-9 | no briefing ordering, no `[generated]` search tag, no `## World` generation (`index.ts:10017-10082`) |
| REQ-132d | 5.6 | C | finding:F-P3B3-9 | generated output carries no `## World` section, rooms, or exits |
| REQ-132e | 5.6 | C | finding:F-P3B3-11 | T146 asserts overview/navigation only; restart, replace, and end-discard branches are unasserted |

### Cluster verdicts

| Cluster | REQs | Verdict |
|---|---|---|
| A indexed module load and catalog | 079a–j2, 292a–d (15) | findings F-P3B3-1…F-P3B3-6, F-P3B3-11, F-P3B3-12 |
| B discovery, validation, drift, extraction | 170, 171a–b, 172, 247a–c (8) | finding F-P3B3-5; five builder-side rows (171a, 247a/b1/b2/c) |
| C resources, waypoint, synthesis linkage | 248a–b, 249a–b, 250a–c, 229a–d (11) | findings F-P3B3-7, F-P3B3-8, F-P3B3-10, F-P3B3-11; holds on 248b/249b/250a |
| D generated-adventure lifecycle | 132a–e (5) | findings F-P3B3-9, F-P3B3-3, F-P3B3-11 |

**Totals:** 39 rows — 6 holds, 5 builder-side, 28 finding rows carrying 12
findings (all P1; no P0).

## Chunk P3b-4 — state surfaces and fingerprinting (§5.6)

**Closed 2026-11-09.** Increment record:
`docs/plans/2026-11-09-full-review-p3b4/`.

**Code targets:** `core/state.ts` build-fingerprint persistence and drift
(`:1060-1090`), session-boundary markers (`:1935-1990`), audit compaction
(`:2121-2180`), server-notes and codex persistence (`:2642-2692`); `index.ts`
`manage_novel` `save_context`/`get_context`/`info` (`:11013`, `:11032`,
`:10907`), checkpoints (`:11043-11059`), `manage_archive` (`:11354`),
`manage_faction` (`:7181`), `manage_relationship` (`:7263`), `manage_note`
(`:8016`), `manage_context`/`manage_diagnostics` (`:9945`, `:9958`),
`manage_codex` (`:13218`), session tools (`:14416`, `:14455`, `:14478`), the
`notes://`, `server-notes://`, `codex://`, `faction://`, `factions://`,
`audit://novel`, and `audit://novel/archive` resources, and `spec_health`
integrity fields (`:11912-12063`).
**Spec:** the *Fingerprinting and State Integrity* block — 16 families / 69
REQs, less `REQ-073a1/a2` (P3b-1) = **67 REQs, 15 families**: 11 bucket C
(56 REQs), 4 bucket E (11 REQs); none A/B/D.
**Already gated:** no §5.6-specific root gate. The assertions live in the server
suite: `test-persistence` / `test-backfill` (T224, T268, T280, T334),
`test-narrative` (T269, T397, T402, T408, T410, T413, T415, T416),
`test-output-contracts` (T275, T366, T380, T382, T383, T384),
`test-limits` (T277, T279), `test-persistence-guardrails` (T471),
`test-fingerprints`. `check:fast` says nothing about these behaviours.

### Cluster verdicts

| Cluster | REQs | Count | Verdict | Evidence |
|---|---|---|---|---|
| A fingerprinting and rebuild | 044, 302a–b, 065a–f, 313a–d, 314a–d | 17 | **finding F-P3B4-10**; 10 builder-side; 6 holds | `core/state.ts:1060-1090` emits each drift marker and `spec_health.build_drift`; the four bucket-E families are builder contracts (no runtime harness expected) |
| B continuity and world reactivity | 232a–d, 233a1–a3/b1–b3, 236a–c, 237a/b1–b2 | 16 | **findings F-P3B4-1, -2, -3, -4, -11, -13**; 8 holds | `save_context`/`get_context` (`index.ts:11013-11042`), faction clock mirror (`:7181-7255`), relationship handler (`:7263-7310`), session boundary (`core/state.ts:1943-1971`) |
| C durability and notes | 239a–d, 241a–c, 242a–d, 285a–c | 14 | **findings F-P3B4-5, -6, -14, -15**; 10 holds | `compactAuditLog` (`core/state.ts:2121-2180`), checkpoints (`index.ts:11043-11059`), notes (`:8016-8098`), server notes (`core/state.ts:2642-2666`) |
| D codex and provenance | 321a–n, 332a–c | 20 | **findings F-P3B4-6, -7, -8, -9**; 17 holds | `manage_codex` (`index.ts:13218-13445`), `codex://` (`:12683`), `spec_health.codex` (`:12030`), `codex_sources` (`:10907`, `:12032`) |

**Gate/harness assertion vs REQ text.** T268 asserted one `get_context` field,
not the `badge_briefing` payload, the `decision`/`bond` story filter, or the
intro summary. T275 asserted only that `spec_health.sessions` is an array, never
the boundary markers, recap scoping, or per-session metrics. T280 and T334
asserted set/list/remove only, not the default scope, badge filtering,
`[FORBIDDEN]`, persistence, or resources. T384's title claims "reports stale"
but its body asserts only that the health payload contains the substring
`codex` — the `[codex-stale]` flag it names does not exist in the source at all.
These narrow assertions are why the gaps survived.

### Findings

| ID | Finding | Predicate | Severity | Disposition |
|---|---|---|---|---|
| F-P3B4-1 | Pause/resume context gaps: `get_context` returns JSON without the required `badge_briefing` prompt (REQ-232b); `save_context` captures the last three story entries without the `decision`/`bond` type filter (REQ-232c); the `intro` prompt never includes the `gm_context` summary (REQ-232c) | `index.ts:11013-11042`, `:13824-13858`; `core/prompt-composition.ts` has no `gm_context` input | P1 | `Scheduled-roadmap` — ROADMAP § §5.6 state surfaces remediation |
| F-P3B4-2 | World reactivity is implemented only as NPC goal-pursuit suggestions: no non-NPC World in Motion entries, no one-hop ripple-effect tracing, no `modify` option (accept/defer/dismiss/auto-apply only), and no max-3-deferral escalation to a `[WARNING]` (REQ-233a1/a2/a3) | `index.ts:14260-14300`, `:3339-3359`; `core/state.ts:771` | P1 | `Scheduled-roadmap` — ROADMAP § §5.6 state surfaces remediation |
| F-P3B4-3 | Relationship gaps: no `badge_briefing` prompt to consider a lore entry when a relationship flips `ally`↔`rival` (REQ-236a), and the marker transition set omits any change involving `neutral` (REQ-236b) | `index.ts:975-982` (set is only ally↔rival, ally↔suspicious, rival↔suspicious); `:7263-7310` emits no prompt | P1 | `Scheduled-roadmap` — ROADMAP § §5.6 state surfaces remediation |
| F-P3B4-4 | Session-boundary markers are not badge-filtered: a Player whose badge wrote the marker sees the raw `args` string, including `session_id` (REQ-237b1) | `index.ts:12450-12463` (renders `e.args` with no marker-specific redaction) | P1 | `Scheduled-roadmap` — ROADMAP § §5.6 state surfaces remediation |
| F-P3B4-5 | Novel notes never appear in `badge_briefing` under the `notes` section token (REQ-242b) | `index.ts:13863-14320` has no notes block; `:10681` only names the token | P1 | `Scheduled-roadmap` — ROADMAP § §5.6 state surfaces remediation |
| F-P3B4-6 | `server-notes.json` and `codex.json` are written with a bare `writeFileSync` — no temp-and-rename atomic write and no backup rotation, unlike the Novel writer (`reStampArtifact`) (REQ-285a, REQ-321k) | `core/state.ts:2654-2666`, `:2680-2692`; atomic+backup writer at `:174-193` | P1 | `Scheduled-roadmap` — ROADMAP § §5.6 state surfaces remediation |
| F-P3B4-7 | `spec_health.codex` is a scalar count, not "count partitioned by kind" (REQ-321l) | `index.ts:12030` (`state.codex.size`) | P1 | `Scheduled-roadmap` — ROADMAP § §5.6 state surfaces remediation |
| F-P3B4-8 | A captured Codex entry does not default its `ruleset` field to the source Novel's ruleset scope (REQ-321g) | `index.ts:13360-13377` (capture entry construction carries no `ruleset`) | P1 | `Scheduled-roadmap` — ROADMAP § §5.6 state surfaces remediation |
| F-P3B4-9 | No `[codex-stale]` computation or flag exists anywhere; `spec_health` never compares an entry's `codex_modified_at` to the artifact's import timestamp (REQ-332b, REQ-332c) | `index.ts:12025-12035`; no `codex-stale` literal in `holonovel/src` | P1 | `Scheduled-roadmap` — ROADMAP § §5.6 state surfaces remediation |
| F-P3B4-10 | Citation repair: REQ-065f cites Automated T52; no harness or root script carries `T52` (T224 is exercised) | `spec/02-requirements.md:2099`; `spec/appendices-reference.md:1508` classifies T52 Automated | P1 | `Scheduled-roadmap` — ROADMAP § §5.6 state surfaces remediation |
| F-P3B4-11 | Citation repair: REQ-236c cites Automated T270; no harness or root script carries `T270` | `spec/02-requirements.md:2156`; Appendix F T270 Automated | P1 | `Scheduled-roadmap` — ROADMAP § §5.6 state surfaces remediation |
| F-P3B4-12 | Citation repair: REQ-233a3 cites Automated T358; no harness or root script carries `T358` | `spec/02-requirements.md:2148`; Appendix F T358 Automated | P1 | `Scheduled-roadmap` — ROADMAP § §5.6 state surfaces remediation |
| F-P3B4-13 | REQ-237b2 cites T275, but the harness asserts only that `spec_health.sessions` is an array — no boundary markers, recap scoping, or per-session metrics | `holonovel/scripts/test-output-contracts.ts:713-724` | P1 | `Scheduled-roadmap` — ROADMAP § §5.6 state surfaces remediation |
| F-P3B4-14 | REQ-242d cites T280, but the harness asserts set/list/remove only — not the default `game_master` scope, Player filtering, `notes://` `[FORBIDDEN]`, or briefing visibility | `holonovel/scripts/test-backfill.ts:248-253` | P1 | `Scheduled-roadmap` — ROADMAP § §5.6 state surfaces remediation |
| F-P3B4-15 | REQ-285c cites T334, but the harness asserts set/list only — not restart persistence, Player `[FORBIDDEN]`, the `server-notes://` resource, or the `spec_health` count | `holonovel/scripts/test-backfill.ts:255-260` | P1 | `Scheduled-roadmap` — ROADMAP § §5.6 state surfaces remediation |

No P0. No source file and no REQ body changed by this chunk.

### Exit evidence (recorded 2026-11-09)

Baseline before review: `check:fast` 37/37 PASS · `check` PASS (0 errors) ·
`npm --prefix holonovel run test:all` 54/54 PASS, tree clean at `3994590`.

### P3b-4 per-REQ verdict table (67 rows)

Resolution method: each REQ's own `*Check:*` IDs; a REQ with no own Check
inherits its family's citation set; an `Automated` citation must appear
literally in a harness and its body must exercise the behaviour; `Manual` /
scenario citations need none; bucket inherited from the base family row (D14).

Result: **36 holds, 11 builder-side, 20 finding rows carrying 15 finding IDs**.

| REQ | § | Bucket | Verdict | Evidence |
|---|---|---|---|---|
| REQ-044 | 5.6 | E | builder-side | build-time ruleset hash (Appendix F T17 is a build acceptance); no runtime predicate |
| REQ-302a | 5.6 | E | builder-side | build-time per-section hashing |
| REQ-302b | 5.6 | E | builder-side | T346 is a build acceptance; no runtime harness |
| REQ-065a | 5.6 | C | holds | fingerprint persisted and reloaded (`core/state.ts:1060-1080`) |
| REQ-065b | 5.6 | C | holds | four drift markers field-by-field (`core/state.ts:1083-1086`); T224 exercised |
| REQ-065c | 5.6 | C | holds | current values take precedence; stored retained for diff (`index.ts:11912-11916`) |
| REQ-065d | 5.6 | C | holds | unknown fields inert; corrupt state → stderr + `corruptData` |
| REQ-065e | 5.6 | C | holds | fresh start is a match; corrupt Novel not loaded |
| REQ-065f | 5.6 | C | finding:F-P3B4-10 | drift warnings implemented; T52 has no harness |
| REQ-313a | 5.6 | E | builder-side | build-time component hashing |
| REQ-313b | 5.6 | E | builder-side | build-time component hashing |
| REQ-313c | 5.6 | E | builder-side | build-time sentinel/exclusion |
| REQ-313d | 5.6 | E | builder-side | build-time sentinel |
| REQ-314a | 5.6 | E | builder-side | build-time scoping |
| REQ-314b | 5.6 | E | builder-side | build-time scoping |
| REQ-314c | 5.6 | E | builder-side | build-time full-build fallback |
| REQ-314d | 5.6 | E | builder-side | build-time fallback rule |
| REQ-232a | 5.6 | C | holds | `gm_context` fields persisted (`index.ts:11013-11028`) |
| REQ-232b | 5.6 | C | finding:F-P3B4-1 | `get_context` omits the `badge_briefing` prompt (`:11032-11041`) |
| REQ-232c | 5.6 | C | finding:F-P3B4-1 | no story-type filter; intro omits the gm_context summary |
| REQ-232d | 5.6 | C | holds | `story_context` and `active_vows` captured into `gm_context` and returned |
| REQ-233b1 | 5.6 | C | holds | faction create/update/remove, resources, briefing, fill warning (T269) |
| REQ-233b2 | 5.6 | C | holds | faction clock mirror advances on transitions (`test-narrative.ts:227-283`) |
| REQ-233b3 | 5.6 | C | holds | faction name accepted in either direction; T269 |
| REQ-233a1 | 5.6 | C | finding:F-P3B4-2 | no non-NPC world changes and no one-hop ripple tracing |
| REQ-233a2 | 5.6 | C | finding:F-P3B4-2 | no `modify`, no deferral cap, NPC-only entries |
| REQ-233a3 | 5.6 | C | finding:F-P3B4-2 | reactivity is NPC-gated; T358 has no harness |
| REQ-236a | 5.6 | C | finding:F-P3B4-3 | no lore-entry prompt on ally↔rival change |
| REQ-236b | 5.6 | C | finding:F-P3B4-3 | marker set omits changes involving `neutral` |
| REQ-236c | 5.6 | C | finding:F-P3B4-11 | set/get/sheet implemented; T270 has no harness |
| REQ-237a | 5.6 | C | holds | `[session-boundary]` marker with session_id/started_at (`core/state.ts:1943-1971`) |
| REQ-237b1 | 5.6 | C | finding:F-P3B4-4 | Player sees `session_id` in the raw marker args |
| REQ-237b2 | 5.6 | C | finding:F-P3B4-13 | T275 asserts only that `sessions` is an array |
| REQ-239a | 5.6 | C | holds | compaction summaries carry every required field incl. source pointers (`core/state.ts:2121-2180`) |
| REQ-239b | 5.6 | C | holds | `audit_archive` + re-anchored chain + `audit://novel/archive` |
| REQ-239c | 5.6 | C | holds | `[NEED_INPUT]` confirmation; active session excluded (T277) |
| REQ-239d | 5.6 | C | holds | Player refusal and retention window exercised (T277) |
| REQ-241a | 5.6 | C | holds | set/list/restore/remove with digest check (T279) |
| REQ-241b | 5.6 | C | holds | capacity eviction, export inclusion, end removal (T279) |
| REQ-241c | 5.6 | C | holds | GM-only; `checkpoint_count` and `checkpoint_bytes` in spec_health |
| REQ-242a | 5.6 | C | holds | scope default, preserve-on-omit, preview and filtering (`index.ts:8021-8070`) |
| REQ-242b | 5.6 | C | finding:F-P3B4-5 | not surfaced in `badge_briefing` |
| REQ-242c | 5.6 | C | holds | notes are the unstructured complement to `gm_context` by design |
| REQ-242d | 5.6 | C | finding:F-P3B4-14 | FORBIDDEN enforced in code; T280 asserts only set/list/remove |
| REQ-285a | 5.6 | C | finding:F-P3B4-6 | plain write, no atomic write or backup rotation |
| REQ-285b | 5.6 | C | holds | `spec_health.server_notes`, `server-notes://`, exclusion from Novel bundles |
| REQ-285c | 5.6 | C | finding:F-P3B4-15 | Player FORBIDDEN enforced; T334 asserts only set/list |
| REQ-321a | 5.6 | C | holds | 14 kinds enumerated and supported (`index.ts:13190`) |
| REQ-321b | 5.6 | C | holds | set/upsert/merge semantics; import by id or array |
| REQ-321c | 5.6 | C | holds | atomic batch precheck then one snapshot (`:13396-13432`); T382 |
| REQ-321d | 5.6 | C | holds | per-kind materialization delegates (`materializeCodexEntry`) |
| REQ-321e | 5.6 | C | holds | adventure import populates world/NPC/faction/lore (T366, T402) |
| REQ-321f | 5.6 | C | holds | `source` values `generated`/`loaded:`/`captured:` + `source_novel` |
| REQ-321g | 5.6 | C | finding:F-P3B4-8 | captured entry does not default `ruleset` |
| REQ-321h | 5.6 | C | holds | `update_source` updates the source entry in place (T383) |
| REQ-321i | 5.6 | C | holds | `[STATE_CONFLICT]` without provenance; filterable list |
| REQ-321j | 5.6 | C | holds | get/delete with undo restore |
| REQ-321k | 5.6 | C | finding:F-P3B4-6 | badge gates hold; persistence is not atomic and has no rotation |
| REQ-321l | 5.6 | C | finding:F-P3B4-7 | codex count is scalar; badge-gated `codex://` holds |
| REQ-321m1 | 5.6 | C | holds | codex-first when no Novel; import/capture `[STATE_CONFLICT]` |
| REQ-321m2 | 5.6 | C | holds | acceptance exercised (T366) |
| REQ-321m3 | 5.6 | C | holds | batch import and adventure import (T366, T382) |
| REQ-321m4 | 5.6 | C | holds | capture and health assertions (T366, T383) |
| REQ-321n | 5.6 | C | holds | capture resolves ids, `[NOT_FOUND]`, provenance rules |
| REQ-332a | 5.6 | C | holds | `codex_source` on import; `manage_novel (action: info)` reports `codex_sources` (T384) |
| REQ-332b | 5.6 | C | finding:F-P3B4-9 | no `[codex-stale]` computation |
| REQ-332c | 5.6 | C | finding:F-P3B4-9 | in-place re-import and `codex_sources` hold; stale flag absent |

**Totals:** 67 rows — 36 holds, 11 builder-side, 20 finding rows carrying
15 finding IDs (all P1, no P0).

## Chunk P4 — persistence and the §5.19 cross-check

**Closed 2026-11-09.** Increment record:
`docs/plans/2026-11-09-full-review-p4/`.

**Code targets:** `core/state.ts` persistence (`saveNovel` `:2479`, backup
rotation `:2422-2455`, checksum `:75-82`, `reStampArtifact` `:174`, roster/notes/
codex `:2558-2691`), load/restore (`readNovelData` `:1304`, `resumeNovel` `:1321`,
hydration `:1458`, `loadNovelFromData` `:1534`, `restoreFromBackups` `:2439`),
lifecycle (`endNovel` `:1697`, `archiveNovel` `:1730`, `unarchiveNovel` `:1751`,
`archivedNovels` `:1770`, snapshot/undo/redo `:1817-1915`), `core/data-dir.ts`,
and the `manage_novel`/`manage_archive` handlers.
**Spec:** §5.19 (8 family rows, 9 REQs: `REQ-400`–`407`, `403a`/`403b`), all
bucket C.
**Already gated:** no §5.19-specific root gate; the assertions live in
`test-persistence`, `test-persistence-guardrails` (`T469`–`T476`), `test-limits`
(`T475` compression), and `test-data-dir` (`T731`).

### Cluster verdicts

| Cluster | Surface | Verdict | Evidence |
|---|---|---|---|
| A | save path and integrity (atomic write, rotation, checksum, compression, flat stores, re-stamp) | **holds**, P3 note F-P4-10 | `saveNovel` temp+fsync+rename (`state.ts:2479-2555`), rotation `:2422-2455`; `T276`, `T475` |
| B | load, restore, corruption | **findings F-P4-4, F-P4-9** | `resumeNovel`/hydration restore chain (`:1321-1532`); `T276`, `T175`, `T475` |
| C | lifecycle file operations (end/trash, archive, checkpoints, undo/redo) | **findings F-P4-1 (fixed), F-P4-2, F-P4-8** | `endNovel` `:1697`, `archiveNovel` `:1730`, snapshots `:1817-1915`; `T158`, `T381`, `T122`, `T712` |
| D | §5.19 cross-check | **findings F-P4-3, F-P4-6, F-P4-7, F-P4-9** | `index.ts` briefing/recap/health; `T469`–`T476` |

**Gate/harness assertion vs REQ text.** T469 asserted the directive and one
example tool while REQ-400 names eight state-tool categories the directive text
omits. T470/T471/T475 assert only a token/count/one branch of their contracts.
T474 asserts scene-transition moments only, so the missing combat-round moment
went unseen. T381 archived the *active* Novel and asserted success — encoding
the REQ-334a violation as the expected result.

### Findings

| ID | Finding | Predicate | Severity | Disposition |
|---|---|---|---|---|
| F-P4-1 | Archiving the process's active Novel succeeded and silently deactivated the badge; REQ-334a requires `[STATE_CONFLICT]`. T381 asserted the wrong behaviour | `index.ts:10885` (pre-fix); `test-persistence.ts:421` | P0 | **Resolved** — handler refuses with corrective action (`index.ts:10883-10892`); T381 asserts the refusal then switches away and archives |
| F-P4-2 | `archiveNovel` silently `unlink`s an existing `archive/<slug>.json`, so archiving a same-slug Novel deletes the archived one; reachable because `createNovel` checks only the in-memory registry, not the archive directory (REQ-334b: never auto-deleted) | `state.ts:1736`, `state.ts:1152` | P1 | `Scheduled-roadmap` — ROADMAP § §5.9/§5.19 persistence remediation |
| F-P4-3 | Combat-round resolution appends no `moment` entry; REQ-405 requires one for every round. `advanceCombat` advances turn/round with no story-journal write, and T474 covers only scene transitions | `state.ts:2313-2326`; `test-persistence-guardrails.ts:158` | P1 | `Scheduled-roadmap` — ROADMAP § §5.9/§5.19 persistence remediation |
| F-P4-4 | When primary and backups are all corrupt, `spec_health.data_health.corrupted` carries a reason string only — no `[corrupted-novel]` marker and no chain paths; stderr likewise names no paths (REQ-092c) | `state.ts:1357`, `:1490`; `index.ts:11972` | P1 | `Scheduled-roadmap` — ROADMAP § §5.9/§5.19 persistence remediation |
| F-P4-5 | `novel_format_version` is never written to the persisted Novel; no v1 `.audit.jsonl` migration, no `[migration-missing-audit]` entry, and no `[format-future]` warning exist (REQ-092e/f/g). Verified by a live probe: a created Novel has only `data_format` and `spec_version` | `state.ts:2479-2555`; only write is the export manifest `index.ts:10658` | P1 | `Scheduled-roadmap` — ROADMAP § §5.9/§5.19 persistence remediation |
| F-P4-6 | `TTRPG_STATE_GATE=warn` appends only a generic sentence; it does not name the uncommitted beats or the state tools that commit them, and recap does not enumerate the beats (REQ-403b) | `index.ts:9753-9756`, `:11765-11767` | P1 | `Scheduled-roadmap` — ROADMAP § §5.9/§5.19 persistence remediation |
| F-P4-7 | The REQ-400 persistence directive names scene/countdown/condition/NPC/story and base capabilities but omits event-log, belief/evidence, identity, causal-state, corpus, agent-task, perception, and subjective-memory tools | `index.ts:14159-14160`; `test-persistence-guardrails.ts:100` | P1 | `Scheduled-roadmap` — ROADMAP § §5.9/§5.19 persistence remediation |
| F-P4-8 | The backup-restore branch of `resumeNovel` returns without `checkWorkflowStaleness`, while the normal branch calls it; a pending workflow restored from backup never ages toward auto-cancel (REQ-224a) | `state.ts:1341-1355` vs `:1366` | P1 | `Scheduled-roadmap` — ROADMAP § §5.9/§5.19 persistence remediation |
| F-P4-9 | Narrow §5.19 assertions: T470 never asserts the ledger timestamp or drift/regression markers (REQ-401); T471 never asserts that recap names the zero-write session (REQ-402); T475 never asserts the timestamp gap or the unparseable-primary branch (REQ-406) | `test-persistence-guardrails.ts:106`, `:235`, `:257` | P1 | `Scheduled-roadmap` — ROADMAP § §5.9/§5.19 persistence remediation |
| F-P4-10 | `reStampArtifact` writes its temp file and renames without `fsync`, unlike `saveNovel`; a crash during migration can lose the re-stamp (durability consistency, no explicit REQ) | `state.ts:189-192` vs `:2549` | P3 | `Closed-P3` — no demonstrated failure; the next `saveNovel` or `holonovel update` re-runs the re-stamp |
| F-P4-11 | `state.loadRoster()` is unguarded at startup and `loadRoster` does `JSON.parse` without a catch, so a corrupt `roster.json` aborts boot; `loadServerNotes`/`loadCodex` catch corruption | `index.ts:131`; `state.ts:2585-2586` | P3 | `Closed-P3` — no normative REQ requires roster corruption tolerance; recorded for a future operational pass |
| F-P4-12 | `saveRoster` writes `roster.json` non-atomically (plain `writeFileSync`), the same class as F-P3B4-6 for notes/codex; no roster-persistence REQ mandates atomicity | `state.ts:2577` | P3 | `Closed-P3` — the scheduled F-P3B4-6 fix covers the atomic-write helper; roster can adopt it then |

### §5.19 per-REQ verdict table (9 rows)

Resolution method: own `*Check:*`, else family set; an `Automated` token must
appear in a harness and its body must exercise the behaviour; bucket from the
base family row (D47).

| REQ | § | Bucket | Verdict | Evidence |
|---|---|---|---|---|
| REQ-400 | 5.19 | C | finding:F-P4-7 | T469 exercised; directive omits eight enumerated tool categories |
| REQ-401 | 5.19 | C | holds | ledger renders timestamp, per-group counts, drift/regression markers (`index.ts:14163-14171`); T470 exercises token+counts (narrow, F-P4-9) |
| REQ-402 | 5.19 | C | holds | marker in `state_health` and recap naming sessions (`index.ts:11982`, `:9750-9752`); T471 (narrow, F-P4-9) |
| REQ-403a | 5.19 | C | holds | drift computed and surfaced in health, recap, ledger (`state.ts` `stateDriftActive`; T472) |
| REQ-403b | 5.19 | C | finding:F-P4-6 | warn/block gate implemented; warn text omits beats and commit tools |
| REQ-404 | 5.19 | C | holds | `[uncommitted-roll]` marker names the commit tool; T473 |
| REQ-405 | 5.19 | C | finding:F-P4-3 | scene-transition moment holds; combat-round moment absent |
| REQ-406 | 5.19 | C | holds | `[state-regression]` with audit gap and backup index; T475 (narrow, F-P4-9) |
| REQ-407 | 5.19 | C | holds | full persist-tool list rendered for GM; T476 |

**Totals:** 9 rows — 6 holds, 3 finding rows (F-P4-3, F-P4-6, F-P4-7);
F-P4-9 records narrow assertions on three holding REQs.

### Persistence code-surface table (14 behaviours)

| Behaviour | Anchor | Harness | Verdict |
|---|---|---|---|
| Atomic save (temp → fsync → rename) | `state.ts:2479-2555` | `T156`, `T276` | holds |
| Backup rotation and pruning | `state.ts:2422-2455`, `:2528-2546` | `T276` | holds |
| Checksum stamp and verification | `state.ts:75-82`, `:2519` | `T276`, `T475` | holds |
| Compression and mismatch warning | `state.ts:1297-1319`, `:2544` | `T475` | holds |
| Restore from rotated/legacy backup | `state.ts:2434-2449`, `:1340-1358` | `T276`, `T475` | finding:F-P4-9 |
| Roster / server-notes / codex writes | `state.ts:2558-2691` | `T366`, `T383`, `T402` | F-P3B4-6 already scheduled; roster P3 F-P4-12 |
| Migration / re-stamp | `state.ts:174-218` | `T773`, `T774` | holds (P3 F-P4-10) |
| Startup hydration scan | `state.ts:1458-1532` | `T159`, `T175` | holds |
| End / trash move and retention | `state.ts:1697-1726`, `:1781-1794` | `T158`, `T122` | holds (audit gap F-P3-5 already scheduled) |
| Archive / unarchive | `state.ts:1730-1779`; `index.ts:10883-10896` | `T381` | F-P4-1 fixed; F-P4-2 scheduled |
| Checkpoint / snapshot / undo / redo | `state.ts:1817-1915` | `T10`, `T279` | holds |
| Export/import reassembly | `index.ts` `manage_archive`; `state.ts` `exportNovelJSON`/`importNovelJSON` | `T100`, `T240`, `T693` | holds |
| Data-directory resolution | `data-dir.ts:46-78` | `T731` | holds |
| Slug-to-path safety | `data-dir.ts:80-97`; `index.ts:11487` | `T731`, import refusal | holds |
| Persistence guardrails (§5.19) | `index.ts:14157-14179`, `:11979-11989`, `:9749-9762` | `T469`–`T476` | findings F-P4-3/6/7; F-P4-9 |

### Exit evidence (recorded 2026-11-09)

`check:fast` 37/37 PASS · `check` PASS (0 errors) · server suite `test:all`
54/54 PASS (baseline), `test:persistence` 41/41 after the F-P4-1 fix ·
`check-roadmap` PASS · `check-registers` PASS · `check-loop-artifacts` PASS ·
`build-order` clean.

## Chunk P5 — engine loop, event stream, durable agent tasks

**Closed 2026-11-09.** Increment record:
`docs/plans/2026-11-09-full-review-p5/`.

**Code targets:** `core/event-log.ts` (ordinals, append, supersede, slice,
`describeEntry`, `evictToCap`), `core/event-hub.ts`, `core/agent.ts`,
`core/state-hash.ts` (exclusion list and version), `index.ts` `recordEvent`
(`:2422`), `manage_diagnostics` (`event`/`history`/`compact`/`subscribe`/
`verify`/`replay`, `:9345`/`:9562`/`:9628`/`:9912`/`:9936`), `manage_agent`
(`:9045-9107`), `manage_staging` (`:6328-6381`), branch creation
(`:11007-11008`), and the briefing orientation/handoff blocks
(`:13884`, `:13939`). `state.ts` persists the log, lineage, and tasks
(`:2817-2819`, `:2827`).
**Spec:** §5.20 (3 family rows, 4 REQs: `REQ-412`, `412a`, `611`, `612`),
§5.24 (11 REQs: `REQ-455`–`460`, `REQ-601`–`605`), §5.31 (9 REQs:
`REQ-522`–`530`) — 24 REQs / 23 family rows, all bucket C.

### Cluster verdicts

| Cluster | Surface | Verdict | Evidence |
|---|---|---|---|
| A | turn conventions and the loop | **finding F-P5-6**; narrow F-P5-7 | orientation `index.ts:13884`, handoff `:13939`; `T482`, `T640` |
| B | temporal event log and hub | **findings F-P5-1, F-P5-3 (fixed)**; F-P5-7 | `event-log.ts:36-107`, `event-hub.ts:15-61`, `index.ts:2422-2434`, `:9562`, `:11007`; `T545`–`T550` |
| C | determinism integration and replay | **finding F-P5-2 (fixed)**; F-P5-7 | `state-hash.ts:13-27`, `index.ts:9405-9490`, `:9541`, `:9912-9941`; `T712`–`T716`, `T547` |
| D | durable agent tasks | **finding F-P5-4 (fixed)** | `agent.ts:30-74`, `index.ts:9045-9107`; `T605`–`T613` |

**Engine-contract cross-check.** §2 state authority → A, **holds** (`audit()`
`index.ts:2409-2417`; tools are the mutation surface). §3 turn semantics → A,
**holds** (`take_turn` read-only; `test:engine-facade`). §4 determinism/replay →
C, **holds** after F-P5-2 (`T712`–`T716`). §5 event stream → B, **holds** after
F-P5-1/F-P5-3 (`T545`–`T550`). §6 save format → B for the event/agent path,
**holds** (`state.ts:2817-2827`; `T548`, `T549`, `T605`); a §5.19-owned save
defect remains P4's. **Aggregate: holds.**

### Findings

| ID | Finding | Predicate | Severity | Disposition |
|---|---|---|---|---|
| F-P5-1 | `sliceThrough` spread each entry shallowly, sharing its `alternatives` array with the source; a branch supersede then pushed into the parent's (and siblings') array, so the parent's persisted log changed (REQ-458/459). A live import probe produced parent `alternatives: [2,2]` | `event-log.ts:75-78` (pre-fix); probe via `sliceThrough` | P0 | **Resolved** — `sliceThrough` clones `alternatives` (`event-log.ts:75-86`); `T548` unit assertion |
| F-P5-2 | The `supersede` path recorded `state_hash` but not `state_hash_projection`, so verify counted a freshly written entry as historical (REQ-602: hash "together with the projection version in force") | `index.ts:9541` (pre-fix) vs `:2434` | P0 | **Resolved** — projection set on the replacement (`index.ts:9541-9543`); `T547` asserts `historical event hashes: 0` |
| F-P5-3 | `history` with `ordinals` returned the entries in request order, not ordinal order (REQ-456), and the branch was untested | `index.ts:9562` (pre-fix); `T546` | P0 | **Resolved** — results sorted by ordinal (`index.ts:9562-9563`); `T546` asserts `[3,1]` → `#1` before `#3` |
| F-P5-4 | `manage_agent` list/get called `requireNotObserver`, refusing the Observer read that REQ-530 requires ("the Observer SHALL read without mutating") | `index.ts:9046`, `:9056` (pre-fix); `T613` | P0 | **Resolved** — reads gate on no badge; Observer list/get asserted in `T613` |
| F-P5-5 | REQ-612's `list` strategy has no GM-order source: `cast.order` is persisted but never read, and `manage_staging (action: cast)` exposes no `order` parameter, so `list` follows NPC insertion order | `index.ts:6360`; `state.ts:724`, `:1186` | P1 | `Scheduled-roadmap` — ROADMAP § §5.20/§5.24 assertion and staging remediation |
| F-P5-6 | The turn-handoff directive branches on the badge, not the AI narrative role; `TTRPG_AI_ROLE` affects the orientation block (`index.ts:13951-13955`) but not the handoff, so an AI-role override renders the wrong variant (REQ-412) | `index.ts:13939-13945`; `T482` asserts GM badge only | P1 | `Scheduled-roadmap` — ROADMAP § §5.20/§5.24 assertion and staging remediation |
| F-P5-7 | Narrow assertions: `T545` never reproduces ordinals across a restart (REQ-455); `T550` never asserts a derived record's cited ordinal (REQ-460); `T640` asserts the token once, not per AI role or at a minimal budget (REQ-412a); `T712` never tests session-identity exclusion (REQ-601); `T713` never tests the unhashed/older-projection branches (REQ-602); `T727` never asserts manual-selection clearing on a scene transition (REQ-611) | `test-event-log.ts:32-43`, `:113-123`, `:127-132`; `test-lean-narrator.ts:115-119`; `test-competitive-gaps.ts:591-602` | P1 | `Scheduled-roadmap` — ROADMAP § §5.20/§5.24 assertion and staging remediation |
| F-P5-8 | `entriesByOrdinals` is exported but never called; the ordinal-range surface is served by `traverse` (REQ-591). Dead code, no behavioural drift | `event-log.ts:94-98`; no call site in `src/` or `scripts/` | P3 | `Closed-P3` — no demonstrated failure; remove or adopt in a future cleanup |

### Per-REQ verdict table (24 rows)

Resolution method: own `*Check:*`, else family set; an `Automated` token must
appear in a harness and its body must exercise the behaviour; bucket from the
base family row (D55).

| REQ | § | Bucket | Verdict | Evidence |
|---|---|---|---|---|
| REQ-412 | 5.20 | C | finding:F-P5-6 | directive rendered, but keyed on badge not AI role; `T482` |
| REQ-412a | 5.20 | C | holds | orientation token `index.ts:13884-13885`; `T640` (narrow, F-P5-7) |
| REQ-611 | 5.20 | C | holds | default natural, mute/force, scene-transition clear (`index.ts:6267-6275`, `:6328-6343`); `T727` adds pooled rotation and Player refusal |
| REQ-612 | 5.20 | C | finding:F-P5-5 | natural/pooled/manual/force hold; `list` has no GM-order source; `T728` |
| REQ-455 | 5.24 | C | holds | monotonic ordinal, cap eviction, persistence (`event-log.ts:36-52`, `:101-107`); `T545` (replay narrow, F-P5-7) |
| REQ-456 | 5.24 | C | holds | verbatim text/provenance; `history` ordinals now ordinal-ordered and evicted-marked (`index.ts:9557-9568`); `T546` |
| REQ-457 | 5.24 | C | holds | replacement appended, prior retained/superseded (`event-log.ts:56-72`); `T547` |
| REQ-458 | 5.24 | C | holds | branch shares through the point, parent untouched after the alternatives clone (`event-log.ts:75-86`, `index.ts:11007`); `T548` |
| REQ-459 | 5.24 | C | holds | lineage recorded; sibling isolation (`index.ts:11008`); `T549` |
| REQ-460 | 5.24 | C | holds | ordinal range returns contributing entries (`index.ts:9562`); `T550` (derived-citation narrow, F-P5-7) |
| REQ-601 | 5.24 | C | holds | exclusion list and version (`state-hash.ts:13-27`); `T712` (session-identity narrow, F-P5-7) |
| REQ-602 | 5.24 | C | holds | digest after perception derivation plus projection, append and supersede (`index.ts:2427-2434`, `:9541-9543`); `T713`, `T547` |
| REQ-603 | 5.24 | C | holds | live vs save digest and checkpoint digests, stale reporting (`index.ts:9405-9455`); `T714` |
| REQ-604 | 5.24 | C | holds | retained range, recorded hash, nearest checkpoint, `[evicted]` (`index.ts:9462-9490`); `T715` |
| REQ-605 | 5.24 | C | holds | GM-only, read-only, identical repeats (`index.ts:9912-9941`); `T716` |
| REQ-522 | 5.31 | C | holds | create requires subject/goal, queued, no actions (`index.ts:9061-9076`); `T605` |
| REQ-523 | 5.31 | C | holds | queued→active→done/failed/cancelled (`agent.ts:30-52`); `T606` |
| REQ-524 | 5.31 | C | holds | illegal transition refused (`index.ts:9086-9089`); `T607` |
| REQ-525 | 5.31 | C | holds | append-only action with sequence/time (`agent.ts:55-60`); `T608` |
| REQ-526 | 5.31 | C | holds | autonomy enum, config default, per-task override (`index.ts:9065-9066`); `T609` |
| REQ-527 | 5.31 | C | holds | subject required and filter exact (`index.ts:9049`, `:9064`); `T610` |
| REQ-528 | 5.31 | C | holds | terminal tasks refuse advance (`index.ts:9100-9101`); `T611` |
| REQ-529 | 5.31 | C | holds | `source_goal` recorded (`index.ts:9069`); `T612` |
| REQ-530 | 5.31 | C | holds | mutation GM-only; reads every badge incl. Observer (`index.ts:9045-9077`); `T613` |

**Totals:** 24 rows — 22 holds, 2 findings (`F-P5-5`, `F-P5-6`); `F-P5-7`
records narrow assertions on six holding REQs.

### Behaviour table (31 behaviours)

| Behaviour | Anchor | Harness | Verdict |
|---|---|---|---|
| Ordinal assignment | `event-log.ts:36-39` | `T545` | holds |
| Append | `event-log.ts:42-52` | `T545` | holds |
| Supersede and retain | `event-log.ts:56-72` | `T547` | holds |
| Cap eviction | `event-log.ts:101-107`; `index.ts:2429` | `T546`, `T715` | holds |
| Non-semantic preservation | `event-log.ts:88-91` | `T546` | holds |
| Event-log save/load round-trip | `state.ts:2817-2819` | `T548`, `T549` | holds |
| Branch creation | `index.ts:11007-11008` | `T548` | holds |
| Branch lineage and sibling isolation | `event-log.ts:75-86`; `index.ts:11008` | `T549`, `T548` unit | holds (fixed F-P5-1) |
| Provenance slicing and ordinals order | `event-log.ts:75-86`; `index.ts:9562-9568` | `T550`, `T546` | holds (fixed F-P5-3) |
| Evicted-ordinal reporting | `index.ts:9562`; `memory.ts:178-183` | `T546`, `T715` | holds |
| Event-hub subscribe/dispatch | `event-hub.ts:15-61` | `test:engine-facade:223` | holds |
| Audit-log compaction | `index.ts:9628-9646` | `none (no row-set ID)` | holds (GM-gated; REQ-239 out of set) |
| State-hash exclusion and version | `state-hash.ts:13-27` | `T712` | holds |
| Per-event digest ordering | `index.ts:2427-2434` | `T713` | holds |
| Supersede digest + version | `index.ts:9541-9543` | `T547` | holds (fixed F-P5-2) |
| Verify divergence and stale | `index.ts:9405-9455`, `:9912-9934` | `T714`, `T716` | holds |
| Replay inspection | `index.ts:9462-9490`, `:9936-9941` | `T715` | holds |
| Verification read-only/gated | `index.ts:9912-9941` | `T716` | holds |
| Turn-handoff directive | `index.ts:13939-13945` | `T482` | finding:F-P5-6 |
| Orientation token | `index.ts:13884-13885` | `T640` | holds (narrow F-P5-7) |
| Cast strategy and mute/force | `index.ts:6328-6343` | `T727` | holds |
| Speaker selection (`list` gap) | `index.ts:6344-6381` | `T728` | finding:F-P5-5 |
| Manual-selection clear | `index.ts:6267-6275` | `T727` (spoken only) | narrow F-P5-7 |
| Agent create (queued) | `index.ts:9061-9076` | `T605` | holds |
| Agent transition legality | `agent.ts:30-52`; `index.ts:9086-9089` | `T606`, `T607` | holds |
| Agent action log | `agent.ts:55-60`; `index.ts:9094-9107` | `T608` | holds |
| Agent autonomy | `index.ts:9065-9066` | `T609` | holds |
| Agent subject filter | `index.ts:9049` | `T610` | holds |
| Agent goal provenance | `index.ts:9069` | `T612` | holds |
| Agent terminal immutability | `agent.ts:38-40`, `:71-74`; `index.ts:9100-9101` | `T611` | holds |
| Agent badge gating | `index.ts:9045-9077` | `T613` | holds (fixed F-P5-4) |

### Exit evidence (recorded 2026-11-09)

C0 `527e5da` restored the baseline (two Holosuite anchors: `13824→13829`,
`11383→11388`). C1 repointed twelve more anchors for shifted handler lines
(conformance, invariants, novel, adversarial). `test:event-log` 12/12 PASS ·
`test:agent` 9/9 PASS · `test:holosuite-conformance` 45/45 ·
`test:holosuite-invariants` 25/25 · `test:holosuite-novel` 100/100 ·
`test:holosuite-adversarial` 26/26 · root and server `typecheck` exit 0 ·
`check` PASS · `test:all` PASS · `check-roadmap` PASS ·
`check-registers --strict` PASS · `check-loop-artifacts` PASS.

## Chunk P6a — world model and the adapter seam

**Code targets:** `holonovel/src/world/model.ts` (1068 lines), `world/parser.ts`
(931), `world/index.ts` (24), the `manage_world` / `run_command` handlers and
world resources in `holonovel/src/index.ts`, and the generated
`world://kinds` provider document.
**Spec:** §5.10 (82 REQs), §5.11 (6), §5.13 (13), §5.15 (6) — 107 REQs /
36 family rows.
**Decisions:** D61–D70 (chunk split, boundaries, buckets, citations,
fingerprints, row granularity, publication).
**Exit evidence (recorded 2026-11-09):** `check:fast` 37/37 PASS, `check` PASS,
`test:all` 55/55 PASS (new `test:world-remediation` included),
`check-roadmap` PASS, `check-registers:strict` PASS, `check-loop-artifacts`
PASS. Six P0 findings fixed in-session with a new harness; the remaining
findings are scheduled or closed as recorded below. Source files changed:
`world/model.ts`, `world/parser.ts`, `index.ts`,
`scripts/test-world-remediation.ts`, `scripts/lib/holosuite-adversarial.ts`
(evidence-anchor repoint), `package.json`, `scripts/run-test-suite.ts`.

### P6a per-REQ verdict table

One row per REQ: `holds` (contract present and exercised), `finding:<ID>`
(see the register), or `builder-side` (bucket E — no server runtime satisfies
it; §5.13/§5.15 are derivation/verification contracts). Bucket is inherited
from the base family row in `spec/audit/req-coverage.md` (D64).

| REQ | Bucket | Verdict | Evidence |
|---|---|---|---|
| REQ-195a | C | holds | § P6a findings / behaviour table |
| REQ-195b | C | holds | § P6a findings / behaviour table |
| REQ-196a | C | finding:F-P6a-6 (Resolved) | § P6a findings / behaviour table |
| REQ-196b | C | finding:F-P6a-7 (P1) | § P6a findings / behaviour table |
| REQ-196c | C | finding:F-P6a-7 (P1) | § P6a findings / behaviour table |
| REQ-196d | C | finding:F-P6a-7 (P1) | § P6a findings / behaviour table |
| REQ-196e | C | finding:F-P6a-7 (P1) | § P6a findings / behaviour table |
| REQ-196f | C | finding:F-P6a-15 (P3, Closed-P3) | § P6a findings / behaviour table |
| REQ-283a | C | finding:F-P6a-7 (P1) | § P6a findings / behaviour table |
| REQ-283b | C | finding:F-P6a-7 (P1) | § P6a findings / behaviour table |
| REQ-283c | C | holds | § P6a findings / behaviour table |
| REQ-284a | C | finding:F-P6a-8 (P1) | § P6a findings / behaviour table |
| REQ-284b | C | finding:F-P6a-8 (P1) | § P6a findings / behaviour table |
| REQ-284c | C | finding:F-P6a-8 (P1) | § P6a findings / behaviour table |
| REQ-284d | C | finding:F-P6a-8 (P1) | § P6a findings / behaviour table |
| REQ-284e | C | finding:F-P6a-8 (P1) | § P6a findings / behaviour table |
| REQ-284f | C | holds | § P6a findings / behaviour table |
| REQ-316a | C | holds | § P6a findings / behaviour table |
| REQ-316b | C | holds | § P6a findings / behaviour table |
| REQ-317a | C | finding:F-P6a-10 (P1) | § P6a findings / behaviour table |
| REQ-317b | C | finding:F-P6a-10 (P1) | § P6a findings / behaviour table |
| REQ-317c | C | finding:F-P6a-10 (P1) | § P6a findings / behaviour table |
| REQ-317d | C | finding:F-P6a-10 (P1) | § P6a findings / behaviour table |
| REQ-318a | C | finding:F-P6a-7 (P1) | § P6a findings / behaviour table |
| REQ-318b | C | holds | § P6a findings / behaviour table |
| REQ-319a | C | holds | § P6a findings / behaviour table |
| REQ-319b | C | holds | § P6a findings / behaviour table |
| REQ-319c | C | finding:F-P6a-16 (P3, Closed-P3) | § P6a findings / behaviour table |
| REQ-319d | C | finding:F-P6a-16 (P3, Closed-P3) | § P6a findings / behaviour table |
| REQ-320a | C | finding:F-P6a-11 (P1) | § P6a findings / behaviour table |
| REQ-320b | C | finding:F-P6a-11 (P1) + F-P6a-17 (P3) | § P6a findings / behaviour table |
| REQ-320c | C | finding:F-P6a-11 (P1) + F-P6a-17 (P3) | § P6a findings / behaviour table |
| REQ-197a | C | finding:F-P6a-7 (P1) | § P6a findings / behaviour table |
| REQ-197b | C | finding:F-P6a-2 (Resolved) | § P6a findings / behaviour table |
| REQ-197c | C | finding:F-P6a-9 (P1) | § P6a findings / behaviour table |
| REQ-197d | C | finding:F-P6a-9 (P1) | § P6a findings / behaviour table |
| REQ-198 | C | finding:F-P6a-1 (Resolved) + F-P6a-14 (P1) | § P6a findings / behaviour table |
| REQ-199 | C | finding:F-P6a-3 (Resolved) + F-P6a-14 (P1) | § P6a findings / behaviour table |
| REQ-200 | C | finding:F-P6a-1/F-P6a-3 (Resolved) + F-P6a-14 (P1) | § P6a findings / behaviour table |
| REQ-201 | C | holds | § P6a findings / behaviour table |
| REQ-431a | C | holds | § P6a findings / behaviour table |
| REQ-431b | C | holds | § P6a findings / behaviour table |
| REQ-431c | C | holds | § P6a findings / behaviour table |
| REQ-431d | C | finding:F-P6a-18 (P2) | § P6a findings / behaviour table |
| REQ-202a | C | finding:F-P6a-12 (P1) | § P6a findings / behaviour table |
| REQ-202b | C | finding:F-P6a-12 (P1) | § P6a findings / behaviour table |
| REQ-222a | C | holds | § P6a findings / behaviour table |
| REQ-222b | C | finding:F-P6a-12 (P1) | § P6a findings / behaviour table |
| REQ-222c | C | holds | § P6a findings / behaviour table |
| REQ-309a | C | holds | § P6a findings / behaviour table |
| REQ-309b | C | finding:F-P6a-6 (Resolved) + F-P6a-12 (P1) | § P6a findings / behaviour table |
| REQ-309c | C | holds | § P6a findings / behaviour table |
| REQ-309d | C | holds | § P6a findings / behaviour table |
| REQ-309e | C | holds | § P6a findings / behaviour table |
| REQ-309f | C | holds | § P6a findings / behaviour table |
| REQ-309g | C | finding:F-P6a-13 (P1) | § P6a findings / behaviour table |
| REQ-309h | C | holds | § P6a findings / behaviour table |
| REQ-325a | C | finding:F-P6a-12 (P1) | § P6a findings / behaviour table |
| REQ-325b | C | holds | § P6a findings / behaviour table |
| REQ-325c | C | holds | § P6a findings / behaviour table |
| REQ-326a | C | finding:F-P6a-5 (Resolved) | § P6a findings / behaviour table |
| REQ-326b | C | finding:F-P6a-5 (Resolved) | § P6a findings / behaviour table |
| REQ-326c | C | holds | § P6a findings / behaviour table |
| REQ-326d | C | holds | § P6a findings / behaviour table |
| REQ-327a | C | finding:F-P6a-4 (Resolved) | § P6a findings / behaviour table |
| REQ-327b | C | holds | § P6a findings / behaviour table |
| REQ-327c | C | holds | § P6a findings / behaviour table |
| REQ-367a | C | holds | § P6a findings / behaviour table |
| REQ-367b1 | C | holds | § P6a findings / behaviour table |
| REQ-367b2 | C | holds | § P6a findings / behaviour table |
| REQ-367c | C | holds | § P6a findings / behaviour table |
| REQ-368a | C | holds | § P6a findings / behaviour table |
| REQ-368b | C | holds | § P6a findings / behaviour table |
| REQ-368c | C | holds | § P6a findings / behaviour table |
| REQ-368d | C | holds | § P6a findings / behaviour table |
| REQ-368e | C | holds | § P6a findings / behaviour table |
| REQ-596 | C | holds | § P6a findings / behaviour table |
| REQ-597 | C | holds | § P6a findings / behaviour table |
| REQ-622 | C | holds | § P6a findings / behaviour table |
| REQ-622a | C | holds | § P6a findings / behaviour table |
| REQ-622b | C | holds | § P6a findings / behaviour table |
| REQ-622c | C | finding:F-P6a-18 (P2) | § P6a findings / behaviour table |
| REQ-218a | C | holds | § P6a findings / behaviour table |
| REQ-218b | C | holds | § P6a findings / behaviour table |
| REQ-218c | C | holds | § P6a findings / behaviour table |
| REQ-219a1 | C | holds | § P6a findings / behaviour table |
| REQ-219a2 | C | holds | § P6a findings / behaviour table |
| REQ-219b | C | holds | § P6a findings / behaviour table |
| REQ-369a | E | builder-side | § P6a findings / behaviour table |
| REQ-369b | E | builder-side | § P6a findings / behaviour table |
| REQ-370a | E | builder-side | § P6a findings / behaviour table |
| REQ-370b | E | builder-side | § P6a findings / behaviour table |
| REQ-371a | E | builder-side | § P6a findings / behaviour table |
| REQ-371b | E | builder-side | § P6a findings / behaviour table |
| REQ-374a | E | builder-side | § P6a findings / behaviour table |
| REQ-374b | E | builder-side | § P6a findings / behaviour table |
| REQ-375a | E | builder-side | § P6a findings / behaviour table |
| REQ-375b | E | builder-side | § P6a findings / behaviour table |
| REQ-376a1 | E | builder-side | § P6a findings / behaviour table |
| REQ-376a2 | E | builder-side | § P6a findings / behaviour table |
| REQ-376a3 | E | builder-side | § P6a findings / behaviour table |
| REQ-377a | E | builder-side | § P6a findings / behaviour table |
| REQ-377b | E | builder-side | § P6a findings / behaviour table |
| REQ-377c | E | builder-side | § P6a findings / behaviour table |
| REQ-377d | E | builder-side | § P6a findings / behaviour table |
| REQ-378a | E | builder-side | § P6a findings / behaviour table |
| REQ-378b | E | builder-side | § P6a findings / behaviour table |

### P6a behaviour table

| Behaviour | Anchor | Harness | Verdict |
|---|---|---|---|
| Kind catalog and property contracts | `world/model.ts:5-133` | `test:world-provider`, `check-world-provider` | holds |
| `world://map` adjacency payload | `world/model.ts:976-986`; `index.ts:12542` | `test:world-provider` | holds |
| `world://kinds` payload (tiers, parser catalog, availability) | `world/model.ts:988-1017`; `index.ts:12548` | `test:world-provider` | finding:F-P6a-12 (P1) |
| `manage_world` action set and lifecycle | `index.ts:5114-5600` | `test:world-remediation` | finding:F-P6a-1/F-P6a-14 (P0 fixed / P1) |
| `run_command execute` dispatch and envelopes | `index.ts:4468-4700`; `world/parser.ts:30-120` | `test:world-remediation`, `test:hazard` | finding:F-P6a-7 (P1) |
| Visibility and audibility queries | `world/parser.ts:803-880`; `index.ts:4481-4506` | `test:output-contracts` | holds |
| Verb tiers and help rendering | `world/model.ts:1032-1068`; `index.ts:4588-4921` | `test:output-contracts` | finding:F-P6a-7 (P1) |
| Room description modes | `world/parser.ts:247-285`; `index.ts:4588-4590` | `test:world-remediation` | finding:F-P6a-2 (Resolved) |
| Movement and door blocking | `world/parser.ts:320-370`; `index.ts:4660-4700` | `test:backfill`, `test:hazard` | holds |
| Source conversion and annotation linking | `world/model.ts:537-968` | `test:world-remediation` | finding:F-P6a-3 (Resolved) |
| Containment perception and reachability | `world/parser.ts:261-300`, `:379-410` | `test:world-remediation` | finding:F-P6a-7 (P1) |
| Scene and NPC room coupling | `index.ts:6238-6260`, `:6490-6520`, `:12304-12316` | `test:world-remediation` (scene/NPC not asserted) | finding:F-P6a-4/F-P6a-5 (Resolved) |
| Procedural generation | `index.ts:5334-5600` | `test:adventure` | finding:F-P6a-18 (P2) |
| Ruleset-free creation surface | `index.ts:3846`, `:5690` | `test:character-creation` | holds |
| Hazard annotations and survival resources | `world/model.ts:156-184`; `index.ts:4242-4384` | `test:hazard` | finding:F-P6a-18 (P2) |
| Vehicle traversal and moments | `index.ts:4660-4695` | `test:output-contracts` | finding:F-P6a-10 (P1) |

### P6a cluster verdicts

Cluster verdicts are worst-of their own REQ rows (`finding` > `deferred` >
`builder-side` > `holds`); a resolved finding counts as `holds` for the
aggregate.

| Cluster | REQs | Verdict | Evidence |
|---|---|---|---|
| A model, kinds, resources | REQ-195–202, 283/284, 316–320, 431, 596/597, 622 | finding:F-P6a-7 (P1) | two P0s resolved (F-P6a-1, -3); the parser/output gap remains |
| B parser, verbs, movement | REQ-222, 325–327 | finding:F-P6a-7 (P1) | 325a resource gap (F-P6a-12); 326/327 resolved |
| C conversion, containment, coupling | REQ-367/368, §5.13, §5.15 | builder-side | 367/368 hold; §5.13/§5.15 are derivation contracts (bucket E) |
| D handler surface and ruleset-free mode | REQ-309, §5.11 | finding:F-P6a-13 (P1) | 309b badge leak resolved; 309g suggest mapping open |

### P6a findings

| ID | Severity | REQs | Predicate | Disposition |
|---|---|---|---|---|
| F-P6a-1 | P0 | REQ-198, REQ-200 | `index.ts:5254` wrote `thing.fixed` (no such field) instead of `portable` | Resolved |
| F-P6a-2 | P0 | REQ-197b | `index.ts:4588-4590` set `roomDescriptionMode`; no render path read it | Resolved |
| F-P6a-3 | P0 | REQ-199, REQ-200, REQ-431d | `world/model.ts:683` marked `It is in <container>.` as `room` | Resolved |
| F-P6a-4 | P0 | REQ-327a | `index.ts:6509` updated `location` without re-registering `room_id` | Resolved |
| F-P6a-5 | P0 | REQ-326a, REQ-326b | `index.ts:12304` omitted `room_id`; `:6241` matched by prefix only | Resolved |
| F-P6a-6 | P0 | REQ-196a, REQ-309b | `index.ts:4591` answered help/verbs before the badge gate | Resolved |
| F-P6a-7 | P1 | REQ-196b–e, 197a, 283a/b, 318a | `world/parser.ts:111-117` returns `[NOT_FOUND]` without the UNIMPLEMENTED/nearest-verb contract; help lacks category/description and aliases; ambiguous prompt unnumbered; exits appended to the room body | Scheduled-roadmap |
| F-P6a-8 | P1 | REQ-284a–e | `world/parser.ts:469` emits `[WARNING]` + `Corrective action: Hint:`; readable-in-container and adjacent-room hints unimplemented | Scheduled-roadmap |
| F-P6a-9 | P1 | REQ-197c, REQ-197d | `index.ts:3873` signal enum lacks `detail`; no Player-Detail line | Scheduled-roadmap |
| F-P6a-10 | P1 | REQ-317a–d | `index.ts:4677-4695` moves only the active entity, ignores door state, and omits the interior description in the entry moment | Scheduled-roadmap |
| F-P6a-11 | P1 | REQ-320a–c | `world/model.ts:243-270` has no `narrative` category; `index.ts:4990-5003` matches NPCs outside the room | Scheduled-roadmap |
| F-P6a-12 | P1 | REQ-202a/b, 222b, 325a, 309b | `index.ts:12542-12550` serves unfiltered resources; `room://`/`thing://` payloads incomplete; `world://kinds` has no `parser_commands`; Player override filter compares mechanic names to entity names | Scheduled-roadmap |
| F-P6a-13 | P1 | REQ-309g | `index.ts:4526-4528` returns prose for Player spatial suggest, never `run_command (action: resolve)` | Scheduled-roadmap |
| F-P6a-14 | P1 | REQ-198, REQ-199 | `index.ts:5289` creates an exit without binding a door; `:5177-5182` `update_room` is unaudited; `remove_room` orphans nested contents | Scheduled-roadmap |
| F-P6a-15 | P3 | REQ-196f | `index.ts:4627` names the retired `convert_source` tool | Closed-P3 |
| F-P6a-16 | P3 | REQ-319c, REQ-319d | `climb` hardcodes the `up` exit; `all` is not handled as a pronoun | Closed-P3 |
| F-P6a-17 | P3 | REQ-320b, REQ-320c | `give`/`show` fall back outside the room; `throw` deposits in the current room; no-NPC `give` records `[OK]` | Closed-P3 |
| F-P6a-18 | P3 | REQ-431d, REQ-622c | generated door-role objects carry no exit/doorRefs; `annotations.bundle_of` has no producer | Closed-P3 |
## Chunk P6b — ruleset packages and host entry points

**Code targets:** `holonovel/src/rulesets.ts` (684 lines), the
`manage_ruleset` / `spec_health` / listing handlers and the capability branches
in `holonovel/src/index.ts`, `core/surface-{projection,aliases}.ts`,
`core/state.ts` (`reconcileUserData`, `applyNovelState`), the host entry points
`scripts/{build-ruleset,update,update-rulesets,migrate-user-data,update-server}.ts`,
`scripts/lib/ruleset-registry.ts`, `holonovel/server.json`, and
the package staging/smoke scripts.
**Spec:** §5.16 (23 REQs), §5.17 (15), §5.18 (25), §5.21–§5.23 (10) — 73 REQs /
50 family rows.
**Decisions:** D71–D80 (chunk scope, fix policy, buckets, boundaries,
citations, fingerprints, row granularity, publication).
**Exit evidence (recorded 2026-11-09):** `check:fast` 37/37 PASS, `check` PASS,
`test:all` PASS (new `test:ruleset-surface-remediation` included),
`check-roadmap` PASS, `check-registers:strict` PASS, `check-loop-artifacts`
PASS. Six P0 findings fixed in-session with a new harness; the remaining
findings are scheduled or closed as recorded below.

### P6b per-REQ verdict table

One row per REQ. Bucket is inherited from the base family row in
`spec/audit/req-coverage.md` (D74). `Resolved` findings were fixed in-session;
`P1` rows are scheduled on `ROADMAP.md`; `P3` rows are recorded and closed.

| REQ | Bucket | Verdict | Evidence |
|---|---|---|---|
| REQ-379a | E | holds | § P6b behaviour table / findings |
| REQ-379b | E | finding:F-P6b-9 (P1) | § P6b behaviour table / findings |
| REQ-379c | E | finding:F-P6b-9 (P1) | § P6b behaviour table / findings |
| REQ-380a | C | finding:F-P6b-4 (Resolved) | § P6b behaviour table / findings |
| REQ-380b | C | holds | § P6b behaviour table / findings |
| REQ-380c | C | finding:F-P6b-1 (Resolved) + F-P6b-10 (P1) | § P6b behaviour table / findings |
| REQ-381a | E | finding:F-P6b-1 (Resolved) | § P6b behaviour table / findings |
| REQ-381b | E | finding:F-P6b-9 (P1) | § P6b behaviour table / findings |
| REQ-381c | E | finding:F-P6b-9 (P1) | § P6b behaviour table / findings |
| REQ-382a | E | holds | § P6b behaviour table / findings |
| REQ-382b | E | finding:F-P6b-9 (P1) | § P6b behaviour table / findings |
| REQ-382c | E | finding:F-P6b-9 (P1) | § P6b behaviour table / findings |
| REQ-383a | E | finding:F-P6b-9 (P1) | § P6b behaviour table / findings |
| REQ-383b | E | finding:F-P6b-9 (P1) | § P6b behaviour table / findings |
| REQ-384a | E | finding:F-P6b-1 (Resolved) | § P6b behaviour table / findings |
| REQ-384b | E | finding:F-P6b-10 (P1) | § P6b behaviour table / findings |
| REQ-384c | E | finding:F-P6b-10 (P1) | § P6b behaviour table / findings |
| REQ-385a | E | finding:F-P6b-11 (P1) | § P6b behaviour table / findings |
| REQ-385b | E | finding:F-P6b-11 (P1) | § P6b behaviour table / findings |
| REQ-386a | E | finding:F-P6b-10 (P1) | § P6b behaviour table / findings |
| REQ-386b | E | finding:F-P6b-10 (P1) | § P6b behaviour table / findings |
| REQ-387a | E | finding:F-P6b-10 (P1) | § P6b behaviour table / findings |
| REQ-387b | E | finding:F-P6b-10 (P1) | § P6b behaviour table / findings |
| REQ-389a | C | holds | § P6b behaviour table / findings |
| REQ-389b | C | finding:F-P6b-5 (Resolved) + F-P6b-21 (P1) | § P6b behaviour table / findings |
| REQ-389c | C | finding:F-P6b-2/F-P6b-3 (Resolved) + F-P6b-9 (P1) | § P6b behaviour table / findings |
| REQ-430 | C | finding:F-P6b-12 (P1) | § P6b behaviour table / findings |
| REQ-432a | C | finding:F-P6b-12 (P1) | § P6b behaviour table / findings |
| REQ-432b | C | finding:F-P6b-12 (P1) | § P6b behaviour table / findings |
| REQ-390a | C | holds | § P6b behaviour table / findings |
| REQ-390b | C | finding:F-P6b-12 (P1) | § P6b behaviour table / findings |
| REQ-391a | C | holds (F-P6b-25 P3 note) | § P6b behaviour table / findings |
| REQ-391b | C | holds | § P6b behaviour table / findings |
| REQ-391c | C | finding:F-P6b-20 (P1) | § P6b behaviour table / findings |
| REQ-392 | C | holds | § P6b behaviour table / findings |
| REQ-393 | C | holds | § P6b behaviour table / findings |
| REQ-394 | E | finding:F-P6b-14 (P1) | § P6b behaviour table / findings |
| REQ-419 | E | holds | § P6b behaviour table / findings |
| REQ-394a | E | holds | § P6b behaviour table / findings |
| REQ-395a | E | finding:F-P6b-7 (P1) | § P6b behaviour table / findings |
| REQ-395b | E | finding:F-P6b-21 (P1) | § P6b behaviour table / findings |
| REQ-395c | E | finding:F-P6b-7 (P1) | § P6b behaviour table / findings |
| REQ-396 | E | finding:F-P6b-13 (P1) | § P6b behaviour table / findings |
| REQ-397 | E | finding:F-P6b-8 (P1) | § P6b behaviour table / findings |
| REQ-398 | E | holds | § P6b behaviour table / findings |
| REQ-418 | E | finding:F-P6b-13 (P1) | § P6b behaviour table / findings |
| REQ-420 | C | holds | § P6b behaviour table / findings |
| REQ-558 | C | finding:F-P6b-16 (P1) | § P6b behaviour table / findings |
| REQ-560 | E | holds | § P6b behaviour table / findings |
| REQ-561 | E | holds | § P6b behaviour table / findings |
| REQ-421 | E | finding:F-P6b-15 (P1) | § P6b behaviour table / findings |
| REQ-563 | E | finding:F-P6b-7 (P1) | § P6b behaviour table / findings |
| REQ-557 | E | finding:F-P6b-15 (P1) | § P6b behaviour table / findings |
| REQ-422 | E | finding:F-P6b-24 (P3) | § P6b behaviour table / findings |
| REQ-423 | C | holds | § P6b behaviour table / findings |
| REQ-424 | C | holds | § P6b behaviour table / findings |
| REQ-650 | C | finding:F-P6b-7 (P1) | § P6b behaviour table / findings |
| REQ-651 | C | holds | § P6b behaviour table / findings |
| REQ-652 | C | holds | § P6b behaviour table / findings |
| REQ-556 | E | holds | § P6b behaviour table / findings |
| REQ-564 | E | finding:F-P6b-7 (P1) | § P6b behaviour table / findings |
| REQ-428 | E | finding:F-P6b-19 (P1) | § P6b behaviour table / findings |
| REQ-429 | C | holds | § P6b behaviour table / findings |
| REQ-434 | C | finding:F-P6b-6 (Resolved) | § P6b behaviour table / findings |
| REQ-435 | C | finding:F-P6b-18 (P1) | § P6b behaviour table / findings |
| REQ-436 | C | finding:F-P6b-18 (P1) | § P6b behaviour table / findings |
| REQ-437 | C | finding:F-P6b-18 (P1) | § P6b behaviour table / findings |
| REQ-438 | C | holds | § P6b behaviour table / findings |
| REQ-439 | C | finding:F-P6b-21 (P1) | § P6b behaviour table / findings |
| REQ-440 | C | finding:F-P6b-18 (P1) | § P6b behaviour table / findings |
| REQ-441 | C | finding:F-P6b-22 (P3) | § P6b behaviour table / findings |
| REQ-442 | C | finding:F-P6b-17 (P1) + F-P6b-18 (P1) | § P6b behaviour table / findings |
| REQ-443 | C | holds | § P6b behaviour table / findings |

### P6b behaviour table

| Behaviour | Anchor | Harness | Verdict |
|---|---|---|---|
| Package manifest and six-file format | `rulesets.ts:17-40,658-667` | T452 `test-output-contracts.ts:1590` | holds |
| Content hash over the five canonical parts | `rulesets.ts:114-127,637-646` | T654 `test-ruleset-gates.ts:144` | holds |
| Package-format fingerprint comparison | `rulesets.ts:384-393,634-636` | T498/T503 `test-fingerprints.ts:182` | holds |
| Install / remove / list surface | `index.ts:11276-11300` | T453; `test-ruleset-surface-remediation` | finding:F-P6b-2/F-P6b-3 (Resolved) + F-P6b-9 (P1) |
| Tool namespacing and prefix map | `index.ts:2226,2234,11963` | T512; `test-ruleset-surface-remediation` | finding:F-P6b-9 (P1) |
| Lazy hydration and health counts | `rulesets.ts:362-407,486-539`; `index.ts:1908-1913` | T454; `test-ruleset-surface-remediation` | finding:F-P6b-2 (Resolved) |
| Vendor license certification | `rulesets.ts:45-53,396-400`; `index.ts:11285` | T517 `test-competitive-gaps.ts:374` | finding:F-P6b-12 (P1) |
| TDQS schema validation and alerts | `rulesets.ts:287-334,561-570` | T512/T648 `test-tool-definitions.ts:423` | holds |
| Ruleset-scoped gating at dispatch | `index.ts:1820-1840`; `2051` | `test-ruleset-surface-remediation` | finding:F-P6b-1 (Resolved) |
| Default vs `scope=all` listing | `index.ts:1447-1455,14718-14725` | T456 `test-output-contracts.ts:1745` | holds |
| Per-ruleset `spec_health` and Player filtering | `index.ts:11948-12070` | T444 absent | finding:F-P6b-9 (P1) |
| Codex / import / export ruleset axis | `index.ts:13294-13313,10729-10866,10691-10703` | T447/T431 mis-cited | finding:F-P6b-10 (P1) |
| `run_command (action: suggest)` ruleset scoping | `index.ts:4522-4585` | T446 absent | finding:F-P6b-11 (P1) |
| `build-ruleset` intake and source registry | `scripts/build-ruleset.ts:87-149` | T463 absent; T499 `test-fingerprints.ts:258` | finding:F-P6b-7/F-P6b-15 (P1) |
| Committed emitter and deterministic emission | `scripts/lib/ruleset-package.mjs:14-42`; `.gitignore:22` | T654; T656 absent | finding:F-P6b-7 (P1) |
| `update` / `update-rulesets` / `migrate-user-data` | `scripts/update.ts:43-157`; `update-rulesets.ts:24-51` | T689/T500/T502/T504 | holds (F-P6b-24 P3 note) |
| Startup reconciliation and stale health | `index.ts:118-128,11999-12014`; `state.ts:195-218` | T774/T775 | holds |
| Deploy preservation and verification | `publish/steps.ts:575-642` | T465/T466/T491 absent | finding:F-P6b-13 (P1) |
| Shipped compiled `update` command | `bin/holonovel.js:6-14`; `src/cli/update.ts:88-103` | T773/T776 | holds |
| Fate / Ironsworn / Forged capabilities | `index.ts:7479-7864`; `rulesets.ts:218-261` | T520–T529 | finding:F-P6b-17/F-P6b-18 (P1) |

### P6b cluster verdicts

Cluster verdicts are worst-of their own REQ rows (`finding` > `deferred` >
`builder-side` > `holds`); a resolved finding counts as `holds` for the aggregate.

| Cluster | REQs | Verdict | Evidence |
|---|---|---|---|
| A package format and manager | REQ-379, 382, 389, 430, 432, 390, 393 | finding:F-P6b-9 (P1) | two P0s resolved (F-P6b-2, F-P6b-3); package metrics, namespacing annotation, and license drift remain |
| B ruleset-scoped surface | REQ-380, 381, 383–387, 391, 392, 429, 558 | finding:F-P6b-9 (P1) | scope gating fixed (F-P6b-1); per-ruleset health, codex, import/export, suggest, pagination remain |
| C host entry points and lifecycle | REQ-394, 419, 394a, 395–398, 418, 420–424, 428, 556, 557, 560, 561, 563, 564, 650–652 | finding:F-P6b-7 (P1) | no committed emitter; state-location and deploy guards remain |
| D base capabilities | REQ-434–443 | finding:F-P6b-17 (P1) | fate_roll refusal fixed (F-P6b-6); Forged consequences and refusal snapshots remain |

### P6b findings

| ID | Severity | REQs | Predicate | Disposition |
|---|---|---|---|---|
| F-P6b-1 | P0 | REQ-381a, REQ-380c, REQ-384a | `index.ts:1820-1836` checked only retired aliases and the surface profile; ruleset scope was read only by `scopedCatalog` for listing | Resolved |
| F-P6b-2 | P0 | REQ-389c, REQ-390 | `index.ts:11280` hydrated every package in the read-only `list` action and then reported `isHydrated`, so the state was always "loaded" | Resolved |
| F-P6b-3 | P0 | REQ-389c | removed package tools stayed in the SDK registry (`index.ts:1453`); the search truncation pointed at an unregistered `ruleset://` URI (`:11219`) | Resolved |
| F-P6b-4 | P0 | REQ-380a | `state.ts:3067` copied every serialized key on import/restore, so a bundle could silently replace a Novel`s ruleset | Resolved |
| F-P6b-5 | P0 | REQ-389b, REQ-390a | `rulesets.ts:504-508` threw on a content-hash mismatch but nothing recorded it; the `[load-rejected]` channel was unreachable | Resolved |
| F-P6b-6 | P0 | REQ-002, REQ-434 | `index.ts:7519` called `rollDice` with no guard, so malformed notation escaped the handler instead of returning `[INVALID_INPUT]` | Resolved |
| F-P6b-7 | P1 | REQ-395a, 395c, 563, 564, 650 | `scripts/build-ruleset.ts:142-149` prints the Build invocation but never emits; `.gitignore:22` excludes `scripts/ruleset-builds/`, so no committed emitter resolves and `update --apply` can only defer | Scheduled-roadmap |
| F-P6b-8 | P1 | REQ-397 | `core/data-dir.ts:60-61` returns a legacy in-tree state dir silently; `[state-in-tree]` appears nowhere, and the four root entry scripts hardcode `holonovel/.holonovel-state` | Scheduled-roadmap |
| F-P6b-9 | P1 | REQ-379b, 379c, 381b, 381c, 382b, 382c, 383a, 383b | no `ruleset` annotation or `inapplicable` hint in the listing; no `ruleset_health`/`combined` sections; the prefix map is GM-only and not recorded in DECISIONS.md | Scheduled-roadmap |
| F-P6b-10 | P1 | REQ-380c, 384b, 384c, 386a, 386b, 387a, 387b | bind has no mechanics-state check; switch is unaudited; import validates no ruleset; export omits it; codex has no ruleset axis (T431 is a mis-citation) | Scheduled-roadmap |
| F-P6b-11 | P1 | REQ-385a, 385b | `index.ts:4548-4550` emits generic prose and never derives prefixed suggestions from the bound package model | Scheduled-roadmap |
| F-P6b-12 | P1 | REQ-390b, 430, 432a, 432b, 421 | no aggregate index bytes; no aggregate package tool budget; `APPENDIX_U_LICENSES` drifts from Appendix U (OGL present, COF form absent); registry has no recipe roles or license field | Scheduled-roadmap |
| F-P6b-13 | P1 | REQ-396, 418 | `publish/steps.ts:585-588` cleans the deploy tree with no state-dir assertion; the fast-forward failure names no server; the stub path marks the deploy complete | Scheduled-roadmap |
| F-P6b-14 | P1 | REQ-394 | `scripts/spec-delta.ts:138-140` falls back to the working-tree `DECISIONS.md` hash when no published hash resolves | Scheduled-roadmap |
| F-P6b-15 | P1 | REQ-395a, 421, 557 | supplement intake/overlay and `base_content_hash` are unimplemented; `update-rulesets` never compares a recorded base hash | Scheduled-roadmap |
| F-P6b-16 | P1 | REQ-558 | package tools register only in the startup loop; a runtime `manage_ruleset (action: install)` registers no tools until restart | Scheduled-roadmap |
| F-P6b-17 | P1 | REQ-442 | `index.ts:7828-7834` adds stress without reducing a named consequence; the Forged state has no consequence slot | Scheduled-roadmap |
| F-P6b-18 | P1 | REQ-041a, REQ-041b, 435, 436, 440, 442 | `novelSnapshot()` precedes validation in the capability branches, so a refused action pushes undo state and clears redo | Scheduled-roadmap |
| F-P6b-19 | P1 | REQ-428 | no container image exists and `server.json` is version-checked but not schema-validated | Scheduled-roadmap |
| F-P6b-20 | P1 | REQ-391c | `tools/list` returns `{ ...full, tools }` with no size cap or `nextCursor` pagination | Scheduled-roadmap |
| F-P6b-21 | P1 | REQ-379c, 381c, 383b, 384c, 385b, 386b, 387b, 391b, 391c, 395a, 395b, 396, 397, 398, 418, 419, 557, 563, 564, 389b, 389c, 393, 428, 439 | absent or non-exercising `_Check:_` citations (T440, T442–T447, T451, T457, T458, T463–T467, T491, T492, T650, T656, T657, plus weak T454/T455/T456/T459/T460/T462/T499/T510 and the T431 mis-citation) | Scheduled-roadmap |
| F-P6b-22 | P3 | REQ-434–442 | capability edge cases: zero-dice Forged display, `-0` modifier, unguarded compel, silent stress no-op, negative quantities, defaulted required fields | Closed-P3 |
| F-P6b-23 | P3 | REQ-389c, REQ-390b, REQ-392, REQ-393, REQ-429 | assertion breadth: T453/T455/T459/T460 are vacuous or weak; T511 uses a partial persisted-type allowlist | Closed-P3 |
| F-P6b-24 | P3 | REQ-395b, REQ-422, REQ-424, REQ-428 | entry-point polish: `update` prints no runbook pointer, `update-rulesets` prints no usage, `migrate-user-data` duplicates the runtime re-stamp, `prepare-package` omits the compiled update entry | Closed-P3 |
| F-P6b-25 | P3 | REQ-391a, REQ-392 | surface polish: the no-Novel default listing omits installed-ruleset metadata; `tools_list_bytes` is a canonical-cache approximation | Closed-P3 |
| F-P6b-26 | P3 | REQ-432a, REQ-389b, REQ-390a | provenance labels the license as `source`; `search`/`roll` hydrate failures escape the error taxonomy | Closed-P3 |


## Chunk P7a — determinism and knowledge artifacts

**Code targets:** `holonovel/src/core/rng.ts` (91 lines), `state-hash.ts` (64),
`limits.ts` (47), `corpus.ts` (81), `semantic.ts` (148), `graph.ts` (125); the
`manage_scene (action: oracle)`, `manage_combat (action: init)`,
`manage_character (action: create)`, `manage_knowledge`,
`manage_corpus`/`manage_lore`, and `manage_ruleset (action:
import_supplementary)` branches in `holonovel/src/index.ts`.
**Spec:** §5.7 (64 REQs / 33 family rows), §5.14 (7 / 2), §5.28 (9 / 9),
§5.29 (6 / 6), §5.30 (5 / 5) — 91 REQs / 55 family rows.
**Decisions:** D81–D90 (chunk split, fix policy, buckets, boundaries,
citations, fingerprints, publication).
**Exit evidence (recorded 2026-11-09):** `check:fast` 37/37 PASS, `check`
PASS, `test:all` 56/56 PASS (135.2s), `test:corpus` 9/9, `test:index` 6/6,
`test:graph` 5/5, `test:limits` 27/27, `test:supplementary` 4/4,
`test:fingerprints` 12/12, `check-roadmap` PASS, `check-registers:strict`
PASS, `check-loop-artifacts` PASS. Baseline note: the first `check:fast` run
failed only because this increment directory lacked `tasks.md`/`aar.md`; after
Phase 0 step 2 the gate passed. No source file was modified.

### P7a per-REQ verdict table

One row per REQ: `holds` (contract present and exercised), `finding:<ID>`
(see the register), or `builder-side` (bucket E — no server runtime satisfies
it; §5.7's verifier/performance rows and §5.14's dynamic-registration waiver
are builder or verifier contracts). Bucket is inherited from the base family
row in `spec/audit/req-coverage.md` (D84).

| REQ | Bucket | Verdict | Evidence |
|---|---|---|---|
| REQ-050a | C | finding:F-P7a-1 (P1) | § P7a findings / behaviour table |
| REQ-050b | C | holds | § P7a findings / behaviour table |
| REQ-050c | C | holds | § P7a findings / behaviour table |
| REQ-273a | E | builder-side | § P7a findings / behaviour table |
| REQ-273b | E | builder-side | § P7a findings / behaviour table |
| REQ-274 | E | builder-side | § P7a findings / behaviour table |
| REQ-213a | C | holds | § P7a findings / behaviour table |
| REQ-213b | C | holds | § P7a findings / behaviour table |
| REQ-213c | C | holds | § P7a findings / behaviour table |
| REQ-291a | C | holds | § P7a findings / behaviour table |
| REQ-291b | C | holds | § P7a findings / behaviour table |
| REQ-291c | C | holds | § P7a findings / behaviour table |
| REQ-291d | C | holds | § P7a findings / behaviour table |
| REQ-157a | C | holds | § P7a findings / behaviour table |
| REQ-157b | C | holds | § P7a findings / behaviour table |
| REQ-051 | C | holds | § P7a findings / behaviour table |
| REQ-433a | C | holds | § P7a findings / behaviour table |
| REQ-433b | C | holds | § P7a findings / behaviour table |
| REQ-052 | C | finding:F-P7a-3 (P1) | § P7a findings / behaviour table |
| REQ-251a | C | holds | § P7a findings / behaviour table |
| REQ-251b | C | holds | § P7a findings / behaviour table |
| REQ-251c | C | holds | § P7a findings / behaviour table |
| REQ-251d | C | holds | § P7a findings / behaviour table |
| REQ-100a | E | builder-side | § P7a findings / behaviour table |
| REQ-100b | E | builder-side | § P7a findings / behaviour table |
| REQ-100c | E | builder-side | § P7a findings / behaviour table |
| REQ-100d | E | builder-side | § P7a findings / behaviour table |
| REQ-586 | C | holds | § P7a findings / behaviour table |
| REQ-410 | C | holds | § P7a findings / behaviour table |
| REQ-416 | E | builder-side | § P7a findings / behaviour table |
| REQ-417 | C | holds | § P7a findings / behaviour table |
| REQ-253a | C | holds | § P7a findings / behaviour table |
| REQ-253b | C | holds | § P7a findings / behaviour table |
| REQ-253c | C | holds | § P7a findings / behaviour table |
| REQ-409 | C | holds | § P7a findings / behaviour table |
| REQ-054 | C | holds | § P7a findings / behaviour table |
| REQ-055 | C | finding:F-P7a-2 (P1) | § P7a findings / behaviour table |
| REQ-055a | C | finding:F-P7a-2 (P1) | § P7a findings / behaviour table |
| REQ-055b | C | finding:F-P7a-2 (P1) | § P7a findings / behaviour table |
| REQ-312d1 | C | holds | § P7a findings / behaviour table |
| REQ-312d2 | C | holds | § P7a findings / behaviour table |
| REQ-312a | C | holds | § P7a findings / behaviour table |
| REQ-312b | C | holds | § P7a findings / behaviour table |
| REQ-312c | C | holds | § P7a findings / behaviour table |
| REQ-312e | C | holds | § P7a findings / behaviour table |
| REQ-444 | C | holds | § P7a findings / behaviour table |
| REQ-445 | C | holds | § P7a findings / behaviour table |
| REQ-446 | C | holds | § P7a findings / behaviour table |
| REQ-447 | C | holds | § P7a findings / behaviour table |
| REQ-448 | C | holds | § P7a findings / behaviour table |
| REQ-449 | C | holds | § P7a findings / behaviour table |
| REQ-615 | C | holds | § P7a findings / behaviour table |
| REQ-616 | C | holds | § P7a findings / behaviour table |
| REQ-616a | C | holds | § P7a findings / behaviour table |
| REQ-616b | C | holds | § P7a findings / behaviour table |
| REQ-617 | C | holds | § P7a findings / behaviour table |
| REQ-618 | C | holds | § P7a findings / behaviour table |
| REQ-619 | E | builder-side | § P7a findings / behaviour table |
| REQ-620 | C | holds | § P7a findings / behaviour table |
| REQ-621 | C | holds | § P7a findings / behaviour table |
| REQ-621b | C | holds | § P7a findings / behaviour table |
| REQ-621c | C | holds | § P7a findings / behaviour table |
| REQ-621d | C | holds | § P7a findings / behaviour table |
| REQ-621a | C | holds | § P7a findings / behaviour table |
| REQ-372a | C | holds | § P7a findings / behaviour table |
| REQ-372b | C | holds | § P7a findings / behaviour table |
| REQ-372c | C | holds | § P7a findings / behaviour table |
| REQ-372d | C | holds | § P7a findings / behaviour table |
| REQ-372e | C | holds | § P7a findings / behaviour table |
| REQ-373a1 | E | builder-side | § P7a findings / behaviour table |
| REQ-373a2 | E | builder-side | § P7a findings / behaviour table |
| REQ-496 | C | holds | § P7a findings / behaviour table |
| REQ-497 | C | holds | § P7a findings / behaviour table |
| REQ-498 | C | holds | § P7a findings / behaviour table |
| REQ-499 | C | holds | § P7a findings / behaviour table |
| REQ-500 | C | holds | § P7a findings / behaviour table |
| REQ-501 | C | holds | § P7a findings / behaviour table |
| REQ-502 | C | holds | § P7a findings / behaviour table |
| REQ-503 | C | holds | § P7a findings / behaviour table |
| REQ-546 | C | holds | § P7a findings / behaviour table |
| REQ-504 | C | holds | § P7a findings / behaviour table |
| REQ-505 | C | holds | § P7a findings / behaviour table |
| REQ-506 | C | holds | § P7a findings / behaviour table |
| REQ-507 | C | holds | § P7a findings / behaviour table |
| REQ-508 | C | holds | § P7a findings / behaviour table |
| REQ-509 | C | holds | § P7a findings / behaviour table |
| REQ-510 | C | holds | § P7a findings / behaviour table |
| REQ-511 | C | holds | § P7a findings / behaviour table |
| REQ-512 | C | holds | § P7a findings / behaviour table |
| REQ-513 | C | holds | § P7a findings / behaviour table |
| REQ-514 | C | holds | § P7a findings / behaviour table |

### P7a behaviour table

| Behaviour | Anchor | Harness | Verdict |
|---|---|---|---|
| Session PRNG seed and startup log | `core/rng.ts:41-47` | `test-backfill.ts:489` (T27/T111) | holds |
| Per-call isolated draw (no session advance) | `core/rng.ts:87-91`; `index.ts:6458` | `test-backfill.ts:489`, `test-output-contracts.ts` (T192) | holds |
| Seed-conflict `[WARNING]` (session seed + per-call seed) | no site: `index.ts:6458`, `index.ts:2162` consume `args.seed` without a warning | probe: oracle under `TTRPG_SEED=42` returns no warning | finding:F-P7a-1 (P1) |
| State-hash canonicalization and exclusion list | `core/state-hash.ts:13-27,45-63` | `lib/holosuite-differential.ts:88,96,106` (Tier differential) | holds |
| Novel property-group caps and refusal shape | `core/limits.ts:22-46` | `test-limits.ts` (T143); `test-all` | holds |
| Snapshot-depth floor of ten | `core/limits.ts:31,36-38` | `test-limits.ts:194` (T143) | holds |
| No outbound network | `index.ts` `TOOL_ANNOTATIONS` (`openWorldHint: false`); SECURITY.md | `test-backfill.ts:497` (T41/T051); G4 | holds |
| Path containment on path parameters | `index.ts` ruleset/artifact path guards; `core/data-dir.ts` | `test-artifact-registry.ts:148` (T739) exercises traversal; REQ-052's own T20 body does not | finding:F-P7a-3 (P1) |
| Input safety: adversarial text inert | `index.ts` dispatch | `test-output-contracts.ts:1235` (T20/T42/REQ-054) | holds |
| Durability across restart | `core/state.ts` atomic save; `rng.ts:38-42` | Tier differential; `test-persistence.ts:405` (T122) | holds |
| Supplementary import / remove / re-resolve | `index.ts:6891-6920` (`import_supplementary`) | `test-supplementary.ts:32,56` (T423/T424) | holds |
| Corpus register, access predicate, consume | `core/corpus.ts:53-59`; `index.ts:8774-8930` | `test-corpus.ts` (T586–T593) | holds |
| Corpus retention cap, oldest-first | `index.ts:8800,8903` | `test-corpus.ts:...` (T628); probe: cap 2 evicts `doc-1` | holds |
| Semantic index build/staleness/ranking | `core/semantic.ts:83-144` | `test-index.ts` (T594–T599) | holds |
| Semantic relation catalog | `core/semantic.ts:123-130` | `test-index.ts` (T597: equivalent/related) | holds |
| Graph projection, idempotency, scope visibility | `core/graph.ts:52-125`; `index.ts:9044-9071` | `test-graph.ts` (T600–T604) | holds |

### P7a findings

- **F-P7a-1 — Seed-conflict warning is not emitted (P1, Scheduled-roadmap).**
  Predicate: `holonovel/src/index.ts:6458` (oracle) and `:2162` (`rollDice`)
  consume a per-call `seed` with no `[WARNING]` seed-conflict line; no such
  site exists in `holonovel/src` (`grep -rn 'seed' … | grep -i warn` returns
  nothing). Demonstrated: `manage_scene (action: oracle, seed: "7")` under
  `TTRPG_SEED=42` returned `[OK] … [NO]` with no warning. Covers REQ-050a.
- **F-P7a-2 — Missing Automated citations for the badge-precedence rows
  (P1, Scheduled-roadmap).** Predicate: `spec/02-requirements.md:2428,2436,2444`
  cite T31/T108; neither token appears in any harness under
  `holonovel/scripts`, and Appendix F defines both as Automated
  (`spec/appendices-reference.md:1450,1569`). The behaviour is exercised under
  other IDs (`test-limits.ts:386` T9/REQ-055a; S17 lifecycle), so this is a
  citation repair, not an unimplemented contract. Covers REQ-055, REQ-055a,
  REQ-055b.
- **F-P7a-3 — REQ-052's citation does not exercise path containment
  (P1, Scheduled-roadmap).** Predicate: `spec/02-requirements.md:2337` cites
  T20; the token-bearing assertions are `test-backfill.ts:503`
  ("path containment — world resources render map", which creates a room and
  reads `world://map`) and `test-output-contracts.ts:1235` (adversarial text).
  Neither submits a traversal path; the only traversal assertion is
  `test-artifact-registry.ts:148` under T739 (REQ-621d). Re-point REQ-052 to
  that assertion or add one. Covers REQ-052.

### P7a cluster verdicts

| Cluster | REQs | Verdict | Evidence |
|---|---|---|---|
| A — determinism and safety (§5.7) | 64 | finding:F-P7a-1 (P1), F-P7a-2 (P1), F-P7a-3 (P1) | behaviour table; findings above |
| B — content sources (§5.14) | 7 | holds | `test-supplementary.ts` T423/T424 |
| C — knowledge corpus (§5.28) | 9 | holds | `test-corpus.ts` T586–T593, T628 |
| D — semantic index and graph (§5.29–§5.30) | 11 | holds | `test-index.ts`, `test-graph.ts` |


## Chunk P7b — extraction and synthesis (§5.2, §5.8)

### Decisions (2026-11-09, chunk P7b)

- **D91 — Chunk scope (user-approved).** P7b = §5.2 (58 REQs / 37 family rows)
  + §5.8 (131 / 39) = 189 REQs / 76 family rows, executed whole. §5.2's 37 rows
  are all bucket E; §5.8 carries 32 C / 7 E. Re-derived at Phase 0 step 8 and
  unchanged.
- **D92 — Fix policy.** D2/D13/D62 unchanged: P0 in-session, P1 roadmap, P2 only
  on a demonstrated failure, P3 record-and-close. No P0 was raised; no P2 was
  fixed in-session (each is a citation repair, not a demonstrated failure).
- **D93 — Increment record.** `docs/plans/2026-11-09-full-review-p7b/` holds
  plan/tasks/AAR; this worklist is the tracker and carries the P7b tables.
- **D94 — Bucket resolution.** By base family row from
  `spec/audit/req-coverage.md`: §5.2 37 E; §5.8 32 C / 7 E (`REQ-114`,
  `REQ-130`, `REQ-158`, `REQ-228`, `REQ-243`, `REQ-244`, `REQ-245`). Total
  32 C / 44 E.
- **D95 — Boundaries.** §5.7/§5.28–§5.30 closed in P7a; P8 owns §5.12,
  §5.25–§5.27, §5.32–§5.35; §5.2 is reviewed for its builder predicates, not
  converter implementation; `holonovel/src/core/memory.ts` is a shared file
  surface with P8 but REQ ownership is disjoint.
- **D96 — Row precedence.** `finding` > `deferred` > `builder-side` > `holds`;
  cluster verdicts worst-of their own rows; no resolved findings this chunk.
- **D97 — Citation resolution.** D10/D25/D49/D67/D77 method: an `Automated`
  token must appear in a `test("...")` title under `holonovel/scripts` (the
  derivation `scripts/compare-spec-code.ts:150-166` uses); `Manual` and gate
  citations need no harness; `T0nn` shadowing is not evidence.
- **D98 — Fingerprint consequence.** Neither section is in `DATA_SECTIONS` or
  `PACKAGE_SECTIONS` (`scripts/lib/contract-fingerprint.ts:27,37-43`); no REQ
  body changed, so `build-order` ran for fingerprint/marker freshness only and
  the version bump was a no-op at CalVer 2026.11.09.
- **D99 — Baseline.** `check:fast` 37/37 PASS, `check` PASS, `test:all` 56/56
  PASS. No C0 commit was needed.
- **D100 — Publication.** 18 commits were unpushed at session start; no push
  (D4).

### P7b behaviour table

| Behaviour | Anchor | Harness | Verdict |
|---|---|---|---|
| Conversion-evidence verification | `scripts/validate.ts:971`; `holonovel/scripts/check-conversion-evidence.ts` | `check:conversion-evidence` (reached by `test:all`) | holds |
| §5.2 evidence-surface coverage map | `scripts/validate.ts:971-1009` | `validate` gate | holds |
| Vendor and source integrity | `scripts/check-vendor-manifest.ts` | `check:vendor` | holds |
| Story journal capture and surfacing | `holonovel/src/index.ts:7989`, `:14387` | T408 (`test-limits.ts:403`), T474 (`:398`) | finding:F-P7b-1 (P1) |
| Journal-to-lore promotion | `holonovel/src/index.ts:922` | T380 (`test-output-contracts.ts`) | holds |
| Campaign memory | `holonovel/src/core/memory.ts:116`; `core/state.ts:753` | T355 (`test-output-contracts.ts`) | holds |
| Synthesis boundaries and citation verification | `holonovel/src/index.ts:13540` (`verify`) | T695 (`test-supplementary.ts`) | holds |
| Synthesis model and confidence | `holonovel/src/core/wisdom.ts:61-81` | T303, T323 (`test-backfill.ts`, `test-output-contracts.ts`) | holds |
| Synthesis activation, reversion, rebuild, cache, manifest | `holonovel/src/index.ts:13540` (run/revert); `core/wisdom.ts` manifest | T319, T320, T125 | finding:F-P7b-3 (P1) |
| Prompt section ordering and section tokens | `holonovel/src/core/prompt-composition.ts:90-343` | T66, T300, T225 | finding:F-P7b-8 (P2) |
| Dynamic lore and sticky-counter decay | `holonovel/src/index.ts:6908`, `:773`; `:299` | T342, T299 | finding:F-P7b-2 (P1) |
| Lore-world coupling | `holonovel/src/core/state.ts:295` | T372 (`test-output-contracts.ts`) | holds |
| Action suggestions and pattern activation | `holonovel/src/index.ts` `run_command (action: suggest)`; briefing actions | T119, T120, T637 | finding:F-P7b-6 (P1) |
| Macros and audit compression | `holonovel/src/core/macros.ts:1`; `index.ts:2645` | T69, T70 | holds |
| Scene tagging and the scene-transition hook | `holonovel/src/index.ts:6167` | (none: T71/T135/T136 unimplemented) | finding:F-P7b-4 (P1) |
| Ruling ledger | `holonovel/src/index.ts:13540` (`record_ruling`) | T696 (`test-supplementary.ts`) | holds |

### P7b cluster verdicts

| Cluster | REQs | Verdict | Evidence |
|---|---|---|---|
| A — extraction and confidence (§5.2) | 58 | finding:F-P7b-9 (P2) | behaviour table; findings below |
| B — story journal and campaign memory (§5.8) | 15 | finding:F-P7b-1 (P1) | `index.ts:14387`; T282 absent from `holonovel/scripts` |
| C — synthesis engine (§5.8) | 65 | finding:F-P7b-3 (P1) | `index.ts:13540`; F-P7b-3, F-P7b-7 |
| D — prompt composition and section tokens (§5.8) | 12 | finding:F-P7b-8 (P2) | `prompt-composition.ts:90-343`; T205 is builder-side |
| E — lore, macros, suggestions, scenes (§5.8) | 39 | finding:F-P7b-2 (P1) | F-P7b-2, F-P7b-4, F-P7b-5, F-P7b-6 |

### P7b findings

- **F-P7b-1 — Story-journal citations name an unimplemented test (P1,
  Scheduled-roadmap).** `spec/02-requirements.md:2525,2534` cite T282; no
  `test("...")` title under `holonovel/scripts` carries T282, yet the
  behaviour exists (`index.ts:7989` record, `:14387` briefing section) and is
  partially exercised by T408/T474 (display cap and auto-record only, not the
  record/undo/export/player-refusal/recap contract). REQ-246a, REQ-246b1,
  REQ-246b2.
- **F-P7b-2 — Dynamic-lore lifecycle cites five unimplemented tests (P1,
  Scheduled-roadmap).** `spec/02-requirements.md:2635` cites T67/T79/T81/T82/
  T83; none appears in a harness title, while `manage_lore` implements
  triggers, grouping, suggestion, and budget (`index.ts:6908`). REQ-083c.
- **F-P7b-3 — Synthesis run, reversion, and rebuild cite unimplemented tests
  (P1, Scheduled-roadmap).** REQ-080g2 cites T102/T288/T63/T95/T97; REQ-103a–d
  cite T94; REQ-130a–c cite T144. Only T125 is exercised; the engine is
  implemented at `index.ts:13540` and `core/wisdom.ts:61`. REQ-080g2,
  REQ-103a, REQ-103b, REQ-103c, REQ-103d, REQ-130a, REQ-130b, REQ-130c.
- **F-P7b-4 — Scene tagging and the transition hook cite unimplemented tests
  (P1, Scheduled-roadmap).** REQ-087a–c cite T135/T71; REQ-125a–b cite T136;
  none is carried by a harness, while the transition tick is implemented at
  `index.ts:6167`. REQ-087a, REQ-087b, REQ-087c, REQ-125a, REQ-125b.
- **F-P7b-5 — Secrets and knowledge cite an unimplemented test (P1,
  Scheduled-roadmap).** REQ-234a–d cite T274; no harness carries it, while
  `set_secret`/`reveal`/`secret_list`/`knowledge` are implemented
  (`index.ts:6874`, `:6908`). REQ-234a, REQ-234b, REQ-234c, REQ-234d.
- **F-P7b-6 — Proactive suggestion surfacing cites an unimplemented test (P1,
  Scheduled-roadmap).** REQ-084a1–a3 and REQ-084b1–b3 cite T359; REQ-084b4
  cites it alongside T120/T96 (exercised) and T68 (absent); no harness carries
  T359. REQ-084a1, REQ-084a2, REQ-084a3, REQ-084b1, REQ-084b2, REQ-084b3,
  REQ-084b4.
- **F-P7b-7 — Synthesis removal and confidence rows cite unimplemented
  assertions (P2, Scheduled-roadmap).** REQ-265a–c also cite T324 and
  REQ-266a–b also cite T325; the families are exercised (T326/T327) but the
  removal/confidence assertions are not. REQ-265a, REQ-265b, REQ-265c,
  REQ-266a, REQ-266b.
- **F-P7b-8 — Prompt section ordering leans on a builder-side test (P2,
  Scheduled-roadmap).** REQ-082a–c cite T205, which asserts a DECISIONS.md
  section-token table (builder handoff), plus T66 (exercised); the server
  ordering contract has no assertion of its own. REQ-082a, REQ-082b, REQ-082c.
- **F-P7b-9 — A §5.2 row cites server-side behaviour (P2, Scheduled-roadmap).**
  REQ-214a–c cite T255 (`resolve_mechanic (action: roll)` must refuse a
  lookup-table name — server-side), while the family is exempted builder-side;
  no harness carries T255 and `grep` finds no lookup-table refusal assertion.
  REQ-214a, REQ-214b, REQ-214c.

### P7b per-REQ verdict table (189 rows)

| REQ | Bucket | Verdict |
|---|---|---|
| REQ-010 | E | builder-side |
| REQ-011a | E | builder-side |
| REQ-011b | E | builder-side |
| REQ-011c | E | builder-side |
| REQ-147a | E | builder-side |
| REQ-147b | E | builder-side |
| REQ-153 | E | builder-side |
| REQ-154a | E | builder-side |
| REQ-154b | E | builder-side |
| REQ-270 | E | builder-side |
| REQ-271 | E | builder-side |
| REQ-099 | E | builder-side |
| REQ-207a | E | builder-side |
| REQ-207b | E | builder-side |
| REQ-207c | E | builder-side |
| REQ-012 | E | builder-side |
| REQ-315a | E | builder-side |
| REQ-315b | E | builder-side |
| REQ-111a | E | builder-side |
| REQ-111b | E | builder-side |
| REQ-212a | E | builder-side |
| REQ-212b | E | builder-side |
| REQ-013 | E | builder-side |
| REQ-014 | E | builder-side |
| REQ-015 | E | builder-side |
| REQ-214a | E | finding:F-P7b-9 (P2) |
| REQ-214b | E | finding:F-P7b-9 (P2) |
| REQ-214c | E | finding:F-P7b-9 (P2) |
| REQ-016 | E | builder-side |
| REQ-017 | E | builder-side |
| REQ-018 | E | builder-side |
| REQ-146a | E | builder-side |
| REQ-146b | E | builder-side |
| REQ-146c | E | builder-side |
| REQ-146d | E | builder-side |
| REQ-209 | E | builder-side |
| REQ-210a | E | builder-side |
| REQ-210b | E | builder-side |
| REQ-215a | E | builder-side |
| REQ-215b | E | builder-side |
| REQ-215c | E | builder-side |
| REQ-272 | E | builder-side |
| REQ-102a | E | builder-side |
| REQ-102b | E | builder-side |
| REQ-102c | E | builder-side |
| REQ-582 | E | builder-side |
| REQ-562 | E | builder-side |
| REQ-585 | E | builder-side |
| REQ-559 | E | builder-side |
| REQ-225a | E | builder-side |
| REQ-225b | E | builder-side |
| REQ-354 | E | builder-side |
| REQ-324 | E | builder-side |
| REQ-452 | E | builder-side |
| REQ-453 | E | builder-side |
| REQ-454 | E | builder-side |
| REQ-551 | E | builder-side |
| REQ-551a | E | builder-side |
| REQ-246b1 | C | finding:F-P7b-1 (P1) |
| REQ-246b2 | C | finding:F-P7b-1 (P1) |
| REQ-246a | C | finding:F-P7b-1 (P1) |
| REQ-331a | C | holds |
| REQ-331b | C | holds |
| REQ-333a | C | holds |
| REQ-333b | C | holds |
| REQ-333c | C | holds |
| REQ-310a | C | holds |
| REQ-310b | C | holds |
| REQ-310c | C | holds |
| REQ-310d | C | holds |
| REQ-310e | C | holds |
| REQ-310f | C | holds |
| REQ-310g | C | holds |
| REQ-080a | C | holds |
| REQ-080b | C | holds |
| REQ-080c | C | holds |
| REQ-080d | C | holds |
| REQ-080e | C | holds |
| REQ-080f | C | holds |
| REQ-080g1 | C | holds |
| REQ-080g2 | C | finding:F-P7b-3 (P1) |
| REQ-080h | C | holds |
| REQ-081a | C | holds |
| REQ-081b | C | holds |
| REQ-081c | C | holds |
| REQ-081d | C | holds |
| REQ-082a | C | finding:F-P7b-8 (P2) |
| REQ-082b | C | finding:F-P7b-8 (P2) |
| REQ-082c | C | finding:F-P7b-8 (P2) |
| REQ-185a | C | holds |
| REQ-185b | C | holds |
| REQ-185c | C | holds |
| REQ-186a | C | holds |
| REQ-186b | C | holds |
| REQ-083a | C | holds |
| REQ-083b | C | holds |
| REQ-083c | C | finding:F-P7b-2 (P1) |
| REQ-083d | C | holds |
| REQ-083e | C | holds |
| REQ-083f | C | holds |
| REQ-155a | C | holds |
| REQ-155b | C | holds |
| REQ-328a | C | holds |
| REQ-328b | C | holds |
| REQ-158a | E | builder-side |
| REQ-158b | E | builder-side |
| REQ-084b1 | C | finding:F-P7b-6 (P1) |
| REQ-084b2 | C | finding:F-P7b-6 (P1) |
| REQ-084b3 | C | finding:F-P7b-6 (P1) |
| REQ-084b4 | C | finding:F-P7b-6 (P1) |
| REQ-084a1 | C | finding:F-P7b-6 (P1) |
| REQ-084a2 | C | finding:F-P7b-6 (P1) |
| REQ-084a3 | C | finding:F-P7b-6 (P1) |
| REQ-115a | C | holds |
| REQ-115b | C | holds |
| REQ-114a | E | builder-side |
| REQ-114b | E | builder-side |
| REQ-114c | E | builder-side |
| REQ-103a | C | finding:F-P7b-3 (P1) |
| REQ-103b | C | finding:F-P7b-3 (P1) |
| REQ-103c | C | finding:F-P7b-3 (P1) |
| REQ-103d | C | finding:F-P7b-3 (P1) |
| REQ-260a | C | holds |
| REQ-260b | C | holds |
| REQ-260c | C | holds |
| REQ-260d | C | holds |
| REQ-260e | C | holds |
| REQ-261a | C | holds |
| REQ-261b | C | holds |
| REQ-261c | C | holds |
| REQ-261d | C | holds |
| REQ-261e | C | holds |
| REQ-262a | C | holds |
| REQ-262b | C | holds |
| REQ-262c | C | holds |
| REQ-263a | C | holds |
| REQ-263b | C | holds |
| REQ-264a | C | holds |
| REQ-264b | C | holds |
| REQ-264c | C | holds |
| REQ-265a | C | finding:F-P7b-7 (P2) |
| REQ-265b | C | finding:F-P7b-7 (P2) |
| REQ-265c | C | finding:F-P7b-7 (P2) |
| REQ-266a | C | finding:F-P7b-7 (P2) |
| REQ-266b | C | finding:F-P7b-7 (P2) |
| REQ-130a | E | finding:F-P7b-3 (P1) |
| REQ-130b | E | finding:F-P7b-3 (P1) |
| REQ-130c | E | finding:F-P7b-3 (P1) |
| REQ-226a | C | holds |
| REQ-226b | C | holds |
| REQ-226c | C | holds |
| REQ-227a | C | holds |
| REQ-227b | C | holds |
| REQ-228a | E | builder-side |
| REQ-228b | E | builder-side |
| REQ-228c | E | builder-side |
| REQ-230a | C | holds |
| REQ-230b | C | holds |
| REQ-231a | C | holds |
| REQ-231b | C | holds |
| REQ-243a | E | builder-side |
| REQ-243b | E | builder-side |
| REQ-243c | E | builder-side |
| REQ-243d | E | builder-side |
| REQ-244a | E | builder-side |
| REQ-244b | E | builder-side |
| REQ-244c | E | builder-side |
| REQ-244d | E | builder-side |
| REQ-244e | E | builder-side |
| REQ-245a | E | builder-side |
| REQ-245b | E | builder-side |
| REQ-245c | E | builder-side |
| REQ-245d | E | builder-side |
| REQ-245e | E | builder-side |
| REQ-085a | C | holds |
| REQ-085b | C | holds |
| REQ-086a | C | holds |
| REQ-086b | C | holds |
| REQ-086c | C | holds |
| REQ-087a | C | finding:F-P7b-4 (P1) |
| REQ-087b | C | finding:F-P7b-4 (P1) |
| REQ-087c | C | finding:F-P7b-4 (P1) |
| REQ-125a | C | finding:F-P7b-4 (P1) |
| REQ-125b | C | finding:F-P7b-4 (P1) |
| REQ-234a | C | finding:F-P7b-5 (P1) |
| REQ-234b | C | finding:F-P7b-5 (P1) |
| REQ-234c | C | finding:F-P7b-5 (P1) |
| REQ-234d | C | finding:F-P7b-5 (P1) |
| REQ-589 | C | holds |


## Chunk P8 — narrative cognition (§5.12, §5.25–§5.27, §5.32–§5.35)

**Closed 2026-11-09.** Increment record:
`docs/plans/2026-11-09-full-review-p8/`.

**Code targets:** `holonovel/src/core/belief.ts` (163 lines),
`core/identity.ts` (373), `core/causal.ts` (133), `core/subjective.ts` (280),
`core/perception.ts` (59), `core/memory.ts` (184), `core/divergence.ts` (431);
handlers `manage_belief` (`index.ts:8234`, dispatching `perception_*` and
`subjective_*`), `manage_identity` (`:8479`), `manage_causality` (`:5820`);
briefing assembly (`:2332-2430`, `:13800-14550`); the §5.12 canonical list
(`:325`) and attestation (`:12295-12300`); the §5.12 disposition derivation
(`scripts/validate.ts:2060-2066`).

**Scope:** §5.12 (84 REQs), §5.25 (12), §5.26 (21), §5.27 (12), §5.32 (8),
§5.33 (7), §5.34 (4), §5.35 (18) — 166 REQs / 113 family rows, 165 bucket C and
one bucket E (`REQ-593`, a whitelisted verifier-harness contract).

### Decisions (2026-11-09, chunk P8)

- **D101 — Chunk scope.** P8 = §5.12 plus §5.25–§5.27 and §5.32–§5.35, one
  increment (Q1). Measured 166 REQs / 113 rows; the worklist's "pending Q1" is
  stale and is corrected here.
- **D102 — Fix policy.** D2/D13/D62 unchanged: P0 in-session, P1 roadmap, P2
  only on a demonstrated failure, P3 record-and-close.
- **D103 — Increment record.** `docs/plans/2026-11-09-full-review-p8/` holds
  plan/tasks/AAR; this worklist carries the P8 tables and D101 onward.
- **D104 — Bucket resolution.** By base family ID from
  `spec/audit/req-coverage.md`: 112 C / 1 E at row level, 165 C / 1 E at header
  level. `REQ-593` is whitelisted by `INTENDED_GAP_REQS` (`scripts/validate.ts:1924`)
  because the recall-probe contract is verifier-harness work.
- **D105 — Boundaries.** §5.12 owned here including REQ-355–365 and
  REQ-366a–d; §5.13–§5.18 stay with closed chunks; §5.33 briefing rendering is
  read for its own predicates only; `core/state.ts` storage mechanics stay
  `Closed-P3`.
- **D106 — Row precedence.** `finding` > `deferred` > `builder-side` > `holds`;
  cluster verdicts are worst-of.
- **D107 — Citation resolution.** D10/D25/D49/D67/D77 method. The reused IDs
  `T408`–`T412` are resolved against the harness whose title matches the
  Appendix F assertion.
- **D108 — Fingerprint consequence.** §5.25/§5.26/§5.27/§5.32 are in
  `DATA_SECTIONS`; no REQ body changed, so no fingerprint regeneration is
  required. No bucket changed, so the coverage register is unchanged.
- **D109 — Baseline.** `check:fast` 37/37 PASS, `check` PASS, `test:all` 56/56
  PASS on a clean tree at `edc7062` with 19 commits unpushed.
- **D110 — Delta amendment.** During Phase 1 the plan's "no canonical §5.12
  list" assumption was refuted: the list is `SECTION_512_REQS` at
  `index.ts:325`. The delta was reviewed (`delta review passed.`) and the
  plan re-stamped.

### P8 cluster verdicts

| Cluster | REQs | Verdict | Evidence |
|---|---|---|---|
| A — narrative architecture (§5.12) | 84 | finding:F-P8-1 (P1) | `index.ts:745-865`, `:14073`; T408–T412; one unsurfaced coupling |
| B — belief and causal integrity (§5.25 + §5.27) | 24 | holds | `core/belief.ts:87-162`, `core/causal.ts:68-129`, `:8684-8760` |
| C — character identity (§5.26) | 21 | holds | `core/identity.ts:216-313`, `:8479-8630`, identity resource `:12395` |
| D — perception and briefing consistency (§5.32 + §5.33) | 15 | holds | `core/perception.ts:31-50`, `:2473-2522`, `:11766-11776` |
| E — compression and subjective memory (§5.34 + §5.35) | 22 | builder-side | `core/memory.ts:40-184`, `core/subjective.ts:94-280`; REQ-593 is the verifier gap |

### P8 behaviour table

| Behaviour | Anchor | Harness | Verdict |
|---|---|---|---|
| §5.12 canonical list, attestation, and register coverage | `index.ts:325`, `:12295-12300`; `validate.ts:2060-2066` | register gate; T406–T417 | holds |
| Scene beat taxonomy and pacing signal | `index.ts:337-345`, `:5849` | T385, T386 | holds |
| Narrative arc visibility and faction autonomy | `index.ts:5849`, `:5879` | T387, T388 | holds |
| NPC goal pursuit and faction-NPC coordination | `index.ts:714-733`, `:14345-14354` | T389, T398 | holds |
| Discovered consequences and consequence-knowledge coupling | `index.ts:925-931` | T390, T399 | holds |
| Player spatial surface and scene description | `index.ts:5830-5849` | T391, T392 | holds |
| Unified intent resolution and voice feedback | `run_command (action: resolve)`; `:14073` | T393, T394 | holds |
| Background knowledge and lore triggering | `index.ts:932-943` | T395, T400 | holds |
| Coherence attestation and voice codex capture | `index.ts:12295-12300`; `manage_codex` `:13359` | T396, T397 | holds |
| Pacing autonomy, codex beats, beat countdowns | `index.ts:680`, `:5864`, `:6158` | T401, T402, T404 | holds |
| Coupling advisories REQ-355–REQ-365 | `index.ts:745-865` | T408–T412 | finding:F-P8-1 (P1) |
| Observer narrative surface REQ-366a–d | `index.ts:14204`, `:14264-14268` | T417 | holds |
| Evidence admissibility, reconciliation, conflicts | `core/belief.ts:87-162`; `manage_belief` | T551–T553 | holds |
| Causal evaluation, admission, ingress | `core/causal.ts:68-129`; `:8684-8760` | T574–T585 | holds |
| Identity staging, acceptance, revert, compile, projection | `core/identity.ts:216-313`; `:8479-8630` | T563–T573, T758–T772 | holds |
| Perception witness provenance and derived attribution | `core/perception.ts:31-50`; `:2473-2522` | T704, T705 | holds |
| Briefing consistency and divergence marker | `:11766-11776`, `:2410-2425`; `core/divergence.ts:335-431` | T620–T626 | holds |
| Compression tiers, pointers, budget, recall | `core/memory.ts:40-184` | T697–T700 | holds |
| Subjective memory record/select/evict/summarise/privacy | `core/subjective.ts:94-280`; `:9275-9430` | T743–T770 | holds |

### P8 findings

- **F-P8-1 — Server-note narrative coupling is stored but never surfaced
  (P1, scheduled).** REQ-365a/b/c require server notes carrying a
  `narrative_tag` to appear in the `badge_briefing` supplementary guidance. The
  tag is accepted and stored (`holonovel/src/index.ts:8095`, `:8145`) and the
  notes resource exists (`:12754`, `:12760`), but the briefing's Supplementary
  guidance section renders only synthesis items (`:14073`); no `serverNotes`
  read occurs anywhere in the briefing builder (`:13800-14550`). The register's
  cited `T416` exercises set/list only (`holonovel/scripts/test-backfill.ts:255`).
  Predicate: `index.ts:14073` + the absent `serverNotes` read in the briefing
  path. Covers REQ-365a, REQ-365b, REQ-365c.
- **F-P8-2 — Duplicate test IDs shadow coverage resolution (P2, scheduled).**
  `T408` titles three different assertions across harnesses
  (`test-narrative.ts:767` coupling advisory, `test-backfill.ts:722` parameter
  ceiling, `test-limits.ts:403` server notes), and `T409`–`T412` likewise appear
  in both `test-narrative.ts:774-813` and `test-backfill.ts:731-821`. The
  register maps `T408`–`T412` to REQ-073, REQ-075, REQ-077, REQ-083, REQ-233,
  REQ-236, REQ-246, REQ-289, REQ-357, REQ-358, REQ-359, REQ-360, and REQ-361, so
  a token-presence match can evidence a REQ with an unrelated assertion. No
  wrong runtime output was demonstrated, so the fix is scheduled, not
  in-session.
- **Observation (P3, closed) — stranded `scripts/validate.ts:1866` comment.**
  The comment names the canonical §5.12 list but sits above `INTENDED_GAP_REQS`;
  the list lives at `holonovel/src/index.ts:325`. The list exists, so the
  comment is mislocated rather than false. Covers REQ-346.

### P8 REQ verdicts (166)

| REQ | Section | Bucket | Verdict | Note |
|---|---|---|---|---|
| REQ-335a | 5.12 | C | holds | T385, T404 |
| REQ-335b | 5.12 | C | holds | T385, T404 |
| REQ-335c | 5.12 | C | holds | T385, T404 |
| REQ-353 | 5.12 | C | holds | T404 |
| REQ-336a | 5.12 | C | holds | T386, T401 |
| REQ-336b | 5.12 | C | holds | T386, T401 |
| REQ-351a | 5.12 | C | holds | T401 |
| REQ-351b | 5.12 | C | holds | T401 |
| REQ-351c | 5.12 | C | holds | T401 |
| REQ-337a | 5.12 | C | holds | T387, T402 |
| REQ-337b | 5.12 | C | holds | T387, T402 |
| REQ-352a | 5.12 | C | holds | T402 |
| REQ-352b | 5.12 | C | holds | T402 |
| REQ-352c | 5.12 | C | holds | T402 |
| REQ-352d | 5.12 | C | holds | T402 |
| REQ-338a | 5.12 | C | holds | T388, T401 |
| REQ-338b | 5.12 | C | holds | T388, T401 |
| REQ-338c | 5.12 | C | holds | T388, T401 |
| REQ-339a | 5.12 | C | holds | T389, T401, T514, T726 |
| REQ-339b | 5.12 | C | holds | T389, T401, T514, T726 |
| REQ-339c | 5.12 | C | holds | T389, T401, T514, T726 |
| REQ-339d | 5.12 | C | holds | T389, T401, T514, T726 |
| REQ-339e | 5.12 | C | holds | T389, T401, T514, T726 |
| REQ-348a | 5.12 | C | holds | T398 |
| REQ-348b | 5.12 | C | holds | T398 |
| REQ-348c | 5.12 | C | holds | T398 |
| REQ-340a | 5.12 | C | holds | T390, T399, T690 |
| REQ-340b | 5.12 | C | holds | T390, T399, T690 |
| REQ-340c | 5.12 | C | holds | T390, T399, T690 |
| REQ-349a | 5.12 | C | holds | T399, T690 |
| REQ-349b | 5.12 | C | holds | T399, T690 |
| REQ-349c | 5.12 | C | holds | T399, T690 |
| REQ-349d | 5.12 | C | holds | T399, T690 |
| REQ-341a | 5.12 | C | holds | T391 |
| REQ-341b | 5.12 | C | holds | T391 |
| REQ-341c | 5.12 | C | holds | T391 |
| REQ-342a | 5.12 | C | holds | T392 |
| REQ-342b | 5.12 | C | holds | T392 |
| REQ-343a | 5.12 | C | holds | T393 |
| REQ-343b | 5.12 | C | holds | T393 |
| REQ-343c | 5.12 | C | holds | T393 |
| REQ-343d | 5.12 | C | holds | T393 |
| REQ-344a | 5.12 | C | holds | T394 |
| REQ-344b | 5.12 | C | holds | T394 |
| REQ-344c | 5.12 | C | holds | T394 |
| REQ-347a | 5.12 | C | holds | T397 |
| REQ-347b | 5.12 | C | holds | T397 |
| REQ-347c | 5.12 | C | holds | T397 |
| REQ-345a | 5.12 | C | holds | T395, T400 |
| REQ-345b | 5.12 | C | holds | T395, T400 |
| REQ-345c | 5.12 | C | holds | T395, T400 |
| REQ-350a | 5.12 | C | holds | T400 |
| REQ-350b | 5.12 | C | holds | T400 |
| REQ-350c | 5.12 | C | holds | T400 |
| REQ-355a | 5.12 | C | holds | T406 |
| REQ-355b | 5.12 | C | holds | T406 |
| REQ-356a | 5.12 | C | holds | T407 |
| REQ-356b | 5.12 | C | holds | T407 |
| REQ-357a | 5.12 | C | holds | T408 |
| REQ-357b | 5.12 | C | holds | T408 |
| REQ-358a | 5.12 | C | holds | T409 |
| REQ-358b | 5.12 | C | holds | T409 |
| REQ-359a | 5.12 | C | holds | T410 |
| REQ-359b | 5.12 | C | holds | T410 |
| REQ-360a | 5.12 | C | holds | T411 |
| REQ-360b | 5.12 | C | holds | T411 |
| REQ-361a | 5.12 | C | holds | T412 |
| REQ-361b | 5.12 | C | holds | T412 |
| REQ-362a | 5.12 | C | holds | T413 |
| REQ-362b | 5.12 | C | holds | T413 |
| REQ-363a | 5.12 | C | holds | T414 |
| REQ-363b | 5.12 | C | holds | T414 |
| REQ-364a | 5.12 | C | holds | T415 |
| REQ-364b | 5.12 | C | holds | T415 |
| REQ-365a | 5.12 | C | finding:F-P8-1 (P1) | T416 (test-backfill) sets/lists a server note; briefing never renders it |
| REQ-365b | 5.12 | C | finding:F-P8-1 (P1) | T416 (test-backfill) sets/lists a server note; briefing never renders it |
| REQ-365c | 5.12 | C | finding:F-P8-1 (P1) | T416 (test-backfill) sets/lists a server note; briefing never renders it |
| REQ-366a | 5.12 | C | holds | T417 |
| REQ-366b | 5.12 | C | holds | T417 |
| REQ-366c | 5.12 | C | holds | T417 |
| REQ-366d | 5.12 | C | holds | T417 |
| REQ-346a1 | 5.12 | C | holds | T396, T403 |
| REQ-346a2 | 5.12 | C | holds | T396, T403 |
| REQ-346b | 5.12 | C | holds | T396, T403 |
| REQ-461 | 5.25 | C | holds | T551 |
| REQ-462 | 5.25 | C | holds | T552 |
| REQ-463 | 5.25 | C | holds | T553 |
| REQ-464 | 5.25 | C | holds | T554 |
| REQ-465 | 5.25 | C | holds | T555, T629 |
| REQ-466 | 5.25 | C | holds | T556 |
| REQ-467 | 5.25 | C | holds | T557 |
| REQ-468 | 5.25 | C | holds | T558, T629 |
| REQ-469 | 5.25 | C | holds | T559 |
| REQ-470 | 5.25 | C | holds | T560 |
| REQ-471 | 5.25 | C | holds | T561 |
| REQ-472 | 5.25 | C | holds | T562 |
| REQ-473 | 5.26 | C | holds | T563, T631, T771 |
| REQ-474 | 5.26 | C | holds | T564 |
| REQ-475 | 5.26 | C | holds | T565 |
| REQ-476 | 5.26 | C | holds | T566 |
| REQ-477 | 5.26 | C | holds | T567 |
| REQ-478 | 5.26 | C | holds | T568 |
| REQ-479 | 5.26 | C | holds | T569, T631 |
| REQ-480 | 5.26 | C | holds | T570, T771 |
| REQ-481 | 5.26 | C | holds | T571 |
| REQ-482 | 5.26 | C | holds | T572 |
| REQ-483 | 5.26 | C | holds | T573 |
| REQ-547 | 5.26 | C | holds | T630 |
| REQ-636 | 5.26 | C | holds | T758 |
| REQ-637 | 5.26 | C | holds | T759 |
| REQ-638 | 5.26 | C | holds | T760 |
| REQ-639 | 5.26 | C | holds | T761 |
| REQ-640 | 5.26 | C | holds | T762 |
| REQ-641 | 5.26 | C | holds | T763 |
| REQ-642 | 5.26 | C | holds | T764 |
| REQ-643 | 5.26 | C | holds | T765, T771 |
| REQ-649 | 5.26 | C | holds | T772 |
| REQ-484 | 5.27 | C | holds | T574 |
| REQ-485 | 5.27 | C | holds | T575 |
| REQ-486 | 5.27 | C | holds | T576 |
| REQ-487 | 5.27 | C | holds | T577 |
| REQ-488 | 5.27 | C | holds | T578 |
| REQ-489 | 5.27 | C | holds | T579 |
| REQ-490 | 5.27 | C | holds | T580 |
| REQ-491 | 5.27 | C | holds | T581 |
| REQ-492 | 5.27 | C | holds | T582 |
| REQ-493 | 5.27 | C | holds | T583 |
| REQ-494 | 5.27 | C | holds | T584 |
| REQ-495 | 5.27 | C | holds | T585 |
| REQ-540 | 5.32 | C | holds | T614 |
| REQ-541 | 5.32 | C | holds | T615 |
| REQ-542 | 5.32 | C | holds | T616, T704 |
| REQ-543 | 5.32 | C | holds | T617 |
| REQ-544 | 5.32 | C | holds | T618 |
| REQ-545 | 5.32 | C | holds | T619, T704 |
| REQ-594 | 5.32 | C | holds | T705 |
| REQ-595 | 5.32 | C | holds | T704 |
| REQ-515 | 5.33 | C | holds | T620 |
| REQ-516 | 5.33 | C | holds | T621 |
| REQ-517 | 5.33 | C | holds | T622 |
| REQ-518 | 5.33 | C | holds | T623 |
| REQ-519 | 5.33 | C | holds | T624 |
| REQ-520 | 5.33 | C | holds | T625 |
| REQ-521 | 5.33 | C | holds | T626 |
| REQ-590 | 5.34 | C | holds | T697 |
| REQ-591 | 5.34 | C | holds | T698 |
| REQ-592 | 5.34 | C | holds | T699 |
| REQ-593 | 5.34 | E | builder-side | verifier harness T700 (test-memory-recall); whitelisted intended gap |
| REQ-623 | 5.35 | C | holds | T743, T753 |
| REQ-624 | 5.35 | C | holds | T743, T744, T753 |
| REQ-625 | 5.35 | C | holds | T744, T754 |
| REQ-626 | 5.35 | C | holds | T745, T755 |
| REQ-627 | 5.35 | C | holds | T746, T757 |
| REQ-628 | 5.35 | C | holds | T747 |
| REQ-629 | 5.35 | C | holds | T748 |
| REQ-630 | 5.35 | C | holds | T749 |
| REQ-631 | 5.35 | C | holds | T750 |
| REQ-632 | 5.35 | C | holds | T751 |
| REQ-633 | 5.35 | C | holds | T752 |
| REQ-634 | 5.35 | C | holds | T755 |
| REQ-635 | 5.35 | C | holds | T756 |
| REQ-644 | 5.35 | C | holds | T766 |
| REQ-645 | 5.35 | C | holds | T767 |
| REQ-646 | 5.35 | C | holds | T768 |
| REQ-647 | 5.35 | C | holds | T769 |
| REQ-648 | 5.35 | C | holds | T770 |

## Delta amendment — M1 closing machine-evidence re-run (2026-11-09, post-P8)

Run after chunk P8's review tables landed; outputs archived under
`/tmp/opencode/sweep-p8/`.

| Command | Exit | Result |
|---|---|---|
| `npm run check:conformance` | 0 | `Bundle-dependent REQs (0):` — PASS, no bundle-dependent REQ |
| `npm run fmea` | 0 | 1311 REQs analysed; 0 high-severity REQs with no detection coverage |
| `npm run graph-deps` | 0 | 1035 orphaned, 126 source-only, 95 sink-only nodes |

Findings: **none new.**

- `check:conformance` is a gate and passed clean; no predicate to confirm.
- `fmea` reports zero high-severity REQs without detection coverage, so it
  corroborates rather than contradicts the chunk verdicts; its Detection
  column restates each REQ's `_Check:_`, so it cannot raise a finding the REQ
  body has not already stated.
- `graph-deps` colours nodes by citation degree; the orphan/source-only counts
  are normal for requirement prose and raise no finding.

The sweep item closes with this run: chunks P1–P8 and both M1 passes are
recorded, and `ROADMAP.md` no longer carries the sweep section.
