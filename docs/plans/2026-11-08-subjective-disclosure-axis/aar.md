# AAR — Subjective memory disclosure axis and Player exposure

Session 2026-11-08. Plan: `docs/plans/2026-11-08-subjective-disclosure-axis/plan.md`.
Roadmap chunk 3 of 5. Baseline: `check:fast` PASS (37/37) at `96a4bcf`.

## What shipped

| Surface | Change |
|---|---|
| `spec/02-requirements.md` | §5.35 preamble + REQ-623/624/625/626/627 amended, REQ-634 (Player exposure) and REQ-635 (reclassification) added; §5 map row `623–635`; REQ-109c3, REQ-599b, REQ-096k amended |
| `spec/04-runtime.md` | §7.7.4 Subjective Memory row: Player read, disclosure-filtered |
| `spec/01a-constitution.md` | Glossary row carries the disclosure axis |
| `spec/appendices-reference.md` | Appendix E rows for REQ-634/635; Appendix F T753–T757 added, T744/T745/T746 reconciled |
| `holonovel/src/core/subjective.ts` | `MemoryDisclosure`, `MEMORY_DISCLOSURES`, `secret` load default, `playerProjection`, `disclosureScanTargets` |
| `holonovel/src/index.ts` | `subjective_disclosure` / `subjective_record_id` params, `subjective_disclose` action, Player-scoped `subjective_list`, Player briefing branch, GM disclosure tag, scan targets, player-scope export filter |
| `holonovel/scripts/test-belief.ts` | T753–T757; T744/T745 updated for the new contracts |
| Registers | DECISIONS (D1–D7 + recorded budgets 239→240 actions, 27,681/24,083 tokens), CHANGELOG, ROADMAP item retired, `holonovel/AGENTS.md`, tool definitions, surface baseline, coverage register, starter artifact, fingerprint |

No new tool, no new property group, no new config. `manage_belief` gains one
action (15 → 16) and two parameters; the tool count stays 37.

## Evidence

| Command | Result |
|---|---|
| `npm run check:fast` (un-piped) | PASS — 37 passed, 0 failed, exit 0 |
| `cd holonovel && npm run test:belief` | 27 passed, 0 failed (T743–T757) |
| `cd holonovel && npm run test:briefing` | 14 passed, 0 failed (T709–T711 intact) |
| `cd holonovel && npm run test:all` | 54 passed, 0 failed, exit 0 |
| `npm run build-order` | 0 errors; DATA_FORMAT + starter + version + markers propagated; "Ready to commit" |
| `HOLONOVEL_IMPL_STRICT=1 npm run validate` | 0 errors, 261 warnings; bucket A 0; REQ-634/635 bucket C (T755/T756) |
| `npm run validate -- --write-register` | coverage register current |
| `npm run surface-budget -- --write` | baseline re-recorded |
| `npx tsx scripts/surface-replay.ts --check` | exit 0, precision 0.978 (floor 0.90) |

## Done bar

- Secret memory tagged in the GM briefing — **T755** (`[authored, secret]`).
- Secret memory redacted from a Player draft — **T757** (`[redacted]`, no
  `nine seven`; strict mode covered by T710).
- Player read of another entity returns `[FORBIDDEN]` — **T744/T754**.
- `check:fast` PASS un-piped; strict validate 0 errors; ROADMAP item retired;
  changelog entry dated to the release version.

All met.

## What went right

1. The fail-closed load default meant no migration: existing records read as
   `secret`, and the only visible change for an existing Novel is the added tag
   in the GM briefing.
2. The REQ body limits forced the right compression in REQ-624 — the parameter
   names already live in the schema, so the body keeps the required inputs and
   the disclosure rule instead of restating twelve names.
3. `playerProjection` as the single projection point made the read, the
   briefing, and the export agree without three implementations.
4. T754 caught a real premise error in my own test (the active entity is set by
   entity creation), which the restructured test now proves deliberately.

## What went wrong

1. **The holosuite evidence anchors broke.** Eleven `anchor(...)` predicates in
   four tier files pin `holonovel/src/index.ts` line numbers; the edits shifted
   them and the gate refused stale anchors (P0, fixed in-session). Re-resolved
   each to the nearest non-comment line carrying its token. Lesson: a
   server-source edit is an anchor edit, so `test:all` belongs in the per-step
   verification, not only at the end.
2. **The starter artifact went stale.** Adding a field to a §7.7 property group
   changes `DATA_FORMAT`, which `content/torre-nosferatu.json` embeds. Rebuilt
   with `build:starter-novel`. The chunk-1 plan predicted this cost; this plan
   did not carry it into the blast radius.
3. **REQ-624 was 900 characters on first draft.** Trimmed to 753. The 800-char
   limit is a drafting constraint, not a post-hoc gate.

## Deviations

Recorded in `plan.md` § Deviations: REQ-096k (not REQ-096b) owns the
player-bundle detail; REQ-624's parameter list was compressed; T744/T745/T746
were amended; the `share: true` concern is already guarded by REQ-096m; the
starter artifact and the four holosuite tier files were touched.

## Findings and dispositions

| Finding | Severity | Disposition |
|---|---|---|
| Holosuite anchors pinned to shifted lines | P0 | **Resolved in-session** — 11 anchors re-resolved; all four tiers pass |
| Starter artifact stale from the `DATA_FORMAT` bump | P0 | **Resolved in-session** — rebuilt; `check-starter-freshness` green |
| Proofread register records 257 warnings; the live run reports 261 (258 before this increment) | P3 | **Record-and-close** — the mismatch predates this increment and the counts are informational; the register tracks specific findings, and adding a bare count without entries would be worse. No new action item. |

No P1 (unbudgeted normative gap) and no P2 (a demonstrated failure needing a
guard) beyond the two P0s fixed above. Chunks 4 (psyche-depth identity facets)
and 5 (recall quality) remain on `ROADMAP.md`.

## Coverage backlog

`spec/audit/req-coverage.md`: bucket A 0, bucket B 0, bucket C 460, bucket E
126. REQ-634 and REQ-635 are bucket C with T755/T756 as direct evidence.

LOOP PAUSED
