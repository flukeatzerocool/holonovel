// workflow-hygiene.ts — pure detectors for GitHub Actions job hygiene.
//
// Guards two demonstrated CI/local divergences (2026-10-31):
//   1. A job that runs a gate on a default depth-1 checkout. `test:spec-tooling`
//      derives a comparison ref from `holonovel.md` history, so a shallow clone
//      has no ancestor and the assertion fails on a real delta it cannot see.
//   2. A job that runs the gate before `npm ci` in `holonovel/`: the gate boots
//      the server (`check-tool-definitions-sync`), which needs the server's
//      node_modules, and crashes with ERR_MODULE_NOT_FOUND.
//
// The detectors are pure over a job block so they can be self-tested.
// Exit codes: n/a (library).

/** A gate command must start a step's command, not be mentioned in prose. */
const GATE_START =
  /^(?:npm run (?:check|check:fast|validate)\b|(?:npx |node --import tsx )?tsx scripts\/test-spec-tooling\.ts\b)/;

/** True when this line is a step command that invokes a gate. */
function isGateLine(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length === 0 || trimmed.startsWith("#")) return false;
  const run = /^-?\s*run:\s*(.*)$/.exec(trimmed);
  // A `run:` line carries its command inline; a multi-line run body is a bare
  // command line. Either way the gate token must *start* the command, so an
  // `echo "npm run check ..."` mention does not count.
  return GATE_START.test(run ? run[1]! : trimmed);
}

/** Server dependency install: a `npm ci` step scoped to the server directory. */
const SERVER_DIR = /^\s+working-directory:\s*["']?holonovel["']?\s*$/;
const NPM_CI = /^\s+run:\s*npm ci\b/;

export interface ActionPin {
  name: string;
  ref: string;
  sha: boolean;
  major: number | null;
}

/**
 * Parse one `uses:` line. A pinned action is either `owner/name@vN` (mutable
 * major) or `owner/name@<40-hex> # vN.x.y` (immutable). The version comment is
 * the only place a SHA pin names its major, so a SHA without one is unpinned
 * for the Node-runtime rule.
 */
export function parseActionPin(line: string): ActionPin | null {
  const uses = /^\s*-?\s*uses:\s*(\S+)/.exec(line);
  if (!uses) return null;
  const ref = uses[1]!;
  const at = ref.lastIndexOf("@");
  if (at <= 0) return null;
  const name = ref.slice(0, at);
  const version = ref.slice(at + 1);
  const sha = /^[0-9a-f]{40}$/.test(version);
  const comment = /#\s*v(\d+)(?:\.\d+)*/.exec(line);
  const major = sha
    ? comment
      ? Number(comment[1])
      : null
    : /^v?(\d+)/.test(version)
      ? Number(version.replace(/^v/, "").split(".")[0])
      : null;
  return { name, ref, sha, major };
}

/**
 * Check one job block (the YAML lines from the job header up to the next job).
 * Returns human-readable findings; an empty array means the job is clean.
 */
export function jobHygiene(rel: string, jobName: string, block: string): string[] {
  const issues: string[] = [];
  const lines = block.split("\n");

  // A gate line is a command line naming a gate, or a wrapper script name.
  // Comment lines are ignored so a documenting comment cannot trip the rule.
  const gateIndex = lines.findIndex(isGateLine);
  if (gateIndex < 0) return issues;

  if (!/^\s+fetch-depth:\s*["']?0["']?\s*$/m.test(block)) {
    issues.push(
      `${rel}: job '${jobName}' runs a gate command without a full-history checkout; ` +
        `add 'with: fetch-depth: 0' to its actions/checkout step (history-dependent gates read git history)`,
    );
  }

  // The gate boots the server for check-tool-definitions-sync, so the server
  // dependencies must be installed before the gate step, not after it.
  const depsIndex = lines.findIndex(
    (line, i) =>
      i < gateIndex &&
      SERVER_DIR.test(line) &&
      lines.slice(i + 1, gateIndex).some((candidate) => NPM_CI.test(candidate)),
  );
  if (depsIndex < 0) {
    issues.push(
      `${rel}: job '${jobName}' runs the gate before installing server dependencies; ` +
        `add a 'npm ci' step with 'working-directory: holonovel' before the gate`,
    );
  }

  return issues;
}

export interface CiStep {
  job: string;
  name: string | null;
  run: string;
}

/**
 * Parse a workflow's `run:` steps with their job and step name. Minimal YAML:
 * jobs are the two-space keys under `jobs:`, a step starts at a six-space list
 * item, and a `run: |` block absorbs the following indented lines.
 */
export function parseCiSteps(workflowText: string): CiStep[] {
  const steps: CiStep[] = [];
  let job = "?";
  let inJobs = false;
  let pendingName: string | null = null;
  let blockStep: CiStep | null = null;
  let blockIndent = -1;

  for (const line of workflowText.split("\n")) {
    if (/^jobs:\s*$/.test(line)) { inJobs = true; continue; }
    if (/^\S/.test(line)) { inJobs = false; blockStep = null; blockIndent = -1; continue; }
    if (!inJobs) continue;
    if (blockStep) {
      const indent = line.length - line.trimStart().length;
      if (line.trim() === "" || indent > blockIndent) {
        if (line.trim() !== "") blockStep.run += `\n${line.trim()}`;
        continue;
      }
      blockStep = null;
      blockIndent = -1;
    }
    const jobMatch = line.match(/^ {2}([A-Za-z0-9_-]+):\s*$/);
    if (jobMatch) { job = jobMatch[1]!; pendingName = null; continue; }
    const item = line.match(/^ {6}- (name|uses|run):\s*(.*)$/);
    if (item) {
      const [, field, value] = item;
      pendingName = field === "name" ? value!.trim() : null;
      if (field === "run") {
        const step: CiStep = { job, name: null, run: value!.trim() };
        steps.push(step);
        if (value!.trim() === "|" || value!.trim() === ">") { step.run = ""; blockStep = step; blockIndent = 6; }
      }
      continue;
    }
    const cont = line.match(/^ {8}(name|run):\s*(.*)$/);
    if (cont) {
      if (cont[1] === "name") { pendingName = cont[2]!.trim(); continue; }
      const step: CiStep = { job, name: pendingName, run: cont[2]!.trim() };
      steps.push(step);
      if (step.run === "|" || step.run === ">") { step.run = ""; blockStep = step; blockIndent = 8; }
    }
  }
  return steps.filter((s) => s.run !== "");
}

/**
 * Reconcile every `run:` step against the manifest, setup/build-tool classes,
 * and the AGENTS.md CI-only table. Returns findings for an unclassified step or
 * a stale table row; an empty array means the split is documented and current.
 */
export function reconcileCiSteps(
  workflowText: string,
  agentsText: string,
  manifestCommands: ReadonlySet<string>,
): string[] {
  const issues: string[] = [];
  const section = agentsText.slice(agentsText.indexOf("## CI-only checks"));
  const documented = new Set<string>();
  for (const line of section.split("\n")) {
    const m = line.match(/^\|\s*`([^`]+)`\s*\|/);
    if (m) documented.add(m[1]!);
  }
  const seen = new Set<string>();
  for (const step of parseCiSteps(workflowText)) {
    const key = `${step.job}/${step.name ?? step.run}`;
    seen.add(key);
    if (/^npm ci\b/.test(step.run) || /^npm run assemble\b/.test(step.run)) continue;
    if (/^npm run check(?::fast)?$/.test(step.run)) continue; // the manifest runners
    if (manifestCommands.has(step.run)) continue;
    if (documented.has(key)) continue;
    issues.push(`.github/workflows/ci.yml: step '${key}' runs '${step.run}' outside the gate manifest and is not in AGENTS.md § CI-only checks`);
  }
  for (const key of documented) {
    if (!seen.has(key)) issues.push(`AGENTS.md § CI-only checks names '${key}' but no ci.yml step matches it`);
  }
  return issues;
}
