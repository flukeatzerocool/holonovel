# Cold review — revision 2 (diff re-review)

**Reviewer:** the same cold session as r1 (its own findings, no authoring context).
**Scope:** changed lines only, against the 21 r1 findings. 10 reads / 10 budget.
Plan sha256: 6c809a6a1d805a8b5d12325ad65c3e4772f6b3fe81d62098cfc6492cce9afc1d

**Verdict:** `independent-review passed.` — 0 Blockers, 0 unresolved Majors, 0 regressions, 4 new
Minors on changed lines.

## Dispositions

| ID | Disposition | Evidence in the reviewed text |
|---|---|---|
| B1 | RESOLVED (procedural) | Review history records the stale state-store copy; the artifact is stamped from the reviewed bytes after this pass |
| B2a–B2e | RESOLVED | `item-4:79` `:6528-7154` (627 lines); `:160` V1 says the 3,000 target is not reached; `:177` `slice(6527, 7154)`; `:36-38` block ends at `:7154`; `:185` done bar agrees |
| B3a–B3c | RESOLVED | `plan.md:149-150` two drafts; `item-1a:114-120` own bar and directory; `item-1b:124-131` own bar and directory; the A→B dependency is stated once per document |
| M4a–M4d | RESOLVED | `:88` `KIND_ORDER` (`:54`); `:89` install branch (`:13006`); `:91-93` slug optional (`:12971`); `:71-74` ten of thirteen lanes, never `wrong_tool` |
| M5 | RESOLVED | `item-4:113-115` opens/closes nothing; `:3908-3910` attributed to the mutation sample |
| M6 | RESOLVED | `item-2:150` 14 + 21 = 35; blast radius `≥21 pairs` |
| M7 | RESOLVED | `item-5:114-118` D10; closure rows updated to a dated `## Resolved` entry |
| M8 | RESOLVED | `plan.md:115-120` "falsifiable … a number, or a named artifact set with a stated verdict" |
| M9 | RESOLVED | `plan.md:140-141` and `:185` use `-- --lenient`; strict form from P4 |
| M10 | RESOLVED | `item-2:165` `caught=34` → `catch_rate=0.9714` |
| m11–m17 | RESOLVED | See `fixes-r2.md`; each disposition confirmed against the current text |
| n18–n21 | RESOLVED | `plan.md:43-45`, `:122`; `item-5:53`; covered by B2 |

## New findings (all Minor, all fixed as a condition-only amendment)

1. `plan.md:138` said "Four new documents" while the rest of the plan says five → "Five".
2. `item-4:40` said `:5547-6528` (982 lines inclusive) while `:109` said `:5547-6527` → one range.
3. `item-4:100,150` still passed `--from-line 7156` after the block end moved to `:7154` → `7155`.
4. `item-4:88,126` asserted "sixteen fields" flatly while P1 allows 16 or 17 → both sites say so.

## Left unverified by the reviewer (Unknown)

- `item-1a:109` asserts the validator's probe failure is surfaced as `T253`; the validator message
  text was not read.
