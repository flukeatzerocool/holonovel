# Plan — Psyche-depth identity facets, who-they-are renderer, and tension surface

Session 2026-11-08. Roadmap item: "Psyche-depth identity facets" —
`ROADMAP.md:15-24`, chunk 4 of the subjective-memory program (chunk 1 =
`2026-11-08-subjective-memory-store`, chunk 2 = `2026-11-08-memory-divergence-verdicts`,
chunk 3 = `2026-11-08-subjective-disclosure-axis`).

## Questions

- The user asked: "draft plan for next roadmap item." The first open roadmap
  section is the psyche-depth identity facets (`ROADMAP.md:15-24`); the only
  item below it is scored/budgeted recall (chunk 5).
- What is the smallest increment that meets the roadmap's own trigger
  (`ROADMAP.md:23-24`): a developmental facet remains a proposal, a false
  belief renders marked, and a contradiction survives reconciliation?
- How much of COF 1.2's psyche-node vocabulary is adopted, and where does the
  remainder go?

## Baseline (measured this session)

- `npm run status` → version 2026.11.08, 5 unpushed commits, 2 open roadmap
  items, last publish 2026-11-07T20:30:06Z.
- `npm run check:fast` (un-piped, full log at `/tmp/opencode/check-fast-baseline.log`)
  → **PASS**: 37 passed, 0 failed, exit 0, `check:fast: PASS`.
- Next free identifiers: max REQ-635, max T757 → REQ-636–643, T758–T765.
- `spec/audit/review-register.md` carries no `Scheduled-roadmap` row naming
  this item (3 rows exist, none matches "Psyche" or "identity facet").

## Why

Identity already has the machinery this chunk extends — candidate staging,
stability classes, perspectives, revision history, a deterministic
version-keyed kernel, and a badge gate — but the record carries none of the
psyche attributes the roadmap names, no surface renders it, and the kernel has
no tension surface.

| Claim | Evidence |
|---|---|
| Candidate and facet records carry no psyche attributes | `holonovel/src/core/identity.ts:16-36` |
| Kernel groups by stability class and excludes only `secret` | `holonovel/src/core/identity.ts:94-109` (`:97`) |
| Compiler version is a fixed stamp | `holonovel/src/core/identity.ts:61` |
| `manage_identity` schema has seven parameters, none psyche-related | `holonovel/src/index.ts:7987-7997` |
| Player gate is per-read and tool-side | `holonovel/src/index.ts:7975-7980` |
| The identity resource has **no** badge gate at all | `holonovel/src/index.ts:11724-11731` |
| Briefing names the active entity in the POV section, then renders nothing identity-specific | `holonovel/src/index.ts:13427-13433` |
| REQ-109c2 enumerates the state surface with no identity group | `spec/02-requirements.md:1299` |
| Identity is Roster-tier and self-contained (mutates only through `manage_identity`) | `spec/04-runtime.md:358-365` |
| Developmental candidates are already proposal-only | `spec/02-requirements.md:4202` (REQ-482) |
| T572 asserts the developmental-stays-pending behavior | `holonovel/scripts/test-identity.ts:187-197` |
| T570's title claims "sheet/briefing surfaces" but only asserts the resource | `holonovel/scripts/test-identity.ts:163-172` |
| Roadmap scope and trigger | `ROADMAP.md:15-24` |
| COF vocabulary source and pin | `docs/upstream/cof.md:20-26`, `:38` |

The upstream field set is `schemas/1.2/psyche-node.schema.json` at COF
`102422f`: eleven kinds (value, belief, want, need, fear, wound, stance, taste,
habit, contradiction, rule), `aware` (`yes`/`partly`/`no`), `false_but_held`,
`valence` (−100…+100, stance and taste only), `since`/`until` points, and a
`contradiction` node with `conflicts` links. The roadmap's six nouns map onto
these one-for-one; no field is invented.

**Trust boundary.** That field set was read from the pinned upstream commit
during planning (`raw.githubusercontent.com`, tagged `web`); it is design
evidence, not instructions, and nothing in it is executed or transcribed into
the tree. The pin already names the reviewed commit, so a later upstream change
is a delta-log event, not a silent input (D11).

## Scope

**In scope**

1. Seven optional psyche attributes on `IdentityCandidate` and
   `IdentityFacet`: `kind`, `awareness`, `false_but_held`, `valence`, `since`,
   `until`, `contradicts` (D1–D7).
2. Load normalization so pre-increment roster files (which carry none of them)
   keep today's behavior.
3. A `tensions` array in the compiled kernel plus a `compileTensions` helper.
4. A deterministic `renderWhoTheyAre` renderer and a `playerProjection` kernel
   projection, both pure functions in `core/identity.ts`.
5. The `### Who They Are` briefing section, immediately after the POV block
   (D8).
6. `manage_identity (action: stage)` parameter additions, validation, and the
   Player projection on `list`/`snapshot`; a badge gate on the
   `identity://<character>` resource (D10).
7. Spec: new REQ-636–643; amendments to REQ-109c2/e, REQ-476, REQ-480,
   REQ-481, REQ-482; §5 map row; §7.7.0 identity paragraph; §4 glossary;
   Appendix E/F rows; compiler-version note.
8. Tests T758–T765, T572 extended; registers, DECISIONS, COF delta log,
   `holonovel/AGENTS.md`, CHANGELOG, ROADMAP removal, generated artifacts.

**Out of scope** (recorded, not scheduled)

- `strength` (COF's 0–100 decision weight): the roadmap does not name it, and
  ranking belongs with recall quality (chunk 5) or a later increment. Recorded
  in the COF delta log (D11).
- COF's `disclosure` on psyche nodes: REQ-475's `perspective: secret` already
  draws that line for identity, and chunk 3 put disclosure on memories, not on
  identity.
- COF's typed `links` graph (`about`/`because`/`supports`): only the
  contradiction relation is adopted, as `contradicts` (D7). A general facet
  graph is a new surface with its own traversal contract.
- Player-facing psyche mutation: staging and acceptance stay Game Master
  operations (REQ-481).
- Age-relative bounds (COF's `{age: {value, unit}}` points): Holonovel has no
  character-age clock (D6).
- Any new tool, tool action, property group, or config.

## Decisions

- **D1 — Extend the existing record; add no surface.** The seven attributes are
  optional fields on `IdentityCandidate` and `IdentityFacet`, defaulted at load
  so roster files written before this increment keep today's behavior. The
  kernel carries them because the renderer consumes the kernel (and therefore
  inherits the `secret` exclusion for free). Rejected: a parallel
  `psyche:<character>` store (a second persisted identity surface that
  `revert`, the candidate cap, and `saveRoster` would each have to learn) and a
  new `manage_psyche` tool (the roadmap names identity facets, and REQ-477
  makes `manage_identity` the only durable-identity writer).
- **D2 — `kind` is a catalog, not free text, and `fact` is the default.**
  Catalog order is value, belief, want, need, fear, wound, stance, taste,
  habit, contradiction, rule, fact. `fact` exists because the existing
  authored facets (`name`, `calling`, `description`) are identity facts, not
  psyche nodes; defaulting them to `belief` would relabel every pre-existing
  facet and change the render. The catalog lives in §7.7.0 (the state model
  paragraph that already declares identity), not in the REQ body, per
  Appendix M.
- **D3 — `awareness` is COF's `aware`, renamed and narrowed to three values.**
  `yes | partly | no`, default `yes`. COF's rule is adopted verbatim: a `no`
  node is acted on, never stated. The GM render marks `[unaware]` /
  `[partly aware]`; the Player render states only `yes` facets. Rejected: a
  boolean (COF's middle value is the one that carries play — "she half knows
  it") and treating awareness as disclosure (REQ-475 already owns "may another
  see this", while awareness is "does she know it herself").
- **D4 — `false_but_held` marks a belief; reconciliation cannot clear it.**
  Boolean, valid only for `kind: belief` (`[INVALID_INPUT]` otherwise), default
  `false`. The GM render appends `[false belief]`; the Player projection keeps
  the belief and **clears the mark**, so the player holds the belief their
  character holds. Belief reconciliation never writes identity (REQ-477), so
  the mark survives by construction — that is the trigger's third condition
  (D7 carries the other reading of "contradiction survives reconciliation").
- **D5 — `valence` is a signed integer, and it does not reorder anything.**
  `-100…+100`, valid only for `stance` and `taste`, preserved in the kernel
  and rendered inline as `(valence −40)`. Ordering stays kernel order (facet
  key, then revision) because REQ-476 already fixes determinism to that order;
  sorting by valence would make the render order depend on a mutable value and
  silently shift existing lines. Rejected: an enumerated positive/negative/
  neutral axis (COF's scalar is the vocabulary the roadmap names).
- **D6 — `since`/`until` are ISO dates evaluated at the event-log head.**
  Roster-tier state cannot bind to Novel-scoped event ordinals (the roster is
  shared across Novels), and age points need an age clock Holonovel does not
  have. A facet renders as current when `since <= at < until`, where `at` is
  the newest event-log entry's timestamp for the active Novel; with an empty
  log no window is applied (nothing has happened yet). Out-of-window facets
  remain listable and compiled — they are history, not errors. Rejected:
  silently dropping expired facets at acceptance (loses the record) and
  wall-clock `now` (two renders of one version would disagree; REQ-476's
  determinism clause and the renderer's own determinism test both forbid it).
- **D7 — An owned contradiction is a `contradiction`-kind facet with
  `contradicts`.** Ownership is the node's existence, matching COF's
  "acknowledged inner tensions": one facet states the tension in `value` and
  names both ends in `contradicts`. The kernel exposes `tensions` — one entry
  per contradiction facet whose named ends are both current facets — and the
  briefing renders a `Tension:` line. A tension retires when either end is
  replaced or re-accepted, and is dormant (not rendered) while an end is
  missing. Rejected: a symmetric `contradicts` link on each end (two records to
  keep aligned, and the second end may not be accepted yet) and a first-class
  tension record type (a new collection with its own accept/retire path for a
  relation the facet already expresses).
- **D8 — The renderer is `### Who They Are`, immediately after `### Point of
  view` and before the entity personality group, for the active entity only.**
  The POV block already names the active entity for both badges, so the
  identity line follows the same anchor and the GM/Player split stays one
  decision (REQ-481: the Player reads only the active character). REQ-109d
  fixes the enumeration order, so REQ-109c2 names the group at that position
  and REQ-109e places it in the supplementary groups. With no active entity
  the section is absent (the POV empty-state marker already says why); with an
  active entity and nothing to state it renders the single marker
  `[No identity facets to state.]` — one string covers "no facets accepted"
  and "every facet is withheld from this badge". The section is truncatable
  (supplementary group, REQ-109e), not tier 1.
- **D9 — No new config.** The facet set is bounded by distinct facet keys
  (acceptance replaces per key), and REQ-135 already bounds total briefing
  size by section. Rejected: `TTRPG_IDENTITY_BRIEFING_MAX` (a §7.6 row, a
  DECISIONS entry, and a fingerprint for a bound the authoring model already
  supplies).
- **D10 — The Player projection closes the resource gap.** `list` and
  `snapshot` return the projected kernel to a Player (drop facets and staged
  candidates whose awareness is not `yes`, clear `false_but_held`), and the
  `identity://<character>` resource gains the same badge gate as the tool
  (`index.ts:7975-7980`): its `list` callback offers only the active
  character's URI to a Player, and a direct read of another character returns
  a contents body carrying `{"error":"FORBIDDEN"}` with the corrective action
  (the resource layer has no MCP error taxonomy, so the JSON body is the
  refusal, matching the existing `{"error":"not found"}` shape at
  `index.ts:11729`). The gap predates this increment but is harmless only
  because the record carries nothing a Player must not see; the new attributes
  change that. This is a defect fix riding the increment, not a scope
  expansion.
- **D11 — Compiler version advances.** `IDENTITY_COMPILER_VERSION`
  (`identity.ts:61`) moves to `2026.11.08` because the kernel shape changed;
  cached kernels keyed by the old value must not be reused.

## Contract changes

```ts
// holonovel/src/core/identity.ts
export type FacetKind =
  | "value" | "belief" | "want" | "need" | "fear" | "wound"
  | "stance" | "taste" | "habit" | "contradiction" | "rule" | "fact";
export const FACET_KINDS: FacetKind[];        // the order above; "fact" last
export type FacetAwareness = "yes" | "partly" | "no";

export interface PsycheAttributes {
  kind: FacetKind;              // load default: "fact"
  awareness: FacetAwareness;    // load default: "yes"
  false_but_held: boolean;      // load default: false; kind "belief" only
  valence?: number;             // -100..100; kind "stance" | "taste" only
  since?: string;               // ISO date; inclusive lower bound
  until?: string;               // ISO date; exclusive upper bound
  contradicts: string[];        // facet keys; load default: []
}

// IdentityCandidate and IdentityFacet extend PsycheAttributes.
// Normalization is the only place defaults are applied (old roster files).
export function normalizeFacetAttributes(raw: Partial<PsycheAttributes>): PsycheAttributes;

export interface IdentityTension {
  id: string;                   // "<contradiction facet>:<endA>+<endB>" (sorted ends)
  value: string;                // the contradiction facet's value
  ends: [string, string];       // sorted facet keys
}

export interface CompiledIdentityKernel {
  // …unchanged fields…
  tensions: IdentityTension[];
}

export function compileTensions(facets: IdentityFacet[]): IdentityTension[];
export function playerProjection(kernel: CompiledIdentityKernel): CompiledIdentityKernel;

export interface RenderOptions {
  badge: "game_master" | "player";
  at: string | null;            // newest event-log timestamp, or null
}
export function renderWhoTheyAre(kernel: CompiledIdentityKernel, opts: RenderOptions): string;
```

```ts
// holonovel/src/index.ts — manage_identity schema additions (stage)
kind: z.enum([...FACET_KINDS]).optional()          // default "fact"
awareness: z.enum(["yes", "partly", "no"]).optional() // default "yes"
false_but_held: z.boolean().optional()             // "belief" only
valence: z.number().int().min(-100).max(100).optional() // "stance"/"taste" only
since: z.string().optional()                       // ISO date
until: z.string().optional()                       // ISO date, >= since
contradicts: z.array(z.string()).optional()        // facet keys
```

Validation (`[INVALID_INPUT]` on each): unknown `kind`/`awareness` value;
`false_but_held: true` with a non-`belief` kind; `valence` with a non-
`stance`/`taste` kind; unparseable or inverted date window. `contradicts` keys
are not validated at staging — the other end may be accepted later; the tension
renders only when both ends are current (D7).

`manage_identity` description must stay inside the recorded byte budget in
`holonovel/tool-definitions.json` (`holonovel/tool-definitions.json:1085`); new
prose replaces, not appends, where possible. **Measured headroom at planning
time:** description 850 B against the 1000 B recorded budget
(`holonovel/DECISIONS.md:7`), so the new clause must fit in 150 B; the seven
parameter descriptions are schema text, not description text, and do not
consume that budget.

## Drafted requirement bodies

Each body is one paragraph, under the validator's 800-character and 8-sentence
limits, and carries no table, bullet, `Default:` clause, or parameter type.
Measured (characters / sentences): 636 441/4, 637 406/4, 638 348/3, 639 362/3,
640 483/4, 641 366/3, 642 414/3, 643 464/3.

> **REQ-636 — Facet kinds.** Every identity facet SHALL carry a kind drawn from
> the catalog defined in the state model, recorded at acceptance and preserved
> in the compiled kernel; a facet accepted without a kind SHALL carry the
> catalog's fact kind. The who-they-are renderer SHALL order facets by the
> catalog's declared order. *Acceptance criterion:* a fear facet reports its
> kind in the kernel and renders after a value facet. _Check:_ T758.

> **REQ-637 — Facet self-awareness.** Every identity facet SHALL carry an
> awareness of yes, partly, or no, recorded at acceptance and preserved in the
> compiled kernel. A facet whose awareness is not yes SHALL be marked for the
> Game Master and SHALL NOT be stated to the Player. *Acceptance criterion:* an
> unaware facet renders marked for the Game Master and is absent from the
> Player's render. _Check:_ T759.

> **REQ-638 — False but held belief.** A facet of belief kind MAY be recorded
> as false but held; the server SHALL mark it in the Game Master's render,
> SHALL NOT mark it for the Player, and SHALL NOT alter it through belief
> reconciliation. *Acceptance criterion:* a false belief remains marked after
> the entity's beliefs are reconciled. _Check:_ T760.

> **REQ-639 — Facet valence.** A facet of stance or taste kind MAY carry a
> valence within a bounded signed range declared in the state model; the server
> SHALL preserve it in the compiled kernel and SHALL render it with the facet.
> *Acceptance criterion:* a stance accepted with a negative valence reports
> that valence in the kernel and in the render. _Check:_ T761.

> **REQ-640 — Facet temporal bounds.** A facet MAY carry a start and an end
> date; the server SHALL preserve both in the compiled kernel and SHALL treat
> the facet as current only when the evaluation instant falls inside the
> bounds. The evaluation instant SHALL be the newest event-log entry for the
> active Novel, and a facet outside its bounds SHALL remain listable and
> compiled. *Acceptance criterion:* an ended facet is absent from the render
> and present in the kernel. _Check:_ T762.

> **REQ-641 — Owned contradiction.** An identity facet of contradiction kind
> SHALL name the facet keys it holds in tension, and the compiled kernel SHALL
> expose a tension for each such facet whose named ends are both current
> facets. *Acceptance criterion:* a contradiction over two current facets
> reports a tension that survives a belief reconciliation. _Check:_ T763.

> **REQ-642 — Who-they-are renderer.** `badge_briefing` SHALL include a
> deterministic who-they-are section for the active entity, compiled from the
> identity kernel, ordered by the facet catalog, identical across two renders
> at one identity version and event-log head, and absent when no entity is
> active. *Acceptance criterion:* two renders match byte for byte, and an ended
> or secret facet is absent. _Check:_ T764.

> **REQ-643 — Identity Player projection.** Identity reads SHALL return the
> full kernel to the Game Master and a Player projection to the Player that
> omits facets whose awareness is not yes and clears false-but-held markings; a
> Player read of another character's identity through the tool or the identity
> resource SHALL be refused. *Acceptance criterion:* a Player read of a foreign
> character is refused and an own-character read omits unaware facets.
> _Check:_ T765.

## Blast radius

| File | Change | Size | Rollback |
|---|---|---|---|
| `spec/02-requirements.md` | §5.26 REQ-636–643 added; REQ-109c2/e, REQ-476, REQ-480, REQ-481, REQ-482 amended; §5 map row `473–483, 547` → `473–483, 547, 636–643` | L | 1 |
| `spec/04-runtime.md` | §7.7.0 identity paragraph: attribute catalog, kind order, bounds semantics, tension definition, Player projection | M | 0 |
| `spec/01a-constitution.md` | Glossary "Character Identity" row (`:166`) names the psyche attributes | S | 0 |
| `spec/appendices-reference.md` | Appendix E rows REQ-636–643; Appendix F T758–T765 | M | 0 |
| `spec/build-phase-map.md` | Not edited (no new subsection, no new phase dependency) — confirmed by the count gate | — | — |
| `holonovel.md` | Regenerated by `npm run assemble` | L | 0 |
| `holonovel/src/core/identity.ts` | `FacetKind`/`FACET_KINDS`, `FacetAwareness`, attributes on both records, normalization, `compileTensions`, `tensions` in the kernel, `playerProjection`, `renderWhoTheyAre`, compiler version | L | 1 |
| `holonovel/src/index.ts` | Seven schema params + validation; list/snapshot Player projection; resource badge gate; `### Who They Are` after the POV block (`:13427-13433`) | L | 1 |
| `holonovel/src/generated/contract-fingerprints.ts` | Regenerated by `npm run build-order` (§7.7.0 edit feeds the fingerprint) | S | 0 |
| `holonovel/tool-definitions.json` | Regenerated by `generate-tool-definitions.ts` | S | 0 |
| `holonovel/tool-surface-registry.json` | `manage_identity.stage` parameter list only; no action entry | S | 0 |
| `spec/audit/tool-surface-baseline.json` | Re-recorded by `surface-budget -- --write` | S | 0 |
| `spec/audit/tool-surface-replay.json` | Re-recorded only if `surface-replay --write` reports a delta | S | 0 |
| `holonovel/DECISIONS.md` | Kind catalog order, awareness projection, bounds point, tension ownership, resource gate, `strength` deferral | S | 0 |
| `holonovel/AGENTS.md` | `manage_identity` line names the who-they-are section and psyche attributes; no count change | S | 0 |
| `holonovel/scripts/test-identity.ts` | T758–T765; T572 extended | M | 0 |
| `holonovel/scripts/lib/holosuite-*.ts` | Line-pinned evidence anchors re-resolved after the `index.ts` edits (+49 offset across nine anchors) | S | 0 |
| `holonovel/content/torre-nosferatu.json` | Rebuilt for the `DATA_FORMAT` bump (deviation: §7.7 as a whole feeds the fingerprint) | S | 0 |
| `docs/upstream/cof.md` | Chunk-4 row status `scheduled` → `adopted`; delta-log row for the `strength` deferral | S | 0 |
| `spec/audit/req-coverage.md` | Regenerated by `validate -- --write-register` | S | 0 |
| `CHANGELOG.md` | `2026-11-08` heading and bullets | S | 0 |
| `ROADMAP.md` | Remove the psyche-depth section | S | 1 |
| `docs/plans/2026-11-08-psyche-depth-identity-facets/` | `plan.md`, `tasks.md`, `aar.md` | S | 0 |

No starter-artifact rebuild was anticipated at drafting time, but the
`DATA_FORMAT` fingerprint hashes §7.7 as a whole — including the §7.7.0
identity paragraph — so `content/torre-nosferatu.json` is stale after task 2.
**Deviation (recorded):** `holonovel/content/torre-nosferatu.json` is rebuilt
with `npm run build:starter-novel`; the plan's original "no rebuild" claim is
superseded here.

`holonovel/src/core/state.ts` and `RosterEntity` are **not** edited: the
identity object is typed by `core/identity.ts` and persisted opaquely, so the
only storage seam this increment touches is `identityFor`
(`holonovel/src/index.ts:7958-7963`).

## Tasks (dependency order)

1. **Spec section.** Add REQ-636–643 in `spec/02-requirements.md` §5.26;
   amend REQ-109c2 (`:1299`) to name the who-they-are group and REQ-109e
   (`:1308`) to place it in the supplementary order, REQ-476 (`:4189`) for the
   kernel `tensions` array, REQ-480 (`:4198`) and REQ-481 (`:4200`) for the
   Player projection and the resource gate, REQ-482 (`:4202`) for a
   developmental psyche facet; update the §5 map row (`:34`). Verify each body
   against the 800-character and 8-sentence limits before running the gate.
   Run `npm run assemble`.
2. **State model and glossary.** Write the attribute catalog, kind order,
   bounds semantics, tension definition, and Player projection into the
   §7.7.0 identity paragraph (`spec/04-runtime.md:358-365`); update the
   glossary row (`spec/01a-constitution.md:166`); add Appendix E rows for
   REQ-636–643 and Appendix F rows T758–T765
   (`spec/appendices-reference.md:1196` region and `:1957` region). Run
   `npm run assemble && npm run validate`.
3. **Core module.** `holonovel/src/core/identity.ts`: the types, the load
   normalization, attribute flow through `candidatesFromCard`/`applyFacet`/
   `revertFacet` (a displaced facet keeps its attributes; the revert candidate
   restores them), `compileTensions`, `tensions` in `compileKernel`,
   `playerProjection`, `renderWhoTheyAre`, and the compiler-version bump.
   Pure functions only; cite REQ-636–643 in the header.
4. **Tool schema and handler.** `manage_identity (action: stage)` gains the
   seven parameters with the D2–D6 validation; `list`/`snapshot` apply
   `playerProjection` for the Player badge; the `identity://<character>`
   resource applies the same read gate. Grep for sibling REQs binding
   `manage_identity` before editing (sibling-contract check).
5. **Briefing.** Insert `### Who They Are` after the POV block
   (`holonovel/src/index.ts:13427-13433`), rendering
   `renderWhoTheyAre(compileKernel(identity), { badge, at })` for the active
   entity; `at` is the newest event-log entry timestamp for the active Novel,
   or `null` when the log is empty. Keep the D8 empty-state rule.
6. **Tests.** T758–T765 in `holonovel/scripts/test-identity.ts`, plus the T572
   extension. Each asserts the negative branch too (a `fact` facet is not
   marked, a `yes` facet is stated to the Player, an in-window facet renders,
   a tension with a missing end stays dormant).
7. **Regenerated artifacts.** `cd holonovel && npx tsx
   scripts/generate-tool-definitions.ts`; `npm run surface-budget -- --write`;
   `npx tsx scripts/surface-replay.ts --write` only if the check reports a
   delta; `npm run validate -- --write-register`; `npm run assemble`.
8. **Docs and registers.** DECISIONS entries for D2, D3, D6, D7, D10, D11 and
   the `strength` deferral; `docs/upstream/cof.md` chunk-4 status and delta-log
   row; `holonovel/AGENTS.md` `manage_identity` line; CHANGELOG under the
   `2026-11-08` heading; ROADMAP section removal. Re-grep
   `spec/audit/review-register.md` for a `Scheduled-roadmap` row naming this
   item and update it in the same step if one appears (`check-registers` gates
   the cross-reference).
9. **Close.** Un-piped `npm run check:fast`; `cd holonovel && npm run
   test:identity`; `cd holonovel && npm run test:briefing`; `cd holonovel &&
   npm run test:all`; `npm run build-order` (regenerates the fingerprints);
   `HOLONOVEL_IMPL_STRICT=1 npm run validate`; `npm run session:close`.

## Commit plan

This is a spec increment, so it is **one commit** via `npm run session:close`
(the house rule for a spec increment). The commit must pass, in order:
`npm run assemble`, un-piped `npm run check:fast`, `npm run build-order`,
`HOLONOVEL_IMPL_STRICT=1 npm run validate`, and `npm run check-loop-artifacts`.
A red baseline (currently green) would be fixed as its own commit first, never
folded into this one. Push is a separate, explicit authorization.

## Verification

| Step | Command | Pass condition |
|---|---|---|
| Spec assembly | `npm run assemble` | 0 errors |
| Fast gate | `npm run check:fast` (un-piped) | `check:fast: PASS`, 37/37 or more |
| Identity suite | `cd holonovel && npm run test:identity` | 0 failed; T758–T765 named |
| Briefing suite | `cd holonovel && npm run test:briefing` | 0 failed; existing sections intact |
| Full server suite | `cd holonovel && npm run test:all` | 0 failed |
| Fingerprints | `npm run build-order` | "Ready to commit"; `contract-fingerprints.ts` refreshed and `check-fingerprint-sync` PASS |
| Implementation coverage | `HOLONOVEL_IMPL_STRICT=1 npm run validate` | 0 errors; REQ-636–643 evidenced |
| Tool artifacts | inside `check:fast` | `check-tool-definitions-sync`, `tool-definitions-lint`, `surface-budget`, `surface-replay` PASS |
| Loop artifacts | `npm run check-loop-artifacts` | plan/tasks/AAR present, LOOP token terminal |

**Done bar:** In one session — the trigger's three conditions each demonstrated
by a named test (a developmental psyche candidate stays pending; a
`false_but_held` belief renders `[false belief]` for the GM after belief
reconciliation; a contradiction tension still lists after reconciliation);
two renders at one identity version and event-log head are byte-identical; a
Player read of a foreign identity is refused through both the tool and the
resource; `check:fast` PASS un-piped; `HOLONOVEL_IMPL_STRICT=1 npm run
validate` 0 errors; the roadmap section gone and the CHANGELOG carrying it;
AAR terminating `LOOP PAUSED` or `LOOP OPEN`.

## Risks and rollback

| Risk | Mitigation |
|---|---|
| A new REQ body overruns 800 characters / 8 sentences | Count before assembling; each new REQ is single-control and short |
| `manage_identity` description exceeds the recorded budget | Replace text rather than append; the lint prints the measured size |
| Old roster files load into a changed kernel | Normalization is the single defaulting point; T758 asserts a legacy-shaped record renders as a `fact` |
| The renderer depends on wall-clock time | `at` comes from the event-log head only; T764 renders twice and compares byte for byte |
| The Player projection leaks a GM-only attribute | One projection function feeds the tool and the resource; T765 asserts the foreign-read refusal and the unaware-facet omission |
| A contradiction render becomes order-unstable | Tensions sort by contradiction facet key then sorted ends; ids are derived, not sequenced |
| Fingerprint drift after the §7.7.0 edit | `npm run build-order` is a named task step, not a post-commit chore |
| The holosuite line-pinned anchors shift | Re-resolve each anchor to the nearest non-comment line carrying its token (chunk-3 precedent) |
| A tension names an end that is later re-accepted | The tension is dormant, not deleted, and returns if the end is accepted again; documented in DECISIONS |

Rollback cost: 1. The attributes are optional and defaulted, the kernel change
is additive, and reverting the renderer leaves the stored attributes inert.

## User impact

- A GM sees a compact "who they are" line for the active character, with false
  beliefs and self-unaware facets marked — the narrator finally has identity
  guidance inside the briefing instead of a separate tool call.
- A Player sees their own character's stated identity (no marks, no unaware
  facets) in the briefing and gains the same projection on their own snapshot.
- Every pre-existing roster character renders exactly as its authored facts,
  with no migration step and no new config.
- The identity resource stops answering a Player's request for another
  character.

## Open questions

1. **Should the renderer render for the Player at all?** This plan renders the
   projected form (D8/D10) because the POV block already serves both badges.
   A GM-only renderer is a one-branch change if the metagaming risk on the
   Player's own stated facets outweighs the convenience.
2. **Should `false_but_held` hide the belief from the Player instead of
   clearing the mark?** Hiding is the stricter reading of "the character does
   not know it is false"; clearing the mark keeps the Player's sheet identical
   to the character's self-model. This plan clears the mark.
3. **Is an ISO date the right adaptation of COF's `since`/`until` points?**
   Adopted for roster portability; age points would need a character-age model
   that does not exist.
4. **Is `contradicts` enough of COF's link graph?** This plan takes only the
   contradiction relation. `about`/`because`/`supports` links would make the
   kernel a graph; that is a separate traversal contract.
