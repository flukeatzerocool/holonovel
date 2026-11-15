# Plan — §7.3a prompt-construction record and P60 vocabulary (ROADMAP P1)

Status: draft v2 (self pass + cold pass: 5 majors and 9 minors fixed) ·
Kind: planned · Depth: standard
Increment target: `docs/plans/2026-11-15-prompt-construction-p60-vocabulary/`
Rollback cost: 1 (one revert: this plan directory, the §7.7 prose + fingerprint,
the validator predicate and its self-test, the `narrate` tone hunk and its
harness test, `REQ-598a` and its two registration rows, three Appendix F row
amendments, the DECISIONS note, the two register updates, `ROADMAP.md`, the
assembled `holonovel.md` + `holonovel/holonovel.md`, `spec/audit/req-coverage.md`,
`CHANGELOG.md`)
Evidence class: repo (EV1 and EV2 are `tool-output`; every other premise is a
`file:line` read or a command run at HEAD `f73a72c`)
Trust boundary: working tree only; no web, user, or fetched content enters the
plan.

**Resolves:** `F-U3-3` (`spec/audit/review-register.md:2734-2738`, §7.3a builder
documentation), `F-U3-4` (`:2739-2744`, P60's `Surface` token).

## Questions

1. **Which item is next?** The user asked for the next roadmap item. This one
   is the only open P1 (`ROADMAP.md:78-91`); the others are P2 sweeps and a
   date-gated re-measurement. Its trigger ("the next §7.7.0 or
   archetype-taxonomy edit") is satisfied by its own P60 clause, and both
   findings are register rows from U3.
2. **Is the item one session?** Yes: one prose row retarget, one validator
   predicate plus self-test, one DECISIONS section, one six-line prompt
   builder hunk plus one harness test, one new sub-REQ and two registration
   rows, three Appendix F row amendments, two register updates, one ROADMAP
   removal.
3. **Make `Surface` an archetype, or retarget the rule?** Retarget. §7.7.0
   defines archetypes as classifications of *Novel property groups*
   (`spec/04-runtime.md:327-329`); `TTRPG_SURFACE_PROFILE` is a behavioral
   config knob, not a property group (`spec/04-runtime.md:137`). P59 already
   places the same shape of knob under `Session → Session`
   (`spec/04-runtime.md:499`), so `Session` is the established bucket for
   session-configuration directives (D1).
4. **What can catch a recurrence?** Nothing today: `VALID_ARCHETYPES`
   (`scripts/validate.ts:1051`) is consulted only for the §7.7 property table
   (`:1090`), the alias map is used only for coupling pairs (`:1101-1107`),
   and the pattern-rule parser stores `src`/`tgt` token arrays (`:1136-1163`)
   that no check reads against the vocabulary. The citing coupling row is
   `[non-property]` and skipped (`:1181`). So the increment adds the missing
   predicate (D2).
5. **Is §7.3a already satisfied by the server?** Three of four clauses are:
   archived-not-reinjected (the `narrate` prompt is composed from Novel state —
   `composeClearedFacts`, `holonovel/src/index.ts:1215-1242`; the composer at
   `:1254-1317` takes no transcript input), voice profiles as standing
   directives (`:1305-1313`), anti-slop precedence
   (`:17884-17887`, `antiSlopFor` `:3775`). The fourth, scene-type anchoring,
   has no tone directive anywhere (`grep -rn 'tone directive' holonovel/src`
   and `grep -rn 'TONE' holonovel/src` are both empty; `composeNarrativeTone`
   renders Wisdom tone samples, not scene-type tone,
   `holonovel/src/core/prompt-composition.ts:349-355`). Scene type reaches the
   prompt only as Available Actions (`holonovel/src/index.ts:2713-2745`). A
   documentation-only close would attest a clause the server does not meet
   (D3).
6. **Does the predicate have a red state?** Yes: run it against the current
   tree and it reports exactly one finding, `P60 … Surface`
   (`spec/04-runtime.md:500`); the other tokens all resolve (EV6). That is the
   red test for the new gate, and the P60 retarget is its green.
7. **Where does the tone contract live, given REQ-598 is nearly full?**
   REQ-598's extracted body is 795 characters against the 800-character cap
   (EV21), so a new sentence cannot be added without rewriting accepted text.
   The increment adds `REQ-598a` instead — a composable part of the same
   family, short enough to sit well inside the cap (D4).

## Baseline at HEAD (this session)

| # | Evidence | Command / source | Trust |
|---|---|---|---|
| EV1 | Tree clean on `main`, HEAD `f73a72c`, version `2026.11.15`, 94 unpushed commits, 5 open roadmap items | `git status --porcelain`; `git log -1`; `npm run status` | tool-output |
| EV2 | Fast gate green: 41 passed, 0 failed, `check:fast: PASS` | `npm run check:fast` (un-piped, exit 0) | tool-output |
| EV3 | The roadmap item and its two clauses | `ROADMAP.md:78-91` | repo |
| EV4 | §7.3a's four clauses and the builder documentation duty | `spec/04-runtime.md:76-105` (duty at `:103-105`) | repo |
| EV5 | P60 reads `Session → Surface`; §7.6 cites "couples per P60"; the coupling row is `[non-property]` | `spec/04-runtime.md:500`, `:137`, `:620` | repo |
| EV6 | Every other pattern-rule token resolves. Enumeration: extract column 2 of the 61 rows (`awk` over §7.7.0) and compare to `VALID_ARCHETYPES` plus the alias map — the unique token set is Decision, Entity-bearing, Guidance, Knowledge-carrying, Mechanical, Narrative-memory, Relational, Ruleset Wisdom, Scene-anchored, Session, Spatial, Temporal, and the composites `Scene-anchored + Knowledge-carrying` (P17) and the symmetric `↔` pairs; `Surface` is the only non-resolving token | `awk '/\*\*Coupling pattern rules/,/#### 7\.7\.1/' spec/04-runtime.md`; `scripts/validate.ts:1051,1054-1068` | repo |
| EV7 | The archetype vocabulary is declared twice: `VALID_ARCHETYPES` (12 names) and the alias map (13 aliases) | `scripts/validate.ts:1051`, `:1054-1068` | repo |
| EV8 | The pattern parser already tokenizes source/target, splitting composites on `+` | `scripts/validate.ts:1136-1163` | repo |
| EV9 | §7.7.1b is the normative home for coupling validation prose and already states `npm run validate` duties for coupling rows | `spec/04-runtime.md:649-657` | repo |
| EV10 | §7.7 is a fingerprinted data section; an edit to it invalidates `contract-fingerprints.ts` | `scripts/lib/contract-fingerprint.ts:34-40`; `AGENTS.md` "Before committing" | repo |
| EV11 | `narrate` prompt assembly, its section list (`**Scene:**` at `:1260`), and the absence of a scene-tone section | `holonovel/src/index.ts:1254-1317`; two greps (EV5 note) | repo |
| EV12 | Voice profiles and anti-slop already reach the narrator | `holonovel/src/index.ts:1305-1313`, `:17884-17887` | repo |
| EV13 | REQ-598 owns the `narrate` prompt contract and cites T707/T708/T729 | `spec/02-requirements.md:1474-1475` | repo |
| EV14 | The last Appendix F row is T787; T788 is free (T783 and T788 are both unused, so the next catalogue row takes T788) | `grep -o '^| T[0-9]* ' spec/appendices-reference.md \| sort -n \| tail` | repo |
| EV15 | `checkCouplingCompleteness` is called once, from `main`, over the §7.7 text | `scripts/validate.ts:2532` | repo |
| EV16 | The validator self-test harness imports pure helpers from `scripts/lib/req-checks.ts`; `validate.ts` is not importable (it runs `main()` at module load, `:2710`) | `scripts/test-req-checks.ts:7-11`; `scripts/validate.ts:2710` | repo |
| EV17 | No existing gate checks pattern-rule vocabulary: `checkCouplingCompleteness` is the only coupling check (`grep -rn 'checkCoupling\|PATTERN_RULE' scripts/`), and its pattern-rule loops check coverage and coupling-row matching only (`:1166-1200`) | `scripts/validate.ts:1166-1200` | repo |
| EV18 | The review-register carries both findings as Scheduled-roadmap rows under the 2026-11-14 U3 entry | `spec/audit/review-register.md:2725-2744` | repo |
| EV19 | DECISIONS.md's decision-record sections sit at the top of the file, dated `### <Title> — <date>`, each bullet an accepted tradeoff with REQ citations; `checkDecisionsCitations` resolves those citations | `holonovel/DECISIONS.md:30-41`; `scripts/lib/req-checks.ts` `checkDecisionsCitations` | repo |
| EV20 | The coverage register is generated by `npm run validate -- --write-register`; a new REQ or an amended `_Check:_` citation changes it | `AGENTS.md` "Before committing"; `spec/audit/req-coverage.md` | repo |
| EV21 | REQ-598's extracted body is 795 characters against the 800-character spec-violation cap, so the body has 5 characters of headroom | `npx tsx -e "… extractReqBodies(text).get('REQ-598').body.length"` → 795; cap at `scripts/validate.ts:191-196` | tool-output |
| EV22 | The §5 map is keyed on 3-digit bases, so `REQ-598a` is covered by the existing `598–600` row | `scripts/validate.ts:1212-1247` (`base = id.slice(4, 7)`) | repo |
| EV23 | `applyPromptBudget` keeps sections in document order with no priority registry, and `**Play loop:**` is in the never-truncated set | `holonovel/src/index.ts:3805-3827`, `:3798` | repo |

## Objective

Give P60 a target token the archetype vocabulary contains, make that class of
drift a gate failure rather than an invisible one, and make §7.3a's builder
duty true: the server carries the scene-type tone directive its narrator prompt
owes, and `holonovel/DECISIONS.md` records how each of the four clauses is
satisfied.

## Done bar

**Done bar:** (1) no pattern-rule token falls outside the declared vocabulary —
enforced by a validator predicate whose red state is demonstrated on `Surface`
and whose self-test covers both a valid and an invalid token; (2) the `narrate`
prompt carries a scene-type tone directive that persists for the scene, tested
by T788 and stated in `REQ-598a`; (3) `holonovel/DECISIONS.md` carries the
§7.3a record with a `file:line` predicate for each clause, and names the
anti-slop ordering as a host obligation the server cannot observe; (4)
`F-U3-3` and `F-U3-4` are `Resolved`, the ROADMAP section is removed, and
`check:fast` is green with 0 errors.

Numbered form, each verified by a named command:

1. **The predicate fails today and passes after the retarget.**
   `npm run validate` (predicate added, before the retarget) reports exactly
   one `ERROR` naming `P60` and `Surface`; after the retarget it reports none.
   Both outputs are pasted into `tasks.md` T4.
2. **The predicate has a self-test red/green.**
   `npm run test:validators` includes one test with three cases — an all-valid
   token set passes, `Surface` fails naming the rule, and
   `Scene-anchored + Knowledge-carrying` splits without a false positive.
3. **T788 asserts the tone directive.**
   `npm --prefix holonovel run test:lean-narrator` passes; the test sets
   `combat` and asserts the combat line without the social line, sets `social`
   and asserts the inverse, clears the tags and asserts the neutral line, and
   re-renders with an unchanged tag to prove persistence.
4. **The DECISIONS record names each clause with its predicate.**
   `sed -n '/Prompt construction conventions/,/^### /p' holonovel/DECISIONS.md
   | grep -c 'index.ts:'` is at least 4, and each bullet names its clause. The
   anti-slop bullet states the server-side half (`index.ts:17884-17887`,
   `:1299-1300`) and records the ordering as a host obligation — it does not
   claim an ordering the server cannot observe. `npm run validate` is green, so
   `checkDecisionsCitations` resolves every REQ cited.
5. **Registers and roadmap agree.**
   `npm run check-registers` and `npm run check-roadmap` pass;
   `grep -n 'P60 vocabulary' ROADMAP.md` returns nothing; both register rows
   read `Resolved (2026-11-15)`.
6. **Fingerprints and assembly are current.**
   `npm run build-order` exits 0 and `check-fingerprint-sync` is green on the
   committed `contract-fingerprints.ts`.
7. **Full fast gate green.** `npm run check:fast` prints
   `check:fast: PASS` with 0 errors.

## Decisions

| # | Decision | Consequence |
|---|---|---|
| D1 | **Retarget P60 to `Session → Session`; do not add a `Surface` archetype.** `Surface` names a config profile, not a property group; the taxonomy classifies property groups (`spec/04-runtime.md:327-329`), and P59 already files the same shape of knob under `Session → Session` (`:499`). | One prose row changes. `VALID_ARCHETYPES`, the archetype table, REQ-369a's twelve-name enumeration, and the P1–P61 counts are untouched. P60 becomes archetype-identical to P59; **allowed** — the validator keys on rule names, not archetype pairs (`scripts/validate.ts:1169-1200`), §7.7.0 defines a rule by its interaction category, and P55–P59 already share pairs. Rejected: adding `Surface` (would grow the archetype table, `VALID_ARCHETYPES`, REQ-369a, REQ-374a, and Appendix T for a thing that is not a property group). |
| D2 | **Put the predicate in `scripts/lib/req-checks.ts` as a pure exported helper, and call it from `checkCouplingCompleteness`.** | `validate.ts` runs `main()` at import (`:2710`), so a predicate defined only there cannot be self-tested (EV16). The helper takes the parsed `{rule, tokens}` list plus the validator's own `valid` and `aliases` sets, and returns the offending tuples. Pattern-rule columns carry **archetype tokens only** — never property-group names — which is why the helper needs no property-name resolver (EV6 enumerates the whole set). Reported as `ERROR`: an unresolvable token makes its rule unmatchable, a spec defect under REQ-370a. |
| D3 | **Implement the scene-type tone directive rather than documenting the clause as unmet.** The clause is a SHALL on the builder; a record that says "not satisfied" closes the roadmap item on paper and leaves a normative gap. The directive is six lines in `composeNarrationClearance`. | Adds a `### Scene tone` section derived from `novel.scene_type`, one line per active tag (REQ-087b's multi-tag precedent) and the neutral line when no tag is set; persistence follows because the tag is Novel state re-read on every render. Rejected: doc-only close with a new ROADMAP entry (leaves the spec unmet and schedules work the increment can do in the same session). **Scope note:** this is the item's one code-bearing clause; the user may prefer to defer it (Open question Q1). |
| D4 | **Carry the tone contract in a new `REQ-598a`, not in REQ-598.** REQ-598's body is 795/800 characters (EV21), so appending a sentence would break the spec-violation cap; rewriting accepted text to make room is riskier than a composable part. | `REQ-598a` ("Narrator scene tone (Part a)") sits after REQ-598 in §5.5; the §5 map is unaffected because it keys on the 3-digit base (EV22). Two registration rows: the Appendix E manifest row and the Appendix F `T788` row. Rejected: appending to REQ-598 (5 characters of headroom); a new 3-digit REQ (same registration cost, loses the family tie). |
| D5 | **Amend T420/T421/T434 rather than add a fifth coupling test row.** Those rows already enumerate the coupling assertions the validator implements; the vocabulary assertion is another clause of the same test. | Appendix F rows grow one clause each; no ID churn. `[non-property]` rows stay outside archetype matching — the predicate reads pattern rules, not coupling pairs, so the exemption is unaffected. |
| D6 | **Leave the `[non-property]` coupling row's descriptive pair names alone.** `Narrative Directive → Surface Profile` (`spec/04-runtime.md:620`) names config knobs, not property groups, and is exempt from archetype matching by design. | No edit at `:620`; recorded here so the build does not "fix" a row the gate does not read. |
| D7 | **The DECISIONS record documents observed behaviour, not intent.** Each bullet names the predicate (`file:line`) that carries the clause. | If a predicate moves later, the record can be re-verified. Where a clause's ordering is host-side, the bullet says so (Done bar 4). |
| D8 | **Close the roadmap section; do not rewrite it.** | `ROADMAP.md:78-91` is deleted in the same step as the register dispositions, per the register-coupling rule. Any residual finding the build discovers becomes a new dated roadmap entry, not a reopened section. |

## Blast radius

| File | Change | Size |
|---|---|---|
| `spec/04-runtime.md` | P60 target token (`:500`); §7.7.1b gains the vocabulary-verification sentence, extending its duty from coupling rows to pattern-rule tokens (`:649-657`) | S |
| `spec/02-requirements.md` | New `REQ-598a` body after REQ-598 (`:1475`), citing `T788` | S |
| `spec/appendices-reference.md` | Appendix E manifest row for `REQ-598a`; T420/T421/T434 gain the vocabulary clause; new T788 row | S |
| `scripts/lib/req-checks.ts` | New pure helper `unresolvedPatternRuleTokens` | S |
| `scripts/validate.ts` | `checkCouplingCompleteness` calls the helper; passes its vocabulary and alias sets | S |
| `scripts/test-req-checks.ts` | Self-test: valid set passes, `Surface` fails, composite `A + B` splits | S |
| `holonovel/src/index.ts` | `### Scene tone` section in `composeNarrationClearance` (`:1254-1317`) | S |
| `holonovel/scripts/test-lean-narrator.ts` | T788 test | S |
| `holonovel/DECISIONS.md` | New dated section: the §7.3a prompt-construction record, four bullets | S |
| `spec/audit/review-register.md` | `F-U3-3`, `F-U3-4` → `Resolved (2026-11-15)` with predicate sentences; Scheduled-roadmap subsection closed | S |
| `ROADMAP.md` | Remove the §7.3a section (5 open → 4) | S |
| `spec/audit/req-coverage.md` | Regenerate (`npm run validate -- --write-register`) | S |
| `CHANGELOG.md` | One dated entry for the session | S |
| `holonovel.md`, `holonovel/holonovel.md` | Assembled output | S |
| `scripts/lib/contract-fingerprints.ts` (generated) | Regenerated by `npm run build-order` | S |
| `docs/plans/2026-11-15-prompt-construction-p60-vocabulary/` | `plan.md`, `tasks.md`, `aar.md`, `plan.cold/` | S |

Not touched, with reason: `spec/04-runtime.md:137` (§7.6's "couples per P60" is
an ID reference, still correct), `:620` (D6), `scripts/validate.ts:1051`
(vocabulary unchanged, D1), the §5 section map (base-keyed, EV22),
`holonovel/src/core/prompt-composition.ts` (the tone directive belongs to the
clearance prompt's section list, not the shared composers).

## Phases

**Phase 0 — preflight (read-only).**
1. Confirm EV17 with a live grep for an existing pattern-rule vocabulary check;
   confirm EV6's enumeration; confirm `ROADMAP.md:78-91` and the register rows
   are at the cited lines. Stop if a same-class check already exists — extend
   it instead of adding the helper.
2. **Sibling-contract check.** Grep for every REQ binding the `narrate` prompt
   (`grep -n 'narrate' spec/02-requirements.md`; the known owners are REQ-023a,
   REQ-078a, REQ-138, REQ-389c, REQ-598 in `holonovel/AGENTS.md`) and confirm
   none forbids an added prompt section or fixes the prompt's section count.
   Record the result in `tasks.md`.
3. **Budget-headroom check.** Render the `narrate` prompt at the minimal budget
   with a two-NPC combat scene and record the truncation slack (EV23). If the
   slack is under roughly the length of the new section, raise it in
   `tasks.md` before Phase 2 edits the composer.

**Phase 1 — the predicate (red first).**
1. Add `unresolvedPatternRuleTokens(rules, valid, aliases)` to
   `scripts/lib/req-checks.ts`: input is `{rule, srcTokens, tgtTokens}` entries;
   a token resolves when it is in `valid` or a key of `aliases`; returns
   `{rule, token}[]`.
2. Wire it into `checkCouplingCompleteness` after the pattern-table parse
   (`scripts/validate.ts:1163`), emitting
   `ERROR: Pattern rule P60 has archetype token "Surface" outside the §7.7.0 vocabulary`.
3. Add the self-test in `scripts/test-req-checks.ts` (three cases in one test:
   all-valid passes, `Surface` fails naming the rule, `Scene-anchored +
   Knowledge-carrying` splits cleanly).
4. **Dry run, recorded:** `npm run validate 2>&1 | grep -B2 -A2 'outside the
   §7.7.0 vocabulary'` must report exactly one error, for `P60`/`Surface`.
   Paste the line into `tasks.md`. This is the error-gate dry run: every
   finding is resolved by step 5 before the plan promises green.
5. Retarget P60 (`spec/04-runtime.md:500` → `Session → Session`) and add the
   §7.7.1b sentence; re-run `npm run validate` — 0 coupling errors.

**Phase 2 — scene-type tone directive and its contract.**
1. In `composeNarrationClearance`, after the `**Scene:**` line
   (`holonovel/src/index.ts:1260`), push `### Scene tone` with one line per
   active tag from `novel.scene_type` (`combat` → danger/momentum, `social` →
   subtext/tension, `exploration` → discovery/distance, `neutral` →
   observational), and the neutral line when the array is empty. Follow the
   neighbouring sections' style: a `###` heading and `-` lines, no tool names,
   inside `applyPromptBudget`.
2. Add T788 to `holonovel/scripts/test-lean-narrator.ts` beside T729's
   prompt-read pattern: create a Novel (`manage_novel (action: create)`), set
   the tag through `manage_scene` (`scene_type`, `holonovel/src/index.ts:7864`
   inside the tool registered at `:7895`), then read `prompts/get` on
   `narrate` — asserting set/unset/persistence as in Done bar 3.
3. Add `REQ-598a` after REQ-598 in `spec/02-requirements.md`: the prompt SHALL
   carry a tone directive for each active scene type among `combat`, `social`,
   `exploration`, and `neutral`, and the neutral directive when none is set; an
   unrecognized ruleset type contributes none; the directive persists while its
   tag remains and is present for both narrative roles. `_Check:_ T788`. Add
   the Appendix E manifest row and the Appendix F T788 row in the same step.

**Phase 3 — the §7.3a record.**
1. Add `### Prompt construction conventions — 2026-11-15` at the top of
   DECISIONS.md's dated sections (after `## Non-goals`, before the 2026-11-14
   section). Four bullets, each naming the clause, the mechanism, and the
   `holonovel/src` predicate:
   - archived-not-reinjected — the clearance prompt is built from Novel state
     (`composeClearedFacts`, `index.ts:1215-1242`) and its composer
     (`index.ts:1254-1317`) takes no transcript input, so prior prose cannot
     re-enter; archival lives in the audit log (REQ-040) and story journal
     (REQ-246);
   - voice profiles — `index.ts:1305-1313`: active `narrative_voices` Wisdom
     items are injected as a `### Narrative voices` block, capped at three,
     each description truncated to 320 characters;
   - scene-type anchoring — the new `### Scene tone` block (Phase 2), keyed on
     `novel.scene_type` and persisting while the tag holds;
   - anti-slop precedence — `index.ts:17884-17887` injects the Appendix J
     synopsis through `antiSlopFor` (`:3775`) as a leading orientation section,
     and the `narrate` prompt carries the narration contract (`:1299-1300`).
     The clause's "weighted above conversational context" ordering is the
     host's prompt assembly, which the server cannot observe: the record states
     the server-side half and names the host obligation rather than claiming an
     ordering the server does not control.
2. Cite only resolvable REQs (REQ-040, REQ-246, REQ-225, REQ-081, REQ-087,
   REQ-070, REQ-598, REQ-598a); `npm run validate` resolves them.

**Phase 4 — registration and closure.**
1. Appendix F: T420/T421/T434 gain "assert every pattern-rule source and target
   archetype token resolves to the §7.7.0 vocabulary or a declared alias, and
   assert a non-resolving token fails `npm run validate`".
2. `spec/audit/review-register.md`: move `F-U3-3` and `F-U3-4` under a new
   `### 2026-11-15 §7.3a record and P60 vocabulary` heading in `## Resolved`,
   each with `Resolved (2026-11-15)` and its predicate; delete the
   Scheduled-roadmap pointer text that names the roadmap item.
3. Delete `ROADMAP.md:78-91` (D8).
4. `npm run assemble`; `npm run validate -- --write-register`;
   `npm run build-order` (regenerates `contract-fingerprints.ts` from the §7.7
   edit, EV10).

**Phase 5 — verification and close.**
1. `npm --prefix holonovel run build` (typecheck of the prompt hunk), then
   `npm --prefix holonovel run test:lean-narrator` (T788 **and** T640, which
   asserts a lower-priority section still truncates).
2. `npm run test:validators`, `npm run validate:sdd` (record the warning count;
   it must not exceed the baseline's), `npm run check:fast` un-piped — the
   trailing line is the tell.
3. CHANGELOG entry, `aar.md`, `npm run session:close`.

## Ordering and parallel work

Phase 1 must precede Phase 2 (the predicate's red run is cheap only while P60
is unfixed). Phase 2 and Phase 3's first three bullets may proceed together.
Phase 4 depends on 1–3 (register rows cite the shipped predicates). Phase 5 is
strictly last. `spec/appendices-reference.md` is touched in Phase 2 (T788 + the
manifest row) and Phase 4 (T420/T421/T434); those are sequential steps, not
parallel ones.

## Failure modes

| Failure | Mitigation |
|---|---|
| The helper's alias handling disagrees with `resolveArchetypes` (`scripts/validate.ts:1101-1107`), producing a false positive. | The helper receives the same sets as arguments from `checkCouplingCompleteness`; the self-test includes an alias-only token case; pattern rules carry archetype tokens only (EV6). |
| The dry run reports more than one error (an unknown token besides `Surface`). | Resolve each by the D1 test (property group → vocabulary; config knob → retarget). Record any token needing a judgement call in `tasks.md` before editing spec prose. |
| The tone section displaces a lower-priority section under a tight budget and breaks T640's truncation assertion. | Phase 0 step 3 measures the slack before the edit; Phase 5 runs the whole harness, T640 included; the section sits high in the list, inside `applyPromptBudget`. |
| `REQ-598a` exceeds the 800-character or 8-sentence cap. | The drafted body is four sentences and roughly 600 characters; `npm run validate` reports both caps. If it overruns, cut the acceptance criterion, not the contract. |
| The §7.7 edit leaves `contract-fingerprints.ts` stale. | Phase 4 step 4 runs `build-order`; pre-commit's `check-fingerprint-sync` is the backstop. |
| The register/roadmap cross-reference drifts. | Phase 4 edits both in the same step; `check-registers` gates the pair. |

## Verification

| Step | Command | Pass condition |
|---|---|---|
| Predicate red | `npm run validate` after Phase 1.2, before 1.5 | exactly one coupling error, naming `P60` and `Surface` |
| Predicate green | `npm run validate` after 1.5 | 0 coupling errors |
| Helper self-test | `npm run test:validators` | 3 cases pass |
| Prompt contract | `npm --prefix holonovel run test:lean-narrator` | T788 and T640–T729 pass |
| Register pair | `npm run check-registers && npm run check-roadmap` | exit 0 |
| Fingerprints | `npm run build-order` then `npm run check-fingerprint-sync` | exit 0, no drift |
| Full gate | `npm run check:fast` (un-piped) | `check:fast: PASS`, 0 errors |

## User impact

None at runtime: the `narrate` prompt gains one section for prompts that carry
a scene tag; no tool, badge, or state surface changes, and no migration. The
DECISIONS section is documentation. Publisher-side, the increment re-publishes
the spec package (fingerprint change), so `push-pipeline.sh` records a
`Holonovel Spec Update` entry — a minor-version publication path already in
place.

## Open questions

- **Q1 — D3 scope.** The roadmap item reads as documentation plus a vocabulary
  predicate; D3 adds a shipped prompt section. Execute D3 as planned, or
  document clause 3 as unmet and schedule it? Recommendation: execute — the
  clause is a SHALL, and the change is six lines with one test.
- **Q2 — Tone wording.** The four tone lines are content, not contract; they
  are batched with D3's style rather than drawn from a ruleset source. If a
  Wisdom tone source should own them, say so before Phase 2.

## Unknowns

- Whether any shipped ruleset package composes its own `narrate` prompt that
  would bypass `composeNarrationClearance`. Phase 0 adds one grep
  (`grep -rn 'narrate' holonovel/src holonovel/packages`); if a package-owned
  prompt exists, T788's target is the host prompt and the package path is
  recorded as a follow-up, not silently skipped.
