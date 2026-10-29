# Roadmap

<!--
  Format: one `## <title>` per upcoming item, followed by 1–3 bullet lines.
  Newest first. Remove entries once they ship (they move to CHANGELOG.md).
  Update this file when planning a release.
-->

## Re-capture the external TDQS after surface changes

- The 2026-10-25 capture predates the E7 `manage_artifact` addition (36 → 37
  tools), so the recorded external score no longer describes the live surface.
  Re-run the external evaluation and record the capture in
  `spec/audit/tdqs-scoreboard.json`; `T679` reports the stale count until then.
  (REQ-552)

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
