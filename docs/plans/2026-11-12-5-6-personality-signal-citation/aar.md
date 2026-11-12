# After-action report — §5.6 personality, signal, and citation remediation

Status: complete · 2026-11-12 · Plan: `plan.md` · Tasks: `tasks.md`
Plan artifact sha256 `91b7d6ca…` · review independence: fresh (cold pass + diff
re-review, standard depth)

## Outcome against the done bar

- F-P3B2-9 through F-P3B2-14 are `Resolved` in
  `spec/audit/review-register.md` with current predicates; the one
  unreachable citation is split into F-P3B2-15 and scheduled.
- The *§5.6 personality, signal, and citation remediation (P1)* section is
  removed from `ROADMAP.md`; **REQ-124 NPC damage resolution (P1)** was added
  in its place and the register carries the matching `Scheduled-roadmap` row.
- Every new assertion was observed red before implementation (transcripts
  below); the six suites pass; `check:fast` and `build-order` are green.
- No new tool and no new action; the new fields ride the existing NPC,
  Voice Examples, and Session surfaces, so §7.7 needed no edit and
  `check-fingerprint-sync` stayed green.
- `LOOP PAUSED`: no new P0/P1 beyond the scheduled REQ-124 item; the P3 notes
  below are recorded in place.

## Baseline and final evidence

| Gate | Baseline | Final |
|---|---|---|
| `npm run check:fast` | 41 passed, 0 failed | PASS (41 gates) |
| `test:output-contracts` | 450 passed, 0 failed | 472 passed, 0 failed |
| `test:backfill` | 109 passed, 0 failed | 110 passed, 0 failed |
| `test:narrative` | 81 passed, 0 failed | 83 passed, 0 failed |
| `test:briefing` | 18 passed, 0 failed | 25 passed, 0 failed |
| `test:persistence` | 48 passed, 0 failed | 49 passed, 0 failed |
| `test:persistence-guardrails` | 24 passed, 0 failed | 24 passed, 0 failed |
| root `typecheck` / server `tsc` | clean | clean |
| `npm run build-order` | — | green (full `check`) |

## Red-green transcript

Observed red before implementation:

- `test:briefing`: `no personality group` (T140), `NPC marker absent` (T140),
  `signal age absent` (T142), `directive missing role or name` (T332).
- `test:output-contracts`: `expected to contain "### Personality"` (T201),
  `expected to contain "character_01"` / `"Drawl"` / `"patient, formal"` /
  `"Well met, traveller."` (T58/T65/T167), `synthesis source tag` absent,
  `Player NPC personality write refused` absent (T129), `T132 expected marker +
  2 entries, got 2`.
- `test:narrative`: `scene history` shape (T112, adjusted — see deviations),
  `expected to contain "Talkativeness order"` (T723, role env missing).
- `test:backfill`: `expected to contain "Grit", got {"error":"no active novel"}`
  (T56, restart needed an explicit resume).
- `test:persistence`: `expected to contain "tone: darker (set this
  connection)"` (T211, counter/storage).

Observed green after implementation (final counts above).

## Deviations and decisions

1. **Suite names carry a colon.** The plan wrote `test-output-contracts`; the
   package scripts are `test:output-contracts`, and the run used the real names.
2. **`connection_counter` did not advance.** REQ-173a says the counter advances
   per server start/connection, but the implementation only advanced it for
   workflow-staleness accounting. `StateManager.countConnection` now increments
   once per Novel per process on `resumeNovel` (both load paths) and
   `activateHydratedNovel`; a pending workflow keeps its existing staleness
   increment instead. This was required for any observable age.
3. **T112's history semantics.** `scene_history` records the *outgoing* scene
   on a change, so two sets expose only the first scene; the assertion now uses
   three sets and checks chronological prior scenes plus the current scene.
4. **T132's cap count.** The first `set` does not create a history entry; four
   descriptions produce three entries, so the suppressed count is 1.
5. **T358/T389b assertions.** NPC `goals` now render in the personality group
   (REQ-166b), so "Steal the crown" is legitimately present; both tests now
   assert the World in Motion pursuit line (`pursues "…" off-screen`) instead.
6. **T211/T313/T314's prefix.** The test expected `[OK] Signal recorded`; the
   REQ-069c prefix is `Signal '<signal>' recorded.` and the assertion follows it.
7. **T56/T211 restart.** A restarted process has no active Novel until
   `manage_novel (action: resume)`; both tests now resume explicitly.
8. **T723's role.** The narrate prompt's talkativeness order renders for the
   Game Master role, so the test boots with `TTRPG_AI_ROLE=game_master`.
9. **NPC personality writes are GM-only.** REQ-122b/T129 require the Player
   write refusal; the handler now gates NPC personality/voice writes, which the
   finding's resource/scope work depended on.
10. **`persona` renders per REQ-077d.** The Phase 1 declaration probe found the
    group table group-granular and no validator field-enumeration check; the
    broader "the fields" reading governs, so `persona` renders on the group,
    both resources, and the sheet (D1b).
11. **The voice-feedback path can still append a sixth example.** The cap is
    enforced on the explicit `voice` setter and import paths; the
    `voice_feedback` append uses its own session limit and the render helper
    caps at five. Recorded as a P3 coverage note, not a demonstrated failure.
12. **REQ-124 is scheduled, not re-pointed.** No reachable NPC damage surface
    exists; T131's false token is removed and REQ-124a/b is a new P1 roadmap
    item with a `Scheduled-roadmap` register row.

## Registers, roadmap, and generated surfaces

- `spec/audit/review-register.md`: F-P3B2-9…14 resolved with current
  predicates; F-P3B2-15 added under `Scheduled-roadmap`; the retired roadmap
  reference updated.
- `ROADMAP.md`: personality/signal/citation section removed; REQ-124 item
  added; `## Non-goals` untouched.
- `spec/audit/req-coverage.md` regenerated (0 errors; buckets A/B/D unchanged,
  C 490, E 118).
- `holonovel/tool-definitions.json`, `spec/audit/tool-surface-baseline.json`,
  and the DECISIONS budgets (full 28,873; standard 25,274; small 1,180)
  regenerated; `surface-budget` passes.
- `CHANGELOG.md` gained the dated increment heading; `session:close` derives
  the commit subject from it.

## P3 notes

- **REQ-069b's pace-window adjustment** remains unimplemented: `pacingWindow()`
  reads only the environment and never consults the `pace` signal. Outside this
  finding's storage/briefing predicate and not a demonstrated failure in the
  harnesses.
- **`detail` signals share the compound storage** (REQ-197c calls it a signal);
  the briefing now lists it with an age like the other signals, which is
  consistent with REQ-128's "each recorded signal" wording.
- **The stale first `ROADMAP.md` section** (§5.6 entity, scene, and NPC-depth)
  is also complete by its own trigger but was left untouched because removing
  it was not in this plan's blast radius.

LOOP PAUSED
