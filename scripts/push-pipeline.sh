#!/usr/bin/env bash
# push-pipeline.sh — assemble, gate, commit, publish, deploy. [entry point]
#
# Role: operator-facing entry point implementing §6.7 publication contracts
# REQ-394 (pending-update gate), REQ-418 (deployment verification), and
# REQ-428 (registry-published distribution). It parses the CLI, takes the
# advisory run lock, and delegates to the step-registry driver
# (scripts/publish/run.ts).
#
# One publish at a time: the run lock lives at
# .holonovel-state/push-pipeline.lock and is held on fd 9 across the exec, so a
# second run aborts while the first is live. `flock` is optional; without it the
# run warns and proceeds.
#
# Exit codes: 0 = pipeline completed (or dry-run/--no-push stopped cleanly);
# 1 = any build, gate, push, deploy, or lock failure, including a run refused
# for want of --yes on non-interactive stdin; 2 = fatal (bad flag, missing
# dependency).
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$DIR/.." && pwd)"

if [[ -t 1 ]]; then
    RED=$'\033[31m'; YELLOW=$'\033[33m'; NC=$'\033[0m'
else
    RED=""; YELLOW=""; NC=""
fi

usage() {
    cat <<EOF
Usage: ./scripts/push-pipeline.sh [options]

  --dry-run               Run every check, change nothing.
  --yes (-y)              Skip the confirmation prompt.
  --no-push               Commit locally, then stop before tag/push/deploy.
  --allow-pending         Permit a pending update (REQ-394 escape hatch).
  --allow-untracked       Stage untracked non-ignored files.
  --allow-missing-deploy  Skip deploy verification when the clone is absent.
  --allow-stale-base      Classify the delta against a possibly stale origin.
  --full-tests            Always run the server harness suite.
  --auto-update           Execute the §6.7 update command.
  --allow-secrets         Warn, do not block, on a staged secret-pattern match.
  --from <step>           Start at a step (inclusive).
  --only <step>           Run exactly one step.
  --stage <stage>         Run one stage: repo|tag|release|docs|deploy.
  --resume                Skip steps already recorded as passed on this tree.
  --help (-h)             Show this message.
EOF
}

ARGS=()

while [[ $# -gt 0 ]]; do
    case "$1" in
        --help|-h) usage; exit 0 ;;
        --dry-run|--yes|-y|--no-push|--allow-pending|--allow-untracked|--allow-missing-deploy|--allow-stale-base|--full-tests|--auto-update|--allow-secrets|--resume)
            ARGS+=("$1") ;;
        --from|--only|--stage)
            if [[ $# -lt 2 ]]; then
                echo "${RED}$1 requires a value${NC}" >&2
                exit 2
            fi
            ARGS+=("$1" "$2"); shift ;;
        *)
            echo "${RED}Unknown option: $1${NC}" >&2
            usage >&2
            exit 2 ;;
    esac
    shift
done

# Advisory run lock: one publication at a time. fd 9 is inherited across exec,
# so the driver holds the lock for the whole run.
mkdir -p "$ROOT/.holonovel-state"
if command -v flock >/dev/null 2>&1; then
    exec 9>"$ROOT/.holonovel-state/push-pipeline.lock"
    if ! flock -n 9; then
        echo "${RED}Another push-pipeline run holds .holonovel-state/push-pipeline.lock — aborting.${NC}" >&2
        exit 1
    fi
else
    echo "${YELLOW}  flock not found — concurrent pipeline runs are not prevented.${NC}" >&2
fi

exec npx tsx "$DIR/publish/run.ts" "${ARGS[@]}"
