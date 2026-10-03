// hash.ts — shared SHA-256 helpers for build and verification tooling.
//
// `sha256` hashes a buffer or string; `hashFile` reads a file and hashes it,
// returning a caller-supplied fallback when the file is unreadable. Prefer
// these over a local one-liner so hashing stays one implementation.

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

export function sha256(data: Buffer | string): string {
  return createHash("sha256").update(data).digest("hex");
}

export function hashFile(path: string, fallback = "unavailable"): string {
  try {
    return sha256(readFileSync(path));
  } catch {
    return fallback;
  }
}
