# Plan — §5.3 citation repair (roadmap P1)

Status: draft v2 (resolves the cold pass on v1: 2 Blockers, 5 Majors, 8 Minor,
2 Nit — see Resolutions) · Kind: planned · Depth: standard
Increment target: `docs/plans/2026-11-14-s5-3-citation-repair/`
Rollback cost: 1 (one revert: five Check-line edits, two Appendix F row edits,
one new harness test pair, register/roadmap/changelog bookkeeping, regenerated
assembled spec)
Evidence class: repo
Trust boundary: every premise read from the working tree at HEAD (`d3245b8`);
no web, user, or tool-output content enters the plan.

## Resolutions (cold pass v1 → v2)

- **B1 — T152's stale-reference leg was impossible.** `stale_references` is a
  hard-coded empty list (`holonovel/src/index.ts:14648`, `:14659`). The leg is
  removed from this increment; REQ-138b's lifecycle depth is scheduled as its
  own P1 item (R1) with the implementing file named, so the gap is visible
  rather than claimed covered.
- **B2 — T153's add/absence legs were impossible.** `resource_uris` maps the
  static `REQ022_URI_CATALOG` (`index.ts:14634-14637`), not the live resource
  map REQ-139 promises. The leg is removed; REQ-139's acceptance criterion is
  scheduled with R1. The citation still re-points to T153, which is exercised
  and is the closest existing assertion — exactly the action F-P2-3 records.
- **M3 — the coverage register is Appendix F-driven, not Check-line-driven.**
  `checkImplCoverage` builds its evidence set from Appendix F rows
  (`scripts/validate.ts:2023`, `:2043-2047`); Check lines are not an input.
  The plan now states this, stops claiming the register becomes "true rather
  than token-matched", and expects the regenerated register to gain `T22` and
  `T35` on the REQ-023/REQ-024 rows (the new executed titles) with no bucket
  moving. The Check-line repair itself is traceability hygiene for a human
  reader.
- **M4 — REQ-024a's title criterion gained no assertion.** T509 asserts
  descriptions, not titles. T35 now asserts title pass-through, and REQ-024a's
  Check line becomes `T3, T35` (T39 dropped: lookup behaviour, not titles).
- **M5 — T35 substitutes a synthetic package for "serving the fixture".** The
  Appendix B fixture exists only as spec prose; the only committed package
  (`holonovel/testdata/rulesets/fixture/tools.json`) is empty. Recorded as D2b
  and in the amended row, with the alternative (author a full Appendix B
  package) rejected on cost.
- **M6 — done-bar #2 conflicted with keeping Manual IDs.** The bar now exempts
  named Manual IDs (T3) and requires only harness-resolvable IDs to be
  exercised.
- **M7 — the T153 escape clause conflicted with done-bar #1.** Both are gone
  (B2); T153 is not extended.
- **Minors.** Line references corrected (`:737`, `:776`, `:837`, and
  `test-output-contracts.ts:2497`); the count corrected to eight stale IDs
  with T22 treated separately; "five Check lines change" (REQ-023b already
  cites T22); the gate is `tool-citation-check`; D5 no longer claims §6
  evidence (none exists); the argument-description clause is recorded as
  vacuously true and explicitly not evidenced; the no-Check REQs are listed
  with their family rule; the count probe names the `game_master` badge; a
  User-impact section is added; the roadmap range is `:15-28`.

## Questions

1. Which roadmap item is next? `ROADMAP.md:15-28` — §5.3 citation repair (P1),
   carrying review-register findings F-P2-1, F-P2-2, F-P2-3
   (`spec/audit/review-register.md:2578-2604`).
2. What does the roadmap promise? (a) Write the T22 prompt-registration and
   T35 fixture-isolation assertions "or re-point them to a harness that
   exercises the stated behaviour"; (b) re-point the stale citations and
   refresh the coverage register.
3. Is the roadmap's premise true — is every stale citation's behaviour already
   exercised under another ID? **Partly false for depth, true for existence.**
   The IDs the roadmap names as substitutes are exercised, but they assert
   less than the REQs promise (see the audit table). The plan writes the two
   missing harnesses, re-points the Check lines to the closest exercised
   assertion, and schedules the two behavioural gaps the cold pass proved are
   unimplemented.

## Audit at HEAD (evidence)

Resolution rule: `scripts/validate.ts:1431-1444` collects IDs from executed
`test("<name>", …)` titles under `holonovel/scripts`. Coverage buckets come
from Appendix F (`parseAppendixFReqTests`, `scripts/validate.ts:2023`), not
from Check lines.

| REQ | Check line | Currently cites | Exercised? | Assertion actually present | This increment |
|---|---|---|---|---|---|
| REQ-023a | none (family Check on 023b, `scripts/lib/req-checks.ts:166-175`) | — | — | family rule satisfied by 023b | no edit |
| REQ-023b | `spec/02-requirements.md:735` | T22, T28, T155 | T155 yes; T28 Manual; T22 no | T155 asserts `run_workflow` derives from live registrations (`test-output-contracts.ts:559`); no harness asserts one-user-message or list titles | write T22 (line unchanged) |
| REQ-024a | `:737` | T3 (Manual), T35, T39 | T39 yes; T35 no | nothing asserts tool titles; T509 asserts descriptions (`test-tool-definitions.ts:235`) | write T35 (incl. title pass-through); line becomes `T3, T35` |
| REQ-078d | `:968` | T22, T124 | T124 yes; T22 no | T124 asserts the eight session-zero sections (`:498`) | T22 now exists; no edit |
| REQ-025c | `:776` | T15, T45, T93, T105, T154, T165, T166, T170 | T15/T93/T105 yes; five no | T15/T93 assert the count fields exist (`test-backfill.ts:285`), not that a registration increments them; T105/T486–T488 assert unrelated surfaces (`:457`) | extend T22 with the live-count leg; line becomes `T15, T22, T93, T105` |
| REQ-138b | `:826` | T152, T167 | T152 yes; T167 label collision | T152 asserts prompt-health shape (`:595`); T167 is used for REQ-167 (`:3094`); no stale-reference lifecycle exists (B1) | line becomes `T152`; depth scheduled (R1) |
| REQ-139 | `:837` | T153, T168 | T153 yes; T168 no | T153 asserts `resource_uris` shape (`:595`); presence is catalogue-derived, not live (B2) | line becomes `T153`; depth scheduled (R1) |
| REQ-057b | `:973` | T39, T40 | T39 yes; T40 no | T39 asserts `[NOT_FOUND]` enumeration **and** the "Did you mean" hint (`:481-493`) | line becomes `T39` |

Out of scope by the family rule (no Check line of their own; the family's one
Check line carries the citation): REQ-025a/025b1/025b2 under REQ-025c,
REQ-138a under REQ-138b, REQ-057a under REQ-057b, REQ-078a under REQ-078d.

Count: eight stale IDs (T45, T154, T165, T166, T170, T167, T168, T40), which
is what the roadmap enumerates; T22 is a missing harness, not a stale
citation, and is handled as its own item.

## Objective

Make every §5.3 Check citation resolve to an exercised assertion, and make the
two missing assertions real. Where the acceptance criterion runs deeper than
the implementation, the gap is named on `ROADMAP.md` and in the register in the
same increment rather than absorbed into a weaker citation (B1, B2).

No coverage-bucket change is expected: Appendix F already gives each affected
REQ at least one exercised ID, so this increment repairs traceability and
evidences two behaviours; it does not move a bucket (M3).

## Done bar

1. `T22` and `T35` exist in `holonovel/scripts/test-output-contracts.ts` as
   executed `test(...)` titles and pass.
2. Every harness-resolvable ID cited by the five edited Check lines is in
   `exercisedIds`; the Manual ID `T3` is exempt by name.
3. `npm run assemble` and `npm run check:fast` pass with `check:fast: PASS`.
4. `spec/audit/req-coverage.md` regenerates with `T22`/`T35` added to the
   REQ-023/REQ-024 rows and no REQ moving from C to B.
5. F-P2-1/2/3 are `Resolved`; F-P2-5 (prompt-health/resource-presence depth)
   is `Scheduled-roadmap`; the matching ROADMAP section exists; the §5.3
   section is removed.
6. `check-registers`, `tool-citation-check`, and `check-fingerprint-sync` are
   green (regenerate fingerprints only on reported drift).

## Blast radius

| File | Change | Size |
|---|---|---|
| `holonovel/scripts/test-output-contracts.ts` | add `T22` (prompt registration, titles, one user message, stub install/remove/restart, live counts) and `T35` (installed-package isolation + title pass-through) | M |
| `spec/02-requirements.md` | Check-line edits at `:737`, `:776`, `:826`, `:837`, `:973` (five lines; `:735` unchanged) | S |
| `spec/appendices-reference.md` | T22 row (`:1455`) and T35 row (`:1464`) amended to the implementable assertion | S |
| `spec/audit/review-register.md` | F-P2-1/2/3 → `Resolved` (2026-11-14); new F-P2-5 row under `Scheduled-roadmap` | S |
| `ROADMAP.md` | remove `:15-28`; add the scheduled depth item | S |
| `spec/audit/req-coverage.md` | regenerated (expected no diff for the affected REQs) | S |
| `holonovel.md` | regenerated by `npm run assemble` | S |
| `CHANGELOG.md` | dated entry | S |
| `holonovel/src/index.ts` | **conditional only** — the `spec_health` count derivation if the T22 count probe demonstrates a defect (REQ-025c, P0) | S |

Not touched: fingerprints (no fingerprinted section is edited; the gate still
runs), `stale_references`/`resource_uris` (B1/B2 — scheduled).

## Phases and tasks

### Phase 1 — T22 and T35 (harness first, so citations have a target)

1. **T22 — prompt registration lifecycle** in
   `holonovel/scripts/test-output-contracts.ts`, beside the prompt-surface
   tests (`:2431`). Steps:
   - boot; `set_badge { badge: "game_master" }` (the count probe reads
     `visibleToolCount`, which is badge-filtered — Minor 15).
   - `prompts/list`: assert every entry has a non-empty served title
     (`title ?? description`, D3); for any entry carrying `arguments`, assert
     each argument has a non-empty description (no prompt declares arguments
     today, so this leg is vacuous — recorded, not claimed as evidence).
   - for every prompt in `prompts/list`, `prompts/get`; assert exactly one
     message with `role === "user"`.
   - install a runtime package with one stub tool and one stub prompt (reuse
     the `T453` install shape, `:2476-2500`); assert the prompt appears in
     `prompts/list` and the tool in `tools/list` without restart. **Probe**
     whether the stub tool also appears in `prompts/get run_workflow`;
     `composeRunWorkflow` renders only categorized tools
     (`holonovel/src/core/prompt-composition.ts:302-339`), so if the stub does
     not categorize, drop that sub-leg and record it (C-1).
   - read `spec_health` before and after the install; assert `tool_count` and
     `prompt_count` each increment by exactly one (REQ-025c).
   - remove the package; assert prompt and tool are gone; kill, boot fresh,
     assert both remain absent.
2. **T35 — installed-package isolation and title pass-through** in the same
   file. Steps: seed `wave1test` only; boot; assert no `tools/list` entry ends
   in `_create_delver`, `_roll_move`, or `_start_confrontation`; install a
   minimal package whose `tools.json` declares those three names with explicit
   `title` values; assert all three appear slug-prefixed **and** that each
   `tools/list` entry carries the package-declared `title` verbatim, not the
   raw name (REQ-024a, M4); remove it; assert they disappear. D2 covers the
   slug prefix, D2b the fixture substitution.

### Phase 2 — Citation edits

3. Edit the five Check lines as the audit table's right-hand column specifies.
   Keep the Manual ID `T3`; drop `T39` from REQ-024a (lookup behaviour, not
   titles).
4. Amend the T22 and T35 Appendix F rows to the implementable assertion (D1,
   D2, D2b). No REQ body changes.

### Phase 3 — Bookkeeping, scheduling, verification

5. Move F-P2-1/2/3 into the register's `Resolved` section under a dated
   `### 2026-11-14 §5.3 citation repair` heading; each resolution names the
   harness line that now exercises it.
6. Add F-P2-5 under `Scheduled-roadmap`: `stale_references` is hard-coded
   (`index.ts:14648`, `:14659`) and `resource_uris` is catalogue-only
   (`:14634-14637`), so REQ-138b and REQ-139's acceptance criteria are
   unevidenced in depth. Add the matching `ROADMAP.md` section with a
   `**Trigger:**` line (register coupling: `check-registers`).
7. Remove the ROADMAP §5.3 section; add the dated `CHANGELOG.md` entry
   (gate-pinned to `2026-11-14`).
8. `npm run assemble` → `npm run validate -- --write-register` →
   `npm run check:fast`; capture the un-piped exit code and confirm
   `check:fast: PASS`; diff `spec/audit/req-coverage.md` (expected: `T22` and
   `T35` join the REQ-023/REQ-024 exercised-test cells; no bucket moves).
9. Run `npm run check-registers`, `npm run tool-citation-check`, and
   `npm run check-fingerprint-sync` individually to attribute a failure. If
   fingerprints drift, run `npm run build-order`.

## Readings (decisions taken in this plan)

- **D1 — T22's "stub appears in all host prompts" is narrowed.** Only
  `run_workflow` composes from the live registry (`index.ts:18126-18145`);
  the other host prompts are Novel-state compositions. The row becomes "the
  stub appears in `tools/list` and, when categorized, in the intent prompt".
- **D2 — T35's bare tool names are slug-prefixed.** Package tools register as
  `<slug>_<name>` (REQ-558; observed as `rtprompt_lookup_runtime` at
  `test-output-contracts.ts:2497`). Isolation is asserted over the installed
  set and the row names the prefix.
- **D2b — "serving the fixture itself" has no installable package.** Appendix B
  is spec prose; `holonovel/testdata/rulesets/fixture/tools.json` is empty.
  The row is amended to "an installed package that declares them".
- **D3 — the prompt title is served in `description`.** The SDK's
  `PromptSchema` carries `description` and `arguments`, not `title`; the
  `server.prompt(name, title, cb)` call (`index.ts:18044`) passes the label as
  the description. Host prompts declare no arguments; the argument leg is
  vacuous and not claimed as evidence.
- **D4 — no `index.ts` edit unless the count probe fails.** REQ-025c's
  live-count clause is probed by T22; a demonstrated failure is a P0 fix in
  this increment, a wider derivation defect is scheduled.
- **D5 — the build-time convergence rows keep their Appendix F attribution.**
  T45/T154/T165/T166/T170/T167/T168 describe build-mode metrics; they remain
  Appendix F rows and nothing in §6 cites them today (verified: no matches in
  `spec/03-build.md`). Removing them from runtime Check lines loses no
  build-side pointer that exists.
- **D6 — no REQ body edit.** The acceptance criteria already state the
  behaviour; only Check trailers and two Appendix F rows change.

## Alternatives considered

- **Blind re-point to T105/T152/T153/T486–T488 (the roadmap's stated fix).**
  Rejected for depth: it would cite assertions that do not test the clause.
  The plan still re-points REQ-138b/139 to T152/T153, but states plainly that
  the lifecycle clause is unimplemented and schedules it.
- **Implement `stale_references` and live `resource_uris` in this increment.**
  Rejected on scope: detecting an unregistered name inside prompt prose needs
  a token vocabulary and a false-positive policy (`_Check:` award would have
  to be designed), and `resource_uris` needs a live-map derivation that
  changes a documented output shape. Both are behavioural changes that deserve
  their own plan; bundling them would make this increment's rollback cost 2.
- **Author a full Appendix B fixture package for T35.** Rejected: a six-file
  package plus an emitter is a separate increment; the isolation contract is
  provable with a synthetic package.
- **Delete the unexercised IDs and cite only what exists.** Rejected: the
  harness is what is missing, not the requirement.

## Edge cases and rollback

- The runtime-install shape exists (`T453`, `:2476`); if the package gate
  rejects a synthetic package, reuse the `T453` package verbatim and vary only
  `tools`/`prompts`.
- `spec_health` may serve a cached count (REQ-411); read after the install and
  never rely on cache-busting.
- If the run_workflow sub-leg cannot be observed (C-1), record it in the AAR
  and keep the `tools/list` assertion; do not weaken the row silently.
- Rollback: one `git revert`; the harness additions are additive and each
  Check-line edit is a single-token replacement.

## Verification

- `npx tsx holonovel/scripts/test-output-contracts.ts` for the two new tests
  before the aggregate gate.
- `npm run assemble`, `npm run validate -- --write-register`.
- `npm run check:fast` — un-piped; the tell is `check:fast: PASS`.
- `npm run check-registers`, `npm run tool-citation-check`,
  `npm run check-fingerprint-sync`.
- `grep -n "_Check:_" spec/02-requirements.md` for the five edited lines: no
  harness-resolvable ID without a `test(` title.

## User impact

No API, schema, or output change unless the count probe fails (then a one-line
count fix in `index.ts`). No restart or migration. Server users see nothing;
maintainers get two new harness assertions and five traceable Check lines.

## Deferred / scheduled

- **R1 (new, P1)** — `spec_health` prompt-health stale references and live
  resource-URI presence: implement `stale_references` (REQ-138a/b) and derive
  `resource_uris` from the live map (REQ-139), then extend T152/T153. Written
  to `ROADMAP.md` and F-P2-5 in this increment.
- The build-mode convergence rows (D5) stay as Appendix F rows.
