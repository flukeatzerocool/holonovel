# Tasks — Server-note narrative coupling (REQ-365a/b/c, F-P8-1)

Dependency-ordered. One spec increment, one commit at the end.

1. **C1 — render a `### Server guidance` section** (`holonovel/src/index.ts`,
   immediately after the synthesis block ending at `:14095`).
   - Guard: `badge === "game_master" || badge === "none"`.
   - Collect `state.serverNotes` entries with a `narrative_tag` and non-empty
     content, sorted by key, rendered `- [<tag _→->] <content>`.
   - Emit nothing when empty; otherwise append the section.
   - Comment cites REQ-365a/b/c. Leave the synthesis block untouched.
   - Check: `npm run typecheck`.
2. **C2 — widen T416** (`holonovel/scripts/test-backfill.ts:255`).
   - `set_badge("game_master")` first; set four tagged notes (lore_seed,
     session_reminder, house_rules, campaign_bible), one empty-content tagged
     note, and one untagged note.
   - Assert the GM briefing contains `[lore-seed] The old gods were banished`,
     `[session-reminder] Remind players about the curse`, `[house-rules]`,
     `[campaign-bible]`, omits the untagged note's content, and carries no
     `- []` bullet.
   - Assert the player briefing contains neither; restore the GM badge.
   - `remove_server` all six notes.
   - Check: `cd holonovel && npm run test:backfill` — all pass.
3. **C6 — DECISIONS.md placement note** (`holonovel/DECISIONS.md`), citing
   REQ-365a: placement inside the `### Synthesis` supplementary-guidance group,
   GM badge only, no new section token.
4. **C3 — review register** (`spec/audit/review-register.md`): move F-P8-1 from
   `## Scheduled-roadmap` to `## Resolved` with predicate + exercising harness.
5. **C4 — ROADMAP.md**: delete § Server-note narrative coupling (`:15-23`).
   Check: `npm run check-roadmap`.
6. **C5 — CHANGELOG.md**: new top heading `## 2026-11-09 — Server-note
   narrative coupling (REQ-365a/b/c remediation)` with the surface, assertion,
   and roadmap-retirement bullets.
7. **C7 — register refresh**: `npm run validate -- --write-register`; stage the
   register only if it changes (the REQ-365 row already names T416).
8. **Gates**: `npm run assemble && npm run check:fast` (capture the unpiped exit
   code; the tell is the trailing `check:fast: PASS`). Then
   `npm run check` before publication.
9. **Commit**: `npm run session:close`; write `aar.md` first, ending in
   `LOOP PAUSED` or `LOOP OPEN`.
