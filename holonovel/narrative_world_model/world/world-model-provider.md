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

### Person Properties

| Property    | Values        | Contract |
|-------------|---------------|----------|
| animate     | true / false  | Always true for persons; controls agency. |

### Light Properties (all rooms and things)

| Property    | Values        | Contract |
|-------------|---------------|----------|
| lit         | true / false  | Whether the room or thing provides light. |

## Parser Command Catalog

The command vocabulary for `command(cmd)` — the parser dispatch tool (REQ-196).

| Command                    | Args              | Effect |
|----------------------------|-------------------|--------|
| `look`                     | —                 | Describe the current room: name, description, visible things, exits. |
| `go <direction>`           | direction (N/S/E/W/NE/NW/SE/SW/U/D/in/out, or the ruleset's discovered direction names) | Move through an exit in the given direction. |
| `north` / `south` / etc.   | —                 | Short-form aliases for `go <direction>`. |
| `take <thing>`             | thing name        | Pick up a portable thing in the current room. |
| `drop <thing>`             | thing name        | Drop a held thing in the current room. |
| `inventory` / `i`          | —                 | List held things. |
| `open <thing>`             | thing name        | Open an openable thing. |
| `close <thing>`            | thing name        | Close an openable thing. |
| `unlock <thing> with <key>`| thing name, key   | Unlock a lockable thing with the named key. |
| `lock <thing> with <key>`  | thing name, key   | Lock a lockable thing with the named key. |
| `put <thing> in/on <target>` | thing, target   | Place a thing inside or on a container or supporter. |
| `search <thing>`           | thing name        | Examine a thing's contents (containers, supporters). |
| `examine <thing>`          | thing name        | Show a thing's description. |
| `wait`                     | —                 | Pass time; advance narrative countdowns. |

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

`<kind>` is one of: thing, container, supporter, door, person, backdrop.

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
