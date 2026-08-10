#!/bin/bash
set -euo pipefail

QUEUE=".opencode/build-queue.txt"
AAR_DIR=".opencode/aar"
BUILD_SESSION=""
RETRY_CAP=2
mkdir -p "$AAR_DIR"

while true; do
  if [ -s "$QUEUE" ]; then
    TASK=$(head -1 "$QUEUE")
    SLUG=$(echo "$TASK" | tr ' ' '_' | tr -cd '[:alnum:]_-' | head -c 40)
    TS=$(date +%Y-%m-%dT%H:%M:%S)
    AAR="$AAR_DIR/${TS}-${SLUG}.md"

    PROMPT="Task: $TASK

After implementing:
1. Run the project gates. If anything fails, attempt a
   spec-engineering-loop remediation (max $RETRY_CAP attempts).
2. If the loop resolves all issues: commit with a dated
   changelog-style message and push to origin main. Write a
   one-line summary to $AAR.
3. If the loop cannot resolve after $RETRY_CAP attempts: write a
   full after-action report to $AAR and stop."

    echo "=== $(date): $TASK ==="

    if [ -z "$BUILD_SESSION" ]; then
      opencode run --agent build --title "Build Queue" "$PROMPT"
      BUILD_SESSION=$(opencode session list --format json --max-count 1 | jq -r '.[0].id')
    else
      opencode run --session "$BUILD_SESSION" "$PROMPT"
    fi

    if [ $? -eq 0 ]; then
      sed -i '1d' "$QUEUE"
      echo "=== Done ==="
    else
      echo "=== FAILED — task left in queue ==="
      break
    fi
  fi
  sleep 5
done
