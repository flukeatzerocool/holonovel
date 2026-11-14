# Tasks — §5.3 prompt-health and resource-presence depth

Dependency order: T0 → T1 → T2 → T3 → T4 → T5 → (T6, T7 in any order) → T8.
Each task names the file and the verification that closes it. Line numbers are
HEAD anchors, not edit targets.

## T0 — Probe the existing prompt corpus (false-positive budget)

- Throwaway `tsx` probe (not committed) over the six rendered host bodies:
  enumerate every `manage_/resolve_/run_/set_/open_/close_/take_/respond_`
  token and every resource-scheme URI; classify each against
  `registeredToolMap()` keys and the live resource maps as live / tombstone /
  absent / user-data. Paste the classification into the AAR.
- Probe the starter Novel's name and description for a verb-prefix token (the
  D2b case) and record whether the exclusion is needed for the shipped state.
- Close: zero unexpected `absent` tokens, or a recorded decision to fix the
  prompt source or widen the grammar. Discovery gate; produces no committed
  file.

## T1 — Renderer wrapper (sole budget owner)

- `holonovel/src/index.ts` — add `renderHostPromptText(name, opts)` returning
  `{ source, served }` over the six existing composers (`composeIntro`,
  `composeBadgeBriefing(novel, { mutate })`, `composeNarrationClearance`,
  `composeSessionZero`, `composeNovelSetup`, `composeRunWorkflow`).
  `opts` is `{ mutate?: boolean }`. The wrapper also takes over the per-prompt
  input assembly the handlers hold today (intro library lines, the active
  Novel, narrate's two literal branches, roster count, adventure index, step
  marks, badge-filtered tool names). The wrapper is the only caller of
  `applyPromptBudget` on the prompt path:
  `served = applyPromptBudget(source)` for the four budgeted prompts;
  `source === served` for `badge_briefing` and `narrate`. The six
  `server.prompt` handlers consume `.served` and remove their own
  `applyPromptBudget` call.
- Do not edit `holonovel/src/core/prompt-composition.ts`.
- Close: `npm --prefix holonovel run test:output-contracts` green for the
  prompt tests (T22/T124/T152/T155/T453).

## T2 — Report real `prompt_health` fields

- `holonovel/src/index.ts:14641-14663` — `{ name, present, presence, length,
  budget, within, stale_references }` for host and package entries; `length`
  from `served`, `within` from `briefingBudget()`, `stale_references` from
  `source` (empty for now).
- Close: existing T152 shape leg passes with the new fields present.

## T3 — Implement the stale-reference detector

- `holonovel/src/index.ts` — `staleReferencesFor(text, registeredTools,
  liveUris, userText)` per D2/D2a/D2b/D3: verb-prefix tool grammar plus live
  package tool names; resource-scheme URIs with the per-call scheme set;
  parameter-aware template matching; drop tokens inside `userText`; sorted
  unique output; compare against registered names (hidden tombstones count as
  present).
- Add `userAuthoredText()`: stored Novels' names and descriptions, the active
  Novel's scene text, lore/NPC/room/thing/entity names and descriptions, story
  entries, notes, GM-context strings.
- Share one resource-URI collector with T4; do not walk the maps twice.
- Close: the T0 probe re-run reports `[]` for all six host prompts, and a
  package prompt naming an unregistered name reports it.

## T4 — Derive `resource_uris` and `resource_count` from the live map

- `holonovel/src/index.ts:14627-14637`, `:14608` — `resourceURIReport()`:
  drawn set = REQ-022 catalog ∪ every installed package's
  `rulesets.resourceDeclarations(slug)` ∪ the live fixed and template maps;
  presence from `_registeredResources` + `_registeredResourceTemplates`, with
  `pkg:<slug>:<name>` registrations counting only while the slug is installed;
  entries `{ uri, title, presence, name?, mime_type? }` in catalog-then-sorted
  order; `resource_count` = the entries whose presence is `present`.
- Close: health shows template entries as `present` (they are absent under the
  old code), live-only host entries appear, `resource_count` equals the
  present-entry count.

## T5 — Catalog, count, and resource deregistration

- `holonovel/src/index.ts:18355-18363`, `:18381` — `canonicalToolCatalog(tools)`
  (`stripHiddenCatalog` + `packageToolVisible`) in both the warm-up and the
  request handler.
- `holonovel/src/index.ts:14606` — `visibleToolCount` applies
  `packageToolVisible`.
- `holonovel/src/index.ts:2588-2609` — keep the `registerResource` handle per
  package slug; on `manage_ruleset (action: remove)` call `handle.remove()` for
  each and delete the slug's `packageResourceKeys` entries so a reinstall
  re-registers cleanly; correct the comment to state the tool/resource
  asymmetry.
- `holonovel/src/index.ts:1428-1436` — append the sorted
  `rulesets.installedSlugs()` to `registrationFingerprint`.
- `holonovel/src/index.ts:13956-13961` — `sendToolListChanged()` beside the
  existing prompt signal.
- Close: `npm --prefix holonovel run test:tool-surface` and
  `test:security` green; a manual install→remove→install cycle serves the
  package resource again.

## T6 — Assert the prompt and resource lifecycles (T152+T153 block)

- `holonovel/scripts/test-output-contracts.ts:595-611` — extend the block:
  - every host prompt reports `presence`, non-zero `length`, a `within` flag
    (`true` for the four budgeted prompts; `badge_briefing` may report
    `exceeded` because its footer is never truncated), and an empty
    `stale_references`; two consecutive health reads return identical
    `prompt_health`;
  - install a package whose prompt names an unregistered name → the entry lists
    it; install a second whose prompt names `manage_context` → that entry is
    `[]`;
  - create a Novel whose *name* contains a verb-prefix token → its host
    prompts stay `[]` (D2b). If `manage_novel (action: create)` normalizes the
    name, use the description field instead, which `intro` renders verbatim;
  - a Player-badge read reports the same empty lists;
  - every REQ-022 catalog template is listed with `presence`; each present
    entry carries `name` and `mime_type`; live-only host entries outside the
    catalog are listed (`holonovel://tool-groups` and
    `ruleset://{slug}/{anchor}` as present);
  - install a package declaring two resources that share a `name` and differ in
    URI → the first is `present` with `name`/`mime_type`, the second is
    `absent`;
  - remove the package → both entries leave the report.
- Reuse the T453 synthetic-package shape (`:2476-2500`) for manifests.
- Close: `npm --prefix holonovel run test:output-contracts` → `0 failed`.

## T7 — Assert the removed-tool leg (T453 block)

- `holonovel/scripts/test-output-contracts.ts:2476-2512` — after
  `manage_ruleset (action: remove)`, `tools/list` with `params._meta.scope`
  `all` contains neither the package tool nor its slug prefix, and
  `spec_health.tool_count` drops by the package's tool count.
- Close: same harness run.

## T8 — Reconcile the spec and close the bookkeeping

- `spec/02-requirements.md:826` (REQ-138b) and `:833-836` (REQ-139
  acceptance) — reword the two acceptance sentences per D9. Record each
  paragraph's before/after character and sentence counts in the AAR;
  `npm run validate -- --sdd-strict` is the authority on shape limits
  (one paragraph, no bullets, 800-char/8-sentence caps).
- `spec/appendices-reference.md:1654-1655` — align the T152 and T153 rows to
  the implemented lifecycles; keep the REQ citations.
- `holonovel/DECISIONS.md` — one entry: the detection grammar, user-data
  exclusion, registered-vs-visible distinction (tombstones are not stale),
  source-vs-served text, declared-set presence, and the rejected
  deregistration alternative.
- `spec/audit/review-register.md` — F-P2-5 and F-P2-6 → `Resolved` with
  evidence; add the `Closed-P3` row for `convergence_summary.prompt_health`
  (Appendix F T167).
- `ROADMAP.md` — delete the *§5.3 prompt-health and resource-presence depth*
  section (next P1 is *Player narrative threads*).
- `npm run assemble`; `CHANGELOG.md` dated entry; `aar.md`;
  `npm run session:close`.
- Close: `npm run check:fast`, `check-registers`, `check-roadmap`,
  `check-loop-artifacts` green after `aar.md`.

## Split limits

One spec increment, one commit: the source change, the two harness blocks, and
the spec/register/roadmap reconciliation are one coherent change group. Rollback
is a single revert; no part is split into its own commit.
