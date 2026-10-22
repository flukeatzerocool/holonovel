#!/usr/bin/env npx tsx
/**
 * generate-world-provider.ts — emit the world-model provider document. [build tool; --check = gate]
 *
 * Purpose: render `narrative_world_model/world/world-model-provider.md` from the
 * authored template plus the host's world-model schema constants
 * (`WORLD_MODEL_KINDS`, `WORLD_MODEL_PROPERTIES`, `BASE_PARSER_COMMANDS`,
 * `WORLD_MODEL_DECLARABLE_KINDS`, `ROOM_DIRECTIONS`, `verbCatalog`). Emission is
 * byte-deterministic — no timestamps or version stamps — so the committed
 * artifact is freshness-gated in `--check` mode.
 *
 * Exit codes: 0 = written / in sync, 1 = `--check` found drift or the template
 * has an unresolved/unknown token, 2 = fatal (unreadable template or schema).
 *
 * Usage: npx tsx scripts/generate-world-provider.ts [--check] [--dry-run] [--help]
 * REQ-200, REQ-202a.
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  WORLD_MODEL_KINDS,
  WORLD_MODEL_PROPERTIES,
  WORLD_MODEL_DECLARABLE_KINDS,
  BASE_PARSER_COMMANDS,
  ROOM_DIRECTIONS,
  verbCatalog,
} from "../src/world/model.js";

const SERVER_DIR = join(import.meta.dirname, "..");
const TEMPLATE_PATH = join(SERVER_DIR, "narrative_world_model", "world", "world-model-provider.template.md");
const OUTPUT_PATH = join(SERVER_DIR, "narrative_world_model", "world", "world-model-provider.md");

const argv = process.argv.slice(2);
if (argv.includes("--help") || argv.includes("-h")) {
  console.log("Usage: npx tsx scripts/generate-world-provider.ts [--check] [--dry-run] [--help]");
  console.log("  --check    Compare the committed document against a fresh render; exit 1 on drift.");
  console.log("  --dry-run  Report the target and byte count without writing.");
  process.exit(0);
}
const known = new Set(["--check", "--dry-run"]);
const unknown = argv.filter((a) => !known.has(a));
if (unknown.length > 0) {
  console.error(`Unknown flag: ${unknown[0]}`);
  process.exit(1);
}
const checkOnly = argv.includes("--check");
const dryRun = argv.includes("--dry-run");

if (!existsSync(TEMPLATE_PATH)) {
  console.error(`FATAL: provider template not found: ${TEMPLATE_PATH}`);
  process.exit(2);
}

const kindHierarchy = (): string => {
  const lines = ["| Kind | Parent | Description |", "|---|---|---|"];
  for (const [kind, def] of Object.entries(WORLD_MODEL_KINDS)) {
    lines.push(`| ${kind} | ${def.parent ?? "(root)"} | ${def.description} |`);
  }
  return lines.join("\n");
};

const propertyContracts = (): string => {
  const lines: string[] = [];
  let group = "";
  for (const prop of WORLD_MODEL_PROPERTIES) {
    if (prop.group !== group) {
      if (lines.length > 0) lines.push("");
      lines.push(`### ${prop.group}`, "", "| Property | Values | Applies to | Contract |", "|---|---|---|---|");
      group = prop.group;
    }
    const appliesTo = prop.doc === "all-things" ? "all things" : prop.doc.join(", ");
    lines.push(`| ${prop.name} | ${prop.values} | ${appliesTo} | ${prop.contract} |`);
  }
  return lines.join("\n");
};

const parserCommands = (): string => {
  const lines = ["| Command | Args | Effect |", "|---|---|---|"];
  for (const cmd of BASE_PARSER_COMMANDS) {
    lines.push(`| \`${cmd.verb}\` | ${cmd.args.length > 0 ? cmd.args.join(", ") : "—"} | ${cmd.effect} |`);
  }
  return lines.join("\n");
};

const verbTiers = (): string => {
  const tiers = verbCatalog(undefined);
  const format = (verbs: { verb: string; available: boolean }[]) =>
    verbs.map((v) => v.verb).join(", ") || "none";
  return [
    `- core (${tiers.core.length}): ${format(tiers.core)}`,
    `- standard (${tiers.standard.length}): ${format(tiers.standard)}`,
    `- extended (${tiers.extended.length}): ${format(tiers.extended)}`,
  ].join("\n");
};

const propertySetters = (): string => {
  const lines: string[] = [];
  for (const prop of WORLD_MODEL_PROPERTIES) {
    const named = (prop.settersNamed ?? []).map((s) => `\`<thing> ${s}.\``);
    const current = (prop.settersCurrent ?? []).map((s) => `\`${s}.\``);
    const forms = [...named, ...current];
    if (forms.length === 0) continue;
    lines.push(`- **${prop.name}** — ${forms.join(" · ")}`);
  }
  return lines.join("\n");
};

const replacements: Record<string, string> = {
  KIND_HIERARCHY: kindHierarchy(),
  PROPERTY_CONTRACTS: propertyContracts(),
  PARSER_COMMANDS: parserCommands(),
  VERB_TIERS: verbTiers(),
  KIND_LIST: WORLD_MODEL_DECLARABLE_KINDS.join(", "),
  DIRECTION_LIST: ROOM_DIRECTIONS.join(", "),
  PROPERTY_SETTERS: propertySetters(),
};

let rendered: string;
try {
  rendered = readFileSync(TEMPLATE_PATH, "utf-8");
} catch (e) {
  console.error(`FATAL: cannot read template: ${(e as Error).message}`);
  process.exit(2);
}

for (const [token, value] of Object.entries(replacements)) {
  rendered = rendered.split(`{{${token}}}`).join(value);
}

const unresolved = rendered.match(/\{\{[A-Z_]+\}\}/g);
if (unresolved) {
  console.error(`FAIL: unresolved template token(s): ${[...new Set(unresolved)].join(", ")}`);
  process.exit(1);
}

if (dryRun) {
  console.log(`[dry-run] would write ${OUTPUT_PATH} (${Buffer.byteLength(rendered, "utf-8")} bytes)`);
  process.exit(0);
}

if (checkOnly) {
  if (!existsSync(OUTPUT_PATH)) {
    console.error(`STALE: ${OUTPUT_PATH} is missing — run \`npm run generate-world-provider\`.`);
    process.exit(1);
  }
  const committed = readFileSync(OUTPUT_PATH, "utf-8");
  if (committed !== rendered) {
    console.error("STALE: world-model-provider.md does not match the provider schema.");
    console.error("Fix: npm run generate-world-provider");
    process.exit(1);
  }
  console.log("World-model provider document is fresh.");
  process.exit(0);
}

try {
  writeFileSync(OUTPUT_PATH, rendered);
} catch (e) {
  console.error(`FATAL: cannot write ${OUTPUT_PATH}: ${(e as Error).message}`);
  process.exit(2);
}
console.log(`Wrote ${OUTPUT_PATH} (${Buffer.byteLength(rendered, "utf-8")} bytes).`);
process.exit(0);
