#!/usr/bin/env npx tsx
/**
 * check-server-manifest.ts — registry manifest schema gate (REQ-428). [gate]
 *
 * Validates `holonovel/server.json` against the vendored MCP registry schema
 * (`holonovel/schemas/mcp-server.schema.json`) and fails when the manifest is
 * invalid, when the schema is missing, or when the schema uses a key the
 * validator does not implement (so a refresh cannot silently skip an
 * assertion).
 *
 * Usage: npx tsx scripts/check-server-manifest.ts [--help]
 * Exit codes: 0 = valid, 1 = invalid manifest or unsupported schema key,
 *             2 = fatal (unreadable file).
 */
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { validateManifest, unsupportedKeywords } from "./lib/server-manifest.js";

const USAGE = `check-server-manifest.ts — validate holonovel/server.json against the vendored registry schema.

Usage: npx tsx scripts/check-server-manifest.ts [--root <dir>]
  --root <dir>  Read <dir>/holonovel/{server.json,schemas/...} instead of this checkout.
Exit codes: 0 = valid, 1 = invalid, 2 = fatal.
`;

const argv = process.argv.slice(2);
if (argv.includes("--help") || argv.includes("-h")) {
  console.log(USAGE);
  process.exit(0);
}
const rootIdx = argv.indexOf("--root");
if (rootIdx >= 0 && (rootIdx === argv.length - 1 || argv[rootIdx + 1].startsWith("-"))) {
  console.error(`--root requires a directory\n\n${USAGE}`);
  process.exit(1);
}
const known = new Set(["--root"]);
const unknown = argv.filter((arg, index) => index !== rootIdx + 1 && !known.has(arg));
if (unknown.length > 0) {
  console.error(`unknown argument: ${unknown[0]}\n\n${USAGE}`);
  process.exit(1);
}

const root = rootIdx >= 0 ? resolve(argv[rootIdx + 1]) : join(import.meta.dirname, "..");
const manifestPath = join(root, "holonovel", "server.json");
const schemaPath = join(root, "holonovel", "schemas", "mcp-server.schema.json");

function readJson(path: string): unknown {
  try {
    return JSON.parse(readFileSync(path, "utf-8"));
  } catch (error) {
    console.error(`check-server-manifest: cannot read ${path}: ${(error as Error).message}`);
    process.exit(2);
  }
}

const manifest = readJson(manifestPath);
const schema = readJson(schemaPath);

const unsupported = unsupportedKeywords(schema);
if (unsupported.length > 0) {
  console.error(
    `check-server-manifest: the vendored schema uses keys the validator does not implement: ${unsupported.join(", ")}`,
  );
  console.error("  Extend scripts/lib/server-manifest.ts (see holonovel/schemas/PROVENANCE.md).");
  process.exit(1);
}

const result = validateManifest(manifest, schema);
if (!result.ok) {
  console.error("check-server-manifest: holonovel/server.json is invalid:");
  for (const error of result.errors) console.error(`  ${error}`);
  process.exit(1);
}

console.log(`check-server-manifest: server.json valid against 2025-12-11 (${unsupported.length} unsupported keys)`);
