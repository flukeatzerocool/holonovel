# Plan — §5.16–§5.17 capability citation gaps (F-P6b-27, F-P6b-28)

Status: revised after cold review (blocker and seven majors folded in; see §9)
· Kind: planned · Depth: standard
Increment: `docs/plans/2026-11-10-5-16-5-17-capability-citation-gaps/`
Rollback cost: 1 (reversible edits; one spec increment, one commit)
Evidence class: repo only (no web, no user-supplied content)

## 1. Objective

Close the first open `ROADMAP.md` section — **§5.16–§5.17 capability citation
gaps (P1)** — by closing its two findings against REQ-392 and REQ-391b:

- **F-P6b-27.** REQ-392's "every registered tool's description SHALL fit a
  build-time size budget recorded in DECISIONS.md" clause rests on T459, which
  asserts only that `spec_health.tools_list_bytes` is a number; no harness
  measures a description against the recorded budget.
- **F-P6b-28.** REQ-391b's "a single ruleset's tool set on demand, distinct
  from the default listing" has no surface: `tools/list` is the only listing and
  every projection it offers (`scope`, `group`, `profile`) is ruleset-blind.

Both are **implementation-and-assertion** defects. Neither REQ body changes:
REQ-392 already states the budget contract and REQ-391b already requires "a
mechanism"; the missing pieces are the mechanism itself and the assertions.
That keeps the delta a **patch** (Appendix F only) and avoids the
`package_format` advance a §5.17 body edit would force
(`scripts/lib/contract-fingerprint.ts:27`). §4.5 records the rejected
alternative.

**Done bar** (each item names its command or artifact)

1. T459 (`holonovel/scripts/test-output-contracts.ts`) asserts, over the live
   `scope=all` registry, that every tool description fits the budget parsed
   from `holonovel/DECISIONS.md` (shared parser in
   `holonovel/scripts/lib/tool-budget.ts`), and that `tools_list_bytes` equals
   the byte length of the served default listing **after removing the host
   `_meta.ruleset` / `_meta.inapplicable` extensions**. The T459 row records
   that the figure is the pre-annotation catalog projection.
2. `tools/list` accepts a `ruleset=<slug>` filter, and T457
   (`holonovel/scripts/test-selection.ts`) asserts, in one block: (a) the
   filtered result is exactly that ruleset's tools; (b) no infrastructure and
   no foreign-ruleset tool appears; (c) an unknown slug refuses
   `[INVALID_INPUT]`; (d) `ruleset` combined with `scope` **or** `group`
   refuses `[INVALID_INPUT]` rather than inventing a precedence REQ-391a
   (and REQ-570's always-visible globals) do not grant; (e)
   `spec_health.rulesets_hydrated` is unchanged across the filtered call;
   (f) a cursor minted from the **unscoped** default listing is rejected when
   replayed against a ruleset-filtered request.
3. The new T457 assertions fail on the pre-change tree. The T459 predicates
   are green at HEAD by design (they close a regression window) and are each
   proven red by a temporary mutation: lowering the parsed budget below 994
   fails the budget predicate, and removing the `_meta` strip step fails the
   reflection predicate (112 903 compared against the served 113 828). Both
   transcripts are recorded in `aar.md`; after the change
   `npm --prefix holonovel run test:selection` and
   `npm --prefix holonovel run test:output-contracts` exit 0.
4. F-P6b-27 and F-P6b-28 appear under `## Resolved — 2026-11-10 §5.16–§5.17
   capability citation gaps` in `spec/audit/review-register.md`, each with a
   post-change `file:line` predicate that resolves on the committed tree.
5. The `## §5.16–§5.17 capability citation gaps (P1)` section is removed from
   `ROADMAP.md`; no `Scheduled-roadmap` row still names it
   (`npm run check-registers` passes).
6. `npm run assemble && npm run check:fast` exits 0 with the trailing
   `check:fast: PASS` line, run un-piped.
7. `npm run build-order` completes and **no contract fingerprint advances**:
   §5.16/§5.17 bodies are untouched, and Appendix F is in neither
   `PACKAGE_SECTIONS` nor `DATA_SECTIONS`
   (`scripts/lib/contract-fingerprint.ts:27,37-43`). The delta is a patch, so
   REQ-394's pending-update gate does not fire and no installed package needs
   rebuilding.
8. `aar.md` ends `LOOP PAUSED`.

## 2. Verified baseline

- `npm run status` (`repo`, this session): 44 unpushed commits, 16 open
  roadmap items, version `2026.11.10`, last publish
  `2026-11-09T04:30:29.593Z`. `git status --short` was empty at start; `HEAD` is
  `9cdce72 2026-11-10 — §5.16–§5.18 citation repair`.
- `npm run check:fast`: 40 gates, **40 passed, 0 failed**, `check:fast: PASS`.
  The baseline is green, so no pre-fix commit is required.
- **Live description budget** (`repo`, this session; probe booted
  `holonovel/src/index.ts` over a temp `TTRPG_DATA_DIR`): 37 listed tools,
  longest description **994 B**, recorded budget **1000 B**
  (`holonovel/DECISIONS.md:7`). The clause passes today; nothing would catch a
  regression, which is exactly what the finding names.
- **`tools_list_bytes`** (same probe): served default listing serializes to
  **113 828 B**; the same array with the REQ-379b `_meta.ruleset` extension
  removed serializes to **112 903 B**, equal to the reported figure. The
  925-byte gap is the host extension annotation, and it is why done bar 1
  states the projection explicitly instead of claiming byte equality with the
  wire payload.
- **Cursor minting needs a small cap.** Cursors are produced only when the
  listing exceeds `TTRPG_TOOLS_LIST_MAX_BYTES` (default 262144,
  `holonovel/src/index.ts:15420`) and the catalog is ~113 KB, so the T457
  cursor assertion boots its process with a small cap.
- **Delta class.** Appendix F is not a fingerprinted section, and no REQ body
  changes, so the delta is a patch: no `update` invocation, no package
  rebuild, no Spec Update verification line beyond the normal pipeline record.
- Version `2026.11.10` already equals the session date; no version bump is
  needed (`session:close` derives the subject from the top CHANGELOG heading).

## 3. Evidence (file:line)

| Claim | Evidence | Class |
|---|---|---|
| T459 asserts only the numeric field | `holonovel/scripts/test-output-contracts.ts:1811` | repo |
| T459's row claims the budget clause and "reflects the default listing" | `spec/appendices-reference.md:1914` | repo |
| REQ-392 body | `spec/02-requirements.md:3958` | repo |
| Recorded budget line | `holonovel/DECISIONS.md:7` | repo |
| Existing budget parser to share | `holonovel/scripts/test-tool-definitions.ts:72-77` | repo |
| `tools/list` projection has no ruleset filter | `holonovel/src/index.ts:15396-15402` | repo |
| Unknown `group` refusal (precedent for the slug refusal) | `holonovel/src/index.ts:15402-15404` | repo |
| Cursor signature binds scope/profile/group only | `holonovel/src/index.ts:15419` | repo |
| Pagination cap default | `holonovel/src/index.ts:15420` | repo |
| Ruleset scope derivable without hydration | `holonovel/src/index.ts:1981-1992` | repo |
| `rulesets_hydrated` reported by health | `holonovel/src/index.ts:12745` region; T459 asserts it at `test-output-contracts.ts:1810` | repo |
| REQ-391a names `scope=all` and the no-hydration clause | `spec/02-requirements.md:3949` | repo |
| REQ-391b body (unnamed mechanism, no acceptance criterion) | `spec/02-requirements.md:3951-3952` | repo |
| T457 currently asserts the schema half only | `holonovel/scripts/test-selection.ts:204-217` | repo |
| T457 row (schema-only) | `spec/appendices-reference.md:1912` | repo |
| §5.17 is a package-fingerprint section; Appendix F is in neither list | `scripts/lib/contract-fingerprint.ts:27,37-43` | repo |
| Two installed packages in one harness (precedent) | `holonovel/scripts/test-output-contracts.ts:112-146` | repo |
| Selection fixture carries no tools today | `holonovel/scripts/test-selection.ts:99-105` | repo |
| Selection process boots the `small` profile | `holonovel/scripts/test-selection.ts:133` | repo |

## 4. Design

### 4.1 Shared budget parser (new lib)

Move `recordedDescriptionBudget()` into `holonovel/scripts/lib/tool-budget.ts`
and import it from `test-tool-definitions.ts` and `test-output-contracts.ts`.
A second inline copy would trip `check-script-quality`'s duplicate-helper
detector (C2); the lib directory already hosts side-effect-free helpers
(`holonovel/scripts/lib/harness-guard.ts`). The parse is unchanged
(`**Recorded description budget:**\s*(\d+)`) and throws when the line is
absent, so a missing record fails loudly instead of skipping.

### 4.2 T459 extension (F-P6b-27)

Inside the existing `T459/REQ-392 + T456/REQ-391` test
(`test-output-contracts.ts:1791`):

1. Over the `scope=all` listing already fetched there, assert
   `Buffer.byteLength(tool.description, "utf-8") <= recordedDescriptionBudget()`
   for every entry, naming each offender with its byte count. That covers host
   and package tools, matching REQ-392's "every registered tool".
2. Assert `tools_list_bytes` equals the byte length of **`bound.result.tools`**
   — the post-`manage_novel create` listing, which is the response the
   `scopedCatalog`-based measurement describes — after deleting
   `_meta.ruleset` and `_meta.inapplicable`, dropping the `_meta` key when
   nothing else remains. Baseline §2 shows stripped == reported exactly.
3. Keep the existing presence and `rulesets_hydrated` assertions untouched.

**Existing-check discovery.** T642 (`test-tool-definitions.ts:246`) already
enforces the same recorded budget for the static `tool-definitions.json`
catalog (host tools, REQ-024c) but never sees a runtime-registered package tool
or the served listing, so T459 is extended rather than a fourth checker added.
The split is "static snapshot" (T642) versus "live registry" (T459); both read
the budget through the one shared parser.

### 4.3 Ruleset-filtered listing (F-P6b-28)

**Mechanism:** a `ruleset=<slug>` parameter on `tools/list`, carried the same
way as its siblings — `params._meta.ruleset`, with the top-level form accepted
for direct handler calls (`index.ts:15396-15401`).

**Selection:** when `ruleset` is present the base catalog is
`visible.filter(tool => packageSlugForTool(tool.name) === slug)`, replacing the
`scopedCatalog(...)` default. No infrastructure tools are included. A `group`
or `profile` supplied alongside still projects within that set.

**Conflict:** `ruleset` combined with `scope` or `group` refuses
`[INVALID_INPUT] conflicting filters: ruleset` rather than defining a
precedence that REQ-391a and REQ-570 do not grant. Every combination that could
contradict a sibling REQ is refused and asserted (§4.5 item 1).

**No hydration:** the filter reads the registered catalog and package identity
only (`packageSlugForTool`, `index.ts:1981-1991`); it never calls
`rulesets.hydrate(...)`, so REQ-391a's no-forced-hydration clause holds and the
assertion compares `rulesets_hydrated` across the call.

**Unknown slug:** `McpError(InvalidParams, "[INVALID_INPUT] unknown ruleset:
<slug>")`, matching the `group` refusal at `index.ts:15403`. The `[ERROR]`
prefix normalization is REQ-002's concern and is owned by the open **Trust-core
contract remediation** roadmap section; this increment keeps the new refusal
consistent with its sibling. The AAR records the tracking section, not only a
note.

**Pagination:** add `ruleset` to `pageSignature` (`index.ts:15419`) so the
existing cursor-mismatch branch rejects a cursor minted under another filter.
No new error path.

**Fixture shape.** `test-selection.ts` gains package tools so the filter has
something to select: `packageFixture()` (`slug: fixture`) gets
`lookup_alpha`; a second package `fixture2` with `lookup_beta` is installed in
the same process through `manage_ruleset (action: install)`, mirroring the
`wave1test`/`wave2test` precedent. `manifest.content_hash` is already computed
from `TOOLS`, so no fixture plumbing changes.

**T457 block.** The existing block `T457/REQ-391b` at `test-selection.ts:204`
is extended in place — one block, one ID, no duplicate-ID-across-harnesses
(F-P8-2). The ruleset assertions boot their own process inside that block with
`{ TTRPG_SURFACE_PROFILE: "full", TTRPG_TOOLS_LIST_MAX_BYTES: "4096" }` and
`profile: "full"` on the calls, because the block's existing `proc` runs the
`small` profile (`:133`). The cap is set small so the **unscoped** default
listing (≈113 KB) mints a cursor; that cursor is then replayed against a
ruleset-filtered request and must be rejected by the existing signature
mismatch branch. A ruleset-filtered listing is too small to paginate in its
own right, and the plan does not pretend otherwise.

### 4.4 Spec text (Appendix F only)

No REQ body changes. Two catalogue rows are rewritten:

- **T457** (`spec/appendices-reference.md:1912`) — keep the schema-disclosure
  half and add the ruleset-tool-set half: filtered listing returns exactly that
  ruleset's tools with no infrastructure, an unknown slug and a `ruleset` +
  `scope`/`group` combination refuse `[INVALID_INPUT]`, `rulesets_hydrated` is
  unchanged, and a cursor from another projection is rejected. The REQ column
  becomes `REQ-391a, REQ-391b, REQ-391c` so the two guard assertions
  (no hydration, cursor rejection) are attributed to the REQs that own them
  rather than silently widening REQ-391b's coverage.
- **T459** (`:1914`) — add the description-budget assertion and state that
  `tools_list_bytes` is measured on the catalog projection before the host
  `_meta` extension annotations. REQ column stays `REQ-392`.

### 4.5 Alternatives considered and contract checks

- **REQ-391b body edit (rejected).** Naming the parameter in §5.17 would read
  better beside REQ-391a, but it forces a `package_format` advance that holds
  every installed package inactive until rebuilt, and AGENTS.md's authoring
  rule ("the spec states contracts, not implementations") puts a parameter name
  on the wrong side of the line. The requirement already mandates "a
  mechanism"; the Appendix F row records the one that exists. Revisit only if a
  second consumer needs the parameter described normatively.
- **Rewriting the reported figure to the annotated payload (rejected).**
  Reporting 113 828 instead of 112 903 would match the wire payload literally,
  but `measuredSurface().active.bytes` also feeds the REQ-571 surface budgets,
  `spec/audit/tool-surface-baseline.json`, and the DECISIONS recorded surface
  budgets — three baselines moved for a measurement nuance. The assertion
  documents the projection instead.
- **Sibling-contract check (before implementation).** Grep for every REQ that
  binds `tools/list` parameters — REQ-391a (`scope`, no hydration), REQ-391c
  (pagination/cursor), REQ-381b (`scope=all` annotation), REQ-570 (`group`),
  REQ-137b (badge filtering) — and confirm each either composes (filter applied
  first) or is untouched. The conflict refusal in §4.3 removes the only
  precedence question.
- **File-surface probe.** (a) Registration/routing: `tools/list` is protocol,
  not a tool action, so `action-conflicts` and the action registry are
  untouched; (b) storage seam: none — install metadata and the registered
  catalog only; (c) schema/parameter descriptions: no tool schema changes, so
  `tool-definitions-lint`, `check-tool-definitions-sync`, and the surface
  budgets stay flat; (d) tests: the two harnesses named above.
- **Docs surface.** `docs/engine-contract.md:218` mentions badge-filtered
  `tools/list` without enumerating parameters, so no engine-contract edit is
  required unless the sibling grep finds a parameter enumeration.

## 5. Phases

Change sizes: S ≈ under an hour, M ≈ half a session.

### Phase 0 — contract-surface probes (S)
- Run the four probes in §4.5; record results (including any spec line that
  enumerates `tools/list` parameters) in `aar.md`. No edits.

### Phase 1 — shared budget parser (S)
- New `holonovel/scripts/lib/tool-budget.ts`; import it in
  `test-tool-definitions.ts` (delete the local copy) and
  `test-output-contracts.ts`.
- Verify: `npm --prefix holonovel run test:tool-definitions` exits 0.

### Phase 2 — T459 (F-P6b-27) (S)
- Extend the T459 block per §4.2.
- Red proof: two temporary mutations, each captured then reverted — (a) lower
  the parsed budget below 994 (fails the budget predicate); (b) drop the
  `_meta` strip step (fails the reflection predicate, 112 903 vs 113 828).
  Record both in `aar.md`. (The predicates are green at HEAD by design — done
  bar 3 states this.)
- Verify: `npm --prefix holonovel run test:output-contracts` exits 0.

### Phase 3 — ruleset filter (F-P6b-28) (M)
- `holonovel/src/index.ts`: parse `requestedRuleset`; select the ruleset's
  tools; refuse `ruleset` with `scope` or `group`; refuse an unknown slug; add
  `ruleset` to `pageSignature`.
- `holonovel/scripts/test-selection.ts`: fixture tools (`lookup_alpha`) plus a
  second package (`fixture2`, `lookup_beta`); extend the `T457/REQ-391b` block
  with the six assertions from done bar 2 — the cursor comes from the unscoped
  listing — using the dedicated default-profile boot.
- Red proof: run the new assertions against the pre-change server and record
  the failures in `aar.md`.
- Verify: `npm --prefix holonovel run test:selection` exits 0.

### Phase 4 — spec rows and registers (S)
- `spec/appendices-reference.md`: rewrite the T457 and T459 rows (§4.4).
- `spec/audit/review-register.md`: new
  `## Resolved — 2026-11-10 §5.16–§5.17 capability citation gaps` section with
  F-P6b-27 and F-P6b-28 and their post-change `file:line` predicates; delete
  both `Scheduled-roadmap` rows.
- `ROADMAP.md`: remove the closed section.
- `spec/audit/req-coverage.md`: `npm run validate -- --write-register`
  (expected no-op — no citation changes — but the register stays current).
- Verify: `npm run assemble && npm run validate` (0 errors),
  `npm run check-registers`, `npm run check-roadmap`.

### Phase 5 — build and record (S)
- `npm run build-order` (assemble → full `check` → propagate → fingerprint
  regeneration); confirm no fingerprint advanced (done bar 7).
- `CHANGELOG.md`: one bullet group under the existing `2026-11-10` heading.
- Verify: `npm run check:fast` un-piped → `check:fast: PASS`;
  `npm run status` shows the roadmap item gone.

### Phase 6 — close (S)
- `aar.md`: red-test transcripts, probe results, dispositions, `LOOP PAUSED`.
- `npm run session:close` (one commit).

## 6. Risks and blast radius

- **No fingerprint movement.** Appendix F is outside both fingerprint section
  lists, and no REQ body changes, so `check-fingerprint-sync` stays green and
  no package is invalidated. This is the main reason the body edit was dropped
  (§4.5).
- **Filter/scope interaction.** Refused rather than composed, so no undefined
  combination can silently widen a result and REQ-391a keeps its literal
  meaning. The assertion covers the refusal.
- **Harness runtime.** `test-selection.ts` gains one spawned server (it already
  spawns two); the added boot is killed in `finally`, and the block reuses the
  existing `test()` helper so a failure still reports.
- **Coverage register drift.** The register regeneration is a step even when it
  is a no-op, so a citation edit cannot silently desynchronize it.
- **`TTRPG_TOOLS_LIST_MAX_BYTES: "4096"` in the test.** Deliberately small to
  mint a cursor; it is scoped to the child process env and cannot leak into
  other harnesses.

## 7. User impact

- **Additive protocol surface.** `tools/list(_meta.ruleset)` is new; every
  existing call shape behaves exactly as before, so no client breaks and no
  restart is required beyond the normal server reload.
- **One new refusal.** `ruleset` combined with `scope` fails with
  `[INVALID_INPUT]` and a corrective action; this combination had no defined
  meaning before.
- **No new tool, action, tool parameter, config, or persisted state**, so the
  DECISIONS tool/action/token counts, the §5.19 guardrail enumerations, the
  §7.7 property groups, and the recorded surface budgets are unchanged.
- **No installed package is invalidated** — the only user-visible change is the
  new filter and the two new assertions.

## 8. Open questions

1. Should the ruleset filter accept a comma list of slugs? Not needed by
   REQ-391b; out of scope, recorded in the AAR.
2. Should `[ERROR]` prefix normalization happen here rather than in the
   Trust-core section? Plan: defer to that section (§4.3), which is the
   tracking surface.

## 9. Cold-review dispositions

| Finding | Disposition |
|---|---|
| Blocker: done bar 3 required green-at-HEAD predicates to be red | Done bar 3 rewritten: T457 red against the pre-change tree; T459 red by budget mutation, stated as such |
| Major: reflection assertion locks in an under-reported figure | Done bar 1 and §4.2 state the pre-annotation projection; §4.5 records the rejected alternative |
| Major: `ruleset` + `scope` precedence contradicts REQ-391a | §4.3 refuses the combination; done bar 2(d) asserts it |
| Major: cursor assertion cannot mint at the default cap | §4.3 T457 block sets `TTRPG_TOOLS_LIST_MAX_BYTES: "4096"` |
| Major: "the default listing" was two different responses | §4.2 names `bound.result.tools` |
| Major: T457 placement/ID ambiguous | §4.3 extends the existing block in place, one ID, dedicated boot |
| Major: unforced `package_format` advance | REQ body edit dropped; §4.5 records the alternative as rejected |
| Major: three citations off by a few lines | §3 table corrected (`:15419`, `:15402-15404`, `:1811`) |
| Nit: `_meta.ruleset` vs top level | §4.3 states `_meta` primary, top-level accepted for direct calls |
| Nit: T459 row untouched | §4.4 rewrites both rows |
| Nit: `[INVALID_INPUT]` will be re-formed by Trust-core | §4.3 names the roadmap section as the tracking surface |
| Nit: "server package is re-propagated" | removed from Phase 5 |
| Nit: second package unspecified | §4.3 names slug, tool, install path, and process |

### Re-audit (v2) findings — folded in, verified at build

The targeted re-audit confirmed every prior finding resolved and raised three
new items in the changed text. They are folded in above rather than re-reviewed
(the standard-depth re-review cap is one pass):

| Finding | Disposition |
|---|---|
| Major: the reflection predicate had no demonstrated failure mode | Done bar 3 and Phase 2 now specify a second mutation (drop the `_meta` strip) alongside the budget mutation |
| Nit: a ruleset-filtered listing cannot mint a cursor at 4096 | §4.3 states the cursor is minted from the unscoped listing and replayed against the filtered request |
| Nit: the T457 row attributed REQ-391a/391c guards to REQ-391b | §4.4 sets the row's REQ column to `REQ-391a, REQ-391b, REQ-391c` |
| Deferred: `group` composed inside the ruleset set dropped REQ-570's always-visible globals | §4.3 now refuses `ruleset` with `group` as well, so REQ-570 is never narrowed |

**Conditions for build-review** (each verifiable in a single command or read):

- **C-1** The T459 reflection predicate is proven red by removing the `_meta`
  strip step, transcript in `aar.md`.
- **C-2** The T457 cursor assertion mints its cursor from the unscoped listing;
  the filtered request returns `[INVALID_INPUT]` for that cursor.
- **C-3** The T457 row's REQ column reads `REQ-391a, REQ-391b, REQ-391c`.
- **C-4** The `ruleset` + `group` refusal is implemented and asserted.
