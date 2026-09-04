#!/usr/bin/env bash
# push-pipeline.sh — assemble spec, sync server, push.
#
# This script handles the mechanical parts: build-order (spec assembly + checks
# + propagation + typecheck + version sync) then hash update, fingerprint,
# commit, and push.
#
# NOTE: step 5 syncs only the "**Spec hash:**" line in DECISIONS.md. The
# human-readable "### Holonovel Spec Update — <date>" narrative entry (delta
# class, changed surfaces, verification) must be added manually before a
# spec-changing push — see Appendix V.4. Step 5b warns when it is missing.
#
# NOTE: the origin push (step 7) runs whenever local main has unpushed commits,
# not only when this run created one. A clean working tree can still be ahead
# of origin after a prior session committed directly; skipping the push leaves
# the deploy target stale and fails REQ-418.
#
# Usage:
#   ./scripts/push-pipeline.sh [--dry-run] [--yes] [--allow-pending] [--no-push]
#   --dry-run    Full pipeline including file writes — skip git commit, push, deploy.
#   --yes (-y)   Skip confirmation prompt before push/deploy.
#   --allow-pending  Override the pending-update block (REQ-394) — operator escape hatch.
#   --no-push    Commit locally, then stop — skip tag, push, mirror, wiki, deploy.
#   --help (-h)  Show this message.

set -euo pipefail

# ── Flag parsing ──

DRY_RUN=false
SKIP_CONFIRM=false
ALLOW_PENDING=false
NO_PUSH=false

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=true ;;
    --yes|-y) SKIP_CONFIRM=true ;;
    --allow-pending) ALLOW_PENDING=true ;;
    --no-push) NO_PUSH=true ;;
    --help|-h)
      echo "Usage: ./scripts/push-pipeline.sh [--dry-run] [--yes] [--allow-pending] [--no-push]"
      echo ""
      echo "  --dry-run        Full pipeline including file writes — skip git commit, push, deploy."
      echo "  --yes (-y)       Skip confirmation prompt before push/deploy."
      echo "  --allow-pending  Override the pending-update block (REQ-394)."
      echo "  --no-push        Commit locally, then stop — skip tag, push, mirror, wiki, deploy."
      echo "  --help (-h)      Show this message."
      exit 0
      ;;
    *)
      echo "Unknown flag: $arg"
      echo "Usage: ./scripts/push-pipeline.sh [--dry-run] [--yes] [--allow-pending]"
      exit 1
      ;;
  esac
done

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'
# Canonical server list — single source of truth in scripts/lib/servers.json
SERVERS=($(node -e "process.stdout.write(require('./scripts/lib/servers.json').join(' '))"))

# Snapshot the gitignored state files the pipeline may mutate, so --dry-run
# can restore them (tracked files are reverted via `git checkout -- .`).
# refresh-properties also rewrites wiki pages in the separate wiki repo
# (.holonovel-state/wiki/.git, pushed by step 8) — snapshot those .md pages too
# so a --dry-run restores the wiki working tree to its pre-run bytes.
STATE_SNAPSHOT="$(mktemp -d)"
snapshot_state() {
  for f in .holonovel-state/pipeline-fingerprints.json .holonovel-state/build-order-fingerprint.json holonovel/.holonovel-state/build-order-fingerprint.json; do
    if [[ -f "$f" ]]; then cp "$f" "$STATE_SNAPSHOT/$(basename "$f")"; fi
  done
  if [[ -d ".holonovel-state/wiki" ]]; then
    for f in .holonovel-state/wiki/*.md; do
      [[ -f "$f" ]] && cp "$f" "$STATE_SNAPSHOT/wiki-$(basename "$f")"
    done
  fi
}
restore_state() {
  git checkout -- . 2>/dev/null || true
  for f in .holonovel-state/pipeline-fingerprints.json .holonovel-state/build-order-fingerprint.json holonovel/.holonovel-state/build-order-fingerprint.json; do
    local b="$(basename "$f")"
    if [[ -f "$STATE_SNAPSHOT/$b" ]]; then cp "$STATE_SNAPSHOT/$b" "$f"; fi
  done
  if [[ -d ".holonovel-state/wiki" ]]; then
    for f in .holonovel-state/wiki/*.md; do
      local b="wiki-$(basename "$f")"
      if [[ -f "$STATE_SNAPSHOT/$b" ]]; then cp "$STATE_SNAPSHOT/$b" "$f"; fi
    done
  fi
  rm -rf "$STATE_SNAPSHOT"
}

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

if $DRY_RUN; then snapshot_state; fi

# ── 1. Build order (assemble, check, propagate, wisdom, typecheck, version) ──

echo -e "${GREEN}=== 1. Build order (assemble → check → propagate → typecheck → version) ===${NC}"
npm run build-order || { echo -e "${RED}Build order FAILED${NC}"; exit 1; }

# ── 1b. Server harness suite (a red harness blocks the push) ──

echo -e "${GREEN}=== 1b. Server harness suite (test:all) ===${NC}"
(cd holonovel && npm run test:all) || { echo -e "${RED}Server harness suite FAILED${NC}"; exit 1; }

# ── 2. Cross-property coupling ──

echo -e "${GREEN}=== 2. Refresh README and wiki from spec ===${NC}"
npm run refresh-properties

# ── 3. Spec-delta report (serial — capture classification) ──

echo -e "${GREEN}=== 3. Spec-delta report ===${NC}"
SPEC_HASH=$(node -e "const {createHash}=require('crypto');const {readFileSync}=require('fs');process.stdout.write(createHash('sha256').update(readFileSync('holonovel.md')).digest('hex'))")

# ── 4. Fingerprint and scoped spec-driven update (pending-update gate) ──

echo -e "${GREEN}=== 4. Fingerprint and scoped spec-driven update ===${NC}"
for server in "${SERVERS[@]}"; do
  DELTA_CLASS=$(npx tsx scripts/spec-delta.ts --server "$server" --report-only 2>/dev/null | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const i=s.indexOf('{');try{const c=JSON.parse(s.slice(i)).classification;console.log(c==='none'?'patch':c)}catch{console.log('major')}})")
  echo "  $server: delta class = $DELTA_CLASS"
  npx tsx scripts/fingerprint.ts --server "$server" > /dev/null
  EXTRA_ARGS=("--delta-class" "$DELTA_CLASS")
  if $ALLOW_PENDING; then EXTRA_ARGS+=(--allow-pending); fi
  if ! npx tsx scripts/update-server.ts --server "$server" \
       --spec-hash "$SPEC_HASH" \
       --scope-by-fingerprint "${EXTRA_ARGS[@]}"; then
    echo -e "${RED}Pending update for $server — implementation has not been updated to match the spec.${NC}"
    echo -e "${YELLOW}Run the printed 'opencode run' command, then re-run this pipeline.${NC}"
    echo -e "${YELLOW}To override (operator escape hatch per REQ-394), re-run with --allow-pending.${NC}"
    exit 1
  fi
done

# ── 5. Update stored spec hashes in DECISIONS.md ──

echo -e "${GREEN}=== 5. Update stored spec hashes in DECISIONS.md ===${NC}"
for server in "${SERVERS[@]}"; do
  if grep -q '\*\*Spec hash:\*\*' "$server/DECISIONS.md" 2>/dev/null; then
    OLD_HASH=$(grep -oP '\*\*Spec hash:\*\*\s*\K[a-f0-9]+' "$server/DECISIONS.md" | head -1)
    perl -i -pe 'BEGIN{$done=0} if(!$done && s/\*\*Spec hash:\*\*\s*[a-f0-9]+/\*\*Spec hash:\*\* '"$SPEC_HASH"'/){$done=1}' "$server/DECISIONS.md"
    echo "  Updated spec hash in $server/DECISIONS.md → $SPEC_HASH"
    # ── 5b. Traceability guard: warn if the spec hash changed but no dated
    #         Spec Update entry exists for today. (REQ-394 enforces the hard
    #         block; this closes the narrative-record gap.)
    if [[ -n "$OLD_HASH" && "$OLD_HASH" != "$SPEC_HASH" ]]; then
      STAMP=$(date +%Y-%m-%d)
      if ! grep -q "### Holonovel Spec Update — $STAMP" "$server/DECISIONS.md" 2>/dev/null; then
        echo -e "${YELLOW}  WARNING: spec hash changed but no '### Holonovel Spec Update — $STAMP'${NC}"
        echo -e "${YELLOW}           entry in $server/DECISIONS.md. Add the narrative entry (delta${NC}"
        echo -e "${YELLOW}           class, changed surfaces, verification) per Appendix V.4.${NC}"
      fi
    fi
  else
    echo -e "${YELLOW}  WARNING: $server/DECISIONS.md missing '**Spec hash:**' line${NC}"
  fi
done

# ── Dry-run exit ──

if $DRY_RUN; then
  echo -e "${YELLOW}[DRY RUN] All checks passed. Would commit and push.${NC}"
  echo -e "${YELLOW}[DRY RUN] Restoring working tree state.${NC}"
  restore_state
  exit 0
fi

# ── Confirmation prompt ──

if ! $SKIP_CONFIRM; then
  echo ""
  read -r -p "Commit, push, and deploy? (y/N) " confirm
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
# Stage server/script dirs and CI config (gitignore already excludes node_modules/
# and .holonovel-state/). "holonovel/" is the server directory, not holonovel.md
# (already staged above).
git add scripts/ holonovel/ .github/

HAS_COMMIT=true
TAG_TO_PUSH=""
if git diff --staged --quiet 2>/dev/null; then
  echo -e "${YELLOW}Nothing new to commit.${NC}"
  HAS_COMMIT=false
fi

if $HAS_COMMIT; then
  COMMIT_DATE=$(date +%Y-%m-%d)
  git commit -m "Push pipeline $COMMIT_DATE

  Build-order: spec assembled, checked, propagated to server, server
  typechecked, versions synced. Spec-delta confirms sync. Stored spec hashes
  updated in DECISIONS.md."
fi

# ── 6b. Early exit on --no-push: local work is done; leave the commit unpushed. ──

if $NO_PUSH; then
  echo -e "${YELLOW}[NO PUSH] Committed locally. Skipping tag, push, mirror, wiki, and deploy.${NC}"
  exit 0
fi

# ── 6a/7. Tag + push origin — run whenever local main has unpushed commits,
#          not only when this run created one. A clean working tree can still
#          be ahead of origin after a prior session committed directly, and
#          skipping the origin push leaves the deploy target stale (REQ-418). ──

git fetch origin main --quiet 2>/dev/null || true
PENDING_PUSH=0
if git rev-parse --verify --quiet origin/main >/dev/null 2>&1; then
  PENDING_PUSH=$(git rev-list --count origin/main..main 2>/dev/null || echo 0)
else
  PENDING_PUSH=1
fi

if [[ "$PENDING_PUSH" -gt 0 ]]; then
  # ── 6a. Tag (only when the version is new) ──

  echo -e "${GREEN}=== 6a. Tag ===${NC}"
  VERSION=$(node -e "console.log(require('./package.json').version)")
  TAG="v$VERSION"
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
else
  echo -e "${YELLOW}Nothing to push — origin is up to date.${NC}"
fi

# ── 7b. Mirror sync (origin → github) ──

echo -e "${GREEN}=== 7b. Mirror sync (github) ===${NC}"
if git config --get remote.github.url >/dev/null 2>&1; then
  git push github main || echo -e "${YELLOW}  Mirror push (main) FAILED — GitHub mirror is behind origin.${NC}"
  if [[ -n "$TAG_TO_PUSH" ]]; then
    git push github "$TAG_TO_PUSH" || echo -e "${YELLOW}  Mirror tag push FAILED.${NC}"
  fi
  echo -e "${GREEN}  Mirror sync: DONE${NC}"
else
  echo -e "${YELLOW}  No 'github' remote configured — skipping mirror sync.${NC}"
fi

# ── 7c. npm + MCP Registry publish (delegated to mirror CI via OIDC) ──

echo -e "${GREEN}=== 7c. npm + MCP Registry publish (mirror CI) ===${NC}"
echo -e "${YELLOW}  Publishing is handled by the GitHub mirror's workflow${NC}"
echo -e "${YELLOW}  (.github/workflows/publish.yml) via npm Trusted Publishing (OIDC).${NC}"
echo -e "${YELLOW}  The local pipeline only mirrors to GitHub; the mirror CI publishes.${NC}"

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
  # Deploy clone is a git-pull-only mirror: discard any uncommitted working-tree
  # edits before the pull, matching the AGENTS.md Two-Repo Workflow contract
  # ("discards any uncommitted working tree edits"). Recurrence 2026-08-30: a
  # stale HOST_VERSION edit blocked the fast-forward. dist/, node_modules/, and
  # .holonovel-state/ are gitignored, so runtime data and ruleset packages
  # (REQ-396/REQ-395a) survive the clean.
  if [[ -n "$(git -C "$DEPLOY_DIR" status --porcelain)" ]]; then
    echo -e "${YELLOW}  Deploy tree has uncommitted changes — discarding before pull.${NC}"
    git -C "$DEPLOY_DIR" checkout -- .
    git -C "$DEPLOY_DIR" clean -fd
  fi
  DEPLOY_PREV=$(git -C "$DEPLOY_DIR" rev-parse HEAD 2>/dev/null || true)
  if ! git -C "$DEPLOY_DIR" pull --ff-only origin main; then
    echo -e "${RED}Deploy FAILED — pull could not fast-forward (non-ff or conflict).${NC}"
    echo -e "${RED}REQ-418: deployment is not complete; leaving deployed copy at $DEPLOY_PREV.${NC}"
    exit 1
  fi
  DEPLOY_NEW=$(git -C "$DEPLOY_DIR" rev-parse HEAD 2>/dev/null || true)
  if [[ "$DEPLOY_PREV" != "$DEPLOY_NEW" ]]; then
    echo "  Deployed copy updated ($DEPLOY_PREV → $DEPLOY_NEW)"
    for server in "${SERVERS[@]}"; do
      if [[ -d "$DEPLOY_DIR/$server" ]]; then
        # npm ci installs strictly from package-lock.json and never rewrites it.
        # A bare `npm install` under a different npm rewrites the lockfile,
        # invalidating the REQ-313 lockfile fingerprint and failing REQ-418
        # verification (recurrence: 2026-08-24). Guard: revert any lockfile
        # drift the toolchain still produces before the build.
        (cd "$DEPLOY_DIR/$server" && npm ci --quiet --no-audit --no-fund && npm run build --if-present)
        if [[ -n "$(git -C "$DEPLOY_DIR/$server" status --porcelain -- package-lock.json)" ]]; then
          echo -e "${RED}    $server: package-lock.json drifted during install — reverting.${NC}"
          git -C "$DEPLOY_DIR/$server" checkout -- package-lock.json
        fi
        echo "    $server: deps and build updated"
      fi
    done
  else
    echo "  Deployed copy already at latest."
  fi
else
  echo -e "${YELLOW}  Deploy directory not found at $DEPLOY_DIR, skipping.${NC}"
fi

# ── 9b. Verify the deployed tree (REQ-418) ──

echo -e "${GREEN}=== 9b. Verify deployed tree (REQ-418) ===${NC}"
if [[ -d "$DEPLOY_DIR/.git" ]]; then
  for server in "${SERVERS[@]}"; do
    if ! npx tsx scripts/update-server.ts --server "$server" --server-dir "$DEPLOY_DIR/$server" --spec-hash "$SPEC_HASH" --verify-deployed; then
      echo -e "${RED}Deploy verification FAILED for $server — deployed tree does not match the published spec.${NC}"
      exit 1
    fi
  done
else
  echo -e "${YELLOW}  Deploy directory not found; skipping verification.${NC}"
fi

echo -e "${GREEN}Done.${NC}"
