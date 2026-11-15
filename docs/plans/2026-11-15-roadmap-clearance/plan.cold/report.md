# Cold review — roadmap clearance plan

```
Reviewer: DeepSeek V4.1 Flash 1017
Plan sha256: 69523f157a1d06dd42c59e5673c6a9fb502baf6272126956c4d7b5872517eb9e
Artifact: /home/fluke/Holonovel/docs/plans/2026-11-15-roadmap-clearance/plan.md
Tasks:    /home/fluke/Holonovel/docs/plans/2026-11-15-roadmap-clearance/tasks.md
Independence: fresh (no authoring context)
Stages run: 4 of 5 — Stage 4 (re-zoom) not triggered: no author edits to re-read
Repo state: HEAD a038d6a (matches the artifact's evidence class); plan + tasks
            are untracked (`git ls-files` returns nothing for the increment dir)
Reads used: ~40 of 40 (standard budget; at cap)
```

## Findings

### Blockers

1. **`[Blocker][design]` Phase E cannot reach the plan's own done bar: deleting
   ROADMAP items 1 and 4 breaks `check-registers`.** The register check requires
   every `REQ-NNN` cited by a `Scheduled-roadmap` finding to appear somewhere in
   `ROADMAP.md` (`scripts/lib/register-checks.ts:64-69`). Two live scheduled
   findings depend on REQs that exist in ROADMAP.md *only inside the sections
   being deleted*: F-U4-5 cites `REQ-346` (`spec/audit/review-register.md:2801`),
   which occurs at `ROADMAP.md:24` (item 1) and `:90` (item 5) and nowhere else;
   F-P8-2 cites `REQ-073`…`REQ-361` (`review-register.md:2817-2824`), which occur
   only at `ROADMAP.md:71-75` (item 4). E2 only *adds* "a dated row per closed
   item" (`plan.md:261-262`) and does not move F-U4-5, F-U4-1, F-U4-7 and F-P8-2
   out of `## Scheduled-roadmap` into a Resolved section. `check-registers` is a
   fast gate (`scripts/lib/gate-manifest.ts:158-159`), so E1's `check-roadmap`
   plus the done bar's `check:fast` green (`plan.md:315`) cannot both hold.
   **Must change:** E2 names the four F-IDs and states that each is moved to a
   `## Resolved — <date>` section with its evidence, not merely accompanied by a
   new row.

2. **`[Blocker][design]` The generator's attested-set input does not exist in the
   document the plan names.** A1 emits `ATTESTED_PARENTS` from "the
   `narrative_coherence` `@section evidence` block" (`plan.md:160-163`), and the
   edge-case section promises that when "the register and DECISIONS disagree on a
   parent's status: the attested set is the intersection" with the disagreement
   printed on stderr (`plan.md:327-329`). The block contains no per-parent set:
   it is prose plus a scalar, "31 of 31 server-side §5.12 REQs
   `converged`/evidenced (bucket C…)" (`holonovel/DECISIONS.md:2379`). There is
   nothing to intersect, and no rule maps "31 of 31" onto parent IDs. C1 rewrites
   the block "keeping the three attestation points" (`plan.md:217-221`) and never
   adds an enumerated attested list. **Must change:** C1 must state that the
   rewritten block enumerates the attested parent IDs (or that the attested set
   is defined as *register-implemented ∩ §5.12*, with DECISIONS supplying only a
   recorded/not-recorded boolean and a count cross-check), and the edge case must
   match whichever definition is chosen.

### Majors

3. **`[Major][design]` Phase A's test asserts fields that Phase C writes — commit
   1's declared gate is red.** A4 extends T396 "to assert the six §8 fields"
   (`plan.md:174-176`), but those fields arrive in C1 (`plan.md:217-221`). Commit
   1's gate is explicitly `npm run check:fast` **plus** `npm --prefix holonovel
   run test:g7` (`plan.md:297-298`), and T396 today only checks three substrings
   (`holonovel/scripts/test-g7.ts:82-87`). `tasks.md:44-46` repeats the dependency
   ("T12 … Proof: T396 passes"). **Must change:** either the field assertions
   move to Phase C, or the commit order swaps C before A.

4. **`[Major][design]` The counting unit for `total`/`reqs` is never fixed, and it
   changes a live `spec_health` payload.** A2 specifies
   `narrativeCoherence(specReqs, attested, recorded)` returning `{implemented,
   total, disposition, reqs}` (`plan.md:165-170`) but never says whether the unit
   is 31 parent REQs or 84 §5.12 bodies; A5 hedges — "refresh the `spec_health`
   counts … **if** the total moves from 31 to 84" (`plan.md:180-181`), and the
   verification table asserts "§5.12 count is 84" via the gate
   (`plan.md:345-346`). Meanwhile `holonovel/DECISIONS.md:2382` records `pass`
   `(31/31 implemented…)`. Phase A1 also parses every §5.12 body as
   "server-side", although §5.12 contains builder/attestation bodies
   (REQ-346a1 "the builder SHALL include…", `spec/02-requirements.md:3804-3805`)
   and REQ-346b says "every **server-side** §5.12 REQ" (`:3810`). **Must
   change:** state the unit, the parent-expansion rule (prefix roll-up
   `REQ-346a1→REQ-346`), and whether `total` becomes 84 — with the DECISIONS line
   updated unconditionally rather than conditionally.

5. **`[Major][design]` T403's own acceptance text is left unsatisfied.** Appendix F
   T403 requires "Assert implementation status **lists every REQ in §5.12 with
   disposition**" (`spec/appendices-reference.md:1865`). C1's six-field prose
   block does not list them, and the plan asserts "No REQ body needs amendment"
   (`plan.md:22-25`, `40-44`) while proposing no Appendix F edit for T403.
   **Must change:** either the evidence block enumerates §5.12 disposition (84
   rows, or 31 parents with an explicit roll-up statement) or the plan amends
   T403 — which contradicts its own claim.

6. **`[Major][design]` C3's classification rule contradicts its own dry-run
   expectation.** C3 admits three classes — "manifest-backed, setup (`npm ci`), or
   named in the AGENTS table" — then expects "`npm run check`/`npm ci`/`npm run
   assemble` to be recognised" (`plan.md:225-231`). `npm run assemble`
   (`.github/workflows/ci.yml:25`) is none of the three; EV6 itself calls it a
   build tool (`plan.md:52`). Separately, the two `npm audit` steps are textually
   identical (`ci.yml:33`, `:36`) and differ only by `working-directory`, so a
   command-keyed table covers 6 steps with 5 entries. **Must change:** name the
   fourth class (build tool) and the table key (job + step name, or command +
   working-directory).

7. **`[Major][design]` "No gate covers anchor drift today" is overstated, so
   item 5's remaining work and closing evidence are mis-stated.** Every recorded
   `path:line#symbol` is resolved by the Holosuite tiers, which emit P1 findings
   for unresolved predicates (`holonovel/scripts/holosuite.ts:211-225`) and fail
   the run (`:327`); the resolver rejects a line that does not contain the symbol
   (`holonovel/scripts/lib/eval-predicate.ts:118`). Nothing in `plan.md:92-96`
   distinguishes "no dedicated, fast, self-repairing check" from "no gate". Also
   roadmap item 5's stated ask — "Add a fix mode … that content-matches … and
   rewrites it" (`ROADMAP.md:83-86`) — already ships and works (EV9/EV10,
   `scripts/refresh-predicates.ts:105-109`, `package.json:91`), so the plan is
   adding `--check`, an ambiguity refusal and an alias, not a fix mode. **Must
   change:** restate EV13 as "no *fast* gate and no failure message naming the
   repair command", and state what evidence closes item 5 given the fix mode
   pre-exists.

8. **`[Major][design]` `narrativeCoherence` exported from `index.ts` is not
   importable by the harness without starting a second server.** `index.ts`
   autostarts unless `HOLONOVEL_NO_AUTOSTART=1` is set *before* the module loads
   (`holonovel/src/index.ts:18867-18868`; that is why `engine.ts:14` exists).
   `test-g7.ts` already spawns a server as a child process
   (`holonovel/scripts/test-g7.ts:57-67`); a static import of the helper from
   `../src/index.js` would bind stdio in the harness process. **Must change:**
   name the helper's home (a side-effect-free module, or a documented
   `HOLONOVEL_NO_AUTOSTART` + dynamic-import sequence) — this is a design
   decision, not an implementation detail.

9. **`[Major][design]` Blast radius and the commit-5 revert claim omit the
   version-sync artifacts that E3 itself invokes.** E3 runs `npm run build-order`
   → "fingerprint/version sync" (`plan.md:266`), which by the repo's own checklist
   advances CalVer, `holonovel/package.json`, `holonovel/server.json`, the
   lockfile, `holonovel/AGENTS.md` and `DECISIONS.md` together (AGENTS.md
   "Before committing spec changes", REQ-107a). None of those paths appear in the
   Blast radius table (`plan.md:268-293`) or "Files expected"
   (`plan.md:355-382`), and the claim "commit 5 reverts without disturbing commits
   1–4 (it only edits `ROADMAP.md`, the register, `CHANGELOG.md`, and the
   increment artifacts)" (`plan.md:307-309`) is false as written. **Must
   change:** list the version-sync files and correct the revert claim.

10. **`[Major][clarity]` The plan proposes editing figures in a roadmap section it
    then deletes, and does not reconcile its CI count with the register's.** C1
    says "Correct the roadmap's 'seven fields' figure" and EV6 says "the
    roadmap's '15 commands' is stale" (`plan.md:49-56`, `:148-152`, `:220-221`) —
    both figures live in ROADMAP item 2, which E1 deletes (`plan.md:258`). Both
    edits are wasted work or a contradiction. Worse, the register already measured
    this class: "the nine verification steps in `.github/workflows/ci.yml:18-47`
    hold 16 commands, one of which … is a manifest gate; the other 15 are outside
    it" (`spec/audit/review-register.md:2808-2813`). EV6 re-measures the same file
    as "6 CI-only" using a different unit and never says it supersedes F-U4-7.
    **Must change:** drop the ROADMAP corrections (the section is deleted), and
    state explicitly that EV6 supersedes F-U4-7's unit and count.

11. **`[Major][clarity]` The gate-count arithmetic does not close.** The blast
    radius gives `scripts/lib/gate-manifest.ts` "two gate entries"
    (`plan.md:289`), but A3, D3 and D4 add three (`check-g7-attestation`,
    `check-anchors`, `test:anchor-tooling`). With two of them fast-wired, the
    recorded baseline "43 passed, 0 failed / `check:fast: PASS`"
    (`/tmp/opencode/checkfast-baseline.log:53-55`; `plan.md:97-98`) becomes 45, so
    the verification table's "Nothing regressed — `check:fast` 43/43 → green"
    (`plan.md:353`) reports a false regression. **Must change:** say three
    entries, and state the expected post-change fast count.

### Nits

12. `[Nit][clarity]` EV7a says "the eight non-narrative sites" and B2a repeats
    "eight" (`plan.md:65-72`, `:193`), but the enumerated sites are seven:
    `test-backfill.ts:1420,1429,1469,1474,1573`, `test-briefing.ts:131`,
    `test-limits.ts:414` (verified against the tree).

13. `[Nit][clarity]` C's verification line says "`npm run validate:fast` (AGENTS
    table sync via `check-gate-table`)" (`plan.md:234-235`). `validate:fast` is the
    REQ validator; the AGENTS table sync is the separate `check-gate-table` gate.

14. `[Nit][design]` B3 adds a third `test("…")` title regex inside
    `validate.ts`, although `collectHarnessTestNames()` already exposes every
    title as `{prefix, all}` token arrays (`scripts/validate.ts:1542-1561`) and is
    the documented home for title consumers. B3 also never defines the token
    grammar: EV7 counts "T/S/I tokens" (`plan.md:58`) while the rule speaks only of
    T IDs and `^T0\d\d`, and titles carry `REQ-NNN` tokens
    (`test-limits.ts:414`).

15. `[Nit][design]` D1 requires refusing an ambiguous match "when more than one
    candidate line carries the symbol and none is within a **documented window**
    of the recorded line" (`plan.md:241-243`) without a window value; the current
    resolver has no window (`scripts/refresh-predicates.ts:55-67`). D1 also does
    not name the contract surfaces `--check` changes: the role header
    (`:4` `[informational; build tool with --write]`), the usage block
    (`:22-31`), the documented exit codes (`:12-13`), and the unknown-flag
    allowlist (`:72`).

16. `[Nit][clarity]` B4 adds only the suffix convention ("a suffixed ID refines
    its parent row") to Appendix F (`plan.md:206-208`), but the rule it backs also
    rejects every zero-padded form. Appendix F currently retires a *named list* of
    IDs (`spec/appendices-reference.md:1433-1434`), not the `T0nn` shape, so the
    `^T0\d\d` rejection is stricter than the document it cites.

17. `[Nit][clarity]` The dispatch named a preflight sidecar
    `plan.evidence.json`; it does not exist — the increment directory contains only
    `plan.md` and `tasks.md`. HEAD and the plan hash were verified independently,
    so the artifact itself is not stale, but no preflight claim could be checked.

## Verified (the six named claims)

| # | Claim | Verdict |
|---|---|---|
| 1 | §5.12 = 84 bodies; REQ-346b already specifies pass/partial/fail | **Holds.** 84 `**REQ-` headers between `spec/02-requirements.md:3566` and `:3814`; REQ-346b at `:3809-3810`; REQ-354 sits in §5.2 at `:550`. Caveat: T403's "lists every REQ in §5.12" clause (finding 5). |
| 2 | Build-time generator is necessary; DECISIONS/register are not shipped | **Holds.** `holonovel/package.json:23-33` ships `dist, src, bin, content/torre-nosferato…, holonovel.md, tool-surface-registry.json, tool-disambiguation.json, adventures` — no `DECISIONS.md`, no `spec/audit`. |
| 3 | 21 padded tokens, 5 orphans (T227/230/232/235/783), T408–T412 collision | **Holds.** T408–T412 are narrative-coupling rows (`spec/appendices-reference.md:1870-1874`); no T227/230/232/235/783 row; collision sites confirmed exactly as enumerated (7 sites, not 8 — finding 12); padded forms confirmed (`test-backfill.ts:210,1544`, `test-persistence.ts:350`). The 1061/768 counts were not re-derived. |
| 4 | Anchor replay 23 drifts/0 unresolved at `acf7489^`; fix mode exists | **Partly.** Fix mode exists (`refresh-predicates.ts:105-109`, `package.json:91`); `acf7489`'s subject confirms "23 stale Holosuite anchors". The replay itself was **not** reproducible from this context. See finding 7 on the "no gate" framing. |
| 5 | 12 `run:` steps; six CI-only in `gates` | **Holds.** `ci.yml` has 10 `run:` lines in `gates` (including the unnamed `- run: npm ci` at `:20`) + 2 in `container` = 12; CI-only six as listed. Home choice (`check-workflows`) is plausible — it parses workflow files already — but the rule needs the fourth class (finding 6). |
| 6 | Two new gates ⇒ AGENTS table regen; guarded-rule hook / fingerprints / version bump | **Partly.** Regen is required and D3 names it (`check-gate-table`); the guarded-rule hook is **section-scoped** to Appendix M (`scripts/check-guarded-rule-change.ts:100-101`), so the Appendix F edit does not trip it; the fingerprint sections listed in AGENTS.md do not include Appendix F. Version sync **is** triggered and is missing from the file list (finding 9). |

## Unknowns

- The EV9 replay figure (23 drifts, 0 unresolved at `acf7489^`) and EV7's
  1061-token / 768-ID enumeration were not reproduced; they need a scratch
  worktree and a session script.
- Whether `check:fast` runs `test:g7` (it does not — `test:all` is full-only), so
  the Phase A ordering defect surfaces only through the explicitly declared
  commit-1 gate; a reader could mistake `check:fast` for coverage of T403.
- Whether any consumer outside the server asserts `spec_health.narrative_coherence`
  totals; no gate or snapshot referencing it was found, but the search was scoped
  to `holonovel/scripts`, `scripts`, and the spec.
- The isolation caveat the skill asks to record: this pass ran in one context
  rather than five fresh subagent contexts (nesting is not permitted here), and the
  host injected `AGENTS.md` instructions. Each stage was executed as a separate
  pass over the artifact, but a same-context pass cannot claim the blind-spot
  protection of separate dispatches.
- Write access: `plan.cold/` does not exist and could not be created; this report
  has no file and therefore no sha256. Stage reports were not persisted.

---

Blockers: 2 · Majors: 9 · Nits: 6 · Stages: 4/5 · Reads: ~40/40

`independent-review FAILED.`
