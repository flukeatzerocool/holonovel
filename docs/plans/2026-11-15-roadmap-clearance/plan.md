# Plan — Roadmap clearance: four items closed, two re-confirmed (ROADMAP P1/P2)

Status: draft v3 (cold pass → v2, cold re-review → v3; the standard-depth
re-review cap is now reached, so open items are listed under "Cap status") ·
Kind: planned · Depth: standard
Increment target: `docs/plans/2026-11-15-roadmap-clearance/`
Rollback cost: 1 (four reversible commits plus one docs/roadmap close; each reverts on its own)
Evidence class: repo and tool-output. Every premise is a `file:line` read at HEAD
`a038d6a` or a command run in this session; the baseline gate run is recorded in
`/tmp/opencode/checkfast-baseline.log`.
Trust boundary: repo and local tool output only. No web, user, fetched, or
third-party content enters this plan.
Review independence: fresh — cold passes recorded in `plan.cold/report.md`
(v2) and `plan.cold/report-2.md` (v3), whose hash the stamp records.
Preflight evidence: `docs/plans/2026-11-15-roadmap-clearance/plan.evidence.json`
(plan hash, target existence/tracking, REQ matches, `git HEAD`, `git status`).

## Resolutions (cold pass → v2)

- **B-1 — Phase E could not reach its own done bar.** `check-registers` requires
  every `Scheduled-roadmap` finding's `REQ-NNN` to appear in `ROADMAP.md`
  (`scripts/lib/register-checks.ts:64–69`), and four scheduled findings cite REQs
  that exist only inside the sections E1 deletes (EV15). E2 now **moves**
  F-U4-1, F-U4-5, F-U4-7, and F-P8-2 into a dated `## Resolved` section with their
  evidence; adding rows would not have been enough.
- **B-2 — the attested set had no per-parent source.** The DECISIONS block is
  prose plus a scalar (EV5), so "intersection" was undefined. v2 makes the
  coverage register the sole attested source and has the generator *write* the
  enumerated disposition list into the DECISIONS block between markers; the
  generated region is then a checked artifact, and `--check` fails on
  disagreement instead of intersecting (D7, C1, narrowed by R-1: only the
  enumeration is generated, the prose is authored).
- **M-3 — commit 1's declared gate was red.** The §8-field assertions move to
  Phase C (C5); Phase A adds only the T403 `pass`/`partial`/`fail` branches, so
  `test:g7` is green at commit 1.
- **M-4 — the counting unit was unfixed.** D7 fixes it: 84 §5.12 bodies = 82
  server-side + 2 attestation bodies (REQ-346a1/a2), with parent roll-up; `total`
  becomes 82 and A5 updates the DECISIONS line unconditionally.
- **M-5 — T403's "lists every REQ in §5.12 with disposition" was unmet.** C1's
  generated block lists every §5.12 body with its disposition and its parent, so
  no Appendix F amendment is needed.
- **M-6 — C3's class list contradicted its dry run.** There are four classes —
  manifest-backed, setup, build tool, CI-only table — keyed on job + step name,
  because the two `npm audit` steps are textually identical (D9, C3).
- **M-7 — "no gate covers anchor drift" was wrong.** The Holosuite tiers resolve
  every anchor and fail the run (EV13 now says so). Item 5's remaining work is
  `--check`, the ambiguity refusal, the alias, and a *fast* failure that names
  the repair command.
- **M-8 — the pure helper had no importable home.** It moves to a new
  side-effect-free `holonovel/src/narrative-coherence.ts` (D8), which both
  `index.ts` and `test-g7.ts` import.
- **M-9 — the version-sync artifacts were missing from the blast radius.** The
  CalVer/lockfile/`server.json`/`holonovel/AGENTS.md` set is listed, and the
  commit-5 revert claim is corrected.
- **M-10 — the plan edited figures in a section it deletes, and ignored the
  register's own count.** Those corrections are dropped; EV6 states that it
  supersedes F-U4-7's unit and count.
- **M-11 — the gate arithmetic did not close.** Three gate entries, and the
  post-change fast count is 45.
- **N-12..N-17** — seven collision sites, not eight; `check-gate-table` named as
  its own gate; the new rule consumes `collectHarnessTestNames()` and states its
  token grammar; D-1 names a window value and the header/usage/exit-code/allowlist
  surfaces; the Appendix F sentence covers both conventions; the preflight
  sidecar is now written and hashed (N-17).

## Resolutions (cold re-review → v3)

- **R-1 — the generated block could not carry run-record fields.** Marker scope
  is now explicit: only the enumeration, the attested list, and the hashes are
  generated; §8's workflow name, timestamp, environment pins, commands and
  output, pass/fail, and findings are **authored prose outside the markers**
  (D10, A1, C1). A generated artifact stays byte-deterministic, as
  `generate-world-provider.ts:9` requires.
- **R-2 — commit 1 would have dropped T396's substrings.** Because the attestation
  points and the smoke link sit outside the generated region, T396's current
  `narrative_coherence` / `@section evidence` / `smoke-session` assertions keep
  passing at commit 1; C5 only adds field assertions (A1, C5).
- **R-3 — `attestation` was build-time only, so runtime `fail` stayed
  unreachable.** D7 is replaced by D10: the runtime derives the §5.12 list from
  the **shipped** spec (the same file `spec://build` serves) and compares its hash
  to the generated `SPEC_HASH`. A stale attestation, an unreadable spec, or an
  empty §5.12 makes `partial`/`fail` reachable without a rebuild.
- **R-4 — A4's branches did not follow D7.** The branch table in A4 now fixes the
  arguments and the expected result, and the return adds a `missing` key
  (additive; the four REQ-346b keys stay).
- **R-5 (nits)** — EV13's stray `checkTestNameInflation` sentence removed; D9's
  `npm audit` rationale corrected; the commit-5 version claim scoped (build-order
  is idempotent and the version already reads 2026.11.15); the gate-table
  regeneration moved to commit 4, where the manifest entry lands; B4's padding
  example reworded; T8 assigns the collision re-labels; the preflight sidecar is
  cited; and item 5's closing evidence now includes the 23-site replay as a task,
  not only the scratch-copy self-test.

## Cap status

The standard-depth re-review cap (one) is reached. This v3 contains no third cold
pass. The unresolved items are:

1. **B-1** (v3) — the moved findings must carry a date or commit inside their own
   text, or `scripts/lib/register-checks.ts:61` counts them as grandfathered.
   E2 now says so explicitly.
2. **M-1** (v3) — whether the coverage audit pairs T403 or T396 with the
   DECISIONS-list assertion is unverified; C5 states that T396 keeps its existing
   substrings and T403 adds the list assertion.
3. **M-2** (v3) — the 23-site replay (EV9) was re-run by neither cold pass; T21a
   makes it an execution step rather than an assumption.

## Questions

1. The user asked for **one plan covering all six open roadmap items**. Four are
   closable this session; two are not, for reasons the roadmap's own triggers
   state (EV11, EV12/EV13). The plan therefore closes four, and re-confirms the
   trigger on the two it cannot close — it does not invent work to make the list
   empty.
2. The user chose (this session, scope question) to **defer the U5 review chunk
   to its own increment**. U5 keeps its roadmap section and its existing trigger.
3. Does closing the four items require a spec change? Two do (a harness-ID
   convention sentence in Appendix F; the CI-only check list in `AGENTS.md`),
   one needs none (REQ-346b already states the derivation the code hardcodes
   wrong — EV4), and one is tooling only (EV9).

## Evidence

- **EV1 — §5.12 carries 84 REQ bodies.** `awk '/^### 5\.12 /,/^### 5\.13 /'
  spec/02-requirements.md | grep -c '^\*\*REQ-'` → `84`. The runtime list has
  31 entries (`holonovel/src/index.ts:375–382`). `REQ-354` is absent from §5.12,
  so no builder-side exclusion applies in that section.
- **EV2 — the register already holds the per-parent disposition.**
  `spec/audit/req-coverage.md:304–334` lists 31 §5.12 parents, every one bucket
  `C`, every one `implemented` in its §5.12 disposition column.
- **EV3 — the disposition is a literal.**
  `holonovel/src/index.ts:383–385`: `const G7_ATTESTATION_RECORDED = true;` then
  `SECTION_512_IMPLEMENTED = SECTION_512_REQS.filter((r) => r !== "REQ-346" || G7_ATTESTATION_RECORDED)`.
  The `partial` and `fail` branches at `:15396` are therefore unreachable.
- **EV4 — REQ-346b already specifies the derivation.**
  `spec/02-requirements.md:3809–3810`: `pass` requires every server-side §5.12
  REQ implemented *and* the attestation recorded; `partial` requires at least
  one; `fail` otherwise; a `partial` is recorded as a non-blocking finding with
  a re-activation condition. No REQ body needs amendment.
- **EV5 — the evidence record is short of §8.** `holonovel/DECISIONS.md:2375–2382`
  carries three lettered points (a/b/c) and a `spec_health` bullet;
  `spec/05-verification.md:3–4` enumerates workflow name, timestamp, environment
  pins (Node, OS, protocol), commands and output, pass/fail, and findings.
- **EV6 — the CI↔manifest split, measured — and it supersedes F-U4-7.**
  `.github/workflows/ci.yml` has 12 `run:` steps: 10 in `gates`, 2 in
  `container`. The register's F-U4-7 counted "16 commands" across nine steps
  (`spec/audit/review-register.md:2808–2813`) using a per-command unit and a
  stale file; EV6 counts `run:` steps at HEAD: two `npm ci` (setup), `npm run
  check` (manifest full mode), `npm run assemble` (build tool), and six CI-only —
  `shellcheck` (local run is conditional on the tool being installed, AGENTS.md
  script discipline), `version-check.ts`, `spec-delta.ts --report-only`, two
  `npm audit`, and `test:package-smoke`. The 2 container steps are CI-only too.
  EV6 is the unit F-U4-7's resolution records.
- **EV7 — harness title IDs against Appendix F.** A session script over
  `holonovel/scripts/*.ts` `test("…")` titles found 1061 T/S/I tokens against
  768 Appendix F IDs: **52 absent** = **21 zero-padded** (`T002`, `T020`,
  `T022`, `T043`, `T050`, `T051`, `T056`, `T057`, `T062`, `T066`, `T074`,
  `T076`, `T081`, `T082`, `T084`, `T085`, `T092`, `T093`, `T095`, `T096`,
  `T097`) + **31 suffixed** (`T138a`…`T84d`). Of the suffixed, 26 resolve to a
  catalogue parent (`T138a`→`T138`); **5 have no parent row at all**: `T227`,
  `T230`, `T232`, `T235`, `T783`.
- **EV7a — the duplicated IDs are a separate class, invisible to a
  presence check.** `T408`–`T412` are catalogue rows for the narrative-coupling
  assertions and are used correctly in `test-narrative.ts:804–850`; the same five
  tokens also label unrelated assertions: `test-backfill.ts:1420` (`T408`
  parameter ceiling), `:1429` (`T409` response-lean), `:1469` (`T410` token
  footprint), `:1474` (`T411` stable-metadata), `:1573` (`T412` turn handoff),
  `test-briefing.ts:131` (`T412`), `test-limits.ts:414` (`T408` journal
  display) — seven sites. All seven resolve in Appendix F, so no presence rule
  can catch them.
- **EV8 — the catalogue's numbering rule.** `spec/appendices-reference.md`
  Appendix F preamble: "Tests keep their original numbering; identifiers T1, T2,
  … are retired and never reused." Stripping padding onto a retired ID is
  therefore not a valid fix; each token must name the ID its assertion
  implements.
- **EV9 — the anchor fix mode already exists and works.** `scripts/refresh-predicates.ts`
  (`npm run refresh-predicates`) rewrites `path:line#symbol` by symbol match.
  Replayed in a scratch worktree at `acf7489^`: **23 drifts, 0 unresolved** —
  exactly the 23 sites. At HEAD it prints `predicates current`, exit 0.
- **EV10 — those 23 were still repointed by hand.** Commit `acf7489`'s message:
  "Repointed 19 unique evidence anchors (23 citation sites) …". The tool shipped
  2026-11-10 (`e68ed2e`), three days before.
- **EV11 — item 6 is date-gated.** `ROADMAP.md` "Loop-gate fix-up rate
  re-measurement": trigger 2026-11-28; today is 2026-11-15. Its done-bar is a
  26-pair measurement that cannot exist yet.
- **EV12 — item 3 is a multi-session program.** `ROADMAP.md` "Unscoped-surface
  review sweep": U1–U4 shipped (`2026-11-14-unscoped-u1`…`u4`); U5–U8 remain;
  the trigger names U5 as the next chunk and the section closes only when U8 is
  `Resolved`.
- **EV13 — no *fast* anchor gate and no repair-command message.** The Holosuite
  tiers do resolve every recorded `path:line#symbol` (`holonovel/scripts/lib/eval-predicate.ts:118`)
  and fail the run on an unresolved predicate (`holonovel/scripts/holosuite.ts:211–225`,
  `:327`) — that is how `acf7489` was found. What is absent: any *fast* check, so
  drift is discovered by a three-minute suite instead of `check:fast`; and any
  failure message naming `npm run refresh-predicates --write`. `scripts/lib/gate-manifest.ts`
  has no anchor entry.
- **EV14 — baseline.** `npm run check:fast` at `a038d6a`: 43 passed, 0 failed,
  `check:fast: PASS`. Working tree clean.
- **EV15 — four scheduled findings lose their roadmap anchor.** `check-registers`
  fails a `Scheduled-roadmap` finding whose `REQ-NNN` is absent from `ROADMAP.md`
  (`scripts/lib/register-checks.ts:64–69`). F-U4-5 cites `REQ-346`
  (`spec/audit/review-register.md:2797–2801`), which occurs in `ROADMAP.md` only
  in items 1 and 5; F-U4-1 cites `REQ-346` likewise (`:2802–2807`); F-U4-7 cites
  no REQ but names the section being deleted (`:2808–2813`); F-P8-2 cites
  `REQ-073`…`REQ-361` (`:2817–2824`), present only in item 4. All four must move
  to `Resolved` in the same edit.
- **EV16 — §5.12's two attestation bodies are builder-side.** `REQ-346a1` obliges
  "the builder SHALL include in DECISIONS.md" (`spec/02-requirements.md:3804–3805`)
  and `REQ-346a2` defines a build defect (`:3807–3808`); `REQ-346b` is the
  server-side flag (`:3809–3810`). A `grep` for "the builder" across §5.12 finds
  no other body. So 84 bodies = 82 server-side + 2 attestation bodies.
- **EV17 — the shipped package carries neither the register nor DECISIONS.**
  `holonovel/package.json:23–33` lists `dist`, `src`, `bin`, one content file,
  `NOTICE.md`, `holonovel.md`, two registry JSONs, and `adventures`. The generated
  module is therefore the only way the runtime can see either source.

## Item disposition

| # | Roadmap item | This increment | Closes when |
|---|---|---|---|
| 1 | G7 attestation predicate (P1) | **Close.** Derive the list from §5.12 and the attested set from the register; `partial`/`fail` become reachable. | A harness case forces `partial` (A4). |
| 2 | Evidence record + CI-manifest split (P2) | **Close.** §8-shaped generated block in DECISIONS; CI-only list in `AGENTS.md`, enforced by `check-workflows`. | Gate green and both documents carry the fields (Phase C). |
| 3 | Unscoped-surface review sweep (P2) | **Defer (user decision).** Section keeps U5–U8 and its trigger, plus a "U5 next" note. | U8 `Resolved` in a later increment. |
| 4 | Harness test-ID label hygiene (P2) | **Close, with an amended bar.** 21 padded tokens corrected; 5 orphans mapped; 7 collision sites re-labelled; the 26 suffixed recorded as an accepted refinement convention (Phase B, D2). | New validator rule green with zero findings. |
| 5 | Holosuite anchor repoint automation (P2) | **Close.** The fix mode already ships (EV9); this adds `--check`, the ambiguity window, the `fix-anchors` alias, and a full-only gate. | `check-anchors` green at HEAD; the tool self-test proves the 23-site class repairs itself; the failure message names the repair. |
| 6 | Loop-gate fix-up rate re-measurement (P2) | **No action — date-gated** (EV11). | 2026-11-28. |

## Decisions and alternatives

- **D1 — Derive at build time, not at runtime.** The server cannot read
  `DECISIONS.md` or the register in a packed install (EV17); it can read the
  embedded `holonovel.md` (REQ-105), but the attestation lives beside the spec,
  not in it. Chosen: a build-time generator emits
  `holonovel/src/generated/g7-attestation.ts` (spec §5.12 IDs + attested parents +
  a source hash) and writes the enumerated disposition block into
  `holonovel/DECISIONS.md` between `<!-- g7:start -->` / `<!-- g7:end -->`
  markers, mirroring `generate-world-provider.ts`'s `--check` freshness pattern.
  Rejected: a runtime parse of the shipped spec alone — it would derive *what
  exists*, not *what is attested*, and could never report `fail`; and a hand-kept
  enumeration in DECISIONS — it drifts silently, which is the defect this item
  closes.
- **D2 — The 26 suffixed IDs are a refinement convention, not defects.** A
  suffixed title (`T138a`) names one branch of its catalogue parent's assertion.
  Chosen: the rule accepts a T-ID that is in Appendix F or whose numeric parent
  is, and rejects any zero-padded form outright. Rejected: 26 renames onto
  parent IDs (destroys per-branch evidence and collides with sibling branches);
  26 new Appendix F rows (the catalogue says numbering is fixed, EV8, and the
  rows would duplicate a parent assertion).
- **D3 — The 5 orphan IDs map, they do not earn a row.** `T227`, `T230`, `T232`,
  `T235` sit in `test-backfill.ts` synthesis assertions beside a real ID
  (`T303/T227`), and `T783` sits beside `REQ-001b1`. Each is re-labelled to the
  catalogue ID its assertion implements (or dropped when a correct ID is already
  in the same title, as with `T5/T020`). Alternative (five new catalogue rows) is
  kept only if a mapping cannot be found for a token; the plan's step records the
  mapping table before any edit lands.
- **D4 — The anchor check runs full-only.** A line insertion in `index.ts` moves
  every anchor below it, so a fast-mode gate would fail on any in-progress server
  edit. Chosen: `check-anchors` (`full` only) runs `refresh-predicates --check`,
  which names `npm run fix-anchors` in its failure message. Rejected: fast-mode
  wiring (churn against the local loop); the status quo (drift surfaces only as a
  three-minute suite failure, EV13).
- **D5 — The CI split is documented and drift-checked, not wired.** Wiring
  `npm audit` or the container build into the manifest violates the script
  discipline's "no network by default" rule and would put a Docker dependency in
  every local full run. Chosen: an `AGENTS.md` table of CI-only checks plus a
  `check-workflows` rule that every `run:` line is manifest-backed, setup, a
  build tool, or in that table. Rejected: a second manifest (`ci-gates.json`) —
  two lists to keep in sync with the same drift class.
- **D6 — The G7 evidence block carries §8's six fields.** §8 enumerates six
  top-level fields and expands environment pins into three sub-values (EV5); the
  roadmap's "seven" counted commands and output separately. The block uses §8's
  six; the deleted roadmap section means there is no figure left to correct.
- **D7 — The unit is the §5.12 body, with parent roll-up and two exclusions.**
  `total` counts server-side §5.12 bodies: 84 minus the two attestation bodies
  (REQ-346a1/a2, EV16) = **82**. An attested parent (`REQ-346a1` → `REQ-346`)
  marks all of its bodies implemented. `implemented` = server-side bodies whose
  parent appears in the generated attested list; `attestation` = `recorded` when
  the build-time attestation exists **and** the generated `SPEC_HASH` matches the
  hash of the shipped spec (D10). Disposition: `pass` iff `implemented == total`
  and the attestation is recorded; `partial` iff any body is implemented or the
  attestation is stale; `fail` iff no body is implemented or the spec is
  unreadable. `reqs` keeps listing implemented IDs and `missing` lists the
  unimplemented ones (additive), so the four REQ-346b keys are preserved.
  Rejected: counting 84 including the builder bodies (they can never be satisfied
  by the server, so the disposition would be permanently `partial`); keeping 31
  (the literal the item exists to remove).
- **D8 — The pure helper lives in its own module.** `holonovel/src/narrative-coherence.ts`
  exports `narrativeCoherence(specReqs, attested, recorded)`; `index.ts` imports
  it for `spec_health`, and `test-g7.ts` imports it directly without starting a
  server. Rejected: exporting from `index.ts` — the module autostarts unless
  `HOLONOVEL_NO_AUTOSTART=1` precedes the load (`holonovel/src/index.ts:18867–18868`),
  so a harness import would bind stdio in the harness process.
- **D9 — The CI reconciliation keys on job + step name.** The two `npm audit`
  steps share a command and carry distinct step names (`ci.yml:32`, `:34`), so
  the step name is what distinguishes them. The table entry is
  `<job>/<step name>`; an unnamed step (the bare `- run: npm ci` at
  `ci.yml:20`) keys on its command. Four classes: manifest-backed (`npm run
  check`), setup (`npm ci`), build tool (`npm run assemble`), CI-only (table).
- **D10 — Runtime derives what exists; the build derives what is attested.**
  The generated module carries `ATTESTED_PARENTS`, `ATTESTATION_RECORDED`, and
  `SPEC_HASH`; the runtime reads the shipped `holonovel.md` (the same file
  `spec://build` serves, `holonovel/src/index.ts:122–124`), parses §5.12, and
  compares hashes. So `partial` is reachable without a rebuild when the spec
  gains §5.12 bodies that the attestation does not cover, and `fail` when the
  spec is unreadable or empty. Rejected: trusting the generated list alone — it
  is compiled, so every runtime disposition would be `pass` forever (the EV3
  defect in a new wrapper).

## Phases

### Phase A — G7 derivation (item 1)

- **A1.** New `holonovel/scripts/generate-g7-attestation.ts` **[build tool]**:
  parse §5.12 REQ headers from `holonovel.md`; classify the two attestation
  bodies (EV16); read the `§5.12 disposition` column from
  `spec/audit/req-coverage.md`; emit `holonovel/src/generated/g7-attestation.ts`
  with `SPEC_512_REQS`, `SERVER_512_REQS`, `ATTESTED_PARENTS`,
  `ATTESTATION_RECORDED`, `SPEC_HASH`, and `SOURCE_HASH`; write **only the
  enumeration** (server-side body → parent → disposition, plus the hash line)
  into `holonovel/DECISIONS.md` between `<!-- g7:start -->` / `<!-- g7:end -->`.
  Everything else in the block — §8's six fields, the three attestation points,
  the smoke-transcript link — is authored prose **outside** the markers, so the
  generated region stays byte-deterministic (R-1). `--check` compares both
  artifacts and exits 1 on drift. If the register and the spec disagree about a
  §5.12 parent, it exits 1 naming the REQ — no silent intersection.
- **A2.** New `holonovel/src/narrative-coherence.ts` exporting the pure
  `parseSection512(specText)` and `narrativeCoherence(specReqs, attested,
  recorded)` (D7, D8, D10). `holonovel/src/index.ts`: delete `SECTION_512_REQS`,
  `G7_ATTESTATION_RECORDED`, and the filter (`:372–385`); read the shipped spec
  through the existing `specPath` helper (`:122–124`); on a missing or empty
  §5.12 the block reports `fail` with a finding rather than throwing.
  `spec_health.narrative_coherence` keeps `implemented`, `total`, `disposition`,
  `reqs` and adds `attestation` and `missing` (REQ-346b shape, EV3).
- **A3.** `npm run check-g7-attestation` → the generator `--check`; add to
  `scripts/lib/gate-manifest.ts` after `check-world-provider` (fast and full;
  deterministic, sub-second).
- **A4.** `holonovel/scripts/test-g7.ts`: add T403 branches over the pure helper:
  (a) 82 server-side bodies + all attested + `recorded` → `pass`;
  (b) the same bodies with three parents removed from `attested` → `partial`,
  and `missing` names the three; (c) empty `attested` + `recorded=false` →
  `fail`; (d) `recorded=true` but a mismatched `SPEC_HASH` → `partial`, so the
  stale-attestation path is exercised (R-4). T396 is untouched here.
- **A5.** Regenerate both artifacts; update the `31/31` line and the "31 of 31"
  prose in `holonovel/DECISIONS.md` — that prose is outside the markers, so it is
  a hand edit, not a generated one.
- **Verification:** `npm run check-g7-attestation` exit 0;
  `npm --prefix holonovel run test:g7` (T403 branches); `npm run typecheck`.

### Phase B — Harness test-ID hygiene (item 4)

- **B1.** Build the mapping table first (`/tmp/opencode/id-map.md`, not committed):
  each of the 21 padded tokens → the catalogue ID its assertion implements, or
  "drop, correct ID already present" (EV7/EV8/D3). The table is a review artifact
  for the AAR; no harness edit lands before it is complete.
- **B2.** Apply the 21 corrections across `test-backfill.ts`, `test-persistence.ts`,
  `test-briefing.ts`; map the 5 orphans (D3); leave the 26 suffixed untouched.
- **B2a.** Resolve the `T408`–`T412` collision (EV7a): re-label each of the seven
  non-narrative sites to the catalogue ID its assertion implements, or to a new
  row when none exists; `test-narrative.ts` keeps the five. The mapping table
  from B1 carries these rows too. This class has no gate (a duplicate-use rule
  would flag legitimate shared IDs across 1061 tokens); the AAR records it as
  audited-once with the mapping table as evidence.
- **B3.** `scripts/validate.ts`: new `checkHarnessTitleIds()` built on
  `collectHarnessTestNames()` (`:1542–1561`, the documented title consumer) rather
  than a third title regex. Grammar: a **T-token** (the `T\d+[a-z0-9]*` form; `S`
  and `I` tokens and `REQ-NNN` citations are out of scope) must be in Appendix F
  or have a resolving numeric parent, and must not match `^T0\d\d`. Wire it beside
  `checkTestNameInflation` (`:1524`) as a warning class, promoted to an error
  under `--sdd-strict`. **Dry run first:** run it against the current tree and
  confirm it reports exactly 26 findings (21 padded + 5 orphan) and nothing else;
  the 26 suffixed must pass before B2 lands. Expected end state: 0 findings.
- **B4.** `spec/appendices-reference.md` Appendix F preamble: two sentences — a
  suffixed ID (`T138a`) refines its parent row and need not repeat it, and IDs
  are never zero-padded: `T020` is a malformed identifier, not a synonym for
  `T20`. Re-run `npm run assemble`.
- **B5.** `scripts/test-req-checks.ts`: a fixture proving the padded form fails,
  the orphan form fails, and the suffixed form passes.
- **Verification:** `npm run validate:fast` 0 errors; `npm run test:validators`;
  `npm --prefix holonovel run test:all` still 56/56 (titles changed, assertions
  did not).

### Phase C — Evidence record and the CI split (item 2)

- **C1.** `holonovel/DECISIONS.md`: the block keeps its authored prose outside
  `<!-- g7:start -->` / `<!-- g7:end -->` — §8's six fields (workflow name G7,
  timestamp, environment pins, commands and output, pass/fail, findings), the
  three attestation points, and the smoke-transcript link — and gains the
  generated enumeration inside the markers (84 bodies, each with parent and
  disposition) that T403 requires (`spec/appendices-reference.md:1865`). D6 fixes
  the field count; the roadmap section that carried the "seven/15" figures is
  deleted, so neither figure is edited anywhere.
- **C2.** `AGENTS.md`: new `## CI-only checks` subsection listing the six
  CI-only `gates`-job steps (EV6) and the two container steps, keyed
  `<job>/<step name>` per D9, each with its reason (network, packed artifact,
  Docker, conditional local tool).
- **C3.** `scripts/check-workflows.ts`: classify every `run:` line in
  `ci.yml` — manifest-backed, setup (`npm ci`), build tool (`npm run assemble`),
  or named in the AGENTS table — and fail on an unclassified step or a table
  entry that no longer exists. Mirrors the `check-gate-table` pattern. **Dry run
  first** against the current file: expect the rule to classify `npm run check`,
  the two `npm ci` steps, and `npm run assemble` by their own class, and to report
  the six + two CI-only steps as unclassified until C2 lands.
- **C4.** `scripts/test-workflows.ts`: fixtures for each class, plus unclassified
  and stale-table cases.
- **C5.** `holonovel/scripts/test-g7.ts`: T396 keeps its three existing
  substrings (they survive, because the prose is outside the generated region)
  and gains assertions for the six §8 fields; T403 (A4) carries the enumerated
  list. This lands with C1, which supplies them.
- **Verification:** `npm run check-workflows`; `npm run test:workflows`;
  `npm run validate:fast`.

### Phase D — Anchor fix mode (item 5)

- **D-1.** `scripts/refresh-predicates.ts`: add `--check` (exit 1 when any drift
  exists, 0 clean); make the resolver refuse an ambiguous match — when more than
  one candidate line carries the symbol and none lies within **±40 lines** of the
  recorded line (documented in the header), report `ambiguous: <path>:<line>
  <symbol> (<n> candidates)` on stderr and exit 1 rather than picking the
  nearest. `--write` gains no new guessing. The same change updates the role
  header (currently `[informational; build tool with --write]`), the usage block,
  the exit-code line (1 gains "or ambiguous"), and the unknown-flag allowlist to
  admit `--check`.
- **D-2.** `package.json`: `"fix-anchors": "npx tsx scripts/refresh-predicates.ts --write"`
  and `"check-anchors": "npx tsx scripts/refresh-predicates.ts --check"`.
- **D-3.** `scripts/lib/gate-manifest.ts`: `check-anchors` entry, `fast: null`,
  `full: npm("check-anchors")`. Regenerate the `AGENTS.md` gate table with
  `npm run gates -- --list --format=md`.
- **D-4.** A self-test for the tool (new `scripts/test-anchor-tooling.ts`, wired as
  `test:anchor-tooling` in both modes): a scratch copy with a shifted anchor
  repairs, an ambiguous symbol refuses, a match outside the window refuses, and
  `--check` fails before `--write` / passes after.
- **D-5 (T21a).** Replay the class the item exists for: a scratch worktree at
  `acf7489^` runs `--check` (expect 23 drifts, exit 1), `--write`, then `--check`
  again (expect 0). This replaces the "the tool would have fixed it" assumption
  with a recorded run.
- **Verification:** `npm run check-anchors` at HEAD (`predicates current`);
  `npm run test:anchor-tooling`; the D-5 replay output captured in the AAR;
  `npm run check:fast`.

### Phase E — Close-out

- **E1.** `ROADMAP.md`: delete items 1, 2, 4, 5; keep item 3 (unchanged trigger,
  add "U5 next; U6–U8 after") and item 6 (unchanged). Re-run
  `npm run check-roadmap`.
- **E2.** `spec/audit/review-register.md`: **move** F-U4-1, F-U4-5, F-U4-7, and
  F-P8-2 out of `## Scheduled-roadmap` into a dated `## Resolved — 2026-11-15`
  section, each carrying a date (or the closing commit) inside its own text so
  it is not counted as grandfathered (`scripts/lib/register-checks.ts:61`), and
  add a dated row for the D2 convention. This is required, not cosmetic:
  `check-registers` fails a scheduled finding whose REQ no longer appears in
  `ROADMAP.md` (`:64–69`).
- **E3.** `CHANGELOG.md` entry, `docs/plans/2026-11-15-roadmap-clearance/aar.md`,
  and `npm run session:close`.
- **Verification:** `npm run assemble && npm run check:fast` (capture the exit
  code, not a pipe); `npm run build-order` for the fingerprint/version sync.

## Blast radius

| Path | Change | Size |
|---|---|---|
| `holonovel/scripts/generate-g7-attestation.ts` | new generator (TS module + DECISIONS block) | L |
| `holonovel/src/generated/g7-attestation.ts` | generated data | M |
| `holonovel/src/narrative-coherence.ts` | new pure helper module | S |
| `holonovel/src/index.ts` | remove literal sets, import helper + data | M |
| `holonovel/scripts/test-g7.ts` | T403 branches (commit 1), T396 fields (commit 3) | M |
| `holonovel/scripts/test-backfill.ts` | title corrections + collision re-labels | S each / M total |
| `holonovel/scripts/test-persistence.ts` | 6 title corrections | S |
| `holonovel/scripts/test-briefing.ts` | 1 title correction + 1 collision re-label | S |
| `holonovel/scripts/test-limits.ts` | 1 collision re-label | S |
| `scripts/validate.ts` | `checkHarnessTitleIds` | M |
| `scripts/test-req-checks.ts` | three fixtures | S |
| `spec/appendices-reference.md` | Appendix F preamble sentences | S |
| `holonovel/DECISIONS.md` | generated G7 block + §8 fields + version sync | M |
| `holonovel/AGENTS.md` | version sync (REQ-107a) | S |
| `holonovel/package.json` | version sync | S |
| `holonovel/server.json` | version sync | S |
| `holonovel/package-lock.json`, `package-lock.json` | version sync | S |
| `AGENTS.md` | CI-only checks table + gate table regen | M |
| `scripts/check-workflows.ts` | CI/manifest reconciliation | M |
| `scripts/test-workflows.ts` | class fixtures | S |
| `scripts/refresh-predicates.ts` | `--check`, ambiguity window, header/usage | S |
| `scripts/test-anchor-tooling.ts` | new self-test | M |
| `scripts/lib/gate-manifest.ts` | three gate entries | S |
| `package.json` | three scripts (`check-g7-attestation`, `fix-anchors`, `check-anchors`) | S |
| `ROADMAP.md` | four sections removed, two re-confirmed | S |
| `spec/audit/review-register.md` | four findings moved to `Resolved`, one convention row | S |
| `CHANGELOG.md`, `docs/plans/2026-11-15-roadmap-clearance/` | close artifacts | S |

## Commit order

1. **G7 derivation** — Phase A. Gate: `npm run check-g7-attestation`,
   `npm --prefix holonovel run test:g7`, `npm run typecheck`.
2. **Harness test-ID hygiene** — Phase B. Gate: `npm run validate:fast`,
   `npm run test:validators`, `test:all` 56/56.
3. **Evidence record and CI split** — Phase C. Gate: `check-workflows`,
   `test:workflows`, `npm --prefix holonovel run test:g7` (T396 now includes the
   §8 fields).
4. **Anchor fix mode** — Phase D. Gate: `check-anchors`, `test:anchor-tooling`.
5. **Roadmap close, version sync, and AAR** — Phase E. Gate:
   `npm run assemble && npm run check:fast` (full `check` before push).

Commits 1–4 are independent and revert cleanly. Commit 5 carries the roadmap and
register edits, the close artifacts, and whatever `npm run build-order` still
owes after the source change — `scripts/version-bump.ts` is idempotent, so at the
current CalVer (`2026.11.15`, `package.json:3`, `holonovel/src/index.ts:169`) it
may touch only `holonovel/package.json`, `holonovel/server.json`, both lockfiles,
`holonovel/AGENTS.md`, and the `DECISIONS.md` spec-hash line. Reverting commit 5
alone leaves commits 1–4 intact and restores those files.

## Done bar

**Done bar:** roadmap items 1, 2, 4, and 5 are removed from `ROADMAP.md` with
their acceptance evidence recorded and their four scheduled register findings
moved to `Resolved`; items 3 and 6 remain with their original triggers and an
explicit "not closed: reason" note in the AAR; `check:fast` green at the expected
**45** gates; `test:all` 56/56; `check-anchors` and `check-g7-attestation` pass;
and `checkHarnessTitleIds` reports zero findings on this tree.

A session that ends after commit 2 still closes items 1 and 4; the residual is
recorded in the AAR as an open item and the roadmap removal for 2 and 5 waits.

## Edge cases and failure modes

- **The generator cannot parse §5.12** (heading renamed): it exits 1 with the
  header it looked for. The plan's fallback is a generator error, never a silent
  empty list — an empty `SPEC_512_REQS` would report `fail` and block handoff.
- **The register and the spec disagree on a §5.12 parent** (a parent with no
  register row, or a register row for a parent the spec does not carry): the
  generator exits 1 naming the REQ. There is no intersection fallback — the
  register is the attested source (D7) and a disagreement is a defect to fix, not
  a value to average.
- **A padded token has no non-retired mapping** (e.g. `T002`): D3's fallback is a
  new catalogue row only if the AAR records why; otherwise the token is dropped
  and the title keeps its correct ID.
- **`--check` anchor gate fails on an unrelated in-progress edit:** full-only
  placement means only pre-push/CI see it, and `npm run fix-anchors` is named in
  the failure message (D4).
- **`check-workflows` misclassifies a new step:** it fails closed with the job,
  step name, and command, so a future CI addition forces a conscious table entry.
- **Gate-table drift:** adding three gates without regenerating the AGENTS table
  fails `check-gate-table`; D3 names the regeneration command.

## Verification summary

| Claim | Verified by |
|---|---|
| Derivation is real (not a literal) | T403 sub-case returns `partial` for a 3-REQ subset |
| The unit and counts are fixed | `check-g7-attestation`; the generated block lists 84 bodies = 82 server-side + 2 attestation (EV16) |
| No padded token survives | `checkHarnessTitleIds` → 0 findings |
| No orphan token survives | same |
| The 26 suffixed are deliberate | Appendix F preamble + validator rule |
| The evidence block is §8-shaped and lists §5.12 | T396 field assertions + generated enumeration |
| CI drift is caught | `check-workflows` + `test:workflows` |
| The 23-site anchor class repairs itself | `test:anchor-tooling` scratch copy + the `acf7489^` replay (D-5) |
| Nothing regressed | `check:fast` 43 → **45** passed; `test:all` 56/56 |

## Files expected

- `holonovel/scripts/generate-g7-attestation.ts`
- `holonovel/src/generated/g7-attestation.ts`
- `holonovel/src/narrative-coherence.ts`
- `holonovel/src/index.ts`
- `holonovel/scripts/test-g7.ts`
- `holonovel/scripts/test-backfill.ts`
- `holonovel/scripts/test-persistence.ts`
- `holonovel/scripts/test-briefing.ts`
- `holonovel/scripts/test-limits.ts`
- `scripts/validate.ts`
- `scripts/test-req-checks.ts`
- `spec/appendices-reference.md`
- `holonovel/DECISIONS.md`
- `holonovel/AGENTS.md`
- `holonovel/package.json`
- `holonovel/server.json`
- `holonovel/package-lock.json`
- `package-lock.json`
- `AGENTS.md`
- `scripts/check-workflows.ts`
- `scripts/test-workflows.ts`
- `scripts/refresh-predicates.ts`
- `scripts/test-anchor-tooling.ts`
- `scripts/lib/gate-manifest.ts`
- `package.json`
- `ROADMAP.md`
- `spec/audit/review-register.md`
- `CHANGELOG.md`
- `docs/plans/2026-11-15-roadmap-clearance/plan.md`
- `docs/plans/2026-11-15-roadmap-clearance/tasks.md`
- `docs/plans/2026-11-15-roadmap-clearance/aar.md`
- `docs/plans/2026-11-15-roadmap-clearance/plan.cold/report.md`
- `docs/plans/2026-11-15-roadmap-clearance/plan.cold/report-2.md`
- `holonovel.md`

## Open questions

1. **Phase C field count.** §8 enumerates six fields; §8's own "commands run and
   their output" can be read as two. D6 writes six. The deleted roadmap section
   held the "seven" figure, so nothing else needs correcting; if the operator
   prefers seven, C1 splits "commands" and "output" into two labelled fields.
2. **Phase D gate placement.** Full-only is the recommendation (D4). A fast-mode
   placement is a one-line manifest change if the operator wants drift visible
   during local iteration.
