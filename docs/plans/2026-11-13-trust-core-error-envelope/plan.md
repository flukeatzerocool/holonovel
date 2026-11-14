# Plan — Trust-core error envelope (F-P1-1, F-P1-2, F-P1-3, F-P1-10, F-P1-11)

Status: draft v2 (cold-review blockers resolved; re-review pending) · Kind: planned · Depth: standard
Increment target: docs/plans/2026-11-13-trust-core-error-envelope/
Rollback cost: 1 (one wrapper insertion, one deleted SDK override, two REQ
edits, harness assertions, registers, roadmap, changelog; reversible in one
commit)
Evidence class: repo only
Trust boundary: repo premises below were read at HEAD `8edaa54`; runtime shapes
(SDK validation result, pacing on a converted refusal) are probed in a scratch
data directory at step 0 before any assertion is written.
Revision note: v1 (sha `07c9f84…`) failed its cold pass — `cold-review.md`
records three blockers and six majors; every one is resolved below and the
resolution is named in the change entry it touches. v2 (sha `bfb09cfd…`) passed
the diff re-review (`re-review.md`) with one Major and two Minors outstanding;
v3 amends only wording — done bar 4 and 6 no longer overclaim REQ-548c's badge
leg, D7/C7 name the remainder bullet's REQ tokens, and F-P1-16's predicate
names `index.ts:2280`. That is a condition-only amendment: no new file, gate,
or destructive step, so it is re-stamped and verified by build-review rather
than re-reviewed.

## 1. Objective

Take the top open ROADMAP section, *Trust-core contract remediation (P1)*
(`ROADMAP.md:15-34`), and execute its **first** bullet — error envelope
normalization — closing five `spec/audit/review-register.md` findings:

| Finding | Register | Promise |
|---|---|---|
| F-P1-1 | `review-register.md:2360-2367` | GM-only refusals are bare `[FORBIDDEN]` |
| F-P1-2 | `:2368-2372` | SDK `-32602` rewritten into a REQ-002 category |
| F-P1-3 | `:2373-2378` | `raw()` emits an undeclared `RAW` status |
| F-P1-10 | `:2411-2415` | structured errors omit valid values |
| F-P1-11 | `:2416-2420` | dispatcher refusals carry no structured result |

Three adjacent defects are **recorded, not fixed** here (C7): F-P1-14 (returned
`err()` results carry no `isError`), F-P1-15 (SDK parameter-validation results
carry no structured result), F-P1-16 (the ruleset lookup `Valid values:`
enumeration is not badge-filtered). F-P1-12 is already implemented and is
dispositioned here (D6).

**Done bar:**

1. A GM-only refusal under the Player badge returns a tool **result**
   (`isError: true`, no JSON-RPC `error`) whose text is
   `[ERROR] [FORBIDDEN] <body>` followed by exactly one standalone
   `Corrective action: <single sentence>` line and whose `structuredContent`
   carries `status: "ERROR"`, `category: "FORBIDDEN"`, `corrective_action`.
   Asserted under **T178** — the only assertion that exercises the thrown
   `requireGM` path (`test-backfill.ts:1443`). T534b keeps its existing audit
   leg unchanged and is *not* a red test for this change.
2. A structurally invalid argument returns the SDK's parameter-validation tool
   result — `isError: true`, SDK prose, **no** `[ERROR] [INVALID_INPUT]` and no
   other REQ-002 category string. A semantically invalid argument still
   returns text beginning `[ERROR] [INVALID_INPUT]`. Asserted under T180 (new).
3. No `RAW` status remains: every `structuredContent.status` the server emits
   is a member of `OK | NEED_INPUT | WARNING | PARTIAL | ERROR`. Asserted
   under T632.
4. A `[NOT_FOUND]` whose text enumerates `Valid values: …` carries the same
   list, in the same order and truncation, in `structuredContent.values`.
   Asserted under T634 on the host-native scene-type refusal
   (`index.ts:7603`). This proves the *mirror* only: the structured copy
   discloses nothing beyond the text, because both derive from one source
   string — and that ruleset-emitter source is not badge-filtered today, which
   is F-P1-16 (recorded, not fixed). REQ-548c's badge leg is therefore **not**
   claimed as exercised by this increment.
5. A dispatcher refusal (retired alias, ruleset scope, `surfaceGuard`) returns
   `isError: true` **and** `structuredContent` with `status`, `category`,
   `corrective_action`. Asserted under T180 on the retired-alias path
   (`resolve_fate` — probed: `[ERROR] [NOT_FOUND]`, `isError: true`,
   `structuredContent: null`); the ruleset-scope site shares the same code
   path.
6. `spec/audit/req-coverage.md` shows REQ-001b2, REQ-002b1, REQ-548a, REQ-548c
   evidenced (T180/T178/T632/T634) and is regenerated fresh. T634 evidences
   REQ-548c's category/action/values leg only — not its badge leg (F-P1-16).
7. F-P1-1/2/3/10/11/12 are `Resolved` with **current** predicates and a date;
   F-P1-14/15/16 are added under `Scheduled-roadmap`; F-S1 loses its
   REQ-001b2→T180 entry; `ROADMAP.md` bullet 1 is replaced by the remainder
   bullet (D7) and the citation-repair bullet drops REQ-001b2.
8. `npm run assemble && npm run check:fast` reports all fast gates passing with
   the trailing `check:fast: PASS`; `npm --prefix holonovel run test:all`
   green after anchor repoints; `check:registers`, `check:roadmap`,
   `check-loop-artifacts` pass.
9. One `npm run session:close` commit. Publication (push) is out of scope.

## 2. Premises (each read at HEAD `8edaa54`)

- `StateManager.requireGM/requirePlayer/requireNotObserver` throw
  `new Error("[FORBIDDEN] <body> Corrective action: <action>")` with the
  corrective action inline (`holonovel/src/core/state.ts:1213-1226`);
  `requireNovel` throws the same shape for `[STATE_CONFLICT]`
  (`state.ts:1228-1237`).
- The handler chain is `withForbiddenAudit(ensureStructured(handler), name)` at
  `holonovel/src/index.ts:289`. `withForbiddenAudit` audits a returned envelope
  on `structuredContent.category === "FORBIDDEN"` or a first-line marker
  (`core/server.ts:56-68`) and a thrown `[FORBIDDEN]` in its catch
  (`:70-75`) — the two branches cannot both fire for one call.
- `paced` (`index.ts:290-299`) bumps the pacing counter for every returned
  result; its comment states a refusal envelope still completes but a thrown
  error does not.
- `err()` emits `{content:[{text:"[ERROR] [CODE] …\nCorrective action: …"}],
  structuredContent}` and sets **no** `isError` (`index.ts:3200-3205`).
- A thrown handler error becomes a tool result with `isError: true` and the
  message as text: the SDK catches and routes through `createToolError`
  (`node_modules/@modelcontextprotocol/sdk/dist/esm/server/mcp.js:185-191`).
  The override at `index.ts:236-251` intercepts that call for validation
  messages and re-labels them `[ERROR] [INVALID_INPUT]`.
- `raw()` emits `structured("RAW", …)` (`index.ts:3358-3360`); 156 `raw(`
  call sites, many `raw(JSON.stringify(...))` (`:2349`, `:4444`, `:5093`).
  Harnesses `JSON.parse` that text (`test-character-creation.ts:239`,
  `test-engine-facade.ts:69`, `test-ruleset-surface-remediation.ts:157`), so
  prefixing the text is not available (D1).
- `structured()`'s vocabulary exists only as prose in `OUTPUT_SCHEMA`
  (`index.ts:257-262`); `RAW` is outside it and `ERROR` is not an Appendix O.2
  category.
- `guardToolCall` returns `{content, isError: true}` directly at
  `index.ts:1951` (retired alias), `:1959-1965` (ruleset scope), `:1969`
  (`surfaceGuard`); `GuardRefusal` is declared at `:1934`.
- The playtest classifier reads a compound envelope's most specific known code
  (`scripts/lib/playtest-lib.ts:30-43`), so `[ERROR] [FORBIDDEN]` classifies as
  a denial exactly as `[FORBIDDEN]` does today; its validation branch
  (`:65-78`) is independent of the override.
- Existing harness coverage: T178 `test-backfill.ts:1441-1450`; T534b
  `test-security.ts:173-191`; T632/T634 `test-lean-narrator.ts:80-91`; T8
  `test-output-contracts.ts:478-497`. T180 exists only as a catalogue row
  (`appendices-reference.md:1678`).
- `Valid values:` has exactly two emitters: the ruleset lookup
  (`index.ts:2282`, built from the raw package collection) and the scene-type
  guard (`index.ts:7603`, a static catalog).
- §5.1 feeds no contract fingerprint
  (`scripts/lib/contract-fingerprint.ts:27,37-38`).

## 3. Decisions

**D1 — machine-readable bodies keep verbatim text.** `raw()` will not prefix
its text; the status moves into the declared structured vocabulary. Rejected:
prefixing the JSON body (breaks every `JSON.parse` consumer and the Appendix
T.1 `json` format). Consequence: REQ-001 gets a body **and acceptance-criterion**
clause (C5), since its AC separately demands a prefix on every response.

**D2 — declared status vocabulary.** `OK | NEED_INPUT | WARNING | PARTIAL |
ERROR`, with the Appendix O.2 category in `category` (today's `err()` shape,
which T634 reads). `raw()` classifies its text: a leading `[WARNING]`,
`[PARTIAL]`, `[NEED_INPUT]`, or `[ERROR]` token selects that status; anything
else is `OK`. Rejected: `status = category` (churns every consumer and T634 for
no contract gain).

**D3 — thrown-refusal conversion sits innermost.** `normalizeRefusal(handler)`
wraps `ensureStructured(handler)` inside `withForbiddenAudit`, so the audit
wrapper sees a returned refusal and audits through its existing returned-
envelope branch — exactly once (T534c invariant). Rejected: a try/catch inside
`withForbiddenAudit` (loosens the shared core helper).

**D4 — `isError: true` on converted and dispatcher refusals only.** A new
`refusalResult(code, msg, action)` = `{...err(...), isError: true}` serves
`normalizeRefusal` and `guardToolCall`. `err()` itself keeps today's shape.
Rejected: adding `isError` inside `err()` — that is a different, larger defect
(every returned error, F-P1-14), and REQ-001b1 compliance for returned errors
is scheduled rather than smuggled into this increment.

**D5 — pacing parity.** `paced` skips `bumpPacing` when the result carries
`isError` (`index.ts:290-299`), so a converted refusal counts exactly as a
thrown refusal did (it did not bump). Existing returned `err()` refusals keep
bumping, unchanged. Pacing is **not** observable through a tool surface (step 0
probe: `pacing_counter` persists only when autonomy fires, `index.ts:713`), so
parity is asserted by delta A1 — a T386c assertion in `test-narrative.ts` using
`TTRPG_PACING_WINDOW=3`: scene reset, two recaps (count 3, no signal), one
refusal must leave the briefing free of `[pacing]`, then a further recap
crosses the window. Rejected: reading the Novel file (counter is stale by
design until autonomy fires).

**D6 — F-P1-12 is already fixed.** `set_badge` records `{from: previous, to:
badge}` (`index.ts:3955`); T8 asserts both (`test-output-contracts.ts:489-490`).
The register row is stale: move it to `## Resolved` with the T8 predicate.

**D7 — ROADMAP bullet 1 is replaced, not re-scoped.** Bullets 2 and 3
(`ROADMAP.md:22-30`) already hold F-P1-5…F-P1-9 and F-P1-4/12/13, so
re-scoping bullet 1 to them would duplicate them. Bullet 1 becomes the
*error-envelope remainder* naming F-P1-14 (REQ-001b1), F-P1-15 (REQ-548c), and
F-P1-16 (REQ-002c1, REQ-445) — the three defects this increment records but
does not fix. `check-registers` requires every `Scheduled-roadmap` finding's
REQ tokens to appear in ROADMAP, so the bullet names those REQ IDs verbatim.
The section keeps three bullets and one `**Trigger:**` line (admission rule).

**D8 — spec home for the vocabulary.** REQ-001 (`:55-62`) gains the
machine-readable-body clause in the body **and** in the AC. REQ-548a
(`:70-73`) gains the *success* status list (`OK`, `NEED_INPUT`, `WARNING`,
`PARTIAL`) — it is scoped to "every successful tool response". REQ-548c
(`:78-80`) gains the error leg: `status: "ERROR"` with `category` naming the
REQ-002 category. Rejected: putting `ERROR` in REQ-548a (contradicts its scope,
per the cold pass).

**D9 — `values` mirrors the text.** `err()` extracts `Valid values: …` from the
expanded string into `values` (array, same order, same `…` truncation).
Rejected: a second enumeration per call site. Badge-filter fidelity is
structural (one source) — and the ruleset emitter at `:2282` is not
badge-filtered today, which is F-P1-16.

## 4. Change entries

**C1 (M) — convert thrown refusals.** `index.ts`: `normalizeRefusal` beside
`ensureStructured` (~`:263`), composed at `:289`; parser matches
`^\[(?:ERROR\]\s*\[)?([A-Z_]+)\]`, splits the trailing
`\s*Corrective action:\s*([\s\S]+)$`, returns `refusalResult(...)`;
non-matching errors rethrow (their SDK tool-result shape stays).
`state.ts:1213-1226`: drop the inline `Corrective action:` tails so one
canonical shape exists. D4 covers `isError`; D5 covers pacing.

**C2 (S) — remove the SDK re-label.** Delete `index.ts:236-251`. The SDK's own
validation result stands (`isError: true`, no category). Its missing structured
result is F-P1-15, recorded in C7 — not claimed as fixed.

**C3 (S) — declared and classified status.** `index.ts:257-262`, `:3131`
(`structured`), `:3358` (`raw`): add `DECLARED_STATUSES` and
`classifyStatus(text)`; `raw()` calls it; `OUTPUT_SCHEMA` describes the
vocabulary.

**C4 (S) — structured values and dispatcher envelopes.** `err()`
(`index.ts:3200`) gains the `values` extraction (D9); `guardToolCall`
(`:1938-1971`, three refusal sites) returns `refusalResult(...)`; `GuardRefusal`
narrows to that return type. Categories: retired alias → `NOT_FOUND`, ruleset
scope and `surfaceGuard` → `INVALID_INPUT` / `STATE_CONFLICT` matching their
current bracketed text.

**C5 (S) — spec clarification.** Per D8: REQ-001 body + AC clause; REQ-548a
success statuses; REQ-548c error status. Pre-edit bodies (validator-relevant):
REQ-001 479 chars / 5 sentences, REQ-548a 615 / 5, REQ-548c 431 / 4; limits are
800 chars and 8 sentences, so each addition is capped at ~180 chars and 3
sentences. Re-measure with `npm run validate` after the edit.

**C6 (M) — harness assertions.** `test-output-contracts.ts`: T180 (structural
vs semantic parameter error — SDK shape, no category) and one dispatcher-
refusal assertion (`small` profile: `isError` + `structuredContent`).
`test-backfill.ts`: T178 gains the `[ERROR] [FORBIDDEN]` prefix, exactly-one-
standalone-line, and `structuredContent` legs. `test-security.ts`: T534b keeps
its audit legs; add nothing that passes pre-change. `test-lean-narrator.ts`:
T632 asserts `raw` status ∈ vocabulary; T634 asserts `values` mirrors the text
on the scene-type refusal. `test-narrative.ts` (delta A1): new T386c pacing-
parity assertion (D5) inside the existing `TTRPG_PACING_WINDOW=3` block
(`test-narrative.ts:858-895`).

**C7 (M) — registers, roadmap, changelog.** `review-register.md`: six rows to
`## Resolved` with **refreshed** predicates (each current `file:line`
recomputed in this step — the existing rows are stale by 100–1200 lines) and a
date; three new `Scheduled-roadmap` findings — F-P1-14 (REQ-001b1), F-P1-15
(REQ-548c), F-P1-16 (REQ-002c1, REQ-445) — each with a current predicate;
F-P1-16 cites `index.ts:2280` (the raw `pkg.model[collection]` enumeration) and
notes that the in-file comment at `:2274-2275` *claims* REQ-002c filtering, so
the row does not read as contradicting its own source. F-S1 drops its
REQ-001b2→T180 entry. `ROADMAP.md`: bullet 1 replaced (D7);
citation-repair bullet drops REQ-001b2. `spec/audit/req-coverage.md`
regenerated. `CHANGELOG.md` dated entry.

## 4a. Delta amendment A1 (post-probe, step 0)

Step 0 measured four shapes the plan had assumed; three confirm it, two change
it. Recorded here rather than re-reviewed, because standard depth's re-review
cap is reached — A1 is verified by `build-review` and the AAR.

- **Confirmed.** A thrown `requireGM` reaches the client as a tool *result*
  with `isError: true` and `structuredContent: null`, text
  `[FORBIDDEN] … Corrective action: …` inline. A structurally invalid argument
  is a tool result with `isError: true` and the override's
  `[ERROR] [INVALID_INPUT] MCP error -32602 …` text. A retired alias returns
  `[ERROR] [NOT_FOUND]`, `isError: true`, no structured result.
- **Changed (D5).** `pacing_counter` is not readable through any surface: it is
  assigned only when pacing autonomy fires (`index.ts:713`), and a probe of the
  Novel file before/after a refused call showed 0/0. Pacing parity is therefore
  asserted by a new **T386c** in `test-narrative.ts` inside the existing
  `TTRPG_PACING_WINDOW=3` block, not by a probe.
- **Changed (bar 5).** A `small`-profile call to `manage_adventure`,
  `manage_story`, or `manage_combat` returned a normal result rather than a
  group refusal, so bar 5 asserts the retired-alias dispatcher path (proven)
  instead of a `small`-profile one. The absent small-profile refusal is an
  observation, not this increment's contract (F-P1-7 is out of scope); it is
  recorded in the AAR.
- **Also observed.** Two live F-P1-3 instances: `manage_story (action: list)`
  and `manage_combat (action: status)` return `status: "RAW"`; T632 uses the
  former as its red case.

## 5. Blast radius

| File | Change | Size |
|---|---|---|
| `holonovel/src/index.ts` | `normalizeRefusal`, `refusalResult`, pacing guard, delete override, status vocabulary, `err()` values, `guardToolCall` envelope | M |
| `holonovel/src/core/state.ts` | three `require*` throws to a parseable shape | S |
| `spec/02-requirements.md` | REQ-001 body+AC, REQ-548a, REQ-548c | S |
| `spec/audit/review-register.md` | 6 resolved (predicates refreshed), 3 new, F-S1 amended | M |
| `spec/audit/req-coverage.md` | regenerated | S |
| `ROADMAP.md` | bullet 1 replaced, citation bullet amended | S |
| `CHANGELOG.md` | dated entry | S |
| `holonovel/scripts/test-output-contracts.ts` | T180 + dispatcher assertion | M |
| `holonovel/scripts/test-backfill.ts` | T178 extension | S |
| `holonovel/scripts/test-security.ts` | pacing audit assertion (optional, step 0 dependent) | S |
| `holonovel/scripts/test-lean-narrator.ts` | T632/T634 extension | S |
| `holonovel/scripts/test-narrative.ts` | delta A1: T386c pacing parity | S |
| `docs/plans/2026-11-13-trust-core-error-envelope/` | plan, tasks, cold review, AAR | S |
| `holonovel/scripts/lib/holosuite-*.ts` | anchor repoints if `src/index.ts` shifts | S |

Verify-no-change: `holonovel/tool-definitions.json`,
`holonovel/src/generated/contract-fingerprints.ts`,
`holonovel/DECISIONS.md` gate table.

## 6. Dependency order

1. **Probe (`/tmp/opencode/probe-envelope.ts`, scratch `TTRPG_DATA_DIR`).**
   Record: (a) GM-only refusal under Player — is it a result or a protocol
   error, and its `isError`/`structuredContent`; (b) a structurally invalid
   argument — same; (c) a `small`-profile dispatcher refusal; (d) the pacing
   counter before/after a refusal; (e) the exact scene-type `[NOT_FOUND]` text.
   No assertion before this probe.
2. C6 red — T178 and T180 must fail for the named reason; T632/T634 must fail
   on `RAW`/`values` (not merely be absent).
3. C1 → C2 → C3 → C4, running the four harnesses after each.
4. C5, then `npm run assemble`.
5. `npm --prefix holonovel run test:all` → repoint drifted anchors and re-run.
6. C7 registers → roadmap → coverage → changelog, recomputing each predicate.
7. Gates, then `session:close`.

## 7. Edge cases and rollback

- **Refusal body contains `Corrective action:` twice.** Split on the last
  occurrence.
- **`[STATE_CONFLICT]` from `requireNovel`.** Converts like any other; its body
  names available slugs.
- **A handler throws a non-category error.** Rethrown; the SDK returns it as a
  tool result with `isError: true` (probed at step 0), so the plan does not
  call that shape "protocol-level".
- **`isError` on a converted refusal changes a playtest disposition.**
  Classifier reads `[FORBIDDEN]` either way (`playtest-lib.ts:30-43`); asserted
  by `test:playtest` in step 5.
- **Pacing drift.** D5 makes a refusal behave as before; if the probe shows
  otherwise, the guard is corrected before the red run, not after.
- **Golden transcript (G2).** If Appendix B asserts the old
  `[ERROR] [INVALID_INPUT]` prose for a structural error, bump the fixture per
  REQ-277 — a named contingency, not an assumption.
- **`src/index.ts` line shifts break Holosuite anchors.** Re-run `test:all`,
  repoint each reported anchor, verify the symbol is on the new line.
- Rollback: one `git revert`; no persisted data shape changes.

## 8. Verification

| Bar | Command |
|---|---|
| 1, 5 | `npm --prefix holonovel run test:output-contracts`, `test:backfill`, `test:security` |
| 2 | `test:output-contracts` (T180) |
| 3, 4 | `test:lean-narrator`; `grep -rn '"RAW"' holonovel/src` → none |
| all | `npm --prefix holonovel run test:all` (includes playtest pacing) |
| spec/registers | `npm run assemble && npm run check:fast` |
| coverage | `npm run validate -- --write-register` |
| conformance | `npm run check:conformance` |

Spec-project checks: §5.1 feeds no declared fingerprint
(`contract-fingerprint.ts:27,37-38`); `check-fingerprint-sync` and
`check-tool-definitions-sync` run and are expected to be no-ops.

## 9. User impact and commit order

No restart contract, parameter, or data change. Visible: refused calls start
`[ERROR] [FORBIDDEN]` instead of `[FORBIDDEN]`, carry `isError: true` and a
structured result; structured errors carry `values`; a malformed argument
surfaces the SDK's own prose with no category. Pacing behaviour on a refusal is
unchanged (D5). One commit:
`2026-11-13 — trust-core error envelope: normalized refusals, declared
statuses, structured error values`.

## 10. Out of scope

F-P1-4…F-P1-9 and F-P1-13 (remaining ROADMAP bullets); F-P1-14/15/16
(recorded, scheduled); the §5.1/§5.5 citation repair section beyond the
REQ-001b2→T180 edit; the stale "eight categories" count in REQ-002 versus ten
Appendix O.2 rows (P3); `truncateOutput` byte measurement (F-P1-6).
