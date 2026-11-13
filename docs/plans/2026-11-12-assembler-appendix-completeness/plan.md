# Plan — assembler appendix completeness (O.8–O.13 and the fixture matrix)

Status: draft (self-review done; independent review pending) · Kind: planned ·
Depth: standard
Increment target: `docs/plans/2026-11-12-assembler-appendix-completeness/`
Rollback cost: 1 (one parser module, one build tool, one test file, regenerated
spec artifacts, registers, ROADMAP; reversible in one commit)
Evidence class: repo only (no web, no user-supplied content)

## 1. Objective

Close the top P0 roadmap section — *Assembled spec drops Appendix O.8–O.13
(P0)* — at the predicate: the assembled `holonovel.md` must carry every
subsection its sources define. The defect is in `parseAppendices`
(`scripts/assemble.ts:46-76`), which splits each appendix source on
`\n\n---\n\n` and keeps only parts beginning `## Appendix <letter>`.

Two loss classes exist on HEAD:

- **H-4a** — continuation blocks inside Appendix O. Four parts
  (`**O.8`, `**O.11`, `**O.12`, `**O.13`) are discarded. `holonovel.md` has
  0 occurrences of `Outcome opposition pairs`; the source has it at
  `spec/appendices-reference.md:3202`.
- **H-4b** — the leading section of `spec/appendices-fixtures.md`
  (`## Fixture Coverage Matrix`, `:1-29`) is discarded because `parseAppendices`
  treats `parts[0]` as the header only when it starts with `# Appendices`
  (`scripts/assemble.ts:57`). `holonovel.md` has 0 occurrences of
  `Fixture Coverage Matrix`; the block carries a normative SHALL (per-ruleset
  fixture annotation).

Baseline (this session, before any edit):

- `git status --short`: clean, HEAD `a36d133`, 65 unpushed commits.
- `npm run check:fast` (un-piped): exit 0, **41 passed, 0 failed**, trailing
  `check:fast: PASS`.
- `npm run status`: version `2026.11.12`, 12 open roadmap items.

## 2. Findings and predicates

| Finding | Current predicate (verified in this tree) | Contract | Disposition |
|---|---|---|---|
| **H-4a** continuation blocks dropped | `parts = text.split("\n\n---\n\n")` (`assemble.ts:52`); `if (m) setBlock(...)` (`:70-73`) — every part without an `## Appendix [A-Z]:` prefix is silently discarded. Appendix O has internal separators at `appendices-reference.md:3108,3131,3158,3184`, so O.8/O.11/O.12/O.13 never reach the output. | ROADMAP P0; REQ-434, REQ-436, REQ-438, REQ-440, REQ-441 (O.11); REQ-097, REQ-129, REQ-273, REQ-571, REQ-593, REQ-648 (O.12); REQ-629, REQ-630, REQ-632 (O.13) | **Resolve here** |
| **H-4b** source preamble dropped | `parseAppendices` only accepts a `# Appendices` header block (`assemble.ts:57`); `appendices-fixtures.md` begins with `## Fixture Coverage Matrix`, which matches no branch and is dropped. | Fixture annotation SHALL (`appendices-fixtures.md:22-29`) | **Resolve here** |
| **H-4c** dangling citations in the committed spec | `holonovel.md` cites "the Appendix O `<constant>`" and `O.12`/`O.13` in §5 bodies (e.g. `holonovel.md:4614`, `:4618`, `:4633`, `:4637`, `:4491`, `:4505`) and Appendix F test rows T91 (`holonovel.md:10883`) and T770 (`holonovel.md:11442`) name O.8/O.12/O.13. No validate check resolves appendix *subsection* anchors, so the drop is gate-silent. | REQ-001..REQ-043 outputs; Appendix F | **Resolve by H-4a/H-4b**; no new gate (D4) |

Count provenance: dropped-part enumeration produced by replicating
`parseAppendices` over the four sources (4 dropped parts in
`appendices-reference.md`, 1 in `appendices-fixtures.md`, 0 in the licenses and
runbooks files); Appendix heading counts per source are 17/7/1/1 = 26 (`A`–`Z`),
so no other part is orphaned.

**Dry-run evidence (already run, scratch only).** A simulation of D1/D2
(`/tmp/opencode/sim2.js`, output `/tmp/opencode/holonovel.sim2.md`) assembles
from the current sources with the preamble's trailing `---` stripped like every
other block's: **14 151** `Total lines` (assemble's `split("\n").length`
metric; HEAD 14 021, **+130**), first divergence at line 9024 (the matrix,
emitted after Appendix A with a single `---` separator and immediately before
`## Appendix B:`), Appendix O's heading-to-heading slice 78 → 178 lines, all
other appendix blocks byte-identical, preface identical. Against that file:
`npx tsx scripts/validate.ts --sdd-strict --no-proofread` → **0 errors**,
3 pre-existing T261/T449/T776 warnings; `npx markdownlint-cli -c
.markdownlint.json` → clean, exit 0. `holonovel.md` was restored
byte-identically (`sha256sum` checked) and the tree is clean. (An earlier
simulation pushed the preamble without stripping its separator, producing a
doubled `---` and +132; that form is rejected — a duplicated rule is not
something the done bar should commit.)

## 3. Decisions

**D1 — slice by heading boundaries, not by separator filtering.** Replace the
split-and-filter parser with a scan of `^## Appendix ([A-Z]):` (multiline),
taking each block as the text from its heading to the next heading (or EOF),
trailing `\n\n---` and newlines trimmed. Nothing between two headings can be
dropped by construction, and intra-appendix `---` separators survive. Rejected:
*append orphan parts to the previous block* — it repairs O but keeps a parser
whose default is silent discard, and leaves the preamble branch unhandled.

**D2 — keep the source preamble and place it before that file's first
appendix.** `parseAppendices` returns `{ header, preamble, blocks }`. Only the
reference file (`appendices-reference.md`) may supply the assembly header, and
only when its leading block starts with `# Appendices`; a preamble in any other
file that starts with `# Appendices` is a fatal assembly error (it must never
be emitted mid-document). Every other non-empty preamble is emitted immediately
before the first appendix block that file defines (today: the fixture matrix
lands between Appendix A and Appendix B), stripped of its trailing `---` like
every block so the join yields exactly one separator. Rejected: *emit every
preamble directly under `# Appendices`* (puts a fixture matrix above unrelated
appendix A) and *fail assembly on any preamble* (drops normative content
instead of assembling it).

**D3 — move the parser to `scripts/lib/appendices.ts` and pin it with tests.**
`assemble.ts` keeps its CLI/main and imports the pure parser. New cases in
`scripts/test-spec-tooling.ts` (already a gate in both modes):
1. a synthetic source with an intra-appendix `---` keeps the continuation
   block in the preceding appendix's text;
2. reconstruction invariant — `header + preamble + blocks` (normalizing the
   trailing separator) equals the input, so no future rewrite can re-introduce
   a discard path;
3. duplicate `## Appendix A:` still throws;
4. real-corpus pin — every `**O.<n>` label present in
   `spec/appendices-reference.md` appears in the committed `holonovel.md`;
   `holonovel.md` contains `Outcome opposition pairs`; and
   `## Fixture Coverage Matrix` appears **after** `## Appendix A:` and
   **before** `## Appendix B:`, with exactly one `---` immediately preceding
   it.
   Case 4 is red on HEAD (it fails for O.8/O.11/O.12/O.13 and the matrix) and
   green only after reassembly, so it also acts as a staleness and placement
   pin.

**D4 — no new validate gate.** Existing-check discovery: the appendix checks
that exist are `checkAppendixRange` (`scripts/validate.ts:729`, letter ranges
only), the Appendix E manifest extraction (`:295-344`), Appendix F assertion
alignment (`:1644-1710`), and the AGENTS layer-map heading declaration
(`:2144`). None validates that every part of an appendix *source* survives
assembly, so no script covers this finding class. The generic reconstruction
invariant (D3.2) plus the real-corpus pin (D3.4) cover it without a new
heuristic gate, so no corpus false-positive budget is introduced.

**D5 — registers, roadmap, changelog in the same increment.** Remove the P0
section from `ROADMAP.md`; move `H-4` from `## Scheduled-roadmap` to
`## Resolved` under a new `### 2026-11-12 assembler appendix completeness (H-4)`
subsection recording the predicates for H-4a/H-4b. Delete the now-empty
`### 2026-11-12 harness failure remediation — assembler gap found mid-execution`
heading left behind in `## Scheduled-roadmap`
(`spec/audit/review-register.md:2207`), and align H-4's REQ list with Appendix
O.13's header — REQ-629, REQ-630, REQ-632 (H-4 currently says REQ-633). Add the
dated CHANGELOG entry. `check-registers` cross-checks Scheduled-roadmap rows
against ROADMAP, so both edits land together. No `req-coverage` change (no REQ
added, renamed, or retired).

**D6 — restore content; do not edit REQ bodies.** The increment delivers text
the source already defines, so no REQ body, test catalogue row, or appendix
letter changes. The fingerprints hash `PACKAGE_SECTIONS` (§5.16, §5.17, §6.3,
§6.4.2) and `DATA_SECTIONS` (§5.6, §5.9, §5.19, §5.21–§5.28, §5.31, §5.32,
§7.7, Appendix Q) per `scripts/lib/contract-fingerprint.ts:28-47`; Appendix O
and the fixture matrix are outside both sets, so no fingerprint change is
expected. `check-fingerprint-sync` runs anyway; if it disagrees, stop and run
`npm run build-order` before committing rather than editing constants.

## 4. Done bar

**Done bar:** after the single commit, `git show HEAD:holonovel.md` contains
`Outcome opposition pairs`, `**O.8`, `**O.11`, `**O.12`, `**O.13`, and
`## Fixture Coverage Matrix` placed between Appendix A and Appendix B; the
assembled `Total lines` metric is **14 151** (+130 over HEAD's 14 021) with no
other appendix block changed; `npm run assemble && npm run check:fast` ends
`check:fast: PASS` (un-piped exit 0, 41/0); `npm run test:spec-tooling` passes
with the four new cases; the H-4 roadmap section is gone and `npm run
check-roadmap` exits 0; H-4 is `Resolved` in `spec/audit/review-register.md`
with no empty Scheduled-roadmap heading left; the CHANGELOG has a dated entry;
one commit lands.

## 5. Steps

1. Baseline: record `check:fast`, `git status`, HEAD (done while drafting).
2. Write `scripts/lib/appendices.ts` with the heading-boundary parser, header
   and preamble support, and duplicate-heading error (D1, D2); re-export nothing
   else.
3. Rewire `scripts/assemble.ts` to import it and emit `refHeader`, then per
   letter in `APPENDIX_ORDER` that file's preamble (first block only) with the
   same trailing-separator trim, then the block (D2). Reject a non-reference
   `# Appendices` preamble. Keep the existing duplicate-across-files,
   missing-letter, and unknown-source-file guards.
4. `npm run assemble`; verify `git diff --numstat` and per-block comparison:
   `holonovel.md` `Total lines` 14 021 → 14 151 (+130), changes confined to the
   matrix insertion and the O block, exactly one `---` before the matrix;
   `holonovel/holonovel.md` mirrors it.
5. Add the four cases to `scripts/test-spec-tooling.ts` (D3); run
   `npm run test:spec-tooling`, then `npm run test:script-tooling` (new lib
   module reachability/quality).
6. Registers: move H-4 to `## Resolved`; delete the roadmap P0 section;
   CHANGELOG dated entry (D5).
7. `npm run assemble && npm run check:fast` un-piped; capture the exit code and
   the trailing PASS line. Reconcile any lint/validate finding in the
   previously undelivered text (dry run says none for validate and markdownlint).
8. Replace the `aar.md` skeleton with the executed report (evidence table,
   findings dispositions, `LOOP PAUSED`), fill `tasks.md` checkboxes.
9. Commit as one increment with `npm run session:close` (spec artifact + parser
   + tests + registers share one done bar). Push is **not** part of this plan.

## 6. Files

| File | Change | Size |
|---|---|---|
| `scripts/lib/appendices.ts` | new pure parser: heading-boundary blocks, header, preamble, duplicate error | M |
| `scripts/assemble.ts` | import the lib parser; emit preambles before their file's first block | S |
| `scripts/test-spec-tooling.ts` | four new cases (continuation, reconstruction, duplicate, real-corpus pin) | S |
| `holonovel.md`, `holonovel/holonovel.md` | regenerated by `npm run assemble` (+130 `Total lines`) | L (generated) |
| `ROADMAP.md` | remove the closed P0 section | S |
| `spec/audit/review-register.md` | H-4 moved to `## Resolved` with predicates | S |
| `CHANGELOG.md` | dated entry | S |
| `docs/plans/2026-11-12-assembler-appendix-completeness/{plan,tasks,aar}.md` | increment record | S |

Not touched: `spec/appendices-*.md` sources, REQ bodies, Appendix E/F rows,
`holonovel/src/**`, fingerprints. `docs/plans/...` is tracked (unlike
`plans/`).

## 7. Verification

- `npm run assemble` → writes both spec copies and reports
  `Total lines: 14151`; `git diff holonovel.md` is 130 added lines, 0 removed
  (measured against `git show HEAD:holonovel.md`).
- `npm run test:spec-tooling` → all cases pass; the real-corpus pin is red on
  HEAD (evidence in §2) and green after step 4.
- `npx tsx scripts/validate.ts --sdd-strict --no-proofread` → 0 errors
  (dry-run evidence: 0 errors, 3 pre-existing warnings).
- `npx markdownlint-cli -c .markdownlint.json holonovel.md README.md` → exit 0
  (dry-run evidence: clean).
- `npm run check:fast` → 41 passed, 0 failed, `check:fast: PASS`, un-piped.
- `npm run check-roadmap`, `npm run check-registers`, `npm run
  check-fingerprint-sync` → exit 0.

## 8. Risks and rollback

- **Placement of the matrix is a presentation choice.** It lands between
  Appendix A and B; rollback of the placement is a one-line change in the
  emission loop. If the maintainer prefers omitting the matrix, that is a
  scope change (it would leave a normative SHALL unassembled) and must be
  recorded in DECISIONS.md, not silently retained.
- **Heading-scan false split.** A future fenced example containing a line
  starting `## Appendix X:` would split a block. The corpus has 26 heading
  lines and 26 letters today (`grep -c "^## Appendix [A-Z]:"` per source);
  Appendix M authoring rules should keep such an example indented. Not gated;
  recorded as a soft flag.
- **Byte drift in other appendices.** The trim rule (`\n\n---` + trailing
  newlines) must reproduce current blocks exactly; step 4 compares per block
  and stops if any other appendix differs. The matrix preamble gets the same
  trim so the join yields one separator (the rejected +132 form carried a
  doubled `---` no gate would catch; D3.4 pins the single separator).
- **Downstream line numbers shift.** Only content after Appendix A moves
  (+130); README `@spec:` markers and fingerprints are gated, and a
  `refresh-properties` run is only needed if `check-markers` fails.
- Rollback is `git revert` of one commit; no persisted data, schema, or tool
  surface changes.

## 9. Out of scope

- Any other roadmap section (P1 remediation items remain scheduled).
- New validate/assembly gate for appendix subsection citations (D4).
- Publish/push; `spec-update-record` and the DECISIONS spec hash are pipeline
  steps of a later publish session.
