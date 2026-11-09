# Plan — Full-review sweep, chunk P2 (tool surface and §5.3)

**Status:** draft, awaiting user approval · **Date:** 2026-11-09 · **Depth:** standard
**Review independence:** fresh — cold pass FAILED on one blocker (the bucket model)
and three majors; diff re-review passed with three minors, all applied. Review
artifact `/tmp/opencode/sweep-p2/independent-review.md` sha256 `7549dcde…` ·
stages 4/5 · 22/40 reads. This final revision differs from the diff-reviewed one
only by the three applied minors. · **Rollback cost:** 1
**Roadmap item:** `ROADMAP.md` § Remaining full-review sweep (P1)
**Predecessor:** `docs/plans/2026-11-09-full-review-sweep/` (chunk P1 + M1, closed
2026-11-09, `LOOP PAUSED`)

## Done bar

**Done bar:** this increment only — chunk P2 of an eight-chunk program. The bar is
met when all nine items hold; anything else found is scheduled, not chased.

1. `docs/plans/2026-11-09-full-review-p2/` carries `plan.md`, `tasks.md`, and
   `aar.md`, and `aar.md` ends in `LOOP PAUSED` or `LOOP OPEN` (the token the
   outcome earns). `check-loop-artifacts` passes.
2. `docs/plans/2026-11-09-full-review-sweep/worklist.md` chunk P2 section holds
   **one row per §5.3 REQ — 115 rows**, each with the bucket inherited from its
   base family row (`C` or `E`) and a verdict of `holds` (including
   `holds (inherited from <family>)` for the 38 sub-REQs with no own
   `_Check:_`), `finding:<ID>`, or `builder-side`. That row set, not the gate
   result, is the falsifiable record that the chunk was reviewed.
3. Every `finding:<ID>` names a `file:line` or `spec:line` predicate and a
   P-severity, and has a terminal disposition (fixed · `Scheduled-roadmap` ·
   `Closed-P3` · `Deferred-by-user`).
4. Zero open P0 findings remain. A P0 that cannot be fixed inside the session
   stops the run: it still lands as a record (see **Stopped-run landing**).
5. Each of the seven §5.3 clusters (A–G below) has a recorded review verdict:
   `holds` with the gate that carries it, or the finding IDs it produced. A
   cluster is not "reviewed" because a gate is green; the gate's assertion is
   checked against the REQ text.
6. `spec/audit/review-register.md` carries every P2 finding under the section
   its disposition names (see **Register write-back**); no
   `Scheduled-roadmap` row is written without its matching `ROADMAP.md` entry.
7. `ROADMAP.md` is updated in the same increment: the sweep section still names
   chunks P3–P8 and M1, and its `**Trigger:**` line names chunk P3.
8. These exit 0 un-piped: `npm run assemble`, `npm run check:fast`,
   `npm run check`.
9. The increment is one commit, subject derived by `npm run session:close` from
   the `CHANGELOG.md` heading; a conditional C0 baseline fix precedes it as its
   own commit. No push.

## Open questions (answers recorded as decisions before execution)

- **Q1 — Fix policy.** Same as chunk P1's D2: P0 fixed in-session (bounded), P1
  scheduled on `ROADMAP.md`, P2 fixed only on a demonstrated failure, P3
  record-and-close. **Recommendation:** adopt unchanged, so the sweep stays
  comparable across chunks.
- **Q2 — Where the chunk record lives.** Chunk P1's `worklist.md` is the
  cross-session tracker for the whole program (`worklist.md:1-8`), but each
  increment needs its own `plan.md`/`tasks.md`/`aar.md` (the `check-loop-artifacts`
  contract, `scripts/lib/loop-artifacts.ts:59-87`). **Recommendation:** a new
  directory `docs/plans/2026-11-09-full-review-p2/` for this increment's
  plan/tasks/AAR, and the P2 verdict table plus status row appended to the
  existing sweep worklist. One tracker, one increment record per chunk.
- **Q3 — Verdict vocabulary for §5.3's 38 sub-REQs without an own `_Check:` line.**
  The register's §5.3 rows are family-level: 69 rows cover all 115 sub-REQs,
  58 bucket C and 11 bucket E, with no A/B/D population (EV4). A bare sub-REQ
  ID (`REQ-161a`) will never match a row; only its base family (`REQ-161`) will.
  **Recommendation:** inherit the bucket from the base family row, and use
  exactly P1's three verdicts — `holds` (including `holds (inherited from
  <family>)` for the 38), `finding:<ID>`, `builder-side` for bucket E. No
  fourth verdict: a `spec-side` class does not exist in §5.3, and inventing one
  would mislabel 38 runtime or process claims that their family row already
  evidences.
- **Q4 — Where the §5.3/P6 boundary sits.** `§5.3` owns tool/resource/prompt
  *registration* contracts; `§5.10`, `§5.13`, and `§5.21`–`§5.23` (chunk P6)
  own the projection and adapter behavior behind those registrations.
  **Recommendation:** P2 reviews the registration surface and the advertised
  payload (`tool-definitions.json`, `index.ts` definitions, resource/prompt
  catalogs); it records but does not audit projection internals, which P6
  owns. A finding whose predicate lands in P6 files is scheduled against P6's
  chunk, not fixed here.
- **Q5 — Publication.** `npm run status` reports 4 unpushed commits at session
  start (EV2). **Recommendation:** no push; publication is user-authorized.

## Scope

**In scope.** Chunk P2 review (§5.3, 115 REQs): the live tool surface, the
generated surface artifact, tool/resource/prompt registration and descriptions,
`spec_health`'s surface reporting, and the surface-profile/version metadata
§5.3 claims. Findings dispositioned. Roadmap trigger advanced. Register rows.
Changelog entry.

**Out of scope.** Chunks P3–P8 and M1; §5.9/§5.19 (closed by the 2026-11-09
seam pass); surface-projection and adapter internals (Q4); the two open
remediation items (trust-core contract, trust-core citations) — they are
independent roadmap entries; publication; version release notes.

## Evidence base (this session)

| # | Evidence | Source | Trust |
|---|---|---|---|
| EV1 | `check:fast` → PASS, 37 passed / 0 failed, `check:fast: PASS` | tool output, this session | tool-output |
| EV2 | `npm run status`: version `2026.11.09`, last publish `2026-11-09T04:30:29Z`, 4 unpushed commits (oldest 12.7h), 4 open roadmap items | tool output, this session | tool-output |
| EV3 | §5.3 = **115 REQs** (`REQ-020a` … `REQ-574`), seven clusters; 1 282 REQs total across 35 subsections | `spec/02-requirements.md` (counted this session) | repo |
| EV4 | Coverage register carries **69 §5.3 family rows** — 58 bucket C, 11 bucket E, none A/B — one row per base family (`REQ-020` covers `REQ-020a`/`-020b`). All 69 §5.3 families are present (compared by base ID: no family missing, no extra), so no §5.3 REQ falls to bucket A/B/D. **38 of the 115 sub-REQs carry no own `_Check:_` line** and inherit their family's citation set; the list is produced by enumerating §5.3 blocks and testing for `_Check:_` in the block | `spec/audit/req-coverage.md`, `spec/02-requirements.md` (enumerated this session) | repo |
| EV5 | Live surface: **37 tools**, 112 264 serialized bytes (28 066 tokens) full profile; standard 97 871 B / 24 468 tokens; small 4 570 B / 1 143 tokens | `holonovel/tool-definitions.json` (`tool_count`, `surface_footprint`) | repo |
| EV6 | Recorded budget: **37 listed tools, 242 canonical actions**, 4 retired hidden tools, 1 retired hidden action carrying 54 tombstones | `holonovel/DECISIONS.md:5` | repo |
| EV7 | Registration surface: 42 `registerTool(` sites in `holonovel/src/index.ts` = 37 canonical + 4 retired hidden tombstones (`resolve_fate` `:7386`, `resolve_ironsworn` `:7551`, `resolve_forged` `:7683`, `manage_session` `:9913`) + 1 dynamic loop (`:2229`, variable `toolName`); `tools/list` must show 37. The registry module is `holonovel/src/tool-registry.ts` (98 lines) | `grep -c`, `sed -n`, `wc -l` | repo |
| EV8 | Seven tool-definition gates in the manifest — `check-tool-definitions-sync`, `tool-definitions-lint`, `check-tool-surface`, `surface-budget`, `surface-replay`, `check-tdqs-scoreboard`, `tool-citation-check` — plus `action-conflicts` and `check-package-manifest`; the TDQS harnesses (`holonovel/scripts/test-tool-definitions.ts`, `test-security.ts` T536) run in the server suite, not the root manifest | `npm run gates -- --list`, `holonovel/package.json:88` | tool-output, repo |
| EV9 | Chunk P1 closed 2026-11-09 with `LOOP PAUSED`; P2 is `scheduled` in the worklist | `docs/plans/2026-11-09-full-review-sweep/{aar.md:68,worklist.md:35}` | repo |
| EV10 | Roadmap trigger names chunk P2 (tool surface and §5.3) as the next session's start | `ROADMAP.md:28` | repo |

## The chunk's review surface — seven clusters

Mapping check: the 115 REQ IDs from EV3 partition across these clusters with no
gap and no duplicate (counts below sum to 115). Verify with the enumeration used
in EV3 before starting.

| Cluster | REQs | Count | Code/spec target | Gate already carrying part of it |
|---|---|---|---|---|
| **A** tool surface and economy | 020a/b, 021, 408, 413, 414, 415, 112, 057a/b, 058, 110, 059a–c, 182a/b, 183a/b, 323a/b | 21 | `index.ts` definitions, `tool-registry.ts`, `tool-definitions.json` | `check-tool-surface`, `surface-budget`, `action-conflicts`, `tool-definitions-lint` |
| **B** tool documentation and TDQS | 024a–c, 427, 450, 552–555, 584 | 10 | `tool-definitions.json`, `score-tool-definitions.ts`, `generated/` | `tool-definitions-lint`, `check-tdqs-scoreboard`, `test-tool-definitions.ts` (T509, T644–T648, T679–T680) |
| **C** resources and UI | 022a/b, 296a–c, 426a–d, 105, 106, 139, 572 | 13 | resource registration in `index.ts`, `graph://`, `ui://`, `spec://` | `tool-citation-check`, `check-reference-server-cleanliness` |
| **D** prompts and guidance | 023a/b, 067a–d, 063a–c, 078a, 078b, 078c1–c4, 078d, 138a/b | 18 | prompt registration and `prompts/list` shape | none directly (REQ-023b's T22/T28/T155 sit in the server suite) |
| **E** spec_health and diagnostics | 025a, 025b1, 025b2, 025c, 160a–c, 169a/b, 269, 411, 583, 587, 588, 606–610 | 19 | `manage_diagnostics` handlers, `spec_health` payload | `check-tdqs-scoreboard`, `check-markers` (indirectly) |
| **F** surface profiles and catalog projection | 567–571, 573–581 (incl. 579a) | 15 | `surface-report.ts`, projected catalog | `surface-budget`, `surface-replay`, `check-tool-surface` |
| **G** build metadata and configuration | 107a/b, 161a–c, 162a–c, 163a/b, 164a/b, 187a/b, 278, 388a–d | 19 | version sync, `build-phase-map` hash, config discovery, intake contract | `check-fingerprint-sync`, `build-order` |

Cluster F overlaps cluster A's economy REQs in subject but not in REQ IDs; the
partition above is the authority (F holds the profile/composition REQs, A the
per-tool surface REQs).

## Steps

### Phase 0 — Baseline (no source edits)

1. Re-run `npm run check:fast` un-piped immediately before the review and
   record the exit status; run `npm run check` once so the full gate's baseline
   is measured rather than inherited from EV1. A red baseline — from the root
   gate or from either server harness in step 2 — is a P0 and is fixed first,
   as its own commit, per the standing route.
2. Run the server-suite harnesses that own §5.3's TDQS and definition
   assertions — `npm --prefix holonovel run test:tool-definitions` and
   `npm --prefix holonovel run test:security` (or `test:all` for the whole
   suite) — and record their exit status. They are not in the root gate
   manifest (EV8), so a green `check:fast` says nothing about them.
3. Confirm `git status --porcelain` beyond the increment directory, and record
   `git rev-parse --short HEAD`.
4. Confirm the artefact directory is trackable:
   `git check-ignore -v docs/plans/2026-11-09-full-review-p2/` returns nothing.
5. Record the answers to **Q1–Q5** as **D1–D5** in the sweep `worklist.md`
   before review work starts. Decisions go in the worklist, not this file, so
   the stamped plan hash stays valid for the whole increment.
6. Record the plan gate's evidence sidecar: `plan-gate.mjs preflight --project
   /home/fluke/Holonovel --plan <stamped artifact> --out <artifact>.evidence.json`
   writes the plan hash, target existence/tracking, REQ matches, and git HEAD
   beside the stamped artifact. The artifact and its sidecar are the review
   record the stamp cites.
7. Re-derive the cluster partition (the 115 REQ IDs) and confirm the counts in
   the table above. A mismatch is fixed in the worklist, not by silently
   re-scoping.

### Phase 1 — Chunk P2 code side (read-only review)

1. **Enumerate the surface**, recording `file:line` anchors in the worklist:
   the `registerTool` definition sites in `index.ts` (EV7), `tool-registry.ts`,
   `surface-report.ts`, the generator `holonovel/scripts/generate-tool-definitions.ts`,
   the resource and prompt registration paths, and the `spec_health` /
   `manage_diagnostics` handlers. Enumeration confirms names; nothing is assumed
   from the P1 worklist.
2. **Run `code-review` cluster by cluster (A–G)** over the enumerated surface,
   scoring each against its cluster's REQ bodies. Budget: one pass per cluster,
   findings batched; a finding cites the predicate (`file:line`), never a gate
   message.
3. **Check the gate's assertion against the REQ text** for every REQ a gate is
   believed to carry: read the gate's assertion and confirm it tests what the
   REQ states. A gate that passes while asserting something narrower than the
   REQ is a finding (this is the class that produced F-P1-1 in chunk P1).
4. **Check the advertised artifact against the live registry**: `tool_count`
   (EV5) against the *canonical* registry entries only. The 42 `registerTool`
   sites are not 42 advertised tools: 37 canonical + 4 retired hidden tombstones
   + 1 dynamic loop (EV7), so a raw site count compared with `tool_count` would
   raise a false P0. Compare `tools/list` length and `tool-definitions.json`
   `tool_count` instead, and confirm `tools_list_bytes` matches the projection
   the generator records. A stale generated artifact that the freshness gate
   accepts is a finding.
5. **Record one verdict per REQ** in the worklist's chunk P2 table (115 rows,
   done-bar item 2), using the Q3 vocabulary.

### Phase 2 — Chunk P2 spec side

1. Apply chunk P1's reproducible resolution method (`worklist.md:69-72`): each
   REQ's own `*Check:*` IDs; a REQ with no own Check inherits its family's
   citation set; an `Automated` citation must appear literally in a
   `holonovel/scripts` harness; `Manual`/`Gate` citations need none. Bucket is
   **inherited from the base family row** in `spec/audit/req-coverage.md` —
   resolve `REQ-161a` through `REQ-161`; a bare sub-REQ ID matches no row. All
   69 §5.3 families are present (EV4), so no §5.3 REQ resolves to bucket A/B/D.
2. Classify citation *kind* before counting a missing harness — P1's first pass
   produced 69 false findings by skipping this (`aar.md:39-42`).
3. A REQ whose cited test does not exercise the stated behavior is a finding.
   `npm run check:conformance -- --dedicated` over-flags on this corpus
   (AGENTS.md), so its output is evidence to inspect, never a finding by itself.
4. Fill the bucket column and the verdict column for all 115 rows.

### Phase 3 — Triage, registers, roadmap, artefacts

1. **Triage** every finding per Q1: P0 fixed here with a targeted assertion added
   to the harness that owns the behavior; P1 to `ROADMAP.md`; P2 only with a
   demonstrated failure; P3 record-and-close.
   - A P0 fix that changes an action's parameters or output first runs a
     sibling-contract check: grep the REQ corpus for other REQs naming the same
     `tool (action: X)` (`` `REQ-[0-9]+[a-z0-9]*` + the action name ``) and
     confirm no sibling contract conflicts before editing.
   - A P0 fix that amends a REQ body complies with the §5 authoring limits
     recorded in Appendix M (one paragraph, no tables/bullets/steps, 800-char
     and 8-sentence caps); `npm run validate --sdd-strict` is the check.
   - If a P0 fix edits a tool definition, re-run the generator and the surface
     gates: `npm run build-order` owns the regenerate + version-sync path
     (`scripts/build-order.ts:211`), and `check-tool-definitions-sync` fails on a
     stale `tool-definitions.json`.
   - If a P0 fix edits a §5.3 REQ body: `npm run assemble`, then
     `npm run validate -- --write-register`, then `npm run build-order`. §5.3 is
     in neither fingerprint section list (`scripts/lib/contract-fingerprint.ts:27`
     package format, `:37-43` data format), so no fingerprint regeneration is
     implied by the REQ edit itself; `build-order` still runs for version sync.
2. **`spec/audit/review-register.md`**: one dated heading per disposition
   section, rows per **Register write-back** below.
3. **`ROADMAP.md`**: keep the item's three-bullet shape and `**Trigger:**`
   (`ROADMAP.md:3-12`; `check-roadmap` rejects any other shape). Bullet 1 names
   chunks P3–P4, bullet 2 chunks P5–P7, bullet 3 chunk P8 plus the closing M1
   re-run; the trigger names chunk P3 (mutation, decision, and lifecycle
   handlers against §5.4/§5.6).
4. **`CHANGELOG.md`**: one dated heading
   `2026-11-09 — Full-review sweep: chunk P2 (tool surface and §5.3)`. The date
   equals the CalVer date (gate-pinned, EV2).
5. **Artefacts**: write the increment's `tasks.md` progress and `aar.md` with
   the token the outcome earns.

## Register write-back

The register partitions dispositions into four sections
(`spec/audit/review-register.md:12` `## Resolved`, `:1039` `## Scheduled-roadmap`,
`:1126` `## Closed-P3 (recorded, no action)`, `:1414` `## Deferred-by-user`). One
finding goes to exactly one section, under a dated subsection:

| Disposition | Section | Row shape |
|---|---|---|
| `Resolved` | `## Resolved` | `### 2026-11-09 full-review sweep — chunk P2`; bullet `**P2-FN — <title> (resolved):**` + predicate + fix location + the assertion that now covers it |
| `Scheduled-roadmap` | `## Scheduled-roadmap` | same heading; bullet names the finding, the predicate, and the `ROADMAP.md` section (or chunk) it is scheduled under |
| `Closed-P3` | `## Closed-P3` | same heading; bullet records the predicate and why no action follows |
| `Deferred-by-user` | `## Deferred-by-user` | only on an explicit user deferral; names the decision |

A finding scheduled against a later sweep chunk (P6, per Q4) writes both the
register row and the chunk reference in the sweep `worklist.md`; a finding
scheduled against a roadmap section writes the `ROADMAP.md` entry in the same
step (`check-registers` cross-references the two).

## Stopped-run landing

If a P0 cannot be fixed within the session, the run halts and still lands as a
record:

1. `worklist.md` marks chunk P2 `halted on <finding ID>` and keeps the partial
   per-REQ table.
2. `ROADMAP.md` gains an additional section for the P0: heading
   `## <finding ID> — <title> (P0)`, 1–3 bullets naming the predicate and the
   reproduction, and a `**Trigger:**` line. The admission rule applies to it
   exactly as to the others (`check-roadmap`).
3. `CHANGELOG.md` heading reads
   `2026-11-09 — Full-review sweep: chunk P2 (halted on <finding ID>)`.
4. `aar.md` ends `LOOP OPEN` naming the P0 row; gates still run and must be
   green for whatever landed.
5. No push. The P0 is the next session's first item, ahead of chunk P3.

## Blast radius

| File | Change | Size |
|---|---|---|
| `docs/plans/2026-11-09-full-review-p2/{plan,tasks,aar}.md` | this increment's artefacts | M |
| `docs/plans/2026-11-09-full-review-sweep/worklist.md` | chunk P2 section, 115-row table, D1–D5, status row | M |
| `spec/audit/review-register.md` | P2 finding rows (one dated subsection per used disposition) | S |
| `ROADMAP.md` | trigger advanced to chunk P3; extra section only on a halted P0 | S |
| `CHANGELOG.md` | dated heading + bullets | S |
| `holonovel/src/**`, `holonovel/scripts/test-*.ts` | only if a P0 fix lands (named at that time) | S–M |
| `holonovel/tool-definitions.json` | regenerated only if a P0 fix edits a tool definition | — |
| `spec/**` + `holonovel.md` | only if a P0 fix amends a REQ (then `assemble` + register refresh) | S–M |
| `spec/audit/req-coverage.md` | refreshed by `npm run validate -- --write-register` when a §5.3 REQ body changes | S |
| `holonovel/package.json`, `package-lock.json`, `server.json`, `AGENTS.md`, `DECISIONS.md` header | advanced by `build-order` version sync | — |

## Considered and rejected

- **Reviewing all 35 §5 sections in this session.** Rejected: no
  session-achievable bar; the paired-chunk worklist exists for this reason
  (`plan.md:252-254` of the P1 increment).
- **Trusting the seven tool gates as the review.** Rejected: they assert
  surface arithmetic (counts, budget, naming, TDQS proxies), which is exactly
  what §5.3 requires *in addition to* behavior the gates do not read — resource
  catalog completeness, prompt shape, `spec_health` sections, and the bucket-E
  builder-process REQs (`REQ-161`–`REQ-164`, `REQ-187`, `REQ-021`, `REQ-107`,
  `REQ-110`, `REQ-182`, `REQ-278`, `REQ-584`) or the 38 sub-REQs without an own
  citation. A green gate is not evidence that the REQ is true.
- **Adding a new §5.3 gate in this increment.** Rejected: no gap is
  demonstrated yet, and `check-script-quality` C1–C4 plus the existing seven
  gates already cover the mechanical class. If the review demonstrates a
  finding class with no gate, it is scheduled as its own increment.
- **Reusing the P1 plan directory.** Rejected: one increment = one
  plan/tasks/AAR triple (Q2), so the P1 record stays immutable.
- **Fixing every finding in its cluster.** Rejected: P1/P2/P3 findings are
  scheduled or closed; only P0 blocks the chunk's close.

## Verification

| Check | Command | Expected |
|---|---|---|
| Assembly | `npm run assemble` | exit 0, no errors |
| Fast gate | `npm run check:fast` (un-piped) | 37/37, `check:fast: PASS` |
| Full gate | `npm run check` | 0 errors |
| Server harnesses | `npm --prefix holonovel run test:tool-definitions` and `test:security` | exit 0 (they are not in the root manifest) |
| Roadmap admission | `npm run check-roadmap` | pass after the roadmap edit |
| Register cross-refs | `npm run check-registers` | pass |
| Loop artefacts | `npm run check-loop-artifacts` | pass, LOOP token present |
| Tool-definition freshness | `npm run check-tool-definitions-sync` | pass (red only if a fix edits a definition and the artifact is stale) |
| Coverage register | `npm run validate -- --write-register` | only when a §5.3 REQ body changed; refreshes `spec/audit/req-coverage.md` |
| TDQS scoreboard | `npm run check-tdqs-scoreboard` | pass |
| Build/version sync | `npm run build-order` | 0 errors |
| Machine evidence | `npm run check:conformance` | exit 0; record the summary |

## Risks and rollback

- **Scope creep.** §5.3's 115 REQs touch resources, prompts, profiles, and
  build metadata. The cluster table is the fence: a finding outside P2's
  registration surface (Q4) is recorded and referenced to its owning chunk,
  not chased.
- **A P0 discovered late can exceed the session.** Mitigation: stop, record,
  land per **Stopped-run landing**; the bar is not met and that is the correct
  outcome.
- **False-C coverage.** `check:conformance -- --dedicated` over-flags; its
  output is inspected, never counted.
- **Gate-pinned values.** The changelog date is the CalVer date; `session:close`
  derives the commit subject from the top CHANGELOG heading.
- **Draft artefact breaks a gate mid-session.** `check-loop-artifacts` fails as
  soon as `plan.md` exists without `tasks.md`/`aar.md`; create all three in one
  step, with `aar.md` as an explicit in-progress stub carrying its terminal
  token at close (P1's lesson, `aar.md:43-46`).
- **No destructive operations, no push.** Every change is a reversible edit or
  an added artefact; rollback cost 1 (single `git revert`).

## Commit order and gates

| # | Commit | Scope | Gate before commit |
|---|---|---|---|
| C0 (conditional) | Restore a green baseline | only if Phase 0's `npm run check` is red — that fix alone | `check:fast`, `check` |
| C1 | Full-review sweep: chunk P2 (tool surface and §5.3) | plan/tasks/AAR, worklist chunk-P2 rows, register rows, ROADMAP.md, CHANGELOG.md, any P0 fix | `assemble`, `check:fast`, `check`, `check-tool-definitions-sync`, `holonovel` `test:tool-definitions` + `test:security`, `build-order`, `check-loop-artifacts` |

C1 is one commit (spec increment); C0 exists only when the baseline is red and
lands first, never folded into the review work. Publication is not part of this
increment.

## User impact

None to runtime behavior unless a P0 fix lands. The increment changes review
records, the roadmap trigger, and the changelog; chunks P3–P8 remain scheduled,
not executed.

## Evidence

- Review artefact: this file; tracker:
  `docs/plans/2026-11-09-full-review-sweep/worklist.md`.
- Finding predicates: recorded per finding in `spec/audit/review-register.md`.
- Baseline: EV1–EV10 above (repo and tool-output sources).
- No external sources; no user-supplied content drives an instruction.

## Conditions

- **C-ev** — Phase 0's measurements supersede EV1–EV10 if the tree changed
  between this draft and execution; the plan's claims are re-checked against
  the baseline recorded then.
