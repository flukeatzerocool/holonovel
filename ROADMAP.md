# Roadmap

<!--
  Admission rule: a `## <title>` section is a scheduled work item. It needs an
  action a maintainer can take, 1–3 bullet lines, and a `**Trigger:**` line
  naming what starts the work or what closes it. Priority order, P0 first;
  remove a section when the work ships (it moves to CHANGELOG.md).

  Standing facts are not roadmap items: accepted tradeoffs, by-design
  limitations, and out-of-scope tracks are recorded in `holonovel/DECISIONS.md`,
  and `## Non-goals` is the pointer to them. `npm run check-roadmap` enforces
  this rule; `## Non-goals` is exempt.
-->

## Materialize lore `visibility` (REQ-083d–REQ-083f)

- Lore entries carry `badge_scope` but no `visibility` field, and `manage_lore`
  accepts no `visibility` parameter, so REQ-083d's
  `gm_only`/`shared`/`player_discovered` contract and REQ-083f's presence-gated
  trigger matching are unimplemented. Add the field and parameter, route
  read-access filtering through it, and extend T342.

**Trigger:** the next lore or badge-filtering increment; closes when a
`manage_lore (action: set)` entry with no `visibility` field is invisible to the
Player badge, a `shared` entry is visible, and T342 asserts both.

## Non-goals

Authoritative list and rationale: `holonovel/DECISIONS.md` § Non-goals.
