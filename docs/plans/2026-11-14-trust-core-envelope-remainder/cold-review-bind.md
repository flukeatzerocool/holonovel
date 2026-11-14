Plan sha256: 4319cf93ea9e1a75d0ffa608ea3f6dfeca3505d0279b02fc62f73028ebd9ee05

# Binding review — v4 condition-only amendment (N1–N4)

Hash verified locally (`sha256sum` matches the supplied digest). Scope verified:
the four edits, and nothing else in the read ranges.

- **N1 — Resolved.** `plan.md:430-435`: the client-visible list now reads
  "absent from lookups, enumerations, hints, and `info` resolution", and the
  next sentence names the remaining surface — "The index-backed `search`
  surface still discloses such entries and remains open under F-P1-17."
  Consistent with D5/D9 (`plan.md:226-243`) and Out of scope.
- **N2 — Resolved.** `plan.md:344`: the `holonovel/src/index.ts` cell now reads
  "`err()`/`raw()` `isError`, delete `refusalResult`, `rulesetEntryVisible` +
  two applications (lookup, info), comments". `GuardRefusal` is gone from the
  cell and matches C1's "stay as they are" (`plan.md:272-273`) and C4's (a)/(b)
  (`plan.md:289-291`).
- **N3 — Resolved.** `plan.md:331-333`: F-P1-17's register row records
  "predicates `index.ts:2319`/`:2323` and `:13611-13637`", covering both the
  derived-tool `search` case and `manage_ruleset (action: search)`.
- **N4 — Resolved.** The enabling contract now reaches the info surface in all
  three places: D4 (`plan.md:218-221`, "every extracted Concept and Entity
  entry — and every entry served through an `info`-kind tool — SHALL carry a
  `badge_scope`"), C5 (`plan.md:296-300`), and done bar 5 (`plan.md:71-73`).
  Body-size prediction (`≈250 chars / 3 sentences`, `plan.md:307`) leaves
  headroom under the 800-char / 8-sentence cap after the added clause.

**New hard blocker: none.** The amendment adds no file, gate, or destructive
step; the three REQ-210c statements agree with each other; C4's two
applications, the blast-radius cell, and the T179 info assertion
(`plan.md:321-325`) now line up. Existing conditions carried forward unchanged:
F-P1-17 remains scheduled with a register row and ROADMAP bullet, and the
identifier availabilities verified in the prior pass (T783, F-P1-17) are
unaffected by this diff.

Reads: 5 / 6 (1 hash check + 4 line-range reads).

independent-review passed. stages 5/5
