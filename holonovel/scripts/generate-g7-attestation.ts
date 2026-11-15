#!/usr/bin/env npx tsx
/**
 * generate-g7-attestation.ts — emit the G7 narrative-coherence attestation
 * data and the §5.12 disposition table. [build tool; --check = gate]
 *
 * Purpose: REQ-346b derives the `spec_health.narrative_coherence` disposition
 * from every server-side §5.12 REQ. The list must come from the spec, not a
 * literal, and the attested set must come from the coverage register, not a
 * hand-kept copy. This tool reads the assembled spec (§5.12 bodies and their
 * parent IDs), the §5.12 rows of `spec/audit/req-coverage.md`, and the authored
 * `narrative_coherence` attestation prose in `holonovel/DECISIONS.md`, then:
 *
 *   1. writes `holonovel/src/generated/g7-attestation.ts` (IDs, attested
 *      parents, attestation flag, spec hash); and
 *   2. rewrites the markdown table between `<!-- g7:start -->` and
 *      `<!-- g7:end -->` in the attestation block with one row per §5.12 body.
 *
 * Only the table is generated. The §8 evidence fields, the three attestation
 * points, and the smoke-session link are authored prose outside the markers, so
 * the emitted text stays byte-deterministic — no timestamps, no version stamps.
 * A builder-side body (its text obliges "the builder", e.g. REQ-346a1/a2) is
 * listed but excluded from the server-side count, as REQ-346b specifies.
 *
 * Usage: npx tsx holonovel/scripts/generate-g7-attestation.ts [--check] [--dry-run] [--help]
 * Exit codes: 0 = written / in sync, 1 = `--check` found drift or a spec/register
 * disagreement, 2 = fatal (unreadable input).
 * REQ-346, REQ-346b.
 */

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { extractReqBodies } from "../../scripts/lib/parse-spec.js";

const SERVER_DIR = join(import.meta.dirname, "..");
const ROOT = join(SERVER_DIR, "..");
const SPEC_PATH = join(SERVER_DIR, "holonovel.md");
const REGISTER_PATH = join(ROOT, "spec", "audit", "req-coverage.md");
const DECISIONS_PATH = join(SERVER_DIR, "DECISIONS.md");
const OUT_PATH = join(SERVER_DIR, "src", "generated", "g7-attestation.ts");

const START_MARKER = "<!-- g7:start -->";
const END_MARKER = "<!-- g7:end -->";
const SECTION = "### 5.12 ";
const ATTESTATION_HEADING = "#### narrative_coherence (G7)";

const USAGE = `Usage: npx tsx holonovel/scripts/generate-g7-attestation.ts [--check] [--dry-run] [--help]

  --check    Compare the committed artifacts against a fresh render; exit 1 on drift.
  --dry-run  Report the targets and counts without writing.
  --help     Show this message.

Exit codes: 0 = written / in sync, 1 = drift or a spec/register disagreement, 2 = fatal.`;

const argv = process.argv.slice(2);
if (argv.includes("--help") || argv.includes("-h")) {
  console.log(USAGE);
  process.exit(0);
}
const known = new Set(["--check", "--dry-run"]);
const unknown = argv.filter((a) => !known.has(a));
if (unknown.length > 0) {
  console.error(`Unknown flag: ${unknown[0]}`);
  console.error(USAGE);
  process.exit(1);
}
const checkOnly = argv.includes("--check");
const dryRun = argv.includes("--dry-run");

function fatal(message: string): never {
  console.error(`FATAL: ${message}`);
  process.exit(2);
}

function read(path: string): string {
  if (!existsSync(path)) fatal(`missing input: ${path}`);
  try {
    return readFileSync(path, "utf-8");
  } catch (error) {
    fatal(`cannot read ${path}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

interface Body {
  id: string;
  parent: string;
  builderSide: boolean;
}

function section512Slice(spec: string): string {
  const start = spec.indexOf(`\n${SECTION}`);
  if (start === -1) fatal(`the assembled spec has no "${SECTION.trim()}" heading`);
  const end = spec.indexOf("\n### ", start + 1);
  return spec.slice(start, end === -1 ? undefined : end);
}

// A builder-side body obliges the builder or defines a handoff defect
// (REQ-346a1/a2); those cannot be satisfied by the server runtime and are
// excluded from the disposition count.
const BUILDER_SIDE = /\bthe builder SHALL\b|\bhandoff defect\b/;
function parseBodies(slice: string): Body[] {
  return [...extractReqBodies(slice).values()].map(({ id, body }) => ({
    id,
    parent: id.match(/^REQ-\d+/)![0],
    builderSide: BUILDER_SIDE.test(body),
  }));
}

function registerDispositions(text: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const line of text.split("\n")) {
    if (!line.startsWith("| REQ-")) continue;
    const cells = line.split("|").map((c) => c.trim());
    if (cells.length < 8) continue;
    const id = cells[1]!;
    if (!/^REQ-\d+$/.test(id)) continue;
    if (!/^5\.12\b/.test(cells[3] ?? "")) continue;
    out.set(id, cells[6] ?? "");
  }
  return out;
}

function attestationBlock(decisions: string): string {
  const start = decisions.indexOf(ATTESTATION_HEADING);
  if (start === -1) fatal(`DECISIONS.md has no "${ATTESTATION_HEADING}" heading`);
  const rest = decisions.slice(start + ATTESTATION_HEADING.length);
  const end = rest.search(/\n#{3,4} /);
  return end === -1 ? rest : rest.slice(0, end);
}

const spec = read(SPEC_PATH);
const slice = section512Slice(spec);
const bodies = parseBodies(slice);
if (bodies.length === 0) fatal("§5.12 parsed zero REQ bodies");

const dispositions = registerDispositions(read(REGISTER_PATH));
const specParents = [...new Set(bodies.map((b) => b.parent))].sort();
const registerParents = [...dispositions.keys()].sort();

const missingRows = specParents.filter((p) => !dispositions.has(p));
const orphanRows = registerParents.filter((p) => !specParents.includes(p));
if (missingRows.length > 0) {
  console.error(`FATAL: §5.12 parents with no coverage-register row: ${missingRows.join(", ")}`);
  process.exit(1);
}
if (orphanRows.length > 0) {
  console.error(`FATAL: coverage-register §5.12 rows absent from the spec: ${orphanRows.join(", ")}`);
  process.exit(1);
}

const attestedParents = registerParents.filter((p) => dispositions.get(p) === "implemented");
const decisions = read(DECISIONS_PATH);
const block = attestationBlock(decisions);
const authored = block.replace(new RegExp(`${START_MARKER}[\\s\\S]*?${END_MARKER}`, "g"), "");
const attestationRecorded = ["(a)", "(b)", "(c)"].every((point) => authored.includes(point))
  && /smoke-session/.test(authored);

const serverBodies = bodies.filter((b) => !b.builderSide);
const specHash = createHash("sha256").update(readFileSync(SPEC_PATH)).digest("hex");
const sourceHash = createHash("sha256")
  .update(`${slice}\n${registerParents.join(",")}\n${authored}`)
  .digest("hex");

const table = [
  "| §5.12 REQ | Parent | Disposition |",
  "|---|---|---|",
  ...bodies.map((body) => {
    const attested = attestedParents.includes(body.parent);
    const state = body.builderSide
      ? (attested ? "attested (builder-side)" : "unattested (builder-side)")
      : (attested ? "implemented" : "unimplemented");
    return `| ${body.id} | ${body.parent} | ${state} |`;
  }),
].join("\n");

const moduleText = [
  "// Generated by holonovel/scripts/generate-g7-attestation.ts — do not edit by hand.",
  "// Regenerated by running this script without `--check` when §5.12 or the coverage",
  "// register moves. Byte-deterministic: no timestamps or version stamps.",
  `export const SPEC_HASH = ${JSON.stringify(specHash)};`,
  `export const SOURCE_HASH = ${JSON.stringify(sourceHash)};`,
  `export const ATTESTATION_RECORDED = ${attestationRecorded ? "true" : "false"};`,
  `export const SPEC_512_REQS = ${JSON.stringify(bodies.map((b) => b.id), null, 2)} as const;`,
  `export const SERVER_512_REQS = ${JSON.stringify(serverBodies.map((b) => b.id), null, 2)} as const;`,
  `export const ATTESTED_PARENTS = ${JSON.stringify(attestedParents, null, 2)} as const;`,
  "",
].join("\n");

function withTable(text: string): string {
  const start = text.indexOf(START_MARKER);
  const end = text.indexOf(END_MARKER);
  const rendered = `${START_MARKER}\n${table}\n${END_MARKER}`;
  if (start !== -1 && end > start) return text.slice(0, start) + rendered + text.slice(end + END_MARKER.length);
  const heading = text.indexOf(ATTESTATION_HEADING);
  if (heading === -1) fatal("cannot place the generated table: attestation heading not found");
  const after = text.indexOf("\n### ", heading);
  const insertAt = after === -1 ? text.length : after;
  return `${text.slice(0, insertAt)}\n${rendered}\n${text.slice(insertAt)}`;
}

const nextDecisions = withTable(decisions);
const drift: string[] = [];
const committedModule = existsSync(OUT_PATH) ? readFileSync(OUT_PATH, "utf-8") : "";
if (committedModule !== moduleText) drift.push(OUT_PATH);
if (nextDecisions !== decisions) drift.push(`${DECISIONS_PATH} (generated table)`);

const summary = `§5.12 bodies ${bodies.length} (server-side ${serverBodies.length}, builder-side ${bodies.length - serverBodies.length}); attested parents ${attestedParents.length}/${specParents.length}; attestation ${attestationRecorded ? "recorded" : "missing"}`;

if (checkOnly) {
  if (drift.length > 0) {
    console.error(`stale: ${drift.join(", ")}`);
    console.error(`${summary}. Re-run without --check: npx tsx holonovel/scripts/generate-g7-attestation.ts`);
    process.exit(1);
  }
  console.log(`g7 attestation current — ${summary}`);
  process.exit(0);
}

if (dryRun) {
  console.log(`would write ${OUT_PATH} (${moduleText.length} bytes)`);
  if (nextDecisions !== decisions) console.log(`would rewrite the generated table in ${DECISIONS_PATH}`);
  console.log(summary);
  process.exit(0);
}

mkdirSync(join(SERVER_DIR, "src", "generated"), { recursive: true });
writeFileSync(OUT_PATH, moduleText);
if (nextDecisions !== decisions) writeFileSync(DECISIONS_PATH, nextDecisions);
console.log(`wrote ${OUT_PATH}`);
console.log(summary);
