# Plan — §5.3 prompt-health and resource-presence depth (roadmap P1)

Status: draft v3 (v2 resolved the cold pass on v1; v3 resolves the diff
re-review of v2: 1 new Blocker, 2 new Major, 3 Minor, 1 Nit — see Resolutions)
· Kind: planned · Depth: standard
Increment target: `docs/plans/2026-11-14-s5-3-prompt-health-depth/` (promote from
`plans/2026-11-14-s5-3-prompt-health-depth/` at execution start and add `aar.md`)
Rollback cost: 1 (one revert: `holonovel/src/index.ts`, two harness blocks, two
REQ-acceptance sentences and two Appendix F rows plus the regenerated
`holonovel.md`, and register/roadmap/changelog bookkeeping; no migration, no
data-format change)
Evidence class: repo
Trust boundary: every premise below was read from the working tree at HEAD
(`cce17dd`) in this session; no web or user content enters the plan.

Evidence: `plan.evidence.json` / `plan.evidence.md` beside the persisted plan
artifact (preflight rerun against v2; sha256, target and REQ counts are taken
from that sidecar, not quoted here).

## Resolutions (cold pass v1 → v2)

### Diff re-review of v2 → v3

- **NEW-1 (Blocker) — the `{ source, served }` contract had three owners.** D1
  said the wrapper returns the composer output unchanged, D7 said it returns
  both texts, and T1 had the handlers apply `applyPromptBudget`. v3 gives the
  wrapper sole ownership: `renderHostPromptText(name, opts)` applies
  `applyPromptBudget` itself and returns `{ source, served }`; handlers consume
  `.served` only and never budget. Per prompt: `intro`, `session_zero`,
  `novel_setup`, `run_workflow` → `served = applyPromptBudget(source)`;
  `badge_briefing` → `source === served` (its composer budgets internally,
  `:18038`); `narrate` → `source === served` (no budget, `:18053-18066`).
  Health and handlers call the same wrapper; the only difference is the
  `mutate` option for `badge_briefing`.
- **NEW-2 (Major, a) — live host resources outside the catalog vanished.** D4's
  declared set is now the *drawn* set: REQ-022 catalog ∪ installed package
  declarations ∪ the live fixed and template maps. Live-only entries
  (`ruleset://`, `adventure://`, `identity://`, `causal://state`,
  `holonovel://tool-groups`) appear with `presence: "present"`; declared-but-
  unregistered entries appear `absent`; `resource_count` counts present
  entries. Still no cross-call state.
- **NEW-2 (Major, b) — REQ-389c's resource-deregistration half is now
  implemented.** `registerPackageResources` keeps the SDK handle
  (`mcp.js:556-559`, `:588` support `.remove()`), removal calls it and clears
  the slug's entries from `packageResourceKeys`, so reinstall re-registers
  without a collision. D5 now argues the tool half only, where
  `ToolRegistry.define` genuinely has no remove. REQ-139's absence clause is
  still reworded (D9) because the declared set cannot outlive the package — but
  the clause now describes both observables (declared-unregistered → absent;
  removed registration → entry leaves), and 389c's resource requirement is met
  rather than filtered.
- **Mn1** — the predicate path is `holonovel/src/rulesets.ts:743` (no `core/`).
- **Mn2** — done-bar #4 no longer claims a tool is counted in
  `resource_count`; it separates the tool leg from the resource leg.
- **Mn3** — D2b's false-negative side is recorded: a genuine stale name quoted
  inside user prose is masked. The bound: §6.5 evaluates prompt *source*, and
  T152 asserts the source-side lifecycle, so the masking cannot hide a
  construction defect in a prompt; it can only under-report a name that
  happens to appear verbatim in user data.
- **Nit1** — the "≤800 chars, ≤8 sentences" claim is withdrawn; T8 records the
  before/after counts of both paragraphs and `validate --sdd-strict` is the
  authority.

### Cold pass v1 → v2

- **B1 — the prompt bodies are not inline in the handlers.** All six handlers
  already delegate to named composers: `composeIntro`
  (`index.ts:17104`), `composeBadgeBriefing` (`:18050`),
  `composeNarrationClearance` (`:18065`), `composeSessionZero` (`:18081`),
  `composeNovelSetup` (`:18116`), `composeRunWorkflow` (`:18138`) — four in
  `src/core/prompt-composition.ts`, two in `index.ts`. What the handlers hold is
  *input assembly* (library lines, steps, roster count, badge-filtered tool
  names). D1 is rewritten: `renderHostPromptText` is a thin wrapper in
  `index.ts:14641`'s module, the six composers are reused unchanged, and
  `src/core/prompt-composition.ts` is a read-only dependency, absent from the
  change set unless an amendment says otherwise.
- **M1 — user content could fabricate stale references.** `intro` interpolates
  every Novel's name and description (`:17089-17109`); `badge_briefing`
  interpolates NPC, scene, lore, story, note, and GM-context text. A Novel
  named `manage_dragon` would report forever and §6.5's zero-stale metric could
  never be met by editing prompt source. New D2b: the active and stored Novels'
  user-authored strings are collected once per call, and a candidate token that
  occurs inside that text is dropped as data, not a reference. T152 asserts the
  exclusion with a Novel named after a verb-prefix token.
- **M2 — the `tool_count` leg had no producer.** `visibleToolCount`
  (`:14606`) never applies `packageToolVisible`. D6 now filters
  `visibleToolCount` and `resourceCount` through the same live-set predicate,
  and T7 asserts the drop. `rulesets.removePackage` (`rulesets.ts:743-752`)
  prunes only its own maps, not `toolRegistry` — confirmed, so the report-side
  filter is required.
- **M3 — the monotone seen-set is gone (superseded by v3's D4, which also
  includes the live maps).** D4 is rewritten as a call-time
  *declared* set (REQ-022 catalog ∪ the installed packages' declared
  resources, read from `rulesets.resourceDeclarations`) with presence computed
  from the live maps. No process history, identical across restarts. Absence is
  observable from a declaration whose registration was skipped (a duplicate
  resource `name` inside one package: the second URI is declared, never
  registered), which T153 uses; a removed package's declarations leave with the
  package. REQ-139's acceptance sentence is reworded to this observable
  contract (D9).
- **M4 — two texts were conflated.** D7 now states it explicitly:
  `length`/`within` measure the **served** (budget-applied) text;
  `stale_references` scans the **source** (pre-budget) text.
  `renderHostPromptText` returns `{ source, served }`; for `badge_briefing` the
  composer applies its own budget, so `source === served`; `narrate` is
  unbudgeted, so `source === served`.
- **M5 — REQ-138b's rename lifecycle is unreachable and now reconciled in
  scope.** No runtime tool-rename API exists. D2a keeps the prompt-side
  substitution (behaviourally identical: prompt text names X, registry lacks X
  → entry; registry has X → no entry), and D9 brings the REQ-138b acceptance
  sentence and the Appendix F T152 row into scope so the spec and the Check row
  describe the same lifecycle. The v1 claim "no REQ edit ⇒ no build-order" is
  withdrawn: §5.3 is not a fingerprinted section, so `assemble` is required and
  `build-order` is not.
- **M6 — the SDK does expose deregistration.** `registerTool` /
  `registerResource` return handles whose `.remove()` deletes the registration
  (`mcp.js:556-559`, `:588`, `:679-683`). The host still cannot use tool
  deregistration: `ToolRegistry.define` has no counterpart (`tool-registry.ts:53-84`)
  and `registerPackageTools` re-defines on reinstall, so a removed-then-
  reinstalled package would collide at `define`. D5 keeps the install-set filter
  and states the real constraint; the rejected alternative (handle-based
  deregistration plus a `ToolRegistry.remove`) is recorded. The inaccurate
  comment at `:2588-2590` is corrected.
- **M7 — `resource_count` is reconciled.** D6 filters it through the live set,
  the same predicate as `resource_uris`, so one payload cannot disagree with
  itself.
- **Minors.** Evidence pointer regenerated after the rewrite (m1);
  `registrationFingerprint` description corrected — it hashes tool names, host
  prompt names *and* `packagePrompts.keys()` (`:1428-1436`), so only the tool
  and resource visibility set is missing (m2); T152/T153 are one harness block,
  so two blocks change, T152+T153 and T453 (m3); D3 derives URI schemes from
  the live map and the installed declarations rather than a hardcoded list, so
  `runtime://` is covered (m4); the split allowance is dropped, keeping rollback
  cost 1 (m5); the exclusion predicate is keyed on the registration **name**
  (`pkg:<slug>:<name>`), not the map key, which is the URI (m6).
- **Nits.** The T152 row edit is now unconditional (n1); the report emits the
  REQ-022 catalog's `{id}` template form, and D8 records that REQ-139's `<id>`
  is prose notation for the same thing (n2).

## Questions

1. Which roadmap item is next? `ROADMAP.md:15-27` — *§5.3 prompt-health and
   resource-presence depth (P1)*, the first P1 section and the successor of the
   2026-11-14 citation-repair increment.
2. What does it promise? (a) Implement `stale_references` (REQ-138a/b,
   F-P2-5); (b) derive `resource_uris` from the live resource map (REQ-139);
   (c) filter a removed package's tools out of the live `tools/list`
   (F-P2-6, REQ-389c); (d) extend T152/T153 with both lifecycles.
3. What is the done bar? Green `assemble` + `check:fast`, T152/T153/T453
   asserting the lifecycles, F-P2-5 and F-P2-6 `Resolved`, ROADMAP section
   removed.

## Audit at HEAD (evidence)

| Predicate | What it carries | Consequence |
|---|---|---|
| `holonovel/src/index.ts:14648` | host `stale_references` is `[]` | REQ-138a unimplemented |
| `holonovel/src/index.ts:14659` | package `stale_references` is `[]` | same |
| `holonovel/src/index.ts:14642-14649` | host `length` is `0`, `within` is `true`, no `presence` field | REQ-138a shape incomplete |
| `holonovel/src/index.ts:14627-14637` | `resource_uris` maps the static catalog; only `_registeredResources` (fixed URIs) is read | template registrations never read; presence is catalogue-derived |
| SDK `mcp.js:56-57`, `:576`, `:579-593` | templates live in `_registeredResourceTemplates`; fixed resources in `_registeredResources` keyed by URI; `metadata.mimeType` carries MIME | both maps must be read |
| `holonovel/src/index.ts:1577-1590` | `registeredToolDefinitions()` applies `packageToolVisible` | report paths filtered, served path not |
| `holonovel/src/index.ts:18381-18387` | the served `tools/list` wrapper applies hidden-alias and badge filters only | removed package's tools still list (F-P2-6) |
| `holonovel/src/index.ts:14606`, `:14608` | `tool_count`/`resource_count` ignore the install set | counts disagree with a filtered listing (M2, M7) |
| `holonovel/src/index.ts:1428-1436` | fingerprint hashes tool names, host prompt names, package prompt names | tool/resource visibility changes do not invalidate derived caches |
| `holonovel/src/index.ts:13956-13961` | remove reloads prompts and signals prompt-list change; no tool-list signal | clients are not told |
| SDK `mcp.js:703-704` | registration itself emits `tools/list_changed` | the install path needs no new signal |
| `holonovel/src/rulesets.ts:743-752` | `removePackage` prunes install/hydration/quality maps only | host registry and counts retain the package |
| `holonovel/src/index.ts:17104, 18050, 18065, 18081, 18116, 18138` | six handlers delegate to named composers | D1 is a wrapper, not a body extraction |
| `holonovel/src/index.ts:17089-17109` | `intro` interpolates every Novel's name/description | D2b user-data exclusion required |
| `holonovel/scripts/test-output-contracts.ts:595-611` | T152/T153 are one block asserting shape only | lifecycle legs unasserted |
| `holonovel/scripts/test-output-contracts.ts:2476-2512` | T453 installs/removes a runtime package | the removed-tool leg attaches here |
| `holonovel/src/tool-registry.ts:53-84` | `define` has no remove; `bind` is additive | deregistration is not viable for tools |

Out of scope but observed: Appendix F row T167 (`spec/appendices-reference.md:1670`)
names `spec_health.convergence_summary.prompt_health`, and no
`convergence_summary` exists anywhere in the tree. It is a builder-side §6.5
metric row. Disposition: one `Closed-P3` register row in the AAR.

## Objective

Make the reported surfaces agree with what they claim: a prompt naming an
unregistered tool or resource says so; a declared resource's registration is
visible and its absence is visible; and a removed package leaves the served
`tools/list` and the reported counts.

## Scope

In scope: `holonovel/src/index.ts` (prompt renderer wrapper, stale-reference
detector and user-data exclusion, live resource report, catalog/count filters,
fingerprint, notification, stale comment); two harness blocks in
`holonovel/scripts/test-output-contracts.ts`; two REQ acceptance sentences and
two Appendix F rows; a `holonovel/DECISIONS.md` policy entry;
register/roadmap/changelog bookkeeping; the increment artifacts.

Out of scope: `holonovel/src/core/prompt-composition.ts` (reused unchanged),
`holonovel/src/tool-registry.ts`, `docs/engine-contract.md`,
`convergence_summary`, the §6.5 builder metrics, and any host-tool or action
contract change. No new gate, harness, or pattern-based check is added: the
increment extends the two existing test blocks that already cover the finding
class (existing-check discovery satisfied by extension, not duplication).

## Blast radius

| File | Change | Size |
|---|---|---|
| `holonovel/src/index.ts` | `renderHostPromptText` wrapper; `staleReferencesFor` + user-data exclusion; `resourceURIReport`; count/list filters; fingerprint; `sendToolListChanged`; comment fix | L |
| `holonovel/scripts/test-output-contracts.ts` | T152+T153 block and T453 block extended | M |
| `spec/02-requirements.md` | REQ-138b and REQ-139 acceptance sentences reworded | S |
| `spec/appendices-reference.md` | T152 and T153 rows aligned to the implemented lifecycle | S |
| `holonovel.md` | regenerated by `npm run assemble` | S |
| `holonovel/DECISIONS.md` | one dated decision entry (detection + report policy) | S |
| `spec/audit/review-register.md` | F-P2-5 / F-P2-6 → `Resolved`; one `Closed-P3` row | S |
| `ROADMAP.md` | delete the §5.3 depth section | S |
| `CHANGELOG.md` | dated session entry | S |
| `docs/plans/<date>-s5-3-prompt-health-depth/` | plan/tasks/aar | S |

## Design decisions

- **D1 — one wrapper over the existing composers, and one budget owner.** Add
  `renderHostPromptText(name, opts): { source, served }` in `index.ts` beside
  the prompt registrations. `opts` carries `{ mutate?: boolean }`; the wrapper
  also owns the per-prompt **input assembly** the handlers hold today —
  `intro`'s library lines, `badge_briefing`'s active Novel, `narrate`'s two
  literal no-Novel/Editor branches, `session_zero`'s roster count and adventure
  index, `novel_setup`'s step marks, and `run_workflow`'s badge-filtered
  `toolNames` — so a handler cannot assemble one body while health scans
  another. It calls the existing composer unchanged
  (`composeIntro`, `composeBadgeBriefing(novel, { mutate })`,
  `composeNarrationClearance`, `composeSessionZero`, `composeNovelSetup`,
  `composeRunWorkflow`) to produce `source`, then applies
  `applyPromptBudget(source)` to produce `served` for the four budgeted prompts.
  The wrapper is the **only** caller of `applyPromptBudget` on the prompt path;
  handlers consume `.served` and no longer budget. `badge_briefing` returns
  `source === served` (its composer budgets internally, `:18038`) and
  `narrate` returns `source === served` (unbudgeted, `:18053-18066`).
  `badge_briefing` takes `{ mutate }`; health passes `false` (the
  REQ-232b/REQ-606 read-surface precedent at `:13746-13748`). No composer is
  edited, so `src/core/prompt-composition.ts` is not in the change set.
- **D2 — the detector is scoped to tool-name grammar.** A blanket snake_case
  scan would flag `max_hp`, `event_log`, and `game_master` and could never
  satisfy the §6.5 zero-stale metric (`spec/03-build.md:757`). A token counts as
  a tool reference when it matches
  `^(manage|resolve|run|set|open|close|take|respond)_[a-z0-9_]+$` or equals a
  live package tool name. It is stale when it is not a *registered* tool name
  at call time. Registered includes the hidden REQ-581 tombstones
  (`manage_session`, `resolve_fate`, `resolve_ironsworn`, `resolve_forged`):
  they still serve a refusal naming the replacement, so naming one is not
  broken output and must not be reported.
- **D2a — the mismatch is driven from the prompt side.** A host tool cannot be
  renamed at runtime, so the harness varies the reference: a package prompt
  naming a name absent from the registry reports it; a package prompt naming a
  registered tool reports `[]`. The observable REQ-138b asserts is identical.
  REQ-138b's acceptance sentence is reworded to that observable (D9).
- **D2b — user-authored text is excluded.** `userAuthoredText()` collects the
  stored Novels' names and descriptions plus the active Novel's scene text,
  lore/NPC/room/thing/entity names and descriptions, story entries, notes, and
  GM-context strings. A candidate token occurring inside that text is data, not
  a reference, and is dropped. The collection is read-only and per call.
  **Accepted tradeoff, stated plainly:** if a prompt in the source names a dead
  tool *and* the same token happens to occur verbatim inside user data, the
  report — and therefore the §6.5 metric, which uses this same detection
  (`spec/03-build.md:776-778`) — masks it. The mitigation is that prompt
  references are authored in prompt source, not in Novel names, and that T152
  asserts the source-side lifecycle on package prompts (author data, never
  excluded), so the exclusion cannot make the detection path untested. The
  alternative — scanning only non-interpolated segments — requires changing
  every briefing section renderer and is out of scope. Recorded in
  DECISIONS.md.
- **D3 — resource references are URI tokens with a known scheme.** The scheme
  set is derived per call from the live registrations, the REQ-022 catalog, and
  the installed packages' declared resource URIs — no hardcoded list, so
  `runtime://` and any future package scheme are covered. `https://` (the spec
  repo URL in `intro`) is not in the set. Template matching is parameter-aware:
  `{id}` matches one non-slash segment.
- **D4 — the drawn set is call-time; presence is live.** `resource_uris` lists
  the union of (a) the REQ-022 catalog, (b) every installed package's declared
  resource URIs (`rulesets.resourceDeclarations(slug)`), and (c) the live fixed
  and template registrations (`_registeredResources`,
  `_registeredResourceTemplates`), in catalog-then-sorted order. Live-only host
  entries outside the catalog (`ruleset://`, `adventure://`, `identity://`,
  `causal://state`, `holonovel://tool-groups`, …) therefore appear. Presence is
  computed from the live maps; a `pkg:<slug>:<name>` registration counts only
  while `<slug>` is installed, although removal now deregisters it anyway (D5).
  No state is accumulated between calls. A declared URI whose registration was
  skipped (a duplicate resource `name` inside one package leaves the second URI
  unregistered) reports `absent`; removing a package removes its declarations
  and its registration, so its entry leaves the report.
- **D4a — the count agrees with the list.** `resource_count` is the number of
  entries whose `presence` is `present` — the same predicate, computed once.
- **D5 — tools stay filtered; package resources are deregistered.** The SDK
  exposes deregistration handles for both, but the tool path cannot use them:
  `ToolRegistry.define` has no remove (`tool-registry.ts:53-84`) and
  `registerPackageTools` re-defines on reinstall, so a removed-then-reinstalled
  package would collide at `define`. The install-set filter therefore stays for
  tools. Package *resources* have no such registry: `registerPackageResources`
  keeps the returned handle in a per-slug map, removal calls `handle.remove()`
  (which deletes the registration) and clears the slug's `packageResourceKeys`
  entries, so reinstall re-registers without a duplicate-name throw. This
  implements REQ-389c's resource half rather than filtering it. The inaccurate
  comment at `:2588-2590` is corrected. Rejected alternative: handle-based tool
  deregistration plus a new `ToolRegistry.remove` (larger surface, no
  demonstrated need).
- **D6 — one canonical-catalog helper; counts and caches follow it.**
  `canonicalToolCatalog(tools)` = `stripHiddenCatalog` + `packageToolVisible`,
  used by the served handler (`:18381`) and `warmCatalogCache` (`:18359`).
  `visibleToolCount` (`:14606`) and `resourceCount` (`:14608`) use the same
  predicates. `registrationFingerprint` gains the sorted installed slugs so
  `metadataCache`/`tdqsHealthCache` follow install state. `remove` calls
  `sendToolListChanged`; `install` needs nothing because SDK registration
  already emits it (`mcp.js:703-704`).
- **D7 — `length`/`within` measure the served text; the scan uses the source
  text.** Both come from the one `renderHostPromptText` call (D1), so a health
  entry can never describe two differently-produced bodies. Health reports
  `length = served.length`, `within = length <= briefingBudget()`, and scans
  `source` for stale references (§6.5 scopes the metric to prompt source, and a
  budget-dependent report would be env-sensitive). For `badge_briefing` and
  `narrate`, `source === served`. **`within` is advisory for `badge_briefing`**:
  its composer budgets the body at `:18038` and then appends the never-truncated
  intro pointer and briefing-consistency footer (`:18041-18045`), so the served
  length can exceed the budget by construction. T152 asserts that `within`
  exists for every prompt and is `true` only for the four budgeted prompts;
  `badge_briefing` reporting `exceeded` is recorded, not treated as a fault.
- **D8 — prompt-health shape.** Host and package entries become
  `{ name, present, presence, length, budget, within, stale_references }`;
  package entries keep `source`. The report emits the REQ-022 catalog's
  `{id}` template form; REQ-139's `<id>` notation is prose for the same thing.
- **D9 — two REQ acceptance sentences and two Appendix F rows are reconciled in
  scope.** REQ-138b's "renaming a tool … restoring the tool name" becomes the
  reachable lifecycle (a prompt whose text names an unregistered tool reports
  it; a prompt naming a registered tool reports none). REQ-139's "removing a
  resource changes its presence to `absent`" becomes the pair the
  implementation actually offers: a declared URI with no live registration
  reports `absent`, and an uninstalled package's resources leave the report.
  The resource-deregistration requirement itself (REQ-389c) is implemented, not
  reworded (D5). Both edits are single-sentence replacements inside the existing
  paragraphs; T8 records each paragraph's before/after character and sentence
  counts, and `npm run validate -- --sdd-strict` is the authority on the limits
  (Appendix M). §5.3 is not a fingerprinted section, so `npm run assemble` is
  required and `build-order` is not. The policy itself lands in DECISIONS.md,
  not the REQ bodies.

## Phases

0. **Probe before code (false-positive budget).** Enumerate every
   grammar-matching token and every resource-scheme URI in the six rendered
   host bodies at HEAD, classify each as live / tombstone / absent / user-data,
   and paste the classification into the AAR. Because the done bar asserts zero
   stale references across host prompts, an unexpected absent token is a finding
   to fix in the prompt source or the grammar before the assertion is written.
1. **Renderer wrapper (D1, D7).** Add `renderHostPromptText` as the sole budget
   owner; rewrite the six handlers to consume `.served`; rewrite `prompt_health`
   to report `served` length/`within` and scan `source`. Verify the existing
   T152 shape leg still passes.
2. **Detector (D2, D2a, D2b, D3).** `staleReferencesFor` + `userAuthoredText`;
   wire into both prompt-health branches.
3. **Resource report (D4, D4a).** `resourceURIReport` over catalog ∪ installed
   declarations ∪ live maps; replace `:14627-14637`; reconcile `resource_count`.
4. **Catalog, count, and deregistration (D5, D6).** `canonicalToolCatalog`, the
   count predicates, resource-handle deregistration on removal,
   `packageResourceKeys` cleanup, fingerprint addition, `sendToolListChanged`,
   comment fix.
5. **Harness (T152+T153, T453).** Extend the two blocks as described in
   `tasks.md`.
6. **Reconcile and close (D9).** Two REQ sentences, two Appendix F rows,
   DECISIONS entry, register rows, ROADMAP deletion, CHANGELOG, AAR.

## Edge cases

- No active Novel: `badge_briefing` renders the Editor body, `narrate` the
  no-Novel text; both must scan clean.
- Player badge: `run_workflow` is badge-filtered, so a GM-only name is absent
  from the scanned text by design. `prompt_health` is not badge-gated
  (REQ-138b); T152's Player leg asserts the stale lists stay empty, so no
  GM-only name leaks through them.
- A Novel named or described with a verb-prefix token: excluded by D2b; T152
  asserts it.
- A package prompt naming a tool the same package registers: the registry holds
  `slug_toolname`, so a bare reference reports stale. Documented in
  DECISIONS.md; the fixture packages name host tools only.
- A package prompt whose budget truncates the stale name: the declared text is
  scanned, not the truncated body (T155 covers truncation).
- A resource declaration with an empty `name` is skipped at registration; it
  carries no URI to report, so it contributes nothing.
- `spec_health` is computed per request (`:12291`); the T152/T153 assertions
  read health after the install/remove, never before.
- The declared-resource read touches `resources.json` per installed package per
  health call. That is the same order as the existing `indexForReport` read and
  is acceptable for a diagnostic surface; noted for the performance record.

## Open questions

1. Should the stale-reference list report the *replacement* name? No — REQ-138a
   asks for the names that do not match; the replacement is a different surface
   (`spec_health.tool_surface`). Recorded, not implemented.
2. Is anything else pinned to the `resource_uris` or `prompt_health` shape? No:
   `grep -rn "resource_uris\|prompt_health" holonovel/src holonovel/scripts
   scripts/` yields one producer, the T152/T153 consumer block, and T453's
   package-prompt entry lookup. The change is additive.

## Verification

- Phase 0 probe output pasted into the AAR (tokens per prompt, classified).
- `npm --prefix holonovel run test:output-contracts` (T152/T153/T453);
  `test:security`, `test:tool-surface`, `test:briefing`,
  `test:tool-definitions`, `test:holosuite-conformance` for surface
  regressions.
- `npm run assemble`, then `npm run validate` (REQ shape and cross-references
  for the two edited bodies), then `npm run check:fast` un-piped; the tell is
  `check:fast: PASS`.
- `npm run validate -- --write-register` and inspect the diff: expected empty
  (Appendix F IDs are unchanged).
- `npm run typecheck`.
- Sibling-contract grep before editing: read REQ-389a/389b and REQ-138a to
  confirm no conflicting contract binds the same fields.
- Manual: `manage_diagnostics (action: health)` on a GM badge with one Novel
  active — every host prompt reports `stale_references: []`, and template
  entries report `present` with `name`/`mime_type`.

## User impact

One diagnostic payload changes shape: `prompt_health` entries gain `presence`
and real `length`/`within`; `resource_uris` entries gain `name`/`mime_type`
when present, gain declared package resources, and gain live entries outside
the REQ-022 catalog (`ruleset://`, `adventure://`, `holonovel://tool-groups`,
`identity://`, `causal://state`); `resource_count` and `tool_count` report the
servable set. A removed package's tools leave the served `tools/list` instead
of failing at dispatch — the case REQ-389c already requires. No tool, action,
schema, or state-format change; no restart or migration.

## Rollback

One `git revert` of the increment commit. Nothing persisted, no data-format or
fingerprint change. If only the catalog filter proves disruptive, D5/D6 can be
reverted independently — it is the only change that alters a served surface.

## Alternatives considered

- **Blanket snake_case scanning.** Rejected (D2): the briefing carries state
  field names and the badge value, so every GM health call would report false
  stale references.
- **Scanning the composed templates instead of the render.** Rejected (D2b
  takes the cheaper route): the composers are code, not templates, so this
  means changing `prompt-composition.ts` and every briefing section; excluding
  user-authored strings is one collector and leaves the composers untouched.
- **Rendering `badge_briefing` with `mutate: true`.** Rejected: a read-only
  diagnostic must not advance pacing autonomy (`:17998`).
- **History-based presence (a monotone seen-set).** Rejected (M3): it makes
  `spec_health` a function of call history and disagrees across restarts.
  Declared-set plus live-map presence gives the same observable absence
  deterministically.
- **Handle-based deregistration for package tools and resources.** Rejected
  (D5): `ToolRegistry.define` has no remove and reinstall would collide.
- **Keeping `resource_uris` catalogue-only with a separate live section.**
  Rejected: REQ-139 says the list *is* the presence report.

## Deferred / scheduled

- `convergence_summary.prompt_health` (Appendix F T167): unimplemented and the
  token collides with REQ-167. Disposition: one `Closed-P3` register row.
- Stale-reference reporting for a package tool named without its `slug_`
  prefix: recorded, not implemented.
- Deregistration handles and a `ToolRegistry.remove`: recorded as a future
  cleanup (not scheduled; no demonstrated failure).

## Done bar

**Done bar:** T152/T153/T453 assert both lifecycles and pass, `assemble` + `check:fast` are green, F-P2-5 and F-P2-6 are `Resolved`, and the ROADMAP section is gone.

1. `prompt_health[*].stale_references` is computed from the source text: a
   package prompt naming an unregistered name reports it, a package prompt
   naming a registered tool reports `[]`, and a Novel named after a verb-prefix
   token reports `[]` (T152, D2a/D2b).
2. Host prompts report `presence: "present"`, a non-zero `length` measured from
   the served text, and a `within` flag from the REQ-118 budget (T152, D7).
3. `resource_uris` lists every REQ-022 template (`{id}` form) with a live
   presence, lists the live-only host entries outside the catalog
   (`holonovel://tool-groups`, `ruleset://{slug}/{anchor}`), reports
   `name`/`mime_type` when present, adds an installed package's declared
   resource immediately, reports a declared-but-unregistered URI as `absent`,
   and drops an uninstalled package's entry (T153, D4).
4. A removed package's tool is absent from `tools/list(scope=all)` and from
   `spec_health.tool_count`; its resources leave `resource_uris` and
   `resource_count` (T453, D5/D6).
5. `npm run assemble && npm run check:fast` prints `check:fast: PASS` un-piped.
6. F-P2-5 and F-P2-6 are `Resolved`; the two REQ sentences and two Appendix F
   rows are reconciled; the ROADMAP section is removed; `CHANGELOG.md` carries
   the session entry; `aar.md` ends `LOOP PAUSED`.
