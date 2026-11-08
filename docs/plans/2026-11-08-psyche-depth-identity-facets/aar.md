# AAR — Psyche-depth identity facets, who-they-are renderer, and tension surface

Session 2026-11-08. Plan:
`docs/plans/2026-11-08-psyche-depth-identity-facets/plan.md`.
Roadmap chunk 4 of 5. Baseline: `check:fast` PASS (37/37); `test:identity`
15 passed; `check-registers` PASS; version 2026.11.08.

## What shipped

| Surface | Change |
|---|---|
| `spec/02-requirements.md` | §5.26 REQ-636–643 added; REQ-109c2/e, REQ-476, REQ-480, REQ-481, REQ-482 amended; §5 map row `473–483, 547, 636–643` |
| `spec/04-runtime.md` | §7.7.0 identity paragraph: kind catalog and order, awareness, valence domain, date bounds and evaluation instant, tension definition, Player projection |
| `spec/01a-constitution.md` | Glossary "Character Identity" row names the psyche attributes |
| `spec/appendices-reference.md` | Appendix E rows REQ-636–643; Appendix F rows T758–T765; T572 amended |
| `holonovel/src/core/identity.ts` | `FacetKind`/`FACET_KINDS`, `FacetAwareness`, `PsycheAttributes` on both records, `normalizeFacetAttributes`/`normalizeIdentityState`, `compileTensions`, kernel `tensions`, `playerIdentityProjection`, `renderWhoTheyAre`, compiler version `2026.11.08` |
| `holonovel/src/index.ts` | Seven `stage` parameters + validation; Player projection on `list`/`snapshot`; `identity://` badge gate and listing filter; `### Who They Are` after the POV block |
| `holonovel/scripts/test-identity.ts` | T758–T765; T572 extended with a developmental psyche facet |
| `holonovel/scripts/lib/jsonrpc.ts` | `readPrompt`/`promptReader` shared helper (duplicate-helper gate) |
| `holonovel/scripts/lib/holosuite-*.ts` | Nine line-pinned anchors re-resolved (+49 offset) |
| `holonovel/content/torre-nosferatu.json` | Rebuilt for the `DATA_FORMAT` bump |
| Registers | DECISIONS (D1–D11 + deferral + budget update), CHANGELOG, ROADMAP item retired, `holonovel/AGENTS.md`, COF upstream ledger, tool definitions, surface baseline, coverage register, fingerprints |

No new tool, no new action, no new property group, no new config. Tool count
stays 37; `manage_identity` gains seven optional parameters.

## Evidence

| Command | Result |
|---|---|
| `npm run assemble` | 0 errors |
| `cd holonovel && npm run test:identity` | 23 passed, 0 failed (T563–T573, T758–T765, T630, T631) |
| `cd holonovel && npm run test:all` | 54 passed, 0 failed (119.4 s) |
| `npm run check:fast` (un-piped) | `check:fast: PASS`, 37 passed, 0 failed, exit 0 |
| `npm run check` (inside `build-order`) | 0 errors, 268 warnings |
| `HOLONOVEL_IMPL_STRICT=1 npm run validate` | 0 errors; bucket A 0 |
| `npm run build-order` | "Build order complete. Ready to commit."; fingerprint propagated |
| `npm run surface-budget` | PASS — full 27,933; standard 24,335/25,140; small 1,149/2,794 |
| `npx tsx scripts/surface-replay.ts --check` | exit 0, precision 0.978 (floor 0.90) |
| `npm run check-loop-artifacts` | PASS |
| `npm run check-roadmap` / `check-registers` | PASS |

## Done bar

- A developmental psyche facet stays pending — **T572** (extended: kind fear,
  awareness no, still a candidate, version unchanged).
- A false belief renders marked after reconciliation — **T760**
  (`[false belief]` for the GM after `manage_belief (action: reconcile)`;
  absent for the Player, belief retained).
- A contradiction survives reconciliation — **T763** (one tension before and
  after reconcile; a ghost-named contradiction stays dormant).
- Two renders at one identity version and event-log head are byte-identical —
  **T764**.
- A Player read of a foreign identity is refused through the tool and the
  resource — **T765**.
- `check:fast` PASS un-piped; strict validate 0 errors; roadmap section retired;
  CHANGELOG carries the increment. All met.

## Deviations recorded during execution

- **The starter artifact was rebuilt.** The plan said no rebuild was needed
  because identity is Roster-tier, but `DATA_FORMAT` hashes §7.7 as a whole, so
  editing §7.7.0 staled `content/torre-nosferatu.json`. `build:starter-novel`
  rewrote its one `DATA_FORMAT` line; the plan was amended and re-stamped
  (`sha256 cdc0a55c…`) before continuing.
- **The briefing helper moved to `scripts/lib/jsonrpc.ts`.** The new
  `test-identity.ts` `briefing` helper tripped `check-script-quality`'s
  duplicate-helper detector against `test-narrative.ts` (0.89 similarity);
  `readPrompt`/`promptReader` now live in the shared lib and `test-identity`
  binds one line to it. `test-narrative.ts` was not edited.
- **Nine holosuite evidence anchors re-resolved.** The `index.ts` edits shifted
  every anchor after the identity block by 49 lines; each anchor moved to the
  line carrying its token. All five tiers pass.
- **The recorded surface budgets advanced.** The new schema parameters grew the
  measured catalog from 27,681/24,083 to 27,933/24,335 tokens; DECISIONS records
  the measurement (REQ-571 requires agreement, not headroom).
- **`manage_identity` description is 989 B** against the 1000 B recorded budget
  (condition C-1 resolved; no prose was appended without replacement).
- **C-2 resolved:** the Player projection applies to candidate records as well
  as facets, and no existing test asserted raw candidate attributes for a
  Player (T571 asserts only refusal; the new T765 asserts projection).

## Findings

| Finding | Tier | Disposition |
|---|---|---|
| Proofread register records 257 warnings; the live run reports 265 (265 before this increment's eight new REQ bodies) | P3 | **Record-and-close** — pre-existing count drift; the gate treats the count as informational and the register tracks named findings, not a bare total. No action item. |

No P0 (demonstrated wrong output or gate failure) and no P1 (unbudgeted
normative gap) remain. Chunk 5 (subjective recall quality) stays on `ROADMAP.md`
as scheduled work, not an AAR recommendation.

## Coverage backlog

`spec/audit/req-coverage.md`: bucket A 0, bucket B 0, bucket C 468, bucket E
126 (594 REQs). REQ-636–643 are bucket C with T758–T765 as direct evidence.

LOOP PAUSED
