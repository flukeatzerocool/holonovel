# Plan — Synthesis-surface gaps (U6-F3, U6-F4, U6-F5)

Status: draft v4 (v2 self pass; cold pass v2→v3: 3 Blockers, 2 Majors, 4 Minors,
2 Nits; diff re-review v3→v4: 1 new Blocker, 3 Minors, 2 Nits — all resolved
below) · Kind: planned · Depth: standard
Increment target: `docs/plans/2026-11-15-synthesis-surface-gaps/` (created at the
review step with `plan.md`, `tasks.md` and `plan.cold/`; the working draft lives
in the gitignored `plans/` area)
Rollback cost: 1 (one revert: `holonovel/src/core/synthesis.ts`,
`holonovel/src/core/{state,limits,wisdom}.ts`, `holonovel/src/index.ts`, the
harnesses, `spec/08-synthesis.md`, `spec/appendices-reference.md`,
`holonovel.md`, `holonovel/holonovel.md`, `spec/build-phase-map.md`,
`holonovel/src/generated/g7-attestation.ts`, the generated G7 table in
`holonovel/DECISIONS.md`, `spec/audit/review-register.md`, `ROADMAP.md`,
`CHANGELOG.md`)
Evidence class: EV1 and EV2 are `tool-output`; every other premise is a
`file:line` read at HEAD `5980ed2` with a clean tree.
Trust boundary: every premise is read from the working tree; no web, user, or
fetched content enters the plan.
Review independence: fresh — cold pass recorded in `plan.cold/report.md` under the
tracked increment directory, whose hash the stamp records.

## Resolutions

**Operator decisions (2026-11-15).** DP-2 is **include manifest persistence**, and
the increment stays **one** increment (no split). Both are now fixed inputs, not
options; K4 defines the only acceptable partial-delivery branch.

**Self-pass findings v1 → v2.**

- **B1 [Blocker] — the caps had no defined target set, and the obvious one is
  wrong.** `DEFAULT_WISDOM.action_patterns` items carry **no** `tag` (EV22), so a
  tag-based "Tier-1 exemption" would cap eight vendor patterns as if they were
  Novel-derived. Fixed: the capped set is **internal synthesis items**, defined
  mechanically as items whose `source_url` starts `novel://`; Rule-set Wisdom
  (vendor, ruleset, player-authored, and untagged build output) is exempt. The
  definition lives in the new module, so the exemption and the cap cannot drift.
- **M1 [Major] — the DATA_FORMAT consequence was unexamined.** `DATA_FORMAT` is
  derived from `DATA_SECTIONS`, which includes §7.7 (`EV23`). Persisting a new
  Novel key therefore raises two questions the plan did not answer: does the
  spec need to change, and does the fingerprint go stale? Resolved: §7.7 already
  declares **Synthesis** as a Novel property group with `read/write/revert`
  (`EV24`), so no spec edit and no fingerprint regeneration are owed; the new key
  inherits the declared group. `DATA_FORMAT` stays unchanged because the field is
  additive, optional and defaulted on load (K1 names the fallback if the loader
  cannot default it).
- **M2 [Major] — no sibling-contract check.** Several REQs bind the same action
  and the same health fields. Added Phase 0 step 5: enumerate every REQ that
  binds `manage_synthesis (action: run|revert|list)`, `synthesis_fingerprint`,
  and `spec_health.synthesis_health`, and confirm none contradicts DP-1's
  composition or DP-3's precedence before the first edit.
- **M3 [Major] — the file-surface probe was implicit.** Added Phase 0 step 6: the
  four surfaces the change crosses — tool schema and descriptions (unchanged,
  `index.ts:16906-16921`), the storage seam (`core/state.ts` serialize / load /
  hydrate), the read surfaces (briefing, three resources, `list`), and the
  harnesses — each named with its file.
- **M4 [Major] — two claims were assertions, not evidence.** "The state hash now
  includes synthesis" and "no migration is needed" are both assumptions. Fixed:
  each is named with the check that settles it (V3 and V11), and K1 carries the
  fallback.
- **M5 [Major] — DP-1 and DP-4 had no rejected alternative.** Added below, so a
  reviewer can see why the chosen shape was chosen.
- **Minors.** The blast radius now names `scripts/lib/contract-fingerprint.ts`
  and `scripts/check-fingerprint-sync.ts` as *examined, not edited*; EV23/EV24
  were added to the evidence table; V10 adds `check-traceability`; the CHANGELOG
  date-equals-commit-subject gate is named in Phase 7; and the "Not touched"
  row no longer implies `core/wisdom.ts` is inert (its `DEFAULT_WISDOM` data is
  read, never edited).

**Cold pass findings v2 → v3** (independent reviewer, five stages, report in
`plan.cold/report.md`).

- **CB1 [Blocker] — U6-F4's closure rested on an unread, untested clause.**
  `spec/08-synthesis.md:301-302` requires the `[LOW]` tag "in all badge views",
  but EV14 stopped at `:243` and no row asserted a Player/observer view. Fixed:
  EV14 extends to `295-302`; new `T325b` asserts the GM and Player badges on
  both the briefing and a badge-filtered resource payload (a GM-scoped LOW item
  must be absent for the Player, and a shared LOW item must carry `[LOW]`);
  done-bar item 2 now names all badge views.
- **CB2 [Blocker] — the new Appendix F rows turn the coverage register stale and
  carried no REQ cell.** `validate` parses each Appendix F row's REQ cell
  (`scripts/validate.ts:1804-1819`) and byte-compares the rendered audit against
  `spec/audit/req-coverage.md` (`:2131-2137`), so T789/T790 would redden V2 and
  V8. Fixed: the rows cite REQ-262b, REQ-264a, REQ-160 and REQ-129, the register
  joins the blast radius, and Phase 5 regenerates it with
  `npm run validate -- --write-register` after the last spec edit and before the
  gates.
- **CB3 [Blocker] — the persisted scope and the hydration trigger set were
  underspecified, and both readings corrupt state.** `novelToSnapshotJSON`
  derives from `novelToJSON` (`core/state.ts:3372-3383`), so checkpoints and
  undo/redo carry the new key while `state.wisdomManifest` has exactly two
  writers (`index.ts:16931,16941`) — the two copies would diverge after an undo,
  a `checkpoint_restore` or an `import`. Fixed: the Novel persists **only
  internal items** (`source_url` starting `novel://`) plus the activation maps
  and hashes — never the vendor tier; hydration rebuilds `DEFAULT_WISDOM` first
  and re-merges the persisted internal items, so a ruleset bind cannot be
  shadowed by stale vendor content (REQ-080); the hydration points are activation,
  undo/redo, `checkpoint_restore` and `import`; and the null branch is explicit
  (`enriched=false`, `manifest=null`).
- **CM4 [Major] — DP-3 dropped two REQ-129c obligations.** Zero must make
  `run` return `[STATE_CONFLICT]` with the group and counts named, and
  `spec_health` must report the group's count, maximum and `overflow` flag.
  Phase 1 and Phase 3 now carry both, and T790 asserts both.
- **CM5 [Major] — K6 quoted no assertion, and the no-op message text changes.**
  Added the Phase 0 grep for `Synthesis up to date` and `Use force` (both return
  no harness match today) and quoted the two constraining assertions
  (`test-output-contracts.ts:2149` asserts `up to date`; `test-backfill.ts`
  T102/T325 pass `force: true`). The user-impact line no longer claims the
  message shape is unchanged: the text moves to REQ-262b's form.
- **Minors.** m6: the guidance-resource gap is now a Phase 7 step, so V6 expects
  **four** sections, not three. m7: Q4 is decided — the `empty` map persists and
  the markers render. m8: Phase 7 names the spec-update record as a push-time
  artifact (Appendix V.4) so it is not mistaken for a missing close step. m9:
  DP-2's mechanism claim is corrected to the snapshot projection. Nits: EV20's
  T788 citation is `:2145`; the `[LOW]` payload's effect on recorded surface
  replays is stated as an assumption that V3 settles.

**Diff re-review findings v3 → v4** (same reviewer, one permitted re-review, 7
reads; every prior finding resolved or partially resolved, one new Blocker).

- **NB1 [Blocker] — the register was regenerated before the assembly it depends
  on.** `validate` reads the assembled `holonovel.md`, not `spec/` (EV29), so
  `--write-register` at the old step 3 would have rendered the pre-edit Appendix
  F and left the register stale after assembly — reddening V2 and V8. Fixed:
  Phase 6 is now clause → rows → `assemble` → G7 attestation →
  `validate -- --write-register` → clean `validate`, with the re-run rule stated.
- **NM1 [Minor] — the zero-cap check had to precede the no-op check**, else a
  disabled group reports "up to date" instead of `[STATE_CONFLICT]`. Phase 3
  step 1 is the zero check and T790 pins the ordering.
- **NM2 [Minor] — Open Q3 promised a register row Phase 7 never wrote.** Phase 7
  step 1 now adds the `Scheduled-roadmap` row beside the three flips.
- **NM3 [Minor] — "pure helpers" contradicted the status/refusal tail.** The
  module stays pure (hashes, rules, cap application); the zero-maximum refusal
  and the health status are handler adapters over the same table.
- **Nits.** N1: Phase 6 no longer misattributes the coverage audit. N2: `T325b`
  gains one Editor/observer read. N3: `plan.cold/report.md` exists and is what
  the stamp hashes.

**Cap deviation, recorded.** Standard depth permits one diff re-review; NB1 was
introduced *by* that re-review's fix round, so one further **scoped** pass
(≤6 reads, changed lines only) was authorized to confirm the ordering fix rather
than stamping a plan whose last verdict was `FAILED`. It is recorded here, not
hidden: the deviation is one targeted pass, not a new full sweep.


## Summary

The top open roadmap section (`ROADMAP.md:15-28`) carries the three P1 findings
the U6 sweep scheduled: no writer for the synthesis fingerprint (U6-F3), no
`[LOW]` provenance tag anywhere (U6-F4), and two of eight internal-synthesis
category rules with no cap enforcement at all (U6-F5). Each needs behaviour
change in `holonovel/src`, so U6 deliberately did not patch them.

This increment implements all three against the contracts already in §11:
a real fingerprint with per-module hashes and partial refresh, the `[LOW]` tag
in the briefing and in synthesis resource output, the six missing category rules,
and the per-pass and total-Novel caps with an overflow count. It also persists
the synthesis manifest in the Novel, because the fingerprint, the total caps, and
§11.3's "stored in the Novel JSON under a `synthesis` key" are all unsatisfiable
while the manifest lives only in process memory.

## Questions

1. **What is the next roadmap item?** `ROADMAP.md:15-28`, § *Synthesis-surface
   gaps (P1)*, carrying U6-F3 (`spec/audit/review-register.md:2997`), U6-F4
   (`:3006`) and U6-F5 (`:3013`). The other three open sections are blocked:
   the loop-gate re-measurement is date-gated to 2026-11-28 or 26 commits
   (`ROADMAP.md:30-40`), vendor-manifest provenance is P1 but rank-2, and the
   harness label hygiene item is P2 (`ROADMAP.md:42-60`).
2. **Is this one session?** It is one increment with a wide but bounded blast
   radius: one new core module, three existing core files, the adapter, two
   appendices' worth of test rows, and two harness files. It is larger than U6;
   K4 defines the branch if it does not fit.
3. **Why does persistence belong here and not in its own increment?** Because
   `state.wisdomManifest` is process-local (`holonovel/src/core/state.ts:1106`)
   and the persisted Novel projection has no synthesis key
   (`state.ts:3300-3310`, load at `:3495-3510`). A fingerprint that dies with
   the process detects nothing across a restart, and a "total Novel cap" over an
   in-memory array is not a Novel cap. §7.7 already names synthesis as Novel
   content (`spec/04-runtime.md:252`), so persisting it is conformant rather
   than a new surface. DP-2 records the alternative.
4. **Does this change the tool surface?** No tool, action, or parameter is added.
   `manage_synthesis` keeps its 14 actions (`holonovel/src/index.ts:16907`), so
   the REQ-429 budget, `check-tool-surface`, `surface-budget`, and
   `check-tool-definitions-sync` are untouched.

## Baseline at HEAD (this session)

| # | Evidence | Command / source | Trust |
|---|---|---|---|
| EV1 | Tree clean on `main`, 108 unpushed commits, version `2026.11.15`, 4 open roadmap sections | `npm run status` | tool-output |
| EV2 | Fast gate green: **45 passed, 0 failed**, trailing `check:fast: PASS` | `npm run check:fast` (un-piped) | tool-output |
| EV3 | The roadmap section, its three bullets, its trigger, and the three sections that follow it | `ROADMAP.md:15-28,30-40,42-60` | repo |
| EV4 | The three findings with their failing predicates | `spec/audit/review-register.md:2992-3017` | repo |
| EV5 | `run` is a boolean-guarded full rebuild: `state.enriched` gates it, then it rebinds `DEFAULT_WISDOM` and merges Novel-derived items | `holonovel/src/index.ts:16924-16936` | repo |
| EV6 | Novel-derived synthesis writes only `voice_examples` and `supplementary_guidance`, from entities, NPCs and the last journal entry, with no cap | `holonovel/src/index.ts:16148-16173` | repo |
| EV7 | The tag renderer knows only `[vendor]`/`[ruleset]`/`[player]`/`[supplementary]`; LOW items are sorted last but untagged | `holonovel/src/index.ts:16301-16307,16371` | repo |
| EV8 | Synthesis resource family and status render from the manifest, no provenance tag in the payload | `holonovel/src/index.ts:16364-16389` | repo |
| EV9 | Briefing synthesis block renders `wisdomTag(i)` plus `[<confidence>]` and sorts LOW last | `holonovel/src/index.ts:18249-18281` | repo |
| EV10 | `manifest._fingerprint` is read by `getWisdomHealth` and never written; `spec_health.synthesis_health.fingerprint` is the **spec** hash, not a synthesis fingerprint | `holonovel/src/core/state.ts:2628`; `holonovel/src/index.ts:15282` | repo |
| EV11 | The manifest is process state only; the persisted projection carries `synthesis_activated`, `synthesis_deactivated`, `synthesis_module_enabled`, `player_synthesis` and nothing else synthesis-shaped | `holonovel/src/core/state.ts:1106,3300-3310,3495-3510` | repo |
| EV12 | Canonical JSON plus `stateHash` already exist and are the right primitives for a fingerprint | `holonovel/src/core/state-hash.ts:36-38,62-68` | repo |
| EV13 | The ruleset content hash is available at runtime as `buildFingerprint.rulesetHash` (sentinel `ruleset-free`) | `holonovel/src/core/state.ts:53-62,1158-1166,1203` | repo |
| EV14 | §11.2 categories and the eight rules, the §11.3 caps table, the LOW rules, idempotence, partial refresh, and the verification checks that include "LOW-confidence items carry `[LOW]` tag in all badge views" | `spec/08-synthesis.md:57-69,70-124,198-217,231-243,250-258,277-286,295-302` | repo |
| EV15 | `TTRPG_MAX_SYNTHESIS_ITEMS` (default 15) is a declared per-module storage cap with an unused enforcement helper | `holonovel/src/core/limits.ts:27,42-49`; `spec/02-requirements.md:1979` | repo |
| EV16 | §7.7 names synthesis as Novel content, and §7.8 lists the synthesis env vars | `spec/04-runtime.md:252,157` | repo |
| EV17 | Existing synthesis assertions that constrain the redesign: T195, T321–T327, T102, T288 | `spec/appendices-reference.md:1612,1767-1773`; `holonovel/scripts/test-output-contracts.ts:2142-2151,2886-2900`; `holonovel/scripts/test-backfill.ts:1874,1970-1988,2010-2024` | repo |
| EV18 | Key names the harnesses assert: `novel-voice-*` (MEDIUM, inert), `novel-theme` (LOW), `Voice examples:` in the briefing | `holonovel/scripts/test-backfill.ts:1970-1988,2001-2008` | repo |
| EV19 | No `guidance://<badge>/voice` or `/tone` resource is registered, although §11.3 names them as synthesis renderers | `spec/08-synthesis.md:265-274`; `holonovel/src/index.ts:15742-15760,16329-16334` | repo |
| EV20 | Appendix F's last identifier is T788 (`:2145`); a suffixed `T<nnn>a` names a branch of its parent and needs no new row | `spec/appendices-reference.md:1430-1442` (heading and suffix rule), `:2145` (T788); `grep -o 'T[0-9]\{3\}' \| sort -u \| tail` | repo |
| EV21 | `test:all` (56 commands) is full-gate only, so server behaviour changes must be proven outside `check:fast` | `scripts/lib/gate-manifest.ts` (test:all row) | repo |
| EV22 | `DEFAULT_WISDOM` item counts and tags: `voice_examples` 1, `lore_templates` 1, `action_patterns` **8 with no `tag`**, `supplementary_guidance` 7 vendor, `adventure_advice` 4+4 vendor, `narrative_voices` 2 vendor, `briefing_order` one object | `npx tsx -e` over `DEFAULT_WISDOM` (`core/wisdom.ts:76-398`) | tool-output |
| EV23 | `DATA_FORMAT` is a hash of `DATA_SECTIONS`, which contains `### 7.7`; `PACKAGE_FORMAT` hashes `PACKAGE_SECTIONS`; §11 and Appendix F are in neither | `scripts/lib/contract-fingerprint.ts:27,37-43`; `scripts/check-fingerprint-sync.ts:34-47` | repo |
| EV24 | §7.7's Novel property table already declares **Synthesis** (`Ruleset Wisdom`, `read/write/revert`, REQ-262/103/263/265/260) as a persisted property group | `spec/04-runtime.md:265`, table at `:259-320` | repo |
| EV25 | The REQ-coverage audit parses each Appendix F row's REQ cell and byte-compares the rendered audit against `spec/audit/req-coverage.md`; a new row without regeneration is a validation error | `scripts/validate.ts:1804-1819,2131-2137` | repo |
| EV26 | Checkpoints and undo snapshots derive from `novelToJSON` via `novelToSnapshotJSON`, so any new persisted key enters both; `state.wisdomManifest` has exactly two writers | `holonovel/src/core/state.ts:3372-3383`; `holonovel/src/index.ts:16931,16941` | repo |
| EV27 | The current no-op text is "Synthesis up to date (`<collected_at>`). Use force=true to re-synthesize." and no harness asserts either phrase; REQ-262b's form is `[OK] Synthesis up to date — <ISO 8601 timestamp>` | `holonovel/src/index.ts:16928`; `spec/02-requirements.md:2783`; `grep -rn 'Synthesis up to date\|Use force' holonovel/scripts` (no match) | tool-output |
| EV28 | REQ-129c: a maximum of zero returns `[STATE_CONFLICT]`, and `spec_health` reports count and maximum per group with an `overflow` flag | `spec/02-requirements.md:1985` | repo |
| EV29 | `validate` reads the **assembled** spec, not `spec/`: `readSpec()` defaults to `<root>/holonovel.md`, and the coverage audit and the register's hash derive from that text | `scripts/lib/parse-spec.ts:9-16`; `scripts/validate.ts:2039,2172,2698` | repo |

## Scope

**In scope.** `holonovel/src/core/synthesis.ts` (new); `core/state.ts`
(NovelState field, serialize/deserialize, manifest hydration);
`core/limits.ts` (cap precedence helper); `index.ts` (`run` handler, briefing
render, synthesis resources, synthesis health); §11.3's caps precedence
sentence and two Appendix F rows; the two harness files that own the synthesis
tests; the register rows, the roadmap section, the CHANGELOG.

**Out of scope.** External (web) synthesis — it is build-time and offline
(§11.1); the missing `guidance://<badge>/voice|tone` resources (EV19) — a new
resource family moves the documented surface and belongs in its own increment;
`TTRPG_SYNTHESIS_AUTO_TRIGGER`'s trigger implementation (REQ-263a is already
surfaced and asserted); the loop-gate re-measurement, vendor-manifest provenance
and harness-label sections; any change to `DEFAULT_WISDOM`'s vendor items.

**Lens.** Contract-to-predicate: for every clause in the three findings' cited
regions, name the symbol that satisfies it after this increment, then prove it
with an assertion whose predicate is the clause.

## Decision points

- **DP-1 — what the fingerprint is composed of.** Spec: ruleset content hash +
  intake answers E1–E4 + Novel state hash, spec version excluded
  (`spec/08-synthesis.md:250-258`). At runtime the build fingerprint carries the
  ruleset hash (EV13) but the intake answers are build-time answers with no
  runtime representation (`grep -rn 'intake' holonovel/src` → one comment).
  Decision: `fingerprint = sha256("syn1|" + rulesetHash + "|" + intakeMarker +
  "|" + synthesisNovelHash)`, where `intakeMarker` is a stable canonical string
  of the runtime-observable synthesis configuration (`TTRPG_SYNTHESIS_AUTO_TRIGGER`,
  `TTRPG_MAX_SYNTHESIS_ITEMS`, `TTRPG_SYNTHESIS_STALE_DAYS`) and
  `synthesisNovelHash` is a hash over a **synthesis-relevant projection**, not
  the whole Novel, so narration bookkeeping does not invalidate synthesis.
  Recorded in `holonovel/DECISIONS.md`; the E1–E4 gap is named in the AAR.
  *Rejected:* hashing the whole Novel (`stateHash`). It would change on audit
  bookkeeping, session ids and narration counters, so synthesis would re-run on
  every turn — the opposite of the contract. The projection is the narrow,
  stated alternative.
- **DP-2 — persist the manifest. DECIDED (operator, 2026-11-15): include.**
  The Novel persists **only internal items** — those whose `source_url` starts
  `novel://` — plus `fingerprint`, `module_hashes`, `empty`, `collected_at` and
  the existing activation maps. The vendor/ruleset tier is never persisted with
  the Novel: it is build output (REQ-080) and a persisted copy would shadow a
  freshly built Ruleset Wisdom after a ruleset bind. Hydration order is fixed:
  rebuild `DEFAULT_WISDOM` (and its keys), then re-merge the persisted internal
  items. Hydration points are Novel activation, `manage_history (action:
  undo/redo)`, `checkpoint_restore`, and `manage_archive (action: import)`,
  because checkpoints and snapshots carry the key (EV26). A target Novel with
  `synthesis === null` sets `enriched=false` and `manifest=null`, so switching
  to a Novel that never ran synthesis cannot leave the previous Novel's items
  live. §7.7 already classifies synthesis as a Novel property group (EV24) and
  `DATA_FORMAT` is unchanged (EV23); checkpoints and clone inherit the key
  because `novelToSnapshotJSON` derives from `novelToJSON` (EV26), not because a
  file is copied. The alternative — in-memory only, persistence scheduled
  separately — is rejected by the operator; K4 is the only branch that may
  abandon it, and that branch commits nothing.
- **DP-3 — which cap binds when two do.** §11.3 gives total-Novel caps of
  50/1/30/10/20/30/15 while REQ-129b1 declares `TTRPG_MAX_SYNTHESIS_ITEMS`
  (default 15) per output module (EV15). Decision: the effective total cap is
  `min(§11.3 total, TTRPG_MAX_SYNTHESIS_ITEMS)`; the binding cap and the
  overflow count are reported in the `run` result and in `spec_health`'s
  synthesis group (count, maximum, `overflow` — REQ-129c, EV28). A value of zero
  makes `run` return `[STATE_CONFLICT]` naming the group and the count/max
  (REQ-129c), rather than silently writing nothing. The capped set is **internal
  items only** — those whose `source_url` starts `novel://` — because build
  output is not synthesis and `DEFAULT_WISDOM.action_patterns` is untagged
  (EV22, B1). One clause is added to §11.3 recording this precedence, and the
  divergence is noted in DECISIONS.md rather than silently chosen.
- **DP-4 — how `[LOW]` is "visible" in a JSON resource.** Decision: one helper
  returns the literal tag string (`[supplementary] [LOW]`); the briefing renders
  it as the provenance prefix (replacing the separate `[<confidence>]` it emits
  today, so the pair appears once), every JSON resource payload gains a
  `provenance` string field carrying it, and the Markdown resources prefix it on
  the rendered line. `manage_synthesis (action: list)` rows carry it too, so the
  three readable surfaces agree. *Rejected:* a boolean `low_confidence` flag —
  it is not the "visible tag" the spec names, and it would put the rendering
  decision in each consumer.

## Phase 0 — preconditions

1. `git status --porcelain` empty; `git rev-parse --short HEAD` recorded. If
   either differs from the evidence table, re-baseline EV1–EV21 before the first
   edit.
2. `npm run check:fast`, un-piped, prints `45 passed, 0 failed` and
   `check:fast: PASS`. A red baseline is fixed first, as its own commit.
3. Confirm the three register rows are still `Scheduled-roadmap` (EV4) and the
   roadmap section still names them (EV3). A row already resolved by another
   increment narrows this plan before any code is written.
4. Create `docs/plans/2026-11-15-synthesis-surface-gaps/` with `plan.md` (this
   document) and an authored `tasks.md`; `review.md` is not used (this is not a
   review increment) and `aar.md` is written in Phase 7.
5. **Sibling-contract probe (M2).** Enumerate every REQ that binds the surfaces
   this increment changes and confirm none contradicts DP-1 or DP-3:
   `grep -n 'synthesis_fingerprint\|synthesis_health\|manage_synthesis (action:'
   spec/02-requirements.md` → the set is REQ-160, REQ-262, REQ-263, REQ-264,
   REQ-265, REQ-266, REQ-130, REQ-129, REQ-103. A contradiction (for example a
   REQ that pins the fingerprint to intake answers alone) stops the increment
   and becomes a register finding, not an implementation choice.
6. **File-surface probe (M3).** Confirm each of the four surfaces the change
   crosses, by file: the tool schema and descriptions (unchanged,
   `index.ts:16906-16921`), the storage seam (`core/state.ts` serialize
   `:3300-3310`, load `:3495-3510`, hydrate path found with
   `grep -n 'activeNovel ='`), the read surfaces (`index.ts:16364-16389`,
   `:18249-18281`, the `list` case), and the harnesses named in Phase 5. A
   surface with no home is a plan defect, not an implementation discovery.
7. **DATA_FORMAT audit (M1).** `npm run check-fingerprint-sync` is green at HEAD
   and must still be green after the change, because the edition edits no
   `DATA_SECTIONS` member (EV23) and §7.7 already declares the group (EV24).
   Record the pre-edit output; if the loader cannot default the new field, stop
   and take K1.
8. **No-op text probe (CM5).** `grep -rn 'Synthesis up to date\|Use force'
   holonovel/scripts` must return nothing (EV27); if it does, the exact-string
   assertion is named in T321a's edit rather than discovered at V3.

## Phase 1 — `core/synthesis.ts` [build tool: pure helpers]

One new module holds the whole computation so `index.ts` only wires it. Pure,
deterministic, no wall-clock in any hash (timestamps are item data, never hash
input).

1. `SYNTHESIS_MODULES` moves here and `index.ts` imports it, replacing the local
   const at `index.ts:16127` — one import, no behaviour change.
2. `synthesisProjection(novel)` — the synthesis-relevant slice: entities
   (id/name/personality voice, description, goals), NPCs, lore entries
   (key/content/triggers/group/badge_scope), `story_journal`, `scene_history`
   plus the current scene fields, factions, secrets, relationships, countdowns,
   world rooms/things (`readable`, `description`, `read_text`, exits, contents).
   Canonicalised with `canonicalJson` (EV12) so insertion order cannot change a
   hash.
3. `moduleSourceHashes(novel)` — a SHA-256 per output module over only the
   projection subset that feeds it, per §11.2's category table
   (`spec/08-synthesis.md:60-68`).
4. `synthesisFingerprint({rulesetHash, intakeMarker, novelHash})` — DP-1.
5. `synthesizeFromNovel(manifest, novel, {force})` — the eight rules
   (`spec/08-synthesis.md:70-124`), each producing deterministic keys and a
   `novel://<slug>/...` source URI, returning
   `{fingerprint, module_hashes, per_module: [{module, produced, preserved, replaced, overflow, empty_reason}], empty, up_to_date}`.
   Rule 4 keeps the existing `novel-theme` key in `supplementary_guidance` and
   adds the narrative-voice profile, because the §11.2 table routes the journal
   to three modules and EV18 fixes the key.
6. Caps (DP-3) are applied here, not in the handler, so the rule set and the
   budget cannot drift apart. Active (GM-activated) items are never dropped
   (REQ-130b). The module stays pure: the hashes, the rules and the cap
   application are functions of `(manifest, novel, caps)`; the zero-maximum
   refusal and the `spec_health` group status (`{count, max, overflow}`,
   REQ-129c, EV28) are thin adapters in the handler that read the same table.

## Phase 2 — persistence (DP-2)

1. `NovelState.synthesis` (nullable):
   `{fingerprint, module_hashes, empty, collected_at, modules: Record<module, item[]>}`
   where `modules` holds **internal items only** — filter on
   `String(item.source_url ?? "").startsWith("novel://")` — plus the existing
   activation maps stay in their own fields. Vendor/ruleset items are never
   written to the Novel (REQ-080).
2. Add it to the persisted projection beside `player_synthesis`
   (`core/state.ts:3300-3310`) and to the loader with a normalizer default
   (`:3495-3510`), so a pre-existing Novel file loads unchanged.
3. Hydrate on every path that installs or replaces `state.activeNovel`
   (found with `grep -n 'activeNovel ='`) **and** on `manage_history (action:
   undo/redo)`, `checkpoint_restore`, and `manage_archive (action: import)`,
   because snapshots and checkpoints carry the key (EV26). Merge order: clear
   the manifest, set `state.wisdomManifest = withWisdomKeys(DEFAULT_WISDOM)`,
   then re-merge the persisted internal items. A target Novel with
   `synthesis === null` sets `enriched=false` and `manifest=null`.
4. `manifest._fingerprint` is written by `run` (EV10 is the read that currently
   always returns null) and `spec_health.synthesis_health.fingerprint` reports it
   instead of `SPEC_HASH`.

## Phase 3 — `manage_synthesis (action: run)`

Rewrite `index.ts:16924-16936`:

1. A zero `TTRPG_MAX_SYNTHESIS_ITEMS` returns `[STATE_CONFLICT]` naming the
   synthesis group with count/max (REQ-129c, EV28) **before** the no-op check,
   so a disabled group never reports "up to date" (NM1).
2. Compute the fingerprint; when it equals the stored one and `force` is not set,
   return REQ-262b's form `[OK] Synthesis up to date — <collected_at ISO>` and
   write nothing. The current text is "Synthesis up to date (`<ts>`). Use
   force=true …" (EV27); no harness asserts it, and the new form is the one
   T321a pins.
3. Otherwise run a pass: unchanged modules keep their items, timestamps and
   activation state untouched (§11.3 partial refresh, `:277-286`); changed
   modules replace only inactive internal items (REQ-130b) and keep the vendor
   tier untouched.
4. Persist the internal items into the Novel (`state.saveNovel`), write
   `synthesis` on the persisted projection, and audit `synthesis_run` with the
   fingerprint, changed module list, and overflow.
5. Report per-module counts, the overflow count, the `[empty]` markers
   (`spec/08-synthesis.md:322-324`), and the group status that `spec_health`
   also reports (count, maximum, `overflow`).
6. `revert` clears the manifest and `novel.synthesis`; the fingerprint goes with
   it, so a post-revert run is never a false no-op.

## Phase 4 — `[LOW]` provenance (DP-4)

1. Replace `wisdomTag` (`index.ts:16301-16307`) with `provenanceTags(item)`
   returning the pair; update the briefing render (`:18249-18281`) to use it and
   drop the now-duplicated `[<confidence>]`.
2. Add `provenance` to every JSON resource payload (`:16364-16389`) and prefix
   the Markdown renderings (`synthesis://narrative_voices`,
   `synthesis://status` per-module LOW counts).
3. Add `provenance` to the `manage_synthesis (action: list)` rows so the tool
   output and the resources agree.

## Phase 5 — tests

Following EV20: new branches of existing tests take suffixed identifiers; only
genuinely new contracts get new Appendix F rows.

1. `test-backfill.ts` synthesis block (beside `:1970`):
   - `T321a` — a re-run with unchanged state is a no-op ([OK] + unchanged
     `collected_at`), while editing an NPC personality changes the fingerprint
     and refreshes only the affected module; an activated item survives both;
     a restart, an undo, and a checkpoint restore re-hydrate the same manifest
     (EV26).
   - `T325a` — a LOW item renders `[LOW]` in `badge_briefing`, in its
     `synthesis://<module>` payload and in the `list` row.
   - `T325b` — the same item under the **Player** badge (and one Editor/observer
     read via `set_badge("none")`): a `shared`-scoped LOW item keeps `[LOW]` in
     the badge-filtered briefing and resource payload, while a
     `game_master`-scoped LOW item is absent from both
     (`spec/08-synthesis.md:295-302`, CB1, N2).
2. New rows in `spec/appendices-reference.md` (Appendix F, after T788 at
   `:2145`), each with a REQ cell (`scripts/validate.ts:1804-1819`, EV25):
   - `T789` — the six remaining category rules: lore cross-reference,
     narrative-voice profile, scene hooks, faction/secret tension, countdown
     urgency, rooms/things advice and lore links; each asserted by a populated
     fixture with a stable key and a `novel://` source. REQ-262b, REQ-264a.
   - `T790` — caps: per-pass limits, total-Novel limits, the
     `TTRPG_MAX_SYNTHESIS_ITEMS` precedence, the overflow count in the result
     and in `spec_health`, the untagged-item exemption, and `[STATE_CONFLICT]`
     at a zero maximum. REQ-160, REQ-129.
3. Harness placement: `holonovel/scripts/test-backfill.ts` (stateful) and
   `holonovel/scripts/test-output-contracts.ts` (surface). No new harness file,
   so `test:all`'s command count and the harness guard are unchanged.

## Phase 6 — spec edit, assembly, and register regeneration

Order matters, because `validate` reads the **assembled** `holonovel.md`
(`scripts/lib/parse-spec.ts:9-16`; `scripts/validate.ts:2172`), not `spec/`
(EV29):

1. `spec/08-synthesis.md:198-217` — one clause stating DP-3's precedence.
2. `spec/appendices-reference.md` — rows T789 and T790 with their REQ cells.
3. `npm run assemble` — rewrites `holonovel.md`, `holonovel/holonovel.md` and
   the build-phase-map content hash.
4. `npx tsx holonovel/scripts/generate-g7-attestation.ts` — rewrites the
   attestation and its G7 table.
5. `npm run validate -- --write-register` — regenerates
   `spec/audit/req-coverage.md` from the now-current Appendix F REQ cells
   (EV25), then re-run `npm run validate` clean. Regenerating before assembly
   would render the old table and leave the register stale, reddening V2 and V8.

Any later `spec/` edit requires re-running steps 3–5.

## Phase 7 — records and close

1. `spec/audit/review-register.md:2997-3017` — each of the three rows flips to
   `Resolved` with the closing commit and the satisfying predicate; no row
   changes wording that another register cross-references. In the same step, add
   the new P1 `Scheduled-roadmap` row for the `guidance://<badge>/voice|tone`
   gap (NM2).
2. `ROADMAP.md` — delete the section (`:15-28`) because its trigger closes when
   all three findings are `Resolved`, and add one new section for the
   `guidance://<badge>/voice|tone` gap found in this session (P1, with its
   trigger). Four sections remain and `check-roadmap` passes.
3. `holonovel/DECISIONS.md` — one dated entry recording DP-1, DP-2 and DP-3.
4. `CHANGELOG.md` — the dated section whose heading becomes the commit subject;
   the date must equal the session date.
5. `aar.md` with the done-bar verdict and a terminal token. The
   `### Holonovel Spec Update` entry and the `**Spec hash:**` sync are push-time
   artifacts (Appendix V.4), not close steps — the AAR records that they are
   owed at the next publish.
6. `npm run session:close` (one commit).

## Blast radius

| Surface | Files | Change |
|---|---|---|
| New source | `holonovel/src/core/synthesis.ts` | L — rules, hashes, caps |
| Source | `holonovel/src/core/state.ts`, `core/limits.ts`, `index.ts` | M–L — persistence, hydration, handler, render |
| Spec | `spec/08-synthesis.md`, `spec/appendices-reference.md` | S — one clause, two rows |
| Generated | `holonovel.md`, `holonovel/holonovel.md`, `spec/build-phase-map.md`, `holonovel/src/generated/g7-attestation.ts`, the G7 table in `holonovel/DECISIONS.md` | M — by Phase 6 |
| Tests | `holonovel/scripts/test-backfill.ts`, `test-output-contracts.ts` | M |
| Register | `spec/audit/req-coverage.md` | S — regenerated by `validate -- --write-register` (EV25) |
| Records | `review-register.md`, `ROADMAP.md`, `holonovel/DECISIONS.md`, `CHANGELOG.md`, increment directory | S–M |
| Not touched | `core/wisdom.ts` item data (read only), tool/action/parameter surface, `contract-fingerprints.ts`, `scripts/lib/contract-fingerprint.ts`, `scripts/check-fingerprint-sync.ts`, `holonovel/testdata`, `holonovel/scripts/fixtures/` | — |

`check-fingerprint-sync` stays green: §11.3 and Appendix F are not
`PACKAGE_SECTIONS`/`DATA_SECTIONS` members (EV23), §7.7 already declares the
synthesis property group (EV24), and no §5 REQ body is edited. The two
fingerprint scripts are examined, never edited.

## Verification

Run un-piped, recording each exit status:

| # | Command | Expected |
|---|---|---|
| V1 | `npm run assemble` | exit 0; build-phase-map hash updated |
| V2 | `npm run check:fast` | `45 passed, 0 failed`, `check:fast: PASS` |
| V3 | `npm --prefix holonovel run test:all` | 56 commands pass — the only suite that runs the synthesis harnesses (EV21) |
| V4 | `npm run check-g7-attestation` | pass — attestation regenerated after the last spec edit |
| V5 | `npm run check-registers:strict` | pass — three rows `Resolved`, no orphan cross-reference |
| V6 | `npm run check-roadmap` | pass — four sections (three existing + the new guidance-resource section), no `Non-goals` drift |
| V7 | `npm run check-fingerprint-sync` | pass — no fingerprint-bearing section edited |
| V8 | `npm run lint` and `npm run validate:sdd` | 0 errors; proofreading warnings are informational |
| V9 | `npm run check-loop-artifacts` | pass — plan/tasks/AAR present, terminal token present |
| V10 | `npm run check-traceability` | pass — the new DECISIONS entry adds no unregistered tool or resource |
| V11 | `npm --prefix holonovel run test:persistence` and `test:holosuite-differential` | pass — the persisted field and the state hash survive save/load and stay stable across identical runs (M4) |

## User impact

- **No client change.** No tool, action, parameter, prompt, or resource is added
  or removed. One message changes text: `run`'s no-op reply moves from
  "Synthesis up to date (`<ts>`). Use force=true …" to REQ-262b's
  `[OK] Synthesis up to date — <ISO 8601 timestamp>` (EV27).
- **Visible improvement.** Synthesis items now survive a restart (previously
  they vanished, and `spec_health.synthesis_active` reported false until a fresh
  run), and a second run against unchanged state is a no-op instead of a rebuild.
- **State-file growth.** Bounded by DP-3's caps — worst case the sum of the seven
  total caps — and visible in `spec_health.file_size` like every other group.
- **Behaviour change to expect in play.** `[LOW]` items render a tag in the
  briefing, and a module whose source category has data but items marked empty
  reports `[empty]` markers instead of silence.
- Change sizing: L · rollback cost **1** (one revert; no external state, no
  migration).

## Risks and rollback

| # | Risk | Mitigation |
|---|---|---|
| K1 | Persisting the manifest changes the Novel file, the state hash, checkpoint payloads and replay baselines | The field is optional with a normalizer default; V3 and V11 are the authority; if the loader cannot default it or the differential/persistence harnesses fail on churn, stop before the commit (K4) and re-plan the serializer — do not silently advance `DATA_FORMAT`, which forces §7.7 edits and fingerprint regeneration |
| K2 | Caps truncate build output and break `DEFAULT_WISDOM` assertions | Caps apply only to internal items (`source_url` starting `novel://`), never to tag-derived classes, because `action_patterns` is untagged (EV22, B1); asserted by T790 |
| K3 | Existing key names regress (`novel-voice-*`, `novel-theme`) | Phase 1 rule 4 keeps them; the rules add namespaced keys beside them |
| K4 | Three findings plus spec rows exceed one session | No commit: unrun phases stay `UNSET` in the AAR, the roadmap section stays open, the remainder is scheduled as a new dated section, and `check-loop-artifacts` is not satisfied, so nothing lands half-done |
| K5 | `[LOW]` duplication in the briefing breaks an exact-string assertion | V3 first; the render change is additive at the line level (prefix), and the duplicate confidence bracket is removed in the same edit |
| K6 | `run` becoming a no-op breaks a harness that expects a rebuild | The two constraining assertions pass `force: true` or change state — `test-backfill.ts` T102 (`:2011,2019`) and T325 (`:1982`); `test-output-contracts.ts:2149` only asserts the substring `up to date`. Phase 0 step 8 re-greps for the old no-op text (EV27) |
| K7 | The new persisted key silently changes the documented data format | `DATA_FORMAT` is spec-derived (EV23) and does not move; Phase 0 step 7 records the pre-edit check, V7 confirms it after the edit |
| K8 | In-memory manifest and `novel.synthesis` diverge after undo, checkpoint restore, archive import, or a Novel switch | Phase 2 step 3 names all four hydration points and the null branch; `T321a` asserts restart, undo, and restore |
| K9 | The `provenance` field moves a recorded surface replay | It is an additive JSON field on three resources; `surface-replay` and `check-tool-surface` run inside V2, and V3 runs the harnesses that read those payloads |

Rollback: `git revert <commit>` restores every file above at once, including the
regenerated assembly output and attestation. Cost 1 — reversible, no external
state, no data migration (a Novel written with the new field loads under the old
code because the loader ignores unknown keys).

## Commit plan

One commit via `npm run session:close` (a spec increment stays one commit). V1–V11
must pass first; a failing tree stops and reports. On the K4 branch no commit is
made. The CHANGELOG heading's date is the commit subject's date (`session:close`
derives the subject from the top heading), so Phase 7 writes it with the session
date before the AAR.

## Done bar

1. U6-F3 `Resolved`: a fingerprint writer exists, per-module hashes are stored,
   an unchanged fingerprint is a no-op, and a changed module alone is refreshed
   (`T321a`).
2. U6-F4 `Resolved`: `[LOW]` appears in `badge_briefing`, in every synthesis
   resource payload, in `list`, and in the Player badge views (`T325a`,
   `T325b` — `spec/08-synthesis.md:295-302`).
3. U6-F5 `Resolved`: all eight category rules have a predicate (`T789`), and the
   per-pass and total caps are enforced with an overflow count in the result and
   in `spec_health`, including `[STATE_CONFLICT]` at a zero maximum (`T790`).
4. The three register rows carry `Resolved`; `spec/audit/req-coverage.md` is
   regenerated and fresh (V2); `ROADMAP.md` no longer holds the section and now
   carries the guidance-resource section (V5, V6).
5. V1–V11 pass, each recorded un-piped with its exit status.
6. `aar.md` states the done-bar verdict and ends `LOOP PAUSED`; one commit whose
   subject derives from the top CHANGELOG heading.

Not part of the bar: external/web synthesis, the `guidance://<badge>/voice|tone`
resources themselves (scheduled, not built), any change to `DEFAULT_WISDOM`
content, and the three untouched roadmap sections.

## Open questions

1. **Does DP-1 satisfy "intake answers"?** Not literally — E1–E4 are build-time
   answers with no runtime representation. The plan substitutes the
   runtime-observable synthesis configuration and records the gap. If the
   operator wants literal conformance, a `synthesis_intake` field must be added
   to the build fingerprint at build time, which is a builder-side increment.
2. **Does persistence change the documented data format? Resolved.** No —
   `DATA_FORMAT` is a hash of `DATA_SECTIONS` (EV23), §7.7 already declares the
   Synthesis property group (EV24), and the new key is additive and defaulted on
   load. `NOVEL_FORMAT_VERSION` (`core/state.ts:40`) stays 2. K1 carries the
   branch where the loader cannot default it.
3. **Is `guidance://<badge>/voice|tone` a fourth finding? Resolved.** It is a
   spec-named renderer that does not exist (EV19). Phase 7 records it as a new P1
   row in `review-register.md` and adds a dated `ROADMAP.md` section for it, since
   a new resource family moves the documented surface. It is not built here.
4. **Does `[empty]` need persisted markers? Resolved.** Yes — modules with a
   populated source category and no produced item carry one, persisted in the
   `empty` map so a restart reports the same state. If V3 shows an existing
   assertion on a module's emptiness, the marker moves to the `run` result only
   and the persisted map is dropped; that is a one-line amendment, not a
   re-plan.

## Amendments (execution)

1. **`scripts/validate.ts` joins the blast radius (2026-11-15).** `validate`'s
   REQ-454 check flags a whitelisted intended-gap REQ cited in server source
   without a disposition. `core/synthesis.ts` cites REQ-130 (the rebuild
   contract it now implements), which the whitelist classified as builder-side,
   so one `INTENDED_GAP_CITED_DISPOSITIONS` row records the split: a/c are
   server-runtime (implemented here), b's DECISIONS.md record is builder-side.
   One line; no behaviour change; no gate weakened.
2. **`T325b` asserts the GM and Editor views positively and the Player view
   negatively.** No internal item can be `shared`-scoped until REQ-265's scope
   override exists, so a player-visible LOW item is structurally unreachable;
   the tag itself is computed independently of scope, and the Player assertion
   proves the scope filter, not a missing tag.
3. **Rule 6's shared-secret branch is implemented but unreachable** through
   `manage_lore (action: reveal)`, which accepts entity ids only. Scheduled as
   `ROADMAP.md` § *Faction knowledge on secrets (P2)*; the register row records
   it.
4. **Evidence anchors drift with the edit (2026-11-15).** Any line shift in
   `holonovel/src/index.ts` or `core/state.ts` invalidates the recorded
   `(file, line, symbol)` anchors the Holosuite evidence tiers assert, so
   `npm run fix-anchors` joins Phase 6 and the four `holonovel/scripts/lib/holosuite-*.ts`
   files join the blast radius. The plan's verification table named
   `check-anchors` only implicitly through `check`; it is a named step now.
