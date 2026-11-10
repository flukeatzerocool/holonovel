# Plan — Full-review sweep, chunk P8 and the closing M1 re-run

**Status:** draft, awaiting user approval · **Date:** 2026-11-09 · **Depth:** standard
**Review independence:** fresh — one cold pass at `/tmp/opencode/p8-cold/report.md`,
plus one targeted diff re-review of the applied findings. The cold pass raised 3
blockers and 5 majors; all are applied (or recorded as observations), together
with its nine minor findings.
**Rollback cost:** 1 (2 if a C0 baseline fix lands first)
**Roadmap item:** `ROADMAP.md` § Remaining full-review sweep (P1) — the last
open chunk of the sweep
**Predecessor:** `docs/plans/2026-11-09-full-review-p7b/` (chunk P7b, closed
2026-11-09, `LOOP PAUSED`)
**Tracker:** `docs/plans/2026-11-09-full-review-sweep/worklist.md`

## Review status

Drafted against the live tree at `edc7062` (clean, 19 commits unpushed). Chunk
P8 is the next scheduled unit: the roadmap's `**Trigger:**` names it explicitly,
and the sweep worklist row fixes its surface at `core/{belief,identity,causal,
subjective,perception,memory,divergence}.ts` over §5.12 and §5.25–§5.27,
§5.32–§5.35. The worklist's Q1 (the *inclusion* of §5.32–§5.35) was answered in
D1 and is settled, so the worklist's "pending Q1" note is stale and is corrected
by this increment; this plan's Q1 is the separate whole-vs-split question.

Measured this session: **166 REQs across 113 family rows**, 165 bucket C and one
bucket E (`REQ-593`) at header level — **112 C / 1 E at row level** — against
P7b's 189/76. P8 carries 37 more family rows than P7b on 23 fewer REQ headers,
because §5.12's 31 rows expand to 84 headers (`REQ-335a`–`REQ-346b`, the
coupling advisories `REQ-355`–`REQ-365`, and the observer narrative surface
`REQ-366a`–`REQ-366d`).

The two halves are not alike:

- **§5.12 is derivation-heavy and mechanised in two places.** 84 REQs / 31 rows,
  all bucket C. The server keeps the canonical list in `SECTION_512_REQS`
  (`holonovel/src/index.ts:325`, 31 base REQs excluding the §5.2 builder-side
  `REQ-354`) and derives the `narrative_coherence` attestation from it at
  `index.ts:12295-12300`. Independently, the coverage register derives its
  per-REQ disposition column from the row's section name and bucket
  (`scripts/validate.ts:2060-2066`): §5.12 bucket A is `gap`, B is `partial`,
  anything else is `implemented`. The two are not cross-checked.
  Separately, `scripts/validate.ts:1866` is a stranded comment that points at
  the server-side list from the wrong file. The review work is confirming that
  `SECTION_512_REQS` covers all 31 register rows and 84 headers, that each
  `implemented` disposition is backed by source at its anchor, that every
  `Automated` citation is exercised, and that the coupling advisories resolve.
- **The cognition sections are code-backed and thin on rows.** §5.25 (12/12),
  §5.26 (21/21), §5.27 (12/12), §5.32 (8/8), §5.33 (7/7), §5.34 (4/4),
  §5.35 (18/18) are row-for-row in the register. Their code sits in seven small
  modules (59–431 lines) and in three handlers that already own the actions:
  `manage_belief` (`index.ts:8234`, which dispatches the `perception_*` and
  `subjective_*` actions), `manage_identity` (`:8479`), and `manage_causality`
  (`:5820`).

**Drafting signal, not a verdict.** Every cited test token in P8's 113 register
rows resolves literally to a harness file; no token is unresolved. The
mis-attribution signal is **ID reuse**, not absence: `T408`–`T412` are test
titles in *both* `test-narrative.ts` (coupling advisories, `:767-813`) and
`test-backfill.ts` (unrelated `spec_health`/budget assertions, `:722-821`),
while `T396`/`T403` appear only in `test-g7` and `T514`/`T726` only in
`test-competitive-gaps`. At most one title per reused ID can implement the
Appendix F assertion the REQ cites. The expected finding class is therefore
**exercise-gap and cross-harness ID shadowing** (a sibling of the roadmap's
P2 harness-ID-hygiene item), not wholesale citation absence. The review must
confirm or refute this per row; nothing here pre-files a finding.

## Done bar

**Done bar:** this increment only — chunk P8 and the closing M1 re-run, which
together complete the sweep. The bar is met when all ten items hold; anything
else found is scheduled, not chased.

1. `docs/plans/2026-11-09-full-review-p8/` carries `plan.md`, `tasks.md`, and
   `aar.md`, and `aar.md` ends in `LOOP PAUSED` or `LOOP OPEN`.
   `check-loop-artifacts` passes.
2. The sweep `worklist.md` holds a chunk P8 section with **one row per in-scope
   REQ — 166 rows**: every REQ header in §5.12 (84), §5.25 (12), §5.26 (21),
   §5.27 (12), §5.32 (8), §5.33 (7), §5.34 (4), and §5.35 (18), enumerated in
   document order. The enumeration command is `grep -n '^\*\*REQ-'` over each
   section range (`spec/02-requirements.md` lines 3517–3764, 4167–4195,
   4196–4241, 4242–4271, 4340–4359, 4360–4376, 4377–4390, 4391–end),
   re-derived at Phase 0 step 7. Each row carries columns
   `REQ | Section | Bucket | Verdict | Note`, with the bucket inherited from the
   base family row in `spec/audit/req-coverage.md` and a verdict of `holds`,
   `finding:<ID>`, `builder-side`, or `deferred:<chunk>`, where `<ID>` is
   written `F-P8-N (P<n>)` — one shape for the token everywhere it appears.
3. The same section holds a **code-surface table of nineteen behaviour rows**
   (listed under *Code-surface behaviour rows*), each with a `file:line` anchor
   recorded at Phase 1 step 8, the carrying evidence, and a verdict. Table shape
   is the P5–P7 one: `Behaviour | Anchor | Harness | Verdict`; cluster verdicts
   `Cluster | REQs | Verdict | Evidence`.
4. Every `finding:<ID>` names a `file:line` or `spec:line` predicate and a
   P-severity, and has a terminal disposition recorded as
   `finding:F-P8-N (P0|P1|P2|P3)`; a P0 fixed in-session reads
   `finding:F-P8-N (P0, resolved in-session)`.
5. Zero open P0 findings remain. A P0 that cannot be fixed inside the session
   stops the run and still lands as a record (see **Stopped-run landing**).
6. Each of the five clusters (A–E below) has a recorded verdict, and a cluster
   verdict is the worst-of its own REQ rows under the order `finding` >
   `deferred` > `builder-side` > `holds` (within `finding`, the highest
   severity wins; ties go to the lowest `F-P8-N`). Every REQ has exactly one
   owning cluster.
7. `spec/audit/review-register.md` carries every P8 finding under the section
   its disposition names; no `Scheduled-roadmap` row is written without its
   matching `ROADMAP.md` entry, and every `REQ-NNN` token in a
   `Scheduled-roadmap` row appears literally in `ROADMAP.md`
   (`scripts/lib/register-checks.ts`, enforced by
   `npm run check-registers:strict`).
8. The closing **M1 machine-evidence re-run** is executed over the post-P8 tree:
   `npm run check:conformance`, `npm run fmea`, and `npm run graph-deps` run
   un-piped, their exit statuses are recorded, outputs are archived under
   `/tmp/opencode/sweep-p8/`, and the summary lands in `worklist.md` as a
   **Delta amendment** (not `plan.md`, so the stamped plan hash stays valid).
   `check:conformance` exits 0.
9. `ROADMAP.md` drops the § Remaining full-review sweep (P1) section: the work
   ships, so the section leaves the roadmap and moves to `CHANGELOG.md` per the
   admission rule. Any P1 findings scheduled by triage add remediation
   section(s) of 1–3 bullets with a `**Trigger:**`, each bullet naming its
   `REQ-NNN` IDs. `npm run check-roadmap` passes either way.
10. These exit 0 un-piped: `npm run assemble`, `npm run check:fast`,
    `npm run check`, `npm --prefix holonovel run test:all`, and the targeted
    harnesses named in **Verification**. The increment is one commit, made after
    the closing M1 re-run lands in Phase 4, subject derived by
    `npm run session:close` from the `CHANGELOG.md` heading; a conditional C0
    baseline fix precedes it as its own commit. No push.

## Open questions (answers recorded as decisions before execution)

- **Q1 — Execute chunk P8 whole, or split §5.12 from the cognition sections?**
  (The worklist's separate Q1 — §5.32–§5.35 inclusion — is already settled by
  D1.) Measured: 166 REQs / 113 rows. §5.12 is 84/31 and independently derived;
  the cognition sections are 82/82 across seven small modules.
  **Recommendation:**
  one increment. The sweep's last unit should close whole; splitting leaves the
  roadmap item open and forces a second post-P8 M1 tree. The halt rule (Q10)
  covers the time risk.
- **Q2 — Fix policy.** D2/D13/D62 unchanged: P0 fixed in-session (bounded), P1
  scheduled on `ROADMAP.md`, P2 fixed only on a demonstrated failure, P3
  record-and-close. **Recommendation:** adopt.
- **Q3 — Increment record.** New directory
  `docs/plans/2026-11-09-full-review-p8/`; the sweep `worklist.md` stays the
  cross-session tracker and carries the P8 tables and decisions D101 onward
  (D100 is the last recorded). **Recommendation:** yes.
- **Q4 — Bucket resolution.** Resolve by base family ID from
  `spec/audit/req-coverage.md`, never by section membership. Measured this
  session: 113 rows, 112 bucket C and one bucket E (`REQ-593`, §5.34). Re-verify
  at Phase 0 step 7. **Recommendation:** yes.
- **Q5 — Boundaries (one rule, no overlap).** (a) §5.12 is reviewed in full
  here, including the coupling advisories REQ-355–REQ-365 and the observer
  narrative surface REQ-366a–REQ-366d, even though some of its nouns (scene,
  faction, lore, countdown) were read in P7b and P3b — those sections own their
  REQs; the §5.12 REQ bodies are owned here. (b) §5.13
  holodeck coupling, §5.14 content sources, and §5.15 mechanical coupling stay
  with their closed chunks. (c) §5.33 briefing consistency is reviewed here;
  briefing *rendering* shared with §5.6/§5.8 is read for the §5.33 predicates
  only, and a defect in a §5.6/§5.8-owned behaviour is cross-referenced, not
  re-filed. (d) Storage mechanics in `core/state.ts` stay `Closed-P3` under
  P4; P8 reviews the cognition records' shape and lifecycle, not the store.
  (e) §5.25–§5.27 and §5.32 are in `DATA_SECTIONS`, so a REQ-body edit there is
  a fingerprint change (Q8). **Recommendation:** adopt.
- **Q6 — Row precedence.** `finding` > `deferred` > `builder-side` > `holds`;
  a resolved finding counts as `holds` for the cluster aggregate; cluster
  verdicts are worst-of. **Recommendation:** adopt.
- **Q7 — Citation resolution.** Own `_Check:_` IDs; family inheritance when
  absent; an `Automated` token must appear literally in a harness whose body
  exercises the behaviour; `Manual`, `Gate`, and scenario citations need none;
  `T0nn` titles are shadowing, not evidence (D10/D25/D49/D67/D77). The reused
  and cross-harness tokens named in the drafting signal are resolved first.
  **Recommendation:** adopt.
- **Q8 — Fingerprint consequence.** §5.25, §5.26, §5.27, and §5.32 are in
  `DATA_SECTIONS` (`scripts/lib/contract-fingerprint.ts:37-43`). §5.33 is
  explicitly excluded as never persisted (`:33-36`); §5.12, §5.34, and §5.35
  are simply absent from the list. A
  REQ-body edit in the four listed sections changes `dataFormat` and requires
  `npm run build-order` before the next `check:fast`; an edit in the other four
  requires `assemble` + `--write-register` only. Either way the ordinary path
  ends with `build-order`. **Recommendation:** adopt.
- **Q9 — Baseline and publication.** 19 commits are unpushed at drafting time;
  the tree is clean at `edc7062` and `check:fast` measured 37/37 PASS on it.
  **Recommendation:** no push in this increment; publication stays
  user-authorized (D4).
- **Q10 — Session cap.** Whole-chunk execution with a declared, observable halt
  rule. Budget: **20 read/grep calls per cluster, 100 total** across Phase 1
  (the plan-review standard allowance), counted from the first Phase 1 call.
  Halt rule: if the 100-call budget is exhausted before clusters A–C close, land
  the completed clusters, mark the rest `deferred:P8-resume`, and keep the run
  honest rather than thinning verdicts. If clusters A–C close but the remaining
  budget cannot cover D–E, the same deferral rule applies to the unclosed
  clusters. A deferral-halt ends `LOOP OPEN`; the AAR names every unreviewed
  cluster and the resume point; the roadmap keeps the sweep section with a
  trigger naming the resume. **Recommendation:** adopt.

## Scope

**In scope.** Chunk P8 only — §5.12 and §5.25–§5.27, §5.32–§5.35 (166 REQs /
113 family rows); the seven cognition modules and the briefing/perception
assembly in `holonovel/src/index.ts`; the §5.12 disposition derivation;
citation resolution; findings, registers, roadmap, changelog; then the closing
M1 machine-evidence re-run.

**Possible additional targets (conditional, only when a P0 forces them).**
`spec/02-requirements.md` (a P0 REQ-body edit), `spec/audit/req-coverage.md`
(a body or bucket change), `holonovel/tool-definitions.json` (a handler
description or schema change), and `holonovel/DECISIONS.md` plus §7.7/§5.19 (a
new persisted state surface). The ordinary review-only path touches none of
them.

**Out of scope.** §5.13–§5.15, §5.16–§5.18 (closed chunks); §5.9/§5.19 (seam
pass, closed) except the single §5.19 enumeration clause a P0-forced new state
surface requires under **Blast radius**; §5.2/§5.8 (P7b, closed); publication;
version release notes.

## Evidence base (this session)

| # | Evidence | Source | Trust |
|---|---|---|---|
| EV1 | §5.12 = 84 REQs / 31 family rows; §5.25 12/12; §5.26 21/21; §5.27 12/12; §5.32 8/8; §5.33 7/7; §5.34 4/4; §5.35 18/18. P8 = 166 / 113 | REQ headers in `spec/02-requirements.md` (§5.12 lines 3517–3764, §5.25 4167–4195, §5.26 4196–4241, §5.27 4242–4271, §5.32 4340–4359, §5.33 4360–4376, §5.34 4377–4390, §5.35 4391–end), counted this session | repo |
| EV2 | P8 buckets: 112 C / 1 E (`REQ-593`) | `spec/audit/req-coverage.md`, aggregated by section column this session | repo |
| EV3 | Cluster split: A 84/31, B 24/24, C 21/21, D 15/15, E 22/22; disjoint and complete | REQ-family grouping, counted this session | repo |
| EV4 | Code targets: `core/belief.ts` 163, `core/identity.ts` 373, `core/causal.ts` 133, `core/subjective.ts` 280, `core/perception.ts` 59, `core/memory.ts` 184, `core/divergence.ts` 431; handlers `manage_belief` `index.ts:8234`, `manage_identity` `:8479`, `manage_causality` `:5820`; briefing assembly `:2332-2425`; perception append `:2473-2513` | `wc -l`, `grep -n` | repo |
| EV5 | The canonical §5.12 list is `SECTION_512_REQS` at `holonovel/src/index.ts:325` (31 base REQs; `REQ-354` excluded as §5.2), consumed by the `narrative_coherence` attestation at `:12295-12300`; the register separately derives the disposition column at `scripts/validate.ts:2060-2066`; `scripts/validate.ts:1866` is a stranded comment pointing at the server-side list from the wrong file | `sed`/`grep` | repo |
| EV6 | All seven P8 harnesses (`test:narrative`, `test:memory-recall`, `test:belief`, `test:identity`, `test:causal`, `test:perception`, `test:briefing`) are reached by `test:all` | `holonovel/scripts/run-test-suite.ts:40-69` | repo |
| EV7 | Every cited token resolves to a harness (none unresolved). Reused/cross-harness IDs: `T408`–`T412` title tests in both `test-narrative.ts:767-813` (coupling advisories) and `test-backfill.ts:722-821` (unrelated assertions); `T408` is also titled at `test-limits.ts:403` (outside P8's sections); `T396`/`T403` only `test-g7`; `T514`/`T726` only `test-competitive-gaps` | register extraction + `grep -rl` over `holonovel/scripts` | repo |
| EV8 | `review-register.md` carries no `F-P8` finding; the last P8-adjacent IDs are `F-P7b-9` | `grep` | repo |
| EV9 | 19 commits unpushed; working tree clean at `edc7062`; `check:fast` 37/37 PASS measured this session | `git rev-list --count origin/main..HEAD`, `git status --porcelain`, gate run | tool output, this session |
| EV10 | `DATA_SECTIONS` includes §5.25, §5.26, §5.27, §5.32; excludes §5.33 (never persisted); §5.12/§5.34/§5.35 absent | `scripts/lib/contract-fingerprint.ts:20-43` | repo |
| EV11 | `manage_belief` dispatches `perception_*` and `subjective_*`; no separate cognition tool exists | `grep -n` at `index.ts:8234-8240` | repo |
| EV12 | `check-loop-artifacts` reports a missing `plan.md`/`tasks.md`/`aar.md`, a missing LOOP token, and warns on a missing `**Done bar:**`; `LOOP OPEN` is a valid terminal token, and the plan carries a done bar | `scripts/lib/loop-artifacts.ts:44,72-78` | repo |

## The chunk's review surface — five clusters

Cluster assignment is disjoint and covers all 166 REQs.

- **A — Narrative architecture (§5.12, 84 REQs / 31 family rows).** Scene beat
  taxonomy, pacing signal, arc visibility, faction autonomy, NPC goal pursuit,
  discovered consequences, the Player spatial surface, scene description from
  world-model state, unified intent resolution, voice feedback and codex
  capture, background-derived knowledge and lore triggering, pacing-triggered
  autonomy, codex adventure beats, beat-accelerated countdowns, coherence
  attestation, and the coupling advisories REQ-355–REQ-365.
- **B — Belief and causal integrity (§5.25 + §5.27, 24 REQs / 24 rows).**
  Evidence admissibility, belief reconciliation and conflict surfacing, the
  causal-epistemic firewall, transition proposals, optimistic version guards,
  and causal ingress.
- **C — Character identity (§5.26, 21 REQs / 21 rows).** Staged candidates,
  accepted facets, the versioned compiled kernel, reversion, bootstrap from a
  character card, stability classes and perspectives, and Player projection.
- **D — Perception and briefing consistency (§5.32 + §5.33, 15 REQs / 15
  rows).** Witness provenance, derived witness attribution, perception caps,
  briefing consistency, and the divergence marker.
- **E — Compression and subjective memory (§5.34 + §5.35, 22 REQs / 22 rows).**
  Compression-ladder tiers, source pointers and traversal, budgeted tier
  assembly, recall probes, subjective-memory record/select/evict/summarize, and
  disclosure-level privacy.

## Code-surface behaviour rows (nineteen)

Each row is filled with its `file:line` anchor, harness, and verdict in Phase 1
step 8; rows 2–12 and 18 carry an expected surface rather than a line until
then.

| # | Behaviour | Expected anchor |
|---|---|---|
| 1 | §5.12 canonical list, disposition derivation, and the register's 31-row coverage of 84 headers (`REQ-346`) | `index.ts:325`, `:12295-12300`; `scripts/validate.ts:2060-2066`; register column |
| 2 | Scene beat taxonomy and dramatic pacing signal | `holonovel/src/index.ts` narrative block |
| 3 | Narrative arc visibility and faction autonomous advancement | `index.ts` narrative block |
| 4 | NPC goal pursuit and faction-NPC goal coordination | `index.ts` narrative block |
| 5 | Discovered consequences and consequence-to-knowledge coupling | `index.ts` narrative block |
| 6 | Player-facing spatial surface and scene description | `index.ts` narrative block |
| 7 | Unified intent resolution and voice example feedback | `index.ts` narrative block |
| 8 | Background-derived knowledge and background lore triggering | `index.ts` narrative block |
| 9 | Narrative coherence attestation and voice codex capture | `index.ts`; `manage_codex` |
| 10 | Pacing-triggered autonomy, codex beats, beat-accelerated countdowns | `index.ts`; `manage_countdown` |
| 11 | Coupling advisories `REQ-355`–`REQ-365` | `index.ts` advisory matcher |
| 12 | Observer narrative surface `REQ-366a`–`REQ-366d` | `index.ts` narrative block |
| 13 | Evidence admissibility, reconciliation, and conflict surfacing | `core/belief.ts` (`reconcileEntity`), `manage_belief` `:8234` |
| 14 | Causal transition evaluation, admission, and ingress | `core/causal.ts` (`evaluate`, `applySlot`), `manage_causality` `:5820` |
| 15 | Identity staging, acceptance, reversion, compile, projection | `core/identity.ts`, `manage_identity` `:8479` |
| 16 | Perception witness provenance and derived witness attribution | `core/perception.ts`, `index.ts:2473-2513`, `:9202-9245` |
| 17 | Briefing consistency and the divergence marker | `core/divergence.ts` (`projectTruthFacts`, `checkRecord`), `index.ts:2410-2425` |
| 18 | Compression-ladder tiers, pointers, budgeted assembly, recall probes | `core/memory.ts`, `novel.compression_ladder` |
| 19 | Subjective-memory record, briefing selection, eviction, summary, privacy | `core/subjective.ts`, `index.ts:2376-2410`, `:9317-9328` |

## Steps

### Phase 0 — Baseline (planning record only; a C0 source fix is a separate commit)

1. Create `tasks.md` and a provisional `aar.md` (status `in progress`, ending
   `LOOP OPEN`) in the increment directory first. `check-loop-artifacts` reports
   only the missing files until they exist; `LOOP OPEN` is itself a valid
   terminal token (EV12), so the provisional state is not a gate defect and is
   never a C0 trigger (P7a D89).
2. Run `npm run check:fast` and `npm run check` un-piped; record exit status
   and the trailing `PASS`/`FAIL` line. A red baseline other than the
   increment-record finding above is a gate defect: fix it as its own commit
   (C0) before any review work, per the standing route. Baseline at drafting
   time is 37/37 PASS (EV9).
3. Run `npm --prefix holonovel run test:all`; record the per-harness summary.
   Record that all seven P8 harnesses are reached by it (EV6).
4. Record `git status --porcelain`, `git rev-parse --short HEAD`, and
   `origin/main..HEAD`; confirm the cold-pass report is at
   `/tmp/opencode/p8-cold/` and the evidence sidecar under
   `~/.local/state/opencode/plans/`, both outside the repo.
5. Confirm `git check-ignore -v docs/plans/2026-11-09-full-review-p8/` returns
   nothing.
6. Record Q1–Q10 as D101–D110 in the sweep worklist, and correct the P8 row's
   stale "pending Q1" note and its `spec-review` lens to the executed lens.
7. Re-derive the 166-REQ / 113-family-row set with `grep -n '^\*\*REQ-'` over
   each section range, and its buckets from `spec/audit/req-coverage.md`; stop
   and re-stamp on a verified mismatch.
8. Write the plan-gate preflight evidence sidecar and re-stamp the plan as
   `independence: fresh` with the cold-report path and sha256.

### Phase 1 — Code side (read-only review)

1. **Enumerate the surface** with `file:line` anchors: every export of the seven
   cognition modules; the `manage_belief` / `manage_identity` /
   `manage_causality` action branches; the briefing, perception, and
   subjective-memory assembly in `index.ts`; the §5.12 disposition derivation
   in `scripts/validate.ts`.
2. **Review cluster A** against §5.12: confirm `SECTION_512_REQS`
   (`index.ts:325`) covers all 31 register rows, that the register's 31 base
   rows cover all 84 headers, that the `narrative_coherence` attestation
   (`index.ts:12295-12300`) uses the same list, that each `implemented`
   disposition is backed by source at the anchor, that the coupling advisories
   resolve their named field, that the observer narrative surface
   `REQ-366a`–`REQ-366d` is exercised, and that the reused/cross-harness IDs
   (`T396`/`T403`, `T408`–`T412`, `T514`/`T726`) exercise the asserted
   behaviour in the harness whose title matches the Appendix F assertion.
   Record the stranded `validate.ts:1866` comment as an observation; file it as
   a finding only if it names behaviour the code does not have.
3. **Review cluster B** against §5.25/§5.27: admissibility, reconciliation,
   conflict surfacing, the causal-epistemic firewall, proposal version guards,
   and ingress.
4. **Review cluster C** against §5.26: staging, acceptance and displacement
   retention, version bump, reversion, bootstrap, stability classes, and Player
   projection.
5. **Review cluster D** against §5.32/§5.33: witness provenance, derived
   attribution, the perception cap, budgeted selection, the consistency report,
   and the divergence marker.
6. **Review cluster E** against §5.34/§5.35: tier assembly, source-pointer
   traversal, recall probes, selection, eviction, summary folding, and
   disclosure gating.
7. **Open every cited harness** and record exercise, not token presence.
8. **Record** 166 REQ verdicts, the nineteen behaviour rows, and five cluster
   verdicts.

### Phase 2 — Spec side (citation resolution)

1. Resolve every `_Check:_` citation for the 166 rows using the
   P2/P3b/P4/P5/P6/P7 method (Q7).
2. Classify citation kind; record `Automated` tokens with no exercising harness
   as findings — the reused and cross-harness IDs (EV7) are the expected
   concentration, confirmed or refuted row by row.
3. Fill bucket and verdict columns for all 166 rows.
4. **Coverage register.** When a P0 fix edits a REQ body, or a re-measured
   bucket differs from `spec/audit/req-coverage.md`, run
   `npm run validate -- --write-register` and include the regenerated register
   in the commit. A §5.12 body edit also re-derives the disposition column;
   confirm the derivation still matches after regeneration. When no body and no
   bucket changed, record that the register is unchanged and needs no
   regeneration — do not skip the check silently.

### Phase 3 — Triage, registers, roadmap, artefacts

1. **Triage findings P0–P3** per Q2. A P0 fix lands with a targeted assertion;
   if it edits a REQ body, apply Q8's rule.
2. **`spec/audit/review-register.md`**: one dated heading per used disposition
   section, rows per **Register write-back**.
3. **`ROADMAP.md`**: remove the § Remaining full-review sweep (P1) section
   (work shipped). When triage produces scheduled findings, add remediation
   section(s) of 1–3 bullets split by theme, every bullet naming its `REQ-NNN`
   IDs; when triage produces none, add no section.
4. **`CHANGELOG.md`**: one dated heading
   `<YYYY-MM-DD> — Full-review sweep: chunk P8 (narrative cognition and the closing M1)`.
   Verify the CalVer date at execution.
5. **Artefacts**: tick `tasks.md`, replace the provisional `aar.md` with the
   execution record and the token the outcome earns, and update the sweep
   worklist's status table with the outcome branch: `P8 closed — sweep
   complete` on a clean run, `P8 deferred — clusters <X> (sweep incomplete)` on
   a deferral-halt, `P8 halted on <finding>` on a P0-halt.

### Phase 4 — Closing M1 machine-evidence re-run

1. Run, un-piped, over the post-P8 tree: `npm run check:conformance`,
   `npm run fmea`, `npm run graph-deps`; archive stdout under
   `/tmp/opencode/sweep-p8/`.
2. Record each exit status and the output summary in a **Delta amendment** in
   `worklist.md` (not `plan.md`).
3. Apply the M1 rule: a finding must rest on a confirmed predicate, never on a
   tool message. `check:conformance` is a gate — record its exit; `fmea` and
   `graph-deps` are informational and raise no finding on their own.

### Phase 5 — Verification and commit

1. Run the **Verification** table un-piped; record every exit status.
2. Commit per **Commit order and gates** (C1 only, after Phase 4's Delta
   amendment is in the tree). Run `npm run session:close`.
3. No push.

## Register write-back

| Disposition | Section | Row shape |
|---|---|---|
| `Resolved` | first `## Resolved` block (`review-register.md:12`), newest-first | `### <date> full-review sweep — chunk P8`; bullet `**F-P8-N — <title> (resolved <YYYY-MM-DD>):**` + predicate + the REQ IDs it covers + fix location + the assertion that now covers it (or `no new assertion`) |
| `Scheduled-roadmap` | `## Scheduled-roadmap` | same heading; bullet names the finding, the predicate, the REQ IDs it covers (including lowercase suffixes), and the `ROADMAP.md` section it is scheduled under, plus the date; each cited `REQ-NNN` also appears literally in that `ROADMAP.md` section |
| `Closed-P3` | `## Closed-P3 (recorded, no action)` | same heading; bullet records the predicate, the REQ IDs, the date, and why no action follows |
| `Deferred-by-user` | `## Deferred-by-user` | only on an explicit user deferral; names the decision |

## Stopped-run landing

If a P0 cannot be fixed within the session, the run halts and still lands as a
record:

1. `worklist.md` marks chunk P8 `halted on <finding ID>` and keeps the partial
   tables.
2. `ROADMAP.md` gains a section for the P0: heading
   `## <finding ID> — <title> (P0)`, 1–3 bullets naming the predicate, the
   reproduction, and the finding's `REQ-NNN` IDs, and a `**Trigger:**` line;
   the admission rule and the strict REQ-literal rule both apply.
3. `CHANGELOG.md` heading reads
   `<date> — Full-review sweep: chunk P8 (halted on <finding ID>)`.
4. The unfixed P0 is a `Scheduled-roadmap` row whose matching `ROADMAP.md`
   entry is the P0 section. A baseline P0 is a gate defect and gets no register
   row.
5. `aar.md` ends `LOOP OPEN` naming the P0 row; gates still run.
6. The roadmap keeps the sweep section and its scope clause records "chunk P8
   halted", never "closed"; the M1 re-run records what it could.
7. **Commit path.** Phase 0 established a green baseline and a review-only
   record does not change its own gates, so a discovered-but-unfixed P0 leaves
   the tree green: the record commits normally through `session:close`. If a
   bounded P0 fix is attempted and leaves any gate red, revert that fix first
   (restoring the green baseline), then record the P0 as `Scheduled-roadmap` and
   commit the record. A tree that is red with no fix attempted is the
   red-baseline branch below, not this one.
8. No push. The P0 is the next session's first item.

**Deferral-halt branch.** When the session ends with clusters unreviewed and no
P0 open, the run still lands as a record: `worklist.md` marks those clusters
`deferred:P8-resume` with the completed tables; `ROADMAP.md` keeps the sweep
section and its trigger names chunk P8 resume, then the M1 re-run;
`CHANGELOG.md` reads `<date> — Full-review sweep: chunk P8 (partial: clusters <X> deferred)`;
`aar.md` ends `LOOP OPEN`, names each unreviewed cluster, and states the resume
point. No push.

**Red-baseline branch.** When the unfixable P0 is the baseline itself: record
the red output verbatim in `aar.md` (`LOOP OPEN`) and add
`## Baseline red — <gate> (halted)` to `ROADMAP.md` with the normal admission
shape — 1–3 bullets naming the failing gate, the reproduced command, and the
`REQ-NNN` IDs it implicates, plus a `**Trigger:**` line — so `check-roadmap`
passes. Write no `CHANGELOG` entry. **Do not commit:** the standing rule is
"stop and report rather than commit a failing tree" (AGENTS.md § Agent
Operating Routine), and `--no-verify` would bypass the hook that exists to
catch exactly this. Leave the planning record and the roadmap section
unstaged-or-staged but uncommitted, report the failing gate with its verbatim
output, and let the user authorize either a baseline fix or an explicit
commit override. The run does not claim green gates.

## Blast radius

- **P0 fix in cluster A** (`holonovel/src/index.ts` narrative block,
  `scripts/validate.ts` §5.12 derivation): the narrative block is on the turn
  path; a disposition-derivation change is a spec gate, so the fix carries its
  own assertion and a re-run of `check:fast`. A §5.12 REQ-body edit re-derives
  the register's disposition column.
- **P0 fix in clusters B–E** (`core/belief.ts`, `core/identity.ts`,
  `core/causal.ts`, `core/perception.ts`, `core/subjective.ts`,
  `core/memory.ts`, `core/divergence.ts`, the three handlers): these records
  persist with the Novel (§5.25–§5.27, §5.32 are `DATA_SECTIONS`), so a fix
  re-runs `test:belief`, `test:identity`, `test:causal`, `test:perception`,
  `test:briefing`, `test:memory-recall`, `test:narrative`, plus
  `test:persistence` when a persisted field changes.
- **Regeneration surfaces a P0 can force** (conditional, named here so the fix
  cannot fail `check:fast` unrecorded): a handler description or schema change
  regenerates `holonovel/tool-definitions.json` via
  `npx tsx holonovel/scripts/generate-tool-definitions.ts`
  (`check-tool-definitions-sync`); a new or renamed Novel-persisted state
  surface also names it in §7.7 and §5.19, carries its §7.7.0 class contract
  and clone/checkpoint/archive enumerations (REQ-240a/241a/334b), and
  classifies it in `holonovel/DECISIONS.md`; any §7.7/§5.19 edit runs
  `npm run build-order` before the next `check:fast` after that edit, because
  those sections feed the data fingerprint. A REQ-body edit in §5.25/§5.26/
  §5.27/§5.32 also feeds the data fingerprint. The Verification table runs
  `build-order` last for the ordinary review-only path; a P0 that touches
  §7.7/§5.19 or a `DATA_SECTIONS` body inverts that order.
- **Version sync (every run).** `npm run build-order` runs the version-bump
  step unconditionally (`scripts/build-order.ts:251-254`). This increment's
  `CHANGELOG.md` heading is dated 2026-11-09, which equals the current CalVer
  (`holonovel/package.json:3`), so the bump is a no-op and rewrites nothing —
  `version-bump.ts:20-24` only advances on a newer changelog date. `build-order`
  still runs for its fingerprint and README-marker steps. The `**Spec hash:**`
  line in `holonovel/DECISIONS.md` is written by `push-pipeline.sh`'s
  `spec-update-record.ts`, not by this increment and not by the version step.

## Considered and rejected

- **Split §5.12 off as its own increment.** Rejected: the sweep's last unit
  should close whole, the cognition half is small (82 REQs / 82 rows across
  seven modules), and splitting forces a second post-P8 M1 tree and leaves the
  roadmap item open.
- **Defer the M1 re-run to a separate session.** Rejected: the roadmap makes it
  the closing act of the same item; a separate session would re-derive the tree
  and could not call the sweep shipped.
- **Re-file §5.6/§5.8-owned briefing and scene defects found while reading
  §5.12/§5.33.** Rejected: those belong to their closed chunks; the review
  cross-references instead.
- **Treat a cross-harness or reused test ID as a finding on placement alone.**
  Rejected: `T408`–`T412` are titled in two harnesses now, and either could be
  the legitimate implementer; the finding needs the predicate that the specific
  harness body does not exercise the asserted behaviour.
- **Keep the sweep section on `ROADMAP.md` after the run.** Rejected: the
  admission rule removes a section when the work ships; the history moves to
  `CHANGELOG.md` and the worklist.

## Delta amendment (2026-11-09, during Phase 1)

**What changed.** The cold pass correctly found that `scripts/validate.ts:1866`
holds no canonical §5.12 REQ list; the revision then stated that no canonical
list exists. Execution evidence refutes that: the server keeps it as
`SECTION_512_REQS` at `holonovel/src/index.ts:325` (31 base REQs, `REQ-354`
excluded as §5.2) and derives the `narrative_coherence` attestation from it at
`:12295-12300`. The review now checks that list against the register's 31 rows
and all 84 headers, and records the stranded `scripts/validate.ts:1866`
comment as an observation.

**Why.** A plan assumption ("no canonical list exists") was invalidated by
source evidence read during Phase 1. Leaving it would make Phase 1 step 2
unexecutable and would misreport the §5.12 mechanism in the AAR.

**Blast radius of the delta.** Four passages in this plan (Review status,
EV5, behaviour row 1, Phase 1 step 2) plus this amendment section. No target
file, phase order, done-bar item, or verification command changes.

## Verification

| Check | Command | Expected |
|---|---|---|
| Assembly | `npm run assemble` | exit 0 |
| Fast gate | `npm run check:fast` un-piped | trailing `check:fast: PASS` |
| Full gate | `npm run check` un-piped | trailing `check: PASS` |
| Server suite | `npm --prefix holonovel run test:all` | all harnesses PASS |
| Narrative | `npm --prefix holonovel run test:narrative` | PASS |
| Belief | `npm --prefix holonovel run test:belief` | PASS |
| Identity | `npm --prefix holonovel run test:identity` | PASS |
| Causal | `npm --prefix holonovel run test:causal` | PASS |
| Perception | `npm --prefix holonovel run test:perception` | PASS |
| Briefing | `npm --prefix holonovel run test:briefing` | PASS |
| Memory and recall | `npm --prefix holonovel run test:memory-recall` | PASS |
| Persistence (only when a persisted field changes) | `npm --prefix holonovel run test:persistence` | PASS |
| Registers | `npm run check-registers:strict` | PASS |
| Coverage register | `npm run validate -- --write-register` (only when a body or bucket changed) | PASS, register regenerated or unchanged |
| Roadmap | `npm run check-roadmap` | PASS |
| Loop artifacts | `npm run check-loop-artifacts` | PASS |
| M1 conformance | `npm run check:conformance` | exit 0 |
| M1 FMEA | `npm run fmea` | exit 0 (informational) |
| M1 graph | `npm run graph-deps` | exit 0 (informational) |
| Version sync | `npm run build-order` | PASS (version sync) |

## Risks and rollback

- **Risk — 113 family rows across eight sections overwhelm one session.**
  Mitigation: Q10's halt rule lands completed clusters and marks the rest
  `deferred:P8-resume`; the AAR says so plainly.
- **Risk — the §5.12 derived disposition is trusted as evidence rather than
  checked against source.** Mitigation: the behaviour row 1 anchor is the
  derivation itself, and each `implemented` disposition is confirmed against
  its source anchor in Phase 1 step 2.
- **Risk — a P0 in a `DATA_SECTIONS` body silently changes the data
  fingerprint.** Mitigation: Q8 + the blast-radius rule; the fix runs
  `build-order` before the next `check:fast`.
- **Risk — reading the narrative block re-litigates P7b's prompt-composition
  findings.** Mitigation: Q5(a)/Q5(c); a defect in a §5.8-owned behaviour is
  cross-referenced to its P7b finding.
- **Risk — a reused test ID is resolved to the wrong harness, filing a false
  citation finding.** Mitigation: Q7 requires the harness body to exercise the
  asserted behaviour; a title match alone stays a note, and the reused
  `T408`–`T412` pair is resolved explicitly against the Appendix F assertion.
- **Rollback:** the increment is review records plus at most a bounded P0 fix.
  Revert is one `git revert` of the single commit (plus the optional C0).

## Commit order and gates

1. **C0 (conditional)** — baseline fix as its own commit, run per the standing
   route. Only when Phase 0 is red.
2. **C1** — the review increment, made after Phase 4 lands the M1 Delta
   amendment: worklist tables, M1 Delta amendment, findings, register rows,
   roadmap removal, changelog, plan/tasks/AAR. One commit, subject derived by
   `npm run session:close` from the top `CHANGELOG.md` heading. A P0 that forces
   a conditional target (a REQ body, `tool-definitions.json`, §7.7/§5.19,
   `DECISIONS.md`) still lands in this one commit, after the regeneration Q8
   requires.

No push. `push-pipeline.sh` stays user-authorized (D4).

## User impact

None at runtime unless a P0 fix lands: this increment otherwise records review
verdicts, schedules remediation, and closes the sweep. A P0 that changes a
cognition module, the narrative block, or a persisted field does change runtime
behaviour; the changelog and AAR name the affected surface and the turn or
persistence path it touches.

## Evidence

Phase 0–5 fill the verified evidence into `tasks.md` and `aar.md`. The counts
in EV1–EV3 are the drafting measurements and are re-derived at Phase 0 step 7
before execution. `tasks.md` and `aar.md` are created at Phase 0 step 1, so
`check-loop-artifacts` reports this increment incomplete between drafting and
execution — the same state P7a recorded (D89).
