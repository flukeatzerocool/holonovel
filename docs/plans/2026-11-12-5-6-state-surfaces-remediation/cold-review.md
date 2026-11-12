# Cold review — §5.6 state surfaces remediation plan

Reviewer: independent-review (fresh context, no authoring context)
Depth: standard · Cold passes: 1 (+1 permitted diff re-review)
Evidence sidecar: `~/.local/state/opencode/plans/fe586f0907cda9bed04d391d454275b4a14bc3e300047c43f32dd854d4f08ed4/plan.evidence.json`
Git HEAD at review: `b5af6eca5249772c6df965937fe9f741b05c5dcc`

| Pass | Artifact sha256 | Stages | Verdict |
|---|---|---|---|
| 1 (full) | `079dfa3391b0f946b079812ef9b8170f7c249a9a2e1c15ca105932edd353f376` | 1–3, 5 (stage 4 not run: no author edits during the pass) | FAILED — 2 Blockers, 6 Majors, 8 Nits |
| 2 (diff re-review, Stages 4–5 only) | `4b7ede14f6b847d4950b69f2d7c7e8d45dd29430a61552f2ba884c6c0489b387` | 4–5 | FAILED — 1 Blocker, 1 Major, 2 Nits |

Post-cap delta (author): `7804fe3124e0bdbcde3514d880029708f804ac5d5cf853638d590f6ebcb9b79f`
Final reviewed-plan artifact (C-1 applied, §11 review record added):

Plan sha256: 213efc71f8a18f9f5cd84055173bb4705b2ecdeac982c20981c021980c0cb256
The re-review cap (standard: one) is reached; the remaining Blocker/Major are
mechanical and were applied after the cap as condition **C-1** for
`build-review` to verify, not as a new cold pass.

## Pass 1 — full review

1. [Blocker, design] D4's transition ordering was inverted at the
   `manage_scene` site: the marker clear at `index.ts:6830` runs before the hook
   at `6831-6843`, so the proposed cycle could never see markers there. The
   parser-move site (`:5118`) has no marker clear.
2. [Blocker, design] The done bar said one new Novel-persisted key while D5
   added `novel.world_reactivity_warnings` as a second key with no §7.7
   classification and no DECISIONS row.
3. [Major, design] The "two token lists already disagree (`world_state`)"
   premise was false — both lists carry the same eleven tokens
   (`index.ts:13151-13162`, `:10357`).
4. [Major, design] The `gm_context` GM-only restriction was invented;
   REQ-232b does not scope `get_context` and the §7.7 table names "GM Context"
   without a per-field badge rule for the response.
5. [Major, design] REQ-233a1 names three ripple triggers (relationship change,
   secret revelation, faction clock fill); the plan implemented only the
   relationship trigger.
6. [Major, design] REQ-233a3's acceptance criterion reads as an immediate
   campaign-memory fact on the connected entity; the plan only wrote the fact on
   GM accept.
7. [Major, design] The `modify` workflow was under-specified: no emitted
   `[NEED_INPUT]` text/options, no interaction with the generic drain's
   `cancel`-restores-snapshot path (`index.ts:3674-3683`).
8. [Major, design] The blast radius omitted
   `holonovel/src/generated/contract-fingerprints.ts`.
9. [Nit] T268 was mapped to `test:output-contracts`; it lives in
   `test-backfill.ts:221`.
10. [Nit] The T384 anchor `test-output-contracts.ts:854-877` was stale; the test
    is at `:941`, the substring assertion at `:962`.
11. [Nit, clarity] "F-P3B4-3a" is not a finding ID.
12. [Nit, clarity] The baseline said the tree was clean; the sidecar records the
    untracked plan directory.
13. [Nit, design] D6's non-JSON fallback left `session_id` visible.
14. [Nit, clarity] "the heading T358 asserts" — T358 has no harness yet.
15. [Nit, clarity] REQ-065f's "677 bytes" was unreproducible.
16. [Nit, clarity] Anchor drift: `index.ts:14526`, `state.ts:172-190`,
    `ROADMAP.md:15-37`, `ROADMAP.md:40-140`.

Verification notes that resolved: `badge_briefing` body 15006-15491 (485
lines) ✓; `index.ts:1582` pacing-counter note ✓; `audit://novel` 13442-13461 ✓;
`intro` 14967 ✓; `composeIntro` prompt-composition.ts:90 ✓; `section_tokens`
13151 ✓; `VALID_TOKENS` 10357 ✓; `codex` size 12985 ✓; resolver 3624-3646 ✓;
neutral predicate 1054 ✓; `relationshipMarkers.delete` 6830 ✓; coupling row
`spec/04-runtime.md:554` ✓; property row `:287` ✓; harness anchors
T268/T275/T280/T334/T224 ✓; no T52/T270/T358 titles in `holonovel/scripts` ✓;
T52 row `appendices-reference.md:1514` ✓; REQ-232b/c, 233a2, 236a/b/c, 242b,
285a/c, 321g/k/l, 332b/c text ✓. Budget 33/40 reads.

## Pass 2 — diff re-review (Stages 4–5)

`independent-review FAILED. plan.md` — 1 Blocker, 1 Major, 2 Nits.

1. [Blocker, clarity] Phase 3 step 8 still listed
   `world_reactivity_warnings` as a persisted key (`plan.md:317-318`),
   contradicting D5 (`:178-181`), D3 (`:109-120`), and the done bar (`:64-66`).
2. [Major, design] The removed `gm_context` restriction survived in two
   restatements: the §7 risk row (`plan.md:384`) and §10 (`:416-418`). The §7.7
   justification is unsupported — `spec/04-runtime.md` has one `gm_context`
   occurrence (line 250), a Novel-tier row with no badge scope.
3. [Nit, design] `addCampaignFact` does not exist; campaign memory is the
   Novel-level `recordCampaignMemory(novel, category, text, badge_scope)`
   (`index.ts:2420-2424`) with no entity dimension, so REQ-233a3's "on entity B"
   needs a stated representation.
4. [Nit, design] The enqueue was sited at the `shouldMarkRelationshipChange`
   predicate (`:1054`) rather than its one call site (`index.ts:7980`).

Verified fixed in pass 2: B1 ordering (marker copy before `:6830`, cycle inside
the hook after `:6836`, parser site `:5118`); B2 derivation
(`recordCampaignMemory`, derived warnings); Major 3 token lists; Major 5 three
triggers (`:1052-1056`, `fillFactionClock` 6427/6449, reveal branch
7711/7728-7745); Major 6 immediate fact + accept fact; Major 7 exact
`[NEED_INPUT]` text/options and drain cancel path `index.ts:3682-3691`
(`needInput` helper `:3014`); Major 8 fingerprints path; Nits 9–16.
Reads this re-review: 7 (cumulative 37/40).

## Resolution after the cap

The author applied the pass-2 Blocker and Major and both Nits in the post-cap
revision `7804fe31…`:

- Phase 3 step 8 now adds only `WorldChange` and `world_in_motion` and states
  the warnings surface is derived.
- The §7 risk row and §10 now say `get_context` keeps its `gm_context` field
  and the increment adds only the `badge_briefing` payload.
- The ripple fact uses `recordCampaignMemory` and states the representation for
  REQ-233a3's "fact on entity B".
- The enqueue is sited at the `recordRelationshipMarker` call site
  (`index.ts:7980`), leaving the pure predicate untouched.

No third cold pass was run (standard cap). These four edits are condition
**C-1** for `build-review`.
