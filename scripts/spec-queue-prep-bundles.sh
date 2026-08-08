#!/usr/bin/env bash
# spec-queue-prep-bundles.sh — Generate per-item reference bundles for
# research sessions. Each bundle contains spec paragraphs, changelog
# entries, and implementation references matching the item's REQ numbers
# and section keywords. Bundles are cached — regenerated only when the
# spec git hash changes.
#
# Usage:
#   ./scripts/spec-queue-prep-bundles.sh
#   ./scripts/spec-queue-prep-bundles.sh --force

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SPEC_QUEUE="$PROJECT_DIR/SPEC-QUEUE.md"
PLANS_DIR="$PROJECT_DIR/.holonovel-state/queue-plans"
BUNDLE_CACHE="$PLANS_DIR/.bundle-hash"
SPEC_HASH=$(git -C "$PROJECT_DIR" rev-parse HEAD 2>/dev/null || echo "unknown")

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

mkdir -p "$PLANS_DIR"

force=false
[[ "${1:-}" == "--force" ]] && force=true

# Check cache freshness
if [[ "$force" == false ]] && [[ -f "$BUNDLE_CACHE" ]]; then
  cached_hash=$(cat "$BUNDLE_CACHE" 2>/dev/null || echo "")
  if [[ "$cached_hash" == "$SPEC_HASH" ]]; then
    echo -e "${GREEN}Bundles fresh (spec hash: ${SPEC_HASH:0:8}). Skipping.${NC}"
    echo "  Use --force to regenerate."
    exit 0
  fi
fi

echo -e "${YELLOW}Preparing reference bundles...${NC}"
echo ""

bundle_count=0

while IFS='|' read -r num desc; do
  [[ -z "$num" ]] && continue

  local bundle_file="$PLANS_DIR/bundle-item-${num}.md"
  local reqs
  reqs=$(echo "$desc" | grep -oP 'REQ-\d+' | sort -u | tr '\n' ' ' | sed 's/ $//')
  local sections
  sections=$(echo "$desc" | grep -oP '§[\d.]+' | tr '\n' ' ' | sed 's/ $//')

  {
    echo "# Bundle Item $num"
    echo ""
    echo "**REQs:** ${reqs:-none}"
    echo "**Sections:** ${sections:-none}"
    echo "**Generated:** $(date -Iseconds)"
    echo "**Spec hash:** ${SPEC_HASH:0:12}"
    echo ""
    echo "## Spec References"
    echo ""

    # Grep spec source files for each REQ number
    if [[ -n "$reqs" ]]; then
      for req in $reqs; do
        local matches
        matches=$(grep -nH "$req" "$PROJECT_DIR/spec/"*.md 2>/dev/null || true)
        if [[ -n "$matches" ]]; then
          echo "### $req"
          echo ""
          while IFS= read -r match; do
            local file
            file=$(echo "$match" | cut -d: -f1 | xargs basename)
            local line
            line=$(echo "$match" | cut -d: -f2)
            local text
            text=$(echo "$match" | cut -d: -f3-)
            echo "- \`${file}:${line}\` — ${text}"
          done <<< "$matches"
          echo ""
        fi
      done
    fi

    # Grep spec source files for section references
    if [[ -n "$sections" ]]; then
      for sec in $sections; do
        local sec_match
        sec_match=$(grep -nH "$sec" "$PROJECT_DIR/spec/"*.md 2>/dev/null | head -5 || true)
        if [[ -n "$sec_match" ]]; then
          echo "### $sec context"
          echo ""
          while IFS= read -r match; do
            local file
            file=$(echo "$match" | cut -d: -f1 | xargs basename)
            local line
            line=$(echo "$match" | cut -d: -f2)
            local text
            text=$(echo "$match" | cut -d: -f3-)
            echo "- \`${file}:${line}\` — ${text}"
          done <<< "$sec_match"
          echo ""
        fi
      done
    fi

    echo "## Changelog Trail"
    echo ""

    if [[ -n "$reqs" ]]; then
      for req in $reqs; do
        local changelog_match
        changelog_match=$(grep -n "$req" "$PROJECT_DIR/CHANGELOG.md" 2>/dev/null | head -3 || true)
        if [[ -n "$changelog_match" ]]; then
          echo "### $req"
          echo ""
          while IFS= read -r match; do
            local line
            line=$(echo "$match" | cut -d: -f1)
            local text
            text=$(echo "$match" | cut -d: -f2-)
            echo "- L${line}: ${text}"
          done <<< "$changelog_match"
          echo ""
        fi
      done
    fi

    # Implementation references
    echo "## Implementation References"
    echo ""

    if [[ -n "$reqs" ]]; then
      for server_dir in dnd5e inform; do
        local server_path="$PROJECT_DIR/$server_dir"
        [[ -d "$server_path" ]] || continue
        local impl_matches
        impl_matches=""
        for req in $reqs; do
          local found
          found=$(grep -rl "$req" "$server_path/src/" 2>/dev/null | head -3 || true)
          [[ -n "$found" ]] && impl_matches+="$found"$'\n'
        done
        impl_matches=$(echo "$impl_matches" | sort -u | sed '/^$/d')
        if [[ -n "$impl_matches" ]]; then
          echo "### $server_dir/"
          echo ""
          while IFS= read -r file; do
            [[ -z "$file" ]] && continue
            local rel="${file#$PROJECT_DIR/}"
            echo "- \`$rel\`"
          done <<< "$impl_matches"
          echo ""
        fi
      done
    fi

  } > "$bundle_file"

  local size
  size=$(wc -c < "$bundle_file" 2>/dev/null || echo 0)
  echo -e "  Item $num: ${size}B — ${reqs:-no REQs}, ${sections:-no sections}"

  bundle_count=$((bundle_count + 1))
done < <(
  grep -n '^[0-9]\+\. ' "$SPEC_QUEUE" \
    | grep -v '\[DONE\]' \
    | grep -v '\[REJECTED\]' \
    | grep -v '\[FAILED\]' \
    | grep -v '\[JOB\]' \
    | sed 's/^[0-9]*:\([0-9]*\)\. /\1|/'
)

echo "$SPEC_HASH" > "$BUNDLE_CACHE"
echo ""
echo -e "${GREEN}Bundles prepared:${NC} $bundle_count item(s)"
exit 0
