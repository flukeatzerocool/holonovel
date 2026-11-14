# Plan — Ruleset search badge scope (F-P1-17)

Status: final v4 (cold pass r1, diff re-review r2, and a user-authorized
targeted amendment re-check r3 — `independent-review passed.`) · Kind: planned ·
Depth: standard
Increment target: docs/plans/2026-11-14-ruleset-search-badge-scope/
Rollback cost: 1 (one optional field, one method parameter, one shared
predicate, four call sites, one new REQ, one new test row, registers, roadmap,
changelog; reversible in one commit)
Evidence class: repo only
Revision note: v1 was self-reviewed and then cold-reviewed
(`ses_e2532a215ffeKMdk9BJlCYCrvT`, 40/40 reads). The cold pass returned four
Blockers: (B1) the blank-query short-circuit at `rulesets.ts:659` bypasses the
new filter, so v2 filters that branch and asserts it; (B2) dropping the legacy
`category` proxy would make `category: "gm"` entries without `badge_scope`
readable where `index.ts:15001-15004` refuses them today, contradicting the
compatibility invariant, so v2 composes both signals (D10); (B3) T0's
"exactly four hits" is false — the grep yields five occurrences over three call
sites — so v2 asserts site identity and adds the `indexForReport` enumeration;
(B4) no step created the tracked `plan.md`, so v2 makes the artifact copy an
explicit step (T6a). Its Majors are also folded in: the legacy fixture leg is
now a parameterised fixture rather than an invented directory (M2), the gate run
moves after `aar.md` (M3), and D8/T0 name the fourth `indexForReport` reader
(M1). Its four Nits are corrected in place: fingerprint line citations, three
range slips, the REQ body is carried inline so its length is re-measurable, and
`test-selection.ts` joins the blast radius as verify-only. The diff re-review
(r2) then returned no Blockers and two Majors: (A) done bar 1's "exact
pre-change visibility" contradicted T3.8, since the legacy disjunct deliberately
narrows *search*, and done bar 2 named the wrong base helper — v3 states the
"no previously hidden entry becomes visible" invariant and the composed
`searchIndexVisible → visibleIndexEntry → rulesetEntryVisible` chain; (B) two
fixtures with identical tool names installed before one boot was an unresolved
collision decision — v3 records the slug-namespacing rule
(`index.ts:2071-2073`, `:2462`), pins the legacy slug shape, and reconciles the
T651 `spec_health` leg. Both are deferred to `build-review` as C-5/C-6, and a
final user-authorized targeted re-check (r3) judged them resolved and returned
`independent-review passed.` with no Blockers and no Majors; its five wording
Minors are folded into v4 (D5 says resource refusal, C-2 restates the
one-directional invariant, T3 states the prefix rule structurally, the model id
is `core_mechanic`, C-5 routes a mismatch to wording).
Trust boundary: every premise below is read from the working tree at HEAD
`ddd0e48` (clean tree). No web, user, or tool-output premise.
Baseline: `npm run status` reports 6 open roadmap items and 78 unpushed commits
(oldest 5.5d, last publish 2026-11-09T04:30Z); `npm run check:fast` reports
`41 passed, 0 failed` and the trailing `check:fast: PASS`.

## Questions

1. **Which roadmap item?** The user selected bullet 1 of `ROADMAP.md` §
   *Trust-core contract remediation (P1)* — ruleset search badge filtering
   (`ROADMAP.md:17-20`), finding F-P1-17 (`spec/audit/review-register.md:2495-2503`).
   Bullet 2's authorization remainder (F-P1-7/8/9) and bullet 3's audit-durability
   pair (F-P1-4/F-P1-13) stay scheduled.
2. **Why is this one increment?** The finding has one mechanism (the search index
   carries no visibility signal) and four host reads of it. Splitting the two
   Player-reachable search surfaces from the `ruleset://` read would ship a
   bypass in the interim: the `manage_ruleset` search renderer emits
   `ruleset://<slug>/<id>` pointers (`index.ts:13712`), so a filtered search plus
   an unfiltered pointer read leaks the same content by a shorter path.
3. **Is the builder side in scope?** No — it is already normative. REQ-210c
   (`spec/02-requirements.md:497-498`) obliges extraction to declare
   `badge_scope`; this increment makes the *index* carry it and the *host* honor
   it. The package emitter lives outside this repository (`build-ruleset`
   resolves a recorded emitter, `scripts/lib/ruleset-registry.ts:119-160`), so
   the in-repo deliverable is the consumer contract plus a host-level assertion.

## Objective

Close F-P1-17 by giving each full-text search index entry the `badge_scope` its
model entry already declares, and by applying that visibility to every
index-backed read: the package `search` tool kind, `manage_ruleset (action:
search)` (hits **and** the reported match total), and the `ruleset://{slug}/{anchor}`
entry resource — including the blank-query branch and the legacy
`category`-only refusals that exist today.

**Done bar:**

1. `RulesetIndexEntry` (`holonovel/src/rulesets.ts:60-67`) declares an optional
   `badge_scope?: "game_master" | "shared"`; `RulesetSearch.search` accepts a
   visibility predicate and applies it to **both** return paths — the blank-query
   slice (`rulesets.ts:659`) and the scored path — before the `maxResults` slice
   and before any total count. An entry with no declared scope is `shared`, and
   every installed package keeps loading. The visibility invariant is **no
   previously hidden entry becomes visible**: a declared `game_master` entry and
   a legacy `category: gm`/`game_master` entry with no declared scope are both
   withheld from Player and Observer (REQ-210d, D1, D5, D10). Legacy `category:
   gm` rows are additionally withheld from *search*, which returned them before
   this change; that narrowing is the finding, not a regression.
2. The two Player-reachable search surfaces route through one host helper —
   `searchIndexVisible` — which composes `visibleIndexEntry`, and
   `visibleIndexEntry` in turn composes `rulesetEntryVisible` (`index.ts:2255`)
   with the legacy category signal: the package search kind (`:2343`, `:2347`)
   and `manage_ruleset (action: search)` (`:13699`, `:13701`). A query whose
   every match is badge-invisible — including
   an empty or whitespace-only query — returns the same `[NOT_FOUND]` body as a
   query with no match: no entry name, no total, no hint (REQ-002c1, REQ-445).
3. The `ruleset://{slug}/{anchor}` resource (`index.ts:14989`) applies the same
   composed predicate to its candidate list **before** the `find` chain, so a
   shared sibling still resolves when a GM-only entry shares its anchor
   case-insensitively, and the existing `category` refusal
   (`:15001-15004`) is preserved rather than replaced (D3, D10). A denied read
   returns `[ERROR] [NOT_FOUND]` with the no-such-entry body, not the current
   scope-confirming `[FORBIDDEN]`.
4. New REQ-210d in §5.2 with `_Check:_ T784`, carrying exactly the body quoted in
   C4 (711 characters, 4 sentences — the body is in this artifact so the count is
   re-measurable); Appendix F row T784; the Appendix REQ index row for REQ-210d
   dated `2026-11-14`; `holonovel.md` and `holonovel/holonovel.md` reassembled. No
   §5 map edit is needed: its §5.2 row already lists base `210`
   (`spec/02-requirements.md:10`).
5. T784 exercises Player, Observer, Game Master, and Editor on both search
   surfaces plus the resource read, a blank-query leg, and a legacy-package leg
   (a `category: "gm"` entry with no `badge_scope` stays invisible) — C-2.
6. F-P1-17 is `Resolved` with predicates re-cited at their post-change lines and
   T784 named; its scheduled bullet is removed from the 2026-11-09 chunk-P1
   section; the `ROADMAP.md` bullet is deleted (the section keeps bullets 2 and
   3); the coverage register is regenerated; the CHANGELOG carries a dated
   entry; the tracked increment holds `plan.md`, `tasks.md`, and `aar.md`.
7. `npm --prefix holonovel run test:all` is green; after `aar.md` exists,
   `npm run assemble && npm run check:fast` reports the trailing
   `check:fast: PASS` (the gate cannot pass while the increment lacks an AAR, so
   the run is ordered after T6a); `npm run session:close` then re-runs the fast
   suite and commits.
8. One `npm run session:close` commit. Publication is out of scope (78 commits
   are already unpushed; publishing is a separate, explicitly authorized step).

## Premises

Each line was read at HEAD `ddd0e48`.

- The index entry type carries no visibility field: `RulesetIndexEntry` is
  `{ id, anchor, source_file, content, category, confidence }`
  (`holonovel/src/rulesets.ts:60-67`).
- `RulesetSearch.search` has two return paths and no visibility parameter: the
  blank-query slice `if (!q) return pkg.index.slice(0, maxResults)` at
  `rulesets.ts:659`, and the scored path that sorts and slices at `:671-672`
  (`search` spans `:656-673`).
- The host already owns the model-entry predicate and its comment names exactly
  this contract: `rulesetEntryVisible` treats `game_master` as absent for Player
  and Observer and admits GM/Editor (`index.ts:2252-2257`).
- `manage_ruleset`'s `query` parameter is optional (`index.ts:13669`), and the
  package `search` kind coerces `String(args.query ?? "")` (`:2343`), so a blank
  or whitespace query reaches the `:659` short-circuit from both surfaces and
  renders the full entry JSON (`:2345`).
- Four index reads exist; three are `search` call sites (five occurrences) and
  one is the resource. Only two call sites are Player-reachable search; the
  third is GM-gated, and the resource is the fourth read:
  - package `search` kind, hits at `index.ts:2343`, total at `:2347`;
  - `manage_ruleset (action: search)`, hits at `:13699`, total at `:13701`
    (`hits.length === 0 ? 0 : …`);
  - NPC suggestion lookup at `:3053` — inside `prepopulateAdventure`, reachable
    only from the two `requireGM()` branches of the adventure load path
    (`index.ts:12460` region), so it cannot serve a Player or Observer (D6);
  - `ruleset://{slug}/{anchor}` resource at `:14989`, gated only by
    `hit.category ∈ {gm, game_master}` (`:15001-15004`).
  Enumeration: `grep -n "rulesets.search(" holonovel/src/index.ts` → 5 hits;
  `grep -n "indexForReport(" holonovel/src/index.ts` → 4 hits (`:14372`,
  `:14543`, `:14698`, `:14994`), all aggregate metadata (D8).
- `manage_ruleset` search renders a `[truncated — read ruleset://<slug>/<id>]`
  pointer for oversized passages (`index.ts:13712`), which is why the resource
  read joins this increment (Question 2).
- The package-format fingerprint hashes §5.16, §5.17, §6.3, §6.4.2
  (`scripts/lib/contract-fingerprint.ts:27`); the data-format list is
  `:37-43`. §5.2 is in neither, so a §5.2 REQ addition moves no fingerprint and
  no installed package is held inactive (D5).
- §5.17 does not enumerate `index.json` fields: REQ-389a names "the full-text
  search index" only (`spec/02-requirements.md:3948-3949`). An optional entry
  field is therefore additive at the package-format level (D5).
- Precedent for scoping a visibility field on extracted content exists in
  REQ-215a, which requires `badge_scope` on generation-table entries
  (`spec/02-requirements.md:501`).
- A prior cold review reached the same conclusion independently: the
  trust-core envelope remainder's reviewer recorded that a search-hit filter is
  unimplementable without extending the index entries, and asked explicitly for
  the all-filtered empty-result behaviour and the `max_results`-after-slice
  rule (`docs/plans/2026-11-14-trust-core-envelope-remainder/cold-review.md:60-72`).
  C1, D1, D10, and the edge-case list answer all three.
- The synthetic package fixture used by the ruleset harness builds its index
  in-memory with two entries and no `badge_scope`
  (`holonovel/scripts/test-ruleset-nonovel.ts:55-58`), writes the six files to
  `DATA_DIR/rulesets/<SLUG>` (`:80-92`), and boots one server against
  `TTRPG_DATA_DIR=DATA_DIR` (`:161-175`), so a second package can be installed
  beside the first and bound to its own Novel. Its model already declares
  `badge_scope: "game_master"` on `gm-secret-thing` and `core_mechanic`
  (`:61-62`). The committed reference package's own `index.json` is `[]`
  (`holonovel/testdata/rulesets/fixture/index.json`), so the emitter freshness
  gate (`scripts/check-fixture-emitter.ts`) is unaffected.
- No harness asserts the resource's current `[FORBIDDEN] … is Game Master only`
  body (grep over `holonovel/scripts` finds only the generic classifier input in
  `test-playtest.ts:60`, plus unrelated REQ-603 regexes), and the
  pointer-resolution assertion in `test-selection.ts:315-322` (T688) runs under
  the Game Master badge — the file's only `set_badge` is `:202` — so the D3 body
  change breaks no existing assertion.
- Appendix F's highest row is T782 (`spec/appendices-reference.md:2132`); T783
  is cited by `test-output-contracts.ts:371` but has no Appendix F row (the
  separate P2 harness-label finding). Repo-wide, T784 appears nowhere.
- The Appendix REQ index row sits at `spec/appendices-reference.md:189` (REQ-210c);
  rows carry a `YYYY-MM-DD` date column.
- `npm run assemble` writes both `holonovel.md` and `holonovel/holonovel.md`
  (`scripts/assemble.ts:18-19`).

## Decisions

- **D1 — Filter inside `search`, on both return paths.** A post-filter at the
  call sites would return fewer than `max_results` visible hits and would make
  the total count include invisible entries (exactly the F-P1-17 predicate). The
  method takes an optional predicate applied at the blank-query slice and in the
  scoring loop before sort/slice; `maxResults` continues to bound visible hits.
  The blank-query path is not special-cased away: it is a search over the index
  like any other, so it filters too (B1).

  Alternative rejected: rejecting an empty query at the call sites — it changes
  an existing tool contract (`query` is optional) for a problem the predicate
  already solves, and would leave the library-level branch unfiltered for the
  next caller.

- **D2 — New REQ-210d rather than an amendment to REQ-210c.** REQ-210c states
  the extraction contract and the model-side absence rule; it is silent on the
  index and on the match total. A new part keeps each body inside the
  documented limits and gives T784 a single owning REQ. Roadmap wording already
  frames this as "an extension of REQ-210c".

- **D3 — The resource read returns `[NOT_FOUND]`, not `[FORBIDDEN]`.** The
  caller supplies the anchor; a `[FORBIDDEN] … is Game Master only` reply
  confirms the entry's existence and its scope, which REQ-445 forbids. The
  no-such-entry body is identical to an unknown anchor, so the two are
  indistinguishable. No harness depends on the old body (Premises).

- **D4 — One field, one predicate, one helper.** `visibleIndexEntry` composes
  `rulesetEntryVisible` with the legacy category signal (D10), and
  `searchIndexVisible(slug, query, maxResults, badge)` composes
  `visibleIndexEntry`; both live beside `rulesetEntryVisible` in `index.ts` and
  are the only sanctioned entry points for host index reads. A comment on
  `RulesetSearch.search` records that the predicate is the visibility seam so a
  future call site does not silently bypass it.

- **D5 — No package-format bump.** The field is optional and absent means
  `shared`; §5.2 is outside both fingerprint section lists, and §5.17 does not
  enumerate index fields. Installed packages stay loaded, and the visibility
  invariant holds: **no previously hidden entry becomes visible**. Legacy
  `category: gm` rows without a declared scope keep their resource refusal and
  are now also withheld from search, which is the narrowing the
  finding asks for (D10) — not a widening. REQ-210c's existing obligation
  supplies the scope on rebuild. Recorded as C-2.

- **D6 — The NPC-suggestion call site is left unchanged.** It runs only behind
  `requireGM()`, so a Player or Observer cannot reach it. Changing it would add
  an unobservable behavioral delta; the rationale is recorded in the code
  comment beside the helper instead. It still sees the unfiltered library form,
  which is correct for a GM-only path.

- **D7 — No tool, schema, or configuration change.** Output *content* changes,
  not a tool schema, action surface, or persisted state, so no
  `check-tool-definitions-sync` regeneration, `surface-budget --write`,
  DECISIONS action-count refresh, or gate-classification row follows. The
  fingerprint triplet is untouched (D5).

- **D8 — Aggregate health counts are untouched.** `spec_health` reports
  `search_index.anchors` as a per-package aggregate (`index.ts:14698`), a
  per-file/per-category confidence aggregation in `rulesetConfidence`
  (`:14543`), and a confidence numerator/denominator per package (`:14372`).
  Those are package metadata, not entry content; REQ-210d scopes entries. The
  fourth `indexForReport` reader (`:14994`) is the resource's single-entry
  lookup — a content read, in scope, and filtered by C2 (done bar 3), so it is
  deliberately not filed under this decision. Recorded as an accepted residual,
  not a new finding (no content disclosure is demonstrated).

- **D9 — Sibling contracts on the same action are reconciled, not redefined.**
  Three REQs bind `manage_ruleset (action: search)`'s output: REQ-113/REQ-112
  (returned vs total match count), REQ-588 (result budget, suppression, and the
  `ruleset://` truncation pointer), and REQ-079e/REQ-132c (adventure prose
  joins every search). The plan changes *which* entries are counted, not the
  counting rule, the budget, or the merge order: the count is over visible
  matches, the budget applies to visible hits, and the adventure set is
  unchanged (Out of scope). T0 records the grep that confirms no sibling REQ
  defines an unfiltered total.

- **D10 — The legacy category refusal is preserved as a disjunct.** The
  resource refuses `category: "gm"` entries today even when no `badge_scope` is
  declared (`index.ts:15001-15004`). Replacing that test with the scope test
  alone would *widen* visibility for every un-rebuilt package — the opposite of
  the increment's purpose. `visibleIndexEntry` therefore denies when either
  signal denies; the composed rule is a floor, not a new contract, and REQ-210d
  states only the declared-scope rule. The legacy signal can retire once the
  builder-side emission is universal (Out of scope).

## Change entries

| # | Change | File | Size |
|---|---|---|---|
| C1 | `RulesetIndexEntry.badge_scope?`; `search(..., visible?)` filter on both return paths; seam comment | `holonovel/src/rulesets.ts` | S |
| C2 | `visibleIndexEntry` + `searchIndexVisible`; two search call-site pairs repointed; resource read uses the composed predicate (pre-filtered `find`), `[NOT_FOUND]` body | `holonovel/src/index.ts` | M |
| C3 | New T784 test (blank-query and legacy-package legs); fixture parameterised for a second slug/legacy variant; index gains `badge_scope` on the two GM-only entries plus one shared entry | `holonovel/scripts/test-ruleset-nonovel.ts` | M |
| C4 | REQ-210d body (quoted below) | `spec/02-requirements.md` | S |
| C5 | T784 row; REQ-210d index row | `spec/appendices-reference.md` | S |
| C6 | Tracked `plan.md` (byte copy of the stamped artifact), `tasks.md`, `aar.md`; F-P1-17 resolution entry + scheduled-bullet removal; roadmap bullet deletion; CHANGELOG entry; coverage register regeneration | `docs/plans/2026-11-14-ruleset-search-badge-scope/`, `spec/audit/review-register.md`, `ROADMAP.md`, `CHANGELOG.md`, `spec/audit/req-coverage.md` | M |

**C4 — the exact REQ body** (711 characters, 4 sentences; verified by
measurement, re-measurable from this block):

> The search index SHALL carry each entry's declared `badge_scope` and treat an
> undeclared one as `shared`. `manage_ruleset (action: search)` and a package
> search tool SHALL drop entries invisible to the active badge before applying
> the result limit and before reporting the match total; a query whose every
> match is invisible SHALL return `[NOT_FOUND]` naming no entry and no count
> (REQ-002c1, REQ-445). The `ruleset://` entry resource SHALL apply the same
> test. *Acceptance criterion:* A Player-badge search matching one shared and
> one `game_master` entry returns the shared entry only with a total of one, the
> Game Master badge returns both, and a Player-badge read of the GM-only anchor
> returns `[NOT_FOUND]`.

## Blast radius

| Path | Role | Touch |
|---|---|---|
| `holonovel/src/rulesets.ts` | index type + search | C1 |
| `holonovel/src/index.ts` | predicates, helper, 2 search pairs, resource read | C2 |
| `holonovel/scripts/test-ruleset-nonovel.ts` | T784 + fixture parameterisation | C3 |
| `spec/02-requirements.md` | REQ-210d | C4 |
| `spec/appendices-reference.md` | T784, REQ index row | C5 |
| `holonovel.md` | assembled (generated) | C4/C5 via `npm run assemble` |
| `holonovel/holonovel.md` | assembled copy (generated by the same step) | C4/C5 via `npm run assemble` |
| `docs/plans/2026-11-14-ruleset-search-badge-scope/` | plan, tasks, AAR | C6 |
| `spec/audit/review-register.md` | F-P1-17 resolution | C6 |
| `spec/audit/req-coverage.md` | regenerated | C6 |
| `ROADMAP.md` | bullet 1 removed | C6 |
| `CHANGELOG.md` | dated entry | C6 |
| `holonovel/scripts/test-selection.ts` | verify only (T688 pointer leg) | none |

Untouched, and verified so: `holonovel/src/generated/contract-fingerprints.ts`,
`holonovel/tool-surface-registry.json`, `holonovel/DECISIONS.md`,
`holonovel/testdata/rulesets/fixture/*`, every other harness.

## Steps

**T0 — Re-confirm predicates (evidence, no writes).**
Re-read the four read sites and the resource handler at HEAD and record their
current lines in the register entry. Run and record:
`grep -n "rulesets.search(" holonovel/src/index.ts` → **5 occurrences over 3
call sites** (`:2343`, `:2347`, `:3053`, `:13699`, `:13701`), not "4 hits";
`grep -n "indexForReport(" holonovel/src/index.ts` → 4 (`:14372`, `:14543`,
`:14698`, `:14994`); confirm `PACKAGE_SECTIONS`/`DATA_SECTIONS` still exclude
§5.2 (`contract-fingerprint.ts:27`, `:37-43`); and grep the sibling contracts
that bind the same action — `REQ-113`, `REQ-112`, `REQ-588`, `REQ-079e`,
`REQ-132c` — recording that none defines an unfiltered match total (D9). A
moved line is a no-op (cite the new one). A **fifth Player- or
Observer-reachable read of either shape** is a scope change: stop for a
decision (C-1). A changed occurrence count at an already-listed site is not.

**T1 — Core search seam (C1).**
Add the optional field and the `visible` parameter; apply the predicate at the
blank-query branch (`rulesets.ts:659`) **and** in the scoring loop before the
sort and slice; document the seam. Verify: `npm run typecheck`.

**T2 — Host reads (C2).**
Add `visibleIndexEntry` and `searchIndexVisible` beside `rulesetEntryVisible`;
repoint `:2343`/`:2347` and `:13699`/`:13701`; rewrite the resource handler's
candidate selection to `rulesets.indexForReport(slug).filter((e) =>
visibleIndexEntry(e, getBadge()))` before the two `find` calls, drop the
inline category branch in favour of the composed predicate (D10), and return
the no-such-entry `[NOT_FOUND]` body for a denied read. Verify: the resource
handler still serves a shared entry for the `test-selection.ts` pointer leg.

**T3 — Harness (C3).**
Parameterise `installFixture(opts: { slug?: string; legacy?: boolean } = {})`:
the default variant adds three *new* index entries mirroring the model ids —
`gm-secret-thing` and `core_mechanic` with `badge_scope: "game_master"`, and a
third with content matching a shared query — beside the existing
`the-thing-2`/`random-hit-location` rows (`:55-58`); the legacy variant emits
the same index with every `badge_scope` stripped and marks one entry
`category: "gm"`. Both packages are installed into
`DATA_DIR/rulesets/<slug>` before the first boot, so one server serves both.

Package tools are slug-namespaced (`index.ts:2462` registers
`${slug}_${schema.name}`; `packageSlugForTool` resolves the prefix at
`:2071-2073`), so the two variants' identically named `tools.json` entries do
not collide — they register as `fixture558_search_rules` and
`fixture558legacy_search_rules`. The legacy slug must not begin with
`<default>_`; `fixture558` / `fixture558legacy` satisfies that, and the
constraint is in fact structural — `isSafeSlug` rejects any slug containing `_`
(`holonovel/src/rulesets.ts:688`), so no slug pair can be `_`-prefix-related.
State the rule in a fixture comment anyway so a future harness copy cannot
silently shadow. A second installed package also
enters the T651 `spec_health` leg (`:303-307`), which asserts only that `SLUG`
appears and confidence is not `N/A` — both still hold; no assertion counts
packages, so no reconciliation edit is needed (re-check at T3).

Write T784 (titled `T784/REQ-210d: …`, the harness's ID/REQ prefix
convention):
1. Player + Novel bound to the default slug: package `search_rules` for a term
   matching one shared and one GM-only entry → shared only, no `[1 of 2]`
   count; `manage_ruleset (action: search)` same.
2. Player query matching only the GM-only entry → `[ERROR] [NOT_FOUND]`, body
   contains neither the entry id nor `hidden gm thing`.
3. Blank-query leg: `search_rules` with `query: ""` and `manage_ruleset
   (action: search)` with `query: " "` → returned body names no GM-only entry
   (B1).
4. Observer: same results as Player on legs 1–3.
5. Editor (`set_badge none`): both entries on a scored query.
6. Game Master: both entries; `ruleset://` read of the GM-only anchor returns
   its content.
7. Player `ruleset://` read of the same anchor → `[ERROR] [NOT_FOUND]` with no
   content and no scope confirmation.
8. Compatibility leg: Player + Novel bound to the legacy slug →
   `fixture558legacy_search_rules` (the slug-namespaced surface) omits the
   `category: "gm"` entry from a scored search, and its anchor read is
   `[NOT_FOUND]`; under Game Master both resolve. `manage_ruleset (action:
   search, slug: "fixture558legacy")` asserts the same on the host surface
   (C-2, D10).

Verify: `npm --prefix holonovel run test:ruleset-nonovel` green, then
`npm --prefix holonovel run test:selection` (pointer leg) green.

**T4 — Specification (C4, C5).**
Insert the C4 body as REQ-210d after REQ-210c (`spec/02-requirements.md:498`),
keeping canonical `**REQ-NNN — Title.**` form and the `_Check:_ T784` tail; add
the Appendix F row after T782 and the REQ index row dated `2026-11-14`; run
`npm run assemble`, then `npm run validate --sdd-strict`. Verify the body
measures 711 characters and 4 sentences and that `validate` reports no new
shape/ambiguity warning for §5.2.

**T5 — Registers and changelog (C6, text only).**
Add a `### 2026-11-14 ruleset search badge scope` subsection under `## Resolved`
in `spec/audit/review-register.md` in the shape of the neighbouring entries
(predicate re-confirmed at `ddd0e48`, re-cited at post-change lines, T784 named,
REQ-210c/REQ-210d/REQ-445 cited); delete the F-P1-17 bullet at `:2495-2503`;
delete the `ROADMAP.md:17-20` bullet (the section keeps two bullets, satisfying
the 1–3 admission rule); add the CHANGELOG entry under the `2026-11-14` date
heading (the date matches the package CalVer `2026.11.14`, which
`session:close` derives its commit subject from); run `npm run validate --
--write-register`.

**T6 — Artifacts, gates, commit (C6).**
- **T6a** — Copy the stamped plan artifact byte-for-byte from
  `/tmp/opencode/plans/2026-11-14-ruleset-search-badge-scope/plan.md` (the
  stamp's canonical copy lives under
  `~/.local/state/opencode/plans/<repo-key>/`; copy from whichever exists, and
  if neither does, the plan was never stamped — re-stamp before continuing) to
  `docs/plans/2026-11-14-ruleset-search-badge-scope/plan.md`, then write
  `tasks.md` (T0–T6 with their verification) and `aar.md` with the terminal
  `LOOP PAUSED` or `LOOP OPEN` token. This step exists because
  `check-loop-artifacts` requires all three files in a tracked increment and
  the plan lives outside the tree until now (B4).
- **T6b** — `npm --prefix holonovel run test:all`, then
  `npm run assemble && npm run check:fast`, capturing the un-piped exit code and
  the trailing `check:fast: PASS`. Running it here (after T6a) is what makes the
  PASS reachable (M3).
- **T6c** — `npm run session:close` for the single commit. It re-runs the fast
  suite and derives the subject from the CHANGELOG heading; stop and report if
  it fails rather than force the commit. Publication (`push-pipeline.sh`) is not
  part of this plan.

Dependency order: T0 → T1 → T2 → T3 → T4 → T5 → T6. T1 and T4 could run in
parallel (different files, no shared artifact), but T3's assertions must match
the shipped contract, so T3 follows T2 and precedes T4 in practice.

## Edge cases and rollback

- **Blank or whitespace query** (B1): the predicate applies to the
  blank-query slice, so a Player gets the first N *visible* entries and no
  GM-only content; T784.3 pins it.
- **Package with no index** (`[]`, as the reference fixture): every search
  returns `[NOT_FOUND]` as today; the predicate never runs. Covered by the
  existing T651 slug-search leg.
- **All matches invisible**: the filtered hit list is empty, so the existing
  empty-result branch (`index.ts:2344`, `:13700`) returns `[NOT_FOUND]` before
  the total is computed — no count leaks.
- **Total computation**: `search(..., 100000, visible)` returns visible matches
  only; if a future change bypasses the predicate for the total, T784's
  `[n of m]`-absence assertion fails loudly.
- **Legacy package** (`category: "gm"`, no `badge_scope`): denied by the
  composed predicate, exactly as today (D10); T784.8 pins it.
- **Case-insensitive anchor collision** (a GM-only and a shared entry sharing an
  anchor): filtering before `find` means the shared sibling resolves; the
  GM-only one is never selected.
- **Observer vs Player**: both are non-GM in `rulesetEntryVisible`, so one
  predicate covers both; T784 asserts Observer separately so a future split
  cannot regress silently.
- **Rollback**: revert the single commit. No persisted state changes, no
  package format change, no migration. Installed packages are unaffected in
  both directions.
- **Restart**: the server must be restarted (or repackaged) to pick up the host
  change; no Novel, package, or audit-log data is touched, so nothing is
  re-imported.

## Verification

- T784 (new) plus T179 (existing lookup filtering, unchanged), T651,
  T683-T688 (selection/search budget), T531 (disclosure control) all green in
  `npm --prefix holonovel run test:all`.
- `npm run typecheck`; `npm run check:fast` → `check:fast: PASS` after T6a.
- `check-fingerprint-sync` and `check-tool-definitions-sync` pass without
  regeneration (D5, D7); `check-reference-server-cleanliness` passes because no
  package triple is added outside `holonovel/testdata/rulesets/`.
- Grep proof at close: every Player-reachable `rulesets.search` call goes
  through `searchIndexVisible`, and the resource handler uses
  `visibleIndexEntry`.
- Editorial: REQ-210d matches the C4 block (711 chars / 4 sentences);
  Appendix F row and REQ index row present; `holonovel.md` and
  `holonovel/holonovel.md` regenerated, never hand-edited.

## Registers and generated artifacts

| Surface | Action |
|---|---|
| `spec/audit/review-register.md` | F-P1-17 → `Resolved`, scheduled bullet removed |
| `ROADMAP.md` | bullet 1 deleted; section retains bullets 2–3 |
| `spec/audit/req-coverage.md` | regenerated by `validate --write-register` |
| `holonovel.md`, `holonovel/holonovel.md` | regenerated by `npm run assemble` |
| `docs/plans/2026-11-14-ruleset-search-badge-scope/` | plan (stamped artifact), tasks, AAR |
| Fingerprints / tool definitions / surface budget / DECISIONS counts | no change (D5, D7) |

## Out of scope

- Bullet 2 (F-P1-7/8/9 authorization) and bullet 3 (F-P1-4/F-P1-13 audit
  durability).
- The builder-side emission of `badge_scope` into `index.json` for real
  packages (REQ-210c obligation, external emitter; C-2 covers the host's
  tolerance), and the retirement of the legacy `category` disjunct (D10).
- Adventure-prose search merging in `manage_ruleset (action: search)`
  (`index.ts:13691-13697`) — a separate disclosure surface with no evidence in
  this finding.
- Aggregate `spec_health` index counts (D8).
- Publishing the 78 unpushed commits.

## Conditions

- **C-1** — If T0 finds a fifth Player- or Observer-reachable index read (of
  either `rulesets.search` or `indexForReport` shape) that serves entry content,
  stop and re-scope before T2.
- **C-2** — The compatibility legs (T3.8) must pass: no previously hidden entry
  becomes visible (an index without `badge_scope` keeps its resource refusal and
  legacy `category: "gm"` rows are additionally withheld from search), and no
  installed package is held inactive (`check-fingerprint-sync` unchanged).
- **C-3** — If `validate --sdd-strict` rejects the REQ-210d body (char/sentence
  shape, hedging, or cross-reference), trim the body rather than adding a
  paragraph; the acceptance criterion and `_Check:` stay.
- **C-4** — If the `[FORBIDDEN]`→`[NOT_FOUND]` change (D3) breaks any harness
  beyond the two greps in Premises, keep the old body and record the deviation;
  a test that asserts the disclosure is itself the defect, so escalate instead
  of silently rewriting its expectation.
- **C-5** — `build-review` verifies the two diff-re-review Majors textually
  resolved here: the invariant wording in done bar 1/D5 and the composed
  `searchIndexVisible → visibleIndexEntry` chain in done bar 2. If either reads
  as an "exact parity" claim during execution, correct the wording (plan or
  seam comment) without changing the behaviour.
- **C-6** — `build-review` verifies T3's namespace reasoning at implementation
  time: the two fixture slugs must not be `_`-prefix-related
  (`index.ts:2071-2073` matches `startsWith(slug + "_")`), and the T651
  `spec_health` leg must still pass with two packages installed. If it does not,
  the harness needs its own reconciliation edit, which is a scope change.

## Unknowns

- Whether any *installed* package emitted by the external builder already writes
  `badge_scope` into `index.json`, or ships `category: "gm"` rows without it.
  The host change is correct either way (declared scope, plus the legacy
  disjunct); no such package is present in this repo to inspect, so this stays
  unverified until a rebuilt package is installed.
- Whether `session:close` requires the tracked `plan.md` to be byte-identical to
  the stamped artifact. T6a copies it verbatim, which satisfies both readings.
