# Plan — §5.7 determinism and citation repair (F-P7a-1…-3)

Status: revised after three cold passes · Kind: planned · Depth: standard
Increment: `docs/plans/2026-11-10-5-7-determinism-citation-repair/`

## 0. Revision note

Cold passes 3 and 4 raised findings that are now fixed in this text. Pass 4:
- **REQ-055 no longer cites T261** — it is a Manual row, so it could not
  satisfy done-bar item 3; its row already names REQ-055.
- **Env-badge application now states persistence and idempotence** — the
  change is saved in the same method and the `"none"` guard makes a later
  switch a no-op with a single audit entry.
- Bar 4's manual check names T9's Editor-startup carrier.

Pass 3:
- **T20 contradiction (blocker):** the T20 harness title that claims "path
  containment" is renamed to the contract it asserts, and the row, the REQ
  column, and the bar-4 check are aligned in one step;
- adds the ruleset `table` branch (`index.ts:2256`) to the caller-seed site
  set (10 sites, not 9);
- defines "active session seed" in REQ-050a itself instead of only in
  DECISIONS;
- adds T111 to REQ-055's check so its restart-without-seed clause is cited;
- fixes Appendix F REQ-column granularity and includes T9's row;
- pairs each finding's `Resolved` flip with its roadmap-bullet removal inside
  its own slice, so `check-registers` never sees a dangling Scheduled-roadmap
  finding;
- **implements REQ-055a's env-badge branch on resume** (verified absent: only
  `createNovel` applies `TTRPG_BADGE`) and gates the notice on the effective
  badge;
- widens verification to the seeded-tool harnesses (`test:fate`,
  `test:ironsworn`, `test:forged`, `test:competitive-gaps`).

Earlier rounds fixed: the warning's output contract, the always-set badge
condition, the T31/T108 provenance claim, T27's over-wide row, the stale
baseline (now a preflight), the missing manual bar checks, one-session
achievement, and the commit split.

## 1. Objective

Close the three §5.7 findings the 2026-11-09 full-review sweep proved: the
missing REQ-050a seed-conflict `[WARNING]`, and two citation defects
(REQ-052 → T20, REQ-055/055a/055b → T31/T108). This is the top scheduled
roadmap item (`ROADMAP.md:15-25`).

**Done bar** (no conditional clauses)

1. F-P7a-1, F-P7a-2, and F-P7a-3 are `Resolved` in
   `spec/audit/review-register.md`, each citing an exercising test title and a
   `file:line` predicate that resolves on the committed tree.
2. The roadmap section `§5.7 determinism and citation repair (P1)` is retired.
3. Every `_Check:_` **T-token** in REQ-050a, REQ-050c, REQ-052, REQ-055,
   REQ-055a, and REQ-055b resolves to a harness title in `holonovel/scripts`;
   gate tokens (G2) are out of scope.
4. Appendix F rows T9, T20, T27, T31, T108, T111, and T739 agree — description,
   REQ column, and citing token — with the harnesses that carry them.
5. `npm run validate -- --write-register` reports no new bucket-A/B rows;
   `check-registers`, `check-loop-artifacts`, and `check:fast` pass.
6. Touched harnesses pass: `test:backfill`, `test:persistence`, `test:limits`,
   `test:output-contracts`, `test:fate`, `test:ironsworn`, `test:forged`,
   `test:competitive-gaps`.
7. `npm run build-order` completes and the CalVer/AGENTS/DECISIONS/index/
   lockfile/server.json set advances with it.

## 2. Verified baseline

Re-verified this session unless marked.

- `npm run status`: 26 unpushed commits, oldest 35.0h, version 2026.11.09.
  `check:fast` **PASS** (37/37), un-piped.
- Line anchors are HEAD-relative and **advisory**; §4.0 re-derives them.
- No seed-conflict site: `rg "seed-conflict" holonovel/src` is empty;
  `core/rng.ts:41-47` seeds the session PRNG and logs `[info] PRNG seed:` only.
- Caller-seed sites at HEAD: `src/index.ts:6570` (oracle), `:7652-7660`
  (`resolve_fate` roll), `:7817` (`resolve_ironsworn`), `:7949`
  (`resolve_forged`), `:11518` (`manage_ruleset` action roll), `:2213`
  (ruleset-derived `roll`) **and `:2256` (ruleset-derived `table`)**, `:5859`
  (combat init), `:4071` (character create stat generation), `:5533` (world
  generate).
- Internally derived seeds that must NOT warn: `:11519`, `:10250`, `:10312`,
  `:4386`.
- Output helpers: `ok()` (`:2711-2713`) prefixes `[OK]`, status `OK`;
  `warn()` (`:2880-2883`) prefixes `[WARNING]`, status `WARNING`;
  `needInput()` (`:2885-2888`) prefixes `[NEED_INPUT]`. OK results already
  carry advisory `[WARNING]` body lines (`:4475-4494`, `:5469`, `:10363`).
- World generate's success path returns `needInput(...)` (`:5731`).
- `state.resumeNovel` (`state.ts:1321-1366`) preserves `novel.badge`;
  `normalizeBadge` (`:85-88`, applied at `:1544`) maps absent/unknown to
  `"none"`. `initialBadgeFromEnv` (`state.ts:660`) is applied **only** by
  `createNovel` (`:1158`), never on resume or switch — REQ-055a's
  "no badge became active" branch is unimplemented for existing Novels.
- `getBadge()` (`core/server.ts:18-20`) returns `activeNovel.badge`, so the
  effective badge after resume is the persisted value.
- `src/index.ts:10797`: resume returns `Novel resumed: <name> (<slug>)` only.
  `rg "badge active" holonovel/scripts` is empty.
- `badgeLabel` (`:3417`) renders `none` as `Editor`, leaves `player`/
  `game_master` lowercase; used in other prose and not reworded.
- `spec/02-requirements.md:2337` (REQ-052) cites T20; `:2428,2436,2444`
  (REQ-055/055a/055b) cite T31/T108. REQ-050a (`:2269-2271`) is 542 chars and
  does not define "active".
- T739's assertion (`test-artifact-registry.ts:147-151`) submits
  `../../etc/passwd` and asserts `[ERROR] [INVALID_INPUT]` + `outside the
  exchange inbox` — REQ-052's envelope.
- T20 tokens: `test-backfill.ts:534` (titled "T20/T052: path containment —
  world resources render map"; it creates a room and reads `world://map`) and
  `test-output-contracts.ts:1235` (adversarial text, REQ-054).
- T27's shared assertion (`test-backfill.ts:520-526`, title
  `T27/T111/T050`) asserts only that two oracle calls with one seed agree.
  T27's row (`appendices-reference.md:1447`) promises d6+d20 witnesses,
  stream-position preservation, and unset-seed two-restart reproducibility;
  none is asserted. T111's row (`:1572`) promises stream position and a seeded
  two-restart comparison, and omits the unset case.
- Appendix B.4 (`appendices-fixtures.md:279-296`): seed 42 → d6
  `2,1,4,2,3,1,3,1,6,6`, d20 `6,2,12,5,8,1,9,3,18,20`; seed 7 has both.
- T98 (`:1559`) covers switch + per-Novel badge; T261 (`:1715`) is Manual
  replay; restart persistence is T9 (`:1435`), whose row lists
  `REQ-031, REQ-032, REQ-055, REQ-066` although its harness title cites
  REQ-055a (`test-limits.ts:386`).
- `scripts/lib/register-checks.ts:64-69` fails a Scheduled-roadmap finding
  whose REQ left `ROADMAP.md`.
- Appendix F is outside the fingerprinted section set (precedent:
  `docs/plans/2026-11-09-p7b-remediation/plan.md:52-53`).

## 3. Decisions

- **"Active session seed"** means `process.env.TTRPG_SEED` is defined
  (empty string included; `rng.ts:41` preserves it). This is written into
  REQ-050a's body, not only DECISIONS: "when a session seed is active"
  becomes "while `TTRPG_SEED` is set". DECISIONS carries the rationale and the
  startup-log discrepancy (the log reports `source: default` for an empty
  value).
- **An explicit Editor badge is overridden by `TTRPG_BADGE` on resume.**
  REQ-055a's carve-out is "no badge became active during a prior session",
  and the persisted value cannot distinguish "never set" from "explicitly
  set to none" (`normalizeBadge` maps both to `"none"`). The plan treats both
  as "no badge became active" and records the interpretation in DECISIONS.
- **The warning is a body line, not a status.** The tool keeps `[OK]`/`OK`;
  one `[WARNING] [seed-conflict] …` line is appended. Matches the advisory
  precedent and keeps REQ-001's prefix intact.
- **A per-call seed of `""` is treated as absent**, the same as `undefined`
  and `null`; stated in the helper comment.

## 4. Work items

### 4.0 Preflight — base reconciliation (S, blocking)

- **Files:** none (read-only).
- **Design:** run `npm run status`, fetch `origin/main`, record the base.
  Re-derive the caller-seed sites with
  `rg -n "args\\.seed|SESSION_SEED" holonovel/src/index.ts holonovel/src/core/rng.ts`
  and reconcile every §2 line against it. The site *set* is the contract; the
  line numbers are not. `holonovel/AGENTS.md` calls `resolve_fate`,
  `resolve_ironsworn`, and `resolve_forged` tombstones and the table roll
  moved to `resolve_mechanic`; at this baseline those handlers are live
  (`index.ts:7629,7801,7933`), so the re-derivation decides.
- **Tests:** none.

### 4.1 F-P7a-1 — seed-conflict warning (M)

- **Files:** `holonovel/src/core/rng.ts`, `holonovel/src/index.ts`,
  `holonovel/scripts/test-backfill.ts`, `spec/02-requirements.md`
  (REQ-050a, REQ-050c), `spec/appendices-reference.md` (T27, T111 rows),
  `holonovel/DECISIONS.md`.
- **Design:**
  1. `core/rng.ts`: `seedConflictWarning(perCallSeed: unknown): string | null`.
     `null` unless the seed is a non-empty value and
     `process.env.TTRPG_SEED !== undefined`; otherwise
     `[WARNING] [seed-conflict] Per-call seed '<seed>' overrides session seed
     '<SESSION_SEED>'; the per-call seed wins for this draw.` Pure; no state,
     no audit entry.
  2. Append the line at all **10** caller-seed sites: oracle, combat init,
     character create (ability-scores branch), `resolve_fate`,
     `resolve_ironsworn`, `resolve_forged`, ruleset-derived `roll`,
     ruleset-derived `table`, `manage_ruleset` action roll, world generate.
     `ok()`/`warn()` status is unchanged; the `table` and ruleset paths return
     `raw()` bodies, which gain the line the same way.
  3. World generate appends it inside the `needInput` body.
  4. No line at the four internally seeded sites.
  5. REQ-050a: add `_Check:_ T27.` and replace "when a session seed is active"
     with "while `TTRPG_SEED` is set". REQ-050c: `_Check:_ G2, T111.`
  6. Appendix F: T27's row becomes the asserted contract (deterministic seeded
     draws; the exact `[WARNING] [seed-conflict]` line with the per-call seed
     winning) and its REQ column `REQ-050, REQ-050a`. T111's row gains the d6
     witnesses and unset-seed two-restart reproducibility, REQ column
     `REQ-050, REQ-050c`.
- **Tests:** extend the shared `T27/T111/T050` test in `test-backfill.ts`:
  - conflict line at all ten sites under `TTRPG_SEED`; no line without a
    caller seed or without `TTRPG_SEED`; world generate keeps `[NEED_INPUT]`
    first;
  - B.4 d6+d20 witnesses via `10d6`/`10d20` under seeds 42 and 7;
  - stream position: a session draw after an override matches the draw on a
    server that never overrode;
  - unset seed: two unseeded boots with the same call sequence agree.

- **Amendment (2026-11-10, execution):** `manage_character (action: create)`
  cannot be exercised in `test-backfill` — its server is ruleset-free and the
  handler refuses mechanical stats without character-creation rules. The
  character-create assertion, plus the ruleset table draw and world generate,
  moved to `test-competitive-gaps`, which can seed a ruleset package. The T27
  token stays with the backfill assertions; the moved cases carry `REQ-050a`
  titles to avoid duplicating an ID across harnesses.

### 4.2 F-P7a-3 — REQ-052 path-containment citation (S)

- **Files:** `spec/02-requirements.md:2337`, `spec/appendices-reference.md`
  (T20 `:1442`, T739 `:2080`), `holonovel/scripts/test-backfill.ts:534`.
- **Design:**
  1. REQ-052 `_Check:_ T20 → T739.`
  2. T20's row becomes "Adversarial free-text stored and echoed verbatim as
     inert data in all surfaces, with no behavior change", REQ column
     `REQ-054`. "Path traversal and malformed input rejected" leaves the row
     because no T20 harness asserts it and REQ-052 now cites T739.
  3. `test-backfill.ts:534` is retitled
     `T20/REQ-054: stored free text renders verbatim in world://map` — the
     contract its body asserts. The `T052` token and "path containment" go;
     the assertions stay.
  4. T739's row gains REQ-052.
- **Tests:** no new assertion; T739 exercises the envelope and the retitled
  T20 case still runs.

### 4.3 F-P7a-2 — REQ-055/055a/055b evidence (M)

- **Files:** `holonovel/src/index.ts`, `holonovel/src/core/state.ts`,
  `holonovel/scripts/test-persistence.ts`, `spec/02-requirements.md:2428,
  2436,2444`, `spec/appendices-reference.md` (T9 `:1435`, T108 `:1569`).
- **Design:**
  1. Implement REQ-055a's env branch: when a Novel's persisted badge is
     `"none"` (no badge became active) and `initialBadgeFromEnv()` is not
     `"none"`, set `novel.badge` to the env badge, audit
     `env_badge_applied`, and persist with `saveNovel` in the same method so
     the change survives a restart (the `renameNovel` pattern,
     `state.ts:1682-1683`). Apply it in `resumeNovel` (`state.ts:1321-1368`)
     **and** in `switchNovel`'s already-hydrated branch (`state.ts:1657-1665`,
     which returns without calling `resumeNovel`) — that branch is the normal
     running-session case T98 exercises. **Idempotence:** the guard is the
     persisted value, so once applied the badge is no longer `"none"` and a
     later switch is a no-op; the audit entry fires once per Novel, not per
     switch. The stale comment at `state.ts:652-653` ("a persisted badge
     always takes precedence") is amended to "a persisted non-`none` badge".
  2. `badgeDisplayLabel(badge: Badge)`: `player → Player`,
     `game_master → Game Master`, `observer → Observer`, `none → Editor`.
     `badgeLabel` is not reworded.
  3. Implement REQ-055b: resume appends `<Display> badge active.` when the
     effective badge (after step 1) is not `"none"`.
  4. T31 in `test-persistence.ts`: entity isolation across Novels; roster
     import copies (mutating the copy leaves the baseline); `end` discards
     while the roster survives; resume of the ended slug is `[STATE_CONFLICT]`.
  5. T108 in `test-persistence.ts`: GM active in Novel A, resume under
     `TTRPG_BADGE=player` → GM wins; Novel B created without a badge, resumed
     under `TTRPG_BADGE=player` → Player applied (step 1); switch B→A→B
     restores each badge; resume A with Player persisted → notice contains
     `Player badge active.`
  6. Appendix F: T108's description gains the notice clause and its REQ column
     becomes `REQ-055a, REQ-055b`; T9's REQ column gains `REQ-055a` **and its
     description gains the contract the harness asserts** — "`TTRPG_BADGE`
     seeds the initial badge on a new Novel; an unset env leaves the Editor
     badge" — so "Startup: Editor badge active" is scoped to the unset-env
     case; T31 unchanged.
  7. Citations: REQ-055 `_Check:_ T9, T31, T98, T111.`; REQ-055a
     `_Check:_ T9, T108.`; REQ-055b `_Check:_ T108.` T9 covers restart and
     env-on-new; T98 the switch contract; T111 the unseeded restart sequence.
     T261 is not cited: it is a Manual row, so it cannot satisfy done-bar item
     3, and its row already names REQ-055.
- **Why not re-point:** no harness exercises persisted-badge precedence,
  the env branch, or the notice; a re-point would be a second false citation.
- **Risk:** the resume string is load-bearing; no harness asserts its text
  (`rg "Novel resumed" holonovel/scripts` is empty), so the line is additive.

### 4.4 Close-out — register predicates, roadmap, changelog (S)

- **Files:** `spec/audit/review-register.md`, `ROADMAP.md`,
  `spec/audit/req-coverage.md`, `CHANGELOG.md`.
- **Design:**
  1. Findings flip to `Resolved` **inside the slice that closes them**, each
     with its roadmap bullet removed in that same step and its predicate
     rewritten from the post-change tree (F-P7a-1: helper + first site;
     F-P7a-2: T31/T108 + resume notice + env application; F-P7a-3: the T739
     case).
  2. Delete the roadmap section when its last bullet goes.
  3. Regenerate the coverage register; add one dated CHANGELOG entry.

## 5. Scaffolding and ritual

1. `plan.md`, `tasks.md`, and `aar.md` exist before the commit; `aar.md` opens
   `LOOP OPEN` and ends with its terminal token.
2. `npm run assemble` after each `spec/` edit; `npm run build-order` before the
   commit (propagates `holonovel/holonovel.md`, refreshes fingerprints if any,
   advances the version set).
3. `npm run validate -- --write-register` after the citation edits.
4. `CHANGELOG.md` heading dated `2026-11-10` (the CalVer the version set
   advances to), one bullet per finding.
5. `test-persistence.ts`'s header ID list gains T31 and T108.
6. Appendix F edits are row prose only.

## 6. Delivery slices

One commit. If the session must stop early, it stops at a slice boundary with
the tree committed and consistent:

| Slice | Content | State left behind |
|---|---|---|
| A | §4.0 + §4.1 (warning, T27/T111, REQ-050a/050c) + F-P7a-1 `Resolved` + its bullet removed | Roadmap keeps the citation bullet(s); F-P7a-2/-3 stay scheduled. `LOOP OPEN`. |
| B | §4.2 (REQ-052, T20/T739, retitle) + F-P7a-3 `Resolved`. The citation bullet at `ROADMAP.md:20-22` covers **both** REQ-052 and the REQ-055 family, so slice B **splits** it: the REQ-052 clause goes, a bullet naming REQ-055/055a/055b stays | Roadmap keeps the REQ-055 bullet; F-P7a-2 scheduled. `LOOP OPEN`. |
| C | §4.3 (T31/T108, env branch, notice) + F-P7a-2 `Resolved` + last bullet removed + section deleted | Full done bar. `LOOP PAUSED`. |

Each slice's register flip and bullet removal are one step, so
`check-registers` passes at every stop.

## 7. Commit plan

One commit at the end of slice C (or at the end of A/B), per `AGENTS.md`:
a spec increment is one commit, and the roadmap section retires atomically
with its findings.

| # | Scope | Findings | Must pass |
|---|---|---|---|
| 1 | Slices A–C + close-out | F-P7a-1, -2, -3 | `test:backfill`, `test:persistence`, `test:limits`, `test:output-contracts`, `test:fate`, `test:ironsworn`, `test:forged`, `test:competitive-gaps`, `check:fast`, `build-order` |

## 8. Verification

| Step | Command | Pass |
|---|---|---|
| Harnesses | `npm --prefix holonovel run test:backfill`, `test:persistence`, `test:limits`, `test:output-contracts`, `test:fate`, `test:ironsworn`, `test:forged`, `test:competitive-gaps` | exit 0 |
| Registers | `check-registers`, `check-loop-artifacts` | exit 0 |
| Coverage | `npm run validate -- --write-register` | no new bucket-A/B rows |
| Full | `npm run assemble && npm run check:fast` (un-piped) | `check:fast: PASS` |
| Sync | `npm run build-order` | exit 0 |
| Close | `npm run session:close` | commit created |

Manual checks for the bar items no command observes:

| Bar | Check |
|---|---|
| 1 | All three findings under `## Resolved`; each `file:line` predicate rewritten from the post-change tree and present in `rg -n` output. |
| 2 | `rg "§5.7 determinism and citation repair" ROADMAP.md` returns nothing. |
| 4 | For T9/T20/T27/T31/T108/T111/T739, read the row's description and REQ column against the harness title and the citing `_Check:_` token; all three name one contract. T9's Editor-startup clause is carried by `test-output-contracts.ts:438`/`test-backfill.ts:563`, not by `test-limits.ts:386`. |

## 9. Failure handling

- A harness red after two fixes → stop that slice, keep its bullet and its
  `Scheduled-roadmap` finding, record the predicate. Remaining slices still
  commit; the AAR is `LOOP OPEN`.
- An existing scratch assertion breaks on the appended warning line → fix the
  assertion when it asserted the old wording; never remove the warning. If it
  compares a whole transcript, record it and pause.
- REQ-055b notice text conflicts with the contract → stop and record.
- Rollback cost 1 (`git revert`); no destructive or remote step.

## 10. Blast radius

| File | Change | Size |
|---|---|---|
| `holonovel/src/core/rng.ts` | `seedConflictWarning` | S |
| `holonovel/src/core/state.ts` | env-badge application on resume/switch | S |
| `holonovel/src/index.ts` | 10 warning sites; `badgeDisplayLabel`; resume notice | M |
| `holonovel/scripts/test-backfill.ts` | T27/T111 extension; T20 retitle | M |
| `holonovel/scripts/test-persistence.ts` | T31, T108, header ID list | L |
| `spec/02-requirements.md` | REQ-050a/050c/052/055/055a/055b | S |
| `spec/appendices-reference.md` | T9, T20, T27, T108, T111, T739 | S |
| `spec/audit/review-register.md` | 3 findings `Resolved` | S |
| `spec/audit/req-coverage.md` | regenerated | M |
| `ROADMAP.md` | section retired | S |
| `holonovel/DECISIONS.md` | seed interpretation + rationale | S |
| `CHANGELOG.md` | one dated entry | S |
| `holonovel.md`, `holonovel/holonovel.md` | assembled + propagated | S |
| `docs/plans/2026-11-10-5-7-determinism-citation-repair/*` | artifacts | S |

## 11. Alternatives considered

- **Re-point REQ-055/055a/055b to T9/T98 instead of implementing** — rejected:
  no harness covers precedence, the env branch, or the notice; T98 is thin.
- **Warn on every per-call seed (default-0 active)** — rejected: noise on every
  session; REQ-050a is clarified instead.
- **Check inside `rollDice`/`createRng`** — rejected: `index.ts:11519` passes an
  internal draw as the seed.
- **Return `warn()` for a seeded roll** — rejected: flips a completed draw's
  status to WARNING.
- **Keep T20's "path traversal" clause and add a traversal case there** —
  rejected: no artifact fixture; T739 asserts the envelope, and the row must
  match its harness.
- **Defer REQ-055a's env branch as a new finding** — rejected: it is the
  contract T108 exists to assert; deferring would ship a test that cannot pass.
