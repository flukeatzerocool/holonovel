# The Holonovel Engine Contract

<!-- Non-normative design note. The normative contract is §5 of the
     specification. This note records the shape the engine must preserve while
     E3 introduces the tool registry, adapter seam, and createEngine(). Stable
     clauses are promoted to REQs only after E3 proves that shape. -->

**Status.** Non-normative. Descriptive of the reference implementation and the
requirements it satisfies, not a source of new obligations. The divergences
found by the E2 review were closed in the 2026-10-29 remediation increment;
§9 records the closure.

**Scope.** Six engine concerns: state authority, turn semantics, determinism and
replay, the event stream, the save format, and the adapter boundary.

**Out of scope.** Resources, prompts, and user interfaces are not part of the
engine core. They are read or presentation surfaces over engine state; the
adapter may offer them, but the engine does not depend on them (see
[Adapter boundary](#adapter-boundary)).

---

## 1. Vocabulary

| Term | Meaning in this note |
| --- | --- |
| **Engine** | The validated execution core that owns canonical state, resolves rules, and records what happened. |
| **Adapter** | A transport- or interface-specific wrapper over the engine. The MCP server is the reference adapter. |
| **Novel** | The portable program and save file: a self-contained record of a world and its history. |
| **Narrator** | The AI persona that proposes intents and renders prose. It never mutates state directly. |
| **Turn** | One intent → resolution → recorded-outcome unit, independent of how many MCP requests carry it. |

## 2. State authority

The engine, not the narrator, owns canonical state. Standing Rule 6 is the
constitutional statement: LLMs propose intentions; the engine validates and
executes. Story-state mutation is therefore expected to arrive through a
registered tool, be validated against its schema and the active badge, and be
recorded before the response returns (Standing Rules 4–6; REQ-032, REQ-054). The
prompt exception below is the one observed departure from that rule.

Three consequences follow.

1. **Tools are the story-state writer.** Registered tool handlers are the
   mutation surface for story state, and the pacing counter advances once per
   completed tool call. One adapter render may commit a defined engine
   transition: `badge_briefing` triggers at most one pacing-autonomy cycle when
   the window is exceeded (REQ-351a).
2. **Badge scope is engine state.** The active badge is Novel-scoped, and each
   connection carries one active badge at a time (REQ-030). Enforcement lives in
   the engine helpers, not in the adapter's good manners. Forbidden calls reach
   the boundary audit whether a handler throws the error or returns it
   (REQ-040a, REQ-133a).
3. **Build state is process-local; some administrative state persists beside
   the Novel.** The engine keeps no build state between calls, but the
   `StateManager` also writes `roster.json`, `codex.json`, `server-notes.json`,
   and `build-fingerprint.json` in the state directory
   (`holonovel/src/core/state.ts:865-875,2315-2435`). Those surfaces are
   server- or roster-scoped, not Novel-scoped. Today the reference
   implementation constructs a module-level `StateManager` and a single MCP
   server, so one process hosts one engine instance
   (`holonovel/src/index.ts`; `holonovel/src/core/server.ts` holds the
   initialized instance).

Proposals submitted through the causal transition surface pass an admission
check before they touch state. When a proposal is refused, the refusal is
recorded in the transition ledger and canonical state is unchanged. This keeps
one scope from overwriting another's deterministic state (REQ-484–REQ-491,
REQ-488). Other mutating tools apply their own validation; the shared property is
that no path writes outside the engine.

## 3. Turn semantics

A turn is a semantic unit, not a request boundary. The reference adapter exposes
composite actions for session open, turn resolution, and session close
(REQ-577); their state effects are deterministic. A turn resolves intent,
suggests next actions, and mints a single-use turn handle; the story-record
action consumes that handle when the outcome is committed (REQ-574).

The reference implementation's `take_turn` is deliberately read-only: it runs
the parser's resolve and suggest paths and mints a session-scoped handle, but it
persists nothing (`holonovel/src/index.ts`, `take_turn`). The handle is bounded,
never persisted, and recording without a handle still works. The token itself is
opaque and non-deterministic (`crypto.randomUUID`); the state effects of a turn
are deterministic, the capability token is not. Replaying a consumed or unknown
handle refuses with `[STATE_CONFLICT]` and names the turn action (REQ-574).

Session boundaries are recorded markers, not wall-clock divisions (REQ-237).
The pacing counter advances once per completed tool call in the tool-registry
wrapper, so a turn's effects do not depend on how long an operator thinks
between requests (REQ-336). `badge_briefing` renders the signal and commits at
most one pacing-autonomy cycle when the window is exceeded (REQ-351a, REQ-351b).

## 4. Determinism and replay

Randomness is deterministic and seedable (Standing Rule 2; REQ-050). All draws
come from one PRNG seeded by `TTRPG_SEED`, defaulting to `0`. A per-call seed
uses an isolated draw that does not advance the session position, so an override
cannot perturb later session-seeded results (REQ-050b). The session position is
intentionally not persisted, which makes two restarts without an explicit seed
produce identical event sequences (REQ-050c; `holonovel/src/core/rng.ts`). The
engine logs the active seed at startup so determinism is observable. REQ-055
states that the session PRNG position is intentionally not persisted, so the
durability and restart-determinism contracts agree.

Determinism is not a claim about narrative prose. The narrator's wording is not
reproducible and is not part of the state contract. Determinism covers the
engine's decisions: dice, ordering, derived records, and state transitions.

Replay rests on three artifacts.

1. **Canonical state hash.** SHA-256 over a sorted-key canonical JSON projection
   of persisted Novel state, excluding audit log, audit archive, undo/redo
   stacks, checkpoints, metadata, the event log, and session/wall-clock
   bookkeeping (`active_session_id`, `last_mutation_at`) (REQ-601). The
   projection carries a version; a digest recorded under an older projection is
   reported stale rather than clean or divergent (REQ-603).
2. **Per-event hash.** Each new observation records the state hash committed by
   that mutation, computed after derived perception records; legacy entries
   report as unhashed rather than fabricated (REQ-602).
3. **Divergence checks.** Verification compares live state against the digest
   recorded at the last save and each checkpoint against its recorded digest
   (REQ-603; `holonovel/src/index.ts:8045-8083`).

Replay inspection returns the retained events through a target ordinal, the hash
recorded there, and the nearest checkpoint at or below it (REQ-604). The target
defaults to the newest retained event. A target below the retention horizon is
reported as evicted, never reconstructed by guesswork. Verification and replay
are read-only Game Master operations: they neither mutate state nor advance the
log, and repeated calls on unchanged state return identical reports (REQ-605).

The golden-transcript workflow (G2) is the external witness: the same fixture
and seed must reproduce the same interaction sequence across builds
(specification §8, G2).

## 5. The event stream

The engine distinguishes four records that are easy to conflate.

| Record | Answers | Contract |
| --- | --- | --- |
| **Event log** | What entered play? | Novel-scoped, append-only, deterministic ordinal, source classification, timestamp, committed state hash (REQ-455–REQ-460; REQ-602). |
| **Audit log** | Which tool ran, under which badge, with what arguments? | Hash-chained operational record; forbidden calls included when they throw through the audit wrapper (REQ-040a, REQ-133; gap in §9). |
| **Story journal** | What did the story remember? | Typed narrative memories, mutable only where the type allows (REQ-246). |
| **Perception ledger** | What did an entity observe? | Append-only observed-not-believed record per entity (REQ-540). |

The event-stream contract itself is narrow. An entry carries an ordinal that is
monotonic within the Novel and independent of wall-clock time; replaying the same
inputs reproduces the same ordinals (REQ-455). Later processing never rewrites
an entry. A correction appends a replacement and marks the prior entry
superseded, retaining the original and linking the alternative (REQ-457). The log
is bounded by a configured cap; eviction drops the oldest entries while
preserving the append-only contract for everything still retained (REQ-455;
`holonovel/src/core/event-log.ts`).

Source classification separates player, game master, system, and machine
origins. This is what lets downstream layers reconcile belief from evidence
without privileging narration (REQ-461–REQ-469). Branching slices the log
through a branch point: a child Novel's first K entries match its parent, and the
parent is untouched (REQ-458).

## 6. The save format

The Novel is the portable program. On disk it is one self-contained JSON file at
`<DATA_DIR>/novels/<slug>.json`, carrying the Novel-tier state, the audit log,
the story journal, metadata, and undo snapshot stacks (REQ-092a). Server-tier
and roster-tier records live in sibling files (`roster.json`, `codex.json`,
`server-notes.json`, `build-fingerprint.json`) and are not scopes of the Novel
payload. The serializer carries every declared Novel field, including
`active_session_id`, `pending_vow_countdown_suggestion`, and `codex_sources`.

The write path is conservative by design.

- **Atomic primary.** The engine writes a temporary file and renames it, so a
  crash cannot leave a half-written primary (REQ-092a).
- **Rotating backups.** `<slug>.json.bak.1..N` retains previous good files
  (REQ-238). The implementation also accepts a legacy singular `.bak` as the
  index-1 candidate (`holonovel/src/core/state.ts:2189-2194`); the REQ text
  names only the rotated chain.
- **Checksum.** The payload carries a checksum over the serialized state
  excluding itself; a mismatch follows the same recovery path as structural
  corruption (REQ-092d).
- **Format version.** `novel_format_version` gates migration. Older versions
  migrate gracefully with absent fields defaulted. Unknown fields survive
  load-and-save — nested values in place and top-level keys as inert data — so a
  future version loads with a warning rather than losing data (REQ-092e,
  REQ-092g).
- **Committed digest.** `metadata.state_hash` records the canonical digest of the
  last committed save and its projection version; verification compares it
  against live state and reports an older projection as stale (REQ-603).
  Loading a pre-version-2 Novel re-derives the last-save and checkpoint digests;
  historical event hashes are never recomputed (REQ-602).
- **Optional compression.** `TTRPG_NOVEL_COMPRESS` gzips the on-disk payload;
  backups follow the primary's setting, and a mismatch on load warns
  (REQ-092g, REQ-092h1).

Export is a different contract from the on-disk save. The interchange payload is
always uncompressed JSON or Markdown (REQ-096, Appendix Q), and the serialized
tier set round-trips through `exportNovelJSON` / `importNovelJSON`. The
tool-level export and import each append an audit entry
(`holonovel/src/index.ts:9026,9190`), so a tool-level export → import → export is
not byte-identical even though the state tiers round-trip. Scopes select tiers;
the player scope redacts GM-only fields (REQ-096b, REQ-096k).

## 7. Adapter boundary

The engine core owns state, validation, rules resolution, derived records, and
the event/audit trail. An adapter owns only the translation between an interface
and those engine operations.

The reference MCP adapter translates tool calls, resource reads, and prompt
requests. Two rules keep that seam honest:

1. **Tools are the mutation surface.** MCP resources are read-only projections.
   Prompt composition is read-only except where it invokes a defined engine
   transition: `badge_briefing` may commit one pacing-autonomy cycle
   (REQ-351a). Badge-filtered `tools/list`, resource discovery, and prompt
   composition may vary by adapter; they must not otherwise redefine engine
   state (REQ-031a, REQ-032a).
2. **Library and executable entries differ.** Importing the package root loads
   the library that exposes `core` and `world` namespaces; the executable entry
   starts the server. The library does not start a transport, though it is not
   wholly effect-free: importing it evaluates the RNG module, which logs the
   seed to stderr, and reads `package.json` (`holonovel/src/library.ts`;
   `holonovel/src/core/rng.ts:45-47`; `holonovel/package.json` exports). The
   split is a packaging contract, not a REQ-614 clause.

The engine makes no outbound network calls at runtime (Standing Rule 3;
REQ-051), and it assumes nothing about transport beyond what the adapter
supplies. The current reference implementation hosts one engine per process;
per-engine state injection and N engines per process are a later decision (E8),
not part of this contract.

### Explicitly outside the engine core

- **Resources.** URI-addressed reads over state. They are projections, not an
  authority; they neither mutate state nor advance the event log.
- **Prompts.** Composed guidance for a narrator or operator. Prompt text is not
  engine state and does not gate resolution.
- **User interfaces.** Any rendered presentation, chat surface, or dashboard.
  The engine exposes state and results; presentation is an adapter concern.

This exclusion is the portability claim: a headless harness, an in-process
façade, or a different transport can drive the same engine without
reimplementing resources, prompts, or UI.

## 8. What E3 must preserve

E3 introduces one tool registry as the definition site, MCP as one adapter, an
in-process façade, and a parity harness. This note fixes the invariants that
change must preserve:

- canonical-state writes originate in the engine, adapter render paths may
  invoke only a defined engine transition (the pacing cycle), and the engine
  remains the sole authority over that state;
- a turn stays a semantic unit with a single-use handle, not an adapter request;
- determinism, per-event hashes, and replay horizons remain observable through
  the same contracts;
- the event log stays append-only and ordinal-stable;
- the Novel file remains the one portable save format;
- resources, prompts, and UI stay outside the core.

Once E3 demonstrates the façade shape, the stable clauses above are candidates
for promotion to REQs. Until then this note is rationale, not law.

## 9. Divergence status

The six divergences recorded by the E2 review were closed on 2026-10-29:

| Divergence | Closure |
| --- | --- |
| Pacing advanced on briefing renders, not tool calls. | The tool-registry wrapper advances a session counter; `badge_briefing` only renders the signal and commits one autonomy cycle. |
| A prompt incremented the pacing counter. | The counter no longer changes in the prompt; autonomy remains the spec-required engine transition (REQ-351a). |
| Forbidden calls returned (not thrown) skipped the boundary audit. | `withForbiddenAudit` audits either envelope form exactly once. |
| Three declared Novel fields were not serialized. | `novelToJSON` emits `active_session_id`, `pending_vow_countdown_suggestion`, and `codex_sources`. |
| REQ-055 claimed RNG state persisted. | REQ-055 now excludes the session PRNG position and cites REQ-050c. |
| Unknown top-level save keys were dropped. | `novelFromJSON` retains them as inert `future_fields` and `novelToJSON` re-emits them. |

## Appendix: Clause-to-source map

| Clause | Source |
| --- | --- |
| Engine ownership and narrator proposal | Standing Rule 6; REQ-032, REQ-054 |
| Badge scope and forbidden audit | REQ-030, REQ-040a, REQ-133 |
| Composite turn actions | REQ-574, REQ-577 |
| Session boundaries and pacing | REQ-237, REQ-336, REQ-351 |
| Seeded PRNG and isolated per-call draws | REQ-050, REQ-050b, REQ-050c |
| Canonical state hash and verification | REQ-601, REQ-602, REQ-603 |
| Replay inspection | REQ-604, REQ-605 |
| Event log append, supersession, cap, branching | REQ-455–REQ-460 |
| Save format, checksum, backups, migration | REQ-092a–h2, REQ-238 |
| Interchange and export scopes | REQ-096, Appendix Q |
| Adapter and library entries | `holonovel/package.json` exports; `holonovel/src/library.ts` |
| No runtime network | Standing Rule 3; REQ-051 |
