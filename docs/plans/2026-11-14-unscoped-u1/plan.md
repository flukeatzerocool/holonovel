# Plan — U1: foundations and constitution review (chunk 1 of 8)

Status: draft v2 (resolves the cold pass on v1: 1 Blocker, 6 Majors, 7 Minor,
3 Nit — see Resolutions) · Kind: planned · Depth: standard
Increment target: `docs/plans/2026-11-14-unscoped-u1/`
Rollback cost: 1 (one revert: `review.md` (new), register rows, `worklist.md`
status lines, the roadmap trigger line, the bounded prose fix set, `CHANGELOG.md`)
Evidence class: repo (two `tool-output` commands, EV1/EV2, recorded with the
exact command)
Trust boundary: every premise is read from the working tree at HEAD `7566005`;
no web, user, or fetched content enters the plan.

## Resolutions (cold pass v1 → v2)

- **B1 — the row budget did not add up.** Appendix M's `**SDD enforcement
  rules.**` block (`spec/appendices-reference.md:2939`) was counted twice: once
  as eleven enforcement bullets, once as a prose block. The prose-block count is
  **11**, not 12, and the budget is **80** rows, not 81. Every count and every
  acceptance command now reads 80. The granularity rule is stated in D1 so the
  arithmetic is auditable.
- **M1 — `check:fast` was scheduled before `aar.md`.** `check-loop-artifacts`
  requires plan, tasks, **and** an AAR with a terminal token. Phase 4 now runs
  the five non-loop gates, writes the AAR, then runs `check:fast` and the
  close.
- **M2 — `action-conflicts` was misclassified as report-only.** It is gated
  with `--check` in both modes (`scripts/lib/gate-manifest.ts:262-265`), while
  Appendix M (`:2847-2848`) says "report-only; not a gate". That contradiction
  is itself the increment's first demonstrated drift; C-11 records it and the
  expected P0 prose fix.
- **M3 — two named code targets were unreviewed.** `scripts/lib/parse-spec.ts`
  is the parser substrate the shape predicates run on, and
  `check-script-discipline.ts` / `check-script-quality` enforce AGENTS.md script
  discipline, not a §1–§4/Appendix A/M rule. Both are now explicit boundary
  statements with a verification step, not silent omissions.
- **M4 — bucket B was treated as evidence.** `spec/audit/req-coverage.md:4`
  defines B as "cited, no exercised test". `holds` now requires bucket C (or an
  explicit D/E justification); a bucket-B rule becomes a finding or a recorded
  gap.
- **M5 — `Deferred-by-user` was missing** from the terminal-disposition list
  (AGENTS.md "Register hygiene"; `review-register.md:3060`).
- **M6 — `LOOP OPEN` cannot close.** `session:close` refuses it
  (`docs/plans/README.md:62-63`); the done bar and task list now require
  disposition then `LOOP PAUSED`.
- **Minors.** EV8's fingerprint set now cites `scripts/lib/contract-fingerprint.ts`
  and both lists; the terminology table is 88 entries, not 97 lines; a
  P0-overflow is a plan-amendment stop, not a silent schedule; the guarded gate
  runs `--base HEAD` (a bare invocation scans an empty index); the loop-gate
  trigger is fourteen days out; the split wording is consistent; Appendix A's
  range is `:3-49` everywhere.
- **Nits.** D1 states the granularity rule; `review.md` is named as an
  increment-local artifact and its acceptance by the close is confirmed in
  Phase 4; the finding-parity greps are anchored.

## Questions

1. **Which roadmap item is next?** `ROADMAP.md:15-32` — the
   Unscoped-surface review sweep (P2). Its `**Trigger:**` (`:30-32`) names the
   next allocated review session as **U1, foundations and constitution**. The
   three other open items are later: harness test-ID hygiene (P2), anchor
   repoint automation (P2), and the loop-gate re-measurement whose trigger is
   the date 2026-11-28 (`:66-76`) — fourteen days out.
2. **What does U1 owe?** `docs/plans/2026-11-10-unscoped-surface-review/worklist.md:100-113`
   defines the chunk: prose §1–§4, Appendix A, Appendix M; code
   `scripts/validate.ts`, `scripts/lib/req-checks.ts`, `scripts/lib/parse-spec.ts`,
   `scripts/check-guarded-rule-change.ts`, `scripts/check-script-discipline.ts`;
   lens `drift-report` (each standing rule ↔ the check that enforces it) plus
   `spec-review`; exit evidence is one row per §1–§3 subsection, §4 rule,
   Appendix A block, and Appendix M rule, where every rule either maps to an
   enforcing check or carries a recorded gap finding.
3. **Is the chunk session-achievable?** Measured below: 80 verdict rows over
   ~700 prose lines and ~25 named validator predicates. The program's own
   close recommends U1 as the cheapest chunk
   (`docs/plans/2026-11-10-unscoped-surface-review/aar.md`, Recommendations).
   No split is planned; if one becomes necessary it is a plan amendment
   recorded in `worklist.md` (`D-split`), never a done-bar escape hatch.
4. **What counts as a finding?** A rule that states or implies an enforcement
   the tooling does not perform, or prose that contradicts the predicate it
   cites. A rule that declares itself non-mechanical (Standing Rule 8;
   Appendix M's assertion-relevance, trust-the-loop, and EARS entries) is
   compliant by declaration, not a gap (`D2`).

## Baseline at HEAD (this session)

| # | Evidence | Command / source | Trust |
|---|---|---|---|
| EV1 | Tree clean on `main`, HEAD `7566005`, 89 unpushed commits, oldest 5.9 d, version `2026.11.14`, 4 open roadmap items | `npm run status`, `git status --porcelain` | tool-output |
| EV2 | Fast gate green: 41 passed, 0 failed, `check:fast: PASS` | `npm run check:fast` (un-piped) | tool-output |
| EV3 | The roadmap item and its trigger | `ROADMAP.md:15-32` | repo |
| EV4 | Chunk U1 targets, lens, gates, exit evidence; status table; mapping invariant | `worklist.md:87-98`, `:100-113`; program `plan.md:72-77` | repo |
| EV5 | Measured prose surface: §1 `:104`, §2 `:191`, §3 `:215`, §4 `:1` (rules `:12-76`, terminology `:80-177`, stack `:178-183`, distribution `:185-189`), Appendix A `:3-49`, Appendix M `:2776-3039` | `grep -n '^## \|^\*\*[A-Z]' spec/01-foundations.md spec/01a-constitution.md`; `sed -n` block counts | repo |
| EV6 | Measured enforcement surface: 33 named `check*` predicates in `scripts/validate.ts` (2707 lines) and 19 exported checks/helpers in `scripts/lib/req-checks.ts` (556 lines) | `grep -c '^function check' scripts/validate.ts`; `grep -c '^export function' scripts/lib/req-checks.ts` | repo |
| EV7 | The `validate` gate runs `validate:sdd` in full mode and `validate:fast` in fast mode | `scripts/lib/gate-manifest.ts:33-36`; `package.json:9,12,60` | repo |
| EV8 | §1–§4, Appendix A, and Appendix M are **not** fingerprinted. `scripts/lib/contract-fingerprint.ts:27,37-43` hashes two sets: package-format (§5.16, §5.17, §6.3, §6.4.2) and data-format (§5.6, §5.9, §5.19, §5.21–§5.28, §5.31, §5.32, §7.7, Appendix Q) | `scripts/lib/contract-fingerprint.ts:27,37-43`; `AGENTS.md` "Before committing spec changes" | repo |

## Surface inventory (the row budget)

One row per unit, as the worklist requires and as D1 defines the unit. The row
count is the done bar's countable form.

| Surface | Anchor | Rows |
|---|---|---|
| §1 Mission and Play Model | `spec/01-foundations.md:104-189` | 1 |
| §2 Requirements at a Glance | `spec/01-foundations.md:191-211` | 1 |
| §3 How This Build Fails (8 modes + 8 fault trees) | `spec/01-foundations.md:215-294` | 1 |
| §4 standing rules 1–12 | `spec/01a-constitution.md:12-76` | 12 |
| §4 Technology stack, Distribution | `spec/01a-constitution.md:178-189` | 2 |
| §4 terminology table (88 entries on 97 lines) | `spec/01a-constitution.md:80-177` | 1 |
| Appendix A blocks (encoding, headings, role scoping, tables, bold labels, defect classes, other elements, classification) | `spec/appendices-reference.md:3-49` | 8 |
| Appendix M authoring checklist | `spec/appendices-reference.md:2783-2886` | 32 |
| Appendix M SDD enforcement rules | `spec/appendices-reference.md:2942-2958` | 11 |
| Appendix M prose blocks (prose readability `:2896`, REQ-body readability `:2904`, reference-prose `:2916`, REQ anatomy `:2923`, provenance `:2932`, bloat prevention `:2965`, what-belongs-elsewhere `:2975`, trust-the-loop `:2997`, guidance boundaries `:3001`, EARS `:3012`, convergence-driven review `:3029`) | `spec/appendices-reference.md:2896-3037` | 11 |
| **Total** | | **80** |

The terminology table is one row because `checkCrossRefs`
(`scripts/validate.ts:323`) already resolves every `REQ-NNN` citation in it, and
the table's own rule (vocabulary registration) is reviewed under Appendix M
(`:2823-2825`). The row records both facts and a duplicate-name check against
Appendix S (Builder Glossary, `:3373`) and Appendix R (Deprecated Terminology,
`:3336`).

## Enforcement surface to map against

Read once in Phase 1; each row cites the predicate it resolved to, not a gate's
message (`AGENTS.md` "Finding evidence").

| Predicate | Anchor | Severity today |
|---|---|---|
| `checkReqShape` (paragraphs, tables, bullets, steps, SHALL > 8) | `scripts/validate.ts:223-263` | error under `--sdd-strict` (`:2245`) |
| `checkSpecViolations` (800 chars, param types, `Default:`, >5 token catalog) | `:188-221` | error under `--sdd-strict` |
| `checkReqIdGrammar`, `checkEmptyReqBodies`, `checkTruncatedReqBodies` | `scripts/lib/req-checks.ts:6,21,36` | error under `--sdd-strict` |
| `checkFamilyCheckCoverage` (one `_Check:_` per REQ family) | `req-checks.ts:167` | error under `--sdd-strict` |
| `checkReqDefaultClauses`, `checkReqThresholds`, `checkReqWorkedExamples`, `checkReqProceduralContent` | `req-checks.ts:203,238,220,190` | error under `--sdd-strict` |
| `checkAmbiguity` (hedging, vague qualifiers) | `validate.ts:266` | warning |
| Readability: REQ grade 18 `:614-623`, §0–§4 narrative grade 12 `:626-635`, reference prose grade 18 `:636-647`, scorer `:471-474` | `validate.ts` | warning |
| `reportSectionCounts` (per-section REQ counts, no threshold) | `validate.ts:802-819` | informational |
| `checkCouplingCompleteness`, `checkConfigCouplingAnnotations`, `checkConfigSurfaceParity` | `validate.ts:1046,1270,1623` | error |
| `checkImplCoverage`, `checkDirectEvidenceForNewReqs` | `validate.ts:2022,1570` | error in strict impl audit |
| `checkDecisionsCitations`, `checkToolTokenDrift`, `checkPropertyGroupCount`, `checkBaseCapabilityDefaults` | `req-checks.ts:51,544,111,263` | error |
| `action-conflicts --check` (action-contract candidates, manual adjudication) | `scripts/lib/gate-manifest.ts:262-265`; `scripts/action-conflicts.ts` | **gated in both modes** |
| Guarded co-change (Appendix M rule + validator pattern in one diff) | `scripts/check-guarded-rule-change.ts`; `scripts/lib/guarded-rule.ts` | error (staged diff, or `--base <ref>`) |
| `compare-spec-code --dedicated` (bucket-C shared-evidence report) | `scripts/compare-spec-code.ts:582,589-601` | report-only; absent from the gate manifest, but invoked by the publication pipeline (`scripts/publish/steps.ts:258` — confirmed in Phase 1) |

Two named code targets do not carry verdict rows, and the boundary is stated
rather than implied:

- `scripts/lib/parse-spec.ts` is the parser substrate (`readSpec`,
  `extractReqBodies`, `extractReqHeaders`) the shape predicates run on. A parse
  defect surfaces as a wrong row verdict, so Phase 1 verifies the substrate is
  what the predicates claim (one read) and records that in the mapping table.
- `scripts/check-script-discipline.ts` and `check-script-quality` enforce
  AGENTS.md script discipline, not a §1–§4 or Appendix A/M rule. They are
  recorded as an out-of-chunk boundary in `worklist.md` in the same increment
  (M3), not reviewed here.

Outside U1's boundary (recorded, not reviewed): `checkSectionIndexCompleteness`,
`checkPhaseMap*`, fingerprint sync, and every §5/§7/§8 check.

## Pre-review candidates

Each candidate is checked against its predicate in Phase 2. A candidate that
does not survive becomes `holds` with the predicate cited; it is not a finding
and is not restated. C-11 is the exception: its predicate is already confirmed
against the gate manifest, so it enters the increment as a P0 correction rather
than as a hypothesis.

| ID | Claim to test | Probe |
|---|---|---|
| C-1 | §4 rule 9 (ruleset-free skip, `:36-42`) names a DECISIONS.md annotation no gate consumes | `grep -rn "ruleset-free" scripts holonovel/scripts` — current result: five unrelated hits (registry and replay comments, `validate.ts` dispositions); no consumer of `ruleset-free — skipped` |
| C-2 | §4 rule 10 (`:43-53`) says tool names in narrative prompts are "verified at G4 and G5" — confirm a harness actually scans prompt text for registered tool names, or record the gap | `grep -rn "G4/\|G5/" holonovel/scripts` — current result: two titles in `test-output-contracts.ts:1013` (G4/REQ-200) and `:1027` (G5/REQ-067), neither a prompt-text scan; then grep every harness for a prompt-text tool-name assertion |
| C-3 | §4 rule 12 (`:71-76`) claims atomicity is mechanically enforced by `check`; confirm the gate path reaches `--sdd-strict` and that "no exceptions" holds | `package.json:9,60` → `gate-manifest.ts:33-36` → `validate.ts:50` → `:2245` |
| C-4 | Appendix M assertion relevance (`:2849-2855`) calls `--dedicated` report-only — confirm it is absent from the manifest and check whether the publication pipeline treats a non-zero report as a block | `grep -n "dedicated" scripts/compare-spec-code.ts scripts/lib/gate-manifest.ts scripts/publish/steps.ts` |
| C-5 | Appendix M "Bloat prevention" (`:2965-2973`) calls the 40-REQ indicator mechanical while `reportSectionCounts` only prints — decide whether "reports counts" satisfies the claim | `validate.ts:802-819` |
| C-6 | Appendix M "Gating consistency" (`:2859-2862`) and "Provenance" (`:2932-2937`) name no check; confirm no predicate covers them | `grep -rn "gating consistency\|CHANGELOG entry SHALL cite" scripts` |
| C-7 | Appendix M "Mechanical consequences" (`:2873-2879`) lists five artifacts; confirm each has a gate (`--write-register` freshness, direct test prefix, runtime config list, fingerprint) | `checkCoverageRegisterFresh :2115`; `checkDirectEvidenceForNewReqs :1570`; `checkConfigSurfaceParity :1623` |
| C-8 | Appendix M prose-readability exemption ("the numbered Standing Rules of §4 … are exempt", `:2901-2902`) matches the §-set the scorer walks | `validate.ts:626-635` |
| C-9 | §4 rule 11 (`:54-70`) claims assembly-time verification and `spec_health` reporting; confirm both consumers exist | `checkCouplingCompleteness :1046`; `spec_health` config section |
| C-10 | Appendix A is builder-consumption prose (`:46-49` defers enforcement to §6.5); confirm no rule in it claims a gate | read `:3-49`; `grep -n "Appendix A" spec/02-requirements.md spec/03-build.md` |
| C-11 | **Pre-confirmed drift.** Appendix M (`:2847-2848`) calls `action-conflicts` "report-only; not a gate", but `gate-manifest.ts:262-265` gates `action-conflicts --check` in both modes | predicate already confirmed; becomes the increment's first P0 prose correction |

## Objective

Close chunk U1 with an evidence-backed verdict for every unit of its declared
surface, so that the rule-to-check question the program's close called "the
cheapest chunk … it can close the 'rule without an enforcing check' question
for every later chunk" is answered once, durably, and in the register's
disposition vocabulary.

## Done bar

**Done bar:** 80 verdict rows with a cited predicate, every finding terminally
dispositioned, zero unfixed P0, the program record advanced, and the gates green
— the numbered list below is the authoritative form.

1. `review.md` in this directory holds **80 verdict rows** (counted by
   `grep -cE '^\| [0-9]+ \|' review.md`) — the table in "Surface inventory" is
   the budget — each carrying surface, anchor, a verdict
   (`holds` / `finding:<ID>` / `builder-side`), and the predicate or declaration
   that settles it (`file:line`, or the declaring clause's anchor).
2. Every non-`holds`, non-`builder-side` row carries a finding ID, and every
   finding ID has a terminal disposition in `spec/audit/review-register.md`:
   `Resolved`, `Scheduled-roadmap` (with a matching `ROADMAP.md` section),
   `Closed-P3`, or `Deferred-by-user`.
3. All eleven pre-review candidates are resolved to `holds` or a finding; none
   is left "unverified". C-11 is already confirmed and is fixed as a P0.
4. Zero P0 findings remain unfixed. A P1 finding is on `ROADMAP.md` in
   admission-rule shape (1–3 bullets plus one `**Trigger:**`); `check-roadmap`
   passes.
5. `worklist.md:91` records U1 as reviewed with its exit evidence, its
   out-of-chunk boundary note (M3), and the next chunk; the `ROADMAP.md` trigger
   (`:30-32`) names U2.
6. The five non-loop gates pass un-piped (`assemble` only if a `spec/` file
   changed; `check-registers`; `check-roadmap`; `check-fingerprint-sync`;
   `check-guarded-rule-change --base HEAD`), then `aar.md` is written ending
   `LOOP PAUSED`, then `npm run check:fast` passes with `check:fast: PASS`, then
   `npm run session:close`.
7. No §5 REQ body changes; no fingerprint regeneration; no push. `aar.md`
   records the row count, the finding count by severity, and the gate results.

## Blast radius

| File | Change | Size |
|---|---|---|
| `docs/plans/2026-11-14-unscoped-u1/{plan,tasks,review,aar}.md` | new increment record; `review.md` is the 80-row verdict table (increment-local artifact, `D4b`) | L (new content) |
| `spec/audit/review-register.md` | one dated `### 2026-11-14 U1 foundations and constitution` heading under `Resolved`, plus rows under `Scheduled-roadmap` / `Closed-P3` / `Deferred-by-user` as the findings require | S–M |
| `docs/plans/2026-11-10-unscoped-surface-review/worklist.md` | U1 status line `:91` gains its exit evidence, closure, and the script-gate boundary | S |
| `ROADMAP.md` | trigger line `:30-32` names U2; a new section only if a P1 finding schedules work | S |
| `spec/appendices-reference.md` | C-11's P0 prose correction (`:2847-2848`), plus any further bounded P0 corrections (`D3`); expected ≤10 lines | S |
| `spec/01-foundations.md`, `spec/01a-constitution.md` | **conditional** — bounded P0 prose corrections (`D3`) | S |
| `spec/audit/proofread-register.md` | **conditional** — only if a readability warning is accepted rather than fixed | S |
| `holonovel.md` | regenerated by `npm run assemble` if a `spec/` file changed | S |
| `CHANGELOG.md` | dated entry, `2026-11-14` | S |

Not touched: §5 REQ bodies, `scripts/**`, `holonovel/src/**`,
`contract-fingerprints.ts`, `spec/audit/req-coverage.md`, the roadmap's other
sections.

## Phases and tasks

### Phase 1 — Build the mapping, then read

1. Read each predicate in the enforcement table once; for each, record the
   exact condition it tests and whether it errors, warns, prints, or reports.
   Batch the reads; stop at `scripts/validate.ts` main-sequence wiring
   (`:2235-2260, 2360, 2438-2443`) once severity is settled.
2. Confirm the two boundary facts (M3): that `scripts/lib/parse-spec.ts` is the
   substrate the shape predicates call, and that `check-script-discipline` /
   `check-script-quality` enforce no §1–§4 or Appendix A/M rule. Record both in
   `review.md`'s mapping table; amend `worklist.md` in Phase 4.
3. Read `scripts/lib/contract-fingerprint.ts:27,37-43` and record the two
   fingerprint sets (EV8) so D5 rests on the file, not on agent memory.
4. Record the `--sdd-strict` path end to end: `package.json:9` (`validate:sdd`)
   → `package.json:60` (`check`) → `scripts/lib/gate-manifest.ts:33-36` →
   `validate.ts:50` (`sddStrict`) → `:2245,2254,2360,2438` (error emission).
   This settles C-3 and is the spine for reading every Appendix M enforcement
   claim.
5. Probe the `--dedicated` report-only claim end to end (`C-4`):
   `scripts/compare-spec-code.ts:589-601` and its invocation at
   `scripts/publish/steps.ts:258`.
6. Create `review.md`: header, mapping table, 80 empty numbered rows with
   surface + anchor.

### Phase 2 — Write the verdicts

7. §1–§3 (3 rows): §1's eight blocks and §2's manifest framing are `holds`
   unless a claim is false (e.g. a cited file or gate that does not exist);
   §3's eight failure modes are checked for a live guard per named mitigation
   (`REQ-058`, `REQ-011`, `G0b`, `H3/H4`, `REQ-055`, `H11`, `REQ-201`,
   `REQ-379/381`), since a mode with no guard is the page's own promise. A
   mode whose guard does not exist is a finding.
8. §4 rules 1–12 (12 rows): map each rule to (a) its cited REQ and that REQ's
   coverage bucket in `spec/audit/req-coverage.md`, and (b) a predicate or a
   declared non-mechanical status. A rule that cites a REQ but no check is
   `holds` only when the bucket is **C** (evidenced by an exercised test) or
   when the bucket is D/E with its own justification; a bucket-B rule (cited,
   no exercised test — `req-coverage.md:4`) is a finding or a recorded gap
   (`M4`). A finding also arises when the rule claims a *mechanical check* that
   does not exist (`D3`).
9. §4 stack/distribution (2 rows) and the terminology table (1 row): resolve
   citations via `checkCrossRefs`, and spot-check term names against Appendix S
   and Appendix R. A duplicate with a differing definition is a finding.
10. Appendix A (8 rows): each block is builder-consumption prose; a block is
    `builder-side` when it defers enforcement to §6.5 or a verification
    workflow, and a finding only if it claims a gate that does not exist.
11. Appendix M checklist (32 rows): confirm each item's mechanism — validator
    predicate, gate, report-only detector, or declared non-mechanical status
    (assertion relevance `:2849`, red-team `:2798`, EARS `:3012`). Record the
    mechanism's anchor beside the verdict.
12. Appendix M SDD enforcement rules (11 rows): each must resolve to a
    predicate under `--sdd-strict`; a bullet with no predicate is a finding
    (`C-3`).
13. Appendix M prose blocks (11 rows): readability standards against the scorer
    (`:614-647`), the 40-REQ bloat indicator against `reportSectionCounts`
    (`:802-819`, `C-5`), and the remaining blocks against their named consumer
    or declared non-mechanical status.

### Phase 3 — Triage and fix (`D3`)

14. Rank findings P0–P3 exactly as `AGENTS.md` "Review-loop governance"
    defines them. P0 = demonstrated wrong prose (the page states an enforcement
    or mechanism that the predicate disproves) and is fixed in-session. P1 = a
    load-bearing rule whose check is genuinely missing — scheduled on
    `ROADMAP.md`. P2 needs a demonstrated failure. P3 = record-and-close.
15. Apply the P0 prose corrections, starting with C-11 (`action-conflicts` is
    gated, not report-only). Constraints: no §5 body edits; no simultaneous
    edit of Appendix M and `scripts/lib/req-checks.ts` / `scripts/validate.ts`
    (that is the self-attesting co-change `check-guarded-rule-change` blocks
    without a register entry — if a fix needs both, schedule the check as P1
    instead). Re-read each edited paragraph against `validate.ts:626-635`: the
    grade-12 bar applies to §1–§4 narrative, so a correction rewrites rather
    than appends, and the `proseReadability`/`referenceProse` warning count must
    not increase.
16. Write the register entries under one dated `### 2026-11-14 U1 foundations
    and constitution` heading; each row cites the predicate (`file:line`) that
    settles it. Scheduled rows get their `ROADMAP.md` section in the same step
    (`check-registers` couples them).

### Phase 4 — Bookkeeping, gates, close

17. Update `worklist.md:91` with U1's exit evidence and the script-gate
    boundary; edit the `ROADMAP.md` trigger to name U2.
18. Write the `CHANGELOG.md` entry dated `2026-11-14`.
19. Run the five non-loop gates, capturing un-piped exit codes: `npm run
    assemble` (only if a `spec/` file changed) → `npm run check-registers` →
    `npm run check-roadmap` → `npm run check-fingerprint-sync` → `npm run
    check-guarded-rule-change -- --base HEAD`. Confirm `review.md` is accepted
    as an extra increment file by `check-loop-artifacts` (`D4b`).
20. Write `aar.md` (row count, findings by severity, dispositions, gate
    results) ending `LOOP PAUSED`. If the AAR earns `LOOP OPEN`, disposition the
    named item first and re-run the AAR — the close refuses `LOOP OPEN` (M6).
21. `npm run check:fast` un-piped (`check:fast: PASS`), then `npm run
    session:close` (which re-runs the fast suite and commits).

## Readings (decisions taken in this plan)

- **D1 — the row is the unit, and the budget is the count.** A row is one
  `##`/`###` section or one enumerated rule: §1–§3 are sections with no
  numbered rules, so one row each (3); §4's twelve numbered rules (12) plus
  its technology-stack, distribution, and terminology blocks (3);
  Appendix A has no subheadings, so its eight bold blocks are the enumerable
  units (8); Appendix M's 32 checklist items, 11 enforcement bullets, and 11
  bold standards are enumerated (54). `3+12+3+8+54 = 80`. A verdict is one of
  `holds`, `finding:<ID>`, or `builder-side`; there is no `n/a` — an
  inapplicable unit is `holds` with the reason ("no enforceable claim").
- **D2 — a declared non-mechanical rule is compliant.** Standing Rule 8
  (`:26-35`) says it is not a mechanical check; Appendix M's assertion
  relevance (`:2849-2855`), trust-the-loop (`:2997-2999`), and EARS
  (`:3012-3027`) declare their own status. These are `holds` with the
  declaration cited, not gaps. A finding requires prose that claims an
  enforcement the tooling does not perform.
- **D3 — fix the prose or schedule the check, never both in one increment.**
  When the prose overclaims, correcting it is in-session (P0). When the rule is
  load-bearing and the prose is right, the missing check is P1 and goes to
  `ROADMAP.md`. Appendix M and the validator patterns are never edited in the
  same diff without a register entry naming the rule.
- **D4 — the terminology table is one row, not 88.** Citation resolution is
  already `checkCrossRefs`; the row records that fact plus a duplicate check
  against Appendices S and R. Splitting it into 88 rows would add paper, not
  evidence.
- **D4b — `review.md` is increment-local.** `docs/plans/README.md:15-19`
  documents plan/tasks/AAR; the verdict table is this chunk's evidence artifact
  and later chunks reuse the name. The close's acceptance of an extra file is
  confirmed at task 19 before the AAR is written.
- **D5 — no fingerprint work.** No fingerprinted section is edited (EV8); the
  gate still runs in Phase 4 to prove it. If a P0 correction were to land in a
  fingerprinted section (it cannot — none is in scope), `build-order` would be
  required; that is a plan-amendment trigger, not an improvisation.
- **D6 — findings are `F-U1-<n>`.** The program has no IDs yet; this chunk
  starts the series. Register placement follows the existing file: `Resolved`
  (top section), `Scheduled-roadmap`, `Closed-P3`, `Deferred-by-user`.
- **D7 — the program record moves with the chunk.** `worklist.md:91` and the
  roadmap trigger are updated in this increment; leaving U1 "scheduled" after
  it is reviewed would make the next session redo it.
- **D8 — `review.md` is the evidence, the register is the disposition.** The
  register does not restate rows; it carries findings only
  (`AGENTS.md` "Register hygiene").

## Alternatives considered

- **Review U1 as one prose pass without the predicate map.** Rejected: the
  chunk's lens is rule ↔ enforcing check, and a prose-only read cannot
  distinguish "no check because none is claimed" from "no check although the
  page promises one" — the exact distinction the register disposition depends
  on.
- **Split U1 into U1a (§4 + Appendix M) and U1b (§1–§3 + Appendix A).**
  Rejected for now: the program's close names U1 as the cheapest chunk, the row
  budget is 80, and a split doubles the bookkeeping (two AARs, two register
  headings, two roadmap trigger edits) for a surface that shares one predicate
  map. If Phase 2 shows the enforcement half genuinely needs its own session,
  the amendment records the split in `worklist.md` the way the 2026-11-09 sweep
  split P3/P6/P7 — recorded as an amendment, never used against the done bar.
- **Fix every finding in-session.** Rejected: writing a new validator predicate
  is a spec-tooling change with its own blast radius (validator self-tests,
  `test:validators`, the authoring-rule fingerprint). That is a separate
  increment, and bundling it would raise the rollback cost to 2.
- **Turn `compare-spec-code --dedicated` into a gate as part of U1.** Rejected:
  it is report-only because the false-positive rate is unmeasured and the
  detector over-flags on the current corpus; gating it here would assume the
  rate. (`action-conflicts` is the opposite case: already gated, with prose
  that says otherwise — C-11.)
- **Treat Appendix A as a gate surface.** Rejected: its final paragraph
  (`:46-49`) hands enforcement to §6.5 and the builder's structural pass. Its
  rows are `builder-side` unless a block claims a check.

## Edge cases and rollback

- **A candidate dissolves.** Record `holds` with the predicate; do not keep the
  hypothesis in the register (C-1…C-11 are plan scaffolding, not findings).
- **A row needs a predicate that does not exist.** That is a finding, not a
  blocker: P1 if the rule is load-bearing, `Closed-P3` if it is advisory.
- **A P0 fix would exceed ~10 lines.** Stop and amend the plan (or hand the
  scope decision to the user). A large prose rewrite is a different increment
  and would break the grade-12 budget; a demonstrated P0 is never silently
  scheduled (AGENTS.md: P0 is "fix in-session").
- **The register edit collides with `check-registers`.** The register couples
  `Scheduled-roadmap` rows to roadmap sections; write both in the same step
  (plan step 16).
- **`check-loop-artifacts` is red until `aar.md` exists.** Expected: the
  directory is a working increment. The five non-loop gates run before the
  AAR; `check:fast` and the close run after it (plan steps 19–21).
- **Rollback:** one `git revert`. `review.md` is additive, the register rows
  are additive, and a conditional prose fix is a small hunk set.

## Verification

| Check | Command | Expected |
|---|---|---|
| Row budget | `grep -cE '^\| [0-9]+ \|' docs/plans/2026-11-14-unscoped-u1/review.md` | 80 |
| Finding-count parity | `grep -cE '^\| [0-9]+ \| .*finding:F-U1-' review.md` vs `grep -cE '^\| F-U1-[0-9]+|^- \*\*F-U1-[0-9]+' spec/audit/review-register.md` | equal |
| Assemble (conditional) | `npm run assemble` | exit 0 |
| Registers | `npm run check-registers` | exit 0 |
| Roadmap admission | `npm run check-roadmap` | exit 0 |
| Fingerprints | `npm run check-fingerprint-sync` | exit 0 |
| Guarded co-change | `npm run check-guarded-rule-change -- --base HEAD` | exit 0 (or acknowledged by a register entry) |
| Prose budget | `npm run validate:sdd` | `proseReadability`/`referenceProse` warnings ≤ baseline |
| Fast gate (after AAR) | `npm run check:fast` (un-piped) | `check:fast: PASS` |

## User impact

None at runtime. No tool, schema, output, or persisted-state change; no
restart or migration. Maintainers gain `review.md` (the rule-to-check map for
§1–§4 and Appendices A/M) and register rows for every gap it demonstrates. A
P0 fix changes spec prose only — C-11 corrects one Appendix M sentence to match
the gate that already exists.

## Deferred / scheduled

- Everything U1 finds and does not fix lands in `spec/audit/review-register.md`
  with a terminal disposition, and any P1 lands on `ROADMAP.md`.
- Chunks U2–U8 stay scheduled; the trigger advances to U2 at close.
