#!/usr/bin/env bash
# spec-queue-recover.sh — AAR-based recovery for a failed spec-queue item.
# Reads the execute output's after-action report and launches a targeted
# opencode session to fix the issue.
#
# Usage:
#   ./scripts/spec-queue-recover.sh <item-number>

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SPEC_QUEUE="$PROJECT_DIR/SPEC-QUEUE.md"
PLANS_DIR="$PROJECT_DIR/.holonovel-state/queue-plans"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

ITEM="${1:-}"

if [[ -z "$ITEM" ]]; then
  echo -e "${RED}Usage: $0 <item-number>${NC}"
  exit 1
fi

EXEC_OUT="$PLANS_DIR/item-${ITEM}-execute-output.txt"
RECOVERY_OUT="$PLANS_DIR/item-${ITEM}-recovery-$(date +%Y%m%d-%H%M%S)-output.txt"
RECOVERY_LOG="$PLANS_DIR/item-${ITEM}-recovery-log.txt"

if [[ ! -f "$EXEC_OUT" ]]; then
  echo -e "${RED}Execute output not found: $EXEC_OUT${NC}"
  exit 1
fi

if ! grep -qiE "after.action.report|after-action|## After Action" "$EXEC_OUT"; then
  echo -e "${RED}No after-action report found in $EXEC_OUT — cannot auto-recover${NC}"
  exit 1
fi

echo -e "${YELLOW}Launching recovery session for item $ITEM...${NC}"

RECOVERY_PROMPT="The previous execution attempt for spec queue item $ITEM failed.
Read the after-action report in the attached execution output file
($(basename "$EXEC_OUT")). Identify what went wrong and apply a targeted fix.

Constraints:
- Fix only the issue described in the AAR. Do not make unrelated changes.
- Run \`npm run check\` after applying the fix.
- Edit spec source files in \`spec/\` (NOT \`holonovel.md\` — it is assembled).
  When the AAR identifies a root cause in a different file, edit that file.
- Run \`npm run assemble\` after editing spec source files.
- Do NOT commit.

End with: \"RECOVERY COMPLETE.\" if the fix was applied successfully.
End with: \"RECOVERY FAILED.\" if the issue cannot be fixed automatically
and needs human intervention. Include a brief explanation of what's wrong."

set +e
opencode run \
  "$RECOVERY_PROMPT" \
  --agent build \
  --auto \
  --title "spec-recover-${ITEM}" \
  --dir "$PROJECT_DIR" \
  --file "$EXEC_OUT" \
  > "$RECOVERY_OUT" 2> "$RECOVERY_LOG"
rc=$?
set -e

if [[ $rc -eq 0 ]] && grep -q "RECOVERY COMPLETE" "$RECOVERY_OUT" 2>/dev/null; then
  # Unmark FAILED, return to PLAN_READY for retry
  sed -i "s/^${ITEM}\. \[FAILED\]/${ITEM}. [PLAN_READY]/" "$SPEC_QUEUE"
  echo -e "${GREEN}Recovery: DONE — item $ITEM ready for retry${NC}"
  exit 0
fi

echo -e "${RED}Recovery: FAILED — see $RECOVERY_OUT${NC}"
exit 1
