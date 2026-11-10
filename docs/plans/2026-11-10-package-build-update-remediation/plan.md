# Plan — §5.17/§5.18 package build and update remediation (F-P6b-7, F-P6b-15)

Status: revised after cold review (5 blockers resolved) · Kind: planned · Depth: standard
Stamp: plan-review passed, independence fresh, standard depth (2026-11-10)

## 1. Objective

Close the first open `ROADMAP.md` section, **§5.17/§5.18 package build and
update remediation (P1)**, by making the ruleset package build path real:

- `build-ruleset` invokes a committed emitter for any slug whose emitter
  resolves, and records intake for the rest (REQ-395a).
- `update --apply` stages an emitter rebuild, runs the package gates, and only
  then swaps and re-stamps (REQ-395c, REQ-563, REQ-564).
- Supplement intake (`slug+=path`) overlays through the same emitter with
  recorded base/supplement/result hashes, and `update-rulesets` reports base
  drift against the current base emission (REQ-421, REQ-422, REQ-557).

**Scope statement (one register).** The roadmap trigger is finding-based, so
the section closes when F-P6b-7 and F-P6b-15 are `Resolved`. REQ-395a's
arbitrary-new-package half — `build-ruleset example=<path>` producing a package
from raw Markdown — is **not** claimed: extraction is not deterministic, so a
new slug records intake and prints the Build invocation. That residual is
recorded in DECISIONS.md as a deferred decision, not hidden in an AAR.

**Done bar:** F-P6b-7 and F-P6b-15 are `Resolved` in
`spec/audit/review-register.md` with a `file:line` exercising assertion; the
roadmap section is removed; a fresh clone emits the covered package with all
six files byte-identical to the committed fixture; `update --apply` stages,
gates, and refuses a gate-defective emission without touching the installed
package; `npm run assemble`, `npm run check:fast`, and `npm run build-order`
pass; the AAR ends `LOOP PAUSED`.

## 2. Verified baseline

- `HEAD` at session start: 39 unpushed commits, 18 open roadmap items,
  version `2026.11.10`, last publish `2026-11-09T04:30Z`.
- `npm run check:fast` → exit 0, `check:fast: PASS`, 37/37 gates.
- F-P6b-7 predicate (confirmed by reading, not by a gate message):
  - `scripts/build-ruleset.ts:145-149` records `scripts/ruleset-builds/<slug>/build-package.mjs`
    only when the file already exists, and `:156-157` prints the Build
    invocation instead of running anything.
  - `.gitignore:22` ignores `scripts/ruleset-builds/`, so the recorded path
    cannot exist in a fresh clone.
  - `scripts/check-reference-server-cleanliness.ts:33-37` fails on any tracked
    file under `scripts/ruleset-builds/`.
  - `scripts/update.ts:120-123` advances `package_format`/`built_at` on emitter
    exit 0 without running a package gate.
- F-P6b-15 predicate:
  - `scripts/build-ruleset.ts:48-57` accepts only `slug=path`; `slug+=path`
    parses as slug `slug+`, which fails `SLUG_RE` (`:27`), so a supplement
    target cannot be expressed.
  - `scripts/lib/ruleset-registry.ts:29` declares `base_content_hash`; no
    writer exists (`grep` over `scripts/` → declaration only).
  - `scripts/update-rulesets.ts` never compares a base hash.
  - `scripts/update.ts:85-89` compares the recorded base hash against the
    installed package's `content_hash`, which after an overlay is the *result*
    hash — the check is permanently true for any supplement slug.
- Existing groundwork: `scripts/lib/ruleset-build-kit.mjs:195-271`
  (`emitFromBaseline`, `runPackageGates`, staging + gate-before-install) and
  `scripts/lib/ruleset-registry.ts:117-166` (`resolveEmitter`, trusted-root
  containment).
- Harness IDs: **T499** exists at `holonovel/scripts/test-fingerprints.ts:258`
  and **T689** exists at `holonovel/scripts/test-update-workflow.ts:218,227,238`
  and `holonovel/scripts/test-ruleset-gates.ts:305`; both are extended, not
  duplicated. T463, T650, T656, and T657 have no harness title
  (`grep -rn` under `holonovel/scripts` → 0 hits).
- `holonovel/testdata/rulesets/fixture/` holds six files (five parts plus
  `manifest.json`), `content_hash` `5b019488…`, `built_at`
  `2026-08-21T00:00:00Z`, `host_version` `2026.08.18`, no `package_format`.

## 3. Governance resolution (decided 2026-11-10)

REQ-563 demands a committed emitter and committed durable source for a
repo-authored reference package. `holonovel/DECISIONS.md:759-761` and
`check-reference-server-cleanliness` forbid committed per-book assets. The two
cannot both hold for a commercial package.

**Resolution: sanction the existing, non-commercial fixture.**
`holonovel/testdata/rulesets/fixture/` is repo-authored, already sanctioned by
the cleanliness gate (`:25`), and already carries all five package parts. It
becomes the one *covered* package: committed emitter plus committed durable
baseline. No commercial asset returns to the tree; the decision is recorded in
`holonovel/DECISIONS.md` and the gate's allowlist becomes explicit.

**Determinism.** The committed manifest is byte-identical because every field
is deterministic at a commit: `built_at` from a pinned recipe constant,
`host_version` from `package.json`, and `package_format` from the generated
constants. When the version or package format advances, the covered package is
re-emitted in the same increment (the `check-starter-freshness` pattern), so the
six-file comparison stays exact rather than excluding manifest metadata.

## 4. Workstreams

### W0 — Preflight probes (before any edit)

- `grep -rn "testdata/rulesets/fixture" scripts/ holonovel/scripts/` — confirm
  no existing gate already compares the committed package; if one does, extend
  it instead of adding `check-fixture-emitter`.
- Install the fixture into a temp `TTRPG_DATA_DIR` and boot the host once:
  confirm it loads with an empty `tools.json`. If it does not, T656's
  "defective package refused" half uses a **synthetic defective copy**
  (planned, not a fallback) generated in the harness temp dir.
- `git check-ignore scripts/ruleset-builds/fixture/build-package.mjs` — confirm
  the ignore-rule change is required, then verify the negated form with
  `git check-ignore --no-index` after editing.

### W1 — Covered package: emitter, durable baseline, sanction

| File | Change |
|---|---|
| `scripts/ruleset-builds/fixture/build-package.mjs` | New `[build tool]` emitter. Defaults `--baseline` to `holonovel/testdata/rulesets/fixture`, pins `built_at` to a recipe constant, supports `--out`, `--dry-run`, `--json`, `--no-backup`, `--check`, `--help`; shebang + role header + exit codes 0/1/2 per script discipline. |
| `scripts/lib/ruleset-build-kit.mjs` | `emitFromBaseline` gains an optional `defaultBaselineDir` (used when neither `--baseline` nor `scriptDir/baseline.json` exists) and `--json` output carrying `content_hash` so callers can compare without parsing prose. |
| `.gitignore` | `scripts/ruleset-builds/*` + `!scripts/ruleset-builds/fixture/` (children ignored, the fixture directory re-included; the current trailing-slash form cannot be re-included). |
| `scripts/check-reference-server-cleanliness.ts` | `SANCTIONED_BUILD_PREFIXES = ["scripts/ruleset-builds/fixture/"]` beside the package-triple allowlist; any other tracked slug still fails. |
| `scripts/check-fixture-emitter.ts` | New `[gate]`: runs the emitter `--check`, compares all six files byte-for-byte, exits 0/1. |
| `scripts/lib/gate-manifest.ts` | Register `check-fixture-emitter` (the single gate source of truth; `run-gates.ts` only consumes it). |
| `AGENTS.md` | Regenerate the gate table (`npm run gates -- --list --format=md`). |
| `package.json` | `build:covered-package` (runs the fixture emitter) and `check-fixture-emitter` (runs the gate wrapper) so the freshness remedy is a named command. |
| `holonovel/testdata/rulesets/fixture/manifest.json` | Re-emitted: `package_format` added, `host_version`/`built_at` advanced. |
| `holonovel/DECISIONS.md` | Resolution + the deferred REQ-395a new-package decision. |

**Dry-run first:** run `--check` against the current tree and resolve every
difference before wiring the gate into `gate-manifest.ts`.

**Freshness on release.** `scripts/version-bump.ts` re-emits the covered
package after the CalVer/host-version advance (and `build-order` does the same
after version sync), so the committed manifest never lags the host.

### W2 — `build-ruleset` invokes the emitter

| File | Change |
|---|---|
| `scripts/lib/ruleset-registry.ts` | Repo-emitter default args become `["--out", "{dir}"]`: the emitter supplies its own committed baseline, so a fresh clone never reads the install dir as a baseline (REQ-563's "without an installed package"). Drop the injected `--baseline {dir}` for repo emitters. |
| `scripts/build-ruleset.ts` | After intake validation and registry recording, resolve each slug with `resolveEmitter`, run `runRebuildWithGates` (W3), and propagate its exit code. Keep the printed `opencode run` line only for slugs with no emitter. Report per slug: `emitted` / `recorded, no emitter` / `failed`. |
| `scripts/build-ruleset.ts` | Record `emitter_args` as `["--out", "{dir}"]` for a repo emitter, so the registry never re-introduces the install-dir baseline. |

### W3 — One staged rebuild path for `update` and `build-ruleset`

| File | Change |
|---|---|
| `scripts/lib/ruleset-build-kit.mjs` | Extend `runPackageGates` to run the REQ-560 replay after REQ-430/REQ-559 (REQ-563 names all three). Add `runRebuildWithGates({ emitter, args, installDir, slug, root })`: substitute `--out <install>/<slug>.staging-<pid>`, run the three gates on staging, back up the installed package, then swap. A gate failure removes staging and leaves the installed package and registry untouched. An emitter that cannot stage (no `--out` acceptance) is reported `deferred: emitter cannot stage` rather than installed un-gated. |
| `holonovel/scripts/test-ruleset-nonovel.ts` | Accept `--package <dir>`; default stays synthetic `fixture558`. Without it the replay cannot gate an emitted package. |
| `scripts/update.ts` | Route every rebuild through `runRebuildWithGates`; advance `package_format`/`built_at` only after the swap succeeds. |
| `scripts/update.ts` | Base-drift check: compare the recorded `base_content_hash` against the **current base emission hash** (emitter `--dry-run --json`), not the snapshot and not the overlaid manifest. Report three distinct states: `current`, `base changed` (hashes differ), and `base source unavailable` / `base emitter cannot report a hash` (no emitter, or no `--dry-run --json`). |

### W4 — Supplement intake, overlay, provenance

| File | Change |
|---|---|
| `scripts/build-ruleset.ts` | Parse `slug+=path` as a supplement target (role `supplement`); keep `slug=path` as a new package. Reject a supplement whose slug has no installed base package, naming it. |
| `scripts/lib/ruleset-registry.ts` | Writers for `sources` (ordered `{path, role}`), `base_content_hash`, and `supplements` (per-source hashes). Base snapshot helper: on first overlay, copy the base parts to `<state>/ruleset-bases/<slug>/`; the snapshot is the **rebuild input only**, never the drift comparison source. |
| `scripts/lib/ruleset-build-kit.mjs` | New pure helper `mergeSupplementParts(baseDir, supplementDirs) -> tempDir`: replace-by-key (index by `id`, model by top-level then entry key, tools by `name`, resources by `uri ?? name`, prompts by `name`), never append, so re-running is idempotent. |
| `scripts/build-ruleset.ts` | Overlay call path, stated once: merge base parts + supplement parts into `<state>/tmp/merge-<slug>-<pid>/`, then invoke the emitter with `--baseline <merged> --out <install>/<slug>` through `runRebuildWithGates`. Remove the merge directory after the swap, on gate refusal, and on any thrown error (`finally`), so a failed run leaves no staging residue. A Markdown-only supplement directory is **recorded** (`sources` + per-file hashes) and the printed Build invocation is emitted — extraction is not deterministic. |
| `scripts/build-ruleset.ts` | After a supplement build, append base hash, per-supplement hashes, and result `content_hash` to `<state>/build-provenance.md` (the state-dir-then-§6.7 pattern REQ-395c uses) and write the same facts to the registry. |

### W5 — `update-rulesets` becomes the compatibility reporter

| File | Change |
|---|---|
| `scripts/update-rulesets.ts` | Print a usage line and the install directory (REQ-422); report supplement slugs whose recorded `base_content_hash` differs from the current base emission hash (same resolution and three states as W3), naming the slug and both hashes; keep the staleness summary. |

### W6 — Assertions and register

| Test | Harness |
|---|---|
| T463 (usage, bad path, emitter invoked for a covered slug) | `holonovel/scripts/test-fingerprints.ts` |
| T499 (extend the existing title: registry maps slug → recipe, fingerprint, timestamp; re-run defaults to recipe) | `holonovel/scripts/test-fingerprints.ts:258` |
| T650 (supplement: two runs identical hash, no duplication; base change reported) | same |
| T657 (flagged package rebuilt through emitter; un-remediable deferred by name) | `holonovel/scripts/test-fingerprints.ts` |
| T689 (extend `test-update-workflow.ts:218,227,238`: dry-run plans, apply stages-gates-swaps, emitter-less slug deferred) | `holonovel/scripts/test-update-workflow.ts` |
| T656 (fresh emission reproduces all six files byte-identically; a synthetic defective package is refused naming the defect) | `holonovel/scripts/test-ruleset-gates.ts` (extend the existing emitter test at `:305`) |

Then refresh `spec/audit/req-coverage.md` (`npm run validate -- --write-register`)
and mark F-P6b-7 / F-P6b-15 `Resolved` with `file:line` evidence in
`spec/audit/review-register.md`.

### W7 — Spec, runbook, and register surfaces

- `spec/appendices-runbooks.md` V.1/V.7: record emitter invocation, supplement
  overlay, staged-gate refusal, and the `--check` remedy (REQ-395b).
- `spec/audit/review-register.md`: terminal dispositions.
- `ROADMAP.md`: remove the §5.17/§5.18 section (it ships).
- `CHANGELOG.md`: dated entry.
- No REQ body or Appendix F change: REQ-395a/395c/421/422/557/563/564/650
  already state these contracts, and T656's six-file assertion is now
  satisfiable.

## 4a. Blast radius, sizing, rollback cost

| Path | Change | Size |
|---|---|---|
| `scripts/ruleset-builds/fixture/build-package.mjs` | New emitter | M |
| `scripts/lib/ruleset-build-kit.mjs` | Default baseline, `--json`, replay gate, staged rebuild, overlay helper | L |
| `scripts/lib/ruleset-registry.ts` | Repo-emitter args, writers, base snapshot | M |
| `scripts/lib/gate-manifest.ts` | Register the new gate | S |
| `scripts/check-fixture-emitter.ts` | New gate wrapper | S |
| `scripts/check-reference-server-cleanliness.ts` | Exact-slug allowlist | S |
| `scripts/build-ruleset.ts` | Emitter invocation, `+=` parsing, overlay, provenance | L |
| `scripts/update.ts` | Staged rebuild, base-hash keying | M |
| `scripts/update-rulesets.ts` | Usage line, base-hash report | S |
| `scripts/version-bump.ts` | Re-emit covered package | S |
| `.gitignore` | Narrow the ignore rule | S |
| `holonovel/scripts/test-ruleset-nonovel.ts` | `--package` argument | S |
| `holonovel/scripts/test-fingerprints.ts` | T463/T499/T650/T657 | M |
| `holonovel/scripts/test-update-workflow.ts` | T689 extension | S |
| `holonovel/scripts/test-ruleset-gates.ts` | T656 | S |
| `package.json` | `build:covered-package`, `check-fixture-emitter` scripts | S |
| `holonovel/testdata/rulesets/fixture/manifest.json` | Re-emitted | S |
| `AGENTS.md` | Regenerated gate table | S |
| `holonovel/DECISIONS.md`, `spec/appendices-runbooks.md`, `spec/audit/review-register.md`, `spec/audit/req-coverage.md`, `ROADMAP.md`, `CHANGELOG.md` | Decision, runbook, dispositions, roadmap | S |

**Rollback cost: 1** on a 0–2 scale (0 = pure add, 1 = reversible edit,
2 = destructive). One new directory, reversible edits, no commercial content.

## 4b. Sibling-contract and surface check (run before editing)

- `grep -rn "REQ-395a\|REQ-395c\|REQ-421\|REQ-422\|REQ-557\|REQ-563\|REQ-564\|REQ-650" spec/02-requirements.md`
  and confirm no sibling REQ binds `build-ruleset`, `update`, or
  `update-rulesets` incompatibly (REQ-432a owns `--license`; REQ-579 owns the
  legacy-surface staleness predicate).
- `grep -rn "build-ruleset\|update-rulesets" docs/ spec/appendices-runbooks.md`
  so V.1/V.7 land in the same increment.
- No MCP action changes, so `check-intent-citations` and `action-conflicts` are
  unaffected; `npm run check:fast` confirms.

## 4c. Register coupling (same step, not a follow-up)

Marking F-P6b-7/F-P6b-15 `Resolved` and deleting the ROADMAP section is one
edit: the review-register row loses its `Scheduled under §5.17/§5.18 …`
sentence in the same commit that removes the section. `check-registers`
cross-references `Scheduled-roadmap` rows against `ROADMAP.md`; a split edit
leaves a dangling pointer.

## 5. Red tests (write before the fix)

1. **Base drift.** Unchanged base + unchanged supplement → no mismatch. Change
   the base's durable source and re-emit the base → `update-rulesets` reports
   the slug with the recorded and current hashes. Fails today: the recorded
   base hash is compared against the overlaid manifest (`update.ts:85-89`).
2. **Overlay idempotence.** Two overlay builds → identical `content_hash`, and
   the supplement entry count is unchanged. Fails today (no overlay exists).
3. **Staged refusal.** A synthetic package failing a hard gate → the emitter
   or `update` exits non-zero, the installed package is byte-identical to
   before, and the defect is named. Fails today because `update.ts` never runs
   a gate and never stages.

## 6. Verification

```sh
npm run assemble
npx tsx scripts/check-fixture-emitter.ts            # gate (dry-run first)
npm run check:fast                                  # includes check-registers, check-gate-table
npx tsx holonovel/scripts/test-fingerprints.ts      # T463/T499/T650/T657/T689
npx tsx holonovel/scripts/test-ruleset-gates.ts     # T656
npx tsx holonovel/scripts/test-ruleset-nonovel.ts --package <emitted-dir>
npm run build-order
```

Targeted manual checks, all in a temp `TTRPG_DATA_DIR` (never the repository's
`.holonovel-state`): `build-ruleset` with no args; `build-ruleset
fixture=holonovel/testdata/rulesets/fixture` from a clean clone with no install
dir; a Markdown supplement intake (records the recipe, prints the Build
invocation, writes no package); a five-part supplement overlay run twice; an
overlay after the base's durable source changes; `update --dry-run` then
`update --apply`; `update-rulesets` on a drifted supplement slug.

## 7. Commit split (≤5, one spec increment)

1. Fixture emitter + `--check` + gate wrapper/manifest + `.gitignore`/sanction +
   DECISIONS + `version-bump` re-emit.
2. `build-ruleset` emitter invocation + staged rebuild helper + `update` gates.
3. Supplement intake, merge helper, provenance writers, `update-rulesets`.
4. Assertions + coverage register + review register.
5. Runbooks/roadmap/changelog + AAR.

Spec edits and the coverage register land together (one spec increment);
`assemble` runs before each commit that touches `spec/`.

## 8. Risks and rollback

- **Fixture consumers.** `holonovel/scripts/test-fingerprints.ts:118-128`
  rebuilds its own manifest from the five parts, so re-emitting the fixture
  manifest should not affect it; verify before committing.
- **Release churn.** The covered manifest depends on `host_version` and
  `package_format`; `version-bump` re-emits it and the gate failure message
  names `npm run build:covered-package` as the remedy when a spec-section edit
  advances the package format.
- **Staging emitters.** An external recorded emitter that ignores `--out`
  cannot be staged; it is reported `deferred: emitter cannot stage`, never
  installed un-gated.
- **Cleanliness regression.** The sanction is an exact-slug allowlist; any
  other tracked `scripts/ruleset-builds/<slug>/` still fails.
- **Rollback.** One commit per workstream; reverting W1 restores the ignored
  directory, and no commercial content is involved either way.

## 9. Open items before execution

- Plan has passed a cold review; the stamp records the reviewer artifact hash.
- **Synthetic defective copy** is the planned T656 input (a temp copy with an
  ungrouped or undescribed tool), so the test does not depend on the committed
  fixture being mutable.
- **Replay scope.** The replay covers ruleset-free serving only (REQ-560); the
  fixture's empty tool list makes it vacuous-but-green, which the register
  evidence states rather than overstates.
- **Deferred REQ-395a half** is recorded in `holonovel/DECISIONS.md` in W1, so
  the roadmap closure and the spec's acceptance criterion are not in conflict.
