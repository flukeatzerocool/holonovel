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

// Hash a sequence of values after canonicalizing each with a JSON round-trip,
// so object key order and prototype noise do not affect the digest. Shared by
// the fingerprint and ruleset-package content-hash helpers.
export function sha256Canonical(...values: unknown[]): string {
  const h = createHash("sha256");
  for (const value of values) h.update(JSON.stringify(JSON.parse(JSON.stringify(value))));
  return h.digest("hex");
}
