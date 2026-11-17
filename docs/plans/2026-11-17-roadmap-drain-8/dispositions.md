# Dispositions — REQ evidence linkage chunk 7 (the §7.7 archetype family, 3 rows)

P1 read. All three rows are class (b) — an `Automated` Appendix F row with no exercised T-ID
(`scripts/lib/req-checks.ts:887`). Each clause is machine-checkable in this checkout, so each takes
`author`, and the asserting site is the new assertion in `checkCouplingCompleteness`. No row is
flipped to `Manual` and no row is re-cited.

| REQ | T-ID | class | cite | home | action |
|---|---|---|---|---|---|
| REQ-369b | T420 | (b) | every coupling row cites a valid pattern rule; no archetype assignment is orphaned | `scripts/validate.ts:1094`, `:1105`, `:1257` | author |
| REQ-374b | T425 | (b) | every property group carries ≥1 archetype, reported for all groups | `scripts/validate.ts:1105`, `:1261` | author |
| REQ-374b | T439 | (b) | 12-archetype vocabulary; every archetype used by a coupling row | `scripts/validate.ts:1135`, `:1257` | author |

Residue after this chunk: 57 − 3 = **54**, all class (b), scheduled on ROADMAP.md item 3 for the
next chunk.

## Reading that keeps the fallback open (D5)

The dry run (`npm run validate`, exit 0 before the edit) reported `0 error(s), 362 warning(s)`,
`REQ evidence linkage: 57 finding(s)`; the parse saw 41 property groups, 12 archetypes plus
`[content source]`, 102 coupling rows, 0 empty cells, 0 unused archetypes. No D5 defect, so the
increment proceeded. Had any appeared, the stop point was before P4's register edits (condition
C-2), not P1.

## Predicate note (D3)

"Archetypes used by ≥1 coupling row" is enforced at archetype level, not group level. §7.7.1b
states the coupling table is curated, and `Ruling Ledger` carries no coupling row by design; a
group-level failure would contradict that clause. The summary line reports the group count, so the
group-level reading stays visible without being an error.
