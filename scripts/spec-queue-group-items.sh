#!/usr/bin/env bash
# spec-queue-group-items.sh — Pre-scan unstarted SPEC-QUEUE items and group
# items with overlapping REQ numbers. Groups reduce redundant spec reading
# across research sessions. Uses TTRPG_GROUP_OVERLAP_THRESHOLD (default 2)
# and TTRPG_MAX_GROUP_SIZE (default 3) for limits.
#
# Output: JSON manifest written to queue-plans/.item-groups.json
#
# Usage:
#   ./scripts/spec-queue-group-items.sh

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SPEC_QUEUE="$PROJECT_DIR/SPEC-QUEUE.md"
PLANS_DIR="$PROJECT_DIR/.holonovel-state/queue-plans"
GROUP_FILE="$PLANS_DIR/.item-groups.json"

OVERLAP_THRESHOLD="${TTRPG_GROUP_OVERLAP_THRESHOLD:-2}"
MAX_GROUP_SIZE="${TTRPG_MAX_GROUP_SIZE:-3}"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

mkdir -p "$PLANS_DIR"

# Collect unstarted items with their REQ sets
declare -A item_reqs
declare -A item_descs
items=()

while IFS='|' read -r num desc; do
  [[ -z "$num" ]] && continue
  local reqs
  reqs=$(echo "$desc" | grep -oP 'REQ-\d+' | sort -u | tr '\n' ' ')
  item_reqs["$num"]="$reqs"
  item_descs["$num"]="$desc"
  items+=("$num")
done < <(
  grep -n '^[0-9]\+\. ' "$SPEC_QUEUE" \
    | grep -v '\[DONE\]' \
    | grep -v '\[RESEARCH\]' \
    | grep -v '\[PLAN_READY\]' \
    | grep -v '\[EXECUTING\]' \
    | grep -v '\[REJECTED\]' \
    | grep -v '\[FAILED\]' \
    | grep -v '\[JOB\]' \
    | sed 's/^[0-9]*:\([0-9]*\)\. /\1|/'
)

if [[ ${#items[@]} -eq 0 ]]; then
  echo '{"groups":[],"singles":[]}' > "$GROUP_FILE"
  echo -e "${GREEN}No unstarted items to group.${NC}"
  exit 0
fi

# Compute pairwise REQ overlap
declare -a groups=()
declare -a grouped_items=()

for ((i=0; i<${#items[@]}; i++)); do
  a="${items[$i]}"
  # Skip if already grouped
  local already=false
  for g in "${grouped_items[@]}"; do
    [[ "$g" == "$a" ]] && already=true
  done
  $already && continue

  local group="$a"
  local group_reqs="${item_reqs[$a]}"
  grouped_items+=("$a")

  for ((j=i+1; j<${#items[@]}; j++)); do
    b="${items[$j]}"
    # Skip if already grouped
    local b_grouped=false
    for g in "${grouped_items[@]}"; do
      [[ "$g" == "$b" ]] && b_grouped=true
    done
    $b_grouped && continue

    # Count shared REQs
    local shared=0
    for req in ${item_reqs[$a]}; do
      [[ " ${item_reqs[$b]} " =~ " $req " ]] && shared=$((shared + 1))
    done

    if [[ $shared -ge $OVERLAP_THRESHOLD ]]; then
      # Check group size cap
      local current_group_size
      current_group_size=$(echo "$group" | wc -w)
      if [[ $current_group_size -lt $MAX_GROUP_SIZE ]]; then
        group="$group $b"
        grouped_items+=("$b")
      fi
    fi
  done

  groups+=("$group")
done

# Build JSON manifest
echo -n '{"groups":[' > "$GROUP_FILE"
first_group=true
for group in "${groups[@]}"; do
  local items_in_group
  items_in_group=$(echo "$group" | wc -w)
  if [[ $items_in_group -eq 1 ]]; then
    # Single item — skip group, goes in singles
    continue
  fi

  $first_group || echo -n ',' >> "$GROUP_FILE"
  first_group=false

  local item_list
  item_list=$(echo "$group" | tr ' ' '\n' | sed 's/.*/"&"/' | tr '\n' ',' | sed 's/,$//')
  # Collect all unique REQs for this group
  local all_reqs=""
  for item in $group; do
    all_reqs="$all_reqs ${item_reqs[$item]}"
  done
  all_reqs=$(echo "$all_reqs" | tr ' ' '\n' | sort -u | tr '\n' ' ' | sed 's/ $//')
  local req_list
  req_list=$(echo "$all_reqs" | tr ' ' '\n' | sed 's/.*/"&"/' | tr '\n' ',' | sed 's/,$//')

  echo -n '{"items":['"$item_list"'],"reqs":['"$req_list"']}' >> "$GROUP_FILE"

  local item_names=""
  for item in $group; do
    item_names="${item_names}#${item} "
  done
  echo -e "  Group: ${item_names}— ${items_in_group} items, REQs: $all_reqs"
done

echo -n '],"singles":[' >> "$GROUP_FILE"

first_single=true
single_count=0

for item in "${items[@]}"; do
  # Check if item is part of a multi-item group
  local in_multi_group=false
  for group in "${groups[@]}"; do
    local sz
    sz=$(echo "$group" | tr ' ' '\n' | grep -c . || echo 0)
    [[ $sz -gt 1 ]] && [[ " $group " =~ " $item " ]] && in_multi_group=true
  done
  $in_multi_group && continue

  $first_single || echo -n ',' >> "$GROUP_FILE"
  first_single=false
  echo -n "\"$item\"" >> "$GROUP_FILE"
  echo -e "  Single: #$item"
  single_count=$((single_count + 1))
done

echo ']}' >> "$GROUP_FILE"

echo ""
local group_count=0
for group in "${groups[@]}"; do
  local sz
  sz=$(echo "$group" | tr ' ' '\n' | grep -c . || echo 0)
  [[ $sz -gt 1 ]] && group_count=$((group_count + 1))
done

echo -e "${GREEN}Grouping complete:${NC} ${group_count} group(s), ${single_count} single(s)"
echo "  Manifest: $GROUP_FILE"
exit 0
