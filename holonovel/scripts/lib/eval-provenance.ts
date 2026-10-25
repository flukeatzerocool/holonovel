// eval-provenance.ts — pin a Holosuite report to the tree it tested.
//
// Git fields are read from the server's checkout; the spec hash is the SHA-256
// of the assembled `holonovel.md`, matching `scripts/update-server.ts` and
// `scripts/push-pipeline.sh`. Unavailable values are null, never invented.
// Exit codes: n/a (library).
//
// REQ citations: none — informational evaluation-harness support.

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

/** Commit under test, or null outside a git checkout. */
export function gitSha(dir: string): string | null {
  try {
    return execFileSync("git", ["-C", dir, "rev-parse", "HEAD"], { encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    // Not a git checkout — provenance field stays null rather than guessed.
    return null;
  }
}

/** Whether the tested tree has uncommitted changes, or null outside git. */
export function gitDirty(dir: string): boolean | null {
  try {
    return execFileSync("git", ["-C", dir, "status", "--porcelain"], { encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] }).trim().length > 0;
  } catch {
    return null;
  }
}

/** SHA-256 of the assembled spec, or null when it is unreadable. */
export function specContentHash(path: string): string | null {
  try {
    return createHash("sha256").update(readFileSync(path)).digest("hex");
  } catch {
    return null;
  }
}
