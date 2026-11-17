# Cold review — `roadmap-drain-6` plan, revision 3 (nit fix, no re-review)

Reviewer: DeepSeek V4.1 Flash 1017 (cold pass; no authoring context)
Plan sha256: f2ec2c1f9d2f583d34943b2ff4e43e703dde6b03c0139357da5d5afad5ba77b8
Artifact reviewed: `/home/fluke/Holonovel/docs/plans/2026-11-16-roadmap-drain-6/plan.md`
Companion in scope: `/home/fluke/Holonovel/docs/plans/2026-11-16-roadmap-drain-6/tasks.md`
Depth: standard · Stages: 5/5 · Passes: full cold pass → diff re-review → clarity re-audit →
documentation binding · Reads: 5/6 + 2 binding checks

**Verdict: `independent-review passed.`**

Cold-stage token: `independent-review passed. plan.md — 5/5 stages, 0 blockers, 2 nits`

**Binding note.** The substantive review below was performed against the plan at
`a150fa97e8e8cf0a8ed700c88c5fa90a52c1813ea2766526f8c9251df2a98730` (16126 bytes).
The artifact now standing at this path is `f2ec2c1f9d2f583d34943b2ff4e43e703dde6b03c0139357da5d5afad5ba77b8`
(16390 bytes, 220 lines). The change is the fix for the two nits this report raised —
`Revision: 2` → `3` (`:3`), "four list calls" → "three" at the two named spots (`:139`, `:169`),
and the Evidence sentence at `:6-7` recording which hash was reviewed. The +264-byte delta is
accounted for by that rewritten sentence; no design content moved, so the verdict carries
forward unaltered. No re-review was performed.

---

## Outcome of the whole pass

Rev 1 → rev 2: three hard blockers (T-ID-scoped closure, the `REQ-314b` `surfaces` branch,
and a missing evidence sidecar) plus six majors. Rev 2 resolved two blockers and five majors.
Rev 2 → rev 3: the clarity blocker resolved on evidence, and the three outstanding majors
resolved on the changed lines. This pass fixes the last two nits.

**No open blockers. No open majors.** Two nits, both metadata:

- **N1 — closed.** The header now reads `Revision: 3` and `:6-7` identifies `a150fa97…` as the
  hash the cold pass reviewed, which is the fact the gate needs to reconcile; the gate itself
  binds on this report's `Plan sha256:` line against the stamped artifact hash.
- **N2 — closed.** `:139` and `:169` now say "three MCP list calls" / "three list calls",
  matching D3 (`:85-87`) and task 2 (`tasks.md:20`), which call `tools/list`, `resources/list`,
  and `prompts/list` and exclude `resources/templates/list`.

## Deferred (unchanged text)

- **`plan.md:217` (R3) still says "four more list calls on the same client."** With templates
  excluded the generator adds two list calls to the existing `tools/list`, so the numeral is
  stale here too. It is unchanged text outside the two spots this report named, so it is
  recorded rather than raised; a one-word fix when R3 is next touched.
- The `"absent"` sentinel flowing into a renderer that clips to 16 hex + `…` — worth one
  clause, unchanged.
- D2's reading of "alongside the build fingerprint" (rev-1 Unknown 6).

---

## Record of the substantive pass (rev 3, hash `a150fa97…`)

### Clarity re-audit — resolved on evidence

The rev-2 blocker was an Evidence block that contradicted itself and named a sidecar path that
did not exist. Both legs are closed:

- The named path exists, and its contents bind to this artifact: `plan.sha256`
  = `a150fa97…` (the hash dispatched for the re-audit), `plan.path` = this `plan.md`,
  `bytes` 16126, `generated_at` 2026-11-17T03:15:39Z, `git_head`
  `13c246043fac27bd2e1a5dd74df37744d7ab67ee`, `git_status` showing exactly the one untracked
  increment directory the plan records.
- The three `absolute_paths` entries are the sidecar, `~/.local/state`, and `/tmp/d6.txt` —
  the first two verified verbatim, all `inside_repo: false`, matching `plan.md:9-11`.
- Keying on repo + plan path rather than the plan hash is now stated plainly, which removes
  the earlier "which revision does this evidence cover" ambiguity.

### The three rev-2 majors — resolved

1. **Prompt call shape.** `:46-47` reads 66 `server.registerResource(...)` and 6
   `server.prompt(...)` calls at `:17696-17716`. `server.prompt(` has exactly six occurrences at
   those lines; `registerPrompt` has none. The rev-2 error is gone.
2. **Register supersession.** P4 (`:182-188`) and task 12 (`tasks.md:30`) supersede
   `spec/audit/review-register.md:3160-3165` by name, quote both stale claims ("deliberately
   **deferred**"; "Residue: 80 rows = 65 (b) + 15 (c)"), and order the supersession before the
   dated subsection and after the roadmap — correct, because `register-checks.ts:64-67`
   resolves `Scheduled-roadmap` REQ tokens against `ROADMAP.md`.
3. **`scopingAdvice([])`.** D4 (`:107-108`) specifies `[]` → the literal `"none"`, carried into
   the zero-change record at `:412-425`; task 6 (`tasks.md:24`) repeats it and its check asserts
   `advice: "none"` on that record.

### The two conditional clauses — closed

- **Sort order.** D3 (`:86-89`) defines one rule: each list sorted ascending at emission;
  `hashSurfaces` joins the three lists with `"\n"` in the fixed order tools, resources, prompts.
  Task 4 (`tasks.md:22`) restates it and requires the observable consequences: a prompt rename
  changes the hash, adding a tool changes it, a description-only edit does not.
- **Templates.** `resources/templates/list` is deliberately not called, with a stated rationale
  ("a URI template is not a 'registered resource URI'", `:86-87`), repeated in task 2.
- **Loss analysis.** D3 (`:96-98`) records the argument: a description or schema edit still
  moves `source` through `hashDirectory` over `src/**/*.ts` (`fingerprints.ts:63`), so name-only
  hashing hides nothing at the fingerprint-set level, while a prompt or resource rename is caught
  for the first time.

### Rev-1 disposition (for the record)

| Rev-1 finding | Status |
|---|---|
| B1 T-ID-scoped closure | Resolved — `req-checks.ts:881-887`; block closes atomically; residue 72, split 57 + 15, probe 0 |
| B2 `REQ-314b` surfaces branch | Resolved — D3 implements the surfaces component; D4 covers all four branches |
| B3 Evidence sidecar | Resolved — see clarity re-audit above |
| M1 V7 read `$6` | Resolved — V8 reads `$7`; `tasks.md:9` states field 7 |
| M2 Roadmap class split | Resolved — `57 + 15` at `:147`, `:185`; task 11 |
| M3 Entry producer unnamed | Resolved — `scripts/spec-update-record.ts:123-145` at `:39-40` |
| M4 `server.resource(` | Resolved — `registerResource`; prompt shape corrected |
| M5 `scopingAdvice([])` | Resolved — D4 `"none"`; task 6 asserts it |
| M6 Startup case cannot fail | Resolved — D5 asserts the absence over `holonovel/src/**/*.ts` |

## Unknowns

1. **Exact `targets` / `reqs` array lengths** in the sidecar (claimed 12 and 11). Array shapes,
   the first target, and `git_head` were verified; the counts were not enumerated end to end.
   Probe: `grep -c '"absolute"'` and `grep -c '"req"'` on the sidecar.
2. **The "66" resource count** — call shape verified; count unverified (`holonovel/AGENTS.md`
   documents 47 resources + 23 templates).

## Note on independence

The host injects repository `AGENTS.md` files into this context. They were read as standards,
not as plan context. Independence is intact for the artifact, though weaker than a clean-room
dispatch.

## Reads used

Full pass 5/6; this binding pass 2 (the plan hash, and the edited-line confirmation). No gate
was run, no repository file was mutated.
