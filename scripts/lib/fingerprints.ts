// fingerprints.ts — implementation fingerprint computation (REQ-313).
//
// Computes the five fingerprint components (source, config, lockfile,
// extraction, surfaces) over a server source tree.
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { createHash } from "node:crypto";

export interface Fingerprints {
  source: string;
  config: string;
  lockfile: string;
  extraction: string;
  surfaces: string;
}

function sha256(data: Buffer | string): string {
  return createHash("sha256").update(data).digest("hex");
}

function hashDirectory(dir: string, extensions?: string[]): string {
  const files: string[] = [];
  function walk(d: string) {
    for (const entry of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
        walk(p);
      } else if (entry.isFile()) {
        if (extensions && !extensions.some(ext => entry.name.endsWith(ext))) continue;
        files.push(p);
      }
    }
  }
  walk(dir);
  files.sort();
  const h = createHash("sha256");
  for (const f of files) {
    try {
      h.update(relative(dir, f));
      h.update(readFileSync(f));
    } catch { /* skip unreadable */ }
  }
  return h.digest("hex");
}

function hashFile(path: string, fallback: string = "unavailable"): string {
  try { return sha256(readFileSync(path)); }
  catch { return fallback; }
}

function hashGenerated(serverDir: string): string {
  const gen = join(serverDir, "src", "generated");
  if (!existsSync(gen)) return "sentinel";
  try { return hashDirectory(gen); }
  catch { return "unknown"; }
}

function hashSurfaces(serverDir: string): string {
  const index = join(serverDir, "src", "index.ts");
  const state = join(serverDir, "src", "state.ts");
  const h = createHash("sha256");
  if (existsSync(index)) h.update(readFileSync(index));
  const statePath = existsSync(state) ? state : join(serverDir, "src", "core", "state.ts");
  if (existsSync(statePath)) h.update(readFileSync(statePath));
  return h.digest("hex");
}

export function computeFingerprints(serverDir: string): Fingerprints {
  return {
    source: hashDirectory(join(serverDir, "src"), [".ts"]),
    config: hashFile(join(serverDir, "package.json")) + hashFile(join(serverDir, "tsconfig.json"), ""),
    lockfile: hashFile(join(serverDir, "package-lock.json")),
    extraction: hashGenerated(serverDir),
    surfaces: hashSurfaces(serverDir),
  };
}
