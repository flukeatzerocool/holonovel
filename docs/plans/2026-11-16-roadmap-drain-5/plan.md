# Plan — Roadmap drain 5: item 3 chunk 4 (bounded), five-row closure over an 85-row triage

**Date:** 2026-11-16 · **Kind:** planned · **Depth:** standard · **Revision:** 7 ·
**Increment:** `docs/plans/2026-11-16-roadmap-drain-5` · **Rollback cost:** 1 · **Evidence:** repo at `6155f9c`.
**Review history.** Six cold passes: 5 Blockers → 12/12 → 2 → 1+5 → 1+3 → 2 Blockers (seam scoping,
fixture shape) + 3 Majors; revision 7 resolves every pass-6 finding (`cold-review/`).

## Why

- **EV1 — baseline is green.** `check:fast` → `46 passed, 0 failed`; `validate` → exit 0, `0 error(s),
  390 warning(s)`, buckets A0/B0/C493/D0/E117, 700 exercised IDs, `85 finding(s)`; `test-req-checks`
  → `79 passed`.
- **EV2 — the residue is 85 rows over 75 distinct T-IDs**, all `automated-unexercised`
  (`corpus.md:3-87`; row shape `| REQ | T-ID | kind | verdict |`). Ten surplus rows: `T497` +7,
  `T541`/`T87`/`T431` +1 each. Split by whether the row's REQ id occurs in code
  (`grep -rqE "\b$req\b" scripts holonovel/scripts holonovel/src`): **33 occur, 52 do not**.
- **EV3 — 72 of the 75 IDs occur nowhere** (per-ID `grep -rlw`). The three that occur are
  non-evidence: `T4` in `scripts/detect-near-dupes.ts:13`'s `"T1"…"T9"` list and a validator
  fixture, `T130` in a `scripts/validate.ts:2070` comment, `T682` in a
  `scripts/surface-replay.ts:264` comment. **No cited ID sits in an emitting position.**
- **EV4 — the scan admits `test(...)`/`check(...)` arguments anywhere, but `.push(`/`console.*` only
  inside a declared `function check*(…): string[]`** (`req-checks.ts:858-869`). Measured: top-level
  `console.error("T493 …")` → `[]`; top-level `defects.push("T682 …")` → `[]`; the same push in a
  declared check function → `["T999"]` (`:812-823`).
- **EV5 — T541/T542 are real checks with no harness assertion.** Both are wired gates
  (`run-test-suite.ts:80-81`); neither is named by a `test(...)`. T542 already takes `--decisions`
  (`check-conversion-evidence.ts:40`) and fails only under `--strict` (`:114-117`);
  `check-vendor-manifest.ts:29-31` derives `ROOT` at load, so only T541 lacks a seam.
  `test:ruleset-gates` is its own gate (`holonovel/package.json:79`), absent from `run-test-suite.ts:26-82`.

## Roadmap disposition

| # | Section | Priority | Trigger measured this session | Disposition |
|---|---|---|---|---|
| 1 | Independent verification (§10) | P1 | publish head `f447cb5` is an ancestor of `6155f9c` | Operator-bound: a different model, cold checkout, `DECISIONS.md` item (6) redacted (`spec/07-independent.md:5-16`). Not this session. |
| 2 | Mutation-sample depth | P2 | "next Holosuite lens change" — none since `5a26f11` | Record-and-close. |
| 3 | REQ evidence linkage | P1 | 85 findings (EV1) | **This increment.** Chunk 4 below. |
| 4 | Split `index.ts` | P2 | 0 moved anchors since `6155f9c` | Not triggered. |
| 5 | Codex pack | P3 | no REQ-620/621 change since `6155f9c` | Not triggered. |

## Decisions

- **D1 — Class vocabulary** (`drain-4/tasks.md:5-8`): **(a)** label gap — an emitting assertion covers
  every clause; **(b)** no asserting site — authoring required, or a clause uncovered; **(c)** the
  Appendix F kind should be `Manual`. `a + b + c = 85`.
- **D2 — `dispositions.md` template**, header included: `| REQ | T-ID | class | cite | home |
  action |`, then `| REQ-nnn | Tnnn | (a) | — | path:line | label |`. `cite` = `yes` when the citation
  path itself is wrong, else `—`. Class maps to action (a)→`label`, (b)→`author`, (c)→`re-cite`;
  `closed` replaces it when the increment closes the row, `defer` when parked. `closed(…)` counts
  rows with action `closed`.
- **D3 — Closure is five rows: `T493`, `T682`, `T541` (REQ-451, REQ-451a), `T542`; `N = 80`.**
  Two are authoring, not relabelling: T682's second clause is absent today — `surface-replay.ts:288`
  *accepts* a visibility-only prior via `?? prior?.visibility_rate` — and T493's stale direction
  needs an injectable root. `T497`'s eight rows are **not** closed: their candidate sites assert
  other contracts (`test-update-workflow.ts:190,199` are `T689/REQ-395c` tests;
  `test-spec-tooling.ts:296-323` is the delta renderer), so labelling would manufacture nominal
  evidence (`validate.ts:1610`). They take `action: defer`; chunk 5 owns the assertion.
- **D4 — No scan widening.** `labelsFromContent` is unchanged; each script gains a declared
  `function check*(): string[]` returning its issues (the `validate.ts:1222` idiom). `--root <dir>` is
  scoped: on `version-check.ts` it rebinds **only** the root `package.json` and `CHANGELOG.md` reads
  (every other read stays at the repo root), and on the vendor gate it rebinds the whole narrative
  tree. Admitting top-level `.push(`/`console.*` would also admit data arrays.
- **D5 — Per-T-ID probe against the right file.** The T-ID is corpus column 2: probe
  `grep -cF '| T493 |' <file>` — fixed string, no anchor. Pre-edit counts in `/tmp/c.md`: `T493` 1,
  `T682` 1, `T541` 2, `T542` 1. The post-edit read uses the **regenerated corpus** and must be `0`.
- **D6 — Red reads are spawned or in-file, never by import.** Both scripts export nothing and run
  at module scope, so T493/T541 go red via `npx tsx` against a scratch root, T682's clause is
  asserted in-file, and T542's red is the corpus row (an evidence gap, not a gate failure).
- **D7 — Class (c) is recorded, not executed**: flipping an Appendix F kind is a spec edit needing
  `assemble`.

## Done bar

`dispositions.md` carries one row per finding in D2's template with `a+b+c=85`; the five D3 rows
close with a D5 probe reading `0`; `validate` reports `REQ evidence linkage: 80`; `check:fast` PASS;
one commit; AAR ends `LOOP PAUSED`. **Fallback bar** — if the session cannot begin P2: every row it
did author is in `dispositions.md`, corpus and `ROADMAP.md` are untouched, and the AAR records the
increment as chunk 4a. No directory rename, so the stamped artifact path stays valid.

## Blast radius

| File | Change | Size |
|---|---|---|
| `scripts/version-check.ts` | `checkVersionCurrency(rootVersion, changelog): string[]` returning `T493` issues; `--root <dir>` rebinding only the `package.json` and `CHANGELOG.md` reads | M |
| `scripts/surface-replay.ts` | Comparison at `:286-292` → pure helper taking a prior; `checkExpectedActionPrecision(): string[]` asserts the sibling fixture **and** a visibility-only prior's defect; caller merges into `defects` | M |
| `scripts/test-spec-tooling.ts` | Spawn `version-check.ts` against two scratch roots (stale → 1, current → 0) | M |
| `holonovel/scripts/check-vendor-manifest.ts` | Move `ROOT`, `NARRATIVE_DIR`, `MANIFEST_PATH` below argument parsing as one block; `--root <dir>`; unknown flag and missing value → exit 1. Both gates use `scripts/lib/args.ts`'s existing `parseValueFlag`/`rejectUnknown`, not a private `argValue` copy | M |
| `holonovel/scripts/test-ruleset-gates.ts` | `test("T541/REQ-451: …")` / `test("T542/REQ-452: …")` over temp copies | M |
| `docs/plans/2026-11-16-roadmap-drain-5/` | `dispositions.md` (85 rows), `tasks.md`, `aar.md`, `cold-review/` | L |
| `docs/plans/2026-11-15-req-evidence-linkage/corpus.md`, `spec/audit/req-coverage.md` | Regenerated; corpus loses the closed rows only, register changes only `Exercised tests` cells | S |
| `ROADMAP.md`, `spec/audit/review-register.md`, `CHANGELOG.md` | Residue + `**Trigger:**`, subsection, entry | S |

Rollback cost 1: reversible text only, one commit via `session:close --single`. Non-goals: closing
rows outside D3 (including T497); class (c) flips; error-mode; extending `labelsFromContent`.

## Phases

### P1 — The 85-row triage (`dispositions.md`)

Regenerate the corpus, then one row per `(REQ, T-ID)` in D2's template. Class (a) requires an
executing position covering every clause **of the asserting test body**, not of the Appendix F row;
(b) names the subsystem from the Appendix F REQ column; (c) names the procedure. Carry
`T420`/`T425`/`T439` as (b), the eight `T497` rows as `defer`, and `T682`/`T493` as authoring. Record
the nominal-evidence read (`validate.ts:2710-2724`, `conformance-baseline.json:2-3` at 0).

### P2 — `T493`, `T682`

- `scripts/version-check.ts:125-140` → `checkVersionCurrency(rootVersion, changelog): string[]`
  (an issue for an older version, none for a current one), `T493` in the message text; `--root <dir>`
  rebinds only `:16` and `:127` — the ten other root-relative reads keep the repo root, so a two-file
  fixture reaches the currency branch instead of dying on `ENOENT`.
- `scripts/surface-replay.ts:264-285`: extract the `:286-292` comparison into a pure helper that takes
  a prior, then `checkExpectedActionPrecision(): string[]` asserts the sibling fixture **and** that a
  visibility-only prior yields a named defect string; decide the `:288` fallback and record it.
- `scripts/test-spec-tooling.ts` spawns `version-check.ts` via its `runCode()` helper (it returns
  `{code,out}`; `run()` throws) against a stale and a current two-file root.

### P3 — `T541`/`T542` assertions, test first

Write the T541 case first: a temp root mirroring `narrative_world_model/` — both `MANIFEST.md` **and**
`narrative/` (via the `cpSync` already imported at `test-ruleset-gates.ts:15`) — asserted clean under
`--strict` (non-strict always exits 0, `check-vendor-manifest.ts:151-157`), plus tampered-hash and
deleted-URL cases. Pre-change, `--root` is ignored and the **real** tree is checked, so the tampered
case fails for that reason; D6 records that. Then move the constants and add `--root`. For T542,
assert against the existing `--decisions` seam: a waived temp `DECISIONS.md` (exit 0) and a sub-90%
fidelity record (`--strict` exits 1).

### P4 — Records

`dispositions.md`, regenerated corpus and register (two separate commands), `ROADMAP.md` item 3 (1–3
bullets naming the residual REQs and `80`, `**Trigger:**` preserved), then the dated
`review-register.md` subsection — after `ROADMAP.md`, because `check-registers` fails a
`Scheduled-roadmap` finding whose `REQ-` tokens are not all on the roadmap
(`register-checks.ts:64-67`); cite only REQs item 3 names. Then `CHANGELOG.md`.

### P5 — Gates and close

`check:fast` un-piped, `test:all`, `aar.md` (≤120 lines), `session:close --single`.

## Verification

| # | Command | Expected |
|---|---|---|
| V1 | `npm run validate > /tmp/d5.txt; echo $?` | exit 0; `0 error(s)`; buckets A 0 / B 0; `REQ evidence linkage: 80` |
| V2 | D5 probe on both files | `/tmp/c.md` reads `1,1,2,1` for T493/T682/T541/T542; regenerated corpus reads `0` for each |
| V3 | re-run task 1's command to `/tmp/c2.md`, then `diff docs/plans/2026-11-15-req-evidence-linkage/corpus.md /tmp/c2.md` | empty (regenerable); `diff /tmp/c.md corpus.md` is the five closed rows only |
| V4 | `npm run test:spec-tooling` | passes, including the two spawned stale/current `version-check` cases |
| V5 | `npm run check:fast`; `npm run check-roadmap`; `npm run check-registers` | PASS; item 3 keeps `**Trigger:**`; every REQ token in the register entry is on the roadmap |
| V6 | `npm run test:ruleset-gates`; `npm run test:all` | the ruleset gate prints two more `N passed`; `test:all` is green (it does not run the ruleset gate) |
| V7 | `npm run check-loop-artifacts`; task 2's `awk` one-liner over `dispositions.md` | 0 errors; 85 rows; `a+b+c=85`; five rows with action `closed`, each with a home line |
