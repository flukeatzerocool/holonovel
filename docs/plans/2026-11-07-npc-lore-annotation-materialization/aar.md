# AAR — `@npc`/`@lore` annotation materialization (REQ-079a)

Session 2026-11-07. Plan: `plan.md` (stamped, sha256 `6f4d3356…`).
Roadmap item retired: "Materialize adventure-module `@npc` and `@lore`
annotations (REQ-079a)".

## Done bar (from the plan)

T244's `@npc`/`@lore` assertions pass on both the load and convert paths (NPC
in the named room, lore entry with triggers), duplicates and caps skip with a
note, the loader no longer claims linkage is unimplemented,
`assemble && check:fast` and `build-order` are green, and the ROADMAP item, the
register row, the CHANGELOG entry, and this AAR are updated in one commit.

Verdict: **met**.

## What happened

1. Baseline recorded: `test:adventure` 16, `test:backfill` 77,
   `test:starter-novel` 15, `check-registers` PASS, `check:fast` PASS (36).
2. Parser: `AnnotationDirective` added; `applyAnnotationLine` defers
   `@npc`/`@lore` instead of warning; `linkAnnotations` and `convertSource`
   return directives; `annotationName` exported.
3. Materializer: `materializeAnnotations` writes the NPC (room coupling,
   description, provenance) and the lore entry (article-free key, trigger,
   `world_target`), with duplicate and cap skips.
4. Wiring: convert and all three load branches materialize after the world is
   final, save after the write, and report real counts.
5. Tests: `test:adventure` 16 → 19, `test:backfill` 77 → 78.
6. Spec: Appendix K documents the NPC/lore rules; `assemble` → SHA-256
   `98e9fa47…`.
7. Gates: `check:fast` 36 passed; `build-order` 0 errors, propagate and version
   sync OK.
8. Registers and roadmap updated; CHANGELOG entry dated 2026-11-07.

## What went right

- The plan's decision to keep state writes out of `world/model.ts` held: the
  parser probe passed on the first attempt and typecheck was clean after every
  phase.
- Splitting the directive path from the hazard path meant no change to the
  REQ-622 hazard behavior; its tests stayed green untouched.
- The plan named the exact save sites and branches; wiring needed no discovery.
- Conditions C-1/C-2 were settled before the first materializer edit, so no
  rework.

## What went wrong

- **Lore key expectation (resolved in-session).** The first test run failed
  because the key derives from `annotationName`, which strips a leading article
  ("The Vault" → `vault`), while the test asserted `the_vault`. This was the
  plan's D6 rule applied correctly; the test was wrong. Corrected the two
  assertions; no code change.
- **Empty register section.** Removing the only Scheduled-roadmap row left an
  empty section; replaced with `_Nothing scheduled._` until the AAR finding
  added a row. No gate complained, but the placeholder is worth remembering.

## Findings and dispositions

1. **Lore `visibility` is specified but absent (2026-11-07).** `LoreEntry`
   carries `badge_scope` only and `manage_lore (action: set/update)` accepts no
   `visibility` parameter, while REQ-083d–REQ-083f require the field and
   presence-gated trigger matching. This out-of-scope gap was noticed while
   choosing the annotation's badge scope. Disposition:
   **Scheduled-roadmap** — `ROADMAP.md` "Materialize lore `visibility`
   (REQ-083d–REQ-083f)" and the register's Scheduled-roadmap row. (P1:
   normative REQ, unevidenced, previously unscheduled.)

2. **Proofread-register drift warning.** `build-order` warned that the register
   records 231 warnings while the live run produced 255. Pre-existing, not
   caused by this increment and not gated. Disposition: **record-and-close**
   (P3); the register is refreshed when proofreading is next swept.

3. **Annotation counts on the World branch.** On the normal load branch the
   hazard counts report the directives outside `## World` (pre-existing
   behavior) while NPC/lore counts cover both sets. No failure demonstrated;
   left unchanged to avoid altering the hazard contract. Disposition:
   **record-and-close** (P3).

## Evidence

| Step | Command | Result |
|---|---|---|
| Parser | `npx tsx` probe | directives returned, malformed `@npc` warned |
| Types | `npx tsc --noEmit` | exit 0 |
| Load path | `npm run test:adventure` | 19 passed, 0 failed |
| Convert path | `npm run test:backfill` | 78 passed, 0 failed |
| Starter | `npm run test:starter-novel` | 15 passed, 0 failed |
| Gates | `npm run check:fast` | 36 passed, `check:fast: PASS` |
| Pipeline | `npm run build-order` | 0 errors, propagate/version/typecheck OK |

LOOP PAUSED
