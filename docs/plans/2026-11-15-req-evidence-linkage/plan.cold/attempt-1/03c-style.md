# Stage 3c — style critic

Reviewer: `review` subagent, fresh context
Artifact: `plan.md` · sha256 `cea8a9e2…6504c2` (verified)
Reads: 3 (plan, tasks, docs/plans/README.md)

## Findings

| Se | Finding | Rests on |
|---|---|---|
| **Blocker** | §9's parser-consolidation mitigation cites "V1's unchanged bucket counts", but V1 is `test:validators`; no verification row asserts bucket counts | plan:218 vs :193 |
| **Blocker** | Three statements disagree on the self-test count: done bar "one red and one green", P5 "two reds and one green", tasks.md "Red + green" | plan:84, :163-165; tasks:12 |
| Major | `P3` is overloaded — plan phase, ROADMAP priority, triage severity | plan:179 vs :142 |
| Major | The population list mixes units (bodies / REQs / pairs / IDs / pairs), so the 122 cannot be reconciled from the document | plan:66-69 |
| Major | 23 Manual rows and 23 manual unlinked pairs read as a transcription error; the relationship is never stated | plan:51, :69 |
| Major | P2 is the only phase with no `**Test:**` line | plan:134-140 |
| Major | Plan orders wiring before tests; the sibling orders tests before wiring | plan:150-161; tasks:12-13 |
| Major | P3 declares three rules; P5 tests two; the no-row rule has no red case and real data yields zero | plan:147, :163-165 |
| Major | No blast-radius statement, though `docs/plans/README.md:17` requires one | plan (absent) |
| Major | Done-bar items (`corpus.md`, `LOOP PAUSED` AAR) have no verification row | plan:85-91 vs :191-197 |
| Nit | Signature leaves `citations`' key/value undefined; `rows` type narrower than P1 returns | plan:145 vs :126 |
| Nit | `:2071-2075` and `:2052` described inconsistently as "map build" and "call site" | plan:19, :129 |
| Nit | "The `Manual` → `Gate` wording" reads as a renaming direction | plan:102 |
| Nit | Evidence class tagged once per section, not per claim | plan:16 |
| Nit | "dated ROADMAP entry" — ROADMAP has no date field | plan:88, :181 |
| Nit | tasks 9/9a have no phase map | tasks |
| Nit | command forms and ordering inconsistent between §6 and :186 | plan:110, :186 |
| Nit | "fed by the REQ bodies the audit already parses" omits `decisionsText` and the rows | plan:82 |

`stage 3c: 2 blockers, 8 majors, 8 nits`
