// Portable data-directory resolution (REQ-613) with the in-work-tree signal
// for REQ-397.
// Order: TTRPG_DATA_DIR → an existing legacy `<install>/.holonovel-state` →
// the per-OS user-data location. The default never resolves inside the install
// tree; an existing legacy directory is honored, never migrated or deleted.

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

export interface DataDirOptions {
  env?: NodeJS.ProcessEnv;
  platform?: NodeJS.Platform;
  homedir?: string;
  exists?: (candidate: string) => boolean;
  mkdir?: (candidate: string) => void;
  /** REQ-397 — does this candidate exist as a git marker (directory or file)? */
  isGitMarker?: (candidate: string) => boolean;
}

export type StateDirSource = "env" | "legacy" | "user-data";

// REQ-397 — the resolved state location plus whether an ordinary git operation
// on the surrounding work tree can delete or revert it. `locateStateDir` never
// writes; `resolveDataDir` keeps its mkdir behavior for existing callers.
export interface StateDirLocation {
  dir: string;
  source: StateDirSource;
  inGitWorkTree: boolean;
  workTreeRoot: string | null;
}

const LEGACY_DIR = ".holonovel-state";

function defaultExists(candidate: string): boolean {
  try {
    return fs.statSync(candidate).isDirectory();
  } catch {
    // Missing or inaccessible path: treat it as absent.
    return false;
  }
}

// A linked worktree or submodule marks its git root with a `.git` *file*, so
// the probe must accept a non-directory.
function defaultIsGitMarker(candidate: string): boolean {
  try {
    fs.lstatSync(candidate);
    return true;
  } catch {
    // Absent marker: this ancestor is not a work-tree root.
    return false;
  }
}

function findWorkTreeRoot(start: string, isGitMarker: (candidate: string) => boolean): string | null {
  let current = path.resolve(start);
  for (;;) {
    if (isGitMarker(path.join(current, ".git"))) return current;
    const parent = path.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}

function defaultMkdir(candidate: string): void {
  fs.mkdirSync(candidate, { recursive: true, mode: 0o700 });
}

function userDataDir(options: Required<Pick<DataDirOptions, "env" | "platform" | "homedir">>): string {
  const { env, platform, homedir } = options;
  if (platform === "win32") {
    const base = env.LOCALAPPDATA?.trim() || env.APPDATA?.trim() || path.join(homedir, "AppData", "Local");
    return path.join(base, "holonovel");
  }
  if (platform === "darwin") {
    return path.join(homedir, "Library", "Application Support", "holonovel");
  }
  const xdg = env.XDG_DATA_HOME?.trim();
  return path.join(xdg || path.join(homedir, ".local", "share"), "holonovel");
}

function describe(dir: string, source: StateDirSource, isGitMarker: (candidate: string) => boolean): StateDirLocation {
  const workTreeRoot = findWorkTreeRoot(dir, isGitMarker);
  return { dir, source, inGitWorkTree: workTreeRoot !== null, workTreeRoot };
}

export function locateStateDir(packageRoot: string, options: DataDirOptions = {}): StateDirLocation {
  const env = options.env ?? process.env;
  const platform = options.platform ?? process.platform;
  const homedir = options.homedir ?? os.homedir();
  const exists = options.exists ?? defaultExists;
  const isGitMarker = options.isGitMarker ?? defaultIsGitMarker;

  const explicit = env.TTRPG_DATA_DIR?.trim();
  if (explicit) return describe(path.resolve(explicit), "env", isGitMarker);

  const legacy = path.join(path.resolve(packageRoot), LEGACY_DIR);
  if (exists(legacy)) return describe(legacy, "legacy", isGitMarker);

  return describe(userDataDir({ env, platform, homedir }), "user-data", isGitMarker);
}

export function resolveDataDir(packageRoot: string, options: DataDirOptions = {}): string {
  const exists = options.exists ?? defaultExists;
  const mkdir = options.mkdir ?? defaultMkdir;
  const location = locateStateDir(packageRoot, options);
  // The legacy directory is honored where it sits; only the explicit and
  // per-OS locations are created on demand (REQ-613).
  if (location.source !== "legacy" && !exists(location.dir)) mkdir(location.dir);
  return location.dir;
}


// REQ-621 — the exchange inbox is the only artifact-install source. An
// explicit TTRPG_ARTIFACT_INBOX wins; otherwise it sits under the data
// directory so it travels with portable user state (REQ-613).
export function resolveInboxDir(dataDir: string, env: NodeJS.ProcessEnv = process.env): string {
  const explicit = env.TTRPG_ARTIFACT_INBOX?.trim();
  return explicit ? path.resolve(explicit) : path.join(dataDir, "inbox");
}

// REQ-621 — resolve `candidate` under `base`, rejecting anything that escapes
// it. Returns null for an empty relative path (the base itself), a `..`
// escape, or an absolute result. Shared by the inbox source check and every
// artifact install/remove destination so a crafted slug cannot traverse out.
export function resolveWithin(base: string, candidate: string): string | null {
  const root = path.resolve(base);
  const target = path.resolve(root, candidate);
  const rel = path.relative(root, target);
  // Reject only a true parent escape. A file merely named `..notes.md` is a
  // legitimate relative path; `path.isAbsolute` catches drive-letter/rooted
  // results on every platform.
  if (!rel || rel === ".." || rel.startsWith(".." + path.sep) || path.isAbsolute(rel)) return null;
  return target;
}

// REQ-620/REQ-621 — the artifact slug grammar. Mirrors the create/rename
// sanitizer (`[^a-z0-9]+` → `-`, trimmed) so existing slugs pass and a
// path-bearing slug (`..`, `/`, `\`) is refused before any filesystem write.
const SAFE_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isSafeSlug(slug: unknown): slug is string {
  return typeof slug === "string" && SAFE_SLUG.test(slug);
}
