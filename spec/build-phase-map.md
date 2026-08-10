# Build Phase → Spec File Map

<!-- content hash: <sha256> -->

The builder reads files on demand per build phase. The assembled `holonovel.md` contains
all content for distribution and REQ-105; this table enables per-phase targeted loading
for context efficiency. **This map is the single source of truth for per-phase file
loading. The `*Prepare:*` directives in §6 delegate to this table and do not
independently specify file lists.**

| Build Phase                    | Files to load                                                                 | ~Tokens (approx.)^ |
|-------------------------------|-------------------------------------------------------------------------------|---------|
| G0 structural integrity        | 01-foundations.md §1–§3, 03-build.md §6.1–§6.2                                | 2,500   |
| Convert (if selected)          | 03-build.md §6.2 Convert, appendices-reference.md §G                          | 3,000   |
| Discovery (§6.3)               | 03-build.md §6.3, 02-requirements.md §5.2 (provider indexing replaced by `holonovel` install) | 5,000   |
| Construction (§6.4)            | 03-build.md §6.4, 02-requirements.md §5.3–§5.7, 04-runtime.md                 | 7,500   |
| Convergence (§6.5)             | 03-build.md §6.5, 02-requirements.md (all), 05-verification.md, 08-synthesis.md §11.4 (when synthesis metrics in scope) | 9,200   |
| Ruleset Pattern Buffer (§6.6)         | 03-build.md §6.6, 05-verification.md, 06-artifacts.md                         | 3,000   |
| Holonovel Pattern Buffer (§6.6)         | 03-build.md §6.6 Holonovel Pattern Buffer (holonovel package verification only — not part of TTRPG builds)   | 1,800   |
| Gates G0–G5 (§8)               | 05-verification.md (full)                                                     | 1,800   |
| Handoff (§9)                   | 06-artifacts.md, 07-independent.md                                            | 2,000   |
| Synthesis (§11, optional) | 08-synthesis.md, appendices-reference.md §J                                  | 2,500   |
| Spec-driven update (§6.7)      | 03-build.md §6.7 + files changed per git diff                                 | Variable |
| Appendix lookup from gate req  | appendices-reference.md or appendices-fixtures.md (relevant appendix) | 500–2,000 |
| Independent verification (§10) | All files (cold checkout — full spec load; no token efficiency applied)       | 30,000   |

^ Token estimates are approximate, generated from one reference model tokenizer.
Actual token counts vary by tokenizer implementation. Convergence row estimate
is per-iteration; a looping phase multiplies by iteration count.

**Peak working set:** ~8,000 tokens (Convergence) vs. ~30,000 tokens (full spec) — a 73%
reduction in per-phase context.

## Loading conventions

- **Distributed artifact path:** Load `holonovel.md` — works identically to the
  pre-split specification. No changes to existing builder workflows.
- **Per-phase path:** Load files listed in the table above for the current phase.
  Each phase's `*Prepare:*` directive in §6 lists the exact files.
- Files not listed for a phase SHOULD NOT be loaded — they contain content
  irrelevant to the current task.

## File index

| #  | File                     | Contents                            |
|----|--------------------------|-------------------------------------|
| 1  | 01-foundations.md        | §0–§4: reading guide, mission, failure modes, standing rules |
| 2  | 02-requirements.md       | §5: all REQs, 9 subsections         |
| 3  | 03-build.md              | §6: build process                   |
| 4  | 04-runtime.md            | §7: runtime conventions             |
| 5  | 05-verification.md       | §8: verification workflows          |
| 6  | 06-artifacts.md          | §9: artifacts and handoff           |
| 7  | 07-independent.md        | §10: independent verification       |
| 8  | 08-synthesis.md         | §11: Synthesis             |
| 9  | appendices-reference.md  | # Appendices heading + A, D–S (reference material) |
| 10 | appendices-fixtures.md   | B, C, N (golden, injection, complex fixtures) |
