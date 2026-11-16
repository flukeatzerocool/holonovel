# Plan — Release hardening: input contract, release integrity, verification depth

**Date:** 2026-11-16 · **Kind:** planned · **Depth:** standard
**Increment:** `docs/plans/2026-11-16-release-hardening`
**Revision:** 5 — revision 4 plus the P2 generated consequences (G7 attestation and
the build-phase-map content hash) and the T177 amendment outcome.
**Source:** the 2026-11-16 production-readiness assessment (independent MCP
probes against HEAD `64e810f` and the published 2026.11.8). Findings F1–F11 map
to recommendations R1–R10.

## Why

The application is functional and its gates are green at HEAD — `check:fast`
PASS (47 gate lines in the recorded run), `test:all` 56/56, `test:package-smoke`
11/11 — but no gate exercises the missing-parameter path. Evidence:

- **F1 — silent missing-parameter acceptance (R1).** Enumerating every
  `action_enum` value in `holonovel/tool-definitions.json` (241 values) and
  calling each with `{action}` only against a temp data dir: 22 return `[OK]`
  and persist a record keyed `undefined` (`manage_lore/set`,
  `manage_novel/create`, `manage_faction/create`, `manage_countdown/set`,
  `manage_archive/checkpoint_set`, `manage_note/set`, …). The same sweep on the
  published 2026.11.8 build yields 30.
- **F2 — raw exceptions (R1).** Three actions return JS exception text instead
  of a REQ-001 envelope: `run_command/execute` (`reading 'trim'`),
  `manage_context/briefing_order` (`reading 'length'`),
  `manage_adventure/generate` (`reading 'toLowerCase'`). Same on the published
  build.
- **F3 — malformed resource entries (R2).** A phantom lore entry makes
  `resources/list` emit entries with no `name` at three identical projections:
  `holonovel/src/index.ts:15706` (`lore://`), `:16054` (`server-notes://`),
  `:16603` (`ui://lore/`), each mapping `[k] → name: k` where `k` is the JS value
  `undefined`. A schema-validating client rejects the whole listing.
- **F4 — the category is unimplemented (R1).** `[MISSING_PARAM]` is defined
  (`spec/appendices-reference.md:3082`), required by T177 (`:1690`, REQ column
  REQ-002), and emitted nowhere in `holonovel/src`.
- **F5 — false evidence (R4).** `holonovel/scripts/test-backfill.ts:1544` is
  titled "missing param surfaces SDK error" and asserts only the FORBIDDEN
  path; `spec/audit/req-coverage.md:9` credits REQ-002 to T177. T177 has two
  halves — `[AMBIGUOUS]` and `[MISSING_PARAM]` — and `AMBIGUOUS` has exactly one
  occurrence in `src` (`holonovel/src/index.ts:3428`, a corrective-action
  string), never as an emitted category.
- **F6 — misleading release state (R5).** `scripts/status.ts:67-72` prints the
  recorded run's `started` as "last publish". `RunRecord`
  (`scripts/publish/run.ts:46-51`) stores no `dry_run` flag, and a dry run stops
  before `stage` (`:175-178`), so the record cannot distinguish a dry run from a
  partial `--from` run. npm `latest` is 2026.11.8.
- **F7 — undated dependency disposition (R9).** Two moderate `hono` advisories
  arrive transitively through `@modelcontextprotocol/sdk`; the reachable path
  is HTTP form validation, which a stdio-only server never executes.
- **F8 — register defect (R10).** `spec/audit/review-register.md:3103` says
  "the rows below" and no rows follow.
- **F9 — weak mutation sample (R8).** `test:holosuite-mutation` reports catch
  rate 1.0 on 8 mutants.
- **F10 — §10 never run (R6).** No cold-checkout, different-model verifier
  artifact exists.
- **F11 — container unverified locally (R7).** `docker` is installed but the
  daemon is inaccessible in the maintainer's environment.

Two coverage numbers, two predicates, not interchangeable: **122** evidence
linkage findings (`checkReqEvidenceLinkage`: citations whose Appendix F row kind
does not admit them) and **126** bucket-C REQs whose evidence is only shared
(`npm run check:conformance -- --dedicated`).

## Decisions (operator, 2026-11-16)

- **D1.** An unexpected handler throw becomes `[ERROR] [SYSTEM]` with a generic
  message; exception detail goes to stderr only.
- **D2.** Fix the contract with one dispatch-level guard; per-action schema
  tightening is deferred. Recorded in a dated DECISIONS section (not under
  `## Non-goals`, which requires a governing REQ per entry).
- **D3.** Publish after P2, not after P3.
- **D4.** The shared-evidence class becomes a bullet on the existing ROADMAP
  "REQ evidence linkage" item, citing both predicates; no new roadmap entry.

## Done bar

**Done bar:** `check:fast` PASS (including `check-anchors`) and `test:all` green
with a generated battery that sweeps every callable surface — all 241 action
values plus the five action-less tools — and asserts, for each, either
`[ERROR] [MISSING_PARAM]` naming the parameter or a legal `-32602` SDK schema
refusal for a classified surface, and no state mutation **for every refused
surface** (legal no-arg surfaces such as `close_session` may mutate by design,
and are exempt); the state hash before and after the refused-only sweep is
identical; zero raw-exception responses; every
`resources/list` entry carries a string `name`; `status` reports the recorded
run as stopped at its last step and never as a publish; `test:package-smoke`
11/11; publish completes and the tag equals the published CalVer version.

## Non-goals

- Per-action zod discriminated unions (deferred, D2).
- The 126 shared-evidence REQs (ROADMAP, D4).
- Spec text, except the conditional T177 amendment in P2-T6. P1 and P3 add no
  REQ and edit no fingerprint-bearing section. If P2-T6 amends the Appendix F
  row, that is a spec edit and requires `npm run assemble` plus the two
  generated copies (`holonovel.md`, `holonovel/holonovel.md`); otherwise no
  `assemble` delta exists.

---

## P1 — Input contract (R1–R4)

**Approach.** Extend `guardToolCall` (`holonovel/src/index.ts:2030`, invoked at
`:2138`), which already runs before every handler and returns envelopes.
Rejected alternative: a new standalone harness — the adversarial tier already
owns REQ-001/002/054 malformed probes (`holosuite-adversarial.ts:44-47` asserts
only "a recognized envelope", which is why `[OK]`-with-`undefined` passes).

**Table key.** `${toolName}:${action ?? ""}` — a single key covering the
action-discriminated tools and the five action-less ones (`take_turn`,
`set_badge`, `respond_decision`, `open_session`, `close_session`), so no surface
can escape classification.

**Anchor drift.** `check-anchors` is `refresh-predicates --check` and fails on
any line shift. `index.ts` carries 21 `anchor(...)` literals across four
harnesses; 15 sit below the edit points. Reference repair is
`npm run fix-anchors`, run in the same commit as the code edit.

| ID | Task | Files | Verification |
|---|---|---|---|
| P1-T1 | **Red first.** Generated battery in the adversarial tier: sweep all 241 action values (and the five action-less tools) with minimal args; assert `[MISSING_PARAM]` or legal `-32602` for classified surfaces, no state mutation, string-named resources, and that every surface is classified or declared no-arg. | `holonovel/scripts/lib/holosuite-adversarial.ts` | fails on current tree (22 + 3) |
| P1-T2 | `REQUIRED_PARAMS` keyed `${tool}:${action}` → required params + format hints; pure `validateParams` returning a refusal descriptor. | `holonovel/src/core/param-contract.ts` (new) | imported by P1-T1; typecheck |
| P1-T3 | Call `validateParams` inside `guardToolCall`, after retired-alias/telemetry and before badge authorization; host tools only. | `holonovel/src/index.ts` | P1-T1 green for F1/F4 |
| P1-T4 | Wrap both dispatch seams: the MCP handler call (`:2140`) and the façade `call` body (`:18823`+), so `createEngine()` consumers see the same envelope. Unexpected throw → `[ERROR] [SYSTEM]` (D1). | `holonovel/src/index.ts` | F2 sweep returns envelopes |
| P1-T5 | `String(k)` fallback at all three projections: `:15706`, `:16054`, `:16603`. | `holonovel/src/index.ts` | resources assertion in P1-T1 |
| P1-T6 | Repair the anchors introduced by T3–T5. | anchor literals in `holosuite-adversarial.ts`, `holosuite-novel.ts`, `holosuite-invariants.ts`, `holosuite-conformance.ts` | `check-anchors` |
| P1-T7 | Make T177 assert `[ERROR] [MISSING_PARAM]`; the renamed title **keeps `T176/T177/T178`** so the coverage audit keeps its carrier. | `holonovel/scripts/test-backfill.ts:1544` | test:all |
| P1-T8 | Record D1/D2 in a dated DECISIONS section with the table's source of truth; regenerate the coverage register; CHANGELOG entry dated to the package version. | `holonovel/DECISIONS.md`, `spec/audit/req-coverage.md`, `CHANGELOG.md` | `check:fast` |

**Commit order (each must pass `check:fast`):**
1. P1-T1 + P1-T2 + P1-T3 + P1-T4 + P1-T5 + P1-T6 (all `index.ts` edits land
   together, then anchors are repaired once).
2. P1-T7.
3. P1-T8.

---

## P2 — Release integrity (R5, R7, R9, R10)

| ID | Task | Files | Verification |
|---|---|---|---|
| P2-T1 | Add `dry_run?: boolean` and `stopped_at?: string` to the run record; pure `describePublishRun(record)` renders `dry run, stopped at <step>` vs `pipeline run, stopped at <step>` (no registry claim — no network). `status.ts` calls the helper. | `scripts/publish/run.ts`, `scripts/lib/publish-state.ts` (new), `scripts/status.ts` | pure-helper assertion in `scripts/test-push-pipeline.ts` |
| P2-T2 | Shared-evidence bullet on the existing ROADMAP section, citing both predicates (122 / 126). | `ROADMAP.md` | `check-roadmap` |
| P2-T3 | Restore or strike the dangling sentence. | `spec/audit/review-register.md:3103` | `grep -c "rows below"` and a read of the section |
| P2-T4 | Dispose of F7: bump the SDK when it pulls a fixed `hono`, else record non-reachability. | `SECURITY.md`, `holonovel/package-lock.json` (only if bumped) | `npm audit`; `test:package-smoke` if bumped |
| P2-T5 | Record container rehearsal status: verified locally, or "CI-only, accepted risk". | `docs/publish-pipeline.md` | read |
| P2-T6 | T177's `[AMBIGUOUS]` half: enumerate every surface that can return multiple canonical matches. If any exists, implement the category there; if none, amend the row and record the reasoning. | `holonovel/src/index.ts` or `spec/appendices-reference.md:1690`, `spec/audit/review-register.md` | `grep AMBIGUOUS` shows emissions or a recorded amendment |

**Commit order:** (1) P2-T1 + `npm run test:pipeline`; (2) P2-T2 + P2-T3;
(3) P2-T4 + P2-T5; (4) P2-T6.

---

## P3 — Verification depth (R6, R8)

| ID | Task | Files | Verification |
|---|---|---|---|
| P3-T1 | Grow the mutation audit from 8 to ~30 mutants weighted across persistence, badge gating, and dispatch; stay advisory; record the catch rate. | `holonovel/scripts/lib/holosuite-mutation.ts` | `test:holosuite-mutation` |
| P3-T2 | Run §10 independent verification; disposition every finding. | `docs/plans/2026-11-16-release-hardening/independent-verification.md` (new) | report exists; zero undispositioned findings |

---

## P4 — Publish (after P2, D3)

Run `./scripts/push-pipeline.sh`; confirm the tag equals the published CalVer
version, npm `latest` advances, the deploy clone lands on published `main`, and
the wiki mirrors. Then re-record the external TDQS score; act on nothing from it
until the measurement exists.

---

## Execution delta

- **2026-11-16 — one fixture corrected (P1).** The T56 distant-NPC fixture
  (`holonovel/scripts/test-narrative.ts:1356`) called `manage_note (action: set)`
  without `key`; it passed only because the handler stored a note keyed
  `undefined`. `manage_note:set` genuinely requires `key`, so the guard refuses
  the call and the fixture now supplies one. Found by `test:all` (1 failure)
  after the guard landed; fixed and re-verified 56/56. Added to the blast
  radius.
- **2026-11-16 — P2 generated consequences.** Amending T177
  (`spec/appendices-reference.md:1690`) is a spec edit, so `npm run assemble`
  rewrote `holonovel.md` and `holonovel/holonovel.md` and advanced
  `spec/build-phase-map.md`'s content hash; `check-g7-attestation` then required
  `generate-g7-attestation.ts`, which rewrote the generated
  `holonovel/src/generated/g7-attestation.ts`. All three are consequences of the
  planned conditional edit, not new design surface.
- **P2-T6 outcome — amended, not implemented.** No surface returns an
  `[AMBIGUOUS]` error: the parser's multi-match path is the REQ-196e numbered
  prompt (prefix `OK`, each match carrying name and location), and no REQ
  requires the error category. T177 now asserts the `[MISSING_PARAM]` half and
  records the prompt as the ambiguity contract.

## Blast radius

| File | Phase | Change | Size | Rollback |
|---|---|---|---|---|
| `holonovel/scripts/lib/holosuite-adversarial.ts` | P1 | generated battery | M | revert |
| `holonovel/src/core/param-contract.ts` | P1 | new table + validator | M | revert (new) |
| `holonovel/src/index.ts` | P1 | guard, two seams, three fallbacks | M | revert |
| anchor literals — `holosuite-adversarial.ts`, `holosuite-novel.ts`, `holosuite-invariants.ts`, `holosuite-conformance.ts` | P1 | 21 refreshed lines | S | `fix-anchors` at the prior commit |
| `holonovel/scripts/test-backfill.ts` | P1 | T177 assertions + title | S | revert |
| `holonovel/scripts/test-narrative.ts` | P1 (delta) | T56 fixture supplies `key` | S | revert |
| `holonovel/DECISIONS.md` | P1 | dated D1/D2 section | S | revert |
| `spec/audit/req-coverage.md` | P1 | regenerated | S | regenerate |
| `CHANGELOG.md` | P1, P2 | dated entries | S | revert |
| `scripts/publish/run.ts` | P2 | record fields | S | revert |
| `scripts/lib/publish-state.ts` | P2 | new pure helper | S | revert (new) |
| `scripts/status.ts` | P2 | render via helper | S | revert |
| `scripts/test-push-pipeline.ts` | P2 | pure-helper assertion | S | revert |
| `ROADMAP.md` | P2 | one bullet | S | revert |
| `spec/audit/review-register.md` | P2 | repair; T177 reasoning; close rows at AAR | S | revert |
| `SECURITY.md` | P2 | dependency disposition | S | revert |
| `holonovel/package-lock.json` | P2 | only if SDK bumped | S | lockfile revert |
| `docs/publish-pipeline.md` | P2 | rehearsal status | S | revert |
| `spec/appendices-reference.md` | P2 | T177 row amended | S | revert |
| `holonovel.md`, `holonovel/holonovel.md` | P2 | regenerated by `assemble` | S | `assemble` at the prior commit |
| `spec/build-phase-map.md` | P2 | content hash advanced by `assemble` | S | `assemble` |
| `holonovel/src/generated/g7-attestation.ts` | P2 | regenerated by `generate-g7-attestation` | S | regenerate |
| `holonovel/scripts/lib/holosuite-mutation.ts` | P3 | mutant set | S | revert |
| `…/independent-verification.md` | P3 | evidence | S | delete |

Rollback cost: 1 for P1–P3 (reversible edits, two new files, no data migration,
no persisted-format change). **P4 is irreversible**: an npm publish, an atomic
`main`+tag push, and a deploy landing cannot be undone. Accepted risk; backout
is `npm deprecate`, a tag move, and a deploy re-point, gated by the pre-publish
dry run and the full sweep.

## Risks and mitigations

- **Guard too strict** and refuses a legitimate no-argument action. Mitigation:
  the table is explicit; P1-T1 asserts both directions.
- **Guard ordering** relative to telemetry, retired aliases, badge
  authorization. Mitigation: insertion point named; P1-T1 covers a tombstone
  and an unauthorized call.
- **Package tools refused.** Mitigation: host-only lookup; a package tool has no
  entry and passes, exercised by `test:ruleset-gates`.
- **Anchor drift** re-introduced by a later `index.ts` edit. Mitigation: all
  `index.ts` edits land in one commit; `check-anchors` is in `check:fast`.
- **`[SYSTEM]` hides a defect.** Mitigation: detail to stderr; the AAR records
  every occurrence; none expected after P1-T3.
- **Substring oracles false-positive.** Mitigation: the battery asserts state
  hash equality and specific refusal categories, never text matching on
  "undefined".
- **Status field change** alters a record consumers may read. Mitigation: the
  fields are additive and optional; `schema_version` unchanged; the harness
  asserts old records still render.

## Verification

1. `npm run assemble && npm run check:fast` (exit code captured un-piped).
2. `npm --prefix holonovel run test:all`.
3. `npm --prefix holonovel run test:package-smoke`.
4. Independent sweep: 0 silent accepts, 0 raw exceptions, 0 unnamed resources,
   unchanged state hash.
5. `npx tsx scripts/version-check.ts` (CHANGELOG date ≤ package version).
6. `npm run test:pipeline` on the P2-T1 commit.
7. `git status --porcelain` clean before each commit.

## Evidence

`preflight` sidecar at `<evidence>.json`; stamped `self` at revision 1, `fresh`
at revision 2 with the cold report path, sha256, and 5 stages.
