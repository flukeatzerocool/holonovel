# REQ Coverage Register

Generated: 2026-08-24

Bucket legend: A = certain gap (no source citation) · B = needs review (cited, no exercised test) · C = evidenced (cited + exercised) · D = spec-side (no `Check:` citation) · E = intended gap (builder/verifier-side, exempt from strict).

| REQ | Title | Section | Bucket | Exercised tests | §5.12 disposition |
|-----|-------|---------|--------|-----------------|-------------------|
| REQ-001 | Response contract (4 sub-parts) | 5.1 Output and Error Contracts | B | — | — |
| REQ-002 | Error taxonomy (6 sub-parts) | 5.1 Output and Error Contracts | A | — | — |
| REQ-003 | Roll transparency (Part a) (3 sub-parts) | 5.1 Output and Error Contracts | A | — | — |
| REQ-004 | Truncation (1 sub-part) | 5.1 Output and Error Contracts | A | — | — |
| REQ-010 | Traceability | 5.2 Extraction and Confidence | E | — | — |
| REQ-011 | Confidence (Part a) (3 sub-parts) | 5.2 Extraction and Confidence | E | — | — |
| REQ-012 | Graceful fallback | 5.2 Extraction and Confidence | E | — | — |
| REQ-013 | No assumed mechanics | 5.2 Extraction and Confidence | E | — | — |
| REQ-014 | Source immutability | 5.2 Extraction and Confidence | E | — | — |
| REQ-015 | Action classification | 5.2 Extraction and Confidence | E | — | — |
| REQ-016 | Guidance extraction | 5.2 Extraction and Confidence | E | — | — |
| REQ-017 | Badge stories | 5.2 Extraction and Confidence | E | — | — |
| REQ-018 | Extraction evidence | 5.2 Extraction and Confidence | E | — | — |
| REQ-020 | Tools (Part a) (2 sub-parts) | 5.3 Tools, Resources, and Lookups | B | — | — |
| REQ-021 | Tool-surface economy | 5.3 Tools, Resources, and Lookups | A | — | — |
| REQ-022 | Resources (Part a) (2 sub-parts) | 5.3 Tools, Resources, and Lookups | B | — | — |
| REQ-023 | Prompts (Part a) (2 sub-parts) | 5.3 Tools, Resources, and Lookups | B | — | — |
| REQ-024 | Tool documentation (Part a) (2 sub-parts) | 5.3 Tools, Resources, and Lookups | A | — | — |
| REQ-025 | spec_health (Part a) (4 sub-parts) | 5.3 Tools, Resources, and Lookups | A | — | — |
| REQ-030 | Single-user connection | 5.5 Badges and Access | A | — | — |
| REQ-031 | Badge activation (Part a) (2 sub-parts) | 5.5 Badges and Access | A | — | — |
| REQ-032 | Server-side gating (Part a) (2 sub-parts) | 5.5 Badges and Access | A | T100, T101 | — |
| REQ-040 | Audit log (Part a) (4 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | C | T100 | — |
| REQ-041 | Snapshots and undo (Part a) (3 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | C | T138 | — |
| REQ-042 | Workflow decisions (Part a) (6 sub-parts) | 5.4 Decision workflows | C | T138, T157 | — |
| REQ-043 | Conflict lifecycle (Part a) (7 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | B | — | — |
| REQ-044 | Ruleset hash recording | 5.6 State, Lifecycle, Entities, and Adventure Content | A | — | — |
| REQ-050 | Determinism (Part a) (3 sub-parts) | 5.7 Determinism, Safety, and Performance | B | — | — |
| REQ-051 | No runtime network access | 5.7 Determinism, Safety, and Performance | A | — | — |
| REQ-052 | Path containment | 5.7 Determinism, Safety, and Performance | A | — | — |
| REQ-054 | Input safety | 5.7 Determinism, Safety, and Performance | A | — | — |
| REQ-055 | Durability (2 sub-parts) | 5.7 Determinism, Safety, and Performance | C | T98 | — |
| REQ-056 | Advancement workflow | 5.4 Decision workflows | A | — | — |
| REQ-057 | Canonical lookup tools (Part a) (2 sub-parts) | 5.3 Tools, Resources, and Lookups | A | — | — |
| REQ-058 | Tool-result fidelity | 5.3 Tools, Resources, and Lookups | A | — | — |
| REQ-059 | Parameter canon validation (Part a) (3 sub-parts) | 5.3 Tools, Resources, and Lookups | A | — | — |
| REQ-060 | Verbose output (Part a) (2 sub-parts) | 5.1 Output and Error Contracts | A | — | — |
| REQ-061 | Source quoting | 5.1 Output and Error Contracts | A | — | — |
| REQ-062 | Badge foundations | 5.1 Output and Error Contracts | B | — | — |
| REQ-063 | Connection introduction (Part a) (3 sub-parts) | 5.3 Tools, Resources, and Lookups | A | — | — |
| REQ-064 | Badge behavioral boundaries (Part a) (6 sub-parts) | 5.1 Output and Error Contracts | A | — | — |
| REQ-065 | Build fingerprint (Part a) (6 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | B | — | — |
| REQ-066 | set_badge tool (Part a) (2 sub-parts) | 5.5 Badges and Access | A | T138 | — |
| REQ-067 | Help and tool discovery (Part a) (3 sub-parts) | 5.3 Tools, Resources, and Lookups | E | — | — |
| REQ-069 | Player feedback signal (Part a) (3 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | A | — | — |
| REQ-070 | Anti-slop guidance (Part a) (2 sub-parts) | 5.1 Output and Error Contracts | A | — | — |
| REQ-071 | Narrative tone samples (Part a) (2 sub-parts) | 5.1 Output and Error Contracts | A | — | — |
| REQ-072 | Session recap (Part a1) (9 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | A | — | — |
| REQ-073 | Countdowns (Part c1) (5 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | C | T404, T406, T409, T410, T411 | — |
| REQ-074 | Multi-entity support (Part a) (3 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | B | — | — |
| REQ-075 | Named-NPC state (Part a) (5 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | C | T409 | — |
| REQ-076 | Scene-state ledger (Part b1) (9 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | B | — | — |
| REQ-077 | Entity personality fields (Part a) (6 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | C | T412 | — |
| REQ-078 | Session zero prompt (Part a) (7 sub-parts) | 5.3 Tools, Resources, and Lookups | A | — | — |
| REQ-079 | Adventure modules (Part a) (11 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | B | — | — |
| REQ-080 | Synthesis boundaries (Part a) (8 sub-parts) | 5.8 Synthesis, Lore, and Macros | B | — | — |
| REQ-081 | Narrative directive (Part a) (4 sub-parts) | 5.8 Synthesis, Lore, and Macros | B | — | — |
| REQ-082 | Prompt section ordering (Part a) (3 sub-parts) | 5.8 Synthesis, Lore, and Macros | B | — | — |
| REQ-083 | Dynamic lore (Part a) (6 sub-parts) | 5.8 Synthesis, Lore, and Macros | C | T400, T407, T411 | — |
| REQ-084 | Action suggestions (Part b1) (7 sub-parts) | 5.8 Synthesis, Lore, and Macros | B | — | — |
| REQ-085 | Macro system (Part a) (2 sub-parts) | 5.8 Synthesis, Lore, and Macros | B | — | — |
| REQ-086 | Audit compression (Part a) (3 sub-parts) | 5.8 Synthesis, Lore, and Macros | A | — | — |
| REQ-087 | Scene type tagging (Part a) (3 sub-parts) | 5.8 Synthesis, Lore, and Macros | A | — | — |
| REQ-088 | Novel lifecycle (Part a) (9 sub-parts) | 5.9 Novel Persistence and Transport | C | T98, T402 | — |
| REQ-089 | Novel setup (Part a) (4 sub-parts) | 5.9 Novel Persistence and Transport | C | T74 | — |
| REQ-090 | Adventure generation (Part a) (5 sub-parts) | 5.9 Novel Persistence and Transport | B | — | — |
| REQ-091 | Enhanced encounter generation (Part a) (2 sub-parts) | 5.9 Novel Persistence and Transport | B | — | — |
| REQ-092 | Novel persistence (Part a) (9 sub-parts) | 5.9 Novel Persistence and Transport | C | T138 | — |
| REQ-093 | Novel listing and metadata (Part a) (3 sub-parts) | 5.9 Novel Persistence and Transport | C | T78, T99 | — |
| REQ-094 | Lorebook interchange (Part a) (3 sub-parts) | 5.9 Novel Persistence and Transport | A | — | — |
| REQ-095 | Novel switching (Part a) (2 sub-parts) | 5.9 Novel Persistence and Transport | C | T98 | — |
| REQ-096 | Novel interchange (Part a) (11 sub-parts) | 5.9 Novel Persistence and Transport | C | T100, T281 | — |
| REQ-097 | Novel health (Part a1) (4 sub-parts) | 5.9 Novel Persistence and Transport | C | T101, T160 | — |
| REQ-098 | Spec-driven update workflow | 5.20 Narrative Turn Conventions | A | — | — |
| REQ-099 | Confidence-floor acknowledgment | 5.2 Extraction and Confidence | E | — | — |
| REQ-100 | Performance benchmark (Part a) (4 sub-parts) | 5.7 Determinism, Safety, and Performance | A | — | — |
| REQ-101 | Assumption audit trail (Part a) (3 sub-parts) | 5.1 Output and Error Contracts | A | — | — |
| REQ-102 | Source conversion contract (Part a) (3 sub-parts) | 5.2 Extraction and Confidence | E | — | — |
| REQ-103 | Synthesis reversion (Part a) (4 sub-parts) | 5.8 Synthesis, Lore, and Macros | B | — | — |
| REQ-104 | Character creation workflow (Part a) (3 sub-parts) | 5.4 Decision workflows | C | T468 | — |
| REQ-105 | Spec resource | 5.3 Tools, Resources, and Lookups | B | — | — |
| REQ-106 | Spec repository URL | 5.3 Tools, Resources, and Lookups | A | — | — |
| REQ-107 | Version coordination (Part a) (2 sub-parts) | 5.3 Tools, Resources, and Lookups | E | — | — |
| REQ-108 | Pattern Buffer traceability (Part a) (2 sub-parts) | 5.20 Narrative Turn Conventions | A | — | — |
| REQ-109 | Badge briefing composition (Part a) (8 sub-parts) | 5.5 Badges and Access | B | — | — |
| REQ-110 | Tool surface consolidation | 5.3 Tools, Resources, and Lookups | A | — | — |
| REQ-111 | Search result quality (Part a) (2 sub-parts) | 5.2 Extraction and Confidence | E | — | — |
| REQ-112 | Cross-reference discovery | 5.3 Tools, Resources, and Lookups | A | — | — |
| REQ-113 | Result count reporting | 5.1 Output and Error Contracts | A | — | — |
| REQ-114 | Suggestion coverage (Part a) (2 sub-parts) | 5.8 Synthesis, Lore, and Macros | A | — | — |
| REQ-115 | Action pattern activation (Part a) (2 sub-parts) | 5.8 Synthesis, Lore, and Macros | A | — | — |
| REQ-116 | Redo | 5.6 State, Lifecycle, Entities, and Adventure Content | B | — | — |
| REQ-117 | Novel retention period | 5.9 Novel Persistence and Transport | A | — | — |
| REQ-118 | Prompt length budget (Part a) (2 sub-parts) | 5.1 Output and Error Contracts | A | — | — |
| REQ-119 | NPC stat block reference (Part a) (4 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | A | — | — |
| REQ-120 | NPC rendering | 5.6 State, Lifecycle, Entities, and Adventure Content | A | — | — |
| REQ-121 | NPC resource URIs | 5.6 State, Lifecycle, Entities, and Adventure Content | A | — | — |
| REQ-122 | NPC narrative fields (Part a) (2 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | A | — | — |
| REQ-123 | Builder-defined NPC stat fields | 5.6 State, Lifecycle, Entities, and Adventure Content | A | — | — |
| REQ-124 | NPC damage resolution (Part a) (2 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | A | — | — |
| REQ-125 | Scene transition hook (Part a) (2 sub-parts) | 5.8 Synthesis, Lore, and Macros | C | T404 | — |
| REQ-126 | Voice examples rendering (Part a) (2 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | A | — | — |
| REQ-127 | Ruleset-native personality mapping (Part a) (2 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | A | — | — |
| REQ-128 | Signal briefing surface (Part a) (2 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | A | — | — |
| REQ-129 | Property group cardinality (Part a) (5 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | A | — | — |
| REQ-130 | Synthesis rebuild contract (Part a) (3 sub-parts) | 5.8 Synthesis, Lore, and Macros | A | — | — |
| REQ-131 | Novel initialization order (Part a) (3 sub-parts) | 5.9 Novel Persistence and Transport | A | — | — |
| REQ-132 | Adventure generation lifecycle (Part a) (5 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | A | — | — |
| REQ-133 | Forbidden-call audit (Part a) (2 sub-parts) | 5.5 Badges and Access | A | — | — |
| REQ-134 | Minimum Player tool surface | 5.5 Badges and Access | A | — | — |
| REQ-135 | Badge briefing size budget (Part a) (3 sub-parts) | 5.5 Badges and Access | A | — | — |
| REQ-136 | Editor-badge briefing (Part a) (2 sub-parts) | 5.5 Badges and Access | A | — | — |
| REQ-137 | Gate classification auditability (Part a) (2 sub-parts) | 5.5 Badges and Access | A | — | — |
| REQ-138 | Prompt health reporting (Part a) (2 sub-parts) | 5.3 Tools, Resources, and Lookups | A | — | — |
| REQ-139 | Resource URI completeness reporting | 5.3 Tools, Resources, and Lookups | A | — | — |
| REQ-140 | End-Novel confirmation dispatch | 5.4 Decision workflows | A | — | — |
| REQ-141 | Input-validation convergence metric (Part a) (10 sub-parts) | 5.20 Narrative Turn Conventions | A | — | — |
| REQ-142 | Blocking classification principle (Part a) (2 sub-parts) | 5.20 Narrative Turn Conventions | A | — | — |
| REQ-146 | Reconciliation authority (Part a) (4 sub-parts) | 5.2 Extraction and Confidence | A | — | — |
| REQ-147 | Confidence aggregation (Part a) (2 sub-parts) | 5.2 Extraction and Confidence | E | — | — |
| REQ-148 | Structural integrity gate | 5.5 Badges and Access | A | — | — |
| REQ-149 | MCP conformance gate | 5.5 Badges and Access | A | — | — |
| REQ-150 | Golden transcript coverage completeness (Part a) (2 sub-parts) | 5.5 Badges and Access | A | — | — |
| REQ-151 | Creation step enumeration (Part a) (2 sub-parts) | 5.4 Decision workflows | C | T468 | — |
| REQ-152 | Starting equipment assignment (Part a) (2 sub-parts) | 5.4 Decision workflows | C | T468 | — |
| REQ-153 | AGENTS.md troubleshooting | 5.2 Extraction and Confidence | E | — | — |
| REQ-154 | README.md handoff content (Part a) (2 sub-parts) | 5.2 Extraction and Confidence | E | — | — |
| REQ-155 | Sticky counter decay (Part a) (2 sub-parts) | 5.8 Synthesis, Lore, and Macros | A | — | — |
| REQ-156 | NPC description field | 5.6 State, Lifecycle, Entities, and Adventure Content | A | — | — |
| REQ-157 | Combat determinism (Part a) (2 sub-parts) | 5.7 Determinism, Safety, and Performance | A | — | — |
| REQ-158 | Independent verification obligation (Part a) (2 sub-parts) | 5.8 Synthesis, Lore, and Macros | A | — | — |
| REQ-159 | Synthesis briefing integration (Part a) (4 sub-parts) | 5.5 Badges and Access | B | — | — |
| REQ-160 | Synthesis health reporting (Part a) (3 sub-parts) | 5.3 Tools, Resources, and Lookups | B | — | — |
| REQ-161 | Intake workflow contract (Part a) (3 sub-parts) | 5.3 Tools, Resources, and Lookups | E | — | — |
| REQ-162 | Build-mode profiles (Part a) (3 sub-parts) | 5.3 Tools, Resources, and Lookups | E | — | — |
| REQ-163 | Client config verification (Part a) (2 sub-parts) | 5.3 Tools, Resources, and Lookups | E | — | — |
| REQ-164 | Viability pre-check (Part a) (2 sub-parts) | 5.3 Tools, Resources, and Lookups | E | — | — |
| REQ-165 | Entity ownership for personality gating (Part a) (2 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | A | — | — |
| REQ-166 | Personality briefing rendering (Part a) (3 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | A | — | — |
| REQ-167 | Personality resource URIs (Part a) (2 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | A | — | — |
| REQ-168 | Audit resource (Part a) (2 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | A | T100 | — |
| REQ-169 | Audit chain integrity reporting (Part a) (2 sub-parts) | 5.3 Tools, Resources, and Lookups | A | — | — |
| REQ-170 | Adventure discovery surface | 5.6 State, Lifecycle, Entities, and Adventure Content | A | — | — |
| REQ-171 | Adventure content validation (Part a) (2 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | A | — | — |
| REQ-172 | Adventure content drift detection | 5.6 State, Lifecycle, Entities, and Adventure Content | A | — | — |
| REQ-173 | Connection counter (Part a) (3 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | A | — | — |
| REQ-174 | Significant-roll criterion for recap (Part a) (2 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | A | — | — |
| REQ-175 | Confrontation summary derivation (Part a) (2 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | A | — | — |
| REQ-176 | Entity removal (Part a) (2 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | A | — | — |
| REQ-177 | Roster entity removal | 5.6 State, Lifecycle, Entities, and Adventure Content | A | — | — |
| REQ-178 | Roster listing (Part a) (2 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | A | — | — |
| REQ-179 | Output pointer resource template (Part a) (2 sub-parts) | 5.1 Output and Error Contracts | B | — | — |
| REQ-180 | Truncation budget unit (Part a) (2 sub-parts) | 5.5 Badges and Access | A | — | — |
| REQ-181 | Character creation output surface (Part a) (2 sub-parts) | 5.4 Decision workflows | C | T468 | — |
| REQ-182 | Bounded-domain parameter documentation (Part a) (2 sub-parts) | 5.3 Tools, Resources, and Lookups | A | — | — |
| REQ-183 | Live-index-derived error enumerations (Part a) (2 sub-parts) | 5.3 Tools, Resources, and Lookups | A | — | — |
| REQ-184 | Anti-slop resource rendering (Part a) (2 sub-parts) | 5.1 Output and Error Contracts | A | — | — |
| REQ-185 | Section token vocabulary (Part a) (3 sub-parts) | 5.8 Synthesis, Lore, and Macros | A | — | — |
| REQ-186 | Section token discoverability (Part a) (2 sub-parts) | 5.8 Synthesis, Lore, and Macros | A | — | — |
| REQ-187 | Spec content hash computation (Part a) (2 sub-parts) | 5.3 Tools, Resources, and Lookups | E | — | — |
| REQ-190 | Respond drain result | 5.4 Decision workflows | A | T138 | — |
| REQ-191 | Option display-label pairs | 5.4 Decision workflows | A | — | — |
| REQ-192 | Batch-respond collision | 5.4 Decision workflows | A | — | — |
| REQ-193 | Pending workflow staleness detection (Part a) (2 sub-parts) | 5.4 Decision workflows | B | — | — |
| REQ-194 | Anchor derivation (Part a) (2 sub-parts) | 5.1 Output and Error Contracts | A | — | — |
| REQ-195 | World-model state tier (Part a) (2 sub-parts) | 5.10 World-Model Layer | C | T238, T414, T415, I5, I10 | — |
| REQ-196 | Parser command dispatch (Part a) (6 sub-parts) | 5.10 World-Model Layer | C | I5, I7 | — |
| REQ-197 | Room description generation (Part a) (4 sub-parts) | 5.10 World-Model Layer | A | T240, I1, I4 | — |
| REQ-198 | World-model CRUD | 5.10 World-Model Layer | C | I2, I4 | — |
| REQ-199 | Property state tracking | 5.10 World-Model Layer | C | I4, I9 | — |
| REQ-200 | Kind mechanical contracts | 5.10 World-Model Layer | C | I7 | — |
| REQ-201 | Hybrid source conversion | 5.10 World-Model Layer | C | I5, I10 | — |
| REQ-202 | World-model resources (Part a) (2 sub-parts) | 5.10 World-Model Layer | C | I5 | — |
| REQ-203 | Combat-init guard | 5.6 State, Lifecycle, Entities, and Adventure Content | A | — | — |
| REQ-204 | Combat participant validation (Part a) (2 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | A | — | — |
| REQ-205 | Mid-combat participant changes (Part a) (3 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | A | — | — |
| REQ-206 | Combat-round condition expiry (Part a) (3 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | A | — | — |
| REQ-207 | Core-mechanic identification (Part a) (3 sub-parts) | 5.2 Extraction and Confidence | E | — | — |
| REQ-208 | Pattern Buffer convergence metric mapping (Part a) (2 sub-parts) | 5.20 Narrative Turn Conventions | A | — | — |
| REQ-209 | Cross-format consistency | 5.2 Extraction and Confidence | E | — | — |
| REQ-210 | Extraction categories (Part a) (2 sub-parts) | 5.2 Extraction and Confidence | E | — | — |
| REQ-211 | Evidence record field contract (Part a) (3 sub-parts) | 5.5 Badges and Access | A | — | — |
| REQ-212 | Generation table rolling (Part a) (2 sub-parts) | 5.2 Extraction and Confidence | E | — | — |
| REQ-213 | Weighted table result mapping (Part a) (3 sub-parts) | 5.7 Determinism, Safety, and Performance | B | — | — |
| REQ-214 | Table classification (Part a) (3 sub-parts) | 5.2 Extraction and Confidence | E | — | — |
| REQ-215 | Table content extraction (Part a) (3 sub-parts) | 5.2 Extraction and Confidence | E | T256 | — |
| REQ-216 | Generation table badge filtering (Part a) (2 sub-parts) | 5.5 Badges and Access | A | T257 | — |
| REQ-217 | Condition tools (Part a) (4 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | A | T258 | — |
| REQ-218 | Ruleset-free build (Part a) (3 sub-parts) | 5.11 Ruleset-Free Build Mode | B | — | — |
| REQ-219 | Ruleset-free entity creation (Part a1) (3 sub-parts) | 5.11 Ruleset-Free Build Mode | C | T468 | — |
| REQ-220 | Narrative point of view (Part a) (4 sub-parts) | 5.5 Badges and Access | A | — | — |
| REQ-221 | Combat-navigation interaction (Part a) (2 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | A | — | — |
| REQ-222 | Parser command vocabulary extension (Part a) (3 sub-parts) | 5.10 World-Model Layer | C | I4, I7 | — |
| REQ-223 | POV mode control (Part a) (3 sub-parts) | 5.5 Badges and Access | A | — | — |
| REQ-224 | Workflow staleness detection (Part a) (3 sub-parts) | 5.4 Decision workflows | C | T266 | — |
| REQ-225 | Ruleset Wisdom extraction (Part a) (2 sub-parts) | 5.2 Extraction and Confidence | E | — | — |
| REQ-226 | Narrative voice profiles (Part a) (3 sub-parts) | 5.8 Synthesis, Lore, and Macros | A | — | — |
| REQ-227 | Synthesis model (Part a) (2 sub-parts) | 5.8 Synthesis, Lore, and Macros | B | — | — |
| REQ-228 | Synthesis consistency during spec-driven updates (Part a) (3 sub-parts) | 5.8 Synthesis, Lore, and Macros | A | — | — |
| REQ-229 | Adventure synthesis linkage (Part a) (4 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | A | — | — |
| REQ-230 | Synthesis status dashboard (Part a) (2 sub-parts) | 5.8 Synthesis, Lore, and Macros | B | — | — |
| REQ-231 | Per-module synthesis toggle (Part a) (2 sub-parts) | 5.8 Synthesis, Lore, and Macros | A | — | — |
| REQ-232 | Pause/resume context (Part a) (4 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | B | — | — |
| REQ-233 | Factions (Part b1) (6 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | C | T408, T413, T415 | — |
| REQ-234 | Secrets and knowledge (Part a) (4 sub-parts) | 5.8 Synthesis, Lore, and Macros | C | T406, T414 | — |
| REQ-235 | Structured player choices (Part a) (3 sub-parts) | 5.4 Decision workflows | B | — | — |
| REQ-236 | Entity relationships (Part a) (3 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | C | T410 | — |
| REQ-237 | Session segmentation (Part a) (3 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | A | — | — |
| REQ-238 | Backup rotation (Part a) (2 sub-parts) | 5.9 Novel Persistence and Transport | C | T276 | — |
| REQ-239 | Audit log compaction (Part a) (4 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | B | — | — |
| REQ-240 | Clone Novel (Part a) (3 sub-parts) | 5.9 Novel Persistence and Transport | C | T278 | — |
| REQ-241 | Checkpoints (Part a) (3 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | B | — | — |
| REQ-242 | Notes (Part a) (4 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | B | — | — |
| REQ-243 | Synthesis population during spec-driven updates (Part a) (4 sub-parts) | 5.8 Synthesis, Lore, and Macros | A | — | — |
| REQ-244 | Convergence cache key (Part a) (5 sub-parts) | 5.8 Synthesis, Lore, and Macros | A | — | — |
| REQ-245 | Pre-computed synthesis manifest (Part a) (5 sub-parts) | 5.8 Synthesis, Lore, and Macros | A | — | — |
| REQ-246 | Story journal (Part b1) (3 sub-parts) | 5.8 Synthesis, Lore, and Macros | C | T408 | — |
| REQ-247 | Adventure structure extraction (Part a) (4 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | A | — | — |
| REQ-248 | Adventure overview resource (Part a) (2 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | A | — | — |
| REQ-249 | Adventure navigation resource (Part a) (2 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | A | — | — |
| REQ-250 | Adventure scene waypoint (Part a) (3 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | A | — | — |
| REQ-251 | Generation intent guard (Part a) (4 sub-parts) | 5.7 Determinism, Safety, and Performance | A | — | — |
| REQ-252 | Narrative fast-forward (Part a) (3 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | A | — | — |
| REQ-253 | Tool-output verbosity control (Part a) (3 sub-parts) | 5.7 Determinism, Safety, and Performance | A | — | — |
| REQ-255 | Boundary signal propagation (Part a) (3 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | A | — | — |
| REQ-256 | Rename Novel (Part a) (2 sub-parts) | 5.9 Novel Persistence and Transport | C | T315 | — |
| REQ-257 | List Novels (Part a) (2 sub-parts) | 5.9 Novel Persistence and Transport | C | T316 | — |
| REQ-258 | Novel info (Part a) (2 sub-parts) | 5.9 Novel Persistence and Transport | C | T317 | — |
| REQ-259 | Update Novel description | 5.9 Novel Persistence and Transport | A | — | — |
| REQ-260 | Granular synthesis activation (Part a) (4 sub-parts) | 5.8 Synthesis, Lore, and Macros | B | — | — |
| REQ-261 | Player synthesis (Part a) (5 sub-parts) | 5.8 Synthesis, Lore, and Macros | A | — | — |
| REQ-262 | Synthesis tool (Part a) (3 sub-parts) | 5.8 Synthesis, Lore, and Macros | A | — | — |
| REQ-263 | Synthesis auto-trigger (Part a) (2 sub-parts) | 5.8 Synthesis, Lore, and Macros | A | — | — |
| REQ-264 | Synthesis confidence model (Part a) (3 sub-parts) | 5.8 Synthesis, Lore, and Macros | A | — | — |
| REQ-265 | Synthesis in badge_briefing (Part a) (3 sub-parts) | 5.8 Synthesis, Lore, and Macros | A | — | — |
| REQ-266 | Synthesis in dashboard (Part a) (2 sub-parts) | 5.8 Synthesis, Lore, and Macros | A | — | — |
| REQ-269 | Safety protocol status | 5.3 Tools, Resources, and Lookups | A | — | — |
| REQ-270 | Artifact version identification | 5.2 Extraction and Confidence | A | — | — |
| REQ-271 | AGENTS.md structure contract | 5.2 Extraction and Confidence | A | — | — |
| REQ-272 | Stock elements catalog | 5.2 Extraction and Confidence | E | — | — |
| REQ-273 | Independent verification reproducibility tolerance (Part a) (2 sub-parts) | 5.7 Determinism, Safety, and Performance | A | — | — |
| REQ-274 | Independent verifier confidence score | 5.7 Determinism, Safety, and Performance | A | — | — |
| REQ-275 | Evidence hash commitment | 5.5 Badges and Access | A | — | — |
| REQ-276 | Independent verifier model criteria | 5.5 Badges and Access | A | — | — |
| REQ-277 | Fixture evolution contract | 5.1 Output and Error Contracts | A | — | — |
| REQ-278 | Build-phase-map staleness detection | 5.3 Tools, Resources, and Lookups | E | — | — |
| REQ-279 | Narrative orientation (Part a) (3 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | A | — | — |
| REQ-280 | Source-anchor citation (Part a) (3 sub-parts) | 5.1 Output and Error Contracts | A | — | — |
| REQ-281 | Narrative-threads section token (Part a) (3 sub-parts) | 5.5 Badges and Access | A | — | — |
| REQ-282 | NPC voice directive (Part a) (4 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | A | — | — |
| REQ-283 | Verb coverage tiers (Part a) (3 sub-parts) | 5.10 World-Model Layer | A | — | — |
| REQ-284 | Implicit action hints (Part a) (5 sub-parts) | 5.10 World-Model Layer | A | I6 | — |
| REQ-285 | Server notes (Part a) (3 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | C | T416 | — |
| REQ-286 | Knowledge-state section token (Part a) (3 sub-parts) | 5.5 Badges and Access | C | T399 | — |
| REQ-289 | Vow tracking (Part a) (5 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | C | T407, T412, T413 | — |
| REQ-291 | Oracle tool (Part a) (4 sub-parts) | 5.7 Determinism, Safety, and Performance | B | — | — |
| REQ-292 | Adventure catalog (Part a) (4 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | A | — | — |
| REQ-294 | Genre declaration | 5.9 Novel Persistence and Transport | A | — | — |
| REQ-295 | Genre-filtered generation (Part a) (3 sub-parts) | 5.9 Novel Persistence and Transport | A | — | — |
| REQ-296 | Knowledge-graph resource (Part a) (2 sub-parts) | 5.3 Tools, Resources, and Lookups | B | — | — |
| REQ-299 | Cross-model audit sufficiency | 5.20 Narrative Turn Conventions | A | — | — |
| REQ-300 | Structured failure diagnostics | 5.20 Narrative Turn Conventions | A | — | — |
| REQ-301 | Convergence loop audit trail | 5.20 Narrative Turn Conventions | A | — | — |
| REQ-302 | Per-section content hashing (Part a) (2 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | A | — | — |
| REQ-303 | Scoped re-verification | 5.20 Narrative Turn Conventions | A | — | — |
| REQ-304 | Counterpart AI role (Part a) (3 sub-parts) | 5.5 Badges and Access | A | — | — |
| REQ-305 | Observer mode (Part a) (2 sub-parts) | 5.5 Badges and Access | A | T417 | — |
| REQ-306 | Adjustable autonomy (Part a) (7 sub-parts) | 5.5 Badges and Access | B | — | — |
| REQ-307 | Entity presence (Part a) (3 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | B | — | — |
| REQ-308 | Knowledge gating by presence (Part a) (2 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | A | — | — |
| REQ-309 | World and narrative surface prominence (Part a) (8 sub-parts) | 5.10 World-Model Layer | C | I7, I13 | — |
| REQ-310 | Campaign Memory (Part a) (7 sub-parts) | 5.8 Synthesis, Lore, and Macros | A | — | — |
| REQ-311 | NPC memory model (Part a) (7 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | A | — | — |
| REQ-312 | Pre-narration validation gate (Part d1) (5 sub-parts) | 5.7 Determinism, Safety, and Performance | A | — | — |
| REQ-313 | Server implementation fingerprinting (Part a) (4 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | A | — | — |
| REQ-314 | Fingerprint-driven partial rebuild (Part a) (4 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | A | — | — |
| REQ-315 | Full-text ruleset indexing (Part a) (2 sub-parts) | 5.2 Extraction and Confidence | E | — | — |
| REQ-316 | Device kind (Part a) (2 sub-parts) | 5.10 World-Model Layer | B | — | — |
| REQ-317 | Vehicle kind (Part a) (4 sub-parts) | 5.10 World-Model Layer | B | — | — |
| REQ-318 | Extended property contracts (Part a) (2 sub-parts) | 5.10 World-Model Layer | B | — | — |
| REQ-319 | Extended parser command vocabulary (Part a) (4 sub-parts) | 5.10 World-Model Layer | B | — | — |
| REQ-320 | Narrative-intent parser verbs (Part a) (3 sub-parts) | 5.10 World-Model Layer | B | — | — |
| REQ-321 | Codex (Part a) (16 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | C | T397, T402 | — |
| REQ-322 | Vow-countdown coupling (Part a) (4 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | A | — | — |
| REQ-323 | resolve_intent tool (Part a) (2 sub-parts) | 5.3 Tools, Resources, and Lookups | B | — | — |
| REQ-324 | Constraint override extraction | 5.2 Extraction and Confidence | E | — | — |
| REQ-325 | Constraint override catalog (Part a) (3 sub-parts) | 5.10 World-Model Layer | C | I3, I6 | — |
| REQ-326 | Scene-world coupling (Part a) (4 sub-parts) | 5.10 World-Model Layer | C | I10, I13 | — |
| REQ-327 | NPC-world coupling (Part a) (3 sub-parts) | 5.10 World-Model Layer | A | I11 | — |
| REQ-328 | Lore-world coupling (Part a) (2 sub-parts) | 5.8 Synthesis, Lore, and Macros | A | — | — |
| REQ-329 | Countdown-world coupling (Part a) (2 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | A | — | — |
| REQ-330 | Knowledge-world coupling (Part a) (3 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | A | — | — |
| REQ-331 | Story journal-world coupling (Part a) (2 sub-parts) | 5.8 Synthesis, Lore, and Macros | A | — | — |
| REQ-332 | Codex provenance (Part a) (3 sub-parts) | 5.6 State, Lifecycle, Entities, and Adventure Content | A | — | — |
| REQ-333 | Story journal to lore promotion (Part a) (3 sub-parts) | 5.8 Synthesis, Lore, and Macros | A | — | — |
| REQ-334 | Novel archive (Part a) (4 sub-parts) | 5.9 Novel Persistence and Transport | A | — | — |
| REQ-335 | Scene beat taxonomy (Part a) (3 sub-parts) | 5.12 Narrative Architecture | C | T385, T404 | implemented |
| REQ-336 | Dramatic pacing signal (Part a) (2 sub-parts) | 5.12 Narrative Architecture | C | T401 | implemented |
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
| REQ-354 | Extended narrative extraction | 5.2 Extraction and Confidence | B | — | partial |
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
| REQ-367 | Property propagation across containment (Part a) (4 sub-parts) | 5.10 World-Model Layer | A | I6 | — |
| REQ-368 | Countdown-world effect coupling (Part a) (5 sub-parts) | 5.10 World-Model Layer | A | — | — |
| REQ-369 | Holodeck archetype taxonomy (Part a) (2 sub-parts) | 5.13 Holodeck | A | — | — |
| REQ-370 | Coupling derivation (Part a) (2 sub-parts) | 5.13 Holodeck | A | — | — |
| REQ-371 | Ruleset Wisdom as rendered reality (Part a) (2 sub-parts) | 5.13 Holodeck | A | — | — |
| REQ-372 | Supplementary ruleset import (Part a) (5 sub-parts) | 5.14 Content Sources | E | — | — |
| REQ-373 | Dynamic tool registration (Part a1) (3 sub-parts) | 5.14 Content Sources | E | — | — |
| REQ-374 | Archetype coverage (Part a) (2 sub-parts) | 5.13 Holodeck | A | — | — |
| REQ-375 | Wisdom mechanical coupling rate (Part a) (2 sub-parts) | 5.13 Holodeck | A | — | — |
| REQ-376 | Holonovel Pattern Buffer traceability (Part a1) (5 sub-parts) | 5.13 Holodeck | A | — | — |
| REQ-377 | Mechanical coupling extraction (Part a) (4 sub-parts) | 5.15 Mechanical Coupling | A | — | — |
| REQ-378 | Mechanical coupling verification (Part a) (2 sub-parts) | 5.15 Mechanical Coupling | A | — | — |
| REQ-379 | Tool namespacing (Part a) (3 sub-parts) | 5.16 Multi-Ruleset Build | E | — | — |
| REQ-380 | Novel ruleset binding (Part a) (3 sub-parts) | 5.16 Multi-Ruleset Build | B | — | — |
| REQ-381 | Ruleset-scoped tool gating (Part a) (3 sub-parts) | 5.16 Multi-Ruleset Build | E | — | — |
| REQ-382 | Per-ruleset extraction isolation (Part a) (3 sub-parts) | 5.16 Multi-Ruleset Build | E | — | — |
| REQ-383 | Host ruleset health (Part a) (2 sub-parts) | 5.16 Multi-Ruleset Build | E | — | — |
| REQ-384 | Cross-ruleset Novel switching (Part a) (3 sub-parts) | 5.16 Multi-Ruleset Build | E | — | — |
| REQ-385 | suggest_actions cross-ruleset scoping (Part a) (2 sub-parts) | 5.16 Multi-Ruleset Build | E | — | — |
| REQ-386 | Cross-ruleset import rejection (Part a) (2 sub-parts) | 5.16 Multi-Ruleset Build | E | — | — |
| REQ-387 | Codex ruleset annotation (Part a) (2 sub-parts) | 5.16 Multi-Ruleset Build | E | — | — |
| REQ-388 | Holodeck config discovery (Part a) (4 sub-parts) | 5.3 Tools, Resources, and Lookups | E | — | — |
| REQ-389 | Ruleset package format (Part a) (3 sub-parts) | 5.17 Ruleset Packages | B | — | — |
| REQ-390 | Lazy ruleset hydration (Part a) (2 sub-parts) | 5.17 Ruleset Packages | B | — | — |
| REQ-391 | Scoped tool listing (Part a) (3 sub-parts) | 5.17 Ruleset Packages | A | — | — |
| REQ-392 | Tool-description budget | 5.17 Ruleset Packages | A | — | — |
| REQ-393 | Update preservation | 5.17 Ruleset Packages | A | — | — |
| REQ-394 | Spec publication integrity | 5.17 Ruleset Packages | A | — | — |
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
| REQ-408 | Tool parameter ceiling | 5.3 Tools, Resources, and Lookups | B | — | — |
| REQ-409 | Response-lean enumeration reads | 5.7 Determinism, Safety, and Performance | B | — | — |
| REQ-410 | Token footprint in performance record | 5.7 Determinism, Safety, and Performance | B | — | — |
| REQ-411 | Stable-metadata caching | 5.3 Tools, Resources, and Lookups | B | — | — |
| REQ-412 | Turn-handoff directive | 5.20 Narrative Turn Conventions | B | — | — |
| REQ-413 | Action-discriminator tool surface | 5.3 Tools, Resources, and Lookups | A | — | — |
| REQ-414 | Schema-surface economy | 5.3 Tools, Resources, and Lookups | A | — | — |
| REQ-415 | Summary-first tool catalog | 5.3 Tools, Resources, and Lookups | A | — | — |
| REQ-416 | Config default inheritance | 5.7 Determinism, Safety, and Performance | A | — | — |
| REQ-417 | Non-blocking startup probes | 5.7 Determinism, Safety, and Performance | A | — | — |
| REQ-418 | Deployment verification | 5.18 Workflow Entry Points | E | — | — |
| REQ-419 | Editorial delta classification | 5.17 Ruleset Packages | E | — | — |

