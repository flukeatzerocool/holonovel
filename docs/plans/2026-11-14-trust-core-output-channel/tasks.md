# Tasks — Trust-core output channel

Ordered by dependency. Each task names the surface it touches and the check
that proves it done. Red first: no production edit lands before its assertion
fails for the named reason.

## T0 — Probe (no writes to the repo)

Scratch `TTRPG_DATA_DIR` under `/tmp/opencode`; a throwaway MCP client.

1. Boot with `TTRPG_OUTPUT_LIMIT=100`; produce a long ruleset search; read the
   pointer. Record the key segment and the returned body.
2. Produce under Game Master, `set_badge(player)`, read the same pointer.
   Record whether the payload is returned (the expected leak).
3. Boot with `TTRPG_OUTPUT_SESSION_LIMIT=1`; produce two payloads; read the
   first. Record the absent-key body (`{"error":"not found"}` today).
4. Produce a Game Master payload, `set_badge(player)`, run
   `manage_diagnostics (action: context_report)`; record whether `last_tool_output` carries
   the payload text (the expected second leak).
5. Produce a 60-character CJK string under a limit between its character count
   and its byte count. Record which one truncates today.
6. Produce a package-tool output over the limit; confirm it reaches the same
   store key shape as a host tool.
7. Run the unchanged suite at default limits and record every tool result above
   32,000 bytes (the universal channel's assumption).

Done when every observed shape is written into the plan's premise list (or an
amendment is recorded).

## T1 — Red assertions

1. `test-output-contracts.ts` T13: key segment and title, the byte-vs-char
   case, the Player-denied and Editor-allowed reads, the eviction message, the
   structured mirror, the context-ledger read.
2. `test-backfill.ts` T221: rewrite the vacuous `output://create_room/1` read as
   a real truncated produce-then-read (REQ-179b's `_Check:_` binds T221).

Done when each new assertion fails for the reason it names, and the untouched
suite still passes.

## T2 — The output channel (C1)

1. Replace `truncateOutput` with `truncateResult(name, result)`; measure
   `Buffer.byteLength(joined, "utf8")`, and deliver a single JSON document
   intact (D10).
2. Store the full text with its producer badge; evict past the session limit.
3. Return one pointer text item; mirror the pointer into
   `structuredContent.text`.
4. Wire it as `ensureStructured(truncateResult(name, handler))`.
5. Delete the six call sites; refresh the REQ-004 comment block.

Done when the byte case and the char case both pass and `test:output-contracts`
is green.

## T3 — Badge-aware store and resolver (C2)

1. Store `{ text, badge }` per payload.
2. Allow the read on exact badge match or Editor.
3. Return one `[ERROR] [NOT_FOUND]` Markdown body naming eviction for
   absent/evicted/denied.
4. Route `contextSectionTexts` through the same accessor: newest visible
   payload, empty section when none.

Done when T13's badge, eviction, and ledger assertions pass and `typecheck`
stays green.

## T4 — Spec contract (C4)

1. Add REQ-179c after REQ-179b and REQ-180c beside REQ-180b, each with
   `_Check:_ T13`; amend REQ-004's first sentence to reference REQ-180c.
2. Add the Appendix REQ index rows, the REQ-179c/REQ-180c tokens on T13's row,
   and both tokens in T13's harness title.
3. Grep the spec for every clause binding `output://` reads (REQ-004,
   REQ-179a/b, REQ-179c, REQ-032) and confirm no rule contradicts the
   exact-match-plus-Editor read; record the result in the AAR.
4. Apply Appendix M; re-measure (≤800 chars, ≤8 sentences).
5. Confirm the §5.1 map row's base `179` covers the new sub-REQ; no map edit.

Done when `npm run assemble && npm run validate` reports no new errors.

## T5 — Full harness pass

1. `npm --prefix holonovel run test:all`.
2. Repoint every drifted Holosuite anchor; re-run until green.

## T6 — Registers, roadmap, coverage, changelog (C5)

1. Review register: F-P1-5/F-P1-6 → `Resolved` with refreshed predicates and
   T13 named; record the `search_rules` key and eviction-body defects closed
   within F-P1-5's scope.
2. ROADMAP: bullet 2 → authorization remainder (F-P1-7/F-P1-8/F-P1-9); drop
   `F-P1-12` from bullet 3; keep the `**Trigger:**` line.
3. `npm run validate -- --write-register`.
4. CHANGELOG dated entry.

Done when `check-registers`, `check-roadmap`, and `check-loop-artifacts` pass.

## T7 — Gates and close

1. `npm run assemble && npm run check:fast` → trailing `check:fast: PASS`.
2. `npm run check:conformance` (expected no change).
3. Write `aar.md`, ending in `LOOP PAUSED` or `LOOP OPEN`.
4. `npm run session:close`.

## Parallelism

T2 and T3 both edit `src/index.ts`; run them serially. T4 is spec-only and can
run after T3. T1 must precede T2–T3.
