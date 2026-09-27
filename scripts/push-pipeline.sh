#!/usr/bin/env bash
# push-pipeline.sh — assemble spec, sync server, push. [entry point]
#
# Role: shell entry point implementing the publication contracts §6.7 /
# REQ-394 (pending-update gate) and REQ-418 (deployment verification).
# Purpose: run the mechanical parts — build-order (spec assembly + checks +
# propagation + typecheck + version sync), hash update, fingerprint, commit,
# and push.
# Exit codes: 0 = pipeline completed (or dry-run/--no-push stopped cleanly);
# 1 = any build, gate, push, or deploy failure.
#
# NOTE: step 5 syncs only the "**Spec hash:**" line in DECISIONS.md. The
# human-readable "### Holonovel Spec Update — <date>" narrative entry (delta
# class, changed surfaces, verification) must be added manually before a
# spec-changing push — see Appendix V.4. Step 5b warns when it is missing.
#
# NOTE: step 2b fetches origin before the delta classification (step 3) so the
# comparison base is current; step 4b prints the conformance-evidence report
# (report-only) to surface the false-C risk pool.
#
# NOTE: the origin push (step 7) runs whenever local main has unpushed commits,
# not only when this run created one. A clean working tree can still be ahead
# of origin after a prior session committed directly; skipping the push leaves
# the deploy target stale and fails REQ-418.
#
# NOTE: step 8 (wiki) is non-fatal — a wiki push failure warns and the run
# continues to the step 9 deploy. Deploy (REQ-418) is the hard gate; an
# auxiliary documentation push must not block it.
#
# Usage:
#   ./scripts/push-pipeline.sh [--dry-run] [--yes] [--allow-pending] [--no-push] [--auto-update]
#   --dry-run    Full pipeline including file writes — skip git commit, push, deploy.
#   --yes (-y)   Skip confirmation prompt before push/deploy.
#   --allow-pending  Override the pending-update block (REQ-394) — operator escape hatch.
#   --no-push    Commit locally, then stop — skip tag, push, mirror, wiki, deploy.
#   --auto-update  Run outside a session: execute the §6.7 update command
#                  (HOLONOVEL_INVOKE_UPDATE=1) instead of only printing it.
#   --help (-h)  Show this message.

set -euo pipefail

# ── Usage ──

usage() {
  cat <<'EOF'
Usage: ./scripts/push-pipeline.sh [--dry-run] [--yes] [--allow-pending] [--no-push] [--auto-update]

  --dry-run        Full pipeline including file writes — skip git commit, push, deploy.
  --yes (-y)       Skip confirmation prompt before push/deploy.
  --allow-pending  Override the pending-update block (REQ-394).
  --no-push        Commit locally, then stop — skip tag, push, mirror, wiki, deploy.
  --auto-update    Execute the §6.7 update command (HOLONOVEL_INVOKE_UPDATE=1).
  --help (-h)      Show this message.
EOF
}

# ── Flag parsing ──

DRY_RUN=false
SKIP_CONFIRM=false
ALLOW_PENDING=false
NO_PUSH=false
AUTO_UPDATE=false

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=true ;;
    --yes|-y) SKIP_CONFIRM=true ;;
    --allow-pending) ALLOW_PENDING=true ;;
    --no-push) NO_PUSH=true ;;
    --auto-update) AUTO_UPDATE=true ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      echo "Unknown flag: $arg" >&2
      usage >&2
      exit 1
      ;;
  esac
done

# Colors only on a TTY, so piped/redirected output stays clean.
if [[ -t 1 ]]; then
  GREEN='\033[0;32m'
  YELLOW='\033[1;33m'
  RED='\033[0;31m'
  NC='\033[0m'
else
  GREEN=''
  YELLOW=''
  RED=''
  NC=''
fi
# Canonical server list — single source of truth in scripts/lib/servers.json
read -r -a SERVERS <<< "$(node -e "process.stdout.write(require('./scripts/lib/servers.json').join(' '))")"

# Snapshot the gitignored state files the pipeline may mutate, so --dry-run
# can restore them (tracked files are reverted via `git checkout -- .`).
# refresh-properties also rewrites wiki pages in the separate wiki repo
# (.holonovel-state/wiki/.git, pushed by step 8) — snapshot those .md pages too
# so a --dry-run restores the wiki working tree to its pre-run bytes.
STATE_SNAPSHOT=""
BEFORE_UNTRACKED=""
snapshot_state() {
  STATE_SNAPSHOT="$(mktemp -d)"
  BEFORE_UNTRACKED="$STATE_SNAPSHOT/untracked-before"
  git ls-files --others --exclude-standard > "$BEFORE_UNTRACKED" 2>/dev/null || true
  for f in .holonovel-state/pipeline-fingerprints.json .holonovel-state/build-order-fingerprint.json holonovel/.holonovel-state/build-order-fingerprint.json; do
    if [[ -f "$f" ]]; then cp "$f" "$STATE_SNAPSHOT/$(basename "$f")"; fi
  done
  if [[ -d ".holonovel-state/wiki" ]]; then
    for f in .holonovel-state/wiki/*.md; do
      [[ -f "$f" ]] && cp "$f" "$STATE_SNAPSHOT/wiki-$(basename "$f")"
    done
  fi
}
# Restore tracked files and remove untracked files the run created (those not
# present before the snapshot), then restore the gitignored state files.
restore_worktree() {
  git checkout -- . 2>/dev/null || true
  if [[ -n "$BEFORE_UNTRACKED" && -f "$BEFORE_UNTRACKED" ]]; then
    local after="$STATE_SNAPSHOT/untracked-after"
    git ls-files --others --exclude-standard > "$after" 2>/dev/null || true
    while IFS= read -r p; do
      [[ -n "$p" ]] && rm -rf -- "$p"
    done < <(comm -13 <(sort "$BEFORE_UNTRACKED") <(sort "$after"))
  fi
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
}
# EXIT trap: always remove the temp dir; on --dry-run also restore the tree,
# so a mid-run failure cannot leave a dirty working tree blocking the next run.
cleanup() {
  if $DRY_RUN && [[ -n "$STATE_SNAPSHOT" ]]; then restore_worktree; fi
  if [[ -n "$STATE_SNAPSHOT" ]]; then rm -rf "$STATE_SNAPSHOT"; fi
}
trap cleanup EXIT
trap 'exit 1' INT TERM

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

# ── 2b. Fetch origin so the delta base is current (REQ-418) ──
# The delta classification and the pending-push count both compare against
# origin/main; fetch before either so a stale remote-tracking ref cannot
# misclassify the delta (or hide commits).

echo -e "${GREEN}=== 2b. Fetch origin (delta base) ===${NC}"
if ! git fetch origin main --quiet 2>/dev/null; then
  echo -e "${YELLOW}  origin fetch failed — delta base may be stale (network/remote issue).${NC}"
fi
DELTA_BASE="origin/main"
if git rev-parse --verify --quiet "$DELTA_BASE" >/dev/null 2>&1; then
  echo "  delta base: $DELTA_BASE ($(git rev-parse --short "$DELTA_BASE"))"
else
  DELTA_BASE="HEAD"
  echo -e "${YELLOW}  origin/main unavailable — using HEAD as the delta base${NC}"
fi

# ── 3. Spec hash + delta report (classification printed before the gate) ──

# Classify one server's delta. Fails loud: a broken spec-delta or an
# unparseable payload must not silently masquerade as a 'major' delta and
# under-scope the update.
classify_delta() {
  local server="$1" out
  if ! out=$(npx tsx scripts/spec-delta.ts --server "$server" --base "$DELTA_BASE" --report-only 2>&1); then
    echo -e "${RED}  spec-delta failed for $server:${NC}" >&2
    echo "$out" >&2
    return 1
  fi
  node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const i=s.indexOf('{');try{const c=JSON.parse(s.slice(i)).classification;console.log(c==='none'?'patch':c)}catch{process.exit(1)}})" <<<"$out"
}

echo -e "${GREEN}=== 3. Spec hash + delta report ===${NC}"
SPEC_HASH=$(node -e "const {createHash}=require('crypto');const {readFileSync}=require('fs');process.stdout.write(createHash('sha256').update(readFileSync('holonovel.md')).digest('hex'))")
declare -A DELTA_CLASS_OF
for server in "${SERVERS[@]}"; do
  if ! DELTA_CLASS=$(classify_delta "$server"); then
    echo -e "${RED}Delta classification failed for $server — aborting.${NC}"
    exit 1
  fi
  DELTA_CLASS_OF[$server]="$DELTA_CLASS"
  echo "  $server: delta class = $DELTA_CLASS"
done

# ── 4. Fingerprint and scoped spec-driven update (pending-update gate) ──

echo -e "${GREEN}=== 4. Fingerprint and scoped spec-driven update ===${NC}"
if $AUTO_UPDATE; then
  export HOLONOVEL_INVOKE_UPDATE=1
  echo -e "${YELLOW}--auto-update: the §6.7 update command will be executed (requires opencode on PATH).${NC}"
fi
for server in "${SERVERS[@]}"; do
  DELTA_CLASS="${DELTA_CLASS_OF[$server]}"
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

# ── 4b. Conformance evidence report (informational) ──
# Surfaces bucket-C REQs whose exercised evidence is entirely shared with other
# REQs — the false-C risk pool (REQ-321d class). Report-only: the detector has a
# high false-positive rate on the current corpus, so it does not block.

echo -e "${GREEN}=== 4b. Conformance evidence report (informational) ===${NC}"
if ! npx tsx scripts/compare-spec-code.ts --dedicated; then
  echo -e "${YELLOW}  Conformance report exited non-zero — treat the pool as incomplete, not clean.${NC}"
fi

# ── 5. Update stored spec hashes in DECISIONS.md ──

echo -e "${GREEN}=== 5. Update stored spec hashes in DECISIONS.md ===${NC}"
# Generate the dated Spec Update record before syncing the hash, so the
# narrative entry (delta class, changed surfaces) is present per Appendix V.4.
npx tsx scripts/spec-update-record.ts || { echo -e "${RED}Spec Update record generation FAILED${NC}"; exit 1; }
for server in "${SERVERS[@]}"; do
  if grep -q '\*\*Spec hash:\*\*' "$server/DECISIONS.md" 2>/dev/null; then
    perl -i -pe 'BEGIN{$done=0} if(!$done && s/\*\*Spec hash:\*\*\s*[a-f0-9]+/\*\*Spec hash:\*\* '"$SPEC_HASH"'/){$done=1}' "$server/DECISIONS.md"
    echo "  Updated spec hash in $server/DECISIONS.md → $SPEC_HASH"
  else
    echo -e "${YELLOW}  WARNING: $server/DECISIONS.md missing '**Spec hash:**' line${NC}"
  fi
done
# ── 5b. Narrative-record gate: an unpublished spec delta must carry a dated
#         Spec Update entry. The generator above writes one; this is the
#         backstop for a hand-edited hash line. (REQ-394 is the hard block.)
if ! npx tsx scripts/spec-update-record.ts --check; then
  echo -e "${RED}  Spec Update narrative missing for an unpublished delta — publication blocked.${NC}"
  echo -e "${YELLOW}  Add the entry per Appendix V.4, or run the generator: npm run spec-update-record${NC}"
  exit 1
fi

# ── Dry-run exit ──

if $DRY_RUN; then
  echo -e "${YELLOW}[DRY RUN] All checks passed. Would commit and push.${NC}"
  echo -e "${YELLOW}[DRY RUN] Restoring working tree state.${NC}"
  exit 0
fi

# ── Confirmation prompt ──

if ! $SKIP_CONFIRM; then
  if [[ ! -t 0 ]]; then
    echo -e "${RED}Non-interactive stdin and no --yes — refusing to guess. Re-run with --yes.${NC}" >&2
    exit 1
  fi
  echo ""
  read -r -p "Commit, push, and deploy? (y/N) " confirm
  if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 0
  fi
fi

# ── Outcome tracking (for the end-of-run summary) ──

DID_COMMIT=false
DID_TAG=false
DID_PUSH=false
DID_MIRROR=false
DID_WIKI=false
DID_DEPLOY=false

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
  DID_COMMIT=true
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
    DID_TAG=true
  fi

  # ── 7. Push main ──

  echo -e "${GREEN}=== 7. Push main ===${NC}"
  git push origin main || { echo -e "${RED}Push FAILED — aborting deploy.${NC}"; exit 1; }
  DID_PUSH=true
  if [[ -n "$TAG_TO_PUSH" ]]; then
    git push origin "$TAG_TO_PUSH" || { echo -e "${RED}Tag push FAILED — aborting deploy.${NC}"; exit 1; }
  fi
else
  echo -e "${YELLOW}Nothing to push — origin is up to date.${NC}"
fi

# ── 7b. Mirror sync (origin → github) ──

echo -e "${GREEN}=== 7b. Mirror sync (github) ===${NC}"
if git config --get remote.github.url >/dev/null 2>&1; then
  if git push github main; then DID_MIRROR=true; else echo -e "${YELLOW}  Mirror push (main) FAILED — GitHub mirror is behind origin.${NC}"; fi
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
    if git -C "$WIKI_DIR" push origin main; then
      DID_WIKI=true
    else
      echo -e "${YELLOW}  Wiki push FAILED — non-fatal; continuing to deploy.${NC}"
    fi
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
  DID_DEPLOY=true
else
  echo -e "${YELLOW}  Deploy directory not found; skipping verification.${NC}"
fi

# ── Summary ──

summary_flag() { if $1; then echo "yes"; else echo "no"; fi; }
echo -e "${GREEN}Done.${NC} commit=$(summary_flag $DID_COMMIT) tag=$(summary_flag $DID_TAG) push=$(summary_flag $DID_PUSH) mirror=$(summary_flag $DID_MIRROR) wiki=$(summary_flag $DID_WIKI) deploy=$(summary_flag $DID_DEPLOY)"
