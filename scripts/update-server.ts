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

const root = join(import.meta.dirname, "..");
const FINGERPRINT_FILE = ".holonovel-state/pipeline-fingerprints.json";

interface Fingerprints {
  source: string;
  config: string;
  lockfile: string;
  extraction: string;
  surfaces: string;
}

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
  const data = readFileSync(join(serverDir, "DECISIONS.md"), "utf-8");
  const sourceMatch = data.match(/source=([a-f0-9]+)/);
  const configMatch = data.match(/config=([a-f0-9]+)/);
  const lockfileMatch = data.match(/lockfile=([a-f0-9]+)/);
  const extractionMatch = data.match(/extraction=([a-f0-9]+|sentinel)/);
  const surfacesMatch = data.match(/surfaces=([a-f0-9]+)/);
  return {
    source: sourceMatch?.[1] ?? "unknown",
    config: configMatch?.[1] ?? "unknown",
    lockfile: lockfileMatch?.[1] ?? "unknown",
    extraction: extractionMatch?.[1] ?? "sentinel",
    surfaces: surfacesMatch?.[1] ?? "unknown",
  };
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
  console.error("Usage: npx tsx scripts/update-server.ts --server <name> [--spec-hash <hash>] [--scope-by-fingerprint]");
  process.exit(1);
}

const serverDir = join(root, server);
const stored = loadStored();
const previous = stored[server];

// Compare spec hashes
const currentHash = specHash ?? readFileSync(join(root, "holonovel.md"), "utf-8").match(/SHA-256: ([a-f0-9]+)/)?.[1] ?? "unknown";
const storedHash = previous?.spec_hash;

console.log(`Server: ${server}`);
console.log(`Current spec hash: ${currentHash}`);
console.log(`Stored spec hash:  ${storedHash ?? "(none)"}`);

if (storedHash && currentHash === storedHash) {
  console.log("\nSpec unchanged — no update needed.");
  process.exit(0);
}

// Load current fingerprints from DECISIONS.md
let currentFingerprints: Fingerprints;
try {
  currentFingerprints = loadCurrent(serverDir);
  console.log(`\nCurrent fingerprints: source=${currentFingerprints.source.substring(0, 16)}... config=${currentFingerprints.config.substring(0, 16)}... lockfile=${currentFingerprints.lockfile.substring(0, 16)}... extraction=${currentFingerprints.extraction.substring(0, 16)}... surfaces=${currentFingerprints.surfaces.substring(0, 16)}...`);
} catch {
  console.error("ERROR: Could not read current fingerprints from DECISIONS.md");
  process.exit(1);
}

if (scopeByFingerprint && previous) {
  const delta = compareFingerprints(currentFingerprints, previous.fingerprints);
  console.log(`\nFingerprint delta: ${delta.changedCount} changed (${delta.changed.join(", ")}), ${delta.unchanged.length} unchanged (${delta.unchanged.join(", ")})`);

  if (delta.changedCount === 0 && currentHash === previous.spec_hash) {
    console.log("No changes detected — skipping update.");
    process.exit(0);
  }

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
  console.log(`\nFull update required (no stored fingerprints or unscoped mode).`);
  console.log(`Invoking: opencode run --agent build "Perform Update workflow (§6.7) on ${server}. Spec hash changed from ${storedHash?.substring(0, 16) ?? "none"} to ${currentHash.substring(0, 16)}."`);
}

// Save current fingerprints
stored[server] = {
  server,
  spec_hash: currentHash,
  fingerprints: currentFingerprints,
  last_update: new Date().toISOString(),
};
saveStored(stored);

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
