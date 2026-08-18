#!/usr/bin/env node
// Recompute the content_hash of the swse package (or a named slug) from its
// five content files and patch manifest.json. Idempotent: if the manifest hash
// already matches, it is a no-op. This guarantees package integrity regardless
// of how a build agent computed the hash originally.
//
// Usage: node recompute-ruleset-hash.mjs [slug] [installDir]
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

const slug = process.argv[2] ?? "swse";
const installDir = process.argv[3]
  ?? "/home/fluke/Holonovel-deployed/holonovel/.holonovel-state/rulesets";
const dir = path.join(installDir, slug);

const canonical = (o) => JSON.stringify(JSON.parse(JSON.stringify(o)));
const read = (name) => JSON.parse(fs.readFileSync(path.join(dir, name), "utf8"));

const index = read("index.json");
const model = read("model.json");
const tools = read("tools.json");
const resources = read("resources.json");
const prompts = read("prompts.json");

const h = crypto.createHash("sha256");
for (const o of [index, model, tools, resources, prompts]) h.update(canonical(o));
const hash = h.digest("hex");

const manifestPath = path.join(dir, "manifest.json");
const manifest = read("manifest.json");
if (manifest.content_hash === hash) {
  console.log(`content_hash already correct (${hash}) — no change.`);
  process.exit(0);
}
manifest.content_hash = hash;
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
console.log(`recomputed content_hash: ${hash}`);
