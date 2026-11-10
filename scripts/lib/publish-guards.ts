// publish-guards.ts — pure staging guards shared by the publish pipeline and
// session close.
//
// Purpose: a whole-tree `git add -A` must never stage a secret, a build or
// runtime artifact, an unstageable leftover, or commit without a git identity.
// The detectors are pure so they can be tested without staging a real tree;
// `collectStagedGuards` is the thin git-reading wrapper.
//
// No exit codes: library module.

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { locateStateDir } from "../../holonovel/src/core/data-dir.js";

/** Paths that must never be committed even under whole-tree staging. */
export const DENY_PATTERNS: RegExp[] = [
  /(^|\/)node_modules\//,
  /(^|\/)dist\//,
  /^\.holonovel-state\//,
  /(^|\/)config\.local\.json$/,
  /(^|\/)\.env($|\.)/,
  /\.(sqlite|sqlite-wal|sqlite-shm|key|pem|p12|pfx)$/,
  /(^|\/)id_rsa(\.pub)?$/,
  /\.vector-store.*\.json$/,
];

/** Secret shapes. A match is reported as `path:line [kind]`; the value is
 * never printed, logged, or returned. */
export const SECRET_PATTERNS: Array<{ kind: string; re: RegExp }> = [
  { kind: "openai-key", re: /sk-[A-Za-z0-9]{20,}/ },
  { kind: "aws-key", re: /AKIA[0-9A-Z]{16}/ },
  { kind: "github-token", re: /ghp_[A-Za-z0-9]{30,}/ },
  { kind: "slack-token", re: /xox[baprs]-[A-Za-z0-9-]{10,}/ },
  { kind: "private-key", re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  {
    kind: "key-assignment",
    re: /api[_-]?key\s*[:=]\s*["']?[A-Za-z0-9]{16,}/,
  },
  {
    kind: "password-assignment",
    re: /password\s*[:=]\s*["'][^"']+["']/,
  },
  {
    kind: "env-key",
    re: /HOLONOVEL_[A-Z_]+_API_KEY\s*=\s*\S+/,
  },
];

/** Staged paths that match the deny-list. */
export function deniedPaths(paths: string[]): string[] {
  return paths.filter((path) => DENY_PATTERNS.some((pattern) => pattern.test(path)));
}

// ── REQ-396/REQ-397 — deploy state preservation ────────────────────────────

export type StatePathReason = "tracked" | "untracked" | "ignored";

export interface StatePathFinding {
  path: string;
  reason: StatePathReason;
}

/** Candidate state locations for a deploy clone: each server's resolved data
 * directory plus the explicit env overrides. Pure path arithmetic; existence
 * is decided by the caller. */
export function deployStateCandidates(
  deployDir: string,
  servers: string[],
  env: NodeJS.ProcessEnv = process.env,
): string[] {
  const candidates: string[] = [];
  for (const server of servers) candidates.push(locateStateDir(join(deployDir, server)).dir);
  for (const key of ["TTRPG_DATA_DIR", "TTRPG_RULESET_DIRS"] as const) {
    const value = env[key]?.trim();
    if (value) candidates.push(resolve(value));
  }
  return candidates;
}

/**
 * Classify each existing candidate by what a `git checkout -- .` or
 * `git clean -fd` would do to it: tracked paths are reverted, untracked
 * non-ignored paths are deleted, ignored paths are left alone.
 *
 * `git` takes an argument list and returns stdout, or null when the command
 * fails (a path outside the repository, for example).
 */
export function classifyStatePaths(
  root: string,
  candidates: string[],
  git: (args: string[]) => string | null,
  exists: (candidate: string) => boolean = existsSync,
): StatePathFinding[] {
  const resolvedRoot = resolve(root);
  const findings: StatePathFinding[] = [];
  const seen = new Set<string>();
  for (const candidate of candidates) {
    const resolved = resolve(candidate);
    const rel = relative(resolvedRoot, resolved);
    if (!rel || rel.startsWith("..") || resolve(resolvedRoot, rel) !== resolved) continue;
    if (seen.has(resolved) || !exists(resolved)) continue;
    seen.add(resolved);
    if (git(["ls-files", "--error-unmatch", "--", rel]) !== null) {
      findings.push({ path: resolved, reason: "tracked" });
      continue;
    }
    const status = git(["status", "--porcelain", "--ignored=no", "--", rel]) ?? "";
    findings.push({ path: resolved, reason: status.trim() ? "untracked" : "ignored" });
  }
  return findings;
}

/** Porcelain lines that are not a fully staged entry (`M  path`, `A  path`). */
export function leftovers(porcelain: string): string[] {
  return porcelain
    .split("\n")
    .filter((line) => line.length > 0)
    .filter((line) => !/^[MARCD] /.test(line));
}

export function identityMissing(name: string, email: string): boolean {
  return name.trim() === "" || email.trim() === "";
}

export interface SecretFinding {
  path: string;
  line: number;
  kind: string;
}

/** Added lines in a unified diff that match a secret shape. */
export function scanAddedLines(diff: string): SecretFinding[] {
  const findings: SecretFinding[] = [];
  let path = "";
  let lineNumber = 0;
  for (const line of diff.split("\n")) {
    if (line.startsWith("+++ b/")) {
      path = line.slice(6);
      continue;
    }
    const hunk = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(line);
    if (hunk) {
      lineNumber = Number(hunk[1]);
      continue;
    }
    if (!line.startsWith("+") || line.startsWith("+++")) continue;
    const added = line.slice(1);
    for (const { kind, re } of SECRET_PATTERNS) {
      re.lastIndex = 0;
      if (re.test(added)) {
        findings.push({ path, line: lineNumber, kind });
        break;
      }
    }
    lineNumber++;
  }
  return findings;
}

export interface StagedGuardResult {
  problems: string[];
  secrets: string[];
  denied: string[];
  leftovers: string[];
  identityMissing: boolean;
}

/**
 * Read the staged tree and apply every guard. `root` is the repository root.
 * A git read failure is itself a problem: a guard that cannot see the tree
 * must not report it clean.
 */
export function collectStagedGuards(root: string): StagedGuardResult {
  const git = (args: string[]): string => {
    // Lazy import keeps the pure detectors testable without node:child_process
    // in the test fixture.
    return execFileSync("git", args, {
      cwd: root,
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  };

  let files: string[] = [];
  let diff = "";
  let porcelain = "";
  let name = "";
  let email = "";
  const problems: string[] = [];
  try {
    files = git(["diff", "--cached", "--name-only", "-z"]).split("\0").filter(Boolean);
    diff = git(["diff", "--cached", "--unified=0", "--no-color", "--diff-filter=ACMR"]);
    porcelain = git(["status", "--porcelain"]);
  } catch (error) {
    problems.push(`cannot read the staged tree: ${(error as Error).message}`);
  }
  try {
    name = git(["config", "user.name"]).trim();
    email = git(["config", "user.email"]).trim();
  } catch {
    // Missing identity is handled as a problem below; keep reading the tree.
  }

  const denied = deniedPaths(files);
  const left = leftovers(porcelain);
  const secretFindings = scanAddedLines(diff);
  const secrets = secretFindings.map(
    (finding) => `${finding.path}:${finding.line} [${finding.kind}]`,
  );
  const noIdentity = identityMissing(name, email);

  if (denied.length > 0) {
    problems.push(`deny-listed path staged: ${denied.join(", ")}`);
  }
  if (left.length > 0) {
    problems.push(`staging incomplete (path would not be committed): ${left.join(", ")}`);
  }
  if (secrets.length > 0) {
    problems.push(`secret-pattern match: ${secrets.join(", ")}`);
  }
  if (noIdentity) {
    problems.push("git user.name/user.email not configured");
  }

  return { problems, secrets, denied, leftovers: left, identityMissing: noIdentity };
}
