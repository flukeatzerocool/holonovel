# Increment artifacts

Per-increment working record for the session loop:

```
questions → research → plan → execute → AAR → fix if necessary → commit
```

These artifacts are **tracked** (unlike `plans/`, which stays gitignored). They
are the loop's memory: a plan and an AAR that git cannot see cannot be audited,
linked from a commit, or recovered next session.

## Layout

```
docs/plans/<YYYY-MM-DD>-<slug>/
  plan.md    — why, scope, blast radius, phases, done bar
  tasks.md   — dependency-ordered task breakdown
  aar.md     — after-action report, ending in LOOP PAUSED or LOOP OPEN
```

`scripts/check-loop-artifacts.ts` enforces the contract; `npm run session:close`
refuses to commit an increment that fails it.

## The seven steps

1. **Questions.** State what is being asked, in the user's words, before
   research. Unanswered questions go in `plan.md` under Open questions.
2. **Research.** Repo evidence first (file:line), external standards second.
   Record the evidence class (`repo`, `web`, `user`) beside each claim.
3. **Plan.** Write `plan.md` with a **Done bar** line. A bar that cannot be
   reached in one session is not a bar — schedule the remainder on
   `ROADMAP.md` in the same increment.
4. **Execute.** Work the plan; a deviation is an amendment to `plan.md`, not a
   silent improvisation.
5. **AAR.** Write `aar.md`. Every finding gets a disposition: a dated
   `ROADMAP.md` entry, a `review-register.md` row, or an explicit
   record-and-close. A prose recommendation with no owner is not a finding —
   that is the documented way retrospectives fail.
6. **Fix if necessary.** Fixes found by the AAR land in the same increment when
   they are small and gate-visible; otherwise they are scheduled (step 5).
   Batching remediation at the end of a build is the anti-pattern.
7. **Commit.** `npm run session:close` derives the commit subject from the
   CHANGELOG heading, verifies the AAR, runs the fast gates, and commits.

## AAR terminal tokens

Every `aar.md` ends with exactly one:

- `LOOP PAUSED` — gates green, no open P0/P1 beyond the scheduled roadmap,
  zero new action items.
- `LOOP OPEN` — an action item remains, and it is named with its tracking
  surface (`ROADMAP.md` entry or register row).

## Naming

`<YYYY-MM-DD>-<slug>`, lowercase, hyphenated. The date is the session date; the
date in `CHANGELOG.md` and the commit subject must equal it.

## Relationship to `plans/`

`plans/` holds the earlier, untracked working directories. They are not
migrated: the gate applies to `docs/plans/` only, so legacy artefacts cannot
retroactively block a commit.
