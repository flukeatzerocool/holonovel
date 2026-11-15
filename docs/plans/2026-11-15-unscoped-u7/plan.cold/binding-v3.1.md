# Binding record — U7 plan v3.1

Artifact: /home/fluke/Holonovel/plans/2026-11-15-unscoped-u7.md (635 lines)
Plan sha256: 22f5ad3fdd15df4ae85759e225998402afe2137eaf8fb26f68e3d2b95e9c4c81
Prior: plans/2026-11-15-unscoped-u7.cold/re-review-v3.md (reviewed 4ad9cd27…;
returned passed, 2 Majors / 5 Nits)
Scope: delta confirmation only · reads 3/4

Persisted by the parent session (the reviewer had no write path).

## The seven changes — all present

| Change | v3.1 location | Verified |
|---|---|---|
| 1. Phase 0 steps 2–4 restated; `check:fast` at baseline, mid-session, close | `:360-362`, `:369-375`, `:497-500`, `:558` | **Holds.** `scripts/lib/loop-artifacts.ts:81-91` errors on `LOOP OPEN` only under `options.requirePausedFor === increment.name`, and `scripts/check-loop-artifacts.ts:33` calls `validateIncrements(ROOT)` with no options. V4 reworded to "terminal token". |
| 2. V5b → V11b presence floor; V11 keeps set equality | `:568`, `:569`, `:534`, `:589`, `:600`, `:610` | **Holds.** No operative row names V5b; two historical mentions remain in the dated v2/v2.1 resolution sections. |
| 3a. R9 end-anchored `-L` | `:271` | **Holds** for R9 — see Nit 3 for the probe. |
| 3b. Phase 4 step 2 names the `source_url` predicate | `:456-462` | **Holds.** `holonovel/src/core/wisdom.ts:82` and `:113` are both `source_url:` entries; the MANIFEST hash-table exclusion is correct. |
| 3c. Worklist template gains a P0-scheduled slot | `:515-517` | **Holds.** |
| 3d. Done bar 5 = every row of the table | `:617` | **Holds.** |
| 3e. Cold artifacts cited and present | `:26-29` | **Holds.** |

Both Majors are closed on the evidence, not on the resolutions text.

## Incidental changes found (four Nits)

1. **EV2 still carries the pre-fix claim.** `:173` says the baseline "cannot
   hold" once the increment exists, contradicting the corrected step 4.
2. **Duplicate list numbering in Phase 6.** 6.3b inserted as item 4 left two
   items numbered `5.`; the `(6.N)` labels stay unique, so it is cosmetic.
3. **N-R1 applied in one of two places.** R9 (`:271`) uses the end-anchored `-L`
   form; Phase 1 probe 4 (`:408`) still shows `+6`.
4. **Run-count wording.** Step 4 says "two points"; V2 says three runs.

Also noted: the status line (`:3-7`) adds conditions C-4 and C-5 to cover the
post-pass application, which is correct given the reviewer had no write path.

**Binding holds.** The two Majors are resolved against the code, all five Nits
are applied in their operative locations, and none of the four residuals reopens
a finding or changes a command.

independent-review passed. — 0 Blockers, 0 Majors, 4 Nits.
