# Report — cold re-review (v2), roadmap clearance plan

```
Reviewer: DeepSeek V4.1 Flash 1017 (cold, capped re-review)
Plan:    /home/fluke/Holonovel/docs/plans/2026-11-15-roadmap-clearance/plan.md
Plan sha256: 08d356499977ba0667c913e5a9853ad732fe01b01a0189a61570ab5a889ba1f1 (matches dispatch)
Tasks sha256: bfc7b9b341ad28211898d2077e56105d927199dbb953e33c2f9ce4bebb7a0f01
Sidecar sha256: af9561bca9d66eb566521d954ec1959032b24bde786353c082939620663e2f17
Sidecar plan hash field: 08d3564… (agrees) · git_head a038d6a
Prior artifact sha256: 69523f1… (v1 bytes absent; used the Resolutions section + prior report quotes)
Scope: amended text only; no new-lens sweep; six prior "Verified" claims not re-reviewed
Reads: ~24/40
```

### Prior findings — verdict

| Prior | Verdict | Evidence |
|---|---|---|
| **B-1** | **Resolved** | E2 (`plan.md:378–383`) names F-U4-1/5/7 and F-P8-2 and *moves* them to `## Resolved — 2026-11-15`. `scripts/lib/register-checks.ts:64–69` constrains only `Scheduled-roadmap`; `:7` accepts any `^## Resolved\b`. Note `:61`: each moved finding needs a date or commit hash in its own text or it becomes an INFO count. |
| **B-2** | **Resolved (prior point)** | Register is the sole source and the column really exists (`spec/audit/req-coverage.md:6` header `§5.12 disposition`; 31 §5.12 rows `:304–335`, all `implemented`). Block generated (`plan.md:257–266, 322–330`); intersection fallback deleted (`:456–461`). New consequences below (#1, #2, #3). |
| **M-3** | **Resolved at field level; regression below** | A4 (`:276–280`) leaves T396 alone; C5 (`:344–345`) + T16 (`tasks.md:60–62`) carry the §8 assertions into commit 3. But the block rewrite re-opens a commit-1 red path — see #2. |
| **M-4** | **Resolved** | D7 (`:228–237`): 82 = 84 − 2 (EV16 `:162–166`), parent roll-up stated, `total` = 82; A5 (`:281–283`) updates `DECISIONS.md:2382` unconditionally; T5 (`tasks.md:26–28`). Residual → #3. |
| **M-5** | **Resolved** | C1 (`:327–329`) enumerates all 84 bodies with parent + disposition, satisfying `spec/appendices-reference.md:1865`. Minor: the assertion is assigned to T396 (`:344–345`) while T403 is the row that names it — state the ID remap. |
| **M-6** | **Resolved** | Four classes (`:250–251`, `:335–341`), key `<job>/<step name>` (D9). Cross-checked `ci.yml:18–38,44–47`: 12 `run:` steps = 2 `npm ci` + `npm run check` + `npm run assemble` + 6 CI-only; + 2 container = 8 table rows (`tasks.md:53–54`). Dry-run expectation (`:338–341`) now matches. |
| **M-7** | **Resolved** | EV13 (`:144–151`) now says "no *fast* gate and no repair-command message" and records that the Holosuite tiers do resolve anchors; item 5's closing evidence is stated (`:180`). Nits N-1, N-9. |
| **M-8** | **Resolved** | D8 (`:240–245`) puts the pure helper in `holonovel/src/narrative-coherence.ts`; `index.ts` autostart caveat named, harness imports the helper, not `index.ts`. |
| **M-9** | **Partly** | Version-sync rows added (`:405–409`) and revert claim scoped to commit 5 (`:434–438`). Still wrong on two counts — Nit N-3. |
| **M-10** | **Resolved** | No roadmap-figure edits (`:224–230, 328–330`); EV6 states supersession (`:98–107`). |
| **M-11** | **Resolved, arithmetic verified** | Three entries (`:415`), two fast-wired → 43 baseline (`/tmp/opencode/checkfast-baseline.log:53`) + 2 = **45** (`:445–446, 485`; `tasks.md:89–91`); commit 1 = 44 (`tasks.md:28`). Consistent. |
| **N-12** | Resolved | Seven sites (`:116–124`; B2a `:295–300`). |
| **N-13** | Resolved (wording residual N-4) | `check-gate-table` named separately (`:346–348`). |
| **N-14** | Resolved | `collectHarnessTestNames` (`:301–306`) and explicit grammar (`:303–306`). |
| **N-15** | Resolved | ±40-line window (`:352–356`); header/usage/exit-code/allowlist surfaces (`:357–360`). |
| **N-16** | Resolved (wording N-5) | B4 adds both conventions (`:310–313`). |
| **N-17** | Resolved | `plan.evidence.json` exists, hashes the current plan; Nits N-8. |

### New findings

1. **`[Blocker][design]` The generated DECISIONS block cannot carry §8's run-record fields and stay byte-deterministic.**
   C1 says the *whole* `narrative_coherence` block "is now generated between `<!-- g7:start -->`/`<!-- g7:end -->`" and "carries §8's six fields — workflow name (G7), timestamp, environment pins (Node, OS, protocol), commands and output, pass/fail, findings" (`plan.md:322–330`); A1's generator writes it and `--check` compares bytes (`:257–266`); A3 wires that check into **check:fast** (`:273–275`). §8 defines those fields as a run record (`spec/05-verification.md:3–5`). The cited model is explicit that generated committed artifacts contain no run stamp — `holonovel/scripts/generate-world-provider.ts:9`: "byte-deterministic — no timestamps or version stamps". A generated timestamp or Node/OS pin either changes on every run (gate never green) or freezes one machine's values while claiming to be an environment pin. The plan names no input for four of the six fields, and it also never says whether A5's hand-edit of `DECISIONS.md:2382` (`:281–283`) is inside the generated region or outside it. **Must change:** state the marker scope and provenance — e.g. §8's recorded fields plus the three attestation points and the smoke link are authored once *outside* the markers, and only `SPEC_512_REQS`/`SERVER_512_REQS`/`ATTESTED_PARENTS`/`SOURCE_HASH` and the 84-row enumeration are generated and `--check`-gated — or name the checked-in attestation input the generator reads.

2. **`[Major][design]` Commit 1's declared `test:g7` gate can still be red: the block rewrite drops the substrings T396 asserts today.**
   T396 currently asserts DECISIONS.md contains `narrative_coherence`, `@section evidence`, and `smoke-session` (`holonovel/scripts/test-g7.ts:82–87`). A1's emitted content is IDs + hash + the enumerated block (`plan.md:260–263`), and C1 — the step that adds "the three attestation points, the smoke-transcript link" — lands in commit 3 (`:322–330`, `:344–345`). Commit 1's gate is `npm --prefix holonovel run test:g7` (`:423–424`). Under C1's reading (whole block generated by A1) `smoke-session` disappears at commit 1 and returns only in commit 3; under A1's reading (markers wrap only the enumeration) C1's sentence is false. **Must change:** fix the marker scope in A1 (prose + (a)(b)(c) + smoke link preserved outside the generated region), or move the three existing T396 substring assertions to C5 as well and say so.

3. **`[Major][design]` D7 defines `attestation` in terms the server cannot evaluate, so runtime `fail` stays unreachable — the EV3 defect in a new wrapper.**
   D7: "`attestation` = `recorded` when the DECISIONS block is present and current" (`plan.md:231–233`). D1 and EV17 say the server cannot read DECISIONS in a packed install (`:185–192`, `:167–170`); A1 therefore emits `ATTESTATION_RECORDED` as build-time data (`:261–262`) that `index.ts` imports (`:269–272`). With the register marking all 31 parents implemented (`req-coverage.md:304–335`), `implemented == total == 82` and `recorded == true` on every build, so the disposition is permanently `pass` — precisely what EV3 identifies as the defect (`plan.md:85–88`) and what item 1's row claims to fix ("`partial`/`fail` become reachable", `:176`; T403's "`fail` disposition blocks handoff", `spec/appendices-reference.md:1865`). **Must change:** name a runtime input that can make `recorded` false or `implemented < total` without a rebuild (e.g. a session/state attestation check), or restate item 1's claim as "`partial`/`fail` are reachable in the pure function and proven by harness cases", and record the runtime residual in the item disposition.

4. **`[Major][design]` A4's three branches do not follow D7's disposition rule, and one return value it expects does not exist.**
   A4 wants "a 3-REQ subset → `partial` with the missing IDs listed" and "empty attested → `fail`" (`plan.md:276–278`). D7: `partial` iff `implemented > 0` **or** the attestation is recorded; `fail` otherwise (`:233–237`). With `recorded` true, "empty attested" yields `partial`, not `fail`; and a 3-REQ `specReqs` with the generated attested set yields `implemented == total` → `pass`. Also `reqs` "keeps listing **implemented** IDs" (`:236–237`), so the missing IDs are not in the return shape at all. As written, commit 1's `test:g7` cannot be green and ROADMAP item 1's trigger ("a harness case that forces `partial`", `ROADMAP.md:26–28`) is not evidenced. **Must change:** name which argument each branch subsets, pass `recorded=false` in the fail case, and either add a `missing`/`unimplemented` key (breaking the "four-key shape preserved" promise, so say which) or assert `total − reqs.length`.

### Nits

- **N-1 `[Nit][clarity]`** EV13's closing sentence calls `checkTestNameInflation` (`scripts/validate.ts:1524`) "the nearest guard" to anchor drift (`plan.md:149–151`); it guards test-title ID inflation and has nothing to do with `path:line#symbol`.
- **N-2 `[Nit][clarity]`** D9 says the two `npm audit` steps "differ only by `working-directory`" (`:246–250`); they also carry distinct step names (`ci.yml:32`, `:34`) — which is exactly why the chosen key works. The rationale contradicts the conclusion it supports.
- **N-3 `[Nit][clarity]`** The commit-5 version-sync claim (`:434–438`) overstates: root CalVer is already `2026.11.15` (`package.json:3`; `holonovel/src/index.ts:169`), and `build-order` runs `version-bump` idempotently (`scripts/build-order.ts:251–254`), so "reverting it alone restores the previous version strings" describes a change that will not exist today. The set also includes `holonovel/src/index.ts:169` (`scripts/version-bump.ts:53–56`), which the sentence omits.
- **N-4 `[Nit][clarity]`** Phase C's verification defers `check-gate-table` to "the AGENTS table regeneration in D3" (`:346–348`) while T17 regenerates it in commit 3 (`tasks.md:63–64`); commit 3 adds no manifest entry, so T17 is redundant and the cross-phase reference misleads.
- **N-5 `[Nit][clarity]`** B4's parenthetical "`T020` is not `T20`" (`:311–312`) reads backwards; the point is that the padded form is not an identifier.
- **N-6 `[Nit][clarity]`** T8 says "title corrections" only (`tasks.md:38–40`); the seven collision re-labels (B2a, `plan.md:295–300`) are a separate class that the task list never assigns.
- **N-7 `[Nit][design]`** `plan.md:3` claims "every Blocker and Major resolved below" while M-9 remains inaccurate (N-3) and two new decisions are unresolved (#1, #3).
- **N-8 `[Nit][clarity]`** The sidecar exists and matches, but the plan never cites `plan.evidence.json`, and the sidecar's `targets` list (11 entries) omits most files the plan changes (`test-g7.ts`, `test-backfill.ts`, `package.json`, `ROADMAP.md`, `review-register.md`, …).
- **N-9 `[Nit][design]`** Item 5 closes on "the tool self-test proves the 23-site class repairs itself" (`:180`, `:484`); D-4's test exercises one shifted anchor in a scratch copy (`:366–369`). EV9's 23-site replay is the only real evidence and was not reproduced here.

### Unknowns

- EV7's 1061/768 and EV9's 23-site replay were not re-derived (capped re-review; the prior pass also left these unresolved).
- Whether the coverage audit pairs T403 with the DECISIONS-list assertion or keeps the two harness IDs separate — I did not read the pairing logic; if it pairs by ID, assigning T403's clause to T396 (M-5) needs an explicit note.
- B-1 residual: the moved findings need a date/commit inside their own text or `register-checks.ts:61` counts them as grandfathered (INFO, not a failure).
- Isolation caveat: the host injected `AGENTS.md`/`holonovel/AGENTS.md`; nesting is not permitted, so this is one context applying the stage questions rather than five fresh dispatches.
- Persistence: `report-2.md` was not created (no write path); the cold artifact for any stamp must be written by the parent from this text.

---

Blockers: 1 · Majors: 3 · Nits: 9 · Stages: re-audit of prior findings (Stage 4 equivalent), reads ~24/40

`independent-review FAILED.`
