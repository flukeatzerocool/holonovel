// Portable data-directory resolution (REQ-613).
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

export function resolveDataDir(packageRoot: string, options: DataDirOptions = {}): string {
  const env = options.env ?? process.env;
  const platform = options.platform ?? process.platform;
  const homedir = options.homedir ?? os.homedir();
  const exists = options.exists ?? defaultExists;
  const mkdir = options.mkdir ?? defaultMkdir;

  const explicit = env.TTRPG_DATA_DIR?.trim();
  if (explicit) {
    const resolved = path.resolve(explicit);
    if (!exists(resolved)) mkdir(resolved);
    return resolved;
  }

  const legacy = path.join(path.resolve(packageRoot), LEGACY_DIR);
  if (exists(legacy)) return legacy;

  const target = userDataDir({ env, platform, homedir });
  if (!exists(target)) mkdir(target);
  return target;
}
