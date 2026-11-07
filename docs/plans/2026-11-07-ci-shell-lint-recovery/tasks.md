# Tasks — CI shell lint recovery

- [x] T1 Confirm the failure and its cause: `gh run view 42409264303
      --log-failed` → SC2034 `GREEN` at `scripts/push-pipeline.sh:27`; the
      declaration survived `20e76d3` while its uses moved to
      `scripts/publish/run.ts`.
- [x] T2 Remove `GREEN=` from both color branches (no other shell edit).
- [x] T3 Add the unused-color-declaration detector to `shellIssues`
      (`scripts/lib/script-discipline.ts`).
- [x] T4 Add the dead-`GREEN` / live-`RED` fixture to
      `scripts/test-script-tooling.ts` and assert both.
- [x] T5 Collect one shell entry-point list (all `.sh` plus every `.githooks`
      hook, adding `commit-msg`) and run `shellcheck -S warning` over it when
      installed; print a notice and pass when it is absent.
- [x] T6 Update the AGENTS.md shell-discipline paragraph.
- [x] T7 Negative control: append a dead `BLUE` declaration, confirm the TS
      detector and real shellcheck both fail, restore the file.
- [x] T8 Self-tests, `check:fast`, and full `check`.
- [x] T9 CHANGELOG entry and this increment (plan, tasks, AAR).
- [ ] T10 Push and confirm the CI run is green (publication step).
