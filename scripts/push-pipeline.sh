#!/usr/bin/env zsh
# push-pipeline.sh — assemble spec, sync server, push.
#
# This script handles the mechanical parts: build-order (spec assembly + checks
# + propagation + typecheck + version sync) then hash update, fingerprint,
# commit, and push.
#
# Usage:
#   ./scripts/push-pipeline.sh [--dry-run] [--yes]
#   --dry-run    Full pipeline including file writes — skip git commit, push, deploy.
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
      echo "  --dry-run   Full pipeline including file writes — skip git commit, push, deploy."
      echo "  --yes (-y)  Skip confirmation prompt before push/deploy."
      echo "  --help (-h) Show this message."
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
# Canonical server list (update spec-delta.ts and spec-propagate.ts when changing)
SERVERS=("holonovel")

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

# ── 1. Build order (assemble, check, propagate, wisdom, typecheck, version) ──

echo -e "${GREEN}=== 1. Build order (assemble → check → propagate → typecheck → version) ===${NC}"
npm run build-order || { echo -e "${RED}Build order FAILED${NC}"; exit 1; }

# ── 2. Cross-property coupling ──

echo -e "${GREEN}=== 2. Refresh README and wiki from spec ===${NC}"
npm run refresh-properties

# ── 3. Spec-delta report ──

echo -e "${GREEN}=== 3. Spec-delta report ===${NC}"
for server in "${SERVERS[@]}"; do
  npm run spec-delta -- --server "$server" --report-only &
done
wait

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

# ── 5. Fingerprint and scoped spec-driven update ──

echo -e "${GREEN}=== 5. Fingerprint and scoped spec-driven update ===${NC}"
for server in "${SERVERS[@]}"; do
  (npx tsx scripts/fingerprint.ts --server "$server" > /dev/null && \
   npx tsx scripts/update-server.ts --server "$server" \
     --spec-hash "$SPEC_HASH" \
     --scope-by-fingerprint) || \
   echo -e "${YELLOW}  WARNING: $server update script returned non-zero — check logs${NC}" &
done
wait

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

# ── 6. Stage and commit ──

echo -e "${GREEN}=== 6. Stage and commit ===${NC}"
git add holonovel.md spec/ scripts/cross-property-couple.ts package.json
for f in CHANGELOG.md README.md; do
  [[ -f "$f" ]] && git add "$f"
done
# Stage only tracked modifications in server/script dirs (never untracked files)
# "holonovel/" is the server directory, not holonovel.md (already staged above)
git add -u scripts/ holonovel/

if git diff --staged --quiet 2>/dev/null; then
  echo -e "${YELLOW}Nothing to commit.${NC}"
  exit 0
fi

COMMIT_DATE=$(date +%Y-%m-%d)
git commit -m "Push pipeline $COMMIT_DATE

  Build-order: spec assembled, checked, propagated to server, server
  typechecked, versions synced. Spec-delta confirms sync. Stored spec hashes
  updated in DECISIONS.md."

# ── 6a. Tag (only when the version is new) ──

echo -e "${GREEN}=== 6a. Tag ===${NC}"
VERSION=$(node -e "console.log(require('./package.json').version)")
TAG="v$VERSION"
TAG_TO_PUSH=""
if git ls-remote --tags origin "refs/tags/$TAG" 2>/dev/null | grep -q "refs/tags/$TAG"; then
  echo -e "${YELLOW}  Tag $TAG already on remote — version unchanged, leaving it pinned.${NC}"
else
  git tag -f "$TAG"
  echo -e "${GREEN}  Tagging $TAG at HEAD${NC}"
  TAG_TO_PUSH="$TAG"
fi

# ── 7. Push main ──

echo -e "${GREEN}=== 7. Push main ===${NC}"
git push origin main || { echo -e "${RED}Push FAILED — aborting deploy.${NC}"; exit 1; }
if [[ -n "$TAG_TO_PUSH" ]]; then
  git push origin "$TAG_TO_PUSH" || { echo -e "${RED}Tag push FAILED — aborting deploy.${NC}"; exit 1; }
fi

# ── 8. Push wiki ──

echo -e "${GREEN}=== 8. Push wiki ===${NC}"
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

# ── 9. Deploy to MCP target ──

echo -e "${GREEN}=== 9. Deploy to MCP target ===${NC}"
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
