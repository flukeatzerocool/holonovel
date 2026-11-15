# Plan — Secret relationship recommendations (REQ-234b, REQ-234d)

Status: draft v3 (cold pass → v1; re-review → B2, two majors and two nits applied; see Amendments) · Kind: planned · Depth: standard
Increment target: `docs/plans/2026-11-15-secret-relationship-recommendations/`
Rollback cost: 1 (three reversible commits; no state, schema, or migration change)
Evidence class: repo (`file:line` at HEAD `b1f5c4a`) and tool output (baseline gate run in
this session). No web, user, or third-party content enters this plan.
Trust boundary: repo and local tool output only.
Review independence: fresh — cold pass `/tmp/opencode/cold-review-234bd.md` (verdict
`independent-review passed.`, 0 blockers / 5 majors / 7 nits, stages 5/5, 24/40 reads; all
twelve findings applied in v2), then a constrained re-review
`/tmp/opencode/cold-review-234bd-v2.md` (2 blockers: B1 a working-tree false positive, B2 a
real fixture collision; both dispositions in Amendments). The v3 delta review is the final
pass.
Preflight evidence:
`/home/fluke/.local/state/opencode/plans/fe586f0907cda9bed04d391d454275b4a14bc3e300047c43f32dd854d4f08ed4/plan.evidence.json`
(regenerated after v2; 9 targets, 0 missing / 0 untracked; 9 REQ hits; git `b1f5c4a`).

## Why

`ROADMAP.md` carries two open sections. The P2 section is date-gated (2026-11-28) and
cannot be worked this session. The P1 section is a normative, unimplemented coupling:
REQ-234b and REQ-234d require the server to *recommend* a relationship when a secret
implicates another party, and nothing in the reveal path or the briefing does it. The
preceding increment built the faction-reveal surface and deliberately deferred these two
clauses because they need a recommendation surface rather than a validation change
(`spec/audit/review-register.md:3092-3101`).

Closing them is a conformance change, not new design: the relationship vocabulary already
carries `suspicious` and `rival` (`holonovel/src/core/state.ts:529-535`), the briefing
already renders GM guidance in `narrative_threads`, and the `secrets://active` resource
already exists for the GM badge.

## Scope

In scope: a pure, read-only recommendation detector over `novel.secrets` and the
registered party names; the GM-only briefing line that surfaces it; the T274 harness
assertions and the Appendix F row that make the contract traceable; the register,
roadmap, changelog, and coverage-register updates the closure requires.

Non-goals: the date-gated fix-up re-measurement (P2, trigger 2026-11-28); any new tool,
action, resource, parameter, or Novel-persisted state; any change to REQ-234a/c/e, to
REQ-236's relationship types, or to the disposition helpers; a persisted dismissal or
acknowledgement of a recommendation (Open question 2); semantic or fuzzy name matching of
any kind.

## Evidence

All reads at HEAD `b1f5c4a`; baseline `npm run check:fast` → 45 passed, 0 failed
(`status`: 113 unpushed commits, 2 open roadmap items).

| ID | Claim | Predicate |
|---|---|---|
| EV1 | The roadmap's P1 item names both REQ clauses; P2 is date-gated. | `ROADMAP.md:15-24` (P1), `:26-36` (P2, trigger 2026-11-28). |
| EV2 | REQ-234b requires the `suspicious` recommendation and defines name overlap as exact, case-insensitive, token-level, non-fuzzy matching. | `spec/02-requirements.md:2920-2921`. |
| EV3 | REQ-234c scopes the recommendation to the Game Master badge and owns the faction-holder surface. | `spec/02-requirements.md:2923-2924`. |
| EV4 | REQ-234d requires `rival` at reveal time when the caller reveals a secret to a faction and the secret names another faction. | `spec/02-requirements.md:2926-2927` ("WHEN the caller reveals a secret to a faction …"). The plan treats the persisted `known_by` holder as the state equivalent of that reveal; D3 records that reading. |
| EV5 | Nothing implements either clause. | The `reveal` case emits a world change and a `told` perception record only (`holonovel/src/index.ts:9098-9143`); `grep -n suspicious holonovel/src/index.ts` returns `:669`, `:680`, `:1120-1127`, `:1169-1179`, `:9383`, `:9388`, `:12161` — disposition, schema, and player-voice sites, none a REQ-234b call site. |
| EV6 | The relationship vocabulary and read seam already exist. | `holonovel/src/core/state.ts:529-535` (`suspicious`/`rival` in the type union); `holonovel/src/core/relationships.ts:25-44` (`resolveRelationshipParty`), `:56-95` (`relationshipPairKey`, `dedupeRelationships`). |
| EV7 | The briefing section that carries GM relationship guidance is `narrative_threads`, and it renders for Player and Observer too. | `holonovel/src/index.ts:17810-17890`; `badges: ["game_master", "observer", "player"]` at `:17817`; the GM-only block at `:17869`. |
| EV8 | The GM-only secret resource already exists. | `holonovel/src/index.ts:16114-16121` (`secrets://active`, `[FORBIDDEN]` for non-GM). |
| EV9 | Secret holders resolve to entities and factions only, so no new holder kind is implied. | `holonovel/src/index.ts:8840-8844` (`resolveSecretHolder`). |
| EV10 | T274 is the secrets harness row and has a briefing helper available. | `holonovel/scripts/test-narrative.ts:1165-1212` (T274), `:86-91` (`briefing`). |
| EV11 | The T274 spec row already lists the secrets parts but omits b and d. | `spec/appendices-reference.md:1743` — REQ column `REQ-234, REQ-234c, REQ-234e`. |
| EV12 | The disposition row that scheduled this work is a `Scheduled-roadmap` finding and must move with the roadmap section. | `spec/audit/review-register.md:3092-3101`; `scripts/lib/register-checks.ts:64-69` traces every scheduled REQ to `ROADMAP.md`. |
| EV13 | REQ-234 is already bucket C, evidenced by T274/T406/T414, so no coverage whitelist change is needed. | `spec/audit/req-coverage.md:212`. |
| EV14 | No §7.7 property group or fingerprint is implicated by a computed briefing line. | `AGENTS.md` checklist: new Novel-persisted state is a §7.7 property group; this plan adds none. The briefing is a render, not state (`holonovel/src/index.ts:1699-1701`, REQ-606 side-effect-free section text). |

## Decisions

- **D1 — computed, not persisted.** The detector runs during briefing composition and is a
  pure function of `novel.secrets` plus registered names and relationships. No new state
  field, no clone/checkpoint/archive enumeration, no §7.7 property group, no fingerprint
  change (EV14). Rejected: an in-memory `relationshipRecommendations` map keyed by slug,
  which would make the recommendation depend on render order and disappear on restart.
- **D2 — suppression means "the pair already holds that type, in either direction".** A
  recommendation is emitted unless some existing row between the two parties already
  carries the recommended type. The stored pair key is order-sensitive
  (`relationshipTokenPairKey`, `holonovel/src/core/relationships.ts:57-68`; the tool
  description says "ordered (entity_a, entity_b) pair", `holonovel/src/index.ts:9383`), so
  the detector canonicalizes the two resolved ids by sorting them before comparing — a
  reverse-direction `set` suppresses exactly like a forward one. The server never writes
  the relationship; once the row exists the line disappears on the next render. Rejected:
  auto-creating the relationship, which would violate the REQ's "recommended" wording and
  create state the GM did not author.
- **D3 — `rival` supersedes `suspicious` for the faction-to-faction case, as a recorded
  interpretation.** Both clauses are SHALLs (EV2, EV4), so the overlap is resolved
  explicitly rather than silently: REQ-234b's sentence is holder-agnostic and names
  entities and factions as implications, while REQ-234d names the narrower faction-to-
  faction case. Emitting both lines for one pair would tell the GM to create two
  conflicting edges, so the plan emits `rival` only when the holder is a faction and the
  implicated target is a faction, and `suspicious` for every other combination —
  including a faction holder whose secret names an entity or NPC (REQ-234b applies).
  Rejected: emitting both literal SHALLs. If the spec owner reads the clauses as
  cumulative, the change is one branch in the detector plus one assertion. REQ-234d's
  trigger is an action (reveal to a faction); the detector reads the persisted `known_by`
  holder as its state equivalent, and the holder is reported from that resolution and is
  never a text-overlap candidate. One line per `(holder, target, type)`; the first secret
  in `novel.secrets` order supplies the cited key, so output is deterministic.
- **D4 — exact, whole-token, case-insensitive name overlap.** A registered name matches
  when it appears in the secret text bounded by non-alphanumeric characters, compared
  case-insensitively. No substring-of-word match, no stemming, no semantic matching
  (EV2). Parties are enumerated entities → NPCs → factions, deduped by id so the
  documented entity-wins-id-collision rule holds; the holder and unregistered tokens are
  never candidates.
- **D5 — GM badge only, checked explicitly.** The line is added inside a
  `c.badge === "game_master"` guard, not the section's `!== "player"` guidance guard,
  because `narrative_threads` also renders for the Observer badge (EV7) and REQ-234c says
  Game Master only. Rejected: reusing the `!player` branch, which would leak the line to
  the Observer.
- **D6 — a pure helper in `core/relationships.ts`, no new module, tool, or action.** The
  existing relationship read seam already owns party resolution and pair keys (EV6); the
  detector exports a typed result and the briefing formats it. Rejected: a second
  resolution helper in `index.ts`, which duplicates the read seam.
- **D7 — extend T274 rather than mint a test ID.** T274 is already the secrets row and
  already runs the reveal path (EV10-11); new assertions keep the test count and the
  assertion-miss baseline unchanged. The Appendix F row gains REQ-234b/REQ-234d and the
  recommendation assertions, so the spec's test matrix stops omitting the two clauses.

## Phases

### Phase A — detector and briefing line (medium)

Landed before the v3 amendment (A-4); the remaining action for this phase is its commit.
Commit `2026-11-15 — Secret relationship recommendations: detector and GM briefing line`.

1. `holonovel/src/core/relationships.ts` — add and export
   `interface SecretRelationshipRecommendation { type: "suspicious" | "rival"; holder_id;
   holder_name; target_id; target_name; secret_key }` and
   `secretRelationshipRecommendations(novel: NovelState): SecretRelationshipRecommendation[]`
   implementing D1–D4; header cites REQ-234b, REQ-234d.
2. `holonovel/scripts/test-narrative.ts` — add the **gate-decisive probe** to T274: one
   GM-positive assertion (a secret naming a registered party produces a line carrying the
   `Relationship suggestion:` prefix and the expected type) and one Player-negative
   assertion. Run it before wiring step 3 to confirm it fails. Phase B extends the same row.
3. `holonovel/src/index.ts` — in the `narrative_threads` render (`:17820-17888`), after
   `relationshipMarkerLines` (`:17830`), push each recommendation line when
   `c.badge === "game_master"` (D5). Line shape:
   `Relationship suggestion: consider a <type> relationship between <holder> and
   <target> (implicated by secret '<key>').`
4. No schema, resource, or action change; `secrets://active` keeps its payload (EV8) and
   gains only the remaining harness assertions in Phase B.

Gate for A: the probe fails before step 3 and passes after it; `npm --prefix holonovel run
typecheck`; `npm --prefix holonovel run test:narrative` (84 rows green).

### Phase B — harness and traceability (small)

Commit `2026-11-15 — Secret relationship recommendations: T274 asserts both clauses`.

1. `holonovel/scripts/test-narrative.ts:1165-1212` — extend T274 with three authored
   fixtures. The Phase A probe (`probe_implication`, Ash Guild holding a secret that names
   Grey Court) is already in the same test and emits a legitimate `rival` line, so each new
   negative assertion names the exact pair it excludes rather than "any other line":
   - `secret_entity_faction` — content `The Grey Court paid the butler.`, revealed to
     `character_01` → GM briefing carries a line with the `Relationship suggestion:`
     prefix, `suspicious`, `character_01`, and `Grey Court`;
   - `secret_faction_faction` — content `Salt Watch takes its orders from the Grey
     Court.`, revealed to `Salt Watch` → GM briefing carries a `Relationship suggestion:`
     line with `rival`, `Salt Watch`, and `Grey Court`, **and no line pairing `Salt Watch`
     with `Ash Guild`** (the Ash↔Grey line from `probe_implication` is expected and is not
     what this assertion excludes);
   - create a distinct entity (`Marisol Vane`); `secret_faction_entity` — content
     `Marisol Vane sold the ledger.`, revealed to `Ash Guild` → GM briefing carries a
     `Relationship suggestion:` line with `suspicious` between `Ash Guild` and
     `Marisol Vane` (REQ-234b, holder-agnostic);
   - Player badge briefing and Observer badge briefing contain neither the
     `Relationship suggestion:` prefix nor any recommendation text;
   - `manage_relationship (action: set, type: "suspicious"|"rival", …)` on the same pair —
     in the reverse argument order for at least one case — suppresses its line on the next
     render, and the assertion is on the `Relationship suggestion:` prefix (a bare
     `suspicious`/`rival` substring can match the REQ-236b change marker);
   - `secrets://active` under the GM badge carries the secret key and its `known_by`
     holders; under the Player badge it returns `[FORBIDDEN]` (REQ-234b resource clause).
2. `spec/appendices-reference.md:1743` — T274 REQ column gains `REQ-234b, REQ-234d`; the
   assertion text gains the three recommendation checks and the resource check.
3. Regenerate in order: `npm run assemble` → `npx tsx
   holonovel/scripts/generate-g7-attestation.ts` when `check-g7-attestation` reports the
   spec hash moved.

Gate for B: `npm --prefix holonovel run test:narrative` (T274 green);
`npm run assemble && npm run check:fast` (45/45).

### Phase C — records and close-out (small)

Commit `2026-11-15 — Records: U6-F5b resolved and the roadmap section retired`.

1. `spec/audit/review-register.md:3085-3101` — move the **whole**
   `### 2026-11-15 roadmap residuals — secret relationship recommendations` subsection
   (heading, scheduling prose, and U6-F5b bullet) out of `## Scheduled-roadmap` into a new
   `## Resolved — 2026-11-15 secret relationship recommendations` section, keeping the
   file's two-level shape (`## Resolved — <date> <subject>` plus a
   `### <date> <session> — <title>` subsection). Rewrite the scheduling prose to name the
   closing increment and the detector; rewrite the bullet to cite
   `holonovel/src/core/relationships.ts`, the GM briefing guard in
   `holonovel/src/index.ts`, and T274. Leaving the subsection prose behind would keep a
   false "Scheduled under ROADMAP" claim once C2 deletes the section.
2. `ROADMAP.md` — remove § *Secret relationship recommendations (P1)*; leave the P2
   re-measurement section and `## Non-goals` untouched.
3. `CHANGELOG.md` — dated entry: the two clauses, the computed-not-persisted decision,
   the GM-only guard, the T274 assertions, and the regeneration evidence.
4. Regenerate: `npm run validate -- --write-register` (coverage register freshness) →
   `npm run build-order` (spec hash, G7/phase-map consistency, CalVer no-op).
5. `npm run fix-anchors` when `check-anchors` reports drifted evidence anchors after the
   `index.ts` edits.
6. `docs/plans/2026-11-15-secret-relationship-recommendations/` — `plan.md` and
   `tasks.md` land with this commit; `aar.md` is written before the close.

Gate for C: `npm run assemble && npm run check:fast`; `npm run check-anchors`;
`HOLONOVEL_IMPL_STRICT=1 npm run validate` (REQ-234 stays bucket C, 0 errors).

## Blast radius

| File | Phase | Size | Change |
|---|---|---|---|
| `holonovel/src/core/relationships.ts` | A | M | pure recommendation detector |
| `holonovel/src/index.ts` | A | S | GM-only briefing lines in `narrative_threads` |
| `holonovel/scripts/test-narrative.ts` | A, B | S | T274 probe in A; full recommendation and resource assertions in B |
| `spec/appendices-reference.md` | B | S | T274 row text and REQ column |
| `spec/audit/review-register.md` | C | S | U6-F5b subsection relocated to a dated `## Resolved` section |
| `ROADMAP.md` | C | S | P1 section removed; P2 retained |
| `spec/audit/req-coverage.md` | C | S | regenerated with `--write-register` |
| `holonovel.md`, `holonovel/holonovel.md` | B, C | S | `assemble` output |
| `holonovel/src/generated/g7-attestation.ts` | B | S | regenerated when the spec hash moves |
| `holonovel/scripts/holosuite*.ts`, `holonovel/scripts/lib/holosuite-*.ts` | C | S | evidence anchors repointed by `fix-anchors` when `index.ts` moves |
| `CHANGELOG.md` | C | S | dated entry |
| `docs/plans/2026-11-15-secret-relationship-recommendations/{plan,tasks,aar}.md` | all | S | increment artifacts |

Unchanged and checked: `holonovel/src/core/state.ts` (no new state), the tool registry and
`tool-definitions.json`, the surface baseline and budget, `holonovel/AGENTS.md` counts,
REQ bodies, `spec/build-phase-map.md` (hand-maintained; this change moves no section),
`§7.7` and its fingerprints, the DECISIONS gate-classification table.

## Done bar

- REQ-234b: a secret naming a registered entity, NPC, or faction yields a `suspicious`
  recommendation naming both parties and the secret key, including the faction-holder /
  entity-target case; the sole exception is the faction-to-faction case below (D3).
- REQ-234d: a faction holder's secret naming another faction yields `rival` instead of
  `suspicious` (the recorded D3 interpretation of the two SHALLs), and no line is emitted
  for a party the secret does not name. The holder comes from `known_by`, so it is named
  even when its own name is absent from the secret text; overlap is tested for the target.
- REQ-234c: both lines appear in the Game Master briefing and in neither the Player nor the
  Observer briefing.
- Suppression: setting the recommended relationship — in either argument order — removes
  its `Relationship suggestion:` line on the next render.
- Traceability: the T274 row and harness both name REQ-234b/REQ-234d.
- Records: U6-F5b is under `## Resolved` with a predicate; the ROADMAP P1 section is gone
  and P2 remains.
- Session: `check:fast` 45/45; `npm --prefix holonovel run test:all` green; `check-anchors`
  current; `aar.md` ends `LOOP PAUSED`.

## Risks and edge cases

- **A common registered name creates noise** (e.g. an NPC named "Guard" matching ordinary
  prose). D4 is exactly what REQ-234b licenses; the harness uses unique fixture names.
  Recorded as soft flag, not a blocker: a minimum-length floor would be an unsanctioned
  rule change (Open question 2).
- **The two SHALLs overlap.** D3 records the interpretation (REQ-234d's `rival` supersedes
  REQ-234b's `suspicious` for faction-to-faction) and the done bar names the exception. If
  a reviewer reads the clauses as cumulative, the remedy is one detector branch and one
  assertion — not a rewrite.
- **Suppression direction.** The stored pair key is ordered, so a reverse-direction set
  would not match a naive check; D2 canonicalizes by sorting the resolved ids, and the
  harness exercises the reverse order once.
- **Observer leak.** The section's existing guidance block is `!player`; D5 uses the
  explicit GM predicate and T274 asserts both non-GM badges.
- **Budget truncation.** `narrative_threads` is a `critical`-layer section, so the line
  survives the prompt budget; the line is one sentence and T274 asserts it on the GM
  prompt, not on a raw render.
- **Duplicate lines.** A pair implicated by several secrets emits once per
  `(holder, target, type)`; the first secret in store order is cited (D3).
- **Register/roadmap half-move.** `check-registers` traces a scheduled REQ to
  `ROADMAP.md`, so C.1 and C.2 land in the same commit.
- **Anchor drift.** The `index.ts` edit moves evidence anchors; `npm run fix-anchors` runs
  before the final `check-anchors`.
- **G7 freshness.** The Appendix F edit changes the spec hash; the plan regenerates the
  attestation in Phase B before promising green.

## Verification

| Step | Command | Expected |
|---|---|---|
| Baseline | `npm run check:fast` | 45 passed, 0 failed |
| A probe | `npm --prefix holonovel run test:narrative` before step A.2 | the new T274 probe fails |
| A | `npm --prefix holonovel run typecheck`; `test:narrative` | green, 84 rows |
| B | `npm --prefix holonovel run test:narrative` | T274 green with all recommendation and resource assertions |
| B spec | `npm run assemble && npm run check:fast` | 45/45, G7 fresh |
| C strict | `HOLONOVEL_IMPL_STRICT=1 npm run validate` | 0 errors, REQ-234 bucket C |
| C suite | `npm --prefix holonovel run test:all` | 56 commands pass |
| Anchors | `npm run check-anchors` | current |
| Close | `npm run session:close` | commits the final increment |

Unverified by design: the date-gated P2 re-measurement (out of scope until 2026-11-28).

## Open questions

1. Does the spec owner accept D3's reading that REQ-234d's `rival` supersedes REQ-234b's
   `suspicious` for faction-to-faction rather than adding to it? The plan records the
   interpretation; a contrary ruling changes one detector branch and one assertion.

2. Should a very short registered name be excluded from matching? Deferred. The spec says
   "exact case-insensitive match", which forbids both fuzzy matching and an unstated
   length floor; measure noise in real play before proposing an amendment.
3. Publishing: 113 commits are unpushed and the last publish is 2026-11-09. Not part of
   the done bar; the operator publishes at their discretion.

## Amendments (execution deltas)

Recorded during execution; each is a deviation from the stamped v2 plan, not a silent
improvisation.

- **A-1 — the re-review's B1 is a working-tree false positive, not a plan defect.** The
  re-review read `holonovel/src/core/relationships.ts` and `holonovel/src/index.ts` from the
  working tree, which already carried the uncommitted Phase A implementation, and concluded
  that EV5 ("nothing implements either clause") was false. At the reviewed HEAD `b1f5c4a`
  neither the detector export nor the `Relationship suggestion:` line exists; EV5 remains
  true of the reviewed baseline. The re-review's B1 disposition is therefore
  *reviewer-observed build state*, and it changes no plan text. The delta re-review verifies
  this with `git show b1f5c4a:holonovel/src/core/relationships.ts`.
- **A-2 — B2 was real and is corrected (v3).** The re-review showed the Phase B
  faction-to-faction negative assertion ("no line pairing either with `Ash Guild`") would
  fail on correct behavior, because T274's Phase A probe (`probe_implication`, Ash Guild
  holding a secret that names Grey Court) legitimately emits an Ash↔Grey `rival` line in the
  same briefing. The assertion now excludes exactly the `Salt Watch`↔`Ash Guild` pair, and
  the false premise that the existing secrets name no registered party is corrected.
- **A-3 — re-review pointers and counts (v3).** EV4 now cites D3, which records the
  reveal-action → persisted-`known_by` reading; the done bar states the holder is reported
  from `known_by` while overlap is tested for the target; the preflight line records 9 REQ
  hits; Phase A's steps are ordered probe → wiring so the probe can fail first.
- **A-4 — Phase A landed before the amendment.** The detector, the GM-only briefing line,
  and the gate-decisive T274 probe are implemented and verified (`typecheck` exit 0; probe
  FAIL before wiring; `test:narrative` 84/84 after). The commit split stands: Phase A's
  commit carries those files, Phase B's carries the remaining assertions and the Appendix F
  row.
