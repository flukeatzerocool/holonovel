#!/usr/bin/env node
/**
 * embed-spec.mjs — emit the assembled spec into the package directory. [build tool]
 *
 * Copies the repository's assembled spec (`../holonovel.md`) to
 * `holonovel/holonovel.md`, the file the runtime reads for the `spec://build`
 * resource and the spec hash (REQ-105). The copy is generated, not tracked:
 * `npm install` runs this as the package's `prepare` hook, `npm run assemble`
 * and `spec-propagate` write it during a build, and the publish deploy step runs
 * it after a pull so a spec-only deploy still restores it.
 *
 * When the source is absent (a git-URL install of this package, where no
 * repository root exists), it prints a notice and exits 0: an install must not
 * fail over an optional spec, and the runtime already degrades to
 * "Specification not embedded in this build." The pack path stays strict —
 * `prepare-package` compares before packing and fails on divergence.
 *
 * Usage: node scripts/embed-spec.mjs [--quiet]
 * Exit codes: 0 = emitted, already current, or no source; 2 = fatal error.
 */
import { copyFileSync, existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const PACKAGE_ROOT = resolve(import.meta.dirname, "..");
const SOURCE = join(PACKAGE_ROOT, "..", "holonovel.md");
const TARGET = join(PACKAGE_ROOT, "holonovel.md");
const quiet = process.argv.includes("--quiet");

function main() {
  if (!existsSync(SOURCE)) {
    if (!quiet) {
      console.log(
        `embed-spec: no assembled spec at ${SOURCE} — nothing to embed ` +
          "(the runtime reports spec://build as not embedded)",
      );
    }
    return;
  }
  if (existsSync(TARGET) && readFileSync(TARGET).equals(readFileSync(SOURCE))) {
    if (!quiet) console.log(`embed-spec: current (${TARGET})`);
    return;
  }
  copyFileSync(SOURCE, TARGET);
  if (!quiet) console.log(`embed-spec: embedded ${SOURCE} → ${TARGET}`);
}

try {
  main();
} catch (error) {
  console.error("embed-spec: fatal:", error instanceof Error ? error.message : error);
  process.exit(2);
}
