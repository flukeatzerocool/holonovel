# Independent Review — §5.10 REQ-196a Player-badge clause

Reviewer: `review` agent (cold pass, `independent-review` skill, standard depth)
Plan under review: `/home/fluke/.local/state/opencode/plans/fe586f0907cda9bed04d391d454275b4a14bc3e300047c43f32dd854d4f08ed4/2026-11-11T20-21-51-295Z-522d207e.md`
Plan sha256: 789bc344d9f837d755be21ab7423e53f845f5390a9802dabd656dcc1cc0b7cf7
Plan sha256 at cold pass: 522d207e17bf2ff4d588a2c7423b1cf0119765e7a92c3b75630b097827a973aa
(The `Plan sha256` line is the amended artifact the diff re-review verified; the
second line is the version the first cold pass read.)
Independence: fresh with respect to the authoring conversation. Stages 1, 2, 3,
and 5 ran as separate lenses inside one fresh context; Stage 4 was not triggered
(no author edits during that pass). Reads: 40/40 (standard budget).

The reviewer has no write tool, so this file is the parent's transcription of
its returned report; the verdict and findings are the reviewer's.

## Verdict

`independent-review passed.` — 0 Blockers, 4 Majors, 6 Nits, then a diff
re-review with 2 new Majors on the amended lines, both fixed by the author
before build.

## Stage 2 — comprehension (faithful)

The plan reconciles a contradiction about the parser `command` tool's badge
gating. REQ-196a says the tool is Game Master only and Player calls return
`[FORBIDDEN]`; REQ-309b/REQ-309h and the shipped gate
(`holonovel/src/index.ts:4966-4971`) allow a ruleset-free Player to use the
parser and a ruleset-bound Player to issue read-only verbs. The plan makes the
shipped gate the authority.

## Pass A findings (first cold pass)

### Major

- **M1 [clarity] — the T239 row replacement was described three incompatible
  ways** (rewritten to the reachable `[FORBIDDEN]` contract / clause deleted /
  asserts the ruleset-free contract). *Fixed:* §1 now states one repair —
  delete the one clause, keep the row's remaining assertions, add the reachable
  contract to T643.
- **M2 [design] — the absolute sentence the plan exists to correct survived in
  REQ-196c** (`spec/02-requirements.md:3249`). *Fixed:* REQ-196c is qualified in
  the same increment, with a pinned draft body, a done-bar item, a Phase 2
  step, and a sibling-contract evidence line.
- **M3 [design] — the drafted body added an unprobed `observer` clause.**
  `requireNotObserver` (`holonovel/src/core/state.ts:1124-1126`) throws for
  `observer`, and the ruleset-free branch calls it
  (`holonovel/src/index.ts:4974-4975`). *Fixed:* the draft claims only `player`
  and `game_master`; the observer gap is recorded as `F-5.10-2` (P1 roadmap) and
  probed in Phase 1 with a stop condition.
- **M4 [design] — done bar 2's verification could not fail** (an exit code
  cannot show a catalogue row's prose is exercised). *Fixed:* the bar names the
  concrete `xyzzy` → `[FORBIDDEN]` assertion.

### Nits

- **N1** — citation provenance (T261/T313 come from Appendix F rows, not the
  edited `_Check:`). *Fixed in done bar 7.*
- **N2** — "gates by verb, not by badge". *Fixed: "gates the Player badge by
  verb".*
- **N3** — anchor drift (`index.ts:5071-5072`, T643 `:483-505` vs `:493-505`).
  *Fixed.*
- **N4** — character-count convention. *Fixed: content vs newline-inclusive
  stated, `wc -m` named.*
- **N5** — pattern-buffer I1 omitted from the evidence table. *Added as a fifth
  surface row.*
- **N6** — modality attribution (REQ-309b permits; REQ-309h requires). *Fixed.*

### Verified, no finding

Central claim; second defect (the nearest-verb path is unreachable under a
ruleset-bound Player because the gate refuses first); repair placement in
T643's existing Player window; REQ body limits; Appendix W claims;
fingerprint exclusion (`scripts/lib/contract-fingerprint.ts:27,37-43`);
gate names (`check-registers:strict`, `check-roadmap`, `check-loop-artifacts`,
`validate:sdd`, `session:close`); register coupling for ROADMAP + review
register.

### Unknowns recorded at that pass

`requireNotObserver` definition (settled — it refuses observer); baseline
counts not re-run (read-only pass); exact regenerated coverage row;
proofread-register disposition for rewritten prose; per-stage isolation
caveat; inherited `AGENTS.md` injection.

## Pass B findings (diff re-review, amended lines only)

Reads: 4/10. All ten earlier findings marked resolved. Two new Majors:

- **M5 [design] — the T239 coverage claim was false**: `test-backfill.ts:392-441`
  does not run the row's fixture walkthrough assertions. *Fixed:* the plan now
  says the row's remaining assertions are unchanged and names the subset the
  harness covers, leaving the walkthrough manual under T261.
- **M6 [clarity] — REQ-196c's replacement text was paraphrased** and the §6
  grep did not match the Phase 2 wording. *Fixed:* the draft body is pinned in
  done bar 2 and Phase 2 cites it, so the grep target is the shipped text.

Nits N7–N11 (single operating rule, sixth edited location, increment directory
listing, observer-probe grep, content-vs-newline count) were all applied.

## Token

```
independent-review passed.
```

Stages 4/5 · reads 40/40 (cold) + 4/10 (diff) · independence fresh · Blockers 0
