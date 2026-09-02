# Roadmap

<!--
  Format: one `## <title>` per upcoming item, followed by 1–3 bullet lines.
  Newest first. Remove entries once they ship (they move to CHANGELOG.md).
  Update this file when planning a release.
-->

## Newsletter removal + repo cleanup review
- Remove the newsletter subsystem: `newsletter/`, `scripts/newsletter-digest.ts`,
  `scripts/newsletter-push.ts`, `scripts/spec-health-trends.ts`, the
  `newsletter`/`newsletter-push`/`spec-health-trends` npm scripts, the AGENTS.md
  Newsletter section + layer-map line, and the README command-table row. The
  `.github/workflows/newsletter.yml` cron was already removed (2026-09-02).
- Review the repo for anything not load-bearing and remove it — candidates: the
  "read-only mirror" README framing vs. the active two-remote workflow,
  `narrative_world_model/`, stale `plans/` artifacts, scripts with no consumer.
