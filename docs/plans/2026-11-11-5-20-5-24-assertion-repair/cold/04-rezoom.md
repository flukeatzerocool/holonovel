# Stage 4 — re-zoom (cold)

Reviewer: fresh `review` subagent · artifact sha256 717dd043…

Result: 19 of 21 Stage 3 items RESOLVED, 2 PARTIAL (both nits: one residual
REQ-135 identifier in the Evidence row, one `T712` qualification). 1 new Major
(Phase 1 still said "seven boots" for the six-case matrix) and 7 nits.

All were fixed in the artifact:

- Phase 1 now says six matrix boots plus the budget boot.
- Evidence row cites REQ-135b (and names REQ-135a for the budget).
- Phase 0 adds `rg -c "State verification: clean" holonovel/scripts/` so a third
  assertion cannot slip past `check:fast`.
- D1 and done bar 1 carry T545's `replay (to_event: 2)` observation.
- D3 names the three variant phrases so the six cases are deterministic.
- D5a says the status count is combined while the two lines below break it out.
- D6 says the create calls must be rewritten to capture ids; the block range is
  `:681-692`.

Recorded, not fixed: the `stale (projection …)` status suppresses the unhashed
count when a stale save digest coexists with unhashed entries — the status is
not `clean`, so REQ-603 is satisfied; the AAR records the reading.
