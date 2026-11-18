# Binding review — final amendment (probe 3 carries `--repath`)

Artifact at `37d06c890d84ebb0ab24eaeab8d64a41221e8bc2ef4d93cc8d116ec7ed0ef518`.

## Changed passage

- **RESOLVED** — the D8 probe-3 sentence now runs `--write --repath --offset <n> --path
  holonovel/src/index.ts --from-line <that anchor's line>` and states why: `--repath` is present
  because `fix-anchors` carries it (`package.json:94`), which is the shape under test. The
  precondition ("symbol still carried elsewhere in the recorded file") is exactly D2's fallback
  gate, the expected message matches D2's pinned text in shape including the
  `(anchor <source>:<path>:<recorded>)` tail, and C16 invokes the same combination and asserts the
  anchor is untouched. The flagged Nit is closed: the guarded-fallback claim is exercised by the
  command rather than merely asserted.

## New blockers or majors

none

```
independent-review passed.

Plan sha256: 37d06c890d84ebb0ab24eaeab8d64a41221e8bc2ef4d93cc8d116ec7ed0ef518
```

## Earlier pass (superseded)

The pass before this one reviewed the revision-4 text at `f83f0fac…` and returned
`independent-review passed.` with no blockers and one Nit — probe 3's command omitted `--repath` —
which the amendment above resolves. Its binding line named `f83f0fac…` and is superseded by the
binding line above.

Full record of that pass: the four parent resolutions (V1 arithmetic, `rejectUnknown` ordinal,
probe-3 selection requirement, P3 wording and the pinned empty-selection message) all RESOLVED;
the per-label multipliers were checked against the checks emitted in
`scripts/test-anchor-tooling.ts`.
