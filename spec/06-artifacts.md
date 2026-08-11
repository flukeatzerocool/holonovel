## 9. Artifacts and Handoff

Four handoff documents (plus `LICENSE.md`). Each artifact SHALL carry its build-time
specification version in the first line: `<!-- built against Holonovel spec vX.Y.Z -->`.
The version SHALL match the value reported by `spec_health.spec_version`. Verification
workflow evidence is embedded in DECISIONS.md, never stored as separate files.

- **RULESET_MODEL.md** — the semantic model with citations, confidence labels, and
  defect log. In multi-ruleset builds, each ruleset produces its own:
  `<slug>_RULESET_MODEL.md`.
- **DECISIONS.md** — six sections: `<!-- @section intake -->` (1) intake record and
  ruleset edition/title (per-ruleset in multi-ruleset builds); `<!-- @section
  versions -->` (2) pinned versions; `<!-- @section
  traceability -->` (3) traceability table — one row per requirement covering every REQ in
  Appendix E exactly once; `<!-- @section normalizations -->` (4) assumptions,
  normalizations, and capabilities inventory; `<!-- @section waivers -->` (5) waivers and
  accepted limitations — including mechanics-deviation entries for every hardcoded table,
  each with justification, impact, and re-activation condition; `<!-- @section evidence
  -->` (6) verification workflow evidence organized in sub-sections: `<!-- @section
  evidence-g0a -->`, `<!-- @section evidence-g0b -->`, `<!-- @section evidence-g2 -->`,
  `<!-- @section evidence-g3 -->`, `<!-- @section evidence-g4 -->`,
  `<!-- @section evidence-g5 -->`, `<!-- @section evidence-g6 -->`,
  `<!-- @section evidence-g8 -->` (multi-ruleset only),
  `<!-- @section audit -->` audit findings and verification record,
  `<!-- @section task-list -->` structured task list. One DECISIONS.md covers
  all rulesets.
- **README.md** — setup, usage, badge model, state model, RNG continuity, and
  copy-paste MCP client configuration entry verified against the build-time client target.
- **AGENTS.md** — orientation for future AI maintainers: code map, where each requirement
  lives in the code, verification commands, and a `## Troubleshooting` section covering common
  operator-reported failure modes (config mismatch, corrupted state, badge confusion,
  missing environment variables).

**Handoff verification workflow.** Before declaring done, run these verification steps in order.

The Novel export format (§7.7, `export_novel`) is the runtime equivalent of a holo-novel
program artifact — a self-contained single-file representation of complete game state
importable on any conformant server. The export manifest (REQ-096) carries the spec version,
making the exported Novel traceable to the build that produced it independently of the
handoff artifacts. Every step must
have a recorded result in DECISIONS.md.

| Step | Covers   | Procedure                                              | Pass criterion                                                                                                       |
| ----- | -------- | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| H1    | T36      | Compare DECISIONS.md (1) intake answers against combined build       | For multi-ruleset builds, compare the slug-to-path mapping against the combined server's `ruleset_prefix_map` and each `<slug>_RULESET_MODEL.md`. Single-ruleset behavior unchanged. Per Standing Rule 9, ruleset-free builds pass with the recorded "ruleset-free — no source" entry in DECISIONS.md (1). |
| H2    | T29      | Parse traceability table, cross-reference REQs/tests   | Every REQ in Appendix E appears exactly once in (3); every test ID cited in (3) exists in Appendix F.                 |
| H3    | T36, F4  | Scan non-fixture, non-waiver source code for literals  | No canonical class, species, hit-dice, equipment, spell, or ruleset-derived table is embedded outside waivers.        |
| H4    | T35, F4  | Run `tools/list` on target ruleset                     | Fixture-only tool names are not registered when serving a non-fixture ruleset.                                        |
| H5    | T33, F4  | Run `tools/list`                                       | No tool named `roll_attack` or equivalent generic combat resolver is exposed when the ruleset defines attack procedures. |
| H6    | T29, T36 | Parse DECISIONS.md (3) and (5)                         | Every waived test cites a (5) waiver; every mechanics-deviation waiver names the source file and table it replaces.    |
| H7    | T41      | Instrument server, run a canonical lookup              | No tool handler reads ruleset Markdown files after startup indexing; canonical lookups use the loaded index or model. |
| H8    | T43      | Start a workflow, verify no auto-completion            | A workflow that raises `[NEED_INPUT]` does not complete without a `respond` call; no option is pre-selected.           |
| H9    | T44      | Player-badge request for GM-only content         | Returns `[ERROR] [FORBIDDEN]` or stripped response directing to `set_badge`; no hidden content exposed.           |
| H10   | T45      | Run `spec_health`                                      | Overall confidence meets or exceeds the tier threshold set in §6.5 — Standard tier requires ≥80% (floor per REQ-100; Heavy and Huge tiers may apply the adjusted-threshold provision with operator acknowledgment per REQ-099) — and MUST-action coverage = 100% after waivers; any shortfall stops the build. Per Standing Rule 9, ruleset-free builds skip the confidence check (recorded as "ruleset-free" in DECISIONS.md (6)); MUST-action coverage is assessed against REQ-020 infrastructure categories only. For multi-ruleset builds, H10 is assessed per ruleset — each ruleset's confidence must independently meet its tier threshold. Additionally, verify that DECISIONS.md (4) contains cold-start time and mean query latency measurements with the measurement environment recorded; verify `spec_health` reports the most recent measurement. A missing performance record is a handoff defect.                |
| H11   | F6       | Launch server from README.md client config entry (verified at config-write time per §6.2; re-confirmed here) | Initialize handshake returns `serverInfo.name` matching the `mcpServers` key; no `server unavailable` error.           |
| H12   | T188   | Cold-checkout G2 replay                            | Evidence entry in DECISIONS.md (6) with command, exit code, G2 pass/fail result, and builder's environment pins (runtime version, OS, spec hash); all four fields non-empty. Per Standing Rule 9, ruleset-free builds replay the Appendix W fixture transcript. In multi-ruleset builds, H12 replays each ruleset's golden transcript in the combined server. |
| H13   | T189   | Check artifact freshness timestamps | Every handoff artifact's `<!-- built against Holonovel spec vX.Y.Z -->` comment carries a version matching `spec_health.spec_version`; Pattern Buffer was re-run (G5 record present in DECISIONS.md §6) with timestamp after the most recent source file modification. |
| H14   | T190   | Four-artifact diet                                                    | Handoff directory contains exactly RULESET_MODEL.md, DECISIONS.md, README.md, AGENTS.md, and LICENSE.md; no other regular files. Automated test scripts in `scripts/` and `.holonovel-state/` directory are exempt. In multi-ruleset builds, per-ruleset `<slug>_RULESET_MODEL.md` files are expected in addition to the four core artifacts. |
| H15   | T-new-396 | Run `tools/list` on combined server          | Every ruleset-derived tool carries correct prefix and `ruleset` annotation. Infrastructure tools carry `null`. No two tools share the same name. `ruleset_prefix_map` covers all B1 slugs. |
| H16   | T-new-397 | Create Novel per ruleset, verify binding     | Each Novel's `ruleset` field matches the creation parameter; immutable after creation; `create_novel` rejects unknown slugs. |
| H17   | T-new-398 | Cross-ruleset tool call rejection            | A ruleset-A tool called against a ruleset-B Novel returns `[ERROR] [INVALID_INPUT]` naming the active ruleset. Infrastructure tools succeed under any Novel. |
| H18   | T-new-399 | Per-ruleset search and lookup isolation      | `search_rules` and canonical lookups under each Novel return only that ruleset's results. |

A verification step may be waived if the ruleset lacks the feature it tests; the waiver is recorded in
DECISIONS.md (5). Every chain Markdown → REQ → code → test must be traceable. Any gap is a
defect; record it in DECISIONS.md.

