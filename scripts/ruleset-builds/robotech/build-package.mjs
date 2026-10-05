#!/usr/bin/env node
// build-package.mjs — emit the declarative `robotech` ruleset package. [build tool]
//
// Role: build tool. Assembles the six-file declarative package (REQ-389) for the
// Robotech (Palladium Books) ruleset from the Discovery output
// (`build/extract-robotech.json`) and writes it to the host install directory
// (Build workflow §6.4.2). Tool schemas are namespaced by the host with the
// `robotech_` prefix (REQ-379); the package stores unprefixed tool names, matching
// the swse/dnd2024 convention.
//
// Usage:
//   node build/build-package.mjs [--extract <file>] [--out <dir>] [--install] [--dry-run] [--no-backup]
//
// Exit codes: 0 = package written (or dry-run), 1 = build failure, 2 = fatal.

import * as fs from "node:fs";
import * as path from "node:path";
import { computeContentHash, readPackageFormat, readHostVersion } from "../../lib/ruleset-package.mjs";

const ROOT = path.dirname(import.meta.dirname);
const DEPLOYED = process.env.HOLONOVEL_DEPLOYED ?? "/home/fluke/Holonovel-deployed";
// Canonical converted sources + extract live in the Robotech content pipeline;
// override with ROBOTECH_CONTENT_DIR when they move.
const CONTENT_ROOT = process.env.ROBOTECH_CONTENT_DIR ?? "/home/fluke/Documents/Robotech-TTRPG";
const SLUG = "robotech";
const NAME = "Robotech (Palladium Books)";
const PACKAGE_FILES = ["manifest.json", "index.json", "model.json", "tools.json", "resources.json", "prompts.json"];
const INSTALL_ROOT = process.env.TTRPG_RULESET_DIRS ?? path.join(DEPLOYED, "holonovel", ".holonovel-state", "rulesets");

function parseArgs(argv) {
  const o = { extract: path.join(CONTENT_ROOT, "build", "extract-robotech.json"), out: null, install: false, dryRun: false, backup: true, help: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--extract") o.extract = argv[++i];
    else if (a === "--out") o.out = argv[++i];
    else if (a === "--install") o.install = true;
    else if (a === "--dry-run") o.dryRun = true;
    else if (a === "--no-backup") o.backup = false;
    else if (a === "-h" || a === "--help") o.help = true;
    else { console.error(`build-package: unknown flag '${a}'`); process.exit(1); }
  }
  return o;
}

const opts = parseArgs(process.argv.slice(2));
if (opts.help) {
  console.log("Usage: node build/build-package.mjs [--extract <file>] [--out <dir>] [--install] [--dry-run] [--no-backup]");
  process.exit(0);
}

const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf-8"));

const GEN_FINGERPRINTS = path.join(DEPLOYED, "holonovel", "src", "generated", "contract-fingerprints.ts");

const LOOKUP = (name, title, subject, collection, example) => ({
  name,
  title,
  description: `Look up a ${subject} by name. Use when: resolving a ${subject}'s rules entry. Do NOT use when: the name is unknown — use search_rules; or when rolling — use the roll_* tools. Mutation class: read-only — reads the bound ruleset's indexed data only; no state change, no audit entry, and no badge change. Returns: the ${subject} entry with its source anchor, or [ERROR] [NOT_FOUND] with a 'Did you mean?' hint and the valid names.`,
  kind: "lookup",
  collection,
  inputSchema: {
    type: "object",
    properties: { key: { type: "string", description: `Normalized ${subject} name (e.g. ${example}).` } },
    required: ["key"],
  },
});

const TOOLS = [
  {
    name: "search_rules",
    title: "Search Rules",
    description: "Search the Robotech ruleset for a term or phrase across all indexed sections. Use when: the exact section, entry, or term is unknown. Do NOT use when: the entity type is known — use the matching lookup_<type> tool for a canonical result. Mutation class: read-only — reads the bound ruleset's indexed data only; no state change, no audit entry, and no badge change. Returns: ranked matching entries with source anchors, or [ERROR] [NOT_FOUND] when nothing matches.",
    kind: "search",
    inputSchema: { type: "object", properties: { query: { type: "string", description: "Term or phrase to search for." }, max_results: { type: "number", description: "Maximum results to return (default 10)." } }, required: ["query"] },
  },
  LOOKUP("lookup_concept", "Look Up Concept", "concept", "concepts", "'mega-damage', 's.d.c.'"),
  LOOKUP("lookup_mecha", "Look Up Mecha", "mecha or vehicle", "mecha", "'vf-1d veritech', 'excalibur destroid'"),
  LOOKUP("lookup_weapon", "Look Up Weapon", "weapon", "weapons", "'gu-11 gun pod', '90mm recoilless rifle'"),
  LOOKUP("lookup_skill", "Look Up Skill", "skill", "skills", "'mecha combat', 'radio: basic'"),
  LOOKUP("lookup_class", "Look Up O.C.C.", "O.C.C. or character class", "classes", "'destroid pilot o.c.c.'"),
  LOOKUP("lookup_creature", "Look Up Creature", "creature or opponent", "creatures", "'zentraedi', 'invid'"),
  {
    name: "roll_skill_check",
    title: "Roll Skill Check",
    description: "Roll a percentile skill check: 1d100 against the skill percentage. Use when: the player attempts a skill. Do NOT use when: making an attack — use roll_attack; or when the skill rules are unknown — use lookup_skill. Mutation class: read-only — draws from the session's deterministic RNG; no persistence, no state change, no audit entry, and no badge change. Returns: the d100 total and the skill percentage, or [ERROR] [INVALID_INPUT] on malformed input.",
    kind: "roll",
    defaultDice: "1d100",
    inputSchema: { type: "object", properties: { skill: { type: "string", description: "Skill name (freeform)." }, modifier: { type: "number", description: "Skill percentage to roll under." } }, required: ["modifier"] },
  },
  {
    name: "roll_attack",
    title: "Roll Attack",
    description: "Roll a combat strike: 1d20 + P.P. bonus + W.P. bonus + level bonus. Use when: the player attacks with a weapon or mecha weapon. Do NOT use when: rolling damage only — use roll_dice; or when making a skill check — use roll_skill_check. Mutation class: read-only — draws from the session's deterministic RNG; no persistence, no state change, no audit entry, and no badge change. Returns: the d20 total (with optional damage dice) and modifier, or [ERROR] [INVALID_INPUT] on malformed input.",
    kind: "roll",
    inputSchema: { type: "object", properties: { modifier: { type: "number", description: "Total strike modifier (P.P. + W.P. + level)." }, dice: { type: "string", description: "Optional damage dice, e.g. '2d6'." } }, required: ["modifier"] },
  },
  {
    name: "roll_dice",
    title: "Roll Dice",
    description: "Roll dice in standard notation (NdM[+|-X], e.g. '1d20', '3d6+2'). Use when: making a roll no dedicated tool covers. Do NOT use when: making a skill check or attack — use roll_skill_check or roll_attack. Mutation class: read-only — draws from the session's deterministic RNG; no persistence, no state change, no audit entry, and no badge change. Returns: the total, per-die breakdown, and modifier, or [ERROR] [INVALID_INPUT] on malformed notation.",
    kind: "roll",
    inputSchema: { type: "object", properties: { dice: { type: "string", description: "Dice notation such as 1d20, 3d6, 4d6+2." } }, required: ["dice"] },
  },
  {
    name: "roll_on_table",
    title: "Roll on Table",
    description: "Look up or roll on an indexed Robotech table (hit location, insanity, experience levels, random generation). Use when: resolving a fixed reference value or a percentile/dice-mapped table. Do NOT use when: searching for a concept or mecha — use lookup_concept or lookup_mecha. Mutation class: read-only — draws from the session's deterministic RNG; no persistence, no state change, no audit entry, and no badge change. Returns: the table's rows (or a rolled row), or [ERROR] [NOT_FOUND] on an unknown table name.",
    kind: "table",
    collection: "tables",
    inputSchema: { type: "object", properties: { table: { type: "string", description: "Table name (e.g. 'random hit location', 'insanity')." } }, required: ["table"] },
  },
  {
    name: "core_mechanic",
    title: "Core Mechanic",
    description: "Return the Robotech core resolution mechanic (Palladium d20 combat, d100 skills, S.D.C./M.D.C. damage). Use when: a player asks how a check, strike, or damage roll resolves. Do NOT use when: rolling — use roll_skill_check, roll_attack, or roll_dice. Mutation class: read-only — returns rules text only; no state change, no audit entry, and no badge change. Returns: the core-mechanic text.",
    kind: "info",
    inputSchema: { type: "object", properties: {} },
  },
];

const PROMPTS = [
  {
    name: "robotech_intro",
    title: "Robotech — Introduction",
    text: "Welcome to Robotech, the Palladium Books role-playing game of mecha warfare across the three Robotech Wars. Roll a d20 for combat (strike, dodge, parry, initiative) and percentile dice for skills. Characters have eight attributes — I.Q., M.E., M.A., P.S., P.P., P.E., P.B., and Spd — rolled on 3d6. Choose an O.C.C. (Occupational Character Class) such as Veritech Fighter Pilot, Destroid Pilot, or Military Specialist, then select skills and equipment. Mecha and vehicles track Mega-Damage Capacity (M.D.C.); characters and personal armor track S.D.C. and Hit Points.",
  },
  {
    name: "robotech_session_zero",
    title: "Robotech — Session Zero",
    text: "Work with your Game Master to choose a war and era: the First Robotech War (Macross), the Second (Southern Cross), the Third (Invid Invasion), or the Pioneer/Sentinels expedition. Roll the eight attributes (3d6 each; a 16–18 grants one extra d6), determine Hit Points and S.D.C., pick an O.C.C., select skills, and choose a mecha or vehicle from the RDF/REF/ASC inventory. Agree on whether the campaign is military, resistance, or exploration.",
  },
];

function main() {
  const extract = readJson(opts.extract);
  if (!extract.index || !extract.model) throw new Error(`${opts.extract} is not a Discovery extract`);

  const index = extract.index;
  const model = extract.model;
  const tools = TOOLS;
  const resources = [];
  const prompts = PROMPTS;

  const packageFormat = readPackageFormat(GEN_FINGERPRINTS);
  const hostVersion = readHostVersion(path.join(DEPLOYED, "package.json"));
  const contentHash = computeContentHash(index, model, tools, resources, prompts);
  const counts = { ...extract.counts };

  const manifest = {
    slug: SLUG,
    name: NAME,
    host_version: hostVersion,
    content_hash: contentHash,
    built_at: new Date().toISOString(),
    counts,
    package_format: packageFormat,
  };

  const outDir = path.resolve(opts.out ?? (opts.install ? path.join(INSTALL_ROOT, SLUG) : path.join(CONTENT_ROOT, "build", "package")));

  console.log(`build-package — ${SLUG}`);
  console.log(`  extract:         ${opts.extract}`);
  console.log(`  output:          ${outDir}`);
  console.log(`  index entries:   ${index.length}`);
  console.log(`  tools:           ${tools.length}`);
  console.log(`  collections:     ${Object.entries(counts).filter(([k]) => k !== "anchor").map(([k, v]) => `${k}:${v}`).join(", ")}`);
  console.log(`  host_version:    ${hostVersion}`);
  console.log(`  package_format:  ${packageFormat}`);
  console.log(`  content_hash:    ${contentHash}`);

  if (opts.dryRun) { console.log("\nDry run — no files written."); return; }

  if (opts.install && opts.backup && fs.existsSync(outDir)) {
    const backup = path.join(path.dirname(INSTALL_ROOT), `rulesets-backup-${SLUG}-${Date.now()}`);
    fs.cpSync(outDir, backup, { recursive: true });
    console.log(`  backup:          ${backup}`);
  }

  fs.mkdirSync(outDir, { recursive: true });
  const files = {
    "manifest.json": manifest,
    "index.json": index,
    "model.json": model,
    "tools.json": tools,
    "resources.json": resources,
    "prompts.json": prompts,
  };
  for (const f of PACKAGE_FILES) fs.writeFileSync(path.join(outDir, f), JSON.stringify(files[f], null, 2) + "\n");
  console.log(`\nWrote ${PACKAGE_FILES.length} files to ${outDir}`);
}

try {
  main();
  process.exit(0);
} catch (e) {
  console.error(`build-package: ${e.message}`);
  process.exit(1);
}
