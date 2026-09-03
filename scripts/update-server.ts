#!/usr/bin/env npx tsx
/**
 * update-server.ts — Fingerprint-scoped Update workflow invoker (§6.7).
 *
 * Compares stored implementation fingerprints against current source and
 * determines rebuild scope (full, partial, scoped, or skip). Records
 * fingerprint baselines for future delta comparisons.
 *
 * LIMITATION: This script prints `opencode run` commands but does NOT
 * invoke them. Opencode cannot recursively invoke itself — `opencode run`
 * from within an opencode session would deadlock. A human or CI with
 * opencode access must run the printed command manually.
 *
 * When running OUTSIDE of opencode (bare shell, CI pipeline), uncomment
 * the exec block at the bottom of this file to auto-invoke.
 */

import { readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { computeFingerprints, type Fingerprints } from "./lib/fingerprints";

const root = join(import.meta.dirname, "..");
const FINGERPRINT_FILE = ".holonovel-state/pipeline-fingerprints.json";

interface StoredRecord {
  server: string;
  spec_hash: string;
  fingerprints: Fingerprints;
  last_update: string;
}

const server = process.argv.includes("--server")
  ? process.argv[process.argv.indexOf("--server") + 1]
  : null;
const specHash = process.argv.includes("--spec-hash")
  ? process.argv[process.argv.indexOf("--spec-hash") + 1]
  : null;
const scopeByFingerprint = process.argv.includes("--scope-by-fingerprint");
const checkOnly = process.argv.includes("--check");
const allowPending = process.argv.includes("--allow-pending");
const deltaClassArg = process.argv.includes("--delta-class")
  ? process.argv[process.argv.indexOf("--delta-class") + 1]
  : null;
const deltaClass: "patch" | "editorial" | "minor" | "major" =
  deltaClassArg === "patch" || deltaClassArg === "editorial" || deltaClassArg === "minor" || deltaClassArg === "major"
    ? deltaClassArg
    : "major";

const serverDirArg = process.argv.includes("--server-dir")
  ? process.argv[process.argv.indexOf("--server-dir") + 1]
  : null;
const verifyDeployed = process.argv.includes("--verify-deployed");

function loadStored(): Record<string, StoredRecord> {
  const path = join(root, FINGERPRINT_FILE);
  if (!existsSync(path)) return {};
  try { return JSON.parse(readFileSync(path, "utf-8")); }
  catch { return {}; }
}

function saveStored(records: Record<string, StoredRecord>): void {
  const dir = join(root, ".holonovel-state");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "pipeline-fingerprints.json"), JSON.stringify(records, null, 2));
}

function loadCurrent(serverDir: string): Fingerprints {
  return computeFingerprints(serverDir);
}

function compareFingerprints(current: Fingerprints, stored: Fingerprints | undefined): {
  changed: string[];
  unchanged: string[];
  changedCount: number;
} {
  if (!stored) return { changed: ["source", "config", "lockfile", "extraction", "surfaces"], unchanged: [], changedCount: 5 };
  const changed: string[] = [];
  const unchanged: string[] = [];
  for (const key of ["source", "config", "lockfile", "extraction", "surfaces"] as const) {
    if (current[key] !== stored[key]) changed.push(key);
    else unchanged.push(key);
  }
  return { changed, unchanged, changedCount: changed.length };
}

if (!server) {
  console.error("Usage: npx tsx scripts/update-server.ts --server <name> [--spec-hash <hash>] [--scope-by-fingerprint] [--delta-class patch|editorial|minor|major] [--server-dir <path>] [--verify-deployed] [--check] [--allow-pending]");
  process.exit(1);
}

const serverName = server;
const serverDir = serverDirArg ?? join(root, serverName);
const stored = loadStored();
const previous = stored[serverName];

// Verify the deployed tree (REQ-418): recompute spec hash + fingerprints in
// the deployed clone and exit nonzero on any mismatch. Reads the published
// spec hash and fingerprints from the current working tree's pipeline state.
if (verifyDeployed) {
  const deployedDir = serverDirArg ?? join(root, serverName);
  if (!existsSync(join(deployedDir, "package.json"))) {
    console.error(`Deployed server not found at ${deployedDir}`);
    process.exit(1);
  }
  const expectedHash = specHash ?? createHash("sha256").update(readFileSync(join(root, "holonovel.md"), "utf-8")).digest("hex");
  const priorRecord = previous;
  if (!expectedHash || !priorRecord) {
    console.error("Deploy verification needs a published spec hash and stored fingerprints.");
    process.exit(1);
  }
  let deployedFingerprints: Fingerprints;
  try {
    deployedFingerprints = computeFingerprints(deployedDir);
  } catch {
    console.error("Deploy verification: could not compute deployed fingerprints.");
    process.exit(1);
  }
  const deployedHash = readFileSync(join(deployedDir, "holonovel.md"), "utf-8");
  // Compare the deployed spec hash as the raw content SHA-256 of the assembled
  // file, since the deployed clone carries the assembled holonovel.md.
  const deployedSpecHash = createHash("sha256").update(deployedHash).digest("hex");

  const hashOk = deployedSpecHash === expectedHash;
  const fpOk = compareFingerprints(deployedFingerprints, priorRecord.fingerprints).changedCount === 0;
  if (!hashOk || !fpOk) {
    console.error(`Deploy verification FAILED: spec hash ${hashOk ? "ok" : "MISMATCH"}, fingerprints ${fpOk ? "ok" : "MISMATCH"}.`);
    process.exit(1);
  }
  console.log(`Deploy verification passed: spec hash ${deployedSpecHash.substring(0, 16)}…, fingerprints match.`);
  process.exit(0);
}

// Compare spec hashes
const currentHash = specHash ?? createHash("sha256").update(readFileSync(join(root, "holonovel.md"), "utf-8")).digest("hex");
const storedHash = previous?.spec_hash;

console.log(`Server: ${server}`);
console.log(`Current spec hash: ${currentHash}`);
console.log(`Stored spec hash:  ${storedHash ?? "(none)"}`);

if (storedHash && currentHash === storedHash) {
  // Spec unchanged. If the implementation advanced anyway (direct commits, or
  // a build without a spec delta), refresh the stored baseline so deploy
  // verification (REQ-418) and scoping (REQ-314) compare against current code.
  // REQ-313c requires every component hash to be updated on every build.
  let currentFingerprints: Fingerprints;
  try {
    currentFingerprints = loadCurrent(serverDir);
  } catch {
    console.error("ERROR: Could not compute current fingerprints from the source tree");
    process.exit(1);
  }
  const delta = compareFingerprints(currentFingerprints, previous?.fingerprints);
  if (delta.changedCount > 0 && !checkOnly) {
    reconcile(currentHash, currentFingerprints);
    console.log(`\nSpec unchanged but implementation fingerprints changed (${delta.changed.join(", ")}): baseline refreshed (REQ-313c).`);
  } else if (delta.changedCount > 0) {
    console.log(`\nSpec unchanged; implementation fingerprints changed (${delta.changed.join(", ")}): check mode, no write.`);
  } else {
    console.log("\nSpec unchanged — no update needed.");
  }
  process.exit(0);
}

// Compute current fingerprints from the live source tree (REQ-313)
let currentFingerprints: Fingerprints;
try {
  currentFingerprints = loadCurrent(serverDir);
  console.log(`\nCurrent fingerprints: source=${currentFingerprints.source.substring(0, 16)}... config=${currentFingerprints.config.substring(0, 16)}... lockfile=${currentFingerprints.lockfile.substring(0, 16)}... extraction=${currentFingerprints.extraction.substring(0, 16)}... surfaces=${currentFingerprints.surfaces.substring(0, 16)}...`);
} catch {
  console.error("ERROR: Could not compute current fingerprints from the source tree");
  process.exit(1);
}

function reconcile(spec_hash: string, fingerprints: Fingerprints): void {
  stored[serverName] = { server: serverName, spec_hash, fingerprints, last_update: new Date().toISOString() };
  saveStored(stored);
}

if ((scopeByFingerprint || checkOnly) && previous) {
  const delta = compareFingerprints(currentFingerprints, previous.fingerprints);
  console.log(`\nFingerprint delta: ${delta.changedCount} changed (${delta.changed.join(", ")}), ${delta.unchanged.length} unchanged (${delta.unchanged.join(", ")})`);

  // Pending update: spec advanced, implementation fingerprints unchanged, and
  // the delta is not wording-only or editorial. This is the silent-stale
  // publication case that REQ-394 forbids — block publication until the §6.7
  // update runs.
  const pendingUpdate =
    delta.changedCount === 0 && deltaClass !== "patch" && deltaClass !== "editorial";

  if (pendingUpdate) {
    console.log(`\nPENDING UPDATE: spec ${deltaClass} delta but no implementation fingerprints changed.`);
    console.log(`Invoking: opencode run --agent build "Perform Update workflow (§6.7) on ${server}. Spec hash changed from ${previous.spec_hash?.substring(0, 16)} to ${currentHash.substring(0, 16)} (${deltaClass} delta)."`);
    if (checkOnly || !allowPending) {
      process.exit(1);
    }
    console.log(`  (overridden with --allow-pending — recording reconciled hash without performing the update.)`);
    reconcile(currentHash, currentFingerprints);
    process.exit(0);
  }

  if (delta.changedCount === 0) {
    console.log("Spec hash changed (patch-class) with no implementation fingerprints changed — nothing to rebuild.");
    if (checkOnly) { console.log("  (check mode — no write)"); process.exit(0); }
    reconcile(currentHash, currentFingerprints);
    process.exit(0);
  }

  if (checkOnly) { process.exit(0); }

  if (delta.changedCount > 2) {
    console.log(`>2 components changed — full Build workflow required.`);
    console.log(`Invoking: opencode run --agent build "Perform Update workflow (§6.7) on ${server}. Spec hash changed from ${previous.spec_hash?.substring(0, 16)} to ${currentHash.substring(0, 16)}. Full rebuild needed."`);
  } else if (delta.changedCount === 1) {
    console.log(`Only ${delta.changed[0]} changed — scoped rebuild (typecheck + affected Pattern Buffer sub-workflows).`);
    console.log(`Invoking: opencode run --agent build "Perform scoped Update on ${server}. Only ${delta.changed[0]} changed. Typecheck and re-run affected Pattern Buffer sub-workflows."`);
  } else {
    console.log(`${delta.changedCount} components changed — partial rebuild.`);
    console.log(`Invoking: opencode run --agent build "Perform partial Update on ${server}. Changed: ${delta.changed.join(", ")}. Implement only changed surfaces and their dependents."`);
  }
} else {
  if (checkOnly) {
    console.log(`\nNo stored fingerprints — cannot determine pending-update status.`);
    process.exit(1);
  }
  console.log(`\nFull update required (no stored fingerprints or unscoped mode).`);
  console.log(`Invoking: opencode run --agent build "Perform Update workflow (§6.7) on ${server}. Spec hash changed from ${storedHash?.substring(0, 16) ?? "none"} to ${currentHash.substring(0, 16)}."`);
}

// Save current fingerprints (normal mode only — --check never writes)
if (!checkOnly) {
  reconcile(currentHash, currentFingerprints);
}

// The AI maintainer (opencode run) cannot be invoked from within opencode
// (recursive invocation would deadlock). This script records the decision
// and fingerprints; a human or CI with opencode access must run the command.
//
// When running OUTSIDE of opencode (bare shell, CI pipeline), uncomment:
// ```
// import { execSync } from "node:child_process";
// execSync(updateCommand, { stdio: "inherit", cwd: root });
// ```
console.log("\nFingerprints saved. Next: run opencode to perform the actual update.");
process.exit(0);
