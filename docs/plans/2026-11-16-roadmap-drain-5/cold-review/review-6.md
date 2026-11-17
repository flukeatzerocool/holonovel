# Cold review 6 — roadmap drain 5, chunk 4

**Reviewer:** independent cold pass (single dispatch, no authoring context)
**Plan sha256:** `8d170d9cb8747afd54b229661b3b3b17c28b6b21fee87d92dffee32effedb5d0` (verified;
matches `plan.evidence.json:11`)
**Tasks sha256:** `e0638fbd9e546193cec4b1bfd9408319517cea5482cfbb4194b0bc2bac7f944f` (verified)
**Evidence:** `plan.evidence.json` generated 2026-11-17T02:22:37Z · git `6155f9c` · binds to this
artifact. Sidecar records 147 lines; dispatched as 146 — trailer-count difference, no content gap.
**Gate depth:** standard · **Budget:** 33/40 read/grep calls (23 reads, 10 greps) + 3 read-only shell.
**Independence note:** the five prior cold passes under `cold-review/` were **not** opened; the plan's
Review-history line (`plan.md:5-6`) was treated as a record, not evidence.

## Stage summary

**Stage 1 — zoom out.** Internally coherent about *what* it closes (five rows, 85→80) and correctly
grounded in the linkage mechanics. Two clusters do not survive: the `--root` seam is described in two
incompatible ways, and the T541 fixture is sized for a script that reads far more than the manifest.

**Stage 2 — comprehension.** Faithful: an 85-row dispositions table, four script changes that put four
T-IDs in emitting/test-name positions, corpus+register+ROADMAP+CHANGELOG regeneration, one commit,
`REQ evidence linkage: 80`. Gaps are in fixture seams, not intent.

**Stage 3 — critics.** Mechanism audit **passes** (traced end to end). Failures are fixture
feasibility (design) and one undecided semantic (design).

**Stage 4 — re-zoom.** Not applicable (no edits during this pass).

**Stage 5 — readiness.** Fails: two seams are unspecified in ways an implementer must resolve with a
correctness consequence.

### Verified sound (not re-opened)

- **Closure mechanism.** `gatherExercisedIds` (`scripts/validate.ts:1455-1474`) counts `test("<name>")`
  IDs for `holonovel/scripts/**` and `labelsFromContent` for all root `scripts/**` (`:1443`); the
  linkage check consumes that set (`:2643-2647`). So T541/T542 via test names and T493/T682 via
  literals in declared `check*` functions (`scripts/lib/req-checks.ts:854-870`) all register.
  **`N = 80` is reachable.**
- **Gate interactions.** B2 bundled evidence (`validate.ts:1610`) is satisfied — `T541/REQ-451`
  carries T541, so REQ-451a is `direct`. B3 (`:1622-1636`) is new-REQ-only. B4 (`:1746-1752`) is
  safe: none of the five rows names a `TTRPG_*` var (`appendices-reference.md:1524`, `:1974`,
  `:1975`, `:2177`). Baseline 0/0 stays 0 (`spec/audit/conformance-baseline.json:2-3`).
- **Done-bar string.** `REQ evidence linkage: 80` matches `validate.ts:2661`; corpus row shape matches
  `:2655`.
- **Task 3's citations.** `appendices-reference.md:1524` and `:2177` are the two-clause rows claimed.
- **Task 10 (T542).** `--decisions` is real (`check-conversion-evidence.ts:40`), strict failure is real
  (`:102`, `:114`); both halves assertable with no script change.
- **Repair 2 (spawn harness).** `test-spec-tooling.ts:36` `run()` throws on non-zero, but `:39-45`
  `runCode()` catches and returns `{code,out}` — a failing child is assertable.
- **Repair 5 (register token rule).** `scripts/lib/register-checks.ts:64-67` checks REQ tokens only for
  `Scheduled-roadmap`; `plan.md:126-130` and `tasks.md:40` order ROADMAP before the register. Holds.

## Findings

### [clarity] Blocker B1 — the `version-check.ts` `--root` seam is specified two incompatible ways, and the specified test cannot pass

`plan.md:83`, `:109` say `--root` is added by "moving the root-derived constants below argument
parsing". `scripts/version-check.ts:14` is **one** root constant feeding **every** read: `:16` root
`package.json`, `:53` `holonovel/package.json`, `:57` `holonovel/AGENTS.md`, `:63`
`holonovel/DECISIONS.md`, `:69` `holonovel/src/index.ts`, `:74` `holonovel/package-lock.json`, `:82`
`holonovel/src/core/state.ts`, `:93` `/server.json`, `:110`
`holonovel/schemas/mcp-server.schema.json`, `:127` `CHANGELOG.md`. Nothing else is root-relative.

If `--root` rebinds `root`, then `plan.md:113` and V4 (`plan.md:143`) — a scratch root holding **only**
`package.json` + `CHANGELOG.md` — throws `ENOENT` at `:53` for *both* cases. Both exit 1, so "current →
exit 0" cannot pass and "stale → 1" passes for the wrong reason (a crash, not the currency branch at
`:132-135`). Reaching the stale branch under a full rebind needs a 10-file fixture including a
`server.json` that validates against the vendored registry schema (`:110-123`).

If `--root` scopes only `rootVersion` + `changelog` (the cheap correct design), the two-file fixture
works — but `plan.md:109`'s "moving the root-derived constants" is then wrong.

**Required:** state which reads `--root` rebinds; if it rebinds `root`, name the full fixture; and make
the stale assertion match the currency message (`version-check.ts:133`) so the red is discriminating
rather than an `ENOENT` exit 1.

### [design] Blocker B2 — the T541 fixture cannot satisfy Appendix F, and its pass half is vacuous

`tasks.md:36-37` specify "a temp manifest copy via `--root`, plus tampered-hash and deleted-URL cases
under `--strict`", claiming the exit-0 half becomes discriminating after task 9.

1. **Non-strict always exits 0.** `check-vendor-manifest.ts:151-157` exits 1 only under `--strict`.
   So the exit-0 half discriminates only if it runs `--strict`, which the plan does not require.
2. **A manifest-only fixture fails the clean strict case.** Rows resolve against `NARRATIVE_DIR`
   (`:30`, `:132-137`); a temp root with only `narrative_world_model/MANIFEST.md` leaves every
   hash-bearing row `MISSING`, so a clean `--strict` run exits 1 and the tampered case "fails" because
   files are missing — the confusion `plan.md:119-120` guards against. Appendix F T541
   (`appendices-reference.md:1974`) requires asserting every hash-bearing row matches its recomputed
   SHA-256, i.e. a clean strict pass.

**Required:** name the fixture shape (temp root mirroring `MANIFEST.md` **and** `narrative/`, e.g. via
the `cpSync` already imported at `test-ruleset-gates.ts:15`; or derive `NARRATIVE_DIR` from
`dirname(MANIFEST_PATH)`), and make the clean case `--strict`.

### [design] Major M1 — `argValue` does not exist where the plan says, so the edit produces the duplicate the plan forbids

`plan.md:86` says both gates parse "through `scripts/lib/args.ts` (reuse its `argValue` …)".
`scripts/lib/args.ts:11` exports **`parseValueFlag`**; there is no `argValue` export. The only
`argValue` definitions are private copies at `scripts/update-server.ts:43` and
`holonovel/scripts/check-conversion-evidence.ts:24`. Following the plan literally writes a third
private copy — `check-script-quality` C2's duplicate-helper class.

**Yes**, `args.ts` already supplies what is needed — `parseValueFlag` (`:11`), `handleHelp` (`:20`),
`rejectUnknown` (`:29`); no new helper, no change to `scripts/lib/args.ts`, so the blast radius is
complete once the symbol is corrected. With `parseValueFlag`, C2 accepts the arrangement.

### [design] Major M2 — T682's "visibility-only baseline fails" has no named seam and no decided semantics

The prior artifact is read once at module scope from a fixed path — `surface-replay.ts:150` reads
`OUT` (`:28`) — and the comparison is inline at `:286-292`, with the `?? prior?.visibility_rate`
fallback at `:288`. `checkExpectedActionPrecision(): string[]` (`plan.md:84`) takes no prior argument,
so the new clause has no injectable input. It is achievable **only** if the comparison is extracted
into a pure helper the new function can call with a synthetic visibility-only prior; the plan does not
name that extraction.

Compounding it, `plan.md:110-111` says "decide and record the `:288` fallback" — so the expected
meaning of "fails" is undecided at review time, and `tasks.md:34`'s check ("exits 0; `grep` finds the
declared form") passes even if the clause asserts nothing. Fix: name the pure helper, and require a
specific defect string for a visibility-only prior so the assertion is non-vacuous.

*(The committed prior does carry `recall_at_budget` — `spec/audit/tool-surface-replay.json:17,729,1441`
— so a correctly written clause will not turn the real gate red.)*

### [design] Major M3 — the fallback bar's trigger contradicts its own bar

`plan.md:75-77`: "**Fallback bar** (if P1 stalls): all 85 rows triaged in `dispositions.md`, corpus and
`ROADMAP.md` untouched, increment renamed `4a`." If P1 stalls, the 85-row triage is exactly what is
incomplete, so the escape hatch has no reachable state. Separately, "renamed `4a`" does not name the
directory (`plan.md:4` fixes it), and renaming after stamping invalidates the artifact path the gate
and sidecar record.

**Required:** trigger = "if the session cannot begin P2"; either state the rename target or drop the
rename in favour of "recorded as chunk 4a".

### Nits

1. `NARRATIVE_DIR` missing from the move list (`check-vendor-manifest.ts:30`, used at `:132`): moving
   `ROOT` while leaving `:30` references `ROOT` before initialisation (TDZ `ReferenceError`). Name all
   three constants as one moved block.
2. Task 7's dependency contradicts its check: `tasks.md:35` depends on 5 while its check requires the
   stale case to fail **before** task 5. Dependency should be 3.
3. V7's `awk` is never written (`plan.md:146`, `tasks.md:30`); the counts are derivable from the fixed
   template but the verification is not reproducible as written. Put the one-liner in `tasks.md`.
4. V6's attribution is ambiguous against task 13 (`plan.md:145`): a reader can attach `+2` to either
   suite. `tasks.md:41` is the correct reading (`test-ruleset-gates.ts:397` prints `N passed`;
   `test:all` does not run it). Say so in V6.
5. A proposed state is written as present fact: `plan.md:86` "Both gates parse through
   `scripts/lib/args.ts`" is false today (`check-vendor-manifest.ts:33` uses `process.argv.includes`;
   `surface-replay.ts:37-43` has its own `KNOWN` loop; `version-check.ts` has no parsing). Read as an
   assumption.
6. `--root` error modes unspecified: `args.ts:11-17` returns `null` for a missing value, so `--root`
   with no argument silently falls back to the repo root, and `--root <nonexistent>` dies on `ENOENT`
   instead of a diagnostic — indistinguishable from a stale finding. Task 5/9 cover only `--bogus`.

### Deferred

None — every line reviewed was in scope; no finding is lodged against unchanged text.

### Unknowns

1. EV1's quoted counts (`plan.md:11`) were not re-derived (re-running `validate` is out of budget).
2. EV2's 85 rows / 75 IDs and the 33/52 split (`plan.md:13-16`) — `corpus.md` exists but was not
   enumerated.
3. `run-test-suite.ts:26-82` excluding `test:ruleset-gates` (`plan.md:29`) — file not read; the
   package wiring (`holonovel/package.json:79`) and the `N passed` line were verified.
4. D5's pre-edit counts (`plan.md:63-64`) — `/tmp/c.md` does not exist at review time, so V2's
   pre-edit values cannot be re-derived without running task 1.
5. `walkTsFilesRaw` recursion — inferred; if non-recursive, the closure mechanism for `scripts/lib/*`
   would change, though both restructured scripts sit at `scripts/` top level either way.

## Process note (not a finding against the artifact)

This is a sixth full cold pass, dispatched as one context rather than the five fresh per-stage contexts
`independent-review` prescribes. Both standards say a plan gets one cold pass and thereafter re-audits
the failed stage only (`independent-review/SKILL.md:58-60`; `plan-review/SKILL.md:296-300`). The
artifact shows nothing wrong with that; the orchestrator should record the deviation alongside the
stamp.

independent-review FAILED. plan.md — 2 blockers

1. [clarity] `version-check.ts --root`: two incompatible seams; the two-file fixture cannot reach
   "current → exit 0", and the stale exit-1 is a crash, not the currency branch — `plan.md:83`, `:109`,
   `:113`, `:143` vs `scripts/version-check.ts:14`, `:53`, `:127-135`
2. [design] T541 fixture: non-strict always exits 0 (`check-vendor-manifest.ts:151-157`) and a
   manifest-only temp root fails the clean `--strict` case (`NARRATIVE_DIR` `:30`, `:132-137`), so
   Appendix F T541 (`appendices-reference.md:1974`) is not asserted — `tasks.md:36-37`

Majors: 3 · Nits: 6 · reads 33/40

## Resolution (author amendment, revision 7)

- **B1** — `--root` on `version-check.ts` rebinds **only** `:16`/`:127` (`package.json`,
  `CHANGELOG.md`); the ten other root-relative reads stay at the repo root, so a two-file fixture
  reaches the currency branch. The stale assertion must carry the `:133` currency message, not an
  `ENOENT`; task 5's check asserts exactly that.
- **B2** — the T541 fixture is a temp root mirroring `narrative_world_model/` (`MANIFEST.md` **and**
  `narrative/` via `cpSync`); the clean case runs `--strict` because non-strict always exits 0.
- **M1** — the plan now names `parseValueFlag` (`args.ts:11`), states that `scripts/lib/args.ts` needs
  no change, and the blast-radius row says so.
- **M2** — the `:286-292` comparison is extracted into a pure helper taking a prior;
  `checkExpectedActionPrecision` asserts a **named defect string** for a visibility-only prior, so the
  clause cannot be vacuous.
- **M3** — the fallback trigger is "if the session cannot begin P2"; no directory rename, the AAR
  records "chunk 4a", so the stamped path stays valid.
- **Nits 1–6** — `NARRATIVE_DIR` joins the moved block; task 7 depends on 3; task 2 carries the `awk`
  one-liner; V6 attributes `+2` to `test:ruleset-gates`; the parse statement is future tense; `--root`
  with no value joins the error-mode assertions.
