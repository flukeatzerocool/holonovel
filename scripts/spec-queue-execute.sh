#!/usr/bin/env bash
# spec-queue-execute.sh — Phase 3: apply a research plan to holonovel.md.
# Reads .queue-plans/item-<N>-output.txt, verifies plan delimiters, and
# launches an opencode build session to apply all changes. Runs npm run check
# after each change. Does NOT commit — the cycle script handles batch commits.
#
# Usage:
#   ./scripts/spec-queue-execute.sh <item-number> [--dry-run]

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PLANS_DIR="$PROJECT_DIR/.holonovel-state/queue-plans"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# ── args ──────────────────────────────────────────────────────────────────

ITEM="${1:-}"
DRY_RUN=false
[[ "${2:-}" == "--dry-run" ]] && DRY_RUN=true

if [[ -z "$ITEM" ]]; then
  echo -e "${RED}Usage: $0 <item-number> [--dry-run]${NC}"
  exit 1
fi

PLAN_FILE="$PLANS_DIR/item-${ITEM}-output.txt"
if [[ ! -f "$PLAN_FILE" ]]; then
  echo -e "${RED}Plan file not found: $PLAN_FILE${NC}"
  exit 1
fi

# ── validate plan ─────────────────────────────────────────────────────────

if ! grep -q "PLAN_BEGIN" "$PLAN_FILE"; then
  echo -e "${RED}Plan file missing PLAN_BEGIN marker: $PLAN_FILE${NC}"
  exit 1
fi

if ! grep -q "PLAN_END" "$PLAN_FILE"; then
  echo -e "${RED}Plan file missing PLAN_END marker: $PLAN_FILE${NC}"
  exit 1
fi

CHANGE_COUNT=$(grep -c "CHANGE_BEGIN" "$PLAN_FILE" || true)
echo -e "${GREEN}Plan file valid:${NC} $CHANGE_COUNT change(s) detected"

if $DRY_RUN; then
  echo -e "${YELLOW}Dry run — would execute $CHANGE_COUNT change(s)${NC}"
  exit 0
fi

# ── execute ───────────────────────────────────────────────────────────────

EXECUTE_PROMPT="Apply every \`### Change N:\` block in the attached plan file
($(basename "$PLAN_FILE")) to the specification. Use the exact prose in each
\`**Prose:**\` block — that text replaces or inserts into holonovel.md as
specified by the \`**File:**\` directive.

After each change, run \`npm run check\`. If any check fails, stop immediately
and report the failing change and the error output. If all checks pass, report
a summary: which changes were applied, any REQ numbers added, and new test IDs.

Do NOT commit. Do NOT modify any file other than holonovel.md. After all
changes are applied, report \"ALL CHANGES APPLIED.\""

echo -e "${YELLOW}Launching build session for item $ITEM...${NC}"

EXEC_LOG="$PLANS_DIR/item-${ITEM}-execute-log.txt"

nohup opencode run \
  --agent build \
  --title "spec-execute-${ITEM}" \
  --dir "$PROJECT_DIR" \
  --file "$PLAN_FILE" \
  "$EXECUTE_PROMPT" \
  > "$PLANS_DIR/item-${ITEM}-execute-output.txt" 2> "$EXEC_LOG" &

EXEC_PID=$!
echo "  PID: $EXEC_PID"
echo "  Output: $PLANS_DIR/item-${ITEM}-execute-output.txt"
echo "  Log: $EXEC_LOG"

# ── wait for completion ───────────────────────────────────────────────────

echo -e "${YELLOW}Waiting for build session to complete...${NC}"

if wait "$EXEC_PID" 2>/dev/null; then
  echo -e "${GREEN}Item $ITEM execute: DONE${NC}"
  exit 0
else
  rc=$?
  echo -e "${RED}Item $ITEM execute: FAILED (exit code $rc)${NC}"
  echo "Check log: $EXEC_LOG"
  exit $rc
fi
