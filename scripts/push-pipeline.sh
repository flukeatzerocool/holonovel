#!/usr/bin/env zsh
# push-pipeline.sh — assemble spec, sync servers, push.
#
# Tier 1 enrichment (vendor content + ruleset-native) is populated during
# the build step by the AI maintainer. This script handles the mechanical
# parts: spec assembly, copy to server dirs, typecheck, version sync, push.
#
# For enrichment manifest population, run this before the script:
#   opencode run --agent build "Update enrichment manifests from vendor
#   content in holonovel/narrative_world_model/ and SRD ruleset text.
#   Populate all 7 modules, tag [vendor] or [ruleset], update spec_version.
#   Do NOT commit."
#
# Usage:
#   ./scripts/push-pipeline.sh [--dry-run] [--yes]
#   --dry-run    Assemble, check, typecheck — skip commit, push, deploy.
#   --yes (-y)   Skip confirmation prompt before push/deploy.
#   --help (-h)  Show this message.

set -euo pipefail

# ── Flag parsing ──

DRY_RUN=false
SKIP_CONFIRM=false

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=true ;;
    --yes|-y) SKIP_CONFIRM=true ;;
    --help|-h)
      echo "Usage: ./scripts/push-pipeline.sh [--dry-run] [--yes]"
      echo ""
      echo "  --dry-run   Assemble spec, copy, check, typecheck — skip commit, push, deploy."
      echo "  --yes (-y)  Skip confirmation prompt before push/deploy."
      echo "  --help (-h) Show this message."
      echo ""
      echo "Before running, populate enrichment manifests:"
      echo "  opencode run --agent build \"Update enrichment manifests ...\""
      exit 0
      ;;
    *)
      echo "Unknown flag: $arg"
      echo "Usage: ./scripts/push-pipeline.sh [--dry-run] [--yes]"
      exit 1
      ;;
  esac
done

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'
SERVERS=("dnd5e-holonovel" "holonovel")

# ── Preflight: clean working tree ──

if ! git diff --exit-code --quiet 2>/dev/null; then
  echo -e "${RED}Working tree has unstaged changes. Commit or stash before running.${NC}"
  git status --short
  exit 1
fi

if ! git diff --cached --exit-code --quiet 2>/dev/null; then
  echo -e "${RED}Working tree has staged changes. Commit or unstage before running.${NC}"
  git status --short
  exit 1
fi

# ── 1. Assemble spec ──

echo -e "${GREEN}=== 1. Assemble spec ===${NC}"
npm run assemble

# ── 2. Run spec checks ──

echo -e "${GREEN}=== 2. Run spec checks ===${NC}"
npm run check

# ── 3. Copy spec to server directories ──

echo -e "${GREEN}=== 3. Copy spec to server directories ===${NC}"
npx tsx scripts/spec-propagate.ts

# ── 4. Update stored spec hashes in DECISIONS.md ──

echo -e "${GREEN}=== 4. Update stored spec hashes in DECISIONS.md ===${NC}"
SPEC_HASH=$(node -e "const {createHash}=require('crypto');const {readFileSync}=require('fs');process.stdout.write(createHash('sha256').update(readFileSync('holonovel.md')).digest('hex'))")
for server in "${SERVERS[@]}"; do
  if grep -q '\*\*Spec hash:\*\*' "$server/DECISIONS.md" 2>/dev/null; then
    perl -i -pe 'BEGIN{$done=0} if(!$done && s/\*\*Spec hash:\*\*\s*[a-f0-9]+/\*\*Spec hash:\*\* '"$SPEC_HASH"'/){$done=1}' "$server/DECISIONS.md"
    echo "  Updated spec hash in $server/DECISIONS.md → $SPEC_HASH"
  else
    echo -e "${YELLOW}  WARNING: $server/DECISIONS.md missing '**Spec hash:**' line${NC}"
  fi
done

# ── 5. Typecheck both servers ──

echo -e "${GREEN}=== 5. Typecheck both servers ===${NC}"
for server in "${SERVERS[@]}"; do
  (cd "$server" && npm run typecheck) || { echo -e "${RED}$server typecheck FAILED${NC}"; exit 1; }
done

# ── 6. Version sync check ──

echo -e "${GREEN}=== 6. Version sync check ===${NC}"
npx tsx scripts/version-check.ts

# ── 7. Confirm spec-delta sync for both servers ──

echo -e "${GREEN}=== 7. Confirm spec-delta sync ===${NC}"
for server in "${SERVERS[@]}"; do
  npx tsx scripts/spec-delta.ts -- --server "$server"
done

# ── Dry-run exit ──

if $DRY_RUN; then
  echo -e "${YELLOW}[DRY RUN] All checks passed. Would commit and push.${NC}"
  exit 0
fi

# ── Confirmation prompt ──

if ! $SKIP_CONFIRM; then
  echo ""
  read "confirm?Commit, push, and deploy? (y/N) "
  if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 0
  fi
fi

# ── 8. Stage and commit ──

echo -e "${GREEN}=== 8. Stage and commit ===${NC}"
git add holonovel.md spec/
for f in CHANGELOG.md README.md; do
  [[ -f "$f" ]] && git add "$f"
done
# Stage only tracked modifications in server/script dirs (never untracked files)
git add -u scripts/ dnd5e-holonovel/ holonovel/

if git diff --staged --quiet 2>/dev/null; then
  echo -e "${YELLOW}Nothing to commit.${NC}"
  exit 0
fi

COMMIT_DATE=$(date +%Y-%m-%d)
if git diff --staged --name-only | grep -q '^holonovel.md$'; then
  git commit -m "Push pipeline $COMMIT_DATE

  Spec assembled, checked, copied to both servers.
  Both servers typechecked, spec-delta confirms sync.
  Stored spec hashes updated in DECISIONS.md."
else
  git commit -m "Push pipeline $COMMIT_DATE

  Servers typechecked, spec-delta confirms sync.
  No spec changes."
fi

# ── 9. Push main ──

echo -e "${GREEN}=== 9. Push main ===${NC}"
git push origin main || { echo -e "${RED}Push FAILED — aborting deploy.${NC}"; exit 1; }

# ── 10. Push wiki ──

echo -e "${GREEN}=== 10. Push wiki ===${NC}"
WIKI_DIR=".holonovel-state/wiki"
if [[ -d "$WIKI_DIR/.git" ]]; then
  git -C "$WIKI_DIR" add -A
  if git -C "$WIKI_DIR" diff --staged --quiet; then
    echo -e "${YELLOW}  No wiki changes.${NC}"
  else
    git -C "$WIKI_DIR" commit -m "Wiki refresh $(date +%Y-%m-%d)"
    git -C "$WIKI_DIR" push origin main
  fi
else
  echo -e "${YELLOW}  Wiki directory not found, skipping.${NC}"
fi

# ── 11. Deploy to MCP target ──

echo -e "${GREEN}=== 11. Deploy to MCP target ===${NC}"
DEPLOY_DIR="$HOME/Holonovel-deployed"
if [[ -d "$DEPLOY_DIR/.git" ]]; then
  DEPLOY_PREV=$(git -C "$DEPLOY_DIR" rev-parse HEAD 2>/dev/null || true)
  git -C "$DEPLOY_DIR" pull --ff-only origin main || echo -e "${YELLOW}  Deploy pull skipped (non-ff or conflict).${NC}"
  DEPLOY_NEW=$(git -C "$DEPLOY_DIR" rev-parse HEAD 2>/dev/null || true)
  if [[ "$DEPLOY_PREV" != "$DEPLOY_NEW" ]]; then
    echo "  Deployed copy updated ($DEPLOY_PREV → $DEPLOY_NEW)"
    for server in "${SERVERS[@]}"; do
      if [[ -d "$DEPLOY_DIR/$server" ]]; then
        (cd "$DEPLOY_DIR/$server" && npm install --quiet && npm run build --if-present)
        echo "    $server: deps and build updated"
      fi
    done
  else
    echo "  Deployed copy already at latest."
  fi
else
  echo -e "${YELLOW}  Deploy directory not found at $DEPLOY_DIR, skipping.${NC}"
fi

echo -e "${GREEN}Done.${NC}"
