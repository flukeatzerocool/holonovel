// spec-copy.ts — compare each server's embedded spec copy with the assembled
// spec. Pure filesystem reads; no writes, no git.
//
// `holonovel/holonovel.md` is generated, not tracked (the repo-root
// `holonovel.md` is the single tracked copy). This comparison is what keeps the
// untracked copy honest: `check-spec-copy` (full gate) and `prepare-package`
// (pack time) both rest on it.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type SpecCopyReason = "missing" | "diverged";

export interface SpecCopyFinding {
  path: string;
  reason: SpecCopyReason;
}

/** True when the assembled spec exists at the repository root. */
export function assembledSpecExists(root: string): boolean {
  return existsSync(join(root, "holonovel.md"));
}

/**
 * Report every server copy that is absent or differs from the assembled spec.
 * A missing assembled spec is the caller's precondition failure, not a finding.
 */
export function specCopyFindings(root: string, servers: string[]): SpecCopyFinding[] {
  const findings: SpecCopyFinding[] = [];
  const source = join(root, "holonovel.md");
  if (!existsSync(source)) return findings;
  const expected = readFileSync(source);
  for (const server of servers) {
    const target = join(root, server, "holonovel.md");
    if (!existsSync(target)) findings.push({ path: target, reason: "missing" });
    else if (!readFileSync(target).equals(expected)) findings.push({ path: target, reason: "diverged" });
  }
  return findings;
}
