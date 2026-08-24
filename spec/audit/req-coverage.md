# REQ Coverage Register

Generated: 2026-08-24

Bucket legend: A = certain gap (no source citation) · B = needs review (cited, no exercised test) · C = evidenced (cited + exercised) · D = spec-side (no `Check:` citation) · E = intended gap (builder/verifier-side, exempt from strict).

| REQ | Title | Section | Bucket | Exercised tests | §5.12 disposition |
|-----|-------|---------|--------|-----------------|-------------------|
| REQ-001 | Response contract (4 sub-parts) | 5.1 Output and Error Contracts | C | T90, T91, T261 | — |
| REQ-002 | Error taxonomy (6 sub-parts) | 5.1 Output and Error Contracts | C | T177 | — |
| REQ-003 | Roll transparency (Part a) (3 sub-parts) | 5.1 Output and Error Contracts | A | T47, T131 | — |
| REQ-004 | Truncation (1 sub-part) | 5.1 Output and Error Contracts | A | — | — |
| REQ-010 | Traceability | 5.2 Extraction and Confidence | E | T15 | — |
| REQ-011 | Confidence (Part a) (3 sub-parts) | 5.2 Extraction and Confidence | E | T15, T45, T93 | — |
| REQ-012 | Graceful fallback | 5.2 Extraction and Confidence | E | T91 | — |
| REQ-013 | No assumed mechanics | 5.2 Extraction and Confidence | E | T25 | — |
| REQ-014 | Source immutability | 5.2 Extraction and Confidence | E | T224 | — |
| REQ-015 | Action classification | 5.2 Extraction and Confidence | E | T15 | — |
| REQ-016 | Guidance extraction | 5.2 Extraction and Confidence | E | T26 | — |
| REQ-017 | Badge stories | 5.2 Extraction and Confidence | E | — | — |
| REQ-018 | Extraction evidence | 5.2 Extraction and Confidence | E | — | — |
| REQ-020 | Tools (Part a) (2 sub-parts) | 5.3 Tools, Resources, and Lookups | C | T5, T259 | — |
| REQ-021 | Tool-surface economy | 5.3 Tools, Resources, and Lookups | A | — | — |
| REQ-022 | Resources (Part a) (2 sub-parts) | 5.3 Tools, Resources, and Lookups | C | T16 | — |
| REQ-023 | Prompts (Part a) (2 sub-parts) | 5.3 Tools, Resources, and Lookups | C | T22, T26, T49, T50, T155, T480 | — |
| REQ-024 | Tool documentation (Part a) (2 sub-parts) | 5.3 Tools, Resources, and Lookups | A | T49, T488 | — |
| REQ-025 | spec_health (Part a) (4 sub-parts) | 5.3 Tools, Resources, and Lookups | C | T15, T45, T480, T93, T195, T154, T165, T166, T170, T171, T488 | — |
| REQ-030 | Single-user connection | 5.5 Badges and Access | C | S6, S17 | — |
| REQ-031 | Badge activation (Part a) (2 sub-parts) | 5.5 Badges and Access | A | T9, S6 | — |
| REQ-032 | Server-side gating (Part a) (2 sub-parts) | 5.5 Badges and Access | C | T9, T15, T26, T50, T53, T57, T64, T66, T68, T75, T76, T90, T91, T100, T101, T104, T110, T112, T119, T133, T134, T221, T261, T285, T326, S6 | — |
| REQ-040 | Audit log (Part a) (4 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | C | T100 | — |
| REQ-041 | Snapshots and undo (Part a) (3 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | C | T76, T90, T91, T121, T261 | — |
| REQ-042 | Workflow decisions (Part a) (6 sub-parts) | 5.4 Decision workflows | C | T157, T261 | — |
| REQ-043 | Conflict lifecycle (Part a) (7 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | C | T25, T47, T56, T90, T91, T110, T131, T161, T162 | — |
| REQ-044 | Ruleset hash recording | 5.6 State, Lifecycle, Entities, and Adventure Content | A | S17 | — |
| REQ-050 | Determinism (Part a) (3 sub-parts) | 5.7 Determinism, Safety, and Performance | C | T27, T90, T111 | — |
| REQ-051 | No runtime network access | 5.7 Determinism, Safety, and Performance | C | T41 | — |
| REQ-052 | Path containment | 5.7 Determinism, Safety, and Performance | C | T20 | — |
| REQ-054 | Input safety | 5.7 Determinism, Safety, and Performance | A | T20 | — |
| REQ-055 | Durability (2 sub-parts) | 5.7 Determinism, Safety, and Performance | C | T9, T27, T98, T261, S17 | — |
| REQ-056 | Advancement workflow | 5.4 Decision workflows | A | — | — |
| REQ-057 | Canonical lookup tools (Part a) (2 sub-parts) | 5.3 Tools, Resources, and Lookups | A | — | — |
| REQ-058 | Tool-result fidelity | 5.3 Tools, Resources, and Lookups | A | T41 | — |
| REQ-059 | Parameter canon validation (Part a) (3 sub-parts) | 5.3 Tools, Resources, and Lookups | A | — | — |
| REQ-060 | Verbose output (Part a) (2 sub-parts) | 5.1 Output and Error Contracts | A | T47, T478 | — |
| REQ-061 | Source quoting | 5.1 Output and Error Contracts | A | — | — |
| REQ-062 | Badge foundations | 5.1 Output and Error Contracts | C | T26 | — |
| REQ-063 | Connection introduction (Part a) (3 sub-parts) | 5.3 Tools, Resources, and Lookups | A | T49, T50, T259 | — |
| REQ-064 | Badge behavioral boundaries (Part a) (6 sub-parts) | 5.1 Output and Error Contracts | A | — | — |
| REQ-065 | Build fingerprint (Part a) (6 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | C | T224, T77, T125, S17 | — |
| REQ-066 | set_badge tool (Part a) (2 sub-parts) | 5.5 Badges and Access | C | T9, S6 | — |
| REQ-067 | Help and tool discovery (Part a) (3 sub-parts) | 5.3 Tools, Resources, and Lookups | E | — | — |
| REQ-069 | Player feedback signal (Part a) (3 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | C | T211, T313, T314, T450 | — |
| REQ-070 | Anti-slop guidance (Part a) (2 sub-parts) | 5.1 Output and Error Contracts | A | — | — |
| REQ-071 | Narrative tone samples (Part a) (2 sub-parts) | 5.1 Output and Error Contracts | A | — | — |
| REQ-072 | Session recap (Part a1) (9 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | C | T53, T90, T212, T213, T214, T215, T261 | — |
| REQ-073 | Countdowns (Part c1) (5 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | C | T90, T261, T404, T406, T409, T410, T411 | — |
| REQ-074 | Multi-entity support (Part a) (3 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | C | T55, T73, T216, T218, T220, S17 | — |
| REQ-075 | Named-NPC state (Part a) (5 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | C | T56, T409 | — |
| REQ-076 | Scene-state ledger (Part b1) (9 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | C | T57, T112, T132, T137, T331, S17 | — |
| REQ-077 | Entity personality fields (Part a) (6 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | C | T200, T260, T412 | — |
| REQ-078 | Session zero prompt (Part a) (7 sub-parts) | 5.3 Tools, Resources, and Lookups | A | — | — |
| REQ-079 | Adventure modules (Part a) (11 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | C | T285 | — |
| REQ-080 | Synthesis boundaries (Part a) (8 sub-parts) | 5.8 Synthesis, Lore, and Macros | C | T125, T194 | — |
| REQ-081 | Narrative directive (Part a) (4 sub-parts) | 5.8 Synthesis, Lore, and Macros | C | T64, T134, T450 | — |
| REQ-082 | Prompt section ordering (Part a) (3 sub-parts) | 5.8 Synthesis, Lore, and Macros | C | T66, T225 | — |
| REQ-083 | Dynamic lore (Part a) (6 sub-parts) | 5.8 Synthesis, Lore, and Macros | C | T400, T407, T411 | — |
| REQ-084 | Action suggestions (Part b1) (7 sub-parts) | 5.8 Synthesis, Lore, and Macros | C | T68, T96, T119, T120 | — |
| REQ-085 | Macro system (Part a) (2 sub-parts) | 5.8 Synthesis, Lore, and Macros | C | T69 | — |
| REQ-086 | Audit compression (Part a) (3 sub-parts) | 5.8 Synthesis, Lore, and Macros | A | — | — |
| REQ-087 | Scene type tagging (Part a) (3 sub-parts) | 5.8 Synthesis, Lore, and Macros | A | — | — |
| REQ-088 | Novel lifecycle (Part a) (9 sub-parts) | 5.9 Novel Persistence and Transport | C | T73, T98, T159, T402 | — |
| REQ-089 | Novel setup (Part a) (4 sub-parts) | 5.9 Novel Persistence and Transport | C | T74 | — |
| REQ-090 | Adventure generation (Part a) (5 sub-parts) | 5.9 Novel Persistence and Transport | C | T73, T75, T367 | — |
| REQ-091 | Enhanced encounter generation (Part a) (2 sub-parts) | 5.9 Novel Persistence and Transport | C | T76 | — |
| REQ-092 | Novel persistence (Part a) (9 sub-parts) | 5.9 Novel Persistence and Transport | C | T77, T88, T125, T156, T261 | — |
| REQ-093 | Novel listing and metadata (Part a) (3 sub-parts) | 5.9 Novel Persistence and Transport | C | T78, T99, T110 | — |
| REQ-094 | Lorebook interchange (Part a) (3 sub-parts) | 5.9 Novel Persistence and Transport | A | — | — |
| REQ-095 | Novel switching (Part a) (2 sub-parts) | 5.9 Novel Persistence and Transport | C | T98 | — |
| REQ-096 | Novel interchange (Part a) (11 sub-parts) | 5.9 Novel Persistence and Transport | C | T100, T281 | — |
| REQ-097 | Novel health (Part a1) (4 sub-parts) | 5.9 Novel Persistence and Transport | C | T101, T160 | — |
| REQ-098 | Spec-driven update workflow | 6.7 Spec-driven updates | E | — | — |
| REQ-099 | Confidence-floor acknowledgment | 5.2 Extraction and Confidence | E | — | — |
| REQ-100 | Performance benchmark (Part a) (4 sub-parts) | 5.7 Determinism, Safety, and Performance | E | T479 | — |
| REQ-101 | Assumption audit trail (Part a) (3 sub-parts) | 5.1 Output and Error Contracts | A | — | — |
| REQ-102 | Source conversion contract (Part a) (3 sub-parts) | 5.2 Extraction and Confidence | E | T93 | — |
| REQ-103 | Synthesis reversion (Part a) (4 sub-parts) | 5.8 Synthesis, Lore, and Macros | C | T125, T321 | — |
| REQ-104 | Character creation workflow (Part a) (3 sub-parts) | 5.4 Decision workflows | C | T468 | — |
| REQ-105 | Spec resource | 5.3 Tools, Resources, and Lookups | C | T104 | — |
| REQ-106 | Spec repository URL | 5.3 Tools, Resources, and Lookups | A | T105 | — |
| REQ-107 | Version coordination (Part a) (2 sub-parts) | 5.3 Tools, Resources, and Lookups | E | — | — |
| REQ-108 | Pattern Buffer traceability (Part a) (2 sub-parts) | 6.6 The Pattern Buffer | E | — | — |
| REQ-109 | Badge briefing composition (Part a) (8 sub-parts) | 5.5 Badges and Access | C | T110, T201 | — |
| REQ-110 | Tool surface consolidation | 5.3 Tools, Resources, and Lookups | A | — | — |
| REQ-111 | Search result quality (Part a) (2 sub-parts) | 5.2 Extraction and Confidence | E | — | — |
| REQ-112 | Cross-reference discovery | 5.3 Tools, Resources, and Lookups | A | — | — |
| REQ-113 | Result count reporting | 5.1 Output and Error Contracts | A | T116 | — |
| REQ-114 | Suggestion coverage (Part a) (2 sub-parts) | 5.8 Synthesis, Lore, and Macros | A | — | — |
| REQ-115 | Action pattern activation (Part a) (2 sub-parts) | 5.8 Synthesis, Lore, and Macros | A | T119 | — |
| REQ-116 | Redo | 5.6 State, Lifecycle, Entities, and Adventure Content | C | T121 | — |
| REQ-117 | Novel retention period | 5.9 Novel Persistence and Transport | A | — | — |
| REQ-118 | Prompt length budget (Part a) (2 sub-parts) | 5.1 Output and Error Contracts | A | T479 | — |
| REQ-119 | NPC stat block reference (Part a) (4 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | A | — | — |
| REQ-120 | NPC rendering | 5.6 State, Lifecycle, Entities, and Adventure Content | A | — | — |
| REQ-121 | NPC resource URIs | 5.6 State, Lifecycle, Entities, and Adventure Content | A | — | — |
| REQ-122 | NPC narrative fields (Part a) (2 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | A | — | — |
| REQ-123 | Builder-defined NPC stat fields | 5.6 State, Lifecycle, Entities, and Adventure Content | A | — | — |
| REQ-124 | NPC damage resolution (Part a) (2 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | A | T131 | — |
| REQ-125 | Scene transition hook (Part a) (2 sub-parts) | 5.8 Synthesis, Lore, and Macros | C | T404 | — |
| REQ-126 | Voice examples rendering (Part a) (2 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | A | T202 | — |
| REQ-127 | Ruleset-native personality mapping (Part a) (2 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | A | — | — |
| REQ-128 | Signal briefing surface (Part a) (2 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | A | T211, T314 | — |
| REQ-129 | Property group cardinality (Part a) (5 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | A | T218 | — |
| REQ-130 | Synthesis rebuild contract (Part a) (3 sub-parts) | 5.8 Synthesis, Lore, and Macros | A | — | — |
| REQ-131 | Novel initialization order (Part a) (3 sub-parts) | 5.9 Novel Persistence and Transport | A | — | — |
| REQ-132 | Adventure generation lifecycle (Part a) (5 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | A | — | — |
| REQ-133 | Forbidden-call audit (Part a) (2 sub-parts) | 5.5 Badges and Access | A | S6 | — |
| REQ-134 | Minimum Player tool surface | 5.5 Badges and Access | A | S6 | — |
| REQ-135 | Badge briefing size budget (Part a) (3 sub-parts) | 5.5 Badges and Access | A | — | — |
| REQ-136 | Editor-badge briefing (Part a) (2 sub-parts) | 5.5 Badges and Access | A | — | — |
| REQ-137 | Gate classification auditability (Part a) (2 sub-parts) | 5.5 Badges and Access | A | S6 | — |
| REQ-138 | Prompt health reporting (Part a) (2 sub-parts) | 5.3 Tools, Resources, and Lookups | A | — | — |
| REQ-139 | Resource URI completeness reporting | 5.3 Tools, Resources, and Lookups | A | — | — |
| REQ-140 | End-Novel confirmation dispatch | 5.4 Decision workflows | A | — | — |
| REQ-141 | Input-validation convergence metric (Part a) (10 sub-parts) | 6.6 The Pattern Buffer | E | — | — |
| REQ-142 | Blocking classification principle (Part a) (2 sub-parts) | 6.6 The Pattern Buffer | E | — | — |
| REQ-146 | Reconciliation authority (Part a) (4 sub-parts) | 5.2 Extraction and Confidence | E | — | — |
| REQ-147 | Confidence aggregation (Part a) (2 sub-parts) | 5.2 Extraction and Confidence | E | T181 | — |
| REQ-148 | Structural integrity gate | 5.5 Badges and Access | E | S6 | — |
| REQ-149 | MCP conformance gate | 5.5 Badges and Access | E | S6 | — |
| REQ-150 | Golden transcript coverage completeness (Part a) (2 sub-parts) | 5.5 Badges and Access | E | S6 | — |
| REQ-151 | Creation step enumeration (Part a) (2 sub-parts) | 5.4 Decision workflows | C | T468 | — |
| REQ-152 | Starting equipment assignment (Part a) (2 sub-parts) | 5.4 Decision workflows | C | T468 | — |
| REQ-153 | AGENTS.md troubleshooting | 5.2 Extraction and Confidence | E | T291 | — |
| REQ-154 | README.md handoff content (Part a) (2 sub-parts) | 5.2 Extraction and Confidence | E | — | — |
| REQ-155 | Sticky counter decay (Part a) (2 sub-parts) | 5.8 Synthesis, Lore, and Macros | A | — | — |
| REQ-156 | NPC description field | 5.6 State, Lifecycle, Entities, and Adventure Content | A | — | — |
| REQ-157 | Combat determinism (Part a) (2 sub-parts) | 5.7 Determinism, Safety, and Performance | A | — | — |
| REQ-158 | Independent verification obligation (Part a) (2 sub-parts) | 5.8 Synthesis, Lore, and Macros | E | — | — |
| REQ-159 | Synthesis briefing integration (Part a) (4 sub-parts) | 5.5 Badges and Access | C | T194 | — |
| REQ-160 | Synthesis health reporting (Part a) (3 sub-parts) | 5.3 Tools, Resources, and Lookups | C | T195 | — |
| REQ-161 | Intake workflow contract (Part a) (3 sub-parts) | 5.3 Tools, Resources, and Lookups | E | T196 | — |
| REQ-162 | Build-mode profiles (Part a) (3 sub-parts) | 5.3 Tools, Resources, and Lookups | E | — | — |
| REQ-163 | Client config verification (Part a) (2 sub-parts) | 5.3 Tools, Resources, and Lookups | E | T198 | — |
| REQ-164 | Viability pre-check (Part a) (2 sub-parts) | 5.3 Tools, Resources, and Lookups | E | T199 | — |
| REQ-165 | Entity ownership for personality gating (Part a) (2 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | A | T200 | — |
| REQ-166 | Personality briefing rendering (Part a) (3 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | A | T201 | — |
| REQ-167 | Personality resource URIs (Part a) (2 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | A | T202 | — |
| REQ-168 | Audit resource (Part a) (2 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | A | T100 | — |
| REQ-169 | Audit chain integrity reporting (Part a) (2 sub-parts) | 5.3 Tools, Resources, and Lookups | A | — | — |
| REQ-170 | Adventure discovery surface | 5.6 State, Lifecycle, Entities, and Adventure Content | A | — | — |
| REQ-171 | Adventure content validation (Part a) (2 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | A | — | — |
| REQ-172 | Adventure content drift detection | 5.6 State, Lifecycle, Entities, and Adventure Content | A | — | — |
| REQ-173 | Connection counter (Part a) (3 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | A | T211 | — |
| REQ-174 | Significant-roll criterion for recap (Part a) (2 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | A | T53, T213 | — |
| REQ-175 | Confrontation summary derivation (Part a) (2 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | A | T53, T214 | — |
| REQ-176 | Entity removal (Part a) (2 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | A | T216 | — |
| REQ-177 | Roster entity removal | 5.6 State, Lifecycle, Entities, and Adventure Content | A | — | — |
| REQ-178 | Roster listing (Part a) (2 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | A | — | — |
| REQ-179 | Output pointer resource template (Part a) (2 sub-parts) | 5.1 Output and Error Contracts | C | T221 | — |
| REQ-180 | Truncation budget unit (Part a) (2 sub-parts) | 5.5 Badges and Access | A | T222 | — |
| REQ-181 | Character creation output surface (Part a) (2 sub-parts) | 5.4 Decision workflows | C | T47, T468 | — |
| REQ-182 | Bounded-domain parameter documentation (Part a) (2 sub-parts) | 5.3 Tools, Resources, and Lookups | A | — | — |
| REQ-183 | Live-index-derived error enumerations (Part a) (2 sub-parts) | 5.3 Tools, Resources, and Lookups | A | — | — |
| REQ-184 | Anti-slop resource rendering (Part a) (2 sub-parts) | 5.1 Output and Error Contracts | A | — | — |
| REQ-185 | Section token vocabulary (Part a) (3 sub-parts) | 5.8 Synthesis, Lore, and Macros | A | — | — |
| REQ-186 | Section token discoverability (Part a) (2 sub-parts) | 5.8 Synthesis, Lore, and Macros | A | T225 | — |
| REQ-187 | Spec content hash computation (Part a) (2 sub-parts) | 5.3 Tools, Resources, and Lookups | E | — | — |
| REQ-190 | Respond drain result | 5.4 Decision workflows | A | — | — |
| REQ-191 | Option display-label pairs | 5.4 Decision workflows | A | — | — |
| REQ-192 | Batch-respond collision | 5.4 Decision workflows | A | — | — |
| REQ-193 | Pending workflow staleness detection (Part a) (2 sub-parts) | 5.4 Decision workflows | B | — | — |
| REQ-194 | Anchor derivation (Part a) (2 sub-parts) | 5.1 Output and Error Contracts | A | — | — |
| REQ-195 | World-model state tier (Part a) (2 sub-parts) | 5.10 World-Model Layer | C | T238, T414, T415 | — |
| REQ-196 | Parser command dispatch (Part a) (6 sub-parts) | 5.10 World-Model Layer | C | T239, T261, T313 | — |
| REQ-197 | Room description generation (Part a) (4 sub-parts) | 5.10 World-Model Layer | A | T240 | — |
| REQ-198 | World-model CRUD | 5.10 World-Model Layer | C | T241, T261 | — |
| REQ-199 | Property state tracking | 5.10 World-Model Layer | C | T242, T261 | — |
| REQ-200 | Kind mechanical contracts | 5.10 World-Model Layer | C | T243 | — |
| REQ-201 | Hybrid source conversion | 5.10 World-Model Layer | C | T244, T261 | — |
| REQ-202 | World-model resources (Part a) (2 sub-parts) | 5.10 World-Model Layer | C | T245 | — |
| REQ-203 | Combat-init guard | 5.6 State, Lifecycle, Entities, and Adventure Content | A | — | — |
| REQ-204 | Combat participant validation (Part a) (2 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | A | — | — |
| REQ-205 | Mid-combat participant changes (Part a) (3 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | A | S17 | — |
| REQ-206 | Combat-round condition expiry (Part a) (3 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | A | — | — |
| REQ-207 | Core-mechanic identification (Part a) (3 sub-parts) | 5.2 Extraction and Confidence | E | — | — |
| REQ-208 | Pattern Buffer convergence metric mapping (Part a) (2 sub-parts) | 6.6 The Pattern Buffer | E | — | — |
| REQ-209 | Cross-format consistency | 5.2 Extraction and Confidence | E | — | — |
| REQ-210 | Extraction categories (Part a) (2 sub-parts) | 5.2 Extraction and Confidence | E | — | — |
| REQ-211 | Evidence record field contract (Part a) (3 sub-parts) | 5.5 Badges and Access | A | — | — |
| REQ-212 | Generation table rolling (Part a) (2 sub-parts) | 5.2 Extraction and Confidence | E | — | — |
| REQ-213 | Weighted table result mapping (Part a) (3 sub-parts) | 5.7 Determinism, Safety, and Performance | C | T254 | — |
| REQ-214 | Table classification (Part a) (3 sub-parts) | 5.2 Extraction and Confidence | E | — | — |
| REQ-215 | Table content extraction (Part a) (3 sub-parts) | 5.2 Extraction and Confidence | E | T256 | — |
| REQ-216 | Generation table badge filtering (Part a) (2 sub-parts) | 5.5 Badges and Access | A | T257 | — |
| REQ-217 | Condition tools (Part a) (4 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | A | T258 | — |
| REQ-218 | Ruleset-free build (Part a) (3 sub-parts) | 5.11 Ruleset-Free Build Mode | C | T259 | — |
| REQ-219 | Ruleset-free entity creation (Part a1) (3 sub-parts) | 5.11 Ruleset-Free Build Mode | C | T468, T260 | — |
| REQ-220 | Narrative point of view (Part a) (4 sub-parts) | 5.5 Badges and Access | A | — | — |
| REQ-221 | Combat-navigation interaction (Part a) (2 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | A | — | — |
| REQ-222 | Parser command vocabulary extension (Part a) (3 sub-parts) | 5.10 World-Model Layer | C | T264 | — |
| REQ-223 | POV mode control (Part a) (3 sub-parts) | 5.5 Badges and Access | A | — | — |
| REQ-224 | Workflow staleness detection (Part a) (3 sub-parts) | 5.4 Decision workflows | C | T266 | — |
| REQ-225 | Ruleset Wisdom extraction (Part a) (2 sub-parts) | 5.2 Extraction and Confidence | E | — | — |
| REQ-226 | Narrative voice profiles (Part a) (3 sub-parts) | 5.8 Synthesis, Lore, and Macros | A | — | — |
| REQ-227 | Synthesis model (Part a) (2 sub-parts) | 5.8 Synthesis, Lore, and Macros | C | T303 | — |
| REQ-228 | Synthesis consistency during spec-driven updates (Part a) (3 sub-parts) | 5.8 Synthesis, Lore, and Macros | A | — | — |
| REQ-229 | Adventure synthesis linkage (Part a) (4 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | A | — | — |
| REQ-230 | Synthesis status dashboard (Part a) (2 sub-parts) | 5.8 Synthesis, Lore, and Macros | C | T327, T306 | — |
| REQ-231 | Per-module synthesis toggle (Part a) (2 sub-parts) | 5.8 Synthesis, Lore, and Macros | A | T307 | — |
| REQ-232 | Pause/resume context (Part a) (4 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | C | T268 | — |
| REQ-233 | Factions (Part b1) (6 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | C | T408, T413, T415 | — |
| REQ-234 | Secrets and knowledge (Part a) (4 sub-parts) | 5.8 Synthesis, Lore, and Macros | C | T406, T414 | — |
| REQ-235 | Structured player choices (Part a) (3 sub-parts) | 5.4 Decision workflows | C | T273 | — |
| REQ-236 | Entity relationships (Part a) (3 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | C | T410 | — |
| REQ-237 | Session segmentation (Part a) (3 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | A | — | — |
| REQ-238 | Backup rotation (Part a) (2 sub-parts) | 5.9 Novel Persistence and Transport | C | T276 | — |
| REQ-239 | Audit log compaction (Part a) (4 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | C | T277 | — |
| REQ-240 | Clone Novel (Part a) (3 sub-parts) | 5.9 Novel Persistence and Transport | C | T278 | — |
| REQ-241 | Checkpoints (Part a) (3 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | C | T279 | — |
| REQ-242 | Notes (Part a) (4 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | C | T280 | — |
| REQ-243 | Synthesis population during spec-driven updates (Part a) (4 sub-parts) | 5.8 Synthesis, Lore, and Macros | A | — | — |
| REQ-244 | Convergence cache key (Part a) (5 sub-parts) | 5.8 Synthesis, Lore, and Macros | A | T309 | — |
| REQ-245 | Pre-computed synthesis manifest (Part a) (5 sub-parts) | 5.8 Synthesis, Lore, and Macros | A | — | — |
| REQ-246 | Story journal (Part b1) (3 sub-parts) | 5.8 Synthesis, Lore, and Macros | C | T408 | — |
| REQ-247 | Adventure structure extraction (Part a) (4 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | A | — | — |
| REQ-248 | Adventure overview resource (Part a) (2 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | A | T285 | — |
| REQ-249 | Adventure navigation resource (Part a) (2 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | A | — | — |
| REQ-250 | Adventure scene waypoint (Part a) (3 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | A | — | — |
| REQ-251 | Generation intent guard (Part a) (4 sub-parts) | 5.7 Determinism, Safety, and Performance | A | — | — |
| REQ-252 | Narrative fast-forward (Part a) (3 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | A | — | — |
| REQ-253 | Tool-output verbosity control (Part a) (3 sub-parts) | 5.7 Determinism, Safety, and Performance | A | T478, T313 | — |
| REQ-255 | Boundary signal propagation (Part a) (3 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | A | T314 | — |
| REQ-256 | Rename Novel (Part a) (2 sub-parts) | 5.9 Novel Persistence and Transport | C | T315 | — |
| REQ-257 | List Novels (Part a) (2 sub-parts) | 5.9 Novel Persistence and Transport | C | T316 | — |
| REQ-258 | Novel info (Part a) (2 sub-parts) | 5.9 Novel Persistence and Transport | C | T317 | — |
| REQ-259 | Update Novel description | 5.9 Novel Persistence and Transport | A | T318 | — |
| REQ-260 | Granular synthesis activation (Part a) (4 sub-parts) | 5.8 Synthesis, Lore, and Macros | C | T319, T321, T326 | — |
| REQ-261 | Player synthesis (Part a) (5 sub-parts) | 5.8 Synthesis, Lore, and Macros | A | T320 | — |
| REQ-262 | Synthesis tool (Part a) (3 sub-parts) | 5.8 Synthesis, Lore, and Macros | A | T321 | — |
| REQ-263 | Synthesis auto-trigger (Part a) (2 sub-parts) | 5.8 Synthesis, Lore, and Macros | A | — | — |
| REQ-264 | Synthesis confidence model (Part a) (3 sub-parts) | 5.8 Synthesis, Lore, and Macros | A | T323 | — |
| REQ-265 | Synthesis in badge_briefing (Part a) (3 sub-parts) | 5.8 Synthesis, Lore, and Macros | A | T321, T326 | — |
| REQ-266 | Synthesis in dashboard (Part a) (2 sub-parts) | 5.8 Synthesis, Lore, and Macros | A | T327 | — |
| REQ-269 | Safety protocol status | 5.3 Tools, Resources, and Lookups | A | — | — |
| REQ-270 | Artifact version identification | 5.2 Extraction and Confidence | A | — | — |
| REQ-271 | AGENTS.md structure contract | 5.2 Extraction and Confidence | A | T291 | — |
| REQ-272 | Stock elements catalog | 5.2 Extraction and Confidence | E | — | — |
| REQ-273 | Independent verification reproducibility tolerance (Part a) (2 sub-parts) | 5.7 Determinism, Safety, and Performance | E | — | — |
| REQ-274 | Independent verifier confidence score | 5.7 Determinism, Safety, and Performance | E | — | — |
| REQ-275 | Evidence hash commitment | 5.5 Badges and Access | A | — | — |
| REQ-276 | Independent verifier model criteria | 5.5 Badges and Access | A | T296 | — |
| REQ-277 | Fixture evolution contract | 5.1 Output and Error Contracts | A | — | — |
| REQ-278 | Build-phase-map staleness detection | 5.3 Tools, Resources, and Lookups | E | — | — |
| REQ-279 | Narrative orientation (Part a) (3 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | A | — | — |
| REQ-280 | Source-anchor citation (Part a) (3 sub-parts) | 5.1 Output and Error Contracts | A | — | — |
| REQ-281 | Narrative-threads section token (Part a) (3 sub-parts) | 5.5 Badges and Access | A | — | — |
| REQ-282 | NPC voice directive (Part a) (4 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | A | — | — |
| REQ-283 | Verb coverage tiers (Part a) (3 sub-parts) | 5.10 World-Model Layer | A | — | — |
| REQ-284 | Implicit action hints (Part a) (5 sub-parts) | 5.10 World-Model Layer | A | — | — |
| REQ-285 | Server notes (Part a) (3 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | C | T334, T416 | — |
| REQ-286 | Knowledge-state section token (Part a) (3 sub-parts) | 5.5 Badges and Access | C | T399 | — |
| REQ-289 | Vow tracking (Part a) (5 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | C | T407, T412, T413 | — |
| REQ-291 | Oracle tool (Part a) (4 sub-parts) | 5.7 Determinism, Safety, and Performance | C | T481, T337 | — |
| REQ-292 | Adventure catalog (Part a) (4 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | A | — | — |
| REQ-294 | Genre declaration | 5.9 Novel Persistence and Transport | A | — | — |
| REQ-295 | Genre-filtered generation (Part a) (3 sub-parts) | 5.9 Novel Persistence and Transport | A | — | — |
| REQ-296 | Knowledge-graph resource (Part a) (2 sub-parts) | 5.3 Tools, Resources, and Lookups | C | T341 | — |
| REQ-299 | Cross-model audit sufficiency | 6.5 Verification and convergence | E | — | — |
| REQ-300 | Structured failure diagnostics | 6.6 The Pattern Buffer | E | — | — |
| REQ-301 | Convergence loop audit trail | 6.6 The Pattern Buffer | E | — | — |
| REQ-302 | Per-section content hashing (Part a) (2 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | A | — | — |
| REQ-303 | Scoped re-verification | 6.6 The Pattern Buffer | E | — | — |
| REQ-304 | Counterpart AI role (Part a) (3 sub-parts) | 5.5 Badges and Access | A | T482 | — |
| REQ-305 | Observer mode (Part a) (2 sub-parts) | 5.5 Badges and Access | A | T417, S6 | — |
| REQ-306 | Adjustable autonomy (Part a) (7 sub-parts) | 5.5 Badges and Access | C | T483, T484, T485, T350 | — |
| REQ-307 | Entity presence (Part a) (3 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | C | T351, T356, S17 | — |
| REQ-308 | Knowledge gating by presence (Part a) (2 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | A | T356 | — |
| REQ-309 | World and narrative surface prominence (Part a) (8 sub-parts) | 5.10 World-Model Layer | C | T353 | — |
| REQ-310 | Campaign Memory (Part a) (7 sub-parts) | 5.8 Synthesis, Lore, and Macros | A | — | — |
| REQ-311 | NPC memory model (Part a) (7 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | A | T356 | — |
| REQ-312 | Pre-narration validation gate (Part d1) (5 sub-parts) | 5.7 Determinism, Safety, and Performance | A | — | — |
| REQ-313 | Server implementation fingerprinting (Part a) (4 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | E | — | — |
| REQ-314 | Fingerprint-driven partial rebuild (Part a) (4 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | E | — | — |
| REQ-315 | Full-text ruleset indexing (Part a) (2 sub-parts) | 5.2 Extraction and Confidence | E | — | — |
| REQ-316 | Device kind (Part a) (2 sub-parts) | 5.10 World-Model Layer | C | T361 | — |
| REQ-317 | Vehicle kind (Part a) (4 sub-parts) | 5.10 World-Model Layer | C | T362 | — |
| REQ-318 | Extended property contracts (Part a) (2 sub-parts) | 5.10 World-Model Layer | C | T363 | — |
| REQ-319 | Extended parser command vocabulary (Part a) (4 sub-parts) | 5.10 World-Model Layer | C | T364 | — |
| REQ-320 | Narrative-intent parser verbs (Part a) (3 sub-parts) | 5.10 World-Model Layer | C | T365 | — |
| REQ-321 | Codex (Part a) (16 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | C | T397, T402, S17 | — |
| REQ-322 | Vow-countdown coupling (Part a) (4 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | A | — | — |
| REQ-323 | resolve_intent tool (Part a) (2 sub-parts) | 5.3 Tools, Resources, and Lookups | C | T370 | — |
| REQ-324 | Constraint override extraction | 5.2 Extraction and Confidence | E | — | — |
| REQ-325 | Constraint override catalog (Part a) (3 sub-parts) | 5.10 World-Model Layer | B | — | — |
| REQ-326 | Scene-world coupling (Part a) (4 sub-parts) | 5.10 World-Model Layer | B | — | — |
| REQ-327 | NPC-world coupling (Part a) (3 sub-parts) | 5.10 World-Model Layer | A | — | — |
| REQ-328 | Lore-world coupling (Part a) (2 sub-parts) | 5.8 Synthesis, Lore, and Macros | A | — | — |
| REQ-329 | Countdown-world coupling (Part a) (2 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | A | — | — |
| REQ-330 | Knowledge-world coupling (Part a) (3 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | A | — | — |
| REQ-331 | Story journal-world coupling (Part a) (2 sub-parts) | 5.8 Synthesis, Lore, and Macros | A | — | — |
| REQ-332 | Codex provenance (Part a) (3 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | A | — | — |
| REQ-333 | Story journal to lore promotion (Part a) (3 sub-parts) | 5.8 Synthesis, Lore, and Macros | A | — | — |
| REQ-334 | Novel archive (Part a) (4 sub-parts) | 5.9 Novel Persistence and Transport | A | — | — |
| REQ-335 | Scene beat taxonomy (Part a) (3 sub-parts) | 5.12 Narrative Architecture | C | T385, T404 | implemented |
| REQ-336 | Dramatic pacing signal (Part a) (2 sub-parts) | 5.12 Narrative Architecture | C | T386, T401 | implemented |
| REQ-337 | Narrative arc visibility (Part a) (2 sub-parts) | 5.12 Narrative Architecture | C | T387, T402 | implemented |
| REQ-338 | Faction autonomous advancement (Part a) (3 sub-parts) | 5.12 Narrative Architecture | C | T388, T401 | implemented |
| REQ-339 | NPC goal pursuit (Part a) (3 sub-parts) | 5.12 Narrative Architecture | C | T389, T401 | implemented |
| REQ-340 | Discovered consequences (Part a) (3 sub-parts) | 5.12 Narrative Architecture | C | T390, T399 | implemented |
| REQ-341 | Player-facing spatial surface (Part a) (3 sub-parts) | 5.12 Narrative Architecture | C | T391 | implemented |
| REQ-342 | Scene description from world-model state (Part a) (2 sub-parts) | 5.12 Narrative Architecture | C | T392 | implemented |
| REQ-343 | Unified intent resolution (Part a) (4 sub-parts) | 5.12 Narrative Architecture | C | T393 | implemented |
| REQ-344 | Voice example feedback (Part a) (3 sub-parts) | 5.12 Narrative Architecture | C | T394 | implemented |
| REQ-345 | Background-derived knowledge (Part a) (3 sub-parts) | 5.12 Narrative Architecture | C | T395, T400 | implemented |
| REQ-346 | Narrative coherence attestation (Part a1) (3 sub-parts) | 5.12 Narrative Architecture | C | T396, T403 | implemented |
| REQ-347 | Voice feedback codex capture (Part a) (3 sub-parts) | 5.12 Narrative Architecture | C | T397 | implemented |
| REQ-348 | Faction-NPC goal coordination (Part a) (3 sub-parts) | 5.12 Narrative Architecture | C | T398 | implemented |
| REQ-349 | Consequence-to-knowledge coupling (Part a) (3 sub-parts) | 5.12 Narrative Architecture | C | T399 | implemented |
| REQ-350 | Background lore triggering (Part a) (3 sub-parts) | 5.12 Narrative Architecture | C | T400 | implemented |
| REQ-351 | Pacing-triggered autonomy (Part a) (3 sub-parts) | 5.12 Narrative Architecture | C | T401 | implemented |
| REQ-352 | Codex adventure beat sequences (Part a) (4 sub-parts) | 5.12 Narrative Architecture | C | T402 | implemented |
| REQ-353 | Beat-accelerated countdown advancement | 5.12 Narrative Architecture | C | T404 | implemented |
| REQ-354 | Extended narrative extraction | 5.2 Extraction and Confidence | E | — | implemented |
| REQ-355 | Secret-countdown coupling (Part a) (2 sub-parts) | 5.12 Narrative Architecture | C | T406 | implemented |
| REQ-356 | Vow-lore coupling (Part a) (2 sub-parts) | 5.12 Narrative Architecture | C | T407 | implemented |
| REQ-357 | Story journal-faction coupling (Part a) (2 sub-parts) | 5.12 Narrative Architecture | C | T408 | implemented |
| REQ-358 | Countdown-NPC disposition coupling (Part a) (2 sub-parts) | 5.12 Narrative Architecture | C | T409 | implemented |
| REQ-359 | Relationship-countdown coupling (Part a) (2 sub-parts) | 5.12 Narrative Architecture | C | T410 | implemented |
| REQ-360 | Lore-countdown coupling (Part a) (2 sub-parts) | 5.12 Narrative Architecture | C | T411 | implemented |
| REQ-361 | NPC-vow coupling (Part a) (2 sub-parts) | 5.12 Narrative Architecture | C | T412 | implemented |
| REQ-362 | Faction-vow coupling (Part a) (2 sub-parts) | 5.12 Narrative Architecture | C | T413 | implemented |
| REQ-363 | Secret-world coupling (Part a) (2 sub-parts) | 5.12 Narrative Architecture | C | T414 | implemented |
| REQ-364 | Faction-world coupling (Part a) (2 sub-parts) | 5.12 Narrative Architecture | C | T415 | implemented |
| REQ-365 | Server notes narrative coupling (Part a) (3 sub-parts) | 5.12 Narrative Architecture | C | T416 | implemented |
| REQ-366 | Observer narrative surface (Part a) (4 sub-parts) | 5.12 Narrative Architecture | C | T417 | implemented |
| REQ-367 | Property propagation across containment (Part a) (4 sub-parts) | 5.10 World-Model Layer | A | — | — |
| REQ-368 | Countdown-world effect coupling (Part a) (5 sub-parts) | 5.10 World-Model Layer | A | — | — |
| REQ-369 | Holodeck archetype taxonomy (Part a) (2 sub-parts) | 5.13 Holodeck | E | — | — |
| REQ-370 | Coupling derivation (Part a) (2 sub-parts) | 5.13 Holodeck | E | — | — |
| REQ-371 | Ruleset Wisdom as rendered reality (Part a) (2 sub-parts) | 5.13 Holodeck | E | — | — |
| REQ-372 | Supplementary ruleset import (Part a) (5 sub-parts) | 5.14 Content Sources | E | — | — |
| REQ-373 | Dynamic tool registration (Part a1) (2 sub-parts) | 5.14 Content Sources | E | — | — |
| REQ-374 | Archetype coverage (Part a) (2 sub-parts) | 5.13 Holodeck | E | — | — |
| REQ-375 | Wisdom mechanical coupling rate (Part a) (2 sub-parts) | 5.13 Holodeck | E | — | — |
| REQ-376 | Holonovel Pattern Buffer traceability (Part a1) (5 sub-parts) | 5.13 Holodeck | E | — | — |
| REQ-377 | Mechanical coupling extraction (Part a) (4 sub-parts) | 5.15 Mechanical Coupling | E | — | — |
| REQ-378 | Mechanical coupling verification (Part a) (2 sub-parts) | 5.15 Mechanical Coupling | E | — | — |
| REQ-379 | Tool namespacing (Part a) (3 sub-parts) | 5.16 Multi-Ruleset Build | E | — | — |
| REQ-380 | Novel ruleset binding (Part a) (3 sub-parts) | 5.16 Multi-Ruleset Build | B | — | — |
| REQ-381 | Ruleset-scoped tool gating (Part a) (3 sub-parts) | 5.16 Multi-Ruleset Build | E | — | — |
| REQ-382 | Per-ruleset extraction isolation (Part a) (3 sub-parts) | 5.16 Multi-Ruleset Build | E | — | — |
| REQ-383 | Host ruleset health (Part a) (2 sub-parts) | 5.16 Multi-Ruleset Build | E | — | — |
| REQ-384 | Cross-ruleset Novel switching (Part a) (3 sub-parts) | 5.16 Multi-Ruleset Build | E | — | — |
| REQ-385 | suggest_actions cross-ruleset scoping (Part a) (2 sub-parts) | 5.16 Multi-Ruleset Build | E | — | — |
| REQ-386 | Cross-ruleset import rejection (Part a) (2 sub-parts) | 5.16 Multi-Ruleset Build | E | — | — |
| REQ-387 | Codex ruleset annotation (Part a) (2 sub-parts) | 5.16 Multi-Ruleset Build | E | — | — |
| REQ-388 | Holodeck config discovery (Part a) (4 sub-parts) | 5.3 Tools, Resources, and Lookups | E | T450 | — |
| REQ-389 | Ruleset package format (Part a) (3 sub-parts) | 5.17 Ruleset Packages | B | — | — |
| REQ-390 | Lazy ruleset hydration (Part a) (2 sub-parts) | 5.17 Ruleset Packages | B | — | — |
| REQ-391 | Scoped tool listing (Part a) (3 sub-parts) | 5.17 Ruleset Packages | A | — | — |
| REQ-392 | Tool-description budget | 5.17 Ruleset Packages | A | T479 | — |
| REQ-393 | Update preservation | 5.17 Ruleset Packages | A | — | — |
| REQ-394 | Spec publication integrity | 5.17 Ruleset Packages | E | — | — |
| REQ-395 | Ruleset-build entry point (Part a) (2 sub-parts) | 5.18 Workflow Entry Points | E | — | — |
| REQ-396 | Deploy preservation | 5.18 Workflow Entry Points | E | — | — |
| REQ-397 | Untracked state location | 5.18 Workflow Entry Points | E | — | — |
| REQ-398 | Deploy-model scope | 5.18 Workflow Entry Points | E | — | — |
| REQ-399 | Character-creation package data (Part a) (3 sub-parts) | 5.4 Decision workflows | C | T468 | — |
| REQ-400 | State-Persistence Directive | 5.19 State Persistence Guardrails | A | — | — |
| REQ-401 | State ledger briefing token | 5.19 State Persistence Guardrails | A | — | — |
| REQ-402 | Session no-mutation detection | 5.19 State Persistence Guardrails | A | — | — |
| REQ-403 | State-drift detection (Part a) (2 sub-parts) | 5.19 State Persistence Guardrails | A | — | — |
| REQ-404 | Roll-to-commit coupling | 5.19 State Persistence Guardrails | A | — | — |
| REQ-405 | Auto-moment on transitions | 5.19 State Persistence Guardrails | A | — | — |
| REQ-406 | Backup-restore regression visibility | 5.19 State Persistence Guardrails | A | — | — |
| REQ-407 | Persist-tools never truncated | 5.19 State Persistence Guardrails | A | — | — |
| REQ-408 | Tool parameter ceiling | 5.3 Tools, Resources, and Lookups | C | T477, T488 | — |
| REQ-409 | Response-lean enumeration reads | 5.7 Determinism, Safety, and Performance | C | T478 | — |
| REQ-410 | Token footprint in performance record | 5.7 Determinism, Safety, and Performance | C | T479 | — |
| REQ-411 | Stable-metadata caching | 5.3 Tools, Resources, and Lookups | C | T480 | — |
| REQ-412 | Turn-handoff directive | 5.20 Narrative Turn Conventions | C | T482 | — |
| REQ-413 | Action-discriminator tool surface | 5.3 Tools, Resources, and Lookups | A | — | — |
| REQ-414 | Schema-surface economy | 5.3 Tools, Resources, and Lookups | A | — | — |
| REQ-415 | Summary-first tool catalog | 5.3 Tools, Resources, and Lookups | A | T488 | — |
| REQ-416 | Config default inheritance | 5.7 Determinism, Safety, and Performance | A | — | — |
| REQ-417 | Non-blocking startup probes | 5.7 Determinism, Safety, and Performance | A | — | — |
| REQ-418 | Deployment verification | 5.18 Workflow Entry Points | E | — | — |
| REQ-419 | Editorial delta classification | 5.17 Ruleset Packages | E | — | — |

