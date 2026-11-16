# Cold plan review — 2026-11-16-release-hardening

Reviewer: fresh context (no authoring history). Independence: fresh.
Stages: 5/5. Method: plan-review §8 Pass B.

## Pass 1 — review of plan.md revision 1 (sha256 bf70630e…)

`independent-review FAILED.` — 1 blocker, 9 majors, 8 minors.

### Blocker

- **B1 — anchor drift is unaccounted for; `check:fast` cannot pass after P1.**
  P1 inserts code into `holonovel/src/index.ts`; 21 `anchor("holonovel/src/index.ts", <line>, "<symbol>")`
  literals live in four harness files (`holosuite-novel.ts:31-36`,
  `holosuite-invariants.ts:29,32,82,85`, `holosuite-adversarial.ts:29-37`,
  `holosuite-conformance.ts:35-37,170,192`), 15 below the insertion points.
  `check-anchors` is `refresh-predicates --check` and exits 1 on drift. The
  blast radius named none of them and the plan never named `npm run fix-anchors`.

### Majors

- **M1** — the table keyed `tool.action` cannot cover the five action-less tools
  (`take_turn`, `set_badge`, `respond_decision`, `open_session`,
  `close_session`).
- **M2** — `RunRecord` stores no `dry_run`; a dry run stops before `stage`, so
  "dry run" cannot be inferred. "last publish (registry)" implies a network read
  `status.ts` does not perform.
- **M3** — `scripts/status.ts` pins `ROOT`, so a `test-push-pipeline.ts`
  assertion cannot observe the scratch repo.
- **M4** — renaming T177's test could strand REQ-002's automated carrier; the
  title must keep `T176/T177/T178`.
- **M5** — T177 also requires an `[AMBIGUOUS]` assertion; the plan repaired only
  the `[MISSING_PARAM]` half.
- **M6** — the 126 figure was unanchored and conflicts with the 122 linkage
  count beside it.
- **M7** — rollback claimed total reversibility while omitting P4 (publish).
- **M8** — a third identical `name: k` projection exists at `index.ts:16054`
  (`server-notes://`).
- **M9** — the façade dispatch calls the handler outside the proposed
  `try/catch`, so `createEngine()` consumers still see raw exceptions.

### Minors

N1 handler call is `:2140`, not `:2138`. N2 the dangling sentence is
`review-register.md:3103`, not `:3099`. N3 `tool-definitions.json` path
incomplete. N4 D2 under `## Non-goals` would need a governing REQ. N5 a
substring oracle on "undefined" false-positives. N6 the P2-T1 assertion lands
in the full-only `test:pipeline`. N7 `check-registers` cannot detect the
dangling sentence. N8 T177's REQ column is REQ-002 alone.

## Pass 2 — diff re-review of revision 2 (sha256 56aaa780…)

Dispositions: B1 Resolved; M1–M9 Resolved; N1–N8 Resolved.

Two new minors, both textual: the "no state mutation" criterion read as
applying to legal no-arg surfaces, and the Non-goals still claimed no `assemble`
delta while P2-T6 may amend an Appendix F row. Both applied in revision 3
(done bar scoped to refused surfaces; Non-goals and blast radius name the
conditional `assemble` and the two generated copies).

`independent-review passed.` — 2 blockers→0; 9 majors→0; 8 minors→0; 2 new
minors closed. Reads 3/10 on the diff pass.

## Pass 3 — execution delta (revision 4)

The T56 fixture correction (`test-narrative.ts`, `manage_note set` now supplies
`key`) was reviewed against the plan's stated scope. Verdict: within P1's
contract (it is one of the 22 named silent accepts), blast radius complete
(including the conditional `assemble` copies), done bar correctly scoped to
refused surfaces.

`independent-review passed.` — reads 3/4.

Plan sha256: e9d8cb5763c688097f7407a94feb586cbbbc9f2f50f96bc6cd6339c4e50639c3

## Pass 4 — P2 delta (revision 5)

Reviewed the P2 delivery: `dry_run`/`stopped_at` on the run record with a pure
renderer and five assertions, the ROADMAP shared-evidence bullet, the
review-register repair, the `hono` non-reachability disposition, the container
rehearsal note, and the T177 amendment with its generated consequences
(`assemble` outputs, build-phase-map hash, G7 attestation). Verdict: all four
paths correctly characterised and in the blast radius; the amendment is the
plan's authorised branch; no new plan needed. Nit: "All three" counts four paths.

`independent-review passed.` — reads 4/5.

## Pass 5 — P3/P4 disposition (revision 6)

Reviewed the stopping point: P3-T1 rescoped with the reason (one synthetic
transcript; new lenses, not repeated seeds), P3-T2 operator-bound by
construction, P4 awaiting the explicit publish order. Verdict: recorded, not a
silent cut; the AAR carries the gate table, F1–F12 dispositions, and LOOP OPEN
(correct — the done bar's publish criterion is unmet and F9/F10 remain); no
undispositioned residual float. Nits applied (gate-table count, tasks row).

`independent-review passed.` — reads 5/6.
