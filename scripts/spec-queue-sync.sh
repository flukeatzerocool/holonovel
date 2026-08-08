#!/usr/bin/env bash
# spec-queue-sync.sh — Run the holonovel-update workflow to sync a server
# with the current spec. Used by spec-queue-cycle.sh after applying
# spec changes.
#
# Usage:
#   ./scripts/spec-queue-sync.sh               # dnd5e (default)
#   ./scripts/spec-queue-sync.sh --server inform
#   ./scripts/spec-queue-sync.sh --server dnd5e

set -euo pipefail

# Kill child opencode processes on script exit (prevent orphan zombies)
cleanup_children() {
  local child_pids
  child_pids=$(jobs -p 2>/dev/null || true)
  [[ -n "$child_pids" ]] && { kill $child_pids 2>/dev/null; sleep 1; kill -9 $child_pids 2>/dev/null; } || true
}
trap cleanup_children EXIT SIGINT SIGTERM

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

SERVER="${1:-}"
if [[ "$SERVER" == "--server" ]]; then
  SERVER="${2:-dnd5e}"
elif [[ -z "$SERVER" ]]; then
  SERVER="dnd5e"
else
  SERVER="${SERVER#--server }"
  [[ "$SERVER" == "--server" ]] && SERVER="dnd5e"
fi

if [[ "$SERVER" != "dnd5e" && "$SERVER" != "inform" ]]; then
  echo -e "${RED}Usage: $0 [--server inform|dnd5e]${NC}"
  exit 1
fi

echo -e "${YELLOW}Running spec-delta for $SERVER to classify changes...${NC}"

if npm run spec-delta -- --server "$SERVER" --silent 2>/dev/null; then
  echo -e "${GREEN}${SERVER} server in sync with spec. No update needed.${NC}"
  exit 0
fi

echo -e "${YELLOW}Delta detected for $SERVER. Launching holonovel-update session...${NC}"

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
SYNC_LOG="$PROJECT_DIR/.holonovel-state/queue-plans/sync-${SERVER}-${TIMESTAMP}-log.txt"
SYNC_OUT="$PROJECT_DIR/.holonovel-state/queue-plans/sync-${SERVER}-${TIMESTAMP}-output.txt"

if [[ "$SERVER" == "inform" ]]; then
  SYNC_PROMPT="Run the holonovel-update skill workflow against the Inform server in inform/.
The specification (holonovel.md) has changed since the last Inform server sync.

Phase 1 — Detect: \`npm run spec-delta -- --server inform\` already ran (delta confirmed).
Phase 2 — Audit: Read inform/src/ and compare against the world-model REQs
  (§5.10, REQ-195–202) and ruleset-free mode REQs (§5.11, REQ-218–219).
  Produce a gap disposition table. Auto-confirm all dispositions.
Phase 3 — Implement: Apply all implemented gaps. Run \`cd inform && npm run
  typecheck\` after each change batch.
Phase 4 — Close: Update inform/DECISIONS.md with gap-disposition entry.
  Run \`npm run spec-delta -- --server inform\` to confirm sync.

Smoke test: After all changes, call the Inform server's \`spec_health\` tool and verify:
  - Tool count has not decreased from baseline
  - Resource count has not decreased from baseline
  - No confidence scores below 50%
  - \`last_spec_review\` timestamp is current (within 24 hours)
  If any check fails, report the failure before declaring sync complete.

Gauntlet: Run the Inform Gauntlet — the 10 sub-workflows (I1-I10) defined in
§6.6 Inform Gauntlet. All blocking sub-workflows (I1-I6, I10) must pass.
Maximum 2 iterations per §6.6 convergence handshake.

Report completion. End with 'SYNC COMPLETE.' if all steps pass."
else
  SYNC_PROMPT="Run the holonovel-update skill workflow against the dnd5e server.
The specification (holonovel.md) has changed since the last server sync.

Phase 1 — Detect: \`npm run spec-delta -- --server dnd5e\` already ran (delta confirmed).
Phase 2 — Audit: Read dnd5e/src/ and compare against spec REQs.
  Produce a gap disposition table. Auto-confirm all dispositions — this is
  a trusted automated pipeline, proceed without asking.
Phase 3 — Implement: Apply all implemented gaps. Run \`cd dnd5e && npm run
  typecheck\` after each change batch. Run \`cd dnd5e && npx tsx
  scripts/test_scripts/run_all.ts\` after all changes.
Phase 4 — Close: Update dnd5e/DECISIONS.md with gap-disposition entry.
  Run \`npm run version-sync\` then \`npm run spec-delta -- --server dnd5e\` to confirm sync.

Smoke test: After all changes, call the server's \`spec_health\` tool and verify:
  - Tool count has not decreased from baseline
  - Resource count has not decreased from baseline
  - No confidence scores below 50%
  - \`last_spec_review\` timestamp is current (within 24 hours)
  If any check fails, report the failure before declaring sync complete.

Gauntlet: Run only the sub-workflows selected by the surface-to-scenario
mapping in holonovel.md §6.6. Maximum 2 iterations per §6.6 convergence
handshake:
  - Iteration 1: Run selected scenarios. If all pass → done.
  - If any fail: map each failure to its convergence metric (MUST-coverage,
    mechanics-fidelity, input-validation, process-compliance), fix the root
    cause, record the mapping in DECISIONS.md, re-run.
  - Iteration 2: Re-run selected scenarios. If all pass → done.
  - If still failing: log residual gaps to DECISIONS.md, report SYNC FAILED.
    Do not retry beyond 2 iterations.

Report completion: gaps implemented/deferred/waived, verification results,
Gauntlet pass/fail. End with 'SYNC COMPLETE.' if all steps pass."
fi

set +e
opencode run \
  --agent build \
  --auto \
  --title "spec-sync-${SERVER}" \
  --dir "$PROJECT_DIR" \
  "$SYNC_PROMPT" \
  > "$SYNC_OUT" 2> "$SYNC_LOG"
sync_rc=$?
set -e
if [[ $sync_rc -eq 0 ]]; then
  echo -e "${GREEN}Sync (${SERVER}): DONE${NC}"
  exit 0
else
  echo -e "${RED}Sync (${SERVER}): FAILED (exit code $sync_rc)${NC}"
  echo "Check log: $SYNC_LOG"
  exit $sync_rc
fi
