#!/usr/bin/env bash
# push-pipeline.sh — Full rebuild, audit, and push pipeline: spec read-through,
# Inform server rebuild + scan, dnd5e server rebuild + scan, README/wiki update,
# commit, push.
#
# This is the deep-clean — full from-scratch rebuild of both servers,
# dead-data audit, and documentation refresh.
#
# Usage:
#   ./scripts/push-pipeline.sh

set -euo pipefail

# Kill child opencode processes on script exit (prevent orphan zombies)
cleanup_children() {
  local child_pids
  child_pids=$(jobs -p 2>/dev/null || true)
  [[ -n "$child_pids" ]] && { kill $child_pids 2>/dev/null; sleep 1; kill -9 $child_pids 2>/dev/null; } || true
}
trap cleanup_children EXIT SIGINT SIGTERM

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
WRAP_LOG="$PROJECT_DIR/.holonovel-state/queue-plans/wrapup-${TIMESTAMP}-log.txt"
WRAP_INFORM_REBUILD_OUT="$PROJECT_DIR/.holonovel-state/queue-plans/wrapup-inform-rebuild-${TIMESTAMP}-output.txt"
WRAP_INFORM_SCAN_OUT="$PROJECT_DIR/.holonovel-state/queue-plans/wrapup-inform-scan-${TIMESTAMP}-output.txt"
WRAP_REBUILD_OUT="$PROJECT_DIR/.holonovel-state/queue-plans/wrapup-rebuild-${TIMESTAMP}-output.txt"
WRAP_DND5E_SCAN_OUT="$PROJECT_DIR/.holonovel-state/queue-plans/wrapup-dnd5e-scan-${TIMESTAMP}-output.txt"
WRAP_README_OUT="$PROJECT_DIR/.holonovel-state/queue-plans/wrapup-readme-${TIMESTAMP}-output.txt"
WRAP_WIKI_OUT="$PROJECT_DIR/.holonovel-state/queue-plans/wrapup-wiki-${TIMESTAMP}-output.txt"
WIKI_DIR="$PROJECT_DIR/.holonovel-state/wiki"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

mkdir -p "$PROJECT_DIR/.holonovel-state/queue-plans"

# ── shared: run_dead_data_scan ─────────────────────────────────────────────
# Usage: run_dead_data_scan --dir <subdir> --label <display-name> --out <log-path> --session-title <title>
# Launches a read-only audit for dead/outdated data in the given directory.
# Returns findings count in the global variable SCAN_FINDINGS_COUNT.
run_dead_data_scan() {
  local dir="" label="" out="" session_title=""
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --dir) dir="$2"; shift 2 ;;
      --label) label="$2"; shift 2 ;;
      --out) out="$2"; shift 2 ;;
      --session-title) session_title="$2"; shift 2 ;;
      *) echo -e "${RED}run_dead_data_scan: unknown arg $1${NC}"; return 1 ;;
    esac
  done

  local SCAN_PROMPT="Scan the ${dir}/ directory for dead and outdated data. This is a
read-only audit — do NOT modify any files.

Checklist:
1. REQ citations in source code — grep for REQ-\d+ patterns. Each REQ number
   must exist in the current holonovel.md. Report any that don't.
2. Test IDs in test files — grep for T\d+ patterns. Each test ID must exist
   in Appendix F of holonovel.md. Report orphans.
3. Deprecated terms from Appendix R — grep for each deprecated term. Flag
   any occurrence.
4. Hardcoded counts — check if tool count, resource count, REQ count, or gate
   count in source code matches spec_health output or current holonovel.md.
5. Stale file paths — check import paths, config references, and README
   paths exist on disk.
6. Dangling cross-references in ${dir}/DECISIONS.md — verify every cited REQ,
   test ID, and spec section reference resolves in holonovel.md.

For each finding, report: file:line, what's dead/outdated, and the suggested
fix. Separate findings by server directory (${dir}/).

End with '${label} SCAN COMPLETE. N findings.' (N is the count — N=0 means
clean, no dead data found)."

  set +e
  opencode run \
    --agent build \
    --auto \
    --title "$session_title" \
    --dir "$PROJECT_DIR" \
    "$SCAN_PROMPT" \
    > "$out" 2>> "$WRAP_LOG"
  local rc=$?
  set -e

  if [[ $rc -ne 0 ]]; then
    echo -e "${RED}${label} scan FAILED. Check $out.${NC}"
    exit 1
  fi

  SCAN_FINDINGS_COUNT=$(grep -oP '\d+ findings' "$out" 2>/dev/null | grep -oP '\d+' || echo "?")
  echo ""
  echo -e "${GREEN}${label} scan: DONE — ${SCAN_FINDINGS_COUNT} finding(s)${NC}"
  echo ""
}

# ── step 1: full spec audit ──────────────────────────────────────────────

echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}Step 1/10: Full spec audit${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo ""

# 1a: lint spec/ source files (in addition to assembled doc)
echo -e "${YELLOW}Linting spec/ source files...${NC}"
set +e
markdownlint spec/*.md 2>/dev/null
SPECLINT_RC=$?
set -e
if [[ $SPECLINT_RC -ne 0 ]]; then
  echo -e "${YELLOW}spec/ lint warnings (non-blocking)${NC}"
fi
echo ""

# 1b: verify assembled spec matches sources
echo -e "${YELLOW}Verifying holonovel.md matches spec/ sources...${NC}"
ASSEMBLE_CHECK="$PROJECT_DIR/.holonovel-state/queue-plans/wrapup-assemble-check-${TIMESTAMP}.md"
npm run assemble 2>/dev/null
if ! git -C "$PROJECT_DIR" diff --quiet holonovel.md 2>/dev/null; then
  echo -e "${RED}Assembly drift: holonovel.md differs from spec/ sources.${NC}"
  echo -e "${RED}Run 'npm run assemble' and commit before proceeding.${NC}"
  exit 1
fi
echo -e "${GREEN}Assembly check: PASSED (holonovel.md matches spec/)${NC}"
echo ""

# 1c: run all sub-checks, collect results
echo -e "${YELLOW}Running spec audit sub-checks...${NC}"
set +e
FAILED_CHECKS=""
CHECKS=("lint" "validate" "audit-assumptions" "scan-ambiguity" "check-cross-refs" "validate-readme" "detect-dupes")
for check in "${CHECKS[@]}"; do
  if ! npm run "$check" 2>/dev/null; then
    FAILED_CHECKS="$FAILED_CHECKS $check"
  fi
done
set -e

if [[ -n "$FAILED_CHECKS" ]]; then
  echo ""
  echo -e "${RED}Spec audit FAILED. Failed checks:$FAILED_CHECKS${NC}"
  exit 1
fi

echo ""
echo -e "${GREEN}Spec audit: PASSED (all ${#CHECKS[@]} checks)${NC}"
echo ""

# ── step 1b: full spec read-through (style conformance) ──────────────────

echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}Step 1b/10: Full spec read-through — style conformance${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo ""

WRAP_READTHROUGH_OUT="$PROJECT_DIR/.holonovel-state/queue-plans/wrapup-readthrough-${TIMESTAMP}-output.txt"

READTHROUGH_PROMPT="Read the assembled holonovel.md end to end. Load and apply the
proofreading skill in spec mode. Verify every REQ body in §5 conforms to
Appendix M: states *what* not *how*, no parameter types, no Default: clauses,
no enumerated catalogs, no algorithm descriptions. Flag any violation with the
REQ number, the offending text, and the rule violated.

The spec mode activates automatically when the document contains **REQ- blocks.
Run all 7 spec-mode checks (REQ block hygiene, manifest completeness, test ID
consistency, tool name consistency, authoring conventions, term definition
hygiene, golden transcript coverage). Report findings with severity tiers
(critical / warning / info).

Auto-fix findings where safe: typo corrections, missing punctuation, whitespace
normalization. Do NOT auto-fix: REQ body rewrites, structural changes, test ID
assignments, or anything that changes semantic meaning.

End with a machine-parseable summary line:
'READTHROUGH N critical; M high; K info.'

Gate: halt on critical > 0. Warn on high > 0. Info is advisory."

echo -e "${YELLOW}Launching read-through session...${NC}"
mkdir -p "$PROJECT_DIR/.holonovel-state/queue-plans"
set +e
opencode run \
  --agent build \
  --auto \
  --title "spec-wrapup-readthrough" \
  --dir "$PROJECT_DIR" \
  "$READTHROUGH_PROMPT" \
  > "$WRAP_READTHROUGH_OUT" 2>> "$WRAP_LOG"
READTHROUGH_RC=$?
set -e

if [[ $READTHROUGH_RC -ne 0 ]]; then
  echo -e "${RED}Read-through FAILED. Check $WRAP_READTHROUGH_OUT.${NC}"
  exit 1
fi

# Parse severity tiers from machine-parseable summary
critical=$(grep -oP 'READTHROUGH \d+ critical' "$WRAP_READTHROUGH_OUT" 2>/dev/null | grep -oP '\d+' || echo "?")
high=$(grep -oP '\d+ high' "$WRAP_READTHROUGH_OUT" 2>/dev/null | grep -oP '\d+' || echo "?")
info=$(grep -oP '\d+ info' "$WRAP_READTHROUGH_OUT" 2>/dev/null | grep -oP '\d+' || echo "?")

if [[ "$critical" != "0" && "$critical" != "?" ]]; then
  echo -e "${RED}Read-through BLOCKED: ${critical} critical finding(s).${NC}"
  exit 1
fi

echo ""
echo -e "${GREEN}Read-through: DONE — ${critical}c / ${high}h / ${info}i${NC}"
if [[ "$high" != "0" && "$high" != "?" ]]; then
  echo -e "${YELLOW}Warning: ${high} high-severity finding(s) — review before commit.${NC}"
fi
echo ""

# ── step 2: build Inform MCP server ──────────────────────────────────────

echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}Step 2/10: Build Inform MCP server${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo ""

# Provider docs expected at the B10 default path (inform/docs_md/)
INFORM_DOCS_DIR="$PROJECT_DIR/inform/docs_md"
if [[ ! -d "$INFORM_DOCS_DIR" ]] || [[ -z "$(ls -A "$INFORM_DOCS_DIR" 2>/dev/null)" ]]; then
  echo -e "${RED}Provider documentation not found at $INFORM_DOCS_DIR${NC}"
  exit 1
fi

# Clean stale build artifacts
echo -e "${YELLOW}Cleaning stale build artifacts...${NC}"
rm -rf "$PROJECT_DIR/inform/node_modules/.cache" 2>/dev/null || true
echo ""

INFORM_REBUILD_PROMPT="Build the Inform MCP server from scratch in inform/ against the current
specification (holonovel.md). This is a ruleset-free build: B1=none, using the
world-model provider documentation at inform/docs_md/ (B10).

1. Index the documentation: extract the kind hierarchy, property contracts,
   and parser command catalog from inform/docs_md/.
2. Construct the world-model tools: parser command dispatch (REQ-196), CRUD
   (REQ-198), convert_source (REQ-201).
3. Construct the world-model resources: room://, thing://, world://map,
   world://kinds (REQ-202).
4. Construct the infrastructure tools and prompts per REQ-020, REQ-023.
5. Run \`cd inform && npm run typecheck\` — fix any type errors.
6. Smoke test: start the server, call \`spec_health\`, run one
   \`command(\"look\")\` on a populated model — verify no crashes.
7. Run the Inform Gauntlet — the 13 sub-workflows (I1-I13) defined in §6.6
   Inform Gauntlet. All blocking sub-workflows (I1-I6, I10) must pass.
8. Run \`npm run spec-delta -- --server inform\` and confirm the Inform server
   is in sync with the spec. If not, close the gaps.
9. Update inform/DECISIONS.md with a rebuild entry in standard format:

   ### Inform Rebuild — YYYY-MM-DD
   | Field | Value |
   |-------|-------|
   | Spec version | <version> |
   | Build fingerprint | <hash> |
   | Gauntlet (I1-I13) | <pass/fail per sub-workflow> |
   | Blocking (I1-I6, I10) | <pass/fail> |
   | Verification | typecheck <N errors>, spec-delta <sync/conflicts> |

Do NOT commit. End with 'INFORM REBUILD COMPLETE.' if all steps pass."

echo -e "${YELLOW}Launching Inform rebuild session...${NC}"
mkdir -p "$PROJECT_DIR/.holonovel-state/queue-plans"
opencode run \
  --agent build \
  --auto \
  --title "spec-wrapup-inform-rebuild" \
  --dir "$PROJECT_DIR" \
  "$INFORM_REBUILD_PROMPT" \
  > "$WRAP_INFORM_REBUILD_OUT" 2>> "$WRAP_LOG"
INFORM_REBUILD_RC=$?

if [[ $INFORM_REBUILD_RC -ne 0 ]]; then
  echo -e "${RED}Inform rebuild FAILED. Check $WRAP_INFORM_REBUILD_OUT.${NC}"
  exit 1
fi

echo ""
echo -e "${GREEN}Inform rebuild: DONE${NC}"
echo ""

# ── step 3: dead-data scan on inform/ ────────────────────────────────────

echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}Step 3/10: Dead-data scan — inform/${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo ""

run_dead_data_scan \
  --dir "inform" \
  --label "INFORM" \
  --out "$WRAP_INFORM_SCAN_OUT" \
  --session-title "spec-wrapup-inform-scan"
INFORM_FINDINGS="$SCAN_FINDINGS_COUNT"

# ── step 4: rebuild dnd5e server from spec ───────────────────────────────

echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}Step 4/10: Rebuild dnd5e server from spec${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo ""

REBUILD_PROMPT="Rebuild the dnd5e MCP server from scratch against the current
specification (holonovel.md). This is a full rebuild, not a gap-based update.
Use the provider model from the inform/ server's indexed output.

1. Run \`cd dnd5e && npm run build\` to re-extract the ruleset index.
2. Run \`cd dnd5e && npm run typecheck\` — fix any type errors.
3. Run the full test suite: \`cd dnd5e && npx tsx scripts/test_scripts/run_all.ts\`
   — fix any test failures.
4. Run the blocking Gauntlet sub-workflows per §6.6 exit criteria.
5. Run \`npm run version-sync\` to align all version strings.
6. Update dnd5e/DECISIONS.md with a rebuild entry in standard format:

   ### dnd5e Rebuild — YYYY-MM-DD
   | Field | Value |
   |-------|-------|
   | Spec version | <version> |
   | Build fingerprint | <hash> |
   | Gauntlet | <pass/fail per sub-workflow> |
   | Verification | typecheck <N errors>, test suite <M/N passed>, version-sync <ok/fail> |

Note: do NOT run spec-delta here — sync verification is handled in Step 6.
Do NOT commit. End with 'REBUILD COMPLETE.' if all steps pass."

echo -e "${YELLOW}Launching rebuild session...${NC}"
mkdir -p "$PROJECT_DIR/.holonovel-state/queue-plans"
opencode run \
  --agent build \
  --auto \
  --title "spec-wrapup-rebuild" \
  --dir "$PROJECT_DIR" \
  "$REBUILD_PROMPT" \
  > "$WRAP_REBUILD_OUT" 2>> "$WRAP_LOG"
REBUILD_RC=$?

if [[ $REBUILD_RC -ne 0 ]]; then
  echo -e "${RED}Server rebuild FAILED. Check $WRAP_REBUILD_OUT.${NC}"
  exit 1
fi

echo ""
echo -e "${GREEN}Server rebuild: DONE${NC}"
echo ""

# ── step 5: dead-data scan on dnd5e/ ─────────────────────────────────────

echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}Step 5/10: Dead-data scan — dnd5e/${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo ""

run_dead_data_scan \
  --dir "dnd5e" \
  --label "DND5E" \
  --out "$WRAP_DND5E_SCAN_OUT" \
  --session-title "spec-wrapup-dnd5e-scan"
DND5E_FINDINGS="$SCAN_FINDINGS_COUNT"

# ── step 6: spec-delta confirmation (both servers) ───────────────────────

echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}Step 6/10: Confirm both servers in sync with spec${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo ""

# ── inform sync ───────────────────────────────────────────────────────────

INFORM_SYNC_OUT="$PROJECT_DIR/.holonovel-state/queue-plans/wrapup-inform-sync-${TIMESTAMP}-output.txt"

INFORM_SYNC_PROMPT="Run the spec-driven update workflow against the Inform server in inform/.
The specification (holonovel.md) may have changed since the last Inform server sync.

Phase 1 — Detect: Run \`npm run spec-delta -- --server inform\`. If exit 0, the server
  is in sync — report and stop. If exit 1, classify the delta: patch (wording only),
  minor (REQ bodies changed, no state-model change), major (state model, tool surface,
  or gating contract changed).

Phase 2 — Audit: Read inform/src/ and compare against the world-model REQs
  (§5.10, REQ-195–202) and ruleset-free mode REQs (§5.11, REQ-218–219).
  Produce a gap disposition table:
  | REQ | Gap | Disposition | Reason |
  |-----|-----|-------------|--------|
  Auto-confirm all dispositions — this is a trusted automated pipeline.

Phase 3 — Implement: Apply all implemented gaps.
  Run \`cd inform && npm run typecheck\` after each change batch.
  Run \`npx tsx inform/scripts/run_gauntlet.ts\` after all changes.

Phase 4 — Close: Update inform/DECISIONS.md with gap-disposition entry.
  Run \`npm run version-sync\` then \`npm run spec-delta -- --server inform\` to confirm sync.

Smoke test: After all changes, call the Inform server's \`spec_health\` tool and verify:
  - Tool count has not decreased from baseline
  - Resource count has not decreased from baseline
  - No confidence scores below 50%
  - \`last_spec_review\` timestamp is current (within 24 hours)
  If any check fails, report the failure before declaring sync complete.

Gauntlet: Use the surface-to-scenario mapping in §6.6 Inform Gauntlet. Run all 13
sub-workflows (I1-I13). All blocking sub-workflows (I1-I6, I10) must pass. Maximum 2
convergence iterations:
  - Iteration 1: Run all sub-workflows. If all blocking pass → done.
  - If any blocking fail: map each failure to its convergence metric, fix the root
    cause, record the mapping in DECISIONS.md, re-run.
  - Iteration 2: Re-run failed blocking sub-workflows. If all pass → done.
  - If still failing: log residual gaps to DECISIONS.md, report SYNC FAILED.
    Do not retry beyond 2 iterations.

Report completion: gaps implemented/deferred/waived, verification results,
Gauntlet pass/fail per sub-workflow. End with 'SYNC COMPLETE.' if all steps pass."

if npm run spec-delta -- --server inform 2>/dev/null; then
  echo -e "${GREEN}Inform server in sync with spec.${NC}"
else
  echo -e "${YELLOW}Inform delta detected — running sync workflow...${NC}"
  set +e
  opencode run \
    --agent build \
    --auto \
    --title "push-pipeline-inform-sync" \
    --dir "$PROJECT_DIR" \
    "$INFORM_SYNC_PROMPT" \
    > "$INFORM_SYNC_OUT" 2>> "$WRAP_LOG"
  INFORM_SYNC_RC=$?
  set -e
  if [[ $INFORM_SYNC_RC -ne 0 ]]; then
    echo -e "${RED}Inform sync FAILED. Check $INFORM_SYNC_OUT.${NC}"
    exit 1
  fi
  echo -e "${GREEN}Inform sync: DONE${NC}"
fi

# ── dnd5e sync ────────────────────────────────────────────────────────────

DND5E_SYNC_OUT="$PROJECT_DIR/.holonovel-state/queue-plans/wrapup-dnd5e-sync-${TIMESTAMP}-output.txt"

DND5E_SYNC_PROMPT="Run the spec-driven update workflow against the dnd5e server.
The specification (holonovel.md) may have changed since the last server sync.

Phase 1 — Detect: Run \`npm run spec-delta -- --server dnd5e\`. If exit 0, the server
  is in sync — report and stop. If exit 1, classify the delta: patch (wording only),
  minor (REQ bodies changed, no state-model change), major (state model, tool surface,
  or gating contract changed).

Phase 2 — Audit: Read dnd5e/src/ and compare against spec REQs.
  Produce a gap disposition table:
  | REQ | Gap | Disposition | Reason |
  |-----|-----|-------------|--------|
  Auto-confirm all dispositions — this is a trusted automated pipeline.

Phase 3 — Implement: Apply all implemented gaps.
  Run \`cd dnd5e && npm run typecheck\` after each change batch.
  Run \`cd dnd5e && npx tsx scripts/test_scripts/run_all.ts\` after all changes.

Phase 4 — Close: Update dnd5e/DECISIONS.md with gap-disposition entry.
  Run \`npm run version-sync\` then \`npm run spec-delta -- --server dnd5e\` to confirm sync.

Smoke test: After all changes, call the server's \`spec_health\` tool and verify:
  - Tool count has not decreased from baseline
  - Resource count has not decreased from baseline
  - No confidence scores below 50%
  - \`last_spec_review\` timestamp is current (within 24 hours)
  If any check fails, report the failure before declaring sync complete.

Gauntlet: Run only the sub-workflows selected by the surface-to-scenario
mapping in holonovel.md §6.6. Maximum 2 convergence iterations:
  - Iteration 1: Run selected scenarios. If all pass → done.
  - If any fail: map each failure to its convergence metric (MUST-coverage,
    mechanics-fidelity, input-validation, process-compliance), fix the root
    cause, record the mapping in DECISIONS.md, re-run.
  - Iteration 2: Re-run selected scenarios. If all pass → done.
  - If still failing: log residual gaps to DECISIONS.md, report SYNC FAILED.
    Do not retry beyond 2 iterations.

Report completion: gaps implemented/deferred/waived, verification results,
Gauntlet pass/fail. End with 'SYNC COMPLETE.' if all steps pass."

if npm run spec-delta -- --server dnd5e 2>/dev/null; then
  echo -e "${GREEN}Dnd5e server in sync with spec.${NC}"
else
  echo -e "${YELLOW}Dnd5e delta detected — running sync workflow...${NC}"
  set +e
  opencode run \
    --agent build \
    --auto \
    --title "push-pipeline-dnd5e-sync" \
    --dir "$PROJECT_DIR" \
    "$DND5E_SYNC_PROMPT" \
    > "$DND5E_SYNC_OUT" 2>> "$WRAP_LOG"
  DND5E_SYNC_RC=$?
  set -e
  if [[ $DND5E_SYNC_RC -ne 0 ]]; then
    echo -e "${RED}Dnd5e sync FAILED. Check $DND5E_SYNC_OUT.${NC}"
    exit 1
  fi
  echo -e "${GREEN}Dnd5e sync: DONE${NC}"
fi
echo ""

# ── step 7: README update ────────────────────────────────────────────────

echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}Step 7/10: Update README.md${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo ""

README_PROMPT="Load and apply the proofreading skill. Read README.md and
holonovel.md. The specification has been updated. Update README.md to reflect the
current state of the project.

First, capture the current state of README.md: spec section count, REQ count,
gate count, tool count, resource count, prompt count, and feature blurb list.

1. Check the 'Try it now' section (§2 in README) — are the install/setup
   instructions still correct against dnd5e/ and inform/? Update if needed.
2. Check feature blurbs under 'Your D&D 5e MCP server' (§3) — cross-reference
   against any new or modified REQs from the latest spec-delta output. For each
   new REQ without a corresponding blurb, draft one following the four-beat
   cadence (benefit hook, mechanics, competitive proof, closer) and the MCP
   server order arc (Setup → Knowledge → World → Action → Feedback → Safety).
3. Check 'For builders: bring your own books' (§4) — update spec section count,
   REQ count, and gate count against actual counts in holonovel.md.
4. Check the comparison table — any new competitive advantages from new REQs?
5. Update the 'Last updated' line with format: 'Last updated: YYYY-MM-DD.'
   (with period). Match any existing format if already present.

Do NOT commit. End with 'README UPDATE COMPLETE.'"

echo -e "${YELLOW}Launching README update session...${NC}"
opencode run \
  --agent build \
  --auto \
  --title "spec-wrapup-readme" \
  --dir "$PROJECT_DIR" \
  "$README_PROMPT" \
  > "$WRAP_README_OUT" 2>> "$WRAP_LOG"
README_RC=$?

if [[ $README_RC -ne 0 ]]; then
  echo -e "${RED}README update FAILED. Check $WRAP_README_OUT.${NC}"
  exit 1
fi

echo ""
echo -e "${GREEN}README update: DONE${NC}"

# Validate README as a post-session shell gate
echo -e "${YELLOW}Validating README...${NC}"
if ! npm run validate-readme 2>/dev/null; then
  echo -e "${RED}README validation FAILED.${NC}"
  exit 1
fi
echo -e "${GREEN}README validation: PASSED${NC}"
echo ""

# ── step 8: wiki update ──────────────────────────────────────────────────

echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}Step 8/10: Update Holonovel wiki${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo ""

# Pull latest wiki
if [[ -d "$WIKI_DIR/.git" ]]; then
  echo -e "${YELLOW}Pulling latest wiki...${NC}"
  git -C "$WIKI_DIR" pull --rebase 2>&1 || {
    echo -e "${RED}Wiki pull failed — check for conflicts.${NC}"
    if git -C "$WIKI_DIR" status --porcelain | grep -q '^UU\|^AA\|^DD'; then
      echo -e "${RED}Wiki has merge conflicts. Resolve manually before proceeding.${NC}"
      exit 1
    fi
    echo -e "${YELLOW}Wiki pull had issues — continuing with local state${NC}"
  }
else
  echo -e "${RED}Wiki directory not found at $WIKI_DIR. Clone it first:${NC}"
  echo "  git clone git@git.gay:flukeatzerocool/Holonovel.wiki.git $WIKI_DIR"
  exit 1
fi
echo ""

WIKI_PROMPT="Load and apply the proofreading skill. Load and apply the
technical-writing skill. You are updating the Holonovel project wiki at
.holonovel-state/wiki/. The specification (holonovel.md) and README.md have
been updated. Read all wiki pages and update them to reflect the current
project state.

Pages that likely need updates (check every page — not just these four):
- **Home.md** — 'What ships today' section: update dnd5e tool count, indexed
  section count, resource count, prompt count from the dnd5e server's current
  state. Add an Inform server section with its own tool count, resource count,
  and prompt count. Update 'What's what' line counts (spec lines, REQ count,
  gate count) from holonovel.md.
- **Spec-Contributing.md** — verify section references, gate counts, and REQ
  counts are still accurate.
- **Building-a-Server.md** — verify workflow descriptions match current spec.
  Add sections for Inform server build and ruleset-free mode.
- **Updating-a-Server.md** — verify against current spec §6.6 and §6.7.
- **All other pages** — scan every wiki page for references to spec sections,
  REQ numbers, gate counts, or tool counts. Update any that are stale.

For numeric updates, grep the current files to get exact counts. Do not
estimate. For factual updates, cite the spec section or file.

After changes, update the 'Last updated: YYYY-MM-DD.' line at the bottom of
each changed page.

Do NOT commit and do NOT push. End with 'WIKI UPDATE COMPLETE.' and list which
pages were changed."

echo -e "${YELLOW}Launching wiki update session...${NC}"
opencode run \
  --agent build \
  --auto \
  --title "spec-wrapup-wiki" \
  --dir "$PROJECT_DIR" \
  "$WIKI_PROMPT" \
  > "$WRAP_WIKI_OUT" 2>> "$WRAP_LOG"
WIKI_RC=$?

if [[ $WIKI_RC -ne 0 ]]; then
  echo -e "${RED}Wiki update FAILED. Check $WRAP_WIKI_OUT.${NC}"
  exit 1
fi

echo ""
echo -e "${GREEN}Wiki update: DONE${NC}"
echo ""

# ── step 9a: pre-commit guard (node_modules check) ───────────────────────

echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}Step 9a/10: Pre-commit guard${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo ""

if git -C "$PROJECT_DIR" diff --name-only | grep -q 'node_modules'; then
  echo -e "${RED}node_modules in diff — aborting commit. Check .gitignore.${NC}"
  exit 1
fi

# Gate on dead-data findings
if [[ "$INFORM_FINDINGS" != "0" && "$INFORM_FINDINGS" != "?" ]]; then
  echo -e "${YELLOW}Warning: Inform scan has ${INFORM_FINDINGS} finding(s) — review before commit.${NC}"
fi
if [[ "$DND5E_FINDINGS" != "0" && "$DND5E_FINDINGS" != "?" ]]; then
  echo -e "${YELLOW}Warning: Dnd5e scan has ${DND5E_FINDINGS} finding(s) — review before commit.${NC}"
fi
echo ""

# ── step 9b: commit ──────────────────────────────────────────────────────

echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}Step 9b/10: Commit all changes${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo ""

git -C "$PROJECT_DIR" add holonovel.md README.md CHANGELOG.md AGENTS.md \
  package.json tsconfig.json .markdownlint.json \
  spec/ scripts/ dnd5e/ inform/ 2>/dev/null || true

COMMIT_DATE=$(date +%Y-%m-%d)

# Build dynamic commit message from pipeline evidence
COMMIT_SUMMARY=""
if grep -q "INFORM REBUILD COMPLETE" "$WRAP_INFORM_REBUILD_OUT" 2>/dev/null; then
  COMMIT_SUMMARY="${COMMIT_SUMMARY}Inform rebuilt. "
fi
if grep -q "INFORM SCAN COMPLETE" "$WRAP_INFORM_SCAN_OUT" 2>/dev/null; then
  COMMIT_SUMMARY="${COMMIT_SUMMARY}Inform scan: ${INFORM_FINDINGS} findings. "
fi
if grep -q "REBUILD COMPLETE" "$WRAP_REBUILD_OUT" 2>/dev/null; then
  COMMIT_SUMMARY="${COMMIT_SUMMARY}Dnd5e rebuilt. "
fi
if grep -q "DND5E SCAN COMPLETE" "$WRAP_DND5E_SCAN_OUT" 2>/dev/null; then
  COMMIT_SUMMARY="${COMMIT_SUMMARY}Dnd5e scan: ${DND5E_FINDINGS} findings. "
fi
if grep -q "SYNC COMPLETE" "$INFORM_SYNC_OUT" 2>/dev/null; then
  COMMIT_SUMMARY="${COMMIT_SUMMARY}Inform synced. "
fi
if grep -q "SYNC COMPLETE" "$DND5E_SYNC_OUT" 2>/dev/null; then
  COMMIT_SUMMARY="${COMMIT_SUMMARY}Dnd5e synced. "
fi
COMMIT_SUMMARY="${COMMIT_SUMMARY}Spec audited, README and wiki refreshed."

if git -C "$PROJECT_DIR" diff --staged --quiet 2>/dev/null; then
  echo -e "${YELLOW}No changes to commit in main repo.${NC}"
else
  echo -e "${YELLOW}Committing main repo changes...${NC}"
  git -C "$PROJECT_DIR" commit -m "Push pipeline ${COMMIT_DATE}

${COMMIT_SUMMARY}"
  echo -e "${GREEN}Main repo commit: DONE${NC}"
fi

# Wiki commit
if [[ -d "$WIKI_DIR/.git" ]]; then
  git -C "$WIKI_DIR" add -A 2>/dev/null || true

  if git -C "$WIKI_DIR" diff --staged --quiet 2>/dev/null; then
    echo -e "${YELLOW}No wiki changes to commit.${NC}"
  else
    echo -e "${YELLOW}Committing wiki changes...${NC}"
    git -C "$WIKI_DIR" commit -m "Wiki refresh ${COMMIT_DATE}

Updated after push pipeline completion."
    echo -e "${GREEN}Wiki commit: DONE${NC}"
  fi
fi
echo ""

# ── step 10: push ────────────────────────────────────────────────────────

echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}Step 10/10: Push to origin${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo ""

echo -e "${YELLOW}Pushing main repo...${NC}"
git -C "$PROJECT_DIR" push origin main
echo -e "${GREEN}Main repo push: DONE${NC}"

# Post-push verification
echo -e "${YELLOW}Verifying main repo remote...${NC}"
git -C "$PROJECT_DIR" ls-remote origin HEAD >/dev/null 2>&1
echo -e "${GREEN}Remote check: OK${NC}"

if [[ -d "$WIKI_DIR/.git" ]]; then
  echo ""
  echo -e "${YELLOW}Pushing wiki...${NC}"
  git -C "$WIKI_DIR" push origin master
  echo -e "${GREEN}Wiki push: DONE${NC}"

  echo -e "${YELLOW}Verifying wiki remote...${NC}"
  git -C "$WIKI_DIR" ls-remote origin master >/dev/null 2>&1
  echo -e "${GREEN}Remote check: OK${NC}"
fi

# Tag the successful pipeline run
echo ""
echo -e "${YELLOW}Tagging pipeline run...${NC}"
git -C "$PROJECT_DIR" tag "pipeline-${TIMESTAMP}" 2>/dev/null || true
echo -e "${GREEN}Tag: pipeline-${TIMESTAMP}${NC}"
echo ""

# ── done ──────────────────────────────────────────────────────────────────

echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}Holonovel push pipeline — COMPLETE${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo ""
echo "  Spec audited. Both servers rebuilt and scanned. README and wiki refreshed."
echo "  Main repo and wiki pushed to origin."
echo ""
echo -e "${GREEN}Done.${NC}"
