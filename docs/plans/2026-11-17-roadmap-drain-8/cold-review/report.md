# Cold plan review — `docs/plans/2026-11-17-roadmap-drain-8/plan.md`

Reviewer: read-only review subagent (opencode-go/deepseek-v4.1-flash)
Plan sha256: `5e4626ef9fd91ecebe90966942d6283a058c223fb17a937c6556631975059858`
Stages run: 1 (zoom-out), 2 (comprehension), 3 (critics, three lenses), 5 (readiness).
Stage 4 not triggered — no author edits were made in this pass.
Budget: 32/40 read·grep calls. Repo root respected; no scan outside the artifact, its targets,
and the cited predicates.

**Comprehension (Stage 2): faithful-with-gaps.** The plan is understandable without context: add
four outputs (three labelled ERROR classes, one `console.log` summary) to
`checkCouplingCompleteness` in `scripts/validate.ts` so the REQ-evidence-linkage register stops
reporting `T420`/`T425`/`T439`; regenerate the corpus and coverage register; update ROADMAP,
review-register, CHANGELOG; probe the assertions by mutation; close. The gap a reader cannot
resolve: the plan claims the non-emptiness assertion is the one missing piece and that a mutation
probe can make it fire — it cannot (Blocker 1). Ordering, blast radius, done bar, and rollback
are all present and explicit.

## Findings

### Blocker 1 — `[design]` The non-emptiness assertion cannot fire, so V3 and the "Assertions" done bar are unsatisfiable

Artifact: `plan.md:33-37` (EV4), `:111` (D4 output 1), `:189-193` (P2), `:140-141` (done bar),
`:222` (V3).

Predicate — `scripts/validate.ts:1087` and `:1090`:

```
const cols = line.split("|").map((s) => s.trim()).filter(Boolean);
...
const archetypeStr = cols[1];
```

`filter(Boolean)` drops an empty archetype cell before column indexing, so the row
`| Scene |  | read/write | read-only |` parses to `cols = ["Scene","read/write","read-only"]`
and `archetypeStr = "read/write"` — the **GM access** cell. `archetypes` is then
`["read/write"]`, not `[]`: the existing `WARNING` at `:1097` fires and no non-emptiness
condition is observable. `archetypes: []` at `:1095-1100` is reachable only when the cell is a
non-empty token that splits to nothing (e.g. `,`), and a 2-column row is dropped outright at
`:1088`.

Consequences, each of which the plan asserts the opposite of:

1. **EV4 is false** ("accepts an empty archetype cell silently (`:1095-1100` pushes
   `archetypes: []`)", `plan.md:35-36`). It does not push `[]`; it misreads the next column.
2. **V3's expected output cannot occur** (`plan.md:222`). The D4 output 1 ERROR is unreachable
   by the stated probe.
3. **The done-bar item is unsatisfiable** — "the three ERROR classes fire under their mutation
   probes (V3–V5)" (`plan.md:140-141`) — and P3 has no fallback branch: the fallback bar
   (`:154-156`) covers only D5 *data* defects found at plan time, not a failed probe.
4. **The T425 summary is vacuous by construction** (`plan.md:115-116`, `:220`). `propGroups` can
   never hold an archetype-less entry from a short cell, so `n/total` is invariant at `41/41`.
   The assertion cannot detect the condition REQ-374b names ("Every property group in §7.7
   carries ≥1 archetype", `spec/02-requirements.md:3844`), which defeats D7's stated purpose
   (`plan.md:131-134`).
5. **The fix is excluded by the plan's own constraints.** P2 says the check "iterates
   `propGroups` after `:1100`" (`plan.md:189-190`) and D2 says "reusing the parsed `propGroups`"
   (`:97-98`); `propGroups` retains no column count, so a pass/fail on "no archetype" requires a
   parse amendment that the blast radius (`:160-168`) does not carry.

What must change: either (a) amend the parse to retain the row's column count or a
`missingArchetype` flag, name that change in the blast radius and P2, and keep V3; or (b) keep
the parse and replace V3 with a probe that genuinely yields `archetypes: []` (a comma-only
cell), restating D4 output 1 accordingly — and in either case correct EV4's "silently …
`archetypes: []`" claim. As written the plan cannot be executed to its own done bar.

### Major 1 — `[design]` V8's command cannot return its expected value

Artifact: `plan.md:227`.

Predicate: `ROADMAP.md:36-53` (item 3, three bullets), `:55-62` (item 4, bullets at `:57` and
`:59`), `:64-74` (item 5, bullets at `:66` and `:69`).

`sed -n '/^## REQ evidence linkage/,/^## Non-goals/p' ROADMAP.md | grep -c '^- '` sweeps items 3,
4 and 5 — seven bullet lines, never `3`. The step is not observable as written, so an implementer
running V8 sees a red reading on a correct ROADMAP edit. Scope the range to the item-3 section
(terminate at `^## Split `, or stop at the next `^## ` heading).

### Major 2 — `[design]` The conformance ratchet baseline is outside the blast radius while `check-conformance` is in the done bar

Artifact: `plan.md:148-150` (done bar), `:158-168` (blast radius), `:238-240` (R3).

Predicate: `scripts/validate.ts:1759-1762` —

```
// B2 ratchet baseline: recorded in spec/audit/conformance-baseline.json. A
// count above the baseline is an error (no new nominal evidence); below is fine.
const BASELINE_PATH = ... "spec", "audit", "conformance-baseline.json";
```

The increment moves REQ-369b/REQ-374b evidence into the function that already carries
REQ-370's labels (`:1188`, `:1215`), i.e. it changes bundle membership — the exact input the
`bundledOnlyBucketC` ratchet scores. The plan requires `check-conformance` PASS, names only
`spec/audit/req-coverage.md` in the blast radius, and R3's remedy is "read and record … never
reverted", which is not a remedy for a ratchet error. Add `spec/audit/conformance-baseline.json`
to the blast radius with the decision (raise with recorded rationale, or a bundling step that
keeps the count flat), or state that a baseline move stops the increment. *Unverified whether
the count actually moves — see Unknowns.*

### Nits

- **N1** `plan.md:224` (V5 expected "one `ERROR: T420/T439`"): deleting the four Mechanics rows
  (`spec/04-runtime.md:540-543`) also leaves P34–P37 with zero rows, so four `ERROR: T435`
  (`:1188`) fire alongside. Name the full expected set so the probe reading is unambiguous.
- **N2** `plan.md:28` cites the property table as `spec/04-runtime.md:260-302`; it spans
  `:259-301` (header `:259-260`, rows `:261-301`). Same class: `plan.md:192` cites `:1125` for
  "after the coupling rows are parsed", but `:1125` is inside the row loop — the completed
  `couplingRows` are available at `:1141`.
- **N3** `plan.md:112-113` (D4 output 2) duplicates the surviving `WARNING` at `:1097` for an
  unrecognized token, so one bad cell yields two findings. Say which is intended, so a later
  reader does not "fix" the overlap by deleting the WARNING D4 promises to keep (`:117`).

## Evidence claims EV1–EV9

| # | Status | Basis |
|---|---|---|
| EV1 | **Verified** | `corpus.md` is 59 lines, 57 rows (`:3-59`), every row `Automated \| automated-unexercised`; `T420` `:45`, `T425` `:52`, `T439` `:53`; tree clean except the new plan dir (sidecar), so identical to the committed file. `ROADMAP.md:36-53` carries item 3 with 57 findings. |
| EV2 | **Verified** | `scripts/lib/req-checks.ts:887` (`if (!input.exercised.has(tid))`) and `:892` (`decisionsText === null`) sit in the cited ranges; corpus shows `automated-unexercised` / `manual-undocumented` verdicts. |
| EV3 | **Verified** | `spec/appendices-reference.md:1890` T420, `:1895` T425, `:1909` T439; `spec/04-runtime.md:259-301` table, `:325` `#### 7.7.0`, `:528` `##### 7.7.1a`, `:641-671` curation prose; `ROADMAP.md:43-44` names the family and `scripts/validate.ts:1097`. |
| EV4 | **FALSE in part** | "never counts the groups, never asserts taxonomy-archetype usage" verified. "Accepts an empty archetype cell silently … pushes `archetypes: []`" is false — see Blocker 1 (`scripts/validate.ts:1087`, `:1090`). |
| EV5 | **Verified** | `labelsFromContent` `req-checks.ts:854`; `checkFunctionRanges` `:812-823` (label shape needs `function check*(): string[]`); `EVIDENCE_ID_RE = /\b([TIS]\d+[a-z0-9]*)\b/g` `:688`, so `T420/T425` yields both IDs (D4's combined labels work); `validate.ts:1443` `ROOT_SCRIPT_FILES = walkTsFilesRaw(__dirname)`, consumed at `:1469-1473`; `T421` `:1215`, `T435` `:1188` absent from the corpus while `T420/T425/T439` are present. |
| EV6 | **Verified (counts)** | 41 groups (`spec/04-runtime.md:261-301`); 102 coupling rows (grep of `^\| .+ (→\|↔) .+ \| P\d+ \|` = 102); 12 archetypes plus `[content source]`; the three uncoupled groups are `Ruling Ledger` `:266`, `Adventure` `:267`, `Adventure Scene Waypoint` `:268`, two of them content sources. Caveat: "0 empty archetype cells" is not a measurement this parse can express — see Blocker 1. |
| EV7 | **Verified** | `spec/04-runtime.md:643-647` ("The table is curated — not every combinatorially possible archetype-pair instantiation is a meaningful coupling"); `:662-665` excludes Adventure/Adventure Scene Waypoint/Adventure Index/Codex and limits the session-scoped groups. |
| EV8 | **Verified** | `spec/04-runtime.md:327` "classified into 12 archetypes"; `scripts/validate.ts:1058` `VALID_ARCHETYPES` lists exactly those twelve. (Note `§7.7.0` does not enumerate them in prose — the constant is the only enumeration, which is what D4 output 2 compares against.) |
| EV9 | **Verified** | `checkAppendixFAssertions` `scripts/validate.ts:1735-1758` scans only `TTRPG_*` tokens; none of T420/T425/T439's row text (`appendices-reference.md:1890,1895,1909`) names one; `T435` `:1188`, `T421` `:1215`, and the REQ-370a token check `:1174-1181` are already present and untouched. |

## Done-bar items

| Item | Status |
|---|---|
| Assertions — four D4 outputs emit; three ERROR classes fire under V3–V5 | **Unsatisfiable** — V3 cannot fire (Blocker 1). V4 works (vocabulary equality catches `Bogus`); V5 works but emits extra T435 errors (N1). |
| Linkage — `54 finding(s)`, corpus 56 lines, names none of the three | Verified feasible: 57−3 arithmetic holds; `--write-linkage-corpus` writes a 2-line header + one row per finding (`validate.ts:2651-2656`); flag exists at `:2651`. |
| Registers — ROADMAP residue 54 / three bullets, dated review-register subsection, coverage diff | Feasible: `check-roadmap.ts:24` `MAX_BULLETS = 3`; `register-checks.ts:64-69` requires Scheduled-roadmap `REQ-` tokens to exist in ROADMAP, so D6's "T-IDs and dates, no `REQ-` tokens" is correct; the chunk-6 subsection (`review-register.md:3198-3216`) is the right precedent (prose under `## Scheduled-roadmap`). The **observation** step V8 is broken (Major 1). |
| Gates — `check:fast` un-piped, `check-registers`, `check-roadmap`, `check-conformance`, `test:spec-tooling`, assemble idempotent | Gate names all exist in the manifest; no spec prose edit → assemble hash check is sound. `check-conformance` carries the unbooked ratchet risk (Major 2). |
| Close — one commit, `aar.md` with probes, anchor delta, `LOOP PAUSED` | Consistent with the house contract and `session:close --single`. |

## Scope / quality checks (spec-project-checks)

- **Register coupling** — all three cross-referencing surfaces are named in one step (D6, P4).
  Pass.
- **Fingerprint/target membership** — no spec section is edited, and D5 correctly refuses a §7.7
  data fix inside this increment. Pass, except the unbooked conformance baseline (Major 2).
- **Spec-addition blast radius** — N/A (no REQ added).
- **Resolves coverage** — no `**Resolves:**` fields, no spec-review report; N/A.

## Unknowns (not settled within budget)

1. Whether `check-conformance`'s `bundledOnlyBucketC` actually moves for REQ-369b/REQ-374b
   (Major 2). Both are builder-side (bucket E per `review-register.md:3205-3206`), which may keep
   the count flat; the plan should still name the decision.
2. The plan's runtime baseline (`check:fast` exit 0, 46 gates, 141 unpushed commits, tag
   `v2026.11.08`) was not re-run — gates were outside this pass's read-only budget.
3. EV4's second half — "a repo-wide grep finds no other non-emptiness assertion"
   (`plan.md:38-40`) — was not re-grepped; the cited absence is consistent with the code I did
   read.
4. Whether `check-loop-artifacts` runs "strict" inside `check:fast` (T5 claim, `tasks.md:57`) was
   not verified; it does not affect any finding.

```
independent-review FAILED. [plan.md] — 1 blocker

1. [design] The non-emptiness assertion cannot fire: `filter(Boolean)` at scripts/validate.ts:1087
   collapses an empty archetype cell into the GM-access column, so `archetypes` is never `[]`.
   EV4 (plan.md:35-36) is false, V3 (plan.md:222) cannot emit its expected ERROR, the done-bar item
   at plan.md:140-141 is unsatisfiable, and the T425 summary is invariant at 41/41. The plan's own
   P2 constraint (plan.md:189-190) forbids the parse amendment that would fix it, and the fallback
   bar (plan.md:154-156) covers only plan-time data defects. Retain the column count/flag and book
   the parse change in the blast radius, or replace V3 with a probe that genuinely yields `[]`.

Majors: 2 — V8's sed range sweeps ROADMAP items 3–5 (7 bullets, never 3); the conformance ratchet
baseline (scripts/validate.ts:1759-1762) is unbooked while check-conformance is in the done bar.
Nits: 3 (V5's expected error set; two off-by-a-few line cites; duplicated vocabulary finding).
reads 32/40
```

---

## Diff re-review — revision 1 → 2

Artifact: `docs/plans/2026-11-17-roadmap-drain-8/plan.md`, sha256
`874eec98e78fe3100f0820f42beb888e7d2055332fea5153a709a1a3f79829f7`
Scope: changed regions 1–14 only. Reads used: 6 of 10. No new-lens sweep.

- **Blocker 1 — resolved.** The parse amendment (D2, P2) makes an empty archetype cell yield
  `cols[1] = ""` and `archetypes: []`; D4 output 1 fires; the summary reads `40/41`.
- **Major 1 (V8 awk) — resolved.** The `awk` skips the item-3 heading and exits at
  `## Split \`index.ts\``; `grep -c '^- '` prints `3`.
- **Major 2 (conformance ratchet) — resolved in R3.** The stop rule is stated and the baseline is
  outside the blast radius; `checkBundledEvidence` scores harness test names, which the new
  `check*` labels are not.
- **Carried Major (surfaced by the changed V3/V4 cells) — V3/V4 cascade into `T421`.** Emptying or
  corrupting `Scene`'s archetype also breaks every coupling row naming `Scene`
  (`scripts/validate.ts:1211-1215`; e.g. `Countdown → Scene` P39 at `spec/04-runtime.md:594`), so
  the probes emit several `T421` errors. The intended message still fires, so the done bar holds;
  the fix is to probe `Ruling Ledger` (`spec/04-runtime.md:266`), which has no coupling row, or to
  name the `T421` cascade in the Expected cells. Recorded as condition C-1 for build-review.
- **Nits:** the fallback bar's stop point is now P2/P4, not P1 (parse lands in P2); the review
  history's stage attribution should name the stage-5 readiness lens, where the Blocker and both
  Majors were raised; "four outputs" reads better as "three error classes, one summary".

```
independent-review passed. [plan.md] — revision 2, 5/5 stages (stage 4 not triggered)

Cold pass: diff re-review of revision 1 → 2 · reads 6/10 · independence fresh
Target: docs/plans/2026-11-17-roadmap-drain-8/plan.md · sha256 874eec98e78fe3100f0820f42beb888e7d2055332fea5153a709a1a3f79829f7
Blocker 1: resolved · Major 1 (V8 awk): resolved · Major 2 (conformance ratchet): resolved in R3
Blockers: 0 · Majors: 1 (carried: V3/V4 probe cascades into T421) · Nits: 3
Comprehension: faithful
```

Plan sha256: 874eec98e78fe3100f0820f42beb888e7d2055332fea5153a709a1a3f79829f7
