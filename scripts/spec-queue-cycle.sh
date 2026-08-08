#!/usr/bin/env bash
# spec-queue-cycle.sh — Top-level orchestrator for the spec-engineering queue
# pipeline. Default (no args) runs the full phased pipeline: research all →
# validate plans → execute + recover → sync → commit → push.
#
# Phases:
#   A — Research all items in parallel batches (pre-warm KB, bundles, groups)
#   B — Validate all [PLAN_READY] plans
#   C — Execute sequentially, recover failures, sync servers, push
#   D — Periodic full rebuild (every N runs, at queue exhaustion)
#
# Usage:
#   ./scripts/spec-queue-cycle.sh                  # full pipeline (default)
#   ./scripts/spec-queue-cycle.sh --batch N        # full pipeline, batch size N
#   ./scripts/spec-queue-cycle.sh research [N]     # launch N research sessions
#   ./scripts/spec-queue-cycle.sh status            # check all items
#   ./scripts/spec-queue-cycle.sh execute [--auto]  # review → apply → sync → push
#   ./scripts/spec-queue-cycle.sh --help            # show usage

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
  sed -i "s/^${num}\. \(\[[A-Z_]*\] \)*/${num}. /" "$SPEC_QUEUE"
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
    [[ "$rest" =~ \[JOB\] ]] && marker_type="JOB"
    desc=$(echo "$rest" | sed 's/^[0-9]\+\. \[[A-Z_]*\] //')
    case "$marker_type" in
      RESEARCH)   echo -e "${YELLOW}$num. [RESEARCH]${NC}   $desc" ;;
      PLAN_READY) echo -e "${GREEN}$num. [PLAN_READY]${NC} $desc" ;;
      EXECUTING)  echo -e "${YELLOW}$num. [EXECUTING]${NC}  $desc" ;;
      REJECTED)   echo -e "${RED}$num. [REJECTED]${NC}   $desc" ;;
      FAILED)     echo -e "${RED}$num. [FAILED]${NC}     $desc" ;;
      DONE)       echo -e "${GREEN}$num. [DONE]${NC}       $desc" ;;
      JOB)        echo -e "${YELLOW}$num. [JOB]${NC}        $desc" ;;
      *)          echo "  $num.              $desc" ;;
    esac
  done
  echo ""
  exit 0
}

# ── cmd_execute: review, apply, sync, KB update, commit ──────────────────

cmd_execute() {
  local auto_mode=false
  local force_sync=false
  for arg in "$@"; do
    [[ "$arg" == "--auto" ]] && auto_mode=true
    [[ "$arg" == "--force-sync" ]] && force_sync=true
  done

  # ── ad-hoc jobs (executed first, skips research phase) ─────────────────

  local job_nums=()
  while IFS= read -r line; do
    num=$(echo "$line" | grep -Po '^\d+')
    [[ -n "$num" ]] && job_nums+=("$num")
  done < <(grep '\[JOB\]' "$SPEC_QUEUE")

  if [[ ${#job_nums[@]} -gt 0 ]]; then
    echo -e "${YELLOW}Processing ${#job_nums[@]} ad-hoc job(s)...${NC}"
    echo ""

    for num in "${job_nums[@]}"; do
      local job_plan=""
      job_plan=$(sed -n "/^${num}\. \[JOB\]/s/.*plan: //p" "$SPEC_QUEUE" | tr -d ' ')
      [[ -z "$job_plan" ]] && { echo -e "${RED}Job $num: missing plan: pointer${NC}"; continue; }

      # Resolve relative plan path
      [[ "$job_plan" != /* ]] && job_plan="$PROJECT_DIR/$job_plan"
      if [[ ! -f "$job_plan" ]]; then
        echo -e "${RED}Job $num: plan file not found — $job_plan${NC}"
        marker "$num" "FAILED"
        continue
      fi

      echo -e "${YELLOW}── Job $num ──${NC}"
      marker "$num" "EXECUTING"

      # Copy plan to location execute expects
      cp "$job_plan" "$PLANS_DIR/item-${num}-output.txt"

      if "$PROJECT_DIR/scripts/spec-queue-execute.sh" "$num"; then
        sed -i "/^${num}\. /d" "$SPEC_QUEUE"
        echo -e "${GREEN}Job $num: DONE and removed from queue${NC}"
      else
        marker "$num" "FAILED"
        echo -e "${RED}Job $num: FAILED (see execute log)${NC}"
      fi
      echo ""
    done
  fi

  # ── research-derived items ─────────────────────────────────────────────

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
    local jobs_processed=""
    jobs_processed=$(grep -c '\[JOB\]' "$SPEC_QUEUE" 2>/dev/null); jobs_processed=${jobs_processed:-0}
    if [[ $jobs_processed -eq 0 ]]; then
      echo -e "${YELLOW}No items to execute.${NC}"
    else
      echo -e "${YELLOW}Jobs processed; no additional items to execute.${NC}"
    fi
    exit 0
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

  # ── recovery loop on residual failures ────────────────────────────────

  local recovery_cycles="${TTRPG_RECOVERY_CYCLES:-2}"
  local recovery_round=0

  while true; do
    local failed_count
    failed_count=$(grep -c '\[FAILED\]' "$SPEC_QUEUE" 2>/dev/null || echo 0)
    [[ $failed_count -eq 0 ]] && break
    [[ $recovery_round -ge $recovery_cycles ]] && break

    recovery_round=$((recovery_round + 1))
    echo ""
    echo -e "${YELLOW}── Recovery round $recovery_round/$recovery_cycles ($failed_count failed item(s)) ──${NC}"

    local recovered=()
    while IFS= read -r num; do
      [[ -z "$num" ]] && continue
      echo -e "${YELLOW}Recovering item $num...${NC}"
      if "$PROJECT_DIR/scripts/spec-queue-recover.sh" "$num"; then
        "$PROJECT_DIR/scripts/spec-queue-execute.sh" "$num" && {
          sed -i "/^${num}\. /d" "$SPEC_QUEUE"
          echo -e "${GREEN}Item $num: RECOVERED + DONE${NC}"
          recovered+=("$num")
        } || {
          marker "$num" "FAILED"
          echo -e "${RED}Item $num: recovery applied but re-execute FAILED${NC}"
        }
      else
        echo -e "${RED}Item $num: recovery FAILED${NC}"
      fi
    done < <(grep -Po '^\d+\.\s\[FAILED\]' "$SPEC_QUEUE" | grep -Po '\d+')

    echo ""
    if [[ ${#recovered[@]} -gt 0 ]]; then
      echo -e "${GREEN}Recovered ${#recovered[@]} item(s) this round.${NC}"
    fi
  done

  # ── sync (always runs after every pipeline execution) ──────────────────

  echo ""
  echo -e "${YELLOW}── Syncing servers with spec ──${NC}"

  local sync_failures=()
  local sync_servers=("inform" "dnd5e")

  for server in "${sync_servers[@]}"; do
    local sync_failed=false
    local sync_attempt=0
    local max_sync_attempts=2

    while [[ $sync_attempt -lt $max_sync_attempts ]]; do
      sync_attempt=$((sync_attempt + 1))
      if [[ $sync_attempt -gt 1 ]]; then
        echo -e "${YELLOW}  Sync $server retry $sync_attempt/$max_sync_attempts...${NC}"
      fi

      if npm run spec-delta -- --server "$server" --silent 2>/dev/null; then
        echo -e "${GREEN}  Sync ($server): already in sync${NC}"
        sync_failed=false
        break
      fi

      echo -e "${YELLOW}  Sync ($server): delta detected — running holonovel-update...${NC}"
      if "$PROJECT_DIR/scripts/spec-queue-sync.sh" --server "$server"; then
        echo -e "${GREEN}  Sync ($server): DONE${NC}"
        sync_failed=false
        break
      fi
      sync_failed=true
    done

    if $sync_failed; then
      sync_failures+=("$server")
      echo -e "${RED}  Sync ($server): FAILED after $max_sync_attempts attempts — continuing${NC}"
    fi
  done

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

  # ── commit + push ────────────────────────────────────────────────────

  echo ""
  echo -e "${YELLOW}── Staging changes ──${NC}"
  git add holonovel.md SPEC-QUEUE.md CHANGELOG.md dnd5e/ inform/ \
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

    echo ""
    echo -e "${YELLOW}── Pushing to origin ──${NC}"
    if git push origin main 2>&1; then
      echo -e "${GREEN}Push: DONE${NC}"
    else
      echo -e "${RED}Push: FAILED — manual push required${NC}"
    fi
  fi

  # ── summary ───────────────────────────────────────────────────────────

  local final_failed
  final_failed=$(grep -c '\[FAILED\]' "$SPEC_QUEUE" 2>/dev/null || echo 0)
  local final_rejected
  final_rejected=$(grep -c '\[REJECTED\]' "$SPEC_QUEUE" 2>/dev/null || echo 0)

  echo ""
  echo "═══════════════════════════════════════════════"
  echo -e "${GREEN}Pipeline cycle complete.${NC}"
  echo ""
  echo "  Items executed: ${#approved[@]}"
  [[ ${#rejected[@]} -gt 0 ]] && echo -e "  ${YELLOW}Rejected: ${#rejected[@]}${NC}"
  [[ $final_failed -gt 0 ]] && echo -e "  ${RED}Failed (recovery exhausted): $final_failed${NC}"
  [[ $final_rejected -gt 0 ]] && echo -e "  ${YELLOW}Rejected (in queue): $final_rejected${NC}"
  [[ ${#sync_failures[@]} -gt 0 ]] && echo -e "  ${RED}Sync failures: ${sync_failures[*]}${NC}"
  echo ""
  echo -e "${GREEN}Pushed to origin.${NC}"
  echo "═══════════════════════════════════════════════"
}

# ── cmd_pipeline: full phased A-B-C-D pipeline ──────────────────────────

cmd_pipeline() {
  local batch_size="${1:-${TTRPG_RESEARCH_BATCH_SIZE:-5}}"

  echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
  echo -e "${GREEN}Holonovel spec queue — phased pipeline${NC}"
  echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
  echo ""

  # ──────────────────────────────────────────────────────────────────────
  # PHASE A — Research all items (parallel batches)
  # ──────────────────────────────────────────────────────────────────────

  echo -e "${GREEN}────────── Phase A: Research all ──────────${NC}"
  echo ""

  # A.1 — Pre-warm KB (batch web calibration)
  local kb_marker="$KB_DIR/.web-recalibrated"
  local prewarm_needed=true
  if [[ -f "$kb_marker" ]]; then
    local marker_date
    marker_date=$(cat "$kb_marker" 2>/dev/null || echo "")
    [[ "$marker_date" == "$(date +%Y-%m-%d)" ]] && prewarm_needed=false
  fi
  if $prewarm_needed; then
    echo -e "${YELLOW}── A.1: Pre-warming knowledge base ──${NC}"
    if "$PROJECT_DIR/scripts/spec-queue-prewarm-kb.sh"; then
      echo -e "${GREEN}Pre-warm: DONE${NC}"
    else
      echo -e "${YELLOW}Pre-warm: FAILED — continuing without cached web data${NC}"
    fi
    echo ""
  else
    echo -e "${GREEN}── A.1: KB already pre-warmed today — skipped${NC}"
    echo ""
  fi

  # A.2 — Prep per-item spec bundles
  echo -e "${YELLOW}── A.2: Preparing reference bundles ──${NC}"
  if "$PROJECT_DIR/scripts/spec-queue-prep-bundles.sh"; then
    echo -e "${GREEN}Bundles: DONE${NC}"
  else
    echo -e "${YELLOW}Bundles: FAILED — research sessions will grep spec directly${NC}"
  fi
  echo ""

  # A.3 — Group overlapping items
  echo -e "${YELLOW}── A.3: Grouping items by REQ overlap ──${NC}"
  "$PROJECT_DIR/scripts/spec-queue-group-items.sh"
  local group_file="$PLANS_DIR/.item-groups.json"
  echo ""

  # A.4 — Research loop
  echo -e "${GREEN}── A.4: Launching research sessions ──${NC}"
  echo ""

  local retry_count=0
  local max_research_retries=3

  while true; do
    local unstarted
    unstarted=$(grep -cE '^[0-9]+\. [^[]' "$SPEC_QUEUE" 2>/dev/null || echo 0)
    local in_flight
    in_flight=$(grep -cE '\[RESEARCH\]' "$SPEC_QUEUE" 2>/dev/null || echo 0)

    if [[ $unstarted -eq 0 ]] && [[ $in_flight -eq 0 ]]; then
      echo -e "${GREEN}All items researched.${NC}"
      break
    fi

    if [[ $unstarted -gt 0 ]]; then
      local launch_count=$batch_size
      [[ $unstarted -lt $batch_size ]] && launch_count=$unstarted
      echo -e "${YELLOW}Launching $launch_count research session(s) ($unstarted unstarted)...${NC}"
      if "$PROJECT_DIR/scripts/spec-queue-runner.sh" "$launch_count"; then
        echo -e "${YELLOW}Watching for completion...${NC}"
        "$PROJECT_DIR/scripts/spec-queue-runner.sh" --watch || {
          retry_count=$((retry_count + 1))
          if [[ $retry_count -ge $max_research_retries ]]; then
            echo -e "${RED}Research watch failed $retry_count times — aborting.${NC}"
            exit 1
          fi
          echo -e "${YELLOW}Research watch had failures — retrying (${retry_count}/$max_research_retries)...${NC}"
        }
      else
        echo -e "${RED}Research launch failed.${NC}"
        exit 1
      fi
    elif [[ $in_flight -gt 0 ]]; then
      echo -e "${YELLOW}Waiting for $in_flight in-flight session(s)...${NC}"
      "$PROJECT_DIR/scripts/spec-queue-runner.sh" --watch || {
        retry_count=$((retry_count + 1))
        if [[ $retry_count -ge $max_research_retries ]]; then
          echo -e "${RED}In-flight watch failed $retry_count times — aborting.${NC}"
          exit 1
        fi
      }
    fi
    echo ""
  done

  # ──────────────────────────────────────────────────────────────────────
  # PHASE B — Validate all plans
  # ──────────────────────────────────────────────────────────────────────

  echo ""
  echo -e "${GREEN}────────── Phase B: Validate plans ──────────${NC}"
  echo ""
  if "$PROJECT_DIR/scripts/spec-queue-validate-plans.sh"; then
    echo -e "${GREEN}Phase B: all plans valid${NC}"
  else
    echo -e "${YELLOW}Phase B: some plans invalid — marked [FAILED]${NC}"
  fi

  # ──────────────────────────────────────────────────────────────────────
  # PHASE C — Execute + Recover + Sync + Push
  # ──────────────────────────────────────────────────────────────────────

  echo ""
  echo -e "${GREEN}────────── Phase C: Execute + Recover ──────────${NC}"

  cmd_execute --auto

  # ──────────────────────────────────────────────────────────────────────
  # PHASE D — Periodic rebuild (every N runs, at queue exhaustion)
  # ──────────────────────────────────────────────────────────────────────

  local rebuild_counter_file="$PLANS_DIR/.rebuild-counter"
  local rebuild_interval="${TTRPG_REBUILD_INTERVAL:-5}"
  local queue_exhausted=false

  local remaining
  remaining=$(grep -cE '^[0-9]+\. ' "$SPEC_QUEUE" 2>/dev/null || echo 0)
  [[ $remaining -eq 0 ]] && queue_exhausted=true

  local rebuild_count=0
  [[ -f "$rebuild_counter_file" ]] && rebuild_count=$(cat "$rebuild_counter_file" 2>/dev/null || echo 0)
  rebuild_count=$((rebuild_count + 1))

  local do_rebuild=false
  if $queue_exhausted; then
    do_rebuild=true
    echo "0" > "$rebuild_counter_file"
  elif [[ $rebuild_count -ge $rebuild_interval ]]; then
    do_rebuild=true
    echo "0" > "$rebuild_counter_file"
  else
    echo "$rebuild_count" > "$rebuild_counter_file"
  fi

  if $do_rebuild; then
    echo ""
    echo -e "${GREEN}────────── Phase D: Rebuild servers ──────────${NC}"
    echo ""
    if [[ -x "$PROJECT_DIR/scripts/spec-queue-wrapup.sh" ]]; then
      "$PROJECT_DIR/scripts/spec-queue-wrapup.sh"
    else
      echo -e "${RED}Wrap-up/rebuild script not found at scripts/spec-queue-wrapup.sh${NC}"
      echo -e "${YELLOW}Pipeline complete. Run rebuild manually when available.${NC}"
      exit 1
    fi
  else
    echo ""
    echo -e "${YELLOW}Rebuild deferred — ${rebuild_count}/${rebuild_interval} runs since last rebuild${NC}"
  fi
}

# ── dispatch ─────────────────────────────────────────────────────────────

case "${1:-}" in
  --help|-h)
    echo "Usage: $0 [--batch N] [command] [args...]"
    echo ""
    echo "  (no args)         Full phased pipeline (default)"
    echo "  --batch N         Set research batch size (default 5)"
    echo ""
    echo "Commands:"
    echo "  pipeline [N]      Full pipeline: research → validate → execute → push"
    echo "  research [N] [--notify]  Launch N research sessions + watch"
    echo "  watch [secs]      Poll progress until all sessions complete"
    echo "  status            List all SPEC-QUEUE items with marker state"
    echo "  execute [--auto]  Review plans → apply → sync → push"
    echo ""
    echo "Env vars:"
    echo "  TTRPG_RESEARCH_BATCH_SIZE   Research batch size (default 5)"
    echo "  TTRPG_MAX_RESEARCH_SESSIONS Max concurrent sessions (default 5)"
    echo "  TTRPG_RECOVERY_CYCLES       Recovery retry cycles (default 2)"
    echo "  TTRPG_REBUILD_INTERVAL      Runs between full rebuilds (default 5)"
    echo "  TTRPG_GROUP_OVERLAP_THRESHOLD  Min shared REQs to group items (default 2)"
    echo "  TTRPG_MAX_GROUP_SIZE        Max items per research group (default 3)"
    exit 0
    ;;
  status)   cmd_status ;;
  execute)  shift; cmd_execute "${@}" ;;
  pipeline|run-all)
    shift
    cmd_pipeline "${@}"
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
    # Default: full pipeline
    batch=""
    for arg in "$@"; do
      if [[ "$arg" == "--batch" ]]; then continue; fi
      [[ -n "$batch" ]] && batch="$arg"
    done
    cmd_pipeline "${batch:-}"
    ;;
esac
