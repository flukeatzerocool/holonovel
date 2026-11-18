# Diff record — plan revision 1 → revision 2

The plan is a new tracked file, so `git diff` has no previous revision to show. This file records
every changed passage verbatim (old → new) for the diff re-review, keyed to the prior findings in
`plan.cold/report.md`.

Previous artifact sha256: `0fb99aa315dcd4bc90843f34b30c19ee78c860a77d6f34c190c0d4fa6b97fba0`
Revision 2 is the file `plan.md` at the path named in the dispatch.

## B1 / D-3 / S1.1 — D6 format

OLD: `` `source: path:from#symbol -> path:to (written; delta +2)`. The text stays ASCII so a
console encoding change cannot mangle it, and the existing self-test regex (`\(written\)`) keeps
matching.``

NEW: `` `source: path:from#symbol -> path:to (written) [delta +2]`. The parenthetical stays
byte-identical, so the assertions at `scripts/test-anchor-tooling.ts:85` and `:120` (`\(written\)`)
keep matching without a test rewrite; the delta rides after it, in ASCII.``

## B2 / D-1 / S1.2 — the repath fallback

OLD: "With `--repath` also present, an unresolved offset target falls back to the in-root repath
(D3); without it, the message names `--repath` as the alternative."

NEW: a paragraph, "**The `--repath` fallback is gated.**", requiring zero carriers in the recorded
file (D1's precondition), refusing when the recorded file still carries the symbol elsewhere, and
explaining that `resolveAnchorInRoot` excludes the recorded path. New test label **C16** added to
V1, P3, and tasks.md.

## M1 / S1.3 — the residual and the closure claim

OLD: D1 ended at "two or more → ambiguous, naming every candidate line; zero → not in this file".

NEW: "**Stated residual:**" — a coincidentally-carried line still self-validates; the increment
closes only "the recorded line no longer carries the symbol" and the Done bar claims only that.
The Done bar was rewritten to say so.

## M2 / ST-1 / S1.4 — assertion counts

OLD: blast radius "20 CLI assertions across C2–C15"; V1 no total; P3 "C2–C15"; baseline 20.

NEW: one total everywhere — **44 assertions (8 unit + 36 CLI) over 24 labels (U1–U8, C1–C16)**.
Blast radius, P3, and V1 carry the same number; C1 is named as the existing three-assertion case.

## M3 / ST-2 / S1.5 — register disposition and gate

OLD: "the register close paragraph exists and `npm run check-registers` passes"; one prose
paragraph in the Scheduled-roadmap subsection.

NEW: two edits — the in-place closing paragraph **and** a new
`## Resolved — 2026-11-17 anchor repair: identity resolution and a declared offset` section after
the current last section (`:3907`); acceptance is `npm run check-registers:strict`
(`scripts/check-registers.ts:54` shows the non-strict form exits 0 on findings). V6 and P5 updated.

## M4 / D-2 — `--offset` scope

OLD: semantics defined only "for the selected anchors".

NEW: "**Scope:** the run still scans every anchor in every anchor source; `--offset` layers a
declared shift on the selected set and changes nothing about the others", with the exit-code
consequence stated.

## Nits

- **D-4:** D2 gains "**What \"verified\" means here.**" — the declaration is the evidence, not a
  uniqueness test; the asymmetry with D3 is named as deliberate.
- **D-5:** D2 ends with the `--check --offset` exit-code note (both correct and wrong offsets exit
  1; only stderr distinguishes).
- **D-6:** D2a now adds an optional value-flag set to `rejectUnknown` in `scripts/lib/args.ts`
  instead of a local helper; blast radius gains an `args.ts` row.
- **D-7:** EV6 retitled and rewritten: no other module imports the resolver, and
  `holonovel/scripts/lib/eval-predicate.ts:29-30,80-124` is cited as the runtime implementation of
  the same rule; the discovery claim is scoped to gates.
- **ST-4:** U7's label says "signature-level — U2 carries the behaviour".
- **SY-1:** the detector is named "`check-script-quality`'s duplicate-helper detector" (the `C2`
  token is gone).
- **SY-2:** scanner-regex citation corrected from `:31` to `:33`.
- **SY-3 / S1.6:** `probe.md` belongs to P4 only; P1 records the audit snippet in `tasks.md`.
- **Stage 5:** `lineCarriesSymbol(line, symbol): boolean` is named as an export;
  `resolveAnchorSymbol` returns the existing `AnchorResolution` shape.
