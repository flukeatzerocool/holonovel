# Cold-pass record — U4 plan (canonical)

Plan sha256: 93cffda20f4edbd62c476574b9dd3c00588588082316c40db9b2935bd43ee0a1

Three cold artifacts, all produced by independent reviewers — fresh child
contexts that never saw the authoring conversation:

| Stage | Artifact | Verdict |
|---|---|---|
| Five-stage cold pass over plan v1 | `report-v1.md` | `independent-review FAILED.` — 2 Blockers, 3 Majors, 3 Nits |
| Diff re-review over plan v2 (changed lines only) | `report-v2.md` | `independent-review FAILED.` — 1 residual Blocker, 2 Nits |
| Targeted check over plans v3–v4 (four claims, then their fixes) | `report-v3.md` | **`independent-review passed.`** — no remaining contradiction |

The terminal artifact is `report-v3.md`, whose closing line is the passing token
this plan's stamp binds. Its review scope is deliberately narrow (the four
author-claimed fixes), so the token attests that every prior finding is closed,
not that the document was freshly swept a third time.

## Disposition summary

| Finding | Class | Disposition |
|---|---|---|
| §5.12 count 82 → 84 | Blocker | fixed in v2; re-verified in v3 (`:97`, `:169`) |
| CI step/composite counts | Blocker | fixed across three rounds, finally by direct `run:` enumeration (16 commands / 1 gate / 15 outside / 10 composites) |
| D5 "eleven workflows" | Major | removed; the nine §8 workflows named |
| C-12 dead probe, wrong fix pair | Major | repointed to §9's numbering; single-site fix authorised; C-13 added |
| 23 of 44 gates row-free without a boundary | Major | D1 names them and the existing coverage |
| Register-parser explanation | Nit | corrected |
| CI job anchor `:8` → `:9` | Nit | corrected |
| C-13 discriminator | Nit | T259 named as the discriminator |
| Step 15 direction | Nit | made conditional both ways |
| Count granularity / off-by-one | Nits | final numbers enumerated, not asserted |
| Empty-grep claim | Nit | removed |

## Independence

- No reviewer saw the authoring conversation, the plan's prior text, or the
  register; inputs were the artifact, its task list, the evidence sidecar,
  `AGENTS.md`, and files a claim cites.
- Limitation (stamp condition): the five stages of the v1 pass ran sequentially
  in one fresh child context rather than five separate contexts, so
  stage-to-stage isolation is not proven. Independence from the author holds.
- Limitation (stamp condition): the reviewers are read-only and could not write
  these artifacts; the author persisted their text verbatim.
- The v3/v4 rounds verified fixes to the reviewer's own findings. That is
  appropriate for closing a finding and is not offered as independent evidence
  about the rest of the document — the v1 five-stage pass carries that.

## Read budget

v1 pass 36/40 · diff re-review 3/10 · targeted check 5 + 3 reads.
