# Plan — §5.16/§5.17 ruleset surface remediation (F-P6b-9, -10, -11, -12, -16, -20)

Status: draft, awaiting plan review · Kind: planned · Depth: standard
Increment: `docs/plans/2026-11-10-5-16-5-17-ruleset-surface-remediation/`
Rollback cost: 1 (reversible edits; one commit)

## 1. Objective

Close the six remaining ruleset-surface findings from the 2026-11-09 full-review
sweep, whose remediation is the top open roadmap item
(`ROADMAP.md:15-34`). The item is **24 REQs in three roadmap bullets**; this plan
executes all three as three delivery slices that mirror the bullets.

**Done bar** (no conditional clauses; each item names its command or artifact)

1. F-P6b-9, F-P6b-10, F-P6b-11, F-P6b-12, F-P6b-16, and F-P6b-20 are
   `Resolved` in `spec/audit/review-register.md`, each with a post-change
   `file:line` predicate that resolves on the committed tree. F-P6b-9's
   `ruleset://` clause is split into a new finding `F-P6b-9a`, scheduled under
   bullet 3 and resolved in slice C; its governing REQs are REQ-012 and
   REQ-214a, not REQ-389c (D8).
2. `ROADMAP.md` retires `§5.16/§5.17 ruleset surface remediation (P1)` on a
   complete landing; on a partial landing the section is re-scoped to the
   remaining bullet(s) and its `**Trigger:**` names the resume point, keeping
   the admission shape (`check-roadmap`).
3. Every REQ in the item's 24-REQ set is either **implemented and exercised**
   by an assertion carrying an Appendix F token, or is **re-scheduled with a
   named roadmap row** in this increment (no silent drop). The set:
   REQ-379b, REQ-379c, REQ-381b, REQ-381c, REQ-382b, REQ-382c, REQ-383a,
   REQ-383b, REQ-385a, REQ-385b, REQ-380c, REQ-384b, REQ-384c, REQ-386a,
   REQ-386b, REQ-387a, REQ-387b, REQ-389c, REQ-390b, REQ-391c, REQ-430,
   REQ-432a, REQ-432b, REQ-558.
4. `tools/list` reports a `ruleset` value (`<slug>` or `null`) on every entry,
   and `_meta.inapplicable: true` on mismatched-ruleset entries under
   `scope=all`.
5. `spec_health` reports `ruleset_health` keyed by installed slug with a
   `combined` summary (total tools, resources, prompts, active Novel count,
   prefix map), Player-filtered per REQ-383b; the installed index byte total is
   reported without hydrating a package.
6. `npm --prefix holonovel run test:ruleset-surface-remediation` passes with the
   new assertions; `test:output-contracts`, `test:tool-surface`,
   `test:ruleset-nonovel`, `test:ruleset-gates`, and `test:update-workflow`
   pass.
7. `npm run check-registers:strict`, `check-roadmap`, and
   `check-loop-artifacts` pass;
   `npm run validate -- --write-register` produces no new bucket-A row.
8. `npm run assemble && npm run check:fast` reports `check:fast: PASS`
   un-piped; `npm run build-order` completes.
9. One commit, subject derived by `npm run session:close` from the
   `CHANGELOG.md` heading. No push.

## 2. Verified baseline (2026-11-10, HEAD `e68ed2e`)

Re-verified this session. Line anchors are HEAD-relative and **advisory**; §4.0
re-derives them.

| # | Evidence | Source |
|---|---|---|
| EV1 | `npm run status`: version `2026.11.10`, **38 unpushed commits**, oldest 38.4 h, **19 open roadmap items**; tree clean | tool output |
| EV2 | `npm run check:fast` un-piped: **37 passed / 0 failed**, trailing `check:fast: PASS` | tool output |
| EV3 | Top roadmap item is the ruleset-surface remediation; its three bullets name 24 REQs and it closes on F-P6b-9/-10/-11/-12/-16/-20 | `ROADMAP.md:15-34` |
| EV4 | Findings' predicates: F-P6b-9 (`ROADMAP.md:1365-1372`), F-P6b-10 (`:1373-1380`), F-P6b-11 (`:1381-1384`), F-P6b-12 (`:1385-1391`), F-P6b-16 (`:1406-1409`), F-P6b-20 (`:1423-1426`) | `spec/audit/review-register.md` |
| EV5 | Package tools carry the slug only inside the description suffix (`(ruleset: ${slug})`, `index.ts:2319`); `rulesetAnnotations` returns the four MCP hints alone (`rulesets.ts:278-286`); no `ruleset` tool property exists | repo |
| EV6 | No `inapplicable` token anywhere in `holonovel/src`; `scopedCatalog` (`index.ts:1499-1508`) filters by name prefix and a missing Novel leaves the full catalog; `scope=all` returns it unfiltered | repo |
| EV7 | `ruleset_prefix_map` appears only as a GM-only field (`index.ts:12312`); `prefixMap()` is identity slug→slug (`rulesets.ts:492-496`); no prefix map in `holonovel/DECISIONS.md` | repo |
| EV8 | No `ruleset_health` and no `combined` section. Existing health carries a single global `confidence` (`index.ts:12266-12305`), `indexed_counts` with seven zero fields (`:12402-12410`), `must_action_coverage: "100% (infrastructure only)"` (`:12411`), `defect_count: 0` (`:12413`), `rulesets_installed`/`rulesets_hydrated` (`:12298-12299`) and no index-byte total | repo |
| EV9 | `indexForReport(slug)` reads a package index without hydrating it, cached by mtime/size (`rulesets.ts:583-603`); `RulesetManifest.counts` exists (`rulesets.ts:28`); no `must_action_coverage` or verification/disposition field on the manifest | repo |
| EV10 | `run_command (action: suggest)` builds generic prose blocks only (`index.ts:4713-4780`); it never emits a package-prefixed tool name | repo |
| EV11 | `bindNovelRuleset` refuses an existing binding but checks no mechanics state (`state.ts:1272-1282`); the handler audits nothing itself (`index.ts:11639-11652`) | repo |
| EV12 | `switchNovel` changes the active id and applies the env badge with no audit (`state.ts:1679-1690`); the handler audits nothing (`index.ts:10958-10978`) | repo |
| EV13 | Archive export manifest carries `ruleset_hash` but no `ruleset` slug (`index.ts:11038-11046`); archive import validates integrity/refs but never the incoming `ruleset` (`index.ts:11076-11200`) | repo |
| EV14 | `CodexEntry` has no `ruleset` field (`state.ts:491-504`); `codexImportPrecheck` rejects by kind/target only (`index.ts:13651-13672`); the codex schema has no `ruleset` parameter (`index.ts:13720-13760`) | repo |
| EV15 | Runtime `manage_ruleset (action: install)` installs, audits, and reloads prompts but registers no tools (`index.ts:11584-11602`); package tools are registered by a startup-only loop (`index.ts:2299-2335`). Removal hides tools through `packageToolVisible` (`index.ts:1968-1971`) | repo |
| EV16 | `manage_ruleset (action: list)` already reports `state`, `licensed`, `source_license`, `creator`, `attribution` (`index.ts:11604-11627`) | repo |
| EV17 | `APPENDIX_U_LICENSES` (`rulesets.ts:45-53`) carries `CC BY 4.0 + OGL 1.0a` and `OGL 1.0a`, which no Appendix U row authorizes, and omits `CC BY 4.0 / CC0 1.0` (COF, `appendices-licenses.md:21`) | repo |
| EV18 | No `nextCursor` or page-size handling in the `tools/list` wrapper (`index.ts:15103-15160`); MCP pagination is unimplemented | repo |
| EV19 | No exported resource whose URI scheme is `ruleset://`; `search` still points at `ruleset://${slug}/${anchor}` (`index.ts:11566`) and REQ-012/T4 promise it (`02-requirements.md:350-353`) | repo |
| EV20 | The source registry already records `source`, ordered `sources[{path, role}]`, `emitter`, `emitter_args`, `package_format`, `built_at`, `base_content_hash`, and `supplements` (`scripts/lib/ruleset-registry.ts:22-31`), and no `source_license` | repo |
| EV21 | `PACKAGE_SECTIONS` = §5.16, §5.17, §6.3, §6.4.2 (`scripts/lib/contract-fingerprint.ts:27`), so a §5.16/§5.17 REQ-body edit invalidates every installed package's `package_format` | repo |
| EV22 | An existing harness already asserts REQ-389c removal, REQ-380a/c dispatch refusal, REQ-389b health rejection, and idle list state: `holonovel/scripts/test-ruleset-surface-remediation.ts:93-140`, wired into `test:all` (`run-test-suite.ts:44`) but **not** into the gate manifest | repo |
| EV23 | Citation presence probe over `holonovel/scripts` (presence only, not exercise): present — T441, T452–T456, T512, T517, T648, T651, T688; absent — T440, T442–T448, T451, T457, T458 | repo |
| EV24 | T431 is the Pattern Buffer traceability test for REQ-376 (`appendices-reference.md:1886`), not a codex ruleset test; **T448** (`:1903`, REQ-387) is the codex ruleset row and is unexercised. No new token is minted (D9) | repo |
| EV25a | T688 (`test-selection.ts:228-235`) asserts only that a truncated result *carries* a `ruleset://` pointer; nothing reads the URI, and no `ruleset://` resource exists (EV19) — a false citation the plan closes by making the pointer resolve | repo |
| EV25 | Multi-package harnesses already install synthetic packages at runtime and drive `tools/list(scope=all)` (`test-output-contracts.ts:1749-1756`, `test-ruleset-nonovel.ts:200`); the on-disk fixture package is `holonovel/testdata/rulesets/fixture` | repo |

## 3. Decisions

- **D1 — The `ruleset` annotation is carried in `_meta`, and that reading is
  recorded as a spec interpretation.** Every listed tool gains `_meta.ruleset`
  (`<slug>` or `null`) and, under `scope=all` on a mismatched tool,
  `_meta.inapplicable: true`. T536 (`test-security.ts:240-244`) asserts the
  four hint booleans are present and boolean; it does not forbid a fifth key,
  so `annotations.ruleset` is *permitted*, not impossible. `_meta` is chosen
  because it is the MCP extension slot already used for `deprecated`
  (`index.ts:10332`) and keeps the transport hint contract unchanged. The
  spec's word "annotation" is satisfied by a `tools/list` entry that reports
  `ruleset` (T440 asserts exactly that); the interpretation is recorded in
  `holonovel/DECISIONS.md` so the wording is not left implicit.
- **D2 — "Mechanics-derived state" (REQ-380c)** means any of: an entity with a
  non-empty `stats` object; an entity with non-empty `conditions` or
  `condition_rounds`; an active `novel.combat`. Inventory alone is excluded
  because ruleset-free play populates it (`state.ts:220-240`). Recorded in
  `holonovel/DECISIONS.md`.
- **D3 — Per-package health fields without build data report
  `"not-declared"`, never a fabricated value.** `must_action_coverage` and
  `verification_dispositions` are optional manifest fields
  (`RulesetManifest`, `rulesets.ts:17-40`); a package that does not carry them
  reports `"not-declared"`, which is a present field, not a missing one. No
  §5.16/§5.17 REQ body is amended (EV21). Recorded in DECISIONS.
- **D4 — The license set is Appendix U's exact value set.** Add
  `CC BY 4.0 / CC0 1.0`; drop the two OGL composites no row authorizes. A
  parity assertion (Appendix U license column ⊆/⊇ constant) lives in
  `test-ruleset-gates.ts`, extending an existing harness rather than adding a
  gate (existing-check discovery: no license-set parity check exists).
- **D5 — `build-ruleset` writes `source_license` into the registry entry and
  the emitted manifest.** The registry's `sources[].role` already satisfies
  REQ-421's recipe-role clause (EV20); only the license field is added, and it
  is a REQ-432a concern, not a REQ-421 gap.
- **D6 — Pagination is a byte budget with an opaque offset cursor.** The
  wrapper measures the projected page; over
  `TTRPG_TOOLS_LIST_MAX_BYTES` (default `262144`) it slices at a tool boundary
  and returns `nextCursor` = the next offset. A cursor is valid only for the
  same scope/profile/group; an unknown cursor is `[INVALID_INPUT]`. Recorded in
  DECISIONS with the default.
- **D7 — Suggest scoping matches package tool names, then falls back to prose.**
  Mechanical intents resolve against the active package's declared `actions`
  model entries and emit `<slug>_<tool>`; when the package declares no matching
  tool the existing prose suggestion stays (REQ-385a's catalogue is "drawn from
  the active Novel's ruleset model", not "must never be prose"). No Novel
  active → `[ERROR] [STATE_CONFLICT]` naming `manage_novel (action: create)`.
- **D8 — `ruleset://` is a resource template backed by the package index.**
  `ruleset://{slug}/{anchor}` resolves an index entry by id or anchor and
  badge-filters per the entry's category; the search pointer (EV19) then
  resolves. Its governing REQs are REQ-012 and REQ-214a, not REQ-389c; the
  roadmap bullet's token is corrected in the same step.
- **D9 — No new Appendix F rows.** The codex contract already has **T448**
  (`appendices-reference.md:1903`, REQ-387) and the `ruleset://` resolving
  pointer already has **T688** (`:2159`, REQ-588); T448 has no assertion
  (EV23) and T688 only checks that the pointer text is printed (EV25a). This
  plan exercises T448 and widens T688 from "the pointer is printed" to "the
  pointer resolves", which closes a false citation instead of minting a
  parallel row. T431 stays REQ-387b's cited
  token: re-pointing it would edit a §5.16 REQ body and invalidate every
  installed package's `package_format` (EV21), so the re-point belongs to the
  separately scheduled `§5.16–§5.18 citation repair` item.
- **D10 — Test home is `test-ruleset-surface-remediation.ts`**, which already
  owns the P6b predicate class (EV22); the new assertions extend it rather than
  starting a second harness.

## 4. Work items

### 4.0 Preflight (S, blocking)

- **Files:** none (read-only).
- **Design:** run `npm run status`, `npm run check:fast`, and
  `npm --prefix holonovel run test:all`; record the baseline. Re-derive every
  §2 anchor with `rg -n` against the live tree and reconcile the site *set*
  (line numbers are not the contract). Confirm
  `npm run test:ruleset-surface-remediation` is green before editing. Confirm
  `git check-ignore -v docs/plans/2026-11-10-5-16-5-17-ruleset-surface-remediation/`
  returns nothing. Record the plan-gate evidence sidecar per the plan-review
  skill.
- **Expectation reconciliation (same step):** open the body of every harness
  this plan extends — T441/T453/T454/T455 in `test-output-contracts.ts`,
  T512/T648 in `test-tool-definitions.ts`, T517 in `test-competitive-gaps.ts`,
  T651 in `test-ruleset-nonovel.ts` — and reconcile each assertion with its
  Appendix F row before editing. A row that promises more than the harness
  asserts is aligned to the assertion (Appendix F prose) or the assertion is
  widened; nothing is assumed.
- **Sibling-contract check (same step):** grep the REQ corpus for every action
  whose contract this plan changes — `manage_ruleset (action: install)`,
  `manage_ruleset (action: bind)`, `manage_novel (action: switch)`,
  `run_command (action: suggest)`, `manage_archive (action: import|export)`,
  `manage_codex (action: set|capture|list|import)` — and confirm no sibling REQ
  binds an incompatible contract. A conflict stops the plan for amendment.
- **Tests:** none.

### 4.1 Slice A — scope, annotation, health, suggest (M)

Covers REQ-379b, REQ-379c, REQ-381b, REQ-381c, REQ-382b, REQ-382c, REQ-383a,
REQ-383b, REQ-385a, REQ-385b (F-P6b-9, F-P6b-11).

- **Files:** `holonovel/src/index.ts`, `holonovel/src/rulesets.ts`,
  `holonovel/src/core/surface-projection.ts` (only if the projection must
  preserve `_meta`), `holonovel/scripts/test-ruleset-surface-remediation.ts`,
  `holonovel/DECISIONS.md`, `spec/appendices-reference.md` (T440/T442–T446 rows
  already exist; description alignment only).
- **Design:**
  1. `rulesetOfTool(name, registeredPackageSlugs)` → slug or `null`; apply to
     every entry in the `tools/list` wrapper (`index.ts:15103-15160`), so host
     tools report `null` without editing 37 registrations.
  2. Under `scope=all`, mark an entry `_meta.inapplicable: true` when its
     ruleset is non-null and differs from `state.activeNovel?.ruleset`; no
     Novel active ⇒ no marks.
  3. `spec_health.ruleset_health`: build per slug from `manifests()`,
     `indexForReport(slug)` (non-hydrating, EV9), and
     `toolQualityAlerts()`/`incompatibleSlugs()`; fields: `confidence`
     (overall + per_file), `indexed_counts` (anchors from the index plus each
     manifest `counts` key), `must_action_coverage`, `defect_count`,
     `verification_dispositions` (D3 for the last two when absent).
  4. `combined`: total tool count (registered definitions), total resource
     count, total prompt count, active Novel count, and
     `ruleset_prefix_map`. Keep the top-level `ruleset_prefix_map` for
     compatibility and add the same map to `combined`.
  5. Player filtering: when the badge is `player`, `ruleset_health` contains
     only the active Novel's slug section (no section when no Novel is active);
     `combined` is always present.
  6. `run_command (action: suggest)`: resolve matched intents against the
     active package's `model.actions` declarations and emit
     `<slug>_<tool>(action: ...)` suggestions; keep parser suggestions as
     infrastructure; keep prose when no package tool matches; return
     `[STATE_CONFLICT]` when no Novel is active (D7).
  7. `holonovel/DECISIONS.md`: record the prefix→slug map (REQ-379b), D1, D3,
     D7, and refresh the action/token counts if `_meta` moves the footprint.
     `_meta` grows every entry, so the measured default listing changes; run
     `npm run surface-budget --write` when it does, and assert T459
     (`tools_list_bytes`) still reflects the untruncated default listing.
  8. Slice close-out: flip F-P6b-9 and F-P6b-11 to `Resolved`; add
     **F-P6b-9a** (`ruleset://` resource absent, REQ-012/REQ-214a) as a
     `Scheduled-roadmap` row; add REQ-389c to F-P6b-16's row (declared package
     resources are lifecycle work); amend roadmap bullet 3 so it names REQ-012 and
     REQ-214a (D8); remove bullet 1.
- **Tests:** extend `test-ruleset-surface-remediation.ts`:
  - **T440** — two synthetic packages; `tools/list(scope=all)` reports
    `_meta.ruleset` per entry, `null` for infrastructure, and the prefix map
    covers both slugs.
  - **T442** — cross-ruleset call refusal in both directions; no Novel ⇒ both
    callable; `inapplicable` marks only under an active Novel.
  - **T444** — `ruleset_health` per-slug independent counts and `combined`;
    Player badge sees only the active slug; no Novel ⇒ no per-slug sections.
  - **T443** — search isolation in both directions with source anchors.
  - **T446** — suggest emits `<slug>_<tool>` for a matching mechanical intent,
    never the other slug; parser suggestions survive; no Novel ⇒
    `[STATE_CONFLICT]`.
- **Risk:** `_meta` on tool entries passes through `projectToolList`'s spread
  (`surface-projection.ts:120-167`); if a profile drops unknown keys, patch the
  projection and re-run `test:tool-surface`.

### 4.2 Slice B — identity, import/export, codex (M)

Covers REQ-380c, REQ-384b, REQ-384c, REQ-386a, REQ-386b, REQ-387a, REQ-387b
(F-P6b-10).

- **Files:** `holonovel/src/core/state.ts`, `holonovel/src/index.ts`,
  `holonovel/scripts/test-ruleset-surface-remediation.ts`,
  `holonovel/scripts/test-output-contracts.ts` (T441 lives there),
  `spec/appendices-reference.md` (T448 description alignment only).
- **Design:**
  1. `bindNovelRuleset` refuses `[STATE_CONFLICT]` when D2's mechanics state
     exists, naming the state class and the corrective action (bind is one-way);
     the refusal writes no state and no audit entry.
  2. `manage_novel (action: switch)` audits both endpoints:
     `{ from: { slug, ruleset }, to: { slug, ruleset } }` on the destination
     Novel; the audit entry is persisted with the switch. Switching back
     restores the scope because each Novel keeps its own `ruleset`.
  3. Archive import validates the incoming `ruleset` (when present and
     non-null) against `prefixMap()`; unknown ⇒ `[INVALID_INPUT]` with the
     valid slugs enumerated. Character import compares the roster entry's
     `ruleset` with the active Novel's ⇒ mismatch `[STATE_CONFLICT]` naming
     both. **The roster carries no ruleset today** (`state.ts:868-872`,
     `RosterEntity`), so this step also adds optional
     `RosterEntity.ruleset?: string | null`, written on `manage_character
     (action: create|stage)` from the active Novel's scope and preserved across
     roster import/export. The field is additive: the data-format fingerprint
     is spec-derived (`contract-fingerprint.ts:37-39`), so an older save reads
     as `null` and no migration is required; recorded in DECISIONS.
  4. Archive export manifest gains `ruleset: novel.ruleset ?? null`.
  5. `CodexEntry.ruleset?: string | null`; `set` defaults to the active Novel's
     scope and honours an override; `capture` defaults to the source Novel's
     scope; `list` accepts a `ruleset` filter returning matching entries plus
     `null`; `import` prechecks against the active Novel's scope and refuses a
     mismatched entry with `[STATE_CONFLICT]` naming both (and shows only
     matching/null entries when listing import candidates).
  6. Exercise **T448** (the existing codex-ruleset row, `:1903`): set
     default, capture default, list filter, and mismatched-import refusal.
     REQ-387b's `_Check:_` is **not** edited (EV21); the T431 re-point is the
     citation-repair item's step.
- **Tests:** extend the harness:
  - **T441** (extend in `test-output-contracts.ts`, where the token already
    lives — no duplicate ID) — a Novel with `stats` refuses the bind, the
    refusal writes no state and no audit entry, and a ruleset-free Novel binds
    and gains tools.
  - **T451** (new assertion under the existing row) — the bind is audited, a
    second bind is `[STATE_CONFLICT]`, and resume restores the migrated
    binding.
  - **T445** — switch D&D↔Starfinder changes the tool surface, audits both
    switches with both rulesets, and leaves the other Novel's state unchanged.
  - **T447** — export includes `ruleset`; unknown-slug import is refused with
    valid slugs; cross-ruleset character import names both rulesets.
  - **T448** — codex axis per the existing row (EV24).
- **Risk:** legacy codex entries have no `ruleset`; the reader treats absent as
  `null` (ruleset-agnostic) and writes it on the next mutation; recorded in
  DECISIONS.

### 4.3 Slice C — metrics, budget, lifecycle (L)

Covers REQ-389c, REQ-390b, REQ-391c, REQ-430, REQ-432a, REQ-432b, REQ-558, plus
the REQ-012/REQ-214a `ruleset://` resource (F-P6b-9a, F-P6b-12, F-P6b-16,
F-P6b-20).

- **Files:** `holonovel/src/index.ts`, `holonovel/src/rulesets.ts`,
  `scripts/lib/ruleset-registry.ts`, `scripts/build-ruleset.ts`,
  `holonovel/scripts/test-ruleset-surface-remediation.ts` (T458),
  `holonovel/scripts/test-output-contracts.ts` (T453, T454, T455),
  `holonovel/scripts/test-selection.ts` (T688),
  `holonovel/scripts/test-ruleset-gates.ts` (license parity),
  `holonovel/scripts/test-ruleset-nonovel.ts` (T651),
  `holonovel/scripts/test-tool-definitions.ts` (T512, T648),
  `holonovel/scripts/test-competitive-gaps.ts` (T517),
  `spec/appendices-reference.md` (T688 description alignment),
  `holonovel/DECISIONS.md`.
- **Design:**
  1. **Runtime install registration (REQ-558):** refactor the startup loop
     (`index.ts:2299-2335`) into `registerPackageTools(slug)`; call it from
     `manage_ruleset (action: install)` after `installPackage`. Package
     `resources.json` declarations are read into the package (`rulesets.ts:516`)
     but never registered as MCP resources, so the install path also registers
     each declared resource through a `registerPackageResources(slug)` helper
     (empty declarations are a no-op) and the remove path deregisters them
     (REQ-389c). The MCP SDK has no resource-deregistration API (the prompt
     surface has the same limit, `index.ts:2000`), so "deregister" is realised
     as a host-owned installed-package filter over the resource reader and the
     resource listing — the precedent `installPackagePromptSurface` sets.
     Removal already hides tools (`packageToolVisible`); assert the
     installed package's tools serve immediately without a restart.
  2. **`ruleset://` resource (REQ-012, REQ-214a):** register a resource template
     `ruleset://{slug}/{anchor}` resolving an index entry by id or anchor from
     the package (hydrating lazily on read); unknown entry ⇒ `[NOT_FOUND]`;
     badge-filter GM-only categories. **T688 is widened** from "the truncated
     result carries a pointer" to "reading that pointer returns the indexed
     passage"; no new token is minted (D9).
  3. **Aggregate index bytes (REQ-390b):** sum each installed `index.json`
     byte size without hydrating (`fs.statSync` on the resolved install path,
     cached by mtime) and report `spec_health.ruleset_index_bytes`; the health
     read must not raise `rulesets_hydrated` (extend T455's assertion).
  4. **Aggregate package tool budget (REQ-430):** add
     `RULESET_PACKAGE_TOOL_BUDGET` (tokens, env-overridable) and measure a
     package's declared `tools.json` contribution at load; an over-budget
     package contributes `[tool-budget]` to `ruleset_package_alerts` and the
     emitter refuses it. Per-tool description budget is unchanged
     (`rulesets.ts:268`).
  5. **License set (REQ-432a/b):** fix `APPENDIX_U_LICENSES` per D4; add
     `source_license` to `RegistryEntry`; `build-ruleset` writes it from the
     Appendix U row it matches and into the emitted manifest; add the parity
     assertion to `test-ruleset-gates.ts`.
  6. **Pagination (REQ-391c):** implement D6 in the `tools/list` wrapper and
     assert the default scoped listing size is independent of installed package
     count.
  7. **Appendix F:** no new row. T688's description gains the resolving-read
     clause it already implies; T448 is exercised as written (D9).
- **Tests:** extend the harness:
  - **T453** (extend in `test-output-contracts.ts`) — install registers tools
    and declared resources immediately; a removable package's tools and
    declared resources leave the surface; remove with a bound Novel is
    `[STATE_CONFLICT]`; list distinguishes loaded/idle; all audited.
  - **T454/T455** (extend in `test-output-contracts.ts`) — install-then-serve
    without restart; health reports `rulesets_installed`,
    `rulesets_hydrated`, and `ruleset_index_bytes` without hydrating; seed
    five packages and assert the cold-start tier and that the default listing
    size does not grow with the installed count.
  - **T458** (new assertion under the existing row,
    `test-ruleset-surface-remediation.ts`) — over-cap `scope=all` paginates
    with a nextCursor that resumes; an invalid cursor is `[INVALID_INPUT]`.
  - **T512/T648** (extend in `test-tool-definitions.ts`) — an over-budget
    package is flagged and the emitter refuses; the per-tool defect path is
    unchanged.
  - **T517** (extend in `test-competitive-gaps.ts`) — the COF combined license
    loads; an unlisted license is `[license-unattributed]` and inactive.
  - **T651** (extend in `test-ruleset-nonovel.ts`) — explicit-slug search and
    derived tools with no Novel after a runtime install.
  - **T688** (extend in `test-selection.ts`) — the `ruleset://` pointer from a
    truncated search result resolves to the indexed passage through
    `resources/read`; an unknown anchor is `[NOT_FOUND]`.
- **Risk:** the install path mutates the live MCP registry; a partial
  registration failure must fail before `installPackage` leaves a package
  installed-but-unregistered. Install validates and registers atomically, and
  a registration throw rolls the package back through `removePackage`.

### 4.4 Close-out (S)

- **Files:** `spec/audit/review-register.md`, `ROADMAP.md`,
  `spec/audit/req-coverage.md`, `CHANGELOG.md`, `holonovel/DECISIONS.md`.
- **Design:**
  1. Flip each finding to `Resolved` **inside the slice that closes every REQ
     it names**, rewriting its predicate from the post-change tree and removing
     its roadmap bullet in the same step. F-P6b-9 is split in slice A: its
     annotation/health clauses resolve there, the `ruleset://` clause becomes
     F-P6b-9a, and its REQ-389c clause joins F-P6b-16.
  2. F-P6b-12's REQ-421 clause moves to F-P6b-15 (the §5.17/§5.18 package-build
     item), because the registry already records recipe roles (EV20) and the
     supplement-provenance half is that item's scope; the register row names
     the destination.
  3. Delete the roadmap section when its last bullet goes; on a partial
     landing, re-scope and set the trigger to the resume bullet.
  4. Regenerate the coverage register; one dated CHANGELOG entry; record the
     prefix map and D1–D7/D9 in `holonovel/DECISIONS.md`.

## 5. Delivery slices

One commit at the end; if the session stops early it stops at a slice boundary
with the tree committed and consistent.

| Slice | Content | State left behind |
|---|---|---|
| A | §4.1 | F-P6b-9 and F-P6b-11 `Resolved`; new F-P6b-9a scheduled under bullet 3 (REQ-012/REQ-214a) and bullet 3 amended to name REQ-012 and REQ-214a; bullet 1 removed; bullet 2 remains. `LOOP OPEN`. |
| B | §4.2 | F-P6b-10 `Resolved`; bullet 2 removed. Bullet 3 remains. `LOOP OPEN`. |
| C | §4.3 + §4.4 | F-P6b-9a, -12, -16, -20 `Resolved`; section retired. `LOOP PAUSED`. |

Each slice's register flip and bullet removal are one step, so
`check-registers:strict` passes at every stop (`check-registers` alone is
report-only, `scripts/check-registers.ts:8-10,54`); `check-roadmap` sees a
valid 1–3 bullet section at every stop.

## 6. Commit plan

| # | Scope | Findings | Must pass |
|---|---|---|---|
| 1 | Slices A–C + close-out | F-P6b-9, -9a, -10, -11, -12, -16, -20 | `test:ruleset-surface-remediation`, `test:output-contracts`, `test:selection`, `test:tool-surface`, `test:tool-definitions`, `test:competitive-gaps`, `test:ruleset-nonovel`, `test:ruleset-gates`, `test:update-workflow`, `check:fast`, `build-order`, `check-registers:strict`, `check-roadmap`, `check-loop-artifacts` |

## 7. Verification

| Step | Command | Pass |
|---|---|---|
| Target harness | `npm --prefix holonovel run test:ruleset-surface-remediation` | exit 0 |
| Sibling harnesses | `npm --prefix holonovel run test:output-contracts`, `test:tool-surface`, `test:tool-definitions`, `test:competitive-gaps`, `test:selection`, `test:ruleset-nonovel`, `test:ruleset-gates`, `test:update-workflow` | exit 0 |
| Full server suite | `npm --prefix holonovel run test:all` | exit 0 |
| Registers | `npm run check-registers:strict`, `check-roadmap`, `check-loop-artifacts` | exit 0 |
| Coverage | `npm run validate -- --write-register` | no new bucket-A row |
| Fast gate | `npm run assemble && npm run check:fast` (un-piped) | `check:fast: PASS` |
| Sync | `npm run build-order` | exit 0 |
| Close | `npm run session:close` | commit created |

Manual checks:

| Bar | Check |
|---|---|
| 1 | Seven findings under `## Resolved` (the six originals plus F-P6b-9a); each predicate re-derived from the post-change tree and present in `rg -n` output. |
| 2 | `rg "§5.16/§5.17 ruleset surface remediation" ROADMAP.md` returns nothing on a complete landing. |
| 3 | Every REQ in the 24-REQ set either names an exercising assertion in the harness output or appears in a new roadmap row. |
| 4 | `tools/list` sample entries show `_meta.ruleset` and `_meta.inapplicable`. |
| 5 | `spec_health.ruleset_health` has per-slug sections + `combined`; Player snapshot has one section or none. |

## 8. Failure handling

- A harness red after two fixes → stop that slice, keep its bullet and its
  `Scheduled-roadmap` finding, record the predicate. Earlier slices still
  commit; the AAR is `LOOP OPEN`.
- `_meta` stripped by a surface profile → patch
  `surface-projection.ts` and re-run `test:tool-surface`; do not move the
  annotation into `annotations`.
- Install-time registration partially fails → roll back with `removePackage`
  and return `[STATE_CONFLICT]`; never leave a package installed but
  unregistered.
- A REQ-body edit becomes necessary → stop: it invalidates `PACKAGE_FORMAT`
  (EV21). Amend the plan text, re-run the standard-depth diff re-review, and
  regenerate fingerprints only through `build-order`.
- Rollback cost 1 (`git revert`); no destructive or remote step.

## 9. Blast radius

| File | Change | Size |
|---|---|---|
| `holonovel/src/index.ts` | `_meta.ruleset`/`inapplicable`, `ruleset_health`/`combined`, suggest scoping, bind/switch/import/export/codex, install registration, pagination, `ruleset://`, index bytes | L |
| `holonovel/src/rulesets.ts` | license set, manifest optional fields, aggregate budget, index-byte helper | M |
| `holonovel/src/core/state.ts` | bind mechanics check, switch audit, `CodexEntry.ruleset`, `RosterEntity.ruleset` | M |
| `holonovel/src/core/surface-projection.ts` | preserve `_meta` if a profile drops it | S |
| `scripts/lib/ruleset-registry.ts` | `source_license` on `RegistryEntry` | S |
| `scripts/build-ruleset.ts` | write license into registry + manifest | S |
| `holonovel/scripts/test-ruleset-surface-remediation.ts` | T440, T442–T448, T451, T458 assertions | L |
| `holonovel/scripts/test-output-contracts.ts` | T441, T453, T454, T455 extensions | M |
| `holonovel/scripts/test-tool-definitions.ts` | T512, T648 budget assertions | S |
| `holonovel/scripts/test-competitive-gaps.ts` | T517 license-set assertions | S |
| `holonovel/scripts/test-selection.ts` | T688 resolving-pointer extension | S |
| `holonovel/scripts/test-ruleset-gates.ts` | license-set parity assertion | S |
| `holonovel/scripts/test-ruleset-nonovel.ts` | T651 install-time registration assertion | S |
| `spec/appendices-reference.md` | T440–T448, T458, T688 description alignment (no new rows) | S |
| `spec/audit/review-register.md` | seven findings `Resolved`; F-P6b-12 reassignment; F-P6b-9a split | S |
| `spec/audit/req-coverage.md` | regenerated | M |
| `ROADMAP.md` | section retired or re-scoped | S |
| `holonovel/DECISIONS.md` | prefix map, D1–D7/D9, interpretation notes | S |
| `CHANGELOG.md` | one dated entry | S |
| `holonovel.md`, `holonovel/holonovel.md` | assembled + propagated | S |
| `docs/plans/2026-11-10-5-16-5-17-ruleset-surface-remediation/*` | artifacts | S |

## 10. Files expected

- `holonovel/src/index.ts`
- `holonovel/src/rulesets.ts`
- `holonovel/src/core/state.ts`
- `holonovel/src/core/surface-projection.ts`
- `scripts/lib/ruleset-registry.ts`
- `scripts/build-ruleset.ts`
- `holonovel/scripts/test-ruleset-surface-remediation.ts`
- `holonovel/scripts/test-output-contracts.ts`
- `holonovel/scripts/test-tool-definitions.ts`
- `holonovel/scripts/test-competitive-gaps.ts`
- `holonovel/scripts/test-selection.ts`
- `holonovel/scripts/test-ruleset-gates.ts`
- `holonovel/scripts/test-ruleset-nonovel.ts`
- `spec/appendices-reference.md`
- `spec/audit/review-register.md`
- `spec/audit/req-coverage.md`
- `ROADMAP.md`
- `holonovel/DECISIONS.md`
- `CHANGELOG.md`
- `holonovel.md`
- `holonovel/holonovel.md`
- `docs/plans/2026-11-10-5-16-5-17-ruleset-surface-remediation/plan.md`
- `docs/plans/2026-11-10-5-16-5-17-ruleset-surface-remediation/tasks.md`
- `docs/plans/2026-11-10-5-16-5-17-ruleset-surface-remediation/aar.md`

## 11. Alternatives considered

- **Plan only bullet 1 and split the item first.** Rejected by the user's
  explicit scoping choice: execute all three bullets as slices.
- **Put `ruleset` in `annotations`.** Rejected: MCP's four-hint contract and
  T536; `_meta` is the extension slot (D1).
- **Amend REQ-383a to drop unbuilt health fields.** Rejected: a §5.16 body edit
  invalidates every installed package's `package_format` (EV21); the
  `"not-declared"` field report is cheaper and honest (D3).
- **Derive MUST-action coverage from `counts.actions`.** Rejected: no defined
  denominator; it would fabricate a metric (D3).
- **Add a new license-parity gate.** Rejected: an existing harness covers the
  class; extend `test-ruleset-gates.ts` instead (D4, existing-check discovery).
- **Implement `ruleset://` as a static resource list.** Rejected: the search
  pointer carries an arbitrary anchor, so a template is required (D8).
- **Pagination by tool count.** Rejected: the spec bounds response size, not
  count; a byte budget is the contract (D6).
- **Register tools on install through a fire-and-forget adapter call.**
  Rejected: a failed registration would leave a half-installed package; install
  is atomic with rollback (D4 risk note).

## 12. Risks

- **24 REQs can exceed one session.** Mitigation: three slices landed at
  boundaries; the AAR is `LOOP OPEN` until slice C closes.
- **Fingerprint blast.** Mitigation: no §5.16/§5.17 REQ-body edit at all —
  Appendix F rows only — so no installed package is invalidated (EV21). If a
  body edit becomes necessary, stop, amend the plan, re-run the diff
  re-review, and regenerate through `build-order` with the
  `[package-incompatible]` consequence stated in the changelog.
- **Install-time registration mutates the live registry.** Mitigation: atomic
  install/rollback; the harness asserts both the served tool and the rollback.
- **Player-badge health leak.** Mitigation: T444 asserts the Player snapshot;
  `ruleset_package_alerts` stays GM-only.
- **Legacy codex entries.** Mitigation: absent `ruleset` reads as `null`;
  persisted shape is additive.
- **Gate-pinned values.** The changelog date equals the CalVer date; the
  commit subject comes from the CHANGELOG heading via `session:close`.

## 13. User impact

Runtime behaviour changes: installed packages become callable immediately
(REQ-558), `tools/list` gains `_meta.ruleset`/`_meta.inapplicable`, over-cap
listings paginate, `ruleset://` resolves, and `spec_health` gains
`ruleset_health`/`combined`. A Novel with mechanics-derived state can no longer
bind; a wrong-ruleset codex entry can no longer import. Persisted Novel/codex
data is additive and backward-compatible. No REQ body change means no
`[package-incompatible]` or `[data-stale]` wave.
