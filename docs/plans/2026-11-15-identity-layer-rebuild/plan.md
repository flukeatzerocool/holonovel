# Plan — Identity-layer rebuild (mission, goals, audiences, north star)

Status: draft v3 (cold pass) · Kind: planned · Depth: standard
Increment target: `docs/plans/2026-11-15-identity-layer-rebuild/`
Rollback cost: 1 (one reversible commit; `git revert` and re-run the gates)
Evidence class: repo (`file:line` reads at HEAD) plus four `user` decisions
recorded in this session. No web.
Trust boundary: repository reads and the maintainer's rulings only.
Review independence: self pass in this plan; cold pass report recorded beside it
before the gate stamp.

## Execution delta (recorded during the build)

- **D-1 — B0 became a post-edit confirmation.** The seven-artifact set was already
  enumerated by the cold review, so measuring before the edit could not change
  anything. The gates were re-run after the edit and each stale artifact was
  repaired; the `tasks.md` table records the measured set.
- **D-2 — the declaration values changed after B0b.** `group: "lookup"` and
  `mutation_class: "write"`, matching `manage_lore.export`. `read` would have let
  a Player through the GM-only read exception at `badge-gate.ts`; `write` keeps
  the Player out and matches the sibling export action. D6's `author`/`read`
  values were wrong.
- **D-3 — the round trip is determinism plus completeness.** `manage_codex
  (action: import)` is codex → Novel by contract (REQ-321b), so there is no
  codex → codex round trip. The assertion proves byte-identical repeat exports,
  full payload, kind filter, unknown-id refusal, and the Player refusal. The
  return path is B3, now scheduled on `ROADMAP.md`.
- **D-4 — REQ-660 split.** The 800-character body limit could not carry both the
  parity claim and the action contract, so **REQ-321o** owns the export action and
  REQ-660 owns parity. Both cite T792; the Appendix F row names both.
- **D-5 — four more artifacts than the plan listed.** `g7-attestation.ts` (whole-
  spec hash), `content/torre-nosferatu.json` (starter freshness), the
  `holosuite-conformance.ts` predicate anchor (code motion), and
  `spec/build-phase-map.md` (content hash). Each was repaired by its own
  generator; none needed a plan change.
- **D-6 — B3 deferred, not shipped.** The artifact-kind experiment would need
  REQ-620/621 edits plus a second catalogue regeneration; the one-way export is
  useful on its own, so the return path is scheduled with a `**Trigger:**`.

## Resolutions (self pass → v2)

- **S-1 — the new action had no implementation step.** `REQ-660` is a
  server-runtime requirement, and `HOLONOVEL_IMPL_STRICT=1` (exported by the push
  pipeline) promotes an unevidenced server-runtime REQ to an error. B1a now
  implements `manage_codex (action: export)` in `holonovel/src/index.ts` with a
  harness test, so the coverage register row points at a real site.
- **S-2 — a surface change moves the version and the fingerprints.** A new
  action is a tool-surface change: `REQ-107a` advances the CalVer across
  `package.json`, `holonovel/package.json`, the lockfile, `server.json`, and
  `index.ts` together, and `holonovel/src/generated/contract-fingerprints.ts` is
  regenerated. B5 and B6 now carry both.
- **S-3 — REQ-660 lands in a fingerprinted section.** The codex contract sits in
  §5.6 (`spec/02-requirements.md:1489`), and §5.6 is a data-format fingerprint
  component, so the REQ body is not a prose-only edit. B6 names
  `npm run build-order`; `check-fingerprint-sync` fails otherwise.
- **S-4 — the Quick Reference contradicts the new mission.** Its first sentence
  still says "builds the server" and lists "18 handoff verification steps". A1
  reconciles the opening with host + package; A5 keeps its count honest.
- **S-5 — SR-7 and SR-8 were left with no terminal disposition.** Both are small
  and belong in Phase A: A6 registers *Holodeck* and *holonovel* in §4; A7
  defines "responds with intent" in the north star. Neither is deferred.
- **S-6 — the plan carried no `**Resolves:**` coverage.** Added below; every
  review ID from the session report has an entry or an explicit no-action note.

## Resolutions (cold pass → v3)

The cold report is `plan.cold/report.md`. Dispositions, in its ID order:

- **IR-01 — the action declaration was missing.** B1a now names
  `holonovel/tool-surface-registry.json` and fixes the eight T.3 declaration
  values. The badge seam is explicit: `mutation_class: "read"` alone would let a
  Player through `badge-gate.ts`, so the plan adopts whatever mechanism
  `list`/`get` already use (registry gate list or `MUTATING_READ_ACTIONS`),
  decided by B0b's read of `badge-gate.ts` and `audit-gate.ts`.
- **IR-02 — two commits had no mechanism, and the AAR gate forbids them.**
  D9 is reversed: this is **one commit** (a spec increment stays one commit;
  `session:close` is the only gated close path). The work is still two phases and
  the AAR still covers both. IR-10 (generated `holonovel.md` in both commits)
  disappears with the split.
- **IR-03 — the harness was a placeholder.** B1a names
  `holonovel/scripts/test-output-contracts.ts` (31 existing `manage_codex`
  references) and the `test:output-contracts` script; the new assertion joins the
  existing codex round-trip block, so no `holonovel/package.json` change is
  needed and `test:all` picks it up on its next run.
- **IR-04 — placement was self-contradictory.** B1 states §5.6 only. The
  Editor-badge contract is §5.5 and the exchange contracts are §5.7; only §5.6 is
  a data-format fingerprint component, which is why B6 exists.
- **IR-05(a) — accepted.** EV9's second citation is REQ-321m1 at
  `spec/02-requirements.md:2293`, not a non-existent "REQ-321o".
- **IR-05(b) — rejected with evidence.** The gate exists:
  `scripts/test-spec-tooling.ts:378` is
  `check(/Appendix V \(Workflow Runbooks\)/.test(readingGuide), …)`. The
  reviewer's literal grep could not match the escaped regex and the cited line
  396 belonged to a different assertion, so its "does not exist" claim is wrong.
  EV17's line number is corrected from `:396` to `:378`.
- **IR-06 — the evidence mechanism is now named.** B1a requires the `REQ-660`
  citation at the implementation site in `holonovel/src/index.ts` and in the
  harness; B1 places the REQ in §5.6 beside REQ-321a–321n, where the codex
  contracts and their classification live.
- **IR-07 — B3's condition was pre-decided.** The artifact set is now stated up
  front (seven files), and B3's condition depends on something B0 can still
  measure: whether a fourth artifact kind needs a second catalogue regeneration.
- **IR-08 — two surface artifacts were missing.** `spec/audit/tool-surface-replay.json`
  (`surface-replay -- --write`) and `spec/audit/action-conflicts-baseline.json`
  (`action-conflicts`, both modes) are now targets with refresh steps.
- **IR-09 — the REQ-321l boundary is now stated.** B2 keeps REQ-321l unchanged
  and says the codex export is a distinct surface; the done bar carries it.
- **IR-11 — the done bar invented a stricter LOOP rule.** Restated as "every
  finding carries a terminal disposition; `LOOP PAUSED`".
- **IR-12 — gate classification decided.** B0b confirms whether `manage_codex`
  already holds a REQ-137a row and records the answer; the blast radius says
  "recorded, not assumed".
- **IR-13 — the B0 table was pre-filled.** Every gate attribution is now blank
  until measured; the wrong `check-tool-surface` attribution is gone.
- **IR-14 — the version escape hatch is removed.** B5 advances the CalVer, full
  stop.
- **IR-15 — REQ-660's length discipline is stated.** B1 requires one paragraph,
  at most eight sentences, at most 800 characters, and says which clause is cut
  first if it overruns.
- **IR-16 — dispositions now have a home.** SR-10's record-and-close is a dated
  AAR note; any finding that does not resolve in-increment goes to
  `spec/audit/review-register.md` with a terminal disposition.
- **IR-19 — Q5 rephrased** to "the recorded surface baseline regenerated".
  (Applied in v4; the v3 disposition claimed this before the text carried it.)

## Resolutions (re-review → v4)

The diff re-review found one surviving Blocker and four Majors. Standard-depth
re-review cap reached; these are condition-level amendments and are verified by
`build-review`, not by a third cold pass.

- **B-1 — D6 recreated the second commit.** D6 now says the artifact kind ships
  within the same commit. Caught at `plan.md:184`, the one line the D9 reversal
  missed.
- **M-1 — IR-19's disposition was false.** Q5 now says "the recorded surface
  baseline regenerated", and the IR-19 entry records that the v3 text did not
  carry it.
- **M-2 — "the eight commands in C3" was stale.** Replaced with the C1 → C2 → C3
  sequence.
- **M-3 — "eleven edits" listed four.** Now "four edits".
- **M-4 — B3's condition was attributed to a measurement B0 does not make.** B3
  is now its own experiment: add the kind row, re-run the catalogue gates, keep
  only if it forces no regeneration beyond the seven artifacts, else revert and
  schedule. D6 no longer cites B0 for it.
- **M-5 — `action-conflicts-baseline.json` is not regenerable.** The blast radius
  now says it is hand-edited with a disposition row when `--check` reports a
  collision; `scripts/action-conflicts.ts:137` is the reason.
- **Nits applied:** Appendix F named "catalogue row" throughout; the B1
  classification sentence now names §5.6 and REQ-321a–321n instead of pointing
  at itself.

## Resolves

| Review ID | Finding | Resolved by |
|---|---|---|
| SR-1 | North star scope contradicted by the same section and REQ-077c | A1 (Mission, North star, The test) |
| SR-2 | Full-rebuild clause contradicts §6.7 | A2 |
| SR-3 | No goals statement; out-of-scope boundary outside the spec | A1 (Goals, Non-goals) |
| SR-4 | No audience statement; two incompatible audience models | A1, A4 |
| SR-5 | Mission's server framing contradicts the package model | A1 (The specification is the source) |
| SR-6 | Mission carries §6 lifecycle mechanics | A2 |
| SR-7 | *Holodeck* and *holonovel* unregistered in §4 | A6 |
| SR-8 | "The cast responds with intent" undefined | A7 |
| SR-9 | "18 handoff verification steps" unanchored | A5 |
| SR-10 | Definition of done is the only observable identity statement | no action; record-and-close |

## Questions

1. **What is wrong with the identity layer?** `spec/01-foundations.md` §1 fuses a
   product mission with §6 lifecycle mechanics, states a north star the same
   section retracts twice, declares no goals and no out-of-scope boundary, and
   never states who the document or the product is for.
2. **What does "prepare" mean?** Characters, NPCs, items, encounters, factions,
   lore, rooms, and notes built for their own sake — in a Novel under the Editor
   badge, or in the codex, which needs no Novel and no story (`user`, this
   session).
3. **Is a fifth classification axis needed?** No. The four uses are a projection
   of the eight intent groups already in T.3 (`user` accepted the analysis).
4. **How many increments?** One increment, one commit, two phases (`user`:
   "two increments okay", then "one plan for both"). The commit count is forced
   by the house close path; rationale in D9.
5. **What must this plan leave behind?** A green `check:fast`, a contract for
   preparation that is testable, and the recorded surface baseline regenerated.

## Evidence

| ID | Claim | Source | Class |
|---|---|---|---|
| EV1 | The mission paragraph defines an activity, embeds rebuild policy, and states "No manual coding" and "generated server code is never edited by hand" | `spec/01-foundations.md:106-116` | repo |
| EV2 | The same section states "Tabletop play is the first application of the engine, not its definition" | `spec/01-foundations.md:118-123` | repo |
| EV3 | The north star claims "the rules govern every outcome" | `spec/01-foundations.md:125-130` | repo |
| EV4 | A ruleset-free play model is defined where no ruleset is present and the GM's narrative tools are the main way to play | `spec/01-foundations.md:156-163` | repo |
| EV5 | A normative REQ grants player freedom: "Holonovel is a descriptive space, so a player may edit, advance, or level up a character freely, without ruleset gating" | `spec/02-requirements.md:1896-1897` (REQ-077c) | repo |
| EV6 | The Editor badge already grants full unfiltered access on Novel creation or resume | `spec/02-requirements.md:1229-1230` (REQ-031a) | repo |
| EV7 | §6.7 defines delta classes and partial-rebuild scoping for a spec-version change | `spec/03-build.md:2003-2047` (REQ-098, REQ-313, REQ-314) | repo |
| EV8 | A build produces declarative packages for a pre-built host; ruleset-free mode performs no extraction | `spec/03-build.md:283-288` | repo |
| EV9 | The codex is "a server-level codex — a typed content library for reusable content … that persists outside Novels"; when no Novel is active, `manage_codex (action: set)` persists content without requiring one | `spec/02-requirements.md:2257-2258` (REQ-321a), `:2293-2294` (REQ-321m1) | repo |
| EV10 | Codex entries are excluded from Novel export, clone, and checkpoints by design — the exclusion is correct because the codex is not story-tied | `spec/02-requirements.md:2291` (REQ-321n) | repo |
| EV11 | No codex exchange action exists: the action set is set, import, capture, list, get, delete | `spec/02-requirements.md:2261-2285` | repo |
| EV12 | Lore has a dedicated interchange pathway; `manage_archive (action: export)` is the Novel pathway | `spec/02-requirements.md:3098` | repo |
| EV13 | Admission of external artifacts goes through the exchange inbox with a fixed kind set: Novel pack, adventure module, ruleset package | `spec/02-requirements.md:2556-2564` (REQ-620, REQ-621) | repo |
| EV14 | T.3 declares eight intent groups, six phases, and a balance rule: a group with more than ten tools splits | `spec/appendices-reference.md:3566-3597`, `:3642-3645` | repo |
| EV15 | The group vocabulary is compiled: `"table", "explore", "resolve", "narrate", "lookup", "referee", "author", "maintain"` | `holonovel/src/rulesets.ts:76` | repo |
| EV16 | The `author` intent group already means "Author out of play under the Editor badge" — it is the prepare use | `spec/appendices-reference.md:3576` | repo |
| EV17 | The reading guide is test-gated: `test-spec-tooling` asserts the string `Appendix V \(Workflow Runbooks\)` appears in it | `scripts/test-spec-tooling.ts:378` | repo |
| EV18 | Next free identifiers are REQ-660 and T792 (max in corpus: REQ-659, T791) | `grep -oE 'REQ-[0-9]+'`; `grep -oE 'T[0-9]+'` | repo |
| EV19 | The authoritative out-of-scope list is `DECISIONS.md ## Non-goals`, reachable from `ROADMAP.md`; the spec never points to it | `holonovel/DECISIONS.md:13-28`; `AGENTS.md` (Gate section) | repo |
| EV20 | The README declares three audiences (operator, evaluator, contributor) and tags TOC entries operators/evaluators/reference; the spec declares five task roles | `README.md:5-8`, `:181-186`, `:55-94` | repo |
| EV21 | The Quick Reference asserts "18 handoff verification steps" with no anchor | `spec/01-foundations.md:14` | repo |
| EV22 | Surface gates compute action counts from the registry, so a new action moves the recorded surface | `scripts/check-tool-surface.ts:234-236`; `scripts/surface-budget.ts:135` | repo |

## Decisions

- **D1 — "consequences", not "every outcome."** The north star reads "the rules
  govern the consequences," and a **The test** paragraph defines consequence
  (resolution, clocks, conditions, knowledge, persistence) against authorship
  (attempts, description, direction). `README.md:190` already says "the rules
  govern" and needs no edit. `holonovel/DECISIONS.md:1771` keeps its historical
  quotation — it records reasoning at that time, not live text. (`user`)
- **D2 — Goals carry REQ anchors.** Six goals, 17 citations, each also naming the
  failure mode it prevents (§3). `validate`'s dead-citation check gates them.
  Rejected: failure-mode-only anchors (cheaper, but untraceable in the direction
  IEEE 29148 requires). (`user`)
- **D3 — Rename the product use to `build`.** The intent group `author` means
  prepare (EV16); the product use "author" would collide with it. `build` matches
  Convert → Build and Appendix V. The intent group name is not touched (EV15). 
- **D4 — The four uses are a projection, not an axis.** No new declaration field
  and no new gate. `play` alone would violate T.3's ten-tool balance rule (EV14),
  so the uses cannot replace the eight groups; they can only describe them. The
  mapping is derived from `group` and lives as T.3 prose plus the `discover`
  ordering.
- **D5 — Preparation has two peer stores.** A Novel (story-tied) and the codex
  (story-free, EV9). Parity means codex → Novel (`import`), Novel → codex
  (`capture`), and both out (the missing half). (`user`)
- **D6 — Codex export is a new action on an existing tool.** `manage_codex
  (action: export)`, mirroring `manage_lore (action: export)` (EV12). No new tool,
  so no tool-count budget movement; action counts are reported per T.3 but not
  gated. A codex artifact kind is **conditional** (B3) and, if it ships, ships
  within the same commit.
- **D7 — REQ-660 is scoped to the exit.** Editor full access is already REQ-031a
  (EV6), so a creation-parity clause would fail IEEE 29148 *necessary*. The REQ
  states what is missing: preparation reaches the exchange surfaces without a
  badge activation, and a prepared Novel enters play unchanged.
- **D8 — Codex kinds are not expanded.** Story journal entries, notes, and a world
  as a whole stay out of the codex; they are story-tied or need a world-pack
  shape. REQ-660 says so rather than implying the library holds "anything."
- **D9 — One commit.** Superseded the earlier two-commit split. A spec increment
  stays one commit (`AGENTS.md`, *Agent Operating Routine*), `session:close` is
  the only gated close path, and a split would put the generated `holonovel.md`
  in both commits so a revert of the first could not apply cleanly. The work is
  still two phases and the AAR covers both.
- **D10 — REQ-660 ships with its implementation.** A server-runtime requirement
  without evidence fails the strict implementation-coverage audit at push. The
  action is implemented in the reference host (`holonovel/src/index.ts`), gets a
  harness assertion, and the coverage register points at the implementation
  site. Rejected: a waiver (the action is small and the reference host is the
  adapter this repo maintains).
- **D11 — The surface change advances the version and the fingerprints.** A new
  action is a surface change under REQ-107a, and REQ-660's placement in §5.6
  makes it a data-format fingerprint component. Both regenerations are steps,
  not side effects.

## Phases

### Phase A — identity (prose first)

**A1 — Rewrite §1's identity paragraphs.** Replace the Mission paragraph, the
engine/adapter/program paragraph, and the north star paragraph with: Mission;
Why this is not a chatbot; Engine, adapter, program; The specification is the
source; Goals (six, anchored); Non-goals (one sentence + `DECISIONS.md` pointer);
The north star; The test; Trajectory; Who this document is for; Who Holonovel is
for. Reconcile the Quick Reference's opening with the host + package framing.
Files: `spec/01-foundations.md` only.

*Verify:* `npm run assemble` produces the section with no dead REQ citation;
`npm run validate` reports no new ambiguity or cross-reference error.

**A2 — Retire the rebuild clause.** The sentence "A full rebuild is required when
the ruleset changes, the extraction model changes, or the spec version changes"
is deleted; §6.7 owns the decision (EV7).

*Verify:* `grep -n "full rebuild is required" spec/` returns nothing.

**A3 — T.3 four-use projection.** Add one paragraph to `Tool Surface Contract`
mapping the four uses onto the eight groups (prepare → `author`, `table`
set-up, `referee` world-building; play → `table`, `explore`, `resolve`,
`narrate`, `referee`; build → off-surface, §6; host → `maintain`, `table`
open/close, package install). No declaration field, no group rename, no new
gate.

*Verify:* `npm run check-tool-surface` and `npm run surface-budget` are unmoved
(no declaration changed); the paragraph names all eight groups exactly once.

**A4 — Reading-guide reframe.** The five "If you are…" blocks stay; a two-sentence
opening states the document's two readers and that a user needs no knowledge of
it. Keep `Appendix V (Workflow Runbooks)` in the file (EV17).

*Verify:* `npm run test:spec-tooling` PASS (the assertion is
`scripts/test-spec-tooling.ts:378`); `Appendix V (Workflow Runbooks)` still
present in the file.

**A5 — Quick Reference count.** Either anchor "18 handoff verification steps" to
the §9 enumeration or drop the number.

*Verify:* the number, if kept, resolves to a count in §9 that matches.

**A6 — Register the identity terms.** Add *Holodeck* and *holonovel* to the §4
terminology table, or mark them in place as prose metaphor with the product
sense named. *Holodeck Coupling* and *Computer* already occupy the table, so the
entry states the relationship rather than inventing a second definition.

*Verify:* `npm run validate` (no duplicate term, no undefined-term finding);
`grep -n "Holodeck" spec/01a-constitution.md` shows the entry.

**A7 — Define intent.** The north star's "the cast responds with intent" gains
its operative sense: NPC behaviour derives from recorded goals, memory, and
knowledge rather than improvised characterization. This is a description of
existing contracts (REQ-077, REQ-122, REQ-308, REQ-339) and adds no requirement.

*Verify:* the phrase's referent is stated in §1; the cited REQs exist.

### Phase B — contracts (same commit, after Phase A is green)

**B0 — Measure the cost of one new action.** Add nothing. Run
`npm run check-tool-definitions-sync`, `npm run check-tool-surface`,
`npm run surface-budget -- --check`, `npm run surface-replay -- --check`,
`npm run action-conflicts -- --check`, `npm run check-fingerprint-sync`,
`npm run check-package-manifest` and record which of the seven artifacts a
`manage_codex (action: export)` addition moves, and which gate reports each one
stale. The table in `tasks.md` starts blank; every row is measured, none assumed.

*Verify:* every row in the `tasks.md` B0 table carries a measured result and the
gate that produced it.

**B0b — Read the badge and audit seams.** Read
`holonovel/src/core/badge-gate.ts` and `holonovel/src/core/audit-gate.ts` to
determine how `manage_codex (action: list)` and `(action: get)` enforce
Editor/Game Master without a mutating class, and whether `MUTATING_READ_ACTIONS`
holds any read action. Record the mechanism the new `export` action must join.
Also confirm whether `manage_codex` already holds a REQ-137a row in
`holonovel/DECISIONS.md`; record "row exists" or "row added".

*Verify:* the answer names the file and line, and B1a cites it.

**B1 — REQ-660 Preparation parity (T792).** One paragraph, at most eight
sentences, at most 800 characters (Appendix M). Placed in §5.6 — the state and
lifecycle section that already holds the codex contract, and the only one of the
candidate sections that is a data-format fingerprint component. If the body
overruns, the kinds-exclusion clause (D8) is cut first and recorded in D8 as a
non-contract statement. The REQ adds no tool and no action of its own.

*Verify:* `npm run validate` (REQ shape, length, section map); the section map
lists REQ-660; `_Check:_ T792` resolves after the Appendix F catalogue row exists.

**B1a — Implement the action.** Four edits:
1. `holonovel/tool-surface-registry.json` — declare the action with the eight
   T.3 fields: `group: "author"`, phases all (an export is callable in any
   phase), `entry` false, `mutation_class: "read"`, `ruleset: null`,
   `preconditions: []`, `successors: []`, `edges: []`.
2. The badge seam from B0b, so a Player cannot export.
3. `holonovel/src/index.ts` — the action handler: deterministic payload, id/kind
   filter, no Novel required, no secrets or mind content, `REQ-660` cited in the
   source beside the handler.
4. `holonovel/scripts/test-output-contracts.ts` — the round-trip assertion
   (export → import → export byte-identical) in the existing codex block, citing
   `REQ-660`; no `holonovel/package.json` change, because
   `test:output-contracts` already exists and is already in `test:all`.

*Verify:* `npm --prefix holonovel run test:output-contracts` exits 0; the
round-trip assertion fails when the payload is perturbed.

**B2 — `manage_codex (action: export)` in the spec.** Documented on the existing
tool; semantics mirror `manage_lore (action: export)` (EV12). One normative
sentence states that REQ-321l is unchanged: codex entries still do not appear in
`manage_archive (action: export)`, clone, or checkpoints; the codex export is a
distinct surface.

*Verify:* `npm run check-tool-definitions-sync` (regenerated), `npm run
check-tool-surface`, `npm run surface-budget -- --write` when the footprint
moved.

**B3 — Codex artifact kind (conditional).** This is a B3-local experiment, not a
B0 output: add the `codex pack` row to REQ-620/REQ-621's kind set, re-run the
catalogue gates, and keep it only if it needs no regeneration beyond the seven
artifacts already in scope. Otherwise revert the edit and schedule it on
`ROADMAP.md` with a `**Trigger:**`.

*Verify:* the admission assertion round-trips through the inbox; if deferred, the
`ROADMAP.md` entry carries a `**Trigger:**`.

**B5 — Version advance.** `npm run version-bump`.

*Verify:* `npm run check-package-manifest`; the CalVer, `holonovel/package.json`,
the lockfile, `server.json`, and `index.ts` agree.

**B6 — Fingerprint regeneration.** `npm run build-order` regenerates
`holonovel/src/generated/contract-fingerprints.ts` because REQ-660 edits §5.6, a
data-format fingerprint component.

*Verify:* `npm run check-fingerprint-sync` PASS; the regenerated constant's diff
names §5.6.

**B7 — Gate sweep.** `npm run assemble && npm run check:fast` (direct, unpiped,
exit code captured), then `npm run check`, then
`npm --prefix holonovel run test:all`.

*Verify:* `check:fast: PASS`, `check` PASS, and 56/56 harness commands.

### Phase C — close

**C1 — CHANGELOG entry** for the session, one dated heading with two bullet
groups (identity layer; prepare contract).

**C2 — AAR** at `aar.md`: every finding with a terminal disposition, SR-10
record-and-closed with a dated note, anything unresolved written to
`spec/audit/review-register.md`, ending `LOOP PAUSED`.

**C3 — Close** with `npm run session:close`, which assembles, derives the subject
from the C1 heading, requires the C2 token, runs the fast suite, and commits.
Report the commit.

## Blast radius

| File | Change |
|---|---|
| `spec/01-foundations.md` | §1 identity paragraphs; Quick Reference opening and count |
| `spec/01a-constitution.md` | *Holodeck* and *holonovel* terminology entries |
| `spec/appendices-reference.md` | T.3 four-use projection; Appendix E manifest row; Appendix F catalogue row |
| `spec/02-requirements.md` | REQ-660 (§5.6); `manage_codex (action: export)` contract text |
| `spec/audit/req-coverage.md` | regenerated coverage register |
| `spec/audit/tool-surface-baseline.json` | regenerated when the footprint moved |
| `spec/audit/tool-surface-replay.json` | regenerated (`surface-replay -- --write`) |
| `spec/audit/action-conflicts-baseline.json` | hand-edited with a disposition row when `--check` reports a collision |
| `holonovel/tool-surface-registry.json` | the action declaration (eight T.3 fields) |
| `holonovel/src/index.ts` | the `export` action implementation, `REQ-660` cited |
| `holonovel/scripts/test-output-contracts.ts` | the round-trip assertion, `REQ-660` cited |
| `holonovel/src/generated/contract-fingerprints.ts` | regenerated (data-format component) |
| `holonovel/tool-definitions.json` | regenerated |
| `holonovel/DECISIONS.md` | action/token counts; REQ-137a row recorded, not assumed |
| `holonovel/AGENTS.md` | tool-surface line and count |
| `package.json`, `holonovel/package.json`, lockfile, `holonovel/server.json` | CalVer advance |
| `holonovel.md` | assembled |
| `CHANGELOG.md` | one dated entry |
| `docs/plans/2026-11-15-identity-layer-rebuild/` | plan, tasks, cold report, AAR |
| `ROADMAP.md` | only if B3 is deferred |

Not touched: `README.md` (the tagline and orientation already match; EV20 is a
report, not a defect), `scripts/` (no gate changes), `.github/` (no CI changes).

## Commit order

One commit, after Phase C's AAR rewrite: `npm run session:close`. The sequence is
C1 → C2 → C3 — `session:close` derives the subject from the CHANGELOG heading,
requires `aar.md` to end `LOOP PAUSED`, runs the fast suite, and commits.
`holonovel.md` is assembled once, immediately before the close.

## Done bar

**Done bar:** `npm run assemble && npm run check:fast` PASS on the final tree;
§1 carries Mission, The specification is the source, Goals (six, each with REQ
anchors and a failure mode), Non-goals with the `DECISIONS.md` pointer, The north
star, The test, Trajectory, Who this document is for, and Who Holonovel is for;
§4 registers the two identity terms; T.3 carries the four-use projection with no
declaration change; REQ-660 exists with T792 in the Appendix E manifest, the
Appendix F catalogue, the §5 section map, and the regenerated coverage register,
cites its implementation site, and states that REQ-321l is unchanged;
`manage_codex (action: export)` is implemented and declared, its generated
artifacts, version, and fingerprints are current, and the harness round trip
passes; B3 is shipped or scheduled with a `**Trigger:**`; the commit is landed;
`aar.md` ends `LOOP PAUSED` with every finding carrying a terminal disposition.

## Open questions

1. **Codex export shape.** A single `export` with an optional id/kind filter, or a
   full-library pack only? The plan assumes the filter, mirroring
   `manage_codex (action: list)`.
2. **B3 timing.** Ship the codex artifact kind if B0 shows it forces no second
   catalogue regeneration; otherwise schedule it. Decide after B0, not now.
3. **Anchor count.** 17 citations in §1 is the largest prose citation block in the
   document. If `validate` proves noisy, the fallback is to keep anchors only on
   the goals that have a single owning REQ family.
