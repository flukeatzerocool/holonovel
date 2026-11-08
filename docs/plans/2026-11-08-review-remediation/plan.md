# Plan — Review remediation: memory, identity, and evidence anchors

Session 2026-11-08. Scope verified against **all commits since the last push**:
`origin/main..HEAD` = 7 commits (base `aa4b6fe`), 57 files, +6,825/−384.
Base HEAD `8099cbb`. Drafted 2026-11-08. Plan revision 1.

## Done bar

**Done bar:** every CR-1..CR-22 finding is either fixed in this increment or carries a recorded terminal disposition; `npm run check:fast` passes 37/37 un-piped; `cd holonovel && npm run test:all` passes with the stricter anchor validation enabled; `npm run build-order` reports 0 errors and refreshes the fingerprint, starter artifact, coverage register, and markers; every Holosuite `anchor(...)` resolves on its exact line; the license-compliance plan/AAR/tasks prose is grammatical and its evidence is reproducible; the increment lands with plan/tasks/AAR and a terminal LOOP token; nothing is pushed.

## Questions

- The user asked to review **all commits since last push** and to action every recommendation. `git rev-list --count origin/main..HEAD` = 7; the review produced CR-1..CR-22.
- Which side is normative for the draft-scan matrix (REQ-599b vs the disclosure plan)? **Decided: the plan's matrix, because it is the one the code and T757 implement; amend REQ-599b.**
- Does fixing the evidence anchors require a new gate? **No: extend the existing `applyPredicateValidation` so it checks every recorded predicate, not only findings and `assertion` events.**
- Is the 7-commit review a spec increment or a non-spec session? **It carries REQ amendments, so C1 is one increment commit; C2/C3 are non-spec follow-ons (evidence, docs) and split by concern.**

## Baseline (measured this session)

- `git status --porcelain` → clean. `git log origin/main..HEAD --oneline` → 7 commits:
  `8099cbb, 20fd127, ba0d22a, 96a4bcf, 881e238, 83d7c86, 8822d66`.
- `npm run check:fast` (un-piped) → **PASS**, 37 passed, 0 failed, `check:fast: PASS`.
- `test:all` is claimed 54/54 by the three AARs; **not re-run this session** (119 s). Phase 0 re-runs it.
- Anchor audit (this session, exact-line resolver): **18 of 23 tier anchors are stale or semantically wrong**.
  Unresolvable examples: `holosuite-differential.ts:25` → `state.ts:1133#saveNovel` lands on
  `perception_ledger: [],`; `holosuite-novel.ts:31` → `index.ts:9007#context_report` lands on
  `recorded_hash: recorded,`; `holosuite-invariants.ts:27` → `state.ts:606#snapshot` lands on
  `undo_stacks: Record<string, NovelState[]>;`. Semantically wrong but resolvable:
  `P_PROTOCOL` cites `index.ts:12` (the `CallToolRequestSchema` import), `P_UNDO` cites
  `index.ts:164` (`manage_history: MUTATING` in `TOOL_ANNOTATIONS`), `P_PROVENANCE` cites
  `index.ts:78` (the `parseAdventureProvenance` import).
- Gate gap: `holonovel/scripts/holosuite.ts` `applyPredicateValidation` validates
  `result.findings` and `event.tool === "assertion"` only, so stale predicates on
  `record(...)` events are never resolved.
- Documentation regression (commit `8822d66`): the license-compliance plan/AAR/tasks now
  contain ungrammatical, non-actionable phrases, e.g. `plan.md:9` "The two the supplement
  files are absent", `tasks.md:13` "Remove the supplement pipeline supplement pipeline",
  `tasks.md:21` "the third baseline baseline", `aar.md:78` a grep regex containing literal
  spaces (`the pre-rename tree`) that can never match a real path.
- Spec body lengths (limit 800 chars): REQ-599b 722, REQ-240a 637, REQ-241a 742,
  REQ-334b 722, REQ-458 412, REQ-627 774.
- Next free identifiers: max REQ-648, max T770. **This plan adds no REQ or T ID.**

## Findings index

| CR | Sev | Finding | Fix location |
|---|---|---|---|
| CR-1 | Major | Player `open` memory brief omits the claim (REQ-634) | `index.ts` `composeSubjectiveMemorySection` |
| CR-2 | Major | `[divergence]`/`[evicted]` tags change selection/order/cap (REQ-632/646) | `subjective.ts` `assembleMemorySection` |
| CR-3 | Major | `false_outcome` is evaluated after `displaced` (REQ-630) | `divergence.ts` `checkRecord` |
| CR-4 | Major | Consolidation summaries are the first campaign facts dropped (REQ-647) | `memory.ts` `deriveCampaignTier` |
| CR-5 | Major | Undo/checkpoint restore drops a fold but keeps the eviction | `state.ts` `applyNovelState` |
| CR-6 | Major | Draft-scan target matrix contradicts REQ-599b | `subjective.ts` + REQ-599b |
| CR-7 | Minor | Branch keeps memories of events after the branch point | `index.ts` `branch` + REQ-458 |
| CR-8 | Minor | First record admitted over the token budget | `subjective.ts` `assembleMemorySection` |
| CR-9 | Minor | Raw `parseInt(process.env)`; empty string disables a bound | `index.ts` subjective handler |
| CR-10 | Minor | Renderer orders by stability class before catalog (REQ-636) | `identity.ts` `renderWhoTheyAre` |
| CR-11 | Minor | Roster load accepts out-of-range valence / off-kind false belief | `identity.ts` `normalizeFacetAttributes` |
| CR-12 | Minor | Divergence lexicon is an O.13 superset and substring-matched | `divergence.ts` |
| CR-13 | Minor | `subjective_event_ordinal` accepts floats/negatives | `index.ts` schema + handler |
| CR-14 | Minor | `compileKernel` spreads a possibly-undefined `contradicts` | `identity.ts` |
| CR-15 | Minor | Alias index rebuilt per record and per valence lookup | `divergence.ts` |
| CR-16 | Minor | Orphan memories from a typo'd entity id are accepted | `index.ts` `subjective_record` |
| CR-17 | Minor | `0` semantics for the two briefing configs undocumented | `spec/04-runtime.md` §7.6 |
| CR-18 | Info | §7.7.0 and clone/checkpoint/archive enumerations omit subjective memory | `04-runtime.md`, REQ-240a/241a/334b |
| CR-19 | Info | Recall floor hardcoded `0.9` in the harness | `test-memory-recall.ts` |
| CR-20 | Info | Legacy records without ids normalize to `""` | `subjective.ts` `normalizeSubjectiveRecord` |
| CR-21 | Major | `8822d66` rewrote license-plan/AAR/tasks into ungrammatical, non-reproducible prose | `docs/plans/2026-11-08-license-compliance/*` |
| CR-22 | Major | 18/23 Holosuite anchors wrong; gate validates only findings/assertions | `holosuite-*.ts`, `holosuite.ts`, `test-holosuite-evidence.ts` |

## Decisions

- **D1 — Claim format.** Player `open` line becomes
  `- [origin] entity: gist (claims: subject predicate object) (felt affect)`.
  Re-measure the recall fixture's 100-token budget; shorten the bracket label if
  `tight-ledger` no longer fits.
- **D2 — Marker cost.** `assembleMemorySection`'s renderer returns
  `{ text, suffix }`; cost is `estimateTokens(text)`; `suffix` is appended after
  admission. Markers can no longer change selection, order, or the cap.
- **D3 — Verdict precedence.** Evaluate in this order: anchored same-polarity
  (confirmed or affect drift) → any opposite-polarity fact (false outcome) →
  unanchored same-polarity (displaced) → conflated → misattributed → unverifiable.
- **D4 — Scan matrix (normative).** `open`: none. `guarded` owner: claim + affect.
  `guarded` non-owner: gist + claim. `secret` owner and non-owner: gist + claim.
  Amend REQ-599b to this matrix; update T757's wording and assertion.
- **D5 — Fold monotonicity.** Undo and checkpoint restore preserve
  `compression_ladder.entities` while other ladder fields roll back.
- **D6 — Branch.** Filter `subjective_memory` to records with a null ordinal or an
  ordinal at or before the branch point; amend REQ-458.
- **D7 — Summary cap.** Reserve up to `maxFacts` slots for consolidation summaries
  before slicing other campaign facts; keep summaries last in render order.
- **D8 — Identity order.** Sort the whole render by `KIND_INDEX`, then stability
  class, then facet, then revision (fact stays last across classes).
- **D9 — Lexicon.** Match the exact Appendix O.13 positive/negative affect terms
  and outcome pairs on token boundaries; remove `attacked`, `threatened`,
  `protected`, and `saved` from the outcome cue list.
- **D10 — Evidence.** Validate every recorded predicate; cite the implementing
  handler/function line, never an import, map entry, or unrelated statement.
- **D11 — Docs repair.** Rewrite the license-compliance plan/AAR/tasks in generic
  but grammatical language; do not reintroduce the trademark; replace the
  non-matching grep with a recorded-bundle check or an explicit withholding note.
- **D12 — Config.** Use `configInt` for the three subjective bounds; document
  `0 = unlimited` for `BRIEFING_MAX` and `BRIEFING_TOKENS`.

## Blast radius

| File / surface | Change | Size |
|---|---|---|
| `holonovel/src/core/subjective.ts` | CR-2, CR-6, CR-8, CR-20 | M |
| `holonovel/src/core/divergence.ts` | CR-3, CR-12, CR-15 | M |
| `holonovel/src/core/identity.ts` | CR-10, CR-11, CR-14 | M |
| `holonovel/src/core/memory.ts` | CR-4 | S |
| `holonovel/src/core/state.ts` | CR-5 | S |
| `holonovel/src/index.ts` | CR-1, CR-2, CR-7, CR-9, CR-13, CR-16 | L |
| `holonovel/scripts/test-belief.ts` | T743, T744, T745, T751, T752, T755, T757 | M |
| `holonovel/scripts/test-identity.ts` | T758, T760, T761 | M |
| `holonovel/scripts/test-memory-recall.ts` | T746, T749, T767, T768, T769, T770, CR-19 | M |
| `holonovel/scripts/fixtures/subjective-recall.json` | budget re-tune | S |
| `holonovel/scripts/fixtures/subjective-divergence.json` | CR-3, CR-12 probes | S |
| `holonovel/scripts/lib/holosuite-{adversarial,conformance,differential,invariants,novel}.ts` | CR-22 anchors | M |
| `holonovel/scripts/holosuite.ts` | CR-22 validation scope | S |
| `holonovel/scripts/test-holosuite-evidence.ts` | CR-22 gate self-test | S |
| `holonovel/tool-definitions.json`, `tool-surface-registry.json` | schema/description sync (CR-13/CR-16) | S |
| `spec/02-requirements.md` | REQ-599b, 458, 627, 240a, 241a, 334b | M |
| `spec/04-runtime.md` | §7.6 rows, §7.7.0 paragraph | M |
| `spec/appendices-reference.md` | O.13 token-match sentence, T-row wording | S |
| `spec/audit/{req-coverage,proofread-register,review-register,tool-surface-baseline}` | registers | M |
| `docs/plans/2026-11-08-license-compliance/{plan,tasks,aar}.md` | CR-21 prose repair | M |
| `docs/plans/2026-11-08-review-remediation/{plan,tasks,aar}.md` | this increment | M |
| `CHANGELOG.md`, `holonovel/DECISIONS.md`, `holonovel/AGENTS.md` | dated entry, decisions, surface line | S |
| `holonovel/content/torre-nosferatu.json`, `src/generated/contract-fingerprints.ts`, `holonovel{,holonovel}.md`, `spec/build-phase-map.md` | regenerate after spec edits | S |

## Steps

### Phase 0 — Baseline and dry run (no edits)

1. `git status`, `git log origin/main..HEAD --oneline`, `git diff --stat origin/main..HEAD`.
2. `npm run check:fast` un-piped; `cd holonovel && npm run test:all` (expect 54/54).
3. Run the exact-line anchor audit and record every failure in `plan.md` Evidence.
   This is the dry run for the stricter gate; do not claim green until CR-22 is fixed.
4. Confirm `docs/plans/2026-11-08-review-remediation/` is trackable (`git check-ignore` returns nothing).
5. Sibling-contract grep: REQ-461–472, REQ-540–545, REQ-624, REQ-625, REQ-631, and
   REQ-635 all bind `manage_belief`; confirm the CR-13/CR-16 validation changes
   add no conflicting parameter, read, or badge contract before editing.

### Phase 1 — Subjective-memory correctness (part of C1)

1. `core/subjective.ts`: split `render` into `{ text, suffix }`; enforce the budget
   strictly (no first-record bypass); apply the D4 scan matrix; add the
   deterministic legacy-id fallback (index parameter).
2. `core/divergence.ts`: reorder `checkRecord` per D3; trim the outcome cue table
   to Appendix O.13 and token-match; pass a prebuilt alias map into
   `checkRecord`/`recordedValence`.
3. `core/memory.ts`: reserve summary slots per D7.
4. `core/state.ts`: preserve `compression_ladder.entities` on `"undo"` restores per D5.
5. `index.ts`: Player `open` claim (D1); `configInt` for all three bounds; entity
   resolution with `[INVALID_INPUT]` on no match; integer/non-negative ordinal;
   branch filter per D6; pass marker suffix out of the cost path.
6. Spec: rewrite REQ-599b (792 chars), REQ-458 (517), REQ-627 (631); add the O.13
   token-matching sentence. No new REQ/T IDs.
7. Tests/fixtures: extend T743/T744/T745/T746/T749/T751/T752/T755/T757/T767/T768/
   T769/T770; add two divergence probes (a wrong-cited-event probe and an
   `unsafe` or `sealed door` lexicon probe) and re-tune the recall fixture budget.
   CR-19: read the O.12 floor from the assembled `holonovel/holonovel.md` and fail
   when the row is missing or disagrees with the fixture.
8. Gate: `npm run assemble && npm run check:fast`; `cd holonovel && npm run test:all`;
   `npm run build-order`.

### Phase 2 — Identity + config/class contract (part of C1)

1. `core/identity.ts`: global catalog sort per D8; clamp valence and clear
   off-kind `false_but_held` on load; defensive `contradicts ?? []` in
   `compileKernel` and its history copies.
2. Spec: §7.6 rows 216–217 add `0 = unlimited`; §7.7.0 gains a **Subjective
   memory** paragraph declaring Novel-tier footing and the checkpoint exclusion;
   REQ-240a (666), REQ-241a (777), REQ-334b (751) name subjective memory.
3. Tests: T758 cross-class order (structural `name` fact after a core `value`);
   T760/T761 hand-edited roster load clamps; T572/T765 unchanged.
4. Gate: `npm run assemble && npm run check:fast`; `test:identity`; `test:all`;
   `npm run build-order` (starter + fingerprints); `npm run surface-budget -- --write`
   if the schema descriptions changed.

### Phase 3 — Evidence anchors and gate (C2)

1. `holonovel/scripts/holosuite.ts`: validate **every** `result.events` predicate
   (remove the `event.tool !== "assertion"` filter). This is a gate behavioral
   change: add a CHANGELOG bullet and re-run the tiers it feeds.
2. Re-point every `P_*`/`PREDICATE_*` anchor to the implementing line:
   `P_PROTOCOL` → `setRequestHandler(CallToolRequestSchema`; `P_DIAGNOSTICS` →
   `case "verify"`; `P_READONLY` → `requireNotObserver`; `P_RECAP`/`P_NARRATOR` →
   `case "recap"`; `P_CONTEXT` → `case "context_report"`; `P_VISIBILITY` →
   `case "visibility_check"`; `P_KNOWLEDGE` → `case "knowledge_query"`; `P_UNDO` →
   `server.registerTool("manage_history"`; `P_REPLAY`/`P_RESTART` → the
   `saveNovel` method definition; `P_PROVENANCE` → `verifyAdventureProvenance`;
   `PREDICATE_PROMPTS` → `server.registerPrompt(`; `PREDICATE_RESOURCES` →
   `server.registerResource(`; `P_INTEGRITY` → `computeBundleIntegrity`;
   `P_ARTIFACT` → `inboxSourcePath`; `P_SHARE` → `case "share"`;
   `P_VALIDATION` → `case "create_room"`; `P_IMPORT_INTEGRITY` → `case "import"`.
   Re-resolve line numbers **after** Phases 1–2 (they shift).
3. `test-holosuite-evidence.ts`: add a case where a `record` event with an
   unresolvable predicate yields `predicate_unresolved`.
4. Gate: `cd holonovel && npm run test:all` (must pass with the stricter check);
   `npm run check:fast`.

### Phase 4 — License-compliance docs repair (C3, docs last)

1. Fix `docs/plans/2026-11-08-license-compliance/plan.md`: "The two the supplement
   files", "the supplement pipeline/", "the pre-rename tree/", "a non-open ruleset
   rules reference", "the extractor:21", "authored/the authored tools file",
   "no committed the second rebuild artifact", "T737 drops the `the second rebuild`
   example", and the "third baseline baseline" phrasing.
2. Fix `tasks.md`: "Remove the supplement pipeline supplement pipeline", "the third
   baseline baseline", "the extractor".
3. Fix `aar.md`: "The two the supplement files", the invalid grep regex, and the
   "the pre-rename tree" phrasing. Replace the regex with a check over the recorded
   purge bundle manifest, or state explicitly that the literal path tokens are
   withheld and the zero-object result is the evidence.
4. Keep `CHANGELOG.md` and `docs/licenses/ATTRIBUTION.md` grammatical; do not
   reintroduce the trademark.
5. Gate: `npm run check:fast` (markdownlint); spot-read the repaired paragraphs.

### Phase 5 — Registers, changelog, AAR

1. `spec/audit/review-register.md`: CR-1..CR-22 rows with terminal dispositions
   (`Resolved`, `Resolved-in-session`, or `Closed-P3` for CR-15/CR-19 if no gate).
   Refresh the Appendix E revision rows for the six amended REQs and the Appendix F
   wording for T743/T746/T755/T757/T758/T767/T769; the §5 map is unchanged (no new IDs).
2. Regenerate: `npm run validate -- --write-register`, `npm run surface-budget -- --write`
   if schemas changed, `npm run build-order` for fingerprints/starter/build-phase-map.
3. `CHANGELOG.md`: one dated heading `2026-11-08 — Review remediation: memory,
   identity, and evidence anchors` with bullets per commit; the date equals the
   CalVer date.
4. `holonovel/DECISIONS.md`: record D1–D12 (scan matrix, fold monotonicity, branch
   filter, marker cost, precedence, lexicon, config, anchor policy, docs policy).
5. Write `docs/plans/2026-11-08-review-remediation/tasks.md` and `aar.md`;
   `npm run check-loop-artifacts`; AAR ends `LOOP PAUSED` with zero new action items.
6. Commit in the order below; **do not push** unless the user says so.

## Commit and gate order

| # | Commit | Scope | Gate before commit |
|---|---|---|---|
| C0 | Restore green Holosuite anchors (red baseline) | CR-22 anchor re-pointing only | `test:all`, `check:fast` |
| C1 | Review remediation: memory, identity, and spec | CR-1..CR-20 + REQ-599b/458/627/240a/241a/334b + tests | `assemble`, `check:fast`, `test:all`, `build-order` |
| C2 | Stricter predicate validation and residual anchors | CR-22 gate | `test:all`, `check:fast` |
| C3 | License-compliance docs repair | CR-21 | `check:fast` |

C0 exists because Phase 0 found the baseline red (49/53 server harnesses; 18
`predicate_unresolved` findings). C1 is one increment commit (spec + code +
tests). C2/C3 are non-spec concerns; docs land last.

## Verification

| Check | Command | Expected |
|---|---|---|
| Spec assembly | `npm run assemble` | 0 errors |
| Fast gate | `npm run check:fast` (un-piped) | 37/37, `check:fast: PASS` |
| Server harnesses | `cd holonovel && npm run test:all` | all tiers pass with stricter anchors |
| Full build | `npm run build-order` | 0 errors; fingerprints/starter/registers current |
| Coverage | `npm run validate -- --write-register` | bucket A 0 |
| Loop artifacts | `npm run check-loop-artifacts` | pass, LOOP token present |
| Spec body limits | `npm run validate -- --sdd-strict` | 0 errors; amended bodies ≤800 chars |
| Evidence | `npx tsx holonovel/scripts/test-holosuite-evidence.ts` | all anchors resolve |
| Tool surface | `check-tool-definitions-sync`, `tool-definitions-lint`, `check-tool-surface`, `surface-budget`, `surface-replay` (inside `check:fast`) | PASS |
| Docs | `npm run check:fast` | markdownlint passes |

Unverified until Phase 0: the current `test:all` count (AAR-claimed 54/54).

## Risks and rollback

- **Anchor re-resolution is line-shift sensitive.** Do it after Phases 1–2; run the
  strict gate until every predicate resolves. Rollback: revert the anchor commit.
- **REQ body limits.** The measured replacements are 792/517/631/666/777/751 chars;
  re-measure after drafting, including the new sentence in O.13.
- **Fixture budget.** Adding the claim grows the Player line; re-measure and adjust
  the recall fixture's declared budget before committing.
- **Starter artifact.** §7.7.0 edits change `DATA_FORMAT`; rebuild
  `content/torre-nosferatu.json` with `npm run build:starter-novel`.
- **No destructive operations.** No history rewrite, no publish, no data migration.
  All code changes are reversible (rollback cost 1).
- **Trust boundary.** Every premise is repo-sourced; no web/user content drives an
  instruction.

## Evidence

- Review artifact: `docs/plans/2026-11-08-review-remediation/plan.md` (this file).
- Finding predicates: each CR cites `file:line` in the Findings index and the
  Baseline section; CR-21/CR-22 cite `git show 8822d66` and the resolver audit.
- Spec lengths: measured against `spec/02-requirements.md` at `8099cbb`.
- No external sources.

**Done bar:** all CR-1..CR-22 fixed or terminally dispositioned; `check:fast` PASS;
`test:all` PASS with strict anchors; `build-order` clean; AAR `LOOP PAUSED`.

## Delta amendment 1 — Red baseline (Phase 0)

Phase 0 invalidated the plan's "test:all 54/54" assumption. Measured at
`8099cbb` before any source edit: `cd holonovel && npm run test:all` →
**49 passed, 5 failed**; the five failing tiers report 18
`predicate_unresolved` findings (novel 5, adversarial 7, differential 1,
invariants 2, plus the shared constants), all from stale line pins.

Change: **C0** is inserted before C1 to restore the green baseline by
re-pointing every anchor; C2 now only tightens `applyPredicateValidation` and
fixes any residual anchor the strict check surfaces. The C-1 condition is
triggered and resolved by C0. No other plan step changes.
