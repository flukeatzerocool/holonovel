# Plan — `codex pack` as a fourth artifact kind (ROADMAP item 5)

**Kind:** planned · **Depth:** standard · **Rollback cost:** 1 (reversible edits plus one new
directory convention under the data directory) ·
**Evidence:** `npm run check:fast` 46/46 PASS at HEAD `77054a3`; the line numbers below were
re-measured against that tree on 2026-11-18 after `index.ts` split stage 3
(`3ae3444`) moved the world-model surface out. **Trust boundary:** `repo` evidence only.

## Questions

ROADMAP item 5 (`ROADMAP.md:54-64`, P3): "`manage_codex (action: export)` ships one-way: a
library leaves the server as `holonovel.codex/1`, but nothing admits one back — `REQ-620`/
`REQ-621` admit Novel pack, adventure module, and ruleset package only." It closes when
"`manage_artifact (action: install)` admits a `codex pack` and `spec_health` reports its
count" (`ROADMAP.md:63-64`).

The deliverable is the executable plan for that item: a closed kind set in code, a
normative admission rule, a registry entry, a count, tests, and the spec surfaces that
enumerate the kind set. This increment drafts and reviews the plan; it does not execute it.

## Trigger status

- **Trigger:** "the next artifact-registry change (REQ-620/REQ-621), or a request to move a
  codex library between hosts" (`ROADMAP.md:62-63`). **Not met by the tree:** neither REQ has
  changed since the item was written (both still read as the registry/admission pair at
  `spec/02-requirements.md:2562,2564`), and no move request is recorded. Execution is the
  maintainer's selection, which is what opened this plan.
- **Priority:** P3, the lowest open item. The plan records its ordering constraint against
  the next `index.ts` split stage (D9) rather than assuming isolation.

## Why

- **EV1 — the kind set is a closed union across nine code sites.** `ArtifactKind` is
  `"novel" | "adventure" | "ruleset"` (`holonovel/src/core/artifact-registry.ts:16`);
  `KIND_ORDER` fixes catalogue order (`:54`); `buildArtifactRegistry` concatenates
  `scanNovels`, `scanAdventures`, `scanRulesets` (`:56-62`, scans at `:66`, `:115`, `:156`);
  `registryCounts` initializes its record from the union (`:188-191`); and in `index.ts` the
  `kind` enum enumerates the same three (`:11356`), the install branch switches on them
  (`:11401`, `:11484`, ruleset body from `:11510`), `artifactDependencyError` branches on
  kind (`:11332-11348`), the removal branch labels them (`:11579`), and `spec_health`
  publishes `artifacts_registered` (`:12352`). A fourth kind that any of these misses is
  silently absent from `list`, `counts`, or `install`, or is refused removal for a
  dependency it cannot have.
- **EV2 — the registry contract is kind-agnostic once the entry exists.** REQ-620
  (`spec/02-requirements.md:2562`) requires kind, slug, title, content hash, declared
  provenance, and an integrity state per entry, and `spec_health` counts per kind.
  `RegistrySources` (`artifact-registry.ts:45-52`) already carries `novelsDir`,
  `adventureDirs`, `rulesets`, `rulesetHash`, so a fourth source field follows the shape.
- **EV3 — admission's primitives exist.** `artifactRegistry()` builds its sources at
  `index.ts:11307-11319`; `inboxSourcePath` resolves inside the exchange inbox at `:11321`
  with `resolveWithin`/`resolveInboxDir`; `isSafeSlug` is imported at `:109`; `sha256Json`
  (`:10266`) is `sha256(canonicalJson(value))`, the same helper the bundle-integrity paths
  use. `canonicalJson` is `core/state-hash.ts:50`.
- **EV4 — the exporter's payload has no identity or hash fields.** `manage_codex (action:
  export)` returns `{schema: "holonovel.codex/1", entries}` serialized at `index.ts:14015`,
  entries sorted by id (`:14013-14014`). REQ-321o (`spec/02-requirements.md:2316-2317`)
  fixes that shape; its body is 751 characters against the 800-character limit
  (`scripts/validate.ts:203`), too little headroom to norm a hash clause without rewriting a
  shipped acceptance criterion. T792 (`spec/appendices-reference.md:2153`) asserts
  byte-identity and does not pin the exact key set.
- **EV5 — the test surface is one harness with 23 cases**
  (`grep -c "await test(" holonovel/scripts/test-artifact-registry.ts`). It already covers
  the T738/T739 cases: equal listings, kind filter, kind catalogs, non-verified integrity,
  traversal refusal, tampered-pack refusal, `-N` duplicate suffix, security-event audit, and
  `spec_health` per-kind counts.
- **EV6 — the kind set is spelled in six spec and doc surfaces, not two.** REQ-620 and
  REQ-621 (`spec/02-requirements.md:2562,2564`); the §4 glossary row
  (`spec/01a-constitution.md:148`); the inbox row of the §7.6 environment table
  (`spec/04-runtime.md:177`); the exchange runbook V.10
  (`spec/appendices-runbooks.md:279-299`); the non-normative artifact-provenance section
  (`docs/engine-contract.md:289`); and the server orientation list
  (`holonovel/AGENTS.md:125`). Appendix F carries the two test procedures
  (`spec/appendices-reference.md:2100-2101`).
- **EV7 — a spec edit here drags a regeneration chain, and `assemble` rewrites a tracker.**
  `npm run assemble` rewrites `spec/build-phase-map.md`'s content hash (observed: `Updated
  spec/build-phase-map.md content hash`), the G7 attestation bakes `SPEC_HASH =
  sha256(holonovel.md)` (`holonovel/scripts/generate-g7-attestation.ts:159,180`), the tool
  definition snapshot carries the description and the `kind` enum
  (`holonovel/tool-definitions.json`, regenerated by
  `holonovel/scripts/generate-tool-definitions.ts`), and `surface-budget` records a baseline
  keyed on that snapshot (`spec/audit/tool-surface-baseline.json`). The contract
  fingerprints do **not** move: the package fingerprint hashes §5.16, §5.17, §6.3, and
  §6.4.2, and the data fingerprint hashes §5.6, §5.9, §5.19, §5.21–§5.28, §5.31, §5.32,
  §7.7, and Appendix Q (`scripts/lib/contract-fingerprint.ts:24-40`); REQ-620 and REQ-621
  sit in §5.7, which neither list includes.
- **EV8 — the `manage_artifact` description is 965 of its 1000 bytes.** Measured on the
  source string at `index.ts:11353`; `scripts/tool-definitions-lint.ts` fails a description
  over the recorded budget (REQ-024c, DECISIONS 2026-11-12 "manage_codex description 842 B <
  1000 B budget"). A codex mention must therefore fit in 35 bytes or replace existing words.
- **EV9 — two `index.ts` evidence anchors shift under this increment's edits.** Nineteen
  anchors record `holonovel/src/index.ts`; seventeen record a line earlier than 11321 and are
  untouched, and two record a line at or after it: `holosuite-adversarial.ts:34`
  (`:11321#inboxSourcePath`) and `holosuite-conformance.ts:37` (`:14784#prompt`). Those two
  shift by different amounts because the first insertion (`codexDir`) lands between them. `refresh-predicates` repairs by identity only at exactly one candidate line
  (`scripts/lib/anchor-resolver.ts:79-88`); `inboxSourcePath` occurs on two code lines
  (`:11321`, `:11397`), so it needs a declared offset.

## Decisions

- **D1 — Kind name `codex`; directory `<DATA_DIR>/codex/<slug>.json`.** The directory sits
  beside `novels/`, `adventures/`, `rulesets/`, and `inbox/` under the same data root
  (`resolveDataDir`). The slug is the file stem. `KIND_ORDER` appends: novel, adventure,
  ruleset, codex.
  - Rejected: `codex-packs/`. The kind name and the directory should read the same, and
    `codex.json` (the live library) is a file, not a directory, so there is no collision.
- **D2 — Admission accepts the exporter's payload verbatim (EV4).** A pack is any file in
  the inbox whose parsed body is `{schema: "holonovel.codex/1", entries: [...]}` with at
  least one entry; every entry must be an object carrying string `id` and `kind`, and
  anything else refuses `[ERROR] [INVALID_INPUT]` before a write. The slug is the file stem;
  an optional top-level `title` string is used when present, else the slug.
  - Rejected: add `slug`/`title`/`content_hash` to the export payload. REQ-321o has 49
    characters of headroom (EV4); a normative hash clause does not fit, and rewriting its
    acceptance criterion to make room edits a shipped contract to serve a new consumer.
  - Rejected: a wrapper envelope (`{pack: {...}, payload: {...}}`). Two formats for the same
    bytes and a second parser to keep in sync.
- **D3 — The hash is over `{schema, entries}` ordered by id; a declared hash is optional and
  compared.** Both admission and the registry scan sort a copy of `entries` by `id` and
  compute `sha256(canonicalJson({schema, entries}))` over that copy, so two payloads with
  equal entries hash equally regardless of payload order (the exporter already orders by
  id); the stored file keeps its original order. The registry entry's
  `content_hash` is that recomputed value; its `integrity` is `verified` when a declared
  top-level `content_hash` matches, `unverified` when a declared value differs, and
  `absent` when the payload declares none — the same convention as a Novel save with no
  `_checksum` (EV5's `absent` case). A declared value is excluded from the hash input, so
  declaring a hash cannot change it.
  - Rejected: require a declared hash. The shipped producer cannot emit one (D2, EV4), so
    requiring it would refuse every library the server itself exports.
  - Rejected: hash the whole file, including `content_hash`. The hash would be
    self-referential.
- **D4 — A duplicate slug is refused, not suffixed.** Installing a slug already present in
  `<DATA_DIR>/codex` returns `[ERROR] [STATE_CONFLICT]` naming `manage_artifact (action:
  remove, kind: codex, slug: …)` as the corrective action.
  - Rejected: the Novel pack's `-N` suffix. A silently forked library is worse than a
    refusal; the suffix rule exists because a Novel pack's slug comes from inside the file
    (REQ-621a), not from the filename.
- **D5 — Provenance is copied and shape-validated, not attested.** A pack may carry a
  top-level `provenance {creator, attribution, license}`; every present value must be a
  string or admission refuses `[ERROR] [INVALID_INPUT]`, and the scan copies the values onto
  the registry entry. The adventure verifier (`core/adventure-provenance.ts`) is not
  reused: it validates Markdown front matter, not JSON. A pack has no signature format to
  verify against, so the plan says so rather than implying attestation; the T739 and runbook
  clauses that say every kind's provenance is verified are amended to "where the kind
  declares verifiable provenance" (D6).
- **D6 — The spec edit is two REQ bodies, the two Appendix F rows, and seven doc surfaces —
  eleven edits. No new REQ and no new T-ID.** The validator measures a body with
  `extractReqBodies` (`scripts/validate.ts:200-205`, 800-character limit) and counts
  sentences over the normative part with `splitSentences`
  (`scripts/lib/parse-spec.ts:121-133`): REQ-620 762 → **796** characters, 3 → 3 sentences;
  REQ-621 396 → **703** characters, 1 → 4 sentences; the longest new sentence is 42 words
  (limit 45). Both bodies were run through `npm run validate:sdd` on a scratch copy: 0
  errors, warnings unchanged at 303. The pasted bodies are wrapped for reading; in the spec
  each body is one line, so join the wrapped lines with single spaces.
  - **REQ-620** — full final body:
    "The server SHALL derive a host-level registry of installed Novel, adventure, ruleset,
    and codex-pack artifacts from the configured directories, offline, with no persisted
    index. Each entry SHALL carry its kind, slug, title, content hash, declared provenance,
    and an integrity state. `manage_artifact (action: list)` SHALL render the registry
    deterministically and accept a kind filter; `manage_artifact (action: verify)` SHALL
    recompute integrity without mutation. An installed artifact SHALL be discoverable
    through its kind catalog, and a codex pack through the registry's kind filter.
    `spec_health` SHALL report counts per kind. *Acceptance criterion:* two installations
    with equal artifacts report equal listings; a corrupted artifact reports a non-verified
    integrity state. _Check:_ T738."
  - **REQ-621** — full final body:
    "`manage_artifact (action: install)` SHALL admit a Novel pack, adventure module, ruleset
    package, or codex pack from the exchange inbox into its kind directory, verify the
    kind's content hash and any declared verifiable provenance before admission, and refuse a
    mismatch
    with `[ERROR] [STATE_CONFLICT]`. A codex pack is the `holonovel.codex/1` export payload;
    the source file stem supplies its slug. The server computes a codex pack's content hash
    over `{schema, entries}`. A declared hash that differs SHALL refuse admission, and an
    existing slug SHALL refuse rather than gain a suffix. *Acceptance criterion:* a tampered
    artifact is refused by slug; a conformant artifact is admitted. _Check:_ T739."
  - **Appendix F, T738** (`appendices-reference.md:2100`): replace the whole cell with "Local
    artifact registry: two isolated installations holding the same Novel, adventure, ruleset,
    and codex-pack artifacts report equal registry listings; `list` filters by kind and is
    deterministic across repeated calls; a corrupted artifact reports a non-verified
    integrity state rather than being omitted; each kind's catalog lists an installed
    artifact, and a codex pack lists under the registry's kind filter; `spec_health` reports
    a count per kind."
  - **Appendix F, T739** (`:2101`): replace "each verified by content hash and provenance"
    with "each verified by content hash, and by provenance where the kind declares a
    verifiable one", and append "a codex pack is admitted from its export payload and the
    registry reports its recomputed content hash, or `absent` when the payload declares
    none; a pack declaring a mismatched hash or an existing slug is refused
    `[STATE_CONFLICT]`".
  - **§4 glossary** (`01a-constitution.md:148`): "one of four kinds — Novel pack, adventure
    module, ruleset package, or codex pack".
  - **§7.6** (`04-runtime.md:177`): the inbox row admits "Novel packs, adventure modules,
    ruleset packages, and codex packs"; and (`:142`) the `TTRPG_DATA_DIR` row disambiguates
    the library file from the pack directory: "codex library (`codex.json`) and installed
    codex packs (`codex/`)".
  - **Runbook V.10** (`appendices-runbooks.md:279-299`): the exchange-format list gains "A
    codex pack is the `holonovel.codex/1` JSON produced by `manage_codex (action: export)`";
    step 1 gains "or export the codex library"; step 3 gains "a codex pack's provenance is
    shape-checked, not attested"; step 4 notes the registry kind filter for a codex pack.
  - **Non-normative** (`docs/engine-contract.md:289`): "The four shareable artifact classes
    — ruleset package, adventure module, Novel, and codex pack — carry one provenance
    envelope", plus one refusal sentence in §10 for a declared codex hash that does not
    match.
  - **`holonovel/AGENTS.md`**: the tool-surface line (`:125`) names codex packs, and the
    State Model section (`:240-254`) gains one bullet: "**Artifacts:** installed exchange
    artifacts live in `<DATA_DIR>/novels/`, `<DATA_DIR>/adventures/`, `<DATA_DIR>/rulesets/`,
    and `<DATA_DIR>/codex/` (one JSON pack per slug); the registry is scan-derived
    (REQ-620)."
  - **Catalogue entry.** The roadmap's "catalogue entry" (`ROADMAP.md:59-60`) is the registry
    entry rendered by `manage_artifact (action: list, kind: codex)`; REQ-620 is amended to
    say exactly that, so the roadmap wording is satisfied without a second catalogue surface.
    Rejected: extending `manage_codex (action: list)` with installed packs — it would mix
    library entries with exchange artifacts and blur REQ-321l's partition.
  - Rejected: a new `REQ-621e — Codex pack admission`. It would add a REQ row to the §5 map,
    the coverage register, and the evidence-linkage baseline for a contract the existing
    harness already exercises, and REQ-621 is the admission contract for every kind.
- **D7 — No new tool action.** `manage_codex` keeps its actions; admission lives in
  `manage_artifact`, where audit, authorization, traversal, and removal already are.
  Rejected: `manage_codex (action: import)` — two admission paths under one audit contract
  is how the artifact actions drift, and a new action moves the REQ-429 recorded budget.
- **D8 — The description keeps its byte budget by replacing words, not appending (EV8).**
  "Novel packs, adventure modules, and ruleset packages" becomes "Novel packs, adventures,
  rulesets, and codex packs" (965 → 963 bytes of 1000, measured). The `kind` enum gains
  `codex`, the `source` description gains "codex pack (.json)", and `install`/`remove`/`list`
  prose stays otherwise unchanged. This is the per-description budget only
  (`scripts/tool-definitions-lint.ts:83-84,113`); the enum and parameter text also move the
  catalog footprint that `surface-budget` records, which is why D8b runs it with `--write`.
- **D8b — The regeneration chain runs in one ordered phase.** The REQ-body edit moves every
  derived artifact, so the order is fixed: `npm run assemble` (writes `holonovel.md` and
  `spec/build-phase-map.md`) → `npm run check-tool-definitions-sync` (regenerate when it
  reports drift) → `npm run tool-definitions-lint` → `npm run surface-budget -- --write` →
  `npx tsx holonovel/scripts/generate-g7-attestation.ts` (emits `SPEC_HASH`; `--check` only
  verifies) → `npm run check-fingerprint-sync` → `npm run build-order` (assemble, propagate,
  full check, CalVer when the session date moved). `build-order` re-runs the full `check`
  gate, so it belongs after the edit, not before it.
- **D9 — Ordering against the next `index.ts` split stage.** ROADMAP item 4's next stage
  extracts "dispatch, the ruleset surface, and the synthesis router"
  (`ROADMAP.md:47-48`). The synthesis router sits next to the codex block
  (`index.ts:13934-14200`), so that stage is the one that collides. Either increment may
  land first; the later one re-measures its own line numbers and anchor bands. Running both
  in one tree is out.
- **D10 — Anchors need two measured declarations (EV9).** One added line (`codexDir` in the
  sources literal) sits above 11321 and every other added line sits below it, so the two
  remaining anchors shift by different amounts: `14784#prompt` by `k1+k2` and
  `11321#inboxSourcePath` by `k1`, where `k1` is the net added lines above 11321 and `k2`
  below it. `refresh-predicates --offset` is single-valued with a lower-bound
  `--from-line`, so run two passes in this order:
  1. `npx tsx scripts/refresh-predicates.ts --write --offset <k1+k2> --path
     holonovel/src/index.ts --from-line 11322` — rewrites `14784`; `11321` is out of scope,
     loses its symbol, and is ambiguous (two carriers), so the run reports it unresolved and
     **exits 1**. The write has landed: confirm with `git diff` on
     `holosuite-conformance.ts`, and confirm the stderr line names
     `index.ts:11321#inboxSourcePath`.
  2. `npx tsx scripts/refresh-predicates.ts --write --offset <k1> --path
     holonovel/src/index.ts --from-line 11321` — rewrites `11321`; `14784` already carries
     its symbol at the rewritten line and short-circuits (`refresh-predicates.ts:262-266`).
     Exit 0.
  `k1` and `k2` are counted from `git diff -U0 -- holonovel/src/index.ts` after staging,
  never predicted. Acceptance is the final `npm run check-anchors` reading `predicates
  current`, not each invocation's exit code. One global offset would leave one anchor stale.
- **D11 — Register follow-through.** No pre-existing `Scheduled-roadmap` row names this item
  (`grep -n "codex" spec/audit/review-register.md` returns only health/notes findings;
  `codex pack` appears nowhere in the file), so the increment opens its own dated
  `## Resolved` entry and retires the ROADMAP section in the same step; `check-registers`
  requires a date on every bullet it parses. `holonovel/DECISIONS.md` gains a dated design
  entry under the artifact-exchange heading naming the kind, the hash rule, and the
  duplicate rule.

## Blast radius

| File | Change | Size |
|---|---|---|
| `holonovel/src/core/artifact-registry.ts` | `ArtifactKind`, `KIND_ORDER`, `scanCodexPacks`, `RegistrySources.codexDir`, `registryCounts` | M |
| `holonovel/src/index.ts` | sources literal (`:11307-11319`), `kind` enum (`:11356`), description (`:11353`), install branch (after `:11505`), removal branch (`:11557-11574`), removal label (`:11579`) | M |
| `holonovel/scripts/test-artifact-registry.ts` | round-trip, no-hash, wrong-schema, empty-entries, duplicate, hash-mismatch, traversal, remove/reinstall cases (8) | M |
| `holonovel/scripts/lib/holosuite-adversarial.ts` | anchor offset for `11321` (D10) | S |
| `holonovel/scripts/lib/holosuite-conformance.ts` | anchor offset for `14784` (D10) | S |
| `spec/02-requirements.md` | REQ-620, REQ-621 bodies (D6) | S |
| `spec/appendices-reference.md` | T738 (`:2100`), T739 (`:2101`) | S |
| `spec/01a-constitution.md` | Artifact glossary row (`:148`) | S |
| `spec/04-runtime.md` | `TTRPG_ARTIFACT_INBOX` row (`:177`) and the `TTRPG_DATA_DIR` row (`:142`, library file vs pack directory) | S |
| `spec/appendices-runbooks.md` | V.10 exchange-format list and steps 1, 3, and 4 | S |
| `docs/engine-contract.md` | §10 artifact classes and refusal sentence | S |
| `holonovel/AGENTS.md` | tool-surface line (`:125`); State Model artifact bullet (`:240-254`); `build-order`'s `refresh-properties` step reads it for counts | S |
| `README.md` | no change expected: its only `@spec:` marker is `@spec:date`, derived from the version (`scripts/cross-property-couple.ts:136-160`); `refresh-properties` rewrites it only if it moved. The untracked wiki mirror and `holonovel/holonovel.md` embed copy are refreshed but never committed | S |
| `holonovel.md` | regenerated by `npm run assemble` | S |
| `spec/build-phase-map.md` | content-hash line rewritten by `npm run assemble` (EV7) | S |
| `holonovel/src/generated/g7-attestation.ts` | `SPEC_HASH` re-emitted | S |
| `holonovel/tool-definitions.json` | regenerated description and `kind` enum | S |
| `spec/audit/tool-surface-baseline.json` | regenerated by `npm run surface-budget -- --write` | S |
| `holonovel/DECISIONS.md` | dated design entry (D11) | S |
| `ROADMAP.md` | item 5 retired | S |
| `spec/audit/review-register.md` | dated `## Resolved` entry (D11) | S |
| `CHANGELOG.md` | rendered from the AAR block at close | S |
| `docs/plans/2026-11-18-codex-pack-kind/` | plan, tasks, AAR, review record | S |
| `version-bump` surface (conditional) | on a session date later than 2026-11-18, `build-order` advances CalVer and rewrites `package.json`, `holonovel/package.json`, `holonovel/package-lock.json`, `holonovel/server.json`, `holonovel/AGENTS.md`, `holonovel/DECISIONS.md`, and the version constant in `holonovel/src/index.ts` | S |

Rollback: `git checkout -- .` returns every tracked change (all edits and regenerated
artifacts are tracked), and `rm -rf docs/plans/2026-11-18-codex-pack-kind` drops the new
increment directory. An installed pack lives under the data directory and is removed by
`manage_artifact (action: remove)`, so probe fixtures run under a temp `DATA_DIR`
(`TTRPG_DATA_DIR`; the harness already boots isolated roots,
`test-artifact-registry.ts:28-29`).

## Phases

- **P1 — Surface audit.** Enumerate every place the kind union is spelled:
  `grep -rn 'ArtifactKind\|"novel"\|"adventure"\|"ruleset"' holonovel/src`, then read the
  `manage_artifact` install and remove branches by hand for `kind ===` comparisons and the
  removal label (string literals alone miss `:11484`, `:11558`, `:11579`); confirm EV1's
  sites and no other. Sibling contract: `grep -rn "manage_artifact\|T738\|T739"
  spec/02-requirements.md spec/appendices-reference.md holonovel/src holonovel/scripts` —
  every binding (REQ-620, REQ-621, REQ-621a–d, T738, T739, REQ-052) must tolerate a fourth
  kind; a binding that hard-codes the three stops the phase for an amendment. Also confirm
  the anchor inventory (`grep -rn 'anchor("holonovel/src/index.ts"' holonovel/scripts`) shows
  seventeen anchors below 11321 and exactly two at or after it (11321, 14784). Accept: a
  written list of union sites, action bindings, and anchors; no edit yet.
- **P2 — Registry and admission.** Add the kind, the scan, the source field, the install
  branch, the removal branch, and the label (D1–D5). Accept: a pack in an isolated data
  directory's inbox installs, appears in `list`, filters by `kind`, reports the recomputed
  `content_hash`, refuses a duplicate, counts 1 in `spec_health`, and removal is never
  refused for a dependency a codex pack cannot have.
- **P3 — Tests and negative probes.** Extend the harness with the eight cases (V1/V3), named
  with `T739`/`T738` prefixes so the evidence binding still resolves. Record the pre-fix
  signature for each negative probe: the current tree rejects `kind: "codex"` at input-enum
  validation before the handler runs, so none of the eight can pass before P2 lands —
  the probes prove the new branch, they do not reproduce an old defect. Restore with `git
  status --porcelain` empty.
- **P4 — Anchors.** D10's two measured declarations, then `npm run check-anchors` →
  `predicates current`.
- **P5 — Spec, regeneration chain, registers.** D6 edits, then D8b's ordered chain, then
  ROADMAP retirement, the dated Resolved entry, and the DECISIONS entry.
- **P6 — Close.** `npm run check:fast` un-piped, `npm run check` before any push, AAR,
  `session:close`.

No new gate, harness, or pattern-based check is added (D7): the existing
`test:artifact-registry` harness is extended in place, so the error-gate dry run and
existing-check discovery reduce to confirming in P1 that no other script already enumerates
the artifact kinds.

## Verification

| # | Command / check | Expected |
|---|---|---|
| V1 | `npm --prefix holonovel run test:artifact-registry` | 31 cases (23 + 8), all pass |
| V2 | round-trip probe: `manage_codex (action: export)` → write the payload into an inbox → `manage_artifact (action: install, kind: codex)` → `list` / `verify` / `spec_health` → `remove` | admitted; `counts.codex` = 1; `content_hash` = the recomputed canonical hash; `integrity` = `absent` for the untouched export; `remove` leaves the registry |
| V3 | five labelled refusals: traversal source `[INVALID_INPUT]`; `schema` ≠ `holonovel.codex/1` `[INVALID_INPUT]`; empty `entries` `[INVALID_INPUT]`; duplicate slug `[STATE_CONFLICT]` naming `remove`; declared-hash mismatch `[STATE_CONFLICT]` naming the slug | five named refusals across two codes, nothing written for each, each restored |
| V4 | `npm run assemble`; `npm run validate` | exit 0; `0 error(s)`; warnings at or below the 303 baseline; coverage register current (no T-ID added) |
| V5 | `npm run check-tool-definitions-sync` (regenerate first); `npm run tool-definitions-lint`; `npm run surface-budget -- --write`; `npm run check-g7-attestation`; `npm run check-fingerprint-sync` | pass in D8b's order; description ≤ 1000 bytes; fingerprints unchanged |
| V6 | `npm run check-anchors` | `predicates current` after D10's two declarations |
| V7 | `npm run check:fast` (un-piped); `npm run check` before push | `46 passed, 0 failed`; full gate `0 error(s)` |
| V8 | `npm run check-roadmap`; `npm run check-registers` | pass; item 5 gone; the Resolved entry carries a date |
| V9 | `git status --porcelain` at close | only the blast-radius files plus regenerated artifacts |

## Done bar

**Done bar:** `manage_artifact (action: install, kind: codex)` admits an exported library and
the installed pack survives `list`, `verify`, and `remove`; `spec_health` reports its count;
a traversing, wrong-schema, empty, duplicated, or hash-mismatched pack is refused with the
stated code; the REQ-620/REQ-621 bodies and the Appendix F, glossary, runtime, runbook, and
engine-contract surfaces name the fourth kind; every derived artifact is regenerated by its
own generator and every sync gate is green; `check-anchors` reports current after D10's two
measured declarations; `counts.codex` reads `1`; ROADMAP item 5 retired and the dated
Resolved entry written; `check:fast` and `check` are green; `aar.md` ends `LOOP PAUSED`; one
commit.

## Out of scope

- Changing the export payload or `manage_codex`'s actions (D2, D7, EV4).
- Signing or attesting a pack: provenance is copied and reported, never verified against a
  key, and no hash is emitted by the exporter (D3, D5).
- Merging an installed pack into the live codex library. Install admits a registry entry;
  making its entries callable is a separate contract and not in the roadmap item.
- Moving packs between hosts over a network: the inbox is a directory, as for the other
  kinds.
- Any change to Novel pack, adventure module, or ruleset admission.

## Risks

| Risk | Mitigation |
|---|---|
| A fourth kind is missed in one of EV1's sites | P1 enumerates them before editing; the harness asserts `list`, `counts`, `verify`, `install`, and `remove` for the new kind |
| Admission and the scan disagree on the hash | Both call `sha256(canonicalJson({schema, entries}))`; the test asserts `verify` returns the value computed in the test |
| A pack with no declared hash reads as "verified" by mistake | D3 fixes `absent`; V2 asserts it on the untouched export |
| Equal packs in a different order hash differently | D3 sorts by id before hashing; T2 asserts equal hashes across two payload orders |
| The description overruns the 1000-byte budget | D8 replaces words; `tool-definitions-lint` gates it |
| Regeneration order drift | D8b fixes the order and names the emitter for each artifact |
| The insertions leave the two anchors stale | D10's two measured declarations; V6 gates the end state |
| The next `index.ts` split stage rewrites the codex block first | D9: whichever lands second re-measures; do not interleave |
| Probe fixtures leak into the data directory | Probes run under an isolated data dir and are removed after |

## Dependencies

- Independent of ROADMAP items 1, 2, and 3.
- Shares the `index.ts` file with item 4's next stage; D9 fixes the ordering rule, and no
  code region overlaps today (dispatch/ruleset/synthesis vs the artifact and codex blocks).
- Requires the spec regeneration chain (D8b) because the kind enumeration is normative.
