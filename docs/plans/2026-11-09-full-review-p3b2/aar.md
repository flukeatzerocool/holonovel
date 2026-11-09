# AAR — full-review sweep, chunk P3b-2 (§5.6 entities and NPCs)

**Date:** 2026-11-09 · **Scope:** chunk P3b-2 (93 REQs, 30 families), register /
roadmap / changelog write-back. **Plan:**
`docs/plans/2026-11-09-full-review-p3b2/plan.md` (sha256 `ee5cb3af…`, stamped
fresh, standard depth; cold report `/tmp/opencode/p3b2-independent-review-final.md`).

## What happened

1. Baseline measured: `check:fast` 37/37 PASS, `check` PASS, `npm --prefix
   holonovel run test:all` 54/54 PASS; tree at `aad37c2` with only this
   increment's directory untracked. No C0 was needed.
2. Decisions D20–D27 recorded in the worklist; the 93-REQ / 30-family partition
   (33 + 28 + 32) and the bucket split (88 C, 5 E) were re-derived before review.
3. All 93 REQs were reviewed against the code and their citations:
   **38 holds, 5 builder-side, 50 finding rows carrying 14 findings** (all P1;
   no P0).
4. The 14 findings were scheduled under a new ROADMAP section, *§5.6 entities and
   NPCs remediation (P1)*, grouped into three bullets; register rows and the
   changelog entry landed; the sweep trigger advanced to chunk P3b-3.
5. No source file, REQ body, or fingerprint changed; the chunk is review-only.

## What went right

- The family fence held: exactly 93 rows, and the cluster split matched the
  plan's 33 + 28 + 32.
- Reading the assertions rather than trusting the tokens exposed four narrow
  assertions (T201, T216, T220, T331) and one false match (T131), the class this
  sweep exists to find.
- The plan's cold-review corrections (cluster anchors, `test:limits`,
  red-baseline branch) held during execution; no execution-time plan delta was
  needed.

## What went wrong

- The plan's *Considered and rejected* line claimed REQ-124 has runtime damage
  handling. It does not: `roll_weapon_damage` is absent from the server. The
  bucket-E verdict stands (intended builder-side gap), but the rationale was
  wrong; recorded here rather than silently corrected.
- The first Python token scan used `\bT55\b` and missed nothing, but a companion
  shell grep matched `T551`; the scan was re-run with explicit boundaries before
  any citation finding was recorded.
- The initial worklist append wrote the same disposition string on every finding
  row; it was normalised to the single roadmap section reference.

## Action items

None open beyond the scheduled roadmap section. F-P3B2-1–F-P3B2-14 are
`Scheduled-roadmap`; no P0 is open; the sweep continues at chunk P3b-3.

LOOP PAUSED
