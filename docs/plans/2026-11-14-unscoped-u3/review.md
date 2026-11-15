# U3 review — runtime conventions and the engine-contract remainder

Increment: `docs/plans/2026-11-14-unscoped-u3/` · Reviewed at HEAD `bc86264`
Unit: one row per §7 heading (with §7.7 split into four predicate-bearing
blocks), per engine-contract block, and per named code module (`D1`).
Verdict vocabulary (`D2`): `holds` · `finding:<ID>` · `builder-side` ·
`already-reviewed:<chunk>`. Finding IDs are `F-U3-<n>` in row order.

## Mapping table

| Consumer | Anchor | Severity |
|---|---|---|
| `checkCouplingCompleteness` | `scripts/validate.ts:1049-1206` | error (orphan rule `:1170`), warning (undefined rule `:1173`) |
| `checkConfigCouplingAnnotations` | `scripts/validate.ts:1273-1328` | error |
| §7.7 archetype vocabulary | `scripts/validate.ts:1051` | warning (`:1090`, property table only) |
| `action-conflicts --check` | `scripts/lib/gate-manifest.ts:262-265` | error |
| `check-tool-surface` | `scripts/lib/gate-manifest.ts:177-181` | error |
| `surface-budget` | `scripts/lib/gate-manifest.ts:183-186` | error |
| `surface-replay` | `scripts/lib/gate-manifest.ts:189-192` | error |
| `tool-citation-check` | `scripts/lib/gate-manifest.ts:207-210` | error |
| `check:conformance` | `scripts/lib/gate-manifest.ts:256-259` | error |
| `check-fingerprint-sync` | `scripts/lib/gate-manifest.ts:159-162`; `scripts/lib/contract-fingerprint.ts:37-43` | error |
| `build-order` | `scripts/build-order.ts:220-229` | exit 1 |
| `assemble` | `scripts/assemble.ts:48-60` | exit 1 |

**Module boundaries (not verdict rows).** `index.ts` is reviewed at its
dispatch wrapper (`:18827-18833`); its ~18,826-line body is §5's surface,
swept in sweep phase 1–8. `world/*` is the §5.9/§5.10 seam; the review covers
the §7.7-shaped contracts it exposes.

## Verdict rows

| # | Surface | Anchor | Verdict | Predicate |
|---|---|---|---|---|
| 1 | §7.1 Anchors | `spec/04-runtime.md:3-23` | finding:F-U3-1 | `holonovel/src/core/anchors.ts:18-24` strips `*…*` only; the spec's "asterisk or underscore emphasis" marker rule has no underscore branch |
| 2 | §7.1a Slugs | `:24-35` | finding:F-U3-2 | `holonovel/src/core/state.ts:1268` slugifies and trims hyphens only; no Windows-reserved-name branch and no 240-char path guard exist anywhere in `holonovel/src` |
| 3 | §7.2 Entity IDs | `:36-42` | holds | `entity://`/`roster://` templates at `holonovel/src/index.ts:14404-14410`; prefixed counters at `:3179,3210` |
| 4 | §7.3 Output contracts | `:43-74` | holds | truncation + `output://` at `holonovel/src/index.ts:3617-3636`, resource at `:14433,15936`; structured result schema in `tool-registry.ts:19-23` |
| 5 | §7.3a Narrative Freshness (builder-level) | `:75-105` | builder-side (finding:F-U3-3) | states a builder documentation duty; `holonovel/DECISIONS.md` carries no prompt-construction entry for its four clauses (grep for narrative-output/voice-profile/scene-type/anti-slop) |
| 6 | §7.4 Tool-surface conventions | `:106-117` | holds | no `delete_` tool name exists (`grep -rho '"[a-z_]*delete_[a-z_]*"' holonovel/src` → 0); annotations map enforced (holonovel/AGENTS.md "Tool annotations") |
| 7 | §7.5 Decisions and workflows | `:118-126` | holds | `holonovel/src/index.ts:3326-3345` caps at 25 with `cancel` last; pending-workflow freeze at `:4219` |
| 8 | §7.6 Configuration surface | `:127-242` | holds | 101 declared variables; 97 read in `holonovel/src`; the four spec-only names are dispositioned in `holonovel/DECISIONS.md:2777-2779` (builder-side / intended gap) and `TTRPG_RULESET` is read by `scripts/lib/ruleset-build-kit.mjs` — the §7.6 rows' own annotations are gated by `checkConfigCouplingAnnotations` |
| 9 | §7.7 State tiers and property table | `:243-323` | holds | four tiers and the property table are the source `checkCouplingCompleteness` parses (`scripts/validate.ts:1070-1099`); property archetypes are warning-checked (`:1090`) |
| 10 | §7.7.0 Archetypes and pattern rules | `:324-501` | finding:F-U3-4 | P1–P61 present (61 rows); P60's target token `Surface` (`:499`) is absent from `VALID_ARCHETYPES` (`scripts/validate.ts:1051`) and the alias map (`:1054-1068`), and no predicate tests pattern tuples, so the mismatch is invisible |
| 11 | §7.7.1 / §7.7.1a coupling derivation | `:502-639` | finding:F-U3-5 | completeness is iterated over parsed rules (`scripts/validate.ts:1165-1174`), not a hardcoded range; the stated bound is wrong (row 12) |
| 12 | §7.7.1b Coupling curation | `:640-684` | finding:F-U3-5 | `:648` states "P1–P59"; §7.7.0 defines P1–P61 and §7.6/§7.7.1a cite P60/P61 (`:136,224-226,499-500,619,632`) |
| 13 | §7.8 Guidance and badge knowledge | `:685-695` | holds | three guidance URIs registered at `holonovel/src/index.ts:14422-14425`; badge gating at `holonovel/src/core/badge-gate.ts:78-79` |
| 14 | §7.9 Derived-surface algorithms | `:696-756` | holds | `bundleHashes` (`holonovel/src/index.ts:13097-13105`) matches 7.9d; HMAC input order at `:13136`; subjective scoring in `holonovel/src/core/subjective.ts:129-139` |
| 15 | engine contract §1 Vocabulary | `docs/engine-contract.md:24-33` | holds | the five terms match the code's layer names (holonovel/AGENTS.md "Layer Map") |
| 16 | engine contract §7 Adapter boundary | `:206-254` | holds | `library.ts:1-7` exports `core`/`world`/`createEngine`; `engine.ts:12-16` sets `HOLONOVEL_NO_AUTOSTART` before the dynamic import; `index.ts:18828` guards autostart |
| 17 | engine contract §8 What E3 must preserve | `:255-273` | builder-side | explicitly rationale ("not law") pending E3; no repository check is claimed |
| 18 | engine contract §9 Divergence status | `:274-286` | holds | `withForbiddenAudit` audits either envelope form once (`core/server.ts:43-76`); `future_fields` retained and re-emitted (`core/state.ts:876,1847,3249-3253`); the three Novel fields are serialized (`core/state.ts`) |
| 19 | engine contract §10 Artifact provenance | `:287-312` | holds | envelope fields and HMAC verification in `holonovel/src/rulesets.ts:185,208-224`; adventure signature at `core/adventure-provenance.ts:64` |
| 20 | engine contract appendix (13 clauses) | `:313-329` | holds | all cited REQs resolve (`REQ-032,054,030,040a,133,574,577,237,336,351,050,050b,050c,601,602,603,604,605,455-460,092a-h2,238,096,446,615-619`); `library.ts` and `package.json` exports exist |
| 21 | `core/server.ts` | `holonovel/src/core/server.ts` | holds | badge gating (`:22-36`) and either-form forbidden audit (`:43-76`) implement engine-contract §2/§9 |
| 22 | `rulesets.ts` | `holonovel/src/rulesets.ts` | holds | package refusal on hash/signature (`:185,208-224`); `TTRPG_RULESETS` eager hydration (`:351`) matches §7.6 |
| 23 | `tool-registry.ts` | `holonovel/src/tool-registry.ts` | holds | single definition site with output schema (`:5-6,19-23`), pacing/raw split (`:30-34`), idempotent bind (`:78-83`) |
| 24 | `surface-report.ts` | `holonovel/src/surface-report.ts` | holds | pure surface conformance derivation (REQ-568) consuming the same registry type as `surface-projection.ts` |
| 25 | `core/surface-projection.ts` | `holonovel/src/core/surface-projection.ts` | holds | `full`/`standard`/`small` profiles match §7.6's `TTRPG_SURFACE_PROFILE` row and the `surface-*` gates |
| 26 | `world/index.ts` + `world/model.ts` | `holonovel/src/world/` | holds | exports `WORLD_MODEL_KINDS`, property contracts, `worldMap`, `worldKinds`, `BASE_PARSER_COMMANDS` (`world/index.ts:1-24`); kind table at `world/model.ts:5` |
| 27 | `world/parser.ts` | `holonovel/src/world/parser.ts` | holds | command dispatch and resolver implement the §5.10 seam §7.7's World row cites |
| 28 | `index.ts` dispatch wrapper | `holonovel/src/index.ts:18827-18833` | holds | autostart guard is the engine-contract §7 seam; wrapper comment names the library contract |

## Findings

### F-U3-1 — §7.1's role-marker rule outruns the anchor deriver (P1)

Predicate: `holonovel/src/core/anchors.ts:18-24` removes asterisk emphasis
(`.replace(/\*[^*]+\*/g, "")`) but has no underscore branch; `_GM only_`
therefore survives as the derived anchor `gm-only` instead of being stripped.
`spec/04-runtime.md:18-20` states "asterisk or underscore emphasis". The code's
own header (`anchors.ts:4-6`) names only the asterisk forms, so the spec is
broader than the implementation. Code fix (out of a review increment) →
`Scheduled-roadmap`.

### F-U3-2 — §7.1a's slug rules are unimplemented (P1)

Predicate: `holonovel/src/core/state.ts:1268` builds a slug with
`toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")` and nothing
else. `spec/04-runtime.md:29-34` requires Windows-reserved-name avoidance
(CON, PRN, AUX, NUL, COM1–COM9, LPT1–LPT9), a 240-character path ceiling, and
hyphen trimming (the last is implemented). No reserved-name or path-length
branch exists anywhere in `holonovel/src` (`grep -rn 'COM1\|LPT1'` → 0).
→ `Scheduled-roadmap`.

### F-U3-3 — §7.3a's builder documentation duty is unmet (P1)

Predicate: `spec/04-runtime.md:102-104` requires builders to document prompt
construction per clause in `DECISIONS.md`; `holonovel/DECISIONS.md` has no such
entry (grep for narrative-output, voice-profile, scene-type, and anti-slop
yields only unrelated rows). The reference implementation is the builder, so
the duty is unfulfilled until the entry exists. → `Scheduled-roadmap`.

### F-U3-4 — P60's target token is outside the archetype vocabulary (P1)

Predicate: `spec/04-runtime.md:499` reads `Session → Surface`;
`scripts/validate.ts:1051` defines twelve archetypes and `:1054-1068` has no
`Surface` alias. The coupling row that cites P60 is `[non-property]`
(`:619`), which is exempt from archetype matching (`scripts/validate.ts:1181`),
and no predicate compares pattern tuples to the vocabulary — so the mismatch
cannot be caught by any gate. Either `Surface` is a missing archetype or P60's
target should be an existing one; the choice is normative. →
`Scheduled-roadmap`.

### F-U3-5 — the pattern-rule range is stale in seven places (P0, fixed)

Predicate: §7.7.0 defines P1–P61 (`spec/04-runtime.md:339-500`), §7.6 cites
P60/P61 (`:136,224-226`), and §7.7.1a cites both (`:619,632`), while seven
sites still bound the set at P1–P59: `spec/04-runtime.md:648`,
`spec/01a-constitution.md:116`, the REQ-369a body
(`spec/02-requirements.md:3811`) and the REQ-370a body (`:3816`), and Appendix T
rows at `spec/appendices-reference.md:1880`, `:1881`, `:1894`. Fixed in this
increment as one atomic edit; the range becomes P1–P61 everywhere.
