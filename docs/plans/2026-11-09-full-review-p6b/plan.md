# Plan — Full-review sweep, chunk P6b (ruleset packages and host entry points)

**Status:** draft, awaiting user approval · **Date:** 2026-11-09 · **Depth:** standard
**Review independence:** fresh — one cold pass (`independent-review passed.`,
4/5 stages; stage 4 N/A) plus one targeted diff re-review after the review
findings were applied; report `/tmp/opencode/p6b-cold/report.md`. Reviewed
pre-header text sha256
`1c41c0a2e2d6b3ab39ef2ebac8a2bfdedd5151085b601856651715763dc7143e`; this
header is the only text added after that pass.
**Rollback cost:** 1 (2 if a C0 baseline fix lands first)
**Roadmap item:** `ROADMAP.md` § Remaining full-review sweep (P1)
**Predecessor:** `docs/plans/2026-11-09-full-review-p6a/` (chunk P6a, closed
2026-11-09, `LOOP PAUSED`)
**Tracker:** `docs/plans/2026-11-09-full-review-sweep/worklist.md`

## Review status

Drafted against the live tree and the sweep's established method. Chunk P6b is
the second half of the P6 split recorded as D61: the ruleset-package and
host-entry-point surface — §5.16 (23 REQs / 9 family rows), §5.17 (15 REQs / 9
family rows), §5.18 (25 REQs / 22 family rows), and the three base-capability
sections §5.21–§5.23 (10 REQs / 10 family rows) — **73 REQs across 50 family
rows** (measured this session; EV4). This is the last scheduled sweep chunk
before P7, P8, and the closing M1 re-run. Depth is `standard`: the increment
edits review records, registers, roadmap, and changelog; it is fully reversible
and performs no destructive, remote, or schema-migration operation. A P0 fix
could touch the package manager, the host entry points, or a capability handler,
which is why the plan fixes the harness set in advance.

## Done bar

**Done bar:** this increment only — chunk P6b of the sweep program. The bar is
met when all nine items hold; anything else found is scheduled, not chased.

1. `docs/plans/2026-11-09-full-review-p6b/` carries `plan.md`, `tasks.md`, and
   `aar.md`, and `aar.md` ends in `LOOP PAUSED` or `LOOP OPEN`.
   `check-loop-artifacts` passes.
2. The sweep `worklist.md` holds a chunk P6b section with **one row per
   in-scope REQ — 73 rows** (`REQ-379a`–`387b` in §5.16; `REQ-389a`–`394`,
   `REQ-419`, `REQ-430`, `REQ-432a`/`432b` in §5.17; `REQ-394a`, `REQ-395a`–`c`,
   `REQ-396`–`398`, `REQ-418`, `REQ-420`–`424`, `REQ-428`, `REQ-429`,
   `REQ-556`, `REQ-557`, `REQ-558`, `REQ-560`, `REQ-561`, `REQ-563`, `REQ-564`,
   `REQ-650`–`652` in §5.18; `REQ-434`–`437` in §5.21; `REQ-438`–`440` in
   §5.22; `REQ-441`–`443` in §5.23; ranges are document-order inclusive), each carrying its bucket inherited from the
   base family row in `spec/audit/req-coverage.md` and a verdict of `holds`,
   `finding:<ID>`, `builder-side`, or `deferred:<chunk>`.
3. The same section holds a **code-surface table of at least twelve behaviour
   rows**: package manifest and content hash, package-format fingerprint
   comparison, package install/remove/list and prefix map, tool namespacing,
   tool-description budget, scoped `tools/list` and pagination, lazy hydration,
   `spec_health.ruleset_health` and `ruleset_package_alerts`, Novel ruleset
   binding and switching, per-ruleset extraction isolation, `build-ruleset`
   intake and source registry, `update`/`update-rulesets`/`migrate-user-data`,
   deploy preservation and state location, deterministic emission and package
   replay, the Fate/Ironsworn/Forged capability actions, and the
   registry-published distribution. Each row carries a `file:line` anchor, the
   carrying evidence, and a verdict. A finding ID is `F-P6b-N`, N restarting at
   1 and shared across severities. Table shape is the P5 one:
   `Behaviour | Anchor | Harness | Verdict`; behaviour verdicts use the same
   vocabulary as REQ rows (`holds`, `finding:F-P6b-N (Pn)`, `builder-side`,
   `deferred:<chunk>`); cluster verdicts
   `Cluster | REQs | Verdict | Evidence`.
4. Every `finding:<ID>` names a `file:line` or `spec:line` predicate and a
   P-severity, and has a terminal disposition (`Resolved` ·
   `Scheduled-roadmap` · `Closed-P3` · `Deferred-by-user`), recorded as
   `finding:F-P6b-N (P0|P1|P2|P3)`; a P0 fixed in-session reads
   `finding:F-P6b-N (P0, resolved in-session)`.
5. Zero open P0 findings remain. A P0 that cannot be fixed inside the session
   stops the run and still lands as a record (see **Stopped-run landing**).
6. Each of the four clusters (A–D below) has a recorded verdict (`holds`,
   `finding:F-P6b-N (Pn)`, `deferred:<chunk>`, or `builder-side`), and a
   cluster verdict is the worst-of its own REQ rows under the order `finding` >
   `deferred` > `builder-side` > `holds` (within `finding`, the highest
   severity wins; ties go to the lowest `F-P6b-N`). Every REQ has exactly one
   owning cluster (the disjoint lists in the cluster section).
7. `spec/audit/review-register.md` carries every P6b finding under the section
   its disposition names; no `Scheduled-roadmap` row is written without its
   matching `ROADMAP.md` entry, and every `REQ-NNN` token in a
   `Scheduled-roadmap` row appears literally in `ROADMAP.md`
   (`scripts/lib/register-checks.ts:64-68`, enforced by
   `npm run check-registers:strict`).
8. `ROADMAP.md` is updated in the same increment: the sweep section names the
   remaining chunk P7, chunk P8, and the closing M1 re-run, retains the scope
   clause, and its `**Trigger:**` names chunk P7 on a closed run (or the P0 /
   chunk P6b resume on a halt), keeping the admission shape (1–3 bullets +
   `**Trigger:**`).
9. These exit 0 un-piped: `npm run assemble`, `npm run check:fast`,
   `npm run check`, `npm --prefix holonovel run test:all`, and
   `npm --prefix holonovel run test:ruleset-nonovel` (not in `test:all`, EV21).
   The increment is
   one commit, subject derived by `npm run session:close` from the
   `CHANGELOG.md` heading; a conditional C0 baseline fix precedes it as its own
   commit (see **Commit order and gates**). No push.

## Open questions (answers recorded as decisions before execution)

- **Q1 — Does P6b execute whole, or split again?** P6b is 73 REQs / 50 family
  rows over two surfaces: the package/host-entry-point half (§5.16–§5.18) and
  the base-capability half (§5.21–§5.23). The worklist (D61) already assigns
  all 73 REQs to P6b as one chunk. **Recommendation:** execute whole; a split
  would leave the sweep at four remaining chunks and cost another session. A
  time-boxed partial landing already exists if the session runs out.
- **Q2 — Fix policy.** D2/D13/D62 unchanged: P0 fixed in-session (bounded), P1
  scheduled on `ROADMAP.md`, P2 fixed only on a demonstrated failure, P3
  record-and-close. **Recommendation:** adopt.
- **Q3 — Increment record.** New directory
  `docs/plans/2026-11-09-full-review-p6b/`; the sweep `worklist.md` stays the
  cross-session tracker and carries the P6b tables and decisions D71 onward
  (D70 is the last recorded). **Recommendation:** yes.
- **Q4 — Bucket resolution.** Resolve by base family ID from
  `spec/audit/req-coverage.md`, never by section membership. Measured this
  session (EV5–EV7): §5.16 nine rows (eight bucket E, `REQ-380` bucket C);
  §5.17 nine rows (seven bucket C — `REQ-389`, `430`, `432`, `390`, `391`, `392`,
  `393` — and `REQ-394`, `419` bucket E); §5.18 twenty-two rows (bucket C:
  `420`, `423`, `424`, `429`, `558`, `650`, `651`, `652`; the rest bucket E);
  §5.21–§5.23 ten rows all bucket C. Re-verify at Phase 0.
  **Recommendation:** yes.
- **Q5 — Boundaries (one rule, no overlap).** P6b owns the ruleset package and
  its manager, the ruleset-scoped surface, the host workflow entry points, and
  the three base-capability families. Boundaries: (a) the world model, parser,
  conversion, and world handlers are **P6a** (closed); (b) the semantic index,
  corpus, and knowledge graph behind `manage_ruleset (action: search)` and the
  corpus/graph tools are `deferred:P7`; (c) narrative cognition is
  `deferred:P8`; (d) storage mechanics for user data (atomic save, backup
  rotation, corruption chain) are P4 (closed) unless a §5.18 predicate
  (fingerprint reconciliation, migration, deploy preservation) breaks;
  (e) badge gating of the transport layer is P1 (closed), but a missing
  ruleset-scope gate or a `spec_health` badge leak is a P6b finding against the
  owning §5.16/§5.17 REQ. **Recommendation:** adopt this single rule.
- **Q5a — Row precedence.** One verdict per REQ; a predicate straddling a
  boundary is worst-of, so any defect in a P6b predicate is `finding:<ID>` even
  when another predicate in the same REQ is `deferred:<chunk>`; `holds`
  requires every non-deferred predicate to hold, and the evidence cell names
  the deferred part. **Recommendation:** adopt.
- **Q6 — Citation resolution scope.** Apply P2/P3b/P4/P5/P6a's method
  unchanged: each REQ's own `*Check:*` IDs; a REQ with no own Check inherits
  its family's citation set; an `Automated` citation must appear literally in a
  `holonovel/scripts` harness **and** the harness body must be opened and must
  exercise the stated behaviour; `Manual`, `Gate`, and scenario citations need
  no harness. Zero-padded title tokens (`T0nn`) are shadowing, not evidence
  (F-P2-4). **Recommendation:** adopt.
- **Q7 — Fingerprint consequence (this chunk differs from P6a).**
  `PACKAGE_SECTIONS` = §5.16, §5.17, §6.3, §6.4.2
  (`scripts/lib/contract-fingerprint.ts:27`), so a REQ-body edit in **§5.16 or
  §5.17 changes the package-format fingerprint** (`holonovel/src/generated/
  contract-fingerprints.ts`). `DATA_SECTIONS` includes §5.21–§5.23
  (`contract-fingerprint.ts:37-43`), so a REQ-body edit there changes the
  data-format fingerprint. A §5.16/§5.17 body edit therefore makes installed
  packages report `[package-incompatible]` until rebuilt; a §5.21–§5.23 body
  edit makes persisted artifacts report `[data-stale]` until migrated. Either
  edit requires `npm run assemble` then `npm run build-order` (which
  regenerates the fingerprints and runs `check-fingerprint-sync`) plus
  `npm run validate -- --write-register`, and the increment must state the
  matching consequence. §5.18 is in neither set, so a §5.18-only body edit
  needs `assemble` + register refresh only. **Recommendation:** adopt, and
  prefer amending no REQ body unless a P0 fix genuinely requires it.
- **Q8 — Row granularity.** P5/P6a recorded one row per REQ; keep that shape
  (73 rows), with the bucket inherited per family row. **Recommendation:**
  adopt.
- **Q9 — Publication.** `npm run status` reports **15 unpushed commits** at
  session start (EV2). **Recommendation:** no push; publication stays
  user-authorized.

## Scope

**In scope.** Chunk P6b review of the ruleset-package layer and the host entry
points: §5.16 multi-ruleset build (tool namespacing, Novel ruleset binding,
ruleset-scoped gating, per-ruleset extraction isolation, host ruleset health,
cross-ruleset switching, suggest scoping, import rejection, codex annotation);
§5.17 ruleset packages (package format, install surface, TDQS conformance,
vendor certification, lazy hydration, scoped listing, description budget,
update preservation, publication integrity, editorial delta); §5.18 workflow
entry points (`build-ruleset`, `update`, `update-rulesets`, `migrate-user-data`,
deploy preservation, state location, deploy verification, package-format
fingerprint, source registry, package emitter, supplement provenance, build
replay, deterministic emission, update reconciliation, shipped update command,
startup reconciliation, stale-artifact notice, registry-published
distribution, action-discriminator budget); §5.21–§5.23 Fate, Ironsworn, and
Forged in the Dark base capabilities. Citation resolution for all 73 REQs.
Findings dispositioned. Roadmap trigger advanced. Register rows. Changelog
entry.

**Out of scope.** The world-model layer (§5.10/§5.11/§5.13/§5.15 — P6a,
closed); semantic index, corpus, and knowledge graph (P7); narrative cognition
(P8); user-data storage mechanics (§5.9/§5.19, closed by the seam pass and
chunk P4); badge/transport gating (P1, closed); the open remediation roadmap
items; publication.

**Row set (73 REQs / 50 family rows).** §5.16: 23 REQs / 9 rows; §5.17: 15 / 9;
§5.18: 25 / 22; §5.21: 4 / 4; §5.22: 3 / 3; §5.23: 3 / 3. A REQ outside this
set belongs to another chunk; record it there, not here. §5.19 and §5.20 sit
between the sections but are P4/P5 and are not in scope.

## Evidence base (this session)

| # | Evidence | Source | Trust |
|---|---|---|---|
| EV1 | `npm run check:fast` → exit 0, 37 passed / 0 failed, trailing line `check:fast: PASS` | tool output, this session | tool-output |
| EV2 | `npm run status`: version `2026.11.09`, 15 unpushed commits, 15 open roadmap items | tool output, this session | tool-output |
| EV3 | `git rev-parse --short HEAD` = `359e43f`; top commit is chunk P6a | `git log`, this session | repo |
| EV4 | §5.16 holds 23 REQs / 9 family rows; §5.17 15 / 9; §5.18 25 / 22; §5.21 4 / 4; §5.22 3 / 3; §5.23 3 / 3 = **73 REQs / 50 rows** | `spec/02-requirements.md`, `spec/audit/req-coverage.md`, counted this session | repo |
| EV5 | §5.16 buckets: `REQ-380` C; `379/381/382/383/384/385/386/387` E | `req-coverage.md:348-356` | repo |
| EV6 | §5.17 buckets: `389/430/432/390/391/392/393` C; `394/419` E | `req-coverage.md:358-363,388` | repo |
| EV7 | §5.18 buckets: `420/423/424/429/558/650/651/652` C; the remaining fourteen rows E; §5.21–§5.23 all ten rows C | `req-coverage.md:364-367,387-398,514-522,608-610,403-412` | repo |
| EV8 | `rulesets.ts` 684 lines: `APPENDIX_U_LICENSES` `:45`, `CORE_TOOL_GROUPS` `:66`, `computeContentHash` `:114`, `upgradeInstalledPackage` `:142`, `computeManifestSignature` `:214`, `rollDice` `:222`, `rulesetAnnotations` `:280`, `validateToolSchema` `:287`, `RulesetManager` `:341`, `hydrate` `:486`, `prefixMap` `:477`, `installedSlugs` `:409` | `wc -l`, `grep -n '^export'` | repo |
| EV9 | Surface layer: `core/surface-projection.ts` 167 lines (`projectToolList` `:147`, `SURFACE_GLOBALS` `:42`, `summarizeTool` `:117`), `core/surface-aliases.ts` 85 lines, `library.ts` 7 lines | `wc -l`, `grep -n '^export'` | repo |
| EV10 | `index.ts` anchors: `manage_ruleset` registration `:11179`, routing `:209`, `spec_health.ruleset_prefix_map` `:11963`, `ruleset_package_alerts` `:11966`, `tools/list` badge filter `:14678-14686`, `prompts/list` `:14734`, `resolve_fate` `:7457`, `resolve_ironsworn` `:7622`, `resolve_forged` `:7754`, `resolve_mechanic` `:7903` | `grep -n` | repo |
| EV11 | Host entry points: `scripts/build-ruleset.ts` 150 lines, `update.ts` 175, `update-rulesets.ts` 52, `migrate-user-data.ts` 123, `update-server.ts` 426, `check-ruleset-package.ts` 65, `check-ruleset-model.ts` 154, `lib/ruleset-registry.ts` 163 | `wc -l` | repo |
| EV12 | `build-ruleset` currently **records intake and prints the Build invocation; it does not invoke the emitter** (its own header states the limitation) | `scripts/build-ruleset.ts:1-12` | repo |
| EV13 | Fingerprint membership: `PACKAGE_SECTIONS` = §5.16, §5.17, §6.3, §6.4.2; `DATA_SECTIONS` includes §5.21–§5.23 but not §5.18 | `scripts/lib/contract-fingerprint.ts:27,37-43` | repo |
| EV14 | Carrying harnesses: `test-ruleset-gates.ts` 365 lines, `test-ruleset-nonovel.ts` 228, `test-update-workflow.ts` 378, `test-surface-guards.ts` 309, `test-tool-surface.ts` 500, `test-fate.ts` 181, `test-ironsworn.ts` 139, `test-forged.ts` 141 | `wc -l` | repo |
| EV15 | Citation-presence probe (test-ID grep over `holonovel/scripts`, **presence only, not exercise**): present — T441, T452–T456, T459–T460, T462, T498–T504, T510–T512, T517, T520–T529, T648–T649, T651, T653–T654, T689, T773–T776; absent — T440, T442–T447, T457–T458, T463–T467, T491–T492, T650, T656–T657 | `grep -rl` over `holonovel/scripts` | repo |
| EV16 | `check-registers --strict` requires every `REQ-NNN` in a `Scheduled-roadmap` row to appear literally in `ROADMAP.md` | `scripts/lib/register-checks.ts:64-68`; `npm run check-registers:strict` | repo |
| EV17 | The sweep worklist's P6b row is `scheduled` and names 73 REQs / 50 family rows (`worklist.md:257`); the last recorded decision is D70 (`worklist.md:239`) | `worklist.md` | repo |
| EV18 | `check-loop-artifacts` scans **every** directory under `docs/plans` and requires `plan.md`, `tasks.md`, `aar.md`, and a LOOP token | `scripts/lib/loop-artifacts.ts:24-70` | repo |
| EV19 | Gates carrying the chunk: `check-ruleset-package` (REQ-430), `check-ruleset-model` (REQ-559), `check-package-manifest` (REQ-614), `check-vendor-manifest`, `check-reference-server-cleanliness`, `test:ruleset-gates`, `test:ruleset-nonovel`, `test:update-workflow`, `test:tool-surface`, `test:surface-guards`, `test:fate`, `test:ironsworn`, `test:forged`; `test:package-smoke` is **not** in `check:fast` | `package.json`, gate manifest | repo |
| EV20 | Roadmap order: the sweep section is the first open P1 item; its trigger names chunk P6b on a closed run | `ROADMAP.md:15-24` | repo |
| EV21 | `test:all`'s `TESTS` array omits `test:ruleset-gates`, `test:ruleset-nonovel`, and `test:package-manifest`; it includes `test:update-workflow`, `test:persistence`, `test:tool-surface`, `test:surface-guards`, `test:fate`, `test:ironsworn`, and `test:forged` | `holonovel/scripts/run-test-suite.ts:25-81`, both `package.json` script tables | repo |

## The chunk's review surface — four clusters

Mapping check: every REQ has exactly one **owning** cluster, so the row set is
partitioned with no duplicate ownership. Clusters follow code ownership, not
section order, because §5.18 spans the package manager, the surface layer, and
the build scripts. A target file may appear in two clusters at a seam; the REQ
row is written once under its owner.

| Cluster | Surface | Code targets | Carrying evidence |
|---|---|---|---|
| **A** package format and manager | package manifest, content hash, package-format fingerprint comparison, install/remove/list, prefix map, lazy hydration, vendor license, TDQS schema gate, namespace derivation | `rulesets.ts:17-684`, `rulesetAnnotations`/`validateToolSchema`/`RulesetManager`; `scripts/check-ruleset-package.ts`, `scripts/check-ruleset-model.ts` | `test:ruleset-gates`, `check-ruleset-package`, `check-ruleset-model`, `check-vendor-manifest`, `check-reference-server-cleanliness` |
| **B** ruleset-scoped surface | tool namespacing, Novel binding and switching, ruleset gating, per-ruleset isolation, `spec_health` ruleset health and alerts, `run_command (action: suggest)` scoping, archive/codex ruleset validation, scoped `tools/list` + pagination + description budget, action-discriminator budget | `core/surface-{projection,aliases}.ts`, `index.ts:14678-14734` listing handlers, `:11963-11970` `spec_health`, `:11179` `manage_ruleset`, `:209` routing | `test:tool-surface`, `test:surface-guards`, `test:output-contracts`, `test:g7` |
| **C** host entry points and lifecycle | `build-ruleset` intake + source registry, package emission and replay, deterministic emission, supplement provenance, `update`/`update-rulesets`/`migrate-user-data`, startup reconciliation, stale-artifact health, deploy preservation and state location, deploy verification, publication integrity and delta classification, registry-published distribution | `scripts/build-ruleset.ts`, `update.ts`, `update-rulesets.ts`, `migrate-user-data.ts`, `update-server.ts`, `lib/ruleset-registry.ts`; `holonovel/src/core/state.ts:195` (`reconcileUserData`), `holonovel/src/index.ts:118-124` (startup reconciliation); `holonovel/server.json`; `holonovel/scripts/prepare-package.mjs`, `smoke-package.ts` | `test:update-workflow`, `test:persistence`, `test:package-manifest`, `check-package-manifest`, `check-fingerprint-sync`, `test:ruleset-nonovel`, `test:package-smoke` (publish-time only) |
| **D** base capabilities | Fate dice/aspects/points/stress, Ironsworn momentum/moves/progress, Forged action roll/stress/downtime: action contract, permission class, persistence, audit, reply shape | `index.ts:7457-7900` (`resolve_fate`, `resolve_ironsworn`, `resolve_forged`, `resolve_mechanic`), capability state on the Novel | `test:fate`, `test:ironsworn`, `test:forged` |

Ownership is disjoint and complete: **A** = §5.16 `REQ-379`, `382`; §5.17
`REQ-389`, `430`, `432`, `390`, `393` (7 rows). **B** = §5.16 `REQ-380`, `381`,
`383`–`387`; §5.17 `REQ-391`, `392`; §5.18 `REQ-429`, `558` (11 rows). **C** =
§5.17 `REQ-394`, `419`; §5.18 `REQ-394a`, `395`–`398`, `418`, `420`–`424`,
`428`, `556`, `557`, `560`, `561`, `563`, `564`, `650`–`652` (22 family rows;
`REQ-394a` is a sub-part of family row `REQ-394`). **D** =
§5.21–§5.23 (`REQ-434`–`443`, 10 rows). Sub-REQs inherit their family row's
owner.

## Steps

### Phase 0 — Baseline (no source edits)

1. Re-run `npm run check:fast` un-piped immediately before the review and
   record the exit status; run `npm run check` once so the full gate's baseline
   is measured rather than inherited. A red baseline is a P0 and is fixed first,
   as its own commit; if it cannot be fixed in-session, land per **Stopped-run
   landing** (red-baseline branch).
2. Run `npm --prefix holonovel run test:all`; record the per-harness summary and
   exit status. The suite covers `test:update-workflow`, `test:persistence`,
   `test:tool-surface`, `test:surface-guards`, `test:fate`, `test:ironsworn`,
   and `test:forged`. Run separately `npm run test:ruleset-gates`,
   `npm --prefix holonovel run test:ruleset-nonovel`, and
   `npm run test:package-manifest` — the suite's `TESTS` array does not include
   them (EV21). These ten commands are the **ruleset-path harnesses** re-run
   after any P0 fix that touches the package manager, the surface layer, the
   host entry points, or a capability handler.
3. Confirm `git status --porcelain` shows only this increment's untracked
   directory, record `git rev-parse --short HEAD`, and note that the cold-pass
   directory and the plan-gate sidecar live outside the repository (under
   `/tmp/opencode/` and `~/.local/state/opencode/plans/`) and are therefore
   absent from `git status`.
4. Confirm the artefact directory is trackable: `git check-ignore -v
   docs/plans/2026-11-09-full-review-p6b/` returns nothing.
5. Record Q1–Q9 and Q5a as **D71–D80** in the sweep `worklist.md` before review
   work starts (D70 is the last recorded; do not renumber). Decisions go in the
   worklist, not this file, so the stamped plan hash stays valid; if a decision
   departs from its recommendation, amend this plan and re-stamp instead.
6. Record the plan-gate evidence sidecar by running
   `node ~/.config/opencode/skills/plan-review/scripts/plan-gate.mjs preflight
   --project /home/fluke/Holonovel --plan
   docs/plans/2026-11-09-full-review-p6b/plan.md --target ROADMAP.md --target
   CHANGELOG.md --target spec/audit/review-register.md --target
   docs/plans/2026-11-09-full-review-sweep/worklist.md --req REQ-379a --req
   REQ-389a --req REQ-395a --req REQ-434`
   (repeat `--target` and `--req` once per path and REQ; the flags are not
   comma-lists).
7. Re-derive the row set (73 REQs across 50 family rows) and the bucket for
   each family from `spec/audit/req-coverage.md` (EV4–EV7). A verified mismatch
   is a plan defect: stop, amend this plan, run the standard-depth diff
   re-review over the amended text, and stamp only after that pass — never
   silently re-scope in the worklist and never re-stamp unreviewed amendments.
8. Record the plan-gate stamp and the cold-pass artifact path and hash in the
   AAR when the plan is approved, so the evidence trail names the reviewed
   artifact rather than an unbound file.

### Phase 1 — Code side (read-only review)

1. **Enumerate the surface**, recording `file:line` anchors in the worklist:
   every export of `rulesets.ts`; the `manage_ruleset` action branches and the
   `spec_health` builders; the `tools/list`/`resources/list`/`prompts/list`
   handlers; every host entry-point script's flag surface; and the
   `resolve_fate`/`resolve_ironsworn`/`resolve_forged`/`resolve_mechanic`
   branches. Enumeration confirms names; nothing is assumed from this plan.
2. **Review with `code-review`** (read-only, reached through
   `programming-orchestrator`) cluster by cluster: A package format/manager,
   B scoped surface, C host entry points, D base capabilities. Clusters are
   independent and may be reviewed in parallel; Phase 3 triage is the join
   point. Every finding cites the predicate (`file:line`), never a gate message.
3. **Verify the package contract**: `RulesetManifest` fields match REQ-389a;
   `computeContentHash` covers the canonical parts and excludes the build
   timestamp (REQ-561); `package_format` comparison holds a mismatched package
   inactive rather than dropping it (REQ-393/420); install/remove/list enforce
   slug uniqueness, dependency refusal, and installed-vs-loaded state
   (REQ-389c); `prefixMap` and `rulesetAnnotations` agree with `tools/list`
   (REQ-379c).
4. **Verify the scoped surface**: a Novel-bound call gates by ruleset
   independently of badge (REQ-381); no active Novel leaves the full surface
   callable (REQ-381c); default `tools/list` returns infrastructure plus the
   active ruleset (REQ-391a), with `scope=all` annotated rather than filtered;
   pagination and the description budget are real (REQ-391c/392);
   `spec_health.ruleset_health` and `ruleset_package_alerts` carry the stated
   fields and are badge-filtered (REQ-383, REQ-393, REQ-430).
5. **Verify the host entry points**: `build-ruleset` records intake into the
   source registry and invokes or names the emitter per its own contract
   (REQ-395a, REQ-421); `update` defaults to a dry run and reconciles both tiers
   (REQ-395c); `update-rulesets` remains the compatibility reporter (REQ-422);
   `migrate-user-data` defaults to a dry run and leaves a failed migration
   unchanged (REQ-424); startup reconciliation honors `TTRPG_AUTO_MIGRATE`
   (REQ-651); deploy preservation and state location match REQ-396/397; the
   shipped `update` command runs from compiled code (REQ-650).
6. **Verify the capability actions**: each `resolve_mechanic` action's
   parameters, permission class (GM-only vs any badge), persistence, audit
   event, refusal path, and reply shape match its REQ (REQ-434–443); a Fate
   point or stress operation that persists without an audit is a finding; a
   capability whose action name or shape differs from the REQ is a finding.
7. **Check each assertion against the behaviour it claims**: open every cited
   harness and confirm the body exercises the contract. A passing harness
   asserting something narrower is a finding. Zero-padded title tokens (`T0nn`)
   are shadowing, not evidence (F-P2-4). EV15 is a presence probe only and is
   not evidence of exercise.
8. **Record one verdict per REQ** (73 rows, done bar 2) and one row per
   reviewed behaviour (done bar 3), plus one **cluster verdict row** per cluster
   A–D (done bar 6). Phase 1 verdicts are provisional until Phase 2 completes.

### Phase 2 — Spec side (citation resolution)

1. Apply the reproducible method (Q6): each REQ's own `*Check:*` IDs; a REQ with
   no own Check inherits its family's citation set; an `Automated` citation must
   appear literally in a `holonovel/scripts` harness **and** its body must
   exercise the stated behaviour; `Manual`, `Gate`, and scenario citations need
   none. Bucket from the base family row per Q4.
2. Classify citation *kind* before counting a missing harness: a scenario
   citation needs no harness; an `Automated` token with no harness is a finding.
3. A REQ whose cited test does not exercise the stated behaviour is a finding.
   `npm run check:conformance -- --dedicated` over-flags on this corpus
   (AGENTS.md), so its output is evidence to inspect, never a finding by itself.
4. Fill the bucket and verdict columns for all 73 rows. Bucket-E REQs
   (§5.16/§5.17/§5.18 builder-side rows) are `builder-side` unless the server
   runtime or a host entry point emits their statement; a build-side or
   entry-point gap that the owning REQ requires is a finding, not an automatic
   `builder-side` pass. §5.18's entry-point REQs are executable scripts in this
   repository, so "builder-side" does not excuse an absent implementation.

### Phase 3 — Triage, registers, roadmap, artefacts

1. **Triage** every finding per Q2. Guardrails for a P0 fix:
   - A fix in the package manager or surface layer runs the ten ruleset-path
     harnesses (Phase 0.2) plus `test:all`.
   - A fix that changes an action's parameters or output first runs a
     sibling-contract check: grep the REQ corpus for other REQs naming the same
     `tool (action: X)` and confirm no sibling contract conflicts (notably
     `manage_ruleset (action: …)`, `resolve_mechanic (action: …)`,
     `manage_novel (action: switch)`, and `update`/`build-ruleset`).
   - A fix that amends a REQ body complies with Appendix M (one paragraph, no
     tables/bullets/steps, 800-char and 8-sentence caps);
     `npm run validate --sdd-strict` is the check.
   - A fix that edits a **§5.16/§5.17** REQ body: `npm run assemble`, `npm run
     build-order` (regenerates the package-format fingerprint and runs
     `check-fingerprint-sync`), then `npm run validate -- --write-register`;
     state in the changelog that installed packages report
     `[package-incompatible]` until rebuilt.
   - A fix that edits a **§5.21–§5.23** REQ body: `npm run assemble`, `npm run
     build-order` (regenerates the data-format fingerprint), then `npm run
     validate -- --write-register`; state the `[data-stale]` consequence.
   - A fix that edits only a **§5.18** REQ body: `npm run assemble`, then
     `npm run validate -- --write-register`; no fingerprint regeneration (Q7).
   - A fix that edits a tool definition re-runs the generator and the surface
     gates (`npm run build-order`); `check-tool-definitions-sync` fails on a
     stale `tool-definitions.json`; `test:tool-surface`, `test:surface-guards`,
     `check-tool-surface`, `surface-budget`, and `action-conflicts` must pass.
   - A fix to a package manifest or license field re-runs `check-vendor-manifest`
     and `check-reference-server-cleanliness`.
   - A fix to the emitted package re-runs `check-ruleset-package`,
     `check-ruleset-model`, and `test:ruleset-nonovel`; `test:package-smoke`
     stays a publish-time check (not required here).
2. **`spec/audit/review-register.md`**: one dated heading per used disposition
   section, rows per **Register write-back** below.
3. **`ROADMAP.md`**: keep the sweep item's 1–3 bullet + `**Trigger:**` shape
   (`check-roadmap` rejects any other) and update it to:
   - bullet 1 — chunk P7 (determinism and knowledge: §5.2, §5.7, §5.8, §5.14,
     §5.28–§5.30);
   - bullet 2 — chunk P8 (narrative cognition) and the closing M1
     machine-evidence re-run over the post-P8 tree, covering
     `check:conformance`, `fmea`, and `graph-deps`, plus the retained scope
     clause ("Scope is §5.1–§5.35 except §5.9 and §5.19; §5.6 and chunks P4,
     P5, P6a, P6b are closed");
   - trigger — chunk P7 on a closed run; on a halt, the P0 fix or the chunk
     P6b resume instead.
   When triage produces scheduled findings, **also** add remediation
   section(s) in groups of 1–3 bullets split by theme, because `check-roadmap`
   admits at most three bullets per section and `check-registers:strict`
   requires every REQ in a `Scheduled-roadmap` row to appear literally in
   `ROADMAP.md` (EV16). Every bullet names its finding's `REQ-NNN` IDs,
   including lowercase suffixes, and every remediation section carries a
   `**Trigger:**` line ("closes when the finding is `Resolved`"). When triage
   produces none, add no second section.
4. **`CHANGELOG.md`**: one dated heading
   `<YYYY-MM-DD> — Full-review sweep: chunk P6b (ruleset packages and host
   entry points)`. The date equals the current CalVer date written with hyphens
   (`2026.11.09` → `2026-11-09`); verify at execution.
5. **Artefacts**: tick the completed items in `tasks.md`, replace the
   provisional `aar.md` with the execution record and the token the outcome
   earns, and update the sweep worklist's status table (P6b closed-or-halted;
   P7 remains `scheduled`).

## Register write-back

| Disposition | Section | Row shape |
|---|---|---|
| `Resolved` | first `## Resolved` block (`review-register.md:12`), newest-first | `### <date> full-review sweep — chunk P6b`; bullet `**F-P6b-N — <title> (resolved <YYYY-MM-DD>):**` + predicate + the REQ IDs it covers + fix location + the assertion that now covers it (or `no new assertion`) |
| `Scheduled-roadmap` | `## Scheduled-roadmap` | same heading; bullet names the finding, the predicate, the REQ IDs it covers (including lowercase suffixes), and the `ROADMAP.md` section it is scheduled under, plus the date; each cited `REQ-NNN` also appears literally in that `ROADMAP.md` section |
| `Closed-P3` | `## Closed-P3 (recorded, no action)` | same heading; bullet records the predicate, the REQ IDs, and why no action follows |
| `Deferred-by-user` | `## Deferred-by-user` | only on an explicit user deferral; names the decision |

A finding scheduled against a later sweep chunk writes both the register row and
the chunk reference in the sweep `worklist.md` **and** its exact `REQ-NNN`
tokens in a `ROADMAP.md` remediation bullet. P6b does not retire a register row
owned by another chunk, so no cross-referencing register is updated beyond the
sweep worklist's status row and the roadmap trigger.

## Stopped-run landing

If a P0 cannot be fixed within the session, the run halts and still lands as a
record:

1. `worklist.md` marks chunk P6b `halted on <finding ID>` and keeps the partial
   tables.
2. `ROADMAP.md` gains an additional section for the P0: heading
   `## <finding ID> — <title> (P0)`, 1–3 bullets naming the predicate, the
   reproduction, and the finding's `REQ-NNN` IDs, and a `**Trigger:**` line;
   the admission rule and the strict REQ-literal rule both apply.
3. `CHANGELOG.md` heading reads
   `<date> — Full-review sweep: chunk P6b (halted on <finding ID>)`.
4. `spec/audit/review-register.md` carries the unfixed P0 as a
   `Scheduled-roadmap` row whose matching `ROADMAP.md` entry is the P0 section
   from step 2. A baseline P0 is a gate defect, not a review finding, so it gets
   no register row; record it in the AAR only.
5. `aar.md` ends `LOOP OPEN` naming the P0 row; gates still run. Green is
   required for whatever landed **except** the red-baseline branch below.
6. The roadmap scope clause records "chunk P6b halted", never "closed".
7. No push. The P0 is the next session's first item, ahead of chunk P7.

**Red-baseline branch.** When the unfixable P0 is the baseline itself (Phase 0's
`npm run check` or a server harness is red and cannot be fixed in-session):

1. `aar.md` records the red gate output verbatim and ends `LOOP OPEN` naming the
   red gate; `worklist.md` status reads `halted — red baseline`.
2. `ROADMAP.md` gains a heading `## Baseline red — <gate> (halted)` (no finding
   ID, because a gate defect is not a review finding), 1–3 bullets naming the
   failing command and its first failing assertion, and a `**Trigger:**` line
   naming the baseline fix. No `Scheduled-roadmap` row exists, so the
   REQ-literal rule does not apply.
3. No `CHANGELOG.md` entry is written: a red baseline produces no semantic
   change, and the AAR is the record.
4. Stage only the planning record — `git add
   docs/plans/2026-11-09-full-review-p6b/
   docs/plans/2026-11-09-full-review-sweep/worklist.md ROADMAP.md` — never
   `git add -A`.
5. Commit **manually** with the dated subject
   `<YYYY-MM-DD> — Full-review sweep: chunk P6b (baseline red, halted)`. The
   pre-commit hook cannot pass on a tree that is red by construction, so this
   commit is made with `git commit --no-verify`; the AAR records the bypass and
   its reason. The run does **not** claim green gates; `session:close` is not
   used on this branch.
6. The sweep section's `**Trigger:**` is amended to name the baseline fix.

**Time-boxed landing (ran out of time, no P0).** When the session ends with
review work unfinished but every gate green and no open P0, the increment lands
as a partial record — it is neither a P0 halt nor a red baseline:

1. `worklist.md` marks chunk P6b `partial — family rows n/50, REQ rows m/73`
   and keeps the tables as far as they were completed; the remaining rows stay
   `pending`, never `holds`.
2. `aar.md` ends `LOOP OPEN` naming the unfinished row range; it records which
   clusters closed and which did not.
3. `CHANGELOG.md` heading reads
   `<date> — Full-review sweep: chunk P6b (partial — family rows n/50, REQ rows
   m/73)`.
4. `ROADMAP.md` keeps the sweep section's shape and its `**Trigger:**` names
   "resume chunk P6b at the first pending row"; on this branch the trigger is
   **not** advanced to P7.
5. Gates still run and must be green for whatever landed; no-P0 findings found
   so far are dispositioned exactly as on a closed run. No push.

## Blast radius

| File | Change | Size |
|---|---|---|
| `docs/plans/2026-11-09-full-review-p6b/{plan,tasks,aar}.md` | this increment's artefacts | M |
| `docs/plans/2026-11-09-full-review-sweep/worklist.md` | chunk P6b section: 73-REQ table, behaviour table, cluster table, D71–D80, status rows | M |
| `spec/audit/review-register.md` | P6b finding rows (one dated subsection per used disposition) | S–M |
| `ROADMAP.md` | sweep bullets re-scoped to P7 and P8/M1 with the scope clause retained; trigger advanced to P7 on a closed run (unchanged on a halt or time-boxed landing); remediation section(s) only when triage schedules findings; extra P0 section only on a halted run | S |
| `CHANGELOG.md` | dated heading + bullets | S |
| `holonovel/src/rulesets.ts` | only if a P0 fix lands (named at that time) | S–M |
| `holonovel/src/index.ts`, `core/surface-{projection,aliases}.ts`, `core/state.ts`, `library.ts` | only if a P0 fix lands in the manager, surface, capability, or reconciliation handlers | S–M |
| `scripts/{build-ruleset,update,update-rulesets,migrate-user-data,update-server}.ts`, `scripts/lib/ruleset-registry.ts` | only if a P0 fix lands in a host entry point | S–M |
| `holonovel/server.json` | only if a P0 fix changes the registry manifest (REQ-428) | S |
| `holonovel/scripts/{prepare-package.mjs,smoke-package.ts}` | only if a P0 fix changes package staging or the packed smoke path | S |
| `holonovel/scripts/{test-ruleset-gates,test-ruleset-nonovel,test-update-workflow,test-tool-surface,test-surface-guards,test-fate,test-ironsworn,test-forged,test-package-manifest,test-persistence}.ts` | only if a P0 fix needs an assertion | S |
| `holonovel/src/generated/contract-fingerprints.ts` | regenerated by `build-order` only when a §5.16/§5.17 or §5.21–§5.23 REQ body changes (never hand-edited) | — |
| `scripts/lib/contract-fingerprint.ts` | only if a P0 fix corrects a fingerprint-membership defect (named at that time) | S |
| `holonovel/tool-definitions.json` | regenerated only when a P0 fix edits a tool definition | — |
| `spec/**` + `holonovel.md` | only if a P0 fix amends a REQ (then `assemble` + register refresh, and `build-order` for the fingerprinted sections) | S–M |
| `spec/audit/req-coverage.md` | refreshed by `npm run validate -- --write-register` when a REQ body changes | S |
| package manifest / version-sync files (`holonovel/package.json`, `package-lock.json`, `server.json`, `AGENTS.md`, `DECISIONS.md` header, version constant) | advanced by `build-order` version sync | — |

## Considered and rejected

- **Splitting P6b into package half and capability half.** Rejected for now:
  73 REQs / 50 rows is under P6a's 107-row session and D61 already assigns the
  whole surface to P6b; the time-boxed landing covers an overrun without a
  second plan.
- **Reviewing the semantic index behind `manage_ruleset (action: search)`.**
  Rejected: P7 owns `core/semantic.ts`; a lookup path that violates no §5.16
  isolation predicate is `deferred:P7`.
- **Treating §5.18's entry-point REQs as `builder-side` passes.** Rejected: the
  entry points are executable scripts in this repository, so an absent or
  partial entry point is a finding against the owning REQ.
- **Editing a REQ body to match the implementation during review.** Rejected:
  the review judges the implementation against the spec; a spec amendment is a
  P0-fix action only when the spec itself is demonstrably defective, recorded
  in the AAR.
- **Writing a harness for every unreachable branch.** Rejected: an unreachable
  branch with no assertion is a citation-gap finding; writing harnesses for
  every branch is remediation, not review.
- **Chasing every finding.** Rejected: P1/P2/P3 findings are scheduled or
  closed; only a P0 blocks the chunk's close.
- **Recording P7/P8 predicates as `finding:` rows.** Rejected: a boundary is
  not a defect in this chunk's surface; `deferred:<chunk>` keeps the verdict
  vocabulary mechanical.

## Verification

| Check | Command | Expected |
|---|---|---|
| Assembly | `npm run assemble` | exit 0 |
| Fast gate | `npm run check:fast` (un-piped) | 37/37 (or the new total if a P0 fix adds a harness), `check:fast: PASS` |
| Full gate | `npm run check` | 0 errors |
| Server harnesses | `npm --prefix holonovel run test:all` | exit 0, record per-harness summary |
| Package gates | `npm run check-ruleset-package -- <install-dir>/<slug>`, `npm run check-ruleset-model -- <install-dir>/<slug>` | pass when a package is emitted/changed; the directory is the install-directory package folder (scratch `TTRPG_DATA_DIR` for probes) |
| Package manifest | `npm run check-package-manifest`, `npm run test:package-manifest` | pass |
| Vendor manifest | `npm run check-vendor-manifest` | pass after any license/manifest change |
| Surface gates | `npm run check-tool-surface`, `npm run surface-budget`, `npm run action-conflicts -- --check` | pass after any tool-surface change |
| Fingerprint sync | `npm run check-fingerprint-sync` | pass; regeneration only when a §5.16/§5.17 or §5.21–§5.23 body changed |
| Roadmap admission | `npm run check-roadmap` | pass after the roadmap edit |
| Register cross-refs | `npm run check-registers:strict` | pass |
| Loop artefacts | `npm run check-loop-artifacts` | pass, LOOP token present |
| Coverage register | `npm run validate -- --write-register` | only when a REQ body changed |
| REQ shape (conditional) | `npm run validate --sdd-strict` | only when a P0 fix amends a REQ body; 0 shape errors |
| Version sync (conditional) | `npm run build-order` | 0 errors |
| Machine evidence | `npm run check:conformance` | exit 0; record the summary |

## Risks and rollback

- **73 REQs across four code surfaces can exceed one session.** Mitigation: P6a
  finished 107 rows; if this run does not, land per **Time-boxed landing** with
  the partial table intact and the trigger pointing at the first pending row.
- **A P0 discovered late can exceed the session.** Mitigation: stop, record,
  land; the plan's bar is not met and that is the correct outcome.
- **Fingerprint blast from a REQ-body edit.** Mitigation: prefer no body edit;
  when one is required, run `build-order` and record in the changelog the
  `[package-incompatible]` / `[data-stale]` consequence (Q7/EV13).
- **False citation holds.** Mitigation: open every cited harness; EV15 is a
  presence probe only. `T0nn` shadowing (F-P2-4) is a known source.
- **Entry-point tests mutate user state.** Mitigation: probes use scratch data
  directories (`TTRPG_DATA_DIR`) and never the default state directory.
- **Gate-pinned values.** The changelog date is the CalVer date;
  `session:close` derives the commit subject from the top CHANGELOG heading.
- **Draft artefact breaks a gate mid-session.** `check-loop-artifacts` requires
  plan, tasks, and a LOOP token in every `docs/plans` directory (EV18); all
  three exist from the drafting step.
- **No destructive operations, no push.** Every change is a reversible edit or
  an added artefact; rollback cost 1 (one `git revert`) when there is no C0, or
  2 when a baseline fix landed first.

## Commit order and gates

| # | Commit | Scope | Gate before commit |
|---|---|---|---|
| C0 (conditional) | Restore a green baseline | only if Phase 0's `npm run check` or a server harness is red — that baseline fix alone, committed **manually** with a dated subject `YYYY-MM-DD — Restore green baseline (<gate>)`; `session:close` is used for C1 only, and the AAR records the deviation | `check:fast`, `check`, plus the red server harness re-run |
| C1 | Full-review sweep: chunk P6b (ruleset packages and host entry points) | plan/tasks/AAR, worklist chunk-P6b tables and status, register rows, ROADMAP.md, CHANGELOG.md, any review P0 fix | `assemble`, `check:fast`, `check`, `check-roadmap`, `check-registers:strict`, `check-loop-artifacts`, `npm --prefix holonovel run test:all`, `npm --prefix holonovel run test:ruleset-nonovel`, plus `build-order`/`check-fingerprint-sync` if a REQ body in §5.16/§5.17/§5.21–§5.23 changed and `validate -- --write-register` if any REQ body changed |

C1 is one commit (spec increment); C0 exists only when the baseline is red and
lands first. Publication is not part of this increment.

## User impact

None to runtime behaviour unless a P0 fix lands. The increment changes review
records, the roadmap trigger (advanced to chunk P7 on a closed run), and the
changelog; chunk P8 and the closing M1 re-run stay scheduled. A REQ-body edit in
a fingerprinted section would make installed packages or persisted artifacts
report stale until rebuilt/migrated, which the changelog states.

## Evidence

- Review artefact: this file; tracker:
  `docs/plans/2026-11-09-full-review-sweep/worklist.md`.
- Finding predicates: recorded per finding in `review-register.md`.
- Baseline: EV1–EV20 above (repo and tool-output sources).
- No external sources; no user-supplied content drives an instruction.
