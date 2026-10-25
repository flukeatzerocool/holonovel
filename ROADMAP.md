# Roadmap

<!--
  Format: one `## <title>` per upcoming item, followed by 1–3 bullet lines.
  Newest first. Remove entries once they ship (they move to CHANGELOG.md).
  Update this file when planning a release.
-->

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
