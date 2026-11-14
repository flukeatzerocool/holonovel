Reviewer: review (cold; diff re-review of v2 → v3)
Plan sha256: 79bbf8034d2c7849560dd270cf44db45e64223d93698226dede3e3000431ed6e
Prior plan sha256: 20142aa1c325735980d0d384a7f6189ac15a9626b3265b9e18375b2d3cbe3af6
Prior findings: docs/plans/2026-11-14-trust-core-envelope-remainder/cold-review.md
Target: /home/fluke/Holonovel/docs/plans/2026-11-14-trust-core-envelope-remainder/plan.md
Reads: 6 / 10

# Diff re-review — v2 → v3

Read only the artifact plus ID-availability checks; no new lens sweep.

## Prior findings

| # | Status | Settling line |
|---|---|---|
| **B1** (search hits carry no `badge_scope`) | **Resolved** | `plan.md:227-237` (D9): hits are `RulesetIndexEntry` rows with no badge data or collection key; the search leg is removed from C4 (`plan.md:278-285`), from done bar 4 (`plan.md:58-62`), and scheduled as F-P1-17 with its own ROADMAP bullet and `Scheduled-roadmap` row (`plan.md:69-74`, `plan.md:318-324`). Scope is now internally honest rather than silently no-op'd. |
| **M1** (T636 taken) | **Resolved** | `plan.md:45`, `plan.md:164`, `plan.md:305`; T783 verified unused: no match in `spec/` or `holonovel/` (only the plan/tasks mention it). Premise records why T636 is unavailable. |
| **M2** (producer inventory / unsafe collapse) | **Resolved** | `plan.md:89-94` now names `refusalResult` at `:282`/`:1992` (two sites), `dispatcherRefusal` at `:1956-1967` called at `:1984`/`:2000`, the façade literals at `:17714`/`:17721`, and the `:1953-1955` exact-text comment; D1 (`plan.md:183-191`) refuses the collapse for the asserted-text reason; C1 (`plan.md:260-265`) keeps both helpers. Also carries `as const` (n2). |
| **M3** (Appendix F T179) | **Resolved** | `plan.md:292-294` rewrites the `:1677` row to the synthetic lookup/info assertion bound to REQ-002c1/REQ-002c2; done bar 5 (`plan.md:66-67`) and blast radius (`plan.md:335`) carry it; premise (`plan.md:156-162`) records REQ-002c2's `_Check:`. |
| **M4** (§5 map granularity) | **Resolved** | `plan.md:67-68`, `plan.md:294-295` — map edit dropped, existing family-level REQ-210 row cited instead; `spec/02-requirements.md` row now lists only REQ-336a/548c/002c1/210c (`plan.md:334`). |
| **M5** (script names) | **Resolved** | `plan.md:412` uses `check-registers`, `check-roadmap`, `check-loop-artifacts` (matches `package.json:26,30,80`), consistent with done bar 7 (`plan.md:77`). |
| **M6** (`manage_ruleset (action: search)` surface) | **Resolved, with residue** | Premise `plan.md:132-138` now names `index.ts:13611-13637`; out of scope `plan.md:432`. Residue → **N3** below (F-P1-17's recorded predicate omits that site). |
| **M7** (`info` leg unasserted) | **Resolved** | Done bar 4 `plan.md:60-62`; C6 `plan.md:312-315` adds a GM-only `info` entry plus Player `[NOT_FOUND]` and GM-visible assertions; premise `plan.md:139-141` notes `info` is a model-entry lookup. Residual contract gap → **N4** below. |
| **M8** (unfiltered match total) | **Resolved** | `plan.md:229-233` (D9) states the count must be filtered too or it leaks; carried into out of scope `plan.md:432-433`. |
| **n1** (D2 rationale) | **Resolved** | `plan.md:196-199` now acknowledges the split is documented in code (`index.ts:305-308`) but not in the spec. |
| **n2** (`as const`) | **Resolved** | `plan.md:184`, `plan.md:260-261`. |
| **n3** (measurement convention) | **Resolved** | `plan.md:296-298`: predicted values pre-stated, measured values recorded in the AAR. |
| **n4** (G2 description) | **Resolved** | `plan.md:307-309`: "G2 probes a fixed four-call list" (matches `test-output-contracts.ts:770-775`). |
| **n5** (raw-site enumeration command) | **Resolved** | `plan.md:87-88` names `grep -c 'return err('` and the `node -e` regex for `raw()` sites. |

## New findings introduced by the revision

- **N1 [clarity] Minor — the scope change was not propagated to User impact.**
  `plan.md:421-423` still states entries are absent from "lookups, enumerations,
  hints, **search**, and info", contradicting `plan.md:223-237` (D5/D9) and
  `plan.md:432` (search out of scope). Rewrite that sentence to drop `search`
  (and state that the search surface remains open under F-P1-17).

- **N2 [clarity] Minor — blast radius still lists `GuardRefusal` as changed.**
  `plan.md:333` reads "delete `refusalResult`, `GuardRefusal`, `rulesetEntryVisible`
  + three applications", while `plan.md:263-264` says `dispatcherRefusal` and
  `GuardRefusal` stay as they are. Drop `GuardRefusal` from that cell (and note
  "three applications" is now two — `plan.md:280-282`).

- **N3 [design] Minor — F-P1-17's predicate does not cover the host search tool.**
  `plan.md:321-322` records the new finding's predicate as "`index.ts:2319` +
  `:2323`", omitting `index.ts:13611-13637` (`manage_ruleset (action: search)`),
  which `plan.md:136-138` identifies as the same leak. A scheduled finding whose
  predicate excludes half the surface invites a partial fix later; name both
  sites.

- **N4 [design] Major — the `info` leg rests on a field no contract requires.**
  C4(b) filters the `info` scan including `pkg.model.info[schema.name]`
  (`index.ts:2390`, range cited as `:2384-2397` at `plan.md:281-282`), and C6
  adds "a GM-only `info` entry" to the synthetic package (`plan.md:312-315`).
  But REQ-210c as written obliges **Concepts and Entities** entries to carry
  `badge_scope` (`plan.md:287-290`, D4 `plan.md:210-215`); nothing in the
  enabling contract tells the builder to emit that field on `model.info` entries,
  and absent means `shared` (`plan.md:213`). So the assertion passes only because
  the test fixture declares an unbriefed field, while a real package's
  info-backed GM-only entry stays visible — the REQ-445 hole the done bar claims
  to close. Fix by one clause: extend REQ-210c (or REQ-002c1) to entries served
  through an `info`-kind tool, or record that the info leg is a host-tolerance
  assertion and leave info-backed visibility to F-P1-17's scope.

## No new hard blocker

Re-checked against §0/§1/§2 hard gates after the edits: artifact present; done
bar executable; every named file still appears in the blast-radius table;
register coupling complete (three `Resolved` rows + one new `Scheduled-roadmap`
row + a matching ROADMAP bullet, which `check-registers` cross-checks); the
spec-addition consequences (coverage register, Appendix index, no fingerprint,
no behavioral-config entry) are named; ROADMAP keeps 3 bullets + one `Trigger`,
inside `check-roadmap`'s 1–3 admission rule. N4 is a contract-completeness Major,
not an execution blocker.

Prior Unknowns U2 (`manage_ruleset (action: search)` badge gating) now belongs to
F-P1-17; U3–U6 are unchanged by this diff and still stand.

independent-review passed. stages 5/5
