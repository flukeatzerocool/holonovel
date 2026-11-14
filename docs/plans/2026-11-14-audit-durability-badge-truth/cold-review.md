# Cold review — 2026-11-14-audit-durability-badge-truth

independent-review passed.

Plan artifact: `docs/plans/2026-11-14-audit-durability-badge-truth/plan.md`
Plan sha256: `469805fe88de0b941d73ed3f01f540bf912d24b104771c3c65f06ac1acf5eda0`
Reviewed at git HEAD `739b362c77637f885804b800ac92e7d61d06ad02`
Independence: fresh (no authoring context; artifact + evidence sidecar only)
Gate depth assumed: standard
Evidence sidecar: `~/.local/state/opencode/plans/fe586f0907cda9bed04d391d454275b4a14bc3e300047c43f32dd854d4f08ed4/plan.evidence.md`

No hard blocker was found. Five Major findings must be resolved or recorded as
explicit deferred decisions before the plan is presented.

## Findings

### Major

**M1 — The rollback layer named in C2 cannot observe the throw.**
`index.ts:313` composes `withForbiddenAudit(normalizeRefusal(ensureStructured(truncateHandler(handler))))`.
`normalizeRefusal` (`index.ts:279-293`) catches the `[ERROR] [STATE_CONFLICT] Audit log at
capacity (…)` error and converts it to an `err()` envelope, and `withForbiddenAudit`
(`core/server.ts:51-75`) only rethrows non-`[FORBIDDEN]` errors. A catch added at the
`registerTool` composition site (`plan.md:277-291`, "In the `registerTool` wrapper
(`:313-330`) … catch a thrown `/Audit log at capacity/`") therefore never fires; the catch
must sit inside `normalizeRefusal`'s try (between `truncateHandler` and `normalizeRefusal`).
The plan should also state that today the capacity error is normalised, not thrown to the
dispatcher — that fact is what fixes the insertion point. Not a Blocker because T786 is
specified red-first (`plan.md:379-380`) and would surface the misplacement.

**M2 — The capture mechanism is unspecified, and the nearest existing one is unsafe for it.**
`captureWorkflowSnapshot` (`core/state.ts:2069-2078`) mutates the Novel (increments
`connection_counter`, sets `pending_staleness_counter`) and serialises through
`novelToSnapshotJSON`, which omits stacks/bookkeeping by design (`core/state.ts:2089-2091`).
The plan's edge case asserts "undo/redo stacks are part of that serialization"
(`plan.md:411-414`), which is false for that projection. Reusing it as the rollback capture
would silently mutate state on every call and would not restore the stack. The plan must name
a side-effect-free capture (JSON round-trip of the live Novel, or a new pure helper) and
explicitly exclude `captureWorkflowSnapshot`. The existing pre-call helper `novelSnapshot()`
(`core/server.ts:38-41`) is not mentioned at all.

**M3 — Unsupported performance citation justifies a per-mutating-call clone.**
`plan.md:207-208` cites "the 2026-10-25 snapshot-cost record at 0.2–0.7 ms on 0.5–3.6 MB
Novels". No such record exists: the only occurrence of that text in `docs/` or `spec/` is the
plan itself, and `spec/audit/performance-record.json` carries no snapshot-cost term. The
number is load-bearing — it is the stated justification for cloning on every appending call.
Cite the real artifact or measure it in the step-1 probe. (§2 resource feasibility → Major.)

**M4 — D5/C5 makes REQ-448's cap-refusal clause non-binding.**
REQ-448 (`spec/02-requirements.md:2531`) requires "cap refusals (REQ-447)" to be recorded.
C5 (`plan.md:308-309`) attaches "when the log has room for the entry" to "the cap-refusal
clause". A cap refusal occurs only when there is no room (`core/state.ts:2265-2284`), so the
qualified clause can never bind. D5's actual reasoning concerns *boundary-violation* entries
at capacity (`plan.md:224-229`). State whether the qualifier applies to the whole event
enumeration (boundary violations included) or drop "cap refusals" from the enumeration; do
not attach it to the cap-refusal item alone.

**M5 — `applyNovelState` already has a `"replace"` mode; the alternative is not recorded.**
`ApplyNovelMode = "undo" | "replace"` (`core/state.ts:3587`); `"replace"` copies every field
except `undo_stacks`, `redo_stacks`, `ruleset` (`:3592-3620`). C2 adds `"exact"` "that
preserves nothing" without recording why `"replace"` is insufficient — the difference is
exactly the stack/ruleset triple, which the plan's own edge case says must be restored. Add
the rejected alternative and its reason, and note that the exported type union is the edit,
not only the function body. (§2 alternatives → Major; cheap to resolve.)

### Minor

**m1 — The preflight refusal text must keep the word "capacity".**
T533 asserts `res.includes("capacity")` (`holonovel/scripts/test-security.ts:156`). C1 builds
the text from `AUDIT_CAP_CORRECTIVE` (`core/state.ts:1083-1084`), which contains no
"capacity". Specify the envelope as the existing "Audit log at capacity (N entries)." sentence
plus `AUDIT_CAP_CORRECTIVE`, or T533 (done bars 1 and 8) fails for the wrong reason.

**m2 — Done bar 2 overstates the rollback's reach.**
"No path … leaves no persisted mutation" (`plan.md:54-58`) exceeds what a Novel restore
guarantees: the roster lives in a separate persistent file, and `"exact"` restore touches only
the Novel. Qualify to "no persisted Novel mutation".

**m3 — Sibling-REQ enumeration is narrower than T9's appendix row.**
Step 1(f) greps REQ-030/040a/040c/066b/447/448 (`plan.md:370-373`), but T9's row binds
REQ-031, REQ-032, REQ-055, REQ-055a, REQ-066 (`spec/appendices-reference.md:1446`). D6 handles
REQ-066a in prose; add REQ-066a/031/055a to the enumeration.

**m4 — The renamed constant's doc comment becomes false.**
`OBSERVER_DENY_ACTIONS` is documented as an *Observer* deny list of mislabelled reads whose
members "mutate or resolve", with everything else "caught by the handler-local guards"
(`core/badge-gate.ts:30-43`). Reading it as "appends an audit entry" conflates mutation with
audit-append (e.g. `manage_vow.resolve` is in the set while register evidence records vow
writes with no audit entry). Over-classification only causes refusal-at-capacity of
non-appending mutations (safe), but the comment must be rewritten with the rename.

**m5 — Dependency order has no "C1 green" step.**
`plan.md:377-380` goes "C1 red" then straight to C2; the classifier module's landing step is
implicit. Name it.

**m6 — `test-backfill.ts` row contradicts C6.**
The blast-radius row says "only if T9 needs a Novel-active precondition" (`plan.md:348`) while
C6 says "no change expected" (`:320-321`); T9 calls `set_badge` and asserts
`[OK] Active badge: player` (`holonovel/scripts/test-backfill.ts:1010-1017`). Step 1(e)
covers the discovery, but the two statements should agree.

### Nit

**n1 — Preflight target list omits several blast-radius files** (`holonovel/DECISIONS.md`,
`spec/audit/req-coverage.md`, `holonovel/src/generated/contract-fingerprints.ts`,
`test-persistence.ts`, `test-output-contracts.ts`). Not a plan defect; evidence coverage gap.

## Stage results

**Stage 1 — completeness and success criteria: PASS.**
Nine done-bar items, each with a command; every premise cited at `file:line` or with a named
enumeration; both findings reproduced with exact envelopes (`plan.md:36-45`). Error-gate dry
run is satisfied by step 1's enumerate-before-assert probe. Findings: M3, M4, m5.

**Stage 2 — scope and blast radius: PASS.**
Blast-radius completeness holds: every file named by C1–C7 and D7 appears in the table
(`plan.md:333-351`). Spec-project checks: register coupling named same-step
(`plan.md:167-169`, C7) — PASS; fingerprint/target membership named (`plan.md:311-313`, 349,
358) — PASS; no new REQ, so spec-addition blast radius is N/A — PASS; no `**Resolves:**`
fields against a spec-review report — PASS. Existing-expectation reconciliation is present
(step 1(f) names T9/T533/T158/T534/T349/T536). Alternatives: D1–D8 each carry rejected
options except the two flagged in M2/M5. Findings: M1, M2, M3, M5, m3, m4, m6.

**Stage 3 — assets and conventions: PASS.**
All cited paths exist (evidence sidecar); T784 is the highest Appendix F ID
(`spec/appendices-reference.md:2135`), so T785/T786 are free; `AUDIT_CAP_CORRECTIVE` is already
exported (`core/state.ts:1083`), so the pure module's import is feasible; `metadata.state_hash`
exists and is written on save (`core/state.ts:2960`), so bar 1's assertion is satisfiable;
`dispatcherRefusal(code, text)` matches the proposed call (`index.ts:1974`); the plan directory
is untracked but not ignored, so it is committable; the §5.19 fingerprint regeneration is named.
Findings: m1, m4, n1.

**Stage 4 — dependency order and edge cases: PASS.**
Steps 1–9 order discovery → red → green → spec → harness → registers → gate → commit, with no
circular dependency. Edge-case coverage is above average (no-Novel, absent registry, unknown
action, cap raised mid-process, compaction with nothing to archive, partial multi-entity
mutation, anchor drift, rollback). Rollback is one `git revert` with no persisted-shape
addition. Findings: M1, M2, M6-equivalent (m5).

**Stage 5 — verification and user impact: PASS.**
Every done-bar item maps to a command (`plan.md:426-438`); all are deterministic. REQ body
headroom holds: measured REQ-448 at `spec/02-requirements.md:2531` is roughly 650 characters
(plan claims 621) and the C5 insertion adds about 35, so the 800-char limit is safe; REQ-447
and REQ-066b likewise. No parameter, restart, persisted-shape, or tool-definition change;
single commit; rollback cost 1 (plan `plan.md:5-7`). Findings: m2.

## Unknowns

- Whether T9 (`holonovel/scripts/test-backfill.ts:1012-1017`) runs with an active Novel —
  the plan defers this to step 1(e); if it does not, "test-backfill: no change expected" is
  wrong.
- Whether the 105 save-before-audit sites and 245 `set_badge` call sites hold — both are
  static-scan counts with the method named but not reproduced here.
- `manage_diagnostics.compact`'s `mutation_class` value: the registry entry
  (`holonovel/tool-surface-registry.json:1559`) did not expose it within the lines read; the
  premise says `destructive`.
- Whether the in-process façade at `index.ts:17852-17853` truly routes through
  `guardToolCall`; not read. If it does not, the "every transport converges" claim behind D1
  weakens to the wrapper-rollback guarantee only.
- Whether `stateDigest` includes `audit_log`, which bar 1's hash assertion assumes.

## Reads used (36 of 40)

plan.md (full) · plan.evidence.md · references/spec-project-checks.md ·
index.ts:255-309, 300-349, 1975-2069, 4505-4534, 11882-11905, 17724-17743 ·
core/state.ts:1076-1089, 2065-2104, 2255-2374, 2476-2503, 3580-3623 ·
core/server.ts:1-42, 40-77 · core/badge-gate.ts:22-91 ·
test-security.ts:140-169, 312-386 · test-backfill.ts:1010-1027 ·
spec/02-requirements.md:1231-1238, 2526-2535 · spec/appendices-reference.md:1445-1448 ·
spec/audit/review-register.md:2490-2505 · ROADMAP.md:1-30 ·
tool-surface-registry.json:1559-1566, 4783-4792 ·
greps: symbol declarations; T78[3-9]; state_hash/snapshot helpers; snapshot-cost in
docs/ and spec/; performance-record; snapshot/clone in spec/audit; registry action keys.
