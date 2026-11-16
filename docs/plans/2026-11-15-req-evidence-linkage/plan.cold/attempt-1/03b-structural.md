# Stage 3b — structural critic

Reviewer: `review` subagent, fresh context
Artifact: `plan.md` · sha256 `cea8a9e2…504c2` (verified)
Reads: 9/10

## Findings

| Se | Finding | Rests on |
|---|---|---|
| **Blocker** | No phase specifies the rule that turns a `_Check:_` segment into cited T-IDs, yet that extraction is the check's entire population | plan:145, :152-153 |
| Major | Appendix F is parsed three times today; P1 consolidates the shape, not the parse, and P4 needs the rows again — a fourth parse | plan:152-157 |
| Major | §9 assigns the regression detector to V1 (`test:validators`), which cannot observe bucket counts; the real detector is V2's register freshness | plan:218, :193-194 |
| Major | Citation unit unspecified against the audit's base-REQ collapse: `REQ-284f` versus `REQ-284` changes the count, the corpus grouping and the register row | plan:66, :145 |
| Major | Plan and task list impose opposite orders on tests (P4) and wiring (P5) | plan:150-166; tasks:12-13 |
| Major | The done bar cannot be judged: "one red and one green" vs P5's two reds | plan:84, :163-165 |
| Nit | `tasks.md:9` says delete `parseAppendixFReqTests` unqualified; a second copy lives in `compare-spec-code.ts:169` | tasks:9 vs plan:103 |
| Nit | P6 writes the recon split into the committed register although the run is authoritative | plan:175, :70, :159 |
| Nit | One commit takes `--single` without stating why it is atomic | plan:107-111 |
| Nit | "printed into `warnings`" — `warnings` is a counter; the house pattern is `console.log` plus increment | plan:156-157 |
| Nit | Nothing bounds an always-on check printing ~122 lines per run | plan:158-159 |

`stage 3b: 1 blocker, 5 majors, 5 nits`
