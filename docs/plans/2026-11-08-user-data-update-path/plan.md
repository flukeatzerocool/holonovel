# Plan — Make end-user data and package updates self-service

**Status:** draft, awaiting confirmation · **Date:** 2026-11-08 · **Depth:** standard
**Review independence:** self · **Rollback cost:** 1 (reversible; every write is backed up)

## Done bar

**Done bar:** the published package exposes a working `holonovel update` command
proven by a packed-artifact smoke test; stale persisted artifacts self-heal at
startup with a backup and a cleared flag; `spec_health.data_health` names a
remedy; a stale package with no rebuild source can be re-emitted at the current
package format through the package gates (REQ-579a) or is reported deferred with
its reason; REQ-650/651/652/579a are in the §5 map and the coverage register;
every finding F1–F10 has a terminal disposition (implemented, or a dated
`ROADMAP.md` plus review-register row in this increment; F10 is record-and-close
in `aar.md`); `npm run check:fast`, `npm run check`, and
`npm run test:package-smoke` exit 0; the increment lands with `plan.md`,
`tasks.md`, `aar.md` and a LOOP token.

## Questions and scope

User question, verbatim: *"what can we do to make it easy for users to update
their user data?"* followed by *"draft plan to action all findings."*

Scope: the **Update path for people who consume the published server**, not the
maintainer's Build workflow. Out of scope: hosted migration (DECISIONS.md
Non-goals — hosted platform), multiplayer, and changing the data-format
fingerprint scope.

## Evidence base (repo, this session)

| # | Evidence | Source |
|---|---|---|
| E1 | Published `files` allowlist omits `scripts/`; `FORBIDDEN_FILES` lists `scripts` | `holonovel/package.json`, `scripts/lib/package-manifest.ts:22-30` |
| E2 | `npm pack --dry-run --ignore-scripts` reports 189 files, `scripts/` absent | tool output |
| E3 | Launcher only starts the server; no subcommands | `holonovel/bin/holonovel.js` |
| E4 | `package.json` declares `update`/`migrate-user-data`/`start` against unshipped `scripts/*.ts` | `holonovel/package.json:30-33` |
| E5 | `./core` export already exposes `migrateNovelData`; `dist/core` ships | `holonovel/src/core/index.ts:3`, `package.json exports` |
| E6 | A save stamps the current `data_format`; roster/codex/notes stamp meta | `holonovel/src/core/state.ts:2389`, `:2449`, `:2524`, `:2548` |
| E7 | `[data-stale]` is set at load only and never cleared after a save | `state.ts:1431`, `:2482`; no `staleData.delete` |
| E8 | `data_health` is GM-only and carries only reason strings | `holonovel/src/index.ts:11830` |
| E9 | Auto-migration on load is established practice (Novel v1→v2) | `spec/02-requirements.md:3021` |
| E10 | Stale packages are held inactive | `holonovel/src/rulesets.ts:314` |
| E11 | Entry-point tests spawn root `scripts/*.ts` via `tsx`, never the packed artifact | `holonovel/scripts/test-fingerprints.ts:160-167`, `test-update-workflow.ts:39` |
| E12 | `REQ-614` requires runtime artifacts and forbids build-only inputs; no gate exercises the shipped command | `spec/02-requirements.md:3140` |
| E13 | `REQ-395c`/`REQ-424` say "the distribution SHALL expose" both entry points | `spec/02-requirements.md:3963`, `:4005` |
| E14 | `REQ-563` explicitly exempts externally built packages from a committed emitter | `spec/02-requirements.md:3993` |
| E15 | Format bumps recur: 9 data-format and 5 package-format entries in the changelog | `CHANGELOG.md` |
| E16 | Baseline: `check:fast` PASS (37 gates), tree clean, 0 roadmap items, 0 unpushed | `npm run status`, `npm run check:fast` |
| E17 | Wiki "Updating a Server" is builder-facing; no end-user update page | `.holonovel-state/wiki/Updating-a-Server.md` |
| E18 | REQ-395c/424 bodies are 837/839 chars by naive count and already sit at the 800-char shape limit; they MUST NOT be extended | `spec/02-requirements.md:3963`, `:4005`, `scripts/validate.ts:191` |
| E19 | §7.6 declares every runtime env var with a class; a non-build-time var is expected in a harness assertion (Appendix F) | `spec/04-runtime.md:127`, `scripts/validate.ts:1660` |

Trust boundary: every premise above is `repo` or `tool-output`. No `web` or
`user`-asserted premise drives a change.

## Findings register

| ID | Severity | Finding | Disposition |
|---|---|---|---|
| F1 | P1 | The published package ships no update/migration entry point; the declared scripts are build-only and excluded by design | C1, C5, C6 |
| F2 | P1 | Dormant campaigns never re-stamp; active ones self-heal only on write | C2 |
| F3 | P1 | The stale signal is GM-only, reason-only, and never clears in-session | C3 |
| F4 | P1 | A stale package with no emitter has no user-reachable rebuild path and is silently held inactive | C4 |
| F5 | P1 | No gate exercises the shipped command, so F1 is invisible to CI | C5 |
| F6 | P2 | Acceptance tests exercise repo scripts, not the published artifact | C6 |
| F7 | P2 | Update documentation is builder-oriented; no backup/rollback for users | C7 |
| F8 | P2 | `npx -y holonovel` always fetches latest, so format bumps arrive unannounced | C3, C7 |
| F9 | P2 | Dry-run-by-default is correct for the operator interface but a dead end as the user's only command | C1 |
| F10 | P3 | `starter-seeded.json` records a version no code reads | record-and-close (no action) |

Rejected findings: none. Web calibration: skipped — the subsystem is governed by
the project's own contract, not external practice.

## Blast radius

| Item | Why affected |
|---|---|
| `holonovel/bin/holonovel.js` | subcommand dispatch (C1) |
| `holonovel/src/cli/update.ts` (new) | runtime reconcile implementation (C1, C4) |
| `holonovel/src/core/state.ts` | flag clearing, startup reconcile helper (C2, C3) |
| `holonovel/src/index.ts` | startup reconcile call, health output, stderr notice (C2, C3) |
| `holonovel/src/rulesets.ts` | reuse `computeContentHash` for re-emit (C4) |
| `holonovel/tsconfig.build.json` | prove `src/cli/**` compiles into `dist` (C1) |
| `spec/04-runtime.md` §7.6 | `TTRPG_AUTO_MIGRATE` row with a class (C2) |
| `holonovel/DECISIONS.md` | version-derived file; no hand edit (C8) |
| `ROADMAP.md` | only if a change slips; then a dated row (conditional) |
| `spec/audit/review-register.md` | only if a finding is deferred; then a Scheduled-roadmap row (conditional) |
| `holonovel/scripts/smoke-package.ts` | packed-artifact command proof (C5) |
| `holonovel/scripts/test-fingerprints.ts` | CLI-path coverage (C6) |
| `holonovel/scripts/test-update-workflow.ts` | reconciliation + deferral coverage (C6) |
| `scripts/lib/package-manifest.ts`, `scripts/test-package-manifest.ts` | manifest assertion for the runtime command (C5) |
| `spec/02-requirements.md` | REQ-650/651/652/579a added; §5.18 map row (C1–C4) |
| `spec/03-build.md` §6.7 | reconciliation text names the shipped command (C1) |
| `spec/appendices-reference.md` | T773–T775 rows (C6) |
| `spec/appendices-runbooks.md` V.4/V.8 | user-facing path (C7) |
| `spec/audit/req-coverage.md` | regenerated (C8) |
| `README.md` | "Updating Holonovel" section (C7) |
| `.holonovel-state/wiki/Updating-a-Server.md` | split builder vs user guidance (C7) |
| `CHANGELOG.md`, `holonovel/package.json`, version-derived files | version bump (C8) |
| `docs/plans/2026-11-08-user-data-update-path/` | plan/tasks/AAR (all) |

## Changes

### Change 1: Ship a runtime `update` command
**Priority:** Must · **Risk:** Critical · **Size:** L
**Origin:** F1, F9; user asked for an easy update path.
**Rationale:** `scripts/` is a forbidden build-only input (E1, E12), so the only
conformant exposure is compiled runtime code reached through the shipped
launcher. `./core` already exports the migration model (E5), so no build-only
file is needed.
**Resolves:** F1, F9, part of F4
**File:** `holonovel/src/cli/update.ts` (new), `holonovel/bin/holonovel.js`,
`spec/02-requirements.md` §5.18, `spec/03-build.md` §6.7
**Rollback cost:** 1
**Existing-check discovery:** no existing check exercises a launcher subcommand;
`holonovel/scripts/smoke-package.ts` covers pack/install/handshake (REQ-614) and
is the correct seam to extend (C5). No duplicate gate.
**Done when:** `node bin/holonovel.js update --dry-run` against a temp data dir
reports one outcome per tier and writes nothing; without `--dry-run` it backs up
and re-stamps; `--json` is stable.
**Prose:**

New requirement (after REQ-424). REQ-395c and REQ-424 are already at the
800-char shape limit (E18), so neither body is extended; the shipped-command
contract lives in the new requirement and in §6.7.

> **REQ-650 — Shipped update command.**
> The published package SHALL expose an `update` command through its launcher,
> reconciling persisted artifacts and installed packages to the host's current
> fingerprints. Without arguments it SHALL apply and back up every file it
> rewrites; `--dry-run` SHALL report the same plan and write nothing. A stale
> package with no rebuild source SHALL be re-emitted from its installed files
> through the package gates or deferred with its reason. It SHALL print one
> outcome per tier, exit zero only when every tier is current, updated, or
> deferred, and run from compiled code without build-only files (REQ-614).
> *Acceptance criterion:* a packed install runs `update --dry-run` with no
> write; `update` re-stamps and backs up a stale artifact; a source-less package
> is re-emitted or deferred. _Check:_ T773.

§6.7 "User-data reconciliation" — append one sentence (section is not
fingerprinted): "On a packaged install, operators SHALL use the runtime
`update` command (REQ-650); the repository entry points remain the build-time
interfaces."

**Manifest:** add `650` to the §5.18 row of the §5 map (`spec/02-requirements.md:26`).
**Test:** T773 in Appendix T, bound to REQ-650.
**Alternatives rejected:** ship `scripts/` (violates REQ-614 and drags `tsx`);
add an MCP tool action (expands the surface, triggers action-conflict and
badge-gating work for a maintenance task); keep dry-run as the only default
(leaves the natural invocation a no-op).

### Change 2: Self-heal stale artifacts at startup
**Priority:** Must · **Risk:** Major · **Size:** M
**Origin:** F2.
**Rationale:** Only a write re-stamps today (E6); dormant campaigns never write.
The project already auto-migrates on load for Novel v1→v2 (E9), so this is an
extension of an accepted pattern, not a new mechanism.
**Resolves:** F2
**File:** `holonovel/src/core/state.ts`, `holonovel/src/index.ts`,
`spec/02-requirements.md` §5.18
**Rollback cost:** 1
**Existing-check discovery:** `test-fingerprints` T501 covers detection, not
re-stamping at startup; extend it (C6). No duplicate gate.
**Done when:** starting against a fixture with a prior fingerprint leaves every
artifact current, one backup per artifact, and `data_health.stale` empty; a
read-only state dir starts cleanly and keeps the advisory flag.
**Prose:**

> **REQ-651 — Startup reconciliation of stale artifacts.**
> At startup the host SHALL reconcile each persisted artifact whose data-format
> fingerprint differs by re-serializing it through the interchange round-trip
> (REQ-096, Appendix Q), backing it up first, and writing it atomically with a
> recomputed checksum (REQ-092). Reconciliation SHALL preserve inert fields,
> apply defaults (REQ-065), and clear the artifact's `[data-stale]` flag on
> success. An unwritable directory SHALL NOT block startup; the artifact keeps
> its flag. It SHALL be disabled when `TTRPG_AUTO_MIGRATE` is `off`. A failed
> reconciliation SHALL leave the original unchanged and name the artifact.
> *Acceptance criterion:* a prior-fingerprint artifact is current after startup
> with one backup; a read-only directory still starts; a failed artifact is
> unchanged and named. _Check:_ T774.

**Manifest:** add `651` to the §5.18 row.
**Test:** T774 in Appendix T.
**Alternatives rejected:** reconcile only on first write (never happens for
dormant data); prompt via MCP (a background server cannot prompt).

Runtime config: add `TTRPG_AUTO_MIGRATE` to the §7.6 table
(`spec/04-runtime.md`) with the class `Storage.` (it governs state-directory
writes, not story behavior, so it needs no §7.7.1a coupling row). Because §7.6
varnames that are not build-time/informational are expected in a harness
assertion (E19), the harness added in C6 sets and unsets the variable.

### Change 3: Actionable health signal and in-session flag clearing
**Priority:** Should · **Risk:** Minor · **Size:** S
**Origin:** F3, F8.
**Rationale:** The GM sees a reason but no remedy, and the flag survives a save
that fixed it (E7, E8). One line on stderr makes a format bump visible without
exposing artifact content.
**Resolves:** F3, F8 (notice half)
**File:** `holonovel/src/index.ts`, `holonovel/src/core/state.ts`,
`spec/02-requirements.md` §5.18
**Rollback cost:** 1
**Existing-check discovery:** `test-output-contracts`/`test-fingerprints`
already assert health shape; extend T501's assertions rather than add a gate.
**Done when:** each stale entry carries `stored`, `current`, `reason`,
`remedy`; a save clears the entry; stderr prints one line with counts.
**Prose:**

> **REQ-652 — Stale-artifact health and notice.**
> `spec_health.data_health` SHALL report each stale artifact with its name, its
> stored and current fingerprints, a reason, and a remedy naming the shipped
> update command. A successful write of an artifact SHALL clear its
> `[data-stale]` flag for the running session. The host SHALL write one
> plain-English line to standard error at startup when any artifact or package
> is stale or deferred, naming the count and the remedy. Health detail SHALL
> remain Game Master-only; the startup line SHALL carry no artifact content.
> *Acceptance criterion:* a stale artifact reports both fingerprints and the
> remedy; a save clears it; startup prints one line naming the count. _Check:_
> T775.

**Manifest:** add `652` to the §5.18 row.
**Test:** T775 in Appendix T.

### Change 4: Format-only package re-emit when no rebuild source exists
**Priority:** Must · **Risk:** Major · **Size:** M
**Origin:** F4.
**Rationale:** REQ-563 exempts externally built packages (E14), and such a
package has no emitter, so it is deferred forever (E10). Format-level advances
(prompt inputs, surface declarations, description sanitization) can be applied
from the installed six files and verified by the existing gates. This is exactly
the recovery used on the live deployment this session.
**Resolves:** F4
**File:** `spec/02-requirements.md` §5.3 (body after REQ-579),
`holonovel/src/cli/update.ts`, `holonovel/src/rulesets.ts` (reuse
`computeContentHash`)
**Rollback cost:** 1
**Existing-check discovery:** `check-ruleset-package.ts` and
`check-ruleset-model.ts` already gate emissions; the runtime path must call
them or replicate their assertions. No duplicate gate.
**Done when:** a fixture package with a prior `package_format` is re-emitted,
passes both gates, keeps its rules content, and reports `updated`; a package
that fails a gate stays untouched and reports `deferred` with the defect.
**Prose:** new sub-requirement (REQ-579 is 503 chars; appending would breach the
800-char limit, E18). A sub-REQ inherits the family `_Check:` trailer:

> **REQ-579a — Format-only package re-emit.**
> A package whose rebuild source or emitter is unavailable SHALL be re-emitted
> from its installed package files at the host's current package format when the
> re-emission passes the package gates (REQ-430, REQ-559, REQ-560) and preserves
> the package's rules content. A package whose re-emission fails SHALL be
> recorded deferred with its reason and named in the startup notice (REQ-652).

**Manifest:** no map edit — `579a` falls inside the existing `567–581` range in
the §5.3 row; the body is placed after REQ-579.
**Test:** extend T672 to assert the re-emit and the refusal paths.
**Alternatives rejected:** require a committed emitter for every package
(contradicts REQ-563's exemption); ship a one-off re-stamp flag that skips the
gates (unsafe).

### Change 5: Prove the shipped command in the packed artifact
**Priority:** Must · **Risk:** Major · **Size:** M
**Origin:** F5, F1.
**Rationale:** REQ-614's gate installs and handshakes the package but never runs
a maintenance command (E12), which is why a launcher with no subcommands passed
every gate for months.
**Resolves:** F5
**File:** `holonovel/scripts/smoke-package.ts`, `scripts/lib/package-manifest.ts`,
`scripts/test-package-manifest.ts`
**Rollback cost:** 0
**Existing-check discovery:** extend `smoke-package.ts` (REQ-614/T732) — no
second pack/install harness is needed. Add one pure assertion to
`checkManifest`: the launcher's declared path must be inside `files`.
**Done when:** the smoke gate fails when `bin/holonovel.js` loses its `update`
branch, and passes on the current tree.
**Prose:** no new REQ; extend REQ-614's `_Check:_` to `T732, T776`.
**Manifest:** none.
**Test:** T776 in Appendix T.
**Error-gate dry run (required first):** before implementing C1, extend the smoke
assertion and run it against the current tree. It MUST fail naming the missing
`update` subcommand — that failure is the recorded proof of F1, not a blocker.
No other finding may be deferred into the build.
**Alternatives rejected:** a broad "no dead script in package.json" check —
the dev scripts are ~70 and would swamp the gate with benign findings (false
positive budget); assert the runtime contract instead.

### Change 6: Exercise the runtime path in the spec harnesses
**Priority:** Should · **Risk:** Minor · **Size:** S
**Origin:** F6.
**Rationale:** Acceptance tests spawn repo scripts (E11), so repo and artifact
can diverge undetected.
**File:** `holonovel/scripts/test-fingerprints.ts`,
`holonovel/scripts/test-update-workflow.ts`
**Resolves:** F6
**Rollback cost:** 0
**Existing-check discovery:** extend the existing T501/T502/T649 cases; no new
harness.
**Done when:** T501/T502 run through `bin/holonovel.js update` (via `dist`) and
still assert the same outcomes.
**Prose:** none (test-only).
**Test:** T773–T775 names attached to the new cases.

### Change 7: End-user documentation and backup story
**Priority:** Should · **Risk:** Minor · **Size:** S
**Origin:** F7, F8.
**File:** `README.md`, `.holonovel-state/wiki/Updating-a-Server.md`,
`spec/appendices-runbooks.md` V.4/V.8
**Rollback cost:** 0
**Done when:** README has an "Updating Holonovel" section naming the command,
the automatic behavior, the backup location, rollback, and version pinning; the
wiki separates builder and user paths; V.4/V.8 name both interfaces.
**Prose:** none (documentation; the runbooks cite REQ-650/651).
**Alternatives rejected:** document only the repo command (unusable for users).

### Change 8: Version, registers, changelog, AAR
**Priority:** Must · **Risk:** Minor · **Size:** S
**Origin:** project convention.
**File:** `CHANGELOG.md`, `holonovel/package.json` (via `npm run version-bump`),
`spec/audit/req-coverage.md`, generated version-derived files,
`docs/plans/2026-11-08-user-data-update-path/aar.md`
**Rollback cost:** 1
**Gate-pinned values:** the CHANGELOG heading date SHALL equal the CalVer date
produced by `npm run version-bump`; `check-fingerprint-sync` is unaffected
(§5.18 is not fingerprinted) but `npm run build-order` must still run to advance
the version, AGENTS.md, DECISIONS.md, `index.ts`, lockfile, and `server.json`
together (REQ-107a).
**Done when:** `npm run validate -- --write-register` leaves the coverage
register current; `npm run build-order` exits 0; AAR ends with a LOOP token.

## Dependency order

1. C1 (runtime command skeleton) → C4 (package tier) → C2 (startup reuse of the
   same reconcile routine) → C3 (health consumption of its outcomes).
2. C5 and C6 depend on C1's command surface.
3. C7 depends on C1–C4 being settled.
4. C8 last.

## Pre-execution checks (must run before the first edit)

| Check | Command | Expected |
|---|---|---|
| Sibling-REQ contract | `grep -n "REQ-395c\|REQ-422\|REQ-424\|REQ-556\|REQ-564\|REQ-579" spec/02-requirements.md` | No REQ binds the shipped launcher; REQ-650/579a introduce the contract, §6.7 points to it |
| Compile surface | inspect `holonovel/tsconfig.build.json` include globs | `src/cli/**` (or the chosen path) is compiled into `dist`; add it if the glob is narrower |
| Tool-definition surface | `npm run check-tool-definitions-sync` after C3 | Health output fields are nested; if the sync gate reports drift, regenerate with `holonovel/scripts/generate-tool-definitions.ts` |
| Coverage register | `npm run validate -- --write-register` after C1–C4 | `spec/audit/req-coverage.md` lists REQ-650/651/652/579a |
| Wiki target | `git -C .holonovel-state/wiki status` | The wiki is a separate clone; its edit is published to the wiki remote, never committed to this repo |
| Plan artifact | `git check-ignore docs/plans/2026-11-08-user-data-update-path/plan.md` | exit 1 (not ignored; trackable) |

## Committed targets

- Tracked in this repo: `docs/plans/2026-11-08-user-data-update-path/*`,
  `spec/**`, `holonovel/**`, `scripts/**`, `CHANGELOG.md`, `README.md`.
- Not tracked here: `.holonovel-state/wiki/*` (separate clone), any
  `TTRPG_DATA_DIR` fixture, `holonovel/dist` (build output).
- The `TTRPG_AUTO_MIGRATE` row is a §7.6 table row, not a new persisted property
  group, so no §7.7.0 class contract or clone/checkpoint enumeration changes.

## Edge cases and rollback

| Failure | Mitigation |
|---|---|
| Read-only state dir (container) | C2 catches `EROFS`/`EACCES`, keeps the advisory flag, starts normally |
| Two host instances writing one state dir | Atomic tmp+rename and per-artifact backup chain; reconciliation is idempotent |
| Re-emit produces a gate defect | Package left untouched, reported deferred with the defect (C4) |
| Backup disk full | Write refuses before the primary is replaced; original unchanged |
| `TTRPG_AUTO_MIGRATE=off` | Detection and advisory behavior unchanged; C1 remains the manual path |
| User wants the old bytes | `.bak-<epoch>` per artifact; package backups under the state root |

Every write is reversible from a backup; no deletion or downgrade path is added.

## Verification

- `npm run check:fast` (37 gates) after each change group.
- `npm run test:package-smoke` — proves C5 end to end (REQ-614, T732, T776).
  It packs and installs the tarball, so it needs the npm registry or a warm
  cache; if the registry is unreachable, record the smoke as deferred-with-reason
  and rely on the `npm pack --json` file-list assertion — do not claim its green.
- `npx tsx holonovel/scripts/test-fingerprints.ts` and
  `npx tsx holonovel/scripts/test-update-workflow.ts` — T501/T502/T649/T773–T775.
- `npx tsx holonovel/scripts/test-package-manifest.ts` — manifest assertion.
- `npm run build-order` and `npm run check` before commit.
- Determinism: reconciliation and re-emit produce identical bytes for identical
  inputs (reuse the existing canonical-hash helpers); no wall-clock field is
  compared by any freshness gate.
- Fixture format: fixtures are the six-file package shape and the persisted
  artifact shape already used by `test-fingerprints.ts`; no new format is
  invented.

## User impact

- A user who runs `npx -y holonovel` after a format bump sees one stderr line and
  has a working `holonovel update`; campaigns re-stamp automatically on the next
  start when the directory is writable.
- Restart required after an update (packages are not hot-reloaded, REQ-420).
- No new MCP tool, no badge-gating change, no new persisted property group.
- Restores a broken ruleset only when it passes the package gates; otherwise the
  user gets a named deferral instead of silence.

## Delta amendments

1. **2026-11-08 — REQ-614 `_Check:_` edit dropped.** §5.9 is a fingerprinted
   section (`DATA_SECTIONS`), and REQ-614 lives inside it. Adding `T776` to its
   `_Check:_` advanced `DATA_FORMAT`, which would force a global re-stamp for a
   test-row edit. T776 is cited from REQ-650 and the Appendix T row instead; the
   REQ-614 body is unchanged. Verified: `PACKAGE_FORMAT` and `DATA_FORMAT` match
   the committed constants after the revert.

## Open questions

1. ~~Should `holonovel update` apply by default?~~ **Resolved:** apply both
   tiers by default, back up both, print both (REQ-650). The operator entry
   point keeps its dry-run default; the two interfaces are separate.
2. Should the startup stderr line appear for Players too (it has no artifact
   content), or stay GM-visible only? Current plan: stderr is unfiltered, the
   health map stays GM-only.
3. Does `npx -y` pinning guidance belong in README only, or also in the wiki
   Getting Started page? Current plan: both.
