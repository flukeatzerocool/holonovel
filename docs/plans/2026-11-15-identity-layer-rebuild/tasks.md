# Tasks — identity-layer rebuild

Dependency-strict. Phase A must be green before any Phase B edit: the identity
prose is what the contract is written to match, and a contract that contradicts
§1 is the defect this increment exists to remove. B0 measures and B0b reads the
seams before anything is edited. One commit (plan § Commit order), landed by
`session:close` at T26.

| # | Task | Depends on | Verification |
|---|---|---|---|
| T1 | Rewrite §1's identity paragraphs and reconcile the Quick Reference opening (A1) | — | `npm run validate` — no new error; every REQ citation in Goals resolves |
| T2 | Delete the full-rebuild clause from §1 (A2) | T1 | `grep -n "full rebuild is required" spec/` returns nothing |
| T3 | Verify the §6.7 citation in §1 still names the right section after T2 | T2 | `grep -n "§6.7" spec/01-foundations.md` resolves to `### 6.7` |
| T4 | Add the four-use projection paragraph to T.3 (A3) | T1 | paragraph names all eight groups exactly once; no declaration changed |
| T5 | Reframe the reading-guide opening to two readers (A4) | T1 | `npm run test:spec-tooling` PASS; `Appendix V (Workflow Runbooks)` present |
| T6 | Anchor or drop the "18 handoff verification steps" count (A5) | T1 | count matches §9 if kept |
| T7 | Register *Holodeck* and *holonovel* in §4 (A6) | T1 | `npm run validate`; the entry states the relation to *Holodeck Coupling* and *Computer* |
| T8 | Define "responds with intent" in the north star (A7) | T1 | the cited REQs (077, 122, 308, 339) exist and the sentence adds no requirement |
| T9 | `npm run assemble && npm run check:fast`, unpiped, exit code captured | T1–T8 | trailing `check:fast: PASS` before Phase B starts |
| T10 | B0 measurement: add nothing; run the seven gates and record which artifacts a new action moves (B0) | T9 | every row in the B0 table carries a measured result and its gate |
| T11 | B0b: read `badge-gate.ts` and `audit-gate.ts`; record the Editor/GM mechanism and the REQ-137a row answer | T10 | the answer names file and line; `DECISIONS.md` row exists or is added |
| T12 | Declare the action in `holonovel/tool-surface-registry.json` with the eight T.3 fields (B1a) | T11 | `npm run check-tool-surface` names the new action, not a missing declaration |
| T13 | Implement the handler in `holonovel/src/index.ts`, cite `REQ-660`, wire the B0b badge seam (B1a) | T12 | `npm --prefix holonovel run test:output-contracts` exits 0 |
| T14 | Add the round-trip assertion to `holonovel/scripts/test-output-contracts.ts`, citing `REQ-660` (B1a) | T13 | the assertion fails when the payload is perturbed |
| T15 | Write REQ-660 (§5.6, one paragraph, ≤8 sentences, ≤800 chars); add the Appendix E row, the Appendix F T792 row, and the §5 section-map entry (B1) | T11 | `npm run validate`; the section map lists REQ-660; `_Check:_ T792` resolves |
| T16 | Document the action in §5.6 and state REQ-321l's survival (B2) | T15 | contract names badge gate, no-Novel operation, determinism, round trip, REQ-321l |
| T17 | Regenerate the surface artifacts: definitions, baseline, replay; hand-add an action-conflict disposition only if `--check` collides (B2) | T16 | `check-tool-definitions-sync`; `check-tool-surface`; `surface-budget -- --write`; `surface-replay -- --write`; `action-conflicts -- --check` |
| T18 | Regenerate the coverage register (B1) | T17 | `npm run validate -- --write-register`; the REQ-660 row names `holonovel/src/index.ts` |
| T19 | B3 experiment: add the `codex pack` kind row, re-run the catalogue gates, keep only if no extra regeneration; else revert and schedule with a `**Trigger:**` | T17 | the road taken is recorded in the plan's Open questions |
| T20 | Refresh `holonovel/AGENTS.md` and the `DECISIONS.md` counts; record the REQ-137a answer (B5) | T17 | `check-tool-surface`; `check-package-manifest` |
| T21 | `npm run version-bump` (B5) | T11 | CalVer, `holonovel/package.json`, lockfile, `server.json`, `index.ts` agree |
| T22 | `npm run build-order` for `contract-fingerprints.ts` (B6) | T15 | `npm run check-fingerprint-sync` PASS |
| T23 | `npm --prefix holonovel run test:all` (B7) | T12–T22 | 56 commands, 0 failed |
| T24 | `npm run assemble && npm run check:fast`, then `npm run check` (B7) | T23 | both PASS on the final tree |
| T25 | CHANGELOG entry (C1) | T24 | one dated heading, two bullet groups |
| T26 | Rewrite `aar.md`; close with `npm run session:close` (C2–C3) | T25 | AAR ends `LOOP PAUSED`; the commit lands |

## B0 measurement table (T10)

Blank until measured. Every row names the artifact, the edit that moves it, and
the gate — none of these attributions is assumed.

| Artifact | Moved by | Reporting gate | Measured |
|---|---|---|---|
| `holonovel/tool-definitions.json` | new action + description edit | `check-tool-definitions-sync` | stale → regenerated |
| `spec/audit/tool-surface-baseline.json` | 245 → 246 canonical actions | `surface-budget` | stale → `--write` |
| `spec/audit/tool-surface-replay.json` | catalog footprint | `surface-replay` | stale → `--write` |
| `spec/audit/action-conflicts-baseline.json` | nothing | `action-conflicts -- --check` | unchanged (4 candidates, all baselined) |
| `holonovel/src/generated/contract-fingerprints.ts` | REQ-321o/660 in §5.6 | `check-fingerprint-sync` | stale → `build-order` |
| `holonovel/DECISIONS.md`, `holonovel/AGENTS.md` counts | recorded surface | `surface-budget` | 246 actions; 29,915 / 25,929 tokens |
| `package.json`, `holonovel/package.json`, lockfile, `server.json` | REQ-107a version advance | `check-package-manifest` | already 2026.11.15 |
| `holonovel/src/generated/g7-attestation.ts` | whole-spec hash | `check-g7-attestation` | stale → regenerated |
| `holonovel/content/torre-nosferatu.json` | starter freshness | `check-starter-freshness` | stale → `build:starter-novel` |
| `holonovel/scripts/lib/holosuite-conformance.ts` | code motion | `check-anchors` | 1 drift → `fix-anchors` |
