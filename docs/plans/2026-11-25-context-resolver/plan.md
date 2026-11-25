# Plan — context resolver, checked audit, and the two no-Novel authoring paths (A1 + A2)

Depth: standard · Changes how the software behaves: yes · Read time: ~3 min

## 1. What you asked for
*Did I get this right?*
You asked me to finish reviewing and rewrite the plan so it can be executed: one resolver that
decides which store an operation acts on, an audit that stops the old assumption that everything
needs a campaign, and the no-campaign authoring paths working.

## 2. What changes for you
*Is this the change you expected?*
- A player character can be created with no campaign open and lands on the roster; an NPC created
  with no campaign open lands in the shared library.
- Every time the server resolves a store, the response says which one it used.
- A new check fails the build when a code path quietly reintroduces "campaign required".
- Three spec requirements are amended and one added; existing campaigns report a stale spec
  fingerprint in health, and still load.

## 3. Decisions I made for you
*Do any of these feel wrong?*
Standing rulings applied: roadmap decision 2 (context resolves and prints) and decision 3 (the codex
can carry anything a novel can). The engine's own decision record carries no context ruling; the
authoring roadmap is the governing record for this program.
1. **The audit covers all four tool files, not the one the roadmap counted.** The roadmap says 129
   call sites; the code holds 186 across four files. *Rejected:* auditing only the 129 and leaving 57
   unclassified. Why: a checked table that ignores 57 sites is the leak it exists to prevent.
   **Recommend: 186, with the roadmap corrected.**
2. **A campaign beats an authoring default.** With a campaign open, an operation that has a campaign
   meaning stays in the campaign; the shared library is reached by naming it. *Rejected:* the
   roadmap's literal order, which sends lore and note authoring to the library whenever a campaign is
   open. Why: that changes behaviour at most of the 186 sites. **Recommend: campaign wins.**
3. **The adventure tool keeps its own destination field.** It already takes one; adding a second
   would change what an existing free-text field means. *Rejected:* renaming the free-text field.
   Why: removing a shipped parameter needs a deprecation cycle. **Recommend: keep it.**
4. **The audit table is code, not prose.** A generated page publishes it and a check enforces it.
   *Rejected:* a hand-written table. Why: prose cannot fail a build. **Recommend: code.**
5. **Three requirements are amended, not one.** Making NPC creation work without a campaign touches the
   NPC requirement's two parts as well as the lifecycle requirement.

## 4. What could go wrong
*[my homework]*
- **A campaign-less creation is not written to the campaign audit log, because there is no campaign.**
  You would notice a roster entry with no audit trail. Guard: the roster entry records its own
  creation time and badge; a server-level audit log is scheduled, not invented here. Likelihood: high.
- **Removing the campaign requirement changes what "orphan" means.** You would notice older guidance
  still calling roster-only characters a defect. Guard: all three requirements and the roadmap are
  amended in the same increment. Likelihood: low.
- **The audit check misattributes a call and blocks on a false finding.** You would notice a red gate
  over a correctly classified site. Guard: its first run is a dry run whose observed list — not a
  hand-count — generates the table. Likelihood: medium.
- **Case against doing this at all:** the roster and the library already accept content through other
  routes, so these paths mostly remove a detour rather than unlock anything new. Likelihood: medium.

## 5. What it costs
*[my homework]*
- One session, two if the spec pass runs long; about 30 files, one new check, one new harness —
  estimated.
- Existing campaigns report a stale spec fingerprint in health until their next write — known,
  non-blocking.
- No migration, no new persisted state beyond two additive roster fields, and no change to where
  campaigns, libraries, or the roster are stored — known. The only new path is a documentation
  directory for the generated audit page.

## 6. What I need from you
*[my homework, yours to overrule]*
- **Undo.** A roster-only creation cannot be undone by the history tool, because undo snapshots
  campaigns. Default: removal is the inverse, and the limitation is documented.
- **Ruleset for a campaign-less character.** Default: profile-only unless the caller names an
  installed ruleset; with several installed and none named, refuse and list them.

<!-- end decision brief -->

**Kind:** planned · **Depth:** standard · **Rollback cost:** 1 (reversible edits, two new modules,
one new check, one new harness; no migration) · **Evidence:** HEAD `1af336f`; all line numbers below
measured in this worktree on 2026-11-25. The gate baseline is established by T1, not asserted here.
**Trust boundary:** `repo` evidence only.

**Done bar:** `resolveContext()` passes the six precedence tests; every successful response from a
`wrapped: true` action names its store; `check-context-audit` reports zero unclassified rows and zero
count mismatches; the five no-Novel proofs pass; `npm run check` is green; the tool definitions,
surface budget, and contract fingerprints are regenerated; `npm run check:fast` prints `PASS`.

## Questions

The maintainer asked for authoring features that are descriptive, not prescriptive, and for novel,
codex, roster, and reference to be peers. The first executable increment is the one every other
increment depends on: a context resolver, a checked audit of every place the server assumes a Novel,
and the two creation paths that assumption currently blocks.

The questions this plan answers:

1. Where does context resolution live, and what is its exact precedence?
2. Which of the **186** `requireNovel()` sites are genuinely Novel-only, which are context-agnostic,
   and which are wrongly bound?
3. What does a context-aware response carry, and how is it printed?
4. Which unbindings land here, and which belong to roster parity (A3) or codex parity (A4)?

## Trigger status

- **Trigger:** the 2026-11-25 authoring-surfaces roadmap, decisions 1–11, and the maintainer's `go`
  for A1 + A2 with the expanded scope ruled on 2026-11-25 (roster and NPC creation unbind now).
- **Priority:** P0 for the authoring program. It blocks A3, A4, A6, B9, S1, and the CLI's `context`
  command.
- **Selection:** maintainer selection, not automatic.

## Why

**EV1 — the Novel assumption is measured, not asserted.** `requireNovel()` is called **186 times**
across the four tool-surface files: `holonovel/src/index.ts` 129, `holonovel/src/tools/knowledge.ts`
41, `holonovel/src/tools/world-crud.ts` 12, `holonovel/src/tools/world-model.ts` 4. The roadmap's
"129" counts only `index.ts`, whose 16,304 lines no longer hold the whole surface.

**EV2 — the creation path is the measured defect.** `manage_character (action: create)` calls
`requireNovel()` at `holonovel/src/index.ts:5087`, then `getCharacterRules(novel)` at `:5088` and
`capGuard("entities", novel.entities.size)` at `:5102`. A player character therefore cannot be created
without a Novel, although `roster.json` is a persistent, ruleset-scoped store
(`holonovel/src/core/state.ts:3147`, `:3081`). `manage_npc (action: create)` has the same shape at
`:6737-6739`.

**EV3 — the codex already declares the right default.** The `manage_codex` description says "With no
Novel active, the codex is the default store" (`:13996`); `set`, `list`, `get`, and `export` carry no
Novel guard (the first is at `capture`, `:14083`). This is the first proof that a no-Novel path works.

**EV4 — the adventure surface already implements the pattern.** `manage_adventure` accepts
`target: novel | codex | both` (`:9656`) and defaults to `codex` when no Novel is active (`:9667`).
It also already uses the identifier `context` for a *different* thing — free-text scene context for
`generate_encounter` (`:9657`).

**EV5 — ruleset search is already Novel-independent with an explicit slug.** The `manage_ruleset`
handler's only `requireNovel()` calls are `import_supplementary` and `remove_supplementary`
(`holonovel/src/index.ts`; 2 sites), so `search` with an explicit slug already works. The audit should
confirm the path and add a regression test, not rewrite it.

**EV6 — the tool surface is the normative contract.** `manage_character` declares twelve actions
(`:5040`); `manage_npc` eight; `manage_lore` fourteen. Adding a parameter is a schema change, so the
tool definitions, the surface budget, and the spec move together.

**EV7 — the adapter seam is already documented.** `docs/engine-contract.md` §7 separates engine state
from adapter translation; `holonovel/src/library.ts:4` re-exports `core` as a namespace and
`holonovel/src/core/index.ts` is the export point. The resolver belongs in the engine core.

**EV8 — response wrappers are an established pattern.** `withSeedWarning` (`:3631`) and `withUiLinkage`
(`:4194`) wrap a result without changing the handler body. `withContext` follows the same shape.

**EV9 — the spec contradicts the roadmap.** `REQ-088e` (`spec/02-requirements.md:2955`) makes character
creation, character import, and NPC creation Novel-scoped and calls roster creation without a Novel
"a defect". `REQ-075a` (`:1712`) says "NPCs are Novel-scoped with URIs", and `REQ-075b` (`:1715`)
adds that NPC state persists with the Novel and `npcs://` lists all active NPCs. The roadmap's A2 bar
cannot be met until all three move. The amendments are part of this increment, not a side effect.

**EV10 — the audit is the deliverable, and prose cannot enforce it.** The roadmap requires that "a new
action cannot quietly reintroduce the assumption". A markdown table cannot fail a build, so the table
is a typed module and a gate compares it against the parsed call sites.

## Decisions

- **D1 — the resolver is pure.** `holonovel/src/core/context.ts` exports `ContextKind`,
  `ContextScope` (`play` | `authoring` | `lookup` | `subject`), `ContextRequest`,
  `ResolvedContext`, and `resolveContext(request)`. `ContextRequest` is
  `{ explicit?: { kind?: ContextKind; id?: string }; activeNovelSlug?: string | null;
  scope: ContextScope; subjectKind?: ContextKind; subjectId?: string }`; `ResolvedContext` is
  `{ kind: ContextKind; id: string | null; source: "explicit" | "play" | "subject" | "authoring" |
  "lookup" | "fallback" }`, and `resolveContext` returns `ResolvedContext | null` — `null` means
  "unresolved: the caller returns its existing refusal". It imports no server state and no audit
  table; `index.ts` reads the descriptor and passes plain values. `ContextKind` adds `"novel+codex"`
  for an explicit `target: both`; that kind always carries `id: null` and prints without a
  parenthetical, because two stores cannot share one id.
- **D2 — six rules, driven by the row's `scope`, and a campaign beats an authoring default.**
  (1) explicit argument; (2) `novelCapable` with a Novel open → novel — with none, a
  `play`-scoped row is **unresolved**, not redirected; (3) `scope: subject` → roster; (4)
  `scope: authoring` → codex; (5) `scope: lookup` → reference; (6) fallback → codex. `novel` is
  never the silent fallback. Rule 2 fires first, so a call inside a Novel stays in the Novel; rule 3
  is what sends a no-Novel character create to the roster; rule 2's unresolved case is what keeps
  `import`, `sheet`, and `generate_encounter` refusing with their existing message instead of
  pretending to resolve. At runtime an action with no row falls back to
  `{ scope: "authoring", novelCapable: false, wrapped: false }`; the gate, not the handler, is what
  fails on a missing row.
- **D3 — the response carries context without touching a JSON body.** `withContext(result, ctx)`
  mirrors `withSeedWarning` (`holonovel/src/index.ts:3631`): it appends a second text block
  `context: <kind> (<id>)` — `context: novel+codex` with no parenthetical — and sets
  `structuredContent.context = {kind, id, source}`. It never edits
  the first content block or `structuredContent.text`, so a `raw()` JSON payload stays byte-verbatim
  (REQ-001) and REQ-050a's rule holds. A result that already carries `structuredContent.context` is
  returned unchanged; `err()` and `needInput()` are never wrapped; `ctx === null` is a no-op.
- **D4 — five tools are context-aware; four gain an input field.** `context` is added to
  `manage_character`, `manage_codex`, `manage_npc`, and `manage_ruleset`. `manage_adventure` keeps
  `target` as its explicit signal and keeps `context` as free-text scene context, and its description
  says so. `manage_lore` and `manage_note` stay Novel-bound until A4 and grow no field, so no
  parameter carries two meanings. The wrapped set is these five tools' rows marked `wrapped: true`.
- **D5 — the audit table is a typed module.** `holonovel/src/core/context-audit.ts` holds one row per
  action: `class` (`novel-only` | `context-agnostic` | `wrongly-novel-bound`), `scope`,
  `novelCapable`, `wrapped`, `sites`, and `disposition` (`keep` | `A2-fix` | `A3` | `A4` | `A5`,
  where A5 is the roadmap's shared-schema-with-migration increment). Key is `tool.action`; a guard at
  handler or helper scope is keyed `tool.guard` and counts once. Actions with no `requireNovel()`
  call today but a meaningful context carry `sites: 0`. The values are fixed here, not left to the
  implementer:

  | Tool | Actions | `scope` | `novelCapable` | `wrapped` |
  |---|---|---|---|---|
  | `manage_character` | `create` | subject | yes | yes |
  | `manage_character` | `roster_list`, `roster_remove` | subject | no | yes |
  | `manage_character` | `stage`, `import`, `sheet`, `set_active`, `personality`, `voice`, `signal`, `update`, `remove` | play | yes | no |
  | `manage_npc` | `create` | authoring | yes | yes |
  | `manage_npc` | `update`, `remove`, `list`, `get`, `import_card`, `export_card`, `import_cof` | play | yes | no |
  | `manage_codex` | `set`, `list`, `get`, `export`, `delete` | authoring | no | yes |
  | `manage_codex` | `capture`, `import` | play | yes | no |
  | `manage_adventure` | `generate`, `load` | authoring | yes | yes |
  | `manage_adventure` | `generate_encounter` | play | yes | no |
  | `manage_adventure` | `list` | authoring | no | no |
  | `manage_ruleset` | `search`, `install`, `remove`, `list`, `bind` | lookup | no | yes |
  | `manage_ruleset` | `import_supplementary`, `remove_supplementary` | lookup | yes | no |

  Every other action is `novel-only`, `scope: play`, `novelCapable: true`, `wrapped: false`.
- **D6 — the gate comes first, and generates the table.** `holonovel/scripts/check-context-audit.ts`
  is written before the table exists and reads nothing but the source: `--observed` prints the
  observed keys and site counts, which is the only sanctioned way to produce the skeleton. It
  attributes each call to its enclosing `register` block and `case` label, and compares the observed
  multiset with the table. `--write` regenerates the page; `--check` (default) compares the table
  **and** the committed page. **Limitation, stated:** a guard at handler scope is counted once under
  `tool.guard`, so the gate guarantees no *new key* appears unclassified; it does not trace every
  action's call graph.
- **D7 — A2 unbinds creation, and nothing else.** `manage_character (action: create)` with no Novel
  writes a roster entry; `manage_npc (action: create)` with no Novel writes a codex entry of kind
  `npc`. `manage_character (action: import)` stays Novel-only because its destination is the Novel,
  and adventure `generate_encounter` stays Novel-only because it writes a Novel encounter. Every
  other `wrongly-novel-bound` row is classified and scheduled, not half-refactored.
- **D8 — profile-only is the no-Novel default, and the workflow does not follow it there.** With no
  Novel and no named ruleset, a created character carries narrative fields only. With several
  rulesets installed and none named, the tool refuses and lists them. `manage_character` gains an
  optional `ruleset` parameter used only when no Novel is active. A no-Novel create requires `name`:
  the step-by-step `[NEED_INPUT]` workflow lives on the Novel and has no host there, so omitting the
  name returns `[INVALID_INPUT]` naming the required fields. `capGuard("roster", state.roster.size)`
  runs before the write, exactly as it does for `stage_to_roster`.
- **D9 — roster creation reuses the roster writer, which must first persist what it reads.**
  `StateManager.createRosterEntity(name, personality, stats, ruleset)` allocates `character_NN` from
  roster keys and then calls `addToRoster(entity, ruleset)`. `addToRoster`
  (`holonovel/src/core/state.ts:3147`) builds a fixed field list, and `saveRoster` (`:3081`)
  serializes its own whitelist that omits `ruleset`, `created_at`, and `created_by` — while
  `loadRoster` (`:3111`) reads `ruleset`. That is a pre-existing defect: a staged character loses its
  ruleset scope across a restart. T9 extends `addToRoster`, `saveRoster`, and `loadRoster` and proves
  the round trip. `manage_history (action: undo)` cannot reverse a roster-only create (there is no
  Novel snapshot); `roster_remove` is the documented inverse.
- **D10 — the spec moves with the behaviour.** Add `REQ-661 — Context resolution` to §5.9; amend
  `REQ-088e`, `REQ-075a`, **and `REQ-075b`** (which today asserts "NPC state persists with the Novel"
  and "`npcs://` lists all active NPCs"); update the §5 section-map row and the
  `| REQ | Title | Spec version |` index in `spec/appendices-reference.md` (the table that carries
  `REQ-088e` at `:810`); register `T794`–`T798`; bind `REQ-661`'s evidence bucket so the strict push
  gate passes. The five
  checks are: T794 precedence and the unresolved case; T795 the response carrier; T796 no-Novel
  character create; T797 no-Novel NPC create; T798 the audit gate's red test. `REQ-661` cites T794
  and T795, `REQ-088e` cites T796, `REQ-075a`/`REQ-075b` cite T797, and the audit gate cites T798.
- **D11 — no new tool and no CLI command.** The CLI workstream (W4-D1) arrives separately; this
  increment adds the resolver, the response carrier, and the audit only.
- **D12 — both roadmap documents are reconciled in the same increment.**
  `docs/authoring-surfaces-roadmap.md` is committed, its A2 bar matches this plan, and its "129"
  becomes "186 across four tool files". `ROADMAP.md` gains no row: every finding in the audit names
  an existing increment (A3, A4, or A5), so the table already schedules it; if a finding has no such
  home, T6 adds the `ROADMAP.md` row and the matching `spec/audit/review-register.md`
  `Scheduled-roadmap` entry together.

## Blast radius

| File | Change | Size |
|---|---|---|
| `holonovel/src/core/context.ts` | New: pure resolver, kinds, scopes, request/result types | M |
| `holonovel/src/core/context-audit.ts` | New: the typed table and `descriptorFor(tool, action)` | M |
| `holonovel/src/core/index.ts` | Export the resolver and the table | S |
| `holonovel/src/core/state.ts` | `createRosterEntity`; `addToRoster` and `saveRoster`/`loadRoster` field lists; additive `created_at`/`created_by` on `RosterEntity` | M |
| `holonovel/src/index.ts` | `withContext`, `context` on four tools, `ruleset` on character create, no-Novel create paths, `context:` in the five descriptions | L |
| `holonovel/scripts/check-context-audit.ts` | New gate: parse, compare, `--observed`, `--write`, `--help` | M |
| `holonovel/scripts/test-context.ts` | New harness: six precedence rules, response carrier, five no-Novel proofs | M |
| `holonovel/scripts/run-test-suite.ts` | Register `test:context` in the ordered suite | S |
| `holonovel/package.json` | `test:context` script; version advanced by `build-order` | S |
| `holonovel/server.json` | Version/manifest advanced by `build-order` | S |
| `package-lock.json` | Version advanced by `build-order` | S |
| `package.json` | `check-context-audit` script | S |
| `scripts/lib/gate-manifest.ts` | Gate row; harness-suite description 56 → 57 | S |
| `AGENTS.md` | Gate table regenerated, suite count | S |
| `holonovel/tool-definitions.json` | Regenerated | M |
| `holonovel/DECISIONS.md` | Recorded surface/size budget if it moves | S |
| `holonovel/AGENTS.md` | Tool-surface notes; `index.ts` size line | S |
| `spec/02-requirements.md` | `REQ-661`, `REQ-088e`/`REQ-075a`/`REQ-075b` amend, §5 map row | M |
| `holonovel.md` | Assembled from `spec/`; committed | M |
| `spec/appendices-reference.md` | `T794`–`T798`; REQ index row | S |
| `spec/audit/req-coverage.md` | Regenerated by `validate -- --write-register` | S |
| `holonovel/src/generated/contract-fingerprints.ts` | Regenerated by `build-order` | S |
| `docs/authoring-surfaces/context-audit.md` | New: generated table | M |
| `docs/authoring-surfaces-roadmap.md` | Committed; A2 bar and 129 → 186 corrected | S |
| `docs/codex-snapshot.md` | Committed as-is (program design input; blocked the push otherwise) | S |
| `ROADMAP.md` | Only if T6 finds a finding with no A3/A4/A5 home | S |
| `spec/audit/review-register.md` | Matching `Scheduled-roadmap` row only if `ROADMAP.md` moves | S |
| `docs/plans/2026-11-25-context-resolver/aar.md` | New: AAR with `## Changelog entry` and terminal token | S |
| `CHANGELOG.md` | Dated entry written by `session:close` | S |

No data migration. No new persisted state file. No change to the state or data directory layout; the
only new directory is `docs/authoring-surfaces/`.

## Phases

**P0 — baseline.** Run `npm run status` and `npm run check:fast` un-piped; record the exit codes and
the trailing `check:fast: PASS`. Confirm `git status` holds only the two roadmap files and this
increment directory as untracked. A red baseline is fixed first, as its own commit.

**P1 — resolver and types.** Write `holonovel/src/core/context.ts` with the six rules and the types in
D1, and `holonovel/src/core/context-audit.ts` with the row type, `descriptorFor(tool, action)`, and an
empty registry. The table is not written here: `--observed` (P4) produces it. Export both from
`holonovel/src/core/index.ts`.
Accept: `npm --prefix holonovel run typecheck` passes; a tsx import of `core/index.js` resolves the
resolver without booting the server; `core/context.ts` imports nothing from `index.ts` or `state.ts`.

**P2 — precedence harness.** Write `holonovel/scripts/test-context.ts` in the shape of
`holonovel/scripts/test-data-dir.ts` (`test(name, fn)`, `passed`/`failed`, exit 0/1/2). Cover all six
rules against the resolver alone: explicit; Novel-capable with a Novel open; novel-capable,
play-scoped, no Novel → `null`; roster subject (a named roster id **and** a PC create); authoring with
no Novel; ruleset lookup; fallback. Also cover explicit beats an open Novel; explicit `novel` with no
Novel; `target: both` → `novel+codex` with `id: null`; a Novel-open authoring call staying in the
Novel. Wire `test:context` into `holonovel/package.json` and the ordered list in
`holonovel/scripts/run-test-suite.ts`.
Accept: `npm --prefix holonovel run test:context` exits 0 and prints a case count; `test:all` runs 57
commands.

**P3 — response carrier.** Add `withContext` beside `withSeedWarning`, mirroring its raw-safe shape:
a second text block plus `structuredContent.context`, never touching the first block. Apply it to
`manage_codex` `set`/`list`/`get`/`export`/`delete` and `manage_adventure` `generate`/`load`.
Accept: codex `list` with no Novel returns its JSON body byte-verbatim, a second text block
`context: codex (…)`, and `structuredContent.context`; a second wrap is a no-op; `err()` and
`needInput()` are untouched.

**P4 — the gate, then the generated table.** Write `holonovel/scripts/check-context-audit.ts` with
`--help` through `scripts/lib/args.ts`; it reads only source, so it runs before the table exists. Run
`--observed` against the current tree and classify every finding as (a) a true action site, (b) a
guard at handler or helper scope keyed `tool.guard` (known: `holonovel/src/index.ts:4271`,
`:4664`, `:4680` — two handler-level, one inside `reassignToolCategory`), or (c) a parser artifact,
fixed in the parser and never baselined. Generate the table from (a) and (b), classify every row,
then wire the gate.
Accept: the observed list totals 186 sites; every row carries a class and a disposition; the gate exits
0 only against a complete table, and exits 1 against a deliberately corrupted copy (the red test).

**P5 — context fields and the remaining wrappers.** Add `context` to `manage_character`,
`manage_codex`, `manage_npc`, and `manage_ruleset` and `ruleset` to character create; state the
resolution order in one sentence per description; say in `manage_adventure`'s description that
`target` is its explicit signal and `context` is scene text. Wrap character, npc, and ruleset
responses (codex and adventure are wrapped in P3).
Accept: a request with an explicit `context` wins over an active Novel; a request without one uses the
active Novel only for a `novelCapable` row; the schema diff touches only the four tools plus character
`ruleset`; no response shape changes for an unwrapped tool.

**P6 — the unbindings and proofs.** `manage_character (action: create)` with no Novel writes a roster
entry via `createRosterEntity`, which allocates the id then calls `addToRoster`; extend `addToRoster`,
`saveRoster`, and `loadRoster` so `ruleset`, `created_at`, and `created_by` survive a reload.
`manage_npc (action: create)` with no Novel writes a codex entry of kind `npc` through a factored
entry-writer shared with `manage_codex (action: set)`. Add the five no-Novel proofs. Run
`action-conflicts` and grep the spec for sibling clauses binding the changed actions. Re-run
`--observed` and regenerate the table: the count falls where a guard became a branch.
Accept: the five proofs pass; a Novel-only operation with no Novel still returns `[STATE_CONFLICT]`
naming the missing Novel; explicit `context: "novel"` with no Novel is refused; create, save, reload
returns the same `identity`, `ruleset`, `created_at`, and `created_by`; the gate stays green.

**P7 — spec.** Add `REQ-661` to §5.9; amend `REQ-088e`, `REQ-075a`, and `REQ-075b`; add
`T794`–`T798` to the appendix table; update the §5 section-map row (`5.9 → 088–097, 117, 131, 238,
240, 256–259, 294, 295, 334, 565, 566, 613, 614, 661`) and the `| REQ | Title | Added |` index in
`spec/appendices-reference.md` that carries `REQ-088e` at `:810`. Measured today: `REQ-088e` 514
characters / 5 sentences, `REQ-075a` 528 / 7, `REQ-075b` 366 / 4; the amendment may add ~180
characters to the first two and ~60 to the third, and no sentence. `REQ-661` is drafted in the
800-character / 8-sentence budget.
Accept: `npm run assemble && npm run validate:sdd` reports 0 errors; the new and amended bodies are
inside both limits with post-edit counts recorded; `npm run validate -- --write-register` regenerates
`spec/audit/req-coverage.md` with the new row and a bucket that `HOLONOVEL_IMPL_STRICT=1 npm run
validate` accepts; every new check ID names its harness.

**P8 — regeneration and close.** `check-tool-definitions-sync` (regenerate without `--check`),
`tool-definitions-lint`, `surface-budget --write` if the footprint moved, recorded counts in
`holonovel/DECISIONS.md` and `holonovel/AGENTS.md`, `npm run build-order` (CalVer, fingerprints,
lockfile, `holonovel/server.json` move together), then `npm run check:fast` un-piped after
`build-order`'s own `check`. Write `aar.md` with the Changelog block and the terminal token, then
`npm run session:close`.
Accept: `check:fast: PASS`, `build-order` prints 0 errors, `session:close` commits.

**Commit boundary.** One commit (a spec increment stays one commit). If the session overruns, stop
after P6 and report the dirty tree; do not commit behaviour the spec still contradicts.

## Verification

| ID | Check | Pass condition |
|---|---|---|
| V1 | `npm --prefix holonovel run test:context` | Six rules incl. the unresolved case and both roster variants; explicit override; both-kind `id: null`; carrier no-op |
| V2 | `npm --prefix holonovel run typecheck` | 0 errors |
| V3 | `npm run check-context-audit` | 0 unclassified, 0 count mismatches, 0 stale rows, page fresh |
| V4 | Red test for V3 | A corrupted table copy exits 1 |
| V5 | Live probe: character create with no Novel | `roster.json` gains the entry with `context: roster`; no Novel file created |
| V6 | Live probe: NPC create with no Novel | `codex.json` gains a `kind: npc` entry with `context: codex` |
| V7 | Live probe: codex `list`/`get`/`export` with no Novel | JSON body byte-verbatim, second block reads `context: codex (…)`, `structuredContent.context` set |
| V8 | Live probe: ruleset `search` with a slug and no Novel | Results returned, `context: reference` |
| V9 | Live probe: adventure `generate target: codex` | Codex entry written, no Novel created, `context: codex` |
| V10 | Reload probe | Create, save, reload: `identity`, `ruleset`, `created_at`, `created_by` unchanged |
| V11 | `npm --prefix holonovel run test:all` | 57 commands pass, `test:context` included |
| V12 | `npm run check-tool-definitions-sync` | No drift |
| V13 | `npm run surface-budget` then `check-tool-surface` | Both exit 0 after `--write` |
| V14 | `npm run tool-definitions-lint` | No finding |
| V15 | `npm run assemble && npm run validate:sdd` | 0 errors; body limits recorded and met |
| V16 | `HOLONOVEL_IMPL_STRICT=1 npm run validate` | `REQ-661` is evidenced; no bucket-A gap |
| V17 | `npm run action-conflicts` | No new conflict on the changed actions |
| V18 | `npm run build-order` | Chain completes, prints 0 errors, fingerprints current |
| V19 | `npm run check:fast` after V18 | `check:fast: PASS`, `npm run check` 0 errors |
| V20 | `npm run check-loop-artifacts` | `plan.md`, `tasks.md`, `aar.md`; token present |

## Done bar

**Done bar:** the resolver passes all six precedence tests; every successful response from an action
marked `wrapped: true` carries `context`; `check-context-audit` reports zero unclassified rows and
zero count mismatches and the committed page is fresh; the five no-Novel proofs pass; the tool
definitions, surface budget, and fingerprints are regenerated; `npm run check` is green and
`npm run check:fast` prints `PASS`.

## Out of scope

- Roster authoring parity beyond create: update, sheet, validate, export, import (A3).
- Codex authoring parity: kinds, schema, validate, render, link, snapshot (A4).
- Codex full-bundle schema and snapshot mode (B9, S1).
- A server-level audit log for campaign-less mutations (scheduled; named as a limitation here).
- Unbinding lore, note, faction, relationship, or character update/sheet (A4/A3).
- The CLI commands (workstream W4-D1).

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| The gate's attribution mislabels a site | Medium | Dry run reviewed first; true sites and `tool.guard` sites become rows, parser artifacts are fixed in the parser, never baselined |
| A guard at handler scope is invisible to a new action | Medium | Stated limitation in D6; guard rows are classified individually, and A3/A4 revisit them |
| A context block corrupts a JSON body | Medium | The carrier mirrors `withSeedWarning`: a second text block plus a field, never an edit to block one (V7 asserts the body is byte-verbatim) |
| A no-Novel creation passes for the wrong reason | Medium | Assert the context field, the store file, the seeded `identity`, and the absence of a Novel file change |
| The spec amendment overruns 800 characters | Low | Count recorded in P6; trim the sentence that repeats the Novel-scoped rule |
| Existing campaigns look broken after the §5.9 fingerprint moves | Low | `[data-stale]` is informational and non-blocking (REQ-423); stated in the changelog |
| Surface budget exceeded by four new parameters | Medium | Measure with `surface-budget`; the fields are optional and one-sentence |
| `test:all` count drifts from the documented 56 | Medium | Update `scripts/lib/gate-manifest.ts` and regenerate the AGENTS.md table in the same commit |

## Dependencies

- None for A1. A2 depends on A1.
- A3 depends on A1 + A2; A4 depends on A1 + A2.
- A6 (canon direction) consumes the same resolver and can start after A1.
- B9 depends on A3 + A4; S1 depends on A5 + B9.
- D1 of the CLI workstream (W4-D1) can run in parallel; its `context` command consumes this resolver.

## Rollback

Revert the commit: two new modules, one new check, one new harness, and reversible edits to four
existing files. No data migration, no schema version change, no filesystem layout change. The two
additive roster fields (`created_at`, `created_by`) are ignored by an older loader. The only residue
of a forward run is the §5.9 fingerprint move, which reports `[data-stale]` and does not block loading.

## Evidence anchors

- `requireNovel()` sites: `holonovel/src/index.ts` 129, `holonovel/src/tools/knowledge.ts` 41,
  `holonovel/src/tools/world-crud.ts` 12, `holonovel/src/tools/world-model.ts` 4 (186 total).
- Definition: `holonovel/src/core/state.ts:1254`; re-export `holonovel/src/core/server.ts:34`.
- Character create: `holonovel/src/index.ts:5072-5183` (guard `:5087`, rules `:5088`, cap `:5102`).
- Character import: `holonovel/src/index.ts:5196-5200`.
- NPC create: `holonovel/src/index.ts:6737-6792`.
- Codex default store: `holonovel/src/index.ts:13996`; first guard at `:14083`.
- Adventure target and scene context: `holonovel/src/index.ts:9656-9667`.
- Helper-scope guards (the `tool.helper` bucket): `holonovel/src/index.ts:4271`, `:4664`, `:4680`.
- Roster store: `holonovel/src/core/state.ts:973` (`RosterEntity`), `:3081` (`saveRoster`),
  `:3147` (`addToRoster`), `:3244` (`createEntity`).
- Response helpers: `holonovel/src/index.ts:3345` (`structured`), `:3393` (`ok`), `:3418` (`err`),
  `:3631` (`withSeedWarning`), `:4194` (`withUiLinkage`).
- Adapter boundary: `docs/engine-contract.md` §7; core export `holonovel/src/library.ts:4`.
- Spec: `REQ-088e` `spec/02-requirements.md:2955`; `REQ-075a` `:1712`; `REQ-075b` `:1715`; §5 map
  `:17`; test-ID table `spec/appendices-reference.md:1986-2153` (next free `T794`); highest
  registered REQ `REQ-660`.
- Gate manifest: `scripts/lib/gate-manifest.ts:251-257`; harness suite list
  `holonovel/scripts/run-test-suite.ts:26` (the first suite entry).
