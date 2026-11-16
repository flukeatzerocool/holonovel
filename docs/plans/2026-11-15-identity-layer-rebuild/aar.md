# After-action report — identity-layer rebuild

Session: started 2026-11-15, closed 2026-11-16 (midnight crossed). The increment
directory keeps the session's start date; the CHANGELOG entry and the commit
subject carry the close date, which is what `session:close` derives.

## What was supposed to happen

Rewrite §1's identity layer (mission, goals, audiences, north star), add the
four-use projection to T.3, register the two identity terms, and give
"preparation" parity with the other three uses: a contract (REQ-660), an action
(`manage_codex (action: export)`), and its mechanical consequences. One increment,
one commit, all findings from the cold review resolved.

## What happened

All of it, in one commit. §1 carries the eleven identity paragraphs; T.3 carries
the four-use projection with no declaration change; §4 registers *Holodeck* and
*holonovel*; REQ-321o and REQ-660 land in §5.6 with T792; the export action is
implemented, declared, documented, and asserted. `check:fast` 46/0,
`build-order` green, the harness suite green at 596 assertions.

The plan needed six amendments, all recorded in `plan.md` under **Execution
delta**:

1. **D-1** — B0's pre-edit measurement was replaced by a post-edit confirmation;
   the artifact set was already enumerated by the cold review, so a pre-edit run
   could not change a decision.
2. **D-2** — the declaration values were wrong. `mutation_class: "read"` would
   have let a Player through the GM-only read exception at
   `holonovel/src/core/badge-gate.ts`; the action declares `write`, matching
   `manage_lore.export`.
3. **D-3** — the plan's round-trip assertion was not executable: `manage_codex
   (action: import)` is codex → Novel by contract (REQ-321b), not codex → codex.
   The assertion proves determinism, completeness, kind filtering, unknown-id
   refusal, and the Player refusal instead.
4. **D-4** — REQ-660 alone could not carry both the parity claim and the action
   contract inside the 800-character body limit, so the action contract became
   REQ-321o.
5. **D-5** — four artifacts the plan did not list: the G7 attestation (whole-spec
   hash), the starter Novel (freshness), the conformance predicate anchor (code
   motion), and the build-phase-map hash.
6. **D-6** — B3 deferred: the codex pack artifact kind needs REQ-620/621 edits
   plus a second catalogue regeneration; the one-way export stands alone and the
   return path is on `ROADMAP.md` with a trigger.

## Findings and dispositions

| # | Finding | Disposition |
|---|---|---|
| 1 | `mutation_class: "read"` would have granted Player access to a GM-only tool | Fixed in the increment (`write`, matching `manage_lore.export`); recorded as D-2 |
| 2 | The plan's seven-artifact budget was four short | Fixed in the increment; each repaired by its own generator; recorded as D-5 |
| 3 | The planned round-trip assertion was impossible against `manage_codex (action: import)` | Fixed in the increment; assertion replaced; recorded as D-3 |
| 4 | The 800-character REQ limit forced a contract split | Fixed in the increment (REQ-321o + REQ-660); recorded as D-4 |
| 5 | Codex export is one-way; no admission path exists | Scheduled — `ROADMAP.md` "Codex pack as an artifact kind (P3)" with a trigger |
| 6 | Cold-review finding IR-05(b) claimed the reading-guide gate did not exist | Recorded and closed: the gate is `scripts/test-spec-tooling.ts:378`; the prior report was wrong and the rejection was upheld by the re-review |
| 7 | `manage_codex` description hit the REQ-392 budget at 1,208 B | Fixed in the increment (971 B), relearning the reversibility vocabulary the lint requires |
| 8 | A conformance predicate anchor drifted on code motion | Fixed in the increment with `fix-anchors`; the recurring P3 class is already recorded on `ROADMAP.md` |
| 9 | The session crossed midnight, so the increment date and the commit date differ | Recorded here; the directory keeps the session start date by design |

## Verification

- `npm run check:fast` — 46 passed, 0 failed.
- `npm run build-order` — check, propagate, typecheck, version, fingerprint.
- `npm --prefix holonovel run test:output-contracts` — 596 passed, 0 failed.
- `npm run validate` — 0 errors; proofread register refreshed to 293.
- `npm run check-registers`, `check-anchors`, `surface-budget` — PASS.

## Outcome against the done bar

Met, with one substitution: B3 is scheduled rather than shipped, and the done bar
allowed exactly that ("shipped or scheduled with a `**Trigger:**`"). Every §1
element, the T.3 projection, the §4 entries, REQ-321o, REQ-660, T792, the
implementation, the regenerated artifacts, and the version surface are present.

LOOP PAUSED
