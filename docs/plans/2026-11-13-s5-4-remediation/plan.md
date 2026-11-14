# Increment: §5.4 remediation (P1)

**Roadmap item:** ROADMAP.md section `§5.4 remediation (P1)` (ROADMAP.md:15-26)
— closes when F-P3-5, F-P3-6, F-P3-7 and F-P3-9 are Resolved in
spec/audit/review-register.md.

**Done bar:**

1. The four findings are `Resolved` in `spec/audit/review-register.md`, each
   with a dated evidence sentence naming the predicate, the change and the
   asserting test.
2. `npm --prefix holonovel run test:character-creation` and
   `test:persistence` pass (they run in `test:all` and in the publish
   pipeline's server-harness suite; neither is a `check:fast` gate).
3. `npm run assemble` then `npm run check:fast` pass (PASS line confirmed);
   `npm run check:conformance` and `npm run check-registers` pass; the
   coverage register is fresh (`validate --write-register`, then a plain
   `validate` with no freshness finding).
4. The `§5.4 remediation (P1)` ROADMAP section is deleted, the citation-repair
   Trigger no longer refers to it, and the review register's chunk-P3 preamble
   no longer names it.
5. One `npm run session:close` commit lands.

## Baseline (verified this session)

1. `npm run status` — 8 open roadmap items; 73 unpushed commits; version
   2026.11.13; last publish 2026-11-09.
2. `npm run check:fast` — PASS, 41/41 gates, 0 failed.
3. `git status --porcelain` empty; HEAD `842a71e`.

## Normative obligations (quoted)

- REQ-140: the handler "SHALL execute the Novel disposal sequence per REQ-088
  and record the disposal in the audit log"; a non-matching decision returns
  `[NOT_FOUND]` with the open decision's text.
- REQ-152a: "The entity's state representation SHALL include an `equipment`
  field listing each assigned item by name, quantity, and ruleset source."
- REQ-152b: "When the ruleset defines no starting equipment, the `equipment`
  field SHALL be absent — the builder SHALL NOT fabricate equipment."
- REQ-399b: "A formula that fails to evaluate SHALL surface a named creation
  error rather than a silent default."
- REQ-190: "The drain is atomic — a partial drain where the workflow is cleared
  but the state change is not applied is a defect."
- REQ-447: the audit log has a configured growth cap; at capacity the server
  refuses to append and surfaces the refusal (`state.ts:2241-2262`).

Out of scope: REQ-104c / F-P3-8 (separate roadmap section).

## Evidence (predicates re-confirmed at 842a71e)

| Finding | Predicate | Confirmed state |
|---|---|---|
| F-P3-5 | state.ts:1939-1967 (`endNovel`); index.ts:4150-4161 (`respond_decision`, `end_novel` case — the **end branch**) | moves the primary, each `.bak.N` and each `archive/` copy into `.trash`, then drops the Novel from memory; no audit call. `end_novel` is already listed in `SECURITY_EVENT_TOOLS` (state.ts:2248) and read at `:2321`, but never appended |
| F-P3-6 | index.ts:4527 (`buildCharacterStats`), :4530-4532 (mapping) | player/quick equipment maps to `{name, quantity: 1}` with no `source`; the `equipment` key is written even when nothing is resolved |
| F-P3-7 | character-creation.ts:370 (`evaluateFormula` inside `computeDerived`), :244-257 (undefined-input throws); index.ts:4270, :4810 | the throw escapes both creation paths; the caller sees an uncaught tool failure |
| F-P3-9 | index.ts:4252 (`pending_workflow = null`) before the build at :4270 | a throwing build drains the workflow first; test-character-creation.ts is pure-engine only |

Fixture facts (verified): `holonovel/testdata/rulesets/fixture/model.json`
declares `character_creation` with `starting_equipment` (entry source
`"Fixture"`) and three derived stats labelled `Hit Points`, `Reflex`, `Power`;
the directory holds `index.json`, `manifest.json`, `model.json`,
`prompts.json`, `resources.json`, `tools.json`. The stale claim is
`spec/audit/review-register.md:2329-2332` ("the repo ships no such fixture");
the real gap is a server-tier assertion, not a fixture.

## Changes

### C1 — End-Novel disposal audit record (REQ-140, REQ-447, F-P3-5) · M

Files: `holonovel/src/core/state.ts` (`endNovel` 1939-1967, audit helpers),
`holonovel/src/index.ts` (end branch 4150-4161).

1. **Split the branch.** `opt === "yes"` takes the disposal path below; every
   other option keeps today's behaviour exactly (`restoreFromSnapshot`,
   `saveNovel`, `ok("End novel cancelled.")`) — no audit entry, no drain.
2. **Commit point = the primary rename.** `endNovel(novel: NovelState)`
   (the `dispose` parameter is removed; the cancel path no longer calls it)
   computes one timestamp, then:
   a. `mkdirSync(.trash)` — a failure throws out of `endNovel` before any move;
   b. moves every `.bak.N` and every `archive/` copy first;
   c. moves the primary last.
   Any failure throws an error naming the exact `from` and `to` path. Because
   the primary is last, a throw always leaves the Novel live and its file in
   `novels/`. On success the function returns
   `{ trashPaths: string[] }` — every destination actually written: backups,
   `archived-<entry>` copies, then the primary.
3. **Disposal path order:**
   a. primary file absent → `[ERROR] [STATE_CONFLICT] "Novel file is already
      absent; nothing to dispose."` (no audit, no mutation);
   b. capacity gate. `state.auditLogCapacity()` returns the numeric cap (new
      accessor in `state.ts`; `auditLogAtCapacity` delegates to it), where
      `0` (or a non-finite value) means **unlimited** — the sentinel the
      existing predicate uses at state.ts:2242-2244. The refusal condition is
      `const cap = state.auditLogCapacity(); if (cap > 0 && novel.audit_log.length + 3 > cap)`,
      because the disposal may need three entries: a `[session-boundary]`
      marker that `audit()` emits when the session id changes, the record
      itself, and the compensating entry on failure. On refusal: `[ERROR]
      [STATE_CONFLICT] "Audit log at capacity (<cap> entries); the end-Novel
      record cannot be written."` plus `Corrective action: raise
      TTRPG_AUDIT_MAX_ENTRIES or compact the log with manage_diagnostics
      (action: compact).` — nothing mutated. The corrective sentence becomes
      one exported constant (`AUDIT_CAP_CORRECTIVE`) also used by the existing
      throw at state.ts:2259, whose current text names the retired `session`
      tool; one string, one place. A pre-change `grep -rn "session (action:
      compress)"` finds any assertion on the old wording before it changes;
   c. `state.audit(novel, getBadge(), "end_novel", { slug, dispose: "yes" })`
      — called directly on the Novel being ended, not through the ambient
      `audit()` helper (which resolves `state.activeNovel` and silently no-ops
      when it is unset, index.ts:2739-2741). The end branch asserts
      `state.activeNovel!.slug`, so the two agree today; the direct call makes
      the record independent of that. The tool name alone yields
      `security_event: true`, because `appendAuditEntry` reads
      `SECURITY_EVENT_TOOLS` membership (state.ts:2321);
   d. `novel.pending_workflow = null`;
   e. `state.saveNovel(novel)` — the record is now inside the file that will
      move;
   f. `try { state.endNovel(novel) } catch (e) { ...compensate... }`. The
      compensation appends `end_novel_failed` through the same direct
      `state.audit(...)` call, saves, and returns `[ERROR] [STATE_CONFLICT]
      "Novel '<slug>' could not be disposed: <message>. The Novel remains
      active."` with `Corrective action: resolve the reported filesystem error
      for <from> → <to> and retry manage_novel (action: end).` The
      compensation is itself wrapped in `try/catch`: if the append still
      throws (cap reached by another path), the handler writes the stderr
      diagnostic, skips the save, and returns the same error. The three-slot
      reservation in (b) makes that unreachable in practice, and the guard
      keeps the failure path from throwing;
   g. success: `forgetPacingSession(slug)` (retained from index.ts:4154), stderr
      `"[holonovel] Novel '<slug>' ended; files moved to <trashPaths joined by
      ', '>.\n"`, `ok("Novel '<slug>' ended.")`.
4. **Failure contract, stated once:** disposal is all-or-nothing at the primary
   file. A failure before the primary move leaves the Novel live in memory and
   on disk; a compensating `end_novel_failed` entry records the attempt, so the
   live log then holds `end_novel` followed by `end_novel_failed` — the second
   entry supersedes the first, and a retry appends a fresh `end_novel`. T158's
   "last entry is `end_novel`" assertion runs only on the trashed copy, which
   exists only on the success path. No `[PARTIAL]` outcome is introduced (the
   server has no partial-result builder today, and adding one is out of scope).
5. **REQ-447 relationship:** `audit()` already throws at capacity
   (state.ts:2258), but only after the drain and save. The pre-check exists so
   the disposal path refuses before mutating; the general pre-mutation sweep
   across other tools remains with the Trust-core remediation (F-P1-4). Record
   the overlap in the DECISIONS entry so that session does not re-scope it.
6. **DECISIONS entry,** inserted as the newest dated section directly under
   `## Non-goals` in `holonovel/DECISIONS.md`, titled
   `### End-Novel disposal record, equipment provenance, creation errors —
   2026-11-13`. It records: the record lives in the trashed Novel's own chained
   log and `cleanupExpiredTrash` prunes it when `TTRPG_NOVEL_RETENTION_DAYS` is
   set (the stderr line is then the only trace); saved characters are not
   migrated for `equipment[].source`; and the `[INVALID_INPUT]` choice from
   C3.5.

### C2 — Creation equipment source and omission (REQ-152a/b, F-P3-6) · M

File: `holonovel/src/index.ts` (`buildCharacterStats` 4527; call sites 4270,
:4810).

1. `buildCharacterStats(build, rules, rulesetSlug)` gains the bound ruleset
   slug (`novel.ruleset`, typed `string | null` at index.ts:1753) as its third
   parameter. The null case is unreachable by construction: both call sites sit
   behind a resolved `rules` object, and `getCharacterRules` returns null when
   `novel.ruleset` is null or the package defines no `character_creation`
   (index.ts:4516-4521) — and each call site already early-returns on
   `!rules` (respond path index.ts:4233-4244; quick path :4758-4770). The
   parameter is therefore typed `string` and the call passes `novel.ruleset`.
2. **Source rule:** a package-declared `item.source` is used when present
   (`startingEquipmentFor` already copies it, character-creation.ts:391);
   otherwise the entry carries the bound ruleset slug. Player-supplied entries
   are plain names (`wf.answers.equipment: string[]`, index.ts:4267; quick mode
   passes `toList(effEquipment)`), so they cannot carry a source of their own
   and always take the slug — including the edge case where the typed name
   matches a declared item, because the player path never consults the package
   list.
3. **Omission rule (single formulation):** the resolved list is the
   player-supplied list when non-empty, otherwise `startingEquipmentFor(...)`.
   The `equipment` key is written if and only if that resolved list is
   non-empty.
4. Consumers already tolerate the key's absence: `fmtEntitySheet`
   (index.ts:3763) guards with `stats.equipment?.length`, and the
   create-response derived list filters `equipment` out (index.ts:3755 and
   :4820-4828).
5. No migration of saved characters; recorded in the C1.6 DECISIONS section.

### C3 — Named creation error and atomic drain (REQ-399b, REQ-190, F-P3-7/9) · M

Files: `holonovel/src/core/character-creation.ts:370`;
`holonovel/src/index.ts` 4245-4270 (end of the `character_creation` branch in
`respond_decision`) and 4809-4815 (`manage_character` `case "create"`, quick
mode).

1. `computeDerived` wraps each formula and rethrows `Derived statistic '<key>'
   (<label>) formula "<formula>" failed: <original message>`. Its only
   production caller is `buildCharacterStats` (index.ts:4528); the rest are
   unit tests.
2. **respond_decision path:** move the whole compute block — `parseAbilityScores`
   / `applySpeciesAdjustments` (index.ts:4253-4269) **and**
   `buildCharacterStats` (:4270) — above the drain at :4252, inside one
   `try/catch`. On failure return `[ERROR] [INVALID_INPUT]` with `Corrective
   action: fix the derived_stats formula for '<key>' in ruleset
   '<rulesetSlug>' and reinstall it, or rebind the Novel to a ruleset whose
   package defines valid formulas.` Only on success clear the workflow,
   snapshot, create, save. No input step can throw after the drain.
3. **Quick path (`manage_character (action: create)` with a name):** this
   branch never sets `pending_workflow` (the guard at index.ts:4744 covers only
   the step-by-step start), so no drain is at stake; wrap the same build in
   `try/catch` and return the same error shape.
4. A step-by-step failure therefore leaves the decision pending (REQ-190), and
   `cancel` still restores the snapshot.
5. The wrapped message keeps the original `undefined input` text, so the
   existing `evaluateFormula` assertions still pass; C4 adds a wrapper
   assertion.

Decision: `[INVALID_INPUT]` because the defect is package data and both the
code and the corrective action are package-side. Choosing `[STATE_CONFLICT]`
would change the code, the corrective text, this note and the user-impact
bullet.

### C4 — T468 server-tier assertions and T158 audit assertion (F-P3-5/6/7/9) · M

Files: `holonovel/scripts/test-character-creation.ts` (append a **spawn
tier**), `holonovel/scripts/test-persistence.ts:368`.

Harness primitives: the new spawn tier in `test-character-creation.ts` imports
`holonovel/scripts/lib/mcp-client.ts` (`bootServer`, which spawns the server
with `TTRPG_DATA_DIR` set to a temp dir and exposes `call`, `stderrTail`,
`dataDir`, `close`) and `holonovel/scripts/lib/harness-guard.ts`
(`installHarnessGuard`, `harnessComplete`); neither file changes.
`test-persistence.ts` keeps its own local `boot(env)` helper and module-level
`DATA_DIR` (test-persistence.ts:16-17, :61-71) — the T158 additions use those,
not `bootServer`. The file runs its pure tests first, then the spawn tier.
`test:character-creation` already exists in `holonovel/package.json:72` and in
the `test:all` runner list, so no script or gate-manifest entry is added.

1. **Setup, per package (stated once, repeated for each variant):**
   `set_badge (game_master)` → `manage_ruleset (action: install)` with the
   explicit argument `slug` plus the six payloads read from
   `holonovel/testdata/rulesets/fixture` (`manifest`, `index`, `model`,
   `tools`, `resources`, `prompts`) → `manage_novel (action: create,
   name: "<test novel>")` → read the Novel slug back from
   `manage_novel (action: info)`, whose JSON carries `slug` (not parsed from
   the create response's prose) → `manage_ruleset (action: bind, slug:
   <installed slug>)`.
   Slugs: `fixture468` (fixture as shipped), `fixture468none`
   (`starting_equipment` deleted from the model), `fixture468bad` (its first
   `derived_stats` formula rewritten to reference `ability_mod.nope`).
2. **T468 assertions (spawn tier):**
   - quick mode returns labels `Hit Points`, `Reflex`, `Power` with values
     computed from the declared formulas (green today — a regression guard);
   - `entity.stats.equipment[0].source === "Fixture"` for a fixture-declared
     item, read from `<dataDir>/novels/<slug>.json`;
   - player-supplied `equipment` yields entries whose `source` is
     `fixture468`;
   - under `fixture468none` with no player equipment, the entity has no
     `equipment` key (REQ-152b);
   - under `fixture468bad`, quick mode returns `[ERROR] [INVALID_INPUT]` naming
     the statistic key and formula;
   - under `fixture468bad`, step-by-step creation's final `respond_decision`
     returns the same error, `manage_history (action: undo)` still refuses
     with a pending workflow, and `cancel` restores.
3. **Pure-tier assertion:** `computeDerived` failure names the statistic key
   and formula.
4. **T158 assertions (`test-persistence.ts:368`):** create the Novel, read the
   slug from `manage_novel (action: info)` (the JSON carries `slug`), end and
   confirm with `respond_decision("yes")`, then select the trashed copy by
   exact shape — a file in `.trash/` whose name starts `<slug>-`, ends
   `.json`, and contains neither `.bak` nor the `archived-` prefix — and assert
   its last `audit_log` entry is `tool: "end_novel"` with
   `security_event: true`. **Stderr:** attach `proc.stderr.on("data", …)` for
   the confirming call, following the inline listener pattern already used in
   this harness (test-persistence.ts:545), and assert the collected text names
   the trash path; the local `boot()` does not capture stderr itself.
   **Capacity clause, executable shape:** in the same `DATA_DIR`, create a
   Novel and arm the decision with `manage_novel (action: end)` — that call
   writes no audit entry, so it succeeds under any cap. Kill the process, then
   `boot({ TTRPG_AUDIT_MAX_ENTRIES: "1" })`. The persisted log is already
   non-empty, so the three-slot predicate (`cap > 0 && length + 3 > 1`)
   refuses; assert `respond_decision("yes")` returns `[ERROR]
   [STATE_CONFLICT]` and that `novels/<slug>.json` still exists.
5. **Appendix F row edits** (`spec/appendices-reference.md:1484` T468,
   `:1655` T158): T468 gains "a ruleset declaring no starting equipment yields
   no `equipment` key, and a failed derived-statistic formula leaves the
   pending workflow undrained"; T158 gains "the disposal is recorded in the
   audit log before the file moves". No new test IDs; the citation columns
   already carry REQ-152 and REQ-140.
6. **Red/green split:** the red assertions are the four absent behaviours —
   equipment `source`, key omission, the named error, the undrained workflow —
   plus T158's audit-entry and capacity clauses. The label/value assertions are
   green today and act as regression guards.

### C5 — Registers, roadmap, changelog · S

Files: `spec/audit/review-register.md`, `spec/audit/req-coverage.md`,
`ROADMAP.md`, `CHANGELOG.md`.

1. Move F-P3-5/6/7/9 from `## Scheduled-roadmap` into `## Resolved` under a new
   dated heading, matching the 2026-11-13 resolved-entry shape already in the
   file. F-P3-8 stays scheduled.
2. Rewrite the chunk-P3 preamble (`review-register.md:2306-2307`), which
   currently reads "Scheduled under `ROADMAP.md` § *§5.4 remediation (P1)* …",
   so it names only the citation-repair section that still exists.
3. Delete ROADMAP.md:15-26 and rewrite the citation-repair Trigger
   (ROADMAP.md:35-36) to drop "the §5.4 remediation above". Historical
   `docs/plans/2026-11-09-*` records keep their wording — they record past
   dispositions, not live pointers.
4. Run `npm run validate -- --write-register`, then a plain `npm run validate`
   to prove freshness; add the dated `CHANGELOG.md` entry.

## Blast radius

| File | Change | Size |
|---|---|---|
| holonovel/src/core/state.ts | C1 (`endNovel`, `auditLogCapacity` accessor) | S |
| holonovel/src/index.ts | C1, C2, C3 | M |
| holonovel/src/core/character-creation.ts | C3 | S |
| holonovel/scripts/test-character-creation.ts | C4 spawn tier | M |
| holonovel/scripts/test-persistence.ts | C4 T158 | S |
| spec/appendices-reference.md | C4 (T158, T468 rows) | S |
| spec/audit/review-register.md, spec/audit/req-coverage.md | C5 | S |
| ROADMAP.md, CHANGELOG.md, holonovel/DECISIONS.md | C1, C2, C3, C5 | S |
| docs/plans/2026-11-13-s5-4-remediation/{plan,tasks,aar}.md | increment artifacts | S |
| *(imported, unchanged)* scripts/lib/mcp-client.ts, scripts/lib/harness-guard.ts | C4 dependencies | — |
| *(conditional)* AGENTS.md, holonovel/AGENTS.md, package/lock/tool-surface files | only if `build-order`'s version-sync reports drift; same commit | — |

Sizes: S = tens of lines, one concern; M = one behaviour change plus its call
sites and assertions.

Fingerprint/generated surfaces: §5.6, §5.9, §5.16-§5.17, §6.3, §6.4.2, §7.7,
§5.19 and Appendix Q (`contract-fingerprint.ts:6`, :29-30; AGENTS.md
checklist). This increment edits none of them — Appendix F is in no
fingerprinted set — so `check-fingerprint-sync` needs no regeneration. No tool
input schema changes; `manage_novel (action: end)` gains a failure mode but its
description text is unchanged, so `check-tool-definitions-sync` and
`surface-budget` are unaffected.

## Alternatives considered

1. **Disposal record home:** trashed Novel log (chosen) vs a new server-level
   disposal ledger vs an `archive/` tombstone. Chosen because it needs no new
   persisted surface and keeps the chained hash intact; `archive/` collides
   with REQ-334 semantics. Accepted consequence: retention pruning removes it.
2. **Failure semantics:** primary-last move with a compensating
   `end_novel_failed` entry (chosen) vs a `[PARTIAL]` outcome vs rollback.
   Rollback cannot be guaranteed after a failed rename; `[PARTIAL]` would add a
   response primitive the server does not have. The primary-last order makes
   the outcome binary and keeps the log truthful.
3. **Source vocabulary:** package-declared source with slug fallback (chosen)
   vs a normalized slug everywhere. Normalizing discards provenance the model
   already declares; C4 pins both values.
4. **Error code:** `[INVALID_INPUT]` (chosen) vs `[STATE_CONFLICT]`; recorded
   in C3.5.
5. **Harness placement:** extend `test:character-creation` (chosen) vs a new
   `test:character-creation-server` command. Chosen to avoid a new suite entry
   and keep the T468 citation in one file.

## Sibling-contract and file-surface checks

- The end branch is the only `endNovel` caller (`grep endNovel`: state.ts:1939,
  index.ts:4152). Other `respond_decision` branches (world_change,
  world_generate, present_choices, safety_escalation, checkpoint,
  compress_audit) are untouched. No sibling REQ binds `endNovel`.
- `computeDerived` has one production caller (`buildCharacterStats`,
  index.ts:4528).
- `stats.equipment` consumers: `fmtEntitySheet` (index.ts:3755-3763) and the
  create-response derived list. No harness asserts equipment today
  (`grep -ri equipment holonovel/scripts`: only the fixture-driven tests added
  here).
- Multi-class equipment dedupes by name at `character-creation.ts:384-395`.
- REQ-190's cited check T138 is the workflow-lifecycle row
  (`appendices-reference.md:1658`) and is unaffected; the creation-specific
  atomicity assertion lands under T468.
- No new tool, action, parameter or input schema; no Appendix F ID addition.

## Edge cases and rollback

- Audit at capacity (fewer than three free entries, and `cap > 0`) → refuse
  before mutating; Novel remains live. With the cap unset or `0` the predicate
  is inert (unlimited), matching state.ts:2242-2244.
- Primary file already absent → refuse before mutating.
- `.trash` mkdir or any pre-primary move fails → compensating
  `end_novel_failed` entry, Novel live, `[ERROR] [STATE_CONFLICT]` naming the
  path; a retry starts from a fresh `end_novel` entry.
- Primary rename fails → same compensating path; no memory drop.
- Cancel → unchanged path, no audit entry.
- Ruleset declares no starting equipment and no player equipment → no
  `equipment` key.
- Class key absent from `starting_equipment` → nothing assigned, key omitted.
- Ruleset-free creation returns early (index.ts:4233-4244) and is untouched.
- Saved characters keep their stats; `STATE_HASH_PROJECTION_VERSION` stays 3 and
  the exclusion set is unchanged, so existing Novels are untouched until
  edited. A newly created character changes the digest exactly as any content
  change does (`equipment` sits inside the hashed `entities` surface).
- Rollback cost 1 (revert one commit).

## Verification (execution order)

0. Create `docs/plans/2026-11-13-s5-4-remediation/` with `plan.md` (this
   document), `tasks.md` (step checklist plus the red-output log) and `aar.md`
   (skeleton ending `LOOP OPEN`). All three exist before any gate runs, because
   `check-loop-artifacts` requires the complete set.
1. Write the C4 assertions and the pure wrapper assertion; run
   `npm --prefix holonovel run test:character-creation` and
   `test:persistence`; paste the red output into `tasks.md`.
2. Implement C1-C3; re-run both harnesses green; record that in `tasks.md`.
3. Apply C4 item 5 (Appendix F rows), C5 (register, ROADMAP, CHANGELOG) and the
   C1.6 DECISIONS entry; then `npm run validate -- --write-register` and a
   plain `npm run validate`.
4. `npm --prefix holonovel run test:all`.
5. `npm run assemble && npm run check:fast` (unpiped; confirm the PASS line).
6. `npm run build-order` (server paths changed, so the full check re-runs) and
   `npm run check:conformance`; then `npm run check-registers`.
7. Finalise `aar.md` (LOOP token, done-bar judgement); `npm run session:close`
   — a single commit. `session:close` re-runs `assemble` and `check:fast`, so a
   stale assembly cannot slip past it.
8. The commit stacks on top of the 73 unpushed commits and publishes with them
   on the next `./scripts/push-pipeline.sh` run. Publication also needs the
   dated `### Holonovel Spec Update — <date>` entry the pipeline scaffolds for
   this Appendix-F delta; that is a publish-time obligation.

## User impact

- Ending a Novel now appends an audit entry before the file moves, can refuse
  with `[ERROR] [STATE_CONFLICT]` at audit capacity, and on a filesystem
  failure records the failed attempt and reports `[ERROR] [STATE_CONFLICT]`
  with the Novel still live.
- Created characters' equipment entries carry a `source`, and the `equipment`
  key is absent when nothing was assigned.
- A failing derived-stat formula returns `[ERROR] [INVALID_INPUT]` naming the
  statistic and formula instead of an unhandled failure, and a step-by-step
  creation stays open.
- No restart required; no client schema break.

## Assumptions to confirm during build

- The inline install of the fixture returns `[OK]` (manifest hash validation
  unverified; the install probe is the first green step of C4).
- The fixture's T468 token still resolves the coverage row before C5 rewrites
  the register.
- The persisted field is `audit_log` (state.ts:803) and the cap variable is
  `TTRPG_AUDIT_MAX_ENTRIES` (state.ts:2242); both are asserted by C4 and would
  fail loudly if wrong.
- `manage_ruleset (action: install)` accepts an explicit `slug` plus the six
  inline payloads (index.ts:13548-13554).

## Delta amendment — 2026-11-13 (execution discovery)

The first `test:all` run after the implementation failed five Holosuite tiers on
`predicate_unresolved`: the plan's edits shifted lines that five evidence
anchors point at (`holosuite-adversarial.ts` ×4, `holosuite-differential.ts`
×1, `holosuite-invariants.ts` ×1, `holosuite-novel.ts` ×2 — the same anchors
appear in two files each). These files were not in the original blast radius.

Amendment: repoint the five drifted anchors to the current symbol lines.

| File | Change | Size |
|---|---|---|
| holonovel/scripts/lib/holosuite-adversarial.ts | anchors: `create_room`, `verify`, `recap`, `strictMode`, `inboxSourcePath`, `share` | S |
| holonovel/scripts/lib/holosuite-conformance.ts | anchor: `prompt` | S || holonovel/scripts/lib/holosuite-differential.ts | anchor: `saveNovel` | S |
| holonovel/scripts/lib/holosuite-invariants.ts | anchors: `saveNovel`, `manage_history`, `replayInspection`, `context_report` | S |
| holonovel/scripts/lib/holosuite-novel.ts | anchors: `saveNovel`, `recap`, `context_report`, `visibility_check`, `knowledge_query`, `computeBundleIntegrity` | S |

No behaviour changes, no new gate, no new source file; this is the anchor
repoint class already tracked in ROADMAP.md ("Holosuite anchor repoint
automation"). Drifted anchors surfaced across four `test:all` runs; every
one was repointed to the nearest executable line that holds its symbol as a
whole identifier (the resolver's `\b` rule, so `prompt_inputs` does not satisfy
`prompt`). Verification: `test:all` green.

## Out of scope

- Rendering `source` in the human-readable sheet (`fmtEntitySheet`); REQ-152a
  governs the state representation.
- A `[PARTIAL]` response builder or filesystem fault injection.
- Quick-mode `manage_character (action: create)` while a workflow is pending
  (today only the step-by-step start is guarded, index.ts:4744). Recorded as an
  observation for the next review sweep.
- T103 (REQ-104c) and F-P3-8 — the separate §5.4 citation-repair increment.
