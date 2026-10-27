#!/usr/bin/env node
/**
 * prepare-package.mjs — stage the packaged specification and verify required
 * runtime artifacts before packing. [build tool]
 *
 * Copies the assembled repository spec (`../holonovel.md` from the package
 * root) to `holonovel/holonovel.md`, which the runtime reads for the
 * `spec://build` resource and the spec hash (REQ-105). Fails when a required
 * runtime artifact is missing (REQ-614).
 *
 * Usage: node scripts/prepare-package.mjs
 * Exit codes: 0 = staged, 1 = missing required artifact, 2 = fatal.
 */
import { copyFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";

const PACKAGE_ROOT = resolve(import.meta.dirname, "..");
const REPO_ROOT = resolve(PACKAGE_ROOT, "..");
const SPEC_SOURCE = join(REPO_ROOT, "holonovel.md");
const SPEC_TARGET = join(PACKAGE_ROOT, "holonovel.md");

const REQUIRED = [
  "bin/holonovel.js",
  "content/torre-nosferatu.json",
  "tool-surface-registry.json",
  "tool-disambiguation.json",
];

function main() {
  const missing = REQUIRED.filter((rel) => !existsSync(join(PACKAGE_ROOT, rel)));
  if (!existsSync(SPEC_SOURCE)) missing.unshift("holonovel.md (assembled spec at repo root)");
  if (missing.length > 0) {
    console.error("prepare-package: missing required runtime artifact(s):");
    for (const rel of missing) console.error(`  - ${rel}`);
    process.exit(1);
  }
  copyFileSync(SPEC_SOURCE, SPEC_TARGET);
  console.log(`prepare-package: staged specification (${SPEC_TARGET})`);
}

try {
  main();
} catch (error) {
  console.error("prepare-package: fatal:", error instanceof Error ? error.message : error);
  process.exit(2);
}
