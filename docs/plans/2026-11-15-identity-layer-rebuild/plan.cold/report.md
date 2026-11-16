Reviewer: review (cold subagent, deepseek-v4.1-flash)
Plan sha256: 702c5223b32a369f33c413f407b14229119b04c092916e5f4858cc56d9cdcc69
Depth: standard · Stages: 1–5 in one context (nesting prohibited for this subagent;
        Stage 4 not triggered — no post-Stage-3 artifact edits)
Reads used: 33 read/grep of 40, plus 2 read-only shell inspections
Target: docs/plans/2026-11-15-identity-layer-rebuild/plan.md (338 lines, sha256 verified at HEAD 8f5075d)
Companion: docs/plans/2026-11-15-identity-layer-rebuild/tasks.md (49 lines)
Standards applied: AGENTS.md (repo), docs/plans/README.md, Appendix M/T.3 as cited

# Cold review — identity-layer rebuild

## Stage 2 — Comprehension (artifact only)

The increment rebuilds §1 of `spec/01-foundations.md`: it separates the product mission from §6.7 rebuild mechanics, adds goals/non-goals/audiences, redefines the north star ("the rules govern the consequences") and defines "responds with intent". Separately it closes a preparation-parity gap: the codex can import and capture but cannot export, so the plan adds `manage_codex (action: export)` on the existing tool (no new tool, so no tool-count change), writes new requirement REQ-660 with test row T792, implements the action in `holonovel/src/index.ts` with a harness assertion, regenerates the surface artifacts, fingerprints, coverage register and version, and closes with a CHANGELOG entry, an AAR and `session:close`. Phase A (prose) is commit 1; Phase B (contract + code) is commit 2. "Done" = `npm run assemble && npm run check:fast` PASS on the final tree, §1 carrying the nine named subsections and six anchored goals, §4 registering *Holodeck*/*holonovel*, T.3 carrying the four-use projection, REQ-660 present in the manifest, catalogue, section map and coverage register with a real implementation site, the export action implemented and documented with current generated artifacts, B3 shipped or scheduled, both commits landed, and `aar.md` ending `LOOP PAUSED` with zero new action items.

**Verdict on comprehension: faithful with gaps** — the done-bar is stated, but two mechanisms it depends on (how commit 1 is produced; which harness file holds the assertion) cannot be determined from the document.

## Blockers

**IR-01 [design] — The action's declaration file `holonovel/tool-surface-registry.json` appears nowhere in the plan.** Every step, the blast-radius table (plan:282-300) and the B0 measurement table (tasks.md:44-49) omit it, yet the action cannot exist without a declaration there: `holonovel/src/rulesets.ts:73-74` ("Keep in step with `holonovel/tool-surface-registry.json`; `check-tool-surface` asserts parity"), `scripts/check-tool-surface.ts:48`, `scripts/surface-budget.ts:25`, `scripts/surface-replay.ts:26`, and `holonovel/src/core/badge-gate.ts:140` / `core/audit-gate.ts:55` all read `registry.actions[key].mutation_class`. T.3 (`spec/appendices-reference.md:3591-3597`) requires every action to declare `group`, `phases`, `entry`, `mutation_class`, `ruleset`, `preconditions`, `successors`, `edges` — the plan specifies none of these values, and B1a's "badge gate (Editor or Game Master)" is unimplementable as written because a `mutation_class: "read"` declaration lets the Player through unless the action is additionally listed in `MUTATING_READ_ACTIONS` (`badge-gate.ts:99`, `audit-gate.ts:55`). *Must change:* name the registry file as a target, specify the eight declaration fields, and state the read/audit classification plus the `MUTATING_READ_ACTIONS` membership decision.

**IR-02 [design] — "Two commits" has no executable mechanism, and it contradicts the AAR gate.** The only named close path is `npm run session:close` (plan:278, tasks.md:35), which makes one commit (`AGENTS.md`: "derives the subject … runs the fast suite, and commits"; "A spec increment stays one commit"); `docs/plans/README.md:52-54` likewise. No step names a command or procedure that produces commit 1, yet the done bar requires "both commits are landed" (plan:324). Compounding it, `scripts/lib/loop-artifacts.ts:72` errors on "missing aar.md" for an increment directory and `:79` requires a LOOP token, while C2 "rewrite `aar.md`" (plan:275) happens after both commits — so the AAR committed in commit 1 (blast radius plan:299 puts the increment dir in commits 1 and 2) is necessarily a pre-final AAR. *Must change:* state the exact commit sequence (commands), and reconcile the increment-directory/AAR ordering with `check-loop-artifacts`.

**IR-03 [design] — The only code-side verification command is a placeholder.** B1a:233 and tasks.md:22 (T12) both read `npm --prefix holonovel run test:<codex harness>`; blast radius:290 reads `holonovel/scripts/test-*.ts`. `holonovel/package.json` declares 60 `test:*` scripts and none is a codex harness; the plan never names the file that receives the round-trip assertion (export → import → export byte-identical). Stage 5 forbids this: the acceptance criterion is neither executable nor observable. *Must change:* name the harness path and script (existing or newly created, with the `package.json` entry and its wiring into `test:all`).

## Majors

**IR-04 [clarity] — REQ-660's section placement is self-contradictory.** Plan:218-221 (B1) says "placed in §5. beside the Editor-badge and exchange contracts", but the Editor-badge contract is §5.5 (heading `spec/02-requirements.md:1216`, REQ-031a at `:1229`) and the exchange contracts are §5.7 (heading `:2316`, REQ-620/621 at `:2556`). S-3 (:25-28), B6 (:258) and T14 (tasks.md:24) all say §5.6 (heading `:1489`). The fingerprint consequence in B6 only holds for §5.6: `scripts/lib/contract-fingerprint.ts:37-43` (`DATA_SECTIONS`) contains `"### 5.6 "` and neither §5.5 nor §5.7. An implementer following B1's rationale would invalidate B6. *Must change:* state §5.6 once and drop the misattributed neighbours.

**IR-05 [design] — Two evidence rows do not resolve to the text the plan attributes to them.** (a) EV9 (:82) cites "REQ-321a, REQ-321o" for `spec/02-requirements.md:2294`; `REQ-321o` does not exist anywhere in `spec/`, and line 2294 belongs to **REQ-321m1** (`:2293`). (b) EV17 (:90) says "`test-spec-tooling` requires the string `Appendix V (Workflow Runbooks)`" at `scripts/test-spec-tooling.ts:396`; line 396 is a `parseAppendices` preamble assertion and the string appears nowhere in that file — it lives at `spec/01-foundations.md:87`. A4's constraint (:180) therefore rests on a gate that does not exist. Given the plan's stated evidence class ("repo `file:line` reads at HEAD", :7), *must change:* correct both rows and re-check the remaining sixteen against their cited lines before execution.

**IR-06 [design] — The strict-audit evidence mechanism is assumed but never specified.** S-1/D10 rest on `HOLONOVEL_IMPL_STRICT=1` promoting unevidenced server-runtime REQs; the audit's notion of evidence is a citation in `holonovel/src` (`scripts/validate.ts:1864`, `:1927`, `:1950-1951` speak of REQs "cited in holonovel/src", with an explicit whitelist map for builder-side dispositions). B1a (:227-234) and T17 (tasks.md:27) say only "the coverage register row points at a real site". *Must change:* require the `REQ-660` citation at the implementation site in `holonovel/src/index.ts` and in the harness, and state where the server-runtime classification itself is recorded.

**IR-07 [design] — B0's four-file threshold is already falsified by IR-01/IR-08, so B3's condition is decided before B0 runs.** B0 (:206-213) drops the codex artifact kind if the measurement "shows more than those four files". The registry (IR-01), `spec/audit/tool-surface-replay.json` and `spec/audit/action-conflicts-baseline.json` are three more, so B3 is dropped by construction and B0's measurement cannot change the outcome. *Must change:* state the real artifact set up front and make the B3 condition depend on something B0 can still measure.

**IR-08 [design] — Two `check:fast` gates that a new action moves are absent from every list.** `surface-replay` records `spec/audit/tool-surface-replay.json` (`scripts/surface-replay.ts:28`) and refreshes only via `--write` (:48); `action-conflicts --check` is gated in both modes (`AGENTS.md` gate table) against `spec/audit/action-conflicts-baseline.json`. Neither file nor gate appears in the blast radius, B0's table, or B2/B7. A new action changes the projected catalog size and the recorded surface. *Must change:* add both artifacts and their `--write`/refresh steps to the target list and the gate sweep.

**IR-09 [design] — The new export action's boundary against REQ-321l is unstated.** `spec/02-requirements.md:2291` (REQ-321l): "Codex entries SHALL NOT appear in `manage_archive (action: export)`, `manage_archive (action: clone)`, or checkpoint snapshots." B2 (:236-241) says only "semantics mirror `manage_lore (action: export)`". The plan should state that REQ-321l survives unchanged and that the codex export is a distinct surface, or an implementer may route codex content through the Novel export. *Must change:* one normative sentence in B2 plus a line in the done bar.

**IR-10 [design] — "Each reverts on its own" contradicting the blast radius.** Plan:5-6 claims independent revert. Blast radius:297 puts the generated `holonovel.md` in **both** commits; a revert of commit 1 after commit 2 conflicts in that same generated file, so rollback independence is not demonstrable as written. *Must change:* either rebuild `holonovel.md` per commit and say so, or state that rollback is "revert both, re-assemble, re-verify" with the command.

**IR-11 [clarity] — The done bar adds a requirement the house definition does not contain.** Plan:324 requires "`aar.md` ends `LOOP PAUSED` with zero new action items". `docs/plans/README.md:60-64` defines `LOOP PAUSED` as *every finding has a terminal disposition*, which explicitly includes scheduled and record-and-closed findings; `README.md:44-46` sanctions small fixes in-increment and scheduling otherwise. A "zero new action items" bar is not achievable at planning time and forbids the sanctioned disposition. *Must change:* restate the bar as "every finding carries a terminal disposition; `LOOP PAUSED`".

## Minors

**IR-12** "gate classification if required" (plan:294) is an unresolved decision in a blast-radius cell; `AGENTS.md`'s pre-commit checklist requires the DECISIONS.md gate-classification table (REQ-137a) for new tools, and the plan never decides whether an action on an existing tool triggers it.

**IR-13** The B0 table pre-fills gate attributions, one of which is wrong: DECISIONS.md counts are read by `scripts/surface-budget.ts:27`, not `check-tool-surface` (tasks.md:46). A measurement step pre-populated with unmeasured answers is not a measurement.

**IR-14** B5's escape hatch — "or record why the surface change does not advance the CalVer" (plan:251-252, echoed in Open question 4 :336-338) — conflicts with `AGENTS.md`'s mandatory regeneration sequence for any spec edit (CalVer, AGENTS.md, DECISIONS.md, index.ts, lockfile, server.json advance together, REQ-107a). Remove the hatch.

**IR-15** REQ-660's body is never drafted and no length discipline is stated. Appendix M caps a REQ at one paragraph, 8 sentences and 800 characters, while D5/D7/D8 ask the body to carry parity, exit scoping and a kinds exclusion. Say how the body fits.

**IR-16** The SR-1…SR-10 dispositions live only in the plan's `Resolves` table (:40-51), with SR-10 "record-and-close". `AGENTS.md` register hygiene puts findings in `spec/audit/review-register.md` with terminal dispositions, and SR-10's record-and-close needs a dated AAR note — say where each disposition will actually land.

## Nits

**IR-17** plan:111 ends with a trailing space (harmless; plans are not linted).
**IR-18** The evidence sidecar records `lines: 339` for a 338-line artifact; the sha256 matches, so this is a counting artifact, not drift.
**IR-19** Questions Q5 (:68) promises "no new action-count gate failure" while T.3 (`appendices-reference.md:3643-3645`) says action counts are reported not gated and `surface-budget.ts:135` still records them; phrase it as "the recorded baseline is regenerated".

## What I verified as correct

- Plan sha256 matches the dispatched hash; `git_status` shows only the increment directory untracked.
- EV1/EV2/EV3/EV21 resolve: `spec/01-foundations.md:115` (full-rebuild clause), `:122`, `:127`, `:14`.
- EV9's quotation of REQ-321a is verbatim at `spec/02-requirements.md:2258`; EV10 at `:2291`; EV11's action set (set/import/capture/list/get/delete) is complete at `:2261-2285`; EV12 at `:3098`.
- EV14/EV16: eight groups at `spec/appendices-reference.md:3570-3577`, `author` = "Author out of play under the Editor badge" at `:3576`, balance rule at `:3642`, "action counts reported but not gated" at `:3643-3645`.
- EV15 at `holonovel/src/rulesets.ts:76`; EV19 at `holonovel/DECISIONS.md:13-28`; EV22 at `scripts/check-tool-surface.ts:234` and `scripts/surface-budget.ts:135`.
- S-3/B6's fingerprint premise holds: `"### 5.6 "` is in `DATA_SECTIONS` (`scripts/lib/contract-fingerprint.ts:38`).
- EV18: no `REQ-6xx` ≥ 660 and no `T79[2-9]`/`T8xx` row exists — REQ-660 and T792 are free.
- Every root command the plan names exists in `package.json` (`assemble`, `validate`, `check`/`check:fast`, `check-tool-surface`, `surface-budget`, `check-tool-definitions-sync`, `check-fingerprint-sync`, `build-order`, `version-bump`, `check-package-manifest`, `test:spec-tooling`, `test:all`, `session:close`, `check-loop-artifacts`), and `surface-budget -- --check` / `--write` / `validate -- --write-register` are real flags.

## Unknowns

1. Whether `scripts/session-close.ts` supports any multi-commit mode (not read inside budget); IR-02 cites `AGENTS.md` and `docs/plans/README.md` only.
2. Whether `surface-replay --check` fails on catalog-size drift alone or only on precision/visibility floors (I read the header and the `--write` contract only).
3. Which gate, if any, actually anchors the reading guide's "Appendix V (Workflow Runbooks)" line — IR-05 shows it is not `test-spec-tooling`.
4. Whether `check-anchors` applies to plan-artifact evidence anchors (the plan's `file:line` claims) or only to spec anchors.
5. Isolation caveat: this context carried host-injected `AGENTS.md` and `holonovel/AGENTS.md`. They are project standards the artifact also appeals to, so the finding set should not be weakened — but the injection is recorded because I did not choose those reads.
6. `aar.md` (813 B) already exists in the increment directory before execution; T25 says "Rewrite", which I treated as consistent. Not read, deliberately, to avoid inheriting authoring conclusions.

## Coverage of the five focus areas

1. Server-runtime REQ consequences — **partial**: section map, manifest, catalogue, coverage register, fingerprints, version, AGENTS/DECISIONS counts are all present; the REQ's *evidence* mechanism (IR-06), placement (IR-04) and the class of record are not.
2. Tool-action coverage — **incomplete**: registry declaration (IR-01), replay and action-conflict artifacts (IR-08), codex/Novel export boundary (IR-09), badge/audit seam (IR-01).
3. Verification commands — all named root commands exist; the one code-side command is a placeholder (IR-03); one gate attribution is wrong (IR-13).
4. Evidence claims — 19 of 22 resolve; EV9 and EV17 do not (IR-05); EV18 verified.
5. Done-bar satisfiability and rollback — the bar contains an unsatisfiable clause (IR-11); the two-commit structure is unmechanised (IR-02); rollback independence is unsupported (IR-10).

```
independent-review FAILED.
```

**Summary for the parent:** 3 Blockers, 8 Majors, 5 Minors, 3 Nits · the plan is well-evidenced in the large (T.3, codex, fingerprint and version consequences are all correct) but is not executable as written: the tool-surface registry declaration is missing entirely, the two-commit structure has no commit mechanism that the AAR gate permits, and the harness verification is a placeholder. Re-run should re-audit only the failed stages (1, 3, 5) after those are fixed.
