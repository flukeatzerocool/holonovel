## Appendix U: Content Licenses

This appendix is the single source of truth for third-party content licenses
incorporated into Holonovel builds. The Build workflow SHALL render this table
into the README.md license footer during handoff (§6.4).

| Source | Kind | License | Copyright |
|--------|------|---------|-----------|
| D&D 5e SRD v5.2.1 | Ruleset data | CC BY 4.0 | Wizards of the Coast |
| Graham Nelson's Inform | World model conventions | Artistic License 2.0 | Graham Nelson |
| if-craft-corpus | Narrative frameworks | CC BY 4.0 | pvliesdonk |
| dmcp | Narrative frameworks | MIT | Shawn Rushefsky |
| lonelog | Narrative frameworks | CC BY-SA 4.0 | zeruhur |
| BitD SRD | Narrative frameworks | CC BY 3.0 | John Harper |
| Ironsworn: Starforged SRD | Narrative frameworks | CC BY 4.0 | Shawn Tomkin |
| Sly Flourish Lazy GM Resource Document | Narrative frameworks | CC BY 4.0 | Mike Shea |
| The Alexandrian | Narrative frameworks | CC BY 4.0 | Justin Alexander |
| Dungeon World SRD | Narrative frameworks | CC BY 3.0 | Sage LaTorra, Adam Koebel |
| Fate SRD | Borrowed mechanics | CC BY 3.0 | Evil Hat Productions |
| Ironsworn SRD | Borrowed mechanics | CC BY 4.0 | Shawn Tomkin |
| COF — Character Open File | Borrowed mechanics | CC BY 4.0 / CC0 1.0 | Yann Souetre |

License links, upstream links, what each source contributes, and whether it was
modified are recorded in `docs/licenses/ATTRIBUTION.md`; this table stays the
single source of truth for the README footer.

Adding a content source requires: (a) a row in this table; (b) a LICENSE file
in the content's subdirectory for vendored **Narrative frameworks** rows; and
(c) a `source_url` field in the synthesis manifest for those vendored rows.
**Borrowed mechanics** are implemented in the server rather than vendored, so
they replace (b) and (c) with the code citation and the license row. Removing a
source removes the row.

Build inputs are a third class: **operator-supplied** content is a rulebook or
supplement the operator converts from their own copy. It is never committed to
this repository, never rendered into the license footer, and never required for
a build to pass; an operator environment variable names its location. A
tracked file under `scripts/ruleset-builds/` is a gate failure, not a license
entry, so per-book assets cannot re-enter the tree through this appendix.

No OGL 1.0a content ships from this repository. If a future build redistributes
Open Game Content, it carries the OGL 1.0a text and a Section 15 notice in the
same artifact, and this appendix gains the row that authorizes it.
