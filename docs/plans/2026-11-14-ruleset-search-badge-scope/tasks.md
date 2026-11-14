# Tasks — ruleset search badge scope (F-P1-17)

Plan: `plan.md` (stamped artifact, sha256 `b58166c9…`) · Depth: standard
Baseline at `ddd0e48`: `check:fast` 41/41 PASS · `test:ruleset-nonovel`
10 passed · `check-registers` 1 pre-existing warning (REQ-001b2).

| # | Task | Files | Verification | Status |
|---|---|---|---|---|
| T0 | Re-confirm predicates, enumerate index reads, check C-1 | none (read-only) | greps: `rulesets.search(` 5 occurrences / 3 sites; `indexForReport(` 4 sites; §5.2 absent from both fingerprint lists | done |
| T1 | Index entry field + predicate on both `search` return paths | `holonovel/src/rulesets.ts` | `npm run typecheck`; `npx tsc --noEmit` in `holonovel/` | done |
| T2 | `visibleIndexEntry` / `searchIndexVisible`; two search pairs; resource read | `holonovel/src/index.ts` | typecheck; `test:selection` T688 pointer leg | done |
| T3 | Parameterised fixture (default + legacy slug); T784 | `holonovel/scripts/test-ruleset-nonovel.ts` | `test:ruleset-nonovel` → 11 passed, 0 failed | done |
| T4 | REQ-210d; Appendix F T784; REQ index row | `spec/02-requirements.md`, `spec/appendices-reference.md`, `holonovel.md`, `holonovel/holonovel.md` | `npm run assemble`; `npm run validate -- --sdd-strict` 0 errors | done |
| T5 | Register resolution; roadmap bullet; CHANGELOG; coverage register | `spec/audit/review-register.md`, `ROADMAP.md`, `CHANGELOG.md`, `spec/audit/req-coverage.md` | `validate --write-register`; `check-registers`; `check-roadmap` | done |
| T6a | Tracked increment (plan + cold review + tasks + AAR) | `docs/plans/2026-11-14-ruleset-search-badge-scope/` | `check-loop-artifacts` | done |
| T6b | Full server suite and spec gates | — | `npm --prefix holonovel run test:all`; `npm run assemble && npm run check:fast` | done |
| T6c | One commit | — | `npm run session:close` | pending |

## Deviations from the plan

1. **REQ-210d body is 719 characters / 5 sentences, not 711 / 4.** The first
   draft tripped two proofreading warnings (a 61-word sentence and a
   four-conjunction sentence); the second sentence was split. Same contract,
   same `_Check:`, still inside the 800-char / 8-sentence limits (C-3).
2. **T784 drives the reported-total assertions through `manage_ruleset
   (action: search)`.** The package `search` tool schema declares only `query`,
   so `max_results` is not a package-tool parameter and the `[n of m]` count
   cannot be reached from that surface. Exclusion is asserted on the package
   tool; the total on the host action.
3. **T784's all-invisible query is `"hidden gm"`, not `"hidden gm thing"`.**
   The shared entries match the token `thing`, so the longer query is not an
   all-invisible set.
4. **The register's scheduled F-P1-17 bullet was deleted, not annotated.**
   Resolved findings leave the sweep section (matching F-P1-14/15/16).
5. **The legacy fixture is a second installed package in the same data
   directory**, bound to its own Novel, exactly as the plan's T3 specifies; no
   new testdata path was added, so `check-reference-server-cleanliness` is
   untouched.
6. **Out-of-blast-radius corrective edit: 17 Holosuite evidence anchors were
   repointed** (`holonovel/scripts/lib/holosuite-{invariants,adversarial,
   conformance,novel}.ts`). Inserting ~21 lines into `index.ts` drifted every
   `anchor("holonovel/src/index.ts", N, "symbol")` below the edit, and
   `test:all` failed four tiers with `predicate_unresolved`. Each anchor was
   remapped by symbol ordinal against `HEAD:holonovel/src/index.ts` (not by
   proximity), and the target line's content matches the HEAD line it replaced.
   This is the manual repoint the `ROADMAP.md` P2 item *Holosuite anchor repoint
   automation* names; the item stays open.
