#!/usr/bin/env bash
# spec-queue-health.sh — Read-only diagnostic for the spec queue pipeline.
# Reports WAL size, process count, queue state, server dir presence, and
# stale markers. Exit 1 if anything needs attention; 0 if clean.
#
# Usage:
#   ./scripts/spec-queue-health.sh

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SPEC_QUEUE="$PROJECT_DIR/SPEC-QUEUE.md"
PLANS_DIR="$PROJECT_DIR/.holonovel-state/queue-plans"
PID_FILE="$PLANS_DIR/.session-pids"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

issues=0

# ── WAL size ────────────────────────────────────────────────────────────────

echo -e "${YELLOW}── SQLite WAL ──${NC}"
wal_path="$HOME/.local/share/opencode/opencode.db-wal"
if [[ -f "$wal_path" ]]; then
  wal_size=$(stat -c %s "$wal_path" 2>/dev/null || echo 0)
  wal_mb=$(awk "BEGIN {printf \"%.1f\", $wal_size / 1048576}")
  if (( $(echo "$wal_mb > 50" | bc -l 2>/dev/null || echo 0) )); then
    echo -e "  ${RED}WAL: ${wal_mb} MB — large; run cleanup and close all opencode sessions${NC}"
    issues=$((issues + 1))
  else
    echo -e "  ${GREEN}WAL: ${wal_mb} MB${NC}"
  fi
else
  echo -e "  ${GREEN}WAL: not found${NC}"
fi
echo ""

# ── Running opencode processes ──────────────────────────────────────────────

echo -e "${YELLOW}── Running opencode processes ──${NC}"
opencode_count=$(pgrep -c opencode 2>/dev/null || echo 0)
if [[ $opencode_count -eq 0 ]]; then
  echo -e "  ${GREEN}None running${NC}"
else
  total_rss=0
  echo ""
  while IFS= read -r line; do
    pid=$(echo "$line" | awk '{print $1}')
    rss_kb=$(echo "$line" | awk '{print $2}')
    rss_mb=$((rss_kb / 1024))
    total_rss=$((total_rss + rss_mb))
    elapsed=$(ps -o etime= -p "$pid" 2>/dev/null | xargs || echo "?")
    echo -e "  PID $pid — RSS ${rss_mb}MB — uptime $elapsed"
  done < <(pgrep opencode | xargs -I{} ps -p {} -o pid=,rss= 2>/dev/null)
  echo ""
  echo -e "  Total: ${opencode_count} process(es), ${total_rss}MB RSS"
  if [[ $opencode_count -gt 3 ]]; then
    echo -e "  ${RED}High process count — check for stale sessions${NC}"
    issues=$((issues + 1))
  fi
fi
echo ""

# ── Server directories ──────────────────────────────────────────────────────

echo -e "${YELLOW}── Server directories ──${NC}"

# Inform server
inform_dir="$PROJECT_DIR/inform"
if [[ -d "$inform_dir" ]]; then
  inform_spec_hash="none"
  if [[ -f "$inform_dir/DECISIONS.md" ]]; then
    inform_spec_hash=$(grep -oP 'Spec hash:\s*\S+' "$inform_dir/DECISIONS.md" 2>/dev/null | awk '{print $NF}' || echo "present (no hash)")
  fi
  echo -e "  ${GREEN}inform/: present${NC} (spec hash: $inform_spec_hash)"
else
  echo -e "  ${YELLOW}inform/: not found — server not yet built${NC}"
  issues=$((issues + 1))
fi

# dnd5e server
dnd5e_dir="$PROJECT_DIR/dnd5e"
if [[ -d "$dnd5e_dir" ]]; then
  dnd5e_spec_hash="none"
  if [[ -f "$dnd5e_dir/DECISIONS.md" ]]; then
    dnd5e_spec_hash=$(grep -oP 'Spec hash:\s*\S+' "$dnd5e_dir/DECISIONS.md" 2>/dev/null | awk '{print $NF}' || echo "present (no hash)")
  fi
  echo -e "  ${GREEN}dnd5e/: present${NC} (spec hash: $dnd5e_spec_hash)"
else
  echo -e "  ${YELLOW}dnd5e/: not found — server not yet built${NC}"
  issues=$((issues + 1))
fi

# Provider docs
provider_docs="$PROJECT_DIR/inform/docs_md"
if [[ -d "$provider_docs" ]] && [[ -n "$(ls -A "$provider_docs" 2>/dev/null)" ]]; then
  echo -e "  ${GREEN}inform/docs_md/: present${NC}"
else
  echo -e "  ${RED}inform/docs_md/: missing or empty — provider docs required for Inform build${NC}"
  issues=$((issues + 1))
fi
echo ""

# ── Queue state ─────────────────────────────────────────────────────────────

echo -e "${YELLOW}── SPEC-QUEUE state ──${NC}"
unstarted=$(grep -cE '^[0-9]+\. [^[]' "$SPEC_QUEUE" 2>/dev/null || echo 0)
research=$(grep -c '\[RESEARCH\]' "$SPEC_QUEUE" 2>/dev/null || echo 0)
plan_ready=$(grep -c '\[PLAN_READY\]' "$SPEC_QUEUE" 2>/dev/null || echo 0)
executing=$(grep -c '\[EXECUTING\]' "$SPEC_QUEUE" 2>/dev/null || echo 0)
done=$(grep -c '\[DONE\]' "$SPEC_QUEUE" 2>/dev/null || echo 0)
rejected=$(grep -c '\[REJECTED\]' "$SPEC_QUEUE" 2>/dev/null || echo 0)
failed=$(grep -c '\[FAILED\]' "$SPEC_QUEUE" 2>/dev/null || echo 0)

echo "  Unstarted:    $unstarted"
echo "  RESEARCH:     $research"
echo "  PLAN_READY:   $plan_ready"
echo "  EXECUTING:    $executing"
echo "  DONE:         $done"
echo "  REJECTED:     $rejected"
echo "  FAILED:       $failed"
echo ""

# ── Stale markers ───────────────────────────────────────────────────────────

echo -e "${YELLOW}── Stale RESEARCH markers ──${NC}"
if [[ $research -eq 0 ]]; then
  echo -e "  ${GREEN}None${NC}"
else
  stale=0
  while IFS= read -r num; do
    [[ -z "$num" ]] && continue
    pid=$(grep "^${num} " "$PID_FILE" 2>/dev/null | awk '{print $2}' || true)
    if [[ -z "$pid" ]] || ! kill -0 "$pid" 2>/dev/null; then
      stale=$((stale + 1))
      echo -e "  ${RED}#$num: stale (PID ${pid:-none})${NC}"
    else
      echo -e "  ${GREEN}#$num: running (PID $pid)${NC}"
    fi
  done < <(grep -Po '^\d+\.\s\[RESEARCH\]' "$SPEC_QUEUE" | grep -Po '\d+')
  if [[ $stale -gt 0 ]]; then
    issues=$((issues + 1))
  fi
fi
echo ""

# ── PLAN_READY items without plan files ─────────────────────────────────────

echo -e "${YELLOW}── PLAN_READY items missing plan files ──${NC}"
missing=0
while IFS= read -r num; do
  [[ -z "$num" ]] && continue
  if [[ ! -f "$PLANS_DIR/item-${num}-output.txt" ]]; then
    missing=$((missing + 1))
    echo -e "  ${RED}#$num: no plan file${NC}"
  fi
done < <(grep -Po '^\d+\.\s\[PLAN_READY\]' "$SPEC_QUEUE" | grep -Po '\d+')
if [[ $missing -eq 0 ]]; then
  echo -e "  ${GREEN}All present${NC}"
else
  issues=$((issues + 1))
fi
echo ""

# ── Summary ──────────────────────────────────────────────────────────────────

echo -e "${YELLOW}═══════════════════════════════════════════════${NC}"
if [[ $issues -eq 0 ]]; then
  echo -e "${GREEN}Health check: CLEAN — no issues found${NC}"
else
  echo -e "${RED}Health check: ${issues} issue(s) found${NC}"
  echo ""
  echo "Recovery:"
  echo "  ./scripts/spec-queue-runner.sh --cleanup   # kill stale sessions"
  echo "  ./scripts/spec-queue-cycle.sh status        # review queue"
fi
echo -e "${YELLOW}═══════════════════════════════════════════════${NC}"

exit $(( issues > 0 ? 1 : 0 ))
