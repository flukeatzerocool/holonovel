# Worklist — unscoped-surface review program

Cross-session tracker for the complement of the 2026-11-09 full-review sweep.
One row per chunk. A chunk closes only when its findings are dispositioned in
`spec/audit/review-register.md` and its exit evidence is recorded here.

Bootstrap: `plan.md` (2026-11-10). Update this file at each chunk close; do not
restart the enumeration from scratch.

## Decisions (2026-11-10, user-approved at drafting)

- **D1 — Scope.** The program covers exactly the surfaces the 2026-11-09 sweep
  did not: spec §1–§4 and §6–§11, Appendices A–Z, `spec/audit/**`,
  `docs/engine-contract.md` §1 and §7–§10, root `scripts/`, `.githooks/`,
  `.github/workflows/`, the repo governance docs (including
  `holonovel/{AGENTS,README,DECISIONS,NOTICE}.md` and `holonovel/Dockerfile`),
  and the server's vendored and content assets. The sweep's scope is
  `docs/plans/2026-11-09-full-review-sweep/worklist.md:21-23,313-336`.
- **D2 — Exclusions stay excluded.** §5.1–§5.8, §5.10–§5.18, §5.20–§5.35 were
  swept; §5.9/§5.19 and the engine contract were seam-closed
  (`spec/audit/review-register.md:358-395`). The engine contract's §2–§6 were
  read in sweep chunk P5. A chunk that touches one of these records
  `already-reviewed:*` and moves on.
- **D3 — Fix policy.** P0 in-session (bounded) · P1 scheduled on `ROADMAP.md` ·
  P2 only with a demonstrated failure · P3 record-and-close.
- **D4 — Verdict vocabulary.** One row per spec subsection or appendix:
  `holds`, `finding:<ID>`, `builder-side`, or `already-reviewed:<chunk>`. A
  chunk's aggregate is worst-of under
  `finding` > `builder-side` > `deferred` > `holds`.
- **D5 — Lens per surface type.** Prose that states a contract → `drift-report`
  against the code/gate that implements it. Code → `code-review`. Catalog
  appendices → artifact comparison. Fixtures → harness-exercise check. A
  builder-side appendix (M, S, O) is reviewed as prose only.
- **D6 — Chunking.** Eight chunks, each pairing a prose surface with the
  artifact that implements it. A chunk that proves larger than one session
  splits in `worklist.md` with a family-atomic fence, as the sweep split
  P3/P6/P7.
- **D7 — Baseline.** `check:fast` 39/40 PASS; the only failure is the open
  increment `2026-11-10-5-21-5-23-capability-remediation` missing `aar.md`
  (EV8). This program does not write another increment's AAR.
- **D8 — No push.** 41 commits unpushed at session start; publication stays
  user-authorized.

## Scope inventory (measured 2026-11-10)

Every surface in the tree, with the authority that scoped it. `swept` = inside
the 2026-11-09 sweep; `seam` = closed by the 2026-11-09 seam pass;
`unscoped` = this program.

| Surface | Status | Authority / chunk |
|---|---|---|
| `spec/02-requirements.md` §5.1–§5.8, §5.10–§5.18, §5.20–§5.35 | swept | sweep worklist `:21-23,313-336` |
| `spec/02-requirements.md` §5.9, §5.19 | seam | review register `:358-395`; sweep P4 code-side |
| `spec/01-foundations.md` §1–§3 | unscoped | U1 |
| `spec/01a-constitution.md` §4 | unscoped | U1 |
| `spec/03-build.md` §6 + `spec/build-phase-map.md` | unscoped | U2 |
| `spec/04-runtime.md` §7 | unscoped | U3 |
| `spec/05-verification.md` §8 | unscoped | U4 |
| `spec/06-artifacts.md` §9, `spec/07-independent.md` §10 | unscoped | U5 |
| `spec/08-synthesis.md` §11 | unscoped | U6 |
| Appendices A, M | unscoped | U1 |
| Appendices B, C, N, W, X, Y, Z | unscoped | U6 |
| Appendices D–L, O–T, U | unscoped | U7 |
| Appendix V | unscoped | U5 |
| `docs/engine-contract.md` §2–§6 | swept | sweep chunk P5 |
| `docs/engine-contract.md` §1, §7–§10, appendix | unscoped | U3 |
| `docs/workflow-cadence.md`, `docs/publish-pipeline.md` | unscoped | U5 |
| `docs/e5-world-pack-gap-report.md`, `docs/ruleset-index-phase0.md` | unscoped | U8 |
| `docs/upstream/`, `docs/licenses/` | unscoped | U8 |
| root `scripts/**` | unscoped | U2, U4, U5 (by role) |
| `holonovel/scripts/**` | swept (citation resolution) | sweep method |
| `holonovel/scripts/**` harness correctness | unscoped | U4, U6 |
| `.githooks/**` | unscoped | U2 |
| `.github/workflows/**` | unscoped | U4, U5 |
| `holonovel/src/**` | swept for §5 contracts | sweep chunks P1–P8 |
| `holonovel/src/**` §7 / engine-contract surface | unscoped | U3 |
| `holonovel/narrative_world_model/` | unscoped | U8 |
| `holonovel/content/` | unscoped | U8 |
| `holonovel/schemas/`, `tool-*.json`, `server.json`, `glama.json` | unscoped | U7 |
| `holonovel/scripts/fixtures/`, `holonovel/testdata/` | unscoped | U6 |
| `holonovel/AGENTS.md`, `holonovel/README.md`, `holonovel/DECISIONS.md`, `holonovel/NOTICE.md`, `holonovel/Dockerfile` | unscoped | U8 |
| `spec/audit/**` (registers, baselines, reports) | unscoped | U8; `loop-audit.md` → U5 |
| `README.md`, `AGENTS.md`, `SECURITY.md`, `CHANGELOG.md`, `ROADMAP.md`, `LICENSE` | unscoped | U8 |
| `plans/` (pre-`docs/plans` archive), `docs/plans/*` history | historical | sampled in U8; not re-reviewed |
| `.opencode/`, `.holonovel-state/`, wiki clone | untracked state | out of program |

## Status

| Chunk | Surface | Lens | Status |
|---|---|---|---|
| U1 | §1–§4, Appendix A, Appendix M, validator surface | drift + spec | **reviewed 2026-11-14** — 80 rows, 3 P0 fixed, 1 P1 scheduled, 2 P3 closed (`docs/plans/2026-11-14-unscoped-u1/review.md`) |
| U2 | §6, build-phase-map, build/update tooling, git hooks | drift + code | **reviewed 2026-11-14** — 35 rows, 5 P0 fixed, 1 P3 closed (`docs/plans/2026-11-14-unscoped-u2/review.md`) |
| U3 | §7, engine-contract remainder, adapter/server code | drift + code | **reviewed 2026-11-14** — 28 rows, 1 P0 fixed, 4 P1 scheduled (`docs/plans/2026-11-14-unscoped-u3/review.md`) |
| U4 | §8, gate manifest and harnesses, CI | drift + gate coverage | **reviewed 2026-11-15** — 52 rows, 2 P0 fixed, 3 P1 + 2 P2 scheduled (`docs/plans/2026-11-15-unscoped-u4/review.md`) |
| U5 | §9, §10, Appendix V, publication and cadence | drift + process | **scheduled** |
| U6 | §11, Appendices B/C/N/W–Z, fixtures and playability | fixture exercise | **scheduled** |
| U7 | Appendices D–L/O–T/U, registries and manifests | catalog comparison | **scheduled** |
| U8 | repo governance docs, vendored and content assets | drift + code | **scheduled** |

## Chunk U1 — foundations and constitution

**Prose:** `spec/01-foundations.md` §1–§3, `spec/01a-constitution.md` §4,
`spec/appendices-reference.md` Appendix A (`:3`), Appendix M (`:2768`).
**Code:** `scripts/validate.ts`, `scripts/lib/req-checks.ts`,
`scripts/lib/parse-spec.ts`, `scripts/check-guarded-rule-change.ts`,
`scripts/check-script-discipline.ts`.
**Lens:** `drift-report` (each standing rule ↔ the check that enforces it) plus
`spec-review` on prose.
**Already gated:** `validate --sdd-strict`, `test:validators`,
`check-guarded-rule-change`, `check-script-discipline`, `check-script-quality`.
**Exit evidence:** `check:fast` report; one row per §1–§3 subsection, §4 rule,
Appendix A block, and Appendix M rule; every rule either maps to an enforcing
check or carries a recorded gap finding.

**Exit evidence recorded (2026-11-14):** `docs/plans/2026-11-14-unscoped-u1/`
holds `plan.md`, `tasks.md`, `review.md` (80 verdict rows: 3 §1–§3 subsections,
14 §4 blocks, 8 Appendix A blocks, 32 Appendix M checklist items, 11 SDD
enforcement rules, 11 Appendix M prose blocks) and `aar.md`. Findings:
F-U1-1/F-U1-2/F-U1-4 fixed in the increment (Appendix M `action-conflicts`
gate, Standing Rule 10's G4/G5 attribution, the SHALL-count severity); F-U1-3
(≤8-sentence predicate absent) scheduled on `ROADMAP.md`; F-U1-5/F-U1-6
recorded as Closed-P3. `spec/audit/review-register.md` carries the dated
`### 2026-11-14 U1 foundations and constitution` heading in all three
sections.

**Boundary (recorded, not reviewed):** `scripts/lib/parse-spec.ts` is the
parser substrate the shape predicates call — verified as substrate in Phase 1
(`readSpec`, `extractReqBodies`, `extractH2Headings`, `extractNarrativeProse`)
and carried as a mapping-table row rather than a verdict row.
`scripts/check-script-discipline.ts` and `check-script-quality` enforce the
AGENTS.md script discipline, not a §1–§4 or Appendix A/M rule; they are
out of this chunk's surface by definition, not by omission.

## Chunk U2 — build process and tooling

**Prose:** `spec/03-build.md` §6 (16 subsections), `spec/build-phase-map.md`.
**Code:** `scripts/assemble.ts`, `scripts/build-order.ts`,
`scripts/spec-update-record.ts`, `scripts/spec-propagate.ts`,
`scripts/spec-delta.ts`, `scripts/update.ts`, `scripts/update-server.ts`,
`scripts/version-bump.ts`, `scripts/status.ts`,
`.githooks/{pre-commit,pre-push,commit-msg}`.
`scripts/run-gates.ts` is owned by U4; `scripts/session-close.ts` by U5.
**Lens:** `drift-report` plus `code-review` on the entry points.
**Already gated:** `build-order`, `check-gate-table`, `check-fingerprint-sync`,
`check-loop-artifacts`, `test:spec-tooling`, `test:commit-plan`,
`test:pipeline` (hook behaviour is exercised through the pipeline harness).
**Exit evidence:** every §6 phase maps to a script or a recorded gap;
`build-phase-map.md` file-index counts match the current spec; each hook's
failure mode is named.
**Boundary:** `scripts/push-pipeline.sh` and `scripts/publish/*` belong to U5.

## Chunk U3 — runtime conventions and the engine contract remainder

**Prose:** `spec/04-runtime.md` §7 (11 subsections), `docs/engine-contract.md`
§1 (`:24`), §7 (`:206`), §8 (`:255`), §9 (`:274`), §10 (`:287`), and the
clause-to-source appendix (`:313`).
**Code:** `holonovel/src/core/server.ts`, `holonovel/src/rulesets.ts`,
`holonovel/src/tool-registry.ts`, `holonovel/src/surface-report.ts`,
`holonovel/src/core/surface-projection.ts`, `holonovel/src/world/*`,
`holonovel/src/index.ts` dispatch wrapper.
**Lens:** `drift-report` plus `code-review`.
**Already gated:** `action-conflicts`, `check-tool-surface`, `surface-budget`,
`surface-replay`, `tool-citation-check`, `check:conformance`.
**Exit evidence:** each §7 subsection maps to code or a gate; every
engine-contract clause in the appendix resolves to a live `file:line`; the §7.7
property groups match the coupling tables.
**Boundary:** §7.7 is fingerprint-bearing — a REQ-body edit requires
`build-order`; review-only chunks change no body. *Amended 2026-11-14:* this
chunk is not review-only — it fixes a P0 prose defect (F-U3-5) atomically, so
it edits four spec files and regenerates the fingerprint through `build-order`.

**Exit evidence recorded (2026-11-14):** `docs/plans/2026-11-14-unscoped-u3/`
holds `plan.md`, `tasks.md`, `review.md` (28 verdict rows: 14 §7 rows, 6
engine-contract rows, 8 code rows), the cold pass under `plan.cold/`, and
`aar.md`. Findings: F-U3-5 fixed in the increment (pattern-rule range
P1–P59 → P1–P61 at seven sites); F-U3-1/F-U3-2/F-U3-3/F-U3-4 scheduled on
`ROADMAP.md` under *Identifier-derivation conformance (P1)* and *§7.3a
documentation and P60 vocabulary (P1)*. Every §7 block maps to code or a gate;
all 13 engine-contract appendix clauses resolve; the `Surface` token is the one
vocabulary gap and is scheduled. `spec/audit/review-register.md` carries the
dated `### 2026-11-14 U3 runtime conventions` heading in both sections.

**Vocabulary note:** `builder-side` is a terminal verdict for prose that
addresses the builder with no repository check (here §7.3a and the
engine-contract's non-normative §8). It records the mapping honestly rather
than claiming code-or-gate coverage.

**Boundary note:** `holonovel/src/index.ts` is reviewed at its dispatch wrapper
only; its body is §5's surface (swept in sweep phase 1–8). `world/*` is the
§5.9/§5.10 seam.

## Chunk U4 — verification workflows and CI

**Prose:** `spec/05-verification.md` §8.
**Code:** `scripts/run-gates.ts`, every `scripts/check-*.ts` and
`scripts/test-*.ts`, `holonovel/scripts/run-test-suite.ts`,
`holonovel/scripts/test-harness-guard.ts`, `.github/workflows/ci.yml`.
**Lens:** `drift-report` plus gate-coverage review.
**Already gated:** the manifest itself, `check-workflows`, `test:workflows`,
`check-gate-table`, `check-script-discipline`.
**Exit evidence:** every §8 gate/workflow reference resolves to the manifest;
every CI step invokes a declared gate and never swallows its exit code; the
§8 command list matches `npm run gates -- --list`.

**Exit evidence recorded (2026-11-15):** `docs/plans/2026-11-15-unscoped-u4/`
holds `plan.md`, `tasks.md`, `review.md` (52 verdict rows: 18 §8 rows, 22 gate
rows, 10 harness rows, 2 CI rows), the cold-pass record under `plan.cold/`, and
`aar.md`. Findings: F-U4-2 and F-U4-3 fixed in the increment (G2's `_Check:_`
token now cites T185; G4's test-file convention now states the tree's
`scripts/test-*.ts` form); F-U4-4/F-U4-5/F-U4-6 scheduled under *ROADMAP*
§ *Verification-surface reachability (P1)* and § *G7 attestation predicate (P1)*;
F-U4-1/F-U4-7 under § *Verification evidence record and the CI-manifest split
(P2)*. Every §8 workflow resolves to a harness, a gate, or a recorded
`builder-side` declaration; T18, the persona table, and G8 are builder-side, and
G8 is legitimately unrunnable in a ruleset-free tree. `spec/audit/review-register.md`
carries the dated `### 2026-11-15 U4 verification workflows` heading in the
Resolved and Scheduled-roadmap sections.

**Exit-evidence amendment (2026-11-15):** the third clause was mis-specified at
program-design time. §8 contains no command list — it names verification
workflows (`G0a`, `G0b`, `G2`–`G8`), not repo commands, and `grep -c 'npm run'
spec/05-verification.md` returns 0 — so it cannot be compared with `npm run gates
-- --list`. The clause this chunk can evidence is the mapping it records: every
`G` workflow resolves to a harness, a gate, or a recorded `builder-side`
declaration, and the manifest's 44 gates are the reference implementation's own
checks, a different vocabulary that meets §8 only where a workflow is implemented
as a harness.

**Vocabulary note:** `builder-side` is a terminal verdict for §8 prose that
addresses the builder with no repository check (G0a's intake duty, G0b's
Inspector run, G3's discovery diff, G8's multi-ruleset host, the T18 and persona
tables). It records the mapping honestly instead of claiming gate coverage.

**Boundary note:** `holonovel/scripts/**` harness correctness beyond
`run-test-suite.ts` and `test-harness-guard.ts` is U6's surface;
`.github/workflows/publish.yml` is U5's.

## Chunk U5 — artifacts, independent verification, cadence, publication

**Prose:** `spec/06-artifacts.md` §9, `spec/07-independent.md` §10,
`spec/appendices-runbooks.md` Appendix V.
**Docs/code:** `docs/workflow-cadence.md`, `docs/publish-pipeline.md`,
`scripts/push-pipeline.sh`, `scripts/publish/{preflight,steps,run}.ts`,
`scripts/weekly.ts`, `scripts/loop-audit.ts`, `scripts/session-close.ts`,
`spec/audit/loop-audit.md`,
`.github/workflows/publish.yml`, `docs/plans/README.md`.
**Lens:** `drift-report` plus process review.
**Already gated:** `test:pipeline`, `check-loop-artifacts`,
`check-workflows`, `check-registry`.
**Exit evidence:** every runbook step resolves to a script or a manual action;
the publication failure ledger matches the pipeline's guards; §10's independent
verification contract maps to the review skills in use.

## Chunk U6 — synthesis and fixtures

**Prose:** `spec/08-synthesis.md` §11.1–§11.4, `spec/appendices-fixtures.md`
Appendices B (`:31`), C (`:331`), N (`:385`), W (`:778`), X (`:970`), Y
(`:1080`), Z (`:1119`).
**Assets/code:** `holonovel/scripts/fixtures/*`, `holonovel/testdata/*`,
`holonovel/scripts/playability.ts`, `holonovel/scripts/holosuite.ts`,
synthesis harnesses (`test-competitive-gaps.ts`, `test-supplementary.ts`,
`test-world-provider.ts`).
**Lens:** fixture ↔ expectation; `playability` as evidence.
**Already gated:** `playability` (full gate), `check-fixture-emitter`,
`check-starter-freshness`, `check-vendor-manifest`.
**Exit evidence:** every appendix fixture is exercised by a named harness or
recorded `builder-side` with a reason; §11.1–§11.4 each map to a handler or a
recorded gap.

## Chunk U7 — reference appendices and registries

**Prose:** Appendices D–L, O–T, U (`spec/appendices-reference.md`,
`spec/appendices-licenses.md`).
**Assets:** `holonovel/tool-definitions.json`,
`holonovel/tool-surface-registry.json`, `holonovel/tool-disambiguation.json`,
`holonovel/tool-routing.json`, `holonovel/schemas/*`, `holonovel/server.json`,
`glama.json`, `docs/licenses/ATTRIBUTION.md`.
**Lens:** catalog ↔ live artifact comparison.
**Already gated:** `check-tool-definitions-sync`, `tool-definitions-lint`,
`check-tdqs-scoreboard`, `tool-citation-check`, `check-server-manifest`,
`check-registry`, `check-tool-surface`.
**Exit evidence:** each catalog appendix matches the artifact it describes or
carries a divergence finding; every Appendix U license resolves to
`docs/licenses/ATTRIBUTION.md`.

## Chunk U8 — repo governance and content assets

**Prose:** `README.md`, `AGENTS.md`, `SECURITY.md`, root `package.json`,
`holonovel/Dockerfile`, `holonovel/README.md`, `holonovel/AGENTS.md`,
`holonovel/DECISIONS.md`, `holonovel/NOTICE.md`, `LICENSE`,
`spec/audit/{review-register,req-coverage,proofread-register}.md` and the
`spec/audit` baselines/reports **except `loop-audit.md` (U5)**, `ROADMAP.md`,
`CHANGELOG.md` conventions.
**Assets:** `holonovel/narrative_world_model/` (124 K),
`holonovel/content/` (456 K), `docs/upstream/cof.md`,
`docs/e5-world-pack-gap-report.md`, `docs/ruleset-index-phase0.md`.
**Lens:** `drift-report` plus content/licensing review.
**Already gated:** `validate-readme`, `lint`, `check-registers`,
`check-traceability`, `check-vendor-manifest`,
`check-reference-server-cleanliness`, `check-container-image`,
`check-package-manifest`.
**Exit evidence:** README/AGENTS claims match `tools/list` and the gates;
vendored content hashes match the manifest; every borrowed mechanics source is
named in the README License section and `docs/licenses/ATTRIBUTION.md`.

## Per-chunk close protocol

1. Surface enumerated with `file:line` anchors in this file.
2. Lens run; findings carry IDs and predicates.
3. Every finding dispositioned in the register.
4. Exit evidence run un-piped and its exit status recorded.
5. `review-register.md` row added; `ROADMAP.md` trigger advanced (or the
   section removed when U8 closes).
