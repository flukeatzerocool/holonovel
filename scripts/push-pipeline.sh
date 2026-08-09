#!/usr/bin/env bash
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
#   ./scripts/push-pipeline.sh

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}=== 1. Assemble spec ===${NC}"
npm run assemble

echo -e "${GREEN}=== 2. Run spec checks ===${NC}"
npm run check

echo -e "${GREEN}=== 3. Copy spec to server directories ===${NC}"
cp holonovel.md dnd5e-holonovel/holonovel.md
cp holonovel.md holonovel/holonovel.md
echo "Copied holonovel.md to dnd5e-holonovel/ and holonovel/"

echo -e "${GREEN}=== 4. Typecheck both servers ===${NC}"
(cd holonovel && npm run typecheck) || { echo -e "${RED}holonovel typecheck FAILED${NC}"; exit 1; }
(cd dnd5e-holonovel && npm run typecheck) || { echo -e "${RED}dnd5e typecheck FAILED${NC}"; exit 1; }

echo -e "${GREEN}=== 5. Update stored spec hashes in DECISIONS.md ===${NC}"
SPEC_HASH=$(sha256sum holonovel.md | cut -d' ' -f1)
for dir in dnd5e-holonovel holonovel; do
  if grep -q '\*\*Spec hash:\*\*' "$dir/DECISIONS.md" 2>/dev/null; then
    sed -i "s/\*\*Spec hash:\*\*\s*[a-f0-9]\+/**Spec hash:** $SPEC_HASH/" "$dir/DECISIONS.md"
    echo "Updated spec hash in $dir/DECISIONS.md → $SPEC_HASH"
  fi
done

echo -e "${GREEN}=== 6. Confirm spec-delta sync for both servers ===${NC}"
npx tsx scripts/spec-delta.ts -- --server dnd5e-holonovel
npx tsx scripts/spec-delta.ts -- --server holonovel

echo -e "${GREEN}=== 7. Stage and commit ===${NC}"
git add holonovel.md README.md CHANGELOG.md AGENTS.md spec/ scripts/ dnd5e-holonovel/ holonovel/ 2>/dev/null || true

if git diff --staged --quiet 2>/dev/null; then
  echo -e "${YELLOW}Nothing to commit.${NC}"
else
  COMMIT_DATE=$(date +%Y-%m-%d)
  git commit -m "Push pipeline $COMMIT_DATE

  Spec assembled, checked, copied to both servers.
  Both servers typechecked, spec-delta confirms sync.
  Stored spec hashes updated in DECISIONS.md."
fi

echo -e "${GREEN}=== 8. Push main ===${NC}"
git push origin main

echo -e "${GREEN}=== 9. Push wiki ===${NC}"
WIKI_DIR="$PROJECT_DIR/.holonovel-state/wiki"
if [[ -d "$WIKI_DIR/.git" ]]; then
  git -C "$WIKI_DIR" add -A 2>/dev/null || true
  if git -C "$WIKI_DIR" diff --staged --quiet 2>/dev/null; then
    echo -e "${YELLOW}No wiki changes.${NC}"
  else
    git -C "$WIKI_DIR" commit -m "Wiki refresh $(date +%Y-%m-%d)" || true
    git -C "$WIKI_DIR" push origin master
  fi
else
  echo -e "${YELLOW}Wiki directory not found, skipping.${NC}"
fi

echo -e "${GREEN}Done.${NC}"
