# Fingerprinted-section tool-token re-point

**Date:** 2026-11-11 · **Roadmap item:** *Fingerprinted-section tool-token
re-point (P2)* · **Register:** F-P6a-21 (`spec/audit/review-register.md:1781`)

## Questions

1. Can the three remaining bare `command` tool tokens (REQ-221b, REQ-330a,
   REQ-385a) be re-pointed to `run_command` in one increment? — Yes, all three
   are text-only; the blocker is the fingerprint bump, not the wording.
2. What does the fingerprint bump cost users? — A data-format mismatch stamps
   every persisted Novel `[data-stale]` for one re-serialize; a package-format
   mismatch holds installed ruleset packages inactive until rebuilt. Both are
   the design-sanctioned path (REQ-393, REQ-420, REQ-423, REQ-424).
3. Does the bump require new migration code? — No. The re-stamp and the
   re-emit are existing paths; the increment only re-emits the two bundled
   artifacts that bake the constants.
4. Does the empty allowlist break any current exemption? — Only the three
   listed bodies; the MCP client-config `command` key (REQ-163a) is exempted by
   a separate predicate, not by the allowlist.

## Evidence (repo)

| Claim | Evidence |
|---|---|
| REQ-221b carries three `command("…")` call forms in its acceptance criterion | `spec/02-requirements.md:1542` |
| REQ-330a carries one bare `command` token | `spec/02-requirements.md:1826` |
| REQ-385a carries one bare `command` token | `spec/02-requirements.md:3906` |
| The §4 notation rule licenses the abbreviation in appendices/§6 only, and records three deferred §5 occurrences | `spec/01a-constitution.md:141` |
| The detector matches a backticked `command` token or a `command(` call, with a config-key escape | `scripts/lib/req-checks.ts:539-556` |
| The production allowlist is exactly those three IDs | `scripts/tool-citation-check.ts:54-60` |
| §5.6 feeds the data-format fingerprint; §5.16 feeds the package-format one | `scripts/lib/contract-fingerprint.ts:38`, `:27` |
| Both constants are baked into the server | `holonovel/src/generated/contract-fingerprints.ts:3-4` |
| Only three tracked files bake a constant | `git grep -l <hash>` → `holonovel/content/torre-nosferatu.json`, `holonovel/testdata/rulesets/fixture/manifest.json`, the generated module |
| A package-format mismatch holds packages inactive; a data-format mismatch flags stale | `holonovel/src/rulesets.ts:161-163`, `holonovel/src/core/state.ts:204-215` |
| The deferral and its consequence are recorded | `spec/audit/review-register.md:1781-1791` |
| The roadmap item states both halves (re-point + empty allowlist) | `ROADMAP.md` §*Fingerprinted-section tool-token re-point* |

Counts were produced by `grep -rn 'command(` and a backticked `command` search
over `spec/*.md` (23 hits outside the fixture appendices: the §4 rule row, one
client-config REQ, the three targets, and the §6 build steps/§3 notes the
notation licenses) and by `git grep -l <both hashes>` (3 files).

## Scope

**In:** the three normative bodies; the §4 deferral sentence; the production
allowlist; both contract fingerprints; the two bundled artifacts that bake
them; the roadmap entry; the review-register row; one CHANGELOG entry; the
CalVer references `build-order` re-verifies (a no-op at this version).

**Out:** every other `command(...)` site (appendices, Appendix F, §6 build
steps — licensed notation); REQ-163a's client-config `command` key (different
namespace, separate predicate); the REQ-385a title phrasing ("command
suggest"), which is a title, not a tool citation, and is detector-clean;
refactoring the detector's `allow` parameter away (tests exercise it).

## Edits

**1. REQ-221b acceptance criterion** (`spec/02-requirements.md:1542`) — spell
the full registered form at all three call sites:

> `run_command (action: execute, "go north")` returns `[STATE_CONFLICT]`;
> `run_command (action: execute, "look")` and `run_command (action: execute,
> "examine sword")` return `[OK]`; after `manage_combat (action: end)`,
> navigation resumes.

Body after edit: **723 chars, 6 sentences** (limits: 800 / 8; before: 657/6).

**2. REQ-330a** (`:1826`) — `or `command` per REQ-196` becomes
`or `run_command (action: execute)` per REQ-196`. Body after edit: **488
chars, 3 sentences** (before: 466/3).

**3. REQ-385a** (`:3906`) — `return parser `command` suggestions (per
REQ-319)` becomes `return parser-command suggestions (per REQ-319)` (it names
the parser surface, not a tool call). Body after edit: **563 chars, 4
sentences** (before: 565/4).

**4. §4 fixture-notation row** (`spec/01a-constitution.md:141`) — delete the
final sentence ("Three occurrences remain … land with the increment that
regenerates that fingerprint"); keep the rule sentence before it. The row is
in §4, outside every fingerprinted section.

**5. Allowlist → empty** (`scripts/tool-citation-check.ts:54-58`) — keep the
constant and the `allow` parameter (tests drive it), set
`const TOKEN_ALLOW = new Set<string>();` and rewrite the comment: no body is
exempt, and a future deferral needs a review-register row plus an entry here.

**6. Derived artifacts** (regenerated, never hand-edited):
`holonovel/src/generated/contract-fingerprints.ts` (both constants),
`holonovel/content/torre-nosferatu.json` (`build:starter-novel`),
`holonovel/testdata/rulesets/fixture/manifest.json` (`build:covered-package`),
`holonovel/holonovel.md` (`spec-propagate`, run by build-order step 3), the
CalVer references `version-bump` owns.

## Blast radius

| File | Change | Size |
|---|---|---|
| `spec/02-requirements.md` | three REQ bodies re-pointed | S |
| `spec/01a-constitution.md` | §4 deferral sentence removed | S |
| `spec/build-phase-map.md` | content-hash comment line rewritten by `npm run assemble` (REQ-278) — amendment A1, discovered at T6 | S |
| `scripts/tool-citation-check.ts` | allowlist emptied, comment rewritten | S |
| `scripts/ruleset-builds/fixture/build-package.mjs` | drift message names the baseline re-emit (amendment A4) | S |
| `scripts/lib/req-checks.ts` | unchanged (detector already correct) | — |
| `holonovel.md` | assembled (generated) | S |
| `holonovel/holonovel.md` | propagated server copy (generated) | S |
| `holonovel/src/generated/contract-fingerprints.ts` | both constants (generated) | S |
| `holonovel/testdata/rulesets/fixture/manifest.json` | package_format (emitted) | S |
| `holonovel/content/torre-nosferatu.json` | data_format (emitted) | S |
| `ROADMAP.md` | item removed | S |
| `spec/audit/review-register.md` | F-P6a-21 → Resolved | S |
| `CHANGELOG.md` | one dated entry | S |
| `holonovel/AGENTS.md`, `holonovel/DECISIONS.md`, `holonovel/src/index.ts`, `holonovel/package.json`, `package.json`, `server.json`, lockfile | CalVer references — **no-op**: root version and top heading are already `2026.11.11` (`package.json:3`, `CHANGELOG.md:3`), and `version-bump` takes `max(changelog date, current)` (`scripts/version-bump.ts:23-35`) | — |
| `docs/plans/2026-11-11-fingerprinted-token-repoint/aar.md` | written before the first full-gate run (see step 6) | S |

Overall rollback cost: **1 pre-publish** (revert one commit; no runtime
migration is written, so the fingerprint reverts with the spec). After
publication a revert re-flips both constants, which re-stamps the Novels this
release already re-stamped and re-incompatibilises packages rebuilt against the
new value — that is the normal cost of any fingerprint-moving release, not
something this increment adds. Commit count: **1** (a spec increment is
atomic).

## Steps

1. **Red test.** Empty the allowlist (edit 5) *before* touching any REQ.
   Run `npm run tool-citation-check` → must FAIL with exactly three
   `token_drift` entries naming REQ-221b, REQ-330a, REQ-385a. Record the
   output in the AAR; a different set means the predicate moved and the plan
   is re-scoped.
2. Apply edits 1–3 and 4.
3. `npm run assemble`; inspect `git diff holonovel.md` — exactly the four
   intended hunks (three bodies + the §4 row); no other line moved.
4. `npm run tool-citation-check` → PASS; `npx tsx scripts/tool-citation-check.ts
   --json | jq .token_drift` → `[]`.
5. Write the CHANGELOG entry (dated `2026-11-11`) **before** the build order,
   because `version-bump` derives the CalVer from the top dated heading
   (`scripts/version-bump.ts:20-34`).
6. Write `docs/plans/2026-11-11-fingerprinted-token-repoint/aar.md` with a
   provisional `LOOP OPEN` terminal token and the red-test evidence.
   `check-loop-artifacts` treats a missing `aar.md` as an **error** in both
   gate modes (`scripts/lib/loop-artifacts.ts:65-71`,
   `scripts/check-loop-artifacts.ts:55`) and validates every increment under
   `docs/plans/`, so the first full-gate run would otherwise fail on this
   increment itself. The token is rewritten to `LOOP PAUSED` (or left OPEN with
   a named owner) at step 10.
7. `npm run build-order` — expected to **FAIL at step 2** (`npm run check`).
   Step 1b has already regenerated both constants, but the two committed
   artifacts that bake them are refreshed only by their own emitters, which
   build-order never calls (`scripts/build-order.ts:179-262`;
   `holonovel/scripts/lib/starter-novel.ts:54-61`;
   `scripts/lib/ruleset-build-kit.mjs:129-132`). The reporter is
   `test:ruleset-gates` — its T656 assertion (REQ-563) runs the fixture emitter
   and sees the stale `manifest.json` before the standalone freshness gates
   (amendment A2); the full runner stops at the first failure
   (`scripts/run-gates.ts:201-211`). Confirm the standalone gates fail directly
   (`npm run check-fixture-emitter`, `npm run check-starter-freshness`) and that
   `git diff holonovel/src/generated/contract-fingerprints.ts` shows *both*
   constants changed. Any failure of a different class stops the increment. The
   run halts before the version/pointer steps and writes no success marker
   (`scripts/build-order.ts:265-289`).
8. Re-emit: `node scripts/ruleset-builds/fixture/build-package.mjs --out
   holonovel/testdata/rulesets/fixture --no-backup` (amendment A3 —
   `npm run build:covered-package` targets the install directory) and
   `npm --prefix holonovel run build:starter-novel`. Then
   `npm run check-fixture-emitter`, `npm run check-starter-freshness`,
   `npm run check-fingerprint-sync` → all PASS.
9. Re-run `npm run build-order` → green (propagates `holonovel/holonovel.md`,
   runs full `npm run check`, refreshes markers; version-bump is a no-op at
   this CalVer).
10. Registers and AAR, same step: delete the roadmap section (it ships, so it
    moves to the CHANGELOG), move F-P6a-21 to `## Resolved` with the new
    `file:line` predicates, and finalise the AAR token. Then
    `npm run check-roadmap`, `npm run check-registers:strict` (the plain
    `check-registers` is report-only and exits 0 on findings,
    `scripts/check-registers.ts:54`) and `npm run check-loop-artifacts`.
11. `npm run assemble && npm run check:fast`, capturing the un-piped exit code
    and the trailing `check:fast: PASS` line. This is the last gate on the
    final tree locally; the push pipeline re-runs the full `npm run check`
    before publication.
12. Commit with `npm run session:close` (single increment commit; it also
    validates the AAR contract).

Pre-push only (not this session unless asked): `npm run test:package-smoke`
(packed artifact carries the new constants), then `./scripts/push-pipeline.sh`
— which scaffolds the `### Holonovel Spec Update` entry and syncs the DECISIONS
spec hash.

## Amendments

- **A1 (T6):** `spec/build-phase-map.md` also changes — `npm run assemble`
  rewrites its `<!-- content hash: … -->` comment line (REQ-278). Deterministic,
  assemble-owned, and not hand-edited; added to the blast radius above. No
  step changes.
- **A2 (T10):** the first `npm run build-order` fails at step 2 on
  `test:ruleset-gates`, not on `check-starter-freshness`: assertion T656
  (REQ-563) runs the committed fixture emitter inside the harness suite and
  reports the stale `manifest.json` before either standalone freshness gate is
  reached. Same cause, same remedy; both standalone gates were confirmed to
  fail directly (`check-starter-freshness` → stale; `check-fixture-emitter` →
  stale `manifest.json`). Step 7's expected-failure text is corrected
  accordingly; the step itself is unchanged.
- **A3 (T11):** `npm run build:covered-package` refreshes the **install**
  package (`.holonovel-state/rulesets/fixture`), not the committed baseline the
  gate compares against. The baseline re-emit is
  `node scripts/ruleset-builds/fixture/build-package.mjs --out
  holonovel/testdata/rulesets/fixture --no-backup` (the same invocation
  `version-bump.ts:145-158` uses). Step 8 carries the corrected command.
- **A4 (T13, AAR finding):** the drift message inside
  `scripts/ruleset-builds/fixture/build-package.mjs:88` printed the very
  command A3 shows to be wrong, so an operator following the gate's own hint
  would loop. Fixed in this increment: it now prints the baseline re-emit
  invocation. Added to the blast radius; verified by inducing drift on the
  committed manifest, observing the message, and restoring the file
  (`check-fixture-emitter` → PASS).

## Alternatives considered

- **Leave the allowlist and re-point opportunistically** the next time a §5.6
  or §5.16 semantic edit regenerates a fingerprint. Rejected: the item is
  already deferred once (F-P6a-20 → F-P6a-21), three normative bodies violate
  the spec's own §4 rule, and the roadmap's closing condition is an empty
  allowlist — leaving it non-empty keeps the detector permanently half-off.
- **Move §5.6/§5.16 out of the fingerprint sets** so text edits never move a
  constant. Rejected: it weakens the state/package format contract (REQ-420,
  REQ-423) to save one bump, and is far larger than this item.
- **Add a `--write` flag to `check-fingerprint-sync`** to avoid the two-pass
  build order. Rejected as scope creep; build-order already regenerates the
  constants, and the two-pass behaviour is a documented property of its step
  order.

## Risks and mitigations

- **Every installed ruleset package goes `[package-incompatible]` until
  rebuilt.** Design-sanctioned (REQ-393/REQ-420): held inactive, not dropped,
  and `holonovel update` rebuilds through the recorded emitter. Mitigation:
  the CHANGELOG entry names the fingerprint move so the release note reads as
  an update, not a regression.
- **Every persisted Novel is stamped `[data-stale]` and re-serialized once.**
  Design-sanctioned (REQ-423/REQ-424); the re-stamp is the existing path and is
  backed up by `reStampArtifact`. No new code.
- **Expected failure at build-order step 7 could be mistaken for a real
  regression.** The reporter is `test:ruleset-gates`/T656 (amendment A2), not a
  standalone freshness gate; the step names it and requires both standalone
  gates to be confirmed directly. A failure of a different class stops the
  increment and is investigated before step 8.
- **A second same-date CHANGELOG heading.** Already normal in this repo (nine
  `## 2026-11-11` headings); `session:close` uses the top one.
- **Body-limit overrun from the longer REQ-221b wording** (723 chars vs the
  800 bar). Measured above; the validator is the authority at steps 4 and 11.

## User impact

- No API, tool, or behaviour change: the three edits are notation.
- An operator upgrading across this release sees one `[data-stale]` re-stamp
  of persisted Novels and `[package-incompatible]` on pre-built ruleset
  packages until `holonovel update` rebuilds them — the same as any release
  that touches §5.6 or §5.16.
- No restart choreography beyond what `holonovel update` already does.

## Done bar

**Done bar:** all of the following in one commit.

1. `npm run tool-citation-check` passes with `TOKEN_ALLOW` empty.
2. `npm run check-fingerprint-sync` passes; both constants changed from
   `da48dd8f…` / `487051c5…`.
3. `npm run check-fixture-emitter` and `npm run check-starter-freshness` pass.
4. `npm run build-order` completes green on the assembled content tree before
   the register/AAR edits (full `npm run check`, which includes
   `check-loop-artifacts`).
5. `ROADMAP.md` no longer carries the item; F-P6a-21 is `Resolved`;
   `check-roadmap`, `check-registers:strict`, and `check-loop-artifacts` pass.
6. `npm run check:fast` reports `check:fast: PASS` (un-piped exit 0) on the
   final tree.
7. The AAR records the red-test output and the single-reported-gate note, and
   ends `LOOP PAUSED` with zero new action items.

## Open questions

- None blocking. The allowlist *parameter* stays (tests exercise it); only the
  production set empties. If a future deferral is needed, it returns through a
  register row plus an entry in that set.
