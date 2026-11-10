# Plan — Unscoped-surface review program

**Status:** draft, awaiting user approval · **Date:** 2026-11-10 · **Depth:** standard
**Review independence:** self (cold pass pending) · **Rollback cost:** 1 (pure-add plus one ROADMAP section)
**Roadmap item:** `ROADMAP.md` § Unscoped-surface review sweep (P2)

## Done bar

**Done bar:** this increment only — the review program is eight later sessions.

1. This directory holds `plan.md`, `tasks.md`, `worklist.md`, and `aar.md`.
2. `worklist.md` enumerates chunks **U1–U8**, each with its spec/appendix
   targets, code or asset targets, review lens, existing gates, and exit
   evidence, plus a mapping invariant: every surface the 2026-11-09 full-review
   sweep did not cover is assigned exactly once, and every surface it did cover
   is listed as an exclusion with the authority that scoped it.
3. `worklist.md` records the scope inventory: the sweep's own scope statement
   (`docs/plans/2026-11-09-full-review-sweep/worklist.md:21-23,313-336`) and the
   complement measured against the current tree, with `file:line` anchors.
4. `ROADMAP.md` carries one new section in admission-rule shape (1–3 bullets and
   one `**Trigger:**`) naming the chunk series and the next session's chunk.
5. These exit 0 un-piped: `npm run check-roadmap`, `npm run check-registers`,
   `npm run typecheck`. `npm run check-loop-artifacts` reports this increment
   clean but exits 1 for the open increment
   `2026-11-10-5-21-5-23-capability-remediation: missing aar.md`; the output
   names no finding in this directory.
6. `npm run check:fast` is recorded with the same pre-existing failure. This
   increment does not claim a green fast gate until that open increment closes.
7. No `spec/`, `holonovel/src/`, or `holonovel/scripts/` file changes; no
   fingerprint regeneration; no push.

## Scope

**In scope.** The complement of the 2026-11-09 full-review sweep, assigned to
eight chunks; the durable `worklist.md` tracker; the roadmap section.

**Out of scope.** Executing any chunk U1–U8; the sweep's own surfaces (§5.1–§5.8,
§5.10–§5.18, §5.20–§5.35); §5.9 and §5.19 (closed by the 2026-11-09 seam pass);
publication; version release notes.

## Evidence base (this session)

| # | Evidence | Source | Trust |
|---|---|---|---|
| EV1 | The sweep scoped §5.1–§5.35 minus §5.9/§5.19, eight code chunks plus a machine-evidence pass, and `docs/engine-contract.md` §2–§6 | `docs/plans/2026-11-09-full-review-sweep/worklist.md:21-23,313-336` | repo |
| EV2 | The sweep's plan names publication and version notes as out of scope | `docs/plans/2026-11-09-full-review-sweep/plan.md:66-73` | repo |
| EV3 | `spec/` has §1–§4, §6–§11 outside §5, Appendices A–Z, and a `spec/audit/` register/report tree | `spec/02-requirements.md`; `spec/0*.md`; `spec/appendices-*.md`; `ls spec/audit` | repo |
| EV4 | `docs/engine-contract.md` has ten numbered sections plus an appendix; P5 covered §2–§6 only | `docs/engine-contract.md:24-313`; worklist `:182-184` | repo |
| EV5 | Root `scripts/` holds 62 top-level TypeScript gate/build/entry scripts; `.githooks/` three hooks; `.github/workflows/` two workflows | `ls scripts`, `find scripts -maxdepth 1 -name '*.ts'`, `ls .githooks`, `ls .github/workflows` | tool-output |
| EV6 | Uncovered assets: `holonovel/narrative_world_model/` 124 K, `holonovel/content/` 456 K, `holonovel/schemas/` 28 K, `holonovel/testdata/` 40 K, `docs/upstream/` 8 K, `docs/licenses/` 12 K | `du -sh` | tool-output |
| EV7 | The seam pass closed `docs/engine-contract.md` and §5.9/§5.19 | `spec/audit/review-register.md:358-395` | repo |
| EV8 | `check:fast` 39/40 PASS with one pre-existing failure, `2026-11-10-5-21-5-23-capability-remediation: missing aar.md` | `/tmp/opencode/check-fast-baseline.log:48-59` | tool-output |
| EV9 | 41 commits are unpushed; 16 roadmap items are open | `npm run status` output, this session | tool-output |
| EV10 | `check-loop-artifacts` requires every `docs/plans/<dir>` to carry plan/tasks/AAR and a LOOP token | `scripts/lib/loop-artifacts.ts:55-90` | repo |

## Program (recorded here; executed one chunk per session)

Each chunk pairs a prose surface with the code, asset, or gate that implements
it, so drift is visible in one pass. Full targets live in `worklist.md`.

| Chunk | Prose surface | Code / asset surface | Primary lens |
|---|---|---|---|
| **U1** | §1–§4, Appendix A, Appendix M | `scripts/validate.ts`, `scripts/lib/req-checks.ts`, `scripts/check-guarded-rule-change.ts` | constitution rule ↔ enforcing check |
| **U2** | §6, `spec/build-phase-map.md` | `scripts/assemble.ts`, `scripts/build-order.ts`, `scripts/spec-update-record.ts`, `scripts/update.ts`, `scripts/version-bump.ts`, `.githooks/*` | build prose ↔ tooling |
| **U3** | §7, `docs/engine-contract.md` §1 and §7–§10 + appendix | `holonovel/src/core/server.ts`, `src/rulesets.ts`, `src/tool-registry.ts`, `src/core/surface-projection.ts`, `src/world/*` | runtime prose ↔ code |
| **U4** | §8 | `scripts/check-*.ts`, `scripts/test-*.ts`, `holonovel/scripts/run-test-suite.ts`, `.github/workflows/ci.yml` | gate prose ↔ gate reality |
| **U5** | §9, §10, Appendix V | `scripts/publish/*`, `scripts/push-pipeline.sh`, `scripts/weekly.ts`, `loop-audit.ts`, `.github/workflows/publish.yml`, `docs/publish-pipeline.md`, `docs/workflow-cadence.md` | process prose ↔ pipeline |
| **U6** | §11, Appendices B, C, N, W–Z | `holonovel/scripts/fixtures/*`, `holonovel/testdata/*`, `playability.ts`, `holosuite.ts` | fixture ↔ expectation |
| **U7** | Appendices D–L, O–T, U | `tool-*.json`, `holonovel/schemas/*`, `server.json`, `glama.json`, `docs/licenses/ATTRIBUTION.md` | catalog ↔ live artifact |
| **U8** | (repo prose: README, AGENTS, SECURITY, CHANGELOG, ROADMAP) | `holonovel/narrative_world_model/`, `holonovel/content/`, `docs/upstream/`, `holonovel/Dockerfile`, root `package.json` | governance and content |

**Mapping invariant.** Every appendix is assigned once: A and M → U1; B, C, N,
W, X, Y, Z → U6; D–L, O–T, U → U7; V → U5. Every spec section outside §5 is
assigned once: §1–§4 → U1; §6 → U2; §7 → U3; §8 → U4; §9–§10 → U5; §11 → U6.
The engine contract's §2–§6 stay with sweep chunk P5; its §1 and §7–§10 move to
U3. Verify with `grep -n '^## Appendix\|^### 5\.\|^## [0-9]' spec/*.md` before
starting any chunk.

## Per-chunk method (the sweep's method, reused)

1. Enumerate the surface with `file:line` anchors before reviewing.
2. Run the named lens; every finding carries an ID, a predicate, a P-severity,
   and a terminal disposition.
3. One verdict row per spec subsection or appendix: `holds`,
   `finding:<ID>`, or `builder-side`.
4. Exit from a chunk only when its findings are dispositioned in
   `spec/audit/review-register.md` and its exit evidence is recorded in
   `worklist.md`.
5. Fix policy unchanged: P0 in-session (bounded), P1 scheduled on `ROADMAP.md`,
   P2 only with a demonstrated failure, P3 record-and-close.

## Steps

### Phase 0 — Inventory and worklist (this session)

1. Record EV1–EV10 in this file.
2. Measure the complement: list every top-level surface and mark it `swept`,
   `seam-closed`, or `unscoped` with the scope authority. Write the result into
   `worklist.md` as the scope inventory.
3. Write `worklist.md`: the mapping invariant above, one section per chunk
   (targets, lens, existing gates, exit evidence), and decisions D1–D6.
4. Write `tasks.md` as the execution checklist for this session only.

### Phase 1 — Roadmap (this session)

1. Insert one `## Unscoped-surface review sweep (P2)` section after the last P1
   remediation section and before `## Harness test-ID label hygiene (P2)`.
2. Shape it to the admission rule: three bullets grouping U1–U2, U3–U5, U6–U8,
   and one `**Trigger:**` naming U1 as the next session.
3. Run `npm run check-roadmap` un-piped.

### Phase 2 — Review, registers, gates (this session)

1. Write `aar.md` with the outcome token the evidence earns.
2. Run the four named gates; record un-piped exit codes.
3. Record the pre-existing `check:fast` failure; do not fix another session's
   open increment.

### Later sessions — chunks U1–U8

Each chunk is its own session and its own increment directory
`docs/plans/<date>-unscoped-<chunk>/`, reusing this file as the program record.
A chunk's plan repeats the done bar from `worklist.md` § `<chunk>`; it does not
restate the inventory.

## Verification

| Check | Command | Expected |
|---|---|---|
| Roadmap admission | `npm run check-roadmap` | exit 0 |
| Register cross-refs | `npm run check-registers` | exit 0 |
| Loop artifacts | `npm run check-loop-artifacts` | exit 0 after this directory is complete |
| Type check | `npm run typecheck` | exit 0 |
| Fast gate | `npm run check:fast` | recorded; one known pre-existing failure (EV8) |

## Blast radius

| File | Change | Size |
|---|---|---|
| `docs/plans/2026-11-10-unscoped-surface-review/{plan,tasks,worklist,aar}.md` | new increment record | M |
| `ROADMAP.md` | one new P2 section | S |
| `CHANGELOG.md` | dated heading if the increment is committed | S |

No `spec/` file, no server source, no generated artifact, no fingerprint.

## Considered and rejected

- **One "review the docs" session.** Rejected: ten prose sections plus
  twenty-six appendices plus tooling and vendored assets is not one
  session-achievable bar, and the sweep's own experience shows review attention
  degrades past a chunk.
- **Chunking by file.** Rejected: `spec/appendices-reference.md` alone spans
  eleven appendices with unrelated owners; a prose surface plus its implementing
  artifact is the unit that makes drift visible.
- **Treating the unscoped content as a demonstrated defect.** Rejected: nothing
  here is a confirmed failure. The program is coverage work, hence P2, not P1.
- **Re-running the §5 sweep to "cover everything".** Rejected: §5.1–§5.35 and
  §5.9/§5.19 are already dispositioned; re-reviewing them would spend the
  session on the one surface that has evidence.

## Risks and rollback

- **Scope creep into fixing.** The worklist fence: a finding outside a chunk's
  surface is recorded and scheduled, never chased.
- **A chunk turns out larger than a session.** The chunk closes when its
  inventory is complete and findings dispositioned; a sub-split is recorded in
  `worklist.md` the way the sweep split P3/P6/P7.
- **False findings from prose that describes the builder, not the server.**
  Bucket the row `builder-side` and move on; the sweep's bucket vocabulary is
  reused.
- **No destructive operations, no push.** Rollback is a single `git revert`.

## Commit order and gates

| # | Commit | Scope | Gate before commit |
|---|---|---|---|
| C1 | Unscoped-surface review program and roadmap | this directory plus `ROADMAP.md` | `check-roadmap`, `check-registers`, `check-loop-artifacts`, `typecheck` |

C1 is one commit. Publication is not part of this increment.

## User impact

None at runtime. The repository gains a review program and one roadmap entry.
The unscoped content itself is untouched.

## Evidence

- Scope authority: `docs/plans/2026-11-09-full-review-sweep/worklist.md:21-23,313-336`;
  `.../plan.md:66-73`; `spec/audit/review-register.md:358-395`.
- Inventory: `worklist.md` § Scope inventory.
- Baseline: EV1–EV10 above.
