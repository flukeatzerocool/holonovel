# Tasks — Roadmap drain 5: item 3 chunk 4 (bounded)

A task is done when its check passes, not when the edit lands. Re-grep every `file:line` before
editing it.

**`dispositions.md` template** (plan D2), header included, one data row per finding:

```
| REQ | T-ID | class | cite | home | action |
|---|---|---|---|---|---|
| REQ-nnn | Tnnn | (a) | — | path:line | label |
```

`class` ∈ {`(a)`,`(b)`,`(c)`}; `cite` = `yes` when the citation path itself is wrong, else `—`;
`home` is `path:line` or `—`; `action` ∈ {`label`,`author`,`re-cite`,`defer`,`closed`}, with
`closed` replacing the triage action once the increment closes the row. `a + b + c = 85`.

**Probe** (plan D5): the T-ID is corpus column 2, so use `grep -cF '| T493 |' <file>` — fixed string,
no anchor, no BRE escaping. Pre-edit counts in `/tmp/c.md`: `T493` 1, `T682` 1, `T541` 2, `T542` 1.
Post-edit reads use the **regenerated** `docs/plans/2026-11-15-req-evidence-linkage/corpus.md` and
must be `0`.

**No imports** (plan D6): `scripts/version-check.ts` and `scripts/surface-replay.ts` export nothing
and execute at module scope, so a unit case cannot reach them. Scripts are exercised by spawning
`npx tsx`; surface-replay's new clause is asserted in-file.

| # | Task | Depends on | Check |
|---|---|---|---|
| 1 | Regenerate the baseline corpus to `/tmp/c.md` (`npx tsx scripts/validate.ts --write-linkage-corpus /tmp/c.md`) | — | `grep -c '^| REQ-' /tmp/c.md` = 85 |
| 2 | Author `dispositions.md` in the template above; (b) names the subsystem from the Appendix F REQ column; carry `T420`/`T425`/`T439` as (b), the eight `T497` rows as `defer` per plan D3, and `T682`/`T493` as `author`. Count with `awk -F'|' 'NR>2 && NF>5 {gsub(/ /,"",$4); c[$4]++} END {for (k in c) printf "%s %d\n", k, c[k]}' dispositions.md` | 1 | the three class counts sum to 85; every (a) row quotes an asserting test body, not an Appendix F row; every `action` is one of the five literals |
| 3 | Score the two-clause rows: `T493` against `spec/appendices-reference.md:1524` (blocked *and* proceeds), `T682` against `:2177` (sibling selection *and* visibility-only fails) | 2 | both clauses named, with the authoring step for each |
| 4 | Record the nominal-evidence read: `scripts/validate.ts:2710-2724` and `spec/audit/conformance-baseline.json:2-3` at 0; no `TTRPG_` token on the five rows | 2 | line recorded in `dispositions.md` |
| 5 | `scripts/version-check.ts:125-140` → `checkVersionCurrency(rootVersion, changelog): string[]` with `T493` in its messages; `--root <dir>` rebinds **only** the `:16` `package.json` and `:127` `CHANGELOG.md` reads (all other root-relative reads stay at the repo root), parsed with `parseValueFlag` from `scripts/lib/args.ts` | 3 | `npx tsx scripts/version-check.ts` exits 0; `--root <stale-two-file-dir>` exits 1 **with the currency message** from `:133`, not an `ENOENT`; `--bogus` and `--root` with no value each exit 1 |
| 6 | `scripts/surface-replay.ts`: extract the `:286-292` comparison into a pure helper taking a prior; `checkExpectedActionPrecision(): string[]` asserts the sibling fixture **and** that a visibility-only prior yields a **named defect string**; decide and record the `:288` fallback; caller merges into `defects` | 3 | `npx tsx scripts/surface-replay.ts` exits 0; a synthetic visibility-only prior produces the named defect (not silence) |
| 7 | `scripts/test-spec-tooling.ts`: spawn `version-check.ts` via `runCode()` (it returns `{code,out}`; `run()` throws) against a stale two-file root (exit 1, currency message) and a current one (exit 0) | 3 | the stale case fails before task 5 with a non-currency reason (`--root` unknown) — quote it below; both pass after |
| 8 | **Write the T541 case first**: `test("T541/REQ-451: …")` over a temp root mirroring `narrative_world_model/` — `MANIFEST.md` **and** `narrative/` via `cpSync` — asserted clean under `--strict`, plus tampered-hash and deleted-URL cases | 1 | clean `--strict` run exits 0 with the copied tree (non-strict always exits 0, so the clean half needs `--strict`); the tampered case fails now because `--root` is ignored and the **real** tree is checked; quote it below |
| 9 | `holonovel/scripts/check-vendor-manifest.ts`: move `ROOT`, `NARRATIVE_DIR`, `MANIFEST_PATH` below argument parsing as one block; add `--root <dir>` via `parseValueFlag`; unknown flag and missing value → stderr + exit 1; default unchanged | 8 | task 8 passes and the clean case becomes discriminating; `--help` exits 0; `--bogus` exits 1; `--root` with no value exits 1; from the repo root `--root holonovel` exits 0 |
| 10 | `test("T542/REQ-452: …")`: assert against the existing `--decisions` seam — waived temp `DECISIONS.md` (exit 0) and a sub-90% fidelity record (`--strict` exits 1). **No script change** | 1 | both cases pass; the probe shows the T-ID was unexercised, which is not a gate failure |
| 11 | Regenerate **separately**: `npx tsx scripts/validate.ts --write-linkage-corpus docs/plans/2026-11-15-req-evidence-linkage/corpus.md`, then `npx tsx scripts/validate.ts --write-register` | 5, 6, 7, 9, 10 | `diff /tmp/c.md corpus.md` is the five closed rows only; `req-coverage.md` changes only `Exercised tests` cells, no bucket moves; a second regenerate is byte-identical |
| 12 | `ROADMAP.md` item 3: 1–3 bullets naming the residual REQs and `80`, **keeping `**Trigger:**`**; then the dated `review-register.md` subsection (after `ROADMAP.md`) | 11 | `npm run check-roadmap`; `npm run check-registers`; every `REQ-` token cited in the register entry appears in `ROADMAP.md` |
| 13 | `CHANGELOG.md` entry; `npm run check:fast` un-piped; `npm run test:all`; `npm run test:ruleset-gates`; `aar.md`; `npm run session:close --single` | 12 | trailing `check:fast: PASS`; suite green; ruleset gate two above its baseline; one commit; AAR ends `LOOP PAUSED` |

## Fallback (plan done bar)

If P1 stalls, stop before task 5 and close a clean `4a`: all 85 rows triaged in `dispositions.md`,
corpus and `ROADMAP.md` untouched, AAR records the stop. Do not half-close the five rows.

## Red reads (plan D6)

Filled during execution, not before. Pipe-bearing commands are prose so the pipes stay literal.

- `T493` — probe `/tmp/c.md` = 1 before, 0 after; spawned stale root exits 1 carrying
  `predates the latest substantive CHANGELOG entry` (the currency predicate, not `ENOENT`).
- `T682` — probe `/tmp/c.md` = 1 before, 0 after. The clause is authoring, not relabelling: the
  `?? visibility_rate` fallback is removed, so a visibility-only prior now emits
  `T682 — prior baseline records visibility only; recall_at_budget is required evidence`.
- `T541` — **deviation:** the flag landed before the case was written, so no pre-change failure was
  captured. Post-change the case is discriminating in both directions: clean `--strict` copy exits 0,
  a tampered source file exits 1 with `MISMATCH`, and a URL-stripped manifest exits 1 (`BADURL`).
- `T542` — probe `1` before, `0` after; the case passed on first run as predicted (assertion-only,
  no script change), and the strict sub-90% record exits 1.

## Class (b) residues named for chunk 5

Filled by task 2. Group by subsystem; do not restate the Appendix F text. The eight `T497` rows lead
the list, with the assertion each needs.
