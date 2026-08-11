## Appendix U: Content Licenses

This appendix is the single source of truth for third-party content licenses
incorporated into Holonovel builds. The Build workflow SHALL render this table
into the README.md license footer during handoff (§6.2 H11).

| Source | Kind | License | Copyright |
|--------|------|---------|-----------|
| D&D 5e SRD v5.1 | Ruleset data | CC BY 4.0 + OGL 1.0a | Wizards of the Coast |
| Graham Nelson's Inform | World model conventions | Artistic License 2.0 | Graham Nelson |
| if-craft-corpus | Narrative frameworks | CC BY 4.0 | pvliesdonk |
| dmcp | Narrative frameworks | MIT | Shawn Rushefsky |
| lonelog | Narrative frameworks | CC BY-SA 4.0 | zeruhur |
| BitD SRD | Narrative frameworks | CC BY 3.0 | John Harper |

Adding a content source requires: (a) a row in this table, (b) a LICENSE file
in the content's subdirectory, and (c) a `source_url` field in the enrichment
manifest (§6.3). Removing a source removes the row.
