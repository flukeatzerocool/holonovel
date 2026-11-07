#!/usr/bin/env npx tsx
/**
 * preflight.ts — publication preconditions, checked before any file write. [build tool]
 *
 * Exit codes: n/a (module imported by scripts/publish/run.ts; the caller owns
 * the process exit code).
 */
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { sameRemote } from "../lib/remote-url.js";
import { identityMissing } from "../lib/publish-guards.js";

export interface PreflightOptions {
  root: string;
  deployDir: string;
  noPush: boolean;
  yes: boolean;
  allowUntracked: boolean;
  allowMissingDeploy: boolean;
}

export interface PreflightResult {
  problems: string[];
  warnings: string[];
}

function git(cwd: string, args: string[]): string {
  return execFileSync("git", args, {
    cwd,
    encoding: "utf-8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();
}

function tryGit(cwd: string, args: string[]): string | null {
  try {
    return git(cwd, args);
  } catch {
    return null;
  }
}

export function runPreflight(options: PreflightOptions): PreflightResult {
  const problems: string[] = [];
  const warnings: string[] = [];
  const { root, deployDir } = options;

  const branch = tryGit(root, ["symbolic-ref", "--short", "-q", "HEAD"]) ?? "";
  if (branch !== "main") {
    problems.push(`refusing to publish from '${branch || "detached HEAD"}': switch to main first`);
  }

  const identityName = tryGit(root, ["config", "user.name"]) ?? "";
  const identityEmail = tryGit(root, ["config", "user.email"]) ?? "";
  if (identityMissing(identityName, identityEmail)) {
    problems.push("git user.name/user.email not configured — set them before publishing");
  }

  const staged = tryGit(root, ["diff", "--cached", "--name-only"]) ?? "";
  if (staged) {
    problems.push("working tree has staged changes: commit or unstage them first");
  }

  const untracked = (tryGit(root, ["ls-files", "--others", "--exclude-standard"]) ?? "")
    .split("\n")
    .filter(Boolean)
    .filter((path) => !path.startsWith(".holonovel-state/wiki/"));
  if (untracked.length > 0) {
    if (options.allowUntracked) {
      warnings.push(`--allow-untracked: ${untracked.length} untracked path(s) will be staged`);
    } else {
      problems.push(
        `untracked files in the commit surface (${untracked.length}): ${untracked.slice(0, 5).join(", ")}` +
          (untracked.length > 5 ? " …" : ""),
      );
    }
  }

  if (!options.noPush) {
    if (!options.yes && !process.stdin.isTTY) {
      problems.push("non-interactive stdin without --yes: refusing to guess");
    }

    if (!existsSync(join(deployDir, ".git"))) {
      if (!options.allowMissingDeploy) {
        problems.push(`deploy clone not found at ${deployDir} (REQ-418); pass --allow-missing-deploy to skip`);
      } else {
        warnings.push(`deploy clone not found at ${deployDir} — skipping (--allow-missing-deploy)`);
      }
    } else {
      const deployBranch = tryGit(deployDir, ["symbolic-ref", "--short", "-q", "HEAD"]) ?? "";
      if (deployBranch !== "main") {
        problems.push(`deploy clone is on '${deployBranch || "detached HEAD"}', not main (REQ-418)`);
      }
      const workspaceRemote = tryGit(root, ["remote", "get-url", "origin"]) ?? "";
      const deployRemote = tryGit(deployDir, ["remote", "get-url", "origin"]) ?? "";
      if (!workspaceRemote || !deployRemote || !sameRemote(workspaceRemote, deployRemote)) {
        problems.push(
          `deploy clone origin '${deployRemote || "<none>"}' does not match the publication remote '${workspaceRemote || "<none>"}' (REQ-418)`,
        );
      }
      if (deployDir && tryGit(deployDir, ["rev-parse", "--show-toplevel"]) === tryGit(root, ["rev-parse", "--show-toplevel"])) {
        problems.push("HOLONOVEL_DEPLOY_DIR resolves to the workspace root (REQ-418)");
      }
    }
  }

  if (!existsSync(join(root, ".holonovel-state", "wiki", ".git"))) {
    warnings.push("wiki clone not found at .holonovel-state/wiki — wiki steps will be skipped");
  }

  return { problems, warnings };
}
