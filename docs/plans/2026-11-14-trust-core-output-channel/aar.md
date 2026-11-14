# After-action report — Trust-core output channel (F-P1-5, F-P1-6)

Session: 2026-11-14 · Plan: `plan.md` (v4, re-stamped after the delta
amendment) · Tasks: `tasks.md` · Cold review: `cold-review.md` (6 rounds)

## Outcome

Both scheduled findings are `Resolved` with assertions that fail on the old
behaviour and pass on the new:

| Bar | Evidence |
|---|---|
| 1 | `npm --prefix holonovel run test:output-contracts` → T13 red at `f175b26` (`REQ-004 truncation pointer keyed by the registered tool name`), green after C1 → `525 passed, 0 failed` |
| 2 | T13 cross-badge legs → Player `[ERROR] [NOT_FOUND]`, Editor full payload |
| 3 | T13 eviction leg → `[ERROR] [NOT_FOUND]` containing "evict"; `test:backfill` T221 rewritten → `117 passed, 0 failed` |
| 4 | `npm run validate -- --sdd-strict` → `0 error(s)`; REQ-004 793, REQ-179c 559/6, REQ-180c 470/5 (all ≤800 chars, ≤8 sentences) |
| 5 | F-P1-5/6 `Resolved`; ROADMAP narrowed to F-P1-7/8/9; `check-registers`, `check-roadmap`, `check-loop-artifacts` |
| 6 | `npm --prefix holonovel run test:all` → `56 passed, 0 failed`; `check:fast` (see below) |
| 7 | one `npm run session:close` commit |

## What went right

- Red-first held: T13 and T221 failed for the named reasons before any
  production edit, and the exact failure messages are quoted in the plan.
- The cold pass caught a second store reader (`contextSectionTexts`) that a
  typecheck change would have broken; routing both readers through one accessor
  is smaller than the alternative of two rules.
- Three latent defects on the same surface were closed while the code was open:
  the `search_rules` store key (not a registered tool name, REQ-179a), the bare
  `{"error":"not found"}` JSON for an absent pointer (REQ-179b requires
  `[ERROR] [NOT_FOUND]` with an eviction message), and a vacuous T221 assertion.

## What went wrong

- **The plan assumed universal truncation was safe.** It was not: `spec_health`
  is a ~47 KB single JSON document, so the unconditional channel replaced it
  with a pointer and 20+ harness assertions failed with `Unexpected token '…'`.
  Caught by the first full `test:output-contracts` run, not by the plan's T0
  sweep (which was performed after the first edit instead of before it). Cost:
  one delta amendment, two cold rounds, one re-stamp. The lesson is concrete —
  T0's "record every result above 32,000 bytes" step should have run before C1,
  and it would have found the 47 KB health document immediately.
- **A cold-review premise was overstated.** B1 claimed the context ledger
  exposes payload *text*; the ledger report carries only per-section token
  counts (`core/context-ledger.ts:90-118`). The typecheck break was real; the
  leak was not. The fix still removes a size side-channel (a Player counted a
  GM payload's tokens), so the assertion moved from "ledger text contains the
  pointer" to "Player's `last_tool_output` tokens are 0".
- **Anchor repoints were manual again.** Nine Holosuite anchors drifted by the
  line insertions; they were content-matched against `HEAD` with a throwaway
  script, one required a hand decision (`11250#verify` had four candidates).

## Deviations

1. T0's runtime probes (b)–(e) were replaced by the red T13 assertions: every
   truncating fixture needs a seeded package, and the fixture package's index is
   empty. The assertion is the same evidence, run red before the edit.
2. C2 grew from a resolver change to a shared accessor plus the ledger reader
   (B1 from the cold pass).
3. The JSON-document exemption (D10/D11, REQ-180c) is new scope created by
   execution evidence; it is the reason the plan carries a v4 stamp.

## Findings and dispositions

- **P3 — `JSON.parse`-based exemption can bypass the cap for a prose payload
  that happens to parse as JSON.** `Closed-P3`: no such result exists in the
  shipped surface; the alternative (a per-tool declaration) reintroduces the
  surface list this increment removes.
- **P3 — the context ledger reports only token counts, so the "second reader"
  leak was a size side-channel, not content.** `Closed-P3`; the visibility rule
  now applies uniformly, which is the cheaper invariant.
- **P2 — Holosuite anchor repoints are still manual.** Its ROADMAP trigger
  ("the next `holonovel/src/index.ts` edit that drifts a predicate") has now
  fired; the work is already scheduled under *Holosuite anchor repoint
  automation (P2)* and needs no new row.
- No P0 or P1 remains open beyond the scheduled roadmap.

## Loop status

`LOOP PAUSED` — gates green, findings dispositioned, the only open work is
already on `ROADMAP.md` (authorization surface F-P1-7/8/9; citation repair;
anchor automation). Zero new action items.
