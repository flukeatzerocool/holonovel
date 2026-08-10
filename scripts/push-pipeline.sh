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
FORCE=false

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=true ;;
    --yes|-y) FORCE=true ;;
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

# ── 2. Copy spec to server directories ──

echo -e "${GREEN}=== 2. Copy spec to server directories ===${NC}"
npx tsx scripts/spec-propagate.ts

# ── 3. Update stored spec hashes in DECISIONS.md ──

echo -e "${GREEN}=== 3. Update stored spec hashes in DECISIONS.md ===${NC}"
SPEC_HASH=$(node -e "const {createHash}=require('crypto');const {readFileSync}=require('fs');process.stdout.write(createHash('sha256').update(readFileSync('holonovel.md')).digest('hex'))")
for dir in dnd5e-holonovel holonovel; do
  if grep -q '\*\*Spec hash:\*\*' "$dir/DECISIONS.md" 2>/dev/null; then
    perl -i -pe "s/\\*\\*Spec hash:\\*\\*\\s*[a-f0-9]+/**Spec hash:** $SPEC_HASH/" "$dir/DECISIONS.md"
    echo "  Updated spec hash in $dir/DECISIONS.md → $SPEC_HASH"
  fi
done

# ── 4. Run spec checks ──

echo -e "${GREEN}=== 4. Run spec checks ===${NC}"
npm run check

# ── 5. Typecheck both servers ──

echo -e "${GREEN}=== 5. Typecheck both servers ===${NC}"
(cd holonovel && npm run typecheck) || { echo -e "${RED}holonovel typecheck FAILED${NC}"; exit 1; }
(cd dnd5e-holonovel && npm run typecheck) || { echo -e "${RED}dnd5e-holonovel typecheck FAILED${NC}"; exit 1; }

# ── 6. Confirm spec-delta sync for both servers ──

echo -e "${GREEN}=== 6. Confirm spec-delta sync ===${NC}"
npx tsx scripts/spec-delta.ts -- --server dnd5e-holonovel
npx tsx scripts/spec-delta.ts -- --server holonovel

# ── Dry-run exit ──

if $DRY_RUN; then
  echo -e "${YELLOW}[DRY RUN] All checks passed. Would commit and push.${NC}"
  exit 0
fi

# ── Confirmation prompt ──

if ! $FORCE; then
  echo ""
  read "confirm?Commit, push, and deploy? (y/N) "
  if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 0
  fi
fi

# ── 7. Stage and commit ──

echo -e "${GREEN}=== 7. Stage and commit ===${NC}"
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
git commit -m "Push pipeline $COMMIT_DATE

  Spec assembled, checked, copied to both servers.
  Both servers typechecked, spec-delta confirms sync.
  Stored spec hashes updated in DECISIONS.md."

# ── 8. Push main ──

echo -e "${GREEN}=== 8. Push main ===${NC}"
git push origin main || { echo -e "${RED}Push FAILED — aborting deploy.${NC}"; exit 1; }

# ── 9. Push wiki ──

echo -e "${GREEN}=== 9. Push wiki ===${NC}"
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

# ── 10. Deploy to MCP target ──

echo -e "${GREEN}=== 10. Deploy to MCP target ===${NC}"
DEPLOY_DIR="$HOME/Holonovel-deployed"
if [[ -d "$DEPLOY_DIR/.git" ]]; then
  DEPLOY_PREV=$(git -C "$DEPLOY_DIR" rev-parse HEAD 2>/dev/null || true)
  git -C "$DEPLOY_DIR" pull --ff-only origin main || echo -e "${YELLOW}  Deploy pull skipped (non-ff or conflict).${NC}"
  DEPLOY_NEW=$(git -C "$DEPLOY_DIR" rev-parse HEAD 2>/dev/null || true)
  if [[ "$DEPLOY_PREV" != "$DEPLOY_NEW" ]]; then
    echo "  Deployed copy updated ($DEPLOY_PREV → $DEPLOY_NEW)"
    for server in dnd5e-holonovel holonovel; do
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
