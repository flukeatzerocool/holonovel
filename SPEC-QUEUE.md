# Spec-engineering queue

Living tracker for subsystems that have not yet been reviewed through the
spec-engineering loop.

**Rules:** One item per line. Add to bottom of tier. Complete → delete. No
reordering mid-tier. Check for duplicates before adding.

**Add mid-session:** `@SPEC-QUEUE.md add: <item> to <tier>`
**Start next session:** `@SPEC-QUEUE.md next`

## Major features

1. Lore subsystem — full lifecycle: create, trigger, group, suggest, toggle,
   export/import lore entries (REQ-083, App L).
2. NPC management — create, update, remove NPCs with stats, dispositions,
   locations (REQ-075).
3. Scene management — set_scene_state, set_scene_type, set_narrative_directive
   (REQ-076, 081, 087).
4. Decision/workflow system — respond/NEED_INPUT lifecycle, conflict
   resolution lifecycle (REQ-042, 043).

## Top candidates

5. Countdowns — set, advance, remove countdowns; round vs narrative types
   (REQ-073).
6. Voice & personality — set_personality, set_voice_examples fields
   (REQ-071, 077).
7. Player signals — player_signal for pace, difficulty, tone, focus, boundary
   (REQ-069).
8. Character creation workflow — step-by-step and quick modes,
   stats → race → class → background → name (REQ-104).

## Tool-surface features

9. Session recap — session_recap summary output (REQ-072).
10. Help & discovery — help tool, tool discovery, task-map categories
    (REQ-067).
11. Random tables — roll_on_table across ruleset tables.
12. Macros — macro system (REQ-085).
13. Audit compression — compress_audit summarization (REQ-086).
14. Spec health reporting — spec_health output contract (REQ-025).

## Infrastructure / plumbing

15. Error taxonomy & output contracts — error codes, truncation,
    verbose/compact modes (REQ-002, 004, 060, 061).
16. Undo/redo — snapshot stacks, dual-stack semantics (REQ-041, 116).
17. Audit log integrity — chained-hash, tamper evidence (REQ-040).
18. Determinism & injection safety — RNG seeds, no-network-at-runtime, input
    sanitization (REQ-050-054).
19. Runtime conventions — entity IDs, output contracts, config surface, state
    model (§7.1-7.8).
20. Build process — intake questions, discovery, construction layers,
    convergence loop (§6.1-6.5).
21. Verification gates — Gate 0-5 design, Gate 2b (§8).
22. Artifacts & handoff — 4 artifacts, 12 checks (§9).
23. Independent verification — adversarial round (§10).
