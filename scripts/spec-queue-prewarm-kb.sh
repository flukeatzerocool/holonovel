#!/usr/bin/env bash
# spec-queue-prewarm-kb.sh — Batch web calibration across all SPEC-QUEUE items.
# Concatenates all research questions into one prompt, launches a single
# opencode session that searches the web for all items and populates KB/web/.
# After prewarm, research sessions skip web calibration — KB is fresh.
#
# Usage:
#   ./scripts/spec-queue-prewarm-kb.sh
#   ./scripts/spec-queue-prewarm-kb.sh --only 1,3,5

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SPEC_QUEUE="$PROJECT_DIR/SPEC-QUEUE.md"
KB_DIR="$PROJECT_DIR/.holonovel-state/knowledge-base"
PLANS_DIR="$PROJECT_DIR/.holonovel-state/queue-plans"
KB_MARKER="$KB_DIR/.web-recalibrated"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

mkdir -p "$KB_DIR/web" "$PLANS_DIR"

only_items=""
for arg in "$@"; do
  [[ "$arg" == "--only" ]] && continue
  [[ -n "$only_items" ]] && only_items="$arg"
done

# Check if KB already pre-warmed today
if [[ -f "$KB_MARKER" ]]; then
  marker_date=$(cat "$KB_MARKER" 2>/dev/null || echo "")
  if [[ "$marker_date" == "$(date +%Y-%m-%d)" ]]; then
    echo -e "${GREEN}KB already pre-warmed today ($marker_date). Skipping.${NC}"
    echo "  Use --force to override."
    exit 0
  fi
fi

# Collect research questions from SPEC-QUEUE items
questions=""
item_count=0

while IFS='|' read -r num desc; do
  [[ -z "$num" ]] && continue

  if [[ -n "$only_items" ]]; then
    [[ " $only_items " =~ " $num " ]] || continue
  fi

  research_line=$(echo "$desc" | grep -oP 'Research:.*' || true)
  [[ -z "$research_line" ]] && continue

  item_count=$((item_count + 1))
  questions+="## Item $num\n$research_line\n\n"
done < <(
  grep -n '^[0-9]\+\. ' "$SPEC_QUEUE" \
    | grep -v '\[DONE\]' \
    | grep -v '\[REJECTED\]' \
    | grep -v '\[FAILED\]' \
    | sed 's/^[0-9]*:\([0-9]*\)\. /\1|/'
)

if [[ $item_count -eq 0 ]]; then
  echo -e "${YELLOW}No items with research questions found.${NC}"
  date +%Y-%m-%d > "$KB_MARKER"
  exit 0
fi

echo -e "${GREEN}Pre-warming KB for $item_count item(s)...${NC}"
echo ""

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
PREWARM_OUT="$PLANS_DIR/prewarm-kb-${TIMESTAMP}-output.txt"
PREWARM_LOG="$PLANS_DIR/prewarm-kb-${TIMESTAMP}-log.txt"

PREWARM_PROMPT="You are running a batch web calibration pass for the Holonovel spec
engineering queue. For each of the following research questions, search the
web for current information (2025-2026), find authoritative sources, and
write findings to \`.holonovel-state/knowledge-base/web/\`.

Follow the 8-axis persona evaluation framework:
  - Utility, Interaction comfort, Translucency, Continuity, Agency,
    Discoverability, Game-awareness, Holodeck alignment (composite)
  - Seven personas: live tabletop GM, solo roleplayer, video/remote,
    VTT user, AI RP hobbyist, play-by-post, Inform/IF player
  - Weight research toward the personas most affected by each subsystem

KB file format (one topic per file):
  # Title
  Tags: tag1, tag2
  **Sourced:** YYYY-MM-DD | **Expires:** YYYY-MM-DD (today + 30 days)
  ## Findings
  (concise bullets, ≤10 lines)
  ## Sources
  - URL
  - URL

After writing all KB entries:
1. Update \`.holonovel-state/knowledge-base/INDEX.md\` — add entries for
   new files under the ## web/ section.
2. Write \`.holonovel-state/knowledge-base/web/holodeck-episodes.md\` —
   an inventory of Star Trek Holodeck episodes with scene-to-subsystem
   mapping (see research protocol for episodes).
3. Write \`.holonovel-state/knowledge-base/web/failure-modes.md\` —
   quit-moment catalog per persona (one quit moment per persona).
4. Write \`.holonovel-state/knowledge-base/web/benchmark-landscape.md\` —
   competitive landscape per axis (Translucency, Continuity, Agency,
   Discoverability, Game-awareness, Holodeck composite).
5. Write today's date to \`.holonovel-state/knowledge-base/.web-recalibrated\`.

Here are the research questions:

$questions

Do NOT modify any files outside .holonovel-state/knowledge-base/.
End with: \"PREWARM COMPLETE. N KB entries written.\""

set +e
opencode run \
  "$PREWARM_PROMPT" \
  --agent plan \
  --auto \
  --title "spec-prewarm-kb" \
  --dir "$PROJECT_DIR" \
  > "$PREWARM_OUT" 2> "$PREWARM_LOG"
rc=$?
set -e

if [[ $rc -eq 0 ]] && grep -q "PREWARM COMPLETE" "$PREWARM_OUT" 2>/dev/null; then
  date +%Y-%m-%d > "$KB_MARKER"
  entries=$(grep -oP '\d+ KB entries' "$PREWARM_OUT" 2>/dev/null | grep -oP '\d+' || echo "?")
  echo -e "${GREEN}Pre-warm: DONE — $entries entries written${NC}"
  exit 0
fi

echo -e "${RED}Pre-warm: FAILED (exit $rc) — see $PREWARM_OUT${NC}"
exit 1
