# Plan — Trust-core error-envelope remainder (F-P1-14, F-P1-15, F-P1-16)

Status: draft v4 (cold pass and diff re-review passed; N1–N4 resolved by
condition-only amendment) · Kind: planned · Depth: standard
Increment target: docs/plans/2026-11-14-trust-core-envelope-remainder/
Rollback cost: 1 (helper edits, one spec sub-REQ, harness assertions, registers,
roadmap, changelog; reversible in one commit)
Evidence class: repo only
Trust boundary: every premise below is read from the working tree at HEAD
`bb9941c`; the three runtime shapes (returned `err()` envelope, SDK structural
result, synthetic-package lookup under Player) are probed in a scratch data
directory at step 0 before any assertion is written.

Revision note: v1 was self-reviewed; v2 (`sha 20142aa1…`) failed its cold pass
(`cold-review.md`: 1 Blocker, 8 Majors, 5 Minors; the reviewer's stages ran as
lenses in one session — recorded as a limitation). v3 resolves every named
item: the search leg is removed from F-P1-16 and scheduled as F-P1-17 (B1,
M6, M8); the sweep token is T783 because T636 is taken (M1); the `isError`
producer inventory is corrected and `dispatcherRefusal` is not collapsed
(M2); Appendix F's T179 row is reconciled (M3); the §5 map edit is dropped
(M4); verification uses the real hyphenated script names (M5); `info` gains an
assertion (M7); and the five Minors are folded into D1/D2/C1/C5/C6. The diff
re-review (`cold-review-r2.md`) passed with four new findings (N1–N4). At the
standard-depth re-review cap they are resolved here as a condition-only
amendment: the user-impact sentence drops `search` and names F-P1-17 (N1), the
blast-radius cell no longer lists `GuardRefusal` (N2), F-P1-17's predicate
names the host search tool as well (N3), and REQ-210c now covers entries
served through an `info`-kind tool so the info assertion rests on a written
contract (N4). `build-review` verifies those four edits.

## Objective

Take the top open ROADMAP section, *Trust-core contract remediation (P1)*
(`ROADMAP.md:15-33`), and execute its remaining **first** bullet — the
error-envelope remainder created by the 2026-11-13 increment. Three review
findings are open and scheduled there:

| Finding | Register | Promise |
|---|---|---|
| F-P1-14 | `review-register.md:2441-2447` | returned `err()` results carry no `isError: true` |
| F-P1-15 | `:2448-2453` | SDK parameter-validation results carry no structured result |
| F-P1-16 | `:2454-2458` | the ruleset lookup `Valid values:` enumeration is not badge-filtered |

The prior increment (plan `docs/plans/2026-11-13-trust-core-error-envelope/`)
deliberately deferred these three (its D4/D7/§10) because each is a different
defect from the five it closed.

**Done bar:**

1. Every tool-level error result carries `isError: true`. Two helpers cover the
   whole surface: `err()` (470 return sites) and `raw()` for its ten
   `[ERROR]`-prefixed sites. Asserted by a new sweep in
   `test-output-contracts.ts` (**T783** — T636 is taken by REQ-067d at
   `test-lean-narrator.ts:121`) that calls a battery of failing paths and
   requires `isError === true` on every result whose text begins `[ERROR]`,
   plus G2's envelope sweep tightened to reject an `[ERROR]` result without
   `isError`.
2. An error result does not advance the session pacing counter, uniformly for
   thrown, converted, dispatcher, and returned errors. Asserted by extending
   T386c (`test-narrative.ts:888-910`) with a returned-`err()` case (unknown
   ruleset lookup under GM). REQ-336a is amended to state it.
3. A structurally invalid argument returns the SDK's `-32602` tool result with
   `isError: true` and `structuredContent === undefined`; REQ-548c is scoped to
   every tool-level error response that carries a REQ-002 category. Asserted by
   extending T180 (`test-output-contracts.ts:281`).
4. Under the Player badge, a ruleset entry whose declared `badge_scope` is
   `game_master` is absent from the lookup success path, the `Valid values:`
   enumeration, the "Did you mean?" hint, and `info` resolution; the GM and
   Editor badges see it. Asserted by T179 in `test-ruleset-nonovel.ts` against
   its synthetic package (a GM-only `things` entry plus a GM-only info entry).
5. The enabling contract is written down: new **REQ-210c** gives Concepts,
   Entities, and `info`-tool entries a `badge_scope` derived from their source
   section (default `shared`), REQ-002c1 names that field, the Appendix REQ
   index carries the new row, and Appendix F's T179 row is reconciled with the
   test this increment writes (M3). The §5 map's family-level `REQ-210` row
   already covers the sub-REQ; no map edit (M4).
6. F-P1-14/15/16 are `Resolved` with current predicates and the harness that
   exercises each; the index-backed search surface they do not cover is filed
   as a new `Scheduled-roadmap` finding **F-P1-17** and a ROADMAP bullet
   (D9); `ROADMAP.md`'s remainder bullet is replaced by that bullet (bullets 2
   and 3 and the `**Trigger:**` line stay); the coverage register is
   regenerated.
7. `npm run assemble && npm run check:fast` reports the trailing
   `check:fast: PASS`; `npm --prefix holonovel run test:all` is green after
   anchor repoints; `check-registers`, `check-roadmap`, `check-loop-artifacts`
   pass.
8. One `npm run session:close` commit. Publication is out of scope.

## Premises (each read at HEAD `bb9941c`)

**Error envelope.**

- `err()` returns `{content:[{text:"[ERROR] [CODE] …\nCorrective action: …"}],
  structuredContent}` and sets **no** `isError` (`holonovel/src/index.ts:3231-3241`).
  Site counts below are from `grep -c 'return err(' src/index.ts` (470) and
  `node -e` with `/raw\(\s*[\`"'][^\`"']*\[ERROR\]/g` over the same file (10).
- `refusalResult` adds `isError` for two call sites (`index.ts:282`, `:1992`);
  `dispatcherRefusal` (`:1956-1967`, called at `:1984`, `:2000`) builds its own
  `{content, isError:true, structuredContent}` and deliberately keeps the
  refusal's exact text (its comment at `:1953-1955`). Two façade literals
  already set `isError: true` (`:17714`, `:17721`). `GuardRefusal` is the
  type at `:1951`.
- `raw()` returns `structured(classifyStatus(expanded), …)` with no `isError`
  (`index.ts:3412-3414`); ten `raw()` sites begin `[ERROR]` (e.g.
  `index.ts:5664`, `:5722`, `:6139`). `classifyStatus` already maps a leading
  `[ERROR]` to `"ERROR"` (`:248`).
- The handler chain is `withForbiddenAudit(normalizeRefusal(ensureStructured(
  handler)))` then `paced` (`index.ts:311-318`). `paced` skips `bumpPacing`
  when `result.isError` (`:311-318`); `withForbiddenAudit` keys on
  `structuredContent.category` or the first line, not `isError`
  (`src/core/server.ts:56-75`).
- The playtest classifier's `isError` branch maps compound envelopes through
  `prefix()` first, so `[ERROR] [NOT_FOUND]` stays a denial and
  `[ERROR] [STATE_CONFLICT]` stays a defect; only `mcp_error` flips to `true`
  (`holonovel/scripts/lib/playtest-lib.ts:26-78`). `isFailure` in
  `playability-run.ts:62-70` already treats the `[ERROR]` text prefix as a
  failure, so the flag adds nothing there.
- No harness asserts that a returned `err()` lacks `isError`; the only
  `isError` assertions are T178/T180/T180b and success-path `!isError` checks
  (`holonovel/scripts/*.ts`, enumerated in `grep -rn isError`).

**SDK structural result.**

- The SDK's `createToolError` returns `{content, isError:true}` with no
  `structuredContent` (`node_modules/@modelcontextprotocol/sdk/dist/esm/server/mcp.js:202-211`).
  T180 already asserts `isError` and the absence of a category string
  (`test-output-contracts.ts:275-290`); it does not assert the structured
  result.
- REQ-001b1 says SDK structural failures "carry no REQ-002 taxonomy"
  (`spec/02-requirements.md:233-235`); REQ-548c says "every error response"
  carries a structured result naming "the error category" (`:80-82`). The two
  cannot both hold for `-32602`.

**Ruleset lookup surface.**

- The lookup handler resolves against `pkg.model[collection]` (`index.ts:2271`)
  and builds the enumeration and hint from the raw collection
  (`index.ts:2311-2313`); the in-file comment at `:2303-2306` claims
  "badge-filtered per REQ-002c".
- `search` returns `RulesetIndexEntry[]` from `pkg.index` — `id`, `anchor`,
  `category`, `content` — with no `badge_scope` and no collection key
  (`rulesets.ts:656-672`); the lookup handler renders those hits raw
  (`index.ts:2317-2327`) and its match total comes from a second, unfiltered
  `rulesets.search(slug, q, 100000)` (`:2323`). `manage_ruleset (action:
  search)` repeats the pattern (`index.ts:13611-13637`). This is why the
  index-backed search surface is scheduled, not fixed, here (D9).
- `info` resolves the first collection entry whose normalized key matches the
  tool name (`index.ts:2384-2397`) — a model-entry lookup, so the predicate
  applies without a search mapping.
- Extracted model entries carry no badge marker today: the extraction contract
  gives `badge_scope` to Guidance (REQ-210a, `02-requirements.md:480`) and
  generation Tables (REQ-215a, `:486`), never to Concepts or Entities. The
  reference fixture's `concepts`/`entities` maps are empty
  (`holonovel/testdata/rulesets/fixture/model.json`).
- Generation-table gating is implemented elsewhere and is green in the
  committed suite — T257 (`test-output-contracts.ts:536-548`) rolls
  `secret_table` through `resolve_mechanic` and expects `[FORBIDDEN]` under
  Player; it is re-run at step 5, not assumed from the file's presence.
- A synthetic package for the lookup surface already exists in
  `test-ruleset-nonovel.ts:64-91`: a `things` collection plus `lookup_thing`
  (`kind: "lookup"`, `collection: "things"`), installed into a scratch data
  directory. It is test-local — no reference-package or emitter change is
  needed.
- Appendix F defines T179 as "Badge-filtered error values… as Player badge,
  call `lookup_spell` with a GM-only spell name" (`appendices-reference.md:1677`)
  and REQ-002c2 binds it (`02-requirements.md:115`), but the token is
  currently claimed by a truncation test (`test-backfill.ts:209`, title
  "T221/T179: output:// template …"). T179 is re-pointed to the synthetic
  lookup assertion and its Appendix F row is rewritten in C5 — the catalogue
  must describe the test the harness runs (M3).
- T636 is already taken by REQ-067d (`test-lean-narrator.ts:121`); the new
  isError sweep is T783 (verified absent from Appendix F and every harness;
  IDs run to T782).

**Spec-project mechanics.**

- §5.1 (REQ-001/REQ-548), §5.2 (REQ-210), and §5.5 (REQ-336) feed no
  package- or data-format fingerprint (`scripts/lib/contract-fingerprint.ts:28-45`),
  so no fingerprint regeneration is expected.
- Body limits: REQ-336a 601 chars, REQ-548c 590, REQ-002c1 513; the validator
  caps a body at 800 chars and 8 sentences. A new REQ-210c is required rather
  than extending REQ-210a (641 chars, 8 sentences — at the sentence cap).
- The §5 map lists `REQ-210 | builder-side — Discovery output`
  (`02-requirements.md:588`); the Appendix REQ index lists REQ-210a/210b
  (`appendices-reference.md:186-187`).
- `check:fast` is green at HEAD: `41 passed, 0 failed`, trailing
  `check:fast: PASS` (run at the start of this session).

## Decisions

**D1 — `isError` belongs in the two text helpers, not at call sites.**
`err()` gains `isError: true` (as `const`); `raw()` gains it when
`classifyStatus(expanded) === "ERROR"`. `refusalResult` collapses onto `err()`
(its two call sites). `dispatcherRefusal` is **not** collapsed: it preserves a
refusal's exact pre-built text, while `err()` rebuilds the text and appends its
own `Corrective action:` line, and T180b/REQ-548c assert the dispatcher text.
Rejected: wrapping 470 `err()` returns individually (F-P1-14 is every returned
error); leaving `raw()` error sites out (they are `[ERROR]` results by
REQ-001b1's own words); replacing `dispatcherRefusal` (changes asserted text).

**D2 — an error result does not advance the pacing counter.** REQ-336a's
"tool calls (mutating and non-mutating)" is amended to "successful tool calls";
`paced` keeps its `isError` guard, which now covers every error uniformly.
Rejected: preserving the current split with a hidden marker. The split is
documented in the code comment (`index.ts:305-308`) but not in the spec, and a
marker would make the counter depend on an unobservable flag; the uniform rule
is the one the spec can state.

**D3 — REQ-548c is scoped, not stretched.** The SDK's `-32602` result stays
`{content, isError}` with no structured result. REQ-548c becomes "Every
tool-level error response carrying a REQ-002 category SHALL carry …"; the
register records F-P1-15 as resolved by that scoping and cites T180's
`structuredContent === undefined` assertion. Rejected: injecting
`{status:"ERROR", category:null}` into `createToolError` — it invents a
category-less structured result that REQ-001b1 says does not exist, and would
force a second SDK override immediately after the previous one was deleted.

**D4 — entry visibility is declared data.** New REQ-210c: every extracted
Concept and Entity entry — and every entry served through an `info`-kind tool —
SHALL carry a `badge_scope` derived from its source section (`game_master` for
GM-only sections, otherwise `shared`). The host reads `entry.badge_scope`;
absent means `shared`. Rejected: inferring visibility from `source_anchor`
heuristics at request time (unreliable, and REQ-011b already assumes the
builder knows the section's role).

**D5 — filter the model resolution before matching.** A shared
`rulesetEntryVisible(entry, badge)` predicate gates the collection copy used by
lookup (matching, enumeration, hint) and `info` resolution. Under
Player/Observer a `game_master` entry is absent (NOT_FOUND, no hint); GM/Editor
see it. REQ-134 (Player-guaranteed ruleset lookups) and REQ-002a (the
enumeration) are unaffected: the tool stays callable and still enumerates every
shared name. The index-backed `search` surface is excluded because its hits
carry no badge data (D9). Rejected: filtering only the enumeration — the same
entry stays readable by exact key, so the leak survives on the same tool.

**D9 — index-backed search is a separate, scheduled surface.** `search` hits
are `RulesetIndexEntry` rows (`id`/`anchor`/`category`/`content`) with no badge
scope and no collection key, and the surface reports a match total from an
unfiltered second query (`index.ts:2323`). Filtering it needs a badge field on
the index contract (a second builder-side clause beyond REQ-210c) plus a
mapping or index-side filter, and the match total must be filtered too or the
count leaks. That is a distinct data-contract change, so this increment records
it as `Scheduled-roadmap` finding F-P1-17 (REQ-002c1, REQ-445) with a ROADMAP
bullet, and does not claim it. Rejected: bolting an index clause onto REQ-210c
in this increment (unreviewed builder contract, untestable until the builder
emits it) and dropping search silently (REQ-445 remains violated).

**D6 — the generic `table` kind is out of scope.** REQ-216a's
generation-table gating runs through `resolve_mechanic` and is green (T257);
the generic `table` kind's handling of a `game_master` lookup table is not
exercised by any shipped package. Recorded as a P3 observation in the AAR, not
a new register finding (no demonstrated package declares one).

**D7 — T179's home is the synthetic-package harness.** The assertion needs an
installed package with a lookup tool and a GM-only entry; `test-ruleset-nonovel.ts`
already installs exactly that shape. The truncation test's borrowed `T179`
token is corrected to `T221` in the same edit. Rejected: editing the reference
fixture (it has no tools; adding one would drag in the emitter and the
reference-server content boundary for a test-only need).

**D8 — the roadmap bullet is replaced by the search remainder.** Bullet 1's
three findings are resolved here; the index-backed search leak (D9) replaces it
as a new bullet naming F-P1-17 and its REQ tokens. The section keeps bullets 2
(output/authorization) and 3 (audit durability) and one `**Trigger:**` line;
`check-roadmap`'s 1–3 bullet admission rule still holds.

## Change entries

**C1 (M) — helper-level `isError`.** `index.ts:3231` `err()` adds
`isError: true as const`; `:3412` `raw()` adds the same when the classified
status is `ERROR`; delete `refusalResult` (`:3257`) and make its two call sites
(`:282`, `:1992`) use `err()`. `dispatcherRefusal` and `GuardRefusal` stay as
they are — that helper's exact-text contract is asserted by T180b. Update the
two header comments (`:266-269`, `:3254-3256`).

**C2 (S) — pacing clarity.** Keep the `isError` guard in `paced`
(`index.ts:311-318`), refresh its comment; amend REQ-336a
(`02-requirements.md:3567`) to "successful tool calls … a result with
`isError: true` does not advance the counter" (record the post-edit char and
sentence count).

**C3 (S) — SDK structural resolution.** REQ-548c (`:80-82`) scoped to
category-bearing tool-level errors; T180 extended to assert
`structuredContent === undefined` on the `-32602` result
(`test-output-contracts.ts:275-290`). No code change.

**C4 (M) — badge-filtered ruleset resolution.** Add
`rulesetEntryVisible(entry, badge)` beside the ruleset helpers (near
`index.ts:2063`); apply it to (a) the `coll` copy used by lookup matching and
the `validValues`/hint build (`:2271`, `:2311-2313`) and (b) the `info`
resolution scan (`:2384-2397`). Fix the comment at `:2303-2306` to state the
real predicate. `badge` comes from `getBadge()`; `game_master`/`none` see all,
`player`/`observer` see `entry.badge_scope !== "game_master"` (the
`loreVisible` convention, `:907-912`). The `search` case is untouched (D9).

**C5 (S) — spec enabling contract.** Add REQ-210c after REQ-210b
(`02-requirements.md:483-486`): Concepts and Entities entries — and entries
served through an `info`-kind tool — carry `badge_scope`, derived from source
section, default `shared`; the host treats a `game_master` entry as absent for
Player and Observer badges. Amend
REQ-002c1 (`:111-113`) to name the declared field. Add the Appendix REQ index
row (`appendices-reference.md:186-187`) and rewrite the T179 row
(`:1677`) to describe the synthetic-package lookup/info assertion bound to
REQ-002c1/REQ-002c2. The §5 map's family-level `REQ-210` row (`:588`) already
covers the sub-REQ — no map edit (M4). Apply Appendix M's authoring checklist
and re-measure every edited body: predicted REQ-336a ≈660 chars / ≤8
sentences, REQ-548c ≈590 / 4, REQ-002c1 ≈555 / 4, new REQ-210c ≈250 / 3; all
≤800 chars and ≤8 sentences, with the measured values recorded in the AAR.
Coverage consequence: REQ-210c is builder-side and carries no harness binding
(the coverage audit whitelists builder-side REQs); T179 evidences
REQ-002c1/REQ-445 on the host side and is cited in both register rows. No
behavioral-config entry and no fingerprint regeneration follow from a §5.2
builder-side REQ.

**C6 (M) — harness assertions.** `test-output-contracts.ts`: new T783 sweep
(every `[ERROR]` result carries `isError`) and the G2 tightening
(`:765-785`); T180 extension (C3). T783 is not a duplicate of G2: G2 probes a
fixed four-call list and accepts a non-`isError` enveloped text result
(`:770-785`), while T783 drives the failing paths (`err()` and `raw()` error
sites) G2 rarely reaches. `test-narrative.ts`: T386c gains a
returned-`err()` leg. `test-ruleset-nonovel.ts`: T179 — add a
`badge_scope: "game_master"` entry to the synthetic `things` collection and a
GM-only `info` entry, then assert Player lookup by key → `[NOT_FOUND]` with no
GM-only name in the enumeration or hint, Player `info` → `[NOT_FOUND]`, and GM
sees the entry in the success path, enumeration, hint, and `info`.
`test-backfill.ts:209`: drop the borrowed `T179` label.

**C7 (S) — registers, roadmap, coverage, changelog.**
`spec/audit/review-register.md`: F-P1-14/15/16 → `Resolved` with refreshed
predicates (recomputed at edit time) and the exercising test
(T783/T180/T179); new `Scheduled-roadmap` finding F-P1-17 (the index-backed
search surface, REQ-002c1/REQ-445, predicates `index.ts:2319`/`:2323` and
`:13611-13637`).
`ROADMAP.md`: replace bullet 1 with the F-P1-17 bullet naming REQ-002c1 and
REQ-445 (D8). Regenerate `spec/audit/req-coverage.md`; add the `CHANGELOG.md`
dated entry
`2026-11-14 — trust-core error-envelope remainder: isError on every error
result, scoped SDK structural resolution, badge-filtered ruleset lookups`.

## Blast radius

| File | Change | Size |
|---|---|---|
| `holonovel/src/index.ts` | `err()`/`raw()` `isError`, delete `refusalResult`, `rulesetEntryVisible` + two applications (lookup, info), comments | M |
| `spec/02-requirements.md` | REQ-336a, REQ-548c, REQ-002c1, new REQ-210c | S |
| `spec/appendices-reference.md` | Appendix REQ index row for REQ-210c; T179 row rewritten | S |
| `spec/audit/review-register.md` | 3 resolved rows, 1 new scheduled finding, predicates refreshed | S |
| `spec/audit/req-coverage.md` | regenerated | S |
| `ROADMAP.md` | bullet 1 replaced by the F-P1-17 bullet | S |
| `CHANGELOG.md` | dated entry | S |
| `holonovel/scripts/test-output-contracts.ts` | T783 sweep, G2 tightening, T180 extension | M |
| `holonovel/scripts/test-narrative.ts` | T386c returned-error leg | S |
| `holonovel/scripts/test-ruleset-nonovel.ts` | GM-only entry + T179 | M |
| `holonovel/scripts/test-backfill.ts` | T179 label corrected to T221 | S |
| `docs/plans/2026-11-14-trust-core-envelope-remainder/` | plan, tasks, AAR | S |
| `holonovel/scripts/lib/holosuite-*.ts` | anchor repoints if `src/index.ts` shifts | S |

Verify-no-change: `holonovel/tool-definitions.json` (no schema/parameter
change), `holonovel/src/generated/contract-fingerprints.ts` (§5.1/§5.2/§5.5
are not fingerprinted), `holonovel/DECISIONS.md` gate table,
`holonovel/testdata/rulesets/fixture/**` (D7).

## Dependency order

1. **Probe** (`/tmp/opencode/probe-envelope-remainder.ts`, scratch
   `TTRPG_DATA_DIR`): (a) a returned `err()` path (unknown ruleset key) —
   `isError` and `structuredContent`; (b) a `-32602` structural error —
   `structuredContent`; (c) pacing counter effect of a returned error under
   `TTRPG_PACING_WINDOW=3`; (d) the synthetic package's Player lookup of an
   unknown key today (enumeration text). No assertion before this probe.
2. C6 red: T783 (fails on the returned `err()` and `raw()` error cases), T180
   extension (fails on `structuredContent`), T386c returned leg (fails on the
   counter), T179 (fails on enumeration/hint/success leakage).
3. C1 → C2 (pacing red should clear without further edit) → C4, running
   `test:output-contracts`, `test:backfill`, `test:narrative`,
   `test-ruleset-nonovel` after each.
4. C3, C5, then `npm run assemble`; re-measure the four bodies.
5. `npm --prefix holonovel run test:all`; repoint drifted anchors and re-run.
6. C7: registers → roadmap → coverage → changelog, recomputing each predicate
   at the current line.
7. `npm run assemble && npm run check:fast`, then `npm run session:close`.

## Edge cases and rollback

- **A handler returns an error text via a bare object literal.** The G2 sweep
  (`test-output-contracts.ts:765-785`) is the detector; if it names a site
  outside `err()`/`raw()`, C1 extends to that helper rather than the call site.
- **A `raw()` payload that merely starts with `[ERROR]` as quoted content.**
  `classifyStatus` already treats the leading token as the status; a payload
  quoting the token later in the text is unaffected. T783 asserts only
  first-line-prefixed cases.
- **A delegating tool.** The inner handler returns `isError`; the outer returns
  it unchanged, so `paced` counts once — the existing T386b covers the
  once-only property and is re-run.
- **`isError` on `[STATE_CONFLICT]`.** Playtest classification stays a defect
  (D2 premise); only `mcp_error` flips. `test:playtest` re-run confirms.
- **An entry declares `badge_scope` on a nested field** (e.g. an entity's
  `badge_scope` inside `fields`). The predicate reads the top-level field only;
  a nested or absent value means `shared`. T179 asserts the top-level form the
  new REQ-210c mandates.
- **Observer visibility.** Treated like Player (shared only), matching
  `loreVisible`; no harness asserts Observer ruleset content today. If the
  probe shows Observer already sees GM-level ruleset content by design, the
  predicate follows `loreVisible` and the AAR records the convention.
- **New REQ-210c over the body limit.** Re-measure after the edit; if the
  sentence cap is hit, split the host-side sentence into REQ-002c1 rather than
  exceeding the limit.
- **`src/index.ts` line shifts break Holosuite anchors.** `test:all` reports
  each; repoint and verify the symbol is on the new line.
- Rollback: one `git revert`; no persisted data shape changes.

## Verification

| Bar | Command |
|---|---|
| 1 | `npm --prefix holonovel run test:output-contracts` (T783, G2) |
| 2 | `npm --prefix holonovel run test:narrative` (T386/T386b/T386c) |
| 3 | `npm --prefix holonovel run test:output-contracts` (T180) |
| 4 | `npm --prefix holonovel run test:ruleset-nonovel` (T179) |
| 1–4 | `npm --prefix holonovel run test:all` |
| classification | `npm --prefix holonovel run test:playtest` (isError branch unchanged; `mcp_error` flips only) |
| spec | `npm run assemble && npm run validate` (REQ shape, char/sentence limits) |
| registers/roadmap | `npm run check-registers`, `npm run check-roadmap`, `npm run check-loop-artifacts` |
| coverage | `npm run validate -- --write-register` |
| gates | `npm run assemble && npm run check:fast` → trailing `check:fast: PASS` |
| conformance | `npm run check:conformance` (expected no change) |

## User impact and commit order

Client-visible: every tool-level error result now carries `isError: true`
(including parser-command errors and ruleset lookups); a failed call no longer
advances the session pacing counter; under the Player/Observer badge, ruleset
entries declared `game_master` are absent from lookups, enumerations, hints,
and `info` resolution. The index-backed `search` surface still discloses such
entries and remains open under F-P1-17. No restart, parameter, or
persisted-data change.

One commit:
`2026-11-14 — trust-core error-envelope remainder: isError on every error
result, scoped SDK structural resolution, badge-filtered ruleset lookups`.

## Out of scope

F-P1-4…F-P1-9 and F-P1-13 (remaining ROADMAP bullets 2 and 3); the
index-backed search surface (F-P1-17, D9) including its unfiltered match
total; the §5.1/§5.3/§5.5 citation-repair sections; the generic `table` kind's
badge gating (D6); ruleset `search` ranking changes; reference-package content
and the fixture emitter (D7); the SDK `-32602` taxonomy question beyond the
REQ-548c scoping (D3).
