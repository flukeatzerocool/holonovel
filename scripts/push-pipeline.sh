#!/usr/bin/env bash
# push-pipeline.sh — assemble, gate, commit, publish, deploy. [entry point]
#
# Role: operator-facing entry point implementing §6.7 publication contracts
# REQ-394 (pending-update gate) and REQ-418 (deployment verification). It parses
# the CLI and delegates to the step-registry driver
# (scripts/publish/run.ts); scripts/push-pipeline-legacy.sh is the previous
# monolithic implementation, kept as the backout path.
#
# Engine selection: PUSH_ENGINE=next (the default, after the hermetic harness
# passed twice) runs the step registry; PUSH_ENGINE=legacy runs the previous
# implementation as the backout path. `--engine=next|legacy` overrides per run.
#
# Exit codes: 0 = pipeline completed (or dry-run/--no-push stopped cleanly);
# 1 = any build, gate, push, or deploy failure, including a run refused for want
# of --yes on non-interactive stdin; 2 = fatal (bad flag, missing dependency).
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"

if [[ -t 1 ]]; then
    RED=$'\033[31m'; YELLOW=$'\033[33m'; GREEN=$'\033[32m'; NC=$'\033[0m'
else
    RED=""; YELLOW=""; GREEN=""; NC=""
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
  --from <step>           Start at a step (inclusive).
  --only <step>           Run exactly one step.
  --stage <stage>         Run one stage: repo|tag|release|docs|deploy.
  --resume                Skip steps already recorded as passed on this tree.
  --engine=next|legacy    Select the engine (default: \${PUSH_ENGINE:-next}).
  --legacy                Shorthand for --engine=legacy.
  --help (-h)             Show this message.
EOF
}

ENGINE="${PUSH_ENGINE:-next}"
ARGS=()

while [[ $# -gt 0 ]]; do
    case "$1" in
        --help|-h) usage; exit 0 ;;
        --engine=*) ENGINE="${1#--engine=}" ;;
        --engine) shift; ENGINE="${1:-}" ;;
        --legacy) ENGINE="legacy" ;;
        --dry-run|--yes|-y|--no-push|--allow-pending|--allow-untracked|--allow-missing-deploy|--allow-stale-base|--full-tests|--auto-update|--resume)
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

case "$ENGINE" in
    legacy)
        echo "${YELLOW}push-pipeline: legacy engine (backout path)${NC}" >&2
        exec "$DIR/push-pipeline-legacy.sh" "${ARGS[@]}"
        ;;
    next)
        exec npx tsx "$DIR/publish/run.ts" "${ARGS[@]}"
        ;;
    *)
        echo "${RED}push-pipeline: unknown engine '$ENGINE' (expected next or legacy)${NC}" >&2
        exit 2
        ;;
esac
