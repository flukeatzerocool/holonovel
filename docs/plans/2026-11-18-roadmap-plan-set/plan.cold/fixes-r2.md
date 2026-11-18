# Finding → fix table — revision 2

Diff re-review input. Only the changed lines are quoted. Line numbers are as of revision 2 on disk
(they shifted by the fixes themselves; the quoted text is the anchor).

| # | File:line | Current text (quoted) | Resolves |
|---|---|---|---|
| B1 | — | The state-store copy held another session's `plan.md`; revision 2 is stamped from the reviewed bytes with `stamp-plan --independence fresh`, and `plan.cold/report-r1.md` + this table sit beside the artifact | Blocker 1 (identity) |
| B2a | item-4:79 | "**D1 — Target: `index.ts:6528-7154` (627 lines)** … `index.ts` 17,857 − 627 = 17,230 lines … The item's 3,000-line target is still unreached; the done bar says so" | Blocker 2 (arithmetic) |
| B2b | item-4:160 | "`index.ts` = 17,857 − 627 = 17,230 (±5); new module ≈650 (<900). The 3,000-line target is **not** reached by this stage (D1)" | Blocker 2 (V1 impossible state) |
| B2c | item-4:177 | "`.split("\n").slice(6527, 7154)`" | Blocker 2 (off-by-one slice) |
| B2d | item-4:36-38 | "`// --- World-Model CRUD (GM-only) ---` at `index.ts:6528`; the block ends at `:7154`, the line before the `resolve_intent` header at `:7155`" | Blocker 2 (range vs count) |
| B2e | item-4:185 | "**Done bar:** `index.ts:6528-7154` is gone" | Blocker 2 (consistency) |
| B3a | plan.md:149-150 | "`item-1a-handoff-evidence.md` … (builder half of item 1) / `item-1b-verifier-run.md` … (operator half of item 1)" | Blocker 3 (one bar, one session) |
| B3b | item-1a:114-120 | "## Done bar / **Done bar:** `presence-matrix.md` resolves every workflow … one commit" | Blocker 3 (increment A owns its bar) |
| B3c | item-1b:124-131 | "## Done bar / **Done bar:** a verifier report exists … one commit" | Blocker 3 (increment B owns its bar) |
| M4a | plan.md:88 | "`KIND_ORDER` (`:54`)" | Major 4 (citation) |
| M4b | plan.md:89 | "the install branch switches on them (`:13006`)" | Major 4 (citation) |
| M4c | plan.md:92 | "the action's `slug` parameter is optional and documented as \"a pack without one adopts it\" (`:12971`)" | Major 4 (false premise) |
| M4d | plan.md:71-74 | "`computeLenses` pushes to ten of the thirteen declared lanes (`…playtest-lib.ts:366-431`) — never to `world_population_failure`, `coupling_failure`, or `wrong_tool` (`:307`)" | Major 4 (lane claim) |
| M5 | item-4:113-115 | "No `spec/audit/review-register.md` row is opened or closed: this stage closes no tracked finding, and the register row that routed stage 1 belongs to another item (`:3908-3910`, the mutation sample)" | Major 5 (F9 misattribution) |
| M6 | item-2:150 | "Arithmetic: 14 seeded after P2 + **21 pairs** = 35" | Major 6 (arithmetic) |
| M7 | item-5:114-121 | "**D10 — There is no pre-existing review-register row for this item** … opens its own dated `## Resolved` entry" | Major 7 (missing row) |
| M8 | plan.md:115-122 | "**D4 — Each draft defines a falsifiable close condition: a number, or a named artifact set with a stated verdict**" | Major 8 (numeric bar) |
| M9 | plan.md:140, :185 | "`check-loop-artifacts -- --lenient` warns rather than errors while the increment is in flight" | Major 9 (strict invocation) |
| M10 | item-2:165 | "`seeded=35` and `caught=35` (`catch_rate=1`) or `caught=34` (`catch_rate=0.9714`)" | Major 10 (impossible value) |
| m11 | item-2:197 | "Lowering D1's criterion is a plan amendment (re-stamped), never a silent change" | Minor 11 (one fallback) |
| m12 | item-2:168 | "no reference remains — P2 deletes the constant because both its members became deterministic" | Minor 12 (retain-or-delete) |
| m13 | item-4:84-86, :142-146 | "the badge/authorization helpers the block calls (`requireGM` and any other … P1 enumerates)" / "the context grows by 16 fields; if it is another member … by 17" | Minor 13 (unstated counts) |
| m14 | item-4:166, :168 | "`0` and `1`" / "no moved module imports the entry point" | Minor 14 (no count; tautology) |
| m15 | plan.md:9-11 | "`wc -l … index.ts` reads 17,857 while `holonovel/AGENTS.md:59` still says 17,856 — a one-line doc drift" | Minor 15 (baseline drift) |
| m16 | item-5:56 | "one harness with 23 cases (`grep -c 'await test('` reads 23)" | Minor 16 (count) |
| m17 | item-1a:46-51 | "P1 confirms whether the Rule 9 entry exists today — the draft does not assume it" | Minor 17 (unstated existence) |
| n18 | plan.md:43-45 | "The drafts are numbered 1a, 1b, 2, 4, 5 because they follow ROADMAP section order: item 3 … was retired on 2026-11-17" | Nit 18 (numbering gap) |
| n19 | plan.md:122 | "(`spec/audit/review-register.md:3908-3910`)" | Nit 19 (cite convention) |
| n20 | item-5:53 | "REQ-321o (`spec/02-requirements.md:2316-2317`)" | Nit 20 (header vs body) |
| n21 | item-4 | Covered by B2a–B2e | Nit 21 |

## Not changed, with the reason

- **Unknowns in the r1 report** (baseline commands, item 1's harness enumeration, `context.ts` field
  count) are not defects in the artifact; the drafts state each as measured-here or to-be-measured
  in the executing session's P1.
- **Context contamination note:** recorded in `plan.md`'s review history is not needed — the reviewer
  is read-only and the contamination did not carry author reasoning; this table notes it once.
