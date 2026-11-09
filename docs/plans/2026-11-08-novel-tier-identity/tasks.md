# Tasks — Novel-tier identity for entities and NPCs

Ordered; each task ends with its verification. Plan: `plan.md`.

1. **Map normalizer.** Add `normalizeIdentityMap` to
   `holonovel/src/core/identity.ts`. Verify: `npm run typecheck`.

2. **State model.** Add `identities` to `NovelState`; initialize it; include it
   only when non-empty in `novelToJSON`; normalize it in `novelFromJSON`; carry
   it through `novelToSnapshotJSON`/`applyNovelState`. Verify:
   `npm run typecheck`; the persistence round-trip test.

3. **Two-tier lookup.** Add `isNovelIdentitySubject`, the `create` path in
   `identityFor`, and `saveIdentity`. Rewire every `manage_identity` action to
   snapshot/save the owning tier. Update the not-found messages. Verify:
   `test:identity` T771.

4. **Identity resource.** Union roster, Novel entity, and NPC ids in the
   `identity://` listing; a Player still sees only the active entity. Verify:
   the T771 resource/refusal assertions.

5. **Tool definition.** Rewrite the `manage_identity` description to the
   958-byte two-tier text and the `character_id` description. Regenerate
   `holonovel/tool-definitions.json`. Verify: `test:tool-definitions`,
   `tool-definitions-lint`, `check-tool-definitions-sync`.

6. **Starter identities.** Add the `character_01` and `npc_mv4m1599` identity
   maps to `holonovel/content/torre-nosferatu.source.json`; rebuild the
   artifact. Verify: `check:starter-freshness`, `test:starter-novel`.

7. **Spec amendments.** Edit the §5.26 row, §7.7.0 paragraph, REQ-473,
   REQ-240a, REQ-241a, REQ-334b, REQ-473 `_Check:_`, and the T771 row. Verify:
   `npm run assemble`, `npm run validate -- --write-register`,
   `npm run refresh-properties`.

8. **Generated surfaces.** Regenerate tool definitions, re-record the surface
   budget, run `npm run build-order`. Verify: `check-fingerprint-sync`,
   `surface-budget`, `check-tool-definitions-sync`, `check-markers`.

9. **Tests.** T771 in `test-identity.ts`; starter identity and projection
   assertions in `test-starter-novel.ts`. Verify: `test:identity`,
   `test:starter-novel`, `test:persistence`.

10. **Registers.** Add the `holonovel/DECISIONS.md` decision section, the
    `CHANGELOG.md` entry, and the AAR. Verify: `check-registers`,
    `check-loop-artifacts`.

11. **Final gates.** `typecheck`, `test:all`, root `check:fast`,
    `check:conformance`.
