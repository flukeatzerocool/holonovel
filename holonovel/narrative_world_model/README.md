# Holonovel Vendored Content

Two subdirectories with different provenance:

- **narrative/** — Reference documentation vendored from upstream sources for the
  Enrich workflow (§11.2): DMCP, Blades in the Dark SRD, Lonelog, IF Craft Corpus,
  Ironsworn, Sly Flourish, The Alexandrian, and Dungeon World. See
  `narrative/README.md` for source details, licensing, and update instructions.
- **world/** — World-model provider document defining the kind hierarchy, property
  contracts, and parser command catalog (§5.10). It is repo-authored and generated
  from the host's world-model schema, not vendored from upstream.

## Updating

See `narrative/README.md` for enrichment source updates.

Do not edit `world/world-model-provider.md` directly. Edit
`world/world-model-provider.template.md` (or the schema constants in
`holonovel/src/world/model.ts`), then run `npm run generate-world-provider` from
the repository root. `check-world-provider` fails when the committed document is
stale.
