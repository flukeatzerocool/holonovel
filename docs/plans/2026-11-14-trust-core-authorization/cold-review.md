# Cold review — 2026-11-14-trust-core-authorization

Reviewer: `review` subagent, cold stage dispatch (fresh context; one context ran
stages 1–5 sequentially — nesting to five separate dispatches was not permitted)
Plan sha256 reviewed: `cd49ce9aaf7e22312d0feacfbea78be5751bbd0054f710330c45c92f817d0b9b`
Artifact: `docs/plans/2026-11-14-trust-core-authorization/plan.md`
HEAD: `2ee0724` · Budget used: 26 of 40 read/grep calls
Verdict: **FAILED** — 2 Blockers, 8 Majors, 5 Nits.

## Stage 1 — Zoom out

The document holds together structurally: objective, premises, nine decisions,
four change entries, blast radius, dependency order, edge cases, verification,
user impact. Line citations are consistently within a few lines of the code they
name. Three clusters of internal inconsistency surfaced (B1, B2, M4, M5, M7),
plus one over-claimed design premise (M1).

## Stage 2 — Comprehension (artifact only)

**What and why.** A committed surface registry classifies all 299
`${tool}.${action}` keys. The plan adds a pure classifier (`core/badge-gate.ts`)
that turns `mutation_class: "read"` plus an explicit deny set into an Observer
permission rule, and installs that rule at the dispatcher (`guardToolCall`) and
on `tools/list`, `prompts/list`, and `resources/list`, so the active badge gates
the call path and the three metadata surfaces. It closes F-P1-7/8/9 and writes
the contract as new REQ-032c.

**Ordered steps.** (1) Scratch probe enumerates the read actions, settles the
deny set, records list baselines, greps sibling citations. (2) Red classifier
unit test, module + barrel export. (3) Dispatcher gate with its own boundary
audit, then the list filters. (4) Spec contract and appendix rows. (5) Full
harness sweep with anchor repoints. (6) Registers, roadmap, coverage, changelog.
(7) Gates, then one `session:close` commit.

**Done.** Eight bar items: refusal + audit, Observer `tools/list`, filtered
`prompts/list` + `run_workflow`, filtered `resources/list`, REQ-032c, register
rows and roadmap, `test:all` + `check:fast`, one commit.

**Could not determine.** What "permitted action" means for a tool with no
registry action (package tools; bare keys `open_session`/`close_session`), and
what is observably different about `prompts/list` when the prompt gate map is
empty.

Verdict: **faithful-with-gaps** — the gaps are the Blockers below, not a garbled
paraphrase.

## Stage 3 — Critics

### Blockers

**B1 — [design] The prompt gate ships empty, yet claims an assertion and
contradicts REQ-032a's "strict subset".** Done bar 3 claimed an asserted Player
subset while D5 conceded the gate map is empty. REQ-032a is normative and
stricter; T151/T349 assert neither `prompts/list` membership. The `prompts/get`
refusal branch was unreachable dead code.

**B2 — [design] D4 and D5 gave two different rules for package tools on
`tools/list`, and the specified signature cannot implement D4.** D4 made an
unregistered read-only package tool Observer-visible; D5 required "a permitted
action", which an unregistered tool cannot hold. `toolObserverVisible(registry,
name)` had no annotation parameter and the call site passed only `tool.name`, so
a lookup tool would be callable but unlisted.

### Majors

- **M1 — "one classification source" is an over-claim.** Registry class, deny
  set, prompt map, and resource map are four sources; two lived host-side.
- **M2 — the fail-open degradation was not bounded in the done bar.** A missing
  registry leaves the gate inert with no stated backstop and no degraded-path
  assertion.
- **M3 — the probe tested only over-admission.** Nothing checked whether an
  `idempotent` action is state-reading, so a legitimate read could vanish.
- **M4 — roadmap bullet arithmetic contradicted itself** ("bullet 2"/"bullet 3"
  against a two-bullet section).
- **M5 — the refusal text was specified twice, differently** (C4 cited REQ-032a
  while D6 kept the handler wording).
- **M6 — bare-key registry entries were never addressed**; `close_session`
  (write) refusal breaks the documented session path with no assertion.
- **M7 — `DECISIONS.md` was edited by a decision but declared unchanged** and
  absent from the blast radius.
- **M8 — `run_workflow` categories may still leak** if the filter runs after
  `runWorkflowCategories`.

### Nits

N1 line-citation drift (GM_ONLY_TOOLS `:338`, PLAYER_ONLY `:339`, toolGate
`:340-344`, guardToolCall to `:2005`, spec://build refusal `:15556`, prompt
wrapper to `:18035`). N2 REQ-032a is seven sentences, not five. N3 evidence
sha256 predates the amendments. N4 "142 GM checks" is a `requireGM(` occurrence
count. N5 pagination-ordering claim uncited.

## Stage 4 — Re-zoom

Not run: the cold stage had no edit capability.

## Stage 5 — Readiness

Verified: `auditForbidden(badge, tool, args)` exists with `violation_type:
"boundary"` and the `[BOUNDARY_VIOLATION]` prefix (`core/state.ts:2350-2366`);
the handler refusal strings (`:1213-1216`); `badge-gate.ts` absent and every
other target present; REQ-032c free; §5.5 map row already covers base 032;
Appendix index append point after `REQ-032b`; T16 runs under GM and T104 reads
without listing, so done bar 4 is achievable; registry counts consistent, read
= 91.

Missing: the classifier's type boundary across the server-free module; the list
rule and call-site change for B2; the bare-key rule for M6.

## Resolution (post-review amendment)

All two Blockers, eight Majors, and five Nits are resolved in plan revision v2:
B1 narrows the prompt rule to a declared gate with a unit-tested synthetic
declaration and removes the strict-subset claim; B2 unifies the predicate on the
tool object with an annotation parameter and names the `:17900` call-site edit;
M1 moves both maps into `badge-gate.ts`; M2 states the handler-guard backstop
and unit-tests the registry-absent path; M3 adds the inverse sweep; M4 renumbers
to "first/second bullet"; M5 has C4 cite the D6 wording; M6 adds the bare-key
fallback, the `close_session` assertion, and the SDK seam probe; M7 adds the
DECISIONS row and removes it from verify-no-change; M8 filters before
`runWorkflowCategories`; N1–N5 are corrected.

Diff re-review verdict: FAILED (2 Blockers, 1 Major, 2 Nits) — the second
`toolsVisibleToBadge` call site at `index.ts:1878` was unnamed, the pure prompt
helper the B1 fix claimed did not exist, the REQ-032a reading had no DECISIONS
record, the pagination citation was missing, and "not registered" was
ambiguous between `toolRegistry` and the surface registry. Revision v3 resolves
each: both call sites and the annotation source are named in C3(a); the module
exports `promptAllowed`/`promptRefusalFor`/`resourceAllowed` over a supplied
gate map; `DECISIONS.md` records the REQ-032a reading beside the Observer
derivation; the pagination ordering is cited; and the dispatcher skip is
explicitly `toolRegistry`. The standard-depth re-review cap is reached, so v3 is
escalated rather than re-audited a third time.
