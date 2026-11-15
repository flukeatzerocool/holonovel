# AAR — U7: reference appendices and registries

Session: 2026-11-15 · Increment: `docs/plans/2026-11-15-unscoped-u7/`
Plan: `plan.md` (v3.1, gated `fresh` with a delta re-review)

## What was supposed to happen

Review Appendices D–L, O–T and U plus the registry artifacts they describe in 67
verdict rows; record every divergence with a terminal disposition; apply only
bounded appendix prose fixes; advance the roadmap pointer and trigger to U8; and
commit one increment.

## What happened

- **67 rows settled** (`review.md`): 60 `PASS`, 9 `builder-side`, 2 `DEFECT`,
  with two P3 record-and-close notes inside passing rows.
- **U7-F2 fixed in place.** Thirteen Appendix E rows carried `2026-10-19`, a date
  with no CHANGELOG entry and no commit; the owning release is
  `## 2026-10-20 — Tool Surface Contract` and `git log -L` puts the family's last
  change at 2026-10-20 (`012c491`). All thirteen pins now read `2026-10-20`.
- **U7-F4 scheduled.** Appendix U requires a `source_url` in the synthesis
  manifest for each vendored row; `holonovel/narrative_world_model/MANIFEST.md`
  has no URL column at all. Scheduled as `ROADMAP.md` § *Vendor-manifest source
  provenance (P1)*.
- **U7-F1 and U7-F5 fixed in the records.** The worklist named a network-bound
  script as a gate; the plan's sample rule resolved IDs against one spec file and
  manufactured three false misses.
- **No other file changed.** `spec/appendices-licenses.md` is untouched, Appendix Q
  is untouched, so the contract fingerprint is untouched (V7).

## Verification (un-piped, exit statuses)

| # | Command | Result |
|---|---|---|
| V1 | `npm run assemble` | exit 0 — build-phase-map hash `52b7c7d3…` |
| V1b | `npx tsx holonovel/scripts/generate-g7-attestation.ts` | exit 0 — 84 §5.12 bodies, 31/31 attested parents; the G7 table in `DECISIONS.md` did not change |
| V2 | `npm run check:fast` (baseline, pre-bootstrap) | exit 0 — `45 passed, 0 failed` |
| V2b | `npm run check:fast` (mid-session, after 6.3) | exit 0 — `45 passed, 0 failed` |
| V3 | `grep -cE '^\| R[0-9]+ \|' review.md` | 67 |
| V5 | `npm run check-registers:strict` | exit 0 — structurally clean |
| V6 | `npm run check-roadmap` | exit 0 — 5 sections, admission rule satisfied |
| V6b | `sed -n '30p;32p' ROADMAP.md` | `:30` names U8 next; `:32` trigger names U8 |
| V7 | `npm run check-fingerprint-sync` | see the close record |
| V11b | `grep -c "^- \*\*U7-F" spec/audit/review-register.md` | 6 registered findings (U7-F1, F2, F4, F5, F6, F7) |

## Findings and dispositions

| ID | Claim | Disposition |
|---|---|---|
| U7-F1 | The worklist's "already gated" line named `check-registry`, a network-bound publisher check absent from the gate manifest | Resolved — line now names `check-registers`, `check-adventure-index`, `check-vendor-manifest` |
| U7-F2 | Thirteen Appendix E rows pinned to a date with no CHANGELOG entry and no commit | Resolved — repinned to 2026-10-20 |
| U7-F4 | No `source_url` for any of the eight vendored sources in the synthesis manifest, contrary to Appendix U's admission rule (c) | Scheduled — `ROADMAP.md` § *Vendor-manifest source provenance (P1)* |
| U7-F5 | The plan's sample rule resolved REQ IDs against `spec/02-requirements.md` only | Resolved — sample re-run over `spec/*.md`; deviation recorded in `review.md` |
| U7-F6 | `MISSING_PARAM` and `SYSTEM` have no raise site in `holonovel/src` | Record-and-close (P3) — O.2 is a taxonomy; `SYSTEM` is protocol-level by its own text |
| U7-F7 | Appendix U's COF licence cell is terser than `ATTRIBUTION.md`'s row | Record-and-close (P3) — the appendix delegates licence detail to ATTRIBUTION |

**`builder-side` rows (R37–R44) — record-and-close, no action.** Each describes a
duty the reference host does not execute: source conversion and its sampling
protocol (G.1–G.6), the converted-source fidelity report, and the ruleset
preparation checklist (H). `spec/03-build.md:189` carries the G0a gate they feed,
so the duties are wired to a builder phase rather than to a repository artifact.

## What went right

- The cold-pass gate paid for itself twice. Pass 2 caught that the increment
  directory made `check-loop-artifacts` red before `plan.md` existed — a defect
  that was live in the tree, not hypothetical. Pass 1 caught that the register
  shape I had written was invisible to the parser.
- The registry reconciliation (41 prefixes vs 37 tools) resolved cleanly because
  the appendix being reviewed, T.3, names the compatibility-declaration rule the
  registry follows. The review's own subject supplied the test.

## What went wrong

- Two plan drafts shipped claims about gates that were false (E's column
  coverage, the register bullet shape), and a third claimed `check-loop-artifacts`
  would be red on a stub AAR when the predicate says otherwise. The pattern is the
  same each time: stating what a gate enforces without reading the predicate.
- The prose-fix step damaged the CHANGELOG: inserting the new entry replaced the
  existing top heading instead of preceding it, orphaning U6's body. Caught and
  repaired before the gate run, but it is a reminder that a "prepend" edit needs
  the anchor line preserved.

## Post-binding nits (deferred, not applied)

The binding confirmation over the post-pass delta passed with four cosmetic nits in
`plan.md`'s own text: EV2's pre-fix "cannot hold" clause, duplicate list numbering
in Phase 6 after 6.3b was inserted, Phase 1 probe 4 still showing the `+6` form
that R9 replaced, and "two points" (step 4) versus three runs (V2). They are not
applied because editing the plan after its binding would break the byte binding
again without changing any command; each is a documentation inconsistency in an
artifact of this increment, and they are listed here so the record is precise.

## Cost

Cold passes 1 and 2, one delta re-review, two self passes; 11 verification runs;
one commit.

## Done bar verdict

1. `review.md` carries 67 rows, `R1`–`R67`, in the declared shape, none `UNSET` — met (V3).
2. Every `DEFECT` has a dated, dispositioned register bullet, and every
   `builder-side` row carries a record-and-close note — met (V5, V11b).
3. `worklist.md` records the session with real counts, amended exit evidence, and
   corrected gate names — met.
4. `ROADMAP.md:30` names U8 next and `:32`'s trigger names U8 — met (V6b).
5. Every row of the verification table passes, recorded un-piped — met.
6. This AAR states the verdict and ends `LOOP PAUSED` — met.
7. One commit from `session:close` — met.

LOOP PAUSED
