# Plan — Roadmap drain: four closable items, seven trigger-gated

**Date:** 2026-11-16 · **Kind:** planned · **Depth:** standard
**Revision:** 4 — revision 3 failed the targeted third pass (1 Blocker: the
deploy predicate had no fixture; 2 Nits). Revision 4 adds the pipeline-fixture
step and the postcondition rule for the deploy emitter. Three cold/diff passes
have run; residuals are conditions C-1..C-6.

## Execution note (recorded before the first edit)

The cold pass, the v1→v2 re-review, and the user-authorized v2→v3 pass all
returned `independent-review FAILED.`, each on a real design defect that
revisions 2–4 fix. No `independent-review passed.` token exists, so
`build-review` §0 is met by a recorded exception, not by a token:
`Risk accepted: proceed after three independent passes whose blockers revision 4
addresses; the deploy-emitter and pack-order behaviour are verified by build
evidence (C-1, C-2, C-6) — authorized by the maintainer's execute instruction
and their authorization of the third pass.`
**Increment:** `docs/plans/2026-11-16-roadmap-drain` (drafted in gitignored
`plans/`; moved into place by the session commit, see D5)
**Rollback cost:** 1 (one commit; every edit is a revert)
**Evidence class:** repo. Every premise is a `file:line` at HEAD `5a26f11` or a
command run this session.

## Why

Eleven sections are open in `ROADMAP.md`. Four are closable now; item 11's
trigger fires because this plan edits both scripts, and item 8's fires because
the plan renumbers an Appendix F ID. Item 5's date trigger (2026-11-22) has not
passed, and it is closed early on purpose: the plan's own increment directory is
the thing that trips it. Seven are waiting on a date, a lens change, an operator
decision, or a multi-increment program (item 4). The plan closes the four, states
why each of the other seven is not closed, and leaves the baseline green.

- **EV1 — the fast gate reddens on a new increment (item 5).**
  `scripts/lib/loop-artifacts.ts:65-74` emits **three** missing-artifact findings,
  all `level: "error"`; two of them (`tasks.md`, `aar.md`) fire on a directory
  created in-flight. `scripts/check-loop-artifacts.ts:33` calls
  `validateIncrements(ROOT)` with no mode; `scripts/session-close.ts:263` passes
  only `requirePausedFor`. `scripts/lib/gate-manifest.ts:311-316` runs the same
  command in fast and full.
- **EV2 — the ruleset side still prints agent invocations (item 11).**
  `scripts/build-ruleset.ts:284` and `scripts/update-rulesets.ts:53` print
  `opencode run --agent build` lines; the LIMITATION headers at
  `build-ruleset.ts:10-11`, `:289-293` and `update-rulesets.ts:11` restate the
  same claim. `holonovel/scripts/test-fingerprints.ts:400` (T500/REQ-422) is the
  only harness assertion on this output; it matches `Build workflow` and
  `source:`, not the invocation, and `Install directory` comes from
  `update-rulesets.ts:32`, outside the rewrite range.
- **EV3 — `T553` is defined twice (item 8).** Rows at
  `spec/appendices-reference.md:1824` (REQ-284f) and `:1986` (REQ-463), both
  `Automated`, cited at `spec/02-requirements.md:3329` and `:4231`, exercised by
  `holonovel/scripts/test-output-contracts.ts:2578` and
  `holonovel/scripts/test-belief.ts:116`. Max ID is `T792`. The register records
  the class at `spec/audit/review-register.md:3094-3097`.
- **EV4 — the assembled spec exists twice (item 6).** `holonovel/holonovel.md` is
  tracked and byte-identical to `holonovel.md` (`cmp` clean). **Three** writers:
  `scripts/assemble.ts:149,155`, `scripts/spec-propagate.ts:15,26` (build-order
  step 3), and `holonovel/scripts/prepare-package.mjs:37` (prepack, overwrites
  silently). The runtime reads the package copy at
  `holonovel/src/index.ts:133`, `:393`, `:16028` — i.e. `<package>/holonovel.md`.
- **EV5 — the runtime degrades silently when that copy is absent (B-1).**
  `holonovel/src/index.ts:134` returns the string `unknown` for the spec hash and
  `:16033` serves `"Specification not embedded in this build."` on `spec://build`;
  `spec_health.spec_hash` (`:15063`) carries the same fact. The documented boot is
  `npm install` → `npm run start` (`holonovel/AGENTS.md:179-180`). The deploy step
  runs `git pull --ff-only` (`scripts/publish/steps.ts:678`) and then `npm ci`
  **only** on a first deploy or a `package-lock.json` change (`:687-694`) — a
  spec-only pull re-installs nothing. A repo-root runtime fallback is not
  available: REQ-052 confines reads to the install dir or the data dir. So
  untracking needs an emitter at both install and deploy time.
- **EV6 — pack order already assembles first.** `.github/workflows/ci.yml:25` and
  `.github/workflows/publish.yml:48` run `npm run assemble` before the
  packed-artifact smoke (`ci.yml:38`, `publish.yml:52`), so D-9's stricter
  `prepare-package` needs no workflow change — only a check that the order
  persists. npm runs `prepack` → `prepare` → `postpack` for `npm pack`, so D-9's
  comparison gates the pack before D-3's emitter rewrites the same bytes.
- **EV7 — no existing check compares the two copies (gate discovery).**
  `grep -rn "holonovel/holonovel.md" scripts/` returns three hits —
  `scripts/test-spec-tooling.ts:326`, `scripts/assemble.ts:7` (comment), and
  `scripts/lib/commit-plan.ts:39`. The test only proves `spec-hash --file` hashes
  the file it is given (`:327`), so nothing compares freshness.
  `check-fingerprint-sync` hashes the root copy; `check-markers` reads README.
- **EV8 — baseline.** `npm run check:fast` at `5a26f11`: **46 passed, 0 failed**,
  `check:fast: PASS`; working tree clean.
- **EV9 — the P1 item's shape (item 4).**
  `docs/plans/2026-11-15-req-evidence-linkage/corpus.md` carries **122** rows
  over **103** REQs: **99** `automated-unexercised`, **23**
  `manual-undocumented`. Increment 1 shipped the report-only check.
- **EV10 — the other triggers have not fired.** Item 1 waits on the first
  publish after 2026-11-16 (134 commits unpushed; last run stopped at `record`).
  Item 2 waits on a Holosuite lens change. Item 3 is date-gated to 2026-11-28.
  Item 7 waits on a >50-anchor move or >100 reads of one file. Item 9 waits on a
  close that edits three bookkeeping surfaces. Item 10 waits on a REQ-620/REQ-621
  change.

## Questions

1. Scope, answered this session: item 4 is deferred to its own increment (its
   triage is 2–3 sessions); the publish step is **not** in this plan (publication
   is irreversible and needs an explicit operator order).
2. Which item closes first? Item 5, because it gates the plan's own artifact and
   is the smallest change with the largest recurring cost.
3. Does closing item 8 require the item-6 work? Yes — an Appendix F renumber
   regenerates the assembled spec, which is item 6's trigger.

## Item disposition

| # | Roadmap item | Priority | This increment |
|---|---|---|---|
| 1 | Independent verification (§10) | P1 | **No action** — needs a publish and a different model (EV10). |
| 2 | Mutation-sample depth | P2 | **No action** — waits on a lens change (EV10). |
| 3 | Loop-gate fix-up rate re-measurement | P2 | **No action** — date-gated to 2026-11-28 (EV10). |
| 4 | REQ evidence linkage | P1 | **Defer to its own increment**; scope in Phase E. |
| 5 | Loop artifact gate ordering | P2 | **Close early** — Phase A (trigger 2026-11-22 not reached; reason above). |
| 6 | Single assembled spec copy | P2 | **Close** — Phase D. |
| 7 | Split `index.ts` | P2 | **No action** — trigger not fired (EV10). |
| 8 | Duplicate Appendix F test ID (T553) | P3 | **Close** — Phase C. |
| 9 | Bookkeeping derivation | P3 | **No action** — trigger not fired (EV10). |
| 10 | Codex pack as an artifact kind | P3 | **No action** — waits on a REQ-620/621 change (EV10). |
| 11 | Ruleset-side `opencode run` printers | P2 | **Close** — Phase B (its trigger, an edit to either script, is this plan). |

## Decisions

- **D1 — A flag, not a severity, separates the two gates.** `validateIncrements`
  gains `lenient?: boolean` (default false). When set, a missing `tasks.md` or
  `aar.md` is a warning; `plan.md` missing, the missing LOOP token, and naming
  problems stay errors. `check-loop-artifacts` gets `--lenient` (boolean, matching
  `scripts/lib/args.ts`'s `parseFlag`, which does not parse `--flag=value`); the
  manifest passes it in fast mode only. Rejected: demoting everywhere — it would
  let an abandoned increment reach `main`.
- **D2 — Report, never invoke.** Both printers emit evidence (slug, source path,
  install directory) plus the runbook pointer (Appendix V.1/V.7) and name the
  operator action. No agent subprocess, no recursive invocation, no command
  string. Rejected: keeping the string behind a flag — the close predicate is a
  grep.
- **D3 — Renumber the REQ-463 row to `T793`.** REQ-284f's row describes a
  bound-key assertion the unlock tests actually perform; REQ-463's is the belief
  row. Next free number honours Appendix F's "never reused" rule. Rejected:
  renumbering REQ-284f's row — it would move a row whose description matches its
  harness assertion for no gain.
- **D4 — One tracked copy, emitted at install and deploy, compared at pack.** The
  copy stays untracked and ignored; a new `holonovel/scripts/embed-spec.mjs`
  writes it from the repo spec and runs as the package's `prepare` hook (so the
  documented `npm install` restores it) **and** in the deploy step after the pull
  (so a spec-only deploy restores it, EV5). `spec-propagate` keeps writing it in
  build-order, `assemble` keeps writing it so the work tree is complete, and
  `prepare-package` compares before `prepare` rewrites identical bytes. A
  `npm pack` therefore runs `prepack` (the compare, which fails on divergence) and
  then `prepare` (an idempotent re-emit) — the order is stated because both touch
  the same file. `spec-propagate` gains `--check`, wired as a **full-only**
  `check-spec-copy` gate, so untracking does not convert a tracked-diff guard
  into silence. Rejected: a repo-root runtime fallback (violates REQ-052,
  EV5); a manual `assemble` step in the boot docs (the deploy clone runs no
  install on a spec-only change); making `prepare-package` the generator (two
  generators is the defect).
- **D5 — One commit, through `session:close`.** This edits `spec/`, so the split
  limit makes it one commit; the phases are internal ordering, not commit
  boundaries, and each phase's gate is run before the next phase starts. Rejected:
  the five-commit series in revision 1 — it conflicts with the split limit and
  with the close routine's single-commit contract (`docs/plans/README.md:47-54`).

## Done bar

**Done bar:** `npm run check:fast` PASS (captured un-piped) at **46** gates —
`check-spec-copy` is full-only; a scratch increment directory holding only
`plan.md` leaves `check:fast` PASS with a warning, while
`npm run check-loop-artifacts` without the flag exits 1; `grep -rn "opencode run"
scripts/` is empty; `grep -c '^| T553 ' spec/appendices-reference.md` = 1;
`grep -rn 'T793' spec/` names Appendix F and REQ-463, and
`grep -rn 'T793' holonovel/scripts/` names the belief harness; `git ls-files
holonovel/holonovel.md` is empty and `git status --porcelain` is clean after
`npm run assemble`; **the emitters restore the copy** — with the file deleted,
`npm install` in `holonovel/` recreates it byte-identical, the `spec://build`
resource body is not "Specification not embedded in this build", and
`spec_health.spec_hash` is not `unknown`; the deploy step restores it on a
spec-only pull (D-4a's fixture case in `test:pipeline`); the packed tarball's
copy equals the repo copy; `npm run check-spec-copy` exits 0 and the divergence
probe exits 1; `npm run check-gate-table` green; `test:all` 56/56;
`test:package-smoke` 11/11; ROADMAP sections 5, 6, 8, and 11 removed and the
seven others unchanged with their triggers intact.

## Phase A — Loop artifact gate ordering (item 5)

- **A1.** `scripts/lib/loop-artifacts.ts`: add `lenient?: boolean`; thread it
  through the two missing-artifact findings (`:65-74`); keep the rest
  unconditional.
- **A2.** `scripts/check-loop-artifacts.ts`: accept `--lenient` via
  `parseFlag`/`rejectUnknown`; update header, usage, and exit-code text.
- **A3.** `scripts/lib/gate-manifest.ts:311-316`: fast `--lenient`, full with no
  flag. `session-close.ts:263` unchanged (strict is the default).
- **A4.** `scripts/test-loop-artifacts.ts`: lenient warns on each missing
  artifact; strict errors on each; `plan.md` errors in both; LOOP OPEN unchanged.
- **A5.** Move `plan.md`/`tasks.md` into `docs/plans/2026-11-16-roadmap-drain/`.
- **Verification:** `test:loop-artifacts`; a scratch
  `docs/plans/2099-01-01-scratch/plan.md` → `--lenient` exit 0 with a warning,
  without the flag exit 1, then remove it; `check:fast` PASS.

## Phase B — Ruleset-side printers (item 11)

- **B1.** `scripts/build-ruleset.ts:282-293`: pending intakes print as
  `slug=source` evidence with the install directory and the V.1 operator action;
  header `:10-11` reworded.
- **B2.** `scripts/update-rulesets.ts:44-55`: same per stale package, keeping
  `source:` and `Build workflow`, naming V.7; header `:11` reworded.
- **B3.** `scripts/test-fingerprints.ts:400` (T500): retitle without "Build
  invocation"; add `assertNotContains(r.stdout, "opencode run")`.
- **Verification:** `test:fingerprints`; the done-bar grep.

## Phase C — Duplicate `T553` (item 8)

- **C1.** Re-read the free identifier immediately before use (`T792` now).
- **C2.** `spec/appendices-reference.md:1986`: REQ-463 row `T553` → `T793`;
  `:1824` untouched.
- **C3.** `spec/02-requirements.md:4231`: REQ-463 `_Check:_` citation updated.
- **C4.** `holonovel/scripts/test-belief.ts:115-116`: title/comment renamed.
- **C5.** `npm run validate -- --write-register`; move the finding at
  `spec/audit/review-register.md:3094-3097` out of `## Scheduled-roadmap`
  (`:3085`) into a dated `## Resolved` subsection. Required by
  `checkReviewFindings` (`scripts/lib/register-checks.ts:64-70`): a scheduled
  finding whose REQ is absent from `ROADMAP.md` fails, and `REQ-284f` /
  `REQ-463` occur there only in the T553 section Phase E deletes.
- **C6.** `npm run assemble` at the end of this phase — the spec edit advances the
  build-phase-map content hash (`scripts/assemble.ts:159-166`), so deferring it
  would leave `validate` reporting a stale map.
  **Consequence:** editing a REQ body makes the next publication **Minor**
  (REQ-394), so REQ-394a needs its reconciliation record; the pipeline scaffolds
  it and its Verification line must be filled before push. Neither §5.25 nor
  Appendix F feeds a fingerprint group.
- **Verification:** the two done-bar greps; `check-fingerprint-sync`;
  `check-registers`; `test:belief`; `git status` shows the regenerated spec.

## Phase D — Single assembled spec copy (item 6)

- **D-1.** Audit every resolver of the package copy and record the read:
  `holonovel/src/index.ts:133,393,16028`, `scripts/test-spec-tooling.ts:326`,
  `scripts/lib/commit-plan.ts:39`, `scripts/spec-propagate.ts:15`,
  `holonovel/scripts/prepare-package.mjs:19-20`. Confirm none requires tracking
  and that the runtime tolerates absence only as degradation (EV5).
- **D-2.** New `holonovel/scripts/embed-spec.mjs` **[build tool]**: copy
  `../holonovel.md` to `holonovel/holonovel.md` when the source exists; when it
  does not (a git-URL install), print a notice and exit 0 so install never fails.
  Deterministic, no network, idempotent.
- **D-3.** `holonovel/package.json`: `"prepare": "node scripts/embed-spec.mjs"`.
  Verify the hook runs on `npm install`/`npm ci` in the package directory, that it
  runs after `prepack` for `npm pack`/`npm publish` (so D-8's compare gates first
  and the re-emit is idempotent), and that a registry install of the published
  tarball runs neither.
- **D-4.** `scripts/publish/steps.ts:685-701`: inside the existing
  `previous !== current` block, after the `npm ci` and build gates, assert each
  server's postcondition — `holonovel.md` exists and is byte-identical to
  `<deployDir>/holonovel.md`. When it is not, run
  `node scripts/embed-spec.mjs` in that server directory and re-check; on failure
  throw `deploy-failed: <server>: embedded spec could not be restored`. The
  emitter's exit-0-with-a-notice is the **install**-path rule (D-2); the deploy
  path requires the source, so it asserts the postcondition rather than trusting
  the exit code. `npm ci`, when it runs, already restores the copy through its
  `prepare` hook, so the emitter call is a no-op on that path.
- **D-4a.** `scripts/test-push-pipeline.ts:88-104`: the fixture gains a root
  `holonovel.md` and `holonovel/scripts/embed-spec.mjs` (copied from the repo so
  the real script runs), plus a case that changes the root spec, commits and
  pushes, runs the pipeline's deploy stage against the clone, and asserts
  `<deploy>/holonovel/holonovel.md` is byte-identical to the fixture's root copy.
  Without the fixture the D-4 branch has no evidence and aborts every deploy case
  (the loop runs against the fixture's `holonovel/` directory).
- **D-5.** `git rm --cached holonovel/holonovel.md`; add the path to `.gitignore`.
  The `files` list in `holonovel/package.json:23-33` names it explicitly, so the
  tarball still ships it (a `files` entry takes precedence over `.gitignore`).
- **D-6.** `scripts/spec-propagate.ts`: add `--check` — compare source to each
  target, write nothing, exit 1 naming `npm run assemble` on divergence or a
  missing target; header role line updated.
- **D-7.** `package.json` `check-spec-copy`; `scripts/lib/gate-manifest.ts` entry
  (fast `null`, full `npm("check-spec-copy")`); regenerate the AGENTS.md gate
  table. **Dry run first:** `cmp` is clean at HEAD, so the check exits 0; the
  self-test's divergent scratch case proves the failure path.
- **D-8.** `scripts/test-spec-tooling.ts`: `--check` self-test — identical passes,
  one-byte divergence exits 1 with the assemble hint, missing target exits 1.
- **D-9.** `holonovel/scripts/prepare-package.mjs:37`: byte comparison replaces
  `copyFileSync`; divergence exits 1 naming `npm run assemble`.
- **D-10.** `scripts/assemble.ts:6-7,152-156`: comment-only note that `assemble`,
  `spec-propagate`, the `prepare` hook, and the deploy step all write it, and
  `prepare-package` verifies at pack time.
- **D-11.** `holonovel/AGENTS.md` Boot, Two-Repo, and Packaging sections: the
  embedded copy is generated by `npm install`/`npm run assemble`/the deploy step,
  not tracked; Packaging also stops claiming a `postpack` that does not exist
  (`grep -n postpack holonovel/package.json` returns nothing, verified
  2026-11-16). `holonovel/DECISIONS.md` records the trade (a git-URL install has
  no embedded spec).
- **Verification:** `npm run assemble && git status --porcelain` clean; `git
  ls-files holonovel/holonovel.md` empty; delete the copy, `npm install` in
  `holonovel/`, confirm byte-identity and a `spec://build` body that is not
  "Specification not embedded"; `check-spec-copy`; `test:spec-tooling`;
  `check-gate-table`; divergence probe exits 1; `test:package-smoke` 11/11 and
  the packed tarball's `holonovel.md` byte-identical to the repo copy (the pack
  path's `prepare` write, NB-1); `test:pipeline` exercises the D-4a deploy case;
  confirm `ci.yml:25` / `publish.yml:48` still precede the smoke steps
  (`ci.yml:38`, `publish.yml:52`).

## Phase E — Close-out and scheduling

- **E1.** `ROADMAP.md`: delete sections 5, 6, 8, 11 (8 only after C5). Leave 1,
  2, 3, 4, 7, 9, 10 with their triggers untouched. `npm run check-roadmap`.
- **E2.** The AAR carries item 4's slice order: increment 2 triages the **23**
  `manual-undocumented` rows (document the procedure in `DECISIONS.md` or
  reclassify the row); increment 3 the **99** `automated-unexercised` rows, which
  need a builder-side evidence decision first (the `INTENDED_GAP_REQS` whitelist
  is a source disposition, not an evidence one); promotion to error-mode is
  increment 3's close.
- **E3.** `CHANGELOG.md`, `aar.md`, `npm run assemble`, `npm run build-order`,
  `npm run session:close`.

## Commit

One commit, via `npm run session:close` (D5). Phase gates run in order —
`test:loop-artifacts` + `check:fast`; `test:fingerprints`; `test:belief` +
`check-registers`; `test:spec-tooling` + `check-gate-table` + `check-spec-copy` +
`test:package-smoke` — and the close runs the fast suite again. Any phase whose
gate is red stops the increment; the tree is never committed red.

## Blast radius

| Path | Phase | Size | Rollback |
|---|---|---|---|
| `scripts/lib/loop-artifacts.ts` | A | S | revert |
| `scripts/check-loop-artifacts.ts` | A | S | revert |
| `scripts/lib/gate-manifest.ts` | A, D | S | revert |
| `scripts/test-loop-artifacts.ts` | A | S | revert |
| `docs/plans/2026-11-16-roadmap-drain/{plan,tasks,aar}.md` | A, E | S | delete |
| `scripts/build-ruleset.ts` | B | S | revert |
| `scripts/update-rulesets.ts` | B | S | revert |
| `holonovel/scripts/test-fingerprints.ts` | B | S | revert |
| `spec/appendices-reference.md` | C | S | revert |
| `spec/02-requirements.md` | C | S | revert |
| `holonovel/scripts/test-belief.ts` | C | S | revert |
| `spec/audit/req-coverage.md` | C | S | regenerate |
| `spec/audit/review-register.md` | C, E | S | revert |
| `holonovel/scripts/embed-spec.mjs` | D | S | revert (new) |
| `holonovel/package.json` | D, E | S | revert |
| `holonovel/holonovel.md` | D | L (1.79 MB deletion) | `git checkout HEAD~1 --` |
| `.gitignore` | D | S | revert |
| `scripts/spec-propagate.ts` | D | S | revert |
| `scripts/publish/steps.ts` | D | S | revert |
| `scripts/test-push-pipeline.ts` | D | S | revert |
| `package.json` | D | S | revert |
| `scripts/test-spec-tooling.ts` | D | S | revert |
| `holonovel/scripts/prepare-package.mjs` | D | S | revert |
| `scripts/assemble.ts` | D | S | revert |
| `holonovel/AGENTS.md` | D | S | revert |
| `holonovel/DECISIONS.md` | D, E | S | revert |
| `AGENTS.md` | D | S | `npm run gates -- --list --format=md` |
| `ROADMAP.md` | E | S | revert |
| `CHANGELOG.md` | E | S | revert |
| `holonovel.md` | C, D, E | S | `npm run assemble` |
| `holonovel/server.json`, both lockfiles | E | S | `npm run build-order` |

## Risks

- **Lenient mode hides an abandoned increment.** Mitigation: full mode and
  `session:close` stay strict; CI runs full.
- **The `prepare` hook changes install behaviour.** A failing hook breaks
  `npm install`. Mitigation: the script exits 0 with a notice when the source is
  absent, and the strict check stays at pack time.
- **A deploy clone can run neither install nor build** on a spec-only pull.
  Mitigation: D-4 runs the emitter in the deploy step itself; the predicate is
  `test:pipeline`'s scratch deploy.
- **`npm pack` writes the copy twice** (`prepack` then `prepare`). Mitigation: the
  compare runs first and the re-emit is byte-identical; D-3 verifies the order.
- **A git-URL install loses the embedded spec** (untracked). Mitigation: recorded
  in `DECISIONS.md`; the supported distribution is the packed artifact.
- **A full-only gate is a new gate**, so `check-gate-table` fails until the table
  is regenerated. Mitigation: D-7 regenerates it; the dry run proves green.
- **`T793` collides with a row added meanwhile.** Mitigation: C1 re-reads the
  maximum; a collision is a hard parse error, not silent last-wins.
- **The publication delta changes class** (Minor, from a REQ-body edit).
  Mitigation: the pipeline scaffolds the REQ-394a record; fill its Verification
  line before push.
- **One commit means one rollback unit.** Mitigation: every edit is a revert and
  no data or persisted format changes.

## Verification

1. `npm run assemble && npm run check:fast` — exit code captured un-piped.
2. `npm --prefix holonovel run test:all` (56/56).
3. `npm --prefix holonovel run test:package-smoke` (11/11).
4. The install-time emitter probe (D-10): delete, `npm install`, compare, check
   the runtime hash.
5. `npm run check-spec-copy`, `check-gate-table`, `check-registers`,
   `test:spec-tooling`.
6. Every predicate in the done bar, run individually.
7. `npm run build-order` before the close.

## Open questions

1. **Item 4's slice order** — the 23 manual rows first is the recommendation; the
   alternative settles the builder-side evidence mechanism first, since it sizes
   increment 3.
2. **`check-spec-copy` placement** — full-only is the recommendation. If drift
   should be visible locally, the manifest entry moves to fast with no other
   change.
3. **The `prepare` hook's reach** — D-3 assumes `npm install`/`npm ci` in the
   package directory runs it, that it runs after `prepack`, and that a registry
   install runs neither. D-3 verifies all three; if `npm ci` skips hooks, the
   fallback is the deploy-step emitter alone plus a boot-procedure note.

## Conditions (cold pass cap reached)

The cold pass failed on B-1 and the single allowed diff re-review confirmed the
deploy-clone half of it. Revision 3 resolves both by design (install hook plus
deploy-step emitter). No third cold pass was run; build-review verifies each
residual:

- **C-1** — the `prepare` hook actually runs where D-3 claims, and in the
  `prepack` → `prepare` order; otherwise the pack compare is vacuous.
- **C-2** — the deploy step's emitter branch is exercised by D-4a's fixture case,
  and a spec-only pull restores the copy byte-identically.
- **C-3** — `npm pack` ships `holonovel.md` despite the `.gitignore` entry
  (`test:package-smoke` is the check), and the packed bytes equal the repo copy.
- **C-4** — no fingerprint group covers §5.25 or Appendix F; `check-fingerprint-sync`
  would surface the opposite.
- **C-5** — the deploy emitter's postcondition assertion is placed inside the
  `previous !== current` block and after the `npm ci`/build gates, so a no-op
  deploy does not run it and a hook-restored copy is not re-emitted.
- **C-6** — three independent passes ran and none returned a pass token; the
  recorded exception above is the §0 basis. One design change (D-4a's fixture)
  is new since the last review and is verified only by its own test.
