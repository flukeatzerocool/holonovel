# Review — U6: synthesis and fixtures

66 verdict rows, one per budget unit in `plan.md`. A row is settled when its
claim is resolved against its predicate. Verdicts: `PASS`, `DEFECT` (a finding
with an ID), `builder-side` (terminal, with a reason).

A `builder-side` row is one whose claim is a builder duty the reference host
does not execute: external research, build-time extraction, or a DECISIONS.md
record. The reason names which duty. Evidence class is `repo` unless the row
names a command.

The chunk's exit evidence is `worklist.md:266-268`: every appendix fixture is
exercised by a named harness or recorded `builder-side` with a reason, and
§11.1–§11.4 each map to a handler or a recorded gap.

| Row | Unit | Claim settled | Predicate | Verdict |
|---|---|---|---|---|
| R1 | §11 lead-in | Synthesis is optional, additive, and Wisdom is present without it; the Pattern Buffer re-run is a builder duty | `spec/08-synthesis.md:1-18`; `holonovel/src/index.ts:16903` (`manage_synthesis` registered); `DEFAULT_WISDOM` load path | PASS |
| R2 | 11.1 external research | Web research, source-type minimums, dispositions, supplement audit | `spec/08-synthesis.md:20-42`; no HTTP client in the server (`grep -n 'fetch(' holonovel/src/index.ts` → no match) | builder-side — external research (§11.1) |
| R3 | 11.2 lead-in | A `synthesis_fingerprint` hash of Novel state prevents wasteful re-synthesis | `spec/08-synthesis.md:43-51`; no `synthesis_fingerprint` symbol (`grep -rn 'synthesis_fingerprint' holonovel/src` → no match) | DEFECT U6-F3 |
| R4 | 11.2 auto-trigger | `TTRPG_SYNTHESIS_AUTO_TRIGGER` gates auto-synthesis; auto items are inert | `spec/08-synthesis.md:52-56`; `holonovel/src/index.ts:15374` (`synthesis_auto_trigger`) | PASS |
| R5 | 11.2 source inputs | Seven source categories each map to output modules | `spec/08-synthesis.md:57-69`; `mergeNovelDerivedSynthesis` reads entities, NPCs and the story journal only (`holonovel/src/index.ts:16149-16172`) | DEFECT U6-F5 |
| R6 | 11.2 synthesis rules | Eight category rules produce their listed modules | `spec/08-synthesis.md:70-124`; the same function writes `voice_examples` and `supplementary_guidance` only, so rules 3–8 have no predicate | DEFECT U6-F5 |
| R7 | 11.3 module catalogue | Seven modules, their URIs, and activation actions | `spec/08-synthesis.md:125-180`; `SYNTHESIS_MODULES` (`holonovel/src/index.ts:13127`), the resource loop (`:16365`), `lore://templates` (`:16323`) | PASS |
| R8 | 11.3 Boundaries | Synthesis adds to the six listed surfaces and never touches mechanics or `[ruleset]`/`[vendor]` content | `spec/08-synthesis.md:181-187`; `mergeNovelDerivedSynthesis` writes only the two synthesis modules (`:16172-16175`) | PASS |
| R9 | 11.3 badge scope | Items carry `badge_scope`; Player badges exclude GM-scoped items; per-item override | `spec/08-synthesis.md:188-197`; `badgeCanSeeWisdom` (`holonovel/src/index.ts:16293-16297`); T326 (`test-backfill.ts:1695`) | PASS |
| R10 | 11.3 Budgets | Per-pass and total-Novel caps per module | `spec/08-synthesis.md:198-217`; no cap arithmetic in `mergeNovelDerivedSynthesis` or its callers | DEFECT U6-F5 |
| R11 | 11.3 Confidence | HIGH/MEDIUM/LOW from source authority; internal MEDIUM from explicit fields, LOW from inference | `spec/08-synthesis.md:218-230`; `holonovel/src/index.ts:16165` (LOW theme from journal) and `:16153` (MEDIUM from personality) | PASS |
| R12 | 11.3 LOW budget | External collection collects at most half as many LOW items | `spec/08-synthesis.md:231-237`; external research is builder-side | builder-side — external research budget |
| R13 | 11.3 LOW presentation | LOW items carry a visible `[LOW]` tag in briefing and resource output | `spec/08-synthesis.md:238-243`; `wisdomTag` returns only `[vendor]`/`[ruleset]`/`[player]`/`[supplementary]` (`holonovel/src/index.ts:16301-16308`); `grep -rn '\[LOW\]' holonovel/src` → no match | DEFECT U6-F4 |
| R14 | 11.3 Dedup/conflicts | A later contradictory item carries `conflicts_with`; both are retained | `spec/08-synthesis.md:244-249`; the field is propagated to output (`holonovel/src/index.ts:17037`); producing it is a synthesis-pass duty | builder-side — external synthesis pass |
| R15 | 11.3 Idempotence | Re-running against the same fingerprint is a no-op; items keyed under `synthesis` | `spec/08-synthesis.md:250-258`; gated on the boolean `state.enriched`, not a fingerprint (`holonovel/src/index.ts:16924-16928`) | DEFECT U6-F3 |
| R16 | 11.3 Reversion | `manage_synthesis (action: revert)` removes external and internal items, keeps Wisdom | `spec/08-synthesis.md:259-264`; `revert` action (`holonovel/src/index.ts:16905`); T94/REQ-103 (`test-backfill.ts:1846`) | PASS |
| R17 | 11.3 Resource rendering | Every synthesis URI renders live Novel state, filtered by module and badge | `spec/08-synthesis.md:265-276`; resource loop reads `effectiveWisdomItems` (`holonovel/src/index.ts:16365-16375`) | PASS |
| R18 | 11.3 Partial refresh | Per-module hashes preserve unchanged modules and active items | `spec/08-synthesis.md:277-287`; no per-module hash exists (`grep -rn 'module_hash\|moduleHash' holonovel/src` → no match); the only manifest fingerprint read is `manifest._fingerprint` (`holonovel/src/core/state.ts:2628`), which nothing writes | DEFECT U6-F3 |
| R19 | 11.3 Verification | Twelve post-synthesis checks recorded in DECISIONS.md | `spec/08-synthesis.md:288-332`; the checks are a builder record | builder-side — builder verification record |
| R20 | 11.3 Copyright | Operator owns licence compliance; `source_url` recorded | `spec/08-synthesis.md:333-337` | builder-side — operator duty |
| R21 | 11.3 Rebuild scenarios | Items survive restarts and same-ruleset rebuilds; fingerprint controls re-synthesis | `spec/08-synthesis.md:338-346`; items persist through `saveNovel` (`holonovel/src/core/state.ts:2602` module enumeration); the fingerprint half is U6-F3 | PASS |
| R22 | 11.4 lead-in | Vendor content is build-time Wisdom, always present, `[vendor]`-tagged | `spec/08-synthesis.md:347-355`; vendored tree `holonovel/narrative_world_model/` | builder-side — build-time extraction |
| R23 | 11.4 Sources | Eight licensed bundles contribute named craft areas | `spec/08-synthesis.md:356-368`; `holonovel/narrative_world_model/MANIFEST.md` records per-module data | builder-side — vendor bundle provenance |
| R24 | 11.4 Borrowed mechanics | Fate and Ironsworn SRD are host capabilities, not bundles | `spec/08-synthesis.md:369-372`; `resolve_fate` and `resolve_ironsworn` register (`holonovel/src/index.ts:3923`) | PASS |
| R25 | 11.4 When vendor runs | Vendor processing runs at build time; ruleset-free builds draw all modules from it | `spec/08-synthesis.md:373-386` | builder-side — build-time rule |
| R26 | 11.4 Pre-verified manifest | `MANIFEST.md` records hash, count, confidence distribution, term anchoring, timestamp | `spec/08-synthesis.md:387-406`; `holonovel/narrative_world_model/MANIFEST.md:1-8` | PASS |
| R27 | 11.4 REQ-451 | A runnable checker recomputes each module hash and fails strict mode on mismatch | `spec/08-synthesis.md:407-408`; `holonovel/scripts/check-vendor-manifest.ts:1-12`; gate `check-vendor-manifest` green in `check:fast` (EV2) | PASS |
| R28 | Fixture coverage matrix | Seven fixtures × fourteen extraction paths, plus the per-ruleset annotation rule | `spec/appendices-fixtures.md:1-30`; the seven column headers match Appendices B/C/N/W/X/Y/Z (`:31,331,385,778,974,1084,1123`) | PASS |
| R29 | Appendix B lead-in | Tin Lanterns is a synthetic dark-fantasy fixture, version-stamped | `spec/appendices-fixtures.md:31-37`; no `tin_lanterns.md` in the tree (`git ls-files \| grep tin_lantern` → no match) | builder-side — G2 handoff fixture |
| R30 | B.1 Fixture ruleset | The fixture ruleset defines stats, conditions, moves, gear, dangers | `spec/appendices-fixtures.md:38-140`; appendix only | builder-side — G2 handoff fixture |
| R31 | B.2 Expected model excerpt | Extraction confidence per concept | `spec/appendices-fixtures.md:141-177`; appendix only | builder-side — G2 expected model |
| R32 | B.3 Golden transcript | Prescriptive die values; replay asserts fields, prefixes, gating | `spec/appendices-fixtures.md:178-278`; Appendix B.3 named by REQ at `spec/02-requirements.md:84` | builder-side — G2 replay script |
| R33 | B.4 RNG witness values | The reference randomizer reproduces the witness sequences | `spec/appendices-fixtures.md:279-294`; witness values are normative per REQ-050 | builder-side — G2 witness check |
| R34 | B.5 Cross-file fixture | A second file exercises cross-file dedup and inline fields | `spec/appendices-fixtures.md:295-330`; no `tin_lanterns_gear.md` in the tree | builder-side — G2 handoff fixture |
| R35 | Appendix C lead-in | Injection fixture set | `spec/appendices-fixtures.md:331-332`; no `weather.md` in the tree | builder-side — injection fixture |
| R36 | C.1 Injection fixture | A ruleset source carrying ignored directives | `spec/appendices-fixtures.md:333-345`; appendix only | builder-side — injection fixture |
| R37 | C.2 Expected behavior | Directives stay inert; capability surface, gating and metadata unchanged | `spec/appendices-fixtures.md:346-366`; the assertion is a builder replay | builder-side — injection replay |
| R38 | C.3 Indirect injection | The import channel also keeps directives inert | `spec/appendices-fixtures.md:367-384`; the import channel exists (`manage_ruleset (action: import_supplementary)`) but no harness replays this fixture | builder-side — injection replay |
| R39 | Appendix N lead-in | Large-fixture set for the Heavy-tier G2 path | `spec/appendices-fixtures.md:385-395`; `spec/05-verification.md:38-51` names it for Heavy-tier rulesets | builder-side — G2 handoff fixture |
| R40 | N.1 Fixture files | Multi-file fixture with inline stat blocks and broken references | `spec/appendices-fixtures.md:396-610`; appendix only | builder-side — G2 handoff fixture |
| R41 | N.2 Expected model excerpt | Extraction confidence per concept | `spec/appendices-fixtures.md:611-664` | builder-side — G2 expected model |
| R42 | N.3 Golden transcript | Prescriptive die values for the N-fixture G2 path | `spec/appendices-fixtures.md:665-761` | builder-side — G2 replay script |
| R43 | N.4 RNG witness values | The same LCG reproduces the N witness table | `spec/appendices-fixtures.md:762-777` | builder-side — G2 witness check |
| R44 | Appendix W lead-in | Ruleset-free fixture set | `spec/appendices-fixtures.md:778-789`; `spec/02-requirements.md:3555` uses W in place of B/N for ruleset-free builds | builder-side — ruleset-free G2 fixture |
| R45 | W.1 Fixture world model | Three rooms, four exits, one portable thing, one fixed thing, one door | `spec/appendices-fixtures.md:790-813` | builder-side — ruleset-free G2 fixture |
| R46 | W.2 Expected model | The exact indexed world model | `spec/appendices-fixtures.md:814-821` | builder-side — G2 expected model |
| R47 | W.3 Golden transcript | Prescriptive replay for the world-model path | `spec/appendices-fixtures.md:822-955` | builder-side — G2 replay script |
| R48 | W.4 Behavioral contracts | The transcript exercises REQ-001/032/041/042/055 and peers | `spec/appendices-fixtures.md:956-973`; every cited REQ resolves in `spec/02-requirements.md` | builder-side — G2 coverage record |
| R49 | Appendix X lead-in | Social-mechanics fixture set | `spec/appendices-fixtures.md:974-981`; no `court_intrigue.md` in the tree | builder-side — G2 handoff fixture |
| R50 | X.1 Social fixture | Gambits, Boons, factions and Standing with no combat | `spec/appendices-fixtures.md:982-1058` | builder-side — G2 handoff fixture |
| R51 | X.2 Expected model excerpt | Extraction confidence per concept | `spec/appendices-fixtures.md:1059-1083` | builder-side — G2 expected model |
| R52 | Appendix Y lead-in | Structural stress fixture set | `spec/appendices-fixtures.md:1084-1090`; no `stress_test.md` in the tree | builder-side — structural fixture |
| R53 | Y.1 Structural stress source | Seven-level nesting, 100-row table, zero-width spaces, mixed formatting | `spec/appendices-fixtures.md:1091-1112` | builder-side — structural fixture |
| R54 | Y.2 Expected structural checks | Appendix H checks pass; irregular columns produce findings, not failures | `spec/appendices-fixtures.md:1113-1122` | builder-side — structural replay |
| R55 | Appendix Z lead-in | Minimal supplementary ruleset exercising tools, Wisdom and removal | `spec/appendices-fixtures.md:1123-1130` | builder-side — supplementary import fixture |
| R56 | Z.0 Fixture content | A spells/monsters/pacing source with two stat blocks | `spec/appendices-fixtures.md:1131-1191` | builder-side — supplementary import fixture |
| R57 | Z.1 Expected extraction | Tool registration, Wisdom coupling, removal | `spec/appendices-fixtures.md:1192-1208`; REQ-372d records the dynamic-registration waiver (`spec/02-requirements.md:3863-3865`) and `holonovel/DECISIONS.md:1775` records REQ-373 as a terminal builder-scope gap exercised by T424, while Z.1 states `tools/list` SHALL include the two tools | DEFECT U6-F6 |
| R58 | Playability harness | Three fixture Novels plus the shipped Novel run; `--self-test` is deterministic | `npm --prefix holonovel run test:playability` → exit 0, `playability: PASS (4 Novel(s))`; manifest declares 3 targets (`grep -c '"path"'` → 3) and `run()` prepends `shippedNovels()` (`holonovel/scripts/playability.ts:212-219`) | PASS |
| R59 | Holosuite novel tier | 100 assertions over a played Novel | `npm --prefix holonovel run test:holosuite-novel` → exit 0, `novel: 100 passed, 0 failed` | PASS |
| R60 | Conformance + invariants tiers | Response contracts and invariant sequences hold | `test:holosuite-conformance` → exit 0, `45 passed, 0 failed`; `test:holosuite-invariants` → exit 0, `25 passed, 0 failed` | PASS |
| R61 | Adversarial + differential + evidence | Injection resistance, differential stability, and the coverage-honesty record | `test:holosuite-adversarial` → exit 0, `26 passed, 0 failed`; `test:holosuite-differential` → exit 0, `3 passed, 0 failed`; `test:holosuite-evidence` → exit 0, `10 passed, 0 failed` | PASS |
| R62 | Supplementary harness | Supplementary Wisdom lists, activates and removes; waiver keeps tools unregistered | `npm --prefix holonovel run test:supplementary` → exit 0, `4 passed, 0 failed` | PASS |
| R63 | Competitive-gaps harness | 30 synthesis-surface assertions | `npm --prefix holonovel run test:competitive-gaps` → exit 0, `30 passed, 0 failed` | PASS |
| R64 | World-provider harness | The `world://kinds` payload the Appendix W world model depends on | `npm run test:world-provider` → exit 0, `7 passed, 0 failed` | PASS |
| R65 | `holonovel/testdata/` | No writer other than the fixture emitter touches the tracked package | `git status --porcelain holonovel/testdata` empty before and after the nine harness runs | PASS |
| R66 | Fixture emitter | The one sanctioned reference package re-emits byte-identically | `npm run check-fixture-emitter` → exit 0, `PASS: fixture package is current (6 files)` | PASS |

## Findings

- **U6-F1 — the U5 close protocol's ROADMAP half was not run. Resolved
  (2026-11-15).** Predicate: `worklist.md:312-313` requires the roadmap trigger
  to advance as step 5, and `ROADMAP.md:30-31` still read "U5 is next" after U5
  closed at `5980ed2` with `LOOP PAUSED`; the register half did run
  (`spec/audit/review-register.md:2787`). The pointer now reads U6. Phase 0.
- **U6-F2 — the program worklist carried stale appendix anchors. Resolved
  (2026-11-15).** Predicate: `worklist.md:257-258` gave X `:970`, Y `:1080`,
  Z `:1119` while the appendices begin at `spec/appendices-fixtures.md:974,1084,1123`.
  Row 4.3 of the plan.
- **U6-F3 — the synthesis fingerprint has no writer, so idempotence and partial
  refresh cannot work as specified. Scheduled-roadmap (P1).** Predicate:
  `spec/08-synthesis.md:43-51,250-258,277-287` require a `synthesis_fingerprint`
  over ruleset hash, intake answers and Novel state plus per-module hashes;
  `grep -rn 'synthesis_fingerprint' holonovel/src` returns no match,
  `grep -rn 'module_hash\|moduleHash' holonovel/src` returns no match, the only
  read of a manifest fingerprint is `manifest._fingerprint`
  (`holonovel/src/core/state.ts:2628`) and nothing writes it, and the re-run
  guard is the boolean `state.enriched`
  (`holonovel/src/index.ts:16924-16928`). Rows R3, R15, R18.
- **U6-F4 — the `[LOW]` presentation tag is never rendered. Scheduled-roadmap
  (P1).** Predicate: `spec/08-synthesis.md:238-243` requires a visible `[LOW]`
  tag in the briefing and in synthesis resource output, and `:301-302` requires
  it in every badge view; `wisdomTag` (`holonovel/src/index.ts:16301-16308`)
  returns only `[vendor]`/`[ruleset]`/`[player]`/`[supplementary]`, LOW items
  are ordered last in the resource payload (`:16371`) but carry no tag, and
  `grep -rn '\[LOW\]' holonovel/src` returns no match. Row R13.
- **U6-F5 — internal synthesis implements two of the eight category rules and
  enforces no cap. Scheduled-roadmap (P1).** Predicate:
  `spec/08-synthesis.md:57-69` maps seven source categories and `:70-124` gives
  eight rules across six modules, with caps at `:198-217`;
  `mergeNovelDerivedSynthesis` (`holonovel/src/index.ts:16149-16175`) reads
  entities, NPCs and the last story-journal entry, writes only
  `voice_examples` and `supplementary_guidance`, and applies no per-pass or
  total-Novel cap, so the lore-template, narrative-voice, adventure-advice,
  faction/secret, countdown and rooms/things rules have no predicate. Rows R5,
  R6, R10.
- **U6-F6 — Appendix Z.1 states a tool-registration outcome the recorded waiver
  forbids. Resolved (2026-11-15), prose.** Predicate:
  `spec/appendices-fixtures.md:1194-1197` requires `tools/list` to include
  `lookup_spell` and `lookup_monster`, while REQ-372d
  (`spec/02-requirements.md:3863-3865`) limits a waiving build to Wisdom and
  `holonovel/DECISIONS.md:1775` records REQ-373 as a terminal builder-scope gap
  whose branch T424 exercises with no tools registered. Z.1 now names the
  waiver branch beside the normative expectation. Row R57.
