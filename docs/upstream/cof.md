# Upstream watch — COF (Character Open File)

Holonovel borrows design vocabulary from COF, not code. This file is the
durable record of what was taken, what was rejected, and what changed upstream,
so an update can be integrated deliberately instead of rediscovered.

Credit is carried in two places: the README License list (borrowed-sources
bullet) and the §5.35 preamble that defines subjective memory. COF's
specification is CC BY 4.0, its schemas CC0, its code MIT, by Yann Souetre.

**Requested attribution**, reproduced verbatim as COF's README asks:

> COF — Character Open File, Yann Souetre, https://github.com/yannsouetre/cof

Full license links and modification status for every borrowed source are in
[`docs/licenses/ATTRIBUTION.md`](../licenses/ATTRIBUTION.md).

## Pin

| Field | Value |
|---|---|
| Upstream | `yannsouetre/cof` |
| Reviewed version | 1.2.1 |
| Reviewed commit | `102422f517b7c736a2485c0382fbf586067c976d` |
| Reviewed date | 2026-11-08 |
| Next review | 2026-12-08, or on a release notification |

A release invalidates the pin; it does not invalidate the design. Integration
is a decision, not a merge.

## What we take

| COF concept | Holonovel home | Status |
|---|---|---|
| memory node: gist, when/where/who, felt_then/now, salience, fidelity, origin | `subjective_memory` group, roadmap chunk 1 | scheduled |
| divergence between recollection and fact | divergence verdicts, roadmap chunk 2 | scheduled |
| `disclosure` (open / guarded / secret) separate from access | memory disclosure axis, roadmap chunk 3 | scheduled |
| psyche kinds, `awareness`, `false_but_held`, `valence`, `since`/`until`, owned contradiction | identity facets, roadmap chunk 4 | adopted — REQ-636–REQ-643 |
| deterministic selection, retention, recall evaluation | recall quality, roadmap chunk 5 | scheduled |

## What we deliberately do not take

| COF concept | Why not |
|---|---|
| ZIP container, manifest, presets, media assets | Holonovel's save format is engine state; file interop is an AI-mediated translation, not a contract (Character Card import/export already exists: REQ-075h/i) |
| multimodal memory traces (image, audio, video) | Holonovel is text-only |
| softmax / sampled memory selection | breaks replay determinism; Holonovel specifies a scored, ordinal-tie-broken top-k |
| reader-defined recall | the format stores memory, the host performs it; Holonovel specifies and measures recall |
| psyche-node `strength` (0–100 decision weight) | not adopted with the psyche facets: the roadmap does not name it, and ranking belongs with recall quality (chunk 5) |
| psyche-node typed links other than `conflicts` (`about`, `because`, `supports`) | only the contradiction relation is adopted (`contradicts`); a general facet graph needs its own traversal contract |

## Review procedure (monthly)

1. Fetch `README.md`, `docs/roadmap.md`, `CHANGELOG.md`, and any new `rfcs/`
   entry from upstream `main`.
2. Diff against the pin. Classify each delta:
   - **No-op** — implementation, docs, or media only.
   - **Design-relevant** — a new or changed category, field, or behaviour.
   - **Breaking** — a change that would force a new major upstream version.
3. For each design-relevant delta, decide one of: `adopted` (fold into a
   scheduled chunk), `deferred` (record with a reason), `rejected` (record the
   reason in the table above).
4. Update the pin and add a row to the delta log. The delta log is the audit
   trail; there is no separate register.
5. A delta that changes a pending roadmap chunk is an amendment to that chunk's
   plan, not a new roadmap item. A delta that opens a new capability becomes a
   roadmap item only at the weekly replenishment point.

No network call runs in a gate. The check is an operator or agent step in the
monthly ritual (`docs/workflow-cadence.md`), and its output is this file.

## Delta log

| Date | Upstream | Delta class | What changed | Disposition |
|---|---|---|---|---|
| 2026-11-08 | 1.2.1 | design-relevant | Memories (1.1), psyche + people/places/objects (1.2), Character.AI import (1.2.1); roadmap announces `cof select`, a standalone player, and a reserved world category | Adopted the memory, divergence, disclosure and psyche vocabulary into the five roadmap chunks; rejected container, media, sampling |
