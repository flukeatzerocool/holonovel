# Roadmap

<!--
  Format: one `## <title>` per upcoming item, followed by 1–3 bullet lines.
  Newest first. Remove entries once they ship (they move to CHANGELOG.md).
  Update this file when planning a release.
-->

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
