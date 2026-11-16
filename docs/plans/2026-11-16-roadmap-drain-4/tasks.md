# Tasks — Roadmap drain 4: item 3 chunk 3

A task is done when its check passes, not when the edit lands. Re-grep every `file:line`
immediately before editing it (HEAD moves between phases).

Class vocabulary (plan D2): **(a)** label gap, **(b)** no assertion, **(c)** manual by row
content. `cite` is a flag, not a class. Class counts must satisfy `a + b + c = 91`.
`re-cite` rows are class (a) **only** when the corrected path is a root `scripts/**` file
that can carry a `labelsFromContent` label; a `holonovel/scripts/**` path is class (b).

| # | Task | Depends on | Check |
|---|---|---|---|
| P1 | Triage table: 91 rows from `npx tsx scripts/validate.ts --write-linkage-corpus /tmp/corpus.md`; one row per `(REQ, T-ID)` with class, `cite`, and a **quoted home line**. Carry the 30 gate-side starting classes from `2026-11-16-roadmap-drain-3/tasks.md:100-125` per D2's mapping (`defer-drill`→(c), `defer-noassert`→(b), `re-cite`→(a) if the corrected path asserts, else (b)) | — | **Superseded by plan §9** — met as "6 citations closed, 85 carried and split"; the 91-row/`a+b+c` check belongs to chunk 4 |
| P2a | Class (a), server harness: T-ID added to each asserting `test(...)` name under `holonovel/scripts/`, grouped by file | P1 | `validate` count falls by the applied row count |
| P2b | Class (a), gates and scripts: T-ID added to the report string inside the owning `function check*(…)` body (`labelsFromContent` shape) — **root `scripts/**` only**; `holonovel/scripts/**` admits `test("<name>")` literals only (`scripts/validate.ts:1463-1465`, `:1469-1473`) | P1 | same |
| P3a | `cite`: `spec/08-synthesis.md` REQ-451 and REQ-451a bodies, and the T541/T542 rows at `spec/appendices-reference.md:1974-1975` — root `scripts/…` → `holonovel/scripts/…`; `npm run assemble` | P1 | every cited path exists; V1 count unchanged by the fix alone (EV5) |
| P3b | Class (b): author the minimal assertion; record the red read (failure output) in the table below before the fix. T541/T542 land here — a `test("T541 …")` that spawns the checker and asserts exit 0 plus the strict-failure case; if the strict case cannot be produced from a manifest copy, the row stays (b) and is counted. A spawning harness must import `./lib/harness-guard.js` and signal completion (`scripts/validate.ts:1481-1489`, REQ-141m); a newly registered command moves `AGENTS.md:355`/`:371` in the same commit | P1 | test fails before, passes after; `validate` row closes; harness fail-loud gate green |
| P3c | Class (c): flip the Appendix F kind in `spec/appendices-reference.md` **and** add the `T<id> — <procedure>` line to `holonovel/DECISIONS.md`; `npm run assemble` | P1 | `validate` 0 errors; no "assert" row flipped |
| P4a | `ROADMAP.md` item 3: replace the second bullet with 91 → N and every residue `(REQ, T-ID)`; keep 1–3 bullets. **N = 0:** retire the section (its trigger is met) and state error-mode | P2, P3 | `npm run check-roadmap` |
| P4b | `spec/audit/review-register.md`: dated chunk-3 subsection (classes, counts, residue). Runs **after** P4a, because `check-registers` requires every `REQ-\d{3}` in a Scheduled-roadmap finding to exist in `ROADMAP.md` (`scripts/lib/register-checks.ts:64-69`) | P4a | `npm run check-registers` |
| P4c | Regenerate `docs/plans/2026-11-15-req-evidence-linkage/corpus.md` and `spec/audit/req-coverage.md` (`npm run validate -- --write-register`) | P2, P3 | V2 empty diff; V8 PASS |
| P5 | Quote review (every class (a) home line re-read against its row description, row marked `checked`) → `npm run assemble` (if `spec/` changed) → `npm run check:fast` un-piped → `npm run test:all` → `aar.md` (five-item disposition, `b`, `authored`, `N = b − authored`, `## Changelog entry`) → `npm run session:close --single` | P4a–P4c | V4 PASS; V5 all commands; V9 every row `checked`; V7 0 errors; one commit |

## P1 outcome — measured, 6 closed, 85 carried

`home` is the executing position, quoted verbatim. `carried` is the chunk-2 verdict where
one exists. Class vocabulary per plan D2: (a) label gap, (b) no assertion, (c) manual by
row content; `cite` is a flag.

| REQ | T-ID | kind | carried | class | cite | home (quoted line) | action |
|---|---|---|---|---|---|---|---|
| REQ-044 | T17 | Automated | — | (a) | — | `holonovel/scripts/test-persistence.ts:772` `test("T224/REQ-065: startup drift comparison reports spec, version, and ruleset drift", …)` | labelled `T17` on that test — **closed** |
| REQ-092h2 | T88 | Automated | — | (a) | — | `holonovel/scripts/test-persistence-guardrails.ts:446` `const bak = file + ".bak";` inside the backup-restore test at `:439` | labelled `T88` on that test — **closed** |
| REQ-370b | T421 | Automated | — | (a) | — | `scripts/validate.ts` `issues.push(\`ERROR: T421 — Coupling row … do not match\`)` inside `checkCouplingCompleteness` | labelled — **closed** |
| REQ-370b | T434 | Automated | — | (a) | — | `scripts/validate.ts:1222` `console.log(\`T434 — Coupling derivation: …\`)` inside `checkCouplingCompleteness` | labelled — **closed** |
| REQ-370b | T435 | Automated | — | (a) | — | `scripts/validate.ts` `issues.push(\`ERROR: T435 — Pattern rule … zero coupling rows\`)` inside `checkCouplingCompleteness` | labelled — **closed** |
| REQ-142c | T540 | Automated | — | (a) | — | `scripts/validate.ts:1048` `issues.push(\`ERROR: T540 — S${n} is marked (Blocking.) …\`)` inside `checkPatternBufferBlockingParity` | labelled — **closed** |
| REQ-451, REQ-451a | T541 | Automated | re-cite | (b) | ✓ | `holonovel/scripts/check-vendor-manifest.ts` — no `test()`; the scan admits `test("<name>")` only | citation fixed to `holonovel/scripts/…`; row stays class (b) |
| REQ-452 | T542 | Automated | re-cite | (b) | ✓ | `holonovel/scripts/check-conversion-evidence.ts` — no `test()` | citation fixed; row stays class (b) |
| REQ-369b | T420 | Automated | — | (b) | — | **proven absent**: `checkCouplingCompleteness` validates only unrecognised archetypes (`scripts/validate.ts:1097`), never non-emptiness | 85-row residue |
| REQ-374b | T425, T439 | Automated | — | (b) | — | same missing predicate as T420 | residue |

The remaining 78 rows were not individually read this session; they are measured
(`/tmp` corpus regenerated, 85 findings) and carried to chunk 4, not inferred as (a) or (b).
`T493` and `T682` are **not** label-closeable: their reports sit in top-level script
sections, outside any `function check*(…)`, so `labelsFromContent` cannot read them.

## Class (b) assertions — red reads

No assertion was authored this session (the stop preceded P3b).

| T-ID | Command | Red output (first line) |
|---|---|---|
| — | — | — |
