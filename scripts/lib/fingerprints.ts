// fingerprints.ts — implementation fingerprint computation (REQ-313).
//
// Computes the five fingerprint components (source, config, lockfile,
// extraction, surfaces) over a server source tree.
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { createHash } from "node:crypto";
import { sha256, hashFile } from "./hash.js";

export interface Fingerprints {
  source: string;
  config: string;
  lockfile: string;
  extraction: string;
  surfaces: string;
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

function hashGenerated(serverDir: string): string {
  const gen = join(serverDir, "src", "generated");
  if (!existsSync(gen)) return "sentinel";
  try { return hashDirectory(gen); }
  catch { return "unknown"; }
}

function hashSurfaces(serverDir: string): string {
  // REQ-313b — the surfaces component hashes the sorted, concatenated list of
  // registered tool names, resource URIs, and prompt names, read from the
  // generated artifact (surface_names), never from source-file bytes.
  const artifact = join(serverDir, "tool-definitions.json");
  if (!existsSync(artifact)) return "absent";
  try {
    const parsed = JSON.parse(readFileSync(artifact, "utf-8"));
    const names = parsed?.surface_names;
    if (!names || ![names.tools, names.resources, names.prompts].every(Array.isArray)) return "absent";
    const joined = [names.tools, names.resources, names.prompts]
      .map((list: unknown[]) => list.map(String).sort().join("\n"))
      .join("\n");
    return sha256(joined);
  } catch { /* unreadable artifact: report it, never a stale hash */ return "unknown"; }
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
