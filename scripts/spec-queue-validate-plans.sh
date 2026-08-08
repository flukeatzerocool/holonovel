#!/usr/bin/env bash
# spec-queue-validate-plans.sh — Batch-validate all [PLAN_READY] items before
# execution. Verifies plan files exist, have required markers, and contain
# executable change blocks. Marks invalid items [FAILED].
#
# Usage:
#   ./scripts/spec-queue-validate-plans.sh

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SPEC_QUEUE="$PROJECT_DIR/SPEC-QUEUE.md"
PLANS_DIR="$PROJECT_DIR/.holonovel-state/queue-plans"
FAILURE_LOG="$PLANS_DIR/failures.txt"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

mkdir -p "$PLANS_DIR"

mark_failed() {
  local num="$1" reason="$2"
  sed -i "s/^${num}\. \[PLAN_READY\]/${num}. [FAILED]/" "$SPEC_QUEUE"
  cat >> "$FAILURE_LOG" <<EOF
${num} | $(date -Iseconds) | validation: ${reason}
EOF
}

echo -e "${YELLOW}── Validating PLAN_READY plans ──${NC}"
echo ""

valid=0
invalid=0

while IFS='|' read -r num desc; do
  [[ -z "$num" ]] && continue

  local plan_file="$PLANS_DIR/item-${num}-output.txt"

  # Check 1: plan file exists
  if [[ ! -f "$plan_file" ]]; then
    echo -e "${RED}  Item $num: MISSING — plan file not found${NC}"
    mark_failed "$num" "plan file missing: $plan_file"
    invalid=$((invalid + 1))
    continue
  fi

  # Check 2: PLAN_BEGIN marker
  if ! grep -q "PLAN_BEGIN" "$plan_file"; then
    echo -e "${RED}  Item $num: INVALID — missing PLAN_BEGIN marker${NC}"
    mark_failed "$num" "missing PLAN_BEGIN marker"
    invalid=$((invalid + 1))
    continue
  fi

  # Check 3: PLAN_END marker
  if ! grep -q "PLAN_END" "$plan_file"; then
    echo -e "${RED}  Item $num: INVALID — missing PLAN_END marker${NC}"
    mark_failed "$num" "missing PLAN_END marker"
    invalid=$((invalid + 1))
    continue
  fi

  # Check 4: at least one CHANGE_BEGIN/CHANGE_END pair
  local change_count
  change_count=$(grep -c "CHANGE_BEGIN" "$plan_file" 2>/dev/null || echo 0)
  if [[ "$change_count" -eq 0 ]]; then
    echo -e "${RED}  Item $num: INVALID — no CHANGE_BEGIN markers${NC}"
    mark_failed "$num" "no CHANGE_BEGIN markers"
    invalid=$((invalid + 1))
    continue
  fi

  local change_end_count
  change_end_count=$(grep -c "CHANGE_END" "$plan_file" 2>/dev/null || echo 0)
  if [[ "$change_count" -ne "$change_end_count" ]]; then
    echo -e "${RED}  Item $num: INVALID — CHANGE_BEGIN/CHANGE_END mismatch ($change_count vs $change_end_count)${NC}"
    mark_failed "$num" "CHANGE_BEGIN/CHANGE_END count mismatch: $change_count/$change_end_count"
    invalid=$((invalid + 1))
    continue
  fi

  echo -e "${GREEN}  Item $num: VALID — $change_count change(s)${NC}"
  valid=$((valid + 1))

done < <(
  grep -n '^[0-9]\+\. \[PLAN_READY\]' "$SPEC_QUEUE" \
    | sed 's/^[0-9]*:\([0-9]*\)\. \[PLAN_READY\] /\1|/'
)

echo ""
echo -e "${GREEN}Validation complete:${NC} $valid valid, $invalid invalid"
echo ""

if [[ $invalid -gt 0 ]]; then
  echo -e "${YELLOW}Invalid items marked [FAILED] in SPEC-QUEUE.md.${NC}"
  echo "  Failures logged: $FAILURE_LOG"
  exit 1
fi

exit 0
