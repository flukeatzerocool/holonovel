# Plan — Pattern-buffer I1 verb-refusal reconciliation

Status: draft · Kind: planned · Depth: standard · Independence: fresh (cold pass: `plan.cold/report.md`)
Increment target: `docs/plans/2026-11-11-pattern-buffer-refusal-reconciliation/`
Rollback cost: 1 (reversible spec and harness edits; one commit)
Evidence class: repo only (no web, no user-supplied content)

## 1. Objective

Take the first open `ROADMAP.md` section — **Pattern-buffer I1 verb-refusal
expectation (P1)** (`ROADMAP.md:15-24`) — and close it by choosing the
surface that owns the unknown-verb refusal text and aligning the other.

**Decision: REQ-196c/REQ-196d own the text.** The normative requirement pair,
the shipped implementation, the T239 assertion, the Appendix F T239 row, and
the Appendix S error-code table already agree on `[ERROR] [UNIMPLEMENTED]
Unknown verb '<verb>'. Valid commands include: <nearest-1>, <nearest-2>,
<nearest-3>.` plus a `Corrective action:` line naming the nearest verbs. Two
surfaces are stale and are the surfaces this increment changes: the Appendix
W.3 golden transcript block and the pattern-buffer I1 assertion.

**Alternatives considered.** (a) Make the server return `[ERROR] [NOT_FOUND]
"xyzzy" is not a recognized command.` — rejected: it contradicts the
normative REQ-196c, REQ-002's `[UNIMPLEMENTED]` clause and corrective-action
rule, T239, and the review-register resolution F-P6a-7, and would rewrite a
working refusal to satisfy a fixture. (b) Rewrite REQ-196c/REQ-196d to the
transcript text — rejected: the shipped parser and its nearest-verb filtering
(REQ-309b) were built to those requirements; changing them reopens a resolved
finding and weakens the catalogue-backed refusal. (c) Align both stale
surfaces — chosen: no production behaviour change (the edited surfaces are one
fixture block and one harness assertion), and the two surfaces converge on the
contract every other surface already states.

**Adjacent defect, scheduled not fixed.** Appendix W.3 exercises `look`,
`go`, and `take` under the Player badge, and pattern-buffer I1 exercises the
same path under Player (`holonovel/scripts/run_pattern_buffer.ts:227`),
while REQ-196a's final sentence (`spec/02-requirements.md:3243`) says Player
`command` calls return `[ERROR] [FORBIDDEN]`. The contradiction predates this
increment and is not caused by the refusal-text edit. It is left out of scope
as **P1** and scheduled: a `Scheduled-roadmap` register row
(`F-P6a-19`) plus a ROADMAP section naming REQ-196a.

**Done bar** (each item names its command or artifact; no conditional clause)

1. `spec/appendices-fixtures.md:865-867` (the whole three-physical-line refusal
   block; `:864` is the `→ command` invocation and is preserved) is replaced by
   two logical lines in the sibling `take lever` format: the response line
   `[ERROR] [UNIMPLEMENTED] Unknown verb 'xyzzy'. Valid commands include:
   <nearest-1>, <nearest-2>, <nearest-3>.` and a separate line
   `Corrective action: Use one of: <nearest-1>, <nearest-2>, <nearest-3>.`,
   each wrapped to the transcript's ~80-column style, with the verb values
   captured from the server under the section's Player badge against the W.1
   fixture. Verified by three scoped greps in §6 over `sed -n '860,880p'`:
   one `[UNIMPLEMENTED] Unknown verb 'xyzzy'` line, one `Corrective action:
   Use one of:` line, and zero `NOT_FOUND` / `not a recognized command` lines.
2. `holonovel/scripts/run_pattern_buffer.ts:242-244`'s `command(xyzzy)` assert
   requires `[ERROR] [UNIMPLEMENTED]`, `Unknown verb 'xyzzy'`,
   `Valid commands include:`, and `Corrective action:` — no nearest-verb
   pinning; T245 owns edit-distance and vocabulary breadth
   (`holonovel/scripts/test-world-provider.ts:83-93`).
3. `npm --prefix holonovel run test:pattern-buffer` exits 0 with all 18
   scenarios passing — the printer (`run_pattern_buffer.ts:755`) reports
   `Total: 18 | Passed: 18 | Failed: 0` (pre-change it is 17/18 with I1
   failing).
4. `npm --prefix holonovel run test:backfill` (T239) and `npm --prefix
   holonovel run test:world-provider` (T245) exit 0, unchanged.
5. The `## Pattern-buffer I1 verb-refusal expectation (P1)` section (`:15-24`,
   heading through the Trigger's closing line) is deleted and replaced in the
   same slot by `## §5.10 REQ-196a Player-badge clause (P1)`, whose single
   bullet records that REQ-196a's "Player badge calls return
   `[ERROR] [FORBIDDEN]`" sentence (`spec/02-requirements.md:3243`) is
   contradicted by the Appendix W.3 Player-badge transcript and by the
   read-only Player vocabulary T239/Appendix F require, and whose
   `**Trigger:**` line is the next §5.10 parser-contract session;
   `npm run check-roadmap` passes.
6. `spec/audit/review-register.md` gains a dated group heading and a bullet in
   the existing shape: `### 2026-11-11 parser refusal reconciliation` then
   `- **F-P6a-19 — REQ-196a Player-badge clause contradicted (2026-11-11):**
   <predicate with file:line>. Scheduled under ROADMAP § §5.10 REQ-196a
   Player-badge clause; covers `REQ-196a`.`; `npm run check-registers` passes
   with no finding (the gate requires the cited REQ to appear in ROADMAP.md).
7. `npm run assemble && npm run check:fast` exit 0 un-piped with the trailing
   `check:fast: PASS` line; `npm run validate --sdd-strict` reports 0 errors.
8. `CHANGELOG.md` gains a new first entry
   `## 2026-11-11 — §5.10 parser unknown-verb refusal reconciliation` (first
   under `# Changelog`, so `session:close` derives the subject from it),
   naming REQ-196c/REQ-196d, both aligned surfaces, and F-P6a-19.
9. The increment directory holds `plan.md`, `tasks.md`, and `aar.md`;
   `aar.md` records the Phase 1 probe body (not only its path), its captured
   output, the Phase 0 baseline, and `deployed: not applicable — no
   publication in scope`, and ends `LOOP PAUSED`; `npm run
   check-loop-artifacts` passes.
10. The increment lands as one commit via `npm run session:close` (spec
    increment = one commit) and `git status --porcelain` is empty afterwards.

## 2. Evidence (repo, verified this session)

- `spec/02-requirements.md:3248-3252` — REQ-196c requires the not-implemented
  result naming the verb and three nearest commands ordered by edit distance
  with pattern `[UNIMPLEMENTED] Unknown verb '<verb>'.`; REQ-196d supplies
  `Valid commands include: <nearest-1>, <nearest-2>, <nearest-3>.`
- `spec/02-requirements.md:100-105` — REQ-002's `[UNIMPLEMENTED]` parser-verb
  clause and the corrective-action rule ("for a parser-vocabulary
  `[UNIMPLEMENTED]` it names the nearest valid verbs").
- `holonovel/src/world/parser.ts:124-141` — the shipped path returns
  `ERROR` / `UNIMPLEMENTED`, text `Unknown verb '<verb>'. Valid commands
  include: <3 verbs>.`, corrective action `Use one of: <3 verbs>.`
  (vocabulary-filtered by REQ-309b).
- `holonovel/scripts/test-backfill.ts:403-408` — T239 asserts
  `[UNIMPLEMENTED]`, `Unknown verb 'xyzzy'`, `Valid commands include:`,
  `Corrective action:`; it currently passes.
- `spec/appendices-reference.md:1697` — Appendix F T239 already requires
  `[UNIMPLEMENTED]` naming the verb and three nearest commands, and a
  Player badge on a ruleset-bound Novel seeing only read-only verbs. The
  harness T239 itself runs under the Game Master badge
  (`test-backfill.ts:389` sets `game_master`); the Player clause is the
  catalogue's, not the harness's.
- `spec/appendices-reference.md:3047` — Appendix S: `[UNIMPLEMENTED]` covers
  "a parser command verb outside the catalog"; the corrective action names the
  nearest valid verbs.
- `spec/audit/review-register.md:110-126` — F-P6a-7 (resolved 2026-11-10)
  records the shipped refusal text.
- `spec/appendices-fixtures.md:865-867` — the stale three-line refusal block
  (`:864` is the `→ command` invocation), inside the
  `# World-model parser commands under Player badge` section (`:831-833`).
- `holonovel/scripts/run_pattern_buffer.ts:227,242-244` — I1 runs under the
  Player badge and asserts `not a recognized command`.
- `holonovel/scripts/test-world-provider.ts:83-93` — T245 asserts the
  nearest-verb list respects the caller's read-only vocabulary, which is why
  the harness assertion pins no specific verbs.
- `spec/appendices-reference.md:1721` — T261 replays Appendix W.3 manually; no
  automated harness parses the transcript (grep for `Appendix W` / `golden`
  across `scripts/` and `holonovel/scripts/` finds no reader), so the
  transcript edit changes no machine expectation.
- `scripts/assemble.ts:144,181` — `npm run assemble` rewrites only the
  `spec/build-phase-map.md` content-hash line (REQ-278); the phase table is
  hand-maintained and unchanged here.
- `spec/audit/review-register.md:1660-1696` — no `Scheduled-roadmap` row
  matches `Pattern-buffer`, `xyzzy`, or this section, so retiring the roadmap
  item closes no register row; F-P6a-19 is new.
- `spec/02-requirements.md:3243` — REQ-196a's "Player badge calls return
  `[ERROR] [FORBIDDEN]`" sentence, contradicted by the W.3 Player-badge
  transcript and by the read-only Player vocabulary Appendix F's T239 row
  requires; scheduled as F-P6a-19.
- Baseline this session: `npm run check:fast` → 40 passed, 0 failed,
  `check:fast: PASS`; `npm --prefix holonovel run test:pattern-buffer` →
  17/18, I1 fails with `[ERROR] [UNIMPLEMENTED] Unknown verb 'xyzzy'. Valid
  commands include: ask, climb, close.` — that is the harness's failure line,
  which prints the message field only; T239 (`test-backfill.ts:407`) confirms
  the same response also carries the `Corrective action:` line.

## 3. Blast radius

Sizes: S = a few lines; M = a section; gen = written by a tool.

| Path | Change | Size |
|---|---|---|
| `spec/appendices-fixtures.md` | Appendix W.3 `xyzzy` block: refusal code, message, corrective action | S |
| `holonovel/scripts/run_pattern_buffer.ts` | I1 `command(xyzzy)` assertion | S |
| `ROADMAP.md` | delete the closed P1 section; add the REQ-196a clause section | S |
| `spec/audit/review-register.md` | new `Scheduled-roadmap` row F-P6a-19 | S |
| `CHANGELOG.md` | new dated first entry | S |
| `docs/plans/2026-11-11-pattern-buffer-refusal-reconciliation/` | `plan.md`, `tasks.md`, `aar.md` | S |
| `holonovel.md` | generated by `npm run assemble` (not hand-edited) | gen |
| `spec/build-phase-map.md` | content-hash line rewritten by `npm run assemble` (REQ-278) | gen |

No server source change. No REQ body change. No gate, harness, or manifest
addition. No external state, credentials, network, or publication step in
scope.

## 4. Steps (dependency order)

**Phase 0 — baseline and predicates.** Create the increment directory with
`plan.md` (this plan) and an `aar.md` skeleton carrying the baseline. Run
`npm run status`, `npm run check:fast`,
`npm --prefix holonovel run test:pattern-buffer`,
`test:pattern-buffer-ruleset`, and `test:all`; record
each result verbatim in `aar.md`, classifying `test:all` failures against the
known holosuite-anchor failures. Re-run `grep -n` for
`not a recognized command`, `Unknown verb`, and `REQ-196c` to confirm the two
stale sites are still the only ones; grep `spec/` for a `Scheduled-roadmap`
row matching this section, and record its absence.

**Phase 1 — capture the true transcript line.** Write a throwaway tsx probe in
`/tmp` (not committed; body copied into `aar.md`) that in order: creates a
Novel, converts the Appendix W.1 fixture (copy the code block under
`spec/appendices-fixtures.md:788-808`), creates a character, activates it
(`manage_character { action: "set_active", entity_id: "character_01" }`), sets
the `player` badge, then calls `run_command { command: "xyzzy" }`. Reuse the
`call`/process harness shape from `test-backfill.ts:392-408` or drive
`createEngine` from `holonovel/src/engine.ts:13`; do not load a ruleset
package, because Appendix W is a ruleset-free fixture. Record the exact
returned text. Expected shape (two logical lines):
`[ERROR] [UNIMPLEMENTED] Unknown verb 'xyzzy'. Valid commands include:
<nearest-1>, <nearest-2>, <nearest-3>.` and
`Corrective action: Use one of: <nearest-1>, <nearest-2>, <nearest-3>.`
If the probe reports a different nearest list, the probe's output is
authoritative. Trust boundary: repo/tool-output only.

**Phase 2 — align the two stale surfaces.**
1. `spec/appendices-fixtures.md:865-867`: replace exactly those three physical
   lines with the two logical lines captured in Phase 1, wrapped to the
   transcript's ~80-column style; touch no other transcript line.
2. `holonovel/scripts/run_pattern_buffer.ts:242-244`: replace
   `assertContains(r, "not a recognized command")` with four `assertContains`
   calls for `[ERROR] [UNIMPLEMENTED]`, `Unknown verb 'xyzzy'`,
   `Valid commands include:`, and `Corrective action:`.

**Phase 3 — bookkeeping.** Delete the closed ROADMAP section; add the
`## §5.10 REQ-196a Player-badge clause (P1)` section naming REQ-196a with a
trigger; add the F-P6a-19 `Scheduled-roadmap` row; add the CHANGELOG first
entry; complete `tasks.md` and `aar.md` from the Phase 0/1 records.

**Phase 4 — verify.** Run every check in §6, including the three scoped block
greps. Then `npm run session:close` for the single commit.

## 5. Edge cases and rollback

- **Probe returns `[FORBIDDEN]` or a different message class.** Stop and
  report; do not hand-compose a transcript line. The badge contradiction is
  already scheduled, so a `[FORBIDDEN]` observation goes into `aar.md`
  against F-P6a-19, not into this edit.
- **Probe cannot boot (data-dir or server init failure).** Stop and report
  rather than composing the line.
- **A second stale surface appears in Phase 0.** Add it only if it names the
  same refusal contract; otherwise record it as a roadmap item.
- **`check-markers` reports README drift.** Run `npm run refresh-properties`
  and include the regenerated markers in the same commit.
- **Rollback.** `git revert` of the single commit restores the transcript,
  assertion, roadmap, and register; no data or schema migration is involved.
- **Publication is out of scope.** The plan stops at the local commit; a later
  explicit "push" runs `push-pipeline.sh`, which writes the spec-update record.

## 6. Verification summary

| Check | Command | Expected |
|---|---|---|
| Pattern buffer | `npm --prefix holonovel run test:pattern-buffer` | 18 scenarios, 0 failed, exit 0 |
| Ruleset pattern buffer | `npm --prefix holonovel run test:pattern-buffer-ruleset` | exit 0 |
| Parser contracts | `npm --prefix holonovel run test:backfill` | exit 0 |
| Vocabulary breadth | `npm --prefix holonovel run test:world-provider` | exit 0 |
| Block: response line | `sed -n '860,880p' spec/appendices-fixtures.md \| grep -c "\[UNIMPLEMENTED\] Unknown verb 'xyzzy'"` | `1` |
| Block: corrective line | `sed -n '860,880p' spec/appendices-fixtures.md \| grep -c "Corrective action: Use one of:"` | `1` |
| Block: no stale text | `sed -n '860,880p' spec/appendices-fixtures.md \| grep -c "NOT_FOUND\|not a recognized command"` | `0` |
| Assemble + gates | `npm run assemble && npm run check:fast` | `check:fast: PASS` |
| Strict validation | `npm run validate --sdd-strict` | 0 errors |
| Roadmap admission | `npm run check-roadmap` | pass |
| Register hygiene | `npm run check-registers` | pass |
| Increment artifacts | `npm run check-loop-artifacts` | pass |
| Commit | `npm run session:close` | one commit, clean tree |

Unverified by design: `test:all` full green (pre-existing holosuite anchor
failures, scheduled P2 under "Holosuite anchor repoint automation"); its
pre-change result is recorded in `aar.md` and compared after the edit rather
than claimed green.
