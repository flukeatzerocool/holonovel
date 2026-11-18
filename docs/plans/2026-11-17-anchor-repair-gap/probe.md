# Probe record — P4 negative probes

Every probe was run against the live tree at HEAD `4c1e679` plus this increment's uncommitted
changes, then restored with `git checkout -- <path>`. `git status --porcelain` afterwards shows
only the four modified scripts and the untracked increment directory.

The audit snippet and its output (`total=39 exactLine=39 multiCandidate=34 substringOnly=0`) are
recorded in `tasks.md` under P1.

## Probe 1 — a stale multi-candidate anchor is refused, not ranked by distance

- **Anchor:** `holonovel/scripts/lib/holosuite-conformance.ts:192`,
  `anchor("holonovel/src/index.ts", 3447, "err")`.
- **Setup:** recorded line `3447` → `3467`. `err` candidates nearest the stale number are `3447`
  (the intended definition, 20 away) and `3485` (a call site, 18 away), so proximity would have
  chosen the wrong one.
- **`npm run check-anchors`** → exit 1:
  `holonovel/src/index.ts:3467#err is ambiguous (378 candidates: …); declare the shift with
  --offset <n> --path holonovel/src/index.ts, or repoint the line by hand`.
- **`npm run fix-anchors`** → exit 1, and the anchor file still reads `3467` (nothing written).
- **Restore:** `git checkout -- holonovel/scripts/lib/holosuite-conformance.ts`.

## Probe 2 — a line carrying the symbol only inside a longer identifier is not current

- **Anchor:** the same literal, recorded line `3447` → `264`.
- **Setup:** line 264 of `holonovel/src/index.ts` holds `error's Appendix O.2 …` — `err` occurs
  only inside `error`, so it is not a whole-word code-line match.
- **`npm run check-anchors`** → exit 1:
  `holonovel/src/index.ts:264#err is ambiguous (378 candidates: …)`.
  Before this increment the substring test (`lines[recorded - 1].includes(symbol)`) treated that
  line as current and the gate passed.
- **Restore:** `git checkout -- holonovel/scripts/lib/holosuite-conformance.ts`.

## Probe 3 — an offset miss does not fall back across files

- **Anchor:** the same literal, recorded line `3447` → `3467`.
- **Command:** `npx tsx scripts/refresh-predicates.ts --write --repath --offset 5 --path
  holonovel/src/index.ts --from-line 3400` — `--repath` is present because `fix-anchors` carries
  it, which is exactly the shape that could have bound a sibling file.
- **Exit 1**, stderr:
  `offset target holonovel/src/index.ts:3472 does not carry 'err' (anchor holonovel/scripts/lib/holosuite-conformance.ts:holonovel/src/index.ts:3467)`.
  Nothing written (`3467` still present). The recorded file still carries `err` on 378 lines, so
  the guarded fallback refuses instead of searching other files.
- **Restore:** `git checkout -- holonovel/scripts/lib/holosuite-conformance.ts`.

## Probe 4 — a `--path` that names no anchor is an error

- **Command:** `npx tsx scripts/refresh-predicates.ts --check --offset 1 --path
  holonovel/src/nonexistent.ts`.
- **Exit 1**, stderr:
  `no anchor records path holonovel/src/nonexistent.ts; --path must name a path an anchor actually records`.
- **Restore:** nothing to restore (no file touched).
