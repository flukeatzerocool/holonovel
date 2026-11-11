# Plan — §5.10 REQ-196a Player-badge clause

Status: draft · Kind: planned · Depth: standard · Independence: fresh (cold pass: `independent-review.md`)
Increment target: `docs/plans/2026-11-11-5-10-req-196a-player-badge-clause/`
Rollback cost: 1 (reversible spec and harness edits; one commit)
Evidence class: repo only (no web, no user-supplied content)

## 1. Objective

Take the first open `ROADMAP.md` section — **§5.10 REQ-196a Player-badge clause
(P1)** (`ROADMAP.md:15-23`) — and close it. The section was scheduled by the
prior increment as `F-P6a-19`
(`docs/plans/2026-11-11-pattern-buffer-refusal-reconciliation/plan.md`,
review register `spec/audit/review-register.md:1664`).

**Decision: the shipped badge gate plus REQ-309b/REQ-309h are authoritative;
REQ-196a is corrected.** The operating rule for this increment is: where the
shipped gate and a normative clause disagree, the shipped behaviour is written
as the contract when it is exercised by a harness, and an unimplemented
normative clause is scheduled, not copied into the new text.
REQ-196a's closing sentence says "The tool is Game Master only; Player badge
calls return `[ERROR] [FORBIDDEN]`" (`spec/02-requirements.md:3243`). That
absolute claim is contradicted by five independent surfaces:

| Surface | Predicate |
|---|---|
| Normative | REQ-309b (`spec/02-requirements.md:3415`) permits ruleset-free Player parser access and forbids Player-visible navigation/mutation verb names; REQ-309h (`:3432-3433`) requires ruleset-bound Player read-only perception commands and ruleset-free `player`/`game_master`/`observer` acceptance |
| Implementation | `holonovel/src/index.ts:4966-4971` gates the Player badge by verb: `playerReadOnly = novel.ruleset && badge === "player"`, then membership in `PLAYER_READONLY_VERBS` (`:355`) |
| Golden transcript | Appendix W.3 (`spec/appendices-fixtures.md:831-866`) shows `look`, `go north`, `take lever` under the Player badge on a ruleset-free Novel |
| Harness | `test:backfill`'s ruleset-free Player parser case (`holonovel/scripts/test-backfill.ts:375-390`) and T643's ruleset-bound Player case (`holonovel/scripts/test-competitive-gaps.ts:493-505`) pass today |
| Pattern buffer | I1 runs under the Player badge on a ruleset-free Novel (`holonovel/scripts/run_pattern_buffer.ts:227-246`), cited by F-P6a-19 (`spec/audit/review-register.md:1668`) |

**Alternatives considered.** (a) Make the parser GM-only everywhere and re-badge
the W.3 transcript (the roadmap's other closing route) — rejected: it would
contradict REQ-309b/REQ-309h, delete the ruleset-free Player surface that
`test-backfill.ts:375-390` and pattern-buffer I1 exercise, and reverse the
evidence recorded as `F-P6a-19`. (b) Rewrite REQ-309b/REQ-309h to match
REQ-196a — rejected: those two REQs carry harness citations (T353, T643) and
gate the whole prominence contract; weakening them to satisfy one stale
sentence is a larger normative change than the defect. (c) Correct REQ-196a
(and the one other absolute sentence it exposes) and align the two stale
catalogue surfaces — chosen: two normative sentences, two Appendix F rows, and
one Appendix W summary line, with no production behaviour change.

**Second defect in the same clause family: T239's Player clause is
unreachable.** Appendix F's T239 row requires "a Player badge on a ruleset-bound
Novel sees only read-only perception verbs in that list"
(`spec/appendices-reference.md:1697`). Under the shipped gate an unrecognized
verb under a ruleset-bound Player is refused before parsing
(`holonovel/src/index.ts:4968-4971`), so no nearest-verb list is produced. The
`allowedVerbs` filter (`holonovel/src/world/parser.ts:124-140`,
`holonovel/src/index.ts:5072`) is therefore defence-in-depth, exercised at
unit level by T245 (`holonovel/scripts/test-world-provider.ts:83-92`) but
unreachable end to end. **Repair:** delete that one clause from the T239 row
(the rest of the row is unchanged; the harness at `test-backfill.ts:392-441`
covers its refusal envelope, container take, disambiguation, help equality, and
jump/touch assertions, while the fixture walkthrough stays manual under T261),
and add the reachable contract to T643 — an unrecognized verb returns `[FORBIDDEN]` — exercised by a
new assertion inside T643's existing ruleset-bound Player window.

**Third defect: REQ-196c states the same absolute contract.** REQ-196c
(`spec/02-requirements.md:3249`) says unconditionally that "An unrecognized
command SHALL return a not-implemented result" naming the nearest verbs. That
is the normative root of the T239 clause being deleted, and the gate cannot
produce it for a ruleset-bound Player. It is qualified in the same increment
with one clause: on a ruleset-bound Novel a Player-badge call is refused by the
badge gate (REQ-309b) before parsing. This keeps the refusal contract for the
Game Master and ruleset-free Player while removing the contradiction.

**Fourth defect, discovered while verifying the first: Appendix W.4 still
promises `[NOT_FOUND]`.** `spec/appendices-fixtures.md:963-964` says the
transcript asserts "unrecognized commands return `[NOT_FOUND]`", while W.3
(`:865`) and REQ-196c (the `[UNIMPLEMENTED]` refusal, reconciled one increment
ago) say otherwise. The prior increment's scoped grep covered lines 860-880
only, so this line was missed. It is a factual error in the same appendix and
is fixed here.

**Out of scope, scheduled P1: REQ-309h's `observer` clause is unimplemented.**
REQ-309h requires a ruleset-free Novel to accept the `observer` badge, but the
ruleset-free branch calls `requireNotObserver()`
(`holonovel/src/index.ts:4974-4975`), which throws for `observer`
(`holonovel/src/core/state.ts:1124-1126`). The drafted REQ-196a body therefore
claims only the `player` and `game_master` badges — what ships — and the
observer gap is recorded as a new `Scheduled-roadmap` finding (`F-5.10-2`) plus
a P1 roadmap section. Implementing observer read-only parser access is a
behaviour change with its own test matrix and is not part of a reconciliation
increment.

**Out of scope, scheduled P2: the `command` tool name.** §5.10 calls the parser
tool `command` (19 occurrences in `spec/02-requirements.md`, 16 of them in
§5.10; plus Appendix F T239/T261 rows and the Appendix W transcripts), while
the registered tool is `run_command` (`holonovel/AGENTS.md:72`; the rename is
recorded in `holonovel/DECISIONS.md:1507`). This plan keeps the section's
existing `command` label so the edited sentences stay consistent with their
siblings, and schedules the naming repair as its own `P2` roadmap item with a
trigger. It is not a badge-contract issue and folding a 30-site rename into
this increment would triple its blast radius.

**Done bar** (each item names its command or artifact)

1. `spec/02-requirements.md:3243` (REQ-196a body) states qualified badge
   gating: ruleset-bound navigation and mutation are Game Master only and a
   Player call for either returns `[ERROR] [FORBIDDEN]`; ruleset-bound Player
   read-only commands succeed; a ruleset-free Novel accepts the `player` and
   `game_master` badges. One paragraph, ≤800 characters, ≤8 sentences (current:
   331 characters, 3 sentences; draft: 782 content characters / 783
   newline-inclusive, 6 sentences), ending
   `_Check:_ T239, T643.` The draft (wrapped here; shipped as one physical
   line):

   ```text
   THE parser command system SHALL accept natural-language text and resolve it
   against the world model's current state. The `command` tool is an
   AI-narrator resolution engine that the narrator calls internally when the
   player describes spatial actions. On a ruleset-bound Novel navigation and
   mutation SHALL be Game Master only: a Player-badge call for either returns
   `[ERROR] [FORBIDDEN]`, while the read-only commands of REQ-309h (`look`,
   `examine`/`search`, `inventory`) SHALL succeed. On a ruleset-free Novel the
   parser SHALL accept the `player` and `game_master` badges. *Acceptance
   criterion:* a Player-badge `go north` on a ruleset-bound Novel returns
   `[FORBIDDEN]` while `look` succeeds, and a Player on a ruleset-free Novel
   resolves `look` and `go north`. _Check:_ T239, T643.
   ```

   Verified by `npm run validate:sdd` (0 errors) and
   `sed -n 3243p spec/02-requirements.md | wc -m` (newline-inclusive count
   ≤800; the same convention measures the current body at 332).

2. `spec/02-requirements.md:3249` (REQ-196c body) qualifies its
   unrecognized-command sentence with the ruleset-bound Player badge gate
   (REQ-309b) and keeps the nearest-verb refusal for every other caller. One
   paragraph, ≤800 characters, ≤8 sentences (draft: 530 content characters /
   531 newline-inclusive, 5 sentences). The draft, exactly as shipped (one
   physical line; wrapped here):

   ```text
   Object interaction SHALL respect portability and containment. Taking a fixed
   object returns a rule-violation, and taking an object inside a closed
   container returns a rule-violation. An unrecognized command SHALL return a
   not-implemented result naming the command verb and the three
   nearest-matching valid commands from the parser catalog, ordered by edit
   distance; on a ruleset-bound Novel a Player-badge call is refused by the
   badge gate (REQ-309b) before parsing. The response pattern is
   `[UNIMPLEMENTED] Unknown verb '<verb>'.
   ```

   Verified by `npm run validate:sdd` (0 errors) and
   `sed -n 3249p spec/02-requirements.md | wc -m` (≤800).

3. `spec/appendices-reference.md:1697` (T239 row) no longer claims a
   ruleset-bound Player nearest-verb list; the rest of the row is unchanged
   (`test-backfill.ts:392-441` continues to pass against it; the fixture
   walkthrough it also describes remains manual under T261).
   `spec/appendices-reference.md:2061` (T643 row) states that an unrecognized
   verb under the Player badge on a ruleset-bound Novel returns `[FORBIDDEN]`
   and names no valid-command list. Exercised by the new
   `xyzzy` → `[FORBIDDEN]` assertion at
   `holonovel/scripts/test-competitive-gaps.ts:493-505`; stated as a concrete
   call, not an exit code.

4. `spec/appendices-fixtures.md:831` heading names the transcript's
   ruleset-free mode, and `:964` says `[UNIMPLEMENTED]`, not `[NOT_FOUND]`.
   Verified by the greps in §6.

5. `spec/audit/review-register.md` moves `F-P6a-19` from `## Scheduled-roadmap`
   (`:1660-1672`) into a dated group at the top of `## Resolved`, citing the
   edited predicates and the T239/T643 bindings, and adds
   `F-5.10-2 — REQ-309h observer clause unimplemented` to `## Scheduled-roadmap`
   with the `requireNotObserver` predicate and the Phase 1 probe output;
   `npm run check-registers:strict` passes.

6. `ROADMAP.md` deletes the closed section (`:15-23`) and adds two sections in
   the same slot: `## §5.10 observer badge parser access (P1)` (closes when
   REQ-309h's observer clause is implemented and asserted) and
   `## §5.10 parser tool-name drift (P2)` (closes when §5.10, Appendix F T239/
   T261, and Appendix W name `run_command` consistently); each carries one to
   three bullets and a `**Trigger:**` line; `npm run check-roadmap` passes.

7. `spec/audit/req-coverage.md` is refreshed by
   `npm run validate -- --write-register`; the REQ-196 row carries T239, T261,
   T313, and T643 (T239/T643 from the edited `_Check:`, T261/T313 from the
   existing Appendix F rows); the coverage freshness check inside
   `npm run validate` passes.

8. `npm run assemble && npm run check:fast` exit 0 un-piped with the trailing
   `check:fast: PASS` line; `npm run validate:sdd` reports 0 errors.

9. `CHANGELOG.md` gains a new first entry
   `## 2026-11-11 — §5.10 REQ-196a Player-badge clause reconciliation` naming
   REQ-196a, REQ-196c, T239, T643, the Appendix W.4 correction, and the two
   scheduled items.

10. The increment directory holds `plan.md`, `tasks.md`, `aar.md`, and
    `independent-review.md`; `aar.md` records the Phase 0 baseline, the Phase 1
    probe body and exact output for all three badge configurations,
    `deployed: not applicable — no publication in scope`, and ends
    `LOOP PAUSED`; `npm run check-loop-artifacts` passes.

11. The increment lands as one commit via `npm run session:close` and
    `git status --porcelain` is empty afterwards.

## 2. Evidence (repo, verified this session)

- `spec/02-requirements.md:3243` — REQ-196a's closing sentence: "The tool is
  Game Master only; Player badge calls return `[ERROR] [FORBIDDEN]`."
- `spec/02-requirements.md:3415` — REQ-309b: ruleset-bound Player never sees
  navigation or mutation verb names; ruleset-free Player MAY call `command`.
- `spec/02-requirements.md:3432-3434` — REQ-309h: ruleset-bound Player MAY
  issue the read-only perception commands `look`, `examine`/`search`,
  `inventory` and their aliases; ruleset-free accepts player, game_master,
  observer. `_Check:_ T353, T643.`
- `holonovel/src/index.ts:4967-4971` — the gate: `playerReadOnly` is true when
  the Novel is ruleset-bound and the badge is player; a verb outside
  `PLAYER_READONLY_VERBS` returns `FORBIDDEN` before dispatch.
- `holonovel/src/index.ts:353-355` — `PLAYER_READONLY_VERBS` =
  `look, examine, x, search, inventory, i`.
- `holonovel/src/index.ts:5072` — `allowedVerbs` is set only for
  `playerReadOnly`; `holonovel/src/world/parser.ts:124-140` filters the
  nearest-verb list through it. Unreachable for an unknown verb under the
  Player badge because the gate (`:4968-4971`) refuses first.
- `spec/02-requirements.md:3249` — REQ-196c's unconditional unrecognized-
  command sentence, the normative root of the T239 clause.
- `holonovel/src/index.ts:4974-4975` and `holonovel/src/core/state.ts:1124-1126`
  — the ruleset-free branch calls `requireNotObserver()`, which throws for the
  `observer` badge; REQ-309h's observer clause (`spec/02-requirements.md:3433`)
  is therefore unimplemented (scheduled as F-5.10-2).
- `spec/appendices-reference.md:1697` — T239 row, including the Player
  ruleset-bound nearest-verb clause.
- `spec/appendices-reference.md:2061` — T643 row: ruleset-bound Player `look`
  and `i` succeed, `go north` returns `[FORBIDDEN]`.
- `holonovel/scripts/test-backfill.ts:375-390` — a ruleset-free Player case
  asserting `look` and `go north` resolve; the T239 test (`:392-441`) runs under
  the Game Master badge only.
- `holonovel/scripts/test-competitive-gaps.ts:493-505` — T643's ruleset-bound
  Player case (setup at `:483-492`: seed package `percept`,
  `manage_ruleset (action: bind)`, room, character; badge set `:494`, reset
  `:503`; `look`/`i` pass, `status`/`go north` refused).
- `holonovel/scripts/test-world-provider.ts:83-92` — T245 unit-asserts
  `nearestVerbs("xyzzy", READONLY_VERBS, 3)` returns only read-only verbs.
- `spec/appendices-fixtures.md:778-783` — Appendix W is "for ruleset-free
  Holonovel builds"; `:831` is the `# World-model parser commands under Player
  badge` heading; `:835-866` are the Player-badge command calls.
- `spec/appendices-fixtures.md:963-964` — W.4 claims the transcript asserts
  "unrecognized commands return `[NOT_FOUND]`"; W.3 `:865-866` returns
  `[UNIMPLEMENTED]`.
- `scripts/lib/contract-fingerprint.ts:27,37` — the fingerprint sections are
  §5.16, §5.17, §6.3, §6.4.2 and the data-format set; §5.10, Appendix F, and
  Appendix W are not fingerprinted, so no fingerprint regeneration is implied.
- `scripts/lib/gate-manifest.ts:147-151` — `check-registers` runs report-only
  in `check:fast` and `--strict` in `check`; the resolved-register edit must
  satisfy both.
- `holonovel/DECISIONS.md:1507` — the 2026-09-03 rename: "the parser became
  `run_command`"; `holonovel/AGENTS.md:72` lists the registered tool surface.
- **Sibling-contract check (grep this session).** Every REQ binding the same
  action was read: REQ-323a/323b (`run_command (action: resolve)` — GM/Observer
  only, Player refused; unchanged and consistent with the new clause),
  REQ-196c (the unconditional unrecognized-command sentence; qualified in
  this increment), REQ-197a-197d (room description modes; no badge clause),
  REQ-309b/309h (badge gating; the authority adopted here), REQ-309c/309d
  (help placement; no badge clause), REQ-323a/323b (resolve action; unchanged).
  After this increment no sibling retains the absolute Player refusal.
- `spec/audit/review-register.md:1660-1672` — the `## Scheduled-roadmap`
  heading and `F-P6a-19`; `docs/plans/2026-11-11-pattern-buffer-refusal-reconciliation/plan.md`
  records the scheduling decision and the alternative it declined.
- Baseline this session: `npm run check:fast` → 40 passed, 0 failed,
  `check:fast: PASS`; `npm --prefix holonovel run test:competitive-gaps` →
  30 passed, 0 failed; `npm --prefix holonovel run test:backfill` → 104 passed,
  0 failed; `git status --porcelain` empty.
- Count this plan relies on: `grep -c "command(\|command\"" spec/02-requirements.md`
  → 19, of which 16 fall in §5.10 (`awk`-filtered `3190 < line < 3460`); the
  out-of-scope naming item names both numbers.

## 3. Blast radius

Sizes: S = a few lines; M = a section; gen = written by a tool.

| Path | Change | Size |
|---|---|---|
| `spec/02-requirements.md` | REQ-196a body: qualified badge gating, `_Check:` cites T239/T643; REQ-196c unrecognized-command sentence qualified | S |
| `spec/appendices-reference.md` | T239 row clause; T643 row refusal clause | S |
| `spec/appendices-fixtures.md` | W.3 heading parenthetical; W.4 `[NOT_FOUND]` → `[UNIMPLEMENTED]` | S |
| `holonovel/scripts/test-competitive-gaps.ts` | T643 case: unknown-verb `FORBIDDEN` assertion | S |
| `spec/audit/review-register.md` | `F-P6a-19` moved to `## Resolved`; `F-5.10-2` added to `## Scheduled-roadmap` | S |
| `spec/audit/req-coverage.md` | regenerated by `npm run validate -- --write-register` | gen |
| `ROADMAP.md` | delete the closed section; add the P1 observer section and the P2 naming-repair section | S |
| `CHANGELOG.md` | new dated first entry | S |
| `docs/plans/2026-11-11-5-10-req-196a-player-badge-clause/` | `plan.md`, `tasks.md`, `aar.md`, `independent-review.md` | S |
| `holonovel.md`, `holonovel/holonovel.md` | generated by `npm run assemble` (not hand-edited) | gen |
| `spec/build-phase-map.md` | content-hash line rewritten by `npm run assemble` (REQ-278) | gen |

No server source change. No gate, manifest, tool-surface, or fingerprint
change. No external state, credentials, network, or publication step in scope.

## 4. Steps (dependency order)

**Phase 0 — baseline and predicate confirmation.** Create the increment
directory with `plan.md`, `tasks.md`, and an `aar.md` skeleton carrying the
baseline already measured (check:fast 40/40; T643 suite 30/30; T239 suite
104/104). Re-grep the six edited locations (`spec/02-requirements.md:3243`,
`:3249`, `spec/appendices-reference.md:1697`, `:2061`,
`spec/appendices-fixtures.md:831`, `:963-964`) to confirm line numbers and that no
other surface states the absolute claim. Record that `F-P6a-19` is the only
`Scheduled-roadmap` row for this section and that no row covers the observer
clause.

**Phase 1 — capture the shipped refusal text (probe, trust boundary:
tool-output).** Write a throwaway tsx probe under `/tmp/opencode` (not
committed; its body and output are copied into `aar.md`). It boots the engine
twice:
1. Ruleset-free: create a Novel, `manage_world (action: convert)` with the
   Appendix K fixture text (`holonovel/scripts/run_pattern_buffer.ts`, the
   `APPENDIX_K_FIXTURE` constant), create and activate a character, set the
   `player` badge, call `run_command { action: "execute", command: "xyzzy" }`,
   and record the result (expected `[ERROR] [UNIMPLEMENTED]` with a
   nearest-verb list).
2. Ruleset-bound: follow `test-competitive-gaps.ts:493-505` (seed package,
   `manage_ruleset (action: bind)`, room, character, `player` badge), call the
   same `xyzzy` command, and record the result (expected
   `[ERROR] [FORBIDDEN]` naming only read-only perception verbs).
3. Ruleset-free, `observer` badge: call the same `xyzzy` (or `look`) command
   and record the result (expected `[FORBIDDEN]` per
   `holonovel/src/index.ts:4974-4975`; this is the F-5.10-2 predicate).
Stop and report if the ruleset-bound result is anything other than
`FORBIDDEN`, or if the observer call succeeds — either outcome changes a
contract this plan writes; the probe, not the plan, is authoritative.

**Phase 2 — align the normative and catalogue surfaces.**
1. `spec/02-requirements.md:3243`: replace the closing sentence with the
   qualified gating captured in the done bar, and append `_Check:_ T239,
   T643.` Keep the paragraph one block, under 800 characters, with no table,
   bullet, or step list.
2. `spec/appendices-reference.md:1697`: delete the T239 clause requiring a
   Player-badge nearest-verb list on a ruleset-bound Novel; keep the T239 row's
   Game Master assertions unchanged.
3. `spec/appendices-reference.md:2061`: append to the T643 row that an
   unrecognized verb (`xyzzy`) returns `[FORBIDDEN]` and names no navigation or
   mutation verb.
4. `spec/appendices-fixtures.md:831`: add "(ruleset-free Novel)" to the Player
   badge heading so the transcript's `go`/`take` calls are unambiguously legal
   under REQ-309b.
5. `spec/appendices-fixtures.md:964`: replace `` `[NOT_FOUND]` `` with
   `` `[UNIMPLEMENTED]` ``, matching W.3 `:865` and REQ-196c.
6. `spec/02-requirements.md:3249`: replace the body with the REQ-196c draft
   pinned in done bar 2 (the exact text §6 greps for). Keep it one paragraph,
   under 800 characters, with no table, bullet, or step list.

**Phase 3 — exercise the rewritten T643 clause.** In
`holonovel/scripts/test-competitive-gaps.ts:493-505`, inside the existing
`player` badge window, add one call with `command: "xyzzy"` asserting
`[FORBIDDEN]` and asserting the response contains no `Valid commands include:`
list; keep the existing `look`, `i`, `status`, and `go north` assertions
untouched. Record the harness output in `aar.md`.

**Phase 4 — bookkeeping.** Move `F-P6a-19` into a dated `## Resolved` group
citing the edited lines and the T239/T643 bindings; add `F-5.10-2` to
`## Scheduled-roadmap` with the `requireNotObserver` predicate and the Phase 1
observer output; delete the roadmap section; add the P1 observer section and the
P2 `command`→`run_command` section; add the CHANGELOG entry; regenerate the
coverage register; complete `tasks.md` and `aar.md`.

**Phase 5 — verify.** Run every check in §6 in order, then
`npm run session:close` for the single commit.

## 5. Edge cases and rollback

- **Probe returns `[UNIMPLEMENTED]` for the ruleset-bound Player case.** The
  gate's precedence changed; stop before editing, record the output in
  `aar.md` against `F-P6a-19`, and escalate. Do not write a spec contract that
  the server does not implement.
- **Probe shows the ruleset-free `observer` call succeeding.** Then REQ-309h's
  observer clause is implemented and F-5.10-2 is not raised; record the output
  in `aar.md` and drop the P1 roadmap section. The problem may instead be a
  stale `requireNotObserver` call site — report rather than edit.
- **REQ-196c body exceeds 800 characters or 8 sentences.** Drop the
  parenthetical REQ-309b citation to `(REQ-309b)` and keep the gate clause.
- **Probe cannot boot (data-dir or seed failure).** Stop and report; do not
  compose the clause from the code reading alone.
- **REQ-196a body exceeds 800 characters or 8 sentences after the edit.**
  Shorten the acceptance criterion first; the normative gating sentence is the
  part that must stay.
- **`check-registers:strict` reports the moved finding.** Confirm the
  `Resolved` group heading is a dated `###` heading and the entry keeps the
  `**F-P6a-19 — ... (resolved <date>):**` shape.
- **`check-markers` reports README drift.** Run `npm run refresh-properties`
  and include the regenerated markers in the same commit.
- **`check-fingerprint-sync` fails.** Unexpected: no fingerprinted section is
  edited (`scripts/lib/contract-fingerprint.ts:27,37`). Run
  `npm run build-order` and record the diff rather than hand-editing the
  generated module.
- **A second `[NOT_FOUND]` parser reference appears in Phase 0.** Add it only
  if it names the same refusal contract; otherwise record it as a roadmap item.
- **Rollback.** `git revert` of the single commit restores the REQ body, both
  catalogue rows, the appendix lines, the T643 assertion, the register,
  roadmap, and changelog. No data, schema, or publication state is involved.
- **Publication is out of scope.** The plan stops at the local commit; a later
  explicit "push" runs `push-pipeline.sh` and writes the spec-update record.

## 6. Verification summary

| Check | Command | Expected |
|---|---|---|
| Parser catalogue harness | `npm --prefix holonovel run test:backfill` | 104 passed, 0 failed |
| Player access harness | `npm --prefix holonovel run test:competitive-gaps` | 30 passed, 0 failed (T643 gains one assertion inside its existing test) |
| Vocabulary breadth | `npm --prefix holonovel run test:world-provider` | 7 passed, 0 failed |
| REQ-196a character count | `sed -n 3243p spec/02-requirements.md \| wc -c` (body line measured before and after) | ≤800 |
| REQ-196a sentences | `npm run validate:sdd` (sentence limit is a validate rule) | 0 errors |
| REQ-196c character count | `sed -n 3249p spec/02-requirements.md \| wc -m` | ≤800 |
| REQ-196c qualification | `grep -c "refused by the badge gate (REQ-309b)" spec/02-requirements.md` | 1 |
| Appendix W.4 | `grep -c "\[NOT_FOUND\]" spec/appendices-fixtures.md` | 0 |
| Appendix W.4 positive | `grep -c "commands return \`\[UNIMPLEMENTED\]\`" spec/appendices-fixtures.md` | 1 |
| Appendix W.3 heading | `grep -c "under Player badge (ruleset-free Novel)" spec/appendices-fixtures.md` | 1 |
| Assemble + gates | `npm run assemble && npm run check:fast` | `check:fast: PASS` |
| Strict validation | `npm run validate:sdd` | 0 errors |
| Coverage register freshness | `npm run validate` (register check runs unconditionally) | 0 errors |
| Observer probe recorded | `grep -c "observer.*FORBIDDEN" docs/plans/2026-11-11-5-10-req-196a-player-badge-clause/aar.md` | ≥1 |
| Roadmap admission | `npm run check-roadmap` | pass |
| Register hygiene | `npm run check-registers:strict` | pass |
| Increment artifacts | `npm run check-loop-artifacts` | pass |
| Commit | `npm run session:close` | one commit, clean tree |

Unverified by design: `test:all` full green (pre-existing holosuite anchor
failures, scheduled P2 under "Holosuite anchor repoint automation"); its
pre-change result is recorded in `aar.md` and compared after the edit rather
than claimed green.

## 7. Open questions

None. The one design decision (which surface is authoritative) is answered in
§1 by the four-surface evidence and the alternative record.
