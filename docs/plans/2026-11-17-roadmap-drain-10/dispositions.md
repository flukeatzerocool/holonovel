# Dispositions — REQ evidence linkage chunk 9 (cross-artifact agreement, 3 rows)

P1 read at `66fa82d`, pre-edit. All three rows are class (b) — an `Automated` Appendix F row with
no exercised T-ID (`scripts/lib/req-checks.ts:888`). Each clause is a machine-checkable agreement
between two committed artifacts, so each takes `author`. No row is flipped to `Manual` and no row
is re-cited.

| REQ | T-ID | class | cite | home | action |
|---|---|---|---|---|---|
| REQ-082b | T205 | (b) | DECISIONS.md carries a 40-row section-token-to-group table whose tokens, order, and numbering agree with the runtime briefing registry that feeds the `[INVALID_INPUT]` enumeration | `scripts/validate.ts:checkBriefingTokenRegistry` (added in P2) | author |
| REQ-277 | T297 | (b) | the B.4/N.4 RNG witness tables reproduce from the documented generator, and the B.3 transcript's seed-pinned dice agree with it | `scripts/validate.ts:checkFixtureWitness` (added in P3) | author |
| REQ-107b | T106 | (b) | the root CalVer matches the DECISIONS `\| Spec version \|` row and the CalVer date-stamp grammar | `scripts/version-check.ts:checkVersionCoordination` (added in P4) | author |

Residue after this chunk: 50 − 3 = **47 rows**, all class (b), scheduled on ROADMAP.md item 3 for
the next chunk.

## Pre-edit readings (the error-gate dry run)

- `npm run validate`: `0 error(s), 355 warning(s)`, `REQ evidence linkage: 50 finding(s)`.
- `T205`: 40 DECISIONS rows (`holonovel/DECISIONS.md:272-311`), `#` contiguous `1..40` (true),
  order equal to the runtime emission order (39 `token:` literals plus `countdowns` after
  `narrative_threads`, true), every group and layer cell non-empty (true).
- `T297`: B.4 rows 2, N.4 rows 4, 80 of 80 witness faces reproduce; 3 of 3 transcript arrays
  reproduce.
- `T106`: root `2026.11.16` satisfies `^\d{4}\.\d{2}\.\d{2}$` and matches the DECISIONS row.
- `npx tsx scripts/version-check.ts`: exit **1**, failing only the pre-existing `T493` currency
  line (root `2026.11.16` predates the `2026-11-17` CHANGELOG entry). Recorded as a pre-existing
  finding, not this increment's; recovery is the publish-time `npm run version-bump` (REQ-107a).

## Unclaimed clauses (recorded, not claimed by the label)

- **`T205` sentence 2** — invoking `manage_context (action: briefing_order)` with an unknown token
  and asserting the `[ERROR] [INVALID_INPUT]` response is a live-server drill. The check asserts
  the *content* of that enumeration (clause e), not the invocation.
- **`T205` group-name canon** — the group cell is asserted non-empty under the `REQ-109 group`
  header; the check does not re-derive REQ-109's enumeration, so it does not claim each label is
  the canonical REQ-109 name.
- **`T205` ordering rationale** — clause (c) asserts that the documented order equals the runtime
  order; it does not assert the prose reasoning at `holonovel/DECISIONS.md:238-243`.
- **`T297` sentences 1–2** — the maintainer edits the source until replay fails, bumps the fixture
  version, and records the citing REQ in the fixture changelog comment. These are maintainer
  actions on a break, not properties of the committed tree; the `<!-- fixture version N -->`
  comments are not asserted.
- **`T297` single-die roll** — `Knacks (knacks): rolled 2` (`spec/appendices-fixtures.md:218`)
  states no die count, so binding it to "the first d6 draw" would be an assumption. Excluded.
- **`T106` live-server clauses** — that `spec_health` reports the field, that the Player badge
  reads it, and that a same-version gap audit exits "current". The dynamic-read half is already
  asserted by `checkFileContains` (`scripts/version-check.ts:101-106`) and is not re-claimed.
