# Cold review 2 — 2026-11-16-roadmap-drain-5 (diff re-review)

Reviewer: review subagent (cold, no authoring context)
Plan sha256: `1758c24b1d83d651f5c1ed62d7b3fbdcae19056ae8548913bdaaf7e86f89946b` (verified with
`sha256sum`, 150 lines — matches dispatch)
Prior plan sha256: `fb6086ff15c252fe23a4ab5f9e032c2fe9d01b83f93c052b2fbe031f3fa3cb77` (matches
`review.md:4`)
Companion sha256: `4b20cf8d…641bef`, 37 lines (`tasks.md`)
Scope: resolution of the twelve prior findings only. No new-lens sweep; unchanged text not
re-read; issues in unchanged text recorded as Deferred. Prior findings quoted from
`cold-review/review.md`.

## Resolution matrix

1. **RESOLVED** — `tasks.md:26` captions the table "Filled during execution, not before." and
   `plan.md:63` (D5) scopes the red read to execution; each row now carries a command
   (`tasks.md:30-33`). Nothing asserts a quote that is absent; task 7's "quote the red output
   below" (`tasks.md:17`) now points at a table explicitly deferred to execution. (Content of
   the T542 row is wrong — see R1.)
2. **RESOLVED** — ordering inverted: `tasks.md:17` writes the harness cases (depends on task 1),
   `tasks.md:18` adds `--root` (depends on 7), so the T541 red read (`--root` unsupported →
   non-zero) is observable, and `plan.md:116-117` states the sequence before the flag exists.
3. **RESOLVED** — `plan.md:50-55` (D2) requires per-clause coverage and makes the five-row
   closure conditional on every clause; `plan.md:54` names both two-clause rows;
   `plan.md:104-109` (P2) requires both directions — older *and* current for
   `checkVersionCurrency`, sibling-selection *and* visibility-only-fails for
   `checkExpectedActionPrecision`. With those sites authored, `N ∈ {80, 72}` (`plan.md:55,71`)
   is derivable, not a guess.
4. **RESOLVED** — `tasks.md:20` separates `--write-linkage-corpus <path>` (committed
   `corpus.md`) from `--write-register` (`req-coverage.md`); `plan.md:85` names both flags.
   Verified both are parsed (`scripts/validate.ts:2651-2652,2668`); the stray `--` in the second
   command is inert because args are matched with `argv.includes`.
5. **RESOLVED** — `plan.md:84` adds the `docs/plans/2026-11-16-roadmap-drain-5/` row naming
   `dispositions.md`, `tasks.md`, `aar.md`, `cold-review/`.
6. **RESOLVED** — presence grep replaced by the per-row corpus probe: `plan.md:60-62` (D4),
   `plan.md:137` (V2), `tasks.md:16,19`. Aggregate N is no longer the only admission test.
7. **RESOLVED** — `plan.md:16-18` (EV2) names the per-row enumeration command
   `grep -rqE "\b$req\b" scripts holonovel/scripts holonovel/src` behind the 33/52 split.
8. **RESOLVED** — `--strict` named in `plan.md:118-119` (P3) and `tasks.md:17-18`; agrees with
   `holonovel/scripts/check-conversion-evidence.ts:29,114-117`.
9. **RESOLVED** (as far as recordable) — `wc -l` = 150, matching the bound; `plan.md:150`
   records the zero headroom. Sidecar's "151" not re-read (Unknown).
10. **RESOLVED** — `plan.md:78` and `:106` now say "caller block", matching
    `scripts/version-check.ts` having no `main`.
11. **RESOLVED** — `plan.md:139` (V4) expects 79 with `plan.md:13` (EV1) carrying
    `test-req-checks` → `79 passed`; `test:validators` is that same script (`package.json:66`),
    so the count is tied to the gated command.
12. **RESOLVED** — `tasks.md:14` (task 4) records the nominal-evidence read and the `TTRPG_`
    absence; `plan.md:98-100` (P1) repeats both with `scripts/validate.ts:2710-2724` and
    `spec/audit/conformance-baseline.json:2-3`.

## Residual findings in changed text

- **R1 [Major|design] — T542 has no red seam, yet `tasks.md:17` demands one.** Task 7's check
  says "both fail now — `--root` is unsupported and T542's strict case is unreachable." Only
  the T541 half is true. `--strict` and `--decisions` already exist
  (`holonovel/scripts/check-conversion-evidence.ts:29,40`) and a threshold break exits 1 under
  `--strict` (`:114-117`), so a T542 case recording a sub-90 % fidelity rate passes on first
  run; the "waived line → exit 0" direction also passes today. Consequence: task 7's check
  ("both fail now … quote the red output below") is unsatisfiable as written, and the T542 row
  at `tasks.md:33` cannot be filled with a failure. The underlying gap for T542 is a missing
  `test(...)` (an evidence gap), not missing adapter behaviour — unlike T541, which needs
  `--root` (`holonovel/scripts/check-vendor-manifest.ts` hardcodes `ROOT`). Remediation: in
  `tasks.md:17` and the T542 row at `:33`, state that only T541 has a code seam and that T542 is
  an assertion-only row whose case is expected to pass on first run (or, if a red must exist,
  name a genuine T542 seam); align `plan.md:116` ("capture the red read (unknown flag →
  non-zero)" — true only for T541) and `tasks.md:32-33`'s "before task 8", since task 8 does not
  touch the conversion-evidence check.
- **R2 [Nit|clarity] — unescaped pipes split the verification table.** `plan.md:137`
  (`grep -c '^| T493 |'`) and `plan.md:138` (`grep -c '^| REQ-'`) place raw `|` inside GFM table
  cells; both rows render with extra columns. `tasks.md:16,30-31` escape the same patterns
  (`\|`), so this is a local slip, not a misunderstanding. Fix: escape as `\|` in V2/V3 or move
  the commands to prose.

## Deferred (unchanged text, deliberately not re-reviewed)

- Corpus shape (85 rows / 75 IDs), `checkFunctionRanges` label mechanics, `--root` caller
  safety, `check-registers` ordering, and D6's no-`assemble` call — all verified sound by the
  prior cold pass and unchanged in this revision.
- `dispositions.md`'s bookkeeping: D1 defines (b) as "authoring required", while D2 closes
  T682/T541/T542 which are (b) at triage; the done bar's `closed(dispositions.md)`
  (`plan.md:71`) is therefore operationally defined only by the V2 probe. This text is changed
  but the ambiguity is inherited from D1, so it is noted rather than scored.

## Unknowns

- Sidecar `plan.evidence.json:13`'s "151" line count was not re-read; the artifact measures 150.
- No gate was executed in this pass: EV1's `46 passed`, `79 passed`, and `85 finding(s)` are
  taken as stated; only the `test:validators` → `test-req-checks.ts` mapping was confirmed
  (`package.json:66`).
- Whether the T542 waived-line direction exits 0 was reasoned from source
  (`check-conversion-evidence.ts:29-118`), not run.

Reads used: 6 of 10 (3 file reads: prior review, `plan.md`, `tasks.md`; 3 greps:
`scripts/validate.ts` argv, `check-conversion-evidence.ts` flags, `package.json` scripts) plus 1
read-only shell call (`sha256sum`, `wc -l`, `git status`).

independent-review FAILED. Prior findings resolved 12/12 · Residual Blockers 0 · Major 1 · Nit 1
· Deferred 2 · reads 6/10

## Resolution of R1 and R2 (author amendment, revision 3)

- **R1** — `tasks.md:17` now states T542 is assertion-only, passes on first run, and has no code
  seam; its red read is the corpus row (`tasks.md:33`). `plan.md` P3 says the same and scopes the
  `--root` red read to T541.
- **R2** — `plan.md` V2/V3 escape the pipes as `\|`.
