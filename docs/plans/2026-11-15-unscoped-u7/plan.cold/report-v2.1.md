# Cold review — U7 plan v2.1

Reviewer: fresh cold stage (single cold context; nesting forbidden in the
dispatch, so the five stages ran in one context — recorded as a limitation)
Plan sha256: 8bee0c0f7bf7d9cc949aa43c8559404938cdb0f998d3a2ad2b72ac97d0fc7c33
Artifact: /home/fluke/Holonovel/plans/2026-11-15-unscoped-u7.md (587 lines)
Repository: /home/fluke/Holonovel @ HEAD f886d9c (as dispatched; shell denied)
Gate depth: standard
Stages: 4/5 (Stage 4 not triggered — read-only pass)
Reads used: 34/40 · dupes: none

Persisted by the parent session: the reviewer's sandbox denied file writes, so
this body reproduces its report under the artifact's intended provenance path.

## Stage 2 — comprehension

U7 is the seventh chunk of a nine-chunk "unscoped-surface review" program. This
increment audits the reference appendices (D–L, O–T in
`spec/appendices-reference.md`, plus Appendix U in `spec/appendices-licenses.md`)
and the registry/manifest artifacts they describe, asking for each: does the
artifact exist with the claimed shape, and does a gate enforce the claim. It is a
catalogue↔artifact comparison, not a repair job: a diverging row becomes a record
(register row, ROADMAP entry, or AAR note), and only bounded appendix *prose* may
be fixed in place. Work is 67 verdict rows (`R1`–`R67`), settled by 16 block rows
over the two large catalogues (each with a fixed 10-row stride sample) plus an
owning gate, and by single rows for everything else. "Done" means all 67 rows
settled, every `DEFECT` registered, `ROADMAP.md:30` advanced to U8, the worklist's
U7 row and exit-evidence line amended, `V1`–`V11` green, an `aar.md` ending
`LOOP PAUSED`, and one commit from `session:close`.

## Verdict: NO-GO

### Blockers (3)

**Blocker 1 [design] — the increment directory's pre-existence makes both Phase 0
preconditions unsatisfiable.** Predicate: `scripts/lib/loop-artifacts.ts:32-41`
enumerates every directory under `docs/plans` and reads `plan.md`/`tasks.md`/
`aar.md`; `:65-72` emits `level: "error"` for each missing file;
`scripts/check-loop-artifacts.ts:55` exits 1 on any error. The directory held
`plan.cold/` only, so Phase 0 step 2's green `check:fast` is unreachable, and if
`plan.cold/` were untracked then step 1's empty-tree precondition fails instead.
Change: create `plan.md`, `tasks.md`, and a stub `aar.md` before the first gate;
scope step 1 to the increment dir; re-baseline EV2 on that tree.

**Blocker 2 [clarity] — done bar 4 contradicts 6.6 and V6.** Done bar 4 said the
section trigger is unchanged; 6.6 retargets it to U8 and V6 requires it. Change:
restate done bar 4 as "`ROADMAP.md:32`'s first clause names U8".

**Blocker 3 [design] — 6.4's register shape is invisible to the parser.** A
register finding is a ``- **…**`` bullet plus continuation lines
(`scripts/lib/register-checks.ts:20-22,31-51,57-59`), not a `###` heading entry, so
V5 and V11 could both pass with nothing registered. Change: specify
`### <date> <topic>` plus one `- **U7-Fn — … Disposition (date).** Predicate:`
bullet per finding, and make the gate evidence require a non-zero new-entry count.

### Majors (8)

1. `Scheduled-roadmap` findings fail V5 unless every `REQ-NNN` they cite appears
   in `ROADMAP.md` (`register-checks.ts:64-69`) — state the rule and the compliant
   move.
2. `check-roadmap`'s 3-bullet cap (`check-roadmap.ts:24`) collides with "add a
   new entry inside the owning section"; both candidate owners already hold three
   bullets.
3. The 10-row sample rule is unsatisfiable for R19 (90 rows ⇒ 9 samples).
4. R9's `git log -S"**REQ-<id>"` cannot observe a REQ's last content change
   (pickaxe counts occurrences, and header plus body share a line); use
   `git log -L` over the REQ block.
5. Phase 4 step 2 drops the `source_url` admission rule R59 names.
6. A code-class P0 has no legal disposition path, and the worklist template has
   no P2 slot.
7. V1–V4 have no repair path (6.8 and K9 cover only V5–V11).
8. V6 over-claims `check-roadmap`'s coverage: it verifies bullet counts, trigger
   presence, and the Non-goals pointer — never pointer or trigger text.

### Nits (7)

1. R32/R33's split sits inside O.12, not at the O.12/O.13 boundary.
2. EV7 says the file "carries A, D–T"; it carries A, D–M, O–T (Appendix N is in the fixtures file).
3. EV14's anchor overruns its predicate (`:37-43`, not `:36-44`).
4. 6.5 ships literal `X`/`Y`/`Z` placeholders.
5. V8's lint scope reaches the sources only through the assembled `holonovel.md`.
6. Phase 1 probe 4's worked example (`REQ-321`) has no bare header row.
7. Rollback and blast radius cite `ROADMAP.md:30` while 6.6 also edits `:32`.

### Assumption adjudication

| # | Assumption | Verdict |
|---|---|---|
| 1 | V1–V11 runnable and deterministically passable | **Refuted** (V2 unreachable, V5 at risk, V6 over-claimed) |
| 2 | E/F settleable by gate + sample; honest about uncovered columns | **Mostly holds**; sample arithmetic and R9's mechanism are defects |
| 3 | Q is the only fingerprint target; `build-order` is right | **Verified** |
| 4 | 67 rows cover every in-scope appendix once | **Verified** (20+13+23+3+8; blocks tile without gap) |
| 5 | Every anchor matches the files | **Verified** except Nits 1 and 7 |
| 6 | Register/ROADMAP/worklist writes are gate-acceptable | **Refuted** for register and ROADMAP |

## Unknowns

- U1 no command execution in the cold context (sha256, HEAD, counts, and every
  gate run are unverified there).
- U2 the two prior cold artifacts were not read; their hashes are unverified.
- U3 the U6 vocabulary citation was not read.
- U5 five cited validator scripts were not read.
- U6 stage isolation weaker than the skill prescribes (one context, no nesting).

**independent-review FAILED.** Counts: 3 Blockers (1 clarity, 2 design),
8 Majors, 7 Nits. Reads 34/40.
