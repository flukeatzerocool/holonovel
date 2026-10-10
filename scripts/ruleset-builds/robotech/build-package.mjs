#!/usr/bin/env node
// build-package.mjs — deterministic rebuild of the `robotech` ruleset package. [build tool]
//
// Role: build tool. Re-emits the six-file declarative ruleset package (REQ-389)
// for the Robotech ruleset from the committed durable baseline (`baseline.json`)
// via the shared ruleset-build kit, sanitizing read-only tool descriptions
// (REQ-552) and running the package gates before finalizing (REQ-430, REQ-563).
//
// Usage:
//   node scripts/ruleset-builds/robotech/build-package.mjs [--baseline <dir>] [--out <dir>] [--dry-run] [--no-backup]
//
// Exit codes: 0 = package written (or dry-run), 1 = gate refusal / build failure,
// 2 = unexpected fatal error.
//
// REQ-389 (declarative package), REQ-395a (build entry point), REQ-430
// (tool-quality conformance), REQ-552 (TDQS), REQ-563 (committed emitter).

import * as path from "node:path";
import { emitFromBaseline } from "../../lib/ruleset-build-kit.mjs";

const SCRIPT_DIR = import.meta.dirname;
const REPO_ROOT = path.resolve(SCRIPT_DIR, "..", "..", "..");

process.exit(emitFromBaseline({
  slug: "robotech",
  name: "Robotech",
  repoRoot: REPO_ROOT,
  scriptDir: SCRIPT_DIR,
  argv: process.argv.slice(2),
}));
