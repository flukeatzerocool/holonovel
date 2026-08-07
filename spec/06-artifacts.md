## 9. Artifacts and Handoff

Four handoff documents (plus `LICENSE.md`). Verification workflow evidence is embedded in DECISIONS.md, never stored as
separate files.

- **RULESET_MODEL.md** — the semantic model with citations, confidence labels, and
  defect log.
- **DECISIONS.md** — six sections: `<!-- @section intake -->` (1) intake record and
  ruleset edition/title; `<!-- @section versions -->` (2) pinned versions; `<!-- @section
  traceability -->` (3) traceability table — one row per requirement covering every REQ in
  Appendix E exactly once; `<!-- @section normalizations -->` (4) assumptions,
  normalizations, and capabilities inventory; `<!-- @section waivers -->` (5) waivers and
  accepted limitations — including mechanics-deviation entries for every hardcoded table,
  each with justification, impact, and re-activation condition; `<!-- @section evidence
  -->` (6) verification workflow evidence, audit findings, verification record, and structured task
  list.
- **README.md** — setup, usage, hat model, state model, RNG continuity, and
  copy-paste MCP client configuration entry verified against the build-time client target.
- **AGENTS.md** — orientation for future AI maintainers: code map, where each requirement
  lives in the code, verification commands, and a `## Troubleshooting` section covering common
  operator-reported failure modes (config mismatch, corrupted state, hat confusion,
  missing environment variables).

**Handoff verification workflow.** Before declaring done, run these verification steps in order. Every step must
have a recorded result in DECISIONS.md.

| Step | Covers   | Procedure                                              | Pass criterion                                                                                                       |
| ----- | -------- | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| H1    | T36      | Compare DECISIONS.md (1) edition/title to source       | Ruleset edition/title matches the source header and document title.                                                   |
| H2    | T29      | Parse traceability table, cross-reference REQs/tests   | Every REQ in Appendix E appears exactly once in (3); every test ID cited in (3) exists in Appendix F.                 |
| H3    | T36, F4  | Scan non-fixture, non-waiver source code for literals  | No canonical class, species, hit-dice, equipment, spell, or ruleset-derived table is embedded outside waivers.        |
| H4    | T35, F4  | Run `tools/list` on target ruleset                     | Fixture-only tool names are not registered when serving a non-fixture ruleset.                                        |
| H5    | T33, F4  | Run `tools/list`                                       | No tool named `roll_attack` or equivalent generic combat resolver is exposed when the ruleset defines attack procedures. |
| H6    | T29, T36 | Parse DECISIONS.md (3) and (5)                         | Every waived test cites a (5) waiver; every mechanics-deviation waiver names the source file and table it replaces.    |
| H7    | T41      | Instrument server, run a canonical lookup              | No tool handler reads ruleset Markdown files after startup indexing; canonical lookups use the loaded index or model. |
| H8    | T43      | Start a workflow, verify no auto-completion            | A workflow that raises `[NEED_INPUT]` does not complete without a `respond` call; no option is pre-selected.           |
| H9    | T44      | Player-hat request for GM-only content         | Returns `[ERROR] [FORBIDDEN]` or stripped response directing to `set_hat`; no hidden content exposed.           |
| H10   | T45      | Run `spec_health`                                      | Overall confidence meets or exceeds the tier threshold set in §6.5 — Standard tier requires ≥80% (floor per REQ-100; Heavy and Huge tiers may apply the adjusted-threshold provision with operator acknowledgment per REQ-099) — and MUST-action coverage = 100% after waivers; any shortfall stops the build.                |
| H11   | F6       | Launch server from README.md client config entry (verified at config-write time per §6.2; re-confirmed here) | Initialize handshake returns `serverInfo.name` matching the `mcpServers` key; no `server unavailable` error.           |
| H12   | T188   | Cold-checkout G2 replay                            | Evidence entry in DECISIONS.md (6) with command, exit code, G2 pass/fail result, and builder's environment pins (runtime version, OS, spec hash); all four fields non-empty. |
| H13   | T189   | Check Gauntlet evidence timestamp in DECISIONS.md (6) against most recent source file modification | Gauntlet was re-run (G5 record present) with timestamp after the most recent source file modification timestamp. |
| H14   | T190   | Four-artifact diet                                                    | Handoff directory contains exactly RULESET_MODEL.md, DECISIONS.md, README.md, AGENTS.md, and LICENSE.md; no other regular files. Automated test scripts in `scripts/` and `.holonovel-state/` directory are exempt. |

A verification step may be waived if the ruleset lacks the feature it tests; the waiver is recorded in
DECISIONS.md (5). Every chain Markdown → REQ → code → test must be traceable. Any gap is a
defect; record it in DECISIONS.md.

