# Plan — Anchor repair: identity, not proximity, and a declared offset

**Date:** 2026-11-17 · **Kind:** planned · **Depth:** standard · **Revision:** 4 ·
**Increment:** `docs/plans/2026-11-17-anchor-repair-gap` · **Rollback cost:** 1 ·
**Evidence:** git HEAD `4c1e679`; tracked tree clean at plan time, so every baseline below is
recoverable with `git checkout -- <path>`. Readings on this tree: `npm run check:fast` exit 0
(`46 passed, 0 failed`, trailing `check:fast: PASS`); `npx tsx scripts/test-anchor-tooling.ts`
exit 0 (`20 passed, 0 failed`); `npm run check-anchors` exit 0 (`predicates current`);
`npm run status` — 4 open roadmap items, 149 unpushed commits, tag `v2026.11.08`, last pipeline
run stopped at `record`.
**Trust boundary:** every premise below is `repo` evidence read from this checkout. No web or
user-supplied content is embedded. The scratch-tree reproduction runs in `/tmp/opencode`.
**Review history.** Revision 1 was read by one cold pass (five stages in one reviewer context, 25
reads, `plan.cold/report.md`): two Blockers, four Majors, seven Nits. The Blockers were both
design: D6's `(written; delta +2)` cannot match the existing `\(written\)` assertions
(`scripts/test-anchor-tooling.ts:85`, `:120`), and an offset miss fell back to `--repath`, which
excludes the recorded path (`scripts/lib/anchor-resolver.ts:77`) and could bind a sibling file that
never held the anchor. The Majors were an unstated residual (a coincidentally-carried line still
self-validates), a CLI assertion count stated three incompatible ways, a register disposition left
under `Scheduled-roadmap` with a report-only `check-registers` as acceptance, and undefined
`--offset` scope over unselected anchors. Revision 2 resolves all thirteen: the delta moves outside
the parenthetical; the repath fallback now requires zero carriers in the recorded file and is
covered by C16; D1 states the residual and the Done bar claims only "the recorded line no longer
carries the symbol"; the suite total is fixed at 44 assertions over 24 labels; the register gains a
`## Resolved` section with the in-place paragraph pointing at it and accepts on
`check-registers:strict`; `--offset` is specified as layering on the full scan; `--offset`'s
guarantee is restated as "the declaration is the evidence"; the value-flag skip moves into
`scripts/lib/args.ts`; EV6 cites `eval-predicate.ts:80-124` and narrows its discovery claim; U7 is
labelled signature-level; the `C2` collision and the `:31` → `:33` citation are fixed; and
`probe.md` has one owner (P4). Revision 2 was read by the single diff re-review at the standard
cap (10/10 reads, `plan.cold/review-r2.md`): 2/2 Blockers, 4/4 Majors and 7/7 Nits RESOLVED, with
three new Nits and three Deferred findings in unchanged text. Revision 3 is a text-only amendment
that resolves all six: `rejectUnknown`'s parameter ordinal corrected (N-1); the fallback gate
restated as "zero candidate lines", D1's actual precondition (N-2); V1 states that a label groups
assertions (N-3); D8 probe 3 now names its setup edit and D2 pins the offset-miss stderr text
(`offset target … does not carry '…'`); the "two `includes()` sites" claim is corrected to the
single site at `:140`; and `--from-line` integer validation plus the no-flag report-only default
are added to the validation list. Revision 3 was read by a targeted delta pass (4/5 reads,
`plan.cold/review-r3.md`), which found one Major in the changed text — V1's per-label grouping
could not sum to the stated 44, because it omitted the 11 assertions of the four pre-existing
`repath:` cases — and two Nits. Revision 4 fixes all three: V1 now states the full arithmetic
(8 unit + 25 C-labelled + 11 `repath:` = 44); the `rejectUnknown` ordinal reads "fourth" again;
and D8 probe 3 requires the offset to be chosen so the shifted line is non-carrying, quoting the
full pinned message. Two unchanged-text items the same pass noted are also corrected while the
text was open: P3's "zero occurrences" now reads "no candidate line", and D2 pins the
empty-selection message.

## Questions

The request: "draft plan for open roadmap items." `ROADMAP.md` carries four sections; three are
operator-bound or trigger-gated and cannot start in this session (EV5). The fourth, *Split
`index.ts`*, is trigger-gated but carries a third bullet that is a **demonstrated defect**, not a
feature: after the stage-1 block move, "a block move shifted 20 anchors past the resolver's ±40
window and `fix-anchors` matched eight nearby wrong lines silently" (`ROADMAP.md:43-45`).
Review-loop governance classifies demonstrated wrong output as P0 — fix in session — so this
increment closes that bullet and leaves the split itself untouched.

## Why

- **EV1 — the defect is named with its predicates.** Stage 1
  (`docs/plans/2026-11-17-index-split-1/aar.md:95-101`) records it: the resolver accepts any
  candidate inside a ±40-line window (`scripts/lib/anchor-resolver.ts:53-68`), and the writer
  treats a recorded line that merely *contains* the symbol as current
  (`scripts/refresh-predicates.ts:140`, a substring test). Twelve anchors were refused as
  ambiguous; eight were bound to a nearby wrong occurrence, and because the wrong line carries
  the symbol, `check-anchors` then reports `predicates current`.
- **EV2 — proximity is not a discriminator on this corpus, so the eight were a coin flip.** A
  scan of the seven anchor source files (`holonovel/scripts/holosuite*.ts`,
  `holonovel/scripts/lib/holosuite-*.ts`, the same set `anchorFiles()` reads) finds **39 anchors,
  all 39 currently on a carrying code line, 34 of them naming a symbol carried on more than one
  code line in the recorded file**: `err` 378 candidates, `registerResource` 66, `recap` 44,
  `prompt` 40, `rooms` 26, `manage_history` 24, `verify` 21. For those 34, "the nearest candidate
  within 40 lines of a stale number" is an arbitrary choice among dozens. The count comes from a
  scan that imports `candidateLines` from the resolver and walks `anchorFiles()`'s seven sources;
  P1 re-runs it and records the snippet and the numbers in `tasks.md`, so the figure is
  reproducible rather than asserted.
- **EV3 — the failure reproduces on the current tool, and the reproduction self-validates.** A
  scratch tree with `index.ts` carrying `err` at lines 1 (definition), 5 and 47, and an anchor
  recorded at 42, produced:
  `holonovel/src/index.ts:42#err -> holonovel/src/index.ts:47 (written)`, exit 0; a following
  `--check` printed `predicates current`, exit 0. The write bound the anchor to the call site at
  line 47 — the third `err` occurrence, seven lines from the stale number — while the definition
  sits at line 1; nothing reported it.
- **EV4 — the substring predicate is a second, latent false pass.** `refresh-predicates.ts:140`
  tests `lines[recorded - 1].includes(symbol)`, so a recorded line carrying `symbol` inside a
  longer identifier (an anchor on `err` recorded at a line holding `error(`) self-validates
  forever. Today zero anchors rely on it (EV2 measured every recorded line as a whole-word code
  line), so tightening the predicate is free now and closes the class before it is used.
- **EV5 — the other three roadmap items cannot start in this session.**
  - Independent verification (`ROADMAP.md:15-23`): requires a cold checkout, a redacted
    DECISIONS.md (6), and "a fresh agent session — a different model from the builder"
    (`spec/07-independent.md:11-18`); its trigger is the first publish after 2026-11-16 and the
    last pipeline run stopped at `record`. Not startable here.
  - Mutation-sample depth (`ROADMAP.md:25-34`): the trigger is "the next Holosuite lens change";
    this increment adds no lens and changes no Holosuite lane.
  - Codex pack (`ROADMAP.md:50-60`): P3, trigger is "the next artifact-registry change
    (REQ-620/REQ-621), or a request to move a codex library between hosts". Neither applies.
  - Split `index.ts` stage 2: the trigger is "the next increment that moves more than 50 anchors,
    or a week with more than 100 reads of one file" (`ROADMAP.md:46-48`). This increment moves no
    anchor (the live tree is current, EV2) and does not touch server source; the item stays open
    with two bullets.
- **EV6 — nothing else imports the resolver; a second, independent implementation of its rule
  exists.** `ANCHOR_WINDOW`, `resolveAnchorLine` and `resolveAnchorInRoot` are imported only by
  `scripts/refresh-predicates.ts` and `scripts/test-anchor-tooling.ts` (grep over `*.ts`). The
  anchor literal is built by a test helper, `anchor(path, line, symbol)` at
  `holonovel/scripts/lib/eval-predicate.ts:24`, and parsed by the scanner regex at
  `refresh-predicates.ts:33`; no REQ binds its shape (the spec's "anchor" terms are ruleset source
  anchors, a different concept). Separately, `eval-predicate.ts:29-30` parses `path:line#symbol`
  and `:80-124` resolves it with a whole-word, code-line, comment-rejecting test — the rule D1
  adopts as `lineCarriesSymbol`, already enforced at Holosuite runtime. That is supporting
  evidence for D1 (the repair tool should agree with its consumers), and it is why the
  existing-check discovery is scoped to *gates*: `check-anchors`
  (`scripts/lib/gate-manifest.ts:330-335`) is the only anchor gate in the manifest, and no other
  script parses `anchor(...)` besides `refresh-predicates.ts`. So this increment extends the
  existing check rather than adding a second one, and no manifest row is added. No tool action,
  parameter, or output contract changes in the server, so there is no sibling-REQ contract to
  reconcile and no routing/registration surface to update.

## Decisions

- **D1 — Delete the proximity rule; resolve by identity.** `resolveAnchorLine` becomes
  `resolveAnchorSymbol(lines, symbol)`, returning the existing `AnchorResolution` shape (a line or
  `null`, plus the ambiguous candidate list) and taking no line number. The shared predicate
  becomes an export, `lineCarriesSymbol(line, symbol): boolean`, in
  `scripts/lib/anchor-resolver.ts`:
  - the caller first tests the recorded line with `lineCarriesSymbol(line, symbol)` — trimmed
    line is a code line (not blank, not `}`/`)`/`;`-only, not a comment opener) and matches the
    symbol as a whole word. That test replaces the single `includes()` test at
    `scripts/refresh-predicates.ts:140` (EV4);
  - if the recorded line carries the symbol, the anchor is current — no resolution runs;
  - otherwise: one candidate line in the file → that line (accepted however far it moved — the
    line is not a guess, it is the only line that can carry it); two or more → **ambiguous,
    naming every candidate line**; zero → not in this file (the `--repath` path or unresolved).
  `ANCHOR_WINDOW` and the nearest-wins branch are deleted. `candidateLines` is expressed through
  `lineCarriesSymbol` so the code-line and whole-word rules exist once (`check-script-quality`'s
  duplicate-helper detector refuses a second copy). The rule is not novel: the Holosuite predicate
  runtime already resolves `path:line#symbol` with a whole-word, code-line, comment-rejecting test
  (`holonovel/scripts/lib/eval-predicate.ts:80-124`), so this aligns the repair tool with the rule
  its consumers enforce. **Stated residual:** a line that *coincidentally* carries the symbol —
  for example a dense name like `err`, where a block move happened to put an unrelated call site
  on the recorded number — still self-validates, because the format records no content
  fingerprint (D2 rejects one). This increment closes the class "the recorded line no longer
  carries the symbol"; it does not close "the recorded line carries the symbol by coincidence",
  and the Done bar claims only the former.
  Consequence, stated for the record:
  a stale anchor whose symbol is carried on several lines can no longer be repaired without a
  declaration (D2); it was previously repaired by a guess.
  - Rejected: keep the window as a fallback behind `--offset`. The fallback *is* the defect;
    `--offset` would be an optional ceremony around the same guess.
  - Rejected: raise the window or require a distance margin. Every one of stage 1's eight wrong
    bindings lay inside the window; the failure is proximity-as-evidence, not window width.
  - Rejected: refuse only when two or more candidates fall inside the window. Each of the eight
    had exactly one wrong candidate in range, so this rule reproduces the defect.
- **D2 — `--offset <n>` is the declared repair for a move, and every target line is verified.**
  New flags on `refresh-predicates`, parsed through `scripts/lib/args.ts` (`parseValueFlag`):
  `--offset <signed integer>` requires `--path <recorded path>`; `--from-line <N>` is optional and
  requires both. **Scope:** the run still scans every anchor in every anchor source; `--offset`
  layers a declared shift on the selected set and changes nothing about the others. Unselected
  anchors follow D1 (current, unique-candidate repair, or refusal), so a single command reports
  the whole corpus and the exit code still means "some anchor is unresolved". Semantics for the
  selected anchors (recorded path equals `--path`, recorded line ≥ `--from-line`, default 1):
  - recorded line carries the symbol → untouched (an anchor the move did not displace is not
    offset; this is what makes a single declared offset usable across a cut without a second
    range flag);
  - else target = recorded + offset; if 1 ≤ target ≤ file length and the target line carries the
    symbol → rewrite the line (path unchanged), reported with its delta;
  - else the anchor is **unresolved**: stderr line, exit 1, nothing written for it. The message is
    `offset target <path>:<target> does not carry '<symbol>' (anchor <source>:<path>:<recorded>)`,
    so a caller can grep it and a human sees both ends of the declared shift.
  **What "verified" means here.** The target must carry the symbol as a code-line whole word, but
  the tool cannot prove it is the *intended* occurrence — with 378 candidate lines for `err`, the
  evidence that the line is right is the operator's declared shift, not a uniqueness test. The
  tool's guarantee is "the declaration is applied only where the number lands on a carrying line";
  the declaration itself is the evidence. This asymmetry with D3 (which can demand a unique
  candidate because no number was declared) is deliberate and is named here so "verified" is not
  read as "proved".
  **The `--repath` fallback is gated.** `fix-anchors` is `refresh-predicates --write --repath`
  (`package.json:94`), so an operator who adds `--offset` keeps `--repath` implicitly. An offset
  miss must therefore fall back to the in-root repath **only when the recorded file carries zero
  candidate lines** — no `lineCarriesSymbol` match anywhere in it, which is D1's precondition. If
  the recorded file still carries the symbol on some candidate line, the offset was wrong or the
  symbol moved inside the file; the anchor is unresolved and the message says so, because
  `resolveAnchorInRoot` excludes the recorded path and would otherwise bind a *sibling* file that
  never held the anchor.
  Validation (exit 1, stderr, no write): `--offset` without `--path`; `--path` without
  `--offset`; `--from-line` without both; a non-integer or zero offset; a non-integer or
  non-positive `--from-line`; `--path` selecting zero anchors (a typo must not be a silent no-op,
  message `no anchor records path <p>; --path must name a path an anchor actually records`).
  `--offset` with `--check` computes and reports without writing; `--offset` with neither
  `--check` nor `--write` is report-only, matching today's default. Noted for script callers:
  under `--check`, a *correct* offset yields pending drift (exit 1) and a *wrong* one yields
  unresolved (exit 1); only the stderr text distinguishes them.
  - Rejected: a content-hash fingerprint in the anchor (a fourth `anchor()` argument). It is the
    only construct that survives *every* move and edit unaided, but it changes 39 call sites plus
    the `anchor()` helper, and it makes any legitimate edit to an anchored line red the gate with
    no repair path short of re-blessing a hash. The declared offset buys the same protection for
    the one event that hurts (a block move) at no format cost.
  - Rejected: `--at <path>:<line>` as a hand-inspection escape hatch. An operator who has read
    the candidate list can edit the anchor literal; the tool's job is to refuse, not to bless.
  - Rejected: inferring the move from the instrument's own history (a saved line-count, a `git
    diff` offset). The tool is invoked from odd worktrees and scratch trees and has no history to
    read; a declared number is honest and testable.
- **D2a — A negative offset must survive argument parsing.** `parseValueFlag`
  (`scripts/lib/args.ts:11-17`) returns the next token unless it starts with `--`, so `-1300`
  parses correctly; but `rejectUnknown` (`:29-37`) rejects any `-`-prefixed token outside its
  known set, so `--offset -1300` would be refused as an unknown flag. Rather than a local
  workaround, `rejectUnknown` gains an optional fourth parameter naming the value-taking flags it
  must skip a token for (`rejectUnknown(argv, known, usage, valueFlags)`); the default keeps every
  existing caller's behaviour. AGENTS.md's rule that scripts with more than one flag parse through
  `args.ts` then holds, and the next value-taking script inherits the fix. The parameter is
  optional and additive (`rejectUnknown(argv, known, usage, valueFlags)`), so every existing caller
  is unchanged. A missing value still exits 1 with a usage line. Tested as C14 (negative offset
  applies) and C15 (missing value is an error).
- **D3 — `resolveAnchorInRoot` refuses a carrier file whose candidate line is not unique.**
  Today it takes a single carrier file and then picks the nearest in-window line or "the file's
  first carrying code line" (`scripts/lib/anchor-resolver.ts:108-110`) — the same proximity guess
  one level down, and the recorded number belongs to another file, so the window is meaningless
  there. New rule: exactly one carrier file (unchanged) **and** exactly one candidate line in it
  → resolve; more than one → ambiguous, and the message names `path:line` for every candidate;
  zero → unresolved.
  - Live impact: the one repathed anchor (`knowledge_query`, recorded on
    `holonovel/src/tools/knowledge.ts:98`) is current, so no resolution runs today; the rule only
    governs future moves.
- **D4 — Every rewrite is verified twice: before the write and after it.** The pre-write
  verification is D1's predicate on the chosen line. The post-write pass re-reads every edited
  anchor source file and re-verifies **each anchor that this run rewrote** — a writer bug must not
  leave a bad line behind while the run reports success. It does not re-report anchors that were
  already unresolved (those are reported once, by the resolution pass). This is the roadmap
  bullet's "verify every rewritten line" made mechanical.
- **D5 — A move's offset is discoverable, not guessable.** In text mode only (`--json` output is
  unchanged), for each file with ≥2 stale anchors the tool counts, per anchor, the delta to its
  nearest candidate line and prints one stderr line when a delta occurs at least twice and more
  often than any other:
  `hint: 20 anchor(s) in holonovel/src/index.ts share a delta of -1299; declare it with --offset -1299 --path holonovel/src/index.ts`.
  The hint is advisory: it never changes the exit code, never writes, and never decides which line
  an anchor receives — it is arithmetic over the candidate list reported to stderr. It is named
  `hint` in every case so it cannot be read as a verdict.
  - Why bother: after D1, a block move's repair is a command the operator must construct; the
    stage-1 move's modal delta (-1299 across 20 anchors) is exactly the number the hint would
    have produced, and the wrong bindings' deltas (e.g. `recap`'s -2) are outliers by comparison.
    This is the one place a heuristic earns its keep, because it is a suggestion to a human and
    not a gate.
- **D6 — Report the delta on every rewrite.** The existing line format gains a suffix rather than
  changing: `source: path:from#symbol -> path:to (written) [delta +2]`. The parenthetical stays
  byte-identical, so the assertions at `scripts/test-anchor-tooling.ts:85` and `:120`
  (`\(written\)`) keep matching without a test rewrite; the delta rides after it, in ASCII.
- **D7 — Registers and roadmap, same step.** `ROADMAP.md` item *Split `index.ts`* loses its third
  bullet (the gap) and keeps its first two; the admission rule's section shape (bullets plus
  `**Trigger:**`) still holds, and `npm run check-roadmap` gates it. The review register changes
  twice, mirroring the linkage precedent exactly:
  - the Scheduled-roadmap subsection `### 2026-11-17 index.ts split (P2) — the anchor window
    cannot follow a block move` (`spec/audit/review-register.md:3088-3099`) gains a dated closing
    paragraph (`**Closed 2026-11-17** (<increment path>) …`) that points at the Resolved section,
    as `:3141-3142` points at `:3907`;
  - a new terminal section `## Resolved — 2026-11-17 anchor repair: identity resolution and a
    declared offset` is appended after the current last section
    (`## Resolved — 2026-11-17 REQ evidence linkage closed`, `:3907`), carrying the finding ID, the
    predicate that failed, and how it was fixed — the shape of `:3909-3925`.
  Both are prose paragraphs carrying a date; a `- **…**` bullet under `Scheduled-roadmap` that
  cites a `REQ-NNN` absent from ROADMAP.md is an error (`scripts/lib/register-checks.ts:54-72`).
  `npm run check-registers` is report-only (`scripts/check-registers.ts:54` exits 0 on findings),
  so the acceptance is `npm run check-registers:strict`, which is the gate with teeth and the one
  the register contract intends.
  `scripts/lib/gate-manifest.ts:332` gains the new contract in its `check-anchors` description, so
  the AGENTS.md gate table must be regenerated (`npm run check-gate-table` compares them).
- **D8 — Probes are negative, live, and restored.** Each behaviour is proven by a failure, then
  the artifact is restored and `git status --porcelain` confirmed empty:
  1. **wrong-nearest**: move one live multi-candidate anchor to a line whose nearest candidate is
     a different occurrence (chosen in P4 by measuring candidate lines, e.g. an `err` anchor);
     `npm run check-anchors` exits 1 naming the ambiguity, `npm run fix-anchors` exits 1 and
     leaves the anchor bytes unchanged;
  2. **substring**: move one anchor to a line carrying the symbol inside a longer identifier;
     `npm run check-anchors` exits 1 (before this change it would have passed);
  3. **offset-verify**: first move a live anchor's recorded line off its carrying line (the same
     setup edit probes 1–2 use), then choose the offset so the shifted line is a **non-carrying**
     line — measure the candidate set first, as P1 does, so the probe does not accidentally land on
     another occurrence of a dense symbol. Run `--write --repath --offset <n> --path
     holonovel/src/index.ts --from-line <that anchor's line>` — `--repath` is present because
     `fix-anchors` carries it, which is the shape under test: with the symbol still carried
     elsewhere in the recorded file, the guarded fallback refuses rather than searching a sibling
     file. Exit 1 with `offset target holonovel/src/index.ts:<target> does not carry '<symbol>'
     (anchor <source>:<path>:<recorded>)` and nothing written;
  4. **offset-selection**: `--check --offset 1 --path holonovel/src/nonexistent.ts` exits 1 with
     `no anchor records path`.
- **D9 — Scope: one increment, no spec edit, no server-source edit.** No REQ body changes, so no
  fingerprint surface moves and `npm run assemble` is not required; `check:fast` covers the
  register and gate-table changes. The commit is `--single`: the resolver rule, the offset flag,
  the verification pass and the register close are one product (a repair path that cannot guess),
  and splitting them would leave a commit whose tool writes what the next commit refuses.

## Blast radius

| File | Change | Size |
|---|---|---|
| `scripts/lib/anchor-resolver.ts` | delete `ANCHOR_WINDOW` and the proximity branch; `lineCarriesSymbol`; `resolveAnchorSymbol`; repath single-candidate rule; header | M |
| `scripts/refresh-predicates.ts` | `--offset`/`--path`/`--from-line`; validation; recorded-line predicate swap; gated repath fallback; post-write verification; delta suffix; hint; header/usage/exit contract | M |
| `scripts/lib/args.ts` | `rejectUnknown` gains an optional value-flag set so a negative offset is not read as an unknown flag (D2a) | S |
| `scripts/test-anchor-tooling.ts` | 8 unit assertions (3 new, 1 deleted, 1 reworded, signature updates) and 22 new CLI assertions across C2–C16; suite total 44 = 8 unit + 25 C-labelled CLI + the 11 pre-existing `repath:` assertions | M |
| `scripts/lib/gate-manifest.ts` | `check-anchors` description names identity resolution and the declared offset | S |
| `AGENTS.md` | gate-table row regenerated from the manifest | S |
| `ROADMAP.md` | third bullet of *Split `index.ts`* removed | S |
| `spec/audit/review-register.md` | dated close paragraph on the Scheduled-roadmap subsection | S |
| `docs/plans/2026-11-17-anchor-repair-gap/plan.md` | this plan | S |
| `docs/plans/2026-11-17-anchor-repair-gap/tasks.md` | phase checklist | S |
| `docs/plans/2026-11-17-anchor-repair-gap/probe.md` | the D8 probe table with measured lines | S |
| `docs/plans/2026-11-17-anchor-repair-gap/aar.md` | written in P5 | S |
| `CHANGELOG.md` | rendered from the AAR block by `session:close` | S |

Rollback: every change is a tracked edit; `git checkout -- .` plus
`git clean -fd docs/plans/2026-11-17-anchor-repair-gap` returns the tree to `4c1e679`. No data
migration, no generated artifact, no spec source, no server source, no network. Ordering is
linear: P2 changes the resolver API that P3 consumes; P3's tests exercise D2–D6; P4 probes the
built behaviour; P5 records it. No commit happens between P2 and P3: the windowless resolver and
the offset land in one commit, because an intermediate commit would leave the gate red with no
repair path by design (that is the argument for `--single`, D9).

## Phases

- **P1 — Baseline and reproduction.** The error-gate dry run: this increment tightens an existing
  error gate, so the current tree must be clean under the tightened rule *before* the rule exists,
  and it is — all 39 anchors carry their symbol on the recorded line (EV2), so the identity rule
  changes no live verdict. P1 measures that rather than assuming it. Accept:
  `npm run check:fast` (`check:fast: PASS`, 46/46); `npx tsx scripts/test-anchor-tooling.ts` (20
  passed); `npm run check-anchors` (`predicates current`); the EV2 audit prints
  `total=39 exactLine=39 multiCandidate=34`; the EV3 scratch reproduction writes `:47` for a stale
  `:42` and then reports `predicates current`. Write `tasks.md` and record the audit snippet and
  its numbers there (`probe.md` belongs to P4).
- **P2 — Resolver: identity, not proximity (D1, D3).** Accept: `anchor-resolver.ts` carries no
  window constant and no nearest-wins branch (`grep -n "ANCHOR_WINDOW\|nearest" scripts/lib/anchor-resolver.ts`
  prints nothing); `resolveAnchorSymbol` has no line parameter; the single `includes()` test in
  `refresh-predicates.ts` (`:140`) is replaced by `lineCarriesSymbol`; the 8 unit assertions
  (U1–U8 in V1) pass; `npm run check-anchors` still prints `predicates current` on the live tree
  (all 39 anchors are current, so no resolution runs — the green reading is a control, not the
  proof).
- **P3 — Declared offset, verified writes, hint (D2, D2a, D4, D5, D6).** Accept: the flags and
  their validation behave as D2 and D2a state, including a negative offset and the
  value-token/flag separation; the repath fallback fires only when the recorded file carries no
  candidate line for the symbol (C16); every rewrite is verified before the write; the post-write
  pass errors on a rewritten line that does not carry its symbol; the CLI assertions C2–C16 pass and
  the suite prints `44 passed, 0 failed`; `tasks.md` records the measured total.
- **P4 — Live negative probes (D8).** Accept: four labelled failures, each with the exact gate
  output, each restored (`git status --porcelain -- <path>` empty); `npm run check-anchors`
  green again afterwards. Write `probe.md` with the anchor, the line, the output, and the restore
  command per probe.
- **P5 — Registers, docs, gates, close.** Accept: `ROADMAP.md` item *Split `index.ts`* carries two
  bullets and `npm run check-roadmap` passes; the register carries both the dated close paragraph
  and the new `## Resolved — 2026-11-17 anchor repair: identity resolution and a declared offset`
  section, and `npm run check-registers:strict` passes; the gate manifest's `check-anchors`
  description names the new contract, the AGENTS.md table block between its `gate-manifest` markers
  is regenerated with `npm run gates -- --list --format=md`, and `npm run check-gate-table` passes;
  `scripts/refresh-predicates.ts` and `anchor-resolver.ts` headers state the new contract, the
  flag groups, and the 0/1/2 exit codes. Then, in this order:
  write `aar.md` with the readings and its terminal token already filled → run V1–V8 and record
  every reading → finalise `aar.md` (probe evidence, changelog block, token confirmed) → run V2
  last, un-piped → `npm run session:close --single`.

## Verification

| # | Command | Expected |
|---|---|---|
| V1 | `npx tsx scripts/test-anchor-tooling.ts` | `44 passed, 0 failed` — 8 unit assertions (U1–U8, one each) + 25 CLI assertions under the C labels (C1 3, C2 3, C3 2, C4 2, C5 1, C6 1, C7 1, C8 1, C9 2, C10 1, C11 1, C12 2, C13 1, C14 1, C15 1, C16 2) + the 11 assertions of the four pre-existing `repath:` cases (7 move, 2 across-file ambiguity, 1 no carrier, 1 deleted path); these 24 labels are present — U1 unique candidate far away; U2 two candidates are ambiguous even when one is near; U3 two distant candidates are ambiguous; U4 absent symbol resolves to nothing; U5 comment and brace-only lines are not candidates; U6 `lineCarriesSymbol` rejects a substring occurrence; U7 resolution takes no line number (signature-level — U2 carries the behaviour); U8 repath refuses two candidate lines in the carrier file; C1 in-file drift repairs; C2 multi-candidate staleness refuses to write; C3 declared offset repairs; C4 offset target that does not carry the symbol refuses; C5 offset leaves a current anchor alone; C6 offset requires `--path`; C7 `--from-line` scopes; C8 an unresolved anchor does not suppress a verified write; C9 repath ambiguity names both lines; C10 a substring-only line is not current; C11 the hint names the modal delta; C12 offset value validation; C13 an empty `--path` selection is an error; C14 a negative offset applies; C15 a value flag with no value is an error; plus C16 an offset miss with the symbol still in the recorded file does not fall back to `--repath` |
| V2 | `npm run check:fast` (un-piped, run last in P5) | `46 passed, 0 failed` … `check:fast: PASS` |
| V3 | `npm run check-anchors` | `predicates current`, exit 0 |
| V4 | D8 probes (four) | four labelled failures, each restored; `git status --porcelain` clean |
| V5 | `npm run typecheck` and `npm --prefix holonovel run typecheck` | both exit 0 |
| V6 | `npm run check-roadmap`; `npm run check-registers:strict`; `npm run check-gate-table` | pass |
| V7 | `grep -rn "ANCHOR_WINDOW\|resolveAnchorLine" scripts/`; V1's U2 | no match; U2 proves the nearest-in-window branch is gone (two candidates are ambiguous even when one is near) |
| V8 | `git status --porcelain`; `git log --oneline -1` | only the files in the blast radius; one commit |

## Done bar

**Done bar:** the resolver resolves by identity and carries no proximity rule; a stale anchor whose
recorded line no longer carries its symbol and whose symbol is carried on several lines is refused
with every candidate named, and both `--check` and `--write` exit 1 without writing it; `--offset`
repairs a declared move only where the target line verifies, refuses otherwise, and never falls
back to a cross-file repath while the recorded file still carries the symbol; every write is
re-verified after it lands; the hint names a move's modal delta on stderr without changing the exit
code; the suite prints `44 passed, 0 failed` with every V1 label present; the four live probes fail
and restore; ROADMAP's *Split `index.ts`* keeps two bullets and the register closes its subsection
and records a `Resolved` section under `check-registers:strict`; `check:fast` is green; `aar.md`
ends `LOOP PAUSED`; `npm run session:close --single` commits the increment. The stated residual —
a line that carries the symbol by coincidence — is recorded in D1 and is explicitly not claimed.

## Edge cases

- **An anchor literal that appears twice in one source file.** Measured: one pair, the identical
  `anchor("holonovel/src/core/state-hash.ts", 64, "stateHash")` twice in
  `holosuite-invariants.ts`. Both occurrences are rewritten to the same verified target, so the
  replace-per-occurrence path is benign; no change is made for it, and P4's probes do not touch
  that pair.
- **A recorded path that does not exist**, an empty file, and a line beyond end-of-file: the
  existing `cannot read` / `has no code line` unresolved paths cover them; the offset mode reports
  the same way and writes nothing.
- **`--path` naming a real file with no anchors** is an error (D2), so a typo cannot pass as
  "nothing to do".
- **Two anchors at the same line with the same symbol** both resolve to the same target; the write
  is idempotent.
- **A crash mid-write** leaves already-rewritten anchors valid (each rewrite is verified before it
  is written) and the rest stale; the next `check-anchors` names them. No file is truncated
  (writes are whole-file, as today).

## User impact

- **Workflow change, deliberate.** After this change, an edit that shifts lines above a
  multi-candidate anchor reds `check-anchors` until the operator declares the shift
  (`--offset <n> --path <file>`); previously the gate repaired itself by guessing. The failure
  message names the candidates and the exact command, and the stderr hint names the modal delta,
  so the new step is one command per affected file. This is the cost the roadmap bullet asks for.
- **No restart, no migration, no data-format change.** The tool is developer tooling; the anchor
  literals keep their three-argument shape and their values are unchanged on the live tree.
- **Rollback is `git checkout`.** No generated artifact, no schema, no published surface.

## Out of scope

Split `index.ts` stage 2 (the item stays open with two bullets); any anchor-format change (D2
records the rejection); a cross-file move whose symbol is carried on several lines in the
receiving file (refused, repaired by hand); a per-anchor `--at` override (D2); the other three
roadmap items; any `spec/` source, `holonovel/src`, or `holonovel/scripts` edit; any publication
step.

## Open questions

- None blocking. Two execution-time judgements are bounded and recorded: P4 chooses the probe
  anchors by measuring candidate lines (D8), and P3 records the measured assertion total rather
  than predicting one (V1's labels are the contract).
