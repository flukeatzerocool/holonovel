# Independent review — rev 1

Reviewer: cold review subagent (`ses_e32adbee3ffejpYJqEfuP4pefS`), no authoring
context. Plan sha256 `68a6c227c4cecc940e783efb7cb7d3d802c4dc0cf0f707ae8185b60e7ae1240e`
(14889 bytes). Report persisted by the parent because the reviewer's dispatch
had no write tool; the text below is the reviewer's output verbatim.

Stages run: 1 FAIL · 2 PASS (faithful-with-gaps) · 3 FAIL · 4 not run (no
artifact edits during review) · 5 FAIL. Reads ~46/40.

## Blockers

1. **Blast radius omits REQ-309b–h.** The plan's §4.1 table and step 5 listed 19
   §5.10 bodies; the tree has 26. Seven bodies (`:3415`–`:3433`) carry bare
   `` `command` `` and would be left unedited, failing the done bar.
2. **Verification §6.3 was spec-wide and contradicted D1b.** The negative greps
   could not return empty while two §5.6 lines were deliberately retained.
3. **REQ-309b overflows the 800-character cap.** Measured 796–797 characters
   with three `command` tokens; a bare `command` → `run_command` substitution
   gives 808–809.
4. **The detector contract was missing.** No function name, signature, section
   scope mechanism, allowlist form, or report-only exit semantics.

## Majors

- M1 — D1b overstated the fingerprint consequence ("forced data-format
  transition"); REQ-423 says a stale fingerprint SHALL NOT block loading.
- M2 — REQ-196a's arithmetic was inconsistent (754 vs 800 reported as 24
  headroom).
- M3 — the §5.6 deferral had no truthful terminal disposition; a
  `Scheduled-roadmap` finding requires its REQs to appear in `ROADMAP.md`
  (`scripts/lib/register-checks.ts:64-68`).
- M4 — D2's "never in §5 normative text" would be violated by the retained
  §5.6 lines.
- M5 — D4's rationale did not single out `command`: Appendix W uses `→ scene`,
  `→ set_badge`, `→ combat`, none of which is a registered tool.
- M6 — the done bar was narrower than the roadmap's close condition.
- M7 — occurrence and body counts contradicted each other (twelve / 20 / 27).
- M8 — section-scoping the detector is the wrong guard shape; use an explicit
  allowlist.

## Nits

- N1 — T239/T261 vs T263 row naming.
- N2 — `spec/audit/req-coverage.md` listed as changed with no edit step.
- N3 — the "`scripts/test-validators.ts` does not exist" parenthetical is
  unnecessary.

## Unknowns

- U1 — evidence sidecar reported absent (the reviewer's dispatch had no shell;
  the parent verified it exists and is current).
- U2 — stage isolation collapsed; stages ran in one context.
- U3 — the 8-sentence cap was not located in `scripts/`.
- U4 — no gates executed (read-only dispatch).
- U6 — report not persisted by the reviewer.

`independent-review FAILED. [plan.md] — 4 blockers`

---

# Independent re-review — rev 2 (diff scope)

Reviewer: same cold subagent session, diff-only protocol, 7/10 reads.
Plan sha256 `55737113d38e346f76a382fc736d75e7467c1d92199fa1228019451ff263f37f`.

Verdict: **passed** — 0 Blockers · 4 Majors · 4 Minors. Rev-1 Blockers B1–B4
confirmed adequate. The new §5.16 claim was verified: `REQ-385a` is inside
`### 5.16` (`spec/02-requirements.md:3858`), a package-format fingerprint
section; deferral set is exactly {REQ-221b, REQ-330a, REQ-385a}; the four
spec-wide survivors match (`:900`, `:1542`, `:1826`, `:3906`).

Majors raised and resolved in rev 3 by the author (build-review verifies):

- M1 — `REQ-425` does not exist; startup reconciliation is REQ-651 and the
  health surface REQ-652. Citations corrected.
- M2 — a §5.16 change does not re-serialize; REQ-420 holds installed packages
  inactive with `[package-incompatible]`. Consequence and citation corrected.
- M3 — `register-checks` matches exact tokens, so the roadmap section must name
  the suffixed IDs. Corrected in §4.3 and in the task list.
- M4 — the deferral covered only the data tier; the roadmap trigger now names
  both tiers because REQ-385a sits behind the package fingerprint.

Minors resolved: bare/call split corrected to 8/18; REQ-196a landing corrected
to 758; gate findings moved to stderr per the AGENTS stdout/stderr convention;
the REQ-309b sum replaced with a measured-landing range.

`independent-review passed.`

---

# Rev 3 binding (build-time amendment)

Plan sha256: e4d8000603c22d70417ceea418150b933bb6ab07cdee01f14bc0426b623107cd

Rev 3 is rev 2 plus the four Major fixes the re-review raised (REQ-651/REQ-652
citations, the REQ-420 inactive-set consequence, suffixed IDs in the roadmap
section, both fingerprint tiers in the deferral trigger) and two Minors
(bare/call split, stderr for gate findings). No new files, gates, or
destructive operations were added, so this is the condition-only amendment
path: the standard-depth re-review cap (1) was reached, no further cold pass
was run, and `build-review` verified C-1–C-4 during execution. This line binds
the report to the executed plan; it is not a claim that the cold reviewer read
rev 3.

`independent-review passed.`
