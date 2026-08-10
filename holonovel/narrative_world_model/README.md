# Holonovel Vendored Content

Reference documentation vendored from upstream sources. Two subdirectories:

- **narrative/** — Enrichment vendor content for the Enrich workflow (§11.2): DMCP,
  Blades in the Dark SRD, Lonelog, and IF Craft Corpus. See `narrative/README.md`
  for source details, licensing, and update instructions.
- **world/** — World-model provider document defining the kind hierarchy, property
  contracts, and parser command catalog (§5.10). Used at build time to surface the
  world-model interface.

## Updating

See `narrative/README.md` for enrichment source updates. The world-model provider
is a specification document — update it alongside spec changes.
