# Tasks — assembler appendix completeness

Dependency-ordered. Each task names its verification. All tasks complete.

1. [x] Write `scripts/lib/appendices.ts`: heading-boundary parser returning
   `{ header, preamble, blocks }`; duplicate-letter error; trailing-separator
   trim. Verify: `npm run typecheck` → exit 0.
2. [x] Rewire `scripts/assemble.ts` to use it and emit each source preamble
   before that file's first block. Verify: `npm run assemble` → exit 0,
   `appendices assembled: 26 in canonical order`, `Total lines: 14151`.
3. [x] Confirm the intended diff only: `holonovel.md` 130 added lines / 0
   removed (`git diff --numstat`), no other appendix block changed, output
   byte-identical to the plan's scratch simulation
   (`/tmp/opencode/holonovel.sim2.md`), `holonovel/holonovel.md` mirrored
   (`cmp` exit 0). Verify: `git diff`, `cmp`, `diff -u` → exit 0.
4. [x] Add four cases to `scripts/test-spec-tooling.ts` (continuation block,
   reconstruction invariant, duplicate heading, real-corpus O./matrix pin
   including matrix placement between A and B with a single separator).
   Verify: `npm run test:spec-tooling` → 97 passed, 0 failed.
5. [x] Move H-4 to `## Resolved` in `spec/audit/review-register.md`, remove the
   P0 section from `ROADMAP.md`, add the dated CHANGELOG entry. Verify:
   `npm run check-registers` → exit 0; `npm run check-roadmap` → exit 0
   (12 sections).
6. [x] Run `npm run assemble && npm run check:fast` un-piped; record exit code
   and trailing PASS line. Verify: exit 0, 41 passed / 0 failed,
   `check:fast: PASS`; `validate --sdd-strict --no-proofread` → 0 errors,
   3 pre-existing warnings.
7. [x] Replace `aar.md` with the executed report ending `LOOP PAUSED`; tick
   these boxes. Verify: `npm run check-loop-artifacts`.
8. [x] Commit as one increment via `npm run session:close`. Verify: `git log -1`
   shows the CHANGELOG-derived subject; tree clean.
