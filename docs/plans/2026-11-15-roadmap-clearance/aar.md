# AAR — Roadmap clearance

## What was supposed to happen

Close four of the six open ROADMAP items — G7 attestation predicate, evidence
record + CI-manifest split, harness test-ID hygiene, Holosuite anchor fix mode —
and re-confirm the two that cannot close this session (the U5–U8 review sweep,
deferred by the operator; the loop-gate re-measurement, date-gated to
2026-11-28). Done bar: the four sections removed with their evidence, the four
new checks green, `check:fast` green at 45 gates, `test:all` 56/56.

## What happened

1. **G7 derivation.** New `generate-g7-attestation.ts` reads the 84 §5.12 bodies
   from the assembled spec and the 31 attested parents from the coverage
   register, emits `src/generated/g7-attestation.ts` and the per-body table in
   `DECISIONS.md`, and exits 1 on a spec/register disagreement. New
   `src/narrative-coherence.ts` carries the pure rule; `index.ts` parses §5.12
   from the shipped spec at runtime and compares hashes, so a stale attestation
   is `partial`. `check-g7-attestation` gates both artifacts; T403 proves
   `pass`, `partial`, `fail`, and `partial/stale`.
2. **Harness IDs.** 21 zero-padded tokens corrected (`T056`→`T56`,
   `T057`→`T57`) or dropped where the title already named its row; five orphans
   mapped/dropped; seven `T408`–`T412` collision sites re-labelled to
   `T477`–`T480`, `T482`, `T282`. `checkHarnessTitleIds` (shared library,
   consumed by `validate.ts`) rejects a padded or unresolved ID. Appendix F's
   preamble states both conventions.
3. **Evidence record + CI split.** The G7 block now carries §8's six fields plus
   the three attestation points, the smoke link, and the generated table; T396
   asserts the labels. `AGENTS.md` § CI-only checks lists the eight off-manifest
   steps by `<job>/<step name>`, and `check-workflows` reconciles every `run:`
   step against the manifest, setup/build-tool classes, and that table.
4. **Anchors.** `refresh-predicates --check` fails on drift and names
   `npm run fix-anchors`; the resolver moved to `scripts/lib/anchor-resolver.ts`
   and refuses an ambiguous symbol (no candidate within ±40 lines). `check-anchors`
   is full-only; `test:anchor-tooling` covers the resolver and the CLI contract.
5. **Close.** ROADMAP down to two sections (sweep + date-gated re-measurement);
   five register findings moved to `Resolved`; CHANGELOG entry; one version-sync
   pass (idempotent — no file changed at the current CalVer).

## Evidence

| Claim | Command → result |
|---|---|
| G7 derivation is real | `test-g7` → 4 passed (T396 labels, T403 pass/partial/fail/stale) |
| §5.12 count | `check-g7-attestation` → 84 bodies, 82 server-side, 2 builder-side, 31/31 parents |
| Harness IDs resolve | `validate.ts --sdd-strict` → `PASS: Every harness title ID resolves to the Appendix F catalogue` |
| No regression | `npm --prefix holonovel run test:all` → 56 passed, 0 failed (188.7 s mid-increment; 183.5 s on the committed tree) |
| CI split enforced | `check-workflows` → PASS; `test:workflows` → 16 passed |
| Anchor class repairs itself | replay at `acf7489^`: `--check` → 23 drifts, exit 1; `--write` → repaired; `--check` → current |
| Baseline | `check:fast` → 45 passed, 0 failed; `check-anchors` → current on the committed tree |

## Findings and dispositions

- **F-1 — commit 1 shifted 20 evidence anchors.** Fixed in the same commit: `refresh-predicates --write` repointed them and commit 1 was amended, so no commit is transiently red. Terminal: fixed.
- **F-2 — the register carried a fifth finding in this class (F-P2-4, padded IDs and REQ-023b) beyond the four the plan named.** Moved to `Resolved` with the other four and recorded here as an execution delta; the plan's E2 named four because the re-review surfaced only those. Terminal: fixed.
- **F-3 — builder-side classification by text found one body, not two.** `REQ-346a2` says "A build missing this attestation is a handoff defect" rather than "the builder SHALL". The rule now recognises both phrasings in the generator and the runtime module, giving 82 server-side + 2 attestation bodies as the plan states. Terminal: fixed.
- **F-4 — the cold-pass cap left the final plan bytes unreviewed.** Recorded as C-4 and accepted by the operator ("Accept v3 with conditions"); the binding memo is `plan.cold/verdict.md`. Terminal: accepted-by-user.
- **F-5 — the standard-depth re-review protocol cost two dispatches and one cap escalation.** This is a process observation, not a defect: the first pass found two real Blockers (the register-reachability trap and the attested-source gap) that self-review had missed. Terminal: record-and-close; no action.
- **F-6 — the anchor drift will recur on every `index.ts` edit.** That is the design: `check-anchors` fails the full gate and names the one-command repair. Terminal: record-and-close.

## Conditions carried from plan review

- **C-1** — the five moved register findings each carry a date in their own text. Verified: `check-registers` passes with no `Scheduled-roadmap` REQ warnings.
- **C-2** — the §5.12 list assertion lives in T403 (generated table) while T396 carries the field labels; both IDs are exercised.
- **C-3** — the `acf7489^` replay was run and its output is recorded above and in the CHANGELOG.
- **C-4** — the cold-pass gap is recorded and operator-accepted.

## Done bar

Met: four sections removed; two re-confirmed with their triggers; `check:fast`
45/45; `test:all` 56/56; `check-anchors` and `check-g7-attestation` green;
`checkHarnessTitleIds` zero findings.

## Loop

LOOP PAUSED
