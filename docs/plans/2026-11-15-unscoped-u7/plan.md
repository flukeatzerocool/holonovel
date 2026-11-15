# Plan — U7: reference appendices and registries (unscoped-surface review sweep)

Status: draft v3.1 — self pass 2026-11-15; cold pass 1 on v1 NO-GO (12B/12M/13N);
cold pass 2 on v2.1 NO-GO (3B/8M/7N); delta re-review of v3 **passed** with 0
blockers, 2 Majors (M-R1, M-R2) and 5 Nits. Both Majors and all five Nits are
applied verbatim as the reviewer recommended after the pass — the reviewer had no
write path — and `build-review` verifies the application (conditions C-4, C-5).
Kind: planned · Depth: standard
Increment target: `docs/plans/2026-11-15-unscoped-u7/` — **created in Phase 0
step 3, not before**. The cold artifacts live in the gitignored
`plans/2026-11-15-unscoped-u7.cold/` until 6.7, so no tracked directory exists
while the plan gate is open and `check-loop-artifacts` stays green (B1 of pass 2).
Rollback cost: 1 (one revert restores the increment directory, the register rows,
the `worklist.md` U7 lines, `ROADMAP.md:30` and `:32`, any bounded `spec/` prose
fix, and the regenerated `holonovel.md`, `holonovel/holonovel.md`,
`spec/build-phase-map.md`, `holonovel/src/generated/g7-attestation.ts`, the G7
table in `holonovel/DECISIONS.md`, and `CHANGELOG.md`. A narrower task-level
revert of only the prose fixes is `git checkout <commit> -- spec/appendices-reference.md
spec/appendices-licenses.md` followed by the 6.3 regeneration; the register,
worklist, and roadmap edits are correct independently of the prose fixes.)
Evidence class: EV1, EV2, EV12, EV13, EV19 are `tool-output`; every other premise
is a `file:line` read or a directory listing at HEAD `f886d9c`
Trust boundary: every premise is read from the working tree; no web, user, or
fetched content enters the plan. `check-registry` is network-bound and is never a
row's predicate (K6).
Review independence: fresh — cold pass 1 at
`plans/2026-11-15-unscoped-u7.cold/report.md` (four of five stages), cold pass 2
at `plans/2026-11-15-unscoped-u7.cold/report-v2.1.md` (four of five), and the
delta re-review of v3 at `plans/2026-11-15-unscoped-u7.cold/re-review-v3.md`.
Hashes are recorded by the stamp, not restated here.

## Resolutions (delta re-review v3 → v3.1)

The delta re-review returned `independent-review passed.` — 18 of 18 prior
findings resolved, 0 Blockers — with two Majors and five Nits in the repair's own
machinery. All are applied verbatim from the reviewer's recommendation:

- **M-R1 [design] — Phase 0 misstated the gate.** A stub `LOOP OPEN` is an error
  only when the caller demands a paused AAR (`scripts/lib/loop-artifacts.ts:75-91`);
  `scripts/check-loop-artifacts.ts:33` passes no such option. Phase 0 step 4 now
  states that, and `check:fast` runs at the baseline, mid-session (6.3b) and at the
  close instead of once.
- **M-R2 [design] — V5b could not pass.** A count-versus-count test is off by one,
  because U7-F1 is registered without being a verdict row. V5b is replaced by
  V11b, a presence floor, with V11 keeping the set equality.
- **N-R1** R9's `+6` window is now an end-anchored `-L` block.
- **N-R2** Done bar 5 covers every row of the verification table.
- **N-R3** Phase 4 step 2 names the `source_url` predicate
  (`holonovel/src/core/wisdom.ts:82-113`) and its no-row fallback.
- **N-R4** The worklist line gains a P0-scheduled slot.
- **N-R5** This plan cites the cold artifacts, which the parent persisted before
  the stamp.

## Resolutions (cold pass v2.1 → v3)

- **Blocker 1 [design] — the increment directory made the baseline unreachable.**
  Fixed: the cold artifacts now live in the gitignored `plans/` area, Phase 0
  creates `plan.md`, `tasks.md`, and a stub `aar.md` in one step **before** any
  gate run, and the plan states that `check-loop-artifacts` is red from then until
  6.7 by design — the intermediate evidence set is the individual gates, and
  `check:fast` runs at the close, not mid-session (verified: the current tree is
  clean and `check:fast` is green with no increment directory present).
- **Blocker 2 [clarity] — done bar 4 contradicted 6.6 and V6.** Fixed: done bar 4
  now requires `ROADMAP.md:30` to name U8 **and `:32`'s first clause to name
  U8**, matching 6.6 and V6b.
- **Blocker 3 [design] — the register shape was invisible to the parser.** Fixed:
  6.4 specifies the two-level shape the parser reads — `### <date> <topic>` under
  the correct `## ` bucket, then one `- **U7-Fn — claim. Disposition (date).**
  Predicate: …` bullet per finding (`scripts/lib/register-checks.ts:20-22,31-51`) —
  and V5b requires the new-entry count to equal the `DEFECT` count.
- **Major 1 — `Scheduled-roadmap` rows must not cite an unroadmapped REQ.** Fixed:
  6.4 states the rule (`register-checks.ts:64-69`) and the compliant move — cite
  the REQ only if `ROADMAP.md` carries it, otherwise cite the predicate file and
  add the REQ to the owning roadmap bullet.
- **Major 2 — the 3-bullet ROADMAP cap.** Fixed: 6.6 states that a new scheduled
  item either folds into an existing bullet of its owning section or opens a new
  `## <title> (P<n>)` section with 1–3 bullets and a `**Trigger:**` line; both
  current P1/P2 owners already hold three bullets, so folding is the default.
- **Major 3 — the sample rule over-ran a 90-row block.** Fixed: the rule is "rows
  1, 11, 21, … up to and including the block's last row (≤10 samples)".
- **Major 4 — R9's `git log -S` cannot see a body edit.** Fixed: R9 uses
  `git log -1 --format=%cs -L '/\*\*REQ-<id> /,+6':spec/02-requirements.md`, which
  follows the block, with the "first release date at or after the last-change
  date" tolerance.
- **Major 5 — the `source_url` admission rule was unverified.** Fixed: Phase 4
  step 2 checks it against the synthesis manifest, and R59's row states the
  predicate; where no manifest row exists, the row records a DEFECT.
- **Major 6 — a code-class P0 had no path.** Fixed: the vocabulary states that a
  P0 needing code is scheduled (a deliberate deviation from AGENTS' fix-in-session
  default, because this increment is forbidden to change behaviour), and the
  worklist line carries P0/P1/P2/P3 slots.
- **Major 7 — V1–V4 had no repair path.** Fixed: 6.8 and K9 span V1–V11, with the
  ordering caveat that V2/V4 run only after 6.7 writes a terminal AAR token.
- **Major 8 — V6 over-claimed `check-roadmap`.** Fixed: V6's expected column is
  narrowed to what the gate verifies (bullet counts, trigger presence, the
  Non-goals pointer), and V6b is a named `sed -n '30p;32p' ROADMAP.md` read for the
  pointer and trigger text.
- **Nits — all fixed.** R32/R33 re-split at the real boundary (O.11 + O.12
  `:3158-3210`, O.13 `:3211-3234`); EV7 reads "A, D–M, O–T"; EV14 cites `:37-43`;
  6.5's template substitutes real counts; V8 notes the sources are linted only
  through the assembled file; Phase 1 probe 4 uses `REQ-321f`; rollback and blast
  radius name both `ROADMAP.md:30` and `:32`.

## Resolutions (cold pass v1 → v2)

- **B1 [design] — E's block rows closed on gates that cannot see E's contract
  column.** The row budget states which columns no gate covers, every block row
  carries a fixed sample rule, and R9 tests attribution rather than resolvability.
- **B2 [clarity] — Phase 0 ordered and forbade the same edit.** Phase 0 does not
  touch `ROADMAP.md`; the pointer and trigger move once, in 6.6.
- **B3 [design] — `Scheduled-roadmap` was defined as a dated ROADMAP section.** A
  scheduled finding adds a dated *entry* to an existing section (the headings are
  undated — `ROADMAP.md:15,35,50`) and names that section in its register bullet.
- **B4 [design] — the register write was not executable.** 6.4 names the parent
  bucket per disposition (`spec/audit/review-register.md:12,2885,2940,3374`), uses
  "the increment commit" rather than a hash that does not exist yet, and records
  U7-F1 in 6.4 rather than inventing it in Phase 0.
- **B5 [design] — citations were confirmed before the edits that move them.**
  Prose fixes are 6.2, regeneration is 6.3, and the register and `review.md`
  anchors are written and `sed -n`-confirmed after them.
- **B6 [design] — the K4 branch could not persist.** K4 reverts every edit,
  regenerates, leaves the increment directory uncommitted, and runs no close.
- **B7 [clarity] — the cold-pass path did not exist at gate time.** The seed path
  is the gitignored `plans/` area, which exists before the gate and never affects a
  gate.
- **B8 [design] — `builder-side` / `external-skill` had no terminal surface.**
  Each takes an AAR record-and-close note carrying its reason (6.7).
- **B9 [design] — done bar 2 outran its verification.** V11 diffs every `DEFECT`
  ID in `review.md` against the register, and V5b counts the new bullets.
- **B10 [clarity] — `review.md`'s shape was unspecified.** 6.1 states the table
  header and columns; the vocabulary carries the tier field.
- **B11 [design] — R57/R58 anchors were wrong.** R57 is `:1-8`, R58 is `:9-21`.
- **B12 [clarity] — the blast radius contradicted itself on
  `holonovel/DECISIONS.md`.** The regenerated G7 table and the read-only records
  are separate rows, and rollback names the file.
- **Majors and Nits of pass 1 — all resolved** as recorded in v2 (M1 §5
  scheduled not fixed; M2 top-of-file CHANGELOG insertion; M3 R20's orphan sweep;
  M4 one definition of `predicate`; M5 every T/O row runs all four gates; M6
  redirected probes; M7 recorded self pass; M8 the 6.8 fix-or-K4 path; M9 the U6
  vocabulary citation; M10 narrowed rollback; M11 done bar 3; M12 `UNSET` defined;
  N1–N13 evidence-class, anchor, and ordering corrections).

## Questions

1. **What is the next roadmap item?** The § *Unscoped-surface review sweep*
   (`ROADMAP.md:15-33`) names U7 explicitly: "U7 is next (reference appendices and
   registries), then U8" (`ROADMAP.md:30`). The trigger is "the next allocated
   review session takes U7" (`:32-33`), so no date gate blocks it.
2. **Why not the P1 synthesis section?** `ROADMAP.md:35-48` is higher priority but
   is a server behaviour item, not a review, and it is not the section the roadmap
   designates as next. Mixing it in is what U6 avoided when it scheduled
   U6-F3/F4/F5 there rather than patching them
   (`spec/audit/review-register.md:2887-2915`).
3. **Is U7 one session?** Yes, on the U6 model: 67 verdict rows against U6's 66.
   The two dominant catalogues are grouped by contiguous block and settled by their
   owning gate plus a fixed sample, not by reading 2,093 rows.
4. **Does U7 change code?** No. A defect that needs behaviour change is recorded
   and scheduled. Writes are prose, records, and regenerated assembly output — and
   Appendix Q is fingerprint-bearing (EV14), so a Q fix forces
   `npm run build-order`, not just `npm run assemble`.
5. **What closes the roadmap section?** Only U8 (`ROADMAP.md:33`). U7 advances the
   pointer and the trigger to U8 and leaves the section in place.
6. **Is `check-registry` a real gate?** It exists (`package.json:77`) but is the
   network-bound MCP-registry publisher check and is absent from the gate manifest;
   the manifest gate is `check-registers` (EV16). Phase 0 settles which the
   worklist's U7 line meant and records the answer as U7-F1 in 6.4.

## Baseline at HEAD (this session)

| # | Evidence | Command / source | Trust |
|---|---|---|---|
| EV1 | Tree clean on `main` at `f886d9c`, 106 unpushed commits, version `2026.11.15`, 3 open roadmap items; after the cold artifacts were relocated to `plans/`, `git status --porcelain` is empty again | `git status --porcelain`; `git rev-parse --short HEAD`; `npm run status` | tool-output |
| EV2 | Fast gate green **before any increment directory exists**: **45 passed, 0 failed**, trailing `check:fast: PASS`, exit 0. This baseline cannot hold once Phase 0 step 3 creates the increment, so the close re-runs it (V2) rather than treating it as continuously true | `npm run check:fast` (un-piped) | tool-output |
| EV3 | The roadmap section, its U7 pointer and its trigger; its three section headings are undated | `ROADMAP.md:15-33,35,50` | repo |
| EV4 | U7's declared scope, lens, already-gated list, exit evidence | `docs/plans/2026-11-10-unscoped-surface-review/worklist.md:278-292` | repo |
| EV5 | The per-chunk close protocol (five steps, ROADMAP pointer last) | `worklist.md:314-321` | repo |
| EV6 | U6 closed clean and scheduled the three synthesis gaps into the P1 section | `spec/audit/review-register.md:14-45,2887-2915` | repo |
| EV7 | `spec/appendices-reference.md` is 3,654 lines and carries A, D–M, O–T (**Appendix N is in the fixtures file**); A and M are U1's (`worklist.md:61,91`) | `wc -l`; `grep -n '^## Appendix '` (`:3,53,95,1430,2220,2478,2520,2542,2570,2765,2784,3058,3235,3295,3353,3390,3451`) | repo |
| EV8 | Appendix U is `spec/appendices-licenses.md:1-43`: prose `:3-5`, the 13-row table `:7-21`, admission rules and the OGL clause `:23-43` | `wc -l`; `cat -n` | repo |
| EV9 | Appendix E holds **1,324 REQ rows** (REQ-001…REQ-659, 40 descending ID jumps — **grouped by spec section, not sorted**) and Appendix F **769 T-rows** (T3…T788, 20 descending jumps). E's third column is a CalVer "Spec version" stamp matching CHANGELOG entries | `awk` row counts and descending-jump scans over the section ranges | repo |
| EV10 | Appendix T is a four-category lead-in (`:3451-3471`) plus T.1 (`:3472`), T.2 (`:3492`), T.3 (`:3553`) | `grep -n '^###'`; section read | repo |
| EV11 | Appendix O is a lead-in plus eight blocks, in file order: O.2 `:3063`, O.1 `:3083`, O.9 `:3106`, O.10 `:3121`, O.8 `:3135`, O.11 `:3158`, O.12 `:3185-3210` (its tail is the recall-probe fixture), O.13 `:3211-3234` | `grep -n '^\*\*'` | repo |
| EV12 | The live surface is **37 host tools** (`tool_count`, `tools.length`) over a `taxonomy` + `actions` registry whose 299 action keys are `tool.action` | `holonovel/tool-definitions.json:3`; registry key count | tool-output |
| EV13 | The registry artifacts total 8,234 lines across seven files, and `holonovel/schemas/` holds exactly two entries (`mcp-server.schema.json`, 574 lines, and `PROVENANCE.md`) — the worklist's `schemas/*` names one schema file | `wc -l`; `ls holonovel/schemas` | tool-output |
| EV14 | **Appendix Q is fingerprint-bearing**: `DATA_SECTIONS` ends with `"## Appendix Q:"`, so any Q edit moves the committed contract fingerprint | `scripts/lib/contract-fingerprint.ts:37-43` | repo |
| EV15 | No other in-scope appendix is in `PACKAGE_SECTIONS` or `DATA_SECTIONS`, so editing them moves only the build-phase-map hash and, after `assemble`, the G7 attestation | `scripts/lib/contract-fingerprint.ts:27,37-43` | repo |
| EV16 | `check-registers` is a manifest gate (`fast: check-registers`, `full: check-registers:strict`); `check-registry` is `scripts/check-registry-publish.ts`, a network-bound on-demand/publish check absent from the manifest | `scripts/lib/gate-manifest.ts:162-165`; `package.json:33,35,77` | repo |
| EV17 | The seven U7 gates exist in the manifest and are green in EV2: `check-tool-definitions-sync` (`:174`), `tool-definitions-lint` (`:180`), `check-tool-surface` (`:186`), `check-tdqs-scoreboard` (`:210`), `tool-citation-check` (`:216`), `check-server-manifest` (`:90`), `check-adventure-index` (`:114`) | `scripts/lib/gate-manifest.ts` | repo |
| EV18 | `check-tool-surface` reads the committed registry plus the `tool-definitions.json` snapshot; `tool-citation-check` resolves every `tool (action: …)` binding in REQ bodies against that snapshot; `tool-definitions-lint` validates `tool-disambiguation.json` axes and clusters | `scripts/check-tool-surface.ts:1-18`; `scripts/tool-citation-check.ts:1-18`; `scripts/tool-definitions-lint.ts:200-219` | repo |
| EV19 | The U1–U6 status rows use the form `**reviewed <date>** — N rows, …`; U7's row is `worklist.md:97`, and its "Already gated" line is `:287-289` | `worklist.md:87-97`; `npm run status` | tool-output |
| EV20 | `docs/licenses/ATTRIBUTION.md` is 87 lines with a 13-row `## Register` (`:10-27`) plus four further sections | `grep -n '^## '`; row count | repo |
| EV21 | The "Spec version" placeholder gate inspects **only bare `^REQ-\d{3}$` IDs**, so every suffixed row (`REQ-101a`, `REQ-001a1`, …) bypasses it, and no check resolves a stamp to a CHANGELOG heading | `scripts/validate.ts:705-731` | repo |
| EV22 | The register parser reads ``- **…**`` bullets grouped by `## ` disposition sections; `Scheduled-roadmap` findings fail the gate when a cited `REQ-NNN` is absent from `ROADMAP.md`; `check-roadmap` caps a section at 3 bullets and verifies trigger presence, not its text | `scripts/lib/register-checks.ts:20-22,31-51,64-69`; `scripts/check-roadmap.ts:24-25` | repo |

## Scope

**In scope.** `spec/appendices-reference.md` Appendices D, E, F, G, H, I, J, K,
L, O, P, Q, R, S, T; `spec/appendices-licenses.md` Appendix U; the artifacts those
catalogues describe (`holonovel/tool-definitions.json`,
`tool-surface-registry.json`, `tool-disambiguation.json`, `tool-routing.json`,
`holonovel/schemas/mcp-server.schema.json` and `holonovel/schemas/PROVENANCE.md`,
`holonovel/server.json`, `glama.json`, `docs/licenses/ATTRIBUTION.md`); the
read-only records the appendices require (`holonovel/DECISIONS.md` help-category
mapping, tool budget, description budget; `spec/audit/tdqs-scoreboard.json`); the
roadmap pointer and trigger; the U7 status and exit-evidence lines in the program
worklist.

**Out of scope.** Appendices A and M and §1–§4 (U1), §5 (no chunk), §6 (U2),
§7/§8 (U3/U4, resolved), §9/§10/Appendix V (U5, resolved), §11 and Appendices
B/C/N/W–Z (U6, resolved), README/AGENTS/content/`DECISIONS.md` prose (U8), the P1
synthesis work (`ROADMAP.md:35-48`), and the date-gated fix-up re-measurement
(`ROADMAP.md:50-60`). A behaviour change to a gate or server is out of scope; a
red gate is a finding, not a repair. **§5 is out of scope even when a row reads
it:** a divergence between an appendix and the §5 body it describes is recorded
and scheduled, never fixed here (pass-1 M1).

**Boundary notes.** (a) `holonovel/DECISIONS.md` is U8's prose surface: U7 reads
its records and never edits them, except that 6.3 regenerates the G7 table inside
it. (b) `spec/audit/tdqs-scoreboard.json` is U8's file surface for the same
reason; U7 only validates it through the existing gate. (c) Appendix Q is the one
review target whose edit crosses the fingerprint boundary (EV14).

**Lens.** `drift-report` plus catalog ↔ live-artifact comparison: for each
appendix row, does the artifact it describes exist with the claimed shape, and
does a gate enforce the claim? A catalogue that over-claims gate coverage is the
chunk's most likely defect class (the U2/U6 precedent).

**Verdict vocabulary.** `PASS`; `DEFECT <ID>`; `builder-side`; `external-skill`;
`UNSET` (a row the session did not settle — only terminal on the K4 branch).
A **predicate** is the `file:line` of the condition a claim rests on, never a
gate's emitted message (`spec/audit/review-register.md:9-10`). A verdict is
**terminal** only when it maps to one of the four legal dispositions
(`docs/plans/README.md:60-63`): fixed in this increment; a dated entry inside an
existing `ROADMAP.md` section; a register row; or an AAR record-and-close note.
Every `builder-side` and `external-skill` row carries a record-and-close note
naming its reason (6.7); every `DEFECT` takes a register bullet (6.4). The tier
field (`P0`–`P3`) follows `AGENTS.md`'s triage — with one stated deviation: a P0
whose fix needs code or gate behaviour is **scheduled, not fixed here**, because
this increment may not change behaviour; the register bullet records that reason.

Verdict vocabulary inherited from `docs/plans/2026-11-15-unscoped-u6/review.md:3-5`.

## Row budget (67 rows)

Every appendix in scope is assigned: 20 + 13 + 23 + 3 + 8 = 67. Rows are
`R1`–`R67`, recorded in `review.md` as `| Row | Unit | Predicate | Verdict | Tier |`.

**What the gates do not cover** (the reason for the sample rules):
`checkSpecVersionFormat` sees only bare three-digit IDs (EV21), nothing resolves a
stamp to a CHANGELOG heading, nothing compares a Title cell to the §5 REQ title,
and the F assertion ratchet counts misses without detecting offsetting changes.
**Sample rule** for every block row: take rows 1, 11, 21, … (stride 10) up to and
including the block's last row — at most 10 samples, fewer for a short block. The
row passes when every sampled row's ID resolves to a §5 REQ header
(`grep -c "^\*\*REQ-<id> " spec/02-requirements.md`), its stamp resolves to a
`CHANGELOG.md` dated heading, and its catalogue claim is not contradicted by the
§5 body; any sampled failure is a `DEFECT`.

### Phase 1 — requirements and test catalogues (R1–R20)

| Row | Unit | Anchor |
|---|---|---|
| R1 | Appendix E lead-in: the §5-authority claim, the "which version last changed each requirement" contract, table shape, column contract, and ID grammar | `spec/appendices-reference.md:95-102` |
| R2 | E rows 1–166 of 1,324, sample rule applied | `:103-268` |
| R3 | E rows 167–332, sample rule applied | `:269-434` |
| R4 | E rows 333–498, sample rule applied | `:435-600` |
| R5 | E rows 499–664, sample rule applied | `:601-766` |
| R6 | E rows 665–830, sample rule applied | `:767-932` |
| R7 | E rows 831–996, sample rule applied | `:933-1098` |
| R8 | E rows 997–1,324, sample rule applied, ending at the F heading | `:1099-1429` |
| R9 | Stamp **attribution**: every distinct CalVer stamp resolves to a CHANGELOG heading, and on a 20-row sample the stamp is the first release date **at or after** the last-change date of the REQ's block (`git log -1 --format=%cs -L '/\*\*REQ-<id> /,/^\*\*REQ-/' spec/02-requirements.md`, an end-anchored block so a long paragraph cannot escape the window) — a `-S` pickaxe cannot see a body-only edit, and a commit made after a release but before the stamp was bumped is not a defect; the placeholder gap in EV21 is stated in the row | `scripts/validate.ts:705-731`; `CHANGELOG.md` headings |
| R10 | E ↔ §5 cross-reference, legal dispositions, and the coverage register's alignment (a §5 divergence is scheduled, not fixed) | `scripts/validate.ts:296-355,2179-2201`; pass-1 M1 |
| R11 | Appendix F lead-in: the retired-ID list, the suffixed-branch rule, the no-zero-padding rule, the runnable-script duty, and the `DECISIONS.md` manual-test duty | `:1430-1447` |
| R12 | F rows 1–97 of 769, sample rule applied | `:1448-1544` |
| R13 | F rows 98–194, sample rule applied | `:1545-1641` |
| R14 | F rows 195–291, sample rule applied | `:1642-1738` |
| R15 | F rows 292–388, sample rule applied | `:1739-1835` |
| R16 | F rows 389–485, sample rule applied | `:1836-1932` |
| R17 | F rows 486–582, sample rule applied | `:1933-2029` |
| R18 | F rows 583–679, sample rule applied | `:2030-2126` |
| R19 | F rows 680–769 (90 rows ⇒ 9 samples under the stride), ending at the G heading | `:2127-2219` |
| R20 | F ↔ harness resolution, the **orphan** T-row sweep (a row no REQ cites, and a REQ with no row), and the assertion-miss ratchet — run directly, not inferred from the count | `scripts/lib/req-checks.ts:602-621`; `scripts/validate.ts:2612-2629`; pass-1 M3 |

Blocks are contiguous line ranges measured from the file, not ID bands: neither
catalogue is sorted by ID (EV9), so an ID-range row would not map to a readable
region.

### Phase 2 — tool-surface appendices (R21–R33)

| Row | Unit | Anchor |
|---|---|---|
| R21 | Appendix T lead-in: four categories, the `§5.19` canonical enumeration, the DECISIONS help-category duty, the `_Check:_` line | `:3451-3471` |
| R22 | T.1 output-format catalogue: six formats, roles, mandatory/optional, the `[INVALID_INPUT]` rule | `:3472-3491` |
| R23 | T.2 TDQS dimensions and weights, hard gates, tier bar | `:3492-3520` |
| R24 | T.2 server-level coherence, disambiguation axis, shadowing risk, the per-dimension defect table | `:3521-3552` |
| R25 | T.3 tool-surface contract: intent groups, projection, generated-tool conformance | `:3553-3654` |
| R26 | Appendix O lead-in: the §5/§7.3 pointer and what O is authoritative for | `:3058-3062` |
| R27 | O.2 error taxonomy — the ten categories and the corrective-action duty | `:3063-3082` |
| R28 | O.1 roll-transparency example | `:3083-3105` |
| R29 | O.9 structured result contracts | `:3106-3120` |
| R30 | O.10 codex adventure payload (REQ-321f) | `:3121-3134` |
| R31 | O.8 lookup completeness example | `:3135-3157` |
| R32 | O.11 base-capability tuning values and all of O.12, including its recall-probe fixture paragraph | `:3158-3210` |
| R33 | O.13 subjective-memory divergence contracts | `:3211-3234` |

### Phase 3 — reference appendices (R34–R56)

| Row | Unit | Anchor |
|---|---|---|
| R34 | Appendix D: handshake, capability advertisement, `tools/list` base surface | `:53-67` |
| R35 | D: `tools/call` semantics, output schemas, structured results | `:68-80` |
| R36 | D: `resources/list` + `resources/read`, prompts, networking-disabled, gated states, MCP Apps | `:81-94` |
| R37 | Appendix G lead-in and G.1 capability profile | `:2220-2290` |
| R38 | G.2 progressive sampling protocol | `:2291-2325` |
| R39 | G.3 PDF protocol | `:2326-2378` |
| R40 | G.4 HTML protocol | `:2379-2426` |
| R41 | G.5 structured fidelity report | `:2427-2440` |
| R42 | G.6 cross-converter verification | `:2441-2477` |
| R43 | Appendix H lead-in and the 13 blocking checklist items | `:2478-2501` |
| R44 | H: the 7 informational items and the converted-source trio | `:2502-2519` |
| R45 | Appendix I permissively-licensed ruleset catalogue (12 rows) | `:2520-2541` |
| R46 | Appendix J anti-slop synopsis (18 rows) | `:2542-2569` |
| R47 | Appendix K structural conventions and world-section format | `:2570-2609` |
| R48 | K: TTRPG annotation format (12 rules) | `:2610-2656` |
| R49 | K: provenance block, format example, and the adventure-index gate | `:2657-2764`; `package.json:97` |
| R50 | Appendix L lorebook interchange format | `:2765-2783` |
| R51 | Appendix P lead-in: threats and trust boundaries | `:3235-3264` |
| R52 | P.1 OWASP crosswalk (32 rows) | `:3265-3294` |
| R53 | Appendix Q interchange contract: round-trip and field contract | `:3295-3340` |
| R54 | Q: remaining rows, and the `DATA_SECTIONS` fingerprint consequence (EV14) | `:3341-3352` |
| R55 | Appendix R deprecated terminology (21 rows) | `:3353-3389` |
| R56 | Appendix S builder glossary (8 entries) | `:3390-3450` |

### Phase 4 — content licences (R57–R59)

| Row | Unit | Anchor |
|---|---|---|
| R57 | Appendix U lead-in: single-source-of-truth claim, the §6.4 README-footer duty | `spec/appendices-licenses.md:1-8` |
| R58 | U's 13-source table ↔ `docs/licenses/ATTRIBUTION.md` `## Register` (13 rows) | `:9-21`; `docs/licenses/ATTRIBUTION.md:10-27` |
| R59 | U's three admission rules (LICENSE file per vendored Narrative-frameworks row, `source_url` in the synthesis manifest, borrowed-mechanics code citation), the operator-supplied class, the OGL clause | `:23-43`; `docs/licenses/ATTRIBUTION.md:28-87`; pass-2 M5 |

### Phase 5 — assets and records (R60–R67)

| Row | Unit | Anchor |
|---|---|---|
| R60 | `tool-definitions.json` — `tool_count` equals `tools.length` equals the registry's distinct tool names; snapshot ↔ spec sync gate | `holonovel/tool-definitions.json:3`; EV12, EV17 |
| R61 | `tool-surface-registry.json` — `taxonomy` + `actions`, intent groups, T.3 conformance | EV18 |
| R62 | `tool-disambiguation.json` — axes, clusters, mutual-reference rule | `scripts/tool-definitions-lint.ts:200-219` |
| R63 | `tool-routing.json` — routing entries resolve to registered tools | `scripts/lib/package-manifest.ts:28` |
| R64 | `holonovel/schemas/mcp-server.schema.json` + `PROVENANCE.md` (the worklist's `schemas/*`) | EV13 |
| R65 | `holonovel/server.json` + root `glama.json` — registry manifest shape | `scripts/check-server-manifest` (EV17) |
| R66 | The `DECISIONS.md` records Appendix T requires (help-category mapping, tool budget, description budget) — read-only | EV10; U8 owns the file |
| R67 | `spec/audit/tdqs-scoreboard.json` — the T.2 tier bar's recorded captures (read-only) | `scripts/check-tdqs-scoreboard.ts:19` |

## Phase 0 — precondition and increment bootstrap

1. `git status --porcelain` must be empty (the draft and the cold artifacts live
   under the gitignored `plans/`, so they never appear); `git rev-parse --short
   HEAD` must be `f886d9c`. Otherwise re-baseline EV1–EV22.
2. `npm run check:fast`, un-piped, must print `check:fast: PASS` and
   `45 passed, 0 failed` (EV2). A red baseline here is fixed first as its own
   commit.
3. Create `docs/plans/2026-11-15-unscoped-u7/` with three files in one step:
   `plan.md` (this document), an authored `tasks.md` (one task per phase, one
   sub-task per row group, the verification table and the commit last), and a stub
   `aar.md` ending `LOOP OPEN` with the line "increment in progress — U7 row review
   under way". Copy `plans/2026-11-15-unscoped-u7.cold/` to `plan.cold/` here, so
   the cold provenance is tracked from the start of execution.
4. The stub `aar.md` satisfies `check-loop-artifacts`: a `LOOP OPEN` token is an
   error **only** when its caller demands a paused AAR
   (`scripts/lib/loop-artifacts.ts:75-91`), and `scripts/check-loop-artifacts.ts:33`
   passes no such option — so `check:fast` stays green through the session. The
   refusal of `LOOP OPEN` lives in `session:close`, not in the gate
   (`docs/plans/README.md:47-54`). `check:fast` is therefore run at two points, not
   one: the baseline here and once mid-session after 6.3 (6.3b).
5. **Do not edit `ROADMAP.md` at Phase 0.** The pointer and trigger are correct
   until 6.6 closes the chunk; they move once.
6. Settle the "already gated" line (EV16, question 6): `check-registry` exists but
   is network-bound and outside the manifest. Hold the corrected wording for 6.4,
   where U7-F1 is recorded.
7. Record both re-measurement arms: the commit count since `2026-11-15` and the
   date `2026-11-28` (`ROADMAP.md:59`). Neither is met, so no work on that section
   is permitted.

## Phase 1 — Appendices E and F (R1–R20)

For each row: name the predicate that settles the claim, apply the sample rule,
and record the row. The exit evidence is `worklist.md:290-292` for the artifact
half, plus the gate behaviour for these two:

- E is authoritative when `parseManifest` (`scripts/validate.ts:296-313`) reads
  it, `checkCrossRefs` reports orphans (`:349`), and the uncited sweep runs
  (`:2188-2201`). The 1,324-row count is EV9.
- F is authoritative when every cited harness title resolves to a row
  (`scripts/lib/req-checks.ts:602-621`) and the assertion-miss ratchet holds
  (`scripts/validate.ts:2612-2629`) — and R20 checks orphans directly, because a
  count ratchet cannot see two offsetting changes (pass-1 M3).

Probes, each redirected to a file with its exit status captured (no pipes):

1. `npm run validate > /tmp/opencode/u7-validate.log 2>&1; echo EXIT=$?` then
   `grep -E 'Appendix E manifest|Appendix F|orphan REQ' /tmp/opencode/u7-validate.log`.
2. `npx tsx scripts/validate.ts --traceability > /tmp/opencode/u7-trace.log 2>&1;
   echo EXIT=$?` — the coverage matrix and REQ-family `_Check:` coverage.
3. `grep -cE '^\| *REQ-' spec/appendices-reference.md` and the T-row equivalent —
   confirm EV9 from the file, not from this plan.
4. The stamp arm of R9 directly, on one suffixed REQ per distinct stamp:
   `git log -1 --format=%cs -L '/\*\*REQ-321f /,+6':spec/02-requirements.md`.
5. `git diff --stat` after each probe — both catalogues are read-only here.

A row whose block contradicts its gate is a `DEFECT`; a fix that needs code is
recorded and scheduled.

## Phase 2 — Appendices T and O (R21–R33)

Every row in this phase runs all four surface gates; the table maps gates to the
rows that cite them, not one gate per row:

| Gate / probe | Rows | Notes |
|---|---|---|
| `npm run check-tool-surface` | R21–R25 | EV18: reads the committed registry + snapshot, never a live server |
| `npm run tool-definitions-lint` | R21–R25 | EV18: also validates `tool-disambiguation.json` |
| `npm run check-tool-definitions-sync` | R21–R25 | generated definitions match their source |
| `npm run tool-citation-check` | R21–R25 | every `tool (action: …)` binding in a REQ body resolves |
| `grep -n '\[FORBIDDEN\]' holonovel/src holonovel/testdata` | R26–R33 | O.2's ten categories must each have a raise site or a recorded `UNIMPLEMENTED` path |
| `npm run check-tdqs-scoreboard` | R23–R24, R67 | validates the recorded captures; it does not fetch tdqs.dev |

The T.2/T.3 rows compare the appendix's thresholds with the committed artifacts:
dimension weights against `spec/audit/tdqs-scoreboard.json`, the description
budget against its `DECISIONS.md` record (read-only, R66), and the intent-group
vocabulary against `tool-surface-registry.json` (R61).

## Phase 3 — the reference appendices (R34–R56)

Per appendix:

1. Read the block and extract each claim that names an artifact, a command, a
   REQ, a test ID, or a gate.
2. Resolve the claim: `grep`/`sed -n` for the predicate, or the gate that owns it
   (EV17). A claim about an artifact outside the tree is `builder-side` **with a
   reason**, and that reason becomes an AAR record-and-close note (pass-1 B8).
3. A claim the repository contradicts (a named command that does not exist, a
   fingerprint duty that is not stated, a REQ ID that does not resolve) is a
   `DEFECT` with the predicate in `file:line`.
4. Q gets one extra step: any Q edit triggers the fingerprint boundary (EV14), so
   6.3 regenerates with `npm run build-order`, not `npm run assemble`.

Appendix K's index claims are checked against `npm run check-adventure-index`
(EV17), which gates the adventure module index and the DECISIONS table.

## Phase 4 — Appendix U and the licences (R57–R59)

1. Compare U's 13 rows (`:9-21`) to `docs/licenses/ATTRIBUTION.md:10-27` row by
   row; the sets must be equal (EV8, EV20). The anchor spans the whole table, so a
   set difference is a real finding.
2. Verify each of the three admission rules the appendix states: a LICENSE file
   for each vendored `Narrative frameworks` row, a `source_url` on each module
   entry in `holonovel/src/core/wisdom.ts:82-113` for those same rows (the
   synthesis manifest in code — `holonovel/narrative_world_model/MANIFEST.md` is a
   hash table and carries no URL column), and the code citation for each
   `Borrowed mechanics` row. Where a module entry has no `source_url`, the row
   records a `DEFECT` with that `file:line`.
3. Confirm the §6.4 README-footer duty is a stated contract; the footer's content
   is U8's surface, so a footer mismatch becomes a U8 record-and-close note.

## Phase 5 — assets and records (R60–R67)

These rows change no file. Each runs one command or one comparison and records its
exit status, the artifact's shape, and whether the appendix agrees:

| Row | Run / comparison |
|---|---|
| R60 | `node -e "const d=require('./holonovel/tool-definitions.json');console.log(d.tool_count, d.tools.length)"` — must print `37 37`, and the registry must name 37 distinct tools across its 299 actions |
| R61–R63 | The T.3 gates above; then `git status --porcelain holonovel/` after the run — a gate that writes is a finding |
| R64 | Read `mcp-server.schema.json`'s title/version against the pinned protocol version `DECISIONS.md` records; confirm `PROVENANCE.md` states the file's origin |
| R65 | `npm run check-server-manifest`; then diff `server.json` against its schema |
| R66 | `grep` the three required records in `holonovel/DECISIONS.md`; a missing record is a finding with a U8 disposition |
| R67 | `npm run check-tdqs-scoreboard`; confirm every captured tier is at or above B |

## Phase 6 — disposition and close

1. **(6.1)** Write `review.md` with 67 rows, `R1`–`R67`, header
   `| Row | Unit | Predicate | Verdict | Tier |`, every row settled.
2. **(6.2)** Apply only the bounded prose fixes the review demonstrated, inside
   `spec/appendices-reference.md` and `spec/appendices-licenses.md`. A fix that
   needs a server, gate, registry, or §5 change is recorded and scheduled, never
   applied. Record each edited block's pre- and post-edit line count in
   `review.md`. Note that the sources are linted only through the assembled
   `holonovel.md` (`package.json:7`), so a column overrun shows up at V8 after
   6.3, not before.
3. **(6.3)** Regenerate in order after the last prose edit: `npm run assemble`
   (rewrites `holonovel.md`, `holonovel/holonovel.md`, the build-phase-map hash —
   EV15), then `npx tsx holonovel/scripts/generate-g7-attestation.ts` (rewrites the
   attestation and the G7 table), and — **only if Appendix Q was edited** —
   `npm run build-order` to regenerate `contract-fingerprints.ts` (EV14). The
   `**Spec hash:**` line in `holonovel/DECISIONS.md` is a push-time sync.
4. **(6.3b)** Run `npm run check:fast` un-piped. It must print `check:fast: PASS`
   and `45 passed, 0 failed` before any record is written, so the close never sits
   on a tree whose aggregate gate was last seen green hours earlier. A red result
   is fixed here, not at the close.
5. **(6.4)** Write the register entries **after** 6.2/6.3, so every cited line is
   current, in the shape the parser reads (`scripts/lib/register-checks.ts:20-22`):
   a `### 2026-11-15 U7 reference appendices and registries` topic heading under
   the bucket that matches the disposition (`## Resolved` for a fix landed here,
   `## Scheduled-roadmap`, `## Closed-P3`, `## Deferred-by-user` —
   `spec/audit/review-register.md:12,2885,2940,3374`), then **one bullet per
   finding**: `- **U7-Fn — <claim>. <Disposition> (2026-11-15).** Predicate:
   <file:line>.` Every bullet carries a date or commit reference (the gate counts
   an undated one). A `Scheduled-roadmap` bullet must not cite a `REQ-NNN` that
   `ROADMAP.md` lacks (`register-checks.ts:64-69`) — cite the predicate file, and
   add the REQ to the owning roadmap bullet if it must be named. Record **U7-F1**
   here (the worklist's "already gated" line named a network-bound script); its
   correction lands in 6.5.
5. **(6.5)** Update `worklist.md`: the U7 row (`:97`) becomes
   `**reviewed 2026-11-15** — 67 rows, <a> P0 fixed, <b> P0 scheduled, <c> P1
   scheduled, <d> P2 scheduled, <e> P3 closed (…/review.md)` with the counts
   **substituted from `review.md`**, never left as placeholders, and with zero
   listed where a slot is empty; the U7 section's `**Exit evidence:**` line
   (`:290-292`) is amended to the observed result; and the **Already gated** line
   (`:287-289`) takes the corrected gate names (U7-F1).
6. **(6.6)** Move the roadmap in one edit: `ROADMAP.md:30` names U8 next, and
   `:32`'s trigger clause names U8 ("the next allocated review session takes U8"),
   keeping the close condition. A genuinely new scheduled item either folds into an
   existing bullet of its owning section or opens a new `## <title> (P<n>)` section
   with 1–3 bullets and a `**Trigger:**` line — both current owners already hold
   three bullets (`ROADMAP.md:17-28,37-45`), so folding is the default
   (`check-roadmap.ts:24`). On the K4 branch the pointer and trigger stay at U7.
7. **(6.7)** Insert `CHANGELOG.md`'s dated section at the top, above the existing
   `## 2026-11-15 — Synthesis and fixtures…` heading (`CHANGELOG.md:3`), because
   `session:close` derives the commit subject from the **top** heading. Then write
   `aar.md`, replacing the Phase 0 stub: the done-bar verdict, a record-and-close
   note for every `builder-side` and `external-skill` row, and `LOOP PAUSED`.
8. **(6.8)** Run the verification table below, un-piped, recording each exit
   status — V1–V11b. A red V1–V11b is fixed in place and re-run; if it cannot be
   fixed, take the K4 branch. V2 and V4 can only pass after 6.7, which is why the
   table runs last.
9. **(6.9)** `npm run session:close` — one commit.

## Blast radius

| Surface | Files | Change |
|---|---|---|
| Prose (bounded) | `spec/appendices-reference.md`, `spec/appendices-licenses.md` | S–M — only demonstrated defects |
| Fingerprint (conditional) | `holonovel/src/generated/contract-fingerprints.ts` | M — only if Appendix Q is edited (EV14) |
| Generated | `holonovel.md`, `holonovel/holonovel.md`, `spec/build-phase-map.md`, `holonovel/src/generated/g7-attestation.ts` | M — regenerated by 6.3 |
| Generated record | the G7 table inside `holonovel/DECISIONS.md` | S — regenerated by 6.3 |
| Records | `spec/audit/review-register.md`, `ROADMAP.md:30,32`, `docs/plans/2026-11-10-unscoped-surface-review/worklist.md:97,287-292`, `CHANGELOG.md` | S–M |
| Increment | `docs/plans/2026-11-15-unscoped-u7/{plan,tasks,review,aar}.md`, `plan.cold/` (copied from `plans/2026-11-15-unscoped-u7.cold/`) | M — new files |
| Read-only | `holonovel/DECISIONS.md` (all records except the G7 table), `spec/audit/tdqs-scoreboard.json`, `docs/licenses/ATTRIBUTION.md`, `holonovel/schemas/`, the four tool registries, `holonovel/src` server code, gate scripts | — |

## Verification

Run un-piped, each with its exit status captured:

| # | Command | Expected |
|---|---|---|
| V1 | `npm run assemble` | exit 0; the build-phase-map hash changes **iff** 6.2 edited a spec file |
| V2 | `npm run check:fast` | `45 passed, 0 failed`, `check:fast: PASS` — run three times: baseline (Phase 0 step 2), mid-session (6.3b), and at the close |
| V3 | `grep -cE '^[|] R[0-9]+ [|]' docs/plans/2026-11-15-unscoped-u7/review.md` | 67 |
| V4 | `npm run check-loop-artifacts` | pass — plan/tasks/AAR present with a terminal token, `plan.cold/` tolerated |
| V5 | `npm run check-registers:strict` | pass — every register bullet carries a disposition, a date, and resolves |
| V6 | `npm run check-roadmap` | pass — the sweep section is present with 1–3 bullets and a trigger, the Non-goals pointer resolves (`check-roadmap.ts:24-25`; it does **not** read pointer or trigger text) |
| V6b | `sed -n '30p;32p' ROADMAP.md` | `:30` names U8 as next and `:32`'s trigger names U8 (the read V6 cannot make) |
| V7 | `npm run check-fingerprint-sync` | pass — clean unless Q was edited, in which case `build-order` ran |
| V8 | `npm run lint` and `npm run validate:sdd` | 0 errors; proofreading warnings are informational |
| V9 | `npm run check-anchors` | pass — TypeScript source anchors resolve (does **not** cover Markdown `file:line`, which 6.4 spot-checks) |
| V10 | `npm run tool-citation-check` and `npm run check-tool-surface` | pass — the U7 surface gates stayed green across the prose edits |
| V11 | `comm -23 <(grep -oE 'DEFECT U7-F[0-9]+' docs/plans/2026-11-15-unscoped-u7/review.md \| sed 's/^DEFECT //' \| sort -u) <(grep -oE 'U7-F[0-9]+' spec/audit/review-register.md \| sort -u)` | empty — every `DEFECT` ID in `review.md` has a register bullet |
| V11b | `grep -c '^- \*\*U7-F' spec/audit/review-register.md` | at least 1 — an empty registration cannot pass. This is a presence floor, not an equality: U7-F1 is registered here without being a verdict row, so a count-versus-count test would be off by one on a conformant run |

V3 counts data rows only: the pattern requires an `R<digit>` cell followed by
another cell. V8's lint reads the assembled `holonovel.md`, so a source-level
overrun must be fixed in `spec/` and re-assembled before re-running it. CI and the
pre-push hook remain the authority for the full pass (`npm run check`), which adds
`check-container-image`, `test:all`, and `test:pipeline`.

## Risks and rollback

| # | Risk | Mitigation |
|---|---|---|
| K1 | E and F are 2,093 rows; block rows collapse into a single finding | The block row carries the owning gate plus the fixed sample; the count is EV9. A gate that cannot see a column is named in the row. |
| K2 | Appendix Q gets a prose fix and the fingerprint goes stale | 6.3 branches on it: `npm run build-order`, verified by V7. |
| K3 | A prose fix shifts line anchors the register cites | The register is written after the fixes (6.4) and every `file:line` is confirmed with `sed -n`; bullets also name their heading. |
| K4 | 67 rows exceed the session | No commit: revert every edit this session made — `git checkout -- spec/audit/review-register.md ROADMAP.md docs/plans/2026-11-10-unscoped-surface-review/worklist.md spec/appendices-reference.md spec/appendices-licenses.md` — then `npm run assemble` and `npx tsx holonovel/scripts/generate-g7-attestation.ts`; remove `docs/plans/2026-11-15-unscoped-u7/` (untracked) after copying `review.md` into the ignored `plans/` area; run no close; report. The chunk stays `scheduled` in the worklist. |
| K5 | An Appendix F edit trips the assertion-miss ratchet | The ratchet is a warning ratchet and may not rise. Run `npm run validate` before and after; prefer scheduling over an F edit that moves the baseline. |
| K6 | A row reaches for `check-registry` and needs the network | EV16 records why it is out; the row cites `check-registers`, `check-server-manifest`, or the CI-only status instead. |
| K7 | A U8-owned record is missing and the row wants to write it | R66/R67 are read-only; the finding is scheduled with a U8 pointer. |
| K8 | A `Scheduled-roadmap` bullet cites a REQ that `ROADMAP.md` lacks | 6.4 states the rule and the compliant move; V5 fails on a violation. |
| K9 | A red V1–V11b after 6.7 leaves no commit and no degrade path | 6.8 fixes in place and re-runs; if unfixable, K4 applies. |
| K10 | A new scheduled item overflows a full ROADMAP section | 6.6 states the fold-or-new-section rule against `check-roadmap.ts:24`; V6 catches a 4-bullet section. |

Rollback: `git revert <commit>` restores everything in the blast radius, including
the regenerated assembly output, the attestation, the G7 table, and (if touched)
the fingerprints. Task-level narrowing (prose only) is stated in the front matter.
Cost 1 — reversible, no external state, no migration.

## Commit plan

One commit, via `npm run session:close` (a spec increment stays one commit per
`AGENTS.md`). The commit must pass V1–V11b before it is made; a failing tree stops
and reports rather than committing. On the K4 branch no commit is made at all.

## Done bar

**Done bar:** this increment is done when all of the following hold:

1. `review.md` carries 67 rows, `R1`–`R67`, in the declared column shape, and no
   row is `UNSET`.
2. Every `DEFECT` row appears in `spec/audit/review-register.md` as a dated,
   dispositioned bullet (V5, V11, V11b), and every `builder-side` /
   `external-skill` row carries an AAR record-and-close note.
3. `worklist.md:97` records the U7 session in the U1–U6 form with real counts, the
   U7 section carries its amended exit-evidence line, and the "Already gated" line
   names the right gates — observable as
   `sed -n '97p;287,292p' docs/plans/2026-11-10-unscoped-surface-review/worklist.md`.
4. `ROADMAP.md:30` names U8 next **and `:32`'s trigger clause names U8** (V6b).
5. Every row of the verification table (V1–V11, V11b, V6b) passes, each recorded
   un-piped with its exit status.
6. `aar.md` states the done-bar verdict against this list and ends `LOOP PAUSED`.
7. One commit, subject derived from the top CHANGELOG heading.

Not part of the bar: closing the roadmap section (U8 does that), any server or
gate behaviour change, the P1 synthesis work, and the fix-up re-measurement.

## Open questions

1. **Does U7 need a new registry artifact?** No. It reviews whether the appendices
   match the artifacts that exist; a missing artifact the appendix names is the
   finding, not the deliverable.
2. **Why are E and F reviewed in contiguous blocks rather than by ID band?**
   Neither catalogue is sorted by identifier (EV9), so an ID band does not map to a
   readable region. The blocks are measured from the file and each carries the
   owning gate plus the fixed sample.
3. **Is Appendix U's README-footer duty verified here?** Only as a stated contract
   (R57); the footer text itself is U8's surface.
