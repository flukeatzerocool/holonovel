# AAR — codex pack as a fourth artifact kind

Increment: `docs/plans/2026-11-18-codex-pack-kind/`. Plan: `plan.md` (stamped
`plan-review passed.`, sha256 `547107c2…50d4`). Baseline at start: `npm run check:fast` →
`46 passed, 0 failed` at HEAD `77054a3`.

## What was supposed to happen

Admit the `holonovel.codex/1` payload through `manage_artifact (action: install)` as a
fourth artifact kind named `codex`, living at `<DATA_DIR>/codex/<slug>.json`; make the
registry, `spec_health` count, removal, and the spec surfaces name it; regenerate every
derived artifact; repair the two shifted evidence anchors; retire ROADMAP item 5. Done bar:
round-trip admission plus four refusals, green gates, `counts.codex = 1`, `LOOP PAUSED`,
one commit.

## What happened

| Step | Evidence |
|---|---|
| P1 surface audit | Nine union sites confirmed: `artifact-registry.ts:16,54,56-62,188-191` and `index.ts:11356,11401,11484,11332-11348,11579,12352`; no other site in `holonovel/src`; 17 anchors below 11321, 2 at or after it |
| P2 registry + admission | `codex` in `ArtifactKind`/`KIND_ORDER`/`scanCodexPacks`/`RegistrySources.codexDir`/`registryCounts`; install and remove branches; duplicate slug refused; provenance shape-checked |
| P3 tests | `npm --prefix holonovel run test:artifact-registry` → **31 passed, 0 failed** (23 + 8); order-independent hash asserted; every refusal asserts its code and that nothing was written |
| P4 anchors | pass 1 `--offset 60 --from-line 11322` → `14784#prompt` → `14844`, `11321#inboxSourcePath` reported ambiguous as predicted; pass 2 `--offset 1 --from-line 11321` → `11322`; `check-anchors` → `predicates current` |
| P5 spec | REQ-620 796 chars / 3 sentences, REQ-621 703 chars / 4 sentences; T738/T739, glossary, both §7.6 rows, runbook V.10 (formats + steps 1, 3, 4), `engine-contract` §10, `holonovel/AGENTS.md` (tool line + State Model bullet) |
| P5 regeneration | `assemble` (phase-map hash `262e59b4…`), tool-definitions regenerated (37 tools, 127,024 bytes), `tool-definitions-lint` PASS, `surface-budget --write` PASS (full 29,922; standard 25,935), G7 `SPEC_HASH` re-emitted and current, fingerprints in sync |
| P5 registers | ROADMAP item 5 retired; dated `Resolved` entry `F-CP-1`; `DECISIONS.md` dated design entry (D1–D6); `check-roadmap` OK, `check-registers` PASS |
| P6 close | see "Final gates" below |

Deviations from the plan, all small and recorded:

1. The plan's D8b chain put `build-order` last; it failed there because the full `check`
   gate is strict on `docs/plans` and the AAR did not exist yet. The AAR was written before
   the build-order run, and build-order then passed; this is an ordering note for the
   plan template, not a code change.
2. `surface-budget` also pins the token counts in `DECISIONS.md:9`; those moved with the
   longer description and were updated in the same step (full 29,915 → 29,922, standard
   25,929 → 25,935). The plan named `surface-budget --write` but not the DECISIONS counts.

## What went right

- The plan's measured line numbers and anchor offsets survived execution unchanged
  (`k1 = 1`, `k2 = 59`), so the two-pass repair worked on the first try.
- Writing the eight probes before touching the spec caught the ordering expectation early:
  the `spec_health` count assertion had to run before the second and third packs installed.
- The cold review's blocker (the inverted anchor inventory wording) was the one defect that
  would have made P1's accept unpassable; fixing it before execution cost nothing.

## What went wrong

- The self pass wrote "two anchors at or below 11321" when the operative set was "at or
  after". The cold pass caught it. Disposition: fixed, recorded in `review.md`; the lesson
  (state anchor bands in file order, not count order) is specific to this plan.
- `build-order`'s strict `check` gate cannot pass while an increment is in flight, so the
  plan's "regeneration chain" ordering was wrong for the final step. Disposition:
  record-and-close — the AAR now exists before the gate; no durable artifact changes.

## Findings

- **F1 — AAR-before-build-order ordering.** A plan whose last chain step is `build-order`
  must create the AAR first, because the full `check` gate is strict on `docs/plans`.
  Disposition: record-and-close in this AAR; no ROADMAP entry (it is a plan-authoring
  convention, not a code defect).
- **F2 — `surface-budget` pins `DECISIONS.md:9` token counts.** The plan listed
  `surface-budget --write` but not the recorded counts it validates. Disposition:
  record-and-close; the two counts are updated and the gate passes.
- **F3 — Cold-review stage isolation.** The reviewer could not nest per-stage contexts and
  recorded it as an Unknown rather than hiding it. Disposition: record-and-close (harness
  limitation, no plan change).

No finding is P0 (no wrong output shipped, no gate failure left standing), none is P1 (no
REQ left unevidenced or unscheduled), and none is P2 (no demonstrated failure recurs).

## Final gates

- `npm run check:fast` → `46 passed, 0 failed` / `check:fast: PASS`.
- `npm run check` → PASS inside `build-order` (step 2), which then completed through
  propagation, typecheck, version, and marker refresh: "Build order complete. Ready to
  commit."
- `npm run validate` → `0 error(s), 303 warning(s)` (baseline warning count).
- `git status --porcelain` → the 20 tracked files in the plan's blast radius plus the new
  increment directory; no orphan edit, and `README.md` unchanged as predicted.

## Changelog entry

**Title:** Codex packs: the exported library becomes a fourth artifact kind

**Summary:** `manage_codex (action: export)` no longer ships one-way. The `holonovel.codex/1` payload installs through `manage_artifact (action: install, kind: codex)` into `<DATA_DIR>/codex/`, is listed and counted by the scan-derived registry, and is refused when it traverses, carries the wrong schema, has no entries, duplicates a slug, or declares a mismatched hash. Hash is over `{schema, entries}` sorted by id; integrity is verified, unverified, or absent by the pack's own declaration.

- Added `codex` to the artifact kind set, the registry scan, the install and removal branches, `spec_health` counts, and the removal label.
- Admission accepts the exporter payload verbatim: slug from the file stem, optional top-level title and provenance (shape-checked), and a duplicate slug refused rather than `-N` suffixed.
- Extended `test:artifact-registry` 23 → 31 cases: round trip, absent-hash integrity, order-independent hash, and five refusals.
- REQ-620/REQ-621, T738/T739, the §4 glossary, both §7.6 rows, runbook V.10, the engine contract, and `holonovel/AGENTS.md` now name the fourth kind.
- Repaired two evidence anchors by measured offsets (`11321 → 11322`, `14784 → 14844`).
- Retired ROADMAP item 5; recorded review finding F-CP-1 and a dated `holonovel/DECISIONS.md` entry.

LOOP PAUSED
