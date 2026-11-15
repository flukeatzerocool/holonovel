# Plan — Identifier-derivation conformance (ROADMAP P1)

Status: draft v3 (self pass + cold pass: 3 blockers and 7 majors fixed; one
re-review at the standard cap returned 1 blocker + 1 major + 2 nits, all fixed
and recorded as residual risk rather than re-verified) ·
Kind: planned · Depth: standard
Increment target: `docs/plans/2026-11-14-identifier-derivation-conformance/`
Rollback cost: 1 (one revert: the plan directory, `slug.ts`, the anchor and slug
call sites, the admission refusal clause, the test harness hunk, `REQ-659` + the
§5.1 map row + the Appendix E manifest row, the Appendix F row,
`spec/04-runtime.md` §7.1/§7.1a, the two register dispositions, the
`ROADMAP.md` section, the assembled `holonovel.md` + `holonovel/holonovel.md`,
`spec/audit/req-coverage.md`, `CHANGELOG.md`)
Evidence class: repo (EV1 and EV2 are `tool-output`; every other premise is a
`file:line` read or command output at HEAD `aa927c3`)
Trust boundary: working tree only; no web, user, or fetched content enters the plan.

## Questions

1. **Which item is next?** The user selected `ROADMAP.md:78-90` § *Identifier-
   derivation conformance (P1)* over the sweep's next chunk (U4). The governance
   rule in `AGENTS.md` "Finding triage" makes P1 (a normative rule with no
   evidenced implementation) outrank the P2 sweep chunks, and both P1 findings
   are already register rows from U3 (`F-U3-1`, `F-U3-2`). U4 stays pending for
   the next *allocated review session*.
2. **Is the item one session?** Yes: two pure functions, five derivation sites,
   one admission refusal, one consolidated guard test (`REQ-659`), one spec REQ
   plus its three registration rows (map, manifest, catalogue), one harness
   hunk. No new dependency (`D5`).
3. **What is the spec-side gap?** `§7.1a` is normative prose (`spec/04-runtime.md:29-34`)
   with **no REQ body**: `REQ-194a`/`REQ-194b` cover anchors only
   (`spec/02-requirements.md:216-220`), and the coverage register's `REQ-194` row
   cites `T236`, the anchor test (`spec/audit/req-coverage.md:172`). So the
   slug rules are untracked by the coverage audit — the increment must add the
   REQ, not only the code (`D2`). Registration is four rows, not one: the body,
   the §5.1 map row, the Appendix E manifest row the coverage audit keys on
   (`scripts/validate.ts:81-91`), and the Appendix F catalogue row.
4. **Which slug sites are in scope?** Two classes, and they behave differently
   (`D7`). *Derivation* sites, which turn free text into a Novel state path:
   `createNovel` (`holonovel/src/core/state.ts:1268`), the startup
   `TTRPG_NOVEL` slug (`holonovel/src/index.ts:2283`), and the `rename`, `clone`,
   and `branch` actions (`:13561`, `:13687`, `:13714`). *Admission* sites, which
   receive a slug from outside and write a state path for it: Novel-pack
   admission is the confirmed one (`holonovel/src/index.ts:14249`,
   grammar-checked by `isSafeSlug`); whether archive import writes a state path
   at all is left to step 8a's enumeration rather than asserted here. Admission
   refuses an unsafe slug rather than rewriting the pack's identity. Adventure- and ruleset-slug builders
   (`holonovel/src/core/adventure.ts:296`, `holonovel/src/index.ts:12453`) stay
   out of scope (`D4`).
5. **Does a slug-safety predicate already exist?** Yes: `isSafeSlug`
   (`holonovel/src/core/data-dir.ts:143-145`) gates Novel, adventure, ruleset,
   and artifact slugs, and its header comment says it "mirrors the
   create/rename sanitizer". The reserved-name set exists nowhere in
   `holonovel/src` (`grep -rni 'COM1\|LPT1' holonovel/src` — no hits), so the
   new rule extends the existing grammar's neighbourhood rather than inventing
   a second notion of safety (`D7`).

## Baseline at HEAD (this session)

| # | Evidence | Command / source | Trust |
|---|---|---|---|
| EV1 | Tree clean on `main`, HEAD `aa927c3`, version `2026.11.14`, 93 unpushed commits, 6 open roadmap items | `git status --porcelain`; `npm run status` | tool-output |
| EV2 | Fast gate green: 41 passed, 0 failed, `check:fast: PASS` | `npm run check:fast` (un-piped, exit 0) | tool-output |
| EV3 | The roadmap item, its trigger, and its two clauses | `ROADMAP.md:78-90` | repo |
| EV4 | §7.1 claims "asterisk **or** underscore emphasis" markers; §7.1a requires reserved-name avoidance and a 240-character path ceiling | `spec/04-runtime.md:18-22`, `:24-34` | repo |
| EV5 | `deriveAnchor` strips `*…*` only, then lowercases and strips `[\p{P}\p{S}]`; `_GM only_ The Door` therefore derives `gm-only-the-door` | `holonovel/src/core/anchors.ts:15-24` | repo |
| EV6 | `createNovel` slugifies and trims hyphens only. No reserved-name set and no path-length guard exist: `grep -rni 'COM1\|LPT1' holonovel/src` has no hits, and `grep -rn '240' holonovel/src` returns only three text-truncation slices (`core/wisdom.ts:449`; `index.ts:586,18221`) — none is a path check | `holonovel/src/core/state.ts:1267-1269`; two greps over `holonovel/src` | repo |
| EV7 | The same inline derivation is repeated at four further sites (`startupNovel`, `rename`, `clone`, `branch`) | `holonovel/src/index.ts:2283,13561,13687,13714` | repo |
| EV8 | `REQ-194a`/`REQ-194b` are the only anchor REQs, and no REQ body states a slug rule | `spec/02-requirements.md:216-220`; `grep -n 'REQ-194\|Slug' spec/02-requirements.md` | repo |
| EV9 | Appendix F's last row is `T786`; `T787` is free, and rows are `# / Type / Test / Requirements` | `spec/appendices-reference.md:1428`, `:2137` | repo |
| EV10 | The anchor harness test is `T236`, near the end of `test-output-contracts.ts`; it is **unit-level** against `deriveAnchor` (no server boot — the boot belongs to the following `T48` test) | `holonovel/scripts/test-output-contracts.ts:429-441` | repo |
| EV11 | The §5.1 map row enumerates `…184, 194, 277, 280, 425, 548`; a new REQ must be added to that row (`checkSectionIndexCompleteness`, `scripts/validate.ts:1212-1247`) | `spec/02-requirements.md:9`; validator read | repo |
| EV12 | The two findings and their predicates | `spec/audit/review-register.md:2725-2734`; `docs/plans/2026-11-14-unscoped-u3/review.md:35-36` | repo |
| EV13 | `spec/audit/req-coverage.md` is a generated register (regenerated by `npm run validate -- --write-register`) | `AGENTS.md` "Before committing" | repo |
| EV14 | Validation baseline: **not yet measured this session** — step 1 records it; the warning count is the bar the increment must not exceed | `npm run validate:sdd` (step 1) | tool-output (pending) |
| EV15 | A slug-safety grammar exists: `SAFE_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/` and `isSafeSlug`, whose header says it mirrors the create/rename sanitizer; it does not check reserved stems or length | `holonovel/src/core/data-dir.ts:138-146` | repo |
| EV16 | Novel-pack admission takes a slug from the pack or `args.slug`, refuses a mismatch with the pack, refuses an unsafe slug, and admits a duplicate under the first free suffix — so it is a second writer of `novels/<slug>.json` that the derivation-only scope would miss | `holonovel/src/index.ts:14249-14254` | repo |
| EV17 | No specification section this increment edits is fingerprinted: `DATA_SECTIONS` is §5.6, §5.9, §5.19, §5.21–§5.28 (a subset), §5.31, §5.32, §7.7, and Appendix Q — not §5.1 and not §7.1/§7.1a, so `contract-fingerprints.ts` is untouched | `scripts/lib/contract-fingerprint.ts:30-43` | repo |

## Objective

Make the two identifier rules the spec already states true of the code that
derives identifiers, and put the slug rule under a REQ so the coverage audit can
see it: §7.1's underscore role marker and §7.1a's reserved-name and 240-character
rules.

## Done bar

**Done bar:** both rules implemented and tested, `REQ-659` registered and
evidenced, the two findings resolved, gates green — the numbered form below is
authoritative.

1. `deriveAnchor("_GM only_ The Door") === "the-door"`, and identifier
   headings are unchanged: `deriveAnchor("set_active_state") === "setactivestate"`
   — the same value HEAD produces, because `anchors.ts:21` deletes underscores
   rather than hyphenating them. The increment does **not** change that: mapping
   a mid-token `_` to `-` would re-anchor every underscore-bearing heading in
   every indexed ruleset (`D5`).
2. `deriveSlug("CON") === "con-1"`, `deriveSlug("aux") === "aux-1"`, and a
   300-character name yields a primary state path of at most 240 characters
   against a short `stateDir`. Every `deriveSlug` result satisfies `isSafeSlug`,
   including punctuation-only input (`"!!!"`), which yields a non-empty
   fallback stem rather than `""`.
3. All five derivation sites call the shared helper; no inline
   `toLowerCase().replace(/[^a-z0-9]+/g, "-")` remains at
   `holonovel/src/core/state.ts:1268` or `holonovel/src/index.ts:2283,13561,13687,13714`.
4. The admission path (step 8a) refuses a reserved-stem or over-length Novel
   slug with `[INVALID_INPUT]` naming the rule, and the refusal is tested.
5. `REQ-659` is registered everywhere the coverage audit reads: a §5.1 body in
   the `**REQ-NNN — Title.**` shape (one paragraph, ≤8 sentences, ≤800
   characters) with an `_Check:_ T787` tail; a row in the **Appendix E
   Requirements Manifest** (`| REQ-659 | Slug derivation | 2026-11-14 |`);
   `659` in the §5.1 map row; a `T787` row in Appendix F's exact four-column
   form; and a citation from `spec/04-runtime.md` §7.1a. `npm run validate`
   resolves the citation (no `undefinedReqs` entry).
6. `npm run validate` (full) reports **0 errors** and no warning increase against
   the step-1 baseline (reword the new prose until it clears, rather than
   accepting a new warning); the implementation-coverage audit shows `REQ-659`
   evidenced (not bucket A) after `--write-register`.
7. `F-U3-1` and `F-U3-2` are dispositioned `Resolved` in
   `spec/audit/review-register.md` with their `ROADMAP.md` citation replaced,
   and the `ROADMAP.md` section is removed; `npm run check-registers -- --strict`
   and `npm run check-roadmap` pass.
8. The gates pass un-piped: `npm run assemble`, `npm run validate` (0 errors),
   `npm run check:fast` prints `check:fast: PASS`, `npm run build-order` exits 0,
   and `npm run session:close` commits. `build-order`'s exit status is the
   authority for the three full-only gates it reaches
   (`check-container-image`, `playability`, `test:pipeline`): a gate that
   self-skips has already exited 0 (`check-container-image.ts:42-47` does this
   when docker is absent), and its notice is copied verbatim into `aar.md` as an
   environment note; a gate that exits non-zero is a failure to fix, never an
   Unknown. No push.
9. `aar.md` ends `LOOP PAUSED`.

## Blast radius

| File | Change | Size |
|---|---|---|
| `holonovel/src/core/slug.ts` | **new** — `deriveSlug` plus the `stateDir`-aware `fitSlug` | S |
| `holonovel/src/core/anchors.ts` | underscore role-marker branch (whitespace-opened, non-word-closed), identifier-safe | S |
| `holonovel/src/core/state.ts` | `createNovel` delegates to the helper (one line) | S |
| `holonovel/src/index.ts` | four derivation call sites delegate to the helper; the Novel-pack admission path gains the reserved-stem and length refusal | S |
| `holonovel/scripts/test-output-contracts.ts` | one new `T787` test; the `T236` test gains the underscore case | S |
| `spec/02-requirements.md` | `REQ-659` after `REQ-194b`; the §5.1 map row gains `659` | S |
| `spec/04-runtime.md` | §7.1a cites `REQ-659`; "Consider:" becomes a `SHALL` clause; §7.1 gains one sentence pinning the underscore rule | S |
| `spec/appendices-reference.md` | one `T787` row after `T786` (`:2137`); `T236`'s text names the underscore assertion; one **Appendix E** manifest row after `REQ-658` (`:1143-1150`) | S |
| `spec/audit/req-coverage.md` | regenerated by `npm run validate -- --write-register` | S |
| `spec/audit/review-register.md` | two dispositions plus the shared "Scheduled under" lead sentence (`:2722-2724`), split so the remaining §7.3a pointer survives | S |
| `ROADMAP.md` | remove the section (`:78-90`) | S |
| `holonovel.md`, `holonovel/holonovel.md` | regenerated by `npm run assemble` | S |
| `docs/plans/2026-11-14-identifier-derivation-conformance/{plan,tasks,aar}.md` | this increment's record | S |
| `CHANGELOG.md` | dated `2026-11-14` entry | S |
| version fields + README `@spec:` markers | **conditional** — `build-order` steps 5/5b are byte no-ops while the CalVer date equals the session date | S |
| read-only (not modified) | `holonovel/src/generated/contract-fingerprints.ts` (no fingerprinted section is edited — EV17), `holonovel/src/core/data-dir.ts` (`isSafeSlug` is reused, not changed), `holonovel/DECISIONS.md`, `scripts/**`, `.githooks/**` | — |

**User impact.** A new Novel named with a Windows-reserved stem now gets a `-1`
suffix (`CON` → `con-1`), and a very long name gets a hashed, shortened slug;
both are visible in `manage_novel (action: list)`/`(action: info)`. Novels
already on disk keep their filenames — hydration only reads — so there is no
migration and no reload requirement.

## Phases and tasks

### Phase 1 — Baseline and spec

1. Record the baseline: `npm run validate:sdd` un-piped, capture the error and
   warning counts and write them into `aar.md` as the comparison bar (EV14).
2. Add `REQ-659 — Slug derivation.` to `spec/02-requirements.md` after
   `REQ-194b` (`:220`). Body: the core derivation shared with `REQ-194`, the
   reserved-stem remap specified in §7.1a, the primary-path ceiling with its
   deterministic shortening, and the hyphen trim. Do **not** enumerate the
   reserved names in the body — `scripts/validate.ts:206-214` fails any
   backticked list of more than five tokens, and Appendix M keeps catalogs out
   of REQs; cite §7.1a instead. One paragraph, ≤8 sentences, ≤800 characters,
   ending `_Check:_ T787.`
2a. Add the Appendix E manifest row `| REQ-659 | Slug derivation | 2026-11-14 |`
    after `REQ-658` (`spec/appendices-reference.md:1143-1150`). The coverage
    audit indexes REQs from that table (`scripts/validate.ts:81-91`), so without
    it `REQ-659` never appears in `spec/audit/req-coverage.md` and its §7.1a and
    Appendix F citations resolve as undefined.
3. Add `659` to the §5.1 map row (`:9`). Re-run `npm run validate` — a missing
   map entry fails `checkSectionIndexCompleteness`.
4. Edit `spec/04-runtime.md` §7.1a: cite `REQ-659`, replace the hedging
   "Consider: prepend a short hash" with the `SHALL` form the code implements,
   and state the reserved-name list exactly as the code compares it. Add one
   sentence to §7.1 pinning the underscore rule: an underscore span inside an
   identifier token (e.g. `set_active_state`) is not a role marker.
5. Add the Appendix F `T787` row after `T786` (`spec/appendices-reference.md:2137`)
   and extend `T236`'s row (`:1699`) to name the underscore assertion.

### Phase 2 — Code

6. Create `holonovel/src/core/slug.ts`:
   - `deriveSlug(name: string): string` — lowercase, `[^a-z0-9]+` → `-`, trim
     hyphens (the current inline rule, so existing names keep their slugs), then
     the reserved-stem remap (`-1`), then a `"novel"` fallback when the result is
     empty. Every return satisfies `isSafeSlug` (`core/data-dir.ts:143`).
   - `fitSlug(slug: string, stateDir: string, ext = ".json"): string` — returns
     the **fitted slug**, never a path. Invariant: the result `r` satisfies
     `path.join(stateDir, "novels", r + ext).length <= 240`; when the input
     already fits, `r === slug`. Otherwise prepend
     `sha256(slug).slice(0, 8) + "-"`, truncate, and re-trim trailing hyphens,
     so the result still satisfies `isSafeSlug`. Deterministic for a given
     `(slug, stateDir, ext)` — and deliberately dependent on `stateDir` (`D10`).
   - **Identity contract.** The value returned by
     `fitSlug(deriveSlug(name), stateDir)` is the slug written to `novel.slug`,
     used as the `novels` map key, and used as the file stem by `saveNovel`
     (`state.ts:1484`) and the rename rewrite (`index.ts:13574-13579`). No call
     site re-derives or re-truncates it.
   Both carry a `REQ-659` header citation.
7. Patch `deriveAnchor` (`anchors.ts:18-24`): add the underscore branch
   `/(^|\s)_([^_\s][^_]*)_(?=\W|$)/g` alongside the existing
   `/\*[^*]+\*/g`; the replacement is `$1`, i.e. the span **and both
delimiters are deleted**, so `_GM only_ The Door` loses the marker rather than
   keeping its text. The opening boundary (start or whitespace) is what keeps
   `set_active_state` untouched — mid-token underscores are deleted by the
   punctuation strip (`:21`), exactly as at HEAD, so identifier headings do not
   re-anchor (`D5`). The closing lookahead accepts any non-word character, so
   `_GM only_, open the door` strips like `*Keeper only*, open the door`.
   Do not broaden the asterisk branch.
8. Replace the inline derivation at the five sites (`state.ts:1268`;
   `index.ts:2283,13561,13687,13714`) with `deriveSlug` + `fitSlug` using the
   resolved state directory (`this.stateDir` in `StateManager`, `DATA_DIR` in
   `index.ts`). `rename` is a derivation site, not an admission site: it
   sanitizes `new_slug` today, so it keeps that posture — the returned slug is
   what the OK message and `manage_novel (action: list)` report, and a collision
   still returns `[STATE_CONFLICT]` (REQ-256a/REQ-256b) (`D11`). Hydration is
   untouched: existing save files keep their filenames (REQ-065), so no
   migration and no rename-on-load.
8a. Close the admission boundary: extend the Novel-pack admission check beside
    `isSafeSlug` (`index.ts:14249`) to refuse a **literal** reserved stem (so a
    slug this build produced, `con-1`, is admissible) and a slug whose primary
    path would exceed 240 characters, with `[INVALID_INPUT]` naming the rule.
    Refuse rather than rewrite: the pack's internal slug is its identity, and a
    silent rename would leave the file's slug diverging from its content
    (REQ-088h1, `D8`). Then enumerate every Novel-path writer over the whole
    server tree — `grep -rn 'novels.*\\.json' holonovel/src` — and record in
    `aar.md` that each is derived through the helper, a fixed content slug (the
    starter), or an admission refusal. The enumeration, not this plan's count,
    is the authority.

### Phase 3 — Tests

9. Extend the `T236` test (`holonovel/scripts/test-output-contracts.ts:429`) with
   `_GM only_ The Door → the-door`, `_GM only_, The Door → the-door` (the comma
   boundary proves the `(?=\W|$)` lookahead), and the identifier regression
   asserting `set_active_state → setactivestate` (the HEAD value, unchanged). Then add a `T787/REQ-659` test in the same file:
   reserved stems (`CON`, `AUX`, `COM1`), hyphen trimming, determinism, the
   `"!!!"` fallback, `isSafeSlug` compliance for every case, a 300-character
   name whose `fitSlug` result yields a ≤240-character path and is identical
   across two runs, the **cross-directory** case (the same name under a short
   and a long `stateDir` — the long one shortens, the short one does not), and
   the **round-trip** case (`con-1` passes admission while `con` is refused).
10. Exercise the wiring: `manage_novel (action: create, name: "CON")` reports a
    `con-1` slug; `manage_novel (action: rename, new_slug: "CON")` reports
    `con-1` and the file is named for it; Novel-pack admission of a reserved or
    over-length slug is refused with `[INVALID_INPUT]` naming the rule — so the
    helper is proven wired at both boundaries, not only unit-tested.

### Phase 4 — Bookkeeping, AAR, gates, close

11. Regenerate `spec/audit/req-coverage.md`
    (`npm run validate -- --write-register`) and confirm `REQ-659` is evidenced
    rather than bucket A.
12. Dispose `F-U3-1` and `F-U3-2` as `Resolved` under a dated
    `### 2026-11-14` heading, with the resolving test cited. The shared lead
    sentence (`review-register.md:2722-2724`) cites both this roadmap section and
    the §7.3a one; split it so `F-U3-3`/`F-U3-4` keep their §7.3a pointer while
    the two resolved rows lose the dead citation. Delete the `ROADMAP.md` section
    (`:78-90`) in the same step.
13. Write the `CHANGELOG.md` entry dated `2026-11-14`; write `aar.md` ending
    `LOOP PAUSED`, with the gate block a placeholder until step 14.
14. Gates un-piped, exit codes captured, in order: `npm run assemble` →
    `npm run validate` (compare to step 1) → `npm run check-registers -- --strict`
    → `npm run check-roadmap` → `npm run build-order` → `npm run check:fast` →
    `npm run session:close`. Amend `aar.md` with the measured results first.
    `build-order` runs the full `check`, which includes the full-only gates
    (`check-container-image`, `playability`, `test:pipeline`). Its exit status is
    the authority: a self-skipping gate has already exited 0 (its notice is
    copied verbatim into `aar.md`), and a non-zero exit is a failure — fixed as
    its own commit when it touches an untouched surface, or in-session when a
    plan hunk caused it.

## Decisions

- **D1 — Unit.** Two derivation predicates: an anchor deriver and a slug
  builder, plus one fitting step that is deliberately `stateDir`-dependent.
  Everything else is wiring.
- **D2 — Spec and code land together.** The roadmap trigger permits either
  direction; the increment implements the spec (`D3`) *and* gives the rule a REQ,
  because §7.1a is currently invisible to the coverage audit (Q3).
- **D3 — Implement over narrow.** The roadmap offers "add the underscore branch
  or narrow §7.1 to asterisk markers". Implement: underscore emphasis is common
  in ruleset headings, and narrowing would leave a real heading class
  mis-anchored.
- **D4 — Novel state paths only.** The reserved-name and ceiling rules guard
  identifiers that become `<DATA_DIR>/novels/<slug>.json`. Adventure and
  ruleset slug builders are a different filename contract (authored module
  files, installer-validated packages) and are recorded as out of scope; a
  demonstrated collision there would be a new finding, not a silent widening.
- **D5 — No behaviour change beyond derivation.** Derivation only runs at
  create/rename/clone/branch/startup, never at load; a Novel already on disk is
  read by its existing filename.
- **D6 — 240 covers the primary path.** Backups (`<slug>.json.bak.N`, REQ-238)
  are derived and cannot be sized before the backup config is read; the spec's
  own remedy ("prepend a short hash if the slug alone would produce a path
  exceeding the limit") is satisfied by capping the primary path.
- **D7 — One safety grammar.** `isSafeSlug` (`core/data-dir.ts:143`) is the
  existing "is this a writable slug" predicate and already mirrors the
  create/rename sanitizer. `deriveSlug` and `fitSlug` are built so their
  output always satisfies it, and `isSafeSlug` is not duplicated or changed.
- **D8 — Derivation remaps, admission refuses.** A derived slug is repaired
  (`con` → `con-1`) because the caller supplied a human name with no explicit
  slug. An admitted slug is refused (`[INVALID_INPUT]`) because it is the
  pack's identity; rewriting it would leave the save file's slug diverging from
  the pack's content (REQ-088h1). The archive-import path is enumerated in step
  8a and takes the same posture.
- **D9 — Existing-check discovery.** No plan step adds a gate: the reserved
  set is a pure predicate exercised by `T787`, so no duplicate checker is
  introduced (`AGENTS.md` "Existing-check discovery").
- **D10 — Slug identity is `(name, stateDir)`-derived, by the spec's own
  wording.** §7.1a caps the *full state path*, so the fit step must read the
  state directory and the same name can yield a different slug on a machine with
  a longer `DATA_DIR`. That is the stated contract, not an accident, and it is
  recorded: a pack whose slug is legal on the exporting machine can be refused
  on a receiver with a longer path (`D8`), which is the rule working. The
  portability consequence is recorded in the AAR as a P3 with this predicate; a
  spec clarification would be a future increment, not this one.
- **D11 — `rename` derives, it does not admit.** `args.new_slug` is sanitized
  today (`index.ts:13561`), so the increment keeps the sanitizing posture and
  makes the result visible: the OK message and `manage_novel (action: list)`
  report the slug actually written (REQ-256b). A user who wants a specific slug
  sees the remap rather than discovering it on disk. Refusal is reserved for the
  admission boundary, where the slug belongs to an external artifact (`D8`).

## Open questions

1. **Stem or filename for the reserved check?** Two predicates, not one.
   **Derivation** compares the pre-remap stem, which is the name's own stem
   (`con`), and appends `-1`. **Admission** compares the literal stem only, so
   `con-1` — a slug this code produced — is admissible and the export→import
   round-trip holds (`D8`, `T787`). Both are case-insensitive and both ignore the
   extension. No user decision needed.
2. **Should `T787` live in `test-output-contracts.ts`?** Yes: `T236` already does
   unit-level identifier tests there, and a new harness file would need its own
   gate wiring. Step 10's server-level cases reuse the same harness.
3. **What happens to punctuation-only names?** `"!!!"` and `"???"` both derive
   `novel`, so the second Novel of that kind returns `[STATE_CONFLICT]` from the
   existing duplicate guard (`state.ts:1269`). That is a visible, deterministic
   outcome and better than HEAD's `""` (which produced the path `novels/.json`);
   the collision is stated here so `T787` asserts one fallback slug, not
   uniqueness.
