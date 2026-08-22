# Holonovel Vendored Content — Pre-verified Manifest

Records per-module pre-audited enrichment data for each vendor source per §11.4.
The builder compares each module's content hash against this manifest during
Phase 1 convergence (§6.5): matching hashes use the pre-verified confidence
distribution and term-anchoring score; mismatching hashes trigger a re-audit of
only the changed module.

**Content hash convention.** Hash is the SHA-256 of the source file named under
"File" (the §11.1 partial-refresh contract — drift when the file content
changes). Sources whose items are not enumerated in `### id — TIER` headers carry
`(build-time)` for item count and confidence; those fields are audited from
source at build time and the manifest is updated from the audit results.

**Term anchoring** is ruleset-dependent (the fraction of items referencing valid
ruleset index terms) and is computed at build time; it is recorded as
`(build-time)` here.

| Source | Module | File | Content Hash | Items | HIGH | MEDIUM | LOW | Term Anchoring | Verified |
|---|---|---|---|---|---|---|---|---|---|
| Ironsworn: Starforged SRD (CC-BY 4.0) | narrative_voices | ironsworn-srd/INDEX.md | 436538c1c9962aba75d96c497e9c041a1b6a40cb63d5636fed6d6203d460b426 | 3 | 3 | 0 | 0 | (build-time) | 2026-08-22 |
| Ironsworn: Starforged SRD (CC-BY 4.0) | action_patterns | ironsworn-srd/INDEX.md | 436538c1c9962aba75d96c497e9c041a1b6a40cb63d5636fed6d6203d460b426 | 4 | 4 | 0 | 0 | (build-time) | 2026-08-22 |
| Ironsworn: Starforged SRD (CC-BY 4.0) | adventure_advice | ironsworn-srd/INDEX.md | 436538c1c9962aba75d96c497e9c041a1b6a40cb63d5636fed6d6203d460b426 | 4 | 4 | 0 | 0 | (build-time) | 2026-08-22 |
| Ironsworn: Starforged SRD (CC-BY 4.0) | supplementary_guidance | ironsworn-srd/INDEX.md | 436538c1c9962aba75d96c497e9c041a1b6a40cb63d5636fed6d6203d460b426 | 3 | 2 | 1 | 0 | (build-time) | 2026-08-22 |
| Sly Flourish Lazy GM (CC-BY 4.0) | supplementary_guidance | lazy-gm/INDEX.md | c94b88098603c2583b7c8b8fb365564e932a6cc5a1c82cb04a08c24f9eca37ba | 5 | 4 | 1 | 0 | (build-time) | 2026-08-22 |
| Sly Flourish Lazy GM (CC-BY 4.0) | adventure_advice | lazy-gm/INDEX.md | c94b88098603c2583b7c8b8fb365564e932a6cc5a1c82cb04a08c24f9eca37ba | 4 | 3 | 1 | 0 | (build-time) | 2026-08-22 |
| Sly Flourish Lazy GM (CC-BY 4.0) | briefing_order | lazy-gm/INDEX.md | c94b88098603c2583b7c8b8fb365564e932a6cc5a1c82cb04a08c24f9eca37ba | 1 | 1 | 0 | 0 | (build-time) | 2026-08-22 |
| The Alexandrian (CC-BY 4.0) | adventure_advice | alexandrian/INDEX.md | 967839420d1610f430b6549c59f020ec03e027ec53636e426b5825bc822ada2e | 4 | 1 | 3 | 0 | (build-time) | 2026-08-22 |
| The Alexandrian (CC-BY 4.0) | lore_templates | alexandrian/INDEX.md | 967839420d1610f430b6549c59f020ec03e027ec53636e426b5825bc822ada2e | 3 | 0 | 2 | 1 | (build-time) | 2026-08-22 |
| DMCP (MIT) | voice_examples | dmcp/README.md | b6dcd6de151e76e1e648e79fb7e9840a2e616c57de448f3080966b468a0ad78a | (build-time) | (build-time) | (build-time) | (build-time) | (build-time) | (build-time) |
| DMCP (MIT) | supplementary_guidance | dmcp/README.md | b6dcd6de151e76e1e648e79fb7e9840a2e616c57de448f3080966b468a0ad78a | (build-time) | (build-time) | (build-time) | (build-time) | (build-time) | (build-time) |
| DMCP (MIT) | adventure_advice | dmcp/README.md | b6dcd6de151e76e1e648e79fb7e9840a2e616c57de448f3080966b468a0ad78a | (build-time) | (build-time) | (build-time) | (build-time) | (build-time) | (build-time) |
| Blades in the Dark SRD (CC-BY 3.0) | adventure_advice | bitd/progress-clocks.md | e204454b164bbe4236603fffb3acf771115135e6c663e977e0c34b2d4b1b1871 | (build-time) | (build-time) | (build-time) | (build-time) | (build-time) | (build-time) |
| Blades in the Dark SRD (CC-BY 3.0) | lore_templates | bitd/progress-clocks.md | e204454b164bbe4236603fffb3acf771115135e6c663e977e0c34b2d4b1b1871 | (build-time) | (build-time) | (build-time) | (build-time) | (build-time) | (build-time) |
| Blades in the Dark SRD (CC-BY 3.0) | supplementary_guidance | bitd/progress-clocks.md | e204454b164bbe4236603fffb3acf771115135e6c663e977e0c34b2d4b1b1871 | (build-time) | (build-time) | (build-time) | (build-time) | (build-time) | (build-time) |
| Lonelog (CC BY-SA 4.0) | supplementary_guidance | lonelog/lonelog.md | a06fee3ec1434f6b3717032089108fafac4fb3e340e30732a0a90929d85b566e | (build-time) | (build-time) | (build-time) | (build-time) | (build-time) | (build-time) |
| Lonelog (CC BY-SA 4.0) | briefing_order | lonelog/lonelog.md | a06fee3ec1434f6b3717032089108fafac4fb3e340e30732a0a90929d85b566e | (build-time) | (build-time) | (build-time) | (build-time) | (build-time) | (build-time) |
| IF Craft Corpus (CC-BY 4.0) | narrative_voices | if-craft-corpus/README.md | e8ca4e8df94816f552f71f81ade67755823b532294c3aa72a508d4a3b824541f | (build-time) | (build-time) | (build-time) | (build-time) | (build-time) | (build-time) |
| IF Craft Corpus (CC-BY 4.0) | voice_examples | if-craft-corpus/README.md | e8ca4e8df94816f552f71f81ade67755823b532294c3aa72a508d4a3b824541f | (build-time) | (build-time) | (build-time) | (build-time) | (build-time) | (build-time) |
| IF Craft Corpus (CC-BY 4.0) | supplementary_guidance | if-craft-corpus/README.md | e8ca4e8df94816f552f71f81ade67755823b532294c3aa72a508d4a3b824541f | (build-time) | (build-time) | (build-time) | (build-time) | (build-time) | (build-time) |
| IF Craft Corpus (CC-BY 4.0) | adventure_advice | if-craft-corpus/README.md | e8ca4e8df94816f552f71f81ade67755823b532294c3aa72a508d4a3b824541f | (build-time) | (build-time) | (build-time) | (build-time) | (build-time) | (build-time) |
