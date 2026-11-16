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
  review.md  — optional: the verdict rows, when the increment is a review
  aar.md     — after-action report, ending in LOOP PAUSED or LOOP OPEN
```

`plan.md`, `tasks.md`, and `aar.md` are required. `review.md` is not — a review
increment adds it so every row's verdict and predicate outlives the session.

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
7. **Close.** In order:
   a. Author the `## Changelog entry` block in `aar.md` (see "The Changelog
      entry" below); `npm run session:close` renders it into `CHANGELOG.md`
      under the session date. A hand-written entry still works — an existing
      dated heading wins — but then the block must match its title or the
      close refuses.
   b. Run `after-action-report` and write `aar.md`.
   c. Apply any fix it surfaces; re-run the AAR if a finding changed the work.
   d. Run `npm run session:close`. It derives the commit subject from the
      CHANGELOG heading, requires the increment's `aar.md` to end
      `LOOP PAUSED`, runs the fast gates, and commits.

## The Changelog entry

`session:close` writes the dated `CHANGELOG.md` block from `aar.md`, so the AAR
and the release note cannot drift. Put one `## Changelog entry` section at the
end of the AAR:

```
## Changelog entry

**Title:** One line, no date prefix, 100 characters or fewer.

**Summary:** One paragraph.

- one bullet
- up to eight bullets
```

An existing `## <date> — <title>` heading in `CHANGELOG.md` wins and must match
the block's title; a missing block warns and keeps the hand-written entry; a
malformed block (no title, empty summary, no bullets, or more than eight) makes
the close exit 1.

## AAR terminal tokens

Every `aar.md` ends with exactly one:

- `LOOP PAUSED` — every finding has a terminal disposition, and the gating
  suite is green. A terminal disposition is one of: fixed in the increment; a
  dated `ROADMAP.md` entry; a `spec/audit/review-register.md` row; or
  record-and-closed, a dated note in the AAR saying why no action is taken.
- `LOOP OPEN` — at least one finding has no terminal disposition. Name it.

The close refuses an increment whose `aar.md` ends `LOOP OPEN`: resolve or
schedule the named action, then re-run the AAR.

A commit made without running `session:close` is not gated. The AAR contract
applies to closes.

## Naming

`<YYYY-MM-DD>-<slug>`, lowercase, hyphenated. The date is the session date; the
date in `CHANGELOG.md` and the commit subject must equal it.

## Relationship to `plans/`

`plans/` holds the earlier, untracked working directories. They are not
migrated: the gate applies to `docs/plans/` only, so legacy artefacts cannot
retroactively block a commit.
