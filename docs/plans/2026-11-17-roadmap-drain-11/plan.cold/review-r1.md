# Independent cold review — Roadmap drain 11 (r1)

Reviewer: review subagent (opencode-go / deepseek-v4.1-flash) — single cold dispatch
Plan sha256: fbd4811c5fb70f503aa41f6c11b6c2c924be86d7a3a624ec449503cfe4e3b584
Artifact: /home/fluke/Holonovel/docs/plans/2026-11-17-roadmap-drain-11/plan.md (346 lines)
Companion: tasks.md · Evidence: plan.evidence.md (git HEAD 430e2bb, plan sha256 matches)
Reads used: 38 of 40 · Stages run: 5

## Method / isolation caveat

Nesting is prohibited in this dispatch, so the five stages ran sequentially in one context instead of five fresh contexts. Stage 2 read the artifact only (no target files) before any target read, so comprehension is not contaminated by the tree. A host injected `holonovel/AGENTS.md` mid-run (the plan cites "the repo's AGENTS.md", so it is a cited standard, not smuggled context); that injection is recorded as an isolation weakening, not a defect.

Not re-openable (accepted as premises): closing ROADMAP item 3 in this increment; the reviewed per-row baseline over re-citing 46 rows to Manual. No disagreement is raised with either.

---

## Stage 1 — Zoom out

The document holds together on its own terms: goal (close ROADMAP item 3 by meeting its stated trigger), mechanism (assert the one assertable row, ratify the rest in a reviewed per-row baseline, flip the check to error mode), done bar (`plan.md:325-329`) and verification table (`plan.md:311-321`) are present and consistent in shape. Claims spot-checked against the tree that hold:

| Claim | Evidence |
|---|---|
| corpus carries 47 data rows | `rg -c '^\| REQ-'` on `corpus.md` = 47 |
| linkage predicate is T-ID-scoped, `automated-unexercised` at `req-checks.ts:886-889` | confirmed verbatim |
| `labelsFromContent` collects `test`/`check`/`.push`/`console`/`return` literals inside `function check*(): string[]` | `req-checks.ts:790-796, 812-870` |
| `gatherExercisedIds` = harness `test(` titles + root `check*` labels | `validate.ts:1497-1517` |
| `warnings += linkage.length` at `validate.ts:2985` | confirmed |
| one `@section evidence` (line 2511), six labels at 2513-2518 | confirmed (`rg -c '@section evidence'` = 1) |
| T87 row and its ≤1 s sentence at `appendices-reference.md:1569` | confirmed |
| REQ-100a forbids a latency threshold; REQ-100b owns tiers; REQ-100d owns per-category recording | `02-requirements.md:2406, 2409, 2415` |
| no existing script parses the record fields | `rg 'Environment pins\|Pass/fail' scripts/` → only an unrelated `@section evidence-` string |
| AGENTS.md documents `--write-linkage-corpus` at line 420 | confirmed (419-422) |
| review-register `## Scheduled-roadmap` at :3086, last `## ` at :3850 | confirmed |
| `check-registers` Scheduled-roadmap REQ rule and date rule | `register-checks.ts:64-70`, `:61` |
| `npm run test:validators` = `scripts/test-req-checks.ts`, already tests the linkage helpers | `package.json:66`; `test-req-checks.ts:7, 701-814` |
| deleting `corpus.md` leaves `check-loop-artifacts` satisfied (plan/tasks/aar remain) | directory listing |
| Appendix F is not a fingerprinted section | AGENTS.md fingerprinted list (§5.9, §5.16-5.17, §6.3, §6.4.2, §7.7, §5.19, App. Q) |

Two statements do not survive against the tree, and one is a gate-level contradiction inside the plan's own phase order (B1, M1, M2 below).

## Stage 2 — Comprehension (artifact only, ≤200 words)

The increment stops a nine-chunk queue and executes the close action the queue item names. It (1) adds a pure `checkEvidenceRecordContract(decisionsText)` to `scripts/validate.ts` asserting the one `@section evidence` record in `holonovel/DECISIONS.md` against REQ-211c's field contract (six exact bold labels, canonical workflow token, ISO timestamp, `pass`/`fail`), so T253 stops being `automated-unexercised`; (2) deletes the "query latency ≤ 1 second" sentence from the T87 Appendix F row because REQ-100a says latency carries no threshold; (3) adds `spec/audit/evidence-linkage-baseline.json` holding 46 reviewed per-row dispositions (`server-drill` / `build-time` / `pattern-buffer-gap` / `operator` / `spec-conflict`) and flips the linkage check from warnings to errors gated by that baseline, failing closed on stale, invalid, unclassified and non-suppressible verdicts; (4) retires ROADMAP item 3, closes the review-register Scheduled-roadmap subsection, appends a Resolved section, regenerates the coverage register, documents `--write-linkage-baseline` in AGENTS.md and deletes the corpus.

Done means: `validate` prints `46 baselined, 0 unbaselined` and exits 0, five negative probes recorded, `check:fast` green, registers agree, `aar.md` ends `LOOP PAUSED`, one `session:close --single` commit.

Could not determine from the artifact alone: the baseline file's JSON shape (top-level keys, entry field names), and exactly when the coverage register must be regenerated.

## Stage 3 — Critics

**Design lens.** B1 is the design failure: the plan schedules the change that invalidates a gated artifact three phases before that artifact's regeneration, while three later acceptance lines require the gate green. M2 is an overclaim on the one row being asserted. The ratify-vs-assert boundary is otherwise clean; D3's verdict gate and the rejection of a count ratchet (`plan.md:170-172`) are right. Handled edge cases: missing baseline fails closed (`plan.md:168-169`), `null` DECISIONS.md mirrors the existing Manual skip (`plan.md:114-116` vs `req-checks.ts:891-892`), duplicate/stale keys, closed class set, writer determinism. Unnamed edge case: a baselined row whose kind flips `Automated`→`Manual` makes its entry `stale` and errors the gate — desirable, but not listed with the other `stale` cases, and a maintainer correcting a row will hit it.

**Structural lens.** Phase order is otherwise sound: P2/P4 both touch `validate.ts` and are sequenced; P3-before-P4 is correctly reasoned (`plan.md:260-263`). Missing step: the register regeneration is present but misplaced (B1). Ownership is clear for every blast-radius file except the baseline schema (M3).

**Style lens.** Naming drift: "class" carries two taxonomies (N2); the record's extent is defined twice differently (N1); `req` vs `reqId` inside one decision (M3). Otherwise terms land consistently (`finding`, `verdict`, `entry`, `stale`, `unbaselined`).

## Stage 4 — Re-zoom

Not triggered: read-only pass, no author edits. Stages 3 and 5 were cross-checked for contradiction; none introduced.

## Stage 5 — Readiness (strict go/no-go)

Unambiguous: both new signatures (`checkEvidenceRecordContract(decisionsText: string | null): string[]`, `plan.md:111-112`; `diffLinkageBaseline(findings, entries) → { unbaselined, stale, invalid }`, `plan.md:143-144`), the closed class set with a definition each (`plan.md:156-161`), key format (`plan.md:145`), suppression rule (`plan.md:146-148`), nine verification commands, rollback, per-phase accepts. Every target path exists except the file the plan creates (preflight agrees).

Not implementable without a further decision: the baseline file's schema (M3); and which phase regenerates the coverage register (B1) — following the plan literally yields a red `validate` at P3 and P4 with no instruction to fix it there.

---

## Findings

### Blocker

**B1 — [design] The coverage register goes stale in P2 but is regenerated in P5; three acceptance lines require it green first.**
`plan.md:209-211` states the register changes because "REQ-211's evidence cell moves from `—` to `T253`"; `plan.md:299-307` puts regeneration in P5; but `plan.md:291` requires "`npm run validate` stays at `0 error(s)`" at P3, `plan.md:295` requires `validate` to "exit 0" at P4, and `plan.md:313` (V1) requires "exit 0; `0 error(s)`". In the tree the freshness check is an **error**: `scripts/validate.ts:2210-2218` returns `"spec/audit/req-coverage.md is stale — regenerate with \`npm run validate -- --write-register\`"` and `:3120-3121` does `console.log("ERROR: …"); errors++`. T253 enters `exercisedIds` as soon as P2 lands — the check's own message literals are harvested (`scripts/lib/req-checks.ts:790-796` + `:854-870`, fed by `validate.ts:1511-1515`) and REQ-211c cites T253 (`spec/02-requirements.md:1453`) — so the REQ-211 row at `spec/audit/req-coverage.md:189` changes in P2, exactly as D7 says. Must change: make `npm run validate -- --write-register` part of P2's acceptance (immediately after T253 lands, beside the `46 finding(s)` reading) and reduce P5 to a verification run (`PASS: Coverage register is current`); restate P3/P4/V1. Second order: `renderCoverageRegister` is passed `specHash` (`validate.ts:3117, 3120`), so if the hash is rendered, P3's `assemble` is a second invalidation and the regeneration must be the last write before V1.

### Majors

**M1 — [design] The stated coverage-register diff predicate does not match the artifact.**
`plan.md:209-211` says the REQ-211 "evidence cell moves from `—` to `T253`"; the row is `spec/audit/req-coverage.md:189` → `| REQ-211 | … | E | S22 | — |`, i.e. the *Exercised tests* cell already reads `S22` and `—` is the §5.12-disposition column. `tasks.md:64` and `plan.md:301-302` compound it by naming a "`REQ-211c` row" that does not exist — the register is family-keyed, one row per REQ. Fix the expected diff text (e.g. "`S22` → `S22, T253`", confirmed from the row P1 prints) and the P5/tasks line.

**M2 — [design] The T253 claim omits REQ-211c's "sub-check enumeration".**
`spec/02-requirements.md:1453` requires the record to parse "workflow identifier, timestamp, environment pins, pass/fail status, and **sub-check enumeration**". D2's clauses (a)-(e) (`plan.md:116-127`) require only that `Findings` be non-empty — no enumerated sub-check structure. `plan.md:131-135` then says the T-ID "is claimed by clauses (a)-(e)" and lists only the per-workflow *extension* clauses as unclaimed. Either add a clause (the `(a)`/`(b)` bullets at `holonovel/DECISIONS.md:2519-2520` are the live shape) or record "sub-check enumeration" with the extension clauses in `dispositions.md` and soften the claim.

**M3 — [design] The baseline file's data structure is under-specified.**
D3 (`plan.md:143-169`) never states the top-level keys ("46 entries + class header" is all the blast radius says, `plan.md:242`), whether the `classes` header is authoritative or a mirror of `LINKAGE_CLASSES` (`plan.md:156-157` gives both, no precedence), or the entry field names — the key is built from `finding.reqId`/`finding.tid` (`plan.md:145`) while entries sort by "`req` then `tid`" (`plan.md:163`). Give the literal JSON skeleton and one entry, name the precedence (code wins; header mismatch is `invalid`), settle `req` vs `reqId`.

### Nits

**N1 — [clarity] The record's extent is defined twice, differently.** `plan.md:117-119` defines the record as "the dash-bullet set … ending at the first non-bullet, non-blank line"; `plan.md:128-130` says extra bullets "are not part of the record and are ignored, so a seventh bullet cannot satisfy a missing required field". Under the first definition a seventh labelled bullet *is* inside the record — and the live block already has four extra bullets in that run (`holonovel/DECISIONS.md:2519-2522`). Say "the contiguous bullet run is scanned for the six labels; bullets carrying other labels are ignored".

**N2 — [clarity] "Class" carries two taxonomies.** `plan.md:20-21` "class (a) at zero" is ROADMAP's chunk class (`ROADMAP.md:38`); `plan.md:157-161` uses "class" for `server-drill` … `spec-conflict`, and `plan.md:157` writes "class (a)-style". Rename the baseline set (e.g. "disposition class") in plan, JSON and check output.

**N3 — [clarity] The stated evidence for T253 being "exercised" is not what the predicate reads.** `gatherExercisedIds` does not see an executing assertion for a root-script check; it sees ID tokens inside `return`/`.push`/`console` literals of any `function check*(): string[]` (`req-checks.ts:864-868`; `validate.ts:1511-1515`) and inside any `test("T253 …")` title (`validate.ts:1505-1507`). P4's self-tests alone would satisfy it, independently of the production check. `plan.md:283-285`'s "reachable from `main()`" accept and the D9 probe are the real proof — state that explicitly so the count drop is not mistaken for proof of behaviour.

**N4 — [clarity] The Scheduled-roadmap termination line rests on an unverified parser detail.** `plan.md:213-216` justifies prose over a bullet because `check-registers:strict` "parses every bullet" (`register-checks.ts:64-70`). `checkReviewFindings` date-checks findings generally (`:61`) and errors on findings in unknown/preamble sections (`:57-59`), so whether a prose line is a finding at all is a parser property the plan does not cite. Cheapest hedge: put a `YYYY-MM-DD` in the termination sentence.

**N5 — [clarity] One line cite drifts.** `plan.md:274` cites `scripts/lib/loop-artifacts.ts:64-74` for "`tasks.md` required"; the requirement is at `:72-74` (`:64-67` is the lenient/strict comment). The `:79-84` LOOP-token cite is exact.

**N6 — [clarity] The split-limit opt-out is not justified.** The done bar commits with `session:close --single` (`plan.md:329`) across 17 files carrying two concerns (a spec-row correction and tooling). AGENTS.md: "`--single` is an explicit opt-out, not the default." One sentence explaining why the concern split does not apply closes it.

**N7 — [clarity] V8's first predicate is not executable.** "`git diff --numstat` on anchor files; anchor delta `0`" (`plan.md:319-320`) names no file set; `npm run check-anchors` (`package.json:95`) is the concrete reading and is absent from V7.

---

## Open questions resolved by this review

- **`plan.md:339-343` (T87 edit riding a tooling increment)** — no objection. The row contradicts a normative REQ (`02-requirements.md:2406`), the correction is one line, and the row's remaining obligations still cover REQ-100b's tiers and REQ-100d's per-category recording (verified `:2409`, `:2415`). D4 stands; drop the 45-entry / "item 3 stays open" branch from the Open questions.
- **`plan.md:344-346` (register placement)** — D7's reading is correct: `## Scheduled-roadmap` exists at `spec/audit/review-register.md:3086` and `:3850` is the last `## ` section.

## Unknowns

1. `renderCoverageRegister`'s use of `specHash` (`validate.ts:3117, 3120`) — `rg 'Spec hash'` over the register finds nothing, so probably not rendered; if it is, P3's `assemble` is a second staleness source (B1).
2. Whether `checkReviewFindings` classifies a prose line under `## Scheduled-roadmap` as a finding (N4) — I read the checker, not the parser.
3. `npm run status` readings (5 open items, 146 unpushed commits, `v2026.11.08`, pipeline last at `record`) — not run; they gate EV2.
4. `plan.evidence.md` says "Plan lines: 347"; the artifact reads 346 (trailing newline). Harmless.
5. `corpus.md` deletion was checked against `check-anchors` = `scripts/refresh-predicates.ts --check`; no `docs/plans` reference there, so deletion looks safe, but its scan roots were not read.

## Coverage / verdict

Comprehension: faithful. Stages 3 and 5 converge on one execution-level defect (B1) plus three specification gaps (M1-M3). The document is close: B1 is a phase move, M1 a text fix, M2 one clause, M3 one JSON skeleton.

---

`independent-review FAILED.`
`Blockers: 1 · Majors: 3 · Nits: 7`

3-line summary:
1. **Blocker B1** — the T253 check makes `spec/audit/req-coverage.md` stale in P2 (`validate.ts:2210-2218` + `:3120-3121` turns that into `errors++`), yet regeneration is scheduled in P5 while P3/P4/V1 require `validate` exit 0.
2. **Three Majors** — the stated register diff predicate is wrong (`:189` reads `S22`, not `—`; no "REQ-211c" row exists); REQ-211c's "sub-check enumeration" is not asserted though the plan claims (a)-(e) covers T-ID T253; and the baseline JSON schema (`classes` vs `entries`, `req` vs `reqId`, precedence) is unspecified.
3. **Seven Nits** — record-extent contradiction, overloaded "class", the self-evidencing exercised-ID mechanism, an unhedged register prose line, a drifted line cite, an unjustified `--single`, and V8's non-executable anchor predicate; all other tree claims (47 corpus rows, unique `@section evidence`, no existing field parser, safe corpus deletion, correct register/AGENTS line refs) verified. The report file could not be written — no write tool and `shell` writes are denied; persist the block above verbatim to `plan.cold/review-r1.md`.
