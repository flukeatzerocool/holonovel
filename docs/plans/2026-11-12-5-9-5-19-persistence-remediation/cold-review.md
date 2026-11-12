# Cold review record — §5.9/§5.19 persistence remediation

Plan sha256: 495c13dd4f94070011f1faf07e2059e6db9c27c4bfb00ae21ce3a7016a5ace60

Reviewer: `independent-review` skill, run in a fresh child session with no
authoring context (single context; Stage 4 not applicable — no artifact edit
mid-pass). Depth: standard.

## Pass 1 — FAILED (3 Blockers, 7 Majors, 8 Nits)

Artifact sha256: `61efb818b9d632f2ae1ed6cd3b7d42d5135a9fce5137dc76dd609499adb1ff1e`

Blockers:

1. REQ-400 names nine categories (eight omitted, base-capability already
   rendered), so T469's expected token set was undefined.
2. D6's premise ("uncommitted beats are the non-empty `gm_context` fields") is
   not the code predicate (`state.ts:2140-2148` is timestamp-only).
3. D2 specified no signature for `migrateNovelFormat`, no `migrated` plumbing,
   and no home for the field.

Majors: duplicate never-truncated list (M1); marker-array placement (M2);
"five tools" mismatch / `scene, action: set` (M3); undefined `chain_invalid`
marker (M4); untestable T471 criterion (M5); overstated T381 coverage (M6);
T88/T156 catalogue reuse (M7). Nits: four corruption sites, drift call-site
count, line anchors, T470 setup, shared recorder, register heading, Appendix T
citation, envelope-stamp classification.

## Pass 2 — passed (0 Blockers, 4 conditions, 5 soft flags)

Artifact sha256: `64cb6fdf7ac8f62ee0064c018be67125e605ec957671fc588751443069d5d50c`
Token: `independent-review passed. plan.md — 5/5 stages (Stage 4 n/a), 3 Blockers resolved`

Conditions (all folded into the plan text):

- C1 — the serializer must emit only the on-disk `novel_format_version` key.
- C2 — `saved_beats` must accumulate across the drift window, not overwrite.
- C3 — the widened T77 row needs a real `T77/REQ-092e` harness case.
- C4 — the new `gm_context` key must be added to REQ-232a's enumeration.

Soft flags folded: per-case file placement; `session_no_mutation_windows`
anchor (`state.ts:788`, `:2125`); T149/T640 budget precedent; one moment per
event.

## Condition-only amendment

Plan revised after pass 2 solely to fold C1–C4 and the soft flags (no new
files, gate, or destructive operation). Final plan sha256 recorded by the plan
gate stamp.
