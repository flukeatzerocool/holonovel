# Roadmap

<!--
  Format: one `## <title>` per upcoming item, followed by 1–3 bullet lines.
  Newest first. Remove entries once they ship (they move to CHANGELOG.md).
  Update this file when planning a release.
-->

## Holosuite III — Understudies + method audit
- Unify the stochastic playtest persona campaign on the shared eval schema;
  never a blocking gate. Covers REQ-141m.
- Define the nine analytic lenses and a mutation-audit catch rate in the spec
  first — both are currently undefined — then implement. Covers REQ-050.

## Holosuite II — adversarial + differential tiers
- Implement T3 adversarial and T4 differential tiers, scoped against existing
  coverage (test-security, test-limits, test-persistence,
  test-persistence-guardrails, PB S13/S17/S20/S25/S29). Covers REQ-001,
  REQ-002, REQ-032, REQ-041, REQ-050, REQ-450.
- Close or disposition the seven Pattern Buffer follow-on sub-workflows (S15,
  S21, S23, S24, S25, S27, S33) and the S10/S11 stubs.
