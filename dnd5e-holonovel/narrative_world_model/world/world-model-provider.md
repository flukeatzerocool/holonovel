# Holonovel World-Model Provider

This document defines the kind hierarchy, property contracts, parser command catalog, and
declarative assertion syntax for the Holonovel world-model tier (§5.10). Every Holonovel
server indexes this document at build time from the B10 intake path and surfaces the
extracted model at the `world://kinds` resource.

## Kind Hierarchy

Kinds define the mechanical contracts for world-model objects. The hierarchy is
single-inheritance with no diamond inheritance.

| Kind       | Parent     | Description |
|------------|-----------|-------------|
| thing      | (root)    | A physical object in the world. |
| container  | thing     | A thing that can hold other things. |
| supporter  | thing     | A thing that other things can rest on. |
| door       | thing     | A thing that connects two rooms and may be opened or closed. |
| device     | thing     | A thing that can be switched on or off. Portable by default. |
| vehicle    | thing     | An enterable thing that creates a virtual interior room and can move between rooms. Fixed by default. |
| person     | thing     | An animate being. |
| backdrop   | thing     | A thing present in multiple rooms; scenery-level. |
| region     | (root)    | A named area spanning multiple rooms. |

Rooms are not a kind — they are the fundamental spatial atom of the world model. Every
room has a description and a set of exits.

## Property Contracts

Properties attach to kinds and define their mechanical behavior.

### Universal Properties (all things)

| Property    | Values        | Contract |
|-------------|---------------|----------|
| portable    | true / false  | IF false THEN the thing cannot be taken. |

### Container Properties

| Property    | Values        | Contract |
|-------------|---------------|----------|
| openable    | true / false  | IF openable THEN the thing has open/closed state. |
| open        | true / false  | IF true THEN contents are visible and accessible. |
| lockable    | true / false  | IF lockable THEN the thing has locked/unlocked state. |
| locked      | true / false  | IF true AND closed THEN the thing cannot be opened. |
| enterable   | true / false  | IF true THEN the player can enter the container (viewpoint becomes interior). |
| transparent | true / false  | IF true AND closed THEN contents are visible through the container. |

### Door Properties

| Property    | Values        | Contract |
|-------------|---------------|----------|
| open        | true / false  | IF false THEN passage through the door is blocked. |
| lockable    | true / false  | IF lockable THEN the door has locked/unlocked state. |
| locked      | true / false  | IF true AND closed THEN the door cannot be opened. |

### Supporter Properties

| Property    | Values        | Contract |
|-------------|---------------|----------|
| capacity    | integer       | Maximum number of things the supporter can hold. |

### Device Properties

| Property    | Values        | Contract |
|-------------|---------------|----------|
| switchable  | true / false  | IF true THEN the device can be switched on/off. |
| switched_on | true / false  | IF true AND lit THEN the device provides light. |

### Vehicle Properties

| Property    | Values        | Contract |
|-------------|---------------|----------|
| enterable   | true / false  | Always true for vehicles. |
| capacity    | integer       | Maximum number of passengers. |

### Person Properties

| Property    | Values        | Contract |
|-------------|---------------|----------|
| animate     | true / false  | Always true for persons; controls agency. |

### Light Properties (all rooms and things)

| Property    | Values        | Contract |
|-------------|---------------|----------|
| lit         | true / false  | Whether the room or thing provides light. |

### Object Properties (all things — REQ-318)

| Property     | Values          | Contract |
|--------------|-----------------|----------|
| wearable     | true / false    | IF true THEN the thing can be worn. |
| worn_by      | string \| null  | Entity name wearing this. Null if not worn. |
| readable     | true / false    | IF true THEN the thing has readable text. |
| read_text    | string \| null  | Text revealed when read. Null if unset. |
| edible       | true / false    | IF true THEN the thing can be eaten (removed from inventory). |
| drinkable    | true / false    | IF true THEN the thing can be drunk. |
| climbable    | true / false    | IF true THEN the thing can be climbed (associated with a directional exit). |

## Parser Command Catalog

The command vocabulary for `command(cmd)` — the parser dispatch tool (REQ-196).

### Core Tier

| Command                    | Args              | Effect |
|----------------------------|-------------------|--------|
| `look`                     | —                 | Describe the current room: name, description, visible things, exits. |
| `go <direction>`           | direction (N/S/E/W/NE/NW/SE/SW/U/D/in/out, or the ruleset's discovered direction names) | Move through an exit in the given direction. |
| `north` / `south` / etc.   | —                 | Short-form aliases for `go <direction>`. |
| `take <thing>`             | thing name        | Pick up a portable thing in the current room. |
| `drop <thing>`             | thing name        | Drop a held thing in the current room. |
| `inventory` / `i`          | —                 | List held things. |
| `examine <thing>`          | thing name        | Show a thing's description. |
| `wait`                     | —                 | Pass time; advance narrative countdowns. |

### Standard Tier

| Command                    | Args              | Effect |
|----------------------------|-------------------|--------|
| `open <thing>`             | thing name        | Open an openable thing. |
| `close <thing>`            | thing name        | Close an openable thing. |
| `unlock <thing> with <key>`| thing name, key   | Unlock a lockable thing with the named key. |
| `lock <thing> with <key>`  | thing name, key   | Lock a lockable thing with the named key. |
| `put <thing> in/on <target>` | thing, target   | Place a thing inside or on a container or supporter. |
| `insert <thing> into <target>` | thing, target | Place a thing into a container. Synonym for `put in`. |
| `search <thing>`           | thing name        | Examine a thing's contents (containers, supporters). |
| `wear <thing>`             | thing name        | Wear a wearable thing from inventory. |
| `remove <thing>`           | thing name        | Take off a worn thing. |
| `read <thing>`             | thing name        | Read a readable thing's text. |
| `eat <thing>`              | thing name        | Eat an edible thing from inventory. |
| `drink <thing>`            | thing name        | Drink a drinkable thing from inventory. |
| `climb <thing>`            | thing name        | Climb a climbable thing (resolves associated exit). |
| `enter <thing>`            | thing name        | Enter an enterable container or vehicle. |
| `exit` / `get out`         | —                 | Exit current container or vehicle. |
| `switch on <thing>`        | thing name        | Turn on a switchable device. |
| `switch off <thing>`       | thing name        | Turn off a switchable device. |
| `push <thing>`             | thing name        | Push a movable thing. |
| `pull <thing>`             | thing name        | Pull a movable thing. |
| `sit <thing>`              | thing name        | Sit on a supporter. |
| `stand`                    | —                 | Stop sitting. |
| `light <thing>`            | thing name        | Light a light source. |
| `extinguish <thing>`       | thing name        | Extinguish a light source. |
| `listen`                   | —                 | Report audible things in current room. |
| `smell`                    | —                 | Report smell-producing things in current room. |
| `touch <thing>`            | thing name        | Report tactile properties of a thing. |

### Narrative Tier

Narrative commands route player intent to the Game Master rather than resolving mechanically.

| Command                    | Args              | Effect |
|----------------------------|-------------------|--------|
| `ask <npc> about <topic>`  | npc, topic        | Express desire to ask NPC about a topic. |
| `tell <npc> about <topic>` | npc, topic        | Express desire to tell NPC about a topic. |
| `give <thing> to <npc>`    | thing, npc        | Give a held thing to an NPC. Transfers item. |
| `show <thing> to <npc>`    | thing, npc        | Show a thing to an NPC. Does not transfer. |
| `throw <thing> at <target>`| thing, target     | Throw a held thing toward a target. Thing lands in target's room. |

### Meta Tier

| Command                    | Args              | Effect |
|----------------------------|-------------------|--------|
| `again` / `g`              | —                 | Repeat the last command. Session-local buffer. |
| `help` / `commands` / `verbs` | —              | Enumerate available commands by tier. |
| `brief` / `verbose` / `normal` | —              | Set room description mode. |

The builder MAY extend this catalog with ruleset-discovered commands from the indexed
provider documentation. The above is the baseline: every Holonovel server SHALL register
at minimum these commands.

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
<property> of <name> is <value>.
<name> is <property>.       // shorthand for boolean properties
```

`<kind>` is one of: thing, container, supporter, door, device, vehicle, person, backdrop.

### Exit Declarations

```
<direction> of <room> is <target-room>.
<direction> of <room> is nowhere.    // severs the exit
```

Directions are: north, south, east, west, northeast, northwest, southeast, southwest,
up, down, in, out. The builder MAY discover additional direction names from the ruleset.

### Property Setters

```
<name> is openable. / <name> is not openable.
<name> is open. / <name> is not open.
<name> is lockable. / <name> is not lockable.
<name> is locked. / <name> is not locked.
<name> is fixed. / <name> is portable.
<name> is lit. / <name> is dark.
<name> is switchable. / <name> is not switchable.
<name> is switched on. / <name> is switched off.
<name> is wearable. / <name> is not wearable.
<name> is readable. / <name> is not readable.
<name> is edible. / <name> is not edible.
<name> is drinkable. / <name> is not drinkable.
<name> is enterable. / <name> is not enterable.
<name> is climbable. / <name> is not climbable.
<name> is transparent. / <name> is not transparent.
```

### Read Text Declaration

```
The inscription on the <name> reads '<text>'.
```

### TTRPG Annotation Syntax (Interleaved)

```
@encounter(<name>) — references a combat encounter definition.
@trap(<name>) — references a trap definition.
@npc(<name>) — creates an NPC in the room where the annotation appears.
@lore(<key>) — links a lore entry to the object where the annotation appears.
```

Annotations are attached to the most recently declared room or thing. They are resolved
against the Novel's indexed content after world-model population.

### Implicit Objects

- Reverse exits are created implicitly: "north of Entrance is Hall" creates
  "south of Hall is Entrance."
- Doors connecting two rooms create exit pairs through the door object.
- Climbable things adjacent to a directional exit are associated as that exit's door:
  a climbable rope ladder declared in a room with an `up` exit becomes the door for that
  exit — `command("climb rope ladder")` resolves to `go up` through that exit.
