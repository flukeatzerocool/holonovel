# Cold re-review (Diff Re-review) — codex pack as a fourth artifact kind

Reviewer: deepseek-v4.1-flash (cold review subagent, read-only)
Plan sha256: f723e480c4230ff231304f51efdc266222162a9031d94ea2feb371ee9b187a40
Tasks sha256: 3aecdf2c1f2cb2a13b0843aa6d5edd66edb738161743b94f6264fe48d49fa280
Prior pass: FAILED on sha256 0f9b3250…171a7 (1 blocker, 4 majors, 5 nits)
Protocol: plan-review Diff Re-review — changed regions only (the ten regions listed
by the dispatcher); no new-lens sweep; unchanged text deferred.
Reads: 5 of 10

independent-review passed. plan.md — 0 blockers

## Prior findings

1. BLOCKER — anchor inventory false (was plan.md:88-94, 262-264; tasks.md:5-9).
   **RESOLVED.** EV9 now reads "seventeen record a line earlier than 11321 and are
   untouched, and two record a line at or after it: :11321#inboxSourcePath and
   :14784#prompt" (plan.md:90-96); P1's accept demands the same split
   (plan.md:310-313); T1's accept matches (tasks.md:9-10). Verified against the
   tree: 19 anchors, 17 below 11321 (including 11294#share, above the first
   insertion), exactly 11321 and 14784 at or after it.
   Residual Nit R1: tasks.md:6-7 still instructs "confirm the anchor inventory
   still has exactly two `index.ts` anchors at or below line 11321" — the stale
   phrasing, two lines above the corrected accept. The accept governs
   (tasks.md:3), so this is wording, not a gate.

2. MAJOR — T7 unsatisfiable, no final REQ text (was tasks.md:40-41; D6 deltas).
   **RESOLVED.** Both bodies are pasted verbatim (plan.md:153-172). I re-derived
   the counts: joined with single spaces, REQ-620 measures 793 characters and
   REQ-621 689 by raw extraction, which is 796 and 692 under the plan's constant
   +3 convention — confirmed independently on the current bodies (raw 759/393 →
   762/396, matching plan.md:148-149). Both are under the 800-char limit
   (scripts/validate.ts:203-205) and under the 8-sentence limit
   (scripts/lib/req-checks.ts:589-596). The longest new sentence (REQ-621's
   opening clause, plan.md:165-168) counts 41 words, inside the cited 45.
   Citations check out: splitSentences at scripts/lib/parse-spec.ts:121 (plan
   cites :121-133), extractReqBodies used at scripts/validate.ts:202.
   Note: the 3→3 / 1→4 sentence counts come from a narrower splitter than a
   naive period split (a naive reading gives ~6 and ~2); both are far inside the
   limit, so the acceptance is safe either way.

3. MAJOR — D5 vs T739 / V.10 provenance wording.
   **PARTIALLY RESOLVED.** T739's cell is now "each verified by content hash, and
   by provenance where the kind declares a verifiable one" (plan.md:180-185) and
   V.10 step 3 gains "a codex pack's provenance is shape-checked, not attested"
   (plan.md:192-195). The normative body was not qualified — see NEW-1.

4. MAJOR — undocumented ROADMAP "catalogue entry" deviation.
   **RESOLVED.** The "Catalogue entry" paragraph (plan.md:205-209) states that
   ROADMAP.md:59-60 is satisfied by the registry entry rendered through
   `manage_artifact (action: list, kind: codex)`, and records the rejected
   `manage_codex (action: list)` alternative (REQ-321l partition).

5. MAJOR — new data surface missing from the layout docs.
   **RESOLVED.** §7.6's `TTRPG_DATA_DIR` row now disambiguates the library file
   from the pack directory (plan.md:189-191), `holonovel/AGENTS.md`'s State Model
   gains the artifact bullet (plan.md:200-204), and both blast-radius rows are
   updated (plan.md:277,280). The D1 "codex.json is a file" justification is now
   reflected in the row it depends on.

6. NIT — "five code sites" undercount (was plan.md:33-41). **RESOLVED.** EV1 now
   says "nine code sites" and names `artifactDependencyError`
   (index.ts:11332-11348). Count verified: ArtifactKind, KIND_ORDER,
   buildArtifactRegistry, registryCounts, kind enum, install branch,
   artifactDependencyError, removal label, spec_health = 9.

7. NIT — regeneration order attributed to D8 (was plan.md:278,333).
   **RESOLVED.** D8b (plan.md:224-231) fixes the order and the emitters;
   P5:327, V5:345, Risks:382 and Dependencies:392 all point at D8b. The chain
   matches AGENTS.md's checklist order, and placing `build-order` last (it
   re-runs assemble and the full check) is correct.

8. NIT — position-dependent hash. **RESOLVED.** D3 sorts a copy of `entries` by
   id before hashing, leaves the stored file in payload order, and T2's accept
   adds the different-order/same-hash probe (tasks.md:15-17). This closes the
   tension with REQ-620's equal-listing acceptance.

9. NIT — budget scope ambiguity. **RESOLVED.** D8 now separates the
   per-description budget (scripts/tool-definitions-lint.ts:83-84,113; 965→963)
   from the catalog footprint that D8b's `surface-budget -- --write` records.

10. NIT — P1 grep cannot see the branch dispatch. **RESOLVED.** P1 now greps
    broad literals and adds the manual pass over the install/remove branches for
    `kind ===` and the removal label, naming :11484, :11558, :11579
    (plan.md:303-313).

## New findings from the changed lines

NEW-1 (Major, design) — REQ-621's rewritten body keeps the unconditional
provenance promise the plan just qualified everywhere else.
plan.md:166-168: "…verify the kind's content hash and any declared provenance
before admission…". The same D6 amendment qualifies T739 ("where the kind
declares a verifiable one", plan.md:180-182) and V.10 step 3
(plan.md:192-195), and D5 states provenance is "copied and shape-validated, not
attested" (plan.md:136-143). The normative body still reads as a verification
obligation for a pack that has nothing to verify, and it is the clause the
T739 evidence row now contradicts. Fix: "…the kind's content hash and any
declared provenance the kind can verify…". Not blocking: an implementer can
land the text as pasted and the harness still passes; the inconsistency is
REQ-vs-test and invisible to `validate`.

RESIDUAL NIT R1 — see finding 1 (tasks.md:6-7 stale anchor phrasing).

## Deferred (unchanged text, per protocol; recorded, not scored)

- plan.md:278 still describes the runbook row as "V.10 exchange formats, steps 1
  and 4", while D6 now also edits step 3 (plan.md:192-195).
- plan.md:379 still describes the hash as `sha256(canonicalJson({schema,
  entries}))` without the D3 sort; the prose is defensible, the row is stale.
- plan.md:66 still says the kind set is spelled in "six spec and doc surfaces"
  while D6 now touches eleven surfaces (§7.6:142 and the AGENTS State Model
  bullet do not spell the kind set, so the sentence is loose rather than wrong).

## Verification done for this pass

- Plan and tasks hashes match the declared values.
- D6's eleven edits recount to eleven surfaces: REQ-620, REQ-621, T738, T739,
  §4 glossary, §7.6:177, §7.6:142, runbook V.10, engine-contract §10,
  AGENTS:125, AGENTS State Model.
- T738/T739 replacement anchors still match the tree
  (spec/appendices-reference.md:2100-2101), and the §7.6:142 row text absorbs
  the new clause.
- D8b's chain order checked against `build-order`'s documented behaviour
  (assemble + propagate + full check last).
- No new file or surface enters the blast radius; every changed decision still
  maps to a table row.

## Unknowns

- Same staging limitation as the first pass: one cold context, stages run
  sequentially (nesting forbidden in this session); the dispatcher supplied the
  change list, so this is a changed-region pass, not a fresh whole-document one.
- The 3→3 / 1→4 sentence counts were accepted on the strength of the verified
  splitter citation, not reproduced (the splitter's normalisation was not read).
- The "0 errors, warnings 303" validate:sdd run was not re-executed.
