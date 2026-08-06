# Spec-engineering queue

Living tracker for subsystems that have not yet been reviewed through the
spec-engineering loop.

**Rules:** One item per line. Add to bottom of tier. Complete → delete. No
reordering mid-tier. Check for duplicates before adding.

**Add mid-session:** `@SPEC-QUEUE.md add: <item> to <tier>`
**Start next session:** `@SPEC-QUEUE.md next`

## Top candidates

1. Countdowns — set, advance, remove countdowns; round vs narrative types
   (REQ-073).
2. Voice & personality — set_personality, set_voice_examples fields
   (REQ-071, 077).
3. Player signals — player_signal for pace, difficulty, tone, focus, boundary
   (REQ-069).
4. Character creation workflow — step-by-step and quick modes,
   stats → race → class → background → name (REQ-104).
5. GM session notes — real-life session prep structure, common patterns,
   integration points with narrative state management.

## Tool-surface features

6. Session recap — session_recap summary output (REQ-072).
7. Help & discovery — help tool, tool discovery, task-map categories
   (REQ-067).
8. Random tables — roll_on_table across ruleset tables.
9. Macros — macro system (REQ-085).
10. Audit compression — compress_audit summarization (REQ-086).
11. Spec health reporting — spec_health output contract (REQ-025).

## Infrastructure / plumbing

12. Error taxonomy & output contracts — error codes, truncation,
    verbose/compact modes (REQ-002, 004, 060, 061).
13. Determinism & injection safety — RNG seeds, no-network-at-runtime, input
    sanitization (REQ-050-054).
14. Runtime conventions — entity IDs, output contracts, config surface, state
    model (§7.1-7.8).
15. Build process — intake questions, discovery, construction layers,
    convergence loop (§6.1-6.5).
16. Verification gates — Gate 0-5 design, Gate 2b (§8).
17. Artifacts & handoff — 4 artifacts, 12 checks (§9).
18. Independent verification — adversarial round (§10).
19. Six Novel property groups — structural review of NPC, Scene, Countdown,
    Lore, Enrichment, Adventure as architecturally coupled state tiers.
