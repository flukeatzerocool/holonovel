// ruleset-package.mjs — shared canonical-JSON + content-hash helpers for the
// ruleset build assets (scripts/ruleset-builds/<slug>/build-package.mjs).
//
// The hash is identical to the host's computeContentHash
// (holonovel/src/rulesets.ts, REQ-389): canonicalization strips to a compact
// JSON string over [index, model, tools, resources, prompts].

import * as crypto from "node:crypto";
import { readFileSync } from "node:fs";

export const canonical = (obj) => JSON.stringify(JSON.parse(JSON.stringify(obj)));

export function computeContentHash(index, model, tools, resources, prompts) {
  const h = crypto.createHash("sha256");
  for (const obj of [index, model, tools, resources, prompts]) h.update(canonical(obj));
  return h.digest("hex");
}

// Read the host's current package-format fingerprint from a generated
// contract-fingerprints.ts (REQ-420), shared by the per-ruleset build assets.
export function readPackageFormat(genPath) {
  const src = readFileSync(genPath, "utf-8");
  const m = src.match(/export const PACKAGE_FORMAT = "([0-9a-f]+)";/);
  if (!m) throw new Error(`PACKAGE_FORMAT not found in ${genPath}`);
  return m[1];
}

// Read the host version from a package.json (REQ-389 version manifest).
export function readHostVersion(pkgPath) {
  return JSON.parse(readFileSync(pkgPath, "utf-8")).version;
}
