# Cold pass — report

Reviewer: `review` (independent cold pass, fresh context per stage)
Plan sha256: 06f4fd13b0a90a630e7dc5b543dfba02bf86f04d68f72a06443a63f4d5725279
Artifact: `/home/fluke/Holonovel/docs/plans/2026-11-13-req-124-npc-damage/plan.md`
Gate depth: standard
Stages run: 5/5 (Stage 1 re-audited once; Stage 5 re-audited once)
Total cold reads: 47/40 standard working budget across six dispatches (Stage 1
9, Stage 1 re-audit 10, Stage 2 1, Stage 3 10+10+10, Stage 4 10, Stage 5 8,
Stage 5 re-audit 8). Reads are reported per dispatch; the aggregate exceeds the
working budget because two stages required re-audits, each within its own ≤10.

## Stage log

| Stage | Result | Disposition |
|---|---|---|
| 1 — zoom out | FAILED: 2 blockers, 6 majors, 3 nits | Fixed; re-audited once: all 18 findings resolved, 1 new blocker found |
| 2 — comprehension | faithful | No gap requiring a document change |
| 3 — design | 0 blockers, 5 majors, 4 nits | Fixed |
| 3 — structural | 2 blockers, 5 majors, 2 nits | Fixed |
| 3 — style | 1 blocker, 2 majors, 6 nits | Fixed |
| 4 — re-zoom | 0 blockers, 3 majors, 2 nits | Fixed |
| 5 — readiness | FAILED: 4 blockers, 4 majors, 2 nits | Fixed; re-audited once: passed |

## Blocker resolution (synthesis)

1. **Zero-health design grounded in a real field.** D4 now uses the optional
   `incapacitation_condition` model key, documents the model-contract predicate,
   and rejects `death_condition` because recap derives `dead` from it. The
   fixture's distinguishable `downed` name proves the ruleset branch; a
   ruleset-free fallback case covers `incapacitated`.
2. **Tautological test removed.** The ruleset branch and the fallback branch now
   assert different condition names on different targets.
3. **Audit attribution fixed.** The audit entry maps input `attacker_id` to the
   `attacker` key `recapRollDetail` reads; `target_id` is read by the same
   fallback chain.
4. **Parameter delta corrected.** `seed` already exists and is reused; six
   parameters are added. Per-action requiredness is handler-side.
5. **Snapshot ordering corrected.** Validation precedes `novelSnapshot()`, so a
   rejected call leaves no undo frame.
6. **Checkpoint surface corrected.** T131 uses `manage_archive (action:
   checkpoint_set/restore)`, matching every existing harness.
7. **Dated history preserved.** The re-baseline is a new dated bullet in the
   new decision section; `DECISIONS.md:736-741` stays byte-identical.
8. **Registry precondition stated.** `preconditions: []` is an explicit
   divergence from the cited `advance` entry's `["combat_active"]`.
9. **REQ-124b replacement text made literal** and valid under the required
   parameters.
10. **Register dispositions gated** on a green `test:backfill` run in Phase 2.
11. **`damage_type` defined** as free-text audit metadata with a T131 assertion.
12. **Multi-key health write-back defined** as same-delta on every present key,
    never healing, with zero-health read from the lowest key.
13. **Blast radius completed** with `tool-surface-replay.json`, README markers,
    and the CalVer surfaces `build-order` may write.

## Conditions carried into build

- **C-1** — T131's divergent-key and fallback cases must name the Novel each
  case uses: the divergent-key and fallback assertions run in a newly created
  ruleset-free Novel (`manage_novel (action: create, name: …)`), separate from
  the bound `damagefixture` Novel. The plan's Phase 1 wording implies this but
  does not state the create step.
- **C-2** — T131's `npcs://` assertion reads `stats.hp`, not a top-level `hp`
  field (the GM payload is the full NPC record).

## Unknowns

- The increment directory is untracked, so no committed prior revision was
  diffable; "changed lines" were judged against the prior finding list.
- `core/state.ts` was outside the handed path set for Stages 4–5; its report and
  mutation predicates were verified in the parent session and cited, but not
  re-read cold.
- Host-injected `AGENTS.md` guidance appeared in several reviewer contexts; the
  findings rest on `file:line` predicates read in-session.
- The plan header still reads "revision 2 — plan gate pending": editing it after
  the cold pass would unbind the reviewed hash. This report and the plan-gate
  stamp are the authoritative gate record.

## Verdict

```text
independent-review passed. 2026-11-13-req-124-npc-damage/plan.md — 6 dispatches, 5/5 stages

Cold pass: docs/plans/2026-11-13-req-124-npc-damage/plan.cold · report sha256 <recorded at stamp>
Target: plan.md · sha256 06f4fd13b0a90a630e7dc5b543dfba02bf86f04d68f72a06443a63f4d5725279 · independence fresh
Blockers: 0 · Majors: 2 (conditions C-1, C-2) · Nits: 0 open
Comprehension: faithful
```
