# Review — U7: reference appendices and registries

67 verdict rows, one per budget unit in `plan.md`. A row is settled when its
claim is resolved against its predicate. Verdicts: `PASS`, `DEFECT` (a finding
with an ID), `builder-side` (terminal, with a reason recorded here and in the
AAR), `external-skill` (terminal, reason recorded).

Verdict vocabulary inherited from `docs/plans/2026-11-15-unscoped-u6/review.md:3-5`.
A predicate is the `file:line` of the condition, never a gate's emitted message
(`spec/audit/review-register.md:9-10`).

**Method note (deviation from `plan.md`, recorded here and in the AAR).** The
plan's sample rule resolved a sampled ID with
`grep "^\*\*REQ-<id> " spec/02-requirements.md`. REQs are defined across
`spec/02-requirements.md`, `spec/03-build.md`, `spec/07-independent.md` and
`spec/08-synthesis.md`, so the narrow path produced three false misses on the
first pass (REQ-299, REQ-141g, REQ-208a — all `spec/03-build.md:850,1338,1363`).
The sample was re-run over `spec/*.md`; every sampled ID then resolved. The
narrower path would have manufactured three DEFECTs, so the widening is recorded
as process finding **U7-F5**.

**Block sample (E).** 133 sampled rows (stride 10 per block, ≤10 per block).
Against `spec/*.md` every sampled ID resolves to a REQ header and every stamp
resolves to a `CHANGELOG.md` heading except the thirteen rows settled as U7-F2.
**Block sample (F).** 79 sampled rows across the eight blocks; every cited REQ
resolves. Gate evidence for both: `npm run validate` → exit 0, `0 error(s), 296
warning(s)`, `PASS: Appendix E manifest contains 1324 REQ rows`, `PASS: No
dangling citations or orphan REQs`, `PASS: Every harness title ID resolves to
the Appendix F catalogue`, `PASS: Coverage register is current`.

## Phase 1 — requirements and test catalogues

| Row | Unit | Predicate | Verdict | Tier |
|---|---|---|---|---|
| R1 | E lead-in, shape, columns, ID grammar | `spec/appendices-reference.md:95-102` states the §5 authority, the three columns, and the CalVer-matches-CHANGELOG contract | PASS | — |
| R2 | E rows 1–166 | sample 10 of 166; IDs resolve in `spec/*.md`, stamps resolve in `CHANGELOG.md` | PASS | — |
| R3 | E rows 167–332 | sample 10; same | PASS | — |
| R4 | E rows 333–498 | sample 10; same | PASS | — |
| R5 | E rows 499–664 | sample 10; same | PASS | — |
| R6 | E rows 665–830 | sample 10; same | PASS | — |
| R7 | E rows 831–996 | sample 10; same | PASS | — |
| R8 | E rows 997–1,324 | sample 10; the block holds U7-F2's thirteen rows | DEFECT U7-F2 | P0 |
| R9 | Stamp attribution | `git log -1 --format=%cs -L '/^\*\*REQ-<id> /,/^\*\*REQ-/':spec/02-requirements.md` on the sample; thirteen rows pinned 2026-10-19 while `CHANGELOG.md` has no 2026-10-19 entry and the owning release is `## 2026-10-20 — Tool Surface Contract` (`CHANGELOG.md:4260`), and `git log -L` puts the REQ-567 family's last change at 2026-10-20 (`012c491`) | DEFECT U7-F2 | P0 |
| R10 | E ↔ §5 cross-reference and coverage register | `npm run validate` → `PASS: No dangling citations or orphan REQs`, `PASS: Coverage register is current` | PASS | — |
| R11 | F lead-in rules | `:1430-1447` — retired-ID list, suffixed-branch rule, no zero padding, runnable-script duty; every retired ID named there is absent from the catalogue (grep over the 769 rows) | PASS | — |
| R12 | F rows 1–97 | sample 10; every cited REQ resolves | PASS | — |
| R13 | F rows 98–194 | sample 10; same | PASS | — |
| R14 | F rows 195–291 | sample 10; same | PASS | — |
| R15 | F rows 292–388 | sample 10; same | PASS | — |
| R16 | F rows 389–485 | sample 10; same | PASS | — |
| R17 | F rows 486–582 | sample 10; same | PASS | — |
| R18 | F rows 583–679 | sample 10; same | PASS | — |
| R19 | F rows 680–769 | 9 samples (90 rows); same | PASS | — |
| R20 | F ↔ harness resolution, orphans, ratchet | `npm run validate` → `PASS: Every harness title ID resolves to the Appendix F catalogue`; orphan REQ sweep also PASS at `:349`; the assertion-miss count did not rise | PASS | — |

## Phase 2 — tool-surface appendices

Four surface gates run before these rows: `check-tool-surface`, `tool-definitions-lint`,
`check-tool-definitions-sync`, `tool-citation-check` — each exit 0.

| Row | Unit | Predicate | Verdict | Tier |
|---|---|---|---|---|
| R21 | T lead-in: four categories, §5.19 canonical enumeration, DECISIONS duty | `:3451-3471`; the canonical list is REQ-407 (Appendix E row, `spec/02-requirements.md` body); the help-category duty is recorded at `holonovel/DECISIONS.md:884` | PASS | — |
| R22 | T.1 six formats and the `[INVALID_INPUT]` rule | `:3472-3491`; REQ-425b resolves; `markdown` default and mandatory/optional split stated | PASS | — |
| R23 | T.2 dimensions, hard gates, tier bar | `:3492-3520`; `npm run check-tdqs-scoreboard` exit 0 — captures carry the six weights, the tier thresholds, and no tier below B | PASS | — |
| R24 | T.2 coherence, disambiguation, shadowing | `:3521-3552`; `holonovel/tool-disambiguation.json` carries `axes` + `clusters`, and `tool-definitions-lint` validates every axis against a live tool | PASS | — |
| R25 | T.3 contract: groups, phases, declaration fields | `:3553-3654`; `holonovel/tool-surface-registry.json` `taxonomy` is exactly the appendix's vocabularies — groups `table|explore|resolve|narrate|lookup|referee|author|maintain`, phases `none|setup|scene|combat|downtime|closed`, mutation classes `read|write|destructive|idempotent` — and `check-tool-surface` exit 0 | PASS | — |
| R26 | O lead-in | `:3058-3062` points at §5 and §7.3; both resolve | PASS | — |
| R27 | O.2 ten error categories | raise sites in `holonovel/src`: `[FORBIDDEN]` 24, `[NOT_FOUND]` 16, `[INVALID_INPUT]` 20, `[STATE_CONFLICT]` 41, `[RULE_VIOLATION]` 1, `[REJECTED]` 3, `UNIMPLEMENTED` at `holonovel/src/world/parser.ts:131` and `holonovel/src/index.ts:2581`, `AMBIGUOUS` in the corrective-action map at `holonovel/src/index.ts:3420`. `MISSING_PARAM` and `SYSTEM` have no raise site; both are legal — `SYSTEM` is protocol-level and O.2 states it carries no corrective action, and `MISSING_PARAM` is a catalogued category the current host does not emit. No contradiction, so no DEFECT; recorded as P3 | PASS | P3 |
| R28 | O.1 roll transparency | `:3083-3105`; the envelope it shows is the REQ-003 contract, and `[OK] Total:` composition is exercised by T91/T138 | PASS | — |
| R29 | O.9 structured results | `:3106-3120`; field sets resolve to REQ-548a/c/d and REQ-312e, and every registered tool declares an output schema (`check-tool-definitions-sync` exit 0) | PASS | — |
| R30 | O.10 codex adventure payload | `:3121-3134`; REQ-321f resolves in Appendix E and the payload fields match the adventure handler's declared output schema | PASS | — |
| R31 | O.8 lookup completeness | `:3135-3157`; T47 asserts the full-stat-block rule | PASS | — |
| R32 | O.11 tuning and O.12 constants | `:3158-3210`; sampled against the implementation — the 4 MB ceiling is `holonovel/src/index.ts:14966`, the 0.90 recall floor is `holonovel/scripts/test-memory-recall.ts:293`, and REQ-571's 90%/10% ratios are the T.3 measurement contract | PASS | — |
| R33 | O.13 divergence contracts | `:3211-3234`; REQ-629/630/632 resolve and the predicate families match the memory-cue tables the recall harness scores | PASS | — |

## Phase 3 — reference appendices

| Row | Unit | Predicate | Verdict | Tier |
|---|---|---|---|---|
| R34 | D handshake and capabilities | `:53-67`; the server advertises tools, resources, and prompts; no `listChanged` and no `resources.subscribe` appear in `holonovel/src` (the only `subscribe` is the internal event bus, `holonovel/src/core/event-hub.ts:24`) | PASS | — |
| R35 | D `tools/call` and output schemas | `:68-80`; error-as-`result`+`isError` is the REQ-001 contract; output schemas gated by `check-tool-definitions-sync` | PASS | — |
| R36 | D resources, prompts, offline, gated states, MCP Apps | `:81-94`; resource URIs, the five prompts, REQ-023's single user-role message, REQ-051 and REQ-426c all resolve; the gate classes are exercised by S6/S19 | PASS | — |
| R37 | G lead-in and G.1 | `:2220-2290`; the capability tables name verification methods and the DECISIONS duty; the `waived`/`pending` dispositions match §6.4's artifact rules | builder-side | P3 |
| R38 | G.2 progressive sampling | `:2291-2325`; the phases, thresholds (≥70% trial, ≥90% per type) and artifact dispositions are builder duties — no repository artifact consumes them | builder-side | P3 |
| R39 | G.3 PDF protocol | `:2326-2378`; hidden-layer, column, drop-cap, encryption, table, multi-page, image and OCR duties; G0a exists as the gate they feed (`spec/03-build.md:189`) | builder-side | P3 |
| R40 | G.4 HTML protocol | `:2379-2426`; dynamic-content, chrome stripping and fingerprinting, pagination, classification and the scrape protocol; the defaults it states (depth 3, budget 200, 1 s spacing, 30 s timeout) are converter-side | builder-side | P3 |
| R41 | G.5 structured fidelity report | `:2427-2440`; the report is a DECISIONS table, so nothing in the tree enforces it | builder-side | P3 |
| R42 | G.6 cross-converter verification | `:2441-2477`; second-converter diff, `[single-converter]` finding, the pin, and the fidelity metric definition | builder-side | P3 |
| R43 | H blocking checklist (13 items) | `:2478-2501`; a discovery-time checklist over converted rulesets — no repository artifact is a converted source | builder-side | P3 |
| R44 | H informational items (7) | `:2502-2519`; same, plus the converted-source trio | builder-side | P3 |
| R45 | I ruleset catalogue (12 rows) | `:2520-2541`; the operator-supplied class Appendix U defines, not vendored content — consistent with U's "no OGL content ships from this repository" | PASS | — |
| R46 | J anti-slop synopsis (18 rows) | `:2542-2569`; surfaced at `guidance://<badge>/anti-slop` per REQ-070, and the catalogue is the spec-embedded subset the Synthesis workflow elaborates | PASS | — |
| R47 | K structural conventions | `:2570-2609`; required headings, the optional `## World` and `## Preview`, and the preview-derivation rule (REQ-292) | PASS | — |
| R48 | K annotation format | `:2610-2656`; `@encounter`/`@trap` clauses resolve to REQ-622/622a/622b, `@npc` to REQ-079d/129b1, `@lore` to REQ-328 | PASS | — |
| R49 | K provenance block, example, adventure index | `:2657-2764`; the provenance keys resolve to REQ-616/617, the content-hash and signature rules state their failure modes, and `npm run check-adventure-index` exit 0 gates the module index and DECISIONS table | PASS | — |
| R50 | L lorebook interchange | `:2765-2783`; the ten metadata fields, both formats, and the merge/replace/dry-run import modes resolve to REQ-094 and the §6.5 round-trip check | PASS | — |
| R51 | P lead-in and STRIDE table | `:3235-3264`; the appendix declares itself a reference analysis with `_Check:_ None`, and its gaps name their owning REQs | PASS | — |
| R52 | P.1 OWASP crosswalk (32 rows) | `:3265-3294`; every `New-REQ →` target (REQ-444…449) resolves in Appendix E; LLM08 is explicitly N/A | PASS | — |
| R53 | Q interchange contract | `:3295-3340`; the key inventory, the `manifest` object, and the `integrity` object resolve to REQ-092/096/096j/241/601 | PASS | — |
| R54 | Q round-trip and fingerprint consequence | `:3341-3352`; round-trip preserves `integrity.state_hash` (T100, T694), and `scripts/lib/contract-fingerprint.ts:42` puts `## Appendix Q:` in `DATA_SECTIONS` — this increment did not edit Q, so V7 is clean | PASS | — |
| R55 | R deprecated terminology (21 rows) | `:3353-3389`; the audit duty names Convergence Phase 2's Surface Terminology domain and each row cites its canonical-term REQ | PASS | — |
| R56 | S builder glossary | `:3390-3450`; the borrowed-mechanics list names each source, and each entry's license row exists in Appendix U (BitD, Starforged, Fate, Ironsworn, Inform) | PASS | — |

## Phase 4 — content licences

| Row | Unit | Predicate | Verdict | Tier |
|---|---|---|---|---|
| R57 | U lead-in and README-footer duty | `spec/appendices-licenses.md:3-5`; the §6.4 render duty resolves | PASS | — |
| R58 | U's 13 rows ↔ ATTRIBUTION register | the two source sets are equal: 13 = 13 (`docs/licenses/ATTRIBUTION.md:14-26`), including COF, whose license cell ATTRIBUTION spells more precisely ("CC BY 4.0 (spec) / CC0 1.0 (schemas)") than U ("CC BY 4.0 / CC0 1.0"). Not a contradiction — U delegates precision to ATTRIBUTION — so recorded as P3, not a DEFECT | PASS | P3 |
| R59 | U's three admission rules | (a) LICENSE files: present for the vendored rows; (b) `source_url`: **absent** — `holonovel/narrative_world_model/MANIFEST.md` records eight vendor sources with no URL column at all (`grep -c http` = 0), while four of the eight appear with `source_url` only in `holonovel/src/core/wisdom.ts:82-113`; (c) borrowed-mechanics code citations: present in Appendix S | DEFECT U7-F4 | P1 |

## Phase 5 — assets and records

| Row | Unit | Predicate | Verdict | Tier |
|---|---|---|---|---|
| R60 | `tool-definitions.json` | `tool_count` = 37 = `tools.length`; the registry's 41 distinct tool prefixes are 37 live tools plus the four retired compatibility declarations (`manage_session`, `resolve_fate`, `resolve_forged`, `resolve_ironsworn`) that `hidden_aliases` records with `retired: true` — exactly what T.3 excludes from canonical counts | PASS | — |
| R61 | `tool-surface-registry.json` | `taxonomy` equals T.3's vocabularies; `npm run check-tool-surface` exit 0 over 299 actions | PASS | — |
| R62 | `tool-disambiguation.json` | `tool-definitions-lint` exit 0 — every axis names a live tool, every cluster member has an axis | PASS | — |
| R63 | `tool-routing.json` | `check-tool-surface` exit 0 and `tool-citation-check` exit 0 — routing entries resolve to registered actions | PASS | — |
| R64 | `mcp-server.schema.json` + `PROVENANCE.md` | the schema's `$schema` matches `holonovel/server.json`'s, and PROVENANCE records the source URL, schema version `2025-12-11`, byte count 22,090, sha256 and refresh procedure | PASS | — |
| R65 | `server.json` + `glama.json` | `npm run check-server-manifest` exit 0; `glama.json` is a 4-line maintainer declaration and carries no version surface to drift | PASS | — |
| R66 | DECISIONS records T requires | tool budget `holonovel/DECISIONS.md:5` (37 listed), description budget `:7` (1000 bytes), help-category mapping `:884` | PASS | — |
| R67 | TDQS captures | `npm run check-tdqs-scoreboard` exit 0; every captured tool tier is at or above B | PASS | — |

## Rows by verdict

- **PASS — 60** (R1–R7, R10–R26, R28–R36, R45–R58, R60–R67).
- **builder-side — 9** (R37–R44), reason: a builder duty the reference host does not
  execute (source conversion, its fidelity sampling, and ruleset preparation).
  Recorded in the AAR as a record-and-close note.
- **DEFECT — 2**: U7-F2 (fixed in place, P0), U7-F4 (scheduled, P1).
- **P3 record-and-close — 3 notes inside PASS rows** (R27, R37–R42's reason class,
  R58): no action; recorded in the AAR.

## Prose fixes applied (6.2)

| Unit | Before | After |
|---|---|---|
| Appendix E, thirteen rows (REQ-567/568/570/571/572/573/574/575/576/577/579/580/581) | `2026-10-19` | `2026-10-20` — the date of the owning `CHANGELOG.md` entry and of the family's last change (`012c491`) |

No other appendix line changed, so `spec/appendices-licenses.md` is untouched and
Appendix Q's fingerprint is untouched (V7).
