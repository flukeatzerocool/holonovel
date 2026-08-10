# Narrative World Model — Enrichment Manifest

<!-- Last verified: placeholder — hashes computed at build time per REQ-227 -->

This manifest records per-module pre-audited enrichment data for each vendor source
as defined in §11.2 of the Holonovel specification. The builder compares content hashes
against manifest entries during Phase 1 enrichment convergence (§6.5). Matching hashes
use pre-verified scores; mismatching hashes trigger re-audit.

| Source | Module | Content Hash | Items | HIGH | MEDIUM | LOW | Term Anchoring | Verified |
|---|---|---|---|---|---|---|---|---|
| DMCP (MIT) | voice_examples | (build-time) | — | — | — | — | — | (build-time) |
| DMCP (MIT) | supplementary_guidance | (build-time) | — | — | — | — | — | (build-time) |
| DMCP (MIT) | adventure_advice | (build-time) | — | — | — | — | — | (build-time) |
| BitD SRD (CC-BY 3.0) | adventure_advice | (build-time) | — | — | — | — | — | (build-time) |
| BitD SRD (CC-BY 3.0) | lore_templates | (build-time) | — | — | — | — | — | (build-time) |
| BitD SRD (CC-BY 3.0) | supplementary_guidance | (build-time) | — | — | — | — | — | (build-time) |
| Lonelog (CC BY-SA 4.0) | supplementary_guidance | (build-time) | — | — | — | — | — | (build-time) |
| Lonelog (CC BY-SA 4.0) | briefing_order | (build-time) | — | — | — | — | — | (build-time) |
| IF Craft Corpus (CC-BY 4.0) | narrative_voices | (build-time) | — | — | — | — | — | (build-time) |
| IF Craft Corpus (CC-BY 4.0) | voice_examples | (build-time) | — | — | — | — | — | (build-time) |
| IF Craft Corpus (CC-BY 4.0) | supplementary_guidance | (build-time) | — | — | — | — | — | (build-time) |
| IF Craft Corpus (CC-BY 4.0) | adventure_advice | (build-time) | — | — | — | — | — | (build-time) |
| Ironsworn SRD (CC-BY 4.0) | narrative_voices | (build-time) | 3 | 3 | 0 | 0 | (build-time) | (build-time) |
| Ironsworn SRD (CC-BY 4.0) | action_patterns | (build-time) | 4 | 4 | 0 | 0 | (build-time) | (build-time) |
| Ironsworn SRD (CC-BY 4.0) | adventure_advice | (build-time) | 4 | 4 | 0 | 0 | (build-time) | (build-time) |
| Ironsworn SRD (CC-BY 4.0) | supplementary_guidance | (build-time) | 3 | 2 | 1 | 0 | (build-time) | (build-time) |
| Lazy GM (CC-BY 4.0) | supplementary_guidance | (build-time) | 5 | 4 | 1 | 0 | (build-time) | (build-time) |
| Lazy GM (CC-BY 4.0) | adventure_advice | (build-time) | 4 | 3 | 1 | 0 | (build-time) | (build-time) |
| Lazy GM (CC-BY 4.0) | briefing_order | (build-time) | 1 | 1 | 0 | 0 | (build-time) | (build-time) |
| The Alexandrian (CC-BY 4.0) | adventure_advice | (build-time) | 4 | 1 | 3 | 0 | (build-time) | (build-time) |
| The Alexandrian (CC-BY 4.0) | lore_templates | (build-time) | 3 | 0 | 2 | 1 | (build-time) | (build-time) |

Content hashes are computed at build time by the builder per the partial-refresh
contract (§11.1). Hashes match when the vendor INDEX.md file content is unchanged
from the previous build. Term anchoring scores are computed at build time by
cross-referencing vendor item keywords against the ruleset index.

Source directories:
- `dmcp/` — DMCP (MIT) — not yet populated
- `bitd-srd/` — Blades in the Dark SRD (CC-BY 3.0) — not yet populated
- `lonelog/` — Lonelog (CC BY-SA 4.0) — not yet populated
- `if-craft-corpus/` — IF Craft Corpus (CC-BY 4.0) — not yet populated
- `ironsworn-srd/` — Ironsworn: Starforged SRD (CC-BY 4.0) — populated
- `lazy-gm/` — Sly Flourish Lazy GM Resource Document (CC-BY 4.0) — populated
- `alexandrian/` — The Alexandrian (CC-BY 4.0) — populated
