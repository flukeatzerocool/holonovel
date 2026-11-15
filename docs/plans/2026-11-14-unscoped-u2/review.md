# Review — U2: build process and tooling

Verdict table for `spec/03-build.md` §6 and `spec/build-phase-map.md` against the
build/update tooling and the git hooks. Row budget: `plan.md` "Surface inventory"
(35). Anchor column is the reviewed range; predicate column is the `file:line` or
declaration that settles the row.

## Mapping table (consumers read in Phase 1)

| Consumer | Anchor | Severity today | What it actually does |
|---|---|---|---|
| `assemble` | `scripts/assemble.ts:18-19,120-132,154-166` | exit 1 on a bad roster | writes `holonovel.md` **and** `holonovel/holonovel.md`; rewrites the map hash |
| `checkPreparePhaseMap` | `scripts/validate.ts:1332-1380` | **error** (`:2487-2491`) | directive → map row (directive ⊆ row), forward only |
| `checkPhaseMapHash` | `:1405-1413`; `lib/phase-map-hash.ts:36-50` | **warning** | map hash over the 13 hashed sources; the map is excluded |
| `checkBuildPhaseMapCounts` | `lib/req-checks.ts:128-140` | **warning** | file index's "35 subsections" vs `^### 5\.\d+` |
| `checkStaleCounts` | `validate.ts:753-769` | **warning** | number-words `one`…`twelve` + ten nouns; digit counts invisible |
| `checkPatternBufferCoverageMap` | `validate.ts:920-964` | **error** | §6.6 map only: slice `:1428`→`:1690` |
| `build-order` | `scripts/build-order.ts:188-206,220-229,251-254` | exit 1 | fingerprints (step 1b) → full `check` (step 2) → propagate → typecheck → version bump |
| `version-bump` | `scripts/version-bump.ts:47-50` | build tool | rewrites `holonovel/DECISIONS.md` spec version among its targets |
| `spec-delta` | `scripts/spec-delta.ts:180-196`; `lib/spec-delta-classify.ts:35-49` | blocks push | classifies `none/patch/editorial/minor/major` |
| `.githooks/pre-commit` | `:1-53` | blocks commit | assemble, fast suite, guarded co-change; records `gate-run.json` |
| `.githooks/pre-push` | `:1-139` | blocks push | version sync, `spec-delta` → `update-server --check`, root/embedded spec-hash equality, full `check`, harnesses, strict impl gate |
| `.githooks/commit-msg` | `:1-52` | blocks commit | `YYYY-MM-DD — <title>`, ≤120 chars, no trailing period; names the `--no-verify` bypass |
| `check-registers --strict` | `scripts/check-registers.ts:9-10,54` | error only with `--strict` | register structure + disposition coupling |

**Hook failure modes (C-12, resolved `holds`).** Each hook states the failure it
enforces and implements it: pre-commit blocks on assembly/fast-suite/guarded
failure and keys its record on tree + dirty hash (`lib/gate-run-manifest.ts:1-38`);
pre-push blocks on version drift, a pending update, a root/embedded spec-hash
mismatch, a failed `check`, failed harnesses, or bucket-A coverage; commit-msg
rejects the subject form and names `--no-verify` as the bypass. No hook claims a
guarantee it does not provide.

## Candidate ledger

| ID | Resolution |
|---|---|
| C-1 | **finding F-U2-2** — the map's loading conventions say "Each phase's `*Prepare:*` directive … lists the exact files" (`build-phase-map.md:41-42`) while 15 phase rows carry 6 directives and the header says directives "do not independently specify file lists" (`:7-9`). |
| C-2 | **finding F-U2-4** — §6.7's Editorial class includes "spec tooling or verification-only edits" (`03-build.md:2022`); a tooling-only change touches no REQ, so `classifyDelta` returns `patch` (`spec-delta-classify.ts:47`). |
| C-3 | `holds` — a wording-only edit inside a REQ body is `modified`, and Editorial requires the operator's `| Delta class | editorial |` disposition first (`spec-delta-classify.ts:46,55-62`), exactly as §6.7 says the operator may override at intake (`:2028`). Absent that record the conservative `minor` is correct. |
| C-4 | `holds` — the three rosters differ in granularity but no §6.1 row claims a machine link; the map header already declares itself the single source of truth (`build-phase-map.md:7-9`). |
| C-5 | **finding F-U2-3** — peak working set "~8,000 tokens (Convergence)" (`:33`) contradicts the Convergence row's 9,200 (`:18`); the 73% figure derives from 8,000. |
| C-6 | `holds` — the file index lists 13 of 14 files because the map is not content; `ALLOWED_SOURCE_FILES` includes it so the roster is complete (`assemble.ts:120-127`). |
| C-7 | `holds` on the number (35 declared = 35 headings); the warning-vs-error severity is P3, below. |
| C-8 | `holds` — S1–S37 are 37 distinct base IDs, matching both assertions (`:1743`, `:2024`). |
| C-9 | `holds` — `scripts/run_pattern_buffer.ts` exists at `holonovel/scripts/run_pattern_buffer.ts`, wired as `test:pattern-buffer` (`holonovel/package.json:75`); §6 addresses the server tree, where `scripts/` is the server's own (`03-build.md:489`). |
| C-10 | **finding F-U2-5** — "The six-step order below" and "built in six steps" (`:455`, `:460`) sit above a table with seven step rows (`:464-470`). |
| C-11 | `holds` — five named components (`:2035`) match REQ-313a/313b and `_Check:_ T497`. |
| C-12 | `holds` — see "Hook failure modes". |
| — | **finding F-U2-1** (found in Phase 2, not a planned candidate) — the Holonovel coverage map claims it "is mechanically verified by `scripts/validate.ts`" and that gaps "are errors — they block assembly" (`:1931-1936`), but the only predicate reads the §6.6 map (`validate.ts:922-925`, slice to `:1690`) and never this table. |

## Verdicts

| # | Surface | Anchor | Verdict | Predicate / declaration |
|---|---|---|---|---|
| 1 | §6.1 Workflow overview (4 workflows) | `03-build.md:3-14` | `holds` | Instruction only; "Required sections" is a coarse guide, and no row claims a machine link (C-4). |
| 2 | §6.2 Intake | `:15-201` | `builder-side` | Operator Q&A recorded to DECISIONS.md (1); G0 defers to Appendix H; no repository check claimed. |
| 3 | §6.3 Discovery | `:202-443` | `builder-side` | Extraction procedure; test evidence bound by `_Check:_ T171, T172`. |
| 4 | §6.4 Server construction (step table) | `:444-494` | `finding:F-U2-5` | "six steps" (`:455,460`) vs seven rows (`:464-470`). |
| 5 | §6.4.1 Prompt composition | `:495-540` | `builder-side` | Invocation-time assembly by the host; no build-time check claimed. |
| 6 | §6.4.2 Package step | `:541-604` | `builder-side` | Package contract; its REQ-420 fingerprint is gated by `check-fingerprint-sync`, and REQ-430 conformance by the ruleset gate. |
| 7 | §6.5 Verification and convergence | `:605-822` | `builder-side` | Audit cadence; the two batches (Steps 1–3, 4–6) match the step table's names. |
| 8 | §6.5.1 No-delta detection | `:823-832` | `builder-side` | Convergence-loop rule; records to DECISIONS.md (5). |
| 9 | §6.5.2 Cross-model audit | `:833-860` | `builder-side` | REQ-299; `_Check:_ T343, T430`. |
| 10 | §6.5.3 Adjusted thresholds and unbuildable disposition | `:861-906` | `builder-side` | Threshold policy and post-write verification; no repository check claimed. |
| 11 | §6.5.4 Finding taxonomy | `:907-919` | `builder-side` | Prefix register for convergence findings. |
| 12 | §6.5.5 Convergence result caching | `:920-978` | `builder-side` | Cache key per REQ-244; "all nine" equals the nine items enumerated at `:934-937`. |
| 13 | §6.6 The Pattern Buffer (37 sub-workflows) | `:979-1367` | `builder-side` | Sub-workflows are builder-executed; C-8's count holds, C-9's harness path holds. |
| 14 | §6.6 Surface-to-scenario mapping + `#### Holonovel Pattern Buffer` | `:1368-1925` | `holds` | Selection rule and table; no mechanical claim. |
| 15 | §6.6 Holonovel REQ Pattern Buffer coverage map | `:1926-1999` | `finding:F-U2-1` | Claims `scripts/validate.ts` verification; predicate reads `:1428-1690` only. |
| 16 | §6.7 Spec-driven updates | `:2000-2155` | `finding:F-U2-4` | Editorial class contains tooling-only edits; classifier returns `patch`. |
| 17 | map row — G0 structural integrity | `build-phase-map.md:13` | `holds` | Row is the loader; no directive claimed (loader = the row itself). |
| 18 | map row — Convert | `:14` | `holds` | Row matches §6.2's Convert workflow (`03-build.md:57-60`). |
| 19 | map row — Discovery (§6.3) | `:15` | `holds` | Directive ⊆ row, enforced (`validate.ts:1370-1376`, gate PASS). |
| 20 | map row — Construction (§6.4) | `:16` | `holds` | Directive ⊆ row, enforced. |
| 21 | map row — Package (§6.4.2) | `:17` | `holds` | Directive ⊆ row, enforced. |
| 22 | map row — Convergence (§6.5) | `:18` | `holds` | Directive ⊆ row, enforced; also the peak-token source (F-U2-3). |
| 23 | map row — Ruleset Pattern Buffer (§6.6) | `:19` | `holds` | Directive ⊆ row, enforced. |
| 24 | map row — Holonovel Pattern Buffer (§6.6) | `:20` | `holds` | Explicitly scoped out of TTRPG builds; no directive claimed. |
| 25 | map row — Gates G0–G5 (§8) | `:21` | `holds` | Points at the full §8 file; §8 is U4's surface. |
| 26 | map row — Handoff (§9) | `:22` | `holds` | Points at §9/§10; row is the loader. |
| 27 | map row — Synthesis (§11, optional) | `:23` | `holds` | Optional row; §11 is U6's surface. |
| 28 | map row — G8 isolation (§8) | `:24` | `holds` | Row is the loader. |
| 29 | map row — Spec-driven update (§6.7) | `:25` | `holds` | Directive ⊆ row, enforced ("files changed per git diff"). |
| 30 | map row — Appendix lookup from gate req | `:26` | `holds` | Row is the loader; appendix selection is by gate. |
| 31 | map row — Independent verification (§10) | `:27` | `holds` | Row is the loader; cold-checkout load, no token efficiency. |
| 32 | map header claim block | `:5-9` | `holds` | "Single source of truth" + delegation; consistent with the 6 directives. |
| 33 | map loading conventions | `:36-43` | `finding:F-U2-2` | "Each phase's `*Prepare:*` directive … lists the exact files" vs 6 directives / 15 rows. |
| 34 | map file index | `:45-61` | `holds` | 13 rows + the map itself = 14 files (`assemble.ts:120-127`); "35 subsections" = 35 headings. |
| 35 | map token footnote and peak-working-set claim | `:29-34` | `finding:F-U2-3` | 8,000 ≠ 9,200; 73% derives from 8,000. |

## Findings

| ID | Severity | Finding | Predicate |
|---|---|---|---|
| F-U2-1 | **P0** | The Holonovel coverage map claims mechanical verification that does not exist. | `03-build.md:1931-1936` vs `validate.ts:922-925` (slice `:1428`–`:1690`). |
| F-U2-2 | **P0** | The map says every phase carries a directive naming its files; 6 of 15 rows do, and the page elsewhere says directives do not specify file lists. | `build-phase-map.md:41-42` vs `:7-9`; `grep -c '\*Prepare:\*'` = 6; `validate.ts:1343-1377` iterates directives only. |
| F-U2-3 | **P0** | The stated peak working set contradicts the row it names. | `build-phase-map.md:33` (8,000, Convergence) vs `:18` (9,200); 73% = (30000−8000)/30000. |
| F-U2-4 | **P0** | The Editorial delta class claims tooling-only edits, which the classifier assigns to `patch`. | `03-build.md:2022` vs `spec-delta-classify.ts:47` (patch when nothing was added/removed/modified and no section changed). |
| F-U2-5 | **P0** | The construction section says six steps above a seven-row table. | `03-build.md:455,460` vs `:464-470`. |
| F-U2-6 | **P3** | The map's hash and §5-count predicates are warnings, so a stale map does not block; `AGENTS.md` calls the count "guarded". | `validate.ts:2464-2471`; AGENTS.md's wording is U8's surface. |

## Counts

- Rows: **35** (`grep -cE '^\| [0-9]+ \|' review.md`).
- Verdicts: 19 `holds`, 11 `builder-side`, 5 `finding`.
- Findings: **5 P0** (F-U2-1…5, all fixed in this increment) + **1 P3** (F-U2-6, record-and-close).
