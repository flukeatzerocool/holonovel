# Roadmap

<!--
  Format: one `## <title>` per upcoming item, followed by 1–3 bullet lines.
  Newest first. Remove entries once they ship (they move to CHANGELOG.md).
  Update this file when planning a release.
-->

## Glama image Node 24 + published `engines` floor (REQ-428)

- Glama's hosted build image runs Node 20 (`holonovel/DECISIONS.md` — the
  REQ-428 container-image path), so `holonovel/package.json` deliberately
  carries no `engines` floor: adding one would surface on Glama's `npm ci`.
- First step: verify the current Glama admin build-spec Node version and bump it
  to 24. Then add `engines.node: ">=24"` to `holonovel/package.json`, refresh its
  lockfile, and verify `npm ci` plus the npm/registry publish path.

## Spec-delta REQ-body change detection (REQ-417)

- `spec-delta.ts`'s `extractReqBodies` regex (`scripts/spec-delta.ts:105`,
  `[^*]+?`) cannot cross the `*Acceptance criterion:*` emphasis inside a REQ
  body before a paragraph break, so **610 of 1182 REQ IDs are invisible** to
  body-change detection and a REQ-body edit classifies `patch` — violating
  REQ-417. Discovered 2026-09-27 while publishing the MCP-Registry fix.
- First step: capture the full body between the bold heading and the next
  REQ/section/rule boundary (a candidate regex recovers 907/1182; the rest need
  the sub-part and `###` boundary cases), add a fixture test that a body edit
  classifies Minor/Editorial, and rebaseline the classification ratchet.

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




