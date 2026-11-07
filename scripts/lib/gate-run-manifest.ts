// gate-run-manifest.ts — record which gate suite ran against which tree.
//
// Replaces the HOLONOVEL_PIPELINE_GATES / HOLONOVEL_PIPELINE_STRICT environment
// variables. Env vars are process-local and leave no trace after the fact; this
// manifest is inspectable and fails safe — a failed or partial run writes
// nothing, so the hooks fall back to the full set.
//
// The signature is the index tree (`git write-tree`) plus a hash of the
// unstaged and untracked paths. That survives the commit boundary: the tree the
// pre-commit hook tested is the tree HEAD points at a moment later, so a later
// hook can still trust the run. Any worktree edit after the run invalidates it.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..", "..");
export const GATE_RUN_PATH = join(ROOT, ".holonovel-state", "gate-run.json");

export type Suite = "fast" | "full";

export interface GateRun {
  schema_version: 1;
  suite: Suite;
  head: string;
  tree: string;
  dirty_hash: string;
  started: string;
  finished: string;
  status: "pass" | "fail";
  // True when the publication gates (pending-update, propagation, harnesses)
  // also ran on this tree. The pipeline sets it; a plain check does not.
  publish: boolean;
}

export interface Signature {
  head: string;
  tree: string;
  dirtyHash: string;
}

function git(args: string[]): string {
  return execFileSync("git", args, {
    cwd: ROOT,
    encoding: "utf-8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();
}

export function signature(): Signature {
  let head = "";
  try {
    head = git(["rev-parse", "HEAD"]);
  } catch {
    // An unborn branch has no HEAD; the tree hash still identifies the index.
    head = "";
  }
  const tree = git(["write-tree"]);
  // Content, not just names: editing an already-modified (or untracked) file
  // must invalidate a prior run, which a path list alone would miss.
  const unstaged = git(["diff"]);
  const untracked = git(["ls-files", "--others", "--exclude-standard"]);
  const hash = createHash("sha256").update(`${unstaged}\n--\n${untracked}`);
  for (const path of untracked.split("\n").filter(Boolean)) {
    try {
      const bytes = readFileSync(join(ROOT, path));
      hash.update(createHash("sha256").update(bytes).digest("hex"));
    } catch {
      // A file that vanished between listing and reading is itself a change;
      // record its absence so the signature still differs.
      hash.update("<unreadable>");
    }
  }
  const dirtyHash = hash.digest("hex");
  return { head, tree, dirtyHash };
}

export function writeGateRun(
  suite: Suite,
  started: string,
  finished: string,
  status: "pass" | "fail",
  publish = false,
): void {
  const sig = signature();
  const record: GateRun = {
    schema_version: 1,
    suite,
    head: sig.head,
    tree: sig.tree,
    dirty_hash: sig.dirtyHash,
    started,
    finished,
    status,
    publish,
  };
  mkdirSync(join(ROOT, ".holonovel-state"), { recursive: true });
  writeFileSync(GATE_RUN_PATH, `${JSON.stringify(record, null, 2)}\n`);
}

export function readGateRun(): GateRun | null {
  if (!existsSync(GATE_RUN_PATH)) return null;
  try {
    return JSON.parse(readFileSync(GATE_RUN_PATH, "utf-8")) as GateRun;
  } catch {
    // Corrupt state is treated as absent so the hooks run the full set.
    return null;
  }
}

export function gateRunMatches(suite: Suite): boolean {
  const record = readGateRun();
  if (!record || record.status !== "pass" || record.suite !== suite) return false;
  const sig = signature();
  return record.tree === sig.tree && record.dirty_hash === sig.dirtyHash;
}
