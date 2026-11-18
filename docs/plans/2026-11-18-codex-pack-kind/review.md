# Review record — `codex pack` kind plan

Gate depth: **standard** (multi-file, reversible migration, no destructive or external
state). Rollback cost 1. All passes ran against the persisted plan artifact, not a chat
draft.

## Self pass (context-bearing)

- Artifact: `plan.md`, sha256 `0f9b3250…171a7` at dispatch.
- Scope: plan-review §0–§8 and the spec-project hard checks (register coupling,
  fingerprint membership, spec-addition blast radius, resolves coverage). Budget: well under
  the 20-call self budget, because the drafting session had already measured every claim.
- Verified against the tree while drafting: the nine kind-union sites; the 19 `index.ts`
  anchors and their shift behavior; the exporter's payload shape and REQ-321o's 751-character
  body; the `manage_artifact` description at 965 bytes; the 800-character and 8-sentence
  limits; the fingerprint section lists; `assemble`'s rewrite of
  `spec/build-phase-map.md`; the `extractReqBodies` measurement of both proposed bodies; a
  green `npm run check:fast` (46/46) at HEAD `77054a3`.
- Corrections the self pass made before dispatch: the G7 source line (161 → 159), the
  anchor-resolver line (73 → 79), the fingerprint section list (wrongly attributed to
  `check-fingerprint-sync`), the test count (6 → 8 probes, 29 → 31 cases), the pre-fix
  probe claim (an enum rejection, not `NOT_FOUND`), the missing regeneration-order decision
  (D8b), the missing `README.md` / untracked-copy blast-radius rows, and the rollback line
  for the untracked increment directory.
- **The self pass missed the anchor-inventory error** (it wrote "two anchors at or below
  11321" when 18 recorded lines are ≤11321). Cold pass 1 caught it. Recorded here because a
  self pass that finds nothing is the case the cold pass exists to test.

## Cold pass 1 — five stages — FAILED

- Report: `cold/report.md` · sha256 `1e89d192…64b34` · 5 stages (prepare, zoom-out,
  comprehension, critics, readiness; stage 4 not applicable — no authoring edits) · reads
  50/60.
- Verdict: 1 Blocker, 4 Majors, 5 Nits.
- Blocker: the anchor inventory, and the P1/T1 accept built on it, were false ("at or below
  11321" vs the operative "at or after"). **Fixed:** EV9, P1, and T1 restated as seventeen
  anchors below 11321 and two at or after it (11321, 14784).
- Major 2 (T7 unsatisfiable — no REQ text pasted): **fixed** by pasting both final bodies and
  restating the measurement on the validator's own extractor.
- Major 3 (D5 contradicted T739 and V.10): **fixed** by qualifying the T739 and runbook
  clauses; the normative body followed in the confirmation pass.
- Major 4 (undocumented ROADMAP "catalogue entry" deviation): **fixed** with an explicit
  decision paragraph and the rejected alternative.
- Major 5 (new durable surface missing from layout docs): **fixed** by adding
  `04-runtime.md:142` and the `holonovel/AGENTS.md` State Model bullet to D6 and the blast
  radius.
- Nits 6–10: union-site count, D8/D8b attribution, order-dependent hash, budget scope, and
  the blind P1 grep — all **fixed** in the same revision.

## Cold pass 2 — diff re-review — passed

- Report: `cold/rereview.md` · sha256 `99c3b91a…4b34` · reads 5/10.
- Token: `independent-review passed.` 0 Blockers.
- Prior findings: 9 resolved, 1 partially resolved (NEW-1: REQ-621 still promised provenance
  verification the codex kind cannot provide), residual nit R1 (a stale "at or below 11321"
  phrase in `tasks.md`).
- Deferred (unchanged text): the runbook blast-radius row said "steps 1 and 4" while D6
  edited step 3; the risk table had no row for the order-dependent hash.

## Cold pass 3 — confirmation of amendments — passed

- Report: `cold/confirmation.md` · sha256 `247cb8ae…79b96` · reads 5/6, artifact
  `547107c2…50d4`.
- Token: `independent-review passed.` 0 Blockers, 0 new Majors.
- NEW-1 **resolved**: REQ-621 now reads "any declared verifiable provenance", consistent
  with D5, T739, and V.10 step 3; re-measured at 703 characters and a 42-word longest
  sentence.
- Residual nit R1 and the two deferred items **closed** (T1 wording, runbook row, risk row).
- Cosmetic C1 (a duplicated accept sentence in `tasks.md`) — recorded, no action: the accept
  governs and the restatement is harmless.

## Verdict

`plan-review passed.` The plan is executable as written; the executing session re-measures
line numbers and anchor offsets (D10) because they move with any later `index.ts` change.
