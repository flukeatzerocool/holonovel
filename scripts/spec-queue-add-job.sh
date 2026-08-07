#!/usr/bin/env bash
# spec-queue-add-job.sh — Add an ad-hoc job to the SPEC-QUEUE that skips
# the research phase. The job goes into the "Ad-hoc queue" section at the
# top of SPEC-QUEUE.md and is executed before research-derived PLAN_READY
# items. Only one item executes at a time.
#
# Usage:
#   ./scripts/spec-queue-add-job.sh "<description>" <path/to/plan.txt>

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SPEC_QUEUE="$PROJECT_DIR/SPEC-QUEUE.md"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

DESCRIPTION="${1:-}"
PLAN_FILE="${2:-}"

if [[ -z "$DESCRIPTION" ]] || [[ -z "$PLAN_FILE" ]]; then
  echo "Usage: $0 \"<description>\" <path/to/plan.txt>"
  exit 1
fi

# Resolve relative paths against project root
if [[ "$PLAN_FILE" != /* ]]; then
  PLAN_FILE="$PROJECT_DIR/$PLAN_FILE"
fi

if [[ ! -f "$PLAN_FILE" ]]; then
  echo -e "${RED}Plan file not found: $PLAN_FILE${NC}"
  exit 1
fi

if ! grep -q "PLAN_BEGIN" "$PLAN_FILE"; then
  echo -e "${RED}Plan file missing PLAN_BEGIN marker${NC}"
  echo "Required format: PLAN_BEGIN ... ### Change N: ... CHANGE_BEGIN ... CHANGE_END ... PLAN_END"
  exit 1
fi

if ! grep -q "PLAN_END" "$PLAN_FILE"; then
  echo -e "${RED}Plan file missing PLAN_END marker${NC}"
  exit 1
fi

CHANGE_COUNT=$(grep -c "CHANGE_BEGIN" "$PLAN_FILE" || true)
echo -e "${GREEN}Plan file valid:${NC} $CHANGE_COUNT change(s)"

# Find next available item number (global across all tiers)
HIGHEST=$(grep -Po '^\d+(?=\. )' "$SPEC_QUEUE" 2>/dev/null | sort -n | tail -1 || echo 0)
NEXT=$((HIGHEST + 1))

# Store plan path relative to project root for portability
REL_PATH="${PLAN_FILE#$PROJECT_DIR/}"

# Ensure ad-hoc section exists
if ! grep -q "^## Ad-hoc queue" "$SPEC_QUEUE"; then
  sed -i "1s/^/## Ad-hoc queue (executed first)\n\n\n/" "$SPEC_QUEUE"
fi

# Insert job entry after the ad-hoc heading
sed -i "/^## Ad-hoc queue/a\\
${NEXT}. [JOB] ${DESCRIPTION} --- plan: ${REL_PATH}" "$SPEC_QUEUE"

echo -e "${GREEN}Job ${NEXT} added to SPEC-QUEUE (ad-hoc queue).${NC}"
echo "  Description: ${DESCRIPTION}"
echo "  Plan file:   ${REL_PATH}"
echo "  Run:         ./scripts/spec-queue-cycle.sh execute"
