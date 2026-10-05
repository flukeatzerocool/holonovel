// ruleset-package.mjs — shared canonical-JSON + content-hash helpers for the
// ruleset build assets (scripts/ruleset-builds/<slug>/build-package.mjs).
//
// The hash is identical to the host's computeContentHash
// (holonovel/src/rulesets.ts, REQ-389): canonicalization strips to a compact
// JSON string over [index, model, tools, resources, prompts].

import * as crypto from "node:crypto";

export const canonical = (obj) => JSON.stringify(JSON.parse(JSON.stringify(obj)));

export function computeContentHash(index, model, tools, resources, prompts) {
  const h = crypto.createHash("sha256");
  for (const obj of [index, model, tools, resources, prompts]) h.update(canonical(obj));
  return h.digest("hex");
}
