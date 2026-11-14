# Cold review r2 — 2026-11-14-audit-durability-badge-truth

Diff re-review (standard depth, single permitted pass) of the v1→v3 delta.
Reviewer: cold re-review subagent (`opencode-go/deepseek-v4.1-flash`)
Independence: fresh child context. The dispatch carried only the delta scope
(M1–M5 resolution, A1, A2, AAR deviations), the artifact paths, the prior cold
artifact's path and sha256, and the read budget. No authoring conversation, no
parent findings, no instruction to agree.

Plan artifact: `docs/plans/2026-11-14-audit-durability-badge-truth/plan.md`
Plan sha256: 03c61359b8f27ac4f4613b59662d2e6e74f90e35bc8f2f34ae3ae5bb4aba5843
Prior cold artifact: `cold-review.md`, sha256 `a22ba72a…9054e` (reviewed v1,
sha256 `469805fe…f5eda0`, verdict `independent-review passed.`)
Resolution record sha256: `7e273ba7…d38b5` · AAR sha256: `d5677d7f…da2ac`

independent-review passed.

0 Blockers · 0 new Majors · 1 Minor · 5 Nits · 5 Deferred.

## 1. Per-Major resolution verdicts

| Major | Verdict | Evidence in the current text |
|---|---|---|
| M1 catch placement | Resolved | `plan.md:228-243` places `withCapacityAbort` between `ensureStructured` and `normalizeRefusal` and states that `normalizeRefusal` (`:279-293`) envelopes the throw first; `plan.md:335-343` repeats the composition in C2; `aar.md:25-28` confirms the shipped order. |
| M2 capture unspecified | Resolved | `plan.md:236-243` names interchange JSON (`novelToJSON`/`novelFromJSON`), the lossless persisted form, and `"replace"` plus explicit stack reassignment; `plan.md:253-258` names and rejects `captureWorkflowSnapshot` and `restoreFromSnapshot` with reasons; step `1(g)` (`:428-431`) probes the round-trip; `aar.md:54-56` records the probe passing. Residual Nit N4. |
| M3 unsupported cost premise | Resolved | `plan.md:248-250` scopes the number to `snapshot()` and cites `holonovel/DECISIONS.md` § *TDQS coherence remediation*; the citation resolves at `holonovel/DECISIONS.md:796` ("0.2 ms" on 558 KB, "0.7 ms" on 3.6 MB); the capture cost is measured (`aar.md:91-95`), not asserted. |
| M4 non-binding REQ-448 qualifier | Resolved | `plan.md:271-284` drops the qualifier, names the at-capacity exception and its reporting surface, and preserves the below-cap path; the shipped body at `spec/02-requirements.md:2531` carries no qualifier. |
| M5 `"replace"` exists | Resolved | `plan.md:240-243, 257-258, 343` use `applyNovelState(..., "replace")` plus stack reassignment and state "No `applyNovelState` mode is added"; `plan.md:392` shrinks the `state.ts` row to the `auditForbidden` predicate; `aar.md:54-56`. |

## 2. A1 / A2 consistency with the plan's decisions and done bar

- **A1 (baseline premise)** — `plan.md:110-117`. Consistent: the fast manifest
  holds 41 gates (AGENTS.md gate table), so `40 passed, 1 failed` is coherent,
  and the named failure is this increment's own `aar.md`, which done bar 8
  requires to exist. `aar.md:67-71` records the corrected premise and the
  re-stamp. No defect.
- **A2 conditional capture** — `plan.md:244-250` matches the shipped
  `AUDIT_APPEND_HEADROOM = 3` (`holonovel/src/core/audit-gate.ts:37`) and the
  predicate `cap - audit_log.length <= AUDIT_APPEND_HEADROOM`
  (`holonovel/src/index.ts:2071`). The headroom is sound with one append of
  margin: any capacity abort requires `appends > remaining`, and every
  `remaining <= 3` takes a capture, so a call of up to four appends is
  covered. Consistent with done bar 2. The resolution's 5 ms fallback was
  replaced by a narrower trigger rather than a narrower capture; the AAR
  declares the amendment (`aar.md:91-95`) and no done-bar item sets a latency
  bound, so this is consistent, with Nit N3.
- **A2 pattern-buffer badge ordering** — `aar.md:78-81` is exactly the
  remediation step `1(e)` planned (`plan.md:422-425`: "create/resume first, or
  assert the new refusal"). Consistent; no finding.
- **A2 REQ-237 marker-slot reservation** — recorded in the header
  (`plan.md:7-9`) and the AAR (`aar.md:31-33, 62-63`), and it *strengthens*
  done bar 4 ("No path appends past the cap"). It is not declared where the
  plan declares its changes: Minor N1.

## 3. New findings

### Minor

**N1 — A2's marker-slot reservation is absent from the plan's declared change
set, and its normative clause is absent from the declared contract edits.**
`plan.md:346-351` (C3) still describes the `state.ts` change as only the
`auditForbidden` cap predicate, and `plan.md:392` (blast radius) says
"`auditForbidden` cap predicate"; the AAR records an additional `state.audit`
change (`aar.md:31-33`). The matching spec statement appears at
`spec/02-requirements.md:2529` ("a first call that would also write the
REQ-237 boundary marker is refused when both entries do not fit"), but C5
(`plan.md:359-368`) and done bar 6 (`plan.md:95-98`) name only REQ-447's
"before any state is persisted" clause for that REQ. A reader implementing
from the plan body would produce an `auditForbidden`-only fix and an
incomplete REQ-447 edit. The shipped state is coherent and tested
(`aar.md:31-34`), so this is a declaration gap, not a design defect.

### Nits

**N2 — the cold-pass provenance sentence is stale at v3.** `plan.md:19-20`
says "M1–M5 are resolved in v2 (the cold artifact therefore reviews v1, and
v2's amendments are the diff build-review verifies)". At v3 the diff
build-review verifies also includes A1 and A2, which the v1 cold artifact
never saw; this r2 report is the covering artifact for them. Say so, or the
sentence misstates what the cold artifact covers.

**N3 — the expensive capture path is near-cap, not rare.** Conditional capture
leaves the measured 6.75 ms (`aar.md:91-95`) on every appending call once the
log is within 3 slots of the cap — the state a user reaches precisely when the
cap is sized to their campaign. Done bar 2 sets no latency bound and the cost
was measured and disclosed, so this does not block; record it as a known
operating characteristic. `plan.md:246-247` ("an uncapped or comfortably sized
log pays nothing") is accurate, but the contrast can read as if the expensive
path were exceptional.

**N4 — M2's residual alternative is still unnamed.** The v1 review named the
existing pre-call helper `novelSnapshot()` (`cold-review.md:39-41`); D3's
rejected list (`plan.md:253-258`) names `captureWorkflowSnapshot` and
`restoreFromSnapshot` but not `novelSnapshot()`. The chosen capture is
specified and probed, so this is alternative-recording, not correctness.

**N5 — the AAR's plan hash no longer identifies the artifact at the path.**
`aar.md:3` cites plan v2.1, sha256 `8c80f54a…`; the file is now v3, sha256
`03c613…`. Process, not plan text: refresh the gate stamp against `03c613…`
after this re-review, or the stamped plan hash and the artifact diverge.

## 4. Deferred (unchanged text — not blockers)

- v1 **m1**: C1 (`plan.md:322-324`) still builds the refusal from
  `AUDIT_CAP_CORRECTIVE` without requiring the literal "capacity" that T533
  asserts (`cold-review.md:68-72`). Shipped behaviour is correct
  (`aar.md:21-24`); the plan text remains under-specified.
- v1 **m2**: done bar 2 (`plan.md:78-79`) still says "leaves no persisted
  mutation"; the roster lives in a separate persistent file, so "no persisted
  Novel mutation" is the accurate bound (`cold-review.md:74-77`).
- v1 **m3**: step `1(f)`'s REQ list (`plan.md:425-428`) still omits
  REQ-031/REQ-055a/REQ-066a (`cold-review.md:79-82`).
- v1 **m4/m5**: the `badge-gate.ts` doc-comment rewrite is still absent from
  C1, and the dependency order still has no explicit "C1 green" step
  (`cold-review.md:84-95`).
- v1 **m6/n1**: the `test-backfill.ts` blast-radius row (`plan.md:403`) and C6
  (`plan.md:375-376`) still disagree in wording; the evidence-target coverage
  nit is unchanged (`cold-review.md:96-106`).

## 5. Unknowns

- Whether the increment commit exists on this branch. `git log -S "both
  entries do not fit" -- spec/02-requirements.md` returned no commit while the
  string is present at `spec/02-requirements.md:2529`, and the dispatch's HEAD
  `739b362` equals the pre-build HEAD recorded in `cold-review.md:7`. This
  affects only N5's traceability note, not the verdict.
- Whether `state.audit`'s reservation *refuses* or *skips* the boundary marker
  at one free slot (AAR wording only; not read). T533/T786 pass per
  `aar.md:48`, so the behaviour is tested; the mechanism is unverified.
- Whether `novelSnapshot()` is side-effect-free and cheaper than the
  interchange capture (not read; budget).
- The 105 save-before-audit and 245 `set_badge` counts (carried from v1, not
  reproduced).

## 6. Reads used (10/10)

`sha256sum` on the four artifacts · `plan.md` (full, 517 lines) ·
`cold-review.md` (full) · `cold-review-resolution.md` (full) · `aar.md` (full) ·
grep `audit_at_capacity` (repo) · grep `AUDIT_APPEND_HEADROOM`
(`holonovel/src`) · grep `Snapshot-cost measurement`
(`holonovel/DECISIONS.md`) · `git log -Saudit_at_capacity` ·
`git log -S "both entries do not fit"`. One compound shell command was denied
by the read-only allowlist and retried as single commands.
