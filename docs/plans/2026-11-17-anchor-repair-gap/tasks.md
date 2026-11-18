# Tasks — Anchor repair: identity, not proximity, and a declared offset

One line per phase, dependency-ordered. Tick a line only when its acceptance in `plan.md`
has been read back from the actual command output.

## P1 — Baseline and reproduction

- [x] Run `npm run check:fast` and record the trailing `check:fast: PASS` and the `46 passed, 0 failed` line.
- [x] Run `npx tsx scripts/test-anchor-tooling.ts` and record the assertion total (20 before the change).
- [x] Run `npm run check-anchors` and record `predicates current`.
- [x] Record the anchor audit snippet and its output here: `total=39 exactLine=39 multiCandidate=34 substringOnly=0`;
      densest symbols `err` 378, `registerResource` 66, `recap` 44, `prompt` 40.
- [x] Reproduce the wrong-nearest write in a scratch tree and record the written line and the following `predicates current`
      (`:42#err -> :47 (written)`, then `predicates current`).

## P2 — Resolver: identity, not proximity

- [x] `scripts/lib/anchor-resolver.ts`: delete `ANCHOR_WINDOW` and the nearest-wins branch; export `lineCarriesSymbol`; replace `resolveAnchorLine` with `resolveAnchorSymbol(lines, symbol)`; tighten `resolveAnchorInRoot` to a single candidate line; rewrite the header.
- [x] `scripts/refresh-predicates.ts`: replace the single `includes()` test (`:140`) with `lineCarriesSymbol`; update the import and the call sites; update the header and usage.
- [x] `scripts/test-anchor-tooling.ts`: update U1–U8; delete the window-constant assertion.
- [x] Read back: `grep -rn "ANCHOR_WINDOW\|resolveAnchorLine" scripts/` prints nothing; the suite prints `0 failed`; `npm run check-anchors` prints `predicates current`.

## P3 — Declared offset, verified writes, hint

- [x] Add `--offset`, `--path`, `--from-line` parsing (through `scripts/lib/args.ts`) and the D2 validation set.
- [x] `scripts/lib/args.ts`: give `rejectUnknown` an optional value-flag set so a negative offset is not read as an unknown flag (D2a), keeping existing callers' behaviour.
- [x] Implement the offset selection semantics: current anchors untouched; verified target rewritten; unverified target unresolved with exit 1 and no write; `--repath` fallback only when the recorded file carries zero occurrences (C16).
- [x] Add the post-write verification pass (D4) and the `(written) [delta ±n]` suffix (D6).
- [x] Add the stderr modal-delta hint (D5), text mode only.
- [x] Add CLI cases C2–C16 to `scripts/test-anchor-tooling.ts`; the suite must print `44 passed, 0 failed` — measured 44.
- [x] Read back: every V1 label appears in the output; `npm run check-anchors` green.

## P4 — Live negative probes

- [x] Measure candidate lines and choose the wrong-nearest probe anchor; record why its nearest candidate is a different occurrence (recorded 3467, nearest 3485, intended 3447).
- [x] Probe 1 (wrong-nearest): `check-anchors` and `fix-anchors` both exit 1; anchor bytes unchanged; restore.
- [x] Probe 2 (substring line): `check-anchors` exits 1; restore.
- [x] Probe 3 (offset target does not carry): after the setup edit, `--write --offset` exits 1 with `offset target … does not carry` and writes nothing; restore.
- [x] Probe 4 (empty `--path` selection): `--check --offset` exits 1 `no anchor records path`; restore.
- [x] Write `probe.md` (the only file this phase writes); confirm `git status --porcelain` empty.

## P5 — Registers, docs, gates, close

- [x] `ROADMAP.md`: remove the third bullet of *Split `index.ts`*; `npm run check-roadmap`.
- [x] `spec/audit/review-register.md`: dated close paragraph pointing at the new section, plus a `## Resolved — 2026-11-17 anchor repair: identity resolution and a declared offset` section; `npm run check-registers:strict`.
- [x] `scripts/lib/gate-manifest.ts`: `check-anchors` description; regenerate the AGENTS.md table block with `npm run gates -- --list --format=md`; `npm run check-gate-table`.
- [x] Write `aar.md` (readings, probe table, changelog block, terminal token).
- [x] Run V1–V8 and record each reading in `aar.md`; re-read the token.
- [x] Run V2 (`npm run check:fast`) un-piped, last, and record the trailing line (`46 passed, 0 failed`, `check:fast: PASS`, exit 0).
- [x] `npm run session:close --single` commits.
