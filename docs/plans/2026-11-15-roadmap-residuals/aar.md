# AAR — Roadmap residuals

## What was supposed to happen

Close three of the four open ROADMAP sections — vendor-manifest provenance
(U7-F4), faction knowledge on secrets (U6-F5 residual), harness test-ID label
hygiene (F-P2-4) — leaving the date-gated 2026-11-28 re-measurement alone.
Done bar: `check:fast` 45/45 after each commit; `test:all` and `check-anchors`
green on the final tree; the three sections removed with their register rows in a
dated `Resolved` section; one new section for REQ-234b/REQ-234d.

## What happened

1. **Harness label (commit `26b885b`).** `T056`→`T56` at
   `test-narrative.ts:1205`; new `checkHarnessCommentIds` scans comment tokens for
   a zero-padded ID and errors under `--sdd-strict`. The detector was dry-run on
   the unfixed tree first: one error, exit 1 — then PASS. The harness collector
   was refactored to one read (`collectHarnessSources`) so the scan does not add a
   second parse. Corpus: one hit before, zero after. F-P2-4 is a real register
   bullet for the first time.
2. **Vendor provenance (commit `e04ea1d`).** `Source URL` on all 25 manifest rows,
   URLs from the licence table; `check-vendor-manifest.ts` became header-indexed
   and checks provenance on every row before the `(build-time)` hash guard; new
   REQ-451a; T541's row extended. The strict check reports 25/25; blanking one URL
   produced `NOURL … line 27` and exit 1, restoring returned exit 0. U7-F4 moved
   from `## Scheduled-roadmap` to `## Resolved`.
3. **Faction secrets (commit `6534dfa`).** `reveal`/`knowledge` resolve faction
   ids, `set_secret` takes `known_by` (REQ-234e), `faction://<id>` lists
   faction-known secrets for the GM badge only. T274 gained the faction cases and
   T789 now asserts `novel-tension-secret-` — the fixture's two faction reveals had
   been failing silently because nothing checked the result. Regeneration followed
   (tool definitions, surface baseline, coverage register, assembled spec, phase
   map, G7 attestation), 13 evidence anchors were repointed, and the DECISIONS
   budget header was updated by hand.
4. **Records.** U6-F5's residual closed and the U6 subsection moved under
   `## Resolved`; REQ-234b/REQ-234d scheduled as U6-F5b under a new P1 roadmap
   section; proofread register gained Batch 15 (288 warnings, accepted).

## Evidence

| Claim | Command → result |
|---|---|
| Label class is caught | `npm run validate:fast` before the fix → exit 1, `zero-padded test ID 'T056' … test-narrative.ts:1205`; after → exit 0, PASS line |
| Detector self-tests | `npm run test:validators` → 65 passed |
| Provenance gate refuses | `npm --prefix holonovel run check:vendor` after blanking one URL → `NOURL … line 27`, exit 1; restored → 25 rows, provenance 25 ok, 25 hashes match, exit 0 |
| Faction reachability | `npm --prefix holonovel run test:narrative` → 84 passed; `test:backfill` → 127 passed (T789 asserts the tension prefix) |
| Full proof | `npm run build-order` → OK through check, propagate, typecheck, version, fingerprint (includes `test:all` and `check-anchors`) |
| Fast gate per commit | `check:fast` → 45 passed, 0 failed (commits A, B) and after the final regeneration |

## Findings and dispositions

- **F-1 — the plan's negative probe could not restore as written.** `git
  checkout -- MANIFEST.md` in Phase B reverted the phase's own uncommitted column,
  and the first probe blanked the wrong line because an inserted paragraph shifted
  the table. Re-run from an explicit backup copy. Terminal: fixed, recorded as
  amendment A-1.
- **F-2 — the licence-source-parity check broke on the new column.** `scripts/validate.ts`
  parsed manifest rows by a fixed cell count (`cells.length !== 12`), so it reported
  all eight vendored directories as unlisted. Fixed by header name in the same
  commit; recorded as amendment A-2. Terminal: fixed.
- **F-3 — `surface-budget --write` does not write the DECISIONS budget line.** The
  plan said it does; it writes the baseline only. The header numbers were updated by
  hand. Terminal: fixed, amendment A-3.
- **F-4 — the build gate demanded the G7 attestation twice.** It keys on the spec
  content hash, so each spec-editing phase regenerates it. That is the design and
  the gate names the command. Terminal: record-and-close.
- **F-5 — 13 evidence anchors drifted with the `index.ts` edits.** `npm run
  fix-anchors` repointed them all (`13 drift(s), 0 unresolved`). This is the
  documented cost of editing `index.ts`. Terminal: fixed.
- **F-6 — the plan-review binding failed at the first `mark-build`.** I stamped the
  plan after applying a post-review correction, so the stamp's `plan_sha256`
  covered bytes the cold reviewer never saw, and the gate refused to bind. Resolved
  by a third targeted pass that attested the current bytes and emitted the hash
  line the gate requires. Process lesson: apply review corrections before stamping,
  or stamp the reviewed bytes and carry later corrections as conditions. Terminal:
  fixed in-session; the lesson is record-and-close here because the harness skill
  lives outside this repo and edits route through `skill-improvement-loop`.
- **F-7 — the proofread count moved 286→288.** Two new long-sentence warnings come
  from the two new requirement bodies; Batch 15 records them as accepted by policy.
  Terminal: fixed.
- **F-8 — a pre-existing README warning surfaced in full mode.** `validate-readme`
  flags `https://ironswornrpg.com` linked twice (Starforged and Ironsworn share the
  upstream), and fast mode prints only per-gate PASS lines, so it is invisible
  there. Not caused by this increment. Terminal: record-and-close.
- **F-9 — REQ-234b/REQ-234d remain unimplemented.** The reveal path emits the world
  change and the entity perception record only; no recommendation reaches the GM
  briefing. Scheduled as U6-F5b under ROADMAP § *Secret relationship
  recommendations (P1)*. Terminal: scheduled-roadmap.

## Conditions carried from plan review

- **C-1** — Nit-1 wording correction applied after the resolution pass;
  non-behavioural. Verified: the corrected `(build-time)` statements match the tree
  (every row carries a real Content Hash) and the bind pass confirmed it.
- **C-2** — the assembled spec and its satellite build outputs are regenerated by
  the phases, not blast-radius rows. Verified: `holonovel.md`,
  `holonovel/holonovel.md`, `spec/build-phase-map.md`, and
  `holonovel/src/generated/g7-attestation.ts` all changed as outputs of
  `assemble`/`build-order`, and the tree is otherwise inside the table.

## Done bar

Met: three sections removed; one added (REQ-234b/REQ-234d); `check:fast` 45/45 on
every commit; `test:all` and `check-anchors` green inside a completed
`build-order`; `test:narrative` 84 and `test:backfill` 127; the three register rows
sit under `## Resolved`; F-P2-4, U7-F4 and U6-F5 are closed on the record.

## Loop

LOOP PAUSED
