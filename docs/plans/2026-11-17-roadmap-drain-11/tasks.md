# Tasks — Roadmap drain 11: close REQ evidence linkage

Increment: `docs/plans/2026-11-17-roadmap-drain-11` · Plan: `plan.md` (revision 1)
Baseline the plan was written against: git HEAD `430e2bb`, tree clean, `check:fast` PASS
(46/46), `validate` 0 errors with 47 linkage findings.

Tick a task only when its acceptance line is satisfied; `aar.md` (P5) records the readings,
not the ticks.

## P1 — Dry run, tasks list, dispositions

- [x] `npm run validate` reproduces `REQ evidence linkage: 47 finding(s)` and `0 error(s)`.
- [x] `grep -c '^| REQ-' docs/plans/2026-11-15-req-evidence-linkage/corpus.md` reads `47`.
- [x] `grep -n "@section evidence" holonovel/DECISIONS.md` returns exactly one line (`:2511`).
- [x] The six record labels are present at `holonovel/DECISIONS.md:2513-2518`, and each value
      satisfies D2's clauses (workflow token, ISO timestamp, pass/fail token, non-empty).
- [x] `dispositions.md` written: one row per finding
      (`| REQ | T-ID | class | evidence | action |`), each `evidence` cell produced by the
      phase's own grep over `scripts/` and `holonovel/scripts/`.
- [x] Stop rule honoured: no row classes `author` unless its grep shows a covering harness
      test; if one does, stop and amend `plan.md` before writing the baseline.

## P2 — `T253` (REQ-211c)

- [x] `function checkEvidenceRecordContract(decisionsText: string | null): string[]` in
      `scripts/validate.ts`, called beside the linkage block, taking the already-read text.
- [x] Clauses (a)–(e) implemented: block presence, six exact labels with non-empty values,
      canonical workflow token, ISO-8601 timestamp, `pass`/`fail`.
- [x] Missing marker, missing label, malformed timestamp, unknown workflow token, and a
      non-`pass`/`fail` value each fail with `T253`.
- [x] Probe: delete `- **Timestamp** — …`; `validate` reports `T253`; restore; tree clean.
- [x] `npm run validate -- --write-register` reports `REQ evidence linkage: 46 finding(s)` and
      writes `spec/audit/req-coverage.md`; the `REQ-211` row's *Exercised tests* cell gains
      `T253` (P1 reads the pre-edit cell, expected `S22` → `S22, T253`).
- [x] A following plain `npm run validate` exits 0 with `PASS: Coverage register is current`.
- [x] Reachability from `main()` and the probe are recorded as the proof of behaviour; the count
      drop is not treated as proof (the predicate harvests the label from the check's own
      message literals).

## P3 — `T87` reconciliation (REQ-100a/b)

- [x] `spec/appendices-reference.md:1569` no longer asserts a latency threshold; the cold-start
      tier clause and the recording clauses stay.
- [x] `npm run assemble` succeeds; `git diff --stat` shows `holonovel.md` and
      `spec/build-phase-map.md` only.
- [x] `npm run validate` stays `0 error(s)` at `46 finding(s)`.

## P4 — Baseline and error mode

- [x] `LINKAGE_CLASSES`, `LinkageBaselineEntry`, and `diffLinkageBaseline` in
      `scripts/lib/req-checks.ts`; key is `REQ|T-ID`; only `automated-unexercised` is
      suppressible; stale, invalid, and duplicate keys reported.
- [x] `scripts/validate.ts` loads `spec/audit/evidence-linkage-baseline.json`, prints
      `REQ evidence linkage: 46 baselined, 0 unbaselined finding(s)`, and counts unbaselined,
      stale, and invalid entries into `errors`; `warnings += linkage.length` removed.
- [x] `--write-linkage-baseline` writes the file deterministically (sorted, existing class and
      evidence preserved, new keys `unclassified`/empty, dropped keys reported);
      `--write-linkage-corpus` and its block removed.
- [x] Baseline file holds 46 entries, every class in the closed set, every evidence non-empty.
- [x] Probes: unbaselined (delete one entry), stale (add `REQ-999|T999`), invalid
      (class `unclassified`), `no-row` (add `T999` to a `_Check:_` line, `assemble`) — each
      fails with its stated message and restores.
- [x] `npm run test:validators` covers the six diff cases and the four T253 parser cases.

## P5 — Registers, artifact, gates

- [x] `ROADMAP.md` item 3 retired; four `## ` sections remain; `npm run check-roadmap` passes.
- [x] Review register: `## Scheduled-roadmap` linkage subsection closed; new
      `## Resolved — 2026-11-17 REQ evidence linkage closed` section appended.
- [x] `spec/audit/req-coverage.md` current (`PASS: Coverage register is current`); the P2 diff
      shows the `REQ-211` row's `S22` → `S22, T253` change (register is family-keyed).
- [x] `AGENTS.md` documents `--write-linkage-baseline` in place of `--write-linkage-corpus`.
- [x] `docs/plans/2026-11-15-req-evidence-linkage/corpus.md` deleted.
- [x] `aar.md` written with the terminal token filled before any gate run; V1–V9 recorded;
      `check:fast` run last, un-piped; `npm run session:close --single` commits.
