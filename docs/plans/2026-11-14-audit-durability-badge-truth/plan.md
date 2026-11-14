# Plan — Audit durability and badge truth (F-P1-4, F-P1-13)

Status: v3 (built). Cold pass v1 returned `independent-review passed.` with 0
Blockers and 5 Majors; each Major is resolved below and in
`cold-review-resolution.md`. A1 at execution start corrected the baseline
premise (the only failing gate was this increment's own missing `aar.md`), and
A2 records the build-time findings: the REQ-237 marker-slot reservation, the
conditional capture (`AUDIT_APPEND_HEADROOM`) after measuring 6.75 ms at
3.6 MB, and the pattern-buffer badge ordering) · Kind: planned · Depth: standard
Increment target: docs/plans/2026-11-14-audit-durability-badge-truth/
Rollback cost: 1 (one pure module, one dispatcher branch and rollback wrapper,
two handler edits, three REQ bodies, harness assertions, registers; reversible
in one commit)
Evidence class: repo only
Cold pass: `docs/plans/2026-11-14-audit-durability-badge-truth/cold-review.md`,
sha256 `a22ba72a44633e2e58c1034d5dfd7d8e0fcf9955765bc8de98a7fda5a989054e`,
verdict `independent-review passed.` (0 Blockers, 5 Majors, 6 Minors, 1 Nit)
against plan sha256 `469805fe…f5eda0` at HEAD `739b362`; M1–M5 are resolved in
v2 (the cold artifact therefore reviews v1, and v2's amendments are the diff
build-review verifies).
Trust boundary: every premise is read from the working tree at HEAD `739b362`;
the F-P1-4 and F-P1-13 reproductions below were run against the working tree
with a scratch `TTRPG_DATA_DIR`.

## Cold-review resolutions

| Finding | Resolution |
|---|---|
| M1 (catch placement) | C2/D3: the rollback is a `withCapacityAbort` wrapper composed inside `normalizeRefusal` (`index.ts:313`), because `normalizeRefusal:279-293` envelopes the throw first. |
| M2 (capture unspecified) | D3: interchange JSON via `novelToJSON`/`novelFromJSON`, `"replace"` restore plus explicit stack reassignment; `captureWorkflowSnapshot` and `restoreFromSnapshot` are named and rejected with reasons. |
| M3 (unsupported cost premise) | D3: the claim is scoped to `snapshot()` with its real source (`holonovel/DECISIONS.md` § *TDQS coherence remediation*), the capture cost is measured in step 1, and a 5 ms fallback is recorded. |
| M4 (non-binding REQ-448 qualifier) | D5/C5: no qualifier; REQ-448 gains a sentence naming the at-capacity exception and its reporting surface. |
| M5 (`"replace"` exists) | D3/C2: no new `applyNovelState` mode; the existing mode's stack preservation is stated and compensated. |

## Questions

1. Which roadmap item is next? `ROADMAP.md:15-23` § *Trust-core contract
   remediation (P1)*. Its only remaining bullet is audit durability and badge
   truth (F-P1-4, F-P1-13); the authorization half of the section shipped in
   `2026-11-14-trust-core-authorization`. This increment takes the last bullet,
   which removes the whole section.
2. Is this one increment? Yes. Both findings are the same promise — a call that
   cannot record its audit entry must not proceed, and a badge claim with no
   Novel to hold it must not report success — and both are small edits at the
   two choke points that already own refusal (`guardToolCall`,
   the `set_badge` handler). Splitting them would leave the roadmap section open
   for a second session to close two one-file edits.

## Objective

Close the two scheduled findings:

| Finding | Register | Promise |
|---|---|---|
| F-P1-4 | `spec/audit/review-register.md:2495-2499` | the Novel is saved, then `audit()` throws at capacity; the write persists and the chain gains a gap |
| F-P1-13 | `spec/audit/review-register.md:2521-2524` | `set_badge` returns `[OK] Active badge: player` with no active Novel, while `getBadge()` stays `none` (Editor, full access) |

**Reproduced at HEAD `739b362`** (scratch `TTRPG_DATA_DIR`,
`TTRPG_STARTER_NOVEL=off`):

- F-P1-13: fresh engine, `set_badge {badge:"player"}` → `[OK] Active badge:
  player`; `manage_diagnostics (action: health).active_badge` → `null`.
- F-P1-4: `TTRPG_AUDIT_MAX_ENTRIES=40`, create Novel, two characters, fill the
  log to capacity, then `manage_character (action: set_active, entity_id:
  character_02)` → `[ERROR] [STATE_CONFLICT] Audit log at capacity (40
  entries)` **and** the Novel file on disk carries
  `active_entity_id: "character_02"` with the audit log still 40 entries.

**Done bar:**

1. At capacity, a dispatcher-routed audit-appending call is refused with
   `[ERROR] [STATE_CONFLICT]` naming the cap and the existing corrective
   action **before the handler runs**, so the in-memory and persisted Novel are
   unchanged (`metadata.state_hash` identical before and after). Asserted by
   T533 (extended) against the `set_active` reproduction above.
2. A call that passes the preflight but reaches the cap mid-handler (a first
   call also writes the `[session-boundary]` marker, or a confirmation workflow
   appends several entries) leaves no persisted mutation: the dispatcher
   restores the pre-call Novel and returns the same `[STATE_CONFLICT]`
   envelope. Asserted by a new T786 with a cap one slot short of a two-entry
   call.
3. The corrective action stays reachable: `manage_diagnostics (action:
   compact)` is admitted at capacity, and its `compress_audit:` confirmation
   either frees space before appending or refuses before saving. Asserted in
   T533's extension.
4. No path appends past the cap: `StateManager.auditForbidden` stops appending
   when the log is at capacity, and REQ-448's body states that an at-capacity
   refusal is reported through `spec_health.audit_at_capacity` and the refusal
   envelope rather than an entry.
5. `set_badge` with no active Novel returns `[ERROR] [STATE_CONFLICT]` naming
   `open_session` or `manage_novel (action: create)`, writes no audit entry,
   leaves `spec_health.active_badge` null, and returns the existing
   `[OK] Active badge: …` strings once a Novel is active. Asserted by new T785;
   `open_session`'s composed badge step does not surface a spurious refusal.
6. The contract is written: REQ-447 gains the before-any-write clause,
   REQ-066b gains the no-Novel refusal, REQ-448 gains the room qualifier;
   Appendix F gains the T785/T786 rows and amends T9/T533; each body is
   re-measured against the 800-char / 8-sentence limit (recorded in the AAR).
7. F-P1-4 and F-P1-13 are `Resolved` with predicates recomputed at the
   post-change lines; `ROADMAP.md` drops the section (its trigger closes with
   it); the coverage register is regenerated.
8. `npm --prefix holonovel run test:all` is green after anchor repoints;
   `npm run assemble && npm run check:fast` reports the trailing
   `check:fast: PASS`; `check-registers`, `check-roadmap`, and
   `check-loop-artifacts` pass.
9. One `npm run session:close` commit. Publication is out of scope.

## Premises (each read at HEAD `739b362`)

**Baseline.**

- `npm run check:fast` reports `40 passed, 1 failed` at execution start. The
  single failure is `check-loop-artifacts ERROR
  2026-11-14-audit-durability-badge-truth: missing aar.md` — this increment's
  own plan directory, written by step 8 — and every other gate passes. `git
  status` is clean apart from the untracked plan directory; `npm run status`
  reports 80 unpushed commits and 6 open roadmap sections.

**The capacity path.**

- `StateManager.auditLogAtCapacity` (`holonovel/src/core/state.ts:2265-2270`)
  returns `novel.audit_log.length >= cap`; `audit()` throws at `:2280-2284`
  with `[ERROR] [STATE_CONFLICT] Audit log at capacity (N entries).` plus
  `AUDIT_CAP_CORRECTIVE` (`:1083-1084`, "raise TTRPG_AUDIT_MAX_ENTRIES or
  compact the log with manage_diagnostics (action: compact)").
- `guardToolCall` (`holonovel/src/index.ts:1989-2038`) is the one refusal choke
  point for both transports: the MCP `tools/call` wrapper (`installSurfaceGuards`,
  `:2040-2058`) and the in-process façade (`:17852-17853`). It holds the
  retired-alias, ruleset-scope, badge (`:2021-2034`), and surface guards, and
  runs **before** any handler.
- `surfaceRegistry()` (`:1785-1796`) loads `holonovel/tool-surface-registry.json`;
  `actionKey()` (`core/badge-gate.ts:80-84`) resolves `${name}.${action}` with a
  bare-key fallback. Classes today: `set_badge` write, `manage_diagnostics.compact`
  destructive, `manage_diagnostics.health` read, `manage_scene.set` and
  `manage_lore.set` idempotent, `resolve_mechanic.roll` read, `take_turn` read.
- `OBSERVER_DENY_ACTIONS` (`core/badge-gate.ts:26-34`) already lists the
  read-classed actions that mutate: `resolve_fate.roll`, `resolve_mechanic.roll`,
  `resolve_mechanic.fate_roll`, `manage_session.visibility_check`,
  `manage_vow.resolve`, `manage_lore.corpus_access`, `manage_corpus.corpus_access`.
- 105 sites in `index.ts` call `state.saveNovel(novel)` and then `audit(...)`
  within the next three lines (enumerated by a static scan of the current file;
  e.g. `:4323-4324`, `:4412-4413`, `:4875-4876`, `:5132-5133`, `:7917-7918`).
  Reordering all 105 is not part of this plan.
- `StateManager.auditForbidden` (`:2350-2366`) appends with **no** capacity
  check, so a refused call can push the log past the configured maximum.
- The compaction escape: `manage_diagnostics (action: compact)` sets a pending
  workflow and saves (`index.ts:11886-11901`, appends no entry); the
  `compress_audit:` confirmation compacts, sets `pending_workflow = null`,
  saves, then calls `audit("compress_audit", …)` (`:4517-4523`). It appends
  after the save, and `compactAuditLog` returns `{sessions: 0}` when there is
  nothing to archive (`core/state.ts:2491`), so the confirmation can throw
  with nothing freed.
- `resumeNovel` audits `resume_novel` after activating the Novel
  (`core/state.ts:1531-1534`), and a first call after a session change also
  appends a `[session-boundary]` marker (REQ-237), so one call can append two
  entries.

**The badge path.**

- `set_badge` registers at `index.ts:4123-4145`; the handler reads
  `state.activeNovel`, and when it is undefined it skips the audit/save and
  returns the success string. `getBadge()` (`core/server.ts:18-20`) returns
  `_state.activeNovel?.badge ?? "none"`, so the caller runs as Editor with full
  access (REQ-030, REQ-066b).
- `open_session` composes the badge step by invoking the `set_badge` raw
  handler directly (`index.ts:17734-17736`), after the optional resume
  (`:17731-17733`), bypassing `guardToolCall`.
- `TTRPG_BADGE` is applied on Novel load (`core/state.ts:729-742`,
  `:1460`), not through the handler; it is unaffected.
- Existing assertions: T9 (`holonovel/scripts/test-backfill.ts:1012-1025`,
  Appendix F row `spec/appendices-reference.md:1446`), T533
  (`holonovel/scripts/test-security.ts:148-160`, row `:1956`), T158
  (`holonovel/scripts/test-persistence.ts:963-985`), and the badge unit tests
  in `test-security.ts:320-380`. None pins the no-Novel success string.
- 245 `set_badge` call sites exist across `holonovel/scripts/*.ts`; most run
  after a Novel is created. The step-1 probe enumerates the ones that run with
  no active Novel (candidates: `test-tool-definitions.ts:400`,
  `test-security.ts:325`, `test-output-contracts.ts:278`,
  `test-starter-novel.ts:135`, `playtest.ts:186`, `:386`).

**Spec and register mechanics.**

- REQ-447 body is 507 chars / 6 sentences; REQ-066b is 549 chars /
  4 sentences (`spec/02-requirements.md:2529`, `:1233-1234`); REQ-448 is
  621 chars / 6 sentences (`:2531`). All three have room under the
  800-char / 8-sentence limit.
- §5.5 and §5.19 are the sections REQ-447/REQ-448 live in; §5.19 is
  fingerprinted (`scripts/lib/contract-fingerprint.ts` covers §5.19), so a
  REQ-448 edit requires `npm run build-order` fingerprint regeneration.
- Appendix F's highest assigned ID is T784; T785 and T786 are free.
- Register rows F-P1-4 `:2495-2499`, F-P1-13 `:2521-2524`; roadmap section
  `ROADMAP.md:15-23`.
- `check-registers` cross-references `Scheduled-roadmap` rows against
  ROADMAP.md entries, so the two resolved rows and the removed section land in
  the same commit.

## Decisions

**D1 — the preflight lives in `guardToolCall`, not in `audit()` or in each
handler.** The dispatcher is the only place every transport converges before a
handler runs, it already owns the refusal envelope (`dispatcherRefusal`), and
F-P1-4's promise ("refuse before mutating") is a statement about the call, not
about the append. Rejected: making `audit()` non-throwing (it would report
success on a call the chain cannot record); editing the 105 save-before-audit
sites (a 105-site diff for the same guarantee, with a much larger review
surface); per-handler `if (state.auditLogAtCapacity(novel))` guards (the
register's finding is precisely that per-site discipline missed one path).

**D2 — the classification is the committed surface registry, with the existing
mutating-read deny set.** An action appends an audit entry when its
`mutation_class` is not `read`, or when it is one of the read-classed actions in
`OBSERVER_DENY_ACTIONS`. That set was settled by static inspection in the
authorization increment and re-verified by this plan's step 1 (superset check:
every read-classed action whose handler calls `audit(`/`recordEvent` must appear
in it). The constant is renamed `MUTATING_READ_ACTIONS` with the Observer
predicate reading the same set, so one list serves both gates. Bare-key tools
(`set_badge`, `open_session`, `close_session`, `respond_decision`) resolve
through `actionKey`; `take_turn` is `read` and appends nothing. When the
registry is absent the gate falls back to the registration annotation
(`readOnlyHint === false`), the same degradation rule the badge gate uses, so a
packaging omission never locks the server. Rejected: a hand-maintained list of
appending actions in `index.ts` (299 registry rows exist and already carry the
class); trusting `readClass` alone (the seven mislabelled actions).

**D3 — a mid-handler capacity abort is rolled back, not just reported.** After
the preflight a call can still reach the cap: a first call in a session appends
the `[session-boundary]` marker plus its own entry, and the compaction
confirmation appends after a save. The abort catch sits **inside**
`normalizeRefusal`, as a `withCapacityAbort(handler, name)` wrapper composed
between `ensureStructured` and `normalizeRefusal`
(`index.ts:313`: `withForbiddenAudit(normalizeRefusal(withCapacityAbort(
ensureStructured(truncateHandler(name, handler)), name)), name)`), because
`normalizeRefusal` (`:279-293`) already converts a capacity throw into an
envelope before any outer wrapper sees it, and `withForbiddenAudit`
(`core/server.ts:51-75`) only rethrows `[FORBIDDEN]`. `withCapacityAbort`
captures, for an appending call only, the Novel's interchange JSON
(`JSON.stringify(novelToJSON(novel))` — the persisted form, so the round-trip is
lossless by design), and on a throw whose message matches
`/Audit log at capacity/` restores it with
`applyNovelState(novel, novelFromJSON(captured), "replace")` plus an explicit
reassignment of `undo_stacks`/`redo_stacks`/`checkpoints` from the capture (the
`"replace"` mode preserves undo/redo stacks so an import cannot lose them), then
re-saves and rethrows so `normalizeRefusal` builds the envelope. Order:
preflight first (cheap), then the capture. The capture is taken **only when the
log is within `AUDIT_APPEND_HEADROOM` (3) slots of a configured cap**, because a
single call appends at most a session-boundary marker plus its own entry plus a
second entry in the few handlers that record two: an uncapped or comfortably
sized log pays nothing. Measured interchange capture: 0.02 ms at 3.7 KB and
6.75 ms at 3.6 MB (step-1 probe); the other recorded baseline is `snapshot()` at
0.2–0.7 ms (`holonovel/DECISIONS.md` § *TDQS coherence remediation*,
"Snapshot-cost measurement"). Rejected: accepting the residue (the finding is that
the write persists); aborting the process (a data-loss response to a config
cap); reordering 105 sites (see D1); `captureWorkflowSnapshot`
(`core/state.ts:2069-2078` — it mutates `connection_counter` and drops the
stacks through `novelToSnapshotJSON`); `restoreFromSnapshot`
(`:2085-2100` — it deliberately preserves the pre-restore audit log, which is
the exact field the rollback must revert); a new `applyNovelState` mode
(`"replace"` plus the stack reassignment needs no state-model change).

**D4 — the compaction escape is exempt, and it may not append without freeing
space.** `manage_diagnostics (action: compact)` is admitted at capacity because
it appends nothing and is the corrective action REQ-447 names; `respond_decision`
is admitted when the pending decision is a `compress_audit:` one. The
confirmation is reordered to audit-then-save and refuses, restoring the
snapshot, when `compactAuditLog` freed nothing (`sessions === 0`). The gate
therefore never deadlocks the only in-process recovery path. At exact capacity
the first half of the corrective action (raise `TTRPG_AUDIT_MAX_ENTRIES`) is
the working recovery, because activating a Novel itself appends; the plan does
not claim otherwise and the AAR records it.

**D5 — `auditForbidden` respects the cap and REQ-448 states the exception.**
At capacity the boundary entry cannot be written; the refusal still surfaces, so
the plan does not qualify the cap-refusal event (it would only ever fire where
there is no room). Instead REQ-448 gains one sentence: a refusal raised because
the log is already at capacity is reported through
`spec_health.audit_at_capacity` and the refusal envelope, not as an entry; every
other cap refusal (the below-cap snapshot-truncation path, REQ-041b) is still
recorded. The badge gate runs before the capacity gate, so a forbidden call
keeps its `[FORBIDDEN]` answer and only its boundary entry is dropped —
authorization truth is unchanged. Rejected: letting boundary entries exceed the
cap (REQ-447 is explicit that the maximum is a maximum); running the capacity
gate first (it would turn an authorization refusal into a `STATE_CONFLICT`,
changing T349's contract under a cap); leaving REQ-448 untouched (it would keep
claiming an entry that cannot exist).

**D6 — `set_badge` refuses without a Novel, and `open_session` keeps its single
report.** The handler returns `err("STATE_CONFLICT", "No active Novel for a
badge switch.", "Open a Novel first with open_session, or create one with
manage_novel (action: create).")` and writes nothing. `getBadge()` already
answers `none` (Editor), which is why the current success is a false claim
(REQ-030 makes the badge Novel-scoped). `open_session` calls the badge step only
when an active Novel exists after its resume step, so a failed resume produces
one error, not two. The tool description's "always callable" is kept: it means
not badge-gated (REQ-066a), and the refusal is a precondition on Novel
existence, so `tool-definitions.json` and the surface budget do not move.
Rejected: storing a connection-scoped badge outside a Novel (REQ-030 binds the
badge to the Novel); returning a `[WARNING]` (the caller would still proceed at
Editor access while believing it is Player).

**D7 — no new tool, no gate-classification row, no persisted-shape change.**
REQ-137a's table stays three-class; the new predicates are dispatcher rules over
the existing registry. `DECISIONS.md` gains one paragraph recording the audit
gate and its exempt set beside the gate table (the table itself is unchanged).
Rejected: a fourth gate class; a registry `appends_audit` field (299
hand-maintained rows for one consumer).

**D8 — the spec states the three behaviours it already asserts, in place.**
REQ-447 gains "before any state is persisted", REQ-066b gains the no-Novel
refusal, REQ-448 gains the room qualifier. No new REQ: each addition is a
clause on an existing contract, not a new surface. The three bodies re-measure
to ≤800 chars / ≤8 sentences (premise counts above; the AAR records the
post-edit counts). Rejected: a new REQ for the capacity preflight (REQ-447
already owns the cap); leaving REQ-066b silent (the refusal would be
unspecified behaviour).

## Change entries

**C1 (M) — the appending-action classifier.** New pure module
`holonovel/src/core/audit-gate.ts` (no server imports): `MUTATING_READ_ACTIONS`
(renamed from `OBSERVER_DENY_ACTIONS`, re-exported from `badge-gate.ts` so the
Observer predicate keeps one source), `appendsAuditEntry(registry, name, args,
annotations)` implementing D2, and `capacityRefusal(cap, name, action)` building
the `[ERROR] [STATE_CONFLICT]` text from
`AUDIT_CAP_CORRECTIVE` so the wording stays single-sourced. `actionKey` is
imported from `./badge-gate.js`. Re-export from `holonovel/src/core/index.ts`.
Header carries the REQ citations (REQ-040a, REQ-040c, REQ-447); library
code, so no script role header. Unit assertions go in `test-security.ts`.

**C2 (M) — dispatcher preflight and abort rollback.** In `guardToolCall`
(`index.ts:1989-2038`), after the badge guard and before `surfaceGuard`, add:
when an active Novel exists, the call is appending, and
`state.auditLogAtCapacity(novel)`, return
`dispatcherRefusal("STATE_CONFLICT", capacityRefusal(...))` — except the D4
exempt set (`manage_diagnostics.compact`; `respond_decision` whose
`activeNovel.pending_workflow.decision` starts with `compress_audit:`). Then add
`withCapacityAbort(handler, name)` and compose it inside `normalizeRefusal` at
`index.ts:313` (`withForbiddenAudit(normalizeRefusal(withCapacityAbort(
ensureStructured(truncateHandler(name, handler)), name)), name)`): for an
appending call it captures `JSON.stringify(novelToJSON(novel))`, and on a thrown
`/Audit log at capacity/` restores via `applyNovelState(novel,
novelFromJSON(captured), "replace")` plus the `undo_stacks`/`redo_stacks`/
`checkpoints` reassignment from the capture, re-saves, and rethrows for
`normalizeRefusal` to envelope (D3). No `applyNovelState` mode is added.
Order: preflight first (cheap, no capture), capture only for calls that pass it.

**C3 (S) — audit paths.** `StateManager.auditForbidden`
(`core/state.ts:2350-2366`) returns early when `auditLogAtCapacity(novel)`
(D5). The `compress_audit:` confirmation (`index.ts:4517-4523`) reorders to
`audit` before `state.saveNovel`, and when `result.sessions === 0` restores
`pw.snapshot`, saves, and returns `err("STATE_CONFLICT", … "nothing to archive
at the current retention", "Raise TTRPG_AUDIT_MAX_ENTRIES …")` (D4).

**C4 (S) — `set_badge` badge truth.** Handler (`index.ts:4128-4145`): return the
D6 refusal when `state.activeNovel` is undefined, before any badge mutation or
audit. `open_session` (`:17734-17736`): call the badge step only when
`state.activeNovel` exists after the resume step. No wording change to the
existing success strings (T9 and T8 assert them).

**C5 (S) — spec contract.** REQ-447 (`02-requirements.md:2529`): insert
"before any state is persisted" into the refusal sentence. REQ-066b (`:1233-1234`):
add the no-Novel `[STATE_CONFLICT]` sentence and extend `_Check:_` to `T9,
T785`. REQ-448 (`:2531`): add the D5 sentence — an at-capacity refusal is
reported through `spec_health.audit_at_capacity` and the refusal envelope, not
as an entry. Appendix F: add T785 (no-Novel `set_badge` refusal) and
T786 (mid-handler capacity abort leaves no persisted mutation) rows, and amend
T9 (`:1446`) and T533 (`:1956`) to name the new legs. Regenerate the §5.19
fingerprint (`npm run build-order`) because REQ-448 lives in a fingerprinted
section.

**C6 (S) — harness assertions.** `test-security.ts`: extend T533 with the
`set_active` reproducibility leg (disk `state_hash` unchanged), the compaction
leg (compact admitted at capacity; confirmation refused when nothing frees),
and the classifier unit assertions; add T785 and T786 with the REQ tokens in
their titles (`T785/REQ-030/REQ-066b`, `T786/REQ-447`), and a
`T533/REQ-447/REQ-040a` title token. `test-backfill.ts`: no change expected,
listed only if the step-1 enumeration finds T9's no-Novel assumption.

**C7 (S) — registers, roadmap, coverage, changelog.** `review-register.md`:
F-P1-4 and F-P1-13 → `Resolved` with predicates recomputed at the post-change
lines, naming T533/T786 and T785. `ROADMAP.md`: remove the whole § *Trust-core
contract remediation (P1)* section (last bullet). Regenerate
`spec/audit/req-coverage.md` (`npm run validate -- --write-register`). Add the
`CHANGELOG.md` entry under the `2026-11-14` heading (the package version pins
the date; `session:close` derives the subject from it).

## Blast radius

| File | Change | Size |
|---|---|---|
| `holonovel/src/core/audit-gate.ts` | new pure classifier + refusal text | M |
| `holonovel/src/core/badge-gate.ts` | deny-set rename/alias, `actionKey` export unchanged | S |
| `holonovel/src/core/state.ts` | `auditForbidden` cap predicate | S |
| `holonovel/src/core/index.ts` | barrel re-exports | S |
| `holonovel/src/index.ts` | dispatcher preflight, wrapper rollback, compaction confirm, `set_badge`, `open_session` | M |
| `holonovel/DECISIONS.md` | one prose paragraph beside the gate table | S |
| `spec/02-requirements.md` | REQ-447, REQ-066b, REQ-448 clauses | S |
| `spec/appendices-reference.md` | T785/T786 rows; T9/T533 amended | S |
| `spec/audit/review-register.md` | 2 resolved rows | S |
| `spec/audit/req-coverage.md` | regenerated | S |
| `ROADMAP.md` | section removed | S |
| `CHANGELOG.md` | dated entry | S |
| `holonovel/scripts/test-security.ts` | T533 extended, T785/T786 added, classifier units | M |
| `holonovel/scripts/test-backfill.ts` | only if T9 needs a Novel-active precondition | S |
| `scripts/lib/contract-fingerprints` output (`holonovel/src/generated/contract-fingerprints.ts`) | regenerated for REQ-448's §5.19 edit | S |
| `holonovel/scripts/lib/holosuite-*.ts` | anchor repoints after `index.ts` shifts | S |
| `docs/plans/2026-11-14-audit-durability-badge-truth/` | plan, tasks, AAR, cold review | S |

Verify-no-change: `holonovel/tool-definitions.json` (no description or schema
edit, D6), `holonovel/tool-surface-registry.json`, `spec/audit/tool-surface-baseline.json`,
`docs/engine-contract.md`, reference package content. `contract-fingerprints.ts`
**does** change (REQ-448 is in fingerprinted §5.19).

## Dependency order

1. **Enumerate before asserting** (`/tmp/opencode/probe-audit-gate.ts`, scratch
   `TTRPG_DATA_DIR`). (a) Re-run the two reproductions above and record the
   exact envelopes. (b) Superset check: for every registry action with
   `mutation_class: "read"`, grep its handler block for `audit(`, `recordEvent`,
   `saveNovel`; every hit must be in `MUTATING_READ_ACTIONS` — record any new
   one. (c) Inverse check: no key in the set is classed other than `read`.
   (d) Enumeration of save-before-audit sites and of handler paths that append
   two entries in one call (grep + the `[session-boundary]` marker). (e) Badge
   call sites: list every `holonovel/scripts/**` `set_badge` invocation whose
   process has no active Novel, and record the fix (create/resume first, or
   assert the new refusal). (f) Grep for `_Check:_` citations of REQ-030,
   REQ-040a, REQ-040c, REQ-066b, REQ-447, REQ-448 across `spec/` and
   `holonovel/scripts/` and record every assertion the change could disturb
   (T9, T533, T158, T534, T349, T536). (g) Confirm the capture round-trip:
   `novelToJSON` → `novelFromJSON` → `applyNovelState(..., "replace")` reproduces
   the Novel (including `audit_log`), and record that `"replace"` preserves
   `undo_stacks`/`redo_stacks` so C2 must reassign them from the capture.
   No assertion before this probe.

2. C1 red: classifier unit tests fail on the missing module.
3. C2: preflight; T533's new leg now fails for the right reason (state hash
   unchanged once the rollback lands); then the rollback wrapper; T786 red →
   green.
4. C3: `auditForbidden` and the compaction confirmation; T533's compaction leg.
5. C4: `set_badge` and `open_session`; T785 red → green; then run
   `test-security`, `test-backfill`, `test-persistence`, `test-output-contracts`.
6. C5: spec edits, `npm run assemble`, re-measure the three bodies; then
   `npm run build-order` for the §5.19 fingerprint.
7. C6: full `npm --prefix holonovel run test:all`; repoint drifted Holosuite
   anchors and re-run.
8. C7: register rows → roadmap section removal → coverage register → changelog,
   recomputing each predicate at the current line.
9. `npm run assemble && npm run check:fast`; then `npm run session:close`.

## Edge cases and rollback

- **No active Novel.** `getBadge()` is `none`, no Novel to cap, the preflight
  is inert; `set_badge` refuses by D6. The two rules must not be confused: the
  capacity gate keys on `activeNovel`, the badge rule on its absence.
- **Registry absent or unreadable.** The classifier falls back to the
  registration annotation; when neither is available the gate is inert and the
  handler-local capacity throw remains (today's behaviour). A unit test pins the
  degraded path.
- **Action not in the registry.** Classified by annotation; an unannotated
  unknown name is treated as appending (fail-closed) but only when a Novel is
  active.
- **Cap raised mid-process.** `auditLogCapacity()` reads the env each call, so
  a raised cap re-enables appends without explicit state resets.
- **Compaction at capacity with nothing to archive.** C3 refuses before saving
  and names the raise-the-cap recovery; the pending workflow is cleared so the
  caller is not stuck in it.
- **Exempt call still throws.** A `compress_audit` confirmation that fails for
  another reason is outside the capacity path and keeps its own error handling.
- **Rollback after a partially applied multi-entity mutation.** The `"replace"`
  restore rewrites the whole Novel from the captured interchange JSON, so a
  half-applied mutation cannot survive; `undo_stacks`/`redo_stacks`/
  `checkpoints` are reassigned from the same capture, so the rollback does not
  leave a stale undo entry or drop history.
- **`set_badge` no-Novel in a harness.** Any harness that relied on the old
  success gets a create/resume step from step 1(e); the refusal is asserted, not
  papered over.
- **`src/index.ts` line shifts break Holosuite anchors.** `test:all` names each;
  repoint and verify the symbol on the new line.
- Rollback: one `git revert`; the only persisted-shape addition is none — the
  fix reads existing state, adds no field, and writes only the audit entries it
  restores or appends.

## Verification

| Bar | Command |
|---|---|
| 1, 4 | `npm --prefix holonovel run test-security` (T533 extended, T785, T786, classifier units, `auditForbidden` cap) |
| 2 | `npm --prefix holonovel run test-security` (T786) |
| 3 | `npm --prefix holonovel run test-security` (T533 compaction leg) |
| 5 | `npm --prefix holonovel run test-backfill` (T9), `test-persistence` (T158), `test-output-contracts` (T8, T349) |
| 1–5 | `npm --prefix holonovel run test:all` |
| 6 | `npm run assemble && npm run validate` (REQ shape, char/sentence limits) |
| 6 | `npm run build-order` (§5.19 fingerprint regeneration) |
| 7 | `npm run check-registers`, `npm run check-roadmap`, `npm run check-loop-artifacts` |
| 7 | `npm run validate -- --write-register` |
| 8 | `npm run assemble && npm run check:fast` → trailing `check:fast: PASS` |
| — | `npm run check-tool-surface`, `check-tool-definitions-sync` (expected no change) |

## User impact and commit order

Client-visible: at capacity a mutating call is refused before it runs and the
Novel on disk is untouched; the audit log never grows past
`TTRPG_AUDIT_MAX_ENTRIES`, including on boundary refusals; compaction remains
the recovery path it is advertised to be; `set_badge` with no Novel says so
instead of claiming a badge the server is not honouring. Editor and Game Master
behaviour below the cap is unchanged, and no parameter, restart, or persisted
shape changes.

One commit: `2026-11-14 — Trust-core audit durability and badge truth:
dispatcher capacity refusal before mutation, compaction escape, set_badge
no-Novel refusal`.

## Out of scope

The §5.1/§5.3/§5.5 citation-repair sections; harness test-ID label hygiene;
Holosuite anchor automation; the unscoped-surface review sweep; reordering the
other 105 save-before-audit sites (D1/D3 cover them generically); a registry
`appends_audit` field; prompt truncation (REQ-118/REQ-135).
