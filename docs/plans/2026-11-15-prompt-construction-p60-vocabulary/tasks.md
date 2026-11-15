# Tasks — §7.3a record and P60 vocabulary

Dependency-ordered. Each task names its verification; a task is not done until
its command passes. Deviations amend `plan.md` first.

## T1 — Phase 0 preflight (read-only)

- [ ] `grep -rn 'pattern rule\|archetype token' scripts/` — confirm no existing
      vocabulary predicate (EV17). If one exists, stop and amend `plan.md`.
- [ ] Re-run EV6's token enumeration; record the unique token set here.
- [ ] Sibling-contract grep: `grep -n 'narrate' spec/02-requirements.md` plus
      the owners named in `holonovel/AGENTS.md` (REQ-023a, REQ-078a, REQ-138,
      REQ-389c, REQ-598). Record whether any fixes the prompt's section count or
      forbids an added section.
- [ ] Budget headroom: render `narrate` with two present NPCs under a combat
      tag at the minimal budget; record the truncation slack and the section
      that truncates (T640's probe).
- [ ] `grep -rn 'narrate' holonovel/src holonovel/packages` — settle the
      `Unknowns` entry (prompt ownership).
- [ ] `sed -n '78,91p' ROADMAP.md` and `sed -n '2725,2744p'
      spec/audit/review-register.md` — confirm the cited lines.

Recorded Phase 0 output: _(to fill during build)_

## T2 — pure helper

- [ ] `scripts/lib/req-checks.ts`: add `unresolvedPatternRuleTokens(rules,
      valid, aliases)` returning `{ rule, token }[]`; pattern rules carry
      archetype tokens only (EV6).
- [ ] Header comment cites REQ-370a.
- [ ] `npm run typecheck`.

## T3 — self-test (red first)

- [ ] `scripts/test-req-checks.ts`: one test, three cases — all-valid set
      passes; `Surface` fails naming the rule; `Scene-anchored +
      Knowledge-carrying` splits without a false positive; one alias-only token
      resolves.
- [ ] `npm run test:validators` — the `Surface` case is the red assertion.
- [ ] `npm run check-script-quality` — no duplicate-helper finding.

## T4 — wire into the validator (red run, recorded)

- [ ] `scripts/validate.ts`: call the helper after the pattern-table parse
      (`:1163`), passing `VALID_ARCHETYPES` and `ALIASES`; emit
      `ERROR: Pattern rule P60 has archetype token "Surface" outside the §7.7.0 vocabulary`.
- [ ] `npm run validate 2>&1 | grep -B2 -A2 'outside the §7.7.0 vocabulary'`
      → paste the output here. Expect exactly one finding, for P60.
- [ ] Recorded red output: _(to fill during build)_

## T5 — retarget P60 and state the rule

- [ ] `spec/04-runtime.md:500` → `| P60 | Session → Session | … |`.
- [ ] `spec/04-runtime.md:649-657`: add the sentence stating that `npm run
      validate` verifies every pattern-rule source and target token resolves to
      the §7.7.0 vocabulary or a declared alias, and that an unresolvable token
      is a spec defect.
- [ ] `npm run assemble && npm run validate` → 0 coupling errors.

## T6 — scene-tone directive

- [ ] `holonovel/src/index.ts` `composeNarrationClearance`: `### Scene tone`
      after the `**Scene:**` line (`:1260`), one line per active
      `novel.scene_type` tag, neutral line when the array is empty, inside
      `applyPromptBudget`.
- [ ] `npm --prefix holonovel run build`.

## T7 — T788

- [ ] `holonovel/scripts/test-lean-narrator.ts`: T788 via `prompts/get` on
      `narrate` — create a Novel, set the tag through `manage_scene`, then
      assert: combat tag yields the combat line and not the social line;
      social tag yields the inverse; no tag yields the neutral line; a second
      read with the tag unchanged yields the same tone line.
- [ ] `npm --prefix holonovel run test:lean-narrator` → all pass, T640 and
      T729–T641 included (T640 is the truncation probe).

## T8 — REQ-598a and Appendix F

- [ ] `spec/02-requirements.md:1475`: new `**REQ-598a — Narrator scene tone
      (Part a).**` — one directive per active scene type among `combat`,
      `social`, `exploration`, `neutral`; neutral when none is set; an
      unrecognized type contributes none; persistence while the tag remains;
      both narrative roles. `_Check:_ T788`. Four sentences, roughly 600
      characters (caps: 8 sentences, 800 characters).
- [ ] `spec/appendices-reference.md`: Appendix E manifest row for `REQ-598a`;
      new T788 row; T420/T421/T434 gain the pattern-token vocabulary clause.
- [ ] `npm run validate:sdd` — 0 errors, body under both caps, §5 map untouched
      (base-keyed, EV22).

## T9 — DECISIONS record

- [ ] `holonovel/DECISIONS.md`: `### Prompt construction conventions —
      2026-11-15` with four bullets, each naming its `holonovel/src` predicate;
      the anti-slop bullet states the host obligation explicitly.
- [ ] `sed -n '/Prompt construction conventions/,/^### /p' holonovel/DECISIONS.md
      | grep -c 'index.ts:'` → at least 4.
- [ ] `npm run validate` — citation resolution green.

## T10 — registers, roadmap, generated artifacts

- [ ] `spec/audit/review-register.md`: `F-U3-3`, `F-U3-4` under
      `### 2026-11-15 §7.3a record and P60 vocabulary` in `## Resolved`, each
      with `Resolved (2026-11-15)` and its predicate; drop the
      Scheduled-roadmap pointer text.
- [ ] `ROADMAP.md`: delete the §7.3a section.
- [ ] `npm run assemble && npm run validate -- --write-register`.
- [ ] `npm run build-order` (fingerprint regeneration for §7.7).
- [ ] `npm run check-registers && npm run check-roadmap && npm run check-fingerprint-sync`.

## T11 — close

- [ ] `CHANGELOG.md`: `## 2026-11-15 — §7.3a prompt-construction record and P60
      vocabulary` with one bullet group.
- [ ] `aar.md`, ending `LOOP PAUSED`.
- [ ] `npm run check:fast` un-piped → `check:fast: PASS`.
- [ ] `npm run session:close`.
