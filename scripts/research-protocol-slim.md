# Slim Research Protocol — Spec Queue v2

Condensed Phase 0-2 workflow for research sessions where spec bundles and
KB are pre-supplied. Assumes: bundle attached, KB pre-warmed. Skips
discovery, KB check, web calibration, and changelog traversal.

## Phase 0: Discovery

- Spec: `holonovel.md` at repo root
- Verify: `npm run check`
- Spec conventions: REQ blocks use `**REQ-NNN — Title.**` form, ending
  in `*Check:*` or `_Check:_`. Requirements state contracts, not
  implementations.
- Proceed directly to Phase 1.

## Phase 1: Research

1. **READ ATTACHED BUNDLE.** The bundle contains all relevant spec
   sections, changelog entries, and implementation references. If a
   bundle paragraph lacks context, read only that section of the spec —
   do not re-read the full document.

2. **CONSULT KB.** Check `.holonovel-state/knowledge-base/INDEX.md`
   for matching entries. KB freshness rules:
   - `web/` entries: fresh if ≤30 days (skip web search if today's
     `.web-recalibrated` marker exists)
   - `spec/` entries: fresh if stored git hash matches HEAD; if hash
     differs but REQ count unchanged, read `git diff` only
   - `implementation/` entries: fresh if ≤14 days

3. **HOLODECK REALITY AUDIT.** Before drafting the plan, answer:
   > *"If this subsystem were designed specifically to feel like a Holodeck
   > interaction, what would change? The Holodeck doesn't pause to ask
   > which stat you're rolling against — it interprets intent and resolves.
   > The world doesn't say 'NPC #7 updated' — the character acts differently.
   > The interface isn't a dashboard — it's the world itself."*
   See `KB/web/holodeck-episodes.md` for reference scenes.

4. **REFLEXION GATE.** Before proceeding:
   - Did I read the bundle and any necessary spec sections?
   - Does each weakness cite a concrete source?
   - Are there at least 3 actionable improvement areas?
   - Do recommendations state contracts, not implementations?
   - Did the Holodeck realism audit surface any spec gaps?
   - Did the plan address at least one persona quit moment (see
     `KB/web/failure-modes.md`)?

## Phase 2: Draft Plan

For each improvement:

```
### Change N: [one-line summary]
**File:** holonovel.md, after <anchor point>
**Prose:**
    [exact new REQ block or edit text]
**Manifest:** add REQ-XXX to Appendix E
**Test:** add TN to Appendix F "<section>"
```

Before assigning new REQ IDs, grep `holonovel.md` for all current
REQ-NNN and confirm the next-available number.

Machine-readable markers:

```
<!-- PLAN_BEGIN item=N -->
...
<!-- CHANGE_BEGIN N -->
### Change N: ...
<!-- CHANGE_END -->
...
<!-- PLAN_END -->
```

Grouped items: each `CHANGE_BEGIN` must include `item=N` attribution.
The `PLAN_BEGIN` marker carries the item number (or primary item for
groups).

## Output

End with: `RESEARCH COMPLETE. <N> improvements identified.`

Do NOT modify any files. Output only to this conversation.
