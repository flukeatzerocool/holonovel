# Cold re-review — identity-layer rebuild, v3 (diff re-review)

Artifact hashes verified: `plan.md` = `eaa2284…5530` (425 lines) matches the dispatch; `tasks.md` = `65b2fa0…0dd` (51 lines).

## Dispositions confirmed resolved on evidence

| ID | Evidence read | Outcome |
|---|---|---|
| IR-01 | `holonovel/tool-surface-registry.json` exists; `src/core/badge-gate.ts`, `src/core/audit-gate.ts` exist; plan:301-304 declares all eight fields (group, phases, entry, mutation_class, ruleset, preconditions, successors, edges) | **Resolved by deferral** — B0b (plan:280-288) is a measured step with named predicates, not an assumption |
| IR-03 | `holonovel/package.json:74` = `"test:output-contracts": "tsx scripts/test-output-contracts.ts"`; `holonovel/scripts/test-output-contracts.ts` exists | **Resolved** — the placeholder is gone; plan:309-312 names the real harness and script |
| IR-05(a) | Consistent with prior reviewer's own read (`:2294` belongs to REQ-321m1 at `:2293`) | **Resolved** (plan:142) |
| IR-05(b) | `scripts/test-spec-tooling.ts:378` is exactly `check(/Appendix V \(Workflow Runbooks\)/.test(readingGuide), "T464/REQ-395b: the reading guide reaches Appendix V");` | **Rejection upheld.** The gate exists; EV17's `:378` (plan:150) is correct; A4's constraint (plan:241, :243-245) rests on a real gate. The prior report's IR-05(b) was a grep miss, not a plan defect |
| IR-04 | plan:292-294 states §5.6 once; no §5.5/§5.7 attribution remains | **Resolved** |
| IR-09 | plan:319-321 and done bar :410 both carry "REQ-321l is unchanged" | **Resolved** |
| IR-11 | done bar :414 "every finding carrying a terminal disposition" | **Resolved** |
| IR-12 | plan:285-286 + blast radius :383 "recorded, not assumed" | **Resolved** |
| IR-13 | `tasks.md:43-51` — table blank, seven rows, no gate attribution pre-filled | **Resolved** |
| IR-14 | plan:335-338 B5 has no hatch | **Resolved** |
| IR-15 | plan:290-295 states ≤8 sentences / ≤800 chars + the first clause cut (D8) | **Resolved** |
| IR-16 | plan:358-360 names `spec/audit/review-register.md` and the dated AAR note | **Resolved** |
| IR-10 | Follows from D9; rollback cost now 1 (plan:5) | **Resolved** |

## Surviving Blocker

**[Blocker] [design] — D6 reintroduces the second commit that D9 removed.**
`plan.md:184` — "A codex artifact kind is **conditional** on B0's measurement (EV13), and if it ships it lands as its own commit inside this increment." This contradicts, in the same Decisions section, `plan.md:192-196` (D9: "One commit… Superseded the earlier two-commit split"), `plan.md:267` ("Phase B — contracts (same commit…)"), and `plan.md:396` ("One commit, after Phase C's AAR rewrite"). The predicate is that the IR-02 reversal edited D9, the Phase headers and Commit order but left D6's sentence intact. Consequence: the B3-shipped path recreates exactly the defect IR-02 recorded — a second commit with no gated mechanism, and `tasks.md:36` (T26) closes once with `session:close`. Must change: D6 must say "ships within the same commit" or B3 must be forced to deferral.

## Majors

**[Major] [clarity] — IR-19 is not applied; the disposition claims a rephrase that is absent.**
`plan.md:95` says "**IR-19** — Q5 rephrased to 'the recorded baseline is regenerated'." `plan.md:127-128` (Q5) still reads "…and no new action-count gate failure" — the exact phrase IR-19 flagged (prior report:60). A disposition table that reports a fix the artifact does not contain is worse than an open finding, because the gate stamp would record it as closed. Must change: apply the rephrase at :128, or mark IR-19 open.

**[Major] [clarity] — "The eight commands in C3" does not match C3.**
`plan.md:397` — "The eight commands in C3 are the sequence". C3 (`plan.md:362-364`) contains one command (`npm run session:close`) and its four stated effects. The count is a leftover from the removed two-commit sequence. Because this sentence is the plan's only statement of commit mechanism, a stale count there is not cosmetic.

**[Major] [clarity] — B1a says "Eleven edits" and lists four.**
`plan.md:300` — "**B1a — Implement the action.** Eleven edits:" followed by items 1-4 (`:301-312`), covering registry, badge seam, `index.ts`, harness. No eleventh-edit content exists anywhere in the step; tasks.md splits the same work into T12-T14. Must change: state the real count (four) or enumerate the remainder.

**[Major] [design] — B3's condition is attributed to a measurement B0 does not perform.**
`plan.md:327-329` — "Decide on what B0 can still measure: whether a fourth artifact kind forces a second catalogue regeneration beyond the seven artifacts already in scope." B0's measurement (`plan.md:269-275`, `tasks.md:20`, rows at `tasks.md:45-51`) measures **which artifacts a new action moves**, across seven gate commands; none of them observes artifact-kind admission (REQ-620/REQ-621) or catalogue regeneration. The v3 disposition claim at `plan.md:72-74` ("depends on something B0 can still measure") is therefore not supported by the artifact. The pre-decided smell of IR-07 is reduced but not removed: the condition should be stated as a B3-local experiment (attempt the admission row, re-run the catalogue gates, keep only if no second regeneration is needed), not as a B0 output.

**[Major] [design] — `action-conflicts-baseline.json` has no refresh step, and cannot have a `--write`.**
`plan.md:376-377` — "regenerated (`surface-replay -- --write`)" / "`spec/audit/action-conflicts-baseline.json` | regenerated or confirmed unchanged"; `tasks.md:27` (T17) runs only `action-conflicts -- --check`. Predicate: `scripts/action-conflicts.ts:17` — "Flags: --check, --json (machine-readable payload to stdout), --help/-h"; `:28-31` the same; `:137` — "Resolve the conflict or add a disposition to spec/audit/action-conflicts-baseline.json." The baseline is a hand-maintained disposition list; it is not regenerable. IR-08 is half-fixed: replay's `--write` is real, action-conflicts' is not, so an implementer whose `--check` fails (a new action whose operation signature collides) is left with "regenerated" as the instruction and no command. Must change: say the file is hand-edited with a disposition entry, and give the criterion for adding one.

## Nits

- `plan.md:171` still ends with a trailing space (IR-17, harmless; plans are not linted).
- `plan.md:71` — "B1 records the server-runtime classification where the surrounding REQs record it" is circular; IR-06's "state where the classification is recorded" is satisfied in spirit at `:197-202` (D10) but the B1 clause does not name the surface.
- `plan.md:372` vs `:408` describe Appendix F as "test row" then "catalogue"; both are consistent with a test catalogue, but pick one noun.

## Unknowns

1. Whether `holonovel/scripts/run-test-suite.ts` actually dispatches `test:output-contracts` — `test:all` is a suite runner (`holonovel/package.json:120`), not a shell chain, so the plan's "already in `test:all`" (`plan.md:312`) rests on the suite manifest, which I did not read (budget exhausted).
2. The plan's "31 existing `manage_codex` references" in the harness (`plan.md:53`) — unverified; it is a rationale, not a gate.
3. Isolation: this context carried host-injected `AGENTS.md`/`holonovel/AGENTS.md`; both are project standards the artifact appeals to, recorded for transparency.

## Re-review scope statement

Diff-only: I read the revised artifact end to end (it is short), the prior report, the companion `tasks.md`, and four predicate sites named by the dispositions (`test-spec-tooling.ts:378`, `holonovel/package.json:74` + `:120`, the four target paths, `action-conflicts.ts` flags). No new-lens sweep, no unchanged spec sections re-read.

The v3 revision is a substantial improvement: IR-01, -03, -04, -05(a), -09, -11, -12, -13, -14, -15, -16 and the IR-10 fallout are genuinely fixed, and IR-05(b)'s rejection is correct — the gate exists at `scripts/test-spec-tooling.ts:378` and the prior report was wrong about it. But IR-02 survives at the one line the reversal missed (`plan.md:184`), IR-19's disposition is false against the text, and the two stale counts ("eight commands", "eleven edits") sit on the plan's only mechanism sentences.

```
independent-review FAILED.
```
