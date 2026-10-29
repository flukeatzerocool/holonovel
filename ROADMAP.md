# Roadmap

<!--
  Format: one `## <title>` per upcoming item, followed by 1–3 bullet lines.
  Newest first. Remove entries once they ship (they move to CHANGELOG.md).
  Update this file when planning a release.
-->

## E1 — Position Holonovel as an engine, not a TTRPG server

- Align the framing across `spec/01-foundations.md`, `README.md`, root
  `AGENTS.md`, `holonovel/AGENTS.md`, and the package description: Holonovel is
  a narrative simulation engine; the MCP server is the reference adapter; the
  Novel is the portable program.
- Additive framing only — TTRPG remains the first application, not the
  definition. No tool, contract, or behavior change.
- Done when the five surfaces agree, `npm run assemble && npm run check:fast`
  is green, and the README guardrail passes.

## E5 — Non-TTRPG world-pack pilot

- Build one non-TTRPG scenario (mystery, management sim, or social drama) from
  existing primitives.
- Report what required new REQs versus packaging only; that report decides
  whether "general engine" is a real claim.
- Depends on E3. Done when the pack plays headlessly and the gap report is
  recorded.

## E6 — Artifact provenance and creator rights

- License, attribution, content hash, and optional signature on ruleset
  packages, adventures, and Novels; preserved through export and import.
- Prerequisite for any sharing surface.
- Depends on the engine contract (`docs/engine-contract.md`). Done when a
  round-trip preserves provenance and a tampered artifact is refused.

## E7 — Shareable artifacts and local registry

- Documented exchange formats for packages, adventures, and Novels; local
  install, discovery, and import/export. No network.
- Depends on E6. Done when two installations exchange an artifact and the
  registry resolves it offline.

## E8 — Decision gate: multi-engine and entry split (3c)

- Per-engine state and config injection, N engines per process, and the
  ~25-harness entry migration — only if E3 and E4 evidence justifies it.
- Close the item if the evidence does not; do not implement speculatively.
- Depends on E3 and E4. Done when a written go/no-go decision is recorded.

## Rename `manage_session` to remove the session-name collision

- `manage_session` (recap, verbosity, briefing, discovery) collides with
  `open_session` and `close_session` (lifecycle). The 2026-10-25 TDQS capture
  graded naming consistency 4/5. A rename with a hidden alias/tombstone is
  worth about +0.075 overall but touches 583 references across 41 files.
  Deferred from the 2026-10-25 coherence remediation. (REQ-024a, REQ-554)

## Compact default tool surface

- The default `tools/list` exposes 36 tools; the 2026-10-25 TDQS capture graded
  tool-count appropriateness 2/5. A curated compact default is worth about
  +0.225 overall but may read as incomplete. Deferred as a product decision
  from the 2026-10-25 coherence remediation. (REQ-429, REQ-554)

## Recap notation and configurable bounds

- REQ-072f/g declare `format` (markdown/lonelog), `max_transitions`, and
  `max_rolls` on `manage_session (action: recap)`, but the current schema and
  handler do not expose or honor them. Implement the Lonelog formatter and
  bounded arrays; T272 is the target. (REQ-072)

## Since-creation absence for location-gated discovery

- Discovery currently checks presence at countdown fire time. A full
  "absent from every scene since creation" check is deferred from the
  2026-10-24 location-gated increment. (REQ-340a, REQ-349a)

## Deferred-resolution variant for discovered consequences

- Attribution records at fire time. The deferred-resolution variant remains
  a follow-up if exact REQ-340 timing is required. (REQ-340a)

## Not planned — engine and platform track

- Hosted platform, multiplayer, discovery, monetization, and default
  HTTP/WebSocket transport are out of scope. REQ-030 (single-user connection)
  and REQ-051 (no runtime network) stay unchanged.
- A domain-shaped transactional turn API and real-time or rendered
  presentation are not planned. Revisit only with a concrete requirement.
