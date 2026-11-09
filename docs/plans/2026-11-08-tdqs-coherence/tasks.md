# Tasks — Server coherence remediation (2026-11-08)

Base HEAD at execution: `a42f790` (the plan was drafted at `e59857f`).
Gate depth: standard. One spec-increment commit.

## Phase 0 — baseline

- [x] `git status --porcelain` clean at `a42f790` (C-1 resolved; the prior
  untracked draft is committed with its AAR).
- [x] `npm run check:fast` → 37/0 PASS, `check:fast: PASS`.

## Phase 1 — artifact + lint dry run

- [x] Add `meta` capture to `holonovel/scripts/generate-tool-definitions.ts`;
  bump artifact schema to 3.
- [x] Add the deprecated-tool rule and the `clusters.knowledge` rule to
  `scripts/tool-definitions-lint.ts`.
- [x] Dry run on the current tree → exactly 4 deprecated + 3 missing cluster
  axes (`manage_note`, `manage_codex`, `manage_synthesis`).

## Phase 2 — P1 + P2

- [x] Remove `_meta.deprecated` from `manage_world`, `manage_scene`,
  `manage_lore`, `manage_novel`; keep `manage_session`.
- [x] Remove `manage_novel`'s stale compatibility sentence and replace the
  `Do NOT use when` tail with a named sibling.
- [x] Drop the four originals' back-references to their split tools.
- [x] Extend `test-tool-surface.ts`: no listed tool is deprecated; all retired
  action aliases are absent and refuse with `[NOT_FOUND]`.
- [x] `test:tool-surface` → 13/0 PASS.

## Phase 3 — P3 + P6

- [x] Rewrite the seven knowledge/content opening sentences (axis first,
  within the 1000-byte and 3-sibling caps).
- [x] Add axes for `manage_note`, `manage_codex`, `manage_synthesis`; add the
  `knowledge` cluster declaration.
- [x] Add action-span suffixes to the eight widest `manage_*` titles (P6
  implemented as title spans to avoid the description byte cap; recorded as a
  delta in the AAR).
- [x] `tool-definitions-lint` → 0 violations.
- [x] `score:tools` → coherence proxy 3.8 (disambiguation 3, 10 mutual pairs).

## Phase 4 — P4

- [x] Add `manage_world (action: list|get)` with `requireGM()`, plus registry
  declarations in the `lookup` group.
- [x] Amend REQ-198 (one sentence; stays under 800 chars / 8 sentences).
- [x] Extend T241 and T511; `test:backfill` → 78/0 PASS.
- [x] `test:tool-definitions` → 17/0 PASS.
- [x] Regenerate `tool-definitions.json`; update DECISIONS budget to 242.

## Phase 5 — P5

- [x] `novelSnapshot()` on Novel note set/remove, corpus register/route/grant/
  deny/access, and causal mutations.
- [x] `test:persistence-guardrails` T10 → 13/0 PASS.

## Phase 6 — registers and docs

- [x] DECISIONS: budget line, surface budgets, D1–D7.
- [x] Review register: F1–F7 with predicates and dispositions.
- [x] `validate --write-register`; `assemble`.
- [x] `surface-budget --write` (canonical 242, compatibility 54).
- [x] `surface-replay --check` → 46 intents, precision 0.978.
- [x] CHANGELOG entry.
- [x] Increment plan/tasks/AAR.

## Phase 7 — gates

- [x] `npm run check:fast` → 37/0 PASS, exit 0.
- [x] `npm run check` → PASS, exit 0.
- [x] `npm run build-order` → complete, no stale fingerprint.
- [x] `session:close` → one commit (run at close).

## Deviations

- **D-1:** The plan said P6 would add the action span to the first sentence;
  five affected descriptions sit within 30 bytes of the 1000-byte cap, so the
  span moved to the `title` (no byte cap). Intent (visible multiplexing) is
  unchanged.
- **D-2:** The plan's `a42f790` delta note was added before execution; the
  line citations shifted +24 but the premises held.
