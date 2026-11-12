# After-action report — §5.10 parser tool-name drift

Status: complete.
Plan: `plan.md` · Tasks: `tasks.md` · Independent review: `independent-review.md`

## Phase 0 — baseline (measured before any edit)

- `npm run assemble` → exit 0.
- `npm run check:fast` → 40 passed, 0 failed, `check:fast: PASS`.
- `npm run status` → 53 unpushed commits, 15 open roadmap items, `2026.11.11`.
- `git status --porcelain` → only the untracked increment directory.
- `npm run check-fingerprint-sync` → PASS (so later drift is attributable).
- Body measurement (script over parsed REQ bodies): §5.10 = 26 bodies with a
  `command` token (8 bare, 18 call), §5.6 = 2, §5.16 = 1, §5.3 = 1 config key.
  REQ-309b 798 chars, REQ-196a 754.

## Phase 1 — detector, red test first

- Added five assertions to `scripts/test-req-checks.ts` before the detector
  existed. `npm run test:validators` → `SyntaxError: … does not provide an
  export named 'checkToolTokenDrift'` (expected red).
- Implemented `checkToolTokenDrift(bodies, allow)` in
  `scripts/lib/req-checks.ts` and called it from
  `scripts/tool-citation-check.ts`. `npm run test:validators` → 57 passed,
  0 failed.
- Corpus run on the pre-fix tree: exactly 26 findings, all §5.10, none benign —
  no §5.3 config-key hit, no §5.6/§5.16 hit (allowlisted). False-positive
  budget: 0 benign / 26 true, so the detector was landed.

## Phase 2 — §5.10 normative text

- 28 lines converted (§5.10 prose `:3199-3203` plus 26 bodies): 33 call forms
  became `run_command (action: execute, "…")`, 15 bare tokens became
  `run_command`.
- REQ-309b landed at 809 characters, 9 over the cap. Dropped the redundant
  "(B1=`none`)" parenthesis and turned the trailing "never `run_command`" into
  "never the parser" → 794. REQ-196a → 757.
- Two new proofreading warnings appeared from the longer tool form
  (REQ-196d 55 words, REQ-284b 47 words). Both were shortened back out of the
  text; the residual REQ-196d 48-word sentence carries the normative category
  list and is accepted in the proofread register instead of abridged.
- `npm run tool-citation-check` after `assemble` → PASS.

## Phase 3 — notation clause

`spec/01a-constitution.md:141` now cites **Appendix F** (was "Appendix T test
catalog", which is the tool-surface map, so nothing in Appendix F was
licensed), covers the §6 verification steps that restate F's assertions,
excludes §5 normative text, and names the three tracked deferrals.

## Phase 4 — Appendix W and T261

Deviation from the plan as reviewed, recorded here rather than silently: the
plan's rev-1 draft re-pointed eleven `→ command` wire lines; rev 2 (after cold
review M5) kept the fixture as notation. Executed as rev 2. Appendix W gained
one preamble sentence declaring the notation and its `command` mapping; T261
now asserts "the expected registered tool (`command` in the transcript denotes
`run_command (action: execute)`)" instead of "tool name". No wire line changed.

## Phase 5 — verification

| Command | Result |
|---|---|
| `npm run assemble` | rewrote `holonovel.md`, `holonovel/holonovel.md` |
| `npm run validate -- --sdd-strict` | 0 errors, 286 warnings |
| `npm run tool-citation-check` | PASS |
| `npm run test:validators` | 57 passed, 0 failed |
| `npm run check-fingerprint-sync` | PASS (no regeneration) |
| `npm run check-tool-surface` | PASS |
| `npm run action-conflicts` | PASS |
| `npm run check-tool-definitions-sync` | PASS |
| `npm run lint` | PASS |
| `npm run check-markers` | PASS |
| `npm run check-registers` | PASS |
| `npm run check-roadmap` | OK, 16 sections |
| `npm run check:fast` | 40 passed, 0 failed, `check:fast: PASS` |

Scoped grep proof: `awk 'NR>=3158 && NR<3505' spec/02-requirements.md` contains
no `` `command` `` and no `command("`. Spec-wide survivors are exactly `:900`
(MCP config key), `:1542`, `:1826`, `:3906` (the three allowlisted deferrals).

Fingerprint proof: `check-fingerprint-sync` green with no `build-order` run, and
no edited file appears in either section list of
`scripts/lib/contract-fingerprint.ts`.

## Phase 6 — close

- `ROADMAP.md`: the §5.10 section is removed; a new
  "Fingerprinted-section tool-token re-point (P2)" section names the suffixed
  IDs `REQ-221b`, `REQ-330a`, `REQ-385a` (exact-token match for
  `register-checks`) and triggers on either fingerprint tier.
- `spec/audit/review-register.md`: F-P6a-20 `Resolved` (§5.10); F-P6a-21
  `Scheduled-roadmap` (§5.6/§5.16 deferral, with the REQ-385a section
  correction recorded).
- `spec/audit/proofread-register.md`: Batch 12, 283 warnings accepted.
- `CHANGELOG.md`: dated entry stating the Appendix W licensing deviation.

## Condition follow-through (from plan-review)

- **C-1** (REQ-425 does not exist): the plan cites REQ-651/REQ-652 for startup
  reconciliation and the health surface; no stale `REQ-425` remains in the
  executed text or the registers.
- **C-2** (package consequence): the register and plan state REQ-420's
  inactive-set behaviour, not re-serialization.
- **C-3** (suffixed IDs): the new roadmap section names `REQ-221b`,
  `REQ-330a`, `REQ-385a`; `check-registers` is PASS. The first draft cited the
  base IDs and the gate reported two findings — corrected in the same pass.
- **C-4** (both tiers): the trigger names the data and package tiers.

## What went right

- The fingerprint discovery (cold-review round 2) prevented a cosmetic edit
  from forcing every saved Novel through re-serialization.
- The detector was built red-first and its corpus run matched the predicted
  26-body set exactly, which is what made the scope trustworthy.
- The 800-character cap was measured rather than estimated; REQ-309b's overflow
  was caught before it became a gate failure.

## What went wrong

- The first plan draft miscounted the affected bodies (19 → 26) and mislocated
  REQ-385a (§5.11 → §5.16). Both were caught by cold review, not by the author.
- The first roadmap-section draft used base REQ IDs where the register gate
  matches exact tokens; `check-registers` caught it after the fact.
- `check-script-quality` failed the first green run with C3 (repeated parse):
  `tool-citation-check` called `readSpec()` twice. Fixed by parsing once and
  reusing the text.
- Two proofreading warnings were introduced by the longer tool form and had to
  be trimmed after the bulk edit rather than budgeted before it.

## Recommendations

None. The remaining work is the scheduled F-P6a-21 roadmap section; the
detector's allowlist is the visible handle for it. LOOP status:

LOOP PAUSED
