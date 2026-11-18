# Plan — ROADMAP item 5: `codex pack` as an artifact kind

*(A draft for the executing session. Re-home it as
`docs/plans/<date>-codex-pack-kind/plan.md`, re-measure the kind surface and the line numbers, and
stamp it — the evidence below is dated 2026-11-18 at HEAD `cc5e5a5`.)*

**Kind:** planned · **Depth:** standard · **Rollback cost:** 1 (reversible edit plus one new
directory convention) ·
**Evidence:** `npm run check:fast` 46/46 PASS; `REQ-620`/`REQ-621` bodies read at
`spec/02-requirements.md:2562,2564`; kind set measured in `holonovel/src/core/artifact-registry.ts`
and `holonovel/src/index.ts`.
**Trust boundary:** `repo` evidence only.

## Questions

ROADMAP item 5 (`ROADMAP.md:47-57`, P3): "`manage_codex (action: export)` ships one-way: a library
leaves the server as `holonovel.codex/1`, but nothing admits one back … Add `codex pack` to the kind
set with a kind directory, a catalogue entry, and an admission assertion, so an exported library
crosses hosts." Closes when "`manage_artifact (action: install)` admits a `codex pack` and
`spec_health` reports its count" (`:55-57`).

## Trigger status

- **Trigger:** "the next artifact-registry change (REQ-620/REQ-621), or a request to move a codex
  library between hosts" (`ROADMAP.md:55-56`). **Not met:** neither REQ has changed since the item
  was written, and no move request is recorded. Execution is the maintainer's selection (this set).
- **Priority:** P3, the lowest of the four; its plan records the ordering constraint against item 4
  (D9) rather than assuming isolation.

## Why

- **EV1 — the kind set is a closed union in six places.** `ArtifactKind = "novel" | "adventure" |
  "ruleset"` (`artifact-registry.ts:16`); `KIND_ORDER` (`:54`) fixes catalogue order;
  `buildArtifactRegistry` concatenates three scans (`:56-64`, `:67`, `:115`, `:156`);
  `registryCounts` builds its record from the union (`:188`); `manage_artifact`'s `kind` enum
  enumerates the same three (`index.ts:12969`); and the install branch switches on them
  (`:13006`). A fourth kind that any of these misses is silently absent from `list`, `counts`, or
  `install`.
- **EV2 — the registry contract is kind-agnostic once the entry exists.** REQ-620
  (`spec/02-requirements.md:2562`) requires each entry to carry kind, slug, title, content hash,
  declared provenance, and an integrity state, and requires `spec_health` to report counts per kind;
  `spec_health` already publishes `artifacts_registered: registryCounts(artifactRegistry())`
  (`index.ts:13965`). Adding a kind is therefore a scan plus an admission branch, not a new
  registry.
- **EV3 — admission's contract is REQ-621's, and it already has the primitives.**
  `manage_artifact` resolves `source` inside the exchange inbox with `inboxSourcePath`
  (`index.ts:12934-12935`, `resolveWithin`/`resolveInboxDir` from `core/data-dir.js`), refuses
  traversal, `requireGM()`s, audits, and rebuilds dependents (`:13006-13060`). `isSafeSlug` is
  already imported from `core/data-dir.js` (`:105`), and `canonicalJson` from `core/state-hash.js`
  (`:46`) is the repo's canonicalization primitive.
- **EV4 — the exporter's payload has no identity fields.** `manage_codex (action: export)` returns
  `{schema: "holonovel.codex/1", entries}` with entries sorted by id (`index.ts:15627-15628`); there
  is no slug, title, or provenance. REQ-321o (`spec/02-requirements.md:2316-2317`) fixes that payload's
  shape and its byte-identity property (T792), so the admission side must accept it as-is rather than
  the exporter growing fields.
- **EV5 — the test surface is one harness with 23 cases** (`grep -c 'await test('` reads 23). `holonovel/scripts/test-artifact-registry.ts`
  carries the T738/T739 cases (equal listings, kind filter, kind catalogs, non-verified integrity,
  traversal refusal, tampered pack refusal, `-N` duplicate suffix, security-event audit,
  `spec_health` per-kind counts). Appendix F rows: T738 at `spec/appendices-reference.md:2100`,
  T739 at `:2101`.
- **EV6 — a spec edit here drags a regeneration chain.** The kind enumeration lives in two REQ
  bodies, so `assemble`, the fingerprint set (`check-fingerprint-sync`), the G7 attestation's
  embedded spec hash, the tool-definition snapshot (the description changes), and the surface
  budget all move. The coverage register does not: no T-ID is added and no `_Check:_` line changes.

## Decisions

- **D1 — Kind name `codex`, directory `<DATA_DIR>/codex/<slug>.json`.** The directory sits beside
  `novels/`, `adventures/`, and `rulesets/` under the same data root (`resolveDataDir`,
  `index.ts:120`). Slug is the file stem. Kind order is appended: novel, adventure, ruleset, codex.
- **D2 — Admission accepts the exporter's payload verbatim (EV4).** A pack is any file in the inbox
  whose parsed body is `{schema: "holonovel.codex/1", entries: [...]}` with at least one entry; the
  slug is the file stem, and a `title` field is used when present, else the slug.
  - Rejected: add `slug`/`title`/`provenance` to the export payload. REQ-321o fixes the payload and
    T792 asserts its byte-identity; a format change would edit a shipped contract to serve a new
    consumer.
  - Rejected: a wrapper envelope (`{pack: {…}, payload: {…}}`). It creates a second format for the
    same bytes and a second parser to keep in sync.
- **D3 — Content hash is computed over canonical JSON, and a declared hash must match.** The hash is
  `sha256(canonicalJson({schema, entries}))` with entries ordered by id (already true at export,
  EV4). At scan time a pack's recomputed hash is its entry's `content_hash`; when the pack declares
  `content_hash`, admission compares and refuses a mismatch with `[ERROR] [STATE_CONFLICT]` naming
  the slug (REQ-621). A pack that declares none is admitted and stamped with the computed hash. This
  is the "verify the kind's content hash and any declared provenance" clause applied honestly: an
  undeclared hash cannot be verified, only computed.
- **D4 — Duplicate slug is refused, not suffixed.** Installing a slug already in `<DATA_DIR>/codex`
  returns `[ERROR] [STATE_CONFLICT]` naming `manage_artifact (action: remove, kind: codex, slug:
  …)` as the corrective action.
  - Rejected: the Novel pack's `-N` suffix. A silently forked library is worse than a refusal, and
    the suffix rule exists because a Novel pack's slug comes from inside the file (REQ-621a), not
    from the filename.
- **D5 — Provenance is the registry's, not adventure's.** A codex pack may carry
  `provenance {creator, attribution, license}`; it is copied onto the entry and reported. The
  adventure provenance verifier (`core/adventure-provenance.ts`) is not reused: it validates a
  Markdown front-matter shape, not a JSON pack.
- **D6 — Spec edit is one sentence in each of two REQ bodies, plus the two Appendix F rows.** REQ-620
  and REQ-621 gain `codex pack` in their kind enumeration; T738 and T739 each gain one clause. No new
  REQ, no new T-ID, no coverage-register change (EV6).
  - Rejected: a new `REQ-621e` for codex admission. It would duplicate REQ-621's contract for one
    kind and add a T-ID whose acceptance the existing harness already covers.
- **D7 — No new tool action.** `manage_codex` stays export-only; admission lives in `manage_artifact`
  where the audit, authorization, traversal, and removal contracts already are (EV3).
  - Rejected: `manage_codex (action: import)`. Two admission paths with one audit contract is how the
    artifact actions drift.
- **D8 — The regeneration chain runs in one ordered phase** (P4), because the REQ-body edit moves
  every derived artifact: `assemble` → `check-tool-definitions-sync` (description changed) →
  `surface-budget --write` when the footprint moved → `check-g7-attestation` (spec hash) →
  `build-order` (fingerprints, CalVer, AGENTS.md counts) → `check-package-manifest` /
  `test:package-manifest` unchanged but re-run.
- **D9 — Ordering against item 4.** `manage_artifact` (`index.ts:12964`) is outside stage 2's range
  (`:6528-7154`) and inside the range a later stage would move (`:12639-13800`). This plan lands
  first or rebases onto the moved module; it does not depend on the split, and the split does not
  change its contract.
- **D10 — There is no pre-existing review-register row for this item.** `grep -n codex
  spec/audit/review-register.md` returns only unrelated health/notes findings, so the increment
  opens its own dated `## Resolved` entry when it lands (the register's dated-entry convention) and
  retires the roadmap section. `check-registers` requires the date on every bullet it parses; the
  entry cites no REQ that is absent from ROADMAP.md.


## Blast radius

| File | Change | Size |
|---|---|---|
| `holonovel/src/core/artifact-registry.ts` | `ArtifactKind` + `KIND_ORDER` + `scanCodexPacks` + `RegistrySources.codexDir` + `registryCounts` | M |
| `holonovel/src/index.ts` | `artifactRegistry()` sources, `kind` enum, install branch, `spec_health` unchanged in shape, description text | M |
| `holonovel/scripts/test-artifact-registry.ts` | round-trip, count, traversal, tampered, duplicate, schema cases | M |
| `spec/02-requirements.md` | REQ-620, REQ-621 kind enumeration | S |
| `spec/appendices-reference.md` | T738, T739 procedure clauses | S |
| `holonovel.md`, `spec/build-phase-map.md` | regenerated by `assemble` | S |
| `holonovel/src/generated/g7-attestation.ts` | `SPEC_HASH` regenerated | S |
| `holonovel/tool-definitions.json` (+ its generated companions) | regenerated description/kind enum | S |
| `holonovel/AGENTS.md`, `AGENTS.md` | surface description and counts | S |
| `holonovel/DECISIONS.md` | dated design entry (kind, hash rule, duplicate rule) | S |
| `ROADMAP.md` | item 5 retired | S |
| `spec/audit/review-register.md` | dated `## Resolved` entry (no existing row to close — see D10) | S |
| `CHANGELOG.md` | rendered from the AAR block | S |
| `docs/plans/<date>-codex-pack-kind/` | plan, tasks, AAR | S |

Rollback: `git checkout -- .` returns the tree; an installed pack lives under the data directory and
is removed by `manage_artifact (action: remove)`, so the probe fixtures must be cleaned up in-tree or
created under a temp `DATA_DIR` (the harness already uses isolated data directories,
`holonovel/scripts/test-data-dir.ts`).

## Phases

- **P1 — Surface audit.** Enumerate every place the three-kind union is spelled (EV1) plus
  `grep -rn '"novel" | "adventure" | "ruleset"\|\["novel", "adventure", "ruleset"\]' holonovel/src`;
  confirm the list is complete before editing. Sibling contract: `grep -rn
  "manage_artifact" spec/02-requirements.md spec/appendices-reference.md holonovel/src` — every REQ
  and test binding that action (REQ-620, REQ-621, REQ-621a–d, T738, T739) must tolerate a fourth
  kind; a binding that enumerates the three in a way the plan cannot extend stops the phase for an
  amendment. Accept: a written list of union sites, a written list of action bindings, no edit yet.
- **P2 — Registry and admission.** Add the kind, the scan, the sources field, and the install branch;
  wire the description and enum. Accept: a pack in an isolated data dir's inbox installs, appears in
  `list`, filters by kind, reports `verified`, and counts 1 in `spec_health`.
- **P3 — Tests and negative probes.** Extend the harness with the six cases (round-trip, count,
  traversal refusal, tampered hash refusal, duplicate refusal, wrong-schema refusal), then run each
  probe against the pre-fix tree where applicable and record the failure message. Accept: the harness
  passes and each probe fails for the stated reason, restored afterwards
  (`git status --porcelain` empty).
- **P4 — Spec, regeneration chain, registers.** D6 edit, then D8's ordered chain; ROADMAP retirement;
  dated Resolved entry; DECISIONS entry.
- **P5 — Close.** `npm run check:fast` un-piped (then full `npm run check` before any push), AAR,
  `session:close`.

## Verification

| # | Command / check | Expected |
|---|---|---|
| V1 | `npm --prefix holonovel run test:artifact-registry` | all cases pass, including the six new ones |
| V2 | round-trip probe: `manage_codex (action: export)` → write the payload into an inbox → `manage_artifact (action: install, kind: codex)` → `list` / `verify` / `spec_health` | admitted; `counts.codex` = 1; `integrity` = `verified` |
| V3 | negative probes (traversal source, tampered hash, duplicate slug, `schema` ≠ `holonovel.codex/1`) | four labelled refusals, each restored |
| V4 | `npm run assemble`; `npm run validate` | exit 0; `0 error(s)`; coverage register current (no T-ID added) |
| V5 | `npm run check-tool-definitions-sync`; `npm run surface-budget`; `npm run check-fingerprint-sync`; `npm run check-g7-attestation` | pass after the documented regeneration order (D8) |
| V6 | `npm run check:fast` (un-piped); `npm run check` before push | `46 passed, 0 failed`; full gate `0 error(s)` |
| V7 | `npm run check-roadmap`; `npm run check-registers` | pass; item 5 gone; the Resolved entry exists with a date |
| V8 | `git status --porcelain` at close | only the planned files plus regenerated artifacts |

## Done bar

**Done bar:** `manage_artifact (action: install, kind: codex)` admits an exported library and the
installed pack survives `list`, `verify`, and `remove`; `spec_health` reports its count; a tampered,
traversing, duplicated, or wrong-schema pack is refused with the stated message; the three REQ/F
surfaces name the fourth kind; every derived artifact is regenerated by its own generator and every
sync gate is green; `counts.codex` reads `1` and the four refusals return `INVALID_INPUT` /
`STATE_CONFLICT` as specified; ROADMAP item 5 retired and the dated Resolved entry written;
`check:fast` and `check` are
green; `aar.md` ends `LOOP PAUSED`; one commit.

## Out of scope

- Changing the export payload or `manage_codex` (D7, EV4).
- Moving packs between hosts over a network: the inbox is a directory, as for the other kinds.
- Merging an imported library into the live codex (install admits a registry entry; making its
  entries callable is a separate contract and is not in the roadmap item).
- Any change to Novel pack, adventure module, or ruleset admission.

## Risks

| Risk | Mitigation |
|---|---|
| A fourth kind is missed in one of the six union sites (EV1) | P1 enumerates them before editing; the harness asserts `list`, `counts`, `verify`, and `install` for the new kind |
| Hash mismatch from canonicalization differences | Both sides use `canonicalJson` over the same `{schema, entries}` shape; entries are already id-sorted at export |
| A stale `spec_health` shape | `registryCounts` is typed over the union, so a missing branch is a typecheck error, not a silent zero |
| Regeneration order drift | D8 fixes the order; each sync gate names the artifact it owns |
| Probe fixtures leak into the data directory | Probes run under an isolated data dir (`test-data-dir.ts` pattern) and are removed after |
| The split later moves `manage_artifact` | D9: this plan lands first or rebases; the contract is unchanged either way |

## Dependencies

- Independent of items 1 and 2.
- Item 4 stage 2 does not touch `manage_artifact`; a later package-surface stage would (D9).
- Requires the spec regeneration chain (D8) because the kind enumeration is normative.
