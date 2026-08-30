# Plans and Tasks Artifacts

Per-increment Spec Kit phased artifacts. Each spec-driven update (§6.7) and
each standard build that changes spec scope produces one increment directory
here. These artifacts feed the converge phase; they are not part of the
assembled `holonovel.md`.

## Layout

```
plans/<date>-<slug>/
  plan.md    — the increment plan (what changes, which REQs/gates are touched)
  tasks.md   — the dependency-ordered task breakdown the builder executes
```

## plan.md shape

- **Summary** — one paragraph: what the increment changes and why.
- **REQ delta** — REQs added, amended, or removed, cited by ID.
- **Gate mapping** — which verification workflows (G0a–G8, H1–H18) the
  increment exercises.
- **Decision points** — operator decisions to record in DECISIONS.md.

## tasks.md shape

- Ordered, dependency-respecting task list; each task is one verifiable step.
- Tasks map to §5 REQs and §6 build phases; a task is done when its
  `_Check:` citation or gate passes.

## Discipline

A plan is complete when `npm run assemble && npm run check:fast` passes and
the increment's REQ delta is reflected in the Appendix E manifest and
Appendix F test catalogue. Superseded increments remain in place as the
increment history.
