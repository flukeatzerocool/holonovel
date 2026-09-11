#!/usr/bin/env npx tsx
/**
 * check-fingerprint-sync.ts — contract-fingerprint staleness gate. [gate]
 *
 * Computes the package-format and data-format fingerprints from the assembled
 * `holonovel.md` (REQ-420, REQ-423) and compares them against the constants
 * baked into `holonovel/src/generated/contract-fingerprints.ts`. A spec edit
 * that changes a fingerprint section without re-running build-order leaves the
 * baked constants stale, which breaks user-data migration (REQ-424). Exit
 * codes: 0 = in sync, 1 = stale (run `npm run build-order`), 2 = fatal
 * (missing or unparseable input).
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { computeContractFingerprints } from "./lib/contract-fingerprint.js";

const root = join(import.meta.dirname, "..");
const specPath = join(root, "holonovel.md");
const genPath = join(root, "holonovel", "src", "generated", "contract-fingerprints.ts");

if (!existsSync(specPath)) {
  console.error("FATAL: holonovel.md not found — run `npm run assemble` first.");
  process.exit(2);
}
if (!existsSync(genPath)) {
  console.error(`FATAL: ${genPath} not found.`);
  process.exit(2);
}

const computed = computeContractFingerprints(readFileSync(specPath, "utf-8"));
const gen = readFileSync(genPath, "utf-8");

const pkgMatch = gen.match(/export const PACKAGE_FORMAT = "([0-9a-f]+)";/);
const dataMatch = gen.match(/export const DATA_FORMAT = "([0-9a-f]+)";/);
if (!pkgMatch || !dataMatch) {
  console.error("FATAL: contract-fingerprints.ts is not in the expected generated format.");
  process.exit(2);
}

const baked = { packageFormat: pkgMatch[1], dataFormat: dataMatch[1] };
const stale: string[] = [];
if (baked.packageFormat !== computed.packageFormat) {
  stale.push(`PACKAGE_FORMAT (baked ${baked.packageFormat.slice(0, 8)}…, spec-derived ${computed.packageFormat.slice(0, 8)}…)`);
}
if (baked.dataFormat !== computed.dataFormat) {
  stale.push(`DATA_FORMAT (baked ${baked.dataFormat.slice(0, 8)}…, spec-derived ${computed.dataFormat.slice(0, 8)}…)`);
}

if (stale.length > 0) {
  console.error(`STALE: ${stale.join("; ")}`);
  console.error("A spec edit changed a fingerprint section without re-running build-order.");
  console.error("Fix: npm run build-order");
  process.exit(1);
}

console.log("Fingerprints in sync.");
process.exit(0);
