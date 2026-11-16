#!/usr/bin/env node
/**
 * prepare-package.mjs — verify the packaged specification before packing.
 * [build tool]
 *
 * Compares the repository's assembled spec (`../holonovel.md`) with the staged
 * copy (`holonovel/holonovel.md`) the runtime reads for the `spec://build`
 * resource and the spec hash (REQ-105), and fails on divergence instead of
 * overwriting it — a stale stage means `npm run assemble` was skipped, and the
 * operator should regenerate rather than have the pack silently paper over it.
 * The `prepare` hook (`embed-spec.mjs`) is the emitter; this stays the strict
 * check. Fails when a required runtime artifact is missing (REQ-614).
 *
 * Usage: node scripts/prepare-package.mjs
 * Exit codes: 0 = staged copy verified, 1 = missing artifact or divergence,
 * 2 = fatal.
 */
import { existsSync, readFileSync } from "node:fs";
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
  if (!existsSync(SPEC_TARGET)) missing.push("holonovel.md (staged copy — run `npm run assemble`)");
  if (missing.length > 0) {
    console.error("prepare-package: missing required runtime artifact(s):");
    for (const rel of missing) console.error(`  - ${rel}`);
    process.exit(1);
  }
  if (!readFileSync(SPEC_SOURCE).equals(readFileSync(SPEC_TARGET))) {
    console.error(
      "prepare-package: holonovel/holonovel.md differs from the assembled holonovel.md — run `npm run assemble` and re-pack",
    );
    process.exit(1);
  }
  console.log(`prepare-package: verified staged specification (${SPEC_TARGET})`);
}

try {
  main();
} catch (error) {
  console.error("prepare-package: fatal:", error instanceof Error ? error.message : error);
  process.exit(2);
}
