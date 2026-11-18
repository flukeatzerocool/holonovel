# Cold independent review — codex pack as a fourth artifact kind

Reviewer: deepseek-v4.1-flash (cold review subagent, read-only)
Plan sha256: 0f9b32508cfd9f837c80be8d031c297313175f57850383eced8dfbce044171a7
Artifact: /home/fluke/Holonovel/docs/plans/2026-11-18-codex-pack-kind/plan.md
Companion: /home/fluke/Holonovel/docs/plans/2026-11-18-codex-pack-kind/tasks.md
Date: 2026-11-18
Stages: prepare, 1, 2, 3, 5, report (Stage 4 not applicable: no authoring edits during review)
Reads: 50 of 60 budget

independent-review FAILED. plan.md — 1 blocker

1. [clarity] Anchor-inventory claim, and the P1/T1 acceptance built on it, are false
   against the measured tree — plan.md:88-94 ("Nineteen anchors record
   holonovel/src/index.ts; two are at or below line 11321"), plan.md:262-264
   (P1 accept "exactly two anchors at or below 11321"), tasks.md:5-9 (T1 accept
   repeats it). The tree has 19 anchors; 18 are at or below 11321 — only
   holosuite-conformance.ts:37 (14784#prompt) is above. Correct set affected by
   the edits is exactly two, but they are the two at/after the first insertion
   (11321#inboxSourcePath, holosuite-adversarial.ts:34; 14784#prompt,
   holosuite-conformance.ts:37). Evidence of the other 17 at/below 11321:
   holosuite-invariants.ts:29,32,82,85; holosuite-conformance.ts:35,36,170,192;
   holosuite-adversarial.ts:31,32,35,36,38; holosuite-novel.ts:31,32,34,36.
   What must change: restate the inventory as "two anchors at or after the first
   insertion (>=11309, i.e. 11321 and 14784); every other anchor sits above it",
   and make P1/T1 accept that sentence. As written P1 — the phase that decides
   whether to continue — cannot pass.

Majors: 4

2. [clarity] T7 is unsatisfiable: "the REQ bodies copied from the plan's measured
   text" (tasks.md:40-41) but D6 carries only substitutions
   (plan.md:143-155). Re-derived: current REQ-620 body = 759 chars
   (spec/02-requirements.md:2562, through `_Check:_ T738.`), REQ-621 = 393
   (:2564); D6's deltas sum to about +32 and +299, i.e. ~791 and ~692, not the
   claimed 796. The sentence counts (7 / 6) cannot be checked at all because the
   final text is not in the artifact, and the 800-char limit
   (scripts/validate.ts:203-205) leaves under 10 characters of headroom on a
   claim that is asserted, not shown. V4's "warnings at or below the 303
   baseline" (plan.md:295) is likewise unverifiable from the artifact.
   What must change: paste the two final bodies verbatim into D6 (or a
   "Spec text" section) and measure the counts on that text.

3. [design] D5 (provenance "copied and shape-validated, not attested",
   plan.md:132-137) contradicts text the plan keeps. T739 retains "each verified
   by content hash and provenance" (spec/appendices-reference.md:2101) and D6
   only appends a codex sentence (plan.md:156-160); runbook V.10 step 3 retains
   "The host verifies the content hash and any declared provenance
   (REQ-096j, REQ-617, REQ-446)" (spec/appendices-runbooks.md:293-296) and the
   plan edits only the formats list, step 1, and step 4 (plan.md:165-168).
   After the edit both statements are false for the fourth kind.
   What must change: qualify "each"/"any declared provenance" in T739 and V.10
   step 3, or state that a codex pack's provenance is shape-checked only.

4. [design] D6 narrows the ROADMAP item without recording the deviation.
   ROADMAP.md:59-60 promises "a kind directory, a catalogue entry, and an
   admission assertion"; D6 rewrites REQ-620 to "discoverable through its kind
   catalog, and a codex pack through the registry's kind filter"
   (plan.md:146-148) and D11 retires the item as closed (plan.md:210-216). No
   decision or rejection records why the catalogue entry was dropped, and the
   carve-out inserts a kind-specific exception into a general contract.
   What must change: add the decision (a codex pack has no installed-pack
   catalogue from `manage_codex`, so the registry kind filter is its discovery
   surface) and note the ROADMAP bullet's supersession.

5. [design] The new durable surface `<DATA_DIR>/codex/` is missing from the two
   data-layout surfaces, while the plan edits their neighbours.
   spec/04-runtime.md:142 (the `TTRPG_DATA_DIR` row: "Novel(s), roster, codex,
   server notes, world-model data ... `<DATA_DIR>/rulesets/`") is where a new
   top-level data directory belongs, and D1's own justification ("`codex.json`
   is a file, not a directory, so there is no collision", plan.md:102-103) is
   exactly the ambiguity that row's bare "codex" now creates.
   holonovel/AGENTS.md State Model (~:243-258) enumerates the same layout. The
   blast radius names only 04-runtime.md:177 and AGENTS.md:125 (plan.md:230,233).
   What must change: add both rows (or state why the data-layout row needs no
   change) and disambiguate codex.json vs codex/.

Nits: 5

6. [clarity] "five code sites" does not match the enumeration. EV1
   (plan.md:33-41) names ArtifactKind, KIND_ORDER, buildArtifactRegistry,
   registryCounts and then four separate index.ts sites — eight locations — and
   omits `artifactDependencyError` (holonovel/src/index.ts:11332-11348), a kind
   dispatch on the remove path (:11545). It needs no codex branch today, but the
   "confirm no sixth site" baseline is not the list EV1 prints.

7. [clarity] P5's "then D8's ordered chain" (plan.md:278) and the risk row "D8
   fixes the order and names the emitter" (plan.md:333) point at D8, which fixes
   only description wording (plan.md:180-184). The order lives in V5 and T8
   (plan.md:296; tasks.md:45-50), and those two lists differ (V5 has no
   `build-order`; T8 has no standalone `check-g7-attestation` /
   `check-fingerprint-sync`).

8. [design] D3 hashes the entry array by position ("entries left in payload
   order", plan.md:114-121). Two hosts holding equal entries in different order
   get different `content_hash` values, which sits uneasily with REQ-620's
   "two installations holding the same artifacts report equal listings"
   (spec/02-requirements.md:2562) once T738's equality list gains codex-pack
   (plan.md:155-157). Sorting by id (REQ-321o already fixes export order,
   :2317) would close it.

9. [clarity] The budget note covers only `description_bytes`. D8's 965 -> 963 is
   arithmetically right (holonovel/tool-definitions.json:299 records 965; the
   swap is -2 chars) and the budget is per-tool description only
   (scripts/tool-definitions-lint.ts:113-114, value from DECISIONS.md
   `**Recorded description budget:**`, :83-84), but the `kind` enum and `source`
   text grow the surface footprint budgeted separately by `surface-budget`
   (plan.md:239,296). Say so explicitly.

10. [clarity] P1's discovery grep (plan.md:257-258) cannot find the branches the
    plan edits: `"novel" | "adventure" | "ruleset"` matches type unions, and
    `["novel", "adventure", "ruleset"]` matches KIND_ORDER
    (artifact-registry.ts:54) and the zod enum (index.ts:11356), but not
    `kind === "adventure"` (index.ts:11484, 11558) or the removal label
    (:11579). Add a `kind === "` alternative.

## Verified claims (assumptions challenged)

- No sixth union site in holonovel/src beyond the ones named: ArtifactKind
  (artifact-registry.ts:16), KIND_ORDER (:54), scan concatenation (:56-62,
  scans :66/:115/:156), registryCounts (:188-189), index.ts:11356/11401/11484/
  11510/11557-11579/12352. The only unlisted dispatch is
  artifactDependencyError (Nit 6).
- D10's mechanism is sound: refresh-predicates.ts:258
  (`inScope = declared && offsetPath === path && recorded >= fromLine`),
  :262-266 (a line already carrying the symbol short-circuits, so pass 2 leaves
  the rewritten 14784 alone), :326-330 (writes land before the exit), :382
  (exit 1 on unresolved); anchor-resolver.ts:79-84 (proximity is not evidence,
  so the two `inboxSourcePath` carriers at index.ts:11321 and :11397 force a
  declared offset). Only the inventory count is wrong (Blocker 1).
- Contract fingerprints do not move: scripts/lib/contract-fingerprint.ts:27
  (package: 5.16, 5.17, 6.3, 6.4.2) and :37-43 (data: 5.6, 5.9, 5.19,
  5.21-5.28, 5.31, 5.32, 7.7, Appendix Q); §5.7 starts at
  spec/02-requirements.md:2322 and ends before :2574, so REQ-620/621 are outside
  both lists.
- Description budget: source is DECISIONS.md's recorded line read by
  tool-definitions-lint.ts:83-84 and applied at :113; 965 confirmed at
  holonovel/tool-definitions.json:299; D8's replacement is 50 chars for 52 ->
  963 of 1000.
- Blast radius: every file a phase or decision names appears in the table, and
  every table row is reachable (README row justified: README.md:479 carries the
  only `@spec:` marker, `@spec:date`). `holonovel/tool-surface-registry.json`
  (:120-172), `tool-routing.json`, and `tool-disambiguation.json` record action
  metadata, not the kind enum, so omitting them is correct.
- Evidence line dates: HEAD is 77054a3, matching plan.md:5-7; the tree is clean
  except the untracked increment directory.

## Stage 2 comprehension (paraphrase)

Add `codex` as a fourth registry artifact kind so a `holonovel.codex/1` library
exported by `manage_codex (action: export)` can be installed from the exchange
inbox by `manage_artifact (action: install, kind: codex)`. The registry gains the
kind, a `<DATA_DIR>/codex/<slug>.json` scan/source, and a count; install
validates payload shape, hashes `{schema, entries}`, copies declared provenance,
refuses duplicate slugs and hash mismatches; remove deletes the file. The
1000-byte description is kept by word substitution; two index.ts evidence
anchors are repaired with two measured `refresh-predicates --offset` passes;
REQ-620/REQ-621, Appendix F T738/T739, the §4 glossary, the §7.6 inbox row,
runbook V.10, engine-contract §10, holonovel/AGENTS.md, DECISIONS, ROADMAP, and
the review register are edited. Done means the install/list/verify/remove/count
round-trip works, the five refusals fire, the derived artifacts are regenerated
green, `check-anchors` is current, one commit, and the AAR ends `LOOP PAUSED`.

Gaps a reader could not close from the artifact: the exact normative wording of
the two REQ bodies; the true anchor-inventory baseline; whether the removed
"catalogue entry" is intended.

## Unknowns

- Fresh-context staging was not satisfiable: nesting is forbidden in this
  session, so all stages ran in one cold context (plan and tasks read before any
  target file; no authoring conversation was supplied). Per-stage independence is
  therefore reduced; findings are evidence-backed, not context-shaped.
- Project instructions (repo AGENTS.md and holonovel/AGENTS.md) were injected by
  the host rather than handed by the dispatcher — recorded per the skill's
  context contract.
- The 303-warning baseline, `surface-budget` headroom, and
  `spec/audit/{req-coverage,evidence-linkage-baseline}` freshness were not
  re-run (they need the full gate; read-only budget).
- The plan-gate preflight sidecar was not regenerated (it writes state).

## Reads used

50 of 60 (read/grep/glob/shell-search): plan.md, tasks.md, AGENTS.md (injected),
holonovel/AGENTS.md (injected), docs/plans/README.md, docs/engine-contract.md,
ROADMAP.md, README.md, spec/{01a,02,04,appendices-reference,appendices-runbooks}.md,
spec/audit/review-register.md, holonovel/src/index.ts (11282-11414, 11470-11599,
12338-12363), holonovel/src/core/artifact-registry.ts, holonovel/src/core/state-hash.ts (grep),
holonovel/tool-definitions.json, holonovel/tool-surface-registry.json,
holonovel/scripts/lib/holosuite-{adversarial,conformance,invariants,novel}.ts (grep),
scripts/refresh-predicates.ts, scripts/lib/anchor-resolver.ts,
scripts/lib/contract-fingerprint.ts, scripts/validate.ts,
scripts/tool-definitions-lint.ts, scripts/lib/gate-manifest.ts (grep), package.json (grep).
