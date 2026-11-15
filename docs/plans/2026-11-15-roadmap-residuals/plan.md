# Plan — Roadmap residuals: vendor provenance, faction secrets, harness label hygiene

Status: draft v3 (cold pass → v2, targeted resolution pass → v3; findings B1, M1–M5,
m1–m6 applied, plus Nit-1 after the pass) · Kind: planned · Depth: standard
Increment target: `docs/plans/2026-11-15-roadmap-residuals/`
Rollback cost: 1 (three reversible commits, each independently revertible; the register and
roadmap edits ride with the commit they belong to)
Evidence class: repo (`file:line` at HEAD `e8c79d1`) and tool output (gate runs in this
session). No web, user, or third-party content enters this plan.
Trust boundary: repo and local tool output only.
Review independence: fresh — cold pass `/tmp/opencode/cold-review-report.md` (verdict FAILED
on B1 plus M1–M5, all applied in v2), resolution pass
`/tmp/opencode/cold-review-confirm.md` (verdict passed; no prior finding unresolved, no
v2-introduced regression). The stamp records the artifact path and hash of the resolution
pass. Condition: Nit-1 (the illustrative `(build-time)` row count) was corrected after the
pass and is non-behavioural.
Preflight evidence: generated beside the plan artifact before review.

## Why

`ROADMAP.md` carries four open sections. One is date-gated (2026-11-28) and cannot be
worked this session. The other three are scheduled, evidenced findings that close in one
session, and each is a *conformance* gap rather than new design:

1. **Vendor-manifest provenance (P1, U7-F4).** Appendix U's admission rule (c) requires a
   `source_url` in the synthesis manifest; the manifest has no URL column at all.
2. **Faction knowledge on secrets (P2, U6-F5 residual).** REQ-234c already requires
   `manage_lore (action: reveal|knowledge)` to accept faction identifiers and
   `faction://<id>` to surface faction-known secrets. The server rejects every faction id,
   so §11.2 rule 6's shared-secret tension branch is implemented but unreachable.
3. **Harness test-ID label hygiene (P2, F-P2-4).** One comment names a zero-padded `T056`
   that Appendix F does not define. The padding detector exists but scans only test titles,
   so the class can recur silently.

## Scope

In scope: the manifest column and its gate, the faction branch of the secrets surface, the
mislabeled comment plus a comment-token detector, the two REQ-part amendments these
contracts need, the register restructuring the three closures require, and the
ROADMAP/CHANGELOG updates.

Non-goals: the date-gated fix-up re-measurement (2026-11-28); REQ-234b's suspicious-
relationship recommendation and REQ-234d's rival recommendation (scheduled as a new P1
roadmap item, not built); any change to §11.2's eight synthesis rules; any new tool,
action, or resource.

## Evidence

All reads at HEAD `e8c79d1`; the baseline gate run is `check:fast` → 45 passed, 0 failed.

| ID | Claim | Predicate |
|---|---|---|
| EV1 | The padded label is real and uncaught. | `holonovel/scripts/test-narrative.ts:1205` carries `// ── T056/T723: …`; Appendix F defines no `T056` (`grep -c '| T056 ' spec/appendices-reference.md` → 0). |
| EV2 | The detector cannot see comments. | `scripts/lib/req-checks.ts:606-625` (`checkHarnessTitleIds`) consumes `titles` only, and `scripts/validate.ts:1544-1562` builds `titles` from `test("…")` names. The zero-pad branch is `:614`. |
| EV3 | The padded-token corpus is one file. | `grep -rnoE '\bT0[0-9]{2,3}\b' holonovel/scripts holonovel/src` → 1 hit, `test-narrative.ts:1205`. |
| EV4 | The manifest has no provenance column. | `holonovel/narrative_world_model/MANIFEST.md:19-45` — header at `:19` ends at `Verified`; `awk 'NR>=21 && NR<=45 && /^\| /' MANIFEST.md \| wc -l` → 25 data rows, 8 distinct `Source` cells; `grep -c http MANIFEST.md` → 0. |
| EV5 | The admission rule exists and is unenforced. | `spec/appendices-licenses.md:29` requires a `source_url` field "for those vendored rows". |
| EV6 | Every URL needed already exists in-repo. | `docs/licenses/ATTRIBUTION.md:16-23` carries the upstream link for all eight narrative-framework sources. |
| EV7 | The checker parses positionally, so a column must be placed deliberately. | `holonovel/scripts/check-vendor-manifest.ts:56-63` (`cells.length < 6`, destructure `[ , source, module, file, hash ]`). |
| EV8 | REQ-451 requires hashes only, and cannot absorb another sentence. | `spec/08-synthesis.md:411-412`; the body line measures 741 bytes against the 800-char limit (`scripts/validate.ts:191-196`). |
| EV9 | REQ-234a names five parameters and no `known_by`, and cannot absorb another sentence. | `spec/02-requirements.md:2918`; the body measures ~748 bytes including its newline against the same limit — about 52 chars of headroom. |
| EV10 | Faction reveal is already normative. | `spec/02-requirements.md:2924` (REQ-234c): `reveal` SHALL accept faction identifiers as `target_id`, `knowledge` SHALL accept them, and faction-known secrets SHALL surface at `faction://<id>` for the GM badge. |
| EV11 | The server refuses faction ids. | `holonovel/src/index.ts:9088` and `:9094` gate on `novel.entities.has(args.entity_id)` for both the lore and secret branches; `:9125` does the same for `knowledge`. Factions live in `novel.factions` (`src/core/state.ts:476-489`), not in `entities`. |
| EV12 | `faction://<id>` omits secrets. | `holonovel/src/index.ts:16064-16079` returns the faction record (or `factionProjection`) only. |
| EV13 | Rule 6's tension branch keys on faction ids. | `holonovel/src/core/synthesis.ts:365-375` filters `secret.known_by` against `factionNames`; `slug()` at `:76-81` maps every non-alphanumeric run to `-`, so the key is `novel-tension-secret-shared-pact`. |
| EV14 | The branch is unasserted because the fixture's reveals fail silently. | `holonovel/scripts/test-backfill.ts:2020-2022` reveals `shared_pact` to two faction ids; the harness helper returns the error text without asserting it, and the T789 expectation list at `:2084-2092` never names the `novel-tension-secret-` prefix. The T789 Appendix F row (`spec/appendices-reference.md:2146`) already claims the tension assertion, so the test, not the row, is what is out of line. |
| EV15 | The schema lacks the param and describes reveal as entity-only. | `holonovel/src/index.ts:8837-8852` (`MANAGE_LORE_SCHEMA`): no `known_by`; `entity_id` described as "Entity to reveal to / whose knowledge to read". |
| EV16 | REQ-234 is claimed covered by entity-only evidence. | `spec/audit/req-coverage.md:212` — bucket C, `T274, T406, T414`. |
| EV17 | The two recommendation clauses have no implementation. | REQ-234b (`spec/02-requirements.md:2921`) and REQ-234d (`:2927`) require relationship recommendations; the reveal path (`src/index.ts:9079-9123`) emits a world change and a perception record only, and `grep -n suspicious src/index.ts` yields disposition helpers at `:680` and `:1179`, no REQ-234b site. |
| EV18 | The register has no F-P2-4 bullet, and disposition comes from the `##` heading. | `spec/audit/review-register.md:54-64` (U8-F6) records that "no F-P2-4 bullet exists in any register bucket"; the residual is prose under `### 2026-11-09 full-review sweep — chunk P2` (`:3041-3054`), inside `## Scheduled-roadmap` (opened `:2972`). `scripts/lib/register-checks.ts:23-51` assigns disposition from the nearest `##` heading and `:53-70` checks only the heading. |
| EV19 | The U6 resolution bullets sit under the scheduling heading. | `spec/audit/review-register.md:3017-3032` (U6-F5) and the two preceding bullets say `Resolved 2026-11-15` while `## Scheduled-roadmap` (opened `:2972`) is still their section; the next disposition heading is `## Resolved — 2026-11-15 badge guidance resources` at `:3056`. |

## Decisions

- **D1 — new REQ parts instead of editing existing bodies.** REQ-234a is at ~748/800 bytes
  and REQ-451 at 741/800, so neither can absorb a provenance/parameter sentence. Add
  `REQ-234e` (secret `known_by` parameter) after REQ-234d and `REQ-451a` (manifest
  provenance) after REQ-451, each with its own `_Check:`. Rejected: compressing the
  existing bodies, which would delete contract text to buy space.
- **D2 — reuse existing test IDs.** `REQ-234e` binds to T274 and `REQ-451a` to T541, both
  already exercised; no new Appendix F row, so the assertion-miss baseline and the
  `test:all` command count stay put. T274's row text gains the faction assertions; the T789
  row already claims its assertion (EV14), so only the test changes there. The T274 test
  name gains a `REQ-234e` mention so the new part's evidence is attributable (T/S/I token
  count unchanged, so the over-stuffed-name check is unaffected).
- **D3 — the manifest column goes last, and the parser becomes header-indexed.** Placing
  `Source URL` after `Verified` keeps the existing eight columns in place; indexing by
  header name (EV7) means a future insertion cannot silently shift the hash column.
- **D4 — provenance validation is a positive shape check over all 25 rows.** Each row must
  carry an absolute `https://` URL; the gate reports `NOURL`/`BADURL` per row and fails
  under `--strict`. Rejected: cross-validating against `docs/licenses/ATTRIBUTION.md`,
  which couples the server-side gate to a repo-root docs file outside the server package.
- **D5 — faction recipients are validated against `novel.factions` alongside `entities`.** A
  reveal to a faction records the world change (REQ-233a1) but writes no perception record:
  REQ-595's ledger is entity-scoped and a faction has no perception stream. Recorded as an
  explicit comment at the skip site.
- **D6 — `known_by` is a write-time convenience, not a second source of truth.** It is
  stored on the secret exactly as `reveal` would store it, so rule 6 needs no change and
  `secret_list`/`knowledge` read the same field.
- **D7 — the padding detector extends to comment tokens, not all tokens.** Only the
  zero-padded branch runs over comments; the "resolves to Appendix F" branch stays
  title-only, because comments legitimately name rows in prose (e.g. `T274/T723`).
- **D8 — REQ-234b/234d are scheduled, not built.** They are normative, unimplemented, and
  outside this bar (EV17). They get a dated ROADMAP section naming both REQ ids and a
  `Scheduled-roadmap` register row.
- **D9 — the two spec additions carry their mechanical consequences.** `REQ-234e` needs no
  §5 section-map edit: `spec/02-requirements.md:16` lists base `234`, which covers its
  parts, and the map checker keys on the base (`scripts/validate.ts:1225-1249`). The
  coverage register is regenerated (`validate -- --write-register`), the REQ index rows are
  added (`spec/appendices-reference.md:803`, `:1189`), and `npm run build-order` refreshes
  any fingerprint the §5.8/§11.4 text feeds. `REQ-451a` inherits base `451`, already in
  `INTENDED_GAP_REQS` (`scripts/validate.ts:1969-1971`), so it lands bucket E without a
  whitelist edit; `REQ-234e` lands bucket C with T274's prefix. No behavioral configuration
  is added.
- **D10 — the harness file text is read once, by the existing collector.** Phase A extends
  the `collectHarnessTestNames` pass into a collector that returns each file's text beside
  its test names, so the comment scan reuses the same read. Rejected: a second read loop,
  which `check-script-quality` (C3, repeated parses) exists to catch.
- **D11 — closures move the finding, they do not annotate it.** `check-registers` derives a
  finding's disposition from its `##` heading (EV18), so every closure relocates the bullet
  into a dated `## Resolved` section and rewrites the prose that points at a roadmap
  section being removed. `F-P2-4` gets a real bullet for the first time (EV18).

## Phases

### Phase A — harness label hygiene (small)

Commit `2026-11-15 — Harness labels: the padded ID goes, and comments are scanned`.

1. `scripts/lib/req-checks.ts` — add and export `checkHarnessCommentIds(files: {file, text}[])`,
   reusing the `^T0\d\d` predicate at `:614`.
2. `scripts/validate.ts` — extend the `collectHarnessTestNames` pass (`:1544-1562`) into a
   collector that also returns each file's text (D10); call `checkHarnessCommentIds` beside
   the title-ID check at `:2607`, with a PASS line "No zero-padded test ID in a harness
   comment"; a finding is an error under `--sdd-strict`, a warning otherwise, matching the
   title-ID policy at `:2607-2614`.
3. **Dry run before the fix.** `npm run validate:fast` on the unfixed tree → exactly one
   error naming `holonovel/scripts/test-narrative.ts:1205` and `T056`. Recorded in the
   CHANGELOG entry. This is the gate's proof against the real defect class, not a synthetic
   self-test.
4. `scripts/test-req-checks.ts` — self-tests: a padded comment token is reported, a real
   `T723`/`T274` pair is not, and a padded *title* ID still routes through the title
   detector.
5. `holonovel/scripts/test-narrative.ts:1205` — `T056/T723` → `T56/T723`.
6. `spec/audit/review-register.md` — author `- **F-P2-4 — the harness comment named a
   zero-padded test ID. Resolved (2026-11-15).** …` as a bullet in a new
   `## Resolved — 2026-11-15 roadmap residuals` section, citing
   `holonovel/scripts/test-narrative.ts:1205` and the new detector; record the corpus grep
   result (EV3: one hit, now zero) in the bullet. Rewrite the chunk-P2 preamble
   (`:3041-3047`) to point at that bullet, and rewrite U8-F6's closing sentence
   (`:60-64`) so it no longer points at the roadmap section Phase A removes.
7. `ROADMAP.md` — remove § *Harness test-ID label hygiene (P2)*.
8. `CHANGELOG.md` — dated entry carrying the dry-run finding, the grep result, and the
   detector.

Gate for A: `npm run check:fast` (45 passed, 0 failed); `grep -rnoE '\bT0[0-9]{2,3}\b'
holonovel/scripts holonovel/src` → no hits.

### Phase B — vendor-manifest provenance (medium)

Commit `2026-11-15 — Vendor provenance: the manifest carries the URL Appendix U admits it by`.

1. `spec/08-synthesis.md` — new `REQ-451a` after `:412`: the manifest SHALL carry a
   `source_url` for every vendored module row, each an absolute `https://` URL, and the
   checker SHALL report and (under `--strict`) fail a row without one. `_Check:_ T541.`
2. `spec/appendices-reference.md` — extend the T541 row (`:1970`) to state the provenance
   assertion; add the `REQ-451a` index row (`:1189`).
3. `holonovel/narrative_world_model/MANIFEST.md:19-45` — add the `Source URL` column after
   `Verified` and fill **all 25 data rows** (EV4), URLs from
   `docs/licenses/ATTRIBUTION.md:16-23` (eight distinct sources).
4. `holonovel/scripts/check-vendor-manifest.ts` — header-indexed cell lookup; parse every
   data row into `{source, module, file, hash, url}`; run the provenance check over **all
   25 parsed rows before** the `(build-time)` hash skip at `:61`; keep the hash loop
   unchanged; usage/exit-code header states the new failing class.
5. **Negative probe, in place.** With the tracked manifest as the subject (the script
   resolves `MANIFEST.md` from `import.meta.dirname` at `:22-24`, so a scratch copy cannot
   exercise it): back up the file, blank one row's URL with `sed`, run
   `npm --prefix holonovel run check:vendor` → expect exit 1 naming that row; restore with
   `git checkout -- holonovel/narrative_world_model/MANIFEST.md`; `git diff --exit-code`
   proves the tree is clean; re-run for exit 0.
6. `spec/audit/review-register.md` — move the whole
   `### 2026-11-15 U7 reference appendices and registries — vendor-manifest provenance`
   subsection out of `## Scheduled-roadmap` into the dated `## Resolved` section, rewriting
   its opening sentence (which schedules the work) to name the closing increment and the
   column.
7. `ROADMAP.md` — remove § *Vendor-manifest source provenance (P1)*. `CHANGELOG.md` —
   dated entry.

Gate for B: `npm run assemble && npm run check:fast` (validate, lint,
`check-vendor-manifest`, `check-registers`, `check-roadmap`), plus the step-5 probe.

### Phase C — faction knowledge on secrets (medium)

Commit `2026-11-15 — Secret holders: factions reveal, know, and surface at faction://`.

1. `holonovel/src/index.ts:8837-8852` — `MANAGE_LORE_SCHEMA`: add `known_by`
   (`z.array(z.string()).optional()`, described as entity or faction ids, set_secret only);
   reword `entity_id` to "Entity or faction id to reveal to / whose knowledge to read".
2. `:9071-9077` `set_secret` — accept `args.known_by ?? []`, resolve every id against
   `novel.entities` then `novel.factions`, return `[NOT_FOUND]` naming the first unknown id.
3. `:9079-9123` `reveal` — resolve `target_id` across entities and factions; keep the lore
   branch entity-only (REQ-083d/083f is entity-scoped); for a faction holder enqueue the
   world change and skip the perception record per D5.
4. `:9125` `knowledge` — accept a faction id and return the secrets its `known_by` carries.
5. `:16064-16079` `faction://{id}` — for the GM badge only, append the faction-known
   secrets (`key`, `badge_scope`, `known_by`) to the payload; the Player/Observer projection
   is unchanged.
6. `spec/02-requirements.md` — new `REQ-234e` after `:2927` naming the `known_by` parameter;
   `spec/appendices-reference.md:803` — `REQ-234e` index row; `:1741` — extend T274's row
   text with the faction reveal/knowledge assertions.
7. `holonovel/scripts/test-narrative.ts:1165-1180` — T274 gains: two factions, one secret
   revealed to both (asserting the reveal succeeded, not just that it returned), a
   `knowledge` read for one faction id, a non-holder faction that does not know it, and a
   `faction://<id>` GM read carrying the secret plus a Player read that does not; the test
   name gains a `REQ-234e` mention.
8. `holonovel/scripts/test-backfill.ts` — assert both reveals succeed (`:2021-2022`); add
   `["rule 6 shared-secret tension", "novel-tension-secret-"]` to the T789 expectation list
   (`:2084-2092`). No Appendix F row edit (EV14).
9. Regeneration, in order: `npm run assemble` (the host boots against the assembled spec) →
   `npx tsx holonovel/scripts/generate-tool-definitions.ts` (writes
   `holonovel/tool-definitions.json`; `tool-surface-registry.json` is read, not rewritten,
   and no tool/action/resource changes) → `npm run surface-budget -- --write` (records
   `spec/audit/tool-surface-baseline.json` and the DECISIONS budget line) →
   `npm run validate -- --write-register` → `npm run build-order` (fingerprints; CalVer
   no-op at the current version).
10. `spec/audit/review-register.md` — move the whole
    `### 2026-11-15 U6 synthesis and fixtures — internal synthesis gaps` subsection
    (F3, F4, F5) out of `## Scheduled-roadmap` into the dated `## Resolved` section (EV19),
    and rewrite F5's residual paragraph to state that the tool surface now accepts faction
    ids and that T789 asserts the tension branch. Add a `Scheduled-roadmap` row for
    REQ-234b/REQ-234d naming the new roadmap section.
11. `ROADMAP.md` — remove § *Faction knowledge on secrets (P2)*; add § *Secret relationship
    recommendations (P1)* whose bullet names **REQ-234b** and **REQ-234d** literally (so
    `check-registers` can resolve the scheduled row) and whose `**Trigger:**` names the
    next lore-surface session. `CHANGELOG.md` — dated entry.
12. `docs/plans/2026-11-15-roadmap-residuals/` — `plan.md` and `tasks.md` land with this
    commit; `aar.md` is written before the close commit.

Gate for C: `npm run assemble && npm run check:fast`; `npm --prefix holonovel run test:all`
(56 commands, including `test-narrative` and `test-backfill`); `npm run check-anchors`
(index.ts edits move anchors); `check-tool-definitions-sync`, `surface-budget`,
`check-tool-surface` after regeneration; `HOLONOVEL_IMPL_STRICT=1 npm run validate`.

## Blast radius

| File | Phase | Size | Change |
|---|---|---|---|
| `scripts/lib/req-checks.ts` | A | S | comment-token detector |
| `scripts/validate.ts` | A | S | collector returns text; call site + PASS line |
| `scripts/test-req-checks.ts` | A | S | detector self-tests |
| `holonovel/scripts/test-narrative.ts` | A, C | S | label fix (`:1205`); T274 faction assertions (`:1165-1180`) |
| `spec/audit/review-register.md` | A, B, C | M | new Resolved section; F-P2-4 bullet; U7 and U6 subsections relocated; prose pointers rewritten; one new scheduled row |
| `ROADMAP.md` | A, B, C | S | three sections removed, one added |
| `spec/08-synthesis.md` | B | S | `REQ-451a` |
| `spec/appendices-reference.md` | B, C | S | T541/T274 row text; `REQ-451a` and `REQ-234e` index rows |
| `holonovel/narrative_world_model/MANIFEST.md` | B | M | 25 rows gain a URL |
| `holonovel/scripts/check-vendor-manifest.ts` | B | M | header-indexed parse; all-row provenance |
| `spec/02-requirements.md` | C | S | `REQ-234e` |
| `holonovel/src/index.ts` | C | M | schema, set_secret, reveal, knowledge, faction:// |
| `holonovel/scripts/test-backfill.ts` | C | S | T789 fixture assertions |
| `holonovel/tool-definitions.json` | C | M | regenerated |
| `spec/audit/tool-surface-baseline.json` | C | S | `--write` |
| `spec/audit/req-coverage.md` | C | M | `--write-register` |
| `holonovel/DECISIONS.md` | C | S | budget line if the footprint moved |
| `CHANGELOG.md` | A, B, C | S | three dated entries |
| `docs/plans/2026-11-15-roadmap-residuals/{plan,tasks,aar}.md` | all | S | increment artifacts |

Unchanged and checked: `holonovel/tool-surface-registry.json` and
`tool-disambiguation.json` (the generator reads the registry; no tool, action, or resource
is added), `holonovel/AGENTS.md` surface counts, the §5 section map, the DECISIONS gate
classification table.

## Done bar

- Phase A: the detector reports `T056` on the unfixed tree and nothing after the fix; zero
  `\bT0\d{2,3}\b` matches under `holonovel/scripts` and `holonovel/src`; F-P2-4 exists as a
  bullet under a `## Resolved` heading.
- Phase B: all 25 manifest rows carry an absolute `https://` URL; the checker fails a
  URL-less row and passes the restored tree; the U7 subsection is under `## Resolved`.
- Phase C: T274 asserts faction reveal, faction knowledge, the non-holder refusal, and
  `faction://<id>` scoping; T789 asserts the prefix `novel-tension-secret-` and the key
  `novel-tension-secret-shared-pact`; the U6 subsection is under `## Resolved` and F5's
  residual is closed.
- Session: `check:fast` 45/45 after each commit; `test:all` 56/56 and `check-anchors`
  current on the final tree; `ROADMAP.md` holds the date-gated section and the new
  REQ-234b/REQ-234d section only; `check-registers` and `check-roadmap` green; `aar.md` ends
  `LOOP PAUSED`.

## Risks and edge cases

- **Faction id collides with an entity id.** Resolution order is entities first, then
  factions, so a collision behaves as today for entities. Recorded in D5's comment.
- **A GM authors `known_by` with a typo.** The write refuses with `[NOT_FOUND]` naming the
  id before any save — no partial secret is stored.
- **The Player badge on `faction://{id}`.** Secrets are appended inside the `isGM` branch
  only, so `factionProjection` (REQ-233) is unchanged; T274 asserts the Player read.
- **A `(build-time)` row escapes the provenance check.** Today the `(build-time)` token
  appears only in the audited columns (`Items`, confidence tiers, `Term Anchoring`,
  `Verified`), never in `Content Hash`, so the `:61` skip bypasses no row — but it is the
  guard a future audited row would hide behind, so D4 and B.4 evaluate provenance on the
  parsed table before it.
- **The negative probe leaves a dirty tree.** B.5 restores with `git checkout --` and proves
  cleanliness with `git diff --exit-code` before the phase commit.
- **Register relocation strands a pointer.** Phase A rewrites U8-F6 and the chunk-P2
  preamble; Phase B and C rewrite their subsections' opening sentences, so no text points
  at a removed ROADMAP section.
- **Comment detector false positives.** Only the zero-padded branch runs over comments (D7),
  and EV3 shows exactly one such token, fixed in the same phase.
- **Regeneration order.** Tool definitions and the surface baseline read the live surface;
  `check-tool-definitions-sync` before the generator writes would report drift, so C.9's
  order is fixed.

## Verification

| Step | Command | Expected |
|---|---|---|
| Baseline | `npm run check:fast` | 45 passed, 0 failed |
| A dry run | `npm run validate:fast` before the label fix | 1 error naming `test-narrative.ts:1205` / `T056` |
| A | `npm run check:fast`; corpus grep | green; zero padded tokens |
| B | `npm run assemble && npm run check:fast` | green, `check-vendor-manifest` PASS over 25 rows |
| B negative | `npm --prefix holonovel run check:vendor` with one URL removed | exit 1, row named; restored tree exits 0 |
| C | `npm run assemble && npm run check:fast` | green |
| C suite | `npm --prefix holonovel run test:all` | 56 passed, 0 failed |
| C surface | `check-tool-definitions-sync`, `surface-budget`, `check-tool-surface` | PASS |
| C evidence | `HOLONOVEL_IMPL_STRICT=1 npm run validate` | REQ-234e bucket C, REQ-451a bucket E, 0 errors |
| Fingerprints | `npm run check-fingerprint-sync` | PASS after `build-order` |
| Anchors | `npm run check-anchors` | current |
| Close | `npm run session:close` | commits the final increment |

Unverified by design: the date-gated re-measurement (out of scope) and the REQ-234b/234d
clauses (scheduled, not built).

## Open questions

1. Should a faction reveal also seed a perception record for each member entity present in
   the scene? Deferred: REQ-595 scopes the ledger to entities, and no REQ requires fan-out.
   If the operator wants it, it is a separate REQ, not a silent extension here.
2. Should the manifest URL be cross-checked against `docs/licenses/ATTRIBUTION.md`? D4 says
   no; revisit if a URL drifts without the attribution table drifting.
3. Publishing: 110 commits are unpushed and the last publish is 2026-11-09. Not part of the
   done bar; the plan assumes the operator publishes before or after this session at their
   discretion.

## Amendments (execution deltas)

Recorded during execution; each is a deviation from the stamped plan, not a silent
improvisation. The stamped artifact (`plan_id 2026-11-15T22-19-45-356Z-fbf5dda8`)
does not contain this section, and does not need to: none of these changes a
deliverable, a gate, or a safety property.

- **A-1 — the negative probe restored from a backup, not `git checkout --`.** B.5
  said to restore the tracked manifest with `git checkout --`, which holds only when
  the file's Phase B edits are committed. They were not, so the first attempt
  reverted the whole column and the checker reported a fatal "missing 'source url'
  column". The probe was re-run with an explicit copy at
  `/tmp/opencode/MANIFEST.backup.md`; the same attempt also blanked the wrong line
  because the provenance paragraph shifted the table down six lines. Result is
  unchanged: `NOURL … line 27`, exit 1, restored exit 0.
- **A-2 — `scripts/validate.ts` gained a header-indexed manifest parse in Phase B.**
  The licence-source-parity check read manifest rows by a fixed cell count
  (`cells.length !== 12`), so the new column silently dropped all 25 rows and the
  gate reported every vendored directory as unlisted. Fixed in the same phase, by
  header name, matching the gate this increment was already teaching to be
  header-indexed. `scripts/validate.ts` was in the blast-radius table under Phase A;
  it is now also a Phase B file.
- **A-3 — `surface-budget --write` does not write the DECISIONS budget line.** The
  plan (C.9, D4 of the phase list) said it records the baseline *and* the DECISIONS
  line. It records `spec/audit/tool-surface-baseline.json` only; the header numbers
  in `holonovel/DECISIONS.md` are hand-authored and were updated by hand
  (29,865→29,902 full, 25,878→25,915 standard).
- **A-4 — generated artifacts regenerated outside the table.** `npm run assemble`
  rewrote `holonovel.md`, `holonovel/holonovel.md`, and `spec/build-phase-map.md`;
  the G7 attestation was regenerated twice (once per spec-editing phase) because it
  keys on the spec content hash; `npm run fix-anchors` repointed 13 evidence anchors
  after the `index.ts` edits. All are build outputs of steps the plan authorised
  (condition C-2), not new surfaces.
