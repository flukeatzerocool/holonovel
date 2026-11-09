# Tasks — full-review sweep, increment 1 (chunk P1 + M1)

Dependency-ordered. `[ ]` open, `[x]` done. Update during execution; the plan's
steps are authoritative for detail.

## Phase 0 — baseline, decisions, worklist

- [x] T1 Record the measured baseline (EV1–EV10) in `plan.md`.
- [x] T2 Write `worklist.md` with rows for P1–P8 and M1, plus the mapping invariant.
- [x] T3 Confirm the artefact directory is trackable (`git check-ignore -v` → no output).
- [x] T4 Record the Q1–Q4 answers as D1–D4 in `plan.md` before review work.
- [x] T5 Re-run `npm run check:fast` un-piped and run `npm run check` once, so the
      full-gate baseline is measured. Red baseline → commit C0 first.

## Phase 1 — chunk P1 (trust core)

- [x] T6 Enumerate the P1 surface with `file:line` anchors; record in `worklist.md`.
- [x] T7 Run `code-review` over the P1 surface; collect findings with predicates.
- [x] T8 Cross-check §5.1/§5.5 `*Check:*` citations against the harnesses that
      actually exercise them; log false-C candidates.
- [x] T9 Fill the P1 per-REQ verdict table (125 rows) in `worklist.md`.
- [x] T10 Triage findings P0–P3; fix P0 in-session or invoke the stopped-run
      landing defined in `plan.md`.
- [x] T11 Add register rows under the section each disposition names
      (`## Resolved` / `## Scheduled-roadmap` / `## Closed-P3`).

## Phase 2 — machine evidence (M1)

- [x] T12 `npm run check:conformance`; record exit and findings.
- [x] T13 `npm run fmea`; record output and disposition findings.
- [x] T14 `npm run graph-deps`; record output and disposition findings.
- [x] T15 Append the Delta amendment to `worklist.md`.

## Phase 3 — roadmap, registers, gates, artefacts

- [x] T16 Amend `ROADMAP.md` (range per Q1, replaced bullets for the chunk
      series, trigger = next chunk).
- [x] T17 `CHANGELOG.md` dated heading (date = CalVer date).
- [x] T18 Write `aar.md` with the outgoing token (`LOOP PAUSED` or `LOOP OPEN`).
- [ ] T19 Gates un-piped: `assemble`, `check:fast`, `check`, `build-order`,
      `check-loop-artifacts`, `check-roadmap`, `check-registers`.
- [ ] T20 `npm run session:close` (one commit; C0 first only if the baseline was
      red). No push.
