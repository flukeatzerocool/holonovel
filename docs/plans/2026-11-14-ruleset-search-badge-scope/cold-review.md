# Cold review — 2026-11-14-ruleset-search-badge-scope

Artifact under review: `plan.md` at the path below. Reviewer ran in a fresh
context (no authoring history) at standard depth.

## Pass r1 — full cold sweep

- Plan sha256: `03d4dba07954688dea4c2948844d2755fcbfe12003a6ef03c816cc54b4f97661`
- Evidence: `plan.evidence.json` / `.md` (git `ddd0e48`), reads 40/40.
- Verdict: `independent-review FAILED.` — 4 Blockers, 3 Majors, 4 Nits.

Blockers (all resolved in v2):

1. Blank/whitespace query bypasses the filter through the short-circuit at
   `holonovel/src/rulesets.ts:659`; T1 only covered the scored path.
2. Removing the legacy `category` proxy makes `category: "gm"` entries with no
   `badge_scope` readable where `index.ts:15001-15004` refuses them today,
   contradicting the stated compatibility invariant.
3. T0's "exactly four hits" is false — `rulesets.search(` occurs five times over
   three call sites — and its own stop condition would halt the build.
4. No step created the tracked `docs/plans/<increment>/plan.md`, so
   `check-loop-artifacts` could not go green.

Majors: under-enumerated index reads (`indexForReport` at `:14543`);
the "second fixture directory" was not the harness's fixture mechanism; the
gate run was ordered before the AAR it depends on.

Nits: fingerprint line citations (`:27` / `:37-43`), three range slips, the
unverifiable "711 characters" claim, and a missing blast-radius row for
`test-selection.ts`.

Confirmations: the search method has no visibility filter at HEAD; editing §5.2
moves neither fingerprint; no harness asserts the resource's `[FORBIDDEN]` body;
T784 is unused and its Appendix F / REQ-index placement is correct; the
register-and-roadmap handling matches the documented pattern.

## Pass r2 — diff re-review (amended lines only)

- Plan sha256: `8ec02db195f8808b8d3bc4435ba818965bb0d1c0b00a6a62087a36c8e9ef210a`
- Reads 2/10.
- Verdict: `independent-review FAILED.` — 0 Blockers, 2 Majors.

Majors (resolved textually in v3, deferred to `build-review` as C-5/C-6):

- A. Done bar 1's "exact pre-change visibility" contradicted T3.8 (the legacy
  disjunct deliberately narrows search), and done bar 2 named a helper that
  cannot satisfy T3.8.
- B. Two fixtures with identical tool names installed before one boot had no
  stated collision rule, and no reconciliation of existing single-package
  assertions.

Per-finding verdicts in r2: B1, B3, B4/M3, M1, the Nits, and the stale-text
sweep were all resolved; B2's design was resolved with the compatibility
wording and collision rule remaining as the two Majors above.

Re-review cap: standard depth allows one re-review, consumed by r2. The two
Majors are corrected in v3 and are not Blockers; `build-review` verifies them.

## Pass r3 — targeted amendment verdict (user-authorized beyond the cap)

- Plan sha256: `86c5e253eb5e044fab711d36800fa3e07d552c6886aba0d6816625e7a2a06002`
- Reads 8/8. Scope: the two r2 Majors plus the four Minors.
- Blockers: none. Majors: none. Minors: 5 wording items (D5 "resource refusal"
  not "lookup/resource"; C-2 restated to the one-directional invariant; T3's
  prefix rule stated structurally via `isSafeSlug`; model id `core_mechanic`;
  C-5 routes a mismatch to wording). All five are folded into v4.

independent-review passed.

## Binding — final artifact

Plan sha256: b58166c9c1c478864686821a777d60ec1790a54820f9c9ae28d91c5a4152f054
- The diff from the r3-reviewed artifact (`86c5e253…`) was shown to the reviewer
  and consists only of the five r3 wording Minors (D5 resource-refusal wording,
  C-2 one-directional invariant, T3 prefix rule via `isSafeSlug`, model id
  `core_mechanic`, C-5 wording routing) plus a status line and the revision note
  recording this exchange. The reviewer confirmed the binding.

independent-review passed.
