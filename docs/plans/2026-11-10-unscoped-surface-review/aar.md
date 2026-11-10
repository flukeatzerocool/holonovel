# After-action report — unscoped-surface review program (planning increment)

Plan: `plan.md` (stamped fresh, standard depth; cold pass artifact
`/tmp/opencode/unscoped-plan-cold-review.md`). Executed 2026-11-10.

## Outcome against the done bar

| Done-bar item | Result |
|---|---|
| Increment directory holds plan/tasks/worklist/aar | Done — four files in this directory |
| Worklist enumerates U1–U8 with targets, lens, gates, exit evidence | Done — `worklist.md` § Chunk U1–U8 |
| Scope inventory with `file:line` authority | Done — `worklist.md` § Scope inventory, citing sweep worklist `:21-23,313-336` and register `:358-395` |
| Roadmap section in admission shape | Done — `ROADMAP.md` § Unscoped-surface review sweep (P2); `check-roadmap` exits 0 (18 sections) |
| Gates run un-piped and recorded | Done — `check-roadmap`, `check-registers`, `typecheck` exit 0; `check-loop-artifacts` exits 1 naming only the pre-existing open increment, no finding in this directory |
| `check:fast` recorded with its pre-existing failure | Done — `2026-11-10-5-21-5-23-capability-remediation: missing aar.md` (EV8) |
| No spec/source change, no fingerprint, no push | Done — only this directory and `ROADMAP.md` changed |

## What was built

1. **Scope inventory.** The complement of the 2026-11-09 full-review sweep was
   measured against the current tree: spec §1–§4 and §6–§11, Appendices A–Z,
   `docs/engine-contract.md` §1/§7–§10, root tooling, git hooks, CI, governance
   docs, and the vendored/content assets.
2. **Eight chunks.** Each pairs a prose surface with the artifact that
   implements it, so a drift finding is verifiable in one pass:
   U1 foundations/constitution ↔ validator; U2 build process ↔ build/update
   tooling and hooks; U3 runtime + engine-contract remainder ↔ adapter/server
   code; U4 verification ↔ gate manifest/CI; U5 artifacts/independence/cadence
   ↔ publication pipeline; U6 synthesis/fixtures ↔ harnesses; U7 reference
   appendices ↔ registries; U8 governance/content assets.
3. **Mapping invariant.** Every appendix assigned once (A/M → U1; B/C/N/W–Z →
   U6; D–L/O–T/U → U7; V → U5) and every spec section outside §5 assigned once
   (§1–§4 → U1; §6 → U2; §7 → U3; §8 → U4; §9–§10 → U5; §11 → U6).
4. **Roadmap entry.** One P2 section, three bullets, one trigger naming U1 as
   the next session.

## What went right

- The sweep's own scope statement is machine-checkable, so the complement was
  measured rather than guessed. No surface is assigned twice, and no swept
  surface re-enters the program.
- The pre-existing gate failure was identified before drafting, so the plan
  records it instead of promising a green fast gate this increment cannot
  deliver.
- The cold review caught a real omission before the plan was presented: the
  `spec/audit/` tree (registers, coverage map, baselines, loop audit) was
  absent from the inventory. It also caught path drift
  (`holonovel/Dockerfile`, `holonovel/NOTICE.md`), three wrong npm gate names,
  and two scripts assigned to two chunks. Every finding was fixed in the
  artifact.

## What went wrong / deviations from the plan

- **Baseline was red for an unrelated increment.** `check:fast` fails on
  `2026-11-10-5-21-5-23-capability-remediation: missing aar.md` (an open
  session). This planning increment does not write another increment's AAR, so
  it records the failure and leaves the fast gate unclaimed.
- **Priority label is P2, not P1.** Nothing in the unscoped content is a
  demonstrated failure; the program is coverage work. The finding policy will
  reclassify on evidence during each chunk.

## Verification evidence

- `npm run check-roadmap` → exit 0, 18 sections satisfy the admission rule.
- `npm run check-registers` → exit 0, registers structurally clean.
- `npm run check-loop-artifacts` → exit 1, one error, naming only
  `2026-11-10-5-21-5-23-capability-remediation: missing aar.md`; this directory
  raises no finding.
- `npm run typecheck` → exit 0.
- `npm run check:fast` → 39/40; the one failure is the pre-existing open
  increment named above.

## Recommendations

- Open U1 next; it is the cheapest chunk (prose plus validator) and it can
  close the "rule without an enforcing check" question for every later chunk.
- Do not schedule U8 with U7; the content/licensing surface is the only chunk
  that needs the vendored-manifest and cleanliness gates in the same pass.

LOOP OPEN — `check:fast` is blocked by the open increment
`2026-11-10-5-21-5-23-capability-remediation` (missing `aar.md`); this
increment's own four gates are green.
