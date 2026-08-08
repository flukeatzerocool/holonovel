# Lonelog — A Standard Notation for Solo RPG Session Logging

Source: <https://lonelog.org> — CC BY-SA 4.0, v1.5.0

A lightweight shorthand language designed to separate mechanics from fiction, stay
compact at the table, and scale seamlessly from quick one-shots to sprawling campaigns.

## Quick Start

```
### S1 Dark alley, midnight
@  Sneak past the guard
d: Stealth 4 vs TN 5 -> Fail
=> I kick a bottle. Guard turns!
?  Does he see me clearly?
   -> No, but...
=> He's suspicious, starts walking toward the noise
```

## Core Symbols

| Symbol | Meaning | Example |
|---|---|---|
| `###` | Scene header with name and optional metadata | `### S1 Dark alley, midnight` |
| `@` | Character action | `@  Sneak past the guard` |
| `d:` | Dice roll with notation | `d: Stealth 4 vs TN 5 -> Fail` |
| `=>` | Narrative outcome | `=> I kick a bottle. Guard turns!` |
| `?` | Oracle question | `?  Does he see me clearly?` |
| `##` | Session header | — |
| `#` | Campaign header | — |

## Core Philosophy

Lonelog separates mechanics from fiction. The left side (mechanics) tracks what
the system did — dice, oracles, rules. The right side (fiction) captures what
happened in the story. Both coexist in the same log without blurring together.

Designed for:
- **Speed at the table** — five symbols cover everything
- **Readability** — logs are human-readable without decoding
- **Shareability** — standardized format means logs work across tools
- **Scalability** — from a one-shot to a multi-year campaign

## Advanced Features

- **Threads** — track ongoing narrative threads with status markers
- **Clocks** — progress tracking with custom segment counts
- **Narrative excerpts** — prose blocks for rich scene descriptions
- **Campaign headers** — organize sessions under campaign metadata
- **Image embeds** — reference visual aids inline

## License

CC BY-SA 4.0 — see LICENSE file in this directory.

Session logs, actual plays, and other content created using Lonelog notation are
your own work and are not subject to this license.
