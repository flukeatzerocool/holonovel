#!/usr/bin/env node
/**
 * clean-dist.mjs — remove the compiled output before a packaging build.
 * [build tool]
 *
 * A clean build prevents stale emitted files from surviving an `npm pack` run.
 * Exit codes: 0 = cleaned, 2 = fatal.
 */
import { rmSync } from "node:fs";
import { resolve } from "node:path";

const DIST = resolve(import.meta.dirname, "..", "dist");

try {
  rmSync(DIST, { recursive: true, force: true });
  console.log("clean-dist: removed dist/");
} catch (error) {
  console.error("clean-dist: fatal:", error instanceof Error ? error.message : error);
  process.exit(2);
}
