# Tasks — Gate-retirement sweep

Dependency-ordered. Each task names its file, its verification, and the gate that must pass
before the next task starts. Two commits, split by concern: T1–T4 are commit (a), T5–T8 are
commit (b). Interrupting after any task except T7 (AAR) and T8 is safe.

Vocabulary (from `plan.md`): **row** = a timing-log gate present in the manifest; **candidate**
= row with `streak >= 20` and not protected (36 at HEAD); **writable** = candidate with a
resolved `coveredBy` cover (0 at HEAD).

## Phase 1 — tooling (commit a)

- [ ] **T1 — declare the cover field.** `scripts/lib/gate-manifest.ts:15-24`: add
      `coveredBy?: string[]` to `Gate`, with a comment stating that each entry names another
      gate in this manifest that fails on the same finding class (manifest gates only). No gate
      declares it.
      Verify: `npm run typecheck`.

- [ ] **T2 — extract the pure predicate.** New `scripts/lib/gate-retirement.ts`, header role
      `[build tool]`, exporting `manifestGateNames`, `resolveCovers`, `candidateReason`,
      `savingMs`. No filesystem, clock, or console access.
      Verify: `npm run typecheck`; `npm run check-script-discipline`; `npm run check-script-quality`.

- [ ] **T3 — wire the report.** `scripts/gate-cost-report.ts`: add `mode` to `TimingRecord`
      (`:32-37`) and compute per-tier medians beside the blended one; replace the inline
      candidate expression (`:96`) and the protected filter (`:113-119`) with `candidateReason`;
      drop non-manifest rows with a one-line notice; add `cover`, `reason`, `fastSavingMs`,
      `fullSavingMs` to the printed table and to `--json`; make `--apply` (`:142-168`) write only
      writable gates and print a refusal line carrying each skipped candidate's reason; refresh
      the header's stale 26 → 46 count to the current 49.
      Verify: `npm run gate-cost -- --json` → `candidates.length = 36`, `writable: []`, reasons
      present; `npm run gate-cost -- --apply` → exit 0, 36 refusal lines, and
      `spec/audit/gate-retirement.json` still absent.

- [ ] **T4 — test the predicate.** `scripts/test-script-tooling.ts`: append eight cases
      (under-threshold, protected, no cover, unknown cover, resolved cover, fast-tier critical
      path vs non-critical, full-only gate absent from the fast tier, `manifestGateNames`
      membership for a name absent from the manifest) using literal fixture gates; no timing
      file is read.
      Verify: `npm run test:script-tooling` → pass, eight labels present.
      **Commit (a)** after `npm run check:fast` prints `check:fast: PASS` (un-piped).

## Phase 2 — evidence and prose (commit b)

- [ ] **T5 — the classification table.** `docs/plans/2026-11-15-gate-retirement-sweep/review.md`:
      one row per candidate (36), each with the gate, its finding class from the manifest
      description, the nearest neighbouring gate, and why that neighbour is not a cover. Plus
      the V10 replay pasted verbatim: `git worktree add /tmp/opencode/replay-gr 675daeb`, copy
      `.holonovel-state/gate-timing.json` into it, run the old report there with `--apply`
      (`npm ci` or `NODE_PATH` if `npx tsx` cannot resolve), and run the new
      `npm run gate-cost -- --apply` in the main tree.
      Verify: 36 rows counted (`grep -c '^| '`), no `UNSET`/blank verdict; the worktree
      `spec/audit/gate-retirement.json` lists 36 advisory names and the main tree has none.

- [ ] **T6 — ritual text.** `docs/workflow-cadence.md:50-52`: the monthly entry keeps
      `npm run gate-cost -- --apply` but states the redundancy requirement, the refusal
      behavior, and the fast/full saving split. Read `AGENTS.md:95` and edit only if it no longer
      describes the script accurately (no edit expected).
      Verify: `git diff` read-through; `npm run check-gate-table` → PASS.

- [ ] **T7 — registers, changelog, AAR.** New `## Resolved — 2026-11-15 gate-retirement sweep`
      section in `spec/audit/review-register.md`, opening with finding `F-GR-1` (predicate at
      `675daeb`, 36/49 candidates and 0 writable, 12.53 s / 12.32 s, the fast/full saving split,
      disposition `Resolved`, cross-referencing `review.md`). `CHANGELOG.md` date-headed entry in
      the file's existing form. Then `aar.md` ending **`LOOP PAUSED`** — before the final gate
      run, because `check-loop-artifacts` reads the increment directory.
      Verify: `npm run check-registers` → PASS; `npm run check-loop-artifacts` → PASS.

- [ ] **T8 — close.** `npm run check:fast` un-piped → `45 passed, 0 failed`,
      `check:fast: PASS`. Then `npm run session:close`, which commits T5–T7 as commit (b).
      Verify: `git log --oneline -2` shows the two concern-split commits; `git status` clean;
      `spec/audit/gate-retirement.json` absent.

## Out of scope (recorded, not executed)

- Optimizing `test:ruleset-gates` (the 12.3 s critical path). P3 observation in the AAR.
- Making the full suite faster (`test:all` 181 s median). P3 observation in the AAR.
- Adding `coveredBy` to any gate. No cover exists; `review.md` is the evidence.
