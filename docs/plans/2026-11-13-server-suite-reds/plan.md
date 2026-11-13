# Plan — clear the pre-existing server-suite reds (ROADMAP P1)

**Session:** 2026-11-13 · **Tree:** clean at `6e65c37` · **Baseline:** `npm run check:fast` 41/41 PASS

## Why this item, not §5.6

ROADMAP.md lists `§5.6 clock and combat-report remediation (P1)` first, but that
section is explicitly blocked: T161 needs the damage-resolution surface from
`REQ-124 NPC damage resolution`, and no `roll_weapon_damage` handler exists
(grep over `holonovel/src` returns nothing). The first actionable item is
`Pre-existing server-suite reds (P1)`, which is also the correct dependency
order: every later citation-repair and coverage item is measured against a
harness suite that is currently red, and AGENTS.md requires a red baseline to
be fixed as its own change before feature work.

## Evidence (re-observed in this session at `6e65c37`)

`npm run status`: 67 unpushed commits, 12 open roadmap items, last publish
2026-11-09. `npm run check:fast`: 41 passed, 0 failed. `git status`: clean.
`npm --prefix holonovel run test:all`: **49 passed, 7 failed** (164.8 s). The
seven failing suites are the two named below plus the five Holosuite tiers;
the per-suite numbers in the table were each produced by a direct run in this
session, not copied from ROADMAP.md (whose counts match because that entry was
written from the parent commit `26cf82c`, whose suite state is unchanged).

| Suite | Result at `6e65c37` | Failing rows / findings |
|---|---|---|
| `test:fingerprints` | 11 passed, 5 failed | T460, T501, T503, T774, T775 |
| `test:identity` | 25 passed, 1 failed | T772 |
| holosuite `conformance` | 45 passed, 5 findings | 5 × `predicate_unresolved` |
| holosuite `invariants` | 25 passed, 6 findings | 6 × `predicate_unresolved` |
| holosuite `adversarial` | 26 passed, 7 findings | 7 × `predicate_unresolved` |
| holosuite `differential` | 3 passed, 2 findings | 2 × `predicate_unresolved` |
| holosuite `novel` | 99 passed, 8 findings | 7 × `predicate_unresolved` + `restart_state_stable` |

Every Holosuite tier boots a live server and passes its behavioural
assertions; no tier reports a product-behaviour failure beyond the restart
hash below.

### Root cause A — the load-time format-migration save ignores `TTRPG_AUTO_MIGRATE`

Predicate: `holonovel/src/core/state.ts:1696` —
`if (migrated && !this.restoredThisSession.has(key)) this.saveNovel(novel);`.
A v1 Novel (`novel_format_version` absent) always reports `migrated: true`
(`state.ts:1842-1849, 1876`), so hydration rewrites the file on every boot even
when the harness sets `TTRPG_AUTO_MIGRATE=off` (`test-fingerprints.ts:80`).
That write stamps `data_format` (`state.ts:2883`) and clears the artifact's
advisory (`state.ts:2927-2928`), which produces each of the five failures:

- T460 (`test-fingerprints.ts:267`) — the Novel body changes across a restart,
  violating REQ-393's byte-for-byte preservation.
- T501 (`:290`), T503 (`:302`), T775 (`:581`) — the `[data-stale]` flag and its
  `stale_detail` are gone before health is read (REQ-423, REQ-652).
- T774 (`:571`) — with `TTRPG_AUTO_MIGRATE=off` the file is still re-stamped
  (REQ-651 disables startup reconciliation when the switch is off).

The naive repair (skip `migrateNovelFormat` when the switch is off) has a data
hazard that shapes Change A: a v1 Novel loaded without adoption keeps an empty
`audit_log`, the next ordinary save stamps `novel_format_version = 2`
(`state.ts:2886`), and every later load short-circuits at `state.ts:1849`, so
the `.audit.jsonl` sidecar is orphaned and its history never reaches the Novel.

### Root cause B — 27 stale evidence anchors

Each finding names a predicate of the form `<path>:<line>#<symbol>` whose line
no longer contains the symbol after code motion. Repeated offenders:
`state.ts:2527#saveNovel` (3 tiers) and `parser.ts:30#dispatchCommand` (2).
`index.ts:9945` carries three distinct symbols across five findings
(`#context_report` twice, `#recap` twice, `#visibility_check` once). Per tier:

- conformance: `index.ts` `#TOOL_ANNOTATIONS` (now `:189`), `#registerResource`,
  `#prompt`, `#surfaceProfile`, `#err`
- invariants: `index.ts` `#replayInspection`, `#context_report`,
  `#manage_history`, `#pacingSessions`; `world/parser.ts` `#dispatchCommand`;
  `core/state.ts` `#saveNovel`
- adversarial: `index.ts` `#inboxSourcePath` (now `:13630`), `#share`,
  `#recap`, `#strictMode` (now `:12902`), `#create_room`, `#verify`;
  `world/parser.ts` `#dispatchCommand`
- differential: `world/model.ts` `#rooms`; `core/state.ts` `#saveNovel`
- novel: `world/parser.ts` `#door`; `index.ts` `#context_report`, `#recap`,
  `#knowledge_query`, `#visibility_check`, `#computeBundleIntegrity`;
  `core/state.ts` `#saveNovel`

### Root cause C — the restart hash includes a per-process counter

`holosuite-novel.ts:438` compares `contentHash(readPersistedNovel(...))` before
and after a restart; `contentHash` already strips `_checksum`
(`holosuite-novel.ts:90-93`). The `changed: _checksum,connection_counter`
detail comes from the diagnostic key list at `:443`, which uses raw
`projectState` and so also reports `_checksum`. The real delta is
`connection_counter` alone: REQ-173a increments it once per Novel per process
(`state.ts:1456-1465`), which is session bookkeeping and therefore belongs in
the `STATE_HASH_EXCLUDED_KEYS` list (`core/state-hash.ts:13-22`; the version
constant is at `:27`) that REQ-601
defines as "session and wall-clock bookkeeping".

### Root cause D — T772 compares a record whose bookkeeping a briefing mutates

`test-identity.ts:405` takes the first GM `get`, `:408` renders the first GM
briefing, `:419` compares a later GM `get` with the first. A briefing is a
mutating render (`index.ts:17251` passes `mutate: true`; `index.ts:17219` saves
Novel state) and records the NPC's first appearance (`index.ts:16776` →
`recordNpcAppearance`, `index.ts:4567-4582`), so the second read legitimately
differs. A throwaway probe (written for this plan, then deleted) diffed the two
payloads; the observed differing keys were exactly `appearance_scenes`,
`appearance_count`, `first_seen`, `last_seen`, `appearance_sessions` — no
identity field differed. REQ-075c requires the
briefing to maintain those counters; REQ-649 requires two reads at one identity
version to agree.

## Changes

**A — gate the load-time migration on the auto-migrate switch, without losing
the audit sidecar** (`M`)
`holonovel/src/core/state.ts`:
1. Export a module-level `autoMigrateEnabled()` (`(process.env.TTRPG_AUTO_MIGRATE ?? "on") !== "off"`)
   and use it here; `holonovel/src/index.ts:137` already inlines the same
   predicate, so replace that inline check with the import (one switch, one
   definition).
2. `migrateNovelFormat` (`:1841`) never unlinks the sidecar inline (`:1864`).
   It always adopts and verifies the sidecar in memory, sets the in-memory
   version (`:1876`), and records the sidecar path in a new
   `pendingAuditSidecars` **set** of sidecar paths, not a slug-keyed map (the
   duplicate-slug guard at `:1680-1689` can discard a Novel after its migration
   ran, so a slug key could unlink the skipped copy's file while the canonical
   Novel's entry is overwritten).
3. `loadAllNovels`'s load-time save (`:1696`) gains the switch: today it is
   gated only on `migrated`/`restoredThisSession`, and `TTRPG_AUTO_MIGRATE`
   appears nowhere in `state.ts`. This is the gate the change adds.
4. `saveNovel` (`:2861-2929`), after the successful `renameSync` (`:2924`),
   derives the same sidecar path from the `filePath` it just wrote, unlinks
   that key when present (inside `try`, with a comment: the adopted log is
   already in the primary) and deletes the entry either way.

There is one ordering, not two: the unlink always follows a successful primary
write, whether that write is the load-time save (switch on) or the first
ordinary save (switch off). With the switch on the load-time `saveNovel` fires
inside the same hydration pass, so `test-persistence-guardrails`
T77/REQ-092f (`:536-541`, sidecar deletion after adoption) still passes. With
the switch off, boot writes nothing and the file stays byte-identical; the
first real save persists the adopted audit log and version 2, then removes the
sidecar. No path deletes a sidecar whose log is not already in the primary.

**B — exclude `connection_counter` from the state hash** (`S`)
`holonovel/src/core/state-hash.ts`: add `connection_counter` to
`STATE_HASH_EXCLUDED_KEYS`, bump `STATE_HASH_PROJECTION_VERSION` 2 → 3, and
extend the comment (REQ-173a bumps it per process; it is session bookkeeping
under REQ-601, not story state). `_checksum` is *not* added — `contentHash`
already strips it and the projection excludes nothing self-referential in the
current design.
`holonovel/scripts/lib/holosuite-novel.ts:441-444`: build the `changed:` key
list from the same projection `contentHash` uses (drop `projectState` there),
so a future failure reports only keys the hash actually covers. `holonovel/scripts/test-persistence.ts:771,776-777`: update the pinned
`projection: v2`, the `state_hash_projection !== 2` assertion, and the stale
`projection v2` text in its failure message to the current version. Before
commit 2, sweep `grep -rn 'projection: v2\|state_hash_projection.*2' holonovel`
for any other literal pin and update it in the same commit. `holonovel/DECISIONS.md`: record the interpretation in one line —
REQ-601's "session and wall-clock bookkeeping" covers `connection_counter`
under REQ-173a's per-process increment — so the exclusion is a recorded
decision rather than an implicit one. No `spec/02-requirements.md` body changes:
the REQ already defines the exclusion *class*, and REQ-419 would classify a
body edit as a non-patch delta.

**C — repoint the 27 anchors by symbol** (`M`; conformance 5, invariants 6,
adversarial 7, differential 2, novel 7)
For each finding, locate the **definition or dispatch site** of the symbol, not
a call site or a prose mention, and update the `anchor(path, line, symbol)` call
in `holonovel/scripts/lib/holosuite-{conformance,invariants,adversarial,differential,novel}.ts`.
Most symbols are ambiguous as raw text: `#saveNovel` matches every caller, `#err`
matches every `return err(...)`, and `#create_room` / `#recap` / `#share` /
`#verify` match tool-description prose. The target is `function <symbol>`,
`const <symbol> =`, `private <symbol>(`, a `case "<symbol>":` arm, or the object
field declaration. Record each ambiguous choice in the review register so a
later read can tell intent from a lucky match.

**D — compare the identity block, not the whole record** (`S`)
`holonovel/scripts/test-identity.ts:419`: replace the whole-record comparison
with, in order, `assert(gmGet.identity && again.identity, "identity block
missing")` (so the comparison cannot pass vacuously),
`assert(typeof gmGet.identity.version === "number")`, and
`assert(canonicalJson(again.identity) === canonicalJson(gmGet.identity))` —
add `import { canonicalJson } from "../src/core/state-hash.js";` (the same
import `holosuite-novel.ts:21` uses; there is a second, unrelated `canonicalJson`
in `scripts/lib/eval-schema.ts:79`), which removes key-order sensitivity. The
payload's `version` key comes from `npcIdentitySummary` (`index.ts:5096`; key
returned at `:5104`) and is inside the compared block. Keep the existing
Player-redaction assertions (`:413-416`). Add a comment: REQ-075c makes appearance bookkeeping mutable by
design, so whole-record equality is not REQ-649's claim; the identity summary
at one version is. This is immune to any intervening bookkeeping write, unlike
reordering the snapshots.

**E — bookkeeping** (`S`)
`ROADMAP.md`: remove the `Pre-existing server-suite reds (P1)` section (the
roadmap header comment says shipped work moves to CHANGELOG.md; `check-roadmap`
then sees only scheduled items). `spec/audit/review-register.md`:
`Scheduled-roadmap` rows this closes get their evidence line updated; any new
finding from step 0 is added with a P0–P3 disposition.
`CHANGELOG.md`: bullets under the 2026-11-13 heading.
`docs/plans/2026-11-13-server-suite-reds/`: plan, tasks, AAR
(`check-loop-artifacts` requires all three plus a LOOP token).

## Blast radius

| File | Change | Size | Rollback |
|---|---|---|---|
| `holonovel/src/core/state.ts` | shared switch, gated load-time save, deferred sidecar flush | M | 1 |
| `holonovel/src/index.ts` | reuse the exported switch at `:137` | S | 1 |
| `holonovel/src/core/state-hash.ts` | exclusion + projection bump | S | 1 |
| `holonovel/scripts/test-persistence.ts` | T712 projection pin 2 → 3 | S | 1 |
| `holonovel/scripts/lib/holosuite-conformance.ts` | 5 anchors | M | 1 |
| `holonovel/scripts/lib/holosuite-invariants.ts` | 6 anchors | M | 1 |
| `holonovel/scripts/lib/holosuite-adversarial.ts` | 7 anchors | M | 1 |
| `holonovel/scripts/lib/holosuite-differential.ts` | 2 anchors | M | 1 |
| `holonovel/scripts/lib/holosuite-novel.ts` | 7 anchors + `changed:` diagnostic | M | 1 |
| `holonovel/scripts/test-identity.ts` | T772 identity-block comparison | S | 1 |
| `ROADMAP.md`, `spec/audit/review-register.md` | bookkeeping | S | 1 |
| `holonovel/DECISIONS.md` | REQ-601 interpretation | S | 1 |
| `CHANGELOG.md` | bullets, one per behaviour commit | S | 1 |
| `docs/plans/2026-11-13-server-suite-reds/` | plan/tasks/AAR | S | 0 |

Legend: Size `S` ≤ ~30 changed lines, `M` ~30–120. Rollback `0` = pure add,
`1` = reversible edit.

No `spec/02-requirements.md` change, so no fingerprint regeneration or
publication-gate consequence follows; `assemble` still runs as the standard
pre-commit gate and produces no delta. Rollback cost for the increment: 1
(code); the projection bump is one-way data noise (see Risks).

## Alternatives considered

- **A: skip migration entirely when the switch is off.** Orphans the audit
  sidecar on the next save (loss path above). Rejected.
- **A: gate only the save, keep the sidecar unlink.** Loses the adopted entries
  if the process exits before the next write. Rejected.
- **A: persist the migration but preserve the stale flag.** Contradicts REQ-652
  (a successful write clears the flag) and still rewrites the file, so T460
  fails. Rejected.
- **A: move the migration to first activation.** Delays REQ-092f adoption past
  the startup health surface the harness reads. Rejected.
- **B: re-pin the restart hash.** The delta is by contract, so a pin encodes
  the wrong projection. Rejected.
- **B: amend REQ-601's body.** A REQ-body edit classifies non-patch and drags
  in the publication gate for a one-key exclusion already covered by the
  "session bookkeeping" clause. Rejected in favour of the DECISIONS.md record.
- **C: add the `--fix-anchors` mode now** (ROADMAP P2 item). Out of scope: that
  item's trigger is a code edit that drifts a predicate; this session repairs
  existing drift.
- **D: drop `appearance_*` from the `get` payload.** Changes a documented read
  surface to satisfy a harness. Rejected.

## Commit order and gates

Non-spec session, split by concern, docs last (AGENTS.md). CHANGELOG bullets
are added in each commit that changes behaviour, so no commit leaves the file
stale.

0. Step 0 was executed before this plan was drafted: the `test:all` run above is
   the recorded red set and the evidence table. Any red outside the four causes
   is re-read at its predicate and triaged P0–P3 (P0 fixed in-session, P1
   scheduled on ROADMAP.md with a trigger, P2/P3 recorded in the review
   register).

1. `server: honor TTRPG_AUTO_MIGRATE on load-time Novel migration` — state.ts,
   index.ts, CHANGELOG. Gates: `test:fingerprints` (16/0),
   `test:persistence-guardrails` (T77 sidecar adoption),
   `test:persistence` (save path), `typecheck`.
2. `server+harness: make the holosuite tiers green` — state-hash.ts, the five
   tier libs, holosuite-novel.ts diagnostic, test-persistence.ts pin,
   DECISIONS.md, CHANGELOG. The two holosuite causes ship together because no
   intermediate tree is green: `holosuite.ts:325-327` exits 1 on any finding
   and `--tier` has no row filter, so the novel tier cannot pass until both the
   anchors and the restart hash are fixed. Gates: the five tier scripts (all
   exit 0), `test:persistence`, `test:fingerprints`, `typecheck`.
3. `harness: compare the identity block in the T772 read-stability check` —
   test-identity.ts, CHANGELOG. Gate: `test:identity` (26/0).
4. `docs: close the server-suite reds roadmap section` — ROADMAP, review
   register (including each ambiguous anchor choice), `docs/plans/…`;
   `npm run assemble && npm run check:fast`.

`assemble` is run even though no spec source changes: it is the standard
pre-commit gate and rewrites `holonovel.md` identically; it is not a claim that
a spec delta exists.

## Verification / done bar

Done when:

1. `npm --prefix holonovel run test:fingerprints` → 16 passed, 0 failed.
2. `npm --prefix holonovel run test:identity` → 26 passed, 0 failed.
3. The five tier scripts — `test:holosuite-conformance`,
   `test:holosuite-invariants`, `test:holosuite-novel`,
   `test:holosuite-adversarial`, `test:holosuite-differential` (not the
   `evidence` or `mutation` scripts) — each exit 0; no tier reports a
   `predicate_unresolved` finding, and the novel tier's
   `restart_state_stable` row passes.
4. `npm --prefix holonovel run test:all` exits 0.
5. `npm run assemble && npm run check:fast` → `check:fast: PASS` (captured
   un-piped; it includes `check-registers`, `check-roadmap`, and
   `check-fingerprint-sync`).
6. ROADMAP.md no longer carries the reds section.
7. `docs/plans/2026-11-13-server-suite-reds/` holds plan, tasks, AAR with a
   LOOP terminal token.

## Risks and mitigations

- **Anchor repoint lands on a wrong-but-matching line.** Prefer the definition
  or dispatch arm; the tier run is the proof — a wrong line fails resolution
  again.
- **The exclusion narrows the verify surface.** `connection_counter` stays in
  the persisted Novel and on `novel://current`, but `manage_diagnostics
  (action: verify)` no longer covers it. That is the point — it is session
  bookkeeping, not story state — and the DECISIONS.md line records it.
- **A residual `changed: _checksum` in the novel tier's failure text.** Commit 2
  makes the diagnostic use the same projection as the hash, so a future failure
  names only real story-state drift.
- **Projection bump reclassifies existing recorded hashes.** REQ-602 says an
  older-projection hash is reported as historical, so `verify` stays clean;
  confirm that row before commit 2. On a code revert the rewritten digests
  become newer than the reverted projection and read as stale — data-side noise,
  not loss.
- **Sidecar flush ordering.** The sidecar is unlinked only after the primary
  rename succeeds; a failed unlink leaves an orphan file but never loses the
  log.
- **Auto-migrate gate changes behaviour for users who set the switch off.** That
  is the documented meaning of the switch (REQ-651); a v1 Novel now migrates on
  its next write rather than at boot. State it in the CHANGELOG bullet.
- **`test:all` reds outside the roadmap's list.** Step 0 already enumerated them
  (49 passed, 7 failed); the triage rule keeps the bar honest.
