# Plan — §5.10 parser tool-name drift

Status: revised rev 2 (self + cold review) · Kind: planned · Depth: standard
Increment target: `docs/plans/2026-11-11-5-10-parser-tool-name-drift/`
Rollback cost: 1 (reversible spec-text and register edits; one commit)
Evidence class: repo only (no web, no user-supplied content). Every step's
premise is `repo`.

## 1. Objective

Close the top open `ROADMAP.md` section — **§5.10 parser tool-name drift (P2)**
(`ROADMAP.md:15-27`) — so no `command`-as-tool reference remains outside the
notation the constitution licenses. The section's trigger has fired: the last
three increments were §5.10 parser-contract sessions, and they edited affected
lines (`docs/plans/2026-11-11-5-10-req-196a-player-badge-clause/` rewrote
`spec/02-requirements.md:3243`).

Baseline at session start: `npm run status` reports 53 unpushed commits, 15 open
roadmap items, version `2026.11.11`. `npm run assemble && npm run check:fast` is
green (40/40 gates, `check:fast: PASS`) before any edit.

## 2. What the evidence shows

Enumerated with a script over the parsed REQ bodies (numbers below are measured,
not estimated):

| Section | Bodies with a `command`-as-tool token | Forms |
|---|---|---|
| §5.10 | 26 | 8 bare (`` `command` ``), 18 call (`command("…")`) |
| §5.6 | 2 (REQ-221b, REQ-330a) | 3 call, 1 bare |
| §5.16 | 1 (REQ-385a) | 1 bare |
| §5.3 | 1 (REQ-163a) | MCP client-config key — not a tool |

Plus §5.10 section prose at `:3200` and `:3203`.

**2.1 Appendix F and Appendix W are not unlicensed drift.** The roadmap asks to
re-point T239 and T261 and Appendix W. A standing rule already permits the
abbreviation: `spec/01a-constitution.md:141` (Fixture notation) states that a
short token (`novel`, `world`, `scene`, `context`, `character`, `command`,
`respond`, …) denotes the registered tool, and that `command("X")` denotes
`run_command (action: execute, "X")`. That covers Appendix F T239
(`spec/appendices-reference.md:1697`) and T263 (`:1709`), and all of Appendix W.

**2.2 The licence clause points at the wrong appendix.** It scopes itself to
"Golden transcripts (Appendices B/C/N/W/X) **and the Appendix T test catalog**".
Appendix T is the Tool Surface Map (`spec/appendices-reference.md:3425`); the
derived test catalogue is **Appendix F** (`:1423`). As written the shorthand
licenses nothing where 89 of the spec's `command(` occurrences live, and it
never excludes §5 normative text.

**2.3 The real drift is normative prose.** §5.10 prose says "the `command` tool"
(`:3199-3200`) and "the parser `command` SHALL be" (`:3203`); 26 §5.10 REQ
bodies invoke `command`/`command("…")` as the registered tool. The registered
name is `run_command` (`holonovel/AGENTS.md:72`), renamed 2026-09-10 with an
explicit claim that "REQ bodies, Appendix E/F/T, the §4 glossary,
`holonovel/AGENTS.md`, and all 20 harnesses" were re-pointed
(`holonovel/DECISIONS.md:1507`). They were not.

**2.4 Appendix W is notation, not a wire capture.** Its transcript lines use the
whole shorthand set — `→ scene` (`spec/appendices-fixtures.md:828`), `→ combat`
(`:254`), `→ set_badge` (`:832`) — so `→ command { … }` (`:835` …) is the same
notation, not a claim that a tool named `command` exists. No script under
`scripts/` or `holonovel/scripts/` references "Appendix W"; `scripts/assemble.ts`
only concatenates the file.

**2.5 Three sections are fingerprint sources.** `scripts/lib/contract-fingerprint.ts`
hashes the package contract (§5.16, §5.17, §6.3, §6.4.2 at `:27`) and the data
model (§5.6, §5.9, §5.19, §5.21–§5.28, §5.31–§5.32, §7.7, Appendix Q at
`:37-43`). §5.10 is in neither list. A cosmetic edit to §5.6 changes the baked
data fingerprint, and REQ-651 then makes the host re-serialize every persisted
Novel at startup (backup, atomic write, recomputed checksum), with REQ-652
reporting `[data-stale]` in `spec_health` (`spec/02-requirements.md:4028-4032`).
A §5.16 edit changes the package fingerprint, and REQ-420 then holds every
installed ruleset package **inactive** with `[package-incompatible]` — it does
not rebuild or re-extract them (`:3995-3996`); REQ-422 only reports the
mismatch through `update-rulesets` (`:4016-4017`).

## 3. Decisions

**D1 — Re-point §5.10 only: its prose and all 26 of its REQ bodies.**
`command` / `command("X")` used as a tool invocation becomes `run_command` /
`run_command (action: execute, "X")`. §5.10 is outside both fingerprint lists,
so this is a pure text edit with no artifact consequence. Rejected: exempting
normative prose under the notation rule — that is the drift, not the fix.

**D2 — Defer the three occurrences in fingerprinted sections (§5.6 REQ-221b,
§5.6 REQ-330a, §5.16 REQ-385a).** They are recorded as a
`Scheduled-roadmap` finding and a new `ROADMAP.md` section, triggered by the
next increment that regenerates **either** fingerprint tier: the data tier
through the §5.9/§5.19 persistence remediation (which already schedules
`novel_format_version` and the archive work), the package tier through any
§5.16/§5.17 touch. Both tiers are named because REQ-385a sits behind the
package fingerprint, which no currently scheduled work regenerates.
Rejected: folding them in here — a token rename would re-serialize every saved
Novel and mark every installed ruleset package stale, which is a data-format
event, not a P2 text pass. The roadmap's own close condition
(`ROADMAP.md:25-26`) covers §5.10, Appendix F, and Appendix W only.

**D3 — Correct the notation clause and make it exclusive.** "Appendix T test
catalog" → "Appendix F test catalogue", plus the missing half of the rule: the
shorthand is admissible in golden transcripts (B/C/N/W/X) and test-assertion
prose (Appendix F and the §6 verification steps that restate it — 17
`command(` lines in `spec/03-build.md`, `:1804`–`:1898`), **never** in §5
normative text, with the three deferred lines named as tracked exceptions.

**D4 — Appendix W stays as notation; one clarifying sentence is added.** Since
`command` is one of a dozen shorthand tokens in the same transcript (2.4),
re-pointing only `command` would be inconsistent and re-pointing all of them is
out of scope. The preamble gains one line: tool lines in the transcript use the
§4 fixture notation, and `command("X")` is `run_command (action: execute, "X")`.
T261 (`spec/appendices-reference.md:1721`), which asserts the "expected …
tool name", is re-worded to assert the prefix and the expected *interaction*,
naming `run_command (action: execute)` where the note literally used to say a
tool name. Rejected: converting the eleven wire lines (cold-review M5 — it
singles out one token in a uniformly abbreviated fixture, and T261 would still
be unsatisfiable for `→ scene` and `→ combat`).

**D5 — Extend the existing citation gate; do not add a sibling check.**
`scripts/tool-citation-check.ts` already owns "a spec body cites a tool name
that is not registered" (its header names the REQ-429 rename failure mode) but
only walks `tool (action: …)` bindings (`:53-60`), so a bare token passes. The
detector is a pure function in `scripts/lib/req-checks.ts` (the existing home
for REQ-body detectors), called from the gate, self-tested in
`scripts/test-req-checks.ts` — the established lib-plus-self-test pattern, so
no new harness wiring is needed (`checkHarnessGating`).

Detector contract, fixed here so the build does not invent it:

- `checkToolTokenDrift(bodies: ReadonlyArray<{ id: string; body: string }>, allow: ReadonlySet<string>): string[]`
  in `scripts/lib/req-checks.ts`. Returns one message per offending body:
  `<id>: cites the unregistered tool token \`command\` (registered: run_command)`.
- A body offends when it contains a backticked `` `command` `` or an invocation
  `command("…")`. The MCP client-config key (`command`/`args`/`env`, REQ-163a),
  the ruleset action-kind table at `:395-414`, and plain English ("parser
  command") do not match because neither form is present.
- Scope is **every** REQ body with an explicit allowlist set — REQ-221b,
  REQ-330a, REQ-385a — never a section filter. A section filter would be blind
  to the next rename outside §5.10; the allowlist is the documented deferral.
- The gate keeps its `[gate]` contract: exit 1 with the violations on **stderr**
  (matching the gate's current `console.error` at `scripts/tool-citation-check.ts:68-71`
  and AGENTS.md's stdout-payload / stderr-diagnostics convention), `--json` on
  stdout, exit 2 only for a fatal read error. There is no report-only mode in
  the gate; if the false-positive budget in step 3 is unacceptable, the detector
  is not landed and the finding is recorded `Closed-P3` with the measured rate.

Recurrence is demonstrated — the 2026-09-10 rename claimed these surfaces were
re-pointed, and three §5.10 sessions since edited affected lines — so this is
P2 prevention work, not an open-ended "audit X".

## 4. Scope

**4.1 Blast radius.**

| File | Change | Size |
|---|---|---|
| `spec/02-requirements.md` | §5.10 prose `:3199-3203`; 26 §5.10 bodies: REQ-196a `:3243`, REQ-196d `:3252`, REQ-283b `:3263`, REQ-284b/d/f `:3271`/`:3277`/`:3283`, REQ-316a `:3285`, REQ-317a–d `:3290`–`:3299`, REQ-319d `:3323`, REQ-320c `:3331`, REQ-197a–c `:3333`–`:3339`, REQ-309b–h `:3415`–`:3433`, REQ-327a `:3454`, REQ-367b1/b2 `:3465`/`:3468` | L |
| `spec/01a-constitution.md` | `:141` appendix pointer, §5 exclusion, tracked exceptions | S |
| `spec/appendices-fixtures.md` | Appendix W preamble notation sentence (no wire-line edits) | S |
| `spec/appendices-reference.md` | T261 `:1721` wording only | S |
| `scripts/lib/req-checks.ts` | `checkToolTokenDrift` | S |
| `scripts/tool-citation-check.ts` | calls the detector | S |
| `scripts/test-req-checks.ts` | self-test assertions | S |
| `ROADMAP.md` | remove the §5.10 section; add the fingerprinted-token section (D2) | S |
| `spec/audit/review-register.md` | F-P6a-20 `Resolved`; §5.6/§5.16 deferral as `Scheduled-roadmap` | S |
| `CHANGELOG.md` | session entry, dated `2026-11-11` | S |
| `spec/audit/req-coverage.md` | regenerated during verification only (expected no-op) | — |
| `holonovel.md`, `holonovel/holonovel.md` | regenerated by `npm run assemble` (both tracked) | M |
| `docs/plans/2026-11-11-5-10-parser-tool-name-drift/` | plan, tasks, cold review, AAR | S |

**4.2 Out of scope.** `holonovel/src` (no code change; `run_command (action:
execute)` exists and T239/T643 exercise it); the three fingerprinted-section
occurrences (D2); Appendix E manifest text (already `run_command`); Appendix F
`command(` notation (licensed by D3); the MCP client-config `command` key at
`:900` and `spec/03-build.md:152`; the ruleset action-kind table at `:395-414`;
the other shorthand tokens, which D3 licences rather than removes.

**4.3 Register coupling.** No existing `Scheduled-roadmap` row or `ROADMAP.md`
entry names this section (grep: no match). `check-registers` requires every
`Scheduled-roadmap` finding's cited REQs to appear in `ROADMAP.md`
(`scripts/lib/register-checks.ts:64-68`), matched by exact token — so the new
roadmap section names the **suffixed** IDs `REQ-221b`, `REQ-330a`, and
`REQ-385a`, not the base numbers. The finding cites the same tokens.

## 5. Steps

1. **Detector red test.** Add failing assertions to `scripts/test-req-checks.ts`
   for the three cases in D5 (tool token → flagged; config key → clean; English
   prose → clean). `npm run test:validators`; record the failure.
2. **Detector.** Implement `checkToolTokenDrift` in `scripts/lib/req-checks.ts`
   and call it from `scripts/tool-citation-check.ts`.
3. **False-positive budget.** Run `npm run tool-citation-check` over the whole
   assembled spec and classify every finding: expect exactly the §5.10 set from
   4.1 (26 bodies) and nothing else. If benign findings outnumber true findings,
   do not land the detector (D5, `Closed-P3`).
4. **§5.10 prose** (`:3199-3200`, `:3203`).
5. **§5.10 bodies**, in table order. Three need care; measure after each edit:
   - REQ-196a (`:3243`): one bare token, 754 → 758.
   - REQ-309b (`:3415`): 798 characters with three bare tokens. Rewrite as:
     `run_command` for the first and third, "never the parser" for the second,
     and drop the redundant "(B1=`none`)" parenthesis (restated in REQ-309h).
     Expected landing 794–796; measure and record rather than trusting the sum.
   - REQ-196d (`:3252`) has five call forms; the rest are small.
6. **Notation clause** (`spec/01a-constitution.md:141`), including the tracked
   exceptions for REQ-221b, REQ-330a, REQ-385a.
7. **Appendix W** preamble sentence; **T261** wording.
8. **Regenerate and verify** (§6), then `ROADMAP.md`,
   `spec/audit/review-register.md`, `CHANGELOG.md`.

## 6. Verification

1. `npm run assemble` — confirm both `holonovel.md` and `holonovel/holonovel.md`
   are rewritten.
2. `npm run check:fast` — capture the un-piped exit status; the trailing
   `check:fast: PASS` line is the tell.
3. Negative greps **scoped to §5.10** (`awk 'NR>=3158 && NR<3505'`), expected
   empty: `` `command` `` and `command("`. Spec-wide, expect exactly four
   survivors: `:900` (config key), `:1542`, `:1826`, `:3906` (deferred).
4. REQ shape: `npm run validate --sdd-strict` — every edited body stays one
   paragraph within the 800-character and 8-sentence limits (AGENTS.md
   "Requirements"); record each edited body's final length in `aar.md`.
5. `npm run validate -- --write-register`.
6. `npm run test:validators` and `npm run tool-citation-check` green.
7. `check-tool-surface`, `action-conflicts`, `check-tool-definitions-sync` green
   — the surface is unchanged, so movement there means the edit went wider than
   text.
8. `check-fingerprint-sync` green **without** regeneration, and
   `git diff --stat` touches no file in the two fingerprint section lists
   (`scripts/lib/contract-fingerprint.ts:27`, `:37-43`). Any drift means an edit
   landed in §5.6/§5.9/§5.16/§5.17/§5.19/§5.21–§5.28/§5.31/§5.32/§6.3/§6.4.2/
   §7.7/Appendix Q and must be re-scoped before regeneration.
9. `npm run check-loop-artifacts` and `npm run check-registers` after the
   register and roadmap edits.

## 7. Risks

- **REQ body length (800-character cap).** Only REQ-309b is near the cap (798);
  §5 gives its rewrite. No other edited body exceeds 700 after conversion.
- **Detector false positives.** `command` appears legitimately as the MCP
  client-config key, as a ruleset action kind, and as English prose; the token
  forms in D5 do not match those. Step 3 measures the rate; the fallback is to
  not land the detector.
- **Three known survivors.** The detector's allowlist contains exactly
  REQ-221b, REQ-330a, REQ-385a. If the deferral is later dropped, the allowlist
  shrinks to empty in the same commit that re-points them.
- **Roadmap redefinition.** The roadmap's second bullet says "re-point those
  references". This plan re-points §5.10 and licenses Appendix F/W as notation
  (D3/D4). The register entry states that deviation explicitly; the roadmap
  section is removed with the reasoning recorded, not silently reinterpreted.

## 8. Done bar

**Done bar** (each item names the command or artifact that proves it):

- Zero `command`-as-tool tokens remain in §5.10 (prose + 26 bodies) — proved by
  the scoped greps in §6.3 and by `npm run tool-citation-check`.
- The four spec-wide survivors are exactly `:900`, `:1542`, `:1826`, `:3906`,
  each with a recorded disposition.
- `spec/01a-constitution.md:141` cites Appendix F, excludes §5 normative text,
  and names the three tracked exceptions.
- `npm run assemble && npm run check:fast` ends `check:fast: PASS` with 0
  errors, and `check-fingerprint-sync` is green with no regeneration.
- The detector has a passing self-test, or is recorded as not landed with the
  measured false-positive rate.
- F-P6a-20 is `Resolved`; the deferral is `Scheduled-roadmap` and its REQs
  appear in `ROADMAP.md`; `check-registers` is green; `CHANGELOG.md` carries the
  session entry; the AAR returns `LOOP PAUSED` with no new action items.
