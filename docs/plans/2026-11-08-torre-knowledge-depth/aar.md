# AAR — Torre player-facing knowledge depth

Session 2026-11-08. Base HEAD `a30bfdf`. One spec increment, one commit.
Plan revision 1, approved with conditions C-1 (trigger) and C-2 (other pins).

## What happened

1. **Baseline.** `check:fast` 37/0 PASS; `test:starter-novel` 15/0;
   `test:output-contracts` 338/0; `test:holosuite-novel` PASS 100/0;
   `check-starter-freshness` PASS; `check-playability` PASS (4 Novels).
2. **Phase 0.** The trigger was confirmed by the maintainer (C-1). The visible
   knowledge surface was enumerated: 7 pages, 17 GM-only lore entries, 3 GM
   secrets.
3. **Phase 1.** Three fragments appended to `world.things` in
   `torre-nosferatu.source.json` — `the tower's origin` (Teaching Nest),
   `the bargain` (Social Hall), `the matches` (Wax Refill) — each echoing the
   lore entry for its floor (`the-tower`, `the-survivors`, `resources`).
   Enumeration after the edit: 35 things, 10 pages, no duplicate names, every
   location resolves, all seven floors covered.
4. **Phase 2.** Page-surface assertions added to `test-starter-novel.ts`; the
   Holosuite novel tier's `things` pin moved 32 → 35; the starter artifact was
   regenerated (`build:starter-novel`, 315,650 bytes, 156 pure-addition lines).
5. **Phase 3.** The ROADMAP section was removed, the Scheduled-roadmap row moved
   to `## Resolved`, and the CHANGELOG entry added.

## What went right

- The content-only shape kept the increment to two authored files plus two
  harness edits; no server source, spec requirement, tool surface, or
  fingerprint moved, so no Holosuite predicate anchor drifted (contrast F2 of
  the 2026-11-08 roadmap-clearance increment).
- Placing each fragment on the floor whose system it voices gave the pages a
  reason to exist without a second per-floor fragment on every floor.
- The artifact diff was a pure addition: 3 pages in `world.things` and the same
  3 in `pending_workflow.snapshot.state`, as `deriveOpeningSnapshot` predicts.

## What went wrong

- **F1 (P3, record-and-close).** `check-starter-freshness` exists at the root;
  the server package spells its counterpart `check:starter-freshness`. Running
  the root name inside `holonovel/` failed with an npm missing-script error
  before the real check ran from the root.
- **F2 (P3, record-and-close).** `test:starter-novel` still reports 15 tests
  because the new assertions live inside the existing T658 block. A green 15 is
  evidence the assertions ran, not evidence they were skipped; the count is not
  a coverage signal here.

## Evidence

| Step | Command | Result |
|---|---|---|
| Baseline fast gate | `npm run check:fast` | 37/0, `check:fast: PASS` |
| Baseline harnesses | `test:starter-novel` / `test:output-contracts` / `test:holosuite-novel` / `check-starter-freshness` / `check-playability` | 15/0 · 338/0 · PASS 100/0 · PASS · PASS (4 Novels) |
| Content enumeration | `node -e` over `world.things` / `world.rooms` | 35 things, 10 pages, 0 duplicate names, 0 missing rooms, 7 floors |
| Artifact | `npm run build:starter-novel` | 315,650 bytes; diff 156 additions, 0 deletions |
| Starter harness | `npm run test:starter-novel` | 15 passed, 0 failed |
| Holosuite novel | `npm run test:holosuite-novel` | PASS, 100 passed, 0 failed |
| Output contracts | `npm run test:output-contracts` | 338 passed, 0 failed |
| Artifact freshness | `npm run check-starter-freshness` | PASS: starter artifact is fresh |
| Playability | `npm run check-playability` | PASS (4 Novels) |
| Full suite | `npm run test:all` | 54 passed, 0 failed (129.2 s) |
| Spec + fast gate | `npm run assemble && npm run check:fast` | assemble no-op (`holonovel.md` byte-identical); `check:fast: PASS`, 37/0 |
| Strict validation | `npm run validate -- --sdd-strict` | 0 errors, 274 warnings; proofread register check PASS (271 tracked) |
| Build order | `npm run build-order` | exit 0, "Build order complete. Ready to commit." |

## Findings and dispositions

| ID | Finding | Severity | Disposition |
|---|---|---|---|
| C-1 | Playtest trigger | P3 | Confirmed by the maintainer at Phase 0 |
| C-2 | Other harness pins | P3 | Verified: one thing-count pin (`holosuite-novel.ts:185`), no page-list pin |
| F1 | Root vs server script-name mismatch for the freshness check | P3 | Record-and-close |
| F2 | Harness test count does not reflect the added assertions | P3 | Record-and-close |

## Done-bar status

Every clause is met. `assemble` changed nothing (the review register is not an
assembled source), `check:fast` is 37/0 PASS, and `build-order` is complete. The
final commit is the last step; publication is out of scope.

LOOP PAUSED
