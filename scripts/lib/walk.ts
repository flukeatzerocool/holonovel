// walk.ts — shared recursive file walker for script tooling.
//
// Skips build/vendor trees and returns files whose name ends with `ext`
// (an empty `ext` matches every file). An unreadable or missing directory
// contributes no files.

import { readdirSync } from "node:fs";
import { join } from "node:path";

const SKIP_DIRS = new Set(["node_modules", "dist", ".git"]);

export function walkFiles(dir: string, ext: string): string[] {
  const out: string[] = [];
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    // Missing or unreadable directory — nothing to walk.
    return out;
  }
  for (const e of entries) {
    if (SKIP_DIRS.has(e.name)) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...walkFiles(p, ext));
    else if (e.isFile() && e.name.endsWith(ext)) out.push(p);
  }
  return out;
}

export function walkTsFiles(dir: string): string[] {
  return walkFiles(dir, ".ts");
}
