# Authoring phase protocol (`--from-scratch`)

When a run is initialized with `init --from-scratch`, no campaign or adventure
module is supplied. The GM and player agents **author** a Novel, an adventure
module, and a party through the tools, then `finalize` reads the completion
target from the finished module and playtesting begins. Authoring turns and
playtest turns are recorded in one transcript and separated by
`run.json:authoring_turns`.

## Role split

Run the GM and player as separate contexts (see `driver.md` §Role isolation).

- **Player** — declares the campaign premise, chooses the era/setting, and
  creates the party. Owns `manage_character` (create/sheet/set_active). May
  call `manage_ruleset (action: search)` to ground a premise in the ruleset.
- **GM** — creates the Novel, builds the world, populates cast/factions/
  clocks, authors the beat arc, sets the central vow, and names the escape /
  objective room. Owns `manage_novel`, `manage_world`, `manage_adventure`,
  `manage_npc`, `manage_faction`, `manage_countdown`, `manage_scene`,
  `manage_story`, `manage_vow`.

## Grounding (fidelity)

The SWSE package is a mechanics package; its adventure/encounter text is
searchable reference, not a loadable module. Before inventing a premise, the
GM SHALL `manage_ruleset (action: search)` for the era, a published adventure
module, or a named encounter (e.g. "Storming the Bridge") and adapt what it
returns. Every created NPC SHOULD be grounded in a ruleset stat block; record
the search that supplied it. Fidelity is measured by
`authoring.json:grounding`.

## Ordered authoring loop

1. **Novel.** GM: `manage_novel (action: create, name, ruleset: <slug>,
   genre)`. The server derives the slug from the name (a supplied slug is
   ignored), and the harness adopts the created file after the turn.
2. **Party.** Player: `manage_character (action: create)` per PC (one tool call
   per turn), with `species`, `classes` (`"<Class> <level>"`), and
   `stat_method: "standard"`. Then `manage_character (action: set_active)`.
   The GM sets `manage_scene (action: presence, entity_ids: [<every PC id>])`
   so scene placement and parser movement co-locate the whole party (the
   oracle's `party_in_escape` requires it).
3. **World.** GM: `manage_world (action: create_room)` per location, then
   `manage_world (action: create_exit, room_a, room_b, direction)` per link.
   Model the escape/objective room and a path to it from the spawn.
4. **Adventure.** GM: `manage_adventure (action: generate, premise)` for the
   scaffold, `manage_adventure (action: generate_encounter, context)` for
   encounters, and `manage_npc` for the cast.
5. **Framing.** GM: `manage_scene (action: set, location, beat)` —
   `setup` at the start and `resolution`/`denouement` at the end — plus
   `manage_faction`, `manage_countdown`, `manage_vow (action: set, scope:
   party)`.
6. **Finalize.** Once the module is complete, run
   `playtest.ts finalize --run <id> --vow "<central vow>" --escape-room
   "<objective room>"`. The target MUST be read from the finished module; the
   command refuses a vow or room that does not exist.

## Completion target

After `finalize`, `run.json` carries `central_vow` and `escape_room`; every
subsequent turn is a playtest turn. The oracle (see `README.md` §Oracle)
requires the vow resolved, a terminal beat, the active PC in the escape room
having left and returned, a survivor, and zero unrecovered defects.

## Outputs

- `authoring.json` — party completeness, world structure, ruleset grounding
  ratio, objective reachability, and an overall `validity`
  (`pass` / `partial` / `fail`). A `fail` or `partial` verdict is an
  authoring finding, not a play finding.
- `run.json:authoring_turns` — the phase boundary used by the oracle.
- `provenance.authored_adventure_sha1` — hash of the authored scaffold and
  structural index.
