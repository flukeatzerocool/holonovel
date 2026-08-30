## 8. Verification Workflows

Each verification workflow produces an evidence record: workflow name, timestamp,
environment pins (Node version, OS, pinned protocol version), commands run and
their output, pass/fail status, and findings. The record is embedded in
DECISIONS.md item (6) (`@section evidence`).

Verification workflows are either **fixture workflows** (run once per builder
implementation — their results apply to every ruleset served by that builder)
or **ruleset-facing** (each ruleset must pass them independently).

| Workflow | Scope   | What it verifies                              |
| -------- | ------- | --------------------------------------------- |
| G0a      | Ruleset | Structural integrity                           |
| G0b      | Ruleset | MCP conformance                                |
| G2       | Fixture | Golden transcript replay (fixture scoped by complexity) |
| G3       | Fixture | Injection resistance                           |
| G4       | Ruleset | Derived test catalogue                         |
| G5       | Ruleset | The Pattern Buffer — operational verification        |
| G6       | Ruleset | Synthesis lifecycle                           |
| G7       | Ruleset | Narrative coherence attestation                 |
| G8       | Ruleset | Cross-ruleset isolation                         |

In prose, verification workflows are referred to by their canonical `GN` form
(G0, G2, etc.), established in this table. The legacy "Gate N" form is
deprecated outside this section. `G1` is reserved (a retired golden-transcript
gate) — the sequence runs G0a, G0b, G2, G3, …

**Verification workflow G0a — Structural integrity.** Verify the ruleset Markdown (or converted
source) passes the Appendix H checklist: well-formed, all headings unique, tables
regular, references resolvable. Run at intake. Per Standing Rule 9, a ruleset-free
build SHALL report a passing result with the finding "no ruleset — skipped." This
workflow uniquely verifies source quality independent of the running server; structural
checks are distinct from MCP conformance (G0b).

**Verification workflow G0b — MCP conformance.** Verify the running server against the
Appendix D checklist. Every check must pass. Run the MCP Inspector or equivalent
against a server built from the active fixture: the Appendix B fixture (Tin Lanterns)
for Light-tier rulesets (<100 indexed items); the Appendix N fixture (Captain Proton)
for Standard, Heavy, and Huge tiers (≥100 indexed items); the Appendix W fixture
(World-Model) for ruleset-free builds. This workflow uniquely verifies the server
registry, tool schemas, and resource URIs against the MCP protocol — it does not
verify structural correctness of the ruleset source (G0a).

**Verification workflow G2 — Golden transcript replay (fixture workflow).**
Build a server from a fixture and replay its transcript. This workflow uniquely
verifies deterministic reproduction of known interaction sequences — badge gating
is exercised separately by G3 (tool registry), G5 S6 (cross-badge operations), and
G5 S17 (resource filtering). The fixture is
selected by build mode: the Appendix B fixture (Tin
Lanterns) for Light-tier rulesets (<100 indexed items); the Appendix N fixture
(Captain Proton) for Standard, Heavy, and Huge tiers (≥100 indexed items);
the Appendix W fixture (World-Model) for ruleset-free builds.
For Light and Standard tiers (<500 indexed items), the builder replays the first
100 interactions of the selected fixture and verifies per T185 that all applicable
contracts are exercised within that span. Full transcript replay is required for
Heavy and Huge tiers. Assert all contracts the selected fixture's transcript
exercises: status prefix
and `isError` semantics (REQ-001), required fields in order, die values pinned
by per-call seeds (REQ-050), gating decisions (REQ-032), decision round-trips
(REQ-042), condition lifecycle (REQ-043), countdown auto-decrement (REQ-073),
session_recap correctness (REQ-072), and undo round-trip (REQ-041). Wording is
not asserted. Assertion boundary: status prefixes, `isError` flags, required
fields in `spec_health` output, die values, badge gating decisions, and
structural completeness (every transcript interaction produces an assertable
result — `[OK]`, `[NEED_INPUT]`, `[PARTIAL]`, `[ERROR]`, or `[WARNING]`) SHALL
be asserted exactly. Natural-language prose in `set_scene_state`,
`session_recap`, narrative tool output, and error corrective-action text SHALL
be checked for structural presence (the field exists and is non-empty) but not
for exact wording.

Before handoff, re-run G2 once from a cold checkout of the four artifacts,
following only README.md and AGENTS.md. A reproduction failure stops the line.
_Verify:_ T90 (N fixture), Golden transcript replay (B fixture), T261 (W fixture).

**G2 coverage completeness.** After the golden transcript passes, the builder
SHALL verify that every behavioral contract the selected fixture exercises
(per the list above: REQ-001, REQ-032, REQ-041, REQ-042, REQ-043, REQ-050,
REQ-072, REQ-073) is exercised by at least one transcript interaction. Any
unexercised contract SHALL be recorded as a coverage gap in the G2 evidence
record with the unexercised REQ cited. Coverage gaps do not block the line;
they are findings recorded in DECISIONS.md (6) for operator disposition.
_Check:_ T185.

**Verification workflow G3 — Injection (fixture workflow).** Run discovery
over the Appendix C fixture. Verify the capability surface, badge gating, and
metadata filtering are unchanged. Tool registry and resource listings diff
clean (identical except for the new section's anchor and its GM-only guidance
items). This workflow uniquely verifies that adversarial source content
(prompt injection, HTML comments, embedded directives) remains inert data;
structural integrity of indexed content is verified by G0a.

**Verification workflow G4 — Derived tests.** Execute the tests in
[Appendix F](#appendix-f-derived-test-catalogue). Tests run with networking
disabled (REQ-051). Waivers are allowed only under REQ-013; log each with its
reason in DECISIONS.md. Automated tests must ship a runnable script
(`scripts/test_N.sh` or `scripts/test_N.ts`) that exits zero on pass. Manual
tests must document the verification procedure and expected output shape in
DECISIONS.md. This workflow uniquely verifies the server against the formal
test catalogue — individual tool contracts are exercised by G2 (fixture
transcript) and operational behavior by G5 (Pattern Buffer scenarios).

**Verification workflow G5 — The Pattern Buffer (operational verification).** For a
ruleset server, run the Pattern Buffer defined in §6.6. All blocking
sub-workflows listed in §6.6 exit criteria must pass.
For the Holonovel server, run the Holonovel Pattern Buffer defined
in §6.6 Holonovel Pattern Buffer. All blocking sub-workflows listed in §6.6
Holonovel Pattern Buffer exit criteria must pass.
This workflow uniquely verifies operational behavior under AI-simulated play —
deterministic tool contracts are verified by G2 (golden transcript) and G4
(derived tests).

**Verification workflow G6 — Synthesis lifecycle (ruleset-facing).** After the
synthesis workflow (§11) completes, verify: all synthesis items carry a source
tag (`[supplementary]` or `[player]`); Ruleset Wisdom items the host carries
(`[vendor]`-tagged per §11.4) survive server rebuild with unchanged ruleset
hash; deactivated items are
absent from `badge_briefing` and `suggest_actions` output; `synthesis://status`
reports correct per-module active/inactive counts; `revert_synthesis` removes all
`[supplementary]` items while preserving Ruleset Wisdom and `[player]`
items. Evidence is recorded in DECISIONS.md (6) per the evidence record contract.
Non-blocking failures are recorded as accepted limitations with re-activation
conditions. The Pattern Buffer re-runs after every server code change: during Build
completion, after Synthesis (§11), after spec-driven updates (REQ-098), and after
any manual code modification.

**Verification workflow G7 — Narrative coherence attestation (ruleset-facing).**
Verify that DECISIONS.md (6) contains a `narrative_coherence` attestation per
REQ-346. Assert: (a) every narrative-critical REQ (§5.12) has an implementation
status of `converged` or a recorded waiver under REQ-013; (b) `badge_briefing`
rendered against a populated Novel includes all decision-critical and
supplementary narrative sections defined by REQ-109; (c) the embedded or linked
smoke-session transcript contains ≥5 turns of cooperative play demonstrating
coherent story flow through the server's narrative surfaces. Assert
`spec_health` reports a `narrative_coherence` flag with disposition `pass`,
`partial`, or `fail`. A `fail` disposition blocks handoff (§9). A `partial`
disposition is recorded as a non-blocking finding with a re-activation
condition.

**T18 anti-badge sub-workflows:**

| Badge                       | Behavior                                                                       | Expected result                                                                                                                         | Example invocation                                                                                                             |
| ----------------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Power Gamer                   | Stacks non-stacking bonuses                                                    | `[ERROR] [RULE_VIOLATION]`, or `[PARTIAL]` with explanation                                                                             | As Player, calls `apply_condition` with a condition already active on the target entity.                                          |
| New Player                    | Calls a tool with missing or vague parameters                                  | `[ERROR] [INVALID_INPUT]` with a helpful correction                                                                                     | Calls `roll_skill_check` with `skill:""` (empty string).                                                                          |
| Curious Player                | Invokes a GM-only tool                                                    | `[ERROR] [FORBIDDEN]` stating the restriction                                                                                           | As Player badge, calls `init_combat`.                                                                                          |
| Rules Lawyer                  | Cites ambiguous wording to demand an outcome                                   | `[PARTIAL]` explaining the conflict and citing both texts, or `[OK]` returning the raw rule text                                        | Calls `search_rules` on a topic the ruleset defines in two conflicting sections.                                                  |
| Forgetful Player              | Misspells a bounded-domain parameter (a table or move name)                    | `[ERROR] [NOT_FOUND]` enumerating the session-visible valid values                                                                      | Calls `lookup_spell` with `name:"firebal"` (Levenshtein 1 from "fireball").                                                       |
| Forgetful Player (save alias) | Calls `make_save` with the short form `fear` when the sheet shows `Fear Save`  | `[OK]` because short-form aliases are normalized; or `[ERROR] [NOT_FOUND]` with valid values if the save is truly missing               | Calls `roll_save` with `save:"fear"` when the entity's schema shows `"fear_save"`.                                               |

Each persona archetype exercises at least one Pattern Buffer sub-workflow:

| Persona              | Pattern Buffer scenario(s) | Contract exercised                               |
| -------------------- | -------------------- | ------------------------------------------------- |
| Power Gamer          | S4, S21              | Combat determinism, max-round endurance           |
| New Player           | S1, S22              | Invalid-param handling, unknown-decision errors   |
| Curious Player       | S8, S18              | Search ambiguity, adventure generation            |
| Rules Lawyer         | S8                   | Ambiguous alias → `[AMBIGUOUS]` with enumeration  |
| Forgetful Player ×2  | S22, S24             | Workflow staleness, session-boundary recovery     |

**Verification workflow G8 — Cross-ruleset isolation.** Run after the Package
step on a host with at least two ruleset packages loaded. The workflow SHALL verify:

1. **Tool isolation.** With a Novel bound to ruleset A active, call a
   ruleset-derived tool from ruleset B. Assert `[ERROR] [INVALID_INPUT]`
   naming ruleset A as the active scope. Call an infrastructure tool — assert
   `[OK]`. Switch to a Novel bound to ruleset B. Assert the reverse — ruleset
   A tool fails, ruleset B tool succeeds.

2. **Search isolation.** `search_rules("core mechanic")` under a ruleset A
   Novel returns A-ruleset results only. Under a ruleset B Novel, returns
   B-ruleset results only. Assert no result carries a source anchor from the
   wrong ruleset.

3. **Lookup isolation.** `lookup_spell(name)` under each ruleset's Novel
   returns entries from that ruleset's catalogue. A spell that exists in both
   rulesets under the same name returns the ruleset-A entry in A's Novel and
   the ruleset-B entry in B's Novel.

4. **Import rejection.** Export a ruleset-A Novel. Build a new host
   that does not include ruleset A. Attempt to `import_novel` — assert
   `[ERROR] [INVALID_INPUT]` with valid rulesets enumerated.

5. **Cross-ruleset Novel switching.** Create Novel A (ruleset A). Create
   Novel B (ruleset B). Call a ruleset-A dice-resolution tool — assert `[OK]`.
   `switch_novel` to Novel B. Call the same ruleset-A tool — assert per
   REQ-381. Call a ruleset-B dice-resolution tool — assert `[OK]`. Verify
   Novel A's state is unchanged on disk.

6. **spec_health per-ruleset.** Assert `spec_health.ruleset_health` contains
   one entry per ruleset with independent counts. Assert `combined` section
   includes `ruleset_prefix_map`.

7. **Name clash audit.** Assert no two tools in `tools/list` share the same
   registered name. Assert every tool's `ruleset` annotation is either a
   known slug or `null`.

8. **Codex isolation.** Call `codex_capture("npc", name)` from a ruleset-A
   Novel — assert the created entry carries `ruleset` set to ruleset A's slug.
   Call `codex_import` of that entry into a ruleset-B Novel — assert
   `[ERROR] [STATE_CONFLICT]` naming both rulesets.

9. **Load-time namespacing audit.** After each `install_ruleset`, assert every
   tool registered from the package carries the correct `<slug>_` prefix and
   `ruleset` annotation; assert no infrastructure tool was re-registered; assert
   `remove_ruleset` deregisters all of the package's tools and prompts while no
   bound Novel is active.

G8 SHALL produce a pass/fail evidence record. A failure in any step blocks the
build. G8 is a ruleset-facing workflow — each host must pass it
once per ruleset present in the package set.

*Acceptance criterion:* A host with D&D and Starfinder packages loaded passes
all nine G8 steps. Evidence record in DECISIONS.md (6) under `@section evidence-g8`.
_Check:_ T448, T449.

