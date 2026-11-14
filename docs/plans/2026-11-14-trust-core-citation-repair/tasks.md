# Tasks — trust-core contract and citation repair

Plan: `plan.md` (stamped artifact
`2026-11-14T20-15-21-926Z-fe3be0e9.md`, sha256 `fe3be0e9…4bffc`).

## Step-to-evidence table

| # | Step | Files | Command | Result |
|---|---|---|---|---|
| 0 | Baseline | — | `npm run status`, `npm run check:fast`, `npm run check-registers` | 83 unpushed, clean; `41 passed, 0 failed` / `check:fast: PASS`; registers PASS |
| 1 | Scaffold | `docs/plans/…/{plan,tasks}.md` | `mkdir` + copy | created |
| 2 | T109 group probe | — | `npx tsx /tmp/opencode/probe-phase1*.ts` | 23 headings; map recorded below |
| 3 | T44 probe | — | same | Player refusal names `set_badge`; Editor allows |
| 4 | T336 probe | — | same | all three markers confirmed |
| 5 | T461 probe | `test-output-contracts.ts:213` | read | boundary-directive test located |
| 6 | Damage/pause probe | — | same | choices→`respond_decision` round-trip works; `register` rejected by the enum (`-32602`) |
| 7 | Safety ladder | `holonovel/src/index.ts` | `npm --prefix holonovel run test:backfill` | 119 passed, 0 failed |
| 8 | Register | `holonovel/src/index.ts` | `test:output-contracts` (T461 ext.) | 540 passed, 0 failed |
| 9 | Pause directive | `holonovel/src/index.ts` | `test:backfill` (T350) | directive present at `mechanical_prompt`, absent at `full` |
| 10 | DECISIONS records | `holonovel/DECISIONS.md` | read-back | ladder, session register, pause reading recorded |
| 11 | T44 assertion | `test-output-contracts.ts` | `test:output-contracts` | 540 passed |
| 12 | T109/T336 assertions | `test-briefing.ts` | `test:briefing` | 27 passed, 0 failed |
| 13 | T350 assertion | `test-backfill.ts` | `test:backfill` | 119 passed |
| 14 | T461 extension | `test-output-contracts.ts` | `test:output-contracts` | 540 passed |
| 15 | Appendix F rows + registers + roadmap + coverage | spec files | `validate -- --write-register`; `check-registers`; `check-roadmap` | 0 errors, 286 warnings; both PASS |
| 16 | Regeneration + gates | generated artifacts | `check-tool-definitions-sync`; `surface-budget`; `surface-replay`; `assemble`; `test:all` | in sync; budgets 29,817/25,830; replay PASS; assembled; test:all 56 passed, 0 failed |
| 17 | CHANGELOG + AAR + close | `CHANGELOG.md`, `aar.md` | `npm run session:close` | CHANGELOG entry + AAR written (LOOP PAUSED); close pending |
| 18 | Baseline fix (unplanned) | `holonovel/scripts/lib/holosuite-*.ts` | `test:holosuite-{conformance,invariants,adversarial,novel}` | 16 stale anchors repointed (stale at HEAD); 45/25/26/100 passed, 0 failed |

## Phase 1 map — REQ-109 groups to rendered anchors (populated GM Novel)

Rendered `###` headings in order (probe, ruleset-free Novel with an adventure
loaded): Play loop, Party, Combat, NPCs (depth), Available Actions
(available_actions), Turn handoff, Badge boundary, Anti-slop guidance, Narrative
tone, Player signals, Novel Setup, Point of view, Who They Are, Personality,
Autonomy, GM State, State persistence, state_ledger, Persistence tools, Story
beats, Narrative threads, Lore, Knowledge state. `## Adventure` renders as a
level-2 block when an adventure is active; the intro pointer is a trailing line,
not a heading.

Group map (REQ-109 group → anchor):
badge foundations → `### Play loop` header block; anti-slop → `### Anti-slop
guidance`; tone → `### Narrative tone`; boundary directive → `### Badge
boundary`; scene state → `**Scene:**` header line + `### GM State` /
`### Surroundings`; POV → `### Point of view`; entities → `### Party`; NPCs →
`### NPCs (depth)`; countdowns → `### Narrative threads`; lore → `### Lore`;
adventure content → `## Adventure`; registered tools → `### Available Actions`
+ `### Persistence tools`; combat → `### Combat`; identity → `### Who They Are`;
personality → `### Personality`; narrative directive → `### Narrative
directive`; player signals → `### Player signals`; setup metadata → `### Novel
Setup`; autonomy → `### Autonomy`; story journal → `### Story beats`; available
actions → `### Available Actions`; intro pointer → trailing intro line.

Non-REQ-109 sections, each owned by its own REQ (allowed in the map, not
required by REQ-109): Turn handoff (REQ-412), GM State / State persistence /
state_ledger / Persistence tools (builder navigation), Narrative threads
(REQ-281), Knowledge state (REQ-286), Play loop (REQ-412a).

## Execution amendments (deviations from the stamped plan)

- **A1 — register invalid-value contract.** The `signal` parameter is a Zod
  enum, so an out-of-enum value is refused by the SDK as `-32602` before the
  handler (probe: `Invalid option: expected one of …`). The plan's "any other
  non-empty value is `[INVALID_INPUT]`" is therefore satisfied at the schema
  layer; the handler validates only the empty-value reset and the two accepted
  values.
- **A2 — T109 ordering leg is a contract gap.** The rendered order places
  POV, Lore and Narrative threads after orientation/supplementary sections, so
  REQ-109e's "decision-critical before supplementary" does not hold today
  (probe order above). The increment asserts presence, markers, Player
  exclusion, end-combat/entity-removal/scene-clear omission, and the
  known-heading inventory; the ordering deviation is recorded as **F-S3** with
  its own ROADMAP section rather than silently dropped or silently fixed.
- **A3 — adventure content is a level-2 anchor.** `## Adventure`, not a `###`
  heading, so the T109 inventory accepts both levels.
- **A4 — no max-stat dependency.** The safety ladder keys on overkill
  (`total > hpBefore`), confirmed by probe against the ruleset-free corpus.
