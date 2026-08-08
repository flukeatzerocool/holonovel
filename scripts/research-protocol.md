# Research Protocol — Spec Engineering Loop Phases 0-2

Phases 0-2 of the spec-engineering-loop workflow. Read-only — do NOT modify
any files. Each session researches one subsystem of the Holonovel specification
and produces a concrete improvement plan.

### Knowledge Base (read before research)

Before searching the web or re-reading the full spec, check the knowledge base
at `.holonovel-state/knowledge-base/`:

1. Read `INDEX.md` — scan for entries matching this subsystem's topics, REQ
   numbers, or keywords.
2. For each matching entry, check the expiration date:
   - `web/` entries: fresh if ≤30 days since source date
   - `spec/` entries: fresh if the stored git hash matches current HEAD;
     if hash differs but REQ count unchanged, read `git diff` since stored hash
     rather than re-reading the full section
   - `implementation/` entries: fresh if ≤14 days since source date
3. Read fresh KB entries before fetching the same information from original
   sources. Stale entries → treat as absent, re-research.

KB entries are in `.gitignore` — they exist locally for efficiency, not for
sharing.

### KB Write (after research)

After completing the report, write novel findings to the KB — do NOT duplicate
existing entries:

1. For each novel web finding (not already in KB): write a `.md` file in
   `KB/web/` with title, topic tags, sourced date (today), expiration date
   (today + 30 days), key findings, and source URLs.
2. For each novel implementation analysis: write to `KB/implementation/`.
3. Update `KB/INDEX.md` — add entries for new files under the appropriate
   section header.
4. Keep entries concise (≤20 lines). One topic per file.

---

## Phase 0: Discovery

- Spec: `holonovel.md` at repo root
- Verify: `npm run check` (lint + validate + audit-assumptions + scan-ambiguity
  + check-cross-refs + detect-dupes + validate-readme)
- Changelog: `CHANGELOG.md` (date-headed, bulleted)
- Spec conventions: REQ blocks use `**REQ-NNN — Title.**` form, ending in
  `*Check:*` or `_Check:_`. Tests use `TN` IDs. Requirements state contracts,
  not implementations.
- Knowledge base: `.holonovel-state/knowledge-base/INDEX.md`
- Proceed directly to Phase 1.

## Phase 1: Scope & Research

1. **KB CHECK.** Read `INDEX.md` for matching cached findings. Use fresh KB
   entries before re-reading or re-searching.

2. **READ ALL SPEC SECTIONS.** Use grep on `holonovel.md` to find every section
   mentioning this subsystem's REQ numbers or keywords. Read each section in
   full. Do not skim. If KB has fresh spec summaries, read those first as
   orientation.

3. **READ THE CHANGELOG TRAIL.** Search `CHANGELOG.md` for entries referencing
   this subsystem, its REQ numbers, or related section numbers. Trace evolution
   across revisions.

4. **READ IMPLEMENTATION CODE.** In `dnd5e/src/`, find and read the
   implementation files for this subsystem. Look for:
   - Spec drift: code that doesn't match what the spec says
   - Gaps: spec sections with no corresponding implementation
   - Over-implementation: code for mechanics the spec never defined

   Implementation comparison disclaimer: The dnd5e server may lag behind the
   spec. Item 2 (Spec-driven updates, §6.7) is re-run after each batch to sync
   the server. When comparing code against the spec, distinguish:
   - Lagging implementation: spec features not yet reflected in server code
     (expected — note them but do NOT classify as gaps or weaknesses)
   - True gaps: spec sections that have no corresponding implementation pathway
     even after accounting for known server sync lag (legitimate findings)
   - Over-implementation: code for mechanics the spec never defined (critical
     findings — these represent spec drift in the opposite direction)

   If KB has fresh implementation analysis for this subsystem, read it first.

5. **RUN WEB CALIBRATION.** If KB has a `.web-recalibrated` marker dated
   today, skip this step entirely — all web findings were pre-cached. Otherwise:

   Search using the 8-axis persona framework below. Weight research toward
   personas scoring HIGH on this subsystem's axis profile.

   ```
   RESEARCH PRIORITIES — 8-axis persona evaluation:

     Persona              Util  Cmft  Transl  Cont  Agency  Discv  Game
     ───────────────────────────────────────────────────────────────────
     Live tabletop GM      H     L       H      M      L      H      H
     Solo roleplayer       H     H       H      H      H      M      M
     Video/remote          H     M       M      H      L      M      H
     VTT user              H     L       L      M      L      L      M
     AI RP hobbyist        M     H       H      H      H      M      L
     Play-by-post          L     H       M      H*     M      L      L
     Inform/IF player      L     H*      M      L      H      L      L

     H* = highest score on that axis across all personas.

     Axis definitions:
     - Utility:         Does Holonovel solve this player's actual problems?
     - Interaction:     Does text/command interaction map to their workflow?
     - Translucency:    Does it feel like inhabiting a world, not operating a tool?
     - Continuity:      Does the world persist across sessions?
     - Agency:          Can you shift between character/player/meta modes?
     - Discoverability: Can a new user find features without reading docs?
     - Game-awareness:  Do mechanics enhance or interrupt the fiction?

     Holodeck alignment (composite from Translucency + Continuity + Agency
     + Game-awareness) is the north star — every improvement should move
     Holonovel closer to "inhabiting a world, not operating a tool."
   ```

   For each persona, consult KB/web/failure-modes.md for the quit moment
   relevant to this subsystem. Your improvement plan must address at least
   one quit moment.

   Cross-reference web findings with codebase findings. Flag contradictions.
   If KB has fresh cached web findings, use those — search only for queries
   not already covered. If no relevant web or KB results, note it — do not
   fabricate.

6. **HOLODECK REALISM AUDIT.** Before proceeding to the reflexion gate, answer:

   > *"If this subsystem were designed specifically to feel like a Holodeck
   > interaction, what would change? The Holodeck doesn't pause to ask which
   > stat you're rolling against — it interprets your intent and resolves it.
   > The world doesn't say 'NPC #7 updated' — the character simply acts
   > differently next time you meet them. The interface isn't a dashboard with
   > labeled buttons — it's the world itself."*

   See KB/web/holodeck-episodes.md for reference scenes mapped to subsystems.
   This produces a specific kind of finding: spec gaps where the current design
   is mechanically correct but emotionally flat. These are recorded as
   improvement areas.

7. **REFLEXION GATE.** Before proceeding, verify:
   - Did I read every section of `holonovel.md` mentioning this subsystem?
     (Verify with grep.)
   - Did I search the web for current information (or use fresh KB cache)?
     (Skip if `.web-recalibrated` marker is dated today.)
   - Does each weakness cite a concrete source (spec line, changelog entry, or
     implementation file)?
   - Are there at least 3 actionable improvement areas?
   - Do recommendations state contracts (what a conformant system must do),
     not implementation prescriptions (how to do it)?
   - Did the Holodeck realism audit surface any spec gaps?
   - Did the plan address at least one persona quit moment from
     KB/web/failure-modes.md?
   If any check fails, return to research. Do not present incomplete findings.

## Phase 2: Draft Plan

For each improvement, produce a concrete plan entry with:

```
### Change N: [one-line summary]
**File:** holonovel.md, after <anchor point>
**Prose:**
    [exact new REQ block or edit text]
**Manifest:** add REQ-XXX to Appendix E
**Test:** add TN to Appendix F "<section>"
```

Before assigning new REQ IDs, grep `holonovel.md` for all current REQ-NNN and
confirm the next-available number. Do not guess.

Verify every recommendation passes the contract test: "Could two different
implementations satisfy this requirement using different approaches?" If not,
rephrase as an outcome contract.

### Plan Format Rules

Wrap the implementation plan in machine-readable markers — the execute script
uses these to parse plans mechanically:

```
<!-- PLAN_BEGIN item=N -->
## Implementation Plan: <subsystem name>
...
<!-- CHANGE_BEGIN 1 -->
### Change 1: [title]
...
<!-- CHANGE_END -->
<!-- CHANGE_BEGIN 2 -->
### Change 2: [title]
...
<!-- CHANGE_END -->
<!-- PLAN_END -->
```

Markers are HTML comments — they don't affect Markdown rendering. The first
`PLAN_BEGIN` must appear before the first `CHANGE_BEGIN`.

**Group mode.** When researching multiple items as a group, produce one
research report covering the shared subsystem. Each `CHANGE_BEGIN` must
include `item=N` attribution (e.g., `<!-- CHANGE_BEGIN 1 item=3 -->`).
The `PLAN_BEGIN` marker carries the primary item number.
End with: `RESEARCH COMPLETE. <N> improvements across <M> items.`

## Output Format

Structure your response as:

```
## Research Report: <subsystem name>
### How It Works
### Strengths
### Weaknesses
### Improvement Areas

<!-- PLAN_BEGIN item=N -->
## Implementation Plan: <subsystem name>
<!-- CHANGE_BEGIN 1 -->
### Change 1: ...
<!-- CHANGE_END -->
...
<!-- PLAN_END -->
```

End with: `RESEARCH COMPLETE. <N> improvements identified.`

Do NOT modify any files. Output only to this conversation.
