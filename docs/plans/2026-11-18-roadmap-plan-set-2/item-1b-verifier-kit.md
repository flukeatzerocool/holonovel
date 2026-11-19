# Plan — ROADMAP item 1, step B: assemble and dispatch the verifier kit

**Date:** 2026-11-18 · **Kind:** planned · **Depth:** standard · **Revision:** 4 ·
**Execution home:** `docs/plans/<date>-verifier-kit/` where `<date>` is the execution date (never
this draft's `2026-11-18`). The executing session re-homes this draft as its `plan.md`, labels
the re-homed copy **one revision greater than this draft** (Revision 5 at the time of writing)
unconditionally, writes `tasks.md`, the manifest, note, and AAR
there, **re-measures every line reference and re-stamps with its own cold pass** — this draft's
review covers the plan's design, not the re-homed bytes.
**Rollback cost:** 1 (0 pure add, 1 reversible edit, 2 destructive) — eleven records'
three fields each in a tracked file, plus documents and an untracked kit directory outside the
tree.
**Draft location.** This file lives in the closed `2026-11-18-roadmap-plan-set-2` increment
because a directory under `docs/plans/` without an `aar.md` fails `check-loop-artifacts` in the
strict mode the full gate and `session:close` use, and that failure would block the publish this
item is triggered by (cold-pass revision-1 Major 2 below). Revising an executor-facing draft in
place is the alternative to
creating that AAR-less directory; the draft is not the executed increment's plan, and the
executing session re-stamps its own.
**Supersedes:** the 2026-11-18 draft of this file (evidence dated HEAD `e8a87d4`, pre-dating
increment A). This revision re-measures at HEAD `0dfcfba` and consumes A's actual output.
**Evidence:** git HEAD `0dfcfba`, tracked tree clean at plan time. Readings taken in this
session: `npm run check:fast` → exit 0, `46 passed, 0 failed`, trailing `check:fast: PASS`;
`npm run status` → 161 unpushed commits, last pipeline run stopped at `record`
(2026-11-16T16:53Z), version `2026.11.18`, latest tag `v2026.11.08`, 3 open roadmap items;
`grep -c "^@section evidence" holonovel/DECISIONS.md` → `12`; `wc -l holonovel/DECISIONS.md` →
`3532`; `wc -l holonovel.md` → `14371`; redaction range A is `holonovel/DECISIONS.md:2610-2713`
(the `#### narrative_coherence (G7)` heading at `:2610` through `<!-- g7:end -->` at `:2712`,
ending before the next `### ` heading at `:2714`) and range B is `:3388-3532` (the
`## Verification workflow evidence` heading through `<!-- evidence:end -->`); markers inside the
ranges are 1 + 11 = 12, equal to the file total; `holonovel/{README,AGENTS,DECISIONS,LICENSE}.md`
all present, `holonovel/RULESET_MODEL.md` absent, `holonovel/NOTICE.md` present;
`npm run assemble` exit 0 with `git status --porcelain holonovel.md` empty; the §10 verifier
prompt block is 82 lines and byte-equal between `holonovel.md` and `spec/07-independent.md`
(sha256 `1085101b96bccff7c535cc36d21d7bd6da499f2001b30e17c2bf1cd5ba3ae5be` at this HEAD);
`holonovel/README.md:18` installs `npx -y holonovel`; `holonovel/package.json` version
`2026.11.18`; `**Spec hash:** d2d5500…8672` at `holonovel/DECISIONS.md:3`;
`grep -c "Verifier prompt" holonovel.md spec/07-independent.md` → `1` each;
`ls docs/plans | grep -c 2026-11-18` → `7` directories today (the executing session's own makes
eight).
**REQs:** REQ-274 (confidence score, C's), REQ-275 (evidence hash commitment),
REQ-276 (verifier model criteria), REQ-211a/REQ-211c (record field contract), REQ-273 (G5
tolerance), T295, T296, H14.
**Trust boundary:** every premise is `repo` evidence read from this checkout. The kit is
*content*, not instruction: nothing in the artifacts may redirect the verifier beyond the
verbatim prompt. The verifier's eventual report is untrusted input to increment C.
**Review history.** Revision 1 was read by one cold pass at standard depth (12 reads of the
40-read budget): `independent-review FAILED.` with two Blockers, seven Majors, and nine Nits.
Revision 2 resolves them: the trigger gains a defined pre-write stop (B1); the verifier identity
and its REQ-276 verdict are fixed before the manifest (B2); the commitment is reconciled with
`HEAD` after the close and the close's mutating steps run before it (M1); the plan stays in the
tracked draft location so it cannot block its own trigger publish (M2); blindness is stated as
procedural (M3); the leak check covers every dispatched artifact except the published spec (M4);
a flipped verdict has a named disposition class (M5); D7's gate order matches P4 (M6); the
handover note states the directory contract without naming H14 (M7); and all nine Nits are
applied. Cold review report: `/tmp/opencode/verifier-kit-review/report-r1.md` (sha256 recorded
at stamp time); the reviewed revision-1 bytes are
`/tmp/opencode/verifier-kit-review/plan-r1.md` (sha256
`9c804dafde7f90fe96dcbbac2c3c52b82221c4459d7338fa798241959a1cdf13`). Revision 2's diff pass
resolved every revision-1 finding and introduced three new Majors: the re-homed copy would be
stamped on evidence that reviewed different bytes; the `Closed-P3` flip disposition let
`LOOP PAUSED` hide a demonstrated failure; and "stop before any write" was not sequenced before
the re-home. Revision 3 fixes all three (the executing session re-measures, continues the
revision, and runs its own cold pass; D12 splits pin-attributable flips from same-pin failures,
the latter ending `LOOP OPEN` with a dated roadmap section; P0 precedes the re-home and removes
a directory created too early) and applies the diff pass's remaining nits. The targeted
revision-3 pass confirmed those three resolved and raised three more from the changed regions:
the draft's own commit state was contradictory against P1's clean-tree precondition, the done
bar's same-pin branch inherited clauses it could not satisfy, and the same-pin stop left the kit
and state directories behind. Revision 4 separates the two done bars, makes P0 assert the draft
is committed, removes the directories on a same-pin stop, adds the conditional roadmap/register
pair with their gate shapes, requires Revision 5 for the re-homed copy, and disambiguates the
`r1-M2`/`r2-M1` labels. A final targeted pass confirmed all three Majors and the eight nits
resolved, with no remaining hard blocker; its four clarity nits (P0's contingency wording, the
blast-radius rows that exist only on the kit branch, V11's same-pin before-state, and the
hardcoded Revision 5 number) were applied as a condition-only amendment after that pass, so the
stamped bytes differ from the bytes it read only by those four clauses and this sentence. The
cold passes ran
five stages in one fresh subagent context each because nested subagents were unavailable; stage
independence is single-context, not five sessions per pass, and this is recorded rather than
hidden.

## Questions

ROADMAP item 1 (`ROADMAP.md:15-23`) binds the operator to a verifier run whose report is
recorded. §10 splits into three acts across two sessions: steps 1-3 (confirm the handoff, copy
and redact, launch a different-model session) are this increment; steps 4-5 (supply the
unredacted evidence, receive and adjudicate the report) are increment C. This plan produces the
only thing the verifier may see — a clean directory holding the handoff set with the evidence
redacted, the build specification, and the verbatim prompt — plus the hash commitment REQ-275
makes checkable, a manifest the operator can audit, and a handover note that is the dispatch.

Increment A (`docs/plans/2026-11-18-handoff-evidence`, commit `0dfcfba`) wrote eleven evidence
records, named fifteen workflow findings, and named the two redaction ranges. This increment
re-runs those eleven records at the freeze tree, redacts exactly the named ranges, and hands the
result to a different model family.

## Trigger status

- **Item trigger:** "the first publish after 2026-11-16" (`ROADMAP.md:22`). **Not met**:
  `npm run status` reports 161 unpushed commits and the last pipeline run stopped at `record`.
- **Dormant until the trigger fires.** This plan is not executed against HEAD `0dfcfba`. The
  executing session runs only after a publish has landed, and its first check is P0.
- **Why the trigger is a hard precondition, not a scheduling preference:** the verifier installs
  the build with `npx -y holonovel` (`holonovel/README.md:18`), which resolves the registry's
  latest version. A kit frozen from a tree the registry does not serve describes a different
  build than the verifier can install, so Phase 2 would compare evidence against an artifact it
  never saw. Increment A could pre-build its records; this increment cannot pre-build the kit.
- **Defined stop state (B1).** If P0 fails, the session stops **before the first write**: no
  kit, no manifest, no note, no AAR, no commit. It reports the registry version, the repo
  version, and the reason to the maintainer, and ends. No increment started, so no AAR is owed
  and no loop artifact is missing; this draft remains the plan of record. The done bar below is
  conditional on P0 passing and cannot be "failed" by an unmet trigger.
- **Selection:** execution is a maintainer selection after the publish that closes the trigger.
- **Operator presence:** dispatch is an operator act (§10 binds the operator): a session cannot
  launch a different model's session itself. Execution therefore requires the operator to launch
  the verifier and confirm it. If the operator is unavailable at the close, the kit still freezes
  and the AAR records `dispatch: pending` with the exact next act; the increment then does not
  claim a dispatch, and C records it when it happens.

## Why

- **EV1 — §10 steps 1-3 split cleanly from steps 4-5, and the split is at a session boundary.**
  `spec/07-independent.md:10-19`: (1) confirm §9 passed and collect the four handoff documents
  plus `LICENSE.md`; (2) copy to a clean directory and redact item (6); (3) launch a fresh
  session with a different model; (4) supply the unredacted `DECISIONS.md` after Phase 1;
  (5) receive the report and adjudicate. Step 3 ends in another model's session, so a plan that
  also owned the report would span two sessions and two models.
- **EV2 — The commitment lives in the redacted copy and covers the full unredacted file.**
  REQ-275 (`spec/02-requirements.md:1454-1461`) requires the builder to compute and record a
  SHA-256 of the full `DECISIONS.md` "in the redacted copy supplied to the verifier"; after
  Phase 1 the verifier recomputes it against the supplied unredacted file, and a mismatch is an
  "evidence tampered" Discrepancy that blocks Phase 2. T295
  (`spec/appendices-reference.md:1785`) exercises both the match and the mismatch path. The
  commitment is therefore taken here, at freeze time, and verified in C.
- **EV3 — The verifier must be a different provider or architecture family, and the rule has a
  recorded non-blocking branch.** REQ-276 (`spec/02-requirements.md:1463-1471`) requires a
  different provider or architecture family (a version increment is insufficient); the verifier
  records its own provider, model name, and version; the operator verifies the criterion *before*
  Phase 1; and a same-provider-same-architecture verifier "is noted as a process-compliance
  finding and does not block the verification but SHALL be recorded in DECISIONS.md (6)". The
  manifest records the builder identity, the chosen verifier identity, and the verdict before
  the kit is frozen; a same-family choice is a recorded finding, never a silent omission and
  never a blocked run.
- **EV4 — The handoff set is H14's five files, of which this ruleset-free build has four.**
  H14 (`spec/06-artifacts.md:59`) requires the handoff directory to contain exactly
  `RULESET_MODEL.md`, `DECISIONS.md`, `README.md`, `AGENTS.md`, and `LICENSE.md` with no other
  regular files. A's presence matrix records H14 `fail` because `RULESET_MODEL.md` is absent
  from this ruleset-free build
  (`docs/plans/2026-11-18-handoff-evidence/presence-matrix.md:60`), and
  `holonovel/DECISIONS.md` carries that fail as an evidence record. The kit presents the
  directory as built; fabricating a `RULESET_MODEL.md` would convert a recorded defect into a
  false pass and blind the verifier to it.
- **EV5 — The redaction target is a content set, and it currently spans exactly two ranges.**
  `spec/06-artifacts.md:11-19` defines `DECISIONS.md`'s six sections by marker, and (6) is the
  verification-evidence section; the shipped file has no `## (6)` heading (its nineteen `##`
  headings are topic-dated). Increment A named the two ranges in `presence-matrix.md:21-27`:
  the G7 block (`2610-2713`) and the appended records section (`3388-3532`). The twelve
  `^@section evidence` markers all fall inside them (1 + 11). A range that omits a marker is a
  leak, which is why P1 asserts the arithmetic instead of trusting the named line numbers.
- **EV6 — The evidence drifts between A and B, and the drift is B's to record.** A's records
  carry timestamps from its own commit (`a687660`, records written 2026-11-19T01:4xZ); the kit
  is frozen after the publish at a later commit. A's D9 assigns the refresh here: re-run each
  recorded workflow at the freeze tree and rewrite `Timestamp`, `Environment pins`, and
  `Commands and output`. A verdict may also change; a changed verdict has a named disposition
  (D12) rather than a silent restore.
- **EV7 — The prompt is supplied verbatim, not summarized.** `spec/07-independent.md:21-106`;
  the whole value of the exercise is that the verifier receives the spec's words. At this HEAD
  the block is 82 lines and identical between the source and the assembled spec, so the kit's
  copy is checkable against the artifact it ships with.
- **EV8 — The kit is built from a tree a reader can obtain, and the registry is the reader.**
  §10's "cold checkout" is a clean directory rather than a git clone
  (`spec/07-independent.md:32-35`), but the verifier still installs a build. The version the
  registry serves at freeze time is recorded in the manifest, so C can classify a later version
  as pin drift instead of a builder discrepancy (EV3/`spec/07-independent.md:92-96`).
- **EV9 — Blindness is procedural, and the plan says so.** The verifier is honour-bound by the
  prompt (`spec/07-independent.md:28-35`) not to consult the builder or cached state. This
  increment does not isolate the operator's machine: the repository and the state copy remain
  readable, and the AAR records where they are. What the increment does enforce is that the
  kit contains no unredacted evidence and that the commitment detects any change to the copy
  later supplied.

## Decisions

- **D1 — The kit is `<kit dir>`, outside the git tree, with three top-level entries.** The
  default is `$HOME/holonovel-verifier-kit-<YYYY-MM-DD>`; P2 refuses a path whose `realpath`
  falls under the repository root. `handoff/` holds H14's directory as this build produces it —
  `README.md`, `AGENTS.md`, `DECISIONS.md` (redacted), and `LICENSE.md`, with
  `RULESET_MODEL.md` absent — because H14 governs the handoff directory and says "no other
  regular files" (`spec/06-artifacts.md:59`). Alongside it sit the root `holonovel.md` (the
  assembled build specification the prompt tells the verifier to load) and
  `VERIFIER_PROMPT.md` (the verbatim block), which §10 step 3 hands the verifier but H14 does
  not admit into the handoff set. Keeping the two claims in separate places is what lets the
  verifier test H14 without the kit contradicting it; D6 states the directory contract to the
  verifier without naming a workflow token.
  - Rejected: one flat directory of five artifacts plus the spec and prompt. It would fail H14
    the moment the verifier tested the directory it was handed.
  - Rejected: a kit under `.holonovel-state/` or anywhere inside the repo. `push-pipeline.sh`
    aborts on an untracked non-ignored tree, and a kit inside the tree is one `git add -A` from
    leaking.
  - Rejected: adding a `RULESET_MODEL.md` placeholder to satisfy H14. EV4: that fabricates a
    pass over a recorded failure.
- **D2 — The commitment sits in the redacted copy and covers the full unredacted file.**
  Each of the two ranges is replaced by one marker line,
  `<!-- withheld: DECISIONS.md item (6) verification evidence; sha256:<64 hex> -->`, both carrying
  the same SHA-256 of the full unredacted `DECISIONS.md` taken after every refresh (REQ-275).
  - Rejected: putting the commitment only in the handover note or the manifest — REQ-275 says
    "in the redacted copy supplied to the verifier".
  - Rejected: hashing the redacted file — the spec says the full `DECISIONS.md`, and a hash of
    what the verifier already holds proves nothing about the withheld bytes.
- **D3 — The ranges are re-derived by anchor at freeze time, and the marker arithmetic is the
  leak control.** P1 derives range A as the `#### narrative_coherence (G7)` heading through the
  line before the next `^### ` heading, and range B as the `^## Verification workflow evidence`
  heading through EOF, then asserts that the number of `^@section evidence` markers inside the
  ranges equals the file total (12 at this HEAD: 1 + 11). The refresh rewrites lines inside
  range B, so hardcoded line numbers would be stale by the time the kit is copied.
  - Rejected: hardcoding `2610-2713` / `3388-3532` from A's matrix. They are correct at this
    HEAD and guaranteed to move during P1's own refresh.
- **D4 — Refresh every recorded workflow before the commitment, and let a verdict change
  honestly.** The eleven records are G0a, G4, G5, H5, H10, H13, H14, H15, H16, H17, H18
  (`docs/plans/2026-11-18-handoff-evidence/presence-matrix.md:66-68`). P1 re-runs the ten whose
  input exists before the kit (G0a, G4, G5, H5, H10, H13, H15-H18) and rewrites `Timestamp`,
  `Environment pins`, and `Commands and output`. H14's subject is the handoff directory, which
  does not exist until P2 builds it, so H14 is refreshed there and the final `DECISIONS.md` is
  copied — and the commitment taken — only after that rewrite. A verdict that changes is
  dispositioned under D12.
  - Rejected: leaving A's timestamps — gratuitous pin drift for a record re-run at the same
    environment.
  - Rejected: freezing only the fields that cannot change a verdict — a re-run that now fails
    must say so.
  - Rejected: taking the commitment in P1 and patching H14 afterwards — the commitment would
    not cover the file actually supplied in Phase 2.
- **D5 — Freeze means content-addressed, and the manifest carries every identity.** The
  verifier's provider/model/version and the REQ-276 verdict are fixed at P3.0, before the
  manifest is written (B2). `kit-manifest.md` records the base commit, the `**Spec hash:**`
  value, the freeze-time registry version, both directory listings, a sha256 per kit file, the
  commitment, both ranges with a sha256 of the content they removed, the prompt-block hash, the
  builder model identity, the verifier model identity, and the REQ-276 verdict. The kit's path
  is recorded in the AAR as well, so a later reader can tie files to hashes. If the operator
  launches a different model than the one recorded, the manifest is corrected and re-hashed
  *before* the note is sent and before the AAR records its hash.
- **D6 — The handover note is a committed file, dispatched verbatim.** It names the two-phase
  handover; states that the handoff directory is `handoff/` and that the specification and the
  prompt sit beside it, outside that directory, per §10 step 3; tells the verifier to record its
  model identity per REQ-276; tells it to request the unredacted `DECISIONS.md` after Phase 1 and
  to compare its SHA-256 with the commitment in the withheld marker (REQ-275); and states that
  item (6) is withheld. It names no workflow token and no build verdict, so it cannot hint at A's
  fifteen findings.
  - Rejected: a chat-only message. It would be unreviewable before dispatch and unreproducible
    afterwards.
  - Rejected: naming H14 in the note. The directory contract is stated positionally instead, so
    the note carries no workflow token.
- **D7 — Dispatch is preceded by the fast gate and a dry-run close, then recorded in the AAR.**
  Order: write the AAR's full body including the model identity and REQ-276 verdict but with a
  `dispatch: pending` line; `npm run validate`; `npm run check:fast`; `session:close ...
  --dry-run`; dispatch the note and the kit path and append the dispatch line (model, time);
  run the real close. The AAR therefore predates the gates (so the loop-artifact and changelog
  parsers see it), states a dispatch that happened, and the kit is frozen before any commit
  exists.
  - Rejected: dispatch after the commit — the AAR could not record it.
  - Rejected: dispatch before the gates — a failing close would strand a dispatched kit behind
    an unlanded record.
- **D8 — The unredacted copy lives outside the repo and outside the kit.** After the last
  refresh and before any redaction, P2 copies `holonovel/DECISIONS.md` to
  `$HOME/.local/state/holonovel/verification-<YYYY-MM-DD>/DECISIONS.unredacted.md` (mode 0600),
  and the commitment is taken over that copy. Only its hash and its path-in-the-AAR are
  recorded; the kit never names the path. EV9 states the limit: this keeps the kit blind, not
  the operator's machine.
  - Rejected: keeping it in the kit — the supplied directory would carry the answer key.
  - Rejected: taking the copy before the refresh — the commitment must cover the file actually
    supplied in Phase 2, and git already holds the pre-refresh bytes.
  - Rejected: keeping it only in git — the tree moves, and the commitment must hold against the
    exact bytes that will be supplied in Phase 2.
- **D9 — No spec, code, or register change; no roadmap retirement; no report.** The increment
  edits `holonovel/DECISIONS.md` (the refreshed fields), its own directory, and the CHANGELOG the
  close renders. The one exception is the same-pin branch's conditional pair — a dated
  `ROADMAP.md` section and its `Scheduled-roadmap` row in `spec/audit/review-register.md` (D12).
  `npm run validate` runs because the records are parser-gated (REQ-211a/T253). No gate is added,
  so existing-check discovery does not apply.
- **D10 — Increment C owns the report, the score, the adjudication, and the item's retirement.**
  B's close is the frozen kit plus the dispatch. A non-VERIFIED verdict is C's finding to route.
- **D11 — One commit, scoped to the execution increment.** `session:close` is strict about loop
  artifacts, so the AAR exists before the dry-run; `--increment <date>-verifier-kit` keeps the
  sibling increments on the execution date out of the close.
- **D12 — A flipped verdict has a two-branch disposition, and `LOOP PAUSED` is earned, not
  assumed.** If a re-run changes a recorded verdict, the record states the new result and its
  current pins. Then:
  - **Pin-attributable flip** — the run's environment pin differs from the recorded one (runtime,
  OS, protocol, or the spec hash): the record keeps the new result and pins, and the flip is an
  AAR finding dispositioned `Closed-P3` with "pin drift; the record states its current pins and
  increment C classifies against the verifier's pins." This is a pre-existing state, not a
  regression the freeze introduced.
  - **Same-pin flip** — the workflow fails under the recorded conditions: this is a demonstrated
  defect. The session stops **before** freezing the kit, removes `<kit dir>` and the state
  directory it has already written (the Rollback rule), adds one dated `ROADMAP.md` section
  (1-3 bullets and a `**Trigger:**` line, so `check-roadmap` passes) naming the workflow, adds
  the matching `Scheduled-roadmap` row to `spec/audit/review-register.md`, and the AAR ends
  `LOOP OPEN` with that action item. No kit is dispatched.
  The done bar's `LOOP PAUSED` therefore applies only to the kit branch; a same-pin flip has its
  own done bar below. It is a defined outcome, not a failed bar.
- **D13 — `NOTICE.md` does not ship.** H14's set is closed at five files, and this build has
  four. `holonovel/LICENSE.md:15-18` states that the third-party notices are the sources listed
  in `README.md` under "License", and `README.md` is in the handoff set, so attribution travels
  with the kit without a sixth file. The AAR records the decision; a verifier that reads H14
  literally will still record the missing `RULESET_MODEL.md` (EV4), which is A's finding.

## Blast radius

| File | Change | Size |
|---|---|---|
| `holonovel/DECISIONS.md` | eleven records refreshed at the freeze tree (three fields each; H14 after P2) | M |
| `docs/plans/2026-11-18-roadmap-plan-set-2/item-1b-verifier-kit.md` | this draft, revised; committed by the planning session's own close or the next publish, not by the executing increment | M |
| `docs/plans/<date>-verifier-kit/plan.md` | the re-homed plan, re-measured, re-stamped | M |
| `docs/plans/<date>-verifier-kit/tasks.md` | P0-P4 checklist | S |
| `docs/plans/<date>-verifier-kit/kit-manifest.md` | *(new)* listings, hashes, ranges, commitment, identities (kit branch only) | S |
| `docs/plans/<date>-verifier-kit/handover-note.md` | *(new)* the verbatim dispatch message (kit branch only) | S |
| `docs/plans/<date>-verifier-kit/aar.md` | written at close (P4) | S |
| `ROADMAP.md` | only on a same-pin flip: one dated section naming the failing workflow (D12) | S |
| `spec/audit/review-register.md` | only on a same-pin flip: the matching `Scheduled-roadmap` row (D12) | S |
| `CHANGELOG.md` | rendered from the AAR `## Changelog entry` block | S |
| `<kit dir>` outside the tree | seven files: three top-level entries (kit branch only) | M |
| `<state dir>/DECISIONS.unredacted.md` outside the tree | mode 0600, held for Phase 2 (kit branch only) | S |

Rollback: before the close, `rm -rf` the kit and state directories,
`git checkout -- holonovel/DECISIONS.md`, and `rm -rf docs/plans/<date>-verifier-kit` restores
HEAD. After the close, `git revert <sha>` reverses the tracked change; the kit and the state copy
are outside the tree and are deleted by hand.

## Phases

- **P0 — Preconditions, before the re-home or any write.** P0 runs before the executing session
  creates `docs/plans/<date>-verifier-kit/` or writes any file. (a) The draft is committed:
  `git status --porcelain -- docs/plans/2026-11-18-roadmap-plan-set-2/item-1b-verifier-kit.md` is
  empty, because an uncommitted draft fails P1's clean-tree precondition and a commit made at
  execution would fold the draft into the increment's single commit. (b) The publish landed:
  `npm view holonovel version` equals `node -p
  "require('./holonovel/package.json').version"`. A mismatch, an unreachable registry, or a
  `npm run status` that still reports the pre-publish tree stops the session with the reason
  reported to the maintainer and nothing written (Trigger status, "Defined stop state"). No
  directory, file, or commit exists if P0 fails; if one was created before P0 completed, the
  session removes it before ending, so no AAR-less increment is left behind.
- **P1 — Normalize, derive the ranges, and refresh ten records.**
  Run `npm run assemble` and `npm run fix-anchors` — the close's own two mutating steps — and
  require `git status --porcelain` to show no tracked change, so the close's mutating steps
  introduce no change beyond the record edits; V13 detects any that do (cold-pass revision-2
  Major 1). Confirm the four
  handoff files present, `RULESET_MODEL.md`
  absent, and record the spec hash. Derive ranges A and B by anchor and assert the marker
  arithmetic (12 total, 12 inside, 0 outside). Re-run G0a, G4, G5, H5, H10, H13, and H15-H18 and
  rewrite their three fields; leave the G7 block untouched. Accept: `npm run validate` exits 0
  with `0 error(s)`; every refreshed timestamp matches its run; `git diff -U0
  holonovel/DECISIONS.md` has no hunk before the range-B heading; the marker arithmetic holds
  after the refresh.
- **P2 — Build, refresh H14, and redact.**
  Create `<kit dir>` outside the tree (D1's default) and copy the root `holonovel.md`, the four
  handoff files, and the extracted prompt block. Refresh H14's record against the finished
  `handoff/` listing (`ls -A handoff/` from the kit root, so the operator's path stays out of the
  record), run `npm run validate`, re-check the range-A boundary, then re-copy the final
  `holonovel/DECISIONS.md` into `handoff/`. Copy it to the state directory and take the
  commitment (D8). Replace both ranges in the kit's copy with the withheld marker (D2). Run the
  structural and negative-grep leak checks. Accept: `ls -A` shows three top-level entries and
  four files in `handoff/`; the kit copy has zero `^@section evidence` markers and two withheld
  markers; the negative grep finds no denylist line; the marker hash equals the unredacted
  file's SHA-256; H14's record names the four-file listing and its fail and parses under
  `validate`.
- **P3 — Identities, manifest, and handover note.**
  P3.0: the operator selects the verifier's provider, model, and version, and the REQ-276
  comparison against the builder identity is recorded (B2). The manifest records the **declared
  selection**; the verifier's own REQ-276 evidence record is authoritative for the version it
  actually runs. P3.1: write `kit-manifest.md` (D5) with both identities and the verdict. P3.2:
  write `handover-note.md` (D6). Accept: every
  manifest field is present with a measured value; the note contains no workflow token
  (`G[0-9]`/`H[0-9]+`) and no verdict word, is under a page, states the `handoff/` directory
  contract, and names only the two-phase protocol, the REQ-275 hash ask, and the REQ-276
  identity ask.
- **P4 — Freeze, gate, dispatch, close.**
  Write the AAR (kit id, commitment, model identities, REQ-276 verdict, findings, `dispatch:
  pending`); `npm run validate`; `npm run check:fast` un-piped;
  `npm run session:close -- --increment <date>-verifier-kit --dry-run`; the operator launches the
  verifier with the kit path and the note verbatim, and the dispatch line (model, time) is
  appended; run the real close. When the operator is unavailable, the AAR keeps `dispatch:
  pending` and the exact next act instead. Accept: the dry-run prints one commit and the AAR
  title as its subject; the AAR states either a dispatch or the pending act and ends
  `LOOP PAUSED`; the real close makes one commit; the verification table passes.

## Verification

| # | Command / check | Expected |
|---|---|---|
| V1 | `npm view holonovel version` vs `node -p "require('./holonovel/package.json').version"` | equal; a mismatch or a registry failure stops at P0 with the reason reported and nothing written |
| V2 | `npm run assemble && npm run fix-anchors` then `git status --porcelain` | no tracked change; the close's mutating steps are already applied |
| V3 | marker arithmetic: `grep -c "^@section evidence" holonovel/DECISIONS.md`; the same count inside the two derived ranges; the same count outside them | `12`; `12`; `0` after the P1 refresh |
| V4 | `sha256sum "<state dir>/DECISIONS.unredacted.md"` vs the hex in each withheld marker | equal (REQ-275); two markers, same value |
| V5 | `grep -c "^@section evidence" "<kit dir>/handoff/DECISIONS.md"`; `grep -c "<!-- withheld:" …` | `0`; `2` |
| V6 | negative grep over every dispatched artifact except the specification and its prompt — `handoff/*` and `handover-note.md`: every line in the removed ranges that is at least 20 characters and occurs nowhere outside them must have zero hits | zero hits; `holonovel.md` and `VERIFIER_PROMPT.md` are exempt as specification text (V7 binds the prompt to the source) |
| V7 | prompt equality: `awk` extraction of the block after the single `**Verifier prompt** (verbatim):` line in `holonovel.md` and in `spec/07-independent.md`, compared three ways with `VERIFIER_PROMPT.md`; `grep -c` the anchor in each file | anchor occurs exactly once in each; the three extractions are identical |
| V8 | `ls -A "<kit dir>"`; `ls -A "<kit dir>/handoff"` | `handoff`, `holonovel.md`, `VERIFIER_PROMPT.md`; `AGENTS.md`, `DECISIONS.md`, `LICENSE.md`, `README.md` |
| V9 | `npm run validate` after the ten-record refresh and after the H14 rewrite | exit 0; `0 error(s)`; all eleven refreshed blocks parse |
| V10 | `npm run check:fast` (un-piped, last) | `46 passed, 0 failed` … `check:fast: PASS` at plan time; the executing session's own baseline count governs |
| V11 | `git status --porcelain` before the close; again after it | kit branch — before: `holonovel/DECISIONS.md` and the untracked increment directory, and nothing else (the draft is committed per P0); same-pin branch — those plus `ROADMAP.md` and `spec/audit/review-register.md`; after: empty |
| V12 | `npm run session:close -- --increment <date>-verifier-kit` | one commit; subject is the AAR block's title; no sibling increment is validated |
| V13 | after the close: `git show HEAD:holonovel/DECISIONS.md \| sha256sum` and `git show HEAD:docs/plans/<date>-verifier-kit/handover-note.md` | equal to the commitment and to the dispatched note bytes; a mismatch invalidates the kit (recorded and rebuilt before C uses it) |

## Done bar

**Done bar:** (kit branch — P0 passed, no same-pin flip) a kit directory outside the tree holds
three top-level entries — `handoff/` with the four files this ruleset-free build has (H14 names
five), `holonovel.md`, and `VERIFIER_PROMPT.md` byte-identical to the §10 block in the shipped
assembly — with both evidence ranges replaced by withheld markers carrying the SHA-256 of the
full unredacted `DECISIONS.md`; the redacted copy has zero evidence markers and passes the
negative grep over every non-specification dispatched artifact; the ten P1 workflows were re-run
and H14 was refreshed against the kit listing, and all eleven records parse under `validate` with
`0 error(s)`; `kit-manifest.md` records both listings, every hash, the base commit, the spec
hash, the registry version, both model identities, and the REQ-276 verdict; `handover-note.md`
leaks no workflow token or verdict and states the `handoff/` directory contract;
`check:fast` is green (46/46 at plan time); the AAR records the kit path, manifest hash,
commitment, model, and dispatch (or the pending act), every finding is dispositioned, and the
AAR ends `LOOP PAUSED`; one commit; and the committed `DECISIONS.md` and note hash to the values
the AAR records.

**Done bar:** (same-pin flip branch — D12) the flipped record in `DECISIONS.md` states the new
result and its pins; `<kit dir>` and the state directory are removed; no note is dispatched and
no commitment is taken (V13 does not apply); `ROADMAP.md` carries one dated section with 1-3
bullets and a `**Trigger:**` line naming the workflow; `spec/audit/review-register.md` carries
the matching `Scheduled-roadmap` row; the AAR names the flip with that row and ends `LOOP OPEN`;
`check-roadmap` and `check-registers` pass; one commit.

## Out of scope

- Phase 2, the score, the adjudication, and the roadmap retirement (increment C).
- Producing a record that does not exist, or a harness A found missing (increment A's findings).
- Publishing. The publish is the trigger; shipping the report is the push after C.
- Any spec, server, or register change. A workflow that fails is recorded, not fixed.
- Isolating the operator's machine for Phase 1 (EV9): blindness is procedural.

## Risks

| Risk | Mitigation |
|---|---|
| The registry serves a version other than the tree's | P0 stops before any write; B waits for the publish that closes the trigger |
| The redaction misses a marker because an anchor moved | V3's arithmetic is the primary control (12 in, 0 out); V5 re-checks the copy |
| The negative grep's denylist is too narrow to prove absence | Whole ranges are removed and V5/V3 assert structure; the denylist is a secondary control with a stated threshold and covers the note |
| A refresh changes a verdict and the plan hides it | D12's two branches: pin drift is recorded with its pins and `Closed-P3`; a same-pin flip stops before the freeze, schedules a dated roadmap section, and the AAR ends `LOOP OPEN` |
| The chosen verifier shares the builder's provider or family | REQ-276's last sentence: a recorded process-compliance finding in the manifest and AAR; the run is not blocked |
| `npx -y holonovel` resolves a newer version at verification time | The manifest records the freeze-time version; C classifies the difference as pin drift |
| The close moves a byte after the commitment | P1 runs the close's two mutating steps first and asserts no tracked change; V13 compares `HEAD` to the commitment |
| The close fails after dispatch | The fast gate and `--dry-run` precede dispatch; the kit is outside the tree and content-addressed, so a repaired commit does not invalidate it |
| The unredacted copy leaks into the kit | D8 keeps it in the state directory; V8 lists the kit's entries and V4 checks only its hash |
| The verifier reads the repository or the state copy | EV9 states blindness is procedural; the prompt forbids it, and V13 detects a changed supplied copy, not access to another |

## Dependencies

- Depends on increment A's eleven records, its fifteen findings, and its two named ranges.
- Depends on the publish that closes the trigger. This draft's own commit cannot supply that
  publish: it rides in the closed `2026-11-18-roadmap-plan-set-2` increment, which already
  satisfies `check-loop-artifacts`, so the publish is never blocked by an AAR-less directory
  (M2). The executing session creates its own increment directory only at execution, when its
  AAR is written into the same commit.
- Increment C depends on this kit's manifest hash, commitment, model record, and dispatch.

## Open questions

- None blocking. Whether a different-family verifier model is available is resolved in P3.0 and
  recorded; REQ-276 makes a same-family choice a finding rather than a stop.
