#!/usr/bin/env bash
# spec-queue-sync.sh — Run the holonovel-update workflow to sync the dnd5e
# server with the current spec. Used by spec-queue-cycle.sh after applying
# spec changes. Runs a detached opencode build session.
#
# Usage:
#   ./scripts/spec-queue-sync.sh

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}Running spec-delta to classify changes...${NC}"

if npm run spec-delta --silent 2>/dev/null; then
  echo -e "${GREEN}Server in sync with spec. No update needed.${NC}"
  exit 0
fi

echo -e "${YELLOW}Delta detected. Launching holonovel-update session...${NC}"

SYNC_LOG="$PROJECT_DIR/.holonovel-state/queue-plans/sync-log.txt"

SYNC_PROMPT="Run the holonovel-update skill workflow against the dnd5e server.
The specification (holonovel.md) has changed since the last server sync.

Phase 1 — Detect: \`npm run spec-delta\` already ran (delta confirmed).
Phase 2 — Audit: Read dnd5e/src/ and compare against spec REQs.
  Produce a gap disposition table. Auto-confirm all dispositions — this is
  a trusted automated pipeline, proceed without asking.
Phase 3 — Implement: Apply all implemented gaps. Run \`cd dnd5e && npm run
  typecheck\` after each change batch. Run \`cd dnd5e && npx tsx
  scripts/test_scripts/run_all.ts\` after all changes.
Phase 4 — Close: Update dnd5e/DECISIONS.md with gap-disposition entry.
  Run \`npm run version-sync\` then \`npm run spec-delta\` to confirm sync.

Gauntlet: Run only the sub-workflows selected by the surface-to-scenario
mapping in holonovel.md §6.6. Zero failures required on selected scenarios.

Report completion: gaps implemented/deferred/waived, verification results,
Gauntlet pass/fail. End with 'SYNC COMPLETE.' if all steps pass."

nohup opencode run \
  --agent build \
  --title "spec-sync" \
  --dir "$PROJECT_DIR" \
  "$SYNC_PROMPT" \
  > "$PROJECT_DIR/.holonovel-state/queue-plans/sync-output.txt" 2> "$SYNC_LOG" &

SYNC_PID=$!
echo "  PID: $SYNC_PID"
echo "  Output: .holonovel-state/queue-plans/sync-output.txt"
echo "  Log: $SYNC_LOG"

echo -e "${YELLOW}Waiting for sync session to complete...${NC}"

if wait "$SYNC_PID" 2>/dev/null; then
  echo -e "${GREEN}Sync: DONE${NC}"
  exit 0
else
  rc=$?
  echo -e "${RED}Sync: FAILED (exit code $rc)${NC}"
  echo "Check log: $SYNC_LOG"
  exit $rc
fi
