<!--
  Source template for world-model-provider.md. Edit this file; then run
  `npm run generate-world-provider`. The generated document carries no
  timestamps, so regeneration is byte-deterministic.
-->
# Holonovel World-Model Provider

This document defines the kind hierarchy, property contracts, parser command
catalog, and declarative assertion syntax for the Holonovel world-model tier
(§5.10). The vocabulary is provided pre-built by the `holonovel` package (B10)
and surfaced at the `world://kinds` resource (REQ-202a); consumer servers do not
re-extract it.

## Kind Hierarchy

Kinds define the mechanical contracts for world-model objects. The hierarchy is
single-inheritance with no diamond inheritance.

{{KIND_HIERARCHY}}

Rooms are not a kind — they are the fundamental spatial atom of the world model.
Every room has a description and a set of exits.

## Property Contracts

Properties attach to kinds and define their mechanical behavior. The tables
below are generated from `WORLD_MODEL_PROPERTIES`; `WorldThing` and the parser
remain the behavioral source.

{{PROPERTY_CONTRACTS}}

## Parser Command Catalog

The baseline command vocabulary for `run_command (action: execute)` — the parser
dispatch tool (REQ-196).

{{PARSER_COMMANDS}}

The builder MAY extend this catalog with ruleset-discovered commands (REQ-222).
The table above is the baseline: every Holonovel server registers at minimum
these commands.

### Verb Coverage Tiers

{{VERB_TIERS}}

A standard-tier verb becomes available when a thing in scope carries the
matching property (for example, `open` requires an openable thing). Core verbs
are always available; extended verbs are registered from ruleset discovery
(REQ-222).

## Declarative Assertion Syntax

The assertion grammar consumed by `convert_source` (REQ-201). Assertions are
line-oriented; each declaration occupies one line. Blank lines are ignored. Lines
beginning with `//` or `#` are comments.

### Room Declarations

```
<Name> is a room.
<Name> is a room. "<description>"
<Name> is a room. "<description>" with <property-list>.
```

### Thing Declarations

```
<Name> is a <kind>.
<Name> is in <location>.
<Name> is a <kind>. "<description>"
<Name> is a <kind> in <location>. "<description>"
<name> is <property>.
```

`<kind>` is one of: {{KIND_LIST}}.

### Exit Declarations

```
<direction> of <room> is <target-room>.
<direction> of <room> is nowhere.    // severs the exit
```

Directions are: {{DIRECTION_LIST}}. The builder MAY discover additional
direction names from the ruleset.

### Property Setters

Property declarations target the most recently declared thing. Two forms are
accepted: the named form (`<name> is <property>.`) and the current-thing form
(`It is <property>.`). Only the forms listed below are recognized; an
unrecognized form produces a not-implemented warning and does not change state.

{{PROPERTY_SETTERS}}

### TTRPG Annotation Syntax (Interleaved)

```
@encounter(<name>) — references a combat encounter definition.
@trap(<name>) — references a trap definition.
@npc(<name>) — creates an NPC in the room where the annotation appears.
@lore(<key>) — links a lore entry to the object where the annotation appears.
```

Annotations are attached to the most recently declared room or thing. They are
resolved against the Novel's indexed content after world-model population.

### Implicit Objects

- Reverse exits are created implicitly: "north of Entrance is Hall" creates
  "south of Hall is Entrance."
- Doors connecting two rooms create exit pairs through the door object.

## Design Guidance

### Kind hierarchy design

Kind hierarchy design — the world model classifies everything under 'thing', subdivided into kinds: container (openable, lockable), supporter (sit/stand), door (connects rooms), device (switched on/off), vehicle (enterable, mobile), person (NPCs), backdrop (scenery), region (spatial grouping). Each kind carries mechanical contracts: a container holds inventory, a door blocks passage when closed, a device changes state, a vehicle has an interior that functions as a contained space. Choose the kind that matches the object's behavior, not just its name.

### Device world design

Device world design — devices are the simplest form of machine: always in one of two states, switched on or switched off. Use devices where binary state changes the fiction: a powered generator changes what's visible, an active alarm changes who's present, a running machine changes the environment turn by turn. The device's state is separate from its description — switching it changes the fiction without changing the object. Design puzzles where device states cascade: switching one changes what another does.

### Device interaction patterns

Device interaction patterns — devices work at the fiction level, not the mechanics level. Switching a device on or off changes what the world describes, not what dice resolve. Design device puzzles around observation: a player who understands what each device controls can solve the puzzle without a skill check. Group devices by effect domain — the lighting devices, the access devices, the alarm devices — so patterns are discoverable. A device whose effect is remote (switching it changes something in another room) creates exploration incentives.

### Device-based mystery

Device-based mystery — a room with three devices and no explanation of what they control. Each device changes something in a different room. The player must explore, toggle, and observe to deduce the mapping. The solution is not a correct combination — it's understanding what each device does. The puzzle teaches the player how to read the world before the real challenge begins.

### Vehicles as world fragments

Vehicles as world fragments — a vehicle is a mobile room container. Its interior is a sub-world with its own contents and exits. Boarding a vehicle changes what the player can see, touch, and interact with. Exits from a vehicle interior connect to the outside world when the vehicle is stationary. Design vehicles as story engines: a ship's crew quarters, an elevator's single-button control, a train's dining car filling with water. The vehicle is never just transport — it's a location that moves.

### Vehicle design for interactive worlds

Vehicle design for interactive worlds — treat a vehicle's interior as a room with dynamic exits. The exits from a vehicle change with context: boarding creates 'out' exits to the embarkation point, docking creates exits to the dock, crash-landing creates exits to the crash site. Design vehicle events as environmental changes — a flood filling a compartment, a fire spreading through a hold, a hull breach exposing a room to vacuum. Passengers act independently: NPCs aboard a vehicle may pilot, repair, guard, or panic based on their disposition and the vehicle's state.

### Vehicle journey

Vehicle journey — a multi-room vehicle with an onboard crisis. The engine room floods, the passenger cabin loses pressure, the bridge loses navigation. Players move between interiors, each with its own challenge. Exits from the vehicle change as the crisis evolves — a damaged hatch becomes an escape route, a sealed bulkhead creates a new boundary. The vehicle is both location and antagonist.

### Environmental text storytelling

Environmental text storytelling — readable objects deliver exposition through discovery, not narration. A readable inscription on a wall, a diary entry in a drawer, a warning carved into a doorframe — each tells the player something the world's past occupants chose to record. The read_text property holds discoverable text; the description property holds immediately visible text. Use the gap: a readable object that says one thing while its description shows another creates tension (a cheerful sign on a crumbling wall, a locked diary with a bookmark at a crucial entry).

### Extended property design patterns

Extended property design patterns — wearable creates inventory slots on a character's body, not in their pack (invisible to 'take' unless removed first). Edible and drinkable are single-use, consumed on use (the object is removed after eating/drinking) — use for potions, rations, and consumable clues. Climbable associates with adjacent directional exits (a climbable rope next to an 'up' exit becomes that exit's access method). Readable separates discoverable text from visible description — a book's description is 'a leather-bound tome', its read_text is the passage the player discovers. Transparent lets players see container contents without opening — a glass display case, a jar of specimens, a window.

### Interactive object design principles

Interactive object design principles — every object in a room should do or tell something. A lever that does nothing, a book that says nothing, a locked door with no key — these are dead ends that teach the player not to investigate. The world-model property system makes object behavior explicit: a readable object carries a discoverable text, a switchable object changes state, an edible object is consumable. Design rooms where at least one object responds to each parser tier (core, standard, narrative) — this rewards thorough investigation.

### Compound puzzle design

Compound puzzle design — combine object kinds to create multi-step interactions. A device in a locked container behind a climbable barrier that the player must read about in a readable inscription. The player learns the solution by reading, reaches the device by climbing, opens the container by unlocking, then switches the device. Each step uses a different parser tier. Design compound puzzles so the order matters — the inscription mentions the device's location, the climbable object is only accessible after unlocking, the container's key is in another room.

### Parser command tier system

Parser command tier system — the world-model parser organizes commands into four tiers. Core (go, look, examine, take, drop, inventory, wait, open, close, unlock, lock) covers fundamental interaction every player needs. Standard (wear, remove, eat, drink, climb, enter, exit, switch on, switch off, sit, stand, push, pull, light, extinguish, listen, smell, touch, insert, read) extends to object properties and sensory verbs. Narrative (ask, tell, give, show, throw) covers NPC-directed social verbs that route to the GM surface. Meta (again, g, help, verbs) covers parser-level operations. Unknown commands fall through to the GM for narrative interpretation — the parser is a floor, not a ceiling.
