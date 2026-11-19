# Presence matrix — builder-side handoff evidence

Measured 2026-11-18 at HEAD `a687660`, before any edit. Columns: the workflow,
the criterion it must satisfy, the candidate command, whether that command
actually exercises the criterion, the record present today, and the P2 decision.

## Baseline inventory

| Check | Result |
|---|---|
| `grep -c "@section " holonovel/DECISIONS.md` | `1` (the G7 evidence marker at `:2612`); `@section intake`, `versions`, `traceability`, `normalizations`, `waivers`, `audit`, `task-list` all absent |
| `grep -c "^## " holonovel/DECISIONS.md` | `18` topic-dated headings, none numbered (1)-(6) |
| `grep "ruleset-free — no source" holonovel/DECISIONS.md` | absent |
| `test -e holonovel/RULESET_MODEL.md` | exit 1 (ruleset-free build) |
| `ls -d holonovel/testdata/rulesets/*/` | one package: `fixture/` |
| `grep -n "built against" holonovel/{README,AGENTS,DECISIONS}.md` | no version-comment line in any handoff artifact; only prose at DECISIONS.md:3328 |
| `grep -rn "roll_attack" holonovel/src` | no match |
| `npm run check-performance-record` | PASS, scope `reference-host` (REQ-586) |
| `npm run check-tool-surface` | PASS, 300 actions, ~29,922 catalog tokens |

## Redaction ranges (§10 item (6))

- **Range A:** `holonovel/DECISIONS.md:2610-2713` — the G7
  `#### narrative_coherence (G7)` heading through the `<!-- g7:end -->` line
  (`:2712`), ending before the `### Holonovel Spec Update` heading at `:2714`.
- **Range B:** the `## Verification workflow evidence` heading appended at EOF
  through the `<!-- evidence:end -->` sentinel written as its last line.

## G workflows

| Workflow | Criterion | Candidate command | Exercises criterion? | Record today | P2 decision |
|---|---|---|---|---|---|
| G0a | §8 structural integrity; ruleset-free exemption | `test -e holonovel/RULESET_MODEL.md` | yes (absence is the exemption) | none | record `pass`, "no ruleset — skipped" (spec/05-verification.md:29-34) |
| G0b | §8 MCP conformance, Appendix D checklist | `npm --prefix holonovel run test:package-smoke` | partial (MCP handshake only, not the checklist) | none | finding: no full runner |
| G2 | §8 golden transcript replay, Appendix W.3 | none | no (`test-backfill` T261 cases are parser checks, not a replay) | none | finding: no replay runner |
| G3 | §8 injection over Appendix C | `npm --prefix holonovel run test:security` | partial (REQ-444 import channel only) | none | finding: partial coverage |
| G4 | §8 derived tests, Appendix F | `npm --prefix holonovel run test:all` | yes (56-command suite) | none | record `pass` with the suite result |
| G5 | §8 Holonovel Pattern Buffer | `npm --prefix holonovel run test:pattern-buffer` | yes | none | record `pass` with the manifest verdicts |
| G6 | §8 synthesis lifecycle | `npm --prefix holonovel run test:supplementary` | partial (import only; no revert/status/isolation) | none | finding: partial coverage |
| G7 | §8 narrative coherence, REQ-346 | — | — | yes (`:2610-2713`) | untouched |
| G8 | §8 cross-ruleset isolation | `npm --prefix holonovel run test:ruleset-nonovel` | partial (no-Novel access, not cross-ruleset rejection) | none | finding: partial coverage |

## Handoff steps

| Step | Criterion | Candidate command | Exercises criterion? | Record today | P2 decision |
|---|---|---|---|---|---|
| H1 | (1) intake vs package set; ruleset-free entry | `grep` (1) markers and the entry | no — (1) absent | none | finding: no (1) and no ruleset-free entry |
| H2 | (3) traceability table, Appendix E | `grep -c "^| REQ-"` | no — no Appendix E table | none | finding: no (3) |
| H3 | non-fixture source literal scan | none (`check-reference-server-cleanliness` is a content boundary, not a literal scan) | no | none | finding: no runner |
| H4 | `tools/list` on a target ruleset | none — ruleset-free build has no target | no | none | finding: no target ruleset |
| H5 | no `roll_attack`/generic combat resolver | `grep -rn "roll_attack" holonovel/src` | yes | none | record `pass` |
| H6 | waived tests cite (5) | `grep` (5) markers | no — (5) absent | none | finding: no (5) |
| H7 | no post-startup Markdown reads | none | no | none | finding: no instrumented runner |
| H8 | NEED_INPUT does not auto-complete | `npm --prefix holonovel run test:workflow` | partial (lifecycle only) | none | finding: partial coverage |
| H9 | player badge cannot reach GM content | `npm --prefix holonovel run test:output-contracts` | partial (REQ-064 boundary, not the H9 procedure) | none | finding: partial coverage |
| H10 | health confidence + MUST coverage + performance record | `npm run check-performance-record` | partial (performance record only; confidence skipped by Rule 9; MUST coverage unmeasured) | none | record `fail`, naming the measured part and the unmeasured part |
| H11 | launch from README client config | `npm --prefix holonovel run test:package-smoke` | partial (handshake, not the README entry) | none | finding: partial coverage |
| H12 | cold-checkout G2 replay | none — prerequisite G2 unrecorded | no | none | finding: prerequisite G2 |
| H13 | artifact version comments + Pattern Buffer manifest | `grep "built against"` + G5 manifest | yes (both checks) | none | record `fail`: no version comments |
| H14 | four-artifact diet | `test -e holonovel/RULESET_MODEL.md` | yes | none | record `fail`: `RULESET_MODEL.md` absent |
| H15 | `tools/list` with packages loaded | `npm run check-tool-surface` | partial (counts only, not per-tool prefix/annotation) | none | record `fail`, build-mode reason |
| H16 | create a Novel per ruleset | none — one package, no ruleset | no | none | record `fail`, build-mode reason |
| H17 | cross-ruleset call rejection | none — needs two rulesets | no | none | record `fail`, build-mode reason |
| H18 | per-ruleset search/lookup isolation | none — needs rulesets | no | none | record `fail`, build-mode reason |

## Outcome summary

- Records to write (11): G0a, G4, G5, H5, H10, H13, H14, H15, H16, H17, H18.
- Findings for the AAR (15): G0b, G2, G3, G6, G8, H1, H2, H3, H4, H6, H7, H8,
  H9, H11, H12.
- Untouched (1): G7.
