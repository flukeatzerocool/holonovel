# Plan — Roadmap drain 2: items 3 and 6 close, item 4 chunk 1

**Date:** 2026-11-16 · **Kind:** planned · **Depth:** standard · **Revision:** 2
**Increment:** `docs/plans/2026-11-16-roadmap-drain-2` · **Rollback cost:** 1
**Evidence class:** repo — each premise is a `file:line` at `349e05f` or a command run this
session. Revision 2 resolves the cold pass's M1–M4 and nits; task detail is in `tasks.md`.

## Why

Seven ROADMAP sections are open; two have fired their triggers and the P1 item can take its
first chunk. Publication is **not** in this increment: 135 commits are unpushed and the last
pipeline run stopped after `record` (`.holonovel-state/publish-run.json`, head `f447cb5`).

- **EV1 — item 3's trigger fired.** `ROADMAP.md:36-46` closes on 2026-11-28 *or* 26 new
  commits. Since 2026-11-14 there are **52** commits; consecutive pairs ≤15 min apart number
  **19, 7 sharing a touched path** (`git log --since=2026-11-14 --format='%H|%ct|%s'
  --name-only`), against the baseline 15 of 26 — 57.7% → 36.8%.
- **EV2 — item 6's trigger fired.** `ROADMAP.md:74-81`; `349e05f` edited CHANGELOG, ROADMAP,
  DECISIONS, and the AAR. The bound is measured nowhere: `scripts/loop-audit.ts:216` has no
  line counts.
- **EV3 — the close requires the entry it would derive.** `scripts/session-close.ts:246-257`
  exits 1 unless the top CHANGELOG date is the session date; `:290-291` builds the subject;
  `:292` calls `workingPaths()` before any gate; `docs/plans/README.md:47-54` hand-writes 7a.
- **EV4 — loop-audit is the measurement surface, not a manifest gate.**
  `scripts/loop-audit.ts:359` `checkThresholds`, `:393-404` main; `--check` exits 0 today;
  `scripts/weekly.ts:38` runs `--write` only; no manifest row names it.
- **EV5 — the Manual half of item 4 is 23 citations over 14 IDs.** `corpus.md` (122 rows)
  carries **23 `manual-undocumented`** rows over 14 T-IDs (T3, T5, T18, T28, T33, T38, T49, T51,
  T74, T86, T89, T93, T183, T223); none occurs in `holonovel/DECISIONS.md`. Predicate:
  `scripts/lib/req-checks.ts:700-706`, report-only at `scripts/validate.ts:2632-2651`.
- **EV6 — registers awaiting retirement.** `spec/audit/review-register.md:3069-3073` still says
  the 2026-11-28 re-measurement "stays scheduled"; `:3085-3095` is item 4's entry. Baseline:
  `check:fast` 46 passed, 0 failed; no modified paths (one untracked increment directory).

## Item disposition

| Outcome | Items |
|---|---|
| **Close** | 3 — loop-gate fix-up rate (Phase A); 6 — bookkeeping derivation (Phases B, C). |
| **Chunk 1 of 3** | 4 — REQ evidence linkage, the 23 Manual citations (Phase D). |
| **No action** | 1 — needs a publish and a different model; 2 — waits on a lens change; 5 — trigger not fired; 7 — waits on a REQ-620/621 change. |

## Decisions

- **Dec-1 — item 3 records the measurement; no new script.** Its close criterion is an AAR record
  and names the command. Rejected: a `--fixup-rate` flag.
- **Dec-2 — the entry is authored in the AAR, rendered by a pure helper, written after the gates
  and before `workingPaths()`.** An existing dated heading wins and must match the AAR title; a
  missing block warns; a malformed block exits 1. The AAR skill template edit routes through
  `skill-improvement-loop` (C-1). Rejected: requiring it immediately; deriving prose.
- **Dec-3 — the bound is measured in loop-audit and enforced by `--check` only.** A `since` date
  plus four exempt predecessors keeps the existing oversized increments out (count in
  `tasks.md`); `weekly.ts` runs `--check --write`. Rejected: a 109-entry baseline; a gate row.
- **Dec-4 — chunk 1 writes one dated DECISIONS.md section: per T-ID, the Appendix F row and the
  operator's evidence record; a citation triage proves wrong is re-cited in the REQ body.**
  Rejected: bare ID mentions (the register calls the predicate a proxy,
  `docs/plans/2026-11-15-req-evidence-linkage/plan.md:256`).
- **Dec-5 — one commit if Phase D edits a REQ body (`--single`), else two: `scripts → docs`.**

## Blast radius

| File | Change | Size |
|---|---|---|
| `scripts/lib/changelog-entry.ts`, `scripts/session-close.ts` | parse/render entry; guard and subject ordering; write before `workingPaths()` | M |
| `scripts/lib/loop-bounds.ts`, `scripts/loop-audit.ts`, `scripts/weekly.ts`, `spec/audit/loop-artifact-baseline.json`, `scripts/test-loop-artifacts.ts` | overage helper and loader; counts, section, `--check`; `--write --check`; `since` + 4 exemptions; cases | M |
| `scripts/test-commit-plan.ts`, `docs/plans/README.md` | helper cases; step 7a names the block | S |
| `holonovel/DECISIONS.md` | procedures section, 14 entries | M |
| `spec/02-requirements.md`, `spec/audit/review-register.md`, `ROADMAP.md`, `CHANGELOG.md`, `docs/plans/*` | re-cites if proven wrong; chunk 1 of 3 and the stale §3 sentence; retire 3 and 6; rendered entry; plan/tasks/AAR and corpus | S |
| AAR skill template (out of repo) | `## Changelog entry` section, via `skill-improvement-loop` | S |

## Done bar

- **Done bar:** the AAR records window, pairs, sharing, rate comparison, verdict rule; section
  removed and the register's "stays scheduled" sentence amended in the same step.
- The close derives this increment's entry from the block and writes it once (a byte-identical
  heading means it already ran, so a second close adds nothing); malformed exits 1; absent warns;
  two increments on one date require `--increment`.
- `loop-audit --check` exits 0 and reports plan/AAR counts; an oversized non-exempt increment
  dated ≥ `since` fails, as does an unreadable baseline; `weekly.ts` runs `--check --write`.
- Item 4: regenerated corpus shows **99** findings, **0** `manual-undocumented`; the register records chunk 1 of 3.
- `check:fast` PASS at 46 gates (un-piped); `test:commit-plan`, `test:loop-artifacts`,
  `check-roadmap`, `check-registers`, `check-traceability` green; ROADMAP 3 and 6 gone, 4 updated.

## Phase A — Item 3 re-measurement

- **A1.** Run the pairing; record window and counts. Create `aar.md` ending `LOOP OPEN` for the strict gate (D4).
- **A2.** Verdict rule: met = sharing/pairs ≤ 7/26. 7/19 = 36.8% is improved but not met; either way the
  close condition is the record, so the section retires; a regression adds a dated diagnosis item.
- **Verify:** numbers reproduce from the quoted command; `check-roadmap` green.

## Phase B — CHANGELOG derivation (item 6, bullet 1)

- **B1.** `scripts/lib/changelog-entry.ts`: `parseChangelogEntry(aarText)` → `{ title, summary, bullets } | null`
  (`## Changelog entry`; one `**Title:**` ≤100 chars, no date; non-empty `**Summary:**`; 1–8 `- ` bullets);
  `renderChangelogEntry(date, entry)`.
- **B2.** `scripts/session-close.ts`: the block owns its session's entry — title, summary, body —
  written once (a byte-identical heading means it already ran); a malformed block exits 1. A
  same-date heading from another session is not a conflict (the CHANGELOG already holds several),
  so an omitted `--increment` with two increments on the date is refused, not guessed. Move
  `workingPaths()`/`planCommits` below `check:fast` and write before they run.
- **B3.** `test-commit-plan.ts` cases: render, idempotence, parse acceptance, malformed rejected,
  absent warns, subject passes the hook.
- **B4.** `docs/plans/README.md:47-54`: step 7a becomes "author the block; the close writes it"; the AAR
  skill template edit routes through `skill-improvement-loop`, a declined edit becoming an SK finding and C-1.
- **Verify:** `test:commit-plan`; a **scratch** increment's `session:close --dry-run` prints the
  entry (the live one still ends `LOOP OPEN` until E2); a second run does not duplicate.

## Phase C — Artifact bound (item 6, bullet 2)

- **C1.** `scripts/lib/loop-bounds.ts`: `readBaseline(path)` (absent → empty exemptions plus a warning;
  unparseable → error) and `artifactOverage(increments, { since, exempt })` → `{ increment, field, lines, limit }[]`.
- **C2.** `scripts/loop-audit.ts`: `readIncrements` returns `planLines`/`aarLines` (newline count, trailing
  newline excluded); a metrics field carries overages; an "Artifact bounds" section; `checkThresholds` adds
  one problem per non-exempt overage dated ≥ `since`, and one per unreadable baseline.
- **C3.** `spec/audit/loop-artifact-baseline.json`: `{ note, since: "2026-11-16", exempt:
  ["2026-11-16-publication-reconciliation", "2026-11-16-release-hardening",
  "2026-11-16-roadmap-drain", "2026-11-16-torre-readiness"] }`.
- **C4.** `scripts/weekly.ts:38`: `["npm", "run", "loop-audit", "--", "--write", "--check"]`;
  `test-loop-artifacts.ts` cases: over-limit plan/AAR, exempt, before-`since`, exactly-at-limit,
  absent/unreadable baseline. **Error-gate dry run:** `--check` exits 0 here via C3; a scratch
  non-exempt oversized increment exits 1. **Verify:** `--check` exit 0; the report names counts.

## Phase D — Item 4 chunk 1 (23 Manual citations)

- **D1.** Regenerate the corpus to a temp path and `diff` it against `corpus.md` to prove 122.
- **D2.** Triage every row in `tasks.md`: document (right row) or re-cite (wrong kind/procedure).
- **D3.** Add `## Manual verification procedures — 2026-11-16` to `holonovel/DECISIONS.md`: per
  T-ID, the Appendix F row, the actor and precondition, and the record the operator keeps.
- **D4.** Re-cite proven-wrong rows in `spec/02-requirements.md`; run `assemble`, then
  `build-order` — which runs the strict full gate, so the skeleton `aar.md` from A1 must exist.
- **D5.** Regenerate `corpus.md`; expect 99 rows, 0 `manual-undocumented`; update the Scheduled-roadmap
  entry at `review-register.md:3085-3095`. **Verify:** the counts; `check-registers`; `check-traceability`;
  `validate` 0 errors; `check-fingerprint-sync` if the spec changed.

## Phase E — Dispositions, close

- **E1.** Retire ROADMAP 3 and 6; set item 4 to 99 with its trigger; leave 1/2/5/7 unchanged;
  amend the stale sentence at `review-register.md:3069-3073`.
- **E2.** AAR: findings, the disposition table with trigger evidence, `## Changelog entry`; then
  `npm run session:close` per Dec-5, which writes the CHANGELOG block.
- **Verify:** `check-roadmap`; `check-loop-artifacts`; one commit (or two); no modified paths.

## Risks and rollback

- **R1 — DECISIONS entries satisfy the regex without evidencing a REQ.** Dec-4 requires row,
  actor, record. **R2 — a re-run duplicates the block.** B3 case. **R3 — the AAR skill edit is
  declined.** C-1; the README governs. **R4 — a Phase D REQ edit makes the next publish Minor**
  (the pipeline scaffolds the spec-update record). **R5 — weekly fails after C4.** C3 exemptions,
  proven by the dry run. **R6 — an unreadable baseline.** C1/C2 error rather than pass.
  **Rollback:** every step is a file edit.
