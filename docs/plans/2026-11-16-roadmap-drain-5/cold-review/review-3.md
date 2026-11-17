# Cold review 3 — 2026-11-16-roadmap-drain-5 (full pass, escalation)

Reviewer: cold subagent, no authoring context.
Plan artifact: `docs/plans/2026-11-16-roadmap-drain-5/plan.md`
sha256 `f439929897bc36eeac56d89e5d4d8642ccce16065b7bb5ea26d768158165163f`, verified with
`sha256sum`, 150 lines, `git HEAD 6155f9c`.
Companion: `tasks.md` sha256 `28b82de9…365d8`, 37 lines.
Evidence sidecar: `…/fe586f09…/plan.evidence.json` (provenance only; its hash does **not** match
the artifact — see B2).
Prior reviews: read as records only (`review-2.md`); no prior conclusion treated as settled.
Gate depth: **standard**. Rollback cost 1 (reversible text, one commit).

## Stage-by-stage

| Stage | Scope | Result |
|---|---|---|
| 1 — artifact & independence (§0) | hash, line count, sidecar provenance, prior-review hashes | **B2**: sidecar describes a different artifact. Artifact itself is persisted, hashed, and 150 lines. |
| 2 — completeness, scope, blast radius (§1–§2) | every phase/task file vs the table; implicit requirements; spec-project checks | Blast radius **complete** (all seven code files, the increment dir, `corpus.md`, `req-coverage.md`, `ROADMAP.md`, `review-register.md`, `CHANGELOG.md`). Register coupling and `check-registers` ordering are correct. |
| 3 — evidence re-measurement | EV2–EV5 against the tree at `6155f9c` | Mostly holds: 85 rows, 75 distinct T-IDs, T497 ×8, T541 ×2, T493/T682/T542 ×1, the three non-evidence ID occurrences, `check-vendor-manifest` `ROOT`, `check-conversion-evidence` flags. Two claims deferred. |
| 4 — dependency order & assets (§3–§4) | task dependencies, gate ordering, committed targets | Sound. P4's "register after ROADMAP" matches `register-checks.ts:64-67`. Task 10 precedes the gates that consume it. |
| 5 — verification, done bar, gates, adversarial (§5–§8) | V1–V7 decidability, closure arithmetic, gate interactions | **B1**: the per-row probe cannot work. **M1**: task 10's check false-fails. **M2**: T497 label instruction can silently no-op. **M3**: `closed()` has no format. |

## Direct answers to the two questions

**1. Done-bar determinism / `N ∈ {80, 72}`.** The arithmetic is **correct and derivable**.
`corpus.md` holds exactly 85 rows (`validate.ts:2654-2655` writer; `corpus.md:3-87`), 75 distinct
T-IDs. Singleton rows for `T493` (`corpus.md:14`), `T682` (`:87`), `T542` (`:86`); two for `T541`
(`:84-85`); eight for `T497` (`:58-65`). 85 − 5 = 80; 85 − 13 = 72. Closure mechanics also work:
`exercised` is built from root `scripts/*.ts` via `labelsFromContent` (`validate.ts:1443,1469-1472`)
and from `holonovel/scripts/*.ts` via `test(` names (`:1457-1465`), so a declared
`function check*(…): string[]` in `version-check.ts`/`surface-replay.ts` and a
`test("T541 …")`/`test("T542 …")` in `test-ruleset-gates.ts` do remove those rows
(`req-checks.ts:864-868`, `:872-902`). **But the verification of that closure is broken** (B1), so a
wrong closure set of the same size passes V2 — exactly the failure D4 exists to prevent.

**2. Evidence survives re-measurement at `6155f9c`?** Yes for everything I could measure: 85 rows;
75 distinct; the 72-absent claim is confirmed for its three exceptions (`T4`
`detect-near-dupes.ts:13`, `T130` `validate.ts:2070`, `T682` `surface-replay.ts:264`);
`labelsFromContent` admits `.push(`/`console.*` only inside a declared `function check*(…):
string[]` (`req-checks.ts:862-868`, regex `:812-823`) and `check(...)` arguments anywhere (`:861`);
`check-vendor-manifest.ts:29-31` hardcodes `ROOT`; `check-conversion-evidence.ts:29,40,114-117`
already has `--strict`/`--decisions`; `test:validators` → `test-req-checks.ts` (`package.json:66`)
with 80 textual `test("` occurrences (79 runtime cases + one fixture), consistent with 79. The
33/52 split is Deferred (not re-derived row-by-row).

## Findings

### Blockers

**B1 `[design]` — the per-row corpus probe cannot match a T-ID row, and its two written forms
disagree.** `plan.md:61` (D4) writes `grep -c '^| T493 |' <tmp>`, `plan.md:138` (V2) writes
`grep -c '^\| T493 \|'`, and `tasks.md:16,19,30-31,33` repeat the escaped form. The corpus writer
emits `| ${reqId} | ${tid} | kind | verdict |` (`scripts/validate.ts:2654-2655`; shape confirmed at
`docs/plans/2026-11-15-req-evidence-linkage/corpus.md:3-87`), so the T-ID is **column 2**.
Consequences: the D4 form matches **nothing** whether the row is present or absent → 0 is vacuous;
the V2/tasks form is GNU **BRE**, where `\|` is alternation, so the leading empty alternative
matches every line and returns 2 + N (87 at baseline). `tasks.md:30-31,33` expect `1` before
closure; neither reading yields 1. Fix: probe column 2 unanchored (`grep -c "| T493 |" <tmp>`), or
`awk -F'|' '$3 ~ / T493 /'`, and state the before/after value per row. Keep V3's
`grep -c '^| REQ-'` = `N` (`plan.md:139`), which is correct.

**B2 `[design]` — the evidence sidecar does not correspond to the reviewed artifact.**
`plan.evidence.json:11` records plan sha256 `fb6086ff…`, `:13` 151 lines, `:12` 9472 bytes. The
artifact is `f4399298…`, 150 lines. `review-2.md:4` reviewed a third hash (`1758c24b…`). So
revision 3 (the R1/R2 amendment appended at `review-2.md:101-106`) has never been cold-reviewed,
and the sidecar's target list (`:15-86`) omits two blast-radius rows —
`docs/plans/2026-11-15-req-evidence-linkage/corpus.md` and `spec/audit/req-coverage.md`
(`plan.md:85`). Fix: re-run `preflight` on `f4399298…` with all twelve blast-radius targets before
stamping `fresh`.

### Major

**M1 `[design]` — task 10's check is unsatisfiable for `req-coverage.md`.** `tasks.md:20` requires
"`git diff` shows only row removals". `spec/audit/req-coverage.md:6-8` carries an **Exercised
tests** column fed by the same `exercisedIds` set (`validate.ts:2628-2629`). Adding `T493`, `T541`,
`T542` (and `T497`) rewrites that cell for `REQ-107a`, `REQ-451`, `REQ-451a`, `REQ-452`, and the
`REQ-313*/314*` rows — an edit, not a removal. A correct implementation fails its own check. Fix:
scope "only row removals" to `corpus.md`; for the register assert "only the Exercised-tests cells
of the closed REQs change; no bucket moves".

**M2 `[clarity]` — the T497 label instruction points at a site whose neighbouring idiom is a
comment.** `plan.md:110-112` and `tasks.md:19` say "label the assertion(s) at
`scripts/test-spec-tooling.ts:296-317`". That block opens with a comment (`:296`) and consists of
`check(...)` calls (`:293-318`). `labelsFromContent` blanks comments and only admits `test(...)`/
`check(...)` arguments or `.push`/`console.*`/`return` inside a declared `function check*(…):
string[]` (`req-checks.ts:731-739, 854-870`). A `// T497` label is a silent no-op — and with B1 the
probe would not reveal it. Fix: state "add `T497` to a `check(...)` message string (not the `//`
comment at `:296`)". `test-update-workflow.ts:190,199` are `test(` names, so that half is fine.

**M3 `[design]` — `closed(dispositions.md)` has no declared row format, so V7 and the done-bar
formula are not decidable.** `plan.md:71` defines `N = 85 − closed(dispositions.md)`; `plan.md:143`
(V7) and `tasks.md:12` require an `awk` over the file to prove 85 rows and `a+b+c = 85`, but the
column set is never specified (prose at `plan.md:95-96` names six fields, not an order).
Compounding it, D1 defines (b) as "authoring required, **or** a clause uncovered" and then says "a
(b) row this increment authors is marked `closed`" (`plan.md:46-49`), so `closed` is neither
class-derived nor action-derived. Fix: fix the columns (REQ | T-ID | class | cite | home line |
action) and define `closed` as a literal action value.

### Nit

**N1 `[clarity]` — task 11 omits `check-roadmap`'s `**Trigger:**` requirement.** `ROADMAP.md:36-51`
carries three bullets plus `**Trigger:**` at `:51`; `check-roadmap.ts:177-181` fails a section
without one. `tasks.md:21` only names "1–3 bullets". V6 runs the gate, so this is recoverable, but
the task is under-specified.

**N2 `[clarity]` — task 8's `--root .` check depends on cwd.** `check-vendor-manifest.ts:29-31`
derives `ROOT` as `join(import.meta.dirname, "..")` (= `holonovel/`). `--root .` exits 0 only with
cwd `holonovel/`; from the repo root it resolves to `<repo>/narrative_world_model` and exits 2.
`tasks.md:18` names neither the cwd nor `--root holonovel`.

**N3 `[clarity]` — zero line headroom.** `plan.md` is exactly 150 lines, the recorded bound
(`review-2.md:41`, `plan.md:150`). B1's remedy alone (D4 + V2 + `tasks.md:16,19,30-33`) and M2's
remedy push past 150. Note: I found no line bound in `scripts/check-loop-artifacts.ts` or
`scripts/lib/loop-artifacts.ts`, so this is a self-imposed bar, not a gate — but it is at its
ceiling.

**N4 `[clarity]` — a prose `file:line` citation drifts.** `spec/audit/review-register.md:2705` cites
`scripts/version-check.ts:112-126`; the plan restructures `:125-138` into a declared function
(`plan.md:78, 104-106`). If the signature lands at 125, the cited range ends inside it. No gate
resolves prose citations (`check-anchors` is symbol-based; no spec anchor references
`version-check.ts` — only `spec/audit/loop-audit.md:64` and this register line mention the scripts).
Informational.

### Deferred

**D1** — EV1's executed counts (`46 passed`, `85 finding(s)`, `79 passed`, A=0/B=0/C=493/D=0/E=117,
700 exercised; `plan.md:10-13`) were not re-run. Everything checkable is consistent.
**D2** — the 33/52 REQ-in-code split (`plan.md:16-18`) was not re-derived row-by-row; the stated
command is reproducible and the two spot checks I ran (`REQ-107a` at `version-check.ts:125`,
`REQ-452` via `check-conversion-evidence.ts`) hit.

## Gate interactions (explicitly checked)

- **`check-registers` ordering** — `register-checks.ts:64-67` fails a `Scheduled-roadmap` finding
  whose REQ token is absent from `ROADMAP.md`. P4's "register subsection after `ROADMAP.md`"
  (`plan.md:126-127`, `tasks.md:21`) is **correct**.
- **`check-tool-surface` / `surface-budget` / `action-conflicts`** — unaffected. No registered tool,
  action, or parameter changes; the only new flag is on `check-vendor-manifest.ts`, which is not a
  tool definition.
- **Harness gating (`validate.ts:1507-1531`)** — no new harness file; `test-ruleset-gates.ts` and
  `test-update-workflow.ts` are already referenced by `holonovel/package.json` scripts. No new
  gating obligation.
- **Test-name gates** — `checkTestNameInflation` (`validate.ts:1539-1553`) counts IDs before the
  colon; `T541/REQ-451:` is one ID, and `T689/T497/REQ-395c` is two. Safe. `checkHarnessTitleIds`
  (`:2691`) resolves both IDs to Appendix F.
- **Nominal-evidence ratchets (`validate.ts:2712-2724`)** — `applyRatchet` fails only when a count
  **rises**; adding exercised IDs lowers `appendixFAssertionMiss`. Safe **provided** new test names
  stay single-ID — a bundled name could raise `bundledOnlyBucketC`. Task 7's names do.
- **`check-anchors`** — no spec anchor resolves to `version-check.ts`/`surface-replay.ts`; symbol
  names are preserved by the extraction, so no anchor should move.

## Unknowns

- EV1's gate counts and the 79 vs 80 test-occasion difference (one textual `test("` sits in a
  `labelsFromContent` fixture) — would be settled by running `npm run test:validators`.
- Whether `test-ruleset-gates.ts` prints a case count that V5's "two more passing cases" can be read
  against — not read.
- The 33/52 per-row split.

Reads used: **39/40** read/grep (plus 5 read-only shell calls, one denied). No gate was executed.

independent-review FAILED. Blockers 2 · Majors 3 · Nits 4 · Deferred 2 · reads 39/40

**Note on disposition:** B1 and M1/M2 are amendment-scale, not rewrite-scale, but B1 must be fixed
before the done bar means anything, and B2 requires a fresh `preflight` run on `f4399298…`. Since
both Blockers are `design` (not `clarity`), no single-stage re-audit is implied; this artifact is at
the escalation cap, so the unresolved list goes to the user rather than another full sweep.

## Resolution (author amendment, revision 4)

- **B1** — D5 now defines the probe as `grep -cF '| T493 |' <corpus>` (fixed string, column 2, no
  anchor) with the expected `1 → 0` per row; V2 points at D5; `tasks.md` states the column-2 rule
  and uses prose for pipe-bearing commands.
- **B2** — `preflight` re-ran on revision 4 (`3576abfe…`) with all twelve blast-radius targets; the
  sidecar now matches the stamped artifact.
- **M1** — task 10 splits the claims: `corpus.md` is row removals only; `req-coverage.md` changes
  only the `Exercised tests` cells of the closed REQs, with no bucket movement.
- **M2** — the T497 label is specified as a `check(...)` message string, explicitly not the comment.
- **M3** — D2 fixes the column order and makes `closed` a literal `action` value.
- **N1–N2** — task 11 keeps `**Trigger:**`; task 8 checks `--root holonovel` from the repo root.
- **N3** — revision 4 is 149 lines (one line of headroom).
- **N4** — informational; the restructure keeps the symbol, so no anchor resolves to it.
