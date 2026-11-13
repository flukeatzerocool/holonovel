# Plan — pre-existing harness failures: divergence probe and license refusal

Status: draft (self-review pending; independent review before build) · Kind: planned · Depth: standard
Increment target: `docs/plans/2026-11-12-harness-failure-remediation/`
Rollback cost: 1 (two server functions, one appendix table row, two harness
files, registers, ROADMAP; reversible in one commit)
Evidence class: repo only (no web, no user-supplied content)

## 1. Objective

Take the first open P1 roadmap section — *Pre-existing harness failures:
divergence probe and license refusal (P1)* — and turn both HEAD-confirmed red
assertions green **at the predicate**, not by relaxing the assertion.

- **T752 / REQ-633** — the `displaced-outcome` probe reports `confirmed`
  where the committed fixture declares `displaced`.
- **T740 / REQ-096m** — a share with a non-Appendix-U module loaded returns a
  bundle instead of `[ERROR] [STATE_CONFLICT]`. The roadmap records this as
  "refuses … with a JSON body"; the observed output is a *successful* share
  bundle (`format_version: 2`), so the recorded symptom is corrected here
  (D7).

Baseline (this session, before any edit):

- `git status --short`: clean, HEAD `e4e4fa0`, 64 unpushed commits.
- `npm run check:fast` (un-piped): exit 0, **41 passed, 0 failed**, trailing
  `check:fast: PASS`.
- Both failing suites reproduce on this tree:

```
test:memory-recall  19 passed, 1 failed
  probe displaced-outcome → confirmed
  FAIL T752/REQ-633: divergence probes missed: displaced-outcome expected displaced, got confirmed
test:limits         26 passed, 1 failed
  FAIL T740/REQ-096m: share refuses a non-Appendix-U module license:
    expected to contain "STATE_CONFLICT", got: { "format_version": 2, ... }
```

## 2. Findings and predicates

| Finding | Current predicate (verified in this tree) | Contract | Disposition |
|---|---|---|---|
| **H-1** unanchored restatement outranks the cited event | `checkRecord` accepts the first same-polarity fact whose anchor is not a *different* ordinal. `anchorMismatch` is `record.event_ordinal !== null && f.anchor !== null && f.anchor !== record.event_ordinal` (`divergence.ts:360-361`), so a fact with `anchor === null` is always compatible; `samePolarity.find((f) => !anchorMismatch(f))` (`:364`) returns it and `confirmed` wins (`:379`). In the T752 campaign `manage_relationship (action: set)` writes the campaign-memory thread "Kael now regards Anna as ally" (`index.ts:1091`), whose projection is `Kael outcome Anna positive`, `anchor: null`, `source: campaign:threads:…`. The hidden probe cites ordinal 2 while the anchored fact sits at ordinal 1. | REQ-629, REQ-630, REQ-633 | **Resolve here** |
| **H-2** share license gate is bound to the embedded payload | `export` computes `embedded = embeddedAdventureContent(novel, share)` (`index.ts:12684`) and runs the license gate only `if (args.share === true && embedded)` (`:12688`). `embeddedAdventureContent` returns the generated adventure first whenever one exists (`:12364`), with `provenance: null` (`:12366`). A loaded module is therefore never examined while a generated adventure is active, and the refusal never runs. The unattributed branch (`:12693`) is *not* mislabelled: `embedded.slug` is `novel.adventure_slug ?? "generated"` (`:12366`), so the warning already names the loaded module — only the refusal path is wrong. | REQ-096m | **Resolve here** |
| **H-3** share of a both-active Novel embeds only the generated adventure | Same precedence (`:12364`) while `manifest.adventure_module_slugs` still names `novel.adventure_slug` (`:12724`). REQ-132c permits both to be active; REQ-096m's "embed loaded adventure content" does not say which wins. No gate asserts the loaded body is present, so no failure is demonstrated. | REQ-132c, REQ-096m | **Record-and-close (P3)** — a multi-adventure bundle key is a format change, not this increment |

Count provenance: the two failing assertions are the ones printed above.
`grep -rl "\bT752\b" holonovel/scripts` → 1 file (`test-memory-recall.ts:294`);
`grep -rl "\bT740\b" holonovel/scripts` → 1 file (`test-limits.ts:241`). Both
IDs are already cited from Appendix F (`:2099`, `:2087`) and both REQs are
bucket C in `spec/audit/req-coverage.md` (`:591` and the REQ-096m row), so this
increment changes no coverage bucket.

## 3. Decisions

**D1 — anchored evidence outranks unanchored restatement.** In `checkRecord`,
a fact is *event-anchored* when its `anchor` is non-null. Define the
**anchored subset** as the question facts that are event-anchored. When the
record cites an event ordinal (`record.event_ordinal !== null`) and the
anchored subset is non-empty, evaluate both `samePolarity` and `opposite` over
the anchored subset only — never over the whole question set, and never over
facts anchored to the cited ordinal alone (that reading yields an empty set
and fails the probe). Unanchored facts still decide the verdict when the
anchored subset is empty (dispositions, relationships, presence, location, and
inventory are unanchored by construction, so every disposition probe keeps its
current verdict). CR-3's precedence is an ordering among the facts considered
and is unchanged: an anchored opposite-polarity fact still yields
false_outcome before the displaced fallback. An unanchored restatement is
dropped from both sets because it asserts current state, not the cited event;
keeping `opposite` unrestricted was rejected — a campaign thread written this
session would then relabel a mis-cited event as false_outcome. This yields,
per fixture probe: confirmed (unanchored disposition), false_outcome
(unanchored disposition), misattributed (unanchored disposition), conflated
(object half anchored at event 1), **displaced** (anchored event 1, cited 2),
affect_drift (unanchored disposition). It also leaves T779's `first stance` →
window-closed `displaced` path untouched: that question set is anchored by
nothing, so the window override still sees `confirmed`. The mixed case (an
anchored fact at the cited ordinal of opposite polarity plus a same-polarity
fact at another ordinal) resolves to false_outcome by CR-3's order; T752 gains
no probe for it, and that gap is listed in §8.

**D2 — state D1 once, in Appendix O.13, not in REQ-630.** REQ-630 has 35
characters of headroom (`req-headroom`: 765/800) and REQ-096m has 3 (797/800);
a normative sentence in either body would exceed the cap. Appendix O.13 is the
contract table REQ-630 already cites, and its prose already fixes whole-token
matching. Add one line after the whole-word sentence: an event-anchored fact
outranks an unanchored restatement when the record cites an event ordinal
(the wording covers both polarity sets, per D1). No REQ body changes, so no
fingerprint section is touched.

**D3 — bind the share license gate to the loaded module, not the payload.**
Extract `shareLicenseRefusal(novel)` (or an equivalent local helper) that
resolves `novel.adventure_slug` → `findAdventureFile` → `parseAdventureProvenance`
and returns the `[ERROR] [STATE_CONFLICT]` line when the declared `license` is
outside `APPENDIX_U_LICENSES`, plus the `export_license_unattributed` audit
when the block declares none. Call it from the `share` branch before
`embeddedAdventureContent`. A generated-only Novel is unchanged in what it
embeds and now emits **no** `export_license_unattributed` audit entry;
generated content carries no provenance and is not a redistributed module, so
it neither refuses nor warns. (Today that shared branch audits `{ slug:
"generated" }` for every generated-only share; removing it is the intended
consequence, and no assertion depends on it — `grep license-unattributed`
finds only the T740 unattributed case and unrelated ruleset-vendor checks.)
Skips (`skippedAdventureSlugs`) and a missing file are treated as "no loaded
module".

**D4 — keep embedding precedence.** REQ-132b says loading does not affect the
generated adventure and REQ-132c says both may be active. This increment does
not reorder `embeddedAdventureContent`; H-3 is recorded, not fixed.

**D5 — strengthen, do not merely repair, the assertions.** T752 gains a new
`test()` block asserting the `displaced` verdict's `truth.anchor` is non-null
and equals a recorded event ordinal (pins D1, so a future unanchored fact
cannot silently rescue the probe again). T740 gains a new `test()` block
asserting a generated-only share writes **no** `[license-unattributed]` entry
(pins D3's removal of the spurious audit line; it is red on HEAD, where the
generated branch audits `{ slug: "generated" }`). The existing T740
unattributed test stays as written — the audit already names `unlicensed`, so
no change there. Two new blocks raise the suite totals by one each.

**D6 — roadmap and registers.** Remove the roadmap section when the done bar
closes; add a `## Resolved` entry to `spec/audit/review-register.md` naming
H-1/H-2 predicates; record H-3 as `Closed-P3` in the same entry, and note
beside CR-3 that its precedence remains an ordering rule among the considered
fact set (D1 narrows which facts are considered, not the order). No
`Scheduled-roadmap` row exists for this item, so none needs retiring
(`check-registers`).

**D7 — correct the recorded symptom.** The roadmap line says the license
refusal returns "a JSON body"; the observed behaviour is a successful bundle.
The replacement roadmap text (if any) and the CHANGELOG entry describe the
predicate, not the gate message, per register hygiene.

## 4. Done bar

**Done bar:** `test:memory-recall` and `test:limits` both exit 0 on the
committed tree (`21/21` and `28/28`: the one failing test in each suite now
passes and one new `test()` block is added per suite); `npm run assemble &&
npm run check:fast` ends `check:fast: PASS`
(un-piped exit 0); H-1 and H-2 are `Resolved` and H-3 `Closed-P3` in
`spec/audit/review-register.md`; the *Pre-existing harness failures* section is
gone from `ROADMAP.md` and `npm run check-roadmap` passes; the CHANGELOG has a
dated entry; one commit lands. The two other HEAD baselines named in the same
roadmap text (`test:holosuite-novel` anchors) stay with their existing P2
roadmap item and are not claimed here.

## 5. Steps

1. Baseline: record `check:fast`, `test:memory-recall`, `test:limits` counts;
   confirm the `campaign:threads` fact and the generated-first embedding with
   the probes above (already run while drafting).
2. Write the Appendix O.13 line (D2) and run `npm run assemble`.
3. Red-first in the harnesses: add the new T752 anchor `test()` block and the
   new T740 "generated-only share writes no warning" `test()` block; confirm
   each fails on HEAD behaviour.
4. Fix `checkRecord` (D1); re-run `test:memory-recall`.
5. Add `shareLicenseRefusal` and call it from the share branch (D3); re-run
   `test:limits`.
6. Registers: review register entry (H-1/H-2/H-3), ROADMAP removal, CHANGELOG.
7. `npm run assemble && npm run check:fast`; capture the un-piped exit code and
   the trailing PASS line.
8. Replace the AAR skeleton with the executed report (evidence table, findings,
   LOOP token) — the skeleton's current 19/1 and 26/1 counts must not ship.
9. Commit as one increment (spec appendix row + two server fixes + assertions +
   registers share the same done bar).

## 6. Files

| File | Change | Size |
|---|---|---|
| `holonovel/src/core/divergence.ts` | anchored-subset selection in `checkRecord` (D1) | S |
| `holonovel/src/index.ts` | `shareLicenseRefusal` helper + share-branch call; drop the spurious generated-only warning (D3) | S |
| `holonovel/scripts/test-memory-recall.ts` | new T752 anchored-verdict `test()` block (D5) | S |
| `holonovel/scripts/test-limits.ts` | new T740 generated-only-no-warning `test()` block (D5) | S |
| `spec/appendices-reference.md` | one O.13 precedence line (D2) | S |
| `spec/audit/review-register.md` | Resolved entry | S |
| `ROADMAP.md` | remove the closed section | S |
| `CHANGELOG.md` | dated entry | S |
| `docs/plans/2026-11-12-harness-failure-remediation/aar.md` | replace the draft skeleton with the executed report | S |

Generated: `holonovel.md` (assemble). No tool-definition, surface-budget,
starter, or fingerprint regeneration is expected — no tool schema, description,
or fingerprint section changes. If `check-tool-definitions-sync` or
`check-fingerprint-sync` disagrees, stop and reconcile before commit.

## 7. Verification

- `npm --prefix holonovel run test:memory-recall` → 21 passed, 0 failed.
- `npm --prefix holonovel run test:limits` → 28 passed, 0 failed.
- `npm --prefix holonovel run test:belief` → unchanged (REQ-629–632 consumers).
- `npm --prefix holonovel run test:adventure` → unchanged (share/adventure path).
- `npm run assemble && npm run check:fast` → PASS, un-piped exit 0.
- `npm run check-roadmap`, `npm run check-registers` → exit 0.

## 8. Risks and rollback

- **D1 could reclassify a verdict the fixture does not pin.** Mitigation: the
  fixture covers all six verdicts; T779/T780 cover the window override; the
  full `test:memory-recall` and `test:belief` suites run before commit.
- **Soft flag — the mixed-polarity branch is untested.** A record citing an
  ordinal with an anchored opposite fact at that ordinal and a same-polarity
  fact elsewhere resolves to false_outcome by CR-3's order; no fixture probe
  or harness assertion pins that ordering. It is reachable only with
  contradictory event facts, which the fixture campaign does not build.
- **D3 changes the generated-only audit surface.** Generated-only shares stop
  writing `export_license_unattributed`; the new T740 block pins that, and the
  loaded unattributed module still warns. If a legitimate fixture module trips
  the gate, its provenance is the defect.
- Rollback is `git revert` of one commit; no persisted Novel schema, format, or
  fingerprint changes.

## 9. Out of scope

- H-3 multi-adventure embedding (format change).
- `test:holosuite-novel` stale anchors (existing P2 roadmap item).
- Any review of §5.6 clock/combat or the trust-core remediation sections.
