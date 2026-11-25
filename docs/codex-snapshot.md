# Codex snapshot mode — the holodeck

**Status:** design draft, 2026-11-25. Not scheduled, not normative. Linked from
`docs/authoring-surfaces-roadmap.md`; the first approved increment moves into
`ROADMAP.md` and `docs/plans/`.

**Why this document exists.** A snapshot is the feature that turns the codex from a
library of assets into a library of moments. It is also the feature most likely to
duplicate existing machinery if designed loosely. This document fixes the distinction
from checkpoint, clone, branch, and export, and maps the feature onto primitives that
already exist.

## 0. Decisions recorded 2026-11-25

| # | Decision |
|---|---|
| 1 | Perception and subjective memory are included by default; `--lean` drops them. |
| 2 | Storage is a sidecar blob with a codex index entry; `--inline` is available for small snapshots. |
| 3 | State replay is the default; exact RNG draw replay is deferred to S8. |
| 4 | Restore supports a new Novel (`--as`) and an existing Novel (`--into`, `undo` semantics). |
| 5 | Audience defaults to `gm`; a player snapshot must be requested. |
| 6 | Retention is 25 snapshots per Novel, matching checkpoints, with explicit prune. |

The remaining questions in §13 do not block S1.

---

## 1. What a snapshot is

A **snapshot** is a frozen, audienced, content-addressed copy of a Novel's state at a
turn, stored as a codex entry and replayable without the source Novel.

| Concept | Lives in | Lifetime | Restores | Portable | Mutable |
|---|---|---|---|---|---|
| **Snapshot** | Codex (`kind: snapshot`) | Across Novels | Yes, into a new or existing Novel | Yes, as a pack | No |
| **Checkpoint** | Novel (`checkpoints[]`) | One Novel | Yes, in place | Only inside the Novel | No |
| **Clone** | Novels | A live copy | N/A | As an export | Yes |
| **Branch** | Novels | A live branch from an event | N/A | As an export | Yes |
| **Export** | File | Until deleted | As an import | Yes | N/A |

The distinctions that matter:

- A checkpoint is a **restore point inside** a Novel. A snapshot is a **library object
  outside** it.
- A clone is a **live copy**. A snapshot is **frozen**; playing it creates a new live
  Novel.
- A branch starts from an **event**. A snapshot starts from a **state**.
- An export is a **transport serialization**. A snapshot is a **curated, audienced,
  hashed moment**.

---

## 2. What it captures

The payload is the Novel's interchange state (`exportNovelJSON`,
`holonovel/src/core/state.ts:3595`), minus the fields that are not story state.

**Included:**

- world: rooms, things, exits, positions
- entities: player characters, NPCs, stats, inventory, conditions, current rooms
- NPC minds: goals, secrets, dispositions, knowledge
- beliefs, evidence, subjective memory, perception records
- relationships, lore, secrets, factions
- clocks, vows, agents and their current values
- scene: description, location, time, atmosphere, beat, choices, directive
- story journal and session metadata
- active entity, POV, badge-independent session context
- ruleset binding: slug, version, content hash
- content floor and content notes
- RNG provenance: seed and session draw count (see §7)
- codex provenance: which entries were materialized

**Excluded:**

- `audit_log`, `audit_archive`, `event_log` (evidence, not state)
- `undo_stacks`, `redo_stacks`, `checkpoints` (bookkeeping)
- `pending_workflow`, `constraint_overrides`, transient prompts
- host paths, machine identifiers, absolute locations
- the live `badge` (a snapshot must not hand the caller a different badge)

The checkpoint path deletes `perception_ledger` and `subjective_memory` for size
(`holonovel/src/index.ts:11008-11014`). A snapshot should **include** them by default:
what a character perceived and remembers is part of the moment. A `--lean` flag can
drop them for small fixtures.

---

## 3. Envelope

```json
{
  "schema": "holonovel.snapshot/1",
  "mode": "snapshot",
  "id": "snapshot_ruined_hour_20261125_0412",
  "label": "before the accusation",
  "description": "Turn 29, Calder has not yet been confronted.",
  "audience": "gm",
  "captured_at": "2026-11-25T04:12:00Z",
  "source": {
    "novel_slug": "ruined-hour",
    "turn": 29,
    "session_id": "ses_...",
    "server_version": "2026.11.25",
    "spec_version": "2026.11.25",
    "data_format": "...",
    "ruleset": { "slug": "cyberpunk-red", "version": "2026.11.19", "content_hash": "..." }
  },
  "state_hash": "sha256:...",
  "state_hash_projection": 3,
  "content_hash": "sha256:...",
  "rng": { "seed": "0", "session_draws": 412, "exact": false },
  "parent_snapshot": null,
  "tags": ["calder", "accusation"],
  "license": null,
  "payload": { "novel": { ... } }
}
```

`state_hash` reuses `stateHash` and `STATE_HASH_PROJECTION_VERSION`
(`holonovel/src/core/state-hash.ts:32,64`). `content_hash` is the canonical JSON hash
of the envelope without the hash fields, so the snapshot is deduplicable and
tamper-evident.

---

## 4. Storage

**Recommendation: sidecar, content-addressed, indexed in `codex.json`.**

- `codex.json` carries a small index entry per snapshot: `id`, `label`, `audience`,
  `state_hash`, `size`, `source`, `tags`, `created_at`.
- The payload lives at `.holonovel-state/snapshots/<state_hash>.json`.
- Two labels with the same state share one blob; deleting a label does not delete the
  blob until no index entry references it.
- This keeps `codex.json` readable and avoids a multi-megabyte flat file.
- A `--inline` option stores small snapshots in `codex.json` for portability.

Retention: a per-Novel cap (default 25, matching checkpoints) with explicit delete.
No automatic prune without `--prune`.

Why not reuse the checkpoint array: checkpoints are Novel-scoped, restored in place, and
removed with the Novel. A snapshot must outlive the Novel and travel between hosts.

---

## 5. Restore and branch

Three operations, each explicit:

| Operation | Semantics | State-copy mode |
|---|---|---|
| `restore --as <new-slug>` | Create a new Novel from the snapshot | `replace` (full payload) |
| `restore --into <slug>` | Replace an existing Novel's mutable state | `undo` (preserve logs) |
| `branch --as <new-slug>` | Create a new Novel with `parent_snapshot` | `replace` |

`restore --into` follows the checkpoint path: verify `state_hash`, ask for confirmation,
`importNovelJSON` then `applyNovelState(novel, restored, "undo")`
(`holonovel/src/index.ts:4652-4664`). The audit and event logs survive, and the restore
is audited as `snapshot_restored`.

`restore --as` creates a fresh Novel with the payload, a new slug, and provenance
`snapshot_source: {id, state_hash, label}`. It refuses if the slug exists, if the
ruleset is missing, or if a `state_hash` check fails.

A snapshot is immutable. Editing a restored Novel produces a new state; capturing it
again produces a new snapshot with `parent_snapshot` pointing at the first.

---

## 6. Diff

`snapshot diff <a> <b>` compares two snapshots by path, not by prose:

- **State diff:** world, entities, NPCs, beliefs, relationships, clocks, scene,
  journal. Each row is `path: old → new`, with added/removed/changed.
- **Transcript diff:** if both snapshots carry a transcript, compare turns, choices,
  and outcomes.
- **Provenance diff:** ruleset, server version, parent snapshot.

Output: a human table by default, `--json` for the full path list. This is the
"what did this branch change?" tool, and the "did the repair change state or only
prose?" tool.

---

## 7. Replay

Three levels, in increasing cost:

1. **State replay.** Restore the state and play forward. Deterministic for state, not
   for prose. This is the default.
2. **Transcript replay.** Render the recorded turns and choices read-only. Requires the
   event log or an embedded transcript; no model call.
3. **Counterfactual.** Restore the state and branch with different choices. This is the
   holodeck experience: "what if I had refused at turn 29?"

**RNG caveat.** The session PRNG is seeded once at startup and its position is
deliberately **not persisted** (REQ-050c, `holonovel/src/core/rng.ts:44-56`). A snapshot
records the seed and the session draw count for provenance. Exact draw replay is a
separate increment:

- add `getState()`/`setState()` to `Rng`, or fast-forward by `session_draws`;
- persist the position in the snapshot;
- label the replay `exact: true` only when the engine can reproduce the stream;
- keep restart determinism unchanged: a snapshot restore is explicit, not a restart.

Until then, a snapshot advertises `rng.exact: false` and the CLI prints "state replay,
not draw replay."

---

## 8. Audience, privacy, licensing

A snapshot can contain GM-only minds, secrets, and notes. It carries an `audience`:

| Audience | Content | Who can read | Shareable |
|---|---|---|---|
| `gm` | Full state, including minds and secrets | GM/Editor | Only after `--redact` |
| `player` | `redactNovelForPlayer` projection | Player and above | Yes, with a content note |
| `shared` | Player projection plus license and attribution | Anyone | Yes |

`redactNovelForPlayer` already strips `PLAYER_OMITTED_KEYS`, NPC `mind`/`memory`, GM
lore, GM notes, and other entities' subjective memory
(`holonovel/src/index.ts:10359-10400`). Reuse it; do not write a second redactor.

Sharing reuses `shareLicenseRefusal` (`holonovel/src/index.ts:10226`) and the artifact
licensing field. A snapshot with `audience: gm` refuses `export --share` without an
explicit `--redact`, which writes a derived player snapshot.

---

## 9. CLI and MCP

### CLI

```
holonovel codex snapshot create --novel <slug> --label <label>
    [--audience gm|player] [--tag <tag>]... [--lean] [--inline]
holonovel codex snapshot list [--novel <slug>] [--audience <a>] [--tag <t>]
holonovel codex snapshot get <id> [--payload]
holonovel codex snapshot diff <a> <b> [--state|--transcript|--all] [--json]
holonovel codex snapshot restore <id> --as <new-slug>
holonovel codex snapshot restore <id> --into <slug> --yes
holonovel codex snapshot export <id> --out <file> [--redact]
holonovel codex snapshot import <file>
holonovel codex snapshot delete <id> [--prune-blob]
```

### MCP

Add actions to `manage_codex` rather than a new tool, to protect the 37-tool budget
(REQ-429):

`snapshot_create`, `snapshot_list`, `snapshot_get`, `snapshot_diff`, `snapshot_restore`,
`snapshot_export`, `snapshot_import`, `snapshot_delete`.

The CLI is primary for bulk capture, diff, and export; MCP is primary for the AI to
capture before a risky scene and restore on request.

---

## 10. Use cases

- **Save a moment** before a scene the player might regret.
- **Branch a what-if**: restore and choose differently.
- **Capture a bug**: snapshot plus transcript is a reproducible report.
- **Share a scene** with a friend as a player-safe moment.
- **Use a snapshot as a fixture**: a known state for a regression test.
- **Compare two runs** of the same scenario.
- **Teach by example**: a well-built scene captured as a reusable starting point.
- **Audit a repair**: did the fix change state or only prose?

---

## 11. Non-goals

- Replacing checkpoints. A checkpoint stays the in-Novel restore point.
- An event-sourced replay engine that re-executes every tool call.
- Cloud sync or multi-user hosting.
- A save-scumming UI. Snapshots are explicit, labelled, and audited.
- Storing copyrighted source text. A snapshot stores state and summaries, not the module
  text.

---

## 12. Increments

| ID | Increment | Depends on | Done bar |
|---|---|---|---|
| S1 | Envelope, capture, state hash, audience, provenance | A5, B9 | A snapshot captures a Novel; the hash verifies; the audience is recorded |
| S2 | Sidecar storage, dedupe, retention, index | S1 | Two labels with the same state share one blob; delete is safe |
| S3 | Restore as new and in place, with confirmation and provenance | S2 | A snapshot restores into a fresh Novel and into an existing one; logs survive the in-place restore |
| S4 | Diff by path, human and JSON | S3 | Two snapshots diff by state path; the output names added/removed/changed |
| S5 | Transcript replay (read-only) | S3 | A recorded run plays back without a model call |
| S6 | Share, export, import, redaction, licensing | S3 | A GM snapshot refuses to share until redacted; a player snapshot imports cleanly |
| S7 | CLI and MCP verbs | S3 | Every verb has `--help`, `--json`, and a parity test |
| S8 | Exact RNG draw replay (optional) | S5 | A restored snapshot reproduces the same session draw stream, or the limitation is stated |

S1–S3 are the core. S4–S7 make it usable. S8 is a research increment.

Sequencing: after A3/A4/B9 (codex parity) and E1 (the Nemes proof). Snapshot mode is a
codex capability; it should not land before the codex can carry a full bundle.

---

## 13. Remaining questions

The six design decisions are recorded at the top of this document. These do not block
S1; each can be settled during the increment that needs it.

1. **Ownership.** Does a snapshot belong to a Novel, the codex, or both? The proposal is
   a codex entry with `source.novel_slug`; it outlives the Novel.
2. **Canon interaction.** A snapshot is frozen evidence, not canon. It never overrides a
   canon source; it records what was true at a moment. Confirm that a document-canon
   project can cite a snapshot as evidence without promoting it.
3. **Inline size budget.** An `--inline` snapshot counts against `codex.json`; what is
   the cap before the CLI refuses and recommends a sidecar?
4. **Exact RNG replay design.** S8 needs `getState`/`setState` or a fast-forward count.
   The open question is whether to expose the position or only a draw count.
5. **Share default.** A player snapshot may be shared; does it require a content note
   and a license field before export, or is a warning enough?

---

## 14. Evidence anchors

- Checkpoint capture and restore: `holonovel/src/index.ts:11000-11060`.
- Restore dispatch and `applyNovelState(..., "undo")`: `holonovel/src/index.ts:4648-4664`.
- Interchange export/import: `holonovel/src/core/state.ts:3595-3605`.
- State-copy policy: `holonovel/src/core/state.ts:3610-3655`.
- State hash and projection: `holonovel/src/core/state-hash.ts:32,64`.
- Player redaction: `holonovel/src/index.ts:10359-10400`.
- Share licensing: `holonovel/src/index.ts:10226`.
- Session RNG and the no-persist rule: `holonovel/src/core/rng.ts:44-56`.
- Codex store and kinds: `holonovel/src/index.ts:14044-14120`.
- Codex materialization: `holonovel/src/index.ts:13840-13930`.
