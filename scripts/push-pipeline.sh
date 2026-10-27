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
# spec-changing push — see Appendix V.4. Step 5b blocks when the entry is
# missing or still carries the scaffolded verification placeholder.
#
# NOTE: step 2b fetches origin before the delta classification (step 3) so the
# comparison base is current; a failed fetch fails closed (use --no-push or
# --allow-stale-base when the network is genuinely unavailable). Step 4b runs
# the server harness suite unless the delta is patch/editorial with an
# unchanged contract fingerprint and no server path changed (§6.7
# Patch/Editorial = G0 only; --full-tests forces it).
#
# NOTE: the implementation-coverage strict audit runs inside the single check
# pass (HOLONOVEL_IMPL_STRICT=1), so there is no separate strict step. When
# build-order skipped its check pass (docs-only delta), the pipeline runs
# check:fast before publishing and exports HOLONOVEL_PIPELINE_GATES so the git
# hooks skip only the work that actually ran.
#
# NOTE: staging uses `git add -A` (the whole tracked surface) so root-level
# tracked files (AGENTS.md, .githooks/, ROADMAP.md, configs) cannot be silently
# left out. The parent repo un-ignores three wiki mirror pages owned by the
# separate wiki repo; they are reset out of the index after staging.
#
# NOTE: the origin push (step 7) runs whenever local main has unpushed commits,
# not only when this run created one. A clean working tree can still be ahead
# of origin after a prior session committed directly; skipping the push leaves
# the deploy target stale and fails REQ-418. main and the tag are pushed
# together (one ref list) so the pre-push hook runs once per remote.
#
# NOTE: step 7d starts the registry publication poll (REQ-428) in the background
# and step 9c collects it, so the bounded wait overlaps the wiki push and deploy
# rather than blocking the tail.
#
# NOTE: step 8 (wiki) is non-fatal — a wiki push failure warns and the run
# continues to the step 9 deploy. Deploy (REQ-418) is the hard gate; an
# auxiliary documentation push must not block it. Step 8 also mirrors the wiki
# to GitHub (remote `github`, local `main` -> GitHub default `master`) with a
# force-push, so the GitHub wiki stays byte-identical to git.gay. The wiki repo
# lives at .holonovel-state/wiki (a separate clone); add the `github` remote
# there once, and initialize the GitHub wiki (first page in the web UI) before
# the mirror push can succeed.
#
# Usage:
#   ./scripts/push-pipeline.sh [--dry-run] [--yes] [--allow-pending] [--no-push] [--auto-update] [--full-tests] [--allow-missing-deploy] [--allow-untracked] [--allow-stale-base]
#   --dry-run    Full pipeline including file writes — skip git commit, push, deploy.
#   --yes (-y)   Skip confirmation prompt before push/deploy.
#   --allow-pending  Override the pending-update block (REQ-394). Requires a
#                 recorded "**Pending-update override:**" entry in the server's
#                 DECISIONS.md naming the server, date, and reason.
#   --no-push    Commit locally, then stop — skip tag, push, mirror, wiki, deploy.
#   --auto-update  Run outside a session: execute the §6.7 update command
#                  (HOLONOVEL_INVOKE_UPDATE=1) instead of only printing it.
#   --full-tests  Always run the server harness suite, even for a patch/editorial
#                 delta. Default: run it whenever a server path changed; skip only
#                 when the delta is patch/editorial and no server path changed.
#   --allow-missing-deploy  Skip (with a warning) when the deploy clone is absent.
#                 Default: fail closed, because REQ-418 treats deployment as a gate.
#   --allow-untracked  Permit untracked files in the commit surface (for a change
#                 that authors new files). Default: abort so leftovers are not
#                 swept into the commit by the staging step.
#   --allow-stale-base  Continue when `git fetch origin main` fails. Default:
#                 fail closed, because a stale base can misclassify the delta.
#   --help (-h)  Show this message.

set -euo pipefail

# ── Usage ──

usage() {
  cat <<'EOF'
Usage: ./scripts/push-pipeline.sh [--dry-run] [--yes] [--allow-pending] [--no-push] [--auto-update] [--full-tests] [--allow-missing-deploy] [--allow-untracked] [--allow-stale-base]

  --dry-run        Full pipeline including file writes — skip git commit, push, deploy.
  --yes (-y)       Skip confirmation prompt before push/deploy.
  --allow-pending  Override the pending-update block (REQ-394); requires a
                   recorded Pending-update override entry in DECISIONS.md.
  --no-push        Commit locally, then stop — skip tag, push, mirror, wiki, deploy.
  --auto-update    Execute the §6.7 update command (HOLONOVEL_INVOKE_UPDATE=1).
  --full-tests     Always run the server harness suite (skip the patch/editorial exemption).
  --allow-missing-deploy  Skip deploy verification when the deploy clone is absent.
  --allow-untracked  Permit untracked files in the commit surface.
  --allow-stale-base  Continue when `git fetch origin main` fails.
  --help (-h)      Show this message.
EOF
}

# ── Flag parsing ──

DRY_RUN=false
SKIP_CONFIRM=false
ALLOW_PENDING=false
NO_PUSH=false
AUTO_UPDATE=false
FULL_TESTS=false
ALLOW_MISSING_DEPLOY=false
ALLOW_UNTRACKED=false
ALLOW_STALE_BASE=false

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=true ;;
    --yes|-y) SKIP_CONFIRM=true ;;
    --allow-pending) ALLOW_PENDING=true ;;
    --no-push) NO_PUSH=true ;;
    --auto-update) AUTO_UPDATE=true ;;
    --full-tests) FULL_TESTS=true ;;
    --allow-missing-deploy) ALLOW_MISSING_DEPLOY=true ;;
    --allow-untracked) ALLOW_UNTRACKED=true ;;
    --allow-stale-base) ALLOW_STALE_BASE=true ;;
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
# Canonical server list — single source of truth in scripts/lib/servers.json.
# Fail closed: an empty or unreadable list would silently skip the pending-update
# gate (REQ-394), the hash sync, and deploy verification (REQ-418), so a missing
# list is an error, not a no-op.
mapfile -t SERVERS < <(node -e "process.stdout.write(require('./scripts/lib/servers.json').join('\n'))")
if [[ ${#SERVERS[@]} -eq 0 ]]; then
  echo -e "${RED}Could not load the server list from scripts/lib/servers.json — aborting.${NC}" >&2
  exit 1
fi

# Direct tsx invocation — avoids re-resolving the `tsx` binary through `npx` on
# every call (7+ spawns per run). tsx is a devDependency, so the loader is always
# present under node_modules; `node --import tsx` uses it without the npx wrapper.
TSX=(node --import tsx)

# The check suite is always strict: the implementation-coverage audit reads
# HOLONOVEL_IMPL_STRICT, so the single build-order check pass (or the
# check:fast fallback below) already covers the strict gate. The conformance
# report is emitted inside the same check pass.
# HOLONOVEL_PIPELINE_GATES is exported only after a gate pass actually runs
# (step 1); the git hooks require it, so an absent marker runs their full set.
# HOLONOVEL_PIPELINE_STRICT suppresses the per-push repeat in pre-push.
export HOLONOVEL_IMPL_STRICT=1
export HOLONOVEL_CONFORMANCE_REPORT=1

# Serialize runs: two pipelines racing on the same worktree/state can interleave
# generated files and push the wrong snapshot. The lock lives in gitignored
# state. On a host without flock, warn and continue rather than block.
mkdir -p .holonovel-state
if command -v flock >/dev/null 2>&1; then
  exec 9>.holonovel-state/push-pipeline.lock
  if ! flock -n 9; then
    echo -e "${RED}Another push-pipeline run holds .holonovel-state/push-pipeline.lock — aborting.${NC}" >&2
    exit 1
  fi
else
  echo -e "${YELLOW}  flock not found — concurrent pipeline runs are not prevented.${NC}"
fi

# Snapshot the gitignored state files the pipeline may mutate, so --dry-run
# can restore them (tracked files are reverted via `git checkout -- .`).
# refresh-properties also rewrites wiki pages in the separate wiki repo
# (.holonovel-state/wiki/.git, pushed by step 8) — snapshot those .md pages too
# so a --dry-run restores the wiki working tree to its pre-run bytes.
STATE_SNAPSHOT=""
BEFORE_UNTRACKED=""
BEFORE_IGNORED=""
snapshot_state() {
  STATE_SNAPSHOT="$(mktemp -d)"
  BEFORE_UNTRACKED="$STATE_SNAPSHOT/untracked-before"
  BEFORE_IGNORED="$STATE_SNAPSHOT/ignored-before"
  git ls-files --others --exclude-standard > "$BEFORE_UNTRACKED" 2>/dev/null || true
  git ls-files --others --ignored --exclude-standard > "$BEFORE_IGNORED" 2>/dev/null || true
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
  # Remove ignored files the run created (e.g. a fresh .holonovel-state
  # fingerprint) so --dry-run leaves no new state behind.
  if [[ -n "$BEFORE_IGNORED" && -f "$BEFORE_IGNORED" ]]; then
    local after_ignored="$STATE_SNAPSHOT/ignored-after"
    git ls-files --others --ignored --exclude-standard > "$after_ignored" 2>/dev/null || true
    while IFS= read -r p; do
      [[ -n "$p" ]] && rm -rf -- "$p"
    done < <(comm -13 <(sort "$BEFORE_IGNORED") <(sort "$after_ignored"))
  fi
  for f in .holonovel-state/pipeline-fingerprints.json .holonovel-state/build-order-fingerprint.json holonovel/.holonovel-state/build-order-fingerprint.json; do
    local b
    b="$(basename "$f")"
    if [[ -f "$STATE_SNAPSHOT/$b" ]]; then cp "$STATE_SNAPSHOT/$b" "$f"; fi
  done
  if [[ -d ".holonovel-state/wiki" ]]; then
    for f in .holonovel-state/wiki/*.md; do
      local b
      b="wiki-$(basename "$f")"
      if [[ -f "$STATE_SNAPSHOT/$b" ]]; then cp "$STATE_SNAPSHOT/$b" "$f"; fi
    done
  fi
}
# EXIT trap: always remove the temp dir; on --dry-run also restore the tree,
# so a mid-run failure cannot leave a dirty working tree blocking the next run.
cleanup() {
  local rc=$?
  if $DRY_RUN && [[ -n "$STATE_SNAPSHOT" ]]; then restore_worktree; fi
  if [[ -n "$STATE_SNAPSHOT" ]]; then rm -rf "$STATE_SNAPSHOT"; fi
  if [[ -n "${REG_PID:-}" ]]; then kill "$REG_PID" 2>/dev/null || true; fi
  if [[ -n "${REG_LOG:-}" ]]; then rm -f "$REG_LOG"; fi
  if [[ -n "${DELTA_ERR:-}" ]]; then rm -f "$DELTA_ERR"; fi
  # A failed real run can leave build-order output in the worktree, which the
  # next run's clean-tree preflight would reject. Point at the recovery, but do
  # not auto-revert outside --dry-run (the operator may want the generated work).
  if [[ "$rc" -ne 0 ]] && ! $DRY_RUN; then
    local dirty
    dirty="$(git status --porcelain 2>/dev/null || true)"
    if [[ -n "$dirty" ]]; then
      echo -e "${YELLOW}Working tree is dirty after the failed run (generated edits).${NC}" >&2
      echo "$dirty" >&2
      echo -e "${YELLOW}Review and discard with: git checkout -- .${NC}" >&2
    fi
  fi
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

snapshot_state

# Preflight: `git add -A` stages every untracked non-ignored path, so any such
# file is part of the commit surface. Abort and let the operator decide (add,
# ignore, or remove). The three un-ignored wiki mirror pages belong to the
# separate wiki repo and are reset out of the index after staging.
COMMIT_SURFACE_UNTRACKED="$(grep -v '^\.holonovel-state/wiki/' "$BEFORE_UNTRACKED" || true)"
if [[ -n "$COMMIT_SURFACE_UNTRACKED" ]]; then
  if ! $ALLOW_UNTRACKED; then
    echo -e "${RED}Untracked files exist in the commit surface — add, ignore, or remove them before running.${NC}"
    echo "$COMMIT_SURFACE_UNTRACKED"
    echo -e "${YELLOW}To publish a change that authors new files, re-run with --allow-untracked.${NC}"
    exit 1
  fi
  echo -e "${YELLOW}  --allow-untracked: these files will be staged:${NC}"
  echo "$COMMIT_SURFACE_UNTRACKED"
fi

# The pipeline publishes `main` while tagging HEAD, so any other branch would
# push a stale main and tag an unmerged commit.
CURRENT_BRANCH="$(git symbolic-ref --short -q HEAD || true)"
if [[ "$CURRENT_BRANCH" != "main" ]]; then
  echo -e "${RED}Refusing to publish from '${CURRENT_BRANCH:-detached HEAD}'. Switch to main first.${NC}"
  exit 1
fi

# ── 1. Build order (assemble, check, propagate, wisdom, typecheck, version) ──

echo -e "${GREEN}=== 1. Build order (assemble → check → propagate → typecheck → version) ===${NC}"
npm run build-order || { echo -e "${RED}Build order FAILED${NC}"; exit 1; }

# Whether the assembled spec regenerated the package-format contract
# fingerprint (holonovel/src/generated/contract-fingerprints.ts). A change here
# is a server-source change, so the harness suite must run regardless of delta
# class. Any other spec-driven holonovel source change is not produced here.
CONTRACT_CHANGED=false
if ! git diff --quiet -- holonovel/src/generated/contract-fingerprints.ts 2>/dev/null; then
  CONTRACT_CHANGED=true
fi

# Step 2 is intentionally absent: build-order step 5b already refreshes README
# and wiki markers from the assembled spec. A second refresh here was duplicate
# work.

# Gate evidence: build-order runs the full `npm run check` only when the
# fingerprinted surfaces changed. Read its run record (missing/unreadable means
# "not run") and supply the fast gate set for a docs-only delta, so the hooks
# never suppress a pass that did not happen.
CHECK_RAN=false
if [[ -f .holonovel-state/build-order-run.json ]]; then
  CHECK_RAN=$(node -e "try{const j=require('./.holonovel-state/build-order-run.json');process.stdout.write(j.check_ran===true?'true':'false')}catch{process.stdout.write('false')}")
fi
if [[ "$CHECK_RAN" == "true" ]]; then
  export HOLONOVEL_PIPELINE_GATES=full
  echo "  gate evidence: the full check suite ran in build-order"
else
  echo -e "${GREEN}  Running fast gates: build-order skipped its check pass${NC}"
  npm run check:fast || { echo -e "${RED}Fast gate suite FAILED${NC}"; exit 1; }
  # The fast runner buffers gate output, so replay the false-C report that
  # check:conformance produced inside that pass (report-only).
  "${TSX[@]}" scripts/compare-spec-code.ts --dedicated || true
  export HOLONOVEL_PIPELINE_GATES=fast
fi
export HOLONOVEL_PIPELINE_STRICT=1

# ── 2b. Fetch origin so the delta base is current (REQ-418) ──
# The delta classification and the pending-push count both compare against
# origin/main; fetch before either so a stale remote-tracking ref cannot
# misclassify the delta (or hide commits). Fail closed: a stale base can
# under-scope the update. --no-push (local-only) and --allow-stale-base opt out.

echo -e "${GREEN}=== 2b. Fetch origin (delta base) ===${NC}"
if ! git fetch origin main --quiet 2>/dev/null; then
  if $NO_PUSH || $ALLOW_STALE_BASE; then
    echo -e "${YELLOW}  origin fetch failed — continuing with a possibly stale delta base.${NC}"
  else
    echo -e "${RED}origin fetch failed — refusing to classify against a stale base.${NC}" >&2
    echo -e "${YELLOW}Re-run with --allow-stale-base (or --no-push) if the remote is unavailable.${NC}" >&2
    exit 1
  fi
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
  # Capture stdout (the JSON report) separately from stderr (the human summary),
  # so the parser sees only the JSON. spec-delta prints a trailing "\nSpec delta:
  # …" summary on stderr; merging streams with 2>&1 makes JSON.parse reject the
  # trailing text and blocks every run. One stderr file is reused across servers
  # (truncated per call) instead of a mktemp per server.
  local server="$1" out
  if ! out=$("${TSX[@]}" scripts/spec-delta.ts --server "$server" --base "$DELTA_BASE" --report-only 2>"$DELTA_ERR"); then
    echo -e "${RED}  spec-delta failed for $server:${NC}" >&2
    cat "$DELTA_ERR" >&2
    return 1
  fi
  node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const i=s.indexOf('{'),j=s.lastIndexOf('}');try{const c=JSON.parse(s.slice(i,j+1)).classification;console.log(c==='none'?'patch':c)}catch{process.exit(1)}})" <<<"$out"
}

echo -e "${GREEN}=== 3. Spec hash + delta report ===${NC}"
SPEC_HASH=$("${TSX[@]}" scripts/spec-hash.ts)
DELTA_ERR="$(mktemp)"
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
# Scope HOLONOVEL_INVOKE_UPDATE to the update-server.ts invocation. Exported
# globally it leaks into step 4b's `npm run test:all`, where
# test:update-workflow's baseline-seed call would recursively invoke
# `opencode run` and fail (REQ-098).
UPDATE_ENV=()
if $AUTO_UPDATE; then
  UPDATE_ENV=(HOLONOVEL_INVOKE_UPDATE=1)
  echo -e "${YELLOW}--auto-update: the §6.7 update command will be executed (requires opencode on PATH).${NC}"
fi
for server in "${SERVERS[@]}"; do
  DELTA_CLASS="${DELTA_CLASS_OF[$server]}"
  EXTRA_ARGS=("--delta-class" "$DELTA_CLASS")
  if $ALLOW_PENDING; then EXTRA_ARGS+=(--allow-pending); fi
  if ! env "${UPDATE_ENV[@]}" "${TSX[@]}" scripts/update-server.ts --server "$server" \
       --spec-hash "$SPEC_HASH" \
       --scope-by-fingerprint "${EXTRA_ARGS[@]}"; then
    echo -e "${RED}Pending update for $server — implementation has not been updated to match the spec.${NC}"
    echo -e "${YELLOW}Run the printed 'opencode run' command (or re-run with --auto-update outside a session), then re-run this pipeline.${NC}"
    echo -e "${YELLOW}If the rebuild landed in a prior session, record a dated '**Update-deferred:**' bullet in $server/DECISIONS.md naming the revision range and verification (REQ-394a).${NC}"
    echo -e "${YELLOW}To override a pending update (operator escape hatch per REQ-394), re-run with --allow-pending.${NC}"
    exit 1
  fi
done

# ── 4b. Server harness suite (a red harness blocks the push) ──
# §6.7 scopes a Patch/Editorial delta to G0 only (no Pattern Buffer), so the
# suite is skipped when every server's delta is patch/editorial, no contract
# fingerprint changed, and no server path changed. Server source and harness
# edits are not visible in the spec delta, so probe the tree directly.
# --full-tests forces the suite.

# Keep this list bound to build-order's fingerprint components
# (holonovel/src, holonovel/scripts, package files) plus the shipped content and
# launch surfaces a harness covers (starter Novel content, bin, tsconfig).
SERVER_PATHS=()
for server in "${SERVERS[@]}"; do
  SERVER_PATHS+=(
    "$server/src" "$server/scripts" "$server/content" "$server/bin"
    "$server/package.json" "$server/package-lock.json"
    "$server/tool-definitions.json" "$server/server.json"
    "$server/tsconfig.json" "$server/tsconfig.build.json"
    "$server/narrative_world_model"
  )
done
SERVER_CHANGED=false
if ! git diff --quiet "$DELTA_BASE" -- "${SERVER_PATHS[@]}" 2>/dev/null; then
  SERVER_CHANGED=true
fi
if [[ -n "$(git ls-files --others --exclude-standard -- "${SERVER_PATHS[@]}")" ]]; then
  SERVER_CHANGED=true
fi

NEED_TESTS=false
for server in "${SERVERS[@]}"; do
  DELTA_CLASS="${DELTA_CLASS_OF[$server]}"
  if [[ "$DELTA_CLASS" == "minor" || "$DELTA_CLASS" == "major" ]] || $CONTRACT_CHANGED || $SERVER_CHANGED || $FULL_TESTS; then
    NEED_TESTS=true
  fi
done

if $NEED_TESTS; then
  echo -e "${GREEN}=== 4b. Server harness suite (test:all) ===${NC}"
  (cd holonovel && npm run test:all) || { echo -e "${RED}Server harness suite FAILED${NC}"; exit 1; }
else
  echo -e "${GREEN}=== 4b. Server harness suite (test:all) ===${NC}"
  echo -e "${YELLOW}  Skipped: patch/editorial delta, no contract fingerprint change, no server path change (§6.7 G0-only). Use --full-tests to force.${NC}"
fi

# Steps 4c/4d are folded into the single check pass: HOLONOVEL_IMPL_STRICT makes
# the coverage audit strict, and HOLONOVEL_CONFORMANCE_REPORT appends the
# dedicated bucket-C report to `check:conformance` (REQ-321d class). A red check
# gate has already exited in step 1.

# ── 5. Update stored spec hashes in DECISIONS.md ──

echo -e "${GREEN}=== 5. Update stored spec hashes in DECISIONS.md ===${NC}"
# Generate the dated Spec Update record before syncing the hash, so the
# narrative entry (delta class, changed surfaces) is present per Appendix V.4.
# Prefill the Verification line with the evidence this run already produced;
# an operator who pre-wrote the entry keeps their own line (the marker-driven
# generator is a no-op for an existing entry).
HARNESS_STATUS="skipped (§6.7 G0)"
if $NEED_TESTS; then HARNESS_STATUS="ran"; fi
VERIFICATION="Gates: ${HOLONOVEL_PIPELINE_GATES} check suite passed; server harness suite ${HARNESS_STATUS}; spec SHA ${SPEC_HASH}; deploy verification is step 9b (REQ-418)."
"${TSX[@]}" scripts/spec-update-record.ts --verification "$VERIFICATION" || { echo -e "${RED}Spec Update record generation FAILED${NC}"; exit 1; }
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
if ! "${TSX[@]}" scripts/spec-update-record.ts --check; then
  echo -e "${RED}  Spec Update narrative missing or unverified for an unpublished delta — publication blocked.${NC}"
  echo -e "${YELLOW}  Add the entry and fill its Verification line per Appendix V.4, or run: npm run spec-update-record${NC}"
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
DID_WIKI_MIRROR=false
DID_DEPLOY=false

# ── 6. Stage and commit ──

echo -e "${GREEN}=== 6. Stage and commit ===${NC}"
# Stage the whole tracked surface. Preflight guarantees no pre-existing edits or
# staged work, and every untracked non-ignored path was either rejected or
# explicitly permitted, so -A cannot sweep in an unrelated leftover. The wiki
# mirror pages are un-ignored in this repo but owned by the separate wiki clone.
git add -A -- .
git reset -q -- .holonovel-state/wiki 2>/dev/null || true

echo -e "${GREEN}  Staged changes:${NC}"
git diff --cached --stat

HAS_COMMIT=true
TAG_TO_PUSH=""
if git diff --staged --quiet 2>/dev/null; then
  echo -e "${YELLOW}Nothing new to commit.${NC}"
  HAS_COMMIT=false
fi

if $HAS_COMMIT; then
  COMMIT_DATE=$(date +%Y-%m-%d)
  # Follow the repo convention: a date-headed CHANGELOG entry (heading plus its
  # bullets) is the commit message. Fall back to the mechanical summary only
  # when the changelog has no parseable entry.
  COMMIT_MSG="$(awk 'BEGIN{n=0} /^## [0-9]/{n++} n==1{print} n==2{exit}' CHANGELOG.md 2>/dev/null || true)"
  if [[ -n "$COMMIT_MSG" ]]; then
    if [[ "$(printf '%s\n' "$COMMIT_MSG" | sed -n '1p')" != "## $COMMIT_DATE"* ]]; then
      echo -e "${YELLOW}  WARNING: top CHANGELOG entry is not dated $COMMIT_DATE — add today's entry.${NC}"
    fi
    printf '%s\n' "$COMMIT_MSG" > "$STATE_SNAPSHOT/commit-message.txt"
    git commit -F "$STATE_SNAPSHOT/commit-message.txt"
  else
    echo -e "${YELLOW}  WARNING: no dated CHANGELOG entry found — using the mechanical message.${NC}"
    git commit -m "Push pipeline $COMMIT_DATE

  Build-order: spec assembled, checked, propagated to server, server
  typechecked, versions synced. Spec-delta confirms sync. Stored spec hashes
  updated in DECISIONS.md."
  fi
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

# Step 2b already fetched origin main; the remote-tracking ref is current enough
# for the pending count. A push that races a concurrent remote update fails
# loudly on the non-fast-forward rather than corrupting anything.
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
  PUSH_REFS=(main)
  if git ls-remote --tags origin "refs/tags/$TAG" 2>/dev/null | grep -q "refs/tags/$TAG"; then
    echo -e "${YELLOW}  Tag $TAG already on remote — version unchanged, leaving it pinned.${NC}"
  else
    git tag -f "$TAG"
    echo -e "${GREEN}  Tagging $TAG at HEAD${NC}"
    TAG_TO_PUSH="$TAG"
    PUSH_REFS+=("$TAG")
    DID_TAG=true
  fi

  # ── 7. Push main (+ tag) ──
  # main and the tag go in one atomic push so the pre-push hook runs once and a
  # rejected tag cannot leave main advanced without its release tag.

  echo -e "${GREEN}=== 7. Push main ===${NC}"
  git push --atomic origin "${PUSH_REFS[@]}" || { echo -e "${RED}Push FAILED — aborting deploy.${NC}"; exit 1; }
  DID_PUSH=true
else
  echo -e "${YELLOW}Nothing to push — origin is up to date.${NC}"
fi

# ── 7b. Mirror sync (origin → github) ──

echo -e "${GREEN}=== 7b. Mirror sync (github) ===${NC}"
if git config --get remote.github.url >/dev/null 2>&1; then
  # main and the tag in one push so the pre-push hook runs once for the mirror.
  MIRROR_REFS=(main)
  if [[ -n "$TAG_TO_PUSH" ]]; then MIRROR_REFS+=("$TAG_TO_PUSH"); fi
  if git push --atomic github "${MIRROR_REFS[@]}"; then DID_MIRROR=true; else echo -e "${YELLOW}  Mirror push FAILED — GitHub mirror is behind origin.${NC}"; fi
  echo -e "${GREEN}  Mirror sync: DONE${NC}"
else
  echo -e "${YELLOW}  No 'github' remote configured — skipping mirror sync.${NC}"
fi

# ── 7c. npm + MCP Registry publish (delegated to mirror CI via OIDC) ──

echo -e "${GREEN}=== 7c. npm + MCP Registry publish (mirror CI) ===${NC}"
echo -e "${YELLOW}  Publishing is handled by the GitHub mirror's workflow${NC}"
echo -e "${YELLOW}  (.github/workflows/publish.yml) via npm Trusted Publishing (OIDC).${NC}"
echo -e "${YELLOW}  The local pipeline only mirrors to GitHub; the mirror CI publishes.${NC}"

# ── 7d. Registry publication waiter (background, REQ-428) ──
# Start the registry poll now and overlap it with the wiki push and deploy
# below, instead of blocking the tail at step 9c. Collected at step 9c.

REG_PID=""
REG_LOG=""
if $DID_MIRROR; then
  REG_LOG="$(mktemp)"
  # 900s matches publish.yml's 10-minute npm-exposure wait; the registry is
  # still eventually consistent after that (REQ-428 stays advisory here).
  "${TSX[@]}" scripts/check-registry-publish.ts --wait 900 >"$REG_LOG" 2>&1 &
  REG_PID=$!
fi

# ── 8. Push wiki ──

echo -e "${GREEN}=== 8. Push wiki ===${NC}"
WIKI_DIR=".holonovel-state/wiki"
if [[ -d "$WIKI_DIR/.git" ]]; then
  if ! git -C "$WIKI_DIR" add -A; then
    echo -e "${YELLOW}  Wiki staging FAILED — non-fatal; continuing to deploy.${NC}"
  elif git -C "$WIKI_DIR" diff --staged --quiet; then
    echo -e "${YELLOW}  No wiki changes.${NC}"
  elif git -C "$WIKI_DIR" commit -m "Wiki refresh $(date +%Y-%m-%d)"; then
    if git -C "$WIKI_DIR" push --atomic origin main; then
      DID_WIKI=true
    else
      echo -e "${YELLOW}  Wiki push FAILED — non-fatal; continuing to deploy.${NC}"
    fi
  else
    echo -e "${YELLOW}  Wiki commit FAILED — non-fatal; continuing to deploy.${NC}"
  fi

  # ── 8b. Mirror wiki to GitHub ──
  # Run even when origin had no new commit, so a GitHub wiki that drifted or
  # lagged re-syncs. Force-push (never to origin): the GitHub wiki is a strict
  # read-only mirror of git.gay. Local branch `main` maps to GitHub's default
  # `master` ref (GitHub wiki repos do not use `main`).

  echo -e "${GREEN}=== 8b. Mirror wiki (github) ===${NC}"
  if git -C "$WIKI_DIR" remote get-url github >/dev/null 2>&1; then
    # Force-with-lease, never a blind force: if the GitHub-side ref moved since
    # we last read it, fail and let a human reconcile rather than discard it.
    MIRROR_MASTER=$(git -C "$WIKI_DIR" ls-remote github refs/heads/master 2>/dev/null | awk '{print $1}' | head -1)
    if git -C "$WIKI_DIR" push --atomic "--force-with-lease=master:${MIRROR_MASTER}" github main:master; then
      DID_WIKI_MIRROR=true
    else
      echo -e "${YELLOW}  Wiki mirror push (github) FAILED — non-fatal; GitHub wiki is behind.${NC}"
    fi
  else
    echo -e "${YELLOW}  No 'github' remote in wiki repo — skipping wiki mirror.${NC}"
  fi
else
  echo -e "${YELLOW}  Wiki directory not found, skipping.${NC}"
fi

# ── 9. Deploy to MCP target ──

echo -e "${GREEN}=== 9. Deploy to MCP target ===${NC}"
DEPLOY_DIR="${HOLONOVEL_DEPLOY_DIR:-$HOME/Holonovel-deployed}"
PUBLISHED_HEAD=$(git rev-parse origin/main 2>/dev/null || git rev-parse HEAD)
if [[ -d "$DEPLOY_DIR/.git" ]]; then
  # The deploy clone must be the main-branch pull mirror. A wrong branch or a
  # clone tracking another remote would let the pull "succeed" against a tree
  # that is not what was just published (REQ-418).
  DEPLOY_BRANCH=$(git -C "$DEPLOY_DIR" symbolic-ref --short -q HEAD || true)
  if [[ "$DEPLOY_BRANCH" != "main" ]]; then
    echo -e "${RED}Deploy FAILED — deploy clone is on '${DEPLOY_BRANCH:-detached HEAD}', not main (REQ-418).${NC}"
    exit 1
  fi
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
  if [[ "$DEPLOY_NEW" != "$PUBLISHED_HEAD" ]]; then
    echo -e "${RED}Deploy FAILED — deployed HEAD ($DEPLOY_NEW) does not match published origin/main ($PUBLISHED_HEAD) (REQ-418).${NC}"
    exit 1
  fi
  if [[ "$DEPLOY_PREV" != "$DEPLOY_NEW" ]]; then
    echo "  Deployed copy updated ($DEPLOY_PREV → $DEPLOY_NEW)"
    for server in "${SERVERS[@]}"; do
      if [[ -d "$DEPLOY_DIR/$server" ]]; then
        # Install only when the lockfile changed and build only when the source
        # or build config changed; a docs/spec-only pull needs neither. First
        # deploy (empty DEPLOY_PREV) always installs and builds.
        CHANGED="$(git -C "$DEPLOY_DIR" diff --name-only "$DEPLOY_PREV" "$DEPLOY_NEW" -- "$server" 2>/dev/null || true)"
        if [[ -z "$DEPLOY_PREV" ]] || grep -q "^$server/package-lock.json$" <<<"$CHANGED"; then
          # npm ci installs strictly from package-lock.json and never rewrites it.
          # A bare `npm install` under a different npm rewrites the lockfile,
          # invalidating the REQ-313 lockfile fingerprint and failing REQ-418
          # verification (recurrence: 2026-08-24). Guard: revert any lockfile
          # drift the toolchain still produces before the build.
          if ! (cd "$DEPLOY_DIR/$server" && npm ci --quiet --no-audit --no-fund); then
            echo -e "${RED}    $server: dependency install FAILED — deploy incomplete (REQ-418).${NC}"
            exit 1
          fi
          if [[ -n "$(git -C "$DEPLOY_DIR/$server" status --porcelain -- package-lock.json)" ]]; then
            echo -e "${RED}    $server: package-lock.json drifted during install — reverting.${NC}"
            git -C "$DEPLOY_DIR/$server" checkout -- package-lock.json
          fi
        else
          echo "    $server: lockfile unchanged — skipping npm ci"
        fi
        if [[ -z "$DEPLOY_PREV" ]] || grep -qE "^$server/(src/|tsconfig)" <<<"$CHANGED"; then
          if ! (cd "$DEPLOY_DIR/$server" && npm run build --if-present); then
            echo -e "${RED}    $server: build FAILED — deploy incomplete (REQ-418).${NC}"
            exit 1
          fi
        else
          echo "    $server: source unchanged — skipping build"
        fi
        echo "    $server: deps and build updated"
      fi
    done
  else
    echo "  Deployed copy already at latest."
  fi
else
  if ! $ALLOW_MISSING_DEPLOY; then
    echo -e "${RED}Deploy directory not found at $DEPLOY_DIR — deployment is a gate (REQ-418).${NC}"
    echo -e "${YELLOW}Provision the clone, or re-run with --allow-missing-deploy (or set HOLONOVEL_DEPLOY_DIR).${NC}"
    exit 1
  fi
  echo -e "${YELLOW}  Deploy directory not found at $DEPLOY_DIR — skipping (--allow-missing-deploy).${NC}"
fi

# ── 9b. Verify the deployed tree (REQ-418) ──

echo -e "${GREEN}=== 9b. Verify deployed tree (REQ-418) ===${NC}"
if [[ -d "$DEPLOY_DIR/.git" ]]; then
  for server in "${SERVERS[@]}"; do
    if ! "${TSX[@]}" scripts/update-server.ts --server "$server" --server-dir "$DEPLOY_DIR/$server" --spec-hash "$SPEC_HASH" --verify-deployed; then
      echo -e "${RED}Deploy verification FAILED for $server — deployed tree does not match the published spec.${NC}"
      exit 1
    fi
  done
  DID_DEPLOY=true
else
  echo -e "${YELLOW}  Deploy directory not found — skipping verification (--allow-missing-deploy).${NC}"
fi

# ── 9c. Registry publication check (non-fatal, REQ-428) ──
# The waiter was launched at step 7d, overlapping the wiki push and deploy. Its
# exit status is the registry verdict: a bounded window elapsed, so a miss warns
# rather than failing the pipeline (REQ-418 deploy gate still holds). The poll's
# progress output is replayed from the log here.

echo -e "${GREEN}=== 9c. Registry publication check (REQ-428) ===${NC}"
if [[ -n "$REG_PID" ]]; then
  if wait "$REG_PID"; then
    echo "  MCP Registry lists the published version."
  else
    echo -e "${YELLOW}  MCP Registry does not list the published version yet — re-run 'npm run check-registry' after the mirror CI finishes (REQ-428).${NC}"
  fi
  cat "$REG_LOG" 2>/dev/null || true
else
  echo -e "${YELLOW}  Skipped: no mirror push this run.${NC}"
fi

# ── Summary ──

summary_flag() { if $1; then echo "yes"; else echo "no"; fi; }
echo -e "${GREEN}Done.${NC} commit=$(summary_flag $DID_COMMIT) tag=$(summary_flag $DID_TAG) push=$(summary_flag $DID_PUSH) mirror=$(summary_flag $DID_MIRROR) wiki=$(summary_flag $DID_WIKI) wiki_mirror=$(summary_flag $DID_WIKI_MIRROR) deploy=$(summary_flag $DID_DEPLOY)"
