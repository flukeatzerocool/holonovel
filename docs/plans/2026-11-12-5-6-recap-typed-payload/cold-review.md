# Cold-review record

Binding line for the final reviewed bytes (emitted by the final binding
check; the full reports follow in chronological order):

```
Plan sha256: 68365a04aa16de8e867de4cca42776850b560dad1b53afcb717ca18fe6d1e407
independent-review passed.
```

---

# Cold review — §5.6 typed recap payload remediation

Reviewer: `review` (cold stage, deepseek-v4.1-flash)
Plan sha256: 735b040819372b6dc7c41e6de540e96cd1fca1d7d1d1954b18470d59fc44ca55
Depth: standard · Reads used: 35/40 · Verdict: **FAILED** (5 Blockers)
Review independence: fresh context (no authoring conversation). The reviewer
could not write this file (no write tool in that stage); the report body below
is persisted verbatim by the parent.

## Comprehension (Stage 2 — artifact only)

The plan converts `manage_context (action: recap)` from a text-only result into a text envelope
plus a typed `structuredContent` payload of the 15 fields REQ-072c1/c2 declares, plus
`narrative_orientation`; it adds entity status per REQ-072a1, derives per-combat confrontation
objects from `init_combat`/`advance_combat`/`end_combat` audit entries, scopes the payload by
`session_id`, returns `[NOT_FOUND]` for an unknown session, and audits the three unaudited
character-creation paths so `roster_changes` has a "created" source. It writes T53 and T212 and
widens T214/T215, corrects four Appendix F rows and one REQ-072c1 word, marks F-P3B1-3 `Resolved`,
narrows F-P3B1-9 to the deferred citations, and retitles the ROADMAP §5.6 section to the clock and
combat-report work. Done means all named harnesses, `check:fast`, `build-order`, typecheck, surface
and coverage gates green; every new assertion observed red first; AAR ends `LOOP PAUSED`.
Paraphrase holds except for the open questions in §11, which contradict decisions D1–D8
(finding M6) — **faithful-with-gaps**, not a clarity stop.

## Blockers

**B1 [design] The confrontation round count overrides a normative REQ without amending it.**
`plan.md:59-65` states the contradiction and resolves it as "D4 makes the recorded value
authoritative and the formula the legacy fallback; no spec body change (D7c)", and `plan.md:267-271`
justifies it with "`rounds_played` **is** an audit-log-derived value". That premise is false:
`holonovel/src/core/state.ts:2618` writes `rounds_played: novel.combat.round`, a live counter
incremented at `state.ts:2579-2583`, not a value read back from the log. Meanwhile
`spec/02-requirements.md:1601` (REQ-175a) prescribes exactly one derivation — "count of
`manage_combat (action: advance)` entries divided by participant count, rounded up". So after this
increment the normative REQ (formula → 1) and the widened T214 (`rounds: 2`) disagree, which is the
same class of inconsistency §1 claims to reconcile.
**Remedy:** either amend REQ-175a to make the `end` entry's `rounds_played` authoritative (add it to
§4 and to the REQ count), or make the builder follow the published formula and set T214's expected
rounds to that result — do not leave both readings live.

**B2 [design] The proposed `okWith` drops the `grounding` field that `ok()` currently emits.**
`plan.md:102-106` specifies the helper body as
`structuredContent:{status:"OK", text: expanded, ...fields}`, hand-built. The existing
`ok()` (`holonovel/src/index.ts:3175-3178`) delegates to `structured("OK", expanded)`, and
`structured()` (`index.ts:3127-3131`) appends `grounding` whenever `groundingSet()` returns one —
and already accepts an `extra` argument for precisely this case. Every recap response would silently
lose its grounding provenance, and no assertion in the plan checks it.
**Remedy:** define `okWith(text, fields)` as `structured("OK", expanded, fields)` inside the same
content envelope, and add a red assertion that a grounded recap still carries `grounding`.

**B3 [design] Three of the eleven text consumers the design depends on are executed by no gate the
plan runs.** `plan.md:141-145` rests D1 on eleven existing assertions staying green, including
`test-competitive-gaps.ts:412-421`, `holosuite-novel.ts:381-383`, and
`run_ruleset_pattern_buffer.ts:375`. The done bar and verification (`plan.md:83-87`, `:430-431`)
run only eight suites, none of which is those; `scripts/run-gates.ts` contains no reference to
`competitive-gaps`, `holosuite`, or `pattern-buffer` (grep → 0 matches), so `check:fast` and
`build-order` will not catch a regression there either (`holonovel/package.json:76,95,125` define
the three scripts).
**Remedy:** add `test:competitive-gaps`, `test:holosuite-novel`, and `test:pattern-buffer-ruleset`
to the Phase 0 baselines and the done bar, or name the CI job that runs them.

**B4 [clarity] The blast radius omits files the plan names, and §5's "all named in §4" is false.**
`plan.md:343-344` says "Four surfaces, all named in §4", but surface (2),
`holonovel/src/core/server.ts:62-63` (`plan.md:345-347`), appears neither in the §4 table
(`plan.md:290-304`) nor in "Not touched" (`plan.md:312-316`). Separately, the consumer files D1
names and Phase 0 step 4 explicitly contemplates editing ("amended in the phase that changes the
text", `plan.md:329-332`) — `holonovel/scripts/test-competitive-gaps.ts`,
`test-limits.ts`, `test-memory-recall.ts`, `scripts/holosuite.ts`,
`scripts/run_ruleset_pattern_buffer.ts` — have no blast-radius row at all.
**Remedy:** add a row per file with read-only vs edit intent and the gate that notices it, and delete
the "all named in §4" claim.

**B5 [clarity] "Six deferred citations" contradicts the seven tokens the plan itself lists.**
`plan.md:19` names T271, T54, T139, T25, T33, T110, T161 (seven) and defers them; `plan.md:81`,
`:302`, `:415`, `:420`, and `:505` all say six. `ROADMAP.md:20-25` carries all seven across its three
bullets, and `spec/audit/review-register.md:2202-2204` lists F-P3B1-9 as T25/T33/T110/T161, T53/T212,
T271, T54/T139 — seven remaining once T53/T212 resolve. The count is load-bearing: the done bar
requires the retitled trigger to "close only on those", so writing six leaves one token orphaned.
**Remedy:** write "seven (T25, T33, T110, T161, T271, T54, T139)" in §1, §2, §4, §5 and §8, and make
the ROADMAP trigger name the same seven.

## Majors

**M1 [design] `entityHp` omits keys; the payload must never omit them.** `plan.md:107-109` says
"Reuse it; do not re-derive", but `index.ts:4667-4674` returns `{}` with `hp`/`max_hp` absent when
the stat bag defines none, while `plan.md:185-187` and REQ-072d (`spec/02-requirements.md:1570`)
require typed null. **Remedy:** state the normalization explicitly (`{...entityHp(e), hp: ?? null,
max_hp: ?? null}`) and that `status` uses the null-HP case.

**M2 [design] `args` names three different objects.** The builder is specified as
`buildRecapPayload(novel, entries, args)` with recap options (`plan.md:157-158`, `:229-238`), yet D4
reads `args.participants`, `args.dangers[].name`, `args.rounds_played`, `args.outcome`
(`plan.md:215-219`) from init/end audit entries. **Remedy:** rename the recap parameter to `opts`
and cite each audit-entry field as `initEntry.args.participants`, `endEntry.args.rounds_played`, etc.

**M3 [design] `roster_changes` key and action mapping are underspecified.** D2 names the audit
sources (`plan.md:173`) but `create_npc` writes `{name, id, ruleset_reference}` and `remove_npc`
writes `{npc_id}` (`index.ts:7787`, `:7832`) — not `entity_id` — while REQ-072c2
(`spec/02-requirements.md:1567`) requires `entity_id` and action ∈ {`created`,`removed`}.
**Remedy:** add a per-audit-action table mapping to `{entity_id, action}` (including the `id`/
`npc_id` → `entity_id` rename).

**M4 [design] `condition_changes` action values are unstated, and expiry is unmentioned.** D2 lists
audit tool names (`plan.md:174`); REQ-072c2 requires the literal values `applied`/`removed`, and
`state.ts:2573` also writes `condition_expired` entries. **Remedy:** state the mapping and whether
expiry appears (and as which action).

**M5 [design] T261 is kept in the widened backfill title although it is a Manual world-model
replay.** D7d drops the uncatalogued `T072` from `test-backfill.ts:216` (`plan.md:272-275`) and the
verification table promises the title is "free of `T072`" (`plan.md:441`), but T261 stays. T261 is
`Manual` and asserts a golden-transcript replay, not a recap (`spec/appendices-reference.md:1721`).
**Remedy:** drop T261 with T072 and record why in `aar.md`.

**M6 [clarity] §11's open questions contradict decisions D1–D8.** `plan.md:541-550` lists as
self-review questions whether `scene_type` is a string (D2 decides `string | null`, `:169`), whether
the archived payload's empty arrays satisfy REQ-072c2 (D5 decides, `:229-238`), whether the creation
audits belong here (D8 decides, `:277-286`), and whether REQ-548a needs text mirroring (D1 decides,
`:147-154`). A reader cannot tell which decisions are settled. **Remedy:** delete the four or convert
them to "decided (Dn)" notes.

**M7 [clarity] The evidence sidecar is stale against the artifact.** `plan.evidence.json:11` records
`0152a716…`, 520 lines, 33352 bytes; the artifact is `735b0408…`, 554 lines. The sidecar's target and
REQ findings were produced before the amendment. **Remedy:** re-run preflight on the amended artifact
so the stamp binds to the bytes that were reviewed.

**M8 [clarity] The scoped-session path's text is not the recap body, and the plan does not say
which one it keeps.** D5 item 1 requires "scoped payload + scoped text" (`plan.md:229-238`) while
Phase 2 promises the text renderer is "byte-identical where no field changed" (`:392-393`); the live
path's text today is a `session_scope`/`timespan`/`entry_count` line listing
(`index.ts:11225-11230`), not the recap body those payload fields describe. **Remedy:** state that
the scoped path keeps its line listing and that its payload is computed from the scoped slice, not
from that text.

**M9 [design] `gm_notes` (REQ-072h) and `tiered_memory` (REQ-072i) have no disposition.** The field
table (`plan.md:161-177`) neither carries nor explicitly defers them, although the same tool is bound
by both REQs (`spec/02-requirements.md:1578`, `:1582`) and both render today
(`index.ts:11415`, `:11442`). **Remedy:** add one line to §8 deferring them by name, with the
register/roadmap pointer, or carry them in the payload.

## Nits

- **N1 [clarity]** `plan.md:329` calls the D1 inventory the "eleven-file probe"; it is eleven
  assertion sites across seven files.
- **N2 [clarity]** `plan.md:56` cites T215 at `appendices-reference.md:1616`; it is `:1617`
  (`:1616` is T214).
- **N3 [clarity]** `plan.md:40` cites the creation paths as `:4716-4762`, but D8 (`:277-281`) adds
  audits at `:4759`, `:4804`, and `:4855` — the last outside the cited range.
- **N4 [clarity]** The count-provenance line (`plan.md:46-48`) offers T261 as coverage evidence,
  but T261 is a `Manual` transcript replay (`appendices-reference.md:1721`) — "resolves to a file"
  is not adequacy; T213, an automated REQ-072f check (`:1615`), is never probed or mentioned.
- **N5 [clarity]** `plan.md:36` says the envelope is "auto-derived at `index.ts:261-270`"; that is
  `ensureStructured`'s fallback, which the recap never reaches because `ok()` sets
  `structuredContent` explicitly (`index.ts:264-266`, `:3177`). The substantive claim (only
  `status`/`text`) is still right.

## Verified and sound

- Field count 15 is correct: REQ-072c1 declares nine, REQ-072c2 six (`spec/02-requirements.md:1564`,
  `:1567`); `narrative_orientation` is separate (REQ-279a, `:1588`); D2's 16 rows = 15 + orientation.
- T53 (`appendices-reference.md:1517`) and T215 (`:1617`) both say "all 14 named fields" and T215's
  list does omit `story_entries` — §1's first catalogue contradiction is real.
- `init_combat` records `{participants, dangers}` (`state.ts:2549`); `end_combat` records
  `{outcome, rounds_played}` (`:2618`); `apply_condition`/`remove_condition`/`remove_character`/
  `create_npc`/`remove_npc` audit entries exist where cited (`index.ts:8540`, `:8555`, `:4640`,
  `:7787`, `:7832`), and `create_character`/`import_character` are written nowhere.
- `core/server.ts:62-63` does read `structuredContent.category`/`.status`, and the payload adds no
  `category` — the refusal seam is unaffected.
- §5.6 feeds no contract fingerprint; §4's fingerprint paragraph matches AGENTS.md's fingerprinted
  set.
- The eight named `test:*` suites all exist (`holonovel/package.json:71,74,79,82,84,89,99,118`), so
  the done bar's command list is executable.

## Unknowns

- The recap body between `index.ts:11245` and `11399` and the existing confrontation walk at
  `11310-11330` were not read; per-field derivations cited inside that range are accepted as stated.
- `state.ts:374-381`, `:869`, `:315-330`, `:443-460` and `rulesets.hydrate` key preservation were not
  read; Phase 0 step 8 makes hydration a probe, so that is deferred by design.
- No gate was run (read-only stage); the 41/41 baseline is unverified.
- The evidence sidecar predates the artifact (M7), so its REQ-presence results were used only where
  the same claim is independently visible in the files read.
- Host context injection: `holonovel/AGENTS.md` and the user search-preferences file were injected
  into this session although they were not part of the dispatch; isolation is weakened but the
  findings stand on file evidence.
- The five stages ran as five lenses in this one cold context — nesting is not permitted to this
  stage — so Stage 1–5 independence is reduced to one context, not five.
- The named cold-report path could not be written; that stage has no write capability and stage
  reports are persisted by the parent.

## Coverage

Stage 1 (zoom-out), Stage 2 (comprehension), Stage 3 (design/structural/style lenses), Stage 5
(readiness) all exercised. Stage 4 (re-zoom) not applicable: the artifact was not edited during this
pass. Reads: 35 of 40.

```
independent-review FAILED. [plan.md] — 5 blockers
```

Blockers: 5 · Majors: 9 · Nits: 5 · reads 35/40

---

# Findings-resolution re-review (standard-depth cap, 1 of 1)

Reviewer: `review` (fresh context) · artifact `e1f1ccd66f526791d976cbf7d1484197f4aa853d0a61c1be7816dc680335b7fb`
Reads used: 10/10 · Verdict: **FAILED** (1 new Blocker, N-B1)

## Per-finding table

| Finding | Status | Evidence in the revised plan |
|---|---|---|
| B1 REQ-175a round source | **NOT RESOLVED (execution layer)** | Decided in D7c (`:313-321`), §4 row (`:359`), §12 (`:641`); but §1 still said "no normative change beyond REQ-072c1", Phase 5 named only D7a/D7b, and the done bar/§6 carried no REQ-175a item |
| B2 `okWith` drops `grounding` | Resolved | `:110-117`, `:446-447`, `:93-94`, `:524` |
| B3 three ungated text consumers | Resolved | `:155-162`, `:89-93`, `:384`, `:494`, `:502-503`, `:509` |
| B4 blast-radius omissions | Resolved | `:353-358`; "all named in §4" removed |
| B5 six vs seven | Resolved in plan.md | `:85-86`, `:361`, `:363`, `:479`, `:484`, `:572` (tasks.md was stale — now fixed) |
| M1 `entityHp` null normalization | Resolved | `:118-121`, `:204-206`, `:247-248` |
| M2 `args`/`opts` collision | Resolved | `:173-178`, `:256-261` |
| M3 roster_changes mapping | Resolved | `:208-221` |
| M4 condition_changes + expiry | Resolved | `:219-228`, `:524-525`, `:444-445` |
| M5 T261 in widened title | Resolved | `:325-330`, `:349`, `:505` |
| M6 §11 contradicting D1-D8 | Resolved | `:614-637` |
| M7 stale evidence sidecar | Resolved by removal | increment dir carries no `plan.evidence.json` |
| M8 scoped-path text ambiguity | Resolved | `:276-281` |
| M9 gm_notes/tiered_memory | Resolved | `:583-588` |
| N1-N5 | Resolved | `:155`, `:390`, `:57-58`, `:40`, `:46-51`, `:36` |

## New finding

**N-B1 [Blocker] [design] The REQ-175a amendment was decided and in the blast
radius, but §1 denied it and the Phase 5 list, done bar, and §6 table omitted
it — executing the phases would reproduce B1.** Full predicate and remedy in
the reviewer's dispatch reply; the three one-line edits it required are
applied in the revision that follows this record.

**Execution risk outside the artifact:** `tasks.md` had not been regenerated
from the amended plan (six/seven, `args`/`opts`, eight/eleven, the missing
REQ-175a step). It is regenerated.

**Nits:** a duplicated `novel.combat` bullet (removed), a §12 sentence claiming
a "stale-sidecar note" that did not exist (reworded), and Phase 5 restating
only `T072` where D7d drops `T261` too (corrected).

## Unknowns

- Source regions re-verified in the prior pass were not re-read.
- No gate was run.
- `tasks.md`/`aar.md` were context only.

```
independent-review FAILED.
```

**Cap reached.** The amendment is not re-reviewed; it is carried into
`build-review` as condition C-1.

---

# Second cold pass (fresh context, standard depth)

Artifact: `aa71e59ccaf59f66bdff6ba5f8cdbb3f0a56791edb3638266f25b927f44c0cac` · Reads 13/40 · **FAILED** (2 Blockers, 3 Majors, 6 Nits)

## Blockers

1. **The generated, committed assembled spec is absent from the blast-radius
   table.** §4 lists `spec/02-requirements.md` and `spec/appendices-reference.md`
   but not `holonovel.md`, which the repo commits and the plan's own
   `npm run assemble` regenerates. The first spec edit makes it a modified
   tracked file, so the table-vs-diff check fails and B4's "resolved" claim is
   untrue.
2. **The archived-session payload is specified twice, differently**, and no
   declared field can carry the archive summary's five counts (they are numbers;
   the declared fields are arrays). An implementer must invent the mapping.

## Majors

1. `significant_rolls` sourced from `novel.audit_log` while D5 requires the
   scoped slice — a `session_id` recap would pair scoped confrontations with
   Novel-wide rolls.
2. REQ-175b's literal "When no combat is active, `confrontations_completed`
   SHALL be an empty array" is left unamended while D4 returns completed objects
   whenever an `end_combat` exists — the same class the plan amended REQ-175a
   to avoid.
3. T53's catalogue row still asserts the three-status rule that D3/REQ-072a1
   extend with `incapacitated`.

## Nits

Done-bar vs Phase 1 red-observation wording; `gm_notes` anchored at `:11415`
instead of `:11365`/`:11442`; the `timespan_*` override not folded into D2; the
`grounding` assertion's file unnamed; four done-bar harnesses without read-only
rows; the unknown-`session_id` predicate described as an isolated `ok()` rather
than an append to the full recap.

## Unknowns

Injected project instructions appeared in the cold context; the dispatch was a
second full pass rather than a stage re-audit (process deviation recorded); the
REQ body character counts have no measuring command, so §6's `validate` row is
the authority.

```
independent-review FAILED.
```

---

# Re-audit (standard cap, 1 of 1)

Revised artifact reviewed in place · Reads 9/10 · **PASSED** (no new Blocker)

All twelve findings (B1, B2, M1-M3, six Nits) verified resolved against the
revised bytes, with source confirmation for each asserted fact:

| Finding | Status | Revised evidence |
|---|---|---|
| B1 assembled copies | Resolved | `plan.md:389-390`; `scripts/assemble.ts:7`, `:167`, `:172-175` write both copies |
| B2 archived payload | Resolved | `plan.md:289-301` one explicit mapping (2 + 1 + 4 + 8 = 15 fields); `index.ts:11421-11424` carries the summary timespans |
| M1 significant rolls | Resolved | `plan.md:197`, `:207-211`; `scene_transitions` Novel-wide justified |
| M2 REQ-175b | Resolved | `plan.md:341-346`; `02-requirements.md:1604` is the replaced sentence |
| M3 T53 statuses | Resolved | `plan.md:326-330` |
| N1-N6 | Resolved | `plan.md:91-94`, `:618-622`, `:186`, `:373`, `:379-387`, `:39` |

New non-blocking Nits: the `check-fingerprint-sync` attribution for the embedded
copy (corrected after the pass to `test:spec-tooling`), and the sizing note's
"two contract fixes" (corrected to three REQ wording fixes plus the REQ-072f
refusal). Both are wording amendments inside text the pass adjudicated; neither
changes a decision.

```
independent-review passed.
```

---

# Execution delta review (fresh context)

Reviewed: plan `f766f56e…` delta amendments (fingerprint membership, T203
reconciliation, T214 fixture) · reads 13 · **PASSED**, 4 nits.

Claim 1 (fingerprint membership) verified: `contract-fingerprint.ts:38` lists
`### 5.6 ` in `DATA_SECTIONS`. Claim 2 (REQ-168a owns the visibility rule)
verified: the amended T203 asserts the positive own-entity case and the absence
of foreign GM lines. Claim 3 verified: two advances over two participants give
`rounds_played: 2` while the old formula gives 1. Claim 4 verified: seven
citations, eleven suites, `opts` agree across plan and tasks.

Nits resolved before the final binding check: the citation is now `:38`; REQ-175a
restores "rounded up"; T203 asserts `pcId` positively; the AAR says "8 findings
across 7 distinct anchors".

```
Plan sha256: f766f56e6213aa6e08dee9e3eb6ade0812f21682b7b7e2125e89a8a0235e2063
independent-review passed.
```

# Final binding check (fresh context, 6 reads)

All four nit fixes verified in place and mutually consistent; no Blocker. The
reviewer noted one residual nit: D7c's quoted amendment paraphrases the formula
without "rounded up", while D4 and a tightened REQ-175a both carry it (no
contradiction).

```
Plan sha256: 68365a04aa16de8e867de4cca42776850b560dad1b53afcb717ca18fe6d1e407
independent-review passed.
```
