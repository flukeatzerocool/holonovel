# Targeted verification — four corrected items

Artifact: `docs/plans/2026-11-14-identifier-derivation-conformance/plan.md`
sha256: `2ac9ed52728e49a2b9f3bfe44bba2cb5e2146e13059d13602ac2957238a1c408` — recomputed, matches
Scope: the four post-cap corrections only (plan-review standard cap already used).
Reads: 8 / 8.

## Item 1 — Bar 1 anchor values — PASS

`deriveAnchor("_GM only_ The Door") === "the-door"` and
`deriveAnchor("set_active_state") === "setactivestate"` traced against
`holonovel/src/core/anchors.ts:18-24` plus the step-7 branch: the span matches at
`^` with `,`/space satisfying `(?=\W|$)`, is removed, the punctuation strip
(`:21`) deletes the underscore in the identifier case, and the trim yields the
stated values. `:21` is confirmed as the `[\p{P}\p{S}]` strip.

## Item 2 — Bar 8 / step 14 vs `check-container-image` — PASS

`scripts/check-container-image.ts:42-47`: probe, non-zero check, notice,
`process.exit(0)`. A self-skipping gate therefore exits 0, exactly as the plan
states. Bar 8 and step 14 assert the same three rules (exit status is the
authority; a skip is recorded verbatim; a non-zero exit is a failure), and step
14 adds only remediation routing.

## Item 3 — Step 9 comma case — PASS

`_GM only_, The Door → the-door`: the comma satisfies `(?=\W|$)`, the span is
removed, the comma is stripped at `:21`, and the trim yields `the-door`. The case
does exercise the widened lookahead.

## Item 4 — Q4 / D8 archive-import site — PASS

Q4 names one confirmed admission site and explicitly leaves archive import to
step 8a's enumeration; D8 asserts no second site. Bar 4 refers to the admission
path singular. No unverified site is asserted.

## Contradictions

None across the touched sections (bar 1 ≡ step 9; bar 8 ≡ step 14; Q4 ≡ D8 ≡
step 8a).

## Nits (both applied after this verification)

- Step 7 stated the regex without the replacement operand; the corrected plan
  states that the span and its delimiters are deleted.
- D8's "takes the same posture" pre-judged the enumerated site; rephrased
  conditionally.

independent-review passed.

## Plan binding addendum

Plan sha256: 556572a6ff22bdb5f120560cde5bd7f1ca0fca5c77e431b2af2bc8b6ccfdaf96

This verification ran against `plan.md` sha256 `2ac9ed52…`. The two nits it
raised were then applied verbatim — step 7 gained the `$1` replacement operand
(stating that the span and both delimiters are deleted), and D8 was rephrased
conditionally. No other line changed. The plan now hashes to
`556572a6ff22bdb5f120560cde5bd7f1ca0fca5c77e431b2af2bc8b6ccfdaf96`, and that is
the artifact the stamp and the build marker bind to.
