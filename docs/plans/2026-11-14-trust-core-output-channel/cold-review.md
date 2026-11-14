# Cold review — Trust-core output channel plan

Plan sha256: cdc8550550f2f5445e08decfd7c2fc7db3e59174c8b3df554c1351538621610c

Reviewer: independent-review pass in a fresh subagent context
(`ses_e25704d79ffem5kHAyH4RppyxJ`), no authoring context.
Standard-depth budget: 40 reads. Rounds: 1 full pass (stages 4/5), 1 diff
re-review (stages 4/5). The standard-depth re-review cap is consumed.

## Round 1 — artifact `ef87a326…` (plan) / `aa975aed…` (tasks)

Verdict: `independent-review failed.` — 1 Blocker, 3 Majors, 3 Minors.

- **B1 (Blocker).** C2 retyped `outputStore` without the second reader,
  `contextSectionTexts` (`holonovel/src/index.ts:1643-1674`, assignment at
  `:1673`), which returns `Record<string,string>` (typecheck gate) and read the
  store with no badge predicate (the same leak class). Resolved in v2: one
  accessor, both readers, ledger shows the newest visible payload (C2, D4, done
  bar 2, C3(e), T3, verification row).
- **M1.** C3 allowed deleting T221's assertion, orphaning REQ-179b's
  `_Check:_ T221`. Resolved: rewrite is mandatory (C3, T1).
- **M2.** The `structuredContent.text` mirror was a done-bar clause no
  verification proved. Resolved: C3(d) asserts the mirror for a `raw()` result
  and a bare-handler result; the verification table names it.
- **M3.** The universal channel's effect on existing payloads was an unverified
  assumption. Resolved: T0 sweeps the unchanged suite at default limits and
  records every result above 32,000 bytes (plan dependency order step 1;
  `tasks.md` T0 item 7).
- **m5.** Body counts were uncited and REQ-004's range was short. Resolved: the
  extraction method is stated and the range corrected to `124-133`
  (645 chars / 7 sentences). REQ-179a/179b counts are unchanged text —
  `Deferred` to build-review's re-measure.
- **m6.** The title-token rationale overstated the coverage audit's dependency.
  Resolved: the token is self-documenting; the audit resolves T13 from the cited
  prefix IDs already present.
- **m7.** The preflight sidecar predated the artifact. Resolved as a build-time
  condition: it is regenerated at stamp time.

Premises independently re-verified by the reviewer at HEAD `f175b26`: the
handler chain and `ensureStructured` (`index.ts:255-264`, `:301-323`); the six
`truncateOutput` call sites (`:2322`, `:2345`, `:2427`, `:13678`, `:13681`,
`:13684`) and the `search_rules` mis-keying; the store and resolver
(`:15505-15511`); the §5.1 map row listing base `179` (`02-requirements.md:9`);
§5.1 absent from `PACKAGE_SECTIONS`/`DATA_SECTIONS`
(`scripts/lib/contract-fingerprint.ts:27-38`); REQ-032a's Observer allowance vs
the `MUTATING` annotations (`02-requirements.md:1222`, `index.ts:193`, `:214`);
`"none"` as Editor (`index.ts:348`, `:1645`); F-P1-12 already `Resolved`
(`review-register.md:55-58`); `docs/engine-contract.md` free of `output://`
clauses; no harness asserts `structuredContent.text`.

## Round 2 — diff re-review, artifact `d0a944f8…` (plan) / `d68f9013…` (tasks)

Verdict: `independent-review failed.` — findings 1–6 resolved, 7 a build-time
condition; 1 new Blocker, 2 new Minors.

- **N1 (Blocker).** The ledger assertion drove
  `manage_context (action: report)`, which does not exist — the enum is
  `context_report` (`holonovel/src/index.ts:11404`, handler `:12063`). The red
  assertion would fail structurally, not for the named reason. Resolved in v3:
  all three occurrences now name `context_report`.
- **N2 (Minor).** The blast-radius row still offered "de-duplicated". Resolved:
  "T221 rewritten to a real produce-then-read".
- **N3 (Minor).** The assignment reference was off by two lines. Resolved:
  `index.ts:1673`.

## Round 3 — targeted re-audit (N1–N3), artifact `07a3a781…`

Verdict: `independent-review failed.` on the first attempt — the N1 fix moved the
error rather than fixing it: `context_report` is not on `manage_context` (its
canonical enum, `index.ts:11681`, allows recap/verbosity/briefing_order/
discover). N2 and N3 were correct.

## Round 4 — micro-audit of the corrected pair

The ledger read now names `manage_diagnostics (action: context_report)`
(`DIAGNOSTICS_ACTIONS`, `index.ts:12177`; handler `case "context_report":` at
`:12063`).

Verdict: `independent-review passed.` — stages 5/5, `Correct.` for all three
sites and the revision note.

## Disposition

The cold chain terminates with a passing verdict after the N1 correction. The
plan and tasks are sealed at the hashes recorded in the stamp; `build-review`
verifies conditions C-1–C-3 during execution.

## Delta amendment — machine-readable JSON bodies (execution round)

Execution (T0/T1/C1) surfaced a contract collision the plan could not see: the
unconditional channel turned `manage_diagnostics (action: health)` — a ~47 KB
single JSON document, over the 32,000-byte default — into a pointer, and 20+
harness assertions failed parsing the JSON (`Unexpected token '…'`).

- **Round 5 (delta review).** `independent-review failed.`: 1 Blocker (REQ-004
  unamended against the new exempting REQ-180c), 1 nit (`spec_health` naming),
  1 accepted design risk (`JSON.parse`-based exemption). Resolved: D10/D11,
  REQ-180c, REQ-004's first sentence amended to reference it, T13 fixtures moved
  to prose, and the accepted risk recorded for the AAR as a P3 observation.
- **Round 6 (confirmation).** `independent-review passed.` — stages 5/5,
  `Correct.` on all three checks.

Final cold verdict: `independent-review passed.`

Conditions for `build-review`:

- C-1. Every ledger-read call site in the plan and tasks names
  `manage_context (action: context_report)`.
- C-2. The plan's body-count premises (REQ-004 `124-133`, 645/7; REQ-179a 589/5;
  REQ-179b 525/3) still hold at execution time; re-measure before editing.
- C-3. The preflight sidecar is regenerated against the stamped plan hash.
