# AAR — §5.3 prompt-health and resource-presence depth

AAR: SUCCESS — REQ-138a/b's stale-reference report and REQ-139's live resource
presence are implemented and asserted; a removed package now leaves the served
`tools/list`, `tool_count`, and `resource_uris`; the plan's four conditions are
met; all gates green.

## 1. What was supposed to happen

Plan `docs/plans/2026-11-14-s5-3-prompt-health-depth/plan.md` (v3, standard
depth, cold-reviewed twice, stamp `ccaa6dd7…`) with a six-part done bar:

1. `stale_references` computed from the source text; an unregistered name is
   reported, a registered one is not, and user-authored Novel text is not read
   as a reference.
2. Host prompts report `presence`, a served-text `length`, and `within`.
3. `resource_uris` lists the catalog, live-only host entries, installed
   declarations, an `absent` case, and drops an uninstalled package.
4. A removed package's tool leaves `tools/list(scope=all)` and `tool_count`; its
   resources leave `resource_uris`/`resource_count`.
5. `assemble` + `check:fast` pass un-piped.
6. F-P2-5/F-P2-6 `Resolved`, ROADMAP section removed, CHANGELOG entry, this AAR.

## 2. What happened

| Step | Result | Evidence |
|---|---|---|
| T0 probe (C-1) | pass | `tsx` probe: 6 host prompts named, lengths 79–3968, `stale_references` empty on a fresh GM Novel and with a Novel named `manage_dragon`; `resource_uris` 68/68 present, 7 live-only host entries present |
| T1 renderer wrapper | pass | `npx tsc --noEmit` → 0 errors |
| T2 prompt_health fields | pass | probe shows real `length`/`within`/`presence` per prompt |
| T3 detector + user-data exclusion | pass | probe: empty lists; T152 package legs report `manage_absent_tool` only for the stale prompt |
| T4 resource report + count | pass | probe: `resource_count` 68 == present entries; `guidance://{badge}/*` present via concrete instances |
| T5 catalog/count/deregistration | pass | `test:tool-surface` 13/13; T453 reinstall serves `runtime://entry` |
| T6/T7 harness | pass | `npm --prefix holonovel run test:output-contracts` → **563 passed, 0 failed** |
| Surface harnesses | pass | security 14, briefing 27, tool-definitions 22 |
| Holosuite tiers | pass | conformance 45, invariants 25, novel 100, adversarial 26, differential 3 |
| T8 spec + bookkeeping | pass | `npm run assemble`; `npm run validate -- --sdd-strict` → 0 errors, 296 warnings |

Conditions:

- **C-1 met.** Zero unexpected absent tokens; the probe's only pre-existing
  `absent` reading was the template/concrete mismatch, resolved by the D4
  template-match rule (amendment A2).
- **C-2 met.** T453 install → remove → reinstall, `resources/read` on
  `runtime://entry` succeeds after the reinstall.
- **C-3 met.** Paragraph counts recorded: REQ-138b 1,209 chars / 9 sentence
  marks, REQ-139 803 chars / 6; `validate --sdd-strict` reports 0 errors.
- **C-4 met.** `within` is advisory for `badge_briefing` (never-truncated
  footer); T152 asserts presence, and the probe showed `within: true` on the
  fresh state.

## 3. What went right

- The three cold review passes paid for themselves: the v1 blocker (prompt
  bodies were already composed by named composers, not inline) and the v2
  blocker (three owners for `applyPromptBudget`) would both have produced a
  refactor of the wrong shape. The final wrapper is ~40 lines over existing
  composers and reuses `prompt-composition.ts` unchanged.
- Scoping the detector to the verb grammar and excluding user-authored text
  made the zero-stale assertion reachable: the probe with a Novel named
  `manage_dragon` and a description naming `open_the_gate` reports nothing.
- Deriving presence from live maps plus declared sets (no history) gave a
  deterministic report across restarts and a real `absent` witness (a duplicate
  resource `name` inside one package leaves the second URI unregistered).

## 4. What went wrong

- **Probe ordering (A0).** T0 ran after T1–T5, not before: `spec_health` is the
  probe surface, so enumerating tokens before the renderer existed would have
  needed a second, throwaway composition path. The gate's intent (measure the
  false-positive budget before writing the zero-stale assertion) was preserved,
  but the execution order deviated from the plan's phase list.
- **Anchor drift (A1).** The `index.ts` edits moved 17 Holosuite evidence
  anchors across the conformance, invariants, novel, and adversarial tiers (all
  five tiers failed until repointed). This is the third consecutive increment to
  hand-repoint anchors and is the demonstrated cost behind the scheduled
  *Holosuite anchor repoint automation (P2)*; no new roadmap entry is needed.
- **Priming-order crash (A2).** Including the install set in
  `registrationFingerprint` made the module-top `cachedMetadata()` call touch
  `rulesets` (and, after the first fix, `REQ022_URI_CATALOG`) in TDZ. The
  priming call moved below `packageToolVisible`. This is a real coupling the
  plan did not anticipate.
- **Pre-existing name defect (A3).** `prompt_health[*].name` was `"unknown"` for
  every host prompt because the report iterated `Object.values` of the
  registered-prompt map, whose entries carry no `name`. Fixed by iterating
  entries; T152 now asserts the real names.
- **Presence semantics (A4).** The catalog's `guidance://{badge}/anti-slop` and
  `.../foundations` are served by concrete `guidance://player/...` and
  `guidance://game_master/...` registrations, so exact-string presence reported
  them `absent`. D4 gained a template-match rule (a catalog template is present
  when a live registration matches its pattern).
- **Test isolation (A5).** T453's reinstall left the package installed and broke
  T454/T455's installed count; the test now removes it again before exiting.

## 5. Findings and dispositions

| # | Finding | Severity | Disposition |
|---|---|---|---|
| 1 | `prompt_health[*].name` reported `unknown` (predicate: `holonovel/src/index.ts` prompt map iterated by value) | P0 (wrong output) | Fixed in-session (A3), asserted by T152 |
| 2 | `cachedMetadata()` priming touched `rulesets`/`REQ022_URI_CATALOG` in TDZ after the fingerprint change | P0 (startup crash) | Fixed in-session (A2) |
| 3 | 17 Holosuite anchors drifted with the source edit | P1 (gate failure) | Fixed in-session (A1); the automation is already scheduled on `ROADMAP.md` (P2) |
| 4 | Appendix F T167 names an unimplemented `convergence_summary` field | P3 (no wrong server output) | `Closed-P3` row in `spec/audit/review-register.md` |
| 5 | User-data exclusion can mask a stale name quoted verbatim in Novel prose | P3 (accepted tradeoff, bounded) | Recorded in `DECISIONS.md`; T152 asserts the source-side lifecycle on package prompts |
| 6 | Package tool names outside the verb grammar are not stale-checked | P3 (no demonstrated failure) | Recorded in `DECISIONS.md`; revisit only with a demonstrated case |

## 6. Gate outcomes

| Gate | Token | Verdict |
|---|---|---|
| plan-review | `plan-review passed.` (Approved-with-conditions C-1…C-4) | passed |
| independent-review | `independent-review passed.` (v3 targeted, stages 5/5) | passed |
| build-review | `build-review passed.` | passed |
| spec-review | not run (two acceptance sentences and two Appendix F rows; `validate --sdd-strict` 0 errors) | n/a |
| proofread | via `validate` (296 warnings, 0 errors) | passed |
| holosuite anchor tiers | conformance/invariants/novel/adversarial/differential PASS | passed |

## 7. Cost

One implementation pass plus five in-session repairs (A1–A5); three cold review
passes at plan time. The anchor repoint and the TDZ priming order were the two
unplanned costs; both were found by a gates-first verification order rather than
at commit time.

LOOP PAUSED
