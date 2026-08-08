#!/usr/bin/env bash
# spec-queue-wrapup.sh — Post-queue completion wrap-up: full audit, Inform
# server rebuild + scan, dnd5e server rebuild + scan, README/wiki update,
# commit, push.
#
# Runs after spec-queue-cycle.sh run-all exhausts the queue. This is the final
# step: validate everything, rebuild both servers from the updated spec,
# refresh documentation, and ship.
#
# Usage:
#   ./scripts/spec-queue-wrapup.sh

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

# ── step 1: full spec audit ──────────────────────────────────────────────

echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}Step 1/10: Full spec audit${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo ""

set +e
cd "$PROJECT_DIR" && npm run check
AUDIT_RC=$?
set -e

if [[ $AUDIT_RC -ne 0 ]]; then
  echo ""
  echo -e "${RED}Spec audit FAILED. Fix errors before proceeding.${NC}"
  exit 1
fi

echo ""
echo -e "${GREEN}Spec audit: PASSED${NC}"
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
(critical /警告 / info).

End with 'READTHROUGH COMPLETE. N violations found.' (N=0 means clean)."

echo -e "${YELLOW}Launching read-through session...${NC}"
mkdir -p "$PROJECT_DIR/.holonovel-state/queue-plans"
set +e
opencode run \
  --agent plan \
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

violations=$(grep -oP '\d+ violations found' "$WRAP_READTHROUGH_OUT" 2>/dev/null | grep -oP '\d+' || echo "?")
echo ""
echo -e "${GREEN}Read-through: DONE — ${violations} violation(s) found${NC}"
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

INFORM_REBUILD_PROMPT="Build the Inform MCP server from scratch in inform/ against the current
specification (holonovel.md). This is a ruleset-free build: B1=none, using the
world-model provider documentation at inform/docs_md/ (B10).

1. Build the server from provider docs: index the documentation, extract the
   kind hierarchy, property contracts, and parser command catalog.
2. Construct the world-model tools: parser command dispatch (REQ-196), CRUD
   (REQ-198), convert_source (REQ-201).
3. Construct the world-model resources: room://, thing://, world://map,
   world://kinds (REQ-202).
4. Construct the infrastructure tools and prompts per REQ-020, REQ-023.
5. Run the Inform Gauntlet — the 10 sub-workflows (I1-I10) defined in §6.6
   Inform Gauntlet. All blocking sub-workflows (I1-I6, I10) must pass.
6. Run \`npm run spec-delta -- --server inform\` and confirm the Inform server
   is in sync with the spec. If not, close the gaps.
7. Update inform/DECISIONS.md with a rebuild entry recording the spec version,
   build fingerprint, Gauntlet results, and verification results.

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

INFORM_SCAN_PROMPT="Scan the inform/ directory for dead and outdated data. This is a
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
6. Dangling cross-references in inform/DECISIONS.md — verify every cited REQ,
   test ID, and spec section reference resolves in holonovel.md.

For each finding, report: file:line, what's dead/outdated, and the suggested
fix. Separate findings by server directory (inform/).

End with 'INFORM SCAN COMPLETE. N findings.' (N is the count — N=0 means
clean, no dead data found)."

echo -e "${YELLOW}Launching Inform dead-data scan session...${NC}"
opencode run \
  --agent build \
  --auto \
  --title "spec-wrapup-inform-scan" \
  --dir "$PROJECT_DIR" \
  "$INFORM_SCAN_PROMPT" \
  > "$WRAP_INFORM_SCAN_OUT" 2>> "$WRAP_LOG"
INFORM_SCAN_RC=$?

if [[ $INFORM_SCAN_RC -ne 0 ]]; then
  echo -e "${RED}Inform scan FAILED. Check $WRAP_INFORM_SCAN_OUT.${NC}"
  exit 1
fi

findings=$(grep -oP '\d+ findings' "$WRAP_INFORM_SCAN_OUT" 2>/dev/null | grep -oP '\d+' || echo "?")
echo ""
echo -e "${GREEN}Inform scan: DONE — ${findings} finding(s)${NC}"
echo ""

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
4. Run the blocking Gauntlet sub-workflows per §6.6 exit criteria. At minimum,
   run the automated test suite and verify 0 failures. A previously-passing
   blocking sub-workflow that now fails is a defect that must be resolved.
5. Run \`npm run spec-delta -- --server dnd5e\` and confirm the server is in
   sync with the spec. If not in sync, run the holonovel-update skill to
   close remaining gaps.
6. Run \`npm run version-sync\` to align all version strings.
7. Update dnd5e/DECISIONS.md with a rebuild entry recording the spec version,
   build fingerprint, Gauntlet results (pass/fail per sub-workflow), and
   verification results.

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

DND5E_SCAN_PROMPT="Scan the dnd5e/ directory for dead and outdated data. This is a
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
6. Dangling cross-references in dnd5e/DECISIONS.md — verify every cited REQ,
   test ID, and spec section reference resolves in holonovel.md.

For each finding, report: file:line, what's dead/outdated, and the suggested
fix. Separate findings by server directory (dnd5e/).

End with 'DND5E SCAN COMPLETE. N findings.' (N is the count — N=0 means
clean, no dead data found)."

echo -e "${YELLOW}Launching dnd5e dead-data scan session...${NC}"
opencode run \
  --agent build \
  --auto \
  --title "spec-wrapup-dnd5e-scan" \
  --dir "$PROJECT_DIR" \
  "$DND5E_SCAN_PROMPT" \
  > "$WRAP_DND5E_SCAN_OUT" 2>> "$WRAP_LOG"
DND5E_SCAN_RC=$?

if [[ $DND5E_SCAN_RC -ne 0 ]]; then
  echo -e "${RED}Dnd5e scan FAILED. Check $WRAP_DND5E_SCAN_OUT.${NC}"
  exit 1
fi

findings_dnd5e=$(grep -oP '\d+ findings' "$WRAP_DND5E_SCAN_OUT" 2>/dev/null | grep -oP '\d+' || echo "?")
echo ""
echo -e "${GREEN}Dnd5e scan: DONE — ${findings_dnd5e} finding(s)${NC}"
echo ""

# ── step 6: spec-delta confirmation (both servers) ───────────────────────

echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}Step 6/10: Confirm both servers in sync with spec${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo ""

if npm run spec-delta -- --server inform --silent 2>/dev/null; then
  echo -e "${GREEN}Inform server in sync with spec.${NC}"
else
  echo -e "${YELLOW}Inform delta still present — running holonovel-update...${NC}"
  "$PROJECT_DIR/scripts/spec-queue-sync.sh" --server inform
fi

if npm run spec-delta -- --server dnd5e --silent 2>/dev/null; then
  echo -e "${GREEN}Dnd5e server in sync with spec.${NC}"
else
  echo -e "${YELLOW}Dnd5e delta still present — running holonovel-update...${NC}"
  "$PROJECT_DIR/scripts/spec-queue-sync.sh" --server dnd5e
fi
echo ""

# ── step 7: README update ────────────────────────────────────────────────

echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}Step 7/10: Update README.md${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo ""

README_PROMPT="Load and apply the proofreading skill. Read README.md and
holonovel.md. The specification has been updated through a full queue cycle.
Update README.md to reflect the current state of the project.

1. Check the 'Try it now' section (§2 in README) — are the install/setup
   instructions still correct against dnd5e/ and inform/? Update if needed.
2. Check feature blurbs under 'Your D&D 5e MCP server' (§3) — do any new REQ
   changes warrant new feature entries or updates to existing ones? Follow the
   four-beat cadence (benefit hook, mechanics, competitive proof, closer) and
   the MCP server order arc (Setup → Knowledge → World → Action → Feedback →
   Safety).
3. Check 'For builders: bring your own books' (§4) — does the spec section
   count, REQ count, or gate count need updating?
4. Check the comparison table — any new competitive advantages to add?
5. Update the 'Last updated' line at the bottom.
6. Run \`npm run validate-readme\` after changes and fix any failures.

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
echo ""

# ── step 8: wiki update ──────────────────────────────────────────────────

echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}Step 8/10: Update Holonovel wiki${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo ""

# Pull latest wiki
if [[ -d "$WIKI_DIR/.git" ]]; then
  echo -e "${YELLOW}Pulling latest wiki...${NC}"
  git -C "$WIKI_DIR" pull --rebase 2>&1 || echo -e "${YELLOW}Wiki pull had conflicts — continuing with local state${NC}"
else
  echo -e "${RED}Wiki directory not found at $WIKI_DIR. Clone it first:${NC}"
  echo "  git clone git@git.gay:flukeatzerocool/Holonovel.wiki.git $WIKI_DIR"
  exit 1
fi
echo ""

WIKI_PROMPT="Load and apply the technical-writing skill. You are updating the
Holonovel project wiki at .holonovel-state/wiki/. The specification
(holonovel.md) and README.md have been updated through a full spec queue cycle.
Read the wiki pages and update them to reflect the current
project state.

Pages that likely need updates (check each):
- **Home.md** — 'What ships today' section: update tool count, indexed section
  count, resource count, prompt count from the dnd5e server's current state.
  Add a section for the Inform server. Update 'What's what' line counts (spec
  lines, REQ count, gate count) from holonovel.md.
- **Spec-Contributing.md** — verify section references, gate counts, and REQ
  counts are still accurate.
- **Building-a-Server.md** — verify workflow descriptions match current spec.
  Add sections for Inform server build and ruleset-free mode.
- **Updating-a-Server.md** — verify against current spec §6.7.

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

# ── step 9: commit ───────────────────────────────────────────────────────

echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}Step 9/10: Commit all changes${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo ""

git -C "$PROJECT_DIR" add holonovel.md README.md SPEC-QUEUE.md CHANGELOG.md AGENTS.md \
  package.json tsconfig.json .markdownlint.json \
  spec/ scripts/ dnd5e/ inform/ 2>/dev/null || true

if git -C "$PROJECT_DIR" diff --staged --quiet 2>/dev/null; then
  echo -e "${YELLOW}No changes to commit in main repo.${NC}"
else
  echo -e "${YELLOW}Committing main repo changes...${NC}"
  git -C "$PROJECT_DIR" commit -m "Spec queue completion $(date +%Y-%m-%d)

Full queue cycle wrap-up: full spec audit, Inform and dnd5e server rebuild,
dead-data scans, README and wiki refresh."
  echo -e "${GREEN}Main repo commit: DONE${NC}"
fi

# Wiki commit
if [[ -d "$WIKI_DIR/.git" ]]; then
  git -C "$WIKI_DIR" add -A 2>/dev/null || true

  if git -C "$WIKI_DIR" diff --staged --quiet 2>/dev/null; then
    echo -e "${YELLOW}No wiki changes to commit.${NC}"
  else
    echo -e "${YELLOW}Committing wiki changes...${NC}"
    git -C "$WIKI_DIR" commit -m "Wiki refresh $(date +%Y-%m-%d)

Updated after spec queue completion cycle."
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

if [[ -d "$WIKI_DIR/.git" ]]; then
  echo ""
  echo -e "${YELLOW}Pushing wiki...${NC}"
  git -C "$WIKI_DIR" push origin master 2>/dev/null || git -C "$WIKI_DIR" push origin main
  echo -e "${GREEN}Wiki push: DONE${NC}"
fi
echo ""

# ── done ──────────────────────────────────────────────────────────────────

echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}Holonovel spec queue pipeline — COMPLETE${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo ""
echo "  Spec audited. Both servers rebuilt and scanned. README and wiki refreshed."
echo "  Main repo and wiki pushed to origin."
echo ""
echo -e "${GREEN}Done.${NC}"
