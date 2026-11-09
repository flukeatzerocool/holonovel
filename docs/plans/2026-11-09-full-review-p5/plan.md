# Plan — Full-review sweep, chunk P5 (engine loop, event stream, durable agent tasks)

**Status:** draft, awaiting user approval · **Date:** 2026-11-09 · **Depth:** standard
**Review independence:** fresh — cold pass `independent-review passed.`
(0 blockers, 0 majors, 6 minors/nits; all resolved in this revision; stages 5/5;
report `/tmp/opencode/p5-cold/report.md`)
**Roadmap item:** `ROADMAP.md` § Remaining full-review sweep (P1)
**Predecessor:** `docs/plans/2026-11-09-full-review-p4/` (chunk P4, closed
2026-11-09, `LOOP PAUSED`)
**Tracker:** `docs/plans/2026-11-09-full-review-sweep/worklist.md`

## Review status

Drafted against the live tree and the sweep's established method. Chunk P5 is
the first chunk after the persistence chunk: it reviews the engine loop's turn
and event path (`core/event-log.ts`, `core/event-hub.ts`, the turn/event
handlers in `index.ts`), branch/replay verification against the canonical state
hash, and the durable agent-task subsystem (`core/agent.ts`,
`manage_agent`), cross-checked against `docs/engine-contract.md` §2–§6. Depth is
`standard`: the increment edits review records, registers, roadmap, and
changelog; it is fully reversible and performs no destructive, remote, or
schema-migration operation.

## Done bar

**Done bar:** this increment only — chunk P5 of the sweep program. The bar is
met when all nine items hold; anything else found is scheduled, not chased.

1. `docs/plans/2026-11-09-full-review-p5/` carries `plan.md`, `tasks.md`, and
   `aar.md`, and `aar.md` ends in `LOOP PAUSED` or `LOOP OPEN`.
   `check-loop-artifacts` passes.
2. The sweep `worklist.md` holds a chunk P5 section with **one row per §5.20,
   §5.24, and §5.31 REQ — 24 rows** (`REQ-412`, `412a`, `611`, `612`;
   `REQ-455`–`460`, `REQ-601`–`605`; `REQ-522`–`530`), each carrying its bucket
   inherited from the base family row in `spec/audit/req-coverage.md` and a
   verdict of `holds`, `finding:<ID>`, or `deferred:<chunk>`.
3. The same section holds a **code-surface table** — one row per reviewed
   behaviour: the behaviours below, plus any others actually reviewed: ordinal
   assignment, append, supersede, cap eviction, non-semantic record
   preservation, event-log save/load round-trip, branch
   creation, branch lineage and sibling isolation, provenance slicing,
   event-hub subscribe/dispatch, state-hash event-log exclusion and version,
   per-event digest recording, verify (divergence), replay (inspection and
   eviction reporting), verification gating (GM-only, no mutation), turn-handoff
   directive, orientation token, cast
   strategy, speaker selection, agent creation, agent transition legality,
   agent action log, agent autonomy, agent subject filtering, agent goal
   provenance, agent terminal immutability, and agent badge gating — plus
   audit-log compaction (`compact`, GM-only; a defect that violates no
   event-path predicate is `Closed-P3`) — each with a `file:line` anchor, the
   carrying evidence, and a verdict. A finding ID is `F-P5-N`, where N restarts
   at 1 for this chunk and is shared across severities. The `Harness` cell holds
   a test ID (`T545`), a supporting harness with no row-set ID
   (`test-security.ts (no row-set ID)`), or `none (citation-gap F-P5-n)` when
   the row's verdict is the citation-gap finding it names. That row set, not
   the gate result, is the falsifiable record that the code was reviewed. The
   behaviour table uses the column shape `Behaviour | file:line | Harness |
   Verdict`; cluster verdicts use `Cluster | REQs | Verdict | Evidence`; the
   engine-contract clause table uses `Clause | Owner cluster | Verdict |
   Evidence`; all live in the worklist § P5 alongside the 24-REQ table.
4. Every `finding:<ID>` names a `file:line` or `spec:line` predicate and a
   P-severity, and has a terminal disposition (`Resolved` ·
   `Scheduled-roadmap` · `Closed-P3` · `Deferred-by-user`). The verdict cell
   records it as `finding:F-P5-n (P1|P2|P3)`; the behaviour table's verdict cell
   uses the same vocabulary (`holds`, `finding:F-P5-n (Pn)`, `deferred:<chunk>`,
   `Closed-P3`).
5. Zero open P0 findings remain. A P0 that cannot be fixed inside the session
   stops the run and still lands as a record (see **Stopped-run landing**).
6. Each of the four clusters (A–D below), each engine-contract clause §2–§6, and
   the **cross-check aggregate row** have a recorded review verdict: `holds`
   with the carrying gate or harness, `finding:F-P5-n (P1|P2|P3)`,
   `deferred:<chunk>`, or `Closed-P3` (with its closure reference). The
   clause table has five rows plus the aggregate. The aggregate's verdict is the
   worst-of the five under this order: `finding` > `deferred` > `Closed-P3` >
   `holds` (within `finding`, the highest severity wins; equal findings go to
   the lowest `F-P5-n`, equal deferreds to the earliest chunk number); its
   `Owner cluster` cell reads `cross-check (aggregate)` and its `Evidence` cell
   lists the five clause verdicts. A cluster verdict is the worst-of its REQ
   verdicts under the same order.
7. `spec/audit/review-register.md` carries every P5 finding under the section
   its disposition names; no `Scheduled-roadmap` row is written without its
   matching `ROADMAP.md` entry, and every `REQ-NNN` token in a
   `Scheduled-roadmap` row appears literally in `ROADMAP.md`
   (`scripts/lib/register-checks.ts:64-68`, enforced by
   `npm run check-registers -- --strict`).
8. `ROADMAP.md` is updated in the same increment: the sweep section names the
   remaining chunks P6–P8, the closing M1 machine-evidence re-run (M1's first
   pass closed 2026-11-09; the closing re-run is over the post-P8 tree and
   covers `check:conformance`, `fmea`, and `graph-deps`), retains the scope
   clause, its `**Trigger:**` line names chunk P6 on a closed run (or the P0 /
   chunk P5 resume on a halt), and the section keeps the admission shape
   (1–3 bullets + `**Trigger:**`).
9. These exit 0 un-piped: `npm run assemble`, `npm run check:fast`,
   `npm run check`, and `npm --prefix holonovel run test:all`. The increment is
   one commit, subject derived by `npm run session:close` from the
   `CHANGELOG.md` heading; a conditional C0 baseline fix precedes it as its own
   commit (see **Commit order and gates**). No push.

## Open questions (answers recorded as decisions before execution)

- **Q1 — Chunk scope.** The chunk charter is the sweep worklist's P5 status
  row (`worklist.md:192`), which names the engine loop, `core/event-{hub,log}.ts`,
  `core/agent.ts`, and the spec sections §5.20, §5.24, §5.31 plus
  `docs/engine-contract.md` §2–§6. The roadmap's prose gloss ("engine loop and
  event stream") is narrower than that row; the worklist row is the operative
  tracker. The row set is §5.20 (4 REQs), §5.24 (11 REQs), and §5.31 (9 REQs) —
  24 rows across 23 family rows; the code surface is the turn/event path in
  `index.ts`, `core/event-log.ts`, `core/event-hub.ts`, `core/agent.ts`, the
  event/branch/replay handlers, and the state-hash integration point. Notation:
  a chunk reference in prose is `chunk Pn` and the verdict token is
  `deferred:Pn`; a finding severity is written `P1 finding` or `severity P1`;
  `(P1)` on a roadmap heading is a priority band.
  **Recommendation:** one commit; a halt is the only split.
- **Q2 — Fix policy.** D2/D13 unchanged: P0 fixed in-session (bounded), P1
  scheduled on `ROADMAP.md`, P2 fixed only on a demonstrated failure, P3
  record-and-close. **Recommendation:** adopt, so chunks stay comparable.
- **Q3 — Increment record.** New directory
  `docs/plans/2026-11-09-full-review-p5/` for this increment's plan/tasks/AAR;
  the sweep `worklist.md` stays the cross-session tracker and carries the P5
  tables and decisions D52–D60. **Recommendation:** yes.
- **Q4 — Bucket resolution.** Resolve by base family ID from
  `spec/audit/req-coverage.md`, never by section membership: §5.20 has three
  family rows and four REQs (`REQ-412` carries `412a`), §5.24 has eleven, and
  §5.31 has nine. All are bucket C (EV7). Re-verify at Phase 0.
  **Recommendation:** yes.
- **Q5 — Boundaries (one rule, no overlap).** P5 reviews five event-path
  integration predicates: (a) the digest is computed after the
  post-mutation perception derivation (REQ-602 ordering), (b) the projection
  **excludes** the event log, audit log/archive, undo/redo, checkpoints,
  metadata, and the named session/wall-clock fields (REQ-601's exclusion
  list), (c) each entry records the projection version in force and legacy or
  older-projection entries are reported as unhashed/historical rather than
  fabricated (REQ-602), (d) `verify`/`replay` are GM-only, read-only, and
  report divergence/eviction honestly (REQ-603–605), and (e) the event log,
  ordinals, supersession state, and branch lineage survive a save/load
  round-trip in their recorded order (REQ-455/REQ-459). `canonicalJson`'s key
  ordering, number formatting, and the general projection field-selection
  rules for non-event surfaces are chunk P7's algorithm surface. `REQ-601`'s
  row is `holds` when (b) and the version field hold, with its evidence cell
  naming the canonicalization half `deferred:P7`; a defect in (a)–(e) is a
  P5 finding, a defect in the general canonicalization algorithm is
  `deferred:P7`. Storage-layer mechanics (atomic temp write, fsync, backup
  rotation, corruption restore) are P4's closed surface: a defect there is
  `Closed-P3` with the P4 reference; only when it manifests as an (a)–(e)
  contract failure is it a P5 finding. Resource projection → `deferred:P6`;
  narrative-cognition internals behind social staging → `deferred:P8`, but the
  `manage_staging` handler contract itself (§5.20) is P5's.
  **Recommendation:** adopt this single rule.
- **Q5a — Row precedence.** One verdict per REQ. When a REQ's predicate
  straddles the boundary, the verdict is worst-of: any defect in a P5
  predicate is `finding:<ID>` even when another predicate in the same REQ is
  `deferred:<chunk>`; `holds` requires every non-deferred predicate to hold,
  and the evidence cell names the deferred part. **Recommendation:** adopt.
- **Q6 — Citation resolution scope.** Apply chunk P2/P3b-1/P4's method
  unchanged: each REQ's own `*Check:*` IDs; a REQ with no own Check inherits
  its family's citation set; an `Automated` citation must appear literally in a
  `holonovel/scripts` harness **and** the harness body must be opened and must
  exercise the stated behaviour; `Manual`, `Gate`, and scenario citations need
  no harness. Zero-padded title tokens (`T0nn`) are shadowing, not evidence
  (F-P2-4). **Recommendation:** adopt.
- **Q7 — Fingerprint consequence.** §5.24 and §5.31 are in `DATA_SECTIONS`
  (`scripts/lib/contract-fingerprint.ts:40-41`); §5.20 is **not**. A REQ-body
  edit in §5.24 or §5.31 therefore requires `npm run build-order` to regenerate
  `holonovel/src/generated/contract-fingerprints.ts`; a §5.20 body edit does
  not (but still requires `assemble` and the coverage-register refresh). The
  plan budgets for it. **Recommendation:** adopt.
- **Q8 — Publication.** `npm run status` reports **12 unpushed commits** at
  session start (EV2). **Recommendation:** no push; publication stays
  user-authorized.

## Scope

**In scope.** Chunk P5 review of the engine loop and event path: turn
conventions and the handoff/orientation directives (§5.20), the temporal event
log — append, ordinal determinism, non-semantic record, supersession,
branch, lineage/isolation, provenance, cap eviction, event-log round-trip
through save/load where REQ-455/459 require it (§5.24
REQ-455–460), canonical state hash integration, per-event digests, divergence
verification, replay inspection and its read-only/gated contract (§5.24
REQ-601–605), the event hub's subscribe/dispatch path, and durable agent tasks
— creation, lifecycle, admitted transitions, action log, autonomy, subject
filtering, terminal immutability, goal provenance, badge gating (§5.31
REQ-522–530). Cross-check against `docs/engine-contract.md` §2–§6. Citation
resolution for all 24 REQs. Findings dispositioned. Roadmap trigger advanced.
Register rows. Changelog entry.

**Out of scope.** Re-opening the §5.9/§5.19 persistence review (closed by the
2026-11-09 seam pass and chunk P4); RNG, limits, corpus, semantic index, graph,
and state-hash *algorithm* (P7); surface projection, world-model tiers,
rulesets, and library (P6); narrative cognition (P8); the open remediation
roadmap items; publication.

**Row set (24 REQs).** §5.20: `REQ-412`, `REQ-412a`, `REQ-611`, `REQ-612`.
§5.24: `REQ-455`–`REQ-460`, `REQ-601`–`REQ-605`. §5.31: `REQ-522`–`REQ-530`.
A REQ outside this set belongs to another chunk; record it there, not here.

## Evidence base (this session)

| # | Evidence | Source | Trust |
|---|---|---|---|
| EV1 | `npm run assemble` → exit 0; `npm run check:fast` → exit 0, 37 passed / 0 failed, trailing line `check:fast: PASS` | tool output, this session | tool-output |
| EV2 | `npm run status`: version `2026.11.09`, last publish `2026-11-09T04:30:29Z`, 12 unpushed commits, 13 open roadmap items | tool output, this session | tool-output |
| EV3 | Tree clean at plan time; `git rev-parse --short HEAD` = `110360e`; `origin/main..HEAD` = 12 commits | `git status`, `git rev-list` | repo |
| EV4 | §5.20 spans `spec/02-requirements.md:4098-4111` and holds **4 REQs**: `REQ-412`, `412a`, `611`, `612` | `grep -n '^### 5\.'`, `awk` | repo |
| EV5 | §5.24 spans `spec/02-requirements.md:4143-4166` and holds **11 REQs**: `REQ-455`–`460`, `REQ-601`–`605` | `grep`, `awk` | repo |
| EV6 | §5.31 spans `spec/02-requirements.md:4320-4339` and holds **9 REQs**: `REQ-522`–`530` | `grep`, `awk` | repo |
| EV7 | Coverage register: §5.20 has three family rows / four REQs (`req-coverage.md:381`, `:569-570`), §5.24 eleven (`:424-429`, `:559-563`), §5.31 nine (`:491-499`) — all bucket C, no A/B/D/E | `grep -E '5\.20\|5\.24\|5\.31'` | repo |
| EV8 | Code surface: `core/event-log.ts` 99 lines, `core/event-hub.ts` 62, `core/agent.ts` 74, `core/state-hash.ts` 64, `index.ts` 14 741, `docs/engine-contract.md` 329 | `wc -l` | repo |
| EV9 | Event-log anchors: `EventSource`/`EventLogEntry`/`BranchLineage` `event-log.ts:5-30`; `nextOrdinal` `:36`; `appendEvent` `:42`; `supersedeEvent` `:56`; `sliceThrough` `:75`; `describeEntry` `:81`; `entriesByOrdinals` `:87`; `evictToCap` `:94`. `EventHub` `event-hub.ts:15`, `EventSink` `:8`. `agent.ts`: statuses `:6`, autonomy `:7`, `AUTONOMY_LEVELS` `:27`, `canTransition` `:42`, `transition` `:47`, `recordAction` `:55`, `nextTaskId` `:62`, `isMutable` `:72` | `grep -n '^export'` | repo |
| EV10 | `index.ts` anchors: imports `:32`, `:35`, `:44`; `eventHub` instance `:574`; `recordEvent` (REQ-455/456/602) `:2422-2433` with cap eviction `:2429`; verify/replay block `:9470-9580` (`supersedeEvent` `:9538`, `[evicted]` reporting `:9562`, `sliceThrough` `:9566`); `manage_agent` registration `:9030`, create/lifecycle `:9048-9109`; `manage_staging` registration `:6661`, `cast` `:6328`, `next_speaker` `:6344`; branch creation (REQ-458/459) `:11007-11008` | `grep -n`, `sed` | repo |
| EV11 | `state.ts` persists `event_log`/`branch_lineage` (`:831-832`, `:1243`, `:1637`, `:2817-2819`, `:2992`) and `agent_tasks` (`:850`, `:1249`, `:1643`, `:2827`, `:2998`) | `grep -n` | repo |
| EV12 | `state-hash.ts`: `canonicalJson` `:45`, `projectState` `:49`, `stateHash` `:59` | `grep -n '^export function'` | repo |
| EV13 | Carrying harnesses: `test-event-log.ts` 226 lines (T545–T550 `:31-124`; T712–T716 `:126-217`); `test-agent.ts` 118 (T605–T613 `:30-102`); `test-competitive-gaps.ts` (T727 `:521`, `:591`; T728 `:542`); `test-backfill.ts` (T482 `:821`); `test-lean-narrator.ts` (T640 `:115`). Supporting harnesses exist but carry no P5 test IDs: `test-persistence-guardrails.ts` (T469–T476), `test-fingerprints.ts`, `test-security.ts`. All six event-path harnesses are suite targets (EV18) | `grep -n`, `wc -l` | repo |
| EV14 | `DATA_SECTIONS` includes `"### 5.24 "` and `"### 5.31 "` (`scripts/lib/contract-fingerprint.ts:40-41`) but **not** `"### 5.20 "` | `grep -n` | repo |
| EV15 | No §5.20/§5.24/§5.31-specific root gate exists. `npm --prefix holonovel run test:all` is the authoritative server run (`holonovel/scripts/run-test-suite.ts`); the root gates cover shape, fingerprints, and conformance only | `run-test-suite.ts`, EV1 | repo |
| EV16 | The sweep's roadmap section names chunk P5 as the next start (`ROADMAP.md:15-24`); chunk P4 is closed and recorded (`docs/plans/2026-11-09-full-review-p4/aar.md:3`) | `ROADMAP.md`, AAR | repo |
| EV17 | `npm run check-registers -- --help` documents `[--strict]` ("Exit 1 when any register finding is reported"); the default is report-only. M1's first pass closed 2026-11-09 (`worklist.md:196`); the roadmap retains a closing re-run over the post-P8 tree | tool output, this session; worklist | tool-output |
| EV18 | All six event-path harnesses are npm targets in the authoritative suite: `test:lean-narrator` `run-test-suite.ts:27`, `test:fingerprints` `:30`, `test:backfill` `:34`, `test:competitive-gaps` `:48`, `test:event-log` `:57`, `test:agent` `:65` | `grep -n`, this session | repo |

## The chunk's review surface — four clusters

Mapping check: the four clusters partition the code surface with one named
seam (the state hash, cluster C); the 24 REQ rows are distributed as shown.

| Cluster | Surface | Code targets | Harnesses |
|---|---|---|---|
| **A** turn conventions and the loop | `badge_briefing` orientation and turn-handoff directive, `manage_staging` cast/next_speaker, turn-close emission | `index.ts` orientation `:13880`, handoff `:13935`, `manage_staging` `:6328-6390`/`:6661`, `recordEvent` call sites | `test-backfill.ts` (T482), `test-lean-narrator.ts` (T640), `test-competitive-gaps.ts` (T727/T728) |
| **B** temporal event log | ordinal assignment, append, supersede, cap eviction, event-log save/load round-trip, branch, lineage/isolation, provenance, event-hub subscribe/dispatch, audit-log compaction (`compact`, GM-only) | `core/event-log.ts:5-99`, `core/event-hub.ts:15`, `index.ts:2422-2433`, `:9490-9570` (`event`/`history`/`supersede`/`compact` actions), `:11007-11008`, `state.ts:831-832`/`:2817-2819` | `test-event-log.ts` (T545–T550); `test-persistence-guardrails.ts` (supporting, no row-set ID) |
| **C** determinism integration and replay | canonical state hash event-log exclusion and version, per-event digest, divergence verification, replay inspection, read-only/gated verification | `core/state-hash.ts:13-27` (exclusion list and projection version), `:45-64` (integration only; canonicalization is P7), `index.ts:9470-9580` (`verify`/`replay`), `state.ts` digest hooks | `test-event-log.ts` (T712–T716); `test-fingerprints.ts` (supporting, no row-set ID) |
| **D** durable agent tasks | create, transition legality, action log, autonomy, subject, terminal immutability, goal provenance, badge gating, persistence | `core/agent.ts:6-74`, `index.ts:9030-9109`, `state.ts:850`/`:2827` | `test-agent.ts` (T605–T613); `test-security.ts` (supporting, no row-set ID) |

Cluster A carries §5.20 (4 REQs); cluster B carries §5.24 REQ-455–460; cluster C
carries §5.24 REQ-601–605; cluster D carries §5.31 (9 REQs). Engine-contract
ownership is fixed per clause: §2 state authority and §3 turn semantics → A;
§4 determinism/replay → C; §5 event stream → B; §6 save format → B for the
event-log/branch/agent-task save-load path only, with a §5.19-owned save-format
defect recorded `Closed-P3` against P4 (Q5). The cross-check aggregate row
(worst-of the five clause verdicts) is recorded once, after the five clause
rows.
**Seam:** `REQ-602` (per-event digest) is recorded once, under cluster C; its
call site in `recordEvent` (`index.ts:2431-2432`) is cluster B's
responsibility to confirm ordering, and the plan treats an ordering defect as a
cluster C finding with a B-side predicate. The `manage_diagnostics` handler is
split by action: `event`/`history`/`supersede`/`compact` → B, `verify`/`replay`
→ C; `subscribe` is the `EventHub` subscription action, also B. An agent-task
save/load defect is recorded on the §5.31 REQ row (cluster D); the §6 row is
evidence-only for that path.

## Steps

### Phase 0 — Baseline (no source edits)

1. Re-run `npm run check:fast` un-piped immediately before the review and
   record the exit status; run `npm run check` once so the full gate's baseline
   is measured rather than inherited. A red baseline is a P0 and is fixed first,
   as its own commit; if it cannot be fixed in-session, land per **Stopped-run
   landing** (red-baseline branch).
2. Run `npm --prefix holonovel run test:all` and record the per-harness summary
   and exit status; at minimum the run must include `test:event-log`,
   `test:agent`, `test:competitive-gaps`, `test:backfill`, `test:lean-narrator`,
   and `test-fingerprints` (EV13/EV15). These six are the **event-path
   harnesses** re-run after any P0 fix that touches the event or agent path:
   `test:event-log`, `test:agent`, `test:competitive-gaps`, `test:backfill`,
   `test:lean-narrator`, `test:fingerprints`.
3. Confirm `git status --porcelain` shows **only** the untracked
   `docs/plans/2026-11-09-full-review-p5/` directory, record
   `git rev-parse --short HEAD`, and note that the cold-pass directory lives
   under `/tmp/opencode/` and the plan-gate evidence sidecar under
   `~/.local/state/opencode/plans/`, both outside this repository and therefore
   absent from `git status`.
4. Confirm the artefact directory is trackable: `git check-ignore -v
   docs/plans/2026-11-09-full-review-p5/` returns nothing.
5. Record Q1–Q8 and Q5a as **D52–D60** in the sweep `worklist.md` before review
   work starts (D1–D51 are already recorded and are not renumbered). Decisions
   go in the worklist, not this file, so the stamped plan hash stays valid; if a
   decision departs from its recommendation, amend this plan and re-stamp
   instead of recording the departure only in the worklist.
6. Record the plan gate's evidence sidecar by running
   `node ~/.config/opencode/skills/plan-review/scripts/plan-gate.mjs preflight
   --project /home/fluke/Holonovel --plan
   docs/plans/2026-11-09-full-review-p5/plan.md --target ROADMAP.md --target
   CHANGELOG.md --req REQ-412 --req REQ-455 --req REQ-522` (repeat `--target`
   and `--req` once per path and REQ; the flags are not comma-lists). It writes
   `plan.evidence.json` and `plan.evidence.md` under
   `~/.local/state/opencode/plans/<repo-key>/`.
7. Re-derive the row set (24 REQs across 23 family rows) and the bucket for
   each family from `spec/audit/req-coverage.md` (EV7). A verified mismatch is a
   plan defect: stop, amend this plan, and re-stamp before proceeding — never
   silently re-scope in the worklist.

### Phase 1 — Code side (read-only review)

1. **Enumerate the surface**, recording `file:line` anchors in the worklist:
   `nextOrdinal`, `appendEvent`, `supersedeEvent`, `sliceThrough`,
   `describeEntry`, `entriesByOrdinals`, `evictToCap`, `EventHub` methods,
   `recordEvent` and its call sites, the verify/replay/history/event/compact/
   subscribe handlers, branch creation and lineage write, the `stateDigest`
   integration, `projectState`, `stateHash`, `STATE_HASH_EXCLUDED_KEYS`,
   `STATE_HASH_PROJECTION_VERSION`, every `agent.ts` export, and the
   `manage_agent` action branches. Enumeration confirms names; nothing is
   assumed from the P4 worklist. `projectState` and the two constants are read
   to confirm the event-log exclusion and the version field (Q5); the
   `canonicalJson` serialization rules are P7's and are not reviewed.
2. **Review with `code-review`** (read-only, reached through
   `programming-orchestrator`) cluster by cluster over that surface: A turns,
   B event log, C determinism integration, D agent tasks. Clusters A–D are
   independent and may be reviewed in parallel; Phase 3 triage is the join
   point. Every finding cites the predicate (`file:line`), never a gate message.
3. **Check each assertion against the behaviour it claims.** Open every cited
   harness and confirm the body exercises the contract: `T545`–`T550` (event
   log), `T712`–`T716` (hash/verify/replay), `T605`–`T613` (agent tasks),
   `T727`/`T728` (staging), `T482`/`T640` (directive/orientation). A passing
   harness asserting something narrower is a finding. Zero-padded title tokens
   (`T0nn`) are shadowing, not evidence (F-P2-4).
4. **Verify the turn path**: where the handoff directive and orientation token
   are rendered, whether they survive a minimal briefing budget, whether the
   token is in the never-truncated tier (REQ-135 cross-reference), and whether
   every narrated turn closes through the stated emission point. A directive
   present only in one badge path is a finding. A REQ-135 truncation defect
   found here is a finding against REQ-412/REQ-412a (the owning row), not a
   `deferred:` verdict — REQ-135 supplies the bound, not the owner.
5. **Verify the event log's invariants**: monotonic ordinals across append and
   supersede, cap eviction preserving order and reporting eviction, branch
   copies sharing entries through the branch point without mutating the parent,
   lineage recorded once, sibling isolation, provenance slicing inclusive of
   the target ordinal, and the log/lineage round-trip across save/load where
   REQ-455/459 require it. A branch that shares mutable references with the
   parent is a finding; a storage-layer defect that violates no §5.24 predicate
   is `Closed-P3` with the P4 reference (Q5).
6. **Verify the determinism integration**: the digest is taken after the
   post-mutation perception derivation; the projection excludes the event log
   and the REQ-601 exclusion list and records the version; verify/replay are
   GM-only and read-only; a tampered checkpoint
   reports divergence at the right ordinal; replay on an evicted ordinal
   reports `[evicted]`. Do not review the hash algorithm's canonical JSON
   rules — that is P7 (Q5). An ordering or gating defect is P5's.
7. **Verify the agent subsystem**: the transition table refuses illegal moves,
   terminal tasks are immutable, actions append once per advance, autonomy is
   persisted and defaulted from the environment, subject filtering is exact,
   goal provenance is recorded, Player cannot create and Observer is
   read-only, and the task cap is enforced. A task accepted in a terminal
   state is a finding.
8. **Cross-check `docs/engine-contract.md` §2–§6** against the code: state
   authority (§2), turn semantics (§3), determinism/replay (§4), the event
   stream (§5), and the save format (§6) **only for the event-log, branch, and
   agent-task save-load path**. A contract statement with no corresponding
   behaviour or assertion is a citation-gap finding; a behaviour that
   contradicts the contract is a finding against the owning REQ; a §6 defect
   owned by a §5.19 persistence REQ is `Closed-P3` with the P4 reference (Q5).
9. **Record one verdict per REQ** (24 rows, done bar 2) and one row per
   reviewed behaviour (done bar 3), using the established column shape
   `REQ | § | Bucket | Verdict | Evidence`, plus one **cluster verdict row** per
   cluster A–D, one per engine-contract clause §2–§6, and the cross-check
   aggregate row (worst-of those five) (done bar 6). Phase 1 verdicts are
   provisional until Phase 2 completes; Phase 2 records the final bucket and
   verdict.

### Phase 2 — Spec side (citation resolution)

1. Apply the reproducible method (Q6): each REQ's own `*Check:*` IDs; a REQ with
   no own Check inherits its family's citation set; an `Automated` citation must
   appear literally in a `holonovel/scripts` harness **and** its body must
   exercise the stated behaviour; `Manual`, `Gate`, and scenario citations need
   none. Bucket from the base family row per Q4.
2. Classify citation *kind* before counting a missing harness: the sweep's P1
   and P2 sections record the false-finding counts (69 from skipped kind, 20
   from zero-padded token shadowing, F-P2-4). A scenario citation needs no
   harness; an `Automated` token with no harness is a finding.
3. A REQ whose cited test does not exercise the stated behaviour is a finding.
   `npm run check:conformance -- --dedicated` over-flags on this corpus
   (AGENTS.md), so its output is evidence to inspect, never a finding by itself.
4. Fill the bucket and verdict columns for all 24 rows.

### Phase 3 — Triage, registers, roadmap, artefacts

1. **Triage** every finding per Q2. Guardrails for a P0 fix:
   - A fix in the event or agent path runs the six event-path harnesses plus
     `test:all`.
   - A fix that changes an action's parameters or output first runs a
     sibling-contract check: grep the REQ corpus for other REQs naming the same
     `tool (action: X)` and confirm no sibling contract conflicts (notably
     `manage_diagnostics (action: …)`, `manage_staging (action: …)`, and
     `manage_agent (action: …)`).
   - A fix that amends a REQ body complies with Appendix M's authoring limits
     (one paragraph, no tables/bullets/steps, 800-char and 8-sentence caps);
     `npm run validate --sdd-strict` is the check.
   - A fix that edits a §5.24 or §5.31 REQ body: `npm run assemble`, then
     `npm run validate -- --write-register`, then `npm run build-order` — both
     sections are in `DATA_SECTIONS`, so the fingerprint **must** regenerate
     (Q7). A §5.20 body edit runs `assemble` and the register refresh but
     triggers no fingerprint regeneration, so `build-order` stays conditional.
   - A fix that edits a tool definition re-runs the generator and the surface
     gates (`npm run build-order`); `check-tool-definitions-sync` fails on a
     stale `tool-definitions.json`.
2. **`spec/audit/review-register.md`**: one dated heading per used disposition
   section, rows per **Register write-back** below.
3. **`ROADMAP.md`**: keep the sweep item's 1–3 bullet + `**Trigger:**` shape
   (`check-roadmap` rejects any other) and update it to:
   - bullet 1 — chunks P6–P7 (adapters and rulesets; determinism and
     knowledge);
   - bullet 2 — chunk P8 (narrative cognition) and the closing M1
     machine-evidence re-run over the post-P8 tree, covering
     `check:conformance`, `fmea`, and `graph-deps`, and the retained scope
     clause ("Scope is §5.1–§5.35 except §5.9 and §5.19; §5.6 and chunk P4 are
     closed; chunk P5 is closed-or-halted as recorded in the sweep worklist");
   - trigger — chunk P6 on a closed run; on a halt, the P0 fix or the chunk P5
     resume instead.
   When triage produces scheduled findings, **also** add remediation sections
   (the P3b-2/P3b-3/P4 precedent) in groups of 1–3 bullets split by theme,
   because `check-roadmap` admits at most three bullets per section and
   `npm run check-registers -- --strict` requires every REQ in a
   `Scheduled-roadmap` row to appear literally in `ROADMAP.md`
   (`scripts/lib/register-checks.ts:64-68`). Every bullet names its finding's
   `REQ-NNN` IDs, including lowercase sub-REQ suffixes, and every remediation
   section carries a `**Trigger:**` line ("closes when the finding is
   `Resolved`"). When triage produces none, add no second section. On a halted
   run the scope clause records "chunk P5 halted", not "closed".
4. **`CHANGELOG.md`**: one dated heading `<YYYY-MM-DD> — Full-review sweep:
   chunk P5 (engine loop, event stream, durable agent tasks)`. The date equals
   the current CalVer date written with hyphens (`2026.11.09` → `2026-11-09`);
   verify at execution.
5. **Artefacts**: tick the completed items in `tasks.md`, replace the
   provisional `aar.md` with the execution record and the token the outcome
   earns, and update the sweep worklist's status table (P5 closed-or-halted;
   P6 remains `scheduled`).

## Register write-back

| Disposition | Section | Row shape |
|---|---|---|
| `Resolved` | first `## Resolved` block (`review-register.md:12`), newest-first | `### <date> full-review sweep — chunk P5`; bullet `**F-P5-N — <title> (resolved):**` + predicate + the REQ IDs it covers + fix location + the assertion that now covers it (or `no new assertion`); an in-C1 fix cites the plan-local label `C1` as its commit ref — no commit sha is available inside the same commit, and the register does not require one; the heading carries the date |
| `Scheduled-roadmap` | `## Scheduled-roadmap` | same heading; bullet names the finding, the predicate, the REQ IDs it covers (including lowercase suffixes), and the `ROADMAP.md` section it is scheduled under, plus the date; each cited `REQ-NNN` also appears literally in that `ROADMAP.md` section |
| `Closed-P3` | `## Closed-P3 (recorded, no action)` | same heading; bullet records the predicate, the REQ IDs, and why no action follows |
| `Deferred-by-user` | `## Deferred-by-user` | only on an explicit user deferral; names the decision |

A finding scheduled against a later sweep chunk writes both the register row and
the chunk reference in the sweep `worklist.md` **and** its exact `REQ-NNN`
tokens in a `ROADMAP.md` remediation bullet — the REQ-literal rule applies to
every `Scheduled-roadmap` row, not only roadmap-section-owned fixes. A finding
scheduled against a roadmap-section-owned fix writes the `ROADMAP.md` entry in
the same step. The P5 increment does not retire a register row owned by another
chunk, so no cross-referencing register is updated beyond the sweep worklist's
status row and the roadmap trigger.

## Stopped-run landing

If a P0 cannot be fixed within the session, the run halts and still lands as a
record:

1. `worklist.md` marks chunk P5 `halted on <finding ID>` and keeps the partial
   tables.
2. `ROADMAP.md` gains an additional section for the P0: heading
   `## <finding ID> — <title> (P0)`, 1–3 bullets naming the predicate, the
   reproduction, and the finding's `REQ-NNN` IDs, and a `**Trigger:**` line;
   the admission rule and the strict REQ-literal rule both apply.
3. `CHANGELOG.md` heading reads
   `<date> — Full-review sweep: chunk P5 (halted on <finding ID>)`.
4. `spec/audit/review-register.md` carries the unfixed P0 as a
   `Scheduled-roadmap` row whose matching `ROADMAP.md` entry is the P0 section
   from step 2 (its bullets carry the REQ tokens). A baseline P0 is a gate
   defect, not a review finding, so it gets no register row; record it in the
   AAR only.
5. `aar.md` ends `LOOP OPEN` naming the P0 row; gates still run. Green is
   required for whatever landed **except** the red-baseline branch below.
6. The roadmap scope clause records "chunk P5 halted", never "closed".
7. No push. The P0 is the next session's first item, ahead of chunk P6.

**Red-baseline branch.** When the unfixable P0 is the baseline itself (Phase 0's
`npm run check` or a server harness is red and cannot be fixed in-session), the
landing overrides Stopped-run steps 1–7 as follows:

1. `aar.md` records the red gate output verbatim and ends `LOOP OPEN` naming
   the red gate; `worklist.md` status reads `halted — red baseline`.
2. `ROADMAP.md` gains a heading `## Baseline red — <gate> (halted)` (no finding
   ID, because a gate defect is not a review finding), 1–3 bullets naming the
   failing command and its first failing assertion, and a `**Trigger:**` line
   naming the baseline fix. No `Scheduled-roadmap` row exists, so the
   REQ-literal rule does not apply.
3. No `CHANGELOG.md` entry is written: a red baseline produces no semantic
   change, and the AAR is the record.
4. Stage only the planning record — `git add docs/plans/2026-11-09-full-review-p5/
   docs/plans/2026-11-09-full-review-sweep/worklist.md ROADMAP.md` — never
   `git add -A`, so untracked leftovers cannot be swept in.
5. Commit **manually** with the dated subject
   `<YYYY-MM-DD> — Full-review sweep: chunk P5 (baseline red, halted)`. No gate is
   run before that commit — a red tree cannot pass one — and the run does **not**
   claim green gates; `session:close` is not used on this branch. The sweep
   section's `**Trigger:**` is amended to name the baseline fix.

Do not commit review findings against a tree whose gates were never green; only
the planning record and the P0 section land.

## Blast radius

| File | Change | Size |
|---|---|---|
| `docs/plans/2026-11-09-full-review-p5/{plan,tasks,aar}.md` | this increment's artefacts | M |
| `docs/plans/2026-11-09-full-review-sweep/worklist.md` | chunk P5 section, 24-REQ table + behaviour table + cluster/clause table, D52–D60, status rows | M |
| `spec/audit/review-register.md` | P5 finding rows (one dated subsection per used disposition) | S |
| `ROADMAP.md` | sweep bullets re-scoped to P6–P7 and P8/M1 with the scope clause retained; trigger advanced to P6; remediation section(s) of 1–3 bullets only when triage schedules findings (each names its REQs); extra P0 section only on a halted run | S |
| `CHANGELOG.md` | dated heading + bullets | S |
| `holonovel/src/core/event-log.ts`, `event-hub.ts`, `agent.ts` | only if a P0 fix lands (named at that time) | S–M |
| `holonovel/src/index.ts` | only if a P0 fix lands in the turn/event/staging/agent handlers (named at that time) | S–M |
| `holonovel/src/core/state-hash.ts` | only if a P0 fix lands in the digest integration (hash algorithm itself is P7) | S |
| `holonovel/scripts/test-*.ts` | only if a P0 fix needs an assertion (named at that time) | S |
| `holonovel/src/generated/contract-fingerprints.ts` | regenerated by `build-order` if a §5.24/§5.31 REQ body changes (Q7) | — |
| `holonovel/tool-definitions.json` | regenerated only if a P0 fix edits a tool definition | — |
| `spec/**` + `holonovel.md` | only if a P0 fix amends a REQ (then `assemble` + register refresh) | S–M |
| `spec/audit/req-coverage.md` | refreshed by `npm run validate -- --write-register` when a REQ body changes | S |
| `README.md` | `@spec:` markers refreshed by `npm run refresh-properties` only when a P0 fix amends a fingerprinted REQ body (`check-markers` gates it) | S |
| `holonovel/package.json`, `package-lock.json`, `server.json`, `AGENTS.md`, `DECISIONS.md` header, `holonovel/src/index.ts` version constant | advanced by `build-order` version sync | — |

## Considered and rejected

- **Reviewing the state-hash algorithm.** Rejected: canonical JSON
  serialization and hash stability are P7's determinism surface; P5 reviews the
  event-log exclusion, the version field, when the digest is taken, and whether
  verification enforces it. Mixing the two would re-open a chunk boundary the
  sweep set.
- **Reviewing §5.24 persistence as a persistence chunk.** Rejected: P4 closed
  the `state.ts` persistence surface. P5 reviews the event-path contracts; a
  persistence defect that violates no §5.24 contract is `Closed-P3` with the P4
  reference.
- **Treating the event hub as chunk P1's badge-routing surface.** Rejected: P1
  reviewed badge gates and error envelopes; the hub's subscribe/dispatch path
  belongs to the event stream (engine-contract §5) and has no P1 row.
- **Reviewing narrative-cognition internals behind `manage_staging`.** Rejected:
  the staging handler contract is §5.20 and P5's; the cognition that supplies
  candidates is P8. A predicate wholly there is `deferred:P8`.
- **Chasing every uncovered branch with a new harness.** Rejected: an
  unreachable branch with no assertion is a citation-gap finding; writing
  harnesses for every branch is remediation, not review.
- **Fixing every finding.** Rejected: P1/P2/P3 findings are scheduled or closed;
  only a P0 blocks the chunk's close.
- **Scheduling P1 findings inside the sweep bullets only.** Rejected:
  `check-registers --strict` requires every `REQ-NNN` a `Scheduled-roadmap` row
  cites to appear literally in `ROADMAP.md`; a remediation section that names
  them is the only conforming destination once a finding exists.
- **Recording P6–P8 predicates as `finding:` rows.** Rejected: a boundary is not
  a defect in this chunk's surface; `deferred:<chunk>` keeps the verdict
  vocabulary mechanical without writing a register finding the code does not
  support.

## Verification

| Check | Command | Expected |
|---|---|---|
| Assembly | `npm run assemble` | exit 0 |
| Fast gate | `npm run check:fast` (un-piped) | 37/37 (or the new total if a P0 fix adds a harness), `check:fast: PASS` |
| Full gate | `npm run check` | 0 errors |
| Server harnesses | `npm --prefix holonovel run test:all` (authoritative; includes `test:event-log`, `test:agent`, `test:competitive-gaps`, `test:backfill`, `test:lean-narrator`, `test:fingerprints`) | exit 0, record per-harness summary |
| Roadmap admission | `npm run check-roadmap` | pass after the roadmap edit |
| Register cross-refs | `npm run check-registers -- --strict` | pass |
| Loop artefacts | `npm run check-loop-artifacts` | pass, LOOP token present |
| Coverage register | `npm run validate -- --write-register` | only when a REQ body changed |
| REQ shape (conditional) | `npm run validate --sdd-strict` | only when a P0 fix amends a REQ body; 0 shape errors |
| Fingerprints (conditional) | `npm run build-order` | 0 errors; `check-fingerprint-sync` passes |
| Markers (conditional) | `npm run refresh-properties` | only when a P0 fix amends a fingerprinted REQ body; `check-markers` passes |
| Machine evidence | `npm run check:conformance` | exit 0; record the summary |

## Risks and rollback

- **An event-path defect discovered late can exceed the session.** Mitigation:
  stop, record, land per **Stopped-run landing**; the plan's bar is not met, and
  that is the correct outcome.
- **Branch creation mutating the parent Novel.** Mitigation: the review treats
  shared mutable references as a P0 candidate; the harness `T548`/`T549`
  already asserts parent immutability and sibling isolation, so the finding is
  bounded to the path those tests miss.
- **Destroying a real user Novel while probing a branch or replay path.**
  Mitigation: all probes use scratch data directories (`TTRPG_DATA_DIR`) and
  the existing harnesses; the plan adds no destructive manual step.
- **False citation holds.** Mitigation: open every cited harness; `T0nn`
  shadowing (F-P2-4) is a known source.
- **Gate-pinned values.** The changelog date is the CalVer date;
  `session:close` derives the commit subject from the top CHANGELOG heading.
- **Draft artefact breaks a gate mid-session.** `check-loop-artifacts` requires
  plan, tasks, and a LOOP token; all three exist from the drafting step.
- **No destructive operations, no push.** Every change is a reversible edit or an
  added artefact; rollback cost 1 (one `git revert`) when there is no C0, or 2
  (revert C1 then C0) when a baseline fix landed first.

## Commit order and gates

| # | Commit | Scope | Gate before commit |
|---|---|---|---|
| C0 (conditional) | Restore a green baseline | only if Phase 0's `npm run check` or a server harness is red — that baseline fix alone, committed **manually** with a dated subject `YYYY-MM-DD — Restore green baseline (<gate>)`; `session:close` is used for C1 only, and the AAR records the deviation | `check:fast`, `check`, plus the red server harness re-run |
| C1 | Full-review sweep: chunk P5 (engine loop, event stream, durable agent tasks) | plan/tasks/AAR, worklist chunk-P5 tables and status, register rows, ROADMAP.md, CHANGELOG.md, any review P0 fix | `assemble`, `check:fast`, `check`, `check-roadmap`, `npm run check-registers -- --strict`, `check-loop-artifacts`, `npm --prefix holonovel run test:all`, plus `build-order` only if a §5.24/§5.31 REQ body or tool definition changed, `validate -- --write-register` only if a REQ body changed, and `validate --sdd-strict` if a REQ body changed |

C1 is one commit (spec increment); C0 exists only when the baseline is red and
lands first. Publication is not part of this increment.

## User impact

None to runtime behaviour unless a P0 fix lands. The increment changes review
records, the roadmap trigger (advanced to chunk P6 on a closed run), and the
changelog; chunks P6–P8 stay scheduled, and the closing M1 re-run remains on the
roadmap.

## Evidence

- Review artefact: this file; tracker:
  `docs/plans/2026-11-09-full-review-sweep/worklist.md`.
- Finding predicates: recorded per finding in `spec/audit/review-register.md`.
- Baseline: EV1–EV18 above (repo and tool-output sources).
- No external sources; no user-supplied content drives an instruction.
