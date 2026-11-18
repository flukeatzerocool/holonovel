# Diff re-review — Roadmap drain 11 (revision 2)

Reviewer: independent cold reviewer (opencode-go / deepseek-v4.1-flash), diff pass.
Artifact: `plan.md`, revision 2 (400 lines), sha256 as supplied. Companion: `tasks.md` (checked where its lines are named). Evidence: `plan.evidence.md` (not re-read; r1 already bound it).
Scope: changed text only. Reads used: 10 of 10. Isolation note: a host injected `holonovel/AGENTS.md` mid-run; unrelated to any claim under review and not used as evidence.

## Per-finding verification

| r1 finding | New evidence | Verdict |
|---|---|---|
| **B1** register stale in P2, written in P5 | `plan.md:333` puts `npm run validate -- --write-register` in P2's acceptance; `:352` reduces P5 to `PASS: Coverage register is current`; P3 `:341-342` and V1 `:369` now match; `tasks.md:32` agrees. The second-order risk is closed: `renderCoverageRegister` writes the hash line only when `specHash` is non-null (`scripts/validate.ts:2185`) and the committed register carries none (`spec/audit/req-coverage.md:1-6`), and `grep -c "Spec hash" holonovel.md` = `0`. P3's `assemble` therefore cannot re-stale the register. | **Resolved** |
| **M1** wrong register diff predicate | `plan.md:251` names `spec/audit/req-coverage.md:189` = `\| REQ-211 \| … \| E \| S22 \| — \|` (verified) and predicts `S22` → `S22, T253` (`:335`, `tasks.md:34,71`); `:252` states the register is family-keyed and no `REQ-211c` row exists. Cell ordering is right (`S` sorts before `T`, matching the `T179, T784` idiom at `:188`). | **Resolved** |
| **M2** sub-check enumeration unasserted | Clause (f) at `plan.md:142-145` requires a `- **(<lowercase letter>) <name>** — <result>` bullet; the live shape matches (`holonovel/DECISIONS.md:2519-2521`); the claim now reads clauses (a)–(f) (`:151`). | **Resolved** |
| **M3** baseline schema | Literal skeleton with `schema_version`/`purpose`/`classes`/`entries` (`plan.md:184-192`), entry fields `req`/`tid`/`class`/`evidence` (`:193-194`), sort `(req, tid)`, `req` mirrors `LinkageFinding.reqId`, and `LINKAGE_CLASSES` named authoritative with header mismatch → `invalid` (`:194-197`). `req` vs `reqId` settled. | **Resolved** |
| **N1** record extent defined twice | Extent is now stated once (`:130-134`) and clause (f) adds the seventh-label requirement coherently — **but the rewrite introduced a new contradiction, M4 below.** | **Resolved in form, 1 regression** |
| **N2** "class" overload | Disambiguated inline (`:174-176`); blast radius says "disposition-class header" (`:288`). | **Resolved** |
| **N3** exercised-ID mechanism caveat | P2 accept states reachability + D9 probe are the proof, not the count drop, and names `req-checks.ts:864-868` (`:330-332`). | **Resolved** |
| **N4** dated termination line | `:258-262` states prose *carrying a date* and cites both the bullet rule (`register-checks.ts:60-72`) and the date rule (`:61`). | **Resolved** |
| **N5** loop-artifacts cite | P1 cites `:72-74` for `tasks.md`; P5 cites `:79-84` for the LOOP token (`:320`, `:356`). | **Resolved** |
| **N6** `--single` | Justified at `:359-363` (the T87 correction is a prerequisite of the single product; splitting would add a baseline entry the next commit rewrites). | **Resolved** |
| **N7** V7/V8 anchor predicate | V7 now runs `npm run check-anchors`; V8 names the same gate as the anchor-delta predicate plus `git diff --stat holonovel/src` (`:375-376`). Executable. | **Resolved** |

## New findings (changed lines only)

### Major

**M4 — [design] Clause (a)'s record extent no longer tolerates the blank line between the marker and the first bullet; as written it rejects the live record, contradicting P1's and P2's acceptance.**
`plan.md:130-132` defines the record as "the contiguous `- ` bullet run **immediately following** the marker, ending at the **first non-bullet** line". The live block is `@section evidence` at `holonovel/DECISIONS.md:2511`, a **blank line at `:2512`**, then bullets at `:2513`. A blank line is a non-bullet line, so a literal implementation ends the run at `:2512` and finds zero bullets — clause (a) fails on the unmodified tree. That contradicts `plan.md:318` ("the six labels … satisfy D2's clauses by inspection") and `plan.md:330` ("`checkEvidenceRecordContract` reports nothing on the unmodified tree"). The r1 text this replaced said "the first non-bullet, **non-blank** line" (`review-r1.md:89`), which was correct; the N1 rewrite dropped the tolerance.
Must change: restore "ending at the first non-bullet, non-blank line", or say "blank lines between the marker and the run are skipped". One clause; nothing else in the plan depends on the stricter reading.

### Nit

**N8 — [clarity] "the six diff cases D3 names" is not an executable count.** `plan.md:348-349` requires self-tests for "the six diff cases D3 names", but D3 (`:161-208`) enumerates at least eight distinguishable cases (suppress only on `automated-unexercised`; other verdicts unsuppressible; stale; invalid class; empty evidence; duplicate key; classes-header mismatch; missing file). Name the cases or drop the count so V4's "with the new diff and T253 cases counted" (`:372`) is checkable.

## Unknowns

1. Whether `specHash` is null because `holonovel.md` lacks a "Spec hash:" line or for another reason — irrelevant to the verdict, since the committed register demonstrably carries no hash line and `holonovel.md` does not contain the string.
2. Whether the `(a)`/`(b)`/`(c)` bullets' `<name>` fragments are stable across future records — clause (f) only needs one match, so this is not a gate risk.

## Coverage / verdict

All eleven r1 findings are addressed in the changed text, and the B1 phase-order fix, the M1 predicate, and the M3 schema are now evidenced against the tree. The single regression is textual: the N1 rewrite tightened the record extent past what the artifact supports, and it contradicts two of the plan's own acceptance lines.

`Diff re-review: all 11 r1 findings RESOLVED | 0 unresolved`

`independent-review FAILED.`
`New: Blockers 0 · Majors 1 · Nits 1`

1. **M4** — clause (a)'s "first non-bullet line" ends the record at the blank line `holonovel/DECISIONS.md:2512`, so the parser fails on the unmodified tree, contradicting `plan.md:318` and `:330`; restore "non-blank" from r1.
2. **N8** — "the six diff cases D3 names" (`plan.md:348`) is not a countable set; name the cases.
3. Everything else checks out: P2 owns the register write, P5 only verifies, V1/P3/P4 agree, `REQ-211` cell is `S22` → `S22, T253`, `LINKAGE_CLASSES` precedence and the JSON skeleton are stated, and the seven Nits are fixed without cross-phase contradiction.

---

## Resolution of M4 + N8 (condition-only amendment, revision 3)

Fixed in the plan text, not re-reviewed per plan-review's condition-only-amendment rule:

- **M4** — clause (a) now reads: the record is the contiguous `- ` bullet run that follows the
  marker, "blank lines between the marker and the run are skipped, and the run ends at the first
  non-bullet, non-blank line".
- **N8** — P4 now names the eight self-test cases explicitly (suppression only on
  `automated-unexercised`; other verdicts unsuppressible; stale key; class outside
  `LINKAGE_CLASSES`; empty evidence; duplicate key; `classes`-header mismatch; missing file) plus
  the five T253 parser cases.

Residual condition for `build-review`: **C-1** — confirm clause (a) admits
`holonovel/DECISIONS.md:2511-2522` (marker, blank line, six labels, sub-check bullets) before
writing the parser.
