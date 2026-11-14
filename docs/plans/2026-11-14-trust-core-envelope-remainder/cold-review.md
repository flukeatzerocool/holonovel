Reviewer: review (cold, single-context staged pass)
Plan sha256: 20142aa1c325735980d0d384a7f6189ac15a9626b3265b9e18375b2d3cbe3af6
Target: /home/fluke/Holonovel/docs/plans/2026-11-14-trust-core-envelope-remainder/plan.md
Evidence: /home/fluke/.local/state/opencode/plans/fe586f0907cda9bed04d391d454275b4a14bc3e300047c43f32dd854d4f08ed4/plan.evidence.json
Standards: plan-review SKILL.md §1–§8 + severity rules; references/spec-project-checks.md
Reads: 34 / 40

# Cold review — trust-core error-envelope remainder

## Isolation note (read this before the verdict)

This dispatch forbade nested subagents, so the five stages ran as five
sequential lenses in **one context** instead of five fresh dispatches. Stage 1
(zoom-out), 2 (comprehension), 3 (design/structural/style critics) and 5
(readiness) each produced findings against the artifact; Stage 4 was not
triggered because no post-Stage-3 edits were made. Findings below are
first-order document findings, not confirmations of prior review text, but the
per-stage context isolation the skill requires was not available — record this
as a limitation of the cold artifact, not as a clean five-dispatch run.

Project instructions (`AGENTS.md`, `holonovel/AGENTS.md`) were injected into
this context mid-session by the host. They were not part of the dispatch and
were used only to check gate names; record as a context-contract Unknown.

## Stage 2 — comprehension (faithful, with gaps)

The plan closes three scheduled review findings. (1) Every tool-level error
result must carry `isError: true`; the fix goes into `err()` and the
`[ERROR]`-producing `raw()` sites in `holonovel/src/index.ts`, and a new
`test-output-contracts` sweep plus a tightened G2 asserts it. (2) An error
result stops advancing the session pacing counter; REQ-336a is amended and
T386c gains a returned-`err()` leg. (3) SDK `-32602` results stay
`{content, isError}` with no structured result, and REQ-548c is rescoped rather
than stretched; T180 asserts `structuredContent === undefined`. (4) Ruleset
lookup entries gain a build-time `badge_scope` (new REQ-210c), and a
`rulesetEntryVisible(entry, badge)` predicate filters the lookup collection,
the enumeration, the hint, search hits and info resolution; T179 asserts it.
(5) Registers, ROADMAP bullet, coverage register, changelog and one commit
close it out. Done means T636/T180/T386c/T179 green, `test:all` green,
`check:fast: PASS`, and the three register rows `Resolved`.

What I could not determine from the document: how a search *hit* yields a
`badge_scope`; whether the search match-count is filtered; whether the
`info` leg is asserted at all (done bar 4 says yes, C6/T179 does not);
which token the new sweep may use, given T636 is taken.

## Blockers

**B1 [design] — C4(b) filters a data structure that carries no `badge_scope`.**

- Artifact: `plan.md:241-244` ("apply it to … (b) the hits returned by the
  `search` case (`:2317-2327`)"), `plan.md:56-59` (done bar 4 requires the
  entry absent from "`search` hits"), `plan.md:270-274` (T179 asserts "`search`
  omits it").
- Predicate: `index.ts:2319` gets `hits` from `rulesets.search(...)`, and
  `rulesets.ts:656-672` returns `RulesetIndexEntry[]` built from `pkg.index`;
  the fields it scores/uses are `id`, `anchor`, `category`, `content`
  (`rulesets.ts:662`). There is no `badge_scope` and no collection key on a
  hit, and `rulesetEntryVisible(entry, badge)` is defined over a *model* entry
  (`plan.md:240-247`).
- Consequence: the search leg of done bar 4 cannot be implemented as written
  without an unstated decision — either extend `index` entries with
  `badge_scope` (a builder-side data-contract change REQ-210c does not cover:
  it scopes Concepts and Entities *model* entries, `plan.md:249-252`), or
  define a hit→model-entry mapping the plan never names. An implementer who
  filters `h.badge_scope` sees `undefined` on every hit, treats it as
  `shared`, and ships a no-op that still passes T179 if T179 never exercises a
  real search. This is the same defect class D5 exists to prevent
  (`plan.md:193-200`).
- What must change: name how a search hit resolves to its entry (or add
  `badge_scope` to the index contract in REQ-210c/REQ-210d); state the
  post-filter empty-result behaviour (does an all-filtered result become
  `[NOT_FOUND]`?); and state the expected `max_results` behaviour when
  filtering runs after the library's slice (`rulesets.ts:672`).

## Majors

**M1 [design] — T636 is already in use; the new sweep collides.**

- Artifact: `plan.md:39-45`, `plan.md:264`.
- Predicate: `holonovel/scripts/test-lean-narrator.ts:121`
  (`"REQ-067d T636 task-map intent routing"`) and its header
  (`test-lean-narrator.ts:8`). The plan also cites T636 as F-P1-14's
  exercising test in the register (`plan.md:277-279`).
- Consequence: two harnesses claim T636; the register and coverage register
  would resolve F-P1-14 to a REQ-067d assertion. Must pick an unused token and
  confirm Appendix F / the coverage register carry it.

**M2 [design] — the `isError` premise misidentifies the producers, and D1's
collapse is not behaviour-preserving.**

- Artifact: `plan.md:83-86` ("`refusalResult` is the only `isError`-adding
  helper … used three times"; "`guardToolCall` builds its own … object
  (`index.ts:1951-1969`)"), `plan.md:163-168` (D1), `plan.md:222-226` (C1).
- Predicate: `isError` producers in `index.ts` are `dispatcherRefusal`
  (`:1956-1967`, called at `:1984`, `:2000`), `refusalResult` (`:3257-3259`,
  exactly **two** call sites — `:282` and `:1992`), the `GuardRefusal` type
  (`:1951`), and two façade literals (`:17714`, `:17721`). The hand-built
  object the plan attributes to `guardToolCall` is built by
  `dispatcherRefusal`.
- Consequence: `dispatcherRefusal`'s documented contract is that the refusal
  "keeps its exact text and gains a structured result" (`index.ts:1953-1955`),
  while `err()` rebuilds the text and appends its own `Corrective action:`
  line (`index.ts:3232-3234`). Collapsing it onto `err()` (D1) changes the
  envelope text, which T180b/REQ-548c assert. C1 must either drop
  `dispatcherRefusal` from the collapse (narrowing only the `GuardRefusal`
  type) or state exactly how text preservation is maintained.

**M3 [design] — Appendix F's T179 definition is not reconciled.**

- Artifact: `plan.md:141-145` and `plan.md:270-274`.
- Predicate: `appendices-reference.md:1677` defines T179 as
  "`lookup_spell` with a GM-only spell name — assert `[NOT_FOUND]` with only
  player-visible spell names", bound to REQ-002c; `02-requirements.md:115`
  binds REQ-002c2's `_Check:_ T179`. The plan re-homes T179 onto a synthetic
  `lookup_thing`/`things` package asserting the **success path**, enumeration,
  hint, search and GM visibility.
- Consequence: after the increment the spec's test catalogue describes a
  different test than the harness runs. `appendices-reference.md` is already a
  target file (for the REQ index row), so the reconciliation is cheap but must
  be a named step.

**M4 [design] — the §5 map edit contradicts the map's own granularity.**

- Artifact: `plan.md:62-63` (done bar 5: "the §5 map … carry the new row"),
  `plan.md:253-255` (C5: "Add the §5 map row (`:588` neighbourhood)").
- Predicate: `02-requirements.md:588` is `| REQ-210 | builder-side — Discovery
  output |`; the map is family-level, and no table row in that file begins
  with a suffixed ID (`grep '^\| REQ-[0-9]+[a-z] \|'` → 0 matches). REQ-210 is
  already mapped.
- Consequence: adding a `REQ-210c` row introduces the only sub-REQ row in the
  map and works against the validator's section-map coverage check. Drop the
  edit, or restate it as "confirm the existing REQ-210 row covers the new
  sub-REQ".

**M5 [structural] — verification commands do not exist.**

- Artifact: `plan.md:367` (`npm run check:registers`, `npm run check:roadmap`,
  `npm run check:loop-artifacts`) versus `plan.md:71`, which uses the correct
  hyphenated names.
- Predicate: `package.json:26` `check-roadmap`, `:30` `check-registers`, `:80`
  `check-loop-artifacts`; no colon variants are defined.
- Consequence: the verification table as written fails with "missing script",
  so done bar 7 and 6 are not observable through it.

**M6 [design] — a second search surface is not in the blast radius.**

- Artifact: `plan.md:193-200` (D5's "the leak survives" reasoning),
  `plan.md:239-247` (C4 enumerates lookup/enumeration/hint/`search`/`info`).
- Predicate: `index.ts:13611-13637` is `manage_ruleset (action: search)`, which
  calls the same `rulesets.search` (`:13625`, `:13627`) and renders each hit
  with its `content` (`:13635`) with no badge check visible in the action body.
- Consequence: if that action is reachable under a Player badge, D5's argument
  applies to it verbatim and the "invisible surface" (REQ-445) still leaks
  through a different tool. Name the decision (filter it, or record why the
  action is GM-gated). See U2.

**M7 [design] — the `info` leg of done bar 4 has no assertion.**

- Artifact: `plan.md:56-58` (absent from "… `info` resolution") versus
  `plan.md:270-273` (T179 asserts lookup, enumeration, hint, `search`, GM
  visibility — no `info`).
- Predicate: the `info` resolution scan is `index.ts:2384-2397`; C4(c) filters
  it, but nothing in C6 exercises it.
- Consequence: an implementation that omits the C4(c) filter still passes
  every named test, so done bar 4 is unverified for one of its five surfaces.

**M8 [design] — the search match-count is unfiltered.**

- Artifact: `plan.md:242-243` (C4(b) covers "the hits"), `plan.md:56-57`.
- Predicate: `index.ts:2320-2324` returns
  `raw(truncateOutput(toolName, body + countReport(hits.length, total)))`
  where `total` comes from a second, unfiltered
  `rulesets.search(slug, q, 100000)` (`:2323`); the same pattern exists at
  `:13622`/`:13627`.
- Consequence: even with hits filtered, "N of M matches" discloses the
  existence and count of GM-only matches — exactly the side channel REQ-445
  forbids. Either filter the total or state that counts are deliberately
  unfiltered and why.

## Minors

- **n1 [clarity]** `plan.md:170-175` (D2) rejects "preserving today's split …
  with a hidden marker — that encodes an undocumented inconsistency", but the
  split is documented in the code comment at `index.ts:305-308` ("a refusal
  envelope still completes … `isError` results … do not advance the counter").
  Reword the rejected alternative; the chosen direction is still sound.
- **n2 [design]** `plan.md:222-226` says `err()` "adds `isError: true`" while
  narrowing `GuardRefusal` (`index.ts:1951`) to the return type; the type
  requires the literal `true`, so the field needs `as const` (as
  `refusalResult` does at `:3258`). `typecheck` will catch it, but C1 should
  say so.
- **n3 [clarity]** C2 (`plan.md:228-232`) says "record the post-edit char and
  sentence count" while C5 (`plan.md:256-258`) already states the expected
  numbers; pick one convention so the implementer knows whether ~660 is a
  prediction or a measurement.
- **n4 [clarity]** `plan.md:266-268` argues T636 is not a duplicate of G2 by
  describing G2 as sampling "one call per tool"; G2 samples a fixed four-call
  list (`test-output-contracts.ts:770-775`). The argument still holds (G2
  accepts any bracketed envelope at `:783`), but the premise is wrong.
- **n5 [clarity]** `plan.md:81-82` names the `return err(` enumeration command
  but only "a `raw(`-site regex" for the ten `[ERROR]` sites. Per the
  count-claim rule, name the exact command for both.

## Unknowns

- **U1** The 470 `return err(` and 10 `raw()` `[ERROR]` site counts were not
  independently reproduced (budget). The grep shell was denied in this
  dispatch; the plan names the command, so the claim is auditable but
  unverified here.
- **U2** Whether `manage_ruleset (action: search)` (`index.ts:13611-13637`) is
  badge-gated by a wrapper or annotation outside the action body. If it is
  GM-only, M6 downgrades to a recorded decision.
- **U3** Whether any harness asserts a returned `err()` result lacks
  `isError`. The `isError` scan of `holonovel/scripts` showed only
  T178/T180/T180b assertions, success-path `!isError` checks, and
  `test-engine-facade.ts:162` (which expects `isError === true`); the result
  list was truncated at 45 matches, so this is not proven.
- **U4** Whether `-32602` genuinely yields `structuredContent === undefined`
  once output schemas are declared. The plan defers this to the step-0 probe
  (`plan.md:309-314`), which is the right control; this pass could not run it.
- **U5** Whether making `badge_scope` a required Concept/Entity field leaves
  the reference fixture and emitter untouched. The plan asserts
  verify-no-change (`plan.md:302-305`) on the grounds that the fixture's
  `concepts`/`entities` maps are empty; the fixture was not read here beyond
  `test-ruleset-nonovel.ts:59-67`.
- **U6** Whether `scripts/lib/contract-fingerprint.ts` excludes §5.1/§5.2/§5.5
  as claimed (`plan.md:149-151`). The AGENTS.md fingerprinted set agrees, but
  the file itself was not read.

## Severity summary

- Blockers: 1 (B1)
- Majors: 8 (M1–M8)
- Minors: 5 (n1–n5)
- Unknowns: 6 (U1–U6)

`independent-review FAILED. stages 5/5`
