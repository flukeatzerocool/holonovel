#!/usr/bin/env npx tsx
/**
 * update-server.ts — Fingerprint-scoped Update reconciliation (§6.7). [entry point]
 *
 * Compares stored implementation fingerprints against current source and
 * determines the reconciliation scope (full, partial, scoped, seed, or none).
 * Records fingerprint baselines for future delta comparisons.
 *
 * REQ-394a: a Minor/Major delta whose fingerprints advanced requires a
 * reconciliation record — one disposition per REQ the delta changed, derived
 * from committed evidence (the coverage register, `spec/audit/req-coverage.md`)
 * where it exists and from an operator-authored table (`--dispositions`) where
 * it does not. A dated operator deferral in DECISIONS.md also satisfies the
 * requirement. Without either, publication is blocked and the stored baseline
 * is left untouched. Every scoped run also writes a machine-readable fingerprint
 * delta (fingerprint-deltas.json) for the Spec Update record (REQ-313a/REQ-314b).
 */

import { readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { computeFingerprints, type Fingerprints } from "./lib/fingerprints";
import type { FingerprintDelta, ReqDisposition, ReqDispositionKind } from "./lib/spec-update.js";

const root = join(import.meta.dirname, "..");
// State-dir override (REQ-314): the update-workflow harness points
// HOLONOVEL_STATE_DIR at a temp dir so a test run never touches (or restores)
// the live pipeline baseline. Default preserves the push-pipeline path.
const STATE_DIR = process.env.HOLONOVEL_STATE_DIR ?? join(root, ".holonovel-state");
const FINGERPRINT_FILE = join(STATE_DIR, "pipeline-fingerprints.json");
// REQ-394a — the committed coverage register is the derivation source. The
// register's freshness is owned by `validate`: `build` and `gates` both precede
// `update` in the publication pipeline, and a stale register is a hard error.
const COVERAGE_REGISTER = join(root, "spec", "audit", "req-coverage.md");

interface StoredRecord {
  server: string;
  spec_hash: string;
  fingerprints: Fingerprints;
  last_update: string;
}

function argValue(flag: string): string | null {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] ?? null : null;
}

const server = argValue("--server");
const specHash = argValue("--spec-hash");
const scopeByFingerprint = process.argv.includes("--scope-by-fingerprint");
const checkOnly = process.argv.includes("--check");
const allowPending = process.argv.includes("--allow-pending");
const deltaClassArg = argValue("--delta-class");
const deltaClass: "patch" | "editorial" | "minor" | "major" =
  deltaClassArg === "patch" || deltaClassArg === "editorial" || deltaClassArg === "minor" || deltaClassArg === "major"
    ? deltaClassArg
    : "major";

const serverDirArg = argValue("--server-dir");
const verifyDeployed = process.argv.includes("--verify-deployed");
// REQ-394a inputs. `--delta-report` is the `spec-delta.ts` report (an input
// file, shape `{ requirements_changed: { added, removed, modified } }`);
// `--coverage-register` lets a fixture point derivation at a synthetic
// register; `--dispositions` carries operator-authored rows.
const deltaReportPath = argValue("--delta-report");
const coverageRegisterPath = argValue("--coverage-register") ?? COVERAGE_REGISTER;
const dispositionsPath = argValue("--dispositions");

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

// REQ-394a permits a required reconciliation to be deferred only by a dated
// operator record naming this server and the verification performed. The date
// must be today, so a stale acknowledgement cannot silently cover a new delta.
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

// REQ-314b — the reconciliation action each changed component requires. The
// fixed component order keeps the advice stable across runs; config and
// lockfile share one rule, stated once.
function scopingAdvice(changed: string[]): string {
  const set = new Set(changed);
  const parts: string[] = [];
  const push = (text: string): void => { if (!parts.includes(text)) parts.push(text); };
  for (const component of ["source", "config", "lockfile", "extraction", "surfaces"]) {
    if (!set.has(component)) continue;
    if (component === "source") push("typecheck then Pattern Buffer sub-workflows for the changed surfaces");
    else if (component === "config" || component === "lockfile") push("dependency reinstall and typecheck only");
    else if (component === "extraction") push("re-index generation data only, reusing prior extraction output");
    else push("Pattern Buffer sub-workflows for the changed tools, resources, or prompts");
  }
  return parts.length > 0 ? parts.join("; ") : "none";
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

// ── REQ-394a disposition derivation ─────────────────────────────────────────

interface ChangedReqs {
  added: string[];
  removed: string[];
  modified: string[];
}

interface RegisterRow {
  bucket: string;
  tests: string;
}

// Delta IDs are bare suffixes including sub-parts ("032c"); register rows are
// base IDs ("REQ-032"). Normalize to `REQ-<suffix>` and collapse to the base
// for lookup: a sub-part inherits its base row's bucket.
function normalizeReq(raw: string): string {
  const trimmed = raw.trim();
  const prefixed = trimmed.startsWith("REQ-") ? trimmed : `REQ-${trimmed}`;
  return /^REQ-\d+[a-z0-9]*$/.test(prefixed) ? prefixed : trimmed;
}

function baseReq(req: string): string {
  const match = /^REQ-(\d+)/.exec(req);
  return match ? `REQ-${match[1]}` : req;
}

function hasExercisedTests(cell: string): boolean {
  return cell.replace(/[—–-]/g, "").trim().length > 0;
}

function loadRegister(path: string): Map<string, RegisterRow> | null {
  if (!existsSync(path)) return null;
  const rows = new Map<string, RegisterRow>();
  for (const line of readFileSync(path, "utf-8").split("\n")) {
    const match = /^\|\s*(REQ-\d+[a-z0-9]*)\s*\|[^|]*\|[^|]*\|\s*([A-E])\s*\|([^|]*)\|/.exec(line);
    if (match) rows.set(match[1], { bucket: match[2], tests: match[3].trim() });
  }
  return rows;
}

// Operator-authored rows: a Markdown table `| REQ | Disposition | Evidence |`.
// Only rows whose disposition is one of the three REQ-394a kinds are read.
function loadOperatorDispositions(path: string): Map<string, ReqDisposition> | null {
  if (!existsSync(path)) return null;
  const rows = new Map<string, ReqDisposition>();
  for (const line of readFileSync(path, "utf-8").split("\n")) {
    const cells = line.split("|").slice(1, -1).map((cell) => cell.trim());
    if (cells.length < 2) continue;
    const req = normalizeReq(cells[0]);
    if (!/^REQ-\d+[a-z0-9]*$/.test(req)) continue;
    const disposition = cells[1].toLowerCase();
    if (disposition !== "implemented" && disposition !== "deferred" && disposition !== "waived") continue;
    rows.set(req, { req, disposition: disposition as ReqDispositionKind, evidence: cells[2] || "operator-authored" });
  }
  return rows;
}

function loadDeltaReport(path: string): ChangedReqs | null {
  if (!existsSync(path)) return null;
  try {
    const parsed = JSON.parse(readFileSync(path, "utf-8")) as { requirements_changed?: Partial<ChangedReqs> };
    const changed = parsed.requirements_changed;
    if (!changed) return null;
    return { added: changed.added ?? [], removed: changed.removed ?? [], modified: changed.modified ?? [] };
  } catch {
    // An unreadable report is an absent report: the caller blocks with a name
    // for the missing input rather than deriving from a partial parse.
    return null;
  }
}

function compareReq(a: ReqDisposition, b: ReqDisposition): number {
  const left = Number.parseInt(/^REQ-(\d+)/.exec(a.req)?.[1] ?? "0", 10);
  const right = Number.parseInt(/^REQ-(\d+)/.exec(b.req)?.[1] ?? "0", 10);
  return left - right || a.req.localeCompare(b.req);
}

interface Derivation {
  dispositions: ReqDisposition[];
  missing: string[];
}

// Sweep order (pass-5 M2): removal → derivation → block. Deferral is checked by
// the caller first, so an operator deferral still satisfies REQ-394a.
function deriveDispositions(
  changed: ChangedReqs,
  register: Map<string, RegisterRow> | null,
  operator: Map<string, ReqDisposition> | null,
  registerLabel: string,
): Derivation {
  const dispositions = new Map<string, ReqDisposition>();
  const missing: string[] = [];

  // A removed REQ cannot appear in a register regenerated from the current
  // spec, and REQ-394a requires a disposition for every REQ the delta changed.
  const removed = new Set(changed.removed.map(normalizeReq));
  for (const req of removed) {
    dispositions.set(
      req,
      operator?.get(req) ?? { req, disposition: "waived", evidence: "removed from the specification" },
    );
  }

  const candidates = [...new Set([...changed.added, ...changed.modified].map(normalizeReq))].sort();
  for (const req of candidates) {
    if (removed.has(req)) continue;
    // An operator row wins over derivation: it is the documented channel for a
    // judgement the committed evidence cannot express (pass-5 B3).
    const authored = operator?.get(req) ?? operator?.get(baseReq(req));
    if (authored) {
      dispositions.set(req, { ...authored, req });
      continue;
    }
    if (!register) {
      missing.push(`${req} (no coverage register at ${registerLabel})`);
      continue;
    }
    const row = register.get(baseReq(req));
    if (!row) {
      missing.push(`${req} (absent from ${registerLabel})`);
      continue;
    }
    if (row.bucket === "C" || row.bucket === "D") {
      dispositions.set(req, {
        req,
        disposition: "implemented",
        evidence: row.bucket === "C" ? "bucket C (cited, exercised)" : "bucket D (cited, no Check:)",
      });
    } else if (row.bucket === "E") {
      dispositions.set(req, hasExercisedTests(row.tests)
        ? { req, disposition: "implemented", evidence: "bucket E with exercised tests on record" }
        : { req, disposition: "waived", evidence: "bucket E (intended gap, no exercised test)" });
    } else {
      missing.push(`${req} (bucket ${row.bucket}; requires an operator disposition)`);
    }
  }

  return { dispositions: [...dispositions.values()].sort(compareReq), missing: missing.sort() };
}

if (!server) {
  console.error("Usage: npx tsx scripts/update-server.ts --server <name> [--spec-hash <hash>] [--scope-by-fingerprint] [--delta-class patch|editorial|minor|major] [--delta-report <path>] [--coverage-register <path>] [--dispositions <path>] [--server-dir <path>] [--verify-deployed] [--check] [--allow-pending]");
  process.exit(1);
}

const serverName = server;
// The name is interpolated into paths and console messages; accept only the
// slug shape (CR-17).
if (!/^[a-z0-9-]+$/.test(serverName)) {
  console.error(`Invalid --server '${serverName}': expected a lowercase slug ([a-z0-9-]+).`);
  process.exit(1);
}
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

  // A zero-change publication still records the delta ("none"), so the Spec
  // Update entry can state that no component changed (REQ-394a).
  const writeNoneDelta = (deferred: boolean): void =>
    writeDeltaRecord({
      spec_hash: currentHash,
      prior_spec_hash: previous.spec_hash ?? null,
      changed: [],
      unchanged: delta.unchanged,
      changed_count: 0,
      scoping: "none",
      deferred,
      dispositions: [],
      advice: scopingAdvice([]),
      reused: delta.unchanged,
      current: currentFingerprints,
      prior: previous.fingerprints,
    });

  if (pendingUpdate) {
    console.log(`\nPENDING UPDATE: spec ${deltaClass} delta but no implementation fingerprints changed.`);
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
    writeNoneDelta(true);
    reconcile(currentHash, currentFingerprints);
    process.exit(0);
  }

  if (delta.changedCount === 0) {
    console.log("Spec hash changed (patch-class) with no implementation fingerprints changed — nothing to reconcile.");
    if (checkOnly) { console.log("  (check mode — no write)"); process.exit(0); }
    writeNoneDelta(false);
    reconcile(currentHash, currentFingerprints);
    process.exit(0);
  }

  // Check mode never derives and never writes: the pre-push hook runs it on
  // every push and must not block on a record authored after the gate.
  if (checkOnly) { process.exit(0); }

  // REQ-394a — a Minor/Major delta whose implementation fingerprints advanced
  // needs a reconciliation record. A dated operator deferral is checked first
  // (pass-5 M1), so the operator can satisfy the requirement the way the REQ
  // states. Reconcile only after a complete record: an incomplete one leaves
  // the baseline untouched, so a failed run can never be recorded as applied.
  const scoping = scopingFor(delta.changedCount, true);
  const requiresEvidence = deltaClass === "minor" || deltaClass === "major";
  // HOLONOVEL_DECISIONS_DIR isolates the record lookup for the harness (the
  // same way HOLONOVEL_STATE_DIR isolates the fingerprint baseline).
  const decisionsDir = process.env.HOLONOVEL_DECISIONS_DIR ?? serverDir;
  let deferred = false;
  let dispositions: ReqDisposition[] = [];

  if (requiresEvidence) {
    if (hasRecordedDeferral(decisionsDir, server)) {
      deferred = true;
    } else {
      const changedReqs = deltaReportPath ? loadDeltaReport(deltaReportPath) : null;
      const register = loadRegister(coverageRegisterPath);
      const operator = dispositionsPath ? loadOperatorDispositions(dispositionsPath) : null;
      const derivation = changedReqs
        ? deriveDispositions(changedReqs, register, operator, coverageRegisterPath)
        : { dispositions: [], missing: ["the changed-REQ set (no readable --delta-report)"] };
      dispositions = derivation.dispositions;

      if (derivation.missing.length > 0) {
        // Record the incomplete table for inspection, but do not reconcile.
        writeDeltaRecord({
          spec_hash: currentHash,
          prior_spec_hash: previous.spec_hash ?? null,
          changed: delta.changed,
          unchanged: delta.unchanged,
          changed_count: delta.changedCount,
          scoping,
          deferred: false,
          dispositions,
          advice: scopingAdvice(delta.changed),
          reused: delta.unchanged,
          current: currentFingerprints,
          prior: previous.fingerprints,
        });
        console.error(`\nUPDATE REQUIRED: spec ${deltaClass} delta advanced ${delta.changedCount} fingerprint component(s) (${delta.changed.join(", ")}); scoping: ${scoping}.`);
        console.error(`Reconciliation record is incomplete — no disposition for: ${derivation.missing.join("; ")}.`);
        console.error(`Publication is blocked until every changed REQ has a disposition (REQ-394a).`);
        console.error(`  Derive from committed evidence: npm run validate -- --write-register`);
        console.error(`  Or author the rows in a dispositions table and pass --dispositions <path>.`);
        console.error(`  Or record a dated deferral in ${join(decisionsDir, "DECISIONS.md")}:`);
        console.error(`- **Update-deferred:** ${server} ${localDate()} — <revision range and verification performed>`);
        process.exit(1);
      }
      console.log(`\nReconciliation record: ${dispositions.length} changed REQ(s) dispositioned.`);
    }
  }

  if (scoping === "full") {
    console.log(`>2 components changed — full reconciliation scope.`);
  } else if (scoping === "scoped") {
    console.log(`Only ${delta.changed[0]} changed — scoped reconciliation: ${scopingAdvice(delta.changed)}.`);
  } else {
    console.log(`${delta.changedCount} components changed — partial reconciliation: ${scopingAdvice(delta.changed)}.`);
  }

  writeDeltaRecord({
    spec_hash: currentHash,
    prior_spec_hash: previous.spec_hash ?? null,
    changed: delta.changed,
    unchanged: delta.unchanged,
    changed_count: delta.changedCount,
    scoping,
    deferred,
    dispositions,
    advice: scopingAdvice(delta.changed),
    reused: delta.unchanged,
    current: currentFingerprints,
    prior: previous.fingerprints,
  });
  reconcile(currentHash, currentFingerprints);
  if (deferred) {
    console.log("\nFingerprints saved. Reconciliation deferred with a dated DECISIONS.md acknowledgement (REQ-394a).");
  } else {
    console.log("\nFingerprints saved. Reconciliation recorded — no implementation rewrite required.");
  }
  process.exit(0);
}

if (checkOnly) {
  console.log(`\nNo stored fingerprints — cannot determine pending-update status.`);
  process.exit(1);
}

if (previous) {
  // Unscoped run over an existing baseline: REQ-394a would be enforced on a
  // set this mode never computes, so refuse rather than reconcile blindly.
  console.error(`\nUnscoped update with a stored baseline: pass --scope-by-fingerprint (REQ-394a).`);
  process.exit(1);
}

// Seed: no stored baseline, so no fingerprint advanced and there is nothing to
// evidence — REQ-394a applies to an advance. Record the baseline without one.
const seed = compareFingerprints(currentFingerprints, undefined);
console.log(`\nFull reconciliation scope (no stored fingerprints): seeding the baseline.`);
writeDeltaRecord({
  spec_hash: currentHash,
  prior_spec_hash: null,
  changed: seed.changed,
  unchanged: seed.unchanged,
  changed_count: seed.changedCount,
  scoping: "seed",
  deferred: false,
  dispositions: [],
  advice: scopingAdvice(seed.changed),
  reused: seed.unchanged,
  current: currentFingerprints,
  prior: null,
});
reconcile(currentHash, currentFingerprints);
console.log("Fingerprints saved (seed).");
process.exit(0);
