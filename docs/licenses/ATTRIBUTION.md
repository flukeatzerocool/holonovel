# Third-party attribution register

Due-diligence record for every licensed source Holonovel uses. The license list
itself is generated from Appendix U (`spec/appendices-licenses.md`) into the
README footer; this file adds what the footer cannot carry: **license links,
upstream links, what we use, and whether we modified it.**

Reviewed 2026-11-08. Re-open when a source is added, replaced, or updated.

## Register

| Source | License | License link | Upstream | What we use | Modified? |
|---|---|---|---|---|---|
| D&D 5e SRD v5.2.1 | CC BY 4.0 | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | <https://www.dndbeyond.com/srd> | Ruleset-derived mechanics, extracted at build time from the operator's own copy | No — extracted, not vendored |
| Graham Nelson's Inform | Artistic License 2.0 | [Artistic 2.0](https://opensource.org/license/artistic-2-0) | <https://inform7.com> | Parser and containment *conventions* (ideas), not code | Not applicable — no code copied |
| if-craft-corpus | CC BY 4.0 | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | <https://pvliesdonk.github.io/if-craft-corpus/> | Vendored narrative craft documents, indexed into Ruleset Wisdom | No — byte-identical, hash-pinned in `MANIFEST.md` |
| dmcp | MIT | [MIT](https://opensource.org/license/mit) | <https://github.com/shawnrushefsky/dmcp> | Vendored NPC voice, pacing and campaign-lifecycle guidance | No — byte-identical |
| lonelog | CC BY-SA 4.0 | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) | <https://lonelog.org> | Vendored session-notation structure | No — byte-identical |
| BitD SRD | CC BY 3.0 | [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/) | <https://bladesinthedark.com/> | Vendored clock and tension guidance; progress-clock mechanics | No — byte-identical |
| Ironsworn: Starforged SRD | CC BY 4.0 | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | <https://ironswornrpg.com> | Vendored vows, oracles, solo structure; base capabilities | No — byte-identical |
| Sly Flourish Lazy GM Resource Document | CC BY 4.0 | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | <https://slyflourish.com/lazy_gm_resource_document.html> | Vendored prep, NPC and pacing guidance | No — byte-identical |
| The Alexandrian | CC BY 4.0 | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | <https://thealexandrian.net> | Vendored node-design, Three Clue Rule, intrigue structure | No — byte-identical |
| Dungeon World SRD | CC BY 3.0 | [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/) | <https://www.dungeonworldsrd.com> | Vendored GM agenda, principles, fronts | No — byte-identical |
| Fate SRD | CC BY 3.0 | [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/) | <https://fate-srd.com> | Base capabilities reimplemented in the host (§5.21, REQ-434–443) | No — reimplemented |
| Ironsworn SRD | CC BY 4.0 | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | <https://ironswornrpg.com> | Base capabilities reimplemented in the host (§5.22) | No — reimplemented |
| COF — Character Open File | CC BY 4.0 (spec) / CC0 1.0 (schemas) | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) · [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) | <https://github.com/yannsouetre/cof> | Memory and psyche vocabulary, adapted into Holonovel's own model and REQs | Adapted — vocabulary only, no text or code reproduced |

## Requested attribution strings

Some upstreams ask for a specific form. Reproduce these verbatim where the
source says so.

- **COF**: “COF — Character Open File, Yann Souetre, https://github.com/yannsouetre/cof” —
  requested in the COF README (`LICENSES.md`, attribution section).

## Share-alike and copyleft notes

- **lonelog (CC BY-SA 4.0)** is the only share-alike source. Its vendored copy
  is unmodified, so it carries no obligation beyond attribution. Its license
  also states that session logs and other content *created using* the notation
  are the author's own work; guidance items derived from the document itself
  remain CC BY-SA, and each seeded vendor item now carries its `license` and
  `creator` so a shared Novel keeps them (finding G3, fixed).
- **Per-book build inputs are not vendored at all.** A rulebook or supplement
  the operator converts stays outside this repository; `scripts/ruleset-builds/`
  is gitignored and any tracked file under it fails
  `check-reference-server-cleanliness`. See finding G6.
- **OGL 1.0a** attaches only when Open Game Content is *distributed*. This
  repository ships no SRD text; a built ruleset package is produced by the
  operator from their own copy, and the operator carries the OGL obligations
  for it. See finding G4.
- **Inform (Artistic 2.0)** is credited for design conventions. No source code
  is copied, so the license's source-distribution terms never trigger.

## Findings (2026-11-08)

| # | Finding | Severity | Disposition |
|---|---|---|---|
| G1 | The README footer and built README carry source name, license and creator but no license link or upstream link. All thirteen rows had this gap. | Medium | Fixed: license-text and upstream links added to both READMEs (repository and package), and to this register |
| G2 | Seeded Ruleset Wisdom items carry `source_url` values that are repository-relative paths (`narrative_world_model/narrative/dmcp/README.md`), not upstream URLs, so a shared Novel's attribution is not actionable. | Medium | Fixed: `attributeVendor` maps each vendor prefix to its upstream URL and keeps the local anchor in `local_source` |
| G3 | No statement identifies lonelog-derived items as CC BY-SA 4.0. | Medium | Fixed: every seeded vendor item carries `license` and `creator` |
| G4 | No OGL 1.0a license text or Section 15 notice ships anywhere; acceptable today because the repository distributes no Open Game Content. | Low | Recorded; revisit if a ruleset package is ever published from this repository |
| G5 | Appendix U's four-column schema is parsed positionally (`validate.ts` requires exactly six split cells), so a license-link column cannot be added without changing the validator and the footer renderer. | Low | Recorded; the register is the interim home |
| G6 | Commercial rulebook text was committed under `scripts/ruleset-builds/` (dnd2024 supplement, swse, and a historical robotech baseline), published on a public remote. | High | Fixed: the assets are removed from the tree and purged from history; `.gitignore` and the cleanliness gate prevent re-entry |

## Maintenance

Adding a source: add the Appendix U row (name, kind, license, copyright) **and**
a row here with the license link, upstream link, what we use, and whether it was
modified. Removing a source removes both rows and its vendored directory.
