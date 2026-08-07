# Spec-engineering queue

Living tracker for subsystems that have not yet been reviewed through the
spec-engineering loop. All 55 spec features inventoried and priority-ranked
via multi-axis review (frequency, criticality, complexity, coupling, maturity,
verification coverage).

**Rules:** One item per line. Add to bottom of tier. Delete on completion.
No reordering mid-tier. Check for duplicates before adding.
Score = (freq×3) + (crit×4) + (cplx×2) + (coupling×2) − (maturity×1) −
(coverage×1).

**State markers.** Items pass through five states:
  `[RESEARCH]` → `[PLAN_READY]` → `[EXECUTING]` → (removed from queue)
  `[REJECTED]` and `[FAILED]` are terminal states (manual intervention).

- `[RESEARCH]`   — opencode research session running (Phase 0-2)
- `[PLAN_READY]` — plan file in .holonovel-state/queue-plans/
- `[EXECUTING]`  — build session applying changes (Phase 3)
- `[REJECTED]`   — user vetoed (stays in queue for reconsideration)
- `[FAILED]`     — execute or sync step errored out

**Pipeline:**
```sh
./scripts/spec-queue-cycle.sh research [N]   # research N items in parallel
./scripts/spec-queue-cycle.sh status          # list all items with state
./scripts/spec-queue-cycle.sh execute         # review → apply → sync → commit
```

The execute cycle: shows [PLAN_READY] items, asks for approval, applies
approved changes to the spec, runs the spec-driven update workflow (gap
audit → implement → scoped Gauntlet), validates with `npm run check`, and
commits as one batch. Research findings are cached in the knowledge base
at `.holonovel-state/knowledge-base/` (in `.gitignore`) to reduce token
usage in subsequent cycles.

**Add mid-session:** `@SPEC-QUEUE.md add: <item> to <tier>`
**Start next session:** `./scripts/spec-queue-cycle.sh research`

<!-- markdownlint-disable MD029 — continuous global item numbering across tiers -->

## Top candidates

Tier 1 — foundation-critical. Score ≥33. These carry architectural
dependencies; a failure here blocks everything downstream.

2. [DONE] Spec-driven updates — gap audit across tool catalog, resource map, prompt
   list, state model, hat gating, behavioral contracts; delta classification
   (patch/minor/major); state migration; Gauntlet re-run (§6.7, REQ-098).
   Score: 47 (freq=2, crit=5, cplx=5, coupling=5, maturity=3, coverage=2).
   Delta class wrong = silent regressions. **Promoted above original position:
   runs first so downstream items compare against a synced dnd5e server.**
3. [DONE] Novel lifecycle & persistence — create, resume, end, switch, atomic writes,
   checksum, backup recovery, .trash retention (REQ-088/092/093/095/097/
   117). Score: 53 (freq=4, crit=5, cplx=5, coupling=5, maturity=4,
   coverage=4). All state depends on save/load; corruption = lost games.
4. [DONE] Combat/conflict lifecycle — init_combat, advance_combat, end_combat, round
   tracking, turn order, participant classification (REQ-043). Score: 51
   (freq=4, crit=5, cplx=4, coupling=4, maturity=4, coverage=4). Core play
     loop; wrong = unplayable.
5. [DONE] The Gauntlet — 23 sub-workflows, blocking classification, surface-to-
    scenario mapping, convergence handshake, regression assertions, assertion
    compression (§6.6, REQ-108/142). Score: 51 (freq=3, crit=5, cplx=5,
    coupling=5, maturity=4, coverage=3). Gates every build; 22 scenarios
    exercising the full surface.
6. [DONE] Convergence loop — extraction quality (Phase 1), construction quality
    (Phase 2), no-delta detection, cross-model audit, unbuildable disposition
    (§6.5, REQ-099). Score: 51 (freq=3, crit=5, cplx=5, coupling=5,
    maturity=4, coverage=3). Quality engine; failure = broken server shipped.
7. [DONE] Discovery — chunked reading, 7 extraction categories (actions, tables,
    resolution, roles, guidance), cross-format consistency (§6.3,
    REQ-010/015/016/018). Score: 48 (freq=2, crit=5, cplx=5, coupling=5,
    maturity=4, coverage=3). Everything extracted flows from here; garbage in =
    garbage out.
8. [DONE] Snapshots, undo, redo — clearing on new mutation, persistence across
    restarts, redo of most recently undone mutation (REQ-041/116). Score: 47
    (freq=4, crit=5, cplx=3, coupling=4, maturity=4, coverage=3).
    High-frequency safety net; broken = unrecoverable state.
9. [DONE] Error taxonomy & response contract — [WARNING] prefixes, six error
    categories, corrective actions, "Did you mean?" fuzzy matching
    (REQ-001/002). Score: 47 (freq=5, crit=5, cplx=3, coupling=3, maturity=4,
    coverage=4). Every tool response; wrong = LLM misrouting.
10. [DONE] Extraction & confidence — player-filtered gate, confidence-floor
    acknowledgment below 80%, no assumed mechanics (REQ-011/012/013/099).
    Score: 47 (freq=3, crit=5, cplx=4, coupling=4, maturity=4, coverage=4).
    Source of all mechanical truth.
11. [DONE] Verification workflows — G0 intake integrity + MCP conformance,
    G2 golden transcript replay, G3 injection resistance, G4 derived tests,
    G5 Gauntlet, fixture vs ruleset-facing scoping, T18 anti-hats (§8).
    Score: 46 (freq=2, crit=5, cplx=4, coupling=5, maturity=4, coverage=3).
    Gating wrong = build passes when it shouldn't.
12. [DONE] Character creation workflow — decision mode (respond decisions for
    every mandatory step) and quick mode (all params in one call), undo after
    creation, Novel-scoped (REQ-104/056/042). Score: 45 (freq=3, crit=5,
    cplx=4, coupling=4, maturity=4, coverage=3). Session-zero blocker; undo
    contract critical.
13. [DONE] Handoff artifacts & verification — DECISIONS.md, README.md,
    AGENTS.md, LICENSE.md, 13 verification steps (H1–H13), traceability chain
    (§9). Score: 41 (freq=2, crit=5, cplx=3, coupling=4, maturity=4,
    coverage=3). Wrong = unverifiable build.
14. [DONE] Dynamic lore subsystem — sticky persistence, configurable token
    budget, groups, toggle, templates from enrichment (REQ-083). Score: 41
    (freq=4, crit=4, cplx=4, coupling=4, maturity=4, coverage=3). Every scene;
    wrong keywords = silent narrative drift.
    narrative (GM advance), hat_scope (gm/shared), direction
    (decrement/increment), fire
    at threshold, remove, on_scene_transition flag (REQ-073/125). Score: 39
    (freq=4, crit=4, cplx=3, coupling=4, maturity=4, coverage=3). Pacing
    backbone; fire condition wrong = broken tension.
    ruleset, rendering via character_sheet, resource URIs (npc://<id>,
    npcs://), narrative personality fields, builder-defined stat fields,
    damage resolution targeting NPCs (REQ-075/119/120/121/122/123/124).
    Score: 38 (freq=4, crit=4, cplx=4, coupling=3, maturity=3, coverage=3).
    Combat + narrative backbone; wrong = broken encounters.
    per-call seeds, session seed vs per-call seed isolation (override doesn't
    advance session PRNG position), same-seed reproducibility (REQ-050).
    Score: 38 (freq=5, crit=4, cplx=3, coupling=3, maturity=4, coverage=3).
    Every roll; non-deterministic = unreplayable.
    step 2 through G4 + smoke session), Phase 2 comparison against builder's
    evidence, adversarial Gauntlet re-execution (5 random blocking
    sub-workflows), dispute resolution (§10). Score: 38 (freq=2, crit=4,
    cplx=4, coupling=4, maturity=3, coverage=2). Self-grading escape hatch.

## Tool-surface features

Tier 2 — core play-surface and build-time infrastructure. Score 22–32.

    lore templates, action patterns, supplementary guidance, adventure
    advice), 9 verification checks, boundaries (additive only), idempotence
    fingerprint, staleness detection, rebuild scenarios (§11.1, REQ-080/103).
    Score: 37 (freq=2, crit=4, cplx=5, coupling=4, maturity=3, coverage=2).
    ruleset-legal tools, scene-type filtering, enrichment pattern supplement
    via toggle_action_patterns, curated intent coverage ≥80% (REQ-084/114/
    115). Score: 35 (freq=5, crit=3, cplx=4, coupling=3, maturity=3,
    coverage=3).
    (location, time_of_day, atmosphere), scene_tick counter, scene transition
    hook with automatic audit entry and countdown decrement (REQ-076/076a/
    125). Score: 33 (freq=5, crit=3, cplx=3, coupling=3, maturity=3,
    coverage=3).
    URL validity, file manifest completeness, deprecated terminology grep
    (§6.5 convergence sub-process). Score: 33 (freq=2, crit=4, cplx=3,
    coupling=4, maturity=3, coverage=2).
23. [FAILED] [FAILED] [FAILED] [PLAN_READY] [PLAN_READY] [PLAN_READY] [PLAN_READY] [PLAN_READY] Intake workflow — Q0 (workflow selection), build-mode profiles
    (production/quick), config verification against target client schema,
    viability pre-check (30% mechanical density threshold), cross-workflow
    deduplication (§6.2, REQ-101). Score: 31 (freq=2, crit=4, cplx=3,
    coupling=3, maturity=4, coverage=2).
    containment (../../etc/passwd rejected, REQ-052), input safety (verbatim
    free-text, no SQL execution, REQ-054). Score: 31 (freq=5, crit=4, cplx=2,
    coupling=1, maturity=4, coverage=3).
25. [FAILED] [FAILED] [PLAN_READY] [PLAN_READY] Entity personality fields — description, voice, background, goals,
    voice_examples (up to 5 dialogue snippets), ruleset-native mapping
    (traits/ideals/bonds/flaws → Holonovel fields), voice examples rendering
    before trait descriptions, roster-level storage with Novel overrides
    (REQ-077/126/127). Score: 30 (freq=4, crit=3, cplx=3, coupling=3,
    maturity=4, coverage=3).
26. [FAILED] [PLAN_READY] [PLAN_READY] Audit log — append-only, tamper-evident (chained hashes), records every
    mutating call (timestamp, hat, tool, args, output prefix), chain
    verification on load, mismatch in spec_health and stderr, survives
    connection restarts (REQ-040). Score: 30 (freq=5, crit=3, cplx=3,
    coupling=4, maturity=3, coverage=2).
27. [FAILED] [FAILED] [PLAN_READY] Hat briefing composition — ordered section groups (foundations → anti-slop
    → tone → scene → entities → NPCs → countdowns → lore → adventure →
    tools → combat → personality → directive → signals → setup → intro),
    decision-critical boundary, GM-overridable ordering via set_briefing_order,
    empty-source omission (REQ-109/082/062/063/070/071). Score: 29 (freq=5,
    crit=3, cplx=3, coupling=4, maturity=4, coverage=3).
28. [FAILED] [FAILED] [PLAN_READY] [PLAN_READY] [PLAN_READY] Adventure modules & generation — load_adventure, indexed adventure content
    at adventure://<slug>/<anchor>, hat-filtered (*Keeper only* hidden from
    Player), generate_adventure (premise → title/overview/hook/locations/NPCs/
    encounters), generate_encounter (scene+NPC+lore batch, single undo target),
    novel_setup prompt integration (REQ-079/089/090/091). Score: 29 (freq=3,
    crit=3, cplx=4, coupling=3, maturity=3, coverage=3).
29. [FAILED] [FAILED] [PLAN_READY] [PLAN_READY] Roll transparency — full calculation path (dice notation, individual faces,
    every modifier with source and signed contribution, total, prose outcome,
    result band when ruleset defines one) (REQ-003). Score: 27 (freq=5,
    crit=3, cplx=2, coupling=2, maturity=4, coverage=3).
30. [FAILED] [PLAN_READY] Player signals & briefing — player_signal (pace/difficulty/tone/focus/
    boundary), most-recent-value replacement, empty-value removal, GM-only
    briefing section with age delta ("set N connections ago"), empty-state
    marker (REQ-069/128). Score: 27 (freq=3, crit=3, cplx=2, coupling=3,
    maturity=4, coverage=3).
31. [FAILED] [PLAN_READY] Session recap — structured summary (timespan, entity states, confrontations,
    scene, lore triggers, directive, scene_type, last-N transitions, roster
    changes, condition changes, last-N rolls), hat-filtered, configurable N
    (REQ-072). Score: 25 (freq=4, crit=3, cplx=3, coupling=2, maturity=4,
    coverage=2).
32. Multi-entity support — multiple entities per Novel, roster holds multiple,
    active_entity as default target, set_active_entity switching, party://
    current listing with summary stats, import_character from roster (REQ-074).
    Score: 25 (freq=5, crit=3, cplx=2, coupling=3, maturity=4, coverage=2).
33. [FAILED] [PLAN_READY] [PLAN_READY] [PLAN_READY] Source conversion — PDF/HTML/web scrape → Markdown per Appendix G,
    fidelity sampling (3–5 pages, ≥90% per content type), artifact flagging
    with dispositions (fixed/waived/pending), converter version pinned in
    DECISIONS.md (REQ-102, App G). Score: 25 (freq=2, crit=3, cplx=4,
    coupling=2, maturity=3, coverage=2).
34. Novel & lorebook interchange — export_novel/export_lorebook (json/markdown),
    import_novel/import_lorebook (dry-run/merge/replace), round-trip identity,
    GM-only (REQ-094/096, App L/Q). Score: 24 (freq=2, crit=3, cplx=3,
    coupling=2, maturity=3, coverage=3).
35. Scene type tagging — set_scene_type (combat/social/exploration/neutral,
    accepts single string or array for backward compat), multi-type
    simultaneous, affects hat_briefing tool ordering and suggest_actions
    filtering, inert guidance (REQ-087). Score: 22 (freq=4, crit=2, cplx=2,
    coupling=3, maturity=4, coverage=2).
36. Narrative directive — set_narrative_directive with labeled directives
    (label+instruction), duplicate-label replacement, backward-compat single
    string form, GM-only in hat_briefing, inert guidance (REQ-081). Score: 19
    (freq=3, crit=2, cplx=2, coupling=2, maturity=4, coverage=2).

## Infrastructure / plumbing

Tier 3 — output formats, surface conventions, quality-of-life, and
peripheral features. Score ≤21.

37. Canonical lookups — lookup_<category> tools accepting canonical names and
    aliases, full ruleset entry returned, NOT_FOUND with enumeration and "Did
    you mean?", cross-reference pointers to named sections, source quoting
    (--- separated block with <file>#<anchor>), no ruleset file reads after
    startup indexing (REQ-057/061/112). Score: 22 (freq=5, crit=2, cplx=2,
    coupling=2, maturity=3, coverage=3).
38. Tools surface — minimum categories (character creation, condition
    management, combat, table rolling, session recap), parameterized tools for
    named sets, ruleset-native titles, action classification annotations
    (idempotentHint/destructiveHint), tool-surface consolidation (REQ-020/021/
    024/015/110). Score: 22 (freq=4, crit=3, cplx=3, coupling=3, maturity=4,
    coverage=3).
39. Prompts — dynamic composition from live index, state snapshot, registry
    surfaces, hat-scoped guidance, and required contract elements; intro,
    session_zero, hat_briefing, novel_setup, run_workflow; prompt length
    budget with truncation priority order and resource URI pointers
    (REQ-023/063/078/118). Score: 22 (freq=4, crit=3, cplx=3, coupling=2,
    maturity=4, coverage=3).
40. Resources — full URI catalog (ruleset://, entities://, entity://, audit://,
    roster://, guidance://, scene://, countdown://, party://, npc://, npcs://,
    lore://, enrichment://, adventure://, novel://, spec://, output://),
    templates/list with entity/roster/output:// templates, hat-filtered
    (REQ-022/105). Score: 22 (freq=4, crit=3, cplx=2, coupling=2, maturity=4,
    coverage=3).
41. Decision workflows — respond(decision, option), kebab-cased ≤25 options
    from ruleset index, cancel restores pre-workflow snapshot, single pending
    workflow per Novel (STATE_CONFLICT on second), pending state survives
    restart, blocks undo/redo/set_hat during pending (REQ-042/056). Score: 19
    (freq=3, crit=2, cplx=3, coupling=2, maturity=3, coverage=3).
42. spec_health reporting — confidence scores (per-file and overall),
    convergence summary (iterations, findings, residual gaps), indexed counts
    (anchors, concepts, entity types, actions, tables, procedures, guidance),
    MUST-action coverage, defect count, ruleset version status, spec_repo_url,
    spec_version, verification workflow dispositions, available Novels, per-
    Novel health metrics, prompt health, hat-filtered, counts derived from
    live registrations at call time (REQ-025/093/097). Score: 19 (freq=3,
    crit=3, cplx=2, coupling=2, maturity=4, coverage=3).
43. Help & tool discovery — help tool with optional query, no-query returns
    intro pointer + categorized task map + hat_briefing pointer, query mode
    searches tool descriptions/prompts/guidance for matches with example
    invocations, GM-customizable category assignments (Player always sees
    builder defaults), hat-filtered (REQ-067). Score: 17 (freq=2, crit=2,
    cplx=2, coupling=2, maturity=3, coverage=2).
44. Audit compression — compress_audit(max_entries) returns formatted prompt of
    most recent audit entries for LLM summarization, does not modify audit
    log, hat-filtered (Player sees own entities only), max_entries ≤ 0 returns
    INVALID_INPUT, pure-generation tool (REQ-086). Score: 16 (freq=2, crit=2,
    cplx=2, coupling=2, maturity=4, coverage=2).
45. Macro system — {{<path>}} token expansion in tool output, resource text,
    and prompt text before client delivery; supported paths (entity.*, scene.*,
    countdown.*, novel.slug, hat.active, party.size); nonexistent paths expand
    to literal unchanged; no expansion in audit log entries (REQ-085).
    Score: 16 (freq=3, crit=2, cplx=2, coupling=2, maturity=3, coverage=2).
46. Truncation & result counting — output:// pointers for output exceeding
    configurable limit, session-local hat-filtered payloads, oldest-first
    eviction, stat block baseline view (all fields regardless of truncation),
    "3 of 42 results" counting, configurable display limit (REQ-004/004a/
    113). Score: 16 (freq=2, crit=3, cplx=2, coupling=1, maturity=4,
    coverage=2).
47. Verbose output — every ruleset-defined field returned (not summaries),
    full combat calculation path with every modifier contribution, complete
    derived statistics in creation/advancement (REQ-060). Score: 16 (freq=5,
    crit=2, cplx=1, coupling=1, maturity=4, coverage=2).
48. Parameter canon validation — bounded-domain tool parameters (skill names,
    spell names, weapon names) validated against ruleset index at call time,
    unknown values return NOT_FOUND with session-visible valid values
    enumerated (REQ-059). Score: 15 (freq=4, crit=2, cplx=1, coupling=1,
    maturity=4, coverage=2).
49. Performance benchmarks — cold-start ≤5s (Standard tier, tiered thresholds
    by REQ-100), query latency mean of 5 representative lookups, measurement
    environment recorded in DECISIONS.md, spec_health surfaces most recent
    measurement (REQ-053/100). Score: 15 (freq=2, crit=2, cplx=2, coupling=1,
    maturity=3, coverage=2).
50. Anti-slop guidance — concrete forbidden narrative patterns with corrected
    alternatives, [anti-slop]-tagged, hat-filtered, served at guidance://
    <hat>/anti-slop, appears in hat_briefing after foundations and before scene
    state, full catalogue from Enrich (§11.1), synopsis in Appendix J
    (REQ-070). Score: 14 (freq=3, crit=2, cplx=1, coupling=1, maturity=3,
    coverage=2).
51. Enrichment reversion — revert_enrichment removes all six enrichment modules,
    idempotent (second call no-op), does not modify mechanical fields or
    build-derived registrations, DECISIONS.md enrichment manifest preserved
    for audit, re-running Enrich repopulates (REQ-103). Score: 11 (freq=1,
    crit=2, cplx=1, coupling=1, maturity=3, coverage=2).
52. Prompt section ordering — set_briefing_order(sections) accepts ordered
    array of section tokens, unknown tokens return INVALID_INPUT with valid
    tokens enumerated, empty array resets to builder defaults, enrich
    recommendation is inert (never auto-applies), persists with Novel
    (REQ-082). Score: 11 (freq=1, crit=2, cplx=1, coupling=1, maturity=4,
    coverage=2).
53. Source immutability & drift detection — ruleset Markdown hashed at intake
    (sha256sum), drift check at startup emits warning to spec_health and stderr
    on mismatch (REQ-014/044). Score: 11 (freq=1, crit=2, cplx=1, coupling=1,
    maturity=4, coverage=2).
54. Build fingerprint & version coordination — spec version (CalVer), ruleset
    hash, build timestamp stored in state directory, drift comparison on
    startup, spec_repo_url surfaced in spec_health and intro prompt, version
    comparison during update workflow (REQ-065/106/107). Score: 11 (freq=1,
    crit=2, cplx=1, coupling=1, maturity=4, coverage=2).
55. Runtime conventions — anchor derivation (lowercase, strip punctuation,
    hyphen-replace, explicit IDs take precedence), entity IDs (prefix_NN,
    roster://, entity://), output contract formats, tool naming (snake_case,
    ruleset terminology), config surface (12 env vars), state tiers (roster/
    Novel/connection), guidance surface (guidance:// URIs, hat knowledge)
    (§7.1–7.8). Score: 11 (freq=3, crit=2, cplx=1, coupling=1, maturity=4,
    coverage=2).
