# Plan — Two loops, one cadence

**Status:** Approved (user, 2026-11-06; plan-review passed, deep depth).
**Mode:** planned. **Gate:** build-review.
**Review artifact:** `~/.local/state/opencode/plans/fe586…/2026-11-07T02-57-56-894Z-d6574b36.md`
(sha256 `d6574b36…2ad5c`).

**Done bar:** phases 0–4 implemented and gated; `check:fast` and `check` pass;
the hermetic pipeline harness passes; one real increment closed via
`session:close`; phases 5–6 complete or scheduled on `ROADMAP.md`.

## Why

See the full diagnosis in the reviewed artifact. In short: the session loop's
content is disciplined but its memory is gitignored; the publication loop is a
894-line hand-rolled CI/CD system with 9 post-mortem comments, no run record,
no resume, and no test. Shared root cause: state outside the repository and
outside any check.

## Phases

0. Measurement — loop audit, gate timing, hook events.
1. Durable session loop — tracked `docs/plans/`, artifact gate, `session:close`.
2. Gate layering — run manifest replaces env-var suppression; generated doc table.
3. Pipeline decomposition — preflight, step registry, resume; legacy retained.
4. Hermetic harness — scratch repo, bare remote, fake deploy.
5. Cadence and gate retirement.
6. Bookkeeping.

## Non-goals

- No normative REQ body changes. REQ-394 and REQ-418 keep their contracts.
- No branching model change; no history rewrite.
- No push, tag, publish, or deploy in this increment.
