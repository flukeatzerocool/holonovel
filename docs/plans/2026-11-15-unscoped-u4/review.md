# Review — U4: verification workflows and CI

Increment: `docs/plans/2026-11-15-unscoped-u4/` · HEAD `5aa2e64` (2026-11-15)
Lens: `drift-report` (each §8 workflow ↔ the gate, harness, or CI step that
implements it) plus gate-coverage review.
Verdict vocabulary: `holds` · `finding:<ID>` · `builder-side` ·
`already-reviewed:<chunk>`.

## Enforcement surface (read once, Phase 1)

| Consumer | Anchor | Severity today | Contract |
|---|---|---|---|
| `run-gates` full mode | `scripts/run-gates.ts:190-215` | exit 1 at the first failing gate; 2 on a spawn error | sequential; an advisory gate logs and continues |
| `run-gates` fast mode | `:217-249` | exit 1 if **any** buffered gate failed; 2 on spawn error | every sub-check's failure propagates (§8 G4's parallel rule) |
| `run-gates` list/record | `:126-174` | exit 0 | `--list --format=md` is the generated AGENTS table; `--recorded` feeds the hooks |
| `check-gate-table` | `scripts/check-gate-table.ts:1-40` | exit 1 | AGENTS.md table equals `renderMarkdownTable()` |
| `check-workflows` | `scripts/check-workflows.ts:1-60` | exit 1 | action pins are full SHAs at a Node-24-capable major; publish reads the deterministic registry endpoint |
| `check-script-discipline` | `scripts/lib/script-discipline.ts` | exit 1 | shebang, role header, exit codes 0–2, path rules, `shellcheck -S warning` when installed |
| `check-script-quality` | `scripts/lib/script-quality.ts` | exit 1 (baselined) | reachability via a `package.json` script, duplicate helpers, repeated parses, parser bypass |
| `test-harness-guard` | `holonovel/scripts/test-harness-guard.ts:43-68` | exit 1 | a spawning harness that drains without `harnessComplete()` exits non-zero (REQ-141m) |
| `run-test-suite` | `holonovel/scripts/run-test-suite.ts:141-171` | exit 1 if any of the 56 commands fails | bounded concurrency; buffered per-command output; whole-run failure |
| `.githooks/pre-push` | `.githooks/pre-push:32-160` | exit 1 | skips only on a recorded full run; otherwise `check`, the server harnesses, the Holosuite tiers, and the strict coverage gate |
| `ci.yml` | `.github/workflows/ci.yml:9-47` | job failure | every step fails the job; no step swallows an exit code |

**Boundaries (recorded, not reviewed).** `holonovel/scripts/**` harness
correctness is U6's surface (`worklist.md:72`), except the two scripts this chunk
names. `.github/workflows/publish.yml` is U5's (`worklist.md:213`). The 17
manifest gates implemented outside `check-*`/`test-*` (D1) are row-free by
design; their reachability is gated by `check-gate-table` and
`check-script-quality`.

## Verdicts

| # | Surface | Anchor | Verdict | Predicate |
|---|---|---|---|---|
| 1 | §8 lead-in: the evidence-record contract | `spec/05-verification.md:3-10` | finding:F-U4-1 | `holonovel/DECISIONS.md:2375-2384` carries name/(a)(b)(c)/`spec_health`, but no timestamp, env pins, commands+output, or findings list |
| 2 | §8 workflow table and `GN` vocabulary | `:12-27` | holds | nine workflows declared (`G0a`, `G0b`, `G2`–`G8`); `grep -rn 'Gate [0-9]'` outside §8 → 0 hits |
| 3 | G0a Structural integrity | `:29-34` | holds | Appendix H exists (`spec/appendices-reference.md:2474`); T259 asserts the G0a skip (`:1726`); Rule 9's precedence sentence covers the section-specific wording (`spec/01a-constitution.md:36-41`) |
| 4 | G0b MCP conformance | `:36-43` | builder-side | the Inspector run is an operator step; the repo's nearest equivalent is `test:package-smoke` (`holonovel/scripts/smoke-package.ts`), a CI-only step |
| 5 | G2 Golden transcript replay | `:45-74` | finding:F-U4-2 | the `_Check:_` line's middle element is prose ("Golden transcript replay (B fixture)"), not an ID; the B replay is T185 (`spec/appendices-reference.md:1690`) |
| 6 | G2 coverage completeness | `:76-83` | holds | `_Check:_ T185` resolves; T185 asserts the eight-contract enumeration and the REQ-041 gap |
| 7 | G3 Injection | `:85-93` | builder-side | the discovery diff is an operator run; Appendix C exists as the fixture source |
| 8 | G4 Derived tests | `:95-109` | finding:F-U4-3 | `:99` requires `scripts/test_N.sh` or `scripts/test_N.ts`; the tree has zero `test_*` files and uses `test-*.ts` in two directories |
| 9 | G5 The Pattern Buffer | `:111-119` | finding:F-U4-4 | `test:pattern-buffer` and `test:pattern-buffer-ruleset` (`holonovel/package.json`) are in `test:all`, which no gate, CI step, or hook runs |
| 10 | G6 Synthesis lifecycle | `:121-136` | finding:F-U4-4 | `:131-133` asserts a re-run after every server change; nothing schedules it (same predicate as row 9) |
| 11 | G7 Narrative coherence attestation | `:138-149` | finding:F-U4-5 | `SECTION_512_REQS` lists 31 families and `G7_ATTESTATION_RECORDED = true` (`holonovel/src/index.ts:375-385`); the disposition is `pass` whenever counts match (`:15392`) |
| 12 | T18 anti-badge sub-workflows | `:151-160` | builder-side | scenario table addressed to the builder; the Pattern Buffer owns the mechanics (row 9) |
| 13 | Persona → Pattern Buffer table | `:162-170` | builder-side | same; the mapping names S1–S24, which exist in the ruleset suite |
| 14 | G8 Cross-ruleset isolation | `:172-226` | builder-side | requires a host with two ruleset packages; this tree ships ruleset-free, so Rule 9 applies and §9's `evidence-g8` section is legitimately absent (`spec/06-artifacts.md:16-19`) |
| 15 | Holosuite method and shared schema | `:228-239` | holds | `holonovel/scripts/lib/holosuite-mutation.ts` + `holosuite.ts` emit provenance (server dir, git sha, spec hash, seed) with no wall-clock key |
| 16 | Holosuite nine analytic lenses | `:241-253` | holds | all nine lens names present in `holonovel/scripts/lib/playtest-lib.ts` (`grep -o` → 9/9) |
| 17 | Holosuite mutation-audit catch rate | `:255-263` | finding:F-U4-6 | `test:holosuite-mutation` exists (`holonovel/package.json:129`) and appears in no gate, CI step, hook, or suite entry |
| 18 | Holosuite coverage traceability | `:265-268` | holds | per-REQ exercise aggregates are produced by `test:holosuite-evidence` and consumed by the coverage register (`validate` PASS: "Coverage register is current") |
| 19 | `run-gates.ts` | `scripts/run-gates.ts` | holds | full mode exits 1 at the first failure and 2 on spawn error (`:190-215`); fast mode counts every buffered failure and exits 1 (`:225-249`) |
| 20 | `check-container-image.ts` | `scripts/check-container-image.ts` | holds | manifest full-only gate (`gate-manifest.ts:93`) |
| 21 | `check-fingerprint-sync.ts` | `scripts/check-fingerprint-sync.ts` | holds | manifest, both modes (`:159`); section-scoped to `DATA_SECTIONS` (`:3-8`) |
| 22 | `check-fixture-emitter.ts` | `scripts/check-fixture-emitter.ts` | holds | manifest, both modes (`:231`) |
| 23 | `check-gate-table.ts` | `scripts/check-gate-table.ts` | holds | manifest (`:268`); fails on a missing marker or a drifted row |
| 24 | `check-guarded-rule-change.ts` | `scripts/check-guarded-rule-change.ts` | holds | hook-wired (`.githooks/pre-commit`), staged-diff default (`:12-13`); not a manifest gate by design |
| 25 | `check-loop-artifacts.ts` | `scripts/check-loop-artifacts.ts` | holds | manifest (`:274`); refuses `LOOP OPEN` for the closing increment |
| 26 | `check-package-manifest.ts` | `scripts/check-package-manifest.ts` | holds | manifest (`:244`) |
| 27 | `check-performance-record.ts` | `scripts/check-performance-record.ts` | holds | manifest (`:195`) |
| 28 | `check-reference-server-cleanliness.ts` | `scripts/check-reference-server-cleanliness.ts` | holds | manifest (`:213`) |
| 29 | `check-registers.ts` | `scripts/check-registers.ts` | holds | manifest (`:153`), `--strict` in full mode; live run PASS |
| 30 | `check-registry-publish.ts` | `scripts/check-registry-publish.ts` | holds | publish-wired: `check-workflows.ts:44` requires `publish.yml` to use it; not a local gate by design |
| 31 | `check-roadmap.ts` | `scripts/check-roadmap.ts` | holds | manifest, both modes (`:135`); live run PASS |
| 32 | `check-ruleset-model.ts` | `scripts/check-ruleset-model.ts` | holds | driven by `test:ruleset-gates` (`holonovel/scripts/test-ruleset-gates.ts`), a manifest gate (`:69`) |
| 33 | `check-ruleset-package.ts` | `scripts/check-ruleset-package.ts` | holds | same driver as row 32 (`:69`); also cited by REQ-430 |
| 34 | `check-script-discipline.ts` | `scripts/check-script-discipline.ts` | holds | manifest, both modes (`:117`) |
| 35 | `check-script-quality.ts` | `scripts/check-script-quality.ts` | holds | manifest, both modes (`:123`); baselined exceptions in `spec/audit/script-quality-baseline.json` |
| 36 | `check-server-manifest.ts` | `scripts/check-server-manifest.ts` | holds | manifest, both modes (`:87`) |
| 37 | `check-tdqs-scoreboard.ts` | `scripts/check-tdqs-scoreboard.ts` | holds | manifest (`:201`) |
| 38 | `check-tool-surface.ts` | `scripts/check-tool-surface.ts` | holds | manifest (`:177`) |
| 39 | `check-traceability.ts` | `scripts/check-traceability.ts` | holds | manifest (`:141`) |
| 40 | `check-workflows.ts` | `scripts/check-workflows.ts` | holds | manifest (`:129`); guards the two demonstrated workflow failure modes only |
| 41 | `test-commit-plan.ts` | `scripts/test-commit-plan.ts` | holds | `test:commit-plan`, manifest (`:63`) |
| 42 | `test-loop-artifacts.ts` | `scripts/test-loop-artifacts.ts` | finding:F-U4-6 | header declares `[informational]` and "Not wired into run-gates" (`:3-12`) but the script exits 1 on failure; no manifest, CI, hook, or suite entry |
| 43 | `test-package-manifest.ts` | `scripts/test-package-manifest.ts` | holds | `test:package-manifest`, manifest (`:250`) |
| 44 | `test-push-pipeline.ts` | `scripts/test-push-pipeline.ts` | holds | `test:pipeline`, manifest full-only (`:281`) |
| 45 | `test-req-checks.ts` | `scripts/test-req-checks.ts` | holds | `test:validators`, manifest (`:39`) |
| 46 | `test-script-tooling.ts` | `scripts/test-script-tooling.ts` | holds | `test:script-tooling`, manifest (`:51`) |
| 47 | `test-spec-tooling.ts` | `scripts/test-spec-tooling.ts` | holds | `test:spec-tooling`, manifest (`:45`) |
| 48 | `test-workflows.ts` | `scripts/test-workflows.ts` | holds | `test:workflows`, manifest (`:57`) |
| 49 | `run-test-suite.ts` | `holonovel/scripts/run-test-suite.ts` | finding:F-U4-4 | runs 56 commands with bounded concurrency and fails the run (`:160-170`); `test:all` is in no gate, CI step, or hook |
| 50 | `test-harness-guard.ts` | `holonovel/scripts/test-harness-guard.ts` | finding:F-U4-4 | proves REQ-141m's fail-loud contract (`:43-68`); reachable only through `test:all` |
| 51 | CI `gates` job | `.github/workflows/ci.yml:9-47` | finding:F-U4-7 | 15 steps; nine verification steps hold 16 commands, one of which (`check:starter-freshness`) is a manifest gate, so 15 commands are outside the manifest |
| 52 | CI `container` job | `:49-56` | holds | builds the image and starts the host; `check-container-image` covers it locally in full mode |

## Findings

Row order below matches the verdict table. Severity follows `AGENTS.md`
"Review-loop governance", assigned by fix surface.

- **F-U4-1 — the G7 evidence record omits the §8 contract fields (P2).**
  §8 `:3-6` requires workflow name, timestamp, environment pins, commands and
  their output, pass/fail, and findings. The only `@section evidence` block
  (`holonovel/DECISIONS.md:2375-2384`) carries three lettered attestations and a
  `spec_health` bullet: no timestamp, no pins, no command list, no findings.
  Predicate: `holonovel/DECISIONS.md:2377` vs `spec/05-verification.md:3-6`.
- **F-U4-2 — the G2 `_Check:_` line cites a prose token, not a test (P0,
  fixed).** `:74` reads "T90 (N fixture), Golden transcript replay (B fixture),
  T261 (W fixture)"; the B replay is T185 (`spec/appendices-reference.md:1690`),
  which the coverage-completeness paragraph cites at `:83`. A check line whose
  middle element is prose cannot be resolved by the coverage audit. Fixed by
  citing T185.
- **F-U4-3 — G4 mandates a test-file naming convention the tree does not use
  (P0, fixed).** `:99` requires "`scripts/test_N.sh` or `scripts/test_N.ts`";
  `find . -name 'test_*.ts' -o -name 'test_*.sh'` returns zero files, while root
  harnesses are `scripts/test-*.ts` and server harnesses
  `holonovel/scripts/test-*.ts`. Fixed by stating the convention the tree uses.
- **F-U4-4 — the 56-command server suite is in no running surface (P1).** §8 G5
  makes the Pattern Buffer blocking and G6 requires a re-run after every server
  change (`:111-136`), but `test:all` (`holonovel/package.json:120` →
  `run-test-suite.ts`) appears in no manifest gate, CI step, or hook:
  `.githooks/pre-push:101-124` runs `check`, the tool-definition/security
  harnesses, and the six Holosuite tiers only, and `ci.yml:37-47` mirrors that
  subset. The suite's members include `test:pattern-buffer`,
  `test:pattern-buffer-ruleset`, and `test:harness-guard`. Predicate:
  `holonovel/scripts/run-test-suite.ts:25-82` vs the four running surfaces.
- **F-U4-5 — G7's attestation cannot fail (P1).** §8 G7(a) asserts every
  narrative-critical §5.12 REQ is `converged` or waived. The predicate is
  `SECTION_512_REQS` (31 base families, `holonovel/src/index.ts:375-383`) plus
  `G7_ATTESTATION_RECORDED = true` (`:384`); the disposition is `pass` whenever
  `implemented.length >= total.length` (`:15392`). §5.12 spans
  `spec/02-requirements.md:3566-3813` and carries 84 REQ bodies (first `:3583`,
  last `:3809`), so a family list cannot evidence a per-REQ status, and the
  literal makes the check unfalsifiable.
- **F-U4-6 — two harnesses exist and never run (P1).** `test:loop-artifacts`
  (`package.json:25`) is the self-test of `check-loop-artifacts`, and
  `test:holosuite-mutation` (`holonovel/package.json:129`) is the only producer
  of the mutation-audit catch rate that §8 `:260-262` makes a precondition for
  Understudies evidence. Neither appears in the manifest, CI, a hook, or
  `run-test-suite.ts`. `test-loop-artifacts.ts:3-12` declares `[informational]`
  and "Not wired into run-gates" while exiting 1 on failure, so the role header
  and the behaviour disagree. Predicate: the two `grep -rn` probes plus
  `run-test-suite.ts:25-82`.
- **F-U4-7 — CI runs 15 commands the manifest does not hold (P2).** The `gates`
  job's nine verification steps hold 16 commands; only `check:starter-freshness`
  is a manifest gate. The other 15 are outside it: `shellcheck`,
  `version-check.ts`, `spec-delta.ts --report-only`, two `npm audit` runs,
  `test:tool-definitions`, `test:security`, `test:starter-novel`, six
  `test:holosuite-*` tiers, and `test:package-smoke` (ten `npm run` composites).
  A green `check:fast` therefore does not imply a green CI, and
  `gate-cost-report` cannot see those costs. Predicate:
  `.github/workflows/ci.yml:18-47` vs `GATES`.

## Aggregate

Seven findings: 2 P0 (both fixed in the increment), 3 P1 (scheduled), 2 P2
(scheduled). Every §8 workflow resolves to a harness, a gate, or a recorded
`builder-side` declaration; no §8 block is `already-reviewed`.
