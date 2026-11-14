# Plan — Trust-core authorization surface (F-P1-7, F-P1-8, F-P1-9)

Status: draft v3 (cold pass FAILED on v1; diff re-review FAILED at the standard
cap on v2; v3 resolves both re-review Blockers and the Major, unaudited by a
third pass) · Kind: planned · Depth: standard
Increment target: docs/plans/2026-11-14-trust-core-authorization/
Rollback cost: 1 (one new core module, a dispatcher branch, three list wrappers,
two prompt/resource gate maps, one new sub-REQ, harness assertions, registers;
reversible in one commit)
Evidence class: repo only
Trust boundary: every premise is read from the working tree at HEAD `2ee0724`;
the per-action Observer classification (D3) is settled by the enumeration probe
in step 1 before any assertion is written.
Evidence: preflight sidecar
`~/.local/state/opencode/plans/fe586f0907cda9bed04d391d454275b4a14bc3e300047c43f32dd854d4f08ed4/plan.evidence.md`
(plan sha256 `d72b06b1f22c0edfbdd4aab5c908069884a2b59d4e3411deeec3f7cbf2e99af6`,
git `2ee0724`). The sidecar predates the C1–C4 review amendments; the target
existence, REQ matches, and HEAD it records are still valid, and `badge-gate.ts`
/ `REQ-032c` are expected new targets.
Cold pass: `docs/plans/2026-11-14-trust-core-authorization/cold-review.md`,
sha256 of the reviewed plan `cd49ce9aaf7e22312d0feacfbea78be5751bbd0054f710330c45c92f817d0b9b`,
verdict FAILED (2 Blockers, 8 Majors, 5 Nits) — each resolved below and listed
in `tasks.md`.

## Questions

1. Which roadmap item is next? `ROADMAP.md:15-27` § *Trust-core contract
   remediation (P1)* has exactly two bullets today. The first is the
   authorization surface: gate the badge class in the dispatcher and make
   `tools/list`, `prompts/list`, and `resources/list` badge-filtered metadata
   surfaces (F-P1-7, F-P1-8, F-P1-9). The second is audit durability and badge
   truth (F-P1-4, F-P1-13). The output half of the first bullet was closed by
   `2026-11-14-trust-core-output-channel`; this increment takes its
   authorization remainder, leaving one bullet (the second) in the section.
2. Is the authorization surface one increment? Yes. The three findings are one
   mechanism — the active badge must gate the call path and the three metadata
   surfaces from one classification source (D3) — and the prior increment
   deliberately split them out because they need a per-action read-only
   classification that does not exist yet (D1 of that plan).

## Objective

Take the remaining bullet of `ROADMAP.md` § *Trust-core contract remediation
(P1)* and close:

| Finding | Register | Promise |
|---|---|---|
| F-P1-7 | `review-register.md:2500-2504` | no badge gate in the dispatcher; authorization is 142 handler-local `requireGM()` calls |
| F-P1-8 | `review-register.md:2505-2509` | Observer `tools/list` admits every non-GM-only tool, including mutating ones that then refuse |
| F-P1-9 | `review-register.md:2510-2514` | `prompts/list` and `resources/list` apply no badge filter at all |

**Done bar:**

1. `guardToolCall` refuses a badged call before the tool handler runs: under the
   Player badge a GM-only tool is refused, and under the Observer badge every
   action the classification does not mark state-reading is refused. Each
   refusal carries the same `[ERROR] [FORBIDDEN]` envelope and corrective action
   the handler-local guard emits today, and appends exactly one
   `[BOUNDARY_VIOLATION]` audit entry (REQ-133a). With the surface registry
   absent the gate is inert and the unchanged handler-local guards remain the
   backstop (D2). Asserted by T349 (extended) and by unit tests of the pure
   classifier, including the registry-absent case.
2. Observer `tools/list` returns exactly the tools that hold at least one
   permitted action plus the always-callable `set_badge`, with one documented
   rule for tools that hold no registry entry (package tools: listed iff their
   registration annotation is read-only); Editor and Game Master stay
   unfiltered; the Player list is unchanged. Asserted by T151 (extended)
   against the surface registry, plus a package-tool leg.
3. `prompts/list` applies each prompt's declared badge gate and `prompts/get`
   refuses a gated prompt for a badge outside the gate. No shipped host prompt
   is GM-gated (REQ-063/078/089 declare the shipped six visible to all badges),
   so the Player list equals the GM list today; the gate is exercised by a
   unit test over a synthetic declaration, not by a shipped prompt. The
   Player-visible leak this closes is content: `run_workflow` composes its tool
   map **and** its categories from badge-visible tools only (filter runs before
   `runWorkflowCategories`), so a Player never reads a GM-only tool name.
   Asserted by T349 (extended) and by the gate unit test.
4. `resources/list` omits each entry the active badge may not read: under the
   Player badge `spec://build` and the two `guidance://game_master` entries are
   absent; Game Master, Observer, and Editor still list them. `resources/read`
   behaviour is unchanged. Asserted by T16/T104 (extended).
5. The enabling contract is written as new **REQ-032c** (Observer permitted
   actions and metadata-surface filtering) with its Appendix REQ index row and
   `_Check:_ T151, T349`; T16, T104, T151, and T349 rows name the new behaviour.
   Bodies re-measured to ≤800 chars and ≤8 sentences.
6. F-P1-7/F-P1-8/F-P1-9 are `Resolved` with predicates recomputed at the
   post-change lines; `ROADMAP.md` drops the authorization bullet and keeps the
   audit/badge-truth bullet, so the section stays inside the admission rule and
   its `**Trigger:**` line is updated to name only the remaining work; the
   coverage register is regenerated.
7. `npm --prefix holonovel run test:all` is green after anchor repoints;
   `npm run assemble && npm run check:fast` reports the trailing
   `check:fast: PASS`; `check-registers`, `check-roadmap`, and
   `check-loop-artifacts` pass.
8. One `npm run session:close` commit. Publication is out of scope.

## Premises (each read at HEAD `2ee0724`)

**Baseline.**

- `npm run check:fast` is green: `41 passed, 0 failed`, trailing
  `check:fast: PASS` (run at the start of this session). `git status` is clean.

**Call path.**

- `toolsVisibleToBadge` (`holonovel/src/index.ts:347-350`) returns true for
  `game_master` and `none`, and otherwise only excludes `GM_ONLY_TOOLS`
  (`:338`). `PLAYER_ONLY_TOOLS` is empty (`:339`); `toolGate` maps a name to
  `un-gated`/`GM-only`/`Player` (`:340-344`). Observer is indistinguishable from
  Player here — the predicate F-P1-8 cites at `:347`.
- `guardToolCall` (`:1974-2005`) handles retired aliases, ruleset scope, and
  `surfaceGuard`; it holds no badge predicate. It is installed as a
  `tools/call` wrapper in `installSurfaceGuards` (`:2007-2019`) and returns its
  envelope before the SDK dispatches the handler.
- `withForbiddenAudit` (`holonovel/src/core/server.ts:43-75`) audits a
  `[FORBIDDEN]` a handler returns or throws. A dispatcher refusal never reaches
  it, so a dispatcher-level badge gate must perform the REQ-133a audit itself
  (D2).
- The gate classification is tool-level: four tools are GM-only
  (`index.ts:338`), and the handler-local authorization surface is 142
  `requireGM(` occurrences (plus `requireNotObserver()` call sites).

**Classification source.**

- `holonovel/tool-surface-registry.json` is the committed surface contract
  (REQ-567, Appendix T.3). It carries 299 action keys; `mutation_class` counts
  are read 91 / write 158 / idempotent 28 / destructive 22. Per-action reads
  include `manage_context.discover`, `manage_context.recap`,
  `manage_character.sheet`, `manage_diagnostics.health`, and `take_turn`.
  `take_turn` is the only tool whose every action is `read`.
- The server loads it in `surfaceRegistry()` (`index.ts:1785-1796`, typed
  `:1772-1782`) and already resolves the same `${name}.${action}` key in
  `surfaceRefusal` (`:1906-1937`). A missing registry degrades to the full
  catalog (`:1790-1794`), a convention this gate must preserve (D4).
- `surface-projection.ts` already exports the registry types
  (`SurfaceDeclaration`, `SurfaceRegistryLike`, `holonovel/src/core/surface-
  projection.ts:14-27`) as a server-free module, so `badge-gate.ts` can import
  them rather than redeclaring the shape in `index.ts`.
- `TOOL_ANNOTATIONS` (`:191-230`) is tool-level and marks every action tool
  `MUTATING`; only `take_turn` is `READ_ONLY`. Tool-level annotations therefore
  cannot express the Observer subset REQ-032a requires (D3).
- Package tools are registered at runtime and are not in the committed
  registry; their annotations are derived at registration from the ruleset
  schema kind (`lookup`/`search`/`info` idempotent, `roll`/`table` generation).

**Metadata surfaces.**

- `installBadgeFilteredToolList` (`:17884-17900`) filters the SDK catalog
  through `toolsVisibleToBadge`, so F-P1-8 is a one-function change once the
  classification exists.
- `installPackagePromptSurface` (`:18005-18035`) wraps `prompts/list` and
  `prompts/get`, merges `packagePromptList()` (`:2158-2166`), and never calls
  `getBadge()` — the predicate F-P1-9 cites at `:18005`.
- No `resources/list` handler is installed (`grep -n
  "ListResourcesRequestSchema" holonovel/src/index.ts` is empty), so the SDK's
  default handler serves the registration map unfiltered.
- The six host prompts are `intro` (`:16915`), `badge_briefing` (`:17569`),
  `narrate` (`:17573`), `session_zero` (`:17588`), `novel_setup` (`:17618`), and
  `run_workflow` (`:17646`). REQ-063 makes `intro` visible to all badges and
  REQ-078 makes `session_zero` unfiltered, so no shipped host prompt is GM-only.
  `run_workflow` composes from every registered tool name (`:17649-17656`) — the
  one genuine Player-visible GM leak on this surface.
- `spec://build` is registered at `:15554` and refuses non-GM reads at `:15556`;
  `guidance://game_master` (`:15336`) and `guidance://game_master/anti-slop`
  (`:15344`) carry GM prose with no badge check. T104's harness reads but does
  not list `spec://build` under Player (`test-backfill.ts:199-208`), so removing
  a GM-only entry from the Player list is compatible with it.
- T16 lists resources under the GM badge (`test-backfill.ts:182-196`), so no
  existing assertion pins the Player list membership.

**Spec-project mechanics.**

- REQ-031a (`spec/02-requirements.md:1225`), REQ-032a (`:1235`), and REQ-305a
  (`:1289`) already state the contracts; the §5.5 REQ map row (`:13`) lists base
  `032`, so a new REQ-032c needs no map edit. The Appendix REQ index lists
  REQ-031a/032a at `spec/appendices-reference.md:304-310`.
- Appendix F rows: T16 `:1449`, T104 `:1575`, T151 `:1652`, T349 `:1779`.
- §5.5 is not a fingerprinted section (the list in
  `scripts/lib/contract-fingerprint.ts` covers §5.6, §5.9, §5.16, §5.17, §5.19,
  §6.3, §6.4.2), so no fingerprint regeneration is expected.
- Register rows: F-P1-7 `:2500-2504`, F-P1-8 `:2505-2509`, F-P1-9
  `:2510-2514`; the roadmap bullet is `ROADMAP.md:17-27`.

## Decisions

**D1 — this increment is the authorization surface only.** F-P1-4 (audit at
capacity aborts after the save) and F-P1-13 (`set_badge` with no active Novel)
are the section's other bullet and stay scheduled. They touch the audit append path and the badge
handler, not the dispatcher or the metadata surfaces; bundling them would put
two failure classes and two rollback stories in one review surface. Rejected:
all five findings in one commit.

**D2 — the gate sits in `guardToolCall`, and performs its own boundary audit.**
The wrapper already refuses before the handler and already owns the refusal
envelope, so a badge predicate joins the retired-alias, ruleset-scope, and
surface predicates there. Because the handler never runs, `withForbiddenAudit`
cannot record the refusal; the gate calls `state.auditForbidden(getBadge(),
name, args)` instead (REQ-133a) and returns the refusal. Rejected: a second
handler wrapper (a second audit path, and it would run after the handler
dispatch); auditing in `guardToolCall` through `audit()` (wrong entry shape —
REQ-133a requires `violation_type: boundary`). When the registry is absent the
gate returns null and the unchanged handler-local guards remain the backstop;
the degraded path is unit-tested so F-P1-7/F-P1-8 are not silently claimed
closed on a broken install.

**D3 — Observer permission is per action, fail-closed, from the surface
registry read class plus an explicit deny set.** The rule is: a key is
permitted when the registry calls it `read` **and** it is not in
`OBSERVER_DENY_ACTIONS`; every other key, including a key the registry does not
carry, is refused. `mutation_class: "read"` is the closest existing contract to
REQ-015's read-only/state-reading classes and is validated by
`check-tool-surface`, but the registry is not authoritative for semantics: it
lists `manage_vow.resolve` as `read` while the handler calls `requireGM()` and
mutates (`index.ts:9256-9280`). It also over-admits generation actions
(`resolve_mechanic.roll`, `resolve_mechanic.fate_roll`, the retired
`manage_ruleset.roll` tombstone) and any command action mislabelled `read`, so
the module carries `OBSERVER_DENY_ACTIONS` with a REQ-015 label per entry.
Keys are `${name}.${action}` when the registry has that key, else the bare tool
name (`set_badge`, `open_session`, `close_session`, `respond_decision`,
`take_turn` are bare-key entries). The deny set is settled by **static
inspection of every read-classed action's handler** for the mutation primitives
(`novelSnapshot()`, `audit(`, `state.saveNovel`, `capGuard`, `recordEvent`),
then spot-probed at runtime; the step-1 pass also checks the inverse — that
every state-reading action named in the repo resolves to a registry `read`
entry or an explicit deny entry — so a mislabelled `idempotent` action cannot
silently remove a legitimate read. Unit tests assert every deny key exists in
the registry with class `read`, no non-read key is listed, and the four
known-mutating read keys are denied. Rejected: fail-open on the registry read
class alone (`manage_vow.resolve` is the counterexample); tool-level
`readOnlyHint` (marks every action tool mutating); a new registry field (299
hand-maintained rows and a `check-tool-surface` schema change for one
consumer); a 91-entry allowlist in code (the deny list is smaller and the
registry keeps the allow rule).

**D4 — unregistered tools are classified by their registration annotation,
and the list and call paths share one predicate.** A package tool has no
registry entry; it is permitted when its registration-time `readOnlyHint` is
true (ruleset lookup/search/info kinds) and refused otherwise (roll/table
kinds, REQ-015 generation). The predicate therefore takes the tool's
annotations, and `toolsVisibleToBadge` takes the tool object rather than the
name, so the `tools/list` call site (`index.ts:17900`) and the dispatcher use
the same rule — no tool can be listed but uncallable, or callable but unlisted.
Host tools also carry annotations in the registry (`TOOL_ANNOTATIONS`), so the
fallback is uniform. When `surfaceRegistry()` returns null the gate is inert
and the catalog is served unfiltered, matching the existing documented
degradation; the unchanged handler guards remain the backstop (D2). Rejected:
refusing every unregistered action (breaks ruleset lookups under Observer);
denying everything when the registry is absent (turns a packaging omission
into a read-only lockout); a name-only predicate (the B2 mismatch).

**D5 — list filtering rules are per surface, and REQ-032a's "strict subset"
is read as badge-declaration, not catalog arithmetic.** Tools: Observer sees a
tool iff it holds a permitted action or an unregistered read-only annotation,
plus `set_badge` (REQ-032a/REQ-305a always need the badge switch); Player keeps
the current GM-only exclusion; Editor and Game Master are unfiltered. Prompts:
each prompt carries a declared gate (`shared` or `GM-only`) in a
`PROMPT_GATE` map; the shipped six are all `shared` because REQ-063/078/089
declare `intro`, `session_zero`, and the rest visible to all badges, so the
Player list equals the GM list today and no `prompts/get` refusal fires for a
shipped prompt. REQ-032a's "strict subset" therefore holds on the surfaces
where the shipped catalog is badge-scoped (tools, resources) and holds
vacuously on prompts; the plan records this reading in D-decision form and in
the AAR rather than inventing a GM-gated prompt. The real Player leak on this
surface is content: `run_workflow` composes from badge-visible tools, filtered
before `runWorkflowCategories`. Resources: an entry is hidden when its read is
GM-only; today that is `spec://build` and the two `guidance://game_master*`
entries, expressed as a `RESOURCE_GATE` prefix map. Observer keeps the full
state surface (REQ-305a), so the resource filter is Player-only. The two maps
live in `badge-gate.ts` beside the deny set, so the module is the single
ownership point even though the rules differ per surface. Rejected: filtering
resources by content badge-scope (entries like `lore://` are already
content-filtered on read and must stay listed); hiding `run_workflow` itself
(it is the discovery prompt and is badge-neutral in name); a Player-gated
`novel_setup` or `narrate` (neither REQ names a badge gate, and a wrong gate
would break REQ-089/REQ-598).

**D6 — dispatcher refusals reuse the handler-local wording.** The Observer
refusal keeps `"[FORBIDDEN] Observer mode is read-only. Corrective action:
switch badges with set_badge to interact."` and the Player refusal keeps
`"[FORBIDDEN] This tool is Game Master only. Corrective action: use set_badge
to switch."` (both from `StateManager.requireGM`, `core/state.ts:1213-1217`),
so the three audit assertions that already read this text stay valid and no
client sees a wording change. Rejected: adopting REQ-032a's "Switch badges with
`set_badge` to interact" phrasing in a second variant (two texts for one
condition).

**D7 — no new tool, no gate-classification table change.** The table stays
three-class (REQ-137a); Observer is derived from the surface registry, not a
fourth column, and `DECISIONS.md` gains a prose paragraph recording the
derivation beside the table. Rejected: a fourth Gate value (REQ-137a defines
three; T151 asserts `valid` is exactly those three).

**D8 — one new sub-REQ carries the contract.** REQ-032c states the Observer
permitted-action rule and the metadata-surface rule; REQ-032a's body is already
seven sentences, and the addition would approach the 8-sentence/800-char body
limits.
The new REQ binds `_Check:_ T151, T349`. Rejected: amending REQ-032a (shape
limit) and leaving it implicit (the register finding is that no gate asserts
the surface at all).

**D9 — one commit, no fingerprint regeneration.** §5.5 is not fingerprinted and
no tool schema or parameter changes, so `contract-fingerprints.ts`,
`tool-definitions.json`, and `surface-budget` are expected untouched; if
`check-fingerprint-sync` or `check-tool-definitions-sync` disagrees at execution
the plan amends rather than hand-edits the artifacts.

## Change entries

**C1 (M) — the classifier module.** Add `holonovel/src/core/badge-gate.ts`
(pure, no server import; registry types imported from `./surface-projection.js`,
which already declares `SurfaceDeclaration`/`SurfaceRegistryLike`): `actionKey(
name, args)` with a bare-key fallback, `observerActionAllowed(registry, key)`,
`toolObserverVisible(registry, name, annotations)`, `badgeRefusalFor(badge,
name, args, registry, annotations)`, `OBSERVER_DENY_ACTIONS` (REQ-015-labelled),
and the `PROMPT_GATE`/`RESOURCE_GATE` maps (D5), plus the pure
`promptAllowed(gates, badge, name)` / `promptRefusalFor(gates, badge, name)` and
`resourceAllowed(gates, badge, uri)` helpers so the filters are testable over a
synthetic declaration without booting the server. `badgeRefusalFor` takes the
`Badge` and annotation shapes structurally so the module stays server-free. The
call site passes `toolRegistry.get(name)?.config.annotations` — the registry
stores the four hints for host and package tools alike (`src/tool-registry.ts:
10-25`, `:302-320`). The list predicate takes the tool object so the same
annotations flow to `tools/list`. Re-export the module's public functions from
`holonovel/src/core/index.ts`. Header carries the REQ citations (REQ-032a,
REQ-032c, REQ-305a, REQ-137b); this is library code, not a script, so the script
role header does not apply. Its unit assertions live in `test-security.ts`.

**C2 (M) — dispatcher gate and boundary audit.** In `guardToolCall`
(`index.ts:1974-2005`), after the retired-alias check and before
`surfaceGuard`, compute `badgeRefusalFor(getBadge(), toolName, callArgs,
surfaceRegistry(), toolRegistry.get(toolName)?.config.annotations)`; on a
refusal call `state.auditForbidden(getBadge(), toolName, callArgs)` and return
`dispatcherRefusal("FORBIDDEN", text)`. Skip the gate when no Novel is active,
when the name is absent from `toolRegistry` (not the surface registry — package
tools are in `toolRegistry` but not in the surface registry), and when
`set_badge` is the target. Editor
(`none`) and Game Master pass unchanged. When `surfaceRegistry()` is null the
classifier returns null and the handler guards remain the backstop (D2).

**C3 (S) — metadata surfaces.** (a) `toolsVisibleToBadge` (`:347-350`) gains the Observer branch through
`toolObserverVisible` (including the unregistered-tool annotation rule) and
takes an optional annotations argument; both call sites change — `:17900`
passes the SDK tool's own annotations, and `groupDirectory()` at `:1878`
passes `toolRegistry.get(tool)?.config.annotations` for the tool name it
derives from the registry key — so the group directory cannot list a mutating
tool to the Observer. Editor/GM/Player behaviour is identical. (b)
`installPackagePromptSurface` (`:18005-18035`) filters the host and package
lists through `promptAllowed(PROMPT_GATE, badge, name)` (a `shared` default) and
refuses a `GM-only` prompt on `prompts/get` with
`promptRefusalFor(PROMPT_GATE, badge, name)`; the step-1 probe confirms every shipped prompt's declaration
before the assertion is written. (c) `run_workflow` (`:17646-17656`) filters
its tool names through `toolsVisibleToBadge` **before** the filtered list is
passed to both `composeRunWorkflow` and `runWorkflowCategories`, so no category
label derived from a GM-only tool survives. (d) Add
`installBadgeFilteredResourceList()`
beside the prompt wrapper: import `ListResourcesRequestSchema` beside the
existing prompt/tool schema imports (`:12`), wrap the SDK `resources/list`
handler, drop entries matching `RESOURCE_GATE` (`spec://build`,
`guidance://game_master`, `guidance://game_master/anti-slop`) when the badge is
Player, and leave `resources/templates/list` untouched.

**C4 (S) — spec contract.** Add **REQ-032c** after REQ-032b
(`spec/02-requirements.md:1240`): Observer-visible actions are the state-reading
ones, every other action returns `[FORBIDDEN]` with the D6 wording (the
handler-local corrective action, which is also REQ-032a's substance),
`tools/list`/`prompts/list`/`resources/list` are filtered by active
badge, and Observer keeps the REQ-305a state surface. `_Check:_ T151, T349`.
REQ-032c also records the D5 reading: a prompt or resource filter applies each
entry's declared badge gate, and the shipped prompt set declares `shared`.
Add the Appendix REQ index row after `spec/appendices-reference.md:310`; amend
T16 (`:1449`), T104 (`:1575`), T151 (`:1652`), and T349 (`:1779`) rows to name
the filtered-list and dispatcher assertions, and add the `REQ-032c` token to the
T151 and T349 harness titles so the token-presence coverage match resolves the
new REQ (the `_Check:_` binding alone does not). Measure the new body (≤800
chars, ≤8 sentences) and apply Appendix M.

**C5 (S) — registers, roadmap, coverage, changelog.**
`spec/audit/review-register.md`: F-P1-7/F-P1-8/F-P1-9 → `Resolved` with
predicates recomputed at the post-change lines and T151/T349 named.
`ROADMAP.md`: remove the authorization bullet; keep the audit/badge-truth
bullet and retitle the section's trigger to that remainder. Regenerate
`spec/audit/req-coverage.md`. Add the `CHANGELOG.md` entry headed
`2026-11-14` — the package version is `2026.11.14`, and `session:close` derives
the commit subject from the top dated heading, so the date is pinned, not
chosen.

## Blast radius

| File | Change | Size |
|---|---|---|
| `holonovel/src/core/badge-gate.ts` | new pure classifier + deny set | M |
| `holonovel/src/core/index.ts` | barrel re-export | S |
| `holonovel/src/index.ts` | dispatcher gate, observer tools filter, prompt filter, `run_workflow` filter, resource-list wrapper, comments | M |
| `holonovel/DECISIONS.md` | prose paragraph recording the Observer derivation beside the gate table | S |
| `spec/02-requirements.md` | new REQ-032c | S |
| `spec/appendices-reference.md` | REQ index row; T16/T104/T151/T349 rows | S |
| `spec/audit/review-register.md` | 3 resolved rows | S |
| `spec/audit/req-coverage.md` | regenerated | S |
| `ROADMAP.md` | bullet removed, trigger retitled | S |
| `CHANGELOG.md` | dated entry | S |
| `holonovel/scripts/test-tool-definitions.ts` | T151 extended | M |
| `holonovel/scripts/test-output-contracts.ts` | T349 extended | M |
| `holonovel/scripts/test-backfill.ts` | T16/T104 extended | S |
| `holonovel/scripts/test-security.ts` | classifier unit assertions | S |
| `holonovel/scripts/lib/holosuite-*.ts` | anchor repoints if `src/index.ts` shifts | S |
| `docs/plans/2026-11-14-trust-core-authorization/` | plan, tasks, AAR | S |

Verify-no-change: `holonovel/tool-definitions.json`,
`holonovel/src/generated/contract-fingerprints.ts`, `docs/engine-contract.md`,
reference package content. `holonovel/DECISIONS.md` **does** change (the prose
paragraph); its gate-classification table rows do not. The prose paragraph records both the
Observer derivation (D7) and the REQ-032a reading from D5: "strict subset" binds
where a badge-scoped prompt/resource exists, and the shipped six prompts declare
`shared`.

## Dependency order

1. **Enumerate before asserting** (`/tmp/opencode/probe-badge-gate.ts`, scratch
   `TTRPG_DATA_DIR`): boot a seeded Novel, set Observer. (a) **Static sweep**:
   extract each of the 91 read-classed actions' handler block and record every
   mutation primitive (`novelSnapshot()`, `audit(`, `state.saveNovel`,
   `capGuard`, `recordEvent`); each hit becomes a deny entry with its REQ-015
   label (`manage_vow.resolve` is the known first hit). (b) **Inverse sweep**:
   check every `idempotent`-classed action against its handler and record any
   that is state-reading, so no legitimate read is lost. (c) **Runtime spot
   probe**: call the deny candidates and a sample of allowed reads, recording
   refusal, audit append, and state digest change. (d) **Baseline**: record the
   current Player and Observer `tools/list`, `prompts/list`, `resources/list`
   payloads. (e) **Prompt declarations**: read each of the six prompt handlers
   for a badge predicate and record the result (the plan expects none). (f)
   **Bare-key check**: confirm `actionKey` resolves the five bare-key entries
   (`set_badge`, `open_session`, `close_session`, `respond_decision`,
   `take_turn`) and record the Observer outcome for `close_session`. (g) **SDK
   seam**: confirm `_requestHandlers.get("resources/list")` is reachable in
   `main()` before the wrapper is installed. Finally grep the sibling contracts
   the change can disturb —
   every `_Check:_` citation of REQ-031a, REQ-032a/b, REQ-137a/b, REQ-148,
   REQ-150, REQ-305, REQ-349, and REQ-366b across `spec/` and
   `holonovel/scripts/` — and record any assertion the new gate would change.
   No assertion before this probe.
2. C1 red: the classifier unit test fails on the missing module; T349/T151
   assertion stubs fail.
3. C2, then C3 — run `test:security`, `test:output-contracts`,
   `test-tool-definitions`, and `test:backfill` after each.
4. C4, then `npm run assemble`; re-measure REQ-032c.
5. `npm --prefix holonovel run test:all`; repoint drifted anchors and re-run.
6. C5: registers → roadmap → coverage → changelog, recomputing each predicate
   at the current line.
7. `npm run assemble && npm run check:fast`, then `npm run session:close`.

## Edge cases and rollback

- **No active Novel.** `getBadge()` resolves `none`, the gate is inert, and
  `set_badge` keeps its current no-Novel behaviour (F-P1-13 is out of scope).
- **Unknown tool name.** The gate only classifies registered names; unknown
  names keep flowing to the SDK's own error path.
- **Registry absent or unreadable.** The gate is inert and the catalog is
  unfiltered (the documented degradation), never a lockout; the 142
  handler-local guards remain the backstop, and a unit test pins that the
  classifier returns null rather than throwing.
- **Package action not in the registry.** Classified by the registration-time
  annotation through the tool object; `roll`/`table` kinds are refused, ruleset
  lookups are admitted, and the same predicate drives list and call so a listed
  tool is callable and a callable tool is listed.
- **Bare-key tools.** `actionKey` falls back to the tool name; `take_turn`
  (read) is admitted, `open_session`/`close_session`/`respond_decision` (write)
  are refused. REQ-305a names `set_badge` as the way out, so the
  `open_session → take_turn → close_session` path cannot complete under Observer;
  T349 pins that `close_session` refusal and `set_badge` escape rather than
  leaving it emergent.
- **`take_turn` under Observer.** Registry class `read` and no deny entry, so
  admitted — the AI plays both roles (REQ-305a) and the call is the spectator's
  way to advance. If the step-1 probe shows it mutates authored state rather
  than narration, it moves into the deny set and the AAR records the amendment.
- **Refusal wording drift.** The dispatcher and the handler-local guard must
  not both run: the wrapper returns before dispatch, so the boundary audit lands
  once. A test asserts one `[BOUNDARY_VIOLATION]` entry per refused call.
- **A GM-only resource under Player.** Omitted from `resources/list` but still
  readable-with-refusal if the caller holds the URI — the read contract is
  unchanged and T104 still passes.
- **Pagination.** The tool list filter (`index.ts:17900`) runs before the
  existing group/profile/pagination projection (`:17901` onward), so page sizes
  are computed over the visible catalog.
- **`src/index.ts` line shifts break Holosuite anchors.** `test:all` names each;
  repoint and verify the symbol on the new line.
- Rollback: one `git revert`; no persisted data shape changes (the gate reads
  the registry and the Novel badge, and writes only audit entries the existing
  path already writes).

## Verification

| Bar | Command |
|---|---|
| 1, 2 | `npm --prefix holonovel run test:security` (classifier unit assertions incl. registry-absent and bare-key cases, boundary audit) |
| 1, 2, 3 | `npm --prefix holonovel run test:output-contracts` (T349) |
| 2, 3 | `npm --prefix holonovel run test:tool-definitions` (T151) |
| 3, 4 | `npm --prefix holonovel run test:backfill` (T16, T104) |
| 1–4 | `npm --prefix holonovel run test:all` |
| 5 | `npm run assemble && npm run validate` (REQ shape, char/sentence limits) |
| 6 | `npm run check-registers`, `npm run check-roadmap`, `npm run check-loop-artifacts` |
| 6 | `npm run validate -- --write-register` |
| 7 | `npm run assemble && npm run check:fast` → trailing `check:fast: PASS` |
| — | `npm run check-tool-surface`, `npm run check-fingerprint-sync` (expected no change) |

## User impact and commit order

Client-visible: under the Observer badge, `tools/list` shrinks to the tools with
a permitted state-reading action plus `set_badge`; a mutating call on a visible
tool is refused by the dispatcher before the handler and recorded as a boundary
violation; under Player a GM-only call is refused at dispatch instead of inside
the handler (same text); `resources/list` omits GM-only entries for Player;
`run_workflow` no longer names GM-only tools — or categories derived from them
— to a Player; `prompts/list` applies a declared gate (identity today, because
all six shipped prompts declare `shared`). Editor and Game Master behaviour is
unchanged. No restart, parameter, or persisted-data change.

One commit: `2026-11-14 — trust-core authorization surface: dispatcher badge
gate, Observer read-only tools/list, badge-filtered prompts and resources`.

## Out of scope

F-P1-4 and F-P1-13 (audit at capacity, `set_badge` without a Novel) — the next
roadmap bullet; the §5.1/§5.3/§5.5 citation-repair sections; harness test-ID
label hygiene; Holosuite anchor automation; prompt truncation (REQ-118/REQ-135);
a fourth DECISIONS gate class; `resources/templates/list` filtering.
