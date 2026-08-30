# DECISIONS.md — holonovel MCP Server

**Spec hash:** badbb571e21de4a076523b3b800aa312e5b8e4db409910e4cb0ca2c2c6ad397f

### Holonovel Server Change — 2026-08-29 (REQ-087b scene_type surface reconciliation)

| Field | Value |
|-------|-------|
| Delta class | minor |
| Changed | implementation only — removed the un-mandated `set_scene_type` tool; added `scene_type` (single tag or array) to `set_scene_state` per REQ-087b; updated help categories, the scene-transition counter, and the affected harnesses (run_gauntlet I13, test-output-contracts T476, test-persistence-guardrails T476); fixed a stale `set_briefing_order` token fixture in run_gauntlet I13 |
| Reused | spec, extraction, lockfile |
| Verification | typecheck 0 errors; test-output-contracts 172/172; test-persistence-guardrails 10/10; run_gauntlet 13/13; remaining harnesses green (backfill 64, narrative 32, persistence 16, workflow 12, character-creation 10, adventure 9, g7 2); validate:fast 0 errors (A=0, B=0, C=275, E=106) |

### Holonovel Spec Update — 2026-08-29 (self-consistency remediation + Spec Kit phased-artifact adoption)

| Field | Value |
|-------|-------|
| Delta class | editorial |
| Changed | spec only — REQ-313/314 fingerprint-block check coverage repaired (single T497 cited across all eight sub-REQs); REQ-321g/h severed-sentence repair; H1–H18 handoff counts reconciled; Phase 1 convergence-metric count to eleven; G0→G0a/G0b disambiguation; AGENTS.md REQ-shape limits aligned; prose fixes (REQ-030, REQ-073c3, REQ-310d, REQ-165a, REQ-3024, REQ-052); Spec Kit phased-artifact model adopted (constitution extraction, plans/ convention); spec hash → badbb571 |
| Repaired REQ set | REQ-313a–d, REQ-314a–d, REQ-321g, REQ-321h, REQ-211a, REQ-148, REQ-149, REQ-030, REQ-073c3, REQ-310d, REQ-165a, REQ-3024, REQ-052 |
| Reused | server, extraction, tooling |
| Verification | assemble + check:fast 0 errors |

### Holonovel Spec Update — 2026-08-29 (terminology consistency sweep)

| Field | Value |
|-------|-------|
| Delta class | minor |
| Changed | spec only — legacy "enrichment" retired for "synthesis" across spec + test catalogue; seven synthesis modules counted consistently (REQ-160b, REQ-225); provenance tier reconciled to `[ruleset]`/`[vendor]`/`[supplementary]`, removing the `[novel]` tag and the `tier=` parameter (REQ-260a); stale identifiers corrected: `dm_context`→`gm_context` (REQ-232a), `listNovels`→`list_novels` (REQ-117), `toggle_synthesis_module` (REQ-231); removed the undefined `set_scene_type` tool reference (REQ-335a, T436); `TTRPG_WORLD_PROMINENCE` default → `visible` (REQ-309) |
| Reused | server (renames already applied 2026-08-21), extraction, tooling |
| Verification | assemble + check:fast 0 errors |

### Holonovel Spec Update — 2026-08-29 (Appendix M convergence-metric ownership convention)

| Field | Value |
|-------|-------|
| Delta class | editorial |
| Changed | spec only — Appendix M authoring checklist gains a convergence-metric ownership item (host-owned `host-verified` vs package-owned runs-fresh); spec hash → f5f637e8 |
| Reused | server, extraction, tooling |
| Verification | assemble + check:fast 0 errors |

### Holonovel Spec Update — 2026-08-29 (host-owned metric disposition + enrichment artifact-scope)

| Field | Value |
|-------|-------|
| Delta class | editorial |
| Changed | spec only — §6.5 host-owned metric disposition (archetype coverage, coupling derivation, resource URI completeness, truncation accuracy, narrative coherence recorded `host-verified` per REQ-245b); REQ-245b/244b carve-out; REQ-080b/371a/371b + §6.3/§7.7.0 scope runtime Wisdom enactment to host-carried vendor content, ruleset-native items artifact-scope; §8 G6, §6.6 S33, T422/T428 re-scoped; T495/T496 added; spec hash → 9ebd2337 |
| Reused | server, extraction, tooling |
| Verification | assemble + check:fast 0 errors; check:full 0 errors; validate:sdd 0 errors; typecheck 0 errors; check-traceability clean |

### Holonovel Spec Update — 2026-08-24 (Wave 1: §5.1 output contracts + T26 mapping)

| Field | Value |
|-------|-------|
| Delta class | minor |
| Changed | spec only — Appendix F T26 row gains REQ-071 (REQ-071b already cited T26); spec hash → 16ef3ca4 |
| Reused | server, extraction, tooling |
| Verification | assemble + check:fast 0 errors; all harnesses green (test-output-contracts 19/19); register §5.1: REQ-003/004/060/061/064/070/071/113/118/184/194/280 → C, REQ-101/277 → E |

### Holonovel Spec Update — 2026-08-24 (Wave 11 terminal: T494 mapping)

| Field | Value |
|-------|-------|
| Delta class | minor |
| Changed | spec only — Appendix F gains T494 (pending-workflow staleness, REQ-193); spec hash → 399d4b04 |
| Reused | server, extraction, tooling |
| Verification | assemble + check:fast 0 errors; all harnesses green (test-output-contracts 172/172); `--impl-audit=strict` passes with 0 errors (A=0, B=0, C=275, E=106) |

### Holonovel Server Change — 2026-08-24 (Wave 11: session recap, boundary advisory, ruleset citations)

| Field | Value |
|-------|-------|
| Delta class | minor |
| Changed | implementation only — §5.1: truncation + output:// (REQ-004), source quoting + source_anchor (REQ-061/280), roll transparency (REQ-003), briefing orientation layer (REQ-064/070/071), anti-slop resource (REQ-184), result counts (REQ-113), prompt budget (REQ-118), `core/anchors.ts` (REQ-194) |
| Reused | spec, extraction, tooling |
| Verification | typecheck 0 errors; test-output-contracts 19/19; all other harnesses green; check:fast 0 errors; register §5.1 12 REQs → C |

### Holonovel Server Change — 2026-08-24 (§5.9 persistence additions)

| Field | Value |
|-------|-------|
| Delta class | minor |
| Changed | implementation only — §5.9: `update_novel_description` (REQ-259), `set_genre` + `active_genre` (REQ-294), Novel archive `archive_novel`/`unarchive_novel`/`list_novels filter`/`archived_novels` (REQ-334), REQ-117 trash-retention citation; `test-persistence.ts` T122/T318/T339/T381 |
| Reused | spec, extraction, tooling |
| Verification | typecheck 0 errors; test-persistence 16/16; all other harnesses green; check:fast 0 errors; register §5.9 REQ-117/259/294/334 → C |

### Holonovel Server Change — 2026-08-24 (§5.4 decision workflows + §6.6 mapping)

| Field | Value |
|-------|-------|
| Delta class | minor |
| Changed | spec (§6.6 adds REQ-192 → S22 mapping row) + implementation (`respond` `!pw` → `[STATE_CONFLICT]` per REQ-192 collision; REQ-190/191/140 citations; `test-workflow.ts` T138/T32/S22 drain, display-label, collision tests; `test-persistence.ts` T158 end-novel dispatch) |
| Reused | extraction, lockfile |
| Verification | typecheck 0 errors; workflow 12/12; persistence 12/12; all other harnesses green; check:fast 0 errors; register REQ-190/191/192/140 → C |

### Holonovel Server Change — 2026-08-24 (§5.19 persistence guardrails)

| Field | Value |
|-------|-------|
| Delta class | minor |
| Changed | implementation only — §5.19 State Persistence Guardrails (REQ-400–407): persistence directive + persist-tools in GM briefing, `state_ledger` token, session no-mutation detection, state-drift gate (`TTRPG_STATE_GATE`), roll-to-commit coupling, auto-moment on transitions, backup-regression visibility; new `test-persistence-guardrails.ts` (T469–T476) |
| Reused | spec, extraction, tooling |
| Verification | typecheck 0 errors; test-persistence-guardrails 10/10; all other harnesses green (narrative 32/32, backfill 64/64, persistence 11/11, adventure 9/9, workflow 9/9, character 10/10, g7 2/2); check:fast 0 errors; register §5.19 8/8 → C |

### Holonovel Spec Update — 2026-08-24 (coverage triage + §5.12 backfill)

| Field | Value |
|-------|-------|
| Delta class | minor |
| Changed | spec (Appendix M REQ-body terminator convention) + tooling (`sectionNameForReq` §6 labeling; `INTENDED_GAP_REQS` +30 builder-side REQs → E) + implementation (`remove_room`/`remove_thing` snapshot-after-check fix; `test-backfill.ts` 64 tests; `test-narrative.ts` T386/T391/T397/T401/T417; `push-pipeline.sh` deploy `npm ci` + lockfile-revert guard) |
| Reused | extraction, lockfile |
| Verification | typecheck 0 errors; test-narrative 32/32; test-g7 2/2; test-persistence 11/11; test-adventure 9/9; test-workflow 9/9; test-character-creation 10/10; test-backfill 64/64; check:fast 0 errors; register B 85→6, C 56→135 |

### Holonovel Spec Update — 2026-08-24 (interchange/generation + guardrail layer)

| Field | Value |
|-------|-------|
| Delta class | minor |
| Changed | spec (`REQ-376b`/`REQ-373b` empty-body remnants removed; Appendix E rows reconciled) + tooling (`checkEmptyReqBodies` `---` terminator; `gatherExercisedIds` counts only executed test() calls; placeholder-stub sentinel scan; new-REQ-must-be-cited-or-whitelisted guard; `scripts/test-req-checks.ts` self-test) + implementation (`export_novel`/`import_novel` rewritten to Appendix Q with lossless replace round-trip incl. world/entities/npcs/countdowns; `generate_adventure`/`generate_encounter` implemented per REQ-090/091 with codex target + atomic encounter batch) |
| Reused | extraction, lockfile |
| Verification | typecheck 0 errors; test-narrative 27/27; test-g7 2/2; test-persistence 11/11; test-adventure 9/9; test-workflow 9/9; test-character-creation 10/10; run_gauntlet 13/13; check:fast 0 errors |

### Holonovel Server Change — 2026-08-24 (§5.12 narrative engine)

| Field | Value |
|-------|-------|
| Delta class | major |
| Changed | implementation only — §5.12 Narrative Architecture (REQ-335–366) server layer: scene beat taxonomy, pacing signal, story-beat arc, faction/NPC autonomy, discovered consequences, spatial surface, unified intent resolution, voice feedback, background knowledge, coupling advisories, observer surface; REQ-125 scene transition hook; knowledge_state + narrative_threads briefing sections; scaffold-replacement on GM beat (REQ-352); G7 disposition reachability (REQ-354 dropped from the §5.12 count, REQ-346 counted via attestation); new `test-narrative.ts` harness (T385–T417) + `test-g7.ts` (T396/T403) |
| Reused | spec, extraction, tooling |
| Verification | typecheck 0 errors; test-narrative 27/27; test-g7 2/2; test-workflow 9/9; test-character-creation 10/10; run_gauntlet 13/13; validate:fast 0 errors |

#### narrative_coherence (G7)

@section evidence

- **(a) implementation status** — 31 of 31 server-side §5.12 REQs `converged`/evidenced (bucket C, harnesses `test-narrative.ts` + `test-g7.ts`). REQ-354 (extended narrative extraction) is a builder-side §5.2 REQ and is excluded from the server-side count.
- **(b) badge_briefing population** — the briefing renders `Beat:`, narrative threads (pacing signal, unresolved decisions, bonds, countdowns, dispositions, coupling advisories), `Story beats`, `World in Motion`, `Knowledge state`, spatial surface, and observer orientation.
- **(c) smoke-session transcript** — the `holonovel/scripts/test-narrative.ts` harness exercises a 5+ turn cooperative-play sequence across beats, autonomy, world couplings, voice feedback, and coupled lore; results recorded in `spec/audit/req-coverage.md` (§5.12 rows, bucket C).
- **spec_health.narrative_coherence** — `pass` (31/31 implemented; disposition derived at runtime from `SECTION_512_REQS`/`SECTION_512_IMPLEMENTED`).

### Holonovel Spec Update — 2026-08-22 (provenance, licensing, and toolchain consolidation)

| Field | Value |
|-------|-------|
| Delta class | major |
| Changed | spec (Appendix P borrowed-mechanics provenance; Appendix U content-license reconciliation; REQ-413–417 token-efficiency contracts, REQ-418 deployment verification, REQ-419 Editorial classification; §5 sub-REQ renumbering and split; §6 phase-map consistency guard; knowledge-base cache removal; world-model provider-documentation wording) + tooling (assemble.ts, spec-delta.ts, update-server.ts, push-pipeline.sh, validate.ts/req-checks.ts, version-check.ts; removed split-long-reqs.ts) + implementation (version bump only) |
| Reused | lockfile, extraction |
| Verification | assemble 0 errors, check 0 errors (lint + validate:sdd + validate-readme), typecheck 0 errors, version-check OK, check-traceability clean |

**Consolidation reconciliation.** Nine unpublished commits advanced the spec
without a reconciled hash line, leaving the publication gate with three
divergent hashes (published `9d458fa3…`, stored `c4d9e13e…`, current
`7b14491b…`). This entry reconciles them to the current `7b14491b…`. The delta
is Major in classification — new REQ bodies and tool-surface renumbering — but
the implementation changed only by version bump: the `source`/`config`/`surfaces`
fingerprint deltas are the 2026.08.22 CalVer in `src/index.ts` and `package.json`,
not substantive server behavior. No state-model or tool-surface edit accompanied
the spec advance, so no full Pattern Buffer re-run was required beyond the
tooling set recorded above.

### Holonovel Spec Update — 2026-08-22 (publication-integrity hardening)

| Field | Value |
|-------|-------|
| Delta class | minor |
| Changed | spec (REQ-394 gate baseline + split REQ-419 Editorial classification; new REQ-418 Deployment verification; §6.7 Editorial delta row + mono-repo fingerprint wording; REQ-398 wording; REQ-107a version currency; Appendix E REQ-418/419, Appendix F T491–T493, Appendix V.4 steps) + tooling (spec-delta.ts body-modification detection and origin baseline; update-server.ts --server-dir/--verify-deployed; push-pipeline.sh fail-closed deploy + step 9b + dry-run restore; version-check.ts currency; CI workflow) |
| Reused | config, lockfile, extraction |
| Repaired REQ set | REQ-394, REQ-398, REQ-107a |
| Verification | assemble 0 errors, validate:fast 0 errors, lint 0 errors, typecheck 0 errors, version-check OK |

**Publication-integrity reconciliation.** The pending-update gate (REQ-394)
was defeated two ways in practice: the classifier read its baseline from the
hand-editable DECISIONS.md (so pre-syncing the hash turned any delta into an
exempt patch), and it could not detect REQ-body modifications (so body-only
Minors published silently as patch). The gate now keys classification against
the last-published spec hash and detects body changes, routing them to a new
Editorial class (REQ-419) only when a disposition names the repaired REQ set.
Deployment gained a fail-closed contract (REQ-418): a non-fast-forward pull is
a deploy-failed notice, and the deployed clone's spec hash and fingerprints are
verified after the pull. Version currency is enforced at publication (REQ-107a),
and the CalVer was bumped to 2026.08.22 to match the latest substantive change.


| Field | Value |
|-------|-------|
| Delta class | minor |
| Changed | spec only (REQ-413 action-discriminator tool surface; REQ-414 schema-surface economy; REQ-415 summary-first tool catalog; REQ-416 config default inheritance; REQ-417 non-blocking startup probes; §5.3/§5.7 index rows, Appendix E REQ-413–417, Appendix F T486–T490, §6.6 coverage-map REQ-416/417 rows) |
| Reused | config, lockfile, extraction |
| Verification | assemble 0 errors, check:fast 0 errors, check 0 errors |

**Token-efficiency contract codification.** Added five normative contracts
backing the efficiency work already shipped: an action-discriminator tool
surface (one entry tool with an `action` discriminator per domain, sub-REQ per
action) so operationally distinct but domain-related tools do not proliferate
(REQ-413); schema-surface economy, preferring compact example-bearing inputs
over nested structural descriptions without weakening server-side validation
(REQ-414); a summary-first tool catalog derived from the live registry so
`tools/list` pays for full definitions only on demand while REQ-025c count
derivation holds (REQ-415); config default inheritance with a §7.6-tiered
defaults section (REQ-416); and non-blocking startup probes so slow health
checks do not delay call readiness (REQ-417). These mirror the Infobroker
consolidation discipline and the Pydantic/New-Stack schema-economy findings.

### Holonovel Spec Update — 2026-08-22 (market-aligned play defaults)

| Field | Value |
|-------|-------|
| Delta class | major |
| Changed | spec (REQ-291 oracle Ironsworn ladder + Player access + 50_50 default; REQ-306b safety default safe; REQ-306f safety escalation advisory; REQ-306g creativity tier mapping; REQ-412 turn-handoff directive in new §5.20; REQ-253b verbosity default normal; §7.6 cap/confidence defaults and TTRPG_AUTONOMY preset; §7.7.1a P45 autonomy coupling; §5 index repair; Appendix E REQ-306f/g/412, Appendix F T481–T485; §6.6 coverage-map REQ-409/410 rows) + implementation (`set_autonomy` tool with escalation advisory; `ask_oracle` Ironsworn ladder and un-gated; `badge_briefing` turn-handoff directives; `spec_health.autonomy` and `creativity_mapping`; `TTRPG_AUTONOMY` launch preset; `autonomy` field in NovelState) |
| Reused | config, lockfile, extraction |
| Verification | assemble 0 errors, check:fast 0 errors, check 0 errors, typecheck 0 errors, stdio boot smoke |

**Play-defaults reconciliation.** Defaulted the autonomy `safety` slider to `safe`
with a confirmed escalation advisory when the GM raises it toward permanent-death
tiers, matching the Holodeck's safety-on-by-default posture and the AI-Dungeon
safe-default norm (REQ-306b, REQ-306f). The oracle now uses the canonical
Ironsworn Ask-the-Oracle ladder (`almost_certain` ≥11, `likely` ≥26, `50_50` ≥51,
`unlikely` ≥76, `small_chance` ≥91), defaults to `50_50` when the likelihood is
omitted, and is callable by the Player badge so solo play consults the oracle
without a badge switch (REQ-291a–d). A turn-handoff directive closes each GM-role
turn by inviting the player's next action in plain English — the cross-medium
norm from Zork to play-by-post (REQ-412). Tool-output verbosity now defaults to
balanced `normal` output (REQ-253b). The three creativity tiers are documented as
distinct ordered variation levels recorded at build time (REQ-306g).


| Field | Value |
|-------|-------|
| Delta class | minor |
| Changed | spec (§5.3 added REQ-408 tool parameter ceiling, §5.6 added REQ-411 stable-metadata caching, §5.5 added REQ-410 token footprint; REQ-409 response-lean enumeration reads after REQ-253c; §7.6 config tier grouping; §1 executed-in-context boundary) + registration (Appendix E REQ-408–411 rows, Appendix F tests T477–T480) |
| Reused | source, config, lockfile, extraction, surfaces |
| Verification | assemble 0 errors, check:fast 0 errors, typecheck 0 errors |

**Performance record (REQ-410).** Parameter ceiling `8` (REQ-408). Token footprint
is reported live via `spec_health.token_footprint` (`tools_list_bytes`,
`prompt_scaffold_bytes`) and `spec_health.tools_list_bytes`, alongside
`cache_coverage` (REQ-411) and per-tool `tool_parameter_counts`.

Spec-level performance and token-efficiency contracts drawn from current MCP
optimization practice (progressive disclosure, response shaping, schema and
parameter ceilings, semantic caching). A per-tool parameter ceiling pushes
overflow into a refinement path (REQ-408). Collection reads default to summary
entries with a detail-on-demand path, leaving full verbose lookups untouched
(REQ-409). The performance record now gates token footprint — listing bytes and
prompt-budget consumption — alongside latency (REQ-410). Stable rendered content
is cached and invalidated on registration change (REQ-411). The config surface is
documented in three operator-facing tiers, and an executed-in-context boundary
records that programmatic tool calling, code-mode execution, and client-side
subagents are out of contract.

### Holonovel Spec Update — 2026-08-21 (state persistence guardrails)

| Field | Value |
|-------|-------|
| Delta class | major |
| Changed | spec (§5.19 added REQ-400–407; §7.6 `TTRPG_STATE_GATE`/`TTRPG_AUTO_RECORD` env vars; §1 terminology `State ledger`/`State drift`) + registration (Appendix A REQ rows, Appendix N tests T469–T476) |
| Reused | source, config, lockfile, extraction, surfaces |
| Verification | assemble 0 errors, check:fast 0 errors, check 0 errors, typecheck 0 errors |

Spec-level guardrails that force persistence during GM sessions so AI GM
narration is not lost to free-text. The GM briefing gains a same-turn
persistence directive (REQ-400) and a `state_ledger` token reporting the last
state-mutation timestamp and per-group counts (REQ-401). The server now detects
narration-without-commit and surfaces `[session-no-mutations]` (REQ-402) and
`[state-drift]` (REQ-403) markers, gated by a new `TTRPG_STATE_GATE` setting
(`off`/`warn`/`block`, default `warn`), and flags `[uncommitted-roll]` when a
significant roll is not followed by a commit (REQ-404). Scene transitions and
combat-round resolutions auto-record a `moment` story-journal entry via a
per-Novel `auto_record` flag defaulting `true` (REQ-405). Backup restores
report `[state-regression]` with entry/timestamp gaps (REQ-406), and the GM's
scene-typed tool list always includes and never truncates the core persist
tools (REQ-407).

### Holonovel Spec Update — 2026-08-21 (spec conformancy reconciliation)

| Field | Value |
|-------|-------|
| Delta class | major |
| Changed | spec (REQ-309b/h ruleset-free parser carve-out; §7.7 badge as Novel-tier; REQ-042f active entity Novel-scoped) + full server surface reconciliation (tool renames, resolve_intent, resource/prompt/tool completeness, response/error contract, spec_health, world-model containment, oracle/notes/pause/interchange/determinism fixes) |
| Reused | source partially, config, lockfile resync |
| Implementation fingerprints | source=8da599615303feb6570370be995e848900820df06a12f703e08885d9077ca483, config=20900e1f3ffc7bbb4f0ea91f71376cdd8517dc8da4548b7a93f1372d1b1ef19e3e879302d199d17e072264fe5713278ee3e80e37c2923bd494ac82081bc7e534, lockfile=6d0a2fbbbdb213687da3fbd8e184e58e060e6f8b30a3b135cdb45bf93ee4b951, extraction=sentinel, surfaces=b919dca088dbee49a66ff58358c6924e8bb8baea519661fac6b04e73bcad957b |
| Verification | assemble 0 errors, check:fast 0 errors, typecheck 0 errors, gauntlet 13/13 |

The ruleset-free host was reconciled to the canonical surface. Tool renames
(`delete_*`→`remove_*`, `check_knowledge`→`get_knowledge`, `save_pause_context`/
`get_resume_context`→`set_pause_context`/`get_pause_context`, `compress_audit`→
`compact_audit_log`, `revert_enrichment`→`revert_synthesis`, `dm_context`→
`gm_context`) align with §7.4 canonical verbs. Added `resolve_intent` (REQ-323)
with ruleset-conditional parser gating (REQ-309: the parser stays a Player
surface in ruleset-free mode, GM-only on ruleset-bound Novels), the missing
REQ-022 resource URIs, `run_workflow` prompt, `set_party_presence`,
`roll_on_table`, the codex surface, and the synthesis surface. Error responses
now carry `Corrective action:` and enumeration hints; `spec_health` reports
resource/prompt/synthesis/safety statuses; world-model containment and the
multi-direction door form were implemented; oracle markers, note badge-scoping,
pause auto-capture, interchange-format export/import, and determinism (session
PRNG for all draws) were corrected. Spec amendments: REQ-309 scope the
GM-only parser gate to ruleset-bound Novels (ruleset-free carve-out); §7.7 and
REQ-042f treat the active badge (and active entity) as Novel-tier.

### Holonovel Spec Update — 2026-08-21 (ruleset-driven character creation)

| Field | Value |
|-------|-------|
| Delta class | Minor |
| Changed | REQ-104a/b/c, REQ-151b, REQ-152a, REQ-181a/b, REQ-219a1/b (character-creation workflow/output); added REQ-399a/b/c (character-creation package data, computation contract, no-data fallback); §6.3/§6.4.2 (character data extraction), §7.5 (creation-contract reference); scrubbed the `swse` example slug from REQ-395a/Appendix V |
| Reused | source, config, lockfile, extraction categories, surfaces |
| Verification | assemble 0 errors, check:fast 0 errors, check 0 errors, typecheck 0 errors, gauntlet 13/13, character-creation unit tests 10/10 |

Character-creation is now ruleset-driven: the server no longer hard-codes a
specific ruleset's character tables. Character-creation rules (species, classes,
stat methods, formula-based derived statistics, starting equipment) live in the
bound ruleset package's model under `character_creation` (REQ-399a), derived
statistics are computed by a safe expression evaluator over ruleset-declared
formulas (REQ-399b), and a ruleset-free (or character-data-less) Novel degrades
to profile-only creation (REQ-219, REQ-399c). The legacy hard-coded engine was
removed from `src/core/character-creation.ts`.

### Holonovel Spec Update — 2026-08-20 (spec/server hash sync)

| Field | Value |
|-------|-------|
| Delta class | none (hash-only sync) |
| Changed | spec (holonovel.md reassembled; stored hash drifted) |
| Reused | source, config, lockfile, extraction, surfaces |
| Verification | assemble 0 errors, check 0 errors, typecheck 0 errors |

Hash-only sync: the root `holonovel.md` had been reassembled to hash
`275b49…` during earlier pre-commit assemble passes, but `DECISIONS.md` still
stored `d1d114…`, leaving the pre-push spec/server sync gate red. This entry
records the reconciliation of the stored hash to the current spec content. No
spec semantic change accompanies this bump.

### Holonovel Server Change — 2026-08-20 (jsonSchemaToZod required-array fix)

`jsonSchemaToZod` in `src/index.ts` marked every object property required,
ignoring the JSON Schema `required` array. Properties not listed in `required`
are now emitted as ZodOptional. Fixes ruleset tool calls that omit optional
arguments (e.g. `max_results` on `search_rules` tools), which previously
rejected with `expected number, received undefined`. No spec change; behavior
fix only, verified by typecheck and a Zod parse smoke test.

### Holonovel Spec Update — 2026-08-18 (deploy preservation)

| Field | Value |
|-------|-------|
| Delta class | minor |
| Changed | spec (new REQ-396 Deploy preservation; REQ-395a amended) |
| Reused | config, lockfile, extraction |
| Implementation fingerprints | source=e10d669aefd0b8378c0553ceb91382304a6e66f87903b12063e0ae67079dfa8f, config=20900e1f3ffc7bbb4f0ea91f71376cdd8517dc8da4548b7a93f1372d1b1ef19e3e879302d199d17e072264fe5713278ee3e80e37c2923bd494ac82081bc7e534, lockfile=760a5537e004cc4e843ea26e7d15fa0c1c7dc3b987e4f38b07fd25c332657886, extraction=sentinel, surfaces=77e6b8c5e21924bbf708908194393bc948007fe9a01195d267fa3a3f0a648f2d |
| Verification | assemble 0 errors, check 0 errors, typecheck 0 errors |

New REQ-396 (§5.18 Deploy preservation): any mechanism that updates a deployed
host instance — a git pull, clean, checkout, or equivalent — SHALL preserve the
install directory, all installed packages, and all user-generated data (Novels,
roster, codex, server notes, world model) byte-for-byte, and SHALL NOT run
destructive git operations that delete or revert the install or user-data
directory. Closes the gap left by REQ-393 (which framed preservation only around
the §6.7 version-bump update, not a deployed-clone pull/clean). REQ-395a is
amended so `build-ruleset` package output lands only in the install directory and
build tooling inside the git-tracked tree is committed rather than left untracked.
No state-model or tool-surface change; source and surfaces unused.

Version bumped to 2026.08.18 (root + holonovel package.json, AGENTS header, DECISIONS
spec version, index.ts McpServer version). The build-order fingerprint does not change
the server source behavior beyond the discoverability message above.

Patch — fingerprint baseline correction and V.4 wording: `update-server.ts` was reading
"current" implementation fingerprints by grepping the first `source=`/`config=` line in
this file, walking back to a stale historical record; it now computes them live from the
server source tree via `scripts/lib/fingerprints.ts` (REQ-313d), and the stale local
baseline was re-recorded. Appendix V.4 documents the pipeline's hash-only sync and the
live-fingerprint computation; `push-pipeline.sh` warns when a spec-hash change lacks a
dated Spec Update entry.

### Holonovel Spec Update — 2026-08-17

| Field | Value |
|-------|-------|
| Delta class | minor |
| Changed | spec (embedded holonovel.md) |
| Reused | source, config, lockfile, extraction, surfaces |
| Verification | typecheck 0 errors, validate:sdd 0 errors, build-order complete |

Spec-only change: §7.7 Holodeck taxonomy expanded from 19 to 30 property groups (ghost
property registration — Story Beats, Pacing Signal, Narrative Directive, Voice Feedback,
Voice Examples, Background, NPC Memory, World in Motion, Narrative Threads, NPC Goal
Pursuit, Autonomous Countdown). Coupling table canonicalized to archetype names; pattern
rules extended to P1–P54 (P51 Decision→Knowledge-carrying, P52 Scene-anchored→
Narrative-memory, P53 Temporal→Temporal, P54 Knowledge-carrying→Knowledge-carrying;
P23/P46/P47 target archetypes corrected). `validate.ts` now enforces order-insensitive
archetype matching with a `[non-property]` exemption for snapshot/tool-delegation rows.
No server source change — coupling contracts are normative, not tool behavior.

### Holonovel Full Update — 2026-08-11

| Field | Value |
|-------|-------|
| Spec version | 2026.08.29 |
| Build fingerprint | recomputed at startup from embedded holonovel.md |
| Delta class | major |
| Changed | source, surfaces (all tools/resource/prompt surface changed) |
| Verification | typecheck 0 errors |

Gap audit — 45+ new tools added, state model expanded with all Novel-management features:

| REQ | Gap | Disposition |
|-----|-----|-------------|
| REQ-232 | Missing pause/resume context | Added dm_context, save_pause_context, get_resume_context |
| REQ-233 | Missing factions | Added factions type, create/update/remove_faction tools |
| REQ-234 | Missing secrets/knowledge | Added secrets type, set_secret, reveal_secret, check_knowledge |
| REQ-236 | Missing relationships | Added relationship type, set_relationship, get_relationships |
| REQ-241 | Missing checkpoints | Added checkpoints type, set/list/restore/delete_checkpoint |
| REQ-242 | Missing notes | Added notes type, set/remove/list_notes |
| REQ-246 | Missing story journal | Added story journal type, record/update/remove/list_stories |
| REQ-256 | Missing rename_novel | Added rename_novel tool |
| REQ-257 | Missing list_novels | Added list_novels tool |
| REQ-258 | Missing novel_info | Added novel_info tool |
| REQ-240 | Missing clone_novel | Added clone_novel tool |
| REQ-285 | Missing server notes | Added server_notes store, set/remove/list_server_notes |
| REQ-289 | Missing vows | Added vow type, set_vow, mark_milestone, resolve_vow, forsake_vow |
| REQ-235 | Missing present_choices | Added present_choices tool with respond integration |
| REQ-291 | Missing oracle | Added ask_oracle tool |
| REQ-115 | Missing toggle_action_patterns | Added toggle_action_patterns tool |
| REQ-176 | Missing remove_entity | Added remove_entity tool |
| REQ-177 | Missing remove_roster_character | Added remove_roster_character tool |
| REQ-178 | Missing list_roster_characters | Added list_roster_characters tool |
| REQ-168 | Audit resource | audit://novel resource already existed |
| REQ-184 | Anti-slop resources | guidance://player/anti-slop and GM anti-slop already existed |
| REQ-206 | Conditions | Added conditions fields to entities/NPCs, apply/remove_condition |
| REQ-025 | spec_health completeness | Added tool_count, prompt_count, resource_count, enrichment_health, audit_chain, safety_protocols |
| REQ-187 | Runtime spec hash | Replaced hardcoded SPEC_HASH with runtime computeSpecHash() |

Tool surface: ~75 tools, ~22 resources, 5 prompts. All holonovel-capable runtime REQs implemented.
Class C (LLM-dependent: novel enrichment, NPC voice directive, generation intent, genre filtering, autonomy modes) remains deferred.



| Field | Value |
|-------|-------|
| Spec version | 2026.08.09 |
| Build fingerprint | 0f9c1b6c421443a0633fd4b6784ae3de14baa1407475944db746dfb05df9b5df |
| Implementation fingerprints | source=1b1d7f45db034344a5f4ef010488efa81eb5ad630c2993d881610869ca26b023, config=7316427a378075beb83ff30d9e4ecaaf1ce7aff094d9faf8e2e83363615089c6, lockfile=698b829bb8e547fcaad0fc463b1ef49fdf6645335db970ad49a158c92ae18797, extraction=sentinel, surfaces=12d776431f36afb445c2ad7932f442d0a8d7c91767448e71374d6992b636d3c2 |
| Gauntlet (I1-I13) | I1 PASS, I2 PASS, I3 PASS, I4 PASS, I5 PASS, I6 PASS, I7 PASS, I8 PASS, I9 PASS, I10 PASS, I11 PASS, I12 PASS, I13 PASS |
| Blocking (I1-I6, I10) | All PASS |
| Verification | typecheck 0 errors, spec-delta sync |

### Holonovel Scoped Update — 2026-08-09

| Field | Value |
|-------|-------|
| Delta class | minor |
| Changed | source |
| Reused | config, lockfile, extraction, surfaces |
| Gauntlet | PASS, 13/13 (all surfaces scoped — source changes affect full tool/resource/prompt surface) |
| Verification | typecheck 0 errors, spec-delta unsync (major delta — spec holonovel.md changed) |

## 2026-08-09 — Rebuild (Gauntlet I1-I13 verified)

- Added I11 (Narrative CRUD cycle), I12 (Lore and countdown lifecycle), I13 (Scene state and guidance) to the gauntlet harness, completing the full 13-sub-workflow Inform Gauntlet per §6.6.
- Updated spec hash to current holonovel.md (`dc99736bf...`).
- Fixed `doAction` prompt response extraction to handle MCP prompt message format (`content.text` vs `text`).
- Added lazy argument evaluation (`TL` helper) to gauntlet for capturing dynamic IDs (NPC ids).
- All 13 sub-workflows PASS. Blocking sub-workflows (I1-I6, I10): all PASS. Non-blocking (I7-I9, I11-I13): all PASS.
- Surface hash: `355f234ce91886d8fb4d3cd8717044966019e546eea3e9e78189c8280f5bc93d`.

### Verification

- `npm run typecheck` — passes (0 errors).
- `npm run spec-delta -- --server inform` — in sync with spec.
- Gauntlet: 13/13 PASS, 0 blocking failures.

### Known limitations

- `convert_source` does not parse the multi-direction door form (`X is north of Y and south of Z`).
- `create_thing` does not support `locationType` control — things always default to `locationType: "room"`.
- Parser command `take` only scans room things (`locationType: "room"`), not things on supporters or in open containers.

---

## 2026-08-08 — Rebuild (Gauntlet verified)

- Build from provider documentation (`narrative_world_model/world/world-model-provider.md`): kind hierarchy (thing,
  container, supporter, door, person, backdrop, region), property contracts, parser command
  catalog, and declarative assertion syntax indexed and surfaced at `world://kinds`.
- Server version: 2026.08.07. Specification version: 2026.08.08.
- Ruleset hash: "ruleset-free" (B1=none). World-model base: `holonovel` (B10).
- Build fingerprint: spec hash `55a4b9d3fcb7ed36cc4486bfe3b819ce550613952f0be8f772cc3b19889490b6`, ruleset-free, build timestamp 2026-08-08T23:00Z.

### Inform Gauntlet (I1–I13) — 2026-08-08

All 10 sub-workflows executed against live MCP server (`scripts/run_gauntlet.ts`).
Blocking sub-workflows (I1–I6, I10): all PASS. Non-blocking (I7–I9): all PASS.

| Sub-workflow | Verdict | Blocking |
|---|---|---|
| I1 — Parser command sweep | PASS | Yes |
| I2 — Room navigation cycle (5 rooms) | PASS | Yes |
| I3 — Object interaction cycle | PASS | Yes |
| I4 — CRUD round-trip | PASS | Yes |
| I5 — convert_source with fixture | PASS | Yes |
| I6 — Property state propagation | PASS | Yes |
| I7 — World-model resources | PASS | No |
| I8 — Large-map navigation (50 rooms) | PASS | No |
| I9 — Empty world model | PASS | No |
| I10 — Hybrid adventure load | PASS | Yes |

Surface hash: 0f9d1b3f (tools: 17, resources: 4, prompts: 4).

### Verification

- `npm run typecheck` — passes (0 errors).
- `npm run spec-delta -- --server inform` — in sync with spec.
- Convergence manifest: not yet computed (Phase 2 — REQ-245 — deferred to publish).

### Known limitations

- `convert_source` does not parse the multi-direction door form (`X is north of Y and south of Z`).
  Use separate exit declarations and explicit door things instead.
- `create_thing` does not support `locationType` control — things always default to
  `locationType: "room"`. Container/supporter containment must be set up via
  `convert_source` fixture assertions.
- Parser command `take` only scans room things (`locationType: "room"`), not things on
  supporters or in open containers. The drop side-effect handler in index.ts uses exact
  name matching, not the parser's fuzzy resolution.

---

## 2026-08-07 — Initial implementation

- Created ruleset-free Inform MCP server in `inform/` directory alongside
  the dnd5e server and `narrative_world_model/world/world-model-provider.md`.
- Implements REQ-218 (ruleset-free build), REQ-219 (ruleset-free entity creation),
  REQ-195–202 (world-model tier, parser commands, CRUD, properties, kinds,
  convert_source, resources), REQ-222 (base parser vocabulary).
- Ruleset hash: "ruleset-free" (REQ-218). No canonical lookups registered
  (waived under REQ-013).
- Entity model: ruleset-free — name + personality fields only, no stats,
  no HP, no equipment (REQ-219).
- Combat model: all participants auto-advance with [AUTO] marker (REQ-219).
- Help categories: builder-assigned with world-model category for parser
  commands and world-model CRUD tools.
- Resources: all REQ-022 URIs registered with badge filtering on world-model
  resources. World-model-specific resources (room://, thing://, world://map,
  world://kinds) implemented per REQ-202.
- Prompts: intro (world-model-only notice), badge_briefing (player/GM guidance
  with triggered lore; observer mode adds a dual-role instruction), session_zero,
  novel_setup.
