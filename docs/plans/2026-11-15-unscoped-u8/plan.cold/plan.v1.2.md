# Plan — U8: repo governance and content assets (unscoped-surface review sweep)

Status: draft v1.2 — self pass 2026-11-15 applied (F1–F8); cold pass 1 on v1.1
returned `independent-review FAILED` (2 Blockers, 6 Majors, 9 Nits), all applied
verbatim as R1–R17 below. Delta re-review owed; plan gate open.
Kind: planned · Depth: standard
Increment target: `docs/plans/2026-11-15-unscoped-u8/` — created in Phase 0
step 3, not before. This draft lives in the gitignored `plans/` area, so no
tracked increment directory exists while the gate is open and
`check-loop-artifacts` stays green.
Rollback cost: 1 (one revert restores the increment directory, the register
entry, the `worklist.md` U8 lines and status row, the removed `ROADMAP.md`
section, any bounded prose fix, and `CHANGELOG.md`). A task-level narrowing of
the prose fixes is `git checkout <commit> -- README.md holonovel/README.md
holonovel/AGENTS.md SECURITY.md holonovel/Dockerfile holonovel/NOTICE.md`; the
register, worklist, and roadmap edits stand independently of those fixes.
Evidence class: EV1, EV6, EV9, EV17, EV25 are `tool-output`; every other premise
is a `file:line` read or a directory listing at HEAD `eb686b5`.
Trust boundary: every premise is read from the working tree. No web fetch, no
user statement, and no upstream content enters the plan; the governance docs'
own external links are checked for shape, never fetched (K5).
Review independence: fresh. Cold pass 1 reviewed
`plans/2026-11-15-unscoped-u8.cold/plan.v1.1.md`
(sha256 `dd7181a7afc54959fe33813272f70e382d2bc22641924bb26ebfe3d855b95e62`)
and reported to `plans/2026-11-15-unscoped-u8.cold/report.md` (stages 5/5 in one
fresh context — the reviewer records that its five stages could not be split into
fresh children, a deviation the stamp carries). Hashes are recorded by the stamp,
not restated here.

## Resolutions (cold pass v1.1 → v1.2)

All 17 findings are applied. Blockers first.

- **R1 [design, Blocker 1] — V6b's line expectation could not hold.** Removing
  `ROADMAP.md:15-33` leaves the blank separator (`:34`) at new `:15`. 6.5 now
  removes `ROADMAP.md:15-34` (section plus its trailing blank), so `:15` becomes
  the synthesis heading as V6b expects.
- **R2 [design, Blocker 2] — 6.5 wrote the wrong worklist block.** U8's exit
  evidence is `worklist.md:314-316`; `:324-326` is the shared per-chunk close
  protocol. 6.5 and the blast radius now say `:314-316` (status row `:98` was
  correct and stays).
- **R3 [design, Major 3] — five reviewed files had no destination.** Root
  `AGENTS.md` joins 6.2's prose list; root `LICENSE`, `holonovel/LICENSE.md`,
  `docs/e5-world-pack-gap-report.md`, and `docs/ruleset-index-phase0.md` join the
  read-only row, where a finding is scheduled, not edited.
- **R4 [design, Major 4] — the citation sweep over-reached.** 6.5b is scoped to
  live governance surfaces (`ROADMAP.md`, `spec/audit/`, `AGENTS.md`, the
  worklist) and explicitly excludes `docs/plans/` history, which this program
  does not rewrite (`worklist.md:40`). The "one exists today" claim becomes "no
  live register bullet cites the sweep section; one cites lines the removal
  moves."
- **R5 [design, Major 5] — R35's finding class had no repair path.** 6.2 now
  includes `spec/audit/review-register.md` for a stale section pointer, and
  Phase 3 states the branch: re-point a bullet whose scheduled work is still
  live (adding a 1–3-bullet roadmap section only if the work has no home), or
  record-and-close it if the work shipped.
- **R6 [design, Major 6] — 6.3 named no writer.** Added:
  `npm run refresh-properties` for the markers and
  `npx tsx holonovel/scripts/generate-g7-attestation.ts` (no `--check`) for the
  G7 table.
- **R7 [design, Major 7] — "45 passed" survived in three places.** 6.3b and done
  bar 4 now reference "the Phase 0 baseline count (EV2)"; only EV2 records 45.
- **R8 [design, Major 8] — the preflight evidence described a different
  artifact.** Preflight is re-run against `plans/2026-11-15-unscoped-u8/plan.md`
  with the full target list before stamping; a nonexistent `review.md` target is
  no longer passed.
- **R9 [clarity, Nit 9] — R24 was exhaustive and sampled at once.** It now
  enumerates all 37 names and samples the action lists at stride 5.
- **R10 [clarity, Nit 10] — R44's anchor stopped before `## Non-goals`.** Now
  `ROADMAP.md:1-74`.
- **R11 [clarity, Nit 11] — R31's range overlapped R30.** R30 owns
  `:1491-1581` (gate classification, the alias table, and the configuration
  classification record); R31 owns the dated entries at `:1372-1490,1582-2906`.
- **R12 [clarity, Nit 12] — bundled verification rows.** The preamble now says a
  row naming two commands records both exit statuses.
- **R13 [design, Nit 13] — `## Done bar` is not the artifact contract.**
  `scripts/lib/loop-artifacts.ts:92-98` looks for a `**Done bar:**` line; the
  section now carries one.
- **R14 [clarity, Nit 14] — multiple dispositions had no layout.** 6.4 states one
  `### 2026-11-15 …` heading per bucket, because the parser keys off `## `.
- **R15 [clarity, Nit 15] — V11's pipe rule and V11b's floor were imprecise.**
  The preamble exempts the `comm … <(…|…)` process substitution, and V11b states
  that the floor rests on EV8's confirmed drift.
- **R16 [clarity, Nit 16] — 6.7 omitted the heading contract.** The entry must
  read `## <YYYY-MM-DD> — <title>` with the date equal to the session date
  (`scripts/session-close.ts:246-257`).
- **R17 [clarity, Nit 17] — Phase 0 step 6 misnamed the second arm.** It is the
  `2026-11-28` date or 26 new commits, with the 2026-11-08→14 baseline.

## Self pass (v1 → v1.1)

Applied from the in-context pass on 2026-11-15; each is a correction to the
draft, not a new decision.

- **F1 [clarity] — four row anchors were wrong.** R10 cited a README marker that
  does not exist (`README.md` carries exactly one, `@spec:date` at `:479`), and
  R35–R37 used ranges that crossed the `## Closed-P3` boundary
  (`review-register.md:2919`). Corrected against the file headings.
- **F2 [design] — the two server docs are ungated.** `lint` reads only
  `holonovel.md` and `README.md` (`package.json:7`), so a fix in
  `holonovel/README.md` or `holonovel/AGENTS.md` would ship unchecked. 6.2 gains
  a manual column and count check, and V8 states the gap.
- **F3 [design] — the ROADMAP removal orphans a line-anchored citation.**
  `review-register.md:60` cites `ROADMAP.md:30-31`; removing `:15-34` makes that
  pointer false. 6.5b rewrites it to name the section, and K11 records the risk.
- **F4 [design] — V2 pinned a gate count.** A gate added between drafting and
  execution would fail a literal "45 passed". V2 now compares against the Phase 0
  count.
- **F5 [clarity] — the blast radius omitted two read-only surfaces.** Root
  `package.json` and `docs/plans/README.md` are reviewed rows but absent from the
  table; both now sit in the read-only row.
- **F6 [design] — the K4 revert list missed `holonovel/DECISIONS.md`.** 6.3 may
  regenerate the G7 table there; an incomplete revert would leave it modified.
- **F7 [design] — `check-registers:strict` satisfiability was assumed.** The fast
  gate runs the report-only form. EV26 probes the strict form and records that it
  is green, and Phase 3 states that the 125 grandfathered undated bullets are not
  findings.
- **F8 [clarity] — the removed section's content had no destination.** The
  roadmap rule says shipped work "moves to CHANGELOG.md" (`ROADMAP.md:7`); 6.7 now
  requires the entry to record the sweep's completion.

## Questions

1. **What is the next roadmap item?** The § *Unscoped-surface review sweep*
   (`ROADMAP.md:15-33`) names U8: "U8 is next (repo governance and content
   assets)" (`:30`), and the section closes when U8 is `Resolved` (`:32-33`).
   U1–U7 are reviewed and recorded (`docs/plans/2026-11-10-unscoped-surface-review/worklist.md:87-97`);
   U8 is the last chunk (`:98`).
2. **Why not the P1 synthesis section?** `ROADMAP.md:35-48` is higher priority
   but is server behaviour work, not a review, and it is not the section the
   roadmap designates as next. U7 followed the same rule when it scheduled
   U7-F4 rather than repairing it (`spec/audit/review-register.md:2927-2938`).
3. **Is U8 one session?** Yes, on the U6/U7 model: 60 verdict rows against U7's
   67. The two dominant catalogues — the registers and the vendored corpus —
   are grouped by contiguous block and settled by their owning gate plus a fixed
   sample, not by reading every row.
4. **Does U8 change code?** No. A defect that needs a server, gate, or
   content-regeneration change is recorded and scheduled. Writes are bounded
   prose, records, and the roadmap close. No `spec/` source is edited, so the
   assembly hash, the build-phase-map hash, and both contract fingerprints stay
   put (EV22).
5. **What closes the roadmap section?** Only U8, and it is the last chunk, so
   6.5 removes the whole section rather than advancing a pointer — the first
   chunk with that duty (`ROADMAP.md:7`).
6. **Do the historical tool counts in `DECISIONS.md` count as drift?** No. The
   current record block (`holonovel/DECISIONS.md:1-11`) must agree with the live
   surface; a dated entry that records 36 tools at its own date is history
   (EV11). R28/R31 split those two duties so the review cannot manufacture a
   finding from a superseded record.

## Baseline at HEAD (this session)

| # | Evidence | Command / source | Trust |
|---|---|---|---|
| EV1 | Tree clean on `main` at `eb686b5`, 107 unpushed commits, version `2026.11.15`, 4 open roadmap items | `git status --porcelain`; `git rev-parse --short HEAD`; `npm run status` | tool-output |
| EV2 | Fast gate green: **45 passed, 0 failed**, trailing `check:fast: PASS`, exit 0 | `npm run check:fast` (un-piped) | tool-output |
| EV3 | The sweep section, the U8 pointer, the trigger, and the close condition | `ROADMAP.md:15-33` | repo |
| EV4 | U8's declared scope, prose/assets lists, lens, already-gated list, exit evidence | `worklist.md:298-326` | repo |
| EV5 | The full-review assignment table sends content, docs, and governance to U8; `loop-audit.md` is U5's | `worklist.md:60-84` | repo |
| EV6 | `validate-readme` enforces structure, voice, links, the comparison table, the 1,500-word budget, and a bare-tool-name ban; its `toolNames` array holds **58 retired aliases and zero live names** | `scripts/validate-readme.ts:11-24,147-164,474`; live surface from `holonovel/tool-definitions.json:3` | tool-output |
| EV7 | Root `package.json` requires Node `>=24`; the server package requires `>=22`; the container base is `node:24-bookworm-slim` | `package.json:104`; `holonovel/package.json:149-151`; `holonovel/Dockerfile:6,13` | repo |
| EV8 | **Live drift:** `holonovel/README.md:57` states "36 action-discriminator tools"; `holonovel/AGENTS.md:46,65,126`, `DECISIONS.md:334`, and `tool-definitions.json:3` say 37, and all 37 carry a non-empty `action_enum` | `sed -n`; `node -e` probe over the definitions | tool-output |
| EV9 | Root `AGENTS.md` is 564 lines: layer map `:19-118`, conventions `:119-185`, operating routine `:186-208`, script discipline `:209-284`, gates `:285-390`, CI-only `:391-466`, review governance `:467-510`, commit checklist `:511-564` | `grep -n '^## '` | repo |
| EV10 | `holonovel/AGENTS.md` is 253 lines: layer map `:5-64`, tool surface `:65-137`, running/boot/packaging `:138-194`, state model `:195-210`, two-repo workflow `:211-237`, retirement `:238-253`; its counts line is `:46` | `grep -n '^## '` | repo |
| EV11 | `DECISIONS.md` is 2,972 lines; the current record block is `:1-11`; `## Non-goals` runs `:13-1371`; dated subsections continue to `:2906`; dated entries legitimately cite the counts of their own date (`:1003`, `:1008`, `:1012`) | `grep -n '^## '`; section reads | repo |
| EV12 | `NOTICE.md` names 13 bundled sources (`:11-23`) and points at `LICENSE.md` (`:3`); `holonovel/LICENSE.md` is the MIT text; root `LICENSE` is MIT | `cat -n`; file heads | repo |
| EV13 | `Dockerfile` is 25 lines; the runtime stage copies `dist`, `bin`, `content`, `holonovel.md`, `tool-surface-registry.json`, `tool-disambiguation.json`, and `NOTICE.md` (`:19-22`) — not `LICENSE.md`, `narrative_world_model/`, `schemas/`, `server.json`, or the other two registries | `cat -n holonovel/Dockerfile` | repo |
| EV14 | `check-container-image` is full-tier only and treats a missing Docker daemon as a pass — it cannot appear in a local fast run | `scripts/check-container-image.ts:1-15`; `scripts/lib/gate-manifest.ts:96-100` | repo |
| EV15 | The published `files` allowlist ships `content/torre-nosferatu.json`, `NOTICE.md`, `holonovel.md`, two registries, and `adventures` — and not `LICENSE.md` or `narrative_world_model/` | `holonovel/package.json:23-33` | repo |
| EV16 | `check-package-manifest` asserts metadata, export conditions, the files allowlist, exact pins, engines, and no install lifecycle scripts; its own message says "Node 22+" because the server package is `>=22` | `scripts/lib/package-manifest.ts:100-117`; `scripts/check-package-manifest.ts:1-12` | repo |
| EV17 | The vendored manifest carries 25 hash rows over 8 sources; `check:vendor --strict` recomputes every hash-bearing row and skips `(build-time)` rows | `holonovel/narrative_world_model/MANIFEST.md:19-45`; `holonovel/scripts/check-vendor-manifest.ts:55-66` | tool-output |
| EV18 | `narrative_world_model/` is 21 files / 124 K across `narrative/` (8 vendor dirs) and `world/` (template + generated provider); `content/` is 2 files / 456 K | `find`; `du -sh` | repo |
| EV19 | **Live drift candidate:** `narrative/README.md:13` claims IF Craft Corpus contributes "(59 documents)" while `narrative/if-craft-corpus/` holds exactly `LICENSE` and `README.md`; the same table says all sources are "freely incorporable" including CC BY-SA 4.0 | `sed -n '8-17p'`; `find narrative/if-craft-corpus` | repo |
| EV20 | `spec/audit/` holds 13 entries: 3 registers (`review`, `proofread`, `req-coverage`), 5 baselines/replays, 2 dated reports, `performance-record.json`, `tdqs-scoreboard.json`, `loop-audit.md` (U5's) | `ls spec/audit`; `wc -l` | repo |
| EV21 | `docs/plans/README.md` (81 lines) defines the increment layout and the two terminal tokens; `session:close` derives the subject from the top CHANGELOG heading and refuses `LOOP OPEN`; `check-roadmap` caps a section at 3 bullets | `docs/plans/README.md:13-70`; `scripts/session-close.ts:242-276`; `scripts/check-roadmap.ts:24` | repo |
| EV22 | Assembly and both contract fingerprints read only the 13 canonical `spec/` sources (`01-foundations.md` … `appendices-runbooks.md`); `spec/audit/`, README, and AGENTS are outside every hashed set | `scripts/lib/phase-map-hash.ts:19-33`; `scripts/lib/contract-fingerprint.ts:27-43` | repo |
| EV23 | The register parser reads `### <date> <topic>` buckets and `- **…**` bullets; a `Scheduled-roadmap` bullet fails on a cited `REQ-NNN` absent from `ROADMAP.md` | `scripts/lib/register-checks.ts:20-22,31-51,64-69` | repo |
| EV24 | The worklist's per-chunk close protocol is five steps, roadmap last; the status row is `:98` and U8's section is `:298-326` | `worklist.md:314-326` | repo |
| EV25 | The eight U8-adjacent manifest gates exist and are green: `validate-readme`, `lint`, `check-registers`, `check-traceability`, `check-vendor-manifest`, `check-reference-server-cleanliness`, `check-container-image` (full), `check-package-manifest` | `scripts/lib/gate-manifest.ts:90-300`; EV2 | tool-output |
| EV26 | `check-registers --strict` is green at HEAD: `PASS: review and proofread registers are structurally clean`, exit 0, with 125 grandfathered findings that carry no date — new bullets must carry one | `npm run check-registers:strict` | tool-output |

## Scope

**In scope.** Root governance docs (`README.md`, `AGENTS.md`, `SECURITY.md`,
root `package.json`); server governance docs (`holonovel/README.md`,
`holonovel/AGENTS.md`, `holonovel/DECISIONS.md`, `holonovel/NOTICE.md`,
`holonovel/LICENSE.md`, `LICENSE`, `holonovel/Dockerfile`); the records under
`spec/audit/` except `loop-audit.md`; `ROADMAP.md` and `CHANGELOG.md`
conventions; the vendored corpus (`holonovel/narrative_world_model/`); the
content assets (`holonovel/content/`, `holonovel/adventures/` as read-only);
`docs/upstream/cof.md`, `docs/e5-world-pack-gap-report.md`,
`docs/ruleset-index-phase0.md`; `docs/licenses/ATTRIBUTION.md`'s non-table
sections; `docs/plans/README.md` and the increment history; the worklist's U8
row, exit evidence, and program status.

**Out of scope.** `spec/audit/loop-audit.md` (U5); every `spec/` source file and
the appendices (§1–§11 are U1–U7); `docs/engine-contract.md` (U3);
`docs/workflow-cadence.md` and `docs/publish-pipeline.md` (U5); the gate scripts
and `.githooks/` (U2/U4); `.github/workflows/` (U4); the server source under
`holonovel/src/` (§5 sweep and U3); the fixture and playability surface (U6);
the tool registries, schemas, and `server.json`/`glama.json` (U7); the
`source_url` provenance gap already scheduled as U7-F4. A behaviour change to a
gate, a server, or a generated content pipeline is out of scope: a red gate or a
wrong count is a finding, not a repair.

**Boundary notes.**
(a) `holonovel/DECISIONS.md` is U8 prose, but its G7 disposition table is
generated; 6.3 runs `check-g7-attestation` and regenerates only on drift.
(b) `spec/audit/req-coverage.md` is regenerated by `validate --
--write-register`, not hand-edited; R38 decides whether it is current.
(c) The sweep section's removal is the chunk's own close, not a later step; the
worklist row, exit evidence, and program-status line move in the same edit.
(d) U8's writes do not touch a hashed source (EV22), so no fingerprint or
build-phase-map regeneration is expected; V1 verifies that expectation rather
than assuming it.

**Lens.** `drift-report` plus content/licensing review: for each governance
claim, does the artifact it describes match the live tree, and does a gate
enforce the claim? For each vendored or content asset, does the tree hold what
the manifest and the notices say it holds, and does the licence chain resolve?

**Verdict vocabulary.** `PASS`; `DEFECT U8-Fn`; `builder-side`;
`external-skill`; `UNSET` (a row the session did not settle — terminal only on
the K4 branch). A **predicate** is the `file:line` of the condition a claim rests
on, never a gate's emitted message (`spec/audit/review-register.md:9-10`). A
verdict is terminal only when it maps to one of the four legal dispositions
(`docs/plans/README.md:60-63`): fixed in this increment; a dated `ROADMAP.md`
entry; a register row; or an AAR record-and-close note. Every `builder-side` and
`external-skill` row carries a record-and-close note naming its reason (6.7);
every `DEFECT` takes a register bullet (6.4). The tier field (`P0`–`P3`) follows
`AGENTS.md`'s triage, with one stated deviation: a P0 whose fix needs code, a
gate change, or content regeneration is **scheduled, not fixed here**, because
this increment may not change behaviour. A bounded governance-prose fix (a stale
count, a broken internal link) is fixed in 6.2.

## Row budget (60 rows)

Rows are `R1`–`R60`, recorded in `review.md` as
`| Row | Unit | Predicate | Verdict | Tier |`.

**Sample rule** for every block row: take rows 1, 11, 21, … (stride 10) up to
and including the block's last row — at most 10 samples, fewer for a short
block. A sampled row passes when its claim resolves to the live artifact or to
the gate that owns it. `DECISIONS.md`'s dated entries are exempt from the
current-count comparison (EV11) but not from the citation check.

### Phase 1 — root governance docs (R1–R18)

| Row | Unit | Anchor |
|---|---|---|
| R1 | README DESIGN comment ↔ `validate-readme`'s enforced rules (structure, voice, audience, word budget) | `README.md:1-170`; `scripts/validate-readme.ts:44-70,470-476` |
| R2 | README Orientation and TOC: every h2/h3 present, audience tags, no self-link, no prose | `README.md:180-208` |
| R3 | README §1 Install: starter-playable claim, Node prerequisite, install block, MCP JSON | `README.md:209-253`; EV7 |
| R4 | README §1 Install a ruleset: package drop-in, lazy loading, state-directory location | `README.md:254-273`; `holonovel/README.md:41-54` |
| R5 | README §2 Convert and Build | `README.md:274-305` |
| R6 | README §2 Holodeck and Novel | `README.md:306-393` |
| R7 | README §2 Synthesis: inert-by-default and revertibility claims ↔ §11 contracts (read-only) | `README.md:394-419`; `spec/08-synthesis.md` |
| R8 | README §3 comparison table: three rows, one per competitor category; the October 2026 claim's shape | `README.md:420-434`; `scripts/validate-readme.ts` comparison check |
| R9 | README License list: 13 sources ↔ `NOTICE.md:11-23`, ATTRIBUTION, Appendix U (read-only) | `README.md:435-479`; EV12 |
| R10 | README `@spec:date` marker is generated, current, and matches the package version date (the only marker in the file) | `README.md:479`; `scripts/cross-property-couple.ts --check`; README DESIGN `License section` |
| R11 | AGENTS Project overview, Spec Kit model, and Layer map ↔ the live tree (every named path exists) | `AGENTS.md:1-118` |
| R12 | AGENTS Conventions: commits, prose, spec editing, wiki mirror, requirements | `AGENTS.md:119-185` |
| R13 | AGENTS Agent Operating Routine and Script discipline ↔ the detectors that enforce them | `AGENTS.md:186-284`; `scripts/check-script-discipline.ts`, `scripts/check-script-quality.ts` |
| R14 | AGENTS Gates table ↔ the manifest, and the CI-only table ↔ the workflow | `AGENTS.md:285-466`; `scripts/check-gate-table.ts` |
| R15 | AGENTS Review-loop governance: triage tiers, disposition vocabulary, loop tokens ↔ the register parser and `docs/plans/README.md` | `AGENTS.md:467-510`; EV23 |
| R16 | AGENTS Before-committing checklist ↔ gates that actually inspect each item | `AGENTS.md:511-564`; `scripts/validate.ts`, `scripts/check-fingerprint-sync.ts` |
| R17 | SECURITY.md: threat model, data-dir layout, badge enforcement, filesystem containment, REQ citations resolve | `SECURITY.md:1-70`; `holonovel/scripts/test-data-dir.ts` |
| R18 | Root `package.json`: every script reachable, gate names agree with the manifest, engine floor | `package.json:1-112`; EV7, EV25 |

### Phase 2 — server governance docs (R19–R33)

| Row | Unit | Anchor |
|---|---|---|
| R19 | `holonovel/README.md` Requirements, Install, MCP client configuration | `holonovel/README.md:1-40` |
| R20 | `holonovel/README.md` Data and Tool surface — **the 36-versus-37 count**, retired-alias claim, category list | `:41-72`; EV8 |
| R21 | `holonovel/README.md` Configuration: every switch is an environment switch and inert by default | `:73-89`; `docs/engine-contract.md` §… (U3-owned, read-only) |
| R22 | `holonovel/README.md` Development commands and License pointer | `:90-138`; `holonovel/package.json` scripts |
| R23 | `holonovel/AGENTS.md` Layer map ↔ the tree and the live resource/template/prompt counts | `holonovel/AGENTS.md:1-64`; EV10 |
| R24 | `holonovel/AGENTS.md` Tool Surface: all 37 names enumerate against the registry; the action lists are sampled at stride 5 | `:65-137`; `holonovel/tool-surface-registry.json` |
| R25 | `holonovel/AGENTS.md` Running, Boot, Packaging ↔ `prepack`/`postpack`, the `files` allowlist, the Node floor | `:138-194`; EV15, EV16 |
| R26 | `holonovel/AGENTS.md` State Model ↔ REQ-613 data-dir behaviour and the save layout | `:195-210`; `SECURITY.md:14-31` |
| R27 | `holonovel/AGENTS.md` Two-Repo Workflow and Retiring a server ↔ the scripts those steps name | `:211-253`; `scripts/update-server.ts`, `scripts/migrate-user-data.ts` |
| R28 | `DECISIONS.md` current record block: spec hash, tool/description/surface budgets ↔ the live counts and the gates that record them | `holonovel/DECISIONS.md:1-11`; EV8 |
| R29 | `DECISIONS.md` `## Non-goals`: sampled entries each cite a governing REQ, and the pointer rule holds | `:13-1371`; `scripts/check-roadmap.ts` |
| R30 | `DECISIONS.md` Gate classification and Configuration classification records ↔ registered tools/resources | `:1491-1581`; `scripts/check-traceability.ts` |
| R31 | `DECISIONS.md` dated entries (sampled): a dated count is history, and its claims resolve at its own date | `:1372-1490,1582-2906`; EV11 |
| R32 | `NOTICE.md`, `LICENSE.md`, root `LICENSE`: licence chain and the 13-source list ↔ Appendix U (read-only) | EV12; `spec/appendices-licenses.md:7-21` |
| R33 | `Dockerfile`: build/runtime split, what the image ships, and whether the omissions (`LICENSE.md`, vendors) are sound | EV13; `scripts/check-container-image.ts` |

### Phase 3 — records and registers (R34–R45)

| Row | Unit | Anchor |
|---|---|---|
| R34 | Review-register structure and row shape: bucket per disposition, one dated bullet per finding, parser-readable | `spec/audit/review-register.md:1-20`; EV23 |
| R35 | Every `Scheduled-roadmap` bullet names a live `ROADMAP.md` section (and no unroadmapped REQ) | `register-checks.ts:64-69`; `review-register.md:2919-2990` |
| R36 | `Resolved` bullets (stride 10): the predicate they say was repaired no longer holds | `review-register.md:14-2918` |
| R37 | `Closed-P3` / `Deferred-by-user` bullets (stride 10): the disposition is legal and the note states why | `review-register.md:2991-3449` |
| R38 | `req-coverage.md` freshness ↔ the coverage audit (`validate -- --write-register` is the writer) | `spec/audit/req-coverage.md:1-20`; `scripts/validate.ts` coverage audit |
| R39 | `proofread-register.md`: 386 lines, every finding carries one of the four dispositions | `spec/audit/proofread-register.md`; `scripts/check-registers.ts --strict` |
| R40 | Baselines: `action-conflicts-baseline.json`, `script-quality-baseline.json`, `conformance-baseline.json`, `tool-surface-baseline.json`, `tool-surface-replay.json` ↔ their gates | `scripts/action-conflicts.ts`, `scripts/check-script-quality.ts`, `scripts/compare-spec-code.ts`, `scripts/surface-budget.ts`, `scripts/surface-replay.ts` |
| R41 | `performance-record.json` ↔ `check-performance-record` | `scripts/check-performance-record.ts`; EV20 |
| R42 | `tdqs-scoreboard.json` ↔ `check-tdqs-scoreboard` (read-only; U7 reviewed the tier bar) | `scripts/check-tdqs-scoreboard.ts` |
| R43 | `remediation-2026-08-24.md` and `spec-code-comparison-2026-09-25.md`: dated reports, archived status, no live pointer needed | `spec/audit/remediation-2026-08-24.md:1-20`; `spec/audit/spec-code-comparison-2026-09-25.md:1-20` |
| R44 | `ROADMAP.md` admission rule ↔ `check-roadmap`; the section that closes and the three that remain | `ROADMAP.md:1-74`; `scripts/check-roadmap.ts:20-30` |
| R45 | `CHANGELOG.md` conventions ↔ `session:close`'s subject derivation and the spec-update narrative duty | `CHANGELOG.md:1-20`; `scripts/session-close.ts:242-276` |

### Phase 4 — vendored and content assets (R46–R55)

| Row | Unit | Anchor |
|---|---|---|
| R46 | `narrative_world_model/README.md` and `narrative/README.md`: subdirectory claims, update steps, provenance URLs | `holonovel/narrative_world_model/README.md:1-20`; `narrative/README.md:1-38`; EV19 |
| R47 | `MANIFEST.md`: 25 hash rows over 8 sources — recompute every hash-bearing row with the gate (never by hand) | EV17; `holonovel/scripts/check-vendor-manifest.ts:55-66` |
| R48 | `MANIFEST.md` File/Items cells ↔ the tree: every named file exists, and an enumerated item count matches the source's `### id — TIER` headers (stride 5) | `MANIFEST.md:19-45` |
| R49 | Eight vendored `LICENSE` files ↔ `NOTICE.md` / ATTRIBUTION / Appendix U — the gate's licence-parity clause | `scripts/check-reference-server-cleanliness.ts` clause (c) |
| R50 | `world/world-model-provider.md` is generated from its template and current | `holonovel/scripts/generate-world-provider.ts --check` |
| R51 | `content/torre-nosferatu.json` and its `.source.json`: starter assumption, provenance field, shipped-file parity | `holonovel/content/`; `holonovel/scripts/check-starter-freshness.ts`; EV15 |
| R52 | Content boundary: no per-book build assets or stray package triples outside the sanctioned fixture | `scripts/check-reference-server-cleanliness.ts` clauses (a),(b) |
| R53 | `adventures/index.json` and the two modules ↔ `check-adventure-index` (read-only; U7 owns the gate's spec side) | `holonovel/adventures/`; `npm --prefix holonovel run check-adventure-index` |
| R54 | `docs/upstream/cof.md`: what it is, whether the COF licence row it supports is consistent | `docs/upstream/cof.md:1-76`; `spec/appendices-licenses.md:21` |
| R55 | `docs/licenses/ATTRIBUTION.md` non-table sections (`:28-87`): links, contributions, modification status | `docs/licenses/ATTRIBUTION.md`; U7 reviewed `:10-27` |

### Phase 5 — docs and history (R56–R60)

| Row | Unit | Anchor |
|---|---|---|
| R56 | `docs/e5-world-pack-gap-report.md`: dated status, gaps still open, no stale owner | `docs/e5-world-pack-gap-report.md:1-122` |
| R57 | `docs/ruleset-index-phase0.md` ↔ the live ruleset tooling it proposes | `docs/ruleset-index-phase0.md:1-53` |
| R58 | `docs/plans/README.md` layout and tokens ↔ `check-loop-artifacts` and `session:close` | `docs/plans/README.md:13-70`; `scripts/lib/loop-artifacts.ts` |
| R59 | `plans/` archive (sampled) and the increment history: not re-reviewed, no live contract claimed | `plans/`, `docs/plans/*`; `worklist.md:84` |
| R60 | Cross-document links in the governance docs resolve (internal anchors and repo paths; external URLs checked for shape only) | `README.md`, `AGENTS.md`, `SECURITY.md`, `holonovel/README.md`, `holonovel/AGENTS.md` |

## Phase 0 — precondition and increment bootstrap

1. `git status --porcelain` must be empty (this draft and any cold artifacts live
   under the gitignored `plans/`); `git rev-parse --short HEAD` must be
   `eb686b5`. Otherwise re-baseline EV1–EV25.
2. `npm run check:fast`, un-piped, must print `check:fast: PASS` and
   `45 passed, 0 failed` (EV2). A red baseline is fixed first as its own commit.
3. Create `docs/plans/2026-11-15-unscoped-u8/` with three files in one step:
   `plan.md` (this document), an authored `tasks.md` (one task per phase, one
   sub-task per row group, the verification table, and the commit last), and a
   stub `aar.md` ending `LOOP OPEN` with the line "increment in progress — U8 row
   review under way". Copy any cold artifacts into `plan.cold/`.
4. The stub is legal: a `LOOP OPEN` token is an error only when its caller
   demands a paused AAR (`scripts/lib/loop-artifacts.ts:75-91`), and
   `scripts/check-loop-artifacts.ts:33` passes no such option. The refusal lives
   in `session:close` (`docs/plans/README.md:47-54`).
5. **Do not edit `ROADMAP.md` at Phase 0.** The section and its U8 pointer are
   correct until 6.5 closes the chunk.
6. Record both re-measurement arms: the `2026-11-28` date or 26 new commits,
   against the 2026-11-08→14 baseline (`ROADMAP.md:52-59`). Neither is met, so no
   work on that section is permitted.

## Phase 1 — root governance docs (R1–R18)

For each row: read the block, extract every claim that names a file, a count, a
command, a gate, a REQ, or a licence, and resolve it. The owning gates are
`validate-readme` (R1–R10), `check-gate-table` (R14), `check-registers` and
`check-traceability` (R15, R17, R29–R30), and `check-markers` (R10).

- R17's data-dir claims run against `npm --prefix holonovel run test:data-dir`,
  not against the prose alone.
- R18's engine floor is a two-package fact: root `>=24`, server `>=22`, and
  `check-package-manifest`'s message says 22. A row that finds the message
  misleading records a finding against the checker's text, not a count mismatch.
- R8's "October 2026" comparison is an external claim with no recorded source;
  it is `external-skill` only if the README's own DESIGN comment requires a
  source. Otherwise it is judged on shape (three categories, one row each).

## Phase 2 — server governance docs (R19–R33)

The dominant finding class is a stale count in a document no gate counts
(EV6, EV8, EV19). Each row records the claim, the live value, and the gate that
could have caught it — or states that no gate reads that document.

- R20 is the anchor row: the 36/37 mismatch (EV8) is settled by reading
  `tool-definitions.json:3` and the `action_enum` probe, not by a gate message.
  If it is confirmed, the fix is bounded prose in 6.2.
- R23's resource/template/prompt counts need the live registration surface. Use
  the recorded values the gates already validate (`AGENTS.md`'s counts line and
  the `@spec:` markers) and say so; do not start a server for a count.
- R28's spec-hash line is push-time-synced; a mismatch at HEAD is not a defect
  until the push pipeline runs. The row records the value and the sync rule.
- R31 samples dated entries and checks their citation shape only. A dated entry
  that records 36 tools is history (EV11), and the row says so explicitly.
- R33's Docker claims cannot be executed locally: `check-container-image` is
  full-tier and Docker-optional (EV14). The row records the manifest evidence
  and names CI as the authority.

## Phase 3 — records (R34–R45)

Every row here runs `npm run check-registers:strict` first and then reads what
the gate cannot see (EV23): the truth of a `Resolved` claim, the freshness of a
register, the relevance of a baseline. A gate-green register can still hold a
stale `Resolved` bullet; that is the finding class for R36.

- R38: if the coverage register is stale, the repair is
  `npm run validate -- --write-register` — a generated write, not an edit. That
  is allowed here because it is a build-tool invocation, not a behaviour change.
- R44 prepares the close: it records the section text that 6.5 removes and
  confirms the other three sections survive the removal (`check-roadmap` caps
  each at 3 bullets).
- R45 reads conventions only; the CHANGELOG entry itself is written in 6.7.
- R35's branch when a bullet names a section that no longer exists
  (`review-register.md:2979` cites a §5.3 section `ROADMAP.md` does not hold): if
  the scheduled work is still live, 6.2 re-points the bullet at the section that
  now owns it, and opens a 1–3-bullet section in 6.5 only if the work has no
  home; if the work shipped, the bullet is record-and-closed in 6.4. No branch
  leaves the row `UNSET`.
- R34/R37 sample the register but do not raise the 125 grandfathered undated
  bullets as findings (EV26): the gate tolerates them and this increment may not
  rewrite history. The row records the count and that new bullets are dated.

## Phase 4 — vendored and content assets (R46–R55)

1. R47 runs `npm --prefix holonovel run check:vendor` (strict) and records the
   per-row match count. A hash mismatch is a P0 content-provenance finding.
2. R48 compares the manifest's File cells to `find`; an enumerated Items cell is
   checked against the source's `### id — TIER` headers on the sample.
3. R49 runs `npm run check-reference-server-cleanliness`, whose clause (c) is
   the licence-parity predicate.
4. R51 runs the starter-freshness gate and inspects `.source.json`'s provenance
   field; a regeneration need is scheduled, not improvised.
5. R53 runs the adventure-index gate; the gate is U7's surface, so the row is
   read-only and the finding (if any) is scheduled against U7's owner file.
6. U7-F4 (`source_url` in the manifest) is already scheduled
   (`review-register.md:2927-2938`); no row re-opens it, and R46/R48 cite it.

## Phase 5 — docs and history (R56–R60)

No document in this phase is gated except through `lint` (which reads only the
assembled `holonovel.md` and `README.md` — EV6, `package.json:7`). Each row is a
read-and-resolve: a dated report whose status is still open, a phase-0 note
whose proposal shipped, or a link that no longer resolves. `plans/` is sampled
and never re-reviewed (EV5).

## Phase 6 — disposition and close

1. **(6.1)** Write `review.md` with 60 rows, `R1`–`R60`, header
   `| Row | Unit | Predicate | Verdict | Tier |`, every row settled.
2. **(6.2)** Apply only the bounded governance-prose fixes the review
   demonstrates — a stale count, a broken internal link, a licence pointer, a
   stale register section pointer — inside `README.md`, `AGENTS.md`,
   `holonovel/README.md`, `holonovel/AGENTS.md`, `SECURITY.md`,
   `holonovel/NOTICE.md`, `holonovel/Dockerfile`, and
   `spec/audit/review-register.md` (existing bullets only; new findings are
   6.4's). A fix that needs a server, a gate, a content regeneration, or a
   licence-text edit is recorded and scheduled. Record each edited block's pre-
   and post-edit line count in `review.md`.
   `lint` reads only `holonovel.md` and `README.md` (`package.json:7`), so the
   three other docs are ungated: hand-check that no edited paragraph exceeds 120
   columns, and re-read the edited block for count agreement before moving on.
   Root `package.json`, the licence texts, and the two dated `docs/` reports are
   read-only here; a finding there is scheduled (K3).
3. **(6.3)** Run the regeneration checks; regenerate only on drift, with the
   writer named: `npm run check-g7-attestation`, then
   `npx tsx holonovel/scripts/generate-g7-attestation.ts` (no `--check`) if it
   reports drift; `npm run check-markers`, then `npm run refresh-properties` if
   the markers are stale. `npm run assemble` is expected to be a no-op (EV22);
   run it and record the hash as unchanged.
4. **(6.3b)** Run `npm run check:fast` un-piped. It must print
   `check:fast: PASS` with the Phase 0 baseline's passed count and `0 failed`
   before any record is written.
5. **(6.4)** Write the register entry after 6.2/6.3, so every cited line is
   current, in the parser's shape (EV23): one
   `### 2026-11-15 U8 repo governance and content assets` heading **per bucket
   used** — `## Resolved`, `## Scheduled-roadmap`, `## Closed-P3`,
   `## Deferred-by-user` — because the parser keys a section off `## `, then one
   bullet per finding:
   `- **U8-Fn — <claim>. <Disposition> (2026-11-15).** Predicate: <file:line>.`
   A `Scheduled-roadmap` bullet cites the predicate file and adds the REQ to the
   owning roadmap bullet if it must be named (`register-checks.ts:64-69`).
6. **(6.5)** Close the sweep in one edit: remove `ROADMAP.md:15-34` (the
   section plus its trailing blank, so `:15` becomes the synthesis heading),
   leaving the three P1/P2 sections and the `## Non-goals` pointer. If R35 found
   scheduled work with no home, add its 1–3-bullet section here. Update
   `worklist.md:98` to
   `**reviewed 2026-11-15** — 60 rows, <a> P0 fixed, <b> P0 scheduled, <c> P1
   scheduled, <d> P2 scheduled, <e> P3 closed (…/review.md)` with every count
   substituted from `review.md`, and amend U8's `**Exit evidence:**` line
   (`:314-316`) to the observed result. Add the program-complete line under the
   status table.
7. **(6.5b)** Re-confirm the live citations into `ROADMAP.md` after the removal:
   the register (`spec/audit/review-register.md`), `AGENTS.md`, and the worklist.
   No live register bullet names the sweep section; one,
   `review-register.md:60`, cites `ROADMAP.md:30-31` and is rewritten to name the
   section rather than the line. `docs/plans/` history is out of scope — this
   program does not edit another increment's artifacts (`worklist.md:40`) — so
   its old line citations stay as they were. Then `sed -n` the new register
   entry's citations.
8. **(6.6)** Verify `ROADMAP.md` admits the removal: each remaining `##`
   section carries 1–3 bullets and a `**Trigger:**`, and `## Non-goals` stays a
   three-line pointer (`check-roadmap.ts:20-30`).
9. **(6.7)** Insert `CHANGELOG.md`'s dated section at the top, above the
   existing top heading (`CHANGELOG.md:3`), in the form
   `## <YYYY-MM-DD> — <title>` with the date equal to the session date
   (`scripts/session-close.ts:246-257`), because `session:close` derives the
   commit subject from the top heading; the entry records the sweep's completion
   (U1–U8), since the removed section's work "moves to CHANGELOG.md"
   (`ROADMAP.md:7`). Then write `aar.md`, replacing the Phase 0
   stub: the done-bar verdict, a record-and-close note for every `builder-side`
   and `external-skill` row, and `LOOP PAUSED`.
10. **(6.8)** Run the verification table below, un-piped, recording each exit
   status. V2 and V4 can only pass after 6.7. A red row is fixed in place and
   re-run; if it cannot be fixed, take the K4 branch.
11. **(6.9)** `npm run session:close` — one commit.

## Blast radius

| Surface | Files | Change |
|---|---|---|
| Prose (bounded) | `README.md`, `AGENTS.md`, `holonovel/README.md`, `holonovel/AGENTS.md`, `SECURITY.md`, `holonovel/NOTICE.md`, `holonovel/Dockerfile` | S–M — only demonstrated defects |
| Records | `spec/audit/review-register.md` (existing-bullet repairs plus the new entry), `spec/audit/req-coverage.md` (only if R38 regenerates it), `ROADMAP.md`, `worklist.md:98,314-316`, `CHANGELOG.md` | S–M |
| Generated (conditional) | the G7 table inside `holonovel/DECISIONS.md`; README `@spec:` marker values | S — only on drift from 6.3 |
| Increment | `docs/plans/2026-11-15-unscoped-u8/{plan,tasks,review,aar}.md`, optional `plan.cold/` | M — new files |
| Unchanged (verified) | `holonovel.md`, `holonovel/holonovel.md`, `spec/build-phase-map.md`, `holonovel/src/generated/contract-fingerprints.ts`, `holonovel/src/generated/g7-attestation.ts`, `spec/` sources | — — V1/V7/V12 prove it |
| Read-only | root `package.json`, root `LICENSE`, `holonovel/LICENSE.md`, `DECISIONS.md` (except the generated table), `spec/audit/*` baselines and reports, `holonovel/narrative_world_model/`, `holonovel/content/`, `holonovel/adventures/`, `docs/upstream/`, `docs/licenses/`, `docs/e5-world-pack-gap-report.md`, `docs/ruleset-index-phase0.md`, `docs/plans/README.md` and the increment history, gate scripts, server source | — |

## Verification

Run un-piped, each command's exit status captured; a row naming two commands
records both statuses:

| # | Command | Expected |
|---|---|---|
| V1 | `npm run assemble` | exit 0; the build-phase-map content hash is unchanged (EV22) |
| V2 | `npm run check:fast` | the passed count the Phase 0 baseline printed (45 at drafting, EV2), `0 failed`, `check:fast: PASS` — baseline, mid-session (6.3b), and close |
| V3 | `grep -cE '^[|] R[0-9]+ [|]' docs/plans/2026-11-15-unscoped-u8/review.md` | 60 |
| V4 | `npm run check-loop-artifacts` | pass — plan/tasks/AAR present with a terminal token |
| V5 | `npm run check-registers:strict` | pass — every bullet carries a disposition and a date |
| V6 | `npm run check-roadmap` | pass — the removed section is gone, every remaining section has 1–3 bullets and a trigger, the pointer resolves |
| V6b | `grep -c '^## ' ROADMAP.md` and `sed -n '15p' ROADMAP.md` | 4 (three items + `## Non-goals`); `:15` is the synthesis heading — the read V6 cannot make |
| V7 | `npm run check-fingerprint-sync` | pass — unchanged (no `spec/` source edited) |
| V8 | `npm run lint` then `npm run validate:sdd` | 0 errors each; proofreading warnings are informational. Note: `lint` reads only `holonovel.md` and `README.md` (`package.json:7`), so `holonovel/README.md`, `AGENTS.md`, and `holonovel/AGENTS.md` need the manual column check in 6.2 |
| V9 | `npm run check-anchors` | pass — TypeScript source anchors resolve |
| V10 | `npm run tool-citation-check` then `npm run check-tool-surface` | pass each — no prose fix moved a tool binding |
| V11 | `comm -23 <(grep -oE 'DEFECT U8-F[0-9]+' docs/plans/2026-11-15-unscoped-u8/review.md \| sed 's/^DEFECT //' \| sort -u) <(grep -oE 'U8-F[0-9]+' spec/audit/review-register.md \| sort -u)` | empty — every `DEFECT` ID has a register bullet. The pipe ban governs the command's own output, not the process substitutions inside it |
| V11b | `grep -c '^- \*\*U8-F' spec/audit/review-register.md` | at least 1 — a presence floor. It holds because EV8's 36/37 drift is already confirmed at `holonovel/README.md:57`, so at least one bullet exists |
| V12 | `npm run check-g7-attestation` then `npm run check-markers` | pass each — regenerated (R6's writer) only if 6.3 reported drift |
| V13 | `git status --porcelain` | only the intended files; no stray cold artifacts, no edited `spec/` source |

## Risks and rollback

| # | Risk | Mitigation |
|---|---|---|
| K1 | A dated `DECISIONS.md` entry is read as a stale current count | R28/R31 split the duties; EV11 states the history rule; every row cites the entry's date |
| K2 | Removing the sweep section breaks a cross-reference to it | 6.5 updates the worklist row, exit evidence, and program status in the same edit; V6/V6b verify |
| K3 | A P0 needs a gate or server change and cannot land here | The vocabulary schedules it with its predicate; the register records the reason (U6/U7 precedent) |
| K4 | 60 rows exceed the session | No commit: revert every edit — `git checkout -- README.md AGENTS.md holonovel/README.md holonovel/AGENTS.md SECURITY.md holonovel/NOTICE.md holonovel/Dockerfile holonovel/DECISIONS.md spec/audit/review-register.md spec/audit/req-coverage.md ROADMAP.md docs/plans/2026-11-10-unscoped-surface-review/worklist.md CHANGELOG.md` — remove `docs/plans/2026-11-15-unscoped-u8/` after copying `review.md` to the ignored area, run no close, report. The chunk stays `scheduled`. |
| K5 | A row wants to fetch an external URL | The trust boundary forbids network; external links are checked for shape only; a provenance claim with no in-tree evidence is `external-skill` |
| K6 | R33's Docker claim is asserted without a run | EV14 makes the gate full-tier and Docker-optional; the row records manifest evidence and names CI |
| K7 | A `Scheduled-roadmap` bullet cites a REQ absent from `ROADMAP.md` | 6.4 states the rule; V5 fails on it |
| K8 | The 36/37 fix lands in one doc while another keeps the old count | R20, R23, R28 all read the same predicate (EV8); 6.2 lists every edited file |
| K9 | A README edit pushes past the 1,500-word budget or the 120-column lint | 6.2 re-runs `npm run lint`; V8 is the aggregate |
| K10 | U7-F4 is re-opened as a duplicate finding | R46/R48 cite the scheduled row instead of raising it again |
| K11 | Removing the sweep section invalidates a line-anchored `ROADMAP.md` citation elsewhere | 6.5b names the one known citation (`review-register.md:60`) and requires a `sed -n` pass over the new register entry's citations |

Rollback: `git revert <commit>` restores everything in the blast radius. Task-level
narrowing (prose only) is stated in the front matter. Cost 1 — reversible, no
external state, no migration.

## Commit plan

One commit, via `npm run session:close` (a review increment stays one commit per
`AGENTS.md`). The commit must pass V1–V13 before it is made; a failing tree stops
the close and takes the K4 branch.

## Done bar

**Done bar:** all six items below pass, and the AAR judges against this line.

1. `review.md` carries 60 rows, `R1`–`R60`, in the declared shape, none `UNSET`.
2. Every `DEFECT` has a dated, dispositioned register bullet; every
   `builder-side` / `external-skill` row carries a record-and-close note.
3. The sweep section is removed from `ROADMAP.md`, `worklist.md:98` reads
   `reviewed 2026-11-15` with counts drawn from `review.md`, and the program
   status line says the sweep is complete.
4. `npm run check:fast` is green at the close — the Phase 0 baseline's passed
   count and `0 failed` — and every row of the verification table passes,
   recorded un-piped.
5. `aar.md` states the verdict against this bar and ends `LOOP PAUSED`.
6. One commit from `session:close`.
