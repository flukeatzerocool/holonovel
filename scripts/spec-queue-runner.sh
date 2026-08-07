#!/usr/bin/env bash
# spec-queue-runner.sh — Launch N parallel Opencode research sessions for
# SPEC-QUEUE items. Each session runs Phases 0-2 of the spec-engineering-loop
# (read-only), producing a research report and concrete implementation plan.
# Phase 3 (execution) is run manually after all research completes.
#
# Sessions are detached (nohup + disown) so the runner exits immediately.
# Use --status to check progress and auto-cleanup [IN PROGRESS] markers.
# Use --cleanup to revert stale [IN PROGRESS] markers for dead sessions.
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

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

mkdir -p "$PLANS_DIR"

# ── helpers ──────────────────────────────────────────────────────────────

pid_alive() { kill -0 "$1" 2>/dev/null; }

unmark_in_progress() {
  local num="$1"
  sed -i "s/^${num}\. \[RESEARCH\] /${num}. /" "$SPEC_QUEUE"
}

mark_in_progress() {
  local num="$1"
  sed -i "s/^${num}\. /${num}. [RESEARCH] /" "$SPEC_QUEUE"
}

# ── --cleanup: revert stale [IN PROGRESS] markers ────────────────────────

cmd_cleanup() {
  echo -e "${YELLOW}Checking for stale [IN PROGRESS] markers...${NC}"
  local cleaned=0
  while IFS= read -r num; do
    [[ -z "$num" ]] && continue
    local pid=""
    [[ -f "$PID_FILE" ]] && pid=$(grep "^${num} " "$PID_FILE" 2>/dev/null | awk '{print $2}' || true)
    if [[ -z "$pid" ]] || ! pid_alive "$pid"; then
      unmark_in_progress "$num"
      echo -e "${YELLOW}  Item $num: stale (PID ${pid:-none}) — unmarked${NC}"
      cleaned=$((cleaned + 1))
    else
      echo -e "${GREEN}  Item $num: running (PID $pid)${NC}"
    fi
  done < <(grep -Po '^\d+\.\s\[RESEARCH\]' "$SPEC_QUEUE" | grep -Po '\d+')
  if [[ $cleaned -eq 0 ]]; then
    echo -e "${GREEN}No stale markers found.${NC}"
  fi
  exit 0
}

# ── --status: check session progress ─────────────────────────────────────

cmd_status() {
  if [[ ! -f "$PID_FILE" ]]; then
    echo -e "${RED}No session PID file found at $PID_FILE. Run without --status first.${NC}"
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
        unmark_in_progress "$num"
      else
        echo -e "${RED}Item $num: EXITED${NC} (output: ${osize}B, log: ${llines} lines — no completion marker)"
        unmark_in_progress "$num"
      fi
    fi
  done < "$PID_FILE"
  echo ""
  echo -e "${GREEN}Running: $alive${NC}  Completed/Exited: $dead${NC}"
  exit 0
}

# ── dispatch subcommands ─────────────────────────────────────────────────

case "${1:-}" in
  --status)  cmd_status ;;
  --cleanup) cmd_cleanup ;;
esac

# ── launch mode ──────────────────────────────────────────────────────────

# Parse unstarted items (skip [IN PROGRESS])
items=()
while IFS='|' read -r num desc; do
  [[ -n "$num" ]] && items+=("$num|$desc")
done < <(
  grep -n '^[0-9]\+\. ' "$SPEC_QUEUE" \
    | grep -v '\[RESEARCH\]' \
    | sed 's/^[0-9]*:\([0-9]*\)\. /\1|/' \
    | head -n "$MAX_PARALLEL"
)

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
  cat <<ENDPROMPT
You are running Phases 0-2 of the spec-engineering-loop workflow for a subsystem
of the Holonovel specification. Work read-only — do NOT modify any files.

SUBSYSTEM: item $num — $desc

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
  mark_in_progress "$num"

  nohup opencode run \
    --agent plan \
    --title "spec-item-${num}-research" \
    --dir "$PROJECT_DIR" \
    --file "$PROJECT_DIR/scripts/research-protocol.md" \
    "$prompt_text" \
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
