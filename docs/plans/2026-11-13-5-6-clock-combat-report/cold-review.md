# Cold review — §5.6 clock and combat-report plan

Reviewer: independent (no authoring context) · Depth: standard
Artifact: `plan.md` · sha256
`efb911c45f1b3ad1bbef6bb6005bed209731b8967395e292975637985ac426c6`
Reviewed: 2026-11-13 · Independence: fresh
Verdict: **independent-review FAILED. [plan.md] — 2 blockers**

Process notes recorded by the reviewer:

- The artifact hash was verified and the plan's own line references matched the
  tree at HEAD.
- The reviewer could not write files (read-only dispatch); the parent persisted
  this report.
- Stages 1–2 ran artifact-only; Stage 3's three critics ran as one; Stage 4 was
  N/A (no edits). The token is a failing token regardless of stage count.
- The reviewer did not read the evidence sidecar, to preserve isolation.

## Blockers

1. `[clarity]` The citation arithmetic contradicts its own sources — the plan
   said "five of the seven" and included T162, while `review-register.md`
   defines the seven as T25/T33/T110/T161, T271, T54/T139. T162 is a fifth
   REQ-043f `_Check:_` entry, not one of the seven. Proposed fix: restate the
   set once, name the register as the authority, and say "four of the seven plus
   T162".
2. `[design]` The `[AUTO]` → `[auto]` edit to `test-adventure.ts` rests on an
   unestablished statless premise: the Bone Warden fixture shows "AC 14", which
   could be imported as `stats`, in which case the marker disappears and the
   assertion fails on presence, not case. Proposed fix: state the predicate
   (adventure extraction carries name/description only) or rewrite and re-red
   the assertion.

## Majors

- M1 — REQ-043f's acceptance criterion still requires the weapon-damage branch
  the plan defers; striking T161 from `_Check:_` alone leaves the normative body
  asserting an unimplemented surface.
- M2 — `spec_health` field name: the plan's new field `combat_rounds` collides
  with the per-session counter; the metadata field is `total_combat_rounds`.
- M3 — The T139 catalogue edit asserts a decrement-to-fire case the harness
  block did not list.
- M4 — D6 is a knowing deviation from REQ-073a1's unqualified "auto-decrements",
  left uncorrected in the spec.
- M5 — The report silently changes which participant it names (today it names
  the next participant because the turn pointer already advanced).
- M6 — D8's whole-token rule applied to names but not ids, and the claimed
  "omission, not fabrication" failure mode does not hold for id substrings.
- M7 — Done-bar item 5 was a disjunction, so the bar was undecidable.
- M8 — The DECISIONS.md landing site was unnamed.
- M9 — T110 asserts a `badge_briefing` combat group that no phase implements.

## Nits

- N1 duplicate `holonovel/src/index.ts` row in the blast radius
- N2 T271's owner is REQ-073a2, not REQ-073c3 (ROADMAP.md:18 is wrong)
- N3 `combatTurnReport(...)` signature elided
- N4 T25/T33 "other REQs' behaviour" is imprecise; say "does not assert REQ-043f"
- N5 `link_countdown` wire shape and error codes unstated
- N6 a danger has no description field; state the reading
- N7 the `[AUTO]` sweep covered only `holonovel/src` and `holonovel/scripts`

## Disposition in the revised plan

| Finding | Disposition |
|---|---|
| B1 | Restated: register is authoritative; four of seven plus T162 (§1, §2) |
| B2 | Resolved by evidence: adventure extraction carries no `stats` (`core/adventure.ts:186-196`); predicate recorded in D9 and baselined in Phase 0/1 |
| M1, M7 | REQ-043f body kept; roadmap section narrows to one T161 bullet (D12, D12a); done-bar item 5 resolved |
| M2 | `total_combat_rounds` (Phase 3.3) |
| M3 | T139 decrement-to-fire case added (Phase 1.4) |
| M4 | D6 labelled a normative deviation; DECISIONS entry + AAR deviation |
| M5 | D11 states the behaviour change and pins it with a two-participant case |
| M6 | Whole-token matching extended to ids; residual recorded as C-1 |
| M8 | Exact DECISIONS heading named (Phase 4.3) |
| M9 | D14 adds the briefing combat group (REQ-043e) |
| N1–N7 | All applied |

## Re-review (targeted, changed sections only)

Verdict: `independent-review FAILED.` — one remaining blocker, introduced by the
D14 text that resolved M9. B1, B2, M1, M7 and the `combatReport` half of M9 were
confirmed resolved; the re-reviewer also confirmed `req-coverage.md:33`'s count.

- **Blocker (now fixed):** D14 claimed `composeBadgeBriefing` renders no combat
  section. `index.ts:16909` already emits `**Combat active:** Round N` inside
  that range. Fix applied: D14 states the predicate as one summary line with no
  group/redaction, and Phase 3.4 replaces that line so the round is reported
  once (T110 asserts the single occurrence).
- **Nit (fixed):** §1's T25/T33 phrasing aligned with §2 ("neither asserts the
  combat turn report").
- **Nit (fixed):** the paragraph no longer calls two different sets "seven"
  without distinguishing them.
- **Info:** `ROADMAP.md:24-27`'s Trigger still requires all seven; Phase 6.2
  rewrites it, so nothing is implied.

Re-review budget: 11 reads (one over the 10 budget, for the
`composeBadgeBriefing` boundary check). Standard depth allows one re-review; no
third cold pass was run. The procedural independence gap is carried as a
condition, not claimed as a passing token.
