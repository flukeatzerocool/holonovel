// ruleset-package.mjs — shared canonical-JSON + content-hash helpers for the
// ruleset build assets (scripts/ruleset-builds/<slug>/build-package.mjs).
//
// The hash is identical to the host's computeContentHash
// (holonovel/src/rulesets.ts, REQ-389): canonicalization strips to a compact
// JSON string over [index, model, tools, resources, prompts].

import * as crypto from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export const canonical = (obj) => JSON.stringify(JSON.parse(JSON.stringify(obj)));

export function computeContentHash(index, model, tools, resources, prompts) {
  const h = crypto.createHash("sha256");
  for (const obj of [index, model, tools, resources, prompts]) h.update(canonical(obj));
  return h.digest("hex");
}

// Deterministic package emission (REQ-561): write the six-file declarative
// package from the canonical parts, deriving the content hash from the parts
// only (never the timestamp). Two emissions from identical parts + a fixed
// `builtAt` are byte-identical.
export function emitPackage(dir, { slug, name, hostVersion, packageFormat, index, model, tools, resources = [], prompts = [], builtAt = "1970-01-01T00:00:00.000Z" }) {
  const manifest = {
    slug, name, host_version: hostVersion, package_format: packageFormat,
    content_hash: computeContentHash(index, model, tools, resources, prompts),
    built_at: builtAt, counts: {},
  };
  const files = {
    "manifest.json": manifest, "index.json": index, "model.json": model,
    "tools.json": tools, "resources.json": resources, "prompts.json": prompts,
  };
  mkdirSync(dir, { recursive: true });
  for (const [file, obj] of Object.entries(files)) {
    writeFileSync(join(dir, file), JSON.stringify(obj, null, 2) + "\n");
  }
  return manifest.content_hash;
}
