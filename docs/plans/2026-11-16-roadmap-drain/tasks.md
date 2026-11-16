# Tasks — Roadmap drain

Draft staged in gitignored `plans/` (D5). Line numbers are current at `5a26f11`;
re-grep before editing. One commit at the close (D5); each phase's gate runs
before the next phase starts.

## Phase A — Loop artifact gate ordering (item 5)

- [ ] A1 `scripts/lib/loop-artifacts.ts`: `options.lenient?: boolean` (default
      false); missing `tasks.md` (`:69`) and `aar.md` (`:72`) become `warning`
      when lenient, stay `error` otherwise. `plan.md` missing (`:66`), the
      missing LOOP token (`:78`), and `nameProblem` stay unconditional.
- [ ] A2 `scripts/check-loop-artifacts.ts`: `--lenient` via `parseFlag` /
      `rejectUnknown`; header, usage, exit-code text updated;
      `validateIncrements(ROOT, { lenient })`.
- [ ] A3 `scripts/lib/gate-manifest.ts:311-316`: fast `--lenient`, full with no
      flag; `scripts/session-close.ts:263` unchanged.
- [ ] A4 `scripts/test-loop-artifacts.ts`: lenient warns on each missing
      artifact; strict errors on each; `plan.md` errors in both; LOOP OPEN
      unchanged.
- [ ] A5 Move `plan.md`/`tasks.md` from `plans/2026-11-16-roadmap-drain/` to
      `docs/plans/2026-11-16-roadmap-drain/`.
      Gate: `check-loop-artifacts --lenient` PASS-with-warning on a scratch
      increment; without the flag exit 1; `check:fast` PASS.

## Phase B — Ruleset-side printers (item 11)

- [ ] B1 `scripts/build-ruleset.ts:282-293`: pending intakes print as
      `slug=source` evidence with the install directory and the V.1 operator
      action; no `opencode run`; header `:10-11` reworded.
- [ ] B2 `scripts/update-rulesets.ts:44-55`: same for stale packages, keeping
      `source:` and `Build workflow`, naming V.7; header `:11` reworded.
- [ ] B3 `holonovel/scripts/test-fingerprints.ts:400`: T500 retitled without
      "Build invocation"; add `assertNotContains(r.stdout, "opencode run")`.
      Gate: `npm --prefix holonovel run test:fingerprints`;
      `grep -rn "opencode run" scripts/` empty.

## Phase C — Duplicate `T553` (item 8)

- [ ] C1 Re-read the free identifier (`T792` expected) immediately before use.
- [ ] C2 `spec/appendices-reference.md:1986`: REQ-463 row `T553` → next free ID
      (`T793` unless C1 says otherwise); `:1824` untouched.
- [ ] C3 `spec/02-requirements.md:4231`: REQ-463 `_Check:_` citation updated.
- [ ] C4 `holonovel/scripts/test-belief.ts:115-116`: title/comment renamed.
- [ ] C5 `npm run validate -- --write-register`; move the finding at
      `spec/audit/review-register.md:3094-3097` out of `## Scheduled-roadmap`
      (`:3085`) into a dated `## Resolved` subsection. Required by
      `checkReviewFindings` (`scripts/lib/register-checks.ts:64-70`).
- [ ] C6 `npm run assemble` at the end of this phase (build-phase-map hash).
      Record: the REQ-body edit makes the next publication Minor (REQ-394/394a).
      Gate: `grep -c '^| T553 '` = 1; `grep -rn 'T793' spec/` and
      `grep -rn 'T793' holonovel/scripts/`; `check-fingerprint-sync`;
      `check-registers`; `npm --prefix holonovel run test:belief`.

## Phase D — Single assembled spec copy (item 6)

- [ ] D-1 Audit every resolver
      (`holonovel/src/index.ts:133,393,16028`, `scripts/test-spec-tooling.ts:326`,
      `scripts/lib/commit-plan.ts:39`, `scripts/spec-propagate.ts:15`,
      `holonovel/scripts/prepare-package.mjs:19-20`); record that none needs a
      tracked file and absence is a degradation (EV5).
- [ ] D-2 New `holonovel/scripts/embed-spec.mjs`: copy `../holonovel.md` →
      `holonovel/holonovel.md`; exit 0 with a notice when the source is absent;
      idempotent, no network.
- [ ] D-3 `holonovel/package.json`: `"prepare": "node scripts/embed-spec.mjs"`;
      verify it runs on `npm install`/`npm ci` in the package dir, runs after
      `prepack` for pack/publish, and does not run for a registry install.
- [ ] D-4 `scripts/publish/steps.ts:685-701`: inside `previous !== current`, after
      the `npm ci`/build gates, assert each server's `holonovel.md` equals
      `<deployDir>/holonovel.md`; when not, run `node scripts/embed-spec.mjs`
      there and re-check, else throw `deploy-failed: … spec could not be
      restored`. Emitter exit-0-with-notice is the install rule; the deploy
      asserts the postcondition.
- [ ] D-4a `scripts/test-push-pipeline.ts:88-104`: fixture gains root
      `holonovel.md` and `holonovel/scripts/embed-spec.mjs`; a case changes the
      root spec, commits/pushes, runs the deploy stage, and asserts
      `<deploy>/holonovel/holonovel.md` is byte-identical.
- [ ] D-5 `git rm --cached holonovel/holonovel.md`; add the path to `.gitignore`.
      (`files` in `holonovel/package.json:23-33` still ships it — a `files` entry
      overrides `.gitignore`.)
- [ ] D-6 `scripts/spec-propagate.ts`: `--check` compares source to each target,
      writes nothing, exits 1 naming `npm run assemble`; header role line.
- [ ] D-7 `package.json` `check-spec-copy`; `scripts/lib/gate-manifest.ts` entry
      (fast `null`, full `npm("check-spec-copy")`); regenerate the AGENTS gate
      table. Dry run first: `cmp` clean at HEAD → exit 0.
- [ ] D-8 `scripts/test-spec-tooling.ts`: `--check` self-test — identical passes,
      one-byte divergence exits 1, missing target exits 1.
- [ ] D-9 `holonovel/scripts/prepare-package.mjs:37`: byte comparison replaces
      `copyFileSync`; divergence exits 1 naming `npm run assemble`.
- [ ] D-10 `scripts/assemble.ts:6-7,152-156`: comment-only note on the four
      writers and the pack-time verifier.
- [ ] D-11 `holonovel/AGENTS.md` Boot/Two-Repo/Packaging: the copy is generated by
      `npm install`, `npm run assemble`, and the deploy step, not tracked;
      Packaging stops claiming a `postpack` that does not exist.
      `holonovel/DECISIONS.md` records the git-URL-install trade.
      Gate: `assemble && git status --porcelain` clean; `git ls-files` empty;
      delete + `npm install` restores a byte-identical copy, `spec://build` is
      not "Specification not embedded", `spec_health.spec_hash` is not `unknown`;
      `check-spec-copy`; `test:spec-tooling`; `check-gate-table`; divergence probe
      exit 1; `test:package-smoke` 11/11; `test:pipeline` exercises the deploy
      branch; `ci.yml:25` / `publish.yml:48` still precede the smoke steps
      (`ci.yml:38`, `publish.yml:52`).

## Phase E — Close-out

- [ ] E1 `ROADMAP.md`: remove sections 5, 6, 8, 11 (8 after C5); leave 1, 2, 3,
      4, 7, 9, 10 and their triggers untouched. `npm run check-roadmap`.
- [ ] E2 AAR carries item 4's slice order (23 manual rows first; 99 automated
      rows need the builder-side evidence decision; error-mode promotion is
      increment 3's close).
- [ ] E3 `CHANGELOG.md` dated entry, `aar.md`, `npm run assemble`,
      `npm run build-order`, `npm run session:close` (one commit).
      Gate: `check:fast` PASS un-piped (46 gates); `test:all` 56/56.
