# Plan — REQ sentence-count enforcement

**Session:** 2026-11-14
**Roadmap item:** `ROADMAP.md` § *REQ sentence-count enforcement (P1)*
**Shape:** Planned Change · single spec increment · one commit
**Gate depth:** standard (multi-file, reversible; rollback cost 1)

## Why

Appendix M states "No REQ body shall exceed 8 sentences" among the rules
"mechanically enforced at commit time" (`spec/appendices-reference.md:2949`,
checklist item `:2867`, narrative `:2890-2893`), and `AGENTS.md:173-174` repeats
the claim. No predicate compares the counted sentences to a limit:
`checkReqShape` (`scripts/validate.ts:223-257`) reads `entry.body` and
`entry.paragraphCount`, and the only consumers of `entry.sentences` compute
passive-voice and sentence-length statistics (`scripts/validate.ts:542-550`,
`:569-573`) — never a limit check. Finding F-U1-3
(`spec/audit/review-register.md:2618-2627`) said "never counted", which is the
accurate phrasing. The roadmap scheduled the fix.

## Open questions

1. "Draft plan for next roadmap item" (user's words) → the P1 item at the top
   of `ROADMAP.md`, whose trigger ("the next spec-tooling session, or any
   session that edits `checkReqShape`") is now met.
2. Not answered by the user, decided in-plan: whether the seven over-limit
   bodies are compressed in place or split into new sub-REQs. Chosen:
   compress (see Alternatives).
3. Publication: this increment stops at a local commit. A later `push` is a
   separate authorisation and would add the `holonovel/DECISIONS.md` spec-hash
   sync and a dated Spec Update entry — outside this blast radius.

## Evidence

Measured on `9a2f31f`, tree clean, `npm run check:fast` PASS (41/41 gates).

| Claim | Evidence | Tag |
|---|---|---|
| No sentence-limit predicate exists | `checkReqShape` reads `entry.body`/`entry.paragraphCount` only (`scripts/validate.ts:223-257`); `entry.sentences` (`scripts/lib/parse-spec.ts:197`) is consumed only for passive-voice (`:542-550`) and sentence-length (`:569-573`) statistics | repo |
| Shape findings are errors in both gate modes | the flags are in `package.json:9,12` (`validate:sdd` = `--sdd-strict`, `validate:fast` = `--sdd-strict --quick --no-proofread`) and the manifest maps both modes to them (`scripts/lib/gate-manifest.ts:31-37`); `--sdd-strict` routes non-soft shape issues to ERROR (`scripts/validate.ts:2245`) | repo |
| The soft-band escape is the literal phrase | `isSoft = issue.includes("review for splitting")` (`scripts/validate.ts:2244`) — the new message must not contain it | repo |
| Exactly seven REQs exceed 8 counted sentences | counted with `extractReqBodiesWithSentences` over the assembled spec: 1322 REQs, 7 over — REQ-232a 11/759c, REQ-318a 11/796c, REQ-072c1 9/779c, REQ-078c2 9/788c, REQ-096d1 9/796c, REQ-200 9/788c, REQ-246b1 9/711c (sentence count over the AC-truncated body; the `c` figure is the full body as the 800-char limit measures it) | repo |
| The two limits measure different slices | sentence count uses the body truncated at `*Acceptance criterion:*` (`scripts/lib/parse-spec.ts:195-197`), which keeps a trailing `_Check:_`; the 800-char limit uses the full body including the AC block and the trailer (`checkSpecViolations`, `scripts/validate.ts:188-194`) | repo |
| Dry-run classification (error-gate rule) | all seven read as genuinely over eight human sentences; zero false positives. One benign *under*-count: REQ-246b1's source sentence 5 is two sentences, counted as one, because `splitSentences` (`scripts/lib/parse-spec.ts:121-133`) requires `. ` + a capital and the second sentence starts with a backtick | repo |
| The AC block is excluded from the count | `extractReqBodiesWithSentences` slices at `*Acceptance criterion:*` (`scripts/lib/parse-spec.ts:195-197`) | repo |
| Three edited bodies feed the data fingerprint | `DATA_SECTIONS` includes `### 5.6 ` and `### 5.9 ` (`scripts/lib/contract-fingerprint.ts:37-43`); REQ-072c1/REQ-232a are §5.6, REQ-096d1 is §5.9 | repo |
| Regeneration order is assemble → fingerprints → full check | `scripts/build-order.ts:183-224` | repo |
| The guarded-rule gate watches the two validator paths | `VIGIL = ["scripts/lib/req-checks.ts", "scripts/validate.ts"]` (`scripts/check-guarded-rule-change.ts:37`); a register line containing `Appendix M` acknowledges it (`scripts/lib/guarded-rule.ts:24-31`) | repo |
| A Scheduled-roadmap finding must cite REQs present in ROADMAP.md | `scripts/lib/register-checks.ts:57-73`; F-U1-3 cites all seven | repo |
| `validate.ts` cannot be imported by a test | `main()` runs at module scope (`scripts/validate.ts:2707`) | repo |
| `npm run assemble` writes both spec copies | `scripts/assemble.ts:149-155` (root `holonovel.md`, `holonovel/holonovel.md`) | repo |

## Scope

1. Add a pure `checkReqSentenceCount` to `scripts/lib/req-checks.ts`, call it
   from `checkReqShape`, and cover it in `scripts/test-req-checks.ts`.
2. Compress the seven over-limit bodies in `spec/02-requirements.md` to eight
   counted sentences without losing contract content and without exceeding 800
   characters.
3. Reconcile the three prose claims with the predicate's actual semantics, and
   close the tracked finding: resolve F-U1-3 in the review register, remove the
   roadmap item, add the CHANGELOG entry.
4. Regenerate the assembled spec and the contract fingerprints; run the gates.

Out of scope: changing `splitSentences` (blast radius: passive-voice,
readability, and sentence-length warnings across the corpus — recorded as an
AAR finding); new REQ IDs; any server-code change.

Because no REQ is added or removed, the §5 section maps, Appendix E's
traceability table, `spec/audit/req-coverage.md`, and the README `@spec:`
markers are unchanged; the only spec-derived artifact that moves is the
contract fingerprint (three edited bodies live in fingerprinted sections).

## Change entries

| ID | Change | Size | Files |
|---|---|---|---|
| E1 | Pure `checkReqSentenceCount(reqs: Map<string, { id: string; sentences: string[] }>)` in `lib/req-checks.ts` (a structural type, so the module stays import-free): one issue per REQ whose `sentences.length > 8`, message `${reqId}: ${n} sentences — exceeds the 8-sentence limit`, no "review for splitting" phrase | S | `scripts/lib/req-checks.ts` |
| E2 | `checkReqShape` appends `checkReqSentenceCount(reqs)` to its issues | S | `scripts/validate.ts` |
| E3 | Four self-test assertions across three cases: 9 counted sentences errors; 8 passes; 8 normative + 3 acceptance-criterion sentences passes; the message does not contain the soft-band phrase | S | `scripts/test-req-checks.ts` |
| E4 | Compress the seven bodies (exact merges below), then verify each count ≤ 8 and full-body length ≤ 800 | M | `spec/02-requirements.md` |
| E5 | Appendix M: at `:2949` and `:2867` name the counted region as the body truncated at `*Acceptance criterion:*` (a trailing `_Check:_` stays inside the count) and note the shared sentence splitter; leave the enforcement-vs-warning wording as it stands (both gate modes are strict) | S | `spec/appendices-reference.md` |
| E6 | `AGENTS.md:173-174`: correct the parenthetical so the 800-char limit is not filed under "REQ shape" (it lives in `checkSpecViolations`) and the sentence limit names Appendix M as the owner | S | `AGENTS.md` |
| E7 | Review register: move F-U1-3 to `## Resolved` under the 2026-11-14 U1 sub-heading, reusing its "never counted" phrasing plus the new predicate citation, the seven bodies, and the test; change the sub-heading intro to "Four findings were demonstrated prose defects and are fixed here" and name F-U1-3 as fixed in the 2026-11-14 sentence-count increment | S | `spec/audit/review-register.md` |
| E8 | Remove the roadmap section; the trigger is met and closed | S | `ROADMAP.md` |
| E9 | CHANGELOG: insert a new top-level `## 2026-11-14 — REQ sentence-count enforcement` section above the current U1 section (`session:close` derives the commit subject from the top heading, so appending to U1 would misname the commit) | S | `CHANGELOG.md` |
| E10 | Increment artifacts (`plan.md`, `tasks.md`, `aar.md`) | S | `docs/plans/2026-11-14-req-sentence-enforcement/` |
| E11 | Generated: assembled spec (two copies) and `contract-fingerprints.ts` | S | `holonovel.md`, `holonovel/holonovel.md`, `holonovel/src/generated/contract-fingerprints.ts` |

### Per-REQ compression proposal

Counts are `sentences / full-body characters`. The last column is the expected
post-merge full-body length; E4 re-measures and the 800-char gate is the
authority, so an estimate that lands above 800 is rejected in favour of a
shorter join.

| REQ | Now | Merge (unchanged halves elided) | After |
|---|---|---|---|
| REQ-078c2 | 9 / 788c | [7]+[8] → "Section (4) explains character creation, describing every mechanical choice category the ruleset provides (species/ancestry, class/archetype, background, stat generation, equipment), stating what each option means for the character." | 8 / ~776c |
| REQ-072c1 | 9 / 779c | [6]+[7] → "The `scene` and `scene_type` fields hold the current description and the scene type." | 8 / ~772c |
| REQ-232a | 11 / 759c | [2]+[3] → "…active scene, and the `immediate_situation` field holds the current moment."; [4]+[5] → "…the next decision, and the `short_term_plans` field holds the GM's next move."; [9]+[10] → "…seems focused on, and the `saved_beats` field lists beat keys saved since the last state mutation." | 8 / ~771c |
| REQ-246b1 | 9 / 711c | [8]+[9] → "Entries are Novel-scoped, discarded by `manage_novel (action: end)`, and undo SHALL NOT reverse story journal entries." | 8 / ~716c |
| REQ-096d1 | 9 / 796c | [6]+[7] → "Condition (f): countdown names are unique in the import; condition (g): clock `opposes` and `unlocks` references resolve to countdowns in the import." | 8 / ~796c (length-neutral) |
| REQ-318a | 11 / 796c | [2]+[3] → "The `switchable` property enables `switch on` and `switch off`, and `switched_on` records current switch state."; [4]+[5] → "The `wearable` property enables `wear` and `remove`, and `readable` enables `read`, with `read_text` providing revealed text and defaulting to null."; [7]+[8] → "The `drinkable` property enables `drink`, and `enterable` enables `enter` for containers or vehicles." | 8 / ~769c |
| REQ-200 | 9 / 788c | [3]+[4] → "Supporters carry visible, reachable surface things and are fixed by default; doors connect two rooms, and a closed door blocks passage." | 8 / ~792c |

Invariant: no field name, property name, condition label, or SHALL/obligation is
deleted. Connective prose may be rewritten — the repeated "property" stem is
dropped where the property is already named, and a sentence boundary becomes a
comma or semicolon. Clause preservation is therefore enforced by review (each
body is diffed against its pre-change text in the same step), not by
construction. The table elides unchanged prefixes (marked "…"); the review diff
covers the whole body.

Character headroom: REQ-318a's three joins shorten the body (~769c). REQ-096d1's
join replaces a 17-character boundary with a 17-character one, so it is
length-neutral — the body stays at ~796c and the 800-char limit leaves about
four characters. That row is therefore the one to re-measure first; every body's
real length is confirmed by the 800-char gate (`checkSpecViolations`) over the
assembled spec, which is the artifact the gate reads.

## Alternatives considered

- **Split the seven into new sub-REQs.** Rejected: each new ID needs an
  Appendix E row, a §5 section-map entry, a `req-coverage.md` row, and test
  evidence; these are single-contract enumerations that would fragment for no
  gain. Compression preserves the ID set and all traceability.
- **Inline the predicate in `checkReqShape`.** Rejected: `validate.ts` runs
  `main()` at module scope (`:2707`), so the self-test cannot import it. A pure
  function in `lib/req-checks.ts` is importable and matches the existing split
  (checks in `lib/`, orchestration in `validate.ts`).
- **Ship as a warning first.** Rejected: the roadmap's close condition is "a
  nine-sentence body errors under `validate --sdd-strict`", and Appendix M
  claims enforcement, not advice.
- **Fix `splitSentences` to catch backtick-led sentences.** Rejected *for this
  increment*: it would move passive-voice percentages, readability grades, and
  sentence-length warnings across the corpus, which is a separate measured
  change. Recorded for the AAR.
- **Existing-check discovery:** grep over `scripts/` found no sentence-count
  predicate; `splitSentences` is called only for readability and passive-voice
  statistics (`scripts/validate.ts:630`, `:644`; `entry.sentences` feeds the
  passive-voice and sentence-length checks at `:542-550` and `:569-573`). No
  duplicate gate exists.

## Trust boundary

Every step is premised on `repo` evidence (the file:line citations above). No
step depends on web content, issue text, logs, or dependency metadata, so no
human confirmation gate is required before execution.

## Blast radius

| Path | Kind | Note |
|---|---|---|
| `scripts/lib/req-checks.ts` | validator | guarded-rule co-change target |
| `scripts/validate.ts` | validator | guarded-rule co-change target |
| `scripts/test-req-checks.ts` | test | `test:validators` gate |
| `spec/02-requirements.md` | spec source | seven §5.3/§5.6/§5.8/§5.9/§5.10 bodies |
| `spec/appendices-reference.md` | spec source | Appendix M |
| `AGENTS.md` | governance doc | maintainer parenthetical |
| `spec/audit/review-register.md` | register | F-U1-3 disposition |
| `ROADMAP.md` | governance doc | section removed |
| `CHANGELOG.md` | history | one dated entry |
| `docs/plans/2026-11-14-req-sentence-enforcement/` | artifacts | plan/tasks/aar |
| `holonovel.md` | generated | `npm run assemble` |
| `holonovel/holonovel.md` | generated | `npm run assemble` |
| `holonovel/src/generated/contract-fingerprints.ts` | generated | `npm run build-order` |
| `README.md` | generated (contingent) | `refresh-properties` inside build-order; no marker property changes (REQ count unchanged), so an edit here means a marker moved unexpectedly — record it |

## Phases

1. **P1 — predicate (E1–E3).** Add the pure check, wire it, extend the
   self-test. Verify: `npx tsx scripts/test-req-checks.ts` exits 0; the new
   cases fail against the pre-change code (red first: run the test before
   wiring the call site).
2. **P2 — corpus (E4).** Compress the seven bodies. Verify after each edit:
   counted sentences ≤ 8, body length ≤ 800, `_Check:` trailer intact, header
   title unchanged. Re-run the enumeration and expect 0 over-limit.
3. **P3 — reconciliation (E5–E8).** Appendix M, `AGENTS.md`, register, roadmap.
   Verify: `npm run check-registers`, `npm run check-roadmap`, and the staged
   guarded-rule check `npx tsx scripts/check-guarded-rule-change.ts` after
   `git add` (the pre-commit hook runs the same command; `--base` only covers
   committed ranges, so it is not the pre-commit probe).
4. **P4 — regeneration and gates (E9–E11).** `npm run build-order` assembles,
   regenerates fingerprints, then runs the full check; follow with
   `npm run validate --sdd-strict` and `npm run check:fast`. Then
   `session:close`. build-order also runs `version-bump` (idempotent: the
   version is already `2026.11.14`) and `refresh-properties` (a no-op unless a
   marker property moved — no REQ count changes here).

Dependency order: P1 before P4 (the corpus cannot be green under a predicate
that does not exist); P2 before P4; P3 is independent of P1/P2 but must land in
the same commit (register coupling); P4 last.

## Rollback

Single revert restores spec prose, validators, and docs. Generated files
(`holonovel.md`, `holonovel/holonovel.md`, `contract-fingerprints.ts`) are
derived and deterministic, so re-assembly reproduces them; `git checkout` of
the revert suffices. No persisted user data, no server surface, no migration.

## Failure modes

| Failure | Mitigation |
|---|---|
| A merged body exceeds 800 chars | prefer a shorter join; `checkSpecViolations` (`scripts/validate.ts:191`) errors on the breach |
| A merge drops a contract clause | diff each body against the pre-change text in review; the `_Check:` trailer and every field/property name must remain |
| The new message accidentally contains "review for splitting" | asserted in the self-test |
| `check-registers` rejects the moved finding | F-U1-3 keeps its date and gains a predicate citation; the roadmap section is removed in the same commit |
| `check-fingerprint-sync` fails | `npm run build-order` regenerates before the full check runs |
| `check-guarded-rule-change` blocks the commit | the register entry names Appendix M |

## Verification

- `npx tsx scripts/test-req-checks.ts` → 0 failures, new cases included.
- Enumeration dry-run (post-change) → 0 REQs over 8 counted sentences.
- `npm run build-order` (it assembles) → full check green, fingerprint
  regenerated, the `dataFormat` constant changed (journal it in the AAR).
- `npm run validate --sdd-strict` → 0 errors; the REQ-shape block prints
  `PASS: All REQs satisfy SDD shape constraints`.
- `npm run check:fast` on the regenerated tree → `check:fast: PASS` (41 gates).
- `npm run session:close` → one commit, subject from the CHANGELOG heading.

## Done bar

This increment is done when: a nine-sentence REQ body is an ERROR under
`npm run validate --sdd-strict` (asserted by self-test and by the message
routing), all 1322 REQs count ≤ 8 sentences, `check:fast` is green with
fingerprints in sync, F-U1-3 is `Resolved`, the roadmap section is gone,
`check-registers` and `check-roadmap` pass, and one commit lands. Anything the
AAR surfaces beyond this bar is dispositioned (roadmap entry, register row, or
record-and-close), not silently deferred.

## User impact

None at runtime: no tool, resource, prompt, state, or package surface changes.
The only effect is that a future nine-sentence REQ body fails the gate instead
of passing silently.

Publication is out of scope: this increment ends at a local commit. A later
authorised `push` would add `holonovel/DECISIONS.md` (spec-hash sync and the
dated Spec Update entry) — a blast-radius row this plan does not carry.
