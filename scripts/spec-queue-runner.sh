#!/usr/bin/env bash
# spec-queue-runner.sh — Launch N parallel Opencode research sessions for
# SPEC-QUEUE items. Each session runs Phases 0-2 of the spec-engineering-loop
# (read-only), producing a research report and concrete implementation plan.
# Phase 3 (execution) is run manually after all research completes.
#
# Sessions are detached (nohup + disown) so the runner exits immediately.
# Use --status to check progress and auto-cleanup [RESEARCH] markers.
# Use --cleanup to revert stale [RESEARCH] markers for dead sessions.
#
# Usage:
#   ./scripts/spec-queue-runner.sh [count]   # launch sessions
#   ./scripts/spec-queue-runner.sh --status   # check progress
#   ./scripts/spec-queue-runner.sh --cleanup  # revert stale markers

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SPEC_QUEUE="$PROJECT_DIR/SPEC-QUEUE.md"
PLANS_DIR="$PROJECT_DIR/.holonovel-state/queue-plans"
PID_FILE="$PLANS_DIR/.session-pids"
MAX_PARALLEL="${1:-3}"
SESSION_TIMEOUT_SECONDS="${TTRPG_SESSION_TIMEOUT:-3600}"  # 60 min default

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

mkdir -p "$PLANS_DIR"

# ── helpers ──────────────────────────────────────────────────────────────

pid_alive() { kill -0 "$1" 2>/dev/null; }

clear_marker() {
  local num="$1"
  sed -i "s/^${num}\. \[[A-Z_]*\] /${num}. /" "$SPEC_QUEUE"
}

unmark_research() {
  local num="$1"
  sed -i "s/^${num}\. \[RESEARCH\] /${num}. /" "$SPEC_QUEUE"
}

mark_research() {
  local num="$1"
  clear_marker "$num"
  sed -i "s/^${num}\. /${num}. [RESEARCH] /" "$SPEC_QUEUE"
}

mark_plan_ready() {
  local num="$1"
  sed -i "s/^${num}\. /${num}. [PLAN_READY] /" "$SPEC_QUEUE"
}

# ── --cleanup: revert stale [RESEARCH] markers ────────────────────────────

cmd_cleanup() {
  echo -e "${YELLOW}Checking for stale [RESEARCH] markers...${NC}"
  local cleaned=0 killed=0
  while IFS= read -r num; do
    [[ -z "$num" ]] && continue
    local pid=""
    [[ -f "$PID_FILE" ]] && pid=$(grep "^${num} " "$PID_FILE" 2>/dev/null | awk '{print $2}' || true)
    if [[ -z "$pid" ]] || ! pid_alive "$pid"; then
      unmark_research "$num"
      echo -e "${YELLOW}  Item $num: stale (PID ${pid:-none}) — unmarked${NC}"
      cleaned=$((cleaned + 1))
    else
      echo -e "${GREEN}  Item $num: running (PID $pid)${NC}"
    fi
  done < <(grep -Po '^\d+\.\s\[RESEARCH\]' "$SPEC_QUEUE" | grep -Po '\d+')
  if [[ $cleaned -eq 0 ]]; then
    echo -e "${GREEN}No stale markers found.${NC}"
  fi

  echo ""
  echo -e "${YELLOW}Checking for hung sessions (PID alive, no output for ${SESSION_TIMEOUT_SECONDS}s)...${NC}"
  while IFS=' ' read -r num pid; do
    [[ -z "$num" ]] && continue
    if ! pid_alive "$pid"; then continue; fi
    local out="$PLANS_DIR/item-${num}-output.txt"
    if [[ -f "$out" ]]; then
      local age=$(( $(date +%s) - $(stat -c %Y "$out" 2>/dev/null || echo 0) ))
      if [[ $age -gt $SESSION_TIMEOUT_SECONDS ]]; then
        echo -e "${RED}  Item $num PID $pid: hung (${age}s since last output) — killing${NC}"
        kill "$pid" 2>/dev/null || true
        sleep 1
        kill -9 "$pid" 2>/dev/null || true
        unmark_research "$num"
        killed=$((killed + 1))
      fi
    fi
  done < "$PID_FILE" 2>/dev/null
  if [[ $killed -eq 0 ]]; then
    echo -e "${GREEN}No hung sessions found.${NC}"
  fi
  exit 0
}

# ── --status: check session progress ─────────────────────────────────────

cmd_status() {
  if [[ ! -f "$PID_FILE" ]]; then
    echo -e "${RED}No session PID file found at $PID_FILE. No active research sessions.${NC}"
    exit 1
  fi
  local alive=0 dead=0
  while IFS=' ' read -r num pid; do
    [[ -z "$num" ]] && continue
    local out="$PLANS_DIR/item-${num}-output.txt"
    local log="$PLANS_DIR/item-${num}-log.txt"
    local osize=$(wc -c < "$out" 2>/dev/null || echo 0)
    local llines=$(wc -l < "$log" 2>/dev/null || echo 0)
    if pid_alive "$pid"; then
      alive=$((alive + 1))
      echo -e "${GREEN}Item $num: RUNNING${NC} (PID $pid, output: ${osize}B, log: ${llines} lines)"
    else
      dead=$((dead + 1))
      if grep -q "RESEARCH COMPLETE" "$out" 2>/dev/null; then
        echo -e "${GREEN}Item $num: DONE${NC} (output: ${osize}B, log: ${llines} lines)"
        unmark_research "$num"
        mark_plan_ready "$num"
      else
        echo -e "${RED}Item $num: EXITED${NC} (output: ${osize}B, log: ${llines} lines — no completion marker)"
        unmark_research "$num"
      fi
    fi
  done < "$PID_FILE"
  echo ""
  echo -e "${GREEN}Running: $alive${NC}  Completed/Exited: $dead${NC}"
  exit 0
}

# ── --watch: poll until all sessions complete ─────────────────────────────

cmd_watch() {
  local interval="${2:-10}"
  local tick=0
  local start_time=$(date +%s)
  echo -e "${YELLOW}Watching every ${interval}s... (timeout: ${SESSION_TIMEOUT_SECONDS}s, Ctrl-C to stop)${NC}"
  echo ""
  while :; do
    tick=$((tick + 1))
    local alive=0 dead=0
    local status_lines=()
    while IFS=' ' read -r num pid; do
      [[ -z "$num" ]] && continue
      local out="$PLANS_DIR/item-${num}-output.txt"
      local log="$PLANS_DIR/item-${num}-log.txt"
      if pid_alive "$pid"; then
        local osize=$(wc -c < "$out" 2>/dev/null || echo 0)
        local file_age=$(( $(date +%s) - $(stat -c %Y "$out" 2>/dev/null || echo 0) ))
        if [[ $file_age -gt $SESSION_TIMEOUT_SECONDS ]] && [[ -f "$out" ]]; then
          echo ""
          echo -e "${RED}  Item $num: TIMED OUT (${file_age}s since last output) — killing${NC}"
          kill "$pid" 2>/dev/null || true
          sleep 1
          kill -9 "$pid" 2>/dev/null || true
          unmark_research "$num"
          dead=$((dead + 1))
          status_lines+=("  [TIMEOUT] #$num (${file_age}s)")
        else
          alive=$((alive + 1))
          status_lines+=("  [RUNNING] #$num: ${osize}B")
        fi
      elif grep -q "RESEARCH COMPLETE" "$out" 2>/dev/null; then
        dead=$((dead + 1))
        unmark_research "$num"
        mark_plan_ready "$num"
        status_lines+=("  [DONE]    #$num")
      else
        dead=$((dead + 1))
        unmark_research "$num"
        status_lines+=("  [EXITED]  #$num (no completion marker)")
      fi
    done < "$PID_FILE"
    printf "\r\033[K[%04ds] Running: %d | Done/Exited: %d" "$((tick * interval))" "$alive" "$dead"
    if [[ $alive -eq 0 ]]; then
      echo ""
      echo ""
      echo -e "${GREEN}All sessions complete.${NC}"
      local all_done=true
      for line in "${status_lines[@]}"; do
        echo "$line"
        [[ "$line" =~ EXITED ]] && all_done=false
        [[ "$line" =~ TIMEOUT ]] && all_done=false
      done
      echo ""
      cmd_status
      [[ "$all_done" == true ]] && exit 0 || exit 1
    fi
    sleep "$interval"
  done
}

# ── --notify-watch: background watcher with desktop notification ──────────

cmd_notify_watch() {
  local interval="${1:-10}"
  local ready_file="$PLANS_DIR/.ready"

  [[ ! -f "$PID_FILE" ]] && { echo "No PID file at $PID_FILE" >&2; exit 1; }

  while :; do
    local alive=0 done=0 failed=0 timed_out=0
    local done_nums=() failed_nums=() timeout_nums=()
    while IFS=' ' read -r num pid; do
      [[ -z "$num" ]] && continue
      local out="$PLANS_DIR/item-${num}-output.txt"
      if pid_alive "$pid"; then
        local file_age=$(( $(date +%s) - $(stat -c %Y "$out" 2>/dev/null || echo 0) ))
        if [[ $file_age -gt $SESSION_TIMEOUT_SECONDS ]] && [[ -f "$out" ]]; then
          kill "$pid" 2>/dev/null || true
          sleep 1
          kill -9 "$pid" 2>/dev/null || true
          unmark_research "$num"
          timed_out=$((timed_out + 1))
          timeout_nums+=("$num")
        else
          alive=$((alive + 1))
        fi
      elif grep -q "RESEARCH COMPLETE" "$out" 2>/dev/null; then
        done=$((done + 1))
        unmark_research "$num"
        mark_plan_ready "$num"
        done_nums+=("$num")
      else
        failed=$((failed + 1))
        unmark_research "$num"
        failed_nums+=("$num")
      fi
    done < "$PID_FILE"

    if [[ $alive -eq 0 ]]; then
      local msg_sections=()
      [[ $done -gt 0 ]] && msg_sections+=("$done completed")
      [[ $failed -gt 0 ]] && msg_sections+=("$failed failed")
      [[ $timed_out -gt 0 ]] && msg_sections+=("$timed_out timed out")

      local msg_parts=()
      for num in "${done_nums[@]}"; do
        local title=$(grep "^${num}\. " "$SPEC_QUEUE" 2>/dev/null | head -1 | sed "s/^${num}\. \[[A-Z_]*\] //" | sed 's/ — .*//')
        [[ -n "$title" ]] && msg_parts+=("[#$num] $title")
      done

      local summary="Queue batch complete — $(IFS=, ; echo "${msg_sections[*]}")"
      local body="${msg_parts[*]}"

      if command -v notify-send &>/dev/null; then
        notify-send "Holonovel Queue" "$summary"$'\n'"$body" 2>/dev/null || true
      else
        echo "$summary — $body" >&2
      fi

      {
        echo "$(date -Iseconds) | $summary | $body"
        echo "Ready for review. Run: ./scripts/spec-queue-cycle.sh execute"
      } > "$ready_file"

      [[ $failed -eq 0 ]] && exit 0 || exit 1
    fi
    sleep "$interval"
  done
}

# ── dispatch subcommands ─────────────────────────────────────────────────

case "${1:-}" in
  --status)  cmd_status ;;
  --cleanup) cmd_cleanup ;;
  --watch)
    shift
    cmd_watch "${@}"
    ;;
  --notify-watch)
    shift
    cmd_notify_watch "${@}"
    ;;
esac

# ── launch mode ──────────────────────────────────────────────────────────

# Parse unstarted items (skip items with markers and already-completed)
items=()
while IFS='|' read -r num desc; do
  [[ -n "$num" ]] || continue
  out="$PLANS_DIR/item-${num}-output.txt"
  grep -q "RESEARCH COMPLETE" "$out" 2>/dev/null && continue
  items+=("$num|$desc")
done < <(
  grep -n '^[0-9]\+\. ' "$SPEC_QUEUE" \
    | grep -v '\[RESEARCH\]' \
    | grep -v '\[DONE\]' \
    | grep -v '\[PLAN_READY\]' \
    | grep -v '\[EXECUTING\]' \
    | grep -v '\[REJECTED\]' \
    | grep -v '\[FAILED\]' \
    | sed 's/^[0-9]*:\([0-9]*\)\. /\1|/' \
    | head -n "$MAX_PARALLEL"
)

# Pre-launch: purge dead PIDs from PID file so stale entries don't block new launches
if [[ -f "$PID_FILE" ]]; then
  while IFS=' ' read -r num pid; do
    [[ -z "$num" ]] && continue
    pid_alive "$pid" || unmark_research "$num"
  done < "$PID_FILE" 2>/dev/null
fi

if [[ ${#items[@]} -eq 0 ]]; then
  echo -e "${RED}No unstarted items found in SPEC-QUEUE.md. Run --status or --cleanup?${NC}"
  exit 1
fi

echo -e "${GREEN}Found ${#items[@]} unstarted item(s):${NC}"
for item in "${items[@]}"; do
  echo "  ${item%%|*}: ${item#*|}"
done
echo ""

# Generate prompt for one item
generate_prompt() {
  local num="$1"
  local desc="$2"
  local reqs="" sections=""

  reqs=$(echo "$desc" | grep -oP 'REQ-\d+' | sort -u | tr '\n' ' ')
  sections=$(echo "$desc" | grep -oP '§[\d.]+' | tr '\n' ' ')

  cat <<ENDPROMPT
You are running Phases 0-2 of the spec-engineering-loop workflow for a subsystem
of the Holonovel specification. Work read-only — do NOT modify any files.

SUBSYSTEM: item $num — $desc
REQ numbers: ${reqs:-none specified in queue}
Spec sections: ${sections:-none specified in queue}

Read the attached research protocol file (research-protocol.md) for the full
Phase 0-2 workflow: knowledge base checks, spec reading, changelog trail,
implementation comparison with lag disclaimer, web calibration, reflexion gate,
plan drafting with machine-readable delimiters, and KB write-back.

Spec file: holonovel.md
Verify command: npm run check
Changelog: CHANGELOG.md
End with: "RESEARCH COMPLETE. <N> improvements identified."

Do NOT modify any files. Output only to this conversation.
ENDPROMPT
}

# Launch sessions — detach so parent exit doesn't kill them
true > "$PID_FILE"  # truncate

for item in "${items[@]}"; do
  num="${item%%|*}"
  desc="${item#*|}"

  output_file="$PLANS_DIR/item-${num}-output.txt"
  log_file="$PLANS_DIR/item-${num}-log.txt"

  prompt_text="$(generate_prompt "$num" "$desc")"

  echo -e "${GREEN}Launching session for item $num${NC}: $desc"
  mark_research "$num"

  nohup opencode run \
    "$prompt_text" \
    --agent plan \
    --title "spec-item-${num}-research" \
    --dir "$PROJECT_DIR" \
    --file "$PROJECT_DIR/scripts/research-protocol.md" \
    > "$output_file" 2> "$log_file" &

  pid=$!
  echo "$num $pid" >> "$PID_FILE"
  disown "$pid"
  echo "  PID: $pid"
  echo "  Output: $output_file"
  echo "  Log: $log_file"
  echo ""
done

echo -e "${YELLOW}All ${#items[@]} sessions launched and detached.${NC}"
echo "Monitor:  tail -f $PLANS_DIR/item-*-output.txt"
echo "Status:   ./scripts/spec-queue-runner.sh --status"
echo "Cleanup:  ./scripts/spec-queue-runner.sh --cleanup"
echo -e "${YELLOW}Sessions continue running after this script exits.${NC}"
