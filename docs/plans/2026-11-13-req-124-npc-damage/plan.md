# Plan — REQ-124 NPC damage resolution (ROADMAP P1)

Status: revision 2 — plan gate pending (self pass and cold pass in progress)
Kind: planned · Depth: standard
Increment target: `docs/plans/2026-11-13-req-124-npc-damage/`
Rollback cost: 1 (server source, two spec files, one catalogue table, registry,
generated surfaces, registers, ROADMAP, CHANGELOG; reversible in one commit)
Evidence class: repo only (no web, no user-supplied content)

## 1. Objective

Take the top open P1 roadmap cluster and close it in dependency order. The first
section, *§5.6 clock and combat-report remediation* (`ROADMAP.md:15`), currently
holds a single bullet: T161's weapon-damage evidence (`ROADMAP.md:17-19`). That
evidence is blocked on the surface owned by the next P1, *REQ-124 NPC damage
resolution* (`ROADMAP.md:97-111`). This increment implements that surface, writes
both missing assertions (T131 and T161), and retires both roadmap sections.

The deliverable is one host-side damage-resolution action that:

1. targets an entity or a named NPC by identifier,
2. resolves a weapon-damage roll against the target's ruleset-backed health
   stat with full transparency (REQ-003, REQ-124a),
3. applies the ruleset's zero-health convention — its declared incapacitation
   condition when one exists, else the base condition,
4. is audited, undoable, and checkpoint-restorable (REQ-040a, REQ-041,
   REQ-124b), and
5. is visible to the audit-derived combat turn report (REQ-043b), which is what
   T161 asserts.

Baseline (this drafting session, before any edit):

| Fact | Value |
|---|---|
| `npm run status` | version `2026.11.13`, 72 unpushed commits, 10 open roadmap items, last publish `2026-11-09T04:30:29Z` |
| `git status --porcelain` | clean; HEAD `d9e8213` |
| `npm run check:fast` (un-piped) | 41 passed, 0 failed; trailing `check:fast: PASS` |
| `npm --prefix holonovel run test:backfill` | 115 passed, 0 failed |
| `npm run check-tool-surface` | PASS — 298 actions, ~29,217 catalog tokens |
| `test:all` | not re-run this session; Phase 0 establishes it before implementation |

## 2. Findings and predicates

Every row cites the predicate the finding rests on, not a gate message.

| Finding | Current predicate | Contract | Disposition |
|---|---|---|---|
| F-P3B2-15 — no damage surface | No `roll_weapon_damage` handler exists anywhere in `holonovel/src`; ruleset-derived tools are declared non-mutating (`index.ts:2405-2411`); `manage_combat` actions are only init/advance/end/add_participant/remove_participant/status (`index.ts:6877`). | REQ-124a/b | **Resolve here** |
| F-P3B1-9 — T161 has no harness | `grep -rn "\bT131\b\|\bT161\b" holonovel/scripts holonovel/src` returns 0 matches. Catalogue rows exist at `appendices-reference.md:1628` (T131, REQ-124/REQ-043/REQ-003) and `:1659` (T161, REQ-043). | REQ-043f | **Resolve here** |
| Report cannot see damage | `combatTurnEntries` matches whole-token participant ids in the audit slice (`state.ts:2720-2731`); `combatTurnReport` prints `Rolls:`/`State changes:` from those entries (`state.ts:2735-2768`). No damage entry exists to match. | REQ-043b | **Resolve here** |
| No ruleset-backed NPC fixture in the harness | The shared fixture model (`holonovel/testdata/rulesets/fixture/model.json`) has character creation only; `manage_npc (action: create, ruleset_reference)` copies `model.monsters`/`npcs`/`concepts` entries into `npc.stats` (`index.ts:7812-7830`). `test-backfill` already seeds ad-hoc packages on disk (`test-backfill.ts:1985-1986`). | REQ-119, REQ-124a | **Seed locally, do not change the shared fixture** (D8) |
| Surface counts are stale in prose | `holonovel/DECISIONS.md:736-741` says 36 tools / 229 canonical actions; `spec/audit/tool-surface-baseline.json` records 37 tools / 244 canonical actions / 298 total actions (244 canonical + 54 compatibility), the same 298 that `check-tool-surface` prints. | REQ-571, REQ-567 | **Correct to the regenerated values** (D11); do not propagate either stale number |
| REQ-124 is bucket E | `spec/audit/req-coverage.md:107` — "intended gap", exempt from strict. | REQ-124 | **Promote to C** after T131 exercises it |

## 3. Decisions

**D1 — The surface is `manage_combat (action: damage)`, not a package tool.**
Ruleset-derived tools are contractually read-only/generation (`index.ts:2405-2411`;
REQ-430/REQ-450 annotations; `DECISIONS.md:1602`), so applying a host mutation as
a consequence of a package roll would require inferring mutation from a tool
name and breaking that declaration. A standalone `roll_weapon_damage` tool would
also be the 38th tool, consuming all but ~77 tokens of the 677-token
standard-projection headroom (`baseline.json` measurements 25,619 vs budget
26,296). One new action on the tool that already owns combat state, audit, and
undo is the cheapest honest surface. *Alternative rejected:* a new host tool —
it consumes the headroom and adds a second owner for combat state.

**D2 — Parameters and transparency.** Six parameters are added to the
`manage_combat` schema: `target_id` and `attacker_id` (required for damage),
`weapon`, `dice`, `amount`, `damage_type`. `seed` already exists
(`index.ts:6880`) and is reused, with its description re-scoped from "(init)" to
"(init/damage)". REQ-408 evaluates the ceiling **per action**, and the damage
action's six additions plus the shared `seed` sit inside the recorded ceiling of
8 (`DECISIONS.md:2194`). The shared MCP schema carries one optional-parameter
object for every action, so `target_id`/`attacker_id` requiredness is enforced
handler-side (per action) with `[INVALID_INPUT]` naming the missing parameter;
`inputSchema.required` cannot express it without breaking
init/advance/end/status. `dice` is a pure dice notation (`1d8`, `2d6`) resolved
by the existing dice engine; a notation carrying an inline `+`/`-` modifier is
refused and the caller passes that modifier as `amount` instead. `amount` is a
non-negative integer modifier (`total = diceTotal + amount`; with `dice` omitted,
`total = amount`). `damage_type` is free-text audit metadata: it is echoed in the
result and recorded in the audit entry, never validated against a ruleset
vocabulary and never persisted on the target. At least one of `dice`/`amount` is required, and `total` must
be at least 1: a missing operand, a negative `amount`, or a zero total returns
`[INVALID_INPUT]` and mutates nothing. `weapon` and `dice` are optional: the
result and audit entry name only the operands present, so an amount-only call
reports "flat N" with no notation clause and an unnamed call reports "unarmed".
The result text names the weapon (when given), the notation and individual dice
(when given), the modifier, the total, and `HP before → after` (REQ-003). `seed`
is a string and gives deterministic tests.

**D3 — Health stat and write-back.** The target's health stat is the first
numeric value among `hp`, `current_hp`, and `hit_points`, the precedence
`entityHp` already uses (`index.ts:4674-4682`). Every one of those keys present
and numeric on the target is reduced by the same damage total and clamped at 0,
so a divergent sibling (for example `hp: 10` and `current_hp: 4`) loses the same
amount and is never raised; the precedence-first key supplies the reported
`HP before → after`. A target with none of them returns
`[ERROR] [INVALID_INPUT]` naming the target and the corrective action (bind a
package with a stat block via `ruleset_reference`, or set the stat through the
owning tool). Damage cannot heal. The audit entry records the pre-clamp
arithmetic and the updated key list. The
contract's "wounds or loss-of-effectiveness" clause is satisfied by the
key-agnostic write-back; a non-numeric health stat (a wound ladder, a condition
track) is out of scope this increment and recorded as a condition (D12).

**D4 — Zero-health convention.** Zero health fires when the lowest present
numeric health key is at or below 0 (every present key loses the same delta, so
divergent siblings cannot mask a downed target). At that point the host applies
the condition
named by the installed model's optional `incapacitation_condition` key when it
is a non-empty string, else the base condition `incapacitated`
(`index.ts:8627`). That key is advisory model data consumed only here; the model
contract (`check-ruleset-model`, REQ-559) iterates known collections and tool
references (`scripts/check-ruleset-model.ts:118-150`) and has no unknown-key
branch, so no package-format change and no fingerprint advance. The condition is written directly to the target's existing
`conditions`/`condition_rounds` surfaces, not through `manage_condition`'s
catalogue validation, because the host is applying the ruleset's own convention
rather than a caller-chosen condition. An already-present condition is not
duplicated. The condition name feeds the entity's condition list; the recap
status vocabulary is a separate surface and is unchanged — `recapEntityStatus`
derives `incapacitated`/`unconscious`/`dead` from HP and `death_condition`
(`index.ts:11222-11227`), so a `downed` condition reports status `incapacitated`
until a ruleset declares a death condition. T131 pins both surfaces. *Alternatives
rejected:* reusing `death_condition` — it is recap's death marker
(`index.ts:11208-11218`), so applying it at zero would make every knockdown
report "dead"; a required new model field — a package-format change for one
convention branch.

**D5 — The audit entry is named `roll_weapon_damage`.** Audit entries carry
domain operation names (`apply_condition`, `advance_combat`, `create_npc`), not
tool names. Naming the entry `roll_weapon_damage` (a) makes it a significant roll
under `isSignificantRollTool`'s `roll` predicate (`index.ts:11232-11234`) and
(b) makes `combatTurnReport` classify it as both a roll and a state change
(`state.ts:2760-2767`) with no report change. Args:
`{attacker, target_id, weapon?, dice?, amount, total, hp_before, hp_after,
updated_keys, damage_type?, condition?}` — the input parameter is `attacker_id`,
but the audit
entry maps it to `attacker`, the key `recapRollDetail` reads
(`index.ts:11239-11245`). The roll therefore appears in recap attributed to the
attacker, not the victim, with no new code; `target_id` is likewise read by that
fallback chain. After D10's spec edit no tool bears the name
`roll_weapon_damage`; the string names the audit operation, which is what
`isSignificantRollTool` and `combatTurnReport` receive. The mutation also calls
`state.recordMutation(novel, "roll_weapon_damage", targetIsNpc ? "npc" : "entity")`
(`state.ts:2347-2361`), which makes it undoable and drains any pending
uncommitted-roll marker (REQ-404).

**D6 — Combat is not required; the GM badge is.** Damage is a mechanical
consequence, not a combat-lifecycle step: requiring `combat_active` would make
REQ-124 unusable outside an encounter, while T131 only needs the combat path.
The action therefore resolves with or without an active encounter and
participates in the turn report only when the attacker is the resolved
participant. It is Game-Master gated, matching every other mutating `manage_combat` action
(`init`, `advance`, `end`, `add_participant`, `remove_participant` all gate). *Alternative rejected:*
a `combat_active` precondition — it narrows the contract without a requirement.

**D7 — No new persisted state.** HP lives in the existing entity/NPC `stats`
object and conditions in the existing per-entity arrays; both are already §7.7
property groups. No clone/checkpoint/archive enumeration changes and no
serializer change. The Novel is saved through `state.saveNovel`, so checkpoint
and restore already cover the damage (T131 asserts it).

**D8 — The test fixture is seeded at boot, not added to the tracked package.**
`test-backfill` already writes ad-hoc packages into `DATA_DIR/rulesets/<slug>`
before boot (`test-backfill.ts:1985-1997`), and the registry discovers them at
startup. Add `damagefixture` with the full envelope the precedent uses:
`manifest.json` carrying `slug`, `name`, `host_version`, `package_format`,
`built_at`, `counts`, and a `content_hash` computed by
`sha256Canonical([], model, [], [], [])`, plus
`index.json`, `tools.json`, `resources.json`, `prompts.json` (empty arrays),
`reasoning.jsonl` (empty), and
`model = { monsters: { goblin: { name: "Goblin", ac: 13, hp: 12, max_hp: 12 } },
incapacitation_condition: "downed" }`. A model without `generation_tables` is
the tested precedent (`test-selection.ts:119` `MODEL`, installed at `:169`). The
distinct name `downed` proves the ruleset-declared branch; reusing the base
`incapacitated` string would pass without the branch. This keeps
`check-fixture-emitter` and the covered-package byte check untouched.

**D9 — T131 and T161 land in `test-backfill.ts`.** That harness is the
bucket-B→C conformance backfill home, already owns the §5.6 combat-report block
(`test-backfill.ts:2230-2312`), and needs no `package.json`, suite-runner, or
harness-gate change. *Alternative rejected:* a new harness — new gate wiring for
two assertions.

**D10 — Spec edits name the implemented surface and stay in REQ shape.**
`REQ-124a` gains this sentence: "The reference server's damage-resolution
surface is `manage_combat (action: damage)`, which accepts entity and NPC
identifiers as `target_id`." (body is 477 chars / 3 sentences; the post-edit body
is ~640 chars / 4 sentences, inside the 800-char / 8-sentence limits).
`REQ-124b`'s acceptance criterion becomes exactly:
"*Acceptance criterion:* `manage_combat (action: damage, attacker_id="hero",
target_id="npc_01", weapon="longsword", dice="1d8", amount=3)` reduces NPC HP;
zero HP applies the ruleset's incapacitation convention; the result and audit
entry name the weapon, dice, total, and HP change; the damage is snapshot-able.
_Check:_ T131." (body 265 chars → ~330 chars / 6 sentences, inside the limits).
The plural "damage-resolution tools" remains a contract category; the added
sentence names the reference implementation's surface. The normative behaviour
(HP reduction, zero-health incapacitation, audit, snapshot) is unchanged.
Appendix F T131/T161 rows are tightened to name the action and the ruleset-backed
NPC fixture; their owners and citations stay.

**D11 — Surface registries are regenerated, not hand-edited.** Add
`manage_combat.damage` to `holonovel/tool-surface-registry.json` with the
`manage_combat.advance` shape (`registry:1183-1199`) — group `resolve`, phases
`scene`/`combat`/`downtime`, `mutation_class: "write"` — except that
`preconditions` is `[]`, not the cited entry's `["combat_active"]`
(`registry:1193-1195`), because D6 deliberately allows damage outside an
encounter.
Then run, in order: `generate-tool-definitions`, `surface-budget --write`,
`build-order`. `DECISIONS.md:736-741` sits inside the dated *Tool Surface
Contract — 2026-10-19* section, so do not rewrite it: add a dated
**Re-baseline (2026-11-13)** bullet in the new decision section recording the
regenerated numbers (canonical actions 244 → 245, total declarations 298 → 299,
tool count 37) and naming the 2026-10-19 bullet as superseded.
`holonovel/AGENTS.md:73` already lists 37 tools — only its `manage_combat` action
list changes. Confirm every number from `surface-budget --write`; do not assume
it.

**D12 — Non-numeric health stats are a recorded condition, not a gap.**
A ruleset whose zero-health convention rests on a non-numeric stat (a wound
ladder, a condition track) is unsupported by this increment; the AAR records it in
`DECISIONS.md` beside D3 and in `ROADMAP.md` only if a demonstrated failure
appears. No open-ended "support all damage models" bullet is added.

## 4. Blast radius

| Path | Change | Size |
|---|---|---|
| `holonovel/src/index.ts` | action enum, six added parameters (reuses `seed`), description, `damage` handler, `manage_condition` clause | M |
| `holonovel/scripts/test-backfill.ts` | `damagefixture` seed, T131, T161 | M |
| `holonovel/tool-surface-registry.json` | `manage_combat.damage` declaration | S |
| `holonovel/tool-routing.json` | routing phrases for `manage_combat.damage` (the file enumerates actions) | S |
| `holonovel/tool-definitions.json` | regenerated | S |
| `spec/02-requirements.md` | REQ-124a/b body and acceptance criterion | S |
| `spec/appendices-reference.md` | T131/T161 rows | S |
| `holonovel/DECISIONS.md` | new dated section + dated re-baseline bullet (do not rewrite 2026-10-19) | S |
| `holonovel/AGENTS.md` | tool-surface action list | S |
| `ROADMAP.md` | retire two sections | S |
| `spec/audit/review-register.md` | F-P3B2-15, F-P3B1-9 `Resolved` | S |
| `spec/audit/req-coverage.md` | regenerated | S |
| `spec/audit/tool-surface-baseline.json` | regenerated | S |
| `spec/audit/tool-surface-replay.json` | re-recorded if `surface-replay` reports drift | S |
| `README.md` | `@spec:` markers refreshed by `build-order` step 5b | S |
| CalVer surfaces (root/holonovel `package.json`, lockfile, `server.json`) | written only if the version advances; expected no diff at 2026.11.13 | S |
| `CHANGELOG.md` | dated entry | S |
| `docs/plans/2026-11-13-req-124-npc-damage/` | plan, tasks, AAR, cold review | S |

Rollback cost: 1 on the 0/1/2 scale (0 = pure add, 1 = reversible edit,
2 = destructive): reversible source/spec edits, one action added, no schema or
package-format change.

## 5. Phases

### Phase 0 — baseline and probes

1. Re-confirm the §1 baseline; run
   `npm --prefix holonovel run test:all` and record the per-suite result (the
   red-baseline rule: fix a red suite as its own commit before this work).
2. `grep -rn "\bT131\b\|\bT161\b" holonovel/scripts holonovel/src` — expect 0.
3. `grep -rn "manage_combat" holonovel/src holonovel/scripts
   holonovel/AGENTS.md holonovel/tool-surface-registry.json
   holonovel/tool-routing.json holonovel/tool-disambiguation.json` —
   enumerate every complete action list or routing table, then establish which
   need the new action. Expect the surface registry and routing table to need
   it, `tool-disambiguation.json` to be tool-level axis text, and
   `holonovel/scripts` to hold projection assertions that name an action list
   (e.g. `test-backfill.ts:1970`). Confirm each, do not assume.
4. Sibling-contract probe: read REQ-043a–g, REQ-203–206c, REQ-221a, and
   REQ-124a/b; confirm none binds `manage_combat (action: damage)` with an
   incompatible contract, and record any second binder in `tasks.md`.
5. Probe the report predicates: `state.ts:2709-2769`, `index.ts:11230-11245`;
   confirm a `roll_weapon_damage` entry with participant-attacker args lands in
   `Actions`/`Rolls`/`State changes`.
6. Probe the fixture path: read `test-backfill.ts:1985-1997` and
   `index.ts:7812-7830`; confirm `ruleset_reference` copies `hp`/`max_hp`.
7. Confirm the damage action's field count (six additions plus the shared `seed`
   = 7) is inside REQ-408's per-action ceiling of 8.
8. Confirm the REQ-573 guard reads preconditions from the registry entry
   (`index.ts:1897-1900`), so an entry with no preconditions is not blocked by
   `combat_active` (D6).

### Phase 1 — red assertions

1. Add a module-scope `seedDamageFixture` helper (D8) beside the existing
   package-seeding code; `seedRuleset` itself is block-scoped
   (`test-backfill.ts:1985`), so a sibling defined inside that block would be
   invisible to the T131 block. Seed before boot.
2. Write **T131** (`REQ-124a/b`) in `test-backfill.ts`:
   - bind `damagefixture`, create an NPC with `ruleset_reference: "goblin"`,
     assert `stats.hp === 12` and `ac` present;
   - init combat with the entity first and the NPC second; advance through the
     NPC's turn;
   - call `manage_combat (action: damage, attacker_id, target_id, weapon:
     "longsword", dice: "1d8", amount: 2, seed: "fixed")`; assert the text
     carries `longsword`, `1d8`, `slashing`, the total, and `12 → <after>`
     (`damage_type: "slashing"`);
   - read the `npcs://` resource with `readResource(proc, "npcs://")` and assert
     `hp === 12 - total`;
   - assert `audit://novel` carries `roll_weapon_damage`, the target, and both
     HP values;
   - undo case, on its own NPC: damage it, then
     `manage_history (action: undo)` restores the pre-damage HP (REQ-041);
   - checkpoint case, on a second NPC:
     `manage_archive (action: checkpoint_set)`, damage, then
     `manage_archive (action: checkpoint_restore)`; assert HP matches the
     checkpointed value. Every existing harness uses `manage_archive` (the
     REQ-581 split surface), not `manage_novel`;
   - damage an unknown id and assert `[ERROR] [NOT_FOUND]` enumerating the valid
     ids (the harness asserts the `[NOT_FOUND]` token);
   - divergent-key case, in the ruleset-free Novel: create the entity, then
     `manage_character (action: update, entity_id, stats: { hp: 10,
     current_hp: 4 })` (stats shallow-merge), damage it for 3, and assert both
     keys lost 3 (`7` and `1`), proving the same-delta write-back never raises a
     sibling (D3);
   - assert `[INVALID_INPUT]` and unchanged HP for: no `dice`/`amount`, a
     negative `amount`, a zero `total`, and `dice: "1d8+2"` (inline modifier);
   - reduce the NPC to 0 and assert the fixture's `downed` condition is present
     and `incapacitated` is absent (ruleset branch), and that the recap status
     is `incapacitated` (the separate status vocabulary, D4);
   - create a second, ruleset-free Novel with two entities through
     `manage_character`; set the target's `stats.hp = 1` through
     `manage_character (action: update)`, damage it with `attacker_id` set to the
     other entity, and assert the base `incapacitated` condition (fallback
     branch), which also exercises the entity-target path.
3. Write **T161** (`REQ-043f`): init with the entity, damaging call with
   `attacker_id` = the entity and `seed: "fixed"`, advance; assert the report
   names the participant, `longsword`, `1d8`, the target's HP change, and a total
   equal to the total in the damage response text (not a fixed die value);
   advance again with no mutations and assert "took no action".
4. Run `test:backfill`; record the failing set (the red evidence for the AAR).

### Phase 2 — implementation

1. `index.ts`: add `"damage"` to the `manage_combat` action enum and the six
   parameters (D2), re-scoping the existing `seed` description to
   "(init/damage)", with descriptions in the house style; extend the tool
   description's action clause, `Use when:` (resolving weapon damage), and
   `Do NOT use when:` (applying a condition — `manage_condition`).
2. Add the `damage` case in validation-first order: `requireGM`/`requireNovel`,
   then resolve the target as entity then NPC, the health keys, the dice, and
   the total, rejecting every invalid input (D2/D3). Only then
   `novelSnapshot()`; write the clamped value to every present health key, apply
   the condition (D4), `audit("roll_weapon_damage", …)` (D5),
   `state.recordMutation`, `state.saveNovel`, and return the transparent report.
   A rejected call mutates nothing and leaves no undo frame.
3. Reuse the existing dice engine and seeded RNG path
   (`resolve_mechanic`-style) rather than adding a second roller. An invalid
   `dice` notation, including an inline `+`/`-` modifier, returns
   `[ERROR] [INVALID_INPUT]` naming the notation and mutates nothing; a target
   with no numeric health stat returns the D3 corrective error and mutates
   nothing.
4. Update `manage_condition`'s `Do NOT use when:` clause to name
   `manage_combat (action: damage)`.
5. Run `npm --prefix holonovel run test:backfill` and confirm T131/T161 pass
   before any register disposition.

### Phase 3 — spec and decisions

1. `spec/02-requirements.md:1774-1778`: REQ-124a/b per D10; record before/after
   character and sentence counts in `tasks.md`.
2. `spec/appendices-reference.md:1628,1659`: tighten T131/T161 wording (name the
   action and the ruleset-backed fixture); keep owners — T131 stays
   REQ-124/REQ-043/REQ-003 and T161 stays REQ-043.
3. `holonovel/DECISIONS.md`: new dated section recording D1–D10 and D12, plus
   D11's registry decision. The measured **Re-baseline (2026-11-13)** bullet is
   written in Phase 4.4 after `surface-budget --write`, because the numbers do
   not exist yet; do not leave a placeholder in the committed file.
4. `holonovel/AGENTS.md:73`: add `damage` to the action list.

### Phase 4 — registry, regeneration, registers

1. `holonovel/tool-surface-registry.json`: add `manage_combat.damage` (D11).
2. `holonovel/tool-routing.json`: add `manage_combat.damage` with the
   `manage_combat.init` shape (`tool-routing.json:70-75`: key `tool.action`, value
   an array of phrases) and the phrases "deal damage" / "resolve weapon damage".
   The routing table feeds `surface-replay`'s
   action-selection precision, so run `surface-replay` after the entry and
   `surface-replay --write` only if it reports drift in
   `spec/audit/tool-surface-replay.json`.
3. `npm run assemble`; `npm --prefix holonovel run generate-tool-definitions`;
   `npm run surface-budget -- --write`; `npm run surface-replay`;
   `npm run build-order`.
4. Add the dated **Re-baseline (2026-11-13)** bullet in the new 2026-11-13
   decision section (leave `DECISIONS.md:736-741` byte-identical) recording the
   measured canonical count, total declarations, tool count, and the
   full/standard/small token baselines from `surface-budget --write`; name the
   2026-10-19 bullet as superseded.
5. `npm run validate -- --write-register`; diff every row the increment touches:
   the combined REQ-124 row becomes C via 124b's T131, and REQ-043f's exercised
   set gains T161. T131's title is `T131/REQ-124a/b`; it is not a REQ-043
   `_Check:_` citation and is not claimed as one.
6. `spec/audit/review-register.md`: F-P3B2-15 and F-P3B1-9 `Resolved`, each with
   the exercising harness predicate (file:line).
7. `ROADMAP.md`: remove *§5.6 clock and combat-report remediation* (its last
   bullet is closed) and *REQ-124 NPC damage resolution*; confirm no other
   section cites them. Record the closure facts in the CHANGELOG entry (the
   admission rule moves shipped work there): T271/T54/T139/T110/T162 resolved,
   T25/T33 re-pointed, and T131/T161 now exercising REQ-124/REQ-043f.

### Phase 5 — gates, changelog, AAR

1. `npm run assemble && npm run check:fast` (un-piped; capture the trailing
   line).
2. `npm run check` (full proofreading pass).
3. `npm --prefix holonovel run test:all` (it includes `test:backfill`; expect
   that suite's count to rise by two assertions over the Phase 0 baseline), and
   `test:backfill` directly.
4. `CHANGELOG.md`: dated entry naming the surface, the spec edits, the
   regenerated artifacts, the two closed findings, and the retired sections'
   closure record.
5. `aar.md`: evidence table, deviations, dispositions, terminal token.
6. `npm run session:close` (spec increment, one commit).

## 6. Done bar

**Done bar:** T131 and T161 exercise the implemented damage surface in
`holonovel/scripts/test-backfill.ts`; REQ-124a/b name the shipped invocation;
REQ-124 is bucket C and F-P3B2-15 / F-P3B1-9 are `Resolved`; both roadmap
sections are retired; `check:fast`, `check`, and `test:all` are green; the tree
is committed by `session:close`.

## 7. Verification matrix

| Surface | Evidence |
|---|---|
| Damage resolution, transparency | T131 text assertions |
| Zero-health incapacitation | T131: `downed` (ruleset branch) + `incapacitated` (fallback) |
| Audit, undo, checkpoint | T131 `audit://novel`, `manage_history`, `manage_archive (checkpoint_set/restore)` |
| Unknown target | T131 `[NOT_FOUND]` |
| Input validation | T131 zero-total, negative `amount`, missing operand, inline modifier, missing health stat |
| Damage type metadata | T131 `slashing` echoed in result and audit |
| Multi-key health | T131 divergent `hp`/`current_hp` both lose the same delta |
| Combat turn report | T161 |
| Surface economy | `check-tool-surface`, `surface-budget`, `surface-replay` (+ recorded artifact when it moves), `tool-definitions-lint` |
| Spec shape | `validate --sdd-strict`; `check:fast` |
| Coverage | `req-coverage.md` REQ-124 → C, REQ-043f gains T161 |
| Registers | `check-registers`, `check-roadmap` |

## 8. Risks and conditions

- **Report attribution is a heuristic.** D5 relies on the attacker id appearing
  as a whole token in the audit args (`state.ts:2720-2731`), which T161 pins.
  `attacker_id` is required for the action (D2), so an attributable record is
  always present; the heuristic can still misattribute if another participant's
  id appears in a free-text field such as `weapon`.
- **Condition vocabulary conflict.** A bound package that declares a condition
  list without the ruleset's zero-health condition is bypassed by D4's direct
  write. Condition: the host names the applied condition in the result and the
  audit entry, so the divergence is visible.
- **Status vocabulary vs condition name.** The entity carries the ruleset's
  condition name (`downed`), while recap's status string stays `incapacitated`
  unless a death condition is declared (D4). T131 pins both; a future change
  that unifies the vocabularies must update both assertions.
- **Count drift.** Two prose count sources disagree today (D11). The plan
  records a dated re-baseline rather than rewriting the 2026-10-19 history.
- **Derived-chain red test:** not applicable — this increment adds no derived
  chain or validity window.

## 9. Open questions

None blocking. The surface choice is settled by D1; the only contract narrowing
(non-numeric damage metrics) is recorded by D12.

## 10. Rollback

Revert the single increment commit. The surface is additive (one action), the
spec text change is a sentence plus an acceptance-criterion rename, and no
package format or state schema changes, so a revert leaves existing Novels and
installed packages loadable with no migration.
