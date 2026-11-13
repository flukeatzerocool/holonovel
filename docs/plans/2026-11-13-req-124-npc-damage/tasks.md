# Tasks — REQ-124 NPC damage resolution

Increment: `docs/plans/2026-11-13-req-124-npc-damage/`
Plan: `plan.md` · AAR: `aar.md`
Status: draft (plan gate pending; no task started)

## Phase 0 — baseline and probes

- [x] 0.1 Re-confirm baseline: `npm run status`, `git status --porcelain`,
      `npm run check:fast` (expect 41/41 and a trailing `check:fast: PASS`).
- [x] 0.2 Run `npm --prefix holonovel run test:all`; record per-suite results.
      Fix any red suite as its own commit before this increment.
- [x] 0.3 `grep -rn "\bT131\b\|\bT161\b" holonovel/scripts holonovel/src` —
      expect 0.
- [x] 0.4 Enumerate every complete `manage_combat` action list and routing
      table (`holonovel/src`, `holonovel/AGENTS.md`,
      `tool-surface-registry.json`, `tool-routing.json`,
      `tool-disambiguation.json`).
- [x] 0.4b Sibling-contract probe: REQ-043a–g, REQ-203–206c, REQ-221a,
      REQ-124a/b — confirm no conflicting binder.
- [x] 0.5 Probe the report predicates (`state.ts:2709-2769`,
      `index.ts:11230-11245`) and the fixture path (`test-backfill.ts:1966-1983`,
      `index.ts:7812-7830`).
- [x] 0.6 Confirm the damage action's 7 parameters are inside REQ-408's
      per-action ceiling of 8.
- [x] 0.7 Write the skeleton `aar.md` (replacing the draft placeholder).

## Phase 1 — red assertions

- [x] 1.1 Add a module-scope `seedDamageFixture`: full package envelope + model
      (monster `goblin` with ac/hp/max_hp and `incapacitation_condition: "downed"`).
- [x] 1.2 Add T131 (REQ-124a/b): ruleset-backed NPC, combat init/advance,
      damage text transparency (including `damage_type`), `npcs://` HP,
      `audit://novel`, undo and `manage_archive` checkpoint restore on separate
      NPCs, unknown-id `[NOT_FOUND]`, divergent `hp`/`current_hp` write-back,
      input-validation refusals, fixture `downed` condition, and the ruleset-free
      `incapacitated` fallback on an entity target.
- [x] 1.3 Add T161 (REQ-043f): damage before the entity's advance; report names
      participant, weapon, notation, total, HP change; no-action turn.
- [x] 1.4 Run `test:backfill`; record the failing set.

## Phase 2 — implementation

- [x] 2.1 `manage_combat` schema: `damage` action + six parameters
      (`damage_type` is free-text audit metadata); reuse the existing `seed` and
      re-scope its description to "(init/damage)".
- [x] 2.2 Tool description: action clause, `Use when:` damage, `Do NOT use
      when:` condition.
- [x] 2.3 `damage` case, validation-first: GM gate, target resolution, health
      keys (hp/current_hp/hit_points), dice/total validity; only then snapshot,
      apply the same delta to every present key, zero-health when the lowest
      key ≤ 0, condition, audit `roll_weapon_damage`, `recordMutation`, save,
      transparent result.
- [x] 2.4 Reuse the seeded dice engine; no second roller.
- [x] 2.5 `manage_condition` description points at `manage_combat (action:
      damage)`.
- [x] 2.6 `test:backfill` green (T131/T161) before any register disposition.

## Phase 3 — spec and decisions

- [x] 3.1 REQ-124a/b edits (name the action; rename the acceptance invocation);
      record before/after char and sentence counts.
- [x] 3.2 Appendix F T131/T161 wording tightened.
- [x] 3.3 `holonovel/DECISIONS.md`: dated section recording D1–D10, D12, and
      D11's registry decision. The measured re-baseline bullet is written in
      Phase 4.4; do not rewrite the 2026-10-19 baseline.
- [x] 3.4 `holonovel/AGENTS.md:73`: add `damage`.

## Phase 4 — registry, regeneration, registers

- [x] 4.1 `holonovel/tool-surface-registry.json`: `manage_combat.damage`.
- [x] 4.1b `holonovel/tool-routing.json`: `manage_combat.damage` entry in the
      `init` shape; `surface-replay --write` only if the recorded artifact drifts.
- [x] 4.2 `npm run assemble`; `generate-tool-definitions`; `surface-budget --
      --write`; `npm run build-order`.
- [x] 4.3 Add the dated re-baseline bullet with measured counts/tokens; leave
      `DECISIONS.md:736-741` byte-identical.
- [x] 4.4 `npm run validate -- --write-register`; diff every touched row:
      REQ-124 → C via T131, REQ-043f gains T161 (T131 not claimed as REQ-043).
- [x] 4.5 `review-register.md`: F-P3B2-15 and F-P3B1-9 `Resolved` with
      file:line evidence.
- [x] 4.6 `ROADMAP.md`: retire *§5.6 clock and combat-report remediation* and
      *REQ-124 NPC damage resolution*; record the closure facts in CHANGELOG.

## Phase 5 — gates, changelog, AAR

- [x] 5.1 `npm run assemble && npm run check:fast` (un-piped).
- [x] 5.2 `npm run check`.
- [x] 5.3 `npm --prefix holonovel run test:all` (expect `test:backfill` +2
      assertions); `test:backfill`.
- [x] 5.4 `CHANGELOG.md` dated entry.
- [x] 5.5 `aar.md` findings, evidence, terminal token.
- [x] 5.6 `npm run session:close`.
