# AAR — Anchor repair: identity resolution and a declared offset

AAR: SUCCESS — the resolver no longer guesses, a move is repaired by a declared offset that is
verified before and after the write, the cross-file fallback is gated, and the ROADMAP bullet that
recorded the defect is retired with every gate green.

## 1. What was supposed to happen

The plan (`plan.md`, revision 4) had one done bar: the resolver resolves by identity with no
proximity rule; a stale anchor whose recorded line lost its symbol and whose symbol sits on several
lines is refused with every candidate named, `--check` and `--write` both exiting 1 without writing
it; `--offset` repairs a declared move only where the target verifies and never falls back across
files while the recorded file still carries the symbol; every write is re-verified; the hint names
a move's modal delta without changing the exit code; the suite prints 44 assertions over 24 labels
with zero failures; four live probes fail and restore; the ROADMAP bullet is removed and the
register subsection closes with a `Resolved` entry under `check-registers:strict`; `check:fast` is
green; `aar.md` ends `LOOP PAUSED`; one `--single` commit.

Intended scope: five phases, four source files, no spec-source or server-source edit, no generated
artifact. Explicit assumptions, all recorded: the live corpus is clean under the tightened rule
(measured: 39/39 anchors carry their symbol on their recorded line), and only the coincidental-
carrier class is out of reach because the anchor format carries no content fingerprint.

## 2. What happened

Every phase completed in order. One deviation, no rework in the code.

| Phase | Result | Evidence |
|---|---|---|
| P1 | baseline + reproduction | `check:fast` 46/46 PASS; suite 20 passed; `check-anchors` `predicates current`; audit `total=39 exactLine=39 multiCandidate=34 substringOnly=0`; scratch write `:42 -> :47 (written)` then `predicates current` |
| P2 | resolver rewritten | no `ANCHOR_WINDOW`/`resolveAnchorLine` anywhere; `check-anchors` still current |
| P3 | offset + verification + hint | suite `44 passed, 0 failed`; 22 new CLI assertions over 15 labels |
| P4 | four live probes | each exit 1 with its labelled message, each restored |
| P5 | registers, roadmap, gate table, AAR | `check-roadmap` OK (5 sections); `check-registers:strict` PASS; `check-gate-table` PASS |

**Deviation.** `RepathResolution` gained a `carrier: string | null` field. The first C9 run reported
`ambiguous in holonovel/src/index.ts` — the *recorded* path, not the carrier file — because the
resolution result carried only `path` and `line`. Adding the carrier path is what makes D3's
"the message names `path:line` for every candidate" true. Type addition only, inside a file already
in the blast radius; the resolver's contract (unique carrier file + unique candidate line) is
unchanged. Recorded here rather than as a plan amendment because no premise moved.

**Loop closure.** plan-review passed (stamp `37d06c89…`, independence fresh) → build-review passed
before the first edit → five phases executed → gates green → feedback routed (this AAR + one `SK`
record).

**Gate outcomes.**

| Gate | Token | Verdict |
|---|---|---|
| plan-review | `plan-review passed.` | passed (final revision, after a FAILED cold pass, a passing diff re-review, a FAILED delta pass, and two binding passes) |
| independent-review | `independent-review passed.` (r2 diff re-review) | passed |
| build-review | `build-review passed.` | passed |
| spec-review | not run (no spec-review request) | n/a |
| proofread | not run; `check:fast` ran the validator's proofread warnings | n/a |

## 3. What went right

- **The cold pass caught two real blockers before any edit.** The `(written; delta +2)` format
  would have failed two live assertions at P3, and the unguarded `--repath` fallback could have
  written a sibling file — the exact guessing this increment removes — because `fix-anchors` carries
  `--repath` implicitly. Both are now negative tests (C1's regex, C16).
- **The measurement justified the design.** 34 of 39 anchors name a symbol carried on several code
  lines, so "nearest candidate" was a coin flip. That number is also why removing the window entirely
  (rather than widening it) was the honest choice.
- **Every new predicate has a negative probe.** The four live probes each fail with the message the
  plan predicted, then restore; the suite's C2/C4/C16 cases prove the same paths without touching
  the live tree.
- **The gate stayed green through the change.** The tightened rule changed no live verdict because
  all 39 anchors were already on carrying lines — measured in P1 rather than assumed.

## 4. What went wrong

- **The ambiguity message enumerates all candidates.** For `err` that is 378 line numbers (~2.5 KB)
  on stderr for one binding site. The plan required "naming every candidate line" and that is what
  the tool does, but the output is heavier than a gate message wants.
- **The first test run was 45 assertions, not 44.** C15 carried two checks (missing value and
  non-integer `--from-line`) as separate assertions; the plan's count assumed one. Folded into one
  assertion, which is the honest grouping — both are "a value flag with an invalid value".
- **The re-review's own tally disagreed with its body** (4 Majors reported, D-4 tagged Major inside
  a Nit list). Bookkeeping in the reviewer's artifact, not a plan defect; the diff re-review noted
  and dismissed it.

## 5. Session performance

- **Outcome vs done bar.** All twelve clauses hold. The increment closes the defect class it named
  and states the one class it cannot close (a coincidentally-carried line) instead of implying
  closure.
- **Scope adherence.** No out-of-plan work. The only unplanned code is the `carrier` field, recorded
  above. The ROADMAP item stays open with its two remaining bullets, as planned.
- **Verification quality.** The suite went 20 → 44 assertions; four live probes prove the gate
  behaviour on the real corpus, not only in scratch trees. The one soft spot: the hint's modal delta
  is a suggestion built from nearest-candidate arithmetic, so it is proven to *print* the right
  number (C11) but not to be a safe automatic repair — which is why it never writes.
- **Rework.** Five review dispatches: one full cold pass (2 blockers), one diff re-review of the
  fix (clean), one delta pass after the condition-only amendment (1 real Major in my own text — V1's
  arithmetic omitted 11 assertions), and two binding passes that confirmed the corrections. Every
  finding was in the plan document, not the code; no source file was edited twice for the same
  reason.
- **Cost.** Roughly 125 tool calls: ~35 research reads while drafting, 5 cold/Delta dispatches, ~45
  build commands, ~12 register/gate reads. One `check:fast` run after the change, plus the close's
  own run.
- **User intervention.** Two: the item selection (the roadmap question) and "execute plan". No
  corrections.

## 6. Findings

- **F-1 — the candidate enumeration scales badly (P3, informational).** Predicate:
  `scripts/refresh-predicates.ts` builds the ambiguity message from `resolution.ambiguous.join(", ")`
  with no cap, and `err` carries 378 candidates. No failure demonstrated — the message is correct and
  the gate is readable — so this is record-and-close. If a future increment touches this message, cap
  the list and keep the count.
- **F-2 — `RepathResolution` needed a carrier field (deviation, P3).** Predicate: the message
  printed the recorded path instead of the carrier file; C9 caught it on the first run. Fixed in the
  same increment (the field is part of D3's message contract). Record-and-close.
- **F-3 — the passing cold token lives in a parent-written artifact (P3, process; third instance of
the SK-28 class).** The
  `independent-review` subagent's contract is read-only and it cannot nest, so it returned its report
  in chat and the parent persisted `plan.cold/review-r2.md`, which the stamp then cites. Independence
  from the author holds in content (the reviewer never saw the authoring conversation), but the
  artifact's provenance is the parent's. Disposition: `SK-29` appended; no project change.

No project action items. Nothing scheduled on ROADMAP; the next plan comes from the roadmap or a
direct request.

**Skill findings.** One row appended (`SK-29`). Also observed, already registered and not
duplicated: `changelog-before-commit` did not load again (fourth instance of SK-18/SK-24/SK-26).

## 7. Invocation audit

| Expected | Loaded | Verdict |
|---|---|---|
| `programming-orchestrator` | yes | routed |
| `plan-review` | yes | routed |
| `build-review` | yes | routed |
| `independent-review` (via subagent) | yes | routed |
| `after-action-report` | yes | routed |
| `changelog-before-commit` | no | miss (SK-26 covers the gap; entry authored as the AAR block) |

Invocation: 6 expected, 5 loaded, 1 miss.

## Verification readings

| # | Command | Result |
|---|---|---|
| V1 | `npx tsx scripts/test-anchor-tooling.ts` | `44 passed, 0 failed` (8 unit + 36 CLI), 24 labels present |
| V2 | `npm run check:fast` (un-piped, last) | `46 passed, 0 failed`, `check:fast: PASS`, exit 0 |
| V3 | `npm run check-anchors` | `predicates current`, exit 0 |
| V4 | four live probes (`probe.md`) | four labelled failures, each restored; `git status --porcelain` shows only planned files |
| V5 | `npm run typecheck` · `npm --prefix holonovel run typecheck` | both exit 0 |
| V6 | `check-roadmap` · `check-registers:strict` · `check-gate-table` | OK (5 sections) · PASS · PASS |
| V7 | `grep -rn "ANCHOR_WINDOW\|resolveAnchorLine" scripts/` | no match; U2 proves the nearest-wins branch is gone |
| V8 | `git status --porcelain` · `git log --oneline -1` | planned files only · one increment commit |

## Changelog entry

**Title:** Anchor repair: identity resolution and a declared offset

**Summary:** `fix-anchors` bound stale anchors to the nearest occurrence of their symbol, so after a
block move it wrote eight wrong lines that then self-validated. Resolution is now by identity only,
a move is repaired by a declared `--offset` that is verified before and after the write, and the
cross-file fallback is refused while the recorded file still carries the symbol. ROADMAP's
*Split `index.ts`* loses the bullet that recorded the defect.

- `scripts/lib/anchor-resolver.ts`: the ±40-line window and the nearest-wins branch are deleted; `lineCarriesSymbol` is the single code-line/whole-word predicate; `resolveAnchorSymbol` takes no line number, so a symbol on several lines is ambiguous rather than ranked by distance; a repath accepts only a carrier file that carries the symbol on exactly one line
- `scripts/refresh-predicates.ts`: `--offset <n> --path <p> [--from-line <n>]` declares a line shift — anchors still on their recorded line are untouched, a verified target is rewritten, anything else is refused; the `--repath` fallback fires only when the recorded file carries no candidate line; every rewrite is re-read after the write; a stderr `hint` names a move's modal delta
- `scripts/lib/args.ts`: `rejectUnknown` skips the token following a value flag, so a negative offset parses instead of being rejected as an unknown flag
- `scripts/test-anchor-tooling.ts`: 20 → 44 assertions across 24 labels, including the regression that a near-but-wrong candidate is refused (C2), the offset refusal (C4), and the guarded cross-file fallback (C16)
- Four live probes recorded in `docs/plans/2026-11-17-anchor-repair-gap/probe.md`: wrong-nearest, substring-only line, offset miss with the symbol still present, and an empty `--path` selection — each fails with its message and is restored
- `ROADMAP.md` retires the anchor-repair bullet; the review register closes its Scheduled-roadmap subsection and records two Resolved findings; the `check-anchors` gate description and the AGENTS.md table name the new contract
- The residual is stated rather than implied: a line that carries the symbol by coincidence still self-validates, because the anchor format records no content fingerprint

LOOP PAUSED
