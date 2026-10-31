# Roadmap

<!--
  Format: one `## <title>` per upcoming item, followed by 1–3 bullet lines.
  Newest first. Remove entries once they ship (they move to CHANGELOG.md).
  Update this file when planning a release.
-->

## Implement the generic hazard model (REQ-622–REQ-622c)

- The reference server still implements the Torre-specific candle/wax/match
  mechanic with name-based lookups, while §5.10 defines annotation-bound
  survival resources. Align `holonovel/src/index.ts`, migrate the starter
  artifact's room/countdown annotations, and re-baseline the hazard tests.
  (REQ-622, REQ-622a, REQ-622b, REQ-622c)

## Not planned — compact tool surface

- The default `tools/list` exposes 37 tools; the 2026-10-25 TDQS capture graded
  tool-count appropriateness 2/5. A curated compact default is worth about
  +0.225 overall but may read as incomplete, and the recorded replays show the
  compact projections cost visibility and calls. Closed as a product decision:
  keep the full default, improve disambiguation and per-tool quality instead.
  (REQ-429, REQ-554, REQ-580)

## Not planned — engine and platform track

- Hosted platform, multiplayer, discovery, monetization, and default
  HTTP/WebSocket transport are out of scope. REQ-030 (single-user connection)
  and REQ-051 (no runtime network) stay unchanged.
- A domain-shaped transactional turn API and real-time or rendered
  presentation are not planned. Revisit only with a concrete requirement.
