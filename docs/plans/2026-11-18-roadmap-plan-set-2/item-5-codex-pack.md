# Plan — ROADMAP item 5: `codex pack` as an artifact kind

*(A draft for the executing session. Re-home it as `docs/plans/<date>-codex-pack-kind/plan.md`,
re-measure the kind surface, the line numbers, and the anchor delta, and stamp it — the evidence
below is dated 2026-11-18 at HEAD `e8a87d4`, after index.ts split stage 2 moved every `index.ts`
line number below `:6504` down by 640.)*

**Kind:** planned · **Depth:** standard · **Rollback cost:** 1 (reversible edit plus one new
directory convention) ·
**Evidence:** `npm run check:fast` 46/46 PASS; REQ-620 at `spec/02-requirements.md:2562`, REQ-621
at `:2564`; T738 at `spec/appendices-reference.md:2100`, T739 at `:2101`, T792 at `:2153`; kind-set
and anchor sites measured by grep over `holonovel/src` and `holonovel/scripts/lib` in this session.
**Trust boundary:** `repo` evidence only.

## Questions

ROADMAP item 5 (`ROADMAP.md:52-62`, P3): "`manage_codex (action: export)` ships one-way: a library
leaves the server as `holonovel.codex/1`, but nothing admits one back — `REQ-620`/`REQ-621` admit
Novel pack, adventure module, and ruleset package only." Closes when "`manage_artifact (action:
install)` admits a `codex pack` and `spec_health` reports its count" (`:61-62`).

## Trigger status

- **Trigger:** "the next artifact-registry change (REQ-620/REQ-621), or a request to move a codex
  library between hosts" (`:60-62`). **Not met:** neither REQ has changed since the item was
  written (both still read as the registry/admission pair at `spec/02-requirements.md:2562,2564`),
  and no move request is recorded. Execution is the maintainer's selection (this set).
- **Priority:** P3, the lowest of the four. Its plan records the ordering constraint against item
  4 (D9) rather than assuming isolation.

## Why

- **EV1 — the kind set is a closed union in five code sites and one spec enumeration.**
  `ArtifactKind = "novel" | "adventure" | "ruleset"`
  (`holonovel/src/core/artifact-registry.ts:16`); `KIND_ORDER` (`:54`) fixes catalogue order;
  `buildArtifactRegistry` concatenates `scanNovels`, `scanAdventures`, `scanRulesets` (`:56-62`,
  scans at `:66`, `:156`); `registryCounts` builds its record from the union (`:188-191`); and in
  `index.ts` the `kind` enum enumerates the same three (`:12329`) while the install branch switches
  on them (`:12374`, `:12457`, `:12522`) and the removal message labels them (`:12552`). A fourth
  kind that any of these misses is silently absent from `list`, `counts`, or `install`.
- **EV2 — the registry contract is kind-agnostic once the entry exists.** REQ-620
  (`spec/02-requirements.md:2562`) requires each entry to carry kind, slug, title, content hash,
  declared provenance, and an integrity state, and requires `spec_health` to report counts per
  kind; `spec_health` already publishes `artifacts_registered: registryCounts(artifactRegistry())`
  (`index.ts:13325`). `RegistrySources` (`artifact-registry.ts:45-52`) already carries
  `novelsDir`, `adventureDirs`, `rulesets`, and `rulesetHash`, so a fourth source field follows the
  existing shape.
- **EV3 — admission's contract is REQ-621's, and the primitives exist.** `artifactRegistry()` builds
  its sources at `index.ts:12280-12292`; `inboxSourcePath` is declared at `:12294` and resolves a
  source under the exchange inbox with `resolveWithin`/`resolveInboxDir`; the install branch refuses
  traversal, requires the GM badge, audits, and rebuilds dependents (`:12374-12560`). `isSafeSlug`
  is imported from `core/data-dir.js` and `canonicalJson` from `core/state-hash.js:50`.
- **EV4 — the exporter's payload has no identity fields, and no hash.** `manage_codex (action:
  export)` returns `{schema: "holonovel.codex/1", entries}` serialized at `index.ts:14988`, entries
  sorted by id. It carries no slug, title, provenance, or hash, so the admission side must accept
  that payload — REQ-321o fixes its shape and T792 (`spec/appendices-reference.md:2153`) asserts
  byte-identity, so growing fields on the exporter would edit a shipped contract to serve a new
  consumer.
- **EV5 — the test surface is one harness with 23 cases**
  (`grep -c "await test(" holonovel/scripts/test-artifact-registry.ts`). It already covers the
  T738/T739 cases: equal listings, kind filter, kind catalogs, non-verified integrity, traversal
  refusal, tampered pack refusal, `-N` duplicate suffix, security-event audit, and `spec_health`
  per-kind counts.
- **EV6 — a spec edit here drags a regeneration chain.** The kind enumeration lives in two REQ
  bodies, so `assemble`, the fingerprint set (`check-fingerprint-sync`), the G7 attestation's
  embedded spec hash (emitted by `holonovel/scripts/generate-g7-attestation.ts`, run without
  `--check`), the tool-definition snapshot (the description changes), and the surface budget all
  move. The coverage register does not: no T-ID is added and no `_Check:_` line changes.
  `spec/build-phase-map.md` is hand-maintained (`AGENTS.md`), so if a phase's file list changes it
  is edited, not regenerated.
- **EV7 — this increment inserts lines above two `index.ts` anchors.** Adding a `codexDir` entry to
  the sources literal (`:12280-12292`) shifts `inboxSourcePath`'s anchor at `:12294`
  (`holosuite-adversarial.ts:34`), and the install-branch case shifts the `:15757` anchor
  (`holosuite-conformance.ts:37`). Both need repair after the edit, by the two declarations D10 states.

## Decisions

- **D1 — Kind name `codex`, directory `<DATA_DIR>/codex/<slug>.json`.** The directory sits beside
  `novels/`, `adventures/`, and the ruleset install root under the same data root
  (`resolveDataDir`). Slug is the file stem. Kind order is appended: novel, adventure, ruleset,
  codex.
- **D2 — Admission accepts the exporter's payload verbatim (EV4).** A pack is any file in the
  inbox whose parsed body is `{schema: "holonovel.codex/1", entries: [...]}` with at least one
  entry; the slug is the file stem; a `title` string is used when present, else the slug.
  - Rejected: add `slug`/`title`/`provenance` to the export payload. REQ-321o fixes the payload and
    T792 asserts byte-identity.
  - Rejected: a wrapper envelope (`{pack: {...}, payload: {...}}`). It creates a second format for
    the same bytes and a second parser to keep in sync.
- **D3 — The hash is computed over `{schema, entries}` only, and a declared hash is optional and
  compared.** `sha256(canonicalJson({schema, entries}))` with entries ordered by id (already true
  at export, EV4). The exporter emits no hash, so a pack's entry carries the recomputed value. A
  producer may add a top-level `content_hash` **beside** the exporter's fields; when present,
  admission recomputes and refuses a mismatch with `[ERROR] [STATE_CONFLICT]` naming the slug, and
  the declared value is excluded from the hash input so that declaring it cannot change it.
  - Rejected: require a declared hash. The exporter cannot produce one without changing REQ-321o's
    payload (EV4), and requiring a field the shipped producer omits would refuse every library the
    server itself exports.
  - Rejected: hash the whole file (including `content_hash`). It would make the hash
    self-referential and unsignable.
- **D4 — Duplicate slug is refused, not suffixed.** Installing a slug already in
  `<DATA_DIR>/codex` returns `[ERROR] [STATE_CONFLICT]` naming `manage_artifact (action: remove,
  kind: codex, slug: …)` as the corrective action.
  - Rejected: the Novel pack's `-N` suffix. A silently forked library is worse than a refusal, and
    the suffix rule exists because a Novel pack's slug comes from inside the file (REQ-621a), not
    from the filename.
- **D5 — Provenance is the registry's, and it is shape-validated, not attested.** A pack may carry
  `provenance {creator, attribution, license}`; the object is copied onto the entry, each value
  must be a string, and the registry reports it. The adventure provenance verifier
  (`core/adventure-provenance.ts`) is not reused: it validates Markdown front-matter, not JSON.
  REQ-620's "declared provenance" is satisfied by copying what the pack declares, and the plan says
  plainly that a codex pack has no external attestation to verify against — a stronger claim would
  need a signature format the exporter does not emit.
- **D6 — Spec edit is one clause in each of two REQ bodies, plus the two Appendix F rows.** REQ-620
  and REQ-621 gain `codex pack` in their kind enumeration; T738 and T739 each gain one clause. No
  new REQ and no new T-ID, so no coverage-register row is added and the §5 section map is unchanged
  (EV6); the fingerprint set and the G7 spec hash still move, which is why D8 exists.
  - Rejected: a new `REQ-621e` for codex admission. It would duplicate REQ-621's contract for one
    kind and add a T-ID whose acceptance the existing harness already covers.
- **D7 — No new tool action.** `manage_codex` keeps its export action only; admission lives in
  `manage_artifact`, where the audit, authorization, traversal, and removal contracts already are.
  - Rejected: `manage_codex (action: import)`. Two admission paths with one audit contract is how
    the artifact actions drift.
- **D8 — The regeneration chain runs in one ordered phase.** The REQ-body edit moves every derived
  artifact: `npm run assemble` → `npm run check-tool-definitions-sync` (the description changed) →
  `npm run surface-budget -- --write` when the footprint moved → `npx tsx
  holonovel/scripts/generate-g7-attestation.ts` (emits `SPEC_HASH`; `check-g7-attestation` only
  verifies) → `npm run build-order` (fingerprints, CalVer, `AGENTS.md` counts) →
  `npm run check-package-manifest` and `npm run test:package-manifest` (unchanged, re-run).
- **D9 — Ordering against item 4.** Item 4 stage 3 moves `index.ts:5524-6503`; this plan edits
  `:12280-12560` and `:14988`. Neither touches the other's region, so either may land first; the
  later one re-measures its own line numbers and its anchor delta.
- **D10 — Anchors are repaired by two measured declarations, because the edit straddles them.**
  EV7. The two affected anchors sit on opposite sides of this increment's own insertions: the
  `12294` anchor shifts by the lines added at or above the sources literal (`k1`), while the `15757`
  anchor shifts by `k1 + k2`, where `k2` is the install-branch line count. `refresh-predicates`
  scopes a declaration by a lower bound only (`--from-line`), so run two, in this order:
  1. `npx tsx scripts/refresh-predicates.ts --write --offset <k1+k2> --path holonovel/src/index.ts --from-line 12329`
     — writes the `15757` repair, then reports `12294` unresolved and **exits 1**. `--from-line`
     limits only which anchors receive the declared offset, and a stale anchor outside the bound
     falls to the repath fallback (`scripts/refresh-predicates.ts:281-301`), which refuses an
     ambiguous symbol; `inboxSourcePath` appears on two code lines (`:12294`, `:12370`), so the run
     ends with an "ambiguous" refusal on stderr. The write at `:326` has already landed.
  2. `npx tsx scripts/refresh-predicates.ts --write --offset <k1> --path holonovel/src/index.ts --from-line 12294`
     — writes the `12294` repair; `15757` already carries its symbol at its rewritten line, so
     `refresh-predicates.ts:262` short-circuits it before the fallback.
  Step 1's non-zero exit is therefore expected, not a failure: acceptance is the final
  `npm run check-anchors` reading `predicates current`, not each invocation's exit code. `k1` and
  `k2` are counted from `git diff --numstat -- holonovel/src/index.ts` after staging, never
  predicted. One global offset would leave one of the two anchors stale, and `check-anchors` would
  fail.
- **D11 — There is no pre-existing review-register row for this item.** A grep for `codex` in
  `spec/audit/review-register.md` returns only unrelated health/notes findings, so the increment
  opens its own dated `## Resolved` entry when it lands and retires the roadmap section;
  `check-registers` requires the date on every bullet it parses.

## Blast radius

| File | Change | Size |
|---|---|---|
| `holonovel/src/core/artifact-registry.ts` | `ArtifactKind`, `KIND_ORDER`, `scanCodexPacks`, `RegistrySources.codexDir`, `registryCounts` | M |
| `holonovel/src/index.ts` | `artifactRegistry()` sources, `kind` enum `:12329`, install branch, removal label `:12552`, description text | M |
| `holonovel/scripts/test-artifact-registry.ts` | round-trip, count, traversal, tampered, duplicate, schema cases | M |
| `holonovel/scripts/lib/holosuite-adversarial.ts` | anchor offset for `inboxSourcePath` (`:34`) | S |
| `holonovel/scripts/lib/holosuite-conformance.ts` | anchor offset for `:37` | S |
| `spec/02-requirements.md` | REQ-620 `:2562`, REQ-621 `:2564` kind enumeration | S |
| `spec/appendices-reference.md` | T738 `:2100`, T739 `:2101` procedure clauses | S |
| `holonovel.md` | regenerated by `assemble` | S |
| `holonovel/src/generated/g7-attestation.ts` | `SPEC_HASH` re-emitted | S |
| `holonovel/tool-definitions.json` | regenerated description and kind enum (`check-tool-definitions-sync`) | S |
| `spec/audit/tool-surface-baseline.json` | regenerated by `surface-budget --write` if the footprint moved | S |
| `spec/build-phase-map.md` | hand-edited only if a phase's file list changed | S |
| `holonovel/AGENTS.md`, `AGENTS.md` | surface description and counts | S |
| `holonovel/DECISIONS.md` | dated design entry (kind, hash rule, duplicate rule) | S |
| `ROADMAP.md` | item 5 retired | S |
| `spec/audit/review-register.md` | dated `## Resolved` entry (no existing row — D11) | S |
| `CHANGELOG.md` | rendered from the AAR block | S |
| `docs/plans/<date>-codex-pack-kind/` | plan, tasks, AAR | S |

Rollback: `git checkout -- .` returns the tree; an installed pack lives under the data directory
and is removed by `manage_artifact (action: remove)`, so the probe fixtures run under a temp
`DATA_DIR` (the harness already uses isolated data directories,
`holonovel/scripts/test-data-dir.ts`).

## Phases

- **P1 — Surface audit.** Enumerate every place the three-kind union is spelled (EV1) plus
  `grep -rn '"novel" | "adventure" | "ruleset"\|\["novel", "adventure", "ruleset"\]' holonovel/src`;
  confirm the list is complete before editing. Sibling contract: `grep -rn "manage_artifact"
  spec/02-requirements.md spec/appendices-reference.md holonovel/src` — every REQ and test binding
  that action (REQ-620, REQ-621, REQ-621a-d, T738, T739) must tolerate a fourth kind; a binding
  that enumerates the three in a way the plan cannot extend stops the phase for an amendment.
  Accept: a written list of union sites, a written list of action bindings, no edit yet.
- **P2 — Registry and admission.** Add the kind, the scan, the source field, the install branch, and
  the removal label. Accept: a pack in an isolated data dir's inbox installs, appears in `list`,
  filters by kind, reports `verified`, adopts a declared `content_hash`, and counts 1 in
  `spec_health`.
- **P3 — Tests and negative probes.** Extend the harness with the six cases, then run each probe
  against the pre-fix tree where applicable and record the failure message. Accept: the harness
  passes and each probe fails for the stated reason, restored afterwards (`git status --porcelain`
  empty).
- **P4 — Anchors.** D10's measured offset, then `check-anchors` → `predicates current`.
- **P5 — Spec, regeneration chain, registers.** D6 edit, then D8's ordered chain; ROADMAP
  retirement; dated Resolved entry; DECISIONS entry.
- **P6 — Close.** `npm run check:fast` un-piped (then full `npm run check` before any push), AAR,
  `session:close`.

## Verification

| # | Command / check | Expected |
|---|---|---|
| V1 | `npm --prefix holonovel run test:artifact-registry` | all cases pass, including the six new ones |
| V2 | round-trip probe: `manage_codex (action: export)` → write the payload into an inbox → `manage_artifact (action: install, kind: codex)` → `list` / `verify` / `spec_health` | admitted; `counts.codex` = 1; `integrity` = `verified`; `remove` then leaves the registry |
| V3 | four labelled refusals: traversal source `[INVALID_INPUT]`; `schema` ≠ `holonovel.codex/1` `[INVALID_INPUT]`; duplicate slug `[STATE_CONFLICT]`; declared-hash mismatch `[STATE_CONFLICT]` | four named refusals across two codes, each restored |
| V4 | `npm run assemble`; `npm run validate` | exit 0; `0 error(s)`; coverage register current (no T-ID added) |
| V5 | `npm run check-tool-definitions-sync`; `npm run surface-budget`; `npm run check-fingerprint-sync`; `npm run check-g7-attestation` | pass after the documented regeneration order (D8) |
| V6 | `npm run check-anchors` | `predicates current` after D10's two declarations |
| V7 | `npm run check:fast` (un-piped); `npm run check` before push | `46 passed, 0 failed`; full gate `0 error(s)` |
| V8 | `npm run check-roadmap`; `npm run check-registers` | pass; item 5 gone; the Resolved entry exists with a date |
| V9 | `git status --porcelain` at close | only the planned files plus regenerated artifacts |

## Done bar

**Done bar:** `manage_artifact (action: install, kind: codex)` admits an exported library and the
installed pack survives `list`, `verify`, and `remove`; `spec_health` reports its count; a
traversing, wrong-schema, duplicated, or hash-mismatched pack is refused with the stated code; the
REQ-620/REQ-621 bodies and the two Appendix F rows name the fourth kind; every derived artifact is
regenerated by its own generator and every sync gate is green; `check-anchors` reports current
after D10's two measured declarations; `counts.codex` reads `1`; ROADMAP item 5 retired and the dated Resolved
entry written; `check:fast` and `check` are green; `aar.md` ends `LOOP PAUSED`; one commit.

## Out of scope

- Changing the export payload or `manage_codex`'s actions (D2, D7, EV4).
- Signing or attesting a pack: provenance is copied and reported, not verified against a key
  (D5).
- Moving packs between hosts over a network: the inbox is a directory, as for the other kinds.
- Merging an imported library into the live codex. Install admits a registry entry; making its
  entries callable is a separate contract and is not in the roadmap item.
- Any change to Novel pack, adventure module, or ruleset admission.

## Risks

| Risk | Mitigation |
|---|---|
| A fourth kind is missed in one of the union sites (EV1) | P1 enumerates them before editing; the harness asserts `list`, `counts`, `verify`, `install`, and `remove` for the new kind |
| Hash mismatch from canonicalization differences | Both sides use `canonicalJson` over the same `{schema, entries}` shape, with the declared hash excluded from the input |
| A stale `spec_health` shape | `registryCounts` is typed over the union, so a missing branch is a typecheck error, not a silent zero |
| Regeneration order drift | D8 fixes the order and names the emitter for each artifact |
| The insertions leave two anchors stale | EV7 measures them; D10 repairs by two declarations and V6 gates the end state |
| Probe fixtures leak into the data directory | Probes run under an isolated data dir and are removed after |

## Dependencies

- Independent of items 1 and 2.
- Item 4 stage 3 does not touch the artifact region (D9); if it lands first, this plan's line
  numbers shift by 980 and its own pre-stamp re-measures them.
- Requires the spec regeneration chain (D8) because the kind enumeration is normative.
