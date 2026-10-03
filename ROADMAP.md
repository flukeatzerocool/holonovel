# Roadmap

<!--
  Format: one `## <title>` per upcoming item, followed by 1–3 bullet lines.
  Newest first. Remove entries once they ship (they move to CHANGELOG.md).
  Update this file when planning a release.
-->

## Re-emit installed packages under the 2026-10-03 package-format fingerprint

- The 2026-10-03 spec advanced the package-format fingerprint (`cd0160a0…` →
  `8ad3508a…`). After the deployed host advances to that spec, run the V.7 Update
  workflow to re-emit/re-build `dnd2024`, `mothership`, and `swse` (REQ-420,
  REQ-557). Until the host advances, the installed packages remain compatible with
  the old host and need no action.

