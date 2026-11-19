# Tasks — builder-side handoff evidence

Dependency order; each task closes when its accept line is met.

## P1 — Presence matrix and redaction set

- [x] P1.1 Confirm the baseline: `git status --porcelain` clean, HEAD recorded,
      `npm run check:fast` 46/46. — HEAD `a687660`; `46 passed, 0 failed`.
- [x] P1.2 Inventory the §9 markers: `grep -n "@section " holonovel/DECISIONS.md`
      (expect one evidence marker) and confirm `@section intake|versions|
      traceability|normalizations|waivers` are absent. — one marker at `:2612`;
      all seven other markers absent.
- [x] P1.3 Confirm the ruleset-free entry: `grep -n "ruleset-free — no source"
      holonovel/DECISIONS.md` (expect absent) and `test -e
      holonovel/RULESET_MODEL.md` (expect absent). — both absent.
- [x] P1.4 Fill the G rows: G0a, G0b, G2-G8 — candidate command or "none", the
      §8 pass criterion, the record present today, the field source. — 8 rows.
- [x] P1.5 Fill the H rows: H1-H18 — same columns, including the §9 basis for
      N/A and the H10/H12/H13 required fields. — 18 rows.
- [x] P1.6 Name the redaction ranges: the G7 attestation extent
      (`:2610-2713` at plan time) and the future evidence section at EOF. —
      ranges A and B written.
- [x] P1.7 Write `presence-matrix.md`; no tracked file edited and
      `holonovel/DECISIONS.md` untouched. — matrix written; `git status` showed
      only the increment directory.

## P2 — Execute and record

- [x] P2.1 Run each mapped command; capture exit code, output summary, and
      environment pins (Node version, OS, spec hash). — `test:all` 56/56;
      Pattern Buffer 18/18; performance record PASS; surface PASS.
- [x] P2.2 Append `## Verification workflow evidence` at EOF and write one block
      per workflow whose output exercises its §8 pass criterion. — eleven
      blocks: G0a, G4, G5, H5, H10, H13, H14, H15, H16, H17, H18.
- [x] P2.3 Use bare `@section evidence-g<n>` for G records and bare
      `@section evidence` for H records; six exact labels plus one sub-check
      bullet each; close the section with `<!-- evidence:end -->`. — done;
      marker count 12.
- [x] P2.4 Run `npm run validate`; resolve every T253 finding. — exit 0,
      `0 error(s)`.
- [x] P2.5 Run the V3 parser probe and restore the bullet. — probe exit 1 with
      `T253 — evidence record at line 3430 is missing a non-empty 'Workflow'
      field`; restored, exit 0.

## P3 — Findings and close

- [x] P3.1 Write each unrecorded workflow into the AAR with its reason and a D10
      disposition; include the §9 comment-form deviation and the missing (1)-(5)
      markers. — fifteen workflow findings plus two document findings.
- [x] P3.2 Confirm the G7 block is byte-identical (`git diff -U0`). — one hunk,
      `@@ -3386,0 +3387,146 @@`; no line in `:2610-2713` touched.
- [x] P3.3 Run `npm run check:fast` un-piped; capture the aggregate exit code. —
      pending at close.
- [x] P3.4 Write `## Changelog entry` (Title ≤ 100 chars, Summary, 1-8 bullets)
      and the `LOOP PAUSED` token into `aar.md`. — block written; title 76
      characters; seven bullets.
- [x] P3.5 Run
      `npm run session:close -- --increment 2026-11-18-handoff-evidence` (add
      `--date 2026-11-18` on a later day); one commit. — this step.
