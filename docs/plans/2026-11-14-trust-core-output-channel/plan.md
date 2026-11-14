# Plan — Trust-core output channel (F-P1-5, F-P1-6)

Status: draft v3 (final; cold pass r1 and diff re-review r2 consumed at the
standard-depth cap — N1–N3 resolved as a condition-only amendment, verified by
`build-review`) · Kind: planned · Depth: standard
Increment target: docs/plans/2026-11-14-trust-core-output-channel/
Rollback cost: 1 (one helper, one resource resolver, two Sub-REQ edits, harness
assertions, registers, roadmap, changelog; reversible in one commit)
Evidence class: repo only
Revision note: v1 was self-reviewed; its cold pass (`ses_e25704d79ffem5kHAyH4RppyxJ`,
stages 4/5) returned 1 Blocker, 3 Majors, and 3 Minors. v2 resolves each: the
second store reader (`contextSectionTexts`) joins C2, the done bar, the blast
radius, and the assertions (B1); T221's rewrite is mandatory, deletion removed
(M2); the structured mirror and the ledger read gain assertions (M3); T0 gains a
default-limit payload sweep so the universal-channel assumption is confirmed
before execution (M4); body counts now name their extraction method (m5); the
title-token rationale is corrected (m6); and the preflight sidecar is
regenerated before the stamp (m7). The diff re-review then returned one new
Blocker and two Minors (`cold-review.md`): the ledger assertion named a
nonexistent `manage_context (action: report)` — the action is `context_report` on `manage_diagnostics`
(`index.ts:11404`) — plus a stale blast-radius option and an off-by-two line
reference. All three are corrected in v3; `build-review` verifies them as
conditions C-1–C-3. Execution (T0–T1, C1) then surfaced a real contract
collision the review could not see: `spec_health` is a ~47 KB single JSON
document, over the 32,000-byte default, so an unconditional channel invalidated
every `JSON.parse` consumer (20+ harness assertions). v4 adds D10 (a
machine-readable JSON document body is delivered intact), D11 (prose T13
fixtures), **REQ-180c** as the written exception, and the corresponding done-bar,
C1, C3, and edge-case amendments. It is a delta amendment reviewed and re-stamped
after the first edit.
Trust boundary: every premise below is read from the working tree at HEAD
`f175b26`; the three runtime shapes (a truncated result under a low limit, a
cross-badge pointer read, an evicted pointer read) are probed in a scratch data
directory at step 0 before any assertion is written.

## Questions

1. Which roadmap item is next? The top section is *Trust-core contract
   remediation (P1)* (`ROADMAP.md:15-33`). Bullet 1 (ruleset search badge
   filtering, F-P1-17) is the newest addition and unused; bullets 2 (output and
   authorization, F-P1-5…F-P1-9) and 3 (audit durability and badge truth,
   F-P1-4/F-P1-12/F-P1-13) are open. This plan takes the first open bullet's
   **output half** and splits the authorization half out (D1).
2. Is the output half one increment? Yes: both findings are the same mechanism
   — the tool-result channel and the `output://` store — and both are client-
   visible disclosure defects. The authorization half needs a new per-action
   read-only classification for Observer (D1) and does not belong in the same
   commit.

## Objective

Take the output half of `ROADMAP.md` § *Trust-core contract remediation (P1)*
bullet 2 and close:

| Finding | Register | Promise |
|---|---|---|
| F-P1-5 | `review-register.md:2444-2449` | `output://` payloads are not badge-filtered |
| F-P1-6 | `review-register.md:2450-2454` | truncation covers four ruleset surfaces only and measures UTF-16 length |

Both are recorded as `Scheduled-roadmap` under that section and cite the
predicate they rest on; neither is derived from a gate message (no gate asserts
these contracts — that is the finding).

**Done bar:**

1. Every tool result passes one channel: when the joined text content exceeds
   `TTRPG_OUTPUT_LIMIT` (**measured in UTF-8 bytes**, default 32000), the
   channel stores the full text under `output://<registered-tool>/<counter>` and
   returns the pointer text with `structuredContent.text` mirroring the pointer.
   A result whose text is one machine-readable JSON document is delivered intact
   (REQ-180c, D10). The six per-surface `truncateOutput` call sites are gone.
   Asserted by T13 at a character count below the limit and a byte count above
   it, plus a leg that `manage_diagnostics (action: health)` stays parseable
   JSON (C1).
2. Each stored payload records its producing badge, and **every** store reader
   applies one rule: a payload is returned only when the reader's active badge
   equals the producing badge, or when the reader is the Editor badge (`none`).
   The `output://` resource returns `[ERROR] [NOT_FOUND]` for any other badge
   (identical to an evicted or never-existent payload — no existence
   disclosure, REQ-445's convention), and the context ledger's
   `last_tool_output` section carries the newest payload visible to the reader,
   or an empty section when none is. Asserted by T13 under Player, Game Master,
   and Editor (C2).
3. An evicted or unknown pointer returns `[ERROR] [NOT_FOUND]` Markdown naming
   eviction, not the current bare `{"error":"not found"}` JSON (REQ-179b).
   Asserted by T13 with `TTRPG_OUTPUT_SESSION_LIMIT=1` (C2).
4. The enabling contract is written down as new **REQ-179c** (the read rule for
   every store reader), with its Appendix REQ index row and `_Check:_ T13`; the
   §5 section map's §5.1 row already lists base `179`, so no map edit follows.
   Bodies re-measured to ≤800 chars and ≤8 sentences (C4).
5. F-P1-5/F-P1-6 are `Resolved` with predicates recomputed at the post-change
   line and T13 named; the ROADMAP bullet is rewritten to the authorization
   remainder (F-P1-7/F-P1-8/F-P1-9 only); the stale `F-P1-12` reference in
   bullet 3 is dropped (it is `Resolved` at `review-register.md:55-58`); the
   coverage register is regenerated (C5).
6. `npm --prefix holonovel run test:all` is green after anchor repoints;
   `npm run assemble && npm run check:fast` reports the trailing
   `check:fast: PASS`; `check-registers`, `check-roadmap`, and
   `check-loop-artifacts` pass.
7. One `npm run session:close` commit. Publication is out of scope.

## Premises (each read at HEAD `f175b26`)

**Channel.**

- The handler chain is `withForbiddenAudit(normalizeRefusal(ensureStructured(
  handler)))`, wrapped in `paced` (`holonovel/src/index.ts:303-318`).
  `ensureStructured` derives `structuredContent.text` from `content[].text` and
  skips when `structuredContent` is already present
  (`index.ts:255-264`).
- Truncation exists only as a call-site helper: `truncateOutput(tool, text)`
  (`index.ts:3486-3496`) compares `text.length`, stores under
  `${tool}/${counter}` in the module-level `outputStore`, and evicts past
  `TTRPG_OUTPUT_SESSION_LIMIT` (default 20, `:3484`). The limit is
  `TTRPG_OUTPUT_LIMIT`, default 32000 (`:3483`).
- Its six call sites are four ruleset surfaces:
  `index.ts:2322` (lookup success), `:2345` (`search`), `:2427` (`info`),
  and `:13678`, `:13681`, `:13684` (`manage_ruleset (action: search)`). The
  package `search` kind at `:2345` and the host `search_rules` at `:13678`
  produce every payload long enough to truncate in practice.
- Two of those sites key the payload `search_rules` (`:13678`, `:13681`,
  `:13684`), which is not a registered tool name — REQ-179a requires
  `{tool_name}` to match the producing tool's registered name. The channel
  fixes this by keying on the name the registration closure already holds.
- Package tools register through the same overridden `server.registerTool`
  (`index.ts:2446-2470`, override installed at `:303`), so the channel covers
  them without a second path.
- REQ-004 states the 32000-byte acceptance criterion and that `output://`
  payloads are session-local, badge-filtered, and evict oldest-first
  (`spec/02-requirements.md:124-133` — body 645 chars / 7 sentences excluding
  its `_Check:_` line). REQ-180b makes the byte threshold authoritative
  (`:1362-1365`, 399 / 3). Counts measured by extracting each body from its
  `**REQ-N — …**` header to the next header and dropping the `_Check:_` line.

**Store readers (two, not one).**

- `outputStore` is read by the pointer resource (below) **and** by
  `contextSectionTexts()`, which selects `[...outputStore.keys()].at(-1)` and
  writes `outputStore.get(lastOutputKey) ?? ""` into the `last_tool_output`
  section of the REQ-606 context ledger (`index.ts:1643-1674`, assignment at
  `:1673`). The function declares `Record<string, string>`, so retyping the
  store without updating it breaks `npm run typecheck` (a `check:fast` gate), and
  the read applies no badge predicate today — the same leak class as F-P1-5.

**Output pointer resource.**

- `outputStore` is `Map<string, string>` (`index.ts:15505`); the resolver at
  `:15506-15512` keys by `uri.href.replace("output://","")`, returns the raw
  text as `text/markdown` with no badge check, and returns
  `{"error":"not found"}` as `application/json` when the key is absent.
- REQ-179a says the read is "badge-filtered per REQ-032" but states no rule for
  a payload produced under one badge and read under another
  (`02-requirements.md:145-147`, 589 / 5). REQ-179b requires an evicted read to
  return `[ERROR] [NOT_FOUND]` with an eviction message
  (`:148-150`, 525 / 3) — the current JSON body does not.
- The resource is registered with `{ list: undefined }` on its
  `ResourceTemplate`, so it appears in `resources/templates/list` but not as a
  listed resource. Unchanged by this increment.

**Existing assertions.**

- T13 drives truncation with `TTRPG_OUTPUT_LIMIT=100`, extracts
  `output://search_rules/<n>` from the hit text, and reads the pointer under the
  Game Master badge (`holonovel/scripts/test-output-contracts.ts:259-274`). It
  asserts no badge rule and no eviction.
- T221 in `test-backfill.ts:209-218` reads `output://create_room/1` without ever
  producing a truncated payload; the read succeeds with a "not found" JSON body
  that the assertion never inspects, so the row is vacuous.
- Appendix F's T13 row already promises "payload badge filtering (REQ-032),
  session isolation, oldest-first eviction" (`appendices-reference.md:1444`);
  the harness catches up to the catalogue, so the row needs only the REQ-179c
  token added. T221's row (`:1690`) already promises the full behaviour.
- No harness asserts `structuredContent.text` (`grep -rn
  "structuredContent.text" holonovel/scripts` is empty); the only consumers of
  tool text read `content[].text`.

**Spec-project mechanics.**

- §5.1 (`### 5.1 Output and Error Contracts`) is not a fingerprinted section
  (`scripts/lib/contract-fingerprint.ts:27-38` lists §5.16/§5.17/§6.3/§6.4.2 and
  §5.6/§5.9/§5.19), so no fingerprint regeneration follows.
- The §5 section map's §5.1 row lists REQ base `179` among its identifiers
  (`spec/02-requirements.md:9`), so a new REQ-179c is covered by the family row
  and needs no map edit; the §5.2 REQ coverage map covers §5.2 only.
- A new §5.1 sub-REQ needs no §5.2 map row, but it does need an Appendix REQ
  index row and a `_Check:_` binding, or the implementation-coverage audit
  reports it as an unbound server-runtime REQ.
- The Appendix REQ index lists REQ-179a/179b at
  `spec/appendices-reference.md:122-123`.
- `check:fast` is green at HEAD: `41 passed, 0 failed`, trailing
  `check:fast: PASS` (run at the start of this session).

## Decisions

**D1 — this increment is the output channel; authorization is the next one.**
Bullet 2 bundles output (F-P1-5, F-P1-6) with authorization (F-P1-7/F-P1-8/
F-P1-9). The authorization half is not a mechanical fix: REQ-032a permits
Observer on `manage_context (action: discover)` and `manage_character (action:
sheet)` — tools the annotation table marks `MUTATING` (`index.ts:193`, `:214`) —
so an Observer `tools/list` subset and a dispatcher badge gate both need a new
per-action read-only classification, plus a decision about where the gate sits
relative to `withForbiddenAudit` (REQ-133 boundary audit). That is its own
increment with its own contract addition. Present-day authorization is 142
handler-local `requireGM()` call sites (`grep -c 'requireGM()'
holonovel/src/index.ts`), not one gate. Rejected: taking all five findings in
one commit (>300 changed lines, and a gate that touches every tool call alongside
a disclosure fix in the same review surface).

**D2 — truncation lives in the registration chain, not at call sites.**
`truncateResult(name, result)` wraps the handler inside `ensureStructured`
(`ensureStructured(truncateResult(name, handler))`), so it sees the result before
`structuredContent` is derived and covers host and package tools alike. The six
call sites collapse to the channel. Rejected: adding `truncateOutput` calls to
the ~40 registered tools (the same defect returns with the next tool); truncating
in `paced` after `ensureStructured` (the structured mirror would keep the full
text, so the pointer would not be the only copy).

**D3 — bytes, and the structured mirror is the pointer.** The channel measures
`Buffer.byteLength(joinedText, "utf8")`, stores the full joined text, and sets
both `content` (one text item) and `structuredContent.text` to the pointer
string, preserving other structured fields. Rejected: leaving `text.length`
(REQ-180b makes bytes authoritative and CJK/emoji payloads truncate late);
mirroring the full text into `structuredContent` (defeats the truncation
boundary and doubles the result size).

**D10 — a machine-readable JSON document body is delivered intact.** The
channel skips a result whose joined text is one JSON document (`JSON.parse`
succeeds after trimming). Reason from execution: `manage_diagnostics (action:
health)` returns a ~47 KB JSON document, over the 32,000-byte default, so an
unconditional channel replaced it with a pointer and invalidated every
`JSON.parse` consumer (20+ harness assertions failed with `Unexpected token
'…'`). REQ-548a/REQ-001 declare machine-readable bodies as JSON that clients
parse; truncating one produces invalid JSON, so the pointer mechanism applies to
human-readable text and to JSON-plus-source-block payloads (ruleset lookups),
which are not a single document. Rejected: raising the limit (spec-pinned at
32,000 bytes); exempting by tool name (a surface list is the defect this
increment removes); emitting an enveloped pointer for JSON (still unparseable).

**D11 — T13's channel fixtures are prose, not health.** Because health is
exempt (D10), T13 produces its pointers from `manage_note (action: list)` with
several shared notes; health is asserted to stay parseable JSON at the default
limit instead.

**D4 — badge visibility is exact-match plus Editor, applied at every reader.**
A payload records `getBadge()` at production. A read is allowed when the
reader's active badge equals the producer, or is `none` (Editor, full access per
REQ-031a). Both readers route through one accessor: the `output://` resolver
returns the text or the non-disclosing NOT_FOUND, and `contextSectionTexts`
selects the newest **visible** payload (empty when none is visible), which also
keeps its `Record<string, string>` return type. Rejected: a second, weaker
rule for the ledger (it is the same store); returning the newest payload
regardless of badge and filtering only afterwards (the Player would learn a
payload exists); badge-less storage (that is the defect).

**D5 — one non-disclosing NOT_FOUND for three cases.** Badge-denied, evicted,
and never-existent reads return the same `[ERROR] [NOT_FOUND]` Markdown text
naming eviction as the likely cause and `set_badge` as the corrective action.
REQ-179b's eviction message is thereby satisfied, and REQ-445's no-disclosure
convention covers the badge case without a second message. Rejected: a distinct
"wrong badge" message (confirms the payload exists under another badge, which is
exactly the side channel this increment closes).

**D6 — same-session, cross-Novel reads stay permitted for the same badge.**
REQ-004/REQ-179a define the store as session-local and badge-filtered, not
Novel-scoped; a Player in Novel B reading a Player payload from Novel A is not a
badge breach. Recorded as a P3 observation in the AAR, not a new finding — no
demonstrated failure and no REQ that names Novel scope. Rejected: adding a
Novel key to the store (unrequested contract surface, and it would strand
payloads across `manage_novel (action: switch)`).

**D7 — REQ-179c is a new sub-REQ, not an amendment to REQ-179a.** REQ-179a is at
589 chars / 5 sentences; the read rule is ~200 chars, which would land it at
the 800-char cap and add a sentence. A sub-REQ keeps each body inside Appendix
M's limits and matches the REQ-210c precedent. Rejected: stretching REQ-179b
(the rule is not an acceptance criterion for eviction).

**D8 — the roadmap bullet keeps its section and loses only what shipped.**
Bullet 2 becomes the authorization remainder naming F-P1-7/F-P1-8/F-P1-9 and
their REQ tokens; bullet 3 drops the `F-P1-12` reference (already `Resolved`).
The section stays at 3 bullets, so `check-roadmap`'s admission rule holds, and
the `**Trigger:**` line is unchanged.

## Change entries

**C1 (M) — the output channel.** Replace `truncateOutput` (`index.ts:3486-3496`)
with `truncateResult(tool, result)`: compute the joined text of `content` items
whose `type` is `"text"` (or that carry a string `text`); return unchanged when
`Buffer.byteLength(joined, "utf8") <= outputLimit()` **or when `joined` parses
as one JSON document** (D10); otherwise store the joined text with its producer
badge, evict past `outputSessionLimit()`, and return the result with `content`
replaced by one text item holding the pointer text and `structuredContent.text`
(when present) set to the same pointer. Insert it in the registration chain as
`ensureStructured(truncateHandler(name, handler))` (`index.ts:303-318`) and
delete the six call sites (`:2322`, `:2345`, `:2427`, `:13711`, `:13714`,
`:13717`). Keep the pointer text byte-identical to today's
(`… [truncated — full content: output://<tool>/<counter>]`), refresh the
REQ-004 comment block, and record in it that the key is the registered tool
name.

**C2 (M) — the badge-aware store, one accessor, two readers.**
`outputStore` becomes a map of `{ text, badge }`. Add
`readOutputPayload(key): string | undefined` (visible iff `entry.badge ===
getBadge()` or `getBadge() === "none"`). The resolver
(`index.ts:15506-15512`) uses it and returns `[ERROR] [NOT_FOUND]` Markdown (D5)
for absent, evicted, and denied alike; `mimeType` for the error body becomes
`text/markdown`. `contextSectionTexts` (`index.ts:1643-1674`) selects the newest
key whose payload is visible and returns its text, so `last_tool_output` is
`""` when nothing is visible and the function still returns
`Record<string, string>`. No template change.

**C3 (M) — harness assertions.** `test-output-contracts.ts` T13
(`:259-274`): update the key to the registered tool name; update the title so it
carries REQ-179c/REQ-180c; add (a) a byte-vs-char case — boot with
`TTRPG_OUTPUT_LIMIT` set so a multi-byte prose payload (60 CJK characters) is
under the character count and over the byte count; (b) the cross-badge rule —
produce under Game Master, `set_badge(player)` → read returns
`[ERROR] [NOT_FOUND]`, `set_badge(none)` → read returns the full content;
(c) eviction — boot with `TTRPG_OUTPUT_SESSION_LIMIT=1`, produce two payloads,
the first read returns `[ERROR] [NOT_FOUND]` with an eviction message; (d) the
structured mirror — for an enveloped handler result, `structuredContent.text`
equals the pointer and does not contain the payload body; (e) the ledger read —
after a Game Master payload, `manage_diagnostics (action: context_report)` under
Player does not carry the payload text in `last_tool_output`, while Editor does;
(f) the JSON exemption — `manage_diagnostics (action: health)` at the default
limit still parses as JSON (D10). Channel fixtures are prose
(`manage_note (action: list)` over several shared notes), not health (D11).
`test-backfill.ts` T221 (`:209-218`): **rewrite** the vacuous
`output://create_room/1` read as a real produce-then-read under a low
`TTRPG_OUTPUT_LIMIT` (REQ-179b binds `_Check:_ T221`; deleting the assertion
would orphan that evidence — not an option).

**C4 (S) — spec contract.** Add **REQ-179c** after REQ-179b
(`spec/02-requirements.md:150`): a payload is readable only under the badge that
produced it or the Editor badge; every other reader gets the same
`[ERROR] [NOT_FOUND]` response as an evicted payload; the rule binds every
surface that reads a stored payload (the `output://` resource and the context
ledger's `last_tool_output`); payloads remain session-local. Add **REQ-180c**
beside REQ-180b (`:1362-1365`): the channel truncates human-readable text; a
result whose text is one machine-readable JSON document (REQ-548a) is delivered
intact (D10). **Amend REQ-004's first sentence** (`:124`) to "truncates
human-readable output … ; a result whose text is one machine-readable JSON
document is delivered intact (REQ-180c)" so the exception is referenced by the
rule it excepts, not left in conflict with it. Both new REQs' `_Check:_` lines
bind **T13**, and T13's harness title gains
the REQ-179c token (self-documenting — the coverage audit already resolves T13
from the prefix's cited IDs). Add the Appendix REQ index rows after
`spec/appendices-reference.md:123` and beside the REQ-180 rows, and add REQ-179c
and REQ-180c to T13's row (`:1444`) beside REQ-004/REQ-032. Measure every new
and edited body (≤800 chars, ≤8 sentences) and record the values in the AAR;
apply Appendix M's checklist. The §5 section map rows for §5.1 and §5.5 already
list bases `179` and `180` (`:9`, `:13`) — no map edit. No behavioral-config
row follows (the two knobs predate this increment), and §5.1/§5.5 feed no
fingerprint.

**C5 (S) — registers, roadmap, coverage, changelog.**
`spec/audit/review-register.md`: F-P1-5/F-P1-6 → `Resolved` with predicates
recomputed at the post-change line and T13 named; note the REQ-179a
`search_rules` key defect and the REQ-179b eviction-message defect as closed
within F-P1-5's scope. `ROADMAP.md`: rewrite bullet 2 to the authorization
remainder (D8); drop `F-P1-12` from bullet 3. Regenerate
`spec/audit/req-coverage.md`. Add the `CHANGELOG.md` dated entry
`2026-11-14 — trust-core output channel: byte-accurate truncation on every tool
result, badge-scoped output:// payloads`.

## Blast radius

| File | Change | Size |
|---|---|---|
| `holonovel/src/index.ts` | channel helper, registration chain, 6 call sites deleted, badge-aware store + accessor, resolver, ledger reader, comments | M |
| `spec/02-requirements.md` | new REQ-179c and REQ-180c; REQ-004 sentence 1 references REQ-180c | S |
| `spec/appendices-reference.md` | REQ index rows; T13 row gains REQ-179c/REQ-180c | S |
| `spec/audit/review-register.md` | 2 resolved rows, predicates refreshed | S |
| `spec/audit/req-coverage.md` | regenerated | S |
| `ROADMAP.md` | bullet 2 rewritten, bullet 3 trimmed | S |
| `CHANGELOG.md` | dated entry | S |
| `holonovel/scripts/test-output-contracts.ts` | T13 extended (byte case, badge rule, eviction) | M |
| `holonovel/scripts/test-backfill.ts` | T221 rewritten to a real produce-then-read | S |
| `docs/plans/2026-11-14-trust-core-output-channel/` | plan, tasks, cold review, AAR | S |
| `holonovel/scripts/lib/holosuite-*.ts` | anchor repoints if `src/index.ts` shifts | S |

Verify-no-change: `holonovel/tool-definitions.json` (no schema or parameter
change), `holonovel/src/generated/contract-fingerprints.ts` (§5.1 is not
fingerprinted), `holonovel/DECISIONS.md` gate table, `docs/engine-contract.md`
(no `output://` or truncation clause), reference package content.

## Dependency order

1. **Probe** (`/tmp/opencode/probe-output-channel.ts`, scratch
   `TTRPG_DATA_DIR`): (a) truncate under `TTRPG_OUTPUT_LIMIT=100` and read the
   pointer; (b) produce under Game Master, `set_badge(player)`, read the same
   pointer — confirm today's leak; (c) `TTRPG_OUTPUT_SESSION_LIMIT=1`, produce
   two payloads, read the first — record the current JSON body; (d) produce a
   Game Master payload, `set_badge(player)`, run `manage_diagnostics (action: context_report)` — record whether `last_tool_output` carries it; (e) a 60-CJK
   payload under a limit between its character and byte counts. Then run the
   unchanged suite once at default limits and record every tool result above
   32,000 bytes — recorded at execution: `manage_diagnostics (action: health)`
   is ~47 KB and is the only one; it is a single JSON document, which D10
   exempts. No assertion before this probe.
2. C3 red: T13 fails on the byte case, the cross-badge read, the eviction
   message, the structured mirror, and the ledger read; T221 as rewritten fails
   or is shown vacuous.
3. C1 (channel) → C2 (store and resolver), running
   `npm --prefix holonovel run test:output-contracts` and
   `test:backfill` after each.
4. C4, then `npm run assemble`; re-measure REQ-179c and the edited rows.
5. `npm --prefix holonovel run test:all`; repoint drifted anchors and re-run.
6. C5: registers → roadmap → coverage → changelog, recomputing each predicate
   at the current line.
7. `npm run assemble && npm run check:fast`, then `npm run session:close`.

## Edge cases and rollback

- **A result with no `content` (SDK structural failure).** The channel passes
  it through unchanged; `-32602` results are never long.
- **A result whose text is already a pointer.** `TTRPG_OUTPUT_LIMIT` comparisons
  see a short string and the channel is a no-op, so no double wrapping.
- **A result over the limit with non-text items.** Non-text items are preserved
  and only the text items collapse into the pointer; no shipped tool returns
  mixed content today (the probe records what it sees).
- **A badge switch hides the newest payload from the ledger.** `last_tool_output`
  falls back to the newest payload visible to the active badge, or to an empty
  section when none is visible; the ledger never errors (REQ-606's ledger is
  side-effect-free and must not fail a read).
- **A `structuredContent` carrying fields derived from the full text.** Only
  `text` is replaced; other fields stay. A consumer that needs the full body
  follows the pointer (REQ-179a).
- **T13's low `TTRPG_OUTPUT_LIMIT=100` now truncates every call in that
  process.** The pointer counter advances per call and the session store holds
  20 entries; the test reads the last pointer. If an earlier assertion needs its
  own untruncated text, that assertion moves to its own boot.
- **A Player pointer read after a badge switch back to Game Master.** Allowed by
  exact match (D4); the payload was produced under Game Master, so the GM read
  is the producing badge — no special case.
- **An over-limit machine-readable JSON body.** Delivered intact (D10); the
  channel's `JSON.parse` probe decides, so a JSON document with a trailing
  source block (ruleset lookup) still truncates and a bare document does not.
- **An over-limit error result.** `err()` and `raw()` set `structuredContent`
  before the channel runs, so `status`/`category` survive truncation; a handler
  returning a bare over-limit error string would have its status re-derived from
  the pointer, so the probe records whether any handler does that. If one is
  found, the channel keeps the first line and truncates the remainder.
- **`reloadPackagePrompts`/package tools.** They register through the same
  override, so no second channel is needed; if the probe shows a package tool
  registered before the override is installed, the channel moves to
  `toolRegistry.define` instead (recorded as an amendment).
- **`src/index.ts` line shifts break Holosuite anchors.** `test:all` names each;
  repoint and verify the symbol on the new line.
- Rollback: one `git revert`; no persisted data shape changes (the store is
  session-local).

## Verification

| Bar | Command |
|---|---|
| 1, 2, 3 | `npm --prefix holonovel run test:output-contracts` (T13: byte case, badge rule, eviction, structured mirror, ledger read) |
| 2 | `npm run typecheck` (the ledger's `Record<string, string>` return survives the store retype) |
| 2, 3 | `npm --prefix holonovel run test:backfill` (T221) |
| 1–3 | `npm --prefix holonovel run test:all` |
| 4 | `npm run assemble && npm run validate` (REQ shape, char/sentence limits) |
| 5 | `npm run check-registers`, `npm run check-roadmap`, `npm run check-loop-artifacts` |
| 5 | `npm run validate -- --write-register` |
| 6 | `npm run assemble && npm run check:fast` → trailing `check:fast: PASS` |
| — | `npm run check:conformance` (expected no change) |

## User impact and commit order

Client-visible: truncation now applies to every human-readable tool result and
measures bytes, so prose output over 32,000 UTF-8 bytes becomes a pointer
(previously only ruleset lookups and searches did); a result that is one
machine-readable JSON document is delivered intact (REQ-180c),
so clients that parse `spec_health` are unaffected; `output://` payloads are
readable only under
the badge that produced them or the Editor badge, and an evicted or denied
pointer returns `[ERROR] [NOT_FOUND]` Markdown instead of a JSON error body;
the context report's `last_tool_output` shows only a payload the reader's badge
may see; the pointer's tool segment is the registered tool name. No restart,
parameter, or persisted-data change. The authorization half of the roadmap
bullet
(dispatcher badge gate, Observer read-only `tools/list`, filtered
`prompts/list`/`resources/list`) remains open.

One commit:
`2026-11-14 — trust-core output channel: byte-accurate truncation on every tool
result, badge-scoped output:// payloads`.

## Out of scope

F-P1-4 and F-P1-13 (audit durability and `set_badge` without a Novel);
F-P1-7/F-P1-8/F-P1-9 (dispatcher badge gate, Observer read-only subset,
`prompts/list`/`resources/list` filtering) — next increment; F-P1-17
(index-backed ruleset search); the §5.1/§5.3/§5.5 citation-repair sections;
prompt truncation (REQ-118/REQ-135, a separate mechanism); Novel-scoped pointer
storage (D6); `resources/list` entry listing for the pointer template.
