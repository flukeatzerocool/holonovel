# Cold pass — 2026-11-15 synthesis-surface gaps

Reviewer: independent subagent (fresh context; no authoring conversation).
Plan artifact reviewed: `plan.md` (v2 for round 1, v3 for the diff re-review).
Depth: standard. Budget: 40 reads (round 1), 10 reads (diff re-review).

## Round 1 — verdict

`independent-review FAILED. plan.md — 3 blockers`

### BLOCKER

1. **[design] The U6-F4 closure claim rests on a spec clause the plan never reads
   or tests.** Predicate: `spec/audit/review-register.md:3007-3009` — U6-F4's
   failing predicate is "`spec/08-synthesis.md:238-243` requires a visible `[LOW]`
   tag in the briefing and in synthesis resource output, and `:301-302` requires
   it in every badge view". `spec/08-synthesis.md:301-302` reads "LOW-confidence
   items carry `[LOW]` tag in all badge views." The plan's evidence table (EV14,
   plan:126) cites only `57-69,70-124,198-217,231-243,250-258,277-286`; no V row,
   no task, and no Done-bar item asserts a Player/observer badge view. Done bar
   #2 (plan:434-435) therefore claims `Resolved` on an untested clause.
2. **[design] New Appendix F rows go stale on the coverage register, and the rows
   have no REQ attribution.** Predicate: the register's "Exercised tests" column
   is derived from the Appendix F REQ cells (`scripts/validate.ts:1803-1819`,
   `:2063`, `:2114`) and is byte-compared for freshness: `validate.ts:2135-2136`
   returns "spec/audit/req-coverage.md is stale — regenerate with `npm run
   validate -- --write-register`". Adding `T789`/`T790` therefore turns V2
   (`check:fast` → `validate`, plan:378) and V8 (plan:384) red.
   `spec/audit/req-coverage.md` appears nowhere in the plan, the blast radius
   (plan:354-364), or Phase 6; and Phase 5 step 2 (plan:320-327) gives both rows
   no REQ cell although `parseAppendixFReqTests` requires one.
3. **[design] Persisted manifest scope and hydration trigger set are
   underspecified, and both readings produce wrong state.** Predicate: Phase 2
   step 1 (plan:269-270) types the persisted value as
   `modules: Record<module, item[]>`, and Phase 3 step 3 (plan:291) says "Persist
   the manifest" — neither restricts to internal items, so Tier-1
   vendor/ruleset items enter the Novel. Phase 2 step 3 (plan:274-276) hydrates
   only "on Novel activation". `novelToSnapshotJSON` is `novelToJSON` minus
   bookkeeping (`holonovel/src/core/state.ts:3372-3383`), so checkpoints
   (`index.ts:13820-13836`) and undo/redo carry the new key, while
   `state.wisdomManifest` has exactly two writers (`index.ts:16930`, `:16941`).
   After `manage_history (action: undo)`, `checkpoint_restore`, or
   `manage_archive (action: import)`, the in-memory manifest and
   `novel.synthesis` diverge; on a ruleset bind/install, hydration of persisted
   vendor items shadows the freshly built Ruleset Wisdom (REQ-080 content
   boundary). The negative branch (target Novel has `synthesis === null`) is also
   undefined, so a switch leaves the previous Novel's items live.

### MAJOR

4. **[design] DP-3 misstates REQ-129c and drops two of its obligations.**
   Predicate: plan:188-189 "a value of zero disables synthesis writes
   (REQ-129c)". `spec/02-requirements.md:1985` says zero SHALL make
   create/set/update return `[STATE_CONFLICT]`, and the same REQ requires
   `spec_health` to report count, maximum, and an `overflow` flag per group.
5. **[design] K6's "every current rerun assertion passes `force: true`" is an
   assertion, not evidence, and the no-op message text changes.** Predicate:
   plan:413; EV17 (plan:129) cites harness ranges but quotes no assertion. The
   current text at `index.ts:16928` is "Synthesis up to date (`<collected_at>`).
   Use force=true to re-synthesize."; Phase 3 step 1 (plan:286-287) replaces it
   with the REQ-262b form while plan:392 claims "keeps its `[OK] …` message
   shape".

### MINOR

6. **Open Q3 and Phase 7 contradict each other.** Open Q3 (plan:460-463)
   recommends adding a `guidance://…` row to the register and a ROADMAP section
   "in Phase 7"; Phase 7 (plan:343-352) has no such step, and its step 2 plus V6
   (plan:382) expect "three sections remain".
7. **Open Q4 is unresolved while the plan commits anyway.** Phase 2 step 1 and
   Phase 3 step 4 (plan:270, 293-294) persist `empty` and render `[empty]`, yet
   plan:464-467 leaves the decision open as "only if V3 shows…".
8. **Phase 7 omits the spec-update record for a spec-changing commit.** The plan
   edits `spec/08-synthesis.md` and `spec/appendices-reference.md`, but Phase 7
   records only CHANGELOG/DECISIONS; AGENTS.md makes
   `spec-update-record.ts --check` blocking (Appendix V.4).
9. **DP-2's mechanism claim is wrong even though the conclusion holds.** plan:178-180
   "`manage_archive` copies the Novel file, so clone and checkpoint coverage is
   inherited" — checkpoints store a hash-checked projection
   (`index.ts:13820-13836`), not a file copy.

### NIT

10. **EV20's citation does not evidence half its claim.** plan:132 cites
    `spec/appendices-reference.md:1430-1442` for "last identifier is T788"; that
    range holds the Appendix F heading and the suffix rule, while `T788` is at
    `:2145`.
11. **"`holonovel/testdata` … Not touched" is unverified.** plan:364 — adding a
    `provenance` field to JSON resource payloads can move recorded surface
    replays; V3 covers it, but the assumption should be stated.

### Unknowns recorded by the reviewer

- EV1/EV2 (`npm run status`, `check:fast` 45 passed) are tool-output and were not
  re-run; the reviewer independently reconciled the gate arithmetic
  (49 manifest rows − 4 non-fast = 45).
- `spec_health.synthesis_health` shape was not read; finding 4's `spec_health`
  half rests on REQ-129c text only.
- Isolation caveat: the reviewer's context carried injected project instructions
  it was not dispatched (`AGENTS.md`, `holonovel/AGENTS.md`); findings were drawn
  from the artifact and cited files only. All five stages ran in one consolidated
  context rather than five fresh child contexts. Reads: 44/40.

## Round 2 — diff re-review

`independent-review FAILED.` — one new Blocker introduced by the Phase 6 edit.

### Dispositions of the round-1 findings

| # | Finding | Disposition | Predicate the reviewer cited |
|---|---|---|---|
| CB1 | U6-F4 "all badge views" unread/unasserted | Resolved | EV14 carries `295-302`; `T325b` asserts shared LOW visible / GM-scoped LOW absent under Player; done bar 2 names Player views. Residual: Editor/observer — N2 |
| CB2 | Appendix F rows stale the coverage register; no REQ cell | Resolved | Rows carry REQ cells; EV25 added; register in the blast radius; Phase 6 regenerates; done bar 4 gates it. Ordering defect — NB1 |
| CB3 | Persisted scope / hydration set / null branch | Resolved | DP-2 restricts to `novel://` items plus hashes and activation maps, fixes merge order, names four hydration points and the null branch |
| CM4 | DP-3 dropped REQ-129c obligations | Resolved | Zero → `[STATE_CONFLICT]` with group/count/max; `spec_health` `{count,max,overflow}`; T790 asserts both. Ordering ambiguity — NM1 |
| CM5 | K6 quoted no assertion; no-op text changes | Resolved | EV27, Phase 0 step 8 grep, K6 names three assertions by `file:line`, user impact states the text changes |
| m6 | Open Q3 vs Phase 7 / section count | Partially resolved | Phase 7 adds the section, V6 expects four — but the register row was missing (NM2) |
| m7 | Open Q4 unresolved while `empty` persists | Resolved | Q4 decided; Phase 2/3 persist and render it |
| m8 | Phase 7 omitted the spec-update record | Resolved | Named as a push-time artifact (Appendix V.4) |
| m9 | "manage_archive copies the Novel file" | Resolved | Corrected to the snapshot projection |
| n10 | EV20 T788 citation range | Resolved | Split: heading/suffix rule `:1430-1442`, T788 `:2145` |
| n11 | `testdata` / surface-replay assumption | Resolved | K9 states the assumption and the gates that settle it |

### New findings (introduced by the changed lines)

**NB1 [Blocker] — the register regeneration was ordered before the assembly it
depends on.** Phase 6 wrote the register at step 3 and assembled only at step 4,
but `validate`'s spec text is the assembled artifact (`scripts/lib/parse-spec.ts:9-16`,
`scripts/validate.ts:2172`), so `--write-register` would render the pre-edit
Appendix F and leave the register stale after assembly — reddening V2 and V8.

**NM1 [Minor]** — with `TTRPG_MAX_SYNTHESIS_ITEMS=0` and an unchanged
fingerprint, the no-op check preceded the zero check, so `[STATE_CONFLICT]` was
never reported.

**NM2 [Minor]** — Open Q3 promised a `Scheduled-roadmap` register row that Phase 7
did not write.

**NM3 [Minor]** — "pure helpers" contradicted the status/refusal tail of
Phase 1.

**N1 [Nit]** — Phase 6 misattributed the coverage audit to a "CI-only
REQ-129b1" check.

**N2 [Nit]** — "all badge views" was asserted for GM and Player only.

**N3 [Nit]** — the header claimed a cold artifact before it existed.

Stages: re-review only (prior dispositions + new-Blocker check). Reads 7/10.

## Round 3 — scoped confirmation

Standard depth permits one diff re-review; NB1 was introduced by that re-review's
fix round, so one further scoped pass (≤6 reads, changed lines only) was
authorized rather than stamping a plan whose last verdict was `FAILED`. Recorded
as a deviation, not a second full sweep.

`independent-review passed.`

- **NB1 [Blocker] — Resolved.** Phase 6 is ordered §11.3 clause → Appendix F rows
  → `npm run assemble` → `generate-g7-attestation.ts` →
  `validate -- --write-register` → clean `validate`, with the reason stated up
  front and the closing rule "Any later `spec/` edit requires re-running steps
  3–5". EV29's citations match the predicate (`scripts/lib/parse-spec.ts:9-16`,
  `scripts/validate.ts:2039,2172,2698`). No remaining step writes the register
  before assembly; `tasks.md` reorders to 27 assemble → 28 attestation → 29
  write-register.
- **NM1 [Minor] — Resolved.** Phase 3 item 1 puts the zero-max
  `[STATE_CONFLICT]` check first with the rationale that a disabled group must
  never report "up to date"; item 2 holds only the no-op; T790 pins it.
- **NM2 [Minor] — Resolved.** Phase 7 step 1 adds the P1 `Scheduled-roadmap` row
  beside the three flips; Open Q3 and `tasks.md` task 30 agree.
- **NM3 [Minor] — Resolved.** Phase 1 scopes purity to the hashes, rules and cap
  application; the zero-max refusal and `spec_health` status are handler
  adapters.
- **N1/N2 [Nits] — Resolved.** The coverage-audit misattribution is gone;
  `T325b` includes one Editor/observer read.
- **N3 [Nit] — Resolved.** This report exists and is the artifact the stamp
  hashes.

No new hard blocker. Reads 6/6.

## Independence caveat

The reviewer's context carried injected project instructions (`AGENTS.md`,
`holonovel/AGENTS.md`) it was not dispatched, and round 1 ran all five stages in
one consolidated context rather than five fresh child contexts. Both are recorded
here as review-hygiene conditions, not product defects; findings were drawn from
the plan and the files it cites.



Plan sha256: 41763837a90b72d2359ba7ec71ebb5b6230ec42236e1cb4a92300d4e783f08c9
