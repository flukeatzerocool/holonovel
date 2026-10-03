// phase-map-hash.ts — build-phase-map content hash (REQ-278).
//
// The map carries a SHA-256 of the concatenated, normalized content of the
// spec source files it references. `scripts/assemble.ts` writes it; the
// `validate` gate recomputes and warns when it is stale. The map file itself
// is excluded from the hashed set (no self-reference).

import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { sha256 } from "./hash.js";

const ROOT = join(import.meta.dirname, "..", "..");
const SPEC_DIR = join(ROOT, "spec");
export const PHASE_MAP_PATH = join(SPEC_DIR, "build-phase-map.md");

// Canonical spec sources referenced by the map (keep in step with
// scripts/assemble.ts).
const SPEC_FILES = [
  "01-foundations.md",
  "01a-constitution.md",
  "02-requirements.md",
  "03-build.md",
  "04-runtime.md",
  "05-verification.md",
  "06-artifacts.md",
  "07-independent.md",
  "08-synthesis.md",
  "appendices-reference.md",
  "appendices-fixtures.md",
  "appendices-licenses.md",
  "appendices-runbooks.md",
];

const HASH_RE = /<!-- content hash: ([0-9a-f]{64}|<sha256>) -->/;

export function computeSpecContentHash(): string {
  const parts: string[] = [];
  for (const f of SPEC_FILES) {
    const p = join(SPEC_DIR, f);
    const text = existsSync(p) ? readFileSync(p, "utf-8") : "";
    parts.push(text.replace(/\r\n/g, "\n").replace(/\n+$/, ""));
  }
  return sha256(parts.join("\n\n---\n\n"));
}

export function readPhaseMapHash(): string | null {
  if (!existsSync(PHASE_MAP_PATH)) return null;
  const m = readFileSync(PHASE_MAP_PATH, "utf-8").match(HASH_RE);
  return m && m[1] !== "<sha256>" ? m[1] : null;
}

export function writePhaseMapHash(hash: string): boolean {
  if (!existsSync(PHASE_MAP_PATH)) return false;
  const text = readFileSync(PHASE_MAP_PATH, "utf-8");
  if (!HASH_RE.test(text)) return false;
  const next = text.replace(HASH_RE, `<!-- content hash: ${hash} -->`);
  if (next === text) return false;
  writeFileSync(PHASE_MAP_PATH, next, "utf-8");
  return true;
}
