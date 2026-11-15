# Cold review — `docs/plans/2026-11-14-identifier-derivation-conformance/plan.md`

Reviewer: `review` (cold subagent, `independent-review` skill, gate depth standard)
Plan sha256: `f87309950d678ee1c7e876cac6e093f0bc0917a9252680113af5bdf6e112293d` — recomputed and matches
Repository HEAD: `aa927c3` — matches the dispatch; working tree clean apart from the untracked plan directory
Stages run: 1, 2, 3, 5 (Stage 4 not triggered — no artifact edits). **Isolation limitation:** nesting is prohibited for this subagent, so the five stages ran in one fresh-but-single context. The property preserved is "never saw the authoring conversation"; the per-stage fresh-context property is not preserved. Recorded as an Unknown below.
Reads used: 38 / 40.

## Stage 2 — comprehension (artifact only)

The plan makes two identifier rules the spec already states true of the code that
derives identifiers. First, `deriveAnchor` currently strips only `*…*` role markers,
so `_GM only_ The Door` keeps the marker text; an underscore branch with a
whitespace boundary fixes it, pinned by an extra assertion in the existing `T236`
harness test. Second, §7.1a's Windows-reserved-stem and 240-character path rules are
unimplemented: a new `holonovel/src/core/slug.ts` provides `deriveSlug` (current
inline rule + `-1` reserved remap + `"novel"` fallback) and `fitSlugToPath`
(hash-prefix shortening), wired into five derivation sites (`createNovel`, startup
`TTRPG_NOVEL`, `rename`, `clone`, `branch`) plus a refusal at Novel-pack admission.
The rule is promoted from prose to `REQ-659` in §5.1 with `_Check:_ T787`, an
Appendix F row, and a §5.1 map-row entry; the two U3 findings are dispositioned
`Resolved`, the ROADMAP section deleted, and the coverage register regenerated.
Done means both rules implemented and tested, the REQ evidenced (not bucket A),
`validate` at 0 errors with no new warnings, `build-order`/`check:fast` green, one
`session:close` commit, AAR ending `LOOP PAUSED`.

Faithful on intent and on the done-bar shape. It is **not** faithful on what the
code currently does (Stage 1/3 blocker B1) and is incomplete on the REQ-registration
consequences (B2).

## Stage 1 + 3 findings

### Blockers

**B1 [design] — Done bar 1 asserts an anchor value the code does not produce, and the plan's own explanation of why the fix is identifier-safe is false.**
Plan lines 86-87 (`deriveAnchor("set_active_state") === "set-active-state"`, "identifier headings are unchanged") and line 182 ("The whitespace boundary is what keeps `set_active_state` intact").
Predicate: `holonovel/src/core/anchors.ts:21` is `.replace(/[\p{P}\p{S}]/gu, "")` — underscores are `Pc` and are **deleted**, not converted to a separator; line 22 only hyphenates `[\s\u00a0]`. So at HEAD `deriveAnchor("set_active_state") === "setactivestate"`. The plan's proposed branch `/(^|\s)_([^_\s][^_]*)_(?=\s|$)/g` does not match `set_active_state` (no whitespace boundary), so after the change the value is still `setactivestate`.
What must change: either the bar must assert `setactivestate` (unchanged-behaviour regression), or the plan must add an explicit anchors.ts clause that maps a mid-token `_` to `-` **and** carry the resulting anchor churn (every underscore-bearing heading in every indexed ruleset re-anchors, invalidating stored anchors and any `guidance://` URIs) into the blast radius, the rollback line, and a regression test. As written, the T236 assertion in step 9 will fail, and the "no behaviour change beyond derivation" posture (D5) is contradicted.

**B2 [design] — The `REQ-659` registration omits the Appendix E Requirements Manifest row, which the coverage audit reads; done bars 5 and 6 are therefore unreachable.**
Plan lines 98-105 (bars 5/6), 124-126 and 148-163 (steps 2-5) name only the §5.1 map row, the §7.1a citation, the Appendix F `T787` row, and the register regeneration. `spec/appendices-reference.md:1143-1150` shows the Appendix E table ("`## Appendix E: Requirements Manifest`", `:95-102`, three columns `REQ | Title | Spec version`, last row `REQ-658`).
Predicate: `scripts/validate.ts:81-91` (`extractReqIndex` keys on the `| REQ     | Title` header), `:2025-2048` (`checkImplCoverage` builds every coverage row from that index), `:2169-2186` (a REQ cited in prose/Appendix F but absent from the index lands in `undefinedReqs`). A `REQ-659` header in §5.1 without an Appendix E row never appears in the coverage audit — so "shows `REQ-659` evidenced (not bucket A)" cannot be satisfied — and its citation from §7.1a and Appendix F is an undefined citation.
What must change: name the Appendix E row (`| REQ-659 | Slug derivation | 2026-11-14 |`) in the blast radius, in a phase step, and in the rollback line; add a done-bar clause that `validate` resolves the citation. This is exactly the spec-project "spec-addition blast radius" hard check.

**B3 [design] — `fitSlugToPath`'s return contract is undefined, and the persisted slug identity depends on it.**
Plan lines 173-177 (`fitSlugToPath(slug, stateDir, ext = ".json")` — "if `path.join(...).length > 240`, prepend `sha256(slug).slice(0, 8) + "-"`, truncate the slug to fit") and 183-187 ("`createNovel` delegates to the helper", sites use "the resolved state directory").
The name and body describe a **path** return; the call sites need a **slug** (registry key and `novel.slug`). Predicate: `holonovel/src/core/state.ts:1484` (`saveNovel` builds `path.join(this.stateDir, "novels", `${slug}.json`)` from the slug), `:1268-1272` (the slug is the `novels` map key and the persisted `novel.slug`), `index.ts:13574-13579` (rename rewrites every `<slug>.json*` file from the slug). If the helper returns a path, the implementer must invent the stem-extraction step and keep it identical at all five sites; if it returns a slug despite the name, the signature is misleading. Either way this is a decision the implementer must make — Stage 5 treats that as a blocker. Add the exact signature, return type, and the rule that the fitted value is what is stored as `novel.slug` and used as the map key, plus the `ext`/`stateDir` invariants.

### Majors

**M1 [design] — Derivation remaps `CON` to `con-1`, but the admission "stem before `-1`" rule as written would refuse `con-1`, breaking export→import round-trip.**
Plan lines 275-278 (Open question 1: "compare the slug stem (before `-1`, before `.json`) case-insensitively"), 188-198 (step 8a refuses "a reserved stem"), 263-268 (D8: derivation remaps, admission refuses).
If the admission predicate strips a trailing `-1` to find the stem (as the open question says), then a Novel this very code created as `CON` → `con-1` can never be admitted back. If it does not strip, the predicate differs from the stated one. State the two predicates separately: derivation compares the pre-remap stem, admission compares the literal stem, and add a round-trip case to `T787`/step 10.

**M2 [design] — T9's done-predicate is a false positive as written.**
`tasks.md:34-35`: `grep -n "toLowerCase().replace(/\[^a-z0-9\]" … ` must "return only the helper's own body".
Predicate: unrelated occurrences survive in `holonovel/src/index.ts` at `:3821`, `:6973`, `:7627`, `:12453`, `:16685` (plus `:3333` on a continuation line). The plan's done bar 3 is correctly scoped to the five named lines; the task predicate is not. Narrow it to the five `file:line` pairs and assert each is gone.

**M3 [design] — The REQ body as drafted trips the enumerated-catalog detector, putting done bar 6 at risk.**
Plan lines 148-154 write the body with six backticked reserved tokens (`` `CON`, `PRN`, `AUX`, `NUL`, `COM1–COM9`, `LPT1–LPT9` ``). Predicate: `scripts/validate.ts:206-211` flags any backticked list with `count > 5` as "catalog-as-requirement". Done bar 6 requires no warning increase, and Appendix M (per `AGENTS.md`) rejects enumerated catalogs in a REQ body. The reserved set must live in §7.1a (where it already is, `spec/04-runtime.md:30-31`) and the REQ must reference it, not restate it. Done bar 6's "reword until it clears" catches this only after the fact; name the constraint up front.

**M4 [design] — Done bar 8 ("`build-order` passes") is not satisfiable by the plan's own escape hatch.**
Plan lines 110-112 vs 230-234: the bar demands `npm run build-order` pass, while step 14 says a full-only gate "that cannot run in this environment is recorded as an environment Unknown". `build-order` (package.json:70) runs the full `check`, which includes `check-container-image`, `playability`, and `test:pipeline`; if one cannot run, `check` fails and `build-order` fails. Choose one: either the bar names which gates are in scope here and excludes the environment-bound ones explicitly, or it drops `build-order` and names `npm run check` with a documented exclusion. Do not leave a bar the plan itself permits violating.

**M5 [design] — Slug identity becomes machine-dependent, and the 240 refusal can reject a pack the same build just produced.**
Plan lines 173-177 measure `path.join(stateDir, "novels", slug + ext).length` — the **absolute** state directory. The same Novel name therefore yields a different slug on a different `DATA_DIR` (a long data dir shortens a name a short one would not), so `deriveSlug`/`fitSlugToPath` output is not the pure, portable identity D1 claims, and an export from a short-dir machine can trip step 8a's length refusal on import. State the intent (identity may be environment-derived, or the limit must be measured against a declared constant), and add the cross-directory case to the tests.

**M6 [design] — `rename`'s `new_slug` is an explicit identifier, and D8's rationale does not cover it.**
Plan lines 183-187 lump `rename` (`index.ts:13561`, `args.new_slug`) with the free-text sites, and lines 263-268 justify remapping because "the caller supplied a human name with no explicit slug". `new_slug` *is* an explicit slug today (trimmed only). With the new helper, `rename(new_slug: "CON")` silently becomes `con-1`, and `rename(new_slug: "!!!")` becomes `novel` rather than failing. Decide per site: derivation (free text) vs admission (explicit identifier → refuse), and say which posture `rename` takes.

**M7 [design] — Step 8a's enumeration command cannot establish "five sites is a measured count".**
Plan lines 194-198 scope the enumeration to `grep -n 'novels.*\.json' holonovel/src/index.ts`. Predicate: the other Novel-file writers are in `state.ts` — `:1484` (`saveNovel`), `:1581` (starter seeding writes `novels/<setting>.json` directly), `:13574-13579` is the rename rewrite in `index.ts`. Neither the counts nor "each is wired or refusing" is established by an index.ts-only grep. Widen to `holonovel/src`, and drop or verify the unverified `manage_archive (action: import)` premise (see Unknowns).

### Nits

**N1 [clarity] — Stale self-description.** Plan lines 23-24 still say "two pure functions, five call sites, one spec REQ, one Appendix F row, one harness hunk", while the plan now also edits admission (step 8a), §7.1/§7.1a prose, and (B2) Appendix E. Also line 64 calls `T236` a test that "already boots a server for adjacent cases" — `holonovel/scripts/test-output-contracts.ts:429-438` is unit-only; the boot is in the following `T48` test.

**N2 [design] — The underscore branch is not "symmetric with the asterisk branch" as the blast radius claims** (line 120). `/(^|\s)_([^_\s][^_]*)_(?=\s|$)/g` requires whitespace/end after the closing underscore, so `_GM only_, open the door` is not stripped, while `*Keeper only*, open the door` is (`anchors.ts:19`, `/\*[^*]+\*/g`). Either widen the boundary or state the asymmetry and its consequence.

**N3 [clarity] — The `"novel"` fallback makes every punctuation-only name collide** (plan line 171): `"!!!"` and `"???"` both become `novel`, resolved only by `STATE_CONFLICT` (`state.ts:1269`). Harmless, but state it, since done bar 2 treats the fallback as a tested contract.

## Unknowns

1. Whether `manage_archive (action: import)` writes `novels/*.json` at all (plan line 193-194). Budget exhausted before settling; the claim is load-bearing for step 8a's completeness.
2. `spec/audit/req-coverage.md:172` — the `REQ-194` → `T236` row (EV4/Q3) was not re-read; not load-bearing for any finding.
3. Whether validate's `catalog-as-requirement` issue (`validate.ts:210`) counts as an error or a warning in the default (non-`--sdd-strict`) run; the detector firing is verified, the severity class is not (M3).
4. Whether `check-container-image`, `playability`, and `test:pipeline` can run in this environment (M4).
5. Isolation: the five stages ran in one reviewer context (nesting prohibited). No authoring conversation was seen, but per-stage freshness is absent.
6. The report file could not be written (no write tool; read-only shell allowlist). File creation for `plan.cold/report.md` is the parent's step.

## Verified, no finding

- Plan sha256 matches; HEAD is `aa927c3`; target `holonovel/src/core/slug.ts` correctly flagged as new.
- EV6/EV7 exact: five inline sites at `state.ts:1268`; `index.ts:2283, 13561, 13687, 13714`.
- EV15: `isSafeSlug` at `data-dir.ts:141-145`, no reserved-stem or length check.
- EV9: `T786` is Appendix F's last row (`:2137`), `T236` at `:1699`; `T787` is free across `spec/` and `holonovel/scripts/`.
- EV11: `spec/02-requirements.md:9` §5.1 row ends `…425, 548`.
- EV12: shared lead sentence at `review-register.md:2722-2726`, `F-U3-1`/`F-U3-2` at `:2728-2736`; `ROADMAP.md:78-90` matches the cited section and trigger.
- EV17: `scripts/lib/contract-fingerprint.ts:37-43` `DATA_SECTIONS` excludes §5.1, §7.1, §7.1a — the fingerprint-safe claim holds.
- `check-registers --strict` exists (`scripts/check-registers.ts:22-28`); the CalVer-stability claim (plan line 133) is coherent: `scripts/version-bump.ts:19-33` targets the later of the root version (`2026.11.14`) and the newest CHANGELOG date (`2026-11-14`), so the version fields are a byte no-op.

## Stage 5 — readiness

No-go. B3 alone would stop an implementer (`fitSlugToPath`'s return type changes persisted identity); B1 makes the first done-bar item unsatisfiable as written; B2 makes the coverage-evidence bar unreachable. M1, M2, M4, and M7 additionally need decisions or corrected predicates before the plan can be executed without inventing the design.

independent-review: FAILED. plan.md — 3 blockers, 7 majors, 3 nits

1. [design] Done bar 1 asserts `set_active_state → set-active-state`, false at HEAD (`anchors.ts:21` deletes `_`, yielding `setactivestate`); fix the bar or add the punctuation-mapping change with its anchor-churn blast radius — plan.md:86-87,182
2. [design] `REQ-659` needs an Appendix E Requirements Manifest row; the coverage audit and citation resolution read that table, so bars 5/6 are unreachable without it — plan.md:98-105,124-126,148-163; `scripts/validate.ts:81-91,2025-2048,2169-2186`
3. [design] `fitSlugToPath` returns a path but the call sites need a slug for `novel.slug`, the `novels` key, and rename's file rewrite; specify the signature and the identity contract — plan.md:173-177,183-187; `state.ts:1268-1272,1484`

Majors: 7 · Nits: 3 · reads 38/40
