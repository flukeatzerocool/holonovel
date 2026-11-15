# Cold plan review — §7.3a prompt-construction record and P60 vocabulary

**independent-review passed.**

Plan sha256: d8127d6666a49d6578d45ebca45f6fa20d5e1d2f11ecfe45b211b50efca0cf41

Plan artifact: `docs/plans/2026-11-15-prompt-construction-p60-vocabulary/plan.md` ·
sha256 recorded in `plan.cold/attestation.txt` (artifact revised after this pass;
see Fix log) · Evidence sidecar:
`…/fe586f0907cda9bed04d391d454275b4a14bc3e300047c43f32dd854d4f08ed4/plan.evidence.md` ·
bound to a **different** plan revision (see M1)
Repo HEAD verified: `f73a72c` · Gate depth: standard · Blockers: 0 · Majors: 5

## Stage 1 — completeness and executable specificity

Complete and executable. Files, functions, insertion points, commands, red/green
states, and a per-criterion done bar are present. Error-gate dry run is explicit
(`plan.md:193-196` in the reviewed revision), not conditional. The self-test's
red/green is specified.

- Minor m4: the Phase 2 anchor did not exist. "after the `### Scene` line"; the
  nearest anchor is `**Scene:**` at `holonovel/src/index.ts:1260`. No `### Scene`
  heading exists in `composeNarrationClearance` (`:1254-1317`).
- Minor m6: done-bar 4's proof was vacuous as written — a file-wide
  `grep -c 'index.ts:' holonovel/DECISIONS.md` can pass without the new section
  naming four predicates.
- Nit n1: "no two steps touch one file" contradicted
  `spec/appendices-reference.md`, edited in Phase 2 and again in Phase 4.
- Nit n3: two different dry-run commands of record.
- Minor m8: the artifact recorded "draft v1 (self pass pending)", so this cold
  pass preceded the §8 self pass. §8 orders self then cold.

## Stage 2 — scope and blast radius

Blast-radius table was complete: every file named in a phase or decision
appeared in it, with a reasoned not-touched list. Spec-project hard checks
passed: register coupling was same-step, fingerprint regeneration was named, and
D4 avoided the spec-addition blast radius by amending an existing REQ instead of
adding one.

- **Major M1** — the evidence sidecar was not bound to the reviewed artifact
  (`Plan sha256: ca26b2b3…`, 309 lines, vs the artifact's 317 lines). EV1/EV2
  therefore described an earlier draft. Every `file:line` predicate was
  re-verified against the tree, so the review did not stop, but the sidecar
  could not be cited as the plan's evidence base without re-running `preflight`.
- **Major M4** — no sibling-contract check for the `narrate` prompt, though
  `holonovel/AGENTS.md` names REQ-023a, REQ-078a, REQ-138, REQ-389c and REQ-598
  as its owners.
- **Major M5** — the done bar and D3 were in tension about clause 4 (anti-slop):
  the plan recorded that "weighted above conversational context" is a host
  obligation, while done bar 3 claimed a `file:line` for four *satisfied*
  clauses.
- Minor m7: retargeting P60 to `Session → Session` makes it archetype-identical
  to P59 (`:499`); the plan did not state whether that is permitted.

## Stage 3 — factual verification at HEAD `f73a72c`

Verified correct: §7.3a's four clauses and the builder duty
(`spec/04-runtime.md:76-105`); P59/P60 rows (`:499-500`); `TTRPG_SURFACE_PROFILE`
(`:137`); the `[non-property]` P60 coupling row (`:620`); archetype and
pattern-rule tables (`:414-427`, `:439-501`); composite token at P17 (`:457`);
symmetric `↔` at P24 (`:464`); `VALID_ARCHETYPES` (`scripts/validate.ts:1051`);
alias map (`:1054-1068`); property-table consultation (`:1090`);
`resolveArchetypes` (`:1101-1107`); pattern parse and `+` split (`:1136-1163`);
`[non-property]` skip (`:1181`); single call site (`:2532`); `main()` at module
load (`:2710`); self-test harness imports (`scripts/test-req-checks.ts:7-11`);
REQ-598 body (`spec/02-requirements.md:1474-1475`); register rows
(`spec/audit/review-register.md:2725-2744`); `ROADMAP.md:78-91`; Appendix F last
row T787 and free T788 (`spec/appendices-reference.md:2139`); T420/T421/T434
(`:1881`, `:1882`, `:1895`); `composeNarrationClearance`
(`holonovel/src/index.ts:1254-1317`); voice profiles (`:1305-1313`); narration
contract (`:1299-1300`); anti-slop injection (`:17884-17887`); `antiSlopFor`
(`:3775`); `manage_scene` schema (`:7864`) and registration (`:7895`);
`applyPromptBudget` (`:3805-3827`); `NEVER_TRUNCATED` (`:3798`); DECISIONS
section style (`holonovel/DECISIONS.md:30-41`).

Incorrect citations, all Minor and none load-bearing: register row offsets
(F-U3-3 is `:2734-2738`, F-U3-4 `:2739-2744`); the archetype-definition
sentence (`spec/04-runtime.md:327-329`, not `:322-324`); three
`holonovel/src/index.ts` ranges (`:1215-1242`, `:1305-1313`, `:3775`); and
§7.7.1b's duty text (`:649-657`).

## Stage 4 — dependency order and edge cases

Order is sound: Phase 1 red precedes the retarget; Phase 4 depends on 1–3;
Phase 5 last. Parallelism was stated. Failure modes were specific with
mitigations.

- **Major M3** — the harness gate the done bar depends on was not reconciled
  before the first run. `applyPromptBudget` keeps sections in document order
  with no priority registry (`holonovel/src/index.ts:3805-3827`) and
  `**Play loop:**` is never truncated (`:3798`), so T640's survival likely
  holds — but T640 also asserts a lower-priority section *is* truncated
  (`holonovel/scripts/test-lean-narrator.ts:156-164`). The plan named the risk
  and mitigated by running the whole suite; it did not measure budget headroom
  before inserting a new early section.
- m5: the helper's planned resolution set (`valid` + `aliases`) is narrower than
  `resolveArchetypes`, which resolves property-group names first
  (`scripts/validate.ts:1101-1107`). A pattern rule naming a property group
  would be newly flagged.
- Nit n4: the predicate reports `ERROR` on a token that makes a rule
  unmatchable, while the new §7.7.1b sentence sits among duties that speak of
  coupling rows; the sentence must clearly extend the duty to tokens.

## Stage 5 — verification and done-bar satisfiability

Done bar was satisfiable and each item named a command. Red/green is real:
`Surface` is the only token outside `VALID_ARCHETYPES` + aliases across P1–P61
(`spec/04-runtime.md:439-501`), so the predicate has exactly the claimed red
state. T788 is a free ID.

- **Major M2** — REQ-598's character-count compliance was not recorded. The
  spec caps a REQ body at 800 characters (`scripts/validate.ts:191-196`,
  measured over `extractReqBodies`), and the plan recorded only the 8-sentence
  cap. The current block reads close to the limit, and whether
  `extractReqBodies` slices at `*Acceptance criterion:*` was unresolved.

## Deferred

- EV1/EV2 (clean tree, 94 unpushed commits, 41/41 fast gate) were not re-run; a
  cold pass does not execute gates.
- Whether any shipped ruleset package composes its own `narrate` prompt —
  unresolved in the reviewed revision; the revised plan adds a Phase 0 probe.
- Whether `extractReqBodies` counts `*Acceptance criterion:*` toward the
  800-character cap — resolved by the author after this pass: it does
  (795 characters measured on the full body, so the cap applies to it).
- Whether §7.7.0/REQ-370a forbids two pattern rules sharing one archetype pair —
  resolved by the author after this pass: it does not; the validator keys on
  rule names (`scripts/validate.ts:1169-1200`), and D1 states the judgement.

## Fix log (author, after this pass)

| Finding | Fix in the revised artifact |
|---|---|
| M1 | `preflight` re-run against the final artifact; sidecar regenerated. |
| M2 | EV21 measures REQ-598's body at 795/800; D4 replaces the amendment with a new `REQ-598a`, and the blast radius gains the Appendix E row. |
| M3 | Phase 0 step 3 measures the `narrate` prompt's truncation slack before the composer edit; Phase 5 names T640 explicitly. |
| M4 | Phase 0 step 2 is a sibling-contract grep over the `narrate` prompt's REQ owners, recorded in `tasks.md`. |
| M5 | Done bar 4 and D7 state the anti-slop ordering as a host obligation; the record claims only the server-side half. |
| m1–m3, n2 | Citations corrected to `:2734-2738`/`:2739-2744`, `:327-329`, `:1215-1242`/`:1305-1313`/`:3775`, and `:649-657`. |
| m4 | Phase 2 anchors on the `**Scene:**` line (`holonovel/src/index.ts:1260`). |
| m5 | D2 states pattern rules carry archetype tokens only and cites the EV6 enumeration. |
| m6 | Done bar 4 scopes the grep to the new section. |
| m7 | D1 records that archetype-identical rules are permitted. |
| m8 | Status line records the self pass, then this cold pass. |
| n1 | "Ordering and parallel work" names the `spec/appendices-reference.md` sequential touch. |
| n3 | One dry-run command of record (`grep -B2 -A2 'outside the §7.7.0 vocabulary'`). |
| n4 | The §7.7.1b sentence explicitly extends the duty from coupling rows to pattern-rule tokens. |

Reads used: 40 of 40 (37 substantive; 2 shell invocations denied by the
read-only allowlist and contributing nothing). No repository-wide glob or sweep.
