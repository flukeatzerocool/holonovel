# Dispositions — REQ evidence linkage chunk 8 (committed-artifact assertions, 4 rows)

P1 read at `84a39a2`. All four rows are class (b) — an `Automated` Appendix F row with no
exercised T-ID (`scripts/lib/req-checks.ts:887`). Each clause is a machine-checkable property of a
committed artifact, so each takes `author`. No row is flipped to `Manual` and no row is re-cited.

| REQ | T-ID | class | cite | home | action |
|---|---|---|---|---|---|
| REQ-153 | T186 | (b) | AGENTS.md carries a `## Troubleshooting` section with four failure classes, each with a recovery step and a verification command | `scripts/validate.ts:checkHandoffDocs` (added in P3) | author |
| REQ-154b | T187 | (b) | README.md presents the five handoff items and a License footer with canonical origin, `Built from:`, one bullet per Appendix U row, RSS, and last-updated date | `scripts/validate.ts:checkHandoffDocs` (added in P3) | author |
| REQ-278 | T298 | (b) | `npm run validate` verifies the build-phase map's recorded hash matches the current spec file set | `scripts/validate.ts:1473` | author |
| REQ-108c | T538 | (b) | a covered-section REQ with no coverage-map row or explicit disposition fails validation | `scripts/validate.ts:961` | author |

Residue after this chunk: 54 − 4 = **50**, all class (b), scheduled on ROADMAP.md item 3 for the
next chunk.

## Scope note (`T298`)

REQ-278 (`spec/02-requirements.md:896-904`) has three obligations: the map records the concatenated
hash at assembly; the **builder** records a DECISIONS.md (6) finding with "the list of files whose
content differs"; and `npm run validate` verifies the recorded hash matches. This row claims the
third obligation only — the equality check at `checkPhaseMapHash`. The builder-side file list is
not claimed by the automated row; it remains a build-record obligation.

## Pre-edit readings (the error-gate dry run)

- `npm run validate`: `0 error(s), 359 warning(s)`, `REQ evidence linkage: 54 finding(s)`.
- `checkPhaseMapHash` (`scripts/validate.ts:1465-1477`) reaches `main` at `:2577`; its message
  names recorded/current hashes and the `npm run assemble` remedy.
- `checkPatternBufferCoverageMap` (`:927-978`) reaches `main` at `:2612`; the §6.6 map carries the
  explicit disposition row `| REQ-370 | — (validated by npm run validate) | Coupling derivation |`
  (`spec/03-build.md:1597`).
- `holonovel/AGENTS.md`: eight `##` sections, no `## Troubleshooting`, none of the four class
  phrases. No existing check covers it (`checkAgentsMapFreshness` reads only the layer map).
- `holonovel/README.md`: `## Requirements`, `## Install`, `## MCP client configuration` (with
  `mcpServers`), `## Configuration` (with `TTRPG_SEED | Deterministic PRNG seed`), `## Data`, and
  `## License` with 13 attribution bullets are present. Absent from License: `Canonical origin:`,
  the literal capitalised `Built from:` lead-in (the section says "…are built from:"), the RSS
  link, and the last-updated date. Expected pre-edit findings: T186 (section) + four T187 items.
