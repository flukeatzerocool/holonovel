#!/usr/bin/env bash
# spec-queue-cycle.sh — Top-level orchestrator for the spec-engineering queue
# pipeline. Three modes: research (launch read-only sessions), status (check
# all items), execute (review, apply, sync, KB update, commit).
#
# Usage:
#   ./scripts/spec-queue-cycle.sh research [N]   # launch N research sessions
#   ./scripts/spec-queue-cycle.sh status          # check all items
#   ./scripts/spec-queue-cycle.sh execute         # review → apply → sync → commit

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SPEC_QUEUE="$PROJECT_DIR/SPEC-QUEUE.md"
PLANS_DIR="$PROJECT_DIR/.holonovel-state/queue-plans"
KB_DIR="$PROJECT_DIR/.holonovel-state/knowledge-base"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

mkdir -p "$PLANS_DIR"

# ── helpers ──────────────────────────────────────────────────────────────

marker() {
  local num="$1" marker="$2"
  sed -i "s/^${num}\. /${num}. [${marker}] /" "$SPEC_QUEUE"
}

clear_marker() {
  local num="$1"
  sed -i "s/^${num}\. \[[A-Z_]*\] /${num}. /" "$SPEC_QUEUE"
}

# ── cmd_status: list all items with marker state ─────────────────────────

cmd_status() {
  echo -e "${GREEN}SPEC-QUEUE status:${NC}"
  echo ""
  grep -n '^[0-9]\+\. ' "$SPEC_QUEUE" | while IFS=: read -r line rest; do
    num=$(echo "$rest" | grep -Po '^\d+')
    marker_type=""
    [[ "$rest" =~ \[RESEARCH\] ]] && marker_type="RESEARCH"
    [[ "$rest" =~ \[PLAN_READY\] ]] && marker_type="PLAN_READY"
    [[ "$rest" =~ \[EXECUTING\] ]] && marker_type="EXECUTING"
    [[ "$rest" =~ \[REJECTED\] ]] && marker_type="REJECTED"
    [[ "$rest" =~ \[FAILED\] ]] && marker_type="FAILED"
    [[ "$rest" =~ \[DONE\] ]] && marker_type="DONE"
    desc=$(echo "$rest" | sed 's/^[0-9]\+\. \[[A-Z_]*\] //')
    case "$marker_type" in
      RESEARCH)   echo -e "${YELLOW}$num. [RESEARCH]${NC}   $desc" ;;
      PLAN_READY) echo -e "${GREEN}$num. [PLAN_READY]${NC} $desc" ;;
      EXECUTING)  echo -e "${YELLOW}$num. [EXECUTING]${NC}  $desc" ;;
      REJECTED)   echo -e "${RED}$num. [REJECTED]${NC}   $desc" ;;
      FAILED)     echo -e "${RED}$num. [FAILED]${NC}     $desc" ;;
      DONE)       echo -e "${GREEN}$num. [DONE]${NC}       $desc" ;;
      *)          echo "  $num.              $desc" ;;
    esac
  done
  echo ""
  exit 0
}

# ── cmd_execute: review, apply, sync, KB update, commit ──────────────────

cmd_execute() {
  echo -e "${YELLOW}Reviewing pending plans...${NC}"
  echo ""

  local items=()
  while IFS='|' read -r num desc; do
    [[ -n "$num" ]] && items+=("$num|$desc")
  done < <(
    grep -n '^[0-9]\+\. \[PLAN_READY\]' "$SPEC_QUEUE" \
      | sed 's/^[0-9]*:\([0-9]*\)\. \[PLAN_READY\] /\1|/'
  )

  if [[ ${#items[@]} -eq 0 ]]; then
    echo -e "${RED}No items with [PLAN_READY] marker. Run 'research' first.${NC}"
    exit 1
  fi

  echo -e "${GREEN}${#items[@]} item(s) awaiting review:${NC}"
  echo ""
  for item in "${items[@]}"; do
    local num="${item%%|*}"
    local desc="${item#*|}"
    local plan_file="$PLANS_DIR/item-${num}-output.txt"
    if [[ -f "$plan_file" ]]; then
      local change_count=$(grep -c "CHANGE_BEGIN" "$plan_file" 2>/dev/null || echo "?")
      echo "  Item $num: $desc — $change_count change(s)"
    else
      echo "  Item $num: $desc — plan file missing!"
    fi
  done
  echo ""

  read -p "Approve all ${#items[@]} items? [y/n/item numbers]: " answer
  echo ""

  local approved=() rejected=()
  for item in "${items[@]}"; do
    local num="${item%%|*}"
    if [[ "$answer" == "y" ]] || [[ "$answer" == "Y" ]]; then
      approved+=("$num")
    elif [[ "$answer" == "n" ]] || [[ "$answer" == "N" ]]; then
      rejected+=("$num")
    else
      [[ " $answer " =~ " $num " ]] && approved+=("$num") || rejected+=("$num")
    fi
  done

  for num in "${rejected[@]}"; do
    marker "$num" "REJECTED"
    echo -e "${YELLOW}Item $num: REJECTED (stays in queue)${NC}"
  done

  if [[ ${#approved[@]} -eq 0 ]]; then
    echo -e "${YELLOW}No items approved. Nothing to execute.${NC}"
    exit 0
  fi

  echo ""
  echo -e "${GREEN}Executing ${#approved[@]} approved item(s)...${NC}"
  echo ""

  local execute_failures=()
  for num in "${approved[@]}"; do
    echo -e "${YELLOW}── Item $num ──${NC}"
    marker "$num" "EXECUTING"

    if "$PROJECT_DIR/scripts/spec-queue-execute.sh" "$num"; then
      # Remove item from SPEC-QUEUE on success
      sed -i "/^${num}\. /d" "$SPEC_QUEUE"
      echo -e "${GREEN}Item $num: DONE and removed from queue${NC}"
    else
      marker "$num" "FAILED"
      execute_failures+=("$num")
      echo -e "${RED}Item $num: FAILED (see execute log)${NC}"
    fi
    echo ""
  done

  # ── sync ──────────────────────────────────────────────────────────────

  echo -e "${YELLOW}── Running spec-queue-sync (holonovel-update) ──${NC}"
  if "$PROJECT_DIR/scripts/spec-queue-sync.sh"; then
    echo -e "${GREEN}Sync: DONE${NC}"
  else
    echo -e "${RED}Sync: FAILED — spec changes applied but dnd5e server not synced. Re-run sync manually.${NC}"
    exit 1
  fi

  # ── validate ──────────────────────────────────────────────────────────

  echo ""
  echo -e "${YELLOW}── Running npm run check ──${NC}"
  CHECK_OUTPUT=$(mktemp)
  set +e
  npm run check > "$CHECK_OUTPUT" 2>&1
  CHECK_RC=$?
  set -e
  tail -20 "$CHECK_OUTPUT"
  rm -f "$CHECK_OUTPUT"

  if [[ $CHECK_RC -eq 0 ]]; then
    echo -e "${GREEN}Validation: PASSED${NC}"
  else
    echo -e "${RED}Validation: FAILED — review errors before committing${NC}"
    exit 1
  fi

  # ── KB update ─────────────────────────────────────────────────────────

  echo ""
  echo -e "${YELLOW}── Updating knowledge base ──${NC}"

  KB_UPDATE_PROMPT="Read the research plan files in .holonovel-state/queue-plans/
for items that were just executed. Extract novel findings and write them to the
knowledge base at .holonovel-state/knowledge-base/:

1. Web findings: For each novel web research result (competitor analysis, best
   practices, domain patterns) not already in KB/web/, write a concise Markdown
   file with title, topic tags, sourced date (today), expiration date (today +
   30 days), key findings (≤10 lines), and source URLs.
2. Implementation analysis: For each novel code analysis finding, write to
   KB/implementation/. Expiration: 14 days from today.
3. Spec summaries: Read each changed section of holonovel.md (use git diff to
   find changes) and write a 50-100 word summary to KB/spec/. Include REQ
   numbers covered.
4. Update KB/INDEX.md — add entries for new files under the appropriate section
   headers. Remove entries for files that no longer exist or are past their
   expiration date.

Keep entries concise. One topic per file. Do NOT commit — just write the KB
files. Report which entries were added, updated, or pruned. End with
'KB UPDATE COMPLETE.'"

  opencode run \
    --agent build \
    --title "kb-update" \
    --dir "$PROJECT_DIR" \
    "$KB_UPDATE_PROMPT" \
    > "$PLANS_DIR/kb-update-output.txt" 2> "$PLANS_DIR/kb-update-log.txt" || true

  echo -e "${GREEN}KB update: DONE (see $PLANS_DIR/kb-update-output.txt)${NC}"

  # ── commit ────────────────────────────────────────────────────────────

  echo ""
  echo -e "${YELLOW}── Staging changes ──${NC}"
  git add holonovel.md SPEC-QUEUE.md CHANGELOG.md dnd5e/ \
    .holonovel-state/knowledge-base/INDEX.md 2>/dev/null || true

  if git diff --staged --quiet 2>/dev/null; then
    echo -e "${YELLOW}No changes to commit.${NC}"
  else
    echo -e "${YELLOW}Committing changes...${NC}"
    echo ""
    echo "Spec queue pipeline cycle $(date +%Y-%m-%d)" > /tmp/cycle-commit-msg.txt
    echo "" >> /tmp/cycle-commit-msg.txt
    for num in "${approved[@]}"; do
      plan="$PLANS_DIR/item-${num}-output.txt"
      if [[ -f "$plan" ]]; then
        first_change=$(grep "^### Change 1:" "$plan" 2>/dev/null | sed 's/^### Change 1: //' || true)
        [[ -n "$first_change" ]] && echo "- Item $num: $first_change" >> /tmp/cycle-commit-msg.txt
      fi
    done
    git commit -F /tmp/cycle-commit-msg.txt
    echo -e "${GREEN}Commit: DONE${NC}"
  fi

  # ── summary ───────────────────────────────────────────────────────────

  echo ""
  echo "═══════════════════════════════════════════════"
  echo -e "${GREEN}Pipeline cycle complete.${NC}"
  echo ""
  for num in "${rejected[@]}"; do echo -e "  ${YELLOW}Item $num: REJECTED${NC}"; done
  for num in "${execute_failures[@]}"; do echo -e "  ${RED}Item $num: FAILED${NC}"; done
  echo ""
  echo -e "${GREEN}Ready to push.${NC}"
  echo "═══════════════════════════════════════════════"
}

# ── dispatch ─────────────────────────────────────────────────────────────

case "${1:-}" in
  status)   cmd_status ;;
  execute)  cmd_execute ;;
  research)
    shift
    exec "$PROJECT_DIR/scripts/spec-queue-runner.sh" "${@}"
    ;;
  *)
    echo "Usage: $0 {research [N]|status|execute}"
    echo ""
    echo "  research [N]  Launch N parallel read-only research sessions"
    echo "  status        List all SPEC-QUEUE items with marker state"
    echo "  execute       Review plans → approve → apply → sync → commit"
    exit 1
    ;;
esac
