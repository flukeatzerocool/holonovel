# Cold review — §5.6 adventure content remediation plan

Reviewer: independent `review` subagent (no authoring context)
Artifact reviewed: `plan.md` sha256 `4b9205923ab2c82f7cdafb81ddea90ed66672a0deaffa92a88a3951efe3b466c`
Evidence sidecar: `.local/state/opencode/plans/fe586f0907cda9bed04d391d454275b4a14bc3e300047c43f32dd854d4f08ed4/plan.evidence.json`
Git head: `a52acc428942fac3627e5e89738ee5e0a9b2b12c`
Depth: standard · Reads: ~31/40 · Verdict: FAILED

## Blockers

1. **Gate invocation.** The plan required `npm run check:adventure-index` at the
   repo root, but only `holonovel/package.json` carried the script and the root
   `package.json` was absent from the blast radius; `scripts/lib/gate-manifest.ts`
   runs root scripts. *(Resolved: root script added, name unified to
   `check-adventure-index`, root `package.json` in the table.)*
2. **REQ-454 whitelist.** Implementing REQ-171/REQ-172 in `holonovel/src` while
   keeping them in `INTENDED_GAP_REQS` trips `scripts/validate.ts:1839-1846`
   without a disposition; the plan claimed they "stay bucket E" without the
   `INTENDED_GAP_CITED_DISPOSITIONS` edit. *(Resolved: dispositions added and
   `scripts/validate.ts` in the blast radius.)*
3. **Assertion breadth.** T206, T208, T146, T284, T287, T305 blocks omitted
   catalogue clauses, and REQ-171b's "skipped absent from all surfaces" had no
   design path. *(Resolved: each block widened to its Appendix F row; D12
   defines skipped/partial omission across every surface.)*
4. **Marker shape.** D12's `malformed` array and `adventure_drift` lacked the
   literal `[malformed-adventure]` / `[adventure-drift]` markers T208/T209 and
   the REQs require. *(Resolved: both literals are carried as `flag` fields.)*
5. **Surface budget.** `scripts/surface-budget.ts:24-27,169-179` reads
   `holonovel/DECISIONS.md`; the description edit moves the footprint and
   `--write` does not refresh the DECISIONS lines. *(Resolved: the DECISIONS
   budget refresh and `spec/audit/tool-surface-baseline.json` are named.)*
6. **Overview warning.** REQ-248b requires the raw slug; the plan dropped it
   while claiming exact wording. *(Resolved: `for '<slug>'` retained and
   asserted.)*

## Majors

- Installed modules have no build index entry. *(Resolved: `source:
  "installed"` with a startup hash, excluded from drift comparison.)*
- `--input` output placement was unspecified. *(Resolved: `--input`/`--out`/
  `--decisions` split.)*
- Generated adventures had no anchor-resource mapping. *(Resolved: `overview`,
  `hook`, `world`, `location-<n>`; T146 asserts `/generated/hook`.)*
- D3 pre-population unreachable on the `[world-preserved]` branch. *(Resolved:
  one helper on all three branches.)*
- `player_visible` has no carrier. *(Resolved: front-matter block, same block
  `parseAdventureProvenance` reads.)*
- The spatial-premise gate was always true. *(Resolved: keyword set only.)*
- The no-World load path kept the old synthesis wording. *(Resolved: shared
  renderer on both branches.)*
- `adventures://` Player visibility was unassigned. *(Resolved: same rule as
  the catalog.)*
- T283's "non-conforming" vs "malformed" vocabulary was ambiguous. *(Resolved:
  malformed means the three required conventions; raw prose is not malformed.)*
- Rejected alternatives were recorded only for D1. *(Resolved: D6, D7, D10,
  D11, D12 now carry alternatives.)*
- Red-first counted a missing binary as evidence. *(Resolved: tool first, then
  red observation before server wiring.)*

## Minors / Nits

- Predicate offsets `:10986`, `:11251`, `:14146`, `:11221` were off by one or
  two. *(Resolved.)*
- `adventure_scene_waypoint` is typed as an object but used as a string.
  *(Resolved: D9 corrects the type.)*
- D4's overview fallback was self-contradictory. *(Resolved.)*
- `player`-tag synthesis items were called inert. *(Resolved: excluded from the
  community prompt.)*
- Baseline values are not in the evidence sidecar. *(Accepted; they are
  session state, reproduced by `npm run status` and `npm run check:fast`.)*

## Verified positives

Predicate anchors for all twelve findings, the reused Appendix F IDs, the test
homes and npm scripts, `spec/04-runtime.md:149,177`, Appendix K/O.10, SDK
template resolution, codex atomicity, cleanliness-gate allowance, and the
`[No adventure modules found.]` consumer set all resolve as the plan states.

## Binding and verdict chain

Plan sha256 reviewed by the cold pass: `4b9205923ab2c82f7cdafb81ddea90ed66672a0deaffa92a88a3951efe3b466c`
Bound artifact (final revision, including the C-1 amendment):

Plan sha256: be3f4d00300e6f1efe72b84f7c8ecf9628c1311318b5c598201171d2c65e0f47
Diff re-review (standard cap, 10 reads): five of six Blockers and ten of
eleven Majors resolved; the remaining Major (the `player_visible` carrier)
was amended after the cap as condition C-1 and verified during execution
(`src/core/adventure-provenance.ts` untouched; T207/T338 exercise the
Player-visible and GM-only branches; T734/T740 stay green). No further cold
pass was run at the standard-depth cap.
