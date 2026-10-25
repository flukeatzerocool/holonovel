#!/usr/bin/env npx tsx
/**
 * update-server.ts — Fingerprint-scoped Update workflow invoker (§6.7). [entry point]
 *
 * Compares stored implementation fingerprints against current source and
 * determines rebuild scope (full, partial, scoped, or skip). Records
 * fingerprint baselines for future delta comparisons.
 *
 * REQ-394a: a Minor/Major delta whose fingerprints advanced requires evidence
 * that the rebuild ran — an executed invocation or a dated operator deferral in
 * DECISIONS.md. Without either, publication is blocked and the stored baseline
 * is left untouched. The baseline is reconciled only after a successful
 * invocation, so a failed update can never be recorded as applied. Every
 * scoped run also writes a machine-readable fingerprint delta
 * (fingerprint-deltas.json) for the Spec Update record (REQ-313a/REQ-314b).
 *
 * LIMITATION: By default this script prints `opencode run` commands but does
 * NOT invoke them — opencode cannot recursively invoke itself from within an
 * opencode session (that would deadlock). Set `HOLONOVEL_INVOKE_UPDATE=1`
 * when running OUTSIDE a session (bare shell, CI) to execute the printed
 * command automatically. A human or CI with opencode access may otherwise run
 * the printed command manually.
 */

import { readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { execSync } from "node:child_process";
import { computeFingerprints, type Fingerprints } from "./lib/fingerprints";
import type { FingerprintDelta } from "./lib/spec-update.js";

const root = join(import.meta.dirname, "..");
// State-dir override (REQ-314): the update-workflow harness points
// HOLONOVEL_STATE_DIR at a temp dir so a test run never touches (or restores)
// the live pipeline baseline. Default preserves the push-pipeline path.
const STATE_DIR = process.env.HOLONOVEL_STATE_DIR ?? join(root, ".holonovel-state");
const FINGERPRINT_FILE = join(STATE_DIR, "pipeline-fingerprints.json");

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
const invokeEnabled = process.env.HOLONOVEL_INVOKE_UPDATE === "1";
let updateCommand: string | null = null;

function localDate(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

// REQ-394 permits the pending-update block to be lifted only by an operator
// override recorded in DECISIONS.md. Require a dated line naming this server.
function hasRecordedOverride(dir: string, server: string): boolean {
  const path = join(dir, "DECISIONS.md");
  if (!existsSync(path)) return false;
  const pattern = new RegExp(
    `^-\\s+\\*\\*Pending-update override:\\*\\*\\s+${server}\\s+${localDate()}\\b`,
    "m"
  );
  return pattern.test(readFileSync(path, "utf-8"));
}

// REQ-394a permits a required rebuild to be deferred only by a dated operator
// record naming this server and the verification performed. The date must be
// today, so a stale acknowledgement cannot silently cover a new delta.
function hasRecordedDeferral(dir: string, server: string): boolean {
  const path = join(dir, "DECISIONS.md");
  if (!existsSync(path)) return false;
  const pattern = new RegExp(
    `^-\\s+\\*\\*Update-deferred:\\*\\*\\s+${server}\\s+${localDate()}\\b`,
    "m"
  );
  return pattern.test(readFileSync(path, "utf-8"));
}

function loadStored(): Record<string, StoredRecord> {
  const path = FINGERPRINT_FILE;
  if (!existsSync(path)) return {};
  try { return JSON.parse(readFileSync(path, "utf-8")); }
  catch { /* corrupt baseline: treat as absent and let the caller rebuild it */ return {}; }
}

function saveStored(records: Record<string, StoredRecord>): void {
  mkdirSync(STATE_DIR, { recursive: true });
  writeFileSync(FINGERPRINT_FILE, JSON.stringify(records, null, 2));
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

// REQ-313a / REQ-314b — the five component hashes and the scoping decision,
// emitted for the dated DECISIONS.md Spec Update entry. Deterministic: no
// timestamp, so a re-run over the same tree writes identical bytes.
type DeltaRecord = FingerprintDelta;

const DELTA_RECORD_FILE = join(STATE_DIR, "fingerprint-deltas.json");

function scopingFor(changedCount: number, hasPrior: boolean): DeltaRecord["scoping"] {
  if (!hasPrior) return "seed";
  if (changedCount > 2) return "full";
  if (changedCount === 2) return "partial";
  if (changedCount === 1) return "scoped";
  return "none";
}

function writeDeltaRecord(record: DeltaRecord): void {
  let records: Record<string, DeltaRecord> = {};
  if (existsSync(DELTA_RECORD_FILE)) {
    try { records = JSON.parse(readFileSync(DELTA_RECORD_FILE, "utf-8")); }
    catch { /* corrupt state file: this run's record is authoritative */ records = {}; }
  }
  records[serverName] = record;
  mkdirSync(STATE_DIR, { recursive: true });
  writeFileSync(DELTA_RECORD_FILE, JSON.stringify(records, null, 2) + "\n");
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

// REQ-098/REQ-314 — when running outside an opencode session
// (HOLONOVEL_INVOKE_UPDATE=1) the printed update command is executed here.
function invokeUpdate(cmd: string): void {
  console.log(`\nHOLONOVEL_INVOKE_UPDATE=1 — executing: ${cmd}`);
  try {
    execSync(cmd, { stdio: "inherit", cwd: root });
  } catch (e: any) {
    console.error(`Update invocation failed: ${e.message}`);
    process.exit(1);
  }
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

  // A zero-change publication still records the delta ("none"), so the Spec
  // Update entry can state that no component changed (REQ-394a).
  const writeNoneDelta = (invoked: boolean, deferred: boolean): void =>
    writeDeltaRecord({
      spec_hash: currentHash,
      prior_spec_hash: previous.spec_hash ?? null,
      changed: [],
      unchanged: delta.unchanged,
      changed_count: 0,
      scoping: "none",
      invoked,
      deferred,
      reused: delta.unchanged,
      current: currentFingerprints,
      prior: previous.fingerprints,
    });

  if (pendingUpdate) {
    console.log(`\nPENDING UPDATE: spec ${deltaClass} delta but no implementation fingerprints changed.`);
    updateCommand = `opencode run --agent build "Perform Update workflow (§6.7) on ${server}. Spec hash changed from ${previous.spec_hash?.substring(0, 16)} to ${currentHash.substring(0, 16)} (${deltaClass} delta)."`;
    console.log(`Invoking: ${updateCommand}`);
    if (invokeEnabled && !checkOnly) {
      invokeUpdate(updateCommand);
      writeNoneDelta(true, false);
      reconcile(currentHash, currentFingerprints);
      process.exit(0);
    }
    if (checkOnly || !allowPending) {
      process.exit(1);
    }
    // HOLONOVEL_DECISIONS_DIR isolates the record lookup for the harness (the
    // same way HOLONOVEL_STATE_DIR isolates the fingerprint baseline).
    const decisionsDir = process.env.HOLONOVEL_DECISIONS_DIR ?? serverDir;
    if (!hasRecordedOverride(decisionsDir, server)) {
      console.error(`\n--allow-pending requires a recorded operator override in ${join(decisionsDir, "DECISIONS.md")}:`);
      console.error(`- **Pending-update override:** ${server} ${localDate()} — <reason / scheduled update>`);
      process.exit(1);
    }
    console.log(`  (overridden with --allow-pending — recording reconciled hash without performing the update.)`);
    writeNoneDelta(false, true);
    reconcile(currentHash, currentFingerprints);
    process.exit(0);
  }

  if (delta.changedCount === 0) {
    console.log("Spec hash changed (patch-class) with no implementation fingerprints changed — nothing to rebuild.");
    if (checkOnly) { console.log("  (check mode — no write)"); process.exit(0); }
    writeNoneDelta(false, false);
    reconcile(currentHash, currentFingerprints);
    process.exit(0);
  }

  if (checkOnly) { process.exit(0); }

  // REQ-394a — a Minor/Major delta whose implementation fingerprints advanced
  // needs evidence that the rebuild ran: an executed invocation or a dated
  // operator deferral. Reconcile only after a successful invocation, so a
  // failed update is never recorded as applied.
  const scoping = scopingFor(delta.changedCount, true);
  const requiresEvidence = deltaClass === "minor" || deltaClass === "major";
  let deferred = false;
  if (requiresEvidence && !invokeEnabled) {
    // HOLONOVEL_DECISIONS_DIR isolates the record lookup for the harness (the
    // same way HOLONOVEL_STATE_DIR isolates the fingerprint baseline).
    const decisionsDir = process.env.HOLONOVEL_DECISIONS_DIR ?? serverDir;
    if (!hasRecordedDeferral(decisionsDir, server)) {
      writeDeltaRecord({
        spec_hash: currentHash,
        prior_spec_hash: previous.spec_hash ?? null,
        changed: delta.changed,
        unchanged: delta.unchanged,
        changed_count: delta.changedCount,
        scoping,
        invoked: false,
        deferred: false,
        reused: delta.unchanged,
        current: currentFingerprints,
        prior: previous.fingerprints,
      });
      console.error(`\nUPDATE REQUIRED: spec ${deltaClass} delta advanced ${delta.changedCount} fingerprint component(s) (${delta.changed.join(", ")}); scoping: ${scoping}.`);
      console.error(`Publication is blocked until the rebuild is evidenced (REQ-394a).`);
      console.error(`  Run the update outside a session: HOLONOVEL_INVOKE_UPDATE=1 npx tsx scripts/update-server.ts --server ${server} --scope-by-fingerprint`);
      console.error(`  Or record a dated deferral in ${join(decisionsDir, "DECISIONS.md")}:`);
      console.error(`- **Update-deferred:** ${server} ${localDate()} — <revision range and verification performed>`);
      process.exit(1);
    }
    deferred = true;
  }

  if (scoping === "full") {
    console.log(`>2 components changed — full Build workflow required.`);
    updateCommand = `opencode run --agent build "Perform Update workflow (§6.7) on ${server}. Spec hash changed from ${previous.spec_hash?.substring(0, 16)} to ${currentHash.substring(0, 16)}. Full rebuild needed."`;
  } else if (scoping === "scoped") {
    console.log(`Only ${delta.changed[0]} changed — scoped rebuild (typecheck + affected Pattern Buffer sub-workflows).`);
    updateCommand = `opencode run --agent build "Perform scoped Update on ${server}. Only ${delta.changed[0]} changed. Typecheck and re-run affected Pattern Buffer sub-workflows."`;
  } else {
    console.log(`${delta.changedCount} components changed — partial rebuild.`);
    updateCommand = `opencode run --agent build "Perform partial Update on ${server}. Changed: ${delta.changed.join(", ")}. Implement only changed surfaces and their dependents."`;
  }
  console.log(`Invoking: ${updateCommand}`);
  if (invokeEnabled) invokeUpdate(updateCommand);
  writeDeltaRecord({
    spec_hash: currentHash,
    prior_spec_hash: previous.spec_hash ?? null,
    changed: delta.changed,
    unchanged: delta.unchanged,
    changed_count: delta.changedCount,
    scoping,
    invoked: invokeEnabled,
    deferred,
    reused: delta.unchanged,
    current: currentFingerprints,
    prior: previous.fingerprints,
  });
  reconcile(currentHash, currentFingerprints);
  if (invokeEnabled) {
    console.log("\nFingerprints saved. Update workflow invoked.");
  } else if (deferred) {
    console.log("\nFingerprints saved. Rebuild deferred with a dated DECISIONS.md acknowledgement (REQ-394a).");
  } else {
    console.log("\nFingerprints saved. Next: run the printed `opencode run` command to perform the actual update.");
  }
  process.exit(0);
} else {
  if (checkOnly) {
    console.log(`\nNo stored fingerprints — cannot determine pending-update status.`);
    process.exit(1);
  }
  console.log(`\nFull update required (no stored fingerprints or unscoped mode).`);
  updateCommand = `opencode run --agent build "Perform Update workflow (§6.7) on ${server}. Spec hash changed from ${storedHash?.substring(0, 16) ?? "none"} to ${currentHash.substring(0, 16)}."`;
  console.log(`Invoking: ${updateCommand}`);
}

// Save current fingerprints (normal mode only — --check never writes)
if (!checkOnly) {
  reconcile(currentHash, currentFingerprints);
}

// Auto-invoke only when explicitly enabled and running outside a session.
if (updateCommand && invokeEnabled && !checkOnly) {
  invokeUpdate(updateCommand);
  console.log("\nFingerprints saved. Update workflow invoked.");
} else {
  console.log("\nFingerprints saved. Next: run the printed `opencode run` command to perform the actual update.");
}
process.exit(0);
