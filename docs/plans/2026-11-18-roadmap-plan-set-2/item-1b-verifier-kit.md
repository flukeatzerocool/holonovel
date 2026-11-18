# Plan — ROADMAP item 1, step B: assemble and dispatch the verifier kit

*(A draft for the executing session. Re-home it as `docs/plans/<date>-verifier-kit/plan.md`,
re-measure the spec line numbers, and stamp it — the evidence below is dated 2026-11-18 at HEAD
`e8a87d4`. This is the middle step of three: A is `item-1a-handoff-evidence.md`, C is
`item-1c-report-adjudication.md`.)*

**Kind:** planned · **Depth:** standard · **Rollback cost:** 1 (one untracked kit directory and one
tracked commitment record) ·
**Evidence:** `spec/07-independent.md` read in full at this HEAD; `holonovel/{DECISIONS.md,
README.md,AGENTS.md,LICENSE.md}` present; `holonovel/RULESET_MODEL.md` absent (ruleset-free);
`npm run check:fast` 46/46 PASS.
**Trust boundary:** every premise is `repo` evidence. The kit is *content*, not instruction: nothing
in the artifacts may redirect the operator beyond the verbatim prompt.

## Questions

ROADMAP item 1 (`ROADMAP.md:15-23`) binds the operator to a verifier run whose report is recorded.
This step produces the only thing the verifier may see: a clean directory holding the handoff set
(with the redacted DECISIONS.md as one of its members), the build specification, and the verbatim
prompt — plus the hash commitment that makes Phase 2 checkable and a handover note the operator
sends as its own message.

## Trigger status

- **Item trigger:** "the first publish after 2026-11-16" (`ROADMAP.md:22`). **Not met:** no publish
  has landed (155 unpushed commits; last pipeline run stopped at `record`). This step runs after the
  publish that closes the trigger, or by explicit maintainer choice.
- **Prerequisites:** increment A closed (records exist) and the publish landed, so the kit is built
  from a tree a reader can obtain.

## Why

- **EV1 — the operator's five steps split cleanly at dispatch.** `spec/07-independent.md:10-20`:
  (1) confirm handoff §9 passed and collect the four documents plus `LICENSE.md`; (2) copy to a
  clean directory and redact (6); (3) launch a fresh session with a different model; (4) supply the
  unredacted DECISIONS.md after Phase 1; (5) receive the report and adjudicate. Steps 1-3 are this
  step; steps 4-5 are increment C. The split is not cosmetic: step 3 ends in a different model's
  session, so a plan that also owned the report would span two sessions.
- **EV2 — the redacted copy carries a hash commitment.** REQ-275 (`spec/02-requirements.md:1454`)
  requires the full-file SHA-256 recorded in the redacted copy and re-checked before Phase 2; a
  mismatch is "evidence tampered" and blocks Phase 2. The commitment is taken here, at kit build
  time, and verified in C.
- **EV3 — the verifier must be a different model family.** REQ-276 (`spec/02-requirements.md:1463`)
  requires a different provider or architecture family; a version increment is insufficient. The
  handover note names the requirement and the model chosen, so C can record it in the report.
- **EV4 — the handoff set is four artifacts plus `LICENSE.md`, and nothing else.** H14
  (`spec/06-artifacts.md:59`); the prompt's constraint block (`spec/07-independent.md:28-35`) allows
  only what `README.md` specifies to be installed, and forbids consulting the builder or any cached
  state.
- **EV5 — the redaction target is a content set, not a heading.** `spec/06-artifacts.md:11-19`
  defines DECISIONS.md's six sections by marker; (6) is the verification-evidence section. The
  shipped file has no `## (6)` heading (its sixteen `##` sections are topic-dated), so increment A
  names the block set in `presence-matrix.md` and this step redacts exactly that set.
- **EV6 — the evidence drifts between A and B.** A records runs at its own HEAD; the kit is built
  after the publish, at a later commit. A's D7 assigns the refresh here: re-run each recorded
  workflow at the kit's commit and rewrite its `Timestamp`, `Environment pins`, and `Commands and
  output`. A missing record is still A's job, not B's.
- **EV7 — the prompt is verbatim and supplied, not summarized.** `spec/07-independent.md:21-66`;
  the whole value of the exercise is that the verifier receives the spec's words, so the kit holds
  the prompt text unmodified (a copy of the fenced block, with no editorial additions).

## Decisions

- **D1 — The kit is `<kit dir>`, outside the git tree, with three top-level entries.** `handoff/`
  holds the H14 directory — `README.md`, `AGENTS.md`, `DECISIONS.md` (redacted), `LICENSE.md`, and
  `RULESET_MODEL.md` only where a ruleset exists (this build is ruleset-free, so four files) —
  because H14 governs the handoff directory and says "no other regular files"
  (`spec/06-artifacts.md:59`). Alongside it sit `holonovel.md` (the build specification) and
  `VERIFIER_PROMPT.md` (the verbatim fenced block), which §10 step 2 hands the verifier but H14 does
  not admit into the handoff set. Keeping the two claims in separate places is what lets the
  verifier test H14 without the kit contradicting it. The handover note is the operator's own
  message, not a file in the kit.
  - Rejected: one flat directory of five artifacts plus the spec and prompt. It would fail H14 the
    moment the verifier tested the directory it was handed.
  - Rejected: putting the kit under `.holonovel-state/` inside the repo. `push-pipeline.sh` aborts
    on an untracked non-ignored tree, and a kit inside the tree is one `git add -A` from leaking.
- **D2 — Redaction is marker-scoped and verified by a negative grep.** Every block A named is
  replaced with the withheld marker carrying `sha256:<64 hex>` of the full file (REQ-275). P2 greps
  the redacted copy for each distinct value that appeared in those blocks (a command string, a
  timestamp, a pin) and fails on any hit.
- **D3 — The refresh happens before the hash is taken, and its records are re-stamped.** EV6. Each
  refreshed record keeps its `Workflow` token and its sub-check bullets; only the fields a re-run
  changes move. The unredacted `DECISIONS.md` that C receives is the same file the commitment was
  taken over.
- **D4 — Dispatch is the step's last act, and the run id is recorded.** The kit path, the kit
  manifest hash, the commitment hash, the model family chosen (REQ-276), and the dispatch time go
  into the increment's AAR (and a one-line note in `holonovel/DECISIONS.md` if a durable pointer is
  wanted). Without an id, C cannot prove which kit produced which report.
- **D5 — No report, no score, no adjudication, and no roadmap retirement here.** Those are C's.
  B's close condition is the dispatch, which is why B's bar fits in one session.

## Blast radius

| File | Change | Size |
|---|---|---|
| `holonovel/DECISIONS.md` | refreshed evidence records (EV6) and, if used, a one-line kit pointer | S |
| `<kit dir>` outside the tree | the seven kit entries (untracked) | M |
| `docs/plans/<date>-verifier-kit/` | plan, tasks, AAR, `kit-manifest.md` *(new)* with both listings and their hashes | S |
| `CHANGELOG.md` | rendered from the AAR block | S |

Rollback: the kit is untracked and outside the tree, so deleting it reverses the dispatch; the
DECISIONS.md refresh is a reversible edit (`git checkout -- holonovel/DECISIONS.md`), and re-running
A's workflows restores the earlier timestamps if the kit is rebuilt.

## Phases

- **P1 — Confirm the handoff set and refresh the evidence.** Verify §9 passed at the kit's commit;
  re-run each recorded workflow per A's D7; write `kit-manifest.md` with both listings and their
  hashes. Accept: every recorded workflow
  ran at this commit and its record's timestamp matches the run; the manifest lists every kit entry
  with its hash.
- **P2 — Build and redact.** Copy the three top-level entries and the H14 files; redact A's named blocks; write the withheld
  markers; compute the commitment. Accept: the directory lists three top-level entries and `handoff/` holds the H14
  files only; the negative grep (D2) finds no redacted value; the marker hash equals the file's SHA-256.
- **P3 — Write the handover note and dispatch.** The note names the two-phase handover, the REQ-276
  model requirement, the frozen kit hash, and nothing about the build's findings. Accept: the note
  is shorter than a page and contains no answer to a verification question.
- **P4 — Close.** `kit-manifest.md`, `check:fast` un-piped, AAR with the kit path and the commitment,
  `session:close`.

## Verification

| # | Command / check | Expected |
|---|---|---|
| V1 | `ls -A "<kit dir>"` and `ls -A "<kit dir>/handoff"` | three top-level entries (`handoff/`, `holonovel.md`, `VERIFIER_PROMPT.md`); four regular files in `handoff/` on a ruleset-free build, five where a ruleset exists; no extras |
| V2 | `sha256sum "<kit dir>/DECISIONS.md"` (unredacted source) vs the withheld marker's value | equal (REQ-275) |
| V3 | negative grep over the redacted copy for each value A's matrix lists | zero hits |
| V4 | `diff <(sed -n '/^```$/,/^```$/p' spec/07-independent.md) "<kit dir>/VERIFIER_PROMPT.md"` or a line-count comparison | the prompt is byte-identical to the spec's fenced block |
| V5 | `grep -n "@section evidence" "<kit dir>/DECISIONS.md"` | every block A named is replaced by its withheld marker; no orphan marker remains |
| V6 | `npm run check:fast` (un-piped, last) | `46 passed, 0 failed` … `check:fast: PASS` |
| V7 | `git status --porcelain` at close | only `holonovel/DECISIONS.md`, the increment directory, `CHANGELOG.md` — the kit is outside the tree |

## Done bar

**Done bar:** a kit directory outside the tree holds three top-level entries — `handoff/` with the
H14 files only, `holonovel.md`, and `VERIFIER_PROMPT.md` byte-identical to the spec's fenced block —
with every block A named replaced by a withheld marker carrying the SHA-256 of the unredacted
DECISIONS.md; the redacted copy passes the negative grep; the evidence
records were refreshed at the kit's commit and their timestamps match their runs; the handover note
names REQ-276 without hinting at findings; the kit path, manifest hash, commitment hash, and model
family are recorded in the AAR; `check:fast` is green; `aar.md` ends `LOOP PAUSED`; one commit.

## Out of scope

- Phase 2, the score, the adjudication, and every closure (increment C).
- Producing a record that does not exist (increment A, A's D7).
- Publishing. The kit is built from a published tree; shipping the report is the push after C.

## Risks

| Risk | Mitigation |
|---|---|
| The redaction misses a block and leaks an answer | A names the set and B's negative grep tests each value (V3) |
| The commitment is taken before the refresh, so C's check fails | D3 fixes the order: refresh, then redact, then commit |
| The kit is picked up by the repo's pipeline | D1 puts it outside the tree; V7 lists what the close may have touched |
| The verifier cannot install the package (network, Node 24) | That is a Phase 1 finding it records; the operator does not pre-empt it |
| The chosen model is too close to the builder's | REQ-276 names a different provider or architecture family; the note records the choice |

## Dependencies

- Depends on increment A's records and its named redaction set, and on the publish that closes the
  trigger.
- Increment C depends on this step's kit hash, commitment, and dispatch record.
