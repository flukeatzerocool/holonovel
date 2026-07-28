# Holonovel Ruleset Preparation

> **This is a prompt.** Feed this document, followed by a tabletop RPG ruleset in raw form, to an AI
> assistant. The assistant will format the ruleset into Markdown structured for optimal ingestion by
> `holonovel.md` (see `holonovel.md` Appendix A — Markdown Parsing Heuristics, for the
> parsing heuristics this prompt targets, and Appendix F — Source Conversion).

## Contents

- [1. Mission](#1-mission)
- [2. Source intake](#2-source-intake)
- [3. Document structure](#3-document-structure)
- [4. Role scoping](#4-role-scoping)
- [5. Tables](#5-tables)
- [6. Bold-labeled fields and definition lists](#6-bold-labeled-fields-and-definition-lists)
- [7. Procedures](#7-procedures)
- [8. Dice and resolution mechanics](#8-dice-and-resolution-mechanics)
- [9. Conditions, states, and effects](#9-conditions-states-and-effects)
- [10. Guidance vs. mechanics](#10-guidance-vs-mechanics)
- [11. Special elements](#11-special-elements)
- [12. Output conventions](#12-output-conventions)
- [13. Verification checklist](#13-verification-checklist)

---

## 1. Mission

Your task is to format a tabletop RPG ruleset into Markdown that `holonovel.md` can ingest and model
reliably. `holonovel.md` builds an MCP server from Markdown sources by parsing headings, tables,
bold-labeled fields, procedures, guidance text, and role-scoping markers. Every formatting
convention below targets one of those parsers. Apply them faithfully; do not improvise a structure the
ruleset does not contain.

Input: one or more ruleset documents in any format — PDF, HTML, plain text, or existing Markdown.
Output: one or more Markdown files following the conventions below.

---

## 2. Source intake

**Encoding.** Output UTF-8 exclusively. Preserve Unicode characters — quotation marks, dashes,
accented letters — exactly as they appear in the source. `holonovel.md` normalizes Unicode for alias
resolution, but the ruleset text must be byte-accurate to the source.

**Frontmatter.** If the source carries YAML frontmatter (a leading `---`…`---` block), preserve it
verbatim. `holonovel.md` treats frontmatter as metadata, not as headings or tables.

**Non-Markdown sources.** Convert layout-bearing formats (PDF, HTML) to Markdown before applying
this prompt. Preserve document order; reassemble tables that span page breaks or column layouts;
strip page furniture — running heads, page numbers, boilerplate. Flag any table region whose reading
order is ambiguous rather than guessing. Record the converter and its version alongside the output.

---

## 3. Document structure

**Headings.** Use ATX headings (`##`, `###`, `####`) — never setext (`===`, `---`). The ruleset
title is a level-1 heading (`#`). Subordinate sections descend in order; gaps in the hierarchy
(e.g., `####` directly under `##`) are tolerated, but prefer consistency. Every heading text must be
unique within its file; disambiguate with parenthetical suffixes where necessary.

**Anchors.** `holonovel.md` generates anchors from heading text. You may supply explicit anchors
with `{#id}` markers where precise linking is needed (e.g., `## Combat {#combat}`). The marker is
trailing, lowercase-hyphenated, and stripped from the visible heading text.

**Section separators.** Place a `---` horizontal rule between top-level sections (headings at level
`##` and above). Do not insert horizontal rules within a section unless the source itself uses them
as content boundaries.

---

## 4. Role scoping

**Identify roles.** Every ruleset has at least one player-facing role and typically one adjudicator
role (GM, DM, Warden, Narrator, Keeper, Referee, or whatever term the ruleset uses). Find both.
State the adjudicator role's exact term early in the document — ordinarily in a "Roles" section or
the opening paragraph.

**Marker convention.** Sections that are visible only to the adjudicator must carry a trailing
italic marker on the heading: `*<adjudicator term> only*`. The marker text is the ruleset's own term
for its adjudicator — never a generic placeholder. For example, if the ruleset's adjudicator is
"Lantern Keeper," the marker is `*Keeper only*` (the final word matches). If the adjudicator is
"Game Master," the marker is `*Master only*`.

**Form:**

```markdown
## Encounter Tables — _Master only_
```

The marker is stripped before anchor generation: the heading above produces the section
"Encounter Tables," not "Encounter Tables — _Master only_." A preceding dash (hyphen, en dash, or
em dash) is also stripped, so both `Encounter Tables — _Master only_` and
`Encounter Tables _Master only_` work.

**No referee.** If the ruleset has no adjudicator role (GM-less play), omit all role markers.
Sections are shared by default.

---

## 5. Tables

**Structure.** Every table must have a header row. Multi-column tables that lack headers in the
source should have a header row inferred from labels or column descriptions. Wide rows: pad shorter
rows with empty cells to match the widest row's column count. Merge overflow cells into the last
column; never drop data.

**Numeric and dice ranges.** Use an en dash (`–`) or hyphen (`-`) for inclusive ranges (`3–5`).
A single integer is exact (`12`). Roll-column headers use `d6`, `2d6`, `1d20`, or the ruleset's
dice notation — never free-text descriptions. Example:

```markdown
| 2d6  | Encounter                            |
| ---- | ------------------------------------ |
| 2    | A hollow figure, hostile             |
| 3–5  | Strange lights (harmless)            |
| 6–8  | Sinkhole! Agility check to avoid     |
| 9–11 | A trader, willing to bargain         |
| 12   | An abandoned shrine                  |
```

**Captions.** A prose sentence that immediately precedes a table — with no blank line, heading, or
horizontal rule between them — and ends in a colon or contains the phrase "following table" is
treated as the table's caption. Precede every table that warrants a description with such a sentence.

**Cell formatting.** Preserve inline formatting — bold, italic, links, code spans — inside table
cells. A cell whose content begins with a bold span and contains no colon may use the bold span as
the entry name and the remainder as detail (`**Fireball**: 8d6 Fire, Dex save for half`).

---

## 6. Bold-labeled fields and definition lists

**Fields.** Model named attributes with bold-labeled fields: `**Name**: value`. Acceptable variants
include `Name: **value**` and `**Name: value**`; pick one form and use it consistently throughout
the ruleset.

**Definition lists.** When two or more bold-labeled paragraphs appear consecutively — with no
intervening prose, blank lines, or other block elements — they are classified as a definition list
and each entry is extracted as a named item. Prefer this pattern for entity stat blocks, condition
lists, and equipment tables rendered as prose:

```markdown
**Grit**: brawn and endurance.
**Nerve**: steadiness under fear.
**Wits**: sharpness of eye and mind.
```

A lone bold-labeled paragraph separated from others is extracted as a regular field, not a list
item. Ensure lists have at least two consecutive entries.

---

## 7. Procedures

**Signals.** `holonovel.md` identifies procedures by: imperative verbs ("Roll 2d6 and add your
Grit"), numbered steps, "To X, do Y" formulations, and "When X happens, Y" triggers. Write
procedural rules using these patterns.

**Numbered steps.** Use a Markdown ordered list for multi-step procedures. Each step is a discrete
action. Example:

```markdown
Creating a character:
1. Choose a name.
2. Assign +2, +1, and 0 to Grit, Nerve, and Wits in any order.
3. Choose one knack from the Knacks table.
4. Set Harm to 0.
```

**Trigger–action–outcome.** State the trigger first, then the resolution, then the result bands.
A reader (or parser) should be able to trace the chain without inference. Example:

```markdown
When a character takes a risky action, the referee names the relevant stat.
The player rolls 2d6 and adds the stat:
- **10+**: clean success.
- **7–9**: partial success — it works, with a complication.
- **6 or less**: failure, and the referee makes a move.
```

---

## 8. Dice and resolution mechanics

**Notation.** Use `NdS` notation exclusively (`2d6`, `1d20`, `3d8+4`). Spell out "keep highest"
and "drop lowest" in prose where the ruleset uses non-standard dice conventions; do not invent
notation. Modifiers are a flat number: `+2`, `–1`. The modifier always follows the dice expression
(`2d6 + Grit`, `1d20 + Strength modifier + proficiency bonus`).

**Result bands.** Every resolution mechanic must state its result bands explicitly. A band is a
range, a comparison operator, or both. A player (or parser) should never have to infer what
constitutes a success. Use a list or table:

```markdown
| Total | Outcome                            |
| ----- | ---------------------------------- |
| 10+   | Success                            |
| 7–9   | Partial success (complication)     |
| 2–6   | Failure                            |
```

**Critical rules.** If the ruleset defines critical success or failure (natural 20, natural 2),
state the rule in the resolution section, not in a separate sidebar.

---

## 9. Conditions, states, and effects

**Format.** Each condition is a named entity with a mechanical effect and an expiry trigger.
Prefer the bold-label or definition-list pattern:

```markdown
**Shaken**: −1 to Steady rolls. Expires after one scene of rest.
**Bleeding**: +1 Harm at the end of each round. Expires when the wound is bound (one action).
```

If the ruleset defines conditions in a table, use a table with columns for name, effect, and
expiry.

**Pools and tracks.** A numeric pool (HP, Harm, Sanity, Stress) must define its range. State the
starting value, the maximum (or threshold at which the character is incapacitated), and how the pool
changes. Example: `Harm starts at 0. At 6 Harm the character is Down and cannot act.`

**No mechanic, no tool.** If a condition uses a trigger the ruleset never mechanizes — "one scene
of rest" in a ruleset with no scene mechanic — state the trigger in prose anyway. `holonovel.md`
will log the gap; your job is to preserve the source text, not to invent missing mechanics.

---

## 10. Guidance vs. mechanics

**Guidance** is role-addressed prose: setting tone, examples of play, statements of responsibility
("portrays," "your job is to," "should"), and advice. It is extracted verbatim as quoted data and
never modeled as tools or state.

**Mechanics** are rules that produce dice rolls, state changes, or tool registrations: resolution
systems, conditions with modifiers, character creation procedures, combat turn order, equipment
tables. Each mechanic becomes a tool, an entity field, or a table in the server model.

**Separation.** Keep guidance and mechanics in separate sections wherever the ruleset allows.
A section that mixes both (e.g., "The referee portrays the marsh. When a delver fails a roll, the
referee deals 1 Harm.") is legal but harder to extract cleanly. Prefer to model the Harm-dealing
rule in a "Dangers" or "Consequences" section and the portrayal instruction in a "Referee
Principles" section.

**Do not reclassify.** If the source presents a rule as guidance ("the referee may choose to…"),
keep it as guidance. If the source presents a rule as a procedure, keep it as a procedure. Never
promote guidance to a mechanic or demote a mechanic to advice. `holonovel.md` draws this boundary;
your job is to preserve it accurately.

---

## 11. Special elements

**Internal cross-references.** Link to other sections with `[text](#anchor)` (same file) or
`[text](file.md#anchor)` (cross-file). Ensure every link resolves: the anchor must exist in the
target file, and cross-file links must use the correct relative path.

**Fenced code blocks.** Use triple-backtick fences with an info string that classifies the content:
`statblock` for monster or NPC stat blocks, `example` for play examples, `json` for data. The info
string is preserved as a classifier tag for search and retrieval; it never changes extraction
behavior. Content within code blocks is searchable but is not parsed as mechanics.

```statblock
Goblin: AC 15, HP 7 (2d6), Speed 30 ft.
STR 8 (-1) DEX 14 (+2) CON 10 (+0)
```

**Callouts.** A blockquote whose first line matches a bold-label pattern is classified as a
callout. Use this pattern for variants, optional rules, examples, and sidebars:

```markdown
> **Example**: Moss attempts to Delve into the marsh. The Keeper calls for a Grit
> roll. Moss rolls 2d6 + 2 (Grit) = 8 — a partial success.
```

The callout type (the bold span before the colon) should be one of: Example, Variant, Optional,
Sidebar, Design Note, Playtest. `holonovel.md` labels callouts with these types MEDIUM confidence.

**Strikethrough.** Preserve struck-through text (`~~text~~`) as-is. Strikethrough signals errata or
deprecated content; `holonovel.md` flags affected sections for reviewer attention.

**HTML comments.** Preserve `<!-- -->` comments if they carry source annotations. HTML comments are
ignored entirely during parsing; do not use them for rules text.

---

## 12. Output conventions

**File naming.** Name the output file `<ruleset_slug>.md` — lowercase, hyphenated, no spaces
(`dungeon-horizons.md`, `star-drift.md`). If the ruleset splits naturally across multiple files
(core rules, equipment, spells), use multiple files with descriptive suffixes
(`dungeon-horizons-spells.md`). Cross-reference between them with `[text](file.md#anchor)` links.

**Placement.** Place the formatted file(s) in a directory that `holonovel.md` can reference via the
`TTRPG_RULESET` configuration key (comma-separated paths). The README of any holonovel-built server
documents this key.

**Single-pass output.** Produce the formatted ruleset in one pass. Do not intersperse commentary or
notes in the output. If you need to flag an ambiguity the source text cannot resolve, record it in a
separate notes file, not in the ruleset Markdown itself.

---

## 13. Verification checklist

Before declaring the ruleset ready for `holonovel.md`, confirm:

- [ ] All headings are ATX (`##`, `###`, `####`); no setext headings.
- [ ] Every heading is unique within its file.
- [ ] Top-level sections (`##`) are separated by `---` horizontal rules.
- [ ] All adjudicator-only sections carry a `*<adjudicator term> only*` marker on the heading.
- [ ] The adjudicator term in the marker matches the ruleset's own term.
- [ ] Every table has a header row; all rows have equal column counts (padded where needed).
- [ ] Numeric ranges use en dash or hyphen; dice-roll columns use `NdS` notation.
- [ ] Bold-labeled fields use consistent format throughout.
- [ ] Consecutive bold-labeled fields (definition lists) have at least two entries.
- [ ] Every procedure uses imperative verbs, numbered steps, or trigger–action–outcome patterns.
- [ ] Every resolution mechanic states result bands explicitly.
- [ ] Every condition has a mechanical effect and an expiry trigger.
- [ ] Guidance text and mechanics text appear in separate sections where possible; neither is
  reclassified.
- [ ] All internal cross-references resolve to existing anchors.
- [ ] Code blocks carry descriptive info strings.
- [ ] Strikethrough and HTML comments are preserved where the source carries them.
- [ ] The output file is valid UTF-8 with no BOM.
- [ ] Output file(s) are named `<ruleset_slug>.md` (lowercase-hyphenated).
- [ ] No commentary or meta-notes appear in the ruleset Markdown output.
