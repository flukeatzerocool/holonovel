# Roadmap

<!--
  Format: one `## <title>` per upcoming item, followed by 1–3 bullet lines.
  Newest first. Remove entries once they ship (they move to CHANGELOG.md).
  Update this file when planning a release.
-->

## Push-pipeline harness-suite runtime (REQ-314)

- The `test:all` server suite (36 commands, ~244 s) runs sequentially and in
  full for every minor/major spec delta.
- Isolation audit (2026-09-27): 33 of the suite's scripts use temp-dir state and
  the two `check:*` scripts are read-only, but
  `holonovel/scripts/test-update-workflow.ts` reads and save/restores the live
  `.holonovel-state/pipeline-fingerprints.json` and spawns `update-server.ts`,
  so naive parallelism is unsafe.
- First step: isolate that harness's `STATE_DIR`, then add a bounded-concurrency
  runner; optionally fingerprint-scope the suite per changed surface (REQ-314).




