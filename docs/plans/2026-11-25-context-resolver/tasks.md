# Tasks — context resolver, checked audit, and the two no-Novel authoring paths (A1 + A2)

Dependency order. Each task names its accept; a task is not done until its accept holds.

1. **T1 — Baseline (P0).** [no dependencies] Run `npm run status` and `npm run check:fast` un-piped.
   **Accept:** the trailing line reads `check:fast: PASS`; the exit code was captured, not piped away;
   `git status` holds only the two roadmap files and this increment directory as untracked. A red
   baseline is fixed first, as its own commit, before T2.

2. **T2 — Resolver and types (P1).** [T1] Create `holonovel/src/core/context.ts` with the exact types
   in D1 — `ContextKind`, `ContextScope`, `ContextRequest` (`explicit?`, `activeNovelSlug?`, `scope`,
   `subjectKind?`, `subjectId?`), `ResolvedContext` (`kind`, `id`, `source`), returning
   `ResolvedContext | null` — and a pure `resolveContext()` implementing the six rules in D2's order.
   Create `holonovel/src/core/context-audit.ts` with the row type, `descriptorFor(tool, action)`
   returning `{scope, novelCapable, wrapped}`, and an empty registry (the table arrives in T6).
   Export both from `holonovel/src/core/index.ts`.
   **Accept:** `npm --prefix holonovel run typecheck` passes; a tsx import of `core/index.js` resolves
   `resolveContext` without starting the server; `core/context.ts` imports neither `index.ts` nor
   `state.ts`.

3. **T3 — Precedence harness (P2).** [T2] Create `holonovel/scripts/test-context.ts` in the shape of
   `test-data-dir.ts` (`test(name, fn)`, passed/failed counters, exit 0/1/2). Cover all six rules
   against the resolver alone: explicit; Novel-capable with a Novel open; novel-capable + play-scoped
   + no Novel → `null`; roster subject from a named roster id **and** from a player-character create;
   authoring with no Novel; ruleset lookup; fallback. Also cover explicit-over-novel; explicit `novel`
   with no Novel; `target: both` → `novel+codex` with `id: null`; a Novel-open authoring call staying
   in the Novel. Wire `test:context` into `holonovel/package.json` and the ordered list in
   `holonovel/scripts/run-test-suite.ts`.
   **Accept:** `npm --prefix holonovel run test:context` exits 0 and prints a case count; one case
   exists per rule, the roster rule has both variants, and `test:all` runs 57 commands.

4. **T4 — Response carrier (P3).** [T3] Add `withContext(result, ctx)` beside `withSeedWarning`,
   mirroring its raw-safe shape: append a second text block `context: <kind> (<id>)` (no parenthetical
   for `novel+codex`) and set `structuredContent.context = {kind, id, source}`; never edit the first
   content block or `structuredContent.text`. Return the result unchanged when it already carries a
   context or when `ctx` is null. Add the carrier cases to `test-context.ts` (second block, field set,
   body untouched, second wrap no-op, null ctx no-op). Apply it to `manage_codex`
   `set`/`list`/`get`/`export`/`delete` and `manage_adventure` `generate`/`load`.
   **Accept:** the carrier cases pass when called directly with an explicit context, so the assertion
   does not depend on the table; codex `list` with no Novel returns its JSON body byte-verbatim plus a
   second block; `err()` and `needInput()` are never wrapped.

5. **T5 — Gate, before the table exists (P4).** [T2] Write `holonovel/scripts/check-context-audit.ts`.
   It reads source only, so it runs against an empty registry. It parses the four tool-surface files,
   attributes each `requireNovel()` call to its enclosing `register` block and `case` label, and keys a
   guard at handler or helper scope as `tool.guard`. Flags: `--observed` (print keys and site counts),
   `--write` (regenerate `docs/authoring-surfaces/context-audit.md`), `--check` (default; compare the
   table **and** the committed page); `--help`; unknown flags rejected through `scripts/lib/args.ts`.
   The generated page carries no timestamp or version stamp, so `--write` is byte-deterministic. Header
   declares `[gate]`, exit codes 0/1/2, and the REQ citation.
   **Accept:** `--observed` reports 186 sites at the commit where T5 runs; every finding is classified
   as a true action site, a guard site, or a parser artifact, and artifacts are fixed in the parser
   rather than baselined; the gate exits 1 against an empty registry and a missing row (the red test
   runs in T6, once a table exists to corrupt).

6. **T6 — Generate and classify the table (P4).** [T5] Produce the table from `--observed`, then fill
   every row from the D5 table: `class`, `scope`, `novelCapable`, `wrapped`, `sites`, `disposition`
   (`keep` | `A2-fix` | `A3` | `A4` | `A5`). Add `sites: 0` rows for codex `set`/`list`/`get`/`export`
   /`delete`, ruleset `search`/`install`/`remove`/`list`/`bind`, adventure `generate`/`load`/`list`,
   character `roster_list`/`roster_remove`. Check `ROADMAP.md`: a finding that is normative,
   unscheduled, and has no A3/A4/A5 home gets a `ROADMAP.md` row and a matching
   `spec/audit/review-register.md` `Scheduled-roadmap` entry together; otherwise neither changes, and
   the AAR says so.
   **Accept:** zero unclassified rows; every `wrongly-novel-bound` row names its target increment;
   `npx tsx holonovel/scripts/check-context-audit.ts --check` exits 0; the generated page renders the
   same rows; a copy with one row removed exits 1 (the red test).

7. **T7 — Wire the gate (P4).** [T6] Add `check-context-audit` to `package.json`, a row to
   `scripts/lib/gate-manifest.ts` (fast and full), and regenerate the AGENTS.md gate table with
   `npm run gates -- --list --format=md`. Confirm no existing script parses `requireNovel()` and
   record that in the AAR.
   **Accept:** `npm run check-gate-table` passes; `npm run check-script-quality` accepts the new
   script; `npm run check:fast` includes the gate and still passes.

8. **T8 — Context fields and the remaining wrappers (P5).** [T4] Add optional `context` to
   `manage_character`, `manage_codex`, `manage_npc`, and `manage_ruleset`; add optional `ruleset` to
   character create; state the resolution order in one sentence per description. Leave `manage_lore`
   and `manage_note` untouched until A4. Keep `manage_adventure`'s `target` and scene `context`, and
   say so in its description. Wrap character, npc, and ruleset responses.
   **Accept:** an explicit `context` wins over an active Novel; a request without one uses the active
   Novel only for a `novelCapable` row; the schema diff touches only the four tools plus character
   `ruleset`; an unwrapped tool's response shape is unchanged.

9. **T9 — Roster-only character creation (P6).** [T8] Add
   `StateManager.createRosterEntity(name, personality, stats, ruleset)` that allocates `character_NN`
   from roster keys, builds the entity, and calls `addToRoster(entity, ruleset)`. Extend
   `addToRoster`, `saveRoster`, and `loadRoster` so `ruleset`, `created_at`, and `created_by` survive
   a reload. Change `manage_character (action: create)` so that with no active Novel it builds the
   entity from the roster path: `name` required (no step-by-step workflow outside a Novel),
   profile-only unless `ruleset` is supplied, refusing with the installed list when several rulesets
   exist and none is named, and `capGuard("roster", …)` before the write.
   **Accept:** create with no Novel writes `roster.json`, returns `[OK]` and `context: roster`, and
   creates no Novel file; create, save, reload returns the same `identity`, `ruleset`, `created_at`,
   and `created_by`; an unnamed create returns `[INVALID_INPUT]` naming the required fields; explicit
   `context: "novel"` with no Novel returns `[STATE_CONFLICT]`; a Novel-active create behaves exactly
   as before.

10. **T10 — Codex-backed NPC creation (P6).** [T8] Factor the codex entry writer out of
    `manage_codex (action: set)` and use it from `manage_npc (action: create)` when no Novel is
    active: the NPC object is stored as a codex entry of kind `npc` with `context: codex`.
    `ruleset_reference` resolves against an installed package or refuses with the valid list.
    **Accept:** create with no Novel writes `codex.json`, returns `[OK]` and `context: codex`, and
    `manage_codex (action: get)` returns the entry; a Novel-active create is unchanged.

11. **T11 — Proofs and table regeneration (P6).** [T9, T10] Add the five no-Novel proofs to
    `test-context.ts`: character create, NPC create, codex `list`/`get`/`export`, ruleset `search`
    with a slug, adventure `generate target: codex`. Run `npm run action-conflicts` and grep the spec
    for sibling clauses binding the changed actions. Re-run `--observed`, regenerate the table and
    page.
    **Accept:** the five proofs pass; a Novel-only operation with no Novel still returns
    `[STATE_CONFLICT]` naming the missing Novel; no action-conflicts finding; the regenerated site
    count matches the code and the gate is green.

12. **T12 — Spec amendment (P7).** [T6] Add `REQ-661 — Context resolution` to §5.9; amend
    `REQ-088e` (creation is context-aware; import stays Novel-scoped; "orphan" is no longer a defect),
    `REQ-075a` (no-Novel NPC create writes a codex entry), and `REQ-075b` (a codex-backed NPC is not
    Novel-persisted and does not appear under `npcs://`; say where it does appear). Register
    `T794`–`T798` with their assertions per D10, add the row to the `| REQ | Title | Spec version |`
    index in `spec/appendices-reference.md`, and update the §5 map row to include `661`. Apply the
    Appendix M authoring checklist.
    **Accept:** `npm run assemble && npm run validate:sdd` reports 0 errors; `REQ-661` is ≤800
    characters and ≤8 sentences; the three amended bodies are ≤800 characters and ≤8 sentences with
    the counts recorded in the AAR; `npm run validate -- --write-register` regenerates the coverage
    register with the new row, a bucket that `HOLONOVEL_IMPL_STRICT=1 npm run validate` accepts, and
    no unbaselined linkage finding.

13. **T13 — Regeneration (P8).** [T11, T12] Run `check-tool-definitions-sync` (regenerate without
    `--check`), `tool-definitions-lint`, `surface-budget --write` when the footprint moved,
    `check-tool-surface`, and update the recorded counts in `holonovel/DECISIONS.md` and
    `holonovel/AGENTS.md` (tool-surface notes, harness count, `index.ts` size line). Run
    `npm run build-order` so CalVer, fingerprints, `package-lock.json`, and `holonovel/server.json`
    advance together.
    **Accept:** `check-tool-definitions-sync` reports no drift; `surface-budget` and
    `check-tool-surface` exit 0 after the write; `build-order` prints 0 errors;
    `holonovel/tool-definitions.json`, `holonovel/src/generated/contract-fingerprints.ts`,
    `holonovel.md`, and the version files are committed.

14. **T14 — Roadmap reconciliation (P8).** [T12] Commit `docs/authoring-surfaces-roadmap.md` with its
    A2 bar aligned to this plan and its "129" corrected to "186 across four tool files"; commit
    `docs/codex-snapshot.md` as the program's design input.
    **Accept:** the roadmap's A2 row and §3.3 agree with the plan; `git status` holds no untracked file
    that `push-pipeline.sh` would sweep or refuse.

15. **T15 — Full gates and close (P8).** [T11, T13, T14] Run `npm run check:fast` un-piped after
    `build-order`'s own `check`, then `npm --prefix holonovel run test:all`, write `aar.md` with the
    `## Changelog entry` block and the terminal token, and run `npm run session:close`.
    **Accept:** `check:fast: PASS`; `check` 0 errors; `test:all` passes 57 commands;
    `check-loop-artifacts` passes; `session:close` commits with the CHANGELOG heading.
