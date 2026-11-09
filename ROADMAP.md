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

## Torre player-facing knowledge depth (P3)

- Add two or three pages (the tower's origin, the survivors' bargain, the
  matches) or mark a few lore entries `player_discovered` with a page-reveal
  path (REQ-083d, REQ-565).
- Keep the one-fragment-per-floor rhythm unless the added pages earn their
  place.

**Trigger:** after the seven current pages have been played through and
exploration still feels thin.

## Survivor race clock (P3)

- Decide whether The Survivors' 0/10 faction clock should advance on scene
  transitions and fire a "first to the door" event, or stay descriptive
  (REQ-233).
- Any clock must be balanced against The Candle and Dread, not layered on top
  without a playtest.

**Trigger:** after the current Candle/Dread economy has been played and the
race still feels narrated rather than mechanical.

## Non-goals

Authoritative list and rationale: `holonovel/DECISIONS.md` § Non-goals.
