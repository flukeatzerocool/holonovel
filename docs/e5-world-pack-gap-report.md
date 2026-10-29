# E5 gap report — non-TTRPG world-pack pilot (social drama)

**Date:** 2026-10-29. **Pilot:** a ruleset-free social-drama Novel built from
an existing campaign. **Status:** pilot plays headlessly; pack is local and
unpublished by design.

## Boundary

The pilot uses a Star Wars Legends setting. It is kept local: the source,
artifact, research notes, builder, probe, and logs live under
`.holonovel-state/local-packs/shadows-over-coruscant/`, which is gitignored.
Nothing from the setting enters this report, the npm package, or any tracked
file. This report records only the engine finding.

## What was built

A ruleset-free Novel with seven rooms, a navigable world graph, 17 NPCs, 16
lore entries, 10 secrets, 6 social countdowns, 2 factions, 28 relationships,
2 vows, and one player character. No SWSE stat blocks, credits, feats, or
combat state survive the rewrite. Social clocks advance on story beats, not
room transitions.

## Method

1. Extracted authored surfaces from a live save; reset runtime and mechanical
   state to the canonical ruleset-free shape from
   `holonovel/content/torre-nosferatu.source.json`.
2. Checked setting facts against Wookieepedia Legends and recorded citations
   locally; no source prose was copied.
3. Rebuilt a minimal spatial spine and repaired countdown effect targets so
   the headless gate can evaluate the pack.
4. Ran the playability gate against the local artifact via the new
   `--novel <path>` flag.
5. Ran a local probe against the social primitives through `createEngine()`.

## Evidence

- Gate: `npx tsx holonovel/scripts/playability.ts --novel
  .holonovel-state/local-packs/shadows-over-coruscant/shadows-over-coruscant.json
  --json` → `pass: true`, zero findings, final room `Transit Nexus`
  (`run-gate.log`).
- Probe: `npx tsx .holonovel-state/local-packs/shadows-over-coruscant/probe.ts`
  → `probe.log`.

## Primitive coverage

| Facet | Primitive exercised | Result | Verdict |
|---|---|---|---|
| Movement and exploration | world model + `run_command` via the gate | goal reached, no findings | covered as-is |
| Relationships | `manage_relationship (set/get)` | ok | covered as-is |
| Information asymmetry | `manage_belief (admit/reconcile/retract)` | ok (admit needs `polarity`) | covered as-is |
| Secrets | `manage_lore (set_secret/reveal)` | ok | covered as-is |
| Factions | `manage_faction (create/update/list)` | ok; clock is not directly settable | partial |
| Obligations | `manage_vow (set/milestone)` | ok; `difficulty`/`rank_track` survive ruleset-free | covered as-is |
| Off-screen agents | `manage_agent (create/start/advance/complete)` | ok | covered as-is |
| Cold reference | `manage_corpus (corpus_register/corpus_list)` | ok | covered as-is |
| Scene staging | `manage_staging (presence)` | ok | covered as-is |
| Base mechanics | `resolve_mechanic (fate_roll)` | ok, ruleset-free | covered as-is |
| Table rolls | `resolve_mechanic (roll, no package table)` | `[NOT_FOUND]` | by design |

## What needed new REQs versus packaging only

**Packaging only (no new REQ needed):**

- The social-drama simulation itself. Relationships, beliefs, secrets,
  factions, vows, agents, corpus, staging, and Fate dice all work without a
  ruleset package.
- The Novel shape. The canonical ruleset-free skeleton from the starter is
  sufficient; no new state surface was needed.
- Content authoring. Stripping stat blocks and resetting clocks is authoring
  work, not an engine gap.

**Candidate new work (not implemented in this pilot):**

1. **Novel-pack distribution channel (E6/E7).** There is no first-class way to
   ship or install a Novel pack. The starter seeder is single-slug
   (`holonovel/scripts/lib/starter-novel.ts`), the npm `files` allowlist ships
   only `content/torre-nosferatu.json` (`holonovel/package.json:27`), and
   `manage_ruleset (action: install)` handles ruleset packages only
   (REQ-446). `manage_archive (action: import)` is per-Novel and manual. This
   is the real "world pack" gap.
2. **Non-spatial success for the playability gate.** The gate derives goals
   from `out` exits (`holonovel/scripts/lib/playability-model.ts:178`). A
   purely social drama has no spatial goal, so this pilot adds a fiction-
   consistent exit to the transit nexus. A social-goal model, or a declared
   content-level goal, would remove that artifact.
3. **Faction progress-clock control.** `manage_faction` says the progress
   clock is Novel-internal and not set directly. A management or social pack
   that needs explicit clock pressure must model it with `manage_countdown`
   instead. Documenting that mapping, or exposing a controlled clock action,
   would close the gap.
4. **Content provenance for local packs (E6).** The pilot's research and
   rights boundary is manual. E6 owns the general mechanism.

## Verdict on "general engine"

The engine-layer claim holds for this pilot: a non-TTRPG social drama runs on
existing primitives with no new REQs and no ruleset package. The
distribution-layer claim does not hold yet: "world pack" has no shipping
channel, and rights/provenance (E6) gates any public pack. The gap is
packaging, not simulation.

## Reproduction

Local only; the pack is not in git. On this machine:

```sh
node .holonovel-state/local-packs/shadows-over-coruscant/extract.mjs
node .holonovel-state/local-packs/shadows-over-coruscant/build.mjs
npx tsx holonovel/scripts/playability.ts \
  --novel .holonovel-state/local-packs/shadows-over-coruscant/shadows-over-coruscant.json --json
npx tsx .holonovel-state/local-packs/shadows-over-coruscant/probe.ts
```

## Limitations

- The pilot is not CI-reproducible; the pack is intentionally untracked.
- The gate proves navigation and countdown validity, not the quality of social
  play.
- The probe asserts primitive availability, not narrative coherence.
- Setting facts were checked against Wookieepedia Legends search results; the
  citations are local (`research.md`) and not reproduced here.
