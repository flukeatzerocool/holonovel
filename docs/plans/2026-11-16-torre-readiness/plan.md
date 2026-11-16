# Plan — Torre Nosferatu readiness: player-visible lore, a secret holder, and the badge step

**Date:** 2026-11-16
**Kind:** planned
**Depth:** light
**Increment:** `docs/plans/2026-11-16-torre-readiness`

## Why

The bundled starter Novel was last authored on 2026-11-08 (`86bb068`). Since
then the server gained player-visible lore (`visibility`, REQ-083d), secret
holders (`known_by`, REQ-234e), and secret-to-relationship recommendations
(REQ-234b/d). The shipped Novel does not exercise any of them, and its tutorial
never tells a new player to leave the Editor badge.

The review that produced this plan is `docs/plans/2026-11-16-torre-readiness`
(the plan and AAR are the record). Findings:

- **F1 — No player-visible lore.** Every authored lore entry carries
  `badge_scope: "game_master"` and no `visibility` field
  (`holonovel/content/torre-nosferatu.source.json:443-471`), so
  `migrateNovelData` defaults every entry to `gm_only`
  (`holonovel/src/core/state.ts:131-133`). The Player badge sees zero lore,
  while the tutorial promises "Discovering lore by keyword rather than by
  exposition" (`.holonovel-state/wiki/Playing-Torre-Nosferatu.md:32`).
- **F2 — Secrets are inert.** All three secrets ship `known_by: []`
  (`torre-nosferatu.source.json:829,842,854`). No faction or entity holds one,
  so `faction://` secret surfacing (REQ-234c) and the `suspicious`/`rival`
  recommendation coupling (REQ-234b/d) cannot fire from shipped content.
- **F3 — Badge onboarding is missing.** The seeded Novel carries
  `badge: "none"` (`torre-nosferatu.source.json:5`), which the badge gate treats
  as the Editor role and grants GM-level reads
  (`holonovel/src/core/badge-gate.ts:130,163`). `Playing-Torre-Nosferatu.md`
  never tells the player to put on the Player badge.

Synthesis pre-seeding was considered and rejected; see Out of scope.

## Done bar

`npm --prefix holonovel run check:starter-freshness` passes;
`test-starter-novel` is 16/16; `holosuite --tier=novel` is 100/100; the
playability gate reports the starter clean; the starter source carries at
least two `visibility: "shared"` lore entries and at least one secret whose
`known_by` holder resolves to a registered entity, NPC, or faction; the wiki
page carries the Player-badge step; `npm run session:close` commits with a
green fast gate.

## Scope

### In scope

1. Mark `the-candle` and `resources` as `visibility: "shared"` in the starter
   source, keeping `badge_scope: "game_master"` as presentation priority
   (REQ-083d/083e).
2. Make The Survivors (`faction_mv4q1cba`) a holder of `secret-ilona-bitten`
   via `known_by`, so `faction://` surfaces it and REQ-234b recommends a
   `suspicious` relationship between The Survivors and Ilona.
3. Add a starter-harness assertion for both surfaces, so the readiness
   contract is gate-visible rather than prose-only.
4. Regenerate the tracked starter artifact.
5. Add the Player-badge onboarding step to the wiki tutorial.
6. Record the increment and close it through `session:close`.

### Out of scope (terminal dispositions)

- **Synthesis pre-seeding — record-and-close.** Synthesis is additive and
  optional; Build alone ships a working Novel
  (`spec/08-synthesis.md:11-19`), and auto-triggered items are inert until
  activated (`spec/08-synthesis.md:54-55`). The starter already carries
  authored persona, voice, 24 voice examples, and four narrator beats. A
  committed synthesis block would duplicate that work and is
  fingerprint-fragile across builds.
- **Second faction / REQ-234d `rival` branch — record-and-close.** The
  `rival` branch needs a second faction and a faction-naming secret, which is
  new content invention, not readiness. The mechanism is covered by T274.
  The one-faction Survivors is a recorded content decision (`86bb068`).
- **Authored `briefing_order` — record-and-close.** Empty resets to the
  builder default (REQ-082); the default is correct for a tutorial.
- **Identity facets for the other five NPCs — record-and-close.** Deliberate:
  decision D6 authors the protagonist and one NPC
  (`docs/plans/2026-11-08-novel-tier-identity/plan.md`).
- **Played save in `.holonovel-state/torre/` — record-and-close.** User
  confirmed it is disposable test state, not a persistent artifact.

## Blast radius

| Path | Change | Size | Rollback |
|---|---|---|---|
| `holonovel/content/torre-nosferatu.source.json` | two `visibility` fields; one `known_by` value | S | revert |
| `holonovel/content/torre-nosferatu.json` | regenerated artifact | S (generated) | regenerate |
| `holonovel/scripts/test-starter-novel.ts` | one new assertion case | S | revert |
| `.holonovel-state/wiki/Playing-Torre-Nosferatu.md` | one onboarding subsection; date | S | revert in wiki clone |
| `CHANGELOG.md` | one dated entry | S | revert |
| `docs/plans/2026-11-16-torre-readiness/{plan,tasks,aar}.md` | increment record | S | remove |

No spec source, tool definition, fingerprint, coverage register, or version
surface changes. The starter artifact is the only generated file.

## Phases

### Phase 0 — Preflight (read-only)

1. Confirm `git status` is clean for the six paths above (the wiki clone has
   pre-existing modifications in 22 other files; do not stage them).
2. Confirm the current counts: 94 rooms, 35 things, 6 NPCs, 17 lore, 3 secrets,
   3 countdowns.
3. Confirm the target holder id `faction_mv4q1cba` resolves to The Survivors.

### Phase 1 — Starter content

**File:** `holonovel/content/torre-nosferatu.source.json`

1. In `lore.the-candle`, add `"visibility": "shared"` after
   `"badge_scope": "game_master"`.
2. In `lore.resources`, add `"visibility": "shared"` after
   `"badge_scope": "game_master"`.
3. In `secrets[key="secret-ilona-bitten"]`, change `"known_by": []` to
   `"known_by": ["faction_mv4q1cba"]`.

Keep `badge_scope: "game_master"` on both lore entries: it is the briefing
presentation priority, not read access (REQ-083d/083e).

### Phase 2 — Regenerate the artifact

Run from the repo root:

```sh
npm --prefix holonovel run build:starter-novel
```

The build tool stamps the current `DATA_FORMAT` and package version and sorts
keys; no other field changes.

### Phase 3 — Gate the surface

**File:** `holonovel/scripts/test-starter-novel.ts`

Add a new `test(...)` case after "starter content keeps locks, light, and
presence wired":

```ts
await test("T658/REQ-565: the starter exposes shared lore and a held secret", () => {
  const dir = freshDir();
  const s = new StateManager(dir);
  s.seedStarterNovel();
  s.hydrateNovelsFromDisk();
  const novel = s.novels.get(SLUG);
  try {
    assert(novel, "starter hydrated");
    const shared = [...novel!.lore.values()].filter((e) => e.visibility === "shared");
    assert(shared.length >= 2, "at least two lore entries are player-readable");
    assert(shared.some((e) => e.key === "the-candle"), "the-candle is shared");
    assert(shared.some((e) => e.key === "resources"), "resources is shared");
    const held = novel!.secrets.filter((s) => (s.known_by ?? []).length > 0);
    assert(held.length >= 1, "at least one secret ships with a holder");
    const holders = new Set([
      ...novel!.entities.keys(),
      ...novel!.npcs.keys(),
      ...novel!.factions.map((f) => f.id),
    ]);
    assert(held.every((s) => s.known_by.every((id) => holders.has(id))), "every holder resolves");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
```

Expected: 15 passed → 16 passed.

### Phase 4 — Wiki onboarding

**File:** `.holonovel-state/wiki/Playing-Torre-Nosferatu.md` (separate git
clone; not tracked by this repository).

Insert after the "Start it" section and before "## The loop":

```markdown
### Put on the Player badge

The seeded Novel starts on the Editor badge (`none`), which sees everything
the Game Master sees. Put on the Player badge before you play:

> "Put on my Player badge. Let's play."

The Player badge sees shared lore and what the character has learned; the
Editor badge remains available for inspecting state and editing the Novel.
```

Update `_Last updated:_` to `2026-11-16`.

Commit only this path in the wiki clone (`git add Playing-Torre-Nosferatu.md`,
then commit). Do not push and do not stage the 22 other pre-existing
modifications.

### Phase 5 — Verify

Run and capture the unpiped exit code for each:

```sh
npm --prefix holonovel run check:starter-freshness
npm --prefix holonovel run test:starter-novel
npm --prefix holonovel run test:holosuite-novel
cd holonovel && npx tsx scripts/playability.ts --novel content/torre-nosferatu.json
```

**Delta (execution, 2026-11-16).** The original playability command used
`npm --prefix holonovel exec -- tsx scripts/playability.ts`, which resolves
`scripts/` against the repo root and fails with `ERR_MODULE_NOT_FOUND`. The
command above runs from the server directory instead. No scope or risk change.

Expected: freshness PASS, starter 16/16, T2 100/100, playability clean.

### Phase 6 — Close

1. Add a `## 2026-11-16 — Torre Nosferatu readiness: player-visible lore and a secret holder`
   entry to `CHANGELOG.md` (semantic change, so the changelog is required).
2. Write `tasks.md` and `aar.md`; the AAR ends `LOOP PAUSED`.
3. Run `npm run session:close`. It assembles, heals anchors, runs the fast
   gate (including `check-loop-artifacts` and `check-starter-freshness`), and
   commits the main repo.

One main-repo commit. The wiki commit is separate by necessity (different
repository). The wiki is not pushed by this plan.

## User impact

- Fresh installs receive the updated starter artifact; the seed copies the
  packaged file at first start.
- An already-seeded data directory is not re-seeded (REQ-565), so existing
  campaigns keep their current content. This increment does not migrate them;
  the played save in `.holonovel-state/torre/` is disposable per the user.
- No restart or state migration is required, and badge enforcement is
  unchanged.
- `version-check` is a publish-time gate and is currently red by design: the
  top `CHANGELOG.md` entry is 2026-11-16 while the package version is
  2026.11.15. `build-order`/`push-pipeline` advances the CalVer on publish;
  this increment does not bump it.

## Edge cases and rollback

- **Shared lore leaks a design key.** `the-candle` and `resources` contain no
  private design labels and pass the existing `PROSE_FORBIDDEN` scan. If the
  T2 prose scan flags either, revert that entry to `gm_only` and record the
  finding.
- **Holder id typo.** If `faction_mv4q1cba` does not resolve, the new
  assertion fails and the recommendation stays silent; the plan stops before
  commit. Verify the id in Phase 0.
- **Recommendation does not fire.** The pair Ilona ↔ The Survivors is
  `neutral` today, so the `suspicious` recommendation is not suppressed. If a
  future content change makes it `suspicious` already, the assertion on data
  still passes but the briefing recommendation disappears; T274 remains the
  mechanism test.
- **Artifact drift.** Regenerate and re-run freshness; never hand-edit
  `torre-nosferatu.json`.
- **Wiki commit collides with pre-existing changes.** Stage one path only.
  Rollback is `git restore Playing-Torre-Nosferatu.md` in the wiki clone.

Rollback cost: **0** for the main repo (pure additive content plus a new
assertion; `git revert` restores the prior artifact) and **1** for the wiki
page.

## Verification evidence

- Freshness gate: `holonovel/scripts/check-starter-freshness.ts`.
- Content contract: `holonovel/scripts/test-starter-novel.ts:148-200`.
- Shipped-novel route and counts: `holonovel/scripts/lib/holosuite-novel.ts:180-190`.
- Playability: `holonovel/scripts/playability.ts --novel`.
- Lore read access: `holonovel/src/core/state.ts:131-133`,
  `holonovel/src/index.ts:938-948`.
- Recommendation predicate: `holonovel/src/core/relationships.ts`
  (`secretRelationshipRecommendations`).

## Trust boundary

All inputs are repo content or user-authored wiki text. No web or tool-output
premise is trusted.

## Open questions

None.
