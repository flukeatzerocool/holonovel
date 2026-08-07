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

# Kill child opencode processes on script exit (prevent orphan zombies)
cleanup_children() {
  local child_pids
  child_pids=$(jobs -p 2>/dev/null || true)
  [[ -n "$child_pids" ]] && { kill $child_pids 2>/dev/null; sleep 1; kill -9 $child_pids 2>/dev/null; } || true
}
trap cleanup_children EXIT SIGINT SIGTERM

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
  clear_marker "$num"
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
  grep -n '^[0-9]\+\. ' "$SPEC_QUEUE" | grep -v '\. Score:' | while IFS=: read -r line rest; do
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
  local auto_mode=false
  [[ "${1:-}" == "--auto" ]] && auto_mode=true

  echo -e "${YELLOW}Reviewing pending plans...${NC}"
  echo ""

  local items=()
  local rejected=()
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
    num="${item%%|*}"
    desc="${item#*|}"
    plan_file="$PLANS_DIR/item-${num}-output.txt"
    if [[ -f "$plan_file" ]]; then
      change_count=$(grep -c "CHANGE_BEGIN" "$plan_file" 2>/dev/null || echo "?")
      echo "  Item $num: $desc — $change_count change(s)"
    else
      echo "  Item $num: $desc — plan file missing!"
    fi
  done
  echo ""

  if $auto_mode; then
    echo -e "${GREEN}Auto-approving all ${#items[@]} items.${NC}"
    local approved=()
    for item in "${items[@]}"; do
      num="${item%%|*}"
      approved+=("$num")
    done
  else
    read -p "Approve all ${#items[@]} items? [y/n/item numbers]: " answer
    echo ""

    local approved=() rejected=()
    for item in "${items[@]}"; do
      num="${item%%|*}"
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
  fi

  if [[ ${#approved[@]} -eq 0 ]]; then
    echo -e "${YELLOW}No items approved. Nothing to execute.${NC}"
    exit 0
  fi

  echo ""
  echo -e "${GREEN}Executing ${#approved[@]} approved item(s)...${NC}"
  echo ""

  local spec_lines_before=$(wc -l < holonovel.md 2>/dev/null | tr -d ' ' || echo 0)
  local req_count_before=$(grep -cE 'REQ-[0-9]+' holonovel.md 2>/dev/null | tr -d ' ' || echo 0)

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

      # Append AAR excerpt to failure log for cross-cycle visibility
      local exec_out="$PLANS_DIR/item-${num}-execute-output.txt"
      local failure_log="$PLANS_DIR/failures.txt"
      local aar_excerpt=""
      if [[ -f "$exec_out" ]]; then
        aar_excerpt=$(grep -A 10 "## After Action" "$exec_out" 2>/dev/null | head -10 | tr '\n' ' ' | sed 's/[[:space:]]\{2,\}/ /g')
      fi
      cat >> "$failure_log" <<EOF
${num} | $(date -Iseconds) | ${aar_excerpt:-no AAR found in execute output}
EOF
    fi
    echo ""
  done

  # ── sync ──────────────────────────────────────────────────────────────

  echo ""
  echo -e "${YELLOW}── Checking server/spec sync ──${NC}"
  if npm run spec-delta --silent 2>/dev/null; then
    echo -e "${GREEN}Sync: server already in sync — skipped${NC}"
  else
    echo -e "${YELLOW}── Delta detected — running spec-queue-sync (holonovel-update) ──${NC}"
    if "$PROJECT_DIR/scripts/spec-queue-sync.sh"; then
      echo -e "${GREEN}Sync: DONE${NC}"
    else
      echo -e "${RED}Sync: FAILED — spec changes applied but dnd5e server not synced. Re-run sync manually.${NC}"
      exit 1
    fi
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

    local spec_lines_after=$(wc -l < holonovel.md 2>/dev/null | tr -d ' ' || echo 0)
    local req_count_after=$(grep -cE 'REQ-[0-9]+' holonovel.md 2>/dev/null | tr -d ' ' || echo 0)
    local line_delta=$((spec_lines_after - spec_lines_before)) 2>/dev/null || line_delta="?"
    local req_delta=$((req_count_after - req_count_before)) 2>/dev/null || req_delta="?"
    echo "  Spec delta: ${line_delta} lines, ${req_delta} REQ mentions"
  else
    echo -e "${RED}Validation: FAILED — review errors before committing${NC}"
    exit 1
  fi

  # ── KB update ─────────────────────────────────────────────────────────

  echo ""
  echo -e "${YELLOW}── Updating knowledge base ──${NC}"

  local needs_kb=false
  for num in "${approved[@]}"; do
    local plan="$PLANS_DIR/item-${num}-output.txt"
    if [[ -f "$plan" ]]; then
      needs_kb=true
      break
    fi
  done

  if $needs_kb; then
    KB_UPDATE_PROMPT="Update the knowledge base from the research plan files in .holonovel-state/queue-plans/ for items that were just executed. Follow the protocol in the attached kb-update-protocol.md file. End with 'KB UPDATE COMPLETE.'"

    KB_OUT="$PLANS_DIR/kb-update-$(date +%Y%m%d-%H%M%S)-output.txt"
    KB_LOG="$PLANS_DIR/kb-update-$(date +%Y%m%d-%H%M%S)-log.txt"

    if opencode run \
      --agent build \
      --auto \
      --title "kb-update" \
      --dir "$PROJECT_DIR" \
      --file "$PROJECT_DIR/scripts/kb-update-protocol.md" \
      "$KB_UPDATE_PROMPT" \
      > "$KB_OUT" 2> "$KB_LOG"; then
      echo -e "${GREEN}KB update: DONE (see $KB_OUT)${NC}"
    else
      echo -e "${YELLOW}KB update: FAILED — continuing (see $KB_OUT)${NC}"
    fi
  else
    echo -e "${GREEN}KB update: skipped (no new research in this batch)${NC}"
  fi

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

# ── cmd_run_all: automated full-queue pipeline ─────────────────────────

cmd_run_all() {
  local batch_size="${1:-3}"
  local cycle=0

  echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
  echo -e "${GREEN}Holonovel spec queue — full-auto pipeline${NC}"
  echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
  echo ""

  while true; do
    cycle=$((cycle + 1))
    echo -e "${YELLOW}── Cycle $cycle ───────────────────────────────────────────${NC}"
    echo ""

    # Count items by state
    local unstarted=$(grep -cE '^[0-9]+\. [^[]' "$SPEC_QUEUE" 2>/dev/null || echo 0)
    local plan_ready=$(grep -c '\[PLAN_READY\]' "$SPEC_QUEUE" 2>/dev/null || echo 0)
    local in_flight=$(grep -cE '\[RESEARCH\]|\[EXECUTING\]' "$SPEC_QUEUE" 2>/dev/null || echo 0)
    local done=$(grep -c '\[DONE\]' "$SPEC_QUEUE" 2>/dev/null || echo 0)
    local terminal=$(grep -cE '\[REJECTED\]|\[FAILED\]' "$SPEC_QUEUE" 2>/dev/null || echo 0)

    echo "  Unstarted: $unstarted | Plan-ready: $plan_ready | In-flight: $in_flight | Done: $done | Terminal: $terminal"
    echo ""

    # Exit condition: nothing left to process
    if [[ $unstarted -eq 0 ]] && [[ $plan_ready -eq 0 ]] && [[ $in_flight -eq 0 ]]; then
      echo -e "${GREEN}Queue exhausted.${NC}"
      echo ""
      echo -e "${GREEN}Results: $done items DONE, $terminal items terminal${NC}"
      echo ""
      break
    fi

    # If plan-ready items exist, execute them first
    if [[ $plan_ready -gt 0 ]]; then
      echo -e "${YELLOW}Executing $plan_ready plan-ready item(s)...${NC}"
      if cmd_execute "--auto"; then
        echo ""
      else
        echo -e "${RED}Execute failed — aborting pipeline. Fix issues before re-running.${NC}"
        echo -e "${RED}Check logs in .holonovel-state/queue-plans/ for details.${NC}"
        exit 1
      fi
      # After execute, re-check state
      continue
    fi

    # If unstarted items exist, launch research
    if [[ $unstarted -gt 0 ]]; then
      local launch_count=$batch_size
      [[ $unstarted -lt $batch_size ]] && launch_count=$unstarted
      echo -e "${YELLOW}Launching research for $launch_count item(s)...${NC}"
      if "$PROJECT_DIR/scripts/spec-queue-runner.sh" "$launch_count"; then
        echo ""
        echo -e "${YELLOW}Watching for completion...${NC}"
        "$PROJECT_DIR/scripts/spec-queue-runner.sh" --watch || {
          echo -e "${RED}Research watch failed — aborting pipeline.${NC}"
          exit 1
        }
      else
        echo -e "${RED}Research launch failed.${NC}"
        exit 1
      fi
    fi

    # Handle in-flight items (edge case: markers exist but no PID file)
    if [[ $in_flight -gt 0 ]]; then
      echo -e "${YELLOW}Waiting for $in_flight in-flight item(s)...${NC}"
      "$PROJECT_DIR/scripts/spec-queue-runner.sh" --watch || {
        echo -e "${RED}In-flight watch failed — aborting pipeline.${NC}"
        exit 1
      }
    fi
  done

  # ── wrap-up ──────────────────────────────────────────────────────────

  echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
  echo -e "${GREEN}Running post-queue wrap-up...${NC}"
  echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
  echo ""

  if [[ -x "$PROJECT_DIR/scripts/spec-queue-wrapup.sh" ]]; then
    "$PROJECT_DIR/scripts/spec-queue-wrapup.sh"
  else
    echo -e "${RED}Wrap-up script not found at scripts/spec-queue-wrapup.sh${NC}"
    echo -e "${YELLOW}Pipeline complete. Run wrap-up manually when available.${NC}"
    exit 1
  fi
}

# ── dispatch ─────────────────────────────────────────────────────────────

case "${1:-}" in
  status)   cmd_status ;;
  execute)  shift; cmd_execute "${@}" ;;
  run-all)
    shift
    cmd_run_all "${@}"
    ;; 
  research)
    shift
    use_notify=false
    runner_args=()
    for arg in "$@"; do
      [[ "$arg" == "--notify" ]] && use_notify=true || runner_args+=("$arg")
    done
    "$PROJECT_DIR/scripts/spec-queue-runner.sh" "${runner_args[@]}" || exit 1
    echo ""
    if $use_notify; then
      echo -e "${GREEN}Sessions launched. Background watcher started — you'll be notified when complete.${NC}"
      nohup "$PROJECT_DIR/scripts/spec-queue-runner.sh" --notify-watch \
        > "$PLANS_DIR/notify-watch-output.txt" 2> "$PLANS_DIR/notify-watch-log.txt" &
      disown
      echo "  PID: $!"
      echo "  Check status: ./scripts/spec-queue-cycle.sh status"
    else
      echo -e "${GREEN}Sessions launched. Waiting for completion...${NC}"
      exec "$PROJECT_DIR/scripts/spec-queue-runner.sh" --watch
    fi
    ;; 
  watch)
    shift
    exec "$PROJECT_DIR/scripts/spec-queue-runner.sh" --watch "${@}"
    ;; 
  *)
    echo "Usage: $0 {research [N] [--notify]|watch [interval]|status|execute [--auto]|run-all [N]}"
    echo ""
    echo "  research [N] [--notify]  Launch N sessions + watch (--notify: background)"
    echo "  watch [secs]   Poll progress until all sessions complete (default 30s)"
    echo "  status         List all SPEC-QUEUE items with marker state"
    echo "  execute [--auto]  Review plans → approve → apply → sync → commit (--auto: approve all)"
    echo "  run-all [N]    Full-auto pipeline: research → execute → repeat until queue exhausted"
    echo "                  Interrupt-safe — re-run to resume from current queue state"
    exit 1
    ;; 
esac
