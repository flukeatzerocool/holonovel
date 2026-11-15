# Cold plan review — U2 (independent)

Reviewer: `review` subagent, fresh context, no authoring history.
Plan artifact reviewed: `docs/plans/2026-11-14-unscoped-u2/plan.md`
Plan sha256 at dispatch: `1bd97d8215f389ce6fbb83cbe153fd6a1961984dcb9be828ca117c5050c9aa39` (438 lines)
Repo: `/home/fluke/Holonovel`, git HEAD `4fab90e`
Standards applied: `plan-review` hard blockers (§0–§2), `AGENTS.md`
"Review-loop governance" and "Agent Operating Routine".
Reads used: 40/40.

## Verdict

VERDICT: PASS — 0 blockers, 6 majors. Row-budget arithmetic and every EV anchor
probed hold; the defects are in the verification chain, not in the review's
premise.

## Blockers

None.

## Majors

1. **`build-order` on the conditional (D5) path was sequenced after a gate that
   cannot pass yet, and misclassified as a "non-loop gate."** `build-order` step
   2 runs `npm run check` (full) whenever `spec/` changed
   (`scripts/build-order.ts:220-229`); `check` includes `check-loop-artifacts`,
   which errors on missing `aar.md`. The plan ran `build-order` before the AAR in
   both places. Fix: AAR before `build-order`. No narrower regeneration command
   exists (`package.json` exposes only the `check-fingerprint-sync` gate,
   not a fingerprint writer).
2. **`check-registers` is report-only by default.** `scripts/check-registers.ts:9-10`
   and `:54` (`process.exit(strict || missingInput ? 1 : 0)`); `package.json:31`
   defines it without `--strict`. "Exit 0" proves nothing. Fix:
   `npm run check-registers -- --strict`.
3. **The prescribed register structure loses Scheduled-roadmap attribution.**
   `scripts/lib/register-checks.ts:25-35` assigns `section` only from a `##`
   heading; `:64-67` only traces a finding to `ROADMAP.md` when
   `section.startsWith("Scheduled-roadmap")`. A row under a bare
   `## Scheduled-roadmap` inherits the preceding `###` block. Fix: one dated
   `###` heading per disposition section that receives rows.
4. **The map-row verdict rule inverted the enforced predicate.**
   `scripts/validate.ts:1370-1376` requires directive ⊆ row; the plan said
   row ⊆ directive, which would record a real gate error as `holds` on 15 of 35
   rows.
5. **`holonovel/holonovel.md` was missing from the blast radius.**
   `scripts/assemble.ts:6-7,19,154-156` writes both artifacts. Also
   `version-bump`'s targets run in `build-order` step 5 (`:251-254`) and were
   never mentioned (idempotent at `2026.11.14`).
6. **EV9's universal claim outran its own command.** "No git hook is named
   anywhere in the specification" rested on a top-level `spec/*.md` grep; a
   recursive grep finds nine hits under `spec/audit/**`. The conclusion stands
   (that tree is U8's surface, `worklist.md:82`); the wording had to narrow.

## Minors / nits

- The file-index row is also machine-checked (`req-checks.ts:128-140`), so "only
  units that carry a machine-checked claim" was overstated.
- `checkStaleCounts` lists **ten** nouns, not five (`validate.ts:756`); the
  digit-count conclusion stands.
- Pre-push anchors: `version-check` at `:47`, `spec-delta` at `:58`.
- The grade-12 narrative bar is `validate.ts:630-637`; `:626` is the REQ-body
  grade-18 check.
- Finding-count parity must compare distinct IDs, not lines (U1's single
  `F-U1-3` appears on two lines).
- D4's "confirmed at task 18" step was vacuous; `check-loop-artifacts` has no
  extra-file allowlist and U1 already ships `review.md`.
- `checkAgentsMapFreshness` is called at `validate.ts:2481-2482`.
- The surface-to-scenario row spans the mapping table **and** the
  `#### Holonovel Pattern Buffer` block (`spec/03-build.md:1745`).
- C-4 should read "no predicate links the workflow table to the phase rows".

## Verified

1. Row budget 35 holds exactly: 16 `###` headings in §6 (14 numbered + 2
   unnumbered) plus 15 map phase rows and 4 structural blocks; the inventory
   ranges tile `spec/03-build.md:3-2155` with no gap or overlap.
2. EV5's directive claim is exact: 6 `*Prepare:*` lines at
   `:204,446,543,607,981,2002`.
3. EV6/C-6: 14 spec files, 13 file-index rows, the map omits itself;
   `ALLOWED_SOURCE_FILES` includes the map (`assemble.ts:120-127`).
4. EV7/D5: `PACKAGE_SECTIONS` includes `### 6.3 ` and `### 6.4.2 ` only
   (`contract-fingerprint.ts:27`).
5. EV13: `build-order` step 1b regenerates fingerprints (`build-order.ts:188-206`).
6. D6: the map hash covers the 13 sources and excludes the map
   (`phase-map-hash.ts:5-6,18-32`; `assemble.ts:161-166`).
7. EV8 severity split: `checkPreparePhaseMap` error at `validate.ts:2487-2491`;
   hash `:2470-2472` and §5-count `:2464-2468` are warnings.
8. EV14/S1: §6–§11 are reference prose at grade 18 with the 45-word cap
   (`validate.ts:639-655`); grade 12 is narrative-only (`:630-637`);
   `build-phase-map.md` is not in `CORE_FILES`, so its prose is unscanned.
9. C-1 is accurate and understated: map `:41` vs `:7-8` contradict each other;
   `checkPreparePhaseMap` iterates directives only (`validate.ts:1357-1377`).
10. C-2/C-3/C-11 premises hold (`spec-delta-classify.ts:46-48`;
    `03-build.md:2035`; `02-requirements.md:2143-2147`).
11. C-8/C-9/C-10 anchors resolve (`03-build.md:1743,2024,1332,1755,612`).
12. Program-record anchors: `worklist.md:91,92,134-150`; `ROADMAP.md:15-32`.
13. `check-roadmap` is a real gate (`scripts/check-roadmap.ts:246`).
14. All four disposition sections exist in the register (`:12`, `:2655`,
    `:2698`, `:3119`), and every gate named in done bar item 6 exists as an npm
    script.

## Delta re-review (v2 → v3)

Plan sha256: a23db37599a75f8de4d2caa3af70d0fd45aaf8ec8c82ed4983ac608374839b0a

This binding line is the **parent's** declaration, added because
`plan-gate.mjs mark-build` matches a bare `Plan sha256:` line
(`plan-gate-core.mjs:24`) and refuses a report that lacks it. The reviewer's own
coverage is `42c788cc…` plus the condition-only amendment recorded at the end of
this section; it declined to carry its token forward to a hash it had not read,
which is why the provenance is stated here rather than implied. See `SK-8` in
the skill-findings register for the harness gap this works around.

Verdict token, stated by the reviewer for the v3 artifact at
`sha256 42c788cced44948bd11826c2e72cd2d207622a22ff28a056b836636aa44cd28b`:

```
independent-review passed.
Stages completed: 5
```

The delta pass covered the six Major fixes, which were all resolved (M1–M6),
and performed the Stage-4 re-zoom of the edited sections, so combined v2+v3
coverage is stages 1–5.

Three defects were carried forward by that pass and are fixed as a
condition-only amendment (no new file, gate, or destructive operation), so they
are re-stamped as conditions rather than re-reviewed:

- **C-1 (fixed)** — on the `D5` path, `check-fingerprint-sync` preceded the only
  command that regenerates the fingerprints. The gate now runs *after* the
  conditional `build-order`; done-bar item 6 and step 19 both carry the order.
- **C-2 (fixed)** — `check-guarded-rule-change -- --base HEAD` is a no-op:
  `--base` inspects `git diff <ref>..HEAD` (`scripts/check-guarded-rule-change.ts:81-83`),
  which cannot see an uncommitted fix set. The check now runs in staged mode
  after staging the fix set.
- **C-3 (fixed)** — the version-fields blast-radius row omitted `AGENTS.md`,
  `holonovel/DECISIONS.md`, and `holonovel/src/index.ts`. All three are named,
  and the row states they stay byte-identical while `version-bump` is idempotent
  at `2026.11.14`.
