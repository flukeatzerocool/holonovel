# AAR — Roadmap clearance: Torre polish and NPC identity in play

Session 2026-11-08. Base HEAD `2f5a0c8`. One spec increment, one commit.
Plan revision 3 (`plan.md`, approved with conditions C-1/C-2).

## What happened

1. **Baseline.** `check:fast` 37/0 PASS; `test:starter-novel` 15/0;
   `test:narrative` 60/0; `test:identity` 25/0.
2. **P1 — Torre content polish.** Added `firstSentence()` and replaced the
   `substring(0, 60)` beat preview; authored the four starter previews; set
   `Your Candle` `wearable: false`; added `gothic_horror` to REQ-294,
   `GENRE_CATALOG`, T339, and the starter.
3. **P2 — NPC identity in play.** Added REQ-649, the §5 section-map row, the
   created-REQ table row, and T772; implemented `npcIdentitySummary()` in
   `manage_npc (action: get)` and the present-NPC briefing block, GM only.
4. **Regeneration and registers.** Tool definitions, surface baseline
   (27,980 / 24,382 tokens), DECISIONS budget line, coverage register and
   markers, assembled spec, contract fingerprints; two ROADMAP sections
   removed and three review-register rows moved to `Resolved`; proofread
   register Batch 10.
5. **Verification.** All named harnesses and gates green (see Evidence).

## What went right

- The split between content authoring and server behavior kept the diff
  reviewable: the regenerated starter artifact diff is confined to
  `story_beats`, the candle flag, `genre`, and the data-format stamp.
- Reusing `compileKernel` + `renderWhoTheyAre` for the NPC summary gave REQ-649
  the same determinism, awareness marks, and catalog order as the existing
  identity renderer, with no new rendering path.
- The content-match anchor repoint (below) was deterministic and verified by
  the four Holosuite tiers rather than by guessing line deltas.

## What went wrong

- **F1 (P3, record-and-close)** — the first T387 assertion checked the whole
  briefing for the raw description tail, which the `**Scene:**` line always
  contains. Corrected in-session to assert on the beat line
  (`resolution ("…")`); no action.
- **F2 (P2, fixed)** — the two source insertions drifted 15 Holosuite
  predicate anchors (`holonovel/src/index.ts:<line>#symbol` by +18/+31). All
  four Holosuite tiers failed on `predicate_unresolved`. Repointed with a
  content-match pass; tiers green.
- **F3 (P2, fixed)** — the first `build-order` run failed
  `check-starter-freshness`: the starter artifact carried the pre-change
  `data_format` stamp. Regenerating the starter **after** the contract
  fingerprints updated fixed it. Ordering rule for the next increment:
  regenerate the starter last.
- **F4 (P2, recorded)** — the proofread register was already stale by 12
  warnings before this increment (269 live vs 257 recorded); this increment
  adds 2. Batch 10 records 271 and names the provenance.
- **F5 (P3, record-and-close)** — plan rev 2 named T340 as the REQ-294 test; the
  actual genre-declaration test is T339 (`test-persistence.ts`). The rev-3
  delta corrected it before execution.

## Evidence

| Step | Command | Result |
|---|---|---|
| Baseline fast gate | `npm run check:fast` | 37/0, `check:fast: PASS` |
| P1 previews/wearable | `npx tsx holonovel/scripts/build-starter-novel.ts` | artifact written; diff confined to previews, candle flag, genre, data-format stamp |
| P1 tests | `npm run test:starter-novel` (holonovel) | 15 passed, 0 failed |
| P1 tests | `npm run test:narrative` | 61 passed, 0 failed (T387/REQ-337 added) |
| P1 genre | `npm run test:persistence` | 41 passed, 0 failed (T339 accepts `gothic_horror`) |
| P2 tests | `npm run test:identity` | 26 passed, 0 failed (T772 added) |
| Typecheck | `npm run typecheck` (holonovel) | exit 0 |
| Spec | `npm run validate -- --sdd-strict` | 0 errors; coverage register current; proofread register matches 271 |
| Conformance | `npm run check:conformance` | PASS: no bundle-dependent REQs |
| Holosuite | `test:holosuite-{conformance,invariants,adversarial,novel}` | all `holosuite: PASS` after the anchor repoint |
| Build order | `npm run build-order` | exit 0, "Build order complete. Ready to commit." |
| Full suite | `npm run test:all` (holonovel) | 54 passed, 0 failed (127.7s wall clock) |

## Findings and dispositions

| ID | Finding | Severity | Disposition |
|---|---|---|---|
| F1 | First T387 assertion targeted the whole briefing | P3 | Resolved in-session |
| F2 | Holosuite predicate anchors drifted with the source edits | P2 | Resolved: 15 anchors repointed, tiers green |
| F3 | Starter artifact must be regenerated after fingerprint regeneration | P2 | Resolved; ordering rule recorded above |
| F4 | Proofread register warning count was stale | P2 | Recorded: proofread register Batch 10 (271) |
| F5 | Plan named the wrong REQ-294 test (T340 → T339) | P3 | Resolved in the rev-3 delta |
| R3-1 | Player-facing knowledge is seven pages | P1 (deferred by trigger) | Remains on `ROADMAP.md` (P3 item) |
| R4-1 | Survivor race is descriptive; REQ-233a3's "(current behavior)" wording overstates the code | P1 (evidence) | Remains on `ROADMAP.md` (P3 item); R4-1 is its evidence |

C-1 (no exact-shape NPC-get assertion) and C-2 (genre decision) were resolved
before execution: C-1 confirmed against `test-output-contracts.ts`, C-2
answered by the user (`gothic_horror`).

## Done-bar status

Every clause of the plan's **Done bar** is met except the final commit, which
this AAR precedes. Phases 3 and 4 remain on `ROADMAP.md` with their triggers
unchanged, as directed.

LOOP PAUSED
